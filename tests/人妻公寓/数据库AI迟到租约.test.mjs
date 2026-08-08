/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 创建数据库AI租约 } = require('../../src/人妻公寓/脚本/游戏逻辑/数据库AI租约.ts');
const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

test('数据库调用短时限超时后：外层拒绝、底层未 settle 仍 busy、并发第二次被拒且不调用底层、settle 后租约释放', async () => {
  const 租约 = 创建数据库AI租约();
  let 调用次数 = 0;
  let 悬空 = false;
  let 结算底层;
  const 底层 = () => {
    调用次数 += 1;
    return 悬空 ? new Promise(resolve => { 结算底层 = resolve; }) : Promise.resolve('结果');
  };

  // 第一轮：悬空底层 + 短时限 → 外层超时，租约保持 busy。
  悬空 = true;
  const 第一轮 = 租约.执行([], {}, 底层, 50);
  await assert.rejects(第一轮, /数据库AI调用超时/, '超时只拒绝外层');
  assert.equal(租约.在结算(), true, '底层未 settle 前租约必须保持 busy');

  // 并发第二次调用：fail closed，且不得调用传入的底层函数。
  const 第二轮 = 租约.执行([], {}, 底层, 50);
  await assert.rejects(第二轮, /仍在结算/, '并发第二次调用必须 fail closed');
  assert.equal(调用次数, 1, '并发第二次不得调用底层函数');

  // 底层 settle 后租约释放，下一次可执行。
  结算底层('结果');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(租约.在结算(), false, '底层 settle 后租约释放');
  悬空 = false;
  const 第三轮 = await 租约.执行([], {}, 底层, 50);
  assert.equal(第三轮, '结果');
  assert.equal(调用次数, 2, '下一次调用可以正常执行');
});

test('底层 reject 同样释放租约', async () => {
  const 租约 = 创建数据库AI租约();
  let 拒绝底层;
  const 底层 = () => new Promise((_resolve, reject) => { 拒绝底层 = reject; });
  const 轮 = 租约.执行([], {}, 底层, 1000);
  await new Promise(resolve => setTimeout(resolve, 0)); // 等底层先被调用
  拒绝底层(new Error('底层失败'));
  await assert.rejects(轮, /底层失败/, '底层 reject 应原样上抛');
  assert.equal(租约.在结算(), false, '底层 reject 后租约释放');
});

test('底层同步抛错同样释放租约', async () => {
  const 租约 = 创建数据库AI租约();
  const 底层 = () => { throw new Error('同步炸'); };
  await assert.rejects(租约.执行([], {}, 底层, 1000), /同步炸/, '同步异常应原样上抛');
  assert.equal(租约.在结算(), false, '同步异常后租约释放');
});

test('执行回合在数据库迟到租约存在时于取锁/临时楼/生成开始前失败关闭并发回合失败提示', () => {
  assert.match(回合源码, /import \{[\s\S]*全局数据库AI租约[\s\S]*\} from '\.\/数据库AI租约';/, '回合引擎应持有全局租约');
  const 段 = 回合源码.slice(回合源码.indexOf('export async function 执行回合('), 回合源码.indexOf('export async function 重掷回合'));
  const 锁位置 = 段.indexOf('进行中 = true');
  const 租约检查位置 = 段.indexOf('全局数据库AI租约.在结算()');
  const 失败事件位置 = 段.indexOf("eventEmit('人妻公寓:回合失败'");
  const 生成开始位置 = 段.indexOf("eventEmit('人妻公寓:生成开始')");
  const 恢复楼位置 = 段.indexOf('await 恢复遗留临时回合楼()');
  assert.ok(锁位置 >= 0, '执行回合应取得自身回合锁');
  assert.ok(租约检查位置 >= 0, '执行回合应检查数据库迟到租约');
  assert.ok(租约检查位置 < 锁位置, '租约检查必须先于取得自身回合锁');
  assert.ok(失败事件位置 >= 0 && 失败事件位置 < 锁位置, '命中租约时发出回合失败提示必须先于取锁（早退路径才不遗留客户端发送锁）');
  assert.ok(生成开始位置 >= 0 && 锁位置 < 生成开始位置, '取锁必须先于发“生成开始”');
  assert.ok(恢复楼位置 >= 0 && 锁位置 < 恢复楼位置, '取锁必须先于创建/恢复临时楼');
  assert.match(段, /return false/, '命中租约必须返回 false');
});
