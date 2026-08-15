import type { 卷轴条 } from './types';

export interface 楼层范围 {
  起楼: number;
  末楼: number;
}

/** 正文热路径只读取固定数量的最近楼层；完整往事由史册按页向前补。 */
export const 卷轴每页楼数 = 60;

export function 末页楼层范围(末楼: number, 每页 = 卷轴每页楼数): 楼层范围 {
  const 安全末楼 = Math.max(0, Math.floor(Number.isFinite(末楼) ? 末楼 : 0));
  const 安全页量 = Math.max(1, Math.floor(Number.isFinite(每页) ? 每页 : 卷轴每页楼数));
  return { 起楼: Math.max(0, 安全末楼 - 安全页量 + 1), 末楼: 安全末楼 };
}

export function 更早楼层范围(当前起楼: number, 每页 = 卷轴每页楼数): 楼层范围 | null {
  const 安全起楼 = Math.max(0, Math.floor(Number.isFinite(当前起楼) ? 当前起楼 : 0));
  if (安全起楼 === 0) return null;
  const 安全页量 = Math.max(1, Math.floor(Number.isFinite(每页) ? 每页 : 卷轴每页楼数));
  const 末楼 = 安全起楼 - 1;
  return { 起楼: Math.max(0, 末楼 - 安全页量 + 1), 末楼 };
}

export function 卷轴条稳定键(条: 卷轴条): string {
  if (条.事件id) return `event:${条.事件id}`;
  if (条.楼 !== undefined) return `floor:${条.楼}`;
  return `fallback:${条._排序 ?? 0}:${条.谁}:${条.文本.join('\n')}`;
}

/** 向前加载时只合并显示条目，不修改或删除酒馆消息、隔离事件日志与 MVU 数据。 */
export function 合并卷轴页(已有: readonly 卷轴条[], 新页: readonly 卷轴条[]): 卷轴条[] {
  const 按键 = new Map<string, 卷轴条>();
  for (const 条 of [...已有, ...新页]) 按键.set(卷轴条稳定键(条), 条);
  return [...按键.values()].sort((a, b) => (a._排序 ?? 0) - (b._排序 ?? 0));
}
