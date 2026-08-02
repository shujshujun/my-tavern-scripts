/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  数据库快照未越过楼层,
  数据库时间线栅栏,
  解析数据库时间线持久状态,
} from '../../src/人妻公寓/脚本/游戏逻辑/数据库时间线栅栏.ts';

function 建快照({ 事件楼 = 10, 记忆楼 = 10, 承诺楼 = 10, 社交楼 = 10, 标记 = 'A' } = {}) {
  return {
    sheet_events: {
      name: 'RQ_剧情事件',
      content: [
        ['row_id', '楼层', '内容'],
        [1, 事件楼, 标记],
      ],
    },
    sheet_memory: {
      name: 'RQ_人物长期记忆',
      content: [
        ['row_id', '最后楼层', '内容'],
        [1, 记忆楼, 标记],
      ],
    },
    sheet_promises: {
      name: 'RQ_承诺与伏笔',
      content: [
        ['row_id', '最后楼层', '内容'],
        [1, 承诺楼, 标记],
      ],
    },
    sheet_social: {
      name: 'RQ_社交轨迹',
      content: [
        ['row_id', '最后楼层', '内容'],
        [1, 社交楼, 标记],
      ],
    },
  };
}

test('只接受四张表都没有越过回档目标楼层的刷新快照', () => {
  assert.equal(数据库快照未越过楼层(建快照(), 10), true);
  assert.equal(数据库快照未越过楼层(建快照({ 记忆楼: 12 }), 10), false);
  assert.equal(数据库快照未越过楼层({}, 10), false);
});

test('pending 可序列化恢复，跨脚本实例后仍保持失败闭合', () => {
  const 旧实例 = new 数据库时间线栅栏(500, 120);
  const persistent = 旧实例.标记('chat-a', 10, '回档', 1000, 'token-a');
  assert.ok(persistent);
  assert.deepEqual(解析数据库时间线持久状态(persistent, 'chat-a'), persistent);

  const 新实例 = new 数据库时间线栅栏(500, 120);
  assert.equal(新实例.恢复(structuredClone(persistent), 'chat-a'), true);
  assert.equal(新实例.可读取('chat-a'), false);
  assert.equal(新实例.恢复(persistent, 'chat-b'), false);
});

test('同聊天 pending 的目标楼只能收窄，不能被后续删除回调放宽', () => {
  const 栅栏 = new 数据库时间线栅栏(500, 120);
  栅栏.标记('chat-a', 10, '回档', 1000, 'token-a');

  const 放宽尝试 = 栅栏.标记('chat-a', 15, '删除消息', 1100, 'token-b');
  assert.equal(放宽尝试?.目标楼层, 10);
  assert.equal(栅栏.读取状态('chat-a')?.目标楼层, 10);

  const 收窄尝试 = 栅栏.标记('chat-a', 5, '回档', 1200, 'token-c');
  assert.equal(收窄尝试?.目标楼层, 5);
  assert.equal(栅栏.读取状态('chat-a')?.目标楼层, 5);
});

test('唯一早到回调会被缓存，500ms 后主动双读即可恢复', () => {
  const 栅栏 = new 数据库时间线栅栏(500, 120);
  栅栏.标记('chat-a', 10, '回档', 1000, 'token-a');
  const 快照 = 建快照();

  assert.equal(栅栏.通知刷新提示('chat-a', 快照, 10, 1490, true), true);
  assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, 1500), false);
  assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, 1619), false);
  assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, 1620), true);
  assert.equal(栅栏.可读取('chat-a'), true);
});

test('切聊保护窗中的无来源回调不能解锁当前聊天', () => {
  const 栅栏 = new 数据库时间线栅栏(500, 120);
  栅栏.标记('chat-b', 10, '回档', 1000, 'token-b');
  const 快照 = 建快照();

  assert.equal(栅栏.通知刷新提示('chat-b', 快照, 10, 1600, false), false);
  assert.equal(栅栏.提交主动快照('chat-b', 快照, 10, 1600), false);
  assert.equal(栅栏.提交主动快照('chat-b', 快照, 10, 1800), false);
  assert.equal(栅栏.可读取('chat-b'), false);
});

test('两次主动采样之间数据变化时必须从新快照重新计数', () => {
  const 栅栏 = new 数据库时间线栅栏(500, 120);
  const 快照A = 建快照({ 标记: 'A' });
  const 快照B = 建快照({ 标记: 'B' });
  栅栏.标记('chat-a', 10, '回档', 1000, 'token-a');
  栅栏.通知刷新提示('chat-a', 快照A, 10, 1500, true);

  assert.equal(栅栏.提交主动快照('chat-a', 快照A, 10, 1500), false);
  assert.equal(栅栏.提交主动快照('chat-a', 快照B, 10, 1620), false);
  assert.equal(栅栏.通知刷新提示('chat-a', 快照B, 10, 1630, true), true);
  assert.equal(栅栏.提交主动快照('chat-a', 快照B, 10, 1630), false);
  assert.equal(栅栏.提交主动快照('chat-a', 快照B, 10, 1750), true);
});

test('无回调保守恢复需要同目标楼层的三次稳定采样', () => {
  const 栅栏 = new 数据库时间线栅栏(0, 120);
  const 快照 = 建快照();
  栅栏.标记('chat-a', 10, '删除消息', 0, 'token-a');

  assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, 2500, { 允许无回调恢复: true }), false);
  assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, 2620, { 允许无回调恢复: true }), false);
  assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, 2740, { 允许无回调恢复: true }), true);
});

test('同楼层 swipe 禁止无回调放行', () => {
  const 栅栏 = new 数据库时间线栅栏(0, 120);
  const 快照 = 建快照();
  栅栏.标记('chat-a', 10, '切换消息分支', 0, 'token-a');

  for (const now of [2500, 2620, 2740, 3000]) {
    assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, now, { 允许无回调恢复: true }), false);
  }
  assert.equal(栅栏.可读取('chat-a'), false);
});

test('等待期间楼层增长时，即使回调和快照稳定也不能扩大验证目标', () => {
  const 栅栏 = new 数据库时间线栅栏(0, 120);
  const 快照 = 建快照({ 事件楼: 11, 记忆楼: 11, 承诺楼: 11, 社交楼: 11 });
  栅栏.标记('chat-a', 10, '回档', 0, 'token-a');

  assert.equal(栅栏.通知刷新提示('chat-a', 快照, 11, 1000, true), false);
  assert.equal(栅栏.提交主动快照('chat-a', 快照, 11, 1000, { 允许无回调恢复: true }), false);
  assert.equal(栅栏.可读取('chat-a'), false);
});
