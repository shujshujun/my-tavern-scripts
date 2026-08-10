export interface 微信消息记录 {
  楼: number;
  /** 消息发送时的绝对时段；真实消息楼只负责回档裁剪。 */
  时: number;
  /** v0.80 可选单调顺序：同楼同时段内区分先后；旧无序记录保持原楼/时解释。 */
  序?: number;
  会话: string;
  发: '我' | '对方' | '系统';
  文: string;
  类?: '文本' | '照片' | '撤回' | '通话';
  键?: string;
  图?: string;
  /** 玩家消息的稳定标识；玩家消息创建时必填，也可作为引用目标定位。 */
  标识?: string;
  /** 被引用消息的稳定定位；不保存原文快照，避免撤回后令原文复活。 */
  引用?: 微信消息定位;
  /** 创建时所在酒馆消息分支的签名；同楼 swipe 后旧分支记录不得继续可见。 */
  锚签名?: string;
}

/** 消息稳定定位：新玩家消息优先用标识，其余 rq0.80 消息使用持久单调序。 */
export interface 微信消息定位 {
  标识?: string;
  序?: number;
}

export interface 微信撤回定位 {
  标识: string;
}

function 可由玩家撤回(消息: 微信消息记录 | undefined): 消息 is 微信消息记录 {
  return !!消息 && 消息.发 === '我' && 消息.类 !== '撤回' && 消息.类 !== '通话';
}

export function 创建微信撤回定位(消息们: readonly 微信消息记录[], 索引: number): 微信撤回定位 | null {
  const 目标 = 消息们[索引];
  if (!可由玩家撤回(目标) || !目标.标识) return null;
  return { 标识: 目标.标识 };
}

function 定位消息(消息们: readonly 微信消息记录[], 定位: 微信撤回定位): number {
  return 消息们.findIndex(消息 => 消息.标识 === 定位.标识);
}

export function 撤回微信玩家消息<T extends 微信消息记录>(
  消息们: readonly T[],
  定位: 微信撤回定位,
): { 消息: T[]; 已撤回: boolean } {
  const 索引 = 定位消息(消息们, 定位);
  if (索引 < 0 || !可由玩家撤回(消息们[索引])) return { 消息: [...消息们], 已撤回: false };
  const 消息 = 消息们.map((原, i) => {
    if (i !== 索引) return 原;
    const 撤回行 = {
      ...原,
      文: '',
      类: '撤回' as const,
    };
    delete 撤回行.图;
    return 撤回行 as T;
  });
  return { 消息, 已撤回: true };
}

/**
 * 手机异步回复可能拿着撤回前的旧快照落库；提交前把最新库中的玩家撤回墓碑并回来，
 * 否则旧快照会让已撤回的原文重新出现。
 */
export function 合并微信撤回状态<T extends 微信消息记录>(候选: readonly T[], 最新: readonly T[]): T[] {
  const 合并后 = [...候选];
  for (const 撤回行 of 最新) {
    if (撤回行.发 !== '我' || 撤回行.类 !== '撤回') continue;
    const 索引 = 撤回行.标识 ? 合并后.findIndex(消息 => 消息.标识 === 撤回行.标识) : -1;
    if (索引 >= 0) 合并后[索引] = 撤回行;
  }
  return 合并后;
}
