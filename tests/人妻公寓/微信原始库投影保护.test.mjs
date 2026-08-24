/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 合并手机记录投影 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/原始库投影.ts');
const 数据层源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts', import.meta.url), 'utf8');

test('普通增量只更新当前投影，刷新暂时隐藏的原始记录必须原样保留', () => {
  const 当前旧消息 = { id: 'current-old' };
  const 暂时隐藏消息 = { id: 'hidden-old' };
  const 当前新消息 = { id: 'current-new' };
  const 原始 = [当前旧消息, 暂时隐藏消息];

  assert.deepEqual(
    合并手机记录投影(原始, [当前旧消息], [当前旧消息, 当前新消息], '后'),
    [当前旧消息, 暂时隐藏消息, 当前新消息],
  );
});

test('朋友圈新增仍保持头插顺序，同时不覆盖其他分支的原始动态', () => {
  const 当前旧动态 = { id: 'current-old' };
  const 暂时隐藏动态 = { id: 'hidden-old' };
  const 当前新动态 = { id: 'current-new' };

  assert.deepEqual(
    合并手机记录投影([当前旧动态, 暂时隐藏动态], [当前旧动态], [当前新动态, 当前旧动态], '前'),
    [当前新动态, 当前旧动态, 暂时隐藏动态],
  );
});

test('摘要压缩只删除当前投影中确认可压缩的气泡，不得顺手删除隐藏分支', () => {
  const 当前旧一 = { id: 'current-1' };
  const 当前旧二 = { id: 'current-2' };
  const 暂时隐藏 = { id: 'hidden' };

  assert.deepEqual(
    合并手机记录投影([当前旧一, 暂时隐藏, 当前旧二], [当前旧一, 当前旧二], [当前旧二], '后'),
    [暂时隐藏, 当前旧二],
  );
});

test('数据层的普通写入与摘要压缩都通过原始库投影合并，序号从原始库最大值继续', () => {
  const 写入起 = 数据层源码.indexOf('export async function 写库增量');
  const 压缩起 = 数据层源码.indexOf('export async function 压缩微信会话记录');
  const 实时已读起 = 数据层源码.indexOf('export async function 写实时手机已读');
  assert.ok(写入起 >= 0 && 压缩起 > 写入起 && 实时已读起 > 压缩起);
  const 写入段 = 数据层源码.slice(写入起, 压缩起);
  const 压缩段 = 数据层源码.slice(压缩起, 实时已读起);

  assert.match(写入段, /合并手机记录投影\(v\.消息/);
  assert.match(写入段, /合并手机记录投影\(v\.圈/);
  assert.match(写入段, /\[\.\.\.v\.消息, \.\.\.v\.圈\]/, '单调序必须看原始库，隐藏记录也不得造成序号碰撞');
  assert.doesNotMatch(写入段, /_.set\(vars, '_微信', 新鲜\)/);
  assert.match(压缩段, /合并手机记录投影\(v\.消息/);
});
