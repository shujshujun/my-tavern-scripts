/* eslint-disable import-x/no-nodejs-modules -- COORD011: current production verification, no product writes. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { isDeepStrictEqual } from 'node:util';
import { daily, scenes, Schema, clone, bodies, harness } from './helpers/许曼君日常验收环境.mjs';

const h = harness();
const relations = ['继续关系', '暂不承诺', '退出关系'];
// The nine coordinator inputs are deliberately verbatim. Existing controls stay separate.
const samples = [
  {
    theme: '给自己改衣服',
    future: '等这件上衣缝好以后，她再试穿；现在她只把粉笔和针线摆在桌上。',
    history: '她把这件上衣缝好了——这是昨天的事，今天还没开始动针。',
    complete: '她把衣摆缝妥，收好针线，穿上确认尺寸合适。',
    oldNegative: '她拿起衣服，尚未缝好衣摆，今天仍停在检查尺寸。',
  },
  {
    theme: '重排201',
    future: '等201的常用物件全部归位以后，她再检查动线；现在她只把卷尺放在柜子上。',
    history: '201的常用物件全部归位了——那是上次的事，今天还没开始重排。',
    complete: '201的柜子和桌面都已经摆妥，新动线也确认好，家具不再需要挪动。',
    oldNegative: '她检查201里的柜子，尚未挪动任何物件，房间仍旧保持原样。',
  },
  {
    theme: '给自己留一笔生活钱',
    future: '等她把自己的生活钱正式写进明账以后，再核对余额；现在她只圈出支出范围。',
    history: '她把自己的生活钱正式写进明账了——那是昨天的安排，今天这笔预算还没动。',
    complete: '她已经在明账中单列了自己的生活预算，金额和用途都登记好了。',
    oldNegative: '她核对账本，尚未写进生活预算，额度仍保持原样。',
  },
];
const actionFor = relation => relation === '退出关系' ? '只处理201房务' : '把决定留给她';
const account = data => data.系统._许曼君离婚后日常;

// Full-value equality determines mutation; paths only make failure logs smaller, without omitting changed paths.
function changedPaths(before, after, prefix = 'args') {
  if (isDeepStrictEqual(before, after)) return [];
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return [prefix];
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort().flatMap(key =>
    changedPaths(before[key], after[key], `${prefix}.${key}`));
}
function firstReady(relation, index) {
  const data = h.fresh(relation, index);
  const event = h.prepare(data, actionFor(relation), 80);
  const ticket = daily.解析许曼君离婚后日常事件(event);
  assert.equal(ticket?.拍, 'D1', '[FIXTURE] production action must create D1');
  assert.equal(ticket.主题, samples[index].theme, '[FIXTURE] real theme selection');
  assert.equal(ticket.关系, relation, '[FIXTURE] real relation');
  const anchor = h.capture(data, event, 80, 82);
  assert.ok(anchor, '[FIXTURE] production D1 source/result anchor');
  return { data, event, ticket, anchor };
}
function secondReady(relation, index) {
  const first = firstReady(relation, index);
  const accepted = h.submitFromProduction(first.data, first.event, 82, first.anchor);
  assert.equal(accepted.成功, true, `[FIXTURE] original D1 failed: ${accepted.提示}`);
  assert.equal(account(first.data).阶段, '待收针', '[FIXTURE] real D1 checkpoint required');
  assert.equal(account(first.data).累计次数, index, '[FIXTURE] D1 cannot settle reward');
  const txn = clone(first.data.系统._场景剧情事务);
  assert.equal(scenes.提交场景剧情成功(first.data, first.event, txn.id, txn.请求世代), true, '[FIXTURE] consume real D1 transaction');
  first.data.系统._绝对时段 = 4;
  const event = h.prepare(first.data, '把今天这件事做完', 82);
  const ticket = daily.解析许曼君离婚后日常事件(event);
  assert.equal(ticket?.拍, 'D2', '[FIXTURE] production action must create D2');
  assert.equal(ticket.事件ID, first.ticket.事件ID, '[FIXTURE] no replacement event ID');
  const anchor = h.capture(first.data, event, 82, 84);
  assert.ok(anchor, '[FIXTURE] production D2 anchor');
  return { data: first.data, event, ticket, anchor };
}
function argsFor(pair, body, floor) {
  return [pair.data, pair.event, body, '201', floor, ['201'], [], pair.anchor];
}
function resultView(data) {
  const a = account(data);
  return {
    phase: a.阶段, currentID: a.当前事件ID, count: a.累计次数, resultFloor: a.最近事件楼层,
    cooldown: a.下次可用时段, reward: a.生活整备可用,
    rewardMatchesEvent: !!a.最近事件ID && a.生活整备来源事件ID === a.最近事件ID,
    records: a.事件记录.length, recordFloor: a.事件记录[0]?.发生楼层 ?? null,
    feedback: a.待反馈事件.length, feedbackTime: a.待反馈事件[0]?.可发送时段 ?? null,
    relation: a.最近关系,
  };
}
function expectedDone(index, relation, clock = 4) {
  return {
    phase: '空闲', currentID: '', count: index + 1, resultFloor: 84, cooldown: clock + 6,
    reward: true, rewardMatchesEvent: true, records: 1, recordFloor: 84,
    feedback: 1, feedbackTime: clock + 1, relation,
  };
}

for (const relation of relations) {
  for (const [index, sample] of samples.entries()) {
    for (const kind of ['future', 'history']) {
      test(`PLAY002 当前D2直接拒绝且全入参不变/${relation}/${sample.theme}/${kind}`, () => {
        const pair = secondReady(relation, index);
        const args = argsFor(pair, sample[kind], 84), before = clone(args);
        const result = daily.提交许曼君离婚后日常事件(...args);
        const actual = {
          success: result.成功, changed: result.变动,
          fullInputUnchanged: isDeepStrictEqual(args, before), changedPaths: changedPaths(before, args),
          checkpointUnchanged: isDeepStrictEqual(account(pair.data), account(before[0])),
        };
        assert.deepEqual(actual, { success: false, changed: false, fullInputUnchanged: true, changedPaths: [], checkpointUnchanged: true },
          JSON.stringify({ kind, body: sample[kind], result, accountAfter: resultView(pair.data) }));
      });
    }
    for (const [kind, body] of [['natural', sample.complete], ['original', bodies.D2[sample.theme]]]) {
      test(`PLAY002 当前D2完成与幂等/${relation}/${sample.theme}/${kind}`, () => {
        const pair = secondReady(relation, index);
        const args = argsFor(pair, body, 84);
        const result = daily.提交许曼君离婚后日常事件(...args);
        // Observe settlement fields even when a new natural completion is rejected.
        const observed = { success: result.成功, state: resultView(pair.data), duplicateRun: false };
        if (result.成功) {
          const after = clone(args);
          const duplicate = daily.提交许曼君离婚后日常事件(...args);
          observed.duplicateRun = true;
          observed.duplicateRejected = duplicate.成功 === false;
          observed.duplicateFullInputUnchanged = isDeepStrictEqual(args, after);
        }
        assert.deepEqual(observed, {
          success: true, state: expectedDone(index, relation), duplicateRun: true,
          duplicateRejected: true, duplicateFullInputUnchanged: true,
        }, JSON.stringify({ kind, body, result, unexecuted: result.成功 ? [] : ['duplicate-after-success'] }));
      });
    }
    for (const [kind, suffix] of [['future-appended', sample.future], ['original', '']]) {
      test(`PLAY002 当前D1不提前结算/${relation}/${sample.theme}/${kind}`, () => {
        const pair = firstReady(relation, index);
        const body = bodies.D1[sample.theme] + suffix;
        const args = argsFor(pair, body, 82), before = clone(args);
        const expectedArgs = clone(args);
        Object.assign(account(expectedArgs[0]), {
          阶段: '待收针', 当前事件ID: pair.ticket.事件ID, 当前主题: sample.theme,
          当前选择: pair.ticket.选择, 当前关系: relation, 开始时段: pair.ticket.请求时段, 开始楼层: 82,
        });
        const result = daily.提交许曼君离婚后日常事件(...args);
        assert.deepEqual({
          success: result.成功, onlyCheckpointChanged: isDeepStrictEqual(args, expectedArgs),
          unexpectedPaths: changedPaths(expectedArgs, args),
          count: account(pair.data).累计次数,
          reward: account(pair.data).生活整备可用, cooldown: account(pair.data).下次可用时段,
          records: account(pair.data).事件记录.length, feedback: account(pair.data).待反馈事件.length,
        }, {
          success: true, onlyCheckpointChanged: true, unexpectedPaths: [], count: index,
          reward: account(before[0]).生活整备可用, cooldown: account(before[0]).下次可用时段,
          records: account(before[0]).事件记录.length, feedback: account(before[0]).待反馈事件.length,
        }, JSON.stringify({ kind, body, result }));
      });
    }
    for (const [kind, body] of [['future-final', sample.future], ['original-negative-control', sample.oldNegative]]) {
      test(`PLAY002 listener最终稿与重载重试/${relation}/${sample.theme}/${kind}`, async () => {
        const modelBodies = clone(bodies);
        modelBodies.D2[sample.theme] = body;
        const e = harness(modelBodies).lifecycleHost();
        e.state = h.fresh(relation, index);
        await e.click(actionFor(relation));
        assert.deepEqual(e.outcome, [true], '[FIXTURE] original D1 listener must succeed');
        const checkpoint = clone(account(e.state));
        await e.click('把今天这件事做完');
        const txn = clone(e.state.系统._场景剧情事务);
        const observed = {
          finalDraftOutcome: [...e.outcome], checkpointUnchanged: isDeepStrictEqual(account(e.state), checkpoint),
          checkpointChangedPaths: changedPaths(checkpoint, account(e.state), 'daily'),
          transactionStatus: txn.状态, completionWrites: e.completionWrites,
          retryRun: false,
        };
        // Never manufacture a retry checkpoint after an incorrectly accepted D2.
        if (e.outcome.at(-1) === false && txn.状态 === '待重试' && observed.checkpointUnchanged) {
          e.state = Schema.parse(JSON.parse(JSON.stringify(e.state)));
          assert.equal(e.state.系统._场景剧情事务.id, txn.id, '[FIXTURE] reload preserves original transaction');
          modelBodies.D2[sample.theme] = bodies.D2[sample.theme];
          observed.retryRun = true;
          observed.retrySucceeded = await e.retry();
          observed.afterRetry = resultView(e.state);
          const settled = clone(account(e.state)), writes = e.completionWrites, generations = e.generations;
          await e.click('把今天这件事做完');
          observed.repeatActionNoSettlement = isDeepStrictEqual(account(e.state), settled) &&
            e.completionWrites === writes && e.generations === generations;
        }
        assert.deepEqual(observed, {
          finalDraftOutcome: [true, false], checkpointUnchanged: true, checkpointChangedPaths: [],
          transactionStatus: '待重试', completionWrites: 1, retryRun: true, retrySucceeded: true,
          afterRetry: expectedDone(index, relation, 3), repeatActionNoSettlement: true,
        }, JSON.stringify({ kind, body, errors: e.errors.map(String), accountAfter: resultView(e.state),
          unexecuted: observed.retryRun ? [] : ['reload-then-legal-retry', 'duplicate-after-retry'] }));
      });
    }
  }
}

// This file uses the real listener and settlement adapter, NOT the entire production 执行回合.
// The supplied D2 text is the final draft reaching settlement. A bad first draft followed by a good
// production rewrite is not required to fail here. Direct-input mutation and discarded host candidates
// are asserted in different tests and must not be conflated in the report.
