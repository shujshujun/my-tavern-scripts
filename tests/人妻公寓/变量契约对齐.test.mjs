/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const YAML = require('yaml');
const { Schema, 当前MVU数据版本, 验证当前MVU存档版本 } = require('../../src/人妻公寓/schema.ts');

const initvar路径 = new URL('../../src/人妻公寓/世界书/变量/initvar.yaml', import.meta.url);
const 更新规则路径 = new URL('../../src/人妻公寓/世界书/变量/变量更新规则.yaml', import.meta.url);
const 输出格式路径 = new URL('../../src/人妻公寓/世界书/变量/变量输出格式.yaml', import.meta.url);
const stageConfig路径 = new URL('../../src/人妻公寓/stageConfig.ts', import.meta.url);

const initvar文本 = readFileSync(initvar路径, 'utf8');
const initvar = YAML.parse(initvar文本);
const 更新规则 = readFileSync(更新规则路径, 'utf8');
const 输出格式 = readFileSync(输出格式路径, 'utf8');
const stageConfig源码 = readFileSync(stageConfig路径, 'utf8');

function 对象路径(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return [path, ...对象路径(item, path)];
  });
}

test('initvar 与 Schema 默认结构逐键一致，动态户表除外', () => {
  const Schema默认 = Schema.parse(initvar);
  const 过滤户 = paths => paths.filter(path => path !== '户' && !path.startsWith('户.')).sort();

  assert.deepEqual(过滤户(对象路径(initvar)), 过滤户(对象路径(Schema默认)));
  assert.equal(initvar.系统._数据版本, 当前MVU数据版本);
});

test('v0.81 v8 新局契约移除系统操作中字段，并拒绝其他版本存档', () => {
  assert.equal(当前MVU数据版本, 8);
  assert.equal(Object.hasOwn(initvar.系统, '_系统操作中'), false);
  assert.throws(
    () => 验证当前MVU存档版本({ 系统: { _数据版本: 6, _系统操作中: true } }),
    /v0\.81 不兼容其他版本存档/,
  );
  const 新局 = Schema.parse(initvar);
  assert.equal(Object.hasOwn(新局.系统, '_系统操作中'), false);
  assert.equal(新局.系统._数据版本, 8);
});

test('v0.81 存档版本守卫与 Schema 一样拒绝字符串版本号', () => {
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: '8' } }), /v0\.81 不兼容其他版本存档/);
  assert.throws(() => Schema.safeParse({ 系统: { _数据版本: '8' } }), /v0\.81 不兼容其他版本存档/);
});

test('好感单轮上限在世界书与脚本契约中统一为正负3', () => {
  assert.match(更新规则, /好感值:[\s\S]*?\+1~3[\s\S]*?±3/);
  assert.doesNotMatch(更新规则, /好感值:[\s\S]*?±5/);
});

test('变量输出格式只要求 replace，不再让 AI 计算时间或自行判断大额更新', () => {
  assert.doesNotMatch(输出格式, /calculate time passed|dramatic updates/i);
  assert.doesNotMatch(输出格式, /`add`|`remove`|"op": "add"|"op": "remove"/);
  assert.match(输出格式, /"op": "replace"/);
});

test('变量世界书同步心理摘要约束，首批入住注释不再误称 initvar 含户节点', () => {
  assert.match(更新规则, /不得照抄.*台词.*口头禅/);
  assert.doesNotMatch(stageConfig源码, /initvar\s*只含这些/);
});
