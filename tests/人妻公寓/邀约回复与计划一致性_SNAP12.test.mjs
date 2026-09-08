/* eslint-disable import-x/no-nodejs-modules -- 使用真实构造器、短文本验收、计划CAS及隔离存储。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHost, clone, productionFunction, makePlan, delta } from './helpers/微信事务恢复环境.mjs';
import { createPhone } from './helpers/手机发送草稿环境.mjs';

function fixture(text, verdict = '接受', more = {}) {
  const e = createHost();
  const config = e.load('../../stageConfig.ts');
  const hard = e.load('手机/叙事硬事实.ts');
  e.planInput = { ...makePlan(), ...more };
  e.calls = 0;
  const short = productionFunction('手机/生成引擎.ts', '微信短文本', {
    ...e.globals, ...e.api,
  });
  const generate = productionFunction('手机/交互/邀约与发消息.ts', '生成邀约裁定回复', {
    ...e.globals, ...config, ...hard, ...e.load('楼层时钟.ts'),
    读取私聊记忆上下文: () => ({ 可知记忆: '', 最近聊天: '' }), 读库: e.api.读库,
    玩家名: () => '林舟', 小生成: async () => { e.calls++; return text; }, 微信短文本: short,
    手机可见单条硬上限: e.api.手机可见单条硬上限,
    口吻纪律: '', 家庭事实: () => '', 妻状态包: () => '', 人设段: async () => '', 称呼纪律: () => '',
  });
  e.generate = () => generate(clone(e.st.chat.at(-1).stat_data), '101', e.planInput, verdict, 4);
  return e;
}
const accepted = ['抱歉，刚才在忙，没问题，我们按约在天台见。', '好。', '可以。', '行！', '没问题。', '好，到时见。', '我会按约到天台。', '好的，周四晚上天台见。', '今天晚上天台见。'];
const rejected = ['今天天气真好，先这样吧。', '抱歉，刚才在忙。', '如果有空我就过去。', '好，我们改到大堂见面。', '好，今晚大堂见。', '好，明天晚上天台见。', '好，今天下午天台见。', '好，周五晚上天台见。', '你问我“好不好”，我还没想好。', '可以吗？', '我不答应去见面。', '我答应不去见面。', '好，我不去了。'];
for (const text of accepted) test(`SNAP12 明确接受 ${text}`, async () => {
  const e = fixture(text); assert.equal(await e.generate(), text); assert.equal(e.calls, 1);
});
for (const text of rejected) test(`SNAP12 拒收未承诺或另约 ${text}`, async () => {
  const e = fixture(text); assert.equal(await e.generate(), ''); assert.equal(e.calls, 1);
});
for (const verdict of ['拒绝', '改口拒绝']) {
  for (const text of ['抱歉，我去不了。', '今天不方便，改天吧。', '原先答应了，但现在不能赴约。']) test(`SNAP12 ${verdict} ${text}`, async () => {
    assert.equal(await fixture(text, verdict).generate(), text);
  });
  for (const text of ['抱歉。', '天气很好。', '家里有事，但我会去。', '好，到时见。']) test(`SNAP12 ${verdict}不能误认 ${text}`, async () => {
    assert.equal(await fixture(text, verdict).generate(), '');
  });
}
test('SNAP12 共同邀约实际回复与冻结计划同次写入，失败与重试保持CAS', async () => {
  const e = fixture('好，到时见。', '接受', { 邀请成员: ['101', '102'] });
  const text = await e.generate(); assert.ok(text);
  const candidate = delta([{ 楼: 4, 时: 20, 会话: '101', 发: '对方', 文: text, 键: 'phone12' }], { 邀约计划提交: e.planInput });
  assert.equal(await e.api.写库增量(candidate, () => false), false);
  assert.equal(e.api.读手机邀约计划(), null);
  assert.equal(await e.api.写库增量(candidate), true);
  assert.equal(e.api.读手机邀约计划().地点, '天台');
  assert.equal(e.api.读手机邀约计划().目标绝对时段, 22);
  assert.equal(await e.api.写库增量(candidate), false, '已接受成员的重复CAS不会再次认领');
  assert.equal(e.api.读库().消息.filter(m => m.键 === 'phone12').length, 1);
  const conflict = delta([], { 邀约计划提交: { ...makePlan('102'), 地点: '大堂' } });
  assert.equal(await e.api.写库增量(conflict), false);
  assert.equal(e.api.读手机邀约计划().地点, '天台');
});

for (const text of ['好，明天下午。', '可以，周五晚上。']) test(`SNAP12 复审：省略见面动词的另约也不能覆盖冻结时间 ${text}`, async () => {
  assert.equal(await fixture(text).generate(), '');
});

for (const [text, valid] of [
  ['好，周四晚上。', true], ['可以，今晚，天台。', true],
  ['好，明天我会去大堂办事，今天晚上天台见。', true],
  ['我明天下午要上班，今天晚上天台见。', true],
  ['好，天台，下午。', false], ['好，大堂。', false],
  ['好，今晚。', true], ['可以，明晚。', false],
  ['好，我会去大堂。', false], ['没问题，我会去天台。', true],
]) test(`SNAP12 约定与生活理由：${text}`, async () => {
  assert.equal(await fixture(text).generate(), valid ? text : '');
});

function entryFixture(reply) {
  const e = createPhone({ registerBusiness: false });
  const wife = e.st.chat.at(-1).stat_data.户['101'].妻;
  Object.assign(wife, { 当前阶段: 5, 好感值: 90 });
  wife.裂缝.已确认 = true;
  e.adapt('snapshotSystem.ts', { 妻状态包: () => '' });
  e.adapt('数据库桥.ts', { 同步社交轨迹: async () => '已确认' });
  e.adapt('手机/摘要系统.ts', { 排队刷新微信进展摘要() {}, 排队刷新群聊进展摘要() {} });
  e.adapt('手机/微信记忆上下文.ts', { 读取私聊记忆上下文: () => ({ 可知记忆: '', 最近聊天: '' }) });
  e.adapt('手机/生成引擎.ts', {
    小生成: async () => reply,
    微信短文本: productionFunction('手机/生成引擎.ts', '微信短文本', { ...e.globals, ...e.api }),
    家庭事实: () => '', 称呼纪律: () => '', 口吻纪律: '',
  });
  e.adapt('手机/配置.ts', { 人设段: async () => '' });
  e.load('手机/交互/邀约与发消息.ts');
  e.invite = () => e.portModule.取渲染业务端口().约多人出来(['101'], {
    创建楼: 4, 创建绝对时段: 20, 目标绝对时段: 22, 地点: '天台',
  });
  return e;
}
for (const [reply, accepted] of [['好，明天下午。', false], ['好的，今晚天台见。', true]]) {
  test(`SNAP12 完整注册邀约入口：${reply}`, async () => {
    const e = entryFixture(reply);
    await e.invite();
    const plan = e.api.读手机邀约计划();
    assert.equal(Boolean(plan), accepted, JSON.stringify(e.warnings));
    assert.equal(e.api.读库().消息.some(m => m.发 === '对方' && m.文 === reply), accepted);
    if (accepted) {
      assert.equal(plan.目标绝对时段, 22);
      assert.equal(plan.地点, '天台');
    }
    assert.equal(e.transient.会话正在输入('101', e.id, e.timeline.读取当前手机时间线租约世代()), false);
  });
}
