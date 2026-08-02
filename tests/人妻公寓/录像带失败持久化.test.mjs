/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema } = require('../../src/人妻公寓/schema.ts');
const { 读取录像带连点失败状态, 推进录像带连点失败 } = require('../../src/人妻公寓/界面/客户端/录像带交互状态.ts');

const appSource = await readFile(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

function 等待202(交互 = {}) {
  return { id: '录像带', 阶段: '等待202', 交互 };
}

test('连续失败三次后的补偿资格保存在录像带交互快照中', () => {
  let 场景 = 等待202();

  for (let 次数 = 1; 次数 <= 3; 次数 += 1) {
    const 交互 = 推进录像带连点失败(场景);
    assert.ok(交互);
    assert.equal(交互.失败次数, 次数);
    assert.equal(交互.补偿可用, 次数 >= 3);
    场景 = 等待202(交互);
  }

  assert.deepEqual(读取录像带连点失败状态(场景), { 失败次数: 3, 补偿可用: true });
});

test('刷新读同一快照，回档读目标楼快照，不跨阶段或跨场景泄漏', () => {
  const 一次快照 = 等待202(推进录像带连点失败(等待202()));
  const 二次快照 = 等待202(推进录像带连点失败(一次快照));

  assert.deepEqual(读取录像带连点失败状态(二次快照), { 失败次数: 2, 补偿可用: false });
  assert.deepEqual(读取录像带连点失败状态(一次快照), { 失败次数: 1, 补偿可用: false });
  assert.deepEqual(读取录像带连点失败状态({ ...二次快照, 阶段: '202-1' }), {
    失败次数: 0,
    补偿可用: false,
  });
  assert.deepEqual(读取录像带连点失败状态({ ...二次快照, id: '静音会议' }), {
    失败次数: 0,
    补偿可用: false,
  });
});

test('现有 Schema 会保留录像带交互失败快照', () => {
  const 交互 = 推进录像带连点失败(等待202(推进录像带连点失败(等待202())));
  const 已落盘 = Schema.parse({ 系统: { _特殊场景: 等待202(交互) } });

  assert.deepEqual(读取录像带连点失败状态(已落盘.系统._特殊场景), { 失败次数: 2, 补偿可用: false });
});

test('非录像带等待202状态不允许记账', () => {
  assert.equal(推进录像带连点失败({ id: '录像带', 阶段: '等待102', 交互: {} }), null);
  assert.equal(推进录像带连点失败({ id: '', 阶段: '', 交互: {} }), null);
});

test('App 只把完整失败尝试写入 MVU，单次点击进度仍留在前端内存', () => {
  assert.match(appSource, /const 录像带连点计数 = ref\(0\)/);
  assert.doesNotMatch(appSource, /const 录像带连续失败 = ref\(0\)/);
  assert.match(appSource, /const 录像带失败状态 = computed/);
  assert.match(appSource, /data\.value\.\u7cfb\u7edf\._\u7279\u6b8a\u573a\u666f\.\u4ea4\u4e92 = 新交互/);
  assert.match(appSource, /\.flush\?\.\(\)/);
});
