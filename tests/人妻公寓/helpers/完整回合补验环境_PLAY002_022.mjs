/* eslint-disable import-x/no-nodejs-modules -- Reuses complete engine host, never extracts a target consumer. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as ts from 'typescript';
import lodash from 'lodash';
import { host, clone } from './离婚主入口环境.mjs';

const game = 'src/人妻公寓/脚本/游戏逻辑/';
const routeSetup = fs.readFileSync(new URL('../安若妍不必停.test.mjs', import.meta.url), 'utf8');
const tree = ts.createSourceFile('setup.mjs', routeSetup, ts.ScriptTarget.Latest, true);
// Only prerequisite fixture builders are reused. Target H8/D1 admission, validation, commit and save run through the whole engine.
const definitions = ['fresh', 'commit', 'settleIntimacy', 'startThroughH1'].map(name => {
  const node = tree.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(node, name); return node.getText(tree);
}).join('\n');

function baseHost(options = {}) {
  const e = host(options);
  e.schema = e.load('src/人妻公寓/schema.ts');
  e.scene = e.load(game + '场景剧情事务.ts');
  e.validations = []; e.commits = 0; e.trace = [];
  e.install = (data, room, action, event) => {
    data.系统._数据版本 = e.schema.当前MVU数据版本;
    data.系统._序章完成 = true;
    e.vars = { _场景: { 房间id: room } };
    const activation = e.scene.激活新增场景剧情(data, { 内容: event, 目标场景: room, 行动: action, 触发楼层: 32 });
    assert.equal(activation.成功, true, activation.提示);
    e.st.chat[32].variables = [{ stat_data: clone(data) }];
    e.event = activation.事务.内容; e.action = action; e.room = room;
    e.initial = clone({ data, vars: e.vars, chat: e.st.chat });
  };
  e.run = extra => {
    const txn = e.read().系统._场景剧情事务;
    return e.main.执行回合(e.action, { 场景剧情事务ID: txn.id, 场景剧情请求世代: txn.请求世代, ...extra });
  };
  e.retry = async extra => {
    const data = e.read();
    assert.equal(e.scene.标记场景剧情待重试(data, data.系统._场景剧情事务.id, data.系统._场景剧情事务.请求世代), true);
    const retry = e.scene.准备重试场景剧情(data, e.room);
    assert.equal(retry.成功, true, retry.提示);
    e.st.chat.at(-1).variables = [{ stat_data: clone(data) }];
    return e.run(extra);
  };
  e.instrument = (route, validator, commit) => {
    const validate = route[validator], apply = route[commit];
    route[validator] = (...args) => { const error = validate(...args); e.validations.push({ event: args[0], text: args[1], error }); return error; };
    route[commit] = (...args) => { e.commits++; e.trace.push({ op: 'business-commit' }); return apply(...args); };
  };
  e.physicalSave = directory => {
    fs.mkdirSync(directory, { recursive: true });
    e.saveFile = path.join(directory, 'chat.json');
    const save = e.st.saveChat;
    e.st.saveChat = e.st.saveMetadata = async () => {
      await save();
      fs.writeFileSync(e.saveFile, JSON.stringify({ chat: e.st.chat, vars: e.vars }));
      e.trace.push({ op: 'file-saved' });
    };
    e.reloadFile = () => {
      const saved = JSON.parse(fs.readFileSync(e.saveFile, 'utf8'));
      e.st.chat = saved.chat; e.vars = saved.vars;
      return e.schema.Schema.parse(e.read());
    };
  };
  return e;
}

export function dailyHost(options = {}) {
  const e = baseHost(options);
  const { Schema, 创建户节点 } = e.schema;
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: 3 } });
  const relation = options.relation ?? '继续关系';
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].夫._居住模式 = '正式退居';
  Object.assign(data.系统._许曼君分居, { 阶段: '已完成', 玩家最终关系选择: relation, 留宿201权限: relation !== '退出关系' });
  Object.assign(data.系统._许曼君离婚, { 阶段: '已完成', 法律离婚已成立: true, 赵国强正式退居: true, 换锁完成: true });
  data.系统._许曼君离婚后日常.累计次数 = options.theme ?? 0;
  e.route = e.load(game + '许曼君离婚后日常系统.ts');
  const action = relation === '退出关系' ? '只处理201房务' : '把决定留给她';
  const prepared = e.route.执行许曼君离婚后日常动作(data, action, '201', 32);
  assert.equal(prepared.成功, true, prepared.提示);
  e.install(data, '201', action, prepared.事件);
  e.instrument(e.route, '许曼君离婚后日常正文越界原因', '提交许曼君离婚后日常事件');
  e.prepareD2 = () => {
    const current = e.read(); current.系统._绝对时段++;
    const action = '把今天这件事做完';
    const prepared = e.route.执行许曼君离婚后日常动作(current, action, '201', e.st.chat.length - 1);
    assert.equal(prepared.成功, true, prepared.提示);
    const activation = e.scene.激活新增场景剧情(current, { 内容: prepared.事件, 目标场景: '201', 行动: action, 触发楼层: e.st.chat.length - 1 });
    assert.equal(activation.成功, true, activation.提示);
    e.st.chat.at(-1).variables = [{ stat_data: clone(current) }];
    e.action = action; e.event = activation.事务.内容;
  };
  return e;
}

export function nbsHost(beat = 'H8', options = {}) {
  const e = baseHost(options);
  e.route = e.load(game + '安若妍不必停系统.ts');
  const resource = e.load(game + '玩家资源系统.ts');
  const deps = { assert, lodash, ...e.schema, route: e.route, resource, risk: e.load(game + '丈夫线路风险策略.ts') };
  const setup = Function(...Object.keys(deps), definitions + '\nreturn { fresh, startThroughH1, settleIntimacy, commit };')(...Object.values(deps));
  const data = setup.startThroughH1(setup.fresh());
  for (let i = 0; i < 4; i++) setup.settleIntimacy(data, 24 + i);
  const event = e.scene.读取待发送事件队列(data.系统._待发送事件).find(event => e.route.解析安若妍不必停剧情事件(event)?.场景 === 'H6前门打开');
  assert.ok(event);
  const h6 = setup.commit(data, event, 28);
  setup.commit(data, h6.后续事件, 30);
  // The prerequisite builders settle route checkpoints directly; their consumed queue must not be replayed as a new target beat.
  data.系统._待发送事件 = '';
  const action = '继续刚才的动作';
  const h8 = e.route.执行安若妍不必停地点动作(data, action, '301', 32);
  assert.equal(h8.成功, true, h8.提示);
  if (beat === 'H8') e.install(data, '301', action, h8.事件);
  else {
    setup.commit(data, h8.事件, 30);
    // D1 starts from its persisted post-H13 checkpoint; no target D1 completion is manufactured.
    data.系统._性爱场景 = e.schema.Schema.parse({}).系统._性爱场景;
    Object.assign(data.系统._安若妍不必停, { 阶段: '待客厅', 普通收尾已完成: true, 当前场景: '', 当前拍: 0 });
    const first = e.route.执行安若妍不必停地点动作(data, '出去见江辰', '301', 32);
    assert.equal(first.成功, true, first.提示);
    e.install(data, '301', '出去见江辰', first.事件);
  }
  e.instrument(e.route, '安若妍不必停正文越拍原因', '提交安若妍不必停剧情事件');
  e.prepareNext = () => {
    const current = e.read();
    const activation = e.scene.激活队首场景剧情(current, e.room, '继续当前拍。', e.st.chat.length - 1);
    assert.equal(activation.成功, true, activation.提示);
    e.st.chat.at(-1).variables = [{ stat_data: clone(current) }];
    e.event = activation.事务.内容; e.action = activation.事务.行动;
  };
  return e;
}

export { clone };
export { assertReleased, deferred, ticks, waitRequests } from './离婚主入口环境.mjs';

/** Entire current index module, with startup DOM-ready held at the host boundary; call its actual listener installer. */
export function mountActualHostListeners(e) {
  const id = game + 'index.ts';
  const source = fs.readFileSync(new URL('../../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  e.ctx.$ = () => ({ on() {}, off() {} });
  e.ctx.tavern_events = new Proxy(e.ctx.tavern_events, { get: (o, key) => o[key] ?? String(key) });
  e.ctx.Mvu.events = new Proxy(e.ctx.Mvu.events, { get: (o, key) => o[key] ?? String(key) });
  const localRequire = spec => {
    if (spec.startsWith('https://')) return { registerMvuSchema() { throw new Error('Schema registration is outside the listener test'); } };
    if (spec === '@/util/script') return { reloadOnChatChange() { throw new Error('Host bootstrap is held'); } };
    if (spec.startsWith('.')) return e.load(path.posix.normalize(path.posix.join(path.posix.dirname(id), spec)));
    throw new Error('Unconfigured index import ' + spec);
  };
  vm.runInContext(`(function(module,exports,require){${js}\nexports.testMount = 挂载监听;})`, e.ctx, { timeout: 5000, filename: id })(module, module.exports, localRequire);
  module.exports.testMount();
  return module.exports;
}
