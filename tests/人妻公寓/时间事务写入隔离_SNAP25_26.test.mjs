/* eslint-disable import-x/no-nodejs-modules -- Isolated host, real transaction and storage modules. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { actual, createTimeEnvironment, undoCore } from './helpers/时间事务验收环境_s4t8.mjs';

const require = createRequire(import.meta.url);
const gate = require('../../src/人妻公寓/脚本/游戏逻辑/时间事务写入门.ts');
const io = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const generation = require('../../src/人妻公寓/脚本/游戏逻辑/生成通道互斥.ts');
const phone = require('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
const clone = value => structuredClone(value);
const key = undoCore.时间推进事务键;
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

function environment() {
  generation.清空生成租约();
  const env = createTimeEnvironment();
  let writes = 0;
  globalThis.Mvu.replaceMvuData = async raw => { writes++; env.state.data = clone(raw.stat_data); };
  return { env, get writes() { return writes; } };
}

for (const record of [{ 事务ID: 'pending' }, null, undefined]) {
  test(`持久恢复键存在即拒绝普通MVU及生成，保留坏记录：${String(record)}`, async () => {
    const f = environment();
    f.env.a.vars[key] = record;
    const raw = { stat_data: clone(f.env.a.data) };
    const data = clone(f.env.a.data); data.现金 += 24;
    const prior = clone(raw);
    let ran = false;
    await assert.rejects(io.排队MVU操作(() => { ran = true; }), /时间操作/);
    await assert.rejects(io.脚本写入(raw, data), /时间操作/);
    assert.equal(ran, false); assert.equal(f.writes, 0); assert.deepEqual(raw, prior);
    assert.equal(generation.取得前台生成租约(), null);
    assert.equal(generation.取得手机生成租约(), null);
    assert.equal(Object.hasOwn(f.env.a.vars, key), true);
  });
}

test('清理已删持久键但宿主尚未返回时，运行租约仍阻止普通写', async () => {
  const f = environment();
  const release = gate.取得时间事务写入租约('time-a', 'cleanup');
  try {
    assert.equal(gate.时间事务阻止普通写入(), true);
    await assert.rejects(io.排队MVU操作(() => assert.fail('must not run')), /时间操作/);
    assert.equal(generation.取得手机生成租约(), null);
  } finally { release(); release(); }
  assert.equal(gate.时间事务阻止普通写入(), false);
  await io.排队MVU操作(() => io.脚本写入({ stat_data: clone(f.env.a.data) }, clone(f.env.a.data)));
  assert.equal(f.writes, 1);
});

test('同源客户端可见脚本租约，旧iframe销毁及迟到release不释放新租约', () => {
  environment();
  const owner = globalThis.window;
  const frame = { isConnected: true };
  owner.frameElement = frame;
  const oldRelease = gate.取得时间事务写入租约('time-a', 'old-owner');
  const reader = { parent: owner, document: {}, addEventListener() {}, removeEventListener() {} };
  globalThis.window = reader;
  let newRelease;
  try {
    assert.equal(gate.时间事务阻止普通写入(), true);
    frame.isConnected = false;
    assert.equal(gate.时间事务阻止普通写入(), false);
    newRelease = gate.取得时间事务写入租约('time-a', 'new-owner');
    oldRelease();
    assert.equal(gate.时间事务阻止普通写入(), true);
  } finally {
    newRelease?.(); oldRelease(); globalThis.window = owner; delete owner.frameElement;
  }
});

test('时间事务自己的精确写权可恢复，另一个调用不会继承这份授权', async () => {
  const f = environment();
  const record = undoCore.创建时间推进事务记录({ 聊天ID: 'time-a', 推进前数据: f.env.a.data,
    推进前聊天: undoCore.捕获精确聊天快照(f.env.a.vars, undoCore.时间推进事务恢复聊天键) });
  f.env.a.vars[key] = clone(record);
  const writer = undoCore.创建时间事务写口(record, { 校验归属: () => f.env.chatId === 'time-a', 更新聊天: update => globalThis.updateVariablesWith(update) });
  const release = gate.取得时间事务写入租约('time-a', record.事务ID, true);
  try {
    await io.脚本写入({ stat_data: clone(f.env.a.data) }, clone(f.env.a.data), { 时间事务校验: writer.校验, 记录成长: false });
    assert.equal(f.writes, 1);
    await assert.rejects(io.脚本写入({}, clone(f.env.a.data)), /时间操作/);
    f.env.a.vars[key].事务ID = 'foreign';
    await assert.rejects(io.脚本写入({}, clone(f.env.a.data), { 时间事务校验: writer.校验 }), /恢复记录已经变化/);
    assert.equal(f.writes, 1);
  } finally { release(); }
});

test('没有显式聊天ID的旧宿主仍与手机运行时共享同一匿名身份', () => {
  environment();
  const getId = SillyTavern.getCurrentChatId;
  delete SillyTavern.getCurrentChatId;
  const runtime = require('../../src/人妻公寓/脚本/游戏逻辑/手机/运行时上下文.ts');
  let release;
  try {
    const id = gate.时间事务当前聊天ID();
    assert.ok(id.startsWith('object:'));
    assert.equal(runtime.当前聊天ID(), id);
    release = gate.取得时间事务写入租约(id, 'legacy-host');
    assert.equal(gate.时间事务阻止普通写入(), true);
  } finally { release?.(); SillyTavern.getCurrentChatId = getId; }
});

test('排队候选不能跨过已经完整结束的时间事务再按旧基线执行', async () => {
  environment();
  const start = deferred(), finish = deferred();
  const first = io.排队MVU操作(async () => { start.resolve(); await finish.promise; });
  await start.promise;
  let ran = false;
  const second = io.排队MVU操作(() => { ran = true; });
  const rejected = assert.rejects(second, /排队期间时间/);
  const release = gate.取得时间事务写入租约('time-a', 'intervening'); release();
  finish.resolve(); await first; await rejected;
  assert.equal(ran, false);
});

test('手动MVU候选跨过时间事务时明确拒绝，不拿末楼数据覆盖不明目标', () => {
  const f = environment();
  const version = gate.当前时间事务写入版本();
  const candidate = { stat_data: { 现金: 1 }, metadata: 'preserve' };
  io.登记时间事务变量候选(candidate);
  const release = gate.取得时间事务写入租约('time-a', 'changed');
  f.env.a.data.系统._绝对时段 = 6;
  release();
  assert.ok(gate.当前时间事务写入版本() > version);
  assert.throws(() => io.确认时间事务变量候选(candidate), /解析期间时间已经变化/);
  assert.deepEqual(candidate.stat_data, { 现金: 1 });
  assert.equal(candidate.metadata, 'preserve');
  assert.doesNotThrow(() => io.确认时间事务变量候选({ stat_data: clone(f.env.a.data) }));
});

test('手机所有普通写口在恢复未完成时零修改、零分配消息序与回执', async () => {
  const f = environment();
  f.env.a.vars[key] = { 事务ID: 'pending' };
  const before = clone(f.env.a.vars);
  const stats = { 实际插入消息数: 99, 实际插入消息键: ['old'], 实际插入朋友圈数: 99 };
  assert.equal(await phone.写库增量({ 新消息: [{ 楼: 1, 时: 5, 会话: '101', 发: '我', 文: '普通通知。' }], 新圈: [], 节拍改: {} }, () => true, stats), false);
  assert.equal(await phone.修改微信消息容器(() => assert.fail('must not modify')), false);
  assert.equal(await phone.压缩微信会话记录('101', 32), false);
  assert.equal(await phone.立即持久保存手机聊天变量('time-a'), false);
  assert.equal(await phone.恢复微信刷新恢复副本('time-a'), false);
  assert.deepEqual(stats, { 实际插入消息数: 0, 实际插入消息键: [], 实际插入朋友圈数: 0 });
  assert.deepEqual(f.env.a.vars, before);
  assert.equal(f.env.counters.chat, 0);
});

test('手机预检之后才开始时间事务，真实updater仍拒绝迟到消息', async () => {
  const f = environment();
  let release;
  f.env.setHook(async ({kind, number}) => {
    if (kind === 'chat:before' && number === 1) release = gate.取得时间事务写入租约('time-a', 'late-start');
  });
  try {
    assert.equal(await phone.写库增量({ 新消息: [{ 楼: 1, 时: 5, 会话: '101', 发: '我', 文: '普通通知。' }], 新圈: [], 节拍改: {} }), false);
    assert.equal(Object.hasOwn(f.env.a.vars, '_微信'), false);
  } finally { release?.(); }
});

test('玩家真实发消息入口先返回未接受，不分配批次或清空草稿', async () => {
  const f = environment();
  f.env.a.vars[key] = { 事务ID: 'pending' };
  const notifications = [];
  const send = actual('发消息', { eventEmit: (...args) => notifications.push(args) }, '手机/交互/邀约与发消息.ts');
  assert.deepEqual(await send('101', '请保留这份草稿。'), { 已接受: false });
  assert.equal(f.env.counters.chat, 0);
  assert.ok(notifications.some(item => String(item[1]).includes('时间操作尚未完成恢复')));
});

test('撤销保存等待期间手机普通写被拒，清理失败后原消息完整保留', async () => {
  const f = environment(), env = f.env;
  await env.advance();
  env.a.vars._微信 = { 消息: [
    { 标识: 'before', 序: 1, 楼: 1, 时: 5, 会话: '101', 发: '对方', 文: '普通通知。' },
    { 标识: 'after', 序: 2, 楼: 1, 时: 6, 会话: '101', 发: '对方', 文: '稍后联系。' },
  ], 圈: [], 节拍: {} };
  const before = clone(env.a);
  env.resetCounters();
  let attempted = false;
  env.setHook(async ({kind, number}) => {
    if (kind === 'phone:save' && number === 1) {
      attempted = true;
      assert.equal(await phone.写库增量({ 新消息: [{ 标识: 'concurrent', 楼: 1, 时: 5, 会话: '101', 发: '我', 文: '已经记下。' }], 新圈: [], 节拍改: {} }), false);
    }
    if (kind === 'chat:before' && number === 3) throw new Error('cleanup failed');
  });
  await env.undo();
  assert.equal(attempted, true);
  assert.deepEqual(env.a, before);
  assert.equal(gate.时间事务阻止普通写入(), false);
});

test('授权时间恢复仍能经真实手机镜像和保存队列完成，不自锁或放行其他保存', async () => {
  const f = environment();
  const memory = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,String(v)), removeItem: k => values.delete(k) }; };
  window.localStorage = memory(); window.sessionStorage = memory();
  f.env.a.vars._微信 = { 消息: [{ 标识: 'kept', 序: 1, 楼: 1, 时: 5, 会话: '101', 发: '对方', 文: '保存的通知。' }], 圈: [], 节拍: {} };
  const record = undoCore.创建时间推进事务记录({ 聊天ID: 'time-a', 推进前数据: f.env.a.data,
    推进前聊天: undoCore.捕获精确聊天快照(f.env.a.vars, undoCore.时间推进事务恢复聊天键) });
  f.env.a.vars[key] = clone(record);
  const writer = undoCore.创建时间事务写口(record, { 校验归属: () => f.env.chatId === 'time-a', 更新聊天: update => globalThis.updateVariablesWith(update) });
  let saved = 0;
  SillyTavern.saveMetadata = async () => { saved++; };
  const release = gate.取得时间事务写入租约('time-a', record.事务ID, true);
  try {
    assert.equal(await phone.确认当前微信为刷新真值('time-a', undefined, writer.校验), true);
    assert.equal(await phone.立即持久保存手机聊天变量('time-a', writer.校验), true);
    assert.equal(saved, 1);
    assert.equal(await phone.立即持久保存手机聊天变量('time-a'), false);
    assert.equal(saved, 1);
    assert.equal(f.env.a.vars._微信.消息[0].标识, 'kept');
    await writer.清理();
  } finally { release(); delete SillyTavern.saveMetadata; }
});
