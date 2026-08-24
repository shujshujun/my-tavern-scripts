/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 数据库源 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
const 回合源 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
const 模板 = JSON.parse(读('src/人妻公寓/人妻公寓数据库模板.json'));
const 取表 = 名称 => Object.values(模板).find(项 => 项 && typeof 项 === 'object' && 项.name === 名称);

test('RQ剧情事件与社交轨迹改为脚本所有权，通用填表AI不再插入或改写精确楼层账', () => {
  const 剧情 = 取表('RQ_剧情事件');
  const 社交 = 取表('RQ_社交轨迹');
  assert.equal(剧情.updateConfig.updateFrequency, 0);
  assert.match(剧情.sourceData.note, /游戏脚本.*精确写入/u);
  assert.match(剧情.sourceData.updateNode, /禁止/u);
  assert.equal(社交.updateConfig.updateFrequency, 0);
  assert.match(社交.sourceData.note, /仅由游戏脚本/u);
  assert.match(社交.sourceData.insertNode, /禁止/u);
  assert.match(社交.sourceData.updateNode, /禁止/u);
});

test('精确摘要 SQL 对任意楼都要求 floor_no 与 event_code 同时归属，跨楼组合一律写入 0 行', () => {
  const match = 数据库源.match(/export const 数据库精确摘要覆盖SQL = `([\s\S]*?)`;/u);
  assert.ok(match, '数据库桥必须提供脚本拥有的精确摘要 UPDATE');
  const sql = match[1];
  assert.match(sql, /WHERE floor_no = \?\s+AND event_code = \?/u);

  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE rq_events (
      row_id INTEGER PRIMARY KEY,
      floor_no INTEGER NOT NULL UNIQUE,
      result_summary TEXT,
      event_code TEXT NOT NULL UNIQUE
    )`);
    const insert = db.prepare('INSERT INTO rq_events (floor_no, result_summary, event_code) VALUES (?, ?, ?)');
    for (const 楼层 of [4, 5, 41, 42]) insert.run(楼层, `第${楼层}楼原摘要`, `RQ-${楼层}`);

    const update = db.prepare(sql);
    assert.equal(update.run('错误跨楼摘要', 4, 'RQ-5').changes, 0);
    assert.equal(update.run('错误跨楼摘要', 41, 'RQ-42').changes, 0);
    assert.equal(update.run('玩家完成101室水管维修。', 4, 'RQ-4').changes, 1);
    assert.equal(update.run('夏乔滑倒，玩家及时扶住她。', 5, 'RQ-5').changes, 1);
    const rows = db
      .prepare('SELECT floor_no, result_summary FROM rq_events ORDER BY floor_no')
      .all()
      .map(row => ({ floor_no: row.floor_no, result_summary: row.result_summary }));
    assert.deepEqual(rows, [
      { floor_no: 4, result_summary: '玩家完成101室水管维修。' },
      { floor_no: 5, result_summary: '夏乔滑倒，玩家及时扶住她。' },
      { floor_no: 41, result_summary: '第41楼原摘要' },
      { floor_no: 42, result_summary: '第42楼原摘要' },
    ]);
  } finally {
    db.close();
  }
});

test('正文同轮产出机器摘要并持久绑定助手楼；数据库通用填表后再次重申该楼摘要', () => {
  assert.match(回合源, /数据库事件摘要指令/u);
  assert.match(回合源, /提取回合事件摘要\(原文\)/u);
  assert.match(回合源, /结果摘要:\s*本轮数据库结果摘要/u, '助手楼元数据必须保存本轮采用摘要');
  assert.match(回合源, /记录数据库回合骨架\([\s\S]*本轮数据库结果摘要/u);
  const 后处理起 = 回合源.indexOf('function 安排数据库回合后处理');
  const 后处理止 = 回合源.indexOf('/** 静音会议的成功正文', 后处理起);
  const 后处理 = 回合源.slice(后处理起, 后处理止);
  assert.match(数据库源, /脚本所有权模板已启用/u, '旧聊天模板必须能与安全脚本所有权模板区分');
  assert.match(
    数据库源,
    /SELECT floor_no, result_summary[\s\S]*filter\(row => !数据库事件摘要待整理\(row\.result_summary\)\)/u,
    '旧空摘要与待整理行不能冒充已完成；必须由各自楼层的历史元数据安全补写',
  );
  assert.match(后处理, /if \(当前数据库状态\.脚本所有权模板已启用\)/u);
  assert.match(后处理, /已暂停通用填表，只保留脚本精确纪要/u);
  const 通用填表 = 后处理.indexOf('await 广播生成完成事件(');
  const 精确重申 = 后处理.indexOf('await 覆盖数据库剧情事件摘要(');
  assert.ok(通用填表 >= 0 && 精确重申 > 通用填表, '通用长期记忆填表后必须重申脚本拥有的当前楼摘要');
});
