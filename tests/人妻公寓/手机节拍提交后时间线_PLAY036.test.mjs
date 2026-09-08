/* eslint-disable import-x/no-nodejs-modules -- 运行完整节拍、UI注册表、数据层和时间线；仅控制候选生成与宿主I/O。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { createTickHost, ordinary, receipt, moment } from './helpers/手机节拍可见刷新环境.mjs';
import { deferred } from './helpers/手机发送草稿环境.mjs';
import { clone } from './helpers/微信事务恢复环境.mjs';
import { pregnancyKit, extract } from './helpers/手机并行第二组环境.mjs';

function host(branch, kind = 'visible') {
  const e = createTickHost();
  const message = kind === 'hidden' ? receipt('post-commit') : ordinary({ 会话: '姐妹群', 文: '夏乔:楼道的灯已经修好了。', 键: 'post-commit' });
  if (branch === 'ordinary') e.candidates.新消息 = [message];
  else {
    e.frequency = '关';
    if (branch === 'mandatory') e.mandatoryProducer = async ({ 库, 楼, 钟 }) => {
      库.消息.push({ 楼, 时: 钟, ...message });
      库.节拍['必达测试'] = 钟;
      return '有新';
    };
    else e.handoverProducer = async (_data, 库, 楼, 钟) => {
      库.圈.unshift(moment({ 楼, 时: 钟, 事件键: 'handover-test' }));
      return true;
    };
  }
  return e;
}
function invalidate(e, kind) {
  if (kind === 'chat') { e.id = 'other-chat'; e.vars = {}; }
  if (kind === 'swipe') e.st.chat.at(-1).swipe_id++;
  if (kind === 'generation') e.load('手机时间线租约.ts').作废当前手机时间线租约世代();
}
const count = e => e.api.读库().消息.length + e.api.读库().圈.length;
const savedCount = e => (e.server.envelope.vars._微信?.消息.length ?? 0) + (e.server.envelope.vars._微信?.圈.length ?? 0);

for (const branch of ['ordinary', 'mandatory', 'handover']) {
  test(`${branch}：真实提交后两个UI回调抛错，仍保存内容并释放占用`, async t => {
    t.mock.method(console, 'error', () => undefined);
    const e = host(branch);
    e.ui.注册手机UI刷新实现(
      () => { e.refresh.redraw++; throw new Error('redraw'); },
      () => { e.refresh.badge++; throw new Error('badge'); },
    );
    await e.tick();
    assert.equal(count(e), 1);
    assert.equal(e.saves.length, 1);
    assert.equal(savedCount(e), 1);
    assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
    assert.equal(e.busy(), false);
  });

  test(`${branch}：候选重复但实际插入为零，只保存水位而不重绘或制造红点`, async () => {
    const e = host(branch);
    await e.tick();
    await e.tick();
    assert.equal(count(e), 1);
    assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
    assert.equal(e.saves.length, 2);
  });

  test(`${branch}：写入被拒后不刷新、不保存、不排后续摘要`, async () => {
    const e = host(branch);
    e.rejectUpdate = true;
    await e.tick();
    assert.equal(count(e), 0);
    assert.equal(e.saves.length, 0);
    assert.deepEqual(e.refresh, { redraw: 0, badge: 0 });
    assert.equal(e.queuedSummaries.length, 0);
    assert.equal(e.busy(), false);
  });

  for (const change of ['chat', 'swipe', 'generation']) {
    for (const stage of ['after-write', 'badge', 'redraw']) {
      test(`${branch}/${stage}/${change}：时间线失效后停止剩余UI通知、保存和摘要`, async () => {
        const e = host(branch);
        if (stage === 'after-write') e.afterUpdate = () => invalidate(e, change);
        e.ui.注册手机UI刷新实现(
          () => { e.refresh.redraw++; if (stage === 'redraw') invalidate(e, change); },
          () => { e.refresh.badge++; if (stage === 'badge') invalidate(e, change); },
        );
        await e.tick();
        assert.equal(e.saves.length, 0, '失效的原拍不能发起保存');
        assert.deepEqual(e.refresh, { redraw: stage === 'redraw' ? 1 : 0, badge: stage === 'after-write' ? 0 : 1 });
        assert.equal(e.queuedSummaries.length, 0, '旧拍不能向当前页面排新摘要');
        assert.equal(e.busy(), false);
      });
    }
    test(`${branch}/pending/${change}：保存等待期间失效，返回后不继续摘要和记忆任务`, async () => {
      const e = host(branch);
      const gate = deferred();
      let entered = false;
      e.st.saveMetadata = async () => {
        entered = true;
        e.saves.push('pending');
        await gate.promise;
      };
      const pending = e.tick();
      try {
        for (let i = 0; i < 50 && !entered; i++) await setImmediate();
        assert.equal(entered, true, '必须实际到达原生产保存接口');
        assert.equal(e.busy(), true);
        e.queuedMemory.length = 0;
        invalidate(e, change);
      } finally {
        gate.resolve();
        await pending;
      }
      assert.equal(e.saves.length, 1);
      assert.equal(e.queuedSummaries.length, 0);
      assert.equal(e.queuedMemory.length, 0);
      assert.equal(e.busy(), false);
    });
    test(`${branch}/queued-save/${change}：等待前一笔保存时失效，轮到本拍时不启动新保存`, async () => {
      const e = host(branch);
      const gate = deferred();
      let entered = false;
      e.st.saveMetadata = async () => {
        e.saves.push('queued');
        if (!entered) { entered = true; await gate.promise; }
      };
      const preceding = e.api.立即持久保存手机聊天变量(e.id);
      for (let i = 0; i < 50 && !entered; i++) await setImmediate();
      assert.equal(entered, true);
      const pending = e.tick();
      try {
        for (let i = 0; i < 50 && !e.refresh.redraw; i++) await setImmediate();
        assert.equal(e.refresh.redraw, 1, '本拍已写库并进入真实持久化串行队列');
        assert.equal(e.saves.length, 1);
        invalidate(e, change);
      } finally {
        gate.resolve();
        await preceding;
        await pending;
      }
      assert.equal(e.saves.length, 1, '旧节拍不能在队列轮到自己时保存新分支');
      assert.equal(e.queuedSummaries.length, 0);
    });
    test(`${branch}/mirror/${change}：恢复镜像变量回调前失效，不增修订或继续宿主保存`, async () => {
      const e = host(branch);
      let beforeMirror;
      e.beforeUpdate = call => {
        if (call !== 2) return;
        beforeMirror = structuredClone(e.vars._微信);
        invalidate(e, change);
      };
      await e.tick();
      assert.ok(beforeMirror, '已完成原消息提交并到达真实镜像更新回调');
      assert.equal(e.saves.length, 0);
      if (change !== 'chat') assert.deepEqual(e.vars._微信, beforeMirror);
      else assert.equal(e.vars._微信, undefined);
      assert.equal(e.queuedSummaries.length, 0);
    });
    test(`${branch}/delayed-save/${change}：原拍延迟补存触发前失效，不保存新时间线`, async () => {
      const e = host(branch);
      const initialTimers = new Set(e.timers.keys());
      await e.tick();
      assert.equal(e.saves.length, 1);
      const saveTimers = [...e.timers].filter(([key]) => !initialTimers.has(key));
      assert.equal(saveTimers.length, 1, '本次提交只新增一个静默期补存计时器');
      invalidate(e, change);
      for (const [key, timer] of saveTimers) { e.timers.delete(key); timer.cb(); }
      for (let i = 0; i < 30; i++) await Promise.resolve();
      assert.equal(e.saves.length, 1);
    });
  }
}
for (const branch of ['ordinary', 'mandatory']) {
  test(`${branch}：只有隐藏事务收据，仍持久化且不生成可见通知`, async () => {
    const e = host(branch, 'hidden');
    await e.tick();
    assert.equal(count(e), 1);
    assert.equal(savedCount(e), 1);
    assert.deepEqual(e.refresh, { redraw: 0, badge: 0 });
  });
}

test('真实孕情生产者与验收→完整节拍→UI异常→立即保存，后续拍按真实消息键去重', async t => {
  t.mock.method(console, 'error', () => undefined);
  const e = createTickHost();
  const data = e.st.chat.at(-1).stat_data;
  data.户['201'] = clone(data.户['101']);
  for (const node of Object.values(data.户)) {
    Object.assign(node.妻, { 当前阶段: 4, 好感值: 60, 堕落值: 40, 上次互动楼层: 4 });
    node.妻.裂缝.已确认 = true;
  }
  Object.assign(data.户['101'].妻._怀孕, { 状态: '已告知', 已曝光: true, 受孕场次标识: 'play036-real-pregnancy' });
  Object.assign(data.户['101'].妻._生产, { 状态: '孕期', 本胎序号: 1, 确认已读绝对时段: 0 });
  let calls = 0;
  e.mandatoryProducer = pregnancyKit(e, async system => {
    calls++;
    return system.includes('姐妹群热议后的角色私聊')
      ? '沈静仪:我看见群里的消息了。\n许曼君:有空的时候再聊这件事。'
      : '夏乔:检查已经结束，这次怀孕的情况已经确认。\n沈静仪:知道了，先好好休息。\n许曼君:我也看到消息了。\n夏乔:谢谢大家惦记。\n沈静仪:有新的检查安排再告诉我们。';
  }).孕产姐妹群必达拍;
  e.frequency = '关';
  e.ui.注册手机UI刷新实现(() => { throw new Error('renderer'); }, () => { throw new Error('badge'); });
  await e.tick();
  assert.equal(calls, 2, JSON.stringify(e.warnings));
  assert.ok(count(e) >= 5);
  assert.equal(savedCount(e), count(e));
  assert.equal(e.saves.length, 1);
  assert.ok(e.queuedSummaries.includes('姐妹群'));
  const firstCount = count(e);
  await e.tick();
  assert.equal(calls, 2);
  assert.equal(count(e), firstCount);
  assert.equal(e.saves.length, 1);
});

test('真实302公开交接与评论→完整节拍→UI异常→保存，重复拍不再次发布', async t => {
  t.mock.method(console, 'error', () => undefined);
  const e = createTickHost();
  const data = e.st.chat.at(-1).stat_data;
  data.系统._母亲入列 = true;
  data.系统._双重继承.阶段 = '已完成';
  data.系统._双重继承.完成楼层 = 0;
  data.系统._已完成特殊场景.push('双重继承');
  data.系统._302共居.状态 = '共居';
  data.系统._302共居.开始绝对时段 = 0;
  const comments = extract(e, '手机/节拍引擎.ts', '结局日常动态评论', {
    小生成: async () => '夏乔:以后报修直接找管理员就好。\n沈静仪:交接清楚就好。',
  });
  e.handoverProducer = extract(e, '手机/节拍引擎.ts', '生成302公开交接朋友圈', {
    朋友圈已有长期键: extract(e, '手机/节拍引擎.ts', '朋友圈已有长期键'),
    母亲公开交接朋友圈键: e.load('手机/朋友圈长期记忆.ts').构造朋友圈长期记忆事件键('302', '双重继承', '公开交接'),
    结局日常动态评论: comments,
  });
  e.frequency = '关';
  e.ui.注册手机UI刷新实现(() => { throw new Error('renderer'); }, () => { throw new Error('badge'); });
  await e.tick();
  assert.equal(e.api.读库().圈.length, 1, JSON.stringify(e.warnings));
  assert.equal(savedCount(e), 1);
  assert.equal(e.saves.length, 1);
  assert.equal(e.queuedMemory.length, 1);
  await e.tick();
  assert.equal(e.api.读库().圈.length, 1);
  assert.equal(e.saves.length, 1);
});
