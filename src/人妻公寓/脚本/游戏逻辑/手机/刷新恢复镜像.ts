/**
 * 微信刷新恢复镜像。
 *
 * `_微信` 的正式真值仍在 Tavern Helper chat variables；本模块只保存同一浏览器会话内的
 * 紧急副本，专门兜住宿主整聊保存超时/失败后立刻刷新造成的“聊天变量回到旧版本”。
 * 副本按聊天 metadata.integrity（优先）或角色+聊天 ID 隔离，并带单调修订号；正常
 * `_微信`、显式重开墓碑、回档/删楼后的裁剪都会争取更高修订，旧时间线不能靠刷新复活。
 */

export const 微信持久修订字段 = '__rqgy微信持久修订';

const 刷新镜像版本 = 2 as const;
const 会话存储键 = '人妻公寓_微信刷新恢复_v2';
const 宿主镜像字段 = '__rqgyWechatRefreshRecoveryV2';
const 最多保留聊天数 = 4;

type 手机宿主上下文 = {
  getContext?: () => 手机宿主上下文 | null | undefined;
  chatMetadata?: Record<string, unknown>;
  chatId?: string | number | null;
  characterId?: string | number | null;
  groupId?: string | number | null;
  name2?: string | null;
};

export interface 微信刷新镜像包 {
  版本: typeof 刷新镜像版本;
  聊天身份: string;
  修订: number;
  写入时间: number;
  /** 镜像创建时已经确认存活的酒馆末楼；后续正常加楼仍可恢复，删到此楼之前则拒绝。 */
  锚楼: number;
  /** 镜像创建时的游戏绝对时段；回到更早世界时间时不得拿未来水位覆盖当前分支。 */
  锚绝对时段: number;
  /** 0..锚楼 的稳定分支指纹，只含角色侧、swipe 与游戏令牌，不含刷新会改写的正文/日期/头像。 */
  分支指纹: string;
  清空: boolean;
  微信: Record<string, unknown> | null;
}

export interface 微信刷新恢复选择 {
  值: unknown;
  使用镜像: boolean;
  当前修订: number;
  镜像修订: number;
  聊天身份: string;
}

type 手机恢复宿主窗口 = Window & {
  [宿主镜像字段]?: Record<string, 微信刷新镜像包>;
};

let 已警告会话镜像写入失败 = false;

function 是普通对象(值: unknown): 值 is Record<string, unknown> {
  if (值 === null || typeof 值 !== 'object' || Array.isArray(值)) return false;
  const 原型 = Object.getPrototypeOf(值);
  return 原型 === Object.prototype || 原型 === null;
}

function 安全修订(值: unknown): number {
  return typeof 值 === 'number' && Number.isSafeInteger(值) && 值 >= 0 ? 值 : 0;
}

function JSON克隆<T>(值: T): T | null {
  try {
    return JSON.parse(JSON.stringify(值)) as T;
  } catch {
    return null;
  }
}

function 安全非负整数(值: unknown): number | null {
  return typeof 值 === 'number' && Number.isSafeInteger(值) && 值 >= 0 ? 值 : null;
}

function 当前聊天消息(): readonly unknown[] {
  try {
    const 聊天 = (SillyTavern as unknown as { chat?: unknown }).chat;
    return Array.isArray(聊天) ? 聊天 : [];
  } catch {
    return [];
  }
}

function 规范用户侧(值: unknown): unknown {
  return 值 === undefined || 值 === null || 值 === false ? false : 值;
}

function 规范SwipeId(值: unknown): unknown {
  return 值 === undefined || 值 === null ? 0 : 值;
}

function 稳定游戏令牌(消息: unknown): [string, string][] {
  if (!是普通对象(消息) || !是普通对象(消息.extra)) return [];
  return Object.entries(消息.extra)
    .filter(
      ([键, 值]) =>
        键.startsWith('_rqgy') &&
        键.includes('令牌') &&
        (typeof 值 === 'string' || typeof 值 === 'number' || typeof 值 === 'boolean'),
    )
    .map(([键, 值]) => [键, String(值)] as [string, string])
    .sort(([a], [b]) => a.localeCompare(b));
}

function 推进指纹哈希(哈希: number, 文本: string, 质数: number): number {
  let 结果 = 哈希 >>> 0;
  for (let i = 0; i < 文本.length; i += 1) {
    结果 ^= 文本.charCodeAt(i);
    结果 = Math.imul(结果, 质数) >>> 0;
  }
  return 结果;
}

/**
 * 计算可跨刷新稳定、但会随真实 swipe/删楼重建改变的前缀指纹。正文、send_date、角色名和头像
 * 会被宿主正则/宏/身份归一改写，绝不能再次被纳入刷新恢复硬门；游戏令牌只在存在时增强身份。
 */
export function 计算微信刷新分支指纹(消息们: readonly unknown[], 截止楼: number): string {
  const 末 = Math.min(Math.max(-1, Math.trunc(截止楼)), 消息们.length - 1);
  let 哈希一 = 0x811c9dc5;
  let 哈希二 = 0x9e3779b9;
  for (let 楼 = 0; 楼 <= 末; 楼 += 1) {
    const 消息 = 消息们[楼];
    const 身份 = 是普通对象(消息)
      ? [规范用户侧(消息.is_user), 规范SwipeId(消息.swipe_id), 稳定游戏令牌(消息)]
      : [typeof 消息, 规范SwipeId(undefined), []];
    const 片段 = `${楼}:${JSON.stringify(身份)};`;
    哈希一 = 推进指纹哈希(哈希一, 片段, 0x01000193);
    哈希二 = 推进指纹哈希(哈希二, 片段, 0x85ebca6b);
  }
  return `${末 + 1}:${哈希一.toString(36)}:${哈希二.toString(36)}`;
}

function 创建当前刷新时间线锚(当前绝对时段: number): Pick<微信刷新镜像包, '锚楼' | '锚绝对时段' | '分支指纹'> | null {
  const 时段 = 安全非负整数(当前绝对时段);
  const 消息们 = 当前聊天消息();
  const 锚楼 = 消息们.length - 1;
  if (时段 === null || 锚楼 < 0) return null;
  return {
    锚楼,
    锚绝对时段: 时段,
    分支指纹: 计算微信刷新分支指纹(消息们, 锚楼),
  };
}

function 镜像属于当前时间线(镜像: 微信刷新镜像包, 当前绝对时段: number): boolean {
  const 时段 = 安全非负整数(当前绝对时段);
  const 消息们 = 当前聊天消息();
  if (时段 === null || 时段 < 镜像.锚绝对时段 || 消息们.length <= 镜像.锚楼) return false;
  return 计算微信刷新分支指纹(消息们, 镜像.锚楼) === 镜像.分支指纹;
}

function 宿主窗口(): 手机恢复宿主窗口 | null {
  try {
    return (window.parent ?? window) as 手机恢复宿主窗口;
  } catch {
    try {
      return window as 手机恢复宿主窗口;
    } catch {
      return null;
    }
  }
}

function 收集宿主上下文(): 手机宿主上下文[] {
  const 候选 = new Set<手机宿主上下文>();
  const 加入 = (值: unknown): void => {
    if ((typeof 值 === 'object' && 值 !== null) || typeof 值 === 'function') 候选.add(值 as 手机宿主上下文);
  };
  try {
    加入(SillyTavern);
  } catch {
    /* 极旧运行时可能未注入。 */
  }
  try {
    加入((globalThis as unknown as { SillyTavern?: unknown }).SillyTavern);
  } catch {
    /* 全局包装不可读时继续。 */
  }
  try {
    加入((window.parent as unknown as { SillyTavern?: unknown })?.SillyTavern);
  } catch {
    /* sandbox/跨域时只使用 iframe 注入对象。 */
  }

  const 结果: 手机宿主上下文[] = [];
  for (const 候选项 of 候选) {
    let 上下文 = 候选项;
    try {
      上下文 = 候选项.getContext?.() ?? 候选项;
    } catch {
      上下文 = 候选项;
    }
    结果.push(上下文);
  }
  return 结果;
}

/**
 * 刷新恢复只能绑定稳定聊天身份。SillyTavern 的 chat metadata.integrity 是每个聊天文件
 * 自带 UUID；不可用时才退化为“角色/群 + 当前聊天 ID”。没有稳定 ID 时宁可不恢复。
 */
export function 当前微信持久身份(聊天ID: string): string {
  const 上下文们 = 收集宿主上下文();
  for (const 上下文 of 上下文们) {
    const integrity = 上下文.chatMetadata?.integrity;
    if (typeof integrity === 'string' && integrity.trim()) {
      // 复制聊天文件或切聊加载窗口里，integrity 可能暂时重复/滞后；真实宿主聊天 ID 可用时
      // 必须再组成联合身份。匿名对象令牌无法跨完整刷新稳定，才只退化使用 integrity。
      const 稳定聊天ID = 聊天ID && !聊天ID.startsWith('object:') ? 聊天ID : '';
      return `integrity:${integrity.trim()}${稳定聊天ID ? `:chat:${稳定聊天ID}` : ''}`;
    }
  }
  if (!聊天ID) return '';
  for (const 上下文 of 上下文们) {
    const 所有者 =
      上下文.groupId !== undefined && 上下文.groupId !== null
        ? `group:${String(上下文.groupId)}`
        : 上下文.characterId !== undefined && 上下文.characterId !== null
          ? `character:${String(上下文.characterId)}`
          : 上下文.name2
            ? `name:${上下文.name2}`
            : 'unknown';
    return `chat:${所有者}:${聊天ID}`;
  }
  return `chat:unknown:${聊天ID}`;
}

export function 读取微信持久修订(微信: unknown): number {
  return 是普通对象(微信) ? 安全修订(微信[微信持久修订字段]) : 0;
}

function 解析镜像包(值: unknown, 聊天身份: string): 微信刷新镜像包 | null {
  if (!是普通对象(值)) return null;
  if (值.版本 !== 刷新镜像版本 || 值.聊天身份 !== 聊天身份) return null;
  const 修订 = 安全修订(值.修订);
  const 写入时间 = 安全修订(值.写入时间);
  const 锚楼 = 安全非负整数(值.锚楼);
  const 锚绝对时段 = 安全非负整数(值.锚绝对时段);
  const 分支指纹 = typeof 值.分支指纹 === 'string' ? 值.分支指纹 : '';
  const 清空 = 值.清空 === true;
  if (
    修订 <= 0 ||
    锚楼 === null ||
    锚绝对时段 === null ||
    !分支指纹 ||
    (清空 ? 值.微信 !== null : !是普通对象(值.微信))
  )
    return null;
  const 微信 = 清空 ? null : JSON克隆(值.微信 as Record<string, unknown>);
  if (!清空 && !微信) return null;
  return {
    版本: 刷新镜像版本,
    聊天身份,
    修订,
    写入时间,
    锚楼,
    锚绝对时段,
    分支指纹,
    清空,
    微信,
  };
}

function 宿主镜像集合(): Record<string, 微信刷新镜像包> {
  const root = 宿主窗口();
  if (!root) return Object.create(null) as Record<string, 微信刷新镜像包>;
  const 已有 = root[宿主镜像字段];
  if (已有 && typeof 已有 === 'object' && !Array.isArray(已有)) return 已有;
  const 新建 = Object.create(null) as Record<string, 微信刷新镜像包>;
  root[宿主镜像字段] = 新建;
  return 新建;
}

function 读取会话镜像集合(): Record<string, unknown> {
  try {
    const raw = 宿主窗口()?.sessionStorage?.getItem(会话存储键);
    if (!raw) return Object.create(null) as Record<string, unknown>;
    const parsed = JSON.parse(raw) as unknown;
    return 是普通对象(parsed) ? parsed : (Object.create(null) as Record<string, unknown>);
  } catch {
    return Object.create(null) as Record<string, unknown>;
  }
}

function 写会话镜像集合(集合: Record<string, 微信刷新镜像包>, 当前聊天身份: string): boolean {
  const root = 宿主窗口();
  if (!root?.sessionStorage) return false;
  const 排序后 = Object.entries(集合)
    .sort(([, a], [, b]) => b.写入时间 - a.写入时间)
    .slice(0, 最多保留聊天数);
  const 精简 = Object.fromEntries(排序后) as Record<string, 微信刷新镜像包>;
  try {
    root.sessionStorage.setItem(会话存储键, JSON.stringify(精简));
    return true;
  } catch {
    // 旧聊天副本过大时只保留当前聊天再试一次；宿主内存镜像仍可兜住客户端 iframe 刷新。
    try {
      const 当前 = 集合[当前聊天身份];
      if (!当前) return false;
      root.sessionStorage.setItem(会话存储键, JSON.stringify({ [当前聊天身份]: 当前 }));
      return true;
    } catch (error) {
      if (!已警告会话镜像写入失败) {
        已警告会话镜像写入失败 = true;
        console.warn('[人妻公寓·手机] 微信刷新恢复副本无法写入 sessionStorage；本次仍保留宿主内存镜像。', error);
      }
      return false;
    }
  }
}

function 较新镜像(a: 微信刷新镜像包 | null, b: 微信刷新镜像包 | null): 微信刷新镜像包 | null {
  if (!a) return b;
  if (!b) return a;
  if (a.修订 !== b.修订) return a.修订 > b.修订 ? a : b;
  return a.写入时间 >= b.写入时间 ? a : b;
}

function 读取微信刷新镜像候选(聊天ID: string): 微信刷新镜像包 | null {
  const 聊天身份 = 当前微信持久身份(聊天ID);
  if (!聊天身份) return null;
  const 宿主集合 = 宿主镜像集合();
  const fromHost = 解析镜像包(宿主集合[聊天身份], 聊天身份);
  const 会话集合 = 读取会话镜像集合();
  const fromSession = 解析镜像包(会话集合[聊天身份], 聊天身份);
  const 选择 = 较新镜像(fromHost, fromSession);
  if (选择) 宿主集合[聊天身份] = 选择;
  return 选择;
}

export function 读取微信刷新镜像(聊天ID: string, 当前绝对时段: number): 微信刷新镜像包 | null {
  const 候选 = 读取微信刷新镜像候选(聊天ID);
  return 候选 && 镜像属于当前时间线(候选, 当前绝对时段) ? 候选 : null;
}

/** 当前 `_微信` 真值发生变化时，在变量回调内取得高于现有恢复副本的单调修订。 */
export function 推进微信持久修订(微信: Record<string, unknown>, 聊天ID: string, 当前绝对时段: number): number {
  // 修订号只负责同聊天的先后，不负责授权恢复；即使旧镜像属于已经裁掉的未来时间线，
  // 新分支也要越过它再覆盖同一存储槽，避免 sessionStorage 中的较大旧号重新获胜。
  void 当前绝对时段;
  const 镜像修订 = 读取微信刷新镜像候选(聊天ID)?.修订 ?? 0;
  const 当前修订 = 读取微信持久修订(微信);
  const 下一修订 = Math.max(镜像修订, 当前修订) + 1;
  微信[微信持久修订字段] = 下一修订;
  return 下一修订;
}

function 写入镜像包(包: 微信刷新镜像包): boolean {
  const 宿主集合 = 宿主镜像集合();
  const 已有宿主 = 解析镜像包(宿主集合[包.聊天身份], 包.聊天身份);
  const 会话原 = 读取会话镜像集合();
  const 会话合法: Record<string, 微信刷新镜像包> = Object.create(null) as Record<string, 微信刷新镜像包>;
  for (const [身份, 值] of Object.entries(会话原)) {
    const 合法 = 解析镜像包(值, 身份);
    if (合法) 会话合法[身份] = 合法;
  }

  const 已有会话 = 解析镜像包(会话合法[包.聊天身份], 包.聊天身份);
  const 已有最新 = 较新镜像(已有宿主, 已有会话);
  // 修订号是同一聊天的状态版本，而不是“最后调用时间”。较早事务可能在回档、清空或
  // 新消息提交之后才迟到执行镜像写入；即使它拥有更晚的 Date.now()，也绝不能把存储槽
  // 从较高修订降回旧状态。同修订也只认最先落下的真值，并借本次调用修复另一存储通道。
  const 应保存 = 已有最新 && 已有最新.修订 >= 包.修订 ? 已有最新 : 包;
  宿主集合[包.聊天身份] = 应保存;
  会话合法[包.聊天身份] = 应保存;
  return 写会话镜像集合(会话合法, 包.聊天身份);
}

/** 把已经带修订号的 `_微信` 快照写入宿主内存 + sessionStorage。 */
export function 写入微信刷新镜像(聊天ID: string, 微信: unknown, 当前绝对时段: number): boolean {
  if (!是普通对象(微信)) return false;
  const 聊天身份 = 当前微信持久身份(聊天ID);
  const 时间线锚 = 创建当前刷新时间线锚(当前绝对时段);
  if (!聊天身份 || !时间线锚) return false;
  const 修订 = 读取微信持久修订(微信);
  if (修订 <= 0) return false;
  const 副本 = JSON克隆(微信);
  if (!副本 || !是普通对象(副本)) return false;
  const 包: 微信刷新镜像包 = {
    版本: 刷新镜像版本,
    聊天身份,
    修订,
    写入时间: Date.now(),
    ...时间线锚,
    清空: false,
    微信: 副本,
  };
  return 写入镜像包(包);
}

/**
 * 重开一局的空库墓碑。即便宿主随后保存失败、刷新又载回旧 `_微信`，更高修订的墓碑
 * 也会阻止旧聊天复活；新局第一次真实手机写入会再取得更高修订并覆盖墓碑。
 */
export function 写入微信清空镜像(聊天ID: string, 当前绝对时段: number): number {
  const 聊天身份 = 当前微信持久身份(聊天ID);
  const 时间线锚 = 创建当前刷新时间线锚(当前绝对时段);
  if (!聊天身份 || !时间线锚) return 0;
  const 下一修订 = (读取微信刷新镜像候选(聊天ID)?.修订 ?? 0) + 1;
  写入镜像包({
    版本: 刷新镜像版本,
    聊天身份,
    修订: 下一修订,
    写入时间: Date.now(),
    ...时间线锚,
    清空: true,
    微信: null,
  });
  return 下一修订;
}

/**
 * 选择本次读取/写入应采用的原始库。只有同一聊天、同一时间线且镜像修订严格更新时
 * 才恢复。旧 `_微信 = null` 也可能只是更早保存基线；真正的有意清空由更高修订墓碑表达。
 */
export function 选择微信刷新恢复值(
  当前值: unknown,
  当前键存在: boolean,
  聊天ID: string,
  当前绝对时段: number,
): 微信刷新恢复选择 {
  const 聊天身份 = 当前微信持久身份(聊天ID);
  const 当前修订 = 读取微信持久修订(当前值);
  const 镜像 = 读取微信刷新镜像(聊天ID, 当前绝对时段);
  if (!聊天身份 || !镜像) {
    return { 值: 当前值, 使用镜像: false, 当前修订, 镜像修订: 0, 聊天身份 };
  }

  // `_微信:null` 也可能只是宿主上一次成功保存的旧基线。真正的重开/清空由更高修订的
  // 清空墓碑表达；因此只要同聊天、同时间线镜像更高，就允许完整副本覆盖旧 null。
  const 当前可用 = 是普通对象(当前值) || (当前键存在 && 当前值 === null);
  const 应使用镜像 = !当前可用 || 镜像.修订 > 当前修订;
  if (!应使用镜像) {
    return { 值: 当前值, 使用镜像: false, 当前修订, 镜像修订: 镜像.修订, 聊天身份 };
  }
  return {
    值: 镜像.清空 ? null : JSON克隆(镜像.微信),
    使用镜像: true,
    当前修订,
    镜像修订: 镜像.修订,
    聊天身份,
  };
}
