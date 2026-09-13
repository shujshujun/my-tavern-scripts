import type { SchemaType } from '../../schema';
import { 户静态表, type 门牌 } from '../../stageConfig';

export const PROMOTE_MIRROR_KEY = '人妻公寓_晋阶镜像';

/** 已读揭晓物归档；回到调查前也保持完整揭晓，不重新发信或复活读信场景票。 */
export function 同步已打开裂缝(data: SchemaType): boolean {
  const mirror = _.get(getVariables({ type: 'chat' }), PROMOTE_MIRROR_KEY) as
    { 户?: Record<string, { 裂缝确认?: boolean }> } | undefined;
  let changed = false;
  for (const [门牌号, 节点] of Object.entries(data.户)) {
    if (!节点.妻.裂缝.已确认 && !mirror?.户?.[门牌号]?.裂缝确认) continue;
    if (!节点.妻.裂缝.已确认 || 节点.妻.裂缝.碎片进度 < 4) changed = true;
    节点.妻.裂缝.已确认 = true;
    节点.妻.裂缝.碎片进度 = 4;
    const 妻名 = 户静态表[门牌号 as 门牌]?.妻名;
    const 揭晓物 = new Set(['拼合的信', '观察笔记', '考古辑录', '街坊札记', '酒后真言'].map(名 => `${名}·${妻名}`));
    const 背包 = data.背包.filter(id => !揭晓物.has(id));
    if (背包.length !== data.背包.length) {
      data.背包 = 背包;
      changed = true;
    }
  }
  return changed;
}
