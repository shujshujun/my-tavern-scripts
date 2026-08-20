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
const 正文卷轴源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/components/正文卷轴.vue', import.meta.url),
  'utf8',
);
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

test('卷轴读取、向前分页与编辑回调冻结共享时间线世代，旧聊天返回零写入新界面', () => {
  const 取卷轴起点 = App源码.indexOf('async function 取卷轴(');
  const 加载起点 = App源码.indexOf('async function 加载更早史册()');
  const 编辑起点 = App源码.indexOf('const 编辑中楼 = ref');
  assert.ok(取卷轴起点 >= 0 && 加载起点 > 取卷轴起点 && 编辑起点 > 加载起点, '必须能定位三条异步链');
  const 取卷轴段 = App源码.slice(取卷轴起点, 加载起点);
  const 加载段 = App源码.slice(加载起点, 编辑起点);
  const 编辑段 = App源码.slice(编辑起点, App源码.indexOf('// ── 界面偏好', 编辑起点));

  assert.match(取卷轴段, /const 请求时间线世代 = 当前时间线切换世代\(\)/, '末页读取冻结共享世代');
  assert.match(
    取卷轴段,
    /if \(请求序号 !== 卷轴请求序号 \|\| 请求时间线世代 !== 当前时间线切换世代\(\)\) return/,
    '末页返回后同时复核请求序号与共享世代',
  );
  const 末页赋值位置 = 取卷轴段.indexOf('卷轴.value = 条目');
  const 末页复核位置 = 取卷轴段.indexOf('请求时间线世代 !== 当前时间线切换世代()');
  assert.ok(末页复核位置 >= 0 && 末页赋值位置 > 末页复核位置, '旧末页不得先写新聊天卷轴');

  assert.match(加载段, /const 请求时间线世代 = 当前时间线切换世代\(\)/, '向前分页冻结共享世代');
  assert.match(
    加载段,
    /if \(请求序号 !== 卷轴请求序号 \|\| 请求时间线世代 !== 当前时间线切换世代\(\)\) return/,
    '旧历史页返回后零合并',
  );
  assert.match(
    加载段,
    /await nextTick\(\);[\s\S]*?if \(请求时间线世代 !== 当前时间线切换世代\(\)\) return;[\s\S]*?容器\.scrollTop/,
    '下一帧滚动锚也必须重新复核世代',
  );

  assert.match(编辑段, /let 编辑开始时间线世代 = -1/, '编辑器记录打开时的共享世代');
  assert.match(编辑段, /编辑开始时间线世代 = 当前时间线切换世代\(\)/, '打开编辑时冻结世代');
  assert.match(
    编辑段,
    /if \(编辑开始时间线世代 !== 当前时间线切换世代\(\)\) \{[\s\S]*?取消编辑\(\);[\s\S]*?return;/,
    '旧分支编辑器在写入前失败关闭',
  );
  assert.match(
    编辑段,
    /await setChatMessages[\s\S]*?if \(保存时间线世代 !== 当前时间线切换世代\(\)\) \{[\s\S]*?return;/,
    '宿主写入返回后旧世代不得刷新新聊天',
  );
  assert.match(
    编辑段,
    /catch \(e\) \{[\s\S]*?if \(保存时间线世代 === 当前时间线切换世代\(\)\)[\s\S]*?错误信息\.value = '改写失败:'/,
    '旧聊天写入失败不得把错误横幅写进新聊天',
  );
});

test('正文改写只在宿主写入成功后退出编辑，失败保留草稿且保存中拒绝重复提交', () => {
  assert.match(App源码, /const 编辑保存中 = ref\(false\)/, '正文改写必须有独立同步保存门');
  const 起点 = App源码.indexOf('async function 存编辑()');
  const 终点 = App源码.indexOf('// ── 界面偏好', 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, '必须能定位正文改写函数');
  const 保存段 = App源码.slice(起点, 终点);
  assert.match(保存段, /if \(编辑保存中\.value\) return;/, '双击保存必须在第一次 await 前失败关闭');
  assert.match(
    保存段,
    /编辑保存中\.value = true;[\s\S]*?await setChatMessages\(\[\{ message_id: 楼, message: 文 \}\], \{ refresh: 'none' \}\);/,
    '必须先占保存门，再调用宿主写入',
  );
  const 写入位置 = 保存段.indexOf('await setChatMessages');
  assert.doesNotMatch(保存段.slice(0, 写入位置), /编辑中楼\.value = null/, '宿主写入成功前不得关闭编辑器');
  assert.match(
    保存段,
    /await setChatMessages[\s\S]*?await 取卷轴\(true\);[\s\S]*?编辑中楼\.value === 楼[\s\S]*?清空编辑状态\(\);/,
    '核心写入及显示刷新成功、且仍是同一草稿后才清编辑状态',
  );
  assert.match(保存段, /catch \(e\) \{[\s\S]*?错误信息\.value = '改写失败:'/, '失败只报错，不清编辑状态');
  assert.match(保存段, /finally \{[\s\S]*?编辑保存中\.value = false;/, '成功失败都必须释放保存门');
  assert.match(App源码, /:editing-saving="编辑保存中"/, '正文卷轴必须获得保存中状态');
  assert.match(App源码, /@cancel-edit="取消编辑"/, '取消入口必须走函数级保存门');
  assert.match(正文卷轴源码, /editingSaving: boolean;/, '正文卷轴声明保存中 prop');
  assert.match(正文卷轴源码, /:disabled="editingSaving"[\s\S]*?class="edit-area"/, '保存中禁用正文编辑框');
  assert.match(
    正文卷轴源码,
    /:disabled="editingSaving \|\| !editingText\.trim\(\)"[\s\S]*?\{\{ editingSaving \? '落笔中…' : '落笔' \}\}/,
    '保存按钮必须禁重复点击并显示进行中状态',
  );
  assert.match(正文卷轴源码, /:disabled="editingSaving" @click="emit\('cancelEdit'\)"/, '保存中不能取消并丢失请求上下文');
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
