/* eslint-disable import-x/no-nodejs-modules -- Real bridge instances and SQLite; host transport and time are isolated. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';

const read = name => readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${name}.ts`, import.meta.url), 'utf8');
const sources = new Map();
function compile(file, names, environment = {}) {
  if (!sources.has(file)) sources.set(file, ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true));
  const ast = sources.get(file), declarations = new Map(), selected = new Set();
  for (const node of ast.statements) {
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) declarations.set(node.name.text, node);
    if (ts.isVariableStatement(node)) for (const d of node.declarationList.declarations) {
      if (ts.isIdentifier(d.name)) declarations.set(d.name.text, node);
    }
  }
  function include(name) {
    if (Object.hasOwn(environment, name)) return;
    const node = declarations.get(name);
    if (!node || selected.has(node)) return;
    selected.add(node);
    function visit(n) { if (ts.isIdentifier(n)) include(n.text); ts.forEachChild(n, visit); }
    visit(node);
  }
  for (const name of names) { assert.ok(declarations.has(name), `${file}:${name}`); include(name); }
  const text = [...selected].sort((a, b) => a.pos - b.pos).map(n => n.getText(ast)).join('\n');
  const js = ts.transpileModule(`${text}\nmodule.exports={${names.join(',')}};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', ...Object.keys(environment), js)(module, module.exports, ...Object.values(environment));
  return module.exports;
}
const flush = async () => { for (let n = 0; n < 24; n++) await Promise.resolve(); };
function clock() {
  let now = 10_000, seq = 0;
  const timers = new Map();
  return {
    Date: { now: () => now },
    setTimeout: (fn, ms) => { const id = ++seq; timers.set(id, { at: now + ms, fn }); return id; },
    clearTimeout: id => timers.delete(id),
    async advance(ms) {
      const target = now + ms;
      await flush();
      for (;;) {
        const next = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].fn(); await flush();
      }
      now = target; await flush();
    },
    clear: () => timers.clear(),
  };
}
function watch(promise) {
  const result = { settled: false, value: undefined };
  promise.then(value => { result.settled = true; result.value = value; });
  return result;
}
function world({ storageDenied = false, future = false } = {}) {
  const time = clock(), storage = new Map(), callbacks = new Set(), calls = [], instances = [];
  const host = { sessionStorage: {
    getItem: key => { if (storageDenied) throw Error('storage denied'); return storage.get(key) ?? null; },
    setItem: (key, value) => { if (storageDenied) throw Error('storage denied'); storage.set(key, value); },
  } };
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE rq_events(floor_no INTEGER PRIMARY KEY,time_text TEXT,location TEXT,participants TEXT,player_action TEXT,result_summary TEXT,event_code TEXT UNIQUE);
    CREATE TABLE rq_social_history(row_id INTEGER PRIMARY KEY,event_type TEXT,character_name TEXT,event_text TEXT,result TEXT,game_time TEXT,last_floor INTEGER,event_key TEXT UNIQUE,display_result TEXT);
    CREATE TABLE rq_character_memory(row_id INTEGER PRIMARY KEY,character_name TEXT,topic TEXT,memory_text TEXT,future_impact TEXT,last_time TEXT,last_floor INTEGER,confidence TEXT);
    CREATE TABLE rq_promises(row_id INTEGER PRIMARY KEY,title TEXT,related_characters TEXT,detail TEXT,status TEXT,last_progress TEXT,last_time TEXT,last_floor INTEGER);`);
  let chat = 'dual-test', auto = true, floor = 10;
  const snapshot = () => ({
    a: { name: 'RQ_剧情事件', content: [['楼层'], [future ? 11 : 4]] },
    b: { name: 'RQ_人物长期记忆', content: [['最后楼层']] },
    c: { name: 'RQ_承诺与伏笔', content: [['最后楼层']] },
    d: { name: 'RQ_社交轨迹', content: [['最后楼层'], ...db.prepare('SELECT last_floor FROM rq_social_history').all().map(r => [r.last_floor])] },
  });
  const api = {
    exportTableAsJson: snapshot,
    registerTableUpdateCallback: fn => callbacks.add(fn),
    unregisterTableUpdateCallback: fn => callbacks.delete(fn),
    executeSqlMutation(sql, params) {
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      const call = { sql, params: [...params], settled: false, finish(mode = 'apply') {
        assert.equal(call.settled, false); call.settled = true;
        if (mode === 'reject') { reject(Error('pre-commit failure')); return; }
        if (mode === 'unconfirmed') { resolve({ changes: 0, errors: [], saved: false }); return; }
        try {
          const changes = Number(db.prepare(sql).run(...params).changes);
          if (mode === 'apply-throw') reject(Error('post-commit failure'));
          else resolve({ changes, errors: [], saved: true });
        } catch (error) { reject(error); }
      } };
      calls.push(call); if (auto) call.finish(); return promise;
    },
  };
  const deps = {
    ...compile('数据库时间线栅栏', ['数据库时间线栅栏', '数据库异步写栅栏'], { Date: time.Date }),
    ...compile('数据库时间线接线所有权', ['接管数据库时间线接线']),
    ...compile('胶囊预算', ['胶囊预算选择']),
    ...compile('记忆文本规范', ['规范可读文本', '折叠检测文本']),
  };
  function instance() {
    const window = { parent: host, addEventListener() {}, removeEventListener() {} }, bus = new Map();
    const bridge = compile('数据库桥', [
      '等待数据库时间线就绪', '启动数据库时间线恢复', '执行数据库时间线恢复', '标记数据库时间线将变更',
      '接入宿主时间线事件', '清理数据库时间线接线', '数据库刷新完成回调', '读取持久时间线状态',
      '数据库时间线允许新写', '数据库异步写', '数据库未补偿迟到写', '时间线恢复任务', '时间线栅栏',
      '同步社交轨迹', '读取数据库记忆胶囊',
    ], {
      ...deps, ...time, _: lodash, window, console: { info() {}, warn() {}, error() {} },
      宿主窗口: () => host, 当前聊天标识: () => chat, 仍是同一聊天: id => id === chat, 当前末楼: () => floor,
      取数据库API: () => api, 数据库状态: () => ({ 已装游戏模板: true, 社交结果说明可用: true }),
      探测数据库SQLite模式: async () => true,
      执行SQLite查询: (sql, params = []) => ({ rows: db.prepare(sql).all(...params) }),
      确保数据库手动填表选择安全: () => {},
      tavern_events: { MESSAGE_DELETED: 'deleted', MESSAGE_SWIPED: 'swiped', CHAT_CHANGED: 'changed' },
      eventOn: (name, fn) => { if (!bus.has(name)) bus.set(name, new Set()); bus.get(name).add(fn); return { stop: () => bus.get(name).delete(fn) }; },
    });
    bridge.接入宿主时间线事件();
    bridge.emit = name => { for (const fn of [...(bus.get(name) ?? [])]) fn(); };
    bridge.window = window; instances.push(bridge); return bridge;
  }
  const social = (bridge, text, floor = 4, valid = () => true) => bridge.同步社交轨迹({
    类型: '赠礼', 人物: '测试住户', 事件: '交付设备', 结果: text, 时间: '第2天 早上', 楼层: floor, 事件键: 'dual-event',
  }, valid);
  return {
    time, calls, callbacks, instance, social, snapshot,
    auto: value => { auto = value; }, setChat: value => { chat = value; }, setFloor: value => { floor = value; },
    row: () => db.prepare('SELECT * FROM rq_social_history WHERE event_key=?').get('dual-event'),
    notify: () => { for (const fn of [...callbacks]) fn(snapshot()); },
    async close() {
      for (const b of instances) b.清理数据库时间线接线();
      auto = true; for (const call of calls) if (!call.settled) call.finish('reject');
      await flush(); time.clear(); db.close();
    },
  };
}

test('跨窗口内部删楼已由操作级栅栏覆盖时，不得重标成玩家删除消息', async () => {
  const w = world(), game = w.instance(), client = w.instance();
  try {
    game.标记数据库时间线将变更(0, '重开一局');
    const before = game.读取持久时间线状态('dual-test');
    const clientOldLease = client.数据库异步写.捕获('dual-test');
    assert.ok(before);

    // 客户端 iframe 也会收到同一个 MESSAGE_DELETED，但它没有游戏脚本的内部删楼租约。
    client.emit('deleted');
    const after = client.读取持久时间线状态('dual-test');
    assert.ok(after);
    assert.equal(after.原因, '重开一局');
    assert.equal(after.令牌, before.令牌, '已覆盖事件不得重新起一代共享恢复事务');
    assert.equal(after.目标楼层, 0);
    assert.equal(client.数据库异步写.可提交(clientOldLease), false, '客户端实例自己的迟到 SQL 仍必须立即作废');
  } finally { await w.close(); }
});

test('真实原生删除没有既有覆盖时仍建立删除栅栏，更低末楼会收窄既有栅栏', async () => {
  const w = world(), game = w.instance(), client = w.instance();
  try {
    w.setFloor(8);
    client.emit('deleted');
    const native = client.读取持久时间线状态('dual-test');
    assert.equal(native?.原因, '删除消息');
    assert.equal(native?.目标楼层, 8);

    game.标记数据库时间线将变更(6, '重掷回合');
    const before = game.读取持久时间线状态('dual-test');
    w.setFloor(4);
    client.emit('deleted');
    const narrowed = client.读取持久时间线状态('dual-test');
    assert.equal(narrowed?.原因, '删除消息');
    assert.equal(narrowed?.目标楼层, 4);
    assert.notEqual(narrowed?.令牌, before?.令牌);
  } finally { await w.close(); }
});

for (const stage of ['first', 'retry']) {
  for (const reason of ['删除消息', '切换消息分支']) {
    test(`${stage}/${reason}: shared recovery completion does not release an instance with old SQL`, async () => {
      const w = world(), a = w.instance(), b = w.instance();
      try {
        assert.equal(await w.social(a, '原有设备记录。'), '已确认'); const before = { ...w.row() };
        w.auto(false); const index = w.calls.length, old = w.social(a, '旧设备记录。', 10);
        await flush();
        if (stage === 'retry') {
          await w.time.advance(6000); assert.equal(await old, '待确认');
          w.calls[index].finish('reject'); await flush();
        }
        const late = w.calls.at(-1);
        a.标记数据库时间线将变更(10, reason); b.标记数据库时间线将变更(10, reason);
        const waited = watch(a.等待数据库时间线就绪(3500)), other = watch(b.等待数据库时间线就绪(3500));
        await w.time.advance(1100); w.notify(); await w.time.advance(500);
        assert.equal(other.value, true); assert.equal(b.读取持久时间线状态('dual-test'), null);
        assert.equal(a.数据库异步写.有已作废写入('dual-test'), true);
        assert.notEqual(waited.value, true, 'Shared record removal is not local write completion');
        assert.equal(await a.启动数据库时间线恢复('dual-test', 0), false);
        assert.equal(await a.等待数据库时间线就绪(0), false);
        assert.equal(a.读取数据库记忆胶囊(['测试住户'], 10), '');
        const count = w.calls.length; assert.equal(await w.social(a, '新设备记录。'), '失败'); assert.equal(w.calls.length, count);
        late.finish('apply-throw'); await flush();
        assert.equal(w.calls.length, count + 1); assert.notEqual(waited.value, true);
        w.calls[count].finish(); await flush(); await w.time.advance(200);
        assert.equal(waited.value, true); assert.deepEqual({ ...w.row() }, before);
        if (stage === 'first') assert.equal(await old, '失败');
        w.auto(true); assert.equal(await w.social(a, '新设备记录。'), '已确认');
        assert.match(a.读取数据库记忆胶囊(['测试住户'], 10), /新设备记录/);
        assert.equal(w.row().result, '新设备记录。');
      } finally { await w.close(); }
    });
  }
}
for (const failure of ['unfinished', 'compensation-failed']) {
  test(`${failure}: bounded wait stays false after another instance removes shared state`, async () => {
    const w = world(), a = w.instance(), b = w.instance();
    try {
      await w.social(a, '原有设备记录。'); w.auto(false); const old = w.social(a, '旧设备记录。'); await flush();
      a.标记数据库时间线将变更(10, '删除消息'); b.标记数据库时间线将变更(10, '删除消息');
      const result = watch(a.等待数据库时间线就绪(3500)); void b.等待数据库时间线就绪(3500);
      await w.time.advance(1100); w.notify(); await w.time.advance(500);
      if (failure === 'compensation-failed') { w.calls.at(-1).finish(); await flush(); w.calls.at(-1).finish('reject'); await flush(); }
      await w.time.advance(2200);
      assert.equal(result.settled, true); assert.equal(result.value, false);
      assert.equal(await a.等待数据库时间线就绪(0), false);
      assert.equal(a.数据库时间线允许新写('dual-test'), false);
      if (failure === 'compensation-failed') { assert.equal(await old, '失败'); assert.equal(a.数据库未补偿迟到写.has('dual-test'), true); }
    } finally { await w.close(); }
  });
}
for (const count of [1, 2]) {
  for (const storageDenied of [false, true]) {
    test(`${count} instances/storageDenied=${storageDenied}: normal recovery still opens`, async () => {
      const w = world({ storageDenied }), bridges = Array.from({ length: count }, () => w.instance());
      try {
        for (const b of bridges) b.标记数据库时间线将变更(10, '删除消息');
        const results = bridges.map(b => watch(b.等待数据库时间线就绪(3500)));
        await w.time.advance(3000);
        assert.ok(results.every(r => r.value === true));
        for (const b of bridges) assert.equal(b.数据库时间线允许新写('dual-test'), true);
      } finally { await w.close(); }
    });
  }
}
test('Future snapshot and swipe without a trusted callback do not open either instance', async () => {
  for (const future of [false, true]) {
    const w = world({ future }), a = w.instance(), b = w.instance();
    try {
      a.标记数据库时间线将变更(10, future ? '删除消息' : '切换消息分支');
      b.标记数据库时间线将变更(10, future ? '删除消息' : '切换消息分支');
      const results = [watch(a.等待数据库时间线就绪(3500)), watch(b.等待数据库时间线就绪(3500))];
      await w.time.advance(4000); assert.ok(results.every(r => r.value === false));
      assert.equal(a.数据库时间线允许新写('dual-test'), false);
    } finally { await w.close(); }
  }
});
for (const change of ['chat', 'unload', 'new-token', 'ABA', 'new-token-completed']) {
  test(`${change}: a late successful recovery promise cannot grant current readiness`, async () => {
    const w = world(), a = w.instance();
    try {
      a.标记数据库时间线将变更(10, '删除消息');
      const token = a.读取持久时间线状态('dual-test').令牌;
      let resolve; const pending = new Promise(yes => { resolve = yes; });
      // Explicit seam for the await boundary: the real public function consumes this in-flight task.
      a.时间线恢复任务.set('dual-test', { 令牌: token, promise: pending });
      const result = watch(a.等待数据库时间线就绪(3500)); await flush();
      if (change === 'chat') w.setChat('B');
      if (change === 'unload') a.清理数据库时间线接线();
      if (change === 'new-token') a.标记数据库时间线将变更(4, '删除消息');
      if (change === 'ABA') { w.setChat('B'); a.emit('changed'); w.setChat('dual-test'); a.标记数据库时间线将变更(4, '切换消息分支'); }
      if (change === 'new-token-completed') {
        a.标记数据库时间线将变更(4, '删除消息'); const b = w.instance();
        const newer = watch(b.等待数据库时间线就绪(3500)); await w.time.advance(3000);
        assert.equal(newer.value, true); assert.equal(a.数据库时间线允许新写('dual-test'), true);
      }
      resolve(true); await flush(); assert.equal(result.value, false);
    } finally { await w.close(); }
  });
}
test('Single-instance pending write times out closed and recovers after real compensation', async () => {
  const w = world(), a = w.instance();
  try {
    await w.social(a, '原有设备记录。'); w.auto(false); const old = w.social(a, '旧设备记录。'); await flush();
    a.标记数据库时间线将变更(10, '删除消息');
    const result = watch(a.等待数据库时间线就绪(3500)); await w.time.advance(3600);
    assert.equal(result.value, false); assert.ok(a.读取持久时间线状态('dual-test'));
    w.calls.at(-1).finish(); await flush(); w.calls.at(-1).finish(); await flush();
    assert.equal(await old, '失败'); const recovered = watch(a.等待数据库时间线就绪(3500));
    await w.time.advance(800); assert.equal(recovered.value, true);
    assert.equal(w.row().result, '原有设备记录。');
  } finally { await w.close(); }
});
test('A cancelled request without shared recovery blocks only its own instance until compensation', async () => {
  const w = world(), a = w.instance(), b = w.instance(); let valid = true;
  try {
    await w.social(a, '原有设备记录。'); w.auto(false);
    const old = w.social(a, '旧设备记录。', 10, () => valid); await flush(); valid = false;
    assert.equal(await a.等待数据库时间线就绪(0), false); assert.equal(await b.等待数据库时间线就绪(0), true);
    w.calls.at(-1).finish(); await flush(); w.calls.at(-1).finish(); await flush();
    assert.equal(await old, '失败'); assert.equal(await a.等待数据库时间线就绪(0), true);
    assert.equal(w.row().result, '原有设备记录。');
  } finally { await w.close(); }
});
test('Independent window unload preserves the other listener and reload retains pending recovery', async () => {
  const w = world(), a = w.instance(), b = w.instance();
  try {
    a.标记数据库时间线将变更(10, '删除消息'); b.标记数据库时间线将变更(10, '删除消息');
    a.清理数据库时间线接线(); const c = w.instance();
    assert.ok(c.读取持久时间线状态('dual-test'));
    b.emit('deleted'); assert.ok(b.读取持久时间线状态('dual-test'));
    const result = watch(c.等待数据库时间线就绪(3500)); await w.time.advance(3000);
    assert.equal(result.value, true); assert.equal(await a.等待数据库时间线就绪(0), false);
  } finally { await w.close(); }
});
