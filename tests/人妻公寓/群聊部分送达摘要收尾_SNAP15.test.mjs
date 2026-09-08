/* eslint-disable import-x/no-nodejs-modules -- Isolated host; no network, player data or real model calls. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { clone, createHost, productionFunction } from './helpers/微信事务恢复环境.mjs';

const source = '手机/交互/邀约与发消息.ts';
const summarySource = '手机/摘要系统.ts';
const conversations = ['群', '姐妹群'];

/**
 * Runs the complete current consumer, actual data-layer write/read/CAS, actual send lease,
 * actual summary snapshot/hash/queue and queued-request identity gate. The existing helper
 * adapts only the host variable store, browser storage, timers and UI. Candidate generation
 * is an adjacent input adapter except in the explicit real public-group producer tests.
 * The final SQLite summary worker is a capture adapter, NOT a real database save assertion.
 */
function fixture(options = {}) {
  const e = createHost({ saveMode: 'absent' });
  const timeline = e.load('手机时间线租约.ts');
  const context = e.load('手机/运行时上下文.ts');
  const schema = e.load('../../schema.ts');
  const session = options.session ?? '群';
  e.session = session;
  e.active = true;
  e.generation = 0;
  e.writeCalls = 0;
  e.delays = 0;
  e.modelCalls = 0;
  e.queueCalls = [];
  e.summaries = [];
  e.workerCalls = 0;
  e.droppedWorkers = 0;
  e.events = [];
  e.redraws = 0;
  e.receiptCommits = 0;
  e.jobs = new Map();
  e.failures = options.failures ?? {};
  e.timeline = timeline;
  const floor = () => e.st.chat.length - 1;
  const lease = {
    聊天ID: e.id,
    数据: clone(e.st.chat.at(-1).stat_data),
    楼: floor(),
    绝对时段: e.clock(),
    时间线租约: timeline.创建手机时间线租约(e.id, floor(), e.st.chat, e.clock()),
    会场摘要租约: null,
  };
  assert.ok(lease.时间线租约);
  e.lease = lease;
  const hardValid = productionFunction('手机/壳/会话瞬态.ts', '手机发送租约仍有效', {
    ...e.globals, ...timeline,
    当前聊天ID: () => e.id,
    当前手机绝对时段: e.clock,
  });
  e.hardValid = () => hardValid(lease);
  const softValid = productionFunction('手机/生成引擎.ts', '手机小生成仍有效', {});
  const summaryDeps = {
    ...e.globals,
    ...e.load('微信摘要来源.ts'),
    ...e.load('微信跨渠道见闻.ts'),
    末楼: floor,
    当前聊天ID: () => e.id,
    读库: e.api.读库,
    有效楼务任务id集合: () => new Set(),
    推进摘要哈希: productionFunction(summarySource, '推进摘要哈希', {}),
    微信摘要签名消息: productionFunction(summarySource, '微信摘要签名消息', {}),
  };
  const snapshot = productionFunction(summarySource, '取群聊摘要快照', summaryDeps);
  const summaryValid = productionFunction(summarySource, '群聊摘要快照仍有效', {
    取群聊摘要快照: snapshot,
    当前时间线切换世代: () => e.generation,
    读取当前手机时间线租约世代: timeline.读取当前手机时间线租约世代,
  });
  e.snapshot = () => snapshot(session);
  const queue = productionFunction(summarySource, '排队刷新群聊进展摘要', {
    读配置: () => ({ 微信进展摘要: !e.summaryDisabled }),
    微信摘要SQLite近期不可用: () => Boolean(e.databaseUnavailable),
    数据库状态: () => ({ 可写表格: !e.missingTemplate, 已装游戏模板: !e.missingTemplate }),
    取群聊摘要快照: snapshot,
    当前时间线切换世代: () => e.generation,
    读取当前手机时间线租约世代: timeline.读取当前手机时间线租约世代,
    微信摘要任务: e.jobs,
    刷新群聊进展摘要: async (...args) => {
      e.workerCalls += 1;
      if (e.beforeWorker) await e.beforeWorker();
      if (e.workerFailure) throw new Error('controlled optional SQLite worker failure');
      if (!summaryValid(...args)) { e.droppedWorkers += 1; return; }
      e.summaries.push({ args, messages: clone(snapshot(args[0]).消息) });
    },
  });
  const schedule = conversation => {
    e.queueCalls.push(conversation);
    if (e.queueFailure) throw new Error('controlled synchronous queue failure');
    queue(conversation);
  };
  e.control = { 仍有效: () => e.active };
  e.candidates = options.candidates ?? ['夏乔:水管报修已经登记。', '沈静仪:楼道灯也已经登记。'];
  let realProducer;
  if (options.realProducer) {
    const config = e.load('../../stageConfig.ts');
    const groupFormat = e.load('手机群聊格式.ts');
    const quotes = e.load('微信消息引用.ts');
    const parser = productionFunction('手机/生成引擎.ts', '微信群文本', {
      ...groupFormat, ...e.load('手机输出安全.ts'), console: e.globals.console,
    });
    realProducer = productionFunction(source, '楼务群一拍', {
      ...e.globals, ...config, ...groupFormat, ...quotes, ...e.load('微信正文承接.ts'),
      微信群文本: parser,
      手机可见单条硬上限: e.api.手机可见单条硬上限,
      取绝对时段: stat => stat.系统._绝对时段,
      玩家名: () => '管理员甲',
      读取群聊记忆上下文: () => ({ 近期消息: e.api.读库().消息, 群内记忆: '' }),
      有效楼务任务id集合: () => new Set(),
      小生成: async () => e.candidates.join('\n'),
    });
  }
  const producer = async (data, store, ...rest) => {
    e.modelCalls += 1;
    if (e.beforeProducer) await e.beforeProducer();
    if (e.generationFailure) throw new Error('controlled model rejection');
    if (e.emptyGeneration) return false;
    if (realProducer) return realProducer(data, store, ...rest);
    // This supplies already accepted neutral candidates; it does not reimplement group parsing.
    store.消息.push(...e.candidates.map((text, index) => ({
      楼: lease.楼, 时: lease.绝对时段, 会话: session, 发: '对方',
      文: typeof text === 'string' ? text : text.文,
      ...(options.keys ? { 键: `${options.keys}${index}` } : {}),
      ...(typeof text === 'object' ? clone(text) : {}),
    })));
    return true;
  };
  const write = async (delta, allowed, stats) => {
    const attempt = ++e.writeCalls;
    if (e.beforeWrite) await e.beforeWrite(attempt);
    const reject = e.failures[attempt] === 'throw';
    e.rejectUpdate = reject;
    try {
      // False is exercised through the real writer's commit predicate, not a fake return value.
      return await e.api.写库增量(delta, () => e.failures[attempt] !== 'false' && allowed(), stats);
    } finally {
      e.rejectUpdate = false;
    }
  };
  e.run = productionFunction(source, '手动群接话', {
    ...e.globals,
    Schema: schema.Schema,
    手机发送租约仍有效: hardValid,
    手机小生成仍有效: softValid,
    恢复双重继承群聊余波主状态: async () => {},
    读最近有效stat: () => clone(e.st.chat.at(-1)?.stat_data),
    末楼: floor,
    读库: e.api.读库,
    创建群聊引用响应约束: () => undefined,
    新回国茶话会批次标识: () => 'snap15-neutral-batch',
    楼务群一拍: producer,
    姐妹群一拍: producer,
    读取双重继承群聊余波收据: () => options.receipt ?? null,
    写库增量: write,
    立即持久保存手机聊天变量: e.api.立即持久保存手机聊天变量,
    双重继承群聊余波收据完整: () => options.receiptComplete !== false,
    提交双重继承群聊余波主状态: async () => { e.receiptCommits += 1; return true; },
    排队刷新群聊进展摘要: schedule,
    请求手机重绘: () => { e.redraws += 1; },
    请求刷新手机红点: () => {},
    构造回国提交凭据: (frozen, messages) => ({ frozen, messages: clone(messages) }),
    eventEmit: (...args) => e.events.push(args),
    setTimeout: resolve => {
      e.delays += 1;
      const index = e.delays;
      void Promise.resolve().then(async () => {
        if (e.onDelay) await e.onDelay(index);
        resolve();
      });
      return 0;
    },
  });
  e.invoke = () => e.run(session, '登记本轮维修事项。', lease, e.control);
  e.messages = () => e.api.读库().消息.filter(message => message.会话 === session);
  e.settle = async () => {
    while (e.jobs.size) await Promise.allSettled([...e.jobs.values()]);
    await Promise.resolve();
  };
  e.invalidate = kind => {
    switch (kind) {
      case 'chat': e.id = 'another-chat'; break;
      case 'clock': e.st.chat.at(-1).stat_data.系统._绝对时段 += 1; break;
      case 'generation': timeline.作废当前手机时间线租约世代(); break;
      case 'swipe': e.st.chat[lease.楼].swipe_id += 1; break;
      case 'rewrite': e.st.chat[lease.楼].mes = 'changed anchor'; break;
      case 'replace': e.st.chat[lease.楼] = clone(e.st.chat[lease.楼]); break;
      case 'delete': e.st.chat.pop(); break;
      default: assert.fail(`Unknown invalidation ${kind}`);
    }
  };
  e.runtime = context;
  return e;
}

for (const session of conversations) {
  for (const [label, failures, saved] of [
    ['success', {}, 2], ['first false', { 1: 'false' }, 0], ['second false', { 2: 'false' }, 1],
    ['first throw before commit', { 1: 'throw' }, 0], ['second throw before commit', { 2: 'throw' }, 1],
  ]) {
    test(`SNAP15 ${session}: real writer ${label} schedules only committed messages`, async () => {
      const e = fixture({ session, failures });
      assert.equal(await e.invoke(), saved > 0);
      await e.settle();
      assert.equal(e.messages().length, saved);
      assert.deepEqual(e.queueCalls, saved ? [session] : []);
      assert.equal(e.summaries.length, saved ? 1 : 0);
      if (saved) assert.equal(e.summaries[0].messages.length, saved);
      assert.equal(e.modelCalls, 1);
    });
  }
  test(`SNAP15 ${session}: cancellation between bubbles preserves the first and schedules once`, async () => {
    const e = fixture({ session });
    e.onDelay = () => { e.active = false; };
    assert.equal(await e.invoke(), true);
    await e.settle();
    assert.equal(e.messages().length, 1);
    assert.deepEqual(e.queueCalls, [session]);
    assert.deepEqual(e.summaries[0].messages.map(message => message.文), [e.candidates[0]]);
    assert.equal(e.writeCalls, 1);
    assert.equal(e.modelCalls, 1);
  });
  test(`SNAP15 ${session}: cancellation in the second real commit gate still finalizes the first`, async () => {
    const e = fixture({ session });
    e.beforeWrite = attempt => { if (attempt === 2) e.active = false; };
    assert.equal(await e.invoke(), true);
    await e.settle();
    assert.equal(e.messages().length, 1);
    assert.deepEqual(e.queueCalls, [session]);
  });
  for (const kind of ['chat', 'clock', 'generation', 'swipe', 'rewrite', 'replace', 'delete']) {
    test(`SNAP15 ${session}: hard ${kind} invalidation never queues old content into a new timeline`, async () => {
      const e = fixture({ session });
      e.onDelay = () => e.invalidate(kind);
      assert.equal(await e.invoke(), true);
      await e.settle();
      assert.equal(e.hardValid(), false);
      assert.deepEqual(e.queueCalls, []);
      assert.equal(e.summaries.length, 0);
      assert.equal(e.writeCalls, 1);
    });
  }
  test(`SNAP15 ${session}: synchronous optional queue failure cannot undo successful delivery`, async () => {
    const e = fixture({ session });
    e.queueFailure = true;
    assert.equal(await e.invoke(), true);
    assert.equal(e.messages().length, 2);
    assert.deepEqual(e.queueCalls, [session]);
    assert.ok(e.warnings.some(entry => String(entry[0]).includes('群聊收尾摘要失败')));
  });
  test(`SNAP15 ${session}: queue failure on a partial return does not replace its success result`, async () => {
    const e = fixture({ session, failures: { 2: 'false' } });
    e.queueFailure = true;
    assert.equal(await e.invoke(), true);
    assert.equal(e.messages().length, 1);
    assert.deepEqual(e.queueCalls, [session]);
  });
  test(`SNAP15 ${session}: deduplication uses actual insertion receipts, including mixed duplicate/new`, async () => {
    const e = fixture({ session, keys: 'snap15-dedup:' });
    assert.equal(await e.invoke(), true);
    await e.settle();
    e.queueCalls.length = 0;
    assert.equal(await e.invoke(), false);
    await e.settle();
    assert.equal(e.messages().length, 2);
    assert.deepEqual(e.queueCalls, []);
    e.candidates.push('夏乔:维修单编号已经补齐。');
    assert.equal(await e.invoke(), true);
    await e.settle();
    assert.equal(e.messages().length, 3);
    assert.deepEqual(e.queueCalls, [session]);
    assert.equal(e.summaries.at(-1).messages.length, 3);
  });
  test(`SNAP15 ${session}: a later batch preserves the cancelled batch's delivered prefix`, async () => {
    const e = fixture({ session, keys: 'snap15-batch:' });
    e.onDelay = () => { e.active = false; };
    assert.equal(await e.invoke(), true);
    await e.settle();
    const first = clone(e.messages());
    e.onDelay = undefined;
    e.active = true;
    assert.equal(await e.invoke(), true);
    await e.settle();
    assert.equal(e.messages().length, 2);
    assert.deepEqual(e.messages()[0], first[0]);
    assert.deepEqual(e.queueCalls, [session, session]);
    assert.equal(e.modelCalls, 2);
  });
}

for (const kind of ['empty', 'cancelled generation', 'invalid before start', 'producer rejection']) {
  test(`SNAP15 no delivery/${kind}: no invented summary or completion`, async () => {
    const e = fixture();
    if (kind === 'empty') e.emptyGeneration = true;
    if (kind === 'cancelled generation') e.beforeProducer = () => { e.active = false; };
    if (kind === 'invalid before start') e.invalidate('chat');
    if (kind === 'producer rejection') e.generationFailure = true;
    if (kind === 'producer rejection') await assert.rejects(e.invoke(), /controlled model rejection/);
    else assert.equal(await e.invoke(), false);
    assert.equal(e.writeCalls, 0);
    assert.deepEqual(e.queueCalls, []);
    assert.deepEqual(e.events, []);
  });
}

for (const mode of ['normal', 'cancel', 'false']) {
  test(`SNAP15 actual public-group producer/parser + actual writer: ${mode}`, async () => {
    const e = fixture({ realProducer: true, failures: mode === 'false' ? { 2: 'false' } : {} });
    if (mode === 'cancel') e.onDelay = () => { e.active = false; };
    assert.equal(await e.invoke(), true);
    await e.settle();
    const count = mode === 'normal' ? 2 : 1;
    assert.equal(e.messages().length, count);
    assert.deepEqual(e.queueCalls, ['群']);
    assert.equal(e.summaries[0].messages.length, count);
    assert.equal(e.modelCalls, 1);
  });
}

for (const flag of ['summaryDisabled', 'databaseUnavailable', 'missingTemplate', 'workerFailure']) {
  test(`SNAP15 optional summary ${flag} leaves delivered chat untouched`, async () => {
    const e = fixture();
    e[flag] = true;
    assert.equal(await e.invoke(), true);
    await e.settle();
    assert.equal(e.messages().length, 2);
    assert.equal(e.summaries.length, 0);
    assert.equal(e.jobs.size, 0);
  });
}

for (const mode of ['chat', 'generation', 'new message']) {
  test(`SNAP15 queued summary rejects stale ${mode} before its worker consumes a snapshot`, async () => {
    const e = fixture();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    e.beforeWorker = () => gate;
    assert.equal(await e.invoke(), true);
    if (mode === 'chat') e.id = 'other-summary-chat';
    else if (mode === 'generation') e.timeline.作废当前手机时间线租约世代();
    else await e.api.写库增量({ 新圈: [], 节拍改: {}, 新消息: [{
      楼: 4, 时: 20, 会话: '群', 发: '对方', 文: '夏乔:另一个维修事项已登记。',
    }] });
    release();
    await e.settle();
    assert.equal(e.summaries.length, 0);
    assert.equal(e.droppedWorkers, 1);
  });
}

test('SNAP15 normal extra floor preserves the frozen anchor and successful summary', async () => {
  const e = fixture();
  e.onDelay = () => e.st.chat.push({ ...clone(e.st.chat.at(-1)), mes: 'new ordinary floor' });
  assert.equal(await e.invoke(), true);
  await e.settle();
  assert.equal(e.hardValid(), true);
  assert.equal(e.messages().length, 2);
  assert.deepEqual(e.queueCalls, ['群']);
});

test('SNAP15 reload from the actual mirror preserves delivered keyed messages without replay', async () => {
  const e = fixture({ session: '姐妹群', keys: 'snap15-reload:' });
  e.onDelay = () => { e.active = false; };
  assert.equal(await e.invoke(), true);
  await e.settle();
  const reopened = e.reopen();
  const restored = reopened.api.读库().消息;
  assert.equal(restored.length, 1);
  assert.equal(restored[0].键, 'snap15-reload:0');
  assert.equal(restored[0].文, e.candidates[0]);
});

for (const partial of [false, true]) {
  test(`SNAP15 keyed special batch ${partial ? 'partial' : 'complete'} retains exact completion gate`, async () => {
    const e = fixture({ session: '姐妹群', keys: '回国茶话会:收束:-:aSNAP15:', failures: partial ? { 2: 'false' } : {} });
    assert.equal(await e.invoke(), true);
    await e.settle();
    assert.deepEqual(e.queueCalls, ['姐妹群']);
    assert.equal(e.events.length, partial ? 0 : 1);
    if (!partial) {
      assert.equal(e.events[0][0], '人妻公寓:回国茶话会批次完成');
      assert.equal(e.events[0][1].摘要, e.messages().map(message => message.文).join('\n'));
      assert.equal(e.events[0][2].messages.length, 2);
    }
  });
}

test('SNAP15 dedicated atomic receipt transaction keeps its existing single queue and completion path', async () => {
  const e = fixture({ session: '姐妹群', keys: 'snap15-receipt:', receipt: { id: 'neutral-atomic-batch' } });
  assert.equal(await e.invoke(), true);
  await e.settle();
  assert.equal(e.writeCalls, 1);
  assert.equal(e.messages().length, 2);
  assert.deepEqual(e.queueCalls, ['姐妹群']);
  assert.equal(e.receiptCommits, 1);
  assert.equal(e.events.length, 0);
});

for (const change of ['soft cancel', 'chat', 'generation', 'swipe']) {
  test(`SNAP15 real queued variable callback rechecks ${change} after its await`, async () => {
    const e = fixture();
    let entered, release;
    const waiting = new Promise(resolve => { entered = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    e.beforeUpdate = async call => {
      if (call === 2) { entered(); await gate; }
    };
    const running = e.invoke();
    await waiting;
    if (change === 'soft cancel') e.active = false;
    else e.invalidate(change);
    release();
    assert.equal(await running, true);
    await e.settle();
    assert.equal(e.vars._微信.消息.length, 1);
    assert.deepEqual(e.queueCalls, change === 'soft cancel' ? ['群'] : []);
    assert.equal(e.summaries.length, change === 'soft cancel' ? 1 : 0);
  });
}

test('SNAP15 unrelated concurrent write survives incremental delivery and enters the real summary snapshot', async () => {
  const e = fixture();
  e.onDelay = async () => {
    await e.api.写库增量({ 新圈: [], 节拍改: {}, 新消息: [{
      楼: 4, 时: 20, 会话: '群', 发: '我', 文: '另一张维修单也请保留。', 标识: 'snap15-concurrent',
    }] });
  };
  assert.equal(await e.invoke(), true);
  await e.settle();
  assert.equal(e.messages().length, 3);
  assert.equal(e.summaries[0].messages.length, 3);
  assert.equal(e.messages().filter(message => message.标识 === 'snap15-concurrent').length, 1);
  assert.deepEqual(e.queueCalls, ['群']);
});

test('SNAP15 dedicated atomic receipt duplicate does not queue another visible-message summary', async () => {
  const e = fixture({ session: '姐妹群', keys: 'snap15-atomic-dedup:', receipt: { id: 'neutral-atomic-batch' } });
  assert.equal(await e.invoke(), true);
  await e.settle();
  e.queueCalls.length = 0;
  assert.equal(await e.invoke(), true);
  await e.settle();
  assert.deepEqual(e.queueCalls, []);
  assert.equal(e.messages().length, 2);
});

test('SNAP15 optional summary queue exception does not suppress an otherwise complete keyed batch', async () => {
  const e = fixture({ session: '姐妹群', keys: '回国茶话会:收束:-:aSNAP15:' });
  e.queueFailure = true;
  assert.equal(await e.invoke(), true);
  assert.equal(e.events.length, 1);
  assert.equal(e.events[0][1].摘要, e.messages().map(message => message.文).join('\n'));
  assert.deepEqual(e.queueCalls, ['姐妹群']);
});
