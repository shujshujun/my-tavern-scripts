/* eslint-disable import-x/no-nodejs-modules -- Node regression tests */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';

// Exercise the real route, Schema, Store and App callback with controlled host I/O.
// No poll is started and the asset address is never fetched.
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
globalThis.getLastMessageId = () => 100;
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');
const resources = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const transactions = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const contracts = require('../../src/人妻公寓/不再留门契约.ts');
const art = require('../../src/人妻公寓/界面/客户端/不再留门资源.ts');
const { 计算场景同步 } = require('../../src/人妻公寓/界面/客户端/场景状态同步.ts');
const { 作废正文幕归属 } = require('../../src/人妻公寓/界面/客户端/正文幕归属.ts');
const vue = require('vue');
const pinia = require('pinia');
const { watchIgnorable } = require('@vueuse/core');
const { parse } = require('vue/compiler-sfc');
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const oldSource = process.env.PLAY020_BEFORE === '1';
const app = read(oldSource
  ? '../../.codex-tmp/codex-takeover-20260908/play020-before-App.vue'
  : '../../src/人妻公寓/界面/客户端/App.vue');
const storeSource = read(oldSource
  ? '../../.codex-tmp/codex-takeover-20260908/play020-before-mvu.ts'
  : '../../src/util/mvu.ts');
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const fixtureSource = read('./不再留门.test.mjs');
const fixtureAst = ts.createSourceFile('fixture.js', fixtureSource, ts.ScriptTarget.Latest, true);
const fixtureFunctions = fixtureAst.statements.filter(ts.isFunctionDeclaration);
const fixtureScope = { Schema, 创建户节点, route, lodash, assert, ...resources, ...transactions, ...contracts };
const fixture = new Function(...Object.keys(fixtureScope), 'let floor = 1;\n' +
  fixtureFunctions.map(node => node.getText(fixtureAst)).join('\n') + '\nreturn { toRecord, act, scene };')(
  ...Object.values(fixtureScope),
);
const archive = fixture.toRecord();
fixture.act(archive, '转存记录');
fixture.scene(archive, '检查记录');
const beforeArchive = lodash.cloneDeep(archive);
const result = fixture.act(archive, '归档母带', '302');
assert.equal(result.CG, 'ZXM-NMD-08');
assert.equal(contracts.不再留门已完成(beforeArchive), false);
assert.equal(contracts.不再留门已完成(archive), true);
const afterArchive = lodash.cloneDeep(archive);

const script = parse(app).descriptor.scriptSetup.content;
const appAst = ts.createSourceFile('App.ts', script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const appFunctions = ['捕获客户端时间线身份', '客户端时间线仍有效', '同步场景自变量'].map(name => {
  const node = appAst.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(node, `Actual App function exists: ${name}`);
  return node.getText(appAst);
});
const start = app.indexOf("eventOn('人妻公寓:不再留门CG'");
const end = app.indexOf("eventOn('人妻公寓:第二机位CG'", start);
assert.ok(start >= 0 && end > start, 'Actual notification callback exists');
const callbackSource = app.slice(start, end);

function setup(t, initial = beforeArchive) {
  const state = {
    persisted: { stat_data: lodash.cloneDeep(initial) },
    chat: { _场景: { 房间id: '302', 进房末楼: 1 } },
    chatId: 'chat-A', generation: 1, writes: 0, reads: 0, polls: 0,
    onMessageRead: null, onSceneRead: null,
  };
  const getVariables = option => {
    if (option.type === 'chat') {
      state.onSceneRead?.();
      return state.chat;
    }
    state.reads++;
    state.onMessageRead?.();
    return state.persisted;
  };
  const env = {
    _: lodash, ...vue, defineStore: pinia.defineStore, errorCatched: fn => fn, watchIgnorable,
    getVariables,
    useIntervalFn: (_fn, ms) => {
      assert.equal(ms, 500);
      state.polls++;
      return { pause() {}, resume() {} };
    },
    updateVariablesWith: fn => {
      state.writes++;
      state.persisted = fn(state.persisted);
    },
  };
  const storeFactory = new Function(...Object.keys(env), transpile(
    storeSource.replace('export function', 'function') + '\nreturn defineMvuDataStore;',
  ))(...Object.values(env));
  const store = storeFactory(Schema, { type: 'message', message_id: -1 })(pinia.createPinia());
  t.after(() => store.$dispose());
  assert.equal(typeof store.pull, 'function');
  assert.equal(state.polls, 1, 'One poll registered; none executed');
  state.reads = 0;
  const display = vue.ref(null);
  const room = vue.ref('302');
  let handler;
  let timers = 0;
  const ui = {
    _: lodash, ...art, store, data: vue.computed(() => store.data),
    当前房间: room, 当前家庭计划CG: display, 当前生产CG: vue.ref(null), 当前借种CG: vue.ref(null),
    已破门进入: vue.ref(false), 进房末楼: vue.ref(1), 本次入房由头已用: vue.ref(false), 末楼号: vue.ref(100),
    粘滞在场: vue.ref({ 位置: '302', 们: [] }), 正文幕归属状态: vue.ref({ 房间: '302', 有效: true }),
    当前聊天ID: () => state.chatId, 当前时间线切换世代: () => state.generation,
    getVariables, getLastMessageId: () => 100, 计算场景同步, 作废正文幕归属,
    清空当前成人CG() {}, 清空借种CG序列() {}, 清空安若妍不必停CG队列() {}, 清空CG信号交接() {},
    成人CG信号交接: {}, console: { error() {}, warn() {}, log() {} },
    eventOn: (name, fn) => { assert.equal(name, '人妻公寓:不再留门CG'); handler = fn; },
    setTimeout: () => { timers++; }, 安排客户端延迟: () => { timers++; },
  };
  new Function(...Object.keys(ui), transpile(
    'let 场景同步时间线世代 = 当前时间线切换世代(); let 最近CG信号 = null;\n' +
    appFunctions.join('\n') + '\n' + callbackSource,
  ))(...Object.values(ui));
  globalThis.__RQGY_NMD_ASSET_BASE__ = 'https://assets.invalid/play020';
  t.after(async () => {
    await vue.nextTick();
    assert.equal(state.writes, 0, 'Notification and pull must not write MVU');
    assert.equal(timers, 0, 'Notification must not schedule delayed retries');
    delete globalThis.__RQGY_NMD_ASSET_BASE__;
  });
  const payload = { 文件: result.CG, 实例: afterArchive.系统._不再留门.实例, 聊天ID: 'chat-A' };
  return {
    state, store, display, room, payload,
    notify: (value = payload) => handler(value),
    persist: value => { state.persisted = { stat_data: lodash.cloneDeep(value) }; },
  };
}

test('PLAY-020: 已归档通知在真实 Store 轮询前刷新缓存并立即显示，且无写回', async t => {
  const h = setup(t);
  h.persist(afterArchive);
  assert.equal(contracts.不再留门已完成(h.store.data), false);
  h.notify();
  assert.equal(h.display.value?.文件, 'ZXM-NMD-08');
  assert.equal(h.display.value?.来源, '不再留门');
  assert.equal(contracts.不再留门已完成(h.store.data), true);
  await vue.nextTick();
  assert.equal(h.state.writes, 0);
});

test('PLAY-020: 已刷新的正常归档仍显示，重复通知只保留一个当前画面', t => {
  const h = setup(t, afterArchive);
  h.notify();
  const first = lodash.cloneDeep(h.display.value);
  assert.equal(first?.文件, 'ZXM-NMD-08');
  h.notify();
  assert.deepEqual(h.display.value, first);
});

test('PLAY-020: 回滚后的持久化未归档覆盖旧已完成缓存，迟到通知不能复活', t => {
  const h = setup(t, afterArchive);
  h.persist(beforeArchive);
  h.notify();
  assert.equal(h.display.value, null);
  assert.equal(contracts.不再留门已完成(h.store.data), false);
});

test('PLAY-020: 其他聊天即使复用同一实例也不刷新或显示', t => {
  const h = setup(t, afterArchive);
  h.notify({ ...h.payload, 聊天ID: 'chat-B' });
  assert.equal(h.display.value, null);
  assert.equal(h.state.reads, 0);
});

test('PLAY-020: 缺少来源聊天身份的载荷不显示', t => {
  const h = setup(t, afterArchive);
  const { 聊天ID: _chatId, ...payload } = h.payload;
  h.notify(payload);
  assert.equal(h.display.value, null);
  assert.equal(h.state.reads, 0);
});

test('PLAY-020: 不同路线实例的通知被真实资格校验拒绝', t => {
  const h = setup(t, afterArchive);
  h.notify({ ...h.payload, 实例: 'other-instance' });
  assert.equal(h.display.value, null);
});

test('PLAY-020: 场景已离开302时刷新真实场景并拒绝旧房间通知', t => {
  const h = setup(t, afterArchive);
  h.state.chat._场景 = { 房间id: '202', 进房末楼: 99 };
  h.notify();
  assert.equal(h.room.value, '202');
  assert.equal(h.display.value, null);
});

test('PLAY-020: 场景已进入302时刷新旧房间缓存后显示', t => {
  const h = setup(t, afterArchive);
  h.room.value = '202';
  h.notify();
  assert.equal(h.room.value, '302');
  assert.equal(h.display.value?.文件, 'ZXM-NMD-08');
});

test('PLAY-020: 场景被撤销为楼道时不沿用302缓存', t => {
  const h = setup(t, afterArchive);
  h.state.chat._场景 = null;
  h.notify();
  assert.equal(h.room.value, null);
  assert.equal(h.display.value, null);
});

test('PLAY-020: 显式空素材覆盖时不显示', t => {
  const h = setup(t, afterArchive);
  globalThis.__RQGY_NMD_ASSET_BASE__ = '';
  h.notify();
  assert.equal(h.display.value, null);
});

test('PLAY-020: Store 读取抛错时拒绝旧完成缓存', t => {
  const h = setup(t, afterArchive);
  h.state.onMessageRead = () => { throw new Error('controlled read failure'); };
  assert.doesNotThrow(() => h.notify());
  assert.equal(h.display.value, null);
});

for (const [name, variables] of [
  ['缺失 stat_data', {}],
  ['Schema 拒绝的 stat_data', { stat_data: { 系统: null } }],
]) {
  test(`PLAY-020: ${name}不能沿用旧完成缓存显示`, t => {
    const h = setup(t, afterArchive);
    h.state.persisted = variables;
    h.notify();
    assert.equal(h.display.value, null);
  });
}

test('PLAY-020: 场景读取失败时拒绝旧房间缓存', t => {
  const h = setup(t, afterArchive);
  h.state.onSceneRead = () => { throw new Error('controlled scene failure'); };
  h.notify();
  assert.equal(h.display.value, null);
});

for (const mode of ['聊天', '同聊天时间线']) {
  test(`PLAY-020: 刷新期间切换${mode}后不展示到新身份`, t => {
    const h = setup(t, afterArchive);
    h.state.onMessageRead = () => {
      if (mode === '聊天') h.state.chatId = 'chat-B';
      else h.state.generation++;
    };
    h.notify();
    assert.equal(h.display.value, null);
  });
}
