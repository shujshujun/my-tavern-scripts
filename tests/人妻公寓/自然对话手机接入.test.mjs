/* eslint-disable import-x/no-nodejs-modules -- 真实手机业务/存储/语义路由；仅模型与外部数据库为显式替身。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createPhone } from './helpers/手机发送草稿环境.mjs';
import { clone, productionFunction } from './helpers/微信事务恢复环境.mjs';

function phone(reply, status = '完成') {
  const e = createPhone({ registerBusiness: false, skipRenderer: true });
  e.observations = [];
  e.globals.crypto = crypto;
  e.globals.setTimeout = setTimeout; e.globals.clearTimeout = clearTimeout;
  e.globals.generateRaw = async options => {
    const req = JSON.parse(options.ordered_prompts[1].content);
    e.observations.push(req);
    if (e.observe) return e.observe(req, options);
    const m = req.消息.find(m => m.来源 === '角色');
    return '<自然观察>' + JSON.stringify({ 版本: 1, 事件: req.事件, 阶段: req.阶段, 分支: req.分支, 批次: req.批次,
      状态: status, 意向: '未明确', 依据: [{ 消息: m.id, 原文: m.文本 }], 意向依据: [], 选择: {}, 已谈主题: [] }) + '</自然观察>';
  };
  e.adapt('snapshotSystem.ts', { 妻状态包: () => '' });
  e.adapt('数据库桥.ts', { 同步社交轨迹: async () => '已确认', 数据库状态: () => ({ 可调用AI: false }) });
  e.adapt('手机/摘要系统.ts', { 排队刷新微信进展摘要() {}, 排队刷新群聊进展摘要() {} });
  e.adapt('手机/微信记忆上下文.ts', { 读取私聊记忆上下文: () => ({ 可知记忆: '', 最近聊天: '' }) });
  e.adapt('手机/配置.ts', { 读配置: () => e.config ?? ({ ai来源: '正文' }), 人设段: async () => '' });
  e.adapt('手机/朋友圈长期记忆.ts', { 构造朋友圈长期记忆事件键: () => 'fixture', 排队同步朋友圈长期记忆() {} });
  e.adapt('手机/生成引擎.ts', { 小生成: async () => reply,
    微信短文本: productionFunction('手机/生成引擎.ts', '微信短文本', { ...e.globals, ...e.api }),
    家庭事实: () => '', 称呼纪律: () => '', 口吻纪律: '' });
  return e;
}

for (const status of ['完成', '待续', '格式缺失']) {
  test(`微信邀约：生产注册入口/${status}，保存真实时间地点并避免重复认领`, async () => {
    const reply = '我把手边的工作收个尾，然后过去。';
    const e = phone(reply, status);
    if (status === '格式缺失') e.observe = () => 'missing';
    const wife = e.st.chat.at(-1).stat_data.户['101'].妻;
    Object.assign(wife, { 当前阶段: 5, 好感值: 90 }); wife.裂缝.已确认 = true;
    e.load('手机/交互/邀约与发消息.ts');
    const invite = () => e.portModule.取渲染业务端口().约多人出来(['101'], { 创建楼: 4, 创建绝对时段: 20, 目标绝对时段: 22, 地点: '天台' });
    await invite();
    const plan = e.api.读手机邀约计划();
    assert.ok(plan, JSON.stringify(e.warnings));
    assert.equal(plan.目标绝对时段, 22); assert.equal(plan.地点, '天台');
    const messages = e.api.读库().消息.filter(m => m.发 === '对方');
    assert.equal(messages.length, 1);
    if (status === '完成') assert.equal(messages[0].文, reply);
    else assert.match(messages[0].文, /［事件通知］.*天台/su);
    assert.equal(e.observations.length, 1);
    await invite();
    assert.deepEqual(e.api.读手机邀约计划(), plan, '再次发送邀约不创建第二份已接受计划');
  });
}

for (const status of ['完成', '待续', '格式缺失', '切换聊天']) {
  test(`家庭通知：生产通知总入口/${status}，原回复或事实通知实际落库`, async () => {
    const reply = '孩子平安，大家都好，等休息好了再慢慢和你讲。';
    const e = phone(reply, status), data = e.st.chat.at(-1).stat_data;
    if (status === '格式缺失') e.observe = () => 'missing';
    if (status === '切换聊天') e.observe = () => { e.id = 'another'; return 'missing'; };
    data.户['201'] = clone(data.户['101']);
    for (const node of Object.values(data.户)) Object.assign(node.妻, { 当前阶段: 4, 好感值: 60, 堕落值: 40, 上次互动楼层: 4 });
    Object.assign(data.户['101'].妻._怀孕, { 状态: '已告知', 已曝光: true, 受孕场次标识: 'neutral-birth-fixture' });
    Object.assign(data.户['101'].妻._生产, { 状态: '待产', 本胎序号: 1 });
    assert.equal(e.load('生产系统.ts').结算实际生产(data, '101', '完全缺席', 14).成功, true);
    const notices = e.load('手机/孕情AI通知.ts');
    await notices.同步孕产与家庭计划AI微信(data);
    const messages = e.api.读库().消息;
    if (status === '切换聊天') { assert.equal(messages.length, 0); return; }
    assert.ok(messages.length > 0, JSON.stringify(e.warnings));
    assert.ok(messages.every(m => status === '完成' ? m.文 === reply : m.文.startsWith('［事件通知］')));
    const n = messages.length;
    await notices.同步孕产与家庭计划AI微信(data);
    assert.equal(e.api.读库().消息.length, n);
  });
}

test('手机观察使用已选择的自定义模型；不会落入正文模型或保存密钥', async () => {
  const e = phone('今天有空。');
  e.config = { ai来源: '自定义', base: 'https://example.invalid/v1/', key: 'fixture-only', model: 'fixture-model' };
  e.observe = (req, options) => { assert.equal(options.custom_api.model, 'fixture-model'); assert.equal(options.custom_api.apiurl, 'https://example.invalid/v1'); return 'missing'; };
  const result = await e.load('手机/自然通知.ts').自然通知回复('微信邀约', '今天有空。', '按现有安排', '今天到天台。');
  assert.match(result, /事件通知/u); assert.equal(e.observations.length, 1);
  assert.equal(JSON.stringify(e.vars).includes('fixture-only'), false);
});

test('手机观察：选择数据库时使用数据库端口，不回退到正文模型', async () => {
  const e = phone('收到。'); e.config = { ai来源: '数据库' };
  let calls = 0;
  e.adapt('数据库桥.ts', { 数据库状态: () => ({ 可调用AI: true }), 通过数据库生成: async messages => {
    calls++; assert.equal(messages[0].role, 'system');
    return '<自然观察>{"fixture":true}</自然观察>';
  } });
  const result = await e.load('手机/对话观察路由.ts').请求手机对话观察({ 消息: [] }, new AbortController().signal);
  assert.equal(result.fixture, true); assert.equal(calls, 1); assert.equal(e.observations.length, 0);
});

test('手机观察：数据库不可用时报告失败，不改用其他模型', async () => {
  const e = phone('收到。'); e.config = { ai来源: '数据库' };
  await assert.rejects(e.load('手机/对话观察路由.ts').请求手机对话观察({ 消息: [] }, new AbortController().signal), /不可用/u);
  assert.equal(e.observations.length, 0);
  assert.equal(e.load('生成通道互斥.ts').手机生成租约持有中(), false);
});

test('手机观察：取消未结束的数据库识别后，释放手机租约且不采纳迟到结果', async () => {
  const e = phone('收到。'); e.config = { ai来源: '数据库' };
  let resolve;
  const pending = new Promise(yes => { resolve = yes; });
  e.adapt('数据库桥.ts', { 数据库状态: () => ({ 可调用AI: true }), 通过数据库生成: () => pending });
  const abort = new AbortController();
  const call = e.load('手机/对话观察路由.ts').请求手机对话观察({ 消息: [] }, abort.signal);
  abort.abort();
  await assert.rejects(call, /取消/u);
  assert.equal(e.load('生成通道互斥.ts').手机生成租约持有中(), false);
  resolve('<自然观察>{"fixture":true}</自然观察>');
  assert.equal(e.observations.length, 0);
});
