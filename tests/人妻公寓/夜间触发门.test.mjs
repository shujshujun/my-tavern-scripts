/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let 聊天变量 = {};
globalThis.getVariables = () => 聊天变量;
globalThis.insertOrAssignVariables = () => undefined;
globalThis.SillyTavern = { chat: [{}] };

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

// 商店只在“送礼”分支使用数据库桥；本组只测购买，隔离浏览器 raw-loader 依赖。
const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 查性癖, 查特殊场景, 经济配置 } = require('../../src/人妻公寓/stageConfig.ts');
const { 购买 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 使用运作 } = require('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts');
const { 装载性癖 } = require('../../src/人妻公寓/脚本/游戏逻辑/性癖系统.ts');
const { 请求晋阶 } = require('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts');
const { 读取阶段线路审计矩阵 } = require('../../src/人妻公寓/脚本/游戏逻辑/阶段线路系统.ts');
const { 六时段列表, 星期列表 } = require('../../src/人妻公寓/周作息.ts');
const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

function 建三户数据() {
  const data = Schema.parse({
    户: {
      101: 创建户节点(0),
      102: 创建户节点(0),
      201: 创建户节点(0),
    },
  });
  data.现金 = 10_000;
  for (const 节点 of Object.values(data.户)) 节点.妻.当前阶段 = 4;
  return data;
}

function 建单户数据(门牌 = '101') {
  const data = Schema.parse({ 户: { [门牌]: 创建户节点(0) } });
  data.户[门牌].妻.当前阶段 = 4;
  return data;
}

function 写入最终预约(data, 门牌, 目标阶段) {
  const 预约 = 读取阶段线路审计矩阵().find(
    节点 => 节点.门牌 === 门牌 && 节点.目标阶段 === 目标阶段 && 节点.节点 === 3,
  )?.预约;
  assert.ok(预约, `${门牌}-P${目标阶段} 缺少最终预约`);
  const 绝对时段 = 星期列表.indexOf(预约.星期) * 六时段列表.length + 六时段列表.indexOf(预约.时段);
  Object.assign(data.户[门牌].妻._阶段线路, {
    预约星期: 预约.星期,
    预约时段: 预约.时段,
    预约地点: 预约.地点,
    预约绝对时段: 绝对时段,
    预约丈夫状态: 预约.丈夫状态,
  });
  data.系统._绝对时段 = 绝对时段;
  聊天变量 = { _场景: { 房间id: 预约.地点 } };
}

test('制服夜巡只允许深夜购买并即时开演，其他时段不扣款也不排事件', () => {
  assert.deepEqual(查特殊场景('制服夜巡')?.允许时段, ['深夜']);

  for (const 钟 of [0, 1, 2, 3, 4]) {
    const 非深夜 = 建三户数据();
    非深夜.系统._绝对时段 = 钟;
    const 原样 = structuredClone(非深夜);
    const 拒绝 = 购买(非深夜, '制服夜巡');

    assert.equal(拒绝.成功, false);
    assert.match(拒绝.提示, /深夜/);
    assert.deepEqual(非深夜, 原样);
  }

  const 深夜 = 建三户数据();
  深夜.系统._绝对时段 = 5 + 42;
  const 原现金 = 深夜.现金;
  const 开演 = 购买(深夜, '制服夜巡');
  assert.equal(开演.成功, true);
  assert.equal(深夜.现金, 原现金 - 1700);
  assert.match(深夜.系统._待发送事件, /特殊场景·制服夜巡/);
});

test('露出癖首次开幕只允许深夜，其他时段拒绝时完整保留道具和人物状态', () => {
  assert.deepEqual(查性癖('露出癖')?.开幕允许时段, ['深夜']);

  const data = 建单户数据();
  data.背包.push('露出癖');
  data.系统._绝对时段 = 4;
  const 原样 = structuredClone(data);
  const 拒绝 = 装载性癖(data, '露出癖', '101');

  assert.equal(拒绝.成功, false);
  assert.match(拒绝.提示, /深夜/);
  assert.deepEqual(data, 原样);

  data.系统._绝对时段 = 5 + 42;
  const 开幕 = 装载性癖(data, '露出癖', '101');
  assert.equal(开幕.成功, true);
  assert.match(开幕.事件 ?? '', /性癖开幕·露出癖/);
  assert.equal(data.背包.includes('露出癖'), false);
  assert.equal(data.户['101'].妻.性癖装载.includes('露出癖'), true);
});

test('没有夜间设定的普通性癖可在白天开幕，提示不再误写“今晚”', () => {
  const data = 建单户数据();
  data.背包.push('淫语解禁');
  data.系统._绝对时段 = 0;

  const 开幕 = 装载性癖(data, '淫语解禁', '101');
  assert.equal(开幕.成功, true);
  assert.doesNotMatch(开幕.提示, /今晚/);
  assert.match(开幕.提示, /第一次开幕/);
});

test('夜班内推只允许晚上使用，其他时段不消耗道具也不生成外出窗口', () => {
  const data = 建单户数据();
  data.背包.push('夜班内推');
  data.系统._绝对时段 = 5;
  const 原样 = structuredClone(data);
  const 拒绝 = 使用运作(data, '夜班内推', '101', 999);

  assert.equal(拒绝.变动, undefined);
  assert.match(拒绝.提示, /晚上/);
  assert.deepEqual(data, 原样);

  data.系统._绝对时段 = 4 + 42;
  const 生效 = 使用运作(data, '夜班内推', '101', 999);
  assert.equal(生效.变动, true);
  assert.equal(data.背包.includes('夜班内推'), false);
  assert.equal(data.户['101'].夫._外出至, 4 + 42 + 经济配置.夜班外出时段);
});

test('普通五户 2→3 第一夜只允许晚上请求，白天和深夜都不提前升阶', () => {
  for (const 门牌 of ['101', '102', '201', '202', '301']) {
    for (const 钟 of [0, 1, 2, 3, 5]) {
      const data = 建单户数据(门牌);
      const 妻 = data.户[门牌].妻;
      妻.当前阶段 = 2;
      妻.堕落值 = 40;
      妻._阶段线路 = { 目标阶段: 3, 完成位图: 15, 活跃节点: 4, 节点起始楼: 0 };
      data.系统._绝对时段 = 钟;
      const 原样 = structuredClone(data);

      const 拒绝 = 请求晋阶(data, 门牌);
      assert.equal(拒绝.成功, false);
      assert.match(拒绝.消息, /晚上/);
      assert.deepEqual(data, 原样);
    }

    const data = 建单户数据(门牌);
    const 妻 = data.户[门牌].妻;
    妻.当前阶段 = 2;
    妻.堕落值 = 40;
    妻._阶段线路 = { 目标阶段: 3, 完成位图: 15, 活跃节点: 4, 节点起始楼: 0 };
    写入最终预约(data, 门牌, 3);

    const 成功 = 请求晋阶(data, 门牌);
    assert.equal(成功.成功, true);
    assert.equal(data.户[门牌].妻.当前阶段, 3);
    assert.equal(data.风闻, 3, '正式晋阶应登记三点攻略风闻');
  }
});

test('界面与后端使用同一夜间门：错误时段显示等待而不是仍给可点按钮', () => {
  assert.match(App源, /普通首夜时段已满足/);
  assert.match(App源, /选中首夜待晚上 \? '✦ 等到晚上'/);
  assert.match(App源, /发送中 \|\| !夫\.时段可用/);
  assert.match(App源, /发送中 \|\| !妻\.时段可用/);
  assert.match(App源, /商品锁定原因\(项\)\.length > 0/);
  assert.match(App源, /须在.*允许时段\.join\('或'\).*开演/);
});
