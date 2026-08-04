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
  SillyTavern?: {
    extensionSettings?: Record<string, unknown>;
    saveSettingsDebounced?: () => void;
  };
};

function 宿主窗口(): 宿主窗口类型 {
  return (window.parent ?? window) as 宿主窗口类型;
}

function 读MVU设置(): MVU设置 | undefined {
  return 宿主窗口().SillyTavern?.extensionSettings?.mvu_settings as MVU设置 | undefined;
}

function 读界面偏好(): Record<string, unknown> {
  try {
    const raw = 宿主窗口().localStorage?.getItem('人妻公寓_界面偏好');
    if (!raw) return {};
    const 值 = JSON.parse(raw) as unknown;
    return 值 && typeof 值 === 'object' ? (值 as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function 写界面偏好(补丁: Record<string, unknown>): void {
  try {
    宿主窗口().localStorage?.setItem('人妻公寓_界面偏好', JSON.stringify({ ...读界面偏好(), ...补丁 }));
  } catch (e) {
    console.warn('[人妻公寓] 写界面偏好失败:', e);
  }
}

/** 游戏偏好里的“内置变量解析”开关；未设置过时默认开。 */
export function 内置变量解析开启(): boolean {
  return 读界面偏好().内置变量解析 !== false;
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
      已加载: Boolean(宿主窗口().Mvu),
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
 * 面板缺失或结构对不上时返回 null，调用方走数据库/正文通道兜底。
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
    宿主窗口().SillyTavern?.saveSettingsDebounced?.();
    return true;
  } catch {
    return false;
  }
}

/**
 * 变量解析通道（游戏偏好，玩家在游戏设置页选，不进 MVU）：
 * - 自动：数据库插件可代发就交给数据库（同微信"数据库模式沿用数据库当前配置"，
 *   不读取数据库密钥与模型）；其次自定义 API；最后正文 API 兜底。
 * - 正文：只用正文 API 静默生成。
 * - 自定义：用下方自定义 API（即 MVU 额外模型解析配置，游戏设置页写穿）。
 */
export type 变量解析通道类型 = '自动' | '正文' | '自定义';

export function 读取变量解析通道(): 变量解析通道类型 {
  const 值 = 读界面偏好().变量解析通道;
  return 值 === '正文' || 值 === '自定义' ? 值 : '自动';
}

export function 写入变量解析通道(通道: 变量解析通道类型): void {
  写界面偏好({ 变量解析通道: 通道 });
  // 顺手对齐 MVU 的模型来源，让玩家手动点 MVU"重试额外模型解析"按钮时走同一套配置：
  // 自定义→自定义；自动/正文→与插头相同（避免 MVU 落回出厂 localhost 假地址）。
  写入MVU设置(通道 === '自定义' ? { 模型来源: '自定义' } : { 模型来源: '与插头相同' });
}

export type MVU设置补丁 = {
  更新方式?: '随AI输出' | '额外模型解析';
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
    const st = 宿主窗口().SillyTavern;
    const 根 = st?.extensionSettings;
    if (!根) return false;
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

/**
 * 启动一次性初始化（2026-08-04 用户拍板）：本卡默认走"额外模型解析"，玩家装好 MVU
 * 什么都不用设。只在从未初始化过时把 更新方式 写成外置；此后完全尊重玩家在游戏
 * 设置页（或 MVU 面板）的选择，绝不每次启动强改回去。返回 true 表示本次确实改了。
 */
export function 确保MVU默认外置解析(): boolean {
  try {
    if (读界面偏好().MVU外置默认已初始化 === true) return false;
    写界面偏好({ MVU外置默认已初始化: true });
    const 设置 = 读MVU设置();
    if (设置?.更新方式 === '额外模型解析') return false;
    return 写入MVU设置({ 更新方式: '额外模型解析' });
  } catch {
    return false;
  }
}
