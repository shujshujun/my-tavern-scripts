/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
let MVU写入次数 = 0;
globalThis.Mvu = {
  replaceMvuData: async () => {
    MVU写入次数 += 1;
  },
};

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 登记MVU提交校验, 排队MVU操作, 脚本写入 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const { 排队时间线切换协调 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间线切换协调.ts');
const index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
// P5:手机侧的全局 MVU 队列消费点（会场摘要/父亲通话）已迁至各自模块；手机系统.ts 已是纯 re-export 门面。
const 旁路源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/静音会议旁路.ts', import.meta.url), 'utf8');

test('正文安全操作与会场摘要共享同一租约，后项拿锁后才能重读前项真值', async () => {
  let 真值 = { 安全操作: 0, 会场摘要: 0 };
  let 放行安全操作;
  const 安全操作门 = new Promise(resolve => {
    放行安全操作 = resolve;
  });
  const 顺序 = [];

  const 安全操作 = 排队MVU操作(async () => {
    const 候选 = structuredClone(真值);
    顺序.push('安全操作重读');
    await 安全操作门;
    候选.安全操作 = 1;
    真值 = 候选;
    顺序.push('安全操作写回');
  });
  const 会场摘要 = 排队MVU操作(async () => {
    const 候选 = structuredClone(真值);
    顺序.push('摘要重读');
    候选.会场摘要 = 1;
    真值 = 候选;
  });

  await Promise.resolve();
  放行安全操作();
  await Promise.all([安全操作, 会场摘要]);
  assert.deepEqual(顺序, ['安全操作重读', '安全操作写回', '摘要重读']);
  assert.deepEqual(真值, { 安全操作: 1, 会场摘要: 1 });

  assert.match(index源, /排队MVU操作/);
  assert.match(旁路源码, /排队MVU操作/, '手机侧会场私聊摘要必须共享同一全局 MVU 队列');
});

test('已取得全局锁的旧操作在 await 期间失效后也不能提交整表', async () => {
  let 仍有效 = true;
  let 放行;
  const 闸门 = new Promise(resolve => {
    放行 = resolve;
  });
  MVU写入次数 = 0;

  const 旧操作 = 排队MVU操作(async () => {
    const 取消校验 = 登记MVU提交校验(() => 仍有效);
    try {
      await 闸门;
      await 脚本写入({});
    } finally {
      取消校验();
    }
  });
  await Promise.resolve();
  仍有效 = false; // 模拟宿主 swipe 已同步递增时间线世代，但协调任务仍排在本任务之后
  放行();

  await assert.rejects(旧操作, /时间线|分支/);
  assert.equal(MVU写入次数, 0, '失效旧任务不得先污染新分支再让协调读取污染值');
});

test('MVU 队列自动绑定入队世代，宿主切分支后无需调用方补登记也会拒绝旧写回', async () => {
  let 放行;
  const 闸门 = new Promise(resolve => {
    放行 = resolve;
  });
  MVU写入次数 = 0;

  const 旧操作 = 排队MVU操作(async () => {
    await 闸门;
    await 脚本写入({});
  });
  await Promise.resolve();
  const 切分支 = 排队时间线切换协调('测试活动写者失效', async () => undefined);
  放行();

  await assert.rejects(旧操作, /时间线|分支/);
  await 切分支;
  assert.equal(MVU写入次数, 0);
});
