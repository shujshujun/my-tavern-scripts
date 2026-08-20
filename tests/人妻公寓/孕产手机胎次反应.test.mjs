/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  构建孕产角色数据,
  构建孕产事件数据,
} = require('../../src/人妻公寓/脚本/游戏逻辑/孕产叙事系统.ts');
const {
  生产父亲认知画像,
  孕情群后私聊键,
} = require('../../src/人妻公寓/脚本/游戏逻辑/生产姐妹群系统.ts');

function 建数据() {
  const 户 = {};
  for (const 门牌 of ['101', '102', '201', '202']) {
    const 节点 = 创建户节点(0);
    Object.assign(节点.妻, { 当前阶段: 4, 好感值: 75, 堕落值: 70, 上次互动楼层: 0 });
    户[门牌] = 节点;
  }
  return Schema.parse({ 户, 系统: { _绝对时段: 60 } });
}

function 加孩子(data, 母亲门牌, 胎次, 场次标识 = `born-${母亲门牌}-${胎次}`) {
  data.系统._家庭文档.孩子.push({
    id: `生产:${母亲门牌}:${胎次}:${场次标识}`,
    母亲门牌,
    胎次,
    性别: 胎次 % 2 ? '女' : '男',
    出生绝对时段: 胎次 * 10,
    结果: '陪产',
    玩家产后看望: true,
    获知生产路径: '姐妹群',
    叙事最小年龄: 0,
    年龄阶段: '新生儿',
    出生场次标识: 场次标识,
  });
}

function 设当前孕情(data, 门牌, 胎次, 场次标识) {
  Object.assign(data.户[门牌].妻._怀孕, { 状态: '已告知', 已曝光: true, 受孕场次标识: 场次标识 });
  Object.assign(data.户[门牌].妻._生产, { 状态: '孕期', 本胎序号: 胎次 });
}

test('统一孕产数据明确区分头胎、二胎、三胎，不给AI预写角色台词', () => {
  const data = 建数据();

  设当前孕情(data, '101', 1, 'preg-first');
  const 头胎 = 构建孕产事件数据(data, '101', '报孕');
  assert.equal(头胎.胎次, 1);
  assert.equal(头胎.已生胎数, 0);

  加孩子(data, '101', 1);
  设当前孕情(data, '101', 2, 'preg-second');
  const 二胎 = 构建孕产事件数据(data, '101', '姐妹群报孕');
  assert.equal(二胎.胎次, 2);
  assert.equal(二胎.已生胎数, 1);

  加孩子(data, '101', 2);
  设当前孕情(data, '101', 3, 'preg-third');
  const 三胎 = 构建孕产事件数据(data, '101', '姐妹群报孕');
  assert.equal(三胎.胎次, 3);
  assert.equal(三胎.已生胎数, 2);
  assert.equal(typeof 三胎.母亲.性格, 'string');
  assert.equal(三胎.母亲.当前阶段, 4);
  assert.equal(三胎.母亲.好感值, 75);
  assert.equal(Object.values(三胎).some(值 => typeof 值 === 'string' && /我怀孕|认真谈谈/.test(值)), false);
});

test('观察者数据同时提供自己的当前孕次、既有育儿经历、性格和关系数值', () => {
  const data = 建数据();
  加孩子(data, '101', 1);
  设当前孕情(data, '101', 2, 'preg-target-2');

  设当前孕情(data, '102', 1, 'preg-observer-1');
  加孩子(data, '201', 1);
  加孩子(data, '201', 2);

  const 同孕 = 构建孕产角色数据(data, '102', false);
  const 二胎母亲 = 构建孕产角色数据(data, '201', true);
  const 无经验 = 构建孕产角色数据(data, '202', true);
  assert.deepEqual(
    { 当前怀孕: 同孕.当前怀孕, 当前胎次: 同孕.当前胎次, 公开: 同孕.当前孕情可公开 },
    { 当前怀孕: true, 当前胎次: 1, 公开: false },
  );
  assert.equal(二胎母亲.已生胎数, 2);
  assert.equal(无经验.已生胎数, 0);
  for (const 画像 of [同孕, 二胎母亲, 无经验]) {
    assert.equal(typeof 画像.性格, 'string');
    assert.equal(typeof 画像.好感值, 'number');
    assert.equal(typeof 画像.婚姻值, 'number');
    assert.equal(typeof 画像.当前情绪, 'string');
  }
});

test('跨胎父亲认知保留历史，并为每一胎保留独立私聊事件键', () => {
  const data = 建数据();
  加孩子(data, '101', 1, 'preg-101-1');
  加孩子(data, '101', 2, 'preg-101-2');
  设当前孕情(data, '101', 3, 'preg-101-3');

  const 消息 = [
    { 会话: '102', 键: '生产父亲质问:102:101:1:preg-101-1' },
    { 会话: '姐妹群', 键: '姐妹生产:101:2:preg-101-2:确认:父亲确认' },
  ];
  const 观察者 = 生产父亲认知画像(data, 消息, '101', 60).find(项 => 项.门牌 === '102');
  assert.deepEqual(观察者?.此前已确认胎次, [1, 2]);

  assert.notEqual(
    孕情群后私聊键('102', '101', 2, 'preg-101-2'),
    孕情群后私聊键('102', '101', 3, 'preg-101-3'),
  );
});

test('孕产姐妹群1至4条合法残稿在任何消息与事件键写入前整批拒绝', () => {
  const 根 = new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url);
  const 节拍源码 = readFileSync(new URL('./手机/节拍引擎.ts', 根), 'utf8');
  const 下限声明 = 节拍源码.indexOf('const 专场AI气泡下限 = 5;');
  const 残稿拒绝 = 节拍源码.indexOf('合法消息们.length < 专场AI气泡下限');
  const 首次消息写入 = 节拍源码.indexOf('库.消息.push({', 残稿拒绝);
  const 事件键写入 = 节拍源码.indexOf('键: 选项.引用约束?.跟聊角色', 残稿拒绝);

  assert.ok(下限声明 >= 0);
  assert.ok(残稿拒绝 > 下限声明);
  assert.ok(首次消息写入 > 残稿拒绝, '专场下限必须在第一条可见消息写入前关闭整批');
  assert.ok(事件键写入 > 残稿拒绝, '事件键只能随通过整批验收的消息一起写入');
  assert.match(节拍源码.slice(残稿拒绝 - 180, 残稿拒绝 + 180), /return false/u);
});

test('报孕、姐妹群和群后私聊消费统一数据，正文只由AI生成且失败后可重试', () => {
  const 根 = new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url);
  const 节拍源码 = readFileSync(new URL('./手机/节拍引擎.ts', 根), 'utf8');
  const 怀孕源码 = readFileSync(new URL('./怀孕系统.ts', 根), 'utf8');
  const 通知源码 = readFileSync(new URL('./手机/孕情AI通知.ts', 根), 'utf8');
  const 生产群源码 = readFileSync(new URL('./生产姐妹群系统.ts', 根), 'utf8');

  assert.match(节拍源码, /构建孕产事件数据/);
  assert.match(节拍源码, /构建孕产角色数据/);
  assert.match(节拍源码, /本轮孕产角色数据/);
  assert.match(节拍源码, /生成孕产群后私聊/);
  assert.match(节拍源码, /await 小生成\(/);
  assert.match(节拍源码, /孕情群后私聊键/);
  assert.doesNotMatch(节拍源码, /生产父亲质问兜底|孕情群后私聊兜底/);
  assert.doesNotMatch(生产群源码, /生产父亲质问兜底|孕情群后私聊兜底|头胎质问文案/);
  assert.doesNotMatch(节拍源码, /const 质问文案: Partial<Record<门牌, string>>/);
  assert.match(怀孕源码, /冻结报孕生成资料/);
  assert.doesNotMatch(怀孕源码, /孕妇报孕胎次句/);
  assert.match(通知源码, /export async function 同步孕情AI微信/);
  assert.match(通知源码, /export async function 同步孕产与家庭计划AI微信/);
  assert.match(通知源码, /解析报孕生成资料/);
  assert.match(通知源码, /await 小生成\(/);
  assert.match(通知源码, /if \(文 && 验收报孕硬事实\(文, 资料\.胎次\)\) 可追加/);
  assert.match(通知源码, /生成失败不落消息键/);
  assert.match(通知源码, /验收报孕硬事实/);
  assert.doesNotMatch(通知源码, /报孕.*兜底|兜底.*报孕/);
  assert.match(节拍源码, /生成文案\.size !== 候选\.length[\s\S]{0,160}throw new Error/);
});
