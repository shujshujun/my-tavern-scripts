/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 设置源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/设置弹窗.vue', import.meta.url), 'utf8');

function 事件段(事件名, 下一个事件名) {
  const 起点 = App源码.indexOf(`eventOn('${事件名}'`);
  const 终点 = App源码.indexOf(`eventOn('${下一个事件名}'`, 起点 + 1);
  assert.ok(起点 >= 0 && 终点 > 起点, `${事件名} 处理器必须存在`);
  return App源码.slice(起点, 终点);
}

test('回合收口必须先拉取最新 MVU 时钟，再刷新邀约位置、在场和行动选项', () => {
  for (const [事件名, 下一个事件名] of [
    ['人妻公寓:回合完成', '人妻公寓:隔离事件完成'],
    ['人妻公寓:隔离事件完成', '人妻公寓:回合失败'],
    ['人妻公寓:回合失败', '人妻公寓:手机状态'],
  ]) {
    const 段 = 事件段(事件名, 下一个事件名);
    const 拉取位 = 段.indexOf('pull?.()');
    assert.ok(拉取位 >= 0, `${事件名} 必须主动拉取 store`);
    for (const 刷新 of ['刷赴约()', '刷新在场()']) {
      const 刷新位 = 段.indexOf(刷新);
      assert.ok(刷新位 > 拉取位, `${事件名} 的 ${刷新} 必须使用 pull 后的新时钟`);
    }
    const 行动位 = 段.indexOf('刷新行动选项()');
    if (行动位 >= 0) assert.ok(行动位 > 拉取位, `${事件名} 的行动选项必须使用 pull 后的新时钟`);
  }
});

test('自定义模型列表按请求世代与当前 API 身份隔离，关闭或改地址后旧结果零写入', () => {
  assert.match(设置源码, /let 模型读取世代 = 0;/, '模型读取需要单调请求身份');
  assert.match(设置源码, /function 作废模型读取\(\)/, '关闭、切通道和改 API 必须能作废旧请求');
  assert.match(设置源码, /const 本次世代 = \+\+模型读取世代;/, '每次读取冻结自己的世代');
  assert.match(
    设置源码,
    /本次世代 !== 模型读取世代[\s\S]{0,220}规范OpenAI兼容API地址\(解析API表单\.api地址\) !== base[\s\S]{0,160}解析API表单\.密钥\.trim\(\) !== key/,
    '异步返回前必须复核世代、地址和密钥',
  );
  assert.match(设置源码, /watch\([\s\S]{0,180}解析API表单\.api地址[\s\S]{0,100}解析API表单\.密钥[\s\S]{0,180}作废模型读取\(\)/, '编辑连接信息立即作废在途结果');
  assert.match(设置源码, /if \(!开\) 作废模型读取\(\)/, '关闭设置页必须作废在途结果');
});

test('偏好单例销毁后重挂载会接管最新 App 的时段、画幅与错误回调', async () => {
  const 原window = globalThis.window;
  const 原document = globalThis.document;
  const 原localStorage = globalThis.localStorage;
  const 值 = new Map([['人妻公寓_界面偏好', JSON.stringify({ 主题模式: '跟随' })]]);
  const localStorage = {
    getItem: key => 值.get(key) ?? null,
    setItem: (key, value) => 值.set(key, String(value)),
    removeItem: key => 值.delete(key),
  };
  const 类 = new Set();
  const classList = {
    toggle(name, force) {
      if (force) 类.add(name);
      else 类.delete(name);
    },
    contains(name) { return 类.has(name); },
  };
  const style = { setProperty() {}, removeProperty() {} };
  const matchMedia = { matches: false, addEventListener() {}, removeEventListener() {} };
  const windowMock = { matchMedia: () => matchMedia, innerHeight: 800 };
  windowMock.parent = windowMock;
  windowMock.top = windowMock;
  globalThis.window = windowMock;
  globalThis.document = {
    documentElement: { classList, style },
    fullscreenElement: null,
    createElement() { return { content: { firstChild: null } }; },
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.localStorage = localStorage;

  try {
    const require = createRequire(import.meta.url);
    process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
    require('ts-node/register/transpile-only');
    const vue = require('vue');
    const 模块路径 = require.resolve('../../src/人妻公寓/界面/客户端/composables/useUIPrefs.ts');
    delete require.cache[模块路径];
    const { useUIPrefs } = require(模块路径);
    const 旧时段 = vue.ref('早上');
    const 新时段 = vue.ref('早上');
    let 旧画幅调用 = 0;
    let 新画幅调用 = 0;
    const 旧错误 = [];
    const 新错误 = [];

    const 第一挂载 = useUIPrefs({
      timePeriod: 旧时段,
      syncViewport: () => { 旧画幅调用 += 1; },
      reportFullscreenError: 文本 => 旧错误.push(文本),
    });
    第一挂载.初始化();
    第一挂载.销毁();

    const 第二挂载 = useUIPrefs({
      timePeriod: 新时段,
      syncViewport: () => { 新画幅调用 += 1; },
      reportFullscreenError: 文本 => 新错误.push(文本),
    });
    第二挂载.初始化();
    第二挂载.应用画幅(true);
    assert.equal(旧画幅调用, 0, '旧 App 的画幅回调不得继续被单例持有');
    assert.equal(新画幅调用, 1);

    新时段.value = '晚上';
    await vue.nextTick();
    assert.equal(第二挂载.暗色.value, true, '跟随主题必须观察新 App 的时段 Ref');
    旧时段.value = '早上';
    await vue.nextTick();
    assert.equal(第二挂载.暗色.value, true, '旧 Ref 变化不得再影响新挂载');
    assert.deepEqual(旧错误, []);
    assert.deepEqual(新错误, []);
    第二挂载.销毁();
  } finally {
    if (原window === undefined) delete globalThis.window;
    else globalThis.window = 原window;
    if (原document === undefined) delete globalThis.document;
    else globalThis.document = 原document;
    if (原localStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = 原localStorage;
  }
});

test('损坏或旧版界面偏好按枚举、范围与布尔类型归一，不把非法值写进 CSS', () => {
  const 原window = globalThis.window;
  const 原document = globalThis.document;
  const 原localStorage = globalThis.localStorage;
  const 值 = new Map();
  const localStorage = {
    getItem: key => 值.get(key) ?? null,
    setItem: (key, value) => 值.set(key, String(value)),
    removeItem: key => 值.delete(key),
  };
  const classList = { toggle() {}, contains() { return false; } };
  const style = { setProperty() {}, removeProperty() {} };
  const matchMedia = { matches: false, addEventListener() {}, removeEventListener() {} };
  const windowMock = { matchMedia: () => matchMedia, innerHeight: 800 };
  windowMock.parent = windowMock;
  windowMock.top = windowMock;
  globalThis.window = windowMock;
  globalThis.document = {
    documentElement: { classList, style },
    fullscreenElement: null,
    createElement() { return { content: { firstChild: null } }; },
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.localStorage = localStorage;

  try {
    const require = createRequire(import.meta.url);
    process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
    require('ts-node/register/transpile-only');
    const 模块路径 = require.resolve('../../src/人妻公寓/界面/客户端/composables/useUIPrefs.ts');
    delete require.cache[模块路径];
    const { useUIPrefs, 设置存储键 } = require(模块路径);
    localStorage.setItem(设置存储键, JSON.stringify({
      主题模式: '凌晨',
      字号档: '超大',
      正文字色: 123,
      垫板浓度: 9,
      省流: 'false',
      减动效: 1,
      立绘显示: 'false',
    }));

    const 偏好 = useUIPrefs();
    偏好.恢复设置();
    assert.equal(偏好.主题模式.value, '日间');
    assert.equal(偏好.字号档.value, '中');
    assert.equal(偏好.正文字色.value, '');
    assert.equal(偏好.垫板浓度.value, 1, '垫板浓度必须夹在 0.2~1.0');
    assert.equal(偏好.省流.value, false, '字符串 false 不能被强转为 true');
    assert.equal(偏好.减动效.value, false);
    assert.equal(偏好.立绘显示.value, true);
  } finally {
    if (原window === undefined) delete globalThis.window;
    else globalThis.window = 原window;
    if (原document === undefined) delete globalThis.document;
    else globalThis.document = 原document;
    if (原localStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = 原localStorage;
  }
});

test('恢复默认外观只重置 UI 字段，保留变量解析通道、严格审计和版本初始化标记', () => {
  const 原window = globalThis.window;
  const 原document = globalThis.document;
  const 原localStorage = globalThis.localStorage;
  const 值 = new Map();
  const localStorage = {
    getItem: key => 值.get(key) ?? null,
    setItem: (key, value) => 值.set(key, String(value)),
    removeItem: key => 值.delete(key),
  };
  const classList = { toggle() {}, contains() { return false; } };
  const style = { setProperty() {}, removeProperty() {} };
  const matchMedia = { matches: false, addEventListener() {}, removeEventListener() {} };
  const windowMock = { matchMedia: () => matchMedia, innerHeight: 800 };
  windowMock.parent = windowMock;
  windowMock.top = windowMock;
  globalThis.window = windowMock;
  globalThis.document = {
    documentElement: { classList, style },
    fullscreenElement: null,
    createElement() { return { content: { firstChild: null } }; },
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.localStorage = localStorage;

  try {
    const require = createRequire(import.meta.url);
    process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
    require('ts-node/register/transpile-only');
    const { useUIPrefs, 设置存储键 } = require('../../src/人妻公寓/界面/客户端/composables/useUIPrefs.ts');
    localStorage.setItem(设置存储键, JSON.stringify({
      主题模式: '夜间',
      字号档: '大',
      内置变量解析: false,
      严格变量审计: true,
      变量解析通道: '自定义',
      MVU外置默认V080已初始化: true,
    }));

    useUIPrefs().重置界面偏好();
    const 保存后 = JSON.parse(localStorage.getItem(设置存储键));
    assert.deepEqual(
      {
        内置变量解析: 保存后.内置变量解析,
        严格变量审计: 保存后.严格变量审计,
        变量解析通道: 保存后.变量解析通道,
        MVU外置默认V080已初始化: 保存后.MVU外置默认V080已初始化,
      },
      { 内置变量解析: false, 严格变量审计: true, 变量解析通道: '自定义', MVU外置默认V080已初始化: true },
    );
    assert.equal(保存后.主题模式, '日间');
    assert.equal(保存后.字号档, '中');
    assert.equal(保存后.立绘显示, true);
  } finally {
    if (原window === undefined) delete globalThis.window;
    else globalThis.window = 原window;
    if (原document === undefined) delete globalThis.document;
    else globalThis.document = 原document;
    if (原localStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = 原localStorage;
  }
});
