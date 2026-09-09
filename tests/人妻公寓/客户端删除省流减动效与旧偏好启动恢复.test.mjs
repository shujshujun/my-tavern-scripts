/* eslint-disable import-x/no-nodejs-modules, import-x/no-dynamic-require -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const 客户端目录URL = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const 客户端目录 = fileURLToPath(客户端目录URL);
const 入口源码 = readFileSync(new URL('./index.ts', 客户端目录URL), 'utf8');
const 偏好源码 = readFileSync(new URL('./composables/useUIPrefs.ts', 客户端目录URL), 'utf8');
const 设置源码 = readFileSync(new URL('./components/设置弹窗.vue', 客户端目录URL), 'utf8');
const App源码 = readFileSync(new URL('./App.vue', 客户端目录URL), 'utf8');
const 地图源码 = readFileSync(new URL('./components/地图.vue', 客户端目录URL), 'utf8');
const 通关源码 = readFileSync(new URL('./components/通关结算.vue', 客户端目录URL), 'utf8');
const 迁移源码 = readFileSync(new URL('./旧界面偏好迁移.ts', 客户端目录URL), 'utf8');
const 存储辅助源码 = readFileSync(new URL('../../界面偏好存储.ts', 客户端目录URL), 'utf8');

const { 清理已删除界面偏好, 设置存储键 } = require('../../src/人妻公寓/界面/客户端/旧界面偏好迁移.ts');
const { 等待客户端启动依赖 } = require('../../src/人妻公寓/界面/客户端/启动等待.ts');

function 创建根(...初始类) {
  const 类 = new Set(初始类);
  return {
    类,
    根: {
      classList: {
        remove(...名称) {
          for (const 名 of 名称) 类.delete(名);
        },
      },
    },
  };
}

function 创建存储(初值) {
  const 值 = new Map(Object.entries(初值));
  let 写入次数 = 0;
  return {
    值,
    get 写入次数() {
      return 写入次数;
    },
    存储: {
      getItem(键) {
        return 值.get(键) ?? null;
      },
      setItem(键, 内容) {
        写入次数 += 1;
        值.set(键, String(内容));
      },
    },
  };
}

function 枚举客户端源码(目录) {
  const 结果 = [];
  for (const 名 of readdirSync(目录)) {
    const 路径 = `${目录}/${名}`;
    if (statSync(路径).isDirectory()) 结果.push(...枚举客户端源码(路径));
    else if (/\.(?:ts|vue|css)$/.test(名)) 结果.push(路径);
  }
  return 结果;
}

test('旧共享偏好只删除省流与减动效，其他外观、解析通道和自定义 API 逐值保留', () => {
  const 其他偏好 = {
    主题模式: '跟随',
    字号档: '大',
    正文字色: '#123456',
    垫板浓度: 0.72,
    立绘显示: false,
    变量解析通道: '自定义',
    内置变量解析: false,
    严格变量审计: true,
    MVU外置默认V080已初始化: true,
    自定义API: {
      api地址: 'https://example.invalid/v1',
      密钥: '保留原值',
      模型名称: 'candidate-model',
      温度: 0.35,
      top_p: 0.88,
      最大回复token数: 4096,
    },
    未知扩展字段: { 数组: [1, '二', false, null], 对象: { a: 1 } },
  };
  const { 存储, 值, 写入次数: 初始写入次数 } = 创建存储({
    [设置存储键]: JSON.stringify({ ...其他偏好, 省流: true, 减动效: true }),
  });
  assert.equal(初始写入次数, 0);
  const { 根, 类 } = 创建根('rq-lite', 'rq-still', 'rq-dark', 'rqgy-full');

  const 结果 = 清理已删除界面偏好(存储, 根);

  assert.deepEqual(结果.删除字段, ['省流', '减动效']);
  assert.equal(结果.已写回, true);
  assert.deepEqual(JSON.parse(值.get(设置存储键)), 其他偏好);
  assert.deepEqual([...类].sort(), ['rq-dark', 'rqgy-full']);
});

test('默认启动迁移同时清理父页权威存储与当前 iframe 副本，且不混写两边其他字段', () => {
  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const 原document存在 = Object.prototype.hasOwnProperty.call(globalThis, 'document');
  const 原document = globalThis.document;
  const 原localStorage存在 = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage');
  const 原localStorage = globalThis.localStorage;

  const 父页 = 创建存储({
    [设置存储键]: JSON.stringify({
      省流: true,
      减动效: true,
      主题模式: '夜间',
      变量解析通道: '自定义',
      自定义API: { 模型名称: '父页权威模型', 密钥: '不得丢' },
    }),
  });
  const 当前页 = 创建存储({
    [设置存储键]: JSON.stringify({ 省流: false, 减动效: true, 字号档: '大', iframe专属: 7 }),
  });
  const 环境 = 创建根('rq-lite', 'rq-still', 'rq-dark');
  const 父窗口 = { localStorage: 父页.存储 };
  const 当前窗口 = { parent: 父窗口, top: 父窗口, localStorage: 当前页.存储 };

  try {
    globalThis.window = 当前窗口;
    globalThis.localStorage = 当前页.存储;
    globalThis.document = { documentElement: 环境.根 };

    const 结果 = 清理已删除界面偏好();

    assert.deepEqual(结果.删除字段, ['省流', '减动效']);
    assert.equal(结果.已写回, true);
    assert.deepEqual(JSON.parse(父页.值.get(设置存储键)), {
      主题模式: '夜间',
      变量解析通道: '自定义',
      自定义API: { 模型名称: '父页权威模型', 密钥: '不得丢' },
    });
    assert.deepEqual(JSON.parse(当前页.值.get(设置存储键)), { 字号档: '大', iframe专属: 7 });
    assert.deepEqual([...环境.类], ['rq-dark']);
    assert.equal(父页.写入次数, 1, '父页权威存储只写一次');
    assert.equal(当前页.写入次数, 1, '当前 iframe 副本只写一次');
  } finally {
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
    if (原document存在) globalThis.document = 原document;
    else delete globalThis.document;
    if (原localStorage存在) globalThis.localStorage = 原localStorage;
    else delete globalThis.localStorage;
  }
});

test('useUIPrefs 日常读写以父页共享存储为权威，不会因 iframe 副本保留旧危险值', () => {
  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const 原document存在 = Object.prototype.hasOwnProperty.call(globalThis, 'document');
  const 原document = globalThis.document;
  const 原localStorage存在 = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage');
  const 原localStorage = globalThis.localStorage;
  const 父页 = 创建存储({
    [设置存储键]: JSON.stringify({
      主题模式: '夜间',
      字号档: '大',
      省流: true,
      减动效: true,
      变量解析通道: '自定义',
      自定义API: { 模型名称: '父页模型' },
    }),
  });
  const 当前页 = 创建存储({
    [设置存储键]: JSON.stringify({ 主题模式: '日间', 字号档: '小', iframe专属: true }),
  });
  const 类 = new Set();
  const CSS变量 = new Map();
  const media = { matches: false, addEventListener() {}, removeEventListener() {} };
  const 父窗口 = { localStorage: 父页.存储 };
  const 当前窗口 = {
    parent: 父窗口,
    top: 父窗口,
    localStorage: 当前页.存储,
    innerHeight: 800,
    matchMedia() { return media; },
  };
  const documentMock = {
    documentElement: {
      classList: {
        toggle(名称, 开) {
          if (开) 类.add(名称);
          else 类.delete(名称);
        },
      },
      style: {
        setProperty(名称, 值) { CSS变量.set(名称, String(值)); },
        removeProperty(名称) { CSS变量.delete(名称); },
      },
    },
    fullscreenElement: null,
    createElement() { return { content: { firstChild: null } }; },
    addEventListener() {},
    removeEventListener() {},
  };

  const 模块路径 = require.resolve('../../src/人妻公寓/界面/客户端/composables/useUIPrefs.ts');
  try {
    globalThis.window = 当前窗口;
    globalThis.localStorage = 当前页.存储;
    globalThis.document = documentMock;
    delete require.cache[模块路径];
    const { useUIPrefs } = require(模块路径);
    const 偏好 = useUIPrefs();

    偏好.恢复设置();
    assert.equal(偏好.主题模式.value, '夜间');
    assert.equal(偏好.字号档.value, '大');
    assert.equal(CSS变量.get('--prose-size'), '1.02em');

    偏好.字号档.value = '中';
    偏好.改设置();
    assert.deepEqual(JSON.parse(父页.值.get(设置存储键)), {
      主题模式: '夜间',
      字号档: '中',
      变量解析通道: '自定义',
      自定义API: { 模型名称: '父页模型' },
      正文字色: '',
      垫板浓度: 0.66,
      立绘显示: true,
    });
    assert.deepEqual(JSON.parse(当前页.值.get(设置存储键)), {
      主题模式: '日间',
      字号档: '小',
      iframe专属: true,
    });
  } finally {
    delete require.cache[模块路径];
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
    if (原document存在) globalThis.document = 原document;
    else delete globalThis.document;
    if (原localStorage存在) globalThis.localStorage = 原localStorage;
    else delete globalThis.localStorage;
  }
});

test('迁移可重复执行；字段无论 true/false 都退场，同一 iframe 残留 class 每次都同步清理', () => {
  const { 存储, 值 } = 创建存储({
    [设置存储键]: JSON.stringify({ 主题模式: '夜间', 省流: false, 减动效: true }),
  });
  const 环境 = 创建根('rq-lite', 'rq-still');

  const 首次 = 清理已删除界面偏好(存储, 环境.根);
  assert.equal(首次.已写回, true);
  assert.deepEqual(JSON.parse(值.get(设置存储键)), { 主题模式: '夜间' });
  assert.deepEqual([...环境.类], []);

  环境.类.add('rq-lite');
  环境.类.add('rq-still');
  const 再次 = 清理已删除界面偏好(存储, 环境.根);
  assert.deepEqual(再次.删除字段, []);
  assert.equal(再次.已写回, false);
  assert.deepEqual([...环境.类], []);
});

test('坏 JSON、存储拒绝和根 classList 异常都不会抛错或阻塞后续启动', () => {
  const 坏JSON = 创建存储({ [设置存储键]: '{bad-json' });
  const 坏JSON根 = 创建根('rq-lite', 'rq-still');
  assert.doesNotThrow(() => 清理已删除界面偏好(坏JSON.存储, 坏JSON根.根));
  assert.equal(坏JSON.值.get(设置存储键), '{bad-json', '坏 JSON 不得被整键覆盖');
  assert.deepEqual([...坏JSON根.类], []);

  const 读错误 = new Error('storage read denied');
  const 读失败根 = 创建根('rq-lite', 'rq-still');
  const 读失败结果 = 清理已删除界面偏好({ getItem() { throw 读错误; }, setItem() {} }, 读失败根.根);
  assert.equal(读失败结果.存储错误, 读错误);
  assert.deepEqual([...读失败根.类], []);

  const 写错误 = new Error('storage write denied');
  const 写失败根 = 创建根('rq-lite', 'rq-still');
  const 写失败结果 = 清理已删除界面偏好(
    {
      getItem() { return JSON.stringify({ 省流: true, 变量解析通道: '自动' }); },
      setItem() { throw 写错误; },
    },
    写失败根.根,
  );
  assert.equal(写失败结果.存储错误, 写错误);
  assert.deepEqual(写失败结果.删除字段, ['省流']);
  assert.deepEqual([...写失败根.类], []);

  const 根错误 = new Error('classList denied');
  const 可写 = 创建存储({ [设置存储键]: JSON.stringify({ 减动效: true, 严格变量审计: false }) });
  const 根失败结果 = 清理已删除界面偏好(
    可写.存储,
    { classList: { remove() { throw 根错误; } } },
  );
  assert.equal(根失败结果.根类错误, 根错误);
  assert.deepEqual(JSON.parse(可写.值.get(设置存储键)), { 严格变量审计: false });

  assert.doesNotThrow(() => 清理已删除界面偏好(null, null));
});

test('入口同步迁移早于 DOM ready/MVU/stat_data/Vue mount，并移除 jQuery ready 无界前置门', () => {
  const 错误监听位 = 入口源码.indexOf("window.addEventListener('unhandledrejection'");
  const 迁移位 = 入口源码.indexOf('const 旧偏好迁移 = 清理已删除界面偏好()');
  const 画幅位 = 入口源码.indexOf('同步画幅();');
  const DOM门位 = 入口源码.indexOf("if (document.readyState === 'loading')");
  const 启动等待位 = 入口源码.indexOf('const 启动等待 = await 等待客户端启动依赖(');
  const Vue创建位 = 入口源码.indexOf('const app = createApp(App);');
  const Vue挂载位 = 入口源码.indexOf("app.mount('#app')");

  assert.ok(错误监听位 >= 0 && 迁移位 > 错误监听位, '先建立诊断横幅监听，再同步迁移旧偏好');
  assert.ok(画幅位 > 迁移位, '画幅与其他启动副作用不得抢在旧 class 清理之前');
  assert.ok(DOM门位 > 迁移位, '旧偏好迁移必须早于 DOM ready 门');
  assert.ok(启动等待位 > 迁移位, '旧偏好迁移必须早于 MVU/stat_data 等待');
  assert.ok(Vue创建位 > 启动等待位 && Vue挂载位 > Vue创建位, '有界依赖返回后才创建并挂载 Vue');
  assert.doesNotMatch(入口源码, /\$\(async\s*\(/, '入口不再依赖 try/catch 外的 jQuery ready');
  assert.match(入口源码, /document\.addEventListener\('DOMContentLoaded', 文档就绪后启动, \{ once: true \}\)/);
  assert.match(入口源码, /Promise\.resolve\(\)\.then\(文档就绪后启动\)/, '已 ready 的热重载 iframe 走微任务');
  assert.match(入口源码, /注销文档就绪监听\(\)/, '旧入口作废时移除尚未触发的 DOMContentLoaded 监听');
});

test('旧偏好清理同步完成后，MVU 永不返回或 stat_data 缺失仍会有界交还挂载权', async () => {
  const 环境 = 创建根('rq-lite', 'rq-still');
  const 偏好 = 创建存储({ [设置存储键]: JSON.stringify({ 省流: true, 减动效: true, 字号档: '大' }) });
  const 顺序 = [];

  清理已删除界面偏好(偏好.存储, 环境.根);
  顺序.push('迁移完成');
  assert.deepEqual([...环境.类], [], '异步等待开始前 class 已经清空');
  assert.deepEqual(JSON.parse(偏好.值.get(设置存储键)), { 字号档: '大' });

  const MVU超时 = await 等待客户端启动依赖(() => new Promise(() => {}), () => Promise.resolve(), 5);
  顺序.push('MVU降级后可挂载');
  assert.equal(MVU超时.mvu就绪, false);
  assert.match(String(MVU超时.mvu错误), /等待 Mvu 初始化超时/);

  const stat错误 = new Error('stat_data timeout');
  const stat缺失 = await 等待客户端启动依赖(() => Promise.resolve(), () => Promise.reject(stat错误), 20);
  顺序.push('stat_data降级后可挂载');
  assert.deepEqual(stat缺失, { mvu就绪: true, statData就绪: false, statData错误: stat错误 });
  assert.deepEqual(顺序, ['迁移完成', 'MVU降级后可挂载', 'stat_data降级后可挂载']);
});

test('设置、偏好、App 消费者和 CSS class 链彻底退场；系统级无障碍媒体查询保留', () => {
  assert.doesNotMatch(设置源码, /省流|减动效/);
  assert.doesNotMatch(偏好源码, /省流|减动效|rq-lite|rq-still/);
  assert.doesNotMatch(App源码, /:lite=|:reduced-motion=|reducedMotion|rq-lite|rq-still|省流|减动效/);
  assert.doesNotMatch(地图源码, /lite:\s*boolean|props\.lite|rq-lite|省流/);
  assert.doesNotMatch(通关源码, /reducedMotion|:class="\{ 'reduced-motion'|rq-still|减动效/);

  for (const 路径 of 枚举客户端源码(客户端目录)) {
    if (路径.endsWith('旧界面偏好迁移.ts')) continue;
    const 源码 = readFileSync(路径, 'utf8');
    assert.doesNotMatch(源码, /rq-lite|rq-still/, `${路径} 不得再消费或产生已删除 class`);
  }
  assert.match(存储辅助源码, /export const 界面偏好存储键 = '人妻公寓_界面偏好'/);
  assert.match(存储辅助源码, /export const 已删除界面偏好字段 = \['省流', '减动效'\] as const/);
  assert.match(存储辅助源码, /window\.parent\?\.localStorage/, '共享存储候选必须先尝试父页面');
  assert.match(存储辅助源码, /window\.localStorage/, '父页不可达时仍保留当前 iframe 兜底');
  assert.match(偏好源码, /取得界面偏好存储/, 'useUIPrefs 必须复用父页面优先的共享存储锚点');
  assert.match(迁移源码, /取得界面偏好存储候选/, '启动迁移必须清理全部可访问存储候选');
  assert.match(迁移源码, /移除已删除界面偏好字段/);
  assert.match(迁移源码, /const 已删除根类 = \['rq-lite', 'rq-still'\] as const/);

  assert.match(App源码, /@media \(prefers-reduced-motion: reduce\)/, 'App 既有系统无障碍媒体查询保留');
  assert.match(地图源码, /const 用画布地图 = computed\(\(\) => !立面失效\.value\)/, '完整地图默认启用');
  assert.match(地图源码, /@error="立面失效 = true"/, '只有真实图片失败才切兜底');
  assert.match(地图源码, /<div v-else class="map-fallback">/, '图片失败兜底仍存在');
  assert.match(地图源码, /:global\(html\.rq-dark\) \.map-fallback \.bldg-body/, '夜间图片失败兜底仍可读');
  assert.match(通关源码, /@media \(prefers-reduced-motion: reduce\)/, '通关结算系统偏好保留');
});
