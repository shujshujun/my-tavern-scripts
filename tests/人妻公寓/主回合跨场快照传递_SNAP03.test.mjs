/* eslint-disable import-x/no-nodejs-modules -- isolated production-function regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const ts = require('typescript');
const root = '../../src/人妻公寓/脚本/游戏逻辑/';
let vars = {};
let io;
globalThis.getVariables = () => _.cloneDeep(vars);
globalThis.updateVariablesWith = async fn => {
  if (io.beforeChat) await io.beforeChat();
  if (io.chatError) throw new Error('test-chat-save-failed');
  const next = fn(_.cloneDeep(vars));
  vars = next;
  io.chatWrites += 1;
  if (io.afterChat) await io.afterChat();
};

// SNAP-03 does not exercise phone storage/length rules or database/model I/O.
// Their read-only memory ports are explicitly empty; blocked PLAY-033 is not covered by this test.
const phonePath = require.resolve(root + '手机/数据层.ts');
require.cache[phonePath] = { id: phonePath, filename: phonePath, loaded: true, exports: {
  读库: () => ({ 消息: [], 圈: [], 节拍: {} }),
  孕情姐妹群已触发: () => false,
} };
const dbPath = require.resolve(root + '数据库桥.ts');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
  同步社交轨迹: () => undefined,
} };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const snapshot = require(root + 'snapshotSystem.ts');
const permissions = require(root + 'mvuIO.ts');
const entry = require(root + '入住触发门.ts');
const actors = Object.assign({}, ...[
  '不再留门系统.ts', '安若妍不必停系统.ts', '安若妍换掉系统.ts',
  '许曼君分居系统.ts', '许曼君离婚系统.ts', '许曼君离婚后日常系统.ts',
].map(path => require(root + path)));

const engineSource = readFileSync(new URL(root + '回合引擎.ts', import.meta.url), 'utf8');
const engineAst = ts.createSourceFile('回合引擎.ts', engineSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const target = engineAst.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === '组快照注入');
assert.equal(target.length, 1);
const targetJs = ts.transpileModule(target[0].getText(engineAst), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Execute the complete current production function unchanged, including awaits, actor gates,
// chat writes, view checks and memory composition. Only host I/O and memory ports are adapted.
const bindings = {
  ...snapshot, ...actors,
  构造AI可写变量范围: permissions.构造AI可写变量范围,
  解析候选亲密妻: permissions.解析候选亲密妻,
  是入住登场事件: entry.是入住登场事件,
  户静态表,
  检测焦点: (...args) => {
    const result = snapshot.检测焦点(...args);
    io.detected = result;
    return result;
  },
  规划快照刷新: (...args) => {
    io.plannedPeople = args[2];
    return snapshot.规划快照刷新(...args);
  },
  组公寓快照: (...args) => {
    io.snapshotPeople = args[4];
    io.direct = snapshot.组公寓快照(...args);
    return io.direct;
  },
  同步整表视图: async (data, valid, scope, floor, candidates) => {
    io.viewCalls.push({ scope: _.cloneDeep(scope), floor, candidates: [...candidates] });
    if (io.onView) await io.onView();
    return io.viewResult;
  },
  当前微信摘要引用: (people, floor) => { io.memoryCalls.push(['references', [...people], floor]); return []; },
  读取近期微信胶囊: (people, floor, time, tasks, options) => {
    io.memoryCalls.push(['recent', [...people], floor, time, [...tasks], options]);
    return io.memory;
  },
  读取数据库记忆胶囊: (people, floor) => { io.memoryCalls.push(['database', [...people], floor]); return ''; },
  读取微信进展胶囊: () => '',
};
const exports = {};
new Function(...Object.keys(bindings), 'exports', targetJs)(...Object.values(bindings), exports);
const assemble = exports.组快照注入;

function setup(room = '201', mode = 'map') {
  const data = Schema.parse({ 户: Object.fromEntries(['101', '102', '201', '301'].map(id => [id, 创建户节点(4)])) });
  for (const household of Object.values(data.户)) household.妻.当前阶段 = 4;
  vars = mode === 'map' ? {
    _场景: { 房间id: room, 进房末楼: 8 },
    _粘滞: { 位置: room, 楼: 8, 们: [room], 夫们: [] },
    _independent: { keep: true },
  } : { _independent: { keep: true } };
  io = { chatWrites: 0, viewCalls: [], memoryCalls: [], memory: '', viewResult: true };
  return { data, chat: [{ role: 'user', content: `我向${户静态表[room].妻名}询问今天的安排。` }] };
}

function interruption(kind, id = '101') {
  const person = 户静态表[id];
  return `【事件在场妻:${id}】【事件关联夫:${id}】【${kind}】${person.妻名}的手机传来${person.夫名}的来电。`;
}

for (const mode of ['map', 'text']) {
  for (const room of ['102', '201', '301']) {
    for (const kind of ['手机亮了', '查岗电话', '被迫收场', '兄弟拜托']) {
      test(`SNAP03 ${mode}/${room}/${kind}：主组装保留完整跨场人物结果与原夫妻身份`, async () => {
        const { data, chat } = setup(room, mode);
        const event = interruption(kind);
        const before = _.cloneDeep(data);
        const location = _.cloneDeep(vars._场景);
        const result = await assemble(chat, data, 10, 8, event);
        assert.equal(io.detected.丈夫打断跨角色, true);
        assert.equal(io.plannedPeople, io.detected, '刷新规划不能使用删掉扩展字段的重建人物对象');
        assert.equal(io.snapshotPeople, io.detected, '快照必须收到同一完整人物对象');
        assert.match(result.快照, /【跨场承接】/);
        assert.match(result.快照, /身份不可替换/);
        assert.match(result.快照, /独立短镜头/);
        assert.equal(result.快照, io.direct);
        assert.equal(result.焦点[0], room);
        assert.ok(result.焦点.includes('101'));
        assert.ok(result.快照.includes(户静态表[room].妻名));
        assert.ok(result.快照.includes(户静态表['101'].夫名));
        assert.deepEqual(result.妻在场, io.detected.妻在场);
        assert.deepEqual(result.夫在场, io.detected.夫在场);
        assert.deepEqual(vars._场景, location, '字段补传不修改玩家地点');
        assert.deepEqual(vars._independent, { keep: true });
        assert.equal(Object.hasOwn(vars._在场, '丈夫打断跨角色'), false, '不新增持久状态字段');
        assert.deepEqual(data, before, '预览不能提交刷新计数或业务结果');
        assert.equal(io.viewCalls.length, 1);
        assert.deepEqual(io.viewCalls[0].scope, result.变量范围);
        assert.deepEqual(result.变量范围, permissions.构造AI可写变量范围(data,
          io.detected.焦点, io.detected.妻在场, io.detected.夫在场,
          { 只读: false, 亲密场景: result.尺度模式 === '详' }));
      });
    }
  }
}

for (const kind of ['手机亮了', '查岗电话', '被迫收场', '兄弟拜托']) {
  test(`同户${kind}不产生跨场指令`, async () => {
    const { data, chat } = setup('201');
    const result = await assemble(chat, data, 10, 8, interruption(kind, '201'));
    assert.equal(io.detected.丈夫打断跨角色, undefined);
    assert.doesNotMatch(result.快照, /【跨场承接】/);
    assert.equal(result.焦点[0], '201');
  });
}

for (const event of ['', '【事件在场妻:101】【事件关联夫:101】夏乔来询问维修进度。', '【查岗电话】没有绑定门牌的来电。']) {
  test(`非跨户绑定对照 ${event || '普通行动'}`, async () => {
    const { data, chat } = setup();
    const result = await assemble(chat, data, 10, 8, event);
    assert.equal(io.detected.丈夫打断跨角色, undefined);
    assert.doesNotMatch(result.快照, /【跨场承接】/);
    assert.deepEqual(result.焦点, io.detected.焦点);
  });
}

test('没有当前焦点时不能凭远端事件伪造跨场冲突', async () => {
  const { data, chat } = setup();
  vars._场景 = {};
  vars._粘滞 = null;
  const result = await assemble(chat, data, 10, 8, interruption('查岗电话'));
  assert.equal(io.detected.丈夫打断跨角色, undefined);
  assert.doesNotMatch(result.快照, /【跨场承接】/);
  assert.equal(result.焦点[0], '101');
});

test('构造最终注入数组的真实表达式保留跨场快照，不被行动锚覆盖', async () => {
  const { data, chat } = setup();
  const result = await assemble(chat, data, 10, 8, interruption('查岗电话'));
  const declarations = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(engineAst) === 'injects') declarations.push(node);
    ts.forEachChild(node, visit);
  }
  visit(engineAst);
  const declaration = declarations.find(node => node.initializer?.getText(engineAst).includes('快照 + 行动锚'));
  assert.ok(declaration);
  const expression = ts.transpileModule(`const result = ${declaration.initializer.getText(engineAst)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const injects = new Function('快照', '行动锚', expression + '\nreturn result;')(result.快照, '\n当前行动测试');
  assert.equal(injects[0].role, 'system');
  assert.match(injects[0].content, /【跨场承接】/);
  assert.ok(injects[0].content.endsWith('当前行动测试'));
});

for (const fail of ['before', 'updater', 'after-chat', 'view']) {
  test(`事务失效 ${fail}：仍拒绝返回可用快照，不消费刷新态`, async () => {
    const { data, chat } = setup();
    const before = _.cloneDeep(data);
    let valid = fail !== 'before';
    if (fail === 'updater') io.beforeChat = async () => { valid = false; };
    if (fail === 'after-chat') io.afterChat = async () => { valid = false; };
    if (fail === 'view') io.onView = async () => { valid = false; };
    await assert.rejects(assemble(chat, data, 10, 8, interruption('查岗电话'), () => valid), /__RQGY_TIMELINE_CHANGED__/);
    assert.deepEqual(data, before);
    assert.equal(io.chatWrites, ['before', 'updater'].includes(fail) ? 0 : 1);
    assert.equal(io.viewCalls.length, fail === 'view' ? 1 : 0);
  });
}

for (const fail of ['chat-error', 'view-false', 'view-error']) {
  test(`宿主适配失败 ${fail} 后重试仍传跨场标志`, async () => {
    const { data, chat } = setup();
    const before = _.cloneDeep(data);
    if (fail === 'chat-error') io.chatError = true;
    if (fail === 'view-false') io.viewResult = false;
    if (fail === 'view-error') io.onView = async () => { throw new Error('test-view-failed'); };
    await assert.rejects(assemble(chat, data, 10, 8, interruption('查岗电话')),
      /test-chat-save-failed|本轮变量状态快照同步失败|test-view-failed/);
    assert.deepEqual(data, before);
    const restored = setup();
    const result = await assemble(restored.chat, restored.data, 10, 8, interruption('查岗电话'));
    assert.match(result.快照, /【跨场承接】/);
  });
}

test('旧请求等候写口时失效，不能覆盖另一分支的新人物投影', async () => {
  const { data, chat } = setup();
  let resume;
  let valid = true;
  const gate = new Promise(resolve => { resume = resolve; });
  io.beforeChat = () => gate;
  const pending = assemble(chat, data, 10, 8, interruption('查岗电话'), () => valid);
  valid = false;
  vars = { _场景: { 房间id: '301' }, _在场: { 焦点: ['301'] }, newBranch: true };
  const newBranch = _.cloneDeep(vars);
  resume();
  await assert.rejects(pending, /__RQGY_TIMELINE_CHANGED__/);
  assert.deepEqual(vars, newBranch);
  assert.equal(io.viewCalls.length, 0);
});

test('重复预览及JSON往返旧数据不消费刷新票，事件移除后不残留跨场提示', async () => {
  const { data, chat } = setup();
  const oldData = JSON.parse(JSON.stringify(data));
  const refresh = _.cloneDeep(oldData.系统._提示刷新态);
  for (let i = 0; i < 2; i += 1) {
    const result = await assemble(chat, oldData, 10, 8, interruption('查岗电话'));
    assert.match(result.快照, /【跨场承接】/);
    assert.deepEqual(oldData.系统._提示刷新态, refresh);
  }
  const next = setup();
  const result = await assemble(next.chat, next.data, 10, 8, '');
  assert.doesNotMatch(result.快照, /【跨场承接】/);
});

test('坏结局只读门不因跨场标志开放变量范围', async () => {
  const { data, chat } = setup();
  data.系统._坏结局 = '测试终局';
  const result = await assemble(chat, data, 10, 8, interruption('查岗电话'));
  assert.match(result.快照, /【坏结局·已锁定】/);
  assert.doesNotMatch(result.快照, /【跨场承接】/);
  assert.deepEqual(result.变量范围, { 妻: [], 夫: [], 亲密妻: [] });
});

test('非空记忆追加后仍保留跨场纪律与当前场景裁决', async () => {
  const { data, chat } = setup();
  io.memory = '\n过去的维修记录。';
  const result = await assemble(chat, data, 10, 8, interruption('查岗电话'));
  assert.match(result.快照, /【跨场承接】/);
  assert.match(result.快照, /【当前场景硬裁决】/);
  assert.ok(result.快照.indexOf('过去的维修记录') > result.快照.indexOf('【跨场承接】'));
  assert.ok(io.memoryCalls.some(call => call[0] === 'references' && call[2] === 8));
});

test('正常连续回合的完整／最小刷新节拍保持，只有显式提交才推进', async () => {
  const { data, chat } = setup();
  const modes = [];
  for (let i = 0; i < 4; i += 1) {
    const result = await assemble(chat, data, 10, 8, '');
    modes.push(result.快照刷新票.模式);
    snapshot.提交快照刷新(data, result.快照刷新票);
  }
  assert.deepEqual(modes, ['完整', '最小', '最小', '完整']);
});

test('原生备用入口仍以完整检测结果组快照，不将主路径缺陷外推为两条路径均坏', () => {
  const source = readFileSync(new URL(root + 'index.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const calls = [];
  const declarations = [];
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === '组公寓快照') calls.push(node);
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === '本轮人物') declarations.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(calls.some(call => call.arguments[4]?.getText(ast) === '本轮人物'));
  assert.ok(declarations.some(node => ts.isCallExpression(node.initializer) && node.initializer.expression.getText(ast) === '检测焦点'));
});
