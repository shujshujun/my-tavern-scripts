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
