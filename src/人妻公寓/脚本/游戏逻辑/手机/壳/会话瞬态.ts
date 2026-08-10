import type { SchemaType } from '../../../../schema';
import {
  读取当前手机时间线租约世代,
  手机时间线租约仍有效,
  type 手机时间线租约,
} from '../../手机时间线租约';
import { 收口手机聊天输入, 手机聊天批次控制器, type 手机聊天批次请求 } from '../../手机聊天批次';
import { 当前聊天ID, 当前手机绝对时段 } from '../运行时上下文';
import { 读库 } from '../数据层';
import { 请求手机重绘 } from '../UI刷新';
import { 获取静音会议手机状态, type 会场私聊摘要租约 } from '../静音会议旁路';
import type { 生成通道租约 } from '../../生成通道互斥';
import type { 微信消息定位 } from '../../微信消息撤回';

/**
 * 手机会话瞬态（拆分方案 P7）：会话输入计数与租约/待回复上下文/草稿/输入聚焦/
 * 聊天渲染世代与刷新计时器/聊天批次控制器/手机发送租约 的唯一所有者。
 * 可变状态只存在本模块一份；内核与后续 P7B/P8 一律经显式 API 访问，不得自建第二份 Map/Set。
 * 本模块不得反向 import 内核/门面；批次执行器由内核在模块初始化完成后经 注册手机聊天批次执行器 安装。
 */

/** 各会话独立计数；A/B 并发完成时只释放自己的租约，不会把另一会话误解锁。 */
const 正在输入会话 = new Map<string, number>();

export interface 会话输入租约 {
  键: string;
}

export function 会话输入键(会话: string, 聊天ID: string, 手机租约世代 = 读取当前手机时间线租约世代()): string {
  return `${聊天ID}\u0000${手机租约世代}\u0000${会话}`;
}

export function 开始会话输入(会话: string, 聊天ID = 当前聊天ID(), 手机租约世代 = 读取当前手机时间线租约世代()): 会话输入租约 {
  const 键 = 会话输入键(会话, 聊天ID, 手机租约世代);
  正在输入会话.set(键, (正在输入会话.get(键) ?? 0) + 1);
  return { 键 };
}

export function 结束会话输入(租约: 会话输入租约): void {
  const 剩余 = (正在输入会话.get(租约.键) ?? 0) - 1;
  if (剩余 > 0) 正在输入会话.set(租约.键, 剩余);
  else 正在输入会话.delete(租约.键);
}

export function 会话正在输入(会话: string, 聊天ID = 当前聊天ID(), 手机租约世代 = 读取当前手机时间线租约世代()): boolean {
  return (正在输入会话.get(会话输入键(会话, 聊天ID, 手机租约世代)) ?? 0) > 0;
}

export interface 会话待回复上下文 {
  键: string;
  会话: string;
  发送租约: 手机发送租约;
  输入租约: 会话输入租约;
  /** 手动批次跨绿/黄/红批次持有的共享生成租约；唯一释放所有者是 释放会话待回复。 */
  生成租约?: 生成通道租约;
  已释放: boolean;
  活动生成ID?: string;
  活动请求序号?: number;
  活动消息标识?: string[];
  结束等待?: () => void;
}

const 会话待回复 = new Map<string, 会话待回复上下文>();
const 会话草稿 = new Map<string, string>();
/** 引用不是普通文字草稿：只在当前聊天/当前时间线短暂存活，离页即清。 */
const 会话引用草稿 = new Map<string, 微信消息定位>();
const 会话输入聚焦 = new Set<string>();
let 手机聊天渲染世代 = 0;
let 手机聊天状态刷新计时: ReturnType<typeof setInterval> | null = null;

/** 开始新一轮整屏重绘：世代 +1 并清掉旧刷新计时器，返回本次世代供页面异步回调核对。 */
export function 开始新手机聊天渲染世代(): number {
  手机聊天渲染世代 += 1;
  清除手机聊天状态刷新计时();
  return 手机聊天渲染世代;
}

/** 读取或核对渲染世代；页面在异步回调里用它判定自己是否已过期。 */
export function 手机聊天渲染世代仍当前(世代: number): boolean {
  return 手机聊天渲染世代 === 世代;
}

/** 替换当前聊天状态刷新计时器：旧的立即清除，只保留最新一份，不跨页面/跨世代残留。 */
export function 替换手机聊天状态刷新计时(计时: ReturnType<typeof setInterval>): void {
  if (手机聊天状态刷新计时 !== null) clearInterval(手机聊天状态刷新计时);
  手机聊天状态刷新计时 = 计时;
}

/** 清除并作废当前聊天状态刷新计时器。 */
export function 清除手机聊天状态刷新计时(): void {
  if (手机聊天状态刷新计时 !== null) clearInterval(手机聊天状态刷新计时);
  手机聊天状态刷新计时 = null;
}

/** 待回复上下文受控访问：取/设/删/遍历；身份核对由调用方对返回对象做 === 比对。 */
export function 取会话待回复(键: string): 会话待回复上下文 | undefined {
  return 会话待回复.get(键);
}

export function 登记会话待回复(上下文: 会话待回复上下文): void {
  会话待回复.set(上下文.键, 上下文);
}

export function 删除会话待回复(键: string): void {
  会话待回复.delete(键);
}

export function 会话待回复键列表(): string[] {
  return [...会话待回复.keys()];
}

export function 取会话草稿(键: string): string | undefined {
  return 会话草稿.get(键);
}

export function 写会话草稿(键: string, 文: string): void {
  会话草稿.set(键, 文);
}

export function 删除会话草稿(键: string): void {
  会话草稿.delete(键);
}

export function 取会话引用草稿(键: string): 微信消息定位 | undefined {
  const 引用 = 会话引用草稿.get(键);
  return 引用 ? { ...引用 } : undefined;
}

export function 写会话引用草稿(键: string, 引用: 微信消息定位): void {
  会话引用草稿.clear();
  会话引用草稿.set(键, { ...引用 });
}

export function 删除会话引用草稿(键: string): void {
  会话引用草稿.delete(键);
}

/** 切档、回档、swipe 或 ABA 世代变化时，即使没有待回复批次也必须清引用。 */
export function 清理失效会话引用草稿(): void {
  const 前缀 = `${当前聊天ID()}\u0000${读取当前手机时间线租约世代()}\u0000`;
  for (const 键 of 会话引用草稿.keys()) if (!键.startsWith(前缀)) 会话引用草稿.delete(键);
}

export function 标记会话输入聚焦(键: string): void {
  会话输入聚焦.add(键);
}

export function 取消会话输入聚焦(键: string): void {
  会话输入聚焦.delete(键);
}

export function 会话输入聚焦中(键: string): boolean {
  return 会话输入聚焦.has(键);
}

export function 当前会话批次键(会话: string): string {
  return 会话输入键(会话, 当前聊天ID(), 读取当前手机时间线租约世代());
}

export function 释放会话待回复(键: string): void {
  const 上下文 = 会话待回复.get(键);
  if (!上下文) return;
  上下文.结束等待?.();
  delete 上下文.结束等待;
  if (!上下文.已释放) {
    上下文.已释放 = true;
    结束会话输入(上下文.输入租约);
    // 手动批次持有的共享生成租约在此幂等释放；生成失败/空批次/取消/切聊/回档等一切收口都经过这里。
    上下文.生成租约?.释放();
    delete 上下文.生成租约;
  }
  会话待回复.delete(键);
}

type 批次执行器 = (请求: 手机聊天批次请求) => void;
let 已注册批次执行器: 批次执行器 | null = null;

/** 由内核在模块初始化完成后安装 执行待回复批次；注册前批次请求安全 no-op。 */
export function 注册手机聊天批次执行器(执行器: 批次执行器): void {
  已注册批次执行器 = 执行器;
}

/**
 * 批次控制器实例的唯一所有权。控制器是 ../手机聊天批次 的封装类（自带键状态/灯/请求序号），
 * 其方法面（状态/含消息/移除消息/丢弃/取消请求/请求仍有效/完成请求/继续输入/开始写入/
 * 完成写入/立即发送）被内核发送/批次生命周期与撤回流程整体消费，逐方法包裹只会复制 API，
 * 故直接导出实例；会话待回复/草稿/聚焦/输入计数等 Map/Set 本体一律不导出。
 */
export const 手机聊天批次 = new 手机聊天批次控制器(请求 => {
  void 已注册批次执行器?.(请求);
});

export function 批次仍在红灯(上下文: 会话待回复上下文, 请求序号: number): boolean {
  const 活动标识 = 上下文.活动消息标识;
  const 活动消息仍存在 =
    !活动标识?.length ||
    (() => {
      const 未撤回 = new Set(
        读库()
          .消息.filter(消息 => 消息.发 === '我' && 消息.类 !== '撤回' && !!消息.标识)
          .map(消息 => 消息.标识!),
      );
      return 活动标识.every(标识 => 未撤回.has(标识));
    })();
  return (
    会话待回复.get(上下文.键) === 上下文 &&
    手机聊天批次.请求仍有效(上下文.键, 请求序号) &&
    手机发送租约仍有效(上下文.发送租约) &&
    活动消息仍存在
  );
}

export function 取消手机聊天批次键(键: string, 重绘 = true): boolean {
  const 上下文 = 会话待回复.get(键);
  if (!上下文 || !手机聊天批次.取消请求(键)) return false;
  if (上下文.活动生成ID) stopGenerationById(上下文.活动生成ID);
  释放会话待回复(键);
  if (重绘) 请求手机重绘();
  return true;
}

export function 取消手机聊天批次(会话: string): void {
  const 键 = 当前会话批次键(会话);
  删除会话引用草稿(键);
  取消手机聊天批次键(键);
}

/** 切档、回滚或推进到另一时段后，旧世界的绿/黄/红批次都不能继续占锁或落回复。 */
export function 清理失效手机聊天批次(): void {
  for (const [键, 上下文] of [...会话待回复]) {
    if (手机发送租约仍有效(上下文.发送租约)) continue;
    if (上下文.活动生成ID) stopGenerationById(上下文.活动生成ID);
    手机聊天批次.丢弃(键);
    释放会话待回复(键);
    会话草稿.delete(键);
    会话输入聚焦.delete(键);
    console.info('[人妻公寓·手机] 时间线已变化，旧手机聊天批次已作废。');
  }
}

/** 只收口已经发送/写入中的消息；草稿由会话草稿表原样保留，绝不会进入回复批次。 */
export function 收口手机聊天输入键(键: string): void {
  会话输入聚焦.delete(键);
  收口手机聊天输入(手机聊天批次, 键, () => 释放会话待回复(键));
}

export interface 手机发送租约 {
  聊天ID: string;
  时间线租约: 手机时间线租约;
  数据: SchemaType;
  楼: number;
  绝对时段: number;
  会场摘要租约: 会场私聊摘要租约 | null;
}

export function 手机发送租约仍有效(租约: 手机发送租约): boolean {
  const 当前ID = 当前聊天ID();
  return (
    当前ID === 租约.聊天ID && 手机时间线租约仍有效(租约.时间线租约, 当前ID, SillyTavern.chat ?? [], 当前手机绝对时段())
  );
}

/** 主正文/交互入口的并发硬门：会议微信回复尚未落库时，不允许另一条正文同时起跑。 */
export function 静音会议私聊回复生成中(): boolean {
  const 状态 = 获取静音会议手机状态();
  return 状态.场景中 && 状态.参与妻.some(会话 => 会话正在输入(会话));
}
