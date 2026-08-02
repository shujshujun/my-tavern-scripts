/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };

let 聊天变量;
let 阻塞下一写;
let 已进入阻塞写;
globalThis.getVariables = () => 聊天变量;
globalThis.updateVariablesWith = async callback => {
  if (阻塞下一写) {
    const 等待 = 阻塞下一写;
    阻塞下一写 = null;
    已进入阻塞写();
    await 等待;
  }
  聊天变量 = callback(lodash.cloneDeep(聊天变量));
  return 聊天变量;
};
globalThis.insertOrAssignVariables = async patch => {
  聊天变量 = lodash.merge({}, 聊天变量, patch);
};

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const {
  PROMOTE_MIRROR_KEY,
  作废晋阶镜像时间线,
  等待晋阶镜像写入,
  镜像直写,
} = require('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts');

function deferred() {
  let resolve;
  const promise = new Promise(r => {
    resolve = r;
  });
  return { promise, resolve };
}

test.beforeEach(async () => {
  聊天变量 = {};
  阻塞下一写 = null;
  已进入阻塞写 = null;
  if (typeof 等待晋阶镜像写入 === 'function') await 等待晋阶镜像写入();
});

test('回档世代作废后，已经起跑的旧异步写也不能复活镜像', async () => {
  assert.equal(typeof 作废晋阶镜像时间线, 'function');
  assert.equal(typeof 等待晋阶镜像写入, 'function');

  const 门 = deferred();
  const 已进入 = deferred();
  阻塞下一写 = 门.promise;
  已进入阻塞写 = 已进入.resolve;

  镜像直写('101', { 阶段: 4 });
  await 已进入.promise;
  const 作废 = 作废晋阶镜像时间线();
  门.resolve();
  await 作废;
  await 等待晋阶镜像写入();

  assert.equal(聊天变量[PROMOTE_MIRROR_KEY] ?? null, null);
});

test('作废后的新世代写排在清场之后并能正常保留', async () => {
  assert.equal(typeof 作废晋阶镜像时间线, 'function');
  assert.equal(typeof 等待晋阶镜像写入, 'function');

  const 门 = deferred();
  const 已进入 = deferred();
  阻塞下一写 = 门.promise;
  已进入阻塞写 = 已进入.resolve;

  镜像直写('101', { 阶段: 5 });
  await 已进入.promise;
  const 作废 = 作废晋阶镜像时间线();
  镜像直写('101', { 阶段: 1 });
  门.resolve();

  await 作废;
  await 等待晋阶镜像写入();
  assert.equal(聊天变量[PROMOTE_MIRROR_KEY].户['101'].阶段, 1);
});

test('时间撤销也在恢复旧聊天镜像前作废写世代，失败补偿会恢复原聊天快照', () => {
  const index = readFileSync('src/人妻公寓/脚本/游戏逻辑/index.ts', 'utf8');
  const start = index.indexOf('function 处理撤销时间推进');
  const end = index.indexOf("eventOn('人妻公寓:撤销时间推进'", start);
  const body = index.slice(start, end);

  assert.match(body, /作废当前手机时间线租约世代\(\)[\s\S]{0,160}await 作废晋阶镜像时间线\(\)/);
  assert.match(body, /镜像世代已作废 = true/);
  assert.match(body, /聊天已恢复 \|\| 镜像世代已作废/);
  assert.match(body, /恢复时间聊天备份\(推进后聊天备份/);
});
