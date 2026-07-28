import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

import { reloadOnChatChange } from '@/util/script';
import type { SchemaType } from '../../schema';
import { Schema } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 首夜差分, 首批门牌, 阶段标题, 查道具 } from '../../stageConfig';
import { 使用运作, 催租, 接听来电, 捡金币, 空房偷窃, 经济结算, 要钱 } from './经济系统';
import { 挂载手机, 打开手机, 刷新红点, 手机节拍, 来电已接 } from './手机系统';
import { 夜访结算, 惰性结算户, 结算焦点疑心, 冷落检测, 请求晋阶 } from './结算系统';
import { 捕获保护快照, 回滚保护字段, 有保护快照, 镜像直写 } from './守护系统';
import {
  布设摄像头,
  查看摄像头,
  考古选细节,
  考古到底,
  母亲来电线索,
  清偷窥挂起,
  读信揭晓,
  翻垃圾,
  偷窥选细节,
  打听,
  对饮,
  type 侦探结果,
} from './侦探系统';
import { 使用荣耀洞, 荣耀洞当前事件, 荣耀洞离场, 推进荣耀洞隔离拍 } from './荣耀洞';
import { 取消隔离事件, 执行隔离事件, 隔离事件进行中 } from './隔离事件引擎';
import { 装载性癖, 卸载性癖 } from './性癖系统';
import { 杀时间, 妻位置推算 } from './楼层时钟';
import { 购买, 送礼 } from './商店系统';
import { 同步整表视图, 读取最近有效, 读最近有效stat, 脚本写入, 脚本写入中 } from './mvuIO';
import { 事件角色标记, 检测焦点, 读场景, 读粘滞, 读赴约, 组公寓快照, 取本轮事件文本 } from './snapshotSystem';
import { 执行回合, 重掷回合, 重开一局, 回档至, 回合进行中, 取消本回合, 开始新游戏 } from './回合引擎';
import { 清理数据库陈旧互斥旗 } from './数据库桥';
import { 创建配置户节点, 同步入住世界书条目 } from './入住系统';

/**
 * 人妻公寓 - 游戏逻辑脚本(P0 工程骨架)
 *
 * 三入口(秦璐重置版 0.38-0.41 防护全套出厂即防,见 设计spec「代码防护体系」):
 *   CHAT_COMPLETION_PROMPT_READY → 毒快照防御+回退取楼 → 捕获保护快照 → 注入公寓快照
 *   VARIABLE_UPDATE_ENDED        → 末楼 is_user 放行 → 手动重处理只恢复不推进 →
 *                                   回滚脚本管字段 → 事件转存 → 结算(P1+) → 写回
 *   MESSAGE_RECEIVED             → 刷新保护快照
 *
 * 启动纪律(云霜凝 2.0.22 踩坑范式):模块顶层禁止碰 Mvu——一切初始化等
 * waitGlobalInitialized('Mvu'),失败弹 toast,绝不静死无提示。
 *
 * 〔P1〕固定 0 楼回合引擎(修道院直迁)/地图界面壳/稽查 v1 在下一阶段接入。
 */

// AI 生成周期标志:PROMPT_READY 设 true,写阶段末尾设 false
let _isInAiCycle = false;

// 本轮焦点户(PROMPT_READY 检测,写阶段回滚用——后台户整体拍回)
let _本轮焦点: 门牌[] = [];

// 快照注入幂等标记(marker 清旧再 push,防一条消息多份快照,防护25)
const SNAPSHOT_MARKER = '<公寓快照>';

function 当前楼层(): number {
  try {
    return getLastMessageId();
  } catch {
    return Math.max(0, (SillyTavern.chat?.length ?? 1) - 1);
  }
}

/**
 * 玩家角色名:脚本注入的快照不经过酒馆宏替换,{{user}} 会原样透传给 AI——
 * 注入前统一替换(防护24,秦璐曾硬编码"苏斌"事故)
 */
function getUserName(): string {
  try {
    const sub = (globalThis as { substitudeMacros?: (s: string) => string }).substitudeMacros;
    if (typeof sub === 'function') {
      const n = sub('{{user}}');
      if (n && n !== '{{user}}') return n;
    }
  } catch {
    /* 宏替换不可用时走兜底 */
  }
  return (SillyTavern as unknown as { name1?: string })?.name1 || '管理员';
}

/**
 * 首批入住引导(幂等):stat_data 已存在但 户 为空 → 从初始模板创建首批户节点。
 * 与毒快照纪律不冲突:stat_data 缺失时绝不动手,只在"有真值但户表空"时初始化。
 * 二三批户由入住事件动态创建(第四态休眠,P5)。
 */
function 确保首批入住(data: SchemaType): boolean {
  if (!_.isEmpty(data.户)) return false;
  const 楼 = 当前楼层();
  for (const m of 首批门牌) {
    data.户[m] = 创建配置户节点(m, 0);
    镜像直写(m, { 入住楼层: 0 });
  }
  console.info(`[人妻公寓] 首批入住引导完成(楼${楼}):${首批门牌.join('、')}`);
  return true;
}

// ============================================
// 固定0楼全屏化(修道院同款,2026-07-18 补移植):只显示 0 楼(客户端 iframe 常驻),
// 隐藏酒馆原生输入(输入走游戏内);右下角 ❀ 随时切回原生界面(逃生舱,编辑楼层/排查用)
// ============================================

function 注入全屏样式(): void {
  const doc = (window.parent ?? window).document;
  if (!doc.getElementById('rq-fullscreen-style')) {
    const s = doc.createElement('style');
    s.id = 'rq-fullscreen-style';
    s.textContent =
      '#chat .mes[mesid]:not([mesid="0"]){display:none !important;}' +
      '#send_textarea{display:none !important;}' +
      '#rightSendForm{display:none !important;}';
    doc.head.appendChild(s);
  }
  if (!doc.getElementById('rq-ui-toggle')) {
    const b = doc.createElement('div');
    b.id = 'rq-ui-toggle';
    b.title = '切换酒馆原生界面(逃生舱)';
    b.setAttribute(
      'style',
      'position:fixed;right:10px;bottom:10px;z-index:9999;width:34px;height:34px;border-radius:50%;' +
        'background:#fff5f9;color:#ff4f9a;border:1px solid #ff9cc5;display:flex;align-items:center;' +
        'justify-content:center;cursor:pointer;font-size:16px;user-select:none;box-shadow:0 2px 8px rgba(0,0,0,.15);',
    );
    b.textContent = '❀';
    b.addEventListener('click', () => {
      const s = doc.getElementById('rq-fullscreen-style') as HTMLStyleElement | null;
      if (!s) return;
      s.media = s.media === 'not all' ? '' : 'not all';
    });
    doc.body.appendChild(b);
  }
}

/**
 * 玩家把酒馆助手"渲染楼层数"设成非 0(只渲染最近 N 楼)时,0 楼的游戏界面 iframe 会被
 * 深度裁剪直接不渲染=开卡白屏。载入时强制归 0(0=渲染全部楼层)。
 * 兼容两代助手:4.x 存 extension_settings.tavern_helper.render.depth 且运行态在 Pinia
 * store 里(直接改 extension_settings 不生效还会被 store 回写覆盖,须经挂载点触达 store);
 * 3.x 存 extension_settings.TavernHelper.render.render_depth,改完存盘即生效。
 */
function 强制渲染全部楼层(): void {
  try {
    const 宿主 = (window.parent ?? window) as unknown as Record<string, unknown> & Window;
    const ST = (宿主 as { SillyTavern?: { extensionSettings?: Record<string, unknown>; saveSettingsDebounced?: () => Promise<void> } }).SillyTavern;
    const 设置 = ST?.extensionSettings;
    if (!设置) return;
    let 改过 = false;
    for (const 键 of ['tavern_helper.render.depth', 'TavernHelper.render.render_depth']) {
      const 值 = _.get(设置, 键);
      if (typeof 值 === 'number' && 值 !== 0) {
        _.set(设置, 键, 0);
        改过 = true;
      }
    }
    const piniaApp = (宿主.document?.getElementById('tavern_helper') as unknown as { __vue_app__?: { config?: { globalProperties?: { $pinia?: { state?: { value?: Record<string, any> } } } } } } | null)?.__vue_app__;
    const 渲染态 = piniaApp?.config?.globalProperties?.$pinia?.state?.value?.global_settings?.settings?.render;
    if (渲染态 && typeof 渲染态.depth === 'number' && 渲染态.depth !== 0) {
      渲染态.depth = 0; // Pinia 响应式:store 的 watch 会自行回写 extension_settings 并存盘
      改过 = true;
    }
    if (改过) {
      void ST?.saveSettingsDebounced?.();
      console.info('[人妻公寓] 检测到酒馆助手渲染楼层数非 0,已改回 0(渲染全部楼层),防止 0 楼游戏界面被裁剪');
    }
  } catch (e) {
    console.warn('[人妻公寓] 渲染楼层数自检失败(不影响游戏):', e);
  }
}

// ============================================
// 启动引导:等 Mvu 就绪 → 注册 schema → 心跳 → 挂监听(启动三件套,防护16)
// ============================================

$(() => {
  void (async () => {
    const _top = (window.parent ?? window) as unknown as { toastr?: typeof toastr; sessionStorage?: Storage };
    try {
      const 超时 = new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('等待 Mvu 初始化超时(>10s),请检查 MVU 脚本是否启用')), 10000),
      );
      await Promise.race([waitGlobalInitialized('Mvu'), 超时]);

      // 只在互斥旗存在、公开 API 经过等待仍不存在时清理死旗；活动中的数据库实例绝不触碰。
      await 清理数据库陈旧互斥旗();

      // 安检机第一道:挂载 zod schema
      registerMvuSchema(Schema);

      // 脚本心跳:每 5s 写 sessionStorage,客户端延迟检测"脚本未加载"
      try {
        _top.sessionStorage?.setItem?.('人妻公寓_脚本心跳', String(Date.now()));
        setInterval(() => {
          try {
            _top.sessionStorage?.setItem?.('人妻公寓_脚本心跳', String(Date.now()));
          } catch {
            /* 跨域受限时静默 */
          }
        }, 5000);
      } catch {
        /* 心跳失败不阻塞启动 */
      }

      挂载监听();
      reloadOnChatChange();

      // 固定0楼全屏样式(2026-07-18 用户实测:开酒馆全部楼层暴露,要翻上去才见游戏——
      // 修道院同款注入漏移植;只显示0楼客户端+藏酒馆输入,右下❀=切回原生逃生舱)
      try {
        注入全屏样式();
      } catch (e) {
        console.error('[人妻公寓] 注入全屏样式失败(游戏仍可玩,楼层未隐藏):', e);
      }

      // 渲染楼层数归 0(玩家设成非 0 时 0 楼界面会被深度裁剪=白屏)
      强制渲染全部楼层();

      // 手机挂载(P4:注入酒馆页面层;失败不阻塞游戏本体)
      try {
        挂载手机();
      } catch (e) {
        console.error('[人妻公寓] 手机挂载失败(游戏本体不受影响):', e);
      }

      // 首批入住引导(读到真值才动手)
      try {
        const 有效 = 读取最近有效();
        if (有效) {
          const { raw, data } = 有效;
          if (确保首批入住(data)) await 脚本写入(raw, data);
          await 同步入住世界书条目(data);
          await 同步整表视图(data); // 旧档升级/开新聊天:视图就位后整表条目才有内容
        }
      } catch (e) {
        console.error('[人妻公寓] 首批入住引导失败:', e);
      }

      // 加载成功提示(sessionStorage gate:切聊天 reload 不重弹)
      const TOAST_KEY = '人妻公寓_脚本toast已弹';
      if (!sessionStorage.getItem(TOAST_KEY)) {
        _top.toastr?.success?.('游戏逻辑脚本加载正常', '人妻公寓');
        sessionStorage.setItem(TOAST_KEY, '1');
      }
      console.info('[人妻公寓] 游戏逻辑脚本已加载(Schema 已注册)');
    } catch (err) {
      console.error('[人妻公寓] 游戏逻辑脚本加载失败:', err);
      _top.toastr?.error?.(
        `游戏逻辑脚本加载失败:${(err as Error)?.message ?? String(err)}\n请 F12 查看控制台`,
        '人妻公寓',
        { timeOut: 0, extendedTimeOut: 0 },
      );
    }
  })();
});

function 挂载监听() {
  // 清理本 iframe 累积的旧 listener(防 reload 累积爆炸,防护16)
  eventClearEvent(tavern_events.CHAT_COMPLETION_PROMPT_READY);
  eventClearEvent(Mvu.events.VARIABLE_UPDATE_ENDED);
  eventClearEvent(tavern_events.MESSAGE_RECEIVED);
  for (const 名 of [
    '人妻公寓:玩家行动',
    '人妻公寓:重掷',
    '人妻公寓:回档',
    '人妻公寓:取消生成',
    '人妻公寓:开始新游戏',
    '人妻公寓:重开一局',
    '人妻公寓:请求晋阶',
    '人妻公寓:翻垃圾',
    '人妻公寓:布设摄像头',
    '人妻公寓:查看摄像头',
    '人妻公寓:偷窥选细节',
    '人妻公寓:读信',
    '人妻公寓:购买',
    '人妻公寓:送礼',
    '人妻公寓:杀时间',
    '人妻公寓:回合失败',
    '人妻公寓:催租',
    '人妻公寓:要钱',
    '人妻公寓:捡金币',
    '人妻公寓:空房偷窃',
    '人妻公寓:使用运作',
    '人妻公寓:接听来电',
    '人妻公寓:开手机',
    '人妻公寓:来电已接',
    '人妻公寓:父亲通话结束',
    '人妻公寓:回合完成',
    '人妻公寓:考古选细节',
    '人妻公寓:考古到底',
    // 补齐清理名单(审计 低危3):以下 8 个此前注册了却不在清单里(防御一致性,防护16)
    '人妻公寓:隔离事件撤回',
    '人妻公寓:隔离事件重掷',
    '人妻公寓:装载性癖',
    '人妻公寓:卸载性癖',
    '人妻公寓:打听',
    '人妻公寓:对饮',
    '人妻公寓:荣耀洞',
    '人妻公寓:荣耀洞离场',
  ]) {
    eventClearEvent(名);
  }

  // ─────────────────────────────────────────────
  // 主路径:客户端 UI 事件 → 回合引擎(固定 0 楼)
  // ─────────────────────────────────────────────
  eventOn('人妻公寓:玩家行动', (行动: string) => {
    if (typeof 行动 !== 'string' || !行动.trim()) return;
    const 当前 = 读最近有效stat();
    // raw stat 未过 schema 消毒,可选链护全程再转数(审计 低危21-①)
    if (Number(_.get(当前 ?? {}, '系统._荣耀洞拍') ?? -1) >= 0 && 读场景().房间id === '洗手间' && !隔离事件进行中()) {
      安全操作((raw, data) => {
        const 文本 = 行动.trim();
        return 运行荣耀洞隔离拍(raw, data, 文本, 建隔离记录('荣耀洞继续', 文本, data));
      });
      return;
    }
    void 执行回合(行动.trim());
  });
  eventOn('人妻公寓:重掷', () => void 重掷回合());
  eventOn('人妻公寓:回档', (楼层: number) => void 回档至(Number(楼层)));
  // 撤回/重掷两入口客户端会先乐观置 发送中 锁,任何"什么都没干"的分支必须回 回合失败
  // 解锁,只回 提示 会把输入永久闩死(审计 C6)
  eventOn('人妻公寓:隔离事件撤回', () =>
    安全操作(async raw => {
      const 记录 = 读隔离记录();
      if (!记录) {
        eventEmit('人妻公寓:回合失败', '没有可撤回的独立事件');
        return;
      }
      await 恢复隔离记录(raw, 记录);
      eventEmit('人妻公寓:隔离事件完成', { 类型: '撤回' });
    }, true),
  );
  eventOn('人妻公寓:隔离事件重掷', () =>
    安全操作(async raw => {
      const 记录 = 读隔离记录();
      if (!记录) {
        eventEmit('人妻公寓:回合失败', '没有可重演的独立事件');
        return;
      }
      const 恢复后 = await 恢复隔离记录(raw, 记录);
      if (记录.入口 === '荣耀洞继续') {
        await 运行荣耀洞隔离拍(raw, 恢复后, 记录.行动, 建隔离记录('荣耀洞继续', 记录.行动, 恢复后));
      } else if (记录.入口 === '荣耀洞开始') {
        eventEmit('人妻公寓:荣耀洞');
      } else if (记录.门牌) {
        eventEmit('人妻公寓:查看摄像头', 记录.门牌);
      }
    }, true),
  );
  eventOn('人妻公寓:取消生成', () => {
    if (!取消隔离事件()) 取消本回合();
  });
  eventOn('人妻公寓:开始新游戏', (难度: string) => void 开始新游戏(String(难度 ?? '标准')));
  eventOn('人妻公寓:重开一局', () => void 重开一局());

  // ─────────────────────────────────────────────
  // 侦探与商店(P2):UI 事件 → 纯脚本结算,直写 -1 + 刷新保护快照,提示回 toast
  // ─────────────────────────────────────────────

  /** 侦探/商店结果通用落地:排队事件+落库+刷快照+toast。
   * 静默失败清零(2026-07-17 用户实测"翻垃圾点一下没变化,锁却记上了"):落库炸了必须明着报,
   * 否则玩家看到的就是"没反应",而周期锁(chat 变量)已在结算函数里写过=白吃一次冷却 */
  async function 落地(
    结果: { 提示: string; 事件?: string; 变动?: boolean; 碎片到手?: boolean },
    raw: object,
    data: SchemaType,
  ): Promise<boolean> {
    if (结果.事件) {
      data.系统._待发送事件 = data.系统._待发送事件 ? `${data.系统._待发送事件}|${结果.事件}` : 结果.事件;
    }
    if (结果.事件 || 结果.变动 || (结果 as 侦探结果).碎片到手) {
      try {
        await 脚本写入(raw, data);
        捕获保护快照(data);
      } catch (e) {
        console.error('[人妻公寓] 结果落库失败:', e, 结果);
        eventEmit('人妻公寓:提示', `⚠ 结果没记上(请截 F12 控制台给作者):${e instanceof Error ? e.message : String(e)}`);
        return false;
      }
    }
    eventEmit('人妻公寓:提示', 结果.提示);
    return true;
  }

  type 隔离入口 = '荣耀洞开始' | '荣耀洞继续' | '监控';
  type 隔离回合记录 = {
    入口: 隔离入口;
    行动: string;
    门牌?: 门牌;
    房间: string;
    日志长度: number;
    data快照: SchemaType;
    chat快照: { _侦探: unknown; _场景: unknown };
  };

  function 建隔离记录(入口: 隔离入口, 行动: string, data: SchemaType, 门牌号?: 门牌): 隔离回合记录 {
    const vars = getVariables({ type: 'chat' });
    const 日志 = _.get(vars, '_隔离事件.日志');
    return {
      入口,
      行动,
      门牌: 门牌号,
      房间: 读场景().房间id ?? '',
      日志长度: Array.isArray(日志) ? 日志.length : 0,
      data快照: _.cloneDeep(data),
      chat快照: {
        _侦探: _.cloneDeep(_.get(vars, '_侦探')),
        _场景: _.cloneDeep(_.get(vars, '_场景')),
      },
    };
  }

  async function 存隔离记录(记录: 隔离回合记录): Promise<void> {
    await updateVariablesWith(
      vars => {
        _.set(vars, '_上次隔离回合', 记录);
        return vars;
      },
      { type: 'chat' },
    );
  }

  function 读隔离记录(): 隔离回合记录 | null {
    const 原 = _.get(getVariables({ type: 'chat' }), '_上次隔离回合');
    return 原 && typeof 原 === 'object' ? (原 as 隔离回合记录) : null;
  }

  async function 恢复隔离记录(raw: object, 记录: 隔离回合记录): Promise<SchemaType> {
    const data = Schema.parse(_.cloneDeep(记录.data快照)) as SchemaType;
    await 脚本写入(raw, data);
    await updateVariablesWith(
      vars => {
        const 日志 = _.get(vars, '_隔离事件.日志');
        if (Array.isArray(日志)) _.set(vars, '_隔离事件.日志', 日志.slice(0, 记录.日志长度));
        _.set(vars, '_侦探', _.cloneDeep(记录.chat快照._侦探));
        _.set(vars, '_场景', _.cloneDeep(记录.chat快照._场景));
        _.set(vars, '_上次隔离回合', null);
        return vars;
      },
      { type: 'chat' },
    );
    捕获保护快照(data);
    return data;
  }

  /** 带毒快照守卫的操作壳(近10楼无 stat 一律不动手;失败一律明着报,不再静默)。
   * @param 失败解锁 客户端在 emit 前已乐观置 发送中 的入口传 true:失败分支改发 回合失败
   *   事件解锁输入,否则只回 提示 会永久闩死(审计 C6) */
  let 操作队列: Promise<void> = Promise.resolve();
  function 安全操作(fn: (raw: object, data: SchemaType) => void | Promise<unknown>, 失败解锁 = false) {
    操作队列 = 操作队列.then(async () => {
      try {
        const 有效 = 读取最近有效();
        if (!有效) {
          eventEmit(失败解锁 ? '人妻公寓:回合失败' : '人妻公寓:提示', '变量还没就绪,稍等两秒再试。');
          return;
        }
        await fn(有效.raw, 有效.data);
      } catch (e) {
        console.error('[人妻公寓] UI 操作失败:', e);
        eventEmit(
          失败解锁 ? '人妻公寓:回合失败' : '人妻公寓:提示',
          `⚠ 操作没成(请截 F12 控制台给作者):${e instanceof Error ? e.message : String(e)}`,
        );
      }
    });
  }

  /**
   * 当面交互的脚本终审。UI 只负责藏按钮,真正扣道具/加钱前必须在这里再验一次，
   * 防止地图陈旧、跨 iframe 事件延迟或手工触发造成隔空送礼/隔空要钱。
   */
  function 妻在当前场景(data: SchemaType, m: 门牌): boolean {
    const 场 = 读场景();
    if (!场.房间id || !data.户[m]) return false;
    if (m === '302' && 场.房间id === '302') return true;
    const 楼 = 当前楼层();
    if (读赴约(楼)?.m === m) return true;
    if (读粘滞(楼, 场.房间id).includes(m)) return true;
    const 碰面钟 = (场.进房末楼 ?? 楼) + data.系统._时段偏移楼;
    return 妻位置推算(m, 碰面钟) === 场.房间id;
  }

  /** 纯 UI 点击结算后立即开一轮 AI 演出；失败结果只提示，不消耗回合。 */
  async function 即时开演(
    结果: { 提示: string; 事件?: string; 变动?: boolean; 成功?: boolean },
    raw: object,
    data: SchemaType,
    行动: string,
  ) {
    const 已落库 = await 落地(结果, raw, data);
    if (!已落库) return;
    if (结果.成功 === false || (!结果.事件 && !结果.变动)) return;
    await 执行回合(行动);
  }

  async function 运行荣耀洞隔离拍(
    raw: object,
    data: SchemaType,
    行动: string,
    记录: 隔离回合记录,
  ): Promise<void> {
    const 导演事件 = 荣耀洞当前事件(data);
    if (!导演事件) {
      eventEmit('人妻公寓:回合失败', '荣耀洞事件状态已经结束。');
      return;
    }
    try {
      const 线程 = '荣耀洞:' + data.系统._荣耀洞起楼 + ':' + data.系统._荣耀洞门牌;
      const 正文 = await 执行隔离事件({ 类型: '荣耀洞', 线程, 行动, 导演事件, 房间: '洗手间' });
      if (!正文) throw new Error('荣耀洞事件没有生成正文');
      推进荣耀洞隔离拍(data);
      await 脚本写入(raw, data);
      捕获保护快照(data);
      await 存隔离记录(记录);
      eventEmit('人妻公寓:隔离事件完成', { 类型: '荣耀洞' });
    } catch (e) {
      console.error('[人妻公寓] 荣耀洞隔离事件失败:', e);
      eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    }
  }

  // 侦探系统的"楼层"参数全是时间语义(冷却/种子/位置)——统一喂 真实楼层+杀时间偏移
  eventOn('人妻公寓:翻垃圾', (门牌号: 门牌) =>
    安全操作((raw, data) => 落地(翻垃圾(data, 门牌号, 当前楼层() + data.系统._时段偏移楼), raw, data)),
  );

  // P5 性癖:装载(≥L4,3槽,首装开幕正戏/重装免正戏)/卸载(免费即时)
  eventOn('人妻公寓:装载性癖', (载荷: { 道具id: string; 门牌: 门牌 }) =>
    安全操作((raw, data) => 落地(装载性癖(data, String(载荷.道具id), 载荷.门牌), raw, data)),
  );
  eventOn('人妻公寓:卸载性癖', (载荷: { 门牌: 门牌; 性癖id: string }) =>
    安全操作((raw, data) => 落地(卸载性癖(data, 载荷.门牌, String(载荷.性癖id)), raw, data)),
  );

  // P5 两渠道:打听(201,伴手礼盒弹药)/对饮(信任资源轴,202 漏酒话)
  eventOn('人妻公寓:打听', (门牌号: 门牌) =>
    安全操作((raw, data) =>
      即时开演(
        打听(data, 门牌号, 当前楼层() + data.系统._时段偏移楼),
        raw,
        data,
        `(从一层大堂提着伴手礼盒出门，向街坊打听${户静态表[门牌号].妻名}家的事，随后回到大堂整理刚听见的话)`,
      ),
    ),
  );
  eventOn('人妻公寓:对饮', (门牌号: 门牌) =>
    安全操作((raw, data) =>
      即时开演(
        对饮(data, 门牌号, 当前楼层() + data.系统._时段偏移楼),
        raw,
        data,
        `(带着好酒当面与${户静态表[门牌号].夫名}对饮，留心他酒后说漏的家事)`,
      ),
    ),
  );

  // 荣耀洞(P5+:洗手间末隔间;摇签起场三拍连场,离场即收束;时间轴统一钟楼)
  eventOn('人妻公寓:荣耀洞', () =>
    安全操作(async (raw, data) => {
      const 行动 = '(在公共洗手间末隔间闩上门,在荣耀洞前坐定,等候隔板另一侧的动静)';
      const 记录 = 建隔离记录('荣耀洞开始', 行动, data);
      const 结果 = 使用荣耀洞(data, 当前楼层() + data.系统._时段偏移楼);
      if (!结果.事件) {
        await 落地(结果, raw, data);
        return;
      }
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:提示', 结果.提示);
      await 运行荣耀洞隔离拍(raw, data, 行动, 记录);
    }),
  );
  eventOn('人妻公寓:荣耀洞离场', () =>
    安全操作(async (raw, data) => {
      const 结果 = 荣耀洞离场(data);
      if (结果) await 落地(结果, raw, data);
    }),
  );

  // 杀时间(管理员室"歇一会儿":静默快进一个时段,冷却与文案由 楼层时钟.杀时间 收口)
  eventOn('人妻公寓:杀时间', (方式: string) =>
    安全操作((raw, data) => 落地(杀时间(data, String(方式 ?? ''), 当前楼层()), raw, data)),
  );

  // 偷窥回合没演成(403等):挂起的"你注意到了什么"作废,防没有正文却弹选择卡
  eventOn('人妻公寓:回合失败', () => 清偷窥挂起());

  // ─────────────────────────────────────────────
  // 经济(P3):催租三选/要钱/金币/偷窃/运作道具——纯脚本结算走 落地 壳
  // ─────────────────────────────────────────────
  eventOn('人妻公寓:催租', (载荷: { 门牌: 门牌; 选择: '硬催' | '宽限' | '垫上' }) =>
    安全操作((raw, data) => 落地(催租(data, 载荷.门牌, 载荷.选择), raw, data)),
  );
  eventOn('人妻公寓:要钱', (门牌号: 门牌) =>
    安全操作(async (raw, data) => {
      if (!妻在当前场景(data, 门牌号)) {
        eventEmit('人妻公寓:提示', '人不在你身边,这话没法当面开口。');
        return;
      }
      await 即时开演(要钱(data, 门牌号, 当前楼层()), raw, data, `(当面向${户静态表[门牌号].妻名}开口要钱,等她回应)`);
    }),
  );
  eventOn('人妻公寓:捡金币', (房间id: string) =>
    安全操作((raw, data) => 落地(捡金币(data, String(房间id), 当前楼层()), raw, data)),
  );
  eventOn('人妻公寓:空房偷窃', (门牌号: 门牌) =>
    安全操作((raw, data) => 落地(空房偷窃(data, 门牌号, 当前楼层()), raw, data)),
  );
  eventOn('人妻公寓:使用运作', (载荷: { 道具id: string; 门牌?: 门牌 }) =>
    安全操作((raw, data) => 落地(使用运作(data, String(载荷.道具id), 载荷.门牌 ?? null, 当前楼层()), raw, data)),
  );
  // 接听来电(P4 手机调用):记态度分+清挂起,回传报表与分数段给手机侧生成父亲台词
  eventOn('人妻公寓:接听来电', () =>
    安全操作(async (raw, data) => {
      const 结果 = 接听来电(data);
      if (!结果.成功) return;
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:来电已接', 结果);
    }),
  );
  eventOn('人妻公寓:父亲通话结束', () =>
    安全操作((raw, data) => {
      const 线索 = 母亲来电线索(data);
      if (!线索) return;
      return 落地(线索, raw, data);
    }),
  );

  // ─────────────────────────────────────────────
  // 手机(P4:页面层独立设备,玉子同款挂载;游戏界面只有跳动指示与红点)
  // ─────────────────────────────────────────────
  eventOn('人妻公寓:开手机', (直达来电: boolean) => 打开手机(!!直达来电));
  eventOn('人妻公寓:来电已接', (载荷: { 分数段: string; 报表: string; 通牒: boolean }) => 来电已接(载荷));
  // 回合完成:红点/来电指示刷新 + 内容引擎节拍(朋友圈近期流/主动消息/群聊,全异步不占楼)
  eventOn('人妻公寓:回合完成', () => {
    刷新红点();
    void 手机节拍();
  });

  eventOn('人妻公寓:布设摄像头', (门牌号: 门牌) => 安全操作((raw, data) => 落地(布设摄像头(data, 门牌号), raw, data)));

  // 查看摄像头:排队偷窥场景事件后自动跑一回合(偷窥剧情由 AI 演出,选项卡在回合完成后弹出)
  eventOn('人妻公寓:查看摄像头', (门牌号: 门牌) =>
    安全操作(async (raw, data) => {
      const 行动 = '(回到302关上门,悄悄调出' + 门牌号 + '室的摄像头画面,盯着看)';
      const 记录 = 建隔离记录('监控', 行动, data, 门牌号);
      const 结果 = 查看摄像头(data, 门牌号, 当前楼层() + data.系统._时段偏移楼);
      if ('提示' in 结果) {
        await 落地(结果, raw, data);
        return;
      }
      // 看监控=回302自己屋里看(2026-07-17 用户拍板):场景在脚本侧写(await 到位,快照必读到302,
      // UI 写会输给紧接着的快照组装),UI 收"监控回合"事件同步画面;拒绝分支不动窝
      try {
        await insertOrAssignVariables(
          { _场景: { 房间id: '302', 破门: false, 进房末楼: getLastMessageId() } },
          { type: 'chat' },
        );
      } catch (e) {
        console.error('[人妻公寓] 监控回合写场景失败(照常开回合):', e);
      }
      eventEmit('人妻公寓:监控回合');
      try {
        const 正文 = await 执行隔离事件({
          类型: '监控',
          线程: '监控:' + 门牌号 + ':' + 结果.拍,
          行动,
          导演事件: 结果.事件,
          房间: '302',
        });
        if (!正文) throw new Error('监控事件没有生成正文');
        捕获保护快照(data);
        await 存隔离记录(记录);
        eventEmit('人妻公寓:隔离事件完成', { 类型: '监控', 门牌: 门牌号 });
      } catch (e) {
        清偷窥挂起();
        // 场景在隔离事件之前就被改写成 302,失败必须回滚,否则玩家被凭空挪进 302
        // 且没有任何正文(审计 C4);客户端的 回合失败 handler 会重读 _场景 同步画面
        try {
          await insertOrAssignVariables({ _场景: 记录.chat快照._场景 ?? null }, { type: 'chat' });
        } catch (e2) {
          console.error('[人妻公寓] 监控失败后场景回滚失败:', e2);
        }
        console.error('[人妻公寓] 监控隔离事件失败:', e);
        eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
      }
    }),
  );

  eventOn('人妻公寓:偷窥选细节', (载荷: { 门牌: 门牌; 选项: number }) =>
    安全操作((raw, data) => 落地(偷窥选细节(data, 载荷.门牌, Number(载荷.选项)), raw, data)),
  );

  // 考古(P4 双层广场硬编码层:手机微博个人主页触发)
  eventOn('人妻公寓:考古选细节', (载荷: { 门牌: 门牌; 序: number; 选项: number }) =>
    安全操作((raw, data) => 落地(考古选细节(data, 载荷.门牌, Number(载荷.序), Number(载荷.选项)), raw, data)),
  );
  eventOn('人妻公寓:考古到底', () => 安全操作((raw, data) => 落地(考古到底(data), raw, data)));

  eventOn('人妻公寓:读信', (门牌号: 门牌) => 安全操作((raw, data) => 落地(读信揭晓(data, 门牌号), raw, data)));

  eventOn('人妻公寓:购买', (道具id: string) => 安全操作((raw, data) => 落地(购买(data, String(道具id)), raw, data)));

  eventOn('人妻公寓:送礼', (载荷: { 道具id: string; 门牌: 门牌 }) =>
    安全操作(async (raw, data) => {
      if (!妻在当前场景(data, 载荷.门牌)) {
        eventEmit('人妻公寓:提示', '她已经不在你身边了——东西没有送出。');
        return;
      }
      const 赠前阶段 = data.户[载荷.门牌].妻.当前阶段;
      const 是服饰 = !!查道具(String(载荷.道具id))?.服饰;
      const 结果 = await 送礼(data, String(载荷.道具id), 载荷.门牌);
      const 是开门礼 = 赠前阶段 === 0 && data.户[载荷.门牌].妻.当前阶段 > 0;
      if (是服饰 || 是开门礼) {
        await 即时开演(
          结果,
          raw,
          data,
          `(当面把「${String(载荷.道具id)}」递给${户静态表[载荷.门牌].妻名},停下来等她回应)`,
        );
      } else {
        // 普通礼物不强抢一个 AI 回合；已排队的回响在玩家下一次正常行动时一起演出。
        await 落地(结果, raw, data);
      }
    }),
  );

  // 晋阶按钮(UI 抬升点):脚本结算+镜像直写,正戏事件排队到下一楼
  eventOn('人妻公寓:请求晋阶', async (门牌号: 门牌) => {
    try {
      const 有效 = 读取最近有效();
      if (!有效) return;
      const { raw, data } = 有效;
      // 每楼一段闸(2026-07-26 审计 M6):晋阶不耗堕落不记楼层,攒够 80 连点=2→3→4→5
      // 多段正戏被 | 挤进同一楼演;上一段转折还没上演前不放下一段(一段一楼是设计)
      if (/【转折正戏】|【药物首夜】/.test(data.系统._待发送事件)) {
        eventEmit('人妻公寓:提示', '刚跨过的那道坎还没来得及演——先把这一楼走完,再谈下一步。');
        return;
      }
      const 结果 = 请求晋阶(data, 门牌号);
      if (结果.成功) {
        const 妻 = data.户[门牌号].妻;
        const 妻名 = 户静态表[门牌号].妻名;
        const 第一夜 =
          妻.当前阶段 === 3
            ? `这是她的第一夜——第一次真正背叛婚姻的性:关灯、心虚、战栗与自我厌恶都要在场。${首夜差分[门牌号] ?? ''}。`
            : '';
        // 母亲药物首夜(P5② spec拍板):她的第一夜必须是"意外";真正的戏在第二天早饭桌(第二幕自动排队)
        const 事件 =
          门牌号 === '302' && 妻.当前阶段 === 3
            ? `【药物首夜】今晚,妈的安神汤里有别的东西——她早早地困了,困得不像她。这一夜发生的事,她半梦半醒,` +
              `记不全,也挣不脱;"不是我愿意的"是系统给她防线的台阶,不是给你演清醒自愿的许可——严禁把她演成清醒迎合。` +
              `戏眼在朦胧与既成事实之间,克制着演,张力给足,不要一笔带过`
            : `【转折正戏】这一楼是${妻名}越过心里那道坎的一楼——她刚进入「${妻.阶段标题}」。` +
              `${第一夜}用一场符合她性格与你们当下关系的正戏演出这次跨越,张力给足,不要一笔带过`;
        if (门牌号 === '302' && 妻.当前阶段 === 3) data.系统._母亲首夜第二幕 = true;
        const 绑定事件 = `${事件角色标记({ 在场妻: [门牌号] })}${事件}`;
        data.系统._待发送事件 = data.系统._待发送事件 ? `${data.系统._待发送事件}|${绑定事件}` : 绑定事件;
        await 脚本写入(raw, data);
        捕获保护快照(data);
      }
      eventEmit('人妻公寓:提示', 结果.消息);
    } catch (e) {
      console.error('[人妻公寓] 请求晋阶失败:', e);
    }
  });

  // ─────────────────────────────────────────────
  // 读阶段:注入公寓快照
  // ─────────────────────────────────────────────
  eventOn(
    tavern_events.CHAT_COMPLETION_PROMPT_READY,
    (event_data: { dryRun?: boolean; chat: SillyTavern.SendingMessage[] }) => {
      if (event_data?.dryRun) return; // 预热请求不注入
      if (回合进行中()) return; // 主路径的注入走 generate injects,不走酒馆管道(两路互斥)
      _isInAiCycle = true;
      try {
        const 楼层 = 当前楼层() + 1; // 当前末楼是刚发出的 user，快照描述即将落位的 assistant 楼
        // 毒快照防御+回退取楼(防护7/8):近10楼均无 stat_data → 跳过本轮,绝不造默认值
        const rawStat = 读最近有效stat();
        if (!rawStat) {
          console.warn('[人妻公寓] PROMPT_READY: 近10楼均无 stat_data,跳过快照捕获与注入');
          _isInAiCycle = false;
          return;
        }
        const data = Schema.parse(rawStat) as SchemaType;

        // 捕获保护快照(含 UI 写入;镜像同步在内,防护6/9)
        捕获保护快照(data);

        // 多模态 content 归一成纯文本供焦点扫描
        // 焦点识别只相信玩家消息与 AI 正文。system 中可能混有世界书、预设、数据库、
        // 智脑召回记忆及本游戏快照；它们仍照常发给 AI，但不得冒充“当前正在发生的剧情”。
        const 对话尾 = event_data.chat
          .filter(条 => 条.role === 'user' || 条.role === 'assistant')
          .map(条 => ({
            role: 条.role,
            content:
              typeof 条.content === 'string'
                ? 条.content
                : (条.content ?? []).map(块 => ('text' in 块 ? 块.text : '')).join('\n'),
          }));
        _本轮焦点 = 检测焦点(对话尾, data, 楼层).焦点;

        // 组快照 + {{user}} 替换(防护24)
        const 快照 = 组公寓快照(对话尾, data, 楼层).replace(/\{\{user\}\}/g, getUserName());

        // 幂等注入:清旧 marker 再插(防护25);末尾是 assistant prefill(Gemini)则插到它之前
        const chat = event_data.chat ?? [];
        for (let i = chat.length - 1; i >= 0; i--) {
          const c = chat[i].content;
          if (chat[i].role === 'system' && typeof c === 'string' && c.includes(SNAPSHOT_MARKER)) {
            chat.splice(i, 1);
          }
        }
        const 末条 = chat[chat.length - 1];
        if (末条 && 末条.role === 'assistant') {
          chat.splice(chat.length - 1, 0, { role: 'system', content: 快照 });
        } else {
          chat.push({ role: 'system', content: 快照 });
        }
      } catch (e) {
        console.error('[人妻公寓] PROMPT_READY 处理失败:', e);
        _isInAiCycle = false;
      }
    },
  );

  // ─────────────────────────────────────────────
  // 写阶段:回滚保护 + 事件转存 + 结算推进
  // ─────────────────────────────────────────────
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (新变量: object, 旧变量: object) => {
    if (脚本写入中 || 回合进行中()) return; // 主路径的解析/回滚/结算在回合引擎内完成
    try {
      // 毒快照防御(防护7):stat_data 缺失时绝不 parse({}) 造默认值写回
      const rawStat = _.get(新变量, 'stat_data');
      if (!rawStat || _.isEmpty(rawStat)) {
        console.warn('[人妻公寓] VARIABLE_UPDATE_ENDED: stat_data 缺失,跳过处理');
        return;
      }
      // 末楼 is_user 一律放行(防护14,秦璐 0.39 根因):MESSAGE_SENT 也触发本事件,
      // 用户楼变量是 MVU 刚从上一楼(含全部 UI 写入)拷贝的真值,既不该被旧快照盖回,
      // 也不该被当成 AI 楼推进引擎
      {
        const 末楼 = SillyTavern.chat?.[SillyTavern.chat.length - 1];
        // 逃生舱原生发送:MESSAGE_SENT 后、prompt 组装前,用刚拷贝的真值刷一次整表视图
        if (末楼?.is_user) {
          void 同步整表视图(rawStat);
          return;
        }
      }
      // 手动"重新处理变量"(非生成周期):只恢复不推进(防护13)。
      // 不再从当前楼真值重捕快照(审计 低危15):当前楼是"已截过"的终值,拿它当 delta cap
      // 基准=每按一次再放行 +3,连按可无限抬升。内存快照本就随每次 UI 落地(落地→捕获保护快照)
      // 刷新,含全部 UI 写入,直接用它做基准即可。
      if (!_isInAiCycle) {
        if (有保护快照()) {
          const restored = Schema.parse(rawStat) as SchemaType;
          回滚保护字段(restored, _本轮焦点, undefined, 当前楼层());
          _.set(新变量, 'stat_data', restored);
          void 同步整表视图(restored);
          console.info('[人妻公寓] 非生成周期的变量重处理:脚本管字段已按快照恢复(引擎未推进)');
        }
        return;
      }
      if (!有保护快照()) return;

      const newData = Schema.parse(rawStat) as SchemaType;
      const 楼层 = 当前楼层();

      // 1. 回滚脚本管字段(变量分工表落码;后台户整体拍回,焦点户白名单+delta cap)
      回滚保护字段(newData, _本轮焦点, undefined, 楼层);

      // 1.5 首批入住兜底(启动时无 stat 的全新对话在此接上)
      确保首批入住(newData);

      // 2. 一次性事件消费转存(防护10):同楼重roll不动;正常过楼转存后清空
      {
        const injected = newData.系统._已注入事件;
        if (injected.内容 && injected.楼层 === 楼层) {
          // 重roll:待发送与转存都不动(PROMPT_READY 已重放转存内容)
        } else if (newData.系统._待发送事件) {
          injected.楼层 = 楼层;
          injected.内容 = newData.系统._待发送事件;
          newData.系统._待发送事件 = '';
        } else {
          injected.楼层 = -1;
          injected.内容 = '';
        }
      }

      // 3. 坏结局锁定:引擎全停(回滚保护仍生效)
      if (newData.系统._坏结局) {
        _.set(新变量, 'stat_data', newData);
        void 同步整表视图(newData);
        _isInAiCycle = false;
        return;
      }

      // 4. 派生字段重算(阶段标题永远脚本按当前阶段算)
      for (const 节点 of Object.values(newData.户)) {
        节点.妻.阶段标题 = 阶段标题(节点.妻.当前阶段);
      }

      // 5. 结算(逃生舱路径:与回合引擎同一套账——焦点户触碰+疑心主通道+冷落检测)
      {
        let oldStat: SchemaType | null = null;
        try {
          const 旧raw = _.get(旧变量, 'stat_data');
          if (旧raw && !_.isEmpty(旧raw)) oldStat = Schema.parse(旧raw) as SchemaType;
        } catch {
          /* 旧值不可读时疑心增量按 0 处理 */
        }
        const 现钟 = 楼层 + newData.系统._时段偏移楼;
        for (const m of _本轮焦点) {
          const 节点 = newData.户[m];
          if (!节点) continue;
          惰性结算户(节点, 现钟); // 钟楼轴(审计 低危7,与主路径一致)
          节点.妻.上次互动楼层 = 楼层;
          const 基准堕落 = oldStat?.户[m]?.妻.堕落值;
          结算焦点疑心(节点, m, 节点.妻.堕落值 - (基准堕落 ?? 节点.妻.堕落值), 现钟);
        }
        夜访结算(newData, 楼层);
        {
          const 经提示 = 经济结算(newData, 楼层);
          if (经提示.length) eventEmit('人妻公寓:提示', 经提示.join('\n'));
        }
        冷落检测(newData, 楼层);
      }

      // 6. 写回
      _.set(新变量, 'stat_data', newData);
      void 同步整表视图(newData);
      _isInAiCycle = false;
    } catch (err) {
      console.error('[人妻公寓] VARIABLE_UPDATE_ENDED 处理失败:', err);
      _isInAiCycle = false;
    }
  });

  // ─────────────────────────────────────────────
  // 后处理:刷新保护快照(AI 回复后数据已落地)
  // ─────────────────────────────────────────────
  eventOn(tavern_events.MESSAGE_RECEIVED, () => {
    if (回合进行中()) return; // 主路径在回合引擎内自行刷新快照
    try {
      // 毒快照防御+回退取楼:MESSAGE_RECEIVED 可能先于 MVU 落数据(竞态)
      const rawStat = 读最近有效stat();
      if (!rawStat) {
        console.warn('[人妻公寓] MESSAGE_RECEIVED: 近10楼均无 stat_data,跳过快照刷新');
        return;
      }
      捕获保护快照(Schema.parse(rawStat) as SchemaType);
    } catch (err) {
      console.error('[人妻公寓] MESSAGE_RECEIVED 处理失败:', err);
    }
  });
}

// 供后续阶段(UI 事件/回合引擎)引用,防 tree-shake 误删共享导出
export { 取本轮事件文本 };
