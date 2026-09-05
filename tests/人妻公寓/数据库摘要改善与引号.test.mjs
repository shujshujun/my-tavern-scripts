/* eslint-disable import-x/no-nodejs-modules -- Actual summary and backfill functions with an explicit host transport fixture */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const _ = require('lodash');
const read = name => readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${name}.ts`, import.meta.url), 'utf8');
function compile(file, names, environment = {}) {
  const ast = ts.createSourceFile(`${file}.ts`, read(file), ts.ScriptTarget.Latest, true);
  const map = new Map();
  for (const node of ast.statements) {
    if (ts.isFunctionDeclaration(node) && node.name) map.set(node.name.text, node);
    if (ts.isVariableStatement(node))
      for (const d of node.declarationList.declarations) if (ts.isIdentifier(d.name)) map.set(d.name.text, node);
  }
  const nodes = new Set();
  function include(name) {
    if (Object.hasOwn(environment, name)) return;
    const node = map.get(name);
    if (!node || nodes.has(node)) return;
    nodes.add(node);
    function walk(n) {
      if (ts.isIdentifier(n) && map.has(n.text)) include(n.text);
      ts.forEachChild(n, walk);
    }
    walk(node);
  }
  names.forEach(include);
  const text = [...nodes]
    .sort((a, b) => a.pos - b.pos)
    .map(n => n.getText(ast))
    .join('\n');
  const js = ts.transpileModule(`${text}\nmodule.exports={${names.join(',')}}`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(environment), js)(module, module.exports, ...Object.values(environment));
  return module.exports;
}
const pure = compile('数据库桥', [
  '提取回合事件摘要',
  '规范事件摘要',
  '脚本保守回合摘要',
  '数据库事件摘要为脚本兜底',
  '数据库事件摘要待整理',
]);

test('物件名称引号保持同一份摘要，从机器块提取到落库规范化不降为兜底', () => {
  for (const quoted of ['“检修工具”', '「检修工具」', '『检修工具』', '"检修工具"']) {
    const summary = `管理员归还标着${quoted}的箱子，住户确认物品齐全。`;
    const result = pure.提取回合事件摘要(`双方核对后收好箱子。<rq_event_summary>${summary}</rq_event_summary>`);
    assert.equal(result, summary);
    assert.equal(pure.规范事件摘要(result, '归还箱子'), summary);
  }
});

test('明确的原句对白和正文包装在提取与落库两处都不冒充事件摘要', () => {
  for (const summary of [
    '住户说：“箱子里的东西全齐了。”',
    '住户：“请明天下午过来取箱子。”',
    '“我已经把东西准备好了。”',
  ]) {
    assert.equal(pure.提取回合事件摘要(`另一段正文。<rq_event_summary>${summary}</rq_event_summary>`), null);
    assert.equal(pure.数据库事件摘要为脚本兜底(pure.规范事件摘要(summary, '核对物品')), true);
  }
  assert.equal(pure.提取回合事件摘要('正文。<rq_event_summary><div>整段正文</div></rq_event_summary>'), null);
});

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(
    'CREATE TABLE rq_events (row_id INTEGER PRIMARY KEY, floor_no INTEGER NOT NULL UNIQUE, time_text TEXT, location TEXT, participants TEXT, player_action TEXT, result_summary TEXT, event_code TEXT NOT NULL UNIQUE)',
  );
  const host = { chat: [{ is_user: false, mes: '界面' }] };
  const writes = [];
  let fail = false;
  let afterWrite = () => {};
  const api = {};
  const environment = {
    _,
    取数据库API: () => api,
    数据库状态: () => ({ 已装游戏模板: true }),
    当前聊天标识: () => 'summary-test',
    仍是同一聊天: () => true,
    构造SQLite唯一行失效补偿: () => null,
    执行SQLite查询: (sql, params = []) => ({ rows: db.prepare(sql).all(...params) }),
    执行SQLite写入: async (sql, params, _chat, valid) => {
      if (!valid()) return '已取消';
      if (fail) return '需核对';
      const result = db.prepare(sql).run(...params);
      writes.push({ floor: params[0], changes: Number(result.changes) });
      afterWrite();
      return '已确认';
    },
  };
  const bridge = compile(
    '数据库桥',
    ['同步数据库回合', '读取数据库剧情事件已记录楼层', ...Object.keys(pure)],
    environment,
  );
  const keys = compile('临时回合楼', ['临时楼标记键', '回合角色键']);
  const presence = compile('角色近期正文', ['回合在场妻键']);
  const engine = compile('回合引擎', ['补齐缺失数据库事件骨架'], {
    ...environment,
    ...bridge,
    ...keys,
    ...presence,
    SillyTavern: host,
    Mvu: { getMvuData: () => ({ stat_data: { 系统: { _绝对时段: 0 } } }) },
    户静态表: {},
    格式化游戏内时间: () => '第1天 早上',
  });
  function add(summary, temporary = false) {
    const floor = host.chat.length + 1;
    const metadata = {
      版本: 2,
      时间: '第1天 早上',
      地点: '门厅',
      参与者: ['住户'],
      玩家行动: `核对箱子${floor}`,
      结果摘要: summary,
    };
    host.chat.push({ is_user: true, mes: metadata.玩家行动 });
    host.chat.push({
      is_user: false,
      mes: `第${floor}楼对应正文`,
      extra: { [keys.回合角色键]: 'assistant', [keys.临时楼标记键]: temporary, _rqgy数据库事件: metadata },
    });
    return { floor, metadata, event: { 楼层: floor, ...metadata } };
  }
  const row = floor => db.prepare('SELECT * FROM rq_events WHERE floor_no=?').get(floor);
  return {
    db,
    host,
    bridge,
    engine,
    writes,
    add,
    row,
    fail: value => {
      fail = value;
    },
    onWrite: fn => {
      afterWrite = fn;
    },
  };
}

test('同楼后来已有可靠摘要时自动改善既有兜底；没有可靠摘要的旧行不重复补写', async () => {
  const f = fixture();
  try {
    const a = f.add(pure.脚本保守回合摘要('查看箱子'));
    const b = f.add(pure.脚本保守回合摘要('整理工具'));
    await f.bridge.同步数据库回合(a.event);
    await f.bridge.同步数据库回合(b.event);
    const summary = '管理员归还标着“检修工具”的箱子，住户确认物品齐全。';
    a.metadata.结果摘要 = summary;
    f.writes.length = 0;
    assert.equal(await f.engine.补齐缺失数据库事件骨架(b.floor), 1);
    assert.equal(f.row(a.floor).result_summary, summary);
    assert.equal(f.row(a.floor).event_code, `RQ-${a.floor}`);
    assert.equal(f.row(b.floor).result_summary, b.event.结果摘要);
    assert.equal(await f.engine.补齐缺失数据库事件骨架(b.floor), 0);
    assert.deepEqual(
      f.writes.map(w => w.floor),
      [a.floor],
    );
  } finally {
    f.db.close();
  }
});

test('无资料、临时楼、未来楼及错误事件键均不得拿当前正文改善旧记录', async () => {
  const f = fixture();
  try {
    const entries = Array.from({ length: 4 }, () => f.add(pure.脚本保守回合摘要('整理箱子')));
    for (const entry of entries) await f.bridge.同步数据库回合(entry.event);
    entries[0].metadata.结果摘要 = '【待数据库AI整理】正文已成功落楼，等待数据库统一摘要';
    entries[1].metadata.结果摘要 = '箱子已归还。';
    f.host.chat[entries[1].floor].extra._rqgy回合临时 = true;
    entries[2].metadata.结果摘要 = '工具已核对。';
    f.db.prepare('UPDATE rq_events SET event_code=? WHERE floor_no=?').run('OTHER-6', entries[2].floor);
    entries[3].metadata.结果摘要 = '未来楼结果。';
    f.writes.length = 0;
    assert.equal(await f.engine.补齐缺失数据库事件骨架(entries[2].floor), 0);
    assert.deepEqual(f.writes, []);
  } finally {
    f.db.close();
  }
});

test('改善仍受12条批次和提交资格限制，正常真摘要不被兜底或另一版内容覆盖', async () => {
  const f = fixture();
  try {
    const entries = Array.from({ length: 13 }, () => f.add(pure.脚本保守回合摘要('整理工具')));
    for (const entry of entries) {
      await f.bridge.同步数据库回合(entry.event);
      entry.metadata.结果摘要 = `第${entry.floor}楼的箱子已经核对。`;
    }
    const last = entries.at(-1).floor;
    f.writes.length = 0;
    assert.equal(await f.engine.补齐缺失数据库事件骨架(last, () => false), 0);
    assert.equal(await f.engine.补齐缺失数据库事件骨架(last), 12);
    assert.equal(await f.engine.补齐缺失数据库事件骨架(last), 1);
    const existing = f.row(entries[0].floor).result_summary;
    entries[0].metadata.结果摘要 = '另一份无凭据替代摘要。';
    assert.equal(await f.engine.补齐缺失数据库事件骨架(last), 0);
    assert.equal(f.row(entries[0].floor).result_summary, existing);
  } finally {
    f.db.close();
  }
});

test('写入失败保留兜底供下次重试，SQL提交后取消不报确认且终止余下补写', async () => {
  const f = fixture();
  try {
    const a = f.add(pure.脚本保守回合摘要('核对工具'));
    const b = f.add(pure.脚本保守回合摘要('核对箱子'));
    for (const entry of [a, b]) {
      await f.bridge.同步数据库回合(entry.event);
      entry.metadata.结果摘要 = `第${entry.floor}楼核对已完成。`;
    }
    f.writes.length = 0;
    f.fail(true);
    assert.equal(await f.engine.补齐缺失数据库事件骨架(b.floor), 0);
    assert.equal(pure.数据库事件摘要为脚本兜底(f.row(a.floor).result_summary), true);
    assert.equal(pure.数据库事件摘要为脚本兜底(f.row(b.floor).result_summary), true);
    f.fail(false);
    let valid = true;
    f.onWrite(() => {
      valid = false;
    });
    assert.equal(await f.engine.补齐缺失数据库事件骨架(b.floor, () => valid), 0);
    assert.equal(f.writes.length, 1);
    assert.equal(pure.数据库事件摘要为脚本兜底(f.row(a.floor).result_summary), true);
    f.onWrite(() => {});
    assert.equal(await f.engine.补齐缺失数据库事件骨架(b.floor), 1);
  } finally {
    f.db.close();
  }
});
