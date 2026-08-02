/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const {
  创建微信撤回定位,
  撤回微信玩家消息,
  合并微信撤回状态,
} = require('../../src/人妻公寓/脚本/游戏逻辑/微信消息撤回.ts');
const 手机源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机系统.ts', import.meta.url), 'utf8');

test('只允许定位并撤回玩家自己的普通消息', () => {
  const 消息 = [
    { 楼: 7, 会话: '101', 发: '我', 文: '今晚见', 标识: 'player-1' },
    { 楼: 7, 会话: '101', 发: '对方', 文: '好呀' },
    { 楼: 7, 会话: '101', 发: '我', 文: '通话完成', 类: '通话' },
  ];
  const 定位 = 创建微信撤回定位(消息, 0);
  assert.ok(定位);
  assert.equal(创建微信撤回定位(消息, 1), null);
  assert.equal(创建微信撤回定位(消息, 2), null);

  const 结果 = 撤回微信玩家消息(消息, 定位);
  assert.equal(结果.已撤回, true);
  assert.deepEqual(结果.消息[0], {
    楼: 7,
    会话: '101',
    发: '我',
    文: '',
    类: '撤回',
    标识: 'player-1',
  });
  assert.equal(结果.消息[1], 消息[1]);
});

test('同文消息按稳定标识精确撤回，异步旧快照不会将原文复活', () => {
  const 发送快照 = [
    { 楼: 9, 会话: '姐妹群', 发: '我', 文: '知道了', 标识: 'player-1' },
    { 楼: 9, 会话: '姐妹群', 发: '我', 文: '知道了', 标识: 'player-2' },
  ];
  const 定位 = 创建微信撤回定位(发送快照, 1);
  assert.ok(定位);
  const 已撤回 = 撤回微信玩家消息(发送快照, 定位).消息;
  assert.equal(已撤回[0].类, undefined);
  assert.equal(已撤回[1].类, '撤回');

  const 迟到回复快照 = [...发送快照, { 楼: 9, 会话: '姐妹群', 发: '对方', 文: '林美香:收到' }];
  const 合并后 = 合并微信撤回状态(迟到回复快照, 已撤回);
  assert.equal(合并后[0].文, '知道了');
  assert.equal(合并后[1].类, '撤回');
  assert.equal(合并后[1].文, '');
  assert.equal(合并后[2].文, '林美香:收到');
});

test('手机接入长按和右键菜单，并按发送方显示撤回提示', () => {
  assert.match(手机源, /微信撤回长按毫秒\s*=\s*5\d\d/);
  assert.match(手机源, /addEventListener\('pointerdown'/);
  assert.match(手机源, /addEventListener\('contextmenu'/);
  assert.match(手机源, /m\.发 === '我' \? '你撤回了一条消息' : '她撤回了一条消息'/);
  assert.match(手机源, /尾\.发 === '我' \? '\[你撤回了一条消息\]' : '\[她撤回了一条消息\]'/);
  assert.match(手机源, /m\.类 === '撤回' \|\|\s*m\.发 !== '对方'/);
});

test('三类聊天上下文都排除撤回墓碑', () => {
  assert.match(手机源, /m\.会话 === '姐妹群' && m\.类 !== '撤回'/);
  assert.match(手机源, /m\.会话 === '群' && m\.类 !== '撤回'/);
  assert.match(手机源, /m\.会话 === 会话 && m\.类 !== '撤回'/);
});
