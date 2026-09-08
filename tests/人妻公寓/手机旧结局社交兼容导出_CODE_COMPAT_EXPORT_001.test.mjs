/* eslint-disable import-x/no-nodejs-modules -- Node-only compatibility regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const compat = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局后生活社交语义.ts');

function fresh() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 302: 创建户节点(0) } });
  data.户['101'].妻.当前阶段 = 3;
  return data;
}

test('CODE-COMPAT-EXPORT-001 旧母亲共居评论门面仍可调用，不依赖已删除固定评论池', () => {
  const data = fresh();
  const text = compat.母亲共居公开评论文案(data, '101', '公开交接');
  assert.equal(typeof text, 'string');
  assert.ok(text.length > 0);
  assert.match(text, /夏乔|热闹|直接|安排|家庭/u);
});

test('兼容门面继续拒绝母亲自己和非法门牌', () => {
  const data = fresh();
  assert.equal(compat.母亲共居公开评论文案(data, '302', '公开交接'), '');
  assert.equal(compat.母亲共居公开评论文案(data, '999', '公开交接'), '');
});
