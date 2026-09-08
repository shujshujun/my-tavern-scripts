/* eslint-disable import-x/no-nodejs-modules -- Node-only history projection tests */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
globalThis._ = lodash;
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 构造302自由阶段聊天历史, 应用302自由阶段历史到原生请求 } = require('../../src/人妻公寓/脚本/游戏逻辑/302共居系统.ts');

function setup() {
  const data = Schema.parse({ 户: { 302: 创建户节点(4) }, 系统: {
    _双重继承: { 阶段: '已完成', 完成楼层: 10 }, _已完成特殊场景: ['双重继承'],
  } });
  const messages = Array.from({ length: 81 }, (_, i) => ({
    message_id: i, role: i % 2 ? 'user' : 'assistant', is_hidden: false,
    message: i <= 10 ? `封存前记录${i}` : i === 20 ? '本场起点：先把上次的安排说清楚。' : `本场连续记录${i}`,
  }));
  globalThis.getLastMessageId = () => messages.length - 1;
  globalThis.getChatMessages = (range, options) => {
    assert.equal(options.hide_state, 'unhidden');
    assert.equal(options.include_swipes, false);
    const [start, end] = range.split('-').map(Number);
    return structuredClone(messages.filter(m => m.message_id >= start && m.message_id <= end && !m.is_hidden));
  };
  return { data, messages };
}

for (const kind of ['普通持续场景', '专用场景', '剧情事务']) {
  test(`S04 ${kind}期间持续封存旧章节并保留超过24条的当前场景`, () => {
    const { data, messages } = setup();
    if (kind === '普通持续场景') Object.assign(data.系统._性爱场景, { 状态: '进行中', 开始楼层: 20 });
    if (kind === '专用场景') Object.assign(data.系统._特殊场景, { id: '场景测试', 启动楼层: 20 });
    if (kind === '剧情事务') Object.assign(data.系统._场景剧情事务, { id: 'current-scene', 触发楼层: 20 });
    const before = structuredClone({ data, messages });
    const result = 构造302自由阶段聊天历史(data, '302');
    assert.ok(result, '活动场景不应撤销已确认的历史封存');
    assert.equal(result.some(m => m.content.includes('封存前记录')), false);
    assert.ok(result.some(m => m.content.includes('本场起点')));
    assert.ok(result.some(m => m.content.includes('本场连续记录80')));
    assert.deepEqual({ data, messages }, before);
  });
}

test('S04 单个待发送事件和待接电话不解除已结束章节封存', () => {
  const { data } = setup();
  data.系统._待发送事件 = '稍后安排一个新事件。';
  data.系统._待接来电.期 = 15;
  const result = 构造302自由阶段聊天历史(data, '302');
  assert.ok(result);
  assert.equal(result.length, 25);
  assert.equal(result.some(m => m.content.includes('封存前记录')), false);
});

test('S04 活动场景缺起点时保留全部可证结局后历史', () => {
  const { data } = setup();
  data.系统._场景剧情事务.id = 'legacy-without-start';
  const result = 构造302自由阶段聊天历史(data, '302');
  assert.ok(result);
  assert.ok(result.some(m => m.content.includes('本场连续记录11')));
});

test('S04 旧档缺完成楼且处于活动场景时保留原历史选择', () => {
  const { data } = setup();
  data.系统._双重继承.完成楼层 = -1;
  data.系统._场景剧情事务.id = 'legacy-scene';
  assert.equal(构造302自由阶段聊天历史(data, '302'), null);
});

test('S04 活动场景始于封存边界之前时保留原历史选择', () => {
  const { data } = setup();
  Object.assign(data.系统._场景剧情事务, { id: 'overlap', 触发楼层: 8 });
  assert.equal(构造302自由阶段聊天历史(data, '302'), null);
});

test('S04 场景结束后恢复既有24条窗口，旧档空闲仍保持12条回退', () => {
  const { data } = setup();
  assert.equal(构造302自由阶段聊天历史(data, '302').length, 25);
  data.系统._双重继承.完成楼层 = -1;
  assert.equal(构造302自由阶段聊天历史(data, '302').length, 13);
});

test('S04 原生请求替换保留当前玩家消息、系统消息和活动场景开头', () => {
  const { data, messages } = setup();
  Object.assign(data.系统._特殊场景, { id: 'current', 启动楼层: 20 });
  const current = { role: 'user', content: '本次唯一新行动。', attachment: 'preserve' };
  const system = { role: 'system', content: '既有场景规则。' };
  const chat = [system, ...messages.map(m => ({ role: m.role, content: m.message })), current];
  assert.equal(应用302自由阶段历史到原生请求(data, '302', chat), true);
  assert.equal(chat.filter(m => m === current).length, 1);
  assert.ok(chat.includes(system));
  assert.ok(chat.some(m => String(m.content).includes('本场起点')));
  assert.equal(chat.some(m => String(m.content).includes('封存前记录')), false);
});

test('S04 回档到结局前、其他地点及坏结局保持原路', () => {
  const { data } = setup();
  assert.equal(构造302自由阶段聊天历史(data, '101'), null);
  data.系统._坏结局 = '考核失败';
  assert.equal(构造302自由阶段聊天历史(data, '302'), null);
  data.系统._坏结局 = '';
  data.系统._已完成特殊场景 = [];
  data.系统._双重继承.阶段 = '未开始';
  assert.equal(构造302自由阶段聊天历史(data, '302'), null);
});

test('S04 隐藏楼和机器输出保持既有净化语义', () => {
  const { data, messages } = setup();
  Object.assign(data.系统._场景剧情事务, { id: 'current', 触发楼层: 20 });
  messages[21].is_hidden = true;
  messages[22].message += '<BianLiang>private-data</BianLiang>';
  const result = 构造302自由阶段聊天历史(data, '302');
  assert.ok(result);
  assert.equal(result.some(m => m.content.includes('本场连续记录21')), false);
  assert.equal(result.some(m => m.content.includes('private-data')), false);
});

test('S04 空内容不占最近24条有效历史的席位', () => {
  const { data, messages } = setup();
  for (let i = 70; i < 81; i++) messages[i].message = '<BianLiang>[]</BianLiang>';
  const result = 构造302自由阶段聊天历史(data, '302');
  assert.equal(result.length, 25);
  assert.ok(result.some(m => m.content.includes('本场连续记录46')));
});
