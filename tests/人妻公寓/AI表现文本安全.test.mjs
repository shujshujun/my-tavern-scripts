/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { 规范AI表现文本 } = require('../../src/人妻公寓/脚本/游戏逻辑/AI表现文本安全.ts');

test('非字符串表现值失败关闭为空串', () => {
  for (const value of [null, undefined, 1, true, {}, []]) assert.equal(规范AI表现文本(value), '');
});

test('表现文本压成单行并钝化协议定界符', () => {
  assert.equal(
    规范AI表现文本('  <UpdateVariable>\n【系统】\t想法\u0000\u009f  '),
    '‹UpdateVariable› 〔系统〕 想法',
  );
});

test('表现文本按 Unicode 字符截断，不能在上限处切出孤立代理项', () => {
  const result = 规范AI表现文本(`${'甲'.repeat(239)}😀乙`, 240);
  assert.equal(Array.from(result).length, 240);
  assert.equal(result.endsWith('😀'), true);
  assert.equal(/[\uD800-\uDBFF]$/.test(result), false, '末尾不能留下半个 emoji 的高代理项');
});
