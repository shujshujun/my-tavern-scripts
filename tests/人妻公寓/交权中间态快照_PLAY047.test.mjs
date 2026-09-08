/* eslint-disable import-x/no-nodejs-modules -- PLAY-047：真实路线及完整快照，宿主只提供内存读取。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
let room = '101';
globalThis.getVariables = () => ({ _场景: { 房间id: room, 房间类型: '户', 进房末楼: 40 } });
globalThis.getLastMessageId = () => 40;
globalThis.SillyTavern = { name1: '林舟', chat: [], getCurrentChatId: () => 'play047-memory' };
const noIO = () => { throw new Error('PLAY047_EXTERNAL_IO_FORBIDDEN'); };
globalThis.insertOrAssignVariables = noIO;
globalThis.updateVariablesWith = noIO;
globalThis.generate = noIO;
globalThis.generateRaw = noIO;
globalThis.fetch = noIO;
const schema = require('../../src/人妻公寓/schema.ts');
const { Schema, 创建户节点 } = schema;
const schemaAlias = require.resolve('../../src/人妻公寓/schema');
require.cache[schemaAlias] = { id: schemaAlias, filename: schemaAlias, loaded: true, exports: schema };
const route = require('../../src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 双重继承后父亲已退出管理 } = require('../../src/人妻公寓/脚本/游戏逻辑/父亲联络策略.ts');
const clone = value => lodash.cloneDeep(value);
const reload = value => Schema.parse(JSON.parse(JSON.stringify(value)));
const beforeStages = ['未开始', '待使用双重继承', '待父亲回楼', '公共区域检查中', '待管理员室交权', '管理员室剧情中'];
const midStages = ['待领取公寓楼总钥匙', '等待三日早餐', '早餐剧情中', '待机场视频', '视频已预约', '待总钥匙归位'];

function fresh() {
  const data = Schema.parse({
    现金: 10000, 胜任度: 100, 户: { 302: 创建户节点(0) },
    系统: { _绝对时段: 20, _母亲入列: true, _已完成特殊场景: ['回国'], _回国: { 阶段: '已完成' } },
  });
  data.户['302'].妻.当前阶段 = 5;
  return data;
}
function snapshot(data, place = '101') {
  room = place;
  const before = clone(data);
  const result = 组公寓快照([{ role: 'user', content: '今天有什么安排？' }], data, 40, '', {
    焦点: [], 在场: [], 妻在场: [], 夫在场: [],
  });
  assert.deepEqual(data, before, '快照不可写路线、考核、道具或世界钟');
  return result;
}
function management(data, place = '101') {
  const line = snapshot(data, place).split('\n').find(x => x.startsWith('【管理权·当前事实】'));
  assert.ok(line, '完整快照必须含当前管理权事实');
  return line;
}
function assertMid(data, place = '101') {
  const line = management(data, place);
  assert.match(line, /日常管理已经交给玩家/);
  assert.match(line, /普通事务不再等待父亲远程批准/);
  assert.match(line, /重大产权与业主事项/);
  assert.match(line, /经营考核仍按实时规则/);
  assert.doesNotMatch(line, /父亲仍保留公寓管理审核权|父亲在海外|只保留低频家常/);
  assert.equal(route.双重继承已完成(data), false);
  assert.equal(双重继承后父亲已退出管理(data), false, '不提前触发正式退出经营考核');
}
for (const stage of beforeStages) {
  test(`PLAY-047 交权前${stage}保留原审核说明，不凭道具提前完成`, () => {
    const data = fresh();
    data.系统._双重继承.阶段 = stage;
    data.背包.push(route.公寓楼总钥匙ID);
    assert.match(management(data), /父亲仍保留公寓管理审核权/);
    assert.equal(route.双重继承已完成(data), false);
  });
}
for (const stage of midStages) {
  test(`PLAY-047 中间态${stage}承认日常交权、保留未完成结局`, () => {
    const data = fresh();
    data.系统._双重继承.阶段 = stage;
    for (const place of ['101', '管理员室', '302']) assertMid(data, place);
  });
}
for (const legacy of [false, true]) {
  test(`PLAY-047 ${legacy ? '旧完成ID' : '当前完成阶段'}保留既有最终投影`, () => {
    const data = fresh();
    if (legacy) data.系统._已完成特殊场景.push(route.双重继承完成ID);
    else data.系统._双重继承.阶段 = '已完成';
    assert.match(management(data), /独立管理公寓|退出楼务审核/);
    assert.equal(双重继承后父亲已退出管理(data), true);
    assert.doesNotMatch(snapshot(data, '302'), /父亲仍保留公寓管理审核权/);
  });
}
function toH1() {
  const data = fresh();
  assert.equal(route.购买双重继承场景票(data, 1500).成功, true);
  assert.equal(route.使用双重继承场景票(data, '管理员室', 1).成功, true);
  if (data.系统._双重继承.阶段 === '待父亲回楼') {
    data.系统._绝对时段 = data.系统._双重继承.最早父亲到楼时段;
    assert.equal(route.同步双重继承时间节点(data, 2).成功, true);
  }
  assert.equal(data.系统._双重继承.阶段, '公共区域检查中');
  for (const place of route.双重继承公共区域) {
    assert.equal(route.执行双重继承地点动作(data, '检查公共区域', place, 10).成功, true);
  }
  const result = route.执行双重继承地点动作(data, '管理员室交权', '管理员室', 20);
  assert.equal(result.成功, true, result.提示);
  return { data, event: result.事件 };
}
function toH2() {
  const { data, event } = toH1();
  const first = route.提交双重继承剧情事件(data, event, '管理员室', 21);
  assert.equal(first.成功, true, first.提示);
  return { data, event: first.后续剧情.事件 };
}
test('PLAY-047 真实购买/八区/H1/H2：仅H2成功后改变快照，未提前领钥匙', () => {
  const { data, event } = toH2();
  assert.match(management(data), /父亲仍保留公寓管理审核权/);
  const h2 = route.提交双重继承剧情事件(data, event, '管理员室', 22);
  assert.equal(h2.成功, true, h2.提示);
  assert.equal(data.系统._双重继承.阶段, '待领取公寓楼总钥匙');
  assert.equal(data.背包.includes(route.公寓楼总钥匙ID), false);
  assert.match(route.双重继承档案提示(data).状态, /管理权已经交接/);
  assertMid(data);
  const before = clone(data);
  assert.equal(route.提交双重继承剧情事件(data, event, '管理员室', 22).变动, false);
  assert.deepEqual(data, before);
});
test('PLAY-047 H2错地点、旧时段及未提交候选均不能制造已交权状态', () => {
  const { data, event } = toH2(), before = clone(data);
  assert.equal(route.提交双重继承剧情事件(data, event, '302', 22).成功, false);
  assert.deepEqual(data, before);
  const changed = reload(data);
  changed.系统._绝对时段++;
  const changedBefore = clone(changed);
  assert.equal(route.提交双重继承剧情事件(changed, event, '管理员室', 22).成功, false);
  assert.deepEqual(changed, changedBefore);
  const abandoned = clone(data);
  route.提交双重继承剧情事件(abandoned, event, '管理员室', 22);
  assert.match(management(data), /父亲仍保留公寓管理审核权/);
  assert.deepEqual(data, before);
});
test('PLAY-047 真实领钥匙、早餐五拍及视频预约始终保持交权中间事实', () => {
  const { data, event } = toH2();
  assert.equal(route.提交双重继承剧情事件(data, event, '管理员室', 22).成功, true);
  assert.equal(route.执行双重继承地点动作(data, '领取总钥匙', '管理员室', 23).成功, true);
  assertMid(data, '302');
  assert.equal(route.双重继承父亲暂住302(data), true);
  data.系统._绝对时段 = data.系统._双重继承.最早早餐日 * 6;
  let result = route.执行双重继承地点动作(data, '家庭早餐', '302', 30);
  assert.equal(result.成功, true, result.提示);
  let count = 0;
  while (result.事件 || result.后续剧情?.事件) {
    assertMid(data, '302');
    const next = result.事件 ?? result.后续剧情.事件;
    result = route.提交双重继承剧情事件(data, next, '302', 31 + count++);
    assert.equal(result.成功, true, result.提示);
    assert.ok(count <= 5);
  }
  assert.equal(count, 5);
  assert.equal(data.系统._双重继承.阶段, '待机场视频');
  assertMid(data);
  data.系统._绝对时段 = data.系统._双重继承.最早视频时段;
  assert.equal(route.同步双重继承时间节点(data, 40).成功, true);
  assert.equal(data.系统._双重继承.阶段, '视频已预约');
  assertMid(data);
});
test('PLAY-047 Schema重载/回档和切换读取对象不缓存或串用未来交权事实', () => {
  const { data, event } = toH2(), before = reload(data);
  route.提交双重继承剧情事件(data, event, '管理员室', 22);
  assertMid(reload(data));
  assert.match(management(before), /父亲仍保留公寓管理审核权/);
  assertMid(data);
  assert.match(management(fresh()), /父亲仍保留公寓管理审核权/);
});
