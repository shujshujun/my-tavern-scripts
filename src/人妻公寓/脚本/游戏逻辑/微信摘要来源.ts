/** 摘要沿用v1四组结构，来源标签只用于撤回校验，不进入玩家或模型的可读文本。 */
interface 有来源微信摘要 {
  f: string[];
  a: string[];
  b: string[];
  p: string[];
}

export function 微信摘要消息来源(消息: { 序?: number; 标识?: string }): string | undefined {
  if (Number.isSafeInteger(消息.序) && 消息.序! >= 0) return `s${消息.序}`;
  return 消息.标识 ? `i${encodeURIComponent(消息.标识)}` : undefined;
}

const 来源前缀 = /^\[微信来源:([^\]]+)\]/u;

export function 带微信摘要来源(文: string, 来源: readonly (string | undefined)[]): string {
  const IDs = [...new Set(来源.filter((项): 项 is string => !!项))];
  if (!IDs.length) return 文;
  const 前缀 = `[微信来源:${IDs.join('|')}]`;
  return 前缀.length < 400 ? 前缀 + 文.slice(0, 400 - 前缀.length) : '';
}

export function 移除微信摘要来源标记(文: string): string {
  return 文.replace(来源前缀, '');
}

/** 旧条目无来源且本会话确有撤回时，不能证明它不包含原文；只撤销注入资格，不删除数据库。 */
export function 排除已撤回微信摘要<T extends 有来源微信摘要>(数据: T, 撤回来源: ReadonlySet<string>): T {
  const 结果 = { ...数据 };
  for (const 组 of ['f', 'a', 'b', 'p'] as const) {
    结果[组] = 数据[组].filter(文 => {
      const 来源 = 来源前缀.exec(文)?.[1]?.split('|');
      return 来源 ? !来源.some(id => 撤回来源.has(id)) : 撤回来源.size === 0;
    });
  }
  return 结果;
}
