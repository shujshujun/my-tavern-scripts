/**
 * 界面偏好/全屏 共享单例（App A3 从 App.vue 等价外移）。
 *
 * 主题三档、字号、字色、垫板、立绘、省流、减动效、设置开关、移动端断点与沉浸全屏
 * 的状态与动作整体收敛在本 composable；App 与 设置弹窗.vue 调用 useUIPrefs() 拿到
 * 同一组 refs，不得各建一套互不同步的状态。
 *
 * 边界：只承载纯 UI/浏览器状态。MVU/模型解析业务设置（更新路线、内置解析、解析通道、
 * 自定义 API 表单）留在 设置弹窗.vue，不进入本文件。
 */
import { computed, ref, watchEffect, type Ref } from 'vue';
import { 同步画幅 as 默认同步画幅 } from '../viewport';
import type { 移动端全屏选择, 全屏根, 全屏文档 } from '../types';

export interface UIPrefs选项 {
  /** 游戏时段(时间信息.时段)；「跟随」主题按 晚上/深夜 判暗。 */
  timePeriod?: Readonly<Ref<string>>;
  /** App 传入的 viewport.ts 同步画幅；缺省用本模块导入的同名函数。 */
  syncViewport?: () => void;
  /** 全屏失败等错误文案写回 App 错误护栏；本 composable 不持有业务 toast。 */
  reportFullscreenError?: (message: string) => void;
}

/** 界面偏好持久化键；设置弹窗复用 设置存储键 做解析字段的合并读写。 */
export const 设置存储键 = '人妻公寓_界面偏好';
const 主题存储键 = '人妻公寓_夜间模式';
const 移动端全屏引导存储键 = 'rqgy-mobile-fullscreen-guide-v1';

function 创建UIPrefs(options: UIPrefs选项) {
  // ── 设置开关 ──

  const 设置开 = ref(false);

  // ── 沉浸全屏(iframe 内对自身文档 requestFullscreen;失败退回画幅撑满) ──

  const 全屏中 = ref(false);
  const 真全屏中 = ref(false);
  const 移动端媒体 = window.matchMedia('(max-width: 540px)');
  const 移动端 = ref(移动端媒体.matches);
  const 成人CG双列媒体 = window.matchMedia('(min-width: 760px)');
  const 成人CG双列 = ref(成人CG双列媒体.matches);

  const 读取移动端全屏选择 = (): boolean => {
    try {
      const 选择 = localStorage.getItem(移动端全屏引导存储键);
      return 选择 === '全屏' || 选择 === '窗口';
    } catch {
      return false;
    }
  };

  const 移动端全屏引导已处理 = ref(读取移动端全屏选择());
  const 显示移动端全屏引导 = computed(
    () => 移动端.value && !移动端全屏引导已处理.value && !真全屏中.value,
  );

  const 记住移动端全屏选择 = (选择: 移动端全屏选择): void => {
    移动端全屏引导已处理.value = true;
    try {
      localStorage.setItem(移动端全屏引导存储键, 选择);
    } catch {
      /* 隐私模式拒绝持久化时，本次页面仍不再遮挡。 */
    }
  };

  const 同步移动端断点 = (event: MediaQueryListEvent): void => {
    移动端.value = event.matches;
  };

  const 同步成人CG双列断点 = (event: MediaQueryListEvent): void => {
    成人CG双列.value = event.matches;
  };

  const 应用画幅 = (开: boolean) => {
    document.documentElement.classList.toggle('rqgy-full', 开);
    (options.syncViewport ?? 默认同步画幅)();
  };

  const 进真全屏 = async () => {
    const 根 = document.documentElement as 全屏根;
    if (根.requestFullscreen) await 根.requestFullscreen();
    else if (根.webkitRequestFullscreen) await 根.webkitRequestFullscreen();
    else throw new Error('Fullscreen API 不可用');
  };

  async function 打开移动端全屏() {
    记住移动端全屏选择('全屏');
    try {
      await 进真全屏();
    } catch (e) {
      console.warn('[人妻公寓客户端] 移动端真全屏失败:', e);
      options.reportFullscreenError?.('浏览器拒绝进入全屏，请允许网页全屏后再点一次');
      全屏中.value = true;
      应用画幅(true);
    }
  }

  function 继续窗口模式(): void {
    记住移动端全屏选择('窗口');
  }

  async function 切换全屏() {
    const 文档 = document as 全屏文档;
    try {
      if (document.fullscreenElement ?? 文档.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else 文档.webkitExitFullscreen?.();
      } else {
        if (移动端.value) 记住移动端全屏选择('全屏');
        await 进真全屏();
      }
    } catch (e) {
      console.warn('[人妻公寓客户端] 真全屏不可用,退回网页内画幅:', e);
      全屏中.value = !全屏中.value;
      应用画幅(全屏中.value);
    }
  }

  /** 真全屏状态同步(按钮/Esc/系统手势退出都走这里)；具名以便卸载。 */
  const 同步真全屏 = () => {
    const 开 = !!(document.fullscreenElement ?? (document as 全屏文档).webkitFullscreenElement);
    真全屏中.value = 开;
    全屏中.value = 开;
    应用画幅(开);
  };

  // ── 界面偏好设置(全走 localStorage,不碰游戏变量) ──

  /** 主题三档:日间 / 夜间 / 跟随游戏时段 */
  const 主题模式 = ref<'日间' | '夜间' | '跟随'>('日间');
  /** 正文字号档 */
  const 字号档 = ref<'小' | '中' | '大'>('中');
  /** 正文字色(''=跟随主题日夜自动翻转;自选后固定不随主题) */
  const 正文字色 = ref('');
  /** 立绘显示(右下角入画;垫板压立绘) */
  const 立绘显示 = ref(true);
  /** 正文垫板不透明度(0.2~1.0,越高字越清背景越淡) */
  const 垫板浓度 = ref(0.66);
  /** 省流:关掉全部背景图/立绘/图标,回纯 CSS */
  const 省流 = ref(false);
  /** 减少动效 */
  const 减动效 = ref(false);

  const 字号档表: Record<'小' | '中' | '大', string> = { 小: '0.82em', 中: '0.9em', 大: '1.02em' };

  /** 把偏好写进根元素的 CSS 变量 + body class(省流/减动效) */
  function 应用界面偏好() {
    const root = document.documentElement;
    root.style.setProperty('--prose-size', 字号档表[字号档.value]);
    root.style.setProperty('--entry-veil', String(垫板浓度.value));
    if (正文字色.value) root.style.setProperty('--prose-ink', 正文字色.value);
    else root.style.removeProperty('--prose-ink');
    root.classList.toggle('rq-lite', 省流.value);
    root.classList.toggle('rq-still', 减动效.value);
  }

  function 持久化设置() {
    try {
      localStorage.setItem(主题存储键, 暗色.value ? '1' : '0'); // 兼容旧键
      // 合并写:同一个键还承载脚本侧写入的 变量解析通道/MVU外置默认V080已初始化 与
      // 设置组件写入的内置变量解析、严格审计等解析字段，整体覆写会冲掉它们。
      let 已存: Record<string, unknown> = {};
      try {
        const raw = localStorage.getItem(设置存储键);
        const 值 = raw ? JSON.parse(raw) : null;
        if (值 && typeof 值 === 'object') 已存 = 值;
      } catch {
        /* 坏 JSON 当空处理 */
      }
      localStorage.setItem(
        设置存储键,
        JSON.stringify({
          ...已存,
          主题模式: 主题模式.value,
          字号档: 字号档.value,
          正文字色: 正文字色.value,
          垫板浓度: 垫板浓度.value,
          省流: 省流.value,
          减动效: 减动效.value,
          立绘显示: 立绘显示.value,
        }),
      );
    } catch {
      /* 隐私模式等存不了就不记 */
    }
  }

  /** 任一设置项改动:立即应用 + 存盘(解析字段由设置弹窗组件另行合并写) */
  function 改设置() {
    应用界面偏好();
    持久化设置();
  }

  /** 恢复界面偏好(主题三档/字号/垫板/省流/减动效/立绘)；只读纯 UI 字段,解析字段由设置组件恢复。 */
  function 恢复设置() {
    try {
      const raw = localStorage.getItem(设置存储键);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.主题模式) 主题模式.value = s.主题模式;
        else 主题模式.value = localStorage.getItem(主题存储键) === '1' ? '夜间' : '日间'; // 旧键迁移
        if (s.字号档) 字号档.value = s.字号档;
        if (typeof s.正文字色 === 'string') 正文字色.value = s.正文字色;
        if (typeof s.垫板浓度 === 'number') 垫板浓度.value = s.垫板浓度;
        省流.value = !!s.省流;
        减动效.value = !!s.减动效;
        if (typeof s.立绘显示 === 'boolean') 立绘显示.value = s.立绘显示;
      } else {
        主题模式.value = localStorage.getItem(主题存储键) === '1' ? '夜间' : '日间';
      }
    } catch {
      /* 读不到就用默认 */
    }
    应用界面偏好();
  }

  /** 只重置纯 UI 默认值；共享存储键里的变量解析字段必须保留。 */
  function 重置界面偏好() {
    主题模式.value = '日间';
    字号档.value = '中';
    正文字色.value = '';
    垫板浓度.value = 0.66;
    省流.value = false;
    减动效.value = false;
    立绘显示.value = true;
    应用界面偏好();
    持久化设置();
    try {
      localStorage.removeItem(主题存储键);
    } catch {
      /* ignore */
    }
  }

  // ── 夜间模式(html.rq-dark 令牌覆盖;localStorage 记住偏好) ──

  const 暗色 = ref(false);

  const 应用主题 = (开: boolean) => {
    暗色.value = 开;
    document.documentElement.classList.toggle('rq-dark', 开);
  };

  /** 主题「跟随」时按游戏时段推日夜(晚上/深夜=暗) */
  const 时段偏暗 = computed(() => options.timePeriod?.value === '晚上' || options.timePeriod?.value === '深夜');

  // 主题结算全响应式：挂载恢复、切档或显式世界时段更新后，跟随模式同步日夜配色。
  // 任何一路动到依赖都立刻重算,不再依赖手工调用点的时序
  let 主题监听: (() => void) | undefined;
  const 启动主题监听 = () => {
    主题监听 = watchEffect(() => {
      const 该暗 = 主题模式.value === '跟随' ? 时段偏暗.value : 主题模式.value === '夜间';
      应用主题(该暗);
    });
  };

  function 切换主题() {
    // 右上角日月钮=显式切档(不再绕过主题档直改暗色——"跟随"下被绕改会失同步,2026-07-17 修复)
    主题模式.value = 暗色.value ? '日间' : '夜间';
    改设置();
  }

  // ── 挂载/销毁:media 断点与全屏监听必须可卸载,防止重复初始化时重复绑定 ──

  let 已初始化 = false;
  let 卸载监听: (() => void) | undefined;

  function 初始化() {
    if (已初始化) return;
    已初始化 = true;
    恢复设置();
    启动主题监听();
    // 手机端默认全屏画幅(2026-07-19 用户拍板:移动端适配已达标,直接以全屏模式起步)。
    // 走 CSS 画幅而非 Fullscreen API——后者没有用户手势会被浏览器拒;右上角全屏钮仍可切真全屏
    if (window.matchMedia('(max-width: 540px)').matches && !全屏中.value) {
      全屏中.value = true;
      应用画幅(true);
    }
    移动端媒体.addEventListener('change', 同步移动端断点);
    成人CG双列媒体.addEventListener('change', 同步成人CG双列断点);
    for (const 事件名 of ['fullscreenchange', 'webkitfullscreenchange']) {
      document.addEventListener(事件名, 同步真全屏);
    }
    卸载监听 = () => {
      移动端媒体.removeEventListener('change', 同步移动端断点);
      成人CG双列媒体.removeEventListener('change', 同步成人CG双列断点);
      for (const 事件名 of ['fullscreenchange', 'webkitfullscreenchange']) {
        document.removeEventListener(事件名, 同步真全屏);
      }
    };
  }

  function 销毁() {
    if (!已初始化) return;
    已初始化 = false;
    卸载监听?.();
    卸载监听 = undefined;
    主题监听?.();
    主题监听 = undefined;
  }

  return {
    设置开,
    暗色,
    主题模式,
    字号档,
    正文字色,
    立绘显示,
    垫板浓度,
    省流,
    减动效,
    全屏中,
    真全屏中,
    移动端,
    成人CG双列,
    显示移动端全屏引导,
    切换主题,
    改设置,
    恢复设置,
    重置界面偏好,
    继续窗口模式,
    打开移动端全屏,
    切换全屏,
    进真全屏,
    应用画幅,
    初始化,
    销毁,
    设置存储键,
  };
}

let 单例: ReturnType<typeof 创建UIPrefs> | undefined;

/** 模块级单例：App 首次带选项调用，设置弹窗组件后续无参调用拿到同一组状态。 */
export function useUIPrefs(options?: UIPrefs选项) {
  单例 ??= 创建UIPrefs(options ?? {});
  return 单例;
}
