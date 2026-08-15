import type { 星期名, 周作息时段 } from '../../../../周作息';
import { ROOT_ID, 手机CSS, 手机图标, 根文档, el } from './资源与皮肤';
import { 注册手机UI刷新实现 } from '../UI刷新';
import { 获取静音会议手机状态 } from '../静音会议旁路';
import { 活动父亲通话 } from '../交互/父亲通话';

/**
 * 手机壳挂载（拆分方案 P7B1）：挂好/拉回视口/教程实现与完整 挂载手机() DOM 注入的
 * 唯一所有者。为不反向 import 内核，经最小显式端口访问：结束当前聊天输入、
 * 当前页读写、恢复父亲通话、真实 渲染/刷新红点（并在注册端口时向 UI 刷新注册表
 * 安装真实实现，注册职责只此一处）、开合防抖与有来电（归红点与开合域，由内核透传）。
 * 本模块只依赖 资源与皮肤/UI刷新/静音会议旁路/父亲通话 等叶子，不 import 内核/门面。
 */

export type 手机页面名 = 'chats' | 'chat' | 'moments' | 'call' | 'talk' | 'settings' | 'invite' | 'invite-pick';

export interface 手机页面 {
  名: 手机页面名;
  /** chat:单聊"+"面板是否展开(约出来入口) */
  加?: boolean;
  会话?: string;
  /** chat/moments:当前已经按需显示的消息或动态条数。 */
  展开?: number;
  题?: string; // moments:展开中的"哪里不对劲?"(`门牌:序`)
  滚动?: number; // moments:题目展开/作答触发整页重绘时恢复当前位置
  /** chat 向前加载后保持原视野所需的底部距离；完成一次重绘后立即清除。 */
  底距?: number;
  /** invite:安排邀约页的当前选择（时间变化时渲染层会重新规范）。 */
  邀约?: { 选星期?: 星期名; 选时段?: 周作息时段; 选地点?: string };
  /** invite-pick:正在选择哪一栏（日期/时段/地点）。 */
  选择?: '日期' | '时段' | '地点';
}

/** 挂载层访问本轮仍在内核的 UI 状态/动作的最小显式端口。 */
export interface 手机挂载端口 {
  结束当前聊天输入(): void;
  读取当前页面(): 手机页面;
  写入当前页面(页: 手机页面): void;
  恢复父亲通话(): Promise<void>;
  重绘(): void;
  刷新红点(): void;
  /** 450ms 双触发防抖（归红点与开合域，经内核透传）。 */
  开合防抖(): boolean;
  有来电(): boolean;
}

let 已注册端口: 手机挂载端口 | null = null;

/** 由内核在模块初始化完成后安装；同时向 UI 刷新注册表安装真实 渲染/刷新红点（唯一注册点）。 */
export function 注册手机挂载端口(端口: 手机挂载端口): void {
  已注册端口 = 端口;
  注册手机UI刷新实现(端口.重绘, 端口.刷新红点);
}

let 挂好 = false;
/** 手机壳拉回视口(悬浮钮被拖到屏幕边缘后,弹开的壳可能在视口外;挂载时闭包赋值) */
let 已挂载拉回视口: () => void = () => {};
/** 首次操作教程由挂载闭包赋值，游戏内 Dock 打开手机时也能调用。 */
let 已挂载教程: () => void = () => {};

/** 受控拉回视口：只读调用已挂载实现，不允许外部覆盖。 */
export function 拉回手机视口(): void {
  已挂载拉回视口();
}

/** 受控显示教程：只读调用已挂载实现，不允许外部覆盖。 */
export function 显示手机教程(): void {
  已挂载教程();
}

export function 挂载手机(): void {
  if (挂好) return;
  const doc = 根文档();
  // 脚本 iframe 会随切聊天 reload:页面层残留的旧壳事件闭包已死,一律拆了重建(玉子 INSTANCE 范式变体)
  doc.getElementById(ROOT_ID)?.remove();
  doc.getElementById(`${ROOT_ID}-css`)?.remove();
  const style = doc.createElement('style');
  style.id = `${ROOT_ID}-css`;
  style.textContent = 手机CSS;
  doc.head.appendChild(style);
  const root = el('div', '');
  root.id = ROOT_ID;
  root.innerHTML =
    `<div class="rqp-shell"><button class="rqp-close" type="button" title="收起手机" aria-label="收起手机">×</button><div class="rqp-punch"></div>` +
    `<div class="rqp-status"><span class="tm"></span><span class="rt"><span class="bars"><i></i><i></i><i></i><i></i></span><span class="rqp-batt"><i></i></span></span></div>` +
    `<div class="rqp-screen"></div>` +
    `</div><button class="rqp-toggle" title="手机">${手机图标('phone')}<span class="dot"></span></button>` +
    `<div class="rqp-resize" title="按住拖动调节手机大小">${手机图标('resize')}</div>`;
  doc.body.appendChild(root);
  // 筹备确认、交互切换与主动结束都不一定产生正文楼；场景事件到达时也要立即刷新灰度硬门。
  eventOn('人妻公寓:特殊场景状态', () => 已注册端口?.刷新红点());
  // 状态栏时间(柚月同款真实时钟)
  const 走钟 = () => {
    const t = root.querySelector('.rqp-status .tm');
    if (t) t.textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };
  走钟();
  setInterval(走钟, 30000);
  // 手机可拖动(柚月同款;抓顶部状态栏/挖孔区拖,位移记 localStorage,重建后复位)
  const 壳 = root.querySelector('.rqp-shell') as HTMLElement;
  const 首次教程键 = '人妻公寓_手机操作教程_v1';
  const 关闭手机 = () => {
    已注册端口?.结束当前聊天输入();
    root.classList.remove('open');
    root.querySelector('.rqp-guide')?.remove();
    eventEmit('人妻公寓:手机收起');
  };
  (root.querySelector('.rqp-close') as HTMLButtonElement).addEventListener('click', ev => {
    ev.stopPropagation();
    if (!已注册端口?.开合防抖()) return;
    关闭手机();
  });
  const 位置键 = '人妻公寓_手机位置';
  const 夹 = (dx: number, dy: number): [number, number] => {
    const w = doc.documentElement.clientWidth;
    const h = doc.documentElement.clientHeight;
    const r = 壳.getBoundingClientRect();
    const 基x = r.left - 当前位.dx;
    const 基y = r.top - 当前位.dy;
    return [Math.min(Math.max(dx, -基x - r.width + 60), w - 基x - 60), Math.min(Math.max(dy, -基y), h - 基y - 60)];
  };
  const 当前位 = { dx: 0, dy: 0 };
  // 手机缩放(2026-07-20 玩家点单:手机端壳太大/太小自由调;并入拖动同一条transform防互踩)
  const 缩放键 = '人妻公寓_手机缩放';
  let 缩放 = 1;
  try {
    const v = parseFloat(localStorage.getItem(缩放键) ?? '1');
    if (Number.isFinite(v) && v >= 0.6 && v <= 1.6) 缩放 = v;
  } catch {
    /* 忽略 */
  }
  壳.style.transformOrigin = '100% 100%';
  const 手柄 = root.querySelector('.rqp-resize') as HTMLElement | null;
  const 应用位 = () => {
    壳.style.transform = `translate(${当前位.dx}px, ${当前位.dy}px) scale(${缩放})`;
    // 手柄在壳外(根容器直属,压得住悬浮钮),手动跟壳右下角:缩放原点=右下,角位只随拖动位移变
    if (手柄) {
      手柄.style.right = `${-8 - 当前位.dx}px`;
      手柄.style.bottom = `${56 - 当前位.dy}px`;
    }
  };
  应用位();
  // 右下角拖动缩放(2026-07-20 用户拍板交互形态):壳锚定右下,拖向右下=放大,向左上=缩小
  {
    const 柄 = 手柄;
    if (柄) {
      let 起 = { x: 0, y: 0, s: 1 };
      柄.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        起 = { x: ev.clientX, y: ev.clientY, s: 缩放 };
        柄.setPointerCapture(ev.pointerId);
      });
      柄.addEventListener('pointermove', ev => {
        if (!柄.hasPointerCapture(ev.pointerId)) return;
        const d = ev.clientX - 起.x + (ev.clientY - 起.y);
        缩放 = Math.min(1.6, Math.max(0.6, 起.s + d / 260));
        应用位();
      });
      柄.addEventListener('pointerup', ev => {
        if (柄.hasPointerCapture(ev.pointerId)) 柄.releasePointerCapture(ev.pointerId);
        try {
          localStorage.setItem(缩放键, String(Math.round(缩放 * 100) / 100));
        } catch {
          /* 忽略 */
        }
      });
    }
  }
  try {
    const 存 = JSON.parse(localStorage.getItem(位置键) ?? 'null') as { dx: number; dy: number } | null;
    if (存 && Number.isFinite(存.dx) && Number.isFinite(存.dy)) {
      当前位.dx = 存.dx;
      当前位.dy = 存.dy;
      应用位();
    }
  } catch {
    /* 位置记录坏了就回默认位 */
  }
  for (const 柄名 of ['.rqp-status', '.rqp-punch']) {
    const 柄 = root.querySelector(柄名) as HTMLElement | null;
    if (!柄) continue;
    柄.style.cursor = 'grab';
    柄.style.touchAction = 'none';
    柄.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      柄.setPointerCapture(ev.pointerId);
      柄.style.cursor = 'grabbing';
      const 起 = { x: ev.clientX, y: ev.clientY, dx: 当前位.dx, dy: 当前位.dy };
      const 动 = (e: PointerEvent) => {
        [当前位.dx, 当前位.dy] = 夹(起.dx + e.clientX - 起.x, 起.dy + e.clientY - 起.y);
        应用位();
      };
      const 停 = () => {
        柄.removeEventListener('pointermove', 动);
        柄.removeEventListener('pointerup', 停);
        柄.removeEventListener('pointercancel', 停);
        柄.style.cursor = 'grab';
        try {
          localStorage.setItem(位置键, JSON.stringify(当前位));
        } catch {
          /* 存不上就只影响下次复位 */
        }
      };
      柄.addEventListener('pointermove', 动);
      柄.addEventListener('pointerup', 停);
      柄.addEventListener('pointercancel', 停);
    });
  }
  已挂载拉回视口 = () => {
    const r = 壳.getBoundingClientRect();
    if (!r.width) return;
    const w = doc.documentElement.clientWidth;
    const h = doc.documentElement.clientHeight;
    let dx = 0;
    let dy = 0;
    if (r.right > w - 2) dx = w - 2 - r.right;
    // 左上角外侧有独立关闭钮，给它留出安全边距，避免手机贴边后按钮被视口裁掉。
    if (r.left + dx < 18) dx = 18 - r.left;
    if (r.bottom > h - 2) dy = h - 2 - r.bottom;
    if (r.top + dy < 18) dy = 18 - r.top;
    if (dx || dy) {
      当前位.dx += dx;
      当前位.dy += dy;
      应用位();
      try {
        localStorage.setItem(位置键, JSON.stringify(当前位));
      } catch {
        /* 存不上只影响下次复位 */
      }
    }
  };
  已挂载教程 = () => {
    try {
      if (localStorage.getItem(首次教程键) === '1' || root.querySelector('.rqp-guide')) return;
    } catch {
      if (root.querySelector('.rqp-guide')) return;
    }
    const 教程 = el('div', 'rqp-guide');
    教程.innerHTML = `
      <h3>手机怎么移动和缩放？</h3>
      <p><b>移动：</b>按住手机顶部的状态栏或黑色摄像头区域拖动。</p>
      <p><b>缩放：</b>拖动手机右下角的斜向缩放按钮，可在 60%～160% 间调整。</p>
      <p><b>收起：</b>点击手机左上角外侧的“×”；原来的悬浮手机图标在展开时会隐藏，不再挡住界面。</p>
      <button type="button">我知道了，开始使用</button>
      <small>位置和大小会自动记住，下次打开继续沿用。</small>`;
    教程.querySelector('button')?.addEventListener('click', () => {
      try {
        localStorage.setItem(首次教程键, '1');
      } catch {
        /* 记不住只会下次再提示 */
      }
      教程.remove();
    });
    壳.appendChild(教程);
  };
  // 悬浮钮:点=开合;拖(>8px)=挪位置(2026-07-18 用户反馈:手机端玩家挪不动按钮不友好)
  const 钮 = root.querySelector('.rqp-toggle') as HTMLElement;
  const 钮位置键 = '人妻公寓_手机钮位置';
  const 定根 = (left: number, top: number) => {
    const w = doc.documentElement.clientWidth;
    const h = doc.documentElement.clientHeight;
    root.style.left = `${Math.min(Math.max(left, 4), w - 60)}px`;
    root.style.top = `${Math.min(Math.max(top, 4), h - 60)}px`;
    root.style.right = 'auto';
    root.style.bottom = 'auto';
  };
  try {
    const 存 = JSON.parse(localStorage.getItem(钮位置键) ?? 'null') as { left: number; top: number } | null;
    if (存 && Number.isFinite(存.left) && Number.isFinite(存.top)) 定根(存.left, 存.top);
  } catch {
    /* 记录坏了用默认位 */
  }
  let 拖过 = false;
  钮.style.touchAction = 'none';
  钮.addEventListener('pointerdown', ev => {
    const r0 = root.getBoundingClientRect();
    const 起 = { x: ev.clientX, y: ev.clientY };
    拖过 = false;
    钮.setPointerCapture(ev.pointerId);
    const 动 = (e: PointerEvent) => {
      const dx = e.clientX - 起.x;
      const dy = e.clientY - 起.y;
      if (!拖过 && Math.hypot(dx, dy) < 8) return;
      拖过 = true;
      定根(r0.left + dx, r0.top + dy);
    };
    const 停 = () => {
      钮.removeEventListener('pointermove', 动);
      钮.removeEventListener('pointerup', 停);
      钮.removeEventListener('pointercancel', 停);
      if (拖过) {
        try {
          localStorage.setItem(
            钮位置键,
            JSON.stringify({ left: parseFloat(root.style.left), top: parseFloat(root.style.top) }),
          );
        } catch {
          /* 存不上只影响下次复位 */
        }
      }
    };
    钮.addEventListener('pointermove', 动);
    钮.addEventListener('pointerup', 停);
    钮.addEventListener('pointercancel', 停);
  });
  钮.addEventListener('click', () => {
    if (拖过) {
      拖过 = false; // 拖完松手触发的 click 不当开合
      return;
    }
    if (!已注册端口?.开合防抖()) return;
    const 会议手机 = 获取静音会议手机状态();
    if (!root.classList.contains('open') && 会议手机.场景中 && !会议手机.可打开) {
      eventEmit('人妻公寓:提示', 会议手机.禁用原因);
      return;
    }
    root.classList.toggle('open');
    if (root.classList.contains('open')) {
      const 当前页面 = 已注册端口?.读取当前页面() ?? { 名: 'chats' };
      // 已接起的持久通话优先恢复，其次才是尚未接听的来电。
      已注册端口?.写入当前页面(
        !会议手机.场景中 && 活动父亲通话()
          ? { 名: 'talk' }
          : !会议手机.场景中 && !!已注册端口?.有来电()
            ? { 名: 'call' }
            : 会议手机.场景中 || 当前页面.名 === 'call' || 当前页面.名 === 'talk'
              ? { 名: 'chats' }
              : 当前页面,
      );
      已注册端口?.重绘();
      void 已注册端口?.恢复父亲通话();
      拉回手机视口();
      显示手机教程();
    } else {
      关闭手机(); // 客户端听它:开机时替玩家退过真全屏的,收起送回去
    }
  });
  挂好 = true;
  已注册端口?.刷新红点();
  已注册端口?.重绘();
  void 已注册端口?.恢复父亲通话();
  console.info('[人妻公寓] 手机已挂载(页面层;形态致谢:玉子手机·柚月)');
}
