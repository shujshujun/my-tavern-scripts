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

test('一次跨过三个账期仍逐期上交，但多项问责只并入同一通待接电话', () => {
  const data = 建101数据();
  data.现金 = 20_000;
  data.胜任度 = 100;
  data.系统._上次上交期 = 0;
  data.系统._绝对时段 = 经济配置.收租周期时段 * 3;
  const 原现金 = data.现金;
  const 月租 = 户静态表['101'].月租;

  const 提示 = 经济结算(data, 999);

  assert.equal(data.系统._上次上交期, 3);
  assert.equal(data.系统._待接来电.期, 1, '首个严重问责创建电话，后续账期只合并事实而不伪造新电话');
  assert.equal(data.户['101']._上次收租期, 3);
  const 每期动态上交 = Math.round((月租 * 难度表.标准.上交比例) / 100) * 100;
  assert.equal(data.现金, 原现金 + 月租 * 3 - 每期动态上交 * 2, '期界新到租金进入下一期，不在同拍立即上交');
  assert.equal(data.系统._管理考核.本期新增应收, 月租);
  assert.equal(提示.filter(行 => 行.includes('【来电】')).length, 1, '跨期快进不能每 1.5 天弹一通新电话');
  assert.match(data.系统._待接来电.报表, /重要|紧急|已逾期/);
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

test('未接紧急危机电话跨普通账期仍保持同一通，不被 1.5 天账期反复覆盖', () => {
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

  const 提示 = 经济结算(data, 999);

  assert.equal(data.系统._待接来电.期, 1, '普通经营期界不得把仍在响的紧急电话改成一通新电话');
  assert.equal(data.系统._待接来电.紧急, true);
  assert.equal(data.系统._待接来电.分数段, '危险');
  assert.match(data.系统._待接来电.报表, /公开危机/);
  assert.doesNotMatch(data.系统._待接来电.报表, /本期没有新增应收/, '静默账期不向既有电话灌入机械周报');
  assert.equal(data.胜任度, 90, '未到下一次真实联络周期前不重复结算漏接责任');
  assert.equal(提示.filter(行 => 行.includes('【来电】')).length, 0);
});

test('旧父亲通话收尾期间排入的危机跨普通账期仍留在同一通，且不算未接', () => {
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
  assert.equal(data.系统._待接来电.期, 1);
  assert.equal(data.系统._待接来电.紧急, true);
  assert.match(data.系统._待接来电.报表, /收尾期间新增的楼内风闻危机/);
  assert.doesNotMatch(data.系统._待接来电.报表, /本期没有新增应收/);
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

test('没有实际失职时静默结算短账期，首次普通父亲联络约一周后才出现', () => {
  const data = Schema.parse({});
  data.胜任度 = 70;
  data.现金 = 0;
  data.系统._上次上交期 = 0;
  data.系统._绝对时段 = 经济配置.收租周期时段;

  const 首期提示 = 经济结算(data, 1);

  assert.equal(data.胜任度, 70);
  assert.equal(data.系统._待接来电.期, -1, '约一天半的内部账期不应自动制造父亲电话');
  assert.equal(首期提示.filter(行 => 行.includes('【来电】')).length, 0);

  const 首次例行期 = Math.ceil(经济配置.父亲例行来电间隔时段 / 经济配置.收租周期时段);
  data.系统._绝对时段 = 经济配置.收租周期时段 * 首次例行期;
  const 周期提示 = 经济结算(data, 2);
  assert.equal(data.系统._待接来电.期, 首次例行期);
  assert.match(data.系统._待接来电.报表, /^例行联络：/);
  assert.doesNotMatch(data.系统._待接来电.报表, /逐项|尚余\d+时段|本期没有新增应收/);
  assert.equal(周期提示.filter(行 => 行.includes('【来电】')).length, 1);
});

test('中后期多户入住后例行来电仍保持稳定周频，不随游戏期号增长而越来越密', () => {
  const 支付正常的中后期门牌 = ['101', '102', '202', '301'];
  const data = Schema.parse({
    户: Object.fromEntries(支付正常的中后期门牌.map(门牌号 => [门牌号, 创建户节点(0)])),
  });
  data.现金 = 100_000;
  data.胜任度 = 80;
  data.系统._上次上交期 = 0;
  // 本测试隔离“入住规模是否加速电话”；楼务严重逾期另有独立即时问责测试。
  data.系统._管理考核.上次生成期 = 20;
  const 来电期 = [];
  for (let 期 = 1; 期 <= 20; 期 += 1) {
    data.系统._绝对时段 = 经济配置.收租周期时段 * 期;
    const 提示 = 经济结算(data, 期);
    if (提示.some(行 => 行.includes('例行微信语音'))) {
      来电期.push(期);
      // 本测试只验证调度频率；模拟玩家已经完成并清理这一通。
      data.系统._待接来电 = {
        期: -1,
        分数段: '',
        报表: '',
        通牒: false,
        紧急: false,
        母亲圆场: { 触发: false, 事件ID: '', 摘要: '', 仅剧情: false },
      };
    }
  }

  assert.deepEqual(来电期, [5, 10, 14, 19]);
  assert.ok(来电期.slice(1).every((期, index) => 期 - 来电期[index] >= 4), '后期不得缩回一至两个账期一通');
});

test('普通待接电话在中间短账期不重复扣漏接，直到下一次真实联络周期才结算一次', () => {
  const data = Schema.parse({
    胜任度: 70,
    系统: {
      _上次上交期: 1,
      _待接来电: { 期: 1, 分数段: '平淡', 报表: '原来那通', 通牒: false, 紧急: false },
      _管理考核: { 上次生成期: 10 },
    },
  });
  for (const 期 of [2, 3, 4]) {
    data.系统._绝对时段 = 经济配置.收租周期时段 * 期;
    const 提示 = 经济结算(data, 期);
    assert.equal(data.胜任度, 70, `第 ${期} 期只是内部结账，不应重复算漏接`);
    assert.equal(data.系统._待接来电.期, 1);
    assert.equal(提示.filter(行 => 行.includes('【来电】')).length, 0);
  }
  data.系统._绝对时段 = 经济配置.收租周期时段 * 5;
  const 周期提示 = 经济结算(data, 5);
  assert.equal(data.胜任度, 70 - 经济配置.未接覆盖扣分);
  assert.equal(data.系统._待接来电.期, 1, '仍是同一通待接电话，只并入新的联络周期事实');
  assert.equal(周期提示.filter(行 => 行.includes('【来电】')).length, 1);
});

test('日常小楼务逾期进入周报，重要或紧急逾期才即时触发父亲问责', () => {
  const 建逾期 = 级别 =>
    Schema.parse({
      胜任度: 70,
      系统: {
        _绝对时段: 经济配置.收租周期时段,
        _上次上交期: 0,
        _管理考核: {
          上次生成期: 1,
          活跃任务: [
            {
              id: `late-${级别}`,
              模板: 级别 === '日常' ? '大堂地面清洁' : '楼梯扶手松动',
              类型: '公共',
              级别,
              地点: 级别 === '日常' ? '大堂' : '楼梯间',
              门牌: '',
              创建时段: 0,
              截止时段: 0,
              逾期已扣: false,
            },
          ],
        },
      },
    });

  const 日常 = 建逾期('日常');
  const 日常提示 = 经济结算(日常, 1);
  assert.equal(日常.胜任度, 68, '日常逾期照常结算责任，只是不立刻打电话');
  assert.equal(日常.系统._待接来电.期, -1);
  assert.equal(日常提示.filter(行 => 行.includes('【来电】')).length, 0);

  const 重要 = 建逾期('重要');
  const 重要提示 = 经济结算(重要, 1);
  assert.equal(重要.胜任度, 66);
  assert.equal(重要.系统._待接来电.期, 1);
  assert.match(重要.系统._待接来电.报表, /楼梯扶手松动|重要|已逾期/);
  assert.equal(重要提示.filter(行 => 行.includes('【来电】')).length, 1);
});

test('同一经营期内重要／紧急楼务跨过截止线也立即来电，日常任务保持静默', () => {
  const 建同期间逾期 = 级别 =>
    Schema.parse({
      胜任度: 70,
      系统: {
        _绝对时段: 4,
        _上次上交期: 0,
        _管理考核: {
          上次生成期: 0,
          活跃任务: [
            {
              id: `same-period-${级别}`,
              模板: 级别 === '日常' ? '大堂地面清洁' : 级别 === '重要' ? '楼梯扶手松动' : '天台排水堵塞',
              类型: '公共',
              级别,
              地点: 级别 === '日常' ? '大堂' : 级别 === '重要' ? '楼梯间' : '天台',
              门牌: '',
              创建时段: 0,
              截止时段: 3,
              逾期已扣: false,
            },
          ],
        },
      },
    });

  const 日常 = 建同期间逾期('日常');
  const 日常提示 = 经济结算(日常, 1);
  assert.equal(日常.胜任度, 68);
  assert.equal(日常.系统._待接来电.期, -1, '日常逾期仍只进入后续周报');
  assert.equal(日常提示.filter(行 => 行.includes('【来电】')).length, 0);

  for (const [级别, 扣分] of [
    ['重要', 4],
    ['紧急', 6],
  ]) {
    const data = 建同期间逾期(级别);
    const 首次提示 = 经济结算(data, 1);
    assert.equal(data.胜任度, 70 - 扣分);
    assert.equal(data.系统._待接来电.期, 0, `${级别}任务不应等到时段9才来电`);
    assert.equal(data.系统._待接来电.紧急, false, '楼务即时问责不得冒充风闻危机标志');
    assert.equal(data.系统._待接来电.通牒, false, '期界外不得提前启动最后通牒');
    assert.match(data.系统._待接来电.报表, 级别 === '重要' ? /楼梯扶手松动.*重要.*已逾期/ : /天台排水堵塞.*紧急.*已逾期/);
    assert.equal(首次提示.filter(行 => 行.includes('【来电】')).length, 1);

    const 首次报表 = data.系统._待接来电.报表;
    const 重复提示 = 经济结算(data, 2);
    assert.equal(data.胜任度, 70 - 扣分, '重复结算不得再次扣同一任务');
    assert.equal(data.系统._待接来电.报表, 首次报表, '重复结算不得重复追加同一逾期事实');
    assert.equal(重复提示.filter(行 => 行.includes('【来电】')).length, 0, '同一通电话不得被伪装成第二次新来电');
  }
});

test('同期间严重逾期并入已有待接电话并保留风闻危机与母亲圆场快照', () => {
  const data = Schema.parse({
    胜任度: 70,
    系统: {
      _绝对时段: 4,
      _上次上交期: 0,
      _待接来电: {
        期: 0,
        分数段: '危险',
        报表: '原有风闻危机',
        通牒: false,
        紧急: true,
        母亲圆场: { 触发: true, 事件ID: 'circle-old', 摘要: '原来那件事', 仅剧情: false },
      },
      _管理考核: {
        上次生成期: 0,
        活跃任务: [
          {
            id: 'same-period-merge',
            模板: '楼梯扶手松动',
            类型: '公共',
            级别: '重要',
            地点: '楼梯间',
            门牌: '',
            创建时段: 0,
            截止时段: 3,
            逾期已扣: false,
          },
        ],
      },
    },
  });

  经济结算(data, 1);

  assert.equal(data.系统._待接来电.期, 0);
  assert.equal(data.系统._待接来电.紧急, true);
  assert.equal(data.系统._待接来电.分数段, '危险');
  assert.deepEqual(data.系统._待接来电.母亲圆场, {
    触发: true,
    事件ID: 'circle-old',
    摘要: '原来那件事',
    仅剧情: false,
  });
  assert.match(data.系统._待接来电.报表, /原有风闻危机/);
  assert.match(data.系统._待接来电.报表, /楼梯扶手松动.*已逾期/);
  assert.equal((data.系统._待接来电.报表.match(/楼梯扶手松动/g) ?? []).length, 1);
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

test('父亲例行联络仍按当前难度红线决定态度，危险段不等于最终通牒', () => {
  const data = Schema.parse({});
  const 首次例行期 = Math.ceil(经济配置.父亲例行来电间隔时段 / 经济配置.收租周期时段);
  data.系统._难度 = '严苛';
  data.胜任度 = 难度表.严苛.胜任度红线 + 5;
  data.系统._上次上交期 = 首次例行期 - 1;
  data.系统._绝对时段 = 经济配置.收租周期时段 * 首次例行期;

  经济结算(data, 3);

  assert.equal(data.系统._待接来电.分数段, '危险');
  assert.equal(data.系统._待接来电.通牒, false);
  assert.match(data.系统._待接来电.报表, /^例行联络：/);
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

test('未接责任只在下一次真实联络周期结算，跌破红线时不得嫁祸给尚未到期楼务', () => {
  const 首次例行期 = Math.ceil(经济配置.父亲例行来电间隔时段 / 经济配置.收租周期时段);
  const data = Schema.parse({
    胜任度: 38,
    系统: {
      _绝对时段: 经济配置.收租周期时段 * 首次例行期,
      _上次上交期: 首次例行期 - 1,
      _待接来电: { 期: 1, 分数段: '不满', 报表: '上期', 通牒: false },
      _管理考核: {
        上次生成期: 首次例行期,
        活跃任务: [
          {
            id: 'not-due',
            模板: '楼梯扶手松动',
            类型: '公共',
            级别: '重要',
            地点: '楼梯间',
            门牌: '',
            创建时段: 8,
            截止时段: 100,
            逾期已扣: false,
          },
        ],
      },
    },
  });

  经济结算(data, 1);

  assert.equal(data.系统._通牒期, 首次例行期);
  assert.match(data.系统._管理考核.通牒原因, /未接|失联/);
  assert.doesNotMatch(data.系统._管理考核.通牒原因, /楼梯扶手|尚余|楼务失职/);

  data.系统._绝对时段 = 经济配置.收租周期时段 * (首次例行期 + 1);
  经济结算(data, 2);
  assert.match(data.系统._坏结局, /失联抗命/);
  assert.doesNotMatch(data.系统._坏结局, /楼务失职/);
});

test('正常例行联络不逐项念已完成楼务，结构化摘要结期后仍会清空', () => {
  const 首次例行期 = Math.ceil(经济配置.父亲例行来电间隔时段 / 经济配置.收租周期时段);
  const data = Schema.parse({
    胜任度: 70,
    系统: {
      _绝对时段: 经济配置.收租周期时段 * 首次例行期,
      _上次上交期: 首次例行期 - 1,
      _管理考核: {
        上次生成期: 首次例行期,
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

  assert.match(data.系统._待接来电.报表, /^例行联络：/);
  assert.doesNotMatch(data.系统._待接来电.报表, /楼梯扶手松动|楼梯间|亲自处理|本期按期完成/);
  assert.deepEqual(data.系统._管理考核.本期完成摘要, []);
});
