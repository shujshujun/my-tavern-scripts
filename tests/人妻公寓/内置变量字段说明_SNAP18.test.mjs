/* eslint-disable import-x/no-nodejs-modules -- Node-only isolated request/consumer regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { 装配真实时间事务门 } from './helpers/时间事务门装配.mjs';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
const _ = require('lodash');
globalThis._ = _;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
globalThis.SillyTavern = { chat: [] };
const ts = require('typescript');
const { Schema, 创建户节点, 验证可继续MVU存档结构 } = require('../../src/人妻公寓/schema.ts');
const { 构造AI可写变量范围, 构造AI可写变量视图 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const { 回滚保护字段 } = require('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts');
const { 选择变量解析通道, 规范OpenAI兼容API地址 } = require('../../src/人妻公寓/MVU解析模式.ts');
const { 规范变量协议候选, 构造标准变量块 } = require('../../src/人妻公寓/脚本/游戏逻辑/变量块协议.ts');
const { 提取末尾裸JSON补丁 } = require('../../src/人妻公寓/脚本/游戏逻辑/正文协议安全.ts');
const { 提取正文舞台文本 } = require('../../src/人妻公寓/脚本/游戏逻辑/正文输出边界.ts');
const { 手机锚消息签名 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts');
const { 临时楼标记键, 回合令牌键, 回合角色键 } = require('../../src/人妻公寓/脚本/游戏逻辑/临时回合楼.ts');
const core = require('../../src/人妻公寓/脚本/游戏逻辑/变量重新生成核心.ts');
const gates = require('../../src/人妻公寓/脚本/游戏逻辑/变量重生成事务门.ts');
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const factoryRules = readFileSync(new URL('../../src/人妻公寓/世界书/变量/变量更新规则.yaml', import.meta.url), 'utf8');
const ast = ts.createSourceFile('回合引擎.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function declaration(name) {
  const matches = ast.statements.filter(node =>
    (ts.isFunctionDeclaration(node) && node.name?.text === name) ||
    (ts.isVariableStatement(node) && node.declarationList.declarations.some(item => item.name.getText(ast) === name)),
  );
  assert.equal(matches.length, 1, `unique current declaration: ${name}`);
  return matches[0].getText(ast).replace(/^export\s+/, '');
}
function descendants(root, predicate) {
  const found = [];
  function visit(node) {
    if (predicate(node)) found.push(node);
    ts.forEachChild(node, visit);
  }
  visit(root);
  return found;
}
const turn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === '执行回合');
const builtInBranches = descendants(turn, node => ts.isIfStatement(node) &&
  node.expression.getText(ast) === "变量执行路径 === '游戏内置'");
assert.equal(builtInBranches.length, 1);
const fallback = descendants(turn, node => ts.isVariableStatement(node) &&
  node.declarationList.declarations.some(item => item.name.getText(ast) === '降级AI变量解析'));
assert.equal(fallback.length, 1);
// Exact current retry branch and fallback, not a reimplementation of their control flow.
// Its enclosing full-turn lifetime callback is a host adapter; regeneration below executes its real identity gates.
const mainSlice = `async function 主回合解析片段(参数) {
  const { 行动, 基础正文, 快照, 变量范围, 回合前末楼, 只读 = false } = 参数;
  let 解析基准 = _.cloneDeep(参数.raw);
  const 变量失败回退基准 = _.cloneDeep(解析基准);
  const 临时助手楼层 = 2;
  const 本轮静音会议 = 只读;
  const 使用MVU外置解析 = true;
  const MVU解析 = { 内置解析: true };
  const 本轮有可写演员 = 变量范围.妻.length > 0 || 变量范围.夫.length > 0;
  const 变量执行路径 = 本轮静音会议 || !本轮有可写演员 ? '跳过' : '游戏内置';
  let 变量解析已降级 = false, 变量解析降级阶段 = '', 变量块 = '', 可重处理楼层正文 = 基础正文;
  let 内置解析变量块已就绪 = false;
  ${fallback[0].getText(ast)}
  if (${builtInBranches[0].expression.getText(ast)}) ${builtInBranches[0].thenStatement.getText(ast)}
  return { 解析基准, 变量块, 可重处理楼层正文, 内置解析变量块已就绪, 变量解析已降级, 变量解析降级阶段 };
}`;
const declarations = [
  '本回合生成id', '变量结算基础令', '严格变量审计令', '变量结算格式收口令', '当前变量结算令',
  '清除变量禁区', '宽松提取完整变量块', '取变量块', '内置变量解析超时毫秒', '内置解析格式说明',
  '当前变量重生成解析通道', '内置外置变量解析',
  '变量重生成事务', '变量重生成不确定提交令牌', '变量重生成成功标记键', '读上次回合',
  '读取变量重生成上下文', '变量重生成身份有效', '读取变量重生成状态', '广播变量重生成状态',
  '取消变量重生成', '持久写入变量重生成消息', '重新生成最近回合变量',
  '提取变量重生成风闻快照', '应用变量重生成风闻快照', '成长对应攻略风闻',
].map(declaration).join('\n');
const executable = ts.transpileModule(declarations + '\n' + mainSlice, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const empty = 构造标准变量块([]);
const story = '她确认了明天的安排。他点头，双方把具体时间核对清楚。';
const patch = (path, value) => ({ op: 'replace', path, value });

function dataFixture() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 201: 创建户节点(0) } });
  for (const node of Object.values(data.户)) {
    Object.assign(node.妻, { 当前阶段: 3, 好感值: 60, 当前心理想法: '我先把安排确认清楚。', 当前情绪: '平静',
      外装: '灰色外套', 内衣: '纯棉内衣', 妆容: '淡妆' });
    Object.assign(node.夫, { 当前心理想法: '我需要确认时间。', 当前情绪: '平静' });
  }
  return data;
}
function scopeFixture(data, shape = 'couple') {
  const actors = {
    wife: [['201'], ['201'], []], husband: [['201'], [], ['201']], couple: [['201'], ['201'], ['201']],
    associated: [['201'], [], []], background: [['201'], ['101'], ['101']],
    'read-only': [['201'], ['201'], ['201']],
  }[shape];
  return 构造AI可写变量范围(data, ...actors, { 只读: shape === 'read-only', 亲密场景: false });
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
function environment({ route = '自定义', strict = false, shape = 'couple', responses = [empty], base = dataFixture() } = {}) {
  const scope = scopeFixture(base, shape);
  const raw = { stat_data: _.cloneDeep(base), display_data: {}, delta_data: {} };
  const host = { chat: [{ mes: '开场', is_user: false }, { mes: '确认安排', is_user: true },
    { mes: story, is_user: false, swipe_id: 0, extra: {
      [回合令牌键]: 'rqgy-turn-snap18', [回合角色键]: 'assistant', [临时楼标记键]: false,
    } }] };
  const e = { base, raw, scope, host, calls: [], writes: [], events: [], stops: [], timers: new Map(),
    route, strict, configured: true, chatId: 'snap18-chat', epoch: 1, valid: true, released: 0,
    parseCalls: [], queueHook: null, parseHook: null, saveError: null, failWrite: false };
  let timerSeq = 0;
  const config = () => e.configured ? { 模型来源: '自定义', api地址: 'https://invalid.test/v1', 模型名称: 'fixture', 密钥: 'not-a-secret' } : null;
  function provider(messages, metadata) {
    const i = e.calls.length;
    e.calls.push({ messages: _.cloneDeep(messages), metadata });
    const response = responses[Math.min(i, responses.length - 1)];
    if (response instanceof Error) return Promise.reject(response);
    return Promise.resolve(typeof response === 'function' ? response(e) : response);
  }
  const deps = {
    _, Schema, 验证可继续MVU存档结构, 构造AI可写变量视图, 回滚保护字段,
    选择变量解析通道, 规范OpenAI兼容API地址,
    解析游戏变量请求路由: () => {
      const 配置 = config();
      const 数据库可用 = e.route === '数据库' && e.configured;
      const 自定义可用 = e.route === '自定义' && Boolean(配置);
      return {
        selectedRoute: 数据库可用 ? '数据库' : 自定义可用 ? '自定义' : null,
        配置,
        配置来源: '游戏持久设置',
        通道: e.route === '数据库' ? '自动' : '自定义',
        自定义API可用: Boolean(配置),
      };
    },
    规范变量协议候选, 提取末尾裸JSON补丁, 提取正文舞台文本,
    手机锚消息签名, 临时楼标记键, 回合令牌键, 回合角色键, ...core, ...gates,
    console: { info() {}, warn() {}, error() {} },
    严格变量审计开启: () => e.strict,
    读取MVU外置模型配置: config,
    读取变量解析通道: () => e.route === '自定义' ? '自定义' : '自动',
    数据库状态: () => ({ 可调用AI: e.route === '数据库' && e.configured }),
    generateRaw: args => provider(args.ordered_prompts, { route: '自定义', args }),
    通过数据库生成: (messages, system, tokens) => provider(messages, { route: '数据库', system, tokens }),
    setTimeout: (callback, ms) => { const id = ++timerSeq; e.timers.set(id, { callback, ms }); return id; },
    clearTimeout: id => e.timers.delete(id),
    stopGenerationById: id => e.stops.push(id),
    SillyTavern: host,
    当前聊天ID: () => e.chatId,
    当前时间线切换世代: () => e.epoch,
    getLastMessageId: () => host.chat.length - 1,
    getVariables: () => ({ _上次回合: { 变量重生成: e.context } }),
    getChatMessages: floor => host.chat[floor] ? [{ message: host.chat[floor].mes, extra: _.cloneDeep(host.chat[floor].extra) }] : [],
    setChatMessages: async updates => {
      if (e.failWrite) throw new Error('fixture write failed before mutation');
      for (const item of updates) {
        e.writes.push(_.cloneDeep(item));
        const message = host.chat[item.message_id];
        if ('message' in item) message.mes = item.message;
        if ('extra' in item) message.extra = _.cloneDeep(item.extra);
        if ('data' in item) Object.assign(raw, _.cloneDeep(item.data));
      }
    },
    Mvu: {
      getMvuData: () => _.cloneDeep(raw),
      // External MVU host adapter applies standard replace operations only. Production extraction,
      // Schema, actor guard, regeneration merge and transaction gates are not replaced.
      parseMessage: async (text, input) => {
        e.parseCalls.push(_.cloneDeep(input));
        if (e.parseHook) await e.parseHook();
        const block = e.api.取变量块(text);
        assert.ok(block);
        const ops = JSON.parse(block.match(/<JSONPatch>\s*([\s\S]*?)\s*<\/JSONPatch>/)[1]);
        const result = _.cloneDeep(input);
        for (const op of ops) {
          const keys = op.path.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'));
          assert.equal(op.op, 'replace');
          assert.ok(_.has(result.stat_data, keys));
          _.set(result.stat_data, keys, op.value);
        }
        return result;
      },
    },
    读取立即持久保存宿主聊天: () => async () => { if (e.saveError) throw e.saveError; },
    MVU操作进行中: () => false,
    取得前台生成租约: () => ({ 释放: () => { e.released++; } }),
    排队MVU操作: async callback => { if (e.queueHook) await e.queueHook(); return callback(); },
    确认本轮事务有效: () => { if (!e.valid) throw new Error('__RQGY_TIMELINE_CHANGED__'); },
    eventEmit: (name, ...args) => e.events.push({ name, args }),
    // Post-commit mirrors are unrelated host I/O; unexpected gameplay side effects fail this neutral fixture.
    捕获保护快照: () => undefined,
    等待晋阶镜像写入: async () => undefined,
    同步整表视图: async (stat, _valid, range) => { e.syncedView = 构造AI可写变量视图(stat, range); return true; },
    登记攻略风闻: () => { throw new Error('unexpected gameplay side effect'); },
  };
  const runtimeDeps = 装配真实时间事务门(deps);
  e.api = new Function(...Object.keys(runtimeDeps), executable + `\nreturn { 内置外置变量解析, 取变量块, 主回合解析片段,
    读取变量重生成状态, 重新生成最近回合变量, 取消变量重生成, 变量重生成身份有效, 提取变量重生成风闻快照 };`)(...Object.values(runtimeDeps));
  const wind = e.api.提取变量重生成风闻快照(base);
  // 当前回合票使用v3；本组只改衣着与心理文本，没有数值派生，派生票据保持空集合。
  e.context = { 版本: 3, 聊天ID: e.chatId, 助手楼层: 2, 回合令牌: 'rqgy-turn-snap18', 行动: '确认安排',
    快照: '【焦点】201，人物在场以本轮精确视图为准。', 焦点: ['201'], 变量范围: _.cloneDeep(scope),
    解析基准: _.cloneDeep(base), 原AI结果: core.提取变量重生成AI结果(base, scope),
    派生票据: { 当前绝对时段: base.系统._绝对时段, 母亲入列: base.系统._母亲入列, 妻: {}, 疑心: {} },
    风闻票据: { 派生前: _.cloneDeep(wind), 派生后: _.cloneDeep(wind), 原回合最终: _.cloneDeep(wind), 跳过成长风闻: true, 后续调用: [] } };
  e.request = overrides => e.api.内置外置变量解析({ 行动: e.context.行动, 正文: story, 快照: e.context.快照,
    可写视图: 构造AI可写变量视图(base, scope), 回合前末楼: 0, ...overrides });
  e.main = overrides => e.api.主回合解析片段({ 行动: e.context.行动, 基础正文: story, 快照: e.context.快照,
    变量范围: scope, 回合前末楼: 0, raw: _.cloneDeep(raw), ...overrides });
  return e;
}
function outgoingView(call) { return JSON.parse(call.messages[1].content.split('\n').slice(1).join('\n')); }
function assertFieldContract(call, scope) {
  const rules = call.messages[2].content;
  if (scope.妻.length) {
    assert.match(rules, /外装[^\n]*内衣[^\n]*妆容[^\n]*本人在场[^\n]*确实[^\n]*(?:换装|补妆)/);
    assert.match(rules, /送[^\n]*衣[^\n]*系统[^\n]*(?:不动|不改|不得|不要)/);
  }
  if (scope.夫.length) {
    assert.match(rules, /夫[^\n]*当前心理想法[^\n]*丈夫本人在场[^\n]*第一人称/);
    assert.match(rules, /夫[^\n]*当前情绪[^\n]*丈夫本人在场/);
  }
  assert.match(rules, /(?:字段规则|字段说明)[^\n]*仅[^\n]*当前可写变量现值[^\n]*叶子/);
  assert.match(rules, /没有[^\n]*依据[^\n]*不变/);
  assert.match(rules, /户[^\n]*为空[^\n]*\[\]/);
  assert.doesNotMatch(rules, /其余字段（/);
}

for (const route of ['自定义', '数据库']) for (const strict of [false, true]) {
  for (const shape of ['wife', 'husband', 'couple', 'associated', 'background', 'read-only']) {
    test(`SNAP18 request ${route}/audit=${strict}/${shape}: real view and complete rules`, async () => {
      const e = environment({ route, strict, shape });
      const before = _.cloneDeep(e.raw);
      assert.deepEqual(await e.request(), { 结果: '成功', 变量块: empty });
      assert.equal(e.calls.length, 1);
      const call = e.calls[0];
      assert.equal(call.metadata.route, route);
      assert.deepEqual(call.messages.map(message => message.role), ['system', 'system', 'system', 'user', 'system']);
      assert.deepEqual(outgoingView(call), 构造AI可写变量视图(e.base, e.scope));
      assert.equal(call.messages[4].content.includes('【严格变量审计｜'), strict);
      assert.ok(call.messages[4].content.endsWith('</UpdateVariable>'));
      assertFieldContract(call, e.scope);
      assert.deepEqual(e.raw, before);
      assert.equal(e.writes.length, 0);
      assert.equal(e.timers.size, 0);
    });
  }
  test(`SNAP18 ${route}/audit=${strict}: actual retry reuses current-only view and corrected instructions`, async () => {
    const e = environment({ route, strict, responses: ['not a patch', empty] });
    const result = await e.main();
    assert.equal(result.内置解析变量块已就绪, true);
    assert.equal(e.calls.length, 2);
    assert.deepEqual(e.calls[0].messages, e.calls[1].messages);
    assertFieldContract(e.calls[1], e.scope);
    assert.equal(e.writes.length, 1);
    assert.equal(result.可重处理楼层正文, `${story}\n${empty}`);
  });
  test(`SNAP18 ${route}/audit=${strict}: full regeneration commits neutral legal fields, never later script values`, async () => {
    const changes = 构造标准变量块([patch('/户/201/妻/外装', '蓝色外套'), patch('/户/201/妻/妆容', '已补好的淡妆'),
      patch('/户/201/夫/当前心理想法', '我已经确认了时间。'), patch('/户/201/夫/当前情绪', '安心')]);
    const e = environment({ route, strict, responses: [changes] });
    e.raw.stat_data.现金 += 7;
    e.raw.stat_data.户['201'].妻.外装 = '回合后脚本赠衣';
    const before = _.cloneDeep(e.raw);
    assert.equal(e.api.读取变量重生成状态().状态, '可用');
    assert.equal(await e.api.重新生成最近回合变量(), true);
    assertFieldContract(e.calls[0], e.scope);
    assert.equal(outgoingView(e.calls[0]).户['201'].妻.外装, '灰色外套', 'request uses original turn baseline');
    assert.equal(e.parseCalls[0].stat_data.户['201'].妻.外装, '灰色外套', 'MVU parsing also uses original baseline');
    assert.equal(e.raw.stat_data.现金, before.stat_data.现金);
    assert.equal(e.raw.stat_data.户['201'].妻.外装, '回合后脚本赠衣');
    assert.equal(e.raw.stat_data.户['201'].妻.妆容, '已补好的淡妆');
    assert.equal(e.raw.stat_data.户['201'].夫.当前情绪, '安心');
    assert.deepEqual(e.raw.stat_data.户['101'], before.stat_data.户['101']);
    assert.equal(e.writes.length, 1);
    assert.equal(提取正文舞台文本(e.host.chat[2].mes), story);
    assert.equal(e.api.读取变量重生成状态().状态, '已完成');
    assert.equal(await e.api.重新生成最近回合变量(), false);
    assert.equal(e.calls.length, 1);
    assert.equal(e.released, 1);
  });
}

test('factory already defines outfit/self-change versus gifted attire and husband-only presence; no factory patch needed', () => {
  assert.match(factoryRules, /仅妻本人在场且她确实自行换装\/补妆时更新/);
  assert.match(factoryRules, /送的衣物穿戴由系统写入,你不动/);
  assert.match(factoryRules, /户\.<门牌>\.夫\.当前心理想法/);
  assert.match(factoryRules, /户\.<门牌>\.夫\.当前情绪/);
});
for (const field of ['外装', '内衣', '妆容']) for (const locked of [false, true]) {
  test(`real guard ${field}/gift-lock=${locked}: self-change admitted, script gift protected`, () => {
    const base = dataFixture();
    if (locked) base.户['201'].妻._穿戴锁 = [field];
    const range = scopeFixture(base, 'wife');
    const candidate = _.cloneDeep(base);
    candidate.户['201'].妻[field] = `新的${field}说明`;
    const raw = _.cloneDeep(candidate);
    回滚保护字段(candidate, ['201'], range, 2, raw, base);
    assert.equal(candidate.户['201'].妻[field], locked ? base.户['201'].妻[field] : raw.户['201'].妻[field]);
    assert.deepEqual(candidate.户['201'].妻._穿戴锁, base.户['201'].妻._穿戴锁);
  });
}
for (const shape of ['wife', 'husband', 'couple', 'associated', 'background', 'read-only']) {
  test(`real guard ${shape}: no new actor, mechanical, economic or backstage authority`, () => {
    const base = dataFixture(), range = scopeFixture(base, shape), candidate = _.cloneDeep(base);
    for (const id of ['101', '201']) {
      candidate.户[id].妻.当前情绪 = '安心';
      candidate.户[id].夫.当前情绪 = '欣慰';
      candidate.户[id].妻.外装 = '蓝色外套';
      candidate.户[id].夫.疑心值 += 5;
    }
    candidate.现金 += 20;
    candidate.系统._绝对时段 += 3;
    回滚保护字段(candidate, ['201'], range, 2, _.cloneDeep(candidate), base);
    assert.deepEqual(candidate.户['101'], base.户['101']);
    assert.equal(candidate.户['201'].妻.当前情绪, range.妻.length ? '安心' : base.户['201'].妻.当前情绪);
    assert.equal(candidate.户['201'].夫.当前情绪, range.夫.length ? '欣慰' : base.户['201'].夫.当前情绪);
    assert.equal(candidate.户['201'].夫.疑心值, base.户['201'].夫.疑心值);
    assert.equal(candidate.现金, base.现金);
    assert.deepEqual(candidate.系统, base.系统);
  });
}
for (const route of ['自定义', '数据库']) {
  test(`${route}: main double failure and absent configuration preserve original story/data`, async () => {
    for (const configured of [true, false]) {
      const e = environment({ route, responses: [new Error('provider failed')] });
      e.configured = configured;
      const before = _.cloneDeep(e.raw);
      const result = await e.main();
      assert.equal(e.calls.length, configured ? 2 : 0);
      assert.equal(result.变量块, '');
      assert.equal(result.可重处理楼层正文, story);
      assert.equal(e.writes.length, 0);
      assert.deepEqual(e.raw, before);
    }
  });
  test(`${route}: readonly main branch never invokes parser/provider`, async () => {
    const e = environment({ route, shape: 'read-only' });
    assert.equal((await e.main({ 只读: true })).变量块, '');
    assert.equal(e.calls.length, 0);
  });
  test(`${route}: parser cancellation and timeout discard late values without writes`, async () => {
    for (const reason of ['cancel', 'timeout']) {
      const response = deferred(), abort = deferred();
      const e = environment({ route, responses: [response.promise] });
      const result = e.request({ 中止门: abort.promise });
      assert.equal(e.calls.length, 1);
      if (reason === 'cancel') abort.reject(new Error('__RQGY_MVUVARS_CANCELLED__'));
      else {
        const timer = [...e.timers.values()][0];
        assert.equal(timer.ms, 180000);
        timer.callback();
      }
      assert.equal((await result).结果, reason === 'cancel' ? '已取消' : '失败');
      response.resolve(empty);
      await Promise.resolve();
      assert.equal(e.writes.length, 0);
      assert.equal(e.timers.size, 0);
    }
  });
  for (const transition of ['chat', 'rollback', 'swipe', 'token', 'cancel', 'queued-cancel']) {
    test(`${route}: real regeneration ${transition} rejects stale result before commit`, async () => {
      const response = deferred();
      const e = environment({ route, responses: [response.promise] });
      const before = _.cloneDeep(e.raw);
      if (transition === 'queued-cancel') e.queueHook = () => e.api.取消变量重生成();
      const result = e.api.重新生成最近回合变量();
      assert.equal(e.calls.length, 1);
      if (transition === 'chat') e.chatId = 'other-chat';
      if (transition === 'rollback') e.epoch++;
      if (transition === 'swipe') e.host.chat[2].swipe_id = 1;
      if (transition === 'token') e.host.chat[2].extra[回合令牌键] = 'rqgy-turn-other';
      if (transition === 'cancel') assert.equal(e.api.取消变量重生成(), true);
      response.resolve(empty);
      assert.equal(await result, false);
      assert.equal(e.writes.length, 0);
      assert.deepEqual(e.raw, before);
      assert.equal(e.released, 1);
      assert.equal(e.api.读取变量重生成状态().状态 === '进行中', false);
    });
  }
  test(`${route}: regenerated empty patch is valid, data unchanged, complete historical context can reload`, async () => {
    const e = environment({ route });
    e.context = JSON.parse(JSON.stringify(e.context));
    const before = _.cloneDeep(e.raw.stat_data);
    assert.equal(await e.api.重新生成最近回合变量(), true);
    assert.deepEqual(e.raw.stat_data, before);
    assert.equal(e.calls.length, 1);
  });
  test(`${route}: regeneration provider failure leaves retry available and original state untouched`, async () => {
    const e = environment({ route, responses: [new Error('failed'), empty] });
    const before = _.cloneDeep(e.raw);
    assert.equal(await e.api.重新生成最近回合变量(), false);
    assert.equal(e.api.读取变量重生成状态().状态, '可用');
    assert.equal(e.writes.length, 0);
    assert.deepEqual(e.raw, before);
    assert.equal(await e.api.重新生成最近回合变量(), true);
    assert.equal(e.calls.length, 2);
  });
}

test('real regeneration availability gates reject old version, changed actor context, new last floor and duplicate request', async () => {
  for (const mutate of [e => { e.context.版本 = 1; }, e => { e.context.版本 = 2; }, e => { e.context.变量范围 = { 妻: [], 夫: [], 亲密妻: [] }; },
    e => { e.host.chat.push({ mes: '新楼', is_user: true }); }]) {
    const e = environment();
    mutate(e);
    assert.equal(await e.api.重新生成最近回合变量(), false);
    assert.equal(e.calls.length, 0);
  }
  const response = deferred(), e = environment({ responses: [response.promise] });
  const first = e.api.重新生成最近回合变量();
  assert.equal(await e.api.重新生成最近回合变量(), false);
  response.resolve(empty);
  assert.equal(await first, true);
  assert.equal(e.calls.length, 1);
});

test('real persistence postconditions: after-write save error remains one success, before-write failure never consumes success', async () => {
  const saved = environment();
  saved.saveError = new Error('hard save threw after in-memory commit');
  assert.equal(await saved.api.重新生成最近回合变量(), true);
  assert.equal(saved.api.读取变量重生成状态().状态, '已完成');
  assert.equal(saved.writes.length, 1);
  const failed = environment();
  failed.failWrite = true;
  const before = _.cloneDeep(failed.raw);
  assert.equal(await failed.api.重新生成最近回合变量(), false);
  assert.deepEqual(failed.raw, before);
  assert.equal(failed.host.chat[2].extra._rqgy变量已重新生成, undefined);
});
