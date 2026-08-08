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

export function 读配置(): 手机配置 {
  const 默认: 手机配置 = {
    ai来源: '自动',
    微信进展摘要: true,
    base: '',
    key: '',
    model: '',
    频率: '普通',
  };
  try {
    const root = (window.parent ?? window) as Window;
    const raw = root.localStorage?.getItem(配置KEY);
    if (raw) {
      const 旧 = JSON.parse(raw) as Partial<手机配置>;
      // 0.27 及以前只有独立 API 三件套；已有完整配置的玩家迁移后继续走自定义 API。
      const 迁移来源: 手机AI来源 = 旧.ai来源 ?? (旧.base && 旧.key && 旧.model ? '自定义' : '自动');
      return {
        ...默认,
        ...旧,
        ai来源: 迁移来源,
      };
    }
  } catch {
    /* 读取失败走默认 */
  }
  return 默认;
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
