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

function 合资格数据(绝对时段) {
  const 节点 = 创建户节点(绝对时段);
  节点.妻.当前阶段 = 4;
  节点.夫.信任值 = 100;
  return Schema.parse({ 户: { 102: 节点 }, 系统: { _绝对时段: 绝对时段 } });
}

test('102门缝事件只允许在傍晚抽签，其他五个时段绝不触发', () => {
  for (const 时段偏移 of [0, 1, 2, 4, 5]) {
    for (let 天 = 0; 天 < 40; 天 += 1) {
      const data = 合资格数据(天 * 6 + 时段偏移);
      绿帽线检测(data);
      assert.equal(data.户['102'].夫.结局轨道, '', `非傍晚偏移 ${时段偏移} 不得开线`);
      assert.equal(data.系统._待发送事件, '');
    }
  }
});

test('102门缝事件在傍晚仍保留确定性抽签入口', () => {
  let 命中 = false;
  for (let 天 = 0; 天 < 100 && !命中; 天 += 1) {
    const data = 合资格数据(天 * 6 + 3);
    绿帽线检测(data);
    命中 = data.户['102'].夫.结局轨道 === '观众席';
  }
  assert.equal(命中, true);
});
