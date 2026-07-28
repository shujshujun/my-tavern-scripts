import type { SchemaType } from '../../schema';
import { Schema } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 难度表, 首批门牌 } from '../../stageConfig';
// (难度表兼供撞见概率系数查表)
import { 经济结算 } from './经济系统';
import { 入住检测, 创建配置户节点, 同步入住世界书条目 } from './入住系统';
import { 打断检测, 换装起疑, 母亲撞见检测, 父亲来电打断 } from './打断系统';
import { 夜访结算, 惰性结算户, 绿帽线检测, 结算焦点疑心, 冷落检测 } from './结算系统';
import { 荣耀洞结算 } from './荣耀洞';
import { 当前时段, 丈夫在楼 } from './楼层时钟';
import { PROMOTE_MIRROR_KEY, 捕获保护快照, 回滚保护字段, 清保护快照, 镜像直写 } from './守护系统';
import { 中断卡文案, 解析行为等级, 记违规清零, 结算违规代价, 输出稽查, 未遂余波指引 } from './稽查系统';
import { 同步整表视图, 读取最近有效, 读最近有效stat, 脚本写入 } from './mvuIO';
import { 事件角色标记, 检测焦点, 取本轮事件文本, 组公寓快照, 读场景, 读粘滞状态 } from './snapshotSystem';
import { 读取数据库记忆胶囊, 同步数据库回合, 数据库状态 } from './数据库桥';

/**
 * 回合引擎:固定 0 楼架构的主循环(修道院回合引擎直迁,本作化三处:
 * 稽查终审接入/惰性结算+疑心主通道/序章开局)。
 *
 * 显示层永远只有 0 楼的客户端 iframe;后续楼层只是数据库:
 *   玩家行动 → generate(不建楼、不刷新显示) → 稽查终审(违规=中断卡+变量不采纳+代价)
 *   → Mvu.parseMessage 手动解析变量 → 回滚保护字段(变量分工表) → 回合结算
 *   → createChatMessages({refresh:'none'}) 静默落库(AI 上下文/回档全靠它) → 通知客户端
 *
 * 事件流(客户端 ⇄ 脚本):
 *   人妻公寓:玩家行动 ← 客户端游戏内输入(index.ts 接线)
 *   人妻公寓:生成开始/流式/回合完成/回合失败 → 客户端(流式渲染+解锁输入)
 */

let 进行中 = false;
export const 回合进行中 = () => 进行中;

// ── 重掷支持:回合快照(存 chat 变量,iframe 重载/刷新后仍可重掷) ──
// 变量随楼自动回滚(每楼自带 stat_data);晋阶镜像有意不在此列——镜像取大是防打回的正字,重掷不还原

/** 回合内会被脚本改写的 chat 变量键(重掷时按快照整值恢复;_场景 含一幕性的破门标记) */
const 回合变量键 = [
  '_场景',
  '_经济',
  '_赴约',
  '_工具由头',
  '_无耗时拜访',
  '_换装余波',
  '_待办',
  '_侦探',
  '_摄像头',
  '_在场',
  '_行动选项',
  '_粘滞',
  '_地图轨迹',
  // 连续反感计数是 chat 变量,不随楼层回滚——不入此表则"稽查违规→重掷"会让计数只涨不还原,
  // 三次重掷就把人永久逼走(2026-07-26 审计 H1)
  '_反感连续',
] as const;

/** 手机记录不塞进每回合快照（会令存档平方膨胀），按楼层戳裁掉被删除时间线。
 * @param 目标钟 目标楼对应的钟楼(真实楼+回滚后 stat 的杀时间偏移)——节拍水位线全用钟楼轴。 */
function 裁手机时间线(vars: Record<string, unknown>, 楼层: number, 目标钟: number): void {
  const 库 = _.get(vars, '_微信') as
    | {
        消息?: { 楼?: number }[];
        圈?: { 楼?: number }[];
        读到?: Record<string, number>;
        圈读到?: number;
        节拍?: Record<string, number>;
      }
    | undefined;
  if (!库 || typeof 库 !== 'object') return;
  库.消息 = (库.消息 ?? []).filter(x => Number(x?.楼 ?? -1) <= 楼层);
  库.圈 = (库.圈 ?? []).filter(x => Number(x?.楼 ?? -1) <= 楼层);
  库.读到 = Object.fromEntries(Object.entries(库.读到 ?? {}).map(([k, v]) => [k, Math.min(Number(v), 楼层)]));
  库.圈读到 = Math.min(Number(库.圈读到 ?? -1), 楼层);
  // 节拍水位线夹到目标钟(2026-07-26 审计 M4):旧版直接清空,各渠道间隔门 ?? -999 全部立即到期,
  // 重掷/回档一次=朋友圈+私聊+群聊+仅你可见+姐妹群同拍齐开火(每条都是一次 AI 计费)。
  // 夹到目标钟=视为"刚发过",间隔门从回滚点重新起算,既不爆发也不永久卡死。
  库.节拍 = Object.fromEntries(Object.entries(库.节拍 ?? {}).map(([k, v]) => [k, Math.min(Number(v) || 0, 目标钟)]));
  _.set(vars, '_微信', 库);
  const 事件日志 = _.get(vars, '_隔离事件.日志');
  if (Array.isArray(事件日志)) {
    _.set(
      vars,
      '_隔离事件.日志',
      事件日志.filter(条 => Number((条 as { 锚楼?: number })?.锚楼 ?? -1) <= 楼层),
    );
  }
}

type 上次回合记录 = {
  行动: string;
  回合前末楼: number;
  chat快照: Record<string, unknown>;
};

function 读上次回合(): 上次回合记录 | undefined {
  return (_.get(getVariables({ type: 'chat' }), '_上次回合') ?? undefined) as 上次回合记录 | undefined;
}

// 流式转发:generate 的 iframe 事件转成自定义事件,客户端稳定可收。
// 用 generation_id 只认自家生成(数据库/总结类第三方脚本自己也会调 generate)。
let 本回合生成id = '';
let 解除生成等待: (() => void) | null = null;
eventClearEvent(iframe_events.STREAM_TOKEN_RECEIVED_FULLY);
eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (文本: string, generation_id: string) => {
  if (!进行中) return;
  if (generation_id && generation_id !== 本回合生成id) return;
  eventEmit('人妻公寓:流式', 文本);
});

/** 行动锚风险窗(chat 变量,存真实楼层界;过楼自然过期,回档陈旧值也只是多注入几轮,无害) */
const 行动锚窗键 = '_行动锚窗';
function 开行动锚窗(至楼: number): void {
  Promise.resolve(insertOrAssignVariables({ [行动锚窗键]: 至楼 }, { type: 'chat' })).catch(e =>
    console.warn('[人妻公寓] 行动锚窗写入失败(仅少一层保险):', e),
  );
}

// ── 取消本回合:停掉生成,作废的回合不落楼 ──
let 已取消 = false;
export function 取消本回合() {
  if (!进行中 || !本回合生成id) return;
  已取消 = true;
  开行动锚窗(getLastMessageId() + 6); // 取消后 3 回合内注入行动锚,防中断残留的错位节奏
  // 部分公益站会让底层请求长期悬空，stopGenerationById 也不一定能让 Promise 返回。
  // 先主动结束本卡自己的等待，finally 才能立即释放 `进行中`，玩家才能重新生成。
  解除生成等待?.();
  try {
    if (!stopGenerationById(本回合生成id)) stopAllGeneration();
  } catch (e) {
    console.error('[人妻公寓] 停止生成失败:', e);
  }
}

/**
 * 给正文生成加一层本卡可控的中止门。
 * - 手动取消不依赖第三方端点是否正确关闭连接；
 * - 不再设置固定时长硬超时：长文本模型即使超过 180 秒也继续等待；
 * - 手动取消后的底层迟到结果只会结束自己的 Promise，不会落楼或改变量。
 */
async function 等待正文生成(参数: Parameters<typeof generate>[0]): Promise<string> {
  const 中止门 = new Promise<never>((_resolve, reject) => {
    解除生成等待 = () => reject(new Error('__RQGY_CANCELLED__'));
  });
  try {
    return String(await Promise.race([generate(参数), 中止门]));
  } finally {
    解除生成等待 = null;
  }
}

/**
 * 识别当前正文模型。
 *
 * 酒馆可把模型接在原厂、OpenRouter 或 OpenAI 兼容端点下，模型名会落在不同设置键里。
 * 这里只扫描“模型/API 来源”类字段，避免把聊天正文里的品牌名误判成当前模型。
 */
function 识别正文模型(): string {
  try {
    const 宿主 = window.parent as any;
    const 全局ST = 宿主?.SillyTavern ?? (globalThis as any).SillyTavern;
    const 上下文 = 全局ST?.getContext?.() ?? 全局ST ?? SillyTavern;
    const 候选根 = [
      上下文?.chatCompletionSettings,
      上下文?.textCompletionSettings,
      上下文?.oai_settings,
      上下文?.textgenerationwebui_settings,
      上下文?.mainApi,
      {
        mainApi: 上下文?.mainApi,
        onlineStatus: 上下文?.onlineStatus,
        tokenizerModel: 上下文?.getTokenizerModel?.(),
      },
    ];
    const 候选值: string[] = [];
    const 收集 = (值: unknown, 深度: number, 路径 = ''): void => {
      if (深度 > 3 || 值 == null) return;
      if (typeof 值 === 'string') {
        if (/(?:model|source|api|provider|status)/i.test(路径)) 候选值.push(值);
        return;
      }
      if (typeof 值 !== 'object' || Array.isArray(值)) return;
      for (const [键, 子值] of Object.entries(值 as Record<string, unknown>)) {
        收集(子值, 深度 + 1, 路径 ? `${路径}.${键}` : 键);
      }
    };
    for (const 根 of 候选根) 收集(根, 0);
    const 命中 = 候选值.find(值 => /\b(?:gemini|deepseek)(?:[-_.:/\s]|$)/i.test(值)) ?? '';
    if (命中) console.info(`[人妻公寓] 检测到正文模型：${命中}`);
    return 命中;
  } catch (e) {
    console.warn('[人妻公寓] 正文模型检测失败，按普通模型继续：', e);
    return '';
  }
}

const GEMINI变量更新强制令 = [
  '【Gemini变量更新强制令｜最高优先执行】',
  '本次回复必须在正文末尾输出完整且可解析的 <UpdateVariable>...</UpdateVariable> 块，绝对不得省略、概括、改名或只在思考中提及。',
  '必须逐项检查快照【焦点】里明确标为“本人在场”的人物。只要本轮互动对她的感受产生了实际正面或负面影响，就务必用 RFC 6902 replace 更新 户.<门牌>.妻.好感值，变化遵守变量规则与单轮上限；不得因为变化幅度小而跳过。',
  '同时按本轮真实剧情更新在场人物的 当前心理想法 与 当前情绪。无依据的数值不要乱加；不在场人物和系统管理字段绝对不动。',
  '先写完整正文，再输出变量块；变量块必须是回复的最后一部分。',
].join('\n');

const 二次变量结算令 = [
  '【独立变量结算｜只输出变量块】',
  '根据公寓快照、本轮玩家行动和本轮已完成正文，独立检查本轮实际发生的状态变化。',
  '只输出一个完整且可解析的 <UpdateVariable>...</UpdateVariable> 块，不要复述正文，不要解释，不要输出思考过程或其他标签。',
  '必须检查快照【焦点】中明确标为“本人在场”的人物：若互动确实产生正面或负面影响，用 RFC 6902 replace 更新 户.<门牌>.妻.好感值，并按剧情更新 当前心理想法 与 当前情绪。',
  '好感变化必须有正文依据，允许正数、负数或不变；不得为了更新而机械加分。遵守变量规则与单轮上限，不在场人物及系统管理字段绝对不动。',
].join('\n');

function 取变量块(文本: string): string | null {
  // 标准形:完整 <UpdateVariable> 块
  const 完整 = 文本.match(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/i)?.[0];
  if (完整) return 完整;
  // 兜底①(2026-07-26 玩家反馈"变量不更新"):模型漏了外层包装,只输出 <JSONPatch> 块
  const 裸补丁 = 文本.match(/<json_?patch>[\s\S]*?<\/json_?patch>/i)?.[0];
  if (裸补丁) return `<UpdateVariable>\n${裸补丁}\n</UpdateVariable>`;
  // 兜底②:连标签都没有,只输出了裸 JSON Patch 数组(可能带代码围栏)
  const 数组 = 文本.match(/\[\s*\{[\s\S]*?"op"\s*:[\s\S]*?\}\s*\]/)?.[0];
  if (数组) {
    try {
      if (Array.isArray(JSON.parse(数组))) {
        return `<UpdateVariable>\n<JSONPatch>\n${数组}\n</JSONPatch>\n</UpdateVariable>`;
      }
    } catch {
      /* 不是合法 JSON 就放弃这条兜底 */
    }
  }
  // 兜底③:_.set 老格式命令行(MVU 全文扫描也认,但包起来便于清洗与落账一致)
  const 命令行 = 文本.split('\n').filter(行 => /_\.(?:set|insert|assign|remove|unset|delete|add)\(/.test(行));
  if (命令行.length) return `<UpdateVariable>\n${命令行.join('\n')}\n</UpdateVariable>`;
  return null;
}

/**
 * 首遍正文里是否已带 MVU 可解析的变量命令(2026-07-26 玩家反馈修复):
 * - `_.set(...)` 老格式:MVU 全文扫描,存在即可用;
 * - `<JSONPatch>` 标签块:内容必须真能 JSON.parse 成数组(空数组=模型判定无变化,也算可用;
 *   Gemini 爱写尾逗号/注释,解析不动的畸形块=等于没写,须触发兜底重算)。
 */
function 有可用变量命令(文本: string): boolean {
  if (/_\.(?:set|insert|assign|remove|unset|delete|add)\(/.test(文本)) return true;
  for (const m of 文本.matchAll(/<(json_?patch)>([\s\S]*?)<\/\1>/gi)) {
    const 体 = m[2]
      .replace(/^\s*```[a-z]*\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    try {
      if (Array.isArray(JSON.parse(体))) return true;
    } catch {
      /* 畸形块,继续看下一个 */
    }
  }
  return false;
}

/**
 * DeepSeek / Gemini 可能完成正文却漏掉记账，因此可使用独立的静默结算通道。
 * 正文仍采用第一遍结果；第二遍只生成变量块，并以它替换正文中可能存在但不稳定的旧变量块。
 */
async function 补模型变量结算(
  模型: string,
  原文: string,
  行动: string,
  快照: string,
  回合前末楼: number,
): Promise<string> {
  const 正文 = 清洗正文(原文);
  本回合生成id = `rqgy-vars-${回合前末楼}-${_.random(1e9)}`;
  const 结算原文 = await 等待正文生成({
    user_input: `【本轮玩家行动】\n${行动}\n\n【本轮已完成正文】\n${正文}`,
    should_stream: false,
    injects: [
      { role: 'system', content: 快照, position: 'in_chat', depth: 0, should_scan: true },
      { role: 'system', content: 二次变量结算令, position: 'in_chat', depth: 0, should_scan: false },
    ],
    generation_id: 本回合生成id,
  });
  const 变量块 = 取变量块(结算原文);
  if (!变量块) {
    console.warn(`[人妻公寓] ${模型} 独立变量结算未返回完整 UpdateVariable 块，保留第一遍结果`);
    return 原文;
  }
  console.info(`[人妻公寓] ${模型} 独立变量结算完成`);
  return `${正文}\n${变量块}`;
}

/** 游戏右上角“设置”中的总开关；旧存档没有该字段时默认开启，保持 DeepSeek 现有行为。 */
function 二次变量结算开启(): boolean {
  try {
    const raw = (window.parent ?? window).localStorage?.getItem('人妻公寓_界面偏好');
    if (!raw) return true;
    return (JSON.parse(raw) as { 二次变量结算?: boolean }).二次变量结算 !== false;
  } catch {
    return true;
  }
}

/** 楼层尾部 + 本次行动 → 伪对话数组(焦点检测/快照组装的扫描源) */
function 近楼对话(行动?: string): { role: string; content: string }[] {
  const 尾: { role: string; content: string }[] = [];
  try {
    const 末楼 = getLastMessageId();
    // 起点跳过 0 楼(审计 M10-d):固定 0 楼是客户端 HTML,拿它做焦点扫描=拿界面代码认人
    const 起 = Math.max(1, 末楼 - 3);
    if (末楼 >= 1) {
      for (const 消息 of getChatMessages(`${起}-${末楼}`) ?? []) {
        尾.push({ role: 消息.role, content: 消息.message ?? '' });
      }
    }
  } catch (e) {
    console.error('[人妻公寓] 读取楼层尾部失败:', e);
  }
  if (行动) 尾.push({ role: 'user', content: 行动 });
  return 尾;
}

interface 反感连续项 {
  次数?: number;
  上次楼?: number;
}

/**
 * 连续反感离场：只看同场妻子的实际好感负增量；任一回合未下降就断链。
 * 第三次下降时移出粘滞/赴约，客户端收到回合完成后立即按新位置刷新。
 */
async function 结算连续反感(旧Stat: SchemaType, 新Stat: SchemaType, 妻在场: 门牌[], 楼层: number): Promise<门牌[]> {
  const 离场: 门牌[] = [];
  await updateVariablesWith(
    vars => {
      const 记录 = (_.get(vars, '_反感连续') ?? {}) as Partial<Record<门牌, 反感连续项>>;
      for (const m of 妻在场) {
        const 旧好感 = 旧Stat.户[m]?.妻.好感值;
        const 新好感 = 新Stat.户[m]?.妻.好感值;
        if (旧好感 == null || 新好感 == null) continue;
        const 上次次数 = Math.max(0, Number(记录[m]?.次数 ?? 0));
        const 次数 = 新好感 < 旧好感 ? 上次次数 + 1 : 0;
        记录[m] = { 次数, 上次楼: 楼层 };
        if (次数 >= 3) {
          离场.push(m);
          记录[m] = { 次数: 0, 上次楼: 楼层 };
        }
      }
      _.set(vars, '_反感连续', 记录);
      if (离场.length) {
        const 粘 = (_.get(vars, '_粘滞') ?? null) as { 位置?: string; 楼?: number; 们?: 门牌[]; 离场?: 门牌[] } | null;
        if (粘?.位置) {
          粘.们 = (粘.们 ?? []).filter(m => !离场.includes(m));
          粘.离场 = _.uniq([...(粘.离场 ?? []), ...离场]);
          粘.楼 = 楼层;
          _.set(vars, '_粘滞', 粘);
        }
        const 赴约 = (_.get(vars, '_赴约') ?? null) as { m?: 门牌 } | null;
        if (赴约?.m && 离场.includes(赴约.m)) _.set(vars, '_赴约', null);
      }
      return vars;
    },
    { type: 'chat' },
  );
  return 离场;
}

function 补离场正文(正文: string, 离场: 门牌[]): string {
  if (!离场.length || /告辞|离开|走出|转身(?:就)?走|脚步声.{0,12}(?:远|消失)|关上.{0,8}门/.test(正文)) return 正文;
  const 名 = 离场
    .map(m => 户静态表[m]?.妻名)
    .filter(Boolean)
    .join('、');
  return `${正文}\n\n${名}的神情彻底冷了下来。她没有再给这场对话继续下去的余地，简短告辞后转身离开了这里。`;
}

/** 快照 + 焦点一次组装;顺手把在场名单落 chat 变量供客户端头像行点亮 */
export function 组快照注入(
  对话尾: { role: string; content: string }[],
  data: SchemaType,
  楼层: number,
): { 快照: string; 焦点: 门牌[]; 妻在场: 门牌[]; 夫在场: 门牌[] } {
  const { 焦点, 在场, 妻在场, 夫在场 } = 检测焦点(对话尾, data, 楼层);
  insertOrAssignVariables({ _在场: { 焦点, 在场, 妻在场, 夫在场 } }, { type: 'chat' });
  // 对话粘滞落库(2026-07-18 用户拍板):当场的人钉在当场,楼层时钟传送不走;
  // 玩家离开房间(场景清空/换房)后,读侧位置比对自动失效,这里顺手清干净
  {
    const 场 = 读场景();
    // 粘滞记录的是妻的位置；丈夫只按自己家的作息判断，不能借户级焦点把不在家的妻子钉回来
    const 们 = 妻在场;
    if (场.房间id && 们.length) {
      insertOrAssignVariables(
        {
          _粘滞: {
            位置: 场.房间id,
            楼: 楼层,
            们,
            离场: 读粘滞状态()?.位置 === 场.房间id ? (读粘滞状态()?.离场 ?? []) : [],
          },
        },
        { type: 'chat' },
      );
    } else if (!场.房间id) {
      insertOrAssignVariables({ _粘滞: null }, { type: 'chat' });
    }
  }
  const 记忆人物 = 焦点.flatMap(m => [户静态表[m]?.妻名, 户静态表[m]?.夫名]).filter((name): name is string => !!name);
  const 公寓快照 = 组公寓快照(对话尾, data, 楼层);
  const 数据库记忆 = 读取数据库记忆胶囊(记忆人物, 楼层);
  // 数据库位于快照之后时，模型容易把较近的旧叙述误当当前事实。末位再压一次裁决：
  // 数据库只补长期连续性，绝不参与当前时间、地点和在场判定。
  const 当前场景裁决 = 数据库记忆
    ? '\n【当前场景硬裁决】数据库记忆只补充过去经历；当前时间、当前位置、人物是否在场及丈夫是否外出，必须完全服从上方《公寓快照》。若两者冲突，忽略数据库中的旧状态，禁止让不在场人物出现。\n'
    : '';
  const 快照 = 公寓快照 + 数据库记忆 + 当前场景裁决;
  // 内容量审计(2026-07-19 用户点名#5):每楼注入体积落日志,测试期拿真实数据定收敛策略
  console.info(`[人妻公寓·快照] 本楼注入 ${快照.length} 字(焦点${焦点.length}人/在场${在场.length}人)`);
  return { 快照, 焦点, 妻在场, 夫在场 };
}

/**
 * 数据库插件兼容广播(2026-07-19 用户点名要兼容 AlbusKen/shujuku 表格插件):
 * 主路径 generate()+createChatMessages(refresh:'none') 全程绕开酒馆消息管道,这类插件靠核心
 * GENERATION_ENDED 唤醒扫楼更新表格,所以在本卡里永远沉睡。落库完成后向酒馆核心补发一对
 * GENERATION_STARTED('normal')+GENERATION_ENDED(末楼号)——先发 STARTED 是为了覆盖可能残留的
 * quiet 生成记录(插件门控会拦 quiet/dryRun,无记录或 normal 记录则放行)。
 * ⚠ 刻意不发 MESSAGE_SENT:会惊醒 MVU 对玩家楼无条件跑一轮进而连锁触发本卡逃生舱补结算=双重记账
 * (feedback_mvu_message_sent_trap 同族陷阱)。广播失败只警告,绝不影响回合本体。
 */
async function 广播生成完成事件(): Promise<void> {
  try {
    const 宿主 = window.parent as any;
    const 全局ST = 宿主?.SillyTavern;
    const 上下文 = 全局ST?.getContext?.() ?? 全局ST;
    const 事件源 = 上下文?.eventSource ?? 全局ST?.eventSource;
    // 事件表键名随酒馆版本漂移(eventTypes/event_types),两头兼容,取不到就放弃
    const 事件表 = 上下文?.eventTypes ?? 上下文?.event_types ?? 全局ST?.eventTypes ?? 全局ST?.event_types;
    if (typeof 事件源?.emit !== 'function' || !事件表?.GENERATION_ENDED) return;
    const 末楼 = getLastMessageId();
    const 数据库已启用 = 数据库状态().已安装;
    if (数据库已启用) eventEmit('人妻公寓:运行阶段', '数据库正在整理本回合');
    let 超时器: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        (async () => {
          if (事件表.GENERATION_STARTED) await 事件源.emit(事件表.GENERATION_STARTED, 'normal', {}, false);
          await 事件源.emit(事件表.GENERATION_ENDED, 末楼);
        })(),
        new Promise<void>(resolve => {
          超时器 = setTimeout(() => {
            if (数据库已启用) console.warn('[人妻公寓] 数据库兼容广播等待超过30秒，游戏先继续显示正文。');
            resolve();
          }, 30000);
        }),
      ]);
    } finally {
      if (超时器) clearTimeout(超时器);
    }
  } catch (e) {
    console.warn('[人妻公寓] 数据库插件兼容广播失败(不影响游戏):', e);
  }
}

async function 记录数据库回合(
  楼层: number,
  data: SchemaType,
  行动: string,
  结果: string,
  妻在场: readonly 门牌[],
  夫在场: readonly 门牌[],
): Promise<void> {
  const 场 = 读场景();
  const 参与者 = [...妻在场.map(m => 户静态表[m]?.妻名), ...夫在场.map(m => 户静态表[m]?.夫名)].filter(
    (name): name is string => !!name,
  );
  const 数据库已启用 = 数据库状态().已装游戏模板;
  if (数据库已启用) eventEmit('人妻公寓:运行阶段', '数据库正在写入回合记录');
  try {
    await 同步数据库回合({
      楼层,
      时间: 当前时段(楼层 + data.系统._时段偏移楼),
      地点: 场.房间id || '公寓公共区域',
      参与者,
      玩家行动: 行动,
      结果摘要: 结果,
    });
  } finally {
    if (数据库已启用) eventEmit('人妻公寓:运行阶段', '数据库记录完成');
  }
}

/** 楼层落库前的清洗:思维链/变量块/选项块/行为等级标签不进楼层文本(prompt 与卷轴双干净) */
function 清洗正文(原文: string): string {
  const 闭合清 = 原文
    // 狐系等玩家预设把思考写成不配对的“【开始思考】…</think_fox~>”，但会用
    // <content> 单独圈正文。content 是可靠的正文白名单边界；闭合缺失时也保住其后剧情。
    .replace(/^[\s\S]*?<content\b[^>]*>/i, '')
    .replace(/<\/content\s*>[\s\S]*$/i, '')
    // story_scene 是部分预设使用的正文包装标签：语义与 content 相同，只保留标签内剧情。
    // 开标签未闭合时保留其后文本，避免流式截断或模型漏闭合导致整段正文丢失。
    .replace(/^[\s\S]*?<story_scene\b[^>]*>/i, '')
    .replace(/<\/story_scene\s*>[\s\S]*$/i, '')
    .replace(/【开始思考】[\s\S]*?<\/think_fox~\s*>/gi, '')
    .replace(/<fox_selc\b[^>]*>[\s\S]*?<\/fox_selc\s*>/gi, '')
    .replace(/<fox_tip\b[^>]*>[\s\S]*?<\/fox_tip\s*>/gi, '')
    // Izumi 预设：konatan_planning~ 是思考规划，tucao 是正文后的吐槽/总结；两块均非正文。
    .replace(/<konatan_planning~[^>]*>[\s\S]*?<\/konatan_planning~\s*>/gi, '')
    .replace(/<tucao\b[^>]*>[\s\S]*?<\/tucao\s*>/gi, '')
    // TG：SexualScene 是剧情特写容器，保留内部正文；校验/免责声明/行动选项不是剧情。
    .replace(/<\/?SexualScene\b[^>]*>/gi, '')
    .replace(/<(VariableCheck|Disclaimer|w2g)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    // 双人成行：这些都是 content 正文之后的摘要、选项或独立展示模块。
    // content 缺失时也要按块清除，防止预设协议被落库并在下一轮继续污染上下文。
    .replace(
      /<(meow_FM|branches|parallel_world|historic_events|htm1fenge)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      '',
    )
    // 流式截断或模型漏闭合时，以上附加模块一旦开始，后面都不再属于正文。
    .replace(/<(?:VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)\b[^>]*>[\s\S]*$/i, '')
    .replace(
      /<\/?(?:content|story_scene|now_plot|think_fox~|fox_selc|fox_tip|konatan_planning~|tucao|SexualScene|VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)(?:\s[^>]*)?>/gi,
      '',
    )
    // 玩家预设的前置草稿偶尔漏 </draft_notes>，但后续 bginfor 仍完整。用完整的信息栏
    // 作为安全右边界清掉两块元数据；若右边界也缺失，末尾仅剥标签，绝不吞掉剧情。
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<\/draft_notes\s*>/gi, '')
    .replace(/<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<CEstuff\b[^>]*>[\s\S]*?<\/CEstuff\s*>/gi, '')
    .replace(/<\/?(?:draft_notes|bginfor|CEstuff)\b[^>]*>/gi, '')
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*-{2,}>?\s*$/gm, '')
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
    .replace(/<options>[\s\S]*?<\/options>/g, '')
    .replace(/<行为等级>[\s\S]*?<\/行为等级>/g, '')
    // 玩家预设夹带的整篇 HTML 组件(2026-07-18 玩家实测:破限预设让模型在正文后附"选项分支"
    // HTML 文档,原生酒馆渲染成卡,固定0楼界面=裸代码墙,还白吃上下文token)——整体剥除
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*?```/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?<\/html\s*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<StatusPlaceHolderImpl\/>/g, '')
    // 有些玩家预设把裸 <p> 当换行符且从不输出 </p>。它不是需要“吞到结尾”的协议块，
    // 只剥标签并补换行，避免未闭合 HTML 扰乱正文，同时不误删标签后的剧情。
    .replace(/<\/?p(?:\s[^>]*)?>/gi, '\n')
    // 玩家预设夹带的包装 div(2026-07-19 玩家实测:konata-thinking-wrapper/tucao-w 这类空壳
    // 或漏闭合的裸 div 直接印在正文里)——正文永远不该有裸 div,标签一律剥壳(内容保留)
    .replace(/<\/?div[^>]*>/gi, '');
  const 全清 = 闭合清
    // 生成被截断时的未闭合块也吞掉,否则半截标记块会永久留在楼层原文里
    .replace(/<think(?:ing)?>[\s\S]*$/i, '')
    .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
    .replace(/<UpdateVariable>[\s\S]*$/, '')
    .replace(/<options>[\s\S]*$/, '')
    .replace(/<行为等级>[\s\S]*$/, '')
    .replace(/<tucao\b[^>]*>[\s\S]*$/i, '')
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*$/i, '')
    .replace(/<!DOCTYPE[\s\S]*$/i, '')
    .replace(/<style[^>]*>[\s\S]*$/i, '')
    .replace(/<script[^>]*>[\s\S]*$/i, '')
    .replace(/<!--[\s\S]*$/, '')
    .trim();
  // 吞尾防误杀(2026-07-17 BUG2根因:偷窥回合"无正文却弹选择"):AI 把协议标记漏闭合地写在
  // 正文开头(如裸 <行为等级>3 打头),吞尾会把整楼吞成空白——宁留半截标记,不吞整场戏
  if (!全清 && 闭合清.trim()) {
    console.warn('[人妻公寓] 清洗吞尾把正文吞成了空白,回退只清闭合块(原文开头疑有未闭合协议标记)');
    return 闭合清.trim();
  }
  return 全清;
}

// 行动选项系统已下线(2026-07-17 用户拍板:序章四条硬编码引导=唯一的选项,点掉即新手引导结束;
// AI 不再被要求输出 <options>,回合完成后 _行动选项 恒清空,选项区自然消失)

/**
 * 回合结算(在落库前对 newStat 就地执行,新楼直接携带结算后数据):
 * 焦点户触碰(惰性补被动账+互动楼层刷新+疑心主通道)+ 事件转存 + 冷落检测。
 */
function 回合结算(
  newStat: SchemaType,
  snapStat: SchemaType,
  焦点: 门牌[],
  妻在场: readonly 门牌[],
  楼层: number,
): void {
  // 焦点户:被触碰=惰性结算生效点
  const 现钟 = 楼层 + newStat.系统._时段偏移楼;
  let 主焦堕落增量 = 0;
  for (const m of 焦点) {
    const 节点 = newStat.户[m];
    if (!节点) continue;
    // 惰性结算走钟楼轴(2026-07-26 审计 低危7):收租/冷却/作息全按钟楼,婚姻阴跌与疑心回落
    // 若按真实楼走,反复杀时间=用 1/3 婚姻代价换整期房租
    惰性结算户(节点, 现钟);
    // `夫.状态`是存档里的丈夫状态栏；此前只有界面临时推算，字段本身长期为空，所以回合后看似从不更新。
    节点.夫.状态 = 丈夫在楼(节点, m, 现钟);
    if (!妻在场.includes(m)) continue;
    节点.妻.上次互动楼层 = 楼层;
    const 堕落增量 = 节点.妻.堕落值 - (snapStat.户[m]?.妻.堕落值 ?? 节点.妻.堕落值);
    if (m === 焦点[0]) 主焦堕落增量 = 堕落增量;
    结算焦点疑心(节点, m, 堕落增量, 现钟);
  }

  // 一次性事件消费转存(防护10):本轮快照已注入的排队事件挪到已注入档
  if (newStat.系统._待发送事件) {
    newStat.系统._已注入事件 = { 楼层, 内容: newStat.系统._待发送事件 };
    newStat.系统._待发送事件 = '';
  }

  // 深夜杵在低阶段住户门口的代价(演出层纪律在快照,账面在此)
  夜访结算(newStat, 楼层);

  // 荣耀洞三拍推进(本楼确实演了拍才走针;完成才记账,离场由UI即时收束)
  荣耀洞结算(newStat, 楼层);

  // 经济:收租日/上交日/父亲来电/最后通牒(期号去重,杀时间跨期惰性补收)
  {
    const 经提示 = 经济结算(newStat, 楼层);
    if (经提示.length) eventEmit('人妻公寓:提示', 经提示.join('\n'));
  }

  // 母亲首夜第二幕(P5②:早饭桌戏=晋阶正戏固定第二幕,首夜次楼自动排队,优先级最高)
  if (newStat.系统._母亲首夜第二幕 && !newStat.系统._待发送事件) {
    newStat.系统._母亲首夜第二幕 = false;
    newStat.系统._待发送事件 =
      `${事件角色标记({ 在场妻: ['302'] })}【早饭桌】第二天一早,妈照常在厨房——照常煎蛋,照常唠叨"趁热吃",围裙照常系得整整齐齐。只有拿筷子的手在抖。` +
      '"什么都没发生"这场戏她演得越用力,越是承认发生了什么。演出这顿早饭:两个人隔着一张桌子各自演"寻常",' +
      '谁都不看谁的眼睛;她给你添饭的那一下,手停了半拍。全程不说破一个字——罪恶感的螺旋从这顿饭开始拧紧';
  }

  // 入住检测(P5 分批唤醒;搬家戏抢事件通道优先级最高——新住户登场是硬剧情)
  入住检测(newStat, 楼层);

  // 换装起疑(换装余波→丈夫侧):她身上的新东西/异样被在家的丈夫注意到,账与戏一起走
  换装起疑(newStat, 楼层);

  // 丈夫打断(优先于冷落抢事件通道):疑心定级别,信任压频率,反讽格走"兄弟拜托"
  打断检测(newStat, 焦点, 楼层);

  // 父亲越洋来电(302专属"丈夫回家"位:亲热中屏幕亮起"老公")
  父亲来电打断(newStat, 焦点, 楼层);

  // 母亲撞见(P5⑥:亲密推进被妈看见——入列前=监督者扣胜任度+暗账;入列后=圆场反转+吃醋)
  母亲撞见检测(newStat, 焦点[0], 主焦堕落增量, 楼层, 难度表[newStat.系统._难度]?.撞见概率系数 ?? 1);

  // 绿帽双线(102观众席"门缝那一眼"/202哑巴亏):开线关键事件,结局轨道单向标记
  绿帽线检测(newStat, 楼层);

  // 冷落检测:排队"她主动来找你"(一次一人)
  冷落检测(newStat, 楼层);
}

/** 主循环:玩家行动 → 生成 → 稽查 → 解析 → 回滚 → 结算 → 落库 → 通知客户端 */
export async function 执行回合(行动: string): Promise<void> {
  if (进行中) return;
  进行中 = true;
  let 临时用户楼层: number | null = null;
  let 临时用户已转正 = false;
  try {
    eventEmit('人妻公寓:生成开始');

    // 重掷快照:回合前末楼号 + 回合内会动的 chat 变量整值
    const 回合前末楼 = getLastMessageId();
    const 生成楼层 = 回合前末楼 + 2; // 本回合 AI 楼的落位(user=+1, assistant=+2)
    const chat快照 = _.cloneDeep(_.pick(getVariables({ type: 'chat' }), 回合变量键));

    // 毒快照防御:末楼无 stat_data(理论上固定 0 楼不会,但逃生舱混用时可能)→ 回退取楼
    const rawStat = 读最近有效stat();
    if (!rawStat) {
      eventEmit('人妻公寓:回合失败', '变量还没就绪——请稍等片刻再试');
      return;
    }
    const data = Schema.parse(rawStat) as SchemaType;
    // 生成前保存旧楼 MVU 数据。稍后会先落一层临时 user，让依赖 {{lastUserMessage}}
    // 的玩家预设读到本轮行动；变量解析仍必须以本回合开始前的 assistant 楼为基准。
    const 旧 = Mvu.getMvuData({ type: 'message', message_id: -1 });
    捕获保护快照(data); // 回滚基准(含镜像取大并入)
    // 生成前刷新整表视图:两轮之间的 UI 写入(买衣/晋阶/送礼)必须先进视图再进 prompt
    await 同步整表视图(data);

    const 对话尾 = 近楼对话(行动);
    if (数据库状态().已装游戏模板) {
      eventEmit('人妻公寓:运行阶段', '数据库正在读取长期记忆');
      // 先让全屏客户端绘制状态条，再进入可能同步阻塞的数据库导出接口。
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    const { 快照, 焦点, 妻在场, 夫在场 } = 组快照注入(对话尾, data, 生成楼层);

    // 本轮行动锚(2026-07-27 玩家反馈"AI永远回应上一轮指令"):历史楼层一旦出现过一对
    // 行动/回应错位(撤回或异常回合造成),模型会在上下文里无限模仿这个错位节奏。
    // 系统侧明写"本轮唯一新行动是哪条",以此为准=错位当轮即自愈,不再级联。
    const 行动锚 =
      `\n【本轮玩家行动】\n${行动}\n` +
      '(以上是{{user}}本轮唯一的新行动,本次回复只回应这条行动。之前楼层的行动均已演出完毕,' +
      '严禁重演、复述或把本次正文写成对任何旧行动的回应;若历史楼层存在行动与回应错位,一律以本条为准。)';

    const injects: Omit<InjectionPrompt, 'id'>[] = [
      { role: 'system', content: 快照 + 行动锚, position: 'in_chat', depth: 0, should_scan: true },
    ];
    const 正文模型 = 识别正文模型();
    const 是Gemini = /\bgemini(?:[-_.:/\s]|$)/i.test(正文模型);
    const 是DeepSeek = /\bdeepseek(?:[-_.:/\s]|$)/i.test(正文模型);
    if (是Gemini) {
      injects.push({
        role: 'system',
        content: GEMINI变量更新强制令,
        position: 'in_chat',
        depth: 0,
        should_scan: false,
      });
    }
    // generate.user_input 和注入消息都无法覆盖预设里的 {{lastUserMessage}} 宏；必须让当前
    // 行动先成为真实聊天尾楼。临时楼必须继承旧楼 MVU 快照：客户端 store 固定读取 -1，
    // 若这里只有文字没有 stat_data，会在生成途中把有效存档误判成初始值并跳回序章。
    // 成功时该楼直接转正并只补 assistant，失败/取消由 finally 删除。
    await createChatMessages([{ role: 'user', message: 行动, data: _.cloneDeep(旧) }], { refresh: 'none' });
    临时用户楼层 = getLastMessageId();
    if (临时用户楼层 !== 回合前末楼 + 1) {
      throw new Error(`临时行动楼层错位：预期 ${回合前末楼 + 1}，实际 ${临时用户楼层}`);
    }

    已取消 = false;
    本回合生成id = `rqgy-${回合前末楼}-${_.random(1e9)}`;
    eventEmit('人妻公寓:运行阶段', 'AI正在生成正文');
    let 原文 = await 等待正文生成({ user_input: 行动, should_stream: true, injects, generation_id: 本回合生成id });
    if (已取消) {
      eventEmit('人妻公寓:回合失败', '已取消——这一轮没有发生');
      return;
    }
    let 已补结算 = false;
    if ((是DeepSeek || 是Gemini) && 二次变量结算开启()) {
      const 模型 = 是DeepSeek ? 'DeepSeek' : 'Gemini';
      已补结算 = true;
      try {
        eventEmit('人妻公寓:运行阶段', '正在核对角色变量');
        原文 = await 补模型变量结算(模型, 原文, 行动, 快照, 回合前末楼);
      } catch (e) {
        if (已取消 || (e instanceof Error && e.message === '__RQGY_CANCELLED__')) throw e;
        console.warn(`[人妻公寓] ${模型} 独立变量结算失败，保留第一遍结果：`, e);
      }
    }
    // 按结果兜底(2026-07-26 玩家反馈"每轮都要手点 MVU 重新处理变量"):
    // 上面的预防性二次结算只认模型名,公益站/反代改名(DS-R1、flash别名等)一律漏网;
    // 首遍正文里连一条可解析的变量命令都没有、且本轮确有可更新的人物在场时,
    // 无论什么模型都补一遍独立结算——触发条件看"结果"不看"名字",总开关同一个。
    if (!已补结算 && 二次变量结算开启() && !有可用变量命令(原文) && (妻在场.length || 夫在场.length)) {
      console.warn('[人妻公寓] 首遍输出没有可解析的变量命令,触发通用兜底结算');
      try {
        eventEmit('人妻公寓:运行阶段', '正在补全角色变量');
        原文 = await 补模型变量结算('通用兜底', 原文, 行动, 快照, 回合前末楼);
      } catch (e) {
        if (已取消 || (e instanceof Error && e.message === '__RQGY_CANCELLED__')) throw e;
        console.warn('[人妻公寓] 通用兜底变量结算失败，保留第一遍结果：', e);
      }
    }
    if (!有可用变量命令(原文) && (妻在场.length || 夫在场.length)) {
      console.warn('[人妻公寓] 本轮最终仍无可解析的变量命令,数值将保持不变(请玩家截此日志反馈)');
    }
    if (已取消) {
      eventEmit('人妻公寓:回合失败', '已取消——这一轮没有发生');
      return;
    }

    const 焦点妻门牌 = 焦点.find(m => 妻在场.includes(m));
    const 焦点阶段 = 焦点妻门牌 ? (data.户[焦点妻门牌]?.妻.当前阶段 ?? null) : null;

    // ── 稽查终审(提示词是劝告,脚本是法律):违规=中断卡+AI 变量不采纳+代价 ──
    // 词表兜底只扫清洗后正文:思维链的自我提醒/选项块的情色试探条不作数(2026-07-17 误杀修复)
    // 正戏免检接线(2026-07-26 审计 M7):脚本自己排的特殊场景/晋阶正戏自带露骨词
    // (录像带剧情含"调教""录像"两票即熔断),不免检=玩家花钱买的戏被自己的稽查斩掉。
    // 只认脚本导演的正戏标记,冷落/搬家等普通事件不豁免。
    const 本楼事件 = 取本轮事件文本(data, 生成楼层);
    const 正戏免检 = /【特殊场景·|【转折正戏】|【药物首夜】|【早饭桌】|【破墙】/.test(本楼事件);
    const 稽查 = 输出稽查(原文, 焦点阶段, 正戏免检, 清洗正文(原文));
    if (稽查.违规 && 焦点妻门牌) {
      console.warn(`[人妻公寓·稽查] 违规拦截:${稽查.原因}`);
      const newStat = _.cloneDeep(data); // 不采纳 AI 的任何变量更新,从快照起步
      结算违规代价(newStat, 焦点妻门牌, 生成楼层);
      const 反感离场 = await 结算连续反感(data, newStat, 妻在场, 生成楼层);
      // 未遂余波下一楼注入(她怎么拒绝的由 AI 按性格补写,不给示例)
      const 余波 = 未遂余波指引(焦点妻门牌);
      newStat.系统._待发送事件 = newStat.系统._待发送事件 ? `${newStat.系统._待发送事件}|${余波}` : 余波;
      const 新 = _.cloneDeep(旧);
      _.set(新, 'stat_data', newStat);
      const 中断正文 = 补离场正文(中断卡文案(户静态表[焦点妻门牌].妻名), 反感离场);
      await createChatMessages([{ role: 'assistant', message: 中断正文, data: 新 }], { refresh: 'none' });
      临时用户已转正 = true;
      捕获保护快照(newStat);
      void 同步整表视图(newStat);
      insertOrAssignVariables(
        {
          _上次回合: { 行动, 回合前末楼, chat快照 } satisfies 上次回合记录,
          _上次隔离回合: null,
          _行动选项: [],
          _地图轨迹: [],
        },
        { type: 'chat' },
      );
      await 记录数据库回合(生成楼层, newStat, 行动, 中断正文, 妻在场, 夫在场);
      await 广播生成完成事件();
      eventEmit('人妻公寓:回合完成');
      return;
    }

    // ── 正常路径:手动解析变量 + 分工表回滚 + 结算 ──
    const 新 = ((await Mvu.parseMessage(原文, 旧)) ?? 旧) as Record<string, unknown>;
    const newStat = Schema.parse(_.get(新, 'stat_data') ?? {}) as SchemaType;
    回滚保护字段(newStat, 焦点, { 妻: 妻在场, 夫: 夫在场 }, 生成楼层); // 户级焦点内再按实际在场人物分闸
    if (焦点妻门牌) 记违规清零(newStat); // 有焦点妻且未违规:连续违规计数断链
    回合结算(newStat, data, 焦点, 妻在场, 生成楼层);
    const 反感离场 = await 结算连续反感(data, newStat, 妻在场, 生成楼层);
    _.set(新, 'stat_data', newStat);

    const 正文 = 补离场正文(清洗正文(原文) || '(楼道里安静了一瞬……本轮 AI 未返回正文,可换个说法再试)', 反感离场);
    await createChatMessages([{ role: 'assistant', message: 正文, data: 新 }], { refresh: 'none' });
    临时用户已转正 = true;
    捕获保护快照(newStat);
    void 同步整表视图(newStat);

    // 破门是一幕性的突发标记:演完这一楼即清除(场景保留,玩家还在房里)
    const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as { 破门?: boolean } | undefined;
    if (场景?.破门) {
      await updateVariablesWith(
        vars => {
          _.set(vars, '_场景.破门', false);
          return vars;
        },
        { type: 'chat' },
      );
    }

    // 落重掷记录(回合成功才落);行动选项恒清(序章引导点掉一条后选项区永久消失)
    insertOrAssignVariables(
      {
        _上次回合: { 行动, 回合前末楼, chat快照 } satisfies 上次回合记录,
        _上次隔离回合: null,
        _行动选项: [],
        _地图轨迹: [],
      },
      { type: 'chat' },
    );

    await 记录数据库回合(生成楼层, newStat, 行动, 正文, 妻在场, 夫在场);
    eventEmit('人妻公寓:CG回合信号', {
      门牌: 焦点妻门牌 ?? null,
      角色阶段: 焦点妻门牌 ? (newStat.户[焦点妻门牌]?.妻.当前阶段 ?? null) : null,
      行为等级: 解析行为等级(原文),
      正文,
      行动,
      事件: 本楼事件,
      楼层: 生成楼层,
    });
    await 广播生成完成事件();
    eventEmit('人妻公寓:回合完成');
  } catch (e) {
    if (已取消) {
      eventEmit('人妻公寓:回合失败', '已取消——这一轮没有发生');
    } else {
      console.error('[人妻公寓] 回合执行失败:', e);
      eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    }
  } finally {
    if (临时用户楼层 !== null && !临时用户已转正) {
      try {
        await deleteChatMessages([临时用户楼层], { refresh: 'none' });
      } catch (e) {
        console.error('[人妻公寓] 清理未完成的临时玩家楼层失败:', e);
      }
    }
    进行中 = false;
    本回合生成id = ''; // 防回档等无生成的回合被"取消"误伤
  }
}

/**
 * 重掷本回合:删掉上一回合创建的楼层(每楼自带 stat_data 快照,变量随楼自动回滚——
 * 固定 0 楼架构红利;晋阶镜像不还原=取大防打回的正字),chat 变量按回合前快照整值恢复,
 * 然后用原行动重新执行一回合。
 */
export async function 重掷回合(): Promise<void> {
  if (进行中) {
    // 静默返回会闩死客户端的乐观 发送中 锁(2026-07-26 审计 C6):必须回一个事件解锁
    eventEmit('人妻公寓:回合失败', '上一轮还没结束,稍等片刻再重来');
    return;
  }
  const 记录 = 读上次回合();
  const 末楼 = getLastMessageId();
  if (!记录 || 末楼 <= 记录.回合前末楼) {
    eventEmit('人妻公寓:回合失败', '没有可重来的回合');
    return;
  }
  try {
    await deleteChatMessages(_.range(记录.回合前末楼 + 1, 末楼 + 1), { refresh: 'none' });
    // 楼已删,此刻读到的 stat 就是回滚后真值,拿它的杀时间偏移换算节拍钟楼轴
    const 回滚偏移 = Number(_.get(读最近有效stat() ?? {}, '系统._时段偏移楼')) || 0;
    // updateVariablesWith + _.set 整值替换(insertOrAssign 对对象是深合并,会残留回合内新增的键)
    await updateVariablesWith(
      vars => {
        for (const 键 of 回合变量键) _.set(vars, 键, (记录.chat快照 as Record<string, unknown>)[键] ?? null);
        裁手机时间线(vars, 记录.回合前末楼, 记录.回合前末楼 + 回滚偏移);
        return vars;
      },
      { type: 'chat' },
    );
  } catch (e) {
    console.error('[人妻公寓] 重掷回滚失败:', e);
    eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    return;
  }
  开行动锚窗(记录.回合前末楼 + 6);
  await 执行回合(记录.行动);
}

/**
 * 回档:删掉指定楼层之后的一切。
 * 变量随楼回滚;回合类 chat 变量一律清空(排队于被删时间线,保守清掉最安全);
 * 晋阶镜像在此显式作废(2026-07-26 审计 H2/M12):守护系统的楼层比较无法区分
 * "重掷删楼(镜像该保)"和"回档到更早时间线(镜像该废)",作废语义只能由本入口自己宣告——
 * 否则回档后任意一次 UI 抬升(镜像直写)会把整份旧局镜像重新盖上当前楼戳,旧阶段全数复活。
 */
export async function 回档至(楼层: number): Promise<void> {
  if (进行中) {
    eventEmit('人妻公寓:回合失败', '上一轮还没结束,稍等片刻再回档');
    return;
  }
  const 末楼 = getLastMessageId();
  if (!Number.isInteger(楼层) || 楼层 < 0 || 楼层 >= 末楼) {
    eventEmit('人妻公寓:回合失败', '没有可回退的楼层');
    return;
  }
  进行中 = true;
  try {
    await deleteChatMessages(_.range(楼层 + 1, 末楼 + 1), { refresh: 'none' });
    const 回滚偏移 = Number(_.get(读最近有效stat() ?? {}, '系统._时段偏移楼')) || 0;
    await updateVariablesWith(
      vars => {
        for (const 键 of [...回合变量键, '_上次回合', '_上次隔离回合', PROMOTE_MIRROR_KEY]) _.set(vars, 键, null);
        裁手机时间线(vars, 楼层, 楼层 + 回滚偏移);
        return vars;
      },
      { type: 'chat' },
    );
    清保护快照(); // 内存快照连同镜像一起作废,下一次捕获从回档后真值重建
    const 回档数据 = 读取最近有效();
    if (回档数据) {
      await 同步入住世界书条目(回档数据.data);
      await 同步整表视图(回档数据.data);
    }
    开行动锚窗(楼层 + 6); // 回档/撤回后 3 回合内注入行动锚(玩家反馈的错位高发窗口)
    console.info(`[人妻公寓] 回档至 ${楼层} 楼`);
    eventEmit('人妻公寓:回合完成');
  } catch (e) {
    console.error('[人妻公寓] 回档失败:', e);
    eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
  } finally {
    进行中 = false;
  }
}

// ============================================
// 序章开局(开局流程三段之②:父亲来电=第 1 楼固定演出,写死不给 AI)
// 开局=电话,结局=饭桌,首尾对上父亲不在场;妈在旁盛饭插话=背景板首镜
// ============================================

const 父亲来电正文 = [
  '手机在管理员室的值班桌上震动起来的时候,你正在数前任管理员留下的那串钥匙——十六把,每一把都缠着褪色的号码贴纸。',
  '',
  '来电显示:爸。',
  '',
  '"东西都交接了?"他的声音隔着越洋信号,还是那种不容你插话的节奏,"钥匙、账本、报修单。那栋楼是我半辈子的心血,现在归你管。丑话说在前头——房租一分不能少,每期照数打给我;楼里要是传出什么闲话,或者租户跑到我这儿来投诉……"',
  '',
  '电话那头顿了顿,你听见他喝了口什么。',
  '',
  '"……你就收拾东西,去你二叔的码头报到。我说到做到。"',
  '',
  '厨房方向飘来饭菜香。妈端着一锅汤从你身后经过,往桌上摆碗,顺口朝手机的方向喊了一嗓子:"说两句得了啊,饭都要凉了——"又压低声音对你说,"别理他,他就是嘴硬。妈给你盛了汤,喝完再下去忙。"',
  '',
  '"让他先干正事!"父亲在那头听见了,嗓门大了一格,又很快归于公事公办,"信箱里有住户和租约资料。101 报了水管的修,102 那户也去露个面,把人和门牌先认全。都是你的事了。"',
  '',
  '电话挂断。桌上的汤还在冒热气,钥匙串在你手心里沉甸甸的。',
  '',
  '这栋楼,现在是你的了——连同楼里住着的那些人,和他们各自关起门来的日子。',
].join('\n');

/** 序章开局按钮的行动选项(职务引导软引导第一拍;待办清单在客户端) */
const 序章行动选项 = [
  '去信箱区看看这个月的租约单子',
  '去一层大堂检查声控灯和门口的共享伞',
  '去 102 登门认识住户,核对住户资料',
  '去管理员室喝了妈盛的汤,把钥匙和账本理一遍',
];

/**
 * 开始新游戏(客户端难度选择卡调用):写难度档 → 创建第 1 楼固定演出 → 序章完成。
 * 幂等:已完成序章直接拒绝(单向语义随楼层快照走,回档到 0 楼=重开序章)。
 */
export async function 开始新游戏(难度: string): Promise<boolean> {
  if (进行中) {
    eventEmit('人妻公寓:回合失败', '上一轮还没结束,稍等片刻再开始');
    return false;
  }
  进行中 = true;
  try {
    const 档 = 难度表[难度] ? 难度 : '标准';
    const 有效 = 读取最近有效();
    if (!有效) throw new Error('变量还没就绪，请稍等两秒再开始');
    const { data } = 有效;
    if (data.系统._序章完成) {
      console.warn('[人妻公寓] 序章已完成,忽略重复开局');
      eventEmit('人妻公寓:回合失败', '序章已经开始过了'); // 解锁客户端乐观锁(审计 C6)
      return false;
    }
    data.系统._难度 = 档;
    data.系统._序章完成 = true;
    data.现金 = 难度表[档].起始资金;
    data.胜任度 = 难度表[档].起始胜任度;
    // 旧版曾在 0 楼预置工具箱；开始新游戏时必须显式清空，不能把旧变量沿用进新局。
    // 工具箱现在只能花 200 元从商店购买。
    data.背包 = [];

    const 旧 = Mvu.getMvuData({ type: 'message', message_id: -1 });
    const 新 = _.cloneDeep(旧);
    _.set(新, 'stat_data', data);
    await createChatMessages([{ role: 'assistant', message: 父亲来电正文, data: 新 }], { refresh: 'none' });
    捕获保护快照(data);
    await insertOrAssignVariables({ _行动选项: 序章行动选项 }, { type: 'chat' });

    console.info(`[人妻公寓] 序章开局完成(难度:${档},起始资金:${难度表[档].起始资金})`);
    await 记录数据库回合(getLastMessageId(), data, '开始新游戏', 父亲来电正文, [], []);
    await 广播生成完成事件();
    eventEmit('人妻公寓:回合完成');
    return true;
  } catch (e) {
    console.error('[人妻公寓] 序章开局失败:', e);
    eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    return false;
  } finally {
    进行中 = false;
  }
}

/**
 * 重开一局(设置弹窗二次确认后调用):删掉 0 楼以上全部楼层 + 把 0 楼 stat 重写成出厂态。
 * 不再假设"0 楼天然纯净"(2026-07-17 双 bug 修复):0 楼的 户 表可能是空的(首批入住是
 * 过程中某一楼才写进去的),_序章完成 也可能残留 true——只删楼会得到户表空+已完成的残缺态,
 * 导致地图没人 + 要重开两次才碰巧刷对。改为显式重建:Schema.parse({}) 出厂默认 + 首批入住,
 * 写回 0 楼(=删楼后的 -1)。chat 过程变量全清,晋阶镜像必须显式清(镜像直写不校验楼层作废,
 * 残留旧局镜像会把旧阶段"取大"进新局,防护9 反向路径)。
 */
export async function 重开一局(): Promise<void> {
  if (进行中) {
    // 静默返回=客户端 发送中 永久闩死只能刷新页面(2026-07-26 审计 C6 最易触发路径)
    eventEmit('人妻公寓:回合失败', '上一轮还没结束,稍等片刻再重开');
    return;
  }
  进行中 = true;
  try {
    const 末楼 = getLastMessageId();
    if (末楼 >= 1) await deleteChatMessages(_.range(1, 末楼 + 1), { refresh: 'none' });

    // 过程变量与镜像先清(镜像清在重建首批入住之前,避免旧镜像并入新出厂态)
    await updateVariablesWith(
      vars => {
        for (const 键 of [
          ...回合变量键,
          '_上次回合',
          '_上次隔离回合',
          '_隔离事件',
          '_在场',
          '_行动选项',
          '_粘滞',
          '_待办',
          '_侦探',
          '_摄像头',
          '_微信',
          '_经济',
          '_赴约',
          '_工具由头',
          '_换装余波',
          '_行动锚窗',
          PROMOTE_MIRROR_KEY,
        ]) {
          _.set(vars, 键, null);
        }
        return vars;
      },
      { type: 'chat' },
    );
    清保护快照();

    // 0 楼 stat 重写成出厂态:默认值 + 首批入住(与 index.确保首批入住 同一套模板)
    const 出厂 = Schema.parse({}) as SchemaType;
    for (const m of 首批门牌) {
      出厂.户[m] = 创建配置户节点(m, 0);
      镜像直写(m, { 入住楼层: 0 });
    }
    const 旧raw = Mvu.getMvuData({ type: 'message', message_id: -1 });
    await 脚本写入(旧raw, 出厂);
    捕获保护快照(出厂);
    await 同步入住世界书条目(出厂);

    console.info('[人妻公寓] 重开一局:楼层已删,0楼 stat 重建为出厂态(首批入住已就位)');
    eventEmit('人妻公寓:已重开');
  } catch (e) {
    console.error('[人妻公寓] 重开一局失败:', e);
    eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
  } finally {
    进行中 = false;
  }
}
