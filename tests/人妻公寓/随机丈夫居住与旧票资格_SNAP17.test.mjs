/* eslint-disable import-x/no-nodejs-modules -- Node regression tests */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 荣耀洞表, 荣耀洞丈夫在场率 } = require('../../src/人妻公寓/stageConfig.ts');
const clock = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/荣耀洞.ts');
const divorce = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
const risk = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');

function fresh(m, time = 22) {
  const d = Schema.parse({ 户: { [m]: 创建户节点(0) }, 系统: { _绝对时段: time } });
  Object.assign(d.户[m].妻, { 当前阶段: 5, 堕落值: 50, 好感值: 50 });
  d.户[m].夫.疑心值 = 17;
  return d;
}
function retired(d) {
  d.系统._已完成特殊场景.push(divorce.许曼君离婚场景ID);
  assert.equal(divorce.同步许曼君离婚完成后状态(d), true);
  assert.equal(d.系统._许曼君离婚.法律离婚已成立, true);
  assert.equal(d.户['201'].夫._居住模式, '正式退居');
  return d;
}
function selectedTime(m, presence = () => true) {
  const d = fresh(m);
  for (let t = 0; t < 1000; t++) {
    if (clock.seededRandom(t, m, '荣耀洞') < 荣耀洞表[m].几率 &&
      clock.seededRandom(t, m, '荣耀洞夫') < 荣耀洞丈夫在场率 && presence(clock.丈夫在楼(d.户[m], m, t))) return t;
  }
  assert.fail('No deterministic sample');
}
function start(d, m, expected) {
  assert.equal(route.使用荣耀洞(d, 20).变动, true);
  assert.equal(d.系统._荣耀洞门牌, m, 'Relationship gate must not remove the wife candidate');
  assert.equal(d.系统._荣耀洞夫, expected);
  const suspicion = d.户[m].夫.疑心值;
  route.推进荣耀洞隔离拍(d);
  assert.equal(route.荣耀洞当前事件(d).includes('复合事件:'), expected);
  assert.equal(d.户[m].夫.疑心值, suspicion, '到场拍尚未提交，资格本身不产生疑心');
  const performed = structuredClone(d);
  route.推进荣耀洞隔离拍(performed);
  assert.equal(performed.户[m].夫.疑心值, suspicion + (expected ? 2 : 0));
}
function pending(d, m, beat = 0) {
  Object.assign(d.系统, { _荣耀洞门牌: m, _荣耀洞拍: beat, _荣耀洞起时段: d.系统._绝对时段,
    _荣耀洞上次时段: d.系统._绝对时段, _荣耀洞点破: true, _荣耀洞夫: true });
  return d;
}

test('原报告时段22：真实完成态规范化后不再抽中退居丈夫', () => {
  const d = retired(fresh('201', 22));
  assert.equal(clock.丈夫在楼(d.户['201'], '201', 22), '外出');
  assert.equal(risk.普通丈夫风险已停用(d, '201'), true);
  assert.ok(clock.seededRandom(22, '201', '荣耀洞夫') < 荣耀洞丈夫在场率);
  start(d, '201', false);
});

for (const mode of ['路线外住', '待离婚交接', '正式退居', '提前通知']) {
  test(`新抽签尊重${mode}，妻候选和冷却仍成立`, () => {
    const time = selectedTime('101'), d = fresh('101', time);
    d.户['101'].夫._居住模式 = mode;
    start(d, '101', false);
    assert.equal(d.系统._荣耀洞上次时段, time);
    assert.equal(d.系统._荣耀洞起时段, time);
  });
}
for (const [label, range, expected] of [
  ['起点', t => [t, t + 1], true], ['窗前', t => [t + 1, t + 2], false],
  ['右端点', t => [t - 1, t], false], ['无效预约', () => [-1, -1], false],
]) {
  test(`常规关系预约${label}按真实在楼资格`, () => {
    const time = selectedTime('101'), d = fresh('101', time), [from, to] = range(time);
    Object.assign(d.户['101'].夫, { _居住模式: '预约回楼', _预约回楼起: from, _预约回楼至: to });
    assert.equal(risk.普通丈夫风险已停用(d, '101'), false);
    start(d, '101', expected);
  });
}

for (const state of ['在家', '睡眠', '外出']) {
  test(`普通作息${state}保留现有概率，仅过滤楼外丈夫`, () => {
    const time = selectedTime('101', x => x === state), d = fresh('101', time);
    start(d, '101', state !== '外出');
  });
}

test('仅购买202道具仍是常规，正式使用后的线路保护优先于预约在家', () => {
  const time = selectedTime('202', x => x !== '外出');
  const bought = fresh('202', time); bought.背包.push('不再留门');
  start(bought, '202', true);
  const active = fresh('202', time);
  active.系统._不再留门.道具已使用 = true;
  Object.assign(active.户['202'].夫, { _居住模式: '预约回楼', _预约回楼起: time, _预约回楼至: time + 1 });
  assert.equal(clock.丈夫在楼(active.户['202'], '202', time), '在家');
  start(active, '202', false);
});

test('201正式关系转变后预约回楼也不会恢复旧随机丈夫冲突', () => {
  const time = selectedTime('201'), d = retired(fresh('201', time));
  Object.assign(d.户['201'].夫, { _居住模式: '预约回楼', _预约回楼起: time, _预约回楼至: time + 1 });
  assert.equal(clock.丈夫在楼(d.户['201'], '201', time), '在家');
  start(d, '201', false);
});

test('旧未演票按当前完成态过滤演员及新增疑心，保留既有疑心', () => {
  const d = retired(pending(fresh('201'), '201'));
  const original = structuredClone(d);
  route.推进荣耀洞隔离拍(d);
  assert.equal(d.系统._荣耀洞拍, 1);
  assert.equal(d.户['201'].夫.疑心值, original.户['201'].夫.疑心值);
  const beforeRead = structuredClone(d), text = route.荣耀洞当前事件(d);
  assert.equal(text.includes('复合事件:'), false);
  assert.equal(route.荣耀洞当前事件(d), text, 'Retry is deterministic');
  assert.deepEqual(d, beforeRead, 'Reading the pending event must not mutate stored facts');
  const restored = Schema.parse(JSON.parse(JSON.stringify(d)));
  assert.equal(route.荣耀洞当前事件(restored), text);
});

test('旧第二拍票只过滤尚未生成的演员，不倒扣过去已经记过的疑心', () => {
  const d = retired(pending(fresh('201'), '201', 1));
  d.户['201'].夫.疑心值 = 29;
  assert.equal(route.荣耀洞当前事件(d).includes('复合事件:'), false);
  route.推进荣耀洞隔离拍(d);
  assert.equal(d.户['201'].夫.疑心值, 29);
});

test('回档到关系完成前按恢复的旧状态运行，不留下跨档资格缓存', () => {
  const time = selectedTime('201', x => x !== '外出'), before = pending(fresh('201', time), '201', 1);
  const completed = retired(structuredClone(before));
  assert.equal(route.荣耀洞当前事件(completed).includes('复合事件:'), false);
  assert.equal(route.荣耀洞当前事件(before).includes('复合事件:'), true);
});

test('既有冻结疑心道具继续生效，资格允许也不新增疑心', () => {
  const time = selectedTime('101', x => x !== '外出'), d = pending(fresh('101', time), '101');
  d.户['101'].夫._疑心冻结至 = time + 1;
  route.推进荣耀洞隔离拍(d);
  assert.equal(d.户['101'].夫.疑心值, 17);
  assert.equal(route.荣耀洞当前事件(d).includes('复合事件:'), true);
});

test('丈夫分支被过滤仍能完成妻子奖励，提前离场仍不奖励', () => {
  const d = retired(pending(fresh('201'), '201'));
  for (let n = 0; n < 3; n++) route.推进荣耀洞隔离拍(d);
  assert.equal(d.户['201'].妻.堕落值, 52);
  assert.equal(d.户['201'].妻.好感值, 52);
  assert.equal(d.户['201'].夫.疑心值, 17);
  assert.equal(d.系统._荣耀洞拍, -1);
  const cancelled = retired(pending(fresh('201'), '201'));
  const cooldown = cancelled.系统._荣耀洞上次时段;
  assert.equal(route.荣耀洞离场(cancelled).变动, true);
  assert.equal(cancelled.户['201'].妻.好感值, 50);
  assert.equal(cancelled.系统._荣耀洞上次时段, cooldown);
});

test('空签、无目标户和302旧夫票均不产生丈夫演员或疑心', () => {
  for (const m of ['空', '302']) {
    const d = pending(fresh('302'), m, 1);
    assert.equal(route.荣耀洞当前事件(d).includes('复合事件:'), false);
    route.推进荣耀洞隔离拍(d);
    assert.equal(d.户['302'].夫.疑心值, 17);
  }
  const d = Schema.parse({ 系统: { _绝对时段: 22 } });
  route.使用荣耀洞(d, 10);
  assert.equal(d.系统._荣耀洞门牌, '空');
  assert.equal(d.系统._荣耀洞夫, false);
});

test('五户普通关系的确定性抽签保留原妻概率与丈夫概率', () => {
  let positive = 0, negative = 0;
  for (const m of ['101', '102', '201', '202', '301']) {
    for (let t = 0; t < 120; t++) {
      const d = fresh(m, t);
      const wife = clock.seededRandom(t, m, '荣耀洞') < 荣耀洞表[m].几率;
      const present = clock.丈夫在楼(d.户[m], m, t) !== '外出';
      const expected = wife && present && clock.seededRandom(t, m, '荣耀洞夫') < 荣耀洞丈夫在场率;
      route.使用荣耀洞(d, 20);
      assert.equal(d.系统._荣耀洞门牌, wife ? m : '空');
      assert.equal(d.系统._荣耀洞夫, expected, `${m} at ${t}`);
      if (wife && present) {
        if (expected) positive++;
        else negative++;
      }
    }
  }
  assert.ok(positive > 0 && negative > 0, 'Both sides of husband probability must be exercised');
});

for (const [label, expired, protectedRoute, expected] of [
  ['预约在窗', false, false, true], ['预约到期', true, false, false], ['在窗但线路接管', false, true, false],
]) {
  test(`旧夫票${label}同一资格控制演员与数值`, () => {
    const d = pending(fresh('101', 22), '101');
    Object.assign(d.户['101'].夫, { _居住模式: '预约回楼', _预约回楼起: 21, _预约回楼至: expired ? 22 : 23 });
    if (protectedRoute) d.系统._家庭计划.阶段 = '已完成';
    route.推进荣耀洞隔离拍(d);
    assert.equal(route.荣耀洞当前事件(d).includes('复合事件:'), expected);
    assert.equal(d.户['101'].夫.疑心值, 17, '演员即将进入下一拍，尚未产生到场后果');
    route.推进荣耀洞隔离拍(d);
    assert.equal(d.户['101'].夫.疑心值, expected ? 19 : 17);
    assert.equal(d.系统._荣耀洞夫, true, 'Preserve the original ticket; eligibility is read-only');
  });
}
