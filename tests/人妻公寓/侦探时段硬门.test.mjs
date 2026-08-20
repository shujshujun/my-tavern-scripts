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
const { 查裂缝 } = require('../../src/人妻公寓/stageConfig.ts');
const { 对饮, 打听, 翻垃圾, 偷窥选细节 } = require('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts');

function 建数据(绝对时段) {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 绝对时段 }, 背包: ['好酒'] });
  data.户['101'].夫.信任值 = 0;
  return data;
}

test('对饮后端以绝对时段复核丈夫在家，伪造事件不能在外出档消耗酒', async () => {
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
  assert.equal(chatVars._侦探, undefined, '核心提交前不能先烧对饮冷却');
  await 成功.提交后?.();
  assert.equal(chatVars._侦探?.对饮上次?.['101'], 0);
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

test('实际翻垃圾只有核心提交后才写软冷却，同一时段重复点击不重算', async () => {
  chatVars = {};
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 0 } });

  const first = 翻垃圾(data, '101', 999);
  assert.equal(first.变动, true);
  assert.equal(data.风闻, 1);
  assert.equal(data.系统._风闻账.最近事件[0]?.id, '翻垃圾:0:101');
  assert.equal(chatVars._侦探, undefined, '业务尚未确认提交时不能先烧聊天软冷却');
  await first.提交后?.();

  const second = 翻垃圾(data, '101', 999);
  assert.match(second.提示, /翻过/);
  assert.equal(data.风闻, 1);
});

test('监控正确细节只在核心提交后清掉挂起选择，失败前仍可重试', async () => {
  const data = Schema.parse({ 户: { 102: 创建户节点(0) }, 系统: { _绝对时段: 0 } });
  const 正确 = 查裂缝('102').偷窥[0].正确;
  chatVars = {
    _侦探: {
      垃圾空手: {},
      垃圾上次: {},
      死路: {},
      偷窥上次: { 102: 0 },
      偷窥待选: { 门牌: '102', 拍: 0 },
      打听上次: {},
      对饮上次: {},
    },
  };

  const result = 偷窥选细节(data, '102', 正确);
  assert.equal(data.户['102'].妻.裂缝.碎片进度, 1);
  assert.deepEqual(chatVars._侦探.偷窥待选, { 门牌: '102', 拍: 0 }, '核心写入前必须保留选择卡');
  await result.提交后?.();
  assert.equal(chatVars._侦探.偷窥待选, null);

  chatVars._侦探.偷窥待选 = { 门牌: '102', 拍: 1 };
  const wrongData = Schema.parse({ 户: { 102: 创建户节点(0) }, 系统: { _绝对时段: 0 } });
  wrongData.户['102'].妻.裂缝.碎片进度 = 1;
  const wrong = 偷窥选细节(wrongData, '102', (查裂缝('102').偷窥[1].正确 + 1) % 3);
  assert.match(wrong.提示, /没什么特别|下次/);
  assert.equal(chatVars._侦探.偷窥待选, null, '错误选择没有核心写入，立即消费当前选择卡');
});

test('向街坊打听天然传播三点，同日再次打听同户累计到六点', async () => {
  chatVars = {};
  const data = Schema.parse({
    户: { 201: 创建户节点(0) },
    系统: { _绝对时段: 0 },
    背包: ['伴手礼盒', '伴手礼盒'],
  });

  const first = 打听(data, '201', 999);
  assert.equal(first.碎片到手, true);
  assert.equal(chatVars._侦探, undefined, '核心提交前不能先烧打听冷却');
  await first.提交后?.();
  assert.equal(data.风闻, 3);
  data.系统._绝对时段 = 1;
  const second = 打听(data, '201', 999);
  assert.equal(second.碎片到手, true);
  await second.提交后?.();
  assert.equal(data.风闻, 6);
  assert.equal(data.系统._风闻账.最近事件.find(event => event.id === '打听:0:201')?.目标增量, 6);
});
