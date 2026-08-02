/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const 手机源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机系统.ts', import.meta.url), 'utf8');

function 截源(开始, 结束) {
  const 起 = 手机源.indexOf(开始);
  const 止 = 手机源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 手机源.slice(起, 止);
}

test('首次读取会从已有记录补出时锚，同楼新时段仍未读', () => {
  const { 规范手机已读时锚, 手机记录晚于已读 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机已读水位.ts');
  const 已有记录 = [{ 楼: 10, 时: 2 }];
  const 已读 = 规范手机已读时锚(10, undefined, 已有记录, 3);

  assert.deepEqual(已读, { 楼: 10, 时: 2 });
  assert.equal(手机记录晚于已读(已有记录[0], 10, 已读), false);
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3 }, 10, 已读), true);

  const 读库 = 截源('function 读库()', 'async function 写库增量(');
  assert.match(读库, /圈读时:\s*v\.圈读时\s*\?\?\s*创建手机已读时锚\(-1,\s*-1\)/);
});

test('回档裁剪后失配或超前时锚会按存活记录重建', () => {
  const { 规范手机已读时锚, 手机记录在当前时间线 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机已读水位.ts');
  const 记录 = [
    { 楼: 10, 时: 2 },
    { 楼: 10, 时: 5 },
  ];

  assert.deepEqual(规范手机已读时锚(10, { 楼: 12, 时: 5 }, 记录, 5), { 楼: 10, 时: 5 });
  assert.deepEqual(规范手机已读时锚(10, { 楼: 10, 时: 5 }, 记录, 3), { 楼: 10, 时: 2 });
  assert.equal(手机记录在当前时间线({ 楼: 10, 时: 5 }, 10, 3), false);
  assert.equal(手机记录在当前时间线({ 楼: 10 }, 10, 3), false);

  const 读库 = 截源('function 读库()', 'async function 写库增量(');
  assert.match(读库, /筛当前手机时间线\(v\.消息/);
  assert.match(读库, /筛当前手机时间线\(v\.圈/);
});

test('私聊、楼务群和姐妹群共用复合未读判定', () => {
  const { 规范手机已读时锚, 手机记录晚于已读 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机已读水位.ts');

  for (const 会话 of ['101', '群', '姐妹群']) {
    const 已读 = 规范手机已读时锚(8, undefined, [{ 会话, 楼: 8, 时: 1 }], 2);
    assert.equal(手机记录晚于已读({ 会话, 楼: 8, 时: 2 }, 8, 已读), true, 会话);
  }

  assert.match(手机源, /function 会话有未读/);
  assert.match(手机源, /m\.\u4f1a话 === 会话/);
  assert.match(手机源, /手机记录晚于已读/);
});

test('朋友圈也按楼号与绝对时段判断可见和未读', () => {
  assert.match(手机源, /圈读时/);
  assert.match(手机源, /function 朋友圈有未读/);
  const 渲染 = 截源('function 渲染(', '// ── 约出来');
  assert.match(渲染, /手机记录在当前时间线/);
  assert.match(渲染, /朋友圈有未读/);
});

test('所有已读写入同时保留数字楼水位与时锚，增量并发先规范当前库再追加新内容', () => {
  assert.match(手机源, /读时:\s*Record<string,\s*手机已读时锚>/);
  assert.match(手机源, /圈读时:\s*手机已读时锚/);
  assert.match(手机源, /读到改\?:\s*Record<string, 手机已读时锚>/);
  assert.match(手机源, /圈读到改\?:\s*手机已读时锚/);

  const 增量写 = 截源('async function 写库增量(', 'function 末楼');
  const 规范位 = 增量写.indexOf('规范已读水位');
  const 新圈位 = 增量写.indexOf('新鲜.圈.unshift');
  const 新消息位 = 增量写.indexOf('for (const 消息 of 新消息)');
  assert.ok(规范位 >= 0 && 规范位 < 新圈位 && 规范位 < 新消息位);
});

test('同楼 swipe 后旧分支已读锚退回切分支楼之前，新分支同楼同时段消息仍未读', () => {
  const { 手机分支变更后已读时锚, 手机记录晚于已读 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机已读水位.ts');
  const 新分支消息 = { 楼: 10, 时: 2 };
  const 锚 = 手机分支变更后已读时锚(10, { 楼: 10, 时: 2 }, [新分支消息], 2, 10, 10);
  assert.equal(锚.楼 < 10, true);
  assert.equal(手机记录晚于已读(新分支消息, 锚.楼, 锚), true);

  const 隔离段 = 截源('export async function 隔离当前手机分支', 'function 读库');
  assert.match(隔离段, /手机分支变更后已读时锚/);
});
