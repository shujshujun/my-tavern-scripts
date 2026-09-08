/* eslint-disable import-x/no-nodejs-modules -- Valid recovery record with real MVU writer and a cleared host envelope. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createTimeEnvironment, undoCore } from './helpers/时间事务验收环境_s4t8.mjs';
const require = createRequire(import.meta.url);
const io = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const clone = value => structuredClone(value);
const key = undoCore.时间推进事务键;

async function pending(reverse) {
  const env = createTimeEnvironment();
  if (reverse) {
    await env.advance(); env.resetCounters();
    env.setHook(async ({kind, number}) => { if (kind === 'core:after' && number === 1) env.switchChat('time-b'); });
    await env.undo(); env.switchChat('time-a');
  } else {
    env.setHook(async ({kind, number}) => {
      if ((kind === 'chat:after' && number === 2) || (kind === 'core:before' && number === 2)) throw new Error('controlled interruption');
    });
    await env.advance();
  }
  env.setHook(async () => {});
  assert.ok(undoCore.读取时间推进事务记录(env.a.vars[key]));
  return env;
}

for (const reverse of [false, true]) {
  test(`${reverse ? '反向' : '正向'}时间记录在主账被维护按钮清空后，保留当前楼外壳并恢复完整主账`, async () => {
    const env = await pending(reverse);
    const expected = clone(env.a.vars[key].推进前数据);
    const originalShell = { initialized_lorebooks: { '原初始化账本': ['entry-1'] }, otherExtension: { owner: 'current-floor' } };
    let shell = clone(originalShell);
    let writes = 0;
    Mvu.getMvuData = () => clone(shell);
    Mvu.replaceMvuData = async raw => { writes++; shell = clone(raw); env.a.data = clone(raw.stat_data); };
    const adapters = { 脚本写入: io.脚本写入, 登记MVU提交校验: io.登记MVU提交校验,
      读取最近有效: () => assert.fail('recovery must not borrow another floor metadata') };
    assert.equal(await env.recover(adapters), true);
    assert.equal(writes, 1);
    assert.deepEqual(shell.stat_data, expected);
    assert.deepEqual(shell.initialized_lorebooks, originalShell.initialized_lorebooks);
    assert.deepEqual(shell.otherExtension, originalShell.otherExtension);
    for (const absent of ['schema', 'display_data', 'delta_data']) assert.equal(Object.hasOwn(shell, absent), false);
    assert.equal(Object.hasOwn(env.a.vars, key), false);
    assert.equal(await env.recover(adapters), false);
  });
}

for (const kind of ['null', 'array', 'throw', 'unknown-version']) {
  test(`不可靠当前外壳${kind}不会被空对象代替，也不删除恢复记录`, async () => {
    const env = await pending(false);
    const record = clone(env.a.vars[key]);
    let writes = 0;
    Mvu.getMvuData = () => {
      if (kind === 'throw') throw new Error('host read failed');
      return kind === 'null' ? null : kind === 'array' ? [] : { stat_data: { 系统: { _数据版本: 999 } } };
    };
    Mvu.replaceMvuData = async () => { writes++; };
    await assert.rejects(env.recover({ 脚本写入: io.脚本写入 }));
    assert.equal(writes, 0);
    assert.deepEqual(env.a.vars[key], record);
  });
}
