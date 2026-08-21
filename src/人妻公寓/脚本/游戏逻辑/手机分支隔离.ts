import { 手机锚消息签名, 手机锚消息签名匹配 } from './手机时间线租约';

export interface 手机分支记录 {
  楼: number;
  /** 创建记录时所在酒馆消息分支的锚；同楼 swipe 后签名不再匹配。 */
  锚签名?: string;
  发?: string;
  键?: string;
}

export function 附手机分支锚<T extends 手机分支记录>(记录: T, 聊天消息: readonly unknown[]): T {
  const 锚签名 = 手机锚消息签名(聊天消息[记录.楼]);
  return 锚签名 ? ({ ...记录, 锚签名 } as T) : 记录;
}

export function 手机记录属于当前分支(记录: 手机分支记录, 聊天消息: readonly unknown[]): boolean {
  if (!记录.锚签名) return true;
  if (!Number.isInteger(记录.楼) || 记录.楼 < 0 || 记录.楼 >= 聊天消息.length) return false;
  return 手机锚消息签名匹配(记录.锚签名, 聊天消息[记录.楼]);
}

export function 裁手机分支记录<T extends 手机分支记录>(记录: readonly T[], 聊天消息: readonly unknown[]): T[] {
  return 记录.filter(条 => 手机记录属于当前分支(条, 聊天消息));
}

/**
 * 明确收到同楼 swipe 时，对同版本遗留的无锚自动内容采取隐私优先策略：自动回复、朋友圈与
 * 脚本稳定键一律裁掉。无锚玩家手动消息无法可靠区分，暂保留；新消息都有锚，不受此边界影响。
 */
export function 裁同楼切分支记录<T extends 手机分支记录>(
  记录: readonly T[],
  切分支楼: number,
  聊天消息: readonly unknown[],
): T[] {
  return 记录.filter(条 => {
    // 明确 swipe 事件本身就是分支变化证据；该楼所有带锚记录均属于切换前分支，不能因
    // 宿主复用了相同文本/swipe_id 而留下。无锚只保留无法可靠归属的玩家手动消息。
    if (条.楼 === 切分支楼) return !条.锚签名 && 条.发 === '我' && !条.键;
    return 手机记录属于当前分支(条, 聊天消息);
  });
}
