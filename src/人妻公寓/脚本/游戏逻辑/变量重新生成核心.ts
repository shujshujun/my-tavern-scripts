import type { SchemaType } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import type { AI可写变量范围 } from './mvuIO';
import {
  记录本轮有效成长,
  结算妻冷落,
  type 冷落妻状态,
  type 妻成长记录结果,
  type 合法正候选表,
} from './冷落系统';
import type { 数值成长来源 } from './冷落成长核心';

/**
 * “重新生成变量”只替换 AI 在该回合拥有写权的结果；脚本结算、回合后 UI 操作与
 * 全局机制字段继续以当前真值为准。该快照只保存少量可替换叶子，不复制整份存档。
 */
export interface 变量重生成AI结果快照 {
  户: Record<
    string,
    {
      妻?: {
        好感值: number;
        堕落值?: number;
        当前心理想法: string;
        当前情绪: string;
        外装: string;
        内衣: string;
        妆容: string;
        身体开发?: { 小嘴: number; 胸部: number; 小屄: number; 屁穴: number };
        _堕落日账: { 日: number; 值: number };
      };
      夫?: { 当前心理想法: string; 当前情绪: string };
    }
  >;
}

/**
 * 只记录本回合里会随 AI 数值改变的可逆账目。它最多覆盖六户妻状态和少量疑心数字，
 * 不复制第二份整表，也不包含会播放剧情、抽随机数或发消息的一次性副作用。
 */
export interface 变量重生成派生票据 {
  当前绝对时段: number;
  母亲入列: boolean;
  妻: Partial<
    Record<
      门牌,
      {
        回合前: 冷落妻状态;
        派生前: 冷落妻状态;
        原派生后: 冷落妻状态;
        独立合法正候选: 数值成长来源[];
        余波冻结: boolean;
      }
    >
  >;
  疑心: Partial<
    Record<
      门牌,
      {
        回合前堕落: number;
        原贡献: number;
        冻结: boolean;
      }
    >
  >;
  /** 连续反感会写聊天在场/赴约状态；下降资格改变时不能追改已经发生的离场。 */
  不可逆反感资格?: Partial<
    Record<门牌, { 回合前好感: number; 原AI后脚本差值: number; 原本下降: boolean }>
  >;
  /** 只有这些户的身体增长曾参与“是否建立亲密账本”的判定。 */
  不可逆身体增长资格?: Partial<Record<门牌, boolean>>;
  /** 丈夫打断已在本轮读取过该疑心水位；贡献改变时不能补掷或撤销剧情。 */
  不可逆疑心门牌?: 门牌;
  /** 母亲撞见会写一次性剧情/随机事件；正向资格若改变，只能失败关闭，不能重演。 */
  不可逆撞见资格?: { 门牌: 门牌; 原本正向: boolean };
}

export interface 变量重生成派生重算结果 {
  妻: Partial<Record<门牌, 冷落妻状态>>;
  成长: 妻成长记录结果[];
}

const 妻文本字段 = ['当前心理想法', '当前情绪', '外装', '内衣', '妆容'] as const;
const 开发字段 = ['小嘴', '胸部', '小屄', '屁穴'] as const;

/**
 * 把“本回合变量重算”和“本回合后独立脚本变化”按顶层责任字段三方合并。
 * 两边只要有一边没碰该字段，就保留另一边；两边改成同一结果也安全。只有双方把
 * 同一责任字段改成不同结果时返回 null，交给调用方在写入前失败关闭。
 */
export function 三方合并变量重生成对象<T extends object>(
  基线: T,
  重算: T,
  独立变化: T,
): T | null {
  const 基线表 = 基线 as Record<string, unknown>;
  const 重算表 = 重算 as Record<string, unknown>;
  const 独立表 = 独立变化 as Record<string, unknown>;
  const 结果 = _.cloneDeep(重算) as Record<string, unknown>;
  for (const 字段 of _.uniq([...Object.keys(基线), ...Object.keys(重算), ...Object.keys(独立变化)])) {
    const 基线值 = 基线表[字段];
    const 重算值 = 重算表[字段];
    const 独立值 = 独立表[字段];
    if (_.isEqual(重算值, 独立值) || _.isEqual(独立值, 基线值)) continue;
    if (_.isEqual(重算值, 基线值)) {
      结果[字段] = _.cloneDeep(独立值);
      continue;
    }
    return null;
  }
  return 结果 as T;
}

/** 提取守护完成、脚本结算开始前的 AI 结果，供之后分离“模型结果”和“脚本差异”。 */
export function 提取变量重生成AI结果(
  data: SchemaType,
  范围: Pick<AI可写变量范围, '妻' | '夫' | '亲密妻'>,
): 变量重生成AI结果快照 {
  const 户: 变量重生成AI结果快照['户'] = {};
  for (const 门牌号 of _.uniq([...范围.妻, ...范围.夫])) {
    const 节点 = data.户[门牌号];
    if (!节点) continue;
    const 项: 变量重生成AI结果快照['户'][string] = {};
    if (范围.妻.includes(门牌号)) {
      项.妻 = {
        好感值: 节点.妻.好感值,
        当前心理想法: 节点.妻.当前心理想法,
        当前情绪: 节点.妻.当前情绪,
        外装: 节点.妻.外装,
        内衣: 节点.妻.内衣,
        妆容: 节点.妻.妆容,
        _堕落日账: _.cloneDeep(节点.妻._堕落日账),
        ...(范围.亲密妻.includes(门牌号)
          ? {
              堕落值: 节点.妻.堕落值,
              身体开发: _.pick(节点.妻.身体开发, 开发字段),
            }
          : {}),
      };
    }
    if (范围.夫.includes(门牌号)) {
      项.夫 = {
        当前心理想法: 节点.夫.当前心理想法,
        当前情绪: 节点.夫.当前情绪,
      };
    }
    户[门牌号] = 项;
  }
  return { 户 };
}

function 合并数值(当前值: unknown, 原AI值: unknown, 新AI值: unknown): unknown {
  if (![当前值, 原AI值, 新AI值].every(值 => typeof 值 === 'number' && Number.isFinite(值))) return 当前值;
  // 当前值 - 原 AI 值 = 本轮脚本结算 + 回合后纯脚本操作产生的差异。把它原样叠到新 AI 结果，
  // 既不会从当前终值继续滚算，也不会吞掉送礼、任务等奖励。
  return _.clamp((新AI值 as number) + (当前值 as number) - (原AI值 as number), 0, 100);
}

function 把新AI数值放入派生前(
  妻: 冷落妻状态,
  原AI妻: 变量重生成AI结果快照['户'][string]['妻'] | undefined,
  新AI妻: 变量重生成AI结果快照['户'][string]['妻'] | undefined,
): void {
  if (!原AI妻 || !新AI妻) return;
  妻.好感值 = 合并数值(妻.好感值, 原AI妻.好感值, 新AI妻.好感值) as number;
  if (原AI妻.堕落值 !== undefined && 新AI妻.堕落值 !== undefined) {
    妻.堕落值 = 合并数值(妻.堕落值, 原AI妻.堕落值, 新AI妻.堕落值) as number;
  }
  for (const 字段 of 开发字段) {
    const 原值 = 原AI妻.身体开发?.[字段];
    const 新值 = 新AI妻.身体开发?.[字段];
    if (原值 === undefined || 新值 === undefined) continue;
    妻.身体开发[字段] = 合并数值(妻.身体开发[字段], 原值, 新值) as number;
  }
}

/** 用保存的小票据重跑成长/冷落纯账目；不会调用剧情、随机事件或消息副作用。 */
export function 重算变量重生成派生(
  原AI结果: 变量重生成AI结果快照,
  新AI结果: 变量重生成AI结果快照,
  票据: 变量重生成派生票据,
  新合法正候选: 合法正候选表 = {},
): 变量重生成派生重算结果 {
  const 妻: 变量重生成派生重算结果['妻'] = {};
  const 成长: 妻成长记录结果[] = [];
  for (const [门牌号, 项] of Object.entries(票据.妻) as [门牌, NonNullable<(typeof 票据.妻)[门牌]>][]) {
    if (!项) continue;
    const 新妻 = _.cloneDeep(项.派生前) as 冷落妻状态;
    把新AI数值放入派生前(新妻, 原AI结果.户[门牌号]?.妻, 新AI结果.户[门牌号]?.妻);
    if (项.余波冻结) 新妻.堕落值 = 项.回合前.堕落值;
    const 本户候选 = _.uniq([...(项.独立合法正候选 ?? []), ...(新合法正候选[门牌号] ?? [])]);
    成长.push(
      记录本轮有效成长(
        门牌号,
        项.回合前,
        新妻,
        票据.当前绝对时段,
        票据.母亲入列,
        本户候选,
      ),
    );
    结算妻冷落(门牌号, 新妻, 票据.当前绝对时段, 票据.母亲入列);
    妻[门牌号] = 新妻;
  }
  return { 妻, 成长 };
}

/** 一次性撞见资格变化不能安全补演或撤销，必须在任何写入前拒绝本次结果。 */
export function 变量重生成有不可逆派生冲突(
  新AI结果: 变量重生成AI结果快照,
  票据: 变量重生成派生票据,
  派生重算?: 变量重生成派生重算结果,
): boolean {
  for (const [门牌号, 资格] of Object.entries(票据.不可逆反感资格 ?? {}) as [
    门牌,
    NonNullable<NonNullable<typeof 票据.不可逆反感资格>[门牌]>,
  ][]) {
    const 新好感 = 新AI结果.户[门牌号]?.妻?.好感值;
    if (!资格 || 新好感 === undefined) continue;
    const 新实际好感 = _.clamp(新好感 + 资格.原AI后脚本差值, 0, 100);
    if (新实际好感 < 资格.回合前好感 !== 资格.原本下降) return true;
  }
  for (const [门牌号, 原本增长] of Object.entries(票据.不可逆身体增长资格 ?? {}) as [门牌, boolean][]) {
    const 新妻 = 派生重算?.妻[门牌号];
    const 回合前妻 = 票据.妻[门牌号]?.回合前;
    if (!新妻 || !回合前妻) continue;
    const 新增长 = 开发字段.some(字段 => 新妻.身体开发[字段] > 回合前妻.身体开发[字段]);
    if (新增长 !== 原本增长) return true;
  }
  const 疑心门牌 = 票据.不可逆疑心门牌;
  if (疑心门牌) {
    const 疑心 = 票据.疑心[疑心门牌];
    const 新堕落 = 新AI结果.户[疑心门牌]?.妻?.堕落值;
    if (疑心 && 新堕落 !== undefined) {
      const 新增量 = Math.max(0, 新堕落 - 疑心.回合前堕落);
      const 新贡献 = 疑心.冻结 ? 0 : Math.min(Math.floor(新增量 * 0.5), 2);
      if (新贡献 !== 疑心.原贡献) return true;
    }
  }
  const 撞见 = 票据.不可逆撞见资格;
  if (!撞见) return false;
  const 新堕落 = 新AI结果.户[撞见.门牌]?.妻?.堕落值;
  if (新堕落 === undefined) return false;
  return 新堕落 - (票据.疑心[撞见.门牌]?.回合前堕落 ?? 新堕落) > 0 !== 撞见.原本正向;
}

function 合并文本(当前值: unknown, 原AI值: unknown, 新AI值: unknown): unknown {
  // 当前文本仍等于原 AI 结果，说明之后没有脚本覆盖，可以替换；否则保留脚本的新文本。
  return _.isEqual(当前值, 原AI值) ? _.cloneDeep(新AI值) : 当前值;
}

/**
 * 把新模型结果合入“现在”的整表：数值保留原 AI 结果之后的脚本差值，文本保留脚本覆盖，
 * 白名单外字段完全不碰。返回深拷贝，不修改任一入参。
 */
export function 合并重新生成变量结果(
  当前: SchemaType,
  原AI结果: 变量重生成AI结果快照,
  新AI结果: 变量重生成AI结果快照,
  范围: Pick<AI可写变量范围, '妻' | '夫' | '亲密妻'>,
  票据?: 变量重生成派生票据,
  派生重算?: 变量重生成派生重算结果,
): SchemaType {
  const 结果 = _.cloneDeep(当前) as SchemaType;
  for (const 门牌号 of _.uniq([...范围.妻, ...范围.夫])) {
    const 当前节点 = 结果.户[门牌号];
    const 原项 = 原AI结果.户[门牌号];
    const 新项 = 新AI结果.户[门牌号];
    if (!当前节点 || !原项 || !新项) continue;

    if (范围.妻.includes(门牌号) && 原项.妻 && 新项.妻) {
      const 原派生后 = 票据?.妻[门牌号 as 门牌]?.原派生后;
      const 新派生后 = 派生重算?.妻[门牌号 as 门牌];
      当前节点.妻.好感值 = 合并数值(
        当前节点.妻.好感值,
        原派生后?.好感值 ?? 原项.妻.好感值,
        新派生后?.好感值 ?? 新项.妻.好感值,
      ) as number;
      for (const 字段 of 妻文本字段) {
        当前节点.妻[字段] = 合并文本(当前节点.妻[字段], 原项.妻[字段], 新项.妻[字段]) as string;
      }
      if (范围.亲密妻.includes(门牌号) && 原项.妻.堕落值 !== undefined && 新项.妻.堕落值 !== undefined) {
        当前节点.妻.堕落值 = 合并数值(
          当前节点.妻.堕落值,
          原派生后?.堕落值 ?? 原项.妻.堕落值,
          新派生后?.堕落值 ?? 新项.妻.堕落值,
        ) as number;
        for (const 字段 of 开发字段) {
          const 原值 = 原项.妻.身体开发?.[字段];
          const 新值 = 新项.妻.身体开发?.[字段];
          if (原值 === undefined || 新值 === undefined) continue;
          当前节点.妻.身体开发[字段] = 合并数值(
            当前节点.妻.身体开发[字段],
            原派生后?.身体开发[字段] ?? 原值,
            新派生后?.身体开发[字段] ?? 新值,
          ) as number;
        }
        // 日账由守护层随 AI 堕落增长生成；没有后续写入时随新结果替换，若外部脚本确实改过则保留。
        if (_.isEqual(当前节点.妻._堕落日账, 原项.妻._堕落日账)) {
          当前节点.妻._堕落日账 = _.cloneDeep(新项.妻._堕落日账);
        }
      }
    }

    if (范围.夫.includes(门牌号) && 原项.夫 && 新项.夫) {
      当前节点.夫.当前心理想法 = 合并文本(
        当前节点.夫.当前心理想法,
        原项.夫.当前心理想法,
        新项.夫.当前心理想法,
      ) as string;
      当前节点.夫.当前情绪 = 合并文本(当前节点.夫.当前情绪, 原项.夫.当前情绪, 新项.夫.当前情绪) as string;
    }
  }

  if (票据 && 派生重算) {
    for (const [门牌号, 项] of Object.entries(票据.妻) as [门牌, NonNullable<(typeof 票据.妻)[门牌]>][]) {
      const 当前妻 = 结果.户[门牌号]?.妻;
      const 新派生妻 = 派生重算.妻[门牌号];
      if (!项 || !当前妻 || !新派生妻) continue;
      const 原成长账 = 项.原派生后._成长账;
      const 新成长账 = 新派生妻._成长账;
      当前妻._成长账.成长轮次 = Math.max(
        0,
        当前妻._成长账.成长轮次 + 新成长账.成长轮次 - 原成长账.成长轮次,
      );
      // 之后的礼物/任务若已经刷新过水位，就保留那个更晚的独立结果；未变过才替换本回合水位。
      if (当前妻._成长账.上次有效成长钟楼 === 原成长账.上次有效成长钟楼) {
        当前妻._成长账.上次有效成长钟楼 = 新成长账.上次有效成长钟楼;
      }
      if (当前妻._成长账.已结算冷落日 === 原成长账.已结算冷落日) {
        当前妻._成长账.已结算冷落日 = 新成长账.已结算冷落日;
      }
      // 余波被后续送礼/安抚推进过时属于独立操作，整张余波账保留；否则才替换本轮冷落结果。
      if (_.isEqual(当前妻._冷落余波, 项.原派生后._冷落余波)) {
        当前妻._冷落余波 = _.cloneDeep(新派生妻._冷落余波);
      }
    }
    for (const [门牌号, 疑心] of Object.entries(票据.疑心) as [门牌, NonNullable<(typeof 票据.疑心)[门牌]>][]) {
      const 节点 = 结果.户[门牌号];
      const 新堕落 = 新AI结果.户[门牌号]?.妻?.堕落值;
      if (!疑心 || !节点 || 新堕落 === undefined) continue;
      const 新增量 = Math.max(0, 新堕落 - 疑心.回合前堕落);
      const 新贡献 = 疑心.冻结 ? 0 : Math.min(Math.floor(新增量 * 0.5), 2);
      节点.夫.疑心值 = _.clamp(节点.夫.疑心值 + 新贡献 - 疑心.原贡献, 0, 100);
    }
  }
  return 结果;
}
