import type { 门牌 } from '../../stageConfig';
import { 门牌列表 } from '../../stageConfig';
import { 每天时段数 } from './楼层时钟';

export type 微信联系保护表 = Partial<Record<门牌, number>>;

export interface 微信联系消息记录 {
  会话: string;
  发: string;
  时: number;
  类?: string;
}

const 妻私聊会话 = new Set<门牌>(门牌列表);

/**
 * 玩家在某个自然日成功写入妻子的一对一微信后，该日不计入冷落；保护边界固定为
 * 次日早晨的绝对时段。消息撤回仍算已经联系过，群聊、朋友圈和对方主动消息不算。
 */
export function 微信联系保护截止(消息绝对时段: number): number {
  if (!Number.isSafeInteger(消息绝对时段) || 消息绝对时段 < 0) return -1;
  return (Math.floor(消息绝对时段 / 每天时段数) + 1) * 每天时段数;
}

/**
 * 只从当前手机时间线已经存活的消息构造保护表。调用方应先完成楼层、分支与未来时段过滤；
 * 本层仍拒绝未来消息，避免损坏记录或旧异步回调提前保护尚未到来的日期。
 */
export function 构造微信联系保护表(
  消息们: readonly 微信联系消息记录[],
  当前绝对时段: number,
): 微信联系保护表 {
  if (!Number.isSafeInteger(当前绝对时段) || 当前绝对时段 < 0) return {};
  const 结果: 微信联系保护表 = {};
  for (const 消息 of 消息们) {
    if (消息.发 !== '我' || !妻私聊会话.has(消息.会话 as 门牌)) continue;
    if (!Number.isSafeInteger(消息.时) || 消息.时 < 0 || 消息.时 > 当前绝对时段) continue;
    const 门牌号 = 消息.会话 as 门牌;
    const 保护至 = 微信联系保护截止(消息.时);
    if (保护至 > (结果[门牌号] ?? -1)) 结果[门牌号] = 保护至;
  }
  return 结果;
}
