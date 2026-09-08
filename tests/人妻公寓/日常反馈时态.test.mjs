/* eslint-disable import-x/no-nodejs-modules -- PLAY-015：真实编译/通知桥/收据listener，外部存储隔离。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { daily, Schema, clone, harness, readSource, ast, select, functionText, execute, ts } from './helpers/许曼君日常验收环境.mjs';

const require = createRequire(import.meta.url);
const lease = require('../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts');
const h = harness();
const bridge = ast(readSource('手机/通知桥'));
const host = ast(readSource('index'));
const compile = execute(functionText(bridge, '编译许曼君离婚后日常手机通知'), daily, '编译许曼君离婚后日常手机通知');
const receiptEvent = '人妻公寓:许曼君离婚后日常反馈已送达';
const listener = select(host, n => ts.isExpressionStatement(n) && ts.isCallExpression(n.expression) &&
  n.expression.expression.getText(host) === 'eventOn' && n.expression.arguments[0]?.text === receiptEvent);
assert.equal(listener.length, 1);

async function completed(relation = '继续关系', index = 0, finishTime = 3) {
  const e = h.lifecycleHost(); e.state = h.fresh(relation, index);
  await e.click(relation === '退出关系' ? '只处理201房务' : '把决定留给她');
  e.state.系统._绝对时段 = finishTime;
  await e.click('把今天这件事做完');
  assert.deepEqual(e.outcome, [true, true], e.errors.map(String).join('\n'));
  return e;
}

// 冻结的修前模板不是产品函数替身；用于旧未发送票兼容和已发历史不改写的对照。
function legacy(theme, relation) {
  const boundary = relation === '退出关系' ? '房里的事按昨天说的边界来，别多想。'
    : relation === '暂不承诺' ? '昨天那件事我记你的好，不过咱们没说过的话，姐也不会替你补上。'
      : '昨天你在旁边，这件事办得确实顺。';
  if (theme === '给自己改衣服') return `昨天改的那件衣服我又试了一遍，袖口和衣摆都留着我自己喜欢的样子。${boundary}`;
  if (theme === '重排201') return `201昨天挪过以后顺手多了，空出来的位置我也没再替谁留着。${boundary}`;
  return `昨天留在明账里的那笔生活钱还在，我没再顺手挪回别人的账。${boundary}`;
}

function phone(e) {
  lease.作废当前手机时间线租约世代();
  const x = { id: 'A', stores: { A: { 消息: [] }, B: { 消息: [] } },
    receipts: [], errors: [], saves: 0, ackWrites: 0, writeOK: true, saveOK: true, ackSaveOK: true,
    beforeSave: null, ackQueue: Promise.resolve(), receive: null };
  const deps = {
    ...daily, ...lease,
    末楼: () => e.chat.length - 1, 取绝对时段: data => data.系统._绝对时段,
    当前手机绝对时段: () => e.state.系统._绝对时段, 当前聊天ID: () => x.id,
    SillyTavern: { get chat() { return e.chat; } },
    读库: () => x.stores[x.id], 读微信库: () => x.stores[x.id],
    编译许曼君离婚后日常手机通知: compile,
    编译管理任务微信通知: () => [], 编译怀孕微信通知: () => [],
    编译许曼君分居手机通知: () => [], 编译许曼君离婚手机通知: () => [],
    许曼君离婚邀请待发送: () => false, 许曼君离婚邀请消息键: 'unused-invitation',
    请求刷新手机红点() {}, 请求手机重绘() {}, 捕获保护快照() {},
    写库增量: async (delta, valid) => {
      if (!x.writeOK || !valid()) return false;
      const keys = new Set(x.stores[x.id].消息.map(item => item.键));
      for (const message of delta.新消息) if (!keys.has(message.键)) {
        x.stores[x.id].消息.push(clone(message)); keys.add(message.键);
      }
      return true;
    },
    立即持久保存手机聊天变量: async () => { x.saves++; if (x.beforeSave) await x.beforeSave(); return x.saveOK; },
    eventOn: (_name, fn) => { x.receive = fn; },
    eventEmit: (name, key) => { if (name === receiptEvent) { x.receipts.push(key); x.receive(key); } },
    // MVU I/O端口：回调操作独立候选，只有保存成功才替换持久状态；真实收据listener不替换。
    安全操作: fn => {
      x.ackQueue = x.ackQueue.then(() => fn({}, clone(e.state))).catch(error => { x.errors.push(String(error)); });
      return x.ackQueue;
    },
    脚本写入: async (_raw, data) => {
      if (!x.ackSaveOK) throw new Error('controlled MVU receipt-save failure');
      e.state = clone(data); x.ackWrites++;
    },
  };
  execute(listener[0].getText(host), deps, 'undefined');
  const sync = execute(functionText(bridge, '同步管理任务微信'), deps, '同步管理任务微信');
  x.sync = async () => { const result = await sync(e.state); await x.ackQueue; return result; };
  return x;
}

for (const relation of ['继续关系', '暂不承诺', '退出关系']) {
  for (const [index, theme] of daily.许曼君离婚后日常主题列表.entries()) {
    for (const delay of [1, 3, 25]) {
      test(`PLAY-015 真实D1/D2→${delay}时段后送达：${relation}/${theme}`, async () => {
        const e = await completed(relation, index), account = e.state.系统._许曼君离婚后日常;
        const pending = clone(account.待反馈事件[0]), history = clone(account.事件记录);
        assert.equal(pending.可发送时段, 4); assert.equal(account.下次可用时段, 9);
        assert.deepEqual(compile(e.state, 84, 3), [], '完成当时仍未到送达门');
        e.state.系统._绝对时段 = 3 + delay;
        const before = clone(e.state);
        const messages = compile(e.state, 84, 3 + delay);
        assert.equal(messages.length, 1); assert.equal(messages[0].键, pending.消息键);
        assert.equal(messages[0].楼, 84); assert.equal(messages[0].时, 3 + delay);
        assert.match(messages[0].文, /之前/u); assert.doesNotMatch(messages[0].文, /昨天|昨日|今天|明天/u);
        assert.deepEqual(e.state, before, '编译不得改时钟、历史、奖励、冷却或待办');
        const x = phone(e);
        assert.equal(await x.sync(), true); assert.equal(x.stores.A.消息.length, 1);
        assert.deepEqual(x.stores.A.消息[0], messages[0]); assert.equal(x.ackWrites, 1);
        assert.equal(e.state.系统._许曼君离婚后日常.待反馈事件.length, 0);
        assert.deepEqual(e.state.系统._许曼君离婚后日常.事件记录, history);
        assert.equal(e.state.系统._许曼君离婚后日常.累计次数, index + 1);
        assert.equal(await x.sync(), false); assert.equal(x.stores.A.消息.length, 1);
        assert.equal(x.receipts.length, 1);
      });
    }
    test(`PLAY-015 刷新旧未发送票且历史已裁剪：${relation}/${theme}`, async () => {
      const e = await completed(relation, index);
      e.state.系统._许曼君离婚后日常.待反馈事件[0].文案 = legacy(theme, relation);
      e.state.系统._许曼君离婚后日常.事件记录 = [];
      e.state.系统._绝对时段 = 28;
      e.state = Schema.parse(JSON.parse(JSON.stringify(e.state)));
      const before = clone(e.state), pending = e.state.系统._许曼君离婚后日常.待反馈事件[0];
      const result = daily.许曼君离婚后日常待发送反馈(e.state)[0];
      assert.match(result.文案, /之前/u); assert.doesNotMatch(result.文案, /昨天/u);
      assert.notEqual(result, pending); assert.equal(result.消息键, pending.消息键);
      assert.equal(result.可发送时段, pending.可发送时段); assert.deepEqual(e.state, before);
      const x = phone(e); assert.equal(await x.sync(), true);
      assert.equal(x.stores.A.消息[0].文, result.文案); assert.equal(x.ackWrites, 1);
    });
  }
}

for (const mode of ['写手机库失败', '手机持久化失败', '主状态回执保存失败', '保存中切聊', '保存中回档世代', '保存中时钟变化', '保存中swipe']) {
  test(`PLAY-015 ${mode}后保持原键重试，不伪造收据或重复气泡`, async () => {
    const e = await completed(); e.state.系统._绝对时段 = 4;
    const checkpoint = clone(e.state.系统._许曼君离婚后日常), x = phone(e);
    x.writeOK = mode !== '写手机库失败'; x.saveOK = mode !== '手机持久化失败';
    x.ackSaveOK = mode !== '主状态回执保存失败';
    x.beforeSave = async () => {
      if (mode === '保存中切聊') x.id = 'B';
      if (mode === '保存中回档世代') lease.作废当前手机时间线租约世代();
      if (mode === '保存中时钟变化') e.state.系统._绝对时段 = 10;
      if (mode === '保存中swipe') e.chat.at(-1).swipe_id = 1;
    };
    await x.sync();
    assert.deepEqual(e.state.系统._许曼君离婚后日常, checkpoint);
    assert.equal(x.receipts.length, mode === '主状态回执保存失败' ? 1 : 0);
    assert.equal(x.ackWrites, 0); assert.deepEqual(x.stores.B.消息, []);
    x.id = 'A'; x.writeOK = true; x.saveOK = true; x.ackSaveOK = true; x.beforeSave = null;
    e.chat.at(-1).swipe_id = 0; e.state.系统._绝对时段 = 28;
    await x.sync();
    assert.equal(x.stores.A.消息.length, 1); assert.equal(x.ackWrites, 1);
    assert.equal(x.stores.A.消息[0].键, checkpoint.待反馈事件[0].消息键);
    assert.match(x.stores.A.消息[0].文, /之前/u); assert.equal(e.state.系统._许曼君离婚后日常.待反馈事件.length, 0);
    assert.equal(e.state.系统._许曼君离婚后日常.生活整备可用, true);
    assert.equal(await x.sync(), false); assert.equal(x.stores.A.消息.length, 1);
  });
}

test('PLAY-015 已送达旧气泡不重写，未知自定义待发文本不做日期猜测', async () => {
  const e = await completed(), theme = daily.许曼君离婚后日常主题列表[0];
  const pending = e.state.系统._许曼君离婚后日常.待反馈事件[0];
  pending.文案 = legacy(theme, '继续关系'); e.state.系统._绝对时段 = 28;
  const x = phone(e);
  const delivered = { 楼: 84, 时: 4, 会话: '201', 发: '对方', 类: '文本', 键: pending.消息键, 文: pending.文案 };
  x.stores.A.消息.push(clone(delivered));
  assert.equal(await x.sync(), false); assert.deepEqual(x.stores.A.消息, [delivered]);
  assert.equal(x.ackWrites, 1);
  const custom = { ...pending, 消息键: 'custom-pending', 文案: '昨天收到那本书，今天只是请你核对201的水费。' };
  e.state.系统._许曼君离婚后日常.待反馈事件.push(custom);
  assert.equal(daily.许曼君离婚后日常待发送反馈(e.state)[0].文案, custom.文案);
});

test('PLAY-015 D1跨日才收针仍按真实D2时钟产生下一时段回执', async () => {
  const e = await completed('继续关系', 0, 9), account = e.state.系统._许曼君离婚后日常;
  assert.equal(account.最近事件时段, 9); assert.equal(account.下次可用时段, 15);
  assert.equal(account.待反馈事件[0].可发送时段, 10);
  assert.deepEqual(compile(e.state, 84, 9), []);
  e.state.系统._绝对时段 = 10;
  assert.match(compile(e.state, 84, 10)[0].文, /之前/u);
});
