/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  冷落预警阈值,
  阶段堕落底线表,
  创建成长账,
  创建余波账,
  记录有效成长,
  计算余波所需楼数,
  计算冷落预警档,
  计算第几日下降,
  结算冷落下降,
} = require('../../src/人妻公寓/脚本/游戏逻辑/冷落成长核心.ts');

test('预警在 4/6/12/18 个绝对时段边界切档', () => {
  assert.deepEqual(冷落预警阈值, [4, 6, 12, 18]);
  assert.equal(计算冷落预警档(3), 0);
  assert.equal(计算冷落预警档(4), 1);
  assert.equal(计算冷落预警档(5), 1);
  assert.equal(计算冷落预警档(6), 2);
  assert.equal(计算冷落预警档(11), 2);
  assert.equal(计算冷落预警档(12), 3);
  assert.equal(计算冷落预警档(17), 3);
  assert.equal(计算冷落预警档(18), 4);
});

test('一次跳过多个时段只返回当前最高预警档', () => {
  assert.equal(计算冷落预警档(90), 4);
});

test('每日下降为 2/3/4/5，第四日后封顶为 5', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 8].map(计算第几日下降), [0, 2, 3, 4, 5, 5, 5]);
});

test('一天为 6 个绝对时段，惰性结算跨天累计且同一日不重复扣除', () => {
  const 未满一天 = 结算冷落下降({
    当前堕落值: 80,
    当前阶段: 3,
    已结算冷落日: 0,
    距上次成长钟楼: 5,
  });
  assert.equal(未满一天.堕落值, 80);

  const 跳到第三日 = 结算冷落下降({
    当前堕落值: 80,
    当前阶段: 3,
    已结算冷落日: 0,
    距上次成长钟楼: 18,
  });
  assert.equal(跳到第三日.计划下降, 2 + 3 + 4);
  assert.equal(跳到第三日.堕落值, 71);
  assert.equal(跳到第三日.新增冷落日, 3);

  const 重复结算 = 结算冷落下降({
    当前堕落值: 跳到第三日.堕落值,
    当前阶段: 3,
    已结算冷落日: 跳到第三日.已结算冷落日,
    距上次成长钟楼: 18,
  });
  assert.equal(重复结算.计划下降, 0);
  assert.equal(重复结算.堕落值, 71);
});

test('堕落下降不会越过当前阶段底线', () => {
  assert.deepEqual(阶段堕落底线表, [0, 0, 20, 40, 65, 90]);
  const 结果 = 结算冷落下降({
    当前堕落值: 46,
    当前阶段: 3,
    已结算冷落日: 0,
    距上次成长钟楼: 18,
  });

  assert.equal(结果.阶段底线, 40);
  assert.equal(结果.计划下降, 9);
  assert.equal(结果.实际下降, 6);
  assert.equal(结果.堕落值, 40);
  assert.equal(结果.本次触底, true);
  assert.equal(结果.受阶段底线限制, true);
});

test('已经位于阶段底线时不伪报为本次触底', () => {
  const 结果 = 结算冷落下降({
    当前堕落值: 65,
    当前阶段: 4,
    已结算冷落日: 0,
    距上次成长钟楼: 6,
  });
  assert.equal(结果.堕落值, 65);
  assert.equal(结果.本次触底, false);
  assert.equal(结果.受阶段底线限制, true);
});

test('异常值若已低于阶段线，冷落结算不会把堕落值反向抬高', () => {
  const 结果 = 结算冷落下降({
    当前堕落值: 38,
    当前阶段: 3,
    已结算冷落日: 0,
    距上次成长钟楼: 6,
  });
  assert.equal(结果.阶段底线, 40);
  assert.equal(结果.堕落值, 38);
  assert.equal(结果.实际下降, 0);
  assert.equal(结果.本次触底, false);
});

test('三天冷落对应十个正文安抚楼', () => {
  assert.equal(计算余波所需楼数(18), 10);
  assert.equal(计算余波所需楼数(6), 6);
  assert.equal(计算余波所需楼数(24), 12);
  assert.equal(计算余波所需楼数(999), 18);
});

test('记录有效成长返回新账并清零冷落结算水位', () => {
  const 原账 = {
    ...创建成长账(5),
    成长轮次: 2,
    已结算冷落日: 3,
  };
  const 新账 = 记录有效成长(原账, 60);

  assert.notEqual(新账, 原账);
  assert.deepEqual(原账, {
    上次有效成长钟楼: 5,
    成长轮次: 2,
    已结算冷落日: 3,
  });
  assert.deepEqual(新账, {
    上次有效成长钟楼: 60,
    成长轮次: 3,
    已结算冷落日: 0,
  });
  assert.deepEqual(创建余波账(), {
    状态: '无',
    触发钟楼: -1,
    需安抚楼: 0,
    已安抚楼: 0,
    上次安抚正文楼: -1,
  });
});

test('成长账以 -1 表示尚未校准，不把开局零点误作历史成长', () => {
  assert.deepEqual(创建成长账(), {
    上次有效成长钟楼: -1,
    成长轮次: 0,
    已结算冷落日: 0,
  });
});
