/* eslint-disable import-x/no-nodejs-modules -- SNAP-27真实数据层/镜像/计划读口回归。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHost, clone, accept, delta, message, makePlan, productionFunction } from './helpers/微信事务恢复环境.mjs';

for (const mode of ['success', 'throw', 'swallow', 'absent', 'late-save', 'all-failed', 'session-only']) {
  test(`SNAP-27 整聊回退再恢复：${mode}`, async () => {
    const e = createHost();
    if (mode === 'all-failed') e.local.fail = e.session.fail = true;
    if (mode === 'session-only') e.local.fail = true;
    e.setMode(['late-save', 'all-failed', 'session-only'].includes(mode) ? 'throw' : mode);
    assert.equal(await accept(e), true);
    await e.api.立即持久保存手机聊天变量(e.id);
    if (mode === 'late-save') { e.setMode('success'); await e.flushTimers(); }
    const r = e.reopen(mode !== 'session-only');
    await r.api.恢复微信刷新恢复副本(r.id);
    const expected = mode === 'all-failed' ? [] : ['101'];
    assert.deepEqual(r.plan.手机邀约计划成员(r.api.读手机邀约计划()), expected);
    assert.deepEqual(r.arrivals(), expected, '实际到场读口必须与恢复接受回复一致');
    assert.equal(r.api.读库().消息.length, expected.length);
    assert.deepEqual(r.arrivals('大堂'), [], '恢复不能强行传送到错误地点');
    assert.deepEqual(r.arrivals('天台', 21), [], '目标时段之前仍未赴约');
    assert.equal(await r.api.恢复微信刷新恢复副本(r.id), false, '重复恢复幂等');
  });
}

for (const savedFirst of [false, true]) {
  test(`SNAP-27 共同成员恢复，第一成员已保存=${savedFirst}`, async () => {
    const e = createHost();
    await accept(e);
    if (savedFirst) await e.api.立即持久保存手机聊天变量(e.id);
    e.setMode('throw');
    assert.equal(await accept(e, '102'), true);
    await e.api.立即持久保存手机聊天变量(e.id);
    const r = e.reopen();
    await r.api.恢复微信刷新恢复副本(r.id);
    assert.deepEqual(r.arrivals(), ['101', '102']);
    assert.deepEqual(r.api.读库().消息.map(x => x.会话), ['101', '102']);
  });
}

test('SNAP-27 恢复尚未排队前的新共同成员CAS先消费整组镜像，不能覆盖第一成员', async () => {
  const e = createHost({ saveMode: 'throw' });
  await accept(e);
  const r = e.reopen();
  assert.equal(await accept(r, '102'), true);
  assert.deepEqual(r.arrivals(), ['101', '102']);
  assert.deepEqual(r.api.读库().消息.map(x => x.会话), ['101', '102']);
});

for (const operation of ['增量', '修改', '保存']) {
  test(`SNAP-27 普通${operation}不能把恢复的接受回复与旧计划重新拼接`, async () => {
    const e = createHost({ saveMode: 'throw' });
    await accept(e);
    const r = e.reopen();
    if (operation === '增量') await r.api.写库增量(delta([message('ordinary')]));
    if (operation === '修改') await r.api.修改微信消息容器(messages => messages.map(x => ({ ...x, 文: '已收到。' })));
    if (operation === '保存') await r.api.立即持久保存手机聊天变量(r.id);
    assert.deepEqual(r.arrivals(), ['101']);
    const again = r.reopen();
    await again.api.恢复微信刷新恢复副本(again.id);
    assert.deepEqual(again.arrivals(), ['101']);
  });
}

for (const variant of ['取消', '移除成员', '换计划', '权威回退', '清空', '缺键']) {
  test(`SNAP-27 权威${variant}胜过旧接受镜像`, async () => {
    const e = createHost();
    await accept(e); await accept(e, '102');
    await e.api.立即持久保存手机聊天变量(e.id);
    const late = clone(e.vars._微信);
    e.setMode('throw');
    if (variant === '取消') e.vars._手机邀约计划 = null;
    if (variant === '移除成员') e.vars._手机邀约计划 = e.plan.移除手机邀约计划成员(e.vars._手机邀约计划, ['101']);
    if (variant === '换计划') e.vars._手机邀约计划 = { ...makePlan('102'), 目标绝对时段: 23 };
    if (variant === '权威回退') e.vars._手机邀约计划 = makePlan('101');
    if (variant === '清空' || variant === '缺键') {
      e.vars._手机邀约计划 = null;
      if (variant === '清空') e.vars._微信 = null;
      else delete e.vars._微信;
    }
    await e.api.确认当前微信为刷新真值(e.id);
    e.mirror.写入微信刷新镜像(e.id, late, 20);
    const r = e.reopen();
    await r.api.恢复微信刷新恢复副本(r.id);
    const expected = variant === '移除成员' ? ['102'] : variant === '权威回退' ? ['101'] : [];
    assert.deepEqual(r.arrivals(), expected);
    if (variant === '换计划') assert.deepEqual(r.arrivals('天台', 23), ['102']);
    if (variant === '清空' || variant === '缺键') assert.equal(r.api.读库().消息.length, 0);
  });
}

for (const variant of ['取消', '移除成员']) {
  test(`SNAP-27 独立${variant}后的普通保存不能复活旧关联`, async () => {
    const e = createHost({ saveMode: 'throw' });
    await accept(e); await accept(e, '102');
    e.vars._手机邀约计划 = variant === '取消' ? null : e.plan.移除手机邀约计划成员(e.vars._手机邀约计划, ['101']);
    await e.api.立即持久保存手机聊天变量(e.id);
    const r = e.reopen();
    await r.api.恢复微信刷新恢复副本(r.id);
    assert.deepEqual(r.arrivals(), variant === '取消' ? [] : ['102']);
  });
}

for (const variant of ['回档', 'swipe', '删楼', '切聊']) {
  test(`SNAP-27 ${variant}拒绝旧镜像`, async () => {
    const e = createHost({ saveMode: 'throw' });
    await accept(e);
    const r = e.reopen();
    if (variant === '回档') r.st.chat.at(-1).stat_data.系统._绝对时段 = 19;
    if (variant === 'swipe') r.st.chat[4].swipe_id = 1;
    if (variant === '删楼') r.st.chat.pop();
    if (variant === '切聊') { r.id = 'other-chat'; r.st.chatMetadata.integrity = 'other-integrity'; }
    assert.equal(await r.api.恢复微信刷新恢复副本(r.id), false);
    assert.equal(r.api.读手机邀约计划(), null);
  });
}

for (const variant of ['later-commit', 'swipe', 'chat', 'integrity']) {
  test(`SNAP-27 迟到updater返回不得改写同事务身份：${variant}`, async () => {
    const e = createHost({ saveMode: 'throw' });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    e.afterUpdate = call => call === 1 ? gate : undefined;
    const first = accept(e);
    await Promise.resolve();
    assert.ok(e.vars._手机邀约计划, '第一个回调已提交，但其Promise尚未返回');
    e.afterUpdate = undefined;
    if (variant === 'later-commit') {
      e.vars._手机邀约计划 = null;
      await e.api.确认当前微信为刷新真值(e.id);
    }
    if (variant === 'swipe') e.st.chat[4].swipe_id = 1;
    if (variant === 'chat') e.id = 'other-chat';
    if (variant === 'integrity') e.st.chatMetadata.integrity = 'other-integrity';
    release(); await first;
    if (variant === 'later-commit') {
      const r = e.reopen(); await r.api.恢复微信刷新恢复副本(r.id);
      assert.deepEqual(r.arrivals(), []);
    } else {
      e.vars = {};
      assert.equal(await e.api.恢复微信刷新恢复副本(e.id), false, '旧提交不能在迟到返回时取得新时间线锚');
      assert.deepEqual(e.arrivals(), []);
    }
  });
}

test('SNAP-27 写库回调拒绝、失效和冲突均不签发未提交接受计划', async () => {
  const e = createHost();
  e.rejectUpdate = true;
  await assert.rejects(accept(e), /controlled updater/);
  assert.deepEqual(e.vars, {});
  assert.equal(e.mirror.读取微信刷新镜像(e.id, 20), null);
  e.rejectUpdate = false;
  assert.equal(await e.api.写库增量(delta([message('invalid')], { 邀约计划提交: makePlan() }), () => false), false);
  assert.deepEqual(e.vars, {});
  await accept(e);
  const before = clone(e.vars);
  assert.equal(await e.api.写库增量(delta([message('conflict')], {
    邀约计划提交: { ...makePlan('102'), 地点: '大堂' },
  })), false);
  assert.deepEqual(e.vars, before);
});

for (const variant of ['离场', '未达离场', '提交失败']) {
  test(`SNAP-27 真实连续反感生产者：${variant}`, async () => {
    const e = createHost();
    await accept(e); await accept(e, '102');
    e.vars._反感连续 = { '101': { 次数: variant === '未达离场' ? 1 : 2, 位置: '天台', 进房末楼: 0 } };
    await e.api.立即持久保存手机聊天变量(e.id);
    e.setMode('throw');
    const old = clone(e.st.chat.at(-1).stat_data);
    old.户['101'].妻.好感值 = 10;
    const next = clone(old); next.户['101'].妻.好感值 = 9;
    const run = productionFunction('回合引擎.ts', '结算连续反感', {
      ...e.globals, ...e.plan, ...e.mirror,
      当前聊天ID: () => e.id,
      读场景: () => ({ 房间id: '天台', 进房末楼: 0 }),
    });
    if (variant === '提交失败') {
      e.rejectUpdate = true;
      await assert.rejects(run(old, next, ['101', '102'], 4), /controlled updater/);
    } else {
      assert.deepEqual(await run(old, next, ['101', '102'], 4), variant === '离场' ? ['101'] : []);
    }
    const r = e.reopen(); await r.api.恢复微信刷新恢复副本(r.id);
    assert.deepEqual(r.arrivals(), variant === '离场' ? ['102'] : ['101', '102']);
  });
}

for (const variant of ['新提交', 'swipe', '切聊']) {
  test(`SNAP-27 迟到清空墓碑不得压过${variant}`, async () => {
    const e = createHost();
    await accept(e); await e.api.立即持久保存手机聊天变量(e.id);
    e.vars._微信 = null; e.vars._手机邀约计划 = null;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const delayedCall = e.updateCalls + 1;
    e.afterUpdate = call => call === delayedCall ? gate : undefined;
    const clear = e.api.确认当前微信为刷新真值(e.id);
    await Promise.resolve(); e.afterUpdate = undefined;
    if (variant === '新提交') await accept(e, '102');
    if (variant === 'swipe') e.st.chat[4].swipe_id = 1;
    if (variant === '切聊') e.id = 'other-chat';
    release();
    assert.equal(await clear, false);
    if (variant === '新提交') {
      const r = e.reopen(); await r.api.恢复微信刷新恢复副本(r.id);
      assert.deepEqual(r.arrivals(), ['102']);
    } else {
      assert.equal(e.mirror.读取微信刷新镜像(e.id, 20), null);
    }
  });
}

for (const variant of ['取消计划', '回档', 'swipe', '切聊']) {
  test(`SNAP-27 恢复回调排队后${variant}须最终复核`, async () => {
    const e = createHost({ saveMode: 'throw' });
    await accept(e);
    const r = e.reopen();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    r.beforeUpdate = () => gate;
    const recovery = r.api.恢复微信刷新恢复副本(r.id);
    r.beforeUpdate = undefined;
    if (variant === '取消计划') {
      r.vars = clone(e.vars);
      r.vars._手机邀约计划 = null;
      await r.api.确认当前微信为刷新真值(r.id);
    }
    if (variant === '回档') r.st.chat.at(-1).stat_data.系统._绝对时段 = 19;
    if (variant === 'swipe') r.st.chat[4].swipe_id = 1;
    if (variant === '切聊') r.id = 'other-chat';
    release();
    assert.equal(await recovery, false);
    assert.equal(r.api.读手机邀约计划(), null);
  });
}

test('SNAP-27 重开墓碑清掉旧预约，新修订允许新局预约', async () => {
  const e = createHost();
  await accept(e); await e.api.立即持久保存手机聊天变量(e.id);
  e.vars._微信 = null; e.vars._手机邀约计划 = null;
  e.mirror.写入微信清空镜像(e.id, 20);
  const r = e.reopen(); await r.api.恢复微信刷新恢复副本(r.id);
  assert.equal(r.api.读手机邀约计划(), null);
  assert.equal(r.api.读库().消息.length, 0);
  await accept(r, '102');
  const again = r.reopen(); await again.api.恢复微信刷新恢复副本(again.id);
  assert.deepEqual(again.arrivals(), ['102']);
});

test('SNAP-27 实际失败回合恢复原共同成员后，刷新不能再次套用离场镜像', async () => {
  const e = createHost();
  await accept(e); await accept(e, '102');
  const snapshot = clone(e.vars);
  e.vars._手机邀约计划 = e.plan.移除手机邀约计划成员(e.vars._手机邀约计划, ['101']);
  await e.api.确认当前微信为刷新真值(e.id);
  await e.api.立即持久保存手机聊天变量(e.id);
  e.setMode('throw');
  const run = productionFunction('回合引擎.ts', '恢复回合变量快照', {
    ...e.globals, ...e.mirror, 当前聊天ID: () => e.id,
    读取最近有效: () => ({ data: e.st.chat.at(-1).stat_data }),
    回合变量键: productionFunction('回合引擎.ts', '回合变量键', {}),
  });
  await run(snapshot);
  const r = e.reopen(); await r.api.恢复微信刷新恢复副本(r.id);
  assert.deepEqual(r.arrivals(), ['101', '102']);
});

for (const variant of ['存活', '未来楼', '未来时钟']) {
  test(`SNAP-27 实际裁手机时间线→保存失败→镜像恢复：${variant}`, async () => {
    const e = createHost(); await accept(e);
    if (variant === '未来楼') e.st.chat.pop();
    if (variant === '未来时钟') e.st.chat.at(-1).stat_data.系统._绝对时段 = 19;
    e.server.envelope = e.capture(); e.setMode('throw');
    const run = productionFunction('回合引擎.ts', '裁手机时间线', {
      ...e.globals, ...e.plan, ...e.api, ...e.mirror, ...e.load('手机已读水位.ts'),
      ...e.load('../../stageConfig.ts'), 当前聊天ID: () => e.id,
      // 本用例无朋友圈/节拍记录，实际裁剪函数仍执行；不声称覆盖图片游标分类。
      裁剪手机节拍水位: productionFunction('手机/节拍引擎.ts', '裁剪手机节拍水位', {}),
    });
    await e.globals.updateVariablesWith(vars => { run(vars, e.st.chat.length - 1, e.clock()); return vars; });
    await e.api.立即持久保存手机聊天变量(e.id);
    const r = e.reopen(); await r.api.恢复微信刷新恢复副本(r.id);
    assert.deepEqual(r.plan.手机邀约计划成员(r.api.读手机邀约计划()), variant === '存活' ? ['101'] : []);
    assert.equal(r.api.读库().消息.length, variant === '存活' ? 1 : 0);
  });
}

test('SNAP-27 非同修订关联包与损坏载荷均拒收，而不是降级成仅微信恢复', async () => {
  const e = createHost(); await accept(e);
  const key = '人妻公寓_微信刷新恢复_v2';
  const original = JSON.parse(e.local.getItem(key));
  for (const variant of ['计划', '修订', '字段']) {
    const packages = clone(original);
    const pkg = Object.values(packages)[0];
    if (variant === '计划') pkg.关联变量.手机邀约计划.值 = makePlan('102');
    if (variant === '修订') pkg.微信.__rqgy微信持久修订 += 1;
    if (variant === '字段') pkg.关联变量.手机邀约计划 = '损坏';
    e.local.setItem(key, JSON.stringify(packages));
    const r = e.reopen();
    assert.equal(await r.api.恢复微信刷新恢复副本(r.id), false);
    assert.equal(r.api.读手机邀约计划(), null);
  }
});

test('SNAP-27 旧版无关联镜像不猜测或覆盖独立预约，未知微信扩展保留', async () => {
  const e = createHost();
  e.vars._手机邀约计划 = makePlan('102');
  e.server.envelope = e.capture();
  const old = { 消息: [message('legacy')], 圈: [], 自定义扩展: { 值: '保留' } };
  e.mirror.推进微信持久修订(old, e.id, 20);
  e.mirror.写入微信刷新镜像(e.id, old, 20);
  const r = e.reopen();
  await r.api.恢复微信刷新恢复副本(r.id);
  assert.deepEqual(r.arrivals(), ['102']);
  assert.deepEqual(r.vars._微信.自定义扩展, { 值: '保留' });
});
