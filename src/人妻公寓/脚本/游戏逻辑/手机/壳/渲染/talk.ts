import { el } from '../资源与皮肤';
import { 母亲视频通话CG图片 } from '../母亲视频通话资源';
import { 母亲圆场手机提示, 通话应答, 结束通话 } from '../../交互/父亲通话';
import { 当前聊天ID } from '../../运行时上下文';
import {
  是母亲视频父亲通话,
  母亲视频通话可以发送,
  母亲视频通话可以发送结束告别,
  母亲视频通话可以提交最终回答,
  母亲视频通话当前CG,
} from '../../../母亲视频通话系统';
import { 读取母亲视频通话草稿, 保存母亲视频通话草稿, 清除母亲视频通话草稿 } from '../母亲视频通话草稿';
import { 渲染头, type 渲染上下文 } from './共享';

/** 父亲通话页：普通楼务语音保持原样；《双重继承》模式在同一小手机内显示视频CG背景。 */
export function 渲染talk(上下文: 渲染上下文): void {
  const { 屏, 父亲通话, data } = 上下文;
  if (!父亲通话) {
    上下文.写入当前页({ 名: 'chats' });
    上下文.重绘();
    return;
  }
  const 是母亲视频 = !!data && 是母亲视频父亲通话(data);
  const 视频状态 = 是母亲视频 ? data!.系统._母亲视频通话终幕 : null;
  const 当前CG = 是母亲视频 ? 母亲视频通话当前CG(data) : null;
  const 草稿聊天ID = 是母亲视频 ? 当前聊天ID() : '';
  const 草稿通话标识 = 是母亲视频 ? (视频状态?.标识 ?? '') : '';
  渲染头(
    上下文,
    父亲通话.状态 === '收尾中'
      ? `正在结束${是母亲视频 ? '视频' : ''}通话 · 爸`
      : `${是母亲视频 ? '视频' : '通话'}中 · 爸`,
  );

  const 体 = el('div', 是母亲视频 ? 'rqp-body rqp-video-talk' : 'rqp-body');
  if (是母亲视频) {
    const 地址 = 当前CG ? 母亲视频通话CG图片(当前CG.id) : '';
    const 背景 = el('img', `rqp-video-bg${地址 ? '' : ' is-missing'}`) as HTMLImageElement;
    背景.alt = '';
    背景.draggable = false;
    if (地址) 背景.src = 地址;
    体.appendChild(背景);
    体.appendChild(el('div', 'rqp-video-shade'));
    const 元 = el('div', 'rqp-video-meta');
    元.innerHTML = `<b>${_.escape(当前CG?.标题 ?? '视频画面等待资源接线')}</b><span>${_.escape(
      当前CG?.id ?? 视频状态?.当前CG ?? 'CG未就绪',
    )}</span>`;
    体.appendChild(元);
  }

  const 泡区 = el('div', 'rqp-bubbles');
  const 圆场说明 = 母亲圆场手机提示(父亲通话.母亲圆场);
  if (圆场说明 && !是母亲视频) 泡区.appendChild(el('div', 'rqp-b sys', _.escape(圆场说明)));
  const 可见记录 = 是母亲视频 ? 父亲通话.记录.slice(-3) : 父亲通话.记录;
  for (const t of 可见记录) {
    const 我方 = t.谁 === '我';
    const 行 = el('div', `rqp-line ${我方 ? 'me' : 'ta'}`);
    行.appendChild(el('div', `rqp-b ${我方 ? 'me' : 'ta'}`, _.escape(t.文)));
    泡区.appendChild(行);
  }
  if (父亲通话.状态 === '收尾中') {
    泡区.appendChild(el('div', 'rqp-b sys', 是母亲视频 ? '正在保存双重继承终幕…' : '正在保存通话结果…'));
  } else if (父亲通话.待回复.序号 > 0) {
    泡区.appendChild(el('div', 'rqp-b sys', '爸正在说…'));
  } else if (视频状态?.状态 === '等待现场正文' || 视频状态?.状态 === '正文生成中') {
    泡区.appendChild(el('div', 'rqp-b sys', '电话外的现场正在继续…'));
  } else if (视频状态?.状态 === '正文失败') {
    泡区.appendChild(el('div', 'rqp-b sys', `现场正文没有完成：${_.escape(视频状态.现场正文失败 || '请重新演绎')}`));
  } else if (视频状态?.状态 === '等待最终回答') {
    泡区.appendChild(el('div', 'rqp-b sys', '父亲在等你亲自回答最后的交接确认。'));
  } else if (视频状态?.状态 === '终幕中') {
    泡区.appendChild(
      el('div', 'rqp-b sys', 视频状态.父亲已挂断 ? '父亲已经挂断，手机画面交还302现场。' : '正在进入双重继承终幕…'),
    );
  }
  体.appendChild(泡区);
  屏.appendChild(体);

  if (是母亲视频 && 视频状态?.状态 === '通话中') {
    const 结束 = el('button', 'rqp-video-ending', '结束交接通话／让父亲登机') as HTMLButtonElement;
    结束.disabled = !母亲视频通话可以发送(data);
    结束.addEventListener('click', () => eventEmit('人妻公寓:母亲视频通话请求结束'));
    屏.appendChild(结束);
  } else if (是母亲视频 && 视频状态?.状态 === '正文失败') {
    const 重试 = el('button', 'rqp-video-ending', '重新演绎本轮现场正文') as HTMLButtonElement;
    重试.addEventListener('click', () => eventEmit('人妻公寓:母亲视频通话重试现场正文'));
    屏.appendChild(重试);
  } else if (是母亲视频 && 视频状态?.状态 === '终幕中') {
    const 继续 = el('button', 'rqp-video-ending', '继续播放终幕') as HTMLButtonElement;
    继续.addEventListener('click', () =>
      eventEmit('人妻公寓:母亲视频通话继续终幕', 草稿通话标识, 草稿聊天ID),
    );
    屏.appendChild(继续);
  }

  const 终幕已接管输入 = Boolean(是母亲视频 && 视频状态 && ['终幕中', '已完成'].includes(视频状态.状态));
  if (父亲通话.状态 !== '收尾中' && !终幕已接管输入) {
    const 行 = el('div', 'rqp-input');
    const ta = el('textarea', '') as HTMLTextAreaElement;
    const 等父亲回复 = 父亲通话.待回复.序号 > 0;
    const 等现场正文 = Boolean(视频状态 && ['等待现场正文', '正文生成中', '正文失败'].includes(视频状态.状态));
    const 允许结束告别 = 视频状态?.状态 === '结束衔接' && 母亲视频通话可以发送结束告别(data);
    const 允许最终回答 = 视频状态?.状态 === '等待最终回答' && 母亲视频通话可以提交最终回答(data);
    const 可以发送 = !等父亲回复 && (!是母亲视频 || 母亲视频通话可以发送(data) || 允许结束告别 || 允许最终回答);
    ta.value = 是母亲视频 ? 读取母亲视频通话草稿(草稿聊天ID, 草稿通话标识) : '';
    if (是母亲视频) ta.maxLength = 8000;
    ta.placeholder = 等父亲回复
      ? '等待父亲回应…'
      : 视频状态?.状态 === '正文失败'
        ? '请先重新演绎本轮现场正文…'
        : 等现场正文
          ? '可以先写草稿，现场收口后再发送…'
          : 视频状态?.状态 === '结束衔接' && !允许结束告别
            ? '正在恢复父亲刚才已经保存的最后一句…'
            : 允许结束告别
              ? '向父亲说最后一句，让他去登机……'
              : 视频状态?.状态 === '等待最终回答' && !允许最终回答
                ? '正在恢复刚才已经保存的最终回答…'
                : 允许最终回答
                  ? '亲自回答父亲最后的交接确认…'
                  : '你准备怎么回答……';
    // 等待现场正文时允许编辑草稿，但发送按钮保持锁定；父亲回复在途时为避免错发仍完全禁用。
    ta.disabled = 等父亲回复;
    if (是母亲视频) {
      ta.addEventListener('input', () => 保存母亲视频通话草稿(草稿聊天ID, 草稿通话标识, ta.value));
    }
    const 发钮 = el('button', '', 可以发送 ? '说' : '等') as HTMLButtonElement;
    发钮.disabled = !可以发送;
    let 提交中 = false;
    发钮.addEventListener('click', () => {
      const 原文 = ta.value;
      const 文 = 原文.trim();
      if (!文 || 提交中) return;
      提交中 = true;
      发钮.disabled = true;
      ta.disabled = true;
      if (是母亲视频) 清除母亲视频通话草稿(草稿聊天ID, 草稿通话标识);
      ta.value = '';
      void 通话应答(文).then(成功 => {
        if (成功) return;
        提交中 = false;
        ta.disabled = 等父亲回复;
        ta.value = 原文;
        if (是母亲视频) 保存母亲视频通话草稿(草稿聊天ID, 草稿通话标识, 原文);
        发钮.disabled = !可以发送;
      });
    });
    ta.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter' || ev.shiftKey || ev.isComposing) return;
      ev.preventDefault();
      if (!发钮.disabled && ta.value.trim()) 发钮.click();
    });
    行.appendChild(ta);
    行.appendChild(发钮);
    if (!是母亲视频) {
      const 挂 = el('button', '', '挂断') as HTMLButtonElement;
      挂.style.background = '#fa5151';
      挂.addEventListener('click', () => void 结束通话());
      行.appendChild(挂);
    }
    屏.appendChild(行);
  }
  体.scrollTop = 体.scrollHeight;
}
