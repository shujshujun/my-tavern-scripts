export interface 终幕驱动任务 {
  仍有效: () => boolean;
  读取帧: () => number | null;
  提交: (预期帧: number, 仍有效: () => boolean) => Promise<boolean>;
}

/** 等待演出时不持有 MVU 队列；只有单帧提交短暂取得写锁。 */
export function 创建持久终幕驱动(选项: {
  失败: (错误: unknown) => void;
  帧间隔?: number;
  提交超时?: number;
  定时?: (回调: () => void, 毫秒: number) => unknown;
  清定时?: (句柄: unknown) => void;
}) {
  const 定时 = 选项.定时 ?? ((回调, 毫秒) => setTimeout(回调, 毫秒));
  const 清定时 = 选项.清定时 ?? (句柄 => clearTimeout(句柄 as ReturnType<typeof setTimeout>));
  const 活动 = new Map<string, { 取消: () => void; 完成: Promise<void> }>();

  function 播放(键: string, 任务: 终幕驱动任务): Promise<void> {
    const 已有 = 活动.get(键);
    if (已有) return 已有.完成;
    let 已取消 = false;
    let 唤醒: (() => void) | undefined;
    const 仍有效 = () => !已取消 && 任务.仍有效();
    const 运行 = {
      取消: () => {
        已取消 = true;
        唤醒?.();
      },
      完成: Promise.resolve(),
    };
    活动.set(键, 运行);
    const 等待 = (毫秒: number) =>
      new Promise<void>(resolve => {
        const 结束 = () => {
          清定时(句柄);
          唤醒 = undefined;
          resolve();
        };
        const 句柄 = 定时(结束, 毫秒);
        唤醒 = 结束;
      });
    const 限时提交 = (帧: number) =>
      new Promise<boolean>((resolve, reject) => {
        let 已结束 = false;
        const 完成 = (成功: boolean, 错误?: unknown) => {
          if (已结束) return;
          已结束 = true;
          清定时(句柄);
          唤醒 = undefined;
          if (错误) reject(错误);
          else resolve(成功);
        };
        const 句柄 = 定时(() => 完成(false, new Error('终幕状态保存超时，请稍后继续播放。')), 选项.提交超时 ?? 60_000);
        唤醒 = () => 完成(false);
        void Promise.resolve()
          .then(() => 任务.提交(帧, () => !已结束 && 仍有效()))
          .then(
            成功 => 完成(成功),
            错误 => 完成(false, 错误),
          );
      });
    运行.完成 = (async () => {
      try {
        while (仍有效()) {
          const 帧 = 任务.读取帧();
          if (帧 === null) return;
          await 等待(选项.帧间隔 ?? 4000);
          if (!仍有效()) return;
          if (任务.读取帧() !== 帧) continue;
          if (!(await 限时提交(帧))) {
            if (仍有效() && 任务.读取帧() === 帧) throw new Error('终幕状态尚未保存，可以继续播放重试。');
            return;
          }
        }
      } catch (错误) {
        if (仍有效()) 选项.失败(错误);
      } finally {
        已取消 = true;
        唤醒?.();
        if (活动.get(键) === 运行) 活动.delete(键);
      }
    })();
    return 运行.完成;
  }

  return {
    播放,
    停止: () => {
      for (const 运行 of 活动.values()) 运行.取消();
      活动.clear();
    },
  };
}
