/**
 * 酒馆的流式事件与 `generate()` 最终返回偶尔会不同步：玩家已经看见完整正文，
 * 最终 Promise 却可能只剩空串或变量协议。只有最终返回确实没有可用正文时，才允许
 * 采用同一个正文 generation_id 留下的最后一份完整流式文本；正常最终返回永远优先。
 */
export function 选择正文生成原文(最终返回: unknown, 流式缓存: unknown, 清洗正文: (原文: string) => string): string {
  const 最终原文 = typeof 最终返回 === 'string' ? 最终返回 : '';
  const 流式原文 = typeof 流式缓存 === 'string' ? 流式缓存 : '';
  const 有正文 = (原文: string) => Boolean(原文.trim() && 清洗正文(原文).trim());

  if (有正文(最终原文)) return 最终原文;
  if (有正文(流式原文)) return 流式原文;
  return 最终原文;
}
