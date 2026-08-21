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

test('数据库迟到请求先隔离并发，达到最终上限后自动解锁；旧请求迟到 settle 不得释放新租约', async () => {
  const 租约 = 创建数据库AI租约();
  let 调用次数 = 0;
  const 结算器 = [];
  const 底层 = () => {
    调用次数 += 1;
    return new Promise(resolve => {
      结算器.push(resolve);
    });
  };

  // 第一轮：外层 30ms 超时，但在 80ms 最终上限前仍隔离迟到请求。
  const 第一轮 = 租约.执行([], {}, 底层, 30, 80);
  await assert.rejects(第一轮, /数据库AI调用超时/, '超时只拒绝外层');
  assert.equal(租约.在结算(), true, '最终上限前租约仍应隔离并发请求');

  const 第二轮 = 租约.执行([], {}, 底层, 30, 80);
  await assert.rejects(第二轮, /仍在结算/, '隔离期内并发第二次调用必须 fail closed');
  assert.equal(调用次数, 1, '并发第二次不得调用底层函数');

  // 第一轮底层永久 pending 时，租约也必须在硬上限后恢复，不能把整局永久锁死。
  await new Promise(resolve => setTimeout(resolve, 70));
  assert.equal(租约.在结算(), false, '达到最终占用上限后必须自动解锁');

  const 第三轮 = 租约.执行([], {}, 底层, 1000, 1200);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(调用次数, 2, '解锁后新请求可以正常启动');
  assert.equal(租约.在结算(), true);

  // 第一轮此时才迟到完成，不能把第三轮的新租约错误释放。
  结算器[0]('旧结果');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(租约.在结算(), true, '旧世代迟到 settle 不得释放新世代租约');

  结算器[1]('新结果');
  assert.equal(await 第三轮, '新结果');
  assert.equal(租约.在结算(), false, '当前世代结算后正常释放');
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
