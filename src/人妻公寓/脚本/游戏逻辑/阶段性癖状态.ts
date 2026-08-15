import type { SchemaType } from '../../schema';
import { 户静态表, 查道具, type 门牌 } from '../../stageConfig';

export type 阶段性癖状态名 = '未解锁' | '可开启' | '已支付可开启' | '剧情获得' | '已完成';

export interface 阶段性癖状态视图 {
  门牌: 门牌;
  id: string;
  名称: string;
  状态: 阶段性癖状态名;
  价格: number;
}

export function 阶段性癖门牌(id: string): 门牌 | null {
  return ((Object.keys(户静态表) as 门牌[]).find(门牌号 => 户静态表[门牌号].招牌性癖 === id) ?? null) as 门牌 | null;
}

export function 阶段性癖已完成(data: SchemaType, 门牌号: 门牌): boolean {
  const 妻 = data.户[门牌号]?.妻;
  return !!妻 && 妻.阶段性癖 === 户静态表[门牌号].招牌性癖;
}

/** 当前唯一可开启窗口：五户是 L4→L5 节点0，母亲是同线路节点1。 */
export function 阶段性癖可开启(data: SchemaType, 门牌号: 门牌): boolean {
  const 妻 = data.户[门牌号]?.妻;
  if (!妻 || 阶段性癖已完成(data, 门牌号) || 妻.当前阶段 !== 4 || 妻._阶段线路.目标阶段 !== 5) return false;
  const 节点 = 门牌号 === '302' ? 1 : 0;
  if (妻._阶段线路.活跃节点 !== 节点) return false;
  const 之前节点掩码 = (1 << 节点) - 1;
  return (妻._阶段线路.完成位图 & 之前节点掩码) === 之前节点掩码;
}

export function 读取阶段性癖状态(data: SchemaType, 门牌号: 门牌): 阶段性癖状态视图 {
  const id = 户静态表[门牌号].招牌性癖;
  const 妻 = data.户[门牌号]?.妻;
  let 状态: 阶段性癖状态名;
  if (阶段性癖已完成(data, 门牌号)) 状态 = '已完成';
  else if (门牌号 === '302') 状态 = '剧情获得';
  else if (!阶段性癖可开启(data, 门牌号)) 状态 = '未解锁';
  else if (妻?._阶段性癖已支付) 状态 = '已支付可开启';
  else 状态 = '可开启';
  return {
    门牌: 门牌号,
    id,
    名称: id,
    状态,
    价格: 查道具(id)?.价格 ?? 0,
  };
}

export function 全部阶段性癖已完成(data: SchemaType): boolean {
  return (Object.keys(户静态表) as 门牌[]).every(门牌号 => 阶段性癖已完成(data, 门牌号));
}
