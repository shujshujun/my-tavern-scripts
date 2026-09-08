/* eslint-disable import-x/no-nodejs-modules -- Actual calendar projection, readiness, producer, commit and advancement gate. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.getVariables = () => ({ _场景: { 房间id: '102' }, _粘滞: null, _赴约: null });
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const stage = require('../../src/人妻公寓/脚本/游戏逻辑/阶段线路系统.ts');
const clock = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const settlement = require('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts');
const clone = lodash.cloneDeep;

function ready(room, target, node, time = 0) {
  const data = Schema.parse({ 户: { [room]: 创建户节点(0) }, 系统: { _绝对时段: time } });
  const wife = data.户[room].妻;
  wife.当前阶段 = target - 1;
  Object.assign(wife._阶段线路, { 目标阶段: target, 活跃节点: node, 完成位图: (1 << node) - 1, 节点起始楼: 0 });
  stage.刷新阶段预约(data, room);
  return data;
}
const input = (room, target, node, location) => ({ 类型: '地点', 门牌: room, 地点: location, 预期目标阶段: target, 预期节点: node });

test('PLAY037沈静仪检修节点：自然在家可演，导演使用当前现场而非未来周四预约', () => {
  const data = ready('102', 4, 1);
  const wife = data.户['102'].妻;
  const time = Array.from({ length: 42 }, (_, i) => i).find(i => !clock.阶段预约当前有效(wife._阶段线路, i) && clock.妻位置推算('102', i, data.户['102']) === '102');
  assert.notEqual(time, undefined); data.系统._绝对时段 = time;
  const event = input('102', 4, 1, '102');
  assert.equal(stage.列出阶段线路候选详情(data, event).length, 1);
  const ticket = stage.构造阶段线路剧情事件(data, event);
  assert.equal(ticket.成功, true);
  assert.doesNotMatch(ticket.事件, /这是已生效的剧情日程/);
  assert.match(ticket.事件, /当前现场/);
  assert.equal(stage.提交阶段线路剧情(data, ticket.事件, '102').length, 1);
  assert.equal(wife._阶段线路.活跃节点, 2);
});

test('PLAY037沈静仪最后节点：自然同场完成后立即可晋阶，不另等周三', () => {
  const data = ready('102', 5, 3); data.系统._绝对时段 = 4;
  assert.equal(clock.阶段预约当前有效(data.户['102'].妻._阶段线路, 4), false);
  const ticket = stage.构造阶段线路剧情事件(data, input('102', 5, 3, '102'));
  assert.equal(ticket.成功, true);
  assert.equal(stage.提交阶段线路剧情(data, ticket.事件, '102').length, 1);
  assert.equal(settlement.晋阶预约现场已满足(data, '102', '102'), true);
  const reloaded = Schema.parse(JSON.parse(JSON.stringify(data)));
  assert.equal(settlement.晋阶预约现场已满足(reloaded, '102', '102'), true, '已完成旧档重载仍按同一现场门');
  assert.doesNotMatch(settlement.晋阶预约现场提示(data, '102'), /请在星期三/);
  data.系统._绝对时段 = 2;
  assert.equal(settlement.晋阶预约现场已满足(data, '102', '102'), false, '最终节点仍要求晚上');
});

test('PLAY037非自然到场的管理员室预约仍提供必要人物，不凭放宽星期召唤她', () => {
  const data = ready('201', 2, 3);
  const event = input('201', 2, 3, '管理员室');
  data.系统._绝对时段 = 4;
  assert.equal(stage.构造阶段线路剧情事件(data, event).成功, false);
  data.系统._绝对时段 = data.户['201'].妻._阶段线路.预约绝对时段;
  const ticket = stage.构造阶段线路剧情事件(data, event);
  assert.equal(ticket.成功, true); assert.match(ticket.事件, /阶段预约/);
  stage.提交阶段线路剧情(data, ticket.事件, '管理员室');
  assert.equal(settlement.晋阶预约现场已满足(data, '201', '管理员室'), true);
  assert.equal(settlement.晋阶预约现场已满足(data, '201', '201'), false);
});

for (const row of stage.读取阶段线路审计矩阵().filter(x => x.事件类型.includes('地点'))) {
  test(`PLAY037逐节点保持准入/提交/晋阶一致 ${row.门牌}:${row.目标阶段}:${row.节点}`, () => {
    const base = ready(row.门牌, row.目标阶段, row.节点);
    for (let time = 0; time < 84; time++) {
      const data = clone(base); data.系统._绝对时段 = time;
      const event = input(row.门牌, row.目标阶段, row.节点, row.预约.地点);
      const candidates = stage.列出阶段线路候选详情(data, event);
      const ticket = stage.构造阶段线路剧情事件(data, event);
      assert.equal(ticket.成功, candidates.length === 1, `time=${time}`);
      if (!ticket.成功) continue;
      if (!clock.阶段预约当前有效(data.户[row.门牌].妻._阶段线路, time)) assert.doesNotMatch(ticket.事件, /这是已生效的剧情日程/);
      assert.equal(stage.提交阶段线路剧情(data, ticket.事件, row.预约.地点).length, 1);
      const after = clone(data);
      assert.equal(stage.提交阶段线路剧情(data, ticket.事件, row.预约.地点).length, 0);
      assert.deepEqual(data, after);
      if (row.节点 === 3) assert.equal(settlement.晋阶预约现场已满足(data, row.门牌, row.预约.地点), true, `ready but advance refused at ${time}`);
    }
  });
}
