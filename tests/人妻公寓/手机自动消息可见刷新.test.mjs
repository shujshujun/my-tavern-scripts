/* eslint-disable import-x/no-nodejs-modules -- 生产主函数与真实提交/去重/刷新注册表；不访问玩家宿主或模型。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createTickHost, ordinary, receipt, moment } from './helpers/手机节拍可见刷新环境.mjs';
import { deferred } from './helpers/手机发送草稿环境.mjs';
import { consumerKit } from './helpers/微信余波消费环境.mjs';

for (const [name, message] of [
  ['无键普通私聊', ordinary()],
  ['无键楼务群', ordinary({ 会话: '群', 文: '夏乔:楼道的灯已经修好了，谢谢。' })],
  ['无键姐妹群', ordinary({ 会话: '姐妹群', 文: '夏乔:楼道的灯修好了。' })],
  ['无键照片', ordinary({ 图: '夏乔/居家_1' })],
  ['无键撤回', ordinary({ 类: '撤回', 文: '' })],
  ['带键消息', ordinary({ 键: 'visible-key' })],
]) {
  test(`${name}：真实插入后才刷新一次`, async () => {
    const e = createTickHost();
    e.candidates.新消息 = [message];
    await e.tick();
    assert.equal(e.visible().length, 1, '确认真实消息已经插入，不能用候选代替');
    assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
    assert.equal(e.busy(), false);
    assert.equal(e.producerCalls, 1);
  });
}

test('只有隐藏收据：真实插入但不触发可见刷新；消息与水位仍保存', async () => {
  const e = createTickHost();
  e.candidates.新消息 = [receipt()];
  await e.tick();
  assert.equal(e.visible().length, 1);
  assert.deepEqual(e.refresh, { redraw: 0, badge: 0 });
  assert.equal(e.api.读库().节拍['可见刷新诊断'], 1);
});

test('隐藏收据混合无键消息：不能把整批当成隐藏内容', async () => {
  const e = createTickHost();
  e.candidates.新消息 = [receipt(), ordinary()];
  await e.tick();
  assert.equal(e.visible().length, 2);
  assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
});

test('稳定键重复：候选有内容但实插为零，不再次刷新', async () => {
  const e = createTickHost();
  e.candidates.新消息 = [ordinary({ 键: 'same' }), receipt('same')];
  await e.tick();
  assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
  await e.tick();
  assert.equal(e.visible().length, 2);
  assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
});

test('朋友圈对照及重复事件：真实新增刷新，重复候选不能冒充新内容', async () => {
  const e = createTickHost();
  e.candidates.新圈 = [moment({ 事件键: 'stable-moment' })];
  await e.tick();
  assert.equal(e.api.读库().圈.length, 1);
  assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
  await e.tick();
  assert.equal(e.api.读库().圈.length, 1);
  assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
});

test('零插入且只有节拍变更：不报新消息', async () => {
  const e = createTickHost();
  await e.tick();
  assert.equal(e.visible().length, 0);
  assert.equal(e.api.读库().节拍['可见刷新诊断'], 1);
  assert.deepEqual(e.refresh, { redraw: 0, badge: 0 });
});

test('写入异常：无真实消息、无刷新，释放节拍占用，不伪装成功', async () => {
  const e = createTickHost();
  e.rejectUpdate = true;
  e.candidates.新消息 = [ordinary()];
  await e.tick();
  assert.equal(e.visible().length, 0);
  assert.deepEqual(e.refresh, { redraw: 0, badge: 0 });
  assert.equal(e.busy(), false);
});

for (const stage of ['生成期间', 'updater回调前', 'updater提交后']) {
  test(`${stage}切聊天：迟到结果不刷新新聊天`, async () => {
    const e = createTickHost();
    const gate = deferred();
    let entered;
    const at = new Promise(resolve => { entered = resolve; });
    if (stage === '生成期间') e.producerGate = gate.promise;
    if (stage === 'updater回调前') e.beforeUpdate = () => { entered(); return gate.promise; };
    if (stage === 'updater提交后') e.afterUpdate = () => { entered(); return gate.promise; };
    e.candidates.新消息 = [ordinary({ 键: 'timeline-change-visible' })];
    const pending = e.tick();
    if (stage === '生成期间') { for (let i = 0; i < 40; i++) await Promise.resolve(); }
    else await at;
    e.id = 'other-chat';
    e.vars = {};
    gate.resolve();
    await pending;
    assert.equal(e.visible().length, 0);
    assert.deepEqual(e.refresh, { redraw: 0, badge: 0 });
    assert.equal(e.busy(), false);
  });
}

test('真实楼务群生产者→完整节拍主函数→实际入库→刷新，频率水位阻止同拍重发', async () => {
  const e = createTickHost();
  const clock = e.load('楼层时钟.ts');
  const selectedClock = Array.from({ length: 100 }, (_, i) => 20 + i)
    .find(value => clock.seededRandom(value, '群聊') < 0.25);
  assert.notEqual(selectedClock, undefined);
  for (const floor of e.st.chat) {
    floor.stat_data.系统._绝对时段 = selectedClock;
    for (const household of Object.values(floor.stat_data.户)) household.妻.当前阶段 = 1;
  }
  let providerCalls = 0;
  const kit = consumerKit(e, async () => {
    providerCalls++;
    return '夏乔:楼道的灯已经修好了，谢谢。';
  });
  e.sourceProducer = context => kit.楼务群自动消息(context);
  await e.tick();
  assert.equal(providerCalls, 1, JSON.stringify(e.warnings));
  assert.equal(e.visible().length, 1, JSON.stringify(e.warnings));
  assert.equal(e.visible()[0].会话, '群');
  assert.equal(e.visible()[0].键, undefined);
  assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
  await e.tick();
  assert.equal(providerCalls, 1);
  assert.equal(e.visible().length, 1);
  assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
});

test('统计只报告已提交且去重后的动态；旧调用者返回对象形状不变', async () => {
  const e = createTickHost();
  const oldStats = { 实际插入消息数: 9, 实际插入消息键: ['old'] };
  await e.api.写库增量({ 新圈: [], 新消息: [], 节拍改: {} }, () => true, oldStats);
  assert.deepEqual(oldStats, { 实际插入消息数: 0, 实际插入消息键: [] });
  const stats = { 实际插入消息数: 0, 实际插入消息键: [], 实际插入朋友圈数: 99 };
  const delta = {
    新消息: [], 节拍改: {},
    新圈: [moment({ 楼: 4, 时: 20, 事件键: 'stats-once' }), moment({ 楼: 4, 时: 20, 事件键: 'stats-once' })],
  };
  assert.equal(await e.api.写库增量(delta, () => true, stats), true);
  assert.equal(stats.实际插入朋友圈数, 1);
  assert.equal(e.api.读库().圈.length, 1);
  assert.equal(await e.api.写库增量(delta, () => true, stats), true);
  assert.equal(stats.实际插入朋友圈数, 0);
  e.rejectUpdate = true;
  await assert.rejects(e.api.写库增量(delta, () => true, stats), /controlled updater/);
  assert.equal(stats.实际插入朋友圈数, 0);
});

test('真实收据构造器产物仍为隐藏内容，不把保存收据当作玩家可见气泡', async () => {
  const e = createTickHost();
  const tx = e.load('手机/姐妹群跨容器事务.ts');
  const timeline = e.load('手机时间线租约.ts');
  const value = tx.构造双重继承群聊余波收据({
    聊天ID: e.id, 时间线世代: timeline.读取当前手机时间线租约世代(), 完成楼层: 4,
    批次ID: 'receipt-real-shape', 入群楼层: 4, 绝对时段: 20,
    锚签名: timeline.手机锚消息签名(e.st.chat[4]), 消息总数: 0, 无消息原因: '诊断收据',
  });
  e.candidates.新消息 = [tx.构造双重继承群聊余波收据消息(value, 4, 20)];
  await e.tick();
  assert.equal(e.visible().length, 1);
  assert.equal(e.visible()[0].会话, '__RQP_SYSTEM_TX__');
  assert.deepEqual(e.refresh, { redraw: 0, badge: 0 });
});

test('UI重绘抛错不撤回已入库消息、不二次请求候选', async () => {
  const e = createTickHost();
  e.failRedraw = true;
  e.candidates.新消息 = [ordinary({ 键: 'visible-ui-fail' })];
  await e.tick();
  assert.equal(e.visible().length, 1);
  assert.equal(e.producerCalls, 1);
  assert.equal(e.busy(), false);
});
