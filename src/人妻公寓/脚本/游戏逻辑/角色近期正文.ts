import { 户静态表, type 门牌 } from '../../stageConfig';

/** 每个成功助手楼冻结的本轮可靠在场妻；旧楼没有该凭据时不猜测角色归属。 */
export const 回合在场妻键 = '_rqgy回合在场妻';

export interface 角色近期正文消息 {
  is_user?: boolean;
  mes?: string;
  extra?: Record<string, unknown> | null;
}

/**
 * 软叙事上下文只接受持久消息元数据能证明目标角色在场的正文。
 * 先截全局最近 14 楼再按角色过滤，避免从很久以前拉回一段虽同角色但已过期的故事。
 */
export function 构造角色近期正文(
  消息们: readonly 角色近期正文消息[],
  门牌号: 门牌,
  清洗: (正文: string) => string,
): string {
  const 妻名 = 户静态表[门牌号]?.妻名 ?? 门牌号;
  const 最近助手楼 = 消息们
    .slice(-14)
    .filter(消息 => {
      const 在场妻 = 消息.extra?.[回合在场妻键];
      return !消息.is_user && Boolean(消息.mes) && Array.isArray(在场妻) && 在场妻.includes(门牌号);
    })
    .map(消息 => 清洗(String(消息.mes ?? '')).slice(-900))
    .filter(正文 => Boolean(正文.trim()))
    .slice(-4)
    .map((正文, i) => `近期${i + 1}：${正文}`);
  return 最近助手楼.length ? `与${妻名}当前线路相邻的最近正文：\n${最近助手楼.join('\n')}` : '';
}
