/* eslint-disable import-x/no-nodejs-modules -- Node-only VTR V4 WeChat routing regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.eventEmit = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
  resolveJsonModule: true,
  esModuleInterop: true,
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 录像带V4微信消息键, 选择录像带V4联合出发线程 } = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4状态.ts');
const {
  录像带V4微信卡安全兜底,
  录像带V4微信气泡满足卡,
  读取录像带V4微信卡,
} = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');

function 消息(会话, 键, 标识, 类 = '文本') {
  return { 楼: 1, 时: 1, 会话, 发: '对方', 文: 键, 键, 标识, 类 };
}

test('联合出发线程由当前分支最后完成知情同意的一侧唯一决定', () => {
  const k = 录像带V4微信消息键;
  assert.equal(选择录像带V4联合出发线程([]), null);
  assert.equal(选择录像带V4联合出发线程([消息('102', k['102'].同意, 'a')]), null);
  assert.equal(选择录像带V4联合出发线程([消息('102', k['102'].同意, 'a'), 消息('202', k['202'].同意, 'b')]), '202');
  assert.equal(选择录像带V4联合出发线程([消息('202', k['202'].同意, 'b'), 消息('102', k['102'].同意, 'a')]), '102');
});

test('撤回的知情同意不再具有决定联合出发线程的资格', () => {
  const k = 录像带V4微信消息键;
  assert.equal(
    选择录像带V4联合出发线程([消息('102', k['102'].同意, 'a'), 消息('202', k['202'].同意, 'b', '撤回')]),
    null,
  );
});

test('微信稳定键只接受满足当前卡硬事实的气泡，弱模型反话与漏步骤会改用安全兜底', () => {
  const 戴锁卡 = 读取录像带V4微信卡('102', 'lock-confirmation');
  const 同意卡 = 读取录像带V4微信卡('202', 'watch-consent');
  const 出发卡 = 读取录像带V4微信卡('102', 'departure-ready');
  assert.ok(戴锁卡 && 同意卡 && 出发卡);

  assert.equal(录像带V4微信气泡满足卡(戴锁卡, '顾国栋已经自己把锁戴好了，观看的事还没替他答应。'), true);
  assert.equal(录像带V4微信气泡满足卡(戴锁卡, '他弄好了，我们都同意看。'), false, '漏丈夫姓名且越过同意阶段');
  assert.equal(录像带V4微信气泡满足卡(同意卡, '何俊生听完录像内容后明确同意观看。'), true);
  assert.equal(录像带V4微信气泡满足卡(同意卡, '何俊生没有同意，他拒绝看。'), false);
  assert.equal(录像带V4微信气泡满足卡(出发卡, '我们现在出发，你点击监控，系统会自动切到302。'), true);
  assert.equal(录像带V4微信气泡满足卡(出发卡, '我们出发了，你看着办。'), false, '漏监控与自动切302');

  for (const 卡 of [戴锁卡, 同意卡, 出发卡]) {
    const 兜底 = 录像带V4微信卡安全兜底(卡);
    assert.equal(录像带V4微信气泡满足卡(卡, 兜底), true, `${卡.id}兜底必须满足自身硬契约`);
    assert.ok(兜底.length <= 150, `${卡.id}兜底不得超过手机气泡上限`);
  }
});

test('手动私聊在读取普通记忆、位置、衣着和冷落语义之前进入V4专用旁路', () => {
  const 源 = readFileSync(
    new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts', import.meta.url),
    'utf8',
  );
  const 专用 = 源.indexOf('尝试录像带V4专用私聊回复(data, 会话, 库, 批次消息, 发送租约, 控制)');
  const 普通记忆 = 源.indexOf('构造微信联系保护表(库.消息, 回复钟)', 专用);
  const 位置 = 源.indexOf('妻位置推算(', 专用);
  assert.ok(专用 >= 0, '缺少V4私聊旁路');
  assert.ok(普通记忆 > 专用, 'V4旁路必须早于普通微信记忆');
  assert.ok(位置 > 专用, 'V4旁路必须早于日常位置提示');
});

test('V4微信模块只读取冻结卡、时间线、当前消息和玩家本批文本，不导入普通私聊记忆模块', () => {
  const 源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/录像带V4微信.ts', import.meta.url), 'utf8');
  const 导入段 = 源.slice(0, 源.indexOf('export interface'));
  assert.match(源, /读取录像带V4微信卡/u);
  assert.match(源, /手机时间线租约仍有效/u);
  assert.match(源, /临时\.系统\._录像带V4\.阶段 !== data\.系统\._录像带V4\.阶段/u, '阶段陈旧时也必须补交主状态');
  assert.match(源, /只把当前卡明确列出的佩戴或观看事实视为已经成立/u);
  assert.doesNotMatch(源, /佩戴与观看均已由丈夫本人自愿、知情完成/u, '戴锁卡不得被系统提示提前灌入观看同意');
  assert.doesNotMatch(导入段, /微信记忆上下文|妻状态包|妻位置推算|冷落系统|衣柜|朋友圈/u);
});
