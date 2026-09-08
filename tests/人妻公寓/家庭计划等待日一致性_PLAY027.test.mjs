/* eslint-disable import-x/no-nodejs-modules -- PLAY-027：真实日期、动作与只读档案，不访问宿主或模型。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({});
const noIO = () => { throw new Error('PLAY027_EXTERNAL_IO_FORBIDDEN'); };
globalThis.insertOrAssignVariables = noIO;
globalThis.updateVariablesWith = noIO;
globalThis.generate = noIO;
globalThis.generateRaw = noIO;
globalThis.fetch = noIO;

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 道具表 } = require('../../src/人妻公寓/stageConfig.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/家庭计划系统.ts');
const { 玩家当前日 } = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const clone = value => lodash.cloneDeep(value);
const reload = value => Schema.parse(JSON.parse(JSON.stringify(value)));

function fresh(absolutePeriod = 0) {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: absolutePeriod }, 现金: 3000 });
  data.户['101'].妻.当前阶段 = 5;
  data.户['101'].妻.阶段性癖 = 户静态表['101'].招牌性癖;
  return data;
}
function advertisedDay(data) {
  const before = clone(data);
  const view = route.家庭计划档案提示(data);
  assert.deepEqual(data, before, '读档案不得写路线、资源、背包或世界钟');
  const match = view?.下一步.match(/^至少等到第 (\d+) 天再继续：/u);
  assert.ok(match, '尚未到期时应给出明确等待日');
  return Number(match[1]);
}
function install() {
  const data = fresh();
  assert.equal(route.购买家庭计划套件(data, 道具表.家庭计划套件.价格).成功, true);
  for (let period = 0; period < 6; period++) {
    data.系统._绝对时段 = period;
    const result = route.执行家庭计划地点动作(data, '安装计划板', '101');
    if (result.成功) return data;
  }
  assert.fail('真实第一天应存在安装窗口');
}
function waitForMonitor(data) {
  const start = Math.max(data.系统._绝对时段, (data.系统._家庭计划.最早继续日 - 1) * 6);
  for (let period = start; period < start + 42; period++) {
    data.系统._绝对时段 = period;
    const before = clone(data);
    const result = route.准备家庭计划监控(data, '101');
    assert.deepEqual(data, before, '准备票据无权提前消费状态');
    if (result && '家庭计划节点' in result) return result;
  }
  assert.fail('一周内应存在真实作息允许的监控窗口');
}

test('PLAY-027 世界日从1开始，深夜到次晨与跨周不多加一天', () => {
  for (const [period, day] of [[0, 1], [5, 1], [6, 2], [41, 7], [42, 8], [599, 100]]) {
    assert.equal(玩家当前日(fresh(period)), day);
  }
});

test('PLAY-027 真实购买安装：档案第2天与实际投资料开放日一致', () => {
  const data = install();
  assert.equal(data.系统._家庭计划.最早继续日, 2);
  assert.equal(advertisedDay(data), 2);
  const before = clone(data);
  assert.deepEqual(route.家庭计划地点动作(data, '信箱区'), []);
  assert.equal(route.执行家庭计划地点动作(data, '投放匿名资料', '信箱区').成功, false);
  assert.deepEqual(data, before, '未到期不能为配合提示提前消费');
  data.系统._绝对时段 = 6;
  assert.equal(route.家庭计划地点动作(data, '信箱区')[0]?.id, '投放匿名资料');
  assert.equal(route.执行家庭计划地点动作(data, '投放匿名资料', '信箱区').成功, true);
  assert.equal(data.系统._家庭计划.最早继续日, 3);
  assert.equal(advertisedDay(data), 3);
});

const stages = ['待安装', '待投资料', '待观察资料', '待写磁贴', '待送磁贴', '待确认人选', '待微信', '待赴约'];
for (const stage of stages) {
  test(`PLAY-027 ${stage}所有等待分支使用原存档日期；到期即撤下等待文案`, () => {
    const data = fresh(41);
    data.系统._家庭计划 = { 阶段: stage, 最早继续日: 8, 完成楼层: -1 };
    assert.equal(advertisedDay(data), 8);
    const pending = clone(data);
    data.系统._绝对时段 = 42;
    const due = route.家庭计划档案提示(data);
    assert.equal(due.状态, '《家庭计划》进行中');
    assert.doesNotMatch(due.下一步, /至少等到/u);
    assert.equal(data.系统._家庭计划.最早继续日, 8, '不迁移旧等待值');
    data.系统._绝对时段 = 47;
    assert.deepEqual(route.家庭计划档案提示(data), due, '同一天不反复改等待日期');
    assert.equal(advertisedDay(reload(pending)), 8, '刷新/回档按恢复快照派生，不沿用后来的日期');
  });
}

test('PLAY-027 全部真实等待生产者与两次监控/同日写送磁贴一致', () => {
  const data = install();
  const snapshots = [clone(data)];
  data.系统._绝对时段 = (data.系统._家庭计划.最早继续日 - 1) * 6;
  assert.equal(route.执行家庭计划地点动作(data, '投放匿名资料', '信箱区').成功, true);
  snapshots.push(clone(data));
  const first = waitForMonitor(data);
  assert.equal(first.家庭计划节点, '观察资料');
  assert.equal(route.提交家庭计划监控(data, first.家庭计划节点).成功, true);
  snapshots.push(clone(data));
  data.系统._绝对时段 = (data.系统._家庭计划.最早继续日 - 1) * 6;
  assert.equal(route.执行家庭计划地点动作(data, '填写姓名磁贴', '管理员室').成功, true);
  assert.equal(data.系统._家庭计划.最早继续日, 玩家当前日(data));
  assert.equal(route.家庭计划档案提示(data).状态, '《家庭计划》进行中');
  const beforeWrongRoom = clone(data);
  assert.equal(route.执行家庭计划地点动作(data, '送出姓名磁贴', '管理员室').成功, false);
  assert.deepEqual(data, beforeWrongRoom);
  assert.equal(route.执行家庭计划地点动作(data, '送出姓名磁贴', '101').成功, true);
  snapshots.push(clone(data));
  const second = waitForMonitor(data);
  assert.equal(second.家庭计划节点, '确认人选');
  assert.equal(route.提交家庭计划监控(data, second.家庭计划节点).成功, true);
  assert.equal(data.系统._家庭计划.最早继续日, 玩家当前日(data));
  const beforeUnread = clone(data);
  assert.equal(route.确认家庭计划微信已读(data, false).成功, false);
  assert.deepEqual(data, beforeUnread);
  assert.equal(route.确认家庭计划微信已读(data, true).成功, true);
  assert.equal(route.家庭计划地点动作(data, '101')[0]?.id, '赴约');
  for (const snapshot of snapshots) {
    assert.equal(advertisedDay(snapshot), snapshot.系统._家庭计划.最早继续日, snapshot.系统._家庭计划.阶段);
    const restored = reload(snapshot);
    assert.equal(advertisedDay(restored), advertisedDay(snapshot));
    assert.deepEqual(restored.系统._家庭计划, snapshot.系统._家庭计划);
  }
});

test('PLAY-027 后续周次与长档仍直接采用绝对游戏日，不按星期重新计数', () => {
  for (const day of [2, 7, 8, 31, 100]) {
    const data = fresh((day - 2) * 6 + 5);
    data.系统._家庭计划 = { 阶段: '待投资料', 最早继续日: day, 完成楼层: -1 };
    assert.equal(advertisedDay(data), day);
    data.系统._绝对时段++;
    assert.equal(route.家庭计划地点动作(data, '信箱区')[0]?.id, '投放匿名资料');
    assert.equal(route.家庭计划档案提示(data).状态, '《家庭计划》进行中');
  }
});

test('PLAY-027 未到期/错节点监控失败或准备后未提交不改变原等待账', () => {
  const data = fresh();
  data.系统._家庭计划 = { 阶段: '待观察资料', 最早继续日: 3, 完成楼层: -1 };
  const before = clone(data);
  assert.equal(route.准备家庭计划监控(data, '101').成功, false);
  assert.equal(route.提交家庭计划监控(data, '观察资料').成功, false);
  assert.equal(route.提交家庭计划监控(data, '确认人选').成功, false);
  assert.deepEqual(data, before);
  const prepared = waitForMonitor(data);
  const afterPrepare = clone(data);
  assert.equal(route.家庭计划档案提示(data).状态, '《家庭计划》进行中');
  assert.deepEqual(data, afterPrepare);
  assert.equal(data.系统._家庭计划.阶段, '待观察资料', '取消/未提交生成不被档案读取签成完成');
  assert.equal(prepared.家庭计划节点, '观察资料');
});

test('PLAY-027 缺户/未解锁/已完成和旧无等待哨兵不出现虚构等待日期', () => {
  const data = fresh();
  delete data.户['101'];
  assert.equal(route.家庭计划档案提示(data), null);
  const locked = Schema.parse({ 户: { 101: 创建户节点(0) } });
  assert.equal(route.家庭计划档案提示(locked), null);
  for (const wait of [-1, 0, 1]) {
    const old = fresh();
    old.系统._家庭计划 = { 阶段: '待投资料', 最早继续日: wait, 完成楼层: -1 };
    const before = clone(old);
    assert.equal(route.家庭计划档案提示(old).状态, '《家庭计划》进行中');
    assert.deepEqual(old, before);
  }
  const completed = fresh();
  completed.系统._家庭计划 = { 阶段: '已完成', 最早继续日: 100, 完成楼层: 42 };
  const before = clone(completed);
  assert.equal(route.家庭计划档案提示(completed).完成, true);
  assert.doesNotMatch(route.家庭计划档案提示(completed).下一步, /至少等到/u);
  assert.deepEqual(completed, before);
});
