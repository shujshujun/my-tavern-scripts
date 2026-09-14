/* eslint-disable import-x/no-nodejs-modules -- Node regression harness */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.getLastMessageId = () => 40;
// eslint-disable-next-line import-x/no-dynamic-require -- 固定的本地生产模块测试入口。
const load = name => require(`../../src/人妻公寓/脚本/游戏逻辑/${name}.ts`);
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => { throw new Error('unexpected database IO'); } } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 剧情线使用阻断, 进行中的剧情线 } = load('剧情线使用门');
const { 使用承接剧情票 } = load('承接剧情票使用');
const shop = load('商店系统');

function fresh() {
  const d = Schema.parse({ 户: Object.fromEntries(Object.keys(户静态表).map(m => [m, 创建户节点(0)])), 现金: 999999 });
  for (const [m, h] of Object.entries(d.户)) { h.妻.当前阶段 = 5; h.妻.阶段性癖 = 户静态表[m].招牌性癖; }
  d.系统._摄像头布设['102'] = true;
  d.系统._已完成特殊场景.push('肉偿账本');
  return d;
}

for (const [key, stage, name] of [
  ['_家庭计划', '待微信', '家庭计划'], ['_第二机位', '待赴约', '第二机位'],
  ['_不再留门', '待准备', '不再留门'], ['_许曼君分居', '独住观察中', '分居'],
  ['_许曼君离婚', '等待邀请', '离婚'], ['_安若妍不必停', '等待预约夜', '不必停'],
  ['_安若妍换掉', '等待试机日', '换掉'], ['_回国', '待父亲回信', '回国'],
  ['_双重继承', '等待三日早餐', '双重继承'],
]) {
  test(`${name}等待期仍占线，完成后释放且读口不改存档`, () => {
    const d = fresh(); d.系统[key].阶段 = stage;
    const before = structuredClone(d);
    assert.deepEqual(进行中的剧情线(d), [name]);
    assert.match(剧情线使用阻断(d, '录像带'), new RegExp(name));
    assert.equal(剧情线使用阻断(d, name), '');
    assert.deepEqual(d, before);
    const loaded = Schema.parse(structuredClone(d));
    assert.deepEqual(进行中的剧情线(loaded), [name]);
    loaded.系统[key].阶段 = '已完成';
    assert.equal(剧情线使用阻断(loaded, '录像带'), '');
  });
}

test('所有已购未用节点都不占线', () => {
  const d = fresh();
  d.背包.push('家庭计划套件', '第二机位', '许曼君分居', '不再留门', '录像带');
  d.系统._安若妍不必停.阶段 = d.系统._安若妍换掉.阶段 = d.系统._许曼君离婚.阶段 = '已购买';
  d.系统._回国.阶段 = '待使用经营归档册'; d.系统._双重继承.阶段 = '待使用双重继承';
  Object.assign(d.系统._录像带V4, { 录像带已购买: true, 入口规则版本: 1, 阶段: '待使用录像带' });
  assert.deepEqual(进行中的剧情线(d), []);
});

for (const [item, key, stage] of [['家庭计划套件', '_家庭计划', '待安装'], ['第二机位', '_第二机位', '待门缝'], ['许曼君分居', '_许曼君分居', '待初谈']]) {
  test(`${item}真实商店购买可排队，首次使用互斥、解锁和重复使用无副作用`, () => {
    const d = fresh(); d.系统._回国.阶段 = '待父亲回信';
    assert.equal(shop.购买(d, item).成功, true);
    assert.ok(d.背包.includes(item)); assert.equal(d.系统[key].阶段, '未开始');
    const bought = structuredClone(d);
    assert.equal(shop.购买(d, item).成功, false); assert.deepEqual(d, bought);
    const blocked = 使用承接剧情票(d, item);
    assert.equal(blocked.成功, false); assert.match(blocked.提示, /回国/); assert.deepEqual(d, bought);
    d.系统._回国.阶段 = '已完成';
    const cash = d.现金;
    assert.equal(使用承接剧情票(d, item).成功, true);
    assert.equal(d.系统[key].阶段, stage); assert.equal(d.现金, cash);
    const started = structuredClone(d);
    assert.equal(使用承接剧情票(d, item).成功, false); assert.deepEqual(d, started);
    assert.match(剧情线使用阻断(d, '换掉'), /请先完成/);
  });
}

const special = load('特殊场景系统');
for (const [name, use] of [
  ['不再留门', d => ({ 成功: !load('不再留门系统').不再留门动作阻断(d, '使用道具', '202'), 提示: load('不再留门系统').不再留门动作阻断(d, '使用道具', '202') })],
  ['不必停', d => load('安若妍不必停系统').执行安若妍不必停地点动作(d, '使用不必停', '301', 40)],
  ['离婚', d => load('许曼君离婚系统').执行许曼君离婚地点动作(d, '使用红色封存盒', '201', 40)],
  ['换掉', d => load('安若妍换掉系统').执行安若妍换掉地点动作(d, '使用换掉', '301', 40)],
  ['双重继承', d => load('双重继承系统').使用双重继承场景票(d, '管理员室', 40)],
  ['录像带V4', d => load('录像带V4状态').使用录像带V4(d)],
  ['旧录像带', d => special.启动录像带(d, 40)],
  ['旧录像带前置', d => special.开始录像带首送(d, '102', 40)],
  ['静音会议', d => special.打开静音会议筹备(d, '管理员室')],
  ['借种前置', d => load('借种结局系统').拆除借种摄像头(d, '101', true, true)],
  ['借种', d => load('借种结局系统').启动借种结局(d, '101', 40)],
]) {
  test(`${name}真实入口在另一线路等待时拒绝，不消费、不改进度`, () => {
    const d = fresh(); d.系统._回国.阶段 = '待父亲回信';
    const before = structuredClone(d);
    const result = use(d);
    assert.equal(result.成功, false); assert.match(result.提示, /《回国》/); assert.deepEqual(d, before);
  });
}

test('回国使用不能绕过另一线路的等待期', () => {
  const d = fresh(); d.系统._安若妍不必停.阶段 = '等待预约夜';
  const before = structuredClone(d);
  assert.match(load('回国系统').使用回国经营归档册(d, '管理员室').提示, /《不必停》/);
  assert.deepEqual(d, before);
});

test('录像带筹备与安全中断仍占线，完成解除；现代双承接完成后的旧钥匙不占线', () => {
  const d = fresh(); Object.assign(d.系统._录像带V4, { 录像带已使用: true, 阶段: '等待两日' });
  assert.match(剧情线使用阻断(d, '回国'), /录像带/);
  d.系统._录像带V4.阶段 = '已安全中断'; assert.match(剧情线使用阻断(d, '回国'), /录像带/);
  d.系统._录像带V4.阶段 = '已完成'; assert.equal(剧情线使用阻断(d, '回国'), '');
  const old = fresh(); old.系统._特殊场景前置.push('录像带:102');
  assert.match(剧情线使用阻断(old, '回国'), /录像带/);
  old.系统._第二机位.阶段 = old.系统._不再留门.阶段 = '已完成';
  assert.equal(剧情线使用阻断(old, '回国'), '');
});

test('升级旧档两条已开启路线可收尾，第三条新线被阻止；回档按快照恢复占线', () => {
  const d = fresh(); d.系统._回国.阶段 = '待父亲回信'; d.系统._安若妍不必停.阶段 = '等待预约夜';
  const before = Schema.parse(structuredClone(d));
  assert.equal(剧情线使用阻断(d, '回国'), ''); assert.equal(剧情线使用阻断(d, '不必停'), '');
  assert.match(剧情线使用阻断(d, '换掉'), /《回国》/);
  d.系统._回国.阶段 = d.系统._安若妍不必停.阶段 = '已完成';
  assert.equal(剧情线使用阻断(d, '换掉'), '');
  assert.match(剧情线使用阻断(before, '换掉'), /《不必停》/);
});

test('新背包入口接入脚本安全操作及监听生命周期', () => {
  const index = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  assert.match(index, /'人妻公寓:使用承接剧情票',\s*'人妻公寓:使用录像带'/u);
  assert.match(index, /安全操作\(\(raw, data\) => 落地\(使用承接剧情票\(data, String\(道具id\)\), raw, data\)\)/u);
});
