/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

test('新CG回合重置临时坏图集合，加载回调携带实际图片身份', () => {
  assert.match(App源码, /if \(!是加载重试\)[\s\S]{0,160}成人CG本次失效\.clear\(\)/);
  assert.match(App源码, /function 成人CG已加载\([^)]*(?:Event|事件)/);
  assert.match(App源码, /function 成人CG加载失败\([^)]*(?:Event|事件)/);
});

test('坏图会遍历候选池直到真正耗尽，不保留固定次数截断', () => {
  const 失败函数 = App源码.match(/function 成人CG加载失败\([\s\S]*?\n\}/)?.[0] ?? '';
  assert.doesNotMatch(失败函数, /重试次数|<\s*12/);
});

test('同一CG id 的迟到回调还必须匹配本次请求 epoch', () => {
  const { CG加载事件属于当前请求 } = require('../../src/人妻公寓/界面/客户端/cgLoadState.ts');
  assert.equal(CG加载事件属于当前请求('101-active-1', 8, '101-active-1', '8'), true);
  assert.equal(CG加载事件属于当前请求('101-active-1', 8, '101-active-1', '7'), false);
  assert.equal(CG加载事件属于当前请求('101-active-1', 8, '101-active-2', '8'), false);
  assert.equal(CG加载事件属于当前请求('101-active-1', 8, '101-active-1', '坏值'), false);

  assert.match(App源码, /:key="`\$\{当前成人CG\?\.id\}:\$\{当前成人CG请求epoch\}`"/);
  assert.match(App源码, /:data-cg-epoch="当前成人CG请求epoch"/);
});

test('普通toast不会取消性爱结果卡自己的隐藏计时', () => {
  const toast函数 = App源码.match(/function 弹提示\([\s\S]*?\n\}/)?.[0] ?? '';
  assert.doesNotMatch(toast函数, /性爱结果timer/);
  const 卸载函数 = App源码.match(/onUnmounted\(\(\) => \{[\s\S]*?\n\}\);/)?.[0] ?? '';
  assert.match(卸载函数, /clearTimeout\(性爱结果timer\)/);
});

test('卷轴异步刷新只允许最新请求提交', () => {
  assert.match(App源码, /卷轴请求序号/);
  assert.match(App源码, /请求序号\s*!==\s*卷轴请求序号/);
});

test('画幅监听返回清理函数并成对移除父层监听', () => {
  const 记录 = [];
  const 视口 = {
    addEventListener: (类型, 处理) => 记录.push(['add-vv', 类型, 处理]),
    removeEventListener: (类型, 处理) => 记录.push(['remove-vv', 类型, 处理]),
  };
  const 假窗口 = {
    parent: null,
    top: null,
    visualViewport: 视口,
    addEventListener: (类型, 处理) => 记录.push(['add-win', 类型, 处理]),
    removeEventListener: (类型, 处理) => 记录.push(['remove-win', 类型, 处理]),
  };
  假窗口.parent = 假窗口;
  假窗口.top = 假窗口;
  globalThis.window = 假窗口;

  const { 注册画幅监听 } = require('../../src/人妻公寓/界面/客户端/viewport.ts');
  const 清理 = 注册画幅监听();
  assert.equal(typeof 清理, 'function');
  清理();
  assert.equal(记录.filter(([动作]) => 动作.startsWith('add')).length, 3);
  assert.equal(记录.filter(([动作]) => 动作.startsWith('remove')).length, 3);
});

test('BFCache pagehide 后停止监听，pageshow 恢复时重新注册并同步画幅', () => {
  const 页面监听 = new Map();
  const 页面记录 = [];
  const 页面 = {
    addEventListener: (类型, 处理) => {
      页面记录.push(['add-page', 类型, 处理]);
      页面监听.set(类型, 处理);
    },
    removeEventListener: (类型, 处理) => {
      页面记录.push(['remove-page', 类型, 处理]);
      if (页面监听.get(类型) === 处理) 页面监听.delete(类型);
    },
  };
  let 注册数 = 0;
  let 注销数 = 0;
  let 同步数 = 0;
  const { 注册画幅页面生命周期 } = require('../../src/人妻公寓/界面/客户端/viewport.ts');
  const 清理 = 注册画幅页面生命周期(
    页面,
    () => {
      注册数 += 1;
      let 已注销 = false;
      return () => {
        if (已注销) return;
        已注销 = true;
        注销数 += 1;
      };
    },
    () => {
      同步数 += 1;
    },
  );

  assert.equal(注册数, 1);
  页面监听.get('pagehide')({ persisted: true });
  assert.equal(注销数, 1);
  页面监听.get('pageshow')({ persisted: true });
  assert.equal(注册数, 2);
  assert.equal(同步数, 1);

  清理();
  assert.equal(注销数, 2);
  assert.equal(页面监听.has('pagehide'), false);
  assert.equal(页面监听.has('pageshow'), false);
});
