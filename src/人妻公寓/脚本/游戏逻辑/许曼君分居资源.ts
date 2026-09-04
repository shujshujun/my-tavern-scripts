/**
 * @deprecated 旧资源验收器的只读组合投影。生产客户端资源地址由`界面/客户端/assets.ts`
 * 统一解析，事件CG与房间背景语义由权威分居系统直接提供；本文件不得另建发布基址。
 */
import { 读取201留宿背景语义 } from './许曼君201留宿';
import { 许曼君分居事件CG语义, 许曼君分居房间背景语义 } from './许曼君分居玩法';

export const 许曼君分居全屏资源语义 = [
  '分居_A1_工资卡入封套',
  '分居_A1_署名会面通知',
  '分居_A3_201三人同桌',
  '分居_A3_工资卡归还',
  '分居_201钥匙封存袋',
  '分居_赵国强带行李离楼',
  '分居_A5_取物与修复',
  '分居_A6_钥匙柜前最终会面',
  '201_分居_独住',
  '201_分居_取物后',
  '201_留宿_夜',
  '201_留宿_晨',
] as const;

export type 许曼君分居资源语义 = typeof 许曼君分居全屏资源语义[number];

export interface 许曼君分居视觉结果 {
  语义: 许曼君分居资源语义 | null;
  路径: string | null;
  回退路径: string;
  使用回退: boolean;
  轻量状态层: string[];
}

const 资源文件: Record<许曼君分居资源语义, string> = {
  分居_A1_工资卡入封套: '分居_A1_工资卡入封套.webp',
  分居_A1_署名会面通知: '分居_A1_署名会面通知.webp',
  分居_A3_201三人同桌: '分居_A3_201三人同桌.webp',
  分居_A3_工资卡归还: '分居_A3_工资卡归还.webp',
  分居_201钥匙封存袋: '分居_201钥匙封存袋.webp',
  分居_赵国强带行李离楼: '分居_赵国强带行李离楼.webp',
  分居_A5_取物与修复: '分居_A5_取物与修复.webp',
  分居_A6_钥匙柜前最终会面: '分居_A6_钥匙柜前最终会面.webp',
  '201_分居_独住': '201_分居_独住.webp',
  '201_分居_取物后': '201_分居_取物后.webp',
  '201_留宿_夜': '201_留宿_夜.webp',
  '201_留宿_晨': '201_留宿_晨.webp',
};

export function 许曼君分居资源相对路径(semantic: 许曼君分居资源语义): string {
  return `特殊场景/许曼君/分居/${资源文件[semantic]}`;
}

function 是分居语义(value: unknown): value is 许曼君分居资源语义 {
  return typeof value === 'string' && (许曼君分居全屏资源语义 as readonly string[]).includes(value);
}

function 轻量状态层(data: any): string[] {
  const state = data?.系统?._许曼君分居;
  if (!state || state.阶段 === '未开始') return [];
  const layers = ['201：分居中'];
  if (state.独住环境已确认) layers.push('丈夫工装、第二套餐具与出车表已收起');
  if (state.生活用品已取完) layers.push('赵国强约定个人用品已一次取完');
  if (state.钥匙位置 === '管理员室201钥匙格') layers.push('201住户钥匙：一次封存');
  if (state.钥匙用途 === '待离婚交接') layers.push('201钥匙：待离婚交接');
  if (state.留宿201权限) layers.push('201条件式留宿已解锁');
  if (state.玩家最终关系选择 === '退出关系') layers.push('未来留宿许可已撤销');
  return layers;
}

/**
 * `hasAsset`由现有资源注册表传入。资源尚未生成或加载失败时必须使用baseBackground，
 * 不得让视觉层反向改变任何路线状态。
 */
export function 读取许曼君分居视觉(
  data: unknown,
  options: {
    基础背景: string;
    资源根?: string;
    有生产育儿背景?: boolean;
    留宿阶段?: '夜' | '晨' | null;
    hasAsset?: (relativePath: string) => boolean;
  },
): 许曼君分居视觉结果 {
  const event = 许曼君分居事件CG语义(data);
  const room = options.有生产育儿背景 ? null : 许曼君分居房间背景语义(data);
  const lodging = options.留宿阶段 ? 读取201留宿背景语义(options.留宿阶段) : null;
  const raw = lodging ?? event ?? room;
  const semantic = 是分居语义(raw) ? raw : null;
  const relative = semantic ? 许曼君分居资源相对路径(semantic) : null;
  const exists = Boolean(relative && options.hasAsset?.(relative));
  const root = (options.资源根 ?? '').replace(/\/$/, '');
  return {
    语义: semantic,
    路径: exists && relative ? `${root ? `${root}/` : ''}${relative}` : null,
    回退路径: options.基础背景,
    使用回退: !exists,
    轻量状态层: 轻量状态层(data),
  };
}
