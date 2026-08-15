/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
globalThis.SillyTavern = { chat: [{}] };

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

// 购买分支不需要数据库；隔离浏览器 raw-loader 依赖。
const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 道具表, 经济配置 } = require('../../src/人妻公寓/stageConfig.ts');
const { 取货架, 购买 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 使用运作 } = require('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts');

function 建数据({ 时段 = 10, 风闻 = 60 } = {}) {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) } });
  data.系统._绝对时段 = 时段;
  data.风闻 = 风闻;
  data.现金 = 5000;
  return data;
}

test('住户答谢会作为高价强效商品上架，并完成购买到使用的闭环', () => {
  const data = 建数据();
  const 运作货架 = 取货架(data).find(货架 => 货架.页签 === '运作');

  assert.equal(道具表.住户答谢会.价格, 1000);
  assert.equal(经济配置.答谢会风闻直降, 25);
  assert.ok(运作货架?.商品.some(商品 => 商品.id === '住户答谢会'));

  const 购买结果 = 购买(data, '住户答谢会');
  assert.equal(购买结果.成功, true);
  assert.equal(data.现金, 4000);
  assert.equal(data.背包.includes('住户答谢会'), true);

  const 使用结果 = 使用运作(data, '住户答谢会', null, 1);
  assert.equal(使用结果.变动, true);
  assert.match(使用结果.提示, /风闻 -25/);
  assert.equal(data.风闻, 35);
  assert.equal(data.背包.includes('住户答谢会'), false);
});

test('聚餐与答谢会互相占用共享冷却，失败时不消耗背包商品', () => {
  const 聚餐先用 = 建数据({ 风闻: 80 });
  聚餐先用.背包.push('全楼聚餐', '住户答谢会');
  assert.equal(使用运作(聚餐先用, '全楼聚餐', null, 1).变动, true);
  const 答谢会拒绝 = 使用运作(聚餐先用, '住户答谢会', null, 1);
  assert.equal(答谢会拒绝.变动, undefined);
  assert.match(答谢会拒绝.提示, /住户公关活动|还要等/);
  assert.equal(聚餐先用.背包.includes('住户答谢会'), true);

  const 答谢会先用 = 建数据({ 风闻: 80 });
  答谢会先用.背包.push('全楼聚餐', '住户答谢会');
  assert.equal(使用运作(答谢会先用, '住户答谢会', null, 1).变动, true);
  const 聚餐拒绝 = 使用运作(答谢会先用, '全楼聚餐', null, 1);
  assert.equal(聚餐拒绝.变动, undefined);
  assert.match(聚餐拒绝.提示, /住户公关活动|还要等/);
  assert.equal(答谢会先用.背包.includes('全楼聚餐'), true);
});
