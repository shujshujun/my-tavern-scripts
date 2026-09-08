/* eslint-disable import-x/no-nodejs-modules -- Isolated host ports; loads complete current production modules. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import lodash from 'lodash';
import { witness, clone } from './离婚事实验收环境.mjs';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../../../', import.meta.url));
const game = 'src/人妻公寓/脚本/游戏逻辑/';
const compiled = new Map();
export { clone };
export const goodBody = choice => choice === '等赵国强离开再抱她'
  ? '许曼君拿着自己的离婚证出来。赵国强离开后，你抱住许曼君。'
  : '许曼君拿着自己的离婚证出来。你牵住她的手。';
export const badBody = '许曼君并没有拿着自己的离婚证出来。你没有牵住她的手。';
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
export async function ticks(count = 4) {
  for (let i = 0; i < count; i++) await new Promise(resolve => setTimeout(resolve, 0));
}
const transpile = code => ts.transpileModule(code, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;

/**
 * Based on the existing Codex complete-turn audit's VM/port approach, but reads ONLY this
 * candidate's current modules. No original audit is executed and no old evidence is overwritten.
 * Real: complete engine, snapshot, guards, scene transaction, business settlement, leases,
 * watchdog, rollback and formalization. Adapted: browser/host storage/event/model APIs.
 * Optional database is absent; phone generation is inactive; no network or player data.
 */
export function host(options = {}) {
  const choice = options.choice ?? '当着赵国强牵住她';
  const f = witness(choice, options.relation ?? '继续关系');
  const e = { options, choice, fixture: f, vars: { _场景: { 房间id: f.room } }, trace: [], warnings: [], requests: [],
    saves: [], modules: new Map(), id: 'play013-chat-A', listeners: new Map(), intervals: new Map(), now: 1000000,
    worldbooks: {}, hook: null, provider: null, commits: 0, validations: [], sources: new Set() };
  const st = { chat: [], chatMetadata: {}, name1: '玩家', name2: '候选测试', characterId: 1,
    getCurrentChatId: () => e.id, getContext() { return this; } };
  e.st = st;
  const storage = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) }; };
  const win = { SillyTavern: st, localStorage: storage(), sessionStorage: storage(), addEventListener() {}, removeEventListener() {} };
  win.parent = win;
  const noCall = name => () => { e.trace.push({ op: 'unsupported', name }); throw new Error(`UNEXECUTED_PORT:${name}`); };
  const norm = id => id === undefined || id === -1 ? st.chat.length - 1 : id < 0 ? st.chat.length + id : id;
  const notifyHook = async (name, payload) => { if (e.hook) await e.hook(name, payload); };
  const ctx = vm.createContext({ _: lodash, z: require('zod').z, structuredClone,
    window: win, parent: win, SillyTavern: st, localStorage: win.localStorage, sessionStorage: win.sessionStorage,
    document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, addEventListener() {}, removeEventListener() {} },
    console: { log() {}, info() {}, warn: (...args) => e.warnings.push(args.map(String).join(' ')), error: (...args) => e.warnings.push(args.map(String).join(' ')) },
    setTimeout, clearTimeout, setInterval: (fn, ms) => { const id = {}; e.intervals.set(id, { fn, ms }); return id; }, clearInterval: id => e.intervals.delete(id),
    URL, TextEncoder, AbortController, Date: class extends Date { static now() { return e.now; } }, Promise,
    getLastMessageId: () => st.chat.length - 1, getCurrentChatId: () => e.id, getScriptId: () => 'play013-entry-test',
    getVariables: opts => opts?.type === 'message' ? clone(st.chat[norm(opts.message_id)]?.variables?.[0] ?? {}) : clone(e.vars),
    updateVariablesWith: async (fn, opts) => {
      assert.ok(!opts || opts.type === 'chat', 'Only explicit chat port is adapted');
      await notifyHook('chat-before-callback');
      const next = await fn(clone(e.vars));
      e.trace.push({ op: 'chat-update', lastTurn: Boolean(next._上次回合) });
      if (options.coreChatFail && next._上次回合) throw new Error('INJECTED_CORE_CHAT_FAILURE');
      e.vars = clone(next); await notifyHook('chat-written'); return clone(next);
    },
    insertOrAssignVariables: value => { Object.assign(e.vars, clone(value)); return clone(e.vars); },
    getPreset: () => ({ prompts: [], prompt_order: [] }), getLoadedPresetName: () => 'isolated-empty-preset',
    getChatWorldbookName: () => 'isolated-book', getWorldbook: async name => clone(e.worldbooks[name] ?? []),
    updateWorldbookWith: async (name, fn) => { if (options.worldbookFail) throw new Error('INJECTED_SOFT_WORLDBOOK_FAILURE'); e.worldbooks[name] = await fn(clone(e.worldbooks[name] ?? [])); return clone(e.worldbooks[name]); },
    getWorldbookNames: () => [], getCharWorldbookNames: () => ({ primary: null, additional: [] }), getCharLorebook: () => null,
    eventOn: (name, fn) => { if (!e.listeners.has(name)) e.listeners.set(name, new Set()); e.listeners.get(name).add(fn); return { stop: () => e.listeners.get(name).delete(fn) }; },
    eventClearEvent: name => e.listeners.delete(name),
    eventEmit: async (name, ...args) => { e.trace.push({ op: 'event', name, args: clone(args) }); for (const fn of [...(e.listeners.get(name) ?? [])]) await fn(...args); },
    tavern_events: { MESSAGE_DELETED: 'message_deleted', GENERATION_STARTED: 'generation_started', GENERATION_ENDED: 'generation_ended' },
    iframe_events: { STREAM_TOKEN_RECEIVED_FULLY: 'stream-full' },
    fetch: noCall('network'), generateRaw: noCall('unconfigured-variable-model'),
    stopGenerationById: id => { e.trace.push({ op: 'provider-stop', id }); return true; }, stopAllGeneration: noCall('global-provider-stop'),
  });
  e.ctx = ctx;
  ctx.globalThis = ctx;
  ctx.eventMakeFirst = (name, fn) => { const old = e.listeners.get(name) ?? new Set(); e.listeners.set(name, new Set([fn, ...old])); return { stop: () => e.listeners.get(name).delete(fn) }; };
  ctx.getChatMessages = range => {
    let ids;
    if (typeof range === 'number') ids = [norm(range)];
    else if (/^\d+-\d+$/u.test(range)) { const [a, b] = range.split('-').map(Number); ids = lodash.range(a, b + 1); }
    else ids = lodash.range(st.chat.length);
    return ids.filter(i => st.chat[i]).map(i => ({ message_id: i, role: st.chat[i].is_user ? 'user' : 'assistant',
      message: st.chat[i].mes, data: clone(st.chat[i].variables?.[0] ?? {}), extra: clone(st.chat[i].extra ?? {}) }));
  };
  ctx.createChatMessages = async messages => {
    e.trace.push({ op: 'create', roles: messages.map(message => message.role) });
    for (const message of messages) st.chat.push({ is_user: message.role === 'user', mes: message.message,
      name: message.role === 'user' ? st.name1 : st.name2, extra: clone(message.extra ?? {}), variables: [clone(message.data ?? {})] });
    await notifyHook('created', messages);
  };
  ctx.setChatMessages = async messages => {
    e.trace.push({ op: 'set', floors: messages.map(message => message.message_id) });
    for (const message of messages) {
      const current = st.chat[norm(message.message_id)]; assert.ok(current, 'Updating an existing host row');
      if (message.message !== undefined) current.mes = message.message;
      if (message.extra !== undefined) current.extra = clone(message.extra);
      if (message.data !== undefined) current.variables = [clone(message.data)];
    }
    await notifyHook('messages-set', messages);
  };
  ctx.deleteChatMessages = async floors => {
    e.trace.push({ op: 'delete', floors: [...floors] });
    for (const floor of [...new Set(floors.map(norm))].sort((a, b) => b - a)) st.chat.splice(floor, 1);
    await notifyHook('deleted');
  };
  st.saveChat = async () => {
    e.trace.push({ op: 'hard-save', rows: st.chat.length });
    if (options.saveFail) throw new Error('INJECTED_HARD_SAVE_FAILURE');
    e.saves.push(clone({ chat: st.chat, vars: e.vars })); await notifyHook('hard-saved');
  };
  st.saveMetadata = st.saveChat;
  ctx.Mvu = { getMvuData: opts => clone(st.chat[norm(opts?.message_id)]?.variables?.[0] ?? {}),
    replaceMvuData: async (data, opts) => {
      e.trace.push({ op: 'MVU.replace', floor: norm(opts?.message_id) });
      await notifyHook('mvu-before-write', data);
      if (options.mvuFail) throw new Error('INJECTED_MVU_SAVE_FAILURE');
      st.chat[norm(opts?.message_id)].variables = [clone(data)]; await notifyHook('mvu-written');
    }, parseMessage: noCall('unselected-external-MVU-parser'), events: { VARIABLE_UPDATE_ENDED: 'variable-update' } };
  ctx.generate = async request => {
    e.requests.push(request); e.trace.push({ op: 'provider', id: request.generation_id });
    if (e.provider) return e.provider(request, e.requests.length);
    return options.body ?? goodBody(choice);
  };
  const absentDB = new Proxy({ 数据库状态: () => ({ 已装游戏模板: false }), 读取数据库记忆胶囊: () => '', 读取微信进展胶囊: () => '',
    等待数据库时间线就绪: async () => false, 标记数据库时间线将变更: () => e.trace.push({ op: 'absent-db-invalidation' }) },
  { get: (object, key) => key in object ? object[key] : noCall(`absent-db:${String(key)}`) });
  const inactivePhone = { 当前聊天ID: () => e.id, 手机AI生成中: () => false, 手机节拍进行中: () => false,
    当前微信摘要引用: () => [], 读取近期微信胶囊: () => '', 当前微信联系保护表: () => ({}), 等待微信摘要任务: async () => {}, 设置静音会议手机生成中: noCall('unselected-meeting') };
  function resolve(spec, parentFile) {
    if (spec.startsWith('.')) return path.posix.normalize(path.posix.join(path.posix.dirname(parentFile), spec));
    if (spec.startsWith('@/')) return `src/${spec.slice(2)}`;
    return null;
  }
  function load(relative) {
    relative = relative.replaceAll('\\', '/');
    if (!path.posix.extname(relative)) relative += '.ts';
    if (relative === `${game}数据库桥.ts`) return absentDB;
    if (relative === `${game}手机系统.ts`) return inactivePhone;
    if (e.modules.has(relative)) return e.modules.get(relative).exports;
    const file = path.join(root, relative);
    const code = fs.readFileSync(file, 'utf8'); e.sources.add(relative);
    if (relative.endsWith('.json')) return JSON.parse(code);
    let js = compiled.get(code); if (!js) { js = transpile(code); compiled.set(code, js); }
    const module = { exports: {} }; e.modules.set(relative, module);
    const localRequire = spec => {
      if (spec.endsWith('?raw')) return fs.readFileSync(path.join(root, resolve(spec.slice(0, -4), relative)), 'utf8');
      const target = resolve(spec, relative); if (target) return load(target);
      if (spec.startsWith('http')) throw new Error('UNEXECUTED_REMOTE_MODULE');
      return require(spec);
    };
    vm.runInContext(`(function(module,exports,require){${js}\n})`, ctx, { timeout: 5000, filename: relative })(module, module.exports, localRequire);
    return module.exports;
  }
  e.load = load;
  const schema = load('src/人妻公寓/schema.ts');
  f.data.系统._数据版本 = schema.当前MVU数据版本;
  f.data.系统._序章完成 = true;
  const scene = load(`${game}场景剧情事务.ts`);
  const activated = scene.激活新增场景剧情(f.data, { 内容: f.event, 目标场景: f.room, 行动: choice, 触发楼层: 32 });
  assert.equal(activated.成功, true, activated.提示);
  st.chat = Array.from({ length: 33 }, (_, floor) => ({ is_user: floor % 2 === 1, mes: `已有记录${floor}`, extra: {}, variables: [{}] }));
  st.chat[32].variables = [{ stat_data: clone(f.data) }];
  e.initial = clone({ data: f.data, vars: e.vars, chat: st.chat });
  e.main = load(`${game}回合引擎.ts`);
  e.timeline = load(`${game}时间线切换协调.ts`);
  e.locks = load(`${game}生成通道互斥.ts`);
  e.scene = scene;
  e.read = () => clone(st.chat.at(-1)?.variables?.[0]?.stat_data);
  // Instrumentation delegates to the original functions; it never overrides their decisions.
  const route = load(`${game}许曼君离婚系统.ts`);
  const originalValidate = route.许曼君离婚正文越拍原因;
  route.许曼君离婚正文越拍原因 = (...args) => { const error = originalValidate(...args); e.validations.push({ event: args[0], text: args[1], error }); return error; };
  const originalCommit = route.提交许曼君离婚剧情事件;
  route.提交许曼君离婚剧情事件 = (...args) => { e.commits++; e.trace.push({ op: 'business-commit' }); return originalCommit(...args); };
  e.run = extra => {
    const txn = e.read().系统._场景剧情事务;
    return e.main.执行回合(choice, { 场景剧情事务ID: txn.id, 场景剧情请求世代: txn.请求世代, ...extra });
  };
  e.retry = async extra => {
    const data = e.read();
    assert.equal(scene.标记场景剧情待重试(data, data.系统._场景剧情事务.id, data.系统._场景剧情事务.请求世代), true);
    const retry = scene.准备重试场景剧情(data, f.room); assert.equal(retry.成功, true, retry.提示);
    st.chat.at(-1).variables = [{ stat_data: clone(data) }];
    return e.run(extra);
  };
  return e;
}
export function assertReleased(e) {
  assert.equal(e.main.回合进行中(), false);
  assert.equal(e.locks.前台生成租约持有中(), false);
  assert.equal(e.intervals.size, 0);
  assert.equal(e.trace.some(item => item.op === 'unsupported'), false, JSON.stringify(e.trace.filter(item => item.op === 'unsupported')));
}
export async function waitRequests(e, count = 1) {
  for (let i = 0; i < 120 && e.requests.length < count; i++) await ticks(1);
  assert.equal(e.requests.length, count, e.warnings.join('\n'));
}
