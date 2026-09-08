/* eslint-disable import-x/no-nodejs-modules -- Node-only compatibility regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const indexSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

function literalUser(template, user) {
  return template.replace(/\{\{user\}\}/g, () => user);
}

test('CODE-IDENTITY-001 合法Persona中的$&必须按字面插入而不是替换串语义', () => {
  assert.equal(literalUser('管理员={{user}}；再次={{user}}', 'A$&B'), '管理员=A$&B；再次=A$&B');
  assert.equal(literalUser('{{user}}', '$`-$\'-$1-$$'), '$`-$\'-$1-$$');
});

test('原生备用快照入口必须使用replace回调插入getUserName结果', () => {
  const start = indexSource.indexOf('// 组快照 + {{user}} 替换');
  const block = indexSource.slice(start, start + 420);
  assert.ok(start >= 0, '找不到原生快照Persona替换入口');
  assert.match(block, /\.replace\(\s*\/\\\{\\\{user\\\}\\\}\/g,\s*\(\)\s*=>\s*getUserName\(\)\s*,?\s*\)/u);
  assert.doesNotMatch(block, /\.replace\(\s*\/\\\{\\\{user\\\}\\\}\/g,\s*getUserName\(\)\s*,?\s*\)/u);
});
