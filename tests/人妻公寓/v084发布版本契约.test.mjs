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
const { 当前游戏版本 } = require('../../src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('v0.84 发布契约：游戏检测、角色卡展示与代码资源统一锁定 rq0.84', () => {
  const 组卡 = 读('src/人妻公寓/组卡.mjs');

  assert.equal(当前游戏版本, '0.84');
  assert.match(组卡, /const TAG = 'rq0\.84'/);
  assert.match(组卡, /const 版本 = '0\.84'/);
  assert.match(组卡, /支持继承 v0\.80／v0\.81／v0\.82／v0\.83 存档/);
  assert.match(组卡, /v0\.83 可直接继续/);
  assert.match(组卡, /const BASE = `https:\/\/testingcf\.jsdelivr\.net\/gh\/shujshujun\/my-tavern-scripts@\$\{TAG\}`/);
  assert.match(组卡, /\$\{BASE\}\/dist\/人妻公寓\/界面\/客户端\/index\.html/);
  assert.match(组卡, /BASE \+ "\/dist\/人妻公寓\/脚本\/游戏逻辑\/index\.js/);
  assert.doesNotMatch(组卡, /@rq0\.83\/dist\/人妻公寓\//, '0.84 卡体不得继续加载 0.83 代码产物');
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
