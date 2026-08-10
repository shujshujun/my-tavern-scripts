/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');

let 测试聊天变量 = { _场景: { 房间id: '101' }, _粘滞: null, _赴约: null };
globalThis.getVariables = () => 测试聊天变量;

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 丈夫在楼 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 执行时间推进事务 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');

const 推进 = (data, 方式 = '推进一时段', 当前消息楼 = 20, 当前地点 = '管理员室') =>
  执行时间推进事务(data, {
    方式,
    预期绝对时段: data.系统._绝对时段,
    当前消息楼,
    当前地点,
  });

test('预期时段冲突、坏结局和强事件都失败关闭且深度零变更', () => {
  const 场景们 = [
    {
      data: Schema.parse({ 系统: { _绝对时段: 4 } }),
      请求: { 方式: '推进一时段', 预期绝对时段: 3, 当前消息楼: 20, 当前地点: '管理员室' },
      提示: /已经变化/,
    },
    {
      data: Schema.parse({ 系统: { _绝对时段: 4, _坏结局: '考验失败' } }),
      请求: { 方式: '推进一时段', 预期绝对时段: 4, 当前消息楼: 20, 当前地点: '管理员室' },
      提示: /结局已经锁定/,
    },
    {
      data: Schema.parse({ 系统: { _绝对时段: 4, _待发送事件: '【转折正戏】这一幕还没演' } }),
      请求: { 方式: '推进一时段', 预期绝对时段: 4, 当前消息楼: 20, 当前地点: '管理员室' },
      提示: /强制事件/,
    },
    {
      data: Schema.parse({ 系统: { _绝对时段: 4 } }),
      请求: { 方式: '推进一时段', 预期绝对时段: 4, 当前消息楼: 20, 当前地点: '不存在的地点' },
      提示: /当前地点不能执行/,
    },
  ];

  for (const 场景 of 场景们) {
    const 原始 = structuredClone(场景.data);
    const 结果 = 执行时间推进事务(场景.data, 场景.请求);
    assert.equal(结果.成功, false);
    assert.match(结果.提示, 场景.提示);
    assert.equal(结果.推进时段数, 0);
    assert.deepEqual(结果.起始时间, 结果.结束时间);
    assert.deepEqual(场景.data, 原始);
  }
});

test('任何已有强制 pending 都阻断时间事务且不能被覆盖', () => {
  测试聊天变量 = { _场景: { 房间id: '101' }, _粘滞: null, _赴约: null };
  const data = Schema.parse({ 系统: { _绝对时段: 0, _待发送事件: '【药物首夜】这一幕还没演' } });
  const 原始 = structuredClone(data);
  const 结果 = 推进(data);

  assert.equal(结果.成功, false);
  assert.match(结果.提示, /强制事件/);
  assert.equal(结果.推进时段数, 0);
  assert.deepEqual(data, 原始);
});

test('队列中任何当前事件都按强事件阻断时间推进', () => {
  for (const 待发送事件 of [
    '【转折正戏】这一幕必须先完成',
    '【阶段线路剧情:201:3:2:阳台谈话】这一幕必须先完成',
    '【早饭桌】这一幕必须先完成',
  ]) {
    const data = Schema.parse({ 系统: { _绝对时段: 0, _待发送事件: 待发送事件 } });
    const 原始 = structuredClone(data);
    const 结果 = 推进(data, '推进一时段', 20, '管理员室');

    assert.equal(结果.成功, false);
    assert.match(结果.提示, /强制事件/);
    assert.deepEqual(data, 原始);
  }
});

test('普通推进配合每日深夜睡眠可按最新水位连续推进100格，同一旧水位的第二笔失败关闭', () => {
  测试聊天变量 = { _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null };
  const data = Schema.parse({
    户: {},
    现金: 1_000_000_000,
    胜任度: 100,
    系统: { _绝对时段: 0, _难度: '轻松' },
  });

  const 首笔请求 = { 方式: '推进一时段', 预期绝对时段: 0, 当前消息楼: 20, 当前地点: '管理员室' };
  assert.equal(执行时间推进事务(data, 首笔请求).成功, true);
  assert.equal(data.系统._待发送事件, '');
  const 首笔后 = structuredClone(data);
  assert.equal(执行时间推进事务(data, 首笔请求).成功, false);
  assert.deepEqual(data, 首笔后, '陈旧的同水位请求不得改变已经提交的状态');

  for (let 次 = 1; 次 < 100; 次 += 1) {
    const 方式 = data.系统._绝对时段 % 6 === 5 ? '睡到次日早晨' : '推进一时段';
    const 结果 = 推进(data, 方式);
    assert.equal(结果.成功, true, `第 ${次 + 1} 次顺序推进应成功：${结果.提示}`);
    assert.equal(结果.推进时段数, 1);
    assert.equal(data.系统._待发送事件, '', '例行推进不应制造下一轮待演票');
  }
  assert.equal(data.系统._绝对时段, 100);
});

test('小憩在时间事务内直接结算资源，不生成待演票', () => {
  测试聊天变量 = { _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null };
  const data = Schema.parse({ 系统: { _绝对时段: 2 } });
  data.玩家资源.精力.当前值 = 2;
  data.玩家资源.体力.当前值 = 2;

  const 结果 = 推进(data, '小憩', 20, '管理员室');

  assert.equal(结果.成功, true);
  assert.equal(data.系统._绝对时段, 3);
  assert.equal(data.系统._待发送事件, '');
  assert.ok(data.玩家资源.精力.当前值 > 2);
  assert.ok(data.玩家资源.体力.当前值 > 2);
  assert.equal(data.玩家资源._小憩日, 1);
  assert.match(结果.资源提示.join('\n'), /小憩结束/);
});

test('睡到次日早晨按终点统一惰性结算、刷新丈夫并结算全楼冷落', () => {
  测试聊天变量 = { _场景: { 房间id: '101' }, _粘滞: null, _赴约: null };
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 2;
  节点.妻.婚姻值 = 100;
  节点.妻.堕落值 = 30;
  节点.妻._上次结算楼层 = 0;
  节点.妻._成长账.上次有效成长钟楼 = 0;
  节点.妻._成长账.已结算冷落日 = 0;
  const data = Schema.parse({ 户: { 101: 节点 }, 系统: { _绝对时段: 5 } });

  const 结果 = 推进(data, '睡到次日早晨');

  assert.equal(结果.成功, true);
  assert.equal(结果.推进时段数, 1);
  assert.equal(data.系统._绝对时段, 6);
  assert.ok(Math.abs(data.户['101'].妻.婚姻值 - 98.2) < 1e-9);
  assert.equal(data.户['101'].妻.堕落值, 28);
  assert.equal(data.户['101'].妻._成长账.已结算冷落日, 1);
  assert.equal(data.户['101'].夫.状态, 丈夫在楼(data.户['101'], '101', 6));
});

test('跨经济周期时返回经济提示并完成该期结算', () => {
  测试聊天变量 = { _场景: { 房间id: '101' }, _粘滞: null, _赴约: null };
  const data = Schema.parse({ 现金: 10000, 系统: { _绝对时段: 8, _上次上交期: 0 } });

  const 结果 = 推进(data);

  assert.equal(结果.成功, true);
  assert.equal(data.系统._绝对时段, 9);
  assert.equal(data.系统._上次上交期, 1);
  assert.ok(结果.经济提示.length > 0);
  assert.match(结果.经济提示.join('\n'), /来电/);
});

test('本次经济结算产生坏结局后立即冻结冷落与阶段线路', () => {
  测试聊天变量 = { _场景: { 房间id: '101' }, _粘滞: null, _赴约: null };
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 1;
  节点.妻.堕落值 = 30;
  节点.妻._成长账.上次有效成长钟楼 = 0;
  节点.妻._成长账.已结算冷落日 = 0;
  节点.妻._阶段线路 = {
    目标阶段: 2,
    完成位图: 1,
    活跃节点: 1,
    节点起始楼: 0,
  };
  const data = Schema.parse({
    户: { 101: 节点 },
    现金: 0,
    胜任度: 0,
    系统: { _绝对时段: 17, _上次上交期: 1, _通牒期: 1 },
  });

  const 结果 = 推进(data, '睡到次日早晨');

  assert.equal(结果.成功, true);
  assert.match(data.系统._坏结局, /^考验失败/);
  assert.equal(data.户['101'].妻.堕落值, 30, '终局后不能再结算冷落');
  assert.equal(data.户['101'].妻._阶段线路.活跃节点, 1, '终局后不能再推进线路');
  assert.deepEqual(结果.线路提示, []);
});

test('世界时间真正推进后才广播时段线路并返回线路提示', () => {
  测试聊天变量 = { _场景: { 房间id: '101' }, _粘滞: null, _赴约: null };
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 1;
  节点.妻._阶段线路 = {
    目标阶段: 2,
    完成位图: 1,
    活跃节点: 1,
    节点起始楼: 0,
  };
  const data = Schema.parse({ 户: { 101: 节点 }, 系统: { _绝对时段: 2 } });

  const 结果 = 推进(data);

  assert.equal(结果.成功, true);
  assert.equal(data.系统._绝对时段, 3);
  assert.equal(data.户['101'].妻._阶段线路.活跃节点, 2);
  assert.equal(结果.线路提示.length, 1);
  assert.match(结果.线路提示[0], /关系线索有了新的变化/);
});

test('睡眠可跨多时段且抵达早上时早饭桌优先于入住和普通时间文案', () => {
  测试聊天变量 = { _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null };
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 2;
  const data = Schema.parse({
    户: { 101: 节点 },
    现金: 10000,
    系统: { _绝对时段: 8, _母亲首夜第二幕: true, _上次上交期: 0 },
  });

  const 结果 = 推进(data, '睡到次日早晨', 20, '管理员室');

  assert.equal(结果.成功, true);
  assert.equal(结果.推进时段数, 4);
  assert.equal(结果.起始时间.绝对时段, 8);
  assert.equal(结果.结束时间.绝对时段, 12);
  assert.equal(结果.结束时间.时段, '早上');
  assert.equal(data.系统._母亲首夜第二幕, true, '早饭桌票据尚未成功提交，第二幕 flag 必须保留');
  assert.match(data.系统._待发送事件, /^【事件在场妻:302】【早饭桌】第二天一早/);
  assert.match(data.系统._待发送事件, /地点始终是管理员室/);
  assert.match(data.系统._待发送事件, /妈把早餐送到管理员室/);
  assert.doesNotMatch(data.系统._待发送事件, /在厨房/);
  assert.match(data.系统._待发送事件, /拿筷子的手在抖/);
  assert.doesNotMatch(data.系统._待发送事件, /【时间流逝】|【新住户】/);
});

test('没有早餐时两处睡眠直接结算且不留待演票，302的母亲早餐才进入厨房剧情', () => {
  const 管理员室睡眠 = Schema.parse({ 户: {}, 系统: { _绝对时段: 4 } });
  const 管理员室结果 = 推进(管理员室睡眠, '睡到次日早晨', 20, '管理员室');
  assert.equal(管理员室结果.成功, true);
  assert.equal(管理员室结果.结束时间.时段, '早上');
  assert.equal(管理员室睡眠.系统._待发送事件, '');

  const 三零二睡眠 = Schema.parse({ 户: {}, 系统: { _绝对时段: 4 } });
  const 三零二结果 = 推进(三零二睡眠, '睡到次日早晨', 20, '302');
  assert.equal(三零二结果.成功, true);
  assert.equal(三零二结果.结束时间.时段, '早上');
  assert.equal(三零二睡眠.系统._待发送事件, '');

  const 三零二早餐 = Schema.parse({ 户: {}, 系统: { _绝对时段: 4, _母亲首夜第二幕: true } });
  const 早餐结果 = 推进(三零二早餐, '睡到次日早晨', 20, '302');
  assert.equal(早餐结果.成功, true);
  assert.match(三零二早餐.系统._待发送事件, /^【事件在场妻:302】【早饭桌】第二天一早/);
  assert.match(三零二早餐.系统._待发送事件, /地点始终是302家中的厨房/);
  assert.doesNotMatch(三零二早餐.系统._待发送事件, /送到管理员室/);
});

test('深夜健身不能代替睡眠跨到早晨，失败时世界与奖励零变更', () => {
  测试聊天变量 = { _场景: { 房间id: '健身房' }, _粘滞: null, _赴约: null };
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 2;
  const data = Schema.parse({
    户: { 101: 节点 },
    系统: { _绝对时段: 5, _母亲首夜第二幕: true },
  });

  const 原始 = structuredClone(data);
  const 结果 = 推进(data, '健身', 20, '健身房');

  assert.equal(结果.成功, false);
  assert.match(结果.提示, /深夜.*睡觉.*不能代替睡眠/);
  assert.deepEqual(data, 原始);
});

test('没有更强事件时先做入住检测，合法登场点只留下入住预约', () => {
  测试聊天变量 = { _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null };
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 2;
  const data = Schema.parse({ 户: { 101: 节点 }, 系统: { _绝对时段: 0 } });

  const 结果 = 推进(data, '推进一时段', 33);

  assert.equal(结果.成功, true);
  assert.match(data.系统._待发送事件, /【新住户】/);
  assert.doesNotMatch(data.系统._待发送事件, /【时间流逝】/);
  assert.equal(data.户['201'], undefined, '入住检测只预约，不能在时间事务里提前创建节点');
});

test('候选链中途抛错时原状态保持不变', () => {
  const data = Schema.parse({ 系统: { _绝对时段: 4 } });
  const 原始 = structuredClone(data);
  const 原取变量 = globalThis.getVariables;
  const 原报错 = console.error;
  globalThis.getVariables = () => {
    throw new Error('模拟入住场景读取失败');
  };
  console.error = () => {};

  try {
    const 结果 = 推进(data);
    assert.equal(结果.成功, false);
    assert.match(结果.提示, /世界状态没有改变/);
    assert.deepEqual(data, 原始);
  } finally {
    globalThis.getVariables = 原取变量;
    console.error = 原报错;
  }
});
