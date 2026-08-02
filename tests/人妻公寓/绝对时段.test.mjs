/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');

const { Schema, 当前MVU数据版本 } = require('../../src/人妻公寓/schema.ts');
const 时钟模块 = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const {
  星期列表,
  时段列表,
  取绝对时段,
  当前时段,
  当前天数,
  当前周数,
  当前星期,
  读取世界时间,
  推进时段,
  推进到次日早晨,
  旧钟楼转时段,
  妻位置推算,
  丈夫状态推算,
} = 时钟模块;
const { 执行时间推进事务 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');

test('Schema 只持久化 0 基绝对时段，新旧字段不会并存', () => {
  const data = Schema.parse({
    系统: {
      _数据版本: 当前MVU数据版本,
      _绝对时段: 17.9,
      _时段偏移楼: 99,
      _上次杀时间楼层: 88,
    },
  });
  assert.equal(data.系统._绝对时段, 17);
  assert.equal('_时段偏移楼' in data.系统, false);
  assert.equal('_上次杀时间楼层' in data.系统, false);
});

test('六时段、天、周和星期边界全部由绝对时段派生', () => {
  assert.deepEqual([...时段列表], ['早上', '中午', '下午', '傍晚', '晚上', '深夜']);
  assert.deepEqual([...星期列表], ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']);

  assert.equal(当前时段(0), '早上');
  assert.equal(当前时段(5), '深夜');
  assert.equal(当前时段(6), '早上');
  assert.equal(当前天数(5), 1);
  assert.equal(当前天数(6), 2);
  assert.equal(当前星期(0), '星期一');
  assert.equal(当前星期(36), '星期日');
  assert.equal(当前周数(41), 1);
  assert.equal(当前周数(42), 2);
  assert.equal(当前星期(42), '星期一');
});

test('所有派生函数可直接读取游戏数据，不读取消息楼', () => {
  const data = Schema.parse({ 系统: { _数据版本: 当前MVU数据版本, _绝对时段: 14 } });
  assert.equal(取绝对时段(data), 14);
  assert.equal(当前时段(data), '下午');
  assert.equal(当前天数(data), 3);
  assert.equal(当前周数(data), 1);
  assert.equal(当前星期(data), '星期三');
  assert.deepEqual(读取世界时间(data), {
    绝对时段: 14,
    天数: 3,
    周数: 1,
    星期: '星期三',
    时段: '下午',
    当日时段序号: 2,
  });
});

test('推进原语只增加绝对时段并报告跨天跨周', () => {
  const data = Schema.parse({ 系统: { _数据版本: 当前MVU数据版本, _绝对时段: 41 } });
  const 结果 = 推进时段(data, 1);
  assert.equal(data.系统._绝对时段, 42);
  assert.equal(结果.跨天, true);
  assert.equal(结果.跨周, true);
  assert.equal(结果.新时间.星期, '星期一');
  assert.throws(() => 推进时段(data, -1), RangeError);
  assert.throws(() => 推进时段(data, 1.5), RangeError);
});

test('睡眠跨度总是落到次日早晨', () => {
  const data = Schema.parse({ 系统: { _数据版本: 当前MVU数据版本, _绝对时段: 8 } });
  const 结果 = 推进到次日早晨(data);
  assert.equal(结果.推进时段数, 4);
  assert.equal(data.系统._绝对时段, 12);
  assert.equal(结果.新时间.时段, '早上');

  const 已在早晨 = Schema.parse({ 系统: { _数据版本: 当前MVU数据版本, _绝对时段: 12 } });
  推进到次日早晨(已在早晨);
  assert.equal(已在早晨.系统._绝对时段, 18, '早上睡觉也应前进到下一天，而不是零推进');
});

test('妻与丈夫基础作息固定，不再叠加消息楼或随机扰动', () => {
  assert.equal(妻位置推算('101', 0), '天台');
  assert.equal(妻位置推算('101', 42), '天台', '同一星期同时段每周稳定复现');
  for (let 绝对时段 = 0; 绝对时段 < 42; 绝对时段 += 1) {
    const 期望 = 户静态表['101'].夫作息[当前时段(绝对时段)];
    assert.equal(丈夫状态推算('101', 绝对时段), 期望);
  }
});

test('中央事务是唯一业务推进入口，楼层时钟不再导出绕结算的杀时间', () => {
  globalThis.getVariables = () => ({ _场景: { 房间id: '101' }, _粘滞: null, _赴约: null });
  const data = Schema.parse({ 系统: { _数据版本: 当前MVU数据版本, _绝对时段: 0 } });
  const 结果 = 执行时间推进事务(data, {
    方式: '推进一时段',
    预期绝对时段: 0,
    当前消息楼: 777,
    当前地点: '管理员室',
  });
  assert.equal(结果.成功, true);
  assert.equal(data.系统._绝对时段, 1);
  assert.match(data.系统._待发送事件, /^【时间流逝】/);
  assert.equal(时钟模块.杀时间, undefined);
});

test('旧静态钟楼跨度向上换算，不缩短既有平衡', () => {
  assert.equal(旧钟楼转时段(25), 9);
  assert.equal(旧钟楼转时段(10), 4);
  assert.equal(旧钟楼转时段(6), 2);
  assert.equal(旧钟楼转时段(24), 8);
  assert.equal(旧钟楼转时段(18), 6);
  assert.equal(旧钟楼转时段(-1), 0);
});
