export const 录像带双承接CG路线ID = '丈夫结局:录像带双承接' as const;
export type 录像带双承接CG房间 = '102' | '202';
export type 录像带双承接CG序号 = 1 | 2 | 3 | 4 | 5;
export const 录像带双承接CG正式版本 = 2 as const;
export type 录像带双承接CG平板序号 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type 录像带双承接CG外层序号 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type 录像带双承接CG正式节点 =
  { 轨道: '平板'; 序号: 录像带双承接CG平板序号 } | { 轨道: '外层'; 序号: 录像带双承接CG外层序号 };

export interface 录像带双承接CG事件载荷 {
  路线: typeof 录像带双承接CG路线ID;
  房间: 录像带双承接CG房间;
  序号: 录像带双承接CG序号;
}

export type 录像带双承接CG正式事件载荷 = {
  路线: typeof 录像带双承接CG路线ID;
  版本: typeof 录像带双承接CG正式版本;
  房间: 录像带双承接CG房间;
} & 录像带双承接CG正式节点;

export function 创建录像带双承接CG载荷(房间: 录像带双承接CG房间, 序号: 录像带双承接CG序号): 录像带双承接CG事件载荷 {
  return { 路线: 录像带双承接CG路线ID, 房间, 序号 };
}

export function 创建录像带双承接CG正式载荷(
  房间: 录像带双承接CG房间,
  节点: 录像带双承接CG正式节点,
): 录像带双承接CG正式事件载荷 {
  return { 路线: 录像带双承接CG路线ID, 版本: 录像带双承接CG正式版本, 房间, ...节点 };
}

/**
 * 旧无版本五格的兼容展示入口；不创建、启动或推进丈夫结局状态。
 * 正式 v2 禁止调用本函数，必须由状态事务落库后发送带版本的结果载荷。
 */
export function 发送录像带双承接CG(房间: 录像带双承接CG房间, 序号: 录像带双承接CG序号): void {
  eventEmit('人妻公寓:录像带双承接CG', 创建录像带双承接CG载荷(房间, 序号));
}
