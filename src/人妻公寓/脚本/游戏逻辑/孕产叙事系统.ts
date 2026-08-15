import type { SchemaType } from '../../schema';
import { 户静态表, 阶段标题, type 门牌 } from '../../stageConfig';
import { 风闻阈值 } from './风闻系统';

export type 有效胎次 = 1 | 2 | 3;
export type 孕产事件类型 = '报孕' | '姐妹群报孕' | '预产' | '生产' | '母婴合照' | '住院';

export interface 孕产角色数据 {
  门牌: 门牌;
  姓名: string;
  性格: string;
  群内互动方式: string;
  当前阶段: number;
  阶段名称: string;
  好感值: number;
  堕落值: number;
  婚姻值: number;
  当前情绪: string;
  当前心理: string;
  当前怀孕: boolean;
  当前胎次: number;
  已生胎数: number;
  当前孕情可公开: boolean;
}

export interface 孕产事件数据 {
  事件类型: 孕产事件类型;
  母亲: 孕产角色数据;
  胎次: 有效胎次;
  已生胎数: number;
  受孕场次标识: string;
  家庭计划知情: boolean;
}

export interface 报孕生成资料 extends 孕产事件数据 {
  版本: 1;
  风险: {
    风闻值: number;
    达到盯防: boolean;
    丈夫姓名: string;
    丈夫疑心值: number;
    丈夫信任值: number;
  };
}

const 报孕资料前缀 = '@pregnancy-report-data-v1:';

function 已生胎数(data: SchemaType, 门牌号: 门牌): number {
  return Math.min(3, data.系统._家庭文档.孩子.filter(孩子 => 孩子.母亲门牌 === 门牌号).length);
}

function 当前确在孕期(data: SchemaType, 门牌号: 门牌): boolean {
  const 怀孕 = data.户[门牌号]?.妻._怀孕;
  return !!怀孕 && 怀孕.状态 !== '未孕';
}

export function 当前叙事胎次(data: SchemaType, 门牌号: 门牌): 有效胎次 {
  const 账面胎次 = Math.floor(Number(data.户[门牌号]?.妻._生产.本胎序号) || 0);
  if (账面胎次 >= 1 && 账面胎次 <= 3) return 账面胎次 as 有效胎次;
  return Math.min(3, Math.max(1, 已生胎数(data, 门牌号) + 1)) as 有效胎次;
}

/**
 * 孕产演绎统一只消费这份角色数据。这里不写反应方向和角色台词，避免程序先替 AI
 * 把“头胎震惊、二胎责任、三胎疲惫”等演法固定下来。
 */
export function 构建孕产角色数据(
  data: SchemaType,
  门牌号: 门牌,
  当前孕情可公开: boolean,
): 孕产角色数据 {
  const 节点 = data.户[门牌号];
  const 配置 = 户静态表[门牌号];
  const 妻 = 节点?.妻;
  const 当前怀孕 = 当前确在孕期(data, 门牌号);
  return {
    门牌: 门牌号,
    姓名: 配置.妻名,
    性格: 配置.初始?.气质描述 ?? '',
    群内互动方式: 配置.雌竞 ?? '',
    当前阶段: 妻?.当前阶段 ?? 0,
    阶段名称: 阶段标题(妻?.当前阶段 ?? 0, 门牌号),
    好感值: 妻?.好感值 ?? 0,
    堕落值: 妻?.堕落值 ?? 0,
    婚姻值: 妻?.婚姻值 ?? 100,
    当前情绪: 妻?.当前情绪 ?? '',
    当前心理: 妻?.当前心理想法 ?? '',
    当前怀孕,
    当前胎次: 当前怀孕 ? 当前叙事胎次(data, 门牌号) : 0,
    已生胎数: 已生胎数(data, 门牌号),
    当前孕情可公开: 当前怀孕 && 当前孕情可公开,
  };
}

export function 构建孕产事件数据(
  data: SchemaType,
  母亲: 门牌,
  事件类型: 孕产事件类型,
): 孕产事件数据 {
  const 胎次 = 当前叙事胎次(data, 母亲);
  return {
    事件类型,
    母亲: 构建孕产角色数据(data, 母亲, true),
    胎次,
    已生胎数: 已生胎数(data, 母亲),
    受孕场次标识: data.户[母亲]?.妻._怀孕.受孕场次标识 ?? '',
    家庭计划知情: data.户[母亲]?.妻._生产.家庭计划知情 === true,
  };
}

/** 到期瞬间冻结事实数据；字段名沿用旧账，不把这段 JSON 直接展示给玩家。 */
export function 冻结报孕生成资料(data: SchemaType, 门牌号: 门牌): string {
  const 节点 = data.户[门牌号];
  if (!节点) return '';
  const 资料: 报孕生成资料 = {
    版本: 1,
    ...构建孕产事件数据(data, 门牌号, '报孕'),
    风险: {
      风闻值: data.风闻,
      达到盯防: data.风闻 >= 风闻阈值.盯防,
      丈夫姓名: 户静态表[门牌号].夫名 || '',
      丈夫疑心值: 节点.夫.疑心值,
      丈夫信任值: 节点.夫.信任值,
    },
  };
  return `${报孕资料前缀}${JSON.stringify(资料)}`;
}

/** 旧存档中的真实文案返回 null，仍走兼容投递；损坏资料不会泄露进可见气泡。 */
export function 解析报孕生成资料(原文: string): 报孕生成资料 | null {
  if (!原文.startsWith(报孕资料前缀)) return null;
  try {
    const 资料 = JSON.parse(原文.slice(报孕资料前缀.length)) as Partial<报孕生成资料>;
    if (
      资料.版本 !== 1 ||
      资料.事件类型 !== '报孕' ||
      !资料.母亲 ||
      typeof 资料.母亲.姓名 !== 'string' ||
      ![1, 2, 3].includes(Number(资料.胎次)) ||
      !资料.风险 ||
      typeof 资料.风险.风闻值 !== 'number'
    )
      return null;
    return 资料 as 报孕生成资料;
  } catch {
    return null;
  }
}

export function 是结构化报孕资料(原文: string): boolean {
  return 原文.startsWith(报孕资料前缀);
}
