/* eslint-disable import-x/no-nodejs-modules -- Execute the production internal-delete wrapper */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url), ts = require('typescript');
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('engine.ts', source, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === '内部删除聊天消息');
assert.ok(declaration);
const js = ts.transpileModule(declaration.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

function harness(mode) {
  const host = { chat: Array.from({ length: 8 }, (_, id) => ({ id })) };
  let chatId = 'owned', listener, stopped = 0, completed = 0;
  const emitted = [], leases = [];
  const run = Function('SillyTavern', '当前聊天ID', '登记内部删楼租约', 'deleteChatMessages', 'eventOn', 'eventEmit', 'tavern_events', 'console', `${js};return 内部删除聊天消息;`)(
    host, () => chatId, ids => { leases.push([...ids]); return { 完成: () => completed++ }; },
    async ids => {
      if (mode === 'fail') throw new Error('delete failed');
      if (mode === 'noop') return;
      for (const id of [...ids].sort((a, b) => b - a)) host.chat.splice(id, 1);
      if (mode === 'native') listener?.(Math.min(...ids));
      if (mode === 'switch') { host.chat = [{ id: 'other' }]; chatId = 'other'; }
    },
    (_event, fn) => { listener = fn; return { stop: () => { stopped++; listener = null; } }; },
    async (_event, id) => { emitted.push(id); listener?.(id); },
    { MESSAGE_DELETED: 'deleted' }, { warn() {} },
  );
  return { run, host, emitted, leases, counts: () => ({ stopped, completed }) };
}

test('真实删除但宿主未通知时补一次删除事件，额外租约保护迟到原生通知', async () => {
  const h = harness('silent');
  await h.run([6, 7]);
  assert.equal(h.host.chat.length, 6);
  assert.deepEqual(h.emitted, [6]);
  assert.deepEqual(h.leases, [[6, 7], [6]]);
  assert.deepEqual(h.counts(), { stopped: 1, completed: 2 });
});
test('已有原生删除事件不补发，监听和租约均释放', async () => {
  const h = harness('native');
  await h.run([6, 7]);
  assert.deepEqual(h.emitted, []);
  assert.deepEqual(h.counts(), { stopped: 1, completed: 1 });
});
test('删除失败或没有实际删除不伪造事件', async () => {
  const failed = harness('fail');
  await assert.rejects(failed.run([6, 7]), /delete failed/);
  assert.deepEqual(failed.emitted, []);
  assert.deepEqual(failed.counts(), { stopped: 1, completed: 1 });
  const noop = harness('noop');
  await noop.run([6, 7]);
  assert.deepEqual(noop.emitted, []);
});
test('异步删除期间切聊天不向新聊天补发旧事件', async () => {
  const h = harness('switch');
  await h.run([6, 7]);
  assert.deepEqual(h.emitted, []);
  assert.deepEqual(h.counts(), { stopped: 1, completed: 1 });
});
