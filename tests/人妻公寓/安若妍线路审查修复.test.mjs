/* eslint-disable import-x/no-nodejs-modules -- Node-only route integration regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';

globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '301' } });
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const nbs = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
const rpl = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');
const resource = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const txn = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const risk = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');

function fresh() {
  const d = Schema.parse({ 户: { 301: 创建户节点(0) } });
  Object.assign(d.户['301'].妻, { 当前阶段: 5, 阶段性癖: '镜头高潮' });
  Object.assign(d.户['301'].夫, { _居住模式: '提前通知', 状态: '外出' });
  d.现金 = 5000;
  d.玩家资源.体力.训练经验 = 24;
  d.玩家资源.体力.当前值 = 15;
  return d;
}
function settle(d, event, floor, scale = 3, old = lodash.cloneDeep(d)) {
  return resource.结算成功现场楼(d, old, {
    场景: '301', 楼层: floor, 行动: '继续当前互动', 正文: '安若妍明确继续参与当前互动。',
    本楼事件: event, 妻在场: ['301'], 实际尺度: { 301: scale }, 资源计费: true,
  });
}
function nbsBeforeH1() {
  const d = fresh();
  assert.equal(nbs.购买安若妍不必停(d).成功, true);
  const act = (id, place = '301') => {
    const r = nbs.执行安若妍不必停地点动作(d, id, place, 1, 'audit@0');
    assert.equal(r.成功, true, r.提示); return r;
  };
  const fixed = id => {
    let e = act(id).事件;
    while (e) {
      const r = nbs.提交安若妍不必停剧情事件(d, e, '301', 2);
      assert.equal(r.成功, true); e = r.后续事件;
    }
  };
  fixed('使用不必停');
  d.系统._绝对时段 = d.系统._安若妍不必停.最早继续时段;
  act('签收301密封卷宗箱', '大堂'); act('登记301代收件与取件时段', '管理员室');
  fixed('把卷宗箱放进301书房');
  d.系统._绝对时段 = d.系统._安若妍不必停.预约夜绝对时段;
  fixed('确认卷宗仍在书房'); fixed('把前门留作未反锁');
  return d;
}
function nbsOpen() {
  const d = nbsBeforeH1();
  const event = nbs.执行安若妍不必停地点动作(d, '开始他回来以前', '301', 8).事件;
  const old = lodash.cloneDeep(d);
  assert.equal(nbs.提交安若妍不必停剧情事件(d, event, '301', 9).成功, true);
  settle(d, event, 9, 3, old);
  return d;
}
function rplFixed(d, id, floor) {
  const a = rpl.执行安若妍换掉地点动作(d, id, '301', floor, 'audit@0');
  assert.equal(a.成功, true, a.提示);
  const old = lodash.cloneDeep(d);
  assert.equal(rpl.提交安若妍换掉剧情事件(d, a.事件, '301', floor).成功, true);
  settle(d, a.事件, floor, 3, old);
  return a.事件;
}
function rplBeforeH1() {
  const d = fresh();
  Object.assign(d.系统._安若妍不必停, { 阶段: '已完成', 江辰已明确看见: true, 江辰已接受互不干涉: true, 提前通知已约定: true });
  d.系统._已完成特殊场景.push('不必停');
  assert.equal(rpl.购买安若妍换掉(d).成功, true);
  rplFixed(d, '使用换掉', 1);
  assert.equal(rpl.执行安若妍换掉地点动作(d, '购买拍立得', '公寓外部', 2).成功, true);
  d.系统._绝对时段 = 10;
  rplFixed(d, '交付拍立得', 3); rplFixed(d, '预约江辰', 4);
  assert.equal(rpl.执行安若妍换掉地点动作(d, '登记江辰到访', '管理员室', 5).成功, true);
  d.系统._绝对时段 = d.系统._安若妍换掉.预约夜绝对时段;
  rplFixed(d, '等江辰回来', 6); rplFixed(d, '递相机', 7);
  return d;
}

// Extract the actual production sync statements, including their immediate guards.
// The route transition and resource creation remain real; no substitute sync implementation.
function productionSyncSteps(file, variable) {
  const source = readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${file}`, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const steps = [];
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === '同步安若妍不必停时间节点' && node.arguments[0]?.getText(ast) === variable) {
      let statement = node;
      while (!ts.isStatement(statement)) statement = statement.parent;
      if (ts.isIfStatement(statement.parent)) statement = statement.parent;
      else if (ts.isBlock(statement.parent) && ts.isIfStatement(statement.parent.parent)) statement = statement.parent.parent;
      const js = ts.transpileModule(statement.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
      const run = new Function(variable, '本楼事件', '同步安若妍不必停时间节点', '安若妍不必停事件要求H1开场', '排队提交后提示', js);
      steps.push((d, event) => run(d, event, nbs.同步安若妍不必停时间节点, nbs.安若妍不必停事件要求H1开场, () => {}));
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(steps.length, `${file} must exercise a production sync call`);
  return steps;
}
for (const [file, variable] of [['回合引擎.ts', 'newStat'], ['index.ts', 'newData']]) {
  test(`${file}: H1提交与资源建账之间的真实同步语句不重排新场次`, () => {
    for (const sync of productionSyncSteps(file, variable)) {
      const d = nbsBeforeH1();
      const event = nbs.执行安若妍不必停地点动作(d, '开始他回来以前', '301', 8).事件;
      const old = lodash.cloneDeep(d);
      nbs.提交安若妍不必停剧情事件(d, event, '301', 9);
      sync(d, event);
      assert.equal(settle(d, event, 9, 3, old).性爱开始, true);
      assert.equal(nbs.安若妍不必停真实亲密已绑定(d), true);
      assert.equal(d.系统._性爱场景.有效楼数, 0);
    }
  });
}

for (const [name, prepare, state, actions, act, block] of [
  ['不必停', nbsBeforeH1, '_安若妍不必停', nbs.安若妍不必停地点动作, nbs.执行安若妍不必停地点动作, nbs.安若妍不必停时间动作阻断原因],
  ['换掉', rplBeforeH1, '_安若妍换掉', rpl.安若妍换掉地点动作, rpl.执行安若妍换掉地点动作, rpl.安若妍换掉时间动作阻断原因],
]) {
  test(`${name}: 六点体力、七点上限可在开场前改约，补给不被用作绕门`, () => {
    const d = prepare();
    Object.assign(d.玩家资源.体力, { 训练经验: 3, 永久上限加成: 0, 当前值: 6 });
    d.背包.push('强效营养剂');
    assert.equal(resource.使用资源道具(d, '强效营养剂').成功, false);
    assert.ok(actions(d, '301').some(a => a.id === '暂缓预约夜' && a.可执行));
    const before = lodash.cloneDeep(d);
    assert.equal(act(d, '暂缓预约夜', '201', 20).成功, false);
    assert.equal(act(d, '暂缓预约夜', '301', 20).成功, true);
    assert.equal(block(d), '');
    assert.equal(d.系统[state].阶段, '等待预约夜');
    assert.ok(d.系统[state].预约夜绝对时段 > d.系统._绝对时段);
    assert.equal(d.现金, before.现金);
    assert.equal(d.玩家资源.体力.当前值, 6);
    if (name === '不必停') {
      assert.equal(d.系统[state].卷宗状态, '301书房');
      assert.equal(d.系统[state].取件登记已完成, true);
    } else assert.equal(d.系统[state].拍立得状态, '已交付');
    const saved = Schema.parse(lodash.cloneDeep(d));
    assert.equal(act(saved, '暂缓预约夜', '301', 20).成功, false);
    assert.deepEqual(saved, d);
    d.系统._绝对时段 = d.系统[state].预约夜绝对时段;
    resource.完全恢复玩家资源(d);
    assert.equal(d.玩家资源.体力.当前值, 7);
    assert.ok(actions(d, '301').some(a => a.可执行));
  });
}
test('开场前改约不越过活动剧情，也不作为H7/P1的廉价退出入口', () => {
  const n = nbsOpen(); for (let i = 0; i < 4; i++) settle(n, '', 30 + i);
  assert.equal(nbs.执行安若妍不必停地点动作(n, '暂缓预约夜', '301', 40).成功, false);
  const r = rplBeforeH1(); rplFixed(r, '开始镜头前', 8);
  for (let i = 0; i < 4; i++) settle(r, '', 30 + i);
  assert.equal(rpl.执行安若妍换掉地点动作(r, '暂缓预约夜', '301', 40).成功, false);
  assert.ok(rpl.安若妍换掉时间动作阻断原因(r));
});

test('开场前各检查点都可改约，医院冻结不封死出口，正在生成的票仍受保护', () => {
  for (const [prepare, key, stages, actions, act] of [
    [nbsBeforeH1, '_安若妍不必停', ['待核对卷宗', '待设置门锁', '待H1开场'], nbs.安若妍不必停地点动作, nbs.执行安若妍不必停地点动作],
    [rplBeforeH1, '_安若妍换掉', ['待递相机', '待开场'], rpl.安若妍换掉地点动作, rpl.执行安若妍换掉地点动作],
  ]) {
    for (const stage of stages) {
      const d = prepare(); d.系统[key].阶段 = stage;
      d.户['301'].妻._生产.状态 = '住院中';
      d.系统._待接来电.期 = 1;
      assert.ok(actions(d, '301').some(a => a.id === '暂缓预约夜' && a.可执行));
      txn.激活新增场景剧情(d, { 目标场景: '301', 内容: '当前真实剧情', 标题: '待演', 行动: '继续', 触发楼层: 20 });
      assert.equal(act(d, '暂缓预约夜', '301', 20).成功, false);
      assert.ok(d.系统._场景剧情事务.id);
    }
  }
});

test('H1失败与取消只保留重试票，旧请求不能认领新的重试世代', () => {
  for (const file of ['回合引擎.ts', 'index.ts']) {
    const d = nbsBeforeH1();
    const start = nbs.执行安若妍不必停地点动作(d, '开始他回来以前', '301', 8);
    const active = txn.激活新增场景剧情(d, { 目标场景: '301', 内容: start.事件, 标题: 'H1', 行动: '继续', 触发楼层: 8 });
    const { id, 请求世代: oldGeneration, 内容: event } = active.事务;
    assert.equal(txn.标记场景剧情待重试(d, id, oldGeneration), true);
    nbs.同步安若妍不必停时间节点(d);
    assert.equal(d.系统._安若妍不必停.阶段, 'H1开场中');
    assert.equal(d.系统._性爱场景.状态, '空闲');
    assert.equal(txn.准备重试场景剧情(d, '301').成功, true);
    const old = lodash.cloneDeep(d);
    const candidate = lodash.cloneDeep(d);
    nbs.提交安若妍不必停剧情事件(candidate, event, '301', 9);
    for (const sync of productionSyncSteps(file, file === 'index.ts' ? 'newData' : 'newStat')) sync(candidate, event);
    settle(candidate, event, 9, 3, old);
    assert.equal(txn.提交场景剧情成功(candidate, event, id, oldGeneration), false);
    assert.deepEqual(d, old);
    assert.equal(txn.提交场景剧情成功(candidate, event, id, d.系统._场景剧情事务.请求世代), true);
    assert.equal(nbs.安若妍不必停真实亲密已绑定(candidate), true);
  }
});

test('H6活动票失效恢复原子释放本线锁，保留其他等待票和卷宗前置', () => {
  const d = nbsOpen(); for (let i = 0; i < 4; i++) settle(d, '', 30 + i);
  const active = txn.激活队首场景剧情(d, '301', 40, '继续'); assert.equal(active.成功, true);
  txn.追加等待场景剧情(d, '其他住户待演事件', '201', '其他剧情');
  d.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
  nbs.同步安若妍不必停时间节点(d);
  assert.equal(d.系统._场景剧情事务.id, '');
  assert.match(d.系统._待发送事件, /其他住户待演事件/);
  assert.doesNotMatch(d.系统._待发送事件, /安若妍不必停提交/);
  assert.equal(d.系统._安若妍不必停.卷宗状态, '301书房');
  assert.equal(txn.提交场景剧情成功(d, active.事务.内容, active.事务.id), false);
  const saved = Schema.parse(lodash.cloneDeep(d));
  nbs.同步安若妍不必停时间节点(saved); assert.deepEqual(saved, d);
});
test('失效恢复保留其他户活动事务及已完成线路，启动和回档接入同一修复', () => {
  const d = nbsOpen();
  const other = txn.激活新增场景剧情(d, { 目标场景: '201', 内容: '201既有剧情', 标题: '201', 行动: '继续', 触发楼层: 20 });
  assert.equal(other.成功, true);
  d.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
  assert.equal(nbs.恢复安若妍不必停失效亲密检查点(d), true);
  assert.deepEqual(d.系统._场景剧情事务, other.事务);
  const complete = nbsOpen(); complete.系统._已完成特殊场景.push('不必停');
  complete.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
  const snapshot = lodash.cloneDeep(complete);
  assert.equal(nbs.恢复安若妍不必停失效亲密检查点(complete), false);
  assert.deepEqual(complete, snapshot);
  for (const file of ['index.ts', '回合引擎.ts']) {
    const src = readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${file}`, import.meta.url), 'utf8');
    assert.match(src, /恢复安若妍不必停失效亲密检查点\((?:data|当前真值)\)/u);
  }
});

for (const [scene, body] of [
  ['H1开场', '江辰还没有回来。安若妍把下一步交给玩家。'],
  ['H8关门', '玩家继续刚才的动作，江辰没有质问，从外面关上卧室门。'],
  ['H8关门', '玩家继续刚才的动作，江辰从外面将卧室门合上，转身去书房。'],
  ['D1客厅', '双方私人生活互不干涉，以后回来会提前通知。他们没有离婚，也没有交出钥匙。'],
]) {
  test(`语义验收接受正常表述：${body}`, () => {
    assert.equal(nbs.安若妍不必停正文越拍原因(`【安若妍不必停提交:${scene}:${scene === 'D1客厅' ? 2 : 1}】`, body), '');
  });
}
test('否定句不能掩盖后续真实越拍，也不能让尚未关门通过H8', () => {
  for (const [scene, body] of [
    ['H1开场', '江辰没有停留，直接进门看见安若妍。'],
    ['H1开场', '江辰还没有回来。过了一会儿，江辰回来了。'],
    ['H1开场', '江辰并非没有回来。'],
    ['H8关门', '玩家继续刚才的动作，江辰没有关上卧室门。'],
    ['H8关门', '玩家继续刚才的动作，江辰没有把卧室门关上。'],
    ['H8关门', '玩家继续，江辰关上卧室门后又加入了他们。'],
    ['D1客厅', '双方互不干涉，以后提前通知。两人已经离婚。'],
  ]) assert.notEqual(nbs.安若妍不必停正文越拍原因(`【安若妍不必停提交:${scene}:${scene === 'D1客厅' ? 2 : 1}】`, body), '');
});

test('旧待收尾检查点不能绕过P2后两楼，重复楼层不伪造合格收尾', () => {
  const d = rplBeforeH1(); rplFixed(d, '开始镜头前', 8);
  for (let i = 0; i < 5; i++) settle(d, '', 20 + i, i === 4 ? 3 : 1);
  rplFixed(d, '拍第一张', 30); settle(d, '', 31); rplFixed(d, '拍最终照', 32);
  settle(d, '', 33);
  d.系统._安若妍换掉.阶段 = '待收尾';
  d.系统._安若妍换掉.已登记亲密楼层.push(33, 33);
  assert.equal(rpl.安若妍换掉接管普通收尾(d), true);
  const result = {
    ...Schema.parse({}).系统._上次性爱结果,
    场次标识: d.系统._性爱场景.场次标识,
    结束方式: '主动收尾',
    参与者: { 301: { ...d.系统._性爱场景.参与者['301'], 有效楼数: 7, 满意度: 6 } },
  };
  rpl.结算安若妍换掉亲密收尾(d, result);
  assert.equal(d.系统._安若妍换掉.阶段, '等待预约夜');
  assert.equal(d.系统._安若妍换掉.拍摄历史.length, 1);
  assert.equal(d.系统._已完成特殊场景.includes(rpl.安若妍换掉商品ID), false);
});

for (const pre of [4, 5, 6]) {
  test(`前半${pre}楼仍需P2后两楼，重载、重复楼层不缩短后半`, () => {
    let d = rplBeforeH1(); rplFixed(d, '开始镜头前', 8);
    for (let i = 0; i < pre; i++) settle(d, '', 20 + i, i === pre - 1 ? 3 : 1);
    rplFixed(d, '拍第一张', 30); settle(d, '', 31); rplFixed(d, '拍最终照', 32);
    settle(d, '', 33);
    assert.equal(d.系统._安若妍换掉.阶段, '后半');
    assert.deepEqual(resource.亲密收尾选项(d), []);
    const snapshot = lodash.cloneDeep(d);
    rpl.登记安若妍换掉亲密有效楼(d, { 场景: '301', 楼层: 33, 实际尺度: 3 });
    assert.deepEqual(d, snapshot);
    d = Schema.parse(snapshot);
    settle(d, '', 34);
    assert.equal(d.系统._安若妍换掉.阶段, '待收尾');
    assert.ok(resource.亲密收尾选项(d).length);
    const restored = Schema.parse(snapshot);
    assert.equal(rpl.安若妍换掉接管普通收尾(restored), true);
  });
}
test('正式完成ID统一关闭301风险，回档、仅购票和其他住户保持原规则', () => {
  const d = fresh(); d.户['201'] = 创建户节点(0);
  const before = Schema.parse(lodash.cloneDeep(d));
  d.系统._已完成特殊场景.push(rpl.安若妍换掉商品ID);
  assert.equal(rpl.安若妍结局后亲密可用(d, '301'), true);
  assert.equal(risk.读取丈夫线路风险阶段(d, '301'), '关系转变');
  assert.equal(risk.读取丈夫线路风险阶段(d, '201'), '常规');
  assert.equal(risk.读取丈夫线路风险阶段(before, '301'), '常规');
  before.背包.push(rpl.安若妍换掉商品ID);
  assert.equal(risk.读取丈夫线路风险阶段(before, '301'), '常规');
});
