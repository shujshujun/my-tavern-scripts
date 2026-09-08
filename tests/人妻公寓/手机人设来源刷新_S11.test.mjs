/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const target = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/配置.ts');

function setup(t) {
  delete require.cache[target];
  const state = { primary: 'A', chat: 'chat-A', calls: 0, books: {
    A: [{ uid: 1, enabled: true, name: '夏乔', content: '  性格:喜欢把日常见闻讲成小故事。' }],
    B: [{ uid: 2, enabled: true, name: '夏乔', content: '  性格:习惯先问对方今天过得如何。' }],
  } };
  globalThis.getCharWorldbookNames = () => ({ primary: state.primary, additional: [] });
  globalThis.SillyTavern = { getCurrentChatId: () => state.chat };
  globalThis.getWorldbook = async name => { state.calls++; return structuredClone(state.books[name] ?? []); };
  t.mock.method(console, 'warn', () => {});
  return { state, 人设段: require('../../src/人妻公寓/脚本/游戏逻辑/手机/配置.ts').人设段 };
}

test('S11 同名角色切换主世界书后使用新来源', async t => {
  const { state, 人设段 } = setup(t);
  assert.match(await 人设段('101'), /小故事/);
  state.primary = 'B';
  assert.match(await 人设段('101'), /过得如何/);
});

test('S11 同一本世界书内容修订后下一次读取更新', async t => {
  const { state, 人设段 } = setup(t);
  await 人设段('101');
  state.books.A[0].content = '  性格:说话直接，喜欢具体的问题。';
  assert.match(await 人设段('101'), /具体的问题/);
});

test('S11 条目停用后不复用旧人设，再启用可恢复', async t => {
  const { state, 人设段 } = setup(t);
  await 人设段('101');
  state.books.A[0].enabled = false;
  assert.equal(await 人设段('101'), '');
  state.books.A[0].enabled = true;
  assert.match(await 人设段('101'), /小故事/);
});

test('S11 条目重命名或删除后不复用旧人设', async t => {
  const { state, 人设段 } = setup(t);
  await 人设段('101');
  state.books.A[0].name = '另一个角色';
  assert.equal(await 人设段('101'), '');
  state.books.A = [];
  assert.equal(await 人设段('101'), '');
});

test('S11 冷启动没有绑定世界书时不缓存空值', async t => {
  const { state, 人设段 } = setup(t);
  state.primary = undefined;
  assert.equal(await 人设段('101'), '');
  state.primary = 'A';
  assert.match(await 人设段('101'), /小故事/);
});

test('S11 读取失败后下一次可重试且不使用旧值', async t => {
  const { 人设段 } = setup(t);
  const good = globalThis.getWorldbook;
  globalThis.getWorldbook = async () => { throw new Error('temporary read failure'); };
  assert.equal(await 人设段('101'), '');
  globalThis.getWorldbook = good;
  assert.match(await 人设段('101'), /小故事/);
  globalThis.getWorldbook = async () => { throw new Error('second read failure'); };
  assert.equal(await 人设段('101'), '');
});

test('S11 空内容恢复后可读取，空来源不影响其他角色', async t => {
  const { state, 人设段 } = setup(t);
  state.books.A[0].content = '';
  assert.equal(await 人设段('101'), '');
  state.books.A.push({ uid: 3, enabled: true, name: '沈静仪', content: '  性格:谈话时认真倾听。' });
  assert.match(await 人设段('102'), /认真倾听/);
  state.books.A[0].content = '  性格:喜欢小故事。';
  assert.match(await 人设段('101'), /小故事/);
});

test('S11 世界书异步读取期间切聊天时旧请求不给新聊天带入人设', async t => {
  const { state, 人设段 } = setup(t);
  let resolve;
  globalThis.getWorldbook = () => new Promise(done => { resolve = done; });
  const pending = 人设段('101');
  state.chat = 'chat-B';
  resolve(structuredClone(state.books.A));
  assert.equal(await pending, '');
});

test('S11 旧来源迟到完成后不覆盖新来源，下次恢复旧来源也重新读', async t => {
  const { state, 人设段 } = setup(t);
  let resolve;
  globalThis.getWorldbook = name => name === 'A'
    ? new Promise(done => { resolve = done; }) : Promise.resolve(structuredClone(state.books.B));
  const old = 人设段('101');
  state.primary = 'B';
  assert.match(await 人设段('101'), /过得如何/);
  resolve(structuredClone(state.books.A));
  assert.equal(await old, '');
  assert.match(await 人设段('101'), /过得如何/);
  state.primary = 'A';
  globalThis.getWorldbook = async () => [{ ...state.books.A[0], content: '  性格:恢复后的新版本。' }];
  assert.match(await 人设段('101'), /新版本/);
});

test('S11 成功结果继续保留性格包装和3000字符节选，来源数据不变', async t => {
  const { state, 人设段 } = setup(t);
  state.books.A[0].content = '  外貌特征:\n    描述:一段外貌。\n  性格:\n    描述:' + '喜欢具体的日常话题。'.repeat(350);
  const before = structuredClone(state.books);
  const text = await 人设段('101');
  assert.match(text, /真实状态以状态数据为唯一权威/);
  assert.match(text, /喜欢具体/);
  assert.doesNotMatch(text, /一段外貌/);
  assert.match(text, /人设节选/);
  assert.ok(text.length < 3100);
  assert.deepEqual(state.books, before);
});

test('S11 绑定查询失败不阻断可选人设，恢复后再读', async t => {
  const { 人设段 } = setup(t);
  const good = globalThis.getCharWorldbookNames;
  globalThis.getCharWorldbookNames = () => { throw new Error('binding not ready'); };
  assert.equal(await 人设段('101'), '');
  globalThis.getCharWorldbookNames = good;
  assert.match(await 人设段('101'), /小故事/);
});
