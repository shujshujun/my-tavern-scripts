/* eslint-disable import-x/no-nodejs-modules -- Node regression tests */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const routePath = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');
if (process.env.PLAY021_SOURCE) {
  const module = { exports: {} };
  const js = ts.transpileModule(readFileSync(process.env.PLAY021_SOURCE, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', js)(createRequire(routePath), module, module.exports);
  require.cache[routePath] = { id: routePath, filename: routePath, loaded: true, exports: module.exports };
}
const route = require(routePath);
const { 不再留门价格 } = require('../../src/人妻公寓/不再留门契约.ts');
const { 结算成功现场楼 } = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const { 创建受控生成等待 } = require('../../src/人妻公寓/脚本/游戏逻辑/受控生成等待.ts');

// Execute the exact engine preflight statements with the real shared predicate.
// This verifies the wired early throw, not the surrounding model/save lifecycle.
const engineSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('engine.ts', engineSource, ts.ScriptTarget.Latest, true);
const preflight = [];
function visit(node) {
  if (ts.isBlock(node)) {
    node.statements.forEach((stmt, i) => {
      if (ts.isVariableStatement(stmt) && stmt.declarationList.declarations.some(d => d.name.getText(ast) === '不再留门回应阻断')) {
        assert.ok(ts.isIfStatement(node.statements[i + 1]));
        preflight.push(`${stmt.getText(ast)}\n${node.statements[i + 1].getText(ast)}`);
      }
    });
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(preflight.length, 1);
const engineGate = new Function('不再留门回应错误', '本楼事件', '行动', preflight[0]).bind(null, route.不再留门回应错误);

let floor = 1;
function act(d, action, place = '202') {
  const result = route.执行不再留门动作(d, action, place, floor++, 'chat-play021:branch-a', 'play021');
  assert.equal(result.成功, true, result.提示);
  return result;
}
function waitFor(d, action, place = '202') {
  const from = d.系统._绝对时段;
  for (let t = from; t < from + 84; t++) {
    d.系统._绝对时段 = t;
    if (!route.不再留门动作阻断(d, action, place)) return;
  }
  assert.fail(route.不再留门动作阻断(d, action, place));
}
function beat(d, event, place = '202') {
  const before = lodash.cloneDeep(d);
  const reply = route.不再留门明确回应(d) || '继续当前谈话。';
  const result = route.提交不再留门剧情事件(d, event, place, floor, reply);
  assert.equal(result?.成功, true, result?.提示);
  if (route.不再留门事件要求真实开录(event)) {
    const settled = 结算成功现场楼(d, before, {
      楼层: floor, 场景: place, 行动: reply, 正文: '她确认之后，亲手开始记录。',
      本楼事件: event, 妻在场: ['202'], 实际尺度: { 202: 0 }, 资源计费: false,
    });
    assert.equal(settled.性爱开始, true);
  }
  floor++;
  return result;
}
function scene(d, action, place = '202') {
  let event = act(d, action, place).事件;
  while (event) event = beat(d, event, place).后续剧情?.事件;
}
function atDecision() {
  const d = Schema.parse({ 户: { 202: 创建户节点(0), 102: 创建户节点(0) }, 现金: 12000 });
  Object.assign(d.户['202'].妻, { 当前阶段: 5, 阶段性癖: '独占印记' });
  d.玩家资源.体力.当前值 = 5;
  assert.equal(route.购买不再留门物件(d, '不再留门', 不再留门价格.剧情道具).成功, true);
  waitFor(d, '使用道具'); scene(d, '使用道具');
  waitFor(d, '观察街对面', '公寓外部'); scene(d, '观察街对面', '公寓外部');
  act(d, '拍照', '公寓外部');
  waitFor(d, '出示照片'); scene(d, '出示照片'); act(d, '交付副本');
  let event = act(d, '听她决定').事件;
  event = beat(d, event).后续剧情.事件;
  event = beat(d, event).后续剧情.事件;
  return { d, event };
}
function atStart() {
  const { d, event } = atDecision(); beat(d, event);
  assert.equal(route.购买不再留门物件(d, '便携录制套件', 不再留门价格.便携录制套件).成功, true);
  act(d, '安装套件'); waitFor(d, '开始录制');
  return { d, event: beat(d, act(d, '开始录制').事件).后续剧情.事件 };
}
function atKeep() {
  const { d, event } = atStart(); beat(d, event);
  for (let n = 0; n < 4; n++) {
    const before = lodash.cloneDeep(d);
    结算成功现场楼(d, before, {
      楼层: floor++, 场景: '202', 行动: n === 3 ? '【亲密收尾:停下并收尾】' : '继续当前场次',
      正文: '双方按约定继续，彼此回应。', 本楼事件: '', 妻在场: ['202'], 实际尺度: { 202: 3 }, 资源计费: true,
    });
  }
  assert.equal(d.系统._不再留门.阶段, '待转存');
  act(d, '转存记录');
  return { d, event: beat(d, act(d, '检查记录').事件).后续剧情.事件 };
}

const cases = [
  ['原报告询问', '我同意本次录制和保留了吗？', false],
  ['无问号询问', '我同意本次录制和保留了吗', false],
  ['英文问号', '同意本次录制和保留?', false],
  ['询问后果', '我同意本次录制会有什么后果？', false],
  ['无问号后果', '我同意本次录制会有什么后果', false],
  ['后置条件', '我同意本次录制的话，会怎样', false],
  ['前置条件跨逗号', '如果她愿意，我同意本次录制。', false],
  ['条件句', '只要她愿意，我同意本次录制。', false],
  ['跨逗号引述', '她说：“好，我同意本次录制。”', false],
  ['英文引述', '她说："好，我同意本次录制。"', false],
  ['无引号转述', '她说，我同意本次录制。', false],
  ['历史话语', '昨天，我同意本次录制。', false],
  ['纯拒绝', '我不同意本次录制和保留。', false],
  ['肯定后撤回', '我同意本次录制，但现在撤回许可。', false],
  ['疑问保留', '确认保留这份记录吗', false],
  ['开始疑问', '可以开始录制吗？', false],
  ['开始反问', '可以开始录制是不是太早了', false],
  ['明确肯定', '我同意本次录制和保留。', true],
  ['省略宾语', '我同意', true],
  ['省略主语', '同意本次录制和保留。', true],
  ['愿意', '好，我愿意保留这次记录。', true],
  ['保留快捷语', '确认保留这份记录。', true],
  ['开始快捷语', '可以开始录制。', true],
  ['后续独立询问', '我同意本次录制和保留。你准备好了吗？', true],
  ['前置独立询问', '你准备好了吗？我现在同意开始这次录制。', true],
  ['引述后本人决定', '她问：“你同意吗？”我同意本次录制和保留。', true],
  ['条件句后新决定', '如果她愿意，再谈安排。我现在同意本次录制。', true],
  ['后置附加条件', '我同意本次录制和保留，如果她也愿意。', false],
  ['逗号后选择疑问', '可以开始录制，还是等我确认后再开始？', false],
  ['引用拒绝后本人肯定', '她问：“你不同意本次录制吗？”我现在同意本次录制和保留。', true],
  ['单引号内他人肯定', '她说：‘好，我同意本次录制。’', false],
  ['英文单引号内他人肯定', "她说：'好，我同意本次录制。'", false],
  ['条件中的引用', '如果她说“好”，我同意本次录制。', false],
  ['同句独立后续提问', '我同意本次录制和保留，你准备好了吗？', true],
  ['尾部确认问句', '我同意本次录制和保留，行吗？', false],
  ['历史后当前决定', '昨天，我犹豫过，现在我同意本次录制。', true],
];
for (const [stage, prepare, next] of [['A5', atDecision, '待准备'], ['A7', atStart, '录制中'], ['A9', atKeep, '待归档']]) {
  const base = prepare();
  assert.equal(route.解析不再留门剧情事件(base.event).场景, stage);
  for (const [label, reply, yes] of cases) {
    test(`${stage} ${label}：真实前置回应与正式提交`, () => {
      const d = lodash.cloneDeep(base.d);
      const result = route.提交不再留门剧情事件(d, base.event, '202', floor++, reply);
      assert.equal(result?.成功, yes, result?.提示);
      if (yes) assert.doesNotThrow(() => engineGate(base.event, reply));
      else assert.throws(() => engineGate(base.event, reply));
      if (yes) {
        assert.equal(d.系统._不再留门.阶段, next);
        const after = lodash.cloneDeep(d);
        assert.equal(route.提交不再留门剧情事件(d, base.event, '202', floor++, reply).变动, false);
        assert.deepEqual(d, after);
      } else assert.deepEqual(d, base.d, '询问不能改许可、照片、记录、设备、背包、资源或修订');
    });
  }
  test(`${stage} 真实确认按钮文案与JSON重载`, () => {
    const d = Schema.parse(JSON.parse(JSON.stringify(base.d)));
    const reply = route.不再留门明确回应(d);
    assert.ok(reply);
    assert.doesNotThrow(() => engineGate(base.event, reply));
    assert.equal(route.提交不再留门剧情事件(d, base.event, '202', floor++, reply).成功, true);
    assert.equal(d.系统._不再留门.阶段, next);
  });
  for (const [label, mutate, place] of [
    ['错地点', () => {}, '302'],
    ['时间变化', d => { d.系统._绝对时段++; }, '202'],
    ['旧修订', d => { d.系统._不再留门.修订++; }, '202'],
    ['别的实例', d => { d.系统._不再留门.实例 = 'other-branch'; }, '202'],
  ]) {
    test(`${stage} ${label}迟到肯定仍不提交`, () => {
      const d = lodash.cloneDeep(base.d); mutate(d);
      const before = lodash.cloneDeep(d);
      assert.equal(route.提交不再留门剧情事件(d, base.event, place, floor++, '我同意本次录制和保留。').成功, false);
      assert.deepEqual(d, before);
    });
  }
  test(`${stage} 暂缓、旧票拒绝、重试明确回应`, () => {
    const d = lodash.cloneDeep(base.d);
    const photo = lodash.cloneDeep(d.系统._不再留门.照片);
    act(d, '暂缓');
    const paused = lodash.cloneDeep(d);
    assert.equal(route.提交不再留门剧情事件(d, base.event, '202', floor++, '我同意本次录制和保留。').成功, false);
    assert.deepEqual(d, paused);
    const retry = act(d, '继续现场');
    assert.notEqual(retry.事件, base.event);
    assert.equal(route.提交不再留门剧情事件(d, retry.事件, '202', floor++, route.不再留门明确回应(d)).成功, true);
    assert.deepEqual(d.系统._不再留门.照片, photo);
  });
  for (const mode of ['超时', '取消', '切聊天', '生成失败']) {
    test(`${stage} ${mode}保留事实，迟到正文不能提交许可`, async () => {
      const d = lodash.cloneDeep(base.d);
      let resolve, reject;
      const pending = new Promise((a, b) => { resolve = a; reject = b; });
      let valid = true;
      const wait = 创建受控生成等待(pending, {
        超时毫秒: 15, 超时说明: 'test timeout', 仍有效: () => valid, 有效性检查间隔毫秒: 5,
      });
      const settled = wait.结果.then(() => route.提交不再留门剧情事件(d, base.event, '202', floor++, route.不再留门明确回应(d)));
      if (mode === '取消') wait.取消();
      if (mode === '切聊天') valid = false;
      if (mode === '生成失败') reject(new Error('test provider failure'));
      await assert.rejects(settled);
      resolve('迟到正文');
      await Promise.resolve();
      assert.deepEqual(d, base.d);
    });
  }
}
