/* eslint-disable import-x/no-nodejs-modules -- Full game entry with isolated host ports. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { host, clone, assertReleased } from './helpers/离婚主入口环境.mjs';
import { mountActualHostListeners } from './helpers/完整回合补验环境_PLAY002_022.mjs';

const game = 'src/人妻公寓/脚本/游戏逻辑/';
function setup() {
  const e = host();
  const { Schema, 创建户节点 } = e.load('src/人妻公寓/schema.ts');
  const data = Schema.parse({
    户: { 101: 创建户节点(0), 201: 创建户节点(0) },
    背包: ['拼合的信·夏乔', '红酒'],
    现金: 20060,
  });
  data.系统._序章完成 = true;
  data.户[101].妻.裂缝.碎片进度 = 4;
  data.户[201].妻.裂缝.碎片进度 = 1;
  e.vars = { _场景: { 房间id: '101' } };
  e.st.chat[31].variables = [{ stat_data: clone(data) }];
  e.st.chat[32].variables = [{ stat_data: clone(data) }];
  e.provider = () => '你把信收好，走到窗边，静静地看了一会楼下的街道。';
  e.load(`${game}手机系统.ts`).刷新红点 = () => undefined;
  e.load(`${game}手机系统.ts`).立即持久保存手机聊天变量 = async () => e.st.saveChat();
  e.load(`${game}数据库桥.ts`).同步社交轨迹 = async () => '失败';
  mountActualHostListeners(e);
  return e;
}
function assertOpen(e) {
  assert.equal(e.read().户[101].妻.裂缝.已确认, true, e.warnings.join('\n'));
  assert.equal(e.read().户[101].妻.裂缝.碎片进度, 4);
  assert.deepEqual(Array.from(e.read().背包), ['红酒']);
}

test('真实读信入口：正文重掷与完整撤回保留揭晓，清除原场景票，旧票仍可校验业务前态', async () => {
  const e = setup();
  await e.ctx.eventEmit('人妻公寓:读信', '101');
  assert.equal(e.requests.length, 1, e.warnings.join('\n'));
  assertOpen(e);
  await e.main.重掷回合();
  assertOpen(e);
  const record = clone(e.vars._上次回合.chat快照._即时业务撤回);
  await e.main.回档至(32);
  assertOpen(e);
  assert.equal(e.read().系统._场景剧情事务.id, '');
  assert.equal(e.read().系统._待发送事件, '');
  assert.equal(e.vars._上次回合, null);
  assert.equal(e.load(`${game}即时业务撤回.ts`).即时业务锚仍是业务前状态(record, e.read()), true);
  const tampered = e.read();
  tampered.现金++;
  assert.equal(e.load(`${game}即时业务撤回.ts`).即时业务锚仍是业务前状态(record, tampered), false);
  assertReleased(e);
});

test('旧档只凭现有已确认态建镜像，回到调查前保留打开；未完成线索、阶段与现金按目标恢复', async () => {
  const e = setup();
  const before = e.st.chat[31].variables[0].stat_data;
  before.户[101].妻.裂缝.碎片进度 = 0;
  const after = e.st.chat[32].variables[0].stat_data;
  after.户[101].妻.裂缝.已确认 = true;
  after.户[101].妻.当前阶段 = 2;
  after.户[201].妻.裂缝.碎片进度 = 3;
  after.现金 += 50;
  await e.main.回档至(31);
  assertOpen(e);
  assert.equal(e.read().户[101].妻.当前阶段, 0);
  assert.equal(e.read().户[201].妻.裂缝.碎片进度, 1);
  assert.equal(e.read().现金, 20060);
  const reloaded = setup();
  reloaded.vars = clone(e.vars);
  reloaded.st.chat = clone(e.st.chat);
  await reloaded.main.回档至(30);
  assert.equal(reloaded.vars.人妻公寓_晋阶镜像.户[101].裂缝确认, true);
});

test('读信撤回中途保存失败：保留同一旧票，恢复登记可收口且不会关裂缝或复活信件', async () => {
  const e = setup();
  await e.ctx.eventEmit('人妻公寓:读信', '101');
  const phone = e.load(`${game}手机系统.ts`);
  phone.立即持久保存手机聊天变量 = async () => { throw new Error('injected phone save failure'); };
  await e.main.回档至(32);
  assertOpen(e);
  assert.ok(e.vars._上次回合);
  phone.立即持久保存手机聊天变量 = async () => e.st.saveChat();
  assert.equal(await e.main.恢复即时业务撤回登记(), true, e.warnings.join('\n'));
  assertOpen(e);
  assert.equal(e.vars._上次回合, null);
  assert.equal(e.read().系统._场景剧情事务.id, '');
});

for (const onlyZero of [false, true]) {
  test(`完整重开入口/仅0楼=${onlyZero}：每次都请求数据库清场并重置裂缝，连续重开可完成`, async () => {
    const e = setup();
    if (onlyZero) e.st.chat = [clone(e.st.chat[32])];
    const guard = e.load(`${game}守护系统.ts`);
    guard.镜像直写('101', { 裂缝确认: true, 碎片: 4, 阶段: 3 });
    await guard.等待晋阶镜像写入();
    const db = e.load(`${game}数据库桥.ts`);
    const observed = [];
    db.等待数据库时间线就绪 = async ms => {
      observed.push({ ms, floor: e.st.chat.length - 1 });
      return false;
    };
    for (let i = 0; i < 2; i++) {
      await e.main.重开一局();
      assert.equal(e.st.chat.length, 1, e.warnings.join('\n'));
      assert.equal(e.read().户[101].妻.裂缝.已确认, false);
      assert.equal(e.read().户[101].妻.裂缝.碎片进度, 0);
      assert.equal(e.read().系统._序章完成, false);
      assertReleased(e);
    }
    assert.deepEqual(observed, [
      { ms: 8000, floor: 0 },
      { ms: 8000, floor: 0 },
    ]);
    assert.equal(e.trace.filter(x => x.op === 'absent-db-invalidation').length, 2);
    assert.equal(e.trace.filter(x => x.name === '人妻公寓:已重开').length, 2);
  });
}
