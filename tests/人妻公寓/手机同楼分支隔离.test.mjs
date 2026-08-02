/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 附手机分支锚, 手机记录属于当前分支, 裁手机分支记录, 裁同楼切分支记录 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/手机分支隔离.ts',
);

test('同楼 swipe 后已提交旧分支微信与稳定键一起失去当前分支资格', () => {
  const 旧锚 = { is_user: false, mes: '旧回复', swipe_id: 0, send_date: 1 };
  const 旧分支 = [旧锚];
  const 记录 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '旧分支硬通知', 键: '楼务:T1' }, 旧分支);
  assert.equal(手机记录属于当前分支(记录, 旧分支), true);

  const 新分支 = [{ is_user: false, mes: '新回复', swipe_id: 1, send_date: 1 }];
  assert.equal(手机记录属于当前分支(记录, 新分支), false);
  assert.deepEqual(裁手机分支记录([记录], 新分支), []);
});

test('正常加楼不改变旧记录的分支归属；无锚旧档按兼容边界保留', () => {
  const 锚 = { is_user: false, mes: '回复', swipe_id: 0 };
  const 记录 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '当前消息' }, [锚]);
  assert.equal(手机记录属于当前分支(记录, [锚, { is_user: true, mes: '下一楼' }]), true);
  assert.equal(手机记录属于当前分支({ 楼: 0, 时: 0, 文: '旧档无锚' }, [{ mes: '任意' }]), true);
});

test('明确同楼 swipe 时裁掉该楼无锚自动消息和稳定键，仅保留无法判别的玩家手动消息', () => {
  const 新分支 = [{ is_user: false, mes: '新回复', swipe_id: 1 }];
  const 带锚旧消息 = 附手机分支锚({ 楼: 0, 时: 2, 发: '对方', 文: '带锚旧自动回复' }, 新分支);
  const 记录 = [
    带锚旧消息,
    { 楼: 0, 时: 2, 发: '对方', 文: '无锚旧自动回复' },
    { 楼: 0, 时: 2, 发: '系统', 文: '无锚旧硬通知', 键: '楼务:T1' },
    { 楼: 0, 时: 2, 发: '我', 文: '无法判别的玩家手动消息' },
  ];
  assert.deepEqual(裁同楼切分支记录(记录, 0, 新分支).map(x => x.文), ['无法判别的玩家手动消息']);
});
