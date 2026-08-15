export interface 微信可知正文消息 {
  mes?: string;
  is_user?: boolean;
}

const 指令风险 =
  /(?:忽略|无视|覆盖|绕过|泄露).{0,16}(?:系统|上文|规则|指令|提示词)|(?:system|developer|assistant|prompt|instruction)\s*[:：]?|\b(?:ignore|obey|respond|output|roleplay)\b/i;

export function 净化微信只读文本(value: unknown, 上限: number): string {
  const 文 = String(value ?? '')
    .normalize('NFKC')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{\{|\}\}/g, ' ')
    .replace(/\u3010事件(?:在场妻|在场夫|关联妻|关联夫):[^\u3011]+\u3011/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!文 || 指令风险.test(文)) return '';
  return 文.slice(-上限);
}

/** 只有上一成功正文明确在场的妻子才能读到该正文尾巴。 */
export function 编译本人见证正文(门牌号: string, 妻在场: readonly string[], chat: readonly 微信可知正文消息[]): string {
  if (!妻在场.includes(门牌号)) return '';
  for (let index = chat.length - 1; index >= 0; index -= 1) {
    const 消息 = chat[index];
    if (!消息?.is_user && 消息?.mes) {
      const 文 = 净化微信只读文本(消息.mes, 300);
      if (文) return 文;
    }
  }
  return '';
}
