/* eslint-disable import-x/no-nodejs-modules -- Exercise the exact authored SQL against SQLite */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
const template = JSON.parse(
  readFileSync(new URL('../../src/人妻公寓/人妻公寓数据库模板.json', import.meta.url), 'utf8'),
);
function queryFor(key) {
  const text = template[key].updateConfig.sendRowsSqlTemplate;
  assert.equal(typeof text, 'string');
  const sql = [...text.matchAll(/\{\[sql "([\s\S]*?)"\]\}/g)].map(m => m[1]).find(sql => /^SELECT row_id,/i.test(sql));
  assert.ok(sql);
  return sql;
}
function withTable(key, run) {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(template[key].sourceData.ddl);
    run(db, queryFor(key));
  } finally {
    db.close();
  }
}
function promises(db, activeCount = 1) {
  const insert = db.prepare(
    'INSERT INTO rq_promises (row_id,title,related_characters,detail,status,last_progress,last_time,last_floor) VALUES (?,?,?,?,?,?,?,?)',
  );
  for (let i = 1; i <= 70; i++)
    insert.run(i, `事项${i}`, '住户', `约定${i}`, i <= activeCount ? '待处理' : '已兑现', '最近进展', '第1天 下午', i);
}

test('承诺表在60行输入内同时保留旧未结事项和近期完成事项，原70行不变', () =>
  withTable('sheet_rq_promises', (db, sql) => {
    promises(db);
    const before = db.prepare('SELECT * FROM rq_promises ORDER BY row_id').all();
    const rows = db.prepare(sql).all();
    assert.equal(rows.length, 60);
    assert.ok(rows.some(row => row.row_id === 1));
    assert.ok(rows.some(row => row.row_id === 70));
    assert.deepEqual(db.prepare('SELECT * FROM rq_promises ORDER BY row_id').all(), before);
  }));
test('未结事项超过60条时仍保留最近20条，剩余按未结状态与更新时间选择且无重复', () =>
  withTable('sheet_rq_promises', (db, sql) => {
    promises(db, 70);
    db.prepare("UPDATE rq_promises SET status='已兑现',last_floor=999 WHERE row_id=70").run();
    const rows = db.prepare(sql).all();
    assert.equal(rows.length, 60);
    assert.equal(new Set(rows.map(row => row.row_id)).size, 60);
    for (let id = 51; id <= 70; id++)
      assert.ok(
        rows.some(row => row.row_id === id),
        `recent ${id}`,
      );
    assert.equal(rows.filter(row => row.status === '待处理').length, 59);
  }));
test('没有未结事项时按最后更新楼层选60行，未知更新时间有稳定排序', () =>
  withTable('sheet_rq_promises', (db, sql) => {
    promises(db, 0);
    db.prepare('UPDATE rq_promises SET last_floor=1000 WHERE row_id=1').run();
    db.prepare('UPDATE rq_promises SET last_floor=NULL WHERE row_id=2').run();
    const rows = db.prepare(sql).all();
    assert.ok(rows.some(row => row.row_id === 1));
    assert.equal(rows.length, 60);
    assert.equal(
      rows.some(row => row.row_id === 2),
      false,
    );
  }));
test('人物旧主题最近更新后进入填表输入，未更新的旧主题仍受60行预算约束', () =>
  withTable('sheet_rq_character_memory', (db, sql) => {
    const insert = db.prepare(
      'INSERT INTO rq_character_memory (row_id,character_name,topic,memory_text,future_impact,last_time,last_floor,confidence) VALUES (?,?,?,?,?,?,?,?)',
    );
    for (let i = 1; i <= 70; i++)
      insert.run(i, '住户', `主题${i}`, `记忆${i}`, '后续影响', '第1天 下午', i === 1 ? 999 : i, '明确');
    const rows = db.prepare(sql).all();
    assert.equal(rows.length, 60);
    assert.equal(rows[0].row_id, 1);
    assert.equal(
      rows.some(row => row.row_id === 2),
      false,
    );
    assert.equal(db.prepare('SELECT count(*) n FROM rq_character_memory').get().n, 70);
  }));
test('自定义选行仅用于两张长期表，频率、批大小、脚本表所有权和纪要配置保持', () => {
  for (const key of ['sheet_rq_character_memory', 'sheet_rq_promises']) {
    assert.equal(template[key].updateConfig.sendLatestRows, 60);
    assert.equal(template[key].updateConfig.updateFrequency, 3);
    assert.equal(template[key].updateConfig.batchSize, 3);
    assert.equal(template[key].sourceData.hiddenPhysicalColumns, undefined);
  }
  for (const key of ['sheet_rq_events', 'sheet_rq_social_history', 'sheet_summary'])
    assert.equal(template[key].updateConfig.sendRowsSqlTemplate, undefined);
});

test('新事项的模型楼层即使偏小仍进入最近新增窗口，不挤掉唯一旧未结事项', () =>
  withTable('sheet_rq_promises', (db, sql) => {
    promises(db);
    db.prepare(
      "INSERT INTO rq_promises (row_id,title,detail,status,last_floor) VALUES (71,'新近事项','本轮新记','待处理',1)",
    ).run();
    const rows = db.prepare(sql).all();
    assert.equal(rows.length, 60);
    assert.ok(rows.some(row => row.row_id === 71));
    assert.ok(rows.some(row => row.row_id === 1));
  }));
