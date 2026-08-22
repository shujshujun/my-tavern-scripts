import { 严格清除协议残留, 清除末尾残缺输出标签, 清除末尾裸JSON补丁 } from './正文协议安全';
import { 转为正文舞台纯文本 } from './预设输出兼容';
import { 清除游戏机器协议 } from './游戏机器协议';

const 外部正文标签 = ['content', 'story_scene', 'dream_body', '正文', 'revised', 'response', 'final', 'answer', 'game'] as const;
export type 外部正文标签 = (typeof 外部正文标签)[number];
export interface 外部正文提取选项 {
  期望正文标签?: 外部正文标签 | null;
  /** assistant prefill 已打开私有标签、最终正文不另带封套时，等到私有闭标签再放行。 */
  等待思维闭标签?: boolean;
  /** 流式帧在已知封套出现前可能只有 assistant prefill 后的裸思考文字，必须保持隐藏。 */
  流式?: boolean;
}
const 外部思维标签源 =
  '(?:think(?:ing)?|reason(?:ing)?|analysis|thought|metacognition|original|os|meow|[A-Za-z_:~-]*(?:think|reason|analysis|thought|draft|cot|plan)[A-Za-z_:~-]*|meta_[A-Za-z_:~-]+|[A-Za-z_:~-]+_meta|bginfor|CEstuff|fox_selc|fox_tip|tucao|VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge|验证|思考|评估|页眉)';
const 私有折叠标题 = /(?:思考|思维|推理|分析|创作过程|草稿|规划|检查|reason|analysis|thinking|thought|chain[\s_-]*of[\s_-]*thought|\bcot\b)/i;

function 最后正文开标签(文本: string): { 标签: 外部正文标签; 结束: number } | null {
  let 命中: { 标签: 外部正文标签; 结束: number } | null = null;
  for (const 标签 of 外部正文标签) {
    const 匹配们 = [...文本.matchAll(new RegExp(`<${标签}(?=\\s|/?>)[^>]*>`, 'gi'))];
    const 最后 = 匹配们.at(-1);
    if (最后?.index === undefined) continue;
    const 结束 = 最后.index + 最后[0].length;
    if (!命中 || 结束 > 命中.结束) 命中 = { 标签, 结束 };
  }
  return 命中;
}

function 截到正文封套结尾(正文后: string, 标签: 外部正文标签): string {
  const 边界们 = [new RegExp(`</${标签}\\s*>`, 'i')];
  if (标签 === 'content') 边界们.push(/<(?:Fav|g)\b[^>]*>/i);
  if (标签 === 'dream_body') 边界们.push(/<dream_after_format\b[^>]*>/i, /<\/dream_plot\s*>/i);
  const 位置们 = 边界们.map(边界 => 边界.exec(正文后)?.index ?? -1).filter(位置 => 位置 >= 0);
  return 位置们.length ? 正文后.slice(0, Math.min(...位置们)) : 正文后;
}

/**
 * 显示正则有时把私有思维链包成折叠块。只删除标题明确表示思考/分析的闭合块；普通
 * details 仍交给纯文本层展开。由内向外处理，避免嵌套折叠残留私有内容。
 */
function 移除私有思维折叠块(原文: string): string {
  const 最内层闭合折叠 = /<details\b[^>]*>(?:(?!<details\b)[\s\S])*?<\/details\s*>/gi;
  let 文本 = 原文;
  while (true) {
    const 下一轮 = 文本.replace(最内层闭合折叠, 整块 => {
      const 标题 = 整块.match(/<summary\b[^>]*>([\s\S]*?)<\/summary\s*>/i)?.[1] ?? '';
      const 开标签 = 整块.match(/^<details\b[^>]*>/i)?.[0] ?? '';
      const 私有属性 = /(?:class|id)\s*=\s*["'][^"']*(?:think|reason|analysis|thought|cot|draft|plan|meta)[^"']*["']/i;
      return 私有折叠标题.test(标题.replace(/<[^>]+>/g, '')) || 私有属性.test(开标签) ? '' : 整块;
    });
    if (下一轮 === 文本) return 文本;
    文本 = 下一轮;
  }
}

function 移除闭合私有思维块(原文: string): string {
  return 原文.replace(
    new RegExp(`<${外部思维标签源}(?=\\s|/?>)[^>]*>[\\s\\S]*?</${外部思维标签源}\\s*>`, 'gi'),
    '',
  );
}

/**
 * 外部预设正文边界：只识别通用协议形状，不识别预设名称。
 *
 * 必须先截取 content/story_scene/dream_body，再清理未闭合思维链；否则 Prism 一类
 * 输出在思维标签漏闭合但正文封套完整时，会把有效正文连同思维尾巴一起吞掉。
 */
export function 提取外部预设正文原文(原文: string, 选项: 外部正文提取选项 = {}): string {
  let 文本 = String(原文 ?? '');
  const 正文开标签 = 最后正文开标签(文本);
  if (选项.流式 && 选项.期望正文标签 && !正文开标签) return '';
  if (
    选项.流式 &&
    选项.等待思维闭标签 &&
    !正文开标签 &&
    !new RegExp(`</${外部思维标签源}\\s*>`, 'i').test(文本)
  ) {
    return '';
  }
  if (正文开标签) {
    文本 = 截到正文封套结尾(文本.slice(正文开标签.结束), 正文开标签.标签);
  } else {
    // 先移除完整思维块，再判断残留闭标签；否则多段“思维→正文”交错输出只会留下最后一段正文。
    文本 = 移除闭合私有思维块(移除私有思维折叠块(文本));
    // assistant prefill 可能只让最终返回携带思维闭标签；它之前的内容仍是私有推理。
    const 思维闭标签们 = [...文本.matchAll(new RegExp(`</${外部思维标签源}\\s*>`, 'gi'))];
    const 最后思维闭标签 = 思维闭标签们.at(-1);
    if (最后思维闭标签?.index !== undefined) {
      文本 = 文本.slice(最后思维闭标签.index + 最后思维闭标签[0].length);
    }
  }

  文本 = 移除私有思维折叠块(文本)
    .replace(/<meta(?:\s[^>]*)?>[\s\S]*?<\/meta\s*>/gi, '')
    // 开闭标签名偶尔混用 thinking/think，不能要求反向引用完全一致。
    .replace(new RegExp(`<${外部思维标签源}(?=\\s|/?>)[^>]*>[\\s\\S]*?</${外部思维标签源}\\s*>`, 'gi'), '')
    // 没有正文封套兜底时，未闭合思维链仍必须失败关闭，不能显示或提交私有内容。
    .replace(new RegExp(`<${外部思维标签源}(?=\\s|/?>)[^>]*>[\\s\\S]*$`, 'i'), '')
    .replace(new RegExp(`</?${外部思维标签源}(?=\\s|/?>)[^>]*>`, 'gi'), '')
    .replace(/【开始思考】[\s\S]*$/i, '')
    // content 内的输出次数是预设元数据，不属于故事正文；漏闭合时同样裁到标签前。
    .replace(/<c\b[^>]*>[\s\S]*?<\/c\s*>/gi, '')
    .replace(/<c\b[^>]*>[\s\S]*$/i, '')
    .replace(/<\/c\s*>/gi, '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<dream_after_format\b[^>]*>[\s\S]*?(?:<\/dream_after_format\s*>|$)/gi, '')
    .replace(/<dream_delete\b[^>]*>[\s\S]*?(?:<\/dream_delete\s*>|$)/gi, '')
    .replace(/<dream_done\s*\/\s*>/gi, '')
    .replace(/<\/?(?:dream_plot|dream_body|dream_after_format|content|story_scene|正文|revised|response|final|answer|game)(?=\s|\/?>)[^>]*>/gi, '');
  return 文本;
}

/** 玩家显示边界：思维链永不进入界面；故事正文再隔离游戏协议并转为纯文字。 */
export function 提取正文舞台文本(原文: string, 选项: 外部正文提取选项 = {}): string {
  const 外部正文 = 提取外部预设正文原文(原文, 选项);
  const 纯文本 = 转为正文舞台纯文本(清除游戏机器协议(外部正文));
  return 清除末尾裸JSON补丁(清除末尾残缺输出标签(纯文本));
}

/** 业务成功边界：从模型原始回复中剥除思维链和游戏协议，得到可提交故事正文。 */
export function 提取可提交正文(原文: string, 选项: 外部正文提取选项 = {}): string {
  const 外部正文 = 提取外部预设正文原文(原文, 选项);
  const 无思维链 = 严格清除协议残留(外部正文);
  return 严格清除协议残留(转为正文舞台纯文本(清除游戏机器协议(无思维链)));
}
