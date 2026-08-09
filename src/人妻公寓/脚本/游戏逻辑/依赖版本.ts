import { compare } from 'compare-versions';

interface 版本响应 {
  ok: boolean;
  status?: number;
  json(): Promise<unknown>;
}

export type 版本Fetch = (地址: string, 选项: RequestInit) => Promise<版本响应>;

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
  const timer = setTimeout(() => controller.abort(), 超时毫秒);
  try {
    const response = await fetcher(添加缓存破除参数(地址), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status ?? 'unknown'}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function 提取数字版本(值: unknown): string {
  return typeof 值 === 'string' ? (值.match(/\d+(?:\.\d+){1,3}/)?.[0] ?? '') : '';
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
): Promise<string> {
  let 最后错误: unknown;
  for (const 地址 of 地址列表) {
    try {
      const 版本 = 解析(await 请求JSON(地址, fetcher));
      if (!版本) throw new Error('版本清单没有可用的稳定版本');
      return 版本;
    } catch (error) {
      最后错误 = error;
    }
  }
  throw 最后错误 ?? new Error('无法读取版本清单');
}

export function 查询数据库官方最新版本(fetcher: 版本Fetch = 默认Fetch): Promise<string> {
  return 从候选地址查询(数据库版本清单地址, 选择最新数据库稳定版本, fetcher);
}

export function 查询酒馆助手官方最新版本(fetcher: 版本Fetch = 默认Fetch): Promise<string> {
  return 从候选地址查询(
    酒馆助手版本清单地址,
    数据 => 提取数字版本((数据 as { version?: unknown })?.version),
    fetcher,
  );
}
