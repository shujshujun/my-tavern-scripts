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

const 内置解析等待宿主刷新字段 = '__人妻公寓_内置解析等待宿主刷新';

/**
 * 该运行期闸门只挂在酒馆父页面内存上：子 iframe 热重载不会误清，完整宿主刷新会自然清除。
 * 这样持久设置已改、MVU Pinia 副本尚未重载的窗口期内，游戏内置解析会失败关闭。
 */
type 宿主窗口类型 = Window & {
  Mvu?: unknown;
  SillyTavern?: ST接口;
  [内置解析等待宿主刷新字段]?: boolean;
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

/**
 * 宿主集成功能共用的稳定设置入口。优先使用酒馆助手注入到 iframe 本身的拍平接口，
 * 再回退父窗口 `getContext()`；禁止直接假定 `window.parent.SillyTavern` 已拍平设置字段。
 */
export function 读取宿主SillyTavern接口(): ST接口 | undefined {
  return 取ST();
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

const 界面偏好存储键 = '人妻公寓_界面偏好';

function 读界面偏好(): Record<string, unknown> {
  try {
    const raw = 偏好存储()?.getItem(界面偏好存储键);
    if (!raw) return {};
    const 值 = JSON.parse(raw) as unknown;
    return 值 && typeof 值 === 'object' ? (值 as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function 写界面偏好(补丁: Record<string, unknown>): boolean {
  try {
    const 存储 = 偏好存储();
    if (!存储) {
      console.warn('[人妻公寓] 写界面偏好失败:拿不到可写 localStorage');
      return false;
    }
    存储.setItem(界面偏好存储键, JSON.stringify({ ...读界面偏好(), ...补丁 }));
    return true;
  } catch (e) {
    console.warn('[人妻公寓] 写界面偏好失败:', e);
    return false;
  }
}

export type 变量解析偏好 = {
  内置变量解析: boolean;
  严格变量审计: boolean;
};

/** 设置页与游戏逻辑共用同一父页存储锚点和默认值，不各自直接碰 iframe localStorage。 */
export function 读取变量解析偏好(): 变量解析偏好 {
  const 偏好 = 读界面偏好();
  return {
    内置变量解析: 偏好.内置变量解析 !== false,
    严格变量审计: 偏好.严格变量审计 === true,
  };
}

/** 合并写入解析开关并报告真实持久化结果；调用方据此决定是否更新页面选中态。 */
export function 写入变量解析偏好(补丁: Partial<变量解析偏好>): boolean {
  return 写界面偏好(补丁);
}

/** 当前父页面是否正等待一次完整刷新，以让 MVU 的 Pinia 设置副本重新载入。 */
export function 内置变量解析等待宿主刷新(): boolean {
  try {
    return 宿主窗口()[内置解析等待宿主刷新字段] === true;
  } catch {
    try {
      return (window as 宿主窗口类型)[内置解析等待宿主刷新字段] === true;
    } catch {
      return false;
    }
  }
}

/**
 * 立即挂起游戏内置变量解析，直到整个酒馆父页面刷新。完整刷新会重建 Window，闸门自然消失；
 * 仅刷新 0 楼 iframe 不会清除父页标记，避免 MVU 仍持旧 Pinia 副本时提前恢复双解析。
 */
export function 挂起内置变量解析直至宿主刷新(): void {
  try {
    宿主窗口()[内置解析等待宿主刷新字段] = true;
    return;
  } catch {
    /* 跨域父页不可写时，至少在当前 iframe 失败关闭。 */
  }
  try {
    (window as 宿主窗口类型)[内置解析等待宿主刷新字段] = true;
  } catch {
    /* 极端宿主限制下由启动调用方停止挂载。 */
  }
}

/**
 * 酒馆的 saveSettingsDebounced 固定延迟约 1 秒；给持久请求额外收口时间后刷新父页面。
 * 若父页不可刷新，运行期闸门仍保持，玩家手动完整刷新前不会启用游戏内置解析。
 */
export function 安排宿主刷新以应用MVU设置(延迟毫秒 = 2200): boolean {
  挂起内置变量解析直至宿主刷新();
  try {
    const host = 宿主窗口();
    // 提前读取并绑定 reload：跨域父页会在这里同步失败，让调用方能显示“手动刷新”提示，
    // 而不是两秒后才只在控制台报错。
    const reload = host.location.reload.bind(host.location);
    setTimeout(() => {
      try {
        reload();
      } catch (e) {
        console.error('[人妻公寓] 自动刷新酒馆页面失败，请手动完整刷新页面:', e);
      }
    }, Math.max(0, 延迟毫秒));
    return true;
  } catch (e) {
    console.error('[人妻公寓] 无法安排酒馆页面刷新，请手动完整刷新页面:', e);
    return false;
  }
}

/** 游戏偏好里的“内置变量解析”开关；未设置过时默认开。等待父页刷新时失败关闭。 */
export function 内置变量解析开启(): boolean {
  return 读取变量解析偏好().内置变量解析 && !内置变量解析等待宿主刷新();
}

/** 严格变量审计是可选增强；未设置时保持关闭。 */
export function 严格变量审计开启(): boolean {
  return 读取变量解析偏好().严格变量审计;
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
 * 统一规范 OpenAI 兼容 API Base URL（语义与 MVU 官方 normalizeBaseURL 完全对齐）。
 *
 * 玩家在自定义 API 表单里可能填裸域名、带 /vN 的版本路径、完整 /models 或
 * /chat/completions 终端路径，也可能带首尾空格或末尾斜杠。若原样把错误 base 交给
 * generateRaw/getModelList，请求会失败两次后按设计保留旧变量——表现为"正文正常生成但变量不再更新"。
 * 本函数只做地址规范化，不触碰路由、密钥、模型名等任何其它语义：
 * - 空值/纯空白 → 空字符串（空白配置仍判不可用，绝不把空配置补成 /v1）；
 * - 已是 /vN 版本路径（如 /v1、/v2）→ 原样保留；
 * - 末尾 /models、/chat/completions → 去掉终端路径；
 * - 其余裸域名/代理根路径 → 补 /v1。
 * 设置页"读取模型"、"保存并启用"与回合引擎自定义变量请求共用本函数（单一事实来源），
 * 已规范的 /v1 地址幂等不变，也兼容现存裸域名、/vN、/models、/chat/completions 保存值，无需存档迁移。
 */
export function 规范OpenAI兼容API地址(原地址: string): string {
  const 地址 = 原地址.trim().replace(/\/+$/, '');
  if (!地址) return '';
  if (/\/v\d+$/.test(地址)) return 地址;
  if (地址.endsWith('/models')) return 地址.replace(/\/models$/, '');
  if (地址.endsWith('/chat/completions')) return 地址.replace(/\/chat\/completions$/, '');
  return `${地址}/v1`;
}

/**
 * 启动自检（每次启动都跑，被 MVU 内存副本覆盖回去也会下次自愈）：
 * 内置解析开着时，MVU 自己的“自动请求”必须关，否则同一楼会被两个模型各解析一次。
 * Mvu 全局对象没有设置接口、_reload_settings 锁在其 Pinia 内部，运行时实例改不动，
 * 只能改持久层（extensionSettings + saveSettingsDebounced），等页面刷新后完全生效。
 * 返回 true 表示本次确实代关了（调用方据此弹 toast）。
 */
export function 自动代关MVU自动请求(): boolean {
  if (!内置变量解析开启()) return false;
  const 设置 = 读MVU设置();
  if (设置?.更新方式 !== '额外模型解析') return false;

  // MVU 旧版把自动请求放在顶层，新版迁入额外模型配置。读取状态已用“新键 ?? 旧键”兼容，
  // 启动自愈也必须同时关掉仍为 true 的实际键；否则旧配置会继续和游戏内置解析双发。
  const 新键原值 = 设置.额外模型解析配置?.启用自动请求;
  const 旧键原值 = 设置.自动触发额外模型解析;
  // MVU 的当前 schema 将缺键默认为 true；因此“两个键都缺失”也必须显式写 false。
  const 缺键采用默认开启 = 新键原值 === undefined && 旧键原值 === undefined;
  if (新键原值 !== true && 旧键原值 !== true && !缺键采用默认开启) return false;

  const st = 取ST();
  const 根 = st?.extensionSettings;
  const 保存 = st?.saveSettingsDebounced;
  if (!根 || typeof 保存 !== 'function') {
    throw new Error('关闭 MVU 自动请求失败：拿不到 extensionSettings 或 saveSettingsDebounced');
  }
  const 快照 = 捕获MVU设置快照(根);
  try {
    if (新键原值 === true || 缺键采用默认开启) (设置.额外模型解析配置 ??= {}).启用自动请求 = false;
    if (旧键原值 === true) 设置.自动触发额外模型解析 = false;
    // 只有宿主明确受理保存后才挂刷新闸门；保存同步失败必须回滚并交给调用方停止启动或回退开关。
    保存.call(st);
    挂起内置变量解析直至宿主刷新();
    return true;
  } catch (e) {
    恢复MVU设置快照(根, 快照);
    throw e;
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

export function 写入变量解析通道(通道: 变量解析通道类型): boolean {
  // 自动只改游戏偏好，不触碰玩家已经填写的 MVU 自定义配置。
  if (通道 === '自动') return 写界面偏好({ 变量解析通道: 通道 });
  // 明确选择自定义时，模型来源与游戏通道必须同成同败，不能留下半启用状态。
  return 提交变量解析设置事务({ 模型来源: '自定义' }, '自定义');
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

type MVU设置事务快照 = {
  根原值存在: boolean;
  根原值: unknown;
  设置引用?: Record<string, unknown>;
  设置浅副本?: Record<string, unknown>;
  配置引用?: Record<string, unknown>;
  配置浅副本?: Record<string, unknown>;
};

function 是记录(值: unknown): 值 is Record<string, unknown> {
  return Boolean(值) && typeof 值 === 'object' && !Array.isArray(值);
}

function 捕获MVU设置快照(根: Record<string, unknown>): MVU设置事务快照 {
  const 根原值存在 = Object.prototype.hasOwnProperty.call(根, 'mvu_settings');
  const 根原值 = 根.mvu_settings;
  if (!是记录(根原值)) return { 根原值存在, 根原值 };
  const 设置引用 = 根原值;
  const 配置原值 = 设置引用.额外模型解析配置;
  return {
    根原值存在,
    根原值,
    设置引用,
    设置浅副本: { ...设置引用 },
    配置引用: 是记录(配置原值) ? 配置原值 : undefined,
    配置浅副本: 是记录(配置原值) ? { ...配置原值 } : undefined,
  };
}

function 原位恢复记录(目标: Record<string, unknown>, 快照: Record<string, unknown>): void {
  for (const 键 of Object.keys(目标)) delete 目标[键];
  Object.assign(目标, 快照);
}

function 恢复MVU设置快照(根: Record<string, unknown>, 快照: MVU设置事务快照): void {
  if (!快照.根原值存在) {
    delete 根.mvu_settings;
    return;
  }
  根.mvu_settings = 快照.根原值;
  if (!快照.设置引用 || !快照.设置浅副本) return;
  原位恢复记录(快照.设置引用, 快照.设置浅副本);
  if (快照.配置引用 && 快照.配置浅副本) {
    原位恢复记录(快照.配置引用, 快照.配置浅副本);
    快照.设置引用.额外模型解析配置 = 快照.配置引用;
  }
}

function 取或建MVU设置(根: Record<string, unknown>): MVU设置 {
  if (是记录(根.mvu_settings)) return 根.mvu_settings as MVU设置;
  const 设置: MVU设置 = {};
  根.mvu_settings = 设置;
  return 设置;
}

function 应用MVU设置补丁(设置: MVU设置, 补丁: MVU设置补丁): void {
  if (补丁.更新方式 !== undefined) 设置.更新方式 = 补丁.更新方式;
  if (!MVU外置配置键.some(键 => 补丁[键] !== undefined)) return;
  const 原配置 = 设置.额外模型解析配置;
  const 配置 = 是记录(原配置) ? 原配置 : ((设置.额外模型解析配置 = {}) as Record<string, unknown>);
  for (const 键 of MVU外置配置键) if (补丁[键] !== undefined) 配置[键] = 补丁[键];
}

function 解析偏好原文(原文: string | null): Record<string, unknown> {
  if (!原文) return {};
  try {
    const 值 = JSON.parse(原文) as unknown;
    return 是记录(值) ? 值 : {};
  } catch {
    return {};
  }
}

/**
 * MVU 配置与游戏解析通道跨两个持久层；先冻结两边原值，再提交并只调用一次宿主保存。
 * localStorage、extensionSettings 或 saveSettingsDebounced 任一步同步失败，都原位恢复旧对象与旧偏好。
 */
function 提交变量解析设置事务(补丁: MVU设置补丁, 通道: 变量解析通道类型): boolean {
  const st = 取ST();
  const 根 = st?.extensionSettings;
  const 保存 = st?.saveSettingsDebounced;
  const 存储 = 偏好存储();
  if (!根 || typeof 保存 !== 'function' || !存储) {
    console.warn('[人妻公寓] 提交变量解析设置失败:缺少 extensionSettings、saveSettingsDebounced 或 localStorage');
    return false;
  }

  let 原偏好: string | null;
  try {
    原偏好 = 存储.getItem(界面偏好存储键);
  } catch (e) {
    console.warn('[人妻公寓] 提交变量解析设置失败:无法读取旧偏好:', e);
    return false;
  }
  const MVU快照 = 捕获MVU设置快照(根);
  let 偏好已写 = false;
  try {
    应用MVU设置补丁(取或建MVU设置(根), 补丁);
    存储.setItem(
      界面偏好存储键,
      JSON.stringify({ ...解析偏好原文(原偏好), 变量解析通道: 通道 }),
    );
    偏好已写 = true;
    保存.call(st);
    return true;
  } catch (e) {
    恢复MVU设置快照(根, MVU快照);
    if (偏好已写) {
      try {
        if (原偏好 === null) 存储.removeItem(界面偏好存储键);
        else 存储.setItem(界面偏好存储键, 原偏好);
      } catch (回滚错误) {
        console.error('[人妻公寓] 解析设置事务失败且偏好回滚受阻:', 回滚错误);
      }
    }
    console.warn('[人妻公寓] 提交变量解析设置失败，已回滚:', e);
    return false;
  }
}

/** 自定义 API 表单的唯一提交入口：模型配置与“自定义”通道同成同败。 */
export function 保存自定义变量解析设置(补丁: Omit<MVU设置补丁, '模型来源'>): boolean {
  return 提交变量解析设置事务({ ...补丁, 模型来源: '自定义' }, '自定义');
}

/**
 * 游戏设置页写穿 MVU 持久层（extensionSettings + saveSettingsDebounced）。
 * 玩家从此不必打开 MVU 变量框架面板。注意 MVU 运行时的 Pinia 副本改不动：
 * 游戏自己的内置解析每回合都读持久层、立即生效；MVU 插件自身行为要刷新页面才跟上。
 * mvu_settings 缺失时按需创建——MVU 的 zod schema 各字段均有默认值，残缺对象能被正常补全。
 */
export function 写入MVU设置(补丁: MVU设置补丁): boolean {
  const st = 取ST();
  const 根 = st?.extensionSettings;
  const 保存 = st?.saveSettingsDebounced;
  if (!根 || typeof 保存 !== 'function') {
    console.warn('[人妻公寓] 写入MVU设置失败:拿不到 extensionSettings 或 saveSettingsDebounced');
    return false;
  }
  const 快照 = 捕获MVU设置快照(根);
  try {
    应用MVU设置补丁(取或建MVU设置(根), 补丁);
    保存.call(st);
    return true;
  } catch (e) {
    恢复MVU设置快照(根, 快照);
    console.warn('[人妻公寓] 写入MVU设置失败，已回滚:', e);
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
