import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';

/**
 * getButtonEvent 会把当前脚本 id 编进事件名。游戏逻辑与 MVU 是两支独立脚本，
 * 因而只能先发稳定的跨脚本事件，再由 MVU 在自己的上下文里触发官方按钮。
 *
 * 注意：此文件禁止 import 任何本地模块（只允许 side-effect import URL 形式），
 * 否则 webpack ESM output 会把 http external 从 `import 'url'` 改写为
 * `import * as __mod__ from 'url'`，在酒馆脚本沙箱中执行时报错，导致
 * MVU bundle 加载失败，waitGlobalInitialized('Mvu') 永远超时。
 */

/** 读取界面偏好（内联，不 import MVU解析模式.ts，避免破坏 webpack side-effect import）。 */
function _读内置解析开关(): boolean {
  try {
    const _w = (window.parent ?? window) as unknown as { localStorage?: Storage };
    const raw = _w.localStorage?.getItem('人妻公寓_界面偏好');
    if (!raw) return true;
    const 值 = JSON.parse(raw) as unknown;
    if (!值 || typeof 值 !== 'object') return true;
    return (值 as Record<string, unknown>).内置变量解析 !== false;
  } catch {
    return true;
  }
}

/** 读取 MVU 当前更新方式（内联）。 */
function _是外置模式(): boolean {
  // 酒馆助手在 iframe 里注入的 SillyTavern 已拍平 extensionSettings；
  // 顶层页面的 window.SillyTavern 只有 getContext()。依次尝试三处。
  const _取根 = (): Record<string, unknown> | undefined => {
    const 候选: unknown[] = [];
    try {
      候选.push((globalThis as { SillyTavern?: unknown }).SillyTavern);
    } catch {
      /* 忽略 */
    }
    try {
      候选.push((window.parent ?? window) as unknown);
    } catch {
      /* 忽略 */
    }
    for (const c of 候选) {
      const st = (c as { SillyTavern?: unknown })?.SillyTavern ?? c;
      const 根 = (st as { extensionSettings?: Record<string, unknown> })?.extensionSettings;
      if (根) return 根;
      try {
        const ctx = (st as { getContext?: () => { extensionSettings?: Record<string, unknown> } })?.getContext?.();
        if (ctx?.extensionSettings) return ctx.extensionSettings;
      } catch {
        /* 忽略 */
      }
    }
    return undefined;
  };
  try {
    const s = _取根()?.mvu_settings as { 更新方式?: unknown } | undefined;
    return s?.更新方式 === '额外模型解析';
  } catch {
    return false;
  }
}

$(() => {
  eventOn('人妻公寓:MVU外置模型重试', async () => {
    // 内置变量解析开着时由引擎自己请求解析模型，桥绝不再按官方按钮，
    // 避免同一楼被解析两次。手动兜底请直接点 MVU 面板的「重试额外模型解析」。
    if (_是外置模式() && _读内置解析开关()) {
      console.info('[人妻公寓·MVU桥] 内置变量解析已接管，跳过官方外置按钮');
      return;
    }
    await eventEmit(getButtonEvent('重试额外模型解析'));
  });
});
