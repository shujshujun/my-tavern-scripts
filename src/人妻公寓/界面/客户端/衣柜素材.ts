import 默认内衣状态图 from '../../素材/道具/衣柜_默认内衣状态.png?url';
import 初始妆容图 from '../../素材/道具/衣柜_初始妆容.png?url';
import { 查道具 } from '../../stageConfig';
import { 需要成品造型, 读取衣柜造型 } from '../../衣柜造型配置';
import { 角色立绘候选 } from './assets';
import { 衣柜造型图片 } from './穿戴成品图';
import { 衣柜普通重制图, 衣柜普通重制缩略图 } from './服装立绘资源';

/** 衣柜与收起后的仪容共用默认状态图，不向旧 CDN 请求不存在的虚拟 SKU。 */
export function 衣柜默认状态图(id: string | undefined): string {
  if (id?.startsWith('初始内衣_')) return 默认内衣状态图;
  if (id?.startsWith('初始妆容_')) return 初始妆容图;
  return '';
}

/** 仪容与衣柜都展示同一角色的实际素材；隐蔽物品仍使用物品图。 */
export function 衣柜物品缩略图(角色: string, id: string, 孕态: boolean, 物品图: (id: string) => string): string {
  const 默认图 = 衣柜默认状态图(id);
  if (默认图) return 默认图;
  if (需要成品造型(id)) return 衣柜造型图片(读取衣柜造型(角色, id, 孕态), true);
  const 槽 = 查道具(id)?.服饰?.槽;
  if (id.startsWith('初始外装_') || 槽 === '外装' || 槽 === '内衣') {
    const 主图 = 角色立绘候选(角色, id.startsWith('初始') ? '' : id, 孕态)[0] ?? '';
    // 有既定孕态图时，缩略图也继续用孕态图，不能混用普通重制预览。
    return 主图 && 主图 === 衣柜普通重制图(角色, id) ? 衣柜普通重制缩略图(角色, id) || 主图 : 主图;
  }
  return 物品图(id);
}
