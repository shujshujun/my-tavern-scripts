/* eslint-disable import-x/no-nodejs-modules -- Full production listener with isolated host persistence. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { host, clone, ticks, assertReleased } from './helpers/离婚主入口环境.mjs';
import { mountActualHostListeners } from './helpers/完整回合补验环境_PLAY002_022.mjs';
const game = 'src/人妻公寓/脚本/游戏逻辑/';

function setup() {
  const e = host();
  const schema = e.load('src/人妻公寓/schema.ts');
  const route = e.load(game + '不再留门系统.ts');
  const data = schema.Schema.parse({ 户: { 202: schema.创建户节点(0), 102: schema.创建户节点(0) }, 现金: 12000 });
  data.系统._序章完成 = true;
  data.户[202].妻.当前阶段 = 5;
  data.户[202].妻.阶段性癖 = '独占印记';
  assert.equal(route.购买不再留门物件(data, '不再留门', e.load('src/人妻公寓/不再留门契约.ts').不再留门价格.剧情道具).成功, true);
  for (let t = 0; t < 84; t++) {
    data.系统._绝对时段 = t;
    if (!route.不再留门动作阻断(data, '使用道具', '202')) break;
  }
  e.vars = { _场景: { 房间id: '202' } };
  e.st.chat.at(-1).variables = [{ stat_data: clone(data) }];
  e.load(game + '手机系统.ts').刷新红点 = () => undefined;
  e.provider = () => { throw new Error('TEST_MODEL_FAILURE'); };
  mountActualHostListeners(e);
  return e;
}
async function act(e, action) {
  await e.ctx.eventEmit('人妻公寓:不再留门动作', action);
  for (let i = 0; i < 100; i++) {
    await ticks(1);
    if (!e.main.回合进行中() && i > 5) break;
  }
  assertReleased(e);
}
async function failedStart() {
  const e = setup();
  await act(e, '使用道具');
  assert.equal(e.requests.length, 1);
  assert.ok(e.vars._即时业务撤回);
  return e;
}

test('首拍失败后暂缓真正清除本线事务和撤回票，重复点击不结算，随后可重新开始', async () => {
  const e = await failedStart();
  const before = e.read();
  await act(e, '暂缓');
  assert.equal(e.read().系统._场景剧情事务.id, '', e.warnings.join('\n'));
  assert.equal(e.read().系统._待发送事件, '');
  assert.equal(e.vars._即时业务撤回, undefined);
  assert.equal(e.read().现金, before.现金);
  assert.deepEqual(e.read().背包, before.背包);
  const paused = e.read();
  await act(e, '暂缓');
  assert.deepEqual(e.read(), paused);
  await act(e, '使用道具');
  assert.equal(e.requests.length, 2, e.warnings.join('\n'));
  assert.notEqual(e.read().系统._场景剧情事务.id, before.系统._场景剧情事务.id);
});

test('旧版无即时业务票仍可暂缓，只删除本线票并保留远处预约', async () => {
  const e = await failedStart();
  delete e.vars._即时业务撤回;
  const data = e.read();
  const scene = e.load(game + '场景剧情事务.ts');
  scene.追加等待场景剧情(data, '另一户的待演预约', '101', '远处预约');
  e.st.chat.at(-1).variables = [{ stat_data: clone(data) }];
  await act(e, '暂缓');
  assert.equal(e.read().系统._场景剧情事务.id, '');
  assert.equal(scene.读取队首场景剧情(e.read().系统._待发送事件).标题, '远处预约');
});

test('暂缓写核心失败保留原票，恢复登记及再次点击不会二次结算', async () => {
  const e = await failedStart(), before = e.read();
  e.options.mvuFail = true;
  await act(e, '暂缓');
  assert.deepEqual(e.read(), before);
  assert.ok(e.vars._即时业务撤回);
  e.options.mvuFail = false;
  await e.main.恢复即时业务撤回登记();
  await act(e, '暂缓');
  assert.equal(e.read().系统._场景剧情事务.id, '');
  assert.equal(e.vars._即时业务撤回, undefined);
});

test('暂缓核心已写而清票失败，刷新续办只消费精确匹配的控制后态', async () => {
  const e = await failedStart();
  const update = e.ctx.updateVariablesWith;
  e.ctx.updateVariablesWith = (fn, opts) => update(vars => {
    const before = vars._即时业务撤回;
    const next = fn(vars);
    if (before?.场景控制后指纹 && !next._即时业务撤回) throw new Error('TEST_TICKET_CLEANUP_FAILURE');
    return next;
  }, opts);
  await act(e, '暂缓');
  assert.equal(e.read().系统._场景剧情事务.id, '');
  assert.ok(e.vars._即时业务撤回?.场景控制后指纹);
  e.ctx.updateVariablesWith = update;
  const paused = e.read();
  e.st.chat.at(-1).variables[0].stat_data.现金++;
  await assert.rejects(e.main.恢复即时业务撤回登记());
  assert.ok(e.vars._即时业务撤回);
  e.st.chat.at(-1).variables = [{ stat_data: clone(paused) }];
  assert.equal(await e.main.恢复即时业务撤回登记(), true);
  assert.equal(e.vars._即时业务撤回, undefined);
  assert.deepEqual(e.read(), paused);
});

test('错地点、旧修订、其他路线前台和坏撤回票都不能借暂缓穿过剧情锁', async () => {
  for (const kind of ['place', 'revision', 'other', 'ticket']) {
    const e = await failedStart();
    if (kind === 'place') e.vars._场景.房间id = '101';
    if (kind === 'revision') e.st.chat.at(-1).variables[0].stat_data.系统._不再留门.修订++;
    if (kind === 'other') e.st.chat.at(-1).variables[0].stat_data.系统._场景剧情事务.内容 = '另一条路线的活动剧情';
    if (kind === 'ticket') e.vars._即时业务撤回.完整性指纹 += '-bad';
    const before = e.read();
    await act(e, '暂缓');
    assert.deepEqual(e.read(), before, kind);
  }
});

test('登记场景控制期间切聊不能把旧控制写入新聊天', async () => {
  const e = await failedStart(), before = e.read();
  e.hook = name => {
    if (name === 'chat-written' && e.vars._即时业务撤回?.场景控制后指纹) {
      e.id = 'other-chat'; e.vars = { sentinel: true };
    }
  };
  await act(e, '暂缓');
  assert.deepEqual(e.vars, { sentinel: true });
  assert.deepEqual(e.read(), before);
});
