import { 当前天数, 当前时段 } from './楼层时钟';

function 规范记录时段(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

/** 历史记录没有发布时段时保持稳定，不用当前世界时间伪造。 */
export function 手机记录时间字(绝对时段: unknown): string {
  const 时 = 规范记录时段(绝对时段);
  return 时 === null ? '时间未知' : `第${当前天数(时)}天 ${当前时段(时)}`;
}

/** 时间分组同时认正文锚楼与发布时段；时间按钮不加楼也能分组。 */
export function 手机消息时间组键(楼: unknown, 绝对时段: unknown): string {
  const 楼键 = typeof 楼 === 'number' && Number.isFinite(楼) ? String(Math.floor(楼)) : '未知楼';
  const 时 = 规范记录时段(绝对时段);
  return `${楼键}|${时 === null ? '时间未知' : 时}`;
}
