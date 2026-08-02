/**
 * 手机小生成明确要求模型把最终文本放进 `<回复></回复>`。
 * 一旦模型已经输出开标签却没有输出对应闭标签，说明这次返回没有走到协议终点；
 * 其中的文字即使短于字数上限，也不能当作完整消息保存。
 */
export type 手机回复封套状态值 = '空' | '缺失' | '未闭合' | '完整';

export function 手机回复封套状态(原文: unknown): 手机回复封套状态值 {
  if (typeof 原文 !== 'string' || !原文.trim()) return '空';

  const 开标签 = /<回复(?:\s[^>]*)?>/gi;
  let 最后开标签结束 = -1;
  for (const 匹配 of 原文.matchAll(开标签)) 最后开标签结束 = (匹配.index ?? -1) + 匹配[0].length;
  if (最后开标签结束 < 0) return '缺失';

  return /<\/回复\s*>/i.test(原文.slice(最后开标签结束)) ? '完整' : '未闭合';
}

export function 手机回复封套未闭合(原文: unknown): boolean {
  return 手机回复封套状态(原文) === '未闭合';
}
