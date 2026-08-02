import type { 门牌 } from '../../stageConfig';

export interface 私聊图片消息记录 {
  楼?: unknown;
  会话?: unknown;
  发?: unknown;
  图?: unknown;
}

export type 已发私聊图缓存 = Partial<Record<门牌, string[]>>;

export interface 私聊图片轮换项 {
  id: string;
  门牌: 门牌;
  path: string;
}

export type 私聊图库地址索引 = ReadonlyMap<string, { id: string; 门牌: 门牌 }>;

export function 建私聊图库地址索引(图库: readonly 私聊图片轮换项[]): 私聊图库地址索引 {
  return new Map(图库.map(项 => [`@adult/${项.path}`, { id: 项.id, 门牌: 项.门牌 }] as const));
}

/**
 * 从当前时间线仍存活的图片消息重建“本轮已看”缓存。
 *
 * 图片轮换看完整池后会从任意旧图开始下一轮，因此同一 ID 再次出现就是换轮边界；
 * 仅给现有缓存项补楼层无法跨越这条边界还原，消息序列才是完整事件日志。
 */
export function 重建已发私聊图(
  消息: readonly 私聊图片消息记录[],
  截止楼: number,
  私聊图库按地址: 私聊图库地址索引,
): 已发私聊图缓存 {
  const 结果: 已发私聊图缓存 = {};
  for (const 条 of 消息) {
    const 楼 = Number(条.楼 ?? -1);
    if (!Number.isFinite(楼) || 楼 > 截止楼 || 条.发 !== '对方' || typeof 条.图 !== 'string') continue;
    const 图项 = 私聊图库按地址.get(条.图);
    if (!图项 || 条.会话 !== 图项.门牌) continue;

    const 本轮 = 结果[图项.门牌] ?? [];
    结果[图项.门牌] = 本轮.includes(图项.id) ? [图项.id] : [...本轮, 图项.id];
  }
  return 结果;
}
