/* eslint-disable import-x/no-nodejs-modules -- Node-only lifecycle regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 经济配置 } = require('../../src/人妻公寓/stageConfig.ts');
const { 经济结算 } = require('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts');

function expired() {
  const data = Schema.parse({ 户: { 301: 创建户节点(0) }, 现金: 100000, 胜任度: 0 });
  data.系统._通牒期 = 1;
  data.系统._上次上交期 = 1;
  data.系统._绝对时段 = 经济配置.收租周期时段 * 2;
  data.系统._管理考核.通牒主因 = '账目亏空';
  data.系统._管理考核.通牒原因 = '上一期账目尚未补足';
  data.系统._安若妍不必停.阶段 = '亲密前半';
  return data;
}

test('线路活动票期间照常记账，通牒留到场景结束后的同一期移交，重试不重复扣款', () => {
  const data = expired();
  Object.assign(data.系统._场景剧情事务, { id: 'route-ticket', 目标场景: '301' });
  const ticket = lodash.cloneDeep(data.系统._场景剧情事务);
  经济结算(data);
  assert.equal(data.系统._坏结局, '');
  assert.equal(data.系统._通牒期, 1);
  assert.equal(data.系统._上次上交期, 2, '房租与经营考核仍推进');
  assert.deepEqual(data.系统._场景剧情事务, ticket);
  const money = data.现金;
  经济结算(data);
  assert.equal(data.现金, money);
  assert.equal(data.系统._坏结局, '');
  data.系统._场景剧情事务.id = '';
  const notices = 经济结算(data);
  assert.ok(data.系统._坏结局);
  assert.ok(notices.some(x => x.includes('考验失败')));
  assert.equal(data.现金, money);
  assert.deepEqual(经济结算(data), []);
});

test('等待预约而没有活动演出时不全局冻结；正在进行的线路普通场次先收束', () => {
  const waiting = expired();
  waiting.系统._安若妍不必停.阶段 = '等待预约夜';
  经济结算(waiting);
  assert.ok(waiting.系统._坏结局);
  const playing = expired();
  Object.assign(playing.系统._性爱场景, { 状态: '进行中', 场次标识: 'route-scene', 主焦点门牌: '301' });
  经济结算(playing);
  assert.equal(playing.系统._坏结局, '');
  playing.系统._性爱场景.状态 = '空闲';
  经济结算(playing);
  assert.ok(playing.系统._坏结局);
});

test('恢复、回档与实际挽回按当前事实处理，不把延后写成已经失败', () => {
  const data = expired();
  data.系统._场景剧情事务.id = 'active';
  const before = lodash.cloneDeep(data);
  经济结算(data);
  const restored = Schema.parse(data);
  经济结算(restored);
  assert.equal(restored.系统._坏结局, '');
  restored.胜任度 = 100;
  restored.系统._场景剧情事务.id = '';
  经济结算(restored);
  assert.equal(restored.系统._坏结局, '');
  assert.equal(restored.系统._通牒期, -1);
  before.系统._通牒期 = -1;
  before.系统._绝对时段 = 0;
  before.系统._上次上交期 = 0;
  before.系统._场景剧情事务.id = '';
  经济结算(before);
  assert.equal(before.系统._坏结局, '');
});

test('已接通的电话先收尾，只有筹备表或已结束父亲审核不会获得错误终局', () => {
  const phone = expired();
  Object.assign(phone.系统._父亲通话, { 标识: 'accepted-call', 状态: '通话中' });
  经济结算(phone);
  assert.equal(phone.系统._坏结局, '');
  assert.equal(phone.系统._父亲通话.标识, 'accepted-call');
  phone.系统._父亲通话.状态 = '';
  经济结算(phone);
  assert.ok(phone.系统._坏结局);
  const preparing = expired();
  Object.assign(preparing.系统._特殊场景, { id: '静音会议', 阶段: '筹备' });
  经济结算(preparing);
  assert.ok(preparing.系统._坏结局, '打开筹备界面不能冻结经营考核');
  const completed = expired();
  completed.系统._已完成特殊场景.push('双重继承');
  经济结算(completed);
  assert.equal(completed.系统._坏结局, '');
  assert.equal(completed.系统._通牒期, -1);
});

test('演出期间跨三期的账目与逐期推进一致，结束时仍只有一次终局移交', () => {
  const jump = expired();
  jump.系统._场景剧情事务.id = 'active';
  const gradual = lodash.cloneDeep(jump);
  jump.系统._绝对时段 = 经济配置.收租周期时段 * 4;
  经济结算(jump);
  for (let period = 2; period <= 4; period++) {
    gradual.系统._绝对时段 = 经济配置.收租周期时段 * period;
    经济结算(gradual);
  }
  assert.equal(jump.现金, gradual.现金);
  assert.equal(jump.系统._上次上交期, 4);
  assert.equal(jump.系统._通牒期, 1);
  assert.equal(jump.系统._坏结局, '');
  jump.系统._场景剧情事务.id = '';
  经济结算(jump);
  assert.ok(jump.系统._坏结局);
  assert.deepEqual(经济结算(jump), []);
});
