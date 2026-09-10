/* eslint-disable import-x/no-nodejs-modules -- Actual event guard and registration with a controlled host event bus */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url),
  ts = require('typescript');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const {
  标记未提交回合生成事件,
  标记脚本辅助生成事件,
} = require('../../src/人妻公寓/脚本/游戏逻辑/数据库辅助生成标记.ts');
const { 临时楼标记键 } = require('../../src/人妻公寓/脚本/游戏逻辑/临时回合楼.ts');
const temp = role => ({ is_user: role === 'user', mes: '候选文本', extra: { [临时楼标记键]: true } });

test('临时用户楼、候选助手楼和非末尾临时楼均阻止提前自动填表，消息与其他配置不变', () => {
  for (const chat of [[temp('user')], [temp('assistant')], [temp('assistant'), { mes: '另一个扩展的消息' }]]) {
    const before = structuredClone(chat),
      options = { max_tokens: 400, automatic_trigger: false };
    assert.equal(标记未提交回合生成事件(chat, options), true);
    assert.deepEqual(options, { max_tokens: 400, automatic_trigger: true });
    assert.deepEqual(chat, before);
  }
});
test('已转正、取消后清理、旧版成功楼和普通聊天不改生成事件，正式广播正常放行', () => {
  for (const chat of [
    [],
    [{ extra: { [临时楼标记键]: false } }],
    [{ extra: { _rqgy回合令牌: 'old-success' } }],
    [{ mes: '普通消息' }],
  ]) {
    const options = {};
    assert.equal(标记未提交回合生成事件(chat, options), false);
    assert.deepEqual(options, {});
  }
  const chat = [temp('assistant')],
    options = {};
  标记未提交回合生成事件(chat, options);
  chat[0].extra[临时楼标记键] = false;
  const next = {};
  assert.equal(标记未提交回合生成事件(chat, next), false);
  assert.deepEqual(next, {});
});
test('预览、非对象参数和不可写参数不抛错；已有自动标记保持', () => {
  const chat = [temp('assistant')],
    preview = {};
  assert.equal(标记未提交回合生成事件(chat, preview, true), false);
  assert.deepEqual(preview, {});
  for (const options of [null, undefined, 'text', [], Object.freeze({ automatic_trigger: false })])
    assert.equal(标记未提交回合生成事件(chat, options), false);
  assert.equal(标记未提交回合生成事件(chat, Object.freeze({ automatic_trigger: true })), true);
});

test('脚本辅助生成只标记真实 normal 请求；dryRun、其他类型和不可写参数保持失败关闭', () => {
  const options = { source: 'generateRaw' };
  assert.equal(标记脚本辅助生成事件('normal', options, false), true);
  assert.deepEqual(options, { source: 'generateRaw', automatic_trigger: true });

  for (const [type, dryRun] of [['quiet', false], ['regenerate', false], ['normal', true]]) {
    const untouched = {};
    assert.equal(标记脚本辅助生成事件(type, untouched, dryRun), false);
    assert.deepEqual(untouched, {});
  }
  assert.equal(标记脚本辅助生成事件('normal', Object.freeze({ automatic_trigger: false }), false), false);
  assert.equal(标记脚本辅助生成事件('normal', Object.freeze({ automatic_trigger: true }), false), true);
});

test('生产注册先于数据库记录生成上下文，即使第三方预先绑定generateRaw也按临时生命周期跳过', async () => {
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  let call;
  function visit(n) {
    if (
      ts.isCallExpression(n) &&
      n.expression.getText(ast) === 'eventMakeFirst' &&
      n.arguments[0]?.getText(ast) === 'tavern_events.GENERATION_STARTED' &&
      n.getText(ast).includes('标记未提交回合生成事件')
    )
      call = n;
    ts.forEachChild(n, visit);
  }
  visit(ast);
  assert.ok(call, 'The real initializer must register the guard first');
  const listeners = [],
    chat = [temp('assistant')];
  let captured,
    autoFills = 0;
  listeners.push((_type, params) => {
    captured = { ...params };
  });
  const eventMakeFirst = (_event, listener) => {
    listeners.unshift(listener);
    return { stop: () => listeners.splice(listeners.indexOf(listener), 1) };
  };
  const helper = {
    generateRaw: async () => {
      const options = {};
      for (const listener of listeners) listener('normal', options, false);
      if (!captured.automatic_trigger) autoFills++;
      return '已解析';
    },
  };
  const preBound = helper.generateRaw.bind(helper);
  const js = ts.transpileModule(call.getText(ast), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  Function(
    'eventMakeFirst',
    'tavern_events',
    'SillyTavern',
    '标记未提交回合生成事件',
    js,
  )(eventMakeFirst, { GENERATION_STARTED: 'start' }, { chat }, 标记未提交回合生成事件);
  assert.equal(await preBound(), '已解析');
  assert.equal(autoFills, 0);
  chat[0].extra[临时楼标记键] = false;
  await preBound();
  assert.equal(autoFills, 1);
});
