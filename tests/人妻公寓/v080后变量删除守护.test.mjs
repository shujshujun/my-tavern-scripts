/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 捕获保护快照, 回滚保护字段, 清保护快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts');

const 范围 = { 妻: ['101'], 夫: [], 亲密妻: ['101'] };

function 建基准() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) } });
  const 妻 = data.户['101'].妻;
  妻.当前阶段 = 3;
  妻.好感值 = 64;
  妻.堕落值 = 46;
  妻.当前心理想法 = '我得再观察他一阵。';
  妻.当前情绪 = '戒备';
  妻.身体开发.胸部 = 12;
  return data;
}

test('官方外置桥即使把可写叶子 remove 掉，守护也必须恢复原值而不是采纳 Schema 默认值', () => {
  const 基准 = 建基准();
  捕获保护快照(基准);
  try {
    const raw = lodash.cloneDeep(基准);
    delete raw.户['101'].妻.当前心理想法;
    delete raw.户['101'].妻.当前情绪;
    delete raw.户['101'].妻.好感值;
    delete raw.户['101'].妻.身体开发.胸部;

    const 候选 = Schema.parse(raw);
    回滚保护字段(候选, ['101'], 范围, 12, raw);

    assert.equal(候选.户['101'].妻.当前心理想法, 基准.户['101'].妻.当前心理想法);
    assert.equal(候选.户['101'].妻.当前情绪, 基准.户['101'].妻.当前情绪);
    assert.equal(候选.户['101'].妻.好感值, 基准.户['101'].妻.好感值);
    assert.equal(候选.户['101'].妻.身体开发.胸部, 基准.户['101'].妻.身体开发.胸部);
  } finally {
    清保护快照();
  }
});

test('合法 replace 仍能通过删除防线，不把所有可写变化一概拍回', () => {
  const 基准 = 建基准();
  捕获保护快照(基准);
  try {
    const raw = lodash.cloneDeep(基准);
    raw.户['101'].妻.当前心理想法 = '他今天倒是比我想象中可靠。';
    raw.户['101'].妻.当前情绪 = '放松';
    raw.户['101'].妻.好感值 = 66;
    raw.户['101'].妻.身体开发.胸部 = 14;

    const 候选 = Schema.parse(raw);
    回滚保护字段(候选, ['101'], 范围, 12, raw);

    assert.equal(候选.户['101'].妻.当前心理想法, '他今天倒是比我想象中可靠。');
    assert.equal(候选.户['101'].妻.当前情绪, '放松');
    assert.equal(候选.户['101'].妻.好感值, 66);
    assert.equal(候选.户['101'].妻.身体开发.胸部, 14);
  } finally {
    清保护快照();
  }
});
