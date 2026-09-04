import 清单 from './衣柜造型清单.json';
import { 道具表 } from './stageConfig';

export interface 成品穿戴状态 {
  妆容SKU?: string;
  特殊?: readonly string[];
}
export type 衣柜造型 = (typeof 清单)[number];
export const 衣柜可见妆容SKU: readonly string[] = ['烈色口红', '媚妆套盒'];
export const 衣柜可见佩饰SKU: readonly string[] = ['choker颈环', '猫耳发箍', '项圈牵绳', '换戒', '婚纱'];

/** 商品分类保留旧特殊槽；这类成品视觉上承担完整外装，不能叠在另一套衣服上。 */
export function 是完整外装道具(id: string | undefined): boolean {
  return id === '婚纱';
}

export function 需要成品造型(id: string): boolean {
  return 衣柜可见妆容SKU.includes(id) || 衣柜可见佩饰SKU.includes(id);
}

export function 是可见佩饰描述(描述: string): boolean {
  return 衣柜可见佩饰SKU.some(id => 道具表[id]?.服饰?.穿着描述 === 描述);
}

/** 隐蔽物品不制造视觉组合；角色、服装、可见妆容/配件及孕态仍必须精确匹配。 */
export function 穿戴成品键(角色: string, 主服装: string | undefined, 孕态: boolean, 状态: 成品穿戴状态): string {
  const 配件 = 衣柜可见佩饰SKU.filter(id => 状态.特殊?.includes(道具表[id]?.服饰?.穿着描述 ?? '')).sort();
  return JSON.stringify([
    角色,
    孕态 ? '孕态' : '普通',
    !主服装 || 主服装.startsWith('初始') ? '初始' : 主服装,
    状态.妆容SKU && 衣柜可见妆容SKU.includes(状态.妆容SKU) ? 状态.妆容SKU : '',
    配件,
  ]);
}

export function 造型成品键(造型: 衣柜造型): string {
  return 穿戴成品键(造型.角色, 造型.主服装, 造型.孕态, {
    妆容SKU: 造型.妆容SKU,
    特殊: 造型.特殊SKU.map(id => 道具表[id]?.服饰?.穿着描述 ?? ''),
  });
}

export function 读取衣柜造型(角色: string, 道具id: string, 孕态 = false): 衣柜造型 | undefined {
  return 清单.find(项 => 项.角色 === 角色 && 项.道具id === 道具id && 项.孕态 === 孕态);
}

export function 匹配衣柜造型(
  角色: string,
  主服装: string | undefined,
  孕态: boolean,
  状态: 成品穿戴状态,
): 衣柜造型 | undefined {
  const 键 = 穿戴成品键(角色, 主服装, 孕态, 状态);
  return 清单.find(项 => 造型成品键(项) === 键);
}
