import type { SchemaType } from '../../../schema';
import { 取绝对时段 } from '../楼层时钟';
import {
  同步录像带V4微信收据,
  录像带V4已经使用,
  录像带V4待发送戴锁线程,
  录像带V4玩家回复可触发同意,
  录像带V4微信消息键,
  选择录像带V4联合出发线程,
  type 录像带V4房间,
} from '../录像带V4状态';
import {
  录像带V4微信卡安全兜底,
  录像带V4微信气泡满足卡,
  读取录像带V4微信卡,
  type 录像带V4微信卡,
  type 录像带V4微信卡阶段,
} from '../录像带V4契约';
import { 创建手机时间线租约, 手机时间线租约仍有效 } from '../手机时间线租约';
import { 解析微信私聊气泡 } from '../手机文本格式';
import {
  写库增量,
  立即持久保存手机聊天变量,
  带当前手机分支锚,
  读库,
  手机可见单条硬上限,
  type 微信库,
  type 微信消息,
} from './数据层';
import { 小生成, 手机小生成仍有效, type 手机小生成控制 } from './生成引擎';
import { 当前手机绝对时段, 当前聊天ID, 末楼 } from './运行时上下文';
import { 请求手机重绘, 请求刷新手机红点 } from './UI刷新';
import type { 手机发送租约 } from './壳/会话瞬态';
import { 手机发送租约仍有效 } from './壳/会话瞬态';

export interface 录像带V4专用私聊结果 {
  /** 命中后普通私聊必须停下，即使本次AI失败也不能让日常回复替代VTR确认。 */
  命中: boolean;
  已写: boolean;
}

function 是房间(值: unknown): 值 is 录像带V4房间 {
  return 值 === '102' || 值 === '202';
}

function 当前路线需要手机同步(data: SchemaType): boolean {
  return (
    录像带V4已经使用(data) &&
    !['未开始', '已完成'].includes(data.系统._录像带V4.阶段) &&
    data.系统._录像带V4.场景.状态 === '未开始'
  );
}

function 当前有效消息(库: 微信库): 微信消息[] {
  return 库.消息.filter(消息 => 消息.类 !== '撤回');
}

function 找消息(消息们: readonly 微信消息[], 键: string): 微信消息 | undefined {
  return 消息们.find(消息 => 消息.发 === '对方' && 消息.键 === 键);
}

function 消息键按阶段(房间: 录像带V4房间, 阶段: 录像带V4微信卡阶段): string {
  if (阶段 === 'lock-confirmation') return 录像带V4微信消息键[房间].戴锁;
  if (阶段 === 'watch-consent') return 录像带V4微信消息键[房间].同意;
  return 录像带V4微信消息键.联合出发;
}

function 需要向主状态同步(data: SchemaType, 消息们: readonly 微信消息[]): boolean {
  const 临时 = _.cloneDeep(data) as SchemaType;
  同步录像带V4微信收据(临时, 消息们);
  return (
    JSON.stringify(临时.系统._录像带V4.微信) !== JSON.stringify(data.系统._录像带V4.微信) ||
    临时.系统._录像带V4.阶段 !== data.系统._录像带V4.阶段
  );
}

function 广播主状态复核(): void {
  eventEmit('人妻公寓:录像带V4微信凭据变化');
}

function 卡系统提示(卡: 录像带V4微信卡, 允许两只气泡: boolean): string {
  const 最多 = 允许两只气泡 ? 2 : 1;
  return (
    '你只处理《录像带》V4的专用微信确认，不读取或补写任何日常状态、地点、衣着、日程、朋友圈、其他任务或普通关系进展。' +
    `当前发言人固定为${卡.speaker}，丈夫固定为${卡.husband}；所有人物均为成年人。只把当前卡明确列出的佩戴或观看事实视为已经成立，后续阶段尚未写在当前卡里就不得提前确认。` +
    `只输出${最多 === 1 ? '一只' : '一至两只'}微信气泡，每行严格写成“${卡.speaker}:内容”，每只不超过${手机可见单条硬上限}个汉字。` +
    '不要写动作场景、系统说明、协议、标题或第三人发言；不要越过给出的停止边界。'
  );
}

function 卡用户提示(卡: 录像带V4微信卡, 玩家本批文本 = '', 联合卡?: 录像带V4微信卡): string {
  const 玩家段 = 玩家本批文本.trim() ? `\n玩家在本线程刚刚真实发来的消息：\n${玩家本批文本.trim()}` : '';
  const 联合段 = 联合卡
    ? `\n\n这也是第四项确认。完成上面一只知情同意气泡后，再按下列卡写第二只联合出发气泡；第二只不得重复前文：\n${联合卡.aiPrompt}`
    : '';
  return `${卡.aiPrompt}${玩家段}${联合段}`;
}

function 解析卡气泡(原文: string, 卡: 录像带V4微信卡, 最多条: number): string[] {
  return 解析微信私聊气泡(原文, 卡.speaker, 手机可见单条硬上限, 最多条)
    .map(文 => String(文 ?? '').trim())
    .filter(Boolean)
    .slice(0, 最多条);
}

function 构造稳定消息(房间: 录像带V4房间, 文: string, 键: string, 楼: number, 时: number): 微信消息 {
  return 带当前手机分支锚({ 楼, 时, 会话: 房间, 发: '对方' as const, 文, 类: '文本' as const, 键 });
}

async function 写卡消息(
  房间: 录像带V4房间,
  阶段: 录像带V4微信卡阶段,
  仍有效: () => boolean,
  控制?: 手机小生成控制,
  玩家本批文本 = '',
  联合卡?: 录像带V4微信卡,
): Promise<{ 已写: boolean; 写入数: number }> {
  const 卡 = 读取录像带V4微信卡(房间, 阶段);
  if (!卡 || !仍有效() || !手机小生成仍有效(控制)) return { 已写: false, 写入数: 0 };
  const 原文 = await 小生成(卡系统提示(卡, Boolean(联合卡)), 卡用户提示(卡, 玩家本批文本, 联合卡), 控制);
  if (!仍有效() || !手机小生成仍有效(控制)) return { 已写: false, 写入数: 0 };
  const 气泡 = 解析卡气泡(原文, 卡, 联合卡 ? 2 : 1);
  if (!气泡.length) return { 已写: false, 写入数: 0 };

  const 楼 = 末楼();
  const 时 = Math.max(0, 当前手机绝对时段());
  const 主气泡 = 录像带V4微信气泡满足卡(卡, 气泡[0]) ? 气泡[0] : 录像带V4微信卡安全兜底(卡);
  const 新消息: 微信消息[] = [构造稳定消息(房间, 主气泡, 消息键按阶段(房间, 阶段), 楼, 时)];
  if (联合卡 && 气泡[1]) {
    const 联合气泡 = 录像带V4微信气泡满足卡(联合卡, 气泡[1]) ? 气泡[1] : 录像带V4微信卡安全兜底(联合卡);
    新消息.push(构造稳定消息(房间, 联合气泡, 录像带V4微信消息键.联合出发, 楼, 时));
  }
  const 写入统计 = { 实际插入消息数: 0, 实际插入消息键: [] as string[] };
  const 已写 = await 写库增量({ 新圈: [], 新消息, 节拍改: {} }, 仍有效, 写入统计);
  if (!已写 || !仍有效()) return { 已写: false, 写入数: 0 };
  请求刷新手机红点();
  请求手机重绘();
  await 立即持久保存手机聊天变量(当前聊天ID());
  if (!仍有效()) return { 已写: false, 写入数: 0 };
  if (写入统计.实际插入消息数 > 0) 广播主状态复核();
  return { 已写: true, 写入数: 写入统计.实际插入消息数 };
}

async function 尝试补联合出发(data: SchemaType, 仍有效: () => boolean, 控制?: 手机小生成控制): Promise<boolean> {
  if (!当前路线需要手机同步(data) || !仍有效()) return false;
  const 消息们 = 当前有效消息(读库());
  if (找消息(消息们, 录像带V4微信消息键.联合出发)) return false;
  const 房间 = 选择录像带V4联合出发线程(消息们);
  if (!房间) return false;
  const 结果 = await 写卡消息(房间, 'departure-ready', 仍有效, 控制);
  return 结果.已写 && 结果.写入数 > 0;
}

/**
 * 手机自动节拍入口：到期后两条戴锁确认分别必达；生成失败不落稳定键，下一拍重试。
 * 两侧同意都已在当前分支落库时，补发恰好一条联合出发通知。
 */
export async function 同步录像带V4微信(data: SchemaType): Promise<boolean> {
  if (!当前路线需要手机同步(data)) return false;
  const 楼 = 末楼();
  const 时 = 取绝对时段(data);
  const 租约 = 创建手机时间线租约(当前聊天ID(), 楼, SillyTavern.chat ?? [], 时);
  if (!租约) return false;
  const 仍有效 = (): boolean => 手机时间线租约仍有效(租约, 当前聊天ID(), SillyTavern.chat ?? [], 当前手机绝对时段());
  if (!仍有效()) return false;

  let 有写入 = false;
  for (const 房间 of 录像带V4待发送戴锁线程(data, 当前有效消息(读库()), 时)) {
    if (!仍有效()) return 有写入;
    const 结果 = await 写卡消息(房间, 'lock-confirmation', 仍有效);
    if (结果.写入数 > 0) 有写入 = true;
  }
  if (!仍有效()) return 有写入;
  if (await 尝试补联合出发(data, 仍有效)) 有写入 = true;
  if (仍有效() && 需要向主状态同步(data, 当前有效消息(读库()))) 广播主状态复核();
  return 有写入;
}

/**
 * 玩家在妻子私聊中的回复若正好位于戴锁确认之后，就完全旁路普通私聊上下文，按V4卡生成
 * 知情同意。若它是第四项确认，同一次AI请求可额外写第二只联合出发气泡；AI只返回一只时
 * 也先提交同意，自动节拍随后按稳定键补发联合通知。
 */
export async function 尝试录像带V4专用私聊回复(
  data: SchemaType,
  会话: string,
  库: 微信库,
  批次消息: readonly 微信消息[],
  发送租约: 手机发送租约,
  控制: 手机小生成控制,
): Promise<录像带V4专用私聊结果> {
  if (!是房间(会话) || !当前路线需要手机同步(data)) return { 命中: false, 已写: false };
  const 消息们 = 当前有效消息(库);
  if (!录像带V4玩家回复可触发同意(消息们, 会话, 批次消息)) return { 命中: false, 已写: false };

  const 仍有效 = (): boolean => 手机发送租约仍有效(发送租约) && 手机小生成仍有效(控制);
  if (!仍有效()) return { 命中: true, 已写: false };
  const 另房 = 会话 === '102' ? '202' : '102';
  const 另房已同意 = Boolean(找消息(消息们, 录像带V4微信消息键[另房].同意));
  const 联合卡 = 另房已同意 ? 读取录像带V4微信卡(会话, 'departure-ready') : undefined;
  const 玩家文本 = 批次消息
    .filter(消息 => 消息.发 === '我' && 消息.会话 === 会话 && 消息.类 !== '撤回')
    .map(消息 => 消息.文)
    .join('\n');
  const 结果 = await 写卡消息(会话, 'watch-consent', 仍有效, 控制, 玩家文本, 联合卡);
  if (结果.写入数 > 0 && 仍有效()) {
    // 如果模型只写了第一只，马上让后续自动节拍看到已提交的第四项；不在这里发起第二次AI计费。
    if (另房已同意 && !找消息(当前有效消息(读库()), 录像带V4微信消息键.联合出发)) {
      eventEmit('人妻公寓:请求手机补拍');
    }
    广播主状态复核();
  }
  return { 命中: true, 已写: 结果.已写 && 结果.写入数 > 0 };
}
