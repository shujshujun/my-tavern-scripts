import type { SchemaType } from '../../schema';

let 父亲通话整表写队列: Promise<unknown> = Promise.resolve();

type 父亲电话原子状态 = Pick<SchemaType, '胜任度' | '风闻' | '户' | '系统'>;
type 风闻账状态 = SchemaType['系统']['_风闻账'];

/** 父亲通话与正文最终整表提交共用的串行租约，防止两份旧快照互相覆盖。 */
export function 排队父亲通话整表写<T>(任务: () => Promise<T>): Promise<T> {
  const 本次 = 父亲通话整表写队列.then(任务, 任务);
  父亲通话整表写队列 = 本次.then(
    () => undefined,
    () => undefined,
  );
  return 本次;
}

function 夹取(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function 有限数(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function 深相同(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function 合并按键数组<T>(正文: readonly T[], 最新: readonly T[], 基准: readonly T[], 取键: (item: T) => string): T[] {
  const result = structuredClone(正文) as T[];
  const 基准表 = new Map(基准.map(item => [取键(item), item]));
  const 正文索引 = new Map(result.map((item, index) => [取键(item), index]));
  for (const item of 最新) {
    const key = 取键(item);
    const 基准项 = 基准表.get(key);
    const index = 正文索引.get(key);
    if (基准项 === undefined) {
      if (index === undefined) {
        正文索引.set(key, result.length);
        result.push(structuredClone(item));
      }
      continue;
    }
    if (index !== undefined && 深相同(result[index], 基准项) && !深相同(item, 基准项)) {
      result[index] = structuredClone(item);
    }
  }
  return result;
}

function 队列项(value: unknown): string[] {
  return typeof value === 'string' ? value.split('|').filter(Boolean) : [];
}

/**
 * `_待发送事件` 是追加队列。正文与电话收尾都可能从同一基准追加内容，不能用任一分支
 * 整串覆盖另一分支；这里只把最新持久态相对基准新增、且正文候选尚未带入的项补进去。
 */
function 合并待发送事件(正文值: unknown, 最新值: unknown, 基准值: unknown): string {
  const 正文项 = 队列项(正文值);
  const 最新项 = 队列项(最新值);
  const 基准项 = 队列项(基准值);
  const 计数 = (items: readonly string[]): Map<string, number> => {
    const result = new Map<string, number>();
    for (const item of items) result.set(item, (result.get(item) ?? 0) + 1);
    return result;
  };
  const 基准计数 = 计数(基准项);
  const 正文计数 = 计数(正文项);
  const 最新计数 = 计数(最新项);
  for (const item of 最新项) {
    const 最新新增 = Math.max(0, (最新计数.get(item) ?? 0) - (基准计数.get(item) ?? 0));
    const 正文已有新增 = Math.max(0, (正文计数.get(item) ?? 0) - (基准计数.get(item) ?? 0));
    if (正文已有新增 >= 最新新增) continue;
    正文项.push(item);
    正文计数.set(item, (正文计数.get(item) ?? 0) + 1);
  }
  return 正文项.join('|');
}

function 合并风闻账(正文: 风闻账状态, 最新: 风闻账状态, 基准: 风闻账状态): 风闻账状态 {
  if (深相同(最新, 基准)) return 正文;
  if (深相同(正文, 基准)) return structuredClone(最新);

  const result = structuredClone(正文);
  result.最近事件 = 合并按键数组(正文.最近事件, 最新.最近事件, 基准.最近事件, event => event.id);
  result.去重票据 = 合并按键数组(正文.去重票据, 最新.去重票据, 基准.去重票据, item => item);

  for (const key of Object.keys(最新) as (keyof 风闻账状态)[]) {
    if (key === '最近事件' || key === '去重票据') continue;
    const 正文值 = 正文[key];
    const 最新值 = 最新[key];
    const 基准值 = 基准[key];
    if (深相同(最新值, 基准值)) continue;
    if (深相同(正文值, 基准值)) {
      Object.assign(result, { [key]: structuredClone(最新值) });
      continue;
    }
    if (key === '攻略计数' && 有限数(正文值) && 有限数(最新值) && 有限数(基准值)) {
      result.攻略计数 = 夹取(正文值 + 最新值 - 基准值, 0, 4);
    } else if (typeof 正文值 === 'boolean' && typeof 最新值 === 'boolean') {
      Object.assign(result, { [key]: 正文值 || 最新值 });
    } else if (typeof 正文值 === 'string' && typeof 最新值 === 'string' && !正文值) {
      Object.assign(result, { [key]: 最新值 });
    } else if (有限数(正文值) && 有限数(最新值)) {
      Object.assign(result, { [key]: Math.max(正文值, 最新值) });
    }
  }
  return result;
}

/** 电话收尾会原子归档母亲线索，并可能让“父亲电话”线路登记一条攻略风闻。 */
function 合并父亲通话收尾副作用(
  正文候选: 父亲电话原子状态,
  最新持久态: 父亲电话原子状态,
  原正文基准: 父亲电话原子状态,
): void {
  // 不能只用“基准活动通话是否被清空”判断挂断：一次正文生成足够慢时，玩家可能在
  // 此窗口内完成接听和挂断，导致基准与最新都没有活动通话。对收尾涉及的字段统一做
  // 三方合并；最新分支没有变化时自然是空操作，也不会干扰普通正文结算。
  if (有限数(正文候选.风闻) && 有限数(最新持久态.风闻) && 有限数(原正文基准.风闻)) {
    正文候选.风闻 = 夹取(正文候选.风闻 + 最新持久态.风闻 - 原正文基准.风闻, 0, 100);
  }

  const 正文302 = 正文候选.户?.['302']?.妻;
  const 最新302 = 最新持久态.户?.['302']?.妻;
  const 基准302 = 原正文基准.户?.['302']?.妻;
  if (正文302 && 最新302 && 基准302) {
    const 正文进度 = 正文302.裂缝.碎片进度;
    const 最新进度 = 最新302.裂缝.碎片进度;
    const 基准进度 = 基准302.裂缝.碎片进度;
    if (有限数(正文进度) && 有限数(最新进度) && 有限数(基准进度)) {
      正文302.裂缝.碎片进度 = 夹取(正文进度 + 最新进度 - 基准进度, 0, 4);
    }

    const 正文线路 = 正文302._阶段线路;
    const 最新线路 = 最新302._阶段线路;
    const 基准线路 = 基准302._阶段线路;
    if (!深相同(最新线路, 基准线路)) {
      if (深相同(正文线路, 基准线路) || 正文线路.目标阶段 !== 最新线路.目标阶段) {
        正文302._阶段线路 = structuredClone(最新线路);
      } else {
        正文线路.完成位图 |= 最新线路.完成位图;
        正文线路.活跃节点 = Math.max(正文线路.活跃节点, 最新线路.活跃节点);
        正文线路.节点起始楼 = Math.max(正文线路.节点起始楼, 最新线路.节点起始楼);
        if (正文线路.预约时段 === 基准线路.预约时段) 正文线路.预约时段 = 最新线路.预约时段;
        if (正文线路.预约地点 === 基准线路.预约地点) 正文线路.预约地点 = 最新线路.预约地点;
      }
    }
  }

  const 正文风闻账 = 正文候选.系统._风闻账;
  const 最新风闻账 = 最新持久态.系统._风闻账;
  const 基准风闻账 = 原正文基准.系统._风闻账;
  if (正文风闻账 && 最新风闻账 && 基准风闻账) {
    正文候选.系统._风闻账 = 合并风闻账(正文风闻账, 最新风闻账, 基准风闻账);
  }
  const 正文任务 = 正文候选.系统._管理考核?.活跃任务;
  const 最新任务 = 最新持久态.系统._管理考核?.活跃任务;
  const 基准任务 = 原正文基准.系统._管理考核?.活跃任务;
  if (正文任务 && 最新任务 && 基准任务) {
    正文候选.系统._管理考核.活跃任务 = 合并按键数组(正文任务, 最新任务, 基准任务, task => task.id);
  }
}

/**
 * 正文不拥有父亲电话原子状态的覆盖权。提交前在锁内重读最新持久态，并以正文实际解析
 * 基准做三方合并：电话的实际胜任增量叠到正文结果上，待接/活动通话取最新互斥快照，
 * 双方各自追加的待发送事件都保留。省略基准时，视正文候选为本次合并基准。
 */
export function 合并最新父亲通话(
  正文候选: 父亲电话原子状态,
  最新持久态: 父亲电话原子状态,
  原正文基准: 父亲电话原子状态 = structuredClone(正文候选),
): void {
  if (有限数(正文候选.胜任度) && 有限数(最新持久态.胜任度) && 有限数(原正文基准.胜任度)) {
    正文候选.胜任度 = 夹取(正文候选.胜任度 + 最新持久态.胜任度 - 原正文基准.胜任度, 0, 100);
  }

  const 正文正向 = 正文候选.系统._管理考核?.本期正向;
  const 最新正向 = 最新持久态.系统._管理考核?.本期正向;
  const 基准正向 = 原正文基准.系统._管理考核?.本期正向;
  if (有限数(正文正向) && 有限数(最新正向) && 有限数(基准正向)) {
    正文候选.系统._管理考核.本期正向 = 夹取(正文正向 + 最新正向 - 基准正向, 0, 6);
  }
  const 正文记分 = 正文候选.系统._管理考核?.记分条目;
  const 最新记分 = 最新持久态.系统._管理考核?.记分条目;
  const 基准记分 = 原正文基准.系统._管理考核?.记分条目;
  if (正文记分 && 最新记分 && 基准记分) {
    正文候选.系统._管理考核.记分条目 = 合并按键数组(正文记分, 最新记分, 基准记分, 条目 => 条目.id);
  }

  正文候选.系统._待发送事件 = 合并待发送事件(
    正文候选.系统._待发送事件,
    最新持久态.系统._待发送事件,
    原正文基准.系统._待发送事件,
  );
  合并父亲通话收尾副作用(正文候选, 最新持久态, 原正文基准);
  正文候选.系统._待接来电 = structuredClone(最新持久态.系统._待接来电);
  正文候选.系统._父亲通话 = structuredClone(最新持久态.系统._父亲通话);
}
