import { el } from '../资源与皮肤';
import { 母亲圆场手机提示, 通话应答, 结束通话 } from '../../交互/父亲通话';
import { 渲染头, type 渲染上下文 } from './共享';

/** 父亲通话页：父亲记录、圆场提示、待回复/挂断、状态恢复。 */
export function 渲染talk(上下文: 渲染上下文): void {
  const { 屏, 父亲通话 } = 上下文;
  if (!父亲通话) {
    上下文.写入当前页({ 名: 'chats' });
    上下文.重绘();
    return;
  }
  渲染头(上下文, 父亲通话.状态 === '收尾中' ? '正在结束通话 · 爸' : '通话中 · 爸');
  const 体 = el('div', 'rqp-body');
  const 泡区 = el('div', 'rqp-bubbles');
  const 圆场说明 = 母亲圆场手机提示(父亲通话.母亲圆场);
  if (圆场说明) 泡区.appendChild(el('div', 'rqp-b sys', _.escape(圆场说明)));
  for (const t of 父亲通话.记录) {
    const 我方 = t.谁 === '我';
    const 行 = el('div', `rqp-line ${我方 ? 'me' : 'ta'}`);
    行.appendChild(el('div', `rqp-b ${我方 ? 'me' : 'ta'}`, _.escape(t.文)));
    泡区.appendChild(行);
  }
  if (父亲通话.状态 === '收尾中') {
    泡区.appendChild(el('div', 'rqp-b sys', '正在保存通话结果…'));
  } else if (父亲通话.待回复.序号 > 0) {
    泡区.appendChild(el('div', 'rqp-b sys', '爸正在说…'));
  }
  体.appendChild(泡区);
  屏.appendChild(体);
  if (父亲通话.状态 !== '收尾中') {
    const 行 = el('div', 'rqp-input');
    const ta = el('textarea', '') as HTMLTextAreaElement;
    const 等回复 = 父亲通话.待回复.序号 > 0;
    ta.placeholder = 等回复 ? '等待父亲回应…' : '你开口说…';
    ta.disabled = 等回复;
    const 发钮 = el('button', '', 等回复 ? '等' : '说') as HTMLButtonElement;
    发钮.disabled = 等回复;
    发钮.addEventListener('click', () => {
      const 文 = ta.value.trim();
      if (!文) return;
      ta.value = '';
      void 通话应答(文);
    });
    // 与微信聊天同一手感:Enter=开口,Shift+Enter=换行,输入法确认回车不误发。
    ta.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter' || ev.shiftKey || ev.isComposing) return;
      ev.preventDefault();
      if (!发钮.disabled && ta.value.trim()) 发钮.click();
    });
    const 挂 = el('button', '', '挂断') as HTMLButtonElement;
    挂.style.background = '#fa5151';
    挂.addEventListener('click', () => void 结束通话());
    行.appendChild(ta);
    行.appendChild(发钮);
    行.appendChild(挂);
    屏.appendChild(行);
  }
  体.scrollTop = 体.scrollHeight;
}
