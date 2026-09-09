/**
 * 苏文永久静滞道具。
 *
 * 与 0.40 的完整商店/状态栏架构解耦：这里只负责购买、启用与恢复锚点，
 * 网店入口仍由 shopSystem + ShopPanel 承载，苏文作息仍由 suwenRoutine 承载。
 */

import type { SchemaType } from '../../schema';

export const SUWEN_STASIS_ITEM = '静滞怀表' as const;
export const SUWEN_STASIS_PRICE = 1000;

function queuePermanentStasisEvent(data: SchemaType, text: string): void {
  const events = String(data.系统._待发送道具事件 ?? '')
    .split('|')
    .map(event => event.trim())
    .filter(Boolean);
  if (!events.includes(text)) events.push(text);
  data.系统._待发送道具事件 = events.join('|');
}

/** 兼容旧候选档：只要冻结锚点已经生效，就按永久道具处理。 */
export function isSuwenStasisActive(data: SchemaType): boolean {
  return data.苏文状态.位置数值冻结.是否生效 === true;
}

/**
 * 恢复苏文启用怀表时保存的状态、位置、两项疑心值与作息游标。
 * 返回 false 表示尚未启用；返回 true 表示已恢复永久锚点。
 */
export function restoreSuwenStasisSnapshot(data: SchemaType): boolean {
  const freeze = data.苏文状态.位置数值冻结;
  if (!freeze.是否生效) return false;

  // 旧候选档可能没有“冻结作息游标”；首次见到时用当前游标补齐，不猜测其它时间点。
  if (freeze.冻结作息游标 < 0) freeze.冻结作息游标 = data.系统._苏文作息游标;

  data.苏文状态.当前状态 = freeze.冻结状态;
  data.苏文状态.当前位置 = freeze.冻结位置;
  data.苏文状态.对秦璐疑心值 = freeze.冻结对秦璐疑心值;
  data.苏文状态.对苏梦疑心值 = freeze.冻结对苏梦疑心值;
  data.系统._苏文作息游标 = freeze.冻结作息游标;
  data.系统.道具状态[SUWEN_STASIS_ITEM] = '使用中';
  return true;
}

/** 购买后放入背包；购买与永久启用分开，避免误触。 */
export function purchaseSuwenStasisItem(data: SchemaType): string | null {
  if (data.系统._坏结局) return '结局已锁定';
  const state = data.系统.道具状态[SUWEN_STASIS_ITEM] ?? '未购买';
  if (state === '使用中' || isSuwenStasisActive(data)) {
    return '静滞怀表已经永久生效，不能重复购买';
  }
  if (state === '已购买') return '静滞怀表已在背包中，可直接使用';
  if (data.系统.货币 < SUWEN_STASIS_PRICE) return '货币不足';

  data.系统.货币 -= SUWEN_STASIS_PRICE;
  data.系统.道具状态[SUWEN_STASIS_ITEM] = '已购买';
  console.info(`[网店] 购买「${SUWEN_STASIS_ITEM}」-${SUWEN_STASIS_PRICE}（余${data.系统.货币}）`);
  return null;
}

/** 使用一次后永久生效，不存在持续楼数、到期或再次购买。 */
export function activateSuwenStasisItem(data: SchemaType, currentFloor: number): string | null {
  if (data.系统._坏结局) return '结局已锁定';
  const state = data.系统.道具状态[SUWEN_STASIS_ITEM] ?? '未购买';
  if (state === '使用中' || isSuwenStasisActive(data)) return '静滞怀表已经永久生效';
  if (state !== '已购买') return '请先购买静滞怀表';

  const suwen = data.苏文状态;
  suwen.位置数值冻结 = {
    是否生效: true,
    冻结状态: suwen.当前状态,
    冻结位置: suwen.当前位置,
    冻结对秦璐疑心值: suwen.对秦璐疑心值,
    冻结对苏梦疑心值: suwen.对苏梦疑心值,
    冻结作息游标: data.系统._苏文作息游标,
    启用楼层: currentFloor,
  };
  data.系统.道具状态[SUWEN_STASIS_ITEM] = '使用中';
  queuePermanentStasisEvent(
    data,
    `静滞怀表已永久启动：苏文固定为${suwen.当前状态}@${suwen.当前位置}，位置、状态、作息与两项疑心值从此不再变化`,
  );
  console.info(
    `[苏文静滞] 永久锚定 ${suwen.当前状态}@${suwen.当前位置}，疑心 秦${suwen.对秦璐疑心值}/梦${suwen.对苏梦疑心值}`,
  );
  return null;
}
