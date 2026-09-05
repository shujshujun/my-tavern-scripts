/* eslint-disable import-x/no-nodejs-modules -- Node-only compatibility contract */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const root = require('../../src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');
const facade = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局后生活语义扩展.ts');
const source = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/结局后生活语义扩展.ts', import.meta.url),
  'utf8',
);

test('手机侧旧扩展路径只是权威结局后语义的兼容门面，不维护第二套触发条件或文案池', () => {
  assert.match(source, /export \* from '\.\.\/结局后生活社交语义'/);
  assert.doesNotMatch(source, /角色语义表|完成标记\(|朋友圈纪律:|主动私聊:/);
  for (const name of [
    '构建角色结局后生活社交语义',
    '角色结局后生活提示',
    '角色结局后主动私聊主题',
    '角色结局后姐妹群长期方向',
  ]) {
    assert.equal(facade[name], root[name], `${name}必须直接复用唯一权威导出`);
  }
});
