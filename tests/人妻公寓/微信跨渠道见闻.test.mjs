/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test, { after } from 'node:test';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (request, parent, main) {
  if (request.endsWith('?raw')) return readFileSync(resolve(dirname(parent.filename), request.slice(0, -4)), 'utf8');
  return originalLoad.call(this, request, parent, main);
};
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');
const windows = [];
function emptyHost() {
  const document = Object.assign(new EventTarget(), { querySelectorAll: () => [], documentElement: null });
  const host = Object.assign(new EventTarget(), { document });
  host.parent = host;
  windows.push(host);
  return host;
}
globalThis.window = emptyHost();
after(() => {
  for (const host of windows) host.dispatchEvent(new Event('pagehide'));
  Module._load = originalLoad;
});
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 门牌列表, 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const {
  编译角色跨渠道见闻,
  角色可知群消息,
  读取角色跨渠道见闻,
  当前社交接收门牌,
  规范社交接收门牌,
} = require('../../src/人妻公寓/脚本/游戏逻辑/微信跨渠道见闻.ts');
const { 撤回微信玩家消息 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信消息撤回.ts');
const { 写库增量, 读库 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
const { 读取近期微信胶囊 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/摘要系统.ts');
const { 读取私聊记忆上下文, 读取群聊记忆上下文 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/微信记忆上下文.ts');

const msg = (文, rest = {}) => ({ 楼: 5, 时: 20, 会话: '姐妹群', 发: '对方', 文, ...rest });
const post = (谁, 文, rest = {}) => ({ 楼: 5, 时: 20, 谁, 文, 评: [], ...rest });
const capsule = (库, m = '101', options = {}) =>
  编译角色跨渠道见闻(库, [{ 门牌: m, 人物: 户静态表[m].妻名 }], 5, 20, new Set(), options);

function environment() {
  const data = Schema.parse({ 户: Object.fromEntries(门牌列表.map(m => [m, 创建户节点(0)])) });
  data.系统._绝对时段 = 20;
  data.户['101'].妻.当前阶段 = 3;
  data.户['301'].妻.当前阶段 = 5;
  let vars = {};
  globalThis.window = emptyHost();
  globalThis.SillyTavern = {
    name1: '玩家',
    chat: Array.from({ length: 6 }, (_, i) => ({ mes: `正文${i}`, is_user: false, swipe_id: 0 })),
    getCurrentChatId: () => 'cross-channel-test',
  };
  globalThis.Mvu = { getMvuData: () => ({ stat_data: data }) };
  globalThis.getVariables = () => vars;
  globalThis.updateVariablesWith = async update => {
    vars = update(structuredClone(vars));
  };
  return {
    data,
    get vars() {
      return vars;
    },
  };
}

test('接收名单按当时资格冻结；结局与入群是不同事实，未入列母亲不提前收消息', () => {
  const { data } = environment();
  assert.deepEqual(当前社交接收门牌(data, '姐妹群'), ['101', '301']);
  assert.equal(当前社交接收门牌(data, '朋友圈').includes('302'), false);
  data.系统._已完成特殊场景.push('录像带结局');
  assert.deepEqual(当前社交接收门牌(data, '姐妹群'), ['101', '301']);
  data.系统._母亲入列 = true;
  assert.equal(当前社交接收门牌(data, '朋友圈').includes('302'), true);
  assert.equal(当前社交接收门牌(data, '姐妹群').includes('302'), false);
  data.系统._回国.茶话会状态 = '已完成';
  assert.equal(当前社交接收门牌(data, '姐妹群').includes('302'), true);
  assert.equal(规范社交接收门牌(undefined), undefined);
  assert.deepEqual(规范社交接收门牌('101'), []);
  assert.deepEqual(规范社交接收门牌(['301', '301', '999', null]), ['301']);
});

test('旧群记录只凭本人发言和真实引用获知，收到一条引用不等于知道全部旧群史', () => {
  const rows = [
    msg('安若妍：相框已经换好了。', { 序: 1 }),
    msg('周小满：另一件还没有告诉你们的事。', { 序: 2 }),
    msg('夏乔：你选了哪张？', { 序: 3, 引用: { 序: 1 } }),
    msg('听说她搬走了？', { 发: '我', 序: 4, 标识: 'player', 接收门牌: ['101', '301'] }),
  ];
  const known = 角色可知群消息(rows, '101', 5, 20);
  assert.deepEqual(
    known.map(项 => 项.序),
    [1, 3, 4],
  );
  assert.deepEqual(角色可知群消息(rows, '201', 5, 20), []);
  const text = capsule({ 消息: rows, 圈: [] });
  assert.match(text, /玩家.*听说她搬走了/);
  assert.match(text, /传闻.*不等于事情已经发生/);
  assert.doesNotMatch(text, /另一件还没有/);
  assert.deepEqual(
    角色可知群消息([{ ...rows[2], 引用: { 序: 4 } }, rows[3]], '101', 5, 20).map(项 => 项.序),
    [3, 4],
  );
});

test('撤回、失效引用、楼务任务过期与未来时段不进入见闻；照片旧反应凭据只授予对应原帖', () => {
  const rows = [
    msg('这件事还没发生。', { 发: '我', 标识: 'p', 序: 1, 接收门牌: ['101'] }),
    msg('夏乔：那就以后再说。', { 序: 2, 引用: { 标识: 'p' } }),
    msg('安若妍：原来的照片。', { 序: 3, 键: '301结局:换照:姐妹群照片' }),
    msg('夏乔：原来是这张。', { 序: 4, 键: '301结局:换照:姐妹群反应:1' }),
    msg('安若妍：明天才发的。', { 时: 21, 接收门牌: ['101'] }),
    msg('安若妍：未来楼层。', { 楼: 6, 接收门牌: ['101'] }),
    msg('安若妍：旧任务内容。', { 键: '楼务:expired', 接收门牌: ['101'] }),
  ];
  const withdrawn = 撤回微信玩家消息(rows, { 标识: 'p' }).消息;
  const text = capsule({ 消息: withdrawn, 圈: [] });
  assert.match(text, /原消息已撤回/);
  assert.match(text, /原来的照片/);
  assert.doesNotMatch(text, /这件事还没发生|明天才发|未来楼层|旧任务内容/);
  assert.doesNotMatch(capsule({ 消息: withdrawn, 圈: [] }, '201'), /原来的照片/);
  assert.doesNotMatch(capsule({ 消息: withdrawn.filter(项 => 项.序 !== 3), 圈: [] }), /原来的照片/);
});

test('公开动态按发布时接收者或本人真实评论接续；仅你可见不会因伪评论泄给其他角色', () => {
  const 圈 = [
    post('安若妍', '已经换好了新的相框。', { 接收门牌: ['101', '301'], 评: [{ 谁: '夏乔', 文: '放在哪里？' }] }),
    post('沈静仪', '今天录了一小段。', { 评: [{ 谁: '夏乔', 文: '等你发出来。' }] }),
    post('安若妍', '只给你看的晚间消息。', {
      私: {},
      接收门牌: ['101', '301'],
      评: [{ 谁: '夏乔', 文: '损坏的评论' }],
    }),
    post('许曼君', '没有接收证据的旧动态。'),
  ];
  const text = capsule({ 消息: [], 圈 });
  assert.match(text, /新的相框.*夏乔评论：放在哪里/);
  assert.match(text, /今天录了一小段/);
  assert.doesNotMatch(text, /晚间消息|损坏的评论|没有接收证据/);
  assert.match(capsule({ 消息: [], 圈 }, '301'), /向玩家发仅你可见动态：只给你看的晚间消息/);
  assert.doesNotMatch(capsule({ 消息: [], 圈 }, '301'), /损坏的评论/);
});

test('真正提交才给接收名单，去重重试不补写新成员，取消和提交失败不留见闻', async () => {
  const env = environment();
  const delta = {
    新圈: [post('安若妍', '新相框', { 事件键: 'photo-post' })],
    新消息: [msg('安若妍：换好啦。', { 键: 'photo' })],
    节拍改: {},
  };
  assert.equal(await 写库增量(delta, () => false), false);
  assert.deepEqual(读库().消息, []);
  const update = globalThis.updateVariablesWith;
  globalThis.updateVariablesWith = async () => {
    throw new Error('save failed');
  };
  await assert.rejects(写库增量(delta), /save failed/);
  assert.deepEqual(读库().消息, []);
  globalThis.updateVariablesWith = update;
  assert.equal(await 写库增量(delta), true);
  assert.deepEqual(读库().消息[0].接收门牌, ['101', '301']);
  const first = structuredClone(读库());
  env.data.户['201'].妻.当前阶段 = 3;
  assert.equal(await 写库增量(delta), true);
  assert.equal(读库().消息.length, 1);
  assert.deepEqual(读库().消息[0], first.消息[0]);
  assert.deepEqual(读库().圈[0], first.圈[0]);
  assert.equal(capsule(读库(), '201').includes('换好啦'), false);
  await 写库增量({ 新消息: [msg('安若妍：欢迎加入，照片已经换了。')], 新圈: [], 节拍改: {} });
  assert.match(capsule(读库(), '201'), /欢迎加入/);
  assert.equal(env.vars._微信.消息.length, 2);
});

test('实际私聊、群聊和正文入口读取同一见闻，单独在场的角色可接续而不召来消息作者', async () => {
  const { data } = environment();
  await 写库增量({
    新消息: [msg('安若妍：已经换好相框了。')],
    新圈: [post('安若妍', '明天再换一下摆放位置。')],
    节拍改: {},
  });
  const 库 = 读库();
  assert.match(读取私聊记忆上下文('101', data, 库, 5, { 包含见证正文: false }).可知记忆, /换好相框/);
  const body = 读取近期微信胶囊(['101'], 5, 20, [], { 仅本楼已完成往返: true });
  assert.match(body, /夏乔实际收到的社交消息/);
  assert.match(body, /换好相框|摆放位置/);
  assert.doesNotMatch(body, /安若妍实际收到的社交消息/);
  const group = 读取群聊记忆上下文('姐妹群', 库, 5, ['101', '301']);
  assert.match(group.群内记忆, /夏乔实际收到的社交消息/);
  assert.match(group.最近聊天, /已知接收者：夏乔、安若妍/);
  assert.equal(读取近期微信胶囊(['101'], 6, 20, [], { 仅本楼已完成往返: true }), '', '下一正文楼自然消费即时资格');
  assert.match(读取近期微信胶囊(['101'], 6, 20), /换好相框/, '明确追忆仍可读最近见闻');
  assert.deepEqual(
    读取角色跨渠道见闻(库, '102', 5, 20).filter(项 => 项.来源 === '姐妹群'),
    [],
  );
});

test('同楼重掷或删楼以后用真实读库结果编译，不让历史接收名单复活旧分支内容', async () => {
  environment();
  await 写库增量({ 新消息: [msg('安若妍：旧分支这句话。')], 新圈: [post('安若妍', '旧分支这张动态。')], 节拍改: {} });
  assert.match(capsule(读库()), /旧分支/);
  SillyTavern.chat[5] = { mes: '重掷后不同的正文', is_user: false, swipe_id: 1 };
  assert.equal(capsule(读库()), '');
  SillyTavern.chat.pop();
  assert.equal(capsule(读库()), '');
});

test('高密度记录保留每个人的近期完整条目，不能因为整段超长变成所有人失忆', () => {
  const 消息 = Array.from({ length: 15 }, (_, i) =>
    msg(`安若妍：第${i}条，${'今天的相框换了位置。'.repeat(12)}`, { 序: i, 接收门牌: 门牌列表 }),
  );
  const 人物 = 门牌列表.map(m => ({ 门牌: m, 人物: 户静态表[m].妻名 }));
  const text = 编译角色跨渠道见闻({ 消息, 圈: [] }, 人物, 5, 20, new Set(), { 预算: 2600 });
  assert.ok(text.length <= 2600);
  for (const 人 of 人物) assert.match(text, new RegExp(`${人.人物}实际收到的社交消息`));
  assert.match(text, /第14条/);
  assert.doesNotMatch(text, /第0条/);
  assert.ok(capsule({ 消息, 圈: [] }, '101', { 预算: 1000 }).includes('第14条'));
});
