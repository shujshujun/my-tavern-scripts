import { 录像带双承接图片, 录像带双承接平板图片 } from './assets';

export const 录像带双承接路线ID = '丈夫结局:录像带双承接' as const;
export const 录像带双承接正式版本 = 2 as const;
export type 录像带双承接房间 = '102' | '202';
export type 录像带双承接序号 = 1 | 2 | 3 | 4 | 5;
export type 录像带双承接正式平板序号 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type 录像带双承接正式外层序号 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface 录像带双承接平板帧 {
  id: `SCREEN-${录像带双承接房间}-0${录像带双承接序号}`;
  文件: `SCREEN-${录像带双承接房间}-0${录像带双承接序号}`;
  版本: 1;
  轨道: '平板';
  路线: typeof 录像带双承接路线ID;
  房间: 录像带双承接房间;
  序号: 录像带双承接序号;
  节拍: '片头' | '前戏' | '妻子主动' | '硬核峰值' | '片尾留话';
  来源镜头: string;
  录制妻子: '沈静仪' | '周小满';
  现场陪看人: '周小满' | '沈静仪';
  观看丈夫: '顾国栋' | '何俊生';
  提供方: 'builtin' | 'local-deterministic-composite';
  成人画面: boolean;
  标题: string;
}

export interface 录像带双承接正式帧 {
  id: string;
  文件: string;
  版本: typeof 录像带双承接正式版本;
  轨道: '平板' | '外层';
  路线: typeof 录像带双承接路线ID;
  房间: 录像带双承接房间;
  序号: 录像带双承接正式平板序号 | 录像带双承接正式外层序号;
  节拍: string;
  来源镜头: string;
  录制妻子: '沈静仪' | '周小满';
  现场陪看人: '周小满' | '沈静仪';
  观看丈夫: '顾国栋' | '何俊生';
  成人画面: boolean;
  标题: string;
}

export type 录像带双承接可展示帧 = 录像带双承接平板帧 | 录像带双承接正式帧;

const 试播节拍表 = ['片头', '前戏', '妻子主动', '硬核峰值', '片尾留话'] as const;
const 试播来源表 = {
  '102': ['TAPE-SJY-01', 'TAPE-SJY-02', 'TAPE-SJY-06', 'TAPE-SJY-09', 'TAPE-SJY-10'],
  '202': ['TAPE-ZXM-01', 'TAPE-ZXM-02', 'TAPE-ZXM-06', 'TAPE-ZXM-09', 'TAPE-ZXM-10'],
} as const;
const 正式平板节拍表 = [
  '开始',
  '进入',
  '主动参与',
  '首次越线',
  '连续换位',
  '妻子掌控',
  '第二轮升档',
  '峰值准备',
  '硬核峰值',
  '结果与停止',
] as const;
const 正式外层节拍表 = [
  { 文件尾: 'LOCKED', 节拍: '丈夫仍锁定', 成人画面: true },
  { 文件尾: 'AUTHORIZATION', 节拍: '宣读并接受授权', 成人画面: false },
  { 文件尾: 'SELF-UNLOCK', 节拍: '丈夫本人解锁', 成人画面: true },
  { 文件尾: 'VIEW-EARLY', 节拍: '观看初段', 成人画面: true },
  { 文件尾: 'VIEW-ESCALATION', 节拍: '观看升档', 成人画面: true },
  { 文件尾: 'SELF-COMPLETION', 节拍: '丈夫本人完成', 成人画面: true },
  { 文件尾: 'SELF-RELOCK', 节拍: '丈夫本人复锁', 成人画面: true },
  { 文件尾: 'VISUAL-VERIFICATION', 节拍: '陪看人无接触核验', 成人画面: true },
  { 文件尾: 'HANDOFF', 节拍: '回执或钥匙交接', 成人画面: false },
] as const;

function 人物(房间: 录像带双承接房间): {
  录制妻子: '沈静仪' | '周小满';
  现场陪看人: '周小满' | '沈静仪';
  观看丈夫: '顾国栋' | '何俊生';
  源镜前缀: 'SJY' | 'ZXM';
} {
  return 房间 === '102'
    ? { 录制妻子: '沈静仪', 现场陪看人: '周小满', 观看丈夫: '顾国栋', 源镜前缀: 'SJY' }
    : { 录制妻子: '周小满', 现场陪看人: '沈静仪', 观看丈夫: '何俊生', 源镜前缀: 'ZXM' };
}

function 创建试播房间轨道(房间: 录像带双承接房间): 录像带双承接平板帧[] {
  const 角色 = 人物(房间);
  return 试播节拍表.map((节拍, index) => {
    const 序号 = (index + 1) as 录像带双承接序号;
    const id = `SCREEN-${房间}-0${序号}` as const;
    return Object.freeze({
      id,
      文件: id,
      版本: 1 as const,
      轨道: '平板' as const,
      路线: 录像带双承接路线ID,
      房间,
      序号,
      节拍,
      来源镜头: 试播来源表[房间][index],
      录制妻子: 角色.录制妻子,
      现场陪看人: 角色.现场陪看人,
      观看丈夫: 角色.观看丈夫,
      提供方: 序号 === 1 ? ('builtin' as const) : ('local-deterministic-composite' as const),
      成人画面: 序号 !== 1,
      标题: `${房间} · ${角色.观看丈夫}观看${角色.录制妻子}母带 · ${节拍}（五格试播）`,
    });
  });
}

function 创建正式平板房间轨道(房间: 录像带双承接房间): 录像带双承接正式帧[] {
  const 角色 = 人物(房间);
  return 正式平板节拍表.map((节拍, index) => {
    const 序号 = (index + 1) as 录像带双承接正式平板序号;
    const 两位序号 = String(序号).padStart(2, '0');
    const 文件 = `SCREEN-V2-${房间}-${两位序号}`;
    return Object.freeze({
      id: 文件,
      文件,
      版本: 录像带双承接正式版本,
      轨道: '平板' as const,
      路线: 录像带双承接路线ID,
      房间,
      序号,
      节拍,
      来源镜头: `TAPE-${角色.源镜前缀}-${两位序号}`,
      录制妻子: 角色.录制妻子,
      现场陪看人: 角色.现场陪看人,
      观看丈夫: 角色.观看丈夫,
      成人画面: 序号 !== 1,
      标题: `${房间} · ${角色.观看丈夫}观看${角色.录制妻子}完整母带 · ${节拍}`,
    });
  });
}

function 创建正式外层房间轨道(房间: 录像带双承接房间): 录像带双承接正式帧[] {
  const 角色 = 人物(房间);
  return 正式外层节拍表.map((节点, index) => {
    const 序号 = (index + 1) as 录像带双承接正式外层序号;
    const 文件 = `OUTER-V2-${房间}-${String(序号).padStart(2, '0')}-${节点.文件尾}`;
    return Object.freeze({
      id: 文件,
      文件,
      版本: 录像带双承接正式版本,
      轨道: '外层' as const,
      路线: 录像带双承接路线ID,
      房间,
      序号,
      节拍: 节点.节拍,
      来源镜头: 节点.文件尾,
      录制妻子: 角色.录制妻子,
      现场陪看人: 角色.现场陪看人,
      观看丈夫: 角色.观看丈夫,
      成人画面: 节点.成人画面,
      标题: `${房间} · ${角色.观看丈夫} · ${节点.节拍}`,
    });
  });
}

/** 旧无版本五格只用于历史试播与旧调用兼容，不具有正式故事完成语义。 */
export const 录像带双承接平板轨道: readonly 录像带双承接平板帧[] = Object.freeze([
  ...创建试播房间轨道('102'),
  ...创建试播房间轨道('202'),
]);

export const 录像带双承接正式平板轨道: readonly 录像带双承接正式帧[] = Object.freeze([
  ...创建正式平板房间轨道('102'),
  ...创建正式平板房间轨道('202'),
]);

export const 录像带双承接正式外层轨道: readonly 录像带双承接正式帧[] = Object.freeze([
  ...创建正式外层房间轨道('102'),
  ...创建正式外层房间轨道('202'),
]);

export const 录像带双承接正式轨道: readonly 录像带双承接正式帧[] = Object.freeze([
  ...录像带双承接正式平板轨道,
  ...录像带双承接正式外层轨道,
]);

const 试播帧索引 = new Map(录像带双承接平板轨道.map(帧 => [`${帧.房间}:${帧.序号}`, 帧]));
const 正式帧索引 = new Map(录像带双承接正式轨道.map(帧 => [`${帧.房间}:${帧.轨道}:${帧.序号}`, 帧]));

export interface 录像带双承接CG载荷 {
  路线: string;
  版本?: unknown;
  房间: string;
  轨道?: unknown;
  序号: number;
}

/** 无版本载荷严格保留 v1 语义；只有显式 `版本: 2` 才能寻址正式两条轨道。 */
export function 解析录像带双承接CG载荷(载荷: unknown): 录像带双承接可展示帧 | null {
  if (!载荷 || typeof 载荷 !== 'object') return null;
  const 值 = 载荷 as Partial<录像带双承接CG载荷>;
  if (值.路线 !== 录像带双承接路线ID || (值.房间 !== '102' && 值.房间 !== '202') || !Number.isInteger(值.序号))
    return null;
  if (值.版本 === undefined) {
    if (值.轨道 !== undefined || Number(值.序号) < 1 || Number(值.序号) > 5) return null;
    return 试播帧索引.get(`${值.房间}:${值.序号}`) ?? null;
  }
  if (值.版本 !== 录像带双承接正式版本 || (值.轨道 !== '平板' && 值.轨道 !== '外层')) return null;
  const 上限 = 值.轨道 === '平板' ? 10 : 9;
  if (Number(值.序号) < 1 || Number(值.序号) > 上限) return null;
  return 正式帧索引.get(`${值.房间}:${值.轨道}:${值.序号}`) ?? null;
}

export function 录像带双承接平板帧地址(帧: 录像带双承接平板帧): string {
  return 录像带双承接平板图片(帧.id);
}

export function 录像带双承接帧地址(帧: 录像带双承接可展示帧): string {
  return 录像带双承接图片(帧.文件);
}
