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
  const 基准表 = new Map(基准.map(item => [取键(item), item]));
  const 最新表 = new Map(最新.map(item => [取键(item), item]));
  // 父亲分支已删除、而正文仍完整保留基准项时，删除本身也是合法变化；否则正文旧快照
  // 会把已完成任务或为容量裁剪掉的记分／风闻记录复活。正文已修改或自行删除时保留正文决定。
  const result = (structuredClone(正文) as T[]).filter(item => {
    const key = 取键(item);
    const 基准项 = 基准表.get(key);
    return 基准项 === undefined || 最新表.has(key) || !深相同(item, 基准项);
  });
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

type 风闻事件状态 = 风闻账状态['最近事件'][number];

const 风闻迹象优先级: Readonly<Record<string, number>> = {
  关系异样: 0,
  可疑痕迹: 1,
  单人目击: 2,
  多人目击: 3,
  正式投诉: 4,
  硬证据: 5,
};
const 风闻状态优先级: Readonly<Record<string, number>> = { 活跃: 0, 自然平息: 1, 已处理: 2 };
const 父亲责任优先级: Readonly<Record<string, number>> = { 无: 0, 未传: 1, 母亲已圆场: 2, 已计责: 3 };

function 三方文本(正文值: unknown, 最新值: unknown, 基准值: unknown): unknown {
  if (深相同(正文值, 基准值) && !深相同(最新值, 基准值)) return structuredClone(最新值);
  if ((正文值 === '' || 正文值 === undefined || 正文值 === null) && 最新值) return structuredClone(最新值);
  return structuredClone(正文值);
}

/** 同一稳定风闻事件是单调事实：证据、目标与责任终态必须逐字段合并，不能让任一旧快照整项覆盖。 */
function 合并同ID风闻事件(正文: 风闻事件状态, 最新: 风闻事件状态, 基准?: 风闻事件状态): 风闻事件状态 {
  const result = structuredClone(正文);
  const 正文迹象级 = 风闻迹象优先级[String(正文.迹象)] ?? -1;
  const 最新迹象级 = 风闻迹象优先级[String(最新.迹象)] ?? -1;
  const 文本键 = ['类型', '门牌', '地点', '摘要'] as const;
  if (最新迹象级 > 正文迹象级) {
    result.迹象 = 最新.迹象;
    for (const key of 文本键) Object.assign(result, { [key]: structuredClone(最新[key]) });
  } else if (最新迹象级 === 正文迹象级) {
    if (!result.迹象 && 最新.迹象) result.迹象 = 最新.迹象;
    for (const key of 文本键) {
      Object.assign(result, { [key]: 三方文本(正文[key], 最新[key], 基准?.[key]) });
    }
  }

  for (const key of ['时段', '日'] as const) {
    const 正文值 = Number(正文[key]);
    const 最新值 = Number(最新[key]);
    if (Number.isFinite(正文值) && Number.isFinite(最新值)) Object.assign(result, { [key]: Math.min(正文值, 最新值) });
    else if (!Number.isFinite(正文值) && Number.isFinite(最新值)) Object.assign(result, { [key]: 最新值 });
  }
  for (const key of ['目标增量', '增量', '胜任责任'] as const) {
    const 正文值 = Number(正文[key]);
    const 最新值 = Number(最新[key]);
    if (Number.isFinite(正文值) && Number.isFinite(最新值)) Object.assign(result, { [key]: Math.max(正文值, 最新值) });
    else if (!Number.isFinite(正文值) && Number.isFinite(最新值)) Object.assign(result, { [key]: 最新值 });
  }

  if ((风闻状态优先级[String(最新.状态)] ?? -1) > (风闻状态优先级[String(正文.状态)] ?? -1)) {
    result.状态 = 最新.状态;
  }
  if ((父亲责任优先级[String(最新.父亲责任)] ?? -1) > (父亲责任优先级[String(正文.父亲责任)] ?? -1)) {
    result.父亲责任 = 最新.父亲责任;
  }
  // 与风闻系统的账本规范保持同一不变量：已结案事件不能继续挂“未传”责任。
  if (result.状态 && result.状态 !== '活跃' && result.父亲责任 === '未传') {
    result.父亲责任 = '无';
    result.胜任责任 = 0;
  }
  return result;
}

function 构造风闻事件表(items: readonly 风闻事件状态[]): Map<string, 风闻事件状态> {
  const result = new Map<string, 风闻事件状态>();
  for (const item of items) {
    if (!item?.id) continue;
    const existing = result.get(item.id);
    result.set(item.id, existing ? 合并同ID风闻事件(existing, item) : structuredClone(item));
  }
  return result;
}

function 合并风闻事件数组(
  正文: readonly 风闻事件状态[],
  最新: readonly 风闻事件状态[],
  基准: readonly 风闻事件状态[],
): 风闻事件状态[] {
  const 原合并 = 合并按键数组(正文, 最新, 基准, event => event.id);
  const 正文表 = 构造风闻事件表(正文);
  const 最新表 = 构造风闻事件表(最新);
  const 基准表 = 构造风闻事件表(基准);
  const result: 风闻事件状态[] = [];
  const index = new Map<string, number>();
  for (const item of 原合并) {
    if (!item?.id) continue;
    const 正文项 = 正文表.get(item.id);
    const 最新项 = 最新表.get(item.id);
    const 候选 =
      正文项 && 最新项
        ? 合并同ID风闻事件(正文项, 最新项, 基准表.get(item.id))
        : structuredClone(item);
    const 已有位置 = index.get(item.id);
    if (已有位置 === undefined) {
      index.set(item.id, result.length);
      result.push(候选);
    } else {
      result[已有位置] = 合并同ID风闻事件(result[已有位置], 候选, 基准表.get(item.id));
    }
  }
  return result;
}

const 风闻票据前缀 = '风闻票据:v1:';

function 解析结构化风闻票据(raw: string): 风闻事件状态 | null {
  if (!raw.startsWith(风闻票据前缀)) return null;
  try {
    const parsed = JSON.parse(raw.slice(风闻票据前缀.length)) as Partial<风闻事件状态>;
    if (!parsed || typeof parsed.id !== 'string' || !parsed.id) return null;
    return { ...parsed, 摘要: '' } as 风闻事件状态;
  } catch {
    return null;
  }
}

function 序列化结构化风闻票据(event: 风闻事件状态): string {
  return `${风闻票据前缀}${JSON.stringify({
    id: event.id,
    类型: event.类型,
    时段: event.时段,
    日: event.日,
    门牌: event.门牌,
    地点: event.地点,
    目标增量: event.目标增量,
    增量: event.增量,
    迹象: event.迹象,
    状态: event.状态,
    父亲责任: event.父亲责任,
    胜任责任: event.胜任责任,
  })}`;
}

function 风闻票据语义键(raw: string): string {
  const parsed = 解析结构化风闻票据(raw);
  return parsed ? `v1:${parsed.id}` : `legacy:${raw}`;
}

function 构造结构化票据表(items: readonly string[]): Map<string, 风闻事件状态> {
  const result = new Map<string, 风闻事件状态>();
  for (const raw of items) {
    const parsed = 解析结构化风闻票据(raw);
    if (!parsed) continue;
    const existing = result.get(parsed.id);
    result.set(parsed.id, existing ? 合并同ID风闻事件(existing, parsed) : parsed);
  }
  return result;
}

function 合并风闻票据数组(正文: readonly string[], 最新: readonly string[], 基准: readonly string[]): string[] {
  const 原合并 = 合并按键数组(正文, 最新, 基准, 风闻票据语义键);
  const 正文表 = 构造结构化票据表(正文);
  const 最新表 = 构造结构化票据表(最新);
  const 基准表 = 构造结构化票据表(基准);
  const 已写结构化 = new Set<string>();
  const result: string[] = [];
  for (const raw of 原合并) {
    const parsed = 解析结构化风闻票据(raw);
    if (!parsed) {
      result.push(raw);
      continue;
    }
    if (已写结构化.has(parsed.id)) continue;
    已写结构化.add(parsed.id);
    const 正文项 = 正文表.get(parsed.id);
    const 最新项 = 最新表.get(parsed.id);
    const merged =
      正文项 && 最新项
        ? 合并同ID风闻事件(正文项, 最新项, 基准表.get(parsed.id))
        : parsed;
    result.push(序列化结构化风闻票据(merged));
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

function 合并场景剧情事务(
  正文候选: 父亲电话原子状态,
  最新持久态: 父亲电话原子状态,
  原正文基准: 父亲电话原子状态,
): void {
  const 正文事务 = 正文候选.系统._场景剧情事务;
  const 最新事务 = 最新持久态.系统._场景剧情事务;
  const 基准事务 = 原正文基准.系统._场景剧情事务;
  const 正文有变 = !深相同(正文事务, 基准事务);
  const 最新有变 = !深相同(最新事务, 基准事务);

  if (最新有变) {
    if (!正文有变 || 深相同(正文事务, 最新事务)) {
      正文候选.系统._场景剧情事务 = structuredClone(最新事务);
    } else {
      throw new Error('父亲通话并发期间场景剧情事务发生分叉，拒绝用任一旧快照覆盖另一张活动票。');
    }
  }

  const 正文序号 = Number(正文候选.系统._场景剧情序号) || 0;
  const 最新序号 = Number(最新持久态.系统._场景剧情序号) || 0;
  const 基准序号 = Number(原正文基准.系统._场景剧情序号) || 0;
  正文候选.系统._场景剧情序号 = Math.max(正文序号, 最新序号, 基准序号);
}

function 合并风闻账(正文: 风闻账状态, 最新: 风闻账状态, 基准: 风闻账状态): 风闻账状态 {
  if (深相同(最新, 基准)) return 正文;
  if (深相同(正文, 基准)) return structuredClone(最新);

  const result = structuredClone(正文);
  result.最近事件 = 合并风闻事件数组(正文.最近事件, 最新.最近事件, 基准.最近事件);
  result.去重票据 = 合并风闻票据数组(正文.去重票据, 最新.去重票据, 基准.去重票据);

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
 * 正文与父亲收尾可能从同一基准分别跨过风闻投诉阈值，各自在管理员室创建一张任务。
 * 三方数组合并后必须恢复“当前投诉单槽、其余事件排队”的业务不变量；两个真实事件仍
 * 全部保留在风闻账，只移除不该提前实体化的后续投诉任务。
 */
function 收口并发风闻投诉任务(data: 父亲电话原子状态): void {
  const 账 = data.系统?._风闻账;
  const 任务表 = data.系统?._管理考核?.活跃任务;
  if (!账 || !Array.isArray(账.最近事件) || !Array.isArray(任务表)) return;

  const 风闻投诉任务 = 任务表.filter(task => Boolean(task.来源事件) && task.id.startsWith('风闻投诉-'));
  const 已实体化事件 = new Set(风闻投诉任务.map(task => task.来源事件));
  const 活跃责任 = 账.最近事件
    .filter(event => {
      if (!event?.id) return false;
      if (event.状态 === '已处理' || event.状态 === '自然平息') return false;
      return event.状态 === '活跃' && event.胜任责任 > 0 || 已实体化事件.has(event.id);
    })
    .sort((a, b) => (Number(a.时段) || 0) - (Number(b.时段) || 0) || a.id.localeCompare(b.id));
  // 无可证明的活动投诉时不要根据局部／旧测试夹具删除任务；真实 Schema 数据会走上面的完整分支。
  if (!活跃责任.length) return;

  const 活跃ID = new Set(活跃责任.map(event => event.id));
  const 当前ID = 活跃ID.has(账.当前投诉事件) ? 账.当前投诉事件 : 活跃责任[0].id;
  let 已保留当前任务 = false;
  data.系统._管理考核.活跃任务 = 任务表.filter(task => {
    const 是风闻投诉任务 = Boolean(task.来源事件) && task.id.startsWith('风闻投诉-');
    if (!是风闻投诉任务) return true;
    if (task.来源事件 !== 当前ID || 已保留当前任务) return false;
    已保留当前任务 = true;
    return true;
  });
  账.当前投诉事件 = 当前ID;
  const 下一事件 = 活跃责任.find(event => event.id !== 当前ID)?.id ?? '';
  账.待转投诉事件 = 已保留当前任务 ? 下一事件 : 当前ID;
  if (活跃责任.every(event => Number.isFinite(Number(event.胜任责任)))) {
    账.危机活跃 = 活跃责任.some(event => Number(event.胜任责任) >= 8);
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
  合并场景剧情事务(正文候选, 最新持久态, 原正文基准);
  合并父亲通话收尾副作用(正文候选, 最新持久态, 原正文基准);
  收口并发风闻投诉任务(正文候选);
  正文候选.系统._待接来电 = structuredClone(最新持久态.系统._待接来电);
  正文候选.系统._父亲通话 = structuredClone(最新持久态.系统._父亲通话);
}
