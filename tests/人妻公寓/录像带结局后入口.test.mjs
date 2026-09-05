/* eslint-disable import-x/no-nodejs-modules -- Node-only player journey regression */
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
const resource = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const { 妻位置推算 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const entry = require('../../src/人妻公寓/脚本/游戏逻辑/录像带结局后相处.ts');
const cg = require('../../src/人妻公寓/脚本/游戏逻辑/成人CG系统.ts');
const { ref } = require('vue');
const { useRoomActions } = require('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts');

function fresh(m) {
  const data = Schema.parse({ 户: { [m]: 创建户节点(0) } });
  data.户[m].妻.当前阶段 = 5;
  data.系统._已完成特殊场景.push('录像带结局');
  for (let clock = 0; clock < 42; clock++) {
    if (妻位置推算(m, clock, data.户[m]) === m) { data.系统._绝对时段 = clock; break; }
  }
  return data;
}
function opening(data, m, choice = '由我开始', text = '她回应了这次靠近，把接下来的行动留给玩家。') {
  return resource.结算成功现场楼(data, lodash.cloneDeep(data), {
    场景: m, 楼层: 50, 行动: `【${m}结局后亲密开场】【${choice}】`, 正文: text,
    本楼事件: '', 妻在场: [m], 实际尺度: { [m]: 0 }, 资源计费: false,
  });
}
for (const m of ['102', '202']) {
  test(`${m}结局后两种有效开场均建立零进度普通场次，开场本身不扣资源`, () => {
    for (const choice of ['由我开始', '让她开始']) {
      const data = fresh(m);
      const beforeResources = lodash.cloneDeep(data.玩家资源);
      const before = lodash.cloneDeep(data);
      const result = opening(data, m, choice);
      assert.equal(result.性爱开始, true);
      assert.equal(data.系统._性爱场景.主焦点门牌, m);
      assert.equal(data.系统._性爱场景.有效楼数, 0);
      assert.equal(data.系统._性爱场景.参与者[m].满意度, 0);
      assert.deepEqual(data.玩家资源, beforeResources);
      const signal = { 门牌: m, 行为等级: 1, 正文: '她安静地回应了靠近。', 行动: entry.录像带结局后亲密行动(m, choice), 事件: '', 楼层: 50,
        亲密: cg.构造CG亲密上下文(before, data, false), variant: 'normal' };
      assert.equal(cg.判定亲密场景CG阶段(signal), 'intro_no_contact');
      const images = cg.选择成人CG组(signal, new Set(), new Set(), 2);
      assert.ok(images.length, '使用已发布的本角色开场图，不生成虚构素材地址');
      assert.ok(images.every(image => image.door === m && image.stage === 'intro_no_contact'));
    }
  });
}

test('新入口区分实际地点、身体状态、当前事务和主动通话，未接通知不冒充活动通话', () => {
  const data = fresh('102');
  assert.equal(entry.录像带结局后亲密可用(data, '102', '102'), true);
  assert.equal(entry.录像带结局后亲密可用(data, '102', '202'), false);
  data.系统._待接来电.期 = 1;
  assert.equal(entry.录像带结局后亲密可用(data, '102', '102'), true);
  data.系统._父亲通话.状态 = '通话中';
  assert.equal(entry.录像带结局后亲密可用(data, '102', '102'), false);
  data.系统._父亲通话.状态 = '';
  data.系统._场景剧情事务.id = 'active';
  assert.equal(entry.录像带结局后亲密可用(data, '102', '102'), false);
  data.系统._场景剧情事务.id = '';
  data.户['102'].妻._生产.状态 = '住院中';
  assert.equal(entry.录像带结局后亲密可用(data, '102', '102'), false);
  const ended = fresh('102');
  ended.系统._坏结局 = '本次故事结束';
  assert.equal(entry.录像带结局后亲密可用(ended, '102', '102'), false);
  const tired = fresh('102');
  tired.玩家资源.精力.当前值 = 0;
  assert.equal(resource.行动资源门槛(tired, entry.录像带结局后亲密行动('102', '由我开始')).种类, '体力');
  assert.equal(entry.录像带结局后亲密可用(tired, '102', '102'), true);
});

test('未完成、空白输出、明确中止和错演员均不留下半场；回档恢复原资格', () => {
  for (const m of ['102', '202']) {
    const data = fresh(m);
    const idle = lodash.cloneDeep(data.系统._性爱场景);
    assert.throws(() => opening(data, m, '由我开始', ''), /开场尚未完成/u);
    assert.deepEqual(data.系统._性爱场景, idle);
    const name = m === '102' ? '沈静仪' : '周小满';
    assert.throws(() => opening(data, m, '由我开始', `${name}明确拒绝继续，推开玩家并要求立刻停下。`));
    assert.deepEqual(data.系统._性爱场景, idle);
    assert.throws(() => resource.结算成功现场楼(data, lodash.cloneDeep(data), {
      场景: m, 楼层: 50, 行动: entry.录像带结局后亲密行动(m, '让她开始'), 正文: '她回应靠近。',
      本楼事件: '', 妻在场: [m === '102' ? '202' : '102'], 实际尺度: {}, 资源计费: false,
    }));
    assert.deepEqual(data.系统._性爱场景, idle);
    data.系统._已完成特殊场景 = [];
    assert.equal(entry.录像带结局后亲密可用(data, m, m), false);
    assert.throws(() => opening(data, m), /完成《录像带》/u);
    assert.deepEqual(data.系统._性爱场景, idle);
  }
});

test('开场消费已准备的保护而不消耗体力，下一楼继续同一普通场次', () => {
  const data = fresh('202');
  data.玩家资源.保护准备 = true;
  const stamina = data.玩家资源.体力.当前值;
  opening(data, '202');
  assert.equal(data.系统._性爱场景.保护状态, '安全套');
  assert.equal(data.玩家资源.保护准备, false);
  assert.equal(data.玩家资源.体力.当前值, stamina);
  const id = data.系统._性爱场景.场次标识;
  assert.equal(entry.录像带结局后亲密可用(data, '202', '202'), false);
  const result = resource.结算成功现场楼(data, lodash.cloneDeep(data), { 场景: '202', 楼层: 51, 行动: '继续和她相处。',
    正文: '她继续回应玩家。', 本楼事件: '', 妻在场: ['202'], 实际尺度: { 202: 1 }, 资源计费: true });
  assert.equal(result.性爱开始, false);
  assert.equal(data.系统._性爱场景.场次标识, id);
  assert.ok(data.系统._性爱场景.有效楼数 > 0);
  assert.equal(data.玩家资源.体力.当前值, stamina - 1);
});

test('真实房间动作提供一块入口和两个选择，移走或状态改变后旧回调不再发起', () => {
  for (const m of ['102', '202']) {
    const data = ref(fresh(m)), current = ref(m), sending = ref(false), calls = [];
    const events = new Proxy({ 录像带结局后亲密: (door, choice) => calls.push([door, choice]) }, { get: (target, key) => target[key] ?? (() => {}) });
    const ui = useRoomActions({ data, 当前房间: current, 时段: ref('晚上'), 绝对时段: ref(data.value.系统._绝对时段),
      发送中: sending, 时间撤销可用: ref(false), 已破门进入: ref(false), 荣耀洞可用: ref(false), 房内有人在: () => true,
      妻现位: () => m, 进入: async () => false, 同步场景自变量() {}, 弹提示() {}, 发起时间推进() {}, 发起时间撤销() {}, 启动阶段线路剧情() {}, 事件: events });
    const entries = ui.房间动作(m).filter(item => item.文案 === '和她亲密');
    assert.equal(entries.length, 1);
    assert.deepEqual(entries[0].选项.map(item => item.文案), ['由我开始', '让她开始']);
    entries[0].选项[1].做();
    assert.deepEqual(calls, [[m, '让她开始']]);
    current.value = '管理员室';
    entries[0].选项[0].做();
    assert.equal(calls.length, 1);
    current.value = m;
    data.value.系统._已完成特殊场景 = [];
    entries[0].选项[0].做();
    assert.equal(calls.length, 1);
    assert.equal(ui.房间动作(m).some(item => item.文案 === '和她亲密'), false);
  }
});

test('开场的高尺度报告仍保持零进度，已告知孕态使用本角色孕态开场图库', () => {
  for (const m of ['102', '202']) {
    const data = fresh(m);
    data.户[m].妻._怀孕.状态 = '已告知';
    const before = lodash.cloneDeep(data);
    const action = entry.录像带结局后亲密行动(m, '让她开始');
    resource.结算成功现场楼(data, before, { 场景: m, 楼层: 50, 行动: action, 正文: '她主动靠近玩家。', 本楼事件: '',
      妻在场: [m], 实际尺度: { [m]: 5 }, 资源计费: false });
    assert.equal(data.系统._性爱场景.有效楼数, 0);
    assert.equal(data.系统._性爱场景.参与者[m].满意度, 0);
    const images = cg.选择成人CG组({ 门牌: m, 行为等级: 5, 正文: '她主动靠近玩家。', 行动: action, 事件: '', 楼层: 50,
      亲密: cg.构造CG亲密上下文(before, data, false), variant: 'pregnancy' }, new Set(), new Set(), 2);
    assert.ok(images.length);
    assert.ok(images.every(image => image.door === m && image.stage === 'intro_no_contact' && image.variant === 'pregnancy'));
  }
});
