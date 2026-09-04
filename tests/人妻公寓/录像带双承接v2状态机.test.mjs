/* eslint-disable import-x/no-nodejs-modules -- Node-only state-machine regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema } = require('../../src/人妻公寓/schema.ts');
const {
  录像带双承接完成ID,
  开始录像带双承接正式场次,
  解析录像带双承接节点提交,
  提交录像带双承接节点,
  提交录像带双承接剧情阶段,
  请求录像带双承接中断,
} = require('../../src/人妻公寓/脚本/游戏逻辑/录像带双承接状态.ts');

const 路线 = '丈夫结局:录像带双承接';
const 版本 = 2;

function 节点(场次标识, 房间, 轨道, 序号) {
  return { 路线, 版本, 场次标识, 房间, 轨道, 序号 };
}

function 提交(data, 场次标识, 房间, 轨道, 序号) {
  const 结果 = 提交录像带双承接节点(data, 节点(场次标识, 房间, 轨道, 序号));
  assert.equal(结果.成功, true, 结果.提示);
  assert.equal(结果.变动, true, 结果.提示);
  assert.equal(结果.CG, undefined, '旧档兼容节点不得继续产生已退场视觉载荷');
  return 结果;
}

function 推进至核验(data, 场次标识, 房间) {
  提交(data, 场次标识, 房间, '外层', 1);
  提交(data, 场次标识, 房间, '平板', 1);
  提交(data, 场次标识, 房间, '外层', 2);
  提交(data, 场次标识, 房间, '外层', 3);
  for (const 序号 of [2, 3, 4]) 提交(data, 场次标识, 房间, '平板', 序号);
  提交(data, 场次标识, 房间, '外层', 4);
  for (const 序号 of [5, 6, 7, 8, 9]) 提交(data, 场次标识, 房间, '平板', 序号);
  提交(data, 场次标识, 房间, '外层', 5);
  提交(data, 场次标识, 房间, '平板', 10);
  for (const 序号 of [6, 7, 8]) 提交(data, 场次标识, 房间, '外层', 序号);
}

test('V4一旦购买或运行，旧v2启动门与直接节点入口都拒绝并发', () => {
  const data = Schema.parse({});
  data.系统._录像带V4.录像带已购买 = true;
  data.系统._录像带V4.阶段 = '待购赠锁';
  const 启动 = 开始录像带双承接正式场次(data, 'legacy-after-v4');
  assert.equal(启动.成功, false);
  assert.match(启动.提示, /V4/u);
  const 直写 = 提交录像带双承接节点(data, 节点('legacy-after-v4', '102', '外层', 1));
  assert.equal(直写.成功, false);
  assert.match(直写.提示, /V4/u);
  assert.equal(data.系统._录像带双承接.场次标识, '');
  assert.equal(data.系统._录像带双承接.房间['102'].已提交键.length, 0);
});

test('旧档节点严格区分两条兼容轨道并拒绝无版本视觉载荷', () => {
  assert.deepEqual(解析录像带双承接节点提交(节点('scene-a', '102', '平板', 10)), 节点('scene-a', '102', '平板', 10));
  assert.deepEqual(解析录像带双承接节点提交(节点('scene-a', '202', '外层', 9)), 节点('scene-a', '202', '外层', 9));
  assert.equal(解析录像带双承接节点提交({ 路线, 房间: '102', 序号: 5 }), null);
  assert.equal(解析录像带双承接节点提交(节点('scene-a', '102', '外层', 10)), null);
  assert.equal(解析录像带双承接节点提交(节点('', '102', '平板', 1)), null);
});

test('六段旧档剧情保持原子状态推进，最后一段才完成双路交接且全程无旧图', () => {
  const data = Schema.parse({});
  const 场次 = 'vtr-story-001';
  assert.equal(开始录像带双承接正式场次(data, 场次).成功, true);

  for (const [房间, 阶段] of [
    ['102', 1],
    ['102', 2],
    ['102', 3],
    ['202', 1],
    ['202', 2],
    ['202', 3],
  ]) {
    const 结果 = 提交录像带双承接剧情阶段(data, 场次, 房间, 阶段);
    assert.equal(结果.成功, true, 结果.提示);
    assert.equal(结果.CG, undefined);
  }

  assert.equal(data.系统._录像带双承接.状态, '已完成');
  assert.deepEqual(data.系统._已完成特殊场景, [录像带双承接完成ID]);
});

test('剧情批次中任一节点乱序会整批回滚，不留下已显示但未完成的半状态', () => {
  const data = Schema.parse({});
  const 场次 = 'vtr-story-rollback';
  assert.equal(开始录像带双承接正式场次(data, 场次).成功, true);
  const 开始前 = lodash.cloneDeep(data.系统._录像带双承接);
  const 结果 = 提交录像带双承接剧情阶段(data, 场次, '102', 2);
  assert.equal(结果.成功, false);
  assert.equal(结果.CG, undefined);
  assert.deepEqual(data.系统._录像带双承接, 开始前);
  assert.deepEqual(data.系统._已完成特殊场景, []);
});

test('每户 19 个交错节点有头有尾，双路核验后才能分别交接并原子完成', () => {
  const data = Schema.parse({});
  const 场次 = 'vtr-full-001';

  推进至核验(data, 场次, '102');
  assert.equal(data.系统._录像带双承接.房间['102'].硬状态, 'visually-verified');
  assert.equal(data.系统._录像带双承接.状态, '进行中');
  const 过早交接 = 提交录像带双承接节点(data, 节点(场次, '102', '外层', 9));
  assert.equal(过早交接.成功, false);
  assert.match(过早交接.提示, /另一户尚未完成复锁与目视核验/u);

  推进至核验(data, 场次, '202');
  assert.equal(data.系统._录像带双承接.状态, '待双路结算');
  提交(data, 场次, '202', '外层', 9);
  assert.equal(data.系统._录像带双承接.状态, '待双路结算');
  const 完成 = 提交(data, 场次, '102', '外层', 9);
  assert.equal(完成.全场完成, true);
  assert.equal(data.系统._录像带双承接.状态, '已完成');
  assert.equal(data.系统._录像带双承接.房间['102'].平板序号, 10);
  assert.equal(data.系统._录像带双承接.房间['202'].平板序号, 10);
  assert.equal(data.系统._录像带双承接.房间['102'].外层序号, 9);
  assert.equal(data.系统._录像带双承接.房间['202'].外层序号, 9);
  assert.equal(data.系统._已完成特殊场景.filter(id => id === 录像带双承接完成ID).length, 1);
  assert.equal(data.系统._已完成特殊场景.includes('录像带'), false, '正式完成不得伪造旧特殊场景完成事实');
});

test('乱序失败不改状态，重复事件幂等且不会产生旧图', () => {
  const data = Schema.parse({});
  const 场次 = 'vtr-order-001';
  const 初始 = lodash.cloneDeep(data.系统._录像带双承接);
  const 无起点 = 提交录像带双承接节点(data, 节点(场次, '102', '平板', 1));
  assert.equal(无起点.成功, false);
  assert.deepEqual(data.系统._录像带双承接, 初始);

  提交(data, 场次, '102', '外层', 1);
  const 跳第二拍 = 提交录像带双承接节点(data, 节点(场次, '102', '平板', 2));
  assert.equal(跳第二拍.成功, false);
  assert.equal(data.系统._录像带双承接.房间['102'].平板序号, 0);

  const 重复 = 提交录像带双承接节点(data, 节点(场次, '102', '外层', 1));
  assert.equal(重复.成功, true);
  assert.equal(重复.变动, false);
  assert.equal(重复.重复, true);
  assert.equal(重复.CG, undefined);
  assert.equal(data.系统._录像带双承接.房间['102'].已提交键.length, 1);
});

test('两户并发各自保留进度，单户推进不会偷改另一户', () => {
  const data = Schema.parse({});
  const 场次 = 'vtr-parallel-001';
  提交(data, 场次, '102', '外层', 1);
  提交(data, 场次, '102', '平板', 1);
  提交(data, 场次, '202', '外层', 1);
  assert.equal(data.系统._录像带双承接.房间['102'].平板序号, 1);
  assert.equal(data.系统._录像带双承接.房间['102'].外层序号, 1);
  assert.equal(data.系统._录像带双承接.房间['202'].平板序号, 0);
  assert.equal(data.系统._录像带双承接.房间['202'].外层序号, 1);
  提交(data, 场次, '202', '平板', 1);
  assert.equal(data.系统._录像带双承接.房间['102'].最近提交键, '2:102:平板:1');
  assert.equal(data.系统._录像带双承接.房间['202'].最近提交键, '2:202:平板:1');
});

test('解锁后取消、超时或正文失败会冻结播放，强制本人复锁与无接触核验', () => {
  for (const 原因 of ['取消', '超时', '正文失败']) {
    const data = Schema.parse({});
    const 场次 = `vtr-interrupt-${原因}`;
    for (const [轨道, 序号] of [
      ['外层', 1],
      ['平板', 1],
      ['外层', 2],
      ['外层', 3],
      ['平板', 2],
    ]) {
      提交(data, 场次, '102', 轨道, 序号);
    }
    提交(data, 场次, '202', '外层', 1);
    const 中断 = 请求录像带双承接中断(data, 场次, 原因);
    assert.equal(中断.成功, true);
    assert.equal(data.系统._录像带双承接.状态, '待安全收束');
    assert.equal(data.系统._录像带双承接.房间['102'].状态, '待复锁');
    assert.equal(data.系统._录像带双承接.房间['202'].状态, '已安全中断');
    assert.equal(提交录像带双承接节点(data, 节点(场次, '102', '平板', 3)).成功, false);
    提交(data, 场次, '102', '外层', 7);
    assert.equal(data.系统._录像带双承接.房间['102'].硬状态, 'self-relocked');
    提交(data, 场次, '102', '外层', 8);
    assert.equal(data.系统._录像带双承接.状态, '已安全中断');
    assert.equal(data.系统._已完成特殊场景.includes(录像带双承接完成ID), false);

    const 新场次 = `${场次}-retry`;
    提交(data, 新场次, '102', '外层', 1);
    assert.equal(data.系统._录像带双承接.场次标识, 新场次);
    assert.equal(data.系统._录像带双承接.房间['202'].状态, '未开始');
  }
});

test('回档恢复最近已提交硬快照且不依赖任何显示状态', () => {
  const data = Schema.parse({});
  const 场次 = 'vtr-render-001';
  提交(data, 场次, '102', '外层', 1);
  提交(data, 场次, '102', '平板', 1);
  提交(data, 场次, '102', '外层', 2);
  提交(data, 场次, '102', '外层', 3);
  const 已提交快照 = lodash.cloneDeep(data.系统._录像带双承接);
  提交(data, 场次, '102', '平板', 2);
  assert.equal(data.系统._录像带双承接.房间['102'].平板序号, 2);
  data.系统._录像带双承接 = lodash.cloneDeep(已提交快照);
  assert.equal(data.系统._录像带双承接.房间['102'].平板序号, 1);
  assert.equal(data.系统._录像带双承接.房间['102'].硬状态, 'self-unlocked');
});

test('旧档缺少 v2 字段会补空，正在运行或已完成的旧录像带不会自动升级', () => {
  const 基线 = Schema.parse({});
  const 旧档 = lodash.cloneDeep(基线);
  delete 旧档.系统._录像带双承接;
  旧档.系统._特殊场景.id = '录像带';
  旧档.系统._特殊场景.阶段 = '102-2';
  旧档.系统._已完成特殊场景.push('录像带');

  const 继承 = Schema.parse(旧档);
  assert.equal(继承.系统._特殊场景.id, '录像带');
  assert.equal(继承.系统._特殊场景.阶段, '102-2');
  assert.equal(继承.系统._已完成特殊场景.includes('录像带'), true);
  assert.equal(继承.系统._已完成特殊场景.includes(录像带双承接完成ID), false);
  assert.deepEqual(继承.系统._录像带双承接, 基线.系统._录像带双承接);
});

test('旧档路线只由特殊场景事务提交，宿主与客户端不再保留旧视觉事件', () => {
  const 入口 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const 引擎 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  const 场景 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(入口, /人妻公寓:录像带双承接提交节点/u, '不可达的直接节点入口必须移除');
  assert.doesNotMatch(入口, /人妻公寓:录像带双承接中断/u, '不可达的平行中断入口必须移除');
  assert.doesNotMatch(入口, /人妻公寓:录像带双承接状态/u, '没有消费者的死刷新事件必须移除');
  assert.match(入口, /录像带旧档兼容节点由 `推进特殊场景` 在正文成功结算中原子提交/u);
  assert.match(场景, /开始录像带双承接正式场次\(data, 场次标识\)[\s\S]{0,220}data\.背包\.splice\(i, 1\)/u);
  assert.match(场景, /提交录像带双承接剧情阶段\(data, data\.系统\._录像带双承接\.场次标识, 房, 拍\)/u);
  assert.match(引擎, /推进特殊场景\(newStat, 本楼事件\)/u);
  assert.doesNotMatch(引擎, /人妻公寓:录像带双承接CG/u);
  assert.doesNotMatch(入口, /人妻公寓:录像带双承接CG/u);
  assert.match(
    引擎,
    /await 持久转正本轮临时楼\(\)[\s\S]*?for \(const 任务 of 回合提交后任务\)/u,
    '提交后任务必须晚于正文和变量持久转正',
  );
});
