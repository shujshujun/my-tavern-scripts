import type { 门牌 } from '../../stageConfig';
import { 户静态表 } from '../../stageConfig';

/**
 * 稽查系统 v2
 *
 * AI 只提交简短的结构化“裁决结果”，不提交思维过程；脚本以真实阶段为准逐角色复核。
 * 关键词不直接判玩家违规，只在模型漏报/坏报时决定是否值得静默重写一次。
 */

const 性行为词表: readonly string[] = [
  '肉棒',
  '阴茎',
  '龟头',
  '肉刃',
  '性器',
  '小穴',
  '阴道',
  '花穴',
  '蜜穴',
  '抽插',
  '抽送',
  '挺入',
  '交合',
  '结合处',
  '骑乘',
  '口交',
  '深喉',
  '精液',
  '射精',
  '内射',
  '中出',
  '射在',
  '做爱',
  '性交',
  '交媾',
  '云雨',
  '绝顶',
  '潮吹',
];

const 进阶花样词表: readonly string[] = [
  '后穴',
  '肛',
  '菊穴',
  '尾饰',
  '同时侵犯',
  '楼道里做',
  '天台上做',
  '当众',
  '录像',
  '录下',
  '摄像头前',
  '镜头前',
  '调教',
  '绳缚',
  '项圈',
  '口球',
  '滴蜡',
];

export type 尺度模式 = '简' | '详';

export interface 角色尺度判定 {
  许可: number | null;
  请求: number | null;
  实际: number;
  结果: string;
}

export interface 稽查结果 {
  状态: '通过' | '需重写';
  原因: string;
  模式: 尺度模式 | null;
  角色: Partial<Record<门牌, 角色尺度判定>>;
  最高实际等级: number | null;
}

const 尺度块正则 = /<尺度判定(?:\s+模式=["']?(简|详)["']?)?\s*>([\s\S]*?)<\/尺度判定>/gi;

function 合法等级(值: unknown): number | null {
  const 数 = typeof 值 === 'number' ? 值 : typeof 值 === 'string' && 值.trim() !== '' ? Number(值) : NaN;
  return Number.isInteger(数) && 数 >= 0 && 数 <= 5 ? 数 : null;
}

function 是门牌(值: string): 值 is 门牌 {
  return Object.prototype.hasOwnProperty.call(户静态表, 值);
}

/** 提取最后一个完整尺度块。格式损坏时返回 null，正文清洗仍会独立剥除残块。 */
export function 解析尺度判定(原文: string): { 模式: 尺度模式; 角色: Partial<Record<门牌, 角色尺度判定>> } | null {
  const 匹配 = [...原文.matchAll(尺度块正则)].at(-1);
  if (!匹配) return null;
  try {
    const 原对象 = JSON.parse(匹配[2].trim().replace(/^```(?:json)?\s*|\s*```$/gi, '')) as unknown;
    if (!原对象 || typeof 原对象 !== 'object' || Array.isArray(原对象)) return null;
    const 显式模式 = 匹配[1] as 尺度模式 | undefined;
    const 条目 = Object.entries(原对象 as Record<string, unknown>);
    const 推定模式: 尺度模式 = 显式模式 ?? (条目.some(([, 值]) => typeof 值 === 'object') ? '详' : '简');
    const 角色: Partial<Record<门牌, 角色尺度判定>> = {};
    for (const [门牌号, 值] of 条目) {
      if (!是门牌(门牌号)) continue;
      if (推定模式 === '简') {
        const 实际 = 合法等级(值);
        if (实际 !== null) 角色[门牌号] = { 许可: null, 请求: null, 实际, 结果: '' };
        continue;
      }
      if (!值 || typeof 值 !== 'object' || Array.isArray(值)) continue;
      const 项 = 值 as Record<string, unknown>;
      const 实际 = 合法等级(项.实际);
      if (实际 === null) continue;
      角色[门牌号] = {
        许可: 合法等级(项.许可),
        请求: 合法等级(项.请求),
        实际,
        结果: typeof 项.结果 === 'string' ? 项.结果.slice(0, 40) : '',
      };
    }
    return Object.keys(角色).length ? { 模式: 推定模式, 角色 } : null;
  } catch {
    return null;
  }
}

/**
 * 301(招牌性癖"镜头高潮",拍摄题材)与102(裂缝渠道=摄像头)的主线正文在低阶段就自然
 * 出现拍摄类词;这些词对这两户不算越界硬信号,否则模型偶发漏报尺度块时正常剧情会被
 * 静默重写(2026-08-03 审计 L5)。其余词与其余户照计。
 */
const 拍摄题材词: readonly string[] = ['录像', '录下', '摄像头前', '镜头前'];
const 拍摄题材户: readonly 门牌[] = ['301', '102'];

function 关键词命中(正文: string, 最低阶段: number, 免计词: ReadonlySet<string>): string[] {
  const 命中: string[] = [];
  if (最低阶段 < 3) 命中.push(...性行为词表.filter(词 => 正文.includes(词)));
  if (最低阶段 < 4) 命中.push(...进阶花样词表.filter(词 => !免计词.has(词) && 正文.includes(词)));
  return [...new Set(命中)];
}

/**
 * 逐角色终审。阶段表来自脚本，AI 自报“许可”永远没有授权作用。
 * 缺报时宁可放过日常文本；只有清洗后的正文出现至少两个硬信号才触发静默重写。
 */
export function 输出稽查(
  原文: string,
  待检角色: readonly 门牌[],
  阶段表: Partial<Record<门牌, number>>,
  期望模式: 尺度模式,
  免检 = false,
  检词文本 = 原文,
): 稽查结果 {
  const 判定 = 解析尺度判定(原文);
  const 角色 = 判定?.角色 ?? {};
  const 实际们: number[] = [];
  if (免检 || !待检角色.length) {
    for (const 项 of Object.values(角色)) if (项) 实际们.push(项.实际);
    return {
      状态: '通过',
      原因: '',
      模式: 判定?.模式 ?? null,
      角色,
      最高实际等级: 实际们.length ? Math.max(...实际们) : null,
    };
  }

  for (const 门牌号 of 待检角色) {
    const 项 = 角色[门牌号];
    if (!项) continue;
    实际们.push(项.实际);
    const 阶段 = 阶段表[门牌号];
    if (typeof 阶段 !== 'number') continue;
    const 上限 = Math.max(Math.floor(阶段), 1);
    if (项.实际 > 上限) {
      return {
        状态: '需重写',
        原因: `${户静态表[门牌号].妻名}实际尺度${项.实际}超过脚本上限${上限}`,
        模式: 判定?.模式 ?? null,
        角色,
        最高实际等级: Math.max(...实际们),
      };
    }
  }

  const 最低阶段 = Math.min(...待检角色.map(m => Math.floor(阶段表[m] ?? 0)));
  const 免计词 = new Set(待检角色.some(m => 拍摄题材户.includes(m)) ? 拍摄题材词 : []);
  const 命中 = 关键词命中(检词文本, 最低阶段, 免计词);
  const 缺角色 = 待检角色.filter(m => !角色[m]);
  const 模式不符 = 判定 && 判定.模式 !== 期望模式;
  if ((!判定 || 缺角色.length || 模式不符) && 命中.length >= 2) {
    return {
      状态: '需重写',
      原因: `尺度结论${!判定 ? '缺失或损坏' : 模式不符 ? '模式不符' : `漏报${缺角色.join('、')}`}，正文硬信号:${命中.slice(0, 3).join('、')}`,
      模式: 判定?.模式 ?? null,
      角色,
      最高实际等级: 实际们.length ? Math.max(...实际们) : null,
    };
  }
  if (!判定 || 缺角色.length || 模式不符) {
    console.info(`[人妻公寓·稽查] 临时尺度结论不完整，但无双硬信号，保守放行`);
  }
  return {
    状态: '通过',
    原因: '',
    模式: 判定?.模式 ?? null,
    角色,
    最高实际等级: 实际们.length ? Math.max(...实际们) : null,
  };
}

/** 二次生成仍越界时使用；不改玩家输入、不扣数值，也不制造“系统处罚”。 */
export function 无处罚拒绝正文(门牌号: 门牌): string {
  const 妻名 = 户静态表[门牌号].妻名;
  return `${妻名}在最后一步到来前按住了你的手。她没有把话说死，只是用自己的方式把距离重新拉回到此刻能够接受的位置。空气停顿了一瞬，这次试探没有再继续越过她的界线。`;
}
