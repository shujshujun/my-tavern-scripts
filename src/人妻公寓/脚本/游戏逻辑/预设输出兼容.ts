export type 预设正文标签 = 'content' | 'story_scene' | 'dream_body';

export interface 预设输出清洗结果 {
  文本: string;
  正文已开始: boolean;
}

/**
 * 完整 AI 回复进入游戏持久层前，先采用酒馆对当前预设／全局／角色正则计算出的最终显示文本。
 * 这里不识别具体预设或标签，也不介入流式中间帧；玩家的预设正则最终显示什么，游戏就以什么
 * 作为后续正文清洗输入。接口缺失、单条正则异常或宿主版本不兼容时原样回退，不能让正文消失。
 */
export function 应用酒馆最终显示正则(原文: string): string {
  const 文本 = String(原文 ?? '');
  try {
    if (typeof formatAsTavernRegexedString !== 'function') return 文本;
    const 结果 = formatAsTavernRegexedString(文本, 'ai_output', 'display', { depth: 0 });
    return typeof 结果 === 'string' ? 结果 : 文本;
  } catch (error) {
    console.warn('[人妻公寓·预设兼容] 酒馆最终显示正则处理失败，原样保留完整回复:', error);
    return 文本;
  }
}

/**
 * 酒馆助手只会把“Markdown 代码围栏内同时存在闭合 <body>…</body>”的内容当作前端 iframe。
 * 这类块里的 CSS、脚本、折叠、摘要、吐槽与动画都只是酒馆楼层皮肤，不属于游戏正文，
 * 因而整块删除；围栏或 body 未闭合时不猜测边界，保留原样让玩家按常见做法重新生成。
 */
const 酒馆助手前端围栏 = /(^|\r?\n)[ \t]*(`{3,})[^\r\n]*\r?\n([\s\S]*?)\r?\n[ \t]*\2[ \t]*(?=\r?\n|$)/g;
const 酒馆助手闭合Body = /<body\b[^>]*>[\s\S]*<\/body\s*>/i;

export function 移除酒馆助手前端块(原文: string): string {
  const 文本 = String(原文 ?? '');
  return 文本.replace(
    酒馆助手前端围栏,
    (整块: string, 前导换行: string, _围栏: string, 内容: string) =>
      酒馆助手闭合Body.test(内容) ? 前导换行 : 整块,
  );
}

/**
 * 原生 <details> 也是预设常用的思维链／摘要折叠壳。只删除成对闭合块；嵌套时由内向外
 * 逐层移除。未闭合块不做吞尾推断，避免误删其后的真实剧情。
 */
const 最内层闭合Details = /<details\b[^>]*>(?:(?!<details\b)[\s\S])*?<\/details\s*>/gi;

function 移除闭合Details折叠块(原文: string): string {
  let 文本 = 原文;
  while (true) {
    const 下一轮 = 文本.replace(最内层闭合Details, '');
    if (下一轮 === 文本) return 文本;
    文本 = 下一轮;
  }
}

function 移除预设非正文展示块(原文: string): string {
  return 移除闭合Details折叠块(移除酒馆助手前端块(原文));
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
 * 清理乙酉等预设可能混入正文的展示标记。
 *
 * 这些标记只负责外部宿主的显示样式，不能把包裹的正文一起删除。唯一例外是
 * `<po><!-- ... --></po>`：其内容明确是模块规划注释，不属于玩家可见正文。
 */
function 清洗正文内展示标记(原文: string): string {
  return 原文
    // 乙酉把输出次数放在 content 末尾的 c 块中；它是计数元数据，不是剧情正文。
    .replace(/<c\b[^>]*>[\s\S]*?<\/c\s*>/gi, '')
    .replace(/<c\b[^>]*>[\s\S]*$/i, '')
    .replace(/<\/c\s*>/gi, '')
    // 只删除内容完全为 HTML 注释的 po 规划块；紧贴标签的加粗符也属于包装。
    .replace(/\*\*[ \t]*<po\b[^>]*>\s*<!--[\s\S]*?-->\s*<\/po\s*>[ \t]*\*\*/gi, '')
    .replace(/<po\b[^>]*>\s*<!--[\s\S]*?-->\s*<\/po\s*>/gi, '')
    // 普通 po 即使误包正文也只剥壳，不删除内部内容。
    .replace(/\*\*[ \t]*<po\b[^>]*>/gi, '')
    .replace(/<\/po\s*>[ \t]*\*\*/gi, '')
    .replace(/<\/?po\b[^>]*>/gi, '')
    // font 与 zv 同样只作为展示包装处理，闭合残片或漏闭合时仍保留正文。
    .replace(/<\/?font\b[^>]*>/gi, '')
    .replace(/<\/?zv\b[^>]*>/gi, '');
}

/**
 * 将外部 SillyTavern 预设的输出协议收敛成可显示正文。
 *
 * - 乙酉类：只取 `<content>`；
 * - 梦鲸类：只取 `<dream_body>`；
 * - 酒馆助手闭合前端代码块与闭合 `<details>` 折叠块整块删除，只保留块外正文；
 * - 思考标签完整、名称不配对或流式截断时都不回退泄露；
 * - 传入期望标签时，正文开标签到达前保持空白，供流式界面作安全门。
 */
export function 清洗预设输出(原文: string, 期望正文标签: 预设正文标签 | null = null): 预设输出清洗结果 {
  let 文本 = 移除预设非正文展示块(String(原文 ?? ''));
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

  // 期望标签缺失时不得整篇清空(2026-08-04 玩家实测"流式正文全部吞没"):预设桥识别出了
  // 正文协议,但中转模型经常不按协议输出开标签。此前这里直接返回空串,吞尾防误杀兜底
  // 拿到的输入已是空白救不回来,最终落占位楼、客户端清掉流式段=正文被清屏。
  // 现改为:先重扫其余已知正文标签(模型偶尔混用 content/story_scene),仍没有就退回
  // "未识别预设"的通用清洗;正文已开始 保持 false,流式安全门照旧在开标签前拦截显示。
  if (期望正文标签 && 正文标签 !== 期望正文标签) {
    for (const 标签 of 正文标签们) {
      const 开 = 最后开标签(文本, 标签);
      if (开 && 开.结束 > 正文开始) {
        正文标签 = 标签;
        正文开始 = 开.结束;
      }
    }
    if (正文标签 !== null && 正文标签 !== 期望正文标签) {
      console.warn(`[人妻公寓] 预设期望正文标签 <${期望正文标签}> 缺失,已回退采用 <${正文标签}> 包裹的正文`);
    }
    if (正文标签 === null) {
      console.warn(`[人妻公寓] 预设期望正文标签 <${期望正文标签}> 缺失,已回退通用清洗以保住正文`);
    }
  }

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

  文本 = 清洗正文内展示标记(文本);

  return { 文本: 文本.trim() ? 文本 : '', 正文已开始: 正文标签 !== null };
}
