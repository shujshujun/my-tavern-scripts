/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.getVariables = () => ({});
globalThis.updateVariablesWith = async fn => fn({});
globalThis.insertOrAssignVariables = () => undefined;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 读取开门线索 } = require('../../src/人妻公寓/脚本/游戏逻辑/阶段线路系统.ts');
const 档案卡源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url), 'utf8');

function 建阶段0数据(门牌, 已确认 = false) {
  const data = Schema.parse({ 户: { [门牌]: 创建户节点(0) } });
  data.户[门牌].妻.裂缝.已确认 = 已确认;
  return data;
}

test('阶段0开门线索只在裂缝确认后出现，并给出可执行但不泄底的住户提示', () => {
  assert.equal(读取开门线索(建阶段0数据('101'), '101'), null, '未确认裂缝时不能提前提示送礼答案');

  const 线索 = 读取开门线索(建阶段0数据('101', true), '101');
  assert.ok(线索);
  assert.match(线索.标题, /陌生邻里.*贞淑/);
  assert.match(线索.行动提示, /商店.*礼物/);
  assert.match(线索.现场提示, /背包.*当面送出/);
  assert.doesNotMatch(JSON.stringify(线索), /livehouse双人票|正红色口红|房租宽限批条|刻名手链|拍立得相机/);

  const 已开门 = 建阶段0数据('101', true);
  已开门.户['101'].妻.当前阶段 = 1;
  assert.equal(读取开门线索(已开门, '101'), null, '阶段1以后切回四节点关系线路');
});

test('母亲开门线索说明服饰范围，但不虚构一个不存在的固定对症礼物', () => {
  const 线索 = 读取开门线索(建阶段0数据('302', true), '302');
  assert.ok(线索);
  assert.match(线索.行动提示, /商店.*服饰.*外装或妆容/);
  assert.match(线索.行动提示, /给她本人/);
  assert.match(线索.现场提示, /背包.*当面送出/);
});

test('关系轨迹面板具备开门入口、四节点状态、无障碍展开和品牌语义色', () => {
  assert.match(档案卡源码, /读取开门线索/);
  assert.match(档案卡源码, /const 选中关系轨迹 = computed/);
  assert.match(档案卡源码, /:aria-expanded="显示关系线索"/);
  assert.match(档案卡源码, /aria-controls="relation-trace-panel"/);
  assert.match(档案卡源码, /class="relation-step"[\s\S]*?done:[\s\S]*?current:[\s\S]*?future:/);
  assert.match(档案卡源码, /class="relation-action"/);
  assert.match(档案卡源码, /:global\(html\.rq-dark\) \.relation-clue-board/);
  assert.match(档案卡源码, /@media \(max-width: 540px\)[\s\S]*?\.relation-clue-open/);

  const 关系样式起点 = 档案卡源码.indexOf('.relation-clue-open');
  const 档案主体起点 = 档案卡源码.indexOf('.sheet.dossier', 关系样式起点);
  const 关系样式 = 档案卡源码.slice(关系样式起点, 档案主体起点);
  assert.doesNotMatch(关系样式, /var\(--accent\)|var\(--muted\)|var\(--paper\)/, '关系面板不得再引用错误 token');
  assert.match(关系样式, /var\(--pink\)/, '关系状态使用游戏主强调色');
  assert.match(关系样式, /var\(--paper-card\)/, '关系面板使用真实卡片底色 token');
  assert.match(关系样式, /\.dsec\.relation-clue-board \{[\s\S]*?flex: 0 0 auto;/, '关系面板必须覆盖后置的档案通用 dsec 布局');
  assert.doesNotMatch(关系样式, /\.relation-clue-board \{[\s\S]*?overflow: hidden;/, '展开面板不能用 overflow hidden 破坏 Flex 最小尺寸');
});
