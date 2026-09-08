/* eslint-disable import-x/no-nodejs-modules -- Node-only regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 结算成功现场楼, 亲密场景许可阶段 } = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');

function fresh(choice = '退出关系') {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) } });
  data.户['201'].妻.当前阶段 = 5;
  data.系统._许曼君分居.玩家最终关系选择 = choice;
  data.玩家资源.体力.当前值 = 5;
  return data;
}

function settle(data) {
  const old = lodash.cloneDeep(data);
  return 结算成功现场楼(data, old, {
    场景: '201',
    楼层: 60,
    行动: '和许曼君做爱',
    正文: '许曼君主动接受玩家，两人明确发生了亲密性行为。',
    本楼事件: '',
    妻在场: ['201'],
    实际尺度: { 201: 3 },
    资源计费: true,
  });
}

test('PLAY-003 退出关系后普通回合即使模型误演亲密也必须失败关闭，不能提交正文、建账或扣体力', () => {
  const data = fresh('退出关系');
  const before = lodash.cloneDeep(data);
  assert.throws(() => settle(data), /退出关系|普通亲密|不能建立/u);
  assert.equal(data.系统._性爱场景.状态, '空闲');
  assert.equal(data.玩家资源.体力.当前值, before.玩家资源.体力.当前值);
  assert.equal(data.系统._许曼君分居.玩家最终关系选择, '退出关系');
});

test('PLAY-003 退出关系同时限制普通亲密提示尺度，但不改角色硬成长阶段', () => {
  const data = fresh('退出关系');
  assert.equal(data.户['201'].妻.当前阶段, 5);
  assert.ok(亲密场景许可阶段(data, '201') <= 2);
});

test('继续关系与暂不承诺仍允许原普通亲密建账', () => {
  for (const choice of ['继续关系', '暂不承诺']) {
    const data = fresh(choice);
    const result = settle(data);
    assert.equal(result.性爱开始, true, choice);
    assert.equal(data.系统._性爱场景.状态, '进行中', choice);
  }
});

test('旧档未知关系保持原兼容语义，不因缺字段被视为退出', () => {
  const data = fresh('');
  const result = settle(data);
  assert.equal(result.性爱开始, true);
});
