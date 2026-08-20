/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
let 聊天变量 = { _场景: { 房间id: '302' }, _粘滞: null, _赴约: null };
globalThis.getVariables = () => 聊天变量;
globalThis.insertOrAssignVariables = () => {};

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 请求晋阶, 可启动母亲药物首夜 } = require('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts');
const {
  上报阶段线路事件,
  线路已完成,
  应冻结堕落,
  提交母亲两幕事件,
} = require('../../src/人妻公寓/脚本/游戏逻辑/阶段线路系统.ts');
const { 执行时间推进事务 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
const {
  事件必须有正文,
  本轮事件可提交,
} = require('../../src/人妻公寓/脚本/游戏逻辑/入住触发门.ts');

function 建待首夜数据(绝对时段 = 4) {
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 2;
  节点.妻.阶段标题 = '动摇';
  节点.妻.堕落值 = 39;
  节点.妻._阶段线路 = {
    目标阶段: 3,
    完成位图: 7,
    活跃节点: 3,
    节点起始楼: 2,
  };
  return Schema.parse({
    户: { 302: 节点 },
    背包: ['安眠药'],
    系统: { _绝对时段: 绝对时段, _母亲入列: true },
  });
}

function 睡到早上(data) {
  return 执行时间推进事务(data, {
    方式: '睡到次日早晨',
    预期绝对时段: data.系统._绝对时段,
    当前消息楼: 20,
    当前地点: '302',
  });
}

test.beforeEach(() => {
  聊天变量 = { _场景: { 房间id: '302' }, _粘滞: null, _赴约: null };
});

test('302 首夜只在存档晚上或深夜且真实场景为 302 时启动，错误条件零变更', () => {
  for (const [绝对时段, 房间id] of [
    [0, '302'],
    [3, '302'],
    [4, '管理员室'],
    [5, '天台'],
  ]) {
    const data = 建待首夜数据(绝对时段);
    聊天变量._场景.房间id = 房间id;
    const 原始 = structuredClone(data);

    assert.equal(可启动母亲药物首夜(data, 房间id), false);
    assert.equal(请求晋阶(data, '302').成功, false);
    assert.deepEqual(data, 原始);
  }

  for (const 绝对时段 of [4, 5]) {
    const data = 建待首夜数据(绝对时段);
    聊天变量._场景.房间id = '302';

    assert.equal(可启动母亲药物首夜(data, '302'), true);
    const 结果 = 请求晋阶(data, '302');

    assert.equal(结果.成功, true);
    assert.equal(结果.动作, '母亲首夜');
    assert.equal(data.户['302'].妻.当前阶段, 2);
    assert.equal(data.户['302'].妻._阶段线路.活跃节点, 3);
    assert.equal(data.户['302'].妻._阶段线路.完成位图, 7);
    assert.equal(data.背包.includes('安眠药'), false);
    assert.match(data.系统._待发送事件, /【事件在场妻:302】【药物首夜】/);
    assert.equal(data.系统._母亲首夜第二幕, false, '首夜票据尚未提交时不能提前开启早餐');

    const 首次结果 = structuredClone(data);
    assert.equal(请求晋阶(data, '302').成功, false);
    assert.deepEqual(data, 首次结果, '重复请求不得再次消耗或改写首夜票据');
  }
});

test('首夜与早餐只在各自票据成功提交后推进状态，普通早晨到达 302 不能伪造节点4', () => {
  const data = 建待首夜数据(4);
  const 启动 = 请求晋阶(data, '302');
  assert.equal(启动.动作, '母亲首夜');
  const 首夜票据 = data.系统._待发送事件;

  assert.deepEqual(提交母亲两幕事件(data, '【时间流逝】不是首夜票据'), []);
  assert.equal(data.系统._母亲首夜第二幕, false);
  assert.equal(data.户['302'].妻._阶段线路.活跃节点, 3);

  提交母亲两幕事件(data, 首夜票据);
  data.系统._待发送事件 = '';
  assert.equal(data.系统._母亲首夜第二幕, true);
  assert.equal(data.户['302'].妻._阶段线路.活跃节点, 3, '首夜只是第一幕，不能提前完成线路');
  assert.equal(应冻结堕落(data.户['302'].妻), 39);

  data.系统._绝对时段 = 6; // 普通早晨地点上报不能再命中专用节点。
  assert.deepEqual(上报阶段线路事件(data, { 类型: '地点', 门牌: '302', 地点: '302', 时段: '早上' }), []);
  assert.equal(data.户['302'].妻._阶段线路.活跃节点, 3);

  data.系统._绝对时段 = 4;
  const 睡眠 = 睡到早上(data);
  assert.equal(睡眠.成功, true);
  assert.match(data.系统._待发送事件, /【事件在场妻:302】【早饭桌】/);
  assert.equal(data.系统._母亲首夜第二幕, true, '早餐排队后仍须保留，直到正文票据成功提交');
  assert.equal(data.户['302'].妻._阶段线路.活跃节点, 3);

  const 早餐票据 = data.系统._待发送事件;
  const 线路消息 = 提交母亲两幕事件(data, 早餐票据);
  data.系统._待发送事件 = '';
  assert.equal(线路消息.length, 1);
  assert.equal(data.系统._母亲首夜第二幕, false);
  assert.equal(data.户['302'].妻.当前阶段, 2);
  assert.equal(data.户['302'].妻._阶段线路.活跃节点, 4);
  assert.equal(data.户['302'].妻._阶段线路.完成位图, 15);
  assert.equal(线路已完成(data.户['302'].妻), true);
  assert.equal(应冻结堕落(data.户['302'].妻), null, '两幕都落地后才解冻 39');

  data.户['302'].妻.堕落值 = 40;
  data.背包.push('安眠药');
  const 晋阶 = 请求晋阶(data, '302');
  assert.equal(晋阶.成功, true);
  assert.equal(晋阶.动作, '母亲两幕后晋阶');
  assert.equal(data.户['302'].妻.当前阶段, 3);
  assert.equal(data.背包.filter(x => x === '安眠药').length, 1, '最终 2→3 不得重复耗药');
  assert.equal(data.系统._待发送事件, '', '最终 2→3 不得重复排首夜或早餐');
});

test('主回合与原生逃生路径都只在冻结票据成功提交分支结算母亲两幕', () => {
  const 回合Source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  const 主提交分支 = 回合Source.slice(
    回合Source.indexOf('const 提交本轮事件 = () =>'),
    回合Source.indexOf('if (静音会议正式运行中'),
  );

  assert.match(主提交分支, /本轮事件可提交/);
  assert.match(主提交分支, /提交母亲两幕事件\(newStat, 本楼事件\)/);

  const indexSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const 原生提交分支 = indexSource.slice(
    indexSource.indexOf('// 2. 只提交 PROMPT_READY'),
    indexSource.indexOf('// 3. 坏结局锁定'),
  );
  assert.match(原生提交分支, /本轮事件可提交/);
  assert.match(原生提交分支, /提交母亲两幕事件\(newData, 本楼事件\)/);
});

test('早餐属于强制正文事件，空正文在固定0楼与原生逃生路径都保留票据', () => {
  const 早餐票据 = '【事件在场妻:302】【早饭桌】第二天一早，妈把早餐摆到桌上。';
  const 冻结票据 = {
    楼层: 28,
    内容: 早餐票据,
    来源: '待发送',
    待发送快照: 早餐票据,
  };

  assert.equal(事件必须有正文(早餐票据), true);
  assert.equal(本轮事件可提交(冻结票据, 早餐票据, 28, false), false, '空正文不能消费早餐票据');
  assert.equal(本轮事件可提交(冻结票据, 早餐票据, 28, true), true, '有效正文仍可正常提交早餐票据');

  const 回合Source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  const 固定零楼回合起点 = 回合Source.indexOf('export async function 执行回合');
  const 固定零楼已清洗位置 = 回合Source.indexOf('const 已清洗正文 =', 固定零楼回合起点);
  const 固定零楼空正文门 = 回合Source.slice(
    固定零楼已清洗位置,
    回合Source.indexOf('const 基础正文 =', 固定零楼已清洗位置),
  );
  assert.match(固定零楼空正文门, /事件必须有正文\(本楼事件\)/);
  assert.match(固定零楼空正文门, /!已清洗正文/);
  assert.match(固定零楼空正文门, /throw new Error/);

  const indexSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const 原生空正文门 = indexSource.slice(
    indexSource.indexOf('const 本轮有效正文 ='),
    indexSource.indexOf('// 手动"重新处理变量"'),
  );
  assert.match(原生空正文门, /事件必须有正文\(本楼事件\)/);
  assert.match(原生空正文门, /!本轮有效正文/);
  assert.match(原生空正文门, /const 失败基底 = _.cloneDeep\(_本轮事件基底\)/);
  assert.match(原生空正文门, /_.set\(新变量, 'stat_data', 失败基底\)/);
  assert.match(原生空正文门, /eventEmit\('人妻公寓:回合失败'/);
  assert.match(原生空正文门, /return;/, '原生逃生路径必须在事件提交分支以前返回');
});

test('所有确定性正戏都要求真实正文，不能用纯标签响应消费票据', () => {
  for (const 票据 of [
    '【特殊场景·录像带·202-1】',
    '【转折正戏】第一夜正式开始',
    '【药物首夜】母亲线第一幕',
    '【早饭桌】第二天的早餐',
    '【破墙】母亲关系突破',
    '【阶段线路剧情:201:3:2:阳台谈话】',
  ]) {
    assert.equal(事件必须有正文(票据), true, 票据);
  }

  const 回合Source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  assert.match(回合Source, /事件必须有正文\(本楼事件\)[\s\S]{0,120}清洗严格正文\(原文\)/);
});

test('v0.80 启动不迁移旧事件；活动、未知与同场票阻塞，远处等待票不挤占当前普通行动', () => {
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /是单一时间流逝事件|清理旧版电话软事件|遗留时间票|有旧电话软事件/);
  assert.match(
    source,
    /const 活动剧情 = 读取活动场景剧情\(data\);[\s\S]{0,260}if \(活动剧情\)[\s\S]{0,520}const 等待剧情 = 读取队首场景剧情\(data\.系统\._待发送事件\);/,
    '已经提交的活动事务必须阻止新行动改写，等待队首则继续按场景判定',
  );
  assert.match(
    source,
    /if \(等待剧情\.目标场景 === null\)[\s\S]{0,360}场景剧情目标匹配\(等待剧情\.目标场景, 读场景\(\)\.房间id \?\? null\)[\s\S]{0,260}人妻公寓:继续场景剧情[\s\S]{0,520}void 执行回合\(行动\.trim\(\)\)/,
    '未知地点失败关闭、同场票接管正文；明确在远处的票会保留并放行当前普通回合',
  );
  assert.match(source, /【转折正戏】\|【药物首夜】\|【早饭桌】/, '早餐尚未提交时也必须阻止其他角色挤入晋阶正戏');
});
