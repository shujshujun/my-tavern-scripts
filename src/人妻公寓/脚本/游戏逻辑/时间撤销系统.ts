import { Schema, 当前MVU数据版本, type SchemaType } from '../../schema';
import { PROMOTE_MIRROR_KEY } from './守护系统';
import { 到次日早晨间隔 } from './楼层时钟';
import type { 时间推进地点, 时间推进方式 } from './时间推进系统';

/** 时间事务结束后仍停留在原地的合法撤销入口。 */
export const 时间撤销地点 = ['管理员室', '302', '晨跑公园', '健身房'] as const satisfies readonly 时间推进地点[];

export function 是时间撤销地点(地点: string | null | undefined): 地点 is 时间推进地点 {
  return 时间撤销地点.includes(地点 as (typeof 时间撤销地点)[number]);
}

/**
 * 玩家主动时间推进只保留一个撤销点。它属于聊天分支状态而非 MVU 正式字段，避免给
 * Schema 增加一套永久业务状态；下一次成功推进会整值覆盖，成功撤销后立即删除。
 */
export const 时间撤销点键 = '_时间撤销点';
export const 时间撤销点版本 = 2 as const;
/** 跨聊天重载时用于恢复双存储半事务；正常提交会在同一次 chat 写入中删除。 */
export const 时间推进事务键 = '_时间推进事务';
export const 时间推进事务版本 = 1 as const;

/** 时间推进会清空/替换的全部聊天键；推进失败与撤销时必须逐键精确恢复。 */
export const 时间推进清场聊天键 = [
  '_场景',
  '_粘滞',
  '_赴约',
  '_在场',
  '_行动选项',
  '_地图轨迹',
  '_无耗时拜访',
  '_上次回合',
  '_上次隔离回合',
] as const;

/**
 * 保护镜像与换装余波可能由时间事务后的异步收口改写。它们不是 MVU 字段，却会影响
 * 后续回合，所以与清场键一起保存推进前原值。
 */
export const 时间撤销恢复聊天键 = [
  ...时间推进清场聊天键,
  '_换装余波',
  PROMOTE_MIRROR_KEY,
  // 晨跑、健身和睡眠的普通反馈只保存在独立日志中；撤销时间必须连同这段反馈一起撤销。
  '_隔离事件',
] as const;

/** 撤销会额外裁剪手机；失败回滚需要把这些键也原样放回。 */
export const 时间撤销写入聊天键 = [...时间撤销恢复聊天键, '_微信', 时间撤销点键] as const;

/** 时间推进自身可能改写的键；中断恢复会精确还原这些键，不触碰同期无关手机消息。 */
export const 时间推进事务恢复聊天键 = [...时间推进清场聊天键, '_隔离事件', 时间撤销点键] as const;

export interface 精确聊天值 {
  存在: boolean;
  值: unknown;
  /** JSON 不保存 undefined；该标志保留“键存在但值为 undefined”这一少见状态。 */
  值未定义?: boolean;
}

export type 精确聊天快照 = Record<string, 精确聊天值>;

export interface 时间撤销点 {
  版本: typeof 时间撤销点版本;
  聊天ID: string;
  锚楼: number;
  锚消息签名: string;
  方式: 时间推进方式;
  起始绝对时段: number;
  结束绝对时段: number;
  推进前数据: SchemaType;
  推进前数据指纹: string;
  推进前聊天: 精确聊天快照;
  推进前聊天指纹: string;
  推进后数据指纹: string;
  推进后聊天指纹: string;
}

export interface 时间推进事务记录 {
  版本: typeof 时间推进事务版本;
  事务ID: string;
  聊天ID: string;
  创建时间: number;
  推进前数据: SchemaType;
  推进前数据指纹: string;
  推进前聊天: 精确聊天快照;
  推进前聊天指纹: string;
}

export interface 创建时间撤销点参数 {
  聊天ID: string;
  锚楼: number;
  锚消息签名: string;
  方式: 时间推进方式;
  推进前数据: SchemaType;
  推进后数据: SchemaType;
  推进前聊天快照: 精确聊天快照;
  推进后聊天变量: Record<string, unknown>;
}

export interface 时间撤销校验上下文 {
  当前数据: SchemaType;
  当前聊天变量: Record<string, unknown>;
  当前聊天ID: string;
  当前楼: number;
  当前锚消息签名: string;
}

export type 时间撤销判定 = { 有效: true; 撤销点: 时间撤销点 } | { 有效: false; 原因: string };

const 聊天指纹忽略键 = new Set<string>([
  时间撤销点键,
  时间推进事务键,
  '_微信',
  '_整表视图',
  '_换装余波',
  PROMOTE_MIRROR_KEY,
]);

function 是记录(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function 读MVU版本(value: unknown): number | undefined {
  if (!是记录(value) || !是记录(value.系统)) return undefined;
  const 版本 = Number(value.系统._数据版本);
  return Number.isInteger(版本) ? 版本 : undefined;
}

/**
 * JSON.stringify 会丢 undefined、NaN 等值，不能用于状态一致性门。这里为全部 JS 基本值
 * 加类型标签、对象键排序，并拒绝循环引用，得到同值同串的规范表示。
 */
function 规范序列化(value: unknown, 路径对象 = new Set<object>()): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'undefined':
      return 'u';
    case 'boolean':
      return value ? 'b1' : 'b0';
    case 'number':
      if (Number.isNaN(value)) return 'nNaN';
      if (value === Infinity) return 'n+Inf';
      if (value === -Infinity) return 'n-Inf';
      if (Object.is(value, -0)) return 'n-0';
      return `n${value}`;
    case 'bigint':
      return `i${value.toString()}`;
    case 'string':
      return `s${JSON.stringify(value)}`;
    case 'symbol':
      return `y${JSON.stringify(value.description ?? '')}`;
    case 'function':
      return `f${JSON.stringify(value.name)}`;
    case 'object': {
      const 对象 = value as object;
      if (路径对象.has(对象)) throw new Error('状态包含循环引用');
      路径对象.add(对象);
      try {
        if (Array.isArray(value)) return `a[${value.map(item => 规范序列化(item, 路径对象)).join(',')}]`;
        if (value instanceof Date) return `d${JSON.stringify(value.toISOString())}`;
        const 记录 = value as Record<string, unknown>;
        return `o{${Object.keys(记录)
          .sort()
          .map(key => `${JSON.stringify(key)}:${规范序列化(记录[key], 路径对象)}`)
          .join(',')}}`;
      } finally {
        路径对象.delete(对象);
      }
    }
  }
  throw new Error('无法序列化未知状态类型');
}

/** 四路 32-bit 混合并带规范串长度；只持久化短指纹，不复制第二份完整 MVU。 */
export function 时间状态指纹(value: unknown): string {
  const text = 规范序列化(value);
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x85ebca6b;
  let h4 = 0xc2b2ae35;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ (code + i), 0x5bd1e995);
    h3 = Math.imul(h3 + code, 0x27d4eb2d) ^ (h3 >>> 15);
    h4 ^= code;
    h4 = Math.imul(h4, 0x85ebca6b);
    h4 ^= h4 >>> 13;
  }
  const 十六进制 = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `tf1:${text.length}:${十六进制(h1)}${十六进制(h2)}${十六进制(h3)}${十六进制(h4)}`;
}

function 聊天一致性视图(vars: Record<string, unknown>): Record<string, unknown> {
  const 微信 = 是记录(vars._微信) ? vars._微信 : {};
  const 消息 = Array.isArray(微信.消息) ? 微信.消息 : [];
  // 自动对方消息允许在时间推进后异步落地，撤销时会按双轴裁掉；玩家亲手发送、通话或
  // 撤回则属于不可无声抹掉的主动行为，必须参加一致性校验并令旧撤销点失效。
  const 玩家手机消息 = 消息.filter(item => 是记录(item) && item.发 === '我');
  return {
    常规聊天变量: Object.fromEntries(Object.entries(vars).filter(([key]) => !聊天指纹忽略键.has(key))),
    玩家手机消息,
  };
}

export function 时间聊天状态指纹(vars: Record<string, unknown>): string {
  return 时间状态指纹(聊天一致性视图(vars));
}

export function 捕获精确聊天快照(vars: Record<string, unknown>, keys: readonly string[]): 精确聊天快照 {
  return Object.fromEntries(
    keys.map(key => {
      const 存在 = Object.prototype.hasOwnProperty.call(vars, key);
      const 值未定义 = 存在 && vars[key] === undefined;
      return [
        key,
        {
          存在,
          // 缺失键也必须给出 JSON-safe 值，否则 JSON 落盘会删属性并把正常撤销点判坏。
          值: 值未定义 || !存在 ? null : _.cloneDeep(vars[key]),
          ...(值未定义 ? { 值未定义: true } : {}),
        },
      ];
    }),
  );
}

export function 恢复精确聊天快照(
  vars: Record<string, unknown>,
  快照: 精确聊天快照,
  keys: readonly string[] = Object.keys(快照),
): void {
  for (const key of keys) {
    const 记录 = 快照[key];
    if (!记录) throw new Error(`聊天快照缺少 ${key}`);
    if (记录.存在) vars[key] = 记录.值未定义 ? undefined : _.cloneDeep(记录.值);
    else delete vars[key];
  }
}

function 聊天快照包含键(value: unknown, keys: readonly string[]): value is 精确聊天快照 {
  if (!是记录(value)) return false;
  return keys.every(key => {
    const item = value[key];
    return (
      是记录(item) &&
      typeof item.存在 === 'boolean' &&
      Object.prototype.hasOwnProperty.call(item, '值') &&
      (item.值未定义 === undefined || typeof item.值未定义 === 'boolean') &&
      (!item.值未定义 || item.存在)
    );
  });
}

export function 创建时间推进事务记录(参数: {
  聊天ID: string;
  推进前数据: SchemaType;
  推进前聊天: 精确聊天快照;
}): 时间推进事务记录 {
  if (!参数.聊天ID) throw new Error('时间推进事务缺少聊天身份');
  if (!聊天快照包含键(参数.推进前聊天, 时间推进事务恢复聊天键)) {
    throw new Error('时间推进事务的聊天快照不完整');
  }
  const 推进前数据 = Schema.parse(_.cloneDeep(参数.推进前数据)) as SchemaType;
  if (读MVU版本(推进前数据) !== 当前MVU数据版本) throw new Error('时间推进事务只能保存当前版本 MVU');
  const 推进前聊天 = _.cloneDeep(参数.推进前聊天) as 精确聊天快照;
  const 创建时间 = Date.now();
  return {
    版本: 时间推进事务版本,
    事务ID: `${创建时间}-${时间状态指纹([参数.聊天ID, 推进前数据.系统._绝对时段]).slice(-12)}`,
    聊天ID: 参数.聊天ID,
    创建时间,
    推进前数据,
    推进前数据指纹: 时间状态指纹(推进前数据),
    推进前聊天,
    推进前聊天指纹: 时间状态指纹(推进前聊天),
  };
}

/** 损坏记录返回 null；调用方必须停止玩法而非猜测恢复，避免把未知状态越修越坏。 */
export function 读取时间推进事务记录(raw: unknown): 时间推进事务记录 | null {
  if (
    !是记录(raw) ||
    raw.版本 !== 时间推进事务版本 ||
    typeof raw.事务ID !== 'string' ||
    !raw.事务ID ||
    typeof raw.聊天ID !== 'string' ||
    !raw.聊天ID ||
    typeof raw.创建时间 !== 'number' ||
    !Number.isFinite(raw.创建时间) ||
    typeof raw.推进前数据指纹 !== 'string' ||
    typeof raw.推进前聊天指纹 !== 'string' ||
    !聊天快照包含键(raw.推进前聊天, 时间推进事务恢复聊天键)
  ) {
    return null;
  }
  const 解析 = Schema.safeParse(_.cloneDeep(raw.推进前数据));
  if (!解析.success || 读MVU版本(解析.data) !== 当前MVU数据版本) return null;
  const 推进前数据 = 解析.data as SchemaType;
  const 推进前聊天 = _.cloneDeep(raw.推进前聊天) as 精确聊天快照;
  if (
    时间状态指纹(推进前数据) !== raw.推进前数据指纹 ||
    时间状态指纹(推进前聊天) !== raw.推进前聊天指纹
  ) {
    return null;
  }
  return {
    版本: 时间推进事务版本,
    事务ID: raw.事务ID,
    聊天ID: raw.聊天ID,
    创建时间: raw.创建时间,
    推进前数据,
    推进前数据指纹: raw.推进前数据指纹,
    推进前聊天,
    推进前聊天指纹: raw.推进前聊天指纹,
  };
}

export interface 时间推进双存储提交参数 {
  写推进状态: () => void | Promise<unknown>;
  写撤销点: () => void | Promise<unknown>;
  恢复推进前状态: () => void | Promise<unknown>;
  恢复推进前聊天: () => void | Promise<unknown>;
}

/**
 * chat 与 MVU 没有共同数据库事务，只能做顺序提交和补偿：先确认 stat 成功，才创建新
 * 撤销点；任一步失败都先补偿 stat、再补偿 chat。调用前的清场也由聊天备份覆盖。
 */
export async function 执行时间推进双存储提交(参数: 时间推进双存储提交参数): Promise<void> {
  try {
    await 参数.写推进状态();
    await 参数.写撤销点();
  } catch (error) {
    const 补偿错误: string[] = [];
    try {
      await 参数.恢复推进前状态();
    } catch (补偿) {
      补偿错误.push(`MVU 回滚失败:${补偿 instanceof Error ? 补偿.message : String(补偿)}`);
    }
    try {
      await 参数.恢复推进前聊天();
    } catch (补偿) {
      补偿错误.push(`聊天回滚失败:${补偿 instanceof Error ? 补偿.message : String(补偿)}`);
    }
    if (补偿错误.length) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}；${补偿错误.join('；')}`, {
        cause: error,
      });
    }
    throw error;
  }
}

function 聊天快照结构有效(value: unknown): value is 精确聊天快照 {
  if (!是记录(value)) return false;
  return 时间撤销恢复聊天键.every(key => {
    const item = value[key];
    return (
      是记录(item) &&
      typeof item.存在 === 'boolean' &&
      Object.prototype.hasOwnProperty.call(item, '值') &&
      (item.值未定义 === undefined || typeof item.值未定义 === 'boolean') &&
      (!item.值未定义 || item.存在)
    );
  });
}

export function 创建时间撤销点(参数: 创建时间撤销点参数): 时间撤销点 {
  if (!参数.聊天ID || !Number.isInteger(参数.锚楼) || 参数.锚楼 < 0 || !参数.锚消息签名) {
    throw new Error('无法为当前聊天建立安全的时间撤销锚');
  }
  if (读MVU版本(参数.推进前数据) !== 当前MVU数据版本 || 读MVU版本(参数.推进后数据) !== 当前MVU数据版本) {
    throw new Error('只能为当前版本 MVU 建立时间撤销点');
  }
  if (!聊天快照结构有效(参数.推进前聊天快照)) throw new Error('时间撤销聊天快照不完整');
  const 推进前数据 = Schema.parse(_.cloneDeep(参数.推进前数据)) as SchemaType;
  const 推进后数据 = Schema.parse(_.cloneDeep(参数.推进后数据)) as SchemaType;
  const 起始绝对时段 = 推进前数据.系统._绝对时段;
  const 结束绝对时段 = 推进后数据.系统._绝对时段;
  if (!Number.isInteger(起始绝对时段) || !Number.isInteger(结束绝对时段) || 结束绝对时段 <= 起始绝对时段) {
    throw new Error('时间推进前后水位无效');
  }
  if (['推进一时段', '小憩', '晨跑', '健身'].includes(参数.方式) && 结束绝对时段 !== 起始绝对时段 + 1) {
    throw new Error('单时段推进跨度无效');
  }
  if (参数.方式 === '睡到次日早晨' && 结束绝对时段 !== 起始绝对时段 + 到次日早晨间隔(起始绝对时段)) {
    throw new Error('睡眠推进跨度无效');
  }
  if (!['推进一时段', '睡到次日早晨', '小憩', '晨跑', '健身'].includes(参数.方式)) {
    throw new Error('时间推进方式无效');
  }
  const 推进前聊天 = _.cloneDeep(参数.推进前聊天快照) as 精确聊天快照;
  return {
    版本: 时间撤销点版本,
    聊天ID: 参数.聊天ID,
    锚楼: 参数.锚楼,
    锚消息签名: 参数.锚消息签名,
    方式: 参数.方式,
    起始绝对时段,
    结束绝对时段,
    推进前数据,
    推进前数据指纹: 时间状态指纹(推进前数据),
    推进前聊天,
    推进前聊天指纹: 时间状态指纹(推进前聊天),
    推进后数据指纹: 时间状态指纹(推进后数据),
    推进后聊天指纹: 时间聊天状态指纹(参数.推进后聊天变量),
  };
}

function 无效(原因: string): 时间撤销判定 {
  return { 有效: false, 原因 };
}

/**
 * UI 只用本函数决定是否展示；真正撤销前后端会再次以最新 stat/chat/聊天锚完整校验。
 * 任何不能证明安全的旧格式、损坏或已过期撤销点都失败关闭。
 */
export function 判定时间撤销点(raw: unknown, 上下文: 时间撤销校验上下文): 时间撤销判定 {
  try {
    if (!是记录(raw) || raw.版本 !== 时间撤销点版本) return 无效('撤销点版本无效');
    if (读MVU版本(上下文.当前数据) !== 当前MVU数据版本) return 无效('当前 MVU 版本不受支持');
    if (读MVU版本(raw.推进前数据) !== 当前MVU数据版本) return 无效('推进前 MVU 版本不受支持');
    if (
      typeof raw.聊天ID !== 'string' ||
      !raw.聊天ID ||
      !Number.isInteger(raw.锚楼) ||
      Number(raw.锚楼) < 0 ||
      typeof raw.锚消息签名 !== 'string' ||
      !raw.锚消息签名 ||
      !['推进一时段', '睡到次日早晨', '小憩', '晨跑', '健身'].includes(String(raw.方式)) ||
      !Number.isInteger(raw.起始绝对时段) ||
      !Number.isInteger(raw.结束绝对时段)
    ) {
      return 无效('撤销点结构损坏');
    }
    if (
      typeof raw.推进前数据指纹 !== 'string' ||
      typeof raw.推进前聊天指纹 !== 'string' ||
      typeof raw.推进后数据指纹 !== 'string' ||
      typeof raw.推进后聊天指纹 !== 'string' ||
      !聊天快照结构有效(raw.推进前聊天)
    ) {
      return 无效('撤销点快照不完整');
    }

    const 前解析 = Schema.safeParse(_.cloneDeep(raw.推进前数据));
    const 当前解析 = Schema.safeParse(_.cloneDeep(上下文.当前数据));
    if (!前解析.success || !当前解析.success) return 无效('撤销点 MVU 无法解析');
    const 前数据 = 前解析.data as SchemaType;
    const 当前数据 = 当前解析.data as SchemaType;
    if (
      前数据.系统._绝对时段 !== raw.起始绝对时段 ||
      当前数据.系统._绝对时段 !== raw.结束绝对时段 ||
      Number(raw.结束绝对时段) <= Number(raw.起始绝对时段)
    ) {
      return 无效('世界时间已变化');
    }
    if (
      ['推进一时段', '小憩', '晨跑', '健身'].includes(String(raw.方式)) &&
      raw.结束绝对时段 !== raw.起始绝对时段 + 1
    ) {
      return 无效('时间推进跨度无效');
    }
    if (
      raw.方式 === '睡到次日早晨' &&
      raw.结束绝对时段 !== raw.起始绝对时段 + 到次日早晨间隔(raw.起始绝对时段 as number)
    ) {
      return 无效('睡眠推进跨度无效');
    }
    if (上下文.当前聊天ID !== raw.聊天ID || 上下文.当前楼 !== raw.锚楼 || 上下文.当前锚消息签名 !== raw.锚消息签名) {
      return 无效('聊天分支锚已变化');
    }
    if (时间状态指纹(前数据) !== raw.推进前数据指纹) return 无效('推进前 MVU 快照损坏');
    if (时间状态指纹(raw.推进前聊天) !== raw.推进前聊天指纹) return 无效('推进前聊天快照损坏');
    if (时间状态指纹(当前数据) !== raw.推进后数据指纹) return 无效('推进后的 MVU 已变化');
    if (时间聊天状态指纹(上下文.当前聊天变量) !== raw.推进后聊天指纹) {
      return 无效('推进后的聊天状态已变化');
    }

    return {
      有效: true,
      撤销点: {
        版本: 时间撤销点版本,
        聊天ID: raw.聊天ID,
        锚楼: raw.锚楼 as number,
        锚消息签名: raw.锚消息签名,
        方式: raw.方式 as 时间推进方式,
        起始绝对时段: raw.起始绝对时段 as number,
        结束绝对时段: raw.结束绝对时段 as number,
        推进前数据: 前数据,
        推进前数据指纹: raw.推进前数据指纹,
        推进前聊天: _.cloneDeep(raw.推进前聊天),
        推进前聊天指纹: raw.推进前聊天指纹,
        推进后数据指纹: raw.推进后数据指纹,
        推进后聊天指纹: raw.推进后聊天指纹,
      },
    };
  } catch (error) {
    return 无效(error instanceof Error ? error.message : '撤销点校验失败');
  }
}
