import { 数据库状态, 通过数据库生成 } from './数据库桥';

export type 隔离事件类型 = '荣耀洞' | '监控';

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

function 读库(): 隔离事件库 {
  const 原 = _.get(getVariables({ type: 'chat' }), '_隔离事件') as Partial<隔离事件库> | undefined;
  return { 日志: Array.isArray(原?.日志) ? 原.日志.filter(Boolean) : [] };
}

function 净化(原文: string): string {
  const 闭合清 = 原文
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<options>[\s\S]*?<\/options>/gi, '')
    .replace(/<行为等级>[\s\S]*?<\/行为等级>/g, '')
    .replace(/<\/?div[^>]*>/gi, '')
    .trim();
  const 全清 = 闭合清
    .replace(/<think(?:ing)?>[\s\S]*$/i, '')
    .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
    .replace(/<UpdateVariable>[\s\S]*$/i, '')
    .replace(/<options>[\s\S]*$/i, '')
    .replace(/<行为等级>[\s\S]*$/i, '')
    .trim();
  return 全清 || 闭合清;
}

function 系统提示(类型: 隔离事件类型, 导演事件: string): string {
  return [
    '你正在为《人妻公寓》生成一段独立的' + 类型 + '事件。',
    '这是事件专用短线程，不是普通公寓正文。只承接下方显式提供的最近事件内容，不得假定看过其他聊天历史。',
    '角色只知道亲眼所见、亲耳所闻和本事件明确告知的信息；禁止反全知，禁止让事件外的人凭空知情。',
    '只输出可直接显示的中文叙事与台词；不输出变量、选项、行为等级、思维链、HTML 或 Markdown 代码块。',
    '【本拍导演指令】' + 导演事件,
  ].join('\n');
}

function 最近线程(线程: string): { role: 'user' | 'assistant'; content: string }[] {
  return 读库()
    .日志.filter(条 => 条.线程 === 线程)
    .slice(-4)
    .map(条 => ({ role: 条.谁 === '玩家' ? 'user' : 'assistant', content: 条.文本 }));
}

export async function 执行隔离事件(参数: {
  类型: 隔离事件类型;
  线程: string;
  行动: string;
  导演事件: string;
  房间: string;
}): Promise<string> {
  if (生成中) return '';
  生成中 = true;
  已取消 = false;
  eventEmit('人妻公寓:生成开始');
  try {
    const system = 系统提示(参数.类型, 参数.导演事件);
    const history = 最近线程(参数.线程);
    const ordered_prompts: ({ role: 'system' | 'user' | 'assistant'; content: string } | 'user_input')[] = [
      { role: 'system', content: system },
      ...history,
      'user_input',
    ];
    let 原文: string | null | undefined;
    if (数据库状态().可调用AI) {
      原文 = await 通过数据库生成(
        [
          { role: 'system', content: system },
          ...history,
          { role: 'user', content: 参数.行动 },
        ],
        '',
        1400,
      );
      if (!String(原文 ?? '').trim()) throw new Error('数据库 AI 返回空内容；为避免重复计费，本拍没有再次请求正文 API');
    } else {
      原文 = await generateRaw({ ordered_prompts, user_input: 参数.行动, should_stream: false });
    }
    if (已取消) throw new Error('已取消——这一拍没有发生');
    const 正文 = 净化(String(原文 ?? ''));
    if (!正文) throw new Error('事件 AI 没有返回可显示的正文');

    const 库 = 读库();
    const 锚楼 = getLastMessageId();
    const 序起 = 库.日志.filter(条 => 条.锚楼 === 锚楼).reduce((max, 条) => Math.max(max, 条.序), -1) + 1;
    const 时间 = Date.now();
    const 基 = 参数.类型 + '-' + 时间;
    const 提示词 = ordered_prompts
      .map(项 => (项 === 'user_input' ? 'USER\n' + 参数.行动 : 项.role.toUpperCase() + '\n' + 项.content))
      .join('\n\n');
    库.日志.push(
      {
        id: 基 + '-u',
        类型: 参数.类型,
        线程: 参数.线程,
        谁: '玩家',
        文本: 参数.行动,
        锚楼,
        序: 序起,
        房间: 参数.房间,
        时间,
      },
      {
        id: 基 + '-a',
        类型: 参数.类型,
        线程: 参数.线程,
        谁: '叙事',
        文本: 正文,
        锚楼,
        序: 序起 + 1,
        房间: 参数.房间,
        提示词,
        时间,
      },
    );
    库.日志 = 库.日志.slice(-最大日志条数);
    await updateVariablesWith(
      vars => {
        _.set(vars, '_隔离事件', 库);
        return vars;
      },
      { type: 'chat' },
    );
    return 正文;
  } finally {
    生成中 = false;
  }
}
