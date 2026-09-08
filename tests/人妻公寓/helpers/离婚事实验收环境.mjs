/* eslint-disable import-x/no-nodejs-modules -- PLAY-013 local production-module tests; no host/model I/O. */
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
export const { Schema, 创建户节点 } = require('../../../src/人妻公寓/schema.ts');
export const route = require('../../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
export const clone = value => lodash.cloneDeep(value);
const source = readFileSync(new URL('../../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts', import.meta.url), 'utf8');
const tree = ts.createSourceFile('divorce.ts', source, ts.ScriptTarget.Latest, true);
// Only expose the actual private predicate and its local helpers for focused scope assertions.
const helperNames = new Set(['positiveSentence', '离婚事实候选句', '离婚事实匹配有效']);
const definitions = tree.statements.filter(node => ts.isFunctionDeclaration(node) && helperNames.has(node.name?.text))
  .map(node => node.getText(tree)).join('\n');
const js = ts.transpileModule(`${definitions}\nmodule.exports = positiveSentence;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
Function('module', 'exports', js)(module, module.exports);
export const positive = module.exports;
export function ticket(code, payload = '-') {
  return `【许曼君离婚提交:${code}:待公开站位:8:1:${payload}】`;
}
export function witness(choice = '当着赵国强牵住她', relation = '继续关系') {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: 3 }, 现金: 5000 });
  data.户['201'].妻.当前阶段 = 5;
  // Explicit completed-separation precondition, not a simulated full preceding story.
  Object.assign(data.系统._许曼君分居, { 方案版本: 2, 阶段: '已完成', 工资卡状态: '已归还赵国强',
    钥匙位置: '管理员室201钥匙格', 钥匙用途: '待离婚交接', 丈夫已知玩家关系: true,
    丈夫已选择外住: true, 生活用品已取完: true, 许曼君已拒绝恢复共同生活: true,
    双方同意进入办理: true, 玩家最终关系选择: relation });
  data.户['201'].夫._居住模式 = '待离婚交接';
  assert.equal(route.购买许曼君离婚(data, 1500).成功, true);
  const start = route.执行许曼君离婚地点动作(data, '使用红色封存盒', '201', 20);
  assert.equal(start.成功, true);
  assert.equal(route.许曼君离婚正文越拍原因(start.事件, '她约好办理手续的时间。'), '');
  assert.equal(route.提交许曼君离婚剧情事件(data, start.事件, '201', 22).成功, true);
  data.系统._绝对时段 = data.系统._许曼君离婚.办理预约时段;
  const first = route.执行许曼君离婚地点动作(data, '陪她去办最后手续', '大堂', 30);
  assert.equal(first.成功, true);
  assert.equal(route.许曼君离婚正文越拍原因(first.事件, '夫妻仍在办理，玩家在出口等待。'), '');
  assert.equal(route.提交许曼君离婚剧情事件(data, first.事件, '大堂', 32).成功, true);
  const second = route.执行许曼君离婚地点动作(data, choice, '大堂', 32);
  assert.equal(second.成功, true);
  return { data, event: second.事件, room: '大堂', floor: 34 };
}
// Local composition of the two real public validators and real commit function.
// This is NOT the denied engine/index AST call-chain or actual host persistence.
export function checkedCandidate(f, body, wives = ['201'], husbands = route.许曼君离婚事件需赵国强在场(f.event) ? ['201'] : []) {
  const candidate = clone(f.data);
  const error = route.许曼君离婚剧情演员错误(f.event, wives, husbands) || route.许曼君离婚正文越拍原因(f.event, body);
  if (error) return { success: false, error, candidate };
  const result = route.提交许曼君离婚剧情事件(candidate, f.event, f.room, f.floor);
  return { success: !!result?.成功, result, candidate };
}
