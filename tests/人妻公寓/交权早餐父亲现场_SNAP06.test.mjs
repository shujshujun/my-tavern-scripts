/* eslint-disable import-x/no-nodejs-modules -- Real route, snapshot and writable-scope regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
let vars = {};
globalThis.getVariables = () => vars;
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');
const snapshot = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const mvu = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const scenes = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');

function fresh() {
  const d = Schema.parse({ 现金: 10000, 胜任度: 100, 户: { 302: 创建户节点(0) },
    系统: { _绝对时段: 20, _母亲入列: true, _已完成特殊场景: ['回国'], _回国: { 阶段: '已完成' } } });
  d.户['302'].妻.当前阶段 = 5;
  return d;
}
function journey() {
  const d = fresh(), points = [];
  assert.equal(route.购买双重继承场景票(d, 1500).成功, true);
  assert.equal(route.使用双重继承场景票(d, '管理员室', 1).成功, true);
  if (d.系统._双重继承.阶段 === '待父亲回楼') {
    d.系统._绝对时段 = d.系统._双重继承.最早父亲到楼时段;
    assert.equal(route.同步双重继承时间节点(d, 2).成功, true);
  }
  for (const place of route.双重继承公共区域) {
    assert.equal(route.执行双重继承地点动作(d, '检查公共区域', place, 10).成功, true);
  }
  let next = route.执行双重继承地点动作(d, '管理员室交权', '管理员室', 20);
  for (let beat = 1; beat <= 2; beat++) {
    const event = next.事件 ?? next.后续剧情.事件;
    points.push({ d: structuredClone(d), event, place: '管理员室', label: `H${beat}` });
    next = route.提交双重继承剧情事件(d, event, '管理员室', 20 + beat);
    assert.equal(next.成功, true);
  }
  assert.equal(route.执行双重继承地点动作(d, '领取总钥匙', '管理员室', 23).成功, true);
  const waiting = structuredClone(d);
  d.系统._绝对时段 = d.系统._双重继承.最早早餐日 * 6;
  next = route.执行双重继承地点动作(d, '家庭早餐', '302', 30);
  for (let beat = 1; beat <= 5; beat++) {
    const event = next.事件 ?? next.后续剧情.事件;
    points.push({ d: structuredClone(d), event, place: '302', label: `B${beat}` });
    next = route.提交双重继承剧情事件(d, event, '302', 30 + beat);
    assert.equal(next.成功, true);
  }
  return { points, waiting, after: d };
}
const state = journey();
function inspect(d, event, place, sticky = false) {
  vars = { _场景: { 房间id: place, 进房末楼: 39 },
    ...(sticky ? { _粘滞: { 位置: place, 楼: 39, 们: ['302'], 夫们: ['302'] } } : {}) };
  const before = structuredClone(d);
  const people = snapshot.检测焦点([{ role: 'user', content: '继续当前谈话。' }], d, 40, event);
  const text = snapshot.组公寓快照([{ role: 'user', content: '继续当前谈话。' }], d, 40, event, people);
  const scope = mvu.构造AI可写变量范围(d, people.焦点, people.妻在场, people.夫在场, { 只读: false, 亲密场景: false });
  assert.deepEqual(d, before, 'Projection must not mutate route, actors, property or time');
  return { people, text, scope };
}
for (const point of state.points) {
  test(`${point.label}真实生产票签父亲在场，并进入快照/可写范围`, () => {
    const result = inspect(point.d, point.event, point.place);
    assert.deepEqual(result.people.夫在场, ['302']);
    assert.deepEqual(result.scope.夫, ['302']);
    assert.equal(result.text.includes('丈夫(父亲):在当前场景'), true);
    assert.equal(result.text.includes('丈夫(父亲):在当前场景，状态外出'), false);
    assert.equal(point.event.includes('【事件在场夫:302】'), true);
  });
  test(`${point.label}旧关联票及JSON重载仍按有效当前现场投影`, () => {
    const d = Schema.parse(JSON.parse(JSON.stringify(point.d)));
    const event = point.event.replace('【事件在场夫:302】', '【事件关联夫:302】');
    const result = inspect(d, event, point.place);
    assert.deepEqual(result.people.夫在场, ['302']);
    assert.deepEqual(result.scope.夫, ['302']);
  });
}

for (const point of [state.points[0], state.points[2]]) {
  for (const kind of ['错地点', '旧时段', '错阶段', '其他活动票', '父亲电话占用']) {
    test(`${point.label}${kind}不得借新旧标签或粘滞把父亲带进来`, () => {
      const d = structuredClone(point.d);
      let place = point.place;
      if (kind === '错地点') place = '101';
      if (kind === '旧时段') d.系统._绝对时段++;
      if (kind === '错阶段') d.系统._双重继承.阶段 = '待父亲回楼';
      if (kind === '其他活动票') Object.assign(d.系统._场景剧情事务, { id: 'other', 内容: '【别的任务】仍在进行', 状态: '生成中' });
      if (kind === '父亲电话占用') d.系统._父亲通话.状态 = '等待接听';
      const event = point.event.replace('【事件关联夫:302】', '【事件在场夫:302】');
      const result = inspect(d, event, place, true);
      assert.equal(result.people.夫在场.includes('302'), false);
      assert.equal(result.scope.夫.includes('302'), false);
    });
  }
}

test('早餐等待不等于每个地点父亲都在场', () => {
  assert.equal(route.双重继承父亲暂住302(state.waiting), true);
  for (const place of ['101', '公寓外部']) assert.equal(inspect(state.waiting, '', place).people.夫在场.includes('302'), false);
});

test('父亲暂住期间302普通聊天不依赖旧粘滞，重载后仍在场', () => {
  for (const d of [state.waiting, Schema.parse(JSON.parse(JSON.stringify(state.waiting)))]) {
    for (const sticky of [false, true]) {
      const result = inspect(d, '', '302', sticky);
      assert.deepEqual(result.people.夫在场, ['302']);
      assert.deepEqual(result.scope.夫, ['302']);
      assert.equal(result.text.includes('丈夫(父亲):在当前场景，状态外出'), false);
    }
  }
});

test('早餐结束/机场/终幕剔除旧父亲粘滞，保留母亲', () => {
  for (const stage of ['待机场视频', '视频已预约', '待总钥匙归位', '已完成']) {
    const d = structuredClone(state.after); d.系统._双重继承.阶段 = stage;
    const event = stage === '待总钥匙归位'
      ? `【事件在场妻:302】【双重继承提交:K:待总钥匙归位:${d.系统._绝对时段}:1】` : '';
    const result = inspect(d, event, '302', true);
    assert.equal(result.people.夫在场.includes('302'), false, stage);
    assert.equal(result.scope.夫.includes('302'), false, stage);
    assert.equal(result.people.妻在场.includes('302'), true, stage);
  }
});

test('其他独立明确到场事件可声明父亲，当前修复不覆盖它', () => {
  const result = inspect(state.after, '【事件在场妻:302】【事件在场夫:302】另一项明确到访', '302', true);
  assert.equal(result.people.夫在场.includes('302'), true);
});

test('失败重试保留同一H票，已完成后旧H票不能重新获得父亲写权', () => {
  const p = state.points[0], d = structuredClone(p.d);
  const active = scenes.激活新增场景剧情(d, { 内容: p.event, 目标场景: p.place, 行动: '继续', 触发楼层: 20 });
  assert.equal(active.成功, true);
  assert.equal(scenes.标记场景剧情待重试(d, active.事务.id, active.事务.请求世代), true);
  const retry = scenes.准备重试场景剧情(d, p.place, active.事务.id);
  assert.equal(retry.成功, true);
  assert.equal(inspect(d, retry.事务.内容, p.place).people.夫在场.includes('302'), true);
  const future = structuredClone(d); future.系统._双重继承.阶段 = '已完成';
  assert.equal(inspect(future, retry.事务.内容, p.place, true).scope.夫.includes('302'), false);
  assert.equal(inspect(d, retry.事务.内容, p.place).scope.夫.includes('302'), true, 'Rollback reads original facts without cache');
});
