export const 界面偏好存储键 = '人妻公寓_界面偏好';

export const 已删除界面偏好字段 = ['省流', '减动效'] as const;

export type 界面偏好存储 = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * 返回当前客户端能访问的全部界面偏好存储，父页面优先，并按对象引用去重。
 *
 * 游戏界面运行在酒馆消息 iframe 中；变量解析设置以父页面 localStorage 为共同锚点，而旧版
 * useUIPrefs 曾直接读当前 iframe 的 localStorage。两者在部分宿主中不是同一个对象，因此启动
 * 迁移必须同时清理父页权威存储和当前 iframe 副本，不能只处理其中一路。
 */
export function 取得界面偏好存储候选(): 界面偏好存储[] {
  const 结果: 界面偏好存储[] = [];
  const 加入 = (存储: Storage | undefined): void => {
    if (存储 && !结果.includes(存储)) 结果.push(存储);
  };

  try {
    if (typeof window !== 'undefined') 加入(window.parent?.localStorage);
  } catch {
    /* 跨域父页不可访问时继续尝试其他存储。 */
  }
  try {
    if (typeof window !== 'undefined') 加入(window.top?.localStorage);
  } catch {
    /* 跨域顶层页不可访问时继续尝试当前 iframe。 */
  }
  try {
    if (typeof window !== 'undefined') 加入(window.localStorage);
  } catch {
    /* 沙箱或隐私模式可能拒绝当前 iframe localStorage。 */
  }
  try {
    加入((globalThis as typeof globalThis & { localStorage?: Storage }).localStorage);
  } catch {
    /* Node 测试或宿主限制下允许没有任何持久存储。 */
  }

  return 结果;
}

/** UI 偏好日常读写统一使用父页面优先的共享存储。 */
export function 取得界面偏好存储(): 界面偏好存储 | undefined {
  return 取得界面偏好存储候选()[0];
}

export interface 已删除界面偏好清理结果 {
  偏好: Record<string, unknown>;
  删除字段: string[];
}

/**
 * 把共享界面偏好归一成普通对象，并逐字段移除已经退场的设置。
 *
 * 该纯函数由客户端启动迁移、UI 偏好写回和变量解析偏好写回共同复用，确保旧字段即使因一次
 * localStorage 写入失败而残留，也不会在后续任何合并写中复活；未知字段与嵌套值原样保留。
 */
export function 移除已删除界面偏好字段(值: unknown): 已删除界面偏好清理结果 {
  const 偏好 = 值 && typeof 值 === 'object' && !Array.isArray(值) ? { ...(值 as Record<string, unknown>) } : {};
  const 删除字段: string[] = [];

  for (const 字段 of 已删除界面偏好字段) {
    if (!Object.prototype.hasOwnProperty.call(偏好, 字段)) continue;
    delete 偏好[字段];
    删除字段.push(字段);
  }

  return { 偏好, 删除字段 };
}
