/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let chatVars = {};
globalThis.getVariables = () => chatVars;
globalThis.insertOrAssignVariables = patch => {
  chatVars = lodash.merge({}, chatVars, patch);
};
globalThis.getLastMessageId = () => 42;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  查裂缝,
  是母亲破墙服饰,
  道具表,
  特殊场景表,
  特殊场景占位ID列表,
  特殊场景锁定状态,
} = require('../../src/人妻公寓/stageConfig.ts');
const { 取货架, 购买, 送礼 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 请求晋阶 } = require('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts');
const { 等待晋阶镜像写入 } = require('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts');
const { 赠礼丈夫 } = require('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts');
const { 母亲撞见检测, 母亲撞见风险 } = require('../../src/人妻公寓/脚本/游戏逻辑/打断系统.ts');
const { 仅你可见触发参数 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机触发参数.ts');
const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 背包源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/背包.vue', import.meta.url), 'utf8');
const 档案源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url), 'utf8');

function 建数据(...门牌们) {
  return Schema.parse({
    户: Object.fromEntries(门牌们.map(门牌 => [门牌, 创建户节点(0)])),
    现金: 9999,
  });
}

test.beforeEach(() => {
  chatVars = {};
});

test('特殊剧情货架保留录像带、静音会议、借种、肉偿账本四个实装场景，另外六场保持只读占位', () => {
  const data = 建数据('101', '102', '201', '202', '301', '302');
  data.户['101'].妻.当前阶段 = 3;
  const 场景页 = 取货架(data).find(页 => 页.页签 === '特殊场景');
  const 十场 = Object.keys(特殊场景表);
  const 保持实装 = ['录像带', '静音会议', '借种', '肉偿账本'];

  assert.ok(场景页);
  assert.equal(十场.length, 10);
  assert.deepEqual(十场.filter(id => 场景页.商品.some(商品 => 商品.id === id)).sort(), [...十场].sort());
  assert.deepEqual([...特殊场景占位ID列表].sort(), ['大扫除日', '部位评比', '合拍', '家宴', '制服夜巡', '衣柜'].sort());

  for (const id of 保持实装) {
    const 配 = 特殊场景表[id];
    assert.notEqual(配.待设计, true, `${id} 必须保持实装`);
    assert.ok(配.价格 > 0, `${id} 必须保留原价`);
    assert.ok(配.剧情, `${id} 必须保留现有剧情`);
    assert.equal(道具表[id].特殊剧情占位, undefined);
  }

  for (const id of 特殊场景占位ID列表) {
    const 配 = 特殊场景表[id];
    assert.equal(配.待设计, true, `${id} 必须是待设计占位`);
    assert.equal(配.价格, 0);
    assert.equal(配.前置(data), false);
    assert.deepEqual(配.参与(data), []);
    assert.equal(配.剧情, '');
    assert.equal(配.启动, undefined);
    assert.equal(配.允许时段, undefined);
    assert.equal(配.接入主线, undefined);
    assert.equal(配.结算, undefined);
    assert.equal(道具表[id].特殊剧情占位, true);

    const 状态 = 特殊场景锁定状态(data, id);
    assert.deepEqual(状态, { 已解锁: false, 缺少: ['特殊剧情正在重新设计'] });

    const 原样 = structuredClone(data);
    const result = 购买(data, id);
    assert.equal(result.成功, false);
    assert.match(result.提示, /设计待完成.*不会扣款、入包或启动剧情/);
    assert.deepEqual(data, 原样, `${id} 占位购买不得产生任何变量副作用`);
  }
});

test('肉偿账本保持原价、原结算与阶段线路接线所需完成标记', () => {
  const data = 建数据('201');
  data.户['201'].妻.当前阶段 = 4;
  data.户['201']._欠租笔数 = 1;
  const 原现金 = data.现金;

  const result = 购买(data, '肉偿账本');

  assert.equal(result.成功, true);
  assert.equal(data.现金, 原现金 - 800);
  assert.equal(data.户['201']._欠租笔数, 0);
  assert.equal(data.系统._已完成特殊场景.includes('肉偿账本'), true);
  assert.match(data.系统._待发送事件, /特殊场景·肉偿账本/);
});

test('母亲破墙礼物只追加自己的正戏，不覆盖已经排队的事件', async () => {
  const data = 建数据('302');
  data.户['302'].妻.裂缝.已确认 = true;
  data.背包.push('碎花连衣裙');
  data.系统._待发送事件 = '【旧事件】另一桩尚未演出的正戏';

  const result = await 送礼(data, '碎花连衣裙', '302');

  assert.equal(result.成功, true);
  assert.match(data.系统._待发送事件, /^【旧事件】另一桩尚未演出的正戏\|/);
  assert.match(data.系统._待发送事件, /【破墙】/);
});

test('母亲阶段0只有确认裂缝后的低档外装或妆容会消耗并晋阶，结果可持久化', async () => {
  const data = 建数据('302');
  data.户['302'].妻.裂缝.已确认 = true;
  data.背包.push('碎花连衣裙');

  assert.equal(是母亲破墙服饰('碎花连衣裙'), true);
  assert.equal(是母亲破墙服饰('烈色口红'), true);
  assert.equal(是母亲破墙服饰('蕾丝套装'), false);
  assert.equal(是母亲破墙服饰('开叉旗袍'), false);
  assert.equal(是母亲破墙服饰('女仆装'), false);
  const result = await 送礼(data, '碎花连衣裙', '302');
  await result.提交后?.();
  await 等待晋阶镜像写入();

  assert.equal(result.成功, true);
  assert.equal(data.户['302'].妻.当前阶段, 1);
  assert.equal(data.背包.includes('碎花连衣裙'), false);
  assert.match(data.系统._待发送事件, /【破墙】/);
  assert.equal(Schema.parse(data).户['302'].妻.当前阶段, 1);
  assert.equal(chatVars.人妻公寓_晋阶镜像.户['302'].阶段, 1);
  assert.equal(data.户['302'].妻._阶段线路.目标阶段, 2);

  const 已排事件 = data.系统._待发送事件;
  const 重复提交 = await 送礼(data, '碎花连衣裙', '302');
  assert.equal(重复提交.成功, false);
  assert.equal(data.户['302'].妻.当前阶段, 1);
  assert.equal(data.系统._待发送事件, 已排事件);
});

test('母亲阶段0未确认裂缝或送错服饰时明确拒绝，物品和阶段原样保留', async () => {
  for (const [名称, 已确认, 道具] of [
    ['裂缝未确认', false, '碎花连衣裙'],
    ['内衣不属于破墙礼物', true, '蕾丝套装'],
    ['L4外装过界', true, '开叉旗袍'],
  ]) {
    const data = 建数据('302');
    data.户['302'].妻.裂缝.已确认 = 已确认;
    data.背包.push(道具);

    const result = await 送礼(data, 道具, '302');

    assert.equal(result.成功, false, 名称);
    assert.equal(result.变动, undefined, 名称);
    assert.equal(data.户['302'].妻.当前阶段, 0, 名称);
    assert.deepEqual(data.背包, [道具], 名称);
    assert.equal(data.系统._待发送事件, '', 名称);
    assert.match(result.提示, /先|不会|收回来|看懂/, 名称);
  }
});

test('阶段0不能从档案晋阶旁路越过赠礼，但普通住户的正确开门礼仍能晋阶', async () => {
  const 旁路局 = 建数据('302');
  旁路局.户['302'].妻.裂缝.已确认 = true;
  const 旁路 = 请求晋阶(旁路局, '302');
  assert.equal(旁路.成功, false);
  assert.equal(旁路局.户['302'].妻.当前阶段, 0);
  assert.match(旁路.消息, /礼物|当面|打开/);

  const 正常局 = 建数据('101');
  正常局.户['101'].妻.裂缝.已确认 = true;
  const 正确礼物 = 查裂缝('101').对症礼物[0];
  正常局.背包.push(正确礼物);
  const 正常 = await 送礼(正常局, 正确礼物, '101');
  assert.equal(正常.成功, true);
  assert.equal(正常局.户['101'].妻.当前阶段, 1);
  assert.equal(正常局.背包.includes(正确礼物), false);
});

test('背包在手机上直接显示母亲赠衣资格，档案不再展示阶段0晋阶按钮', () => {
  assert.match(App源, /是母亲破墙服饰/);
  assert.match(App源, /先从裂缝线索看懂她/);
  assert.match(App源, /她不会把这件当成自己的/);
  assert.match(背包源, /妻\.可送 === false/);
  assert.match(背包源, /妻\.提示/);
  assert.match(档案源, /选中档案\.妻\.当前阶段 > 0/);
});

test('香烟与球赛票都能当面送给在家的丈夫，消耗道具并提供不同信任加成', () => {
  const 香烟局 = 建数据('101');
  香烟局.系统._绝对时段 = 0;
  香烟局.背包.push('香烟');
  const 烟 = 赠礼丈夫(香烟局, '101', '香烟');
  assert.equal(香烟局.户['101'].夫.信任值, 3);
  assert.equal(香烟局.背包.includes('香烟'), false);
  assert.match(烟.事件, /香烟/);

  const 球票局 = 建数据('101');
  球票局.系统._绝对时段 = 0;
  球票局.背包.push('球赛票');
  const 票 = 赠礼丈夫(球票局, '101', '球赛票');
  assert.equal(球票局.户['101'].夫.信任值, 10);
  assert.equal(球票局.背包.includes('球赛票'), false);
  assert.match(票.事件, /球赛票/);
  assert.notEqual(烟.提示, 票.提示);

  const 外出局 = 建数据('101');
  外出局.系统._绝对时段 = 1;
  外出局.背包.push('球赛票');
  assert.match(赠礼丈夫(外出局, '101', '球赛票').提示, /不在家|不在/);
  assert.deepEqual(外出局.背包, ['球赛票']);
});

test('母亲撞见风险读取作息、楼层与公私密环境，首次命中只演差点撞见教学且不扣胜任度', () => {
  const data = 建数据('101', '302');
  data.户['101'].妻.当前阶段 = 2;
  data.系统._绝对时段 = 0; // 周一早上，母亲基础作息在垃圾房

  const 同地点 = 母亲撞见风险(data, '101', '垃圾房', 1);
  const 私户 = 母亲撞见风险(data, '101', '101', 1);
  assert.ok(同地点.概率 > 私户.概率);
  assert.equal(同地点.母亲位置, '垃圾房');
  assert.match(同地点.环境, /公共|非私密/);
  assert.match(私户.环境, /私密/);

  const 原胜任 = data.胜任度;
  let 触发 = false;
  for (let 时段 = 0; 时段 < 84; 时段 += 1) {
    data.系统._绝对时段 = 时段;
    const 风险 = 母亲撞见风险(data, '101', '垃圾房', 10);
    if (风险.概率 <= 0) continue;
    母亲撞见检测(data, '101', 1, 99, 10, '垃圾房');
    if (!data.系统._待发送事件) continue;
    触发 = true;
    break;
  }
  assert.equal(触发, true);
  assert.equal(data.胜任度, 原胜任, '第一次只教学，不执行胜任惩罚');
  assert.match(data.系统._待发送事件, /母亲差点撞见/);
  assert.match(data.系统._待发送事件, /事件在场妻:101,302/);
  assert.match(data.系统._待发送事件, /地点=垃圾房|地点:垃圾房/);
});

test('L5仅你可见拥有严格高于L4的触发节奏', () => {
  const l4 = 仅你可见触发参数(4);
  const l5 = 仅你可见触发参数(5);
  assert.ok(l5.概率 > l4.概率);
  assert.ok(l5.冷却时段 < l4.冷却时段);
});
