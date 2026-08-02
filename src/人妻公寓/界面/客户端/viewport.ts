/**
 * 固定游戏画幅：非全屏按酒馆窗口留出输入区；全屏按真正的动态可视视口。
 *
 * Android WebView 的 100vh 可能仍包含地址栏或宿主遮挡区。优先读取最外层同源窗口的
 * visualViewport，并把实测像素写入变量，避免画幅、遮罩和根 overflow:hidden 组合后
 * 把底部内容裁成不可到达区域。
 */
function 读取可视高度(): number | null {
  const 候选: Window[] = [];
  const 加入 = (窗口: Window | null | undefined) => {
    if (窗口 && !候选.includes(窗口)) 候选.push(窗口);
  };

  try {
    加入(window.top);
  } catch {
    /* 跨域顶层不可读时继续 */
  }
  try {
    加入(window.parent);
  } catch {
    /* 跨域父层不可读时继续 */
  }
  加入(window);

  for (const 窗口 of 候选) {
    try {
      const 高 = Number(窗口.visualViewport?.height ?? 窗口.innerHeight);
      if (Number.isFinite(高) && 高 > 0) return 高;
    } catch {
      /* 跳过跨域窗口 */
    }
  }
  return null;
}

export function 同步画幅(): void {
  const 根 = document.documentElement;
  if (根.classList.contains('rqgy-full')) {
    const 可视高 = 读取可视高度();
    根.style.setProperty('--frame-h', 可视高 === null ? '100dvh' : `${Math.max(240, Math.round(可视高))}px`);
    return;
  }

  try {
    const 父高 = window.parent?.innerHeight ?? 800;
    根.style.setProperty('--frame-h', `${Math.max(460, Math.round(父高 - 150))}px`);
  } catch {
    根.style.setProperty('--frame-h', '620px');
  }
}

export function 注册画幅监听(): () => void {
  const 候选: Window[] = [window];
  try {
    if (window.parent && !候选.includes(window.parent)) 候选.push(window.parent);
  } catch {
    /* 跨域父层不可监听 */
  }
  try {
    if (window.top && !候选.includes(window.top)) 候选.push(window.top);
  } catch {
    /* 跨域顶层不可监听 */
  }

  for (const 窗口 of 候选) {
    try {
      窗口.addEventListener('resize', 同步画幅);
      窗口.visualViewport?.addEventListener('resize', 同步画幅);
      窗口.visualViewport?.addEventListener('scroll', 同步画幅);
    } catch {
      /* 某一层不可监听不影响其余层 */
    }
  }

  return () => {
    for (const 窗口 of 候选) {
      try {
        窗口.removeEventListener('resize', 同步画幅);
        窗口.visualViewport?.removeEventListener('resize', 同步画幅);
        窗口.visualViewport?.removeEventListener('scroll', 同步画幅);
      } catch {
        /* 某一层已经销毁或跨域变化时继续清其余层 */
      }
    }
  };
}

/**
 * BFCache 会在 pagehide 时冻结当前文档，并在 pageshow 时复用同一份 JS 状态。
 * 冻结时暂时释放跨窗口监听，恢复时重新注册并立即校正画幅；普通销毁则只执行释放。
 */
export function 注册画幅页面生命周期(
  页面: Pick<EventTarget, 'addEventListener' | 'removeEventListener'> = window,
  注册监听: () => () => void = 注册画幅监听,
  同步: () => void = 同步画幅,
): () => void {
  let 注销监听: (() => void) | undefined = 注册监听();
  const 停止监听 = () => {
    if (!注销监听) return;
    注销监听();
    注销监听 = undefined;
  };
  const 页面隐藏 = () => 停止监听();
  const 页面显示 = (事件: Event) => {
    if (!(事件 as PageTransitionEvent).persisted || 注销监听) return;
    同步();
    注销监听 = 注册监听();
  };

  页面.addEventListener('pagehide', 页面隐藏);
  页面.addEventListener('pageshow', 页面显示);
  return () => {
    页面.removeEventListener('pagehide', 页面隐藏);
    页面.removeEventListener('pageshow', 页面显示);
    停止监听();
  };
}
