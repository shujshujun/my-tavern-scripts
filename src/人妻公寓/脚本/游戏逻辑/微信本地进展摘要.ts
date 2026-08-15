export interface 本地微信进展摘要 {
  v: 1;
  f: string[];
  a: string[];
  b: string[];
  p: string[];
}

export interface 本地微信摘要消息 {
  说话者: string;
  内容: string;
}

const 条目上限 = 80;
const 每组上限 = 2;
const 总条目上限 = 6;
const 指令风险 =
  /(?:忽略|无视|覆盖|绕过|泄露).{0,12}(?:系统|上文|之前|此前|以上|所有|规则|指令|提示词)|(?:system|developer|assistant|prompt|instruction)\s*[:：]?|\b(?:ignore|obey|respond|output|roleplay)\b|(?:必须|务必).{0,12}(?:输出|回复|表现|提及)|(?:下一轮|下次回复|正文中|每轮).{0,12}(?:写|说|提|表现|输出|回复)/i;

function 安全文本(value: unknown, 上限 = 条目上限): string {
  const 文 = Array.from(String(value ?? ''))
    .map(字 => {
      const 码点 = 字.codePointAt(0) ?? 0;
      return 码点 < 32 || 码点 === 127 ? ' ' : 字;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  if (!文 || 指令风险.test(文)) return '';
  return 文.slice(0, 上限);
}

function 旧摘要(value: string | null | undefined): 本地微信进展摘要 {
  try {
    const 原 = JSON.parse(value ?? '') as Partial<Record<keyof 本地微信进展摘要, unknown>>;
    if (!原 || 原.v !== 1) throw new Error('旧微信摘要版本无效');
    const 取组 = (键: 'f' | 'a' | 'b' | 'p'): string[] =>
      Array.isArray(原[键]) ? [...new Set(原[键].map(项 => 安全文本(项)).filter(Boolean))].slice(-每组上限) : [];
    return { v: 1, f: 取组('f'), a: 取组('a'), b: 取组('b'), p: 取组('p') };
  } catch {
    return { v: 1, f: [], a: [], b: [], p: [] };
  }
}

function 本轮对话事实(妻名: string, 增量: readonly 本地微信摘要消息[]): string {
  const 玩家说 = [...增量].reverse().find(项 => 项.说话者 === '玩家');
  const 妻回复 = [...增量].reverse().find(项 => 项.说话者 !== '玩家');
  const 玩家文 = 安全文本(玩家说?.内容, 26);
  const 妻文 = 安全文本(妻回复?.内容, 26);
  const 安全妻名 = 安全文本(妻名, 12) || '对方';
  if (!玩家文 || !妻文) return `玩家与${安全妻名}完成一轮有效私聊`;
  const 事实 = `本轮微信：玩家说“${玩家文}”；${安全妻名}回复“${妻文}”`;
  return 安全文本(事实) || `玩家与${安全妻名}完成一轮有效私聊`;
}

function 追加槽位(结果: 本地微信进展摘要, 键: 'f' | 'a' | 'b' | 'p', 值: string): void {
  const 安全值 = 安全文本(值);
  if (!安全值) return;
  结果[键] = [...new Set([...结果[键], 安全值])].slice(-每组上限);
}

function 裁剪总槽位(结果: 本地微信进展摘要): void {
  const 总数 = () => 结果.f.length + 结果.a.length + 结果.b.length + 结果.p.length;
  while (总数() > 总条目上限) {
    if (结果.f.length > 1) 结果.f.shift();
    else if (结果.p.length > 1) 结果.p.shift();
    else if (结果.a.length > 1) 结果.a.shift();
    else if (结果.b.length > 1) 结果.b.shift();
    else break;
  }
}

function 提取私聊结构(结果: 本地微信进展摘要, 妻名: string, 增量: readonly 本地微信摘要消息[]): void {
  const 玩家说 = [...增量].reverse().find(项 => 项.说话者 === '玩家');
  const 妻回复 = [...增量].reverse().find(项 => 项.说话者 !== '玩家');
  const 玩家文 = 安全文本(玩家说?.内容, 30);
  const 妻文 = 安全文本(妻回复?.内容, 36);
  const 安全妻名 = 安全文本(妻名, 12) || '对方';
  if (!妻文) return;

  const 玩家提议 =
    /(?:今天|明天|后天|周[一二三四五六日天]|下次|改天|一起|见面|来接|等你|约|答应|承诺|说好|说定|记得)/.test(玩家文);
  const 本人确认 = /^(?:好(?:的|呀|啊)?|嗯|行|可以|没问题|知道了|说定了|我答应)/.test(妻文);
  if (玩家文 && 玩家提议 && 本人确认) {
    追加槽位(结果, 'a', `双方微信确认：玩家“${玩家文}”；${安全妻名}“${妻文}”`);
  }
  if (/^(?:不要|不能|别|不许|不可以|我不|这事别)|(?:底线|保密|只能我们|不想让别人)/.test(妻文)) {
    追加槽位(结果, 'b', `${安全妻名}在微信中明确：“${妻文}”`);
  }
  if (/(?:还没|等我|以后|下次|改天|再说|回头|考虑|之后|到时|再告诉|暂时)/.test(妻文)) {
    追加槽位(结果, 'p', `待继续沟通：${安全妻名}“${妻文}”`);
  }
}

interface 私聊摘要单元 {
  类型: '往返' | '本人主动';
  消息: 本地微信摘要消息[];
}

function 拆分私聊摘要单元(增量: readonly 本地微信摘要消息[]): 私聊摘要单元[] {
  const 单元: 私聊摘要单元[] = [];
  let 当前轮: 本地微信摘要消息[] = [];
  let 已有玩家消息 = false;
  let 已有对方回复 = false;
  const 收口 = () => {
    if (已有玩家消息 && 已有对方回复) 单元.push({ 类型: '往返', 消息: 当前轮 });
    当前轮 = [];
    已有玩家消息 = false;
    已有对方回复 = false;
  };

  for (const 消息 of 增量) {
    if (消息.说话者 === '玩家') {
      if (已有对方回复) 收口();
      当前轮.push(消息);
      已有玩家消息 = true;
      continue;
    }
    if (!已有玩家消息) {
      单元.push({ 类型: '本人主动', 消息: [消息] });
      continue;
    }
    当前轮.push(消息);
    已有对方回复 = true;
  }
  收口();
  return 单元;
}

/** 不调用模型，只把既有结构化进展与最新一轮真实收发记录确定性合并。 */
export function 合并本地微信进展摘要(
  旧记录: string | null | undefined,
  妻名: string,
  增量: readonly 本地微信摘要消息[],
): 本地微信进展摘要 {
  const 结果 = 旧摘要(旧记录);
  const 安全妻名 = 安全文本(妻名, 12) || '对方';
  for (const 单元 of 拆分私聊摘要单元(增量)) {
    const 主动文 = 单元.类型 === '本人主动' ? 安全文本(单元.消息[0]?.内容, 52) : '';
    const 事实 =
      单元.类型 === '往返'
        ? 本轮对话事实(妻名, 单元.消息)
        : 主动文
          ? 安全文本(`${安全妻名}主动微信：“${主动文}”`)
          : `${安全妻名}发来一条有效主动微信`;
    if (!事实) continue;
    结果.f = [...new Set([...结果.f, 事实])].slice(-每组上限);
    提取私聊结构(结果, 妻名, 单元.消息);
    裁剪总槽位(结果);
  }
  return 结果;
}

/** 群聊只摘要群里真实发出的气泡；不会把任何人的私聊或正文记忆并入群知识。 */
export function 合并本地群聊进展摘要(
  旧记录: string | null | undefined,
  群名: string,
  增量: readonly 本地微信摘要消息[],
): 本地微信进展摘要 {
  const 结果 = 旧摘要(旧记录);
  const 全部 = 增量
    .map(项 => ({ 说话者: 安全文本(项.说话者, 12), 内容: 安全文本(项.内容, 24) }))
    .filter(项 => 项.说话者 && 项.内容);
  const 最近 = 全部.slice(-3);
  if (最近.length) {
    追加槽位(
      结果,
      'f',
      `${安全文本(群名, 12) || '群聊'}最近：${最近.map(项 => `${项.说话者}“${项.内容}”`).join('；')}`,
    );
  }

  for (let i = 1; i < 全部.length; i += 1) {
    const 上一条 = 全部[i - 1];
    const 当前 = 全部[i];
    if (
      /(?:一起|集合|见面|约|时间|地点|说定|就这么办|记得)/.test(上一条.内容) &&
      /^(?:好|行|可以|没问题|收到|说定|就这么办)/.test(当前.内容)
    ) {
      追加槽位(结果, 'a', `群内确认：${上一条.说话者}“${上一条.内容}”；${当前.说话者}“${当前.内容}”`);
    }
  }
  for (const 项 of 全部) {
    if (/^(?:不要|不能|别|不许|不可以)|(?:群里禁止|只能在群里|不要对外)/.test(项.内容)) {
      追加槽位(结果, 'b', `群内边界：${项.说话者}“${项.内容}”`);
    }
    if (/(?:还没|待会|稍后|之后|下次|改天|再说|回头|等通知|到时)/.test(项.内容)) {
      追加槽位(结果, 'p', `群内待续：${项.说话者}“${项.内容}”`);
    }
  }
  裁剪总槽位(结果);
  return 结果;
}
