/* eslint-disable import-x/no-nodejs-modules -- Node-only PLAY-012/014 regression harness. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as ts from 'typescript';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '201' } });
globalThis.insertOrAssignVariables = () => undefined;
globalThis.getLastMessageId = () => 90;
const db = require.resolve('../../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };
export const { Schema, 创建户节点 } = require('../../../src/人妻公寓/schema.ts');
export const route = require('../../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
export const bridge = require('../../../src/人妻公寓/脚本/游戏逻辑/许曼君分居输入桥.ts');
export const scenes = require('../../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const clock = require('../../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const stage = require('../../../src/人妻公寓/stageConfig.ts');
const shop = require('../../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
export const clone = value => lodash.cloneDeep(value);
export const readSource = name => readFileSync(new URL(`../../../src/人妻公寓/脚本/游戏逻辑/${name}.ts`, import.meta.url), 'utf8');
export const ast = text => ts.createSourceFile('fixture.ts', text, ts.ScriptTarget.Latest, true);
export function select(tree, predicate) {
  const found = [];
  function visit(node) { if (predicate(node)) found.push(node); ts.forEachChild(node, visit); }
  visit(tree); return found;
}
export function functionText(tree, name) {
  const nodes = select(tree, n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.equal(nodes.length, 1, name); return nodes[0].getText(tree);
}
export function execute(text, deps, expression) {
  const js = ts.transpileModule(`${text}\nmodule.exports = ${expression};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(deps), js)(module, module.exports, ...Object.values(deps));
  return module.exports;
}
export { ts };

// Reuse the existing neutral four-act journey helpers verbatim, without importing/running their tests.
// No character/state-machine/parser is replaced. Database I/O and host globals are isolated above.
const prior = ast(readFileSync(new URL('../许曼君201四幕重设计.test.mjs', import.meta.url), 'utf8'));
const names = ['建数据', '找动作时段', '做动作', '交一拍', '下一拍', '推进至外住登记',
  '推进至第三幕完成', '推进至私下决定', '推进至最终钥匙'];
export const journey = execute(names.map(name => functionText(prior, name)).join('\n'), {
  assert, Schema, 创建户节点, lodash, ...route, ...clock, ...stage, ...shop,
}, `({ ${names.join(', ')} })`);

export function firstDecision() {
  const data = journey.建数据();
  assert.equal(shop.购买(data, route.许曼君分居任务ID).成功, true);
  journey.找动作时段(data, '201', '开始第一幕初谈');
  const start = journey.做动作(data, '201', '开始第一幕初谈');
  const p1 = journey.交一拍(data, start.事件, '201', 1);
  const p2 = journey.下一拍(data, p1, '201', 2);
  return { data, event: p2.后续剧情.事件, floor: 3, room: '201' };
}
export function finalDecision(permission = true) {
  const data = journey.推进至私下决定();
  // Compatibility precondition only: previously granted permission/history. No scene is simulated here.
  data.系统._许曼君分居.留宿201权限 = permission;
  data.系统._许曼君分居.共同夜晚状态 = permission ? '已完成' : '待接受';
  journey.找动作时段(data, '201', '开始第四幕私下决定');
  const start = journey.做动作(data, '201', '开始第四幕私下决定');
  const p1 = journey.交一拍(data, start.事件, '201', 15);
  return { data, event: p1.后续剧情.事件, floor: 16, room: '201' };
}
export function handoffProposal() {
  const f = finalDecision();
  assert.equal(route.提交许曼君分居剧情事件(f.data, f.event, f.room, f.floor, '我会继续留下。').成功, true);
  f.data.系统._绝对时段 = f.data.系统._许曼君分居.预约时段;
  const start = journey.做动作(f.data, '管理员室', '开始第四幕管理员室交接');
  return { data: f.data, event: start.事件, floor: 17, room: '管理员室' };
}
const roots = { fixed: ast(readSource('回合引擎')), native: ast(readSource('index')) };

export function nativeCandidate(fixture, body, player = '我在听。', wives = ['201'], husbands = ['201']) {
  const tree = roots.native;
  const blocks = select(tree, n => ts.isIfStatement(n) && n.expression.getText(tree) === '!本轮静音会议 && 许曼君分居票');
  assert.equal(blocks.length, 1);
  return execute(`let 原生许曼君分居提交;\n${blocks[0].getText(tree)}`, {
    ...route, 本轮静音会议: false, 许曼君分居票: route.解析许曼君分居剧情事件(fixture.event),
    newData: fixture.data, 本楼事件: fixture.event, 本轮有效正文: body,
    _本轮妻在场: wives, _本轮夫在场: husbands, _本轮玩家文本: player,
    楼层: fixture.floor, 读场景: () => ({ 房间id: fixture.room }),
  }, '原生许曼君分居提交');
}

/** Actual first/rewrite gate. Only external generation, other routes and caller-owned lease predicate are adapted. */
export async function fixedReview(fixture, first, second = first, options = {}) {
  const tree = roots.fixed;
  const declaration = name => {
    const found = select(tree, n => ts.isVariableStatement(n) && n.declarationList.declarations.some(d => d.name.getText(tree) === name));
    assert.equal(found.length, 1, name); return found[0].getText(tree);
  };
  const blocks = select(tree, n => ts.isIfStatement(n) && n.expression.getText(tree).startsWith('首稿重写原因 &&'));
  assert.equal(blocks.length, 1);
  let generations = 0;
  const deps = {
    _: lodash, ...route, first, 本楼事件: fixture.event, 当前拍正文: first,
    许曼君分居票: route.解析许曼君分居剧情事件(fixture.event),
    不再留门票: null, 第二机位票: null, 安若妍不必停票: null, 许曼君离婚票: null,
    许曼君离婚后日常票: null, 回国票: null, 双重继承票: null, 焦点妻门牌: null,
    快照: '', 行动锚: '', 选项: {}, 本轮数据库已安装: false, 回合前末楼: fixture.floor - 2,
    行动: options.player ?? '我在听。', 正文模型覆盖: {}, 焦点妻们: ['201'], 阶段表: { 201: 5 }, 尺度模式: '', 正戏免检: false,
    拍摄尺度契约: null,
    console: { warn() {} }, eventEmit() {}, 应用酒馆最终显示正则: text => text, 提取可提交正文: text => text,
    提取正文舞台文本: text => text, 是提供方拒答正文: () => false,
    输出稽查: () => ({ 状态: '通过' }),
    确认本轮事务有效: () => { if (options.stale) throw new Error('isolated stale caller lease'); },
    等待正文生成: async () => { generations++; if (options.error) throw new Error(options.error); return second; },
  };
  for (const name of ['不再留门正文越拍原因', '第二机位正文越拍原因', '安若妍不必停正文越拍原因',
    '许曼君离婚正文越拍原因', '许曼君离婚后日常正文越界原因', '回国正文越拍原因', '双重继承正文越拍原因']) deps[name] = () => '';
  const text = `async function review() { let 原文 = first, 最终显示原文 = first, 本回合生成id = '', 失败残稿 = ''; let 使用无处罚拒绝兜底 = false; let 稽查 = { 状态: '通过' };\n` +
    declaration('专属节拍错误') + '\n' + declaration('首稿重写原因') + '\n' + blocks[0].getText(tree) + '\nreturn 原文; }';
  const body = await execute(text, deps, 'review()');
  return { body, generations };
}
export function productionSubmit(fixture, player, channel = 'fixed', body = '') {
  const tree = roots[channel];
  const calls = select(tree, n => ts.isCallExpression(n) && n.expression.getText(tree) === '提交许曼君分居剧情事件');
  assert.equal(calls.length, 1);
  return execute('', {
    ...route, newStat: fixture.data, newData: fixture.data, 本楼事件: fixture.event,
    回合场景: fixture.room, 楼层: fixture.floor, 玩家行动: player, _本轮玩家文本: player,
    正文: body, 本轮有效正文: body,
    读场景: () => ({ 房间id: fixture.room }),
  }, calls[0].getText(tree));
}
