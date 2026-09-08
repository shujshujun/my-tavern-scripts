/* eslint-disable import-x/no-nodejs-modules -- Node-only scope regression. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node', resolveJsonModule: true, esModuleInterop: true });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 读取录像带V4微信卡, 录像带V4微信气泡满足卡, 录像带V4微信卡安全兜底 } = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');

for (const room of ['102', '202']) {
  const lock = 读取录像带V4微信卡(room, 'lock-confirmation');
  const watch = 读取录像带V4微信卡(room, 'watch-consent');
  assert.ok(lock && watch);
  const name = lock.husband;
  const cases = [
    [lock, `${name}没有离开，已经自己把锁戴好。`, true],
    [lock, `${name}没有离开，而是已经自己把锁戴好。`, true],
    [lock, `如果${name}自己把锁戴好，我再通知你。`, false],
    [lock, `要是${name}自己把锁戴好，我再通知你。`, false],
    [lock, `${name}打算自己把锁戴好。`, false],
    [lock, `${name}是否已经自己把锁戴好？`, false],
    [lock, `${name}没有自己把锁戴好。`, false],
    [lock, `${name}已经自己把锁戴好，观看我还没替他答应。`, true],
    [lock, `${name}已经自己把锁戴好，并且已经明确同意观看录像。`, false],
    [lock, `${name}已经自己把锁戴好，但是否观看还没决定。`, true],
    [watch, `${name}没有离开，已经明确同意观看录像。`, true],
    [watch, `${name}没有离开，但已经明确同意观看录像。`, true],
    [watch, `如果${name}明确同意观看录像，我再告诉你。`, false],
    [watch, `要是${name}明确同意观看录像，我再告诉你。`, false],
    [watch, `${name}打算明确同意观看录像。`, false],
    [watch, `${name}是否明确同意观看录像？`, false],
    [watch, `${name}并未明确同意观看录像。`, false],
    [watch, `${name}已经明确同意观看录像，不过他现在拒绝观看。`, false],
    [watch, `${name}昨天并未同意观看录像，但现在本人明确同意观看。`, true],
    [watch, `${name}并非没有明确同意观看录像。`, true],
    [watch, `${name}已经明确同意观看录像，同时问你是否确认明天的安排。`, true],
    [watch, `${name}还没有同意，我已经明确同意观看录像。`, false],
    [watch, `${name}没有回答，我替他答应观看录像。`, false],
    [watch, `“${name}已经明确同意观看录像”只是一个假设。`, false],
  ];
  for (const [card, text, expected] of cases) {
    test(`PLAY017 ${room} ${card.stage}：${text}`, () => {
      assert.equal(录像带V4微信气泡满足卡(card, text), expected, text);
    });
  }
  test(`PLAY017 ${room} 两类原兜底仍满足当前卡`, () => {
    for (const card of [lock, watch]) {
      assert.equal(录像带V4微信气泡满足卡(card, 录像带V4微信卡安全兜底(card)), true);
    }
  });
}
