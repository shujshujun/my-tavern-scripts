export const 手机聊天每页条数 = 50;
export const 手机朋友圈每页条数 = 30;

export interface 手机分页结果<T> {
  条目: T[];
  已加载: number;
  有更早: boolean;
}

function 规范加载数(请求数: number | undefined, 总数: number, 每页: number): number {
  const 安全总数 = Math.max(0, Math.floor(总数));
  const 安全页量 = Math.max(1, Math.floor(每页));
  const 请求 = Number.isFinite(请求数) ? Math.floor(请求数!) : 安全页量;
  return Math.min(安全总数, Math.max(安全页量, 请求));
}

/** 微信消息按旧到新存储；默认取末页，继续加载时向前扩展。 */
export function 取聊天显示页<T>(全部: readonly T[], 请求数?: number, 每页 = 手机聊天每页条数): 手机分页结果<T> {
  const 已加载 = 规范加载数(请求数, 全部.length, 每页);
  return {
    条目: 全部.slice(Math.max(0, 全部.length - 已加载)),
    已加载,
    有更早: 已加载 < 全部.length,
  };
}

/** 朋友圈按新到旧存储；默认取首页，继续加载时向后扩展。 */
export function 取朋友圈显示页<T>(全部: readonly T[], 请求数?: number, 每页 = 手机朋友圈每页条数): 手机分页结果<T> {
  const 已加载 = 规范加载数(请求数, 全部.length, 每页);
  return {
    条目: 全部.slice(0, 已加载),
    已加载,
    有更早: 已加载 < 全部.length,
  };
}
