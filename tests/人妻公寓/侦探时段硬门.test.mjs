/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let chatVars = {};
globalThis.getVariables = () => chatVars;
globalThis.insertOrAssignVariables = patch => {
  chatVars = lodash.merge({}, chatVars, patch);
};

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 对饮, 打听, 翻垃圾 } = require('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts');

function 建数据(绝对时段) {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 绝对时段 }, 背包: ['好酒'] });
  data.户['101'].夫.信任值 = 0;
  return data;
}

test('对饮后端以绝对时段复核丈夫在家，伪造事件不能在外出档消耗酒', () => {
  chatVars = {};
  const 外出档 = 建数据(1); // 101 丈夫中午基础外出
  const 拒绝 = 对饮(外出档, '101', 999);
  assert.match(拒绝.提示, /不在家|不在/);
  assert.deepEqual(外出档.背包, ['好酒']);
  assert.equal(外出档.户['101'].夫.信任值, 0);
  assert.equal(chatVars._侦探, undefined, '拒绝动作不得烧冷却');

  const 在家档 = 建数据(0);
  const 成功 = 对饮(在家档, '101', 999);
  assert.equal(成功.碎片到手, true);
  assert.deepEqual(在家档.背包, []);
  assert.equal(在家档.户['101'].夫.信任值, 8);
});

test('运作外出覆盖同样阻止对饮，不能只看基础作息', () => {
  chatVars = {};
  const data = 建数据(0); // 基础在家
  data.户['101'].夫._外出至 = 3;
  const result = 对饮(data, '101', 0);
  assert.match(result.提示, /不在家|不在/);
  assert.deepEqual(data.背包, ['好酒']);
  assert.equal(data.户['101'].夫.信任值, 0);
});

test('实际翻垃圾留下痕迹增加一点风闻，同一时段重复点击不重算', () => {
  chatVars = {};
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 0 } });

  const first = 翻垃圾(data, '101', 999);
  assert.equal(first.变动, true);
  assert.equal(data.风闻, 1);
  assert.equal(data.系统._风闻账.最近事件[0]?.id, '翻垃圾:0:101');

  const second = 翻垃圾(data, '101', 999);
  assert.match(second.提示, /翻过/);
  assert.equal(data.风闻, 1);
});

test('向街坊打听天然传播三点，同日再次打听同户累计到六点', () => {
  chatVars = {};
  const data = Schema.parse({
    户: { 201: 创建户节点(0) },
    系统: { _绝对时段: 0 },
    背包: ['伴手礼盒', '伴手礼盒'],
  });

  assert.equal(打听(data, '201', 999).碎片到手, true);
  assert.equal(data.风闻, 3);
  data.系统._绝对时段 = 1;
  assert.equal(打听(data, '201', 999).碎片到手, true);
  assert.equal(data.风闻, 6);
  assert.equal(data.系统._风闻账.最近事件.find(event => event.id === '打听:0:201')?.目标增量, 6);
});
