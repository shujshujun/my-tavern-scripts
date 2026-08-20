import { 头像块, el, 手机图标 } from '../资源与皮肤';
import { 当前聊天ID } from '../../运行时上下文';
import { 母亲圆场手机提示 } from '../../交互/父亲通话';
import { 渲染头, type 渲染上下文 } from './共享';

/** 微信语音来电页(父亲;跳动指示→点开手机→此屏接听)：来电展示、接听/拒绝与页面回退。 */
export function 渲染call(上下文: 渲染上下文): void {
  const { 屏, data } = 上下文;
  if (!data) {
    上下文.写入当前页({ 名: 'chats' });
    上下文.重绘();
    return;
  }
  渲染头(上下文, '微信语音');
  const 区 = el('div', 'rqp-call');
  const 来电说明 = [
    data.系统._待接来电.通牒 ? '父亲已经发出最后通牒' : '',
    data.系统._待接来电.紧急 ? '楼内风闻危机，父亲紧急来电' : '',
    母亲圆场手机提示(data.系统._待接来电.母亲圆场),
  ]
    .filter(Boolean)
    .join('；');
  区.innerHTML = `${头像块('父亲')}<b>爸</b><i>${_.escape(来电说明 || '邀请你进行语音通话…')}</i><div class="acts"><button class="no" title="挂断">${手机图标('no')}</button><button class="ok" title="接听">${手机图标('ok')}</button></div>`;
  (区.querySelector('.no') as HTMLButtonElement).addEventListener('click', () => {
    // 挂断=未接红点继续挂着；短账期不会重复扣，下一次真实联络周期仍未接才结算责任。
    上下文.写入当前页({ 名: 'chats' });
    上下文.重绘();
  });
  (区.querySelector('.ok') as HTMLButtonElement).addEventListener('click', () => {
    eventEmit('人妻公寓:接听来电', 当前聊天ID());
  });
  屏.appendChild(区);
}
