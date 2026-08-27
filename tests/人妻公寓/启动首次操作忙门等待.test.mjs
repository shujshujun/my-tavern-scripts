/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
/**
 * 回归：新档进游戏后「第一次触发 AI 自动回复 100% 失败、必须手点重新生成正文」。
 *
 * 根因（2026-08-27）：启动收口的 同步入住世界书条目 / 同步整表视图 / 恢复镜像 / 捕获保护快照
 * 全部经 排队MVU操作 串行写回，而 挂载监听() 已先行完成、客户端已能发事件。玩家的第一次操作
 * 撞在仍未排空的整表队列上：走 执行回合 的主行动被判「另一项楼务操作正在保存」，走 安全操作
 * 的到场自动演出被判「内容正在生成」，客户端把它记成 失败行动 显示「刚才的生成没有完成」。
 *
 * 修复语义：忙门与提示文案一个都不放宽，只把“立刻判失败”改成“有界等整表队列排空再进原门”。
 * 因此本文件同时验证：(a) 等待纯函数的行为与超时；(b) 等待绝不入队/持锁/改事务；(c) 五个入口
 * 都在进原门之前先等；(d) 反例——原忙门本身必须仍在，且真有正文在生成时不得被等待旁路。
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.Mvu = { replaceMvuData: async () => {} };

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { MVU操作进行中, 排队MVU操作, 等待MVU操作空闲 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');

const index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 回合源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

/** 取某个 eventOn 监听体的源码片段（到下一个 eventOn( 之前）。 */
function 读监听体(事件名) {
  const 起 = index源.indexOf(`eventOn('${事件名}'`);
  assert.ok(起 >= 0, `必须存在 ${事件名} 监听`);
  const 下一个 = index源.indexOf('eventOn(', 起 + 8);
  return index源.slice(起, 下一个 < 0 ? undefined : 下一个);
}

test('空闲时立即返回 true，不产生任何等待与副作用', async () => {
  assert.equal(typeof 等待MVU操作空闲, 'function', '必须暴露可测试的有界等待纯函数');
  assert.equal(MVU操作进行中(), false);
  assert.equal(await 等待MVU操作空闲(50), true, '队列本来就空时必须立刻放行');
  assert.equal(MVU操作进行中(), false, '等待自身绝不入队，不得把忙门算到自己头上');
});

test('启动写回仍在排空时先等它归零，再放行第一次操作（正是新档首次失败的窗口）', async () => {
  let 放行启动写回;
  const 启动闸门 = new Promise(resolve => {
    放行启动写回 = resolve;
  });
  // 复刻启动收口：整表写回已同步入队，客户端此刻已经能发事件。
  const 启动写回 = 排队MVU操作(async () => {
    await 启动闸门;
  });
  assert.equal(MVU操作进行中(), true, '同步入队起即忙——这正是首次操作被误判失败的原因');

  let 已放行 = false;
  const 首次操作 = 等待MVU操作空闲(4000).then(结果 => {
    已放行 = true;
    return 结果;
  });
  await new Promise(resolve => setTimeout(resolve, 120));
  assert.equal(已放行, false, '队列未排空前不得放行，否则会从缝隙读旧整表');

  放行启动写回();
  await 启动写回;
  assert.equal(await 首次操作, true, '启动写回排空后必须放行，而不是判失败');
  assert.equal(已放行, true);
  assert.equal(MVU操作进行中(), false);
});

test('等待不持锁、不入队：等待期间他人仍可正常排队并按序完成', async () => {
  const 次序 = [];
  let 放行甲;
  const 甲闸门 = new Promise(resolve => {
    放行甲 = resolve;
  });
  const 甲 = 排队MVU操作(async () => {
    await 甲闸门;
    次序.push('甲');
  });
  const 等待中 = 等待MVU操作空闲(4000);
  // 等待期间照常入队的乙必须能排在甲之后执行——证明等待没有占住串行租约。
  const 乙 = 排队MVU操作(() => {
    次序.push('乙');
  });
  放行甲();
  await Promise.all([甲, 乙]);
  assert.deepEqual(次序, ['甲', '乙'], '等待不得改变整表队列的串行顺序');
  assert.equal(await 等待中, true);
  assert.equal(MVU操作进行中(), false);
});

test('反例：超时不放宽语义，仍返回 false 交回原忙门判定', async () => {
  let 放行;
  const 闸门 = new Promise(resolve => {
    放行 = resolve;
  });
  const 长事务 = 排队MVU操作(async () => {
    await 闸门;
  });
  assert.equal(await 等待MVU操作空闲(120, 20), false, '超时必须回落到原忙门，不得假装已空闲');
  assert.equal(MVU操作进行中(), true, '超时后忙态仍是真值，原门据此广播原提示');
  放行();
  await 长事务;
  assert.equal(MVU操作进行中(), false);
});

test('五个玩家入口都在进原忙门之前先有界等待整表队列排空', () => {
  for (const 事件名 of [
    '人妻公寓:玩家行动',
    '人妻公寓:检查场景剧情',
    '人妻公寓:继续场景剧情',
    '人妻公寓:重掷',
    '人妻公寓:重新生成变量',
  ]) {
    const 监听体 = 读监听体(事件名);
    assert.match(监听体, /await 等待可开始新操作\(\)/, `${事件名} 必须先有界等待整表队列排空`);
  }
  // 等待必须发生在真正进入忙门之前：主行动的等待要早于 执行回合，到场演出要早于 安全操作。
  const 主行动 = 读监听体('人妻公寓:玩家行动');
  assert.ok(
    主行动.indexOf('await 等待可开始新操作()') < 主行动.indexOf('执行回合('),
    '主行动必须先等待再进回合引擎忙门',
  );
  const 到场 = 读监听体('人妻公寓:检查场景剧情');
  assert.ok(
    到场.indexOf('await 等待可开始新操作()') < 到场.indexOf('安全操作('),
    '到场自动演出必须先等待再进安全操作忙门',
  );
  // 等待只读 mvuIO 忙态：不得自造第二份计数真值。
  assert.match(
    index源,
    /function 等待可开始新操作\([^)]*\): Promise<boolean> \{\s*return 等待MVU操作空闲\(超时毫秒\);\s*\}/,
    '入口等待必须直接复用 mvuIO 的忙态真值，不得另建计数',
  );
});

test('反例：原有忙门与提示一个都不能被删除或放宽', () => {
  // 安全操作 的生成门（Problem 1 的「内容正在生成」出口）必须原样保留。
  const 安全操作段 = index源.slice(
    index源.indexOf('function 安全操作('),
    index源.indexOf('function 要求当前地点('),
  );
  assert.match(安全操作段, /回合进行中\(\) \|\| 前台生成租约持有中\(\)/, '安全操作的生成门必须保留');
  assert.match(安全操作段, /内容正在生成，本次操作没有发生/, '原提示文案不得改写');
  // 执行回合 的整表忙门与其提示必须原样保留：等待只是让首次操作有机会走到这里。
  const 回合入口 = 回合源.slice(
    回合源.indexOf('export async function 执行回合'),
    回合源.indexOf('const 回合时间线世代'),
  );
  assert.match(回合入口, /!选项\.已持MVU操作租约 && MVU操作进行中\(\)/, '回合引擎的整表忙门必须保留');
  assert.match(回合入口, /另一项楼务操作正在保存，请等它完成后再行动/, '原提示文案不得改写');
  // 等待不得把生成门一起等掉：真有正文在生成时必须仍按原提示失败，而不是排队等它结束。
  assert.doesNotMatch(
    index源.slice(
      index源.indexOf('function 等待可开始新操作('),
      index源.indexOf('function 安全操作('),
    ),
    /前台生成租约持有中|回合进行中/,
    '等待只针对整表写回队列；生成中仍走原提示，不得静默排队等待正文',
  );
});
