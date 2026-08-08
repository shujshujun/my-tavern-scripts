/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const {
  生成本期管理任务,
  结算管理任务逾期,
  列出地点管理任务,
  管理任务选项,
  管理任务摘要,
  预检管理任务,
  结算管理任务,
  结算粉刷公共维护任务,
} = require('../../src/人妻公寓/脚本/游戏逻辑/管理任务系统.ts');

function 建数据({ 难度 = '标准', 户数 = 5 } = {}) {
  const 门牌 = ['101', '102', '201', '202', '301'].slice(0, 户数);
  const 户 = Object.fromEntries(门牌.map((id, index) => [id, 创建户节点(index)]));
  const data = Schema.parse({ 户 });
  data.系统._难度 = 难度;
  data.系统._绝对时段 = 12;
  data.现金 = 1000;
  data.胜任度 = 50;
  data.玩家资源.精力.当前值 = 5;
  data.玩家资源.体力.当前值 = 4;
  return data;
}

test('同一期生成确定、不会重掷，且最多三项与同地点不重复', () => {
  const data = 建数据({ 难度: '严苛', 户数: 5 });
  const 首次 = structuredClone(生成本期管理任务(data, 4, 12));
  const 活跃快照 = structuredClone(data.系统._管理考核.活跃任务);
  const 再次 = structuredClone(生成本期管理任务(data, 4, 99));

  assert.deepEqual(再次, []);
  assert.deepEqual(data.系统._管理考核.活跃任务, 活跃快照);
  assert.equal(首次.length, 3);
  assert.equal(new Set(首次.map(task => task.地点)).size, 首次.length);
  assert.ok(首次.every(task => task.创建时段 === 12));

  const 同输入 = 建数据({ 难度: '严苛', 户数: 5 });
  assert.deepEqual(生成本期管理任务(同输入, 4, 12), 首次);
});

test('首次生成本期任务保留已有正向账，只有生成水位真正跨期才初始化', () => {
  const 首次 = 建数据({ 难度: '标准', 户数: 2 });
  首次.系统._管理考核.本期正向 = 5;
  assert.equal(首次.系统._管理考核.上次生成期, -1);

  生成本期管理任务(首次, 4, 12);

  assert.equal(首次.系统._管理考核.本期正向, 5, '首次建立当前期任务不能清掉同一期其他来源的正向账');

  const 换期 = 建数据({ 难度: '标准', 户数: 2 });
  换期.系统._管理考核.上次生成期 = 3;
  换期.系统._管理考核.本期正向 = 5;

  生成本期管理任务(换期, 4, 12);

  assert.equal(换期.系统._管理考核.本期正向, 0, '从已知旧期进入新期时才初始化正向账');
});

test('每期报修数量服从难度与入住规模上限，同时各档确实可达到正式设计容量', () => {
  const 场景 = [
    { 难度: '轻松', 户数: 5, 上限: 1 },
    { 难度: '标准', 户数: 4, 上限: 1 },
    { 难度: '标准', 户数: 5, 上限: 2 },
    { 难度: '严苛', 户数: 5, 上限: 2 },
  ];

  for (const 配置 of 场景) {
    let 实际最大 = 0;
    for (let 期号 = 0; 期号 < 64; 期号 += 1) {
      const data = 建数据(配置);
      const tasks = 生成本期管理任务(data, 期号, 期号 * 9);
      const 报修数 = tasks.filter(task => task.类型 === '报修').length;
      实际最大 = Math.max(实际最大, 报修数);
      assert.ok(报修数 <= 配置.上限, `${配置.难度}/${配置.户数}户第${期号}期报修超过${配置.上限}件`);
    }
    assert.equal(实际最大, 配置.上限, `${配置.难度}/${配置.户数}户应保留达到报修容量的确定性期样本`);
  }
});

test('每个任务恰好两个方案，地点查询与安全摘要均为只读', () => {
  const data = 建数据();
  const tasks = 生成本期管理任务(data, 2, 12);
  const before = structuredClone(data);
  for (const task of tasks) {
    assert.equal(管理任务选项(task).length, 2);
    assert.deepEqual(
      列出地点管理任务(data, task.地点).map(item => item.id),
      [task.id],
    );
    assert.match(管理任务摘要(task), new RegExp(task.地点));
  }
  assert.deepEqual(data, before);
});

test('预检不改状态，并检查地点、工具与资源', () => {
  const data = 建数据({ 难度: '标准', 户数: 2 });
  data.系统._管理考核.上次生成期 = 1;
  data.系统._管理考核.活跃任务 = [
    {
      id: 'repair-1',
      模板: '水龙头漏水',
      类型: '报修',
      级别: '日常',
      地点: '101',
      门牌: '101',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
  ];
  const before = structuredClone(data);
  assert.match(预检管理任务(data, 'repair-1', '自己维修', '102').提示, /101/);
  assert.match(预检管理任务(data, 'repair-1', '自己维修', '101').提示, /工具箱/);
  assert.deepEqual(data, before);

  data.背包.push('工具箱');
  const readyBefore = structuredClone(data);
  assert.equal(预检管理任务(data, 'repair-1', '自己维修', '101').成功, true);
  assert.deepEqual(data, readyBefore);
});

test('成功结算只扣一次资源、写一次票据并返回行动演出', () => {
  const data = 建数据({ 户数: 2 });
  data.背包.push('工具箱');
  data.系统._管理考核.活跃任务 = [
    {
      id: 'repair-once',
      模板: '水龙头漏水',
      类型: '报修',
      级别: '重要',
      地点: '101',
      门牌: '101',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
  ];

  const first = 结算管理任务(data, 'repair-once', '自己维修', '101');
  assert.equal(first.成功, true);
  assert.equal(first.变动, true);
  assert.match(first.行动, /自己维修/);
  assert.match(first.事件, /楼务任务完成/);
  assert.equal(data.玩家资源.体力.当前值, 3);
  assert.equal(data.胜任度, 52);
  assert.deepEqual(data.系统._管理考核.完成票据, ['repair-once']);
  assert.deepEqual(data.系统._管理考核.本期完成摘要, [
    {
      任务: '水龙头漏水',
      类型: '报修',
      级别: '重要',
      地点: '101',
      门牌: '101',
      按期: true,
      方式: '自己维修',
    },
  ]);
  assert.equal(data.系统._管理考核.活跃任务.length, 0);

  const second = 结算管理任务(data, 'repair-once', '自己维修', '101');
  assert.equal(second.成功, true);
  assert.equal(second.变动, false);
  assert.equal(data.玩家资源.体力.当前值, 3);
  assert.equal(data.胜任度, 52);
  assert.deepEqual(data.系统._管理考核.完成票据, ['repair-once']);
  assert.equal(data.系统._管理考核.本期完成摘要.length, 1, '重复提交不得重复记录完成摘要');
});

test('本期任务正向总增益封顶为六点', () => {
  const data = 建数据({ 户数: 2 });
  data.系统._管理考核.本期正向 = 5;
  data.系统._管理考核.活跃任务 = [
    {
      id: 'cap-1',
      模板: '大堂地面清洁',
      类型: '公共',
      级别: '紧急',
      地点: '大堂',
      门牌: '',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
  ];
  const result = 结算管理任务(data, 'cap-1', '亲自处理', '大堂');
  assert.equal(result.胜任变化, 1);
  assert.equal(data.胜任度, 51);
  assert.equal(data.系统._管理考核.本期正向, 6);
});

test('接近或达到胜任100时只返回并记入实际增加值', () => {
  const 接近上限 = 建数据({ 户数: 2 });
  接近上限.背包.push('工具箱');
  接近上限.胜任度 = 99;
  接近上限.系统._管理考核.本期正向 = 2;
  接近上限.系统._管理考核.活跃任务 = [
    {
      id: 'near-100',
      模板: '暖气阀漏水',
      类型: '报修',
      级别: '紧急',
      地点: '101',
      门牌: '101',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
  ];

  const first = 结算管理任务(接近上限, 'near-100', '自己维修', '101');
  assert.equal(first.胜任变化, 1);
  assert.equal(接近上限.胜任度, 100);
  assert.equal(接近上限.系统._管理考核.本期正向, 3);
  assert.match(first.提示, /胜任度 \+1/);

  const 已满 = 建数据({ 户数: 2 });
  已满.胜任度 = 100;
  已满.系统._管理考核.本期正向 = 2;
  已满.系统._管理考核.活跃任务 = [
    {
      id: 'at-100',
      模板: '楼梯扶手松动',
      类型: '公共',
      级别: '重要',
      地点: '楼梯间',
      门牌: '',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
  ];

  const second = 结算管理任务(已满, 'at-100', '亲自处理', '楼梯间');
  assert.equal(second.胜任变化, 0);
  assert.equal(已满.胜任度, 100);
  assert.equal(已满.系统._管理考核.本期正向, 2);
});

test('粉刷优先原子完成一条公共维护任务，不额外消耗资源且按实际余量加分', () => {
  const data = 建数据({ 户数: 2 });
  data.胜任度 = 99;
  data.系统._管理考核.本期正向 = 5;
  data.系统._管理考核.活跃任务 = [
    {
      id: 'paint-daily',
      模板: '大堂地面清洁',
      类型: '公共',
      级别: '日常',
      地点: '大堂',
      门牌: '',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
    {
      id: 'paint-urgent',
      模板: '天台排水堵塞',
      类型: '公共',
      级别: '紧急',
      地点: '天台',
      门牌: '',
      创建时段: 10,
      截止时段: 14,
      逾期已扣: false,
    },
    {
      id: 'paint-repair',
      模板: '水龙头漏水',
      类型: '报修',
      级别: '重要',
      地点: '101',
      门牌: '101',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
  ];
  const 原现金 = data.现金;
  const 原体力 = data.玩家资源.体力.当前值;
  const 原精力 = data.玩家资源.精力.当前值;

  const result = 结算粉刷公共维护任务(data);

  assert.deepEqual(
    { 命中: result.命中, 任务id: result.任务id, 胜任变化: result.胜任变化, 逾期: result.逾期 },
    { 命中: true, 任务id: 'paint-urgent', 胜任变化: 1, 逾期: false },
  );
  assert.equal(data.胜任度, 100);
  assert.equal(data.系统._管理考核.本期正向, 6);
  assert.equal(data.现金, 原现金);
  assert.equal(data.玩家资源.体力.当前值, 原体力);
  assert.equal(data.玩家资源.精力.当前值, 原精力);
  assert.deepEqual(data.系统._管理考核.完成票据, ['paint-urgent']);
  assert.equal(data.系统._管理考核.本期完成摘要[0].方式, '粉刷翻新');
  assert.deepEqual(
    data.系统._管理考核.活跃任务.map(task => task.id),
    ['paint-daily', 'paint-repair'],
  );
});

test('粉刷补办逾期公共任务不加分且只扣一次；没有公共任务时原样返回未命中', () => {
  const data = 建数据({ 户数: 2 });
  data.系统._绝对时段 = 20;
  data.系统._管理考核.活跃任务 = [
    {
      id: 'paint-late',
      模板: '楼梯扶手松动',
      类型: '公共',
      级别: '重要',
      地点: '楼梯间',
      门牌: '',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
    {
      id: 'repair-remains',
      模板: '水龙头漏水',
      类型: '报修',
      级别: '日常',
      地点: '101',
      门牌: '101',
      创建时段: 10,
      截止时段: 30,
      逾期已扣: false,
    },
  ];

  const first = 结算粉刷公共维护任务(data);
  assert.equal(first.命中, true);
  assert.equal(first.逾期, true);
  assert.equal(first.胜任变化, 0);
  assert.equal(data.胜任度, 46);
  assert.equal(data.系统._管理考核.本期完成摘要[0].按期, false);

  const 完成后 = structuredClone(data);
  const second = 结算粉刷公共维护任务(data);
  assert.deepEqual(second, {
    命中: false,
    任务id: '',
    胜任变化: 0,
    逾期: false,
    提示: '当前没有可由粉刷翻新完成的公共维护任务。',
  });
  assert.deepEqual(data, 完成后);
});

test('逾期只扣一次，补办成功不再加分', () => {
  const data = 建数据({ 户数: 2 });
  data.系统._绝对时段 = 20;
  data.系统._管理考核.活跃任务 = [
    {
      id: 'late-1',
      模板: '楼梯扶手松动',
      类型: '公共',
      级别: '重要',
      地点: '楼梯间',
      门牌: '',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
    {
      id: 'late-complaint',
      模板: '噪音投诉',
      类型: '投诉',
      级别: '日常',
      地点: '管理员室',
      门牌: '101',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
  ];

  assert.equal(结算管理任务逾期(data, 20).扣分, 5);
  assert.equal(data.胜任度, 45);
  assert.equal(结算管理任务逾期(data, 21).扣分, 0);
  assert.equal(data.胜任度, 45);

  const result = 结算管理任务(data, 'late-1', '亲自处理', '楼梯间');
  assert.equal(result.成功, true);
  assert.equal(result.胜任变化, 0);
  assert.match(result.提示, /补办/);
  assert.equal(data.胜任度, 45);
});

test('三个逾期补办任务继续占满槽位，不会被新考核期自动挤掉', () => {
  const data = 建数据({ 难度: '严苛', 户数: 5 });
  data.系统._管理考核.上次生成期 = 0;
  data.系统._管理考核.活跃任务 = ['大堂', '楼梯间', '天台'].map((地点, index) => ({
    id: `late-slot-${index}`,
    模板: `${地点}补办事项`,
    类型: '公共',
    级别: '日常',
    地点,
    门牌: '',
    创建时段: 0,
    截止时段: 8,
    逾期已扣: true,
  }));
  const before = structuredClone(data.系统._管理考核.活跃任务);

  assert.deepEqual(生成本期管理任务(data, 1, 9), []);
  assert.deepEqual(data.系统._管理考核.活跃任务, before);
});

test('投诉逾期按重要度记分：日常-1、重要-4、紧急-6', () => {
  const data = 建数据({ 户数: 2 });
  data.系统._绝对时段 = 20;
  data.系统._管理考核.活跃任务 = ['日常', '重要', '紧急'].map((级别, index) => ({
    id: `complaint-${index}`,
    模板: '噪音投诉',
    类型: '投诉',
    级别,
    地点: '管理员室',
    门牌: '101',
    创建时段: 10,
    截止时段: 18,
    逾期已扣: false,
  }));

  const result = 结算管理任务逾期(data, 20);

  assert.equal(result.扣分, 11);
  assert.equal(data.胜任度, 39);
});

test('危机衍生的紧急投诉逾期不再叠扣，仍照常转补办(2026-08-04 拍板:危机不双重扣罚)', () => {
  const data = 建数据({ 户数: 2 });
  data.系统._绝对时段 = 20;
  data.系统._风闻账.最近事件.push({
    id: '危机:噪音',
    类型: '风闻危机',
    时段: 10,
    日: 1,
    门牌: '101',
    地点: '管理员室',
    摘要: '公开丑闻',
    目标增量: 0,
    增量: 0,
    迹象: '硬证据',
    状态: '活跃',
    父亲责任: '已计责',
    胜任责任: 8,
  });
  data.系统._管理考核.活跃任务 = [
    {
      id: 'crisis-task',
      模板: '公开丑闻投诉',
      类型: '投诉',
      级别: '紧急',
      地点: '管理员室',
      门牌: '101',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
      来源事件: '危机:噪音',
      公开摘要: '',
    },
    {
      id: 'normal-task',
      模板: '噪音投诉',
      类型: '投诉',
      级别: '紧急',
      地点: '管理员室',
      门牌: '101',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
      来源事件: '',
      公开摘要: '',
    },
  ];

  const result = 结算管理任务逾期(data, 20);

  assert.equal(result.扣分, 6, '危机触发时已扣过-8，衍生任务逾期不再叠扣；普通紧急投诉照扣6');
  assert.equal(data.胜任度, 44);
  assert.equal(
    data.系统._管理考核.活跃任务.every(task => task.逾期已扣),
    true,
    '免扣不等于免办：危机衍生任务仍转补办',
  );
});

test('投诉正文硬事实包含报事门牌、姓名与具体事项，并禁止补写隐私指控', () => {
  const data = 建数据({ 户数: 2 });
  const task = {
    id: 'complaint-facts',
    模板: '噪音投诉',
    类型: '投诉',
    级别: '日常',
    地点: '管理员室',
    门牌: '101',
    创建时段: 10,
    截止时段: 18,
    逾期已扣: false,
  };
  data.系统._管理考核.活跃任务 = [task];
  const 妻名 = 户静态表['101'].妻名;

  const summary = 管理任务摘要(task);
  const check = 预检管理任务(data, task.id, '方案一', '管理员室');

  for (const text of [summary, check.行动, check.事件]) {
    assert.match(text ?? '', /101/);
    assert.match(text ?? '', new RegExp(妻名));
    assert.match(text ?? '', /噪音投诉/);
  }
  assert.match(check.事件 ?? '', /不得补写未登记的隐私指控/);
});

test('同模板冷却两个完整考核期，换门牌也不得在第二期提前复用', () => {
  const data = 建数据({ 难度: '严苛', 户数: 5 });
  const first = 生成本期管理任务(data, 0, 0);
  const firstTemplates = new Set(first.map(task => task.模板));
  data.系统._管理考核.活跃任务 = [];

  const next = 生成本期管理任务(data, 1, 9);
  data.系统._管理考核.活跃任务 = [];
  const secondFullPeriod = 生成本期管理任务(data, 2, 18);
  data.系统._管理考核.活跃任务 = [];
  const afterCooldown = 生成本期管理任务(data, 3, 27);

  assert.equal(
    next.some(task => firstTemplates.has(task.模板)),
    false,
  );
  assert.equal(
    secondFullPeriod.some(task => firstTemplates.has(task.模板)),
    false,
  );
  assert.equal(new Set(secondFullPeriod.map(task => task.模板)).size, secondFullPeriod.length, '同一期也不得重复模板');
  assert.equal(
    afterCooldown.some(task => firstTemplates.has(task.模板)),
    true,
    '相隔三期后允许模板再次出现',
  );
});

test('界面、回合引擎与楼务结算保持单次原子接线', () => {
  const app = readFileSync('src/人妻公寓/界面/客户端/App.vue', 'utf8');
  const 合成 = readFileSync('src/人妻公寓/界面/客户端/composables/useRoomActions.ts', 'utf8');
  const index = readFileSync('src/人妻公寓/脚本/游戏逻辑/index.ts', 'utf8');
  const engine = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');

  // A6b:强类型边界拆成两半——composable 经领域回调,App 回调内保留原事件名与载荷
  assert.match(合成, /事件\.处理管理任务\(\{ 任务id: 任务\.id, 选项id: 选项\.id, 地点 \}\)/);
  assert.match(
    app,
    /处理管理任务: \(\{ 任务id, 选项id, 地点 \}\) => eventEmit\('人妻公寓:处理管理任务', \{ 任务id, 选项id, 地点 \}\)/,
  );
  assert.match(index, /eventOn\('人妻公寓:处理管理任务'/);
  assert.match(index, /成功结算: newData => \{\s*const 结算 = 结算管理任务/);
  assert.match(engine, /选项\.成功结算\?\.\(newStat\)/);
  assert.ok(
    engine.indexOf('结算成功现场楼(newStat') < engine.indexOf('选项.成功结算?.(newStat)') &&
      engine.indexOf('选项.成功结算?.(newStat)') < engine.indexOf("_.set(新, 'stat_data', newStat)"),
    '楼务票据必须与同一份回合变量一起写回',
  );
});

test('报修与投诉微信由任务真相编译，并在普通消息频率门禁前同步', () => {
  // P5:管理任务通知编译已迁移至 ./手机/通知桥,编译段断言改读新所有者；
  // P6:手机节拍已迁移至 ./手机/节拍引擎,节拍顺序断言读新所有者。
  const 节拍引擎 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', 'utf8');
  const 通知桥 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts', 'utf8');
  const compileStart = 通知桥.indexOf('function 是管理通知任务');
  const syncStart = 通知桥.indexOf('export async function 同步管理任务微信');
  const rhythmStart = 节拍引擎.indexOf('export async function 手机节拍');
  const rhythm = 节拍引擎.slice(rhythmStart);

  assert.ok(syncStart >= 0);
  assert.match(通知桥.slice(compileStart), /任务\.类型 === '报修' \|\| 任务\.类型 === '投诉'/);
  assert.match(通知桥.slice(compileStart), /`楼务:\$\{任务\.id\}`/);
  assert.ok(rhythm.indexOf('await 同步管理任务微信(data)') < rhythm.indexOf('const 倍 = 频率倍率'));
});

test('成功结算型回合只在非空正文且未晚取消时提交', () => {
  const engine = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');
  const 空正文门 = engine.indexOf('选项.成功结算 && !已清洗正文');
  const 提交前取消门 = engine.indexOf('if (已取消)', engine.indexOf('const 资源结算 = 结算成功现场楼'));
  const 关闭可取消窗口 = engine.indexOf('允许取消 = false;', 提交前取消门);
  const 关闭取消窗口 = engine.indexOf("本回合生成id = '';", 提交前取消门);
  const 提交点 = engine.indexOf('选项.成功结算?.(newStat)');

  assert.ok(空正文门 >= 0, '成功结算型回合必须拒绝空有效正文');
  assert.ok(提交前取消门 >= 0 && 提交前取消门 < 提交点, '成功结算紧前必须再次拒绝晚取消');
  assert.ok(
    关闭可取消窗口 > 提交前取消门 && 关闭可取消窗口 < 提交点 && 关闭取消窗口 > 提交前取消门 && 关闭取消窗口 < 提交点,
    '通过最终取消检查后必须关闭取消入口，再开始不可逆提交',
  );
});

test('生成准备期即可取消，且稽查重写继承楼务系统硬事实', () => {
  const engine = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');
  const cancel = engine.slice(
    engine.indexOf('export function 取消本回合'),
    engine.indexOf('async function 等待正文生成'),
  );
  const execute = engine.slice(
    engine.indexOf('export async function 执行回合'),
    engine.indexOf('export async function 重掷回合'),
  );
  const rewrite = execute.slice(execute.indexOf('const 校准令'), execute.indexOf('const 重写稽查'));

  assert.match(cancel, /if \(!进行中 \|\| !允许取消\) return/);
  assert.match(cancel, /已取消 = true/);
  assert.match(execute, /允许取消 = true;[\s\S]*eventEmit\('人妻公寓:生成开始'/);
  assert.doesNotMatch(execute, /createChatMessages[\s\S]*已取消 = false;[\s\S]*本回合生成id/);
  assert.match(rewrite, /选项\.系统注入/);
});

test('楼务回合禁用普通重演并保留专用回合选项', () => {
  const app = readFileSync('src/人妻公寓/界面/客户端/App.vue', 'utf8');
  const index = readFileSync('src/人妻公寓/脚本/游戏逻辑/index.ts', 'utf8');
  const engine = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');

  assert.match(engine, /可重掷\?: boolean/);
  assert.match(engine, /可重掷: 选项\.可重掷 !== false/);
  assert.match(engine, /记录\.可重掷 === false/);
  assert.match(index, /可重掷: false/);
  assert.match(app, /记录\?\.可重掷 !== false/);
});

test('楼务硬事实走系统注入且入口拒绝冲突状态', () => {
  const index = readFileSync('src/人妻公寓/脚本/游戏逻辑/index.ts', 'utf8');
  const engine = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');
  const start = index.indexOf("eventOn('人妻公寓:处理管理任务'");
  const end = index.indexOf("eventOn('人妻公寓:空房偷窃'", start);
  const handler = index.slice(start, end);

  assert.match(engine, /系统注入\?: string/);
  assert.match(engine, /role: 'system', content: 选项\.系统注入/);
  assert.match(handler, /const 任务行动 = 预检\.行动[\s\S]*执行回合\(任务行动/);
  assert.match(handler, /系统注入:/);
  assert.doesNotMatch(handler, /执行回合\(`\$\{预检\.行动\}\\n/);
  assert.match(handler, /_时间推进中/);
  assert.ok((handler.match(/_时间推进中/g) ?? []).length >= 2, '排队前和安全操作真正执行时都要检查时间推进');
  // P7:启动迁移已清掉旧电话软项(来电回流/母亲裂缝·父亲来电)，队列即强剧情——楼务入口对
  // 迁移后的真实 _待发送事件 做普通强阻塞，不再有“来电可略过”运行时白名单。
  assert.match(handler, /取阻塞时间的待发送事件\(data\.系统\._待发送事件\)/, '楼务入口必须经归一化队列识别阻塞事件');
  assert.match(handler, /if \(阻塞事件\)/, '楼务入口必须只被队列里的阻塞事件拒绝');
  assert.match(handler, /描述待发送事件\(阻塞事件\)/, '拒绝提示必须描述过滤结果而非原始整串');
  assert.doesNotMatch(handler, /if \(data\.系统\._待发送事件\)/, '楼务入口不得再对原始队列做无语义判断');
  assert.match(handler, /_特殊场景\.id/);
  assert.match(handler, /隔离事件进行中\(\)/);
});

test('两个楼务瓷砖都带任务名与剩余或逾期状态', () => {
  const app = readFileSync('src/人妻公寓/界面/客户端/App.vue', 'utf8');
  // A6b:楼务瓷砖随 房间动作 迁入 useRoomActions.ts，角标仍读 App
  const 合成 = readFileSync('src/人妻公寓/界面/客户端/composables/useRoomActions.ts', 'utf8');
  const start = 合成.indexOf('function 添加管理任务动作');
  const end = 合成.indexOf('function 添加地点线路动作', start);
  const actions = 合成.slice(start, end);

  assert.match(actions, /任务\.模板/);
  assert.match(actions, /任务\.截止时段/);
  assert.match(actions, /逾期/);
  assert.match(actions, /管理任务选项\(任务\)\.slice\(0, 2\)/);
  const 位置门 = actions.indexOf('if (当前房间.value !== 地点) return;');
  const 查询任务 = actions.indexOf('列出地点管理任务(data.value, 地点)');
  assert.ok(位置门 >= 0 && 位置门 < 查询任务, '尚未进入任务地点时，地图房卡不得生成楼务处理瓷砖');
  assert.doesNotMatch(actions, /await\s+进入\(地点/, '楼务瓷砖不得暗中替玩家进房后直接开工');

  const markerStart = app.indexOf('function 管理任务角标');
  const markerEnd = app.indexOf('/** HUD', markerStart);
  assert.match(app.slice(markerStart, markerEnd), /'楼务'[\s\S]*'逾期'/, '地图应继续用短角标提示任务地点');
});
