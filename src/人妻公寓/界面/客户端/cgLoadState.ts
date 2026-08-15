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

export interface CG加载槽位<T extends { id: string }> {
  项: T;
  epoch: number;
  加载中: boolean;
}

export function 创建CG加载槽位<T extends { id: string }>(项: T, epoch: number): CG加载槽位<T> {
  return { 项, epoch, 加载中: true };
}

/** 窄窗只挂载第一槽，确保第二张既不下载也不提前计入解锁。 */
export function 选择CG显示槽位<T extends { id: string }>(
  当前: readonly CG加载槽位<T>[],
  双列: boolean,
): readonly CG加载槽位<T>[] {
  return 双列 ? 当前 : 当前.slice(0, 1);
}

export function 完成CG槽位加载<T extends { id: string }>(
  当前: readonly CG加载槽位<T>[],
  事件id: string | undefined,
  事件epoch: string | undefined,
): { 槽位: CG加载槽位<T>[]; 已处理: boolean } {
  const 索引 = 当前.findIndex(槽 => CG加载事件属于当前请求(槽.项.id, 槽.epoch, 事件id, 事件epoch));
  if (索引 < 0) return { 槽位: [...当前], 已处理: false };
  const 槽位 = [...当前];
  槽位[索引] = { ...槽位[索引]!, 加载中: false };
  return { 槽位, 已处理: true };
}

/**
 * 只替换真正失败的那个槽位；另一张已经显示的图保持节点身份与加载状态不变。
 * 候选不足时删除失败槽，自动降级为单图；迟到的旧 epoch 不得认领新槽位。
 */
export function 替换失败CG槽位<T extends { id: string }>(
  当前: readonly CG加载槽位<T>[],
  事件id: string | undefined,
  事件epoch: string | undefined,
  候选: readonly T[],
  新epoch: number,
): { 槽位: CG加载槽位<T>[]; 已处理: boolean; 补位: T | null } {
  const 索引 = 当前.findIndex(槽 => CG加载事件属于当前请求(槽.项.id, 槽.epoch, 事件id, 事件epoch));
  if (索引 < 0) return { 槽位: [...当前], 已处理: false, 补位: null };

  const 保留id = new Set(当前.filter((_, i) => i !== 索引).map(槽 => 槽.项.id));
  const 补位 = 候选.find(项 => 项.id !== 事件id && !保留id.has(项.id)) ?? null;
  const 槽位 = [...当前];
  if (补位) 槽位[索引] = 创建CG加载槽位(补位, 新epoch);
  else 槽位.splice(索引, 1);
  return { 槽位, 已处理: true, 补位 };
}
