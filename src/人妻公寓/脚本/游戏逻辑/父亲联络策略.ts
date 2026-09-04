import type { SchemaType } from '../../schema';

export const 双重继承后父亲联络报表前缀 = '双重继承后家常：';
export const 双重继承后父亲通话模式 = '双重继承后家常';
/** 兼容早期接线命名。 */
export const 双重继承后家常报表前缀 = 双重继承后父亲联络报表前缀;

export function 回国完成事实(data: SchemaType): boolean {
  return data.系统._回国.阶段 === '已完成' || data.系统._已完成特殊场景.includes('回国');
}

export function 双重继承完成事实(data: SchemaType): boolean {
  return data.系统._双重继承.阶段 === '已完成' || data.系统._已完成特殊场景.includes('双重继承');
}

export function 是双重继承后家常报表(报表: string): boolean {
  return String(报表 ?? '').startsWith(双重继承后父亲联络报表前缀);
}

/** 正式结局完成以后，父亲永久退出公寓日常管理与胜任度审核。 */
export const 双重继承后父亲已退出管理 = 双重继承完成事实;

/**
 * 「普通父亲联络」专指经济、楼务、风闻和通牒生产出来的问责来电。
 * 单纯购买票据不改变世界；玩家在管理员室使用后，父亲开始回楼、交权或离场，
 * 旧问责链从此关闭。结局完成后的低频家常联络走独立模式，不重新取得批准权。
 */
export function 双重继承阻止普通父亲联络(data: SchemaType): boolean {
  const 阶段 = data.系统._双重继承.阶段;
  if (阶段 === '未开始' || 阶段 === '待使用双重继承') return 双重继承完成事实(data);
  return true;
}
