import { compare } from 'compare-versions';

interface 版本响应 {
  ok: boolean;
  status?: number;
  json(): Promise<unknown>;
}

export type 版本Fetch = (地址: string, 选项: RequestInit) => Promise<版本响应>;
export type 稳定版本关系 = '无法确认' | '相同' | '当前较新' | '当前较旧';

/**
 * 只接受纯数字正式版，允许宿主本地 API 常见的单个 v 前缀。
 * beta/rc/dev、其他产品前缀和夹带说明文字都不能冒充稳定版。
 */
export function 提取稳定数字版本(值: unknown): string {
  if (typeof 值 !== 'string') return '';
  return 值.trim().match(/^v?(\d+(?:\.\d+){1,3})$/i)?.[1] ?? '';
}

/** 严格比较两个正式版；任一侧不是可确认的稳定版时失败关闭。 */
export function 比较稳定版本(当前值: unknown, 官方值: unknown): 稳定版本关系 {
  const 当前 = 提取稳定数字版本(当前值);
  const 官方 = 提取稳定数字版本(官方值);
  if (!当前 || !官方) return '无法确认';
  try {
    if (compare(当前, 官方, '=')) return '相同';
    return compare(当前, 官方, '>') ? '当前较新' : '当前较旧';
  } catch {
    return '无法确认';
  }
}

/** 随角色卡发布的游戏本体版本；与 MVU 存档的数据版本无关。 */
export const 当前游戏版本 = '0.88';

export const 游戏版本清单地址 = [
  'https://data.jsdelivr.com/v1/package/gh/shujshujun/my-tavern-scripts',
  'https://api.github.com/repos/shujshujun/my-tavern-scripts/git/matching-refs/tags/rq',
] as const;

export const 数据库版本清单地址 = [
  'https://data.jsdelivr.com/v1/package/gh/AlbusKen/shujuku',
  'https://api.github.com/repos/AlbusKen/shujuku/tags?per_page=100',
] as const;

export const 酒馆助手版本清单地址 = [
  'https://raw.githubusercontent.com/N0VI028/JS-Slash-Runner/main/manifest.json',
  'https://fastly.jsdelivr.net/gh/N0VI028/JS-Slash-Runner@main/manifest.json',
] as const;

function 默认Fetch(地址: string, 选项: RequestInit): Promise<版本响应> {
  return fetch(地址, 选项);
}

function 添加缓存破除参数(地址: string): string {
  return `${地址}${地址.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

async function 请求JSON(地址: string, fetcher: 版本Fetch, 超时毫秒 = 8000): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const 请求 = (async () => {
    const response = await fetcher(添加缓存破除参数(地址), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status ?? 'unknown'}`);
    return await response.json();
  })();
  const 超时 = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`版本请求超时(>${超时毫秒}ms)`));
    }, Math.max(1, 超时毫秒));
  });
  try {
    // AbortSignal 是对原生 fetch 的主动取消；Promise.race 则保证旧宿主、测试替身或
    // response.json 忽略 signal 时，调用方仍会在有界时间内失败并切换镜像。
    return await Promise.race([请求, 超时]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** 官方仓库还包含其他角色卡标签；这里只接受《人妻公寓》的 rq 稳定标签。 */
export function 选择最新游戏稳定版本(数据: unknown): string {
  const 标签 = Array.isArray(数据)
    ? 数据.map(item =>
        typeof item === 'string'
          ? item
          : ((item as { ref?: unknown } | null)?.ref ?? (item as { name?: unknown } | null)?.name),
      )
    : Array.isArray((数据 as { versions?: unknown } | null)?.versions)
      ? (数据 as { versions: unknown[] }).versions
      : [];
  const 稳定版本 = 标签
    .map(标签名 =>
      typeof 标签名 === 'string' ? 标签名.match(/^(?:refs\/tags\/)?rq(\d+(?:\.\d+){1,3})$/i)?.[1] : undefined,
    )
    .filter((版本): 版本 is string => Boolean(版本));
  return 稳定版本.reduce((最新, 版本) => (!最新 || compare(版本, 最新, '>') ? 版本 : 最新), '');
}

/** 只接受数据库作者的 spv 稳定标签；test/xing/裸数字标签都不会被误判为最新版。 */
export function 选择最新数据库稳定版本(数据: unknown): string {
  const 标签 = Array.isArray(数据)
    ? 数据.map(item => (typeof item === 'string' ? item : (item as { name?: unknown })?.name))
    : Array.isArray((数据 as { versions?: unknown })?.versions)
      ? (数据 as { versions: unknown[] }).versions
      : [];
  const 稳定版本 = 标签
    .map(标签名 => (typeof 标签名 === 'string' ? 标签名.match(/^spv(\d+(?:\.\d+){1,3})$/i)?.[1] : undefined))
    .filter((版本): 版本 is string => Boolean(版本));
  return 稳定版本.reduce((最新, 版本) => (!最新 || compare(版本, 最新, '>') ? 版本 : 最新), '');
}

async function 从候选地址查询(
  地址列表: readonly string[],
  解析: (数据: unknown) => string,
  fetcher: 版本Fetch,
  超时毫秒 = 8000,
): Promise<string> {
  let 最后错误: unknown;
  for (const 地址 of 地址列表) {
    try {
      const 版本 = 解析(await 请求JSON(地址, fetcher, 超时毫秒));
      if (!版本) throw new Error('版本清单没有可用的稳定版本');
      return 版本;
    } catch (error) {
      最后错误 = error;
    }
  }
  throw 最后错误 ?? new Error('无法读取版本清单');
}

export function 查询数据库官方最新版本(fetcher: 版本Fetch = 默认Fetch, 超时毫秒 = 8000): Promise<string> {
  return 从候选地址查询(数据库版本清单地址, 选择最新数据库稳定版本, fetcher, 超时毫秒);
}

export function 查询游戏官方最新版本(fetcher: 版本Fetch = 默认Fetch, 超时毫秒 = 8000): Promise<string> {
  return 从候选地址查询(游戏版本清单地址, 选择最新游戏稳定版本, fetcher, 超时毫秒);
}

export function 查询酒馆助手官方最新版本(fetcher: 版本Fetch = 默认Fetch, 超时毫秒 = 8000): Promise<string> {
  return 从候选地址查询(
    酒馆助手版本清单地址,
    数据 => 提取稳定数字版本((数据 as { version?: unknown })?.version),
    fetcher,
    超时毫秒,
  );
}
