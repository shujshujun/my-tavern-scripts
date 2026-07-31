import 清单原始 from '../../成人CG清单.json';
import type { 门牌 } from '../../stageConfig';

export type CG阶段 = 'foreplay' | 'active' | 'climax_after';
export type CG部位 = 'mouth' | 'breast' | 'vaginal' | 'anal' | 'other';

export interface 成人CG项 {
  id: string;
  door: 门牌;
  role: string;
  phase: CG阶段;
  bodyPart: CG部位;
  foreplaySubtype: string;
  path: string;
  width: number;
  height: number;
}

export interface CG回合信号 {
  门牌: 门牌 | null;
  角色阶段: number | null;
  行为等级: number | null;
  正文: string;
  行动: string;
  事件: string;
  楼层: number;
}

const 清单 = (清单原始 as { items: 成人CG项[] }).items;

const 高潮事后词 = /高潮|绝顶|射精|内射|中出|射在|精液|事后|余韵|瘫软|结束后|清理|擦拭/;
const 进行中词 = /做爱|性交|交合|抽插|抽送|挺入|进入|插入|骑乘|口交|深喉|乳交|后入|肛交|阴茎|肉棒/;
const 前戏动作词 =
  /亲吻|接吻|吻住|拥吻|舌吻|爱抚|抚摸|揉捏|脱下|脱掉|解开|掀起|撩起|裸露|全裸|展示|张开双腿|自慰|手指|玩具|束缚/;

function 哈希(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function 判定文本阶段(文本: string, 等级: number): CG阶段 | null {
  if (等级 >= 3 && 高潮事后词.test(文本)) return 'climax_after';
  if (等级 >= 3 && 进行中词.test(文本)) return 'active';
  if (等级 >= 2 && 前戏动作词.test(文本)) return 'foreplay';
  return null;
}

/**
 * 行为等级只作为上限证据，必须同时有实际动作证据；普通招呼不会因等级误报而出CG。
 *
 * 玩家行动优先于 AI 正文：模型有时会把“亲吻她”一口气续写到高潮。旧逻辑把行动、正文和
 * 整场事件说明揉在一起，再优先检查高潮词，导致这种长回复永远只播放高潮图。现在先按玩家
 * 本轮明确发起的动作定阶段；行动没有阶段线索时，才用正文判断。事件说明只负责提示剧情，
 * 其中可能包含整场弧线和未来高潮，不能作为“本轮已经发生”的 CG 证据。
 */
export function 判定CG阶段(信号: CG回合信号): CG阶段 | null {
  if (!信号.门牌 || (信号.角色阶段 ?? 0) < 3) return null;
  const 等级 = 信号.行为等级 ?? 0;
  return 判定文本阶段(信号.行动, 等级) ?? 判定文本阶段(信号.正文, 等级);
}

export function 判定CG部位(文本: string): CG部位 | null {
  if (/肛|后穴|屁穴|菊穴/.test(文本)) return 'anal';
  if (/口交|深喉|嘴|口中|吞吐/.test(文本)) return 'mouth';
  if (/乳交|胸|乳房|乳头|双乳/.test(文本)) return 'breast';
  if (/阴道|小穴|小屄|花穴|蜜穴|内射|骑乘|后入/.test(文本)) return 'vaginal';
  return null;
}

export function 角色CG总数(门牌号: 门牌): number {
  return 清单.filter(item => item.door === 门牌号).length;
}

export function 角色CG列表(门牌号: 门牌): readonly 成人CG项[] {
  return 清单.filter(item => item.door === 门牌号);
}

export function 选择成人CG(信号: CG回合信号, 已播放: ReadonlySet<string>): 成人CG项 | null {
  const phase = 判定CG阶段(信号);
  if (!phase || !信号.门牌) return null;
  const 文本 = `${信号.行动}\n${信号.正文}`;
  const 部位 = 判定CG部位(文本);
  let 池 = 清单.filter(item => item.door === 信号.门牌 && item.phase === phase);
  if (部位) {
    const 精确池 = 池.filter(item => item.bodyPart === 部位);
    if (精确池.length) 池 = 精确池;
  }
  if (!池.length) return null;
  const 未播放 = 池.filter(item => !已播放.has(item.id));
  const 候选 = 未播放.length ? 未播放 : 池;
  return 候选[哈希(`${信号.门牌}:${phase}:${部位 ?? 'any'}:${信号.楼层}`) % 候选.length] ?? null;
}

export function CG条目(id: string): 成人CG项 | null {
  return 清单.find(item => item.id === id) ?? null;
}
