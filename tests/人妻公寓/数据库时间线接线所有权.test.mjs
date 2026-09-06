/* eslint-disable import-x/no-nodejs-modules -- Production registration and window ownership regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { 接管数据库时间线接线 } from '../../src/人妻公寓/脚本/游戏逻辑/数据库时间线接线所有权.ts';
const require = createRequire(import.meta.url), ts = require('typescript');

test('客户端与游戏脚本共享宿主时，生产注册仍分别持有监听', () => {
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('bridge.ts', source, ts.ScriptTarget.Latest, true);
  let call;
  function visit(n) {
    if (ts.isCallExpression(n) && n.expression.getText(ast) === '接管数据库时间线接线') call = n;
    ts.forEachChild(n, visit);
  }
  visit(ast);
  assert.ok(call, '生产桥必须以实例窗口接管，不能让宿主共享清理口停掉其他活动实例');
  const shared = {}, game = { parent: shared }, client = { parent: shared };
  const cleanups = [];
  const run = Function('window', '时间线宿主', '接管数据库时间线接线', '清理数据库时间线接线', `return ${call.getText(ast)}`);
  run(game, shared, 接管数据库时间线接线, () => cleanups.push('game'));
  run(client, shared, 接管数据库时间线接线, () => cleanups.push('client'));
  assert.deepEqual(cleanups, []);
  run(client, shared, 接管数据库时间线接线, () => cleanups.push('client-new'));
  assert.deepEqual(cleanups, ['client']);
  assert.doesNotMatch(source, /时间线宿主\.清理接线\?\.\(/, '不得再从共享宿主清理另一窗口');
});

test('同窗口重载清理旧实例，旧释放回调不抹掉新所有者', () => {
  const scope = {}, events = [];
  const releaseOld = 接管数据库时间线接线(scope, () => events.push('old'));
  接管数据库时间线接线(scope, () => events.push('current'));
  releaseOld();
  接管数据库时间线接线(scope, () => events.push('next'));
  assert.deepEqual(events, ['old', 'current']);
});

test('页面正常释放后不重复清理，旧清理失败不阻断下一实例', () => {
  const scope = {}, events = [];
  接管数据库时间线接线(scope, () => { throw new Error('unloaded'); });
  const release = 接管数据库时间线接线(scope, () => events.push('released'));
  release();
  release();
  接管数据库时间线接线(scope, () => events.push('next'));
  assert.deepEqual(events, []);
});
