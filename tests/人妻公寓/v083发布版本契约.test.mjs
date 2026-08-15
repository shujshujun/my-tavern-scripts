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

test('v0.83 发布契约：组卡标签、卡体版本与新增素材均锁定 rq0.83', () => {
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 客户端资源 = 读('src/人妻公寓/界面/客户端/assets.ts');
  const 手机资源 = 读('src/人妻公寓/脚本/游戏逻辑/手机/壳/资源与皮肤.ts');

  assert.match(组卡, /const TAG = 'rq0\.83'/);
  assert.match(组卡, /const 版本 = '0\.83'/);
  assert.match(组卡, /支持继承 v0\.80／v0\.81／v0\.82 存档/);
  assert.match(客户端资源, /@rq0\.83\/output\/imagegen\/family-plan/);
  assert.match(客户端资源, /@rq0\.83\/output\/imagegen\/production-system\/final/);
  assert.match(手机资源, /@rq0\.83\/output\/imagegen\/production-system\/final/);
  assert.match(客户端资源, /@rq0\.82\/output\/imagegen\/rqgy-reset\/pregnancy-portraits\/approved/);
});

test('v0.83 发布契约：源码、initvar 与 schema.json 均为数据版本 9', () => {
  const initvar = YAML.parse(读('src/人妻公寓/世界书/变量/initvar.yaml'));
  const schemaJSON = JSON.parse(读('src/人妻公寓/schema.json'));

  assert.equal(当前MVU数据版本, 9);
  assert.equal(initvar.系统._数据版本, 9);
  assert.deepEqual(initvar.系统._孕情初见评价楼, {});
  assert.equal(schemaJSON.properties.系统.properties._数据版本.const, 9);
  assert.equal(schemaJSON.properties.系统.properties._数据版本.default, 9);
  assert.deepEqual(schemaJSON.properties.系统.properties._孕情初见评价楼.default, {});
  assert.equal(schemaJSON.properties.系统.properties._孕情初见评价楼.additionalProperties.type, 'number');
});

test('v0.83 发布契约：v7/v8 存档可迁移到 v9，更旧版本被拒绝', () => {
  assert.doesNotThrow(() => 验证当前MVU存档版本({ 系统: { _数据版本: 7 } }));
  assert.equal(Schema.parse({ 系统: { _数据版本: 7 } }).系统._数据版本, 9);
  assert.equal(Schema.parse({ 系统: { _数据版本: 8 } }).系统._数据版本, 9);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 6 } }), /数据版本 7、8 和 9/);
});
