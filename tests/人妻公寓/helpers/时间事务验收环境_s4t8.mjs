/* eslint-disable import-x/no-nodejs-modules, import-x/no-dynamic-require -- Node-only isolated production-module loader */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { after } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (request, parent, main) {
  if (String(request).endsWith('?raw')) {
    return fs.readFileSync(path.resolve(path.dirname(parent.filename), String(request).slice(0, -4)), 'utf8');
  }
  return originalLoad.call(this, request, parent, main);
};
after(() => {
  Module._load = originalLoad;
});
const _ = require('lodash');
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const base = path.join(root, 'src/人妻公寓/脚本/游戏逻辑');
globalThis._ = _;
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { localStorage: storage, sessionStorage: storage, addEventListener() {} };
window.parent = window;
globalThis.document = window.document = {
  querySelectorAll: () => [], querySelector: () => null, getElementById: () => null,
  addEventListener() {}, removeEventListener() {},
};
globalThis.eventOn = () => ({ stop() {} });
globalThis.eventEmit = () => {};
globalThis.tavern_events = {};
globalThis.getChatMessages = () => [];
globalThis.getUserName = () => '测试管理员';
globalThis.generate = globalThis.generateRaw = globalThis.fetch = async () => {
  throw new Error('This isolated test must never call a model or network');
};
const nativeInterval = globalThis.setInterval;
globalThis.setInterval = (...args) => { const timer = nativeInterval(...args); timer.unref(); return timer; };
export const { Schema } = require(path.join(root, 'src/人妻公寓/schema.ts'));
export const undoCore = require(path.join(base, '时间撤销系统.ts'));
const timeGate = require(path.join(base, '时间事务写入门.ts'));
const mvuIO = require(path.join(base, 'mvuIO.ts'));
const { 手机锚消息签名 } = require(path.join(base, '手机时间线租约.ts'));
const parsed = new Map();

/** Extract private entry points verbatim. Every imported business function remains real unless listed in adapters. */
export function actual(name, adapters, file = 'index.ts') {
  if (!parsed.has(file)) {
    parsed.set(file, ts.createSourceFile(file, fs.readFileSync(path.join(base, file), 'utf8'), ts.ScriptTarget.Latest, true));
  }
  const ast = parsed.get(file);
  let found;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      assert.equal(found, undefined, `Ambiguous private function: ${name}`);
      found = node;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(found, `Missing real function: ${name}`);
  const ids = new Set();
  function collect(node) { if (ts.isIdentifier(node)) ids.add(node.text); ts.forEachChild(node, collect); }
  collect(found);
  const dependencies = { ...adapters };
  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause || statement.importClause.isTypeOnly) continue;
    const bindings = statement.importClause.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const used = bindings.elements.filter(binding => !binding.isTypeOnly && ids.has(binding.name.text) && !Object.hasOwn(dependencies, binding.name.text));
    if (!used.length) continue;
    const specifier = statement.moduleSpecifier.text;
    const module = require(specifier.startsWith('.') ? path.resolve(path.dirname(path.join(base, file)), specifier) : specifier);
    for (const binding of used) dependencies[binding.name.text] = module[(binding.propertyName || binding.name).text];
  }
  const js = ts.transpileModule(found.getText(ast), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  return Function('deps', `let {${Object.keys(dependencies).join(',')}} = deps; const exports = {}; ${js}; return ${name};`)(dependencies);
}

export function createTimeEnvironment({ clock = 5, room = '管理员室', mode = '睡到次日早晨' } = {}) {
  const fresh = () => ({
    data: Schema.parse({ 现金: 1000, 户: {}, 系统: { _绝对时段: clock, _序章完成: true } }),
    vars: { _场景: { 房间id: room, 进房末楼: 1 }, _粘滞: { id: 'old-scene' }, _地图轨迹: ['old'], _隔离事件: { 日志: [] } },
    chat: [{ is_user: true, mes: '测试开局' }, { is_user: false, mes: '楼务检查已经结束。' }],
  });
  const stores = new Map([['time-a', fresh()], ['time-b', fresh()]]);
  let chatId = 'time-a';
  let generation = 0;
  let pending = Promise.resolve();
  let hook = async () => {};
  let counters = { core: 0, chat: 0, model: 0, mirror: 0, phoneSave: 0, phoneRefresh: 0 };
  const events = [];
  const eventStates = [];
  const errors = [];
  const original = _.cloneDeep(stores.get('time-a'));
  const current = () => stores.get(chatId);
  const hit = async (kind, number) => hook({ kind, number, chatId, state: current(), env });
  globalThis.SillyTavern = { name1: '测试管理员', getCurrentChatId: () => chatId, get chat() { return current().chat; } };
  window.SillyTavern = SillyTavern;
  globalThis.getLastMessageId = () => current().chat.length - 1;
  globalThis.getVariables = () => _.cloneDeep(current().vars);
  globalThis.Mvu = { getMvuData: () => ({ stat_data: _.cloneDeep(current().data) }) };
  globalThis.updateVariablesWith = async updater => {
    const number = ++counters.chat;
    await hit('chat:before', number);
    const destination = current();
    destination.vars = _.cloneDeep(await updater(_.cloneDeep(destination.vars)));
    await hit('chat:after', number);
    return _.cloneDeep(destination.vars);
  };
  const adapters = {
    _时间推进中: false, 脚本写入中: false,
    当前聊天ID: () => chatId, 当前楼层: () => current().chat.length - 1,
    当前时间线切换世代: () => generation, 时间线切换协调中: () => false,
    登记MVU提交校验: () => () => {},
    安全操作: run => {
      const startId = chatId, startGeneration = generation;
      pending = mvuIO.排队MVU操作(() =>
        run(
          { stat_data: _.cloneDeep(current().data) },
          _.cloneDeep(current().data),
          () => startId === chatId && startGeneration === generation,
        )
      ).catch(error => errors.push(error.message));
      return pending;
    },
    读取最近有效: () => ({ raw: { stat_data: _.cloneDeep(current().data) }, data: _.cloneDeep(current().data) }),
    脚本写入: async (_raw, data) => {
      const number = ++counters.core;
      await hit('core:before', number);
      current().data = _.cloneDeep(data);
      await hit('core:after', number);
    },
    读场景: () => current().vars._场景,
    正文租约生效中: () => false, 回合进行中: () => false, 隔离事件进行中: () => false,
    当前微信联系保护表: () => ({}), 冷落预警节拍: async () => {},
    捕获保护快照() {}, 清保护快照() {}, 播放许曼君分居CG() {}, 播放许曼君离婚CG() {},
    同步全部角色阶段世界书: async () => { await hit('worldbook', 1); }, 同步入住世界书条目: async () => {},
    作废当前手机时间线租约世代() {},
    作废晋阶镜像时间线: async () => { counters.mirror++; await hit('mirror:before', counters.mirror); await hit('mirror:after', counters.mirror); },
    确认当前微信为刷新真值: async () => { counters.phoneRefresh++; await hit('phone:refresh', counters.phoneRefresh); return true; },
    立即持久保存手机聊天变量: async () => { counters.phoneSave++; await hit('phone:save', counters.phoneSave); return true; },
    生成隔离事件草稿: async parameters => {
      counters.model++; await hit('model', counters.model);
      return { 参数: parameters, 正文: '关灯休息，次日早晨在原处醒来。', 提示词: 'isolated neutral provider' };
    },
    eventEmit: (...args) => {
      events.push(args);
      eventStates.push({
        event: args[0],
        mvuBusy: mvuIO.MVU操作进行中(),
        timeBlocked: timeGate.时间事务阻止普通写入(),
      });
    }, setTimeout: () => 0,
    console: { info() {}, warn() {}, error() {} },
  };
  adapters.写时间结束场景 = actual('写时间结束场景', adapters);
  adapters.时间动作需要独立演出 = actual('时间动作需要独立演出', adapters);
  adapters.读取睡前回想素材 = actual('读取睡前回想素材', adapters);
  adapters.构造睡眠独立演出 = actual('构造睡眠独立演出', adapters);
  adapters.当前时间撤销判定 = actual('当前时间撤销判定', adapters);
  adapters.恢复时间聊天备份 = actual('恢复时间聊天备份', adapters);
  adapters.裁手机时间线 = actual('裁手机时间线', adapters, '回合引擎.ts');
  adapters.时间推进写入聊天键 = undoCore.时间推进事务恢复聊天键;
  const advance = actual('处理时间推进', adapters);
  const reverse = actual('处理撤销时间推进', adapters);
  const env = {
    stores, original, errors, events, eventStates,
    get state() { return current(); }, get counters() { return counters; }, get chatId() { return chatId; },
    get a() { return stores.get('time-a'); },
    setHook(next) { hook = next; },
    switchChat(id) { generation++; chatId = id; },
    changeBranch() { generation++; current().chat[1].mes += '（新分支）'; },
    resetCounters() { counters = { core: 0, chat: 0, model: 0, mirror: 0, phoneSave: 0, phoneRefresh: 0 }; },
    async advance(double = false) { advance(mode, { 预期绝对时段: current().data.系统._绝对时段 }); if (double) advance(mode, { 预期绝对时段: current().data.系统._绝对时段 }); await pending; await Promise.resolve(); },
    async undo(double = false) { reverse(); if (double) reverse(); await pending; await Promise.resolve(); },
    async recover(overrides = {}) { return actual('恢复中断时间推进', { ...adapters, ...overrides })(); },
    async cleanPoint() { return actual('清理无效时间撤销点', adapters)(current().data); },
    judge() { return undoCore.判定时间撤销点(current().vars[undoCore.时间撤销点键], { 当前数据: current().data, 当前聊天变量: current().vars, 当前聊天ID: chatId, 当前楼: current().chat.length - 1, 当前锚消息签名: 手机锚消息签名(current().chat.at(-1)) }); },
    reload() { for (const [id, state] of stores) stores.set(id, JSON.parse(JSON.stringify(state))); generation++; },
  };
  return env;
}
