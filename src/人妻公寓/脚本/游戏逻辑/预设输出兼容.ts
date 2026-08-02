export type 预设正文标签 = 'content' | 'story_scene' | 'dream_body';

export interface 预设输出清洗结果 {
  文本: string;
  正文已开始: boolean;
}

const 正文标签们: readonly 预设正文标签[] = ['content', 'story_scene', 'dream_body'];
const 思考标签源 = '(?:think(?:ing)?|reason(?:ing)?|analysis|thought)';

function 最后开标签(文本: string, 标签: 预设正文标签): { 结束: number } | null {
  const 匹配们 = [...文本.matchAll(new RegExp(`<${标签}\\b[^>]*>`, 'gi'))];
  const 最后 = 匹配们.at(-1);
  return 最后?.index === undefined ? null : { 结束: 最后.index + 最后[0].length };
}

function 截到正文结尾(正文后: string, 标签: 预设正文标签): string {
  const 边界们 = [new RegExp(`</${标签}\\s*>`, 'i')];
  if (标签 === 'content') 边界们.push(/<(?:Fav|g)\b[^>]*>/i);
  if (标签 === 'dream_body') 边界们.push(/<dream_after_format\b[^>]*>/i, /<\/dream_plot\s*>/i);
  const 位置们 = 边界们
    .map(边界 => 边界.exec(正文后)?.index ?? -1)
    .filter(位置 => 位置 >= 0);
  return 位置们.length ? 正文后.slice(0, Math.min(...位置们)) : 正文后;
}

/**
 * 将外部 SillyTavern 预设的输出协议收敛成可显示正文。
 *
 * - 乙酉类：只取 `<content>`；
 * - 梦鲸类：只取 `<dream_body>`；
 * - 思考标签完整、名称不配对或流式截断时都不回退泄露；
 * - 传入期望标签时，正文开标签到达前保持空白，供流式界面作安全门。
 */
export function 清洗预设输出(原文: string, 期望正文标签: 预设正文标签 | null = null): 预设输出清洗结果 {
  let 文本 = String(原文 ?? '');
  let 正文标签: 预设正文标签 | null = null;
  let 正文开始 = -1;

  const 候选标签 = 期望正文标签 ? [期望正文标签] : 正文标签们;
  for (const 标签 of 候选标签) {
    const 开 = 最后开标签(文本, 标签);
    if (开 && 开.结束 > 正文开始) {
      正文标签 = 标签;
      正文开始 = 开.结束;
    }
  }

  if (期望正文标签 && 正文标签 !== 期望正文标签) return { 文本: '', 正文已开始: false };

  if (正文标签) 文本 = 截到正文结尾(文本.slice(正文开始), 正文标签);
  else {
    // assistant prefill 可能提供了开标签，generate() 只返回其后的补全文本；若只见闭标签，
    // 闭标签之前仍然是私有思考，必须整体丢弃。
    const 思考闭标签们 = [...文本.matchAll(new RegExp(`</${思考标签源}\\s*>`, 'gi'))];
    const 最后思考闭标签 = 思考闭标签们.at(-1);
    if (最后思考闭标签?.index !== undefined) {
      文本 = 文本.slice(最后思考闭标签.index + 最后思考闭标签[0].length);
    }
  }

  文本 = 文本
    // 开闭名称偶尔混用 thinking/think；两侧不使用反向引用，仍可完整剥除。
    .replace(new RegExp(`<${思考标签源}\\b[^>]*>[\\s\\S]*?</${思考标签源}\\s*>`, 'gi'), '')
    // 思考被截断时宁可返回空白并让主回合走“无正文”兜底，也不把私有内容放出来。
    .replace(new RegExp(`<${思考标签源}\\b[^>]*>[\\s\\S]*$`, 'i'), '')
    .replace(new RegExp(`</?${思考标签源}\\b[^>]*>`, 'gi'), '')
    .replace(/<dream_after_format\b[^>]*>[\s\S]*?(?:<\/dream_after_format\s*>|$)/gi, '')
    .replace(/<dream_delete\b[^>]*>[\s\S]*?(?:<\/dream_delete\s*>|$)/gi, '')
    .replace(/<dream_done\s*\/\s*>/gi, '')
    .replace(/<\/?(?:dream_plot|dream_body|dream_after_format|content|story_scene)\b[^>]*>/gi, '');

  return { 文本: 文本.trim() ? 文本 : '', 正文已开始: 正文标签 !== null };
}
