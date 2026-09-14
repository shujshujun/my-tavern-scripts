import type { SchemaType } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 门牌列表 } from '../../stageConfig';

/**
 * 户节点存在即代表角色已入住，因此从阶段0起就是稳定微信好友。
 * 隐藏角色仍需等正式入列，避免仅因预建节点提前泄露。
 */
export function 已入住微信妻友门牌(data: Pick<SchemaType, '户' | '系统'>): 门牌[] {
  return 门牌列表.filter(门牌号 => {
    if (!data.户[门牌号]) return false;
    return !户静态表[门牌号].隐身 || data.系统._母亲入列;
  });
}

/** 母亲是特殊角色；微信入列与姐妹群剧情均不授予楼务群资格。 */
export function 楼务群成员门牌(data: Pick<SchemaType, '户' | '系统'>): 门牌[] {
  return 已入住微信妻友门牌(data).filter(m => m !== '302');
}

export const 楼务群身份说明 =
  '【楼务群身份】母亲不在楼务群；旧摘要中记载她在楼务群发言、收消息或以管理员称呼玩家的内容属于旧版错误，不能作为她的群身份、见闻或称呼依据。其他住户的正常楼务记录仍按来源使用。';

/** 旧档误生成的母亲楼务群发言不再用于展示或角色记忆；玩家提及母亲仍是正常消息。 */
export function 楼务群消息成员有效(消息: { 会话: string; 发: string; 文: string }): boolean {
  return !(消息.会话 === '群' && 消息.发 === '对方' && /^\s*母亲\s*[:：]/u.test(消息.文));
}
