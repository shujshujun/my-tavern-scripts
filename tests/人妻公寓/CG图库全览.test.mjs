/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const {
  CG全览连击窗口毫秒,
  CG项可查看,
  创建CG全览连击状态,
  记录CG全览标题点击,
} = require('../../src/人妻公寓/界面/客户端/components/CG图库全览.ts');

test('CG 图库标题在三秒内连续点击五次才开启全览', () => {
  let 状态 = 创建CG全览连击状态();
  for (let 次数 = 0; 次数 < 4; 次数 += 1) {
    const 结果 = 记录CG全览标题点击(状态, 1_000 + 次数 * 500);
    状态 = 结果.状态;
    assert.equal(结果.应开启, false);
  }

  const 第五次 = 记录CG全览标题点击(状态, 1_000 + CG全览连击窗口毫秒);
  assert.equal(第五次.应开启, true);
  assert.deepEqual(第五次.状态, 创建CG全览连击状态(), '成功后连击计数应复位');
});

test('CG 图库标题连击超时后从第一次重新计算', () => {
  let 状态 = 创建CG全览连击状态();
  for (let 次数 = 0; 次数 < 4; 次数 += 1) {
    状态 = 记录CG全览标题点击(状态, 2_000 + 次数 * 400).状态;
  }

  const 超时点击 = 记录CG全览标题点击(状态, 2_000 + CG全览连击窗口毫秒 + 1);
  assert.equal(超时点击.应开启, false);
  assert.equal(超时点击.状态.次数, 1);
  assert.equal(超时点击.状态.首次点击毫秒, 2_000 + CG全览连击窗口毫秒 + 1);
});

test('全览只放开查看，不修改真实解锁集合', () => {
  const 已解锁 = new Set(['cg-unlocked']);

  assert.equal(CG项可查看(已解锁, 'cg-unlocked', false), true);
  assert.equal(CG项可查看(已解锁, 'cg-locked', false), false);
  assert.equal(CG项可查看(已解锁, 'cg-locked', true), true);
  assert.deepEqual([...已解锁], ['cg-unlocked']);
});
