/* eslint-disable import-x/no-nodejs-modules -- Node-only real channel refusal gates. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
const fakeWindow = { parent: null, addEventListener() {}, removeEventListener() {}, SillyTavern: null };
fakeWindow.parent = fakeWindow;
globalThis.window = fakeWindow;
globalThis.localStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
globalThis.sessionStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
globalThis.formatAsTavernRegexedString = text => text;
globalThis.substitudeMacros = text => text;
globalThis.getPreset = () => ({ prompts: [], prompt_order: [] });
globalThis.getLoadedPresetName = () => 'refusal-gate-test';
globalThis.eventEmit = () => undefined;
globalThis.eventMakeFirst = () => ({ stop() {} });
globalThis.tavern_events = { GENERATION_AFTER_COMMANDS: 'generation_after_commands' };
globalThis.stopGenerationById = () => true;
globalThis.stopAllGeneration = () => undefined;
globalThis.SillyTavern = {
  name1: '玩家', mainApi: 'openai', chatCompletionSettings: { chat_completion_source: 'custom' },
  getCurrentChatId: () => 'refusal-channel-chat', getContext() { return this; },
};
fakeWindow.SillyTavern = globalThis.SillyTavern;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const originalLoad = Module._load;
Module._load = function loadTestRaw(request, parent, isMain) {
  if (request === '../数据库桥' && parent?.filename?.endsWith('手机\\生成引擎.ts')) {
    return { 数据库状态: () => ({ 可调用AI: false }), 通过数据库生成: async () => '' };
  }
  if (typeof request === 'string' && request.endsWith('?raw') && parent?.filename) {
    return readFileSync(resolve(dirname(parent.filename), request.slice(0, -4)), 'utf8');
  }
  return originalLoad.call(this, request, parent, isMain);
};

const schema = require('../../src/人妻公寓/schema.ts');
const isolated = require('../../src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts');
const glory = require('../../src/人妻公寓/脚本/游戏逻辑/荣耀洞.ts');
const phone = require('../../src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts');
const motherVideo = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话系统.ts');
const { 清空生成租约 } = require('../../src/人妻公寓/脚本/游戏逻辑/生成通道互斥.ts');
Module._load = originalLoad;

const refusal = '抱歉，我无法继续这项请求。';

test('普通隔离生成收到拒答时抛错，不返回可写入草稿', async () => {
  清空生成租约();
  globalThis.generateRaw = async () => refusal;
  await assert.rejects(
    isolated.生成隔离事件草稿({
      类型: '睡眠', 线程: 'refusal:test', 行动: '休息', 导演事件: '只写本轮休息反馈。', 房间: '201',
    }),
    /AI服务返回了拒答说明，本拍未发生/u,
  );
  清空生成租约();
});

test('荣耀洞专属验收拒绝服务说明，但不把角色自己的拒绝当服务失败', () => {
  const data = schema.Schema.parse({ 系统: { _荣耀洞拍: 0, _荣耀洞门牌: '空', _荣耀洞点破: false } });
  assert.match(glory.荣耀洞正文边界原因(data, refusal), /AI服务返回了拒答说明/u);
  assert.equal(glory.荣耀洞正文边界原因(data, '她摇头说今天不愿继续，随后整理好衣服。'), '');
});

test('手机完整封套中的服务拒答不进入气泡，角色自己的拒绝仍保留', () => {
  assert.equal(phone.净化消息(`<回复>${refusal}</回复>`), '');
  assert.equal(phone.净化消息('<回复>抱歉，我不能继续这段关系。</回复>'), '抱歉，我不能继续这段关系。');
});

test('母亲视频现场拒答不推进现场序号，正常角色正文仍可完成', () => {
  const data = schema.Schema.parse({});
  data.系统._母亲视频通话终幕 = {
    ...motherVideo.空母亲视频通话终幕(),
    标识: 'video-refusal-1', 状态: '等待现场正文', 当前CG: '双重继承_15_机场视频接通',
    待现场正文序号: 1, 已完成现场正文序号: 0,
  };
  const start = motherVideo.开始母亲视频通话现场正文(data, 'video-refusal-1', 1);
  assert.equal(start.成功, true);
  const before = lodash.cloneDeep(data.系统._母亲视频通话终幕);
  const denied = motherVideo.完成母亲视频通话现场正文(data, 'video-refusal-1', 1, start.请求世代, refusal);
  assert.equal(denied.成功, false);
  assert.match(denied.提示, /拒答说明/u);
  assert.deepEqual(data.系统._母亲视频通话终幕, before);

  const ok = motherVideo.完成母亲视频通话现场正文(
    data, 'video-refusal-1', 1, start.请求世代, '母亲听完父亲的话，只把手机握紧了一些。',
  );
  assert.equal(ok.成功, true);
  assert.equal(data.系统._母亲视频通话终幕.已完成现场正文序号, 1);
});
