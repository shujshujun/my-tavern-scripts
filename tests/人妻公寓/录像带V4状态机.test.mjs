/* eslint-disable import-x/no-nodejs-modules -- Node-only VTR V4 state-machine regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';
import { 填入本版周线完成夹具 } from './不再留门.fixture.mjs';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema } = require('../../src/人妻公寓/schema.ts');
const { 特殊场景表, 特殊场景锁定状态 } = require('../../src/人妻公寓/stageConfig.ts');
const {
  录像带V4完成ID,
  录像带V4固定日常结果摘要,
  录像带V4周小满承接完成ID,
  录像带V4周小满母带封存键,
  录像带V4周小满丈夫钥匙入盒键,
  录像带V4微信消息键,
  录像带V4承接条件已完成,
  录像带V4录像带可购买,
  录像带V4贞操锁可购买数量,
  登记购买录像带V4,
  使用录像带V4,
  赠送录像带V4贞操锁,
  录像带V4等待已届满,
  录像带V4待发送戴锁线程,
  录像带V4玩家回复可触发同意,
  同步录像带V4微信收据,
  准备录像带V4监控,
  规划录像带V4操作,
  提交录像带V4操作,
  记录录像带V4操作失败,
  安全中断录像带V4,
  完成录像带V4,
} = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4状态.ts');

function 新档(完成承接 = true) {
  const data = Schema.parse({ 户: { 102: {}, 202: {} } });
  data.户['102'].妻.当前阶段 = 5;
  data.户['202'].妻.当前阶段 = 5;
  if (完成承接) {
    data.系统._第二机位.阶段 = '已完成';
    data.系统._已完成特殊场景.push('第二机位', 录像带V4周小满承接完成ID);
    data.系统._特殊场景前置.push('录像带结局:沈母带封存', 录像带V4周小满母带封存键);
    填入本版周线完成夹具(data);
  }
  return data;
}

function 消息(键, 会话, 发 = '对方', 标识 = undefined) {
  return { 楼: 1, 时: 100, 会话, 发, 文: 键, 键, 标识 };
}

function 完成前置(data, 第二把送达绝对时段 = 60) {
  assert.equal(登记购买录像带V4(data).成功, true);
  data.背包.push('录像带');
  assert.equal(使用录像带V4(data).成功, true);
  data.背包.push('男用贞操带', '男用贞操带');
  assert.equal(赠送录像带V4贞操锁(data, '102', 第二把送达绝对时段 - 1).成功, true);
  data.背包.splice(data.背包.indexOf('男用贞操带'), 1);
  assert.equal(赠送录像带V4贞操锁(data, '202', 第二把送达绝对时段).成功, true);
  data.背包.splice(data.背包.indexOf('男用贞操带'), 1);
}

function 完成微信(data) {
  const keys = 录像带V4微信消息键;
  const 全部 = [
    消息(keys['102'].戴锁, '102'),
    消息(keys['102'].同意, '102'),
    消息(keys['202'].戴锁, '202'),
    消息(keys['202'].同意, '202'),
    消息(keys.联合出发, '202'),
  ];
  const 结果 = 同步录像带V4微信收据(data, 全部);
  assert.equal(结果.成功, true);
  assert.equal(data.系统._录像带V4.微信.监控就绪, true);
  return 全部;
}

test('新档V4默认补空，旧录像带完成或运行快照不会被猜测迁移', () => {
  const 空 = Schema.parse({});
  assert.equal(空.系统._录像带V4.版本, 4);
  assert.equal(空.系统._录像带V4.录像带已购买, false);
  assert.equal(空.系统._录像带V4.场景.共享幕次, 0);

  const 旧完成 = Schema.parse({ 系统: { _已完成特殊场景: ['录像带'] } });
  assert.equal(录像带V4录像带可购买(旧完成), false);
  assert.equal(旧完成.系统._录像带V4.录像带已购买, false);

  const 旧运行 = Schema.parse({ 系统: { _特殊场景: { id: '录像带', 阶段: '102-2' } } });
  assert.equal(录像带V4录像带可购买(旧运行), false);
  assert.equal(旧运行.系统._特殊场景.id, '录像带');
  assert.equal(旧运行.系统._录像带V4.场景.状态, '未开始');

  const 热升级旧V9 = Schema.parse({ 现金: 321, 系统: { _数据版本: 9, _绝对时段: 37 } });
  assert.equal(热升级旧V9.系统._数据版本, 9, '新增默认字段不抬数据版本');
  assert.equal(热升级旧V9.系统._录像带V4.版本, 4, '缺少V4节点的旧v9存档由Schema安全补齐');
  assert.equal(热升级旧V9.系统._录像带V4.阶段, '未开始');
  assert.equal(热升级旧V9.现金, 321, '补字段不得重置原有数值');
  assert.equal(热升级旧V9.系统._绝对时段, 37, '补字段不得重置旧档时间');
});

test('阶段和历史字符串不能替代本版承接与母带来源', () => {
  const 只有阶段 = 新档(false);
  只有阶段.户['102'].夫.结局轨道 = '观众席';
  只有阶段.户['202'].夫.结局轨道 = '哑巴亏';
  assert.equal(录像带V4承接条件已完成(只有阶段), false);
  assert.equal(录像带V4录像带可购买(只有阶段), false);

  只有阶段.系统._第二机位.阶段 = '已完成';
  只有阶段.系统._已完成特殊场景.push('第二机位', 录像带V4周小满承接完成ID);
  只有阶段.系统._特殊场景前置.push('录像带结局:沈母带封存', 录像带V4周小满母带封存键);
  assert.equal(录像带V4承接条件已完成(只有阶段), false, '缺少本版照片与录制来源时不得解锁');
  只有阶段.系统._特殊场景前置.push(录像带V4周小满丈夫钥匙入盒键);
  assert.equal(录像带V4承接条件已完成(只有阶段), false, '旧钥匙不能冒充本版来源链');
  填入本版周线完成夹具(只有阶段);
  assert.equal(录像带V4承接条件已完成(只有阶段), true);
});

test('特殊场景配置与锁定提示同样只认两条承接硬凭据，不保留L4旁路', () => {
  const 只有阶段 = 新档(false);
  assert.equal(特殊场景表.录像带.前置(只有阶段), false);
  const 锁定 = 特殊场景锁定状态(只有阶段, '录像带');
  assert.equal(锁定.已解锁, false);
  assert.ok(锁定.缺少.some(项 => 项.includes('第二机位')));
  assert.ok(锁定.缺少.some(项 => 项.includes('不再留门')));
  assert.equal(
    锁定.缺少.some(项 => 项.includes('L4')),
    false,
  );

  const 已完成承接 = 新档();
  assert.equal(特殊场景表.录像带.前置(已完成承接), true);
  assert.deepEqual(特殊场景锁定状态(已完成承接, '录像带'), { 已解锁: true, 缺少: [] });
});

test('购买顺序固定为先录像带、再最多两把锁，且两名妻子必须是不同目标', () => {
  const data = 新档();
  assert.equal(录像带V4承接条件已完成(data), true);
  assert.equal(录像带V4录像带可购买(data), true);
  assert.equal(录像带V4贞操锁可购买数量(data), 0);

  assert.equal(登记购买录像带V4(data).成功, true);
  data.背包.push('录像带');
  assert.equal(录像带V4录像带可购买(data), false);
  assert.equal(录像带V4贞操锁可购买数量(data), 0);
  assert.equal(使用录像带V4(data).成功, true);
  assert.equal(录像带V4贞操锁可购买数量(data), 2);

  data.背包.push('男用贞操带');
  assert.equal(录像带V4贞操锁可购买数量(data), 1);
  assert.equal(赠送录像带V4贞操锁(data, '102', 41).成功, true);
  data.背包.splice(data.背包.indexOf('男用贞操带'), 1);
  assert.equal(data.系统._录像带V4.赠锁['102'].已接收, true);
  assert.equal(赠送录像带V4贞操锁(data, '102', 42).成功, false, '同一妻子不得重复计作第二把');

  data.背包.push('男用贞操带');
  assert.equal(赠送录像带V4贞操锁(data, '202', 42).成功, true);
  data.背包.splice(data.背包.indexOf('男用贞操带'), 1);
  assert.equal(录像带V4贞操锁可购买数量(data), 0);
  assert.equal(data.系统._录像带V4.第二把送达绝对时段, 42);
});

test('第二把送达后排除送达当日，完整经过两个游戏日才开放微信', () => {
  const data = 新档();
  完成前置(data, 62); // 第10日中途；第11、12日为两个完整日，最早第13日开始（78）
  assert.equal(data.系统._录像带V4.微信到期绝对时段, 78);
  assert.equal(录像带V4等待已届满(data, 77), false);
  assert.deepEqual(录像带V4待发送戴锁线程(data, [], 77), []);
  data.系统._录像带V4.阶段 = '微信确认中';
  const 提前校正 = 同步录像带V4微信收据(data, []);
  assert.equal(提前校正.变动, true, '只校正阶段也必须报告可持久变动');
  assert.equal(data.系统._录像带V4.阶段, '等待两日');
  assert.equal(录像带V4等待已届满(data, 78), true);
  assert.deepEqual(录像带V4待发送戴锁线程(data, [], 78), ['102', '202']);
  同步录像带V4微信收据(data, [消息(录像带V4微信消息键['102'].戴锁, '102')]);
  assert.equal(data.系统._录像带V4.阶段, '微信确认中', '真实稳定键出现后才进入微信确认中');
});

test('每条微信必须先有戴锁消息，再有玩家真实回复，之后才可确认知情观看', () => {
  const data = 新档();
  完成前置(data, 60);
  const key = 录像带V4微信消息键['102'].戴锁;
  const lock = 消息(key, '102');
  const before = { 楼: 1, 时: 100, 会话: '102', 发: '我', 文: '提前问', 标识: 'player-before' };
  const after = { 楼: 2, 时: 101, 会话: '102', 发: '我', 文: '那他同意看吗', 标识: 'player-after' };

  assert.equal(录像带V4玩家回复可触发同意([before, lock], '102', [before]), false);
  assert.equal(录像带V4玩家回复可触发同意([lock, after], '102', [after]), true);
  assert.equal(录像带V4玩家回复可触发同意([lock, { ...after, 类: '撤回' }], '102', [{ ...after, 类: '撤回' }]), false);
});

test('微信硬状态只认当前时间线的稳定消息键；联合出发缺失时监控就绪会随回档撤销', () => {
  const data = 新档();
  完成前置(data, 60);
  const k = 录像带V4微信消息键;
  const 四项 = [
    消息(k['102'].戴锁, '102'),
    消息(k['102'].同意, '102'),
    消息(k['202'].戴锁, '202'),
    消息(k['202'].同意, '202'),
  ];
  同步录像带V4微信收据(data, 四项);
  assert.equal(data.系统._录像带V4.微信.两户确认完成, true);
  assert.equal(data.系统._录像带V4.微信.监控就绪, false, '第四项确认不能替代已成功落库的联合通知');

  同步录像带V4微信收据(data, [...四项, 消息(k.联合出发, '102')]);
  assert.equal(data.系统._录像带V4.微信.联合出发已通知, true);
  assert.equal(data.系统._录像带V4.微信.监控就绪, true);

  同步录像带V4微信收据(data, 四项);
  assert.equal(data.系统._录像带V4.微信.联合出发已通知, false);
  assert.equal(data.系统._录像带V4.微信.监控就绪, false, '手机分支回档后不得保留幽灵监控资格');
});

test('监控只能在联合通知之后启动，并建立唯一VTR场次而不伪造旧流程', () => {
  const data = 新档();
  完成前置(data, 60);
  assert.equal(准备录像带V4监控(data, 'vtr-before-notice').成功, false);
  完成微信(data);
  const 结果 = 准备录像带V4监控(data, 'vtr-scene-001');
  assert.equal(结果.成功, true, 结果.提示);
  assert.equal(data.系统._录像带V4.场景.场次标识, 'vtr-scene-001');
  assert.equal(data.系统._录像带V4.场景.状态, '观看中');
  assert.equal(data.系统._录像带V4.场景.共享幕次, 0);
  assert.equal(data.系统._特殊场景.id, '录像带V4');
  assert.equal(data.系统._特殊场景.地点, '302');
  assert.deepEqual(data.系统._特殊场景.演出妻, ['102', '202'], '通用演员字段必须保存门牌而非姓名');
  assert.deepEqual(data.系统._特殊场景.演出夫, ['102', '202'], '通用演员字段必须保存门牌而非姓名');
  assert.equal(data.系统._特殊场景.id === '录像带双承接', false);
  assert.equal(data.背包.includes('录像带'), false, '正式入场后才消费剧情道具');
  assert.equal(准备录像带V4监控(data, 'vtr-scene-002').成功, false, '运行场次不能被第二次点击覆盖');
});

test('102与202共享一个隐藏幕次：切房与下一幕都只推进一次，迟到计划被拒绝', () => {
  const data = 新档();
  完成前置(data, 60);
  完成微信(data);
  assert.equal(准备录像带V4监控(data, 'vtr-shared-001').成功, true);

  const 第一幕 = 规划录像带V4操作(data, { 操作标识: 'start-1', 类型: '开始' });
  assert.equal(第一幕.成功, true);
  assert.equal(第一幕.计划.目标房间, '102');
  assert.equal(第一幕.计划.目标幕次, 1);
  assert.equal(第一幕.计划.需要生成, true);
  assert.equal(提交录像带V4操作(data, 第一幕.计划, { 房间摘要: '102第一幕完成' }).成功, true);
  assert.equal(data.系统._录像带V4.场景.共享幕次, 1);
  assert.equal(data.系统._录像带V4.场景.当前房间, '102');

  const 切房 = 规划录像带V4操作(data, { 操作标识: 'switch-1', 类型: '切房' });
  assert.equal(切房.计划.目标房间, '202');
  assert.equal(切房.计划.目标幕次, 2);
  assert.equal(提交录像带V4操作(data, 切房.计划, { 房间摘要: '202第二幕完成' }).成功, true);
  assert.equal(data.系统._录像带V4.场景.共享幕次, 2, '切房只能把共享幕次推进一次');

  const 下一幕A = 规划录像带V4操作(data, { 操作标识: 'next-3-a', 类型: '下一幕' }).计划;
  const 下一幕迟到副本 = 规划录像带V4操作(data, { 操作标识: 'next-3-b', 类型: '下一幕' }).计划;
  assert.equal(提交录像带V4操作(data, 下一幕A, { 房间摘要: '202第三幕完成' }).成功, true);
  assert.equal(data.系统._录像带V4.场景.共享幕次, 3);
  const 迟到 = 提交录像带V4操作(data, 下一幕迟到副本, { 房间摘要: '迟到结果' });
  assert.equal(迟到.成功, false);
  assert.equal(data.系统._录像带V4.场景.共享幕次, 3, '迟到回调不得二次推进');
  assert.equal(Object.hasOwn(data.系统._录像带V4.场景, '房间摘要'), false, 'VTR滚动摘要不得写进日常可见的主stat');
});

test('安全退出不结算并释放302锁场；录像带退回背包，旧计划失效，下次从第1幕新开', () => {
  const data = 新档();
  完成前置(data, 60);
  完成微信(data);
  assert.equal(准备录像带V4监控(data, 'vtr-abort-001').成功, true);

  let 计划 = 规划录像带V4操作(data, { 操作标识: 'abort-beat-1', 类型: '开始' }).计划;
  assert.equal(提交录像带V4操作(data, 计划).成功, true);
  for (let beat = 2; beat <= 5; beat += 1) {
    计划 = 规划录像带V4操作(data, { 操作标识: `abort-beat-${beat}`, 类型: '下一幕' }).计划;
    assert.equal(提交录像带V4操作(data, 计划).成功, true);
  }
  const 迟到计划 = 规划录像带V4操作(data, { 操作标识: 'late-after-abort', 类型: '下一幕' }).计划;
  const 已提交画面 = [...data.系统._录像带V4.场景.已提交画面键];

  const 中断 = 安全中断录像带V4(data);
  assert.equal(中断.成功, true, 中断.提示);
  assert.equal(data.系统._录像带V4.阶段, '已安全中断');
  assert.equal(data.系统._录像带V4.场景.状态, '已安全中断');
  assert.equal(data.系统._录像带V4.场景.共享幕次, 5, '退出前断点供考古保留');
  assert.deepEqual(data.系统._录像带V4.场景.已提交画面键, 已提交画面);
  assert.deepEqual(data.系统._录像带V4.场景.锁具状态, { 102: 'visually-verified', 202: 'visually-verified' });
  assert.equal(data.系统._特殊场景.id, '', '普通游戏锁场必须释放');
  assert.equal(data.背包.filter(id => id === '录像带').length, 1, '同一盘剧情录像带退回背包');
  assert.equal(data.系统._录像带V4.结果摘要, '');
  assert.equal(data.系统._已完成特殊场景.includes(录像带V4完成ID), false);
  assert.equal(提交录像带V4操作(data, 迟到计划).成功, false, '退出前冻结的迟到计划不得复活');

  const 重开 = 准备录像带V4监控(data, 'vtr-abort-002');
  assert.equal(重开.成功, true, 重开.提示);
  assert.equal(data.系统._录像带V4.场景.场次标识, 'vtr-abort-002');
  assert.equal(data.系统._录像带V4.场景.共享幕次, 0);
  assert.equal(data.系统._录像带V4.场景.当前房间, '102');
  assert.deepEqual(data.系统._录像带V4.场景.已提交画面键, []);
  assert.equal(data.背包.includes('录像带'), false, '重开时再次把退回的同一盘带子投入播放');
});

test('重复、失败和取消不推进；成功幕次驱动正确锁具生命周期并只结算一次', () => {
  const data = 新档();
  完成前置(data, 60);
  完成微信(data);
  准备录像带V4监控(data, 'vtr-lifecycle-001');

  let 计划 = 规划录像带V4操作(data, { 操作标识: 'beat-1', 类型: '开始' }).计划;
  记录录像带V4操作失败(data, 计划, '正文失败');
  assert.equal(data.系统._录像带V4.场景.共享幕次, 0);
  assert.equal(data.系统._录像带V4.场景.失败次数, 1);
  assert.equal(提交录像带V4操作(data, 计划, { 房间摘要: '重试成功' }).成功, true);
  const 重复 = 提交录像带V4操作(data, 计划, { 房间摘要: '重复不得写入' });
  assert.equal(重复.成功, true);
  assert.equal(重复.变动, false);

  for (let beat = 2; beat <= 19; beat += 1) {
    计划 = 规划录像带V4操作(data, {
      操作标识: `beat-${beat}`,
      类型: beat === 19 ? '切房' : '下一幕',
    }).计划;
    assert.equal(提交录像带V4操作(data, 计划, { 房间摘要: `完成第${beat}幕` }).成功, true);
    const 锁 = data.系统._录像带V4.场景.锁具状态;
    if (beat <= 3) assert.deepEqual(锁, { 102: 'locked', 202: 'locked' });
    if (beat === 4) assert.deepEqual(锁, { 102: 'self-unlocked', 202: 'self-unlocked' });
    if (beat >= 5 && beat <= 15) assert.deepEqual(锁, { 102: 'full-tape-playing', 202: 'full-tape-playing' });
    if (beat === 16) assert.deepEqual(锁, { 102: 'husband-completed', 202: 'husband-completed' });
    if (beat === 17) assert.deepEqual(锁, { 102: 'self-relocked', 202: 'self-relocked' });
    if (beat === 18) assert.deepEqual(锁, { 102: 'visually-verified', 202: 'visually-verified' });
    if (beat === 19) assert.deepEqual(锁, { 102: 'settled', 202: 'settled' });
  }
  assert.equal(data.系统._录像带V4.场景.当前房间, '202', '第19幕允许由切房推进到CAM-202');

  const 完成 = 完成录像带V4(data);
  assert.equal(完成.成功, true, 完成.提示);
  assert.equal(data.系统._录像带V4.阶段, '已完成');
  assert.equal(data.系统._录像带V4.结果摘要, 录像带V4固定日常结果摘要);
  assert.equal(data.系统._已完成特殊场景.filter(id => id === 录像带V4完成ID).length, 1);
  assert.equal(data.系统._特殊场景.id, '');
  const 再完成 = 完成录像带V4(data);
  assert.equal(再完成.成功, true);
  assert.equal(再完成.变动, false);
  assert.equal(data.系统._已完成特殊场景.filter(id => id === 录像带V4完成ID).length, 1);
});
