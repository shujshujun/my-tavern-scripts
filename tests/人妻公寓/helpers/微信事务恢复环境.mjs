/* eslint-disable import-x/no-nodejs-modules -- 隔离宿主适配器，不访问玩家数据、网络或真实模型。 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lodash = require('lodash');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const product = path.join(root, 'src/人妻公寓');
const base = path.join(product, '脚本/游戏逻辑');
const compiled = new Map();
export const clone = value => lodash.cloneDeep(value);

export class MemoryStorage {
  values = new Map();
  fail = false;
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) {
    if (this.fail) throw new Error('controlled storage failure');
    this.values.set(key, String(value));
  }
  removeItem(key) { this.values.delete(key); }
}

/** 被测数据层、镜像、计划CAS和到场读口均执行生产代码；只替换宿主I/O与UI通知。 */
export function createHost(options = {}) {
  const e = {
    vars: {}, id: 'transaction-chat', warnings: [], timers: new Map(), modules: new Map(),
    local: options.local ?? new MemoryStorage(), session: options.session ?? new MemoryStorage(),
    server: options.server ?? { envelope: null }, saveMode: options.saveMode ?? 'success',
    updateCalls: 0, saves: [],
  };
  const st = {
    name1: '林舟', characterId: 1, chatMetadata: { integrity: 'transaction-integrity' }, chat: [],
    getCurrentChatId: () => e.id, getContext() { return this; },
  };
  const win = { localStorage: e.local, sessionStorage: e.session, SillyTavern: st };
  win.parent = win;
  e.st = st;
  e.window = win;
  const forbidden = () => { throw new Error('EXTERNAL_REQUEST_FORBIDDEN'); };
  const globals = {
    _: lodash, window: win, SillyTavern: st,
    console: { log() {}, info() {}, warn: (...x) => e.warnings.push(x), error: (...x) => e.warnings.push(x) },
    getVariables: () => clone(e.vars),
    updateVariablesWith: async fn => {
      const call = ++e.updateCalls;
      if (e.beforeUpdate) await e.beforeUpdate(call);
      const result = fn(clone(e.vars));
      assert.ok(!result?.then, '变量回调必须同步');
      if (e.rejectUpdate) throw new Error('controlled updater rejection before commit');
      e.vars = clone(result);
      if (e.afterUpdate) await e.afterUpdate(call);
      return clone(e.vars);
    },
    getLastMessageId: () => st.chat.length - 1,
    getChatMessages: () => clone(st.chat),
    eventOn: () => ({ stop() {} }), eventEmit() {}, tavern_events: {},
    fetch: forbidden, generate: forbidden, generateRaw: forbidden,
    setTimeout: (cb, ms) => { const key = { unref() {} }; e.timers.set(key, { cb, ms }); return key; },
    clearTimeout: key => e.timers.delete(key),
    setInterval: () => ({ unref() {} }), clearInterval() {},
    Mvu: { getMvuData: () => ({ stat_data: clone(st.chat.at(-1)?.stat_data) }) },
  };
  globals.globalThis = { ...globals };
  e.globals = globals;
  function resolveFile(request, parent) {
    let candidate = request.startsWith('.') ? path.resolve(path.dirname(parent), request) : request;
    if (request.startsWith('@/')) candidate = path.join(root, request.slice(2));
    if (!path.isAbsolute(candidate)) return null;
    return [candidate + '.ts', candidate, candidate + '.json', path.join(candidate, 'index.ts')]
      .find(f => existsSync(f) && statSync(f).isFile()) ?? assert.fail(`Cannot resolve ${request}`);
  }
  function loadFile(file) {
    if (e.modules.has(file)) return e.modules.get(file).exports;
    if (file === path.join(base, 'mvuIO.ts')) return { 读最近有效stat: () => clone(st.chat.at(-1)?.stat_data) };
    if (file === path.join(base, '手机/UI刷新.ts')) return { 请求刷新手机红点() {}, 请求手机重绘() {} };
    if (e.adapters?.has(file)) return e.adapters.get(file);
    if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
    let js = compiled.get(file);
    if (!js) {
      js = ts.transpileModule(readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      compiled.set(file, js);
    }
    const module = { exports: {} };
    e.modules.set(file, module);
    const localRequire = request => {
      if (request.endsWith('?raw')) return readFileSync(path.resolve(path.dirname(file), request.slice(0, -4)), 'utf8');
      const f = resolveFile(request, file);
      // eslint-disable-next-line import-x/no-dynamic-require -- 生产模块加载器只解析其原始依赖名。
      return f ? loadFile(f) : require(request);
    };
    Function('module', 'exports', 'require', ...Object.keys(globals), js)(
      module, module.exports, localRequire, ...Object.values(globals),
    );
    return module.exports;
  }
  e.load = relative => loadFile(path.join(base, relative));
  e.adapt = (relative, value) => {
    e.adapters ??= new Map();
    e.adapters.set(path.join(base, relative), value);
  };
  const schema = loadFile(path.join(product, 'schema.ts'));
  const data = schema.Schema.parse({
    户: Object.fromEntries(['101', '102'].map(m => [m, schema.创建户节点(0)])),
    系统: { _绝对时段: 20, _数据版本: schema.当前MVU数据版本, _序章完成: true },
  });
  st.chat = Array.from({ length: 5 }, (_, i) => ({
    is_user: i % 2 === 1, swipe_id: 0, mes: '中性测试楼层',
    extra: { _rqgy回合令牌: `transaction-${i}` }, stat_data: clone(data),
  }));
  e.capture = () => ({ vars: clone(e.vars), chat: clone(st.chat), metadata: clone(st.chatMetadata), id: e.id });
  e.applyEnvelope = envelope => {
    e.vars = clone(envelope.vars); st.chat = clone(envelope.chat);
    st.chatMetadata = clone(envelope.metadata); e.id = envelope.id;
  };
  e.setMode = mode => {
    e.saveMode = mode;
    if (mode === 'absent') { delete st.saveMetadata; return; }
    st.saveMetadata = async () => {
      e.saves.push(mode);
      if (mode === 'throw') throw new Error('controlled whole-chat save failure');
      if (mode === 'swallow') return;
      e.server.envelope = e.capture();
    };
  };
  e.setMode(e.saveMode);
  if (options.envelope) e.applyEnvelope(options.envelope);
  e.api = e.load('手机/数据层.ts');
  e.mirror = e.load('手机/刷新恢复镜像.ts');
  e.plan = e.load('手机/邀约计划.ts');
  e.clock = () => st.chat.at(-1).stat_data.系统._绝对时段;
  e.flushTimers = async () => {
    const timers = [...e.timers.values()]; e.timers.clear();
    for (const timer of timers) timer.cb();
    for (let i = 0; i < 30; i++) await Promise.resolve();
  };
  e.reopen = (restart = true) => createHost({
    local: e.local, session: restart ? new MemoryStorage() : e.session,
    server: e.server, envelope: e.server.envelope, saveMode: 'absent',
  });
  e.arrivals = (room = '天台', clock = 22, floor = 4) => productionFunction(
    'snapshotSystem.ts', '读赴约们', { ...globals, ...e.plan },
  )(floor, room, clock).map(x => x.m);
  e.server.envelope ??= e.capture();
  return e;
}

/** AST提取完整函数/常量声明，不改逻辑；仅用于避开无关组合根的宿主初始化。 */
export function productionFunction(relative, name, deps) {
  const file = path.join(base, relative);
  const source = readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n =>
    (ts.isFunctionDeclaration(n) && n.name?.text === name) ||
    (ts.isVariableStatement(n) && n.declarationList.declarations.some(d => d.name.getText(ast) === name)));

  assert.ok(node, `缺少生产函数 ${name}`);
  const js = ts.transpileModule(node.getText(ast), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return Function('deps', `const {${Object.keys(deps).join(',')}}=deps;const exports={};${js};return ${name};`)(deps);
}

export const makePlan = (m = '101') => ({ m, 创建楼: 4, 创建绝对时段: 20, 目标绝对时段: 22, 地点: '天台' });
export const message = (key, member = '101') => ({ 楼: 4, 时: 20, 会话: member, 发: '对方', 文: '按约定时间到天台。', 键: key });
export const delta = (messages = [], more = {}) => ({ 新圈: [], 新消息: messages, 节拍改: {}, ...more });
export async function accept(e, member = '101') {
  return e.api.写库增量(delta([message(`accept:${member}`, member)], { 邀约计划提交: makePlan(member) }));
}
