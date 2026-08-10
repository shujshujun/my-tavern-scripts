import type { 门牌 } from '../../../../../stageConfig';
import { 户静态表 } from '../../../../../stageConfig';
import { 旧钟楼跨度转时段 } from '../../../楼层时钟';
import { 手机记录时间字, 手机消息时间组键 } from '../../../手机时间显示';
import { 创建微信撤回定位 } from '../../../微信消息撤回';
import { 创建微信引用定位, 定位微信消息, 解析微信引用展示, 微信消息可引用 } from '../../../微信消息引用';
import { 头像块, el, 根文档, 群消息头像名, 私聊图片地址 } from '../资源与皮肤';
import {
  手机聊天批次,
  当前会话批次键,
  取消手机聊天批次,
  收口手机聊天输入键,
  写会话草稿,
  取会话草稿,
  删除会话草稿,
  删除会话引用草稿,
  取会话引用草稿,
  标记会话输入聚焦,
  会话输入聚焦中,
  会话正在输入,
  取会话待回复,
  替换手机聊天状态刷新计时,
  清除手机聊天状态刷新计时,
  手机聊天渲染世代仍当前,
} from '../会话瞬态';
import { 会话有未读, 玩家名, 写实时手机已读, 邀约节拍键 } from '../../数据层';
import { 请求刷新手机红点 } from '../../UI刷新';
import { 取渲染业务端口 } from './业务端口';
import { 渲染头, type 渲染上下文 } from './共享';

/** 单聊/群聊页：时间线过滤、气泡左右/撤回墓碑、长按撤回、图片/通话类型、
 *  草稿与焦点恢复、绿黄红灯、取消/立即发送、输入状态 interval/渲染世代护栏、邀约 + 菜单与会议硬门。 */
export function 渲染chat(上下文: 渲染上下文): void {
  const { 屏, root, 库, 楼, 当前绝对时段, 在当前时间线, 会议手机, 本次渲染世代 } = 上下文;
  const 当前页 = 上下文.读取当前页();
  const 会话 = 当前页.会话!;
  const 名 =
    会话 === '父亲'
      ? '爸'
      : 会话 === '群'
        ? '梧桐里7号楼务群'
        : 会话 === '姐妹群'
          ? '姐妹茶话会'
          : (户静态表[会话 as 门牌]?.妻名 ?? 会话);
  const 批次键 = 当前会话批次键(会话);
  const 有批次上下文 = 取会话待回复(批次键) !== undefined;
  const 外部输入中 = 会话正在输入(会话) && !有批次上下文;
  const 批次状态文案 = () => {
    if (外部输入中) return { 类: 'red', 文: 会话 === '群' || 会话 === '姐妹群' ? '群成员输入中' : '对方输入中' };
    const 状态 = 手机聊天批次.状态(批次键);
    if (状态.灯 === '红') return { 类: 'red', 文: '正在回复' };
    if (状态.灯 === '黄') {
      const 秒 = Math.max(1, Math.ceil((状态.截止毫秒 - Date.now()) / 1000));
      return { 类: 'yellow', 文: `等待回复 ${秒}s` };
    }
    return { 类: 'green', 文: 状态.待回复数 ? `继续输入 · ${状态.待回复数}条` : '可输入' };
  };
  const 初始状态文案 = 批次状态文案();
  渲染头(
    上下文,
    `<span class="rqp-chat-name">${_.escape(名)}</span><span class="rqp-chat-state ${初始状态文案.类}"><i></i><span>${初始状态文案.文}</span></span>`,
    () => {
      上下文.结束当前聊天输入();
      上下文.写入当前页({ 名: 'chats' });
      上下文.重绘();
    },
    false,
    'rqp-chat-title',
  );
  const 体 = el('div', 'rqp-body');
  const 泡区 = el('div', 'rqp-bubbles');
  // 真微信排版:气泡带双侧头像+小尾巴;正文楼或发布时段变化都插入时间分组。
  const 对方头像名 =
    会话 === '父亲'
      ? '父亲'
      : 会话 === '姐妹群'
        ? '姐妹群'
        : 会话 === '群'
          ? '群'
          : (户静态表[会话 as 门牌]?.妻名 ?? 会话);
  let 上时间组 = '';
  for (const [消息索引, m] of 库.消息.entries()) {
    if (m.会话 !== 会话 || !在当前时间线(m)) continue;
    const 时间组 = 手机消息时间组键(m.楼, m.时);
    if (时间组 !== 上时间组) {
      泡区.appendChild(el('div', 'rqp-b sys', 手机记录时间字(m.时)));
      上时间组 = 时间组;
    }
    if (m.类 === '撤回') {
      泡区.appendChild(el('div', 'rqp-b sys', m.发 === '我' ? '你撤回了一条消息' : '她撤回了一条消息'));
    } else if (m.类 === '通话') {
      泡区.appendChild(el('div', 'rqp-b sys', `[语音通话] ${_.escape(m.文)}`));
    } else {
      const 我方 = m.发 === '我';
      const 消息头像 = 我方 ? '主角' : 群消息头像名(会话, m.文, 对方头像名);
      const 引用展示 = 解析微信引用展示(库.消息, m.引用, 玩家名(), 对方头像名, 36, m.会话);
      const 引用卡 = 引用展示
        ? `<div class="rqp-msg-quote${引用展示.已撤回 ? ' withdrawn' : ''}">${_.escape(
            引用展示.已撤回 ? 引用展示.摘要 : `${引用展示.发送者}: ${引用展示.摘要}`,
          )}</div>`
        : '';
      const 消息行 = el(
        'div',
        `rqp-line ${我方 ? 'me' : 'ta'}`,
        `${头像块(消息头像)}<div class="rqp-b ${我方 ? 'me' : 'ta'}">${引用卡}<span class="rqp-msg-text">${_.escape(m.文)}</span>${
          m.图
            ? `<img class="rqp-chat-photo" src="${私聊图片地址(m.图)}" loading="lazy" onerror="this.remove()"/>`
            : ''
        }</div>`,
      );
      const 撤回定位 = 创建微信撤回定位(库.消息, 消息索引);
      const 引用定位 = 创建微信引用定位(库.消息, 消息索引);
      const 气泡 = 消息行.querySelector('.rqp-b') as HTMLElement | null;
      if (气泡 && 引用定位) {
        气泡.classList.add('actionable');
        if (撤回定位) 取渲染业务端口()?.绑定玩家微信撤回(气泡, 屏, 撤回定位, 批次键, 引用定位);
        else 取渲染业务端口()?.绑定玩家微信撤回(气泡, 屏, null, 批次键, 引用定位);
      }
      泡区.appendChild(消息行);
    }
  }
  // 正在输入气泡(微信同款三点跳动;她的回复生成完自动消失)
  if (手机聊天批次.状态(批次键).灯 === '红' || 外部输入中) {
    泡区.appendChild(
      el(
        'div',
        'rqp-line ta',
        `${头像块(对方头像名)}<div class="rqp-b ta"><span class="rqp-typing"><i></i><i></i><i></i></span></div>`,
      ),
    );
  }
  体.appendChild(泡区);
  屏.appendChild(体);
  // 输入(群=只发物业通知;父亲单聊只读——他只打电话)
  if (会话 !== '父亲') {
    const 是妻 = 会话 !== '群' && 会话 !== '姐妹群';
    const 输入区 = el('div', 'rqp-input-wrap');
    const 行 = el('div', 'rqp-input');
    if (是妻 && !会议手机.场景中) {
      // "+"菜单(2026-07-18 用户提案:仿真微信;第一期只有"约出来")
      const 加 = el('button', 'rqp-plusbtn', 当前页.加 ? '⊗' : '⊕') as HTMLButtonElement;
      加.addEventListener('click', () => {
        上下文.写入当前页({ ...上下文.读取当前页(), 加: !上下文.读取当前页().加 });
        上下文.重绘();
      });
      行.appendChild(加);
    }
    const ta = el('textarea', '') as HTMLTextAreaElement;
    let 输入法组合中 = false;
    ta.placeholder = 会议手机.场景中
      ? '在会场里悄悄发消息…'
      : 会话 === '群'
        ? '发一条物业通知…'
        : 会话 === '姐妹群'
          ? '插一句…'
          : '发消息…';
    ta.value = 取会话草稿(批次键) ?? '';
    const 引用草稿 = 取会话引用草稿(批次键);
    const 引用目标 = 定位微信消息(库.消息, 引用草稿);
    if (引用草稿 && (!微信消息可引用(引用目标) || 引用目标?.会话 !== 会话)) 删除会话引用草稿(批次键);
    else if (引用草稿 && 引用目标) {
      const 展示 = 解析微信引用展示(库.消息, 引用草稿, 玩家名(), 对方头像名, 28, 会话);
      if (展示 && !展示.已撤回) {
        const 预览 = el(
          'div',
          'rqp-quote-draft',
          `<span><b>${_.escape(展示.发送者)}</b>${_.escape(展示.摘要)}</span><button type="button" title="取消引用">×</button>`,
        );
        (预览.querySelector('button') as HTMLButtonElement).addEventListener('click', () => {
          删除会话引用草稿(批次键);
          标记会话输入聚焦(批次键);
          上下文.重绘();
        });
        输入区.appendChild(预览);
      }
    }
    const 发钮 = el('button', '', '发送') as HTMLButtonElement;
    const 更新批次状态展示 = () => {
      const 展示 = 批次状态文案();
      const 状态节点 = 屏.querySelector('.rqp-chat-state') as HTMLElement | null;
      if (状态节点) {
        状态节点.className = `rqp-chat-state ${展示.类}`;
        const 文节点 = 状态节点.querySelector('span');
        if (文节点) 文节点.textContent = 展示.文;
      }
      const 状态 = 手机聊天批次.状态(批次键);
      ta.disabled = 外部输入中 || 状态.灯 === '红';
      发钮.disabled = 外部输入中;
      发钮.classList.toggle('stop', 状态.灯 === '红');
      发钮.classList.toggle('waiting', 状态.灯 === '黄');
      发钮.textContent = 状态.灯 === '红' ? '停止' : 状态.灯 === '黄' && 状态.待回复数 ? '立即回复' : '发送';
    };
    发钮.addEventListener('pointerdown', ev => {
      if (!发钮.disabled) ev.preventDefault();
    });
    ta.addEventListener('focus', () => {
      标记会话输入聚焦(批次键);
      手机聊天批次.继续输入(批次键);
      更新批次状态展示();
    });
    ta.addEventListener('input', () => {
      写会话草稿(批次键, ta.value);
      手机聊天批次.继续输入(批次键);
      更新批次状态展示();
    });
    ta.addEventListener('compositionstart', () => {
      输入法组合中 = true;
    });
    ta.addEventListener('compositionend', () => {
      输入法组合中 = false;
      写会话草稿(批次键, ta.value);
      if (根文档().activeElement === ta) 手机聊天批次.继续输入(批次键);
      else 收口手机聊天输入键(批次键);
      更新批次状态展示();
    });
    ta.addEventListener('blur', () => {
      setTimeout(() => {
        if (
          !手机聊天渲染世代仍当前(本次渲染世代) ||
          上下文.读取当前页().名 !== 'chat' ||
          上下文.读取当前页().会话 !== 会话 ||
          根文档().activeElement === ta ||
          输入法组合中
        )
          return;
        写会话草稿(批次键, ta.value);
        收口手机聊天输入键(批次键);
        更新批次状态展示();
      }, 80);
    });
    // 回车直发(2026-08-03 用户提案:仿微信,Enter=发送,Shift+Enter=换行)。输入法选词的
    // 确认回车带着 isComposing/组合标记,不会误发;红灯期按钮语义是"停止",回车不代点。
    ta.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter' || ev.shiftKey || ev.isComposing || 输入法组合中) return;
      ev.preventDefault();
      if (ta.disabled || 发钮.disabled || 手机聊天批次.状态(批次键).灯 === '红') return;
      if (!ta.value.trim()) return;
      发钮.click();
    });
    发钮.addEventListener('click', () => {
      if (输入法组合中) return;
      const 状态 = 手机聊天批次.状态(批次键);
      if (状态.灯 === '红') {
        取消手机聊天批次(会话);
        return;
      }
      const 文 = ta.value.trim();
      if (!文) {
        if (状态.待回复数) {
          手机聊天批次.立即发送(批次键);
          更新批次状态展示();
        }
        return;
      }
      ta.value = '';
      删除会话草稿(批次键);
      const 引用 = 取会话引用草稿(批次键);
      删除会话引用草稿(批次键);
      屏.querySelector('.rqp-quote-draft')?.remove();
      手机聊天批次.继续输入(批次键);
      void 取渲染业务端口()?.发消息(会话, 文, 引用);
    });
    行.appendChild(ta);
    行.appendChild(发钮);
    输入区.appendChild(行);
    屏.appendChild(输入区);
    更新批次状态展示();
    if (会话输入聚焦中(批次键) && !ta.disabled) {
      setTimeout(() => {
        if (手机聊天渲染世代仍当前(本次渲染世代) && 根文档().contains(ta)) ta.focus();
      }, 0);
    }
    替换手机聊天状态刷新计时(setInterval(() => {
      if (
        !手机聊天渲染世代仍当前(本次渲染世代) ||
        上下文.读取当前页().名 !== 'chat' ||
        上下文.读取当前页().会话 !== 会话 ||
        !root.classList.contains('open')
      ) {
        清除手机聊天状态刷新计时();
        return;
      }
      更新批次状态展示();
    }, 250));
    if (是妻 && 当前页.加 && !会议手机.场景中) {
      const 冷 = 当前绝对时段 - (库.节拍[邀约节拍键(会话)] ?? -999) < 旧钟楼跨度转时段(8);
      const 赴约条 = 取渲染业务端口()?.读赴约条(上下文.楼) ?? null;
      const 已约 = !!赴约条;
      const 面 = el('div', 'rqp-plus');
      const b = el('button', '', `<i>📍</i>约出来${赴约条?.待赴约 ? '·已约好时段' : 已约 ? '·已在身边' : 冷 ? '·刚约过' : ''}`) as HTMLButtonElement;
      b.disabled = 冷 || 已约;
      b.addEventListener('click', () => {
        // v0.80:点"约出来"只进安排邀约页(微信内置网页/设置页样式),不发送、不进冷却;
        // 选定本周某天/某时段/某地点后才由安排页调用业务端口发送。
        上下文.写入当前页({ ...上下文.读取当前页(), 加: false, 名: 'invite' });
        上下文.重绘();
      });
      面.appendChild(b);
      屏.appendChild(面);
    }
  }
  体.scrollTop = 体.scrollHeight;
  // v0.80 已读所有权回渲染层：只有手机仍开着、当前页仍是本会话且确有未读时，
  // 才异步确认已读并只刷新红点（不重绘，避免 渲染→已读写→重绘 无限循环）。
  // 从关闭状态重开并直接停留在本 chat 页也会在此确认已读；关闭、切联系人、
  // 切页面、回档、切档都会令前台校验或时间线租约失效而不写。
  if (会话有未读(库, 会话, 楼, 当前绝对时段)) {
    const 前台仍有效 = () =>
      root.classList.contains('open') &&
      上下文.读取当前页().名 === 'chat' &&
      上下文.读取当前页().会话 === 会话;
    // v0.80 失败收口：变量层异常只记录不重绘，也不得把失败当成功刷新红点。
    void 写实时手机已读({ 会话 }, 前台仍有效)
      .then(已写 => {
        if (已写) 请求刷新手机红点();
      })
      .catch(错误 => {
        console.warn('微信实时已读确认失败', 错误);
      });
  }
}
