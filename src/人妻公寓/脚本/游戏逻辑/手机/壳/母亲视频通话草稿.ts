interface 母亲视频通话草稿存储 {
  getItem(键: string): string | null;
  setItem(键: string, 值: string): void;
  removeItem(键: string): void;
}

const 母亲视频通话草稿前缀 = '人妻公寓_母亲视频通话草稿_v1';
const 母亲视频通话草稿上限 = 8000;
const 母亲视频通话内存草稿 = new Map<string, string>();

function 取母亲视频通话草稿存储(): 母亲视频通话草稿存储 | null {
  if (typeof window === 'undefined') return null;
  try {
    return (window.parent ?? window).sessionStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

export function 母亲视频通话草稿键(聊天ID: string, 通话标识: string): string {
  const 聊天 = 聊天ID.trim();
  const 通话 = 通话标识.trim();
  return 聊天 && 通话 ? `${母亲视频通话草稿前缀}:${encodeURIComponent(聊天)}:${encodeURIComponent(通话)}` : '';
}

export function 读取母亲视频通话草稿(
  聊天ID: string,
  通话标识: string,
  存储: 母亲视频通话草稿存储 | null = 取母亲视频通话草稿存储(),
): string {
  const 键 = 母亲视频通话草稿键(聊天ID, 通话标识);
  if (!键) return '';
  const 内存 = 母亲视频通话内存草稿.get(键);
  if (内存 !== undefined) return 内存;
  try {
    const 文 = 存储?.getItem(键) ?? '';
    const 安全文 = 文.slice(0, 母亲视频通话草稿上限);
    if (安全文) 母亲视频通话内存草稿.set(键, 安全文);
    return 安全文;
  } catch {
    return '';
  }
}

export function 保存母亲视频通话草稿(
  聊天ID: string,
  通话标识: string,
  文本: string,
  存储: 母亲视频通话草稿存储 | null = 取母亲视频通话草稿存储(),
): void {
  const 键 = 母亲视频通话草稿键(聊天ID, 通话标识);
  if (!键) return;
  const 文 = 文本.slice(0, 母亲视频通话草稿上限);
  母亲视频通话内存草稿.set(键, 文);
  try {
    if (文) 存储?.setItem(键, 文);
    else 存储?.removeItem(键);
  } catch {
    /* sessionStorage 不可用时，当前 iframe 内仍由内存草稿承接重绘与收起重开。 */
  }
}

export function 清除母亲视频通话草稿(
  聊天ID: string,
  通话标识: string,
  存储: 母亲视频通话草稿存储 | null = 取母亲视频通话草稿存储(),
): void {
  const 键 = 母亲视频通话草稿键(聊天ID, 通话标识);
  if (!键) return;
  母亲视频通话内存草稿.delete(键);
  try {
    存储?.removeItem(键);
  } catch {
    /* 清理失败只会留下同一通话标识的旧 session 草稿，不影响持久电话状态。 */
  }
}
