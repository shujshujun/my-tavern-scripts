const 衣柜界面素材基址 = 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg6/rq091/ui';
const 默认内衣状态图 = 衣柜界面素材基址 + '/' + encodeURIComponent('衣柜_默认内衣状态.webp');
const 初始妆容图 = 衣柜界面素材基址 + '/' + encodeURIComponent('衣柜_初始妆容.webp');
const 周小满初始外装 = 衣柜界面素材基址 + '/' + encodeURIComponent('初始外装_周小满.webp');
const 沈静仪初始外装 = 衣柜界面素材基址 + '/' + encodeURIComponent('初始外装_沈静仪.webp');
const 许曼君初始外装 = 衣柜界面素材基址 + '/' + encodeURIComponent('初始外装_许曼君.webp');
const 夏乔初始外装 = 衣柜界面素材基址 + '/' + encodeURIComponent('初始外装_夏乔.webp');
const 安若妍初始外装 = 衣柜界面素材基址 + '/' + encodeURIComponent('初始外装_安若妍.webp');
const 母亲初始外装 = 衣柜界面素材基址 + '/' + encodeURIComponent('初始外装_母亲.webp');
import { 查道具 } from '../../stageConfig';
import { 需要成品造型, 读取衣柜造型 } from '../../衣柜造型配置';
import { 角色立绘候选 } from './assets';
import { 衣柜造型图片 } from './穿戴成品图';
import { 衣柜普通重制图, 衣柜普通重制缩略图 } from './服装立绘资源';

const 初始外装物品图: Readonly<Record<string, string>> = {
  初始外装_周小满: 周小满初始外装,
  初始外装_沈静仪: 沈静仪初始外装,
  初始外装_许曼君: 许曼君初始外装,
  初始外装_夏乔: 夏乔初始外装,
  初始外装_安若妍: 安若妍初始外装,
  初始外装_母亲: 母亲初始外装,
};

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
  const 初始外装图 = id.startsWith('初始外装_') ? 初始外装物品图[id] : '';
  if (初始外装图) return 初始外装图;
  if (需要成品造型(id)) return 衣柜造型图片(读取衣柜造型(角色, id, 孕态), true);
  const 槽 = 查道具(id)?.服饰?.槽;
  if (id.startsWith('初始外装_') || 槽 === '外装' || 槽 === '内衣') {
    const 主图 = 角色立绘候选(角色, id.startsWith('初始') ? '' : id, 孕态)[0] ?? '';
    // 有既定孕态图时，缩略图也继续用孕态图，不能混用普通重制预览。
    return 主图 && 主图 === 衣柜普通重制图(角色, id) ? 衣柜普通重制缩略图(角色, id) || 主图 : 主图;
  }
  return 物品图(id);
}
