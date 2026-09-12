/* eslint-disable import-x/no-nodejs-modules -- Real bridge instances and SQLite; host transport and time are isolated. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const points = require('../../src/人妻公寓/脚本/游戏逻辑/数据库恢复点.ts');
const branches = require('../../src/人妻公寓/脚本/游戏逻辑/手机/刷新恢复镜像.ts');
import lodash from 'lodash';
import * as ts from 'typescript';

const read = name => readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${name}.ts`, import.meta.url), 'utf8');
const sources = new Map();
function compile(file, names, environment = {}) {
  if (!sources.has(file)) sources.set(file, ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true));
  const ast = sources.get(file),
    declarations = new Map(),
    selected = new Set();
  for (const node of ast.statements) {
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name)
      declarations.set(node.name.text, node);
    if (ts.isVariableStatement(node))
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) declarations.set(d.name.text, node);
      }
  }
  function include(name) {
    if (Object.hasOwn(environment, name)) return;
    const node = declarations.get(name);
    if (!node || selected.has(node)) return;
    selected.add(node);
    function visit(n) {
      if (ts.isIdentifier(n)) include(n.text);
      ts.forEachChild(n, visit);
    }
    visit(node);
  }
  for (const name of names) {
    assert.ok(declarations.has(name), `${file}:${name}`);
    include(name);
  }
  const text = [...selected]
    .sort((a, b) => a.pos - b.pos)
    .map(n => n.getText(ast))
    .join('\n');
  const js = ts.transpileModule(`${text}\nmodule.exports={${names.join(',')}};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', ...Object.keys(environment), js)(
    module,
    module.exports,
    ...Object.values(environment),
  );
  return module.exports;
}
const flush = async () => {
  for (let n = 0; n < 24; n++) await Promise.resolve();
};
function clock() {
  let now = 10_000,
    seq = 0;
  const timers = new Map();
  return {
    Date: { now: () => now },
    setTimeout: (fn, ms) => {
      const id = ++seq;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimeout: id => timers.delete(id),
    async advance(ms) {
      const target = now + ms;
      await flush();
      for (;;) {
        const next = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!next) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].fn();
        await flush();
      }
      now = target;
      await flush();
    },
    clear: () => timers.clear(),
  };
}
function watch(promise) {
  const result = { settled: false, value: undefined };
  promise.then(value => {
    result.settled = true;
    result.value = value;
  });
  return result;
}
function world({ storageDenied = false, future = false } = {}) {
  const time = clock(),
    storage = new Map(),
    callbacks = new Set(),
    calls = [],
    instances = [],
    warnings = [];
  const host = {
    sessionStorage: {
      getItem: key => {
        if (storageDenied) throw Error('storage denied');
        return storage.get(key) ?? null;
      },
      setItem: (key, value) => {
        if (storageDenied) throw Error('storage denied');
        storage.set(key, value);
      },
    },
  };
  host.__RQP_DATABASE_TIMELINE_FENCE_V2__ = {
    待重建: {},
    已完成令牌: {},
    时间线清场待结算: {},
    恢复超时已提示: {},
    当前聊天标识: 'dual-test',
    进入当前聊天时间: 0,
  };
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE rq_events(row_id INTEGER PRIMARY KEY,floor_no INTEGER NOT NULL UNIQUE,time_text TEXT,location TEXT,participants TEXT,player_action TEXT,result_summary TEXT,event_code TEXT NOT NULL UNIQUE);
    CREATE TABLE rq_social_history(row_id INTEGER PRIMARY KEY,event_type TEXT,character_name TEXT,event_text TEXT,result TEXT,game_time TEXT,last_floor INTEGER,event_key TEXT UNIQUE,display_result TEXT);
    CREATE TABLE rq_character_memory(row_id INTEGER PRIMARY KEY,character_name TEXT,topic TEXT,memory_text TEXT,future_impact TEXT,last_time TEXT,last_floor INTEGER,confidence TEXT);
    CREATE TABLE rq_promises(row_id INTEGER PRIMARY KEY,title TEXT,related_characters TEXT,detail TEXT,status TEXT,last_progress TEXT,last_time TEXT,last_floor INTEGER);
    CREATE TABLE chronicle(row_id INTEGER PRIMARY KEY,code_index TEXT NOT NULL UNIQUE,time_span TEXT NOT NULL,summary TEXT NOT NULL,chronicle_text TEXT NOT NULL,key_dialogue TEXT);`);
  if (future) {
    db.prepare(
      `INSERT INTO rq_character_memory
      (character_name, topic, memory_text, future_impact, last_time, last_floor, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run('未来住户', '未来记忆', '未来分支数据', '不得提前放行', '第3天 晚上', 11, '高');
  }
  let chat = 'dual-test',
    auto = true,
    floor = 10,
    vars = {},
    locks = 0;
  const messages = Array.from({ length: 11 }, (_, i) => ({
    is_user: false,
    mes: 'message-' + i,
    extra: { _rqgy回合令牌: 'id-' + i },
  }));
  const definitions = [
    ['rq_events', 'RQ_剧情事件'],
    ['rq_character_memory', 'RQ_人物长期记忆'],
    ['rq_promises', 'RQ_承诺与伏笔'],
    ['rq_social_history', 'RQ_社交轨迹'],
    ['chronicle', '纪要表'],
  ];
  const display = key => (key === 'floor_no' ? '楼层' : key === 'last_floor' ? '最后楼层' : key);
  const physical = key => (key === '楼层' ? 'floor_no' : key === '最后楼层' ? 'last_floor' : key);
  const snapshot = () => ({
    mate: { type: 'chatSheets', version: 1 },
    ...Object.fromEntries(
      definitions.map(([sql, name], i) => {
        const columns = db
          .prepare('PRAGMA table_info(' + sql + ')')
          .all()
          .map(row => row.name);
        const rows = db.prepare('SELECT * FROM ' + sql + ' ORDER BY row_id').all();
        return [
          'sheet_' + i,
          { name, content: [columns.map(display), ...rows.map(row => columns.map(key => row[key]))], sourceData: {} },
        ];
      }),
    ),
  });
  const api = {
    importTableAsJson(text, options) {
      assert.equal(options.persist, true);
      const data = JSON.parse(text);
      let resolve, reject;
      const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
      const call = {
        kind: 'import',
        sql: '',
        params: [],
        settled: false,
        data,
        finish(mode = 'apply') {
          assert.equal(call.settled, false);
          call.settled = true;
          if (mode === 'reject') {
            reject(Error('import failed'));
            return;
          }
          if (mode === 'unconfirmed') {
            resolve(false);
            return;
          }
          db.exec('BEGIN');
          try {
            for (const [sql, name] of definitions) {
              const sheet = Object.values(data).find(value => value?.name === name);
              assert.ok(sheet);
              db.exec('DELETE FROM ' + sql);
              const columns = sheet.content[0].map(physical);
              const insert = db.prepare(
                'INSERT INTO ' + sql + ' (' + columns.join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')',
              );
              for (const row of sheet.content.slice(1)) insert.run(...row);
            }
            db.exec('COMMIT');
            if (mode === 'apply-throw') reject(Error('post-import failure'));
            else resolve(true);
          } catch (error) {
            db.exec('ROLLBACK');
            reject(error);
          }
        },
      };
      calls.push(call);
      if (auto) call.finish();
      return promise;
    },
    exportTableAsJson: snapshot,
    executeSqlQuery: (sql, params = []) => ({ rows: db.prepare(sql).all(...params) }),
    registerTableUpdateCallback: fn => callbacks.add(fn),
    unregisterTableUpdateCallback: fn => callbacks.delete(fn),
    executeSqlMutation(sql, params) {
      let resolve, reject;
      const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
      const call = {
        sql,
        params: [...params],
        settled: false,
        finish(mode = 'apply') {
          assert.equal(call.settled, false);
          call.settled = true;
          if (mode === 'reject') {
            reject(Error('pre-commit failure'));
            return;
          }
          if (mode === 'unconfirmed') {
            resolve({ changes: 0, errors: [], saved: false });
            return;
          }
          try {
            const changes = Number(db.prepare(sql).run(...params).changes);
            if (mode === 'apply-throw') reject(Error('post-commit failure'));
            else resolve({ changes, errors: [], saved: true });
          } catch (error) {
            reject(error);
          }
        },
      };
      calls.push(call);
      if (auto) call.finish();
      return promise;
    },
  };
  const deps = {
    ...points,
    ...branches,
    ...compile('数据库时间线栅栏', ['数据库快照未越过楼层', '数据库时间线栅栏', '数据库异步写栅栏'], {
      Date: time.Date,
    }),
    ...compile('数据库时间线接线所有权', ['接管数据库时间线接线']),
    ...compile('胶囊预算', ['胶囊预算选择']),
    ...compile('记忆文本规范', ['规范可读文本', '折叠检测文本']),
  };
  function instance() {
    const window = { parent: host, addEventListener() {}, removeEventListener() {} },
      bus = new Map();
    const bridge = compile(
      '数据库桥',
      [
        '等待数据库时间线就绪',
        '启动数据库时间线恢复',
        '执行数据库时间线恢复',
        '标记数据库时间线将变更',
        '接入宿主时间线事件',
        '清理数据库时间线接线',
        '数据库刷新完成回调',
        '读取持久时间线状态',
        '数据库时间线允许新写',
        '数据库异步写',
        '数据库未补偿迟到写',
        '时间线恢复任务',
        '时间线栅栏',
        '保存当前数据库恢复点',
        '更新时间线驻留与恢复',
        '数据库恢复分支',
        '同步数据库回合',
        '同步社交轨迹',
        '读取数据库记忆胶囊',
      ],
      {
        ...deps,
        ...time,
        _: lodash,
        window,
        SillyTavern: {
          get chat() {
            return messages;
          },
        },
        getVariables: () => vars,
        updateVariablesWith: fn => {
          vars = fn(vars);
          return Promise.resolve(vars);
        },
        取得数据库恢复交互锁: () => {
          locks++;
          return () => {
            locks--;
          };
        },
        console: { info() {}, warn: (...args) => warnings.push(args.map(String).join(' ')), error() {} },
        宿主窗口: () => host,
        当前聊天标识: () => chat,
        仍是同一聊天: id => id === chat,
        当前末楼: () => floor,
        取数据库API: () => api,
        数据库状态: () => ({ 已装游戏模板: true, 社交结果说明可用: true }),
        探测数据库SQLite模式: async () => true,
        执行SQLite查询: (sql, params = []) => ({ rows: db.prepare(sql).all(...params) }),
        确保数据库手动填表选择安全: () => {},
        tavern_events: { MESSAGE_DELETED: 'deleted', MESSAGE_SWIPED: 'swiped', CHAT_CHANGED: 'changed' },
        eventOn: (name, fn) => {
          if (!bus.has(name)) bus.set(name, new Set());
          bus.get(name).add(fn);
          return { stop: () => bus.get(name).delete(fn) };
        },
      },
    );
    bridge.接入宿主时间线事件();
    bridge.emit = (name, ...args) => {
      for (const fn of [...(bus.get(name) ?? [])]) fn(...args);
    };
    bridge.window = window;
    instances.push(bridge);
    return bridge;
  }
  const event = (bridge, floor = 2, valid = () => true) =>
    bridge.同步数据库回合(
      {
        楼层: floor,
        时间: '第1天 下午',
        地点: '公寓大厅',
        参与者: ['测试住户'],
        玩家行动: '继续测试',
        结果摘要: '新时间线的剧情事件已经写入。',
      },
      valid,
    );
  const social = (bridge, text, floor = 4, valid = () => true) =>
    bridge.同步社交轨迹(
      {
        类型: '赠礼',
        人物: '测试住户',
        事件: '交付设备',
        结果: text,
        时间: '第2天 早上',
        楼层: floor,
        事件键: 'dual-event',
      },
      valid,
    );
  const seedScriptRows = (seedFloor, suffix = `branch-${seedFloor}`) => {
    db.prepare(
      `INSERT INTO rq_events
      (floor_no, time_text, location, participants, player_action, result_summary, event_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(seedFloor, '分支时间', '分支场景', '分支住户', '分支行动', `${suffix}剧情`, `${suffix}-event`);
    db.prepare(
      `INSERT INTO rq_social_history
      (event_type, character_name, event_text, result, game_time, last_floor, event_key, display_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('赠礼', '分支住户', '分支事件', `${suffix}社交`, '分支时间', seedFloor, `${suffix}-social`, `${suffix}社交`);
  };
  const seedResetRows = (seedFloor = 9) => {
    db.prepare(
      `INSERT INTO rq_events
      (floor_no, time_text, location, participants, player_action, result_summary, event_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(seedFloor, '旧时间', '旧场景', '旧住户', '旧行动', '旧分支剧情事件', `RQ-${seedFloor}`);
    db.prepare(
      `INSERT INTO rq_character_memory
      (character_name, topic, memory_text, future_impact, last_time, last_floor, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run('旧住户', '旧局记忆', '上一局的长期记忆', '新局不得继承', '旧时间', seedFloor, '明确');
    db.prepare(
      `INSERT INTO rq_promises
      (title, related_characters, detail, status, last_progress, last_time, last_floor)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run('旧局承诺', '旧住户', '上一局尚未完成的事项', '待处理', '旧进展', '旧时间', seedFloor);
    db.prepare(
      `INSERT INTO rq_social_history
      (event_type, character_name, event_text, result, game_time, last_floor, event_key, display_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run('赠礼', '旧住户', '旧事件', '旧分支社交轨迹', '旧时间', seedFloor, `old-${seedFloor}`, '旧分支社交轨迹');
    db.prepare(
      `INSERT INTO chronicle
      (code_index, time_span, summary, chronicle_text, key_dialogue)
      VALUES (?, ?, ?, ?, ?)`,
    ).run('AM0001', '旧时间', '旧局纪要', '上一局的剧情纪要。', null);
  };
  return {
    time,
    calls,
    callbacks,
    warnings,
    instance,
    event,
    social,
    snapshot,
    seedResetRows,
    seedScriptRows,
    api,
    get vars() {
      return vars;
    },
    set vars(v) {
      vars = v;
    },
    locks: () => locks,
    messages: () => messages,
    clearDataView: () => {
      for (const [sql] of definitions) db.exec('DELETE FROM ' + sql);
    },
    changeMemory: (text, lastFloor) =>
      db.prepare('UPDATE rq_character_memory SET memory_text=?, last_floor=?').run(text, lastFloor),
    auto: value => {
      auto = value;
    },
    setChat: value => {
      chat = value;
    },
    setFloor: value => {
      floor = value;
      while (messages.length <= value)
        messages.push({
          is_user: false,
          mes: 'new-' + messages.length,
          extra: { _rqgy回合令牌: 'new-' + messages.length },
        });
      messages.length = value + 1;
    },
    eventRows: () => db.prepare('SELECT * FROM rq_events ORDER BY floor_no').all(),
    memoryRows: () => db.prepare('SELECT * FROM rq_character_memory ORDER BY row_id').all(),
    promiseRows: () => db.prepare('SELECT * FROM rq_promises ORDER BY row_id').all(),
    socialRows: () => db.prepare('SELECT * FROM rq_social_history ORDER BY last_floor').all(),
    chronicleRows: () => db.prepare('SELECT * FROM chronicle ORDER BY row_id').all(),
    row: () => db.prepare('SELECT * FROM rq_social_history WHERE event_key=?').get('dual-event'),
    notify: () => {
      for (const fn of [...callbacks]) fn(snapshot());
    },
    async close() {
      for (const b of instances) b.清理数据库时间线接线();
      auto = true;
      for (const call of calls) if (!call.settled) call.finish('reject');
      await flush();
      time.clear();
      db.close();
    },
  };
}

test('仅用官方导入接口恢复目标楼层全部记忆和被覆盖值，后续流水消失', async () => {
  const w = world(),
    b = w.instance();
  try {
    w.setFloor(4);
    w.seedResetRows(4);
    assert.equal(await b.保存当前数据库恢复点(), true);
    const expected = w.snapshot();
    w.setFloor(8);
    w.seedScriptRows(8);
    w.changeMemory('未来分支的新值', 8);
    assert.equal(await b.保存当前数据库恢复点(), true);
    b.标记数据库时间线将变更(4, '回档至4楼');
    w.setFloor(4);
    const restored = watch(b.等待数据库时间线就绪(5000));
    await w.time.advance(4500);
    assert.equal(restored.value, true, w.warnings.join('\n'));
    assert.deepEqual(w.snapshot(), expected);
    assert.equal(w.calls.filter(c => c.kind === 'import').length, 1);
    assert.equal(w.calls.filter(c => c.sql.startsWith('DELETE')).length, 0);
    assert.equal(w.vars._rqgy数据库恢复点.点.at(-1).楼层, 4);
    assert.equal(w.locks(), 0);
  } finally {
    await w.close();
  }
});

for (const version of [0, 1]) {
  test(`同楼版本${version}：完整回档与正文重掷按持久恢复锚选择业务前后状态`, async () => {
    const w = world(),
      b = w.instance();
    try {
      w.setFloor(4);
      w.seedResetRows(4);
      await b.保存当前数据库恢复点();
      const first = w.snapshot(),
        firstRef = w.vars._rqgy数据库恢复锚;
      w.changeMemory('送礼后的记忆', 4);
      await b.保存当前数据库恢复点();
      const second = w.snapshot(),
        secondRef = w.vars._rqgy数据库恢复锚;
      assert.notEqual(firstRef, secondRef);
      w.setFloor(8);
      w.seedScriptRows(8);
      const reference = version === 0 ? firstRef : secondRef;
      b.标记数据库时间线将变更(4, '重掷回合', { 恢复点: reference });
      assert.equal(JSON.parse(JSON.stringify(b.读取持久时间线状态('dual-test'))).恢复点, reference);
      w.setFloor(4);
      const result = watch(b.等待数据库时间线就绪(5000));
      await w.time.advance(4500);
      assert.equal(result.value, true, w.warnings.join('\n'));
      assert.deepEqual(w.snapshot(), version === 0 ? first : second);
    } finally {
      await w.close();
    }
  });
}

for (const persistedEdit of [false, true]) {
  test(`同楼空表回调/persistedEdit=${persistedEdit}：拦截迟到回放，同时保留玩家正式编辑`, async () => {
    const w = world(),
      b = w.instance();
    try {
      w.setFloor(4);
      w.seedResetRows(4);
      await b.保存当前数据库恢复点();
      b.更新时间线驻留与恢复();
      const expected = w.snapshot();
      if (persistedEdit) w.messages()[4].TavernDB_ACU_IsolatedData = { revision: 1 };
      w.clearDataView();
      w.notify();
      await flush();
      if (persistedEdit) {
        assert.equal(b.数据库时间线允许新写('dual-test'), true);
        assert.equal(w.calls.length, 0);
        assert.deepEqual(w.memoryRows(), []);
        assert.equal(w.vars._rqgy数据库恢复点.点.length, 2, w.warnings.join('\n'));
      } else {
        assert.equal(b.数据库时间线允许新写('dual-test'), false);
        const result = watch(b.等待数据库时间线就绪(5000));
        await w.time.advance(4500);
        assert.equal(result.value, true, w.warnings.join('\n'));
        assert.deepEqual(w.snapshot(), expected);
      }
    } finally {
      await w.close();
    }
  });
}

test('旧档首次接入只记录当前楼，缺少更早恢复点时不伪造历史或清空记忆', async () => {
  const w = world(),
    b = w.instance();
  try {
    w.seedResetRows(9);
    assert.equal(await b.保存当前数据库恢复点(), true);
    b.标记数据库时间线将变更(4, '回档至4楼');
    w.setFloor(4);
    const result = watch(b.等待数据库时间线就绪(3500));
    await w.time.advance(4000);
    assert.equal(result.value, false);
    assert.equal(w.calls.length, 0);
    assert.equal(w.memoryRows().length, 1);
  } finally {
    await w.close();
  }
});

test('官方快照导入挂起时跨实例只发一笔，超时不重复导入或提前开放写入', async () => {
  const w = world(),
    a = w.instance(),
    b = w.instance();
  try {
    w.setFloor(4);
    w.seedResetRows(4);
    await a.保存当前数据库恢复点();
    w.setFloor(8);
    w.seedScriptRows(8);
    w.auto(false);
    a.标记数据库时间线将变更(4, '回档至4楼');
    w.setFloor(4);
    const waits = [watch(a.等待数据库时间线就绪(3500)), watch(b.等待数据库时间线就绪(3500))];
    await w.time.advance(4000);
    assert.equal(w.calls.length, 1);
    assert.equal(w.locks(), 1);
    assert.ok(waits.every(r => r.value === false));
    assert.equal(a.数据库时间线允许新写('dual-test'), false);
    w.calls[0].finish();
    await flush();
    const retry = watch(b.等待数据库时间线就绪(3500));
    await w.time.advance(2500);
    assert.equal(retry.value, true, w.warnings.join('\n'));
    assert.equal(w.calls.length, 1);
    assert.equal(w.locks(), 0);
  } finally {
    await w.close();
  }
});

test('同楼切分支恢复严格早于该楼的点，原分支记忆不会进入新分支', async () => {
  const w = world(),
    b = w.instance();
  try {
    w.setFloor(2);
    w.seedResetRows(2);
    await b.保存当前数据库恢复点();
    const expected = w.snapshot();
    w.setFloor(4);
    w.seedScriptRows(4);
    w.changeMemory('旧swipe记忆', 4);
    await b.保存当前数据库恢复点();
    w.messages()[4].swipe_id = 1;
    b.emit('swiped', 4);
    const result = watch(b.等待数据库时间线就绪(5000));
    await w.time.advance(1500);
    w.notify();
    await w.time.advance(1800);
    assert.equal(result.value, true, w.warnings.join('\n'));
    assert.deepEqual(w.snapshot(), expected);
  } finally {
    await w.close();
  }
});

test('导入失败保留恢复点与原库，下一次成功重试不会重复叠加行', async () => {
  const w = world(),
    b = w.instance();
  try {
    w.setFloor(4);
    w.seedResetRows(4);
    await b.保存当前数据库恢复点();
    w.setFloor(8);
    w.seedScriptRows(8);
    const before = w.snapshot();
    w.auto(false);
    b.标记数据库时间线将变更(4, '回档至4楼');
    w.setFloor(4);
    const result = watch(b.等待数据库时间线就绪(6000));
    await w.time.advance(300);
    w.calls[0].finish('reject');
    await flush();
    assert.deepEqual(w.snapshot(), before);
    assert.equal(w.vars._rqgy数据库恢复点.点.length, 1);
    w.auto(true);
    await w.time.advance(4500);
    assert.equal(result.value, true, w.warnings.join('\n'));
    assert.deepEqual(
      w.eventRows().map(r => r.floor_no),
      [4],
    );
    assert.equal(w.locks(), 0);
  } finally {
    await w.close();
  }
});

test('恢复成功后官方迟到回放再次带入未来楼层时，用保留恢复点重新对齐', async () => {
  const w = world(),
    b = w.instance();
  try {
    w.setFloor(4);
    w.seedResetRows(4);
    await b.保存当前数据库恢复点();
    const expected = w.snapshot();
    w.setFloor(8);
    w.seedScriptRows(8);
    b.标记数据库时间线将变更(4, '回档至4楼');
    w.setFloor(4);
    const first = watch(b.等待数据库时间线就绪(5000));
    await w.time.advance(4500);
    assert.equal(first.value, true);
    w.seedScriptRows(8, 'late-replay');
    w.notify();
    assert.equal(b.数据库时间线允许新写('dual-test'), false);
    const second = watch(b.等待数据库时间线就绪(5000));
    await w.time.advance(4500);
    assert.equal(second.value, true);
    assert.deepEqual(w.snapshot(), expected);
  } finally {
    await w.close();
  }
});

test('刷新重载保持聊天恢复记录；无持久栅栏时能识别已经删掉的未来消息', async () => {
  const w = world(),
    a = w.instance();
  try {
    w.setFloor(4);
    w.seedResetRows(4);
    await a.保存当前数据库恢复点();
    const expected = w.snapshot();
    w.setFloor(8);
    w.seedScriptRows(8);
    await a.保存当前数据库恢复点();
    w.vars = JSON.parse(JSON.stringify(w.vars));
    w.setFloor(4);
    a.清理数据库时间线接线();
    const b = w.instance();
    b.更新时间线驻留与恢复();
    const result = watch(b.等待数据库时间线就绪(5000));
    await w.time.advance(4500);
    assert.equal(result.value, true);
    assert.deepEqual(w.snapshot(), expected);
  } finally {
    await w.close();
  }
});

for (const mode of ['full', 'log', 'multiple']) {
  test(`旧档官方帧/${mode}：只恢复单一作用域的完整快照，日志交回官方回放`, async () => {
    const w = world(),
      b = w.instance();
    try {
      w.setFloor(4);
      w.seedResetRows(4);
      const expected = w.snapshot();
      const frame = { storageFrame: { version: 2, checkpoint: { kind: 'full', data: expected }, logEntries: [] } };
      if (mode === 'log') frame.storageFrame.logEntries.push({ kind: 'data_replace' });
      w.messages()[4].TavernDB_ACU_IsolatedData = {
        scope: frame,
        ...(mode === 'multiple' ? { another: { storageFrame: { version: 2, logEntries: [{}] } } } : {}),
      };
      w.setFloor(8);
      w.seedScriptRows(8);
      w.changeMemory('未来值', 8);
      b.标记数据库时间线将变更(4, '回档至4楼');
      w.setFloor(4);
      const result = watch(b.等待数据库时间线就绪(5000));
      await w.time.advance(5500);
      assert.equal(result.value, mode === 'full', w.warnings.join('\n'));
      assert.equal(w.calls.length, mode === 'full' ? 1 : 0);
      if (mode === 'full') assert.deepEqual(w.snapshot(), expected);
      else assert.equal(w.memoryRows()[0].memory_text, '未来值');
    } finally {
      await w.close();
    }
  });
}

for (const changedSource of [false, true]) {
  test(`异步备份/sourceChanged=${changedSource}：立即复制回调值，等待写入时不跨来源记录`, async () => {
    const w = world(),
      b = w.instance();
    let finish;
    try {
      w.setFloor(4);
      w.seedResetRows(4);
      const raw = w.snapshot(),
        expected = structuredClone(raw);
      const pending = new Promise(resolve => {
        finish = resolve;
      });
      b.数据库异步写.登记(b.数据库异步写.捕获('dual-test'), pending);
      const saved = b.保存当前数据库恢复点(raw);
      raw.sheet_1.content[1][3] = '回调对象随后被插件修改';
      if (changedSource) w.messages()[4].TavernDB_ACU_IsolatedData = { revision: 2 };
      finish();
      assert.equal(await saved, !changedSource);
      if (changedSource) assert.equal(w.vars._rqgy数据库恢复点, undefined);
      else
        assert.deepEqual(
          points.选择数据库恢复点(w.vars._rqgy数据库恢复点, 'dual-test', 4, b.数据库恢复分支).数据,
          expected,
        );
    } finally {
      finish?.();
      await w.close();
    }
  });
}

test('运行态通知不保存恢复点，临时回合楼和刚切入聊天也不保存', async () => {
  const w = world(),
    b = w.instance();
  try {
    b.更新时间线驻留与恢复();
    assert.equal(w.callbacks.size, 1);
    for (const callback of w.callbacks) callback(w.snapshot(), { persisted: false });
    await flush();
    assert.equal(w.vars._rqgy数据库恢复点, undefined);
    w.messages()[10].extra._rqgy回合临时 = true;
    assert.equal(await b.保存当前数据库恢复点(), false);
    w.messages()[10].extra._rqgy回合临时 = false;
    w.setChat('new-chat');
    assert.equal(await b.保存当前数据库恢复点(), false);
  } finally {
    await w.close();
  }
});

test('跨窗口内部删楼已由操作级栅栏覆盖时，不得重标成玩家删除消息', async () => {
  const w = world(),
    game = w.instance(),
    client = w.instance();
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
  } finally {
    await w.close();
  }
});

test('同一宿主事件的多实例重复标记只在短窗口内合并，之后同楼真实操作仍会换新令牌', async () => {
  const w = world(),
    game = w.instance(),
    client = w.instance();
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
  } finally {
    await w.close();
  }
});

test('精确 swipe 栅栏不会被稍后回合引擎兜底扩大到当前末楼', async () => {
  const w = world(),
    bridge = w.instance(),
    engineFallback = w.instance();
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
  } finally {
    await w.close();
  }
});

test('真实原生删除没有既有覆盖时仍建立删除栅栏，更低末楼会收窄既有栅栏', async () => {
  const w = world(),
    game = w.instance(),
    client = w.instance();
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
  } finally {
    await w.close();
  }
});

test('重开到0会清空上一局五张数据库记忆表，再恢复剧情与社交写入', async () => {
  const w = world(),
    game = w.instance(),
    client = w.instance();
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

    assert.ok(
      results.every(result => result.value === true),
      '上一局数据库记忆不得把新局永久锁在恢复态',
    );
    for (const rows of [w.eventRows(), w.memoryRows(), w.promiseRows(), w.socialRows(), w.chronicleRows()]) {
      assert.deepEqual(rows, []);
    }
    assert.equal(await w.event(game, 2), '已确认');
    assert.equal(await w.social(game, '新局社交轨迹。', 2), '已确认');
    assert.equal(w.eventRows().at(-1)?.result_summary, '新时间线的剧情事件已经写入。');
    assert.equal(w.socialRows().at(-1)?.result, '新局社交轨迹。');
  } finally {
    await w.close();
  }
});

for (const stage of ['first', 'retry']) {
  for (const reason of ['删除消息', '切换消息分支']) {
    test(`${stage}/${reason}: shared recovery completion does not release an instance with old SQL`, async () => {
      const w = world(),
        a = w.instance(),
        b = w.instance();
      try {
        assert.equal(await w.social(a, '原有设备记录。'), '已确认');
        const before = { ...w.row() };
        w.auto(false);
        const index = w.calls.length,
          old = w.social(a, '旧设备记录。', 10);
        await flush();
        if (stage === 'retry') {
          await w.time.advance(6000);
          assert.equal(await old, '待确认');
          w.calls[index].finish('reject');
          await flush();
        }
        const late = w.calls.at(-1);
        a.标记数据库时间线将变更(10, reason);
        b.标记数据库时间线将变更(10, reason);
        const waited = watch(a.等待数据库时间线就绪(3500)),
          other = watch(b.等待数据库时间线就绪(3500));
        await w.time.advance(1100);
        w.notify();
        await w.time.advance(500);
        assert.equal(other.value, true);
        assert.equal(b.读取持久时间线状态('dual-test'), null);
        assert.equal(a.数据库异步写.有已作废写入('dual-test'), true);
        assert.notEqual(waited.value, true, 'Shared record removal is not local write completion');
        assert.equal(await a.启动数据库时间线恢复('dual-test', 0), false);
        assert.equal(await a.等待数据库时间线就绪(0), false);
        assert.equal(a.读取数据库记忆胶囊(['测试住户'], 10), '');
        const count = w.calls.length;
        assert.equal(await w.social(a, '新设备记录。'), '失败');
        assert.equal(w.calls.length, count);
        late.finish('apply-throw');
        await flush();
        assert.equal(w.calls.length, count + 1);
        assert.notEqual(waited.value, true);
        w.calls[count].finish();
        await flush();
        await w.time.advance(200);
        assert.equal(waited.value, true);
        assert.deepEqual({ ...w.row() }, before);
        if (stage === 'first') assert.equal(await old, '失败');
        w.auto(true);
        assert.equal(await w.social(a, '新设备记录。'), '已确认');
        assert.match(a.读取数据库记忆胶囊(['测试住户'], 10), /新设备记录/);
        assert.equal(w.row().result, '新设备记录。');
      } finally {
        await w.close();
      }
    });
  }
}
for (const failure of ['unfinished', 'compensation-failed']) {
  test(`${failure}: bounded wait stays false after another instance removes shared state`, async () => {
    const w = world(),
      a = w.instance(),
      b = w.instance();
    try {
      await w.social(a, '原有设备记录。');
      w.auto(false);
      const old = w.social(a, '旧设备记录。');
      await flush();
      a.标记数据库时间线将变更(10, '删除消息');
      b.标记数据库时间线将变更(10, '删除消息');
      const result = watch(a.等待数据库时间线就绪(3500));
      void b.等待数据库时间线就绪(3500);
      await w.time.advance(1100);
      w.notify();
      await w.time.advance(500);
      if (failure === 'compensation-failed') {
        w.calls.at(-1).finish();
        await flush();
        w.calls.at(-1).finish('reject');
        await flush();
      }
      await w.time.advance(3200);
      assert.equal(result.settled, true);
      assert.equal(result.value, false);
      assert.equal(await a.等待数据库时间线就绪(0), false);
      assert.equal(a.数据库时间线允许新写('dual-test'), false);
      if (failure === 'compensation-failed') {
        assert.equal(await old, '失败');
        assert.equal(a.数据库未补偿迟到写.has('dual-test'), true);
      }
    } finally {
      await w.close();
    }
  });
}
for (const count of [1, 2]) {
  for (const storageDenied of [false, true]) {
    test(`${count} instances/storageDenied=${storageDenied}: normal recovery still opens`, async () => {
      const w = world({ storageDenied }),
        bridges = Array.from({ length: count }, () => w.instance());
      try {
        for (const b of bridges) b.标记数据库时间线将变更(10, '删除消息');
        const results = bridges.map(b => watch(b.等待数据库时间线就绪(3500)));
        await w.time.advance(3000);
        assert.ok(results.every(r => r.value === true));
        for (const b of bridges) assert.equal(b.数据库时间线允许新写('dual-test'), true);
      } finally {
        await w.close();
      }
    });
  }
}
test('Future snapshot and swipe without a trusted callback do not open either instance', async () => {
  for (const future of [false, true]) {
    const w = world({ future }),
      a = w.instance(),
      b = w.instance();
    try {
      a.标记数据库时间线将变更(10, future ? '删除消息' : '切换消息分支');
      b.标记数据库时间线将变更(10, future ? '删除消息' : '切换消息分支');
      const results = [watch(a.等待数据库时间线就绪(3500)), watch(b.等待数据库时间线就绪(3500))];
      await w.time.advance(4000);
      assert.ok(results.every(r => r.value === false));
      assert.equal(a.数据库时间线允许新写('dual-test'), false);
      assert.equal(w.calls.length, 0, '普通回档或 swipe 不得借重开清场逻辑删除任何数据库行');
      if (future) assert.equal(w.memoryRows().length, 1, '普通回档中的未来长期记忆应等待插件恢复，而不是被脚本清空');
    } finally {
      await w.close();
    }
  }
});

test('同一聊天同一恢复令牌由多个观察者等待时只打印一次超时；新令牌仍可提示一次', async () => {
  const w = world({ future: true }),
    a = w.instance(),
    b = w.instance();
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
  } finally {
    await w.close();
  }
});

for (const change of ['chat', 'unload', 'new-token', 'ABA', 'new-token-completed']) {
  test(`${change}: a late successful recovery promise cannot grant current readiness`, async () => {
    const w = world(),
      a = w.instance();
    try {
      a.标记数据库时间线将变更(10, '删除消息');
      const token = a.读取持久时间线状态('dual-test').令牌;
      let resolve;
      const pending = new Promise(yes => {
        resolve = yes;
      });
      // Explicit seam for the await boundary: the real public function consumes this in-flight task.
      a.时间线恢复任务.set('dual-test', { 令牌: token, promise: pending });
      const result = watch(a.等待数据库时间线就绪(3500));
      await flush();
      if (change === 'chat') w.setChat('B');
      if (change === 'unload') a.清理数据库时间线接线();
      if (change === 'new-token') a.标记数据库时间线将变更(4, '删除消息');
      if (change === 'ABA') {
        w.setChat('B');
        a.emit('changed');
        w.setChat('dual-test');
        a.标记数据库时间线将变更(4, '切换消息分支');
      }
      if (change === 'new-token-completed') {
        a.标记数据库时间线将变更(4, '删除消息');
        w.setFloor(4);
        const b = w.instance();
        const newer = watch(b.等待数据库时间线就绪(3500));
        await w.time.advance(3000);
        assert.equal(newer.value, true);
        assert.equal(a.数据库时间线允许新写('dual-test'), true);
      }
      resolve(true);
      await flush();
      assert.equal(result.value, false);
    } finally {
      await w.close();
    }
  });
}
test('Single-instance pending write times out closed and recovers after real compensation', async () => {
  const w = world(),
    a = w.instance();
  try {
    await w.social(a, '原有设备记录。');
    w.auto(false);
    const old = w.social(a, '旧设备记录。');
    await flush();
    a.标记数据库时间线将变更(10, '删除消息');
    const result = watch(a.等待数据库时间线就绪(3500));
    await w.time.advance(3600);
    assert.equal(result.value, false);
    assert.ok(a.读取持久时间线状态('dual-test'));
    w.calls.at(-1).finish();
    await flush();
    w.calls.at(-1).finish();
    await flush();
    assert.equal(await old, '失败');
    const recovered = watch(a.等待数据库时间线就绪(3500));
    await w.time.advance(800);
    assert.equal(recovered.value, true);
    assert.equal(w.row().result, '原有设备记录。');
  } finally {
    await w.close();
  }
});
test('A cancelled request without shared recovery blocks only its own instance until compensation', async () => {
  const w = world(),
    a = w.instance(),
    b = w.instance();
  let valid = true;
  try {
    await w.social(a, '原有设备记录。');
    w.auto(false);
    const old = w.social(a, '旧设备记录。', 10, () => valid);
    await flush();
    valid = false;
    assert.equal(await a.等待数据库时间线就绪(0), false);
    assert.equal(await b.等待数据库时间线就绪(0), true);
    w.calls.at(-1).finish();
    await flush();
    w.calls.at(-1).finish();
    await flush();
    assert.equal(await old, '失败');
    assert.equal(await a.等待数据库时间线就绪(0), true);
    assert.equal(w.row().result, '原有设备记录。');
  } finally {
    await w.close();
  }
});
test('Independent window unload preserves the other listener and reload retains pending recovery', async () => {
  const w = world(),
    a = w.instance(),
    b = w.instance();
  try {
    a.标记数据库时间线将变更(10, '删除消息');
    b.标记数据库时间线将变更(10, '删除消息');
    assert.equal(w.callbacks.size, 2);
    a.清理数据库时间线接线();
    assert.equal(w.callbacks.size, 1, '卸载只移除当前实例实际注册的包装回调');
    const c = w.instance();
    assert.ok(c.读取持久时间线状态('dual-test'));
    b.emit('deleted');
    assert.ok(b.读取持久时间线状态('dual-test'));
    const result = watch(c.等待数据库时间线就绪(3500));
    await w.time.advance(3000);
    assert.equal(result.value, true);
    assert.equal(await a.等待数据库时间线就绪(0), false);
  } finally {
    await w.close();
  }
});
