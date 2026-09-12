import { Schema, type SchemaType } from '../../schema';
import { 手机锚消息签名, 手机锚消息签名匹配 } from './手机时间线租约';
import { 恢复精确聊天快照, 时间状态指纹, type 精确聊天快照 } from './时间撤销系统';

export const 即时业务撤回键 = '_即时业务撤回';
export const 即时业务撤回版本 = 1 as const;

/**
 * 即时业务会先把确定性结算写进当前锚楼，再创建玩家／助手两楼演出正文。
 * 普通重掷保留结算；只有“撤回整个回合”恢复锚楼写入前的真值。
 */
export interface 即时业务撤回准备 {
  聊天ID: string;
  锚楼: number;
  锚消息签名: string;
  /** 当前锚消息携带的稳定 `_rqgy*令牌*` 集合；无令牌旧锚只能接受完整签名逐字一致。 */
  锚稳定令牌指纹: string;
  /** 忽略正文、显示名和 send_date 等宿主软改写，但真实 swipe／删楼同号重建会改变。 */
  锚分支指纹: string;
  业务前数据: SchemaType;
  业务前数据指纹: string;
  业务前聊天: 精确聊天快照;
  业务前聊天指纹: string;
}

export interface 即时业务撤回记录 extends 即时业务撤回准备 {
  版本: typeof 即时业务撤回版本;
  场景事务ID: string;
  状态: '准备中' | '已提交';
  /** 忽略同一场景票的请求世代与生成状态，其他任何差异仍会令票据失效。 */
  业务后数据指纹: string;
  完整性指纹: string;
}

export interface 即时业务撤回校验上下文 {
  当前聊天ID: string;
  当前锚楼: number;
  当前锚消息: unknown;
  当前锚分支指纹: string;
  当前锚数据: SchemaType;
  预期场景事务ID?: string;
  /** 只供“正文楼已物理删除、核心退款已写成但聊天退款中断”的启动续收口。 */
  允许业务前锚?: boolean;
}

export type 即时业务撤回判定 =
  | { 有效: true; 记录: 即时业务撤回记录; 锚状态: '业务后' | '业务前已恢复' }
  | { 有效: false; 原因: string };

function 是记录(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 正文、显示名与时间戳会被宿主在同一分支刷新时改写，不能作为唯一身份；但只有锚消息
 * 自带稳定游戏令牌时，才有证据把这种差异认作软改写。无令牌旧消息若完整签名变化，
 * 无法区分“宿主归一”与“删楼后同号重建”，必须失败关闭。
 */
export function 即时业务锚稳定令牌指纹(message: unknown): string {
  if (!是记录(message) || !是记录(message.extra)) return '';
  const 令牌们 = Object.entries(message.extra)
    .filter(
      ([键, 值]) =>
        键.startsWith('_rqgy') &&
        键.includes('令牌') &&
        (typeof 值 === 'string' || typeof 值 === 'number' || typeof 值 === 'boolean'),
    )
    .map(([键, 值]) => [键, String(值)] as [string, string])
    .sort(([a], [b]) => a.localeCompare(b));
  return 令牌们.length ? 时间状态指纹(令牌们) : '';
}

export function 即时业务锚消息身份匹配(
  锚: Pick<即时业务撤回准备, '锚消息签名' | '锚稳定令牌指纹'>,
  message: unknown,
): boolean {
  const 当前签名 = 手机锚消息签名(message);
  if (锚.锚消息签名 === 当前签名) return true;
  if (!锚.锚稳定令牌指纹 || 即时业务锚稳定令牌指纹(message) !== 锚.锚稳定令牌指纹) return false;
  return 手机锚消息签名匹配(锚.锚消息签名, message);
}

function 是精确聊天值(value: unknown): boolean {
  if (!是记录(value) || typeof value.存在 !== 'boolean' || !Object.prototype.hasOwnProperty.call(value, '值')) {
    return false;
  }
  return value.值未定义 === undefined || (typeof value.值未定义 === 'boolean' && (!value.值未定义 || value.存在));
}

function 是精确聊天快照(value: unknown): value is 精确聊天快照 {
  return 是记录(value) && Object.values(value).every(是精确聊天值);
}

function 规范即时业务后数据(data: SchemaType, 场景事务ID: string): SchemaType | null {
  const 规范 = Schema.parse(_.cloneDeep(data)) as SchemaType;
  const txn = 规范.系统._场景剧情事务;
  if (!场景事务ID || txn.id !== 场景事务ID) return null;
  // 首次失败、刷新恢复和重试只改变这两个生命周期字段，不能因此丢失撤回能力。
  txn.请求世代 = 0;
  txn.状态 = '';
  return 规范;
}

function 即时业务后数据指纹(data: SchemaType, 场景事务ID: string): string {
  const 规范 = 规范即时业务后数据(data, 场景事务ID);
  return 规范 ? 时间状态指纹(规范) : '';
}

function 记录完整性载荷(record: Omit<即时业务撤回记录, '完整性指纹'>): unknown {
  return {
    版本: record.版本,
    聊天ID: record.聊天ID,
    锚楼: record.锚楼,
    锚消息签名: record.锚消息签名,
    锚稳定令牌指纹: record.锚稳定令牌指纹,
    锚分支指纹: record.锚分支指纹,
    场景事务ID: record.场景事务ID,
    状态: record.状态,
    业务前数据指纹: record.业务前数据指纹,
    业务前聊天指纹: record.业务前聊天指纹,
    业务后数据指纹: record.业务后数据指纹,
  };
}

function 重签即时业务撤回记录(record: Omit<即时业务撤回记录, '完整性指纹'>): 即时业务撤回记录 {
  const 安全 = _.cloneDeep(record) as Omit<即时业务撤回记录, '完整性指纹'>;
  return { ...安全, 完整性指纹: 时间状态指纹(记录完整性载荷(安全)) };
}

export function 创建即时业务撤回准备(参数: {
  聊天ID: string;
  锚楼: number;
  锚消息签名: string;
  锚稳定令牌指纹: string;
  锚分支指纹: string;
  业务前数据: SchemaType;
  业务前聊天: 精确聊天快照;
}): 即时业务撤回准备 {
  const 聊天ID = String(参数.聊天ID ?? '').trim();
  const 锚楼 = Number(参数.锚楼);
  const 锚消息签名 = String(参数.锚消息签名 ?? '');
  const 锚稳定令牌指纹 = String(参数.锚稳定令牌指纹 ?? '').trim();
  const 锚分支指纹 = String(参数.锚分支指纹 ?? '').trim();
  if (!聊天ID || !Number.isInteger(锚楼) || 锚楼 < 0 || !锚消息签名 || !锚分支指纹) {
    throw new Error('即时业务撤回准备缺少有效的聊天或锚点身份');
  }
  if (!是精确聊天快照(参数.业务前聊天)) {
    throw new Error('即时业务撤回准备缺少完整的业务前聊天快照');
  }
  const 业务前数据 = Schema.parse(_.cloneDeep(参数.业务前数据)) as SchemaType;
  const 业务前聊天 = _.cloneDeep(参数.业务前聊天) as 精确聊天快照;
  return {
    聊天ID,
    锚楼,
    锚消息签名,
    锚稳定令牌指纹,
    锚分支指纹,
    业务前数据,
    业务前数据指纹: 时间状态指纹(业务前数据),
    业务前聊天,
    业务前聊天指纹: 时间状态指纹(业务前聊天),
  };
}

export function 创建即时业务撤回记录(
  准备: 即时业务撤回准备,
  场景事务ID原: string,
): 即时业务撤回记录 {
  const 场景事务ID = String(场景事务ID原 ?? '').trim();
  if (!场景事务ID) throw new Error('即时业务撤回记录缺少场景事务身份');
  const 安全准备 = 创建即时业务撤回准备(准备);
  return 重签即时业务撤回记录({
    版本: 即时业务撤回版本,
    ...安全准备,
    场景事务ID,
    状态: '准备中',
    业务后数据指纹: '',
  });
}

export function 读取即时业务撤回记录(value: unknown): 即时业务撤回记录 | null {
  if (!是记录(value)) return null;
  if (
    value.版本 !== 即时业务撤回版本 ||
    typeof value.聊天ID !== 'string' ||
    !value.聊天ID.trim() ||
    !Number.isInteger(value.锚楼) ||
    Number(value.锚楼) < 0 ||
    typeof value.锚消息签名 !== 'string' ||
    !value.锚消息签名 ||
    typeof value.锚稳定令牌指纹 !== 'string' ||
    typeof value.锚分支指纹 !== 'string' ||
    !value.锚分支指纹.trim() ||
    typeof value.场景事务ID !== 'string' ||
    !value.场景事务ID.trim() ||
    !['准备中', '已提交'].includes(String(value.状态)) ||
    typeof value.业务前数据指纹 !== 'string' ||
    !value.业务前数据指纹 ||
    typeof value.业务前聊天指纹 !== 'string' ||
    !value.业务前聊天指纹 ||
    typeof value.业务后数据指纹 !== 'string' ||
    typeof value.完整性指纹 !== 'string' ||
    !value.完整性指纹 ||
    !是精确聊天快照(value.业务前聊天)
  ) {
    return null;
  }
  if (value.状态 === '已提交' && !value.业务后数据指纹) return null;
  if (value.状态 === '准备中' && value.业务后数据指纹) return null;

  try {
    const 业务前数据 = Schema.parse(_.cloneDeep(value.业务前数据)) as SchemaType;
    const 业务前聊天 = _.cloneDeep(value.业务前聊天) as 精确聊天快照;
    if (
      时间状态指纹(业务前数据) !== value.业务前数据指纹 ||
      时间状态指纹(业务前聊天) !== value.业务前聊天指纹
    ) {
      return null;
    }
    const 无签名 = {
      版本: 即时业务撤回版本,
      聊天ID: value.聊天ID,
      锚楼: Number(value.锚楼),
      锚消息签名: value.锚消息签名,
      锚稳定令牌指纹: value.锚稳定令牌指纹,
      锚分支指纹: value.锚分支指纹,
      业务前数据,
      业务前数据指纹: value.业务前数据指纹,
      业务前聊天,
      业务前聊天指纹: value.业务前聊天指纹,
      场景事务ID: value.场景事务ID,
      状态: value.状态 as 即时业务撤回记录['状态'],
      业务后数据指纹: value.业务后数据指纹,
    } satisfies Omit<即时业务撤回记录, '完整性指纹'>;
    if (时间状态指纹(记录完整性载荷(无签名)) !== value.完整性指纹) return null;
    return { ...无签名, 完整性指纹: value.完整性指纹 };
  } catch {
    return null;
  }
}

export function 完成即时业务撤回记录(value: unknown, 业务后数据原: SchemaType): 即时业务撤回记录 {
  const record = 读取即时业务撤回记录(value);
  if (!record) throw new Error('即时业务撤回记录损坏，不能确认业务提交');
  const 业务后数据 = Schema.parse(_.cloneDeep(业务后数据原)) as SchemaType;
  const 业务后数据指纹 = 即时业务后数据指纹(业务后数据, record.场景事务ID);
  if (!业务后数据指纹) throw new Error('即时业务撤回记录与当前场景事务不一致');
  return 重签即时业务撤回记录({ ...record, 状态: '已提交', 业务后数据指纹 });
}

export function 核验即时业务撤回记录(
  value: unknown,
  上下文: 即时业务撤回校验上下文,
): 即时业务撤回判定 {
  const record = 读取即时业务撤回记录(value);
  if (!record) return { 有效: false, 原因: '即时业务撤回记录损坏或版本不受支持' };
  if (record.聊天ID !== 上下文.当前聊天ID) return { 有效: false, 原因: '即时业务撤回记录属于另一聊天' };
  if (record.锚楼 !== 上下文.当前锚楼) return { 有效: false, 原因: '即时业务撤回记录的锚楼已经变化' };
  if (!即时业务锚消息身份匹配(record, 上下文.当前锚消息)) {
    return { 有效: false, 原因: '即时业务撤回记录所在消息已经切换分支或被同楼重建' };
  }
  if (record.锚分支指纹 !== 上下文.当前锚分支指纹) {
    return { 有效: false, 原因: '即时业务撤回记录所在消息已被删楼同号重建或前缀分支已经变化' };
  }
  if (上下文.预期场景事务ID && record.场景事务ID !== 上下文.预期场景事务ID) {
    return { 有效: false, 原因: '即时业务撤回记录不属于当前场景事务' };
  }

  let 当前锚数据: SchemaType;
  try {
    当前锚数据 = Schema.parse(_.cloneDeep(上下文.当前锚数据)) as SchemaType;
  } catch {
    return { 有效: false, 原因: '即时业务锚楼的MVU数据损坏' };
  }
  if (
    上下文.允许业务前锚 &&
    record.状态 === '已提交' &&
    时间状态指纹(当前锚数据) === record.业务前数据指纹
  ) {
    return { 有效: true, 记录: record, 锚状态: '业务前已恢复' };
  }
  if (当前锚数据.系统._场景剧情事务.id !== record.场景事务ID) {
    return { 有效: false, 原因: '即时业务锚楼已经不再持有原场景事务' };
  }
  const 当前指纹 = 即时业务后数据指纹(当前锚数据, record.场景事务ID);
  if (!当前指纹) return { 有效: false, 原因: '即时业务锚楼无法建立提交指纹' };
  if (record.状态 === '已提交' && 当前指纹 !== record.业务后数据指纹) {
    return { 有效: false, 原因: '即时业务锚楼除重试状态外已经发生其他改写' };
  }
  try {
    return {
      有效: true,
      记录: record.状态 === '已提交' ? record : 完成即时业务撤回记录(record, 当前锚数据),
      锚状态: '业务后',
    };
  } catch (error) {
    return { 有效: false, 原因: error instanceof Error ? error.message : String(error) };
  }
}

function 读取即时业务前数据指纹(value: unknown): string {
  const record = 读取即时业务撤回记录(value);
  if (record) return record.业务前数据指纹;
  // 捕获阶段尚未分配场景事务 ID，因此此处拿到的是准备票而不是完整撤回记录。
  // 仍需重算快照指纹，避免把被改写的伪准备票当作真实业务前状态。
  if (!是记录(value) || typeof value.业务前数据指纹 !== 'string' || !value.业务前数据指纹) return '';
  try {
    const 业务前数据 = Schema.parse(_.cloneDeep(value.业务前数据)) as SchemaType;
    const 指纹 = 时间状态指纹(业务前数据);
    return 指纹 === value.业务前数据指纹 ? 指纹 : '';
  } catch {
    return '';
  }
}

export function 即时业务锚仍是业务前状态(value: unknown, 当前锚数据原: SchemaType): boolean {
  const 业务前数据指纹 = 读取即时业务前数据指纹(value);
  if (!业务前数据指纹) return false;
  try {
    const 当前锚数据 = Schema.parse(_.cloneDeep(当前锚数据原)) as SchemaType;
    return 时间状态指纹(当前锚数据) === 业务前数据指纹;
  } catch {
    return false;
  }
}

export function 即时业务撤回聊天快照完整(value: unknown, keys: readonly string[]): boolean {
  const record = 读取即时业务撤回记录(value);
  if (!record) return false;
  return keys.every(key => 是精确聊天值(record.业务前聊天[key]));
}

export function 恢复即时业务撤回聊天变量(
  vars: Record<string, unknown>,
  value: unknown,
  keys: readonly string[],
): void {
  const record = 读取即时业务撤回记录(value);
  if (!record || !即时业务撤回聊天快照完整(record, keys)) {
    throw new Error('即时业务撤回记录缺少完整的业务前聊天快照');
  }
  恢复精确聊天快照(vars, record.业务前聊天, keys);
}
