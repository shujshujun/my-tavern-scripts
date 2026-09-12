/* eslint-disable import-x/no-nodejs-modules -- Full engine, MVU reader and host listener regression. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { host, clone, assertReleased } from './helpers/离婚主入口环境.mjs';
import { mountActualHostListeners } from './helpers/完整回合补验环境_PLAY002_022.mjs';

const game = 'src/人妻公寓/脚本/游戏逻辑/';
function setup({ partial = false } = {}) {
  const e = host();
  const { Schema, 创建户节点 } = e.load('src/人妻公寓/schema.ts');
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 现金: 20060, 背包: ['正红色口红'] });
  data.系统._序章完成 = true;
  e.id = 'gift-rollback';
  e.vars = { _场景: { 房间id: '101' }, _粘滞: { 位置: '101', 楼: 32, 们: ['101'] } };
  e.st.chat[31].variables = [{ stat_data: clone(data) }];
  e.st.chat[32].variables = [
    { stat_data: partial ? { 现金: 20060, 系统: { _数据版本: 9 } } : clone(data), marker: 'tail-container' },
  ];
  e.provider = () => '夏乔接过你递来的东西，低头看了一会，笑着向你道谢。';
  e.load(`${game}手机系统.ts`).刷新红点 = () => undefined;
  e.load(`${game}数据库桥.ts`).同步社交轨迹 = async () => '失败';
  mountActualHostListeners(e);
  return { e, data };
}

test('空撤回记录 null 与缺失含义一致：普通成功回合能撤回，损坏对象仍在删楼前拒绝', async () => {
  const { e, data } = setup();
  e.vars._上次回合 = { 回合前末楼: 31, chat快照: { _即时业务撤回: null } };
  await e.main.回档至(31);
  assert.equal(e.st.chat.length, 32, e.warnings.join('\n'));
  assert.equal(e.read().现金, data.现金);
  const bad = setup().e;
  bad.vars._上次回合 = { 回合前末楼: 31, chat快照: { _即时业务撤回: { 版本: 1 } } };
  await bad.main.回档至(31);
  assert.equal(bad.st.chat.length, 33);
  assert.match(bad.warnings.join('\n'), /撤回记录损坏/);
});

for (const partial of [false, true]) {
  test(`送礼完整入口：${partial ? '不完整末楼回退' : '完整末楼'}只扣一次物品，正文成功可完整撤回`, async () => {
    const { e, data } = setup({ partial });
    await e.ctx.eventEmit('人妻公寓:送礼', { 道具id: '正红色口红', 门牌: '101' });
    assert.equal(e.requests.length, 1, e.warnings.join('\n'));
    assert.equal(e.read().背包.length, 0);
    assert.equal(e.read().现金, data.现金);
    assertReleased(e);
    await e.main.回档至(32);
    assert.equal(e.st.chat.length, 33, e.warnings.join('\n'));
    assert.deepEqual(Array.from(e.read().背包), Array.from(data.背包));
    assert.equal(e.read().现金, data.现金);
    assert.equal(e.read().系统._场景剧情事务.id, '');
    assertReleased(e);
  });
}

test('即时业务捕获与操作读取使用同一有效快照；不完整末楼不得补成新局数据', () => {
  const { e, data } = setup({ partial: true });
  const io = e.load(`${game}mvuIO.ts`);
  const current = io.读取最近有效();
  assert.equal(current.data.现金, data.现金);
  const record = e.main.捕获即时业务撤回准备(current.data);
  assert.equal(record.锚楼, 32);
  assert.deepEqual(clone(record.业务前数据), data);
  assert.equal(current.raw.marker, 'tail-container');
  const changed = clone(current.data);
  changed.现金 += 1;
  assert.throws(() => e.main.捕获即时业务撤回准备(changed), /已经不同步/);
});

test('指定锚楼的有效快照读取不越过锚点、不接受未来版本或全损坏档', () => {
  const { e, data } = setup({ partial: true });
  const io = e.load(`${game}mvuIO.ts`);
  e.st.chat[32].variables[0].stat_data = { ...clone(data), 现金: 99999 };
  assert.equal(io.读最近有效stat(31).现金, data.现金);
  e.st.chat[32].variables[0].stat_data.系统._数据版本 = 999;
  assert.throws(() => io.读最近有效stat(32));
  e.st.chat[31].variables[0].stat_data = { 系统: { _数据版本: 9 } };
  assert.throws(() => io.读最近有效stat(31));
});
