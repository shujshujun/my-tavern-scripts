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
globalThis.getLastMessageId = () => 42;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 创建余波账 } = require('../../src/人妻公寓/脚本/游戏逻辑/冷落成长核心.ts');
const { 送礼 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');

function 建数据({ 状态 = '安抚中', 已安抚楼 = 1, 需安抚楼 = 3, 阶段 = 2, 背包 = ['高级护手霜'] } = {}) {
  const data = Schema.parse({
    户: { 101: 创建户节点(0) },
    系统: { _绝对时段: 24 },
    背包,
  });
  const 妻 = data.户['101'].妻;
  妻.当前阶段 = 阶段;
  妻._成长账 = { 上次有效成长钟楼: 6, 成长轮次: 2, 已结算冷落日: 3 };
  妻._冷落余波 = {
    状态,
    触发钟楼: 18,
    需安抚楼,
    已安抚楼,
    上次安抚正文楼: 20,
    送礼安抚日: -1,
    当日送礼安抚次数: 0,
  };
  return data;
}

test.beforeEach(() => {
  chatVars = {};
});

test('安抚中的成功送礼消耗一件礼物并推进一次安抚', async () => {
  const data = 建数据();

  const 结果 = await 送礼(data, '高级护手霜', '101');

  assert.equal(结果.成功, true);
  assert.deepEqual(data.背包, []);
  assert.equal(data.户['101'].妻._冷落余波.状态, '安抚中');
  assert.equal(data.户['101'].妻._冷落余波.已安抚楼, 2);
  assert.match(结果.提示, /在意|安抚/);
});

test('最后一件安抚礼物解除余波并按当前绝对时段重置成长钟', async () => {
  const data = 建数据({ 已安抚楼: 2, 需安抚楼: 3 });

  const 结果 = await 送礼(data, '高级护手霜', '101');

  assert.equal(结果.成功, true);
  assert.deepEqual(data.户['101'].妻._冷落余波, 创建余波账());
  assert.deepEqual(data.户['101'].妻._成长账, {
    上次有效成长钟楼: 24,
    成长轮次: 3,
    已结算冷落日: 0,
  });
  assert.match(结果.提示, /放下|和好|恢复/);
});

test('待诉苦阶段不能靠送礼跳过当面诉苦', async () => {
  const data = 建数据({ 状态: '待诉苦', 已安抚楼: 0 });

  const 结果 = await 送礼(data, '高级护手霜', '101');

  assert.equal(结果.成功, true);
  assert.equal(data.户['101'].妻._冷落余波.状态, '待诉苦');
  assert.equal(data.户['101'].妻._冷落余波.已安抚楼, 0);
  assert.doesNotMatch(结果.提示, /在意|安抚|放下|和好|恢复/);
});

test('送礼失败或同一件礼物重复提交不会重复推进安抚', async () => {
  const data = 建数据({ 已安抚楼: 0 });

  const 首次 = await 送礼(data, '高级护手霜', '101');
  const 重复 = await 送礼(data, '高级护手霜', '101');

  assert.equal(首次.成功, true);
  assert.equal(重复.成功, false);
  assert.equal(data.户['101'].妻._冷落余波.已安抚楼, 1);
});

test('阶段1遗留的安抚状态不会借送礼恢复冷落资格', async () => {
  const data = 建数据({ 阶段: 1 });

  const 结果 = await 送礼(data, '高级护手霜', '101');

  assert.equal(结果.成功, true);
  assert.equal(data.户['101'].妻._冷落余波.已安抚楼, 1);
  assert.doesNotMatch(结果.提示, /在意|安抚|放下|和好|恢复/);
});

test('每名角色每天只有前三件成功礼物计入安抚，第四件照常送出但不计进度', async () => {
  const data = 建数据({ 已安抚楼: 0, 需安抚楼: 9, 背包: Array(4).fill('高级护手霜') });

  const 结果们 = [];
  for (let i = 0; i < 4; i += 1) 结果们.push(await 送礼(data, '高级护手霜', '101'));

  assert.equal(
    结果们.every(结果 => 结果.成功),
    true,
    '四件礼物本身都应成功送出',
  );
  assert.deepEqual(data.背包, []);
  assert.equal(data.户['101'].妻._冷落余波.已安抚楼, 3);
  assert.equal(data.户['101'].妻._冷落余波.送礼安抚日, 5);
  assert.equal(data.户['101'].妻._冷落余波.当日送礼安抚次数, 3);
  assert.match(结果们[3].提示, /今天.*不再增加安抚进度/);
});

test('跨到下一个世界日后恢复三次送礼安抚额度并随存档保留', async () => {
  const data = 建数据({ 已安抚楼: 0, 需安抚楼: 9, 背包: Array(5).fill('高级护手霜') });
  for (let i = 0; i < 4; i += 1) await 送礼(data, '高级护手霜', '101');

  data.系统._绝对时段 = 30;
  const 次日 = await 送礼(data, '高级护手霜', '101');
  const 保存后 = Schema.parse(data);

  assert.equal(次日.成功, true);
  assert.equal(data.户['101'].妻._冷落余波.已安抚楼, 4);
  assert.equal(data.户['101'].妻._冷落余波.送礼安抚日, 6);
  assert.equal(data.户['101'].妻._冷落余波.当日送礼安抚次数, 1);
  assert.equal(保存后.户['101'].妻._冷落余波.送礼安抚日, 6);
  assert.equal(保存后.户['101'].妻._冷落余波.当日送礼安抚次数, 1);
});
