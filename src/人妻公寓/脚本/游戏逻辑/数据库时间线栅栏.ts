interface 数据表快照 {
  name?: unknown;
  content?: unknown;
}

export interface 数据库时间线持久状态 {
  版本: 2;
  聊天标识: string;
  令牌: string;
  目标楼层: number | null;
  标记时间: number;
  最早校验时间: number;
  原因: string;
}

interface 时间线状态 extends 数据库时间线持久状态 {
  待重建: boolean;
  回调指纹: string | null;
  回调楼层: number | null;
  回调时间: number;
  稳定指纹: string | null;
  连续稳定次数: number;
  上次校验时间: number;
}

export interface 主动快照选项 {
  /**
   * 没有可信回调时的保守恢复口。调用方必须先确认当前聊天已持续稳定足够久；
   * 此路径只允许在聊天仍停留于原目标楼层时使用。
   */
  允许无回调恢复?: boolean;
}

const 楼层列定义 = [
  { 表名: 'RQ_剧情事件', 楼层列: '楼层' },
  { 表名: 'RQ_人物长期记忆', 楼层列: '最后楼层' },
  { 表名: 'RQ_承诺与伏笔', 楼层列: '最后楼层' },
  { 表名: 'RQ_社交轨迹', 楼层列: '最后楼层' },
] as const;

function 取表(data: unknown, 表名: string): 数据表快照 | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  for (const value of Object.values(data as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const sheet = value as 数据表快照;
    if (sheet.name === 表名 && Array.isArray(sheet.content)) return sheet;
  }
  return null;
}

function 规范楼层(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const floor = Number(value);
  return Number.isInteger(floor) && floor >= 0 ? floor : null;
}

/** 只序列化本游戏四张表；回调对象的无关字段顺序变化不会制造假更新。 */
export function 数据库游戏表快照指纹(data: unknown): string | null {
  const sheets: unknown[] = [];
  for (const 定义 of 楼层列定义) {
    const sheet = 取表(data, 定义.表名);
    if (!sheet || !Array.isArray(sheet.content)) return null;
    sheets.push([定义.表名, sheet.content]);
  }
  try {
    return JSON.stringify(sheets);
  } catch {
    return null;
  }
}

/**
 * 删除消息后的数据库运行态只能接受仍在目标楼层以内的四张游戏表。
 * 缺表、缺楼层列或仍含未来楼层都视为尚未完成重建；旧行的空楼层仍按兼容策略放行。
 */
export function 数据库快照未越过楼层(data: unknown, 目标楼层: number | null): boolean {
  for (const 定义 of 楼层列定义) {
    const sheet = 取表(data, 定义.表名);
    const content = sheet?.content;
    if (!Array.isArray(content) || !Array.isArray(content[0])) return false;
    const headers = content[0].map(String);
    const 楼层列 = headers.indexOf(定义.楼层列);
    if (楼层列 < 0) return false;
    if (目标楼层 === null) continue;
    for (const row of content.slice(1)) {
      if (!Array.isArray(row)) return false;
      const 楼层 = Number(row[楼层列]);
      if (Number.isFinite(楼层) && 楼层 > 目标楼层) return false;
    }
  }
  return true;
}

/** 从 session/宿主镜像恢复前先严格收窄字段，损坏或旧版记录一律忽略。 */
export function 解析数据库时间线持久状态(value: unknown, 预期聊天标识?: string): 数据库时间线持久状态 | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.版本 !== 2 || typeof raw.聊天标识 !== 'string' || !raw.聊天标识) return null;
  if (预期聊天标识 !== undefined && raw.聊天标识 !== 预期聊天标识) return null;
  if (typeof raw.令牌 !== 'string' || !raw.令牌 || raw.令牌.length > 160) return null;
  const 标记时间 = Number(raw.标记时间);
  const 最早校验时间 = Number(raw.最早校验时间);
  if (!Number.isFinite(标记时间) || !Number.isFinite(最早校验时间) || 最早校验时间 < 标记时间) return null;
  if (typeof raw.原因 !== 'string' || raw.原因.length > 120) return null;
  const 目标楼层 = raw.目标楼层 === null ? null : 规范楼层(raw.目标楼层);
  if (raw.目标楼层 !== null && 目标楼层 === null) return null;
  return {
    版本: 2,
    聊天标识: raw.聊天标识,
    令牌: raw.令牌,
    目标楼层,
    标记时间,
    最早校验时间,
    原因: raw.原因,
  };
}

/**
 * 数据库插件把分支身份保存在消息级 checkpoint / operation log 中。
 * 本栅栏不复制数据库，也不成为 MVU 真相源；它只在消息时间线变动后阻止读取旧运行态。
 *
 * spv8.4 的公开表更新回调没有聊天标识，因此回调只是一条“可以开始复验”的提示：
 * 真正开栅栏还必须在当前聊天中主动导出两次相同快照，并通过四表楼层校验。
 */
export class 数据库时间线栅栏 {
  private readonly 状态 = new Map<string, 时间线状态>();
  private readonly 最短重建毫秒: number;
  private readonly 稳定间隔毫秒: number;
  private 版本序号 = 0;

  constructor(最短重建毫秒 = 500, 稳定间隔毫秒 = 120) {
    this.最短重建毫秒 = Math.max(0, 最短重建毫秒);
    this.稳定间隔毫秒 = Math.max(1, 稳定间隔毫秒);
  }

  标记(
    聊天标识: string,
    目标楼层: number | null,
    原因: string,
    现在 = Date.now(),
    指定令牌?: string,
  ): 数据库时间线持久状态 | null {
    if (!聊天标识) return null;
    const 序号 = ++this.版本序号;
    const 新目标楼层 = 目标楼层 === null ? null : 规范楼层(目标楼层);
    const 已有状态 = this.状态.get(聊天标识);
    // 批量删楼可能逐条触发 MESSAGE_DELETED；后到的中间末楼不得覆盖操作前冻结的更严格目标。
    const 冻结目标楼层 =
      已有状态?.待重建 === true
        ? 已有状态.目标楼层 === null || 新目标楼层 === null
          ? null
          : Math.min(已有状态.目标楼层, 新目标楼层)
        : 新目标楼层;
    const persistent: 数据库时间线持久状态 = {
      版本: 2,
      聊天标识,
      令牌:
        指定令牌 ?? `${Math.trunc(现在).toString(36)}-${序号.toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      目标楼层: 冻结目标楼层,
      标记时间: 现在,
      最早校验时间: 现在 + this.最短重建毫秒,
      原因: String(原因).slice(0, 120),
    };
    this.状态.set(聊天标识, this.创建内存状态(persistent));
    return { ...persistent };
  }

  恢复(value: unknown, 预期聊天标识?: string): boolean {
    const restored = 解析数据库时间线持久状态(value, 预期聊天标识);
    if (!restored) return false;
    const current = this.状态.get(restored.聊天标识);
    if (
      current &&
      (current.标记时间 > restored.标记时间 ||
        (current.标记时间 === restored.标记时间 && current.令牌 === restored.令牌))
    ) {
      return current.令牌 === restored.令牌;
    }
    this.状态.set(restored.聊天标识, this.创建内存状态(restored));
    return true;
  }

  /**
   * 缓存早到回调的快照指纹。`聊天上下文稳定=false` 用于 CHAT_CHANGED 的保护窗，
   * 防止旧聊天迟到回调被误记到刚切入的聊天。
   */
  通知刷新提示(
    聊天标识: string,
    data: unknown,
    当前楼层: number | null,
    现在 = Date.now(),
    聊天上下文稳定 = true,
  ): boolean {
    const state = this.状态.get(聊天标识);
    if (!state?.待重建 || !聊天上下文稳定) return false;
    const 楼层 = 规范楼层(当前楼层);
    // 栅栏验证目标在标记时冻结；等待期间楼层增长不能拿更宽的当前楼层替代。
    if (楼层 === null || state.目标楼层 === null || 楼层 !== state.目标楼层) return false;
    if (!数据库快照未越过楼层(data, state.目标楼层)) return false;
    const fingerprint = 数据库游戏表快照指纹(data);
    if (fingerprint === null) return false;
    state.回调指纹 = fingerprint;
    state.回调楼层 = 楼层;
    state.回调时间 = 现在;
    return true;
  }

  /**
   * 主动导出的单次采样。只有相隔稳定窗口的相同快照才计数：
   * - 有同楼层、同指纹回调提示时，两次稳定采样即可；
   * - 无回调时必须由调用方开启保守恢复，并连续三次稳定采样。
   */
  提交主动快照(
    聊天标识: string,
    data: unknown,
    当前楼层: number | null,
    现在 = Date.now(),
    options: 主动快照选项 = {},
  ): boolean {
    const state = this.状态.get(聊天标识);
    if (!state?.待重建 || 现在 < state.最早校验时间) return false;
    const 楼层 = 规范楼层(当前楼层);
    if (楼层 === null || state.目标楼层 === null || 楼层 !== state.目标楼层) return false;
    if (!数据库快照未越过楼层(data, state.目标楼层)) {
      this.重置稳定采样(state);
      return false;
    }
    const fingerprint = 数据库游戏表快照指纹(data);
    if (fingerprint === null) {
      this.重置稳定采样(state);
      return false;
    }

    const 有匹配回调 = state.回调指纹 === fingerprint && state.回调楼层 === 楼层 && state.回调时间 >= state.标记时间;
    const 可保守恢复 = options.允许无回调恢复 === true && !/切换消息分支|swipe/i.test(state.原因);
    if (!有匹配回调 && !可保守恢复) {
      this.重置稳定采样(state);
      return false;
    }

    if (state.稳定指纹 !== fingerprint) {
      state.稳定指纹 = fingerprint;
      state.连续稳定次数 = 1;
      state.上次校验时间 = 现在;
      return false;
    }
    if (现在 - state.上次校验时间 < this.稳定间隔毫秒) return false;
    state.连续稳定次数 += 1;
    state.上次校验时间 = 现在;
    const 所需次数 = 有匹配回调 ? 2 : 3;
    if (state.连续稳定次数 < 所需次数) return false;
    state.待重建 = false;
    return true;
  }

  可读取(聊天标识: string): boolean {
    return this.状态.get(聊天标识)?.待重建 !== true;
  }

  读取状态(聊天标识: string): Readonly<时间线状态> | null {
    const state = this.状态.get(聊天标识);
    return state ? { ...state } : null;
  }

  导出持久状态(聊天标识: string): 数据库时间线持久状态 | null {
    const state = this.状态.get(聊天标识);
    if (!state?.待重建) return null;
    return {
      版本: 2,
      聊天标识: state.聊天标识,
      令牌: state.令牌,
      目标楼层: state.目标楼层,
      标记时间: state.标记时间,
      最早校验时间: state.最早校验时间,
      原因: state.原因,
    };
  }

  清除(聊天标识: string, 预期令牌?: string): boolean {
    const state = this.状态.get(聊天标识);
    if (!state || (预期令牌 !== undefined && state.令牌 !== 预期令牌)) return false;
    this.状态.delete(聊天标识);
    return true;
  }

  private 创建内存状态(persistent: 数据库时间线持久状态): 时间线状态 {
    return {
      ...persistent,
      待重建: true,
      回调指纹: null,
      回调楼层: null,
      回调时间: -1,
      稳定指纹: null,
      连续稳定次数: 0,
      上次校验时间: -1,
    };
  }

  private 重置稳定采样(state: 时间线状态): void {
    state.稳定指纹 = null;
    state.连续稳定次数 = 0;
    state.上次校验时间 = -1;
  }
}
