/**
 * 生成通道互斥（rq0.75 双向生成互斥闭环）：前台正文与手机生成事务共用酒馆 TavernHelper
 * 生成槽，同一时刻只允许一方持有，且手机一方跨手动待回复批次（绿/黄/红灯）持续持有。
 *
 * 纯进程内状态机：本模块不 import 回合引擎、手机内核、DOM、MVU 或任何宿主 API，
 * 可被 `node --test` 直接动态单测。
 *
 * 规则：
 * - 前台只允许一个 token；手机 token 非空时前台取得失败；
 * - 手机允许多个 token（手动待回复批次外层 + 每次小生成内层可嵌套）；前台 token 存在时手机取得失败；
 * - token 由 Set 记录，release 幂等：重复释放同一个租约是 no-op，不会把其他租约的 token 减掉；
 * - 取得失败返回 null，绝不返回可释放的假租约。
 */

export interface 生成通道租约 {
  /** 幂等释放：重复调用是 no-op，不会把其他租约的 token 减掉。 */
  释放: () => void;
}

/** 前台（正文回合）至多一个 token。 */
const 前台令牌 = new Set<object>();
/** 手机（手动批次外层 + 小生成内层）允许多个 token。 */
const 手机令牌 = new Set<object>();

/** 前台正文在取得回合锁前同步占住共享生成槽；手机任一 token 在途时失败。 */
export function 取得前台生成租约(): 生成通道租约 | null {
  if (前台令牌.size > 0 || 手机令牌.size > 0) return null;
  const token: object = {};
  前台令牌.add(token);
  return {
    释放: () => {
      前台令牌.delete(token);
    },
  };
}

/** 手机生成事务（手动批次/小生成）取得嵌套手机租约；前台在途时失败。 */
export function 取得手机生成租约(): 生成通道租约 | null {
  if (前台令牌.size > 0) return null;
  const token: object = {};
  手机令牌.add(token);
  return {
    释放: () => {
      手机令牌.delete(token);
    },
  };
}

/** 前台正文是否仍在占用共享生成槽。 */
export function 前台生成租约持有中(): boolean {
  return 前台令牌.size > 0;
}

/** 手机一方（含跨绿/黄/红批次等待的手动批次）是否仍在占用共享生成槽。 */
export function 手机生成租约持有中(): boolean {
  return 手机令牌.size > 0;
}

/** 清空全部租约（专项测试隔离与极端复位用；游戏链路一律经 释放 幂等收口）。 */
export function 清空生成租约(): void {
  前台令牌.clear();
  手机令牌.clear();
}
