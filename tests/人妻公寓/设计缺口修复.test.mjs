/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
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
const { 特殊场景表, 特殊场景锁定状态 } = require('../../src/人妻公寓/stageConfig.ts');
const { 取货架, 购买, 送礼 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 赠礼丈夫 } = require('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts');
const { 母亲撞见检测, 母亲撞见风险 } = require('../../src/人妻公寓/脚本/游戏逻辑/打断系统.ts');
const { 仅你可见触发参数 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机触发参数.ts');

function 建数据(...门牌们) {
  return Schema.parse({
    户: Object.fromEntries(门牌们.map(门牌 => [门牌, 创建户节点(0)])),
    现金: 9999,
  });
}

test.beforeEach(() => {
  chatVars = {};
});

test('特殊场景页签展示全部九场，未满足前置时保留锁定原因且后端拒绝购买', () => {
  const data = 建数据('101', '102', '201', '202', '301', '302');
  data.户['101'].妻.当前阶段 = 3;
  const 场景页 = 取货架(data).find(页 => 页.页签 === '特殊场景');
  const 九场 = Object.keys(特殊场景表);

  assert.ok(场景页);
  assert.deepEqual(九场.filter(id => 场景页.商品.some(商品 => 商品.id === id)).sort(), [...九场].sort());
  for (const id of 九场) {
    const 状态 = 特殊场景锁定状态(data, id);
    assert.equal(状态.已解锁, false, `${id} 在空前置存档中不应误解锁`);
    assert.ok(状态.缺少.length > 0, `${id} 必须明确告诉玩家缺什么`);
  }

  const 购买前现金 = data.现金;
  const result = 购买(data, '大扫除日');
  assert.equal(result.成功, false);
  assert.match(result.提示, /还需|缺少|L4|沉沦/);
  assert.equal(data.现金, 购买前现金);
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
