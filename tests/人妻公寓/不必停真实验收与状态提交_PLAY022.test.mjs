/* eslint-disable import-x/no-nodejs-modules -- Actual PLAY-022 first/rewrite block and independent state-owner tests. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import * as ts from 'typescript';
import lodash from 'lodash';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '301' } });
globalThis.insertOrAssignVariables = () => undefined;
const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');

// Extract only the already inspected first/rewrite block. This does not inspect or print the native index caller.
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const tree = ts.createSourceFile('回合引擎.ts', source, ts.ScriptTarget.Latest, true);
function select(predicate) {
  const found = [];
  function visit(node) { if (predicate(node)) found.push(node); ts.forEachChild(node, visit); }
  visit(tree);
  assert.equal(found.length, 1, 'The production first/rewrite block must remain uniquely identified');
  return found[0].getText(tree);
}
const declaration = name => select(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(tree) === name));
const gate = [declaration('专属节拍错误'), declaration('首稿重写原因'),
  select(node => ts.isIfStatement(node) && node.expression.getText(tree).startsWith('首稿重写原因 &&'))].join('\n');
const js = ts.transpileModule(`async function run() {
  let 原文 = first, 最终显示原文 = first, 本回合生成id = '', 失败残稿 = '';
  let 使用无处罚拒绝兜底 = false;
  let 稽查 = { 状态: '通过' };
  ${gate}
  return 原文;
} return run();`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;

// Actual target parser, target semantic gate and complete retry control flow.
// Model, general scale check, sibling routes, display extraction and caller lease are explicit adapters.
async function review(event, first, second, state, options = {}) {
  const deps = {
    _: lodash, ...route, first, 本楼事件: event, 当前拍正文: first,
    安若妍不必停票: route.解析安若妍不必停剧情事件(event),
    不再留门票: null, 回国票: null, 第二机位票: null, 许曼君分居票: null, 许曼君离婚票: null,
    许曼君离婚后日常票: null, 双重继承票: null, 焦点妻门牌: null,
    快照: '', 行动锚: '', 选项: {}, 本轮数据库已安装: false, 回合前末楼: 30,
    行动: '继续当前拍。', 正文模型覆盖: {}, 焦点妻们: [], 阶段表: {}, 尺度模式: '', 正戏免检: false,
    拍摄尺度契约: null,
    console: { warn() {} }, eventEmit() {}, 应用酒馆最终显示正则: value => value, 提取可提交正文: value => value,
    提取正文舞台文本: value => value, 是提供方拒答正文: () => false,
    输出稽查: () => ({ 状态: '通过' }),
    确认本轮事务有效: () => { state.leaseChecks++; if (options.stale) throw new Error('TEST_STALE_LEASE'); },
    等待正文生成: async () => { state.generations++; if (options.error) throw new Error(options.error); return second; },
  };
  for (const name of ['不再留门正文越拍原因', '回国正文越拍原因', '第二机位正文越拍原因', '许曼君分居正文越拍原因',
    '许曼君离婚正文越拍原因', '许曼君离婚后日常正文越界原因', '双重继承正文越拍原因']) deps[name] = () => '';
  return Function(...Object.keys(deps), js)(...Object.values(deps));
}
const cases = [
  { name: 'H8', scene: 'H8关门', beat: 1, phase: 'H8中',
    good: '你没有离开，而是继续刚才的动作。江辰从外面关好卧室门，转身去书房。',
    bad: '如果玩家继续刚才的动作，安若妍会回应。江辰从外面关好卧室门，转身去书房。',
    flag: 'H8完成', next: '亲密后半' },
  { name: 'D1', scene: 'D1客厅', beat: 2, phase: '客厅中',
    good: '江辰没有离开，已明确双方互不干涉并答应提前通知。',
    bad: '“互不干涉、提前通知”只是提议，还没有答应。',
    flag: '提前通知已约定', next: '待最终登记' },
];
const counters = () => ({ generations: 0, leaseChecks: 0 });
function fixture(c) {
  const data = Schema.parse({ 户: { 301: 创建户节点(0) } });
  Object.assign(data.系统._安若妍不必停, { 阶段: c.phase, 当前场景: c.scene, 当前拍: c.beat });
  return data;
}
for (const c of cases) {
  const event = `【安若妍不必停提交:${c.scene}:${c.beat}】`;
  test(`PLAY-022 ${c.name}真实首稿：合法分句原样保留，不触发重写`, async () => {
    const state = counters();
    assert.equal(await review(event, c.good, c.bad, state), c.good);
    assert.deepEqual(state, { generations: 0, leaseChecks: 0 });
  });
  test(`PLAY-022 ${c.name}真实二稿：合法重写替换条件或提议`, async () => {
    const state = counters();
    assert.equal(await review(event, c.bad, c.good, state), c.good);
    assert.deepEqual(state, { generations: 1, leaseChecks: 1 });
  });
  test(`PLAY-022 ${c.name}真实二稿：两次不成立必须抛错而非普通兜底`, async () => {
    await assert.rejects(review(event, c.bad, c.bad, counters()), /《不必停》.*两次未能停在正确节点/u);
  });
  for (const error of ['TEST_TIMEOUT', 'TEST_CANCELLED', 'TEST_MISSING_MODEL']) {
    test(`PLAY-022 ${c.name}真实重写：${error}不转为成功`, async () => {
      const state = counters();
      await assert.rejects(review(event, c.bad, c.good, state, { error }), new RegExp(error));
      assert.deepEqual(state, { generations: 1, leaseChecks: 0 });
    });
  }
  test(`PLAY-022 ${c.name}真实重写：迟到二稿先验证原事务`, async () => {
    const state = counters();
    await assert.rejects(review(event, c.bad, c.good, state, { stale: true }), /TEST_STALE_LEASE/u);
    assert.deepEqual(state, { generations: 1, leaseChecks: 1 });
  });
  // The following uses the real state owner in an explicit test orchestration, not the full host transaction.
  test(`PLAY-022 ${c.name}真实状态所有者：合法正文后只提交当前检查点且重复不重做`, async () => {
    const data = fixture(c);
    const body = await review(event, c.bad, c.good, counters());
    assert.equal(route.安若妍不必停正文越拍原因(event, body), '');
    const result = route.提交安若妍不必停剧情事件(data, event, '301', 32);
    assert.equal(result?.成功, true);
    assert.equal(data.系统._安若妍不必停[c.flag], true);
    assert.equal(data.系统._安若妍不必停.阶段, c.next);
    const committed = lodash.cloneDeep(data);
    assert.equal(route.提交安若妍不必停剧情事件(data, event, '301', 33)?.成功, false);
    assert.deepEqual(data, committed);
  });
  test(`PLAY-022 ${c.name}真实状态所有者：错地点及旧检查点不能提交`, () => {
    const data = fixture(c);
    const before = lodash.cloneDeep(data);
    assert.equal(route.提交安若妍不必停剧情事件(data, event, '302', 32)?.成功, false);
    assert.deepEqual(data, before);
    data.系统._安若妍不必停.当前场景 = '';
    const stale = lodash.cloneDeep(data);
    assert.equal(route.提交安若妍不必停剧情事件(data, event, '301', 32)?.成功, false);
    assert.deepEqual(data, stale);
  });
  test(`PLAY-022 ${c.name}隔离回档：纯判定不落状态，恢复后可重新完成`, async () => {
    const data = fixture(c);
    const before = lodash.cloneDeep(data);
    await assert.rejects(review(event, c.bad, c.bad, counters()));
    assert.deepEqual(data, before);
    const restored = Schema.parse(JSON.parse(JSON.stringify(before)));
    assert.equal(route.安若妍不必停正文越拍原因(event, c.good), '');
    assert.equal(route.提交安若妍不必停剧情事件(restored, event, '301', 35)?.成功, true);
    assert.equal(restored.系统._安若妍不必停[c.flag], true);
    assert.deepEqual(data, before);
  });
}
