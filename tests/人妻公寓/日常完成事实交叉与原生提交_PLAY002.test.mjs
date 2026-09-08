/* eslint-disable import-x/no-nodejs-modules -- COORD015 resumes COORD013, production-expression regression. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { isDeepStrictEqual } from 'node:util';
import { daily, scenes, clone, bodies, harness } from './helpers/许曼君日常验收环境.mjs';

// The unchanged helper extracts the actual native consumer call, not a replacement validator.
// native=true proves that expression only, not normal native admission, the full lease or physical storage.
const h = harness();
const relations = ['继续关系', '暂不承诺', '退出关系'];
const samples = [
  {
    theme: '给自己改衣服',
    future: '等这件上衣缝好以后，她再试穿；现在她只把粉笔和针线摆在桌上。',
    history: '她把这件上衣缝好了——这是昨天的事，今天还没开始动针。',
    complete: '她把衣摆缝妥，收好针线，穿上确认尺寸合适。',
  },
  {
    theme: '重排201',
    future: '等201的常用物件全部归位以后，她再检查动线；现在她只把卷尺放在柜子上。',
    history: '201的常用物件全部归位了——那是上次的事，今天还没开始重排。',
    complete: '201的柜子和桌面都已经摆妥，新动线也确认好，家具不再需要挪动。',
  },
  {
    theme: '给自己留一笔生活钱',
    future: '等她把自己的生活钱正式写进明账以后，再核对余额；现在她只圈出支出范围。',
    history: '她把自己的生活钱正式写进明账了——那是昨天的安排，今天这笔预算还没动。',
    complete: '她已经在明账中单列了自己的生活预算，金额和用途都登记好了。',
  },
];
const account = data => data.系统._许曼君离婚后日常;
function ready(relation, index, beat) {
  const data = h.fresh(relation, index);
  const action = relation === '退出关系' ? '只处理201房务' : '把决定留给她';
  let event = h.prepare(data, action, 80);
  const firstTicket = daily.解析许曼君离婚后日常事件(event);
  assert.equal(firstTicket?.拍, 'D1', '[FIXTURE] real D1 required');
  assert.equal(firstTicket.主题, samples[index].theme, '[FIXTURE] real theme');
  let anchor = h.capture(data, event, 80, 82), floor = 82;
  assert.ok(anchor, '[FIXTURE] real source/result anchor');
  if (beat === 'D2') {
    const first = h.submitFromProduction(data, event, 82, anchor, true, bodies.D1[samples[index].theme]);
    assert.equal(first.成功, true, `[FIXTURE] real original D1: ${first.提示}`);
    assert.equal(account(data).阶段, '待收针');
    assert.equal(account(data).累计次数, index);
    const txn = clone(data.系统._场景剧情事务);
    assert.equal(scenes.提交场景剧情成功(data, event, txn.id, txn.请求世代), true);
    data.系统._绝对时段 = 4;
    event = h.prepare(data, '把今天这件事做完', 82);
    assert.equal(daily.解析许曼君离婚后日常事件(event)?.事件ID, firstTicket.事件ID);
    anchor = h.capture(data, event, 82, 84); floor = 84;
    assert.ok(anchor, '[FIXTURE] real D2 anchor');
  }
  return { data, event, anchor, floor, relation, index, beat };
}
function check(relation, index, beat, body, expected) {
  const p = ready(relation, index, beat);
  const before = clone({ data: p.data, event: p.event, anchor: p.anchor, body, floor: p.floor });
  const expectedData = clone(p.data);
  const result = h.submitFromProduction(p.data, p.event, p.floor, p.anchor, true, body);
  const issues = [];
  const need = (condition, label, actual) => { if (!condition) issues.push({ label, actual }); };
  need(result.成功 === expected, 'success', { expected, actual: result.成功, reason: result.提示 });
  need(isDeepStrictEqual(p.anchor, before.anchor), 'anchor-unchanged', p.anchor);
  if (!expected) {
    need(result.变动 === false, 'no-change-result', result.变动);
    need(isDeepStrictEqual(p.data, before.data), 'complete-data-unchanged', account(p.data));
  } else if (beat === 'D1') {
    const ticket = daily.解析许曼君离婚后日常事件(p.event);
    Object.assign(account(expectedData), {
      阶段: '待收针', 当前事件ID: ticket.事件ID, 当前主题: ticket.主题,
      当前选择: ticket.选择, 当前关系: ticket.关系, 开始时段: ticket.请求时段, 开始楼层: 82,
    });
    need(isDeepStrictEqual(p.data, expectedData), 'only-D1-checkpoint-changed', account(p.data));
  } else {
    const a = account(p.data);
    const actual = {
      count: a.累计次数, phase: a.阶段, resultFloor: a.最近事件楼层,
      records: a.事件记录.length, recordFloor: a.事件记录[0]?.发生楼层 ?? null,
      reward: a.生活整备可用, rewardLinked: !!a.最近事件ID && a.生活整备来源事件ID === a.最近事件ID,
      cooldown: a.下次可用时段, feedback: a.待反馈事件.length,
      feedbackTime: a.待反馈事件[0]?.可发送时段 ?? null, relation: a.最近关系,
    };
    need(isDeepStrictEqual(actual, {
      count: index + 1, phase: '空闲', resultFloor: 84, records: 1, recordFloor: 84,
      reward: true, rewardLinked: true, cooldown: 10, feedback: 1, feedbackTime: 5, relation,
    }), 'D2-settlement', actual);
    if (result.成功) {
      const saved = clone(p.data), savedAnchor = clone(p.anchor);
      const duplicate = h.submitFromProduction(p.data, p.event, p.floor, p.anchor, true, body);
      need(duplicate.成功 === false && isDeepStrictEqual(p.data, saved) && isDeepStrictEqual(p.anchor, savedAnchor), 'duplicate-rejected-without-mutation', duplicate);
    } else need(false, 'unexecuted', 'duplicate-after-success');
  }
  return issues.length ? [{ relation, theme: samples[index].theme, beat, body, issues }] : [];
}

for (const relation of relations) {
  for (const [index, sample] of samples.entries()) {
    for (const kind of ['future', 'history', 'complete']) {
      test(`PLAY002 原生提交表达式/${relation}/${sample.theme}/${kind}`, () => {
        assert.deepEqual(check(relation, index, 'D2', sample[kind], kind === 'complete'), []);
      });
    }
    test(`PLAY002 原生D1附未来只建检查点/${relation}/${sample.theme}`, () => {
      assert.deepEqual(check(relation, index, 'D1', bodies.D1[sample.theme] + sample.future, true), []);
    });
  }
}

// Exactly six bounded cross groups, without mechanical relation permutations.
const crosses = [
  { label: '完成词与后置未来共享作用域', index: 0, cases: [
    ['D2', '等衣摆缝妥以后再试穿，现在只标出尺寸。', false],
    ['D2', '衣摆已经缝妥，试穿确认尺寸合适。', true],
  ] },
  { label: '后置历史和沿用旧尺寸不同', index: 0, cases: [
    ['D2', '衣摆已经缝妥——这是昨天的事，今天只检查尺寸。', false],
    ['D2', '她按昨天标出的尺寸把衣摆缝妥，今天已经试穿确认合适。', true],
  ] },
  { label: '先完成后撤销保留曾完成而非最终完成', index: 1, cases: [
    ['D1', '201常用物件全部摆妥后，又全部挪回原位。', false],
    ['D2', '201常用物件全部摆妥后，又全部挪回原位。', false],
    ['D1', '201常用物件全部摆妥，新动线确认好了。', false],
    ['D2', '201常用物件全部摆妥，新动线确认好了。', true],
  ] },
  { label: '旧便签单引文和本人当前引文', index: 2, cases: [
    ['D2', '她读着旧便签‘生活预算已经单列入账’，今天仅圈出额度。', false],
    ['D2', '她说：‘自己的生活预算现在已经在明账中单列入账。’', true],
  ] },
  { label: '另一户维修预算不能算本人生活钱', index: 2, cases: [
    ['D2', '明账已经单列另一户的维修预算，自己的生活钱仍未入账。', false],
    ['D2', '明账已经单列自己的生活预算，金额和用途都登记好了。', true],
  ] },
  { label: '未换针线不是未完成衣摆', index: 0, cases: [
    ['D2', '她没有换针线就把衣摆缝妥，试穿确认合适。', true],
    ['D2', '她试穿了衣服，但衣摆尚未缝妥。', false],
  ] },
];
for (const group of crosses) {
  test(`PLAY002 交叉/${group.label}`, () => {
    const failures = [];
    for (const [beat, rawBody, expected] of group.cases) {
      // Both D1 room variants receive the same real scope-opening context.
      const body = beat === 'D1' ? bodies.D1[samples[group.index].theme] + rawBody : rawBody;
      failures.push(...check('继续关系', group.index, beat, body, expected));
    }
    assert.deepEqual(failures, []);
  });
}
