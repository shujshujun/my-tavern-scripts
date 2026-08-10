/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  创建微信消息定位,
  创建微信引用定位,
  定位微信消息,
  解析微信引用展示,
  解析微信AI引用前缀,
  确保群聊指定角色发言,
  计算微信引用跟聊概率,
} = require('../../src/人妻公寓/脚本/游戏逻辑/微信消息引用.ts');
const { 解析微信私聊气泡 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机文本格式.ts');

const 根 = new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url);
const 引用源码 = readFileSync(new URL('./微信消息引用.ts', 根), 'utf8');
const 交互源码 = readFileSync(new URL('./手机/交互/邀约与发消息.ts', 根), 'utf8');
const 节拍源码 = readFileSync(new URL('./手机/节拍引擎.ts', 根), 'utf8');
const 瞬态源码 = readFileSync(new URL('./手机/壳/会话瞬态.ts', 根), 'utf8');
const 渲染源码 = readFileSync(new URL('./手机/壳/渲染/chat.ts', 根), 'utf8');

test('引用使用标识或持久序定位，不依赖数组索引；无稳定键旧消息不可新建引用', () => {
  const 消息 = [
    { 楼: 1, 时: 1, 会话: '姐妹群', 发: '我', 文: '同一句', 标识: 'player-a' },
    { 楼: 1, 时: 1, 会话: '姐妹群', 发: '我', 文: '同一句', 标识: 'player-b' },
    { 楼: 1, 时: 1, 会话: '姐妹群', 发: '对方', 文: '林悦:同一句', 序: 9 },
    { 楼: 1, 时: 1, 会话: '姐妹群', 发: '对方', 文: '夏乔:旧记录' },
  ];
  assert.deepEqual(创建微信消息定位(消息[1]), { 标识: 'player-b' });
  assert.deepEqual(创建微信引用定位(消息, 2), { 序: 9 });
  assert.equal(创建微信引用定位(消息, 3), null);
  assert.equal(定位微信消息([消息[1], 消息[0]], { 标识: 'player-a' }), 消息[0]);
  assert.equal(定位微信消息([消息[2], 消息[0]], { 序: 9 }), 消息[2]);
});

test('撤回或缺失目标只显示原消息已撤回，不从引用关系复活旧原文', () => {
  const 撤回 = { 楼: 2, 时: 2, 会话: '101', 发: '我', 文: '', 类: '撤回', 标识: 'player-a' };
  assert.deepEqual(解析微信引用展示([撤回], { 标识: 'player-a' }, '管理员', '林悦', 36, '101'), {
    发送者: '',
    摘要: '原消息已撤回',
    已撤回: true,
  });
  assert.equal(引用源码.includes('contentSnapshot'), false);
  assert.equal(引用源码.includes('原文快照'), false);
});

test('AI 引用只接受同会话提示历史中的真实发送者与逐字内容', () => {
  const 历史 = [
    { 楼: 3, 时: 3, 序: 21, 会话: '姐妹群', 发: '对方', 文: '林悦:今晚吃什么？' },
    { 楼: 3, 时: 3, 序: 22, 会话: '群', 发: '对方', 文: '林悦:楼道灯坏了' },
  ];
  assert.deepEqual(解析微信AI引用前缀('「引用 林悦: 今晚吃什么？」火锅怎么样？', 历史, '姐妹群', '管理员'), {
    正文: '火锅怎么样？',
    引用: { 序: 21 },
  });
  assert.equal(解析微信AI引用前缀('「引用 夏乔: 今晚吃什么？」我来做', 历史, '姐妹群', '管理员'), null);
  assert.equal(解析微信AI引用前缀('「引用 林悦: 楼道灯坏了」我去看看', 历史, '姐妹群', '管理员'), null);
  assert.equal(解析微信AI引用前缀('「引用 林悦: 今晚吃什么？」', 历史, '姐妹群', '管理员'), null);
});

test('私聊解析器把开头引用块当作原子前缀，不误判成第二说话人', () => {
  assert.deepEqual(解析微信私聊气泡('林悦:「引用 管理员: 今晚见吗」我晚点告诉你。', '林悦', 150, 5), [
    '「引用 管理员: 今晚见吗」我晚点告诉你。',
  ]);
});

test('引用角色必答在前，概率跟聊角色随后出现；缺失角色不增加 AI 请求也能本地兜底', () => {
  const 约束 = {
    必答角色: '林悦',
    跟聊角色: '夏乔',
    必答兜底: '我看见了。',
    跟聊兜底: '这话题我也有兴趣。',
  };
  assert.deepEqual(确保群聊指定角色发言(['周诗雨:先等等', '林悦:我来说'], 约束, 4), [
    '林悦:我来说',
    '夏乔:这话题我也有兴趣。',
  ]);
  assert.deepEqual(确保群聊指定角色发言(['林悦:我来说'], 约束, 4), ['林悦:我来说', '夏乔:这话题我也有兴趣。']);
  assert.deepEqual(确保群聊指定角色发言([], 约束, 4), [
    '林悦:我看见了。',
    '夏乔:这话题我也有兴趣。',
  ], '模型零条合法输出时也必须执行确定性兜底');
  assert.deepEqual(确保群聊指定角色发言([], 约束, 1), ['林悦:我看见了。'], '兜底仍受气泡上限约束');
});

test('跟聊概率始终保持低频：楼务6%~12%，姐妹12%~22%', () => {
  const 低 = [{ 阶段: 0, 好感: 0, 堕落: 0, 婚姻: 100 }];
  const 高 = [{ 阶段: 5, 好感: 100, 堕落: 100, 婚姻: 0 }];
  assert.equal(计算微信引用跟聊概率('群', 低), 0.06);
  assert.equal(计算微信引用跟聊概率('群', 高), 0.12);
  assert.equal(计算微信引用跟聊概率('姐妹群', 低), 0.12);
  assert.equal(计算微信引用跟聊概率('姐妹群', 高), 0.22);
  assert.equal(计算微信引用跟聊概率('姐妹群', []), 0);
});

test('接线包含长按引用、瞬态清理、单次请求、低概率上限与最近十条硬冷却', () => {
  assert.match(渲染源码, /创建微信引用定位/);
  assert.match(渲染源码, /rqp-quote-draft/);
  assert.match(渲染源码, /绑定玩家微信撤回\(气泡, 屏, null, 批次键, 引用定位\)/);
  assert.match(瞬态源码, /清理失效会话引用草稿/);
  assert.match(瞬态源码, /删除会话引用草稿/);
  assert.match(交互源码, /单次请求:\s*true/);
  assert.match(交互源码, /计算微信引用跟聊概率/);
  assert.match(交互源码, /slice\(-10\)/);
  assert.match(交互源码, /引用跟聊:/);
  assert.match(节拍源码, /看见这个话题后自己觉得有兴趣/);
  assert.match(节拍源码, /不是被管理员点名/);
});
