/* eslint-disable import-x/no-nodejs-modules -- PLAY-028：当前生产者与场景事务的内存回归，不访问玩家存档或模型。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({});
const noIO = () => { throw new Error('PLAY028_EXTERNAL_IO_FORBIDDEN'); };
globalThis.insertOrAssignVariables = noIO;
globalThis.updateVariablesWith = noIO;
globalThis.generate = noIO;
globalThis.generateRaw = noIO;
globalThis.fetch = noIO;

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 道具表 } = require('../../src/人妻公寓/stageConfig.ts');
const family = require('../../src/人妻公寓/脚本/游戏逻辑/家庭计划系统.ts');
const scene = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const clone = value => lodash.cloneDeep(value);
const reload = value => Schema.parse(JSON.parse(JSON.stringify(value)));

function nextMonitor(data) {
  const start = Math.max(data.系统._绝对时段, (data.系统._家庭计划.最早继续日 - 1) * 6);
  for (let t = start; t < start + 42; t++) {
    data.系统._绝对时段 = t;
    const before = clone(data);
    const result = family.准备家庭计划监控(data, '101');
    assert.deepEqual(data, before, '准备监控只给导演票，不提前提交家庭计划');
    if (result && '家庭计划节点' in result) return result;
  }
  assert.fail('一周内应有真实夫妻作息允许的观察窗口');
}

/** 购买/安装/投资料/监控准备均为真实代码；中间成功提交作为受控正文已成功的前置。 */
function buildSources() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 现金: 3000 });
  data.户['101'].妻.当前阶段 = 5;
  data.户['101'].妻.阶段性癖 = 户静态表['101'].招牌性癖;
  assert.equal(family.购买家庭计划套件(data, 道具表.家庭计划套件.价格).成功, true);
  let installed = false;
  for (let t = 0; t < 6 && !installed; t++) {
    data.系统._绝对时段 = t;
    installed = family.执行家庭计划地点动作(data, '安装计划板', '101').成功;
  }
  assert.ok(installed);
  data.系统._绝对时段 = 6;
  assert.equal(family.执行家庭计划地点动作(data, '投放匿名资料', '信箱区').成功, true);
  const first = nextMonitor(data);
  const sources = [{ label: 'D3观察资料', data: reload(data), event: first.事件 }];
  assert.equal(family.提交家庭计划监控(data, first.家庭计划节点).成功, true);
  data.系统._绝对时段 = (data.系统._家庭计划.最早继续日 - 1) * 6;
  assert.equal(family.执行家庭计划地点动作(data, '填写姓名磁贴', '管理员室').成功, true);
  assert.equal(family.执行家庭计划地点动作(data, '送出姓名磁贴', '101').成功, true);
  const second = nextMonitor(data);
  sources.push({ label: 'D5确认人选', data: reload(data), event: second.事件 });
  return sources;
}
const sources = buildSources();
const withPending = source => {
  const data = reload(source.data);
  data.系统._待发送事件 = source.event;
  return data;
};

for (const source of sources) {
  test(`PLAY-028 ${source.label}真实导演票：推断/队首/UI统一回302，读取零变更`, () => {
    const data = withPending(source), before = clone(data);
    assert.match(source.event, /\{\{user\}\}人在302/u);
    assert.equal(scene.解析场景剧情元数据(source.event), null);
    assert.equal(scene.推断旧场景剧情目标(source.event), '302');
    const head = scene.读取队首场景剧情(data.系统._待发送事件);
    assert.equal(head.目标场景, '302');
    assert.equal(head.内容, source.event);
    assert.equal(head.已结构化, false);
    const view = scene.读取场景剧情状态(data);
    assert.equal(view.目标场景, '302');
    assert.equal(view.可在当前场景开始('302'), true);
    assert.equal(view.可在当前场景开始('管理员室'), false);
    assert.deepEqual(data, before);
  });

  test(`PLAY-028 ${source.label}错误地点拒绝且原票保留，正确激活不提交观看结果`, () => {
    const data = withPending(source), before = clone(data);
    const wrong = scene.激活队首场景剧情(data, '管理员室', '继续观察', 42);
    assert.equal(wrong.成功, false);
    assert.deepEqual(data, before);
    const active = scene.激活队首场景剧情(data, '302', '继续观察', 42);
    assert.equal(active.成功, true, active.提示);
    assert.equal(active.事务.目标场景, '302');
    assert.ok(active.事务.内容.endsWith(source.event), '恢复只包装元数据，原导演正文逐字保留');
    assert.match(active.事务.内容, /地点固定在「302」/u);
    assert.doesNotMatch(active.事务.内容, /地点固定在「管理员室」/u);
    assert.equal(scene.解析场景剧情元数据(active.事务.内容).目标场景, '302');
    assert.deepEqual(data.系统._家庭计划, before.系统._家庭计划);
    assert.deepEqual(data.玩家资源, before.玩家资源);
    assert.deepEqual(data.背包, before.背包);
    assert.equal(data.系统._绝对时段, before.系统._绝对时段);
    const saved = reload(data);
    const repeated = scene.激活队首场景剧情(saved, '302', '继续观察', 43);
    assert.equal(repeated.成功, true);
    assert.equal(repeated.事务.id, active.事务.id);
    assert.deepEqual(saved, reload(data), '重复打开不改票号、请求世代或来源楼');
  });

  test(`PLAY-028 ${source.label}失败/重载/重试与迟到请求仍使用原302事务`, () => {
    let data = withPending(source);
    const result = scene.激活队首场景剧情(data, '302', '继续观察', 50);
    assert.equal(result.成功, true, result.提示);
    const { id, 内容, 请求世代 } = result.事务;
    const familyBefore = clone(data.系统._家庭计划);
    assert.equal(scene.标记场景剧情待重试(data, id, 请求世代), true);
    data = reload(data);
    const beforeWrong = clone(data);
    assert.equal(scene.准备重试场景剧情(data, '管理员室').成功, false);
    assert.deepEqual(data, beforeWrong);
    const retry = scene.准备重试场景剧情(data, '302');
    assert.equal(retry.成功, true);
    assert.equal(retry.事务.id, id);
    assert.equal(retry.事务.内容, 内容);
    assert.equal(retry.事务.请求世代, 请求世代 + 1);
    const beforeLate = clone(data);
    assert.equal(scene.提交场景剧情成功(data, 内容, id, 请求世代), false);
    assert.deepEqual(data, beforeLate, '旧请求不得消费重试后的票');
    assert.equal(scene.提交场景剧情成功(data, 内容, id, retry.事务.请求世代), true);
    assert.equal(data.系统._场景剧情事务.id, '');
    assert.deepEqual(data.系统._家庭计划, familyBefore, '本测试只验证场景票，不能冒称家庭计划观看成功');
  });
}

for (const room of ['302', '管理员室']) {
  test(`PLAY-028 明确${room}的旧位置样本与结构化元数据优先级`, () => {
    const raw = `【家庭计划专属监控】玩家人在${room}，只能通过101针孔摄像头看见画面；陆嘉明在101。`;
    assert.equal(scene.推断旧场景剧情目标(raw), room);
    const data = withPending({ ...sources[0], event: raw });
    assert.equal(scene.激活队首场景剧情(data, room, '继续观察', 51).成功, true);
    assert.equal(data.系统._场景剧情事务.目标场景, room);
    // 已有元数据始终优先；本项不擅自迁移或纠正已有结构化票的正文。
    const marked = scene.包装场景剧情内容(sources[0].event, { id: `explicit-${room}`, 标题: '已有位置', 目标场景: room });
    assert.equal(scene.推断旧场景剧情目标(marked), room);
    assert.equal(scene.读取队首场景剧情(marked).内容, marked);
  });
}

const uncertain = [
  '【家庭计划专属监控】陆嘉明在101阅读资料。',
  '【家庭计划专属监控】玩家不在302，地点尚未确认。',
  '【家庭计划专属监控】如果玩家人在302，可以查看画面。',
  '【家庭计划专属监控】玩家人在302吗？',
  '【家庭计划专属监控】玩家人在3020，地址不是房间302。',
  '【家庭计划专属监控】玩家人在大堂，只能查看消息。',
  '她引用“【家庭计划专属监控】玩家人在302，只能观看画面。”',
  '【家庭计划专属监控】“玩家人在302”只是引用。',
  '【家庭计划专属监控】玩家人在302，查看画面。【家庭计划专属监控】玩家人在管理员室，查看画面。',
];
for (const [index, event] of uncertain.entries()) {
  test(`PLAY-028 不足或矛盾的位置证据${index + 1}保持未知，不凭标签自动认领`, () => {
    const data = withPending({ ...sources[0], event }), before = clone(data);
    assert.equal(scene.推断旧场景剧情目标(event), null);
    const view = scene.读取场景剧情状态(data);
    assert.equal(view.目标场景, null);
    assert.equal(view.可在当前场景开始('302'), false);
    assert.equal(view.可在当前场景开始('管理员室'), false);
    assert.equal(scene.激活队首场景剧情(data, '302', '继续', 50).成功, false);
    assert.equal(scene.激活队首场景剧情(data, '管理员室', '继续', 50).成功, false);
    assert.deepEqual(data, before);
  });
}

test('PLAY-028 未知旧票保留显式认领路径，不自动绑定当前房间', () => {
  const data = withPending({ ...sources[0], event: uncertain[0] });
  const result = scene.激活队首场景剧情(data, '302', '明确恢复到302', 60, true);
  assert.equal(result.成功, true, result.提示);
  assert.equal(result.事务.目标场景, '302');
  assert.ok(result.事务.内容.endsWith(uncertain[0]));
});

test('PLAY-028 混合积压队列只包装/消费当前票，其他人物与后续顺序逐字保留', () => {
  const data = withPending(sources[0]);
  const other = scene.包装场景剧情内容('【普通等待】101待办。', { id: 'other-101', 标题: '101待办', 目标场景: '101' });
  const tail = `${other}|${sources[1].event}`;
  data.系统._待发送事件 += `|${tail}`;
  const start = scene.激活队首场景剧情(data, '302', '观察', 70);
  assert.equal(start.成功, true, start.提示);
  assert.equal(scene.读取队首场景剧情(data.系统._待发送事件).剩余, tail);
  const { id, 内容, 请求世代 } = start.事务;
  assert.equal(scene.提交场景剧情成功(data, 内容, id, 请求世代), true);
  assert.equal(data.系统._待发送事件, tail);
  const before = clone(data);
  assert.equal(scene.提交场景剧情成功(data, 内容, id, 请求世代), false);
  assert.deepEqual(data, before, '重复旧提交不能吞掉下一张票');
  assert.equal(scene.读取队首场景剧情(data.系统._待发送事件).目标场景, '101');
});

test('PLAY-028 回档到未激活状态仍从原文字恢复；其他已知旧事件规则不变', () => {
  const checkpoint = withPending(sources[0]);
  const active = reload(checkpoint);
  assert.equal(scene.激活队首场景剧情(active, '302', '观察', 80).成功, true);
  const restored = reload(checkpoint);
  assert.equal(restored.系统._场景剧情事务.id, '');
  assert.equal(restored.系统._待发送事件, sources[0].event);
  assert.equal(scene.读取场景剧情状态(restored).目标场景, '302');
  for (const [event, expected] of [
    ['【翻垃圾的收获】找到碎纸。', '垃圾房'],
    ['【早饭桌】地点始终是302。', '302'],
    ['【早饭桌】地点始终是管理员室。', '管理员室'],
    ['【药物首夜】既有票。', '302'],
    ['【特殊场景·录像带】既有票。', '洗手间'],
    ['没有明确位置的普通旧事件。', null],
  ]) assert.equal(scene.推断旧场景剧情目标(event), expected);
});
