import { 数据库状态, 通过数据库生成 } from './数据库桥';
import { 当前正文模型是DeepSeek } from './正文模型识别';
import { 预设破限段 } from './预设桥';
import { 清洗预设输出 } from './预设输出兼容';
import { 严格清除协议残留 } from './严格正文清洗';

export type 隔离事件类型 = '荣耀洞' | '监控' | '晨跑' | '健身' | '睡眠';

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
const 普通隔离事件生成上限 = 1400;

function 最近线程(线程: string): { role: 'user' | 'assistant'; content: string }[] {
  return 读库()
    .日志.filter(条 => 条.线程 === 线程)
    .slice(-4)
    .map(条 => ({ role: 条.谁 === '玩家' ? 'user' : 'assistant', content: 条.文本 }));
}

/** 只调用 AI 并返回草稿；本函数成功时仍不会改动聊天变量。 */
export async function 生成隔离事件草稿(参数: 隔离事件参数): Promise<隔离事件草稿 | null> {
  if (生成中) return null;
  生成中 = true;
  已取消 = false;
  eventEmit('人妻公寓:生成开始');
  try {
    const system = 系统提示(参数.类型, 参数.导演事件);
    const history = 最近线程(参数.线程);
    // 预设破限段护航(2026-07-27):特殊场景正戏最敏感,裸发必被 Gemini 安全截断
    const { 前, 后 } = 预设破限段();
    // 核心段单列:存档日志(史册考古的"提示词"字段)只记核心,预设破限段不进 chat 变量(防存档膨胀)
    const 核心段: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: system },
      ...history,
    ];
    const 是DeepSeek = 当前正文模型是DeepSeek();
    const 本拍用户输入 = 是DeepSeek ? `${参数.行动}\n\n${隔离事件收尾}` : 参数.行动;
    const ordered_prompts: ({ role: 'system' | 'user' | 'assistant'; content: string } | 'user_input')[] = [
      ...前,
      ...核心段,
      ...(是DeepSeek ? [...后, 'user_input' as const] : ['user_input' as const, ...后]),
    ];
    // generateRaw 可能返回 GenerateToolCallResult(本卡不传 tools,该分支不触发),统一按 unknown 收
    let 原文: unknown;
    // 数据库代理可能使用自己的独立模型且不公开模型名，不能拿正文模型去替它做判断。
    // 当前正文明确为 DeepSeek 时直接走正文专用路径；其余数据库请求完整维持 rq0.62。
    if (数据库状态().可调用AI && !是DeepSeek) {
      原文 = await 通过数据库生成(
        [...前, { role: 'system', content: system }, ...history, { role: 'user', content: 参数.行动 }, ...后],
        '',
        普通隔离事件生成上限,
      );
      if (!String(原文 ?? '').trim()) throw new Error('数据库 AI 返回空内容；为避免重复计费，本拍没有再次请求正文 API');
    } else {
      // 仅 DeepSeek 使用流式兼容路径；其余模型保持 rq0.62 的非流式行为。
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

/** 兼容荣耀洞与监控的既有单步入口；需要跨存储原子性的时间动作使用上面的两阶段 API。 */
export async function 执行隔离事件(参数: 隔离事件参数): Promise<string> {
  const 草稿 = await 生成隔离事件草稿(参数);
  if (!草稿) return '';
  const 锚楼 = getLastMessageId();
  await updateVariablesWith(
    vars => {
      写入隔离事件草稿(vars, 草稿, 锚楼);
      return vars;
    },
    { type: 'chat' },
  );
  return 草稿.正文;
}
