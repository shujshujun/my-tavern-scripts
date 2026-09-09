/* eslint-disable import-x/no-nodejs-modules -- 提取真实回合完成监听，使用真实时间事务门验证调度顺序。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const hostWindow = {
  document: {},
  addEventListener() {},
  removeEventListener() {},
};
hostWindow.parent = hostWindow;
globalThis.window = hostWindow;
globalThis.SillyTavern = { getCurrentChatId: () => 'time-a', chat: {} };
globalThis.getVariables = () => ({});

const gate = require('../../src/人妻公寓/脚本/游戏逻辑/时间事务写入门.ts');
const { 创建空闲手机节拍调度器 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/空闲节拍调度.ts');
const indexPath = fileURLToPath(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url));

function 真实回合完成监听(依赖) {
  const source = readFileSync(indexPath, 'utf8');
  const start = source.indexOf("eventOn('人妻公寓:回合完成'");
  const end = source.indexOf("\n\n  eventOn('人妻公寓:布设摄像头'", start);
  assert.ok(start >= 0 && end > start, '必须能定位真实回合完成监听');
  const js = ts.transpileModule(source.slice(start, end), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  let handler;
  const eventOn = (name, callback) => {
    if (name === '人妻公寓:回合完成') handler = callback;
  };
  Function(
    'eventOn',
    '刷新红点',
    '空闲后手机节拍',
    '读最近有效stat',
    'Schema',
    '同步管理任务微信',
    'console',
    js,
  )(
    eventOn,
    依赖.刷新红点,
    依赖.空闲后手机节拍,
    () => null,
    { parse: value => value },
    async () => false,
    console,
  );
  assert.equal(typeof handler, 'function');
  return handler;
}

test('时间提交广播回合完成时，真实监听只请求空闲调度，节拍等租约释放后再启动', async () => {
  const 调用 = [];
  let release = gate.取得时间事务写入租约('time-a', 'time-complete-phone-beat');
  const 空闲后手机节拍 = 创建空闲手机节拍调度器(
    {
      运行期忙碌: () => gate.时间事务阻止普通写入(),
      执行节拍: async () => 调用.push(gate.时间事务阻止普通写入() ? '节拍仍被时间门阻断' : '节拍已解锁'),
      等待: async () => {
        release();
        release = () => {};
        await Promise.resolve();
      },
    },
    { 超时毫秒: 100, 轮询毫秒: 1 },
  );
  const handler = 真实回合完成监听({
    刷新红点: () => 调用.push('刷新红点'),
    空闲后手机节拍,
  });

  handler();
  assert.deepEqual(调用, ['刷新红点'], '回合完成监听不得直接启动手机节拍');
  await setImmediate();
  assert.deepEqual(调用, ['刷新红点', '节拍已解锁']);
});

test('普通回合在运行期已空闲时仍于微任务启动手机节拍，不吞掉节拍', async () => {
  const 调用 = [];
  const 空闲后手机节拍 = 创建空闲手机节拍调度器({
    运行期忙碌: () => false,
    执行节拍: async () => 调用.push('手机节拍'),
  });
  const handler = 真实回合完成监听({
    刷新红点: () => 调用.push('刷新红点'),
    空闲后手机节拍,
  });
  handler();
  assert.deepEqual(调用, ['刷新红点']);
  await setImmediate();
  assert.deepEqual(调用, ['刷新红点', '手机节拍']);
});
