/**
 * 苏文位置引擎 — Git 0.40 楼层作息的连续性补丁。
 *
 * 保留 0.40 的完整黑盒作息模板，只修正三件事：
 * 1. 提示词预演与回复后写回共用同一个计划；
 * 2. 普通对白中的“明天”不再被误判为时间跳转，旧档游标失配先按已保存位置自愈；
 * 3. 静滞怀表启用后，位置、状态、作息游标与两项疑心值永久固定。
 */

import type { SchemaType } from '../../schema';
import { isSuwenStasisActive, restoreSuwenStasisSnapshot } from './suwenStasis';

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

/** 工作日模板（周一、周二、周四）。 */
const WORKDAY_ROUTINE: RoutineSegment[] = [
  { 状态: '在家', 位置: '主卧', 楼数: 2 },
  { 状态: '外出', 位置: '外面', 楼数: 7 },
  { 状态: '在家', 位置: '餐厅', 楼数: 2 },
  { 状态: '在家', 位置: '客厅', 楼数: 3 },
  { 状态: '睡眠', 位置: '主卧', 楼数: 2 },
];

/** 周末在家模板。 */
const HOME_DAY_ROUTINE: RoutineSegment[] = [
  { 状态: '睡眠', 位置: '主卧', 楼数: 2 },
  { 状态: '在家', 位置: '餐厅', 楼数: 2 },
  { 状态: '在家', 位置: '客厅', 楼数: 3 },
  { 状态: '在家', 位置: '厨房', 楼数: 2 },
  { 状态: '在家', 位置: '客厅', 楼数: 3 },
  { 状态: '睡眠', 位置: '主卧', 楼数: 3 },
];

/** 周三：上午外出，下午在家。 */
const WEDNESDAY_ROUTINE: RoutineSegment[] = [
  { 状态: '在家', 位置: '主卧', 楼数: 2 },
  { 状态: '外出', 位置: '外面', 楼数: 5 },
  { 状态: '在家', 位置: '餐厅', 楼数: 2 },
  { 状态: '在家', 位置: '客厅', 楼数: 3 },
  { 状态: '在家', 位置: '客厅', 楼数: 2 },
  { 状态: '睡眠', 位置: '主卧', 楼数: 2 },
];

/** 周五：上午在家，下午外出。 */
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
      let segmentRemaining = remaining;
      for (let segmentIndex = 0; segmentIndex < routine.length; segmentIndex++) {
        const segment = routine[segmentIndex];
        if (segmentRemaining < segment.楼数) {
          return { dayIndex, segmentIndex, segmentFloorOffset: segmentRemaining };
        }
        segmentRemaining -= segment.楼数;
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
 * 旧档/异常写回自愈：若游标算出的地点与状态栏真值不符，先在一周模板内寻找最近的匹配点。
 * 这样“状态栏仍在单位、游标却落在主卧”的档不会用错误游标继续推进。
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
 * 只识别玩家明确要求推进时间的表达。
 * “你明天还要工作吗”“明天记得回来”只是对白，不再触发整天跳转。
 */
export function detectJumpMoment(playerInput: string): SuwenJumpMoment | null {
  const text = playerInput.trim();
  if (!text) return null;

  const actionMatch = text.match(
    /(?:睡到|等到|待到|跳到|快进到|推进到|来到|熬到|直到|时间(?:来)?到|转眼(?:来)?到(?:了)?)\s*(?:了)?\s*(?:明天|第二天|第二日|次日)(?:\s*(?:清晨|早上|早晨|上午|下午|傍晚|晚上|夜里))?/u,
  );
  const narrativeMatch = text.match(
    /^(?:(?:时间来到|转眼到了?|到了?)\s*)?(?:第二天|第二日|次日)(?:\s*(?:清晨|早上|早晨|上午|下午|傍晚|晚上|夜里))?(?=$|[，,。.!！？\s])/u,
  );
  // “明天早上你还要工作吗”仍是对白；只有整句本身就是时间指令时才把“明天”认作跳转。
  const tomorrowOnly = /^明天(?:\s*(?:清晨|早上|早晨|上午|下午|傍晚|晚上|夜里))?[。.!！]?$/u.test(text)
    ? text
    : '';
  const matchedText = actionMatch?.[0] ?? narrativeMatch?.[0] ?? tomorrowOnly;
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

/** 保留 0.40 既有 API；无明确时间推进时返回 null。 */
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
    return `玩家明确推进到${jumpMoment}；正文先交代时间已经跳转，再按苏文${target.状态}@${target.位置}演绎。`;
  }
  if (current.状态 === '外出' && target.状态 !== '外出') {
    return `苏文正从单位返家；正文必须先写下班、回程与进门，再让他到达${target.位置}，不得无过渡直接出现在主卧。`;
  }
  if (current.状态 !== target.状态 || current.位置 !== target.位置) {
    return `苏文本轮从${current.状态}@${current.位置}自然移动到${target.状态}@${target.位置}，正文保留合理转场。`;
  }
  return '';
}

function planSuwenRoutine(
  data: SchemaType,
  currentFloor: number,
  playerInput: string,
  isReroll: boolean,
): SuwenRoutinePreview {
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
      目标游标: freeze.冻结作息游标 >= 0 ? freeze.冻结作息游标 : sys._苏文作息游标,
      是否推进: false,
      跳转类型: null,
      转场说明: `静滞怀表已永久生效：苏文保持${freeze.冻结状态}@${freeze.冻结位置}，状态、位置、作息与两项疑心值都不得变化。`,
    };
  }

  // 打断余波期间 0.40 的设计是苏文滞留现场、游标暂停。
  if (sys._打断余波至楼层 >= 0 && currentFloor <= sys._打断余波至楼层) {
    return {
      状态: '在家',
      位置: current.位置,
      目标游标: sys._苏文作息游标,
      是否推进: false,
      跳转类型: null,
      转场说明: '',
    };
  }

  if (isReroll || currentFloor === sys._上次处理楼层) {
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
  // 终极防线：普通推进绝不允许“单位 → 主卧”直切。正常模板本来会先到餐厅；
  // 只有严重损坏的旧档才可能来到这里，因此同时把游标校准到客厅匹配点。
  if (!jumpMoment && current.状态 === '外出' && target.位置 === '主卧') {
    target = { 状态: '在家', 位置: '客厅' };
    targetCursor = alignSuwenCursor(targetCursor, target.状态, target.位置);
  }

  return {
    ...target,
    目标游标: targetCursor,
    是否推进: true,
    跳转类型: jumpMoment,
    转场说明: buildTransitionNote(current, target, jumpMoment),
  };
}

/** 在生成提示词前预演本轮最终位置；纯计算，不改变量。 */
export function previewSuwenRoutine(
  data: SchemaType,
  currentFloor: number,
  playerInput: string,
  isReroll = false,
): SuwenRoutinePreview {
  return planSuwenRoutine(data, currentFloor, playerInput, isReroll);
}

/** 兼容 0.40 的旧调用签名。 */
export function previewSuwenPosition(
  data: SchemaType,
  promptFloor: number,
  playerInput: string,
  isReroll: boolean,
): SuwenPosition {
  const plan = previewSuwenRoutine(data, promptFloor, playerInput, isReroll);
  return { 状态: plan.状态, 位置: plan.位置 };
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

/** 回复后的唯一作息写入口；同一楼结果与 previewSuwenRoutine 完全一致。 */
export function advanceSuwenRoutine(data: SchemaType, currentFloor: number, playerInput: string): void {
  const sys = data.系统;
  if (restoreSuwenStasisSnapshot(data)) {
    sys._上次处理楼层 = currentFloor;
    const freeze = data.苏文状态.位置数值冻结;
    console.info(
      `[苏文作息] 永久静滞：${freeze.冻结状态}@${freeze.冻结位置}，游标=${freeze.冻结作息游标}，两项疑心值保持不变`,
    );
    return;
  }

  const oldCursor = sys._苏文作息游标;
  const plan = planSuwenRoutine(data, currentFloor, playerInput, false);
  sys._苏文作息游标 = plan.目标游标;
  if (plan.是否推进) sys._上次处理楼层 = currentFloor;
  data.苏文状态.当前状态 = plan.状态;
  data.苏文状态.当前位置 = plan.位置;

  if (plan.是否推进 && !plan.跳转类型) {
    const alignedBase = plan.目标游标 - 1;
    if (alignedBase !== oldCursor) console.info(`[苏文作息] 旧档游标自愈：${oldCursor} → ${alignedBase}`);
  } else if (!plan.是否推进 && currentFloor === sys._上次处理楼层) {
    console.info(`[苏文作息] 楼层 ${currentFloor} 已处理，跳过重复推进`);
  }

  console.info(
    `[苏文作息] 游标=${sys._苏文作息游标} → 苏文${plan.状态}@${plan.位置}` +
      (isSuwenLocationAccelerationRoom(plan.位置) ? ' [加速房]' : '') +
      (plan.跳转类型 ? ` [${plan.跳转类型}]` : ''),
  );
}
