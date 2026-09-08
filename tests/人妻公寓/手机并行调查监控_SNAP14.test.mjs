/* eslint-disable import-x/no-nodejs-modules -- 真实调查与隔离事务；宿主变量、浏览器事件和模型I/O隔离。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHost, clone } from './helpers/微信事务恢复环境.mjs';

function fixture(clock = 4, installed = true) {
  const e = createHost();
  const events = new EventTarget();
  e.window.addEventListener = events.addEventListener.bind(events);
  e.window.removeEventListener = events.removeEventListener.bind(events);
  e.window.document = Object.assign(new EventTarget(), { querySelectorAll: () => [], documentElement: null });
  e.globals.insertOrAssignVariables = patch => { Object.assign(e.vars, clone(patch)); };
  const data = e.st.chat.at(-1).stat_data;
  data.系统._绝对时段 = clock; data.背包 = ['针孔摄像头'];
  e.vars._场景 = { 房间id: '302' };
  e.detective = e.load('侦探系统.ts'); e.clockAPI = e.load('楼层时钟.ts'); e.data = data;
  if (installed) {
    e.detective.布设摄像头(data, '102');
    assert.equal(data.系统._摄像头布设['102'], true); assert.equal(data.背包.length, 0);
  }
  e.run = () => e.detective.查看摄像头(data, '102', 4);
  return e;
}
for (const [clock, state] of [[1, '外出'], [4, '在家'], [5, '睡眠']]) test(`SNAP14 自然时段${clock}，丈夫${state}`, () => {
  const e = fixture(clock);
  assert.equal(e.clockAPI.妻位置推算('102', clock, e.data.户['102']), '102');
  assert.equal(e.clockAPI.丈夫在楼(e.data.户['102'], '102', clock), state);
  const result = e.run(); assert.equal(result.拍, 0); assert.ok(result.事件);
  if (state === '外出') assert.match(result.事件, /独自在家/);
  else { assert.doesNotMatch(result.事件, /独自在家/); assert.ok(result.事件.includes(state)); assert.match(result.事件, /镜头/); }
  assert.match(result.事件, /他人在302自己屋里/);
  const actors = e.load('snapshotSystem.ts').解析事件角色绑定(result.事件, e.data);
  assert.deepEqual(actors.在场妻, []); assert.deepEqual(actors.在场夫, []);
  assert.ok(actors.关联妻.includes('102'));
  assert.deepEqual(e.vars._侦探.偷窥待选, { 门牌: '102', 拍: 0 });
});
test('SNAP14 未安装/妻子不在家的硬门不烧冷却', () => {
  const missing = fixture(4, false); assert.match(missing.run().提示, /没有你的眼睛/); assert.equal(missing.vars._侦探, undefined);
  const away = fixture(0); assert.notEqual(away.clockAPI.妻位置推算('102', 0, away.data.户['102']), '102');
  assert.match(away.run().提示, /不在家/); assert.equal(away.vars._侦探, undefined);
});
test('SNAP14 安装不重复消费、调查冷却和细节选择保留', async () => {
  const e = fixture(); e.data.背包.push('针孔摄像头');
  assert.match(e.detective.布设摄像头(e.data, '102').提示, /已经装过/); assert.equal(e.data.背包.length, 1);
  e.run(); assert.match(e.run().提示, /过阵子/);
  const correct = e.load('../../stageConfig.ts').查裂缝('102').偷窥[0].正确;
  const selected = e.detective.偷窥选细节(e.data, '102', correct);
  assert.equal(e.data.户['102'].妻.裂缝.碎片进度, 1);
  assert.ok(e.vars._侦探.偷窥待选);
  await selected.提交后?.(); assert.equal(e.vars._侦探.偷窥待选, null);
});
test('SNAP14 已确认后的普通观察保持已有空间语义', () => {
  const e = fixture(); e.data.户['102'].妻.裂缝.已确认 = true;
  const result = e.run(); assert.equal(result.监控日常观察, true);
  assert.match(result.事件, /丈夫当前为“在家”/); assert.doesNotMatch(result.事件, /独自在家/);
});
test('SNAP14 未提交的真实隔离事务回滚软计数后可重试', async () => {
  const e = fixture(); const engine = e.load('隔离事件引擎.ts');
  const before = clone(e.vars), dataBefore = clone(e.data);
  const identity = engine.捕获隔离时间线身份();
  const transaction = await engine.准备隔离事件事务({ 身份: identity, 操作仍有效: () => true, 提交前数据: e.data });
  const first = e.run(); assert.ok(first.事件); assert.ok(e.vars._侦探.偷窥待选);
  await engine.回滚隔离事件事务({ 事务: transaction.记录, 身份: identity, 操作仍有效: () => true });
  assert.deepEqual(e.vars, before); assert.deepEqual(e.data, dataBefore);
  const retry = e.run(); assert.equal(retry.拍, first.拍); assert.equal(retry.事件, first.事件);
});
test('SNAP14 未来软冷却的旧档回档不阻塞当前调查', () => {
  const e = fixture(); e.vars._侦探 = { 偷窥上次: { 102: 100 } };
  assert.ok(e.run().事件); assert.equal(e.vars._侦探.偷窥上次['102'], 4);
});
