export interface 场景聊天状态 {
  房间id?: string;
  /** 仅供刚破门的第一幕演出，成功生成一楼后清除。 */
  破门?: boolean;
  /** 玩家是否仍处在通过撬门进入的屋内；离开场景时才清除。 */
  非法进入?: boolean;
  进房末楼?: number;
  由头已用?: boolean;
}

export interface 场景界面状态 {
  房间id: string | null;
  非法进入: boolean;
  进房末楼: number;
  由头已用: boolean;
}

export interface 场景同步结果 extends 场景界面状态 {
  房间变化: boolean;
}

/**
 * 把 chat `_场景` 归一成界面状态。房间相同时仍同步所有子状态；若楼戳暂时不可用，
 * 保留当前冻结值。只有真正换房才允许调用方清理对话粘滞。
 */
export function 计算场景同步(
  当前: 场景界面状态,
  场景: 场景聊天状态 | null | undefined,
  缺省末楼: number,
): 场景同步结果 {
  const 房间id = 场景?.房间id ?? null;
  const 房间变化 = 房间id !== 当前.房间id;
  const 有效进房楼 = Number.isInteger(场景?.进房末楼) && Number(场景?.进房末楼) >= 0;
  return {
    房间id,
    房间变化,
    非法进入: 房间id ? !!场景?.非法进入 : false,
    由头已用: 房间id ? !!场景?.由头已用 : false,
    进房末楼: 有效进房楼 ? Number(场景?.进房末楼) : 房间变化 ? 缺省末楼 : 当前.进房末楼,
  };
}
