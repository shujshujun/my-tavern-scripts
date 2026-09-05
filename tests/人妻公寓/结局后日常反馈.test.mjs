/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const ts = require('typescript');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 门牌列表 } = require('../../src/人妻公寓/stageConfig.ts');
const policy = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局后日常反馈.ts');
const facts = require('../../src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');
const { 读取医院内容策略 } = require('../../src/人妻公寓/脚本/游戏逻辑/生产系统.ts');
const { 已入住微信妻友门牌 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信好友规则.ts');
const { 验收群聊隐私 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts');
const { 解析微信群消息, 验收单条群消息 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机群聊格式.ts');
const { seededRandom, 当前时段 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 发圈偏好 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/内容素材表.ts');
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('节拍引擎.ts', source, ts.ScriptTarget.Latest, true);
function load(name, dependencies) {
  const fn = ast.statements.find(item => ts.isFunctionDeclaration(item) && item.name?.text === name);
  assert.ok(fn, name);
  const js = ts.transpileModule(fn.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(...Object.keys(dependencies), `${js};return ${name}`)(...Object.values(dependencies));
}
function fresh(complete = true) {
  const data = Schema.parse({ 户: Object.fromEntries(门牌列表.map(m => [m, 创建户节点(0)])) });
  if (complete)
    data.系统._已完成特殊场景.push(
      '借种',
      '录像带结局',
      facts.许曼君正式离婚完成ID,
      '角色路线:301:结局剧情',
      '双重继承',
    );
  data.系统._许曼君分居.玩家最终关系选择 = '继续关系';
  return data;
}

test('六户各自进入生活方向，共享结局同时作用于102与202，未完成和缺户不借用未来阶段', () => {
  const before = fresh(false);
  for (const m of 门牌列表) assert.equal(policy.结局后公开日常(before, m), null);
  before.系统._已完成特殊场景.push('录像带结局');
  for (const m of ['102', '202']) assert.ok(policy.结局后公开日常(before, m));
  assert.equal(policy.结局后公开日常(before, '201'), null);
  const after = fresh();
  const directions = 门牌列表.map(m => policy.结局后公开日常(after, m).方向);
  assert.equal(new Set(directions).size, 6);
  delete after.户['302'];
  assert.equal(policy.结局后公开日常(after, '302'), null);
});

test('普通公开图退出攻略等级，私人旧图库保留偶尔分享，201退出与302专用事件分别处理', () => {
  const data = fresh();
  for (const m of 门牌列表) {
    assert.equal(policy.结局后普通图策略(data, m, '公开朋友圈', 0.1), '主题图库');
    assert.equal(policy.结局后普通图策略(data, m, '主动私聊', 0.8), '文字');
    assert.equal(policy.结局后普通图策略(data, m, '仅你可见', 0.8), '文字');
  }
  for (const m of ['101', '102', '201', '202', '301'])
    assert.equal(policy.结局后普通图策略(data, m, '主动私聊', 0.1), '沿用原图');
  assert.equal(policy.结局后普通图策略(data, '302', '主动私聊', 0.1), '文字');
  data.系统._许曼君分居.玩家最终关系选择 = '退出关系';
  assert.equal(policy.结局后普通图策略(data, '201', '仅你可见', 0.1), '文字');
  assert.match(policy.公开动态评论者方向(data, '201'), /独立生活/);
  for (const m of 门牌列表) assert.equal(policy.结局后普通图策略(fresh(false), m, '主动私聊', 0.9), '沿用原图');
});

test('真实选题函数消费当前生活主题，保留个人与全楼近期去重', () => {
  const 圈主题 = load('圈主题', {});
  const choose = load('选发圈主题', { 户静态表, 圈主题, 当前时段, 发圈偏好, seededRandom });
  const data = fresh();
  for (const m of 门牌列表) {
    const preference = policy.结局后公开日常(data, m).主题;
    for (let clock = 20; clock < 35; clock++) {
      const topic = choose(
        {
          圈: [
            { 谁: 户静态表[m].妻名, 题: '居家' },
            { 谁: '别人', 题: '美食' },
          ],
        },
        m,
        clock,
        false,
        preference,
      );
      assert.ok(preference.includes(topic));
      assert.notEqual(topic, '居家');
      assert.notEqual(topic, '美食');
    }
    assert.equal(choose({ 圈: [] }, m, 20, true, preference), '自拍', '实际晒装仍有原图片主题');
  }
});

function commentsEnvironment(response) {
  const calls = [];
  const fn = load('结局日常动态评论', {
    户静态表,
    读取医院内容策略,
    ...policy,
    微信好友: data => 已入住微信妻友门牌(data).map(m => ({ id: m, 类: '妻', 名: 户静态表[m].妻名 })),
    seededRandom: () => 0.1,
    小生成: async (...args) => {
      calls.push(args);
      return response();
    },
    微信群文本: async (text, names, max, limit) =>
      解析微信群消息(text ?? '', names, max, limit)
        .map(row => 验收单条群消息(row, names, max))
        .filter(Boolean)
        .slice(0, limit),
    手机可见单条硬上限: 150,
    验收群聊隐私,
  });
  return { fn, calls };
}

test('实际评论生成读取各自阶段：已完成和未完成看到同一动态而保持不同经历，私密事实不能由公开帖授予', async () => {
  const data = fresh(false);
  data.系统._已完成特殊场景.push('借种', '角色路线:301:结局剧情');
  const env = commentsEnvironment(() => '夏乔:这个相框放得挺好看。\n沈静仪:窗边的光线也很合适。\n母亲:未入列的人。');
  assert.deepEqual(await env.fn(data, '301', '换了个相框的位置。', 20, () => true), [
    { 谁: '夏乔', 文: '这个相框放得挺好看。' },
    { 谁: '沈静仪', 文: '窗边的光线也很合适。' },
  ]);
  assert.match(env.calls[0][1], /家庭经验/);
  assert.match(env.calls[0][1], /沈静仪仍处在本人的当前关系阶段/);
  data.系统._已完成特殊场景.push('录像带结局');
  await env.fn(data, '301', '换了个相框的位置。', 20, () => true);
  assert.match(env.calls[1][1], /沈静仪仍克制/);
  assert.doesNotMatch(env.calls[1][1], /沈静仪仍处在本人的当前关系阶段/);
  const leak = commentsEnvironment(() => '夏乔:你私聊里说过这件事。');
  assert.deepEqual(await leak.fn(data, '301', '相框的位置。', 20, () => true), []);
});

test('评论失败、超时和失效请求没有固定兜底，公开孕情评论与帖子使用同一资格', async () => {
  const data = fresh();
  const failed = commentsEnvironment(() => {
    throw new Error('test timeout');
  });
  assert.deepEqual(await failed.fn(data, '301', '相框。', 20, () => true), []);
  const stale = commentsEnvironment(() => '夏乔:很好看。');
  assert.deepEqual(await stale.fn(data, '301', '相框。', 20, () => false), []);
  assert.equal(stale.calls.length, 0);
  const late = commentsEnvironment(() => {
    valid = false;
    return '夏乔:很好看。';
  });
  let valid = true;
  assert.deepEqual(await late.fn(data, '301', '相框。', 20, () => valid), []);
  const pregnant = commentsEnvironment(() => '夏乔:怀孕以后也要照顾好自己。');
  assert.deepEqual(await pregnant.fn(data, '301', '最近容易累。', 20, () => true), []);
  data.户['301'].妻._怀孕.状态 = '已告知';
  assert.equal((await pregnant.fn(data, '301', '怀孕以后容易累。', 20, () => true)).length, 1);
});

test('生产入口接线：结局旧档停止深夜撤回，私密动态消费真实记忆，评论失败不吞原动态', () => {
  const automatic = ast.statements
    .find(item => ts.isFunctionDeclaration(item) && item.name?.text === '主动私聊')
    .getText(ast);
  assert.match(automatic, /const 深夜档 = !结局后公开日常\(data, m\) && 阶段 === 3/);
  assert.match(automatic, /结局后普通图策略\(data, m, '主动私聊'/);
  const privateFeed = ast.statements
    .find(item => ts.isFunctionDeclaration(item) && item.name?.text === '仅你可见动态')
    .getText(ast);
  assert.match(privateFeed, /读取私聊记忆上下文\(m, data, 库, 楼\)/);
  assert.match(privateFeed, /私聊记忆\.可知记忆/);
  const publicFeed = ast.statements
    .find(item => ts.isFunctionDeclaration(item) && item.name?.text === '朋友圈近期流')
    .getText(ast);
  assert.match(publicFeed, /库\.圈\.unshift\(条\)[\s\S]*条\.评 = await 结局日常动态评论/);
  assert.match(publicFeed, /if \(!时间线仍有效\(\)\) return '中止'/);
  assert.match(publicFeed, /结局后普通图策略\(data, m, '公开朋友圈'/);
});
