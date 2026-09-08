/* eslint-disable import-x/no-nodejs-modules -- PLAY-013 neutral fact-validation regressions. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { Schema, route, positive, ticket, witness, checkedCandidate, clone } from './helpers/离婚事实验收环境.mjs';
const certificate = '许曼君拿着自己的离婚证出来。';
const hand = '你牵住了她的手。';
const hug = '赵国强离开以后，你抱住许曼君。';
const heldPattern = /许曼君.{0,18}(?:拿着|捧着|持着|带着).{0,10}(?:她本人|自己的)?离婚证/u;
const badCertificates = [
  '许曼君并没有拿着自己的离婚证出来。', '许曼君尚未拿着自己的离婚证出来。',
  '没有看到许曼君拿着自己的离婚证出来。', '许曼君打算拿着自己的离婚证出来。',
  '许曼君准备拿着自己的离婚证出来。', '如果许曼君拿着自己的离婚证出来，你会怎么办？',
  '许曼君拿着自己的离婚证出来了吗？', '许曼君是否拿着自己的离婚证出来？',
  '许曼君说她没有拿着自己的离婚证出来。', '你想象许曼君拿着自己的离婚证出来。',
  '你引用“许曼君拿着自己的离婚证出来”这句话。', '昨天有人说：“许曼君拿着自己的离婚证出来。”',
  '“许曼君拿着自己的离婚证出来”只是假设，不是事实。',
  '她拿着一本资料，手续还没有办完。',
  '许曼君未拿着自己的离婚证出来。', '许曼君没拿着自己的离婚证出来。',
  '许曼君不拿着自己的离婚证出来。', '许曼君并没有真的拿着自己的离婚证出来。',
  '许曼君昨天拿着自己的离婚证出来。', '昨天，许曼君拿着自己的离婚证出来。', '你问她：“许曼君拿着自己的离婚证出来了？”',
  '你问她“许曼君拿着自己的离婚证出来”是什么意思。',
  '你说过“许曼君拿着自己的离婚证出来”，但这次她还没出来。',
  '你没有说：许曼君拿着自己的离婚证出来。', '你只是引用：许曼君拿着自己的离婚证出来。',
];
const goodCertificates = [
  certificate, '许曼君捧着她本人的离婚证走出来。',
  '你没有催她，许曼君拿着自己的离婚证出来。',
  '刚才许曼君还没有拿着离婚证出来，现在许曼君拿着自己的离婚证出来。',
  '你没说话。许曼君拿着自己的离婚证出来。',
  '许曼君没有犹豫便拿着自己的离婚证出来。',
  '许曼君虽然不安，还是拿着自己的离婚证出来。',
  '许曼君拿着自己的离婚证出来，你还没收起手机。',
  '你问过她的打算。现在许曼君拿着自己的离婚证出来。',
];
for (const body of badCertificates) test(`PLAY-013 L2持证否定/非事实：${body}`, () => {
  assert.notEqual(route.许曼君离婚正文越拍原因(ticket('L2', '当着赵国强牵住她'), body + hand), '');
});
for (const body of goodCertificates) test(`PLAY-013 L2真实持证与无关否定：${body}`, () => {
  assert.equal(route.许曼君离婚正文越拍原因(ticket('L2', '当着赵国强牵住她'), body + hand), '');
});
for (const body of ['你没有牵住她的手。', '你准备牵住她的手。', '你牵住她的手了吗？',
  '如果她愿意，你牵住她的手。', '你回忆“我牵住许曼君的手”这句话。']) {
  test(`PLAY-013 所选牵手必须实际发生：${body}`, () => {
    assert.notEqual(route.许曼君离婚正文越拍原因(ticket('L2', '当着赵国强牵住她'), certificate + body), '');
  });
}
for (const body of ['赵国强没有离开，你抱住许曼君。', '赵国强离开后，你没有抱住许曼君。',
  '如果赵国强离开，你会抱住许曼君。', '赵国强离开后，你准备抱住许曼君。',
  '赵国强离开后，你抱住许曼君了吗？']) {
  test(`PLAY-013 离开后拥抱的两个谓语均须成立：${body}`, () => {
    assert.notEqual(route.许曼君离婚正文越拍原因(ticket('L2', '等赵国强离开再抱她'), certificate + body), '');
  });
}
for (const [code, payload, good, bad] of [
  ['K1', '-', '旧钥匙已经归档放进档案袋。许曼君继续住在201。', '旧钥匙没有归档放进档案袋。许曼君继续住在201。'],
  ['K1', '-', '许曼君确认旧钥匙归档。许曼君继续住在201。', '许曼君没有确认旧钥匙归档。许曼君继续住在201。'],
  ['K1', '-', '旧钥匙已经归档放进档案袋。许曼君继续住在201。', '旧钥匙已经归档放进档案袋。许曼君不会继续住在201。'],
  ['H1', '-', '许曼君穿着旧婚纱开门。', '许曼君没有穿着旧婚纱开门。'],
  ['H2', '-', '红色封存盒已经打开。', '红色封存盒尚未打开。'],
  ['H7', '红本', '红本已经摆好。', '红本还没有摆好。'],
  ['H8', '红本', '红本上留下了既成结果。', '红本上没有留下既成结果。'],
  ['H8', '婚戒', '婚戒上留下了既成结果。', '婚戒上没有留下既成结果。'],
  ['H8', route.许曼君离婚终幕目标列表[2], '红色封皮上留下了既成结果。', '红色封皮上没有留下既成结果。'],
  ['H9', '红本', '红本连同透明套一起放进红色盒。许曼君亲手合上红色盒。', '红本连同透明套没有放进红色盒。许曼君亲手合上红色盒。'],
  ['H9', '婚戒', '婚戒连同透明浅皿一起放进红色盒。许曼君亲手合上红色盒。', '婚戒连同透明浅皿一起放进红色盒。许曼君没有亲手合上红色盒。'],
]) {
  test(`PLAY-013 共用事实函数正反例 ${code}/${payload}/${bad}`, () => {
    assert.equal(route.许曼君离婚正文越拍原因(ticket(code, payload), good), '');
    assert.notEqual(route.许曼君离婚正文越拍原因(ticket(code, payload), bad), '');
  });
}
for (const [code, good, premature] of [
  ['S', '许曼君尚未正式离婚。', '许曼君已经正式离婚。'],
  ['L1', '许曼君没有拿着自己的离婚证出来。', certificate],
  ['H1', '许曼君穿着旧婚纱开门。红色封存盒还没有打开。', '许曼君穿着旧婚纱开门。她打开红色封存盒。'],
]) test(`PLAY-013 禁提前门正反同源 ${code}`, () => {
  assert.equal(route.许曼君离婚正文越拍原因(ticket(code), good), '');
  assert.notEqual(route.许曼君离婚正文越拍原因(ticket(code), premature), '');
});
for (const [text, expected] of [
  ['许曼君尚未拿着离婚证，但许曼君现在拿着自己的离婚证出来。', true],
  ['如果许曼君拿着自己的离婚证出来，我会等她。', false],
  ['许曼君拿着自己的离婚证出来，你高兴吗？', true],
  ['许曼君拿着自己的离婚证出来？你没有答案。', false],
  ['我没有拿到资料，许曼君拿着自己的离婚证出来。', true],
]) test(`PLAY-013 私有谓词分句边界 ${text}`, () => assert.equal(positive(text, heldPattern), expected));
for (const relation of ['继续关系', '暂不承诺', '退出关系']) {
  for (const choice of ['当着赵国强牵住她', '等赵国强离开再抱她']) {
    test(`PLAY-013 真实购买/预约/等待/验收/提交/重载 ${relation}/${choice}`, () => {
      const f = witness(choice, relation), original = clone(f.data);
      const valid = certificate + (choice === '当着赵国强牵住她' ? hand : hug);
      for (const invalid of badCertificates) {
        const rejected = checkedCandidate(f, invalid + (choice === '当着赵国强牵住她' ? hand : hug));
        assert.equal(rejected.success, false, invalid);
        assert.deepEqual(f.data, original, '失败不能落入原存档');
        assert.deepEqual(rejected.candidate, original, '坏稿不得先改法律/CG再报错');
      }
      f.data = Schema.parse(clone(f.data));
      const done = checkedCandidate(f, valid);
      assert.equal(done.success, true, done.error);
      assert.equal(done.result.CG, 'XMJ-DIV-01');
      assert.equal(done.candidate.系统._许曼君离婚.法律离婚已成立, true);
      assert.equal(done.candidate.系统._许曼君离婚.阶段, '待归档旧钥匙');
      assert.equal(done.candidate.系统._许曼君分居.玩家最终关系选择, relation);
      f.data = Schema.parse(done.candidate);
      const committed = clone(f.data);
      assert.equal(checkedCandidate(f, valid).success, false);
      assert.deepEqual(f.data, committed);
      assert.equal(route.执行许曼君离婚地点动作(f.data, '归档201前住户旧钥匙', '管理员室').成功, true);
      assert.equal(f.data.系统._许曼君离婚.法律离婚已成立, true);
    });
  }
}
for (const change of ['错地点', '旧时钟', '错误演员', '缺丈夫', '回档到等待']) test(`PLAY-013 原提交边界 ${change}`, () => {
  const f = witness();
  if (change === '错地点') f.room = '201';
  if (change === '旧时钟') f.data.系统._绝对时段++;
  if (change === '回档到等待') f.data.系统._许曼君离婚.阶段 = '待办理';
  const before = clone(f.data);
  assert.equal(checkedCandidate(f, certificate + hand, change === '错误演员' ? ['101'] : ['201'], change === '缺丈夫' ? [] : ['201']).success, false);
  assert.deepEqual(f.data, before);
});

test('PLAY-013 归档确认允许既成事实，不把见证当前拍时态门套到全部消费者', () => {
  const body = '旧钥匙昨天已经归档放进档案袋。许曼君继续住在201。';
  assert.equal(route.许曼君离婚正文越拍原因(ticket('K1'), body), '');
  assert.notEqual(route.许曼君离婚正文越拍原因(ticket('S'), '许曼君昨天已经正式离婚。'), '');
});

for (const [pattern, body, expected] of [
  [/打开.{0,8}封存盒/u, '她没有犹豫就打开封存盒。', true],
  [/打开.{0,8}封存盒/u, '她没打开封存盒。', false],
  [/打开.{0,8}封存盒/u, '她未打开封存盒。', false],
  [/打开.{0,8}封存盒/u, '她不打开封存盒。', false],
  [/打开.{0,8}封存盒/u, '她问：“要打开封存盒吗？”', false],
  [/打开.{0,8}封存盒/u, '她不再犹豫，打开封存盒。', true],
  [/打开.{0,8}封存盒/u, '她从来没有打开封存盒。', false],
  [/正式.{0,6}离婚/u, '许曼君说：“我已经正式离婚。”', true],
  [/正式.{0,6}离婚/u, '许曼君说：“我并未正式离婚。”', false],
  [/许曼君.{0,8}亲手.{0,8}合上/u, '许曼君没有亲手合上盒子。', false],
]) test(`PLAY-013 谓词前/匹配内简短否定与当前声明 ${body}`, () => assert.equal(positive(body, pattern), expected));
