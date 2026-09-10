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
  const calls = [], databaseObserved = [], listeners = new Map();
  const generationAfterCommands = 'generation_after_commands';
  listeners.set(generationAfterCommands, [(_type, options) => databaseObserved.push(options.automatic_trigger === true)]);
  globalThis.tavern_events = { GENERATION_AFTER_COMMANDS: generationAfterCommands };
  globalThis.eventMakeFirst = (event, listener) => {
    const list = listeners.get(event) ?? [];
    list.unshift(listener);
    listeners.set(event, list);
    return {
      stop: () => {
        const index = list.indexOf(listener);
        if (index >= 0) list.splice(index, 1);
      },
    };
  };
  globalThis.SillyTavern = { name1: name, getCurrentChatId: () => 'play045-chat', chat: [] };
  globalThis.getVariables = () => structuredClone(vars);
  globalThis.substitudeMacros = macro;
  globalThis.generateRaw = async request => {
    const options = {};
    for (const listener of [...(listeners.get(generationAfterCommands) ?? [])]) {
      await listener('normal', options, false);
    }
    calls.push(structuredClone(request));
    return '检查已经结束。';
  };
  globalThis.fetch = async () => { throw new Error('external request forbidden'); };
  return { vars, calls, databaseObserved };
}

test('睡眠与录像带隔离生成在数据库监听前声明为后台触发，并保留前台取消语义', async () => {
  const h = host('林舟');
  await engine.生成隔离事件草稿({
    类型: '睡眠',
    线程: 'play045-sleep',
    房间: '管理员室',
    行动: '睡到次日早晨。',
    导演事件: '从入睡写到次日醒来。',
  });
  await engine.生成录像带V4隔离草稿({
    场次标识: 'play045-vtr-background',
    房间: '102',
    画面键: 'VTR-V4-102-B01',
    行动: '继续查看录像。',
    系统契约: '只演绎当前录像带画面。',
    入口胶囊: '播放器已经启动。',
    当前卡: '继续当前画面。',
    历史: [],
    房间摘要: { 102: '', 202: '' },
  });

  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.databaseObserved, [true, true], '数据库的后续监听必须看到 automatic_trigger=true');
  for (const request of h.calls) {
    assert.notEqual(request.should_silence, true, '不能为规避填表而改成静默生成，酒馆停止按钮仍须可用');
    assert.match(request.generation_id, /^rqgy-(?:isolated|vtr-v4)-/u);
  }
});

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
