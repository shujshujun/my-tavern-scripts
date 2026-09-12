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
  const time = clock(), storage = new Map(), callbacks = new Set(), calls = [], instances = [], warnings = [];
  const host = { sessionStorage: {
    getItem: key => { if (storageDenied) throw Error('storage denied'); return storage.get(key) ?? null; },
    setItem: (key, value) => { if (storageDenied) throw Error('storage denied'); storage.set(key, value); },
  } };
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE rq_events(row_id INTEGER PRIMARY KEY,floor_no INTEGER NOT NULL UNIQUE,time_text TEXT,location TEXT,participants TEXT,player_action TEXT,result_summary TEXT,event_code TEXT NOT NULL UNIQUE);
    CREATE TABLE rq_social_history(row_id INTEGER PRIMARY KEY,event_type TEXT,character_name TEXT,event_text TEXT,result TEXT,game_time TEXT,last_floor INTEGER,event_key TEXT UNIQUE,display_result TEXT);
    CREATE TABLE rq_character_memory(row_id INTEGER PRIMARY KEY,character_name TEXT,topic TEXT,memory_text TEXT,future_impact TEXT,last_time TEXT,last_floor INTEGER,confidence TEXT);
    CREATE TABLE rq_promises(row_id INTEGER PRIMARY KEY,title TEXT,related_characters TEXT,detail TEXT,status TEXT,last_progress TEXT,last_time TEXT,last_floor INTEGER);
    CREATE TABLE chronicle(row_id INTEGER PRIMARY KEY,code_index TEXT NOT NULL UNIQUE,time_span TEXT NOT NULL,summary TEXT NOT NULL,chronicle_text TEXT NOT NULL,key_dialogue TEXT);`);
  if (future) {
    db.prepare(`INSERT INTO rq_character_memory
      (character_name, topic, memory_text, future_impact, last_time, last_floor, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('未来住户', '未来记忆', '未来分支数据', '不得提前放行', '第3天 晚上', 11, '高');
  }
  let chat = 'dual-test', auto = true, floor = 10;
  const snapshot = () => ({
    a: { name: 'RQ_剧情事件', content: [['楼层'], ...db.prepare('SELECT floor_no FROM rq_events ORDER BY floor_no').all().map(r => [r.floor_no])] },
    b: { name: 'RQ_人物长期记忆', content: [['最后楼层'], ...db.prepare('SELECT last_floor FROM rq_character_memory ORDER BY row_id').all().map(r => [r.last_floor])] },
    c: { name: 'RQ_承诺与伏笔', content: [['最后楼层'], ...db.prepare('SELECT last_floor FROM rq_promises ORDER BY row_id').all().map(r => [r.last_floor])] },
    d: { name: 'RQ_社交轨迹', content: [['最后楼层'], ...db.prepare('SELECT last_floor FROM rq_social_history ORDER BY row_id').all().map(r => [r.last_floor])] },
  });
  const api = {
    synchronizeChatTimeline: async () => ({ success: true }),
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
      '数据库脚本表裁剪状态', '解析数据库脚本表裁剪规则', '收口数据库脚本表裁剪',
      '同步数据库回合', '同步社交轨迹', '读取数据库记忆胶囊',
    ], {
      ...deps, ...time, _: lodash, window,
      console: { info() {}, warn: (...args) => warnings.push(args.map(String).join(' ')), error() {} },
      宿主窗口: () => host, 当前聊天标识: () => chat, 仍是同一聊天: id => id === chat, 当前末楼: () => floor,
      取数据库API: () => api, 数据库状态: () => ({ 已装游戏模板: true, 社交结果说明可用: true }),
      探测数据库SQLite模式: async () => true,
      执行SQLite查询: (sql, params = []) => ({ rows: db.prepare(sql).all(...params) }),
      确保数据库手动填表选择安全: () => {},
      tavern_events: { MESSAGE_DELETED: 'deleted', MESSAGE_SWIPED: 'swiped', CHAT_CHANGED: 'changed' },
      eventOn: (name, fn) => { if (!bus.has(name)) bus.set(name, new Set()); bus.get(name).add(fn); return { stop: () => bus.get(name).delete(fn) }; },
    });
    bridge.接入宿主时间线事件();
    bridge.emit = (name, ...args) => { for (const fn of [...(bus.get(name) ?? [])]) fn(...args); };
    bridge.window = window; instances.push(bridge); return bridge;
  }
  const event = (bridge, floor = 2, valid = () => true) => bridge.同步数据库回合({
    楼层: floor, 时间: '第1天 下午', 地点: '公寓大厅', 参与者: ['测试住户'],
    玩家行动: '继续测试', 结果摘要: '新时间线的剧情事件已经写入。',
  }, valid);
  const social = (bridge, text, floor = 4, valid = () => true) => bridge.同步社交轨迹({
    类型: '赠礼', 人物: '测试住户', 事件: '交付设备', 结果: text, 时间: '第2天 早上', 楼层: floor, 事件键: 'dual-event',
  }, valid);
  const seedScriptRows = (seedFloor, suffix = `branch-${seedFloor}`) => {
    db.prepare(`INSERT INTO rq_events
      (floor_no, time_text, location, participants, player_action, result_summary, event_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(seedFloor, '分支时间', '分支场景', '分支住户', '分支行动', `${suffix}剧情`, `${suffix}-event`);
    db.prepare(`INSERT INTO rq_social_history
      (event_type, character_name, event_text, result, game_time, last_floor, event_key, display_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('赠礼', '分支住户', '分支事件', `${suffix}社交`, '分支时间', seedFloor, `${suffix}-social`, `${suffix}社交`);
  };
  const seedResetRows = (seedFloor = 9) => {
    db.prepare(`INSERT INTO rq_events
      (floor_no, time_text, location, participants, player_action, result_summary, event_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(seedFloor, '旧时间', '旧场景', '旧住户', '旧行动', '旧分支剧情事件', `RQ-${seedFloor}`);
    db.prepare(`INSERT INTO rq_character_memory
      (character_name, topic, memory_text, future_impact, last_time, last_floor, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('旧住户', '旧局记忆', '上一局的长期记忆', '新局不得继承', '旧时间', seedFloor, '明确');
    db.prepare(`INSERT INTO rq_promises
      (title, related_characters, detail, status, last_progress, last_time, last_floor)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('旧局承诺', '旧住户', '上一局尚未完成的事项', '待处理', '旧进展', '旧时间', seedFloor);
    db.prepare(`INSERT INTO rq_social_history
      (event_type, character_name, event_text, result, game_time, last_floor, event_key, display_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('赠礼', '旧住户', '旧事件', '旧分支社交轨迹', '旧时间', seedFloor, `old-${seedFloor}`, '旧分支社交轨迹');
    db.prepare(`INSERT INTO chronicle
      (code_index, time_span, summary, chronicle_text, key_dialogue)
      VALUES (?, ?, ?, ?, ?)`)
      .run('AM0001', '旧时间', '旧局纪要', '上一局的剧情纪要。', null);
  };
  return {
    time, calls, callbacks, warnings, instance, event, social, snapshot, seedResetRows, seedScriptRows, api,
    auto: value => { auto = value; }, setChat: value => { chat = value; }, setFloor: value => { floor = value; },
    eventRows: () => db.prepare('SELECT * FROM rq_events ORDER BY floor_no').all(),
    memoryRows: () => db.prepare('SELECT * FROM rq_character_memory ORDER BY row_id').all(),
    promiseRows: () => db.prepare('SELECT * FROM rq_promises ORDER BY row_id').all(),
    socialRows: () => db.prepare('SELECT * FROM rq_social_history ORDER BY last_floor').all(),
    chronicleRows: () => db.prepare('SELECT * FROM chronicle ORDER BY row_id').all(),
    row: () => db.prepare('SELECT * FROM rq_social_history WHERE event_key=?').get('dual-event'),
    notify: () => { for (const fn of [...callbacks]) fn(snapshot()); },
    async close() {
      for (const b of instances) b.清理数据库时间线接线();
      auto = true; for (const call of calls) if (!call.settled) call.finish('reject');
      await flush(); time.clear(); db.close();
    },
  };
}

test('回放确认尚未完成时禁止抢先DELETE，完成后恢复读写并保留长期记忆', async () => {
  const w = world();
  let release;
  const replay = new Promise(resolve => { release = resolve; });
  w.api.synchronizeChatTimeline = () => replay;
  w.seedScriptRows(12);
  const b = w.instance();
  try {
    b.标记数据库时间线将变更(10, '回档至10楼');
    const pending = watch(b.等待数据库时间线就绪(3500));
    await w.time.advance(1500);
    assert.equal(w.calls.length, 0, '1.2秒插件防抖经过也不意味着回放已经完成');
    assert.equal(b.数据库时间线允许新写('dual-test'), false);
    release({ success: true });
    await w.time.advance(1800);
    assert.equal(pending.value, true);
    assert.ok(w.calls.some(call => call.sql.startsWith('DELETE')));
    assert.equal(w.eventRows().length, 0);
  } finally { await w.close(); }
});

test('旧插件没有回放接口时不发抢先清理SQL；已恢复快照可被动解锁', async () => {
  const w = world(), b = w.instance();
  delete w.api.synchronizeChatTimeline;
  try {
    w.seedScriptRows(12);
    b.标记数据库时间线将变更(10, '删除消息');
    const pending = watch(b.等待数据库时间线就绪(3500));
    await w.time.advance(4000);
    assert.equal(pending.value, false);
    assert.equal(w.calls.length, 0);
    assert.equal(w.eventRows().length, 1, '不能用强删未来记忆冒充恢复');
  } finally { await w.close(); }
  const clean = world(), c = clean.instance();
  delete clean.api.synchronizeChatTimeline;
  try {
    c.标记数据库时间线将变更(10, '删除消息');
    const pending = watch(c.等待数据库时间线就绪(3500));
    await clean.time.advance(4000);
    assert.equal(pending.value, true);
    assert.equal(clean.calls.length, 0);
  } finally { await clean.close(); }
});

test('物理删除之前不确认旧聊天；旧令牌迟到确认不能允许新令牌写入', async () => {
  const w = world(), b = w.instance(), pending = [];
  w.api.synchronizeChatTimeline = () => new Promise(resolve => pending.push(resolve));
  try {
    b.标记数据库时间线将变更(8, '回档至8楼');
    void b.等待数据库时间线就绪(3500);
    await w.time.advance(600);
    assert.equal(pending.length, 0);
    w.setFloor(8);
    await w.time.advance(300);
    assert.equal(pending.length, 1);
    b.标记数据库时间线将变更(6, '回档至6楼');
    w.setFloor(6);
    const next = watch(b.等待数据库时间线就绪(3500));
    await w.time.advance(300);
    assert.equal(pending.length, 2);
    pending[0]({ success: true });
    await w.time.advance(600);
    assert.equal(next.value, undefined);
    assert.equal(b.数据库时间线允许新写('dual-test'), false);
    assert.equal(w.calls.length, 0);
    pending[1]({ success: true });
    await flush();
    w.notify(); // 插件回放完成的表格通知；后续仍需连续稳定采样。
    await w.time.advance(1800);
    assert.equal(next.value, true);
  } finally { await w.close(); }
});

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

test('同一宿主事件的多实例重复标记只在短窗口内合并，之后同楼真实操作仍会换新令牌', async () => {
  const w = world(), game = w.instance(), client = w.instance();
  try {
    w.setFloor(8);
    game.标记数据库时间线将变更(8, '删除消息');
    const first = game.读取持久时间线状态('dual-test');
    assert.ok(first);

    client.标记数据库时间线将变更(8, '删除消息');
    const duplicate = client.读取持久时间线状态('dual-test');
    assert.equal(duplicate?.令牌, first.令牌, '同一事件被两个 iframe 同步观察时必须复用共享事务');

    await w.time.advance(251);
    client.标记数据库时间线将变更(8, '删除消息');
    const later = client.读取持久时间线状态('dual-test');
    assert.notEqual(later?.令牌, first.令牌, '短合并窗之后的同楼同类操作必须建立新事务，不能被旧恢复吞掉');
  } finally { await w.close(); }
});

test('精确 swipe 栅栏不会被稍后回合引擎兜底扩大到当前末楼', async () => {
  const w = world(), bridge = w.instance(), engineFallback = w.instance();
  try {
    w.setFloor(9);
    bridge.emit('swiped', 4);
    const exact = bridge.读取持久时间线状态('dual-test');
    assert.equal(exact?.目标楼层, 4);
    assert.equal(exact?.原因, '切换消息分支');

    // 回合引擎在异步 MVU 队列后才进入，可能已经超过普通同源事件的250ms合并窗。
    await w.time.advance(400);
    engineFallback.标记数据库时间线将变更(9, '切换消息分支', { 已有共享栅栏覆盖时不重标: true });
    const preserved = engineFallback.读取持久时间线状态('dual-test');
    assert.equal(preserved?.令牌, exact?.令牌);
    assert.equal(preserved?.目标楼层, 4, '已有更严格的精确楼号必须继续覆盖当前末楼兜底');
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

test('重开到0会清空上一局五张数据库记忆表，再恢复剧情与社交写入', async () => {
  const w = world(), game = w.instance(), client = w.instance();
  try {
    w.seedResetRows(9);
    for (const rows of [w.eventRows(), w.memoryRows(), w.promiseRows(), w.socialRows(), w.chronicleRows()]) {
      assert.equal(rows.length, 1);
    }

    game.标记数据库时间线将变更(0, '重开一局');
    w.setFloor(0);
    client.emit('deleted');
    const results = [watch(game.等待数据库时间线就绪(8000)), watch(client.等待数据库时间线就绪(8000))];
    await w.time.advance(9000);

    assert.ok(results.every(result => result.value === true), '上一局数据库记忆不得把新局永久锁在恢复态');
    for (const rows of [w.eventRows(), w.memoryRows(), w.promiseRows(), w.socialRows(), w.chronicleRows()]) {
      assert.deepEqual(rows, []);
    }
    assert.equal(await w.event(game, 2), '已确认');
    assert.equal(await w.social(game, '新局社交轨迹。', 2), '已确认');
    assert.equal(w.eventRows().at(-1)?.result_summary, '新时间线的剧情事件已经写入。');
    assert.equal(w.socialRows().at(-1)?.result, '新局社交轨迹。');
  } finally { await w.close(); }
});

test('普通回档只裁剪脚本独占两表，通用长期记忆／承诺／纪要交给checkpoint保留', async () => {
  const w = world(), game = w.instance();
  try {
    w.seedResetRows(4);
    w.seedScriptRows(8, 'future');
    game.标记数据库时间线将变更(4, '回档至4楼');
    w.setFloor(4);
    const result = watch(game.等待数据库时间线就绪(3500));
    await w.time.advance(3200);

    assert.equal(result.value, true);
    assert.deepEqual(w.eventRows().map(row => row.floor_no), [4], '剧情流水只保留存活锚楼及以前');
    assert.deepEqual(w.socialRows().map(row => row.last_floor), [4], '社交流水只保留存活锚楼及以前');
    assert.equal(w.memoryRows().length, 1, '人物长期记忆不能被游戏侧普通回档清空');
    assert.equal(w.promiseRows().length, 1, '承诺与伏笔不能被游戏侧普通回档清空');
    assert.equal(w.chronicleRows().length, 1, '纪要不能被游戏侧普通回档清空');
    const deletes = w.calls.filter(call => /^DELETE FROM /u.test(call.sql));
    assert.equal(deletes.length, 2);
    assert.ok(deletes.every(call => /DELETE FROM (?:rq_events|rq_social_history)/u.test(call.sql)));
    assert.ok(deletes.every(call => / > \?/u.test(call.sql)), '普通回档只能裁目标楼之后，不得删除目标楼');
  } finally { await w.close(); }
});

test('普通回档裁剪DELETE超时后，底层Promise真实settle前跨窗口持续关门且不重复发SQL', async () => {
  const w = world(), game = w.instance(), client = w.instance();
  try {
    w.seedScriptRows(8, 'future-timeout');
    w.auto(false);
    game.标记数据库时间线将变更(4, '回档至4楼');
    client.标记数据库时间线将变更(4, '回档至4楼');
    w.setFloor(4); // 真实删除完成后才进入插件回放与脚本流水裁剪。
    const results = [watch(game.等待数据库时间线就绪(8000)), watch(client.等待数据库时间线就绪(8000))];

    // 第一张脚本表的裁剪已超过单次2.5秒等待，但底层DELETE仍未真正结算。
    await w.time.advance(3600);
    assert.equal(w.calls.length, 1, '多iframe与恢复重试不得复制仍在运行的破坏性裁剪SQL');
    assert.ok(results.every(result => result.value !== true));
    assert.equal(game.数据库时间线允许新写('dual-test'), false);
    assert.equal(client.数据库时间线允许新写('dual-test'), false);
    const callCount = w.calls.length;
    assert.equal(await w.event(game, 2), '失败', '裁剪未settle期间新剧情写入必须失败关闭');
    assert.equal(w.calls.length, callCount, '被栅栏拒绝的业务写不得进入数据库队列');

    w.auto(true);
    w.calls[0].finish();
    await flush();
    await w.time.advance(3600);
    assert.ok(results.every(result => result.value === true));
    assert.deepEqual(w.eventRows(), []);
    assert.deepEqual(w.socialRows(), []);
    assert.ok(w.calls.every(call => call.settled), '开放写门时不得残留任何脚本表裁剪DELETE');
  } finally { await w.close(); }
});

test('同楼swipe使用事件携带的精确楼号，并删除目标楼及其后的旧剧情／社交分支行', async () => {
  const w = world(), game = w.instance();
  try {
    w.seedScriptRows(2, 'prior');
    w.seedResetRows(4);
    w.setFloor(9);
    game.emit('swiped', 4);
    const pending = game.读取持久时间线状态('dual-test');
    assert.equal(pending?.目标楼层, 4, '不得用仍为9的当前末楼替代实际被swipe的4楼');
    assert.equal(pending?.原因, '切换消息分支');

    const result = watch(game.等待数据库时间线就绪(3500));
    await w.time.advance(1200);
    w.notify();
    await w.time.advance(500);

    assert.equal(result.value, true);
    assert.deepEqual(w.eventRows().map(row => row.floor_no), [2], '目标4楼的旧剧情行必须与未来行一起裁掉');
    assert.deepEqual(w.socialRows().map(row => row.last_floor), [2], '目标4楼的旧社交行必须与未来行一起裁掉');
    assert.equal(w.memoryRows().length, 1);
    assert.equal(w.promiseRows().length, 1);
    assert.equal(w.chronicleRows().length, 1);
    const deletes = w.calls.filter(call => /^DELETE FROM /u.test(call.sql));
    assert.equal(deletes.length, 2);
    assert.ok(deletes.every(call => / >= \?/u.test(call.sql)), '同楼swipe必须包含目标楼自身');
  } finally { await w.close(); }
});

test('重开五表清空后若checkpoint迟到回灌旧行，稳定复核会再次清理而不开放新写', async () => {
  const w = world(), game = w.instance();
  try {
    w.seedResetRows(9);
    game.标记数据库时间线将变更(0, '重开一局');
    w.setFloor(0);
    const result = watch(game.等待数据库时间线就绪(8000));

    await w.time.advance(2700);
    assert.ok(result.value !== true);
    for (const rows of [w.eventRows(), w.memoryRows(), w.promiseRows(), w.socialRows(), w.chronicleRows()]) {
      assert.deepEqual(rows, [], '第一轮五表清场应已落库但仍处于稳定复核期');
    }

    // 模拟数据库删楼守卫／checkpoint 在清场后迟到把上一局快照重新灌回运行表。
    w.seedResetRows(9);
    await w.time.advance(5500);
    assert.equal(result.value, true, '迟到回灌必须被重新清理后才能完成原恢复令牌');
    for (const rows of [w.eventRows(), w.memoryRows(), w.promiseRows(), w.socialRows(), w.chronicleRows()]) {
      assert.deepEqual(rows, []);
    }
    const eventDeletes = w.calls.filter(call => /^DELETE FROM rq_events /u.test(call.sql));
    assert.ok(eventDeletes.length >= 2, '同一令牌应检测并清理至少两次旧剧情回灌');
  } finally { await w.close(); }
});

test('重开清场DELETE超时后跨窗口只保留一笔，真实结算前不开放新局写入', async () => {
  const w = world(), game = w.instance(), client = w.instance();
  try {
    w.seedResetRows(9);
    w.auto(false);
    game.标记数据库时间线将变更(0, '重开一局');
    w.setFloor(0);
    client.emit('deleted');
    const results = [watch(game.等待数据库时间线就绪(8000)), watch(client.等待数据库时间线就绪(8000))];

    // 第一张表的 DELETE 已超过单次等待上限，但底层 promise 尚未真正结算。
    await w.time.advance(6000);
    assert.equal(w.calls.length, 1, '两个 iframe 与超时重试不得复制同一笔破坏性清场 SQL');
    assert.ok(results.every(result => result.value !== true));
    assert.equal(game.数据库时间线允许新写('dual-test'), false);
    assert.equal(client.数据库时间线允许新写('dual-test'), false);

    // 原 DELETE 真正 settle 后，其余空表清场可串行完成；之后的新局行不会被迟到请求抹掉。
    w.auto(true);
    w.calls[0].finish();
    await flush();
    await w.time.advance(4000);
    assert.ok(
      results.every(result => result.settled && result.value === false),
      '原8秒有界等待已经到期时保持失败关闭，不把迟到清场伪报为本次同步完成',
    );
    assert.equal(game.读取持久时间线状态('dual-test'), null, '后台重试应在真实settle后完成共享恢复');
    assert.equal(client.读取持久时间线状态('dual-test'), null);
    assert.equal(await game.等待数据库时间线就绪(0), true);
    assert.equal(await w.event(game, 2), '已确认');
    assert.equal(w.eventRows().at(-1)?.result_summary, '新时间线的剧情事件已经写入。');
    assert.ok(w.calls.every(call => call.settled), '数据库写门开放时不得残留任何清场 DELETE');
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
      await w.time.advance(3200);
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
      assert.equal(w.calls.length, 0, '普通回档或 swipe 不得借重开清场逻辑删除任何数据库行');
      if (future) assert.equal(w.memoryRows().length, 1, '普通回档中的未来长期记忆应等待插件恢复，而不是被脚本清空');
    } finally { await w.close(); }
  }
});

test('同一聊天同一恢复令牌由多个观察者等待时只打印一次超时；新令牌仍可提示一次', async () => {
  const w = world({ future: true }), a = w.instance(), b = w.instance();
  const 警告数 = () => w.warnings.filter(line => line.includes('数据库重建未在时限内完成')).length;
  try {
    a.标记数据库时间线将变更(10, '删除消息');
    b.标记数据库时间线将变更(10, '删除消息');
    const first = [watch(a.等待数据库时间线就绪(3500)), watch(b.等待数据库时间线就绪(3500))];
    await w.time.advance(4000);
    assert.ok(first.every(result => result.settled && result.value === false));
    assert.equal(警告数(), 1, '同一共享恢复任务不得被两个iframe重复刷屏');

    a.标记数据库时间线将变更(9, '重掷回合');
    const second = watch(a.等待数据库时间线就绪(3500));
    await w.time.advance(4000);
    assert.equal(second.settled, true);
    assert.equal(second.value, false);
    assert.equal(警告数(), 2, '新的恢复令牌仍应保留一次可见诊断');
    assert.equal(a.数据库时间线允许新写('dual-test'), false, '限频不能放宽数据库失败关闭栅栏');
  } finally { await w.close(); }
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
        a.标记数据库时间线将变更(4, '删除消息'); w.setFloor(4); const b = w.instance();
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
