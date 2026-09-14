/* eslint-disable import-x/no-nodejs-modules -- 真实发送、进度与恢复路径的中性回归。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './helpers/微信茶话会环境.mjs';
import { clone } from './helpers/微信事务恢复环境.mjs';

const chat = ['母亲:那就按刚才商量的安排办。', '夏乔:好的，我也确认了。'];

for (const state of ['继续', '暂缓', '拒绝', '转移话题', '未知']) {
  test(`${state}：聊天显示、只请求一次、不推进、不产生公开事实`, async () => {
    const e = fixture(chat, '坦白');
    e.progressState = state;
    const before = clone(e.data);
    assert.equal(await e.send(), true);
    assert.equal(e.calls, 1);
    assert.deepEqual(e.messages().map(m => m.文), chat);
    assert.equal(e.events.length, 0);
    assert.deepEqual(e.data, before);
    assert.equal(e.load('手机/姐妹群公开事实.ts').解析姐妹群公开事实(e.messages()).母亲关系已公开, false);
    assert.equal(await e.restore(), false);
  });
}

for (const intent of ['暂缓', '拒绝', '转移话题']) test(`意向为${intent}时完成标记不能覆盖玩家意向`, async () => {
  const e = fixture(chat, '转正事');
  e.intent = intent;
  assert.equal(await e.send(), true);
  assert.equal(e.events.length, 0);
});

for (const metadataText of ['', '<事件进度>{broken}</事件进度>', '<事件进度>{broken',
  '<事件进度>{}</事件进度><事件进度>{}</事件进度>']) {
  test(`缺失或异常附加信息不丢聊天、不显示JSON：${metadataText}`, async () => {
    const e = fixture(chat, '转正事');
    e.metadataText = metadataText;
    assert.equal(await e.send(), true);
    assert.deepEqual(e.messages().map(m => m.文), chat);
    assert.equal(e.events.length, 0);
    assert.equal(e.calls, 1);
  });
}

test('自然表达不用命中任务关键词；进度绑定实际气泡，重复提交不重复推进', async () => {
  const e = fixture(chat, '转正事');
  assert.equal(e.load('手机/回国茶话会验收.ts').验收回国正事文本(chat), false);
  assert.equal(await e.send(), true);
  assert.equal(e.commit().result.变动, true);
  assert.equal(e.commit().result.变动, false);
  assert.equal(e.data.系统._回国.正事已说明, true);
});

for (const change of ['不存在的依据', '其他任务', '其他目标']) test(`结构化信息${change}不能推进`, async () => {
  const e = fixture(chat, '转正事');
  e.progressOverride = { 任务: '转正事', 目标: '', 状态: '完成', 玩家意向: '继续', 依据: chat };
  if (change === '不存在的依据') e.progressOverride.依据 = ['根本没有显示过的内容'];
  if (change === '其他任务') e.progressOverride.任务 = '收束';
  if (change === '其他目标') e.progressOverride.目标 = '301';
  assert.equal(await e.send(), true);
  assert.equal(e.events.length, 0);
});

test('普通回复里缺少本步演员仍能显示，完成信息不能越过演员校验', async () => {
  const e = fixture(['夏乔:今天先聊聊晚饭吧。'], '转正事');
  assert.equal(await e.send(), true);
  assert.equal(e.messages().length, 1);
  assert.equal(e.events.length, 0);
});

test('缺本人发言的完成标记不能建立公开事实，正常完成后才可建立', async () => {
  const e = fixture(['夏乔:今天先聊聊晚饭吧。'], '坦白');
  assert.equal(await e.send(), true);
  const facts = () => e.load('手机/姐妹群公开事实.ts').解析姐妹群公开事实(e.messages());
  assert.equal(facts().母亲关系已公开, false);
  assert.equal(e.events.length, 0);
  e.lines = chat;
  assert.equal(await e.send(), true);
  assert.equal(facts().母亲关系已公开, true);
  assert.equal(e.commit().result.成功, true);
});

test('缺少任意同批气泡或修改进度都不能用原凭据提交', async () => {
  const e = fixture(chat, '转正事');
  await e.send();
  const [, submit, receipt] = e.events[0];
  const home = e.load('回国系统.ts');
  assert.equal(home.提交回国茶话会批次(e.data, submit, receipt.消息.slice(1)).成功, false);
  const proof = e.load('手机/回国提交凭据.ts');
  const context = { 聊天ID: e.id, 世代: receipt.世代, 绝对时段: e.clock(), 聊天消息: e.st.chat, 微信消息: e.messages() };
  assert.equal(proof.回国提交凭据有效(receipt, context), true);
  receipt.消息[0].事件进度.状态 = '继续';
  assert.equal(proof.回国提交凭据有效(receipt, context), false);
});

test('聊天已存而主状态未提交时恢复；恢复失败后可重试，成功后幂等', async () => {
  const e = fixture(chat, '转正事');
  await e.api.写库增量({ 新圈: [], 新消息: [{ 楼: 4, 时: 20, 会话: '姐妹群', 发: '我', 文: '就这么安排。', 标识: 'player-progress' }], 节拍改: {} });
  await e.send();
  assert.equal(e.data.系统._回国.正事已说明, false);
  const before = e.messages().length;
  e.failMvu = true;
  await assert.rejects(e.restore(), /controlled MVU/);
  assert.equal(e.data.系统._回国.正事已说明, false);
  e.failMvu = false;
  assert.equal(await e.restore(), true);
  assert.equal(e.data.系统._回国.正事已说明, true);
  assert.equal(await e.restore(), false);
  assert.equal(e.messages().length, before);
  assert.equal(e.calls, 1);
});

for (const change of ['切聊天', '回档', '重掷']) test(`${change}不恢复其他时间线的进度`, async () => {
  const e = fixture(chat, '转正事');
  await e.api.写库增量({ 新圈: [], 新消息: [{ 楼: 4, 时: 20, 会话: '姐妹群', 发: '我', 文: '就这么安排。', 标识: 'player-progress' }], 节拍改: {} });
  await e.send();
  if (change === '切聊天') e.onQueue = () => { e.id = 'other-chat'; };
  if (change === '回档') e.st.chat.pop();
  if (change === '重掷') { e.st.chat.at(-1).swipe_id = 1; e.st.chat.at(-1).mes = '另一个分支'; }
  assert.equal(await e.restore(), false);
});

test('旧档缺少新字段仍能继续聊天；缺进度时旧关键词也不能擅自提交', async () => {
  const e = fixture(['母亲:父亲一周后回国，公共区域按普通住户与管理员关系相处。', '夏乔:收到。'], '转正事');
  e.omitProgress = true;
  assert.equal(await e.send(), true);
  assert.equal(e.messages().every(m => m.事件进度?.状态 === '未知'), true);
  assert.equal(e.events.length, 0);
});

test('转移话题后下一次完成同一步，批次隔离，旧回复不重复', async () => {
  const e = fixture(chat, '转正事');
  e.progressState = '转移话题';
  await e.send();
  e.progressState = '完成';
  await e.send();
  assert.equal(e.events.length, 1);
  assert.equal(e.commit().result.成功, true);
  assert.equal(e.messages().length, 4);
  assert.equal(new Set(e.messages().map(m => m.键)).size, 4);
});
