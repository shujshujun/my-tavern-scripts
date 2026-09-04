import type { SchemaType } from '../../schema';
import { 不再留门已完成 } from '../../不再留门契约';
import { 不再留门真实录制已绑定 } from '../../脚本/游戏逻辑/不再留门系统';
import { 读取世界时间 } from '../../脚本/游戏逻辑/楼层时钟';

export const 不再留门CG清单 = Object.freeze([
  ['ZXM-NMD-01', '公寓外偶遇'],
  ['ZXM-NMD-02', '亲吻取证'],
  ['ZXM-NMD-03', '202看照片'],
  ['ZXM-NMD-04', '她的决定'],
  ['ZXM-NMD-05', '202设备已安装'],
  ['ZXM-NMD-06', '她亲自开录'],
  ['ZXM-NMD-07', '她封存记录'],
  ['ZXM-NMD-08', '302母带归档'],
] as const);
/** WebP产品尚未发布；验收服务器或后续发布配置提供基址。没有基址时保持可读回执。 */
export const 不再留门素材配置 = Object.freeze({
  产品目录: 'src/人妻公寓/素材/特殊场景/不再留门',
  扩展名: 'webp',
  已发布基址: '',
});
export function 不再留门图片(文件: string): string {
  if (!不再留门CG清单.some(([id]) => id === 文件)) return '';
  const base = String((globalThis as Record<string, unknown>).__RQGY_NMD_ASSET_BASE__ ?? 不再留门素材配置.已发布基址)
    .trim()
    .replace(/\/+$/, '');
  return base ? `${base}/${文件}.webp` : '';
}
export function 不再留门CG标题(文件: string): string {
  return 不再留门CG清单.find(([id]) => id === 文件)?.[1] ?? '不再留门';
}

export function 不再留门人物造型适配(data: SchemaType): boolean {
  const w = data.户['202']?.妻;
  if (!w || w._怀孕.状态 === '已告知') return false;
  if (Object.values(w._穿着SKU).some(id => id && !id.startsWith('初始'))) return false;
  if (!/浅蓝/.test(w.外装) || !/裙/.test(w.外装) || !/米色.*开衫|开衫.*米色/.test(w.外装)) return false;
  if (!['素颜', '淡妆', ''].includes(w.妆容) || w.特殊.some(x => /颈环|猫耳|项圈|婚纱|戒指/.test(x))) return false;
  return ['早上', '中午', '下午'].includes(读取世界时间(data).时段);
}

/** 图片服从已提交事实和当前造型；不改服装、孕态、光照或记录来源。 */
export function 不再留门CG允许(data: SchemaType, 文件: string, 实例?: string, 地点?: string | null): boolean {
  const r = data.系统._不再留门;
  if (!r.实例 || (实例 && 实例 !== r.实例)) return false;
  if (地点 !== undefined && 文件 !== 'ZXM-NMD-02') {
    const 目标 = 文件 === 'ZXM-NMD-01' ? '公寓外部' : 文件 === 'ZXM-NMD-08' ? '302' : '202';
    if ((地点 === '管理员室' ? '302' : 地点) !== 目标) return false;
  }
  switch (文件) {
    case 'ZXM-NMD-01':
      return r.当前场景 === 'A2' && r.当前拍 === 2 && ['下午', '傍晚'].includes(读取世界时间(data).时段);
    case 'ZXM-NMD-02':
      return r.照片.id === `${r.实例}:photo` && r.照片.画面 === 文件 && r.照片.时间线 === r.来源时间线;
    case 'ZXM-NMD-03':
      return r.照片.已看过 && ['出示中', '待交付'].includes(r.阶段) && 不再留门人物造型适配(data);
    case 'ZXM-NMD-04':
      return r.许可 === '同意本次' && ['待准备', '待开录'].includes(r.阶段) && 不再留门人物造型适配(data);
    case 'ZXM-NMD-05':
      return r.设备位置 === '202' && r.阶段 !== '录制中';
    case 'ZXM-NMD-06':
      return 不再留门真实录制已绑定(data) && 不再留门人物造型适配(data);
    case 'ZXM-NMD-07':
      return r.母带.位置 === '玩家背包' && 不再留门人物造型适配(data);
    case 'ZXM-NMD-08':
      return 不再留门已完成(data);
    default:
      return false;
  }
}

export function 不再留门背景文件(data: SchemaType, 地点: string): string {
  return 地点 === '202' && 不再留门CG允许(data, 'ZXM-NMD-05') ? 'ZXM-NMD-05' : '';
}
