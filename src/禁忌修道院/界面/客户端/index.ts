import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';

/** 全局错误横幅:根组件自身的渲染错误 onErrorCaptured 抓不到,必须挂在应用层 */
function 显示致命错误(err: unknown, 来源: string) {
  console.error(`[禁忌修道院客户端][${来源}]`, err);
  let d = document.getElementById('fatal-banner');
  if (!d) {
    d = document.createElement('div');
    d.id = 'fatal-banner';
    d.style.cssText =
      'background:#7a1a1a;color:#ffe9e0;padding:6px 8px;margin:4px;border-radius:3px;font-size:12px;white-space:pre-wrap;word-break:break-all;';
    document.body.prepend(d);
  }
  const 详情 = err instanceof Error ? `${err.message}\n${(err.stack ?? '').split('\n').slice(1, 3).join('\n')}` : String(err);
  d.textContent = `⚠ [${来源}] ${详情}`;
}

window.addEventListener('error', ev => 显示致命错误(ev.error ?? ev.message, 'window'));
window.addEventListener('unhandledrejection', ev => 显示致命错误(ev.reason, 'promise'));

$(async () => {
  try {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'), { timeout: 15000 }).catch(() => {
      console.warn('[禁忌修道院客户端] 等待 stat_data 超时,以默认值挂载');
    });
    const app = createApp(App);
    app.config.errorHandler = (err, _instance, info) => 显示致命错误(err, `vue:${info}`);
    app.use(createPinia()).mount('#app');
  } catch (e) {
    显示致命错误(e, 'mount');
  }
});
