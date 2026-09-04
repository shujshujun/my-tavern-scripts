/* eslint-disable import-x/no-nodejs-modules -- Node-only VTR V4 prompt-boundary regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  录像带V4提示源顺序,
  录像带V4固定预设协议,
  构造录像带V4提示词包,
  构造录像带V4提示词包自来源,
  解析录像带V4提示词快照,
  录像带V4线程标识,
  提取录像带V4线程历史,
} = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4上下文.ts');

const 基础输入 = Object.freeze({
  场次标识: 'scene-isolation-001',
  系统契约: 'VTR_SYSTEM_ONLY',
  入口胶囊: 'VTR_ENTRY_ONLY',
  历史: [
    { role: 'user', content: 'VTR_HISTORY_USER' },
    { role: 'assistant', content: 'VTR_HISTORY_ASSISTANT' },
  ],
  房间摘要: { 102: 'VTR_SUMMARY_102', 202: 'VTR_SUMMARY_202' },
  当前卡: 'VTR_CARD_ONLY',
  玩家输入: 'VTR_PLAYER_ONLY',
});

test('提示词来源固定为七项且顺序不可改变，快照逐项保存来源标签', () => {
  assert.deepEqual(录像带V4提示源顺序, [
    'VTR preset protocol',
    'VTR system',
    'VTR entry capsule',
    'VTR history',
    'VTR summaries',
    'VTR current card',
    'VTR player input',
  ]);
  const 包 = 构造录像带V4提示词包(基础输入);
  assert.equal(包.线程, 'vtr:scene-isolation-001');
  assert.deepEqual(
    包.来源.map(项 => 项.标签),
    录像带V4提示源顺序,
  );
  assert.equal(包.orderedPrompts.at(-1).role, 'user');
  assert.equal(包.orderedPrompts.at(-1).content, 'VTR_PLAYER_ONLY');
  const 快照 = 解析录像带V4提示词快照(包.提示词快照);
  assert.deepEqual(
    快照.来源.map(项 => 项.标签),
    录像带V4提示源顺序,
  );
  assert.equal(快照.线程, 包.线程);
});

test('VTR预设协议是代码内固定白名单协议，不调用或复制普通预设桥', () => {
  assert.match(录像带V4固定预设协议, /成年人/u);
  assert.match(录像带V4固定预设协议, /自愿/u);
  assert.match(录像带V4固定预设协议, /只输出/u);
  assert.doesNotMatch(录像带V4固定预设协议, /chatHistory|MVU|数据库|朋友圈|日程/iu);
  const 包 = 构造录像带V4提示词包(基础输入);
  assert.equal(包.来源[0].内容, 录像带V4固定预设协议);
});

test('未知、缺失、重复或乱序来源全部失败关闭，不能悄悄塞入日常上下文', () => {
  const 正常 = 构造录像带V4提示词包(基础输入).来源;
  assert.throws(
    () => 构造录像带V4提示词包自来源([...正常, { 标签: 'daily state', 内容: 'DAILY_LOCATION_SENTINEL' }]),
    /未知|来源/u,
  );
  assert.throws(() => 构造录像带V4提示词包自来源(正常.slice(1)), /缺失|数量|来源/u);
  assert.throws(() => 构造录像带V4提示词包自来源([正常[0], 正常[0], ...正常.slice(2)]), /重复|顺序|来源/u);
  assert.throws(
    () => 构造录像带V4提示词包自来源([normalOrThrow(正常[1]), normalOrThrow(正常[0]), ...正常.slice(2)]),
    /顺序|来源/u,
  );
});

function normalOrThrow(value) {
  if (!value) throw new Error('missing test fixture');
  return value;
}

test('日常位置、服装、手机与任务毒针不会凭空进入VTR；VTR原文也没有日常出口字段', () => {
  globalThis.__DAILY_LOCATION_SENTINEL__ = 'DAILY_LOCATION_SENTINEL';
  globalThis.__DAILY_OUTFIT_SENTINEL__ = 'DAILY_OUTFIT_SENTINEL';
  globalThis.__DAILY_PHONE_TASK_SENTINEL__ = 'DAILY_PHONE_TASK_SENTINEL';
  const 包 = 构造录像带V4提示词包(基础输入);
  const 全文 = 包.orderedPrompts.map(项 => 项.content).join('\n');
  assert.doesNotMatch(全文, /DAILY_LOCATION_SENTINEL/u);
  assert.doesNotMatch(全文, /DAILY_OUTFIT_SENTINEL/u);
  assert.doesNotMatch(全文, /DAILY_PHONE_TASK_SENTINEL/u);
  assert.equal(Object.hasOwn(包, 'dailyHistory'), false);
  assert.equal(Object.hasOwn(包, 'dailyState'), false);
  assert.equal(Object.hasOwn(包, 'dailySummary'), false);
});

test('专用历史只读取同一 vtr:<sceneId>，不同场次和通用监控线程完全隔离', () => {
  assert.equal(录像带V4线程标识('abc-123'), 'vtr:abc-123');
  const 日志 = [
    { 线程: '监控:102', 谁: '叙事', 文本: 'GENERIC_MONITOR_SENTINEL' },
    { 线程: 'vtr:other-scene', 谁: '叙事', 文本: 'OTHER_VTR_SENTINEL' },
    { 线程: 'vtr:scene-isolation-001', 谁: '玩家', 文本: 'THIS_VTR_USER' },
    { 线程: 'vtr:scene-isolation-001', 谁: '叙事', 文本: 'THIS_VTR_ASSISTANT' },
  ];
  const 历史 = 提取录像带V4线程历史(日志, 'scene-isolation-001', 8);
  assert.deepEqual(历史, [
    { role: 'user', content: 'THIS_VTR_USER' },
    { role: 'assistant', content: 'THIS_VTR_ASSISTANT' },
  ]);
  assert.doesNotMatch(JSON.stringify(历史), /GENERIC_MONITOR_SENTINEL|OTHER_VTR_SENTINEL/u);
});
