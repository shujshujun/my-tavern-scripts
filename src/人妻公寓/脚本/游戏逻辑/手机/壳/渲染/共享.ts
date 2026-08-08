import type { SchemaType } from '../../../../../schema';
import { 手机图标, el } from '../资源与皮肤';
import { 朋友圈有未读, 会话有未读, 写实时手机已读, type 微信库 } from '../../数据层';
import type { 静音会议手机状态 } from '../../静音会议旁路';
import type { 活动父亲通话 } from '../../交互/父亲通话';
import { 刷新红点, 有来电 } from '../红点与开合';
import type { 手机页面 } from '../挂载';

/**
 * 手机渲染共享层（拆分方案 P7B2）：渲染上下文类型、头栏、底栏的唯一所有者。
 * 页面 renderer 从上下文取只读快照与 当前页 读写/重绘端口，不共享可变全局副本；
 * 本层只依赖叶子模块，不 import 内核/门面/渲染调度器。
 */

export interface 渲染上下文 {
  屏: HTMLElement;
  root: HTMLElement;
  data: SchemaType | null;
  库: 微信库;
  楼: number;
  当前绝对时段: number;
  在当前时间线: (记录: { 楼: number; 时: number }) => boolean;
  会议手机: 静音会议手机状态;
  父亲通话: ReturnType<typeof 活动父亲通话>;
  本次渲染世代: number;
  /** 本次渲染时的页面快照（初始读取用）。 */
  当前页: 手机页面;
  /** 最新页面状态（事件回调用，避免闭包快照过期）。 */
  读取当前页(): 手机页面;
  写入当前页(页: 手机页面): void;
  /** 离开聊天页/收起手机时的输入收口（由调度器提供）。 */
  结束当前聊天输入(): void;
  重绘(): void;
}

/** 页面头栏：返回/齿轮(进设置)导航。 */
export function 渲染头(上下文: 渲染上下文, 标题: string, 返回?: () => void, 齿轮 = false, 标题类 = ''): void {
  const h = el('div', 'rqp-head');
  if (返回) {
    const b = el('button', 'rqp-back', '‹');
    b.addEventListener('click', 返回);
    h.appendChild(b);
  } else {
    h.appendChild(el('span', 'rqp-back'));
  }
  h.appendChild(el('b', 标题类, 标题));
  if (齿轮) {
    const g = el('button', 'rqp-gear', 手机图标('gear'));
    g.addEventListener('click', () => {
      上下文.写入当前页({ 名: 'settings' });
      上下文.重绘();
    });
    h.appendChild(g);
  } else {
    h.appendChild(el('span', 'rqp-gear'));
  }
  上下文.屏.appendChild(h);
}

/** 微信底部三签(2026-07-18 用户拍板:不做主屏与独立App,手机开机即微信;
 *  动态集成朋友圈混排,API设置藏"我"页签)。已读推进统一走 数据层.写实时手机已读:
 *  点击瞬间冻结时间线租约(含 末楼()/当前手机绝对时段() 真值),不能用渲染时的闭包快照
 *  或裸拼锚——渲染时变量可能还没就绪(时段 -1),把 -1 写成已读水位会让红点再也消不掉。 */
export function 渲染底栏(上下文: 渲染上下文, 当前: 'chats' | 'moments' | 'settings'): void {
  const { 库, 楼, 当前绝对时段, 会议手机 } = 上下文;
  const 未读 = 会话有未读(库, undefined, 楼, 当前绝对时段);
  const 圈新 = 朋友圈有未读(库, 楼, 当前绝对时段);
  const 栏 = el('div', 'rqp-tabs');
  const 签 = (
    键: 'chats' | 'moments' | 'settings',
    名: string,
    图: string,
    点: boolean,
    去: () => void,
    禁用原因 = '',
  ) => {
    const b = el('button', 当前 === 键 ? 'on' : '', `<i>${图}</i>${名}${点 ? '<span class="dot"></span>' : ''}`);
    if (禁用原因) {
      (b as HTMLButtonElement).disabled = true;
      b.title = 禁用原因;
    } else if (当前 !== 键) b.addEventListener('click', 去);
    栏.appendChild(b);
  };
  签('chats', '微信', 手机图标('chat'), 未读 || 有来电(), () => {
    上下文.写入当前页(!会议手机.场景中 && 有来电() ? { 名: 'call' } : { 名: 'chats' });
    上下文.重绘();
  });
  签(
    'moments',
    '朋友圈',
    手机图标('moments'),
    圈新,
    async () => {
      上下文.写入当前页({ 名: 'moments' });
      // 已读推进走数据层实时入口：点击瞬间冻结时间线租约，未就绪或提交期间
      // 切聊/回档/切分支时静默不写（不推进已读、不写 -1）；导航仍继续。
      await 写实时手机已读({ 朋友圈: true });
      上下文.重绘();
      刷新红点();
    },
    会议手机.场景中 ? '会议期间朋友圈暂时冻结。' : '',
  );
  签(
    'settings',
    '我',
    手机图标('me'),
    false,
    () => {
      上下文.写入当前页({ 名: 'settings' });
      上下文.重绘();
    },
    会议手机.场景中 ? '会议期间只开放参与妻私聊。' : '',
  );
  上下文.屏.appendChild(栏);
}
