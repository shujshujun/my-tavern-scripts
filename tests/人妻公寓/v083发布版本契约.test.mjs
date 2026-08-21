/* eslint-disable import-x/no-nodejs-modules -- Node-only historical release contract test */
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

test('v0.83 历史素材契约：家庭计划、生产与孕态资源继续固定到不可变旧标签', () => {
  const 客户端资源 = 读('src/人妻公寓/界面/客户端/assets.ts');
  const 手机资源 = 读('src/人妻公寓/脚本/游戏逻辑/手机/壳/资源与皮肤.ts');

  assert.match(客户端资源, /@rq0\.83\/output\/imagegen\/family-plan/);
  assert.match(客户端资源, /@rq0\.83\/output\/imagegen\/production-system\/final/);
  assert.match(手机资源, /@rq0\.83\/output\/imagegen\/production-system\/final/);
  assert.match(客户端资源, /@rq0\.82\/output\/imagegen\/rqgy-reset\/pregnancy-portraits\/approved/);
});

test('v0.83 数据版本 9 继续作为 v0.86 的直接兼容基线', () => {
  const initvar = YAML.parse(读('src/人妻公寓/世界书/变量/initvar.yaml'));
  const schemaJSON = JSON.parse(读('src/人妻公寓/schema.json'));

  assert.equal(当前MVU数据版本, 9);
  assert.equal(initvar.系统._数据版本, 9);
  assert.equal(schemaJSON.properties.系统.properties._数据版本.const, 9);
  assert.equal(schemaJSON.properties.系统.properties._数据版本.default, 9);
  assert.doesNotThrow(() => 验证当前MVU存档版本({ 系统: { _数据版本: 9 } }));
});

test('v0.83 以前的受支持存档仍按既有规则迁移到数据版本 9', () => {
  assert.doesNotThrow(() => 验证当前MVU存档版本({ 系统: { _数据版本: 7 } }));
  assert.equal(Schema.parse({ 系统: { _数据版本: 7 } }).系统._数据版本, 9);
  assert.equal(Schema.parse({ 系统: { _数据版本: 8 } }).系统._数据版本, 9);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 6 } }), /数据版本 7、8 和 9/);
});
