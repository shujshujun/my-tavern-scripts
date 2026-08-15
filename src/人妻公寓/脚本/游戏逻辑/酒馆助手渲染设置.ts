import { 读取宿主SillyTavern接口 } from '../../MVU解析模式';

type 未知对象 = Record<string, unknown>;
type 渲染态 = 未知对象 & { depth?: unknown };

type Pinia形态 = {
  state?: { value?: 未知对象 };
  _s?: { get?: (id: string) => unknown };
};

export interface 强制渲染全部楼层选项 {
  /** 只等待酒馆助手运行态变为可访问；超时后如实返回失败，不阻塞游戏启动。 */
  超时毫秒?: number;
  轮询毫秒?: number;
  /** 测试注入；生产环境使用基于状态的短轮询。 */
  等待?: (毫秒: number) => Promise<void>;
}

interface 单次归零结果 {
  完成: boolean;
  改变过: boolean;
  持久设置可见: boolean;
  新版设置可见: boolean;
  运行态可见: boolean;
}

interface 渲染值快照 {
  对象: 未知对象;
  键: string;
  原值: number;
  持久设置: boolean;
}

interface 会话渲染快照 {
  值: 渲染值快照[];
  保存?: () => void | Promise<void>;
  待保存: boolean;
}

let 当前会话快照: 会话渲染快照 | null = null;
let 渲染兼容世代 = 0;

function 是对象(value: unknown): value is 未知对象 {
  return typeof value === 'object' && value !== null;
}

function 取渲染态(root: unknown, 路径: readonly string[]): 渲染态 | undefined {
  let 当前 = root;
  for (const 键 of 路径) {
    if (!是对象(当前)) return undefined;
    当前 = 当前[键];
  }
  return 是对象(当前) ? (当前 as 渲染态) : undefined;
}

function 取宿主Pinia(): Pinia形态 | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    const 宿主 = window.parent ?? window;
    const 挂载点 = 宿主.document?.getElementById('tavern_helper') as unknown as {
      __vue_app__?: { config?: { globalProperties?: { $pinia?: Pinia形态 } } };
    } | null;
    return 挂载点?.__vue_app__?.config?.globalProperties?.$pinia;
  } catch {
    return undefined;
  }
}

function 取运行渲染态(pinia: Pinia形态 | undefined): 渲染态[] {
  if (!pinia) return [];
  const 候选: (渲染态 | undefined)[] = [];
  try {
    const store = pinia._s?.get?.('global_settings');
    候选.push(取渲染态(store, ['settings', 'render']));
  } catch {
    /* 继续尝试公开响应式 state */
  }
  候选.push(取渲染态(pinia.state?.value, ['global_settings', 'settings', 'render']));
  return [...new Set(候选.filter((item): item is 渲染态 => Boolean(item)))];
}

function 取保存函数(): (() => void | Promise<void>) | undefined {
  const ST = 读取宿主SillyTavern接口();
  if (ST?.saveSettingsDebounced) return () => ST.saveSettingsDebounced?.();
  if (!ST?.getContext) return undefined;
  try {
    const 上下文 = ST.getContext();
    return 上下文.saveSettingsDebounced ? () => 上下文.saveSettingsDebounced?.() : undefined;
  } catch {
    return undefined;
  }
}

function 已记录(对象: 未知对象, 键: string): boolean {
  return 当前会话快照?.值.some(项 => 项.对象 === 对象 && 项.键 === 键) ?? false;
}

/** 先确认赋值成功再登记原值；重复启用只归零，不会把首份非零快照覆盖成 0。 */
function 临时归零(对象: 未知对象, 键: string, 持久设置: boolean): boolean {
  const 原值 = 对象[键];
  if (typeof 原值 !== 'number' || 原值 === 0) return false;
  对象[键] = 0;
  if (对象[键] !== 0) throw new Error(`酒馆助手渲染设置 ${键} 未能归零`);
  if (!已记录(对象, 键)) {
    当前会话快照 ??= { 值: [], 待保存: false };
    当前会话快照.值.push({ 对象, 键, 原值, 持久设置 });
  }
  return true;
}

/** 单次尝试同时修正持久设置与当前 Pinia 运行态，并给外层返回可验证的完成条件。 */
function 尝试归零(): 单次归零结果 {
  const ST = 读取宿主SillyTavern接口();
  const 设置 = ST?.extensionSettings;
  const 新版渲染 = 取渲染态(设置, ['tavern_helper', 'render']);
  const 旧版渲染 = 取渲染态(设置, ['TavernHelper', 'render']);
  const 新版设置可见 = typeof 新版渲染?.depth === 'number';
  const 旧版设置可见 = typeof 旧版渲染?.render_depth === 'number';
  let 改变过 = false;

  if (新版设置可见) 改变过 = 临时归零(新版渲染, 'depth', true) || 改变过;
  if (旧版设置可见) 改变过 = 临时归零(旧版渲染, 'render_depth', true) || 改变过;
  if ((新版设置可见 || 旧版设置可见) && 当前会话快照 && !当前会话快照.保存) {
    当前会话快照.保存 = 取保存函数();
  }

  const 运行渲染态 = 取运行渲染态(取宿主Pinia());
  const 运行态可见 = 运行渲染态.some(渲染 => typeof 渲染.depth === 'number');
  for (const 渲染 of 运行渲染态) {
    if (typeof 渲染.depth === 'number') 改变过 = 临时归零(渲染, 'depth', false) || 改变过;
  }

  const 持久设置可见 = 新版设置可见 || 旧版设置可见;
  const 持久设置已归零 = (!新版设置可见 || 新版渲染?.depth === 0) && (!旧版设置可见 || 旧版渲染?.render_depth === 0);
  const 运行态已归零 = 运行渲染态.filter(渲染 => typeof 渲染.depth === 'number').every(渲染 => 渲染.depth === 0);
  return {
    // 4.x 的设置对象与运行 store 是两份状态，必须两边都归零；3.x 没有该 Pinia 运行态。
    完成: 持久设置可见 && 持久设置已归零 && (!新版设置可见 || (运行态可见 && 运行态已归零)),
    改变过,
    持久设置可见,
    新版设置可见,
    运行态可见,
  };
}

/**
 * 离开本游戏会话时归还用户原本的酒馆助手偏好。只恢复仍为 0 的字段：若用户在会话中
 * 主动改成其他值，视为新选择并保留。启用阶段从不保存 0，恢复阶段至多保存一次原值。
 */
export async function 恢复酒馆助手渲染楼层(): Promise<boolean> {
  渲染兼容世代 += 1;
  const 快照 = 当前会话快照;
  if (!快照) return true;
  const 未恢复: 渲染值快照[] = [];
  let 已恢复持久设置 = false;

  for (const 项 of [...快照.值].reverse()) {
    try {
      if (项.对象[项.键] !== 0) continue;
      项.对象[项.键] = 项.原值;
      if (项.对象[项.键] !== 项.原值) throw new Error(`酒馆助手渲染设置 ${项.键} 未能恢复`);
      已恢复持久设置 ||= 项.持久设置;
    } catch (错误) {
      未恢复.push(项);
      console.warn('[人妻公寓] 恢复酒馆助手渲染楼层设置失败，将保留快照供下次重试:', 错误);
    }
  }

  快照.值 = 未恢复.reverse();
  快照.待保存 ||= 已恢复持久设置;
  if (快照.待保存) {
    const 保存 = 快照.保存 ?? 取保存函数();
    if (!保存) {
      console.warn('[人妻公寓] 已恢复酒馆助手渲染楼层原值，但宿主保存接口不可用。');
      return false;
    }
    try {
      await Promise.resolve(保存());
      快照.待保存 = false;
    } catch (错误) {
      console.warn('[人妻公寓] 保存恢复后的酒馆助手渲染楼层设置失败，将在下次离开时重试:', 错误);
      return false;
    }
  }

  if (快照.值.length === 0 && !快照.待保存) 当前会话快照 = null;
  return 快照.值.length === 0 && !快照.待保存;
}

/**
 * 防止固定在 0 楼的游戏界面被酒馆助手“只渲染最近 N 楼”裁掉。
 * 这是启动时的可选宿主兼容修复：失败只告警，不阻塞游戏逻辑；成功必须通过实际状态后置检查。
 */
export async function 强制酒馆助手渲染全部楼层(选项: 强制渲染全部楼层选项 = {}): Promise<boolean> {
  const 本次世代 = ++渲染兼容世代;
  const 超时毫秒 = Math.max(0, 选项.超时毫秒 ?? 5000);
  const 轮询毫秒 = Math.max(10, 选项.轮询毫秒 ?? 100);
  const 等待 = 选项.等待 ?? (毫秒 => new Promise<void>(resolve => setTimeout(resolve, 毫秒)));
  const 截止 = Date.now() + 超时毫秒;
  let 曾改变 = false;
  let 最后结果: 单次归零结果 | undefined;

  try {
    do {
      if (本次世代 !== 渲染兼容世代) return false;
      最后结果 = 尝试归零();
      曾改变 ||= 最后结果.改变过;
      if (最后结果.完成) {
        if (曾改变) {
          console.info('[人妻公寓] 已在本游戏会话临时将酒馆助手渲染楼层数改为 0，离开时会恢复用户原值');
        }
        return true;
      }
      if (Date.now() >= 截止) break;
      await 等待(Math.min(轮询毫秒, Math.max(0, 截止 - Date.now())));
      if (本次世代 !== 渲染兼容世代) return false;
    } while (Date.now() <= 截止);
  } catch (e) {
    if (本次世代 !== 渲染兼容世代) return false;
    console.warn('[人妻公寓] 酒馆助手渲染楼层数归零过程中发生异常（不阻塞游戏）:', e);
    await 恢复酒馆助手渲染楼层();
    return false;
  }

  console.warn('[人妻公寓] 无法确认酒馆助手渲染楼层数已归零（不阻塞游戏）:', {
    持久设置可见: 最后结果?.持久设置可见 ?? false,
    新版设置可见: 最后结果?.新版设置可见 ?? false,
    运行态可见: 最后结果?.运行态可见 ?? false,
  });
  await 恢复酒馆助手渲染楼层();
  return false;
}
