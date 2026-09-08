/* eslint-disable import-x/no-nodejs-modules -- COORD019: real fixed/native call expressions; no external I/O. */
import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { isDeepStrictEqual } from 'node:util';
import { daily, scenes, Schema, clone, bodies, harness } from './helpers/许曼君日常验收环境.mjs';

const h = harness();
const account = data => data.系统._许曼君离婚后日常;
const A1 = '她已经把衣服改好了并决定以后再试穿。';
const budget = '她已经在明账中单列了自己的生活预算，金额和用途都登记好了。';
const cases = [
  { id: 'A1', beat: 'D2', index: 0, expected: true, body: A1 },
  { id: 'A2', beat: 'D1', index: 0, expected: false, body: bodies.D1.给自己改衣服 + A1 },
  { id: 'A3', beat: 'D2', index: 0, expected: false, body: '等这件上衣缝好以后，她再试穿；现在她只把粉笔和针线摆在桌上。' },
  { id: 'B1', beat: 'D1', index: 2, expected: true, body: '她核对账本，在纸上单列了生活预算待核对事项。' },
  { id: 'B2', beat: 'D1', index: 2, expected: false, body: bodies.D1.给自己留一笔生活钱 + budget },
  { id: 'B3', beat: 'D2', index: 2, expected: true, body: budget },
];
function changedPaths(before, actual, prefix = 'data') {
  if (isDeepStrictEqual(before, actual)) return [];
  if (!before || !actual || typeof before !== 'object' || typeof actual !== 'object') return [prefix];
  return [...new Set([...Object.keys(before), ...Object.keys(actual)])].sort()
    .flatMap(key => changedPaths(before[key], actual[key], `${prefix}.${key}`));
}
function fixture(c, native) {
  const data = Schema.parse(h.fresh('继续关系', c.index));
  let event = h.prepare(data, '把决定留给她', 80);
  let anchor = h.capture(data, event, 80, 82), floor = 82;
  const first = daily.解析许曼君离婚后日常事件(event);
  assert.equal(first?.拍, 'D1', 'FIXTURE: real D1 action');
  assert.equal(first.关系, '继续关系');
  assert.equal(first.主题, daily.许曼君离婚后日常主题列表[c.index]);
  assert.ok(anchor, 'FIXTURE: real D1 anchor');
  if (c.beat === 'D2') {
    const accepted = h.submitFromProduction(data, event, floor, anchor, native, bodies.D1[first.主题]);
    assert.equal(accepted.成功, true, `FIXTURE: original D1: ${accepted.提示}`);
    assert.equal(account(data).阶段, '待收针');
    assert.equal(account(data).累计次数, c.index);
    const txn = clone(data.系统._场景剧情事务);
    assert.equal(scenes.提交场景剧情成功(data, event, txn.id, txn.请求世代), true, 'FIXTURE: consume original D1 transaction');
    data.系统._绝对时段 = 4;
    event = h.prepare(data, '把今天这件事做完', 82);
    floor = 84;
    anchor = h.capture(data, event, 82, floor);
    const second = daily.解析许曼君离婚后日常事件(event);
    assert.equal(second?.拍, 'D2');
    assert.equal(second.事件ID, first.事件ID, 'FIXTURE: D2 retains business ID');
    assert.ok(anchor, 'FIXTURE: real D2 anchor');
  }
  return { data, event, anchor, floor, ticket: daily.解析许曼君离婚后日常事件(event) };
}
function view(data, ticket) {
  const a = account(data), id = `201离婚后日常:${ticket.事件ID}:${ticket.主题}`;
  return {
    phase: a.阶段, count: a.累计次数, startFloor: a.开始楼层,
    resultFloor: a.最近事件楼层, cooldown: a.下次可用时段, reward: a.生活整备可用,
    records: a.事件记录.length, feedback: a.待反馈事件.length,
    sourcesMatch: a.最近事件ID === id && a.生活整备来源事件ID === id &&
      a.事件记录[0]?.id === id && a.事件记录[0]?.发生楼层 === 84 &&
      a.事件记录[0]?.发生时段 === 4 && a.事件记录[0]?.主题 === ticket.主题 &&
      a.事件记录[0]?.选择 === ticket.选择 && a.事件记录[0]?.关系 === '继续关系' &&
      a.待反馈事件[0]?.事件ID === id && a.待反馈事件[0]?.消息键 === `许曼君离婚后日常:${id}:收针回执` &&
      a.待反馈事件[0]?.可发送时段 === 5 && a.最近关系 === '继续关系' && a.当前事件ID === '',
  };
}
const rows = [];
for (const c of cases) {
  for (const native of [false, true]) {
    const name = `${c.id}/${native ? 'native-expression' : 'fixed-expression'}`;
    test(`PLAY002 COORD019 ${name}`, () => {
      const row = { name, expected: { success: c.expected, changed: c.expected }, unexecuted: [] };
      let p;
      try { p = fixture(c, native); }
      catch (error) {
        Object.assign(row, { fixtureError: String(error), passed: false, unexecuted: ['target-call', 'contract-check', 'duplicate'] });
        rows.push(row); console.log('CASE ' + JSON.stringify(row));
        throw new Error(`FIXTURE ${name}: ${String(error)}`);
      }
      const before = clone({ data: p.data, anchor: p.anchor });
      const issues = [];
      const need = (ok, label) => { if (!ok) issues.push(label); };
      let result;
      try { result = h.submitFromProduction(p.data, p.event, p.floor, p.anchor, native, c.body); }
      catch (error) { row.callError = String(error); }
      row.actual = { success: result?.成功 ?? null, changed: result?.变动 ?? null, message: result?.提示 ?? null };
      row.state = view(p.data, p.ticket);
      row.changedPaths = changedPaths(before.data, p.data);
      row.dataUnchanged = isDeepStrictEqual(before.data, p.data);
      row.anchorUnchanged = isDeepStrictEqual(before.anchor, p.anchor);
      row.duplicate = { executed: false, applicable: c.expected };
      need(result?.成功 === c.expected, 'success');
      need(result?.变动 === c.expected, 'changed-result');
      need(row.anchorUnchanged, 'anchor-unchanged');
      if (!c.expected) {
        need(row.dataUnchanged, 'rejection-full-data-unchanged');
      } else if (result?.成功) {
        if (c.beat === 'D1') {
          const expected = clone(before.data), t = p.ticket;
          Object.assign(account(expected), {
            阶段: '待收针', 当前事件ID: t.事件ID, 当前主题: t.主题, 当前选择: t.选择,
            当前关系: t.关系, 开始时段: t.请求时段, 开始楼层: p.floor,
          });
          row.onlyD1CheckpointChanged = isDeepStrictEqual(p.data, expected);
          need(row.onlyD1CheckpointChanged, 'D1-only-checkpoint');
        } else {
          const expected = { phase: '空闲', count: c.index + 1, startFloor: -1, resultFloor: 84,
            cooldown: 10, reward: true, records: 1, feedback: 1, sourcesMatch: true };
          row.D2ListedFieldsMatch = isDeepStrictEqual(row.state, expected);
          need(row.D2ListedFieldsMatch, 'D2-listed-settlement-fields');
        }
        const settled = clone({ data: p.data, anchor: p.anchor });
        try {
          const duplicate = h.submitFromProduction(p.data, p.event, p.floor, p.anchor, native, c.body);
          row.duplicate = { executed: true, applicable: true, success: duplicate.成功, changed: duplicate.变动,
            dataUnchanged: isDeepStrictEqual(p.data, settled.data), anchorUnchanged: isDeepStrictEqual(p.anchor, settled.anchor) };
          need(duplicate.成功 === false && duplicate.变动 === false && row.duplicate.dataUnchanged && row.duplicate.anchorUnchanged,
            'duplicate-rejection-full-data-anchor-unchanged');
        } catch (error) { row.callError = String(error); issues.push('duplicate-call-error'); }
      } else {
        row.unexecuted.push(c.beat === 'D1' ? 'success-D1-checkpoint' : 'success-D2-settlement', 'duplicate-after-success');
      }
      row.issues = issues; row.passed = !row.callError && issues.length === 0;
      rows.push(row);
      // Complete small observations, never full Schema/anchors or duplicated assertion stacks.
      console.log('CASE ' + JSON.stringify(row));
      assert.equal(row.passed, true, `${name}: ${issues.join(',')}${row.callError ?? ''}`);
    });
  }
}
after(() => console.log('CASE_TOTAL ' + JSON.stringify({
  total: rows.length, passed: rows.filter(row => row.passed).length, failed: rows.filter(row => !row.passed).length,
  fixtureErrors: rows.filter(row => row.fixtureError).length, callErrors: rows.filter(row => row.callError).length,
  unexecuted: rows.filter(row => row.unexecuted.length).map(row => ({ name: row.name, branches: row.unexecuted })),
})));
// Consumers above are actual submitted-call expressions, not full 执行回合, native admission,
// generation rewrite, entire queue/lease lifecycle or physical persistence. On first D2 success only
// the listed settlement fields are checked; whole data+anchor equality is asserted for rejects/repeats.
