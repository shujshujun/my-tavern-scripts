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
      Array.isArray(原[键])
        ? [...new Set(原[键].map(项 => 安全文本(项)).filter(Boolean))].slice(-每组上限)
        : [];
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

/** 不调用模型，只把既有结构化进展与最新一轮真实收发记录确定性合并。 */
export function 合并本地微信进展摘要(
  旧记录: string | null | undefined,
  妻名: string,
  增量: readonly 本地微信摘要消息[],
): 本地微信进展摘要 {
  const 结果 = 旧摘要(旧记录);
  const 事实 = 本轮对话事实(妻名, 增量);
  结果.f = [...new Set([...结果.f, 事实])].slice(-每组上限);

  const 总数 = () => 结果.f.length + 结果.a.length + 结果.b.length + 结果.p.length;
  while (总数() > 总条目上限) {
    if (结果.f.length > 1) 结果.f.shift();
    else if (结果.p.length) 结果.p.shift();
    else if (结果.a.length > 1) 结果.a.shift();
    else if (结果.b.length > 1) 结果.b.shift();
    else break;
  }
  return 结果;
}
