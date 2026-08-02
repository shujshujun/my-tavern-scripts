/**
 * AI 可写表现字段会在下一轮重新进入结构化状态块与公寓快照。
 * 统一压成短单行并钝化协议定界符，避免模型把持久文本写成伪系统块。
 */
export function 规范AI表现文本(输入: unknown, 最大长度 = 240): string {
  if (typeof 输入 !== 'string') return '';
  return 输入
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/</g, '‹')
    .replace(/>/g, '›')
    .replace(/【/g, '〔')
    .replace(/】/g, '〕')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 最大长度);
}
