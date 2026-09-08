/* eslint-disable import-x/no-nodejs-modules -- Node integration regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';

globalThis._ = lodash;
let vars = { _场景: { 房间id: '301', 进房末楼: 1 } };
globalThis.getVariables = () => vars;
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');
const resource = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const snapshot = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
const handlers = [];
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'eventOn' &&
    node.arguments[0]?.text === '人妻公寓:安若妍换掉动作') handlers.push(node.arguments[1].getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(handlers.length, 1);
const handlerJS = transpile(`const handler = ${handlers[0]};`);

function fresh() {
  const d = Schema.parse({ 户: { 301: 创建户节点(0) }, 现金: 5000 });
  Object.assign(d.户['301'].妻, { 当前阶段: 5, 阶段性癖: '镜头高潮' });
  Object.assign(d.户['301'].夫, { _居住模式: '提前通知', 状态: '外出' });
  // Completed predecessor is a fixture; all current-route preparation uses real producers.
  Object.assign(d.系统._安若妍不必停, {
    阶段: '已完成', 江辰已明确看见: true, 江辰已接受互不干涉: true, 提前通知已约定: true,
  });
  d.系统._已完成特殊场景.push('不必停');
  d.玩家资源.体力.永久上限加成 = 5;
  d.玩家资源.体力.当前值 = 7;
  return d;
}
function act(d, id, place = '301', floor = 10) {
  const result = route.执行安若妍换掉地点动作(d, id, place, floor, 'snap01-chat@0');
  assert.equal(result.成功, true, result.提示);
  return result;
}
function settle(d, before, event, floor, action = '完成当前步骤', change = {}) {
  return resource.结算成功现场楼(d, before, {
    场景: '301', 楼层: floor, 行动: action, 正文: '安若妍完成当前动作，将下一步交给玩家。',
    本楼事件: event, 妻在场: ['301'], 实际尺度: { 301: 3 }, 资源计费: true, ...change,
  });
}
function fixed(d, id, floor = 10) {
  const event = act(d, id, '301', floor).事件;
  const before = lodash.cloneDeep(d);
  assert.equal(route.提交安若妍换掉剧情事件(d, event, '301', floor).成功, true);
  settle(d, before, event, floor);
  return event;
}
function ready() {
  const d = fresh();
  assert.equal(route.购买安若妍换掉(d).成功, true);
  fixed(d, '使用换掉'); act(d, '购买拍立得', '公寓外部');
  d.系统._绝对时段 = 10;
  fixed(d, '交付拍立得', 12); fixed(d, '预约江辰', 13);
  act(d, '登记江辰到访', '管理员室', 14);
  d.系统._绝对时段 = d.系统._安若妍换掉.预约夜绝对时段;
  fixed(d, '等江辰回来', 15); fixed(d, '递相机', 16);
  return d;
}
async function realButton(d) {
  vars = { _场景: { 房间id: '301', 进房末楼: 1 } };
  let pending, captured;
  const env = {
    _时间推进中: false,
    eventEmit: () => {},
    安全操作: callback => { pending = callback({}, d); return pending; },
    同步安若妍换掉时间节点: route.同步安若妍换掉时间节点,
    读场景: () => vars._场景,
    安若妍换掉地点动作: route.安若妍换掉地点动作,
    有普通场景剧情阻塞当前场景: () => false,
    隔离事件进行中: () => false,
    执行安若妍换掉地点动作: route.执行安若妍换掉地点动作,
    当前楼层: () => 17,
    当前聊天ID: () => 'snap01-chat',
    当前时间线切换世代: () => 0,
    即时开演: (prepare, raw, data, action, hasEvent, options) => {
      const result = prepare();
      assert.equal(hasEvent(result), true);
      captured = { ...result, action, options };
      return result;
    },
  };
  const handler = new Function(...Object.keys(env), `${handlerJS}\nreturn handler;`)(...Object.values(env));
  handler('开始镜头前');
  await pending;
  assert.ok(captured, 'Actual listener must reach immediate-play adapter');
  return captured;
}
function snap(d, event, action = '继续当前步骤') {
  vars = { _场景: { 房间id: '301', 进房末楼: 1 } };
  return snapshot.组公寓快照([{ role: 'user', content: action }], d, 17, event);
}

test('真实按钮H1产票→完整快照分类→正式提交→零进度绑定', async () => {
  const d = ready(), prepared = await realButton(d), before = lodash.cloneDeep(d);
  assert.equal(route.安若妍换掉事件要求H1开场(prepared.事件), true);
  assert.equal(route.安若妍换掉剧情演员错误(prepared.事件, ['301'], ['301']), '');
  const text = snap(d, prepared.事件, prepared.action);
  assert.doesNotMatch(text, /【本轮性质·日常】/);
  assert.match(text, /【尺度判定·详】/);
  assert.equal(d.系统._性爱场景.状态, '空闲', 'Snapshot must not create the session');
  assert.deepEqual(d.系统._安若妍换掉, before.系统._安若妍换掉);
  const commit = route.提交安若妍换掉剧情事件(d, prepared.事件, '301', 17);
  assert.equal(commit.成功, true);
  assert.equal(commit.需普通亲密开场, true);
  const result = settle(d, before, prepared.事件, 17, prepared.action);
  assert.equal(result.性爱开始, true);
  assert.equal(result.已消费, null);
  assert.equal(result.抑制普通CG, true);
  assert.equal(route.安若妍换掉真实亲密已绑定(d), true);
  assert.equal(d.系统._性爱场景.有效楼数, 0);
  assert.equal(d.系统._性爱场景.参与者['301'].满意度, 0);
  assert.equal(d.玩家资源.体力.当前值, 7);
  const after = lodash.cloneDeep(d);
  assert.equal(route.提交安若妍换掉剧情事件(d, prepared.事件, '301', 17).成功, false);
  assert.deepEqual(d, after);
});

test('结构化H1识别与文案独立，JSON重载后分类相同', async () => {
  const d = ready(), prepared = await realButton(d);
  const marker = prepared.事件.match(/【安若妍换掉提交:[^】]+】/u)[0];
  for (const state of [d, Schema.parse(JSON.parse(JSON.stringify(d)))]) {
    const text = snap(state, `${marker}【事件在场妻:301】【事件在场夫:301】`, '继续。');
    assert.doesNotMatch(text, /【本轮性质·日常】/);
    assert.match(text, /【尺度判定·详】/);
  }
});

for (const event of ['', '【安若妍换掉提交:H1】', '【安若妍换掉提交:H99:test】', '【安若妍换掉提交:C2:test】']) {
  test(`普通谈话/非H1不因本修复开放详模式：${event || '无事件'}`, () => {
    const text = snap(ready(), event, '今天的安排怎样');
    assert.match(text, /【本轮性质·日常】/);
    assert.doesNotMatch(text, /【尺度判定·详】/);
  });
}

for (const [label, mutate, input] of [
  ['不足七点体力', d => { d.玩家资源.体力.当前值 = 6; }, {}],
  ['地点改变', () => {}, { 场景: '302' }],
  ['另一名演员', () => {}, { 妻在场: ['202'] }],
  ['额外演员', () => {}, { 妻在场: ['301', '202'] }],
  ['路线阶段失效', d => { d.系统._安若妍换掉.阶段 = '待预约'; }, {}],
]) {
  test(`H1零进度资源门仍拒绝${label}`, async () => {
    const d = ready(), prepared = await realButton(d), before = lodash.cloneDeep(d);
    assert.equal(route.提交安若妍换掉剧情事件(d, prepared.事件, '301', 17).成功, true);
    mutate(d);
    const resources = lodash.cloneDeep(d.系统._性爱场景), stamina = d.玩家资源.体力.当前值;
    assert.throws(() => settle(d, before, prepared.事件, 17, prepared.action, input));
    assert.deepEqual(d.系统._性爱场景, resources);
    assert.equal(d.玩家资源.体力.当前值, stamina);
  });
}

test('后续普通有效楼/固定暂停/收尾继续沿用原资源分类', async () => {
  const d = ready(), prepared = await realButton(d), before = lodash.cloneDeep(d);
  route.提交安若妍换掉剧情事件(d, prepared.事件, '301', 17);
  settle(d, before, prepared.事件, 17, prepared.action);
  const session = d.系统._性爱场景.场次标识;
  for (let floor = 18; floor < 22; floor++) {
    const old = lodash.cloneDeep(d);
    settle(d, old, '', floor, '继续当前互动');
  }
  assert.equal(d.系统._性爱场景.有效楼数, 4);
  assert.equal(d.系统._安若妍换掉.阶段, '待P1');
  const stamina = d.玩家资源.体力.当前值;
  const p1 = fixed(d, '拍第一张', 22);
  assert.equal(d.系统._性爱场景.有效楼数, 4);
  assert.equal(d.系统._性爱场景.场次标识, session);
  assert.equal(d.玩家资源.体力.当前值, stamina);
  assert.doesNotMatch(snap(d, p1), /【本轮性质·日常】/);
  d.系统._性爱场景.状态 = '收尾中';
  d.玩家资源.体力.当前值 = 0;
  assert.match(snap(d, ''), /【亲密场景·体力耗尽】/);
});

test('同族不必停H1也由真实票决定分类并保持零进度', () => {
  const sibling = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
  const risk = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');
  // Reuse only the existing fixture preparation functions, never its test runner or assertions as product logic.
  const fixtureSource = readFileSync(new URL('./安若妍不必停.test.mjs', import.meta.url), 'utf8');
  const fixtureAST = ts.createSourceFile('fixture.mjs', fixtureSource, ts.ScriptTarget.Latest, true);
  const names = new Set(['fresh', 'commit', 'startThroughH1']);
  const fixtures = fixtureAST.statements.filter(n => ts.isFunctionDeclaration(n) && names.has(n.name?.text));
  assert.equal(fixtures.length, 3);
  let captured;
  const adapter = { ...resource, 结算成功现场楼: (data, before, input) => {
    if (sibling.安若妍不必停事件要求H1开场(input.本楼事件)) captured = { data: lodash.cloneDeep(before), event: input.本楼事件 };
    return resource.结算成功现场楼(data, before, input);
  } };
  const run = new Function('Schema', '创建户节点', 'assert', 'lodash', 'route', 'resource', 'risk',
    `${fixtures.map(f => f.getText(fixtureAST)).join('\n')}\nreturn startThroughH1(fresh());`);
  const data = run(Schema, 创建户节点, assert, lodash, sibling, adapter, risk);
  assert.ok(captured);
  const text = snap(captured.data, captured.event, '开始《他回来以前》');
  assert.doesNotMatch(text, /【本轮性质·日常】/);
  assert.match(text, /【尺度判定·详】/);
  assert.equal(data.系统._性爱场景.有效楼数, 0);
  assert.equal(data.玩家资源.体力.当前值, 7);
});
