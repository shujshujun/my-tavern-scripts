const 接线所有权键 = '__RQP_DATABASE_TIMELINE_LISTENER_OWNER_V1__';

/** 同一窗口热重载时替换旧监听；客户端与游戏脚本的不同窗口各自保持活动。 */
export function 接管数据库时间线接线(窗口: object, 清理: () => void): () => void {
  const scope = 窗口 as Record<string, unknown>;
  const 旧所有者 = scope[接线所有权键] as { 清理?: () => void } | undefined;
  try {
    旧所有者?.清理?.();
  } catch {
    /* 旧模块可能已随页面卸载，继续登记当前实例。 */
  }
  const 当前所有者 = { 清理 };
  scope[接线所有权键] = 当前所有者;
  return () => {
    if (scope[接线所有权键] === 当前所有者) delete scope[接线所有权键];
  };
}
