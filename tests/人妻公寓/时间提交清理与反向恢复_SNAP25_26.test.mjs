/* eslint-disable import-x/no-nodejs-modules -- Node-only real-entry transaction tests */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createTimeEnvironment, undoCore } from './helpers/时间事务验收环境_s4t8.mjs';

const recordKey = undoCore.时间推进事务键;
const pointKey = undoCore.时间撤销点键;
const clone = value => structuredClone(value);
const onceAt = (kind, number, effect) => {
  let fired = false;
  return async event => {
    if (!fired && event.kind === kind && event.number === number) { fired = true; await effect(event); }
  };
};
const fail = () => { throw new Error('controlled storage failure'); };
const phone = () => ({ 消息: [
  { 楼: 1, 时: 5, 会话: '101', 发: '对方', 文: '睡前的普通通知。' },
  { 楼: 1, 时: 6, 会话: '101', 发: '对方', 文: '睡醒后的普通通知。' },
], 圈: [], 节拍: {} });
const assertOriginal = env => {
  assert.deepEqual(env.a.data, env.original.data, 'core must be exactly the pre-operation state');
  assert.deepEqual(env.a.vars, env.original.vars, 'chat must be exactly the pre-operation state');
};
const success = env => env.events.filter(event => event[0] === '人妻公寓:时间推进结束').at(-1)?.[1];

for (const [kind, number] of [['model', 1], ['chat:before', 1], ['chat:after', 1], ['core:before', 1], ['core:after', 1], ['chat:before', 2], ['chat:after', 2], ['chat:before', 3], ['chat:after', 3]]) {
  test(`SNAP-25 完整推进在${kind}#${number}报错时恢复双存储`, async () => {
    const env = createTimeEnvironment();
    env.setHook(onceAt(kind, number, fail));
    await env.advance();
    assert.equal(success(env), false);
    assert.ok(env.errors.length, 'real error must not be swallowed');
    assertOriginal(env);
  });
}

test('SNAP-25 正常睡眠和双击只结算一次，日志与撤销点一致', async () => {
  const env = createTimeEnvironment();
  await env.advance(true);
  assert.equal(success(env), true);
  assert.equal(env.counters.model, 1);
  assert.equal(env.a.data.系统._绝对时段, 6);
  assert.equal(env.a.vars._隔离事件.日志.length, 2);
  assert.equal(env.judge().有效, true);
  assert.equal(Object.hasOwn(env.a.vars, recordKey), false);
});

test('SNAP-25 可选世界书失败不能回滚已经完整提交的时间', async () => {
  const env = createTimeEnvironment();
  env.setHook(onceAt('worldbook', 1, fail));
  await env.advance();
  assert.equal(success(env), true);
  assert.equal(env.a.data.系统._绝对时段, 6);
  assert.equal(env.judge().有效, true);
});

test('SNAP-25 清理前切聊天不写新聊天，原聊天恢复记录可重载重入', async () => {
  const env = createTimeEnvironment();
  const untouched = clone(env.stores.get('time-b'));
  env.setHook(onceAt('chat:after', 2, () => env.switchChat('time-b')));
  await env.advance();
  assert.deepEqual(env.stores.get('time-b'), untouched);
  assert.ok(env.a.vars[recordKey]);
  env.switchChat('time-a'); env.reload(); env.setHook(async () => {});
  assert.equal(await env.recover(), true);
  assertOriginal(env);
  assert.equal(await env.recover(), false);
});

test('SNAP-25 核心补偿再次失败时保留恢复记录，重载后不会留下半事务', async () => {
  const env = createTimeEnvironment();
  env.setHook(async ({ kind, number }) => {
    if ((kind === 'chat:after' && number === 2) || (kind === 'core:before' && number === 2)) fail();
  });
  await env.advance();
  assert.ok(env.a.vars[recordKey], 'failed core rollback must not erase the only durable recovery record');
  env.reload(); env.setHook(async () => {});
  assert.equal(await env.recover(), true);
  assertOriginal(env);
});

test('SNAP-25 清理时替换为其他事务，不得补偿其MVU或删掉新记录', async () => {
  const env = createTimeEnvironment();
  let foreign;
  env.setHook(onceAt('chat:before', 3, () => {
    foreign = { ...clone(env.a.vars[recordKey]), 事务ID: 'foreign-owner' };
    env.a.vars[recordKey] = foreign;
  }));
  await env.advance();
  assert.equal(success(env), false);
  assert.equal(env.counters.core, 1, 'loss of ownership must stop before any core compensation');
  assert.deepEqual(env.a.vars[recordKey], foreign);
});

for (const stage of ['mirror:after', 'core:after', 'chat:after', 'phone:save']) {
  test(`SNAP-26 撤销在${stage}中断，重载后恢复到撤销前完整状态并可重试`, async () => {
    const env = createTimeEnvironment();
    await env.advance();
    env.a.vars._微信 = phone();
    const before = clone(env.a);
    env.resetCounters();
    env.setHook(onceAt(stage, stage === 'chat:after' ? 2 : 1, () => env.switchChat('time-b')));
    await env.undo();
    assert.ok(env.a.vars[recordKey], 'reverse operation must persist recovery data before its first core write');
    env.switchChat('time-a'); env.reload(); env.setHook(async () => {});
    assert.equal(await env.recover(), true);
    assert.deepEqual(env.a.data, before.data);
    assert.deepEqual(env.a.vars, before.vars);
    assert.equal(env.judge().有效, true);
    assert.equal(await env.recover(), false, 'recovery is idempotent');
    await env.undo();
    assert.equal(success(env), true);
    assert.equal(env.a.data.系统._绝对时段, 5);
    assert.equal(env.a.vars._隔离事件.日志.length, 0);
    assert.equal(env.a.vars._微信.消息.length, 1);
  });
}

for (const [kind, number] of [['chat:before', 1], ['chat:after', 1], ['core:before', 1], ['core:after', 1], ['chat:before', 2], ['chat:after', 2], ['phone:save', 1], ['chat:before', 3], ['chat:after', 3]]) {
  test(`SNAP-26 撤销在${kind}#${number}保存失败时精确补偿`, async () => {
    const env = createTimeEnvironment();
    await env.advance(); env.a.vars._微信 = phone();
    const before = clone(env.a);
    env.resetCounters(); env.setHook(onceAt(kind, number, fail));
    await env.undo();
    assert.equal(success(env), false);
    assert.ok(env.errors.length);
    assert.deepEqual(env.a.data, before.data);
    assert.deepEqual(env.a.vars, before.vars);
  });
}

test('SNAP-26 玩家主动发言使旧撤销点失效，不能回退时间或删除消息', async () => {
  const env = createTimeEnvironment(); await env.advance();
  env.a.vars._微信 = phone(); env.a.vars._微信.消息[1].发 = '我';
  const before = clone(env.a);
  env.resetCounters(); await env.undo();
  assert.equal(success(env), false);
  assert.equal(env.counters.core, 0);
  assert.deepEqual(env.a.data, before.data);
  assert.deepEqual(env.a.vars._微信, before.vars._微信);
  assert.equal(Object.hasOwn(env.a.vars, pointKey), false);
});

test('SNAP-26 原聊天不同分支的中断记录失败关闭且零写入', async () => {
  const env = createTimeEnvironment(); await env.advance();
  env.resetCounters(); env.setHook(onceAt('core:after', 1, () => env.switchChat('time-b')));
  await env.undo(); env.switchChat('time-a'); env.changeBranch(); env.setHook(async () => {});
  const before = clone(env.a); env.resetCounters();
  await assert.rejects(() => env.recover(), /分支|锚|时间线/);
  assert.equal(env.counters.core, 0);
  assert.deepEqual(env.a, before);
});

test('SNAP-26 恢复再次失败保留记录，再次重载继续，不依赖旧调用栈', async () => {
  const env = createTimeEnvironment(); await env.advance(); env.a.vars._微信 = phone();
  const before = clone(env.a);
  env.resetCounters(); env.setHook(onceAt('core:after', 1, () => env.switchChat('time-b')));
  await env.undo(); env.switchChat('time-a'); env.reload(); env.resetCounters();
  env.setHook(onceAt('core:after', 1, fail));
  await assert.rejects(() => env.recover(), /controlled/);
  assert.ok(env.a.vars[recordKey]);
  env.reload(); env.setHook(async () => {});
  assert.equal(await env.recover(), true);
  assert.deepEqual(env.a.data, before.data);
  assert.deepEqual(env.a.vars, before.vars);
});
