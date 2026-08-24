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
 * SillyTavern 会在刷新/重新渲染助手楼时通过 ensureSwipes 把缺失的 swipe_id 补成首分支 0。
 * 对分支身份而言 undefined/null 与 0 是同一个“尚未发生真实 swipe 的首分支”，必须统一；
 * 其他值原样保留，确保真正从 0 切到 1 仍能作废旧时间线。
 */
function 规范手机锚swipeId(值: unknown): unknown {
  return 值 === undefined || 值 === null ? 0 : 值;
}

/** 宿主旧消息可能省略助手侧 `is_user`，刷新后再补成 false；两者都是同一角色侧。 */
function 规范手机锚用户侧(值: unknown): unknown {
  return 值 === undefined || 值 === null || 值 === false ? false : 值;
}

/** 签名字段位序：0 is_user、1 mes、2 send_date、3 swipe_id、4 name、5 force_avatar。 */
const 手机锚签名字段数 = 6;
/** 持久记录的硬分支身份只有消息角色侧与 swipe；其余字段只用于在途租约的严格指纹。 */
const 手机持久分支身份位 = [0, 3] as const;

/** 解析并归一持久/当前签名；形状未知时返回 null，由调用方退回严格比较。 */
function 解析手机锚签名(签名: string): unknown[] | null {
  try {
    const 字段 = JSON.parse(签名) as unknown;
    if (!Array.isArray(字段) || 字段.length !== 手机锚签名字段数) return null;
    const 归一 = [...(字段 as unknown[])];
    归一[0] = 规范手机锚用户侧(归一[0]);
    归一[3] = 规范手机锚swipeId(归一[3]);
    return 归一;
  } catch {
    return null;
  }
}

/**
 * 引用用于识别“删掉后在同楼重建了外观相同的消息”，签名用于识别原对象上的 swipe/改写。
 * 这里只取酒馆消息的稳定身份字段，不序列化可能很大的插件 extra。
 */
export function 手机锚消息签名(message: unknown): string {
  if (!是记录(message)) return JSON.stringify(message) ?? String(message);
  return JSON.stringify([
    规范手机锚用户侧(message.is_user),
    message.mes,
    message.send_date,
    规范手机锚swipeId(message.swipe_id),
    message.name,
    message.force_avatar,
  ]);
}

/**
 * 比较持久签名与当前酒馆楼。兼容 rq0.65～rq0.85 已写入的旧签名：旧版在 swipe_id
 * 尚未初始化时会把 undefined 序列化为 null；网页刷新后宿主补成 0，不能因此把同一分支
 * 的全部微信误判为旧分支。 malformed/未知形状仍严格比较，避免放宽真实分支隔离。
 *
 * 持久微信只按 `is_user + swipe_id` 判断分支。`mes`、`send_date`、`name` 与
 * `force_avatar` 都会被宿主在同一分支刷新、宏展开、思维链剥离、角色卡更新或身份/头像
 * 归一时补齐或改写，它们不是分支身份；把它们作为读库硬门会让当前分支微信整段隐身。
 *
 * 真实 swipe 由 `swipe_id` 与明确 MESSAGE_SWIPED 物理裁枝双重识别；删楼/回档拥有按楼
 * 物理裁枝权。六字段完整签名仍保留给 `手机时间线租约仍有效` 严格比较，同一对象在异步
 * 生成途中发生任何改写时仍会作废迟到提交，不能把持久读容差扩张成在途写容差。
 */
export function 手机锚消息签名匹配(持久签名: string, message: unknown): boolean {
  const 当前签名 = 手机锚消息签名(message);
  if (持久签名 === 当前签名) return true;
  const 持久字段 = 解析手机锚签名(持久签名);
  const 当前字段 = 解析手机锚签名(当前签名);
  // 任一侧形状未知（旧版极端存档或非对象锚）时保持严格比较，不放宽隔离。
  if (!持久字段 || !当前字段) return false;
  return 手机持久分支身份位.every(位 => 持久字段[位] === 当前字段[位]);
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
