import type { SchemaType, 胜任责任类别们 } from '../../schema';
import { 经济配置 } from '../../stageConfig';
import { 取绝对时段 } from './楼层时钟';

export type 胜任责任类别 = (typeof 胜任责任类别们)[number];
export type 胜任记分类别 = 胜任责任类别 | '正向经营';

export interface 胜任变动请求 {
  /** 正数为奖励，负数为责任。 */
  变动: number;
  类别: 胜任记分类别;
  原因: string;
  /** 业务稳定键；同一存档中相同键只能结算一次。 */
  id: string;
  时段?: number;
  /** 归属到哪一次期界考核；缺省为当前经营期结束时的下一次考核。 */
  考核期?: number;
  /** 正向经营默认受单期 +6，退款／圆场等冲正可显式关闭。 */
  计入本期正向?: boolean;
  /** 个别奖励（足额上交、接电话）有自身封顶。 */
  数值上限?: number;
}

export interface 胜任主因结果 {
  类别: 胜任责任类别;
  原因: string;
  扣分: number;
}

const 责任优先级: readonly 胜任责任类别[] = ['母亲事发', '公开丑闻', '账目亏空', '楼务失职', '失联抗命'];

function 默认考核期(时段: number): number {
  return Math.floor(时段 / 经济配置.收租周期时段) + 1;
}

/**
 * 胜任的唯一业务写入口。它同时执行取整、上下限、单期正向上限、稳定键幂等和结构化记账。
 * 回档／守护恢复与新局初始化属于状态恢复，不走这里。
 */
export function 登记胜任变动(data: SchemaType, 请求: 胜任变动请求): number {
  const 管理 = data.系统._管理考核;
  const id = 请求.id.trim();
  const 期望 = Math.round(请求.变动);
  if (!id || 期望 === 0 || 管理.记分条目.some(item => item.id === id)) return 0;

  const 时段 = Math.max(0, Math.floor(请求.时段 ?? 取绝对时段(data)));
  const 考核期 = Math.max(0, Math.floor(请求.考核期 ?? 默认考核期(时段)));
  const 原值 = Math.round(data.胜任度);
  let 实际 = 期望;
  if (期望 > 0) {
    const 计入本期正向 = 请求.计入本期正向 !== false;
    const 正向余量 = 计入本期正向 ? Math.max(0, 6 - 管理.本期正向) : Number.POSITIVE_INFINITY;
    const 数值上限 = Math.max(0, Math.min(100, Math.round(请求.数值上限 ?? 100)));
    实际 = Math.max(0, Math.min(期望, 正向余量, 数值上限 - 原值, 100 - 原值));
    if (实际 > 0 && 计入本期正向) 管理.本期正向 += 实际;
  } else {
    实际 = -Math.min(Math.abs(期望), 原值);
  }
  if (实际 === 0) return 0;

  data.胜任度 = _.clamp(原值 + 实际, 0, 100);
  管理.记分条目.push({ id, 考核期, 时段, 类别: 请求.类别, 变动: 实际, 原因: 请求.原因.trim() });
  // 两期主因只需很短历史；留足坏档与跨期快进余量，同时避免长期游戏无限膨胀。
  if (管理.记分条目.length > 128) 管理.记分条目.splice(0, 管理.记分条目.length - 128);
  return 实际;
}

/** 通牒期和最终期累计扣分；同分严格按正式设计的证据优先级。 */
export function 读取胜任主因(data: SchemaType, 起始考核期: number, 截止考核期: number): 胜任主因结果 {
  const 条目 = data.系统._管理考核.记分条目.filter(
    item =>
      item.类别 !== '正向经营' &&
      item.考核期 >= 起始考核期 &&
      item.考核期 <= 截止考核期,
  );
  const 合计 = new Map<胜任责任类别, number>();
  for (const item of 条目) {
    const 类别 = item.类别 as 胜任责任类别;
    // 母亲圆场等冲正与原责任使用同一类别，正向数值只抵销该类责任，不抵销其他失职。
    合计.set(类别, (合计.get(类别) ?? 0) - item.变动);
  }
  for (const [类别, 扣分] of 合计) if (扣分 <= 0) 合计.delete(类别);
  if (!合计.size) return { 类别: '综合失职', 原因: '综合胜任度低于考核红线', 扣分: 0 };

  const 排序 = [...合计.entries()].sort((a, b) => {
    const 分差 = b[1] - a[1];
    if (分差) return 分差;
    const a序 = 责任优先级.indexOf(a[0]);
    const b序 = 责任优先级.indexOf(b[0]);
    return (a序 < 0 ? 责任优先级.length : a序) - (b序 < 0 ? 责任优先级.length : b序);
  });
  const [类别, 扣分] = 排序[0];
  const 原因 = 条目
    .filter(item => item.类别 === 类别 && item.变动 < 0)
    .sort((a, b) => Math.abs(b.变动) - Math.abs(a.变动) || b.时段 - a.时段)[0]?.原因;
  return { 类别, 原因: 原因 || 类别, 扣分 };
}

export function 清理胜任旧账(data: SchemaType, 当前考核期: number): void {
  const 最早保留 = data.系统._通牒期 >= 0 ? data.系统._通牒期 : Math.max(0, 当前考核期 - 3);
  data.系统._管理考核.记分条目 = data.系统._管理考核.记分条目.filter(item => item.考核期 >= 最早保留);
}
