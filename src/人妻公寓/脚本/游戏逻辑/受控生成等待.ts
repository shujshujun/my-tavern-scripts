export const 受控生成超时错误前缀 = '__RQGY_BOUNDED_GENERATION_TIMEOUT__:';

export interface 受控生成等待选项 {
  /** 只限制本地等待；底层供应商能否及时物理停止不再决定游戏租约能否释放。 */
  超时毫秒: number;
  超时说明: string;
  /** 取消／超时时尽力停止对应底层请求。抛错不会覆盖本地失败收口。 */
  请求停止?: () => void;
  /** 切聊天、回档或业务令牌失效时，无需等待底层 Promise 返回。 */
  仍有效?: () => boolean;
  失效说明?: string;
  有效性检查间隔毫秒?: number;
}

export interface 受控生成等待句柄<T> {
  结果: Promise<T>;
  取消(原因?: string): boolean;
  已结束(): boolean;
}

/**
 * 给无法传入 AbortSignal 的宿主生成 Promise 增加本地可控的取消与绝对上限。
 * Promise.race 只能结束调用方等待，不能阻止迟到 Promise；这里用单次 settle 门确保迟到结果
 * 永远不能重新 resolve/reject 已结束句柄，也不会再次调用停止回调。
 */
export function 创建受控生成等待<T>(
  底层任务: PromiseLike<T>,
  选项: 受控生成等待选项,
): 受控生成等待句柄<T> {
  const 超时毫秒 = Math.max(1, Math.trunc(Number(选项.超时毫秒) || 0));
  let 已结束 = false;
  let resolve结果: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject结果: (reason?: unknown) => void = () => undefined;
  let 有效性timer: ReturnType<typeof setTimeout> | undefined;

  const 结果 = new Promise<T>((resolve, reject) => {
    resolve结果 = resolve;
    reject结果 = reject;
  });

  const 尝试停止 = () => {
    try {
      选项.请求停止?.();
    } catch (error) {
      console.warn('[人妻公寓] 停止已结束的生成请求失败，本地租约仍按期释放:', error);
    }
  };
  const 结束 = (类型: '成功' | '失败', 值: unknown, 需要停止 = false): boolean => {
    if (已结束) return false;
    已结束 = true;
    clearTimeout(timer);
    if (有效性timer !== undefined) clearTimeout(有效性timer);
    if (需要停止) 尝试停止();
    if (类型 === '成功') resolve结果(值 as T);
    else reject结果(值);
    return true;
  };

  Promise.resolve(底层任务).then(
    value => 结束('成功', value),
    error => 结束('失败', error),
  );
  const timer = setTimeout(() => {
    结束('失败', new Error(`${受控生成超时错误前缀}${选项.超时说明}`), true);
  }, 超时毫秒);
  const 检查间隔 = Math.max(5, Math.trunc(Number(选项.有效性检查间隔毫秒) || 250));
  const 安排有效性检查 = () => {
    if (!选项.仍有效 || 已结束) return;
    有效性timer = setTimeout(() => {
      if (已结束) return;
      let 仍有效 = false;
      try {
        仍有效 = 选项.仍有效?.() ?? true;
      } catch {
        仍有效 = false;
      }
      if (!仍有效) {
        结束('失败', new Error(选项.失效说明 || '生成上下文已经失效'), true);
        return;
      }
      安排有效性检查();
    }, 检查间隔);
  };
  安排有效性检查();

  return {
    结果,
    取消: (原因 = '已取消——本次生成没有发生') => 结束('失败', new Error(原因), true),
    已结束: () => 已结束,
  };
}
