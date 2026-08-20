/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  创建变量重生成事务门,
  请求取消变量重生成事务,
  尝试进入变量重生成提交,
  标记变量重生成已提交,
} = require('../../src/人妻公寓/脚本/游戏逻辑/变量重生成事务门.ts');

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('提交前取消会关闭提交门，迟到结果不能再进入核心写入', () => {
  const 事务 = 创建变量重生成事务门();

  assert.equal(请求取消变量重生成事务(事务), true);
  assert.equal(事务.阶段, '可取消');
  assert.equal(事务.已取消, true);
  assert.equal(尝试进入变量重生成提交(事务), false);
  assert.equal(标记变量重生成已提交(事务), false);
});

test('进入核心提交后取消被拒绝，不能把已提交结果重新标成取消', () => {
  const 事务 = 创建变量重生成事务门();

  assert.equal(尝试进入变量重生成提交(事务), true);
  assert.equal(事务.阶段, '提交中');
  assert.equal(请求取消变量重生成事务(事务), false);
  assert.equal(事务.已取消, false);
  assert.equal(标记变量重生成已提交(事务), true);
  assert.equal(事务.阶段, '已提交');
  assert.equal(请求取消变量重生成事务(事务), false);
  assert.equal(事务.已取消, false);
});

test('重复进入提交和越级完成均失败关闭，不复活事务阶段', () => {
  const 未提交 = 创建变量重生成事务门();
  assert.equal(标记变量重生成已提交(未提交), false);
  assert.equal(未提交.阶段, '可取消');

  const 提交中 = 创建变量重生成事务门();
  assert.equal(尝试进入变量重生成提交(提交中), true);
  assert.equal(尝试进入变量重生成提交(提交中), false);
  assert.equal(标记变量重生成已提交(提交中), true);
  assert.equal(尝试进入变量重生成提交(提交中), false);
});

test('回合引擎在首次不可逆写前关提交门，提交中取消只由当前事务吸收', () => {
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 取消起点 = 引擎.indexOf('export function 取消变量重生成');
  const 提交起点 = 引擎.indexOf('const 提交 = await 持久写入变量重生成消息');
  assert.ok(取消起点 >= 0 && 提交起点 >= 0);

  const 取消段 = 引擎.slice(取消起点, 引擎.indexOf('async function 持久写入变量重生成消息', 取消起点));
  assert.match(取消段, /请求取消变量重生成事务/);
  assert.match(取消段, /return true/, '存在运行事务时始终吸收统一取消入口');

  const 提交前段 = 引擎.slice(Math.max(0, 提交起点 - 700), 提交起点);
  assert.match(提交前段, /身份仍有效/);
  assert.match(提交前段, /尝试进入变量重生成提交/);

  const 提交后段 = 引擎.slice(提交起点, 提交起点 + 1000);
  assert.match(提交后段, /标记变量重生成已提交/);
});
