/**
 * 游戏自己拥有的机器协议。它们用于变量、尺度、旧事件摘要或兼容控制，不属于玩家正文。
 * 本模块只隔离游戏协议，不识别任何外部预设名称、正文标签或思维链格式。
 */
export function 清除游戏机器协议(原文: string): string {
  return String(原文 ?? '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable\s*>/gi, '')
    .replace(/<json_?patch\b[^>]*>[\s\S]*?<\/json_?patch\s*>/gi, '')
    .replace(/<options\b[^>]*>[\s\S]*?<\/options\s*>/gi, '')
    .replace(/<行为等级(?:\s[^>]*)?>[\s\S]*?<\/行为等级\s*>/gi, '')
    .replace(/<尺度判定(?:\s[^>]*)?>[\s\S]*?<\/尺度判定\s*>/gi, '')
    .replace(/<rq_event_summary\b[^>]*>[\s\S]*?<\/rq_event_summary\s*>/gi, '')
    .replace(/<\/(?:UpdateVariable|json_?patch|options|行为等级|尺度判定|rq_event_summary)\s*>/gi, '')
    .replace(/<rq_event_summary\b[^>]*>[\s\S]*$/i, '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*$/i, '')
    .replace(/<json_?patch\b[^>]*>[\s\S]*$/i, '')
    .replace(/<options\b[^>]*>[\s\S]*$/i, '')
    .replace(/<行为等级(?:\s[^>]*)?>[\s\S]*$/i, '')
    .replace(/<尺度判定(?:\s[^>]*)?>[\s\S]*$/i, '');
}

/** 标签名或属性尚未闭合时，只裁掉游戏自有协议前缀；外部预设残片留给显示层。 */
export function 清除末尾残缺游戏协议标签(原文: string): string {
  const 文本 = String(原文 ?? '').trim();
  const 残缺标签 = 文本.match(/<\/?([A-Za-z_㐀-鿿][A-Za-z0-9_㐀-鿿~:-]*)(?:\s[^<>]*)?$/);
  const 协议标签 = ['UpdateVariable', 'json_patch', 'jsonpatch', 'options', '行为等级', '尺度判定', 'rq_event_summary'];
  if (
    残缺标签?.index !== undefined &&
    协议标签.some(标签 => 标签.toLowerCase().startsWith(残缺标签[1].toLowerCase()))
  ) {
    return 文本.slice(0, 残缺标签.index).trim();
  }
  return 文本;
}
