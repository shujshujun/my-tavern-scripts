/* eslint-disable import-x/no-nodejs-modules -- Node-only wardrobe behavior regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
let vars = {};
globalThis.getVariables = () => vars;
globalThis.getLastMessageId = () => 1;
globalThis.insertOrAssignVariables = () => undefined;
globalThis.SillyTavern = { chat: [{}, {}] };
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
// 与 webpack 的扩展名顺序保持一致，避免 Node 把 schema.json 当成 schema.ts 导入。
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 道具表 } = require('../../src/人妻公寓/stageConfig.ts');
const {
  读取衣柜库存,
  读取衣柜物品,
  登记衣柜赠礼,
  执行衣柜动作,
  衣柜预览SKU,
  衣柜预览穿戴,
  当前可见立绘SKU,
} = require('../../src/人妻公寓/脚本/游戏逻辑/衣柜系统.ts');
const { 送礼 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 构造AI可写变量视图 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 捕获保护快照, 回滚保护字段, 清保护快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts');

function 数据() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 102: 创建户节点(0), 302: 创建户节点(0) } });
  for (const [m, 户] of Object.entries(data.户)) {
    Object.assign(户.妻, 户静态表[m].初始, { 当前阶段: 5 });
    户.妻.裂缝.已确认 = true;
  }
  vars = { _场景: { 房间id: '101', 进房末楼: 0 }, _粘滞: { 位置: '101', 楼: 0, 们: ['101'] } };
  return data;
}
function 动作(data, id, 操作 = '穿戴', 门牌 = '101') {
  return 执行衣柜动作(data, { 门牌, 道具id: id, 操作 });
}
function 入库(data, ...ids) {
  for (const id of ids) 登记衣柜赠礼(data.户['101'].妻, id);
}

test('每名角色都有自己的初始衣柜，未入住和其他角色库存不可借用', () => {
  const data = 数据();
  入库(data, '碎花连衣裙');
  assert.equal(读取衣柜物品(data, '101').length, 4);
  assert.equal(读取衣柜物品(data, '102').length, 3);
  assert.deepEqual(读取衣柜物品(data, '201'), []);
  const before = lodash.cloneDeep(data);
  assert.equal(动作(data, '碎花连衣裙', '穿戴', '102').成功, false);
  assert.equal(动作(data, '初始外装_夏乔', '穿戴', '102').成功, false);
  assert.deepEqual(data, before);
});

test('连续赠衣会保留旧衣；重复赠送退回，不重复消费或登记首穿', async () => {
  const data = 数据();
  data.背包.push('碎花连衣裙', '开叉旗袍', '碎花连衣裙');
  assert.equal((await 送礼(data, '碎花连衣裙', '101')).成功, true);
  assert.equal((await 送礼(data, '开叉旗袍', '101')).成功, true);
  assert.deepEqual(data.户['101'].妻._衣柜, ['碎花连衣裙', '开叉旗袍']);
  const before = lodash.cloneDeep(data);
  assert.equal((await 送礼(data, '碎花连衣裙', '101')).成功, false);
  assert.deepEqual(data, before);
});

test('母亲破墙礼物也收进她的库存，但不擅自重演或改写破墙穿戴', async () => {
  const data = 数据();
  data.户['302'].妻.当前阶段 = 0;
  const oldOutfit = data.户['302'].妻.外装;
  data.背包.push('碎花连衣裙');
  assert.equal((await 送礼(data, '碎花连衣裙', '302')).成功, true);
  assert.deepEqual(data.户['302'].妻._衣柜, ['碎花连衣裙']);
  assert.equal(data.户['302'].妻.外装, oldOutfit);
  assert.equal(data.户['101'].妻._衣柜.length, 0);
});

test('旧档只从当前槽和精确佩饰描述恢复，不因旧立绘标记或 AI 文本凭空解锁', () => {
  const data = 数据();
  const 妻 = data.户['101'].妻;
  delete 妻._衣柜;
  妻._穿着SKU = { 外装: '碎花连衣裙', _立绘: '开叉旗袍' };
  妻.内衣 = 道具表.蕾丝套装.服饰.穿着描述;
  妻.特殊 = [道具表.猫耳发箍.服饰.穿着描述, '剧情保留记录'];
  assert.deepEqual(读取衣柜库存(妻), ['碎花连衣裙', '猫耳发箍']);
  const original = lodash.cloneDeep(data);
  const restored = Schema.parse(data);
  assert.deepEqual(data, original);
  assert.deepEqual(读取衣柜库存(restored.户['101'].妻), ['碎花连衣裙', '猫耳发箍']);
  assert.equal(动作(restored, '初始外装_夏乔').成功, true);
  assert.ok(restored.户['101'].妻._衣柜.includes('碎花连衣裙'));
  assert.equal(动作(restored, '碎花连衣裙').成功, true);
});

test('换装只改穿戴与库存，不耗时、不消耗背包、不更改赠礼/剧情/余波', () => {
  const data = 数据();
  入库(data, '碎花连衣裙', '开叉旗袍');
  const before = lodash.cloneDeep(data);
  assert.equal(动作(data, '碎花连衣裙').变动, true);
  assert.equal(data.户['101'].妻.外装, 道具表.碎花连衣裙.服饰.穿着描述);
  assert.equal(data.户['101'].妻._穿着SKU._立绘, '碎花连衣裙');
  assert.equal(动作(data, '开叉旗袍').成功, true);
  assert.equal(动作(data, '碎花连衣裙').成功, true);
  assert.equal(动作(data, '碎花连衣裙').变动, undefined);
  const after = lodash.cloneDeep(data);
  after.户['101'].妻 = before.户['101'].妻;
  assert.deepEqual(after, before);
  assert.equal(动作(data, '初始外装_夏乔').成功, true);
  assert.equal(data.户['101'].妻.外装, 户静态表['101'].初始.外装);
  assert.equal(data.户['101'].妻._穿着SKU._立绘, '');
  assert.deepEqual(data.户['101'].妻._衣柜, ['碎花连衣裙', '开叉旗袍']);
});

test('外衣遮挡内衣，不受选择顺序影响，隐藏的内衣仍保留穿戴', () => {
  const data = 数据();
  入库(data, '碎花连衣裙', '蕾丝套装');
  动作(data, '碎花连衣裙');
  动作(data, '蕾丝套装');
  assert.equal(data.户['101'].妻._穿着SKU._立绘, '碎花连衣裙');
  assert.equal(data.户['101'].妻._穿着SKU.内衣, '蕾丝套装');
  assert.equal(动作(data, '碎花连衣裙').变动, undefined);
  assert.equal(data.户['101'].妻._穿着SKU._立绘, '碎花连衣裙');
  动作(data, '蕾丝套装');
  动作(data, '蕾丝套装', '卸下');
  assert.equal(data.户['101'].妻._穿着SKU._立绘, '碎花连衣裙');
  assert.equal(data.户['101'].妻.内衣, '');
});

test('明确脱下外衣才显示内衣；穿回外衣后仍保留内衣，存档重载结果一致', () => {
  const data = 数据();
  入库(data, '碎花连衣裙', '蕾丝套装');
  动作(data, '碎花连衣裙');
  动作(data, '蕾丝套装');
  assert.equal(动作(data, '碎花连衣裙', '脱下外装').成功, true);
  assert.equal(data.户['101'].妻.外装, '');
  assert.equal(data.户['101'].妻._穿着SKU.外装, '');
  assert.equal(当前可见立绘SKU(data.户['101'].妻), '蕾丝套装');
  assert.equal(当前可见立绘SKU(Schema.parse(JSON.parse(JSON.stringify(data))).户['101'].妻), '蕾丝套装');
  const before = lodash.cloneDeep(data);
  assert.equal(动作(data, '初始内衣_夏乔').成功, false);
  assert.equal(动作(data, '蕾丝套装', '卸下').成功, false);
  assert.deepEqual(data, before);
  assert.equal(动作(data, '初始外装_夏乔').成功, true);
  assert.equal(当前可见立绘SKU(data.户['101'].妻), '');
  assert.equal(data.户['101'].妻._穿着SKU.内衣, '蕾丝套装');
});

test('未选择可显示内衣时不能脱外衣，也不能借此移除剧情绑定外衣', () => {
  const data = 数据();
  const before = lodash.cloneDeep(data);
  assert.equal(动作(data, '初始外装_夏乔', '脱下外装').成功, false);
  assert.deepEqual(data, before);
  入库(data, '碎花连衣裙', '蕾丝套装');
  动作(data, '碎花连衣裙');
  动作(data, '蕾丝套装');
  道具表.碎花连衣裙.服饰.不可卸下 = true;
  try {
    const locked = lodash.cloneDeep(data);
    assert.equal(动作(data, '碎花连衣裙', '脱下外装').成功, false);
    assert.deepEqual(data, locked);
  } finally { delete 道具表.碎花连衣裙.服饰.不可卸下; }
});

test('旧档残留内衣主图缓存不能越过外衣；缺失槽位不等于已经脱衣', () => {
  const data = 数据();
  const wife = data.户['101'].妻;
  wife._穿着SKU = { 外装: '碎花连衣裙', 内衣: '蕾丝套装', _立绘: '蕾丝套装' };
  assert.equal(当前可见立绘SKU(wife), '碎花连衣裙');
  delete wife._穿着SKU.外装;
  assert.equal(当前可见立绘SKU(wife), '');
  wife.外装 = '';
  assert.equal(当前可见立绘SKU(wife), '');
});

test('赠送内衣只更新内衣槽，外衣仍决定立绘', async () => {
  const data = 数据();
  data.背包.push('碎花连衣裙', '蕾丝套装');
  await 送礼(data, '碎花连衣裙', '101');
  await 送礼(data, '蕾丝套装', '101');
  assert.equal(data.户['101'].妻._穿着SKU._立绘, '碎花连衣裙');
  assert.equal(data.户['101'].妻._穿着SKU.内衣, '蕾丝套装');
});

test('首次赠送已提供成品的道具直接套用同款造型，再赠外衣统一结束旧造型', async () => {
  const data = 数据();
  const wife = data.户['101'].妻;
  data.背包.push('碎花连衣裙', '猫耳发箍', '烈色口红', '真丝吊带睡裙', '开叉旗袍');
  await 送礼(data, '碎花连衣裙', '101');
  assert.equal((await 送礼(data, '猫耳发箍', '101')).成功, true);
  assert.equal(wife._穿着SKU.外装, '初始外装_夏乔');
  assert.ok(wife.特殊.includes(道具表.猫耳发箍.服饰.穿着描述));
  assert.ok(wife._衣柜.includes('碎花连衣裙'));
  assert.equal((await 送礼(data, '烈色口红', '101')).成功, true);
  assert.equal(wife._穿着SKU.妆容, '烈色口红');
  assert.ok(!wife.特殊.includes(道具表.猫耳发箍.服饰.穿着描述));
  await 送礼(data, '真丝吊带睡裙', '101');
  assert.equal(wife._穿着SKU.妆容, '烈色口红');
  assert.equal((await 送礼(data, '开叉旗袍', '101')).成功, true);
  assert.equal(wife._穿着SKU.妆容, '初始妆容_夏乔');
  assert.equal(wife._穿着SKU._立绘, '开叉旗袍');
  assert.equal(wife._穿着SKU.内衣, '真丝吊带睡裙');
  assert.equal(data.背包.length, 0);
  assert.equal((data.系统._待发送事件.match(/【首穿】/g) ?? []).length, 5);
});

test('赠礼造型不能替下绑定服装，失败时背包、库存和首穿剧情原样保留', async () => {
  const data = 数据();
  入库(data, '碎花连衣裙');
  动作(data, '碎花连衣裙');
  data.背包.push('猫耳发箍');
  道具表.碎花连衣裙.服饰.不可卸下 = true;
  try {
    const before = lodash.cloneDeep(data);
    assert.equal((await 送礼(data, '猫耳发箍', '101')).成功, false);
    assert.deepEqual(data, before);
  } finally { delete 道具表.碎花连衣裙.服饰.不可卸下; }
});

test('内衣预览遵循遮挡规则，脱外衣后的试穿也不修改存档', () => {
  const data = 数据();
  入库(data, '碎花连衣裙', '真丝吊带睡裙', '蕾丝套装');
  动作(data, '碎花连衣裙');
  动作(data, '真丝吊带睡裙');
  const wife = data.户['101'].妻;
  const item = 读取衣柜物品(data, '101').find(项 => 项.id === '蕾丝套装');
  const dressed = lodash.cloneDeep(data);
  assert.equal(衣柜预览SKU(wife, item), '碎花连衣裙');
  assert.deepEqual(data, dressed);
  动作(data, '碎花连衣裙', '脱下外装');
  const uncovered = lodash.cloneDeep(data);
  assert.equal(衣柜预览SKU(wife, item), '蕾丝套装');
  assert.equal(当前可见立绘SKU(wife), '真丝吊带睡裙');
  assert.deepEqual(data, uncovered);
  const initial = 读取衣柜物品(data, '101').find(项 => 项.id === '初始外装_夏乔');
  assert.equal(衣柜预览SKU(wife, initial), '');
  assert.deepEqual(data, uncovered);
});

test('直接选择默认内衣的预览和落地必须与卸下旧内衣一致，不能残留旧主立绘', () => {
  const data = 数据();
  入库(data, '碎花连衣裙', '蕾丝套装');
  动作(data, '碎花连衣裙');
  动作(data, '蕾丝套装');
  const comparison = lodash.cloneDeep(data);
  const initial = 读取衣柜物品(data, '101').find(项 => 项.id === '初始内衣_夏乔');
  assert.equal(衣柜预览SKU(data.户['101'].妻, initial), '碎花连衣裙');
  assert.equal(动作(data, initial.id).成功, true);
  assert.equal(动作(comparison, '蕾丝套装', '卸下').成功, true);
  assert.deepEqual(data.户['101'].妻, comparison.户['101'].妻);
});

test('佩饰摘戴保持库存、容量及未知剧情记录，不抢服装主立绘', () => {
  const data = 数据();
  入库(data, '碎花连衣裙', '猫耳发箍', 'choker颈环');
  动作(data, '碎花连衣裙');
  data.户['101'].妻.特殊 = ['剧情记录甲', '剧情记录乙', '剧情记录丙'];
  assert.equal(动作(data, '猫耳发箍').成功, true);
  const before = lodash.cloneDeep(data);
  assert.equal(动作(data, 'choker颈环').成功, false);
  assert.deepEqual(data, before);
  assert.equal(动作(data, '猫耳发箍', '卸下').成功, true);
  assert.equal(动作(data, 'choker颈环').成功, true);
  assert.ok(data.户['101'].妻._衣柜.includes('猫耳发箍'));
  assert.equal(data.户['101'].妻._穿着SKU._立绘, '碎花连衣裙');
  const item = 读取衣柜物品(data, '101').find(项 => 项.id === 'choker颈环');
  assert.equal(衣柜预览SKU(data.户['101'].妻, item), '碎花连衣裙');
  assert.ok(data.户['101'].妻.特殊.includes('剧情记录甲'));
});

test('组合预览保留当前服装和其他道具，不修改真实穿戴或库存', () => {
  const data = 数据();
  入库(data, '碎花连衣裙', 'choker颈环', '猫耳发箍');
  动作(data, '碎花连衣裙');
  动作(data, 'choker颈环');
  const before = lodash.cloneDeep(data);
  const item = 读取衣柜物品(data, '101').find(项 => 项.id === '猫耳发箍');
  const preview = 衣柜预览穿戴(data.户['101'].妻, item);
  assert.equal(preview.主立绘SKU, '碎花连衣裙');
  assert.deepEqual(preview.特殊, [道具表.choker颈环.服饰.穿着描述, 道具表.猫耳发箍.服饰.穿着描述]);
  assert.deepEqual(data, before);
});

test('显式剧情绑定物件不能卸下，普通衣物不被一概锁死', () => {
  const data = 数据();
  入库(data, '猫耳发箍');
  动作(data, '猫耳发箍');
  道具表.猫耳发箍.服饰.不可卸下 = true;
  try {
    const before = lodash.cloneDeep(data);
    assert.equal(动作(data, '猫耳发箍', '卸下').成功, false);
    assert.deepEqual(data, before);
  } finally {
    delete 道具表.猫耳发箍.服饰.不可卸下;
  }
  assert.equal(动作(data, '猫耳发箍', '卸下').成功, true);
});

test('活动场景、医院和非法操作失败时不改变库存与穿戴', () => {
  for (const block of [
    data => {
      data.系统._特殊场景.id = '静音会议';
    },
    data => {
      data.系统._荣耀洞拍 = 0;
    },
    data => {
      data.户['101'].妻.裂缝.已确认 = false;
    },
    data => {
      data.户['101'].妻._生产.状态 = '住院中';
    },
  ]) {
    const data = 数据();
    入库(data, '碎花连衣裙');
    block(data);
    const before = lodash.cloneDeep(data);
    assert.equal(动作(data, '碎花连衣裙').成功, false);
    assert.deepEqual(data, before);
  }
  const data = 数据();
  const before = lodash.cloneDeep(data);
  assert.equal(动作(data, '碎花连衣裙').成功, false);
  assert.equal(动作(data, '碎花连衣裙', '伪造').成功, false);
  assert.equal(执行衣柜动作(data, null).成功, false);
  assert.deepEqual(data, before);
});

test('序列化重载保存个人库存，回档不会复活未来赠礼', () => {
  const data = 数据();
  入库(data, '碎花连衣裙');
  动作(data, '碎花连衣裙');
  const save = JSON.stringify(data);
  入库(data, '开叉旗袍');
  动作(data, '开叉旗袍');
  const restored = Schema.parse(JSON.parse(save));
  assert.deepEqual(restored.户['101'].妻._衣柜, ['碎花连衣裙']);
  assert.equal(restored.户['101'].妻._穿着SKU._立绘, '碎花连衣裙');
  assert.equal(动作(restored, '开叉旗袍').成功, false);
});

test('衣柜由脚本保护，AI 不可篡改库存或玩家选定的初始服装', () => {
  const base = 数据();
  入库(base, '碎花连衣裙');
  动作(base, '初始外装_夏乔');
  const candidate = lodash.cloneDeep(base);
  candidate.户['101'].妻._衣柜.push('开叉旗袍');
  candidate.户['101'].妻.外装 = 'AI擅自换装';
  捕获保护快照(base);
  try {
    回滚保护字段(candidate, ['101'], { 妻: ['101'], 夫: [], 亲密妻: [] });
  } finally {
    清保护快照();
  }
  assert.deepEqual(candidate.户['101'].妻._衣柜, base.户['101'].妻._衣柜);
  assert.equal(candidate.户['101'].妻.外装, base.户['101'].妻.外装);
});

test('玩家脱下初始外衣后，AI 不能擅自穿回外衣或抹掉内衣，现场快照不残留旧衣', () => {
  const base = 数据();
  入库(base, '真丝吊带睡裙');
  动作(base, '真丝吊带睡裙');
  assert.equal(动作(base, '初始外装_夏乔', '脱下外装').成功, true);
  const candidate = lodash.cloneDeep(base);
  candidate.户['101'].妻.外装 = 户静态表['101'].初始.外装;
  candidate.户['101'].妻.内衣 = '';
  candidate.户['101'].妻._穿着SKU = {};
  捕获保护快照(base);
  try {
    回滚保护字段(candidate, ['101'], { 妻: ['101'], 夫: [], 亲密妻: [] });
  } finally {
    清保护快照();
  }
  assert.equal(candidate.户['101'].妻.外装, '');
  assert.equal(candidate.户['101'].妻.内衣, base.户['101'].妻.内衣);
  assert.equal(当前可见立绘SKU(candidate.户['101'].妻), '真丝吊带睡裙');
  const snapshot = 组公寓快照([{ role: 'user', content: '在客厅和她聊一会儿。' }], candidate, 0);
  assert.match(snapshot, /【当前着装·唯一现场事实】着装:你送的真丝吊带睡裙/);
  assert.ok(!snapshot.includes(户静态表['101'].初始.外装));
});

test('库存从一件增加到全部商品，正文快照和 AI 变量视图逐字不变', () => {
  const data = 数据();
  入库(data, '碎花连衣裙');
  动作(data, '碎花连衣裙');
  const messages = [{ role: 'user', content: '在客厅和她聊一会儿。' }];
  const beforePrompt = 组公寓快照(messages, data, 0);
  const beforeView = 构造AI可写变量视图(data, { 妻: ['101'], 夫: [], 亲密妻: [] });
  const allIds = Object.values(道具表)
    .filter(配 => 配.服饰)
    .map(配 => 配.id);
  入库(data, ...allIds);
  assert.equal(组公寓快照(messages, data, 0), beforePrompt);
  assert.deepEqual(构造AI可写变量视图(data, { 妻: ['101'], 夫: [], 亲密妻: [] }), beforeView);
  assert.doesNotMatch(JSON.stringify(beforeView), /_衣柜/);
});

test('宿主换装入口必须经过安全操作、同场终审和落地，不能触发即时开演', () => {
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const start = source.indexOf("eventOn('人妻公寓:衣柜动作'");
  const end = source.indexOf("eventOn('人妻公寓:送礼'", start);
  const handler = source.slice(start, end);
  assert.match(handler, /安全操作/);
  assert.match(handler, /妻在当前场景/);
  assert.match(handler, /落地\(执行衣柜动作/);
  assert.doesNotMatch(handler, /即时开演|generate|记余波|接入线路/);
});

// 执行产品源码中的安全操作/落地和换装 listener。只替换宿主环境，MVU 队列与写入使用真实模块。
function 事务环境() {
  const ts = require('typescript');
  const io = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const tree = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  const functions = new Map();
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && ['安全操作', '落地'].includes(node.name?.text)) {
      functions.set(node.name.text, node.getText(tree));
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  const start = source.indexOf("eventOn('人妻公寓:衣柜动作'");
  const end = source.indexOf("eventOn('人妻公寓:送礼'", start);
  const state = {
    saved: 数据(),
    timeline: 0,
    busy: false,
    present: true,
    fail: false,
    writes: 0,
    messages: [],
    action: null,
  };
  入库(state.saved, '碎花连衣裙', '开叉旗袍');
  globalThis.updateVariablesWith = async fn => {
    vars = fn(vars);
  };
  globalThis.Mvu = {
    replaceMvuData: async raw => {
      if (state.fail) throw new Error('模拟存储失败/超时');
      state.saved = lodash.cloneDeep(raw.stat_data);
      state.writes += 1;
    },
  };
  const scope = {
    _: lodash,
    console: { warn() {}, error() {} },
    ...io,
    当前时间线切换世代: () => state.timeline,
    当前聊天ID: () => 'wardrobe-test',
    时间线切换协调中: () => false,
    回合进行中: () => state.busy,
    前台生成租约持有中: () => false,
    读取最近有效: () => ({ raw: { stat_data: lodash.cloneDeep(state.saved) }, data: Schema.parse(state.saved) }),
    读取活动场景剧情: () => null,
    读取队首场景剧情: () => null,
    等待场景剧情阻塞当前场景: () => false,
    合并同场景剧情事件: () => '',
    提取新增待发送事件: () => '',
    读场景: () => ({ 房间id: '101' }),
    当前楼层: () => 1,
    捕获保护快照: () => {},
    场景剧情锁定提示: () => '',
    妻在当前场景: () => state.present,
    eventEmit: (_name, message) => state.messages.push(message),
    eventOn: (_name, handler) => {
      state.action = handler;
    },
    执行衣柜动作,
  };
  vm.runInNewContext(
    ts.transpileModule([...functions.values(), source.slice(start, end)].join('\n'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText,
    scope,
  );
  state.submit = (id, 操作 = '穿戴') => state.action({ 门牌: '101', 道具id: id, 操作 });
  return state;
}

test('真实宿主提交链：保存失败不改变存档，可安全重试，成功后才显示成功提示', async () => {
  const env = 事务环境();
  const before = lodash.cloneDeep(env.saved);
  env.fail = true;
  await env.submit('碎花连衣裙');
  assert.deepEqual(env.saved, before);
  assert.equal(env.writes, 0);
  assert.ok(env.messages.some(message => /结果没记上/.test(message)));
  assert.ok(!env.messages.some(message => /已换上/.test(message)));
  env.fail = false;
  await env.submit('碎花连衣裙');
  assert.equal(env.saved.户['101'].妻._穿着SKU._立绘, '碎花连衣裙');
  assert.equal(env.writes, 1);
});

test('真实宿主提交链：并发点击串行取最新存档，重复穿戴不重复提交', async () => {
  const env = 事务环境();
  await Promise.all([env.submit('碎花连衣裙'), env.submit('开叉旗袍')]);
  assert.equal(env.saved.户['101'].妻._穿着SKU._立绘, '开叉旗袍');
  assert.deepEqual(env.saved.户['101'].妻._衣柜, ['碎花连衣裙', '开叉旗袍']);
  assert.equal(env.writes, 2);
  await env.submit('开叉旗袍');
  assert.equal(env.writes, 2);
});

test('真实宿主提交链：脱外衣写入失败可重试，随后并发穿回外衣仍保留内衣', async () => {
  const env = 事务环境();
  入库(env.saved, '真丝吊带睡裙');
  await env.submit('真丝吊带睡裙');
  const before = lodash.cloneDeep(env.saved);
  env.fail = true;
  await env.submit('初始外装_夏乔', '脱下外装');
  assert.deepEqual(env.saved, before);
  env.fail = false;
  await env.submit('初始外装_夏乔', '脱下外装');
  assert.equal(当前可见立绘SKU(env.saved.户['101'].妻), '真丝吊带睡裙');
  await Promise.all([env.submit('碎花连衣裙'), env.submit('开叉旗袍')]);
  assert.equal(当前可见立绘SKU(env.saved.户['101'].妻), '开叉旗袍');
  assert.equal(env.saved.户['101'].妻._穿着SKU.内衣, '真丝吊带睡裙');
});

test('真实宿主提交链：固定造型失败不部分保存，并发套用以最新完整造型落地', async () => {
  const env = 事务环境();
  入库(env.saved, '猫耳发箍', '烈色口红', '真丝吊带睡裙');
  await env.submit('真丝吊带睡裙');
  const before = lodash.cloneDeep(env.saved);
  env.fail = true;
  await env.submit('猫耳发箍', '套用造型');
  assert.deepEqual(env.saved, before);
  assert.ok(!env.messages.some(message => /已套用/.test(message)));
  env.fail = false;
  await Promise.all([env.submit('猫耳发箍', '套用造型'), env.submit('烈色口红', '套用造型')]);
  assert.equal(env.saved.户['101'].妻._穿着SKU.妆容, '烈色口红');
  assert.equal(env.saved.户['101'].妻._穿着SKU.内衣, '真丝吊带睡裙');
  assert.ok(!env.saved.户['101'].妻.特殊.includes(道具表.猫耳发箍.服饰.穿着描述));
  assert.ok(env.saved.户['101'].妻._衣柜.includes('猫耳发箍'));
});

test('真实宿主提交链：忙态、离场、排队后切分支均拒绝穿戴，不污染新时间线', async () => {
  const env = 事务环境();
  const before = lodash.cloneDeep(env.saved);
  env.busy = true;
  await env.submit('碎花连衣裙');
  env.busy = false;
  env.present = false;
  await env.submit('碎花连衣裙');
  env.present = true;
  let release;
  const io = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
  const gate = io.排队MVU操作(
    () =>
      new Promise(resolve => {
        release = resolve;
      }),
  );
  await Promise.resolve();
  await Promise.resolve();
  const pending = env.submit('碎花连衣裙');
  env.timeline += 1;
  release();
  await Promise.all([gate, pending]);
  assert.deepEqual(env.saved, before);
  assert.equal(env.writes, 0);
});
