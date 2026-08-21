/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
let 测试聊天变量 = { _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null };
globalThis.getVariables = () => 测试聊天变量;
globalThis.getLastMessageId = () => 30;

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  读取医院内容策略,
  列出住院微信节点,
  产后微信键,
  推进生产时钟,
} = require('../../src/人妻公寓/脚本/游戏逻辑/生产系统.ts');
const { 判定受孕 } = require('../../src/人妻公寓/脚本/游戏逻辑/怀孕系统.ts');
const {
  借种三人合照已拍键,
  借种孕情可进入姐妹群,
} = require('../../src/人妻公寓/脚本/游戏逻辑/借种结局状态.ts');
const {
  父亲认知确认键,
  生产姐妹群事件键,
  生产姐妹群前置已满足,
  生产姐妹群已触发,
  生产父亲公开级,
  生产父亲质问键,
  生产父亲认知画像,
  住院姐妹群事件键,
  住院姐妹群已触发,
} = require('../../src/人妻公寓/脚本/游戏逻辑/生产姐妹群系统.ts');
const 孕产AI通知源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/孕情AI通知.ts', import.meta.url),
  'utf8',
);
const { 手机邀约计划键 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/邀约计划.ts');
const { 读赴约 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 同步丈夫登门排期, 准备睡前丈夫登门 } = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫登门系统.ts');
const { 结算全楼冷落, 列出冷落预警候选 } = require('../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts');

function 建数据(门牌们 = ['101', '102', '201', '202', '301']) {
  const 户 = {};
  for (const 门牌 of 门牌们) {
    const 节点 = 创建户节点(0);
    Object.assign(节点.妻, { 当前阶段: 3, 好感值: 60, 堕落值: 40, 上次互动楼层: 25 });
    户[门牌] = 节点;
  }
  return Schema.parse({ 户, 系统: { _绝对时段: 60 } });
}

function 设为本胎(data, 门牌, 状态 = '住院中') {
  const 妻 = data.户[门牌].妻;
  Object.assign(妻._怀孕, {
    状态: 状态 === '孕期' ? '已告知' : '未孕',
    已曝光: true,
    受孕场次标识: `preg-${门牌}-1`,
  });
  Object.assign(妻._生产, {
    状态,
    本胎序号: 1,
    确认已读绝对时段: 0,
    实际生产绝对时段: 状态 === '住院中' ? 54 : -1,
    住院结束绝对时段: 状态 === '住院中' ? 96 : -1,
    结果: 状态 === '住院中' ? '陪产' : '未定',
  });
}

test('医院策略暂停普通玩法但保留姐妹群医院线程，出院后恢复', () => {
  const data = 建数据(['101']);
  设为本胎(data, '101', '待产');
  const 待产 = 读取医院内容策略(data, '101');
  assert.equal(待产.医院中, true);
  assert.equal(待产.允许普通自动内容, false);
  assert.equal(待产.允许手机邀约, false);
  assert.equal(待产.允许普通阶段推进, false);
  assert.equal(待产.允许姐妹群医院线程, true);

  data.户['101'].妻._生产.状态 = '已出院';
  const 出院 = 读取医院内容策略(data, '101');
  assert.equal(出院.医院中, false);
  assert.equal(出院.允许普通自动内容, true);
  assert.equal(出院.允许手机邀约, true);
});

test('生产姐妹群继承已知孕情，只逐角色区分父亲未知、怀疑与确认', () => {
  const data = 建数据();
  设为本胎(data, '101');
  data.户['102'].妻.好感值 = 20;
  data.户['102'].妻.堕落值 = 20;
  data.户['102'].妻.上次互动楼层 = 29;
  data.户['201'].妻.好感值 = 90;
  data.户['201'].妻.堕落值 = 80;
  data.户['201'].妻.上次互动楼层 = 0;

  const 孕情键 = `姐妹孕情:101:${data.户['101'].妻._怀孕.受孕场次标识}:1`;
  const 消息 = [{ 会话: '姐妹群', 键: 孕情键 }];
  const 初始 = 生产父亲认知画像(data, 消息, '101', 30);
  assert.equal(初始.find(x => x.门牌 === '102')?.已知怀孕, true);
  assert.equal(初始.find(x => x.门牌 === '102')?.父亲认知, '未知');
  assert.equal(初始.find(x => x.门牌 === '201')?.父亲认知, '怀疑');

  消息.push({
    会话: '201',
    键: 父亲认知确认键('私聊', '101', data.户['101'].妻._怀孕.受孕场次标识, '201'),
  });
  const 已确认 = 生产父亲认知画像(data, 消息, '101', 30);
  assert.equal(已确认.find(x => x.门牌 === '201')?.父亲认知, '确认');
  assert.equal(已确认.find(x => x.门牌 === '202')?.父亲认知, '怀疑');
});

test('生产姐妹群只认真实落库的本胎孕情群键，角色阶段和旧路径不能替代知情证据', () => {
  const data = 建数据(['101', '102']);
  设为本胎(data, '101');
  data.户['101'].妻._生产.获知生产路径 = '姐妹群';
  const 凭据 = { 门牌: '101', 胎次: 1, 场次标识: 'preg-101-1' };

  assert.equal(生产姐妹群前置已满足(data, [], 凭据), false);
  assert.equal(生产姐妹群前置已满足(data, [{ 会话: '姐妹群', 键: '姐妹孕情:101:preg-101-1:1' }], 凭据), true);
  assert.equal(生产姐妹群前置已满足(data, [{ 会话: '姐妹群', 键: '姐妹孕情:101:另一场次:1' }], 凭据), false);
});

test('私密借种孕情以实拍三人照独立进入姐妹群，并为生产群提供失败补偿准入', () => {
  const data = 建数据(['101', '102']);
  const 场次标识 = '借种结局:101:60:10';
  data.系统._已完成特殊场景.push('借种');
  Object.assign(data.户['101'].妻._怀孕, {
    状态: '已告知',
    已曝光: false,
    受孕场次标识: 场次标识,
  });
  Object.assign(data.户['101'].妻._生产, {
    状态: '孕期',
    本胎序号: 1,
    家庭计划知情: true,
  });
  const 凭据 = { 门牌: '101', 胎次: 1, 场次标识 };

  assert.equal(借种孕情可进入姐妹群(data, '101'), false, '实拍前不能把私密家庭安排当作群内事实');
  assert.equal(生产姐妹群前置已满足(data, [], 凭据), false);
  data.系统._特殊场景前置.push(借种三人合照已拍键(场次标识));
  assert.equal(data.户['101'].妻._怀孕.已曝光, false, '姐妹群专属准入不得污染公开丑闻布尔值');
  assert.equal(借种孕情可进入姐妹群(data, '101'), true);
  assert.equal(
    生产姐妹群前置已满足(data, [], 凭据),
    true,
    '即使孕情群AI持续失败到生产，实拍照片硬事实也不能让生产与住院群永久饿死',
  );

  // 后续家庭计划胎不是精确“借种结局:”来源，但仍属于同一知情家庭关系与姐妹群内部连续线。
  Object.assign(data.户['101'].妻._怀孕, {
    状态: '已告知',
    已曝光: false,
    受孕场次标识: '普通第二胎:101:220',
  });
  Object.assign(data.户['101'].妻._生产, { 状态: '孕期', 本胎序号: 2, 家庭计划知情: true });
  const 第二胎凭据 = { 门牌: '101', 胎次: 2, 场次标识: '普通第二胎:101:220' };
  assert.equal(借种孕情可进入姐妹群(data, '101'), true);
  assert.equal(生产姐妹群前置已满足(data, [], 第二胎凭据), true);
  assert.equal(data.户['101'].妻._怀孕.已曝光, false, '后续胎同样只开放姐妹群内部知情，不升级为公开丑闻');
});

test('陪产或高归属使生产群明确父亲；事件与私聊质问按胎次幂等', () => {
  const data = 建数据(['101', '102']);
  设为本胎(data, '101');
  assert.equal(生产父亲公开级(data, '101'), '确认');

  const 场次 = data.户['101'].妻._怀孕.受孕场次标识;
  const 事件键 = 生产姐妹群事件键('101', 1, 场次, '确认');
  const 消息 = [{ 会话: '姐妹群', 键: `${事件键}:1` }];
  assert.equal(生产姐妹群已触发(消息, '101', 1, 场次), true);
  assert.match(生产父亲质问键('102', '101', 1, 场次), /生产父亲质问:102:101:1:/);
});

test('住院只暂停丈夫登门，出院后仍保留原本待触发剧情', () => {
  const data = 建数据(['102']);
  const 妻 = data.户['102'].妻;
  Object.assign(妻._怀孕, { 状态: '已告知', 已曝光: true, 受孕场次标识: 'door-hospital' });
  data.户['102'].夫.疑心值 = 60;
  Object.assign(妻._生产, { 状态: '待产', 本胎序号: 1 });
  assert.deepEqual(同步丈夫登门排期(data), ['102']);
  assert.equal(准备睡前丈夫登门(data, '管理员室'), null);
  assert.equal(妻._怀孕.丈夫登门.状态, '待触发');

  妻._生产.状态 = '已出院';
  assert.match(准备睡前丈夫登门(data, '管理员室')?.事件 ?? '', /【丈夫登门:102:/);
});

test('住院期间冷落账只校准不下降、不发送预警，其他角色照常结算', () => {
  const data = 建数据(['101', '102']);
  设为本胎(data, '101');
  for (const 门牌 of ['101', '102']) {
    const 妻 = data.户[门牌].妻;
    妻.当前阶段 = 4;
    妻.堕落值 = 80;
    妻._成长账.上次有效成长钟楼 = 0;
    妻._成长账.已结算冷落日 = 0;
  }
  const 结果 = 结算全楼冷落(data);
  assert.equal(结果.find(x => x.门牌 === '101')?.参与, false);
  assert.equal(data.户['101'].妻.堕落值, 80);
  assert.equal(data.户['101'].妻._成长账.上次有效成长钟楼, 60);
  assert.ok((结果.find(x => x.门牌 === '102')?.实际下降 ?? 0) > 0);
  assert.equal(
    列出冷落预警候选(data).some(x => x.门牌 === '101'),
    false,
  );
});

test('跨过出院时点先校准冷落锚，不会在状态切换后补扣整段住院期', () => {
  const data = 建数据(['101']);
  设为本胎(data, '101');
  const 妻 = data.户['101'].妻;
  妻.当前阶段 = 4;
  妻.堕落值 = 80;
  妻._成长账.上次有效成长钟楼 = 0;
  妻._成长账.已结算冷落日 = 0;
  妻._生产.住院结束绝对时段 = 60;

  assert.deepEqual(推进生产时钟(data).出院, ['101']);
  assert.equal(妻._成长账.上次有效成长钟楼, 60);
  const 结果 = 结算全楼冷落(data)[0];
  assert.equal(结果.实际下降, 0);
  assert.equal(妻.堕落值, 80);
});

test('延期丈夫登门结算前不能开启下一胎，避免旧登门账被新受孕覆盖', () => {
  const data = 建数据(['102']);
  data.系统._绝对时段 = 6;
  const 妻 = data.户['102'].妻;
  妻._怀孕.丈夫登门.状态 = '待触发';
  妻._怀孕.连续未中次数 = 2;
  const 旧账 = structuredClone(妻._怀孕);
  const 结果 = 判定受孕(data, {
    场次标识: 'before-pending-door',
    结束方式: '主动收尾',
    最终位置: '小屄',
    收尾对象门牌: '102',
    保护状态: '未使用',
    当前行为: '阴道插入',
  });
  assert.equal(结果, '不符合');
  assert.deepEqual(妻._怀孕, 旧账);
});

test('住院微信按出生时间重建四个幂等节点，性别作为硬事实交给 AI 并在落库前验收', () => {
  const data = 建数据(['101', '102']);
  设为本胎(data, '101');
  const 生产 = data.户['101'].妻._生产;
  Object.assign(生产, {
    状态: '已出院',
    结果: '完全缺席',
    获知生产路径: '姐妹群',
    生产结算标识: '生产:101:1:preg-101-1',
  });
  data.系统._绝对时段 = 100;
  data.系统._家庭文档.孩子.push({
    id: 生产.生产结算标识,
    母亲门牌: '101',
    胎次: 1,
    性别: '女',
    出生绝对时段: 54,
    结果: '完全缺席',
    玩家产后看望: false,
    获知生产路径: '姐妹群',
    叙事最小年龄: 0,
    年龄阶段: '新生儿',
    出生场次标识: 'preg-101-1',
  });

  assert.deepEqual(
    列出住院微信节点(data).map(x => x.类型),
    ['恢复', '近况', '出院预告', '出院'],
  );
  const 住院键 = 列出住院微信节点(data).map(x => 产后微信键(x, x.类型));
  assert.equal(new Set(住院键).size, 4);
  assert.match(孕产AI通知源码, /孩子事实:[\s\S]*性别: 孩子\.性别/);
  assert.match(孕产AI通知源码, /验收生产硬事实\(行, 孩子\?\.性别\)/);
  assert.doesNotMatch(孕产AI通知源码, /母女平安|母子平安/);
  assert.doesNotMatch(孕产AI通知源码, /生成生产群获知/, '必达通知不得抢先写一条重复的生产群播报');
});

test('恢复、近况与出院是三个独立姐妹群节点，不会被出生播报一次性吞掉', () => {
  const 场次 = 'preg-101-1';
  const 恢复键 = 住院姐妹群事件键('101', 1, 场次, '恢复');
  const 消息 = [{ 会话: '姐妹群', 键: `${恢复键}:播报` }];
  assert.equal(住院姐妹群已触发(消息, '101', 1, 场次, '恢复'), true);
  assert.equal(住院姐妹群已触发(消息, '101', 1, 场次, '近况'), false);
  assert.equal(住院姐妹群已触发(消息, '101', 1, 场次, '出院'), false);
});

test('已接受的手机邀约在角色入院后不再生成现场人物', () => {
  const data = 建数据(['101']);
  设为本胎(data, '101', '待产');
  测试聊天变量 = {
    _场景: { 房间id: '天台' },
    _粘滞: null,
    _赴约: null,
    [手机邀约计划键]: { m: '101', 创建楼: 10, 创建绝对时段: 55, 目标绝对时段: 60, 地点: '天台' },
  };
  assert.deepEqual(读赴约(30, '天台', 60), { m: '101', 地点: '天台', 至楼: 30 });
  assert.equal(读赴约(30, '天台', 60, data), null);
  测试聊天变量 = { _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null };
});

test('住院策略已接到普通手机、阶段、赠礼、特殊场景与现场雌竞消费者', () => {
  const 根 = new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url);
  const 手机 = readFileSync(new URL('./手机/节拍引擎.ts', 根), 'utf8');
  const 邀约 = readFileSync(new URL('./手机/交互/邀约与发消息.ts', 根), 'utf8');
  const 阶段 = readFileSync(new URL('./阶段线路系统.ts', 根), 'utf8');
  const 商店 = readFileSync(new URL('./商店系统.ts', 根), 'utf8');
  const 特殊 = readFileSync(new URL('./特殊场景系统.ts', 根), 'utf8');
  const 快照 = readFileSync(new URL('./snapshotSystem.ts', 根), 'utf8');
  assert.match(手机, /允许普通自动内容/);
  assert.match(手机, /专场AI气泡上限 = 8/);
  assert.match(手机, /本轮主题由.*本人开口/);
  assert.doesNotMatch(手机, /专场固定气泡数|系统固定播报/);
  assert.match(邀约, /允许手机邀约/);
  assert.match(阶段, /允许普通阶段推进/);
  assert.match(商店, /允许普通礼物/);
  assert.match(特殊, /允许成人特殊场景/);
  assert.match(快照, /!处于医院硬锁\(data, m\)/);
});
