/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 经济配置 } = require('../../src/人妻公寓/stageConfig.ts');
const { 使用运作, 经济结算 } = require('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts');
const { 当前胜任危险状态, 登记风闻事件 } = require('../../src/人妻公寓/脚本/游戏逻辑/风闻系统.ts');

function 建经营数据() {
  return Schema.parse({
    户: { 101: 创建户节点(0) },
    现金: 20_000,
    胜任度: 100,
    系统: {
      _上次上交期: 0,
      _管理考核: { 上次生成期: 0 },
    },
  });
}

test('快进停在新期中途时，当前期任务仍按期初生成而不是在终点顺延', () => {
  const 逐时 = 建经营数据();
  逐时.系统._绝对时段 = 经济配置.收租周期时段;
  经济结算(逐时, 1);
  逐时.系统._绝对时段 = 经济配置.收租周期时段 + 8;
  经济结算(逐时, 2);

  const 快进 = 建经营数据();
  快进.系统._绝对时段 = 经济配置.收租周期时段 + 8;
  经济结算(快进, 2);

  const 逐时任务 = 逐时.系统._管理考核.活跃任务.filter(item => item.id.startsWith('管理-1-'));
  const 快进任务 = 快进.系统._管理考核.活跃任务.filter(item => item.id.startsWith('管理-1-'));
  assert.ok(逐时任务.length > 0);
  assert.deepEqual(
    快进任务.map(item => [item.id, item.创建时段, item.截止时段, item.逾期已扣]),
    逐时任务.map(item => [item.id, item.创建时段, item.截止时段, item.逾期已扣]),
  );
  assert.ok(快进任务.every(item => item.创建时段 === 经济配置.收租周期时段));
});

test('坏楼务条目只丢弃自己，不清空正常任务，也不保留空ID幽灵任务', () => {
  const 正常任务 = {
    id: 'valid-task',
    模板: '大堂地面清洁',
    类型: '公共',
    级别: '日常',
    地点: '大堂',
    门牌: '',
    创建时段: 0,
    截止时段: 6,
    逾期已扣: false,
  };
  const data = Schema.parse({ 系统: { _管理考核: { 活跃任务: [正常任务, null, {}] } } });
  assert.deepEqual(data.系统._管理考核.活跃任务.map(item => item.id), ['valid-task']);
});

test('粉刷无公共维护时只加三点并进入三期冷却，冷却中不消耗第二件', () => {
  const data = Schema.parse({ 胜任度: 50, 背包: ['粉刷翻新', '粉刷翻新'] });
  data.系统._绝对时段 = 9;

  const first = 使用运作(data, '粉刷翻新', undefined, 1);
  assert.equal(first.变动, true);
  assert.equal(data.胜任度, 53);
  assert.equal(data.背包.filter(item => item === '粉刷翻新').length, 1);
  assert.equal(data.系统._管理考核.粉刷冷却至期, 4);

  const second = 使用运作(data, '粉刷翻新', undefined, 2);
  assert.equal(second.变动, undefined);
  assert.match(second.提示, /冷却|再等|第4期/);
  assert.equal(data.胜任度, 53);
  assert.equal(data.背包.filter(item => item === '粉刷翻新').length, 1);
});

test('通牒失败按两期结构化扣分累计，母亲硬证据高于先前未接电话', () => {
  const data = Schema.parse({
    胜任度: 39,
    系统: {
      _上次上交期: 4,
      _待接来电: { 期: 0, 分数段: '不满', 报表: '旧来电' },
      _管理考核: {
        上次生成期: 99,
        活跃任务: ['大堂', '楼梯间', '天台'].map((地点, index) => ({
          id: `占槽-${index}`,
          模板: `${地点}长期事项`,
          类型: '公共',
          级别: '日常',
          地点,
          创建时段: 0,
          截止时段: 999,
          逾期已扣: false,
        })),
      },
    },
  });
  // 普通未接电话只在下一次真实父亲联络周期结算；第5经营期首次跨过一周联络界。
  data.系统._绝对时段 = 45;
  经济结算(data, 1);
  assert.equal(data.系统._通牒期, 5);
  // 本期通牒电话已接听完成；下一期不能再把它当成第二次未接责任。
  data.系统._待接来电.期 = -1;

  data.系统._绝对时段 = 46;
  登记风闻事件(data, {
    id: '母亲硬证据:账本',
    类型: '硬证据',
    目标增量: 0,
    门牌: '302',
    地点: '302',
    摘要: '母亲相关账本硬证据',
    迹象: '硬证据',
    投诉: '严重',
  });
  data.系统._绝对时段 = 54;
  经济结算(data, 2);

  assert.match(data.系统._坏结局, /母亲事发/);
  assert.doesNotMatch(data.系统._坏结局, /失联抗命|欠租烂账|楼务失职/);
});

test('胜任HUD读取真实通牒状态并提供详情，风闻HUD不直接渲染原始摘要', () => {
  const app = readFileSync('src/人妻公寓/界面/客户端/App.vue', 'utf8');
  assert.match(app, /显示胜任详情/);
  assert.match(app, /_通牒期/);
  assert.match(app, /本期已完成|本期完成/);
  assert.match(app, /下一次考核|下次考核/);
  assert.doesNotMatch(app, /\{\{\s*事件\.摘要\s*\|\|\s*事件\.类型\s*\}\}/);
  assert.match(app, /风闻趋势/);
});

test('父亲来电界面明确显示最后通牒，风闻与胜任从Schema起保持整数阈值', () => {
  // P7B2:来电页已迁至 ./手机/壳/渲染/call.ts,通牒文案断言改读真实所有者。
  const call = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/call.ts', 'utf8');
  assert.match(call, /_待接来电\.通牒[\s\S]{0,120}最后通牒/);
  const data = Schema.parse({ 风闻: 74.6, 胜任度: 39.6 });
  assert.equal(Number.isInteger(data.风闻), true);
  assert.equal(Number.isInteger(data.胜任度), true);
});

test('红线分数只进入危险，必须到期界正式登记后才显示通牒', () => {
  const data = Schema.parse({ 胜任度: 40, 系统: { _难度: '标准' } });
  assert.equal(当前胜任危险状态(data), '危险');
  data.系统._通牒期 = 1;
  assert.equal(当前胜任危险状态(data), '通牒');
});

test('旧存档缺少结构化主因时仍能把风闻失败识别为公开丑闻', () => {
  const data = Schema.parse({
    胜任度: 34,
    系统: {
      _绝对时段: 18,
      _上次上交期: 1,
      _通牒期: 1,
      _管理考核: {
        上次生成期: 99,
        通牒原因: '楼内严重投诉和风闻已经传到父亲那里',
        活跃任务: ['大堂', '楼梯间', '天台'].map((地点, index) => ({
          id: `旧档占槽-${index}`,
          模板: `${地点}长期事项`,
          类型: '公共',
          级别: '日常',
          地点,
          创建时段: 0,
          截止时段: 999,
          逾期已扣: false,
        })),
      },
    },
  });
  经济结算(data, 1);
  assert.match(data.系统._坏结局, /公开丑闻/);
});
