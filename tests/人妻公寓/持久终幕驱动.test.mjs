/* eslint-disable import-x/no-nodejs-modules -- Node-only lifecycle regression tests */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 创建持久终幕驱动 } = require('../../src/人妻公寓/脚本/游戏逻辑/持久终幕驱动.ts');
const { Schema } = require('../../src/人妻公寓/schema.ts');
const video = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话系统.ts');
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
function fixture() {
  const timers = new Map();
  let next = 0;
  const errors = [];
  const driver = 创建持久终幕驱动({
    失败: error => errors.push(String(error)),
    定时: (fn, ms) => {
      timers.set(++next, { fn, ms });
      return next;
    },
    清定时: id => timers.delete(id),
  });
  const tick = async ms => {
    const pair = [...timers].find(([, item]) => item.ms === ms);
    assert.ok(pair, `missing ${ms} timer`);
    timers.delete(pair[0]);
    pair[1].fn();
    await flush();
  };
  return { driver, timers, errors, tick };
}
function terminal(frame = 2) {
  return Schema.parse({
    系统: {
      _双重继承: { 阶段: '视频已预约' },
      _母亲视频通话终幕: {
        标识: '双重继承',
        状态: '终幕中',
        终幕CG序号: frame,
        最终交接已出现: true,
        玩家最终回答已保存: true,
      },
      _父亲通话: { 标识: '双重继承', 模式: '双重继承视频', 状态: '通话中', 期: 1 },
    },
  });
}

test('真实终幕CAS只提交当前帧，七帧结束后只进入钥匙收束，不提前提交结局', () => {
  const data = terminal();
  assert.equal(video.提交母亲视频终幕帧(data, '双重继承', 2).成功, true);
  assert.equal(video.提交母亲视频终幕帧(data, '双重继承', 2).成功, false);
  for (let frame = 3; frame <= 7; frame++) assert.equal(video.提交母亲视频终幕帧(data, '双重继承', frame).成功, true);
  assert.equal(data.系统._母亲视频通话终幕.状态, '已完成');
  assert.equal(data.系统._母亲视频通话终幕.父亲已挂断, true);
  assert.equal(data.系统._双重继承.阶段, '待总钥匙归位');
  assert.equal(data.系统._已完成特殊场景.includes('双重继承'), false);
  assert.equal(video.提交母亲视频终幕帧(data, '双重继承', 7).成功, false);
});

test('终幕错通话、未保存最终回答和错误帧不修改状态，序列化后的中间帧可恢复', () => {
  for (const change of [
    d => {
      d.系统._父亲通话.标识 = '其他电话';
    },
    d => {
      d.系统._母亲视频通话终幕.玩家最终回答已保存 = false;
    },
  ]) {
    const data = terminal();
    change(data);
    const before = lodash.cloneDeep(data);
    assert.equal(video.提交母亲视频终幕帧(data, '双重继承', 2).成功, false);
    assert.deepEqual(data, before);
  }
  const saved = Schema.parse(JSON.parse(JSON.stringify(terminal(4))));
  assert.equal(video.提交母亲视频终幕帧(saved, '双重继承', 4).成功, true);
  assert.equal(saved.系统._母亲视频通话终幕.终幕CG序号, 5);
  assert.equal(saved.系统._母亲视频通话终幕.父亲已挂断, true);
  const legacy = terminal(7);
  legacy.系统._母亲视频通话终幕.父亲已挂断 = true;
  legacy.系统._父亲通话.模式 = '母亲视频通话终幕';
  legacy.系统._父亲通话.状态 = '收尾中';
  assert.equal(video.提交母亲视频终幕帧(legacy, '双重继承', 7).成功, true);
});

test('自动驱动串行、同键重复恢复不加速，最终完成后释放定时器', async () => {
  const f = fixture();
  let frame = 2;
  const writes = [];
  const task = {
    仍有效: () => true,
    读取帧: () => (frame <= 7 ? frame : null),
    提交: async expected => {
      writes.push(expected);
      frame++;
      return true;
    },
  };
  const run = f.driver.播放('chat:0:call', task);
  assert.equal(f.driver.播放('chat:0:call', task), run);
  for (let i = 2; i <= 7; i++) await f.tick(4000);
  await run;
  assert.deepEqual(writes, [2, 3, 4, 5, 6, 7]);
  assert.equal(f.timers.size, 0);
});

test('取消、切聊天及回档停止旧驱动，刷新可从持久帧重新播放', async () => {
  const f = fixture();
  let valid = true;
  let writes = 0;
  const task = {
    仍有效: () => valid,
    读取帧: () => 4,
    提交: async () => {
      writes++;
      return false;
    },
  };
  const run = f.driver.播放('old', task);
  valid = false;
  await f.tick(4000);
  await run;
  assert.equal(writes, 0);
  valid = true;
  const rerun = f.driver.播放('new', task);
  f.driver.停止();
  await rerun;
  assert.equal(writes, 0);
  assert.equal(f.timers.size, 0);
});

test('保存失败停在原帧；超时后的旧写入校验失效，不得认领新播放', async () => {
  const f = fixture();
  let validWrite;
  let resolve;
  const run = f.driver.播放('chat', {
    仍有效: () => true,
    读取帧: () => 3,
    提交: (_frame, valid) => {
      validWrite = valid;
      return new Promise(r => {
        resolve = r;
      });
    },
  });
  await f.tick(4000);
  assert.equal(validWrite(), true);
  await f.tick(60000);
  await run;
  assert.equal(validWrite(), false);
  assert.match(f.errors[0], /超时/);
  resolve(true);
  await flush();
  assert.equal(f.timers.size, 0);
  const retry = f.driver.播放('chat', { 仍有效: () => true, 读取帧: () => 3, 提交: async () => false });
  await f.tick(4000);
  await retry;
  assert.match(f.errors[1], /尚未保存/);
});
