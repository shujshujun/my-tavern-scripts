/** 时间事务的持久记录与运行期写入租约共同保护当前聊天。此模块不依赖业务状态机。 */
export const 时间事务记录键 = '_时间推进事务';
export const 时间事务未完成提示 = '时间操作尚未完成恢复，请刷新当前聊天后再继续。';
const 共享键 = '__RQGY_TIME_WRITE_LEASES_V1__';
const 修订键 = '__RQGY_TIME_WRITE_REVISIONS_V1__';

interface 时间写入租约记录 {
  聊天ID: string;
  事务ID: string;
  已释放: boolean;
  存活: () => boolean;
}

type 共享宿主 = Record<string, unknown>;

function 宿主(): 共享宿主 {
  if (typeof window === 'undefined') return globalThis as unknown as 共享宿主;
  try {
    const parent = window.parent ?? window;
    // 只有同源父窗才可共享；隔离宿主退回本窗，持久chat记录仍是另一道门。
    void parent.document;
    return parent as unknown as 共享宿主;
  } catch {
    return window as unknown as 共享宿主;
  }
}

function 租约表(): 时间写入租约记录[] {
  const root = 宿主();
  const raw = root[共享键];
  if (Array.isArray(raw)) return raw as 时间写入租约记录[];
  const entries: 时间写入租约记录[] = [];
  root[共享键] = entries;
  return entries;
}

function 活跃租约(聊天ID: string): 时间写入租约记录 | undefined {
  const entries = 租约表();
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i].已释放 || !entries[i].存活()) entries.splice(i, 1);
  }
  return entries.find(entry => entry.聊天ID === 聊天ID);
}

export function 时间事务当前聊天ID(): string {
  try {
    if (typeof SillyTavern === 'undefined') return '';
    const st = SillyTavern as unknown as { getCurrentChatId?: () => unknown; chat?: object };
    const id = st.getCurrentChatId?.();
    if (id !== null && id !== undefined && String(id)) return String(id);
    if (st.chat && typeof st.chat === 'object') {
      // 与手机运行时共享同一匿名聊天令牌表，避免旧宿主在两条写入口得到不同身份。
      const root = 宿主();
      const key = '__RQP_PHONE_CHAT_IDENTITY_V1__';
      let identity = root[key] as { 对象令牌: WeakMap<object, string>; 序号: number } | undefined;
      if (!identity?.对象令牌 || typeof identity.序号 !== 'number') {
        identity = { 对象令牌: new WeakMap<object, string>(), 序号: 0 };
        root[key] = identity;
      }
      const existing = identity.对象令牌.get(st.chat);
      if (existing) return existing;
      const created = `object:${++identity.序号}`;
      identity.对象令牌.set(st.chat, created);
      return created;
    }
  } catch { /* 宿主尚未就绪时仍检查持久记录。 */ }
  return '';
}

function 当前变量(): Record<string, unknown> {
  return typeof getVariables === 'function' ? getVariables({ type: 'chat' }) : {};
}

/** 捕获后即使一笔时间事务已经完成，旧候选也不能跨越这次写入继续提交。 */
export function 当前时间事务写入版本(聊天ID = 时间事务当前聊天ID()): number {
  const revisions = 宿主()[修订键] as Record<string, number> | undefined;
  return revisions?.[聊天ID] ?? 0;
}

/** 可供客户端和后台共同读取；损坏的持久记录也不能当作已经恢复。 */
export function 时间事务阻止普通写入(
  vars: Record<string, unknown> = 当前变量(),
  聊天ID = 时间事务当前聊天ID(),
): boolean {
  return Object.prototype.hasOwnProperty.call(vars, 时间事务记录键) || Boolean(活跃租约(聊天ID));
}

/** 授权只随本次调用传递，不能把同期其他操作变成时间事务的写入者。 */
export type 时间事务写入校验 = (vars: Record<string, unknown>) => unknown;

export function 确认时间事务允许写入(
  校验?: 时间事务写入校验,
  vars: Record<string, unknown> = 当前变量(),
): void {
  if (校验) {
    校验(vars);
    return;
  }
  if (时间事务阻止普通写入(vars)) throw new Error(时间事务未完成提示);
}

/** 在预写chat前同步取得，清理的异步返回完成后才释放；重载销毁旧iframe会清理旧租约。 */
export function 取得时间事务写入租约(聊天ID: string, 事务ID: string, 恢复已有记录 = false): () => void {
  if (!聊天ID || !事务ID || 时间事务当前聊天ID() !== 聊天ID || 活跃租约(聊天ID)) {
    throw new Error('当前聊天已有时间写入，或时间事务身份已经变化。');
  }
  const vars = 当前变量();
  if (Object.prototype.hasOwnProperty.call(vars, 时间事务记录键)) {
    const record = vars[时间事务记录键] as { 聊天ID?: unknown; 事务ID?: unknown } | null;
    if (!恢复已有记录 || record?.聊天ID !== 聊天ID || record?.事务ID !== 事务ID) {
      throw new Error(时间事务未完成提示);
    }
  } else if (恢复已有记录) {
    throw new Error('时间恢复记录已经变化。');
  }
  const owner = typeof window === 'undefined' ? null : window;
  let frame: Element | null = null;
  let doc: Document | undefined;
  try { frame = owner?.frameElement ?? null; doc = owner?.document; } catch { /* 无同源frame时靠释放与pagehide。 */ }
  const entry: 时间写入租约记录 = {
    聊天ID, 事务ID, 已释放: false,
    存活: () => {
      try {
        return !owner?.closed && (!frame || frame.isConnected) && (!doc || owner?.document === doc);
      } catch { return false; }
    },
  };
  const entries = 租约表();
  entries.push(entry);
  const root = 宿主();
  const revisions = (root[修订键] ??= Object.create(null)) as Record<string, number>;
  revisions[聊天ID] = 当前时间事务写入版本(聊天ID) + 1;
  const 释放 = () => {
    if (entry.已释放) return;
    entry.已释放 = true;
    const index = entries.indexOf(entry);
    if (index >= 0) entries.splice(index, 1);
    owner?.removeEventListener?.('pagehide', 释放);
  };
  owner?.addEventListener?.('pagehide', 释放, { once: true });
  return 释放;
}
