/* eslint-disable import-x/no-nodejs-modules -- 真实第一幕票、提交器及两个生产调用口。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { journey, route, clone, productionSubmit, nativeCandidate, fixedReview } from './helpers/分居决定验收环境.mjs';
const require = createRequire(import.meta.url);
const { 购买 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
function second() {
  const data = journey.建数据();
  assert.equal(购买(data, route.许曼君分居任务ID).成功, true);
  journey.找动作时段(data, '201', '开始第一幕初谈');
  const first = journey.做动作(data, '201', '开始第一幕初谈');
  const result = journey.交一拍(data, first.事件, '201', 1);
  return { data, event: result.后续剧情.事件, room: '201', floor: 2 };
}
const safe = '工资卡仍在封套里，许曼君只是在谈自己的打算。';
const unsafe = '工资卡已经归还，钥匙已经封存。';
const question = '工资卡已经归还了吗？我只是确认一下。';
const examples = [
  [false, '这不代表工资卡已经归还，她只是想先谈谈自己的打算。'],
  [false, '工资卡已经归还了吗？她还在想这件事。'],
  [false, '如果工资卡已经归还，再讨论下一步。'],
  [false, '昨天她曾说工资卡已经归还，那只是旧事。'],
  [false, '她准备把工资卡归还。'],
  [false, '“工资卡已经归还。”只是一个设想。'],
  [true, unsafe],
  [true, '她没有犹豫。工资卡已经归还。'],
  [true, '工资卡已经归还，接下来再等其他消息。'],
  [true, '工资卡是否已经归还？许曼君确认工资卡已经归还。'],
];
test('SNAP09 第一幕只拒绝本次确已发生的后续事实', () => {
  const f = second();
  for (const [blocked, body] of examples) {
    assert.equal(Boolean(route.许曼君分居正文越拍原因(f.event, body)), blocked, body);
  }
});
for (const channel of ['fixed', 'native']) {
  test(`SNAP09 ${channel}：玩家疑问不再被送进正文验收，正常第二拍成功提交`, () => {
    const f = second();
    const result = productionSubmit(f, question, channel, safe);
    assert.equal(result?.成功, true, result?.提示);
    assert.equal(f.data.系统._许曼君分居.当前拍, 2);
    assert.notEqual(f.data.系统._许曼君分居.工资卡状态, '已归还赵国强');
    const after = clone(f.data);
    assert.equal(productionSubmit(f, question, channel, safe)?.成功, false);
    assert.deepEqual(f.data, after, '重复提交不二次推进');
  });
  test(`SNAP09 ${channel}：实际正文提前完成时拒绝提交，玩家中性回应不能掩盖越拍`, () => {
    const f = second(), before = clone(f.data);
    assert.equal(productionSubmit(f, '我在听。', channel, unsafe)?.成功, false);
    assert.deepEqual(f.data, before);
  });
}
test('SNAP09 原生验收与提交整块接受玩家问题，仍拒绝真实越拍正文', () => {
  const f = second();
  assert.equal(nativeCandidate(f, safe, question, ['201'], [])?.成功, true);
  const bad = second(), before = clone(bad.data);
  assert.throws(() => nativeCandidate(bad, unsafe, question, ['201'], []), /未通过验收/);
  assert.deepEqual(bad.data, before);
});
test('SNAP09 固定首稿否定事实不重写，真实越拍仍走重写并保留当前拍', async () => {
  const f = second();
  const normal = '这不代表工资卡已经归还，她只是想先谈谈自己的打算。';
  assert.equal((await fixedReview(f, normal, safe)).generations, 0);
  const retried = await fixedReview(f, unsafe, safe);
  assert.equal(retried.generations, 1);
  assert.equal(retried.body, safe);
});
