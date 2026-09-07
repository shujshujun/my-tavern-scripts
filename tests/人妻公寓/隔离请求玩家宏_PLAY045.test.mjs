/* eslint-disable import-x/no-nodejs-modules -- Capture real generator requests; never call a provider. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json']; delete require.extensions['.json']; require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');
globalThis.window = { parent: {}, document: {}, addEventListener() {}, removeEventListener() {} };
window.parent = window;
globalThis.getPreset = () => ({ prompts: [] });
globalThis.getLoadedPresetName = () => 'test';
globalThis.eventEmit = () => {};
globalThis.getTavernRegexes = () => [];
globalThis.getGlobalSettings = () => ({});
const engine = require('../../src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts');
const input = { 类型: '睡眠', 线程: 'play045', 房间: '管理员室', 行动: '保留输入{{user}}与{{lastUserMessage}}。', 导演事件: '{{user}}检查当下安排，保留{{lastUserMessage}}作为未知模板数据。' };

function host(name, macro = token => token === '{{user}}' ? name : token) {
  const vars = { _隔离事件: { 日志: [{ 线程: 'play045', 谁: '玩家', 文本: '历史原文{{user}}。' }] } };
  const calls = [];
  globalThis.SillyTavern = { name1: name, getCurrentChatId: () => 'play045-chat', chat: [] };
  globalThis.getVariables = () => structuredClone(vars);
  globalThis.substitudeMacros = macro;
  globalThis.generateRaw = async request => { calls.push(structuredClone(request)); return '检查已经结束。'; };
  globalThis.fetch = async () => { throw new Error('external request forbidden'); };
  return { vars, calls };
}

for (const name of ['林舟', 'Alex Chen', '阿舟🌿', 'A$&B']) {
  test(`自定义system按字面展开本次Persona：${name}`, async () => {
    const h = host(name); const before = structuredClone(input);
    const draft = await engine.生成隔离事件草稿(input);
    assert.equal(h.calls.length, 1);
    const system = h.calls[0].ordered_prompts.find(p => p.role === 'system').content;
    assert.ok(system.includes(`${name}检查当下安排`));
    assert.ok(system.includes('{{lastUserMessage}}'));
    assert.ok(draft.提示词.includes(`${name}检查当下安排`));
    assert.equal(h.calls[0].user_input, input.行动);
    assert.ok(h.calls[0].ordered_prompts.some(p => p.content === '历史原文{{user}}。'));
    assert.deepEqual(input, before);
  });
}

for (const mode of ['missing', 'throw', 'unresolved']) {
  test(`宏接口${mode}时仅回退当前Persona，不解析其他历史宏`, async () => {
    const h = host('备用姓名', mode === 'missing' ? undefined : mode === 'throw' ? () => { throw new Error('macro unavailable'); } : x => x);
    if (mode === 'missing') delete globalThis.substitudeMacros;
    await engine.生成隔离事件草稿(input);
    assert.ok(h.calls[0].ordered_prompts.find(p => p.role === 'system').content.includes('备用姓名检查当下安排'));
  });
}

test('失败后改名重试重新捕获身份，原草稿和历史不回写', async () => {
  const h = host('第一次姓名');
  globalThis.generateRaw = async request => { h.calls.push(structuredClone(request)); throw new Error('provider failed'); };
  await assert.rejects(engine.生成隔离事件草稿(input), /provider failed/);
  SillyTavern.name1 = '第二次姓名';
  globalThis.substitudeMacros = () => '第二次姓名';
  globalThis.generateRaw = async request => { h.calls.push(structuredClone(request)); return '检查已经结束。'; };
  await engine.生成隔离事件草稿(input);
  assert.ok(h.calls[0].ordered_prompts[0].content.includes('第一次姓名检查'));
  assert.ok(h.calls[1].ordered_prompts[0].content.includes('第二次姓名检查'));
  assert.equal(h.vars._隔离事件.日志[0].文本, '历史原文{{user}}。');
});

test('VTR同族仅展开脚本模板来源，历史和连续性摘要保持原文', async () => {
  const h = host('林舟');
  const parameters = { 场次标识: 'play045-vtr', 房间: '102', 画面键: 'VTR-V4-102-B01', 行动: '输入{{user}}。',
    系统契约: '{{user}}核对记录。', 入口胶囊: '{{user}}已经到场。', 当前卡: '{{user}}继续检查。',
    历史: [{ role: 'assistant', content: '旧正文{{user}}。' }], 房间摘要: { 102: '旧摘要{{user}}。', 202: '' } };
  const before = structuredClone(parameters);
  const draft = await engine.生成录像带V4隔离草稿(parameters);
  const prompts = h.calls[0].ordered_prompts;
  for (const phrase of ['林舟核对记录。', '林舟已经到场。', '林舟继续检查。']) {
    assert.ok(prompts.some(p => p.content?.includes(phrase)));
    assert.ok(draft.提示词.includes(phrase));
  }
  assert.ok(prompts.some(p => p.content === '旧正文{{user}}。'));
  assert.ok(prompts.some(p => p.content?.includes('旧摘要{{user}}。')));
  assert.equal(h.calls[0].user_input, parameters.行动);
  assert.deepEqual(parameters, before);
});
