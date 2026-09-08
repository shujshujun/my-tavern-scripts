/* eslint-disable import-x/no-nodejs-modules -- 隔离真实发送链，不连接玩家存档或外部服务。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createPhone, deferred } from './helpers/手机发送草稿环境.mjs';

const original = '请确认周末维修时间。';
const next = '另外请检查楼道照明。';

async function send(e, text = original) {
  e.type(text); e.button().click(); await e.settle();
  return e.sends.at(-1)?.promise;
}

for (const mode of ['success', 'throw', 'absent']) {
  test(`真实接受凭据与后续保存分离：${mode}`, async () => {
    const e = createPhone({ saveMode: mode });
    const receipt = await send(e);
    assert.equal(receipt.已接受, true);
    assert.equal(receipt.批次键, e.key());
    assert.equal(receipt.消息标识, e.playerMessages()[0].标识);
    assert.equal(e.playerMessages().length, 1);
    assert.equal(e.draft(), undefined);
    assert.equal(e.textarea().value, '');
    if (mode === 'throw') assert.ok(e.events.some(x => /请勿重复发送/.test(String(x[1]))));
    // 再按空输入只执行既有立即回复语义，不能把原草稿再写一遍。
    e.button().click(); await e.settle();
    assert.equal(e.playerMessages().length, 1);
    assert.equal(e.sends.length, 1);
  });
}

test('宿主变量回调已提交后才抛异常：以实际消息身份确认，不重发', async () => {
  const e = createPhone();
  const first = e.updateCalls + 1;
  e.afterUpdate = call => { if (call === first) throw new Error('controlled post-commit failure'); };
  const receipt = await send(e);
  assert.equal(receipt.已接受, true);
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.draft(), undefined);
  assert.ok(e.events.some(x => /已加入会话/.test(String(x[1]))));
});

test('入库后的同标识撤回墓碑仍属已接受，不复活原文', async () => {
  const e = createPhone();
  const first = e.updateCalls + 1;
  e.afterUpdate = async call => {
    if (call !== first) return;
    await e.api.修改微信消息容器(messages => messages.map(m => m.发 === '我'
      ? { ...m, 类: '撤回', 文: '你撤回了一条消息' } : m), e.id);
  };
  const receipt = await send(e);
  assert.equal(receipt.已接受, true);
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.playerMessages()[0].类, '撤回');
  assert.equal(e.playerMessages()[0].标识, receipt.消息标识);
  assert.equal(e.draft(), undefined);
});

test('发送入口未注册：保留文字/引用并提示，不写玩家消息', async () => {
  const e = createPhone({ registerBusiness: false });
  const quote = await e.addQuote();
  await send(e);
  assert.equal(e.draft(), original);
  assert.deepEqual(e.transient.取会话引用草稿(e.key()), quote);
  assert.equal(e.playerMessages().length, 0);
  assert.ok(e.events.some(x => /入口尚未就绪/.test(String(x[1]))));
  assert.equal(e.transient.会话草稿正在发送(e.key()), false);
});

test('真实活动剧情只读门拒绝，不降低硬门以保留草稿', async () => {
  const e = createPhone();
  const data = e.st.chat.at(-1).stat_data;
  const active = e.load('场景剧情事务.ts').激活新增场景剧情(data, {
    目标场景: '大堂', 标题: '维修交接', 内容: '确认维修的安排。', 行动: '确认交接', 触发楼层: 4,
  });
  assert.equal(active.成功, true);
  const receipt = await send(e);
  assert.equal(receipt.已接受, false);
  assert.equal(e.draft(), original);
  assert.equal(e.playerMessages().length, 0);
  assert.ok(e.events.some(x => /只读/.test(String(x[1]))));
  assert.equal(e.leases.手机生成租约持有中(), false);
});

test('发送后只改文字：旧引用可清，新文字必须保留', async () => {
  const e = createPhone();
  await e.addQuote();
  const gate = deferred(); e.beforeUpdate = () => gate.promise;
  e.type(original); e.button().click(); e.type(next);
  gate.resolve(); await e.settle();
  assert.equal(e.playerMessages()[0].文, original);
  assert.equal(e.draft(), next);
  assert.equal(e.textarea().value, next);
  assert.equal(e.transient.取会话引用草稿(e.key()), undefined);
});

test('发送后只换引用：已发文字清除，新引用必须保留', async () => {
  const e = createPhone();
  const first = await e.addQuote('第一条维修说明。');
  const second = await e.addQuote('第二条维修说明。');
  e.transient.写会话引用草稿(e.key(), first); e.render();
  const gate = deferred(); e.beforeUpdate = () => gate.promise;
  e.type(original); e.button().click();
  e.transient.写会话引用草稿(e.key(), second); e.render();
  gate.resolve(); await e.settle();
  assert.equal(e.draft(), undefined);
  assert.equal(e.textarea().value, '');
  assert.deepEqual(e.transient.取会话引用草稿(e.key()), second);
  assert.ok(e.screen.querySelector('.rqp-quote-draft'));
});

test('引用取消再选择同一条也是新修订，迟到成功不得清掉', async () => {
  const e = createPhone();
  const quote = await e.addQuote();
  const gate = deferred(); e.beforeUpdate = () => gate.promise;
  e.type(original); e.button().click();
  e.transient.删除会话引用草稿(e.key());
  e.transient.写会话引用草稿(e.key(), quote);
  gate.resolve(); await e.settle();
  assert.deepEqual(e.transient.取会话引用草稿(e.key()), quote);
  assert.equal(e.draft(), undefined);
});

test('迟到写入失败或受控超时：不以旧原文覆盖后来输入', async () => {
  const e = createPhone();
  const gate = deferred(); e.beforeUpdate = () => gate.promise;
  e.type(original); e.button().click(); e.type(next);
  gate.reject(new Error('controlled updater timeout')); await e.settle();
  assert.equal(e.draft(), next);
  assert.equal(e.textarea().value, next);
  assert.equal(e.playerMessages().length, 0);
  assert.equal(e.transient.会话草稿正在发送(e.key()), false);
  assert.equal(e.leases.手机生成租约持有中(), false);
});

for (const mode of ['切聊天', 'swipe世代', '回档世代', '时段变化世代', 'ABA世代']) {
  test(`旧写入未返回时${mode}：迟到结果不得写新时间线或清新草稿`, async () => {
    const e = createPhone();
    const gate = deferred(); e.beforeUpdate = () => gate.promise;
    e.type(original); const oldKey = e.key(); e.button().click();
    if (mode === '切聊天') { e.id = 'another-chat'; e.vars = {}; }
    else {
      if (mode === 'swipe世代') e.st.chat.at(-1).swipe_id = 1;
      if (mode === '回档世代') e.st.chat.pop();
      if (mode === '时段变化世代') e.st.chat.at(-1).stat_data.系统._绝对时段++;
      e.timeline.作废当前手机时间线租约世代();
      if (mode === 'ABA世代') e.timeline.作废当前手机时间线租约世代();
    }
    e.transient.清理失效手机聊天批次();
    e.transient.清理失效会话引用草稿();
    e.render(); e.type(next);
    assert.notEqual(e.key(), oldKey);
    gate.resolve(); await e.settle();
    assert.equal(e.playerMessages().length, 0);
    assert.equal(e.draft(), next);
    assert.equal(e.textarea().value, next);
    assert.equal(e.transient.会话草稿正在发送(oldKey), false);
  });
}

test('关闭后迟到成功只清已发草稿，重新打开不带回待发原文', async () => {
  const e = createPhone(); const gate = deferred(); e.beforeUpdate = () => gate.promise;
  e.type(original); e.button().click(); e.root.classList.remove('open');
  gate.resolve(); await e.settle();
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.draft(), undefined);
  e.root.classList.add('open'); e.render();
  assert.equal(e.textarea().value, '');
});

test('切联系人后旧完成不得清当前联系人文字与引用', async () => {
  const e = createPhone();
  const gate = deferred(); e.beforeUpdate = () => gate.promise;
  e.type(original); e.button().click();
  e.page = { 名: 'chat', 会话: '102' }; e.render(); e.type(next);
  gate.resolve(); await e.settle();
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.playerMessages()[0].会话, '101');
  assert.equal(e.draft(), next);
  assert.equal(e.textarea().value, next);
});

test('重绘后已脱离DOM的旧按钮不能发送，输入法确认回车与Shift换行不误发', async () => {
  const e = createPhone(); e.type(original); const oldButton = e.button(); e.render();
  oldButton.dispatch('click'); await e.settle();
  assert.equal(e.sends.length, 0);
  const ta = e.textarea();
  ta.dispatch('compositionstart'); ta.dispatch('keydown', { key: 'Enter', isComposing: true });
  ta.dispatch('compositionend'); ta.dispatch('keydown', { key: 'Enter', shiftKey: true });
  await e.settle(); assert.equal(e.sends.length, 0);
  ta.dispatch('keydown', { key: 'Enter', shiftKey: false, isComposing: false });
  await e.settle(); assert.equal(e.playerMessages().length, 1);
});

test('旧结果到达时新的输入法会话尚未产生input，也不能清除组合中的文字', async () => {
  const e = createPhone(); const gate = deferred(); e.beforeUpdate = () => gate.promise;
  e.type(original); e.button().click(); e.textarea().dispatch('compositionstart');
  gate.resolve(); await e.settle();
  assert.equal(e.draft(), original);
  assert.equal(e.textarea().value, original);
  assert.equal(e.playerMessages().length, 1);
});

test('真实批次后续依赖受控拒绝：已接受气泡不撤销、不回填、不重复提交', async () => {
  const e = createPhone(); await send(e);
  const id = e.playerMessages()[0].标识;
  e.transient.手机聊天批次.立即发送(e.key()); await e.settle();
  assert.ok(e.externalCalls > 0, '确实到达被隔离的生成依赖；未调用外部模型');
  assert.equal(e.playerMessages().length, 1);
  assert.equal(e.playerMessages()[0].标识, id);
  assert.equal(e.draft(), undefined);
  assert.equal(e.leases.手机生成租约持有中(), false);
  assert.equal(e.transient.手机聊天批次.状态(e.key()).灯, '绿');
});
