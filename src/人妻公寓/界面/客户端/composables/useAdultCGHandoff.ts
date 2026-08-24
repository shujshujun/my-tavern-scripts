/** 事件 CG 与普通成人 CG 的纯状态交接；不持久化，只服务当前客户端时间线。 */
export type CG信号阻塞 = '无' | '可恢复遮挡' | '硬隔离';
export type CG信号接收结果 = '立即处理' | '暂存' | '丢弃';

export interface CG信号交接<T extends { 楼层: number }> {
  待处理: T | null;
}

export function 创建CG信号交接<T extends { 楼层: number }>(): CG信号交接<T> {
  return { 待处理: null };
}

/** 可恢复事件图只遮挡画面，保存最新场景信号；医院/荣耀洞是语义硬隔离，全部作废。 */
export function 接收CG信号<T extends { 楼层: number }>(交接: CG信号交接<T>, 信号: T, 阻塞: CG信号阻塞): CG信号接收结果 {
  if (阻塞 === '硬隔离') {
    交接.待处理 = null;
    return '丢弃';
  }
  if (阻塞 === '可恢复遮挡') {
    交接.待处理 = 信号;
    return '暂存';
  }
  交接.待处理 = null;
  return '立即处理';
}

/** 事件序列完全关闭后消费一次；来源楼已被回档删除时静默作废。 */
export function 取出待处理CG信号<T extends { 楼层: number }>(
  交接: CG信号交接<T>,
  仍被遮挡: boolean,
  当前末楼: number,
): T | null {
  if (仍被遮挡) return null;
  const 信号 = 交接.待处理;
  交接.待处理 = null;
  return 信号 && 信号.楼层 <= 当前末楼 ? 信号 : null;
}

export function 清理越界CG信号<T extends { 楼层: number }>(交接: CG信号交接<T>, 当前末楼: number): void {
  if (交接.待处理 && 交接.待处理.楼层 > 当前末楼) 交接.待处理 = null;
}

export function 清空CG信号交接<T extends { 楼层: number }>(交接: CG信号交接<T>): void {
  交接.待处理 = null;
}
