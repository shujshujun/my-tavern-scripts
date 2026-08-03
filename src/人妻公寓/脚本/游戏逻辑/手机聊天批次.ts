export type 手机聊天灯 = '绿' | '黄' | '红';

export interface 手机聊天批次请求 {
  键: string;
  消息标识: string[];
  请求序号: number;
}

export interface 手机聊天批次快照 {
  灯: 手机聊天灯;
  待回复数: number;
  写入中数: number;
  截止毫秒: number;
  /** 输入失焦发生在玩家消息持久化完成之前；登记成功后应继续启动黄灯。 */
  等待启动: boolean;
  请求序号: number;
}

interface 手机聊天批次状态 extends 手机聊天批次快照 {
  消息标识: string[];
  写入中标识: Set<string>;
  定时句柄?: unknown;
  黄灯计时中: boolean;
  立即请求: boolean;
}

interface 手机聊天批次时钟 {
  延迟毫秒?: number;
  当前时间?: () => number;
  设置定时?: (回调: () => void, 延迟毫秒: number) => unknown;
  清除定时?: (句柄: unknown) => void;
}

/**
 * 柚月式逐会话输入批次：绿灯继续攒消息，失焦转黄灯，倒计时结束或空输入催更转红灯。
 * 这里只管理瞬态和幂等序号；持久写、时间线租约与 API 取消仍由手机系统负责。
 */
export class 手机聊天批次控制器 {
  private readonly 状态表 = new Map<string, 手机聊天批次状态>();
  private readonly 延迟毫秒: number;
  private readonly 当前时间: () => number;
  private readonly 设置定时: (回调: () => void, 延迟毫秒: number) => unknown;
  private readonly 清除定时: (句柄: unknown) => void;

  constructor(
    private readonly 请求回调: (请求: 手机聊天批次请求) => void,
    时钟: 手机聊天批次时钟 = {},
  ) {
    this.延迟毫秒 = Math.max(0, Math.floor(时钟.延迟毫秒 ?? 6000));
    this.当前时间 = 时钟.当前时间 ?? Date.now;
    this.设置定时 = 时钟.设置定时 ?? ((回调, 延迟) => setTimeout(回调, 延迟));
    this.清除定时 = 时钟.清除定时 ?? (句柄 => clearTimeout(句柄 as ReturnType<typeof setTimeout>));
  }

  private 取或建(键: string): 手机聊天批次状态 {
    let 状态 = this.状态表.get(键);
    if (!状态) {
      状态 = {
        灯: '绿',
        待回复数: 0,
        写入中数: 0,
        截止毫秒: 0,
        等待启动: false,
        请求序号: 0,
        消息标识: [],
        写入中标识: new Set<string>(),
        黄灯计时中: false,
        立即请求: false,
      };
      this.状态表.set(键, 状态);
    }
    return 状态;
  }

  private 清定时(状态: 手机聊天批次状态): void {
    if (状态.定时句柄 !== undefined) this.清除定时(状态.定时句柄);
    delete 状态.定时句柄;
    状态.黄灯计时中 = false;
    状态.截止毫秒 = 0;
  }

  private 同步数量(状态: 手机聊天批次状态): void {
    状态.待回复数 = 状态.消息标识.length;
    状态.写入中数 = 状态.写入中标识.size;
  }

  private 无消息时回绿(状态: 手机聊天批次状态): void {
    if (状态.消息标识.length || 状态.灯 === '红') return;
    this.清定时(状态);
    状态.灯 = '绿';
    状态.等待启动 = false;
    状态.立即请求 = false;
  }

  private 开始黄灯(键: string, 状态: 手机聊天批次状态): void {
    if (状态.灯 === '红' || !状态.消息标识.length) return;
    // 同一次失焦只认第一个截止点。迟到的持久化完成或兼容登记只能加入既有批次，
    // 不能把玩家已经看见的 6 秒倒计时重新计满。
    if (状态.灯 === '黄' && (状态.黄灯计时中 || 状态.立即请求 || 状态.截止毫秒 > 0)) {
      状态.等待启动 = false;
      return;
    }
    this.清定时(状态);
    状态.灯 = '黄';
    状态.等待启动 = false;
    状态.立即请求 = false;
    状态.截止毫秒 = this.当前时间() + this.延迟毫秒;
    状态.黄灯计时中 = true;
    const 本次序号 = 状态.请求序号;
    状态.定时句柄 = this.设置定时(() => {
      const 最新 = this.状态表.get(键);
      if (!最新 || 最新 !== 状态 || 最新.灯 !== '黄' || 最新.请求序号 !== 本次序号) return;
      delete 最新.定时句柄;
      最新.黄灯计时中 = false;
      // 到期时若仍有消息在持久化，保留红灯请求意图；最后一笔完成后再一次性发起。
      最新.立即请求 = true;
      this.开始红灯(键, 最新);
    }, this.延迟毫秒);
  }

  private 开始红灯(键: string, 状态: 手机聊天批次状态): void {
    if (状态.灯 === '红' || !状态.消息标识.length) return;
    if (状态.写入中数 > 0) {
      状态.立即请求 = true;
      return;
    }
    this.清定时(状态);
    状态.灯 = '红';
    状态.等待启动 = false;
    状态.立即请求 = false;
    状态.请求序号 += 1;
    this.请求回调({ 键, 消息标识: [...状态.消息标识], 请求序号: 状态.请求序号 });
  }

  /** 在异步落库前预留消息位置；预留顺序就是最终批次顺序。 */
  开始写入(键: string, 消息标识: string): boolean {
    const 状态 = this.取或建(键);
    if (状态.灯 === '红' || !消息标识 || 状态.消息标识.includes(消息标识)) return false;
    状态.消息标识.push(消息标识);
    状态.写入中标识.add(消息标识);
    this.同步数量(状态);
    if (状态.等待启动) this.开始黄灯(键, 状态);
    return true;
  }

  /** 收口一笔预留写入；失败记录从本批移除，黄灯到期请求在最后一笔完成后触发。 */
  完成写入(键: string, 消息标识: string, 成功: boolean): boolean {
    const 状态 = this.状态表.get(键);
    if (!状态 || !状态.写入中标识.delete(消息标识)) return false;
    if (!成功) 状态.消息标识 = 状态.消息标识.filter(标识 => 标识 !== 消息标识);
    this.同步数量(状态);
    this.无消息时回绿(状态);
    if (状态.消息标识.length && 状态.等待启动) this.开始黄灯(键, 状态);
    if (状态.消息标识.length && 状态.立即请求 && 状态.写入中数 === 0) this.开始红灯(键, 状态);
    return true;
  }

  /** 已落库调用方的兼容入口；加入既有黄灯时不得重置原截止点。 */
  登记消息(键: string, 消息标识: string): boolean {
    const 状态 = this.取或建(键);
    if (状态.灯 === '红') return false;
    if (!状态.消息标识.includes(消息标识)) 状态.消息标识.push(消息标识);
    this.同步数量(状态);
    if (状态.立即请求) this.开始红灯(键, 状态);
    else if (状态.等待启动 || 状态.灯 === '黄') this.开始黄灯(键, 状态);
    return true;
  }

  含消息(键: string, 消息标识: string): boolean {
    return this.状态表.get(键)?.消息标识.includes(消息标识) ?? false;
  }

  /** 撤回或上层裁枝时移除精确消息；绿/黄已空批次立即清钟回绿。 */
  移除消息(键: string, 消息标识: string): boolean {
    const 状态 = this.状态表.get(键);
    if (!状态 || !状态.消息标识.includes(消息标识)) return false;
    状态.消息标识 = 状态.消息标识.filter(标识 => 标识 !== 消息标识);
    状态.写入中标识.delete(消息标识);
    this.同步数量(状态);
    this.无消息时回绿(状态);
    if (状态.消息标识.length && 状态.立即请求 && 状态.写入中数 === 0) this.开始红灯(键, 状态);
    return true;
  }

  /** 输入框重新聚焦或继续输入：黄灯倒计时作废，保留已经发送的气泡。 */
  继续输入(键: string): void {
    const 状态 = this.取或建(键);
    if (状态.灯 === '红') return;
    this.清定时(状态);
    状态.灯 = '绿';
    状态.等待启动 = false;
    状态.立即请求 = false;
  }

  /** 真正失焦：有消息就启动黄灯；消息仍在异步落库时先记住启动意图。 */
  结束输入(键: string): void {
    const 状态 = this.取或建(键);
    if (状态.灯 === '红') return;
    状态.等待启动 = true;
    if (状态.消息标识.length) this.开始黄灯(键, 状态);
  }

  /** 黄灯期间空输入再点发送，或玩家主动催更。 */
  立即发送(键: string): void {
    const 状态 = this.取或建(键);
    if (状态.灯 === '红') return;
    状态.立即请求 = true;
    if (状态.消息标识.length) this.开始红灯(键, 状态);
  }

  请求仍有效(键: string, 请求序号: number): boolean {
    const 状态 = this.状态表.get(键);
    return !!状态 && 状态.灯 === '红' && 状态.请求序号 === 请求序号;
  }

  /** 成功消费本批；失败时可传 false 保留消息并回到绿灯，供上层决定是否重试。 */
  完成请求(键: string, 请求序号: number, 已消费 = true): boolean {
    const 状态 = this.状态表.get(键);
    if (!状态 || 状态.请求序号 !== 请求序号) return false;
    this.清定时(状态);
    状态.灯 = '绿';
    状态.等待启动 = false;
    状态.立即请求 = false;
    if (已消费) 状态.消息标识 = [];
    状态.写入中标识.clear();
    this.同步数量(状态);
    return true;
  }

  /** 取消明确终止本批，不让旧 API 结果或旧定时器自动重试。 */
  取消请求(键: string): boolean {
    const 状态 = this.状态表.get(键);
    if (!状态 || 状态.灯 !== '红') return false;
    this.清定时(状态);
    状态.请求序号 += 1;
    状态.灯 = '绿';
    状态.等待启动 = false;
    状态.立即请求 = false;
    状态.消息标识 = [];
    状态.写入中标识.clear();
    this.同步数量(状态);
    return true;
  }

  丢弃(键: string): void {
    const 状态 = this.状态表.get(键);
    if (状态) this.清定时(状态);
    this.状态表.delete(键);
  }

  状态(键: string): 手机聊天批次快照 {
    const 状态 = this.状态表.get(键);
    return 状态
      ? {
          灯: 状态.灯,
          待回复数: 状态.待回复数,
          写入中数: 状态.写入中数,
          截止毫秒: 状态.截止毫秒,
          等待启动: 状态.等待启动,
          请求序号: 状态.请求序号,
        }
      : { 灯: '绿', 待回复数: 0, 写入中数: 0, 截止毫秒: 0, 等待启动: false, 请求序号: 0 };
  }
}

/**
 * 输入框真正失焦、显式返回或收起手机时统一收口。
 * 草稿不属于控制器，本函数只结算已经预留的玩家消息；空批次立即释放上层会话锁。
 */
export function 收口手机聊天输入(
  控制器: 手机聊天批次控制器,
  键: string,
  释放空批次: () => void = () => undefined,
): '等待回复' | '已释放' | '红灯' {
  const 状态 = 控制器.状态(键);
  if (状态.灯 !== '红' && 状态.待回复数 === 0 && 状态.写入中数 === 0) {
    控制器.丢弃(键);
    释放空批次();
    return '已释放';
  }
  控制器.结束输入(键);
  return 状态.灯 === '红' ? '红灯' : '等待回复';
}

/**
 * 批次请求的无拒绝生命周期。任务与每个收口步骤分别隔离，前置读库/渲染抛错也不能跳过后续解锁。
 */
export async function 执行手机聊天批次任务(
  任务: () => void | Promise<void>,
  收口步骤: readonly (() => void | Promise<void>)[],
  报错: (错误: unknown) => void = () => undefined,
): Promise<void> {
  const 安全报错 = (错误: unknown): void => {
    try {
      报错(错误);
    } catch {
      // 报错通道自身不得破坏批次收口。
    }
  };
  try {
    await 任务();
  } catch (错误) {
    安全报错(错误);
  } finally {
    for (const 收口 of 收口步骤) {
      try {
        await 收口();
      } catch (错误) {
        安全报错(错误);
      }
    }
  }
}
