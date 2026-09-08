/* eslint-disable import-x/no-nodejs-modules -- Real Vue composable and production service integration */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createRenderer, ref, toRaw } from 'vue';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 道具表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 准备通关结算 } = require('../../src/人妻公寓/脚本/游戏逻辑/通关结算.ts');
const { 创建通关纪念服务 } = require('../../src/人妻公寓/脚本/游戏逻辑/通关纪念服务.ts');
const { useSettlement } = require('../../src/人妻公寓/界面/客户端/composables/useSettlement.ts');

const 房间 = ['101', '102', '201', '202', '301', '302'];
function 存档({ 完成 = true, 已有首次 = false } = {}) {
  const data = Schema.parse({
    户: Object.fromEntries(房间.map(id => [id, 创建户节点(0)])),
    系统: {
      _序章完成: true, _绝对时段: 12,
      _已完成特殊场景: 完成 ? ['借种', '录像带结局', '角色路线:201:结局剧情', '角色路线:301:结局剧情', '双重继承'] : [],
      _通关纪念: { 全员完成时段: 完成 ? 10 : -1 },
    },
  });
  if (已有首次) 准备通关结算(data, '管理员室');
  return data;
}

/** Only timers, events, renderer host and MVU I/O are replaced; both production modules run unchanged. */
function 挂载(t, initial = 存档(), options = {}) {
  const data = ref(structuredClone(initial));
  const listeners = new Map();
  const timers = new Map();
  const jobs = new Set();
  const requests = [];
  const responses = [];
  const guards = new Set();
  const control = {
    now: 1000, chat: 'chat-a', generation: 17, online: true,
    busy: false, writeBusy: false, displayBusy: false, failWrites: false,
    holdResponses: false, delayed: [], writes: 0, ...options,
  };
  const original = {
    now: Date.now, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval,
    eventOn: globalThis.eventOn, eventEmit: globalThis.eventEmit, eventRemoveListener: globalThis.eventRemoveListener,
    tavern_events: globalThis.tavern_events, warn: console.warn,
  };
  Date.now = () => control.now;
  globalThis.setInterval = callback => { const id = Symbol('timer'); timers.set(id, callback); return id; };
  globalThis.clearInterval = id => timers.delete(id);
  globalThis.tavern_events = { CHAT_CHANGED: 'chat-changed', MESSAGE_SWIPED: 'message-swiped', MESSAGE_DELETED: 'message-deleted' };
  globalThis.eventOn = (event, callback) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(callback);
  };
  globalThis.eventRemoveListener = (event, callback) => listeners.get(event)?.delete(callback);
  console.warn = (...args) => { if (!String(args[0]).includes('通关纪念记录未提交')) original.warn(...args); };
  const fire = (event, payload) => { for (const callback of [...(listeners.get(event) ?? [])]) callback(payload); };
  const timeline = () => `${control.chat}\u0000${control.generation}`;
  const service = 创建通关纪念服务({
    聊天ID: () => control.chat, 时间线: timeline,
    忙碌: () => control.busy, 写入忙碌: () => control.writeBusy,
    场景: () => '管理员室',
    读取: () => ({ raw: { stat_data: structuredClone(toRaw(data.value)) }, data: structuredClone(toRaw(data.value)) }),
    排队: async task => { await task(); },
    登记提交校验: guard => { guards.add(guard); return () => guards.delete(guard); },
    写入: async (_raw, next) => {
      if (control.failWrites) throw new Error('test: persistent MVU write unavailable');
      assert.ok([...guards].every(guard => guard()), 'stale branch cannot commit');
      data.value = structuredClone(next);
      control.writes += 1;
    },
    捕获保护: next => assert.deepEqual(next, data.value),
    合法CG: id => /^cg-\d+$/.test(id),
    响应: response => {
      responses.push(structuredClone(response));
      if (control.holdResponses) control.delayed.push(structuredClone(response));
      else fire('人妻公寓:通关纪念响应', response);
    },
  });
  globalThis.eventEmit = (event, payload) => {
    if (event !== '人妻公寓:通关纪念请求') { fire(event, payload); return Promise.resolve(); }
    requests.push(structuredClone(payload));
    if (!control.online) return Promise.resolve();
    const promise = service(payload);
    jobs.add(promise);
    promise.finally(() => jobs.delete(promise));
    return promise;
  };
  const renderer = createRenderer({
    patchProp() {}, insert() {}, remove() {},
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    setText() {}, setElementText() {}, parentNode: () => null, nextSibling: () => null,
  });
  let api;
  const app = renderer.createApp({ setup() {
    api = useSettlement({
      data, 就绪: ref(true), 展示忙碌: () => control.displayBusy,
      写入忙碌: () => control.writeBusy, 聊天ID: () => control.chat, 场景: () => '管理员室',
    });
    return () => null;
  } });
  app.mount({});
  let unmounted = false;
  const unmount = () => { if (!unmounted) { app.unmount(); unmounted = true; } };
  const drain = async () => {
    for (let i = 0; i < 5; i += 1) { await Promise.all([...jobs]); await Promise.resolve(); }
  };
  t.after(async () => {
    unmount();
    await drain();
    Date.now = original.now;
    for (const key of ['setInterval', 'clearInterval', 'eventOn', 'eventEmit', 'eventRemoveListener', 'tavern_events']) {
      if (original[key] === undefined) delete globalThis[key];
      else globalThis[key] = original[key];
    }
    console.warn = original.warn;
  });
  return {
    api, data, control, requests, responses, timers, listeners, drain, unmount, fire,
    async advance(ms = 1000) {
      control.now += ms;
      for (const callback of [...timers.values()]) callback();
      await drain();
    },
    release(response) { fire('人妻公寓:通关纪念响应', response); },
    branch(event = 'message-swiped', next = 存档({ 完成: false })) {
      control.generation += 1;
      data.value = structuredClone(next);
      fire(event);
    },
  };
}

test('独立客户端不需要知道脚本世代，握手取得真实身份后能自动展示首次结算', async t => {
  const h = 挂载(t);
  await h.drain();
  assert.equal(h.requests[0].查询身份, true);
  assert.equal(h.requests[0].时间线, '', '客户端不把自身模块世代当作脚本世代');
  assert.equal(h.responses[0].时间线, 'chat-a\u000017');
  await h.advance();
  assert.equal(h.requests[1].时间线, 'chat-a\u000017');
  assert.equal(h.requests[1].查询身份, false);
  assert.equal(h.api.打开.value, true);
  assert.equal(h.api.庆祝.value.评级, 'S');
  assert.equal(h.data.value.系统._通关纪念.首次成绩.评级, 'S');
});

test('服务完全无响应时庆祝仍即时关闭，超时和重试不会再次强弹', async t => {
  const h = 挂载(t, 存档({ 已有首次: true }), { online: false });
  h.api.查看();
  assert.equal(h.api.打开.value, true);
  h.api.关闭();
  assert.equal(h.api.打开.value, false);
  assert.equal(h.api.保存中.value, false);
  await h.advance(11000);
  assert.equal(h.api.打开.value, false);
  assert.match(h.api.错误.value, /可以继续游玩/);
  await h.advance(1000);
  await h.advance(11000);
  assert.equal(h.api.打开.value, false);
  assert.equal(h.data.value.系统._通关纪念.已庆祝评级, '');
});

test('关闭确认写入失败只后台重试，恢复持久层后补确认且不改变首次快照', async t => {
  const h = 挂载(t, 存档({ 已有首次: true }));
  await h.drain();
  const first = structuredClone(toRaw(h.data.value.系统._通关纪念.首次成绩));
  h.control.failWrites = true;
  h.api.查看();
  h.api.关闭();
  assert.equal(h.api.打开.value, false);
  await h.drain();
  assert.equal(h.responses.at(-1).状态, '失败');
  assert.equal(h.data.value.系统._通关纪念.已庆祝评级, '');
  const requests = h.requests.length;
  await h.advance(1000);
  assert.equal(h.requests.length, requests, '失败退避期间不反复抢写');
  h.control.failWrites = false;
  await h.advance(5000);
  assert.equal(h.data.value.系统._通关纪念.已庆祝评级, 'S');
  assert.deepEqual(h.data.value.系统._通关纪念.首次成绩, first);
  assert.equal(h.api.打开.value, false);
  assert.equal(h.control.writes, 1);
  await h.advance();
  assert.equal(h.api.打开.value, false);
});

test('确认请求丢失后重新握手再补存，旧超时响应不会重新打开窗口', async t => {
  const h = 挂载(t, 存档({ 已有首次: true }));
  await h.drain();
  h.control.online = false;
  h.api.查看();
  h.api.关闭();
  const lost = h.requests.at(-1);
  assert.equal(lost.确认评级, 'S');
  await h.advance(11000);
  h.control.online = true;
  await h.advance();
  assert.equal(h.requests.at(-1).查询身份, true);
  await h.advance();
  assert.equal(h.data.value.系统._通关纪念.已庆祝评级, 'S');
  h.release({ id: lost.id, 时间线: lost.时间线, 状态: '完成', 庆祝: h.data.value.系统._通关纪念.首次成绩 });
  assert.equal(h.api.打开.value, false);
});

test('同一庆祝关闭后手动重看只是查看记录，重复关闭不导致自动重弹', async t => {
  const h = 挂载(t, 存档({ 已有首次: true }));
  await h.drain();
  h.control.failWrites = true;
  h.api.查看();
  h.api.关闭();
  await h.drain();
  for (let i = 0; i < 3; i += 1) {
    h.api.查看();
    assert.equal(h.api.打开.value, true);
    assert.equal(h.api.庆祝.value, null, '本次关闭记忆只抑制已看过的庆祝');
    h.api.关闭();
    assert.equal(h.api.打开.value, false);
    await h.advance();
    assert.equal(h.api.打开.value, false);
  }
  h.control.failWrites = false;
  await h.advance(5000);
  assert.equal(h.data.value.系统._通关纪念.已庆祝评级, 'S');
});

for (const event of ['message-swiped', 'message-deleted', 'chat-changed']) {
  test(`${event}清理旧弹窗、待确认与待登记CG，新分支重新握手`, async t => {
    const h = 挂载(t, 存档({ 已有首次: true }));
    await h.drain();
    h.control.online = false;
    h.api.记录CG('cg-1');
    h.api.查看();
    h.api.关闭();
    if (event === 'chat-changed') h.control.chat = 'chat-b';
    h.branch(event);
    assert.equal(h.api.打开.value, false);
    assert.equal(h.api.庆祝.value, null);
    h.control.online = true;
    await h.advance();
    const query = h.requests.at(-1);
    assert.equal(query.查询身份, true);
    assert.equal(query.聊天ID, h.control.chat);
    h.api.记录CG('cg-2');
    await h.advance();
    const fresh = h.requests.at(-1);
    assert.equal(fresh.时间线, `${h.control.chat}\u000018`);
    assert.equal(fresh.确认评级, undefined, '不能把旧分支关闭确认补到新分支');
    assert.deepEqual(fresh.CG, ['cg-2']);
    assert.deepEqual(h.data.value.系统._通关纪念.CG记录, ['cg-2']);
    assert.equal(h.data.value.系统._通关纪念.首次成绩, null);
  });
}

test('已提交旧分支的迟到庆祝响应不能打开新分支弹窗', async t => {
  const h = 挂载(t);
  await h.drain();
  h.control.holdResponses = true;
  await h.advance();
  assert.equal(h.control.delayed.length, 1);
  const old = h.control.delayed.shift();
  assert.equal(old.庆祝.评级, 'S');
  h.branch();
  h.control.holdResponses = false;
  h.release(old);
  assert.equal(h.api.打开.value, false);
  await h.advance();
  assert.equal(h.responses.at(-1).状态, '身份');
  assert.equal(h.responses.at(-1).时间线, 'chat-a\u000018');
  assert.equal(h.data.value.系统._通关纪念.首次成绩, null);
});

test('脚本重新挂载改变权威世代时失效响应触发重新握手并继续记录', async t => {
  const h = 挂载(t, 存档({ 完成: false }));
  await h.drain();
  h.control.generation += 1;
  h.api.记录CG('cg-1');
  await h.advance();
  assert.equal(h.responses.at(-1).状态, '失效');
  await h.advance();
  assert.equal(h.responses.at(-1).状态, '身份');
  assert.equal(h.responses.at(-1).时间线, 'chat-a\u000018');
  h.api.记录CG('cg-2');
  await h.advance();
  assert.deepEqual(h.data.value.系统._通关纪念.CG记录, ['cg-2']);
});

test('CG批次真实持久化成功才清待登记项，重复加载不产生额外写回', async t => {
  const h = 挂载(t, 存档({ 完成: false }));
  await h.drain();
  h.api.记录CG('cg-1');
  h.api.记录CG('cg-1');
  h.api.记录CG('cg-2');
  h.control.failWrites = true;
  await h.advance();
  assert.deepEqual(h.data.value.系统._通关纪念.CG记录, []);
  h.control.failWrites = false;
  await h.advance(5000);
  assert.deepEqual(h.data.value.系统._通关纪念.CG记录, ['cg-1', 'cg-2']);
  h.api.记录CG('cg-1');
  const writes = h.control.writes;
  const requests = h.requests.length;
  await h.advance();
  assert.equal(h.control.writes, writes);
  assert.equal(h.requests.length, requests);
});

test('关闭S后的本地去重不抑制后续SS晋级庆祝', async t => {
  const h = 挂载(t, 存档({ 已有首次: true }));
  await h.drain();
  h.api.查看();
  h.api.关闭();
  await h.drain();
  const outfits = Object.values(道具表).filter(item => item.类别 === '服饰').map(item => item.id);
  let remaining = 40;
  for (const door of 房间) {
    const count = Math.min(remaining, outfits.length);
    h.data.value.户[door].妻._衣柜 = outfits.slice(0, count);
    remaining -= count;
  }
  await h.advance();
  assert.equal(h.api.打开.value, true);
  assert.equal(h.api.庆祝.value.评级, 'SS');
  h.api.关闭();
  await h.drain();
  assert.equal(h.data.value.系统._通关纪念.已庆祝评级, 'SS');
  assert.equal(h.data.value.系统._通关纪念.首次成绩.评级, 'S');
});

test('组件卸载清理轮询和监听，旧响应不能写入已经卸载的界面', async t => {
  const h = 挂载(t);
  await h.drain();
  h.control.holdResponses = true;
  await h.advance();
  const response = h.control.delayed[0];
  h.unmount();
  assert.equal(h.timers.size, 0);
  assert.equal([...h.listeners.values()].reduce((total, values) => total + values.size, 0), 0);
  const count = h.requests.length;
  h.release(response);
  await h.advance();
  assert.equal(h.api.打开.value, false);
  assert.equal(h.requests.length, count);
});
