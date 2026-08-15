/**
 * 数据库剧情规划桥。
 *
 * 数据库的 TavernHelper.generate 钩子会主动跳过流式请求；本卡正文又必须流式生成。
 * 因此这里先用一份不带卡片 injects 的非流式参数触发数据库官方规划，并临时截住
 * 它即将发出的正文请求；规划改写后的 user_input 再交还给本卡原有的流式生成链。
 */

type 生成参数 = Parameters<typeof generate>[0];
type 生成结果 = Awaited<ReturnType<typeof generate>>;
type 扩展生成参数 = 生成参数 & {
  _qrf_processed_by_hook?: boolean;
  automatic_trigger?: boolean;
  [键: string]: unknown;
};
type 生成函数 = (参数: 扩展生成参数) => Promise<生成结果>;

type 未知对象 = Record<PropertyKey, unknown>;

interface 数据库运行时 {
  作用域: 未知对象;
  助手: 未知对象;
  包装生成: 生成函数;
  原始生成: 生成函数;
}

export interface 数据库剧情规划桥选项 {
  启用: boolean;
  根窗口?: unknown;
  规划输入?: string;
  /** 官方规划无响应时释放正文链；迟到请求仍会被身份拦截器吞掉。 */
  规划超时毫秒?: number;
  调用正文?: (参数: 生成参数) => Promise<生成结果>;
  规划开始?: () => void;
  正文开始?: (已规划: boolean) => void;
  继续前确认?: () => void;
  请求中止规划?: () => void;
}

export interface 数据库剧情规划上下文 {
  日期: string;
  时段: string;
  地点: string;
  当前角色: string[];
  焦点角色: string[];
}

interface 活跃规划 {
  已取消: boolean;
  已请求中止: boolean;
  触发取消: () => void;
  请求中止: () => void;
}

interface 规划请求保护器 {
  作用域: 未知对象;
  助手: 未知对象;
  原始生成: 生成函数;
  原始描述: PropertyDescriptor | undefined;
  代理生成: 生成函数;
  目标: Map<扩展生成参数, () => void>;
}

const 运行时锁键 = '__rqgy_database_plot_planning_lock__';
const 规划请求保护器们 = new WeakMap<未知对象, 规划请求保护器>();
const 默认规划超时毫秒 = 90_000;
let 当前活跃规划: 活跃规划 | null = null;

function 是对象(值: unknown): 值 is 未知对象 {
  return (typeof 值 === 'object' && 值 !== null) || typeof 值 === 'function';
}

function 安全读取(对象: unknown, 键: PropertyKey): unknown {
  if (!是对象(对象)) return undefined;
  try {
    return 对象[键];
  } catch {
    return undefined;
  }
}

function 窗口候选(根窗口: unknown): 未知对象[] {
  const 待检查: unknown[] = [根窗口];
  const 已检查 = new Set<未知对象>();
  const 结果: 未知对象[] = [];

  while (待检查.length > 0 && 已检查.size < 128) {
    const 当前 = 待检查.shift();
    if (!是对象(当前) || 已检查.has(当前)) continue;
    已检查.add(当前);
    结果.push(当前);

    for (const 键 of ['parent', 'top', 'opener'] as const) {
      const 相邻 = 安全读取(当前, 键);
      if (是对象(相邻) && !已检查.has(相邻)) 待检查.push(相邻);
    }

    const 子窗口集合 = 安全读取(当前, 'frames');
    const 长度值 = 安全读取(子窗口集合, 'length');
    const 长度 = typeof 长度值 === 'number' && Number.isFinite(长度值) ? Math.min(Math.max(0, 长度值), 128) : 0;
    for (let i = 0; i < 长度; i += 1) {
      const 子窗口 = 安全读取(子窗口集合, i);
      if (是对象(子窗口) && !已检查.has(子窗口)) 待检查.push(子窗口);
    }
  }

  return 结果;
}

function 查找数据库运行时(根窗口: unknown): 数据库运行时 | null {
  for (const 作用域 of 窗口候选(根窗口)) {
    const 助手 = 安全读取(作用域, 'TavernHelper');
    const 包装生成 = 安全读取(助手, 'generate');
    const 原始生成 = 安全读取(作用域, 'original_TavernHelper_generate_ACU');
    if (!是对象(助手) || typeof 包装生成 !== 'function' || typeof 原始生成 !== 'function') continue;
    if (包装生成 === 原始生成) continue;
    return {
      作用域,
      助手,
      包装生成: 包装生成 as 生成函数,
      原始生成: 原始生成 as 生成函数,
    };
  }
  return null;
}

function 可访问文档列表(根窗口: unknown): Document[] {
  const 文档 = new Set<Document>();
  for (const 候选 of 窗口候选(根窗口)) {
    const 当前文档 = 安全读取(候选, 'document');
    if (当前文档 && typeof (当前文档 as Document).querySelector === 'function') 文档.add(当前文档 as Document);
  }
  return [...文档];
}

function 创建官方中止请求(
  根窗口: unknown,
  是否仍活跃: () => boolean,
): {
  请求: () => void;
  清理: () => void;
} {
  const 定时器 = new Set<ReturnType<typeof setTimeout>>();
  let 已点中 = false;

  const 尝试点击 = () => {
    if (已点中 || !是否仍活跃()) return;
    for (const 文档 of 可访问文档列表(根窗口)) {
      const 按钮 = 文档.querySelector<HTMLElement>('.qrf-abort-btn');
      if (!按钮) continue;
      已点中 = true;
      按钮.click();
      return;
    }
  };

  return {
    请求: () => {
      尝试点击();
      if (已点中) return;
      for (const 延迟 of [0, 80, 240, 500]) {
        const 定时器id = setTimeout(() => {
          定时器.delete(定时器id);
          尝试点击();
        }, 延迟);
        定时器.add(定时器id);
      }
    },
    清理: () => {
      for (const 定时器id of 定时器) clearTimeout(定时器id);
      定时器.clear();
    },
  };
}

function 监听官方中止按钮(根窗口: unknown, 回调: () => void): () => void {
  const 解绑: Array<() => void> = [];
  const 监听 = (事件: Event) => {
    const 目标 = 事件.target;
    const closest = 安全读取(目标, 'closest');
    if (typeof closest !== 'function') return;
    try {
      if (Reflect.apply(closest, 目标, ['.qrf-abort-btn'])) 回调();
    } catch {
      /* 跨 iframe 的非元素事件目标无需处理 */
    }
  };
  for (const 文档 of 可访问文档列表(根窗口)) {
    文档.addEventListener('click', 监听, true);
    解绑.push(() => 文档.removeEventListener('click', 监听, true));
  }
  return () => 解绑.forEach(执行 => 执行());
}

function 恢复属性(对象: 未知对象, 键: PropertyKey, 临时值: unknown, 原描述: PropertyDescriptor | undefined): void {
  if (安全读取(对象, 键) !== 临时值) return;
  try {
    if (原描述) Object.defineProperty(对象, 键, 原描述);
    else delete 对象[键];
  } catch (错误) {
    console.warn(`[人妻公寓] 恢复数据库规划桥临时属性 ${String(键)} 失败:`, 错误);
  }
}

/**
 * 官方包装器可能在调用返回、取消或超时很久以后才读取原始生成器。保护器因此以规划参数
 * 对象身份截获目标请求，并一直保留到包装器真正结算；同期其他插件的请求照常转发。
 */
function 取得规划请求保护器(运行时: 数据库运行时): 规划请求保护器 {
  const 已有 = 规划请求保护器们.get(运行时.作用域);
  if (已有) return 已有;

  const 原始描述 = Object.getOwnPropertyDescriptor(运行时.作用域, 'original_TavernHelper_generate_ACU');
  const 目标 = new Map<扩展生成参数, () => void>();
  const 保护器 = {} as 规划请求保护器;
  const 代理生成: 生成函数 = async 被调用参数 => {
    const 记录截获 = 目标.get(被调用参数);
    if (记录截获) {
      记录截获();
      return '';
    }
    return Reflect.apply(运行时.原始生成, 运行时.助手, [被调用参数]);
  };
  Object.assign(保护器, {
    作用域: 运行时.作用域,
    助手: 运行时.助手,
    原始生成: 运行时.原始生成,
    原始描述,
    代理生成,
    目标,
  });
  Object.defineProperty(运行时.作用域, 'original_TavernHelper_generate_ACU', {
    configurable: true,
    enumerable: 原始描述?.enumerable ?? true,
    value: 代理生成,
    writable: true,
  });
  规划请求保护器们.set(运行时.作用域, 保护器);
  return 保护器;
}

function 注册规划请求保护(运行时: 数据库运行时, 参数: 扩展生成参数, 记录截获: () => void): () => void {
  const 保护器 = 取得规划请求保护器(运行时);
  保护器.目标.set(参数, 记录截获);
  return () => {
    保护器.目标.delete(参数);
    if (保护器.目标.size > 0) return;
    恢复属性(保护器.作用域, 'original_TavernHelper_generate_ACU', 保护器.代理生成, 保护器.原始描述);
    规划请求保护器们.delete(保护器.作用域);
  };
}

function 默认根窗口(): unknown {
  return typeof window === 'undefined' ? undefined : window;
}

function 默认正文调用(参数: 生成参数): Promise<生成结果> {
  return generate(参数);
}

/**
 * 官方时间召回只把 user_input 当作本轮检索锚；卡内输入没有酒馆原生消息附带的场景信息，
 * 因此显式补齐游戏历与人物范围。游戏采用“第 N 天”而非公历，不能伪造 YYYY-MM-DD。
 */
export function 构造数据库剧情规划输入(行动: string, 上下文: 数据库剧情规划上下文): string {
  const 当前角色 = [
    ...new Set(
      上下文.当前角色
        .map(String)
        .map(值 => 值.trim())
        .filter(Boolean),
    ),
  ];
  const 焦点角色 = [
    ...new Set(
      上下文.焦点角色
        .map(String)
        .map(值 => 值.trim())
        .filter(Boolean),
    ),
  ];
  return [
    '<rqgy_recall_context>',
    `当前游戏日期=${上下文.日期}`,
    `当前游戏时段=${上下文.时段}`,
    `当前地点=${上下文.地点 || '公寓公共区域'}`,
    `当前在场角色=${当前角色.length ? 当前角色.join('、') : '无明确角色'}`,
    `本轮焦点角色=${焦点角色.length ? 焦点角色.join('、') : '无明确焦点'}`,
    '时间口径=只使用“第N天+时段”的游戏历判断先后；历史纪要中的日期均是过去状态，不得覆盖当前时间。',
    '人物边界=优先召回当前在场或焦点角色及其共同经历；其他角色的记忆只有与本轮存在明确因果、承诺、线索或关系链时才可采用，禁止仅因同地点或同类关键词混入。',
    '知情边界=跨角色旧事即使被召回也只供叙事连续性；当前角色未亲历、未目击且未被转告的内容，不得写成该角色已经知道。',
    '</rqgy_recall_context>',
    '<rqgy_player_action>',
    行动,
    '</rqgy_player_action>',
  ].join('\n');
}

/**
 * 取消正在等待的数据库官方剧情规划。
 * 返回 true 表示取消权已由规划桥接管，调用方不应提前结束自己的等待 Promise。
 */
export function 取消当前数据库剧情规划(): boolean {
  const 活跃规划 = 当前活跃规划;
  if (!活跃规划) return false;
  活跃规划.触发取消();
  return true;
}

export async function 经数据库剧情规划生成(参数: 生成参数, 选项: 数据库剧情规划桥选项): Promise<生成结果> {
  const 调用正文 = 选项.调用正文 ?? 默认正文调用;
  const 根窗口 = 选项.根窗口 ?? 默认根窗口();
  const 直接生成 = async () => {
    选项.继续前确认?.();
    选项.正文开始?.(false);
    return 调用正文(参数);
  };

  if (!选项.启用) return 直接生成();
  const 运行时 = 查找数据库运行时(根窗口);
  if (!运行时 || 当前活跃规划 || 安全读取(运行时.作用域, 运行时锁键)) return 直接生成();

  const 规划参数: 扩展生成参数 = {
    user_input: 选项.规划输入 ?? 参数.user_input,
    should_stream: false,
  };
  let 原锁描述: PropertyDescriptor | undefined;
  const 锁 = Object.freeze({ 参数: 规划参数 });
  let 已截获目标请求 = false;
  let 释放规划请求保护: () => void = () => undefined;

  try {
    原锁描述 = Object.getOwnPropertyDescriptor(运行时.作用域, 运行时锁键);
    Object.defineProperty(运行时.作用域, 运行时锁键, {
      configurable: true,
      enumerable: false,
      value: 锁,
      writable: true,
    });
    释放规划请求保护 = 注册规划请求保护(运行时, 规划参数, () => {
      已截获目标请求 = true;
    });
  } catch (错误) {
    释放规划请求保护();
    恢复属性(运行时.作用域, 运行时锁键, 锁, 原锁描述);
    console.warn('[人妻公寓] 数据库剧情规划桥无法安装，已降级为原流式正文:', 错误);
    return 直接生成();
  }

  let 释放取消门: () => void = () => undefined;
  const 取消门 = new Promise<'取消'>(resolve => {
    释放取消门 = () => resolve('取消');
  });
  const 活跃规划: 活跃规划 = {
    已取消: false,
    已请求中止: false,
    触发取消: () => undefined,
    请求中止: () => undefined,
  };
  let 底层已结算 = false;
  let 清理中止重试: () => void = () => undefined;
  if (选项.请求中止规划) {
    活跃规划.请求中止 = 选项.请求中止规划;
  } else {
    const 官方中止 = 创建官方中止请求(根窗口, () => !底层已结算);
    活跃规划.请求中止 = 官方中止.请求;
    清理中止重试 = 官方中止.清理;
  }
  const 请求中止一次 = () => {
    if (活跃规划.已请求中止) return;
    活跃规划.已请求中止 = true;
    活跃规划.请求中止();
  };
  活跃规划.触发取消 = () => {
    if (活跃规划.已取消) return;
    活跃规划.已取消 = true;
    请求中止一次();
    释放取消门();
  };

  let 解绑中止监听: () => void = () => undefined;
  let 超时定时器: ReturnType<typeof setTimeout> | undefined;
  let 已完成迟到清理 = false;
  let 底层已启动 = false;
  let 已规划结果 = false;
  let 跳过重复规划 = false;
  const 完成迟到清理 = () => {
    if (已完成迟到清理) return;
    已完成迟到清理 = true;
    底层已结算 = true;
    清理中止重试();
    释放规划请求保护();
    恢复属性(运行时.作用域, 运行时锁键, 锁, 原锁描述);
  };
  try {
    当前活跃规划 = 活跃规划;
    解绑中止监听 = 监听官方中止按钮(根窗口, 活跃规划.触发取消);
    选项.规划开始?.();

    底层已启动 = true;
    const 底层规划 = Promise.resolve().then(() => Reflect.apply(运行时.包装生成, 运行时.助手, [规划参数]));
    void 底层规划.then(
      () => 完成迟到清理(),
      () => 完成迟到清理(),
    );
    const 底层结果 = 底层规划.then(
      () => ({ 类型: '完成' as const }),
      错误 => ({ 类型: '失败' as const, 错误 }),
    );
    const 超时毫秒 =
      typeof 选项.规划超时毫秒 === 'number' && Number.isFinite(选项.规划超时毫秒) && 选项.规划超时毫秒 > 0
        ? 选项.规划超时毫秒
        : 默认规划超时毫秒;
    const 超时门 = new Promise<{ 类型: '超时' }>(resolve => {
      超时定时器 = setTimeout(() => resolve({ 类型: '超时' }), 超时毫秒);
    });
    const 结果 = await Promise.race([底层结果, 取消门.then(() => ({ 类型: '取消' as const })), 超时门]);

    if (结果.类型 === '取消' || 活跃规划.已取消) throw new Error('__RQGY_CANCELLED__');
    // 到达完成门的这一刻冻结采用结果；超时后的迟到包装器不能再改写已经放行的正文。
    已规划结果 = 已截获目标请求 && 规划参数._qrf_processed_by_hook === true;
    跳过重复规划 = 已截获目标请求 || 结果.类型 === '超时';
    if (结果.类型 === '超时') {
      请求中止一次();
      console.warn(`[人妻公寓] 数据库剧情规划超过 ${超时毫秒}ms，已降级为原流式正文。`);
    } else if (结果.类型 === '失败') {
      console.warn('[人妻公寓] 数据库剧情规划失败，已降级为原流式正文:', 结果.错误);
    }
  } finally {
    if (超时定时器 !== undefined) clearTimeout(超时定时器);
    解绑中止监听();
    if (当前活跃规划 === 活跃规划) 当前活跃规划 = null;
    if (!底层已启动) 完成迟到清理();
  }

  选项.继续前确认?.();
  选项.正文开始?.(已规划结果);
  const 正文参数: 扩展生成参数 = {
    ...参数,
    user_input: 已规划结果 ? 规划参数.user_input : 参数.user_input,
  };
  // 这次流式请求是同一玩家行动的正文阶段；数据库前置已消费完毕，不得再跑一次纪要索引或剧情规划。
  if (跳过重复规划) 正文参数.automatic_trigger = true;
  return 调用正文(正文参数);
}
