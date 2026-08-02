/**
 * 图片节点被移除后，旧请求的 load/error 仍可能迟到。同一 CG id 会在后续回合复用，
 * 因此只比 id 不足以确认事件属于当前请求，还必须同时核对单调递增的 epoch。
 */
export function CG加载事件属于当前请求(
  当前id: string | undefined,
  当前epoch: number,
  事件id: string | undefined,
  事件epoch: string | undefined,
): boolean {
  if (!当前id || !事件id || 事件id !== 当前id || !Number.isInteger(当前epoch)) return false;
  const 解析epoch = Number(事件epoch);
  return Number.isInteger(解析epoch) && 解析epoch === 当前epoch;
}
