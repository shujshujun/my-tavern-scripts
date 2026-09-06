/* eslint-disable import-x/no-nodejs-modules -- Isolated real SQL writer/public-entry regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';
import { 数据库异步写栅栏 } from '../../src/人妻公寓/脚本/游戏逻辑/数据库时间线栅栏.ts';

// Preserve current production bodies, recursively including their local dependencies.
// Only host/plugin discovery, external query transport and the clock are adapters.
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', import.meta.url), 'utf8');
function compile(names, environment) {
  const ast = ts.createSourceFile('bridge.ts', source, ts.ScriptTarget.Latest, true);
  const declarations = new Map();
  for (const node of ast.statements) {
    if (ts.isFunctionDeclaration(node) && node.name) declarations.set(node.name.text, node);
    if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) if (ts.isIdentifier(d.name)) declarations.set(d.name.text, node);
    }
  }
  const included = new Set();
  function include(name) {
    if (Object.hasOwn(environment, name)) return;
    const node = declarations.get(name);
    if (!node || included.has(node)) return;
    included.add(node);
    function walk(n) {
      if (ts.isIdentifier(n) && declarations.has(n.text)) include(n.text);
      ts.forEachChild(n, walk);
    }
    walk(node);
  }
  names.forEach(include);
  const text = [...included].sort((a, b) => a.pos - b.pos).map(n => n.getText(ast)).join('\n');
  const js = ts.transpileModule(`${text}\nmodule.exports = {${names.join(',')}};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', ...Object.keys(environment), js)(module, module.exports, ...Object.values(environment));
  return module.exports;
}
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(check) {
  for (let n = 0; n < 100; n++) { if (check()) return; await tick(); }
  assert.fail('Controlled SQL adapter did not reach the expected checkpoint');
}
function fixture({ queryFailure = false, displayColumn = true } = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE rq_events(floor_no INTEGER PRIMARY KEY,time_text TEXT,location TEXT,participants TEXT,player_action TEXT,result_summary TEXT,event_code TEXT UNIQUE);
    CREATE TABLE rq_social_history(row_id INTEGER PRIMARY KEY,event_type TEXT,character_name TEXT,event_text TEXT,result TEXT,game_time TEXT,last_floor INTEGER,event_key TEXT UNIQUE,display_result TEXT);`);
  const writes = new 数据库异步写栅栏();
  const unresolved = new Set(), calls = [], timers = new Map(), logs = [];
  let timerId = 0, auto = true, chat = 'retry-test';
  const api = {
    executeSqlMutation(sql, params) {
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      const call = { sql, params: [...params], settled: false, finish(mode = 'apply') {
        assert.equal(call.settled, false); call.settled = true;
        if (mode === 'reject') { reject(new Error('Controlled pre-commit failure')); return; }
        if (mode === 'unconfirmed') { resolve({ changes: 0, errors: [], saved: false }); return; }
        try {
          call.changes = Number(db.prepare(sql).run(...params).changes);
          if (mode === 'apply-throw') reject(new Error('Controlled post-commit failure'));
          else resolve({ changes: call.changes, errors: [], saved: true });
        } catch (error) { reject(error); }
      } };
      calls.push(call);
      if (auto) call.finish();
      return promise;
    },
  };
  const bridge = compile(['同步数据库回合', '同步社交轨迹', '覆盖数据库剧情事件摘要', '修复数据库固定开局摘要'], {
    _: lodash, console: { warn: (...args) => logs.push(args), error: (...args) => logs.push(args) },
    取数据库API: () => api,
    数据库状态: () => ({ 已装游戏模板: true, 社交结果说明可用: displayColumn }),
    当前聊天标识: () => chat, 仍是同一聊天: id => id === chat,
    探测数据库SQLite模式: async () => true,
    执行SQLite查询: (sql, params = []) => queryFailure ? null : { rows: db.prepare(sql).all(...params) },
    数据库异步写: writes, 数据库未补偿迟到写: unresolved,
    数据库时间线允许新写: id => writes.可开始新写(id) && !unresolved.has(id),
    setTimeout: (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  return {
    db, bridge, writes, unresolved, calls, logs,
    setAuto: value => { auto = value; },
    setChat: value => { chat = value; },
    async expire() {
      await until(() => [...timers.values()].some(t => t.ms === 6000));
      for (const [id, t] of [...timers]) if (t.ms === 6000) { timers.delete(id); t.fn(); }
      await tick();
    },
    async close() {
      auto = true;
      for (const call of calls) if (!call.settled) call.finish('reject');
      await tick(); await tick(); timers.clear(); db.close();
    },
  };
}
const kinds = ['social', 'sync', 'overwrite', 'opening'];
function event(text, floor = 10, opening = false) {
  return { 楼层: floor, 时间: `第${text === '新设备记录。' ? 3 : 2}天 早上`, 地点: text === '新设备记录。' ? '新大堂' : '旧大堂',
    参与者: ['测试住户'], 玩家行动: opening ? '开始新游戏' : '核对设备', 结果摘要: text };
}
function entry(f, kind, text, valid = () => true) {
  if (kind === 'social') return f.bridge.同步社交轨迹({ 类型: '赠礼', 人物: '测试住户', 事件: '交付设备',
    结果: text, 时间: '第2天 早上', 楼层: 10, 事件键: 'retry-event' }, valid);
  if (kind === 'overwrite') return f.bridge.覆盖数据库剧情事件摘要(10, text, '核对设备', valid);
  if (kind === 'opening') return f.bridge.修复数据库固定开局摘要(valid);
  return f.bridge.同步数据库回合(event(text), valid);
}
const row = (f, kind) => kind === 'social'
  ? f.db.prepare('SELECT * FROM rq_social_history WHERE event_key=?').get('retry-event')
  : f.db.prepare('SELECT * FROM rq_events WHERE floor_no=?').get(kind === 'opening' ? 1 : 10);
async function seed(f, kind) {
  if (kind === 'social') assert.equal(await entry(f, kind, '原有设备记录。'), '已确认');
  else assert.equal(await f.bridge.同步数据库回合(event('原有设备记录。', kind === 'opening' ? 1 : 10, kind === 'opening')), '已确认');
}
async function freshWrite(f, kind) {
  if (kind === 'opening') return f.bridge.同步数据库回合(event('新设备记录。', 1));
  return entry(f, kind, '新设备记录。');
}
async function startRetry(f, kind, valid = () => true, firstMode = 'reject') {
  f.setAuto(false);
  const index = f.calls.length, pending = entry(f, kind, '旧设备记录。', valid);
  await until(() => f.calls.length === index + 1);
  await f.expire(); assert.equal(await pending, '待确认');
  f.calls[index].finish(firstMode);
  await until(() => f.calls.length === index + 2);
  return f.calls[index + 1];
}

for (const kind of kinds) {
  for (const reason of ['rollback', 'reroll', 'cancel']) {
    for (const completion of ['apply', 'apply-throw', 'reject']) {
      test(`${kind}: second retry ${reason}/${completion} blocks new writes through compensation`, async () => {
        const f = fixture(); let valid = true;
        try {
          await seed(f, kind); const before = { ...row(f, kind) };
          const retry = await startRetry(f, kind, () => valid);
          if (reason === 'cancel') valid = false;
          else f.writes.作废('retry-test');
          assert.equal(f.writes.有已作废写入('retry-test'), true, 'Second request must stay tracked after the first promise settles');
          const count = f.calls.length;
          assert.equal(await freshWrite(f, kind), '失败', 'New public write must not race an invalid unfinished retry');
          assert.equal(f.calls.length, count);
          retry.finish(completion);
          await until(() => f.calls.length === count + 1);
          assert.equal(f.writes.可开始新写('retry-test'), false, 'Do not release the gate before compensation completes');
          f.calls[count].finish();
          await until(() => f.writes.可开始新写('retry-test'));
          assert.deepEqual({ ...row(f, kind) }, before);
          assert.equal(f.unresolved.size, 0);
          f.setAuto(true); assert.equal(await freshWrite(f, kind), '已确认');
          const fresh = { ...row(f, kind) }; await tick();
          assert.deepEqual({ ...row(f, kind) }, fresh, 'No old callback may rewrite the newly confirmed row');
          if (kind === 'social' || kind === 'overwrite') assert.equal(fresh[kind === 'social' ? 'result' : 'result_summary'], '新设备记录。');
          else assert.equal(fresh.location, '新大堂');
        } finally { await f.close(); }
      });
    }
  }
  test(`${kind}: normal serial retry after an unconfirmed first attempt still succeeds once`, async () => {
    const f = fixture();
    try {
      await seed(f, kind);
      const retry = await startRetry(f, kind, () => true, 'unconfirmed'), count = f.calls.length;
      retry.finish(); await tick(); await tick();
      assert.equal(f.calls.length, count); assert.equal(f.writes.可开始新写('retry-test'), true);
      assert.ok(row(f, kind)); assert.equal(f.unresolved.size, 0);
      const table = kind === 'social' ? 'rq_social_history' : 'rq_events';
      assert.equal(f.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n, 1);
      if (kind === 'sync') assert.equal(row(f, kind).result_summary, '原有设备记录。', 'Existing reliable summary remains protected');
    } finally { await f.close(); }
  });
  test(`${kind}: first-attempt rollback compensation is retained`, async () => {
    const f = fixture();
    try {
      await seed(f, kind); const before = { ...row(f, kind) }, index = f.calls.length;
      f.setAuto(false); const pending = entry(f, kind, '旧设备记录。');
      await until(() => f.calls.length === index + 1); f.writes.作废('retry-test'); f.calls[index].finish();
      await until(() => f.calls.length === index + 2); f.calls[index + 1].finish();
      assert.equal(await pending, '失败'); assert.deepEqual({ ...row(f, kind) }, before);
    } finally { await f.close(); }
  });
}
for (const mode of ['reject', 'apply-throw']) {
  test(`Second compensation ${mode} is verified by read-back, not provider status`, async () => {
    const f = fixture();
    try {
      await seed(f, 'social'); const before = { ...row(f, 'social') };
      const retry = await startRetry(f, 'social'); f.writes.作废('retry-test');
      const count = f.calls.length; retry.finish(); await until(() => f.calls.length === count + 1);
      f.calls[count].finish(mode); await tick(); await tick();
      assert.equal(f.unresolved.has('retry-test'), mode === 'reject');
      if (mode === 'apply-throw') assert.deepEqual({ ...row(f, 'social') }, before);
      else { f.setAuto(true); assert.equal(await freshWrite(f, 'social'), '失败'); }
    } finally { await f.close(); }
  });
}
test('No before-image row: a late retried INSERT is deleted without touching unrelated keys', async () => {
  const f = fixture({ displayColumn: false });
  try {
    const retry = await startRetry(f, 'social'); f.writes.作废('retry-test');
    const count = f.calls.length; retry.finish(); await until(() => f.calls.length === count + 1);
    assert.match(f.calls[count].sql, /^DELETE/); f.calls[count].finish(); await tick(); await tick();
    assert.equal(row(f, 'social'), undefined); assert.equal(f.unresolved.size, 0);
    f.setAuto(true); assert.equal(await freshWrite(f, 'social'), '已确认');
  } finally { await f.close(); }
});
test('Fixed opening retry matching zero rows leaves a newer non-opening row unchanged', async () => {
  const f = fixture();
  try {
    await seed(f, 'opening'); const retry = await startRetry(f, 'opening');
    f.setAuto(true); assert.equal(await freshWrite(f, 'opening'), '已确认');
    const fresh = { ...row(f, 'opening') }, count = f.calls.length;
    retry.finish(); await tick(); await tick();
    assert.equal(retry.changes, 0); assert.equal(f.calls.length, count); assert.deepEqual({ ...row(f, 'opening') }, fresh);
  } finally { await f.close(); }
});
test('Cancelling before retry launch issues no second SQL request', async () => {
  const f = fixture(); let valid = true;
  try {
    await seed(f, 'social'); f.setAuto(false);
    const index = f.calls.length, pending = entry(f, 'social', '旧设备记录。', () => valid);
    await until(() => f.calls.length === index + 1); await f.expire(); assert.equal(await pending, '待确认');
    valid = false; f.calls[index].finish('reject');
    await until(() => f.calls.length === index + 2);
    assert.notEqual(f.calls[index + 1].params[3], '旧设备记录。', 'The second call is a before-image compensation, not a retry');
    f.calls[index + 1].finish(); await tick(); await tick(); assert.equal(f.calls.length, index + 2);
  } finally { await f.close(); }
});
test('A different chat can write while old-chat retry is unresolved; no compensation is aimed at it', async () => {
  const f = fixture();
  try {
    await seed(f, 'social'); const retry = await startRetry(f, 'social'); f.writes.作废('retry-test');
    f.setChat('other-chat'); f.setAuto(true);
    assert.equal(await f.bridge.同步社交轨迹({ 类型: '赠礼', 人物: '其他住户', 事件: '核对设备', 结果: '新设备记录。',
      时间: '第3天 早上', 楼层: 10, 事件键: 'other-event' }), '已确认');
    const count = f.calls.length; retry.finish('reject'); await tick(); await tick();
    assert.equal(f.calls.length, count); assert.equal(f.unresolved.size, 0);
    assert.equal(f.db.prepare('SELECT result FROM rq_social_history WHERE event_key=?').get('other-event').result, '新设备记录。');
  } finally { await f.close(); }
});
