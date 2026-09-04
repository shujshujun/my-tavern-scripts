/* eslint-disable import-x/no-nodejs-modules -- Node-only finished portrait semantics */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 道具表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 穿戴成品键, 查完整穿戴图 } = require('../../src/人妻公寓/界面/客户端/穿戴成品图.ts');
const cat = 道具表.猫耳发箍.服饰.穿着描述;
const choker = 道具表.choker颈环.服饰.穿着描述;

test('成品图精确绑定角色、服装、妆容、配饰组合与孕态，不借用相近图片', () => {
  const state = { 特殊: [cat] };
  const index = { [穿戴成品键('安若妍', '', false, state)]: 'approved-image' };
  assert.equal(查完整穿戴图(index, '安若妍', undefined, false, state), 'approved-image');
  for (const [role, outfit, pregnant, variant] of [
    ['夏乔', '', false, state],
    ['安若妍', '碎花连衣裙', false, state],
    ['安若妍', '', true, state],
    ['安若妍', '', false, { 特殊: [cat, choker] }],
    ['安若妍', '', false, { 特殊: [cat], 妆容SKU: '烈色口红' }],
    ['安若妍', '', false, { 特殊: [] }],
  ])
    assert.equal(查完整穿戴图(index, role, outfit, pregnant, variant), '');
});

test('配件顺序和初始服装别名不产生重复组合，历史非物品剧情记录不冒充配件', () => {
  const one = 穿戴成品键('夏乔', '初始外装_夏乔', false, { 特殊: [cat, choker], 妆容SKU: '初始妆容_夏乔' });
  const two = 穿戴成品键('夏乔', '', false, { 特殊: [choker, cat, '剧情记录'] });
  assert.equal(one, two);
});
