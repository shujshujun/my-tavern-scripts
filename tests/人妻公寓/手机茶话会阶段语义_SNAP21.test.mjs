/* eslint-disable import-x/no-nodejs-modules -- 独立宿主执行真实任务、解析、发送、凭据与路线提交。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { clone } from './helpers/微信事务恢复环境.mjs';
import { fixture } from './helpers/微信茶话会环境.mjs';



for (const task of ['坦白', '点评']) test('SNAP21 ' + task + '自由闲聊正常显示且不推进事件', async () => {
  const lines = ['母亲:茶还热，大家慢慢喝。', '夏乔:今天的茶挺好。'];
  const e = fixture(lines, task);
  if (task === '点评') e.data.系统._回国.已回应点评成员 = [];
  const before = clone(e.data);
  e.progressState = '继续';
  assert.equal(await e.send(), true);
  assert.equal(e.messages().length, lines.length);
  assert.equal(e.events.length, 0);
  assert.deepEqual(e.data, before);
});

for (const [task, lines] of [
  ['坦白', ['母亲:我和管理员已经不只是普通母子，我们是伴侣。', '夏乔:你把话说清楚就好。']],
  ['点评', ['母亲:夏乔，你最近总惦记着管理员，心思都写在眼神里了。', '夏乔:我就是在意他，这回不躲你了。']],
]) test(`SNAP21 ${task}真实内容经过发送凭据后提交`, async () => {
  const e = fixture(lines, task);
  if (task === '点评') e.data.系统._回国.已回应点评成员 = [];
  assert.equal(await e.send(), true, JSON.stringify(e.warnings));
  assert.equal(e.commit().result.成功, true);
  assert.equal(task === '坦白' ? e.data.系统._回国.母亲已坦白 : e.data.系统._回国.已点评成员.includes('101'), true);
});

for (const task of ['坦白', '点评']) test(`SNAP21 ${task}旧无关消息有真实送达凭据也不能完成任务`, async () => {
  const e = fixture(['母亲:茶还热，大家慢慢喝。', '夏乔:今天的茶挺好。'], task);
  if (task === '点评') e.data.系统._回国.已回应点评成员 = [];
  const before = clone(e.data), target = task === '点评' ? '101' : '-';
  await e.api.写库增量({ 新圈: [], 新消息: e.lines.map((文, i) => ({ 楼: 4, 时: 20, 会话: '姐妹群', 发: '对方', 文, 键: `回国茶话会:${task}:${target}:aLegacy:${i + 1}` })), 节拍改: {} });
  const stored = e.api.读库().消息;
  const timeline = e.load('手机时间线租约.ts'), proof = e.load('手机/回国提交凭据.ts');
  const receipt = proof.构造回国提交凭据(timeline.创建手机时间线租约(e.id, 4, e.st.chat, 20), stored);
  assert.equal(proof.回国提交凭据有效(receipt, { 聊天ID: e.id, 世代: timeline.读取当前手机时间线租约世代(), 绝对时段: 20, 聊天消息: e.st.chat, 微信消息: stored }), true);
  assert.equal(e.load('回国系统.ts').提交回国茶话会批次(e.data, { 任务: task, 目标: target, 玩家已发言: true }, receipt.消息).成功, false);
  assert.deepEqual(e.data, before);
});
test('SNAP21 点评使用当前玩家姓名，生成与提交保持一致', async () => {
  const e = fixture(['母亲:夏乔，你最近看阿桥的眼神藏不住心思了。', '夏乔:我就是在意他。'], '点评');
  e.st.name1 = '阿桥';
  e.data.系统._回国.已回应点评成员 = [];
  assert.equal(await e.send(), true);
  assert.equal(e.commit().result.成功, true);
});
for (const text of ['我和老公一直是伴侣。', '我和管理员并不是恋人。', '如果我和管理员是伴侣呢？']) {
  test(`SNAP21 其他关系、否定和设想不作为坦白：${text}`, async () => {
    const e = fixture([`母亲:${text}`, '夏乔:我听见了。'], '坦白');
    e.progressState = '继续';
    assert.equal(await e.send(), true);
    assert.equal(e.data.系统._回国.母亲已坦白, false);
    assert.equal(e.messages().length, 2);
    assert.equal(e.events.length, 0);
  });
}
for (const [task, target, lines, payload] of [
  ['改名反应', '-', ['母亲:新群名已经改好了。'], { 任务: '改名反应' }],
  ['回应回国', '101,102', ['夏乔:回国那天我会照常打招呼。'], { 任务: '回应回国', 回应成员: ['101', '102'] }],
  ['收束', '-', ['夏乔:正事已经说清楚了。'], { 任务: '收束' }],
]) test(`SNAP21 ${task}提交复核原生成端演员条件`, async () => {
  const e = fixture(lines, task);
  if (task === '改名反应') e.data.系统._回国.群名反应已完成 = false;
  const before = clone(e.data);
  const messages = lines.map((文, i) => ({ 楼: 4, 时: 20, 会话: '姐妹群', 发: '对方', 文, 键: `回国茶话会:${task}:${target}:aActors:${i + 1}` }));
  await e.api.写库增量({ 新圈: [], 新消息: messages, 节拍改: {} });
  const result = e.load('回国系统.ts').提交回国茶话会批次(e.data, { ...payload, 玩家已发言: true }, e.api.读库().消息);
  assert.equal(result.成功, false);
  assert.deepEqual(e.data, before);
});
