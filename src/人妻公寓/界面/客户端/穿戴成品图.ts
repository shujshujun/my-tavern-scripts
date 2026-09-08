import { 匹配衣柜造型, 穿戴成品键, type 成品穿戴状态, type 衣柜造型 } from '../../衣柜造型配置';
export { 穿戴成品键, type 成品穿戴状态 } from '../../衣柜造型配置';

/** 只读本地验收注入或明确发布的不可变素材，不请求不存在的待发布 URL。 */
export const 衣柜素材发布配置 = Object.freeze({
  仓库: 'shujun8520-design/qgy-assets',
  标签: 'cg5',
  目录: 'rq091/wardrobe',
  状态: '已发布' as '待发布' | '已发布',
});
export const 衣柜素材基址 = String(
  (globalThis as Record<string, unknown>).__RQGY_WARDROBE_ASSET_BASE__ ??
    (衣柜素材发布配置.状态 === '已发布'
      ? `https://testingcf.jsdelivr.net/gh/${衣柜素材发布配置.仓库}@${衣柜素材发布配置.标签}/${衣柜素材发布配置.目录}`
      : ''),
)
  .trim()
  .replace(/\/+$/, '');

export function 衣柜造型图片(造型: 衣柜造型 | undefined, 缩略 = false): string {
  if (!造型 || !衣柜素材基址) return '';
  return `${衣柜素材基址}/${(缩略 ? 造型.预览 : 造型.图片)
    .split('/')
    .map(段 => encodeURIComponent(段))
    .join('/')}`;
}

/** 经核对后替换了错画成爱心锁的旧戒指商品图。 */
export function 衣柜商品修正图(id: string): string {
  return id === '换戒' && 衣柜素材基址 ? `${衣柜素材基址}/_道具/${encodeURIComponent(id)}.webp` : '';
}

export function 读取穿戴成品图(角色: string, 主服装: string | undefined, 孕态: boolean, 状态: 成品穿戴状态): string {
  return 衣柜造型图片(匹配衣柜造型(角色, 主服装, 孕态, 状态));
}

export function 查完整穿戴图(
  索引: Readonly<Record<string, string>>,
  角色: string,
  主服装: string | undefined,
  孕态: boolean,
  状态: 成品穿戴状态,
): string {
  return 索引[穿戴成品键(角色, 主服装, 孕态, 状态)] ?? '';
}
