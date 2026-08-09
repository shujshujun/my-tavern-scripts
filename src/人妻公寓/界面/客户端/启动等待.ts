export interface 客户端启动等待结果 {
  mvu就绪: boolean;
  statData就绪: boolean;
  mvu错误?: unknown;
  statData错误?: unknown;
}

/**
 * 客户端只把 MVU 当作有界的启动依赖。
 *
 * MVU 脚本属于宿主侧资源，导入失败、被禁用或初始化事件丢失都不能让界面永久停在占位页。
 * MVU 未就绪时不再继续等待 stat_data，因为此时没有生产者会完成该等待。
 */
export async function 等待客户端启动依赖(
  等待Mvu: () => Promise<unknown>,
  等待StatData: () => Promise<unknown>,
  mvu超时毫秒 = 10000,
): Promise<客户端启动等待结果> {
  let 超时句柄: ReturnType<typeof setTimeout> | undefined;
  try {
    const 超时 = new Promise<never>((_resolve, reject) => {
      超时句柄 = setTimeout(
        () =>
          reject(
            new Error(
              `等待 Mvu 初始化超时(>${mvu超时毫秒}ms)，界面将降级打开；请检查角色卡的 MVU 脚本和酒馆助手是否启用`,
            ),
          ),
        mvu超时毫秒,
      );
    });
    await Promise.race([Promise.resolve().then(等待Mvu), 超时]);
  } catch (mvu错误) {
    return { mvu就绪: false, statData就绪: false, mvu错误 };
  } finally {
    if (超时句柄 !== undefined) clearTimeout(超时句柄);
  }

  try {
    await 等待StatData();
    return { mvu就绪: true, statData就绪: true };
  } catch (statData错误) {
    return { mvu就绪: true, statData就绪: false, statData错误 };
  }
}
