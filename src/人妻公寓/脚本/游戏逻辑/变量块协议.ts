/**
 * 外置变量模型的唯一标准协议：
 *
 * <UpdateVariable>
 * <JSONPatch>
 * [...RFC 6902 operations...]
 * </JSONPatch>
 * </UpdateVariable>
 *
 * 提示词只允许这一种输出；本模块额外接纳漏外层、漏内层和裸数组，仅用于把模型错误
 * 归一回标准块。兼容输入不是第二种公开格式。
 */

interface 标准Replace补丁 extends Record<string, unknown> {
  op: 'replace';
  path: string;
  value: unknown;
}

const 危险JSON指针段 = new Set(['__proto__', 'prototype', 'constructor']);

function 解码JSON指针段(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

function 是安全Replace路径(path: unknown): path is string {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  const 原始段 = path.slice(1).split('/');
  if (!原始段.length || 原始段.some(段 => !段 || 段 === '-' || /~(?![01])/u.test(段))) return false;
  return 原始段.every(段 => !危险JSON指针段.has(解码JSON指针段(段)));
}

function 是JSON补丁数组(value: unknown): value is 标准Replace补丁[] {
  return (
    Array.isArray(value) &&
    value.every(item => {
      if (typeof item !== 'object' || item === null) return false;
      const 记录 = item as Record<string, unknown>;
      return (
        记录.op === 'replace' &&
        是安全Replace路径(记录.path) &&
        Object.prototype.hasOwnProperty.call(记录, 'value')
      );
    })
  );
}

function 去完整代码围栏(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function 解析JSON补丁数组(text: string): 标准Replace补丁[] | null {
  const candidate = 去完整代码围栏(text);
  if (!candidate) return null;
  try {
    const value = JSON.parse(candidate) as unknown;
    return 是JSON补丁数组(value) ? value : null;
  } catch {
    return null;
  }
}

export function 构造标准变量块(patch: readonly Record<string, unknown>[]): string {
  return `<UpdateVariable>\n<JSONPatch>\n${JSON.stringify(patch, null, 2)}\n</JSONPatch>\n</UpdateVariable>`;
}

function 解析标准变量块(candidate: string): 标准Replace补丁[] | null {
  const outer = String(candidate ?? '')
    .trim()
    .match(/^<UpdateVariable\b[^>]*>\s*<json_?patch\b[^>]*>([\s\S]*?)<\/json_?patch\s*>\s*<\/UpdateVariable\s*>$/i);
  return outer ? 解析JSON补丁数组(outer[1]) : null;
}

function 读取JSON指针(root: unknown, path: string): { 存在: boolean; 值?: unknown } {
  if (!path.startsWith('/')) return { 存在: false };
  const 段们 = path
    .slice(1)
    .split('/')
    .map(解码JSON指针段);
  let 当前 = root;
  for (const 段 of 段们) {
    if (Array.isArray(当前)) {
      if (!/^(?:0|[1-9]\d*)$/.test(段)) return { 存在: false };
      const 索引 = Number(段);
      if (!Number.isSafeInteger(索引) || 索引 >= 当前.length) return { 存在: false };
      当前 = 当前[索引];
      continue;
    }
    if (typeof 当前 !== 'object' || 当前 === null || !Object.prototype.hasOwnProperty.call(当前, 段)) {
      return { 存在: false };
    }
    当前 = (当前 as Record<string, unknown>)[段];
  }
  return { 存在: true, 值: 当前 };
}

function 深相等(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((值, 索引) => 深相等(值, b[索引]));
  }
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const a键 = Object.keys(a as Record<string, unknown>);
  const b键 = Object.keys(b as Record<string, unknown>);
  return (
    a键.length === b键.length &&
    a键.every(键 => Object.prototype.hasOwnProperty.call(b, 键) && 深相等((a as Record<string, unknown>)[键], (b as Record<string, unknown>)[键]))
  );
}

/**
 * 官方 MVU 外置桥可能先把模型原文写回消息，却因 Gemini 漏掉内层 JSONPatch 而没有更新
 * stat_data。规范器已经能补齐标签，因此这里逐项核对 replace 的最终值：全部命中表示插件
 * 已经真实应用；任一目标缺失或值不同则由游戏在最新外置数据上本地应用一次。replace 重放
 * 幂等，不会重复加值；空数组是合法完成信号但无需再次解析。
 */
export function 标准变量块需要本地应用(变量块: string, 当前stat: unknown): boolean {
  const 补丁 = 解析标准变量块(变量块);
  if (!补丁 || 补丁.length === 0) return false;
  return 补丁.some(操作 => {
    const 当前 = 读取JSON指针(当前stat, 操作.path);
    return !当前.存在 || !深相等(当前.值, 操作.value);
  });
}

/**
 * 规范单个协议候选。返回值只可能是标准 JSONPatch 双层块。
 * 解释、旧 _.set 命令、损坏 JSON、非数组对象及非法补丁返回 null，让上层触发同轮重试。
 */
export function 规范变量协议候选(candidate: string): string | null {
  const trimmed = String(candidate ?? '').trim();
  if (!trimmed) return null;

  const outer = trimmed.match(/^<UpdateVariable\b[^>]*>([\s\S]*?)<\/UpdateVariable\s*>$/i);
  if (outer) {
    const inner = outer[1].trim();
    const jsonPatchBlocks = [...inner.matchAll(/<json_?patch\b[^>]*>([\s\S]*?)<\/json_?patch\s*>/gi)];
    const jsonPatch = jsonPatchBlocks.at(-1);
    if (jsonPatch) {
      const patch = 解析JSON补丁数组(jsonPatch[1]);
      return patch ? 构造标准变量块(patch) : null;
    }

    const rawPatch = 解析JSON补丁数组(inner);
    return rawPatch ? 构造标准变量块(rawPatch) : null;
  }

  const jsonPatch = trimmed.match(/^<json_?patch\b[^>]*>([\s\S]*?)<\/json_?patch\s*>$/i);
  if (jsonPatch) {
    const patch = 解析JSON补丁数组(jsonPatch[1]);
    return patch ? 构造标准变量块(patch) : null;
  }

  const rawPatch = 解析JSON补丁数组(trimmed);
  return rawPatch ? 构造标准变量块(rawPatch) : null;
}
