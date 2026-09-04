import type { SchemaType } from '../../schema';
import {
  许曼君分居事件CG语义,
  许曼君分居房间背景语义,
  许曼君分居地点动作,
  执行许曼君分居地点动作,
  读取许曼君分居状态,
  type 许曼君分居动作ID,
  type 许曼君分居结果,
} from './许曼君分居系统';

/** 兼容适配层：权威阶段与写入只属于许曼君分居系统.ts。 */
export interface 许曼君分居地图上下文 {
  地点: string;
  当前绝对时段: number;
  当前楼层?: number;
}

export interface 许曼君分居地图动作 {
  id: string;
  地点: string;
  标题: string;
  可执行: boolean;
  禁用原因: string;
  动作: 许曼君分居动作ID;
  当前楼层?: number;
  需要AI剧情: boolean;
}

function 解包(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  return record.stat_data && typeof record.stat_data === 'object'
    ? record.stat_data as Record<string, unknown>
    : record;
}

export function 读取许曼君分居入口资格(data: unknown): { 满足: boolean; 原因: string } {
  const raw = 解包(data);
  const house = (raw?.户 as Record<string, unknown> | undefined)?.['201'] as Record<string, unknown> | undefined;
  const wife = house?.妻 as Record<string, unknown> | undefined;
  const system = raw?.系统 as Record<string, unknown> | undefined;
  const completed = Array.isArray(system?._已完成特殊场景) ? system._已完成特殊场景.map(String) : [];
  if (Number(wife?.当前阶段 ?? 0) < 5) return { 满足: false, 原因: '许曼君尚未达到L5' };
  if (String(wife?.阶段性癖 ?? '') !== '交易快感') return { 满足: false, 原因: '尚未完成“交易快感”' };
  if (!completed.includes('肉偿账本')) return { 满足: false, 原因: '尚未完成《肉偿账本》' };
  return { 满足: true, 原因: '' };
}

export function 构建许曼君分居地图上下文(
  data: unknown,
  overrides: Partial<许曼君分居地图上下文> = {},
): 许曼君分居地图上下文 {
  const raw = 解包(data);
  const system = raw?.系统 as Record<string, unknown> | undefined;
  const absolute = Number(system?._绝对时段 ?? 0);
  return {
    地点: overrides.地点 ?? '',
    当前绝对时段: overrides.当前绝对时段 ?? (Number.isFinite(absolute) ? Math.max(0, Math.floor(absolute)) : 0),
    当前楼层: overrides.当前楼层,
  };
}

function 需要人物剧情(id: 许曼君分居动作ID): boolean {
  return id.startsWith('开始') || id === '接受共同夜晚';
}

export function 读取许曼君分居地图动作(
  data: SchemaType,
  ctx: 许曼君分居地图上下文,
): 许曼君分居地图动作[] {
  return 许曼君分居地点动作(data, ctx.地点).map(item => ({
    id: item.id,
    地点: ctx.地点,
    标题: item.文案,
    可执行: true,
    禁用原因: '',
    动作: item.id,
    当前楼层: ctx.当前楼层,
    需要AI剧情: 需要人物剧情(item.id),
  }));
}

export function 提交许曼君分居地图动作(
  data: SchemaType,
  item: 许曼君分居地图动作,
): 许曼君分居结果 {
  return 执行许曼君分居地点动作(data, item.动作, item.地点, item.当前楼层 ?? -1);
}

export { 许曼君分居事件CG语义, 许曼君分居房间背景语义, 读取许曼君分居状态 };
