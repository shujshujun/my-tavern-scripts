/* eslint-disable import-x/no-nodejs-modules -- Isolated host and neutral model fixtures; no external calls. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { clone, createHost, productionFunction, delta, message } from './helpers/微信事务恢复环境.mjs';

const key = member => `回国:茶话会后私聊:${member}`;
const text = length => '好'.repeat(length) + '。';
const source = '手机/生成引擎.ts';

/** Actual caller, retry loop, final validator, raw writer/reader/mirror and receipts.
 * Provider responses are neutral pre-parsed inputs, NOT a real model/protocol/host test.
 * Story eligibility and commits use the existing product module, without rewriting prompts.
 */
function fixture(options = {}) {
  const e = createHost({ saveMode: options.saveMode ?? 'absent' });
  e.events = [];
  e.requests = 0;
  e.responses = [...(options.responses ?? ['报修已经登记。'])];
  e.globals.eventEmit = (...args) => e.events.push(args);
  e.timeline = e.load('手机时间线租约.ts');
  e.receipts = e.load('手机/回国提交凭据.ts');
  e.lifecycle = e.load('回国系统.ts');
  e.state = () => e.st.chat.at(-1).stat_data;
  const route = e.state().系统._回国;
  Object.assign(route, {
    阶段: '待旧委托', 茶话会状态: '已完成',
    后续私聊待触发成员: [...(options.members ?? ['101', '102'])],
    后续私聊已触发成员: [], 后续私聊最早时段: 20,
  });
  const leases = e.load('生成通道互斥.ts');
  const valid = productionFunction(source, '手机小生成仍有效', {});
  const empty = productionFunction(source, '空手机小生成结果', {});
  const lengthRule = productionFunction(source, '手机可见内容长度纪律', e.api);
  const exceeds = productionFunction(source, '有单条超过汉字上限', e.load('手机群聊格式.ts'));
  const generate = productionFunction(source, '小生成', {
    ...e.globals, ...leases,
    当前手机数据: e.state,
    不再留门手机只读原因: () => null,
    普通手机场景剧情只读原因: () => null,
    全局数据库AI租约: { 在结算: () => false },
    读配置: () => ({ ai来源: '正文' }),
    手机小生成仍有效: valid,
    空手机小生成结果: empty,
    手机可见内容长度纪律: lengthRule,
    有单条超过汉字上限: exceeds,
    正文API生成: async () => {
      const n = ++e.requests;
      if (e.beforeResponse) await e.beforeResponse(n);
      if (e.providerError) throw e.providerError;
      const response = e.responses.shift() ?? '';
      return typeof response === 'object' ? response : { 文: response, 封套不完整: false };
    },
  });
  const finalText = productionFunction(source, '微信短文本', {
    ...e.globals, 验收短文本: e.api.验收短文本,
  });
  e.adapt('手机/生成引擎.ts', {
    小生成: generate, 微信短文本: finalText,
    称呼纪律: productionFunction(source, '称呼纪律', { 玩家名: e.api.玩家名 }),
  });
  e.caller = e.load('手机/回国手机.ts');
  e.run = () => e.caller.同步回国茶话会后私聊(e.state());
  e.deliveries = () => e.events.filter(x => x[0] === '人妻公寓:回国茶话会后私聊已送达');
  e.deferrals = () => e.events.filter(x => x[0] === '人妻公寓:回国茶话会后私聊暂缓');
  e.visible = () => e.api.读库().消息;
  e.raw = () => e.vars._微信?.消息 ?? [];
  e.context = () => ({
    聊天ID: e.id, 世代: e.timeline.读取当前手机时间线租约世代(),
    绝对时段: e.clock(), 聊天消息: e.st.chat, 微信消息: e.visible(),
  });
  e.assertReceipt = () => {
    const event = e.deliveries().at(-1);
    assert.ok(event, 'A delivered event must exist');
    assert.ok(event[2].消息.length, 'A delivered receipt must never be empty');
    assert.equal(e.receipts.回国提交凭据有效(event[2], e.context()), true);
    assert.ok(event[2].消息.every(m => m.会话 === event[1] && m.发 === '对方'));
    return event;
  };
  e.seed = async (messages = [message(key('101'))]) => {
    assert.equal(await e.api.写库增量(delta(messages)), true);
  };
  e.replace = (candidate = message(key('101')), scope = { 会话: '101', 键: key('101') }) => {
    const stats = { 实际插入消息数: -1, 实际插入消息键: [] };
    return e.api.写库增量(delta([candidate], scope ? { 替换不可见超长私聊: scope } : {}), () => true, stats)
      .then(result => ({ result, stats }));
  };
  return e;
}

for (const length of [150, 151, 170, 220, 221]) {
  test(`真实重生成与最终读写契约：${length}汉字`, async () => {
    const e = fixture({ responses: [text(length), text(length)] });
    assert.equal(await e.run(), length <= 150);
    assert.equal(e.requests, length <= 150 ? 1 : 2, 'Keep the existing one-retry budget');
    assert.equal(e.visible().length, length <= 150 ? 1 : 0);
    assert.equal(e.raw().length, length <= 150 ? 1 : 0, 'Overlong content must not occupy a new stable key');
    if (length <= 150) e.assertReceipt();
    else {
      assert.equal(e.deliveries().length, 0);
      assert.equal(e.deferrals().length, 1);
      assert.equal(await e.run(), false);
      assert.equal(e.requests, 2, 'Same world slot must not repeatedly burn requests');
      e.state().系统._绝对时段 += 1;
      e.responses.push('下一时段的完整短回复。');
      assert.equal(await e.run(), true);
      e.assertReceipt();
    }
  });
}

for (const initial of [151, 170, 220, 221]) {
  test(`首稿${initial}字、第二稿合格：只送达第二稿`, async () => {
    const e = fixture({ responses: [text(initial), '楼道灯已恢复。'] });
    assert.equal(await e.run(), true);
    assert.equal(e.requests, 2);
    assert.equal(e.visible()[0].文, '楼道灯已恢复。');
    e.assertReceipt();
  });
}

for (const member of ['101', '102']) {
  for (const length of [151, 170, 220, 221]) {
    test(`旧库${member}的${length}字占键可由真实短回复恢复`, async () => {
      const e = fixture({ members: [member, member === '101' ? '102' : '101'] });
      await e.seed([{ ...message(key(member), member), 文: text(length) }]);
      const oldSequence = e.raw()[0].序;
      assert.equal(e.visible().length, 0);
      assert.equal(await e.run(), true);
      assert.equal(e.raw().length, 1);
      assert.equal(e.visible().length, 1);
      assert.ok(e.raw()[0].序 > oldSequence);
      const event = e.assertReceipt();
      assert.equal(e.lifecycle.提交回国茶话会后私聊已送达(e.state(), event[1]).成功, true);
      assert.deepEqual(e.state().系统._回国.后续私聊已触发成员, [member]);
      assert.equal(e.state().系统._回国.后续私聊待触发成员.length, 1);
      assert.equal(await e.run(), false, 'The next member must wait for the next world slot');
    });
  }
}

test('合法旧消息只补交真实凭据，不重生成或重写', async () => {
  const e = fixture();
  await e.seed();
  const before = clone(e.raw());
  assert.equal(await e.run(), false);
  assert.equal(e.requests, 0);
  assert.deepEqual(e.raw(), before);
  e.assertReceipt();
});

test('ASCII、数字、emoji不充当汉字，首标签仍由真实验收剥离', async () => {
  const e = fixture({ responses: ['夏乔: ' + text(145) + ' ABC123🙂'.repeat(20)] });
  assert.equal(await e.run(), true);
  assert.equal(e.requests, 1);
  assert.ok(e.visible()[0].文.startsWith('好'));
  e.assertReceipt();
});

test('保留其他入口原去重：没有显式修复范围就不替换旧长消息', async () => {
  const e = fixture();
  await e.seed([{ ...message(key('101')), 文: text(170) }]);
  const before = clone(e.raw());
  const result = await e.replace(undefined, null);
  assert.equal(result.stats.实际插入消息数, 0);
  assert.deepEqual(e.raw(), before);
});

const protectedCases = [
  ['合法消息', { 文: '原来已经显示的消息。' }],
  ['撤回墓碑', { 类: '撤回', 文: '' }],
  ['照片', { 类: '照片', 文: text(170), 图: 'neutral-image' }],
  ['通话', { 类: '通话', 文: text(170) }],
  ['玩家消息', { 发: '我', 标识: 'player-key', 文: text(170) }],
  ['系统消息', { 发: '系统', 文: text(170) }],
  ['其他会话', { 会话: '102', 文: text(170) }],
  ['群消息', { 会话: '群', 文: '夏乔:' + text(170) }],
  ['非长度格式错误', { 文: '夏乔:第一句。\n沈静仪:第二句。' }],
];
for (const [label, change] of protectedCases) {
  test(`同键${label}不能被长度修复删除或复活`, async () => {
    const e = fixture();
    await e.seed([{ ...message(key('101')), ...change }]);
    const before = clone(e.raw());
    const result = await e.replace();
    assert.equal(result.stats.实际插入消息数, 0);
    assert.deepEqual(e.raw(), before);
  });
}

for (const change of [
  { 文: text(151) }, { 会话: '102' }, { 发: '我' }, { 类: '照片' },
  { 文: '夏乔:第一句。\n沈静仪:第二句。' },
]) {
  test(`不合格替换候选不移除旧记录：${JSON.stringify(change).slice(0, 45)}`, async () => {
    const e = fixture();
    await e.seed([{ ...message(key('101')), 文: text(170) }]);
    const before = clone(e.raw());
    const result = await e.replace({ ...message(key('101')), ...change });
    assert.equal(result.stats.实际插入消息数, 0);
    assert.deepEqual(e.raw(), before);
  });
}

for (const scope of [{ 会话: '102', 键: key('101') }, { 会话: '101', 键: 'other-key' }]) {
  test(`修复范围必须精确匹配：${JSON.stringify(scope)}`, async () => {
    const e = fixture();
    await e.seed([{ ...message(key('101')), 文: text(170) }]);
    const before = clone(e.raw());
    assert.equal((await e.replace(undefined, scope)).stats.实际插入消息数, 0);
    assert.deepEqual(e.raw(), before);
  });
}

test('同键混有已显示记录时整组保持，不能把坏记录当成删除好记录的理由', async () => {
  const e = fixture();
  await e.seed([{ ...message(key('101')), 文: text(170) }]);
  e.vars._微信.消息.push({ ...e.raw()[0], 文: '已经可见。', 序: 9 });
  await e.api.确认当前微信为刷新真值();
  const before = clone(e.raw());
  assert.equal((await e.replace()).stats.实际插入消息数, 0);
  assert.deepEqual(e.raw(), before);
});

test('仅替换指定同键旧坏记录，保留其他成员、玩家原文和其他事件', async () => {
  const e = fixture();
  await e.seed([
    { ...message(key('101')), 文: text(170) },
    { ...message(key('102'), '102'), 文: text(170) },
    { ...message('other-event'), 文: text(170) },
    { ...message('player-event'), 发: '我', 标识: 'player-1', 文: '玩家的完整原句。' },
  ]);
  const protectedRows = clone(e.raw().filter(m => m.键 !== key('101')));
  const result = await e.replace();
  assert.equal(result.stats.实际插入消息数, 1);
  assert.deepEqual(result.stats.实际插入消息键, [key('101')]);
  assert.deepEqual(e.raw().filter(m => m.键 !== key('101')), protectedRows);
});

test('两个并发同键修复只有一个真实插入；后续重复不分配新序', async () => {
  const e = fixture();
  await e.seed([{ ...message(key('101')), 文: text(170) }]);
  const results = await Promise.all([e.replace(), e.replace()]);
  assert.equal(results.reduce((sum, x) => sum + x.stats.实际插入消息数, 0), 1);
  const before = clone(e.raw());
  assert.equal((await e.replace()).stats.实际插入消息数, 0);
  assert.deepEqual(e.raw(), before);
  assert.equal(e.visible().length, 1);
});

test('变量提交前失败：旧坏记录与无关记录不被部分删除', async () => {
  const e = fixture();
  await e.seed([{ ...message(key('101')), 文: text(170) }, message('other')]);
  const before = clone(e.vars);
  e.rejectUpdate = true;
  await assert.rejects(e.run(), /controlled updater rejection/);
  assert.deepEqual(e.vars, before);
  assert.equal(e.deliveries().length, 0);
  e.rejectUpdate = false;
  e.responses.push('重新提交的短回复。');
  assert.equal(await e.run(), true);
  e.assertReceipt();
});

for (const [name, invalidate] of [
  ['切聊天', e => { e.id = 'other-chat'; }],
  ['回档世代', e => e.timeline.作废当前手机时间线租约世代()],
  ['切swipe', e => { e.st.chat[4].swipe_id = 1; e.st.chat[4].mes = '另一分支'; }],
  ['世界时间变化', e => { e.state().系统._绝对时段 += 1; }],
]) {
  test(`响应期间${name}：迟到请求不替换原记录、不发成功`, async () => {
    const e = fixture();
    await e.seed([{ ...message(key('101')), 文: text(170) }]);
    const before = clone(e.vars);
    e.beforeResponse = () => invalidate(e);
    assert.equal(await e.run(), false);
    assert.deepEqual(e.vars, before);
    assert.equal(e.deliveries().length, 0);
  });
}

test('真实镜像刷新恢复后仍能修复旧占键，不需要清空微信库', async () => {
  const e = fixture();
  await e.seed([{ ...message(key('101')), 文: text(170) }]);
  await e.api.立即持久保存手机聊天变量();
  const reopened = e.reopen(true);
  await reopened.api.恢复微信刷新恢复副本();
  assert.equal(reopened.api.读库().消息.length, 0);
  const stats = { 实际插入消息数: 0, 实际插入消息键: [] };
  assert.equal(await reopened.api.写库增量(delta([message(key('101'))], {
    替换不可见超长私聊: { 会话: '101', 键: key('101') },
  }), () => true, stats), true);
  assert.equal(stats.实际插入消息数, 1);
  assert.equal(reopened.api.读库().消息.length, 1);
});

for (const initial of [
  { 会话: '102', 文: '别的会话。' }, { 发: '系统', 文: '内部消息。' },
  { 类: '撤回', 文: '' },
]) {
  test(`借用同键的非目标记录不能伪造送达：${JSON.stringify(initial)}`, async () => {
    const e = fixture();
    await e.seed([{ ...message(key('101')), ...initial }]);
    assert.equal(await e.run(), false);
    assert.equal(e.deliveries().length, 0);
  });
}

for (const [name, extra] of [
  ['未来时段', { 时: 25 }],
  ['未来楼层', { 楼: 8 }],
  ['另一分支', { 锚签名: 'another-branch-signature' }],
]) {
  test(`修复当前投影同时逐字保留${name}中的同键记录`, async () => {
    const e = fixture();
    await e.seed([{ ...message(key('101')), 文: text(170) }]);
    e.vars._微信.消息.push({ ...e.raw()[0], ...extra, 序: 17 });
    await e.api.确认当前微信为刷新真值();
    const protectedRow = clone(e.raw().find(m => m.序 === 17));
    assert.equal((await e.replace()).stats.实际插入消息数, 1);
    assert.equal(e.raw().length, 2);
    assert.deepEqual(e.raw().find(m => m.序 === 17), protectedRow);
    assert.equal(e.visible().length, 1);
    assert.ok(e.visible()[0].序 > 17);
  });
}

test('多个同键旧长记录在同一次原子提交中替换，不能留下第二个幽灵键', async () => {
  const e = fixture();
  await e.seed([{ ...message(key('101')), 文: text(170) }]);
  e.vars._微信.消息.push({ ...e.raw()[0], 文: text(220), 序: 9 });
  await e.api.确认当前微信为刷新真值();
  assert.equal((await e.replace()).stats.实际插入消息数, 1);
  assert.equal(e.raw().length, 1);
  assert.equal(e.visible().length, 1);
});

test('候选撞上玩家撤回标识时，不能先删除旧长文本再跳过插入', async () => {
  const e = fixture();
  await e.seed([
    { ...message(key('101')), 文: text(170) },
    { ...message('player'), 发: '我', 类: '撤回', 文: '', 标识: 'withdrawn-player-id' },
  ]);
  const before = clone(e.raw());
  assert.equal((await e.replace({ ...message(key('101')), 标识: 'withdrawn-player-id' })).stats.实际插入消息数, 0);
  assert.deepEqual(e.raw(), before);
});

test('显式写入许可拒绝时保持原始库和统计，不进行半次修复', async () => {
  const e = fixture();
  await e.seed([{ ...message(key('101')), 文: text(170) }]);
  const before = clone(e.vars);
  const stats = { 实际插入消息数: -1, 实际插入消息键: ['stale'] };
  assert.equal(await e.api.写库增量(delta([message(key('101'))], {
    替换不可见超长私聊: { 会话: '101', 键: key('101') },
  }), () => false, stats), false);
  assert.deepEqual(e.vars, before);
  assert.deepEqual(stats, { 实际插入消息数: 0, 实际插入消息键: [] });
});

for (const [name, invalidate] of [
  ['切聊天', e => { e.id = 'other-chat'; }],
  ['世代失效', e => e.timeline.作废当前手机时间线租约世代()],
  ['swipe变化', e => { e.st.chat[4].swipe_id = 1; e.st.chat[4].mes = '不同分支'; }],
]) {
  test(`排队到变量回调执行前${name}，旧占键仍原样保留`, async () => {
    const e = fixture();
    await e.seed([{ ...message(key('101')), 文: text(170) }]);
    const before = clone(e.vars);
    e.beforeUpdate = () => invalidate(e);
    assert.equal(await e.run(), false);
    assert.deepEqual(e.vars, before);
    assert.equal(e.deliveries().length, 0);
  });

  test(`已提交回调尚未返回时${name}，不向新时间线广播送达`, async () => {
    const e = fixture();
    await e.seed([{ ...message(key('101')), 文: text(170) }]);
    e.afterUpdate = () => invalidate(e);
    assert.equal(await e.run(), false);
    assert.equal(e.raw().length, 1);
    assert.equal(e.raw()[0].文, '报修已经登记。', 'The write committed while its original lease was valid');
    assert.equal(e.deliveries().length, 0);
  });

  test(`宿主保存等待期间${name}，旧请求不广播送达`, async () => {
    const e = fixture();
    e.st.saveMetadata = async () => invalidate(e);
    assert.equal(await e.run(), false);
    assert.equal(e.deliveries().length, 0);
  });
}

for (const [name, rewrite] of [
  ['删除', messages => messages.filter(m => m.键 !== key('101'))],
  ['改成超长', messages => messages.map(m => m.键 === key('101') ? { ...m, 文: text(170) } : m)],
  ['换会话', messages => messages.map(m => m.键 === key('101') ? { ...m, 会话: '102' } : m)],
]) {
  test(`持久保存期间消息${name}，最终不签发空或错归属收据`, async () => {
    const e = fixture();
    e.st.saveMetadata = async () => e.api.修改微信消息容器(rewrite, e.id);
    assert.equal(await e.run(), false);
    assert.equal(e.deliveries().length, 0);
    assert.equal(e.deferrals().length, 1);
  });
}

test('宿主保存报错保留原有本地可见送达语义，恢复镜像不丢失；不冒称物理落盘', async () => {
  const e = fixture({ saveMode: 'throw' });
  assert.equal(await e.run(), true);
  assert.ok(e.saves.includes('throw'));
  assert.equal(e.server.envelope.vars._微信, undefined, 'The physical-host adapter did not save');
  e.assertReceipt();
  const reopened = e.reopen(true);
  await reopened.api.恢复微信刷新恢复副本();
  assert.equal(reopened.api.读库().消息.length, 1);
});

test('提供方明确失败不动旧库；下个时段仍可恢复', async () => {
  const e = fixture();
  await e.seed([{ ...message(key('101')), 文: text(170) }]);
  const before = clone(e.raw());
  e.providerError = new Error('controlled provider rejection');
  await assert.rejects(e.run(), /controlled provider rejection/);
  assert.deepEqual(e.raw(), before);
  assert.equal(e.deliveries().length, 0);
  assert.equal(e.deferrals().length, 1);
  e.providerError = null;
  e.state().系统._绝对时段 += 1;
  assert.equal(await e.run(), true);
  e.assertReceipt();
});

test('仅因旧文本换行总长超过150也可恢复；不重新解释多个发言人', async () => {
  const e = fixture();
  await e.seed([{ ...message(key('101')), 文: text(100) + '\n' + text(70) }]);
  assert.equal(e.visible().length, 0);
  assert.equal(await e.run(), true);
  e.assertReceipt();
});

test('首尾两稿都为空或封套不完整时，没有占键、送达或成员消费', async () => {
  for (const responses of [[''], [{ 文: '', 封套不完整: true }, { 文: '', 封套不完整: true }]]) {
    const e = fixture({ responses });
    assert.equal(await e.run(), false);
    assert.equal(e.deliveries().length, 0);
    assert.equal(e.raw().length, 0);
    assert.deepEqual(e.state().系统._回国.后续私聊待触发成员, ['101', '102']);
  }
});
