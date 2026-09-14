type 调用 = (命令: string, 参数?: any, 选项?: any) => any;
type 桥 = { invoke: 调用 };

/** 只观察交给 Tauri 后端的 DTO，位置在预设 fetch 包装器之后；不改参数、返回值或错误。 */
export function 观察Tauri请求(桥: 桥, 收到: (请求: unknown) => void): { stop: () => void } {
  const 原调用 = 桥.invoke;
  let 有效 = true;
  const 包装: 调用 = function (this: unknown, 命令, 参数, 选项) {
    if (有效 && (命令 === 'generate_chat_completion' || 命令 === 'start_chat_completion_stream')) {
      try {
        收到(参数?.dto);
      } catch {
        /* 查看器不能打断请求。 */
      }
    }
    return 原调用.call(this, 命令, 参数, 选项);
  };
  桥.invoke = 包装;
  return {
    stop() {
      有效 = false;
      if (桥.invoke === 包装) 桥.invoke = 原调用;
      // 后装的宿主包装器仍引用本层时保留透明转发，不覆盖其它扩展。
    },
  };
}

export function 注册Tauri最终请求观察(收到: (请求: unknown) => void): { stop: () => void } | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    let 窗: Window = window;
    for (let i = 0; i < 8; i++) {
      void 窗.document; // 不穿越跨源父页面。
      // Tauri 内部 invoke 是只读属性。宿主公开的 broker 由 safeInvoke 动态调用，
      // 此处已在 fetch 扩展处理之后，且无需改动原生桥或任何请求内容。
      const 桥 = (窗 as unknown as { __TAURITAVERN__?: { invoke?: { broker?: 桥 } } }).__TAURITAVERN__?.invoke?.broker;
      if (typeof 桥?.invoke === 'function') return 观察Tauri请求(桥, 收到);
      if (窗.parent === 窗) break;
      窗 = 窗.parent;
    }
  } catch {
    /* 其它宿主继续使用明确标注阶段的事件快照。 */
  }
  return undefined;
}
