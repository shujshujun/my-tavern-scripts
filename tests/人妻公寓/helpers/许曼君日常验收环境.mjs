/* eslint-disable import-x/no-nodejs-modules -- Node-only PLAY-002/015 regression harness. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as ts from 'typescript';
import lodash from 'lodash';
import { 装配真实时间事务门 } from './时间事务门装配.mjs';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
globalThis.getLastMessageId = () => 80;
export const { Schema, 创建户节点 } = require('../../../src/人妻公寓/schema.ts');
export const daily = require('../../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚后日常系统.ts');
const divorce = require('../../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
export const scenes = require('../../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
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
  const runtimeDeps = 装配真实时间事务门(deps);
  Function('module', 'exports', ...Object.keys(runtimeDeps), js)(module, module.exports, ...Object.values(runtimeDeps));
  return module.exports;
}
export { ts };
export const bodies = {
  D1: {
    给自己改衣服: '她检查衣摆，用粉笔标出尺寸。',
    重排201: '她用卷尺量柜子与桌面，标出动线。',
    给自己留一笔生活钱: '她核对固定支出，在账本旁圈出需要的额度。',
  },
  D2: {
    给自己改衣服: '她把衣摆重新缝好，试穿确认合身。',
    重排201: '她挪好柜子，全部物件归位，确认201动线落定。',
    给自己留一笔生活钱: '她在明账里固定留下自己的生活钱。',
  },
};

// 原样复用已交付PLAY-016宿主适配器，不运行/更改其测试，也不替换真实日常验收器。
// 只替换适配器的外部模型文本输入；原listener、开演、落位公式、场景事务与完整回合结算仍执行生产代码。
const prior = ast(readFileSync(new URL('../日常来源与结果楼.test.mjs', import.meta.url), 'utf8'));
const names = ['select', 'functionText', 'execute', 'declarationText', 'callText', 'fresh', 'prepare', 'capture',
  'submitFromProduction', 'settlementApi', 'lifecycleHost'];
const definitions = names.map(name => functionText(prior, name)).join('\n');
export function harness(modelBodies = bodies) {
  return execute(definitions, {
    assert, ts, lodash, require: createRequire(new URL('../日常来源与结果楼.test.mjs', import.meta.url)),
    Schema, 创建户节点, daily, divorce, scenes, clone, 装配真实时间事务门,
    hostAst: ast(readSource('index')), engineAst: ast(readSource('回合引擎')), bodies: modelBodies,
  }, '({ fresh, prepare, capture, submitFromProduction, lifecycleHost })');
}
