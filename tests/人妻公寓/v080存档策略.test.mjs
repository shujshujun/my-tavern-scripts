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
// ts-node 的 CommonJS 扩展名解析会把 `../../schema` 优先指向同名 schema.json；
// 生产 bundler 按 TypeScript 模块解析。这里只拦截 mvuIO 的该依赖，保证行为测试命中真实 schema.ts 导出。
const Module = require('node:module');
const 原加载 = Module._load;
Module._load = function 测试加载(request, parent, isMain) {
  if (request === '../../schema' && String(parent?.filename ?? '').endsWith('mvuIO.ts')) return schema模块;
  return 原加载.call(this, request, parent, isMain);
};
const { 读最近有效stat } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
Module._load = 原加载;
const { 同步阶段线路 } = require('../../src/人妻公寓/脚本/游戏逻辑/阶段线路系统.ts');
const initvar = YAML.parse(readFileSync(new URL('../../src/人妻公寓/世界书/变量/initvar.yaml', import.meta.url), 'utf8'));
const schema源码 = readFileSync(new URL('../../src/人妻公寓/schema.ts', import.meta.url), 'utf8');
const index源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 机器协议源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/游戏机器协议.ts', import.meta.url), 'utf8');
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
const 档案卡源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url),
  'utf8',
);

test('当前版本接受数据版本7/8/9存档并拒绝未知版本与损坏结构', () => {
  const { 当前MVU数据版本, 验证当前MVU存档版本 } = schema模块;
  assert.equal(当前MVU数据版本, 9);
  assert.doesNotThrow(() => 验证当前MVU存档版本(initvar));
  assert.doesNotThrow(() => 验证当前MVU存档版本({}));
  assert.doesNotThrow(() => 验证当前MVU存档版本({ 系统: { _数据版本: 7 } }));
  assert.doesNotThrow(() => 验证当前MVU存档版本({ 系统: { _数据版本: 8 } }));
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 6 } }), /数据版本 7、8 和 9/);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 10 } }), /数据版本 7、8 和 9/);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _序章完成: true } }), /数据版本 7、8 和 9/);
  let 未来档错误;
  try {
    验证当前MVU存档版本({ 系统: { _数据版本: 10 } });
  } catch (error) {
    未来档错误 = error;
  }
  assert.ok(未来档错误 instanceof Error);
  assert.doesNotMatch(未来档错误.message, /v0\.86|v0\.85/, '坏档提示不得继续手写过期角色卡小版本');
  assert.match(未来档错误.message, /当前版本/);
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
    assert.throws(() => 验证当前MVU存档版本(坏存档), /存档结构损坏|不兼容其他版本存档/);
  }
  assert.equal(schema模块.Schema.parse({}).系统._数据版本, 当前MVU数据版本, '内部默认 Schema 构造仍须合法');
});

test('非空但截断的受支持版本存档必须拒绝，不能被 Schema 默认值伪装成新局', () => {
  const { 验证可继续MVU存档结构 } = schema模块;
  assert.equal(typeof 验证可继续MVU存档结构, 'function', '版本兼容与可继续结构必须是两道独立门');
  assert.doesNotThrow(() => 验证可继续MVU存档结构(initvar));
  assert.throws(
    () => 验证可继续MVU存档结构({ 系统: { _数据版本: 9 } }),
    /结构损坏|缺少.*户|不完整/,
    '仅剩版本号的截断 v9 不能把现金、户、资源、背包和世界钟全部补回默认值',
  );
});

test('可继续存档结构覆盖玩家资源与已入住户，不能让子树截断后被默认重建', () => {
  const { Schema, 创建户节点, 验证可继续MVU存档结构 } = schema模块;
  const 完整 = Schema.parse({ ...initvar, 户: { 101: 创建户节点(0) } });
  assert.doesNotThrow(() => 验证可继续MVU存档结构(完整));

  const 截断样本 = [
    ['玩家资源.精力', data => delete data.玩家资源.精力],
    ['玩家资源.精力.当前值', data => delete data.玩家资源.精力.当前值],
    ['户.101.妻', data => delete data.户['101'].妻],
    ['户.101.妻.好感值', data => delete data.户['101'].妻.好感值],
    ['户.101.夫.疑心值', data => delete data.户['101'].夫.疑心值],
    ['户.101._入住时段', data => delete data.户['101']._入住时段],
  ];
  for (const [路径, 截断] of 截断样本) {
    const data = structuredClone(完整);
    截断(data);
    assert.throws(
      () => 验证可继续MVU存档结构(data),
      /结构损坏|缺少|不完整/,
      `${路径} 缺失时不能交给 Schema 默认重建`,
    );
  }
});

test('可继续存档结构不抢 Schema 的明确数值字符串归一职责', () => {
  const { Schema, 验证可继续MVU存档结构 } = schema模块;
  const data = structuredClone(initvar);
  data.现金 = '500';
  data.胜任度 = '80';
  data.风闻 = '0';
  data.玩家资源.精力.当前值 = '8';
  data.系统._绝对时段 = '0';

  assert.doesNotThrow(() => 验证可继续MVU存档结构(data));
  const parsed = Schema.parse(data);
  assert.equal(parsed.现金, 500);
  assert.equal(parsed.胜任度, 80);
  assert.equal(parsed.风闻, 0);
  assert.equal(parsed.玩家资源.精力.当前值, 8);
  assert.equal(parsed.系统._绝对时段, 0);
});

test('最近有效读取会跳过截断尾楼并回退完整快照，不能让非空毒快照挡住真值', () => {
  const 原Mvu存在 = Object.prototype.hasOwnProperty.call(globalThis, 'Mvu');
  const 原Mvu = globalThis.Mvu;
  const 原ST存在 = Object.prototype.hasOwnProperty.call(globalThis, 'SillyTavern');
  const 原ST = globalThis.SillyTavern;
  const 完整 = structuredClone(initvar);
  const 截断 = { 系统: { _数据版本: 9 } };
  try {
    globalThis.SillyTavern = { chat: [{}, {}] };
    globalThis.Mvu = {
      getMvuData: ({ message_id }) => ({ stat_data: message_id === 1 ? 截断 : 完整 }),
    };
    assert.equal(读最近有效stat(), 完整, '尾楼损坏时必须继续向前找，而不是返回会被默认化的截断对象');
  } finally {
    if (原Mvu存在) globalThis.Mvu = 原Mvu;
    else delete globalThis.Mvu;
    if (原ST存在) globalThis.SillyTavern = 原ST;
    else delete globalThis.SillyTavern;
  }
});

test('最近十楼只有非空损坏快照时硬拒绝，不能静默当作全新对话', () => {
  const 原Mvu存在 = Object.prototype.hasOwnProperty.call(globalThis, 'Mvu');
  const 原Mvu = globalThis.Mvu;
  const 原ST存在 = Object.prototype.hasOwnProperty.call(globalThis, 'SillyTavern');
  const 原ST = globalThis.SillyTavern;
  try {
    globalThis.SillyTavern = { chat: [{}] };
    globalThis.Mvu = { getMvuData: () => ({ stat_data: { 系统: { _数据版本: 9 } } }) };
    assert.throws(() => 读最近有效stat(), /只找到损坏|结构损坏/);
  } finally {
    if (原Mvu存在) globalThis.Mvu = 原Mvu;
    else delete globalThis.Mvu;
    if (原ST存在) globalThis.SillyTavern = 原ST;
    else delete globalThis.SillyTavern;
  }
});

test('尾楼明确为未来版本时硬拒绝，不能回退旧楼伪装成兼容存档', () => {
  const 原Mvu存在 = Object.prototype.hasOwnProperty.call(globalThis, 'Mvu');
  const 原Mvu = globalThis.Mvu;
  const 原ST存在 = Object.prototype.hasOwnProperty.call(globalThis, 'SillyTavern');
  const 原ST = globalThis.SillyTavern;
  const 未来版本 = structuredClone(initvar);
  未来版本.系统._数据版本 = 10;
  try {
    globalThis.SillyTavern = { chat: [{}, {}] };
    globalThis.Mvu = {
      getMvuData: ({ message_id }) => ({ stat_data: message_id === 1 ? 未来版本 : initvar }),
    };
    assert.throws(
      () => 读最近有效stat(),
      /仅兼容数据版本 7、8 和 9|当前存档版本为 10/,
      '明确未来版本可能含当前代码不知道的新语义，不能静默回退并允许旧代码覆盖它',
    );
  } finally {
    if (原Mvu存在) globalThis.Mvu = 原Mvu;
    else delete globalThis.Mvu;
    if (原ST存在) globalThis.SillyTavern = 原ST;
    else delete globalThis.SillyTavern;
  }
});

test('v7/v8 旧档的布尔字符串与 1/0 按字面归一，false 不得反转为 true', () => {
  const v7 = {
    系统: {
      _数据版本: 7,
      _序章完成: 'false',
      _母亲入列: 'false',
      _母亲首夜第二幕: 'false',
      _荣耀洞点破: 'true',
      _荣耀洞夫: '1',
      _待接来电: { 紧急: '0' },
      _摄像头布设: { 垃圾房: 'false' },
    },
    玩家资源: { 保护准备: 'false' },
    户: {
      101: {
        妻: {
          裂缝: { 已确认: 'false' },
          _阶段性癖已支付: 'false',
        },
      },
    },
  };

  const data = schema模块.Schema.parse(v7);

  assert.equal(data.系统._序章完成, false);
  assert.equal(data.系统._母亲入列, false);
  assert.equal(data.系统._母亲首夜第二幕, false);
  assert.equal(data.系统._荣耀洞点破, true);
  assert.equal(data.系统._荣耀洞夫, true);
  assert.equal(data.系统._待接来电.紧急, false);
  assert.equal(data.系统._摄像头布设.垃圾房, false);
  assert.equal(data.玩家资源.保护准备, false);
  assert.equal(data.户['101'].妻.裂缝.已确认, false);
  assert.equal(data.户['101'].妻._阶段性癖已支付, false);
});

test('v7→v9 迁移幂等补齐新机制字段且不改写原对象与原有数值', () => {
  const { Schema, 创建户节点, 迁移MVU存档到当前版本 } = schema模块;
  const v7 = Schema.parse({
    ...initvar,
    户: { 101: 创建户节点(12), 102: 创建户节点(18) },
  });
  v7.系统._数据版本 = 7;
  v7.系统._上次性爱结果.场次标识 = '旧场次';
  delete v7.系统._上次性爱结果.收尾对象门牌;
  delete v7.系统._孕情初见评价楼;
  v7.户['101'].妻.好感值 = 73;
  v7.户['101'].妻._冷落余波.状态 = '安抚中';
  delete v7.户['101'].妻._冷落余波.送礼安抚日;
  delete v7.户['101'].妻._冷落余波.当日送礼安抚次数;
  delete v7.户['101'].妻._怀孕;
  delete v7.户['102'].妻._怀孕;
  const 原始副本 = structuredClone(v7);

  const 第一次 = 迁移MVU存档到当前版本(v7);
  const 第二次 = 迁移MVU存档到当前版本(第一次);
  const data = Schema.parse(第一次);

  assert.deepEqual(v7, 原始副本, '迁移必须先复制，失败时不能留下半迁移原档');
  assert.deepEqual(第二次, 第一次, '已经迁移到 v9 后重复执行不得产生新变化');
  assert.equal(data.系统._数据版本, 9);
  assert.equal(data.系统._上次性爱结果.场次标识, '旧场次');
  assert.equal(data.系统._上次性爱结果.收尾对象门牌, '');
  assert.deepEqual(data.系统._孕情初见评价楼, {});
  assert.equal(data.户['101'].妻.好感值, 73);
  assert.equal(data.户['101'].妻._冷落余波.状态, '安抚中');
  assert.equal(data.户['101'].妻._冷落余波.送礼安抚日, -1);
  assert.equal(data.户['101'].妻._冷落余波.当日送礼安抚次数, 0);
  for (const 门牌 of ['101', '102']) {
    assert.equal(data.户[门牌].妻._怀孕.状态, '未孕');
    assert.equal(data.户[门牌].妻._怀孕.受孕绝对时段, -1);
    assert.equal(data.户[门牌].妻._怀孕.丈夫登门.状态, '无');
    assert.equal(data.户[门牌].妻._怀孕.丈夫登门.已结算, false);
  }
});

test('v0.82(v8)旧档缺少家庭计划时补为未开始，并保留已经存在的夏乔孕情', () => {
  const { Schema, 创建户节点, 迁移MVU存档到当前版本 } = schema模块;
  const v8 = Schema.parse({
    ...initvar,
    户: { 101: 创建户节点(12) },
  });
  v8.系统._数据版本 = 8;
  delete v8.系统._家庭计划;
  Object.assign(v8.户['101'].妻._怀孕, {
    状态: '已受孕',
    受孕绝对时段: 6,
    预计告知绝对时段: 48,
    受孕场次标识: 'rq082-existing-pregnancy',
  });
  const 原始副本 = structuredClone(v8);

  const data = Schema.parse(迁移MVU存档到当前版本(v8));

  assert.deepEqual(v8, 原始副本, 'v0.82 原档不得被原地改写');
  assert.equal(data.系统._数据版本, 9);
  assert.deepEqual(data.系统._家庭计划, { 阶段: '未开始', 最早继续日: -1, 完成楼层: -1 });
  assert.equal(data.户['101'].妻._怀孕.状态, '已受孕', '兼容升级不能回滚玩家旧档中已经发生的孕情');
  assert.equal(data.户['101'].妻._怀孕.受孕场次标识, 'rq082-existing-pregnancy');
});

test('启动链冻结聊天身份并注册 MVU 提交校验，切聊时旧启动任务不得写入新聊天', () => {
  const 启动起 = index源码.indexOf('$(() => {');
  const 挂载起 = index源码.indexOf('function 挂载监听()', 启动起);
  const 启动段 = index源码.slice(启动起, 挂载起);
  assert.ok(启动起 >= 0 && 挂载起 > 启动起);
  assert.match(启动段, /const 启动聊天ID = 当前聊天ID\(\)/);
  assert.match(启动段, /const 启动聊天引用 = SillyTavern\.chat/);
  assert.match(启动段, /const 启动时间线世代 = 当前时间线切换世代\(\)/);
  assert.match(启动段, /登记MVU提交校验\(启动仍有效\)/);
  assert.match(
    启动段,
    /finally \{\s*if \(!启动已完成\) 停止当前脚本心跳\(\);\s*取消启动提交校验\(\)/,
    '启动失败先撤销本实例心跳，再无条件注销 MVU 提交校验；成功启动保留唯一心跳所有者',
  );
  assert.match(启动段, /同步入住世界书条目\(data, 启动仍有效\)/);
  assert.match(启动段, /同步整表视图\(data, 启动仍有效\)/);
});

test('启动链在监听挂载前把 v7 原子迁移并写回当前尾楼', () => {
  assert.match(schema源码, /迁移MVU存档到当前版本/);
  assert.match(index源码, /需要迁移MVU存档/);
  assert.match(index源码, /读取最近有效\(\)/);
  assert.match(index源码, /脚本写入\([^)]*记录成长:\s*false/s);
  assert.doesNotMatch(index源码, /rq0\.54|检测到临时尾楼回归|半迁移/);
});

test('派生显示字段不入存档，v0.80 阶段线路预约状态继续保留', () => {
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
  assert.equal(data.系统._数据版本, 9);
  assert.doesNotMatch(schema源码 + index源码 + 回合源码 + 客户端源码, /_时段偏移楼|_上次杀时间楼层|_入住楼层/);
  assert.match(时钟源码, /data\.系统\._绝对时段 = 旧时间\.绝对时段 \+ 时段数/);
  assert.match(入住源码, /创建户节点\(绝对时段\)/);
  assert.match(荣耀洞源码, /系\._荣耀洞上次时段 = 绝对时段/);
  // A5b 拆分后：档案派生与模板已随档案卡迁入 components/档案卡.vue
  assert.match(档案卡源码, /阶段标题: 阶段标题\(妻\.当前阶段, m\)/);
  assert.match(档案卡源码, /气质描述: 户静态表\[m\]\.初始\?\.气质描述 \?\? ''/);
  assert.match(档案卡源码, /v-if="选中档案\.妻\.裂缝\.已确认"/);
});

test('写而不读的聊天空壳与旧摄像头兼容读取已移除', () => {
  assert.doesNotMatch(回合源码, /_行动锚窗|行动锚窗键|开行动锚窗/);
  assert.match(回合源码, /const 行动锚\s*=/);
  assert.match(回合源码, /content: 快照 \+ 行动锚/);
  assert.doesNotMatch(守护源码, /镜像结构\s*\{[\s\S]*?^\s{2}楼层:/m);
  assert.doesNotMatch(侦探源码, /_摄像头\b|legacy/);
  assert.doesNotMatch(客户端源码, /_摄像头\b|旧局 chat 变量/);
});

test('v0.80 仍有业务消费者的状态继续保留', () => {
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

test('v0.80 已移除字段只有在确认空壳或明确规则替换后才删除', () => {
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
  assert.match(机器协议源码, /replace\(\/<行为等级\(\?:\\s\[\^>\]\*\)\?>/);
});

test('v0.80 现行资源与特殊场景字段不得按旧兼容空壳删除', () => {
  const data = schema模块.Schema.parse(initvar);
  assert.equal(Object.hasOwn(data.系统, '_性爱场景'), true);
  assert.equal(Object.hasOwn(data.系统, '_上次性爱结果'), true);
  assert.equal(Object.hasOwn(data.系统._性爱场景, '开始楼层'), true);
  assert.equal(Object.hasOwn(data.系统._性爱场景, '本场等级加成'), true);
  assert.equal(Object.hasOwn(data.系统._特殊场景, '地点'), true);
  assert.equal(Object.hasOwn(data.系统._特殊场景.交互, '类型'), true);

  const 带参与者 = schema模块.Schema.parse({
    户: {},
    系统: { _数据版本: 8, _性爱场景: { 参与者: { 101: {} } } },
  });
  assert.equal(Object.hasOwn(带参与者.系统._性爱场景.参与者['101'], '等级加成已用'), true);
  const 坏加成 = schema模块.Schema.parse({
    户: {},
    系统: { _数据版本: 8, _性爱场景: { 本场等级加成: 99 } },
  });
  assert.equal(坏加成.系统._性爱场景.本场等级加成, 2);
  assert.match(资源源码, /if \(!项\.等级加成已用\) 项\.等级加成已用 = true;/);
});
