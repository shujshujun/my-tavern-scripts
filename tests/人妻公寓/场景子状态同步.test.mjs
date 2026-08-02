/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 计算场景同步 } = require('../../src/人妻公寓/界面/客户端/场景状态同步.ts');

test('同一房间不能在同步破门与由头子状态之前提前返回', () => {
  const start = appSource.indexOf('function 同步场景自变量()');
  const end = appSource.indexOf('// ── 转场横幅', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const body = appSource.slice(start, end);

  assert.doesNotMatch(body, /if \(目标房 === 当前房间\.value\) return/);
});

test('同房间会同步三个子状态，但不会要求清理对话粘滞', () => {
  const next = 计算场景同步(
    { 房间id: '101', 非法进入: true, 进房末楼: 10, 由头已用: true },
    { 房间id: '101', 破门: false, 非法进入: true, 进房末楼: 12, 由头已用: false },
    20,
  );

  assert.deepEqual(next, {
    房间id: '101',
    房间变化: false,
    非法进入: true,
    进房末楼: 12,
    由头已用: false,
  });
});

test('破门第一幕不能代替持续非法进入状态', () => {
  const next = 计算场景同步(
    { 房间id: null, 非法进入: false, 进房末楼: 0, 由头已用: false },
    { 房间id: '101', 破门: true, 非法进入: false, 进房末楼: 8 },
    9,
  );

  assert.equal(next.非法进入, false);
  assert.equal(next.房间变化, true);
});

test('同房间临时缺楼戳时保留冻结楼，换房时才使用缺省末楼', () => {
  const 当前 = { 房间id: '101', 非法进入: false, 进房末楼: 7, 由头已用: false };
  assert.equal(计算场景同步(当前, { 房间id: '101' }, 20).进房末楼, 7);
  assert.equal(计算场景同步(当前, { 房间id: '102' }, 20).进房末楼, 20);
});
