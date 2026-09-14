/* eslint-disable import-x/no-nodejs-modules -- 生产协议单元测试；观察模型为显式测试替身。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import lodash from 'lodash';
globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const p = require('../../src/人妻公寓/脚本/游戏逻辑/自然对话观察.ts');
const wire = require('../../src/人妻公寓/脚本/游戏逻辑/自然对话接入.ts');
const { Schema } = require('../../src/人妻公寓/schema.ts');

test('最终观察不读取思考块；工具最终 content 和普通最终正文均可解析', () => {
  const r = request(), a = answer(r), block = '<自然观察>' + JSON.stringify(a) + '</自然观察>';
  assert.equal(p.分离自然对话观察('<think>' + block + '</think>只有正文').观察, null);
  assert.equal(p.分离自然对话观察('<analysis>' + block).观察, null);
  assert.deepEqual(p.分离自然对话观察('<think>草稿</think>' + block).观察, a);
  assert.equal(wire.最终观察文本({ reasoning_content: block }), '');
  assert.equal(wire.最终观察文本({ content: '', tool_calls: [{ function: { arguments: JSON.stringify({ content: block }) } }] }), block);
  assert.equal(wire.最终观察文本({ content: block }), block);
  assert.equal(wire.最终观察文本({ content: '工具调用前的说明', tool_calls: [{ function: { arguments: JSON.stringify({ content: block }) } }] }), block);
});

test('旧存档缺失观察字段仍可读取；损坏的手动提交上下文不能用于提交', () => {
  const data = Schema.parse({});
  assert.equal(wire.读取自然对话记录(data), null);
  const r = request(), record = p.新建对话观察记录(r, answer(r));
  record.提交上下文 = { 楼层: -4 };
  wire.保存自然对话记录(data, record);
  assert.equal(wire.读取自然对话记录(data).提交上下文, undefined);
});

function request(category = '分居') {
  return { 版本: 1, 类别: category, 事件: 'event', 阶段: 'stage1', 分支: 'chat:branch1', 批次: 'batch1',
    要求: '确定两人已经把书放回书架。',
    消息: [
      { id: 'batch1:player', 来源: '玩家', 文本: '我把最后那册递给你，空出来的位置刚好够用。' },
      { id: 'batch1:assistant', 来源: '正文', 文本: '她接过书，放进书架上的空位。' },
    ] };
}
function ref(r, i = 1) { const m = r.消息[i]; return { 消息: m.id, 起: 0, 止: m.文本.length, 原文: m.文本 }; }
function answer(r, extra = {}) {
  return { 版本: 1, 事件: r.事件, 阶段: r.阶段, 分支: r.分支, 批次: r.批次,
    状态: '完成', 意向: '未明确', 依据: [ref(r, r.类别 === '冷落安抚' ? 0 : 1)], 意向依据: [], 选择: {}, 已谈主题: ['整理书架'], ...extra };
}

for (const category of p.自然对话类别) {
  test(`${category}：生产观察协议接受有依据结果，不要求问号或固定用词`, () => {
    const r = request(category), result = answer(r);
    assert.ok(p.自然对话可提交(p.新建对话观察记录(r, result)));
    assert.equal(r.消息.some(m => /[？?]/u.test(m.文本)), false);
  });
  test(`${category}：未决、暂缓、拒绝及转题保持待续`, () => {
    const r = request(category);
    for (const intent of ['未明确', '暂缓', '拒绝', '转题']) {
      const record = p.新建对话观察记录(r, answer(r, { 状态: '待续', 意向: intent,
        意向依据: intent === '未明确' ? [] : [ref(r, 0)] }));
      assert.equal(record.技术状态, '已识别');
      assert.equal(p.自然对话可提交(record), false);
    }
  });
}

test('引用不得伪造、越界，观察不得串事件/阶段/分支/批次', () => {
  const r = request(), a = answer(r);
  for (const key of ['事件', '阶段', '分支', '批次']) assert.equal(p.校验自然对话观察({ ...a, [key]: 'other' }, r), null);
  for (const bad of [{ 起: -1 }, { 止: 999 }, { 原文: '没有发生的事' }, { 消息: 'other' }, { 起: 0.5 }])
    assert.equal(p.校验自然对话观察({ ...a, 依据: [{ ...ref(r), ...bad }] }, r), null);
});

test('角色发言和上批玩家发言不能代替本批玩家决定', () => {
  const r = request();
  r.选择项 = { 参与: ['到场', '不到场'] };
  const choose = (quote) => answer(r, { 选择: { 参与: { 值: '到场', 依据: [quote] } } });
  assert.equal(p.校验自然对话观察(choose(ref(r)), r), null);
  r.消息.push({ id: 'old:player', 来源: '玩家', 文本: '我会过去。' });
  assert.equal(p.校验自然对话观察(choose(ref(r, 2)), r), null);
  assert.ok(p.校验自然对话观察(choose(ref(r, 0)), r));
  assert.equal(p.校验自然对话观察(answer(r), r), null);
});

test('退出关系是可保存的选择，不被笼统拒绝意向吞掉', () => {
  const r = request(); r.选择项 = { 最终关系选择: ['退出关系', '继续关系', '未决定'] };
  const value = answer(r, { 意向: '拒绝', 意向依据: [ref(r, 0)], 选择: { 最终关系选择: { 值: '退出关系', 依据: [ref(r, 0)] } } });
  assert.ok(p.自然对话可提交(p.新建对话观察记录(r, value)));
  value.选择.最终关系选择.值 = '未决定';
  assert.equal(p.校验自然对话观察(value, r), null);
});

test('缺标记自动只补一次，格式失败可手动重试；双击合并', async () => {
  const r = request(), state = p.新建对话观察记录(r);
  let calls = 0;
  await p.识别已保存对话(state, async () => { calls++; return {}; }, () => true);
  assert.equal(state.技术状态, '待重试');
  await p.识别已保存对话(state, async () => { calls++; return answer(r); }, () => true);
  assert.equal(calls, 1);
  let finish;
  const observer = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const first = p.识别已保存对话(state, observer, () => true, { 手动: true });
  const second = p.识别已保存对话(state, observer, () => true, { 手动: true });
  assert.equal(first, second);
  await Promise.resolve(); finish(answer(r)); await first;
  assert.equal(calls, 2); assert.ok(p.自然对话可提交(state));
});

test('同步异常也释放识别租约，不能把已完成 Promise 永久留在锁中', async () => {
  const r = request(), state = p.新建对话观察记录(r);
  await p.识别已保存对话(state, () => { throw new Error('fail'); }, () => true);
  await p.识别已保存对话(state, async () => answer(r), () => true, { 手动: true });
  assert.ok(p.自然对话可提交(state));
});

test('超时后不提交迟到结果，刷新中断不会自动再请求', async () => {
  const r = request(), state = p.新建对话观察记录(r);
  let finish, signal;
  await p.识别已保存对话(state, (_, s) => { signal = s; return new Promise(resolve => { finish = resolve; }); }, () => true, { 超时: 5 });
  assert.equal(signal.aborted, true); assert.equal(state.技术状态, '待重试');
  finish(answer(r)); await Promise.resolve(); assert.equal(state.结果, null);
  const restored = p.恢复对话观察记录({ ...state, 技术状态: '识别中' });
  let calls = 0;
  await p.识别已保存对话(restored, async () => { calls++; return answer(r); }, () => true);
  assert.equal(calls, 0);
});

test('新消息、回档或换分支导致租约失效时丢弃观察', async () => {
  const r = request(), state = p.新建对话观察记录(r);
  let current = true, finish;
  const work = p.识别已保存对话(state, () => new Promise(resolve => { finish = resolve; }), () => current);
  await Promise.resolve(); current = false; finish(answer(r)); await work;
  assert.equal(state.结果, null); assert.equal(p.自然对话可提交(state), false);
});

test('损坏或重复协议只移除协议，保留完整可见正文', () => {
  assert.equal(p.分离自然对话观察('你好。<自然观察>{broken</自然观察>').正文, '你好。');
  assert.equal(p.分离自然对话观察('你好。<自然观察>{}</自然观察><自然观察>{}</自然观察>').观察, null);
  assert.equal(p.分离自然对话观察('你好。<自然观察>{').正文, '你好。');
});

test('旧存档补空；六类场景标记接入同一生产请求，未观察不能提交', () => {
  const data = Schema.parse({});
  assert.equal(data.系统._自然对话记录, '');
  for (const marker of ['许曼君分居提交', '许曼君离婚提交', '许曼君离婚后日常提交', '双重继承提交', '安若妍不必停提交', '不再留门提交']) {
    const event = `【${marker}:test:1】`;
    const req = wire.构造自然场景请求(data, event, '请接一下这本书。', '她把书放回原位。', 'chat', 'batch');
    assert.ok(req);
    assert.equal(wire.本轮自然事件可提交(data, event), false);
    wire.保存自然对话记录(data, p.新建对话观察记录(req, answer(req)));
    assert.equal(wire.本轮自然事件可提交(Schema.parse(data), event), true);
  }
});

test('待续保留队列、进度和已成立事实，后续消息保留当前事件历史', () => {
  const data = Schema.parse({});
  const event = '【许曼君分居提交:第一幕初谈:3】';
  Object.assign(data.系统._场景剧情事务, { id: 'scene', 内容: event, 状态: '生成中' });
  data.系统._待发送事件 = event;
  const before = structuredClone(data.系统._许曼君分居);
  const req = wire.构造自然场景请求(data, event, '刚才那杯茶放在哪了。', '茶还放在桌子上。', 'chat', 'batch1');
  wire.保存自然对话记录(data, p.新建对话观察记录(req, answer(req, { 状态: '待续' })));
  wire.保留自然剧情待续(data, event);
  assert.equal(data.系统._场景剧情事务.状态, '待续');
  assert.equal(data.系统._待发送事件, event);
  assert.deepEqual(data.系统._许曼君分居, before);
  assert.equal(wire.构造自然场景请求(data, event, '我听着。', '她继续讲。', 'chat', 'batch2').消息.length, 4);
  assert.equal(wire.构造自然场景请求(data, event, '我听着。', '她继续讲。', 'other', 'batch2').消息.length, 2);
});
