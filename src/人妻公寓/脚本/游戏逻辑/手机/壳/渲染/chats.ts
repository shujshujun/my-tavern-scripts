import { 头像块, el } from '../资源与皮肤';
import { 会话有未读, 写实时手机已读 } from '../../数据层';
import { 获取会议会话禁用原因 } from '../../静音会议旁路';
import { 微信好友 } from '../../通知桥';
import { 刷新红点 } from '../红点与开合';
import { 渲染底栏, 渲染头, type 渲染上下文 } from './共享';

/** 会话列表页（微信首页）：好友资格、会议参与妻过滤、最后消息/撤回提示、未读、进入会话写已读。 */
export function 渲染chats(上下文: 渲染上下文): void {
  const { 屏, data, 库, 楼, 当前绝对时段, 在当前时间线, 会议手机 } = 上下文;
  渲染头(上下文, '微信');
  const 体 = el('div', 'rqp-body chatlist');
  if (会议手机.场景中) {
    体.appendChild(
      el(
        'div',
        'rqp-meeting-note',
        '会议微信已开放：仅本场参与妻私聊可用；父亲、其他妻、群聊和朋友圈暂时冻结。聊天不会占用或推进会议正文。',
      ),
    );
  }
  const 友们 = data ? 微信好友(data) : [{ id: '父亲', 名: '爸', 类: '父亲' as const }];
  for (const 友 of 友们) {
    const 条 = 库.消息.filter(m => m.会话 === 友.id && 在当前时间线(m));
    const 尾 = 条[条.length - 1];
    const 未读 = 会话有未读(库, 友.id, 楼, 当前绝对时段);
    const 禁用原因 = 获取会议会话禁用原因(data, 友.id);
    const 会议参与 = 会议手机.场景中 && !禁用原因;
    const r = el(
      'div',
      `rqp-row${会议参与 ? ' meeting-participant' : 禁用原因 ? ' meeting-frozen' : ''}`,
      `${头像块(友.类 === '群' ? (友.id === '姐妹群' ? '姐妹群' : '群') : 友.类 === '父亲' ? '父亲' : 友.名)}<span class="mid"><b>${友.名}</b><i>${尾 ? (尾.类 === '撤回' ? (尾.发 === '我' ? '[你撤回了一条消息]' : '[她撤回了一条消息]') : 尾.类 === '通话' ? '[语音通话]' : _.escape(尾.文.slice(0, 24))) : ''}</i></span>${未读 ? '<span class="dot"></span>' : ''}`,
    );
    if (禁用原因) r.title = 禁用原因;
    r.addEventListener('click', async () => {
      if (禁用原因) {
        eventEmit('人妻公寓:提示', 禁用原因);
        return;
      }
      上下文.写入当前页({ 名: 'chat', 会话: 友.id });
      // 已读推进走数据层实时入口：点击瞬间冻结聊天/锚消息/时段/世代租约，未就绪
      // 或提交期间切聊/回档/切分支时静默不写（不推进已读、不写 -1）；导航仍继续。
      await 写实时手机已读({ 会话: 友.id });
      上下文.重绘();
      刷新红点();
    });
    体.appendChild(r);
  }
  屏.appendChild(体);
  渲染底栏(上下文, 'chats');
}
