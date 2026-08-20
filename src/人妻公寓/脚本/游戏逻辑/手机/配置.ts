import { 户静态表, type 门牌 } from '../../../stageConfig';

/**
 * 手机配置（拆分方案 P2 / T5+T6）：localStorage 手机配置 + 世界书人设素材缓存。
 * 只持有持久化读写的实现与进程级缓存，不参与 AI 路由决策；AI 路由仍由内核负责。
 */

// ============================================
// 手机配置(localStorage:AI来源 + 独立API + 动态频率总闸)
// ============================================

export type 手机AI来源 = '自动' | '数据库' | '正文' | '自定义';

export interface 手机配置 {
  ai来源: 手机AI来源;
  微信进展摘要: boolean;
  base: string;
  key: string;
  model: string;
  频率: '勤' | '普通' | '静' | '关';
}

const 配置KEY = '人妻公寓_手机配置';
const 默认配置: 手机配置 = {
  ai来源: '自动',
  微信进展摘要: true,
  base: '',
  key: '',
  model: '',
  频率: '普通',
};
const 合法AI来源 = new Set<手机AI来源>(['自动', '数据库', '正文', '自定义']);
const 合法频率 = new Set<手机配置['频率']>(['勤', '普通', '静', '关']);

function 是配置对象(值: unknown): 值 is Record<string, unknown> {
  return typeof 值 === 'object' && 值 !== null && !Array.isArray(值);
}

function 配置字符串(值: unknown): string {
  return typeof 值 === 'string' ? 值.trim() : '';
}

function 规范手机配置(值: unknown): 手机配置 {
  const 原 = 是配置对象(值) ? 值 : {};
  const 旧 = {
    ai来源: 原.ai来源,
    微信进展摘要: 原.微信进展摘要,
    base: 配置字符串(原.base),
    key: 配置字符串(原.key),
    model: 配置字符串(原.model),
    频率: 原.频率,
  };
  // 0.27 及以前只有独立 API 三件套；已有完整配置的玩家迁移后继续走自定义 API。
  const 迁移来源候选 = 旧.ai来源 ?? (旧.base && 旧.key && 旧.model ? '自定义' : '自动');
  return {
    ai来源: 合法AI来源.has(迁移来源候选 as 手机AI来源)
      ? (迁移来源候选 as 手机AI来源)
      : 默认配置.ai来源,
    微信进展摘要:
      typeof 旧.微信进展摘要 === 'boolean' ? 旧.微信进展摘要 : 默认配置.微信进展摘要,
    base: 旧.base,
    key: 旧.key,
    model: 旧.model,
    频率: 合法频率.has(旧.频率 as 手机配置['频率']) ? (旧.频率 as 手机配置['频率']) : 默认配置.频率,
  };
}

export function 读配置(): 手机配置 {
  try {
    const root = (window.parent ?? window) as Window;
    const raw = root.localStorage?.getItem(配置KEY);
    if (raw) return 规范手机配置(JSON.parse(raw) as unknown);
  } catch {
    /* 读取失败走默认 */
  }
  return { ...默认配置 };
}

export function 存配置(c: 手机配置): void {
  try {
    ((window.parent ?? window) as Window).localStorage?.setItem(配置KEY, JSON.stringify(c));
  } catch {
    /* 存储失败静默 */
  }
}

// ── 世界书人设注入(2026-07-19 用户拍板:微信里她得"是她自己") ──
// 只给该妻自己的条目(数据隔离);外貌/穿衣段与微信无关,剥掉省token;
// 朋友圈刻意不接(公开流永远贤妻=设计);世界书游戏内静态,进程级缓存一次就够
const _人设缓存 = new Map<string, string>();

/** 从角色卡主世界书抽该妻人设YAML(剥外貌段+截长);拿不到返回空串,微信照旧不降级 */
async function 妻人设(m: 门牌): Promise<string> {
  const 妻名 = 户静态表[m]?.妻名;
  if (!妻名) return '';
  const 缓存 = _人设缓存.get(妻名);
  if (缓存 !== undefined) return 缓存;
  let 出 = '';
  try {
    const { primary } = getCharWorldbookNames('current');
    if (primary) {
      const 条目 = (await getWorldbook(primary)).find(e => e.enabled && e.name.includes(妻名));
      if (条目?.content) {
        出 = 条目.content
          // 剥外貌大段(顶格两空格缩进的段头到下一同级段头;YAML结构=角色卡格式约定)
          .replace(/^ {2}外貌特征:[\s\S]*?(?=^ {2}\S)/m, '')
          .trim();
        if (出.length > 3000) 出 = 出.slice(0, 3000) + '\n(人设节选)';
      }
    }
  } catch (e) {
    console.warn('[人妻公寓·手机] 读取世界书人设失败(微信照常,仅少人设):', e);
  }
  _人设缓存.set(妻名, 出);
  return 出;
}

/** 人设段包装:拼进微信prompt;人设=底色,当前状态数据永远是唯一权威 */
export async function 人设段(m: 门牌): Promise<string> {
  const 设 = await 妻人设(m);
  return 设 ? `\n她的人设(性格与说话方式的底色;她此刻的真实状态以状态数据为唯一权威):\n${设}\n` : '';
}
