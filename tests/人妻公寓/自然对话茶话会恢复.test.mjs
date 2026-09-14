/* eslint-disable import-x/no-nodejs-modules -- 真实茶话会生产/存储/恢复，模型观察仅为明确夹具。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './helpers/微信茶话会环境.mjs';
import { 观察返回 } from './helpers/自然观察模型夹具.mjs';

const lines = ['母亲:不谈录像带，我们先聊你刚才提的安排。', '夏乔:那我就先听你说。'];
async function prepare(observer, content = lines) {
  const e = fixture(content, '坦白', '林舟', observer);
  await e.api.写库增量({ 新圈: [], 新消息: [{ 楼: 4, 时: 20, 会话: '姐妹群', 发: '我', 文: '你慢慢说，我在听', 标识: 'natural-player' }], 节拍改: {} });
  return e;
}

test('知情检查格式失败保留完整原稿和可见系统提示；手动恢复不重新生成 RP', async () => {
  let status = 'missing', calls = 0;
  const e = await prepare(req => { calls++; return status === 'missing' ? 'missing' : 观察返回(req); });
  assert.equal(await e.send(), true);
  const pending = e.messages().at(-1);
  assert.equal(pending.发, '系统');
  assert.deepEqual(pending.事件进度.待确认发言.消息, lines);
  assert.equal(e.events.length, 0); assert.equal(e.data.系统._回国.母亲已坦白, false);
  assert.equal(await e.restore(), false); assert.equal(calls, 1, '刷新不自动重试已经失败的识别');
  status = 'complete';
  assert.equal(await e.restore(true), true);
  assert.deepEqual(e.messages().filter(m => m.发 === '对方').map(m => m.文), lines);
  assert.equal(e.messages().some(m => m.事件进度?.待确认发言), false);
  assert.equal(e.data.系统._回国.母亲已坦白, true);
  assert.equal(e.calls, 1, '整段 RP 仅生成一次');
  assert.equal(await e.restore(true), false);
  assert.equal(calls, 3, '一次原检查、一次手动范围复核、一次实际气泡进度识别');
  assert.equal(new Set(e.messages().map(m => m.序)).size, e.messages().length);
});

for (const change of ['玩家新发言', '修改进度', '切换聊天']) {
  test(`进度补取期间${change}使旧回执失效`, async () => {
    let e, entered;
    const enteredPromise = new Promise(resolve => { entered = resolve; });
    let finish;
    const held = new Promise(resolve => { finish = resolve; });
    e = await prepare(async req => { entered(); await held; return 观察返回(req); }, ['母亲:我听见了。', '夏乔:我们接着聊。']);
    e.omitProgress = true;
    await e.send();
    const recovery = e.restore(true);
    await enteredPromise;
    if (change === '玩家新发言') await e.api.写库增量({ 新圈: [], 新消息: [{ 楼: 4, 时: 20, 会话: '姐妹群', 发: '我', 文: '先聊别的', 标识: 'new-player' }], 节拍改: {} });
    if (change === '修改进度') await e.api.修改微信消息容器(messages => messages.map(m => m.事件进度 ? { ...m, 事件进度: { ...m.事件进度, 状态: '暂缓' } } : m));
    if (change === '切换聊天') e.id = 'another';
    finish();
    assert.equal(await recovery, false);
    assert.equal(e.data.系统._回国.母亲已坦白, false);
    assert.equal(e.calls, 1);
  });
}
