/* eslint-disable import-x/no-nodejs-modules -- 真实抽签、拍推进、离场、旧档恢复与数值边界。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/荣耀洞.ts');

function start(room = '101', frozen = false) {
  for (let time = 0; time < 1000; time++) {
    const data = Schema.parse({ 户: { [room]: 创建户节点(0) }, 系统: { _绝对时段: time } });
    Object.assign(data.户[room].妻, { 当前阶段: 5, 好感值: 50, 堕落值: 50 });
    data.户[room].夫.疑心值 = 10;
    if (frozen) data.户[room].夫._疑心冻结至 = time + 1;
    route.使用荣耀洞(data, 20);
    if (data.系统._荣耀洞门牌 === room && data.系统._荣耀洞夫) return data;
  }
  assert.fail('真实抽签未找到具有丈夫到场分支的检查点');
}
for (const room of ['101', '102', '201', '202', '301']) {
  test(`SNAP10 ${room}：第一拍不记到场后果，第二拍提交后只记一次`, () => {
    let data = start(room);
    assert.equal(route.荣耀洞当前事件(data).includes('复合事件:'), false);
    const total = route.荣耀洞总拍(room);
    route.推进荣耀洞隔离拍(data);
    assert.equal(data.系统._荣耀洞拍, 1);
    assert.equal(route.荣耀洞当前事件(data).includes('复合事件:'), true);
    assert.equal(data.户[room].夫.疑心值, 10);
    data = Schema.parse(JSON.parse(JSON.stringify(data)));
    route.推进荣耀洞隔离拍(data);
    assert.equal(data.户[room].夫.疑心值, 12);
    for (let beat = 2; beat < total; beat++) route.推进荣耀洞隔离拍(data);
    assert.equal(data.系统._荣耀洞拍, -1);
    assert.equal(data.户[room].夫.疑心值, 12);
    assert.equal(data.户[room].妻.好感值, 52);
    const completed = structuredClone(data);
    route.推进荣耀洞隔离拍(data);
    assert.deepEqual(data, completed);
  });
}
test('SNAP10 首拍后离场保留冷却，不产生未演到场的疑心或完成奖励', () => {
  const data = start();
  const cooldown = data.系统._荣耀洞上次时段;
  route.推进荣耀洞隔离拍(data);
  assert.equal(route.荣耀洞离场(data).变动, true);
  assert.equal(data.户['101'].夫.疑心值, 10);
  assert.equal(data.户['101'].妻.好感值, 50);
  assert.equal(data.系统._荣耀洞上次时段, cooldown);
});
test('SNAP10 第二拍已完成后离场保留真实到场后果，冻结道具继续生效', () => {
  for (const frozen of [false, true]) {
    const data = start('101', frozen);
    route.推进荣耀洞隔离拍(data);
    route.推进荣耀洞隔离拍(data);
    route.荣耀洞离场(data);
    assert.equal(data.户['101'].夫.疑心值, frozen ? 10 : 12);
    assert.equal(data.户['101'].妻.好感值, 50);
  }
});
