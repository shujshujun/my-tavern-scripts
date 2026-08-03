/**
 * 对已经做过常规正文清洗的文本再执行一次“宁可判空”的协议剥离。
 *
 * 普通主回合为了兼容漏标签的玩家预设，会在吞尾后整楼为空时回退原文；独立事件、
 * 确定性强剧情和静音会议不能采用该回退，否则纯思维链或纯变量块会被误认成有效演出。
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

export function 清除末尾残缺协议标签(正文: string): string {
  let 结果 = String(正文 ?? '').trim();
  const 残缺标签 = 结果.match(/<\/?([A-Za-z_\u3400-\u9fff][A-Za-z0-9_\u3400-\u9fff~:-]*)$/);
  const 协议标签 = [
    'think',
    'thinking',
    'reason',
    'reasoning',
    'UpdateVariable',
    'json_patch',
    'jsonpatch',
    'options',
    '行为等级',
    '尺度判定',
    'tucao',
    'content',
    'story_scene',
  ];
  if (
    残缺标签?.index !== undefined &&
    协议标签.some(标签 => 标签.toLowerCase().startsWith(残缺标签[1].toLowerCase()))
  ) {
    结果 = 结果.slice(0, 残缺标签.index).trim();
  } else if (/<\/?$/.test(结果)) {
    结果 = 结果.replace(/<\/?$/, '').trim();
  }
  return 结果;
}

export function 严格清除协议残留(正文: string): string {
  let 结果 = String(正文 ?? '')
    .replace(/<think(?:ing)?\b[^>]*>[\s\S]*?<\/think(?:ing)?\s*>/gi, '')
    .replace(/<reason(?:ing)?\b[^>]*>[\s\S]*?<\/reason(?:ing)?\s*>/gi, '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable\s*>/gi, '')
    .replace(/<json_?patch\b[^>]*>[\s\S]*?<\/json_?patch\s*>/gi, '')
    .replace(/<options\b[^>]*>[\s\S]*?<\/options\s*>/gi, '')
    .replace(/<行为等级(?:\s[^>]*)?>[\s\S]*?<\/行为等级\s*>/gi, '')
    .replace(/<尺度判定(?:\s[^>]*)?>[\s\S]*?<\/尺度判定\s*>/gi, '')
    .replace(/<tucao\b[^>]*>[\s\S]*?<\/tucao\s*>/gi, '')
    // 部分兼容端把内层 JSONPatch 当成最终返回，却仍附带外层 UpdateVariable 的闭标签。
    // 完整块被移除后，这些孤立闭标签也属于协议，绝不能作为“有效正文”参与兜底选择。
    .replace(/<\/(?:think(?:ing)?|reason(?:ing)?|UpdateVariable|json_?patch|options|行为等级|尺度判定|tucao)\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(
      /<(?:think(?:ing)?|reason(?:ing)?|UpdateVariable|json_?patch|options|tucao|draft_notes|bginfor|CEstuff|fox_selc|fox_tip|VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)\b[^>]*>[\s\S]*$/i,
      '',
    )
    .replace(/<(?:行为等级|尺度判定)(?:\s[^>]*)?>[\s\S]*$/i, '')
    .replace(/<konatan_planning~(?:\s[^>]*)?>[\s\S]*$/i, '')
    .replace(/【开始思考】[\s\S]*$/i, '')
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*$/i, '')
    .replace(/<!DOCTYPE[\s\S]*$/i, '')
    .replace(/<style\b[^>]*>[\s\S]*$/i, '')
    .replace(/<script\b[^>]*>[\s\S]*$/i, '')
    .replace(/<!--[\s\S]*$/, '')
    .replace(/^\s*_\.(?:set|insert|assign|remove|unset|delete|add)\(.*\)\s*;?\s*$/gim, '')
    .trim();

  // 全量流式事件可能停在 `<`、`<Upd` 之类协议标签前缀；它们不能单独成为正文，
  // 但普通叙事末尾的爱心写法 `<3` 不符合标签名前缀，仍会保留。
  结果 = 清除末尾残缺协议标签(结果);

  // MVU 还接受不带标签的裸 RFC 6902 数组。只剥正文末尾且确实能解析为补丁的数组，
  // 避免普通叙事里偶然出现中括号时被误删。
  return 清除末尾裸JSON补丁(结果);
}
