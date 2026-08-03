import type { SchemaType } from '../../schema';
import { 难度表, 户静态表, 经济配置, type 门牌 } from '../../stageConfig';
import { 每天时段数 } from './楼层时钟';
import { 登记胜任变动 } from './胜任系统';

export const 风闻阈值 = {
  留意: 25,
  议论: 50,
  盯防: 75,
  危机: 100,
} as const;

export const 风闻数值 = {
  普通攻略: 1,
  亲密攻略: 2,
  正式晋阶: 3,
  母亲额外: 1,
  每时段攻略上限: 4,
  普通投诉责任: 3,
  严重投诉责任: 6,
  危机责任: 8,
  处理投诉降低: 5,
  聚餐降低: 经济配置.聚餐风闻直降,
  聚餐冷却时段: 经济配置.聚餐冷却时段,
} as const;

export type 风闻档位 = '平静' | '留意' | '议论' | '盯防' | '危机';
export type 攻略风闻档 = '普通' | '亲密' | '晋阶';
export type 风闻迹象 = SchemaType['系统']['_风闻账']['最近事件'][number]['迹象'];
export type 风闻投诉级别 = '无' | '普通' | '严重';

type 风闻事件 = SchemaType['系统']['_风闻账']['最近事件'][number];
type 父亲责任状态 = 风闻事件['父亲责任'];

export interface 登记风闻参数 {
  id: string;
  类型: string;
  /** 同一稳定事件应达到的总增量；重复调用只补差额，不再次完整叠加。 */
  目标增量: number;
  门牌?: string;
  地点?: string;
  摘要: string;
  迹象?: 风闻迹象;
  投诉?: 风闻投诉级别;
}

export interface 登记风闻结果 {
  变动: boolean;
  实际增加: number;
  变更前: number;
  变更后: number;
  投诉: 风闻投诉级别;
  危机: boolean;
  事件ID: string;
}

export interface 待结父亲风闻责任 {
  事件ID: string;
  摘要: string;
  扣分: number;
  可圆场: boolean;
  已由逾期计责: boolean;
}

function 整数(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : fallback;
}

function 夹取(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function 当前日(data: SchemaType): number {
  return Math.floor(Math.max(0, 整数(data.系统._绝对时段)) / 每天时段数);
}

function 当前考核期(data: SchemaType): number {
  return Math.floor(Math.max(0, 整数(data.系统._绝对时段)) / 经济配置.收租周期时段);
}

function 事件排序(a: 风闻事件, b: 风闻事件): number {
  return a.时段 - b.时段 || a.id.localeCompare(b.id);
}

function 迹象等级(迹象: 风闻迹象): number {
  return {
    关系异样: 0,
    可疑痕迹: 1,
    单人目击: 2,
    多人目击: 3,
    正式投诉: 4,
    硬证据: 5,
  }[迹象];
}

const 风闻票据前缀 = '风闻票据:v1:';

interface 持久风闻票据 {
  id: string;
  类型: string;
  时段: number;
  日: number;
  门牌: string;
  地点: string;
  目标增量: number;
  增量: number;
  迹象: 风闻迹象;
  状态: 风闻事件['状态'];
  父亲责任: 父亲责任状态;
  胜任责任: number;
}

function 状态等级(状态: 风闻事件['状态']): number {
  return 状态 === '已处理' ? 2 : 状态 === '自然平息' ? 1 : 0;
}

function 父亲责任等级(状态: 父亲责任状态): number {
  return { 无: 0, 未传: 1, 母亲已圆场: 2, 已计责: 3 }[状态];
}

function 解析持久票据(raw: string): 持久风闻票据 | undefined {
  if (!raw.startsWith(风闻票据前缀)) return undefined;
  try {
    const parsed = JSON.parse(raw.slice(风闻票据前缀.length)) as Partial<持久风闻票据>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.id !== 'string' || !parsed.id) return undefined;
    const 迹象 = ['关系异样', '可疑痕迹', '单人目击', '多人目击', '硬证据', '正式投诉'].includes(String(parsed.迹象))
      ? (parsed.迹象 as 风闻迹象)
      : '关系异样';
    const 状态 = ['活跃', '已处理', '自然平息'].includes(String(parsed.状态))
      ? (parsed.状态 as 风闻事件['状态'])
      : '活跃';
    const 父亲责任 = ['无', '未传', '母亲已圆场', '已计责'].includes(String(parsed.父亲责任))
      ? (parsed.父亲责任 as 父亲责任状态)
      : '无';
    return {
      id: parsed.id,
      类型: String(parsed.类型 ?? ''),
      时段: Math.max(0, 整数(parsed.时段)),
      日: Math.max(0, 整数(parsed.日)),
      门牌: String(parsed.门牌 ?? ''),
      地点: String(parsed.地点 ?? ''),
      目标增量: Math.max(0, 整数(parsed.目标增量)),
      增量: Math.max(0, 整数(parsed.增量)),
      迹象,
      状态,
      父亲责任,
      胜任责任: Math.max(0, 整数(parsed.胜任责任)),
    };
  } catch {
    return undefined;
  }
}

function 票据ID(raw: string): string {
  return 解析持久票据(raw)?.id ?? raw;
}

function 查持久票据(data: SchemaType, id: string): { 票据?: 持久风闻票据; 旧票据: boolean } {
  let 旧票据 = false;
  for (const raw of data.系统._风闻账.去重票据) {
    if (票据ID(raw) !== id) continue;
    const 票据 = 解析持久票据(raw);
    if (票据) return { 票据, 旧票据 };
    旧票据 = true;
  }
  return { 旧票据 };
}

function 持久票据字符串(event: 风闻事件): string {
  const 票据: 持久风闻票据 = {
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
  };
  return `${风闻票据前缀}${JSON.stringify(票据)}`;
}

function 写持久票据(data: SchemaType, event: 风闻事件): void {
  const 账 = data.系统._风闻账;
  账.去重票据 = 账.去重票据.filter(raw => 票据ID(raw) !== event.id);
  账.去重票据.push(持久票据字符串(event));
}

function 票据恢复事件(票据: 持久风闻票据): 风闻事件 {
  return {
    ...票据,
    摘要: '',
  };
}

function 应用持久票据(event: 风闻事件, 票据: 持久风闻票据): void {
  if (迹象等级(票据.迹象) >= 迹象等级(event.迹象)) {
    event.迹象 = 票据.迹象;
    if (票据.类型) event.类型 = 票据.类型;
    if (票据.门牌) event.门牌 = 票据.门牌;
    if (票据.地点) event.地点 = 票据.地点;
  }
  event.时段 = Math.min(event.时段, 票据.时段);
  event.日 = Math.min(event.日, 票据.日);
  event.目标增量 = Math.max(event.目标增量, 票据.目标增量);
  event.增量 = Math.max(event.增量, 票据.增量);
  if (状态等级(票据.状态) > 状态等级(event.状态)) event.状态 = 票据.状态;
  if (父亲责任等级(票据.父亲责任) > 父亲责任等级(event.父亲责任)) event.父亲责任 = 票据.父亲责任;
  event.胜任责任 = Math.max(event.胜任责任, 票据.胜任责任);
}

/** 合并同一稳定ID的坏数据时只取最强事实；数值与父亲责任绝不相加。 */
function 合并同ID事件(保留: 风闻事件, 候选: 风闻事件): 风闻事件 {
  if (迹象等级(候选.迹象) > 迹象等级(保留.迹象)) {
    保留.迹象 = 候选.迹象;
    保留.类型 = 候选.类型 || 保留.类型;
    保留.门牌 = 候选.门牌 || 保留.门牌;
    保留.地点 = 候选.地点 || 保留.地点;
    保留.摘要 = 候选.摘要 || 保留.摘要;
  } else if (迹象等级(候选.迹象) === 迹象等级(保留.迹象)) {
    保留.类型 ||= 候选.类型;
    保留.门牌 ||= 候选.门牌;
    保留.地点 ||= 候选.地点;
    保留.摘要 ||= 候选.摘要;
  }
  保留.时段 = Math.min(保留.时段, 候选.时段);
  保留.日 = Math.min(保留.日, 候选.日);
  保留.目标增量 = Math.max(保留.目标增量, 候选.目标增量);
  保留.增量 = Math.max(保留.增量, 候选.增量);
  if (状态等级(候选.状态) > 状态等级(保留.状态)) 保留.状态 = 候选.状态;
  if (父亲责任等级(候选.父亲责任) > 父亲责任等级(保留.父亲责任)) 保留.父亲责任 = 候选.父亲责任;
  保留.胜任责任 = Math.max(保留.胜任责任, 候选.胜任责任);
  return 保留;
}

function 规范风闻账(data: SchemaType): void {
  const 账 = data.系统._风闻账;
  const 持久表 = new Map<string, 持久风闻票据>();
  for (const raw of 账.去重票据) {
    const ticket = 解析持久票据(raw);
    if (ticket) 持久表.set(ticket.id, ticket);
  }
  const 合并 = new Map<string, 风闻事件>();
  for (const event of 账.最近事件) {
    if (!event.id) continue;
    const 持久 = 持久表.get(event.id);
    if (持久) 应用持久票据(event, 持久);
    const existing = 合并.get(event.id);
    if (existing) 合并同ID事件(existing, event);
    else 合并.set(event.id, event);
  }
  账.最近事件 = [...合并.values()].sort(事件排序);
  for (const event of 账.最近事件) {
    if (event.状态 !== '活跃' && event.父亲责任 === '未传') {
      event.父亲责任 = '无';
      event.胜任责任 = 0;
    }
  }
  const 更新票据 = new Map(账.最近事件.map(event => [event.id, 持久票据字符串(event)]));
  账.去重票据 = [
    ...账.去重票据.filter(raw => !更新票据.has(票据ID(raw))),
    ...更新票据.values(),
  ];
}

/**
 * 票据 id 全部内嵌登记时段或登记日，跨过当天后同一 id 不可能再被提交，重领与升级
 * 基线都失去意义；回档/撤销恢复的是整份旧 stat（含当时的票据表），也不依赖现票据。
 * 无未结责任、不再在账、且隔日的票据只剩死重量，按日裁掉，让去重票据从整局无界
 * 增长收敛为“当天事件 + 未结责任”的有界集合(2026-08-03 审计 M11)。
 * 旧格式票据无法判龄，保守保留；它们不再新增，总量有界。
 */
function 裁剪过期票据(data: SchemaType): void {
  const 账 = data.系统._风闻账;
  const 今天 = 当前日(data);
  const 在账id = new Set(账.最近事件.map(event => event.id));
  账.去重票据 = 账.去重票据.filter(raw => {
    const 票据 = 解析持久票据(raw);
    if (!票据) return true;
    if (在账id.has(票据.id)) return true;
    if (票据.父亲责任 === '未传' || (票据.状态 === '活跃' && 票据.胜任责任 > 0)) return true;
    return 票据.日 >= 今天;
  });
}

function 保留最近事件(data: SchemaType): void {
  规范风闻账(data);
  const 账 = data.系统._风闻账;
  const 保护 = new Set([账.当前投诉事件, 账.待转投诉事件].filter(Boolean));
  for (const event of 账.最近事件) {
    if (event.父亲责任 === '未传' || (event.状态 === '活跃' && event.胜任责任 > 0)) 保护.add(event.id);
  }
  const 受保护 = 账.最近事件.filter(event => 保护.has(event.id));
  const 普通 = 账.最近事件.filter(event => !保护.has(event.id)).slice(-12);
  账.最近事件 = [...受保护, ...普通]
    .filter((event, index, all) => all.findIndex(item => item.id === event.id) === index)
    .sort(事件排序);
  // 轻历史可以裁剪，当天与未结责任的稳定ID票据不能裁剪；否则旧事件会重新领风闻或失去升级基线。
  规范风闻账(data);
  裁剪过期票据(data);
}

function 找事件(data: SchemaType, id: string): 风闻事件 | undefined {
  return data.系统._风闻账.最近事件.find(event => event.id === id);
}

/**
 * 危机在触发瞬间已按"公开丑闻/母亲事发"当场登记过胜任责任(触发危机:-8)的事件。
 * 其衍生的紧急投诉任务再逾期属同一件事,不得按"楼务失职"二次叠扣——与普通投诉
 * "已由逾期计责→父亲报表扣0"的去重方向对齐(2026-08-04 拍板:危机不双重扣罚)。
 */
export function 风闻事件已即时计责(data: SchemaType, 事件ID: string): boolean {
  if (!事件ID) return false;
  const 责任 = 找事件(data, 事件ID)?.父亲责任 ?? 查持久票据(data, 事件ID).票据?.父亲责任;
  return 责任 === '已计责';
}

function 取投诉事件(data: SchemaType): 风闻事件 | undefined {
  return 找事件(data, data.系统._风闻账.当前投诉事件);
}

function 投诉任务(data: SchemaType): SchemaType['系统']['_管理考核']['活跃任务'][number] | undefined {
  const eventID = data.系统._风闻账.当前投诉事件;
  return data.系统._管理考核.活跃任务.find(task => !!task.来源事件 && task.来源事件 === eventID);
}

function 取下一投诉事件(data: SchemaType, 排除事件ID = ''): 风闻事件 | undefined {
  return data.系统._风闻账.最近事件
    .filter(event => event.id !== 排除事件ID && event.状态 === '活跃' && event.胜任责任 > 0)
    .sort(事件排序)[0];
}

/** 当前投诉占管理员室；其余投诉留在事件账内，按发生顺序等待补位。 */
function 刷新投诉指针(data: SchemaType): void {
  规范风闻账(data);
  const 账 = data.系统._风闻账;
  let 当前 = 取投诉事件(data);
  if (!当前 || 当前.状态 !== '活跃' || 当前.胜任责任 <= 0) {
    当前 = 取下一投诉事件(data);
    账.当前投诉事件 = 当前?.id ?? '';
  }
  if (!当前) {
    账.待转投诉事件 = '';
  } else {
    账.待转投诉事件 = 投诉任务(data) ? (取下一投诉事件(data, 当前.id)?.id ?? '') : 当前.id;
  }
  const 活跃危机 = 账.最近事件.some(
    event => event.状态 === '活跃' && event.胜任责任 >= 风闻数值.危机责任,
  );
  账.危机活跃 = 活跃危机;
  if (!活跃危机 && data.风闻 < 风闻阈值.危机) 账.危机跨线锁 = false;
}

function 稳定散列(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function 选择报事门牌(data: SchemaType, event: 风闻事件): string {
  const 已入住 = (Object.keys(data.户) as 门牌[]).filter(门牌号 => {
    const config = 户静态表[门牌号];
    return !!config && config.月租 > 0 && (门牌号 !== '302' || data.系统._母亲入列);
  });
  if (!已入住.length) return '';
  const 其他户 = 已入住.filter(门牌号 => 门牌号 !== event.门牌);
  const 候选 = 其他户.length ? 其他户 : 已入住;
  return [...候选].sort(
    (a, b) => 稳定散列(`${event.id}:${a}`) - 稳定散列(`${event.id}:${b}`) || a.localeCompare(b),
  )[0];
}

/**
 * 所有HUD、任务、电话和结局共用的公开摘要。只由结构化字段生成，绝不回传事件原始摘要。
 */
export function 风闻事件安全摘要(event: SchemaType['系统']['_风闻账']['最近事件'][number]): string {
  const 门牌 = /^\d{3}$/.test(event.门牌) ? event.门牌 : '';
  if (event.迹象 === '硬证据') return `${门牌 ? `${门牌}相关` : ''}可核验的异常痕迹`;
  if (event.迹象 === '多人目击') return `${门牌 ? `${门牌}相关` : ''}多人目击的异常往来`;
  if (event.迹象 === '单人目击') return `${门牌 ? `${门牌}相关` : ''}单人目击的异常往来`;
  if (event.迹象 === '可疑痕迹') return `${门牌 ? `${门牌}附近` : '公共区域'}出现的可疑痕迹`;
  if (event.迹象 === '正式投诉') return `${门牌 ? `${门牌}住户相关的` : ''}正式作风投诉`;
  return 门牌 ? `与${门牌}住户的往来引起留意` : '管理员与住户往来频繁引起留意';
}

function 安全投诉摘要(event: 风闻事件, 严重: boolean): string {
  const 公开事实 = 风闻事件安全摘要(event);
  return 严重 ? `楼内就${公开事实}形成严重投诉` : `楼内就${公开事实}提出投诉`;
}

function 标记当前投诉(data: SchemaType, event: 风闻事件, 级别: Exclude<风闻投诉级别, '无'>): boolean {
  const 账 = data.系统._风闻账;
  // 稳定 ID 代表同一件事；已经处理完的投诉再次到达只能视为重复投递，不能重新武装责任。
  if (event.状态 !== '活跃') return false;
  const 原责任 = event.胜任责任;
  const 原父亲责任 = event.父亲责任;
  const 当前 = 取投诉事件(data);
  if (!当前) 账.当前投诉事件 = event.id;
  event.状态 = '活跃';
  // 严重程度来自公开热度／投诉后果，不得凭空把“无人见证的关系异样”改写成硬证据。
  if (event.父亲责任 === '无') event.父亲责任 = '未传';
  event.胜任责任 = Math.max(
    event.胜任责任,
    级别 === '严重' ? 风闻数值.严重投诉责任 : 风闻数值.普通投诉责任,
  );
  账.投诉跨线锁 = true;
  写持久票据(data, event);
  刷新投诉指针(data);
  return event.胜任责任 !== 原责任 || event.父亲责任 !== 原父亲责任;
}

function 危机报表(): string {
  return '楼内风闻已经形成公开危机，严重投诉已送达';
}

function 合并报表(原报表: string, 新条目: string): string {
  if (!新条目 || 原报表.includes(新条目)) return 原报表;
  return [原报表, 新条目].filter(Boolean).join(';');
}

function 写入紧急父亲来电(data: SchemaType): void {
  const 通牒中 = data.系统._通牒期 >= 0;
  const 活动 = data.系统._父亲通话;
  if (活动.标识 && 活动.期 >= 0 && 活动.状态 === '通话中') {
    活动.紧急 = true;
    活动.报表 = 合并报表(活动.报表, 危机报表());
    活动.主题 = '楼内风闻危机';
    if (!活动.通牒) 活动.分数段 = '危险';
    return;
  }
  const 待接 = data.系统._待接来电;
  if (待接.期 >= 0) {
    待接.紧急 = true;
    待接.报表 = 合并报表(待接.报表, 危机报表());
    if (!待接.通牒) 待接.分数段 = '危险';
    return;
  }
  data.系统._待接来电 = {
    期: 当前考核期(data),
    分数段: 通牒中 ? '通牒' : '危险',
    报表: 危机报表(),
    通牒: 通牒中,
    紧急: true,
    母亲圆场: { 触发: false, 事件ID: '', 摘要: '', 仅剧情: false },
  };
}

function 触发危机(data: SchemaType, event: 风闻事件): void {
  const 账 = data.系统._风闻账;
  if (账.危机跨线锁) return;
  账.危机跨线锁 = true;
  账.危机活跃 = true;
  标记当前投诉(data, event, '严重');
  event.父亲责任 = '已计责';
  event.胜任责任 = 风闻数值.危机责任;
  刷新投诉指针(data);
  const 母亲事发 = event.门牌 === '302' && event.迹象 === '硬证据';
  登记胜任变动(data, {
    id: `风闻危机:${event.id}`,
    变动: -风闻数值.危机责任,
    类别: 母亲事发 ? '母亲事发' : '公开丑闻',
    原因: `风闻危机：${风闻事件安全摘要(event)}`,
  });
  写入紧急父亲来电(data);
}

function 重新武装阈值(data: SchemaType): void {
  const 账 = data.系统._风闻账;
  if (data.风闻 < 风闻阈值.盯防 && !账.当前投诉事件) 账.投诉跨线锁 = false;
  // 已处理的危机只要真正降到100以下就可重装；停留100时不会重放。
  if (data.风闻 < 风闻阈值.危机 && !账.危机活跃) 账.危机跨线锁 = false;
}

export function 取风闻档位(value: number): 风闻档位 {
  const 风闻 = 夹取(整数(value), 0, 100);
  if (风闻 >= 风闻阈值.危机) return '危机';
  if (风闻 >= 风闻阈值.盯防) return '盯防';
  if (风闻 >= 风闻阈值.议论) return '议论';
  if (风闻 >= 风闻阈值.留意) return '留意';
  return '平静';
}

export function 风闻最低值(data: SchemaType): number {
  刷新投诉指针(data);
  if (data.系统._风闻账.危机活跃) return 50;
  if (data.系统._风闻账.当前投诉事件) return 25;
  return 0;
}

/** 风闻唯一增加入口；同一事件只能补到更高目标值。 */
export function 登记风闻事件(data: SchemaType, input: 登记风闻参数): 登记风闻结果 {
  规范风闻账(data);
  const 账 = data.系统._风闻账;
  const id = input.id.trim();
  const 变更前 = data.风闻;
  const 空结果 = (事件ID = id): 登记风闻结果 => ({
    变动: false,
    实际增加: 0,
    变更前,
    变更后: data.风闻,
    投诉: '无',
    危机: false,
    事件ID,
  });
  if (!id) return 空结果('');

  const 目标增量 = 夹取(整数(input.目标增量), 0, 100);
  const 输入迹象 = input.迹象 ?? '关系异样';
  const 持久记录 = 查持久票据(data, id);
  let event = 找事件(data, id);
  if (event && event.状态 !== '活跃') return 空结果();
  if (!event && 持久记录.票据?.状态 !== undefined && 持久记录.票据.状态 !== '活跃') return 空结果();
  if (!event && 持久记录.旧票据 && !持久记录.票据) {
    // 旧版票据没有目标与状态元数据；宁可保持幂等，也不能把旧事件当新事件重领。
    return 空结果();
  }

  let 新稳定事件 = false;
  let 从票据恢复 = false;
  if (!event && 持久记录.票据) {
    const 票据 = 持久记录.票据;
    const 投诉升级值 = input.投诉 === '严重' ? 风闻数值.严重投诉责任 : input.投诉 === '普通' ? 风闻数值.普通投诉责任 : 0;
    const 有升级 =
      目标增量 > 票据.目标增量 ||
      迹象等级(输入迹象) > 迹象等级(票据.迹象) ||
      投诉升级值 > 票据.胜任责任;
    if (!有升级) return 空结果();
    event = 票据恢复事件(票据);
    账.最近事件.push(event);
    从票据恢复 = true;
  }
  if (!event) {
    event = {
      id,
      类型: input.类型,
      时段: Math.max(0, 整数(data.系统._绝对时段)),
      日: 当前日(data),
      门牌: input.门牌 ?? '',
      地点: input.地点 ?? '',
      摘要: input.摘要,
      目标增量: 0,
      增量: 0,
      迹象: input.迹象 ?? '关系异样',
      状态: '活跃',
      父亲责任: '无',
      胜任责任: 0,
    };
    账.最近事件.push(event);
    新稳定事件 = true;
  } else {
    const 新迹象等级 = 迹象等级(输入迹象);
    const 原迹象等级 = 迹象等级(event.迹象);
    if (新迹象等级 > 原迹象等级) {
      event.迹象 = 输入迹象;
      if (input.类型) event.类型 = input.类型;
      if (input.摘要) event.摘要 = input.摘要;
      if (input.门牌) event.门牌 = input.门牌;
      if (input.地点) event.地点 = input.地点;
    } else if (新迹象等级 === 原迹象等级 && event.迹象 !== '硬证据') {
      // 同强度重复提交只能补空字段，不能改写同一稳定事件的身份。
      if (!event.类型 && input.类型) event.类型 = input.类型;
      if (!event.摘要 && input.摘要) event.摘要 = input.摘要;
      if (!event.门牌 && input.门牌) event.门牌 = input.门牌;
      if (!event.地点 && input.地点) event.地点 = input.地点;
    }
  }

  const 迹象已升级 = 迹象等级(event.迹象) > 迹象等级(持久记录.票据?.迹象 ?? (从票据恢复 ? event.迹象 : '关系异样'));
  const 可补 = Math.max(0, 目标增量 - event.目标增量);
  event.目标增量 = Math.max(event.目标增量, 目标增量);
  const 实际增加 = Math.min(可补, 100 - data.风闻);
  if (实际增加 > 0) {
    event.增量 += 实际增加;
    data.风闻 = 夹取(data.风闻 + 实际增加, 0, 100);
  }

  let 投诉: 风闻投诉级别 = '无';
  let 投诉已升级 = false;
  if (input.投诉 && input.投诉 !== '无') {
    投诉已升级 = 标记当前投诉(data, event, input.投诉);
    if (投诉已升级) 投诉 = input.投诉;
  }
  if (变更前 < 风闻阈值.盯防 && data.风闻 >= 风闻阈值.盯防 && !账.投诉跨线锁) {
    const 跨线投诉 = input.投诉 === '严重' ? '严重' : '普通';
    标记当前投诉(data, event, 跨线投诉);
    投诉 = 跨线投诉;
    投诉已升级 = true;
  }
  const 危机 = 变更前 < 风闻阈值.危机 && data.风闻 >= 风闻阈值.危机 && !账.危机跨线锁;
  if (危机) {
    投诉 = '严重';
    触发危机(data, event);
  }
  if (新稳定事件 || 可补 > 0 || 迹象已升级 || 投诉已升级) 账.最后新增日 = 当前日(data);
  写持久票据(data, event);
  尝试转入风闻投诉(data);
  保留最近事件(data);
  return {
    变动: 新稳定事件 || 可补 > 0 || 迹象已升级 || 投诉已升级 || 危机,
    实际增加,
    变更前,
    变更后: data.风闻,
    投诉,
    危机,
    事件ID: id,
  };
}

/**
 * 每户同一绝对时段只形成一条“关系异样”账；普通→亲密→晋阶只补到最高档。
 * 多人场景的基础风闻全楼每时段最多 +4，目击／硬证据不受此上限。
 */
export function 登记攻略风闻(data: SchemaType, 门牌号: string, 档: 攻略风闻档): 登记风闻结果 {
  规范风闻账(data);
  const 时段 = Math.max(0, 整数(data.系统._绝对时段));
  const 账 = data.系统._风闻账;
  const id = `攻略:${时段}:${门牌号}`;
  const 本档 = 档 === '晋阶' ? 风闻数值.正式晋阶 : 档 === '亲密' ? 风闻数值.亲密攻略 : 风闻数值.普通攻略;
  const 母亲额外 = 门牌号 === '302' && data.系统._母亲入列 ? 风闻数值.母亲额外 : 0;
  const 目标 = 本档 + 母亲额外;
  const 已有 = 找事件(data, id)?.目标增量 ?? 查持久票据(data, id).票据?.目标增量 ?? 0;
  const 事件内已用 = 账.最近事件
    .filter(event => event.id.startsWith(`攻略:${时段}:`))
    .reduce((sum, event) => sum + event.目标增量, 0);
  if (账.攻略计数时段 !== 时段) {
    账.攻略计数时段 = 时段;
    账.攻略计数 = 事件内已用;
  } else {
    账.攻略计数 = Math.max(账.攻略计数, 事件内已用);
  }
  const 本时段攻略 = 账.攻略计数;
  const 可增加 = Math.max(0, 风闻数值.每时段攻略上限 - 本时段攻略);
  const 受限目标 = 已有 + Math.min(Math.max(0, 目标 - 已有), 可增加);
  const 摘要 = 门牌号 === '302' ? '与母亲的关系出现异常亲近迹象' : `与${门牌号}住户往来逐渐频繁`;
  const result = 登记风闻事件(data, {
    id,
    类型: 档 === '晋阶' ? '正式晋阶' : 档 === '亲密' ? '亲密攻略' : '关系推进',
    目标增量: 受限目标,
    门牌: 门牌号,
    地点: 门牌号,
    摘要,
    迹象: '关系异样',
  });
  账.攻略计数 = Math.min(风闻数值.每时段攻略上限, 本时段攻略 + Math.max(0, 受限目标 - 已有));
  return result;
}

/** 所有降低都遵守未处理投诉／危机底线。 */
export function 降低风闻(data: SchemaType, 计划降低: number): number {
  const 原值 = data.风闻;
  const 最低 = 风闻最低值(data);
  // 下限只阻止“从上方跌破”，不能在硬证据低位直开投诉时反向把当前风闻抬到下限。
  data.风闻 = Math.max(Math.min(原值, 最低), 原值 - Math.max(0, 整数(计划降低)));
  重新武装阈值(data);
  return 原值 - data.风闻;
}

/** 每日首次结算；只有整日没有新增风闻才自然平息。 */
export function 结算风闻日变(data: SchemaType): number {
  const 账 = data.系统._风闻账;
  const 今天 = 当前日(data);
  if (账.上次日结日 < 0) 账.上次日结日 = 今天;
  let 总降低 = 0;
  while (账.上次日结日 < 今天) {
    const 待结日 = 账.上次日结日;
    if (账.最后新增日 < 待结日) {
      const 降低 = data.风闻 < 50 ? 4 : data.风闻 < 75 ? 2 : 1;
      总降低 += 降低风闻(data, 降低);
    }
    账.上次日结日 += 1;
  }
  尝试转入风闻投诉(data);
  return 总降低;
}

/** 三槽或管理员室被占时保持排队；有空位后复用既有投诉瓷砖。 */
export function 尝试转入风闻投诉(data: SchemaType): boolean {
  const 账 = data.系统._风闻账;
  刷新投诉指针(data);
  const event = 取投诉事件(data);
  if (!event) return false;
  const 严重 = event.胜任责任 >= 风闻数值.严重投诉责任 || event.迹象 === '硬证据';
  const existing = 投诉任务(data);
  if (existing) {
    if (严重) {
      existing.模板 = '风闻危机投诉';
      existing.级别 = '紧急';
      existing.截止时段 = Math.min(existing.截止时段, Math.max(0, 整数(data.系统._绝对时段)) + 2);
      existing.公开摘要 = 安全投诉摘要(event, true);
    }
    刷新投诉指针(data);
    return false;
  }
  if (data.系统._管理考核.活跃任务.length >= 3 || data.系统._管理考核.活跃任务.some(task => task.地点 === '管理员室')) {
    账.待转投诉事件 = event.id;
    return false;
  }
  const 当前时段 = Math.max(0, 整数(data.系统._绝对时段));
  data.系统._管理考核.活跃任务.push({
    id: `风闻投诉-${event.id}`,
    模板: 严重 ? '风闻危机投诉' : '管理员作风投诉',
    类型: '投诉',
    级别: 严重 ? '紧急' : '重要',
    地点: '管理员室',
    门牌: 选择报事门牌(data, event),
    创建时段: 当前时段,
    截止时段: 当前时段 + (严重 ? 2 : 4),
    逾期已扣: false,
    来源事件: event.id,
    公开摘要: 安全投诉摘要(event, 严重),
  });
  刷新投诉指针(data);
  return true;
}

/** 管理员室一次性完成风闻投诉时调用；不从AI正文反推结果。 */
export function 结算风闻投诉完成(data: SchemaType, 事件ID: string): number {
  规范风闻账(data);
  if (!事件ID || data.系统._风闻账.当前投诉事件 !== 事件ID) return 0;
  const 账 = data.系统._风闻账;
  const event = 找事件(data, 事件ID);
  if (event) {
    event.状态 = '已处理';
    if (event.父亲责任 === '未传') {
      event.父亲责任 = '无';
      event.胜任责任 = 0;
    }
    写持久票据(data, event);
  }
  账.当前投诉事件 = '';
  账.待转投诉事件 = '';
  账.危机活跃 = 账.最近事件.some(
    item => item.状态 === '活跃' && item.胜任责任 >= 风闻数值.危机责任,
  );
  刷新投诉指针(data);
  const 实际降低 = 降低风闻(data, 风闻数值.处理投诉降低);
  重新武装阈值(data);
  return 实际降低;
}

export function 聚餐可降低风闻(data: SchemaType): { 可用: boolean; 尚余时段: number } {
  const 当前 = Math.max(0, 整数(data.系统._绝对时段));
  const 尚余时段 = Math.max(0, 整数(data.系统._风闻账.聚餐冷却至, -1) - 当前);
  return { 可用: 尚余时段 <= 0, 尚余时段 };
}

export function 使用聚餐降低风闻(data: SchemaType): number {
  const 当前 = Math.max(0, 整数(data.系统._绝对时段));
  const 状态 = 聚餐可降低风闻(data);
  if (!状态.可用 || data.风闻 <= 风闻最低值(data)) return 0;
  data.系统._风闻账.聚餐冷却至 = 当前 + 风闻数值.聚餐冷却时段;
  return 降低风闻(data, 风闻数值.聚餐降低);
}

/** 周期父亲报表只结算尚未传达的结构化风闻责任。 */
export function 取待结父亲风闻责任(data: SchemaType, 截止时段?: number): 待结父亲风闻责任[] {
  规范风闻账(data);
  const 排他期界 = 截止时段 === undefined ? Number.POSITIVE_INFINITY : Math.max(0, 整数(截止时段));
  return data.系统._风闻账.最近事件
    .filter(event => event.时段 < 排他期界 && event.父亲责任 === '未传' && event.胜任责任 > 0)
    .sort((a, b) => b.胜任责任 - a.胜任责任 || 事件排序(a, b))
    .map(event => {
      const task = data.系统._管理考核.活跃任务.find(item => item.来源事件 === event.id);
      const 已由逾期计责 = Boolean(task?.逾期已扣);
      const 可圆场 = !已由逾期计责 && event.胜任责任 <= 风闻数值.普通投诉责任 && event.迹象 !== '硬证据';
      return {
        事件ID: event.id,
        摘要: task?.公开摘要 || 安全投诉摘要(event, false),
        扣分: 已由逾期计责 ? 0 : event.胜任责任,
        可圆场,
        已由逾期计责,
      };
    });
}

export function 标记父亲风闻责任(data: SchemaType, 事件ID: string, 状态: 父亲责任状态): void {
  规范风闻账(data);
  const event = 找事件(data, 事件ID);
  if (event?.父亲责任 === '未传') {
    event.父亲责任 = 状态;
    写持久票据(data, event);
  }
}

/** HUD详情只读取脚本安全摘要，不暴露私密行为正文。 */
export function 最近风闻摘要(data: SchemaType, count = 3): string[] {
  规范风闻账(data);
  return [...data.系统._风闻账.最近事件]
    .filter(event => event.增量 > 0)
    .sort((a, b) => b.时段 - a.时段 || b.id.localeCompare(a.id))
    .slice(0, Math.max(0, 整数(count, 3)))
    .map(event => `${风闻事件安全摘要(event)} +${event.增量}`);
}

/** 供紧急来电与HUD读取真实难度边界，风闻系统本身不启动正式通牒。 */
export function 当前胜任危险状态(data: SchemaType): '安全' | '危险' | '通牒' {
  const 红线 = (难度表[data.系统._难度] ?? 难度表['标准']).胜任度红线;
  // 分数跌到红线只代表“本期处于危险”；正式通牒只能由期界考核写入。
  if (data.系统._通牒期 >= 0) return '通牒';
  return data.胜任度 <= 红线 + 9 ? '危险' : '安全';
}
