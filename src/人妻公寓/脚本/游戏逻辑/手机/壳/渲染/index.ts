import type { 门牌 } from '../../../../../stageConfig';
import type { SchemaType } from '../../../../../schema';
import { Schema } from '../../../../../schema';
import { 读最近有效stat } from '../../../mvuIO';
import { 取绝对时段 } from '../../../楼层时钟';
import { 手机记录在当前时间线 } from '../../../手机已读水位';
import { 读库 } from '../../数据层';
import { 末楼 } from '../../运行时上下文';
import { 获取静音会议手机状态 } from '../../静音会议旁路';
import { 活动父亲通话, 恢复父亲通话, 注册父亲通话UI端口 } from '../../交互/父亲通话';
import {
  删除会话引用草稿,
  清理失效会话引用草稿,
  清理失效手机聊天批次,
  开始新手机聊天渲染世代,
  当前会话批次键,
  收口手机聊天输入键,
} from '../会话瞬态';
import { 记录会议手机渲染键, 刷新红点, 开合防抖, 有来电, 注册手机红点开合端口 } from '../红点与开合';
import { 注册手机挂载端口, type 手机页面 } from '../挂载';
import { ROOT_ID, el, 根文档 } from '../资源与皮肤';
import { 渲染chats } from './chats';
import { 渲染chat } from './chat';
import { 渲染moments } from './moments';
import { 渲染call } from './call';
import { 渲染talk } from './talk';
import { 渲染settings } from './settings';
import { 渲染invite } from './invite';
import { 渲染头, type 渲染上下文 } from './共享';

/**
 * 手机渲染调度器（拆分方案 P7B2）：当前页 唯一状态、结束当前聊天输入、整屏调度/
 * 数据快照/页面合法化/六页分派；父亲通话/挂载/红点开合端口在此注册。
 * UI 刷新注册表的真实实现仍只由挂载层安装（注册手机挂载端口 内部注入），不搬回本模块。
 */

let 当前页: 手机页面 = { 名: 'chats' };

/** 收起手机或离开聊天页等同真正失焦；未发送草稿保留，但不再阻止已发送短句结算。 */
export function 结束当前聊天输入(): void {
  if (当前页.名 !== 'chat' || !当前页.会话) return;
  const 键 = 当前会话批次键(当前页.会话);
  删除会话引用草稿(键);
  收口手机聊天输入键(键);
}

export function 渲染(): void {
  清理失效手机聊天批次();
  清理失效会话引用草稿();
  const root = 根文档().getElementById(ROOT_ID);
  if (!root || !root.classList.contains('open')) return;
  const 屏 = root.querySelector('.rqp-screen') as HTMLElement;
  if (!屏) return;
  const 本次渲染世代 = 开始新手机聊天渲染世代();
  屏.innerHTML = '';

  let data: SchemaType | null = null;
  try {
    const rawStat = 读最近有效stat();
    if (rawStat) data = Schema.parse(rawStat) as SchemaType;
  } catch {
    /* 变量未就绪时手机仍可开,只是没内容 */
  }
  const 库 = 读库();
  const 楼 = 末楼();
  // 变量未就绪必须用 -1(与 当前手机绝对时段/读库 同一约定),不能用 0 兜底:0 是合法世界钟,
  // 会让所有 时>0 的记录被判成“未来数据”而整屏隐藏——玩家实测的“微信聊天记录被清屏、
  // 进设置页再回来又全回来了”正是这条路径(数据一直在,只是被假世界钟裁没了)。
  const 当前绝对时段 = data ? 取绝对时段(data) : -1;
  // 读库 已用 筛当前手机时间线 按同一对 楼/时段 裁过一遍。显示层这层复筛必须沿用
  // 同一统一函数：未就绪哨兵 -1 由 手机记录在当前时间线 内部识别(只放弃时轴比较，
  // 楼轴与分支过滤仍生效)，这里不得再按未就绪负时段整表放行，否则就绕开了
  // “未就绪不当未来数据删”的保护。
  const 在当前时间线 = (记录: { 楼: number; 时: number }): boolean =>
    手机记录在当前时间线(记录, 楼, 当前绝对时段);
  const 会议手机 = 获取静音会议手机状态(data);
  const 父亲通话 = 活动父亲通话(data);
  if (!会议手机.场景中) {
    if (当前页.名 === 'talk' && !父亲通话) 当前页 = { 名: 'chats' };
    if (当前页.名 === 'call' && (data?.系统._待接来电.期 ?? -1) < 0) {
      当前页 = 父亲通话 ? { 名: 'talk' } : { 名: 'chats' };
    }
  }
  记录会议手机渲染键(会议手机);
  if (会议手机.场景中 && 会议手机.可打开) {
    const 是允许私聊 = 当前页.名 === 'chat' && Boolean(当前页.会话) && 会议手机.参与妻.includes(当前页.会话 as 门牌);
    if (当前页.名 !== 'chats' && !是允许私聊) 当前页 = { 名: 'chats' };
  }

  const 上下文: 渲染上下文 = {
    屏,
    root,
    data,
    库,
    楼,
    当前绝对时段,
    在当前时间线,
    会议手机,
    父亲通话,
    本次渲染世代,
    当前页,
    读取当前页: () => 当前页,
    写入当前页: 页 => {
      当前页 = 页;
    },
    结束当前聊天输入,
    重绘: 渲染,
  };

  if (会议手机.场景中 && !会议手机.可打开) {
    渲染头(上下文, '微信');
    const 体 = el('div', 'rqp-body');
    体.style.display = 'flex';
    体.appendChild(
      el('div', 'rqp-meeting-lock', `<b>会场微信暂时锁定</b>${_.escape(会议手机.禁用原因 || '请稍后再试。')}`),
    );
    屏.appendChild(体);
    return;
  }

  if (当前页.名 === 'chats') 渲染chats(上下文);
  else if (当前页.名 === 'chat' && 当前页.会话) 渲染chat(上下文);
  else if (当前页.名 === 'moments') 渲染moments(上下文);
  else if (当前页.名 === 'call') 渲染call(上下文);
  else if (当前页.名 === 'talk') 渲染talk(上下文);
  else if (当前页.名 === 'settings') 渲染settings(上下文);
  else if (当前页.名 === 'invite' || 当前页.名 === 'invite-pick') 渲染invite(上下文);
}

// ── 端口注册：父亲通话 UI 端口、挂载端口（含真实渲染/红点，UI 刷新注册表由挂载层安装）、
// 红点开合端口 都在调度器所在模块初始化时注册，内核不再持有 当前页/渲染 组合职责。

// 父亲通话业务经最小显式端口导航壳层页面（回调中才读写 当前页），不反向引用 当前页/渲染。
注册父亲通话UI端口({
  打开通话页() {
    当前页 = { 名: 'talk' };
  },
  返回会话页() {
    当前页 = { 名: 'chats' };
  },
  正在通话页() {
    return 当前页.名 === 'talk';
  },
});

// 挂载端口：UI 刷新注册表的真实实现由挂载层安装（注册手机挂载端口 内部注入）。
注册手机挂载端口({
  结束当前聊天输入,
  读取当前页面: () => 当前页,
  写入当前页面: 页 => {
    当前页 = 页;
  },
  恢复父亲通话,
  重绘: 渲染,
  刷新红点,
  开合防抖,
  有来电,
});
注册手机红点开合端口({
  读取当前页面: () => 当前页,
  写入当前页面: 页 => {
    当前页 = 页;
  },
  渲染,
  结束当前聊天输入,
});
