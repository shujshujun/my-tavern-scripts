/**
 * AI 可写表现字段会在下一轮重新进入结构化状态块与公寓快照。
 * 统一压成短单行并钝化协议定界符，避免模型把持久文本写成伪系统块。
 */
export function 规范AI表现文本(输入: unknown, 最大长度 = 240): string {
  if (typeof 输入 !== 'string') return '';
  const 无控制字符 = Array.from(输入, 字符 => {
    const 字符码 = 字符.charCodeAt(0);
    return 字符码 <= 0x1f || (字符码 >= 0x7f && 字符码 <= 0x9f) ? ' ' : 字符;
  }).join('');
  const 规范 = 无控制字符
    .replace(/</g, '‹')
    .replace(/>/g, '›')
    .replace(/【/g, '〔')
    .replace(/】/g, '〕')
    .replace(/\s+/g, ' ')
    .trim();
  const 上限 = Number.isFinite(最大长度) ? Math.max(0, Math.floor(最大长度)) : 240;
  // String.slice 按 UTF-16 码元截断，恰好卡在 emoji 中间会持久化孤立代理项。
  return Array.from(规范).slice(0, 上限).join('');
}
