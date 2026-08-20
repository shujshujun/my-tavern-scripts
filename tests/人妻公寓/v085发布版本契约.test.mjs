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
const { 当前游戏版本 } = require('../../src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('v0.85 发布契约：游戏检测、角色卡展示与代码入口统一锁定 rq0.85', () => {
  const 组卡 = 读('src/人妻公寓/组卡.mjs');

  assert.equal(当前游戏版本, '0.85');
  assert.match(组卡, /const TAG = 'rq0\.85'/);
  assert.match(组卡, /const 版本 = '0\.85'/);
  assert.match(组卡, /支持继承 v0\.80／v0\.81／v0\.82／v0\.83／v0\.84 存档/);
  assert.match(组卡, /v0\.83／v0\.84 可直接继续/);
  assert.match(组卡, /新版数据库插件导入五表时“事件／时间”拼音物理列冲突/);
  assert.match(组卡, /const BASE = `https:\/\/testingcf\.jsdelivr\.net\/gh\/shujshujun\/my-tavern-scripts@\$\{TAG\}`/);
  assert.match(组卡, /\$\{BASE\}\/dist\/人妻公寓\/界面\/客户端\/index\.html/);
  assert.match(组卡, /BASE \+ "\/dist\/人妻公寓\/脚本\/游戏逻辑\/index\.js/);
  assert.doesNotMatch(组卡, /@rq0\.84\/dist\/人妻公寓\//, '0.85 卡体不得继续加载 0.84 代码产物');
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
