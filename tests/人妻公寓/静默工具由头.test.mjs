/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
// 2026-08-04 用户拍板:工具由头与楼务系统撞叙事("整天都在修理水管")——
// 借口改为纯后台配额:不显示、不注入正文;工具箱门槛与每户每天3次照旧生效。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 客户端源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 舞台配置源 = readFileSync(new URL('../../src/人妻公寓/stageConfig.ts', import.meta.url), 'utf8');

test('由头不再进入正文:不点名工具、不框定检修，只保留中性的管理员登门标记', () => {
  assert.doesNotMatch(客户端源, /为由敲开了门/, '旧的"以XX为由敲开了门"检修前缀必须移除');
  assert.doesNotMatch(客户端源, /次检修\)/, '"第N次检修"计数不得再喂给AI');
  assert.match(客户端源, /文本 = `\(你以公寓管理员的身份敲开了这户的门\)\$\{文本\}`;/);
});

test('后台配额原样保留:进门仍落 _工具由头 记录，门槛与每日3次照扣', () => {
  assert.match(客户端源, /if \(需要由头\.value && 可用由头\.value\.length\) \{/, '静默消耗仍走同一入口');
  assert.match(客户端源, /_\.set\(\{\}, `_工具由头\.\$\{门牌号\}`, 新记录\)/, '记录形状不变,旧存档与回档语义不受影响');
  assert.match(客户端源, /if \(需要由头\.value && !可用由头\.value\.length\) return false;/, '配额耗尽仍关输入框');
  assert.match(舞台配置源, /export const 由头每日次数 = 3;/);
  assert.match(客户端源, /if \(!包\.includes\('工具箱'\)\) return \[\];/, '工具箱门槛保留');
});

test('玩家可见文案不再提"检修借口"，商店描述同步去修理化', () => {
  assert.doesNotMatch(客户端源, /检修借口/);
  assert.doesNotMatch(舞台配置源, /检修借口/);
  assert.match(客户端源, /今天已经上过三次门/, '配额耗尽的到场提示改为社交口径');
});
