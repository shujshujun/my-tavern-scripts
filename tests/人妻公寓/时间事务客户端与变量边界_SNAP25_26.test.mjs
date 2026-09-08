/* eslint-disable import-x/no-nodejs-modules -- Execute real UI writer and MVU event callbacks with isolated host I/O. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createTimeEnvironment } from './helpers/时间事务验收环境_s4t8.mjs';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const { parse } = require('vue/compiler-sfc');
const gate = require('../../src/人妻公寓/脚本/游戏逻辑/时间事务写入门.ts');
const io = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const vue = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const script = parse(vue).descriptor.scriptSetup.content;
const uiAst = ts.createSourceFile('App.ts', script, ts.ScriptTarget.Latest, true);
const index = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const indexAst = ts.createSourceFile('index.ts', index, ts.ScriptTarget.Latest, true);
const clone = value => structuredClone(value);

function compile(text, name, dependencies) {
  const js = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  return Function('deps', `let {${Object.keys(dependencies).join(',')}} = deps; const exports = {}; ${js}; return ${name};`)(dependencies);
}

function uiFixture() {
  const env = createTimeEnvironment();
  const node = uiAst.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === '写场景');
  assert.ok(node);
  let clears = 0;
  const deps = { ...gate, _: globalThis._, getVariables: globalThis.getVariables, updateVariablesWith: globalThis.updateVariablesWith,
    捕获客户端时间线身份: () => ({ chat: env.chatId }), 客户端时间线仍有效: identity => identity.chat === env.chatId,
    进房末楼: { value: 1 }, 本次入房由头已用: { value: false }, 已破门进入: { value: false }, 绝对时段: { value: 5 },
    查房间: id => ({ 名称: id, 类型: '公共' }), 清空当前成人CG: () => { clears++; },
    当前家庭计划CG: { value: null }, 当前生产CG: { value: null }, 最近CG信号: null, 成人CG信号交接: {},
    清空安若妍不必停CG队列() {}, 清空借种CG序列() {}, 清空CG信号交接() {},
  };
  return { env, save: compile(node.getText(uiAst), '写场景', deps), get clears() { return clears; } };
}

function eventCallback(name, deps = {}) {
  const matches = [];
  const walk = node => {
    if (ts.isCallExpression(node) && node.expression.getText(indexAst) === 'eventOn' &&
        node.arguments[0]?.getText(indexAst) === `Mvu.events.${name}`) matches.push(node.arguments[1]);
    ts.forEachChild(node, walk);
  };
  walk(indexAst); assert.equal(matches.length, 1);
  const node = matches[0];
  return compile(`const handler = ${node.getText(indexAst)};`, 'handler', { ...io, ...gate, ...deps });
}

test('真实客户端场景写入在空闲时生效，在残留恢复记录下零写入且不清CG', async () => {
  const f = uiFixture();
  const before = clone(f.env.a.vars);
  f.env.a.vars._时间推进事务 = null;
  assert.equal(await f.save('天台'), false);
  assert.equal(f.env.counters.chat, 0); assert.equal(f.clears, 0);
  delete f.env.a.vars._时间推进事务;
  assert.deepEqual(f.env.a.vars, before);
  assert.equal(await f.save('天台'), true);
  assert.equal(f.env.a.vars._场景.房间id, '天台'); assert.equal(f.clears, 1);
});

test('客户端updater被延后时，即使时间事务已经结束也不能提交旧移动', async () => {
  const f = uiFixture();
  const before = clone(f.env.a.vars);
  f.env.setHook(async ({kind, number}) => {
    if (kind === 'chat:before' && number === 1) {
      const release = gate.取得时间事务写入租约('time-a', 'move-race'); release();
    }
  });
  assert.equal(await f.save('天台'), false);
  assert.deepEqual(f.env.a.vars, before); assert.equal(f.clears, 0);
});

test('变量更新结束回调在脚本忙态之前拒绝残留时间记录，不替换不明楼层候选', async () => {
  const env = createTimeEnvironment();
  env.a.vars._时间推进事务 = { 事务ID: 'pending' };
  const next = { stat_data: { 现金: 99999 } };
  const ended = eventCallback('VARIABLE_UPDATE_ENDED', { 脚本写入中: true });
  await assert.rejects(ended(next, { stat_data: { 现金: 1 } }), /时间操作尚未收口/);
  assert.deepEqual(next.stat_data, { 现金: 99999 });
});

test('解析开始到写楼检查点之间完成一次时间事务，公开事件拒绝旧候选', () => {
  const env = createTimeEnvironment();
  const start = eventCallback('VARIABLE_UPDATE_STARTED');
  const beforeWrite = eventCallback('BEFORE_MESSAGE_UPDATE');
  const candidate = { stat_data: { 现金: 111 } };
  start(candidate);
  const release = gate.取得时间事务写入租约('time-a', 'parse-race');
  env.a.data.系统._绝对时段 = 6;
  release();
  assert.throws(() => beforeWrite({ variables: candidate, message_content: '普通变量更新。' }), /解析期间时间已经变化/);
  assert.deepEqual(candidate.stat_data, { 现金: 111 });
});

test('开始时被拒的候选不会在恢复记录清掉后重新成为可提交请求', () => {
  const env = createTimeEnvironment();
  env.a.vars._时间推进事务 = null;
  const candidate = { stat_data: { 现金: 111 } };
  assert.throws(() => eventCallback('VARIABLE_UPDATE_STARTED')(candidate), /时间操作尚未收口/);
  delete env.a.vars._时间推进事务;
  assert.throws(() => eventCallback('BEFORE_MESSAGE_UPDATE')({ variables: candidate, message_content: '' }), /时间操作尚未收口/);
});

test('普通解析没有跨越时间事务时保持候选，切聊天的候选明确拒绝', () => {
  const env = createTimeEnvironment();
  const start = eventCallback('VARIABLE_UPDATE_STARTED');
  const beforeWrite = eventCallback('BEFORE_MESSAGE_UPDATE');
  const candidate = { stat_data: { 现金: 111 } };
  start(candidate); beforeWrite({ variables: candidate, message_content: '' });
  assert.equal(candidate.stat_data.现金, 111);
  env.switchChat('time-b');
  assert.throws(() => beforeWrite({ variables: candidate, message_content: '' }), /聊天已经切换/);
});
