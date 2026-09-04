import type { SchemaType } from '../../schema';
import type { 门牌 } from '../../stageConfig';

/** 普通场次创建与路线资源预检使用同一个目标，保持各角色既有差异。 */
export function 普通场次满意目标(data: SchemaType, 门牌号: 门牌): number {
  const 阶段 = data.户[门牌号]?.妻.当前阶段 ?? 3;
  const 基础 = 阶段 >= 5 ? 5 : 阶段 === 4 ? 4 : 3;
  const 修正: Partial<Record<门牌, number>> = { '101': -1, '202': -1, '301': 1 };
  return Math.min(6, Math.max(2, 基础 + (修正[门牌号] ?? 0)));
}
