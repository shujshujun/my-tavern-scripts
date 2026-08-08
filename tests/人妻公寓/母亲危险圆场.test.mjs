/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 经济配置, 难度表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 接听来电, 经济结算 } = require('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts');

// P5:父亲圆场快照/父亲台词已迁移至 ./手机/交互/父亲通话,源码断言改读新所有者。
const 父亲通话源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/父亲通话.ts', import.meta.url),
  'utf8',
);
const Schema源码 = readFileSync(new URL('../../src/人妻公寓/schema.ts', import.meta.url), 'utf8');
const 标准红线 = 难度表.标准.胜任度红线;
const 期长 = 经济配置.收租周期时段;

function 风闻事件({
  id,
  责任 = 3,
  迹象 = '正式投诉',
  父亲责任 = '未传',
  时段 = 1,
  摘要 = `${id}的公开投诉`,
} = {}) {
  return {
    id,
    类型: '专项测试',
    时段,
    日: 0,
    门牌: '101',
    地点: '楼道',
    摘要,
    目标增量: 3,
    增量: 3,
    迹象,
    状态: '活跃',
    父亲责任,
    胜任责任: 责任,
  };
}

function 建考核({ 胜任度 = 标准红线 + 8, 入列 = true, 事件 = [], 户 = {} } = {}) {
  return Schema.parse({
    户,
    胜任度,
    现金: 0,
    系统: {
      _难度: '标准',
      _母亲入列: 入列,
      _绝对时段: 期长,
      _上次上交期: 0,
      // 本文件只验证圆场；楼务跨期补生另有专项测试，避免住户样本额外制造逾期扣分。
      _管理考核: { 上次生成期: 0 },
      _风闻账: { 最近事件: 事件 },
    },
  });
}

function 推进一考核(data) {
  data.系统._绝对时段 += 期长;
  data.系统._管理考核.活跃任务 = [];
  data.系统._待接来电 = Schema.parse({}).系统._待接来电;
  经济结算(data, 999);
}

test('只有母亲正式入列且周期试算落在红线+1..+9才触发圆场，通牒不新触发', () => {
  for (const { 名, 入列, 试算, 触发 } of [
    { 名: '未入列', 入列: false, 试算: 标准红线 + 5, 触发: false },
    { 名: '危险下沿', 入列: true, 试算: 标准红线 + 1, 触发: true },
    { 名: '危险上沿', 入列: true, 试算: 标准红线 + 9, 触发: true },
    { 名: '已恢复到不满', 入列: true, 试算: 标准红线 + 10, 触发: false },
    { 名: '直接通牒', 入列: true, 试算: 标准红线, 触发: false },
  ]) {
    const event = 风闻事件({ id: `gate-${名}` });
    const data = 建考核({ 胜任度: 试算 + event.胜任责任, 入列, 事件: [event] });

    经济结算(data, 1);

    assert.equal(data.系统._待接来电.母亲圆场.触发, 触发, 名);
    assert.equal(
      data.系统._风闻账.最近事件[0].父亲责任,
      触发 ? '母亲已圆场' : '已计责',
      `${名}的责任状态`,
    );
    assert.equal(data.胜任度, 触发 ? 试算 + event.胜任责任 : 试算, `${名}的实际胜任`);
  }
});

test('同一危险轮次只圆场一次，恢复到红线+10并完成考核后才重置', () => {
  const first = 风闻事件({ id: 'episode-1' });
  const data = 建考核({ 胜任度: 标准红线 + 8, 事件: [first] });

  经济结算(data, 1);
  assert.equal(data.系统._待接来电.母亲圆场.事件ID, first.id);
  assert.equal(data.系统._管理考核.母亲圆场.危险轮次起期, 1);
  assert.equal(data.系统._管理考核.母亲圆场.上次使用期, 1);

  const second = 风闻事件({ id: 'episode-2', 时段: 10 });
  data.系统._风闻账.最近事件.push(second);
  推进一考核(data);
  assert.equal(data.系统._待接来电.母亲圆场.触发, false, '危险轮次内的新责任不能重领圆场');
  assert.equal(data.系统._风闻账.最近事件.find(item => item.id === second.id).父亲责任, '已计责');

  data.胜任度 = 标准红线 + 10;
  assert.equal(data.系统._管理考核.母亲圆场.危险轮次起期, 1, '考核前仅抬高数值不算完整恢复');
  推进一考核(data);
  assert.equal(data.系统._管理考核.母亲圆场.危险轮次起期, -1);

  const third = 风闻事件({ id: 'episode-3', 时段: 20 });
  data.胜任度 = 标准红线 + 8;
  data.系统._风闻账.最近事件.push(third);
  推进一考核(data);
  assert.equal(data.系统._待接来电.母亲圆场.事件ID, third.id, '新危险轮次可以再次圆场');
  assert.equal(data.系统._风闻账.最近事件.find(item => item.id === third.id).父亲责任, '母亲已圆场');
});

test('一次只抵消一个普通、无硬证据且未传父亲的责任，其余责任照常结算', () => {
  const early = 风闻事件({ id: 'ordinary-a', 时段: 1 });
  const late = 风闻事件({ id: 'ordinary-b', 时段: 2 });
  const data = 建考核({
    胜任度: 标准红线 + 11,
    事件: [late, early],
  });

  经济结算(data, 1);

  assert.equal(data.系统._待接来电.母亲圆场.事件ID, early.id, '同级责任按稳定时序只选一条');
  assert.equal(data.系统._风闻账.最近事件.find(item => item.id === early.id).父亲责任, '母亲已圆场');
  assert.equal(data.系统._风闻账.最近事件.find(item => item.id === late.id).父亲责任, '已计责');
  assert.equal(data.胜任度, 标准红线 + 8, '两笔普通责任只免一笔');
});

test('硬证据、严重危机与旧欠租只能获得剧情圆场，实际责任一分不少', () => {
  for (const { 名, event, 胜任度, 期望 } of [
    {
      名: '硬证据',
      event: 风闻事件({ id: 'hard-proof', 责任: 3, 迹象: '硬证据' }),
      胜任度: 标准红线 + 8,
      期望: 标准红线 + 5,
    },
    {
      名: '严重危机',
      event: 风闻事件({ id: 'severe-crisis', 责任: 6 }),
      胜任度: 标准红线 + 11,
      期望: 标准红线 + 5,
    },
  ]) {
    const data = 建考核({ 胜任度, 事件: [event] });
    经济结算(data, 1);

    assert.equal(data.系统._待接来电.母亲圆场.触发, true, 名);
    assert.equal(data.系统._待接来电.母亲圆场.仅剧情, true, `${名}不得免扣`);
    assert.equal(data.胜任度, 期望, `${名}扣分必须保留`);
    assert.equal(data.系统._风闻账.最近事件[0].父亲责任, '已计责');
  }

  const 欠租户 = 创建户节点(0);
  欠租户._欠租笔数 = 1;
  const arrears = 建考核({
    胜任度: 标准红线 + 7,
    户: { 201: 欠租户 },
  });
  经济结算(arrears, 1);

  assert.equal(arrears.系统._待接来电.母亲圆场.触发, true);
  assert.equal(arrears.系统._待接来电.母亲圆场.仅剧情, true);
  assert.equal(arrears.胜任度, 标准红线 + 5, '一笔旧欠租的 -2 不得由母亲返还');
  assert.match(arrears.系统._待接来电.报表, /旧欠租未处理/);
});

test('待接来电冻结圆场事实，接听时原样转入活动父亲通话', () => {
  const event = 风闻事件({ id: 'frozen-cover', 摘要: '楼道里的作风投诉' });
  const data = 建考核({ 胜任度: 标准红线 + 8, 事件: [event] });

  经济结算(data, 1);
  const frozen = structuredClone(data.系统._待接来电.母亲圆场);
  data.系统._风闻账.最近事件[0].摘要 = '后来被改写的摘要';

  assert.deepEqual(接听来电(data, 'cover-call-1'), { 成功: true, 标识: 'cover-call-1' });
  assert.deepEqual(data.系统._父亲通话.母亲圆场, frozen);
  assert.equal(data.系统._待接来电.母亲圆场.触发, false);
  assert.equal(data.系统._父亲通话.母亲圆场.摘要.includes('后来被改写'), false);

  const restored = Schema.parse(JSON.parse(JSON.stringify(data)));
  assert.deepEqual(restored.系统._父亲通话.母亲圆场, frozen, '刷新后仍保留同一圆场快照');
});

test('父亲生成读取冻结圆场快照并区分免责与纯剧情，不扩充第三个通话角色', () => {
  const start = 父亲通话源码.indexOf('type 母亲圆场快照');
  const end = 父亲通话源码.indexOf('/**\n * `待回复.序号`', start);
  const implementation = 父亲通话源码.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(implementation, /母亲圆场/, '父亲台词必须读取活动通话冻结的圆场快照');
  assert.match(implementation, /仅剧情/, '提示必须区分纯剧情圆场与实际免扣');
  assert.match(implementation, /父亲可以说|父亲可以承认|只能由父亲转述/, '父亲应转述母亲已经替玩家说话');
  assert.match(implementation, /没有免除具体责任|对应风闻责任本次已免除/, '两类圆场不能混淆实际结算');
  assert.match(Schema源码, /谁:\s*z\.enum\(\[['"]我['"],\s*['"]父['"]\]\)/, '最小实现保持父子二人通话记录');
});
