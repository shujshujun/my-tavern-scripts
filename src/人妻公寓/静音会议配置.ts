/**
 * 静音会议组合素材的纯静态映射。
 *
 * 本模块不依赖 Vue、Node 或运行时变量；调用方只需提供原始参与门牌和画面状态。
 */

export type 静音会议候选门牌 = '101' | '102' | '201' | '202' | '301';

export type 静音会议画面状态 = 'CLEAN' | 'DETAIL' | 'PEAK';

export type 静音会议组合键 = `SM-${2 | 3}-${string}`;

export type 静音会议素材相对路径 = `特殊场景/静音会议/组合/${静音会议组合键}/${静音会议画面状态}.png`;

/** 同时作为组合键的唯一合法门牌集和固定排序依据。 */
export const 静音会议候选门牌顺序 = Object.freeze([
  '101',
  '102',
  '201',
  '202',
  '301',
] as const) satisfies readonly 静音会议候选门牌[];

const 静音会议候选门牌集合: ReadonlySet<string> = new Set(静音会议候选门牌顺序);

const 静音会议回退状态表 = Object.freeze({
  CLEAN: Object.freeze(['CLEAN'] as const),
  DETAIL: Object.freeze(['DETAIL', 'CLEAN'] as const),
  PEAK: Object.freeze(['PEAK', 'CLEAN'] as const),
}) satisfies Readonly<Record<静音会议画面状态, readonly 静音会议画面状态[]>>;

function 是静音会议候选门牌(值: unknown): 值 is 静音会议候选门牌 {
  return typeof 值 === 'string' && 静音会议候选门牌集合.has(值);
}

function 是静音会议画面状态(值: unknown): 值 is 静音会议画面状态 {
  return 值 === 'CLEAN' || 值 === 'DETAIL' || 值 === 'PEAK';
}

function 规范化静音会议门牌(原始门牌: unknown): 静音会议候选门牌[] | null {
  if (!Array.isArray(原始门牌) || (原始门牌.length !== 2 && 原始门牌.length !== 3)) return null;

  const 已见门牌 = new Set<静音会议候选门牌>();
  const 规范门牌: 静音会议候选门牌[] = [];

  for (const 门牌 of 原始门牌) {
    if (!是静音会议候选门牌(门牌) || 已见门牌.has(门牌)) return null;
    已见门牌.add(门牌);
    规范门牌.push(门牌);
  }

  规范门牌.sort((左, 右) => 静音会议候选门牌顺序.indexOf(左) - 静音会议候选门牌顺序.indexOf(右));
  return 规范门牌;
}

/**
 * 将原始参与门牌转换为稳定组合键。
 *
 * 原始输入必须恰好包含两或三个互不重复的合法字符串门牌，否则返回 null。
 */
export function 生成静音会议组合键(原始门牌: unknown): 静音会议组合键 | null {
  const 规范门牌 = 规范化静音会议门牌(原始门牌);
  if (规范门牌 === null) return null;

  return `SM-${规范门牌.length}-${规范门牌.join('-')}` as 静音会议组合键;
}

/**
 * 返回主素材仓库(随发布 Tag)中的相对路径；任一参数无效时返回 null。
 * 组合图已随 rq0.69 入库,只有 CLEAN 档;DETAIL/PEAK 尚未生成,由回退序列
 * 自动落回 CLEAN,补图入库后无需改代码(2026-08-04 M9:弃用从未上传的 qgy-assets 仓)。
 */
export function 获取静音会议素材相对路径(原始门牌: unknown, 状态: unknown): 静音会议素材相对路径 | null {
  const 组合键 = 生成静音会议组合键(原始门牌);
  if (组合键 === null || !是静音会议画面状态(状态)) return null;

  return `特殊场景/静音会议/组合/${组合键}/${状态}.png`;
}

/** 获取指定画面状态的尝试顺序；无效状态返回 null。 */
export function 获取静音会议回退状态序列(状态: unknown): readonly 静音会议画面状态[] | null {
  if (!是静音会议画面状态(状态)) return null;
  return 静音会议回退状态表[状态];
}
