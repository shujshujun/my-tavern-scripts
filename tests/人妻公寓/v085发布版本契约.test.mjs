/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const YAML = require('yaml');
const { Schema, 当前MVU数据版本, 验证当前MVU存档版本 } = require('../../src/人妻公寓/schema.ts');

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('v0.85 历史发布契约：发布说明保留不可变分支、标签与验证快照', () => {
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.85_2026-08-20.md');

  assert.match(发布说明, /发布分支：`release\/rq085`/);
  assert.match(发布说明, /发布标签：`rq0\.85`/);
  assert.match(发布说明, /185 个测试文件，1641／1641 项通过/);
  assert.match(发布说明, /代码入口 `rq0\.85`/);
});

test('v0.85 发布契约：数据版本保持 9，v0.83 与 v0.84 存档直接继续', () => {
  const initvar = YAML.parse(读('src/人妻公寓/世界书/变量/initvar.yaml'));
  const schemaJSON = JSON.parse(读('src/人妻公寓/schema.json'));

  assert.equal(当前MVU数据版本, 9);
  assert.equal(initvar.系统._数据版本, 9);
  assert.equal(schemaJSON.properties.系统.properties._数据版本.const, 9);
  assert.equal(schemaJSON.properties.系统.properties._数据版本.default, 9);
  assert.doesNotThrow(() => 验证当前MVU存档版本({ 系统: { _数据版本: 9 } }));
  assert.equal(Schema.parse({ 系统: { _数据版本: 7 } }).系统._数据版本, 9);
  assert.equal(Schema.parse({ 系统: { _数据版本: 8 } }).系统._数据版本, 9);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 6 } }), /数据版本 7、8 和 9/);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 10 } }), /数据版本 7、8 和 9/);
});

test('v0.85 发布契约：数据库五表通过拼音列冲突修复并保留 0.84 社交时间值', () => {
  const 模板 = JSON.parse(读('src/人妻公寓/人妻公寓数据库模板.json'));
  const 数据库桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  const 社交表 = 模板.sheet_rq_social_history;

  assert.deepEqual(社交表.content[0], ['row_id', '类型', '人物', '事件', '结果', '游戏时间', '最后楼层', '事件键']);
  assert.match(社交表.sourceData.ddl, /game_time TEXT, -- 游戏时间/);
  assert.match(社交表.sourceData.note, /列5: 游戏时间/);
  assert.doesNotMatch(JSON.stringify(社交表.content[0]), /"事件","结果","时间"/);
  assert.match(数据库桥, /\['row_id', '类型', '人物', '事件', '结果', '时间', '最后楼层', '事件键'\]/);
  assert.match(数据库桥, /列名 === '游戏时间'[\s\S]*?旧索引\.get\('时间'\)/);
});
