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

test('网页刷新把缺失 swipe_id 补成 0 时仍是同一分支；真正切到 swipe 1 仍会隔离', () => {
  const 创建时锚 = { is_user: false, mes: '同一条酒馆回复' };
  const 记录 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '刷新前微信' }, [创建时锚]);

  const 刷新后同分支 = [{ is_user: false, mes: '同一条酒馆回复', swipe_id: 0 }];
  assert.equal(手机记录属于当前分支(记录, 刷新后同分支), true, '缺失 swipe_id 与首分支 0 必须等价');

  const 真正新分支 = [{ is_user: false, mes: '同一条酒馆回复', swipe_id: 1 }];
  assert.equal(手机记录属于当前分支(记录, 真正新分支), false, '真实 swipe 变化仍必须隔离旧微信');
});

test('已发布旧档中 swipe_id=null 的持久签名兼容刷新后的 0，但不兼容真实 swipe 1', () => {
  const 旧档记录 = {
    楼: 0,
    时: 2,
    会话: '101',
    文: '旧版已保存微信',
    锚签名: JSON.stringify([false, '同一条酒馆回复', null, null, null, null]),
  };
  assert.equal(
    手机记录属于当前分支(旧档记录, [{ is_user: false, mes: '同一条酒馆回复', swipe_id: 0 }]),
    true,
  );
  assert.equal(
    手机记录属于当前分支(旧档记录, [{ is_user: false, mes: '同一条酒馆回复', swipe_id: 1 }]),
    false,
  );
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
