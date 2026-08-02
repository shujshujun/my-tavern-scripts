import { 旧钟楼跨度转时段 } from './楼层时钟';

export interface 仅你可见节奏 {
  冷却时段: number;
  概率: number;
}

/** L4 保持稀有；L5 用更短冷却和更高抽取率体现主动归属。 */
export function 仅你可见触发参数(阶段: number): 仅你可见节奏 {
  if (阶段 >= 5) return { 冷却时段: 旧钟楼跨度转时段(16), 概率: 0.55 };
  if (阶段 >= 4) return { 冷却时段: 旧钟楼跨度转时段(28), 概率: 0.3 };
  return { 冷却时段: Number.POSITIVE_INFINITY, 概率: 0 };
}
