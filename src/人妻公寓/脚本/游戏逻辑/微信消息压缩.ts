export interface 可压缩微信消息 {
  会话: string;
  发: string;
  类?: string;
  键?: string;
  序?: number;
  标识?: string;
  引用?: { 序?: number; 标识?: string };
}

function 稳定定位(消息: 可压缩微信消息): string[] {
  const 结果: string[] = [];
  if (typeof 消息.标识 === 'string' && 消息.标识.trim()) 结果.push(`id:${消息.标识.trim()}`);
  if (typeof 消息.序 === 'number' && Number.isSafeInteger(消息.序) && 消息.序 >= 0) 结果.push(`seq:${消息.序}`);
  return 结果;
}

function 引用定位(消息: 可压缩微信消息): string[] {
  const 引用 = 消息.引用;
  if (!引用) return [];
  const 结果: string[] = [];
  if (typeof 引用.标识 === 'string' && 引用.标识.trim()) 结果.push(`id:${引用.标识.trim()}`);
  if (typeof 引用.序 === 'number' && Number.isSafeInteger(引用.序) && 引用.序 >= 0) 结果.push(`seq:${引用.序}`);
  return 结果;
}

/**
 * 只裁目标会话的旧普通气泡。带强事件键、撤回/通话墓碑、系统消息、
 * 调用方额外保护的未读消息，以及仍被保留气泡引用的原文都不参与软上限。
 * 返回顺序与原数组完全一致，避免改变同楼消息顺序和引用定位。
 */
export function 压缩微信会话消息<T extends 可压缩微信消息>(
  消息们: readonly T[],
  会话: string,
  普通气泡上限: number,
  额外保护: (消息: T) => boolean = () => false,
): T[] {
  const 上限 = Math.max(0, Math.floor(普通气泡上限));
  const 目标索引 = 消息们.map((消息, 索引) => ({ 消息, 索引 })).filter(项 => 项.消息.会话 === 会话);
  const 保留 = new Set<number>();
  const 普通索引: number[] = [];
  for (const { 消息, 索引 } of 目标索引) {
    if (消息.键 || 消息.发 === '系统' || 消息.类 === '撤回' || 消息.类 === '通话' || 额外保护(消息)) {
      保留.add(索引);
    } else {
      普通索引.push(索引);
    }
  }
  // 软上限只计算可裁的普通气泡；强事件、墓碑、系统/未读保护和引用目标均为额外保留。
  if (普通索引.length <= 上限) return [...消息们];
  for (const 索引 of 普通索引.slice(Math.max(0, 普通索引.length - 上限))) 保留.add(索引);

  const 定位到索引 = new Map<string, number>();
  for (const { 消息, 索引 } of 目标索引) {
    for (const 定位 of 稳定定位(消息)) 定位到索引.set(定位, 索引);
  }
  let 变化 = true;
  while (变化) {
    变化 = false;
    for (const 索引 of [...保留]) {
      const 消息 = 消息们[索引];
      if (!消息 || 消息.会话 !== 会话) continue;
      for (const 定位 of 引用定位(消息)) {
        const 目标 = 定位到索引.get(定位);
        if (目标 !== undefined && !保留.has(目标)) {
          保留.add(目标);
          变化 = true;
        }
      }
    }
  }

  return 消息们.filter((消息, 索引) => 消息.会话 !== 会话 || 保留.has(索引));
}
