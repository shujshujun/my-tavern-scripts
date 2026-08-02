/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  创建手机时间线租约,
  手机时间线租约仍有效,
  作废当前手机时间线租约世代,
} from '../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts';

test('同一分支正常加楼不会使手机生成租约失效', () => {
  const 锚 = { is_user: false, mes: '第十楼', send_date: 10, swipe_id: 0 };
  const 消息 = Array.from({ length: 10 }, (_, i) => ({ mes: String(i) })).concat(锚);
  const 租约 = 创建手机时间线租约('chat-a', 10, 消息, 4);
  assert.ok(租约);

  消息.push({ is_user: true, mes: '下一轮' });
  assert.equal(手机时间线租约仍有效(租约, 'chat-a', 消息, 4), true);
});

test('回档后即使重新长到同楼，也不能把旧分支迟到图片写回', () => {
  const 旧锚 = { is_user: false, mes: '旧分支' };
  const 消息 = [{ mes: '0' }, 旧锚];
  const 租约 = 创建手机时间线租约('chat-a', 1, 消息, 4);
  assert.ok(租约);

  消息.splice(1, 1, { is_user: false, mes: '新分支' });
  assert.equal(手机时间线租约仍有效(租约, 'chat-a', 消息, 4), false);
});

test('同对象 swipe 改写与切聊天都会使租约失效', () => {
  const 锚 = { is_user: false, mes: '第一候选', swipe_id: 0 };
  const 消息 = [锚];
  const 租约 = 创建手机时间线租约('chat-a', 0, 消息, 4);
  assert.ok(租约);

  锚.mes = '第二候选';
  锚.swipe_id = 1;
  assert.equal(手机时间线租约仍有效(租约, 'chat-a', 消息, 4), false);
  assert.equal(手机时间线租约仍有效(租约, 'chat-b', 消息, 4), false);
});

test('消息楼不变但世界时段推进会使旧手机生成租约失效', () => {
  const 锚 = { is_user: false, mes: '同一正文楼', swipe_id: 0 };
  const 消息 = [锚];
  const 租约 = 创建手机时间线租约('chat-a', 0, 消息, 4);
  assert.ok(租约);

  assert.equal(手机时间线租约仍有效(租约, 'chat-a', 消息, 4), true);
  assert.equal(手机时间线租约仍有效(租约, 'chat-a', 消息, 5), false);
});

test('撤销后再推进到同一时段也不会复活旧手机生成租约', () => {
  const 锚 = { is_user: false, mes: '同一正文楼', swipe_id: 0 };
  const 消息 = [锚];
  const 旧租约 = 创建手机时间线租约('chat-a', 0, 消息, 5);
  assert.ok(旧租约);
  assert.equal(手机时间线租约仍有效(旧租约, 'chat-a', 消息, 5), true);

  作废当前手机时间线租约世代(); // 撤销：t+1 -> t
  assert.equal(手机时间线租约仍有效(旧租约, 'chat-a', 消息, 4), false);

  作废当前手机时间线租约世代(); // 再推进：t -> t+1
  assert.equal(手机时间线租约仍有效(旧租约, 'chat-a', 消息, 5), false);

  const 新租约 = 创建手机时间线租约('chat-a', 0, 消息, 5);
  assert.ok(新租约);
  assert.equal(手机时间线租约仍有效(新租约, 'chat-a', 消息, 5), true);
});
