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

/** 签名字段位序：0 is_user、1 mes、2 send_date、3 swipe_id、4 name、5 force_avatar。 */
const 手机锚签名字段数 = 6;
const 手机锚签名正文位 = 1;

/** 解析并归一持久/当前签名；形状未知时返回 null，由调用方退回严格比较。 */
function 解析手机锚签名(签名: string): unknown[] | null {
  try {
    const 字段 = JSON.parse(签名) as unknown;
    if (!Array.isArray(字段) || 字段.length !== 手机锚签名字段数) return null;
    const 归一 = [...(字段 as unknown[])];
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
    message.is_user,
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
 * 正文 `mes` 是分支身份里唯一会被宿主在同一分支内合法改写的字段：`substituteParams`
 * 会在每次载入聊天时重新展开开局楼宏，思维链解析会把 reasoning 段从 `mes` 剥离回写，
 * 楼层编辑也会原地改写；`syncMesToSwipe` 只是把改写结果同步进当前 swipe。这些都不是
 * 分支切换，旧实现却因整段正文进入签名而把该楼产生的全部微信判成旧分支——刷新后
 * 聊天记录整段隐身，带稳定键的楼务通知
 * 还会因活键集合丢失而重新派发（玩家实测“刷新后夏乔又来一次修水管新手指引”）。
 *
 * 因此正文位改为“同分支容差”：其余五个身份字段全部一致时，`mes` 差异按宿主改写解释，
 * 仍视为同一分支。真实 swipe 会改变 swipe_id 并触发明确的同楼物理裁枝；删楼/回档由
 * 楼轴裁枝，迟到异步写还会核对锚消息对象引用，因此分支隔离强度不下降。
 */
export function 手机锚消息签名匹配(持久签名: string, message: unknown): boolean {
  const 当前签名 = 手机锚消息签名(message);
  if (持久签名 === 当前签名) return true;
  const 持久字段 = 解析手机锚签名(持久签名);
  const 当前字段 = 解析手机锚签名(当前签名);
  // 任一侧形状未知（旧版极端存档或非对象锚）时保持严格比较，不放宽隔离。
  if (!持久字段 || !当前字段) return false;
  return 持久字段.every(
    (值, 位) => 位 === 手机锚签名正文位 || 值 === 当前字段[位],
  );
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
