/* eslint-disable import-x/no-nodejs-modules -- 保存故障注入；真实发送、批次、变量与镜像实现。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createPhone, deferred } from './helpers/手机发送草稿环境.mjs';

const original = '请确认周末维修时间。';
const next = '另外请检查楼道照明。';

async function start(e, text = original) {
  e.type(text); e.button().click(); await e.settle();
  return e.sends.length;
}

test('宿主保存永久pending：已入库气泡及时确认接受并释放草稿写入态', async () => {
  const e = createPhone();
  e.st.saveMetadata = () => new Promise(() => {});
  await start(e);
  let result;
  e.sends[0].promise.then(value => { result = value; });
  await e.settle();
  assert.equal(result?.已接受, true);
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.draft(), undefined);
  assert.equal(e.transient.会话草稿正在发送(e.key()), false);
  assert.equal(e.transient.手机聊天批次.状态(e.key()).写入中数, 0);
  assert.equal(e.transient.手机聊天批次.状态(e.key()).待回复数, 1);
  assert.ok(e.local.values.size, '实际数据层已写浏览器恢复镜像');
});

test('保存pending期间可追加第二条，两个稳定身份各写一次', async () => {
  const e = createPhone(); e.st.saveMetadata = () => new Promise(() => {});
  await start(e); await start(e, next);
  assert.equal(e.sends.length, 2);
  assert.deepEqual(e.playerMessages().map(m => m.文), [original, next]);
  assert.equal(new Set(e.playerMessages().map(m => m.标识)).size, 2);
  assert.equal(e.transient.手机聊天批次.状态(e.key()).写入中数, 0);
});

for (const outcome of ['resolve', 'reject']) {
  test(`已接受后迟到保存${outcome}不覆盖新文字与新引用`, async () => {
    const e = createPhone(); const gate = deferred();
    e.st.saveMetadata = () => gate.promise;
    await e.addQuote(); await start(e);
    e.type(next); const quote = await e.addQuote('第二次维修说明。');
    if (outcome === 'resolve') gate.resolve(); else gate.reject(new Error('late save error'));
    await e.settle();
    assert.equal(e.draft(), next);
    assert.equal(e.textarea().value, next);
    assert.deepEqual(e.transient.取会话引用草稿(e.key()), quote);
    assert.equal(e.playerMessages().length, 1);
    if (outcome === 'reject') assert.ok(e.events.some(x => /请勿重复发送/.test(String(x[1]))));
  });
}

test('保存pending期间仍能触发实际回复失败收口，不重复玩家气泡', async () => {
  const e = createPhone(); e.st.saveMetadata = () => new Promise(() => {});
  await start(e);
  e.transient.手机聊天批次.立即发送(e.key()); await e.settle();
  assert.ok(e.externalCalls > 0);
  assert.equal(e.transient.手机聊天批次.状态(e.key()).灯, '绿');
  assert.equal(e.leases.手机生成租约持有中(), false);
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.draft(), undefined);
});

test('保存排队中切换世代：旧保存和旧补存不得取得新时间线', async () => {
  const e = createPhone(); const gate = deferred(); let saves = 0;
  e.st.saveMetadata = () => { saves++; return gate.promise; };
  await start(e); await start(e, next);
  e.timeline.作废当前手机时间线租约世代();
  e.transient.清理失效手机聊天批次(); e.render(); e.type('新时间线草稿。');
  gate.resolve(); await e.settle(); await e.flushTimers(); await e.settle();
  assert.equal(saves, 1, '仅原来已经调用的保存；不启动失效排队请求/补存');
  assert.equal(e.draft(), '新时间线草稿。');
});

test('变量回调已提交后抛异常：确认接受后仍请求实际保存', async () => {
  const e = createPhone(); const first = e.updateCalls + 1;
  e.afterUpdate = call => { if (call === first) throw new Error('post-commit failure'); };
  await start(e);
  assert.equal((await e.sends[0].promise).已接受, true);
  assert.equal(e.saves.length, 1);
  assert.equal(e.server.envelope.vars._微信.消息.filter(m => m.发 === '我').length, 1);
});

test('变量写入永久pending：到期保留草稿并取消迟到提交资格，可重试一次', async () => {
  const e = createPhone(); const gate = deferred(); e.beforeUpdate = () => gate.promise;
  await start(e);
  const deadline = [...e.timers.values()].find(timer => timer.ms === 10000);
  assert.ok(deadline, '变量写入必须有本地等待上限');
  deadline.cb(); await e.settle();
  assert.equal((await e.sends[0].promise).已接受, false);
  assert.equal(e.draft(), original);
  assert.equal(e.leases.手机生成租约持有中(), false);
  assert.equal(e.transient.会话草稿正在发送(e.key()), false);
  e.beforeUpdate = undefined;
  await start(e); gate.resolve(); await e.settle();
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.playerMessages()[0].文, original);
});

test('变量已提交但确认永久pending：到期核真实身份并保存，不回填原文', async () => {
  const e = createPhone(); const gate = deferred(); const first = e.updateCalls + 1;
  e.afterUpdate = call => call === first ? gate.promise : undefined;
  await start(e);
  assert.equal(e.playerMessages().length, 1);
  const deadline = [...e.timers.values()].find(timer => timer.ms === 10000);
  assert.ok(deadline); deadline.cb(); await e.settle();
  assert.equal((await e.sends[0].promise).已接受, true);
  assert.equal(e.draft(), undefined);
  assert.equal(e.saves.length, 1);
  e.type(next); gate.resolve(); await e.settle();
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.draft(), next);
});

test('写入永久pending时切聊天：失效检查释放旧票，迟到回调不写新聊天', async () => {
  const e = createPhone(); const gate = deferred(); e.beforeUpdate = () => gate.promise;
  await start(e); const oldKey = e.key();
  e.id = 'new-chat'; e.vars = {}; e.transient.清理失效手机聊天批次(); e.render(); e.type(next);
  const poll = [...e.timers.values()].find(timer => timer.ms === 250);
  assert.ok(poll); poll.cb(); await e.settle();
  assert.equal(e.transient.会话草稿正在发送(oldKey), false);
  gate.resolve(); await e.settle();
  assert.equal(e.playerMessages().length, 0);
  assert.equal(e.draft(), next);
});
