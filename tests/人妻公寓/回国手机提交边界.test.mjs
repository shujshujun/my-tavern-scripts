/* eslint-disable import-x/no-nodejs-modules -- Node-only async regression tests */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
globalThis._ = lodash;
globalThis.window = globalThis;
globalThis.parent = globalThis;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
function stub(file, exports) {
  const id = require.resolve(`../../src/人妻公寓/脚本/游戏逻辑/${file}`);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
stub('数据库桥.ts', { 同步社交轨迹: () => undefined });
stub('mvuIO.ts', {});
const { Schema } = require('../../src/人妻公寓/schema.ts');
const { 构造回国提交凭据, 回国提交凭据有效 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/回国提交凭据.ts');
const {
  创建手机时间线租约,
  读取当前手机时间线租约世代,
  作废当前手机时间线租约世代,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts');
let chat = 'A';
let stores;
let save;
let events;
globalThis.SillyTavern = { chat: [{ mes: 'anchor', is_user: false }] };
stub('手机/运行时上下文.ts', { 当前手机绝对时段: () => 8, 当前聊天ID: () => chat, 末楼: () => 0 });
stub('手机/UI刷新.ts', { 请求手机重绘: () => undefined, 请求刷新手机红点: () => undefined });
stub('手机/数据层.ts', {
  读库: () => stores[chat],
  写库增量: async (delta, valid) => {
    if (!valid()) return false;
    stores[chat].消息.push(...delta.新消息);
    return true;
  },
  立即持久保存手机聊天变量: () => save(),
});
globalThis.eventEmit = (...args) => events.push(args);
const { 同步回国父亲微信 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts');
const data = () =>
  Schema.parse({ 系统: { _绝对时段: 8, _回国: { 阶段: '待父亲回信', 父亲最早回信日: 1, 父亲最早回信时段: 7 } } });
function context() {
  return {
    聊天ID: chat,
    世代: 读取当前手机时间线租约世代(),
    绝对时段: 8,
    聊天消息: SillyTavern.chat,
    微信消息: stores[chat].消息,
  };
}
function reset() {
  chat = 'A';
  stores = { A: { 消息: [] }, B: { 消息: [] } };
  events = [];
  save = async () => undefined;
}

test('父亲通知保存成功后携带实存凭据，既有消息重试不重复写气泡', async () => {
  reset();
  assert.equal(await 同步回国父亲微信(data()), true);
  assert.equal(events.length, 1);
  assert.equal(回国提交凭据有效(events[0][2], context()), true);
  assert.equal(await 同步回国父亲微信(data()), false);
  assert.equal(stores.A.消息.length, 1);
  assert.equal(回国提交凭据有效(events[1][2], context()), true);
});

test('宿主保存挂起期间切聊天或回档，迟到通知不会再广播；旧凭据也不能提交', async () => {
  for (const invalidate of [
    () => {
      chat = 'B';
    },
    () => 作废当前手机时间线租约世代(),
  ]) {
    reset();
    let release, entered;
    const ready = new Promise(resolve => {
      entered = resolve;
    });
    save = () => {
      entered();
      return new Promise(resolve => {
        release = resolve;
      });
    };
    const pending = 同步回国父亲微信(data());
    await ready;
    const ticket = 构造回国提交凭据(创建手机时间线租约('A', 0, SillyTavern.chat, 8), stores.A.消息);
    invalidate();
    release();
    await pending;
    assert.equal(events.length, 0);
    assert.equal(回国提交凭据有效(ticket, context()), false);
  }
});

test('消费者拒绝缺凭据、缺消息、改写气泡、删锚、未来时间，普通加楼与刷新重签可恢复', async () => {
  reset();
  await 同步回国父亲微信(data());
  const ticket = events[0][2];
  for (const changes of [
    { 微信消息: [] },
    { 聊天消息: [] },
    { 绝对时段: 7 },
    { 世代: -1 },
    { 微信消息: [{ ...stores.A.消息[0], 文: '另一条消息' }] },
  ]) {
    assert.equal(回国提交凭据有效(ticket, { ...context(), ...changes }), false);
  }
  assert.equal(回国提交凭据有效(undefined, context()), false);
  assert.equal(回国提交凭据有效(ticket, { ...context(), 聊天消息: [...SillyTavern.chat, { mes: 'next' }] }), true);
  作废当前手机时间线租约世代();
  await 同步回国父亲微信(data());
  assert.equal(回国提交凭据有效(events.at(-1)[2], context()), true);
});

test('宿主保存失败不推进剧情，重试利用已保存消息补交', async () => {
  reset();
  save = async () => {
    throw new Error('save failed');
  };
  await assert.rejects(同步回国父亲微信(data()), /save failed/);
  assert.equal(events.length, 0);
  save = async () => undefined;
  await 同步回国父亲微信(data());
  assert.equal(stores.A.消息.length, 1);
  assert.equal(回国提交凭据有效(events[0][2], context()), true);
});
