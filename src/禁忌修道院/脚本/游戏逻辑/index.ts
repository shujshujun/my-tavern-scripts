import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

import { reloadOnChatChange } from '@/util/script';
import { Schema } from '../../schema';
import { 安检裁剪 } from './安检机';
import { 会议间隔, 离开会议厅, 开始投票 } from './meetingSystem';
import { 请求晋阶, 达成里程碑 } from './eventSystem';
import { 读取, 脚本写入, 脚本写入中 } from './mvuIO';
import { 检测焦点 } from './snapshotSystem';
import { 执行回合, 回合结算, 回合进行中, 选事件指令, 组快照注入, type 事件类型 } from './回合引擎';

/**
 * 禁忌修道院(重置版) - 游戏逻辑脚本
 *
 * 固定 0 楼架构(诡秘剧场式):
 *   显示层永远只有 0 楼的客户端 iframe,后续楼层只作数据库(AI 上下文/MVU 变量/回档)。
 *   主路径:客户端 eventEmit 玩家行动 → 回合引擎.执行回合(generate 不建楼 → 手动解析 → 静默落库)。
 *
 * 逃生舱路径(✠ 切回酒馆原生输入框):
 *   CHAT_COMPLETION_PROMPT_READY → 注入快照/事件指令
 *   VARIABLE_UPDATE_ENDED        → 安检机第二道
 *   MESSAGE_RECEIVED             → 回合结算
 *   两条路径靠 回合进行中() 互斥,不会双结算。
 *
 * 启动纪律(云霜凝 2.0.22 踩坑范式,xdy0.06 及以前脚本曾在此翻车):
 *   模块顶层禁止碰 Mvu/registerMvuSchema —— Mvu 未就绪时整个模块会当场死掉,
 *   CSS 注入、事件监听全部失效且无任何提示。一切初始化必须等 waitGlobalInitialized('Mvu')。
 *   全屏 CSS 只在初始化成功后注入:脚本挂了绝不把玩家的酒馆输入框藏起来。
 */

// ============================================
// 全屏化:注入酒馆主页面样式(只显示 0 楼——客户端 iframe 常驻其中,永不重建;
// 隐藏酒馆原生输入框,输入走游戏内)。右下角 ✠ 按钮可随时切回原生界面(逃生舱)。
// ============================================

function 注入全屏样式() {
  try {
    if ($('#xdy-fullscreen-style').length === 0) {
      $('head').append(
        '<style id="xdy-fullscreen-style">' +
          '#chat .mes[mesid]:not([mesid="0"]){display:none !important;}' +
          '#send_form{display:none !important;}' +
          '</style>',
      );
    }
    if ($('#xdy-ui-toggle').length === 0) {
      $('body').append(
        '<div id="xdy-ui-toggle" title="切换酒馆原生界面(逃生舱)" ' +
          'style="position:fixed;right:10px;bottom:10px;z-index:9999;width:34px;height:34px;' +
          'border-radius:50%;background:#1a1208;color:#c9a227;border:1px solid #c9a227;' +
          'display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;user-select:none;">✠</div>',
      );
      $('#xdy-ui-toggle').on('click', () => {
        const 样式 = $('#xdy-fullscreen-style');
        if (样式.attr('media') === 'not all') 样式.removeAttr('media');
        else 样式.attr('media', 'not all');
      });
    }
  } catch (e) {
    console.error('[禁忌修道院] 注入全屏样式失败:', e);
  }
}

// ============================================
// 启动引导:等 Mvu 就绪 → 注册 schema → 注入样式 → 挂全部监听
// ============================================

$(() => {
  void (async () => {
    const _top = (window.parent ?? window) as unknown as { toastr?: typeof toastr };
    try {
      const 超时 = new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('等待 Mvu 初始化超时(>10s),请检查 MVU 脚本是否启用')), 10000),
      );
      await Promise.race([waitGlobalInitialized('Mvu'), 超时]);

      // ── 安检机第一道:挂载 zod schema ──
      registerMvuSchema(Schema);

      挂载监听();
      注入全屏样式();
      reloadOnChatChange();

      // 加载成功提示(sessionStorage gate:切聊天 reload 不重弹,刷新酒馆页面弹一次)
      const TOAST_KEY = '禁忌修道院_脚本toast已弹';
      if (!sessionStorage.getItem(TOAST_KEY)) {
        _top.toastr?.success?.('游戏逻辑脚本加载正常', '禁忌修道院');
        sessionStorage.setItem(TOAST_KEY, '1');
      }
      console.info('[禁忌修道院] 游戏逻辑脚本已加载(Schema 已注册)');
    } catch (err) {
      console.error('[禁忌修道院] 游戏逻辑脚本加载失败:', err);
      _top.toastr?.error?.(
        `游戏逻辑脚本加载失败:${(err as Error)?.message ?? String(err)}\n请 F12 查看控制台`,
        '禁忌修道院',
        { timeOut: 0, extendedTimeOut: 0 },
      );
    }
  })();
});

function 挂载监听() {
  // ============================================
  // 主路径:客户端游戏内输入 → 回合引擎
  // ============================================

  eventClearEvent('禁忌修道院:玩家行动');
  eventOn('禁忌修道院:玩家行动', (payload: { 文本: string }) => {
    void 执行回合(payload.文本 ?? '');
  });

  // ============================================
  // 逃生舱路径:酒馆原生输入框玩法(✠ 切回后仍可玩)
  // ============================================

  // ── 安检机第二道:VARIABLE_UPDATE_ENDED(MVU 自动解析路径) ──
  eventClearEvent(Mvu.events.VARIABLE_UPDATE_ENDED);
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (新变量: object, 旧变量: object) => {
    if (脚本写入中 || 回合进行中()) return;
    try {
      const newData = Schema.parse(_.get(新变量, 'stat_data') ?? {});
      const oldData = Schema.parse(_.get(旧变量, 'stat_data') ?? {});
      if (安检裁剪(newData, oldData)) {
        _.set(新变量 as object, 'stat_data', newData);
        脚本写入(新变量 as object);
        console.info('[禁忌修道院] 安检机第二道:已裁剪/回写越权更新');
      }
    } catch (e) {
      console.error('[禁忌修道院] VARIABLE_UPDATE_ENDED 处理失败:', e);
    }
  });

  // ── prompt 注入:快照 + 事件指令 ──
  let 逃生舱事件: 事件类型 | null = null;
  let 逃生舱焦点: ReturnType<typeof 检测焦点>['焦点'] = [];

  eventClearEvent(tavern_events.CHAT_COMPLETION_PROMPT_READY);
  eventOn(tavern_events.CHAT_COMPLETION_PROMPT_READY, (event_data: { chat: SillyTavern.SendingMessage[] }) => {
    if (回合进行中()) return; // 主路径的注入走 generate injects,不走酒馆管道
    try {
      // 多模态 content 归一成纯文本供焦点扫描
      const 对话尾 = event_data.chat.map(条 => ({
        role: 条.role,
        content:
          typeof 条.content === 'string' ? 条.content : 条.content.map(块 => ('text' in 块 ? 块.text : '')).join('\n'),
      }));
      const { 快照, 焦点 } = 组快照注入(对话尾);
      逃生舱焦点 = 焦点;
      event_data.chat.push({ role: 'system', content: 快照 });

      const 事件 = 选事件指令();
      逃生舱事件 = 事件?.类型 ?? null;
      if (事件) event_data.chat.push({ role: 'system', content: 事件.文本 });
    } catch (e) {
      console.error('[禁忌修道院] prompt 注入失败:', e);
    }
  });

  // ── 回合结算 ──
  eventClearEvent(tavern_events.MESSAGE_RECEIVED);
  eventOn(tavern_events.MESSAGE_RECEIVED, () => {
    if (回合进行中()) return;
    try {
      回合结算(逃生舱焦点, 逃生舱事件);
      逃生舱事件 = null;
    } catch (e) {
      console.error('[禁忌修道院] MESSAGE_RECEIVED 处理失败:', e);
    }
  });

  // ============================================
  // 客户端 UI 事件
  // ============================================

  eventClearEvent('禁忌修道院:开始投票');
  eventOn('禁忌修道院:开始投票', (payload: { 规则id: string }) => {
    void 开始投票(payload.规则id);
  });

  eventClearEvent('禁忌修道院:离开会议厅');
  eventOn('禁忌修道院:离开会议厅', () => {
    离开会议厅();
  });

  eventClearEvent('禁忌修道院:晋阶');
  eventOn('禁忌修道院:晋阶', (payload: { 职位: Parameters<typeof 请求晋阶>[0] }) => {
    请求晋阶(payload.职位);
  });

  // 专线里程碑(先给事件入口,自动判定/按钮后续接;也可控制台手动触发调试)
  eventClearEvent('禁忌修道院:里程碑');
  eventOn('禁忌修道院:里程碑', (payload: { 职位: Parameters<typeof 达成里程碑>[0]; id: string }) => {
    达成里程碑(payload.职位, payload.id);
  });

  // 序章完成:按选定难度重掷首次会议倒计时(委任状界面 eventEmit)
  eventClearEvent('禁忌修道院:序章完成');
  eventOn('禁忌修道院:序章完成', () => {
    try {
      const 间隔 = 会议间隔();
      const { raw, data } = 读取();
      data.会议.倒计时 = _.random(间隔[0], 间隔[1]);
      脚本写入(raw, data);
      console.info('[禁忌修道院] 序章完成,首次会议倒计时', data.会议.倒计时);
    } catch (e) {
      console.error('[禁忌修道院] 序章完成处理失败:', e);
    }
  });
}

// ============================================
// TODO(后续按 spec 顺序补全)
// ============================================
// - 重掷本回合(回滚上一楼快照 + 重发上次行动)
// - 警戒度上涨的语义检测〔待定方案〕(回落与接口已通)
// - 讲道 AOE 触发形态〔待拍板〕、视察触发与巡查登场流程
// - 专线里程碑的自动判定/UI 入口(事件接口已通,可控制台调试)
// - 忏悔录图鉴、商店
