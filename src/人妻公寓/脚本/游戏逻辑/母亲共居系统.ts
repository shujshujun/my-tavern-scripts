import type { SchemaType } from '../../schema';
import {
  母亲共居已开启 as 主母亲共居已开启,
  母亲共居地点动作 as 主母亲共居地点动作,
  母亲共居状态提示,
  同步302共居状态,
  type 共居动作ID,
} from './302共居系统';

/**
 * 兼容门面：当前产品真值、入口与提交全部归 `302共居系统.ts`。
 * 结局后不再维护饭桌、晚归、陪坐或共同休息动作；本门面只保留模块路径兼容。
 */
export const 母亲共居动作ID表 = Object.freeze({
  玩家开始: '由我开始',
  母亲开始: '让她开始',
} as const satisfies Record<string, 共居动作ID>);

export type 母亲共居动作ID = (typeof 母亲共居动作ID表)[keyof typeof 母亲共居动作ID表];
export type 母亲共居事件投影 = SchemaType['系统']['_302共居']['事件记录'][number];
export interface 母亲共居结果 {
  成功: boolean;
  提示: string;
  变动?: boolean;
  事件?: string;
}

export const 母亲共居已开启 = 主母亲共居已开启;
export function 同步母亲共居状态(data: SchemaType, _成功楼层 = -1): boolean {
  return 同步302共居状态(data);
}
export function 母亲共居地点动作(data: SchemaType, 当前地点: string) {
  return 主母亲共居地点动作(data, 当前地点);
}

/** 旧两段式剧情票已经停用；真实入口必须走 `人妻公寓:302共居动作`。 */
export function 执行母亲共居动作(_data: SchemaType, _动作: unknown, _当前地点: string): 母亲共居结果 {
  return { 成功: false, 提示: '旧母亲共居剧情票已经停用，请使用302里的“和她亲密”。' };
}
export function 解析母亲共居剧情事件(_事件: string): null {
  return null;
}
export function 提交母亲共居剧情事件(
  _data: SchemaType,
  _事件: string,
  _当前地点: string,
  _成功楼层: number,
): null {
  return null;
}
export function 尝试读取母亲共居地点动作(..._参数: unknown[]): null {
  return null;
}
export function 尝试执行母亲共居动作(..._参数: unknown[]): null {
  return null;
}
export function 尝试提交母亲共居剧情事件(..._参数: unknown[]): null {
  return null;
}

export function 母亲共居背景语义键(data: SchemaType): string {
  if (!主母亲共居已开启(data)) return '';
  const 时段 = ((data.系统._绝对时段 % 6) + 6) % 6;
  return ['302_共居_早晨', '302_共居_白天', '302_共居_白天', '302_共居_备餐', '302_共居_客厅', '302_共居_深夜'][时段];
}
export const 母亲共居AI短状态 = 母亲共居状态提示;

/** 仅供旧单测兼容；真实可写视图由 `mvuIO.ts` 的唯一权限投影负责。 */
export function 封存母亲自由阶段可写视图(
  data: SchemaType,
  输入: Record<string, unknown>,
): Record<string, unknown> {
  const 输出 = _.cloneDeep(输入) as { 户?: Record<string, { 妻?: Record<string, unknown> }> };
  if (!主母亲共居已开启(data)) return 输出 as Record<string, unknown>;
  const 妻 = 输出.户?.['302']?.妻;
  if (!妻) return 输出 as Record<string, unknown>;
  for (const 键 of ['好感值', '堕落值', '身体开发', '当前阶段', '婚姻值']) delete 妻[键];
  return 输出 as Record<string, unknown>;
}
