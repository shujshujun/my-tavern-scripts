export interface 可检测显示正则 {
  script_name?: string;
  enabled?: boolean;
  replace_string?: string;
  source?: { ai_output?: boolean };
  destination?: { display?: boolean };
}

/**
 * 完整 AI 回复进入游戏持久层前，只调用一次 SillyTavern 的最终显示正则。
 * 正则异常、接口不可用，或非空回复被整篇清成空串时都回退原文；后者会作为失败残稿
 * 交给玩家判断，而不是在生成完成的一刻把已经看见的内容清屏。
 */
export function 应用酒馆最终显示正则(原文: string): string {
  const 文本 = String(原文 ?? '');
  try {
    if (typeof formatAsTavernRegexedString !== 'function') return 文本;
    const 结果 = formatAsTavernRegexedString(文本, 'ai_output', 'display', { depth: 0 });
    if (typeof 结果 !== 'string') return 文本;
    if (结果.trim() || !文本.trim()) return 结果;
    console.warn('[人妻公寓·预设兼容] 酒馆最终显示正则把非空回复清成空串，保留原始回复供玩家判断。');
    return 文本;
  } catch (error) {
    console.warn('[人妻公寓·预设兼容] 酒馆最终显示正则处理失败，原样保留完整回复:', error);
    return 文本;
  }
}

const 美化替换特征 =
  /(?:<\s*(?:style|script|div|span|section|details|summary|svg|iframe|html)\b|```\s*html\b|@keyframes\b|\banimation\s*:|\bstyle\s*=)/i;

/**
 * 只识别“启用 + AI 输出 + 显示向”且替换内容会生成 HTML/CSS/动画的正则。
 * 空替换、$1 提取、剥标签和普通纯文本替换都不会被提示；函数只返回名称，不修改玩家配置。
 */
export function 检测AI输出美化正则(正则们: readonly 可检测显示正则[]): string[] {
  const 名称们 = 正则们
    .filter(
      项 =>
        项?.enabled === true &&
        项.source?.ai_output === true &&
        项.destination?.display === true &&
        typeof 项.replace_string === 'string' &&
        项.replace_string.trim() !== '' &&
        美化替换特征.test(项.replace_string),
    )
    .map(项 => String(项.script_name ?? '').trim() || '未命名正则');
  return [...new Set(名称们)];
}

function 解码常见HTML实体(文本: string): string {
  const 命名实体: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };
  return 文本.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (原, 十进制: string, 十六进制: string, 名称: string) => {
    try {
      if (十进制) return String.fromCodePoint(Number.parseInt(十进制, 10));
      if (十六进制) return String.fromCodePoint(Number.parseInt(十六进制, 16));
      return 命名实体[String(名称).toLowerCase()] ?? 原;
    } catch {
      return 原;
    }
  });
}

// 只清理真实 HTML 与已经由上游识别过的常见协议外壳。不能再使用 `<[^>]+>`：普通
// 比较式与玩家写下的 `<请勿打扰>` 不是标签。未知尖括号内容宁可保留给玩家判断。
const 可转纯文本标签 = [
  'a',
  'abbr',
  'address',
  'article',
  'aside',
  'b',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'button',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'dd',
  'del',
  'details',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h[1-6]',
  'head',
  'header',
  'html',
  'i',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'main',
  'mark',
  'meta',
  'menu',
  'nav',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'picture',
  'pre',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'section',
  'select',
  'source',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'track',
  'tr',
  'u',
  'ul',
  'var',
  'wbr',
].join('|');
const 可转纯文本标签正则 = new RegExp(`<\\/?(?:${可转纯文本标签})(?:\\s[^<>]*?)?\\s*\\/?>`, 'gi');

/**
 * 把酒馆正则的最终结果收敛为正文舞台纯文本。这里只处理通用 HTML/CSS/脚本外壳，
 * 不识别预设名称、正文标签或思维链标签；折叠块的文字会展开成普通文本，而不是复制其视觉层。
 * 游戏自有机器协议必须在调用本函数前由业务清洗层移除。
 */
export function 转为正文舞台纯文本(原文: string): string {
  const 文本 = String(原文 ?? '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*$/i, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*$/i, '')
    .replace(/<(?:iframe|object|embed)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed)\s*>/gi, '')
    .replace(/<(?:iframe|object|embed)\b[^>]*>[\s\S]*$/i, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg\s*>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*$/i, '')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/<br\b[^>]*\/?\s*>/gi, '\n')
    .replace(/<hr\b[^>]*\/?\s*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<\/(?:p|div|section|article|header|footer|li|h[1-6]|details|summary|blockquote|pre|table|tr)\s*>/gi, '\n')
    .replace(可转纯文本标签正则, '')
    .replace(/^\s*```(?:html|xml|css|javascript|js)?\s*$/gim, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  return 解码常见HTML实体(文本).trim();
}
