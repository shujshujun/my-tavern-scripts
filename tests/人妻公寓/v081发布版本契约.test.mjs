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
const { 当前MVU数据版本, 验证当前MVU存档版本 } = require('../../src/人妻公寓/schema.ts');

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.81 发布标签、卡体版本、孕态资源与存档契约保持一致', () => {
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 资源 = 读('src/人妻公寓/界面/客户端/assets.ts');
  const initvar = YAML.parse(读('src/人妻公寓/世界书/变量/initvar.yaml'));
  const schemaJSON = JSON.parse(读('src/人妻公寓/schema.json'));

  assert.match(组卡, /const TAG = 'rq0\.81'/);
  assert.match(组卡, /const 版本 = '0\.81'/);
  assert.match(资源, /@rq0\.81\/output\/imagegen\/rqgy-reset\/pregnancy-portraits\/approved/);
  assert.match(资源, /服装_\$\{sku\}_孕态\.webp/);
  assert.equal(当前MVU数据版本, 8);
  assert.equal(initvar.系统._数据版本, 8);
  assert.deepEqual(initvar.系统._孕情初见评价楼, {});
  assert.equal(schemaJSON.properties.系统.properties._数据版本.const, 8);
  assert.equal(schemaJSON.properties.系统.properties._数据版本.default, 8);
  assert.deepEqual(schemaJSON.properties.系统.properties._孕情初见评价楼.default, {});
  assert.equal(schemaJSON.properties.系统.properties._孕情初见评价楼.additionalProperties.type, 'number');
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 7 } }), /v0\.81 不兼容其他版本存档/);
});
