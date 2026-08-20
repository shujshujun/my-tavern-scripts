/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const YAML = require('yaml');
const { Schema, 当前MVU数据版本, 验证当前MVU存档版本 } = require('../../src/人妻公寓/schema.ts');
const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('v0.84 历史发布契约：发布说明保留不可变分支、标签与验证快照', () => {
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.84_2026-08-20.md');

  assert.match(发布说明, /发布分支：`release\/rq084`/);
  assert.match(发布说明, /发布标签：`rq0\.84`/);
  assert.match(发布说明, /184 个测试文件，1637／1637 项通过/);
  assert.match(发布说明, /代码入口统一指向不可变标签 `rq0\.84`/);
});

test('v0.84 发布契约：数据版本保持 9，v0.83 存档直接继续', () => {
  const initvar = YAML.parse(读('src/人妻公寓/世界书/变量/initvar.yaml'));
  const schemaJSON = JSON.parse(读('src/人妻公寓/schema.json'));

  assert.equal(当前MVU数据版本, 9);
  assert.equal(initvar.系统._数据版本, 9);
  assert.equal(schemaJSON.properties.系统.properties._数据版本.const, 9);
  assert.equal(schemaJSON.properties.系统.properties._数据版本.default, 9);
  assert.doesNotThrow(() => 验证当前MVU存档版本({ 系统: { _数据版本: 9 } }));
});

test('v0.84 发布契约：v0.80-v0.82 迁移到 v9，更早或未来数据版本继续拒绝', () => {
  assert.equal(Schema.parse({ 系统: { _数据版本: 7 } }).系统._数据版本, 9);
  assert.equal(Schema.parse({ 系统: { _数据版本: 8 } }).系统._数据版本, 9);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 6 } }), /数据版本 7、8 和 9/);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 10 } }), /数据版本 7、8 和 9/);
});
