/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { 创建受控生成等待, 受控生成超时错误前缀 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/受控生成等待.ts',
);

test('永久 pending 的供应商 Promise 到时只结束本地等待，并且停止回调只执行一次', async () => {
  let 停止次数 = 0;
  const 句柄 = 创建受控生成等待(new Promise(() => undefined), {
    超时毫秒: 15,
    超时说明: '手机生成',
    请求停止: () => {
      停止次数 += 1;
    },
  });
  await assert.rejects(
    句柄.结果,
    error => error instanceof Error && error.message === `${受控生成超时错误前缀}手机生成`,
  );
  assert.equal(句柄.已结束(), true);
  assert.equal(停止次数, 1);
  assert.equal(句柄.取消(), false, '已经超时的句柄不能二次停止');
});

test('手动取消立即拒绝；底层迟到成功不能复活已结束请求', async () => {
  let 完成底层;
  const 底层 = new Promise(resolve => {
    完成底层 = resolve;
  });
  let 停止次数 = 0;
  const 句柄 = 创建受控生成等待(底层, {
    超时毫秒: 1000,
    超时说明: '隔离事件',
    请求停止: () => {
      停止次数 += 1;
    },
  });
  assert.equal(句柄.取消('玩家取消'), true);
  await assert.rejects(句柄.结果, /玩家取消/);
  完成底层('迟到正文');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(句柄.已结束(), true);
  assert.equal(停止次数, 1);
  assert.equal(句柄.取消('重复取消'), false);
});

test('切聊天或回档使控制令牌失效时，本地等待主动结束并丢弃迟到结果', async () => {
  let 有效 = true;
  let 完成底层;
  const 底层 = new Promise(resolve => {
    完成底层 = resolve;
  });
  let 停止次数 = 0;
  const 句柄 = 创建受控生成等待(底层, {
    超时毫秒: 1000,
    超时说明: '手机生成',
    请求停止: () => {
      停止次数 += 1;
    },
    仍有效: () => 有效,
    失效说明: '手机生成上下文已经失效',
    有效性检查间隔毫秒: 5,
  });
  有效 = false;
  await assert.rejects(句柄.结果, /手机生成上下文已经失效/);
  assert.equal(停止次数, 1);
  完成底层('迟到回复');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(句柄.已结束(), true);
});
