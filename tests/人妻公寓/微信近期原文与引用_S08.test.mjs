/* eslint-disable import-x/no-nodejs-modules -- Full memory compiler with external database reads adapted */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHost } from './helpers/微信事务恢复环境.mjs';

function setup() {
  const e = createHost();
  // 数据库读取可用，当前没有历史摘要；本测试检查近期输入与引用，不验证数据库持久I/O。
  e.adapt('数据库桥.ts', {
    读取数据库记忆胶囊: () => '', 读取微信进展摘要: () => null, 读取微信进展胶囊: () => '',
    规范微信进展数据: value => value,
  });
  e.adapt('手机/摘要系统.ts', {
    当前群聊摘要引用: () => 'current-group', 当前微信摘要引用: () => 'current-chat',
    有效楼务任务id集合: () => new Set(), 读取角色群聊见闻胶囊: () => '', 读取会话撤回摘要来源: () => new Set(),
    读取私聊待同步进展: () => '',
  });
  e.memory = e.load('手机/微信记忆上下文.ts');
  e.quote = e.load('微信消息引用.ts');
  e.group = e.load('手机/姐妹群阶段验收.ts');
  e.data = e.st.chat.at(-1).stat_data;
  return e;
}
const msg = (文, 会话 = '姐妹群', rest = {}) => ({
  楼: 4, 时: 20, 会话, 发: '我', 文, 序: 1, 标识: 'original-1', 接收门牌: ['101', '102'], ...rest,
});
function compile(e, messages, room) {
  const db = { 消息: messages, 圈: [] };
  return room === '101'
    ? e.memory.读取私聊记忆上下文('101', e.data, db, 4, { 包含见证正文: false })
    : e.memory.读取群聊记忆上下文(room, db, 4, ['101', '102']);
}

for (const room of ['101', '群', '姐妹群']) {
  test(`S08 ${room}超过220字符的合法近期原文保留发言人、否定与完整句子`, () => {
    const e = setup();
    const text = '不要取消周五的约定。' + '接下来只是一些普通的日常说明。'.repeat(18) + '我会按时过来。';
    const message = msg(text, room);
    const before = structuredClone(message);
    const context = compile(e, [message], room);
    assert.ok(context.最近聊天.includes(`林舟:${text}`), '近期原文被截成尾部片段，发言人或句首语义丢失');
    const reply = e.quote.解析微信AI引用前缀(`「引用 林舟: ${text}」我记下了。`, context.近期消息, room, '林舟', '夏乔');
    assert.deepEqual(reply?.引用, { 标识: 'original-1' });
    assert.deepEqual(message, before);
  });
}

test('S08 姐妹群的已知接收者附注与完整原文同时保留', () => {
  const e = setup();
  const text = '不是今天，我说的是下周。' + '下面是一些具体的安排。'.repeat(22);
  const context = compile(e, [msg(text)], '姐妹群');
  assert.ok(context.最近聊天.includes(`林舟:${text}`));
  assert.ok(context.最近聊天.includes('已知接收者：夏乔、沈静仪'));
  const result = e.group.解析姐妹群阶段回复(`夏乔:「引用 林舟: ${text}」那我先记下。`, ['101', '102'], context.近期消息, 4, 20, '林舟', false);
  assert.deepEqual(result?.引用, { 标识: 'original-1' });
});

test('S08 预算内按整条近期原文选择，预算之外不留下没有开头的片段', () => {
  const e = setup();
  const messages = Array.from({ length: 32 }, (_, i) => msg(`第${i}条：` + '日常安排需要先核实。'.repeat(22), '姐妹群', { 序: i + 1, 标识: `m-${i}` }));
  const before = structuredClone(messages);
  const context = compile(e, messages, '姐妹群');
  assert.ok(context.最近聊天.length <= 3200);
  const lines = context.最近聊天.split('\n');
  assert.ok(lines.length > 0);
  for (const line of lines) {
    assert.ok(line.startsWith('林舟:第'), '不能截掉来源标签');
    assert.ok(messages.some(m => line.includes(m.文)), '选中的消息须保留整个正文');
  }
  assert.ok(context.最近聊天.includes('第31条：'));
  assert.deepEqual(messages, before);
});

test('S08 单条超出既有预算时不把尾部伪装成原文，原库保持完整', () => {
  const e = setup();
  const text = '不应当只看尾部。' + '完整记录。'.repeat(800);
  const message = msg(text, '101');
  const context = compile(e, [message], '101');
  assert.equal(context.最近聊天, '');
  assert.equal(context.近期消息[0].文, text);
  assert.equal(message.文, text);
});

test('S08 当前姐妹群消费者已允许第6条已知原文，仍拒绝跨会话和未接收来源', () => {
  const e = setup();
  const messages = Array.from({ length: 32 }, (_, i) => msg(`第${i + 1}条日常消息。`, '姐妹群', { 序: i + 1, 标识: `m-${i + 1}` }));
  const context = compile(e, messages, '姐妹群');
  assert.ok(context.最近聊天.includes(messages[5].文));
  assert.deepEqual(e.group.解析姐妹群阶段回复('夏乔:「引用 林舟: 第6条日常消息。」我也记住了。', ['101'], messages, 4, 20, '林舟', false)?.引用, { 标识: 'm-6' });
  messages[5].接收门牌 = ['102'];
  assert.equal(e.group.解析姐妹群阶段回复('夏乔:「引用 林舟: 第6条日常消息。」我也记住了。', ['101'], messages, 4, 20, '林舟', false), null);
  messages[5].会话 = '群';
  assert.equal(e.group.解析姐妹群阶段回复('夏乔:「引用 林舟: 第6条日常消息。」我也记住了。', ['101'], messages, 4, 20, '林舟', false), null);
});

test('S08 撤回源不回流，当前短消息不受影响', () => {
  const e = setup();
  const messages = [msg('这句已经撤回。', '101', { 类: '撤回' }), msg('现在只聊今天。', '101', { 序: 2, 标识: 'current' })];
  const context = compile(e, messages, '101');
  assert.equal(context.最近聊天.includes('这句已经撤回'), false);
  assert.ok(context.最近聊天.includes('林舟:现在只聊今天。'));
});
