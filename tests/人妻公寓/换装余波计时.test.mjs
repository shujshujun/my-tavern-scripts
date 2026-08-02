/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let 聊天变量 = {};
globalThis.getVariables = () => 聊天变量;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 创建换装余波事件ID, 同一换装余波事件, 余波已发酵, 读余波 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/雌竞系统.ts',
);

test('换装余波公共发酵边界统一等待三楼', () => {
  assert.equal(余波已发酵(12, 10), false);
  assert.equal(余波已发酵(13, 10), true);
});

test('换装余波在第十八楼边界即过期', () => {
  聊天变量 = { _换装余波: { 门牌: '101', 起楼: 10, 物: '换了衣服' } };
  assert.notEqual(读余波(27), null);
  assert.equal(读余波(28), null);
});

test('新余波持久事件ID消除同门牌同楼同物 ABA，旧无ID记录仍兼容字段身份', () => {
  const 基础 = { 门牌: '101', 起楼: 10, 物: '换了衣服', 私密: false };
  const a = { ...基础, 事件ID: 创建换装余波事件ID() };
  const b = { ...基础, 事件ID: 创建换装余波事件ID() };
  assert.notEqual(a.事件ID, b.事件ID);
  assert.equal(同一换装余波事件(a, b), false);
  assert.equal(同一换装余波事件(基础, { ...基础 }), true);
  assert.equal(同一换装余波事件(基础, a), false, '旧任务不能把同字段的新ID事件当成原事件');
});
