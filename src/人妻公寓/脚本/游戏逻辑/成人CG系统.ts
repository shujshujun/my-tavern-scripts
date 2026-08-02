import 清单原始 from '../../成人CG清单.json';
import type { 门牌 } from '../../stageConfig';
import type { CG亲密上下文 } from './CG亲密上下文';

export { 构造CG亲密上下文 } from './CG亲密上下文';
export type { CG亲密上下文, CG亲密状态 } from './CG亲密上下文';

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
  亲密?: CG亲密上下文;
}

const 清单 = (清单原始 as { items: 成人CG项[] }).items;

const 高潮结果词 = /高潮|绝顶|射精|内射|中出|射在|精液/;
const 事后反应词 = /事后|余韵|瘫软|结束后|清理|擦拭/;
const 进行中词 =
  /做爱|性交|交合|抽插|抽送|挺入|进入她|阴道插入|肛门插入|插入(?:她|小屄|小穴|阴道|后穴|屁穴)|骑乘|口交|深喉|乳交|后入|肛交|阴茎|肉棒/;
const 前戏动作词 =
  /亲吻|吻她|吻他|吻上|接吻|吻住|拥吻|舌吻|爱抚|抚摸|揉捏|脱下|脱掉|解开|掀起|撩起|裸露|全裸|展示|张开双腿|自慰|手指|玩具|束缚/;
const 否定阶段事实 =
  /(?:明确)?(?:拒绝|不愿|不肯)(?:继续|接受|进行|让你|被你|与你)?(?:亲吻|接吻|拥吻|舌吻|爱抚|抚摸|做爱|性交|交合|插入|抽插|骑乘|口交|深喉|乳交|肛交|高潮|绝顶|射精|内射|中出)(?:[、/或和](?:亲吻|接吻|拥吻|舌吻|爱抚|抚摸|做爱|性交|交合|插入|抽插|骑乘|口交|深喉|乳交|肛交|高潮|绝顶|射精|内射|中出))*|(?:没有|并未|并没有|未曾|不曾|尚未)(?:真正|实际|达到|发生|出现|进行|继续)?(?:亲吻|接吻|拥吻|舌吻|爱抚|抚摸|做爱|性交|交合|插入|抽插|骑乘|口交|深喉|乳交|肛交|高潮|绝顶|射精|内射|中出)(?:[、/或和](?:亲吻|接吻|拥吻|舌吻|爱抚|抚摸|做爱|性交|交合|插入|抽插|骑乘|口交|深喉|乳交|肛交|高潮|绝顶|射精|内射|中出))*/g;
const 正戏事件词 = /【(?:转折正戏|药物首夜|性癖开幕)/;

function 哈希(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function 判定文本阶段(文本: string): CG阶段 | null {
  const 已发生文本 = 文本.replace(否定阶段事实, '');
  if (高潮结果词.test(已发生文本)) return 'climax_after';
  if (事后反应词.test(已发生文本) && 进行中词.test(已发生文本)) return 'climax_after';
  if (进行中词.test(已发生文本)) return 'active';
  if (前戏动作词.test(已发生文本)) return 'foreplay';
  return null;
}

function 是中止类结束(亲密?: CG亲密上下文): boolean {
  return Boolean(亲密?.状态 === '已结束' && (亲密.结束方式 === '角色中止' || 亲密.结束方式 === '突然离场'));
}

export function 判定CG阶段(信号: CG回合信号): CG阶段 | null {
  if (!信号.门牌) return null;
  const 亲密 = 信号.亲密;
  const 是场内 = Boolean(亲密 && 亲密.状态 !== '空闲');
  if (是中止类结束(亲密)) return null;
  if (亲密?.状态 === '已结束') return 'climax_after';

  const 角色阶段 = 信号.角色阶段 ?? 0;
  const 最低阶段 = (候选: CG阶段): number => (候选 === 'foreplay' ? 2 : 3);
  const 可采用 = (候选: CG阶段 | null): CG阶段 | null =>
    候选 && (是场内 || 角色阶段 >= 最低阶段(候选)) ? 候选 : null;

  // 正文描述的是已经发生的事实，可独立作为关键词回退；玩家输入只代表意图，必须已有
  // 尺度/场景证据才采用，避免“玩家要求插入、角色实际拒绝”也错误出图。
  const 正文阶段 = 可采用(判定文本阶段(信号.正文));
  if (正文阶段 === 'climax_after') return 正文阶段;

  // 资源系统已经确认进入亲密场景时，场景真值高于局部措辞。进行中偶尔写到亲吻、
  // “无插入”或对话，不应把正在进行的 CG 降回前戏或清掉。
  if (亲密?.状态 === '进行中' || 亲密?.状态 === '收尾中') return 'active';
  if (正文阶段) return 正文阶段;
  const 等级 = 信号.行为等级 ?? 0;
  const 行动候选 = 判定文本阶段(信号.行动);
  const 行动阶段 = 行动候选 && (是场内 || 等级 >= 最低阶段(行动候选)) ? 可采用(行动候选) : null;
  if (行动阶段) return 行动阶段;

  // 三路并联：结构化尺度、正文关键词、脚本正戏事件任一路都能触发。
  if (等级 >= 3 && 角色阶段 >= 3) return 'active';
  if (等级 >= 2 && 角色阶段 >= 2) return 'foreplay';
  if (正戏事件词.test(信号.事件)) return 'foreplay';
  return null;
}

export function 判定CG部位(文本: string, 亲密?: CG亲密上下文): CG部位 | null {
  const 最终位置 = 亲密?.最终位置 ?? '';
  if (/脸部|体外/.test(最终位置)) return 'other';
  if (/小嘴|口中/.test(最终位置)) return 'mouth';
  if (/胸部|胸前/.test(最终位置)) return 'breast';
  if (/小屄|阴道内/.test(最终位置)) return 'vaginal';
  if (/后穴|肛内/.test(最终位置)) return 'anal';

  const 合并文本 = `${文本}\n${亲密?.当前行为 ?? ''}\n${亲密?.当前接触部位 ?? ''}`;
  if (/肛|后穴|屁穴|菊穴/.test(合并文本)) return 'anal';
  if (/口交|深喉|嘴|小嘴|口中|吞吐/.test(合并文本)) return 'mouth';
  if (/乳交|胸|胸部|乳房|乳头|双乳/.test(合并文本)) return 'breast';
  if (/阴道|小穴|小屄|花穴|蜜穴|内射|骑乘|后入/.test(合并文本)) return 'vaginal';
  return null;
}

/** 场内未命中新图时保留当前 CG；结束楼也保留新选出的事后图到下一次场外回合。 */
export function 应保留成人CG(信号: CG回合信号): boolean {
  return Boolean(信号.亲密 && 信号.亲密.状态 !== '空闲' && !是中止类结束(信号.亲密));
}

export function 角色CG总数(门牌号: 门牌): number {
  return 清单.filter(item => item.door === 门牌号).length;
}

export function 角色CG列表(门牌号: 门牌): readonly 成人CG项[] {
  return 清单.filter(item => item.door === 门牌号);
}

export function 选择成人CG(
  信号: CG回合信号,
  已播放: ReadonlySet<string>,
  不可用: ReadonlySet<string> = new Set(),
): 成人CG项 | null {
  const phase = 判定CG阶段(信号);
  if (!phase || !信号.门牌) return null;
  const 文本 = `${信号.行动}\n${信号.正文}`;
  const 部位 = 判定CG部位(文本, 信号.亲密);
  let 池 = 清单.filter(item => item.door === 信号.门牌 && item.phase === phase && !不可用.has(item.id));
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
