/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const YAML = require('yaml');
const schema模块 = require('../../src/人妻公寓/schema.ts');
const { 同步阶段线路 } = require('../../src/人妻公寓/脚本/游戏逻辑/阶段线路系统.ts');
const initvar = YAML.parse(readFileSync(new URL('../../src/人妻公寓/世界书/变量/initvar.yaml', import.meta.url), 'utf8'));
const schema源码 = readFileSync(new URL('../../src/人妻公寓/schema.ts', import.meta.url), 'utf8');
const index源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 资源源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts', import.meta.url), 'utf8');
const 线路源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/阶段线路系统.ts', import.meta.url), 'utf8');
const 守护源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts', import.meta.url), 'utf8');
const 侦探源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts', import.meta.url), 'utf8');
const 商店源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts', import.meta.url), 'utf8');
const 经济源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts', import.meta.url), 'utf8');
const 荣耀洞源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/荣耀洞.ts', import.meta.url), 'utf8');
const 时钟源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts', import.meta.url), 'utf8');
const 入住源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/入住系统.ts', import.meta.url), 'utf8');
const 稽查源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/稽查系统.ts', import.meta.url), 'utf8');
const 客户端源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

test('0.62 后只接受当前 MVU 存档，不再逐版迁移旧档', () => {
  const { 当前MVU数据版本, 验证当前MVU存档版本 } = schema模块;
  assert.equal(当前MVU数据版本, 7);
  assert.doesNotThrow(() => 验证当前MVU存档版本(initvar));
  assert.doesNotThrow(() => 验证当前MVU存档版本({}));
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 6 } }), /0\.62 后不兼容旧存档/);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _序章完成: true } }), /0\.62 后不兼容旧存档/);
  for (const 坏存档 of [
    null,
    'v7',
    7,
    [],
    [7],
    true,
    new Date(),
    new Map(),
    /伪存档/,
    new (class 伪存档 {})(),
  ]) {
    assert.throws(() => 验证当前MVU存档版本(坏存档), /存档结构损坏|不兼容旧存档/);
  }
  assert.equal(schema模块.Schema.parse({}).系统._数据版本, 当前MVU数据版本, '内部默认 Schema 构造仍须合法');
});

test('Schema 与启动链不再包含旧档迁移和 rq0.54 尾楼恢复', () => {
  assert.doesNotMatch(schema源码, /MVU迁移|聊天迁移|迁移MVU原始数据|迁移聊天原始数据|判定MVUv4时间迁移|半迁移/);
  assert.doesNotMatch(index源码, /rq0\.54|需要落迁移|检测到临时尾楼回归|聊天变量已迁移/);
});

test('派生显示字段不入存档，0.62 后阶段线路预约状态继续保留', () => {
  const data = schema模块.Schema.parse(initvar);
  const 户 = schema模块.创建户节点(0);
  const 妻 = 户.妻;
  assert.equal(Object.hasOwn(妻, '阶段标题'), false);
  assert.equal(Object.hasOwn(妻, '气质描述'), false);
  assert.equal(Object.hasOwn(妻, '情报可见'), false);
  assert.equal(妻._阶段线路.预约时段, '');
  assert.equal(妻._阶段线路.预约地点, '');
  妻._阶段线路.预约时段 = '晚上';
  妻._阶段线路.预约地点 = '天台';
  妻.当前阶段 = 1;
  同步阶段线路(妻, 6);
  assert.equal(妻._阶段线路.预约时段, '');
  assert.equal(妻._阶段线路.预约地点, '');
  assert.match(线路源码, /允许时段/);
  assert.match(线路源码, /当前\.匹配\(事件\)/);
  assert.match(线路源码, /列出阶段线路候选详情/);
  assert.equal(Object.hasOwn(户, '_入住楼层'), false);
  assert.equal(户._入住时段, 0);
  assert.equal(Object.hasOwn(data.系统, '_荣耀洞上次楼'), false);
  assert.equal(data.系统._荣耀洞上次时段, -999);
  assert.equal(data.系统._数据版本, 7);
  assert.doesNotMatch(schema源码 + index源码 + 回合源码 + 客户端源码, /_时段偏移楼|_上次杀时间楼层|_入住楼层/);
  assert.match(时钟源码, /data\.系统\._绝对时段 = 旧时间\.绝对时段 \+ 时段数/);
  assert.match(入住源码, /创建户节点\(绝对时段\)/);
  assert.match(荣耀洞源码, /系\._荣耀洞上次时段 = 绝对时段/);
  assert.match(客户端源码, /阶段标题: 阶段标题\(妻\.当前阶段, m\)/);
  assert.match(客户端源码, /气质描述: 户静态表\[m\]\.初始\?\.气质描述 \?\? ''/);
  assert.match(客户端源码, /v-if="选中档案\.妻\.裂缝\.已确认"/);
});

test('写而不读的聊天空壳与旧摄像头兼容读取已移除', () => {
  assert.doesNotMatch(回合源码, /_行动锚窗|行动锚窗键|开行动锚窗/);
  assert.match(回合源码, /const 行动锚\s*=/);
  assert.match(回合源码, /content: 快照 \+ 行动锚/);
  assert.doesNotMatch(守护源码, /镜像结构\s*\{[\s\S]*?^\s{2}楼层:/m);
  assert.doesNotMatch(侦探源码, /_摄像头\b|legacy/);
  assert.doesNotMatch(客户端源码, /_摄像头\b|旧局 chat 变量/);
});

test('rq0.62 已发布且仍有业务消费者的状态继续保留', () => {
  const data = schema模块.Schema.parse(initvar);
  const 户 = schema模块.创建户节点(0);

  assert.deepEqual(户.妻._穿戴锁, []);
  assert.equal(data.系统._难度, '标准');
  assert.deepEqual(data.系统._摄像头布设, {});
  assert.equal(户._上次收租期, -1);
  assert.equal(户._欠租笔数, 0);
  assert.equal(data.系统._上次上交期, -1);
  assert.equal(data.系统._通牒期, -1);
  assert.equal(data.系统._荣耀洞拍, -1);
  assert.equal(data.系统._荣耀洞动态时段, -1);

  assert.match(商店源码, /妻\._穿戴锁\.push\(槽\)/);
  assert.match(守护源码, /妻快照\._穿戴锁\.includes\(槽\)/);
  assert.match(回合源码, /data\.系统\._难度 = 档/);
  assert.match(经济源码, /难度表\[data\.系统\._难度\]/);
  assert.match(经济源码, /节点\._欠租笔数 \+= 笔数/);
  assert.match(侦探源码, /data\.系统\._摄像头布设\[门牌号\] = true/);
  assert.match(荣耀洞源码, /系\._荣耀洞拍 \+= 1/);
});

test('rq0.62 旧字段只有在确认空壳或明确规则替换后才移除', () => {
  const data = schema模块.Schema.parse(initvar);
  for (const 字段 of ['_连续违规', '_上次违规楼层', '_时段偏移楼', '_上次杀时间楼层', '_系统操作中']) {
    assert.equal(Object.hasOwn(data.系统, 字段), false, `${字段} 不应继续占用新局存档`);
  }
  assert.doesNotMatch(稽查源码, /结算违规代价|未遂余波指引|记违规清零/);
  assert.match(回合源码, /_反感连续/);
  assert.match(回合源码, /结算连续反感/);
  assert.match(回合源码, /新好感 < 旧好感 \? 上次次数 \+ 1 : 0/);
  assert.match(回合源码, /if \(次数 >= 3\)/);
  assert.match(回合源码, /无处罚拒绝正文/);
  assert.match(稽查源码, /二次生成仍越界时使用；不改玩家输入、不扣数值/);
  assert.doesNotMatch(守护源码, /interface 户镜像 \{[^}]*\b堕落:/s);
  assert.equal(data.系统._绝对时段, 0);
  assert.equal(data.玩家资源._小憩日, -1);
});

test('旧单值行为等级解析已由多角色尺度结果完整承接', () => {
  assert.doesNotMatch(稽查源码, /解析行为等级|旧等级正则/);
  assert.match(稽查源码, /export function 解析尺度判定/);
  assert.match(回合源码, /稽查\.角色\[CG门牌\]\?\.实际 \?\? 稽查\.最高实际等级/);
  assert.match(回合源码, /Object\.entries\(稽查\.角色\)/);
  assert.match(回合源码, /replace\(\/<行为等级\(\?:\\s\[\^>\]\*\)\?>/);
});

test('rq0.62 后正在完善的资源与特殊场景字段不得按旧兼容空壳删除', () => {
  const data = schema模块.Schema.parse(initvar);
  assert.equal(Object.hasOwn(data.系统, '_性爱场景'), true);
  assert.equal(Object.hasOwn(data.系统, '_上次性爱结果'), true);
  assert.equal(Object.hasOwn(data.系统._性爱场景, '开始楼层'), true);
  assert.equal(Object.hasOwn(data.系统._性爱场景, '本场等级加成'), true);
  assert.equal(Object.hasOwn(data.系统._特殊场景, '地点'), true);
  assert.equal(Object.hasOwn(data.系统._特殊场景.交互, '类型'), true);

  const 带参与者 = schema模块.Schema.parse({
    户: {},
    系统: { _数据版本: 7, _性爱场景: { 参与者: { 101: {} } } },
  });
  assert.equal(Object.hasOwn(带参与者.系统._性爱场景.参与者['101'], '等级加成已用'), true);
  const 坏加成 = schema模块.Schema.parse({
    户: {},
    系统: { _数据版本: 7, _性爱场景: { 本场等级加成: 99 } },
  });
  assert.equal(坏加成.系统._性爱场景.本场等级加成, 2);
  assert.match(资源源码, /if \(!项\.等级加成已用\) 项\.等级加成已用 = true;/);
});
