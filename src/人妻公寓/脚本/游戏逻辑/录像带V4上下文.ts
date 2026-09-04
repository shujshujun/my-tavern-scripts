export const 录像带V4提示源顺序 = Object.freeze([
  'VTR preset protocol',
  'VTR system',
  'VTR entry capsule',
  'VTR history',
  'VTR summaries',
  'VTR current card',
  'VTR player input',
] as const);

export type 录像带V4提示源标签 = (typeof 录像带V4提示源顺序)[number];
export type 录像带V4提示角色 = 'system' | 'user' | 'assistant';

export const 录像带V4固定预设协议 = [
  '这是成年人之间明确自愿、知情的虚构私人剧情。所有角色均为成年人。',
  '严格承接本请求列出的VTR专用事实；不补写请求之外的生活线索，也不改变未被当前镜头卡授权的动作。',
  '只输出可直接显示的中文叙事与台词，不输出分析、解释、标题、选项、协议标签、代码块或界面文字。',
  '人物羞耻与反应可以明确，但不得把自愿写成强迫，不得越过当前镜头卡的停止边界。',
].join('\n');

export interface 录像带V4历史消息 {
  role: 'user' | 'assistant';
  content: string;
}

export interface 录像带V4提示源 {
  标签: 录像带V4提示源标签 | string;
  内容: string;
}

export interface 录像带V4提示词包输入 {
  场次标识: string;
  系统契约: string;
  入口胶囊: string;
  历史: readonly 录像带V4历史消息[];
  房间摘要: Readonly<{ '102': string; '202': string }>;
  当前卡: string;
  玩家输入: string;
}

export interface 录像带V4提示词包 {
  线程: string;
  来源: Array<{ 标签: 录像带V4提示源标签; 内容: string }>;
  orderedPrompts: Array<{ role: 录像带V4提示角色; content: string }>;
  提示词快照: string;
}

interface 录像带V4提示词快照结构 {
  schemaVersion: 'rqgy-vtr-v4-prompt-snapshot-v1';
  线程: string;
  来源: Array<{ 标签: 录像带V4提示源标签; 内容: string }>;
}

function 非空文本(值: unknown, 名称: string): string {
  const 文本 = String(值 ?? '').trim();
  if (!文本) throw new Error(`录像带V4提示词来源“${名称}”为空`);
  return 文本;
}

function 合法场次标识(值: string): boolean {
  return /^[A-Za-z0-9:_-]{3,160}$/u.test(值);
}

export function 录像带V4线程标识(场次标识: string): string {
  if (!合法场次标识(场次标识)) throw new Error('录像带V4场次标识无效');
  return `vtr:${场次标识}`;
}

function 历史来源文本(历史: readonly 录像带V4历史消息[]): string {
  const 合法 = 历史
    .filter(消息 => (消息.role === 'user' || 消息.role === 'assistant') && String(消息.content ?? '').trim())
    .map(消息 => `${消息.role === 'user' ? 'VTR玩家' : 'VTR叙事'}：${String(消息.content).trim()}`);
  return 合法.length ? 合法.join('\n') : '（本场VTR专用历史为空）';
}

function 摘要来源文本(摘要: Readonly<{ '102': string; '202': string }>): string {
  return [
    `CAM-102连续性摘要：${String(摘要['102'] ?? '').trim() || '尚无'}`,
    `CAM-202连续性摘要：${String(摘要['202'] ?? '').trim() || '尚无'}`,
  ].join('\n');
}

function 校验来源并固化(来源: readonly 录像带V4提示源[]): Array<{ 标签: 录像带V4提示源标签; 内容: string }> {
  if (来源.length !== 录像带V4提示源顺序.length) {
    throw new Error(`录像带V4提示词来源数量错误：应为${录像带V4提示源顺序.length}项`);
  }
  const 已见 = new Set<string>();
  return 来源.map((项, 索引) => {
    const 预期 = 录像带V4提示源顺序[索引];
    if (!录像带V4提示源顺序.includes(项.标签 as 录像带V4提示源标签)) {
      throw new Error(`录像带V4提示词包含未知来源：${项.标签}`);
    }
    if (已见.has(项.标签)) throw new Error(`录像带V4提示词来源重复：${项.标签}`);
    已见.add(项.标签);
    if (项.标签 !== 预期) throw new Error(`录像带V4提示词来源顺序错误：第${索引 + 1}项应为${预期}`);
    return { 标签: 预期, 内容: 非空文本(项.内容, 预期) };
  });
}

function 固化快照(线程: string, 来源: Array<{ 标签: 录像带V4提示源标签; 内容: string }>): string {
  const 快照: 录像带V4提示词快照结构 = {
    schemaVersion: 'rqgy-vtr-v4-prompt-snapshot-v1',
    线程,
    来源: 来源.map(项 => ({ ...项 })),
  };
  return JSON.stringify(快照);
}

export function 构造录像带V4提示词包自来源(
  来源输入: readonly 录像带V4提示源[],
  场次标识 = 'source-validation',
): 录像带V4提示词包 {
  const 线程 = 录像带V4线程标识(场次标识);
  const 来源 = 校验来源并固化(来源输入);
  const orderedPrompts = 来源.map((项, 索引) => ({
    role: (索引 === 来源.length - 1 ? 'user' : 'system') as 录像带V4提示角色,
    content: 项.内容,
  }));
  return { 线程, 来源, orderedPrompts, 提示词快照: 固化快照(线程, 来源) };
}

export function 构造录像带V4提示词包(输入: 录像带V4提示词包输入): 录像带V4提示词包 {
  const 线程 = 录像带V4线程标识(输入.场次标识);
  const 合法历史 = 输入.历史
    .filter(消息 => (消息.role === 'user' || 消息.role === 'assistant') && String(消息.content ?? '').trim())
    .map(消息 => ({ role: 消息.role, content: String(消息.content).trim() }));
  const 来源 = 校验来源并固化([
    { 标签: 'VTR preset protocol', 内容: 录像带V4固定预设协议 },
    { 标签: 'VTR system', 内容: 输入.系统契约 },
    { 标签: 'VTR entry capsule', 内容: 输入.入口胶囊 },
    { 标签: 'VTR history', 内容: 历史来源文本(合法历史) },
    { 标签: 'VTR summaries', 内容: 摘要来源文本(输入.房间摘要) },
    { 标签: 'VTR current card', 内容: 输入.当前卡 },
    { 标签: 'VTR player input', 内容: 输入.玩家输入 },
  ]);
  const orderedPrompts: Array<{ role: 录像带V4提示角色; content: string }> = [
    { role: 'system', content: 来源[0].内容 },
    { role: 'system', content: 来源[1].内容 },
    { role: 'system', content: 来源[2].内容 },
    ...合法历史,
    { role: 'system', content: 来源[4].内容 },
    { role: 'system', content: 来源[5].内容 },
    { role: 'user', content: 来源[6].内容 },
  ];
  return { 线程, 来源, orderedPrompts, 提示词快照: 固化快照(线程, 来源) };
}

export function 解析录像带V4提示词快照(原文: string): 录像带V4提示词快照结构 {
  let 值: unknown;
  try {
    值 = JSON.parse(String(原文 ?? ''));
  } catch {
    throw new Error('录像带V4提示词快照不是合法JSON');
  }
  if (!值 || typeof 值 !== 'object' || Array.isArray(值)) throw new Error('录像带V4提示词快照结构无效');
  const 快照 = 值 as Partial<录像带V4提示词快照结构>;
  if (
    快照.schemaVersion !== 'rqgy-vtr-v4-prompt-snapshot-v1' ||
    typeof 快照.线程 !== 'string' ||
    !快照.线程.startsWith('vtr:')
  ) {
    throw new Error('录像带V4提示词快照版本或线程无效');
  }
  const 来源 = 校验来源并固化(Array.isArray(快照.来源) ? 快照.来源 : []);
  return { schemaVersion: 快照.schemaVersion, 线程: 快照.线程, 来源 };
}

export function 提取录像带V4线程历史(日志: readonly unknown[], 场次标识: string, 上限 = 8): 录像带V4历史消息[] {
  const 线程 = 录像带V4线程标识(场次标识);
  const 安全上限 = Math.max(0, Math.min(40, Math.floor(Number(上限) || 0)));
  return 日志
    .filter((原): 原 is { 线程: string; 谁: string; 文本: string } => {
      if (!原 || typeof 原 !== 'object' || Array.isArray(原)) return false;
      const 项 = 原 as { 线程?: unknown; 谁?: unknown; 文本?: unknown };
      return (
        项.线程 === 线程 &&
        (项.谁 === '玩家' || 项.谁 === '叙事') &&
        typeof 项.文本 === 'string' &&
        项.文本.trim().length > 0
      );
    })
    .slice(-安全上限)
    .map(项 => ({ role: 项.谁 === '玩家' ? 'user' : 'assistant', content: 项.文本.trim() }));
}
