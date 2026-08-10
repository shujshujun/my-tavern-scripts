/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

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
