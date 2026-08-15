/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 卷轴每页楼数, 末页楼层范围, 更早楼层范围, 合并卷轴页 } = require('../../src/人妻公寓/界面/客户端/卷轴分页.ts');
const {
  手机聊天每页条数,
  手机朋友圈每页条数,
  取聊天显示页,
  取朋友圈显示页,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/分页.ts');

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 微信渲染源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/chat.ts', import.meta.url),
  'utf8',
);
const 朋友圈渲染源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/moments.ts', import.meta.url),
  'utf8',
);

test('千楼正文默认只读取固定末页，向前加载范围连续且最终包含 0 楼', () => {
  assert.equal(卷轴每页楼数, 60);
  assert.deepEqual(末页楼层范围(999), { 起楼: 940, 末楼: 999 });
  assert.deepEqual(更早楼层范围(940), { 起楼: 880, 末楼: 939 });
  assert.deepEqual(更早楼层范围(40), { 起楼: 0, 末楼: 39 });
  assert.equal(更早楼层范围(0), null);
  assert.deepEqual(末页楼层范围(12), { 起楼: 0, 末楼: 12 });
});

test('史册分页只合并显示项，不删除既有楼层或隔离事件', () => {
  const 末页 = [
    { 谁: '玩家', 文本: ['近'], 楼: 998, _排序: 9980000 },
    { 谁: '叙事', 文本: ['近答'], 楼: 999, _排序: 9990000 },
    { 谁: '叙事', 文本: ['隔离事件'], 事件id: 'event-999', _排序: 9990100 },
  ];
  const 更早 = [
    { 谁: '玩家', 文本: ['旧'], 楼: 936, _排序: 9360000 },
    { 谁: '叙事', 文本: ['重复楼应合并'], 楼: 999, _排序: 9990000 },
  ];
  const 结果 = 合并卷轴页(末页, 更早);
  assert.deepEqual(
    结果.map(item => item.事件id ?? item.楼),
    [936, 998, 999, 'event-999'],
  );
  assert.equal(末页.length, 3, '分页不能原地裁剪当前显示数据');
  assert.equal(更早.length, 2, '分页不能原地修改新读取的历史页');
});

test('微信和朋友圈只分页显示，完整原始记录仍保留给引用、未读与回档逻辑', () => {
  const 聊天 = Array.from({ length: 130 }, (_, i) => ({ id: i }));
  const 聊天首页 = 取聊天显示页(聊天);
  assert.equal(手机聊天每页条数, 50);
  assert.deepEqual(
    聊天首页.条目.map(item => item.id),
    Array.from({ length: 50 }, (_, i) => i + 80),
  );
  assert.equal(聊天首页.有更早, true);
  assert.equal(取聊天显示页(聊天, 100).条目[0].id, 30);
  assert.equal(聊天.length, 130, '显示分页不得删除微信原始消息');

  const 朋友圈 = Array.from({ length: 75 }, (_, i) => ({ id: i }));
  const 圈首页 = 取朋友圈显示页(朋友圈);
  assert.equal(手机朋友圈每页条数, 30);
  assert.deepEqual(
    圈首页.条目.map(item => item.id),
    Array.from({ length: 30 }, (_, i) => i),
  );
  assert.equal(取朋友圈显示页(朋友圈, 60).条目.at(-1).id, 59);
  assert.equal(朋友圈.length, 75, '显示分页不得删除朋友圈原始动态');
});

test('正文热路径不再请求 0 到末楼，旧楼只由史册按钮按范围读取', () => {
  assert.doesNotMatch(App源码, /getChatMessages\(`0-\$\{末楼\}`\)/);
  assert.match(App源码, /getChatMessages\(`\$\{范围\.起楼\}-\$\{范围\.末楼\}`\)/);
  assert.match(App源码, /: 末页楼层范围\(末楼\)/);
  assert.match(App源码, /@click="加载更早史册"/);
  assert.match(App源码, /卷轴\.value = 合并卷轴页\(卷轴\.value, 新页\)/);
  assert.match(App源码, /await 取卷轴\(true\)/, '编辑旧楼后应保留玩家已经主动展开的史册范围');
});

test('微信引用仍读取完整库，裂缝考古层不参与普通朋友圈分页', () => {
  assert.match(微信渲染源码, /const 消息页 = 取聊天显示页\(会话消息, 当前页\.展开\)/);
  assert.match(微信渲染源码, /解析微信引用展示\(库\.消息,/);
  assert.match(微信渲染源码, /定位微信消息\(库\.消息,/);

  assert.match(朋友圈渲染源码, /for \(const c of 朋友圈页\.条目\)/);
  assert.match(朋友圈渲染源码, /const 混史:[\s\S]*查考古\(m\)/);
  assert.match(朋友圈渲染源码, /for \(const \{ 门牌: m, 序, 条 \} of 混史\)/);
  assert.doesNotMatch(朋友圈渲染源码, /混史\.(?:slice|splice)\(/, '裂缝关键旧动态不得被普通朋友圈窗口裁掉');
});
