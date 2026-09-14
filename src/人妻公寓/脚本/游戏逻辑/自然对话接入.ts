import type { SchemaType } from '../../schema';
import {
  type 对话观察请求, type 对话观察记录, type 自然对话类别,
  分离自然对话观察, 新建对话观察记录, 识别已保存对话,
  自然对话观察指令, 自然对话观察规则, 自然对话可提交, 自然聊天节奏提示, 恢复对话观察记录, 校验自然对话观察,
} from './自然对话观察';

const 场景类别: ReadonlyArray<[string, 自然对话类别]> = [
  ['许曼君分居提交', '分居'], ['许曼君离婚提交', '离婚'], ['许曼君离婚后日常提交', '离婚后日常'],
  ['双重继承提交', '双重继承'], ['安若妍不必停提交', '不必停'], ['不再留门提交', '不再留门'],
];

export function 自然场景类别(事件: string): 自然对话类别 | null {
  return 场景类别.find(([标记]) => 事件.includes(`【${标记}:`))?.[1] ?? null;
}

export function 读取自然对话记录(data: SchemaType): 对话观察记录 | null {
  const 文 = data.系统._自然对话记录;
  if (!文 || 文.length > 120000) return null;
  try {
    const 记录 = JSON.parse(文) as 对话观察记录;
    if (记录.请求?.版本 !== 1 || !Array.isArray(记录.请求.消息) ||
      !['待识别', '识别中', '已识别', '待重试'].includes(记录.技术状态) ||
      !['类别', '事件', '阶段', '分支', '批次', '要求'].every(键 => typeof (记录.请求 as unknown as Record<string, unknown>)[键] === 'string') ||
      !记录.请求.消息.every(项 => 项 && typeof 项.id === 'string' && typeof 项.文本 === 'string' && ['玩家', '角色', '正文', '业务'].includes(项.来源))) return null;
    if (记录.结果 && !校验自然对话观察(记录.结果, 记录.请求)) { 记录.结果 = null; 记录.技术状态 = '待重试'; }
    const ctx = 记录.提交上下文;
    if (ctx && (!Number.isSafeInteger(ctx.楼层) || ctx.楼层 < 0 || !Number.isSafeInteger(ctx.时段) || ctx.时段 < 0 ||
      typeof ctx.场景 !== 'string' || typeof ctx.事务ID !== 'string' || !Number.isSafeInteger(ctx.请求世代) ||
      ![ctx.妻在场, ctx.夫在场].every(列表 => Array.isArray(列表) && 列表.every(项 => typeof 项 === 'string')) ||
      !ctx.事件 || typeof ctx.事件.内容 !== 'string' || typeof ctx.事件.待发送快照 !== 'string' ||
      !ctx.实际尺度 || typeof ctx.实际尺度 !== 'object' || Array.isArray(ctx.实际尺度) ||
      !Object.values(ctx.实际尺度).every(Number.isFinite) || typeof ctx.资源计费 !== 'boolean')) delete 记录.提交上下文;
    记录.自动尝试 = Number.isSafeInteger(记录.自动尝试) ? Math.max(0, 记录.自动尝试) : 1;
    return 恢复对话观察记录(记录);
  } catch { return null; }
}

export function 保存自然对话记录(data: SchemaType, 记录: 对话观察记录 | null): void {
  data.系统._自然对话记录 = 记录 ? JSON.stringify(记录) : '';
}

export function 构造自然场景请求(
  data: SchemaType, 事件: string, 玩家行动: string, 正文: string, 分支: string, 批次: string,
): 对话观察请求 | null {
  const 类别 = 自然场景类别(事件);
  if (!类别) return null;
  const 阶段 = `${data.系统._场景剧情事务.id}:${事件}`;
  const 旧 = 读取自然对话记录(data);
  const 同步 = 旧?.请求.阶段 === 阶段 && 旧.请求.分支 === 分支;
  const 已用事实 = new Set(同步 ? 旧.结果?.依据.map(引用 => 引用.消息) : []);
  const 历史 = 同步 ? 旧.请求.消息.filter((文, i, 全部) =>
    (已用事实.has(文.id) || i >= 全部.length - 12) && !文.id.startsWith(`${批次}:`)) : [];
  const 选择项: Record<string, readonly string[]> = {};
  if (/【许曼君分居提交:第一幕初谈:3】/u.test(事件)) 选择项.初谈参与方式 = ['当面在场', '先夫妻谈', '暂缓', '未决定'];
  if (/【许曼君分居提交:第四幕私下决定:2】/u.test(事件)) 选择项.最终关系选择 = ['继续关系', '退出关系', '暂不承诺', '未决定'];
  if (/【不再留门提交:[a-zA-Z0-9_-]+:\d+:A(?:5:3|7:2|9:2):\d+】/u.test(事件)) 选择项.本步玩家许可 = ['确认'];
  return {
    版本: 1, 类别, 事件, 阶段, 分支, 批次,
    要求: 事件,
    消息: [...历史,
      { id: `${批次}:player`, 来源: '玩家', 文本: 玩家行动 },
      { id: `${批次}:assistant`, 来源: '正文', 文本: 正文 },
    ],
    选择项,
  };
}

export function 构造安抚观察请求(
  data: SchemaType, 门牌: string | null, 玩家行动: string, 正文: string, 分支: string, 批次: string,
): 对话观察请求 | null {
  const 妻 = 门牌 ? data.户[门牌]?.妻 : null;
  if (!妻 || 妻._冷落余波.状态 === '无' || 妻._冷落余波.状态 === '待诉苦') return null;
  const 事件 = `冷落安抚:${门牌}`;
  return {
    版本: 1, 类别: '冷落安抚', 事件, 阶段: `${事件}:${JSON.stringify(妻._冷落余波)}`, 分支, 批次,
    要求: '只判断最新玩家行动是否实际回应了在场角色的委屈，表达理解、倾听、支持或具体修复行动。' +
      '自然表达即可，不要求道歉词、问句或任何固定措辞。假设、转述、敷衍、否定关心或指向别人的行为不算。角色替玩家描述的关心不能作玩家依据。' +
      `角色当前情况：${JSON.stringify(妻._冷落余波)}`,
    消息: [{ id: `${批次}:player`, 来源: '玩家', 文本: 玩家行动 }, { id: `${批次}:assistant`, 来源: '正文', 文本: 正文 }],
  };
}

/** 正文生成前注入。协议失败只触发观察补取，不要求角色重说一遍。 */
export function 自然场景生成提示(请求: 对话观察请求 | null, data: SchemaType): string {
  if (!请求) return '';
  const 上次 = 读取自然对话记录(data);
  return 自然聊天节奏提示(上次?.请求.阶段 === 请求.阶段 ? 上次.结果 : null) +
    '\n【本轮附加观察】正文照常输出。正文完成后附加<自然观察>JSON</自然观察>，根据实际写出的文本填写；不用为了完成观察而改变人物选择。' +
    '本轮正文消息id为' + `${请求.批次}:assistant` + '。以下规则仅适用于正文之后的观察块：' + 自然对话观察规则 +
    '\n观察请求：' + JSON.stringify(请求);
}

/** 接受工具封套中的最终 content；从不使用 reasoning_content。 */
export function 最终观察文本(值: unknown): string {
  if (typeof 值 === 'string') return 值;
  if (!值 || typeof 值 !== 'object') return '';
  const 消息 = 值 as { content?: unknown; tool_calls?: Array<{ function?: { arguments?: string } }> };
  if (消息.tool_calls?.length === 1) {
    try {
      const 参数 = JSON.parse(消息.tool_calls[0].function?.arguments ?? '');
      if (typeof 参数.content === 'string' && 参数.content.trim()) return 参数.content;
    } catch { /* 无有效工具正文时，仍可读取普通最终正文。 */ }
  }
  return typeof 消息.content === 'string' ? 消息.content : '';
}

export async function 请求自然对话观察(请求: 对话观察请求, 信号: AbortSignal, 覆盖: Pick<Parameters<typeof generateRaw>[0], 'custom_api'> = {}): Promise<unknown> {
  const 生成ID = `rqgy-observe-${crypto.randomUUID()}`;
  const 停止 = () => { try { stopGenerationById(生成ID); } catch { /* 超时仍由上层关闭 */ } };
  信号.addEventListener('abort', 停止, { once: true });
  try {
    if (信号.aborted) throw new Error('识别已取消');
    const 返回 = await generateRaw({
      ordered_prompts: [{ role: 'system', content: 自然对话观察指令 }, { role: 'user', content: JSON.stringify(请求) }],
      should_stream: false, should_silence: true, generation_id: 生成ID,
      ...覆盖,
    });
    const 文 = 最终观察文本(返回);
    return 分离自然对话观察(文).观察;
  } finally { 信号.removeEventListener('abort', 停止); }
}

export async function 观察自然场景(
  请求: 对话观察请求 | null, 原文: string, 仍有效: () => boolean,
): Promise<对话观察记录 | null> {
  if (!请求) return null;
  const 记录 = 新建对话观察记录(请求, 分离自然对话观察(原文).观察);
  await 识别已保存对话(记录, 请求自然对话观察, 仍有效);
  return 记录;
}

export function 本轮自然事件可提交(data: SchemaType, 事件: string): boolean {
  if (!自然场景类别(事件)) return true;
  const 记录 = 读取自然对话记录(data);
  return !!记录 && 记录.请求.事件 === 事件 && 记录.请求.阶段 === `${data.系统._场景剧情事务.id}:${事件}` && 自然对话可提交(记录);
}

/** 已识别的本步才可替代旧措辞验收，原状态机仍核对演员、票据、时间和道具。 */
export function 自然事件已识别(data: SchemaType, 事件: string): boolean {
  return !!自然场景类别(事件) && 本轮自然事件可提交(data, 事件);
}

export function 读取自然玩家选择(data: SchemaType, 键: string): string | null {
  const 记录 = 读取自然对话记录(data);
  if (!记录 || !自然对话可提交(记录)) return null;
  return 记录.结果?.选择[键]?.值 ?? null;
}

/** 保留待演票，但本轮不再持有“生成中”。不会执行完成、奖励、冷却或解锁。 */
export function 保留自然剧情待续(data: SchemaType, 事件: string): void {
  const 事务 = data.系统._场景剧情事务;
  if (事务.id && 事务.内容 === 事件) 事务.状态 = '待续';
}
