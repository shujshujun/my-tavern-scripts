import { 清除游戏机器协议, 清除末尾残缺游戏协议标签 } from './游戏机器协议';

/**
 * 正文协议安全工具：识别裸 JSON Patch、思维链和残缺 XML 标签，供业务成功门使用。
 * 玩家显示由 `正文输出边界.ts` 单独处理；这里的严格判定不得反向决定玩家能否看见失败残稿。
 */
function 是JSON补丁数组(值: unknown): 值 is Array<Record<string, unknown>> {
  return (
    Array.isArray(值) &&
    值.every(
      项 =>
        typeof 项 === 'object' &&
        项 !== null &&
        typeof (项 as Record<string, unknown>).op === 'string' &&
        typeof (项 as Record<string, unknown>).path === 'string',
    )
  );
}

function 查找末尾裸JSON补丁(正文: string): { 开始: number; 数组: string } | null {
  const 结果 = String(正文 ?? '').trim();
  const 末尾围栏 = 结果.match(/(?:\r?\n)?```\s*$/);
  const 主体末尾 = 末尾围栏?.index ?? 结果.length;
  const 主体 = 结果.slice(0, 主体末尾).trimEnd();
  if (!主体.endsWith(']')) return null;

  let 起点 = 主体.lastIndexOf('[');
  while (起点 >= 0) {
    const 数组 = 主体.slice(起点).trim();
    try {
      const 值 = JSON.parse(数组) as unknown;
      if (是JSON补丁数组(值)) {
        const 前缀 = 主体.slice(0, 起点);
        const 开始围栏 = 前缀.match(/```(?:json)?\s*$/i);
        // 单独一行的 [] 是合法的“本轮无变化”补丁；叙事句子里的普通 [] 仍保留。
        if (值.length > 0 || 起点 === 0 || 开始围栏 || /[\r\n]\s*$/.test(前缀)) {
          return { 开始: 开始围栏?.index ?? 起点, 数组 };
        }
      }
    } catch {
      /* 当前左括号不是末尾 JSON 数组的起点，继续向前寻找。 */
    }
    if (起点 === 0) break;
    起点 = 主体.lastIndexOf('[', 起点 - 1);
  }
  return null;
}

export function 提取末尾裸JSON补丁(正文: string): string | null {
  return 查找末尾裸JSON补丁(正文)?.数组 ?? null;
}

export function 清除末尾裸JSON补丁(正文: string): string {
  const 结果 = String(正文 ?? '').trim();
  const 裸补丁 = 查找末尾裸JSON补丁(结果);
  if (裸补丁) return 结果.slice(0, 裸补丁.开始).trim();
  return 结果;
}

export function 清除末尾残缺输出标签(正文: string): string {
  const 结果 = 清除末尾残缺游戏协议标签(正文);
  return /<\/?$/.test(结果) ? 结果.replace(/<\/?$/, '').trim() : 结果;
}

export function 严格清除协议残留(正文: string): string {
  let 结果 = 清除游戏机器协议(String(正文 ?? ''))
    .replace(
      /<(?:think(?:ing)?|reason(?:ing)?|analysis|thought)\b[^>]*>[\s\S]*?<\/(?:think(?:ing)?|reason(?:ing)?|analysis|thought)\s*>/gi,
      '',
    )
    .replace(/<\/(?:think(?:ing)?|reason(?:ing)?|analysis|thought)\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(?:think(?:ing)?|reason(?:ing)?|analysis|thought)\b[^>]*>[\s\S]*$/i, '')
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*$/i, '')
    .replace(/<!DOCTYPE[\s\S]*$/i, '')
    .replace(/<style\b[^>]*>[\s\S]*$/i, '')
    .replace(/<script\b[^>]*>[\s\S]*$/i, '')
    .replace(/<!--[\s\S]*$/, '')
    .replace(/^\s*_\.(?:set|insert|assign|remove|unset|delete|add)\(.*\)\s*;?\s*$/gim, '')
    .trim();

  // 全量流式事件可能停在 `<`、`<Upd` 之类协议标签前缀；它们不能单独成为正文，
  // 但普通叙事末尾的爱心写法 `<3` 不符合标签名前缀，仍会保留。
  结果 = 清除末尾残缺输出标签(结果);

  // 显示层允许玩家看见半截外部标签；严格成功门另外剥除 XML 形态的残片，避免把它当成有效正文。
  const 残缺外部标签 = 结果.match(/<\/?[A-Za-z_][A-Za-z0-9_~:-]*(?:\s[^<>]*)?$/);
  if (残缺外部标签?.index !== undefined) 结果 = 结果.slice(0, 残缺外部标签.index).trim();

  // MVU 还接受不带标签的裸 RFC 6902 数组。只剥正文末尾且确实能解析为补丁的数组，
  // 避免普通叙事里偶然出现中括号时被误删。
  return 清除末尾裸JSON补丁(结果);
}
