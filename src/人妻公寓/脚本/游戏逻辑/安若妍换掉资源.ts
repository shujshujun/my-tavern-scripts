import type { SchemaType } from '../../schema';
import { 房间生产背景键 } from './生产系统';

/** 31张无损WebP随独立素材仓cg5提供，验收环境可覆盖基址。 */
export const 安若妍换掉素材发布配置 = Object.freeze({
  仓库: 'shujun8520-design/qgy-assets',
  不可变标签: 'cg5',
  产品目录: 'rq091/story/安若妍换掉',
  manifest: '安若妍换掉CG.manifest.json',
  文件数: 31,
  状态: '已发布' as '待不可变标签' | '已发布',
});
export const 安若妍换掉CG占位图 =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#211e24"/><text x="600" y="400" fill="#d7cedd" font-size="30" text-anchor="middle">画面尚未提供</text></svg>',
  );
export function 安若妍换掉图片(file: string): string {
  if (
    !/^(?:ARY-RPL-(?:0[1-5]|1[23])|ARY-RPL-(?:0[6-9]|1[01])-[NP]|ARY-RPL-BG-(?:BASE|BABY[123])-(?:PRE|POST-[NP]))$/u.test(
      file,
    )
  )
    return '';
  const preview = String((globalThis as Record<string, unknown>).__RQGY_ARY_REPLACE_ASSET_BASE__ ?? '')
    .trim()
    .replace(/\/+$/, '');
  const config = 安若妍换掉素材发布配置;
  const base = preview || (config.状态 === '已发布' && config.仓库 && config.不可变标签
    ? `https://testingcf.jsdelivr.net/gh/${config.仓库}@${config.不可变标签}/${config.产品目录}`
    : '');
  if (!base || !/^https?:\/\//iu.test(base)) return '';
  return `${base}/${encodeURIComponent(file)}.webp`;
}
export function 安若妍换掉背景文件(data: SchemaType): string {
  if (!data.户['301']) return '';
  const birth = /第([123])胎/u.exec(房间生产背景键(data, '301'))?.[1];
  const room = birth ? `BABY${birth}` : 'BASE';
  const route = data.系统._安若妍换掉;
  const complete = data.系统._已完成特殊场景.includes('角色路线:301:结局剧情');
  if (complete && !route.最终照片体态) return '';
  const phase = complete ? `POST-${route.最终照片体态 === '孕态' ? 'P' : 'N'}` : 'PRE';
  return `ARY-RPL-BG-${room}-${phase}`;
}
export function 安若妍换掉CG覆盖普通场次(file: string): boolean {
  return /^ARY-RPL-(?:0[6-9]|10)-[NP]$/u.test(file);
}
