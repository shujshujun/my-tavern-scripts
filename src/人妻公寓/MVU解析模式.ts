export type MVU解析状态 = {
  /** MVU 已向宿主窗口暴露运行时对象。 */
  已加载: boolean;
  /** 玩家在 MVU 中选择了“额外模型解析”。 */
  外置模式: boolean;
  /** MVU 是否允许正常回复自动发起额外模型请求。 */
  自动请求: boolean;
  /** 游戏开关：外置模式下由游戏自己请求解析模型（默认开）。 */
  内置解析: boolean;
};

export type MVU外置模型配置 = {
  模型来源: '与插头相同' | '自定义';
  api地址: string;
  密钥: string;
  模型名称: string;
  温度?: number;
  top_p?: number;
  最大回复token数?: number;
};

type MVU设置 = {
  更新方式?: unknown;
  自动触发额外模型解析?: unknown;
  额外模型解析配置?: {
    启用自动请求?: unknown;
    模型来源?: unknown;
    api地址?: unknown;
    密钥?: unknown;
    模型名称?: unknown;
    温度?: unknown;
    top_p?: unknown;
    最大回复token数?: unknown;
  };
};

type 宿主窗口类型 = Window & {
  Mvu?: unknown;
  SillyTavern?: ST接口;
};

type ST接口 = {
  extensionSettings?: Record<string, unknown>;
  saveSettingsDebounced?: () => void;
  getContext?: () => { extensionSettings?: Record<string, unknown>; saveSettingsDebounced?: () => void };
};

function 宿主窗口(): 宿主窗口类型 {
  return (window.parent ?? window) as 宿主窗口类型;
}

/**
 * 取真正带 extensionSettings 的 ST 接口。
 *
 * 酒馆助手在 iframe 里注入的 `SillyTavern` 全局已经拍平了 `extensionSettings` 与
 * `saveSettingsDebounced`；而顶层酒馆页面的 `window.SillyTavern` 只暴露 `getContext()`，
 * 直接读 `window.parent.SillyTavern.extensionSettings` 会拿到 undefined ——
 * 于是路线按钮读不出状态、写入静默失败（rq0.71 症状）。
 * 依次尝试：iframe 注入全局 → 本窗口 → 父窗口，父窗口再回退 getContext()。
 */
function 取ST(): ST接口 | undefined {
  const 候选: (ST接口 | undefined)[] = [];
  try {
    候选.push((globalThis as unknown as { SillyTavern?: ST接口 }).SillyTavern);
  } catch {
    /* 忽略跨域或未注入 */
  }
  try {
    候选.push((window as unknown as { SillyTavern?: ST接口 }).SillyTavern);
  } catch {
    /* 忽略 */
  }
  try {
    候选.push(宿主窗口().SillyTavern);
  } catch {
    /* 忽略跨域 */
  }
  for (const st of 候选) {
    if (st?.extensionSettings) return st;
  }
  // 全部拍平字段缺失时，用顶层的 getContext() 兜底（酒馆主页面形态）。
  for (const st of 候选) {
    try {
      const ctx = st?.getContext?.();
      if (ctx?.extensionSettings) {
        return { extensionSettings: ctx.extensionSettings, saveSettingsDebounced: ctx.saveSettingsDebounced };
      }
    } catch {
      /* 忽略 */
    }
  }
  return 候选.find(Boolean);
}

function 读MVU设置(): MVU设置 | undefined {
  return 取ST()?.extensionSettings?.mvu_settings as MVU设置 | undefined;
}

/** Mvu 同样是逐窗口注入：iframe 里在本作用域，主页面里在 window 上。 */
function Mvu已加载(): boolean {
  try {
    if ((globalThis as unknown as { Mvu?: unknown }).Mvu) return true;
  } catch {
    /* 忽略 */
  }
  try {
    if ((window as unknown as { Mvu?: unknown }).Mvu) return true;
  } catch {
    /* 忽略 */
  }
  try {
    return Boolean(宿主窗口().Mvu);
  } catch {
    return false;
  }
}

/**
 * 偏好统一落在顶层窗口的 localStorage：App.vue（画幅 iframe）与游戏逻辑脚本必须
 * 读同一份，`window.parent` 是二者唯一的共同锚点。父窗口不可达时退回本窗口，
 * 至少不让整份偏好读不出来。
 */
function 偏好存储(): Storage | undefined {
  try {
    const s = 宿主窗口().localStorage;
    if (s) return s;
  } catch {
    /* 跨域时不可达 */
  }
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function 读界面偏好(): Record<string, unknown> {
  try {
    const raw = 偏好存储()?.getItem('人妻公寓_界面偏好');
    if (!raw) return {};
    const 值 = JSON.parse(raw) as unknown;
    return 值 && typeof 值 === 'object' ? (值 as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function 写界面偏好(补丁: Record<string, unknown>): void {
  try {
    偏好存储()?.setItem('人妻公寓_界面偏好', JSON.stringify({ ...读界面偏好(), ...补丁 }));
  } catch (e) {
    console.warn('[人妻公寓] 写界面偏好失败:', e);
  }
}

/** 游戏偏好里的“内置变量解析”开关；未设置过时默认开。 */
export function 内置变量解析开启(): boolean {
  return 读界面偏好().内置变量解析 !== false;
}

/** 严格变量审计是可选增强；未设置时保持关闭。 */
export function 严格变量审计开启(): boolean {
  return 读界面偏好().严格变量审计 === true;
}

/**
 * 只读取 MVU 的路线开关，不读取或复制它的模型地址、密钥等配置。
 *
 * MVU 暂未公开“当前更新方式”的全局 API；官方设置保存在
 * `SillyTavern.extensionSettings.mvu_settings`。旧版的自动请求键也在这里兼容。
 */
export function 读取MVU解析状态(): MVU解析状态 {
  try {
    const 设置 = 读MVU设置();
    const 自动请求原值 = 设置?.额外模型解析配置?.启用自动请求 ?? 设置?.自动触发额外模型解析;
    return {
      已加载: Mvu已加载(),
      外置模式: 设置?.更新方式 === '额外模型解析',
      自动请求: 自动请求原值 === undefined ? true : 自动请求原值 === true,
      内置解析: 内置变量解析开启(),
    };
  } catch {
    return { 已加载: false, 外置模式: false, 自动请求: true, 内置解析: true };
  }
}

function 取数值(原值: unknown): number | undefined {
  const 数 = typeof 原值 === 'string' ? Number(原值) : 原值;
  return typeof 数 === 'number' && Number.isFinite(数) ? 数 : undefined;
}

/**
 * 内置变量解析复用 MVU 面板玩家已填好的接口参数（只读，不写）。
 * 面板缺失或结构对不上时返回 null；调用方按独立解析路由选择数据库或自定义，
 * 两者都不可用就提示配置，绝不回落正文 API。
 */
export function 读取MVU外置模型配置(): MVU外置模型配置 | null {
  try {
    const 配置 = 读MVU设置()?.额外模型解析配置;
    if (!配置) return null;
    const 模型来源 = 配置.模型来源 === '自定义' ? '自定义' : 配置.模型来源 === '与插头相同' ? '与插头相同' : null;
    if (!模型来源) return null;
    return {
      模型来源,
      api地址: typeof 配置.api地址 === 'string' ? 配置.api地址 : '',
      密钥: typeof 配置.密钥 === 'string' ? 配置.密钥 : '',
      模型名称: typeof 配置.模型名称 === 'string' ? 配置.模型名称 : '',
      温度: 取数值(配置.温度),
      top_p: 取数值(配置.top_p),
      最大回复token数: 取数值(配置.最大回复token数),
    };
  } catch {
    return null;
  }
}

/**
 * 启动自检（每次启动都跑，被 MVU 内存副本覆盖回去也会下次自愈）：
 * 内置解析开着时，MVU 自己的“自动请求”必须关，否则同一楼会被两个模型各解析一次。
 * Mvu 全局对象没有设置接口、_reload_settings 锁在其 Pinia 内部，运行时实例改不动，
 * 只能改持久层（extensionSettings + saveSettingsDebounced），等页面刷新后完全生效。
 * 返回 true 表示本次确实代关了（调用方据此弹 toast）。
 */
export function 自动代关MVU自动请求(): boolean {
  try {
    if (!内置变量解析开启()) return false;
    const 设置 = 读MVU设置();
    if (设置?.更新方式 !== '额外模型解析') return false;
    const 配置 = 设置.额外模型解析配置;
    if (!配置 || 配置.启用自动请求 !== true) return false;
    配置.启用自动请求 = false;
    取ST()?.saveSettingsDebounced?.();
    return true;
  } catch {
    return false;
  }
}

/**
 * 变量解析通道（游戏偏好，玩家在游戏设置页选，不进 MVU）：
 * - 自动：数据库插件可代发就交给数据库（同微信"数据库模式沿用数据库当前配置"，
 *   不读取数据库密钥与模型）；没有数据库时使用已填写的自定义 API。
 * - 自定义：用下方自定义 API（即 MVU 额外模型解析配置，游戏设置页写穿）。
 * 正文模型只负责故事：外置变量解析绝不回落正文 API。
 */
export type 变量解析通道类型 = '自动' | '自定义';

/** 非法或缺失的通道值统一规范为当前默认值 `自动`。 */
export function 规范变量解析通道(原值: unknown): 变量解析通道类型 {
  return 原值 === '自定义' ? '自定义' : '自动';
}

/**
 * 外置变量解析的路由矩阵（纯函数，可行为测试）：
 * - 自动：数据库可用 → 数据库；否则自定义可用 → 自定义；两者都无 → null（绝不回落正文 API）。
 * - 自定义：配置完整才走自定义；配置不完整 → null（绝不偷偷改走数据库）。
 * 返回 null 表示没有任何可用的外置解析模型，调用方应保留正文与旧变量并提示配置。
 */
export function 选择变量解析通道(
  偏好: 变量解析通道类型,
  数据库可调用AI: boolean,
  自定义API可用: boolean,
): '数据库' | '自定义' | null {
  if (偏好 === '自定义') return 自定义API可用 ? '自定义' : null;
  if (数据库可调用AI) return '数据库';
  return 自定义API可用 ? '自定义' : null;
}

export function 读取变量解析通道(): 变量解析通道类型 {
  return 规范变量解析通道(读界面偏好().变量解析通道);
}

export function 写入变量解析通道(通道: 变量解析通道类型): void {
  写界面偏好({ 变量解析通道: 通道 });
  // 只有明确选择自定义时才把 MVU 的模型来源写成自定义；自动绝不触碰 MVU 配置，
  // 避免把已填写的自定义 API 改到不可用（模型来源变成"与插头相同"会让"自定义可用"判否）。
  if (通道 === '自定义') 写入MVU设置({ 模型来源: '自定义' });
}

export type MVU设置补丁 = {
  更新方式?: '额外模型解析';
  模型来源?: '与插头相同' | '自定义';
  api地址?: string;
  密钥?: string;
  模型名称?: string;
  温度?: number;
  top_p?: number;
  最大回复token数?: number;
  启用自动请求?: boolean;
};

const MVU外置配置键 = ['模型来源', 'api地址', '密钥', '模型名称', '温度', 'top_p', '最大回复token数', '启用自动请求'] as const;

/**
 * 游戏设置页写穿 MVU 持久层（extensionSettings + saveSettingsDebounced）。
 * 玩家从此不必打开 MVU 变量框架面板。注意 MVU 运行时的 Pinia 副本改不动：
 * 游戏自己的内置解析每回合都读持久层、立即生效；MVU 插件自身行为要刷新页面才跟上。
 * mvu_settings 缺失时按需创建——MVU 的 zod schema 各字段均有默认值，残缺对象能被正常补全。
 */
export function 写入MVU设置(补丁: MVU设置补丁): boolean {
  try {
    const st = 取ST();
    const 根 = st?.extensionSettings;
    if (!根) {
      console.warn('[人妻公寓] 写入MVU设置失败:拿不到 SillyTavern.extensionSettings');
      return false;
    }
    const 设置 = (根.mvu_settings ??= {}) as MVU设置;
    if (补丁.更新方式 !== undefined) 设置.更新方式 = 补丁.更新方式;
    if (MVU外置配置键.some(键 => 补丁[键] !== undefined)) {
      const 配置 = (设置.额外模型解析配置 ??= {}) as Record<string, unknown>;
      for (const 键 of MVU外置配置键) if (补丁[键] !== undefined) 配置[键] = 补丁[键];
    }
    st?.saveSettingsDebounced?.();
    return true;
  } catch (e) {
    console.warn('[人妻公寓] 写入MVU设置失败:', e);
    return false;
  }
}

/** v0.80 版本化初始化键：确保本版首次启动时统一进入唯一受支持的外置变量路线。 */
const MVU外置默认V080初始化键 = 'MVU外置默认V080已初始化';

/**
 * v0.80 启动一次性初始化：本卡只支持"额外模型解析"，
 * 玩家装好 MVU 什么都不用设。只有确认 MVU 当前已是外置、或 写入MVU设置 确认成功后，
 * 才记录 V080 初始化标记；拿不到 extensionSettings 或写入失败时不得提前写标记，
 * 下一次启动必须可重试。成功初始化一次后完全尊重玩家在游戏设置页（或 MVU 面板）的
 * 选择，绝不每次启动强改回去。返回 true 表示本次确实把更新方式写成了外置。
 */
export function 确保MVU默认外置解析(): boolean {
  try {
    if (读界面偏好()[MVU外置默认V080初始化键] === true) return false;
    const 设置 = 读MVU设置();
    if (设置?.更新方式 === '额外模型解析') {
      写界面偏好({ [MVU外置默认V080初始化键]: true });
      return false;
    }
    const 成功 = 写入MVU设置({ 更新方式: '额外模型解析' });
    if (成功) 写界面偏好({ [MVU外置默认V080初始化键]: true });
    return 成功;
  } catch {
    return false;
  }
}
