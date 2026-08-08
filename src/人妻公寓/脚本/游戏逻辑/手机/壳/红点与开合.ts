import type { SchemaType } from '../../../../schema';
import { Schema } from '../../../../schema';
import { 读最近有效stat } from '../../mvuIO';
import { ROOT_ID, 根文档 } from './资源与皮肤';
import { 清理失效手机聊天批次 } from './会话瞬态';
import { 读库, 会话有未读, 朋友圈有未读 } from '../数据层';
import { 末楼, 当前手机绝对时段 } from '../运行时上下文';
import { 获取静音会议手机状态, type 静音会议手机状态 } from '../静音会议旁路';
import { 活动父亲通话, 恢复父亲通话 } from '../交互/父亲通话';
import { 挂载手机, 拉回手机视口, 显示手机教程, type 手机页面 } from './挂载';

/**
 * 手机红点与开合（拆分方案 P7B1）：上次会议手机渲染键/会议手机渲染键/记录会议手机渲染键、
 * 450ms 开合防抖、有来电、刷新红点、打开手机、收起手机以显示数据库 的唯一所有者。
 * 经最小显式端口访问本轮仍在内核的 当前页 读写、渲染、结束当前聊天输入；
 * 单向依赖 挂载.ts 的 挂载手机/拉回手机视口/显示手机教程，不反向 import 内核/门面。
 */

/** 红点/开合访问本轮仍在内核的 UI 状态与动作的最小显式端口。 */
export interface 手机红点开合端口 {
  读取当前页面(): 手机页面;
  写入当前页面(页: 手机页面): void;
  渲染(): void;
  结束当前聊天输入(): void;
}

let 已注册端口: 手机红点开合端口 | null = null;

/** 由内核在模块初始化完成后安装。 */
export function 注册手机红点开合端口(端口: 手机红点开合端口): void {
  已注册端口 = 端口;
}

let 上次会议手机渲染键 = '';

export function 会议手机渲染键(状态: 静音会议手机状态): string {
  return JSON.stringify(状态);
}

/** 渲染侧在整屏重绘时对齐会议状态键（本轮渲染仍在内核，经此函数同步红点判据）。 */
export function 记录会议手机渲染键(状态: 静音会议手机状态): void {
  上次会议手机渲染键 = 会议手机渲染键(状态);
}

/**
 * 开合防抖(2026-07-18 用户实测rq0.21:点一下手机闪一下就消失)——移动端一次点按会
 * 双触发(touch合成click+原生click);开关语义下第二发变成"关"。450ms 内只认第一发。
 */
let 上次开合 = 0;
export function 开合防抖(): boolean {
  const now = Date.now();
  if (now - 上次开合 < 450) return false;
  上次开合 = now;
  return true;
}

export function 有来电(): boolean {
  try {
    const rawStat = 读最近有效stat();
    if (!rawStat) return false;
    const data = Schema.parse(rawStat) as SchemaType;
    return data.系统._待接来电.期 >= 0;
  } catch {
    return false;
  }
}

export function 刷新红点(): void {
  清理失效手机聊天批次();
  const root = 根文档().getElementById(ROOT_ID);
  if (!root) return;
  const 库 = 读库();
  const 楼 = 末楼();
  const 当前绝对时段 = 当前手机绝对时段();
  const 会议手机 = 获取静音会议手机状态();
  const 新会议手机渲染键 = 会议手机渲染键(会议手机);
  const 会议手机状态已变化 = 新会议手机渲染键 !== 上次会议手机渲染键;
  上次会议手机渲染键 = 新会议手机渲染键;
  const 未读 = 会话有未读(库, undefined, 楼, 当前绝对时段);
  const 圈新 = 朋友圈有未读(库, 楼, 当前绝对时段);
  const 可呈现来电 = 有来电() && !会议手机.场景中;
  root.classList.toggle('has-unread', 未读 || 圈新);
  root.classList.toggle('ringing', 可呈现来电);
  root.classList.toggle('mute-meeting-phone', 会议手机.场景中 && 会议手机.已开放);
  // 通知游戏界面同步跳动指示
  eventEmit('人妻公寓:手机状态', {
    未读: 未读 || 圈新,
    来电: 可呈现来电,
    静音会议: 会议手机,
  });
  if ((会议手机状态已变化 || 已注册端口?.读取当前页面().名 === 'talk') && root.classList.contains('open'))
    已注册端口?.渲染();
}

/** 游戏界面点了来电指示/手机按钮(再点一下=收起,2026-07-18 用户拍板;来电直达不收) */
export function 打开手机(直达来电 = false): void {
  挂载手机();
  const root = 根文档().getElementById(ROOT_ID);
  if (!root) return;
  if (!开合防抖()) return;
  const 会议手机 = 获取静音会议手机状态();
  if (!root.classList.contains('open') && 会议手机.场景中 && !会议手机.可打开) {
    eventEmit('人妻公寓:提示', 会议手机.禁用原因);
    return;
  }
  if (root.classList.contains('open') && !直达来电) {
    已注册端口?.结束当前聊天输入();
    root.classList.remove('open');
    root.querySelector('.rqp-guide')?.remove();
    eventEmit('人妻公寓:手机收起'); // 客户端听它:开机时替玩家退过真全屏的,收起送回去
    return;
  }
  root.classList.add('open');
  if (会议手机.场景中) 已注册端口?.写入当前页面({ 名: 'chats' });
  else if (活动父亲通话()) 已注册端口?.写入当前页面({ 名: 'talk' });
  else if (直达来电 && 有来电()) 已注册端口?.写入当前页面({ 名: 'call' });
  已注册端口?.渲染();
  void 恢复父亲通话();
  拉回手机视口();
  显示手机教程();
}

/** 数据库窗口层级低于手机壳；先收起手机，移动端才能实际操作数据库面板。 */
export function 收起手机以显示数据库(): void {
  const root = 根文档().getElementById(ROOT_ID);
  if (!root?.classList.contains('open')) return;
  已注册端口?.结束当前聊天输入();
  root.classList.remove('open');
  root.querySelector('.rqp-guide')?.remove();
  eventEmit('人妻公寓:手机收起');
}
