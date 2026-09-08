/* eslint-disable import-x/no-nodejs-modules -- Node-only V4 card regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node', resolveJsonModule: true, esModuleInterop: true });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const contract = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');

const card = (room, stage) => contract.读取录像带V4微信卡(room, stage);

const lock102 = card('102', 'lock-confirmation');
const lock202 = card('202', 'lock-confirmation');
const watch102 = card('102', 'watch-consent');
const watch202 = card('202', 'watch-consent');
const depart = card('102', 'departure-ready') ?? card('202', 'departure-ready');

test('PLAY-017 戴锁卡不能把“还没有本人戴好”签成确认', () => {
  assert.ok(lock102 && lock202);
  assert.equal(contract.录像带V4微信气泡满足卡(lock102, `${lock102.husband}还没有自己把锁戴好。`), false);
  assert.equal(contract.录像带V4微信气泡满足卡(lock202, `${lock202.husband}本人还没把锁扣好。`), false);
});

test('PLAY-017 观看卡不能把“并未明确同意”签成知情同意', () => {
  assert.ok(watch102 && watch202);
  assert.equal(contract.录像带V4微信气泡满足卡(watch102, `${watch102.husband}并未明确同意观看录像。`), false);
  assert.equal(contract.录像带V4微信气泡满足卡(watch202, `${watch202.husband}还没有明确答应看这盘录像。`), false);
});

test('PLAY-017 联合出发卡不能把未出发/不会自动切302签成出发凭据', () => {
  assert.ok(depart);
  assert.equal(contract.录像带V4微信气泡满足卡(depart, '我们还没有出发，点击监控也不会自动切到302。'), false);
});

test('三类正常肯定气泡与既有安全兜底继续通过', () => {
  for (const c of [lock102, watch102, depart]) {
    assert.ok(c);
    const fallback = contract.录像带V4微信卡安全兜底(c);
    assert.equal(contract.录像带V4微信气泡满足卡(c, fallback), true, `${c.stage}: ${fallback}`);
  }
});
