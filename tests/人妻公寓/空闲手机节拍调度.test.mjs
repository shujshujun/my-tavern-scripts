/* eslint-disable import-x/no-nodejs-modules -- Node-only lifecycle regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { 创建空闲手机节拍调度器 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/空闲节拍调度.ts');

const hostWindow = {
  document: {},
  closed: false,
  frameElement: null,
  addEventListener() {},
  removeEventListener() {},
};
hostWindow.parent = hostWindow;
globalThis.window = hostWindow;
globalThis.SillyTavern = { getCurrentChatId: () => 'idle-phone-beat', chat: {} };
globalThis.getVariables = () => ({});
const 时间门 = require('../../src/人妻公寓/脚本/游戏逻辑/时间事务写入门.ts');
const 生成门 = require('../../src/人妻公寓/脚本/游戏逻辑/生成通道互斥.ts');

test('时间租约跨过首个微任务时，手机节拍继续等待到真正释放', async () => {
  const 调用 = [];
  const 释放 = 时间门.取得时间事务写入租约('idle-phone-beat', 'time-closeout');
  let 已释放 = false;
  const 调度器 = 创建空闲手机节拍调度器(
    {
      运行期忙碌: () => 时间门.时间事务阻止普通写入(),
      执行节拍: () => 调用.push('手机节拍'),
      等待: async () => {
        调用.push('等待收尾');
        if (!已释放) {
          已释放 = true;
          释放();
        }
        await Promise.resolve();
      },
    },
    { 超时毫秒: 100, 轮询毫秒: 1 },
  );

  调度器.请求();
  assert.deepEqual(调用, [], '请求调用栈内不得同步启动手机节拍');
  await setImmediate();
  assert.deepEqual(调用, ['等待收尾', '手机节拍']);
  assert.equal(时间门.时间事务阻止普通写入(), false);
});

test('变量结算的共享前台租约尚未释放时，回合后手机拍等待真实收尾', async () => {
  生成门.清空生成租约();
  const 租约 = 生成门.取得前台生成租约();
  assert.ok(租约);
  const 调用 = [];
  let 已释放 = false;
  const 调度器 = 创建空闲手机节拍调度器(
    {
      运行期忙碌: () => 生成门.前台生成租约持有中(),
      执行节拍: () => 调用.push('手机节拍'),
      等待: async () => {
        调用.push('等待变量收尾');
        if (!已释放) {
          已释放 = true;
          租约.释放();
        }
        await Promise.resolve();
      },
    },
    { 超时毫秒: 100, 轮询毫秒: 1 },
  );

  try {
    调度器.请求();
    assert.deepEqual(调用, []);
    await setImmediate();
    assert.deepEqual(调用, ['等待变量收尾', '手机节拍']);
    assert.equal(生成门.前台生成租约持有中(), false);
  } finally {
    租约.释放();
    生成门.清空生成租约();
  }
});

test('共享手机生成租约仍在占用时，下一拍等待租约释放', async () => {
  生成门.清空生成租约();
  const 租约 = 生成门.取得手机生成租约();
  assert.ok(租约);
  const 调用 = [];
  let 已释放 = false;
  const 调度器 = 创建空闲手机节拍调度器(
    {
      运行期忙碌: () => 生成门.手机生成租约持有中(),
      执行节拍: () => 调用.push('手机节拍'),
      等待: async () => {
        调用.push('等待手机租约');
        if (!已释放) {
          已释放 = true;
          租约.释放();
        }
        await Promise.resolve();
      },
    },
    { 超时毫秒: 100, 轮询毫秒: 1 },
  );

  try {
    调度器.请求();
    await setImmediate();
    assert.deepEqual(调用, ['等待手机租约', '手机节拍']);
    assert.equal(生成门.手机生成租约持有中(), false);
  } finally {
    租约.释放();
    生成门.清空生成租约();
  }
});

test('等待期间的多次回合完成和补拍请求合并为一次手机节拍', async () => {
  let 忙碌 = true;
  let 解除等待;
  const 等待门 = new Promise(resolve => {
    解除等待 = resolve;
  });
  let 节拍数 = 0;
  const 调度器 = 创建空闲手机节拍调度器(
    {
      运行期忙碌: () => 忙碌,
      执行节拍: () => {
        节拍数 += 1;
      },
      等待: () => 等待门,
    },
    { 超时毫秒: 1000, 轮询毫秒: 1 },
  );

  调度器.请求();
  调度器.请求();
  调度器.请求();
  await Promise.resolve();
  assert.equal(节拍数, 0);
  忙碌 = false;
  解除等待();
  await setImmediate();
  assert.equal(节拍数, 1);
});

test('节拍执行期间到达的新请求会在首拍结束后补跑一次', async () => {
  let 结束首拍;
  const 首拍门 = new Promise(resolve => {
    结束首拍 = resolve;
  });
  let 节拍数 = 0;
  const 调度器 = 创建空闲手机节拍调度器({
    运行期忙碌: () => false,
    执行节拍: async () => {
      节拍数 += 1;
      if (节拍数 === 1) await 首拍门;
    },
  });

  调度器.请求();
  await setImmediate();
  assert.equal(节拍数, 1);
  调度器.请求();
  结束首拍();
  await setImmediate();
  assert.equal(节拍数, 2);
});

test('真实恢复门持续存在时安静超时，不启动节拍也不制造玩家失败提示', async () => {
  let 当前 = 0;
  let 节拍数 = 0;
  const 警告 = [];
  const 调度器 = 创建空闲手机节拍调度器(
    {
      运行期忙碌: () => true,
      执行节拍: () => {
        节拍数 += 1;
      },
      当前时间: () => 当前,
      等待: async 毫秒 => {
        当前 += 毫秒;
      },
      警告: 消息 => 警告.push(消息),
    },
    { 超时毫秒: 5, 轮询毫秒: 2 },
  );

  调度器.请求();
  await setImmediate();
  assert.equal(节拍数, 0);
  assert.equal(警告.length, 1);
  assert.match(警告[0], /等待运行期收尾超时/);
});
