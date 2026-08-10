/**
 * 冷落与成长的纯规则核心。
 *
 * 本模块不读写 MVU、聊天变量或手机数据。调用方负责把最终结果落库，并确保微信收发
 * 不调用“记录有效成长”。
 */

/** 世界钟已经直接以“绝对时段”为单位：一个时段 +1，一天六个时段。 */
export const 每时段钟楼数 = 1;
export const 每日钟楼数 = 6;

/** 半日预兆、第一日、第二日、第三日及以上。 */
/** 旧阈值 12/18/36/54 钟楼按 3 钟楼=1 时段换算。 */
export const 冷落预警阈值 = [4, 6, 12, 18] as const;
export type 冷落预警档 = 0 | 1 | 2 | 3 | 4;

/** L0 至 L5 的当前阶段堕落底线。 */
export const 阶段堕落底线表 = [0, 0, 20, 40, 65, 90] as const;

export type 数值成长来源 = '好感值' | '堕落值' | '身体开发';
export type 有效成长来源 = 数值成长来源 | '阶段晋升' | '阶段线路' | '脚本事件';

export interface 成长账 {
  上次有效成长钟楼: number;
  成长轮次: number;
  已结算冷落日: number;
}

export type 余波状态 = '无' | '待诉苦' | '安抚中';

export interface 余波账 {
  状态: 余波状态;
  触发钟楼: number;
  需安抚楼: number;
  已安抚楼: number;
  上次安抚正文楼: number;
  送礼安抚日: number;
  当日送礼安抚次数: number;
}

export interface 冷落下降结算参数 {
  当前堕落值: number;
  当前阶段: number;
  已结算冷落日: number;
  距上次成长钟楼: number;
}

export interface 冷落下降结算结果 {
  堕落值: number;
  阶段底线: number;
  完整冷落日: number;
  已结算冷落日: number;
  新增冷落日: number;
  计划下降: number;
  实际下降: number;
  达到阶段底线: boolean;
  本次触底: boolean;
  受阶段底线限制: boolean;
}

function 有限数(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function 非负整数(value: number): number {
  return Math.max(0, Math.floor(有限数(value)));
}

function 限制(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 只返回当前最高档；跨过多档时不会要求补发中间档。 */
export function 计算冷落预警档(距上次成长钟楼: number): 冷落预警档 {
  const 经过 = 非负整数(距上次成长钟楼);
  if (经过 >= 冷落预警阈值[3]) return 4;
  if (经过 >= 冷落预警阈值[2]) return 3;
  if (经过 >= 冷落预警阈值[1]) return 2;
  if (经过 >= 冷落预警阈值[0]) return 1;
  return 0;
}

export function 计算完整冷落日(距上次成长钟楼: number): number {
  return Math.floor(非负整数(距上次成长钟楼) / 每日钟楼数);
}

/** 第 1 日为 2 点，随后 3、4、5 点，第 4 日起封顶为每日 5 点。 */
export function 计算第几日下降(冷落日序: number): number {
  const 日序 = 非负整数(冷落日序);
  return 日序 > 0 ? Math.min(日序 + 1, 5) : 0;
}

export function 计算累计冷落下降(起始日序: number, 结束日序: number): number {
  const 起始 = 非负整数(起始日序);
  const 结束 = 非负整数(结束日序);
  let 总下降 = 0;
  const 递增段末 = Math.min(结束, 3);
  for (let 日序 = 起始 + 1; 日序 <= 递增段末; 日序 += 1) {
    总下降 += 计算第几日下降(日序);
  }
  const 封顶段起 = Math.max(起始 + 1, 4);
  if (结束 >= 封顶段起) 总下降 += (结束 - 封顶段起 + 1) * 5;
  return 总下降;
}

export function 计算阶段堕落底线(当前阶段: number): number {
  const 阶段 = 限制(Math.floor(有限数(当前阶段)), 0, 阶段堕落底线表.length - 1);
  return 阶段堕落底线表[阶段];
}

/**
 * 惰性结算从“已结算冷落日”的下一日算到当前完整冷落日，同一时点重复调用不会重复扣除。
 */
export function 结算冷落下降(参数: 冷落下降结算参数): 冷落下降结算结果 {
  const 阶段底线 = 计算阶段堕落底线(参数.当前阶段);
  const 当前值 = 限制(有限数(参数.当前堕落值), 0, 100);
  const 完整冷落日 = 计算完整冷落日(参数.距上次成长钟楼);
  const 旧结算日 = Math.min(非负整数(参数.已结算冷落日), 完整冷落日);
  const 计划下降 = 计算累计冷落下降(旧结算日, 完整冷落日);
  // 若输入已经异常低于阶段线，冷落结算不能反向“奖励”式抬高；只保证本次不会
  // 比当前值继续跌得更深。正常档仍严格停在阶段底线。
  const 本次有效底线 = Math.min(阶段底线, 当前值);
  const 堕落值 = Math.max(本次有效底线, 当前值 - 计划下降);
  const 实际下降 = Math.max(0, 当前值 - 堕落值);

  return {
    堕落值,
    阶段底线,
    完整冷落日,
    已结算冷落日: 完整冷落日,
    新增冷落日: 完整冷落日 - 旧结算日,
    计划下降,
    实际下降,
    达到阶段底线: 堕落值 === 阶段底线,
    本次触底: 当前值 > 阶段底线 && 堕落值 === 阶段底线 && 实际下降 > 0,
    受阶段底线限制: 计划下降 > 实际下降,
  };
}

/**
 * 余波公式按冷落时段计算：一日为 6 时段，基础 3 楼；每再经过 6 个时段增加 1 个正文安抚楼，最多 9 楼。
 * 三日共有 18 个时段，因此得到 5 个正文安抚楼。
 */
export function 计算余波所需楼数(距上次成长钟楼: number): number {
  const 冷落时段 = Math.floor(非负整数(距上次成长钟楼) / 每时段钟楼数);
  return 限制(3 + Math.floor(Math.max(0, 冷落时段 - 6) / 6), 3, 9);
}

export function 创建成长账(当前钟楼 = -1): 成长账 {
  return {
    上次有效成长钟楼: Math.max(-1, Math.floor(有限数(当前钟楼, -1))),
    成长轮次: 0,
    已结算冷落日: 0,
  };
}

/** 返回新账，不修改传入对象；余波由调用方单独结算，不能被普通成长静默清除。 */
export function 记录有效成长(旧账: Readonly<成长账>, 当前钟楼: number): 成长账 {
  return {
    上次有效成长钟楼: 非负整数(当前钟楼),
    成长轮次: 非负整数(旧账.成长轮次) + 1,
    已结算冷落日: 0,
  };
}

/** 资格外或首次建立成长账时只移动计时水位，不把校准伪装成一次成长。 */
export function 校准成长账(旧账: Readonly<成长账>, 当前钟楼: number): 成长账 {
  return {
    上次有效成长钟楼: 非负整数(当前钟楼),
    成长轮次: 非负整数(旧账.成长轮次),
    已结算冷落日: 0,
  };
}

export function 创建余波账(): 余波账 {
  return {
    状态: '无',
    触发钟楼: -1,
    需安抚楼: 0,
    已安抚楼: 0,
    上次安抚正文楼: -1,
    送礼安抚日: -1,
    当日送礼安抚次数: 0,
  };
}
