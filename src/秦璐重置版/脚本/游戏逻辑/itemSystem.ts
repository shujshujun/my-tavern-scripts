/**
 * 秦璐重置版 — 商店道具最小闭环
 *
 * 当前先落地玩家要求的「静滞怀表」：
 * - 购买与使用分离，复用 系统.货币 / 系统.道具状态
 * - 使用时快照苏文的状态、位置与两项疑心值
 * - 一经启用永久生效：每次变量结算都恢复快照，作息游标永久暂停
 * - 旧档中已经生效的限时怀表，会自动迁移为永久冻结
 */

import type { SchemaType } from '../../schema';

export const SUWEN_STASIS_ITEM = '静滞怀表' as const;
export const SUWEN_STASIS_PRICE = 1000;

export type ItemActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export type SuwenStasisSettlement = 'inactive' | 'held';

/** 把一次性道具事件排入下一轮提示词；去重，避免 ROLL/重复点击累积。 */
function queueItemEvent(data: SchemaType, eventText: string): void {
  const events = data.系统._待发送道具事件
    .split('|')
    .map(item => item.trim())
    .filter(Boolean);
  if (!events.includes(eventText)) events.push(eventText);
  data.系统._待发送道具事件 = events.join(' | ');
}

/** 当前是否已经启用永久静滞。 */
export function isSuwenStasisActive(data: SchemaType): boolean {
  return data.苏文状态.位置数值冻结.是否生效;
}

/** 将苏文恢复到怀表启用时保存的状态、位置和疑心值。 */
export function restoreSuwenStasisSnapshot(data: SchemaType): void {
  const freeze = data.苏文状态.位置数值冻结;
  data.苏文状态.当前状态 = freeze.冻结状态;
  data.苏文状态.当前位置 = freeze.冻结位置;
  data.苏文状态.对秦璐疑心值 = freeze.冻结对秦璐疑心值;
  data.苏文状态.对苏梦疑心值 = freeze.冻结对苏梦疑心值;
}

/** 购买静滞怀表。永久道具只能购买并启用一次。 */
export function purchaseSuwenStasisItem(data: SchemaType): ItemActionResult {
  const state = data.系统.道具状态[SUWEN_STASIS_ITEM] ?? '未购买';
  if (state === '使用中' || isSuwenStasisActive(data)) {
    return { ok: false, message: '静滞怀表已经永久生效，不能重复购买' };
  }
  if (state === '已购买') {
    return { ok: false, message: '静滞怀表已在背包中，可直接使用' };
  }
  if (data.系统.货币 < SUWEN_STASIS_PRICE) {
    return {
      ok: false,
      message: `货币不足：静滞怀表需要 ${SUWEN_STASIS_PRICE} 货币`,
    };
  }

  data.系统.货币 -= SUWEN_STASIS_PRICE;
  data.系统.道具状态[SUWEN_STASIS_ITEM] = '已购买';
  return {
    ok: true,
    message: `购买静滞怀表成功，已扣除 ${SUWEN_STASIS_PRICE} 货币`,
  };
}

/** 使用静滞怀表并记录苏文此刻的永久冻结锚点。 */
export function activateSuwenStasisItem(data: SchemaType, _currentFloor: number): ItemActionResult {
  const state = data.系统.道具状态[SUWEN_STASIS_ITEM] ?? '未购买';
  if (state === '使用中' || isSuwenStasisActive(data)) {
    return { ok: false, message: '静滞怀表已经永久生效' };
  }
  if (state !== '已购买') {
    return { ok: false, message: '请先购买静滞怀表' };
  }

  const suwen = data.苏文状态;
  suwen.位置数值冻结 = {
    是否生效: true,
    冻结状态: suwen.当前状态,
    冻结位置: suwen.当前位置,
    冻结对秦璐疑心值: suwen.对秦璐疑心值,
    冻结对苏梦疑心值: suwen.对苏梦疑心值,
  };
  data.系统.道具状态[SUWEN_STASIS_ITEM] = '使用中';
  queueItemEvent(
    data,
    `静滞怀表已永久启动：苏文被固定为${suwen.当前状态}@${suwen.当前位置}，位置、状态及两项疑心值永久冻结`,
  );

  return {
    ok: true,
    message: '静滞怀表已启动：苏文位置、状态与疑心值永久冻结',
  };
}

/**
 * 在变量结算阶段维持永久静滞效果。
 *
 * held：永久冻结仍有效，调用方必须停止作息推进。
 * inactive：尚未启用。
 *
 * currentFloor 参数保留用于兼容已经接入的调用点与旧测试，不参与永久效果计时。
 */
export function settleSuwenStasis(data: SchemaType, _currentFloor: number): SuwenStasisSettlement {
  if (!isSuwenStasisActive(data)) return 'inactive';

  // 无论 AI、旧变量命令或其它逻辑是否尝试修改，每次结算都恢复永久锚点。
  restoreSuwenStasisSnapshot(data);
  data.系统.道具状态[SUWEN_STASIS_ITEM] = '使用中';
  return 'held';
}
