import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';
import { 注册画幅页面生命周期, 同步画幅 } from './viewport';
import { 等待客户端启动依赖 } from './启动等待';

type 客户端入口窗口 = Window & {
  __rqgyClientEntryCleanup?: () => void;
};

const 入口全局 = window as 客户端入口窗口;
try {
  入口全局.__rqgyClientEntryCleanup?.();
} catch (error) {
  console.warn('[人妻公寓客户端] 清理旧入口实例失败，将继续建立新实例:', error);
}

let 入口已作废 = false;
let 已挂载应用: { unmount: () => void } | undefined;

/** 全局错误横幅:根组件自身的渲染错误 onErrorCaptured 抓不到,必须挂在应用层 */
function 显示致命错误(err: unknown, 来源: string) {
  console.error(`[人妻公寓客户端][${来源}]`, err);
  let d = document.getElementById('fatal-banner');
  if (!d) {
    d = document.createElement('div');
    d.id = 'fatal-banner';
    d.style.cssText =
      'background:#7a1a1a;color:#ffe9e0;padding:6px 8px;margin:4px;border-radius:3px;font-size:12px;white-space:pre-wrap;word-break:break-all;';
    document.body.prepend(d);
  }
  const 详情 =
    err instanceof Error ? `${err.message}\n${(err.stack ?? '').split('\n').slice(1, 3).join('\n')}` : String(err);
  d.textContent = `⚠︎ [${来源}] ${详情}`;
}

const 窗口错误处理 = (ev: ErrorEvent) => 显示致命错误(ev.error ?? ev.message, 'window');
const 未处理拒绝处理 = (ev: PromiseRejectionEvent) => 显示致命错误(ev.reason, 'promise');
window.addEventListener('error', 窗口错误处理);
window.addEventListener('unhandledrejection', 未处理拒绝处理);

同步画幅();
const 注销画幅生命周期 = 注册画幅页面生命周期();

const 清理入口 = () => {
  if (入口已作废) return;
  入口已作废 = true;
  window.removeEventListener('error', 窗口错误处理);
  window.removeEventListener('unhandledrejection', 未处理拒绝处理);
  注销画幅生命周期();
  已挂载应用?.unmount();
  已挂载应用 = undefined;
  if (入口全局.__rqgyClientEntryCleanup === 清理入口) delete 入口全局.__rqgyClientEntryCleanup;
};
入口全局.__rqgyClientEntryCleanup = 清理入口;

$(async () => {
  if (入口已作废) return;
  try {
    const 启动等待 = await 等待客户端启动依赖(
      () => waitGlobalInitialized('Mvu'),
      () =>
        waitUntil(() => _.has(getVariables({ type: 'message', message_id: -1 }), 'stat_data'), {
          timeout: 15000,
        }),
    );
    if (入口已作废) return;
    if (!启动等待.mvu就绪) {
      显示致命错误(启动等待.mvu错误, 'Mvu初始化（界面已降级打开）');
    } else if (!启动等待.statData就绪) {
      console.warn('[人妻公寓客户端] 等待 stat_data 超时,以默认值挂载', 启动等待.statData错误);
    }
    if (入口已作废) return;
    const app = createApp(App);
    app.config.errorHandler = (err, _instance, info) => 显示致命错误(err, `vue:${info}`);
    app.use(createPinia());
    if (入口已作废) return;
    已挂载应用 = app;
    app.mount('#app');
  } catch (e) {
    显示致命错误(e, 'mount');
  }
});
