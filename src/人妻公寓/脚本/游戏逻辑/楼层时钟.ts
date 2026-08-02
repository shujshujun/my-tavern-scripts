import type { SchemaType } from '../../schema';
import type { 时段名, 夫状态名, 门牌 } from '../../stageConfig';
import { 户静态表 } from '../../stageConfig';
import {
  每周时段数,
  六时段列表,
  到次日早晨间隔,
  妻基础位置,
  星期列表,
  解析绝对时段,
  type 星期名,
} from '../../周作息';

export { 六时段列表, 到次日早晨间隔, 星期列表, 每周时段数, 解析绝对时段 } from '../../周作息';
export type { 星期名 } from '../../周作息';

/**
 * 世界时间只认 MVU 持久字段 `系统._绝对时段`。
 *
 * `_绝对时段` 是从 0 开始的世界时段序号：0=第1天早上，1=第1天中午。聊天消息楼
 * 只负责正文时间线、回档和重掷，不再参与任何日期、作息、冷却或随机种子的计算。
 */

/** 兼容既有调用名；内容由固定周历模块唯一提供。 */
export const 时段列表: readonly 时段名[] = 六时段列表;

export const 每天时段数 = 六时段列表.length;
export const 每周天数 = 星期列表.length;

const 旧制每时段钟楼数 = 3;

/** 把仍以钟楼“跨度”标注的静态配置向上换算为时段数；不得用于持久时间戳。 */
export function 旧钟楼转时段(旧值: number): number {
  if (!Number.isFinite(旧值)) return 0;
  return Math.ceil(Math.max(0, 旧值) / 旧制每时段钟楼数);
}

/** 语义更明确的别名，供新业务代码使用。 */
export const 旧钟楼跨度转时段 = 旧钟楼转时段;

type 世界时间载体 = Pick<SchemaType, '系统'>;
export type 世界时间输入 = number | 世界时间载体;

export interface 世界时间快照 {
  绝对时段: number;
  天数: number;
  周数: number;
  星期: 星期名;
  时段: 时段名;
  当日时段序号: number;
}

export interface 时段推进结果 {
  推进时段数: number;
  旧时间: 世界时间快照;
  新时间: 世界时间快照;
  跨天: boolean;
  跨周: boolean;
}

function 规范绝对时段(value: unknown): number {
  return 解析绝对时段(Number(value)).绝对时段;
}

/** 世界当前时间的唯一读取口。 */
export function 取绝对时段(data: 世界时间载体): number {
  return 规范绝对时段(data.系统._绝对时段);
}

function 解绝对时段(input: 世界时间输入): number {
  return typeof input === 'number' ? 规范绝对时段(input) : 取绝对时段(input);
}

/** 绝对时段 → 六时段档；也可直接传整份游戏数据。 */
export function 当前时段(input: 世界时间输入): 时段名 {
  return 解析绝对时段(解绝对时段(input)).时段;
}

/** 绝对时段 → 第几天，开局为第1天。 */
export function 当前天数(input: 世界时间输入): number {
  return 解析绝对时段(解绝对时段(input)).天数;
}

/** 绝对时段 → 第几周，开局为第1周。 */
export function 当前周数(input: 世界时间输入): number {
  return 解析绝对时段(解绝对时段(input)).周数;
}

/** 第1天固定为星期一。 */
export function 当前星期(input: 世界时间输入): 星期名 {
  return 解析绝对时段(解绝对时段(input)).星期;
}

export function 读取世界时间(input: 世界时间输入): 世界时间快照 {
  const 时间 = 解析绝对时段(解绝对时段(input));
  return {
    绝对时段: 时间.绝对时段,
    天数: 时间.天数,
    周数: 时间.周数,
    星期: 时间.星期,
    时段: 时间.时段,
    当日时段序号: 时间.时段序号,
  };
}

/** 世界时间的唯一推进原语；消息楼参数不参与计算。 */
export function 推进时段(data: 世界时间载体, 时段数 = 1): 时段推进结果 {
  if (!Number.isInteger(时段数) || 时段数 < 0) {
    throw new RangeError(`推进时段数必须是非负整数，收到 ${String(时段数)}`);
  }
  const 旧时间 = 读取世界时间(data);
  data.系统._绝对时段 = 旧时间.绝对时段 + 时段数;
  const 新时间 = 读取世界时间(data);
  return {
    推进时段数: 时段数,
    旧时间,
    新时间,
    跨天: 新时间.天数 > 旧时间.天数,
    跨周: 新时间.周数 > 旧时间.周数,
  };
}

/** 睡眠类动作的核心跨度：无论当前何时，都推进到下一天早上。 */
export function 推进到次日早晨(data: 世界时间载体): 时段推进结果 {
  return 推进时段(data, 到次日早晨间隔(取绝对时段(data)));
}

// ============================================
// 确定性种子随机(业务应传绝对时段或明确的动作序号；严禁再传消息楼冒充世界时间)
// ============================================

/** 确定性种子随机:同一组种子永远同一结果(mulberry32 变体) */
export function seededRandom(...seeds: (number | string)[]): number {
  let h = 1779033703 ^ seeds.length;
  for (const s of seeds) {
    const str = String(s);
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= h >>> 16) >>> 0) / 4294967296;
}

// ============================================
// 固定作息（只由星期+时段决定；特殊场景、赴约和连续场景由上层覆盖）
// ============================================

/**
 * 丈夫基础状态只按固定作息表查询，不再叠加消息楼或随机扰动。
 * 纯函数——快照注入与结算读同一真值，AI 只负责把它演出来。
 * 〔P5〕每户人设差分作息(202"晚间加班(?)"彩蛋)在 stageConfig 覆盖。
 */
export function 丈夫状态推算(门牌号: 门牌, 绝对时段: number): 夫状态名 {
  const 配 = 户静态表[门牌号];
  return 配.夫作息[当前时段(绝对时段)];
}

/**
 * 丈夫状态含运作窗口(P3):夜班内推/外地项目把 `夫._外出至` 写成右开区间终点。
 * 从 T 开始持续 N 时段时保存 T+N，并且只在 `[T, T+N)` 内强制外出。
 * 全系统读丈夫状态的统一口——有户节点就走这里,别裸调 丈夫状态推算。
 */
interface 阶段预约状态 {
  预约星期?: string;
  预约时段?: string;
  预约地点?: string;
  预约绝对时段?: number;
  预约丈夫状态?: string;
}

interface 含阶段预约户 {
  夫: { _外出至: number };
  妻?: { _阶段线路?: 阶段预约状态 };
}

/** 首次预约及其每周复现窗口；错过不会永久丢失，也不会在别的星期或时段误激活。 */
export function 阶段预约当前有效(状态: 阶段预约状态 | undefined, 绝对时段: number): boolean {
  const 起点 = Number(状态?.预约绝对时段 ?? -1);
  if (!状态?.预约地点 || !状态.预约星期 || !状态.预约时段 || 起点 < 0 || 绝对时段 < 起点) return false;
  if ((绝对时段 - 起点) % 每周时段数 !== 0) return false;
  const 时间 = 解析绝对时段(绝对时段);
  return 时间.星期 === 状态.预约星期 && 时间.时段 === 状态.预约时段;
}

export function 丈夫在楼(节点: 含阶段预约户 | undefined, 门牌号: 门牌, 绝对时段: number): 夫状态名 {
  const 预约 = 节点?.妻?._阶段线路;
  if (阶段预约当前有效(预约, 绝对时段)) {
    if (预约?.预约丈夫状态 === '外出' || 预约?.预约丈夫状态 === '在家' || 预约?.预约丈夫状态 === '睡眠') {
      return 预约.预约丈夫状态;
    }
  }
  if (节点 && 节点.夫._外出至 > 绝对时段) return '外出';
  return 丈夫状态推算(门牌号, 绝对时段);
}

/** 钓鱼券冻结同样采用右开区间：截止值等于当前时段时已经到期。 */
export function 疑心冻结中(夫: { _疑心冻结至: number } | undefined, 绝对时段: number): boolean {
  return !!夫 && 夫._疑心冻结至 > 绝对时段;
}

/**
 * 妻基础位置由固定周作息表查询；本函数不读取消息楼、不使用随机数。
 * 特殊场景、赴约与连续对话的在场覆盖仍由上层先行处理。
 */
export function 妻位置推算(门牌号: 门牌, 绝对时段: number, 节点?: 含阶段预约户): string {
  const 预约 = 节点?.妻?._阶段线路;
  if (阶段预约当前有效(预约, 绝对时段)) return 预约!.预约地点!;
  return 妻基础位置(门牌号, 绝对时段);
}
