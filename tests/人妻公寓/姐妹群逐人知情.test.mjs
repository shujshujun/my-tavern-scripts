/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const { 构建姐妹群逐人知情 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群公开事实.ts');
const { 解析姐妹群阶段回复 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群阶段验收.ts');
const row = (文, extra = {}) => ({ 楼: 5, 时: 20, 会话: '姐妹群', 发: '对方', 文, ...extra });
const photo = row('安若妍:换好的照片已经放进相框。', {
  类: '照片',
  键: '301结局:换照:姐妹群照片',
  接收门牌: ['101', '301'],
  序: 1,
});
const mother = row('母亲:我和管理员不只是母子关系。', {
  键: '回国茶话会:坦白:batch:0:1',
  接收门牌: ['101', '302'],
  序: 2,
});
const parse = (text, messages, options = {}, members = ['101', '201', '301', '302']) =>
  解析姐妹群阶段回复(text, members, messages, 5, 20, '玩家', false, options);

test('同一公开消息逐人授予见闻，当前资格与他人完成状态不能代替实际接收', () => {
  const views = 构建姐妹群逐人知情(['101', '201', '301', '302'], [photo, mother], 5, 20);
  const byDoor = Object.fromEntries(views.map(view => [view.门牌, view.本人已经收到的公开事实]));
  assert.equal(byDoor['101'].安若妍换照已公开, true);
  assert.equal(byDoor['101'].母亲关系已公开, true);
  assert.equal(byDoor['201'].安若妍换照已公开, false);
  assert.equal(byDoor['201'].母亲关系已公开, false);
  assert.equal(byDoor['302'].安若妍换照已公开, false);
  assert.equal(byDoor['302'].母亲关系已公开, true);
  assert.equal(构建姐妹群逐人知情(['101'], [photo], 4, 20)[0].本人已经收到的公开事实.安若妍换照已公开, false);
});

test('普通换照话题仅由收到照片的成员接续，后来入群或撤回原图不会获得照片权限', () => {
  const line = '许曼君:安若妍，这张裸照真的放进相框了？';
  assert.equal(parse(line, [photo]), null);
  assert.ok(parse(line, [{ ...photo, 接收门牌: ['201', '301'] }]));
  assert.equal(parse(line, [{ ...photo, 类: '撤回', 接收门牌: ['201'] }]), null);
  assert.equal(parse(line, [{ ...photo, 会话: '301', 接收门牌: ['201'] }]), null);
});

test('已经坦白的母亲关系可以继续谈，相关权限不扩展为其他人的自述或父亲知情', () => {
  const line = '许曼君:母亲和管理员是情人，这个说法我记得。';
  assert.equal(parse(line, [mother]), null);
  const received = [{ ...mother, 接收门牌: ['201', '302'] }];
  assert.ok(parse(line, received));
  assert.equal(parse('许曼君:母亲是管理员的情人，我也是他的情人。', received), null);
  assert.equal(parse('母亲:他爸已经知道我和管理员的关系了。', received), null);
});

test('玩家真实提起的话题可回应；只提名字与私聊原话不能替代群内实际告知', () => {
  const question = row('听说陆嘉明已经接受三人家庭了？', { 发: '我', 接收门牌: ['201'], 标识: 'p', 序: 3 });
  const answer = '许曼君:你说陆嘉明已经接受和管理员的家庭安排了？';
  assert.ok(parse(answer, [question]));
  assert.equal(parse(answer, [{ ...question, 文: '夏乔今天买了一件衣服。' }]), null);
  assert.equal(parse(answer, [{ ...question, 会话: '101' }]), null);
  assert.equal(parse(answer, [{ ...question, 接收门牌: ['101'] }]), null);
  assert.equal(
    构建姐妹群逐人知情(['201'], [question], 5, 20)[0].本人已经收到的公开事实.借种家庭结构已公开,
    false,
    '讨论说法不签发世界公开级',
  );
});

test('引用先按本人真实见闻验证，历史引文不被当作本次泄露；未知、撤回和跨会话引用被拒绝', () => {
  const message = row('我提到了私聊记录，但还没有给大家看。', { 发: '我', 接收门牌: ['201'], 标识: 'p', 序: 4 });
  const reply = '许曼君:「引用 玩家: 我提到了私聊记录，但还没有给大家看。」我听到了，你继续说。';
  assert.deepEqual(parse(reply, [message]), { 发言人: '许曼君', 正文: '我听到了，你继续说。', 引用: { 标识: 'p' } });
  assert.equal(parse(reply, [{ ...message, 接收门牌: ['101'] }]), null);
  assert.equal(parse(reply, [{ ...message, 类: '撤回', 文: '' }]), null);
  assert.equal(parse(reply, [{ ...message, 会话: '101' }]), null);
  assert.equal(parse(reply, [message], {}, ['101']), null, '知道历史也不等于当前有发言资格');
});

test('真实孕产官宣使用本轮硬事实授权，普通拍不能提前宣布，验收不自行落库', () => {
  const line = '夏乔:我丈夫已经接受和管理员的家庭安排。';
  const messages = [];
  assert.equal(parse(line, messages), null);
  assert.ok(parse(line, messages, { 借种家庭结构已公开: true }));
  assert.deepEqual(messages, []);
  assert.equal(构建姐妹群逐人知情(['101'], messages, 5, 20)[0].本人已经收到的公开事实.借种家庭结构已公开, false);
});
