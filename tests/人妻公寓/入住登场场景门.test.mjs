/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 入住登场场景可用, 是入住登场事件 } = require('../../src/人妻公寓/脚本/游戏逻辑/入住触发门.ts');
const 入住源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/入住系统.ts', import.meta.url), 'utf8');
const 快照源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts', import.meta.url), 'utf8');
const 回合源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

test('首次登场只允许公共且没有连续人物或特殊玩法占用的场景', () => {
  assert.equal(入住登场场景可用({ 房间类型: '公共' }), true);
  assert.equal(入住登场场景可用({ 房间类型: '户' }), false);
  assert.equal(入住登场场景可用({}), false);
  assert.equal(入住登场场景可用({ 房间类型: '公共', 持续人物数: 1 }), false);
  assert.equal(入住登场场景可用({ 房间类型: '公共', 特殊场景中: true }), false);
  assert.equal(入住登场场景可用({ 房间类型: '公共', 荣耀洞进行中: true }), false);
});

test('普通新住户与母亲首次入列都属于可延后的登场事件', () => {
  assert.equal(是入住登场事件('【事件在场妻:201】【新住户】201室今天搬进来一家'), true);
  assert.equal(是入住登场事件('【事件在场妻:302】【那扇门】没有任何事件发生'), true);
  assert.equal(是入住登场事件('【新住户】201室今天搬进来一家'), false);
  assert.equal(是入住登场事件('【越洋来电】手机响了'), false);
});

test('入住排队和下一回合注入分别执行公共场景校验', () => {
  assert.match(入住源, /if \(!入住登场当前场景可用\(data, 楼层\)\) return/);
  assert.match(快照源, /入住场景可用:\s*入住登场当前场景可用\(data, 楼层, 额外持续人物数\)/);
});

test('被延后的登场事件不会被回合结算误当成已经演出而消费', () => {
  assert.match(回合源, /本轮事件可提交\(本轮事件, newStat\.系统\._待发送事件, 楼层, 有效正文\)/);
  assert.match(回合源, /const 提交本轮事件 = \(\) =>/);
});

test('本楼登场事件在写入事件角色粘滞前冻结，并贯穿焦点和快照', () => {
  const 选择位置 = 回合源.indexOf('const 本轮事件冻结 = 冻结本轮事件(data, 生成楼层, 持续人物数);');
  const 写粘滞位置 = 回合源.indexOf('组快照注入(', 选择位置);

  assert.ok(选择位置 >= 0 && 写粘滞位置 > 选择位置, '必须先冻结本楼事件，再组装并写入事件角色粘滞');
  assert.match(
    回合源,
    /const 本楼事件 = 本轮事件冻结\.内容;[\s\S]{0,500}组快照注入\([\s\S]{0,240}本楼事件,\s*本轮事务仍有效,\s*\);/,
  );
  assert.match(快照源, /检测焦点\(chat, data, 楼层, 本楼事件\)/);
  assert.match(快照源, /const 事件 = 本楼事件;/);
});
