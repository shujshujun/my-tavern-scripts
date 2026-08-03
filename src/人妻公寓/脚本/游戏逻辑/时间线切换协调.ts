/**
 * 宿主时间线切换的轻量状态机。
 *
 * 监听回调必须同步取得协调锁；实际重读需要等宿主完成 chat/swipe 替换，因此任务串行到
 * 下一拍执行。世代让同一批连续事件只提交最终分支，同时仍由未完成计数维持整段互斥。
 */

export interface 时间线切换租约 {
  readonly 世代: number;
  readonly 原因: string;
  仍为最新(): boolean;
}

let 当前世代 = 0;
let 未完成协调数 = 0;
let 协调队尾: Promise<void> = Promise.resolve();

export function 当前时间线切换世代(): number {
  return 当前世代;
}

/** 卡内回档/重掷/重开在物理删楼事件被内部租约消费前，主动使旧异步提交失效。 */
export function 作废当前时间线切换世代(): number {
  当前世代 += 1;
  return 当前世代;
}

export function 时间线切换协调中(): boolean {
  return 未完成协调数 > 0;
}

/** 调用本函数时同步上锁；任务本身按登记顺序串行执行。 */
export function 排队时间线切换协调<T>(
  原因: string,
  任务: (租约: 时间线切换租约) => Promise<T> | T,
): Promise<T | undefined> {
  const 世代 = ++当前世代;
  未完成协调数 += 1;
  const 租约: 时间线切换租约 = {
    世代,
    原因,
    仍为最新: () => 世代 === 当前世代,
  };

  const 本次 = 协调队尾
    .catch(() => undefined)
    .then(async () => {
      // 批量删楼可能在同一任务拍逐楼发事件；旧任务尚未开始时直接由最终一代统一收口。
      if (!租约.仍为最新()) return undefined;
      return await 任务(租约);
    });
  协调队尾 = 本次.then(
    () => undefined,
    () => undefined,
  );
  return 本次.finally(() => {
    未完成协调数 = Math.max(0, 未完成协调数 - 1);
  });
}

export interface 内部删楼租约 {
  /**
   * deleteChatMessages 的 Promise 已结束。宿主事件可能晚一拍才到，因此剩余计数短暂保留；
   * 后续消费时会惰性清掉过期租约，不创建会拖住页面或测试进程的定时器。
   */
  完成(): void;
}

interface 内部删楼租约状态 {
  未消费: Map<number, number>;
  完成后过期时间: number;
}

const 内部删楼租约表: 内部删楼租约状态[] = [];
// 2026-08-04:2 秒宽限在大聊天文件慢保存时不够——上一轮失败清理的删楼事件迟到超过宽限,
// 会被误判为原生删楼而 取消本回合(true),形成"失败→删楼→迟到事件→再失败"的连环取消。
// 租约按具体楼层+计数精确匹配,放宽到 10 秒只影响"同楼层 10 秒内恰有原生删除"的极端场景。
const 内部删楼迟到宽限毫秒 = 10_000;

function 清过期内部删楼租约(当前时间 = Date.now()): void {
  for (let i = 内部删楼租约表.length - 1; i >= 0; i -= 1) {
    const 租约 = 内部删楼租约表[i];
    if (!租约.未消费.size || 租约.完成后过期时间 <= 当前时间) 内部删楼租约表.splice(i, 1);
  }
}

/**
 * 在调用 deleteChatMessages 前登记具体楼层。精确楼层 + 计数比“回调发生时回合是否进行中”
 * 更可靠：即使回调迟到 finally 之后也能识别，且不会吞掉其它楼层的真实原生删除。
 */
export function 登记内部删楼租约(消息楼层: readonly number[]): 内部删楼租约 {
  清过期内部删楼租约();
  const 未消费 = new Map<number, number>();
  for (const 原楼层 of 消息楼层) {
    const 楼层 = Number(原楼层);
    if (!Number.isInteger(楼层) || 楼层 < 0) continue;
    未消费.set(楼层, (未消费.get(楼层) ?? 0) + 1);
  }
  const 状态: 内部删楼租约状态 = { 未消费, 完成后过期时间: Number.POSITIVE_INFINITY };
  if (未消费.size) 内部删楼租约表.push(状态);
  let 已完成 = false;
  return {
    完成() {
      if (已完成) return;
      已完成 = true;
      状态.完成后过期时间 = Date.now() + 内部删楼迟到宽限毫秒;
      清过期内部删楼租约();
    },
  };
}

/** MESSAGE_DELETED 监听最先调用；命中内部租约时只跳过业务时间线收口。 */
export function 消费内部删楼事件(消息楼层: number): boolean {
  清过期内部删楼租约();
  const 楼层 = Number(消息楼层);
  if (!Number.isInteger(楼层)) return false;
  for (let i = 0; i < 内部删楼租约表.length; i += 1) {
    const 租约 = 内部删楼租约表[i];
    const 剩余 = 租约.未消费.get(楼层) ?? 0;
    if (剩余 <= 0) continue;
    if (剩余 === 1) 租约.未消费.delete(楼层);
    else 租约.未消费.set(楼层, 剩余 - 1);
    if (!租约.未消费.size) 内部删楼租约表.splice(i, 1);
    return true;
  }
  return false;
}
