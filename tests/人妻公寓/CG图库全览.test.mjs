/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const 图库源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/components/CG图库.vue', import.meta.url),
  'utf8',
);

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

test('图库缩略图与大图失败时显示本地坏图态，不留下破图或打开空白预览', () => {
  assert.match(图库源码, /const 失效CG = ref<ReadonlySet<string>>\(new Set\(\)\)/, '坏图状态只在本次图库实例保存');
  assert.match(图库源码, /function 标记CG失效\(id: string\)/, '组件必须按稳定 CG id 标记失败');
  assert.match(图库源码, /失效CG\.value = new Set\(\[\.\.\.失效CG\.value, id\]\)/, 'Set 更新必须触发 Vue 响应');
  assert.match(图库源码, /if \(预览\.value\?\.id === id\) 预览\.value = null/, '大图失败要关闭对应预览');
  assert.match(图库源码, /@error="标记CG失效\(项\.id\)"/, '缩略图失败必须登记真实条目');
  assert.match(图库源码, /@error="标记CG失效\(预览\.id\)"/, '预览失败必须登记真实条目');
  assert.match(图库源码, /v-else-if="可查看CG\(项\)" class="cg-broken"/, '已解锁坏图显示明确占位而非锁图');
  assert.match(图库源码, /:disabled="!可查看CG\(项\) \|\| 失效CG\.has\(项\.id\)"/, '坏图条目不可继续打开空白预览');
});

test('全览只放开查看，不修改真实解锁集合', () => {
  const 已解锁 = new Set(['cg-unlocked']);

  assert.equal(CG项可查看(已解锁, 'cg-unlocked', false), true);
  assert.equal(CG项可查看(已解锁, 'cg-locked', false), false);
  assert.equal(CG项可查看(已解锁, 'cg-locked', true), true);
  assert.deepEqual([...已解锁], ['cg-unlocked']);
});
