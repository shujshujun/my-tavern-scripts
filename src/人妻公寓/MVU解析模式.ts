export type MVU解析状态 = {
  /** MVU 已向宿主窗口暴露运行时对象。 */
  已加载: boolean;
  /** 玩家在 MVU 中选择了“额外模型解析”。 */
  外置模式: boolean;
  /** MVU 是否允许正常回复自动发起额外模型请求。 */
  自动请求: boolean;
  /** 游戏开关：由游戏自己请求解析模型（默认开；不依赖 MVU 当前更新方式）。 */
  内置解析: boolean;
};

export type 变量解析执行路径 = '游戏内置' | 'MVU官方自动' | 'MVU官方待手动' | '跳过';

/** 单轮只能选择一条变量解析执行路径，作为防双发的可测试总闸。 */
export function 选择变量解析执行路径(
  状态: MVU解析状态,
  有可写演员: boolean,
  静音会议: boolean,
): 变量解析执行路径 {
  if (静音会议 || !有可写演员) return '跳过';
  if (状态.内置解析) return '游戏内置';
  if (!状态.外置模式) return '跳过';
  return 状态.自动请求 ? 'MVU官方自动' : 'MVU官方待手动';
}

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
    /** 兼容 MVU 新版多方案结构；游戏只迁移当前方案，不依赖该运行时结构。 */
    api方案列表?: unknown;
    当前api方案?: unknown;
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

type ST上下文 = {
  extensionSettings?: Record<string, unknown>;
  saveSettingsDebounced?: () => void | Promise<void>;
};

type ST接口 = ST上下文 & {
  getContext?: () => ST上下文;
};

export type 宿主设置来源 = 'parent-context' | 'iframe-flat' | 'window-flat' | 'parent-flat' | 'none';

type ST定位 = {
  接口?: ST接口;
  保存所有者?: ST接口;
  来源: 宿主设置来源;
  父页上下文设置?: Record<string, unknown>;
};

function 宿主窗口(): 宿主窗口类型 {
  return (window.parent ?? window) as 宿主窗口类型;
}

function 安全读取ST(读取: () => ST接口 | undefined): ST接口 | undefined {
  try {
    return 读取();
  } catch {
    return undefined;
  }
}

/**
 * `extensionSettings` 的权威来源必须是父页 `getContext()`：iframe 拍平对象可能是创建时快照，
 * 游戏重开只重载 0 楼 iframe 后仍会保留旧引用。只有父页上下文不可用时才退回拍平接口。
 */
function 取ST定位(): ST定位 {
  const iframe拍平 = 安全读取ST(() => (globalThis as unknown as { SillyTavern?: ST接口 }).SillyTavern);
  const 本窗拍平 = 安全读取ST(() => (window as unknown as { SillyTavern?: ST接口 }).SillyTavern);
  const 父页拍平 = 安全读取ST(() => 宿主窗口().SillyTavern);
  const 父页上下文 = 安全读取ST(() => 父页拍平?.getContext?.());
  const 父页上下文设置 = 父页上下文?.extensionSettings;
  const 候选: Array<{ 接口?: ST接口; 来源: 宿主设置来源 }> = [
    { 接口: 父页上下文, 来源: 'parent-context' },
    { 接口: iframe拍平, 来源: 'iframe-flat' },
    { 接口: 本窗拍平, 来源: 'window-flat' },
    { 接口: 父页拍平, 来源: 'parent-flat' },
  ];
  const 命中 = 候选.find(项 => 项.接口?.extensionSettings) ?? 候选.find(项 => 项.接口);
  if (!命中?.接口) return { 来源: 'none', 父页上下文设置 };

  const 设置 = 命中.接口.extensionSettings;
  const 保存候选 = [父页上下文, 父页拍平, iframe拍平, 本窗拍平].filter(
    (项): 项 is ST接口 => Boolean(项),
  );
  const 保存所有者 =
    保存候选.find(项 => 项.extensionSettings === 设置 && typeof 项.saveSettingsDebounced === 'function') ??
    保存候选.find(项 => typeof 项.saveSettingsDebounced === 'function');
  return { 接口: 命中.接口, 保存所有者, 来源: 命中.来源, 父页上下文设置 };
}

function 取ST(): ST接口 | undefined {
  return 取ST定位().接口;
}

/** 真正等待宿主设置保存；同步抛错与 Promise reject 都交给事务回滚。 */
async function 等待宿主设置保存(定位 = 取ST定位()): Promise<void> {
  const 保存所有者 = 定位.保存所有者;
  const 保存 = 保存所有者?.saveSettingsDebounced;
  if (typeof 保存 !== 'function') throw new Error('拿不到 saveSettingsDebounced');
  await Promise.resolve(保存.call(保存所有者));
}

/**
 * 宿主集成功能共用的稳定设置入口。优先使用父页 `getContext()` 的实时对象，避免重开后
 * 继续读取 iframe 创建时的拍平快照；父页上下文不可用时才回退各窗口拍平接口。
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

function 展开MVU方案记录(原值: unknown): Record<string, unknown> | null {
  if (!是记录(原值)) return null;
  for (const 键 of ['配置', 'config', 'api配置', '参数']) {
    const 内层 = 原值[键];
    if (是记录(内层)) return { ...原值, ...内层 };
  }
  return 原值;
}

function 规范模型配置记录(原值: unknown, 默认来源?: MVU外置模型配置['模型来源']): MVU外置模型配置 | null {
  const 配置 = 展开MVU方案记录(原值);
  if (!配置) return null;
  const 模型来源 =
    配置.模型来源 === '自定义' || 配置.模型来源 === '与插头相同'
      ? 配置.模型来源
      : 默认来源 ?? null;
  if (!模型来源) return null;
  const api地址 = typeof 配置.api地址 === 'string' ? 配置.api地址 : '';
  const 密钥 = typeof 配置.密钥 === 'string' ? 配置.密钥 : '';
  const 模型名称 = typeof 配置.模型名称 === 'string' ? 配置.模型名称 : '';
  if (!api地址 && !密钥 && !模型名称 && 配置.模型来源 === undefined && !默认来源) return null;
  return {
    模型来源,
    api地址,
    密钥,
    模型名称,
    温度: 取数值(配置.温度),
    top_p: 取数值(配置.top_p),
    最大回复token数: 取数值(配置.最大回复token数),
  };
}

function 读取MVU当前方案记录(配置: MVU设置['额外模型解析配置']): Record<string, unknown> | null {
  if (!配置) return null;
  const 当前 = 配置.当前api方案;
  if (是记录(当前)) return 展开MVU方案记录(当前);
  const 列表 = 配置.api方案列表;
  if (Array.isArray(列表)) {
    if (typeof 当前 === 'number' && Number.isInteger(当前)) return 展开MVU方案记录(列表[当前]);
    if (typeof 当前 === 'string') {
      const 命中 = 列表.find(项 => {
        if (!是记录(项)) return false;
        return ['名称', '方案名', 'name', 'id', 'key', 'uuid'].some(键 => String(项[键] ?? '') === 当前);
      });
      return 展开MVU方案记录(命中);
    }
  }
  if (是记录(列表) && (typeof 当前 === 'string' || typeof 当前 === 'number')) {
    return 展开MVU方案记录(列表[String(当前)]);
  }
  return null;
}

function 模型配置相同(a: MVU外置模型配置 | null, b: MVU外置模型配置 | null): boolean {
  if (!a || !b) return a === b;
  return (
    a.模型来源 === b.模型来源 &&
    a.api地址 === b.api地址 &&
    a.密钥 === b.密钥 &&
    a.模型名称 === b.模型名称 &&
    a.温度 === b.温度 &&
    a.top_p === b.top_p &&
    a.最大回复token数 === b.最大回复token数
  );
}

type MVU外置配置详情 = {
  配置: MVU外置模型配置 | null;
  平铺配置: MVU外置模型配置 | null;
  当前方案配置: MVU外置模型配置 | null;
  activeProfilePresent: boolean;
  activeProfileMatchesFlat: boolean;
};

function 读取MVU外置配置详情(): MVU外置配置详情 {
  try {
    const 外置 = 读MVU设置()?.额外模型解析配置;
    const 平铺配置 = 规范模型配置记录(外置);
    const 当前方案记录 = 读取MVU当前方案记录(外置);
    const 当前方案配置 = 规范模型配置记录(当前方案记录, 平铺配置?.模型来源);
    return {
      配置: 当前方案配置 ?? 平铺配置,
      平铺配置,
      当前方案配置,
      activeProfilePresent: Boolean(当前方案记录),
      activeProfileMatchesFlat: Boolean(当前方案配置 && 平铺配置 && 模型配置相同(当前方案配置, 平铺配置)),
    };
  } catch {
    return { 配置: null, 平铺配置: null, 当前方案配置: null, activeProfilePresent: false, activeProfileMatchesFlat: false };
  }
}

/**
 * MVU 配置只用于旧用户兼容迁移，或玩家关闭游戏内置解析后走 MVU 官方外置路径。
 * 游戏内置变量请求不得把 MVU 面板/Pinia 当前方案当作运行前置；配置缺失时绝不回落正文 API。
 */
export function 读取MVU外置模型配置(): MVU外置模型配置 | null {
  return 读取MVU外置配置详情().配置;
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
export async function 自动代关MVU自动请求(): Promise<boolean> {
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

  const 定位 = 取ST定位();
  const 根 = 定位.接口?.extensionSettings;
  if (!根 || !定位.保存所有者?.saveSettingsDebounced) {
    throw new Error('关闭 MVU 自动请求失败：拿不到 extensionSettings 或 saveSettingsDebounced');
  }
  const 快照 = 捕获MVU设置快照(根);
  try {
    if (新键原值 === true || 缺键采用默认开启) (设置.额外模型解析配置 ??= {}).启用自动请求 = false;
    if (旧键原值 === true) 设置.自动触发额外模型解析 = false;
    // 只有宿主异步保存真正 resolve 后才挂刷新闸门；Promise reject 必须先原位回滚。
    await 等待宿主设置保存(定位);
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

const 游戏变量解析设置键 = 'rqgy_builtin_variable_parser';

export type 游戏变量解析配置来源 = '游戏权威配置' | 'MVU兼容配置' | '默认配置';

export interface 游戏变量解析设置 {
  版本: 1;
  通道: 变量解析通道类型;
  自定义API: MVU外置模型配置 | null;
  来源: 游戏变量解析配置来源;
}

interface 游戏变量解析持久设置 {
  版本: 1;
  通道: 变量解析通道类型;
  自定义API?: MVU外置模型配置;
}

function 读取游戏变量解析持久设置(): 游戏变量解析持久设置 | null {
  const 原值 = 取ST()?.extensionSettings?.[游戏变量解析设置键];
  if (!是记录(原值)) return null;
  const 自定义API = 规范模型配置记录(原值.自定义API, '自定义');
  return {
    版本: 1,
    通道: 规范变量解析通道(原值.通道),
    ...(自定义API ? { 自定义API: { ...自定义API, 模型来源: '自定义' } } : {}),
  };
}

/**
 * 游戏内置变量解析的唯一权威读取入口。新配置独立于聊天楼层与 MVU Pinia；旧用户在首次
 * 持久迁移前仍可直接读取 MVU 已保存的自定义配置，因此重开后无需打开面板或拉取模型。
 */
export function 读取游戏变量解析设置(): 游戏变量解析设置 {
  const 持久 = 读取游戏变量解析持久设置();
  if (持久) {
    return {
      版本: 1,
      通道: 持久.通道,
      自定义API: 持久.自定义API ?? null,
      来源: '游戏权威配置',
    };
  }
  const 兼容 = 读取MVU外置配置详情().配置;
  const 自定义API = 兼容?.模型来源 === '自定义' ? { ...兼容, 模型来源: '自定义' as const } : null;
  return {
    版本: 1,
    通道: 规范变量解析通道(读界面偏好().变量解析通道),
    自定义API,
    来源: 自定义API ? 'MVU兼容配置' : '默认配置',
  };
}

export interface 游戏变量请求路由 {
  selectedRoute: '数据库' | '自定义' | null;
  配置: MVU外置模型配置 | null;
  配置来源: 游戏变量解析配置来源;
  通道: 变量解析通道类型;
  自定义API可用: boolean;
}

/** 每次变量请求实时调用，不缓存设置页或上一轮的临时激活状态。 */
export function 解析游戏变量请求路由(数据库可调用AI: boolean): 游戏变量请求路由 {
  const 设置 = 读取游戏变量解析设置();
  const 配置 = 设置.自定义API;
  const 自定义API可用 =
    配置?.模型来源 === '自定义' && !!规范OpenAI兼容API地址(配置.api地址) && !!配置.模型名称.trim();
  return {
    selectedRoute: 选择变量解析通道(设置.通道, 数据库可调用AI, 自定义API可用),
    配置,
    配置来源: 设置.来源,
    通道: 设置.通道,
    自定义API可用,
  };
}

export interface 变量配置握手诊断 {
  chatId: string;
  stSource: 宿主设置来源;
  sameExtensionSettingsAsParentContext: boolean;
  mvuLoaded: boolean;
  externalMode: boolean;
  internalParser: boolean;
  autoRequest: boolean;
  hasWritableActors: boolean;
  channel: 变量解析通道类型;
  modelSource: string;
  apiUrlPresent: boolean;
  modelName: string;
  activeProfilePresent: boolean;
  activeProfileMatchesFlat: boolean;
  selectedRoute: '数据库' | '自定义' | null;
  configSource: 游戏变量解析配置来源;
  skipReason: string;
}

/** 仅输出来源和完整性，不包含 Key、Key 长度或 Key 的任何派生值。 */
export function 构造变量配置握手诊断(参数: {
  聊天ID?: string;
  有可写演员: boolean;
  数据库可调用AI: boolean;
  跳过原因?: string;
}): 变量配置握手诊断 {
  const 定位 = 取ST定位();
  const MVU状态 = 读取MVU解析状态();
  const 路由 = 解析游戏变量请求路由(参数.数据库可调用AI);
  const MVU详情 = 读取MVU外置配置详情();
  const 配置 = 路由.配置;
  const skipReason =
    参数.跳过原因 ??
    (!参数.有可写演员
      ? 'no-writable-actors'
      : !MVU状态.内置解析
        ? 'internal-parser-disabled'
        : !路由.selectedRoute
          ? 'no-available-route'
          : '');
  return {
    chatId: 参数.聊天ID ?? '',
    stSource: 定位.来源,
    sameExtensionSettingsAsParentContext: Boolean(
      定位.父页上下文设置 && 定位.接口?.extensionSettings === 定位.父页上下文设置,
    ),
    mvuLoaded: MVU状态.已加载,
    externalMode: MVU状态.外置模式,
    internalParser: MVU状态.内置解析,
    autoRequest: MVU状态.自动请求,
    hasWritableActors: 参数.有可写演员,
    channel: 路由.通道,
    modelSource: 配置?.模型来源 ?? '未配置',
    apiUrlPresent: Boolean(配置?.api地址.trim()),
    modelName: 配置?.模型名称.trim() ?? '',
    activeProfilePresent: MVU详情.activeProfilePresent,
    activeProfileMatchesFlat: MVU详情.activeProfileMatchesFlat,
    selectedRoute: 路由.selectedRoute,
    configSource: 路由.配置来源,
    skipReason,
  };
}

export function 输出变量配置握手诊断(参数: {
  聊天ID?: string;
  有可写演员: boolean;
  数据库可调用AI: boolean;
  跳过原因?: string;
}): 变量配置握手诊断 {
  const 诊断 = 构造变量配置握手诊断(参数);
  console.info(
    '[人妻公寓·变量配置握手]\n' +
      Object.entries(诊断)
        .map(([键, 值]) => `${键}=${值 === null ? 'null' : String(值)}`)
        .join('\n'),
  );
  return 诊断;
}

export function 读取变量解析通道(): 变量解析通道类型 {
  return 读取游戏变量解析设置().通道;
}

export async function 写入变量解析通道(通道: 变量解析通道类型): Promise<boolean> {
  // 只提交游戏权威设置；MVU 当前方案不是内置解析的激活前置。
  return 提交变量解析设置事务({}, 通道, false);
}

/** 启动时把旧 MVU/界面偏好复制到游戏独立设置；迁移失败仍保留兼容读取，不阻断游戏。 */
export async function 迁移游戏变量解析设置(): Promise<boolean> {
  if (读取游戏变量解析持久设置()) return false;
  const 旧设置 = 读取游戏变量解析设置();
  return 提交变量解析设置事务({}, 旧设置.通道, false);
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

function 克隆并补丁MVU方案(原值: unknown, 补丁: MVU设置补丁): Record<string, unknown> | null {
  if (!是记录(原值)) return null;
  const 方案 = { ...原值 };
  const 内层键 = ['配置', 'config', 'api配置', '参数'].find(键 => 是记录(方案[键]));
  const 写入目标 = 内层键 ? { ...(方案[内层键] as Record<string, unknown>) } : 方案;
  for (const 键 of MVU外置配置键) if (补丁[键] !== undefined) 写入目标[键] = 补丁[键];
  if (内层键) 方案[内层键] = 写入目标;
  return 方案;
}

/**
 * 新版 MVU 可能同时保存扁平配置与“方案列表 + 当前方案”。这里只克隆并替换当前方案，
 * 保留其他方案与未知字段；结构无法识别时跳过镜像，游戏权威配置仍可独立工作。
 */
function 镜像MVU当前方案(配置: Record<string, unknown>, 补丁: MVU设置补丁): boolean {
  const 当前 = 配置.当前api方案;
  if (是记录(当前)) {
    const 新方案 = 克隆并补丁MVU方案(当前, 补丁);
    if (!新方案) return false;
    配置.当前api方案 = 新方案;
    return true;
  }

  const 列表 = 配置.api方案列表;
  if (Array.isArray(列表)) {
    let 索引 = typeof 当前 === 'number' && Number.isInteger(当前) ? 当前 : -1;
    if (索引 < 0 && typeof 当前 === 'string') {
      索引 = 列表.findIndex(项 => {
        if (!是记录(项)) return false;
        return ['名称', '方案名', 'name', 'id', 'key', 'uuid'].some(键 => String(项[键] ?? '') === 当前);
      });
    }
    if (索引 < 0 || 索引 >= 列表.length) return false;
    const 新方案 = 克隆并补丁MVU方案(列表[索引], 补丁);
    if (!新方案) return false;
    const 新列表 = [...列表];
    新列表[索引] = 新方案;
    配置.api方案列表 = 新列表;
    return true;
  }

  if (是记录(列表) && (typeof 当前 === 'string' || typeof 当前 === 'number')) {
    const key = String(当前);
    const 新方案 = 克隆并补丁MVU方案(列表[key], 补丁);
    if (!新方案) return false;
    配置.api方案列表 = { ...列表, [key]: 新方案 };
    return true;
  }
  return false;
}

function 应用MVU设置补丁(设置: MVU设置, 补丁: MVU设置补丁): void {
  if (补丁.更新方式 !== undefined) 设置.更新方式 = 补丁.更新方式;
  if (!MVU外置配置键.some(键 => 补丁[键] !== undefined)) return;
  const 原配置 = 设置.额外模型解析配置;
  const 配置 = 是记录(原配置) ? 原配置 : ((设置.额外模型解析配置 = {}) as Record<string, unknown>);
  for (const 键 of MVU外置配置键) if (补丁[键] !== undefined) 配置[键] = 补丁[键];
  镜像MVU当前方案(配置, 补丁);
}

function 合并游戏自定义API(
  原配置: MVU外置模型配置 | null,
  补丁: MVU设置补丁,
): MVU外置模型配置 | null {
  const 有补丁 = ['api地址', '密钥', '模型名称', '温度', 'top_p', '最大回复token数', '模型来源'].some(
    键 => 补丁[键 as keyof MVU设置补丁] !== undefined,
  );
  if (!原配置 && !有补丁) return null;
  return {
    模型来源: '自定义',
    api地址: 补丁.api地址 !== undefined ? 补丁.api地址 : 原配置?.api地址 ?? '',
    密钥: 补丁.密钥 !== undefined ? 补丁.密钥 : 原配置?.密钥 ?? '',
    模型名称: 补丁.模型名称 !== undefined ? 补丁.模型名称 : 原配置?.模型名称 ?? '',
    温度: 补丁.温度 !== undefined ? 补丁.温度 : 原配置?.温度,
    top_p: 补丁.top_p !== undefined ? 补丁.top_p : 原配置?.top_p,
    最大回复token数:
      补丁.最大回复token数 !== undefined ? 补丁.最大回复token数 : 原配置?.最大回复token数,
  };
}

/**
 * 游戏权威配置与兼容 MVU 镜像共用一次宿主保存。真正 await Promise 后才报告成功；
 * reject 时恢复游戏对象和 MVU 对象原引用。MVU 结构不兼容时只跳过镜像，不能阻断游戏配置。
 */
async function 提交变量解析设置事务(
  补丁: MVU设置补丁,
  通道: 变量解析通道类型,
  镜像MVU = true,
): Promise<boolean> {
  const 定位 = 取ST定位();
  const 根 = 定位.接口?.extensionSettings;
  if (!根 || !定位.保存所有者?.saveSettingsDebounced) {
    console.warn('[人妻公寓] 提交变量解析设置失败:缺少 extensionSettings 或 saveSettingsDebounced');
    return false;
  }

  const 游戏原值存在 = Object.prototype.hasOwnProperty.call(根, 游戏变量解析设置键);
  const 游戏原值 = 根[游戏变量解析设置键];
  const MVU快照 = 捕获MVU设置快照(根);
  const 当前 = 读取游戏变量解析设置();
  const 自定义API = 合并游戏自定义API(当前.自定义API, 补丁);
  const 新设置: 游戏变量解析持久设置 = {
    版本: 1,
    通道,
    ...(自定义API ? { 自定义API } : {}),
  };

  let 已镜像MVU = false;
  try {
    根[游戏变量解析设置键] = 新设置;
    if (镜像MVU) {
      try {
        应用MVU设置补丁(取或建MVU设置(根), { ...补丁, 模型来源: '自定义' });
        已镜像MVU = true;
      } catch (镜像错误) {
        恢复MVU设置快照(根, MVU快照);
        console.warn('[人妻公寓] 游戏变量 API 已准备保存，但 MVU 兼容镜像失败；内置解析不受影响:', 镜像错误);
      }
    }
    await 等待宿主设置保存(定位);
    // 旧版本只读界面偏好中的通道；作为兼容镜像尽力写入，失败不影响已经持久化的权威设置。
    if (!写界面偏好({ 变量解析通道: 通道 })) {
      console.warn('[人妻公寓] 游戏变量 API 已保存，但旧界面偏好通道镜像失败。');
    }
    return true;
  } catch (e) {
    if (游戏原值存在) 根[游戏变量解析设置键] = 游戏原值;
    else delete 根[游戏变量解析设置键];
    if (已镜像MVU) 恢复MVU设置快照(根, MVU快照);
    console.warn('[人妻公寓] 提交变量解析设置失败，已回滚:', e);
    return false;
  }
}

/** 自定义 API 表单的唯一提交入口：游戏权威配置先落地，MVU 只作兼容镜像。 */
export async function 保存自定义变量解析设置(补丁: Omit<MVU设置补丁, '模型来源'>): Promise<boolean> {
  return 提交变量解析设置事务({ ...补丁, 模型来源: '自定义' }, '自定义', true);
}

/**
 * 游戏设置页写穿 MVU 持久层（extensionSettings + saveSettingsDebounced）。
 * 玩家从此不必打开 MVU 变量框架面板。注意 MVU 运行时的 Pinia 副本改不动：
 * 游戏自己的内置解析每回合都读持久层、立即生效；MVU 插件自身行为要刷新页面才跟上。
 * mvu_settings 缺失时按需创建——MVU 的 zod schema 各字段均有默认值，残缺对象能被正常补全。
 */
export async function 写入MVU设置(补丁: MVU设置补丁): Promise<boolean> {
  const 定位 = 取ST定位();
  const 根 = 定位.接口?.extensionSettings;
  if (!根 || !定位.保存所有者?.saveSettingsDebounced) {
    console.warn('[人妻公寓] 写入MVU设置失败:拿不到 extensionSettings 或 saveSettingsDebounced');
    return false;
  }
  const 快照 = 捕获MVU设置快照(根);
  try {
    应用MVU设置补丁(取或建MVU设置(根), 补丁);
    await 等待宿主设置保存(定位);
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
export async function 确保MVU默认外置解析(): Promise<boolean> {
  try {
    if (读界面偏好()[MVU外置默认V080初始化键] === true) return false;
    const 设置 = 读MVU设置();
    if (设置?.更新方式 === '额外模型解析') {
      写界面偏好({ [MVU外置默认V080初始化键]: true });
      return false;
    }
    const 成功 = await 写入MVU设置({ 更新方式: '额外模型解析' });
    if (成功) 写界面偏好({ [MVU外置默认V080初始化键]: true });
    return 成功;
  } catch {
    return false;
  }
}
