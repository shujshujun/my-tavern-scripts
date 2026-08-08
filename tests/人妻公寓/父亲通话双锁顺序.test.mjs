/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 排队MVU操作 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const { 排队父亲通话整表写 } = require('../../src/人妻公寓/脚本/游戏逻辑/父亲通话写租约.ts');
const index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 手机源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机系统.ts', import.meta.url), 'utf8');
// P5:父亲通话业务已迁移至 ./手机/交互/父亲通话,源码断言改读新所有者。
const 父亲通话源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/父亲通话.ts', import.meta.url), 'utf8');

function 截源(源, 开始, 结束) {
  const 起 = 源.indexOf(开始);
  const 止 = 源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源.slice(起, 止);
}

test('父亲内锁被占时，全局外锁任务按统一顺序等待并最终全部完成', async () => {
  const 顺序 = [];
  let 放行父亲;
  let 通知父亲已占;
  const 父亲门 = new Promise(resolve => {
    放行父亲 = resolve;
  });
  const 父亲已占 = new Promise(resolve => {
    通知父亲已占 = resolve;
  });
  let 通知第一项已取得;
  const 第一项已取得 = new Promise(resolve => {
    通知第一项已取得 = resolve;
  });

  const 既有父亲任务 = 排队父亲通话整表写(async () => {
    顺序.push('既有父亲内锁');
    通知父亲已占();
    await 父亲门;
    顺序.push('既有父亲释放');
  });
  await 父亲已占;

  const first = 排队MVU操作(async () => {
    顺序.push('第一项取得全局外锁');
    通知第一项已取得();
    await 排队父亲通话整表写(async () => {
      顺序.push('第一项取得父亲内锁');
    });
  });
  const second = 排队MVU操作(async () => {
    顺序.push('第二项取得全局外锁');
    await 排队父亲通话整表写(async () => {
      顺序.push('第二项取得父亲内锁');
    });
  });

  await 第一项已取得;
  assert.deepEqual(顺序, ['既有父亲内锁', '第一项取得全局外锁']);
  放行父亲();
  let timer;
  await Promise.race([
    Promise.all([既有父亲任务, first, second]),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('双锁任务超时，疑似锁反转')), 1500);
    }),
  ]).finally(() => clearTimeout(timer));
  assert.deepEqual(顺序, [
    '既有父亲内锁',
    '第一项取得全局外锁',
    '既有父亲释放',
    '第一项取得父亲内锁',
    '第二项取得全局外锁',
    '第二项取得父亲内锁',
  ]);
});

test('父亲入口源码均为全局MVU外锁到父亲内锁，且内锁后重读', () => {
  const 接听 = 截源(index源, "eventOn('人妻公寓:接听来电'", "eventOn('人妻公寓:父亲通话结束'");
  const 收尾 = 截源(index源, "eventOn('人妻公寓:父亲通话结束'", '// ─────────────────────────────────────────────');
  const 手机写 = 截源(父亲通话源, 'async function 持久修改父亲通话(', 'export function 来电已接');

  for (const 段 of [接听, 收尾]) {
    const 外锁 = 段.indexOf('安全操作');
    const 内锁 = 段.indexOf('排队父亲通话整表写');
    const 重读 = 段.indexOf('读取最近有效()', 内锁);
    assert.ok(外锁 >= 0 && 内锁 > 外锁 && 重读 > 内锁);
  }
  const 手机外锁 = 手机写.indexOf('排队MVU操作');
  const 手机内锁 = 手机写.indexOf('排队父亲通话整表写');
  const 手机重读 = 手机写.indexOf('读取最近有效()', 手机内锁);
  assert.ok(手机外锁 >= 0 && 手机内锁 > 手机外锁 && 手机重读 > 手机内锁);
  assert.doesNotMatch(index源, /排队父亲通话整表写\([\s\S]{0,180}安全操作/);
});

test('父亲异步回复冻结请求发起时的时间线世代，同聊天 swipe 后不能认领新分支', () => {
  const 手机写 = 截源(父亲通话源, 'async function 持久修改父亲通话(', 'export function 来电已接');
  const 回复 = 截源(父亲通话源, 'async function 推进父亲回复(', 'async function 通话应答');
  assert.match(手机写, /预期时间线世代 = 当前时间线切换世代\(\)/);
  assert.match(手机写, /登记MVU提交校验\(请求仍在原时间线\)/);
  assert.match(回复, /回复请求时间线世代 = 当前时间线切换世代\(\)/);
  assert.match(回复, /const 生成键 = `\$\{预期聊天ID\}\|\$\{回复请求时间线世代\}/);
  assert.match(回复, /持久修改父亲通话\([\s\S]*回复请求时间线世代/);
});
