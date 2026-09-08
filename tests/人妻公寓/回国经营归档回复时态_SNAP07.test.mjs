/* eslint-disable import-x/no-nodejs-modules -- Node-only production-boundary regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import * as ts from 'typescript';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.window = globalThis;
globalThis.parent = globalThis;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
function adapter(file, exports) {
  const id = require.resolve(`../../src/人妻公寓/脚本/游戏逻辑/${file}`);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
adapter('数据库桥.ts', { 同步社交轨迹: () => undefined });
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 购买 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const home = require('../../src/人妻公寓/脚本/游戏逻辑/回国系统.ts');
const source = file => readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${file}`, import.meta.url), 'utf8');
const engineTree = ts.createSourceFile('回合引擎.ts', source('回合引擎.ts'), ts.ScriptTarget.Latest, true);
const nativeTree = ts.createSourceFile('index.ts', source('index.ts'), ts.ScriptTarget.Latest, true);
function select(tree, predicate, label) {
  const found = [];
  function visit(node) {
    if (predicate(node)) found.push(node);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.equal(found.length, 1, `Fixture must uniquely locate actual production block: ${label}`);
  return found[0].getText(tree);
}
const declaration = (tree, name) => select(tree, node => ts.isVariableStatement(node) &&
  node.declarationList.declarations.some(item => item.name.getText(tree) === name), name);
const firstAndRewrite = [
  declaration(engineTree, '专属节拍错误'), declaration(engineTree, '首稿重写原因'),
  select(engineTree, node => ts.isIfStatement(node) && node.expression.getText(engineTree).startsWith('首稿重写原因 &&'), 'first/rewrite'),
].join('\n');
const fixedCommit = select(engineTree, node => ts.isIfStatement(node) && node.expression.getText(engineTree) === '回国票' &&
  node.thenStatement.getText(engineTree).includes('提交回国剧情事件(newStat'), 'fixed commit');
const nativeCommit = select(nativeTree, node => ts.isIfStatement(node) &&
  node.expression.getText(nativeTree) === '!本轮静音会议 && 回国票', 'native validate-before-commit');
const phoneGuard = declaration(nativeTree, '回国手机提交可用');
const phoneConsumer = select(nativeTree, node => ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) &&
  node.expression.expression.getText(nativeTree) === 'eventOn' &&
  node.expression.arguments[0]?.getText(nativeTree) === "'人妻公寓:回国父亲微信已送达'", 'phone receipt consumer');
function evaluate(code, deps) {
  const js = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return Function(...Object.keys(deps), js)(...Object.values(deps));
}

const firstBody = '你把近几期账目和维修回执整理完整，归档册仍留在值班桌上。';
const normalBody = '归档摘要已经发出，你合上册子，接下来等父亲回复。';
const invalidBody = '父亲已经回复这份归档，确认了本次材料。';
function dataAt(clock = 0) {
  const data = Schema.parse({ 户: { 302: 创建户节点(0) }, 系统: { _绝对时段: clock, _母亲入列: true }, 现金: 5000, 胜任度: 90 });
  data.户['302'].妻.当前阶段 = 5;
  data.户['302'].妻.阶段性癖 = 户静态表['302'].招牌性癖;
  assert.equal(home.读取回国经营资格(data).通过, true, 'Real eligibility, not a substituted route');
  return data;
}
function tickets(clock = 0) {
  const data = dataAt(clock);
  assert.equal(购买(data, home.回国经营归档册ID).成功, true);
  const start = home.使用回国经营归档册(data, '管理员室');
  assert.equal(start.成功, true);
  assert.equal(home.回国正文越拍原因(start.事件, firstBody), '');
  const result = home.提交回国剧情事件(data, start.事件, '管理员室', 30);
  assert.equal(result?.成功, true);
  assert.ok(result.后续剧情?.事件);
  assert.equal(data.系统._回国.阶段, '待使用经营归档册');
  return { data, first: start.事件, second: result.后续剧情.事件 };
}

const groups = [
  ['期待与将来', false, [
    '等父亲回复。', '你正等着父亲回复。', '等父亲的回信后再处理。',
    '父亲稍后才会回复这份归档。', '父亲明天会回信。', '希望父亲回复这份归档。',
    '准备等待父亲回复。', '等到父亲回复以后，再去处理别的事。', '父亲准备买票、回国。',
  ]],
  ['条件与疑问', false, [
    '如果父亲回复，就再查看手机。', '倘若父亲已读，明天再问。', '父亲是否已经回复？',
    '父亲回复了吗？', '母亲问：“父亲回复了吗？”', '父亲已经买票了吗?',
  ]],
  ['否定与未完成', false, [
    '父亲尚未回复这份归档。', '还没有收到父亲的回信。', '尚未等到父亲回复。',
    '并不是父亲已经回复了。', '父亲并非已经回信。', '父亲还没有已读这份材料。',
    '父亲回信的打算还未确定。', '父亲回复这件事还没发生。',
  ]],
  ['历史设想与引述归属', false, [
    '昨天父亲已经回复上一份归档，这次仍在等待。', '父亲曾经回信确认旧材料。',
    '你想象父亲读完后会回信。', '“父亲已经回复了。”只是设想。',
    '「父亲已经回复。」这个说法不属实。', '玩家没有说过“父亲已经回复。”',
    '父亲现在回复的是上一份归档，本次材料仍然未读。',
  ]],
  ['人物与反馈对象', false, [
    '母亲回复了消息。', '玩家回复父亲的旧消息。', '维修人员给父亲回信。',
    '父亲等待维修人员回复。', '父亲说维修人员已经回信。', '父亲的助理已经回复本次归档。',
  ]],
  ['明确当前反馈', true, [
    '父亲已经回复这份归档。', '父亲回信确认这份材料。', '父亲已经买票。',
    '父亲已经回国。', '父亲已经到楼。', '收到了父亲的回复。', '父亲终于回了信。',
    '父亲发来消息：“归档已经看完了。”', '父亲说：“我已经买票。”',
  ]],
  ['已读与完成态等待', true, [
    '父亲已读了归档摘要。', '父亲已读但未回复。', '手机显示父亲已读。',
    '父亲会话的归档摘要变成了已读。', '终于等来了父亲的回信。',
    '已经等到了父亲的回复。', '等到了父亲回复这份归档。',
  ]],
  ['前后交错与多命中', true, [
    '你还在等父亲回复，父亲此刻已经回信确认。', '父亲已经回信，接下来等他确认机票。',
    '父亲还没有回复旧问题，但已经回信确认本次归档。',
    '父亲没有离开，已经回复这份归档。', '母亲仍在等你整理，父亲已经回复。',
    '等父亲回复后父亲已经回信。', '如果父亲回复就查看手机。父亲此刻已经回信。',
    '父亲回信说：“等我安排。”', '父亲已读了归档，却没有回复。',
  ]],
  ['历史转当前与隐含承接', true, [
    '昨天父亲回复过上一份归档；现在又回复了这次材料。',
    '父亲昨天回过信，今天已经回复了本次归档。',
    '正在等父亲回复。这时收到了他的回信。',
    '“父亲已经回复”只是设想；父亲现在确实回复了这份材料。',
  ]],
  ['双重否定的当前肯定', true, [
    '父亲并非没有回信。', '父亲不是没回复。', '并不是没有收到父亲的回复。',
  ]],
];
for (const [label, expected, texts] of groups) {
  test(`SNAP07 ${label}：真实第一、第二拍反馈边界`, () => {
    const pair = tickets();
    const mismatches = [];
    for (const text of texts) {
      for (const [beat, event] of [[1, pair.first], [2, pair.second]]) {
        const actual = Boolean(home.回国正文越拍原因(event, text));
        if (actual !== expected) mismatches.push({ beat, text, expected, actual });
      }
    }
    assert.deepEqual(mismatches, []);
  });
}

test('SNAP07 第一拍整理与第二拍发送的职责不同，原始完整正常正文可通过第二拍', () => {
  const pair = tickets();
  assert.notEqual(home.回国正文越拍原因(pair.first, '你已经发送了归档摘要。'), '');
  assert.equal(home.回国正文越拍原因(pair.second, '你已经发送了归档摘要。'), '');
  assert.equal(home.回国正文越拍原因(pair.second, normalBody), '');
});
test('SNAP07 兄弟分支仍拦截提前上锁、提前形成管理结论', () => {
  const data = dataAt(8);
  data.系统._回国.阶段 = '待收纳';
  data.背包.push(home.回国私人物件箱ID);
  const packing = home.执行回国地点动作(data, '收纳私人物件', '302');
  assert.equal(packing.成功, true);
  assert.notEqual(home.回国正文越拍原因(packing.事件, '箱子已经上锁，把钥匙交给玩家。'), '');
  data.系统._回国.阶段 = '待看记录';
  const records = home.执行回国地点动作(data, '查看管理记录', '管理员室');
  assert.equal(records.成功, true);
  assert.notEqual(home.回国正文越拍原因(records.事件, '母亲确认，没有需要补救的经营缺口。'), '');
});
test('SNAP07 重复及交错判定不泄漏期待或历史状态', () => {
  const { second } = tickets();
  for (let round = 0; round < 3; round++) {
    assert.equal(home.回国正文越拍原因(second, '等父亲回复。'), '');
    assert.notEqual(home.回国正文越拍原因(second, invalidBody), '');
    assert.equal(home.回国正文越拍原因(second, '父亲曾经回信确认旧材料。'), '');
    assert.notEqual(home.回国正文越拍原因(second, '父亲已经已读这份归档。'), '');
  }
});

// Actual fixed first/rewrite block and route commit block; only model/host and unrelated routes are adapters.
async function fixed(pair, first, second, options = {}) {
  const counters = { generations: 0, leaseChecks: 0 };
  const deps = {
    ...home, _: lodash, first, 本楼事件: pair.second, 当前拍正文: first,
    回国票: home.解析回国剧情事件(pair.second), 不再留门票: null, 第二机位票: null,
    安若妍不必停票: null, 许曼君分居票: null, 许曼君离婚票: null, 许曼君离婚后日常票: null,
    双重继承票: null, 焦点妻门牌: null, 快照: '', 行动锚: '', 选项: {}, 本轮数据库已安装: false,
    回合前末楼: 30, 行动: '提交整理好的经营归档。', 正文模型覆盖: {}, 焦点妻们: [], 阶段表: {}, 尺度模式: '', 正戏免检: false,
    console: { warn() {} }, eventEmit() {}, 应用酒馆最终显示正则: value => value, 提取可提交正文: value => value,
    输出稽查: () => ({ 状态: '通过' }),
    确认本轮事务有效: () => { counters.leaseChecks++; if (options.stale) throw new Error('TEST_STALE_LEASE'); },
    等待正文生成: async () => { counters.generations++; if (options.error) throw new Error(options.error); return second; },
    newStat: pair.data, 回合场景: options.place ?? '管理员室', 楼层: 31,
    排队提交后提示() {}, 提交后任务: [],
  };
  for (const name of ['不再留门正文越拍原因', '第二机位正文越拍原因', '安若妍不必停正文越拍原因',
    '许曼君分居正文越拍原因', '许曼君离婚正文越拍原因', '许曼君离婚后日常正文越界原因', '双重继承正文越拍原因']) {
    deps[name] = () => '';
  }
  const run = evaluate(`return (async () => {
    let 原文 = first, 最终显示原文 = first, 本回合生成id = '', 稽查 = { 状态: '通过' };
    ${firstAndRewrite}
    let 回国提交结果;
    ${fixedCommit}
    return { text: 原文, result: 回国提交结果 };
  })();`, deps);
  return { value: await run, counters };
}
function native(pair, body, place = '管理员室') {
  return evaluate(`let 原生回国提交; ${nativeCommit} return 原生回国提交;`, {
    ...home, 回国票: home.解析回国剧情事件(pair.second), 本轮静音会议: false,
    本楼事件: pair.second, 本轮有效正文: body, newData: pair.data, 读场景: () => ({ 房间id: place }), 楼层: 31,
  });
}

test('SNAP07 真实固定首稿门：完整正常正文不重写，只提交到待父亲回信', async () => {
  const pair = tickets();
  const result = await fixed(pair, normalBody, invalidBody);
  assert.equal(result.value.text, normalBody);
  assert.deepEqual(result.counters, { generations: 0, leaseChecks: 0 });
  assert.equal(pair.data.系统._回国.阶段, '待父亲回信');
  assert.equal(pair.data.背包.includes(home.回国经营归档册ID), false);
  const before = structuredClone(pair.data);
  assert.equal(home.提交回国剧情事件(pair.data, pair.second, '管理员室', 31)?.成功, false);
  assert.deepEqual(pair.data, before, 'Duplicate ticket cannot consume or settle twice');
});
test('SNAP07 真实固定二稿门：违规首稿可由合法等待二稿替换', async () => {
  const pair = tickets();
  const result = await fixed(pair, invalidBody, normalBody);
  assert.equal(result.value.text, normalBody);
  assert.deepEqual(result.counters, { generations: 1, leaseChecks: 1 });
  assert.equal(pair.data.系统._回国.阶段, '待父亲回信');
});
test('SNAP07 真实固定二稿门：两次违规不能提交或消耗道具', async () => {
  const pair = tickets();
  const before = structuredClone(pair.data);
  await assert.rejects(fixed(pair, invalidBody, invalidBody), /两次未能停在正确节点/u);
  assert.deepEqual(pair.data, before);
});
for (const error of ['TEST_TIMEOUT', 'TEST_CANCELLED', 'TEST_MISSING_MODEL']) {
  test(`SNAP07 真实重写链 ${error}：不提交`, async () => {
    const pair = tickets();
    const before = structuredClone(pair.data);
    await assert.rejects(fixed(pair, invalidBody, normalBody, { error }), new RegExp(error));
    assert.deepEqual(pair.data, before);
  });
}
test('SNAP07 真实重写链租约失效：迟到二稿不能提交', async () => {
  const pair = tickets();
  const before = structuredClone(pair.data);
  await assert.rejects(fixed(pair, invalidBody, normalBody, { stale: true }), /TEST_STALE_LEASE/u);
  assert.deepEqual(pair.data, before);
});
test('SNAP07 真实原生入口：先验收后提交，错误正文保留原状态', () => {
  const rejected = tickets();
  const before = structuredClone(rejected.data);
  assert.throws(() => native(rejected, invalidBody), /本拍未提交/u);
  assert.deepEqual(rejected.data, before);
  const accepted = tickets();
  assert.equal(native(accepted, normalBody)?.成功, true);
  assert.equal(accepted.data.系统._回国.阶段, '待父亲回信');
});
test('SNAP07 真实票据：旧后续恢复，未来票、错场和阶段变化仍拒绝', () => {
  const late = tickets(0);
  late.data.系统._绝对时段 = 1;
  assert.equal(native(late, '归档摘要发送完成。')?.成功, true);
  const future = tickets(8);
  future.data.系统._绝对时段 = 7;
  assert.throws(() => native(future, '归档摘要发送完成。'), /未来时间线/u);
  assert.equal(future.data.背包.includes(home.回国经营归档册ID), true);
  const wrongPlace = tickets();
  assert.throws(() => native(wrongPlace, '归档摘要发送完成。', '302'), /地点已经变化/u);
  const wrongStage = tickets();
  wrongStage.data.系统._回国.阶段 = '待读回国消息';
  assert.throws(() => native(wrongStage, '归档摘要发送完成。'), /阶段已经变化/u);
});

// Real delivery, lease, receipt validator and actual index consumer. Storage and host persistence are in-memory adapters.
let chat = 'SNAP07-A';
let clock = 0;
let messages = [];
let emitted = [];
let save = async () => undefined;
globalThis.SillyTavern = { chat: [{ mes: 'SNAP07-anchor', is_user: false }] };
globalThis.eventEmit = (...args) => emitted.push(args);
adapter('mvuIO.ts', {});
adapter('手机/运行时上下文.ts', { 当前手机绝对时段: () => clock, 当前聊天ID: () => chat, 末楼: () => 0 });
adapter('手机/UI刷新.ts', { 请求手机重绘() {}, 请求刷新手机红点() {} });
adapter('手机/数据层.ts', {
  读库: () => ({ 消息: messages }),
  写库增量: async (delta, valid) => {
    if (!valid()) return false;
    messages.push(...delta.新消息);
    return true;
  },
  立即持久保存手机聊天变量: () => save(),
});
// Shop may have loaded this module through its UI dependency graph. Reload the real module after installing host ports.
// The route validator, state transitions, notification implementation and receipt validator are never substituted.
delete require.cache[require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts')];
const { 同步回国父亲微信 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts');
const { 回国提交凭据有效 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/回国提交凭据.ts');
const { 读取当前手机时间线租约世代, 作废当前手机时间线租约世代 } =
  require('../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts');
function phoneReset() {
  chat = 'SNAP07-A'; clock = 0; messages = []; emitted = []; save = async () => undefined;
  SillyTavern.chat = [{ mes: 'SNAP07-anchor', is_user: false }];
}
function deliveryConsumer(data) {
  let handler;
  evaluate(`${phoneGuard}\n${phoneConsumer}`, {
    ...home, 回国提交凭据有效, 当前聊天ID: () => chat, 读取当前手机时间线租约世代,
    读微信库: () => ({ 消息: messages }), eventOn: (_name, callback) => { handler = callback; },
    安全操作: callback => callback({}, data), 脚本写入: async () => undefined, 捕获保护快照() {}, eventEmit() {},
  });
  assert.equal(typeof handler, 'function');
  return handler;
}
async function sentPair() {
  phoneReset();
  const pair = tickets();
  await fixed(pair, normalBody, invalidBody);
  return pair;
}
test('SNAP07 夹具独立冒烟：修前可通过的发送正文能走到真实通知及生产消费者', async () => {
  phoneReset();
  const pair = tickets();
  const result = await fixed(pair, '归档摘要发送完成。', invalidBody);
  assert.equal(result.counters.generations, 0);
  assert.equal(pair.data.系统._回国.阶段, '待父亲回信');
  clock = pair.data.系统._绝对时段 = 8;
  assert.equal(await 同步回国父亲微信(pair.data), true);
  assert.equal(messages.length, 1);
  await deliveryConsumer(pair.data)(emitted[0][1], emitted[0][2]);
  assert.equal(pair.data.系统._回国.阶段, '待读回国消息');
});
test('SNAP07 从真实购买及两拍到真实通知凭据：当日不回信，次日下午实存后才推进', async () => {
  const pair = await sentPair();
  assert.equal(pair.data.系统._回国.父亲最早回信日, 2);
  assert.equal(pair.data.系统._回国.父亲最早回信时段, 1);
  assert.equal(await 同步回国父亲微信(pair.data), false);
  assert.equal(emitted.length, 0);
  clock = pair.data.系统._绝对时段 = 7;
  assert.equal(await 同步回国父亲微信(pair.data), false);
  clock = pair.data.系统._绝对时段 = 8;
  assert.equal(await 同步回国父亲微信(pair.data), true);
  assert.equal(pair.data.系统._回国.阶段, '待父亲回信', 'Only receipt consumer advances the route');
  assert.equal(messages.length, 1);
  const delivery = emitted.find(item => item[0] === '人妻公寓:回国父亲微信已送达');
  assert.ok(delivery);
  await deliveryConsumer(pair.data)(delivery[1], delivery[2]);
  assert.equal(pair.data.系统._回国.阶段, '待读回国消息');
  assert.equal(await 同步回国父亲微信(pair.data), false);
  assert.equal(messages.length, 1);
});
test('SNAP07 晚时段提交也按次日窗口，不追加固定24小时门槛', () => {
  const pair = tickets(5);
  assert.equal(native(pair, '归档摘要发送完成。')?.成功, true);
  pair.data.系统._绝对时段 = 8;
  assert.equal(home.回国父亲通知可送达(pair.data), true);
});
test('SNAP07 宿主保存失败不广播或推进；重试和真实凭据可恢复', async () => {
  const pair = await sentPair();
  clock = pair.data.系统._绝对时段 = 8;
  save = async () => { throw new Error('TEST_SAVE_FAILED'); };
  await assert.rejects(同步回国父亲微信(pair.data), /TEST_SAVE_FAILED/u);
  assert.equal(emitted.length, 0);
  assert.equal(pair.data.系统._回国.阶段, '待父亲回信');
  save = async () => undefined;
  await 同步回国父亲微信(pair.data);
  assert.equal(messages.length, 1);
  await deliveryConsumer(pair.data)(emitted[0][1], emitted[0][2]);
  assert.equal(pair.data.系统._回国.阶段, '待读回国消息');
});
test('SNAP07 真实送达消费者拒绝缺凭据、改写消息、旧世代及切聊天凭据', async () => {
  const pair = await sentPair();
  clock = pair.data.系统._绝对时段 = 8;
  await 同步回国父亲微信(pair.data);
  const receipt = emitted[0][2];
  const consume = deliveryConsumer(pair.data);
  await consume('通知', undefined);
  assert.equal(pair.data.系统._回国.阶段, '待父亲回信');
  const original = messages[0].文;
  messages[0].文 = 'changed';
  await consume('通知', receipt);
  assert.equal(pair.data.系统._回国.阶段, '待父亲回信');
  messages[0].文 = original;
  chat = 'SNAP07-B';
  await consume('通知', receipt);
  assert.equal(pair.data.系统._回国.阶段, '待父亲回信');
  chat = 'SNAP07-A';
  作废当前手机时间线租约世代();
  await consume('通知', receipt);
  assert.equal(pair.data.系统._回国.阶段, '待父亲回信');
});

// COORD008_APPEND_ONLY_BEGIN: the original 27 groups and their fixtures above are unchanged.
// The final boolean selects pure feedback controls that are also meaningful before the archive is sent.
const round2Cases = [
  ['谓语后的之前', false, '父亲回复之前，我先把归档册收好。', true],
  ['已回复后的期待不撤销事实', true, '父亲已经回复；我还在等下一条确认。', true],
  ['上次咨询不是本次反馈', false, '父亲回复过上次的咨询；这份归档才刚发出。', false],
  ['旧咨询后当前回信', true, '父亲回复过上次的咨询；现在又回信确认这份刚发出的归档。', false],
  ['等待已读且没有回执', false, '接下来等父亲已读这份归档；目前还没有任何回执。', true],
  ['读过刚发送归档属于实读', true, '手机已经显示父亲读过刚发送的归档。', false],
  ['已发生回复中的问句', true, '父亲回复：“你收到了吗？”', true],
  ['发来回信中的问句', true, '父亲发来回信：“你收到了吗？”', true],
  ['询问回复是否发生', false, '你低声问：“父亲回复了吗？”', true],
  ['否认回复某句话', false, '父亲并没有回复“你收到了吗”这句话。', true],
  ['并列否定未回复和未买票', false, '父亲还没有回复，也没有买票。', true],
  ['未回复但已买好机票', true, '父亲还没有回复，却已经买好回国的机票。', true],
  ['回信疑问与安静手机', false, '父亲回信了吗？我看了看，手机仍然安静。', true],
  ['事实后另一问句', true, '父亲已经回信了。接下来还要等确认吗？', true],
  ['等回信后再处理', false, '等父亲回信后再处理下一步。', true],
  ['终于等来本次回信', true, '终于等来了父亲对刚发送归档的回信。', false],
];
for (const [label, expected, text, firstControl] of round2Cases) {
  test(`SNAP07 COORD008 新增作用域：${label}`, () => {
    const pair = tickets();
    const checks = [[2, pair.second]];
    if (firstControl) checks.push([1, pair.first]);
    const mismatches = [];
    for (const [beat, event] of checks) {
      const actual = Boolean(home.回国正文越拍原因(event, text));
      if (actual !== expected) mismatches.push({ beat, text, expected, actual });
    }
    assert.deepEqual(mismatches, []);
  });
}
// COORD008_APPEND_ONLY_END

const feedbackScopeCases = [
  ['双否回过信', true, '父亲并非没有回过信确认这份归档。'],
  ['无犹豫后已回复', true, '父亲没有犹豫就回复了本次归档。'],
  ['助理自述买票', false, '父亲的助理说：“我已经买票。”'],
  ['等待反馈', false, '你仍在等待父亲回复这份归档。'],
  ['双否读过本次归档', true, '父亲并不是没有读过这份归档。'],
  ['拒绝犹豫与未回复分别归属', false, '父亲没有犹豫，但没有回复本次归档。'],
  ['不回复决定', false, '父亲没有犹豫就决定不回复本次归档。'],
  ['先前犹豫未完成', false, '父亲还在犹豫是否回复本次归档。'],
  ['直接自述买票', true, '父亲说：“我已经买票。”'],
  ['向助理自述买票', true, '父亲对助理说：“我已经买票。”'],
  ['助理向父亲自述买票', false, '助理对父亲说：“我已经买票。”'],
  ['助理转述已回复', true, '父亲的助理说：“父亲已经回复了这份归档。”'],
  ['父亲转述助理买票', false, '父亲说助理表示：“我已经买票。”'],
  ['回复态度否定', true, '父亲并未迟疑便回了信。'],
  ['回复意愿否定', false, '父亲不愿意回复这份归档。'],
  ['历史回过信', false, '父亲昨天回过信，今天仍没有回复本次归档。'],
];
for (const [label, expected, text] of feedbackScopeCases) {
  test(`SNAP07 反馈动作与说话人归属：${label}`, () => {
    const pair = tickets();
    for (const event of [pair.first, pair.second]) {
      assert.equal(Boolean(home.回国正文越拍原因(event, text)), expected, text);
    }
  });
}
