/* eslint-disable import-x/no-nodejs-modules -- 内存宿主与受控DOM，不调用真实模型。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createPhone, deferred } from './helpers/手机发送草稿环境.mjs';

const text = '请把周末维修的具体时间告诉我。';

test('正常发送：真实端口与数据层只接受一条玩家消息，清对应文字与引用', async () => {
  const e = createPhone();
  await e.addQuote();
  e.type(text);
  e.button().click();
  await e.settle();
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.playerMessages()[0].文, text);
  assert.ok(e.playerMessages()[0].引用);
  assert.equal(e.draft(), undefined);
  assert.equal(e.transient.取会话引用草稿(e.key()), undefined);
  assert.equal(e.externalCalls, 0);
});

test('正文真实互斥拒绝：文字与有效引用原样保留，零玩家消息', async () => {
  const e = createPhone();
  const quote = await e.addQuote();
  const foreground = e.leases.取得前台生成租约();
  assert.ok(foreground);
  e.type(text);
  e.button().click();
  await e.settle();
  assert.equal(e.playerMessages().length, 0);
  assert.equal(e.draft(), text);
  assert.equal(e.textarea().value, text);
  assert.deepEqual(e.transient.取会话引用草稿(e.key()), quote);
  assert.ok(e.events.some(x => String(x[1]).includes('正文正在生成')));
  foreground.释放();
  e.render();
  e.button().click();
  await e.settle();
  assert.equal(e.playerMessages().length, 1);
});

test('变量更新明确失败：保留文字和引用、有可见反馈、释放手机租约', async () => {
  const e = createPhone();
  const quote = await e.addQuote();
  e.rejectUpdate = true;
  e.type(text);
  e.button().click();
  await e.settle();
  assert.equal(e.playerMessages().length, 0);
  assert.equal(e.draft(), text);
  assert.deepEqual(e.transient.取会话引用草稿(e.key()), quote);
  assert.ok(e.events.some(x => /未能|失败|未发送/.test(String(x[1]))));
  assert.equal(e.leases.手机生成租约持有中(), false);
});

test('延迟写入期间重绘及连续点击：同一草稿只提交一次', async () => {
  const e = createPhone();
  const gate = deferred();
  e.beforeUpdate = () => gate.promise;
  e.type(text);
  e.button().click();
  e.render();
  e.button().click();
  assert.equal(e.draft(), text);
  assert.equal(e.sends.length, 1);
  gate.resolve();
  await e.settle();
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.draft(), undefined);
});

test('旧发送迟到成功：保护改字再改回的ABA与后来选择的新引用', async () => {
  const e = createPhone();
  const first = await e.addQuote('原引用。');
  const second = await e.addQuote('新引用。');
  e.transient.写会话引用草稿(e.key(), first);
  e.render();
  const gate = deferred();
  e.beforeUpdate = () => gate.promise;
  e.type(text);
  e.button().click();
  e.type('后来输入的维修说明。');
  e.type(text);
  e.transient.写会话引用草稿(e.key(), second);
  e.render();
  gate.resolve();
  await e.settle();
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.draft(), text);
  assert.deepEqual(e.transient.取会话引用草稿(e.key()), second);
});
