export interface 手机时间线租约 {
  聊天标识: string;
  锚楼: number;
  锚消息引用: unknown;
  锚消息签名: string;
  锚绝对时段: number;
  世代: number;
}

let 当前手机时间线租约世代 = 0;

export function 读取当前手机时间线租约世代(): number {
  return 当前手机时间线租约世代;
}

/**
 * 每次时间事务真正开始改写 stat 前调用。世代只在当前游戏逻辑 iframe 内单调递增，
 * 用来阻止“t+1 → 撤销到 t → 再推进到同一个 t+1”时旧异步任务通过 ABA 校验。
 */
export function 作废当前手机时间线租约世代(): void {
  当前手机时间线租约世代 += 1;
}

function 是记录(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 引用用于识别“删掉后在同楼重建了外观相同的消息”，签名用于识别原对象上的 swipe/改写。
 * 这里只取酒馆消息的稳定身份字段，不序列化可能很大的插件 extra。
 */
export function 手机锚消息签名(message: unknown): string {
  if (!是记录(message)) return JSON.stringify(message) ?? String(message);
  return JSON.stringify([
    message.is_user,
    message.mes,
    message.send_date,
    message.swipe_id,
    message.name,
    message.force_avatar,
  ]);
}

export function 创建手机时间线租约(
  聊天标识: string,
  锚楼: number,
  消息: readonly unknown[],
  绝对时段: number,
): 手机时间线租约 | null {
  if (
    !聊天标识 ||
    !Number.isInteger(锚楼) ||
    锚楼 < 0 ||
    锚楼 >= 消息.length ||
    !Number.isInteger(绝对时段) ||
    绝对时段 < 0
  ) {
    return null;
  }
  const 锚消息引用 = 消息[锚楼];
  return {
    聊天标识,
    锚楼,
    锚消息引用,
    锚消息签名: 手机锚消息签名(锚消息引用),
    锚绝对时段: 绝对时段,
    世代: 当前手机时间线租约世代,
  };
}

/**
 * 后续正常加楼不会使租约失效；世界时段变化、切聊天、删到锚楼之前、同楼重建或 swipe/改写都会失效。
 */
export function 手机时间线租约仍有效(
  租约: 手机时间线租约,
  当前聊天标识: string,
  当前消息: readonly unknown[],
  当前绝对时段: number,
): boolean {
  if (
    !当前聊天标识 ||
    当前聊天标识 !== 租约.聊天标识 ||
    当前消息.length <= 租约.锚楼 ||
    当前绝对时段 !== 租约.锚绝对时段 ||
    租约.世代 !== 当前手机时间线租约世代
  )
    return false;
  const 当前锚消息 = 当前消息[租约.锚楼];
  return 当前锚消息 === 租约.锚消息引用 && 手机锚消息签名(当前锚消息) === 租约.锚消息签名;
}
