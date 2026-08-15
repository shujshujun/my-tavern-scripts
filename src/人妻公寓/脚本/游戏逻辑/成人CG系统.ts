import 清单原始 from '../../成人CG清单.json';
import type { 门牌 } from '../../stageConfig';
import type { CG亲密上下文 } from './CG亲密上下文';

export { 构造CG亲密上下文 } from './CG亲密上下文';
export type { CG亲密上下文, CG亲密状态 } from './CG亲密上下文';

/** 五阶段运行模式：开场(无男方接触) → 普通接触 → 深度前戏 → 进行中(进入前后穴) → 事后。 */
export type CG阶段 =
  | 'intro_no_contact'
  | 'light_contact'
  | 'deep_foreplay'
  | 'active'
  | 'aftermath';
/** 图库分线：普通与怀孕两条线各自独立，绝不跨线回退。 */
export type CG变体 = 'normal' | 'pregnancy';
export type CG动作 =
  | 'body_display'
  | 'invitation_or_waiting'
  | 'self_undressing'
  | 'other_no_contact'
  | 'hand_contact'
  | 'embrace'
  | 'caress_or_breast_touch'
  | 'genital_or_anal_caress'
  | 'finger_mouth_contact'
  | 'kissing_or_nipple_licking'
  | 'oral'
  | 'paizuri'
  | 'handjob'
  | 'masturbation'
  | 'noninsertive_toy'
  | 'bondage_or_toy_prep'
  | 'penis_near_or_rubbing'
  | 'cunnilingus'
  | 'nipple_clamp_or_breast_toy'
  | 'external_vaginal_toy'
  | 'external_anal_toy'
  | 'penis_near_mouth'
  | 'nipple_and_vulva_clamps'
  | 'analingus'
  | 'finger_vaginal'
  | 'finger_anal'
  | 'other_foreplay'
  | 'penis_vaginal'
  | 'penis_anal'
  | 'toy_vaginal'
  | 'toy_anal'
  | 'mouth_or_face'
  | 'chest_or_body'
  | 'vaginal_leak'
  | 'anal_leak'
  | 'bed_or_nearby'
  | 'face_and_body'
  | 'other_or_unspecified';

export interface 成人CG项 {
  id: string;
  door: 门牌;
  role: string;
  path: string;
  width: number;
  height: number;
  variant: CG变体;
  stage: CG阶段;
  action: CG动作;
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
  /** 本轮目标图库；由发射方按角色真实孕态给出。 */
  variant?: CG变体;
}

const 清单 = (清单原始 as { items: 成人CG项[] }).items;

/** 进行中只认“阴茎或道具真正进入前后穴”，口交/乳交/手交/手指等一律算深度前戏。 */
const 进行中词 =
  /(?:插入(?:她|小屄|小穴|阴道|后穴|屁穴|菊穴)|(?:承受|配合|继续).*(?:插入|抽插)|抽插|抽送|挺入|肛交|后入|骑乘|进入她|深深(?:进入|顶入)|(?:阴茎|肉棒).*(?:进入|插入|顶入))/;
const 深度前戏词 =
  /(?:口交|深喉|吞吐|乳交|手交|打飞机|撸动|自慰|手淫|束缚|捆绑|绳子|手铐|皮带|玩具|振动棒|按摩棒|跳蛋|手指(?:插入|进入|抠弄)|抠弄.*(?:小屄|阴道|后穴|屁穴)|舔阴|舔弄|舔肛|龟头|抵近|磨蹭|含住|阴茎.*(?:嘴|脸)|乳沟|夹.*(?:阴茎|肉棒))/;
const 普通接触词 =
  /(?:牵手|握手|手拉手|十指相扣|拥抱|搂住|环抱|搂进怀里|依偎|亲吻|接吻|拥吻|舌吻|爱抚|抚摸|揉捏|揉胸|隔着.*揉|亲昵)/;
const 开场词 =
  /(?:脱下|脱掉|解开|掀起|撩起|裸露|赤裸|全裸|展示身体|身体展示|张开双腿|岔开腿|邀请|示意.*(?:过来|过去|靠近)|露出.*(?:胸|乳|腿)|衣扣|裙摆)/;
const 阶段行为词 =
  '(?:牵手|握手|拥抱|亲吻|接吻|拥吻|舌吻|爱抚|抚摸|揉胸|做爱|性交|交合|插入|抽插|骑乘|口交|深喉|乳交|手交|肛交|舔阴|舔肛|手指插入|自慰|使用玩具|玩具|高潮|绝顶|射精|内射|中出|脱衣|脱下衣服|脱掉衣服|裸露身体|展示身体|张开双腿)';
const 否定阶段事实 = new RegExp(
  `(?:明确)?(?:拒绝|不愿意|不愿|不肯|不接受|不同意)(?:(?:再|继续|接受|进行|让你|被你|与你|你|去|真的|真正|实际))*${阶段行为词}(?:[、/或和]${阶段行为词})*|(?:没有|并未|并没有|未曾|不曾|尚未)(?:(?:真正|真的|实际|达到|发生|出现|进行|继续))*${阶段行为词}(?:[、/或和]${阶段行为词})*`,
  'g',
);
const 正戏事件词 = /【(?:转折正戏|药物首夜|性癖开幕)/;

function 哈希(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** 结构化场景真值优先于文本：当前行为/接触部位直接决定进行中与深度前戏。 */
function 判定行为阶段(亲密?: CG亲密上下文): { 阶段: CG阶段; 动作: CG动作 | null } | null {
  if (!亲密) return null;
  const 行为 = 亲密.当前行为;
  const 部位 = 亲密.当前接触部位;
  if (行为 === '阴道插入') return { 阶段: 'active', 动作: 'penis_vaginal' };
  if (行为 === '肛门插入') return { 阶段: 'active', 动作: 'penis_anal' };
  if (行为 === '玩具') {
    if (部位 === '小屄') return { 阶段: 'active', 动作: 'toy_vaginal' };
    if (部位 === '屁穴') return { 阶段: 'active', 动作: 'toy_anal' };
    return { 阶段: 'deep_foreplay', 动作: 'noninsertive_toy' };
  }
  if (行为 === '口交') return { 阶段: 'deep_foreplay', 动作: 'oral' };
  if (行为 === '乳交') return { 阶段: 'deep_foreplay', 动作: 'paizuri' };
  return null;
}

/** 事后图只由结构化的成功结束结果触发；中止、离场、停下收尾与安全套内一律不显示。 */
function 是成功结束(亲密?: CG亲密上下文): boolean {
  if (!亲密 || 亲密.状态 !== '已结束') return false;
  const 方式 = 亲密.结束方式;
  if (方式 !== '主动收尾' && 方式 !== '体力耗尽' && 方式 !== '脚本收尾') return false;
  const 最终位置 = 亲密.最终位置.trim();
  if (!最终位置 || 最终位置 === '安全套内' || 最终位置 === '停下并收尾') return false;
  // 正常结束只证明场景已经收束；还必须有真实射精位置，才能进入“精液可见”的事后图库。
  return /脸部|小嘴|口中|胸部|胸前|小屄|阴道内|后穴|肛内|体内|体外|附近|床|地面|枕/.test(最终位置);
}

function 判定文本阶段(文本: string): CG阶段 | null {
  const 已发生文本 = 去除否定阶段事实(文本);
  // 手指/手指插入一律深度前戏，绝不能被“插入”误判为进行中。
  if (/手指.*(?:插入|进入|抠弄|探入)|(?:插入|进入).*手指/.test(已发生文本)) return 'deep_foreplay';
  if (进行中词.test(已发生文本)) return 'active';
  if (深度前戏词.test(已发生文本)) return 'deep_foreplay';
  if (普通接触词.test(已发生文本)) return 'light_contact';
  if (开场词.test(已发生文本)) return 'intro_no_contact';
  return null;
}

/** 文本只是叙述证据；先移除明确拒绝或未发生的行为，再供阶段与动作共同判定。 */
function 去除否定阶段事实(文本: string): string {
  return 文本.replace(否定阶段事实, '');
}

/** 场外文本必须已有尺度证据；场内由结构化场景真值兜底，不卡等级。 */
function 等级达标(候选: CG阶段, 角色阶段: number | null, 行为等级: number | null): boolean {
  const 最低 = 候选 === 'active' ? 3 : 候选 === 'deep_foreplay' ? 2 : 1;
  return (角色阶段 ?? 0) >= 最低 && (行为等级 ?? 0) >= 最低;
}

export function 判定CG阶段(信号: CG回合信号): CG阶段 | null {
  if (!信号.门牌) return null;
  const 亲密 = 信号.亲密;
  // 已结束只认结构化成功收尾（主动收尾/体力耗尽/脚本收尾且最终位置能证明射精）；
  // 角色中止、突然离场、停下并收尾、安全套内一律不显示任何 CG。
  if (亲密?.状态 === '已结束') return 是成功结束(亲密) ? 'aftermath' : null;
  // 首楼开场优先显示一次：从空闲进入进行中的首个成功楼。
  if (亲密?.本楼开始) return 'intro_no_contact';
  const 结构化 = 判定行为阶段(亲密);
  if (结构化) return 结构化.阶段;
  const 是场内 = Boolean(亲密 && 亲密.状态 !== '空闲');
  const 可采用 = (候选: CG阶段 | null): CG阶段 | null =>
    候选 && (是场内 || 等级达标(候选, 信号.角色阶段, 信号.行为等级)) ? 候选 : null;
  const 正文阶段 = 可采用(判定文本阶段(信号.正文));
  if (正文阶段) return 正文阶段;
  // 玩家行动只是请求。即使已经身处亲密场景，也只有本楼实际尺度达到该层级时，
  // 才允许把行动文本当有限兜底，避免把正文拒绝的新动作当成已经发生。
  const 行动候选 = 判定文本阶段(信号.行动);
  const 行动阶段 =
    行动候选 && 等级达标(行动候选, 信号.角色阶段, 信号.行为等级) ? 行动候选 : null;
  if (行动阶段) return 行动阶段;
  if (正戏事件词.test(信号.事件) && (是场内 || 等级达标('intro_no_contact', 信号.角色阶段, 信号.行为等级))) {
    return 'intro_no_contact';
  }
  return null;
}

function 判定文本动作(阶段: CG阶段, 文本: string): CG动作 | null {
  const 已发生文本 = 去除否定阶段事实(文本);
  if (阶段 === 'intro_no_contact') {
    if (/展示身体|身体展示|裸露|赤裸|全裸|展示.*(?:胸|乳|体)|露出.*(?:胸|乳|腿)/.test(已发生文本)) return 'body_display';
    if (/脱下|脱掉|解开|掀起|撩起|脱衣/.test(已发生文本)) return 'self_undressing';
    if (/邀请|等待|躺在床上|躺好|张开双腿|岔开腿|示意.*过来|招手/.test(已发生文本)) return 'invitation_or_waiting';
    return 'other_no_contact';
  }
  if (阶段 === 'light_contact') {
    if (/牵手|握手|手拉手|十指相扣/.test(已发生文本)) return 'hand_contact';
    if (/拥抱|搂住|环抱|搂进怀里|依偎/.test(已发生文本)) return 'embrace';
    if (/揉胸|揉捏|抚摸.*(?:胸|乳)|爱抚.*(?:胸|乳)|胸部.*(?:揉|摸)|隔着.*(?:胸|乳)/.test(已发生文本)) return 'caress_or_breast_touch';
    if (/(?:爱抚|抚摸|揉弄|隔着.*摸)(?:下体|外阴|小屄|阴部|屁穴|后穴|菊穴|阴蒂)/.test(已发生文本)) return 'genital_or_anal_caress';
    if (/手指.*(?:嘴|口)|含住.*手指|吮.*手指/.test(已发生文本)) return 'finger_mouth_contact';
    if (/亲吻|接吻|拥吻|舌吻|舔.*(?:乳头|乳尖|胸)/.test(已发生文本)) return 'kissing_or_nipple_licking';
    return null;
  }
  if (阶段 === 'deep_foreplay') {
    if (/口交|深喉|吞吐|含住.*(?:阴茎|肉棒)|嘴里.*(?:阴茎|肉棒)|吸吮.*(?:阴茎|肉棒)/.test(已发生文本)) return 'oral';
    if (/乳交|夹.*(?:阴茎|肉棒).*(?:乳|胸)|(?:乳|胸).*夹.*(?:阴茎|肉棒)/.test(已发生文本)) return 'paizuri';
    if (/手交|打飞机|用手.*(?:阴茎|肉棒)|撸动/.test(已发生文本)) return 'handjob';
    if (/手指.*(?:插入|进入).*(?:小屄|阴道|小穴|前穴)|抠弄.*(?:小屄|阴道)/.test(已发生文本)) return 'finger_vaginal';
    if (/手指.*(?:插入|进入).*(?:后穴|屁穴|菊穴)|抠弄.*(?:后穴|屁穴)/.test(已发生文本)) return 'finger_anal';
    if (/舔阴|舔弄.*(?:小屄|阴部)|舔.*(?:小屄|阴部)/.test(已发生文本)) return 'cunnilingus';
    if (/舔肛|舔弄.*(?:后穴|屁穴)|舔.*(?:后穴|屁穴)/.test(已发生文本)) return 'analingus';
    if (/乳头.*外阴.*夹|外阴.*夹|阴蒂夹|乳头夹.*阴蒂/.test(已发生文本)) return 'nipple_and_vulva_clamps';
    if (/乳头夹|乳夹|夹.*乳头|乳房.*(?:器具|夹)/.test(已发生文本)) return 'nipple_clamp_or_breast_toy';
    if (/外部.*(?:下体|小屄).*玩具|玩具.*(?:抵住|贴着|摩擦).*(?:下体|小屄)|阴蒂.*玩具/.test(已发生文本)) return 'external_vaginal_toy';
    if (/外部.*后穴.*玩具|玩具.*(?:抵住|贴着|摩擦).*(?:后穴|屁穴)|肛.*玩具/.test(已发生文本)) return 'external_anal_toy';
    if (/阴茎.*(?:嘴边|嘴角|唇边|脸前)|抵近.*嘴|肉棒.*(?:嘴|脸)/.test(已发生文本)) return 'penis_near_mouth';
    if (/抵近|磨蹭|摩擦.*(?:小屄|阴部|屁穴|后穴)|(?:阴茎|肉棒).*(?:抵|蹭|磨|贴)/.test(已发生文本)) return 'penis_near_or_rubbing';
    if (/束缚|捆绑|绑住|绑起|绳子|手铐|皮带/.test(已发生文本)) return 'bondage_or_toy_prep';
    if (/自慰|手淫|自己.*(?:抚摸|揉|爱抚)|抚弄自己|抠弄自己/.test(已发生文本)) return 'masturbation';
    if (/玩具|振动棒|按摩棒|跳蛋/.test(已发生文本)) return 'noninsertive_toy';
    return 'other_foreplay';
  }
  return null;
}

/** 事后动作按最终位置映射；不读正文里的“高潮、事后、清理”等弱词。 */
function 判定事后动作(亲密?: CG亲密上下文): CG动作 {
  const 最终位置 = 亲密?.最终位置 ?? '';
  if (/脸部和胸部|脸.*胸|胸.*脸/.test(最终位置)) return 'face_and_body';
  if (/其他体外位置/.test(最终位置)) return 'other_or_unspecified';
  if (/后穴|肛内/.test(最终位置)) return 'anal_leak';
  if (/小嘴|口中/.test(最终位置)) return 'mouth_or_face';
  if (/脸部|脸上|面/.test(最终位置)) return 'mouth_or_face';
  if (/胸部|胸前/.test(最终位置)) return 'chest_or_body';
  if (/体外|床|地面|枕/.test(最终位置)) return 'bed_or_nearby';
  if (/小屄|阴道内|体内/.test(最终位置)) return 'vaginal_leak';
  return 'other_or_unspecified';
}

export function 判定CG动作(信号: CG回合信号, 阶段: CG阶段): CG动作 | null {
  const 亲密 = 信号.亲密;
  const 结构化 = 判定行为阶段(亲密);
  if (阶段 === 'active' || 阶段 === 'deep_foreplay') {
    // 进行中四池和口交/乳交/玩具等深度前戏优先采用结构化真值。
    if (结构化?.阶段 === 阶段) return 结构化.动作;
    if (阶段 === 'active') return null;
  }
  if (阶段 === 'aftermath') return 判定事后动作(亲密);
  const 正文动作 = 判定文本动作(阶段, 信号.正文);
  if (正文动作) return 正文动作;
  return 等级达标(阶段, 信号.角色阶段, 信号.行为等级)
    ? 判定文本动作(阶段, 信号.行动)
    : null;
}

/** 场内未命中新图时保留当前 CG；成功结束楼也保留新选出的事后图到下一次场外回合；
 * 中止/离场/停下收尾/安全套内等失败结束不得残留旧 CG。 */
export function 应保留成人CG(信号: CG回合信号): boolean {
  const 亲密 = 信号.亲密;
  if (!亲密 || 亲密.状态 === '空闲') return false;
  if (亲密.状态 === '已结束') return 是成功结束(亲密);
  return true;
}

/** App 找不到新候选时，判断当前图能否沿用：角色/图库/阶段不符，或 active/aftermath
 * 强语义动作不符，必须清除旧图；阶段未知的纯对话楼与软阶段对话允许沿用同图。 */
export function 当前CG可沿用(
  当前: 成人CG项 | null,
  信号: CG回合信号,
  阶段: CG阶段 | null,
  动作: CG动作 | null,
): boolean {
  if (!当前 || !信号.门牌) return false;
  const 目标图库 = 信号.variant ?? 'normal';
  if (当前.door !== 信号.门牌) return false;
  if (当前.variant !== 目标图库) return false;
  // 阶段未知（纯对话楼）没有可比对的阶段/动作目标，不强行按动作清图。
  if (!阶段) return true;
  if (当前.stage !== 阶段) return false;
  if ((阶段 === 'active' || 阶段 === 'aftermath') && 动作 && 当前.action !== 动作) return false;
  return true;
}

export function 角色CG总数(门牌号: 门牌, variant: CG变体 = 'normal'): number {
  return 清单.filter(item => item.door === 门牌号 && item.variant === variant).length;
}

/** 档案卡总进度跨普通/怀孕两条图库合计；图库内部页签仍各算各的。 */
export function 角色CG总数全部变体(门牌号: 门牌): number {
  return 清单.filter(item => item.door === 门牌号).length;
}

export function 角色CG列表(门牌号: 门牌, variant: CG变体 = 'normal'): readonly 成人CG项[] {
  return 清单.filter(item => item.door === 门牌号 && item.variant === variant);
}

function 构造成人CG候选池(
  信号: CG回合信号,
  不可用: ReadonlySet<string> = new Set(),
): { 池: 成人CG项[]; 阶段: CG阶段; 动作: CG动作 | null; variant: CG变体 } | null {
  const 阶段 = 判定CG阶段(信号);
  if (!阶段 || !信号.门牌) return null;
  const variant = 信号.variant ?? 'normal';
  // 先按门牌 + 图库 + 阶段硬过滤，再按动作匹配；绝不跨图库回退。
  let 池 = 清单.filter(
    item => item.door === 信号.门牌 && item.variant === variant && item.stage === 阶段 && !不可用.has(item.id),
  );
  const 动作 = 判定CG动作(信号, 阶段);
  if (阶段 === 'active' || 阶段 === 'aftermath') {
    // 进行中与事后都是强语义动作：阴茎/道具、前/后穴、各处事后流出互不冒充，
    // 精确匹配，缺图直接返回 null，绝不跨动作兜底。
    if (!动作) return null;
    池 = 池.filter(item => item.action === 动作);
    if (!池.length) return null;
  } else if (动作) {
    // 其他阶段先精确动作，再在同角色同图库同阶段内安全回退。
    const 精确池 = 池.filter(item => item.action === 动作);
    if (精确池.length) 池 = 精确池;
  }
  if (!池.length) return null;
  return { 池, 阶段, 动作, variant };
}

/**
 * 同一回合最多选出 limit 张不重复 CG。第一张保持旧单选器的确定性结果；其余槽位继续从
 * 同角色、同图库、同阶段、同动作语义池轮取。未解锁项优先，不足时才用已解锁项补位。
 */
export function 选择成人CG组(
  信号: CG回合信号,
  已播放: ReadonlySet<string>,
  不可用: ReadonlySet<string> = new Set(),
  limit = 2,
): 成人CG项[] {
  if (!Number.isInteger(limit) || limit <= 0) return [];
  const 候选池 = 构造成人CG候选池(信号, 不可用);
  if (!候选池 || !信号.门牌) return [];
  const { 池, 阶段, 动作, variant } = 候选池;
  const 哈希值 = 哈希(`${信号.门牌}:${variant}:${阶段}:${动作 ?? 'any'}:${信号.楼层}`);
  const 未播放 = 池.filter(item => !已播放.has(item.id));
  const 结果: 成人CG项[] = [];
  const 已选择 = new Set<string>();

  const 轮取 = (来源: readonly 成人CG项[], 上限: number): void => {
    if (!来源.length || 结果.length >= 上限) return;
    const 起点 = 哈希值 % 来源.length;
    for (let 偏移 = 0; 偏移 < 来源.length && 结果.length < 上限; 偏移 += 1) {
      const 项 = 来源[(起点 + 偏移) % 来源.length];
      if (!项 || 已选择.has(项.id)) continue;
      已选择.add(项.id);
      结果.push(项);
    }
  };

  // 先尽量填满未解锁项；不足两张时才从同一语义池的已解锁项补位。
  轮取(未播放, limit);
  轮取(池.filter(item => !已选择.has(item.id)), limit);
  return 结果;
}

/** 保留旧单图 API，避免其他消费者在不需要双图时被迫改变行为。 */
export function 选择成人CG(
  信号: CG回合信号,
  已播放: ReadonlySet<string>,
  不可用: ReadonlySet<string> = new Set(),
): 成人CG项 | null {
  return 选择成人CG组(信号, 已播放, 不可用, 1)[0] ?? null;
}

export function CG条目(id: string): 成人CG项 | null {
  return 清单.find(item => item.id === id) ?? null;
}
