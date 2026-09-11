/* eslint-disable import-x/no-nodejs-modules -- Executes the current native rewrite helper extracted from product source. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import * as ts from 'typescript';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');

globalThis._ = require('lodash');
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;

const indexSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const tree = ts.createSourceFile('index.ts', indexSource, ts.ScriptTarget.Latest, true);

function functionText(name) {
  const found = [];
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found.push(node);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.equal(found.length, 1, `product function ${name}`);
  return found[0].getText(tree);
}

function compileNativeRewrite(deps) {
  const source = [
    functionText('拍摄剧情原生专属正文错误'),
    functionText('生成拍摄剧情原生专属正文重写'),
    'module.exports = { 生成拍摄剧情原生专属正文重写 };',
  ].join('\n');
  const js = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(deps), js)(module, module.exports, ...Object.values(deps));
  return module.exports.生成拍摄剧情原生专属正文重写;
}

const second = require('../../src/人妻公寓/脚本/游戏逻辑/第二机位系统.ts');
const noDoor = require('../../src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');
const audit = require('../../src/人妻公寓/脚本/游戏逻辑/稽查系统.ts');
const contractApi = require('../../src/人妻公寓/脚本/游戏逻辑/拍摄剧情尺度契约.ts');
const { 是提供方拒答正文 } = require('../../src/人妻公寓/脚本/游戏逻辑/正文生成完整性.ts');
const D4 = '【第二机位提交:D:4】【场景剧情连续锁场】【场景剧情需回应】【屋内余波·4/4】';
const contract = contractApi.读取拍摄剧情尺度契约(D4);
assert.ok(contract);

function raw(body, actual) {
  return `${body}\n<尺度判定 模式="简">{"102":{"请求":${actual},"实际":${actual},"结果":"成功"}}</尺度判定>`;
}

function harness(provider) {
  const requests = [];
  const writes = [];
  const events = [];
  const rewrite = compileNativeRewrite({
    第二机位正文越拍原因: second.第二机位正文越拍原因,
    不再留门正文越拍原因: noDoor.不再留门正文越拍原因,
    拍摄剧情尺度越界原因: audit.拍摄剧情尺度越界原因,
    应用拍摄剧情尺度契约: audit.应用拍摄剧情尺度契约,
    是提供方拒答正文,
    解析尺度判定: audit.解析尺度判定,
    eventEmit: (...args) => events.push(args),
    generate: async request => { requests.push(request); return provider(request); },
    stopGenerationById: () => true,
    stopAllGeneration: () => { throw new Error('global stop must not be needed'); },
    应用酒馆最终显示正则: text => text,
    提取静音会议可提交正文: text => text.replace(/<尺度判定[\s\S]*?<\/尺度判定>/gu, '').trim(),
    物理写回静音会议原生正文: async body => { writes.push(body); },
    setTimeout,
    clearTimeout,
    Date,
  });
  return { rewrite, requests, writes, events };
}

function params(overrides = {}) {
  return {
    事件: D4,
    契约: contract,
    首稿错误: '沈静仪实际尺度4超过脚本上限2',
    行动: '继续回应屋内余波。',
    快照: '<公寓快照>当前票仍为屋内余波4/4</公寓快照>',
    楼层: 33,
    消息: { is_user: false, mes: '' },
    仍有效: () => true,
    刷新消息签名: () => undefined,
    ...overrides,
  };
}

test('原生静默重写复用同一拍摄契约；二稿真实屋内余波误报4被校正并写回一次', async () => {
  const h = harness(() => raw('她认出丈夫来过，只整理衣领并与你安静交谈。', 4));
  const result = await h.rewrite(params());
  assert.equal(result.尺度?.角色['102']?.实际, 0);
  assert.equal(h.requests.length, 1);
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0], result.正文);
  assert.doesNotMatch(h.requests[0].injects[0].content, /第二机位拍摄尺度契约|媒介契约|既有摄像机|录像、照片、母带/u);
  assert.ok(h.events.some(args => args[0] === '人妻公寓:运行阶段'));
});

test('原生二稿仍真正发生3级行为时失败关闭，不物理写回错误正文', async () => {
  const h = harness(() => raw('她在本楼重新开始性交，身体动作继续深入。', 3));
  await assert.rejects(h.rewrite(params()), /拍摄剧情重写仍未通过验收.*新发生行为尺度3/u);
  assert.equal(h.requests.length, 1);
  assert.equal(h.writes.length, 0);
});

test('原生二稿含蓄继续高尺度动作时仍失败关闭，不因缺直白关键词降级', async () => {
  const h = harness(() => raw('她重新跨坐在你腰间，身体起伏的节奏再次加快。', 4));
  await assert.rejects(h.rewrite(params()), /无法确认为媒介或历史回顾/u);
  assert.equal(h.writes.length, 0);
});

test('原生二稿返回提供方拒答时失败关闭，不写回拒答文字', async () => {
  const h = harness(() => '抱歉，我无法继续这项请求。');
  await assert.rejects(h.rewrite(params()), /AI服务返回了拒答说明/u);
  assert.equal(h.requests.length, 1);
  assert.equal(h.writes.length, 0);
});

test('原生重写结果迟到且原请求已失效时，在正文验收与写回前拒绝', async () => {
  let resolve;
  const pending = new Promise(yes => { resolve = yes; });
  let valid = true;
  const h = harness(() => pending);
  const result = h.rewrite(params({ 仍有效: () => valid }));
  await Promise.resolve();
  valid = false;
  resolve(raw('她只确认设备已关闭。', 0));
  await assert.rejects(result, /__RQGY_TIMELINE_CHANGED__/u);
  assert.equal(h.requests.length, 1);
  assert.equal(h.writes.length, 0);
});
