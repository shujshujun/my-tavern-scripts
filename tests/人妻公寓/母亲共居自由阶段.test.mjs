/* eslint-disable import-x/no-nodejs-modules -- Node-only compatibility contract */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const legacy = require('../../src/人妻公寓/脚本/游戏逻辑/母亲共居系统.ts');

test('旧模块同步只委托 `_302共居`，不会重新创建 `_母亲共居`', () => {
  const data = Schema.parse({ 户: { 302: 创建户节点(0) }, 系统: { _绝对时段: 6, _双重继承: { 阶段: '已完成' }, _已完成特殊场景: ['双重继承'] } });
  assert.equal(legacy.同步母亲共居状态(data, 20), true);
  assert.equal(data.系统._302共居.状态, '共居');
  assert.equal('_母亲共居' in data.系统, false);
  assert.equal(legacy.同步母亲共居状态(data, 21), false);
});

test('旧剧情票入口失败关闭，不能在AI正文前提交第二套生活账', () => {
  const data = Schema.parse({ 户: { 302: 创建户节点(0) }, 系统: { _绝对时段: 6, _双重继承: { 阶段: '已完成' }, _已完成特殊场景: ['双重继承'] } });
  legacy.同步母亲共居状态(data);
  const before = lodash.cloneDeep(data.系统._302共居);
  const result = legacy.执行母亲共居动作(data, legacy.母亲共居动作ID表.玩家开始, '302');
  assert.equal(result.成功, false);
  assert.deepEqual(data.系统._302共居, before);
  assert.equal(legacy.解析母亲共居剧情事件('【母亲共居提交:B:1:6:0】'), null);
});

test('旧背景与短状态导出读取主账，旧可写视图只作兼容且不破坏入参', () => {
  const data = Schema.parse({ 户: { 302: 创建户节点(0) }, 系统: { _绝对时段: 6, _双重继承: { 阶段: '已完成' }, _已完成特殊场景: ['双重继承'] } });
  legacy.同步母亲共居状态(data);
  assert.equal(legacy.母亲共居背景语义键(data), '302_共居_早晨');
  assert.match(legacy.母亲共居AI短状态(data), /302自由阶段/);
  assert.match(legacy.母亲共居AI短状态(data), /和她亲密/);
  const input = { 户: { 302: { 妻: { 好感值: 100, 堕落值: 100, 身体开发: {}, 当前情绪: '安稳', 当前心理想法: '想喝茶' } } } };
  const output = legacy.封存母亲自由阶段可写视图(data, input);
  assert.deepEqual(Object.keys(output.户[302].妻).sort(), ['当前心理想法', '当前情绪'].sort());
  assert.equal(input.户[302].妻.好感值, 100);
});
