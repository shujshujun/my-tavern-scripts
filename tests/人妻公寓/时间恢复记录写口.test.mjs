/* eslint-disable import-x/no-nodejs-modules -- Node-only storage protocol tests, no UI/engine imports */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json']; delete require.extensions['.json']; require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');
const { Schema } = require('../../src/人妻公寓/schema.ts');
const api = require('../../src/人妻公寓/脚本/游戏逻辑/时间撤销系统.ts');
const clone = value => structuredClone(value);
const key = api.时间推进事务键;

function fixture(reverse = false) {
  const source = Schema.parse({ 系统: { _绝对时段: reverse ? 6 : 5 } });
  const original = { _场景: { 房间id: '管理员室' }, _隔离事件: { 日志: ['source'] }, _微信: { 消息: [{ 发: '我', 文: 'source' }] } };
  const record = api.创建时间推进事务记录({
    聊天ID: 'owned-chat', 方向: reverse ? '撤销' : '推进', 锚楼: 1, 锚消息签名: 'owned-branch',
    推进前数据: source,
    推进前聊天: api.捕获精确聊天快照(original, reverse ? api.时间撤销写入聊天键 : api.时间推进事务恢复聊天键),
  });
  let vars = { ...clone(original), [key]: clone(record) };
  let data = clone(source);
  let valid = true;
  let before = () => {}, after = () => {};
  let updates = 0;
  const writer = api.创建时间事务写口(record, {
    校验归属: () => valid,
    更新聊天: async update => {
      updates++; before(updates);
      vars = clone(update(clone(vars)));
      after(updates);
    },
  });
  return {
    source, original, record, writer,
    get vars() { return vars; }, set vars(value) { vars = value; },
    get data() { return data; }, set data(value) { data = value; },
    get updates() { return updates; },
    invalidate() { valid = false; },
    hooks(pre = () => {}, post = () => {}) { before = pre; after = post; },
  };
}

for (const reverse of [false, true]) {
  test(`恢复记录：${reverse ? '反向' : '正向'}JSON往返保留数据、方向和原分支`, () => {
    const f = fixture(reverse);
    assert.deepEqual(api.读取时间推进事务记录(JSON.parse(JSON.stringify(f.record))), f.record);
    assert.equal(Object.hasOwn(f.record.推进前聊天, key), false, 'never nest recovery records into themselves');
  });
}

test('恢复记录：旧版无方向无锚的正向记录继续可读', () => {
  const f = fixture();
  delete f.record.方向; delete f.record.锚楼; delete f.record.锚消息签名;
  assert.deepEqual(api.读取时间推进事务记录(f.record), f.record);
  assert.deepEqual(api.读取时间事务恢复键(f.record), api.时间推进事务恢复聊天键);
});

for (const corrupt of [
  r => { r.方向 = 'unknown'; }, r => { r.锚楼 = -1; }, r => { r.锚楼 = 1.5; },
  r => { r.锚消息签名 = ''; }, r => { delete r.锚楼; }, r => { r.聊天已写 = 'yes'; },
  r => { delete r.聊天已写; },
  r => { delete r.推进前聊天._微信; }, r => { r.推进前数据.系统._绝对时段++; },
]) {
  test(`恢复记录：反向损坏字段失败关闭 ${String(corrupt)}`, () => {
    const f = fixture(true); corrupt(f.record);
    assert.equal(api.读取时间推进事务记录(f.record), null);
  });
}

test('恢复记录：反向记录必须保存完整手机备份及分支，不能套用正向子集', () => {
  const f = fixture();
  assert.throws(() => api.创建时间推进事务记录({ 聊天ID: 'owned', 方向: '撤销', 推进前数据: f.source, 推进前聊天: f.record.推进前聊天 }), /分支锚/);
  assert.throws(() => api.创建时间推进事务记录({ 聊天ID: 'owned', 方向: '撤销', 锚楼: 1, 锚消息签名: 'a', 推进前数据: f.source, 推进前聊天: f.record.推进前聊天 }), /快照不完整/);
});

test('恢复记录：未写聊天的撤销不能拿旧手机备份覆盖并发消息', () => {
  const f = fixture(true);
  assert.equal(api.读取时间事务恢复键(f.record).includes('_微信'), false);
  const newMessage = { 发: '我', 文: 'new input' };
  f.vars._微信.消息.push(newMessage);
  api.恢复精确聊天快照(f.vars, f.record.推进前聊天, api.读取时间事务恢复键(f.record));
  assert.deepEqual(f.vars._微信.消息.at(-1), newMessage);
  f.record.聊天已写 = true;
  assert.equal(api.读取时间事务恢复键(f.record).includes('_微信'), true);
});

test('恢复记录：同聊天同钟短时间重复创建仍有独立事务身份', () => {
  const f = fixture();
  const other = api.创建时间推进事务记录({ 聊天ID: 'owned-chat', 推进前数据: f.source, 推进前聊天: f.record.推进前聊天 });
  assert.notEqual(other.事务ID, f.record.事务ID);
});

for (const stage of ['core-before', 'core-after', 'chat-before', 'chat-after', 'cleanup-before', 'cleanup-after']) {
  test(`双存储协议：${stage}异常原样传播，归属重建先于补偿`, async () => {
    const f = fixture();
    const error = new Error(stage);
    let fault = true, coreRollbacks = 0;
    const fail = at => { if (stage === at && fault) { fault = false; throw error; } };
    f.hooks(() => fail('cleanup-before'), () => fail('cleanup-after'));
    await assert.rejects(() => api.执行时间推进双存储提交({
      写推进状态: () => { fail('core-before'); f.data.系统._绝对时段 = 6; fail('core-after'); },
      写撤销点: () => { fail('chat-before'); f.vars._隔离事件.日志.push('new'); fail('chat-after'); },
      提交完成: f.writer.清理, 准备补偿: f.writer.准备补偿, 补偿完成: f.writer.清理,
      恢复推进前状态: () => { f.writer.校验(f.vars); coreRollbacks++; f.data = clone(f.source); },
      恢复推进前聊天: () => { f.writer.校验(f.vars); api.恢复精确聊天快照(f.vars, f.record.推进前聊天); },
    }), candidate => candidate === error);
    assert.equal(coreRollbacks, 1);
    assert.deepEqual(f.data, f.source);
    assert.deepEqual(f.vars, f.original);
  });
}

test('双存储协议：核心补偿失败后仍尝试聊天补偿，但不能删除恢复记录', async () => {
  const f = fixture(); let restoredChat = false, cleaned = false;
  await assert.rejects(() => api.执行时间推进双存储提交({
    写推进状态: () => { f.data.系统._绝对时段 = 6; },
    写撤销点: () => { throw new Error('primary'); },
    准备补偿: f.writer.准备补偿,
    恢复推进前状态: () => { throw new Error('rollback-core'); },
    恢复推进前聊天: () => { restoredChat = true; api.恢复精确聊天快照(f.vars, f.record.推进前聊天); },
    补偿完成: () => { cleaned = true; },
  }), /primary.*MVU 回滚失败:rollback-core/);
  assert.equal(restoredChat, true); assert.equal(cleaned, false);
  assert.ok(api.读取时间推进事务记录(f.vars[key]));
});

test('双存储协议：聊天补偿失败同样保留记录，错误不被清理覆盖', async () => {
  const f = fixture();
  await assert.rejects(() => api.执行时间推进双存储提交({
    写推进状态: () => { throw new Error('primary'); },
    写撤销点: () => {}, 准备补偿: f.writer.准备补偿, 补偿完成: f.writer.清理,
    恢复推进前状态: () => { f.data = clone(f.source); },
    恢复推进前聊天: () => { throw new Error('rollback-chat'); },
  }), /primary.*聊天回滚失败:rollback-chat/);
  assert.ok(f.vars[key]);
});

for (const change of ['missing', 'foreign', 'same-id-different-origin', 'timeline']) {
  test(`写口保护：${change}不能借旧请求恢复或清除其他状态`, async () => {
    const f = fixture(); let core = 0, chat = 0;
    if (change === 'missing') delete f.vars[key];
    if (change === 'foreign') f.vars[key].事务ID = 'another';
    if (change === 'same-id-different-origin') f.vars[key].聊天ID = 'another';
    if (change === 'timeline') f.invalidate();
    const before = clone(f.vars);
    await assert.rejects(() => api.执行时间推进双存储提交({
      写推进状态: () => { throw new Error('primary'); }, 写撤销点: () => {}, 准备补偿: f.writer.准备补偿,
      恢复推进前状态: () => { core++; }, 恢复推进前聊天: () => { chat++; },
    }), /补偿准备失败/);
    assert.equal(core, 0); assert.equal(chat, 0); assert.deepEqual(f.vars, before);
  });
}

test('写口保护：即使亲自清理过，后续玩家操作改变状态也不能凭缺记录重建', async () => {
  const f = fixture(); await f.writer.清理();
  f.vars._微信.消息.push({ 发: '我', 文: 'later action' });
  const before = clone(f.vars);
  await assert.rejects(() => f.writer.准备补偿(), /可证明归属/);
  assert.deepEqual(f.vars, before);
});

test('写口保护：清理排队期间失去时间线，不执行迟到删除', async () => {
  const f = fixture(); f.hooks(() => f.invalidate());
  await assert.rejects(() => f.writer.清理(), /分支锚/);
  assert.ok(f.vars[key]);
});

test('双存储协议：正常顺序保持核心、聊天、记录清理，不运行补偿', async () => {
  const f = fixture(); const steps = [];
  await api.执行时间推进双存储提交({
    写推进状态: () => { steps.push('core'); }, 写撤销点: () => { steps.push('chat'); },
    提交完成: async () => { steps.push('cleanup'); await f.writer.清理(); },
    恢复推进前状态: () => { assert.fail('unexpected rollback'); }, 恢复推进前聊天: () => { assert.fail('unexpected rollback'); },
  });
  assert.deepEqual(steps, ['core', 'chat', 'cleanup']); assert.equal(Object.hasOwn(f.vars, key), false);
});
