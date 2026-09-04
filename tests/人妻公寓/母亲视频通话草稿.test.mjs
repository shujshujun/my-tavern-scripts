/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  母亲视频通话草稿键,
  读取母亲视频通话草稿,
  保存母亲视频通话草稿,
  清除母亲视频通话草稿,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/母亲视频通话草稿.ts');

class 假会话存储 {
  #值 = new Map();

  getItem(键) {
    return this.#值.has(键) ? this.#值.get(键) : null;
  }

  setItem(键, 值) {
    this.#值.set(键, String(值));
  }

  removeItem(键) {
    this.#值.delete(键);
  }
}

test('视频通话草稿按聊天与通话标识隔离，并能从会话存储恢复刷新前内容', () => {
  const 存储 = new 假会话存储();
  const 键A = 母亲视频通话草稿键('chat-a', 'call-a');
  const 键B = 母亲视频通话草稿键('chat-a', 'call-b');
  assert.notEqual(键A, 键B);

  存储.setItem(键A, '刷新前已经写到一半');
  assert.equal(读取母亲视频通话草稿('chat-a', 'call-a', 存储), '刷新前已经写到一半');
  assert.equal(读取母亲视频通话草稿('chat-a', 'call-b', 存储), '');

  保存母亲视频通话草稿('chat-a', 'call-b', '另一通电话的草稿', 存储);
  assert.equal(存储.getItem(键B), '另一通电话的草稿');
  assert.equal(读取母亲视频通话草稿('chat-a', 'call-b', 存储), '另一通电话的草稿');
});

test('发送成功后清理草稿，不会在同一通电话重绘时复活旧文本', () => {
  const 存储 = new 假会话存储();
  保存母亲视频通话草稿('chat-clear', 'call-clear', '准备发送', 存储);
  assert.equal(读取母亲视频通话草稿('chat-clear', 'call-clear', 存储), '准备发送');

  清除母亲视频通话草稿('chat-clear', 'call-clear', 存储);
  assert.equal(读取母亲视频通话草稿('chat-clear', 'call-clear', 存储), '');
  assert.equal(存储.getItem(母亲视频通话草稿键('chat-clear', 'call-clear')), null);
});
