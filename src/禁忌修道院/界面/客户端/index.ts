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
  const 详情 =
    err instanceof Error ? `${err.message}\n${(err.stack ?? '').split('\n').slice(1, 3).join('\n')}` : String(err);
  d.textContent = `⚠︎ [${来源}] ${详情}`;
}

window.addEventListener('error', ev => 显示致命错误(ev.error ?? ev.message, 'window'));
window.addEventListener('unhandledrejection', ev => 显示致命错误(ev.reason, 'promise'));

/**
 * 固定游戏画幅:iframe 高度跟随内容,所以由客户端读酒馆窗口高度、把画幅定死成 px,
 * 面板开合再也不会把框架抻长缩短。留出顶部标题栏与底部按钮条的空间。
 */
function 设定画幅() {
  // 沉浸全屏(诡秘剧场式):iframe 被脚本钉成 100vw×100vh,画幅直接吃满自身视口
  if (document.documentElement.classList.contains('xdy-full')) {
    document.documentElement.style.setProperty('--frame-h', '100vh');
    return;
  }
  try {
    const 父高 = window.parent?.innerHeight ?? 800;
    const 高 = Math.max(460, Math.round(父高 - 150));
    document.documentElement.style.setProperty('--frame-h', `${高}px`);
  } catch {
    document.documentElement.style.setProperty('--frame-h', '620px');
  }
}
设定画幅();
window.addEventListener('resize', 设定画幅);
try {
  window.parent?.addEventListener?.('resize', 设定画幅);
} catch {
  /* 跨域时退回 iframe 自身 resize */
}

$(async () => {
  try {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message', message_id: -1 }), 'stat_data'), {
      timeout: 15000,
    }).catch(() => {
      console.warn('[禁忌修道院客户端] 等待 stat_data 超时,以默认值挂载');
    });
    const app = createApp(App);
    app.config.errorHandler = (err, _instance, info) => 显示致命错误(err, `vue:${info}`);
    app.use(createPinia()).mount('#app');
  } catch (e) {
    显示致命错误(e, 'mount');
  }
});
