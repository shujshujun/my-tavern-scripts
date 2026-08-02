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
const { 生成本期管理任务, 结算管理任务 } = require('../../src/人妻公寓/脚本/游戏逻辑/管理任务系统.ts');
const {
  使用聚餐降低风闻,
  尝试转入风闻投诉,
  登记攻略风闻,
  登记风闻事件,
  风闻事件安全摘要,
  风闻最低值,
  取待结父亲风闻责任,
  标记父亲风闻责任,
  结算风闻日变,
  聚餐可降低风闻,
  最近风闻摘要,
} = require('../../src/人妻公寓/脚本/游戏逻辑/风闻系统.ts');

function 建数据({ 时段 = 0, 风闻 = 0, 胜任度 = 80, 门牌 = ['101', '102', '201'] } = {}) {
  const 户 = Object.fromEntries(门牌.map((id, index) => [id, 创建户节点(index)]));
  const data = Schema.parse({ 户 });
  data.系统._绝对时段 = 时段;
  data.风闻 = 风闻;
  data.胜任度 = 胜任度;
  data.现金 = 1000;
  data.玩家资源.精力.当前值 = 8;
  data.玩家资源.体力.当前值 = 4;
  return data;
}

function 占槽任务(id, 地点, 门牌 = '') {
  return {
    id,
    模板: `${id}事项`,
    类型: 门牌 ? '报修' : '公共',
    级别: '日常',
    地点,
    门牌,
    创建时段: 0,
    截止时段: 1,
    逾期已扣: true,
    来源事件: '',
    公开摘要: '',
  };
}

function 添加活跃责任(data, id, 胜任责任 = 3) {
  data.系统._风闻账.最近事件.push({
    id,
    类型: 胜任责任 >= 8 ? '风闻危机' : '正式投诉',
    时段: 0,
    日: 0,
    门牌: '101',
    地点: '管理员室',
    摘要: '公开投诉',
    目标增量: 0,
    增量: 0,
    迹象: 胜任责任 >= 6 ? '硬证据' : '正式投诉',
    状态: '活跃',
    父亲责任: 胜任责任 >= 8 ? '已计责' : '未传',
    胜任责任,
  });
}

test('两条正文结算路径都把实际好感与堕落成长接入攻略风闻', () => {
  for (const 文件 of ['回合引擎.ts', 'index.ts']) {
    const source = readFileSync(`src/人妻公寓/脚本/游戏逻辑/${文件}`, 'utf8');
    const start = source.indexOf('const 成长结果 = 记录全楼有效成长');
    const segment = source.slice(start, start + 700);
    assert.ok(start >= 0, `${文件} 必须消费有效成长结果`);
    assert.match(segment, /好感值[\s\S]*登记攻略风闻[\s\S]*'普通'|登记攻略风闻[\s\S]*好感值/);
    assert.match(segment, /堕落值[\s\S]*登记攻略风闻[\s\S]*'亲密'|登记攻略风闻[\s\S]*堕落值/);
  }
});

test('无见证攻略也形成关系异样基础风闻', () => {
  const data = 建数据();

  const result = 登记攻略风闻(data, '101', '普通');

  assert.equal(result.实际增加, 1);
  assert.equal(data.风闻, 1);
  assert.equal(data.系统._风闻账.最近事件.length, 1);
  assert.equal(data.系统._风闻账.最近事件[0].id, '攻略:0:101');
  assert.equal(data.系统._风闻账.最近事件[0].迹象, '关系异样');
  assert.equal(data.系统._风闻账.最近事件[0].父亲责任, '无');
  assert.equal(data.系统._管理考核.活跃任务.length, 0);
});

test('同一时段同户只补到最高攻略档，且全楼基础攻略最多增加四点', () => {
  const data = 建数据();

  assert.equal(登记攻略风闻(data, '101', '普通').实际增加, 1);
  assert.equal(登记攻略风闻(data, '101', '普通').实际增加, 0);
  assert.equal(登记攻略风闻(data, '101', '亲密').实际增加, 1);
  assert.equal(登记攻略风闻(data, '101', '晋阶').实际增加, 1);
  assert.equal(data.风闻, 3, '同户普通、亲密、晋阶只补到最高的三点');

  assert.equal(登记攻略风闻(data, '102', '晋阶').实际增加, 1, '全楼还剩一个基础增长额度');
  assert.equal(登记攻略风闻(data, '201', '晋阶').实际增加, 0, '同一时段超过四点的基础攻略被截断');
  assert.equal(data.风闻, 4);
  assert.equal(
    data.系统._风闻账.最近事件
      .filter(event => event.id.startsWith('攻略:0:'))
      .reduce((sum, event) => sum + event.目标增量, 0),
    4,
  );
});

test('302的攻略基础值额外加一，正式晋阶可独占同时段四点上限', () => {
  const data = 建数据({ 门牌: ['302', '101'] });
  data.系统._母亲入列 = true;

  assert.equal(登记攻略风闻(data, '302', '普通').实际增加, 2);
  assert.equal(登记攻略风闻(data, '302', '晋阶').实际增加, 2);
  assert.equal(登记攻略风闻(data, '101', '普通').实际增加, 0);
  assert.equal(data.风闻, 4);
});

test('稳定事件重复提交幂等，目标提高时只补差额', () => {
  const data = 建数据();
  const input = {
    id: '证据:0:101',
    类型: '可疑痕迹',
    目标增量: 8,
    门牌: '101',
    地点: '101',
    摘要: '101门口留下可疑痕迹',
    迹象: '可疑痕迹',
  };

  assert.equal(登记风闻事件(data, input).实际增加, 8);
  assert.equal(登记风闻事件(data, input).实际增加, 0);
  assert.equal(data.风闻, 8);

  assert.equal(登记风闻事件(data, { ...input, 目标增量: 12, 迹象: '硬证据' }).实际增加, 4);
  assert.equal(登记风闻事件(data, { ...input, 目标增量: 12 }).实际增加, 0);
  assert.equal(data.风闻, 12);
  assert.equal(data.系统._风闻账.最近事件.filter(event => event.id === input.id).length, 1);
  assert.equal(data.系统._风闻账.最近事件[0].增量, 12);
  assert.equal(data.系统._风闻账.最近事件[0].迹象, '硬证据');
});

test('已计责或已由母亲圆场的稳定事件重复登记时不回写成未传', () => {
  for (const 终态 of ['已计责', '母亲已圆场']) {
    const data = 建数据();
    const input = {
      id: `稳定责任:${终态}`,
      类型: '正式投诉',
      目标增量: 0,
      门牌: '101',
      地点: '101',
      摘要: '住户已经提出投诉',
      迹象: '正式投诉',
      投诉: '普通',
    };
    登记风闻事件(data, input);
    标记父亲风闻责任(data, input.id, 终态);

    登记风闻事件(data, input);

    assert.equal(data.系统._风闻账.最近事件.find(event => event.id === input.id)?.父亲责任, 终态);
  }
});

test('已经处理完的稳定投诉重复登记时不重新生成任务或父亲责任', () => {
  const data = 建数据();
  const input = {
    id: '稳定责任:已处理',
    类型: '正式投诉',
    目标增量: 0,
    门牌: '101',
    地点: '管理员室',
    摘要: '同一投诉的重复投递',
    迹象: '正式投诉',
    投诉: '普通',
  };
  登记风闻事件(data, input);
  标记父亲风闻责任(data, input.id, '已计责');
  const task = data.系统._管理考核.活跃任务.find(item => item.来源事件 === input.id);
  assert.ok(task);
  assert.equal(结算管理任务(data, task.id, '方案一', '管理员室').成功, true);

  const 处理后风闻 = data.风闻;
  const 处理后胜任 = data.胜任度;
  data.风闻 = 99;
  const 重复结果 = 登记风闻事件(data, { ...input, 目标增量: 20, 迹象: '硬证据', 投诉: '严重' });

  const event = data.系统._风闻账.最近事件.find(item => item.id === input.id);
  assert.equal(event?.状态, '已处理');
  assert.equal(event?.父亲责任, '已计责');
  assert.equal(event?.迹象, '正式投诉', '已结案事件的证据和身份也不得被重复提交改写');
  assert.equal(data.风闻, 99, `重复投递不得重领结案前的目标差额（处理后曾为 ${处理后风闻}）`);
  assert.equal(data.胜任度, 处理后胜任, '重复投递不得再次触发危机扣分');
  assert.deepEqual(重复结果, {
    变动: false,
    实际增加: 0,
    变更前: 99,
    变更后: 99,
    投诉: '无',
    危机: false,
    事件ID: input.id,
  });
  assert.equal(data.系统._管理考核.活跃任务.some(item => item.来源事件 === input.id), false);
  assert.equal(取待结父亲风闻责任(data).some(item => item.事件ID === input.id), false);

  for (let index = 0; index < 13; index += 1) {
    登记风闻事件(data, { id: `zzzz:结案填充:${index}`, 类型: '旁支', 目标增量: 0, 摘要: '公开小事' });
  }
  assert.equal(data.系统._风闻账.最近事件.some(item => item.id === input.id), false, '结案事件允许离开轻历史');
  assert.equal(登记风闻事件(data, { ...input, 目标增量: 100, 投诉: '严重' }).变动, false);
  assert.equal(data.胜任度, 处理后胜任);
});

test('硬证据事实单调持久，后续正式投诉不能洗掉，也不能被母亲圆场', () => {
  const data = 建数据();
  const id = '硬证据单调:0';
  登记风闻事件(data, {
    id,
    类型: '母亲事发',
    目标增量: 0,
    门牌: '302',
    地点: '302',
    摘要: '私密原文：不应出现在投诉摘要里',
    迹象: '硬证据',
    投诉: '普通',
  });
  登记风闻事件(data, {
    id,
    类型: '正式投诉',
    目标增量: 0,
    门牌: '',
    地点: '管理员室',
    摘要: '另一段任意私密原文',
    迹象: '正式投诉',
    投诉: '普通',
  });

  const event = data.系统._风闻账.最近事件.find(item => item.id === id);
  const task = data.系统._管理考核.活跃任务.find(item => item.来源事件 === id);
  assert.equal(event?.迹象, '硬证据');
  assert.equal(event?.类型, '母亲事发');
  assert.equal(event?.门牌, '302');
  assert.equal(event?.地点, '302');
  assert.equal(取待结父亲风闻责任(data)[0]?.可圆场, false);
  assert.ok(task);
  assert.doesNotMatch(task.公开摘要, /私密原文/);
  assert.match(task.公开摘要, /可核验|证据/);

  // 即使轻历史后来裁掉无责任的证据事件，持久票据仍须保住302硬证据的身份。
  const cropped = 建数据({ 门牌: ['302'] });
  cropped.系统._母亲入列 = true;
  登记风闻事件(cropped, {
    id: '裁剪硬证据',
    类型: '母亲事发',
    目标增量: 1,
    门牌: '302',
    地点: '302',
    摘要: '原始私密事实',
    迹象: '硬证据',
  });
  for (let index = 0; index < 13; index += 1) {
    登记风闻事件(cropped, { id: `zzzz:证据填充:${index}`, 类型: '旁支', 目标增量: 0, 摘要: '公开小事' });
  }
  assert.equal(cropped.系统._风闻账.最近事件.some(item => item.id === '裁剪硬证据'), false);
  登记风闻事件(cropped, {
    id: '裁剪硬证据',
    类型: '正式投诉',
    目标增量: 2,
    门牌: '101',
    地点: '管理员室',
    摘要: '弱投诉试图覆盖身份',
    迹象: '正式投诉',
    投诉: '严重',
  });
  const restored = cropped.系统._风闻账.最近事件.find(item => item.id === '裁剪硬证据');
  assert.equal(restored?.迹象, '硬证据');
  assert.equal(restored?.类型, '母亲事发');
  assert.equal(restored?.门牌, '302');
});

test('轻历史裁剪后稳定ID仍能只补差额，且去重票据不会在64条后失忆', () => {
  const data = 建数据();
  const 原事件 = {
    id: '000:长期稳定事件',
    类型: '关系推进',
    目标增量: 1,
    门牌: '101',
    地点: '101',
    摘要: '与101往来增加',
    迹象: '关系异样',
  };
  assert.equal(登记风闻事件(data, 原事件).实际增加, 1);
  for (let index = 0; index < 13; index += 1) {
    登记风闻事件(data, { id: `zzz:裁剪填充:${index}`, 类型: '旁支', 目标增量: 0, 摘要: '公开小事' });
  }
  assert.equal(data.系统._风闻账.最近事件.some(event => event.id === 原事件.id), false);
  assert.equal(登记风闻事件(data, { ...原事件, 目标增量: 3 }).实际增加, 2, '裁剪后升级只能补 1→3 的差额');

  for (let index = 0; index < 70; index += 1) {
    登记风闻事件(data, { id: `长期填充:${index}`, 类型: '旁支', 目标增量: 0, 摘要: '公开小事' });
  }
  const before = data.风闻;
  assert.equal(登记风闻事件(data, { ...原事件, 目标增量: 3 }).实际增加, 0);
  assert.equal(data.风闻, before, '超过64条后仍不得把旧稳定ID当成新事件');
});

test('同一ID坏数据先合并再查询，父亲责任只能出现和结算一次', () => {
  const data = 建数据();
  const base = {
    id: '重复责任',
    类型: '正式投诉',
    时段: 1,
    日: 0,
    门牌: '101',
    地点: '管理员室',
    摘要: '同一投诉',
    目标增量: 0,
    增量: 0,
    迹象: '正式投诉',
    状态: '活跃',
    父亲责任: '未传',
    胜任责任: 3,
  };
  data.系统._风闻账.最近事件 = [structuredClone(base), structuredClone(base)];

  assert.deepEqual(取待结父亲风闻责任(data).map(item => item.事件ID), ['重复责任']);
  标记父亲风闻责任(data, '重复责任', '已计责');
  assert.equal(取待结父亲风闻责任(data).length, 0);
  assert.equal(data.系统._风闻账.最近事件.filter(event => event.id === '重复责任').length, 1);

  const 终态冲突 = 建数据();
  终态冲突.系统._风闻账.最近事件 = [
    { ...base, id: '终态冲突', 状态: '已处理', 父亲责任: '无', 胜任责任: 0 },
    { ...base, id: '终态冲突' },
  ];
  assert.equal(取待结父亲风闻责任(终态冲突).length, 0, '结案副本必须压住同ID坏数据里的未传副本');
  assert.equal(终态冲突.系统._风闻账.最近事件[0].父亲责任, '无');
});

test('满值时真实新事件仍记录新增日，处理降温后不会立刻被自然衰减', () => {
  const data = 建数据({ 风闻: 100, 时段: 0 });
  data.系统._风闻账.上次日结日 = 0;
  data.系统._风闻账.最后新增日 = -1;

  const result = 登记风闻事件(data, {
    id: '满值新事件',
    类型: '关系推进',
    目标增量: 2,
    摘要: '新的公开关注',
  });
  assert.equal(result.实际增加, 0);
  assert.equal(data.系统._风闻账.最后新增日, 0);
  data.风闻 = 95;
  data.系统._绝对时段 = 6;
  assert.equal(结算风闻日变(data), 0);
  assert.equal(data.风闻, 95);
});

test('风闻指针和孤儿危机在读账时自愈，不制造无下限或永久底线', () => {
  const active = 建数据({ 风闻: 30 });
  active.系统._风闻账.最近事件.push({
    id: '待恢复投诉',
    类型: '正式投诉',
    时段: 0,
    日: 0,
    门牌: '101',
    地点: '管理员室',
    摘要: '公开投诉',
    目标增量: 0,
    增量: 0,
    迹象: '正式投诉',
    状态: '活跃',
    父亲责任: '未传',
    胜任责任: 3,
  });
  assert.equal(风闻最低值(active), 25);
  assert.equal(active.系统._风闻账.当前投诉事件, '待恢复投诉');

  const orphan = 建数据({ 风闻: 30 });
  orphan.系统._风闻账.危机活跃 = true;
  orphan.系统._风闻账.危机跨线锁 = true;
  assert.equal(风闻最低值(orphan), 0);
  assert.equal(orphan.系统._风闻账.危机活跃, false);
  assert.equal(orphan.系统._风闻账.危机跨线锁, false);
});

test('HUD最近摘要与公共摘要统一过滤私密原文', () => {
  const data = 建数据();
  登记风闻事件(data, {
    id: '私密摘要事件',
    类型: '关系推进',
    目标增量: 2,
    门牌: '101',
    地点: '101',
    摘要: '私密原文：卧室细节与聊天内容',
    迹象: '关系异样',
  });
  const event = data.系统._风闻账.最近事件.find(item => item.id === '私密摘要事件');
  assert.ok(event);
  assert.doesNotMatch(风闻事件安全摘要(event), /私密原文|卧室|聊天内容/);
  assert.doesNotMatch(最近风闻摘要(data)[0], /私密原文|卧室|聊天内容/);
});

test('同时段攻略上限不因最近事件裁剪而失效', () => {
  const data = 建数据();
  assert.equal(登记攻略风闻(data, '101', '晋阶').实际增加, 3);
  for (let index = 0; index < 13; index += 1) {
    登记风闻事件(data, {
      id: `无增量事件:${index}`,
      类型: '旁支',
      目标增量: 0,
      摘要: '脚本概括',
    });
  }
  assert.equal(data.系统._风闻账.最近事件.some(event => event.id === '攻略:0:101'), false, '前一攻略事件已被裁剪');

  assert.equal(登记攻略风闻(data, '102', '晋阶').实际增加, 1);
  assert.equal(data.风闻, 4);
});

test('坏风闻事件只被逐条丢弃，并清理指向坏事件的孤儿指针', () => {
  const valid = {
    id: '有效事件',
    类型: '正式投诉',
    时段: 1,
    日: 0,
    门牌: '101',
    地点: '101',
    摘要: '脚本概括',
    目标增量: 1,
    增量: 1,
    迹象: '正式投诉',
    状态: '活跃',
    父亲责任: '未传',
    胜任责任: 3,
  };
  const data = Schema.parse({
    系统: {
      _风闻账: {
        当前投诉事件: '有效事件',
        待转投诉事件: '坏事件',
        最近事件: [valid, { id: 123, 状态: { 非法: true } }],
      },
    },
  });

  assert.deepEqual(data.系统._风闻账.最近事件.map(event => event.id), ['有效事件']);
  assert.equal(data.系统._风闻账.当前投诉事件, '有效事件');
  assert.equal(data.系统._风闻账.待转投诉事件, '');
});

test('父亲责任查询可按排他期界时段筛选跨期事件', () => {
  const data = 建数据({ 时段: 8 });
  登记风闻事件(data, {
    id: '期界前',
    类型: '正式投诉',
    目标增量: 0,
    摘要: '前一期投诉',
    迹象: '正式投诉',
    投诉: '普通',
  });
  data.系统._绝对时段 = 9;
  登记风闻事件(data, {
    id: '期界上',
    类型: '正式投诉',
    目标增量: 0,
    摘要: '下一期投诉',
    迹象: '正式投诉',
    投诉: '普通',
  });

  assert.deepEqual(
    取待结父亲风闻责任(data, 9).map(item => item.事件ID),
    ['期界前'],
  );
  assert.equal(取待结父亲风闻责任(data).length, 2, '省略期界时保持既有全量行为');
});

test('风闻达到75时三槽已满则投诉排队，既有逾期任务一个也不关闭', () => {
  const data = 建数据({ 风闻: 74 });
  data.系统._管理考核.活跃任务 = [
    占槽任务('old-1', '大堂'),
    占槽任务('old-2', '101', '101'),
    占槽任务('old-3', '天台'),
  ];
  const oldTasks = structuredClone(data.系统._管理考核.活跃任务);

  const result = 登记风闻事件(data, {
    id: '跨入盯防:0',
    类型: '关系异样',
    目标增量: 1,
    门牌: '101',
    地点: '101',
    摘要: '管理员与101住户往来频繁',
    迹象: '关系异样',
  });

  assert.equal(result.投诉, '普通');
  assert.equal(data.风闻, 75);
  assert.deepEqual(data.系统._管理考核.活跃任务, oldTasks);
  assert.equal(data.系统._风闻账.当前投诉事件, '跨入盯防:0');
  assert.equal(data.系统._风闻账.待转投诉事件, '跨入盯防:0');
  assert.equal(尝试转入风闻投诉(data), false);
  assert.deepEqual(data.系统._管理考核.活跃任务, oldTasks);
});

test('重叠风闻投诉各自保留责任，完成前项后后项自动补位', () => {
  const data = 建数据({ 风闻: 74 });
  登记风闻事件(data, {
    id: '重叠投诉:A',
    类型: '关系异样',
    目标增量: 1,
    门牌: '101',
    地点: '101',
    摘要: '管理员与101住户往来频繁',
    迹象: '关系异样',
  });
  登记风闻事件(data, {
    id: '重叠投诉:B',
    类型: '硬证据',
    目标增量: 0,
    门牌: '102',
    地点: '102',
    摘要: '102住户提交了明确证据',
    迹象: '硬证据',
    投诉: '严重',
  });

  const eventA = data.系统._风闻账.最近事件.find(event => event.id === '重叠投诉:A');
  const eventB = data.系统._风闻账.最近事件.find(event => event.id === '重叠投诉:B');
  assert.equal(data.系统._风闻账.当前投诉事件, '重叠投诉:A');
  assert.equal(data.系统._风闻账.待转投诉事件, '重叠投诉:B');
  assert.equal(eventA?.胜任责任, 3, '后来的严重投诉不得升级旧事件');
  assert.equal(eventB?.胜任责任, 6, '后来投诉必须保留自己的责任');
  assert.equal(data.系统._管理考核.活跃任务.filter(task => task.来源事件 === '重叠投诉:A').length, 1);
  assert.equal(data.系统._管理考核.活跃任务.filter(task => task.来源事件 === '重叠投诉:B').length, 0);

  const taskA = data.系统._管理考核.活跃任务.find(task => task.来源事件 === '重叠投诉:A');
  assert.ok(taskA);
  const result = 结算管理任务(data, taskA.id, '方案一', '管理员室');
  assert.equal(result.成功, true);
  assert.equal(data.系统._风闻账.当前投诉事件, '重叠投诉:B');
  assert.equal(data.系统._风闻账.待转投诉事件, '');
  assert.equal(eventA?.状态, '已处理');
  assert.equal(eventB?.状态, '活跃');
  assert.equal(data.系统._管理考核.活跃任务.filter(task => task.来源事件 === '重叠投诉:B').length, 1);
});

test('旧投诉处理期间跨入100时，危机责任归新事件并排队', () => {
  const data = 建数据({ 风闻: 99, 胜任度: 80 });
  登记风闻事件(data, {
    id: '危机重叠:A',
    类型: '正式投诉',
    目标增量: 0,
    门牌: '101',
    地点: '101',
    摘要: '101住户提出普通投诉',
    迹象: '正式投诉',
    投诉: '普通',
  });
  登记风闻事件(data, {
    id: '危机重叠:B',
    类型: '硬证据',
    目标增量: 1,
    门牌: '102',
    地点: '102',
    摘要: '102住户提交了明确证据',
    迹象: '硬证据',
  });

  const eventA = data.系统._风闻账.最近事件.find(event => event.id === '危机重叠:A');
  const eventB = data.系统._风闻账.最近事件.find(event => event.id === '危机重叠:B');
  assert.equal(data.胜任度, 72);
  assert.equal(data.系统._风闻账.当前投诉事件, '危机重叠:A');
  assert.equal(data.系统._风闻账.待转投诉事件, '危机重叠:B');
  assert.equal(eventA?.胜任责任, 3);
  assert.equal(eventA?.父亲责任, '未传');
  assert.equal(eventB?.胜任责任, 8);
  assert.equal(eventB?.父亲责任, '已计责');

  const taskA = data.系统._管理考核.活跃任务.find(task => task.来源事件 === '危机重叠:A');
  assert.ok(taskA);
  assert.equal(taskA.级别, '重要');
  结算管理任务(data, taskA.id, '方案一', '管理员室');
  assert.equal(data.系统._风闻账.当前投诉事件, '危机重叠:B');
  assert.equal(data.系统._风闻账.危机活跃, true);
  assert.equal(
    data.系统._管理考核.活跃任务.find(task => task.来源事件 === '危机重叠:B')?.级别,
    '紧急',
  );
});

test('风闻投诉模板不会混入普通周期任务池', () => {
  for (let period = 0; period < 30; period += 1) {
    const data = 建数据({ 门牌: ['101'] });
    const tasks = 生成本期管理任务(data, period, period * 9);
    assert.equal(
      tasks.some(task => task.模板 === '管理员作风投诉' || task.模板 === '风闻危机投诉'),
      false,
    );
  }
});

test('管理员室完成风闻投诉只结算一次，降低五点并解除投诉下限', () => {
  const data = 建数据({ 风闻: 74 });
  登记风闻事件(data, {
    id: '待处理投诉:0',
    类型: '关系异样',
    目标增量: 1,
    门牌: '101',
    地点: '101',
    摘要: '管理员与101住户往来频繁',
    迹象: '关系异样',
  });
  const task = data.系统._管理考核.活跃任务.find(item => item.来源事件 === '待处理投诉:0');
  assert.ok(task, '达到75后应生成管理员室投诉任务');

  const first = 结算管理任务(data, task.id, '方案一', '管理员室');
  assert.equal(first.成功, true);
  assert.equal(first.变动, true);
  assert.match(first.提示, /风闻 -5/);
  assert.equal(data.风闻, 70);
  assert.equal(data.系统._风闻账.当前投诉事件, '');
  assert.equal(data.系统._风闻账.待转投诉事件, '');
  assert.equal(data.系统._风闻账.投诉跨线锁, false);
  assert.equal(data.系统._风闻账.最近事件.find(event => event.id === '待处理投诉:0')?.状态, '已处理');

  const second = 结算管理任务(data, task.id, '方案一', '管理员室');
  assert.equal(second.成功, true);
  assert.equal(second.变动, false);
  assert.equal(data.风闻, 70);
});

test('风闻达到100只结算一次危机责任并生成紧急父亲来电', () => {
  const data = 建数据({ 时段: 18, 风闻: 99, 胜任度: 80 });
  const crisis = {
    id: '危机证据:0',
    类型: '硬证据',
    目标增量: 1,
    门牌: '101',
    地点: '大堂',
    摘要: '公开区域出现无法否认的证据',
    迹象: '硬证据',
  };

  const first = 登记风闻事件(data, crisis);
  assert.equal(first.危机, true);
  assert.equal(data.风闻, 100);
  assert.equal(data.胜任度, 72);
  assert.equal(data.系统._风闻账.危机活跃, true);
  assert.equal(data.系统._风闻账.危机跨线锁, true);
  assert.equal(data.系统._待接来电.紧急, true);
  assert.equal(data.系统._待接来电.期, 2, '紧急来电必须使用当前九时段经济考核期');
  assert.match(data.系统._待接来电.报表, /风闻.*危机/);
  assert.deepEqual(
    data.系统._管理考核.记分条目.filter(item => item.id === '风闻危机:危机证据:0').map(item => [item.类别, item.变动]),
    [['公开丑闻', -8]],
    '即时危机扣分必须进入统一胜任账，供通牒结局读取真实主因',
  );

  assert.equal(登记风闻事件(data, crisis).危机, false);
  登记风闻事件(data, { ...crisis, id: '危机后续:0', 目标增量: 12 });
  assert.equal(data.胜任度, 72, '停留在100以及后续事件都不能重复扣危机责任');
  assert.equal(data.系统._风闻账.最近事件.filter(event => event.父亲责任 === '已计责').length, 1);
});

test('302硬证据危机按母亲事发记入胜任账', () => {
  const data = 建数据({ 风闻: 99, 胜任度: 80, 门牌: ['302'] });
  data.系统._母亲入列 = true;
  登记风闻事件(data, {
    id: '母亲危机证据',
    类型: '母亲事发',
    目标增量: 1,
    门牌: '302',
    地点: '302',
    摘要: '私密原文',
    迹象: '硬证据',
  });

  const item = data.系统._管理考核.记分条目.find(entry => entry.id === '风闻危机:母亲危机证据');
  assert.equal(item?.类别, '母亲事发');
  assert.equal(item?.变动, -8);
  assert.doesNotMatch(item?.原因 ?? '', /私密原文/);
});

test('危机处理降到100以下后，新事件再次跨100会重触发，停留100不重放', () => {
  const data = 建数据({ 风闻: 99, 胜任度: 80 });
  登记风闻事件(data, {
    id: '首轮危机',
    类型: '硬证据',
    目标增量: 1,
    摘要: '首轮可核验异常',
    迹象: '硬证据',
  });
  const firstTask = data.系统._管理考核.活跃任务.find(task => task.来源事件 === '首轮危机');
  assert.ok(firstTask);
  assert.equal(结算管理任务(data, firstTask.id, '方案一', '管理员室').成功, true);
  assert.equal(data.风闻, 95);
  assert.equal(data.系统._风闻账.危机跨线锁, false);

  const 重触发前胜任度 = data.胜任度;
  const second = 登记风闻事件(data, {
    id: '次轮危机',
    类型: '多人目击',
    目标增量: 5,
    摘要: '次轮公开异常',
    迹象: '多人目击',
  });
  assert.equal(second.危机, true);
  assert.equal(data.胜任度, 重触发前胜任度 - 8);

  const stayed = 登记风闻事件(data, {
    id: '危机顶格后续',
    类型: '多人目击',
    目标增量: 8,
    摘要: '仍停留在危机水位',
    迹象: '多人目击',
  });
  assert.equal(stayed.危机, false);
  assert.equal(data.胜任度, 重触发前胜任度 - 8);
});

test('旧父亲通话收尾中时危机写入下一通，通话中仍原地升级', () => {
  for (const 状态 of ['收尾中', '通话中']) {
    const data = 建数据({ 时段: 9, 风闻: 99 });
    data.系统._父亲通话.标识 = `旧通话:${状态}`;
    data.系统._父亲通话.状态 = 状态;
    data.系统._父亲通话.期 = 0;
    data.系统._父亲通话.报表 = '旧通话报表';
    登记风闻事件(data, {
      id: `危机:${状态}`,
      类型: '硬证据',
      目标增量: 1,
      摘要: '可核验异常',
      迹象: '硬证据',
    });

    if (状态 === '收尾中') {
      assert.equal(data.系统._父亲通话.紧急, false);
      assert.equal(data.系统._父亲通话.报表, '旧通话报表');
      assert.equal(data.系统._待接来电.紧急, true);
      assert.equal(data.系统._待接来电.期, 1);
    } else {
      assert.equal(data.系统._父亲通话.紧急, true);
      assert.match(data.系统._父亲通话.报表, /风闻.*危机/);
      assert.equal(data.系统._待接来电.期, -1);
    }
  }
});

test('无新增整日按档自然衰减，并服从投诉25与危机50的下限', () => {
  const quiet = 建数据({ 风闻: 40 });
  assert.equal(结算风闻日变(quiet), 0, '首次调用只校准当前日');
  quiet.系统._绝对时段 = 6;
  assert.equal(结算风闻日变(quiet), 4);
  assert.equal(quiet.风闻, 36);

  const complaint = 建数据({ 风闻: 27 });
  complaint.系统._风闻账.上次日结日 = 0;
  complaint.系统._风闻账.最后新增日 = -1;
  添加活跃责任(complaint, '仍未处理');
  complaint.系统._风闻账.当前投诉事件 = '仍未处理';
  complaint.系统._绝对时段 = 6;
  assert.equal(结算风闻日变(complaint), 2);
  assert.equal(complaint.风闻, 25);

  const crisis = 建数据({ 风闻: 52 });
  crisis.系统._风闻账.上次日结日 = 0;
  crisis.系统._风闻账.最后新增日 = -1;
  添加活跃责任(crisis, '仍未处理危机', 8);
  crisis.系统._风闻账.危机活跃 = true;
  crisis.系统._绝对时段 = 6;
  assert.equal(结算风闻日变(crisis), 2);
  assert.equal(crisis.风闻, 50);
  crisis.系统._绝对时段 = 12;
  assert.equal(结算风闻日变(crisis), 0);
  assert.equal(crisis.风闻, 50);
});

test('活跃投诉的下限高于当前风闻时，任何降值结算都不会反向抬高风闻', () => {
  const data = 建数据({ 风闻: 8 });
  data.系统._风闻账.上次日结日 = 0;
  data.系统._风闻账.最后新增日 = -1;
  添加活跃责任(data, '低位硬证据投诉', 6);
  data.系统._风闻账.当前投诉事件 = '低位硬证据投诉';
  data.系统._绝对时段 = 6;

  assert.equal(结算风闻日变(data), 0);
  assert.equal(data.风闻, 8);
});

test('全楼聚餐降低十点并冷却十二时段，且不能压破投诉下限', () => {
  const data = 建数据({ 时段: 10, 风闻: 40 });

  assert.deepEqual(聚餐可降低风闻(data), { 可用: true, 尚余时段: 0 });
  assert.equal(使用聚餐降低风闻(data), 10);
  assert.equal(data.风闻, 30);
  assert.deepEqual(聚餐可降低风闻(data), { 可用: false, 尚余时段: 12 });
  assert.equal(使用聚餐降低风闻(data), 0);
  assert.equal(data.风闻, 30);

  data.系统._绝对时段 = 21;
  assert.deepEqual(聚餐可降低风闻(data), { 可用: false, 尚余时段: 1 });
  data.系统._绝对时段 = 22;
  assert.deepEqual(聚餐可降低风闻(data), { 可用: true, 尚余时段: 0 });
  assert.equal(使用聚餐降低风闻(data), 10);
  assert.equal(data.风闻, 20);

  const floor = 建数据({ 时段: 5, 风闻: 30 });
  添加活跃责任(floor, '未处理投诉');
  floor.系统._风闻账.当前投诉事件 = '未处理投诉';
  assert.equal(使用聚餐降低风闻(floor), 5);
  assert.equal(floor.风闻, 25);

  const noEffect = 建数据({ 时段: 5, 风闻: 25 });
  添加活跃责任(noEffect, '未处理投诉');
  noEffect.系统._风闻账.当前投诉事件 = '未处理投诉';
  assert.equal(使用聚餐降低风闻(noEffect), 0);
  assert.equal(noEffect.系统._风闻账.聚餐冷却至, -1, '没有可降低风闻时不能空耗聚餐冷却');
});
