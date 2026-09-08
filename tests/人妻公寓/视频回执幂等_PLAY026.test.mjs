/* eslint-disable import-x/no-nodejs-modules -- Persistence and replay regression for the production state owner. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { host, clone, ticks } from './helpers/离婚主入口环境.mjs';
import { mountActualHostListeners } from './helpers/完整回合补验环境_PLAY002_022.mjs';

function setup() {
  const e = host();
  const { Schema } = e.load('src/人妻公寓/schema.ts');
  const api = e.load('src/人妻公寓/脚本/游戏逻辑/母亲视频通话系统.ts');
  const data = Schema.parse({ 系统: { _绝对时段: 88 } });
  assert.equal(api.预约母亲视频通话终幕(data, 'replay-call', 32).成功, true);
  assert.equal(api.接听母亲视频通话终幕(data).成功, true);
  data.系统._父亲通话.待回复 = { 序号: 0, 玩家说: '' };
  const append = (target = data, player = '收到。', father = '好。') => {
    target.系统._父亲通话.记录.push({ 谁: '我', 文: player }, { 谁: '父', 文: father });
  };
  const register = (target = data, player = '收到。', father = '好。') => api.登记母亲视频通话父亲回复(target, player, father);
  const finish = (target = data) => {
    const ticket = register(target);
    assert.equal(ticket.成功, true, ticket.提示);
    const start = api.开始母亲视频通话现场正文(target, ticket.标识, ticket.序号);
    assert.equal(start.成功, true);
    assert.equal(api.完成母亲视频通话现场正文(target, ticket.标识, ticket.序号, start.请求世代, '本轮现场已完成。').成功, true);
  };
  return { api, data, Schema, append, register, finish, env: e };
}

test('PLAY026故障注入：现场完成后的同一回执不能再推进存档', () => {
  const e = setup(); e.append(); e.finish();
  const before = clone(e.data);
  assert.equal(e.register().成功, false);
  assert.deepEqual(clone(e.data), before);
});

test('PLAY026反例：下一轮真实保存的相同两句话仍可正常推进', () => {
  const e = setup(); e.append(); e.finish(); e.append(); e.finish();
  assert.equal(e.data.系统._母亲视频通话终幕.微信轮次, 2);
  assert.equal(e.data.系统._母亲视频通话终幕.现场正文记录.length, 2);
});

test('PLAY026序列化重载保留已消费事实，回到未登记快照仍可恢复', () => {
  const e = setup(); e.append();
  const pending = e.Schema.parse(JSON.parse(JSON.stringify(e.data)));
  e.finish();
  const loaded = e.Schema.parse(JSON.parse(JSON.stringify(e.data)));
  assert.equal(e.register(loaded).成功, false);
  assert.equal(e.register(pending).成功, true);
});

test('PLAY026等待/生成/失败及重试都不能重复登记，原现场票可重试', () => {
  const e = setup(); e.append(); const ticket = e.register();
  assert.equal(e.register().成功, false);
  const start = e.api.开始母亲视频通话现场正文(e.data, ticket.标识, ticket.序号);
  assert.equal(e.register().成功, false);
  assert.equal(e.api.标记母亲视频通话现场正文失败(e.data, ticket.标识, ticket.序号, start.请求世代, '生成取消').成功, true);
  assert.equal(e.register().成功, false);
  assert.equal(e.api.开始母亲视频通话现场正文(e.data, ticket.标识, ticket.序号).成功, true);
});

test('PLAY026多轮缺口或待回复未完成不猜测登记', () => {
  const e = setup(); e.append(); e.append();
  const before = clone(e.data);
  assert.equal(e.register().成功, false);
  assert.deepEqual(clone(e.data), before);
  const f = setup(); f.append();
  f.data.系统._父亲通话.待回复 = { 序号: 3, 玩家说: '新问题' };
  assert.equal(f.register().成功, false);
});

test('PLAY026结束请求后旧回执不冒充最后确认，真实告别可继续', () => {
  const e = setup(); e.append(); e.finish();
  assert.equal(e.api.请求结束母亲视频通话(e.data).成功, true);
  const before = clone(e.data);
  assert.equal(e.register().成功, false);
  assert.deepEqual(clone(e.data), before);
  e.append(); e.finish();
  assert.equal(e.data.系统._母亲视频通话终幕.状态, '等待最终回答');
});

test('PLAY026错配文本及普通电话不能认领视频回执', () => {
  const e = setup(); e.append();
  assert.equal(e.register(e.data, '另一个回答').成功, false);
  e.data.系统._父亲通话.模式 = '';
  assert.equal(e.register().成功, false);
});

test('PLAY026完整index拒绝其他通话和聊天的同文回执', async () => {
  const e = setup(); e.append(); const env = e.env;
  e.data.系统._序章完成 = true;
  e.data.系统._数据版本 = env.load('src/人妻公寓/schema.ts').当前MVU数据版本;
  env.st.chat[32].variables = [{ stat_data: clone(e.data) }];
  env.vars = { _场景: { 房间id: '302' } };
  mountActualHostListeners(env);
  const before = clone(env.read());
  await env.ctx.eventEmit('人妻公寓:母亲视频通话父亲回复已保存', 'another-call', 2, '收到。', '好。', env.id, 0);
  await env.ctx.eventEmit('人妻公寓:母亲视频通话父亲回复已保存', 'replay-call', 2, '收到。', '好。', 'another-chat', 0);
  await ticks(20);
  assert.deepEqual(clone(env.read()), before);
});
