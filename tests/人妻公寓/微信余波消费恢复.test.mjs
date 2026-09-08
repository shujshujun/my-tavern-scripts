/* eslint-disable import-x/no-nodejs-modules -- SNAP-28独立消费者恢复回归，不代替SNAP-27未执行联合测试。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { clone } from './helpers/微信事务恢复环境.mjs';
import { createWaveHost, consumerKit, provider, produce } from './helpers/微信余波消费环境.mjs';

for (const kind of ['圈晒', '探针', '群议']) {
  for (const mode of ['success', 'throw', 'swallow', 'late-save', 'all-failed', 'legacy']) {
    test(`SNAP-28 ${kind}真实生产／整聊回退／恢复／再次消费：${mode}`, async () => {
      const e = await createWaveHost({ legacy: mode === 'legacy' });
      if (mode === 'all-failed') e.local.fail = e.session.fail = true;
      const calls = [], kit = consumerKit(e, provider(kind, calls));
      const draft = await produce(e, kit, kind);
      assert.equal(draft.outcome, '有新'); assert.equal(await draft.commit(), true);
      assert.equal(e.vars._换装余波[kind], true);
      assert.ok(calls.length >= 1);
      const before = { messages: e.api.读库().消息.length, moments: e.api.读库().圈.length };
      e.setMode(['late-save', 'all-failed', 'legacy'].includes(mode) ? 'throw' : mode);
      await e.api.立即持久保存手机聊天变量(e.id);
      if (mode === 'late-save') { e.setMode('success'); await e.flushTimers(); }
      const r = e.reopen(); await r.api.恢复微信刷新恢复副本(r.id);
      const survives = mode !== 'all-failed';
      assert.equal(!!r.vars._换装余波[kind], survives);
      assert.equal(r.api.读库().消息.length, survives ? before.messages : 0);
      assert.equal(r.api.读库().圈.length, survives ? before.moments : 0);
      const retryCalls = [], retryKit = consumerKit(r, provider(kind, retryCalls));
      const retry = await produce(r, retryKit, kind);
      if (survives) {
        assert.equal(retry.outcome, '无新'); assert.equal(retryCalls.length, 0);
        assert.equal(await retry.commit(), false);
        if (kind === '探针') {
          r.st.chat.at(-1).stat_data.系统._绝对时段 = 30;
          const later = await produce(r, retryKit, kind);
          assert.equal(later.delta.余波消费, undefined, '跨冷却允许普通群聊，但不得再消费同件外套探针');
        }
      } else {
        assert.equal(retry.outcome, '有新', '全部持久通道失败时允许重做未保存反馈');
        assert.equal(await retry.commit(), true);
      }
    });
  }
}

for (const variant of ['新ID', '旧字段不同', '当前缺失', '当前已过期', '丈夫疑记', '未消费渠道', '权威清回false']) {
  test(`SNAP-28 关联消费边界：${variant}`, async () => {
    const e = await createWaveHost({ legacy: variant === '旧字段不同' });
    const old = clone(e.vars._换装余波);
    const draft = await produce(e, consumerKit(e, provider('群议', [])), '群议');
    await draft.commit(); e.setMode('throw');
    if (variant === '权威清回false') {
      e.vars._换装余波 = old;
      await e.api.确认当前微信为刷新真值(e.id);
    }
    const r = e.reopen();
    if (variant === '新ID') r.vars._换装余波 = { ...old, 事件ID: 'different-event' };
    if (variant === '旧字段不同') r.vars._换装余波 = { ...old, 物: '另一件外套' };
    if (variant === '当前缺失') delete r.vars._换装余波;
    if (variant === '当前已过期') {
      for (let i = 0; i < 18; i++) r.st.chat.push(clone(r.st.chat.at(-1)));
    }
    if (variant === '丈夫疑记') r.vars._换装余波.疑记 = true;
    await r.api.恢复微信刷新恢复副本(r.id);
    if (variant === '当前缺失') {
      assert.equal(r.vars._换装余波, undefined, '镜像不是事件创建者');
    } else if (['新ID', '旧字段不同', '当前已过期', '权威清回false'].includes(variant)) {
      assert.equal(r.vars._换装余波.群议, false);
    } else {
      assert.equal(r.vars._换装余波.群议, true);
      assert.equal(r.vars._换装余波.圈晒, false);
      assert.equal(r.vars._换装余波.探针, false);
      if (variant === '丈夫疑记') assert.equal(r.vars._换装余波.疑记, true, '非手机消费位不回退');
    }
  });
}

for (const variant of ['新事件', '已消费', '失效租约', '空输出']) {
  test(`SNAP-28 真实叶子提交反例：${variant}`, async () => {
    const e = await createWaveHost();
    const valid = () => variant !== '失效租约';
    const draft = await produce(e, consumerKit(e, variant === '空输出' ? async () => '' : provider('群议', [])), '群议', valid);
    if (variant === '新事件') await e.wave.记余波('101', '夏乔换上了新外套');
    if (variant === '已消费') await e.wave.标记指定余波(e.vars._换装余波, { 群议: true });
    assert.equal(await draft.commit(), false);
    assert.equal(e.api.读库().消息.length, 0);
  });
}

for (const kind of ['圈晒', '探针', '群议']) {
  for (const condition of ['未发酵', '已过期', '私密']) {
    test(`SNAP-28 ${kind}仍保留${condition}资格门`, async () => {
      const e = await createWaveHost({ privateWave: condition === '私密', age: condition === '未发酵' ? 2 : condition === '已过期' ? 18 : 3 });
      await e.api.写库增量({ 新圈: [], 新消息: [], 节拍改: { [e.api.楼务群节拍键]: 20, [e.api.姐妹群节拍键]: 20 } });
      const calls = [], draft = await produce(e, consumerKit(e, provider(kind, calls)), kind);
      assert.equal(draft.outcome, kind === '群议' && condition === '私密' ? '有新' : '无新');
    });
  }
}
