/* eslint-disable import-x/no-nodejs-modules -- Node-only actual production gate regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import * as ts from 'typescript';
import lodash from 'lodash';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
globalThis._ = lodash;
const door = require('../../src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');
const home = require('../../src/人妻公寓/脚本/游戏逻辑/回国系统.ts');
const text = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const tree = ts.createSourceFile('回合引擎.ts', text, ts.ScriptTarget.Latest, true);
function select(predicate) {
  const matches = [];
  function visit(node) { if (predicate(node)) matches.push(node); ts.forEachChild(node, visit); }
  visit(tree);
  assert.equal(matches.length, 1, 'The actual production gate must be uniquely located');
  return matches[0].getText(tree);
}
const declaration = name => select(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(tree) === name));
const actualGate = [
  declaration('专属节拍错误'), declaration('首稿重写原因'),
  select(node => ts.isIfStatement(node) && node.expression.getText(tree).startsWith('首稿重写原因 &&')),
].join('\n');

// The complete production first/rewrite block and the two target validators are real.
// Model generation, display extraction, general scale auditing, sibling routes and caller lease are adapters.
async function review(event, first, second, state, options = {}) {
  const deps = {
    _: lodash, ...door, ...home, first, 本楼事件: event, 当前拍正文: first,
    不再留门票: door.解析不再留门剧情事件(event), 回国票: home.解析回国剧情事件(event),
    第二机位票: null, 安若妍不必停票: null, 许曼君分居票: null, 许曼君离婚票: null,
    许曼君离婚后日常票: null, 双重继承票: null, 焦点妻门牌: null,
    快照: '', 行动锚: '', 选项: {}, 本轮数据库已安装: false, 回合前末楼: 30,
    行动: '继续当前拍。', 正文模型覆盖: {}, 焦点妻们: [], 阶段表: {}, 尺度模式: '', 正戏免检: false,
    console: { warn() {} }, eventEmit() {}, 应用酒馆最终显示正则: value => value, 提取可提交正文: value => value,
    输出稽查: () => ({ 状态: '通过' }),
    确认本轮事务有效: () => { state.leaseChecks++; if (options.stale) throw new Error('TEST_STALE_LEASE'); },
    等待正文生成: async () => { state.generations++; if (options.error) throw new Error(options.error); return second; },
  };
  for (const name of ['第二机位正文越拍原因', '安若妍不必停正文越拍原因', '许曼君分居正文越拍原因',
    '许曼君离婚正文越拍原因', '许曼君离婚后日常正文越界原因', '双重继承正文越拍原因']) deps[name] = () => '';
  const js = ts.transpileModule(`async function run() {
    let 原文 = first, 最终显示原文 = first, 本回合生成id = '';
    let 稽查 = { 状态: '通过' };
    ${actualGate}
    return 原文;
  } return run();`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  return Function(...Object.keys(deps), js)(...Object.values(deps));
}
const cases = [
  {
    id: '019', event: '【不再留门提交:retry-e91a:1:A2:2:18】',
    good: '何俊生没有离开，同成年同行者亲吻了。',
    bad: '如果何俊生与成年同行人亲吻，玩家再作决定。',
  },
  {
    id: '024', event: '【回国提交:D:管理记录中:30:1】',
    good: '要是找不到经营缺口，我们再谈交接。',
    bad: '母亲确认无需圆场，同时问你是否确认下周的安排。',
  },
];
for (const c of cases) {
  const counters = () => ({ generations: 0, leaseChecks: 0 });
  test(`PLAY${c.id} 实际首稿门：合法分句不触发不必要重写`, async () => {
    const state = counters();
    assert.equal(await review(c.event, c.good, c.bad, state), c.good);
    assert.equal(state.generations, 0);
  });
  test(`PLAY${c.id} 实际二稿门：错误首稿被合法二稿替换`, async () => {
    const state = counters();
    assert.equal(await review(c.event, c.bad, c.good, state), c.good);
    assert.deepEqual(state, { generations: 1, leaseChecks: 1 });
  });
  test(`PLAY${c.id} 实际二稿门：两稿错误必须抛错，不返回可提交正文`, async () => {
    const state = counters();
    await assert.rejects(review(c.event, c.bad, c.bad, state), /未能通过验收|两次未能停在正确节点/u);
    assert.equal(state.generations, 1);
  });
  for (const error of ['TEST_TIMEOUT', 'TEST_CANCELLED', 'TEST_MISSING_MODEL']) {
    test(`PLAY${c.id} 实际重试链：${error} 不被吞成成功`, async () => {
      const state = counters();
      await assert.rejects(review(c.event, c.bad, c.good, state, { error }), new RegExp(error));
      assert.equal(state.generations, 1);
      assert.equal(state.leaseChecks, 0);
    });
  }
  test(`PLAY${c.id} 实际重试链：迟到二稿先经过原时间线检查`, async () => {
    const state = counters();
    await assert.rejects(review(c.event, c.bad, c.good, state, { stale: true }), /TEST_STALE_LEASE/u);
    assert.deepEqual(state, { generations: 1, leaseChecks: 1 });
  });
}
