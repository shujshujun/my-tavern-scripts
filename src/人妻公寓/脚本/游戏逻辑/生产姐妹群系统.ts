import type { SchemaType } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 姐妹群成员, 雌竞火气值 } from './雌竞系统';
import { 孕情姐妹群已触发, type 微信消息 } from './手机/数据层';
import { 读取生产事件快照, type 生产通知凭据 } from './生产系统';
import { 借种三人合照已拍过, 夏乔家庭计划后果有效 } from './借种结局状态';

export type 父亲认知 = '未知' | '怀疑' | '确认';
export type 父亲公开级 = '不公开' | '怀疑' | '确认';
export type 住院姐妹群节点类型 = '恢复' | '近况' | '出院';

export interface 生产父亲认知项 {
  门牌: 门牌;
  已知怀孕: boolean;
  父亲认知: 父亲认知;
  /** 该观察者此前已经确认玩家是同一母亲哪些胎次的父亲；本胎认知仍单独计算。 */
  此前已确认胎次: number[];
  火气值: number;
}

function 本胎场次(data: SchemaType, 母亲: 门牌): string {
  return data.户[母亲]?.妻._怀孕.受孕场次标识 ?? '';
}

export function 父亲认知确认键(来源: '姐妹群' | '私聊', 母亲: 门牌, 场次标识: string, 观察者?: 门牌): string {
  return 来源 === '姐妹群'
    ? `父亲确认:姐妹群:${母亲}:${场次标识}`
    : `父亲确认:私聊:${观察者 ?? ''}:${母亲}:${场次标识}`;
}

export function 生产姐妹群事件键(母亲: 门牌, 胎次: number, 场次标识: string, 公开级: 父亲公开级): string {
  return `姐妹生产:${母亲}:${Math.max(0, Math.floor(胎次))}:${场次标识}:${公开级}`;
}

export function 生产姐妹群已触发(
  消息们: readonly Pick<微信消息, '会话' | '键'>[],
  母亲: 门牌,
  胎次: number,
  场次标识: string,
): boolean {
  if (!场次标识) return false;
  const 前缀 = `姐妹生产:${母亲}:${Math.max(0, Math.floor(胎次))}:${场次标识}:`;
  const 旧版获知键 = `产后:获知:${母亲}:${Math.max(0, Math.floor(胎次))}:${场次标识}`;
  return 消息们.some(消息 => 消息.会话 === '姐妹群' && (消息.键?.startsWith(前缀) || 消息.键 === 旧版获知键));
}

/**
 * 普通生产群的准入证据仍是同一受孕场次的孕情群消息已经真实落库。借种第一胎额外允许
 * “三人合照已实拍”作为硬准入：即使孕情群 AI 一直失败到生产，稳定照片事实也不能让整条
 * 生产／住院群链永久饿死。至少仍需一名其他群成员才能形成群聊。
 */
export function 生产姐妹群前置已满足(
  data: SchemaType,
  消息们: readonly Pick<微信消息, '会话' | '键'>[],
  凭据: 生产通知凭据,
): boolean {
  const 有其他成员 = 姐妹群成员(data).some(门牌号 => 门牌号 !== 凭据.门牌);
  const 家庭计划硬准入 =
    凭据.门牌 === '101' &&
    夏乔家庭计划后果有效(data, {
      场次标识: 凭据.场次标识,
      家庭计划知情: data.户['101']?.妻._生产.家庭计划知情,
      胎次: 凭据.胎次,
    }) &&
    借种三人合照已拍过(data);
  return 有其他成员 && (孕情姐妹群已触发(消息们, 凭据.门牌, 凭据.场次标识) || 家庭计划硬准入);
}

export function 生产父亲质问键(观察者: 门牌, 母亲: 门牌, 胎次: number, 场次标识: string): string {
  return `生产父亲质问:${观察者}:${母亲}:${Math.max(0, Math.floor(胎次))}:${场次标识}`;
}

export function 孕情群后私聊键(观察者: 门牌, 母亲: 门牌, 胎次: number, 场次标识: string): string {
  return `孕情群后私聊:${观察者}:${母亲}:${Math.max(0, Math.floor(胎次))}:${场次标识}`;
}

export function 住院姐妹群事件键(母亲: 门牌, 胎次: number, 场次标识: string, 类型: 住院姐妹群节点类型): string {
  return `姐妹住院:${母亲}:${Math.max(0, Math.floor(胎次))}:${场次标识}:${类型}`;
}

export function 住院姐妹群已触发(
  消息们: readonly Pick<微信消息, '会话' | '键'>[],
  母亲: 门牌,
  胎次: number,
  场次标识: string,
  类型: 住院姐妹群节点类型,
): boolean {
  const 前缀 = `${住院姐妹群事件键(母亲, 胎次, 场次标识, 类型)}:`;
  return 消息们.some(消息 => 消息.会话 === '姐妹群' && 消息.键?.startsWith(前缀));
}

function 已确认父亲(
  消息们: readonly Pick<微信消息, '会话' | '键'>[],
  观察者: 门牌,
  母亲: 门牌,
  场次标识: string,
): boolean {
  const 群键 = 父亲认知确认键('姐妹群', 母亲, 场次标识);
  const 私键 = 父亲认知确认键('私聊', 母亲, 场次标识, 观察者);
  return 消息们.some(
    消息 =>
      消息.键 === 群键 ||
      消息.键 === 私键 ||
      (消息.键?.startsWith(`姐妹生产:${母亲}:`) && 消息.键.includes(`:${场次标识}:确认:`)) ||
      (消息.键?.startsWith(`生产父亲质问:${观察者}:${母亲}:`) && 消息.键.endsWith(`:${场次标识}`)),
  );
}

function 从带胎次键登记此前胎次(结果: Set<number>, 键尾: string, 当前胎次: number): void {
  const 分隔 = 键尾.indexOf(':');
  if (分隔 <= 0) return;
  const 胎次 = Number(键尾.slice(0, 分隔));
  if (Number.isInteger(胎次) && 胎次 >= 1 && 胎次 < 当前胎次) 结果.add(胎次);
}

/**
 * 父亲认知按每胎独立确认，但前胎已经确认的事实不能失忆。历史只从真实手机消息键
 * 与已经提交的孩子档案重建，不新增 Schema 字段，回档裁剪消息后也会自然回退。
 */
export function 此前已确认父亲胎次(
  data: SchemaType,
  消息们: readonly Pick<微信消息, '会话' | '键'>[],
  观察者: 门牌,
  母亲: 门牌,
  当前胎次: number,
): number[] {
  const 结果 = new Set<number>();
  const 群生产前缀 = `姐妹生产:${母亲}:`;
  const 私聊质问前缀 = `生产父亲质问:${观察者}:${母亲}:`;
  const 群确认前缀 = `父亲确认:姐妹群:${母亲}:`;
  const 私聊确认前缀 = `父亲确认:私聊:${观察者}:${母亲}:`;
  const 按场次登记 = (场次标识: string) => {
    const 孩子 = data.系统._家庭文档.孩子.find(
      项 => 项.母亲门牌 === 母亲 && 项.出生场次标识 === 场次标识 && 项.胎次 < 当前胎次,
    );
    if (孩子) 结果.add(孩子.胎次);
  };

  for (const 消息 of 消息们) {
    const 键 = 消息.键;
    if (!键) continue;
    if (消息.会话 === '姐妹群' && 键.startsWith(群生产前缀) && 键.includes(':确认:')) {
      从带胎次键登记此前胎次(结果, 键.slice(群生产前缀.length), 当前胎次);
      continue;
    }
    if (消息.会话 === 观察者 && 键.startsWith(私聊质问前缀)) {
      从带胎次键登记此前胎次(结果, 键.slice(私聊质问前缀.length), 当前胎次);
      continue;
    }
    if (消息.会话 === '姐妹群' && 键.startsWith(群确认前缀)) {
      按场次登记(键.slice(群确认前缀.length));
      continue;
    }
    if (消息.会话 === 观察者 && 键.startsWith(私聊确认前缀)) {
      按场次登记(键.slice(私聊确认前缀.length));
    }
  }
  return [...结果].sort((a, b) => a - b);
}

/**
 * 生产群进入前的逐角色认知。孕情事实只认已经真实落库的孕情群事件；
 * 父亲事实另算，不能再用“都越界过”推导成全员早已确认。
 */
export function 生产父亲认知画像(
  data: SchemaType,
  消息们: readonly Pick<微信消息, '会话' | '键'>[],
  母亲: 门牌,
  当前楼层: number,
  凭据?: 生产通知凭据,
): 生产父亲认知项[] {
  const 场次标识 = 凭据?.场次标识 ?? 本胎场次(data, 母亲);
  const 当前胎次 = Math.max(1, Math.floor(凭据?.胎次 ?? data.户[母亲]?.妻._生产.本胎序号 ?? 1));
  const 已知怀孕 = 孕情姐妹群已触发(消息们, 母亲, 场次标识);
  return 姐妹群成员(data)
    .filter(门牌号 => 门牌号 !== 母亲)
    .map(门牌号 => {
      const 火气值 = 雌竞火气值(data.户[门牌号], 当前楼层);
      const 父亲认知: 父亲认知 = 已确认父亲(消息们, 门牌号, 母亲, 场次标识) ? '确认' : 火气值 >= 35 ? '怀疑' : '未知';
      const 此前已确认胎次 = 此前已确认父亲胎次(data, 消息们, 门牌号, 母亲, 当前胎次);
      return { 门牌: 门牌号, 已知怀孕, 父亲认知, 此前已确认胎次, 火气值 };
    });
}

/**
 * 父亲是否在生产群公开由本胎已经提交的事实与产妇当前关系决定。
 * 陪产是明确共同承担；较高归属会主动确认；普通探望只形成怀疑，完全缺席不凭空公开。
 */
export function 生产父亲公开级(data: SchemaType, 母亲: 门牌, 凭据?: 生产通知凭据): 父亲公开级 {
  const 妻 = data.户[母亲]?.妻;
  if (!妻) return '不公开';
  const 生产 = 妻._生产;
  const 快照 = 凭据 ? 读取生产事件快照(data, 凭据) : null;
  if (
    母亲 === '101' &&
    夏乔家庭计划后果有效(data, {
      场次标识: 凭据?.场次标识 ?? 妻._怀孕.受孕场次标识,
      家庭计划知情: 快照?.家庭计划知情 ?? 生产.家庭计划知情,
      胎次: 凭据?.胎次 ?? 生产.本胎序号,
    })
  )
    return '确认';
  const 结果 = 快照?.结果 ?? 生产.结果;
  const 产前看望 = 快照?.产前看望 ?? 生产.产前看望;
  const 产后看望 = 快照?.产后看望 ?? 生产.产后看望;
  if (结果 === '陪产' || 妻.当前阶段 >= 5 || (妻.好感值 >= 70 && 妻.堕落值 >= 65)) return '确认';
  if (产前看望 || 产后看望 || 妻.当前阶段 >= 4 || 妻.堕落值 >= 70) return '怀疑';
  return '不公开';
}
