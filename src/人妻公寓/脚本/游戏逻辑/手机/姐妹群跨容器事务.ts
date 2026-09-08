import type { SchemaType } from '../../../schema';
import { 提交双重继承结局群聊余波 } from '../双重继承系统';
import { 捕获保护快照 } from '../守护系统';
import { 读取, 排队MVU操作, 脚本写入 } from '../mvuIO';
import {
  手机锚消息签名,
  读取当前手机时间线租约世代,
} from '../手机时间线租约';
import { 读库, type 微信消息 } from './数据层';
import { 当前聊天ID, 当前手机绝对时段, 末楼 } from './运行时上下文';

/** 隐藏事务会话不会出现在联系人页，只借 `_微信` 的分支裁枝与稳定键能力保存跨容器收据。 */
export const 双重继承群聊余波事务会话 = '__RQP_SYSTEM_TX__';
export const 双重继承群聊余波收据消息键前缀 = '双重继承:姐妹群余波:收据:';
const 双重继承群聊余波消息键前缀 = '双重继承:姐妹群余波:批次:';

export interface 双重继承群聊余波收据 {
  版本: 1;
  聊天ID: string;
  时间线世代: number;
  完成楼层: number;
  批次ID: string;
  入群楼层: number;
  绝对时段: number;
  锚签名: string;
  消息总数: number;
  无消息原因: string;
}

export interface 构造双重继承群聊余波收据参数 {
  聊天ID: string;
  时间线世代: number;
  完成楼层: number;
  批次ID: string;
  入群楼层: number;
  绝对时段: number;
  锚签名: string;
  消息总数: number;
  无消息原因: string;
}

function 规范非负整数(值: number): number {
  return Number.isSafeInteger(值) && 值 >= 0 ? 值 : -1;
}

/** -1只表示旧完成档没有可靠历史完成楼；其他负数仍是非法收据身份。 */
function 规范完成楼层(值: number): number {
  return Number.isSafeInteger(值) && 值 >= -1 ? 值 : -2;
}

export function 构造双重继承群聊余波收据(
  参数: 构造双重继承群聊余波收据参数,
): 双重继承群聊余波收据 {
  return {
    版本: 1,
    聊天ID: String(参数.聊天ID ?? '').trim(),
    时间线世代: 规范非负整数(参数.时间线世代),
    完成楼层: 规范完成楼层(参数.完成楼层),
    批次ID: String(参数.批次ID ?? '').trim(),
    入群楼层: 规范非负整数(参数.入群楼层),
    绝对时段: 规范非负整数(参数.绝对时段),
    锚签名: String(参数.锚签名 ?? ''),
    消息总数: Math.max(0, Number.isSafeInteger(参数.消息总数) ? 参数.消息总数 : 0),
    无消息原因: String(参数.无消息原因 ?? '').trim(),
  };
}

export function 双重继承群聊余波收据键(收据: Pick<双重继承群聊余波收据, '批次ID'>): string {
  return `${双重继承群聊余波收据消息键前缀}${收据.批次ID}`;
}

export function 构造双重继承群聊余波消息键(
  收据: Pick<双重继承群聊余波收据, '批次ID'>,
  序号: number,
): string {
  return `${双重继承群聊余波消息键前缀}${收据.批次ID}:${Math.max(1, Math.floor(序号))}`;
}

export function 构造双重继承群聊余波收据消息(
  收据: 双重继承群聊余波收据,
  楼: number,
  时: number,
): 微信消息 {
  return {
    楼,
    时,
    会话: 双重继承群聊余波事务会话,
    发: '系统',
    文: JSON.stringify(收据),
    类: '文本',
    键: 双重继承群聊余波收据键(收据),
  };
}

function 解析双重继承群聊余波收据(原: unknown): 双重继承群聊余波收据 | null {
  try {
    const 候选 = typeof 原 === 'string' ? (JSON.parse(原) as Partial<双重继承群聊余波收据>) : null;
    if (!候选 || 候选.版本 !== 1) return null;
    const 收据 = 构造双重继承群聊余波收据({
      聊天ID: String(候选.聊天ID ?? ''),
      时间线世代: Number(候选.时间线世代),
      完成楼层: typeof 候选.完成楼层 === 'number' ? 候选.完成楼层 : -2,
      批次ID: String(候选.批次ID ?? ''),
      入群楼层: Number(候选.入群楼层),
      绝对时段: Number(候选.绝对时段),
      锚签名: String(候选.锚签名 ?? ''),
      消息总数: Number(候选.消息总数),
      无消息原因: String(候选.无消息原因 ?? ''),
    });
    if (
      !收据.聊天ID ||
      收据.时间线世代 < 0 ||
      收据.完成楼层 < -1 ||
      !收据.批次ID ||
      收据.入群楼层 < 0 ||
      收据.绝对时段 < 0 ||
      !收据.锚签名 ||
      (收据.消息总数 === 0 && !收据.无消息原因)
    ) {
      return null;
    }
    return 收据;
  } catch {
    return null;
  }
}

function 收据完全相同(左: 双重继承群聊余波收据, 右: 双重继承群聊余波收据): boolean {
  return JSON.stringify(左) === JSON.stringify(右);
}

export function 双重继承群聊余波收据完整(
  消息们: readonly Pick<微信消息, '会话' | '键' | '文'>[],
  预期收据: 双重继承群聊余波收据,
): boolean {
  const 收据消息 = 消息们.find(
    消息 => 消息.会话 === 双重继承群聊余波事务会话 && 消息.键 === 双重继承群聊余波收据键(预期收据),
  );
  const 实存收据 = 解析双重继承群聊余波收据(收据消息?.文);
  if (!实存收据 || !收据完全相同(实存收据, 预期收据)) return false;
  if (预期收据.消息总数 === 0) return Boolean(预期收据.无消息原因);
  const 键集 = new Set(
    消息们
      .filter(消息 => 消息.会话 === '姐妹群' && typeof 消息.键 === 'string')
      .map(消息 => 消息.键 as string),
  );
  for (let 序号 = 1; 序号 <= 预期收据.消息总数; 序号 += 1) {
    if (!键集.has(构造双重继承群聊余波消息键(预期收据, 序号))) return false;
  }
  return true;
}

export function 读取双重继承群聊余波收据(
  消息们: readonly Pick<微信消息, '会话' | '键' | '文'>[],
  完成楼层?: number,
): 双重继承群聊余波收据 | null {
  const 候选们 = 消息们
    .filter(
      消息 =>
        消息.会话 === 双重继承群聊余波事务会话 &&
        typeof 消息.键 === 'string' &&
        消息.键.startsWith(双重继承群聊余波收据消息键前缀),
    )
    .map(消息 => 解析双重继承群聊余波收据(消息.文))
    .filter((收据): 收据 is 双重继承群聊余波收据 => Boolean(收据))
    .filter(收据 => 完成楼层 === undefined || 收据.完成楼层 === 完成楼层)
    .sort((左, 右) => 右.绝对时段 - 左.绝对时段 || 右.入群楼层 - 左.入群楼层);
  return 候选们.find(收据 => 双重继承群聊余波收据完整(消息们, 收据)) ?? null;
}

function 当前锚签名(楼: number): string {
  const 消息 = SillyTavern.chat ?? [];
  if (!Number.isInteger(楼) || 楼 < 0 || 楼 >= 消息.length) return '';
  return 手机锚消息签名(消息[楼]);
}

function 收据仍属于当前分支(收据: 双重继承群聊余波收据, 允许刷新世代恢复: boolean): boolean {
  if (!收据.聊天ID || 当前聊天ID() !== 收据.聊天ID) return false;
  if (!允许刷新世代恢复 && 读取当前手机时间线租约世代() !== 收据.时间线世代) return false;
  if (末楼() < 收据.入群楼层 || 当前手机绝对时段() < 收据.绝对时段) return false;
  return 当前锚签名(收据.入群楼层) === 收据.锚签名;
}

async function 提交双重继承群聊余波主状态内部(
  收据: 双重继承群聊余波收据,
  允许刷新世代恢复: boolean,
): Promise<boolean> {
  if (!收据仍属于当前分支(收据, 允许刷新世代恢复)) return false;
  const 持久消息 = 读库().消息;
  if (!双重继承群聊余波收据完整(持久消息, 收据)) return false;

  const { raw, data } = 读取();
  const 路线 = data.系统._双重继承;
  if (路线.群聊余波状态 === '已完成') return true;
  if (
    路线.群聊余波状态 !== '待发送' ||
    路线.阶段 !== '已完成' ||
    路线.完成楼层 !== 收据.完成楼层 ||
    data.系统._绝对时段 < 收据.绝对时段
  ) {
    return false;
  }
  if (!收据仍属于当前分支(收据, 允许刷新世代恢复)) return false;
  if (!双重继承群聊余波收据完整(读库().消息, 收据)) return false;
  if (!提交双重继承结局群聊余波(data as SchemaType, true)) return false;
  await 脚本写入(raw, data, { 记录成长: false, 当前绝对时段: data.系统._绝对时段 });
  捕获保护快照(data);
  return true;
}

/** 当前异步任务直接提交：严格核对创建收据时的内存世代，迟到回调不能跨回档／重掷。 */
export function 提交双重继承群聊余波主状态(
  收据: 双重继承群聊余波收据,
): Promise<boolean> {
  return 排队MVU操作(() => 提交双重继承群聊余波主状态内部(收据, false));
}

/**
 * 刷新恢复：运行时世代会重置，因此以持久聊天ID、锚楼、锚签名、绝对时段和整批稳定键重新验真；
 * 真正的切分支／删楼由锚签名与 `_微信` 分支裁枝阻断，不能把旧收据提交进新时间线。
 */
export function 恢复双重继承群聊余波主状态(): Promise<boolean> {
  return 排队MVU操作(async () => {
    const { data } = 读取();
    if (data.系统._双重继承.群聊余波状态 !== '待发送') return false;
    const 收据 = 读取双重继承群聊余波收据(读库().消息, data.系统._双重继承.完成楼层);
    if (!收据) return false;
    return 提交双重继承群聊余波主状态内部(收据, true);
  });
}
