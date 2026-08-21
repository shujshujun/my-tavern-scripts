import type { SchemaType } from '../../schema';

export const 借种场景ID = '借种';
export const 借种摄像头已拆键 = '借种:摄像头已拆';
export const 借种断线已确认键 = '借种:断线已确认';
export const 借种受孕场次前缀 = '借种结局:101:';
export const 借种开场事件标记 = '【特殊场景·借种·开场】';
export const 借种阳性邀约已读前缀 = '借种:阳性邀约已读:';
export const 借种三人合照待拍前缀 = '借种:三人合照:待拍:';
export const 借种三人合照已拍前缀 = '借种:三人合照:已拍:';
export const 借种产后家庭合照待拍前缀 = '借种:产后家庭合照:待拍:';
export const 借种产后家庭合照已拍前缀 = '借种:产后家庭合照:已拍:';
export const 借种三人日常已用前缀 = '借种:三人日常:已用:';
export const 借种朋友圈选择前缀 = '借种:三人合照:朋友圈选择:';

export type 借种朋友圈选择 = '发布' | '私密';
export interface 借种产后家庭合照凭据 {
  场次标识: string;
  胎次: number;
}

export function 借种结局已完成(data: SchemaType): boolean {
  return data.系统._已完成特殊场景.includes(借种场景ID);
}

export function 是借种受孕场次(场次标识: unknown): boolean {
  return typeof 场次标识 === 'string' && 场次标识.startsWith(借种受孕场次前缀);
}

/**
 * “借种来源”只描述第一胎的精确受孕场次；结局建立的知情家庭关系会继续影响后续胎次。
 * 本函数把当前胎冻结账、历史借种孩子与精确来源收敛成同一长期后果真值，不新增 Schema 字段。
 */
export function 夏乔家庭计划后果有效(
  data: SchemaType,
  凭据: { 场次标识?: unknown; 家庭计划知情?: boolean; 胎次?: number } = {},
): boolean {
  const 妻 = data.户['101']?.妻;
  if (!妻) return false;
  // v0.85 已经允许家庭计划完成后的普通受孕，并在受孕当刻把丈夫知情冻结进本胎生产账。
  // 该硬事实必须先于新版借种完成门生效；但这里只恢复“知情家庭”语义，不倒签借种结局、
  // 照片、CG 或每周日常，后者仍由各自消费者继续显式检查 借种结局已完成／实拍凭据。
  if (凭据.家庭计划知情 === true) return true;
  if (凭据.家庭计划知情 === undefined && 妻._生产.家庭计划知情) return true;
  if (!借种结局已完成(data)) return false;
  const 场次标识 = 凭据.场次标识 ?? 妻._怀孕.受孕场次标识;
  if (是借种受孕场次(场次标识)) return true;
  const 胎次 = Number.isFinite(凭据.胎次) ? Math.max(1, Math.floor(Number(凭据.胎次))) : 0;
  return data.系统._家庭文档.孩子.some(
    孩子 =>
      孩子.母亲门牌 === '101' &&
      是借种受孕场次(孩子.出生场次标识) &&
      (!胎次 || 孩子.胎次 <= 胎次),
  );
}

/** 业务收口与 CG 路由共享的唯一“确定受孕完成”事实，防止失败收尾被画成成功结局。 */
export function 借种完成收尾事实有效(
  结果: Pick<
    SchemaType['系统']['_上次性爱结果'],
    '场次标识' | '结束方式' | '最终位置' | '收尾对象门牌' | '保护状态' | '当前行为'
  >,
): boolean {
  return (
    是借种受孕场次(结果.场次标识) &&
    结果.结束方式 === '主动收尾' &&
    结果.最终位置 === '小屄' &&
    结果.收尾对象门牌 === '101' &&
    结果.保护状态 === '未使用' &&
    结果.当前行为 === '阴道插入'
  );
}

export function 借种场次标识(data: SchemaType, 楼层: number): string {
  const 楼 = Number.isInteger(楼层) ? Math.max(0, 楼层) : 0;
  return `${借种受孕场次前缀}${data.系统._绝对时段}:${楼}`;
}

export function 借种摄像头已拆(data: SchemaType): boolean {
  return data.系统._特殊场景前置.includes(借种摄像头已拆键);
}

export function 借种断线已确认(data: SchemaType): boolean {
  return data.系统._特殊场景前置.includes(借种断线已确认键);
}

export function 借种阳性邀约已读键(场次标识: string): string {
  return `${借种阳性邀约已读前缀}${场次标识}`;
}

export function 借种阳性邀约已读(data: SchemaType, 场次标识: string): boolean {
  return !!场次标识 && data.系统._特殊场景前置.includes(借种阳性邀约已读键(场次标识));
}

export function 借种三人合照待拍键(场次标识: string): string {
  return `${借种三人合照待拍前缀}${场次标识}`;
}

export function 借种三人合照已拍键(场次标识: string): string {
  return `${借种三人合照已拍前缀}${场次标识}`;
}

export function 借种三人合照待拍(data: SchemaType, 场次标识: string): boolean {
  return !!场次标识 && data.系统._特殊场景前置.includes(借种三人合照待拍键(场次标识));
}

export function 借种三人合照已拍(data: SchemaType, 场次标识: string): boolean {
  return !!场次标识 && data.系统._特殊场景前置.includes(借种三人合照已拍键(场次标识));
}

function 列出借种前置尾值(data: SchemaType, 前缀: string): string[] {
  return [
    ...new Set(
      data.系统._特殊场景前置
        .filter(项 => 项.startsWith(前缀))
        .map(项 => 项.slice(前缀.length))
        .filter(Boolean),
    ),
  ];
}

export function 列出借种三人合照已拍场次(data: SchemaType): string[] {
  return 列出借种前置尾值(data, 借种三人合照已拍前缀).filter(是借种受孕场次);
}

export function 借种三人合照已拍过(data: SchemaType): boolean {
  return 列出借种三人合照已拍场次(data).length > 0;
}

function 借种产后家庭合照凭据文本(场次标识: string, 胎次: number): string {
  const 序号 = Number.isInteger(胎次) ? Math.max(1, 胎次) : 1;
  return `${序号}:${场次标识}`;
}

export function 借种产后家庭合照待拍键(场次标识: string, 胎次: number): string {
  return `${借种产后家庭合照待拍前缀}${借种产后家庭合照凭据文本(场次标识, 胎次)}`;
}

export function 借种产后家庭合照已拍键(场次标识: string, 胎次: number): string {
  return `${借种产后家庭合照已拍前缀}${借种产后家庭合照凭据文本(场次标识, 胎次)}`;
}

export function 借种产后家庭合照待拍(data: SchemaType, 场次标识: string, 胎次: number): boolean {
  return (
    !!场次标识 &&
    data.系统._特殊场景前置.includes(借种产后家庭合照待拍键(场次标识, 胎次))
  );
}

export function 借种产后家庭合照已拍(data: SchemaType, 场次标识: string, 胎次: number): boolean {
  return (
    !!场次标识 &&
    data.系统._特殊场景前置.includes(借种产后家庭合照已拍键(场次标识, 胎次))
  );
}

function 解析借种产后家庭合照凭据(值: string): 借种产后家庭合照凭据 | null {
  const 分隔 = 值.indexOf(':');
  if (分隔 <= 0) return null;
  const 胎次 = Number(值.slice(0, 分隔));
  const 场次标识 = 值.slice(分隔 + 1);
  if (!Number.isInteger(胎次) || 胎次 < 1 || !是借种受孕场次(场次标识)) return null;
  return { 场次标识, 胎次 };
}

function 列出借种产后家庭合照凭据(data: SchemaType, 前缀: string): 借种产后家庭合照凭据[] {
  const 已有 = new Set<string>();
  return 列出借种前置尾值(data, 前缀).flatMap(值 => {
    const 凭据 = 解析借种产后家庭合照凭据(值);
    if (!凭据) return [];
    const 键 = `${凭据.胎次}\u0000${凭据.场次标识}`;
    if (已有.has(键)) return [];
    已有.add(键);
    return [凭据];
  });
}

export function 列出借种产后家庭合照待拍凭据(data: SchemaType): 借种产后家庭合照凭据[] {
  return 列出借种产后家庭合照凭据(data, 借种产后家庭合照待拍前缀);
}

export function 列出借种产后家庭合照已拍凭据(data: SchemaType): 借种产后家庭合照凭据[] {
  return 列出借种产后家庭合照凭据(data, 借种产后家庭合照已拍前缀);
}

export function 借种产后家庭合照已拍过(data: SchemaType): boolean {
  return 列出借种产后家庭合照已拍凭据(data).length > 0;
}

export function 借种三人日常本周已用(data: SchemaType, 周数: number): boolean {
  const 周 = Math.max(1, Math.floor(Number(周数) || 1));
  return data.系统._特殊场景前置.includes(`${借种三人日常已用前缀}${周}`);
}

export function 记录借种三人日常本周(data: SchemaType, 周数: number): void {
  const 周 = Math.max(1, Math.floor(Number(周数) || 1));
  data.系统._特殊场景前置 = data.系统._特殊场景前置.filter(项 => !项.startsWith(借种三人日常已用前缀));
  记录借种前置(data, `${借种三人日常已用前缀}${周}`);
}

function 借种朋友圈选择键(场次标识: string, 选择: 借种朋友圈选择): string {
  return `${借种朋友圈选择前缀}${选择}:${场次标识}`;
}

export function 借种朋友圈选择状态(data: SchemaType, 场次标识: string): 借种朋友圈选择 | '未选择' {
  if (!场次标识) return '未选择';
  if (data.系统._特殊场景前置.includes(借种朋友圈选择键(场次标识, '发布'))) return '发布';
  if (data.系统._特殊场景前置.includes(借种朋友圈选择键(场次标识, '私密'))) return '私密';
  return '未选择';
}

export function 记录借种朋友圈选择(data: SchemaType, 场次标识: string, 选择: 借种朋友圈选择): boolean {
  if (!借种三人合照已拍(data, 场次标识) || 借种朋友圈选择状态(data, 场次标识) !== '未选择') return false;
  记录借种前置(data, 借种朋友圈选择键(场次标识, 选择));
  return true;
}

/** 私密借种孕情不走“公开丑闻”布尔值；实拍三人照就是姐妹群专场的独立硬准入。 */
export function 借种孕情可进入姐妹群(data: SchemaType, 门牌号: string): boolean {
  const 妻 = data.户['101']?.妻;
  return Boolean(
    门牌号 === '101' &&
      妻?._怀孕.状态 === '已告知' &&
      夏乔家庭计划后果有效(data, {
        场次标识: 妻._怀孕.受孕场次标识,
        家庭计划知情: 妻._生产.家庭计划知情,
        胎次: 妻._生产.本胎序号,
      }) &&
      借种三人合照已拍过(data),
  );
}

/** 只在已经存在真实照片事实时覆盖通用宝宝房背景，避免环境提前出现不存在的合照。 */
export function 借种101持久背景文件(data: SchemaType): string {
  return 借种结局已完成(data) && (借种三人合照已拍过(data) || 借种产后家庭合照已拍过(data))
    ? '101_借种结局计划板'
    : '';
}

/** 只登记“可拍”凭据，不生成照片；生产系统在陪产叙事、探望或出院提交后调用。 */
export function 同步借种产后家庭合照待拍(data: SchemaType): boolean {
  const 妻 = data.户['101']?.妻;
  if (!妻) return false;
  const 场次标识 = 妻._怀孕.受孕场次标识;
  const 胎次 = 妻._生产.本胎序号;
  const 有本胎孩子 = data.系统._家庭文档.孩子.some(
    孩子 => 孩子.母亲门牌 === '101' && 孩子.胎次 === 胎次 && 孩子.出生场次标识 === 场次标识,
  );
  const 已有资格 =
    妻._生产.产后看望 ||
    (妻._生产.结果 === '陪产' && 妻._生产.生产叙事已完成) ||
    妻._生产.状态 === '已出院';
  if (
    !借种结局已完成(data) ||
    !是借种受孕场次(场次标识) ||
    胎次 <= 0 ||
    !有本胎孩子 ||
    !已有资格 ||
    借种产后家庭合照待拍(data, 场次标识, 胎次) ||
    借种产后家庭合照已拍(data, 场次标识, 胎次)
  ) {
    return false;
  }
  记录借种前置(data, 借种产后家庭合照待拍键(场次标识, 胎次));
  return true;
}

export function 借种票在背包(data: SchemaType): boolean {
  return data.背包.includes(借种场景ID);
}

export function 记录借种前置(data: SchemaType, 键: string): void {
  if (!data.系统._特殊场景前置.includes(键)) data.系统._特殊场景前置.push(键);
}

export function 移除借种前置(data: SchemaType, 键: string): void {
  data.系统._特殊场景前置 = data.系统._特殊场景前置.filter(项 => 项 !== 键);
}

export function 清除借种临时前置(data: SchemaType): void {
  const 键 = new Set([借种摄像头已拆键, 借种断线已确认键]);
  data.系统._特殊场景前置 = data.系统._特殊场景前置.filter(项 => !键.has(项));
}

/** 拆机到场景结束前，101不能重新安装；完成后恢复普通安装能力。 */
export function 借种暂禁重装101(data: SchemaType): boolean {
  if (借种结局已完成(data)) return false;
  return 借种票在背包(data) && 借种摄像头已拆(data);
}
