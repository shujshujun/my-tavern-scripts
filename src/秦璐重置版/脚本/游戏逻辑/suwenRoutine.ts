/**
 * 苏文位置引擎 — 楼层驱动的黑盒生活节律
 *
 * 关键约束：
 * - 每轮先用 previewSuwenRoutine() 把“本轮将落地的位置”注入提示词，
 *   回复后的 advanceSuwenRoutine() 再写入同一计划，避免正文与状态栏错一拍。
 * - 普通推进前会校准“作息游标 ↔ 已保存状态/位置”，兼容旧档和异常写回，
 *   防止苏文上一轮仍在单位、下一轮却因游标失配直接出现在主卧。
 * - 只有明确的时间推进表达才触发次日跳转；对话中单纯提到“明天”不跳。
 * - 「静滞怀表」启用后永久暂停游标，固定状态、位置和两项疑心值。
 */

import type { SchemaType } from '../../schema';
import { isSuwenStasisActive, settleSuwenStasis } from './itemSystem';

export type SuwenStatusValue = '在家' | '外出' | '睡眠';
export type SuwenLocationValue = SchemaType['苏文状态']['当前位置'];
export type SuwenJumpMoment = '次日开场' | '次日早晨' | '次日晚间';

export interface SuwenPosition {
  状态: SuwenStatusValue;
  位置: SuwenLocationValue;
}

export interface SuwenRoutinePreview extends SuwenPosition {
  目标游标: number;
  是否推进: boolean;
  跳转类型: SuwenJumpMoment | null;
  转场说明: string;
}

interface RoutineSegment extends SuwenPosition {
  楼数: number;
}

const WORKDAY_ROUTINE: RoutineSegment[] = [
  { 状态: '在家', 位置: '主卧', 楼数: 2 }, // 起床洗漱
  { 状态: '外出', 位置: '外面', 楼数: 7 }, // 上班（安全期）
  { 状态: '在家', 位置: '餐厅', 楼数: 2 }, // 下班回家、晚饭
  { 状态: '在家', 位置: '客厅', 楼数: 3 }, // 看电视
  { 状态: '睡眠', 位置: '主卧', 楼数: 2 },
];

const HOME_DAY_ROUTINE: RoutineSegment[] = [
  { 状态: '睡眠', 位置: '主卧', 楼数: 2 },
  { 状态: '在家', 位置: '餐厅', 楼数: 2 },
  { 状态: '在家', 位置: '客厅', 楼数: 3 },
  { 状态: '在家', 位置: '厨房', 楼数: 2 },
  { 状态: '在家', 位置: '客厅', 楼数: 3 },
  { 状态: '睡眠', 位置: '主卧', 楼数: 3 },
];

const WEDNESDAY_ROUTINE: RoutineSegment[] = [
  { 状态: '在家', 位置: '主卧', 楼数: 2 },
  { 状态: '外出', 位置: '外面', 楼数: 5 },
  { 状态: '在家', 位置: '餐厅', 楼数: 2 },
  { 状态: '在家', 位置: '客厅', 楼数: 3 },
  { 状态: '在家', 位置: '客厅', 楼数: 2 },
  { 状态: '睡眠', 位置: '主卧', 楼数: 2 },
];

const FRIDAY_ROUTINE: RoutineSegment[] = [
  { 状态: '在家', 位置: '主卧', 楼数: 2 },
  { 状态: '在家', 位置: '餐厅', 楼数: 2 },
  { 状态: '在家', 位置: '客厅', 楼数: 3 },
  { 状态: '外出', 位置: '外面', 楼数: 5 },
  { 状态: '在家', 位置: '餐厅', 楼数: 2 },
  { 状态: '睡眠', 位置: '主卧', 楼数: 2 },
];

const WEEK_ROUTINES: RoutineSegment[][] = [
  WORKDAY_ROUTINE,
  WORKDAY_ROUTINE,
  WEDNESDAY_ROUTINE,
  WORKDAY_ROUTINE,
  FRIDAY_ROUTINE,
  HOME_DAY_ROUTINE,
  HOME_DAY_ROUTINE,
];

const dayFloorCount = (routine: RoutineSegment[]) => routine.reduce((sum, segment) => sum + segment.楼数, 0);
const WEEK_TOTAL_FLOORS = WEEK_ROUTINES.reduce((sum, routine) => sum + dayFloorCount(routine), 0);

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function locateCursor(cursor: number): {
  dayIndex: number;
  segmentIndex: number;
  segmentFloorOffset: number;
} {
  let remaining = positiveModulo(cursor, WEEK_TOTAL_FLOORS);
  for (let dayIndex = 0; dayIndex < WEEK_ROUTINES.length; dayIndex++) {
    const routine = WEEK_ROUTINES[dayIndex];
    const dayTotal = dayFloorCount(routine);
    if (remaining < dayTotal) {
      for (let segmentIndex = 0; segmentIndex < routine.length; segmentIndex++) {
        const segment = routine[segmentIndex];
        if (remaining < segment.楼数) {
          return { dayIndex, segmentIndex, segmentFloorOffset: remaining };
        }
        remaining -= segment.楼数;
      }
    }
    remaining -= dayTotal;
  }
  return { dayIndex: 0, segmentIndex: 0, segmentFloorOffset: 0 };
}

export function getSuwenPosition(cursor: number): SuwenPosition {
  const { dayIndex, segmentIndex } = locateCursor(cursor);
  const segment = WEEK_ROUTINES[dayIndex][segmentIndex];
  return { 状态: segment.状态, 位置: segment.位置 };
}

function samePosition(lhs: SuwenPosition, rhs: SuwenPosition): boolean {
  return lhs.状态 === rhs.状态 && lhs.位置 === rhs.位置;
}

/**
 * 从当前绝对游标附近寻找与已保存状态一致的模板点。
 * 这是旧档/异常写回自愈：先对齐再 +1，而不是拿失配游标强行推进。
 */
export function alignSuwenCursor(
  cursor: number,
  status: SuwenStatusValue,
  location: SuwenLocationValue,
): number {
  const expected: SuwenPosition = { 状态: status, 位置: location };
  if (samePosition(getSuwenPosition(cursor), expected)) return cursor;

  for (let distance = 1; distance <= WEEK_TOTAL_FLOORS; distance++) {
    const backward = cursor - distance;
    if (samePosition(getSuwenPosition(backward), expected)) return backward;
    const forward = cursor + distance;
    if (samePosition(getSuwenPosition(forward), expected)) return forward;
  }
  return cursor;
}

/**
 * 只识别“明确推进时间”的表达。
 * 反例：‘你明天还要工作吗？’只是对话，不应让作息立刻跳到次日。
 */
export function detectJumpMoment(playerInput: string): SuwenJumpMoment | null {
  const text = playerInput.trim();
  if (!text) return null;

  const actionMatch = text.match(
    /(?:睡到|等到|待到|跳到|快进到|推进到|来到|熬到|直到|时间(?:来)?到|转眼(?:来)?到(?:了)?)\s*(?:了)?\s*(?:明天|第二天|第二日|次日)(?:\s*(?:清晨|早上|早晨|上午|下午|傍晚|晚上|夜里))?/,
  );
  const narrativeMatch = text.match(
    /^(?:(?:时间来到|转眼到了?|到了?)\s*)?(?:第二天|第二日|次日)(?:\s*(?:清晨|早上|早晨|上午|下午|傍晚|晚上|夜里))?(?=$|[，,。.!！？\s])/,
  );
  const tomorrowTimedLead = text.match(
    /^明天\s*(?:清晨|早上|早晨|上午|下午|傍晚|晚上|夜里)(?=$|[，,。.!！？\s])/,
  );
  const tomorrowOnly = /^明天[。.!！]?$/u.test(text) ? text : '';
  const matchedText = actionMatch?.[0] ?? narrativeMatch?.[0] ?? tomorrowTimedLead?.[0] ?? tomorrowOnly;
  if (!matchedText) return null;

  if (/(?:下午|傍晚|晚上|夜里)/u.test(matchedText)) return '次日晚间';
  if (/(?:清晨|早上|早晨|上午)/u.test(matchedText)) return '次日早晨';
  return '次日开场';
}

function getNextDayStart(cursor: number): { cursor: number; dayIndex: number } {
  const relFloor = positiveModulo(cursor, WEEK_TOTAL_FLOORS);
  const weekStart = cursor - relFloor;
  const { dayIndex } = locateCursor(cursor);
  let nextDayCursor = weekStart;
  for (let day = 0; day <= dayIndex; day++) nextDayCursor += dayFloorCount(WEEK_ROUTINES[day]);
  return { cursor: nextDayCursor, dayIndex: (dayIndex + 1) % WEEK_ROUTINES.length };
}

function getEveningOffset(routine: RoutineSegment[]): number {
  let cursor = 0;
  let lastHomeOffset = 0;
  for (const segment of routine) {
    if (segment.状态 === '在家') lastHomeOffset = cursor;
    cursor += segment.楼数;
  }
  return lastHomeOffset;
}

/** 保留旧 API：返回明确时间跳转的目标游标；普通提及未来返回 null。 */
export function detectJump(playerInput: string, currentCursor: number): number | null {
  const moment = detectJumpMoment(playerInput);
  if (!moment) return null;

  const nextDay = getNextDayStart(currentCursor);
  if (moment === '次日晚间') {
    return nextDay.cursor + getEveningOffset(WEEK_ROUTINES[nextDay.dayIndex]);
  }
  return nextDay.cursor;
}

function buildTransitionNote(
  current: SuwenPosition,
  target: SuwenPosition,
  jumpMoment: SuwenJumpMoment | null,
): string {
  if (jumpMoment) {
    return `玩家明确推进到${jumpMoment}；正文需交代时间已经跳转，再按${target.状态}@${target.位置}演绎。`;
  }
  if (current.状态 === '外出' && target.状态 !== '外出') {
    return `苏文正从单位返家，本轮先演绎下班、进门并到达${target.位置}；禁止无过渡直接出现在主卧。`;
  }
  if (current.位置 !== target.位置) {
    return `苏文从${current.位置}移动到${target.位置}，正文需保留合理的室内动线。`;
  }
  return '';
}

function planSuwenRoutine(data: SchemaType, currentFloor: number, playerInput: string): SuwenRoutinePreview {
  const sys = data.系统;
  const current: SuwenPosition = {
    状态: data.苏文状态.当前状态,
    位置: data.苏文状态.当前位置,
  };

  if (isSuwenStasisActive(data)) {
    const freeze = data.苏文状态.位置数值冻结;
    return {
      状态: freeze.冻结状态,
      位置: freeze.冻结位置,
      目标游标: sys._苏文作息游标,
      是否推进: false,
      跳转类型: null,
      转场说明: `静滞怀表已永久生效：苏文保持${freeze.冻结状态}@${freeze.冻结位置}，位置、状态与疑心值永远不得变化。`,
    };
  }

  if (currentFloor === sys._上次处理楼层) {
    return {
      ...current,
      目标游标: sys._苏文作息游标,
      是否推进: false,
      跳转类型: null,
      转场说明: '',
    };
  }

  const jumpMoment = detectJumpMoment(playerInput);
  let baseCursor = sys._苏文作息游标;
  let targetCursor: number;
  if (jumpMoment) {
    targetCursor = detectJump(playerInput, baseCursor) ?? baseCursor + 1;
  } else {
    baseCursor = alignSuwenCursor(baseCursor, current.状态, current.位置);
    targetCursor = baseCursor + 1;
  }

  let target = getSuwenPosition(targetCursor);

  // 终极兜底：非明确时间跳转绝不能从单位直达主卧。
  // 正常模板会先到餐厅；只有旧档游标严重失配时才会进入此分支。
  if (!jumpMoment && current.状态 === '外出' && target.位置 === '主卧') {
    target = { 状态: '在家', 位置: '客厅' };
  }

  return {
    ...target,
    目标游标: targetCursor,
    是否推进: true,
    跳转类型: jumpMoment,
    转场说明: buildTransitionNote(current, target, jumpMoment),
  };
}

/** 在生成提示词前预览本轮最终位置，不修改变量。 */
export function previewSuwenRoutine(
  data: SchemaType,
  currentFloor: number,
  playerInput: string,
): SuwenRoutinePreview {
  return planSuwenRoutine(data, currentFloor, playerInput);
}

export function isSuwenLocationAccelerationRoom(location: string): boolean {
  return location === '餐厅' || location === '客厅' || location === '主卧';
}

export function isSuwenInAccelerationRoom(cursor: number): boolean {
  return isSuwenLocationAccelerationRoom(getSuwenPosition(cursor).位置);
}

export function isSuwenHome(cursor: number): boolean {
  return getSuwenPosition(cursor).状态 === '在家';
}

/** 回复后的唯一写入口；其结果应与同楼 previewSuwenRoutine() 一致。 */
export function advanceSuwenRoutine(data: SchemaType, currentFloor: number, playerInput: string): void {
  const sys = data.系统;
  const stasisSettlement = settleSuwenStasis(data, currentFloor);
  if (stasisSettlement !== 'inactive') {
    // 永久静滞下每一楼都写回同一锚点，作息游标不再推进。
    sys._上次处理楼层 = currentFloor;
    const freeze = data.苏文状态.位置数值冻结;
    console.info(`[苏文作息] 永久静滞：${freeze.冻结状态}@${freeze.冻结位置}，位置与两项疑心值保持不变`);
    return;
  }

  const oldCursor = sys._苏文作息游标;
  const plan = planSuwenRoutine(data, currentFloor, playerInput);
  sys._苏文作息游标 = plan.目标游标;
  sys._上次处理楼层 = currentFloor;
  data.苏文状态.当前状态 = plan.状态;
  data.苏文状态.当前位置 = plan.位置;

  if (plan.是否推进 && !plan.跳转类型) {
    const alignedBase = plan.目标游标 - 1;
    if (alignedBase !== oldCursor) {
      console.info(`[苏文作息] 旧档游标自愈：${oldCursor} → ${alignedBase}`);
    }
  }
  console.info(
    `[苏文作息] 游标=${sys._苏文作息游标} → 苏文${plan.状态}@${plan.位置}` +
      (isSuwenLocationAccelerationRoom(plan.位置) ? ' [加速房]' : '') +
      (plan.跳转类型 ? ` [${plan.跳转类型}]` : ''),
  );
}
