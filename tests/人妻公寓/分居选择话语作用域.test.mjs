/* eslint-disable import-x/no-nodejs-modules -- PLAY-012 parser and real route consumers. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { Schema, route, bridge, clone, firstDecision, finalDecision, productionSubmit, nativeCandidate, fixedReview } from './helpers/分居决定验收环境.mjs';

const initial = [
  ['我会在场。', '当面在场'], ['我会当面在场。', '当面在场'],
  ['我不会在门外等，我陪你当面说。', '当面在场'], ['我不躲，我会面对。', '当面在场'],
  ['你们夫妻先谈，需要我时再叫我进去。', '先夫妻谈'], ['我在门外等。', '先夫妻谈'],
  ['我不陪你当面说，你们先谈。', '先夫妻谈'], ['先缓缓，我还没准备好。', '暂缓'],
  ['我不想暂缓，我会当面在场。', '当面在场'], ['我听见了。', '未决定'],
  ['如果我在门外等，你会安心吗？', '未决定'], ['我会在场吗？', '未决定'],
  ['我会不会在场？', '未决定'], ['要不要我陪你当面说？', '未决定'],
  ['如果你需要，我会在场。', '未决定'], ['也许我会在场。', '未决定'],
  ['我不是说我会在场，我只是问你准备怎么办。', '未决定'],
  ['她说：“我会在场。”我没有答复。', '未决定'],
  ['我昨天说过“我在门外等”，现在我会当面在场。', '当面在场'],
  ['我说：“我会当面在场。”', '当面在场'], ['“我会在场。”', '当面在场'],
  ['我会在场，你能放心了吗？', '当面在场'],
  ['我不会让你们先谈，我会在场。', '当面在场'],
  ['不是我会在场，而是你们先谈。', '先夫妻谈'],
  ['我会在场，我在门外等。', '未决定'], ['我会在场或者你们先谈。', '未决定'],
  ['我没说过“我会在场”。', '未决定'], ['我没有答应让你们先谈。', '未决定'],
  ['你问我会在场吗，我还没有决定。', '未决定'],
  ['不过我会在场。', '当面在场'], ['她认为我会在场。', '未决定'],
  ['我会亲口承担自己的位置。', '当面在场'],
];
const final = [
  ['我不会退出这段关系，我会继续留下。', '继续关系'],
  ['我不会退出这段关系。', '继续关系'], ['我不想退出这段关系。', '继续关系'],
  ['我会继续留在你选择的生活里。', '继续关系'], ['我愿意继续。', '继续关系'],
  ['我不会走。', '继续关系'], ['我退出这段关系。', '退出关系'],
  ['我不会要求你回去，但我退出我们这段关系。', '退出关系'],
  ['我不会继续这段关系。', '退出关系'], ['以后不再来，我退出。', '退出关系'],
  ['你的婚姻由你决定，我们之间以后再谈。', '暂不承诺'], ['我现在不给承诺。', '暂不承诺'],
  ['我不是要暂不承诺，我会继续留下。', '继续关系'],
  ['如果我退出这段关系，你会怎么想？', '未决定'],
  ['如果你坚持，我会离开。', '未决定'], ['如果以后想清楚，也许我会继续。', '未决定'],
  ['我退出这段关系吗？', '未决定'], ['是否退出这段关系', '未决定'],
  ['我会不会继续留下？', '未决定'], ['要不要退出这段关系？', '未决定'],
  ['我考虑过退出这段关系。', '未决定'], ['我以前说过我退出这段关系。', '未决定'],
  ['她说：“我退出这段关系。”', '未决定'], ['你希望我退出这段关系。', '未决定'],
  ['我没说过“我退出这段关系”。', '未决定'], ['我并不是说我退出这段关系。', '未决定'],
  ['我不会说我退出这段关系。', '未决定'],
  ['我只是举例：“我退出这段关系。”这不是答复。', '未决定'],
  ['“我退出这段关系”是假设，不是我的决定。', '未决定'],
  ['我昨天说“我退出这段关系”，但现在我会继续留下。', '继续关系'],
  ['我收回“我退出这段关系”这句话，我会继续留下。', '继续关系'],
  ['我说：“我退出这段关系。”', '退出关系'], ['“我会继续留下。”', '继续关系'],
  ['我会继续留下，你能放心了吗？', '继续关系'],
  ['我退出这段关系？不，我会继续留下。', '继续关系'],
  ['不是退出这段关系，我会继续留下。', '继续关系'],
  ['我退出这段关系，我会继续留下。', '未决定'],
  ['我退出这段关系或者继续留下。', '未决定'],
  ['我不是说我会继续留下，但我退出这段关系。', '退出关系'],
  ['我不会要求你回到旧生活。', '未决定'], ['我会继续整理账本。', '未决定'],
  ['你的婚姻由你决定。', '未决定'], ['', '未决定'], [null, '未决定'],
  ['不过我退出这段关系。', '退出关系'], ['她坚称我退出这段关系。', '未决定'],
  ['我退出房间去倒水。', '未决定'], ['我会离开房间一会儿。', '未决定'],
  ['我不会继续整理账本。', '未决定'], ['我会留下纸条。', '未决定'],
  ['我不会在门外等，而且我会继续留下。', '继续关系'],
];
for (const [text, expected] of initial) test(`PLAY-012 初谈：${text}`, () => {
  assert.equal(route.解析许曼君初谈参与方式(text), expected);
});
for (const [text, expected] of final) test(`PLAY-012 最终关系：${text}`, () => {
  assert.equal(route.解析许曼君最终关系选择(text), expected);
});
for (const [text, expected] of [
  ['如果我退出这段关系，你会怎么想？', '不明确'],
  ['她说：“我退出这段关系。”', '不明确'],
  ['我没说过“我退出这段关系”。', '不明确'],
  ['我不会退出这段关系，我会继续留下。', '承担'],
  ['我会当面在场。', '承担'], ['我退出这段关系。', '拒绝'],
]) test(`PLAY-012 兼容分类保留原话语边界：${text}`, () => {
  assert.equal(bridge.解析许曼君分居玩家决定(text), expected);
});

for (const channel of ['fixed', 'native']) {
  for (const [text, expected] of initial.slice(0, 14)) test(`PLAY-012 ${channel}真实初谈提交：${text}`, () => {
    const f = firstDecision(), old = clone(f.data.系统._许曼君分居);
    const result = productionSubmit(f, text, channel);
    assert.equal(result.成功, true, result.提示);
    f.data = Schema.parse(clone(f.data));
    const current = f.data.系统._许曼君分居;
    assert.equal(current.初谈参与方式, expected);
    if (expected === '未决定' || expected === '暂缓') {
      assert.equal(current.阶段, '待初谈'); assert.equal(current.当前拍, 2);
      assert.equal(current.预约时段, old.预约时段); assert.equal(current.预约状态, old.预约状态);
      assert.equal(productionSubmit(f, '我会当面在场。', channel).成功, true);
      assert.equal(f.data.系统._许曼君分居.阶段, '待三人摊牌');
    } else {
      assert.equal(current.阶段, '待三人摊牌'); assert.ok(current.预约时段 >= 0);
      const saved = clone(f.data); assert.equal(productionSubmit(f, text, channel).成功, false);
      assert.deepEqual(f.data, saved);
    }
  });
  for (const permission of [true, false]) {
    for (const [text, expected] of final.slice(0, 15)) test(`PLAY-012 ${channel}真实最终提交/许可${permission}：${text}`, () => {
      const f = finalDecision(permission), old = clone(f.data.系统._许曼君分居);
      const result = productionSubmit(f, text, channel);
      assert.equal(result.成功, true, result.提示);
      f.data = Schema.parse(clone(f.data));
      const current = f.data.系统._许曼君分居;
      assert.equal(current.许曼君已拒绝恢复共同生活, true, '玩家选择不撤销角色自己的婚姻决定');
      assert.equal(current.玩家最终关系选择, expected);
      assert.equal(current.留宿201权限, expected === '退出关系' ? false : permission);
      assert.equal(current.共同夜晚状态, expected === '退出关系' && !permission ? '已放弃' : old.共同夜晚状态);
      if (expected === '未决定') {
        assert.equal(current.阶段, '待私下决定'); assert.equal(current.当前拍, 1);
        assert.equal(current.预约时段, old.预约时段); assert.equal(current.预约状态, old.预约状态);
        assert.equal(productionSubmit(f, '我会继续留下。', channel).成功, true);
        assert.equal(f.data.系统._许曼君分居.玩家最终关系选择, '继续关系');
      } else {
        assert.equal(current.阶段, '待管理员室交接'); assert.ok(current.预约时段 >= 0);
        const saved = clone(f.data); assert.equal(productionSubmit(f, text, channel).成功, false);
        assert.deepEqual(f.data, saved);
      }
    });
  }
}

for (const mode of ['错房', '阶段变化', '拍号变化', '住院']) test(`PLAY-012 既有失败门保留：${mode}`, () => {
  const f = finalDecision();
  if (mode === '错房') f.room = '大堂';
  if (mode === '阶段变化') f.data.系统._许曼君分居.阶段 = '已完成';
  if (mode === '拍号变化') f.data.系统._许曼君分居.当前拍 = 0;
  if (mode === '住院') f.data.户['201'].妻._生产.状态 = '住院中';
  const before = clone(f.data);
  assert.equal(productionSubmit(f, '我退出这段关系。').成功, false); assert.deepEqual(f.data, before);
});

for (const [player, expected] of [
  ['如果我退出这段关系，你会怎么想？', '未决定'],
  ['我不会退出这段关系，我会继续留下。', '继续关系'],
  ['我退出这段关系。', '退出关系'],
  ['我们之间以后再谈。', '暂不承诺'],
]) test(`PLAY-012 首稿/重写/原生保持玩家原文决定，不从模型正文代选：${player}`, async () => {
  const f = finalDecision();
  const modelBody = '许曼君听完这句话，把它说成了玩家退出关系。';
  const review = await fixedReview(f, '赵国强同意办理。', modelBody, { player });
  assert.equal(review.generations, 1); assert.equal(review.body, modelBody);
  const fixed = clone(f);
  assert.equal(productionSubmit(fixed, player).成功, true);
  assert.equal(fixed.data.系统._许曼君分居.玩家最终关系选择, expected);
  assert.equal(nativeCandidate(f, modelBody, player, ['201'], []).成功, true);
  assert.equal(f.data.系统._许曼君分居.玩家最终关系选择, expected);
  assert.equal(f.data.系统._许曼君分居.留宿201权限, expected !== '退出关系');
});

test('PLAY-012 读取旧已定关系不迁移；回档后按该轮原输入重做决定', () => {
  const f = finalDecision(), before = clone(f.data);
  assert.equal(productionSubmit(f, '我退出这段关系。').成功, true);
  const saved = Schema.parse(clone(f.data));
  route.读取许曼君分居状态(saved);
  assert.equal(saved.系统._许曼君分居.玩家最终关系选择, '退出关系');
  f.data = Schema.parse(before);
  assert.equal(productionSubmit(f, '我不会退出这段关系，我会继续留下。').成功, true);
  assert.equal(f.data.系统._许曼君分居.玩家最终关系选择, '继续关系');
  assert.equal(f.data.系统._许曼君分居.留宿201权限, true);
});
