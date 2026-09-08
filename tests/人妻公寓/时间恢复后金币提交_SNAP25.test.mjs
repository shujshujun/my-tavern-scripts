/* eslint-disable import-x/no-nodejs-modules -- Real pickup must remain blocked until time recovery completes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { actual, createTimeEnvironment, undoCore } from './helpers/时间事务验收环境_s4t8.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const base = path.join(root, 'src/人妻公寓/脚本/游戏逻辑');
const economy = require(path.join(base, '经济系统.ts'));
const { 经济配置 } = require(path.join(root, 'src/人妻公寓/stageConfig.ts'));
const clone = value => structuredClone(value);
const recordKey = undoCore.时间推进事务键;

// Extract the complete production event registration, not a hand-written substitute callback.
function actualEventHandler(eventName, dependencies) {
  const source = fs.readFileSync(path.join(base, 'index.ts'), 'utf8');
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  const matches = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'eventOn' &&
      ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === eventName) matches.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(matches.length, 1, 'the production event must have a unique registration');
  let captured;
  const deps = { ...dependencies, eventOn: (name, callback) => { assert.equal(name, eventName); captured = callback; } };
  const js = ts.transpileModule(matches[0].getText(ast), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  Function('deps', `const {${Object.keys(deps).join(',')}} = deps; ${js}`)(deps);
  assert.equal(typeof captured, 'function');
  return captured;
}

test('SNAP-25 恢复未完成时金币零提交，恢复后可正常领取且不丢钱', async t => {
  // Scan the production deterministic coin function; do not change its probability or seed.
  createTimeEnvironment({ room: '天台', mode: '推进一时段' });
  let clock = 0;
  while (clock < 48 && economy.查金币('天台', clock) === 0) clock++;
  assert.ok(clock < 48, 'a normal neutral rooftop coin state must exist');
  const env = createTimeEnvironment({ clock, room: '天台', mode: '推进一时段' });
  const originalCash = env.a.data.现金;
  const originalChat = clone(env.a.chat);
  const amount = economy.查金币('天台', clock);
  assert.ok(amount > 0);

  const faults = [];
  env.setHook(async ({ kind, number }) => {
    if ((kind === 'chat:after' && number === 2) || (kind === 'chat:before' && number === 4)) {
      faults.push(`${kind}#${number}`);
      throw new Error(`diagnostic controlled storage failure ${kind}#${number}`);
    }
  });
  await env.advance();
  assert.deepEqual(faults, ['chat:after#2', 'chat:before#4']);
  assert.equal(env.events.filter(event => event[0] === '人妻公寓:时间推进结束').at(-1)?.[1], false);
  assert.ok(env.errors.some(error => error.includes('聊天回滚失败')));
  assert.ok(env.a.vars[recordKey], 'the failed compensation must leave its durable recovery record');
  assert.equal(env.a.data.系统._绝对时段, clock, 'core compensation has succeeded');
  assert.equal(env.a.data.现金, originalCash);
  env.setHook(async () => {});

  // Reuse the environment's chat host adapters. For this subsequent ordinary operation the actual
  // mvuIO reader, queue, submission guards, script writer and view synchronizer remain production code.
  let ordinaryCoreWrites = 0;
  globalThis.Mvu.replaceMvuData = async (raw, target) => {
    assert.equal(target.type, 'message');
    assert.equal(target.message_id, -1);
    ordinaryCoreWrites++;
    env.state.data = clone(raw.stat_data);
  };
  globalThis.insertOrAssignVariables = async (patch, target) => {
    assert.equal(target.type, 'chat');
    return globalThis.updateVariablesWith(vars => Object.assign(vars, clone(patch)), target);
  };
  const ordinaryEvents = [];
  const ordinaryErrors = [];
  const adapters = {
    当前聊天ID: () => env.chatId,
    当前楼层: () => env.state.chat.length - 1,
    读场景: () => clone(env.state.vars._场景),
    // This is an idle ordinary action after the actual time handler has emitted its ending event.
    回合进行中: () => false,
    前台生成租约持有中: () => false,
    同步全部角色阶段世界书: async () => {},
    捕获保护快照: () => {},
    eventEmit: (...args) => ordinaryEvents.push(args),
    console: { info() {}, warn() {}, error: (...args) => ordinaryErrors.push(args) },
  };
  const safeOperation = actual('安全操作', adapters);
  const land = actual('落地', adapters);
  const requireLocation = actual('要求当前地点', adapters);
  const pickup = actualEventHandler('人妻公寓:捡金币', {
    安全操作: safeOperation,
    落地: land,
    要求当前地点: requireLocation,
    捡金币: economy.捡金币,
    当前楼层: adapters.当前楼层,
  });
  const receipt = `天台:${Math.floor(clock / 经济配置.金币刷新时段)}`;
  await pickup('天台');
  await Promise.resolve();
  assert.equal(ordinaryCoreWrites, 0);
  assert.equal(env.a.data.现金, originalCash);
  assert.equal(env.a.vars._经济?.拾取?.[receipt], undefined);
  assert.ok(ordinaryEvents.some(event => String(event[1]).includes('时间操作尚未完成恢复')));
  assert.ok(env.a.vars[recordKey]);
  env.reload();
  assert.equal(await env.recover(), true);
  assert.equal(Object.hasOwn(env.a.vars, recordKey), false);
  await pickup('天台');
  assert.deepEqual(ordinaryErrors, []);
  assert.equal(ordinaryCoreWrites, 1);
  assert.equal(env.a.data.现金, originalCash + amount);
  assert.equal(env.a.vars._经济.拾取[receipt], clock);
  env.reload();
  assert.equal(await env.recover(), false);
  assert.equal(env.a.data.现金, originalCash + amount);
  assert.equal(economy.查金币('天台', clock), 0);
  assert.deepEqual(env.a.chat, originalChat);
  t.diagnostic(JSON.stringify({clock, amount, ordinaryCoreWrites, cashAfterRecoveryAndPickup: env.a.data.现金}));
});
