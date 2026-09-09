export interface 空闲手机节拍调度依赖 {
  运行期忙碌: () => boolean;
  执行节拍: () => void | Promise<void>;
  等待?: (毫秒: number) => Promise<void>;
  当前时间?: () => number;
  排队微任务?: (任务: () => void) => void;
  警告?: (消息: string, 错误?: unknown) => void;
}

export interface 空闲手机节拍调度选项 {
  超时毫秒?: number;
  轮询毫秒?: number;
}

export interface 空闲手机节拍调度器 {
  请求: () => void;
  调度中: () => boolean;
}

const 默认等待 = (毫秒: number) => new Promise<void>(resolve => setTimeout(resolve, 毫秒));

/** 旧宿主与隔离 VM 可能没有原生 queueMicrotask；Promise 微任务保持同一调度语义。 */
const 默认排队微任务 = (任务: () => void): void => {
  if (typeof globalThis.queueMicrotask === 'function') {
    globalThis.queueMicrotask(任务);
    return;
  }
  void Promise.resolve().then(任务);
};

/**
 * `回合完成` 只是“核心结果已提交”，并不保证调用栈里的前台租约、时间写入租约与
 * MVU 串行队列已经全部释放。手机节拍会在落下微信内容后广播送达回执，而这些回执又会
 * 进入主 MVU 写队列；若只延后一轮微任务，仍可能在正常收尾窗口里误报生成中或时间恢复中。
 *
 * 本调度器只延后可选手机节拍，不放宽任何恢复门。多次请求在真正开始前合并为一拍；若
 * 忙态持续到超时，本批次安静放弃并等待下一次真实触发，不向玩家制造一次并未发生的失败。
 */
export function 创建空闲手机节拍调度器(
  依赖: 空闲手机节拍调度依赖,
  选项: 空闲手机节拍调度选项 = {},
): 空闲手机节拍调度器 {
  const 超时毫秒 = Math.max(0, 选项.超时毫秒 ?? 8000);
  const 轮询毫秒 = Math.max(1, 选项.轮询毫秒 ?? 40);
  const 等待 = 依赖.等待 ?? 默认等待;
  const 当前时间 = 依赖.当前时间 ?? Date.now;
  const 排队微任务 = 依赖.排队微任务 ?? 默认排队微任务;
  const 警告 = 依赖.警告 ?? (() => undefined);

  let 已请求序号 = 0;
  let 已处理序号 = 0;
  let 正在调度 = false;

  const 等到运行期空闲 = async (): Promise<boolean> => {
    const 截止 = 当前时间() + 超时毫秒;
    while (true) {
      try {
        if (!依赖.运行期忙碌()) return true;
      } catch (错误) {
        警告('检查手机节拍运行期闸门失败，本批次保持关闭。', 错误);
        return false;
      }
      const 剩余 = 截止 - 当前时间();
      if (剩余 <= 0) return false;
      await 等待(Math.min(轮询毫秒, 剩余));
    }
  };

  const 驱动 = async (): Promise<void> => {
    if (正在调度) return;
    正在调度 = true;
    try {
      while (已处理序号 < 已请求序号) {
        if (!(await 等到运行期空闲())) {
          // 等待期间到达的请求与本批一起合并放弃；后续新触发仍会重新调度。
          已处理序号 = 已请求序号;
          警告('回合后手机节拍等待运行期收尾超时，已留给下一次回合或补拍触发。');
          continue;
        }

        // 等待空闲期间到达的请求由即将执行的这一拍共同满足；执行期间的新请求才需补跑。
        const 本拍满足到 = 已请求序号;
        try {
          await 依赖.执行节拍();
        } catch (错误) {
          警告('回合后手机节拍启动失败，已留给下一次触发。', 错误);
        } finally {
          已处理序号 = Math.max(已处理序号, 本拍满足到);
        }
      }
    } finally {
      正在调度 = false;
      // 驱动退出的同一微任务末尾仍可能收到新请求；再排一次，避免丢拍。
      if (已处理序号 < 已请求序号) 排队微任务(() => void 驱动());
    }
  };

  const 请求 = (): void => {
    已请求序号 += 1;
    if (!正在调度) 排队微任务(() => void 驱动());
  };

  return { 请求, 调度中: () => 正在调度 };
}
