/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  创建正文幕归属,
  作废正文幕归属,
  应用回合完成正文幕,
  正文幕属于当前房间,
} = require('../../src/人妻公寓/界面/客户端/正文幕归属.ts');

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 游戏入口源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

test('换房立即作废旧幕，走回同名房间也不能复活旧正文', () => {
  let 幕 = 创建正文幕归属('101');
  assert.equal(正文幕属于当前房间(幕, '101'), true);

  幕 = 作废正文幕归属(幕);
  assert.equal(正文幕属于当前房间(幕, '管理员室'), false);
  assert.equal(正文幕属于当前房间(幕, '101'), false, '回到旧房间不得只凭房间名复活旧幕');
});

test('无新正文的时间推进保持旧幕失效；有独立演出或普通回合才绑定当前房间', () => {
  const 旧幕 = 作废正文幕归属(创建正文幕归属('202'));

  const 小憩后 = 应用回合完成正文幕(旧幕, '管理员室', { 更新正文幕: false });
  assert.deepEqual(小憩后, 旧幕);
  assert.equal(正文幕属于当前房间(小憩后, '管理员室'), false);

  const 晨跑演出后 = 应用回合完成正文幕(旧幕, '晨跑公园', { 更新正文幕: true });
  assert.equal(正文幕属于当前房间(晨跑演出后, '晨跑公园'), true);

  const 普通回合后 = 应用回合完成正文幕(旧幕, '管理员室');
  assert.equal(正文幕属于当前房间(普通回合后, '管理员室'), true, '未带选项的既有回合保持原绑定语义');
});

test('App 与时间事务按是否真正产生正文更新幕归属', () => {
  assert.match(App源码, /eventOn\('人妻公寓:回合完成', async \(选项\?[^)]*\) => \{/);
  assert.match(App源码, /应用回合完成正文幕\([\s\S]*?选项[\s\S]*?\)/);
  assert.match(App源码, /if \(下一状态\.房间变化\)[\s\S]*?作废正文幕归属/);

  const 时间段 = 游戏入口源码.slice(
    游戏入口源码.indexOf('function 处理时间推进('),
    游戏入口源码.indexOf('function 处理撤销时间推进()'),
  );
  assert.match(
    时间段,
    /eventEmit\('人妻公寓:回合完成', \{ 更新正文幕: Boolean\(时间反馈草稿\) \}\)/,
    '小憩/普通推进无草稿时不得激活旧正文；晨跑/健身/睡眠有草稿时保留新演出',
  );

  const 撤销段 = 游戏入口源码.slice(
    游戏入口源码.indexOf('function 处理撤销时间推进()'),
    游戏入口源码.indexOf("eventOn('人妻公寓:推进时段'"),
  );
  assert.match(
    撤销段,
    /eventEmit\('人妻公寓:回合完成', \{ 更新正文幕: false \}\)/,
    '撤销只刷新状态，不得把恢复后的其他房间旧正文重新认领为当前幕',
  );
});
