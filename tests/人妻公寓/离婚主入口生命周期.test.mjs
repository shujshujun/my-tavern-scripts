/* eslint-disable import-x/no-nodejs-modules -- PLAY-013 complete current engine regression. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { host, assertReleased } from './helpers/离婚主入口环境.mjs';

function assertSuccess(e) {
  assertReleased(e);
  assert.equal(e.st.chat.length, 35);
  assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, true);
  assert.equal(e.read().系统._许曼君离婚.阶段, '待归档旧钥匙');
  assert.equal(e.read().系统._场景剧情事务.id, '');
  assert.deepEqual(e.st.chat.slice(33).map(row => row.extra._rqgy回合临时), [false, false]);
  const at = op => e.trace.findIndex(item => item.op === op);
  const cg = e.trace.findIndex(item => item.name === '人妻公寓:许曼君离婚CG');
  assert.ok(at('business-commit') < at('MVU.replace'));
  assert.ok(at('MVU.replace') < at('hard-save'));
  assert.ok(at('hard-save') < cg, 'CG only broadcasts after formal save');
  assert.equal(e.trace.filter(item => item.name === '人妻公寓:许曼君离婚CG').length, 1);
  assert.equal(e.saves.at(-1).chat.at(-1).variables[0].stat_data.系统._许曼君离婚.法律离婚已成立, true);
}
test('PLAY-013 完整固定回合：当前持证和所选见证成功落在34楼', async t => {
  const e = host();
  const success = await e.run();
  if (!success) t.diagnostic(JSON.stringify({ success, modelCalls: e.requests.length, businessCommits: e.commits,
    rows: e.st.chat.length, legalBefore: e.initial.data.系统._许曼君离婚.法律离婚已成立,
    legalAfter: e.read().系统._许曼君离婚.法律离婚已成立, busy: e.main.回合进行中(),
    leaseHeld: e.locks.前台生成租约持有中(), warnings: e.warnings }));
  assert.equal(success, true, e.warnings.join('\n'));
  assertSuccess(e);
  assert.equal(e.commits, 1);
  assert.equal(e.requests.length, 1);
  assert.equal(e.validations.length >= 1, true);
});
