/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
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
const { 户静态表, 查道具, 经济配置, 难度表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 使用运作, 要钱, 经济结算 } = require('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts');
const { 丈夫在楼, 丈夫状态推算 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 结算焦点疑心 } = require('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts');

function 建101数据() {
  return Schema.parse({
    户: {
      101: 创建户节点(0),
    },
  });
}

test('外地项目复用冷却为 12 时段：消息加楼不解锁，世界时段到点才恢复', () => {
  assert.equal(经济配置.出差每户冷却时段, 12);

  const data = 建101数据();
  data.户['101'].夫._上次出差楼 = 0;
  data.户['101'].夫._外出至 = 12;
  data.背包.push('外地项目介绍');

  data.系统._绝对时段 = 11;
  const 提前 = 使用运作(data, '外地项目介绍', '101', 999);
  assert.equal(提前.变动, undefined);
  assert.match(提前.提示, /再撮合一次出差太扎眼/);
  assert.equal(data.背包.includes('外地项目介绍'), true);

  data.系统._绝对时段 = 12;
  const 到期 = 使用运作(data, '外地项目介绍', '101', 999);
  assert.equal(到期.变动, true);
  assert.equal(data.户['101'].夫._上次出差楼, 12);
  assert.equal(data.户['101'].夫._外出至, 24);
});

test('首次要钱的 -1 哨兵表示从未使用，绝对时段 0 即可要钱', () => {
  const data = 建101数据();
  data.户['101'].妻.当前阶段 = 4;
  assert.equal(data.户['101'].妻._上次要钱楼层, -1);

  const 原现金 = data.现金;
  const result = 要钱(data, '101', 0);

  assert.equal(result.变动, true);
  assert.doesNotMatch(result.提示, /刚开过口/);
  assert.equal(data.户['101'].妻._上次要钱楼层, 0);
  assert.equal(data.现金, 原现金 + 经济配置.要钱数额);
});

test('钓鱼券的货架与运行文案与 4 时段效果统一为“大半天”', () => {
  const 道具 = 查道具('钓鱼团购券');
  assert.match(道具?.描述 ?? '', /大半天/);
  assert.doesNotMatch(道具?.描述 ?? '', /一日|一天/);

  const data = 建101数据();
  data.背包.push('钓鱼团购券');
  const result = 使用运作(data, '钓鱼团购券', '101', 0);

  assert.equal(result.变动, true);
  assert.match(result.事件 ?? '', /大半天/);
  assert.doesNotMatch(result.事件 ?? '', /一日|一天/);
  assert.equal(data.户['101'].夫._疑心冻结至, 经济配置.钓鱼冻结时段);
});

test('运作窗口采用右开区间：持续 N 时段只覆盖 T 到 T+N-1', () => {
  const 夜班 = 建101数据();
  夜班.系统._绝对时段 = 4;
  夜班.背包.push('夜班内推');
  assert.equal(使用运作(夜班, '夜班内推', '101', 0).变动, true);
  assert.equal(夜班.户['101'].夫._外出至, 4 + 经济配置.夜班外出时段);
  for (const 时 of [4, 5, 6]) assert.equal(丈夫在楼(夜班.户['101'], '101', 时), '外出');
  assert.equal(丈夫在楼(夜班.户['101'], '101', 7), 丈夫状态推算('101', 7), 'T+N 必须回到基础作息，不能多算一档');

  // 另用一个与基础“睡眠”分得开的终点，锁住丈夫状态读取口本身的右开边界。
  夜班.户['101'].夫._外出至 = 11;
  assert.equal(丈夫在楼(夜班.户['101'], '101', 10), '外出');
  assert.equal(丈夫在楼(夜班.户['101'], '101', 11), '睡眠');

  const 出差 = 建101数据();
  出差.背包.push('外地项目介绍');
  assert.equal(使用运作(出差, '外地项目介绍', '101', 0).变动, true);
  assert.equal(丈夫在楼(出差.户['101'], '101', 11), '外出');
  assert.equal(丈夫在楼(出差.户['101'], '101', 12), '在家', '出差冷却开放时，外出窗口也应同时结束');

  const 钓鱼 = 建101数据();
  钓鱼.系统._绝对时段 = 8;
  钓鱼.背包.push('钓鱼团购券');
  assert.equal(使用运作(钓鱼, '钓鱼团购券', '101', 0).变动, true);
  for (const 时 of [8, 9, 10, 11]) 结算焦点疑心(钓鱼.户['101'], '101', 2, 时);
  assert.equal(钓鱼.户['101'].夫.疑心值, 0);
  结算焦点疑心(钓鱼.户['101'], '101', 2, 12);
  assert.equal(钓鱼.户['101'].夫.疑心值, 1, 'T+N 必须解除疑心冻结');
});

test('一次跨过三个账期会逐期上交与生成来电，不只结算最后一期', () => {
  const data = 建101数据();
  data.现金 = 20_000;
  data.胜任度 = 100;
  data.系统._上次上交期 = 0;
  data.系统._绝对时段 = 经济配置.收租周期时段 * 3;
  const 原现金 = data.现金;
  const 月租 = 户静态表['101'].月租;

  const 提示 = 经济结算(data, 999);

  assert.equal(data.系统._上次上交期, 3);
  assert.equal(data.系统._待接来电.期, 3);
  assert.equal(data.户['101']._上次收租期, 3);
  const 每期动态上交 = Math.round((月租 * 难度表.标准.上交比例) / 100) * 100;
  assert.equal(data.现金, 原现金 + 月租 * 3 - 每期动态上交 * 2, '期界新到租金进入下一期，不在同拍立即上交');
  assert.equal(data.系统._管理考核.本期新增应收, 月租);
  assert.equal(提示.filter(行 => 行.includes('【来电】')).length, 3);
});

test('一次跨过多个考核期会逐期生成楼务，并在各自下一期界逐期逾期扣分', () => {
  const data = 建101数据();
  data.现金 = 20_000;
  data.胜任度 = 100;
  data.系统._上次上交期 = 0;
  data.系统._管理考核.上次生成期 = 0;
  data.系统._绝对时段 = 经济配置.收租周期时段 * 3;

  const 提示 = 经济结算(data, 999);
  const 任务 = data.系统._管理考核.活跃任务;

  for (const 期 of [1, 2, 3]) {
    assert.ok(任务.some(item => item.id.startsWith(`管理-${期}-`)), `第 ${期} 期必须有自己的楼务任务`);
  }
  assert.ok(任务.filter(item => item.id.startsWith('管理-1-')).every(item => item.逾期已扣));
  assert.ok(任务.filter(item => item.id.startsWith('管理-2-')).every(item => item.逾期已扣));
  assert.ok(任务.filter(item => item.id.startsWith('管理-3-')).every(item => !item.逾期已扣));
  assert.equal(提示.filter(行 => 行.includes('【楼务逾期】')).length, 2, '跳过的前两期必须分别结算逾期');
});

test('未接紧急危机电话跨期仍保持紧急，并把旧危机报表累计到新一期', () => {
  const data = Schema.parse({
    胜任度: 90,
    系统: {
      _上次上交期: 1,
      _绝对时段: 经济配置.收租周期时段 * 2,
      _待接来电: {
        期: 1,
        分数段: '危险',
        报表: '楼内风闻已经形成公开危机，严重投诉已送达',
        通牒: false,
        紧急: true,
      },
    },
  });

  经济结算(data, 999);

  assert.equal(data.系统._待接来电.期, 2);
  assert.equal(data.系统._待接来电.紧急, true);
  assert.equal(data.系统._待接来电.分数段, '危险');
  assert.match(data.系统._待接来电.报表, /公开危机/);
  assert.match(data.系统._待接来电.报表, /本期没有新增应收/);
});

test('旧父亲通话收尾期间排入的危机跨期不算未接，并累积进下一通', () => {
  const data = Schema.parse({
    胜任度: 90,
    系统: {
      _上次上交期: 1,
      _绝对时段: 经济配置.收租周期时段 * 2,
      _父亲通话: {
        标识: 'closing-call',
        状态: '收尾中',
        期: 1,
        报表: '旧通话原报表',
      },
      _待接来电: {
        期: 1,
        分数段: '危险',
        报表: '收尾期间新增的楼内风闻危机',
        通牒: false,
        紧急: true,
      },
    },
  });

  经济结算(data, 999);

  assert.equal(data.胜任度, 90, '收尾竞态产生的下一通尚无接听机会，不得按未接扣分');
  assert.equal(data.系统._父亲通话.报表, '旧通话原报表', '已经冻结的旧通话收尾不得被新危机改写');
  assert.equal(data.系统._待接来电.紧急, true);
  assert.match(data.系统._待接来电.报表, /收尾期间新增的楼内风闻危机/);
  assert.match(data.系统._待接来电.报表, /本期没有新增应收/);
});

test('纯风闻责任跌破红线时冻结为公开丑闻，并沿用到下一期坏结局', () => {
  const data = Schema.parse({
    胜任度: 41,
    系统: {
      _上次上交期: 0,
      _绝对时段: 经济配置.收租周期时段,
      _风闻账: {
        最近事件: [
          {
            id: 'public-scandal',
            类型: '正式投诉',
            时段: 3,
            摘要: '管理员作风问题形成公开投诉',
            目标增量: 6,
            增量: 6,
            迹象: '多人目击',
            状态: '活跃',
            父亲责任: '未传',
            胜任责任: 6,
          },
        ],
      },
    },
  });

  经济结算(data, 999);

  assert.equal(data.系统._通牒期, 1);
  assert.match(data.系统._管理考核.通牒原因, /公开丑闻/);
  assert.doesNotMatch(data.系统._管理考核.通牒原因, /楼务失职|综合胜任/);

  data.系统._绝对时段 = 经济配置.收租周期时段 * 2;
  经济结算(data, 1000);
  assert.match(data.系统._坏结局, /公开丑闻/);
});

test('母亲相关硬风闻责任跌破红线时冻结为母亲事发', () => {
  const data = Schema.parse({
    胜任度: 41,
    系统: {
      _母亲入列: true,
      _上次上交期: 0,
      _绝对时段: 经济配置.收租周期时段,
      _风闻账: {
        最近事件: [
          {
            id: 'mother-hard-evidence',
            类型: '硬证据',
            时段: 3,
            门牌: '302',
            摘要: '母亲相关事件形成硬证据',
            目标增量: 6,
            增量: 6,
            迹象: '硬证据',
            状态: '活跃',
            父亲责任: '未传',
            胜任责任: 6,
          },
        ],
      },
    },
  });

  经济结算(data, 999);

  assert.equal(data.系统._通牒期, 1);
  assert.match(data.系统._管理考核.通牒原因, /母亲事发/);
});

test('跨期父亲风闻责任按严格期界读取，期界当拍的新责任不得在上一期提前消费', () => {
  const 期长 = 经济配置.收租周期时段;
  const data = Schema.parse({
    胜任度: 41,
    系统: {
      _上次上交期: 0,
      _绝对时段: 期长 * 2,
      _风闻账: {
        最近事件: [
          {
            id: 'boundary-rumor',
            类型: '正式投诉',
            时段: 期长,
            摘要: '新一期起点形成的公开投诉',
            目标增量: 6,
            增量: 6,
            迹象: '多人目击',
            状态: '活跃',
            父亲责任: '未传',
            胜任责任: 6,
          },
        ],
      },
    },
  });

  经济结算(data, 999);

  assert.equal(data.系统._坏结局, '', '时段恰等于一期期界的责任不能被上一期先消费并提前触发坏结局');
  assert.equal(data.系统._通牒期, 2);
  assert.match(data.系统._管理考核.通牒原因, /公开丑闻/);
});

test('没有实际失职时不再按账期固定扣胜任度', () => {
  const data = Schema.parse({});
  data.胜任度 = 70;
  data.现金 = 0;
  data.系统._上次上交期 = 0;
  data.系统._绝对时段 = 经济配置.收租周期时段;

  经济结算(data, 1);

  assert.equal(data.胜任度, 70);
  assert.match(data.系统._待接来电.报表, /没有新增应收/);
});

test('动态上交按新增应收而非实收计算，201欠租仍进入父亲应收账', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 201: 创建户节点(0) } });
  data.现金 = 2000;
  data.胜任度 = 70;
  data.系统._上次上交期 = 1;
  data.系统._绝对时段 = 经济配置.收租周期时段 * 2;
  data.户['101']._上次收租期 = 1;
  data.户['201']._上次收租期 = 1;
  data.户['201']._欠租笔数 = 1;
  data.系统._管理考核.本期新增应收 = 户静态表['101'].月租 + 户静态表['201'].月租;
  data.系统._管理考核.本期实收 = 户静态表['101'].月租;

  经济结算(data, 2);

  assert.equal(data.现金, 2000, '交出1300后，期界新到的101租金1300进入下一期现金账');
  assert.match(data.系统._待接来电.报表, /足额上交 ¥1300/);
  assert.equal(data.户['201']._欠租笔数, 2, '本期边界的新欠租进入下一考核期');
});

test('父亲态度按当前难度红线计算，危险段在最终通牒之前可实际触发', () => {
  const data = Schema.parse({});
  data.系统._难度 = '严苛';
  data.胜任度 = 难度表.严苛.胜任度红线 + 5;
  data.系统._上次上交期 = 0;
  data.系统._绝对时段 = 经济配置.收租周期时段;

  经济结算(data, 3);

  assert.equal(data.系统._待接来电.分数段, '危险');
  assert.equal(data.系统._待接来电.通牒, false);
});

test('跨多期快进按每个期界结算当时逾期，不用终点时间提前触发坏结局', () => {
  const data = Schema.parse({
    胜任度: 36,
    系统: {
      _绝对时段: 经济配置.收租周期时段 * 2,
      _上次上交期: 0,
      _管理考核: {
        活跃任务: [
          {
            id: 'late-between-boundaries',
            模板: '楼梯扶手松动',
            类型: '公共',
            级别: '重要',
            地点: '楼梯间',
            门牌: '',
            创建时段: 9,
            截止时段: 12,
            逾期已扣: false,
          },
        ],
      },
    },
  });

  经济结算(data, 999);

  assert.equal(data.系统._坏结局, '');
  assert.equal(data.系统._通牒期, 2, '任务在第二期界才逾期，通牒也只能从第二期开始');
  assert.equal(data.系统._管理考核.活跃任务[0].逾期已扣, true);
  assert.doesNotMatch(data.系统._管理考核.通牒原因, /尚余/);
});

test('未接父亲来电是跌破红线的真实原因时，不得嫁祸给尚未到期的楼务', () => {
  const data = Schema.parse({
    胜任度: 38,
    系统: {
      _绝对时段: 经济配置.收租周期时段,
      _上次上交期: 0,
      _待接来电: { 期: 0, 分数段: '不满', 报表: '上期', 通牒: false },
      _管理考核: {
        活跃任务: [
          {
            id: 'old-overdue',
            模板: '大堂地面清洁',
            类型: '公共',
            级别: '日常',
            地点: '大堂',
            门牌: '',
            创建时段: 0,
            截止时段: 8,
            逾期已扣: true,
          },
          {
            id: 'not-due',
            模板: '楼梯扶手松动',
            类型: '公共',
            级别: '重要',
            地点: '楼梯间',
            门牌: '',
            创建时段: 8,
            截止时段: 20,
            逾期已扣: false,
          },
        ],
      },
    },
  });

  经济结算(data, 1);

  assert.equal(data.系统._通牒期, 1);
  assert.match(data.系统._管理考核.通牒原因, /未接|失联/);
  assert.doesNotMatch(data.系统._管理考核.通牒原因, /大堂地面|楼梯扶手|尚余|楼务失职/);

  data.系统._绝对时段 = 经济配置.收租周期时段 * 2;
  经济结算(data, 2);
  assert.match(data.系统._坏结局, /失联抗命/);
  assert.doesNotMatch(data.系统._坏结局, /楼务失职/);
});

test('父亲报表在没有更高优先级未结事项时读取结构化的本期按期完成摘要，新期后清空', () => {
  const data = Schema.parse({
    胜任度: 70,
    系统: {
      _绝对时段: 经济配置.收租周期时段,
      _上次上交期: 0,
      _管理考核: {
        本期完成摘要: [
          {
            任务: '楼梯扶手松动',
            类型: '公共',
            级别: '重要',
            地点: '楼梯间',
            门牌: '',
            按期: true,
            方式: '亲自处理',
          },
        ],
      },
    },
  });

  经济结算(data, 3);

  assert.match(data.系统._待接来电.报表, /按期完成/);
  assert.match(data.系统._待接来电.报表, /楼梯扶手松动/);
  assert.match(data.系统._待接来电.报表, /楼梯间/);
  assert.match(data.系统._待接来电.报表, /亲自处理/);
  assert.deepEqual(data.系统._管理考核.本期完成摘要, []);

  data.系统._绝对时段 = 经济配置.收租周期时段 * 2;
  经济结算(data, 4);
  assert.doesNotMatch(data.系统._待接来电.报表, /楼梯扶手松动|本期按期完成/, '上期完成摘要不得泄漏到下期来电');
});
