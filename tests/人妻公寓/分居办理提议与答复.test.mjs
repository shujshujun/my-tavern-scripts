/* eslint-disable import-x/no-nodejs-modules -- PLAY-014 real first/rewrite/native consumers. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { Schema, route, clone, handoffProposal, productionSubmit, nativeCandidate, fixedReview } from './helpers/分居决定验收环境.mjs';

const proposals = [
  '许曼君要求正式进入离婚办理。赵国强沉默着，还没有作出答复。',
  '许曼君说：“我要求正式进入离婚办理。”赵国强尚未同意。',
  '许曼君亲口说出最终决定，赵国强尚未答复。',
  '赵国强没有同意进入离婚办理，只是安静听她把话说完。',
  '许曼君询问赵国强是否同意进入离婚办理，他没有回答。',
  '如果赵国强同意进入离婚办理，下一步才谈手续。他现在尚未回答。',
  '许曼君提出正式办理的要求，赵国强说：“我还没有同意。”',
  '赵国强昨天说过“我同意办理”，但眼下还没有回答这次提议。',
  '许曼君引用“赵国强同意进入离婚办理”这句话追问，他并未答复。',
  '赵国强同意先听她说，尚未答复离婚办理。',
  '许曼君同意进入离婚办理，赵国强只是听着。',
  '许曼君说：“你是否同意进入离婚办理？”赵国强沉默着。',
  '赵国强没有说过自己同意进入离婚办理。',
  '许曼君要求赵国强同意进入离婚办理，赵国强尚未回答。',
  '许曼君尚未得到赵国强的同意。',
  '赵国强认为许曼君会同意进入离婚办理，自己仍未答复。',
];
const early = [
  '赵国强同意进入离婚办理。',
  '赵国强点头，答应正式办理离婚。',
  '他听完后表示同意，答应开始正式离婚手续。',
  '双方同意进入离婚办理。',
  '两人已经达成一致，正式进入离婚办理。',
  '赵国强说：“我同意，明天就去办理。”',
  '赵国强没有马上同意，但随后点头答应进入离婚办理。',
  '事情就此说定，两人进入离婚办理。',
  '许曼君提出办理要求。赵国强已经接受她的安排，双方正式进入办理。',
  '许曼君说出请求，丈夫答应办理离婚。',
  '许曼君的要求得到了赵国强的同意。',
  '许曼君提出要求后赵国强同意进入离婚办理。',
];
for (const body of proposals) test(`PLAY-014 正常提议或未答复：${body}`, () => {
  const f = handoffProposal(), before = clone(f.data);
  assert.match(f.event, /正式进入离婚办理/u, '原本拍要求保留');
  assert.equal(route.许曼君分居正文越拍原因(f.event, body), '');
  assert.deepEqual(f.data, before);
});
for (const body of early) test(`PLAY-014 真正提前接受仍拒绝：${body}`, () => {
  const f = handoffProposal();
  assert.match(route.许曼君分居正文越拍原因(f.event, body), /第一拍|第二拍/u);
});

for (const body of proposals) test(`PLAY-014 实际首稿不误重写且原生可提交：${body}`, async () => {
  const f = handoffProposal();
  const result = await fixedReview(f, body);
  assert.equal(result.body, body); assert.equal(result.generations, 0);
  assert.equal(f.data.系统._许曼君分居.当前拍, 0);
  const native = nativeCandidate(f, body);
  assert.equal(native.成功, true);
  assert.equal(f.data.系统._许曼君分居.当前拍, 1);
  assert.equal(f.data.系统._许曼君分居.双方同意进入办理, false);
  assert.equal(f.data.系统._许曼君分居.阶段, '待管理员室交接');
  assert.ok(native.后续剧情?.事件);
});
for (const body of early) test(`PLAY-014 真实二稿错误与原生错误不提交：${body}`, async () => {
  const f = handoffProposal(), before = clone(f.data);
  await assert.rejects(() => fixedReview(f, body, body), /两次未能停在正确节点/u);
  assert.throws(() => nativeCandidate(f, body), /未通过验收/u);
  assert.deepEqual(f.data, before);
});

test('PLAY-014 真正提前稿更正为提议后只提交第一拍，第二拍才签办理同意', async () => {
  const f = handoffProposal();
  const reviewed = await fixedReview(f, early[0], proposals[0]);
  assert.equal(reviewed.generations, 1); assert.equal(reviewed.body, proposals[0]);
  const first = productionSubmit(f, '我在听。');
  assert.equal(first.成功, true); assert.equal(f.data.系统._许曼君分居.双方同意进入办理, false);
  f.data = Schema.parse(clone(f.data)); f.event = first.后续剧情.事件; f.floor++;
  assert.equal(route.许曼君分居正文越拍原因(f.event, early[0]), '');
  const second = nativeCandidate(f, early[0]);
  assert.equal(second.成功, true);
  assert.equal(f.data.系统._许曼君分居.双方同意进入办理, true);
  assert.equal(f.data.系统._许曼君分居.阶段, '待钥匙转交接');
  assert.equal(f.data.系统._许曼君离婚.法律离婚已成立, false);
  const saved = clone(f.data); assert.equal(productionSubmit(f, '我在听。').成功, false);
  assert.deepEqual(f.data, saved);
});
for (const error of ['提供方失败', '取消', '超时']) test(`PLAY-014 实际重写等待${error}不提交`, async () => {
  const f = handoffProposal(), before = clone(f.data);
  await assert.rejects(() => fixedReview(f, early[0], proposals[0], { error }), new RegExp(error, 'u'));
  assert.deepEqual(f.data, before);
  assert.equal((await fixedReview(f, early[0], proposals[0])).generations, 1);
});
test('PLAY-014 既有重写后事务复核保留；迟到文本不认领当前候选', async () => {
  const f = handoffProposal(), before = clone(f.data);
  await assert.rejects(() => fixedReview(f, early[0], proposals[0], { stale: true }), /stale caller lease/u);
  assert.deepEqual(f.data, before);
});
test('PLAY-014 实际原生演员门与地点门没有放宽', () => {
  const f = handoffProposal(), before = clone(f.data);
  assert.throws(() => nativeCandidate(f, proposals[0], '我在听。', ['201'], []), /演员/u);
  f.room = '201'; assert.throws(() => nativeCandidate(f, proposals[0]), /本拍只能/u);
  assert.deepEqual(f.data, before);
});
