/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  数据库异步写栅栏,
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

test('同毫秒旧持久镜像不得覆盖已经收窄的当前栅栏目标', () => {
  const 栅栏 = new 数据库时间线栅栏(500, 120);
  栅栏.标记('chat-a', 5, '批量回档', 1000, 'token-current');

  // 宿主镜像和 sessionStorage 不是同一原子写；同毫秒第二次标记后，其中一份可能仍停在
  // 更宽的旧目标。恢复时令牌不同不能作为“旧镜像更晚”的证据，必须保持失败关闭。
  const 旧镜像 = {
    版本: 2,
    聊天标识: 'chat-a',
    令牌: 'token-stale',
    目标楼层: 10,
    标记时间: 1000,
    最早校验时间: 1500,
    原因: '删除消息',
  };
  assert.equal(栅栏.恢复(旧镜像, 'chat-a'), true);
  assert.equal(栅栏.读取状态('chat-a')?.目标楼层, 5, '同毫秒歧义只能取更严格的较低目标楼层');
  assert.equal(栅栏.读取状态('chat-a')?.令牌, 'token-current', '当前内存事务令牌不得被无序旧镜像替换');
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

test('无回调保守恢复需要不越过冻结目标的三次稳定采样', () => {
  const 栅栏 = new 数据库时间线栅栏(0, 120);
  const 快照 = 建快照();
  栅栏.标记('chat-a', 10, '删除消息', 0, 'token-a');

  assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, 2500, { 允许无回调恢复: true }), false);
  assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, 2620, { 允许无回调恢复: true }), false);
  assert.equal(栅栏.提交主动快照('chat-a', 快照, 10, 2740, { 允许无回调恢复: true }), true);
});

test('重掷恢复超时后聊天新增楼层，只要数据库仍严格退回冻结目标就能在后台解锁', () => {
  const 栅栏 = new 数据库时间线栅栏(0, 120);
  const 已退回冻结目标的快照 = 建快照();
  栅栏.标记('chat-a', 10, '重掷回合', 0, 'token-a');

  // 重掷等待窗口结束后游戏会继续重演，当前聊天末楼已经增长到 12；这里绝不能把
  // 12 当成数据库的新验证上限，仍须证明四张表都没有越过原冻结点 10。
  assert.equal(
    栅栏.提交主动快照('chat-a', 已退回冻结目标的快照, 12, 2500, { 允许无回调恢复: true }),
    false,
  );
  assert.equal(
    栅栏.提交主动快照('chat-a', 已退回冻结目标的快照, 12, 2620, { 允许无回调恢复: true }),
    false,
  );
  assert.equal(
    栅栏.提交主动快照('chat-a', 已退回冻结目标的快照, 12, 2740, { 允许无回调恢复: true }),
    true,
  );
  assert.equal(栅栏.可读取('chat-a'), true, '后台恢复完成后，后续输入必须重新启用数据库召回');
});

test('可信刷新回调发生后聊天继续增长，稳定复验仍以原冻结目标而非新末楼为边界', () => {
  const 栅栏 = new 数据库时间线栅栏(0, 120);
  const 已退回冻结目标的快照 = 建快照();
  栅栏.标记('chat-a', 10, '切换消息分支', 0, 'token-a');

  assert.equal(栅栏.通知刷新提示('chat-a', 已退回冻结目标的快照, 10, 1000, true), true);
  assert.equal(栅栏.提交主动快照('chat-a', 已退回冻结目标的快照, 12, 1000), false);
  assert.equal(栅栏.提交主动快照('chat-a', 已退回冻结目标的快照, 12, 1120), true);
  assert.equal(栅栏.可读取('chat-a'), true, '切分支仍需可信回调，但不应因之后新增楼层永久锁死');
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

test('回档会立即作废已起跑的数据库写；补偿结算前不得重新开放读取或发起新写', async () => {
  const 栅栏 = new 数据库异步写栅栏();
  const 旧写租约 = 栅栏.捕获('chat-a');
  let 完成旧写;
  const 旧写 = new Promise(resolve => {
    完成旧写 = resolve;
  });
  栅栏.登记(旧写租约, 旧写);

  assert.equal(栅栏.可提交(旧写租约), true);
  栅栏.作废('chat-a');
  assert.equal(栅栏.可提交(旧写租约), false, '回档同步拍必须先让旧租约失效');
  assert.equal(栅栏.有已作废写入('chat-a'), true, '旧 SQL 尚未结算/补偿时，数据库重建不能宣告完成');
  assert.equal(栅栏.可开始新写('chat-a'), false, '数据库仍可能被迟到结果改写时，不得让新时间线继续混写');

  完成旧写();
  await 旧写;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(栅栏.有已作废写入('chat-a'), false);
  assert.equal(栅栏.可开始新写('chat-a'), true);
  assert.equal(栅栏.可提交(栅栏.捕获('chat-a')), true);
});

test('回档接线同时保护脚本 SQL 与数据库官方召回，不只过滤本卡记忆胶囊', () => {
  const 数据库桥 = readFileSync('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', 'utf8');
  const 回合引擎 = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');
  const 标记函数 = 数据库桥.slice(
    数据库桥.indexOf('export function 标记数据库时间线将变更'),
    数据库桥.indexOf('export async function 等待数据库时间线就绪'),
  );
  const 执行恢复 = 数据库桥.slice(
    数据库桥.indexOf('async function 执行数据库时间线恢复'),
    数据库桥.indexOf('function 启动数据库时间线恢复'),
  );
  const 执行回合 = 回合引擎.slice(
    回合引擎.indexOf('export async function 执行回合'),
    回合引擎.indexOf('export async function 重掷回合'),
  );

  assert.match(标记函数, /数据库异步写\.作废\(聊天标识\)/, '删楼前必须同步作废已起跑 SQL');
  assert.match(执行恢复, /数据库异步写\.有已作废写入\(聊天标识\)/, '旧 SQL 与补偿结算前不得开栅栏');
  assert.match(数据库桥, /构造SQLite唯一行失效补偿[\s\S]*?DELETE FROM rq_events WHERE floor_no = \?/);
  assert.match(数据库桥, /构造SQLite唯一行失效补偿[\s\S]*?DELETE FROM rq_social_history WHERE event_key = \?/);
  assert.match(执行回合, /本轮数据库时间线可用\s*=\s*await 等待数据库时间线就绪\(\)/);
  assert.match(
    执行回合,
    /启用数据库规划:\s*本轮数据库已安装\s*&&\s*本轮数据库时间线可用/,
    '栅栏未恢复时，数据库插件自己的官方召回也必须停用',
  );
});
