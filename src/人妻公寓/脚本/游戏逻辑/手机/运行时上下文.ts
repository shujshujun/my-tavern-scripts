import { Schema, type SchemaType } from '../../../schema';
import { 读最近有效stat } from '../mvuIO';
import { 取绝对时段 } from '../楼层时钟';

/**
 * 手机运行时上下文（拆分方案 P2）：当前聊天ID / 当前手机数据 / 当前手机绝对时段 / 末楼。
 * 手机子系统的最底层，被全体手机模块引用；只读宿主环境与 MVU，不持有业务状态
 * （聊天身份宿主除外——它只在宿主 window 上惰性建立一次匿名聊天的身份令牌表）。
 */

export function 末楼(): number {
  try {
    return getLastMessageId();
  } catch {
    return Math.max(0, (SillyTavern.chat?.length ?? 1) - 1);
  }
}

export function 当前手机数据(): SchemaType | null {
  try {
    const rawStat = 读最近有效stat();
    return rawStat ? (Schema.parse(rawStat) as SchemaType) : null;
  } catch {
    return null;
  }
}

export function 当前手机绝对时段(): number {
  const data = 当前手机数据();
  return data ? 取绝对时段(data) : -1;
}

const 手机聊天身份宿主键 = '__RQP_PHONE_CHAT_IDENTITY_V1__';

interface 手机聊天身份宿主状态 {
  对象令牌: WeakMap<object, string>;
  序号: number;
}

function 取手机聊天身份宿主状态(): 手机聊天身份宿主状态 {
  const host = (window.parent ?? window) as unknown as Record<string, unknown>;
  const existing = host[手机聊天身份宿主键] as Partial<手机聊天身份宿主状态> | undefined;
  if (existing?.对象令牌 && typeof existing.序号 === 'number') return existing as 手机聊天身份宿主状态;
  const created: 手机聊天身份宿主状态 = { 对象令牌: new WeakMap<object, string>(), 序号: 0 };
  host[手机聊天身份宿主键] = created;
  return created;
}

export function 当前聊天ID(): string {
  try {
    const st = SillyTavern as unknown as { getCurrentChatId?: () => string | number | null; chat?: unknown };
    const id = st.getCurrentChatId?.();
    if (id !== null && id !== undefined && String(id)) return String(id);
    if (st.chat && typeof st.chat === 'object') {
      const 身份 = 取手机聊天身份宿主状态();
      const existing = 身份.对象令牌.get(st.chat);
      if (existing) return existing;
      const created = `object:${++身份.序号}`;
      身份.对象令牌.set(st.chat, created);
      return created;
    }
    return '';
  } catch {
    return '';
  }
}

export function 仍是预期聊天(预期聊天ID: string): boolean {
  return !!预期聊天ID && 当前聊天ID() === 预期聊天ID;
}
