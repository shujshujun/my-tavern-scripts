/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const {
  管理任务期限口吻,
  编译管理任务通知文案,
} = require('../../src/人妻公寓/脚本/游戏逻辑/管理任务通知.ts');
const 入口源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

test('首日楼务通知使用自然相对时间与生活口吻', () => {
  const 文案 = 编译管理任务通知文案({
    类型: '报修',
    地点: '101',
    事项: '下水堵塞',
    当前时段: 0,
    截止时段: 4,
  });

  assert.equal(文案, '管理员，101这边下水堵了，麻烦最晚今晚过来处理一下。');
  assert.doesNotMatch(文案, /第\d+天/);
});

test('任务期限按当前时间显示今晚、明晚、后天与逾期催办', () => {
  assert.equal(管理任务期限口吻(0, 4), '最晚今晚');
  assert.equal(管理任务期限口吻(5, 10), '最晚明晚');
  assert.equal(管理任务期限口吻(0, 16), '最晚后天晚上');
  assert.equal(管理任务期限口吻(5, 4), '尽快');
});

test('序章跳过自动手机节拍时，确定性楼务通知失败也必须显式吸收拒绝', () => {
  const 起点 = 入口源码.indexOf("eventOn('人妻公寓:回合完成'");
  const 终点 = 入口源码.indexOf("eventOn('人妻公寓:布设摄像头'", 起点);
  const 段 = 入口源码.slice(起点, 终点);
  assert.match(段, /void 同步管理任务微信\([\s\S]{0,160}\.catch\(/);
  assert.match(段, /楼务通知同步失败/);
  assert.doesNotMatch(段, /if \(rawStat\) void 同步管理任务微信\([^;]+\);/);
});

test('投诉通知同样不暴露内部第几天时钟', () => {
  const 文案 = 编译管理任务通知文案({
    类型: '投诉',
    地点: '管理员室',
    事项: '楼道堆物',
    当前时段: 0,
    截止时段: 6,
  });

  assert.equal(文案, '管理员，我已把“楼道堆物”投诉提交到管理员室，地点是管理员室，麻烦最晚明天早上处理一下。');
  assert.doesNotMatch(文案, /第\d+天/);
});
