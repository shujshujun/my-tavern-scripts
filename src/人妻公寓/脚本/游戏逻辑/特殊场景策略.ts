import type { SchemaType } from '../../schema';

/**
 * 已有完整持久状态机、拍次与脚本结算的场景。其演出不能再进入普通体力／满意度性爱账本，
 * 否则屏幕录像、遥控设备或脚本收尾会被误认成现场自由亲密行为。
 */
export const 独立结算特殊场景ID = ['录像带前置', '录像带', '静音会议'] as const;

export function 独立结算特殊场景中(data: SchemaType): boolean {
  return (独立结算特殊场景ID as readonly string[]).includes(data.系统._特殊场景.id);
}

export function 普通亲密场景进行中(data: SchemaType): boolean {
  return data.系统._性爱场景.状态 !== '空闲';
}

export function 特殊场景启动亲密门(data: SchemaType): string {
  return 普通亲密场景进行中(data) ? '请先结束当前亲密场景，再启动特殊场景。' : '';
}
