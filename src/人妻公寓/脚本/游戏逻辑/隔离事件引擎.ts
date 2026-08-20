import { Schema, 当前MVU数据版本, type SchemaType } from '../../schema';
import { 数据库状态, 通过数据库生成 } from './数据库桥';
import { 全局数据库AI租约 } from './数据库AI租约';
import { 前台生成租约持有中, 取得前台生成租约, 手机生成租约持有中 } from './生成通道互斥';
import { 当前正文模型是DeepSeek } from './正文模型识别';
import { 预设破限段 } from './预设桥';
import { 清洗预设输出 } from './预设输出兼容';
import { 严格清除协议残留 } from './严格正文清洗';
import { 当前聊天ID } from './手机/运行时上下文';
import { 捕获精确聊天快照, 恢复精确聊天快照, 时间状态指纹, type 精确聊天快照 } from './时间撤销系统';

export type 隔离事件类型 = '荣耀洞' | '监控' | '晨跑' | '健身' | '睡眠';

/**
 * 当前时间按钮只会为睡眠请求日常反馈；晨跑/健身类型为旧日志和旧调用兼容而保留。
 * 若这些兼容类型被显式调用，仍必须走可由 stopAllGeneration() 取消的正文 generateRaw，
 * 不能改走无法取消底层请求的数据库代发。荣耀洞/监控维持原有分流。
 */
function 是日常时间反馈(类型: 隔离事件类型): boolean {
  return 类型 === '晨跑' || 类型 === '健身' || 类型 === '睡眠';
}

export type 隔离事件生成通道 = '数据库' | '正文';

/**
 * 隔离事件生成通道决策表（纯函数，供行为测试与生成草稿共用）：
 *  - 睡眠及为旧版兼容保留的晨跑/健身类型恒为正文 generateRaw——数据库 callAI 没有
 *    abort 信号，迟到请求仍占用生成槽，与玩家取消语义冲突；
 *  - 荣耀洞/监控：数据库可调用时走数据库代发，否则才回退正文。数据库代理使用自己的
 *    独立模型，普通正文当前使用什么模型不得参与这里的通道判断。
 */
export function 选择隔离事件生成通道(类型: 隔离事件类型, 数据库可用: boolean): 隔离事件生成通道 {
  if (是日常时间反馈(类型)) return '正文';
  return 数据库可用 ? '数据库' : '正文';
}

/** 供正文 PROMPT_READY 监听器识别脚本自己的短生成，避免误占原生正文锁。 */
export const 隔离事件请求标记 = '<rqgy_isolated_event_request>';

export interface 隔离事件日志条 {
  id: string;
  类型: 隔离事件类型;
  线程: string;
  谁: '玩家' | '叙事';
  文本: string;
  锚楼: number;
  序: number;
  房间: string;
  提示词?: string;
  时间: number;
}

interface 隔离事件库 {
  日志: 隔离事件日志条[];
}

export interface 隔离事件参数 {
  类型: 隔离事件类型;
  线程: string;
  行动: string;
  导演事件: string;
  房间: string;
}

/**
 * AI 已经生成、但尚未写入任何聊天变量的隔离事件草稿。
 * 时间动作会把它与撤销点放进同一个 chat 更新回调，避免切换聊天时留下“演了却没结算”的幽灵日志。
 */
export interface 隔离事件草稿 {
  参数: 隔离事件参数;
  正文: string;
  提示词: string;
}

const 最大日志条数 = 120;
let 生成中 = false;
let 已取消 = false;

export const 隔离事件进行中 = () => 生成中;

export function 取消隔离事件(): boolean {
  if (!生成中) return false;
  已取消 = true;
  try {
    stopAllGeneration();
  } catch {
    /* 数据库 callAI 不一定走酒馆生成器；仍会在返回后丢弃结果。 */
  }
  return true;
}

function 从变量读库(vars: unknown): 隔离事件库 {
  const 原 = _.get(vars, '_隔离事件') as Partial<隔离事件库> | undefined;
  return { 日志: Array.isArray(原?.日志) ? 原.日志.filter(Boolean) : [] };
}

function 读库(): 隔离事件库 {
  return 从变量读库(getVariables({ type: 'chat' }));
}

export function 净化隔离事件正文(原文: string): string {
  const 闭合清 = 严格清除协议残留(清洗预设输出(原文).文本)
    .replace(/^[\s\S]*?<content\b[^>]*>/i, '')
    .replace(/<\/content\s*>[\s\S]*$/i, '')
    .replace(/【开始思考】[\s\S]*?<\/think_fox~\s*>/gi, '')
    .replace(/<fox_selc\b[^>]*>[\s\S]*?<\/fox_selc\s*>/gi, '')
    .replace(/<fox_tip\b[^>]*>[\s\S]*?<\/fox_tip\s*>/gi, '')
    .replace(/<\/?(?:content|think_fox~|fox_selc|fox_tip)(?:\s[^>]*)?>/gi, '')
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<\/draft_notes\s*>/gi, '')
    .replace(/<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<CEstuff\b[^>]*>[\s\S]*?<\/CEstuff\s*>/gi, '')
    .replace(/<\/?(?:draft_notes|bginfor|CEstuff)\b[^>]*>/gi, '')
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<options>[\s\S]*?<\/options>/gi, '')
    .replace(/<行为等级>[\s\S]*?<\/行为等级>/g, '')
    .replace(/<尺度判定(?:\s[^>]*)?>[\s\S]*?(?:<\/尺度判定\s*>|$)/gi, '')
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*?```/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?<\/html\s*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<StatusPlaceHolderImpl\/>/g, '')
    // 兼容把裸 <p> 当换行、却不输出闭合标签的玩家预设；保留其后的事件正文。
    .replace(/<\/?p(?:\s[^>]*)?>/gi, '\n')
    .replace(/<\/?div[^>]*>/gi, '')
    .trim();
  const 全清 = 闭合清
    .replace(/<think(?:ing)?>[\s\S]*$/i, '')
    .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
    .replace(/<UpdateVariable>[\s\S]*$/i, '')
    .replace(/<options>[\s\S]*$/i, '')
    .replace(/<行为等级>[\s\S]*$/i, '')
    .replace(/<尺度判定(?:\s[^>]*)?>[\s\S]*$/i, '')
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*$/i, '')
    .replace(/<!DOCTYPE[\s\S]*$/i, '')
    .replace(/<style[^>]*>[\s\S]*$/i, '')
    .replace(/<script[^>]*>[\s\S]*$/i, '')
    .replace(/<!--[\s\S]*$/, '')
    .trim();
  return 严格清除协议残留(全清);
}

function 系统提示(类型: 隔离事件类型, 导演事件: string): string {
  return [
    隔离事件请求标记,
    '你正在为《人妻公寓》生成一段独立的' + 类型 + '事件。',
    '这是事件专用短线程，不是普通公寓正文。只承接下方显式提供的最近事件内容，不得假定看过其他聊天历史。',
    '角色只知道亲眼所见、亲耳所闻和本事件明确告知的信息；禁止反全知，禁止让事件外的人凭空知情。',
    '只输出可直接显示的中文叙事与台词；不输出变量、选项、行为等级、思维链、HTML 或 Markdown 代码块。',
    '【本拍导演指令】' + 导演事件,
  ].join('\n');
}

/**
 * 玩家预设的 chatHistory 后段可能以 assistant/system 角色收尾。DeepSeek 的独立请求
 * 以真实 user 消息收尾更稳定；这样既保留预设注入，也明确要求模型现在给出最终事件正文。
 */
const 隔离事件收尾 = '以上设定与本拍行动均已给出。现在只输出这一拍可直接显示的中文事件正文。';
// 推理模型的思考 token 也计入 max_tokens,旧值1400会被 reasoning 烧光后 length 截断、
// 正文为空(2026-08-04,与手机系统同因);正文篇幅仍由提示词约束。
// 8192 是全模型安全上限:再高 DeepSeek chat(输出上限8192)等模型会 400 拒绝请求;
// 非推理模型写完自然停,不会真用满这个预算。
const 普通隔离事件生成上限 = 8192;

function 最近线程(线程: string): { role: 'user' | 'assistant'; content: string }[] {
  return 读库()
    .日志.filter(条 => 条.线程 === 线程)
    .slice(-4)
    .map(条 => ({ role: 条.谁 === '玩家' ? 'user' : 'assistant', content: 条.文本 }));
}

/** 只调用 AI 并返回草稿；本函数成功时仍不会改动聊天变量。 */
export async function 生成隔离事件草稿(参数: 隔离事件参数): Promise<隔离事件草稿> {
  if (生成中) throw new Error('另一段独立事件正在生成，请等待完成后重试。');
  // 数据库 AI 迟到租约：底层 callAI 无法取消，超时后仍占用 TavernHelper 生成槽；忙时
  // 明确失败且零 AI 调用（不建临时楼、不发生成开始）。抛出可行动原因，由调用方统一广播，
  // 避免把“上一请求仍在结算”误报成 AI 没有正文。
  if (全局数据库AI租约.在结算()) {
    throw new Error('数据库AI仍在结算上一轮请求，请稍等片刻后重试。');
  }
  // 共享前台生成租约：前台正文在途时隔离短生成不得反向占用生成槽；取得失败明确失败、
  // 零 AI 调用。本租约只保护本函数 AI 生成期，后续纯提交仍由既有事务/时间线租约负责。
  const 前台租约 = 取得前台生成租约();
  if (!前台租约) {
    if (手机生成租约持有中()) throw new Error('手机后台消息正在生成，请等待完成后重试。');
    if (前台生成租约持有中()) throw new Error('正文或另一独立事件正在生成，请等待完成后重试。');
    throw new Error('生成通道刚被其他请求占用，请稍后重试。');
  }
  // 生成中 置位与 生成开始 广播都放进 try：监听器抛错也不得泄漏共享前台租约，
  // 统一由 finally 释放（含成功/失败/取消全部路径）。
  try {
    生成中 = true;
    已取消 = false;
    eventEmit('人妻公寓:生成开始');
    const system = 系统提示(参数.类型, 参数.导演事件);
    const history = 最近线程(参数.线程);
    // 预设破限段护航(2026-07-27):特殊场景正戏最敏感,裸发必被 Gemini 安全截断
    // 独立事件没有真实临时玩家楼,传入本拍行动让预设里的 {{lastUserMessage}} 展开为
    // 本拍行动,而不是真实聊天的上一楼玩家指令。
    const { 前, 后 } = 预设破限段(参数.行动);
    // 核心段单列:存档日志(史册考古的"提示词"字段)只记核心,预设破限段不进 chat 变量(防存档膨胀)
    const 核心段: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: system },
      ...history,
    ];
    // generateRaw 可能返回 GenerateToolCallResult(本卡不传 tools,该分支不触发),统一按 unknown 收
    let 原文: unknown;
    let 本拍用户输入 = 参数.行动;
    // 通道决策收在纯函数 选择隔离事件生成通道：日常时间反馈(晨跑/健身/睡眠)恒走可取消的
    // 正文 generateRaw——数据库 callAI 的 90 秒超时无法取消底层请求，超时后会留下占用生成槽
    // 的迟到请求，下一次点击就会被误判为“正文有内容在输出”；荣耀洞/监控只按数据库可调用性
    // 选择数据库代发，不读取普通正文模型。数据库分支返回空或抛错只失败一次，不允许再自动
    // 请求正文 API（避免二次计费）。只有实际回退正文时才启用对应模型的生成兼容。
    const 通道 = 选择隔离事件生成通道(参数.类型, 数据库状态().可调用AI);
    if (通道 === '数据库') {
      原文 = await 通过数据库生成(
        [...前, { role: 'system', content: system }, ...history, { role: 'user', content: 参数.行动 }, ...后],
        '',
        普通隔离事件生成上限,
      );
      if (!String(原文 ?? '').trim()) throw new Error('数据库 AI 返回空内容；为避免重复计费，本拍没有再次请求正文 API');
    } else {
      const 是DeepSeek = 当前正文模型是DeepSeek();
      本拍用户输入 = 是DeepSeek ? `${参数.行动}\n\n${隔离事件收尾}` : 参数.行动;
      const ordered_prompts: ({ role: 'system' | 'user' | 'assistant'; content: string } | 'user_input')[] = [
        ...前,
        ...核心段,
        ...(是DeepSeek ? [...后, 'user_input' as const] : ['user_input' as const, ...后]),
      ];
      原文 = await generateRaw({ ordered_prompts, user_input: 本拍用户输入, should_stream: 是DeepSeek });
    }
    if (已取消) throw new Error('已取消——这一拍没有发生');
    const 正文 = 净化隔离事件正文(String(原文 ?? ''));
    if (!正文) throw new Error('事件 AI 没有返回可显示的正文');

    const 提示词 = [...核心段, { role: 'user' as const, content: 本拍用户输入 }]
      .map(项 => 项.role.toUpperCase() + '\n' + 项.content)
      .join('\n\n');
    return { 参数: { ...参数 }, 正文, 提示词 };
  } finally {
    生成中 = false;
    前台租约.释放();
  }
}

/** 在调用方已经锁定并校验过的 chat 变量对象中，同步追加一份草稿。 */
export function 写入隔离事件草稿(vars: Record<string, unknown>, 草稿: 隔离事件草稿, 锚楼: number): void {
  if (!Number.isInteger(锚楼) || 锚楼 < 0) throw new Error('隔离事件日志锚楼无效');
  const 库 = 从变量读库(vars);
  const 序起 = 库.日志.filter(条 => 条.锚楼 === 锚楼).reduce((max, 条) => Math.max(max, 条.序), -1) + 1;
  const 时间 = Date.now();
  const 基 = 草稿.参数.类型 + '-' + 时间;
  库.日志.push(
    {
      id: 基 + '-u',
      类型: 草稿.参数.类型,
      线程: 草稿.参数.线程,
      谁: '玩家',
      文本: 草稿.参数.行动,
      锚楼,
      序: 序起,
      房间: 草稿.参数.房间,
      时间,
    },
    {
      id: 基 + '-a',
      类型: 草稿.参数.类型,
      线程: 草稿.参数.线程,
      谁: '叙事',
      文本: 草稿.正文,
      锚楼,
      序: 序起 + 1,
      房间: 草稿.参数.房间,
      // 荣耀洞/监控保留史册考古提示；例行训练与睡眠只保留可见反馈，避免把当天正文
      // 素材复制进长期 chat 变量、无谓放大存档。
      ...(草稿.参数.类型 === '荣耀洞' || 草稿.参数.类型 === '监控' ? { 提示词: 草稿.提示词 } : {}),
      时间,
    },
  );
  库.日志 = 库.日志.slice(-最大日志条数);
  _.set(vars, '_隔离事件', 库);
}

/** 隔离事件双存储提交覆盖的业务聊天键：可见日志与撤回/重掷记录。 */
export const 隔离提交聊天键 = ['_隔离事件', '_上次隔离回合'] as const;

/** 中断恢复聊天键：业务键之外还覆盖监控的软冷却/待选与场景，恢复时逐键精确还原。 */
export const 隔离恢复聊天键 = [...隔离提交聊天键, '_侦探', '_场景'] as const;

/** 隔离事件持久事务键：切聊天重载 iframe 后由启动恢复能力回滚，参照 `_时间推进事务`。 */
export const 隔离事件事务键 = '_隔离事件事务';
export const 隔离事件事务版本 = 1 as const;

export interface 隔离事件事务记录 {
  版本: typeof 隔离事件事务版本;
  事务ID: string;
  聊天ID: string;
  创建时间: number;
  /** 提交前完整 MVU；荣耀洞=本拍开始前 data（含首点已烧冷却/当前拍），监控=入口 data快照。 */
  提交前数据: SchemaType;
  提交前数据指纹: string;
  /** 提交前四键精确聊天快照（`_隔离事件`/`_上次隔离回合`/`_侦探`/`_场景`），保留不存在/null/undefined。 */
  提交前聊天: 精确聊天快照;
  提交前聊天指纹: string;
  /** 覆盖 事务ID/聊天ID/创建时间/数据指纹/聊天指纹 的记录完整性指纹；篡改任一项都会被读取拒绝。 */
  完整性指纹: string;
}

function 是记录(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function 隔离读MVU版本(value: unknown): number | undefined {
  if (!是记录(value) || !是记录(value.系统)) return undefined;
  const 版本 = Number(value.系统._数据版本);
  return Number.isInteger(版本) ? 版本 : undefined;
}

function 隔离聊天快照包含键(value: unknown, keys: readonly string[]): value is 精确聊天快照 {
  if (!是记录(value)) return false;
  return keys.every(key => {
    const item = (value as Record<string, unknown>)[key];
    return (
      是记录(item) &&
      typeof (item as { 存在?: unknown }).存在 === 'boolean' &&
      Object.prototype.hasOwnProperty.call(item, '值') &&
      ((item as { 值未定义?: unknown }).值未定义 === undefined ||
        typeof (item as { 值未定义?: unknown }).值未定义 === 'boolean') &&
      (!(item as { 值未定义?: unknown }).值未定义 || Boolean((item as { 存在?: unknown }).存在))
    );
  });
}

/** 事务 ID 的唯一熵：优先 crypto.randomUUID()；运行时无则用毫秒+双随机数回退，避免同毫秒碰撞。 */
function 生成隔离事务ID(): string {
  const 加密 = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof 加密?.randomUUID === 'function') return `iso-${加密.randomUUID()}`;
  return `iso-${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

/** 创建持久事务记录；提交前数据必须通过 Schema 与当前 MVU 版本校验，快照必须覆盖四键。 */
export function 创建隔离事件事务记录(参数: {
  聊天ID: string;
  提交前数据: SchemaType;
  提交前聊天: 精确聊天快照;
}): 隔离事件事务记录 {
  if (!参数.聊天ID) throw new Error('隔离事件事务缺少聊天身份');
  if (!隔离聊天快照包含键(参数.提交前聊天, 隔离恢复聊天键)) throw new Error('隔离事件事务的聊天快照不完整');
  const 提交前数据 = Schema.parse(_.cloneDeep(参数.提交前数据)) as SchemaType;
  if (隔离读MVU版本(提交前数据) !== 当前MVU数据版本) throw new Error('隔离事件事务只能保存当前版本 MVU');
  const 提交前聊天 = _.cloneDeep(参数.提交前聊天) as 精确聊天快照;
  const 创建时间 = Date.now();
  const 事务ID = 生成隔离事务ID();
  const 提交前数据指纹 = 时间状态指纹(提交前数据);
  const 提交前聊天指纹 = 时间状态指纹(提交前聊天);
  return {
    版本: 隔离事件事务版本,
    事务ID,
    聊天ID: 参数.聊天ID,
    创建时间,
    提交前数据,
    提交前数据指纹,
    提交前聊天,
    提交前聊天指纹,
    完整性指纹: 时间状态指纹([事务ID, 参数.聊天ID, 创建时间, 提交前数据指纹, 提交前聊天指纹]),
  };
}

/** 损坏/被篡改记录返回 null；调用方必须停止玩法而非猜测恢复。 */
export function 读取隔离事件事务记录(raw: unknown): 隔离事件事务记录 | null {
  if (
    !是记录(raw) ||
    raw.版本 !== 隔离事件事务版本 ||
    typeof raw.事务ID !== 'string' ||
    !raw.事务ID ||
    typeof raw.聊天ID !== 'string' ||
    !raw.聊天ID ||
    typeof raw.创建时间 !== 'number' ||
    !Number.isFinite(raw.创建时间) ||
    typeof raw.提交前数据指纹 !== 'string' ||
    typeof raw.提交前聊天指纹 !== 'string' ||
    typeof raw.完整性指纹 !== 'string' ||
    !隔离聊天快照包含键(raw.提交前聊天, 隔离恢复聊天键)
  ) {
    return null;
  }
  const 解析 = Schema.safeParse(_.cloneDeep(raw.提交前数据));
  if (!解析.success || 隔离读MVU版本(解析.data) !== 当前MVU数据版本) return null;
  const 提交前数据 = 解析.data as SchemaType;
  const 提交前聊天 = _.cloneDeep(raw.提交前聊天) as 精确聊天快照;
  if (
    时间状态指纹(提交前数据) !== raw.提交前数据指纹 ||
    时间状态指纹(提交前聊天) !== raw.提交前聊天指纹 ||
    时间状态指纹([raw.事务ID, raw.聊天ID, raw.创建时间, raw.提交前数据指纹, raw.提交前聊天指纹]) !==
      raw.完整性指纹
  ) {
    return null;
  }
  return {
    版本: 隔离事件事务版本,
    事务ID: raw.事务ID,
    聊天ID: raw.聊天ID,
    创建时间: raw.创建时间,
    提交前数据,
    提交前数据指纹: raw.提交前数据指纹,
    提交前聊天,
    提交前聊天指纹: raw.提交前聊天指纹,
    完整性指纹: raw.完整性指纹,
  };
}

/**
 * 生成前捕获的时间线身份：聊天 ID、锚楼与锚楼消息对象引用。
 * 旧请求绝不能把日志写进切走后的新聊天/新分支——生成返回后、写 stat 前、chat updater
 * 内都要用它复核（复核同时查 操作仍有效 所辖的世代与分支）。
 */
export interface 隔离时间线身份 {
  聊天ID: string;
  锚楼: number;
  锚消息: unknown;
}

function 隔离当前锚楼(): number {
  try {
    return getLastMessageId();
  } catch {
    return Math.max(0, (SillyTavern.chat?.length ?? 1) - 1);
  }
}

export function 捕获隔离时间线身份(): 隔离时间线身份 {
  const 锚楼 = 隔离当前锚楼();
  return { 聊天ID: 当前聊天ID(), 锚楼, 锚消息: SillyTavern.chat?.[锚楼] };
}

export function 复核隔离时间线身份(身份: 隔离时间线身份, 操作仍有效: () => boolean): void {
  if (!操作仍有效()) throw new Error('消息分支已经变化，本拍隔离事件已取消');
  if (当前聊天ID() !== 身份.聊天ID) throw new Error('切换聊天导致本拍隔离事件已取消');
  const 锚楼 = 隔离当前锚楼();
  if (锚楼 !== 身份.锚楼) throw new Error('当前楼层已经变化，本拍隔离事件已取消');
  if (SillyTavern.chat?.[身份.锚楼] !== 身份.锚消息) throw new Error('锚楼消息已经变化，本拍隔离事件已取消');
}

/** 事务提交前四键业务聊天快照必须仍是原样；并发改写说明状态已漂移，不允许在此之上提交。 */
function 核对隔离业务快照(vars: Record<string, unknown>, 提交前聊天: 精确聊天快照): void {
  const 当前 = 捕获精确聊天快照(vars, 隔离恢复聊天键);
  if (时间状态指纹(当前) !== 时间状态指纹(提交前聊天)) {
    throw new Error('隔离事件提交期间聊天变量发生变化，请重新操作');
  }
}

export interface 隔离事务准备参数 {
  身份: 隔离时间线身份;
  操作仍有效: () => boolean;
  提交前数据: SchemaType;
  /** 未传时在准备阶段从当前聊天捕获四键精确快照；监控传 建隔离记录 早先捕获的快照。 */
  提交前聊天?: 精确聊天快照;
}

export interface 已准备隔离事务 {
  记录: 隔离事件事务记录;
  提交前聊天: 精确聊天快照;
}

/**
 * 隔离事务准备阶段（可显式调用、可测试）：复核身份与四键业务基线、检查任意遗留事务，
 * 先在当前聊天同步 updater 内持久写 `_隔离事件事务`，成功后才返回事务句柄。
 * `_隔离事件事务` 键只要存在（无论记录有效、损坏、null 还是 undefined）都拒绝新提交并
 * 保留原值；损坏记录交由启动恢复明示停机，绝不能因 `读取...()` 返回 null 就覆盖。
 */
export async function 准备隔离事件事务(参数: 隔离事务准备参数): Promise<已准备隔离事务> {
  复核隔离时间线身份(参数.身份, 参数.操作仍有效);
  const 提交前聊天 =
    参数.提交前聊天 ?? 捕获精确聊天快照(getVariables({ type: 'chat' }), 隔离恢复聊天键);
  const 记录 = 创建隔离事件事务记录({
    聊天ID: 参数.身份.聊天ID,
    提交前数据: 参数.提交前数据,
    提交前聊天,
  });
  try {
    await Promise.resolve(
      updateVariablesWith(
        vars => {
          复核隔离时间线身份(参数.身份, 参数.操作仍有效);
          if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，隔离事件事务准备失败');
          if (Object.prototype.hasOwnProperty.call(vars, 隔离事件事务键)) {
            throw new Error('存在未完成的隔离事件事务，请刷新当前聊天后再操作');
          }
          核对隔离业务快照(vars as Record<string, unknown>, 提交前聊天);
          vars[隔离事件事务键] = _.cloneDeep(记录);
          return vars;
        },
        { type: 'chat' },
      ),
    );
  } catch (error) {
    // 宿主在 updater 已执行后报错时仍可能把本事务写入聊天；只删“确属本事务”的记录，
    // 绝不删除其他/损坏/非本事务记录，避免形成无人持有的半事务。清理只能在原操作/聊天仍
    // 有效时调用 chat updater（updater 内再次复核身份）；身份已变时不接触新聊天，旧记录
    // 留待启动恢复按“键存在即停机”处理。
    if (参数.操作仍有效() && 当前聊天ID() === 参数.身份.聊天ID) {
      try {
        await Promise.resolve(
          updateVariablesWith(
            vars => {
              if (!(参数.操作仍有效() && 当前聊天ID() === 参数.身份.聊天ID)) {
                throw new Error('聊天或分支已经变化，不能清理隔离事件事务');
              }
              if (!vars || typeof vars !== 'object') return vars;
              const 现有 = 读取隔离事件事务记录(vars[隔离事件事务键]);
              if (现有 && 现有.事务ID === 记录.事务ID) delete vars[隔离事件事务键];
              return vars;
            },
            { type: 'chat' },
          ),
        );
      } catch {
        /* 清理失败不吞原始错误；遗留记录由启动恢复按“键存在即停机”处理。 */
      }
    }
    throw error;
  }
  return { 记录, 提交前聊天 };
}

export interface 顺序提交隔离事件参数 {
  /** 已生成的纯内存草稿；只有它成功且时间线仍有效才会写入。 */
  草稿: 隔离事件草稿;
  /** 与两条隔离日志在同一 chat 回调内写入的撤回/重掷记录。 */
  记录: unknown;
  /** 隔离日志锚楼（必须与 身份.锚楼 一致）。 */
  锚楼: number;
  /** 事务提交前完整 MVU：荣耀洞=本拍开始前 data；监控=入口记录的 data快照。 */
  提交前数据: SchemaType;
  /** 已准备事务（监控在 查看摄像头 之前准备，跨越整个 AI 生成期）；未传时内部准备（荣耀洞）。 */
  事务?: 已准备隔离事务;
  /** 写核心 stat：荣耀洞推进拍 / 监控上报线路后写回。 */
  写核心: () => void | Promise<unknown>;
  /** 恢复核心 stat：荣耀洞=本拍开始前 data；监控=入口记录的 data快照。 */
  恢复核心: () => void | Promise<unknown>;
  /** 生成前捕获的时间线身份。 */
  身份: 隔离时间线身份;
  操作仍有效: () => boolean;
}

/**
 * 隔离事件双存储顺序提交：事务记录必须在核心写入前已落盘（由 准备隔离事件事务 或内部准备
 * 保证），核心成功后只在同一同步 updater 内复核身份与同一事务 ID、追加两条日志、写
 * `_上次隔离回合`、删除事务记录——只有这一步成功才算提交完成。
 * 补偿用显式阶段标志：只有本事务记录已建立且核心确实开始尝试才恢复核心；只有当前聊天中的
 * 记录确为本事务（或最终 updater 已同步执行后宿主才报错）才恢复聊天。缺记录、损坏记录、
 * 其他事务记录都不能猜测为本事务并覆盖。身份已变绝不向新时间线写回，事务记录留在原聊天
 * 等待 `恢复中断隔离提交` 恢复。
 */
export async function 顺序提交隔离事件(参数: 顺序提交隔离事件参数): Promise<void> {
  复核隔离时间线身份(参数.身份, 参数.操作仍有效);
  const 已准备 =
    参数.事务 ??
    (await 准备隔离事件事务({
      身份: 参数.身份,
      操作仍有效: 参数.操作仍有效,
      提交前数据: 参数.提交前数据,
    }));
  const 事务ID = 已准备.记录.事务ID;
  const 提交前聊天 = 已准备.提交前聊天;
  // 已准备事务（监控路径）：核心开始前必须先复核当前聊天仍是同一有效事务——事务键缺失、
  // 记录损坏或已换成其他事务都立即失败，保证 写核心/恢复核心 均不被调用，也不做补偿猜测。
  if (参数.事务) {
    复核隔离时间线身份(参数.身份, 参数.操作仍有效);
    const 当前事务 = 读取隔离事件事务记录(getVariables({ type: 'chat' })[隔离事件事务键]);
    if (!当前事务 || 当前事务.事务ID !== 事务ID) {
      throw new Error('隔离事件事务记录已经变化');
    }
  }
  let 核心已开始 = false;
  let 最终已执行 = false;
  const 仍在本时间线 = () => 参数.操作仍有效() && 当前聊天ID() === 参数.身份.聊天ID;
  try {
    核心已开始 = true;
    await 参数.写核心();
    await Promise.resolve(
      updateVariablesWith(
        vars => {
          复核隔离时间线身份(参数.身份, 参数.操作仍有效);
          if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，本拍隔离事件已取消');
          const 当前事务 = 读取隔离事件事务记录(vars[隔离事件事务键]);
          if (!当前事务 || 当前事务.事务ID !== 事务ID) throw new Error('隔离事件事务记录已经变化');
          写入隔离事件草稿(vars as Record<string, unknown>, 参数.草稿, 参数.锚楼);
          _.set(vars, '_上次隔离回合', 参数.记录);
          delete vars[隔离事件事务键];
          最终已执行 = true;
          return vars;
        },
        { type: 'chat' },
      ),
    );
  } catch (error) {
    const 补偿错误: string[] = [];
    try {
      if (!核心已开始 || !仍在本时间线()) {
        throw new Error('核心尚未开始或时间线已变化，不能恢复核心；事务记录留在原聊天等待恢复');
      }
      await 参数.恢复核心();
    } catch (补偿) {
      补偿错误.push(`MVU 回滚失败:${补偿 instanceof Error ? 补偿.message : String(补偿)}`);
    }
    try {
      if (!仍在本时间线()) throw new Error('聊天或分支已经变化，不能跨时间线写回业务聊天');
      await Promise.resolve(
        updateVariablesWith(
          vars => {
            if (!仍在本时间线()) throw new Error('聊天或分支已经变化，不能跨时间线写回业务聊天');
            if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，本拍隔离事件已取消');
            const 当前事务 = 读取隔离事件事务记录(vars[隔离事件事务键]);
            if (当前事务) {
              if (当前事务.事务ID !== 事务ID) throw new Error('隔离事件事务记录已经变化');
              恢复精确聊天快照(vars as Record<string, unknown>, 提交前聊天, 隔离恢复聊天键);
              delete vars[隔离事件事务键];
            } else if (最终已执行) {
              // 最终 updater 已同步执行（记录已删、日志已写），宿主随后才报错：恢复四键即可。
              恢复精确聊天快照(vars as Record<string, unknown>, 提交前聊天, 隔离恢复聊天键);
            } else if (Object.prototype.hasOwnProperty.call(vars, 隔离事件事务键)) {
              // 键存在但记录损坏，无法证明是本事务：绝不猜测覆盖。
              throw new Error('隔离事件事务记录损坏，不能猜测为本事务恢复');
            }
            return vars;
          },
          { type: 'chat' },
        ),
      );
    } catch (补偿) {
      补偿错误.push(`聊天回滚失败:${补偿 instanceof Error ? 补偿.message : String(补偿)}`);
    }
    if (补偿错误.length) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}；${补偿错误.join('；')}`, {
        cause: error,
      });
    }
    throw error;
  }
}

export interface 撤销已完成隔离事件事务参数 {
  /** 撤销开始前的当前 MVU；中断或失败时恢复它，让撤销本身保持原子。 */
  当前数据: SchemaType;
  /** 被撤销事件开始前的目标 MVU。 */
  目标数据: SchemaType;
  /** 当前 `_上次隔离回合` 必须仍与它完全一致，防止旧按钮撤错另一拍。 */
  当前记录: unknown;
  /** 被撤销事件开始前的四键精确聊天快照。 */
  目标聊天: 精确聊天快照;
  身份: 隔离时间线身份;
  操作仍有效: () => boolean;
  写目标核心: () => void | Promise<unknown>;
  恢复当前核心: () => void | Promise<unknown>;
}

function 核对已完成隔离记录(vars: unknown, 预期记录: unknown): void {
  if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，不能撤销隔离事件');
  const 当前记录 = (vars as Record<string, unknown>)._上次隔离回合;
  if (时间状态指纹(当前记录) !== 时间状态指纹(预期记录)) {
    throw new Error('隔离回合记录已经变化，不能撤销另一拍');
  }
}

/**
 * 已完成隔离事件的撤销/重掷前置恢复也是一次反向双存储事务：
 * 1. 先把“撤销开始前”的当前 MVU 与四键聊天持久放进 `_隔离事件事务`；
 * 2. 写回事件前目标 MVU；
 * 3. 在同一 chat updater 内复核身份、事务 ID 与当前回合记录，精确恢复事件前四键并删事务。
 *
 * 任一步失败且仍在原时间线时，补偿回撤销开始前的当前 MVU/聊天；切换聊天或刷新时不跨
 * 时间线写回，持久事务留在原聊天，由启动恢复把“半撤销”取消。这样不会出现数值已退回、
 * 但隔离日志/场景/侦探状态仍停在事件后的半状态。
 */
export async function 撤销已完成隔离事件事务(参数: 撤销已完成隔离事件事务参数): Promise<void> {
  复核隔离时间线身份(参数.身份, 参数.操作仍有效);
  if (!隔离聊天快照包含键(参数.目标聊天, 隔离恢复聊天键)) {
    throw new Error('隔离回合缺少完整的事件前聊天快照，不能安全撤销');
  }
  // 两份数据都先过当前 Schema；损坏旧记录绝不能在写核心后才暴露。
  Schema.parse(_.cloneDeep(参数.当前数据));
  Schema.parse(_.cloneDeep(参数.目标数据));

  const 当前变量 = getVariables({ type: 'chat' });
  核对已完成隔离记录(当前变量, 参数.当前记录);
  const 当前聊天 = 捕获精确聊天快照(当前变量 as Record<string, unknown>, 隔离恢复聊天键);
  const 已准备 = await 准备隔离事件事务({
    身份: 参数.身份,
    操作仍有效: 参数.操作仍有效,
    提交前数据: 参数.当前数据,
    提交前聊天: 当前聊天,
  });
  const 事务ID = 已准备.记录.事务ID;
  let 核心已开始 = false;
  let 最终已执行 = false;
  const 仍在本时间线 = () => 参数.操作仍有效() && 当前聊天ID() === 参数.身份.聊天ID;

  try {
    // 准备事务后、真正回写 stat 前再复核一次，堵住持久记录落盘后的并发按钮/分支变化。
    复核隔离时间线身份(参数.身份, 参数.操作仍有效);
    const 当前事务 = 读取隔离事件事务记录(getVariables({ type: 'chat' })[隔离事件事务键]);
    if (!当前事务 || 当前事务.事务ID !== 事务ID) throw new Error('隔离事件事务记录已经变化');
    核对已完成隔离记录(getVariables({ type: 'chat' }), 参数.当前记录);

    核心已开始 = true;
    await 参数.写目标核心();
    await Promise.resolve(
      updateVariablesWith(
        vars => {
          复核隔离时间线身份(参数.身份, 参数.操作仍有效);
          if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，不能撤销隔离事件');
          const 事务 = 读取隔离事件事务记录(vars[隔离事件事务键]);
          if (!事务 || 事务.事务ID !== 事务ID) throw new Error('隔离事件事务记录已经变化');
          核对隔离业务快照(vars as Record<string, unknown>, 当前聊天);
          核对已完成隔离记录(vars, 参数.当前记录);
          恢复精确聊天快照(vars as Record<string, unknown>, 参数.目标聊天, 隔离恢复聊天键);
          delete vars[隔离事件事务键];
          最终已执行 = true;
          return vars;
        },
        { type: 'chat' },
      ),
    );
  } catch (error) {
    const 补偿错误: string[] = [];
    try {
      if (!核心已开始 || !仍在本时间线()) {
        throw new Error('撤销核心尚未开始或时间线已变化，事务记录留在原聊天等待恢复');
      }
      await 参数.恢复当前核心();
    } catch (补偿) {
      补偿错误.push(`MVU 回滚失败:${补偿 instanceof Error ? 补偿.message : String(补偿)}`);
    }
    try {
      if (!仍在本时间线()) throw new Error('聊天或分支已经变化，不能跨时间线补偿撤销');
      await Promise.resolve(
        updateVariablesWith(
          vars => {
            if (!仍在本时间线()) throw new Error('聊天或分支已经变化，不能跨时间线补偿撤销');
            if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，不能补偿隔离事件撤销');
            const 事务 = 读取隔离事件事务记录(vars[隔离事件事务键]);
            if (事务) {
              if (事务.事务ID !== 事务ID) throw new Error('隔离事件事务记录已经变化');
              恢复精确聊天快照(vars as Record<string, unknown>, 当前聊天, 隔离恢复聊天键);
              delete vars[隔离事件事务键];
            } else if (最终已执行) {
              // 最终 updater 已同步恢复目标四键并删事务，宿主随后才报错。
              恢复精确聊天快照(vars as Record<string, unknown>, 当前聊天, 隔离恢复聊天键);
            } else if (Object.prototype.hasOwnProperty.call(vars, 隔离事件事务键)) {
              throw new Error('隔离事件事务记录损坏，不能猜测为本事务补偿');
            } else {
              throw new Error('隔离事件事务记录缺失，不能猜测为本事务补偿');
            }
            return vars;
          },
          { type: 'chat' },
        ),
      );
    } catch (补偿) {
      补偿错误.push(`聊天回滚失败:${补偿 instanceof Error ? 补偿.message : String(补偿)}`);
    }
    if (补偿错误.length) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}；${补偿错误.join('；')}`, {
        cause: error,
      });
    }
    throw error;
  }
}

/** 回滚前对当前聊天快照做严格事务核对：键存在、记录有效、事务 ID 相同，任一不满足抛错。 */
function 核对回滚前隔离事务(事务: 隔离事件事务记录): void {
  const vars = getVariables({ type: 'chat' });
  if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，本拍隔离事件已取消');
  if (!Object.prototype.hasOwnProperty.call(vars, 隔离事件事务键)) {
    throw new Error('隔离事件事务记录缺失，不能猜测为本事务恢复');
  }
  const 当前事务 = 读取隔离事件事务记录(vars[隔离事件事务键]);
  if (!当前事务) throw new Error('隔离事件事务记录损坏，不能猜测为本事务恢复');
  if (当前事务.事务ID !== 事务.事务ID) throw new Error('隔离事件事务记录已经变化');
}

/**
 * 按同一事务句柄精确回滚（监控草稿失败/取消时的唯一退款来源）：恢复四键并删除确属本事务
 * 的记录。只允许仍在原聊天/分支时调用；身份/分支变化、事务键缺失、记录损坏、记录已换成
 * 其他事务都抛错且零写入——绝不猜测恢复。可选 恢复核心 回调先经当前聊天快照严格核对同一
 * 有效事务后才被调用（普通提示收口落地失败时把入口 data快照写回 MVU）；核对不满足则抛错、
 * 回调 0 次，MVU/chat 均零写入。身份已变时抛错并保留记录（由启动恢复处理）。
 */
export async function 回滚隔离事件事务(参数: {
  事务: 隔离事件事务记录;
  身份: 隔离时间线身份;
  操作仍有效: () => boolean;
  /** 四键回滚前先把入口 data快照写回 MVU；缺省时只回滚聊天四键。 */
  恢复核心?: () => void | Promise<unknown>;
}): Promise<void> {
  if (!(参数.操作仍有效() && 当前聊天ID() === 参数.身份.聊天ID)) {
    throw new Error('聊天或分支已经变化，不能跨时间线写回业务聊天');
  }
  // 任何 恢复核心 调用以前，先用当前聊天快照严格核对仍持有同一有效事务：键缺失、记录损坏、
  // 事务 ID 不同都立即抛错且 恢复核心 调用 0 次（MVU/chat 均零写入），绝不先改 MVU 再拒绝。
  核对回滚前隔离事务(参数.事务);
  await Promise.resolve(参数.恢复核心?.());
  await Promise.resolve(
    updateVariablesWith(
      vars => {
        if (!(参数.操作仍有效() && 当前聊天ID() === 参数.身份.聊天ID)) {
          throw new Error('聊天或分支已经变化，不能跨时间线写回业务聊天');
        }
        if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，本拍隔离事件已取消');
        if (!Object.prototype.hasOwnProperty.call(vars, 隔离事件事务键)) {
          throw new Error('隔离事件事务记录缺失，不能猜测为本事务恢复');
        }
        const 当前事务 = 读取隔离事件事务记录(vars[隔离事件事务键]);
        if (!当前事务) throw new Error('隔离事件事务记录损坏，不能猜测为本事务恢复');
        if (当前事务.事务ID !== 参数.事务.事务ID) throw new Error('隔离事件事务记录已经变化');
        恢复精确聊天快照(vars as Record<string, unknown>, 参数.事务.提交前聊天, 隔离恢复聊天键);
        delete vars[隔离事件事务键];
        return vars;
      },
      { type: 'chat' },
    ),
  );
}

/**
 * 严格确认本次监控点击不进入隔离 AI（普通提示/已确认/死路）：只在当前聊天仍持有同一有效事务
 * 时才删除记录。身份/分支变化、事务键缺失、记录损坏、ID 不同均抛错且零写入——绝不猜测删除。
 * 保留当前 `_侦探`（该点击合法写入的软冷却/死路计数）；调用方须在 落地 成功后才调用，
 * 身份已变时不接触新聊天，旧聊天事务交给启动恢复整体取消本次点击。
 *
 * 确认失败且仍在本时间线时必须立即整体取消本次点击（不能只报错留到刷新恢复）：先严格证明仍
 * 持有本事务——当前仍持有同一有效事务，或 删除 updater 已同步执行且事务键确实缺失（覆盖
 * updater 已删后宿主才 reject/throw 的歧义窗口）。证明成立才经 恢复核心 写回入口 MVU 快照，
 * 并在同一 chat updater 内精确恢复事务记录里的四键快照、删除仍存在的同一事务键；证明不成立
 * （缺记录/损坏/他事务且 updater 未执行）时 恢复核心 与 chat 均零写入，绝不猜测覆盖。身份已变
 * 绝不写新聊天直接向上抛；MVU/chat 补偿失败与原确认错误合并并保留 cause。
 */
export async function 确认隔离事务无需隔离(参数: {
  事务: 隔离事件事务记录;
  身份: 隔离时间线身份;
  操作仍有效: () => boolean;
  /** 确认失败且仍在本时间线、并已严格证明仍持有本事务时才调用（普通提示收口把入口 data快照写回 MVU）。 */
  恢复核心?: () => void | Promise<unknown>;
}): Promise<void> {
  if (!(参数.操作仍有效() && 当前聊天ID() === 参数.身份.聊天ID)) {
    throw new Error('聊天或分支已经变化，不能删除隔离事件事务记录');
  }
  const 仍在本时间线 = () => 参数.操作仍有效() && 当前聊天ID() === 参数.身份.聊天ID;
  // 闭包阶段标志：删除 updater 已严格核对本事务并同步执行删除。updater 抛错时保持 false，
  // 只凭标志无法证明“记录已删、事务键确实缺失”，从而禁止猜测恢复。
  let 已执行删除 = false;
  try {
    await Promise.resolve(
      updateVariablesWith(
        vars => {
          if (!仍在本时间线()) {
            throw new Error('聊天或分支已经变化，不能删除隔离事件事务记录');
          }
          if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，本拍隔离事件已取消');
          if (!Object.prototype.hasOwnProperty.call(vars, 隔离事件事务键)) {
            throw new Error('隔离事件事务记录缺失，不能确认本次点击');
          }
          const 当前事务 = 读取隔离事件事务记录(vars[隔离事件事务键]);
          if (!当前事务) throw new Error('隔离事件事务记录损坏，不能确认本次点击');
          if (当前事务.事务ID !== 参数.事务.事务ID) throw new Error('隔离事件事务记录已经变化');
          delete vars[隔离事件事务键];
          已执行删除 = true;
          return vars;
        },
        { type: 'chat' },
      ),
    );
  } catch (error) {
    const 补偿错误: string[] = [];
    if (!仍在本时间线()) {
      // 身份/分支已变：绝不调用 恢复核心、绝不写当前新聊天，直接向上抛；旧聊天事务由启动恢复处理。
      throw error;
    }
    // 先严格证明仍持有本事务再补偿：当前仍持有同一有效事务，或 删除 updater 已同步执行且事务键
    // 确实缺失。缺记录/损坏/他事务且 updater 未执行时证明不成立，恢复核心 0 次、chat 0 次。
    const 当前快照 = getVariables({ type: 'chat' });
    const 快照事务 = 读取隔离事件事务记录(
      当前快照 && typeof 当前快照 === 'object' ? 当前快照[隔离事件事务键] : undefined,
    );
    const 可补偿 =
      (快照事务 !== null && 快照事务.事务ID === 参数.事务.事务ID) ||
      (已执行删除 &&
        (!当前快照 ||
          typeof 当前快照 !== 'object' ||
          !Object.prototype.hasOwnProperty.call(当前快照, 隔离事件事务键)));
    if (!可补偿) throw error;
    try {
      await Promise.resolve(参数.恢复核心?.());
    } catch (补偿) {
      补偿错误.push(`MVU 回滚失败:${补偿 instanceof Error ? 补偿.message : String(补偿)}`);
    }
    try {
      if (!仍在本时间线()) throw new Error('聊天或分支已经变化，不能跨时间线写回业务聊天');
      await Promise.resolve(
        updateVariablesWith(
          vars => {
            if (!仍在本时间线()) throw new Error('聊天或分支已经变化，不能跨时间线写回业务聊天');
            if (!vars || typeof vars !== 'object') throw new Error('聊天变量缺失，本拍隔离事件已取消');
            const 当前事务 = 读取隔离事件事务记录(vars[隔离事件事务键]);
            if (当前事务) {
              if (当前事务.事务ID !== 参数.事务.事务ID) throw new Error('隔离事件事务记录已经变化');
              恢复精确聊天快照(vars as Record<string, unknown>, 参数.事务.提交前聊天, 隔离恢复聊天键);
              delete vars[隔离事件事务键];
            } else if (已执行删除) {
              // 删除 updater 已同步执行（记录已删），宿主随后才报错：按闭包证据恢复四键即可。
              恢复精确聊天快照(vars as Record<string, unknown>, 参数.事务.提交前聊天, 隔离恢复聊天键);
            } else if (Object.prototype.hasOwnProperty.call(vars, 隔离事件事务键)) {
              // 键存在但记录损坏，无法证明是本事务：绝不猜测覆盖。
              throw new Error('隔离事件事务记录损坏，不能猜测为本事务恢复');
            } else {
              // 键缺失且本删除 updater 未同步执行（如 恢复核心 的 await 窗口内事务被并发删除）：
              // 无闭包证据证明记录已删，缺记录不能猜测为本事务恢复，必须明示聊天回滚失败。
              throw new Error('隔离事件事务记录缺失，不能猜测为本事务恢复');
            }
            return vars;
          },
          { type: 'chat' },
        ),
      );
    } catch (补偿) {
      补偿错误.push(`聊天回滚失败:${补偿 instanceof Error ? 补偿.message : String(补偿)}`);
    }
    if (补偿错误.length) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}；${补偿错误.join('；')}`, {
        cause: error,
      });
    }
    throw error;
  }
}

/**
 * 启动恢复：当前聊天留有 `_隔离事件事务` 时，调用方把提交前 MVU 写回最近有效楼层（幂等，
 * 不记成长），再用同步 chat updater 复核同一事务 ID 后精确恢复四键（`_隔离事件`/
 * `_上次隔离回合`/`_侦探`/`_场景`）并删除事务记录。无记录返回 false；记录损坏、聊天 ID
 * 不匹配或事务 ID 中途变化都抛错并保留记录，不得静默清除。
 */
export async function 恢复中断隔离提交(
  回写提交前数据: (提交前数据: SchemaType) => void | Promise<unknown>,
): Promise<boolean> {
  const vars = getVariables({ type: 'chat' });
  if (!Object.prototype.hasOwnProperty.call(vars, 隔离事件事务键)) return false;
  const 记录 = 读取隔离事件事务记录(vars[隔离事件事务键]);
  if (!记录) throw new Error('检测到损坏的隔离事件恢复记录；为保护存档，脚本已停止，请联系作者');
  const 聊天ID = 当前聊天ID();
  if (!聊天ID || 记录.聊天ID !== 聊天ID) throw new Error('隔离事件恢复记录不属于当前聊天');
  await 回写提交前数据(记录.提交前数据);
  await Promise.resolve(
    updateVariablesWith(
      当前变量 => {
        if (当前聊天ID() !== 聊天ID) throw new Error('恢复隔离事件时聊天再次切换');
        const 当前记录 = 读取隔离事件事务记录(当前变量[隔离事件事务键]);
        if (!当前记录 || 当前记录.事务ID !== 记录.事务ID) throw new Error('隔离事件恢复记录已经变化');
        恢复精确聊天快照(当前变量 as Record<string, unknown>, 记录.提交前聊天, 隔离恢复聊天键);
        delete 当前变量[隔离事件事务键];
        return 当前变量;
      },
      { type: 'chat' },
    ),
  );
  console.warn('[人妻公寓·隔离] 已恢复上次因切换聊天或刷新而中断的隔离事务，已回到该操作开始前状态。');
  return true;
}
