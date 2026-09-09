/* eslint-disable import-x/no-nodejs-modules -- Actual bridge functions with controlled host transport and SQLite */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const _ = require('lodash');
const hostWindow = { document: {}, addEventListener() {}, removeEventListener() {} };
hostWindow.parent = hostWindow;
globalThis.window = hostWindow;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const { 按列名迁移游戏表 } = require('../../src/人妻公寓/脚本/游戏逻辑/数据库表格迁移.ts');
const 文本规范 = require('../../src/人妻公寓/脚本/游戏逻辑/记忆文本规范.ts');
const 来源 = require('../../src/人妻公寓/脚本/游戏逻辑/微信摘要来源.ts');
const { 胶囊预算选择 } = require('../../src/人妻公寓/脚本/游戏逻辑/胶囊预算.ts');
const { 数据库异步写栅栏, 数据库时间线栅栏 } = require('../../src/人妻公寓/脚本/游戏逻辑/数据库时间线栅栏.ts');
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', import.meta.url), 'utf8');
const templateText = readFileSync(new URL('../../src/人妻公寓/人妻公寓数据库模板.json', import.meta.url), 'utf8');
const template = JSON.parse(templateText);
const ast = ts.createSourceFile('bridge.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const declarations = new Map();
for (const node of ast.statements) {
  if (ts.isFunctionDeclaration(node) && node.name) declarations.set(node.name.text, node);
  if (ts.isVariableStatement(node))
    for (const entry of node.declarationList.declarations) {
      if (ts.isIdentifier(entry.name)) declarations.set(entry.name.text, node);
    }
}

function load(names, overrides = {}) {
  const env = { _, ...文本规范, ...来源, 按列名迁移游戏表, 胶囊预算选择, 数据库时间线栅栏, 数据库模板文本: templateText, ...overrides };
  const selected = new Set();
  function add(name) {
    if (Object.hasOwn(env, name)) return;
    const node = declarations.get(name);
    if (!node || selected.has(node)) return;
    selected.add(node);
    function visit(child) {
      if (ts.isIdentifier(child) && declarations.has(child.text)) add(child.text);
      ts.forEachChild(child, visit);
    }
    visit(node);
  }
  names.forEach(name => {
    assert.ok(declarations.has(name), name);
    add(name);
  });
  const text = [...selected]
    .sort((a, b) => a.pos - b.pos)
    .map(node => node.getText(ast))
    .join('\n');
  const js = ts.transpileModule(`${text}\nmodule.exports={${names.join(',')}}`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(env), js)(module, module.exports, ...Object.values(env));
  return module.exports;
}

async function installFixture(mutate, mutateRuntime) {
  const current = structuredClone(template);
  current.sheet_rq_character_memory.content.push([
    7,
    '住户',
    '雨伞',
    '周五取回雨伞。',
    '下次归还。',
    '第1天 下午',
    3,
    '明确',
  ]);
  current.sheet_other = {
    name: '作者自定义笔记',
    content: [
      ['row_id', '内容'],
      [1, '已有资料'],
    ],
  };
  mutate?.(current);
  const before = structuredClone(current);
  let runtime = structuredClone(current);
  mutateRuntime?.(runtime);
  let captured = null;
  let importedData = null;
  const api = {
    getTableTemplate: () => structuredClone(current),
    exportTableAsJson: () => structuredClone(runtime),
    importTemplateFromData: async (data, options) => {
      captured = { data: structuredClone(data), options };
      runtime = structuredClone(data);
      // Both checked plugin versions reconcile existing rows: template values do not fill new columns,
      // and active columns do not inherit a newly requested hidden projection.
      if (before.sheet_rq_social_history.content.length > 1) {
        const sheet = runtime.sheet_rq_social_history;
        for (const row of sheet.content.slice(1)) row[8] = null;
        delete sheet.sourceData.hiddenPhysicalColumns;
      }
      return { success: true, runtimeReady: true };
    },
    importTableAsJson: async text => {
      importedData = JSON.parse(text);
      runtime = structuredClone(importedData);
      return true;
    },
  };
  const module = load(['安装人妻公寓数据库模板'], {
    取数据库API: () => api,
    当前聊天标识: () => 'owned-test',
    仍是同一聊天: () => true,
    确保数据库手动填表选择安全: () => true,
  });
  const result = await module.安装人妻公寓数据库模板();
  assert.deepEqual(current, before, 'Preparing an import does not modify its source');
  return { result, captured, importedData, runtime };
}

test('真实安装器按列名迁移重排数据，保留业务键和其他作者表', async () => {
  const { result, captured } = await installFixture(current => {
    for (const row of current.sheet_rq_character_memory.content) [row[1], row[2]] = [row[2], row[1]];
  });
  assert.equal(result.success, true);
  assert.deepEqual(captured.data.sheet_rq_character_memory.content[1], [
    7,
    '住户',
    '雨伞',
    '周五取回雨伞。',
    '下次归还。',
    '第1天 下午',
    3,
    '明确',
  ]);
  assert.deepEqual(captured.data.sheet_other.content[1], [1, '已有资料']);
  assert.equal(captured.options.scope, 'chat');
});

test('未知同名额外列与重复列名停止整次导入，纪要表同样不能丢作者列', async () => {
  for (const name of ['sheet_rq_character_memory', 'sheet_summary']) {
    const { result, captured } = await installFixture(current => {
      const sheet = current[name];
      sheet.content[0].push('作者来源');
      for (const row of sheet.content.slice(1)) row.push('必须保留');
    });
    assert.equal(result.success, false, name);
    assert.equal(captured, null, 'No replace payload may be submitted');
  }
  const duplicate = await installFixture(current => {
    current.sheet_rq_character_memory.content[0][2] = '人物';
  });
  assert.equal(duplicate.result.success, false);
  assert.equal(duplicate.captured, null);
});

test('运行态与模板表头不同时仍使用当前实值，无法对应的运行态列停止替换', async () => {
  const moved = await installFixture(null, runtime => {
    const sheet = runtime.sheet_rq_character_memory;
    sheet.content[1][3] = '周六取回雨伞。';
    for (const row of sheet.content) [row[1], row[2]] = [row[2], row[1]];
  });
  assert.equal(moved.result.success, true);
  assert.equal(moved.captured.data.sheet_rq_character_memory.content[1][3], '周六取回雨伞。');
  const unknown = await installFixture(null, runtime => {
    runtime.sheet_rq_character_memory.content[0].push('来源');
    runtime.sheet_rq_character_memory.content[1].push('必须保留');
  });
  assert.equal(unknown.result.success, false);
  assert.equal(unknown.captured, null);
});

test('仅存在于运行态的作者表保留；重复目标表名不能被Map覆盖而丢行', async () => {
  const extra = await installFixture(null, runtime => {
    runtime.sheet_runtime_only = { uid: 'sheet_runtime_only', name: '临时手记', content: [['row_id', '内容'], [4, '必须保留']] };
  });
  assert.equal(extra.result.success, true);
  assert.deepEqual(extra.captured.data.sheet_runtime_only.content, [['row_id', '内容'], [4, '必须保留']]);
  for (const runtimeOnly of [false, true]) {
    const duplicate = data => { data.sheet_duplicate_memory = structuredClone(data.sheet_rq_character_memory); };
    const result = await installFixture(runtimeOnly ? null : duplicate, runtimeOnly ? duplicate : null);
    assert.equal(result.result.success, false);
    assert.equal(result.captured, null);
  }
});

test('已知旧表头带无法归属的多余单元格也停止导入', async () => {
  for (const key of ['sheet_rq_social_history', 'sheet_summary']) {
    const { result, captured } = await installFixture(current => {
      const sheet = current[key];
      if (key === 'sheet_rq_social_history') sheet.content[0].pop();
      sheet.content.push([...sheet.content[0].map(() => ''), '未命名单元格']);
    });
    assert.equal(result.success, false, key);
    assert.equal(captured, null);
  }
});

const packet = { v: 1, f: ['[微信来源:s1]住户说过晚饭吃面。'], a: ['[微信来源:s2]约好带青菜。'], b: [], p: [] };

test('八列与九列模板均通过真实结构和脚本所有权判断，缺少DDL映射仍不可用', () => {
  const bridge = load(['表结构可用', '数据库表项受脚本所有权']);
  const expected = template.sheet_rq_social_history.content[0];
  for (const readable of [false, true]) {
    const sheet = structuredClone(template.sheet_rq_social_history);
    if (!readable) {
      sheet.content[0].pop();
      sheet.sourceData.ddl = sheet.sourceData.ddl.replace(
        ', -- 事件键\n  display_result TEXT -- 结果说明',
        ' -- 事件键',
      );
    }
    assert.equal(bridge.表结构可用(sheet, expected), true);
    assert.equal(bridge.数据库表项受脚本所有权({ 名称: sheet.name, 表: sheet }), true);
    sheet.sourceData.ddl = sheet.sourceData.ddl.replace('-- 游戏时间', '-- 错误映射');
    assert.equal(bridge.表结构可用(sheet, expected), false);
  }
});

test('真实安装器兼容无时间列、旧时间别名与基础纪要，所有原行和业务键保留', async () => {
  for (const legacyTime of [null, '时间']) {
    const { result, captured } = await installFixture(current => {
      const sheet = current.sheet_rq_social_history;
      sheet.content[0].pop();
      const row = [9, '微信进展', '夏乔', '沟通', JSON.stringify(packet), '第2天 早上', 3, 'RQP-old'];
      if (legacyTime) sheet.content[0][5] = legacyTime;
      else {
        sheet.content[0].splice(5, 1);
        row.splice(5, 1);
      }
      sheet.content.push(row);
      current.sheet_summary.content = [
        ['row_id', '时间跨度', '地点', '纪要', '概览', '编码索引'],
        [2, '第2天 早上', '门厅', '工具已取回。', '取回工具', 'AM0002'],
      ];
    });
    assert.equal(result.success, true);
    assert.equal(captured.data.sheet_rq_social_history.content[1][7], 'RQP-old');
    assert.equal(captured.data.sheet_rq_social_history.content[1][5], legacyTime ? '第2天 早上' : '');
    assert.equal(captured.data.sheet_rq_social_history.content[1][4], JSON.stringify(packet));
    assert.match(captured.data.sheet_rq_social_history.content[1][8], /带青菜/);
    assert.deepEqual(captured.data.sheet_summary.content[1], [
      2,
      'AM0002',
      '第2天 早上',
      '取回工具',
      '地点：门厅。工具已取回。',
      null,
    ]);
  }
});

test('旧八列社交记录升级后原协议逐字保留，可读说明去掉来源标记，只有技术列隐藏', async () => {
  const { result, captured, importedData, runtime } = await installFixture(current => {
    const sheet = current.sheet_rq_social_history;
    sheet.content[0].pop();
    sheet.content.push([
      9,
      '微信进展',
      '夏乔',
      '微信沟通',
      JSON.stringify(packet),
      '第1天 下午',
      3,
      'RQP-微信进展-101-test',
    ]);
  });
  assert.equal(result.success, true);
  const sheet = captured.data.sheet_rq_social_history;
  const row = sheet.content[1];
  assert.equal(row[0], 9);
  assert.equal(row[4], JSON.stringify(packet));
  assert.equal(row[7], 'RQP-微信进展-101-test');
  assert.match(row[8], /住户说过晚饭吃面.*约好带青菜/u);
  assert.doesNotMatch(row[8], /微信来源|"v"|"f"/u);
  assert.deepEqual(sheet.sourceData.hiddenPhysicalColumns, ['result', 'event_key']);
  assert.ok(importedData, 'Existing rows need the public persisted data-import path after schema reconciliation');
  assert.deepEqual(runtime.sheet_rq_social_history.content[1], row);
  assert.deepEqual(runtime.sheet_rq_social_history.sourceData.hiddenPhysicalColumns, ['result', 'event_key']);
});

function sqliteHost(db) {
  return {
    querySql(sql, params = []) {
      try {
        const statement = db.prepare(typeof sql === 'string' ? sql : sql.sql);
        const rows = statement.all(...params);
        return { columns: statement.columns().map(col => col.name), rows, rowCount: rows.length };
      } catch {
        return null;
      }
    },
  };
}

test('显示持久化失败、虚假成功与切聊不会被报成迁移完成，原快照不被就地修改', async () => {
  for (const mode of ['failure', 'stale', 'switch', 'success']) {
    let current = structuredClone(template);
    const sheet = current.sheet_rq_social_history;
    delete sheet.sourceData.hiddenPhysicalColumns;
    sheet.content.push([9, '微信进展', '夏乔', '沟通', JSON.stringify(packet), '第1天 下午', 3, 'RQP-display', null]);
    const original = structuredClone(current);
    let sameChat = true;
    let calls = 0;
    const api = {
      exportTableAsJson: () => current,
      importTableAsJson: async (text, options) => {
        calls++;
        assert.deepEqual(current, original);
        assert.deepEqual(options, { persist: true });
        if (mode === 'failure') return false;
        if (mode === 'switch') sameChat = false;
        if (mode === 'success') current = JSON.parse(text);
        return true;
      },
    };
    const bridge = load(['完成社交显示迁移'], { 取数据库API: () => api, 仍是同一聊天: () => sameChat });
    assert.equal(await bridge.完成社交显示迁移(api, 'owned-test'), mode === 'success', mode);
    assert.equal(calls, 1, 'No unbounded retries or second-chat writes');
    if (mode !== 'success') assert.deepEqual(current, original);
  }
});

test('局部缺表或无效查询不缓存成全库停用；真实探针失败仍保持负缓存并可显式恢复', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    let offline = false;
    let calls = 0;
    const base = sqliteHost(db);
    const api = {
      querySql: (...args) => {
        calls++;
        return offline ? null : base.querySql(...args);
      },
    };
    const bridge = load(['执行SQLite查询', '探测数据库SQLite模式', '刷新SQLite能力缓存'], { 取数据库API: () => api });
    assert.equal(await bridge.探测数据库SQLite模式(), true);
    assert.equal(bridge.执行SQLite查询('SELECT * FROM missing_table'), null);
    assert.equal(bridge.执行SQLite查询('SELECT 3 AS value').rows[0].value, 3);
    assert.equal(await bridge.探测数据库SQLite模式(), true);
    offline = true;
    bridge.刷新SQLite能力缓存();
    assert.equal(await bridge.探测数据库SQLite模式(), false);
    const before = calls;
    assert.equal(bridge.执行SQLite查询('SELECT 1 AS ok'), null);
    assert.equal(calls, before);
    offline = false;
    bridge.刷新SQLite能力缓存();
    assert.equal(await bridge.探测数据库SQLite模式(), true);
  } finally {
    db.close();
  }
});

test('新旧社交表均可写读，结果说明与原协议同次UPSERT，去重和撤回消费保持有效', async () => {
  for (const readable of [false, true]) {
    const db = new DatabaseSync(':memory:');
    try {
      let ddl = template.sheet_rq_social_history.sourceData.ddl;
      if (!readable) ddl = ddl.replace(', -- 事件键\n  display_result TEXT -- 结果说明', ' -- 事件键');
      db.exec(ddl);
      const api = sqliteHost(db);
      const bridge = load(['同步社交轨迹', '读取微信进展摘要', '读取微信进展胶囊'], {
        取数据库API: () => api,
        数据库状态: () => ({ 已装游戏模板: true, 社交结果说明可用: readable }),
        当前聊天标识: () => 'owned-test',
        仍是同一聊天: () => true,
        执行SQLite写入: async (sql, params, _chat, valid) => {
          if (!valid()) return '未调用';
          db.prepare(sql).run(...params);
          return '已确认';
        },
      });
      const entry = {
        类型: '微信进展',
        人物: '夏乔',
        事件: '沟通进展',
        结果: JSON.stringify(packet),
        时间: '第1天 下午',
        楼层: 3,
        事件键: 'RQP-微信进展-101-test',
      };
      assert.equal(await bridge.同步社交轨迹(entry), '已确认');
      assert.equal(await bridge.同步社交轨迹(entry), '已确认');
      assert.equal(db.prepare('SELECT count(*) AS n FROM rq_social_history').get().n, 1);
      const row = db.prepare('SELECT * FROM rq_social_history').get();
      assert.equal(row.result, JSON.stringify(packet));
      if (readable) assert.equal(row.display_result, '已确认：住户说过晚饭吃面。；双方约定：约好带青菜。');
      assert.deepEqual(JSON.parse(bridge.读取微信进展摘要('夏乔', [entry.事件键], 3).摘要), packet);
      const capsule = bridge.读取微信进展胶囊([{ 人物: '夏乔', 有效事件键: [entry.事件键], 撤回来源: ['s1'] }], 3);
      assert.doesNotMatch(capsule, /晚饭吃面|微信来源/u);
      assert.match(capsule, /带青菜/u);
      assert.equal(await bridge.同步社交轨迹({ ...entry, 事件键: 'RQP-微信进展-cancel' }, () => false), '失败');
      assert.equal(db.prepare('SELECT count(*) AS n FROM rq_social_history').get().n, 1);
    } finally {
      db.close();
    }
  }
});

test('同聊天取消后的迟到SQL真实补偿同时恢复原协议与结果说明；新插入则精确删除', async () => {
  for (const existing of [false, true]) {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(template.sheet_rq_social_history.sourceData.ddl);
      let valid = true;
      let defer = false;
      let release;
      let started;
      const called = new Promise(resolve => {
        started = resolve;
      });
      const api = {
        ...sqliteHost(db),
        executeSqlMutation: async (sql, params) => {
          const result = db.prepare(sql).run(...params);
          if (defer) {
            defer = false;
            started();
            await new Promise(resolve => {
              release = resolve;
            });
          }
          return { changes: Number(result.changes), saved: true, errors: [] };
        },
      };
      const bridge = load(['同步社交轨迹'], {
        取数据库API: () => api,
        数据库状态: () => ({ 已装游戏模板: true, 社交结果说明可用: true }),
        当前聊天标识: () => 'owned-test',
        仍是同一聊天: () => true,
        数据库时间线允许新写: () => true,
        确保数据库时间线回调: () => undefined,
        数据库未补偿迟到写: new Set(),
        数据库异步写: new 数据库异步写栅栏(),
      });
      const entry = {
        类型: '微信进展',
        人物: '夏乔',
        事件: '沟通',
        结果: JSON.stringify(packet),
        时间: '第1天 下午',
        楼层: 3,
        事件键: 'RQP-compensate',
      };
      if (existing) assert.equal(await bridge.同步社交轨迹(entry), '已确认');
      const before = db.prepare('SELECT * FROM rq_social_history').all();
      defer = true;
      const pending = bridge.同步社交轨迹(
        { ...entry, 结果: JSON.stringify({ ...packet, a: ['改约明天。'] }) },
        () => valid,
      );
      await called;
      valid = false;
      release();
      assert.equal(await pending, '失败');
      assert.deepEqual(db.prepare('SELECT * FROM rq_social_history').all(), before);
    } finally {
      db.close();
    }
  }
});
