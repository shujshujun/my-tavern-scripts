/**
 * 对已经做过常规正文清洗的文本再执行一次“宁可判空”的协议剥离。
 *
 * 普通主回合为了兼容漏标签的玩家预设，会在吞尾后整楼为空时回退原文；独立事件、
 * 确定性强剧情和静音会议不能采用该回退，否则纯思维链或纯变量块会被误认成有效演出。
 */
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
    .replace(/^\s*_.(?:set|insert|assign|remove|unset|delete|add)\(.*\)\s*;?\s*$/gim, '')
    .trim();

  // MVU 还接受不带标签的裸 RFC 6902 数组。只剥正文末尾且确实能解析为补丁的数组，
  // 避免普通叙事里偶然出现中括号时被误删。
  const 裸补丁 = 结果.match(/(?:```(?:json)?\s*)?(\[\s*\{[\s\S]*?"op"\s*:[\s\S]*?\}\s*\])\s*(?:```)?\s*$/i);
  if (裸补丁?.index !== undefined) {
    try {
      const 值 = JSON.parse(裸补丁[1]) as unknown;
      if (
        Array.isArray(值) &&
        值.every(
          项 =>
            typeof 项 === 'object' &&
            项 !== null &&
            typeof (项 as Record<string, unknown>).op === 'string' &&
            typeof (项 as Record<string, unknown>).path === 'string',
        )
      ) {
        结果 = 结果.slice(0, 裸补丁.index).trim();
      }
    } catch {
      /* 不是合法补丁，按普通正文保留。 */
    }
  }
  return 结果;
}
