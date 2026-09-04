import 清单 from '../../衣柜服装重制清单.json';
import { 衣柜素材基址 } from './穿戴成品图';

interface 重制服装 {
  角色: string;
  道具id: string;
  图片: string;
  预览: string;
}
const 普通重制图 = 清单 as readonly 重制服装[];

function 读取图(角色名: string, sku: string | undefined, 缩略: boolean): string {
  if (!sku || !衣柜素材基址) return '';
  const 项 = 普通重制图.find(图 => 图.角色 === 角色名 && 图.道具id === sku);
  if (!项) return '';
  return `${衣柜素材基址}/${(缩略 ? 项.预览 : 项.图片)
    .split('/')
    .map(段 => encodeURIComponent(段))
    .join('/')}`;
}

export function 衣柜普通重制图(角色名: string, sku: string | undefined): string {
  // 清单只收录重新核验的单件成品，已否定的牛仔裙批次不在此处复用。
  return 读取图(角色名, sku, false);
}

export function 衣柜普通重制缩略图(角色名: string, sku: string): string {
  return 读取图(角色名, sku, true);
}
