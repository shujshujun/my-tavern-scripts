/* eslint-disable import-x/no-nodejs-modules -- Node-only route regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '301' } });
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
const resource = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const risk = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');
const { 读取待发送事件队列 } = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');

function fresh() {
  const data = Schema.parse({ 户: { 301: 创建户节点(0) } });
  data.户['301'].妻.当前阶段 = 5;
  data.户['301'].妻.阶段性癖 = '镜头高潮';
  data.户['301'].夫._居住模式 = '提前通知';
  data.户['301'].夫.状态 = '外出';
  data.现金 = 5000;
  data.玩家资源.体力.永久上限加成 = 2;
  data.玩家资源.体力.当前值 = 7;
  return data;
}

function commit(data, event, floor) {
  const result = route.提交安若妍不必停剧情事件(data, event, '301', floor);
  assert.equal(result?.成功, true, result?.提示);
  return result;
}

function settleFixed(data, event, floor) {
  const stamina = data.玩家资源.体力.当前值;
  const effective = data.系统._性爱场景.有效楼数;
  const old = lodash.cloneDeep(data);
  const result = resource.结算成功现场楼(data, old, {
    场景: '301',
    楼层: floor,
    行动: '继续当前固定剧情拍',
    正文: '本拍只推进固定剧情，不产生新的亲密有效动作。',
    本楼事件: event,
    妻在场: ['301'],
    实际尺度: { 301: 3 },
    资源计费: true,
  });
  assert.equal(result.已消费, null);
  assert.equal(data.玩家资源.体力.当前值, stamina);
  assert.equal(data.系统._性爱场景.有效楼数, effective);
  return result;
}

function settleIntimacy(data, floor) {
  const old = lodash.cloneDeep(data);
  return resource.结算成功现场楼(data, old, {
    场景: '301',
    楼层: floor,
    行动: '继续与安若妍的亲密动作',
    正文: '安若妍明确继续参与，两人的亲密动作在夫妻卧室内持续。',
    本楼事件: '',
    妻在场: ['301'],
    实际尺度: { 301: 3 },
    资源计费: true,
  });
}

function startThroughH1(data) {
  assert.equal(route.安若妍不必停商店已上架(data), true);
  const purchase = route.购买安若妍不必停(data);
  assert.equal(purchase.成功, true);
  assert.equal(data.背包.includes(route.安若妍不必停商品ID), true);
  assert.equal(data.现金, 4320);

  const start = route.执行安若妍不必停地点动作(data, '使用不必停', '301', 10, 'test@0');
  assert.equal(start.成功, true);
  assert.match(start.事件, /安若妍不必停提交:A2:1/);
  const a21 = commit(data, start.事件, 11);
  const a22 = commit(data, a21.后续事件, 12);
  assert.equal(data.系统._安若妍不必停.阶段, '等待次日签收');
  assert.equal(data.户['301'].夫._居住模式, '提前通知');
  assert.equal(risk.读取丈夫线路风险阶段(data, '301'), '承接保护');

  data.系统._绝对时段 = data.系统._安若妍不必停.最早继续时段;
  route.同步安若妍不必停时间节点(data);
  assert.equal(data.系统._安若妍不必停.阶段, '待签收卷宗');
  let hard = route.执行安若妍不必停地点动作(data, '签收301密封卷宗箱', '大堂', 13);
  assert.equal(hard.成功, true);
  assert.equal(hard.CG, 'ARY-NBS-02');
  assert.equal(data.背包.includes(route.安若妍卷宗箱ID), true);

  hard = route.执行安若妍不必停地点动作(data, '登记301代收件与取件时段', '管理员室', 14);
  assert.equal(hard.成功, true);
  assert.equal(data.系统._安若妍不必停.取件登记已完成, true);

  const put = route.执行安若妍不必停地点动作(data, '把卷宗箱放进301书房', '301', 15);
  assert.equal(put.成功, true);
  commit(data, put.事件, 16);
  assert.equal(data.系统._安若妍不必停.卷宗状态, '301书房');
  assert.equal(data.背包.includes(route.安若妍卷宗箱ID), false);

  data.系统._绝对时段 = data.系统._安若妍不必停.预约夜绝对时段;
  route.同步安若妍不必停时间节点(data);
  assert.equal(data.系统._安若妍不必停.阶段, '待核对卷宗');
  const check = route.执行安若妍不必停地点动作(data, '确认卷宗仍在书房', '301', 17);
  commit(data, check.事件, 18);
  const door = route.执行安若妍不必停地点动作(data, '把前门留作未反锁', '301', 19);
  commit(data, door.事件, 20);
  assert.equal(data.系统._安若妍不必停.前门未反锁, true);
  assert.equal(data.系统._安若妍不必停.卧室门半开, true);

  const h1 = route.执行安若妍不必停地点动作(data, '开始他回来以前', '301', 21);
  const beforeH1 = lodash.cloneDeep(data);
  const h1Commit = commit(data, h1.事件, 22);
  assert.equal(h1Commit.需普通亲密开场, true);
  const h1Resource = resource.结算成功现场楼(data, beforeH1, {
    场景: '301',
    楼层: 22,
    行动: '留在夫妻卧室，开始与安若妍亲密',
    正文: '安若妍让玩家留下，并把下一步交还玩家。',
    本楼事件: h1.事件,
    妻在场: ['301'],
    实际尺度: { 301: 2 },
    资源计费: true,
  });
  assert.equal(h1Resource.性爱开始, true);
  assert.equal(h1Resource.已消费, null);
  assert.equal(data.玩家资源.体力.当前值, 7);
  assert.equal(data.系统._性爱场景.有效楼数, 0);
  assert.equal(route.安若妍不必停真实亲密已绑定(data), true);
  return data;
}

test('购买、卷宗三步和H1零进度开场形成同一301硬因果链', () => {
  const data = startThroughH1(fresh());
  const state = data.系统._安若妍不必停;
  assert.equal(state.阶段, '亲密前半');
  assert.equal(state.卷宗状态, '301书房');
  assert.equal(state.绑定亲密场次标识, data.系统._性爱场景.场次标识);
  assert.equal(data.系统._性爱场景.参与者['301'].有效楼数, 0);
});

test('H6-H8暂停不扣体力不涨有效楼，恰好7点体力仍可免费完成H12', () => {
  const data = startThroughH1(fresh());
  for (let i = 0; i < 4; i += 1) settleIntimacy(data, 30 + i);
  assert.equal(data.系统._安若妍不必停.前半有效楼数, 4);
  assert.equal(data.系统._安若妍不必停.阶段, 'H6中');
  assert.equal(data.玩家资源.体力.当前值, 3);
  assert.equal(data.系统._性爱场景.有效楼数, 4);

  const h6 = 读取待发送事件队列(data.系统._待发送事件).find(item => route.解析安若妍不必停剧情事件(item)?.场景 === 'H6前门打开');
  assert.ok(h6);
  const h6Commit = commit(data, h6, 40);
  settleFixed(data, h6, 40);
  assert.deepEqual(h6Commit.CG序列, ['ARY-NBS-07', 'ARY-NBS-08']);

  const h7 = h6Commit.后续事件;
  commit(data, h7, 41);
  settleFixed(data, h7, 41);
  assert.equal(data.系统._安若妍不必停.阶段, '待H7决定');
  assert.equal(data.系统._安若妍不必停.江辰已明确看见, true);

  const h8 = route.执行安若妍不必停地点动作(data, '继续刚才的动作', '301', 42);
  const h8Commit = commit(data, h8.事件, 43);
  settleFixed(data, h8.事件, 43);
  assert.deepEqual(h8Commit.CG序列, ['ARY-NBS-10-N', 'ARY-NBS-11']);
  assert.equal(data.系统._安若妍不必停.江辰已行动接受, true);
  assert.equal(data.玩家资源.体力.当前值, 3);
  assert.equal(data.系统._性爱场景.有效楼数, 4);

  const h9 = settleIntimacy(data, 50);
  assert.equal(h9.线路CG, 'ARY-NBS-12');
  settleIntimacy(data, 51);
  const h11 = settleIntimacy(data, 52);
  assert.equal(data.系统._安若妍不必停.后半有效楼数, 3);
  assert.equal(data.系统._安若妍不必停.阶段, '待H12收尾');
  assert.equal(data.系统._性爱场景.有效楼数, 7);
  assert.equal(data.玩家资源.体力.当前值, 0);
  assert.equal(data.系统._性爱场景.状态, '收尾中');
  assert.match(h11.提示, /下一楼将免费演出失控收尾/);

  const beforeH12 = lodash.cloneDeep(data);
  const h12 = resource.结算成功现场楼(data, beforeH12, {
    场景: '301',
    楼层: 53,
    行动: '完成失控收尾',
    正文: '玩家与安若妍完成这次亲密收尾。',
    本楼事件: '',
    妻在场: ['301'],
    实际尺度: { 301: 3 },
    资源计费: false,
  });
  assert.equal(h12.已消费, null);
  assert.equal(h12.性爱结束, true);
  assert.equal(data.玩家资源.体力.当前值, 0);
  assert.equal(data.系统._安若妍不必停.阶段, '待H13余韵');
  assert.equal(data.系统._安若妍不必停.普通收尾已完成, true);
});

test('H7选择暂缓只重排预约夜，卷宗和管理员室登记不重做且跳过受孕', () => {
  const data = startThroughH1(fresh());
  for (let i = 0; i < 4; i += 1) settleIntimacy(data, 60 + i);
  const h6 = 读取待发送事件队列(data.系统._待发送事件).find(item => route.解析安若妍不必停剧情事件(item)?.场景 === 'H6前门打开');
  const h6Commit = commit(data, h6, 70);
  settleFixed(data, h6, 70);
  commit(data, h6Commit.后续事件, 71);
  settleFixed(data, h6Commit.后续事件, 71);

  const choice = route.执行安若妍不必停地点动作(data, '停下本次暂缓', '301', 72);
  assert.equal(choice.需暂停亲密, true);
  const paused = resource.结算安若妍不必停H7暂缓(data, 72);
  assert.equal(paused.成功, true);
  assert.equal(data.系统._安若妍不必停.阶段, '等待预约夜');
  assert.equal(data.系统._安若妍不必停.卷宗状态, '301书房');
  assert.equal(data.系统._安若妍不必停.取件登记已完成, true);
  assert.equal(data.系统._性爱场景.状态, '空闲');
  assert.equal(data.系统._安若妍不必停.绑定亲密场次标识, '');
  assert.match(data.系统._安若妍不必停.暂停原因, /H7选择停下/);
});

test('H13、客厅两拍与次晨登记只完成承接，不越权签发正式结局', () => {
  const data = fresh();
  const state = data.系统._安若妍不必停;
  Object.assign(state, {
    阶段: '待H13余韵',
    卷宗状态: '301书房',
    取件登记已完成: true,
    普通收尾已完成: true,
    H6完成: true,
    H7看清: true,
    H7选择: '继续',
    H8完成: true,
    江辰已明确看见: true,
    江辰已行动接受: true,
  });
  let result = route.执行安若妍不必停地点动作(data, '完成卧室余韵', '301', 80);
  result = commit(data, result.事件, 81);
  assert.equal(result.CG, 'ARY-NBS-13-N');
  result = route.执行安若妍不必停地点动作(data, '出去见江辰', '301', 82);
  result = commit(data, result.事件, 83);
  result = commit(data, result.后续事件, 84);
  assert.equal(data.系统._安若妍不必停.阶段, '待最终登记');
  assert.equal(data.系统._安若妍不必停.江辰已接受互不干涉, true);
  assert.equal(data.系统._安若妍不必停.对外夫妻身份保留, true);
  assert.equal(data.系统._安若妍不必停.提前通知已约定, true);
  assert.equal(data.系统._已完成特殊场景.includes('不必停'), false);

  data.系统._绝对时段 = data.系统._安若妍不必停.最终登记最早时段;
  result = route.执行安若妍不必停地点动作(data, '将301丈夫到访改为提前通知', '管理员室', 85);
  assert.equal(result.成功, true);
  assert.equal(data.系统._安若妍不必停.阶段, '已完成');
  assert.equal(data.系统._已完成特殊场景.includes('不必停'), true);
  assert.equal(data.户['301'].夫._居住模式, '提前通知');
  assert.equal(risk.读取丈夫线路风险阶段(data, '301'), '关系转变');
  assert.equal(data.户['301'].夫.结局轨道, '');
  const firstFloor = data.系统._安若妍不必停.完成楼层;
  const repeated = route.执行安若妍不必停地点动作(data, '将301丈夫到访改为提前通知', '管理员室', 99);
  assert.equal(repeated.成功, true);
  assert.equal(repeated.变动, false);
  assert.equal(data.系统._安若妍不必停.完成楼层, firstFloor);
  assert.equal(data.系统._已完成特殊场景.filter(id => id === '不必停').length, 1);
});

test('正式301结局已经完成时承接商品不会倒挂重新上架', () => {
  const data = fresh();
  data.系统._已完成特殊场景.push(route.安若妍正式结局完成ID);
  assert.equal(route.安若妍不必停商店已上架(data), false);
  assert.equal(route.购买安若妍不必停(data).成功, false);
  assert.equal(data.现金, 5000);
});

test('医院生产和父亲电话会冻结预约，解除占用后不重做卷宗即可继续', () => {
  const data = fresh();
  const state = data.系统._安若妍不必停;
  Object.assign(state, {
    阶段: '等待预约夜',
    道具已购买: true,
    道具已使用: true,
    卷宗状态: '301书房',
    取件登记已完成: true,
    预约夜绝对时段: 10,
    最早继续时段: 10,
  });
  data.系统._绝对时段 = 10;
  data.户['301'].妻._生产.状态 = '住院中';
  let synced = route.同步安若妍不必停时间节点(data);
  assert.equal(state.阶段, '等待预约夜');
  assert.match(state.暂停原因, /医院|待产|恢复/);
  assert.match(synced.提示, /冻结/);

  data.户['301'].妻._生产.状态 = '无';
  data.系统._父亲通话.标识 = 'call-301-test';
  synced = route.同步安若妍不必停时间节点(data);
  assert.equal(state.阶段, '等待预约夜');
  assert.match(state.暂停原因, /电话/);

  data.系统._父亲通话.标识 = '';
  synced = route.同步安若妍不必停时间节点(data);
  assert.equal(synced.变动, true);
  assert.equal(state.阶段, '待核对卷宗');
  assert.equal(state.卷宗状态, '301书房');
  assert.equal(state.取件登记已完成, true);
  assert.equal(state.暂停原因, '');
});

test('节拍验收阻止H7替玩家决定、D1第一拍一次说完和H8把江辰写成观众', () => {
  const h7 = '【安若妍不必停提交:H7门边看清:1】';
  assert.match(route.安若妍不必停正文越拍原因(h7, '江辰看清后立刻替玩家关上门，并约定以后提前通知。'), /替玩家|提前/);
  const d1 = '【安若妍不必停提交:D1客厅:1】';
  assert.match(route.安若妍不必停正文越拍原因(d1, '三人一次说完互不干涉、对外夫妻、以后提前通知，江辰带走卷宗离开。'), /一次说完/);
  const h8 = '【安若妍不必停提交:H8关门:1】';
  assert.match(route.安若妍不必停正文越拍原因(h8, '玩家继续，江辰站在门边观看，最后关上卧室门。'), /参与者、观众或打断者/);
});

test('源码接线同时覆盖原生回合、固定回合、房卡、快照和严格图片白名单', () => {
  const files = [
    '../../src/人妻公寓/脚本/游戏逻辑/index.ts',
    '../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts',
    '../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts',
    '../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts',
    '../../src/人妻公寓/界面/客户端/App.vue',
    '../../src/人妻公寓/界面/客户端/assets.ts',
  ].map(path => readFileSync(new URL(path, import.meta.url), 'utf8'));
  const joined = files.join('\n');
  assert.match(joined, /提交安若妍不必停剧情事件/);
  assert.match(joined, /安若妍不必停事件要求H1开场/);
  assert.match(joined, /人妻公寓:安若妍不必停动作/);
  assert.match(joined, /安若妍不必停快照提示/);
  assert.match(joined, /安若妍不必停CG白名单/);
  assert.match(joined, /ARY-NBS-\(\?:06\|09\|10\|13\)-\(\?:N\|P\)/);

  const app = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
  assert.match(app, /安若妍不必停CG队列\.value\.push\(画面\)/);
  assert.match(app, /当前家庭计划CG\.value = 安若妍不必停CG队列\.value\.shift\(\) \?\? null/);
  assert.match(app, /if \(!安若妍不必停CG覆盖普通亲密\(画面\.文件\)\) 清空当前成人CG\(\)/);
  assert.match(app, /function 清空安若妍不必停CG队列\(\): void/);
  assert.doesNotMatch(app, /录像带双承接CG队列/u, '不必停队列不得继续借用已退场录像带视觉所有者');

  const native = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const nativeBroadcaster = native.slice(native.indexOf('function 播放安若妍不必停CG'), native.indexOf('function 播放许曼君离婚CG'));
  assert.doesNotMatch(nativeBroadcaster, /setTimeout/);
  const fixed = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  const fixedCommit = fixed.slice(fixed.indexOf('const 安若妍不必停票'), fixed.indexOf('const 许曼君分居票'));
  assert.doesNotMatch(fixedCommit, /setTimeout/);
});
