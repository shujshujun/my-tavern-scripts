/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
globalThis.getVariables = () => ({ _场景: { 房间id: '大堂' } });

const { Schema } = require('../../src/人妻公寓/schema.ts');
const { 执行时间推进事务 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
const { 资源上限 } = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 回合输入源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/回合输入.vue', import.meta.url), 'utf8');

function 建数据(精力, 体力) {
  return Schema.parse({
    系统: { _序章完成: true, _绝对时段: 0, _待发送事件: '' },
    玩家资源: { 精力: { 当前值: 精力 }, 体力: { 当前值: 体力 } },
  });
}

test('全局推进一时段可在真实地图地点执行，并提供少于小憩的恢复', () => {
  const 普通 = 建数据(3, 2);
  const 普通结果 = 执行时间推进事务(普通, {
    方式: '推进一时段',
    预期绝对时段: 0,
    当前消息楼: 10,
    当前地点: '大堂',
  });
  assert.equal(普通结果.成功, true);
  assert.equal(普通.系统._绝对时段, 1);
  assert.equal(普通.玩家资源.精力.当前值, 4);
  assert.equal(普通.玩家资源.体力.当前值, 3);

  const 小憩 = 建数据(3, 2);
  const 小憩结果 = 执行时间推进事务(小憩, {
    方式: '小憩',
    预期绝对时段: 0,
    当前消息楼: 10,
    当前地点: '管理员室',
  });
  assert.equal(小憩结果.成功, true);
  assert.ok(小憩.玩家资源.精力.当前值 - 3 > 普通.玩家资源.精力.当前值 - 3);
});

test('普通推进不能从深夜跨日，必须回管理员室或 302 睡觉', () => {
  const 深夜等待 = 建数据(3, 2);
  深夜等待.系统._绝对时段 = 5;
  const 等待结果 = 执行时间推进事务(深夜等待, {
    方式: '推进一时段',
    预期绝对时段: 5,
    当前消息楼: 10,
    当前地点: '大堂',
  });
  assert.equal(等待结果.成功, false);
  assert.match(等待结果.提示, /深夜.*管理员室.*302.*不能跨到第二天/);
  assert.equal(深夜等待.系统._绝对时段, 5);

  const 深夜小憩 = 建数据(3, 2);
  深夜小憩.系统._绝对时段 = 5;
  const 小憩结果 = 执行时间推进事务(深夜小憩, {
    方式: '小憩',
    预期绝对时段: 5,
    当前消息楼: 10,
    当前地点: '管理员室',
  });
  assert.equal(小憩结果.成功, false);
  assert.equal(深夜小憩.系统._绝对时段, 5);

  const 错地睡眠 = 建数据(3, 2);
  错地睡眠.系统._绝对时段 = 5;
  const 错地结果 = 执行时间推进事务(错地睡眠, {
    方式: '睡到次日早晨',
    预期绝对时段: 5,
    当前消息楼: 10,
    当前地点: '大堂',
  });
  assert.equal(错地结果.成功, false);
  assert.equal(错地睡眠.系统._绝对时段, 5);

  for (const 当前地点 of ['管理员室', '302']) {
    const 睡眠 = 建数据(3, 2);
    睡眠.系统._绝对时段 = 5;
    const 睡眠结果 = 执行时间推进事务(睡眠, {
      方式: '睡到次日早晨',
      预期绝对时段: 5,
      当前消息楼: 10,
      当前地点,
    });
    assert.equal(睡眠结果.成功, true, 当前地点);
    assert.equal(睡眠.系统._绝对时段, 6, 当前地点);
    assert.equal(睡眠.玩家资源.精力.当前值, 资源上限(睡眠, '精力'), 当前地点);
    assert.equal(睡眠.玩家资源.体力.当前值, 资源上限(睡眠, '体力'), 当前地点);
  }
});

test('固定大按钮显示当前到下一时段，满状态点击前二次确认', () => {
  // A8b:按钮模板/样式归 components/回合输入.vue，当前/下一时段经英文 props 注入
  assert.match(回合输入源, /class="global-time-advance"/);
  assert.match(回合输入源, /currentPeriodLabel/);
  assert.match(回合输入源, /推进到\{\{ nextPeriodLabel \}\}/);
  assert.match(回合输入源, /\.global-time-advance\s*\{[\s\S]{0,260}min-height:\s*56px/);
  // 二次确认与深夜硬门仍在 App 推进固定时段
  assert.match(App源, /玩家资源已满/);
  assert.match(App源, /window\.confirm\([\s\S]{0,260}什么也没做[\s\S]{0,120}确定推进到/);
  assert.match(App源, /时段\.value === '深夜'[\s\S]{0,220}管理员室或 302 睡觉[\s\S]{0,160}不能跨到第二天/);
  assert.match(App源, /发起时间推进\('推进一时段'\)/);
  // App 导入并挂载 RoundInput，推进按钮唯一入口经组件接线
  assert.match(App源, /import RoundInput from '\.\/components\/回合输入\.vue';/);
  assert.equal((App源.match(/<RoundInput/g) ?? []).length, 1);
  assert.match(App源, /@advance-time="推进固定时段"/);
});
