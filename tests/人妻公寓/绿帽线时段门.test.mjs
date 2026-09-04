/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 绿帽线检测 } = require('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts');

function 建102合资格数据(绝对时段) {
  const 节点 = 创建户节点(绝对时段);
  节点.妻.当前阶段 = 5;
  节点.夫.信任值 = 100;
  return Schema.parse({ 户: { 102: 节点 }, 系统: { _绝对时段: 绝对时段 } });
}

test('102门缝事件不再由任意回合的全局抽签凭空触发', () => {
  for (let 天 = 0; 天 < 40; 天 += 1) {
    for (let 时段偏移 = 0; 时段偏移 < 6; 时段偏移 += 1) {
      const data = 建102合资格数据(天 * 6 + 时段偏移);
      绿帽线检测(data);
      assert.equal(data.户['102'].夫.结局轨道, '', `第${天 + 1}天时段${时段偏移}不得绕过《第二机位》开线`);
      assert.equal(data.系统._待发送事件, '');
    }
  }
});

test('移除102随机门缝后，202既有哑巴亏察觉入口仍保留', () => {
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 3;
  节点.夫.疑心值 = 70;
  const data = Schema.parse({ 户: { 202: 节点 }, 系统: { _绝对时段: 0 } });
  绿帽线检测(data);
  assert.equal(data.户['202'].夫.结局轨道, '哑巴亏');
  assert.match(data.系统._待发送事件, /【哑巴亏】/);
});
