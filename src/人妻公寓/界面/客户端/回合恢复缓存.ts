/**
 * 回合恢复缓存只保存“尚未确认成功”的玩家行动。
 * 使用会话存储而不是游戏变量：它不参与剧情快照、变量解析或回档结算，只负责 iframe
 * 刷新后的 UI 恢复；聊天 ID、末楼与消息签名三者必须同时匹配，避免跨聊天／跨分支重放。
 */

export interface 回合恢复存储 {
  getItem(键: string): string | null;
  setItem(键: string, 值: string): void;
  removeItem(键: string): void;
}

export interface 回合恢复记录 {
  聊天ID: string;
  行动: string;
  锚楼: number;
  锚签名: string;
  记录时间: number;
}

export type 回合恢复上下文 = Pick<回合恢复记录, '聊天ID' | '锚楼' | '锚签名'>;

export const 回合恢复缓存键 = '人妻公寓_回合恢复_v1';
const 回合恢复有效期毫秒 = 24 * 60 * 60 * 1000;

interface 回合恢复缓存表 {
  版本: 1;
  记录: Record<string, unknown>;
}

function 是对象(值: unknown): 值 is Record<string, unknown> {
  return typeof 值 === 'object' && 值 !== null && !Array.isArray(值);
}

function 规范记录(值: unknown): 回合恢复记录 | null {
  if (!是对象(值)) return null;
  const 聊天ID = typeof 值.聊天ID === 'string' ? 值.聊天ID.trim() : '';
  const 行动 = typeof 值.行动 === 'string' ? 值.行动.trim() : '';
  const 锚楼 = 值.锚楼;
  const 锚签名 = typeof 值.锚签名 === 'string' ? 值.锚签名 : '';
  const 记录时间 = 值.记录时间;
  if (!聊天ID || !行动 || typeof 锚楼 !== 'number' || !Number.isInteger(锚楼) || 锚楼 < 0) return null;
  if (typeof 记录时间 !== 'number' || !Number.isFinite(记录时间) || 记录时间 < 0) return null;
  return { 聊天ID, 行动, 锚楼, 锚签名, 记录时间 };
}

function 读缓存表(存储: 回合恢复存储): 回合恢复缓存表 {
  try {
    const 原文 = 存储.getItem(回合恢复缓存键);
    if (!原文) return { 版本: 1, 记录: {} };
    const 值 = JSON.parse(原文) as unknown;
    if (!是对象(值) || 值.版本 !== 1 || !是对象(值.记录)) throw new Error('invalid recovery cache');
    return { 版本: 1, 记录: { ...值.记录 } };
  } catch {
    try {
      存储.removeItem(回合恢复缓存键);
    } catch {
      /* 存储不可写时失败关闭，不影响核心回合。 */
    }
    return { 版本: 1, 记录: {} };
  }
}

function 写缓存表(存储: 回合恢复存储, 表: 回合恢复缓存表): void {
  try {
    if (!Object.keys(表.记录).length) {
      存储.removeItem(回合恢复缓存键);
      return;
    }
    存储.setItem(回合恢复缓存键, JSON.stringify(表));
  } catch {
    /* UI 恢复属于可选副作用；浏览器禁用存储时不得阻塞行动。 */
  }
}

export function 保存回合恢复记录(存储: 回合恢复存储, 候选: 回合恢复记录): void {
  const 聊天ID = typeof 候选.聊天ID === 'string' ? 候选.聊天ID.trim() : '';
  const 表 = 读缓存表(存储);
  const 记录 = 规范记录({ ...候选, 聊天ID });
  if (!聊天ID) return;
  if (!记录) delete 表.记录[聊天ID];
  else 表.记录[聊天ID] = 记录;
  写缓存表(存储, 表);
}

export function 读取回合恢复记录(
  存储: 回合恢复存储,
  上下文: 回合恢复上下文,
  当前时间 = Date.now(),
): 回合恢复记录 | null {
  const 聊天ID = 上下文.聊天ID.trim();
  if (!聊天ID) return null;
  const 表 = 读缓存表(存储);
  const 记录 = 规范记录(表.记录[聊天ID]);
  if (!记录) return null;
  if (当前时间 - 记录.记录时间 > 回合恢复有效期毫秒 || 当前时间 < 记录.记录时间) {
    delete 表.记录[聊天ID];
    写缓存表(存储, 表);
    return null;
  }
  if (记录.锚楼 !== 上下文.锚楼 || 记录.锚签名 !== 上下文.锚签名) return null;
  return 记录;
}

export function 清除回合恢复记录(存储: 回合恢复存储, 聊天ID: string): void {
  const 键 = 聊天ID.trim();
  if (!键) return;
  const 表 = 读缓存表(存储);
  if (!Object.prototype.hasOwnProperty.call(表.记录, 键)) return;
  delete 表.记录[键];
  写缓存表(存储, 表);
}
