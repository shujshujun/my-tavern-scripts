/* eslint-disable import-x/no-nodejs-modules -- deterministic property/regression audit */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点, 迁移MVU存档到当前版本, 当前MVU数据版本 } = require('../../src/人妻公寓/schema.ts');
const { 创建成长账, 创建余波账, 阶段堕落底线表 } = require('../../src/人妻公寓/脚本/游戏逻辑/冷落成长核心.ts');
const { 结算妻冷落, 计算妻冷落预警档 } = require('../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts');
const { 规范变量协议候选 } = require('../../src/人妻公寓/脚本/游戏逻辑/变量块协议.ts');

function 随机源(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function 整数(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

test('冷落结算五千组确定性模糊：有界、同刻幂等、联系不制造成长且未来保护不追扣', () => {
  const rand = 随机源(0x080083);
  for (let i = 0; i < 5000; i++) {
    const 阶段 = 整数(rand, 0, 5);
    const 当前 = 整数(rand, 0, 600);
    const 上次成长 = rand() < 0.08 ? -1 : 整数(rand, 0, 当前);
    const 成长轮次 = 整数(rand, 0, 40);
    const 已结算冷落日 = 整数(rand, 0, 20);
    const 初值 = 整数(rand, 0, 100);
    const 母亲入列 = rand() >= 0.5;
    const 门牌 = rand() < 0.15 ? '302' : '101';
    const 联系模式 = 整数(rand, 0, 3);
    const 保护至 =
      联系模式 === 0
        ? undefined
        : 联系模式 === 1
          ? 整数(rand, 0, 当前)
          : 联系模式 === 2
            ? 当前
            : 当前 + 整数(rand, 1, 12);
    const 妻 = {
      好感值: 50,
      堕落值: 初值,
      当前阶段: 阶段,
      身体开发: { 小嘴: 0, 胸部: 0, 小屄: 0, 屁穴: 0 },
      _成长账: { ...创建成长账(上次成长), 成长轮次, 已结算冷落日 },
      _冷落余波: 创建余波账(),
    };
    const 原成长轮次 = 妻._成长账.成长轮次;
    const 第一次 = 结算妻冷落(门牌, 妻, 当前, 母亲入列, 保护至);
    assert.ok(Number.isFinite(妻.堕落值));
    assert.ok(妻.堕落值 >= 0 && 妻.堕落值 <= 100);
    assert.ok(妻.堕落值 <= 初值, '冷落不得反向增加堕落值');
    assert.equal(妻._成长账.成长轮次, 原成长轮次, '联系与冷落都不是成长');
    assert.ok(第一次.实际下降 >= 0);
    assert.ok(第一次.实际下降 <= 第一次.计划下降);
    if (保护至 !== undefined && 保护至 >= 当前 && 妻._成长账.上次有效成长钟楼 >= 0) {
      assert.equal(第一次.实际下降, 0, '保护覆盖当前时段时不得追扣');
      assert.equal(计算妻冷落预警档(门牌, 妻, 当前, 母亲入列, 保护至), 妻._冷落余波.状态 === '待诉苦' ? 5 : 0);
    }

    const 一次后 = structuredClone(妻);
    const 第二次 = 结算妻冷落(门牌, 妻, 当前, 母亲入列, 保护至);
    assert.deepEqual(妻, 一次后, '同一绝对时段重复结算必须幂等');
    assert.equal(第二次.实际下降, 0);
    if (阶段 >= 2 && (门牌 !== '302' || 母亲入列) && 初值 >= 阶段堕落底线表[阶段]) {
      assert.ok(妻.堕落值 >= 阶段堕落底线表[阶段]);
    }
  }
});

test('变量协议两千组确定性模糊：合法 replace 归一幂等，结构和值不丢失', () => {
  const rand = 随机源(0x6902);
  const 值池 = [null, false, true, 0, 1, -1, 3.5, '', '平静', '含有 <JSONPatch> 的普通字符串'];
  for (let i = 0; i < 2000; i++) {
    const 数量 = 整数(rand, 0, 8);
    const patch = Array.from({ length: 数量 }, (_, index) => ({
      op: 'replace',
      path: `/户/101/妻/字段${i}_${index}`,
      value: 值池[整数(rand, 0, 值池.length - 1)],
    }));
    const 输入 = `<UpdateVariable><JSONPatch>${JSON.stringify(patch)}</JSONPatch></UpdateVariable>`;
    const 一次 = 规范变量协议候选(输入);
    assert.ok(一次);
    const 二次 = 规范变量协议候选(一次);
    assert.equal(二次, 一次, '标准化必须幂等');
    const 数组文本 = 一次.match(/<JSONPatch>\s*([\s\S]*?)\s*<\/JSONPatch>/)?.[1] ?? '';
    assert.deepEqual(JSON.parse(数组文本), patch);
  }
});

test('v7/v8 到 v9 的随机缺字段迁移保持输入不可变、结果可解析且二次迁移幂等', () => {
  const rand = 随机源(0x070809);
  for (let i = 0; i < 600; i++) {
    const data = Schema.parse({ 户: { 101: 创建户节点(整数(rand, 0, 30)), 302: 创建户节点(整数(rand, 0, 30)) } });
    data.系统._数据版本 = rand() < 0.5 ? 7 : 8;
    if (rand() < 0.5) delete data.系统._孕情初见评价楼;
    if (rand() < 0.5) delete data.系统._上次性爱结果.收尾对象门牌;
    for (const 门牌 of ['101', '302']) {
      if (rand() < 0.5) delete data.户[门牌].妻._冷落余波.送礼安抚日;
      if (rand() < 0.5) delete data.户[门牌].妻._冷落余波.当日送礼安抚次数;
      if (rand() < 0.5) delete data.户[门牌].妻._怀孕;
    }
    const 输入快照 = structuredClone(data);
    const 迁移 = 迁移MVU存档到当前版本(data);
    assert.deepEqual(data, 输入快照, '迁移不得原地污染旧档');
    const 解析 = Schema.parse(迁移);
    assert.equal(解析.系统._数据版本, 当前MVU数据版本);
    assert.deepEqual(迁移MVU存档到当前版本(迁移), 迁移, '迁移结果再次迁移必须幂等');
    assert.doesNotThrow(() => Schema.parse(JSON.parse(JSON.stringify(解析))));
  }
});
