/* eslint-disable import-x/no-nodejs-modules -- Node-only route regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '301' } });
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
let groupText = '';
let groupCalls = 0;
require.cache[require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts')] = {
  exports: {
    小生成: async () => {
      groupCalls++;
      return groupText;
    },
    微信群文本: async text => text.split('\n').filter(Boolean),
  },
};
require.cache[require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/微信记忆上下文.ts')] = {
  exports: {
    读取群聊记忆上下文: () => ({ 群内记忆: '', 最近聊天: '' }),
  },
};
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');
const resource = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
require.cache[require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts')] = { exports: {} };
const store = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
function fresh() {
  const data = Schema.parse({ 户: { 301: 创建户节点(0) } });
  Object.assign(data.户['301'].妻, { 当前阶段: 5, 阶段性癖: '镜头高潮' });
  Object.assign(data.户['301'].夫, { _居住模式: '提前通知', 状态: '外出' });
  Object.assign(data.系统._安若妍不必停, {
    阶段: '已完成',
    江辰已明确看见: true,
    江辰已接受互不干涉: true,
    提前通知已约定: true,
  });
  data.系统._已完成特殊场景.push('不必停');
  data.现金 = 5000;
  data.玩家资源.体力.永久上限加成 = 5;
  data.玩家资源.体力.当前值 = 7;
  return data;
}
function act(data, id, place = '301', floor = 10) {
  const result = route.执行安若妍换掉地点动作(data, id, place, floor, 'chat-a@0');
  assert.equal(result.成功, true, `${id}: ${result.提示}`);
  return result;
}
function fixed(data, id, floor = 10) {
  const action = act(data, id, '301', floor);
  const old = lodash.cloneDeep(data);
  const result = route.提交安若妍换掉剧情事件(data, action.事件, '301', floor);
  assert.equal(result?.成功, true, result?.提示);
  const before = lodash.cloneDeep(data.系统._性爱场景);
  const stamina = data.玩家资源.体力.当前值;
  const settlement = resource.结算成功现场楼(data, old, {
    场景: '301',
    楼层: floor,
    行动: '完成当前固定拍',
    正文: '安若妍完成当前动作，将下一步交给玩家。',
    本楼事件: action.事件,
    妻在场: ['301'],
    实际尺度: { 301: 3 },
    资源计费: true,
  });
  assert.equal(data.玩家资源.体力.当前值, stamina);
  if (id !== '开始镜头前') assert.deepEqual(data.系统._性爱场景, before);
  assert.equal(settlement.已消费, null);
  return action.事件;
}
function throughOpening(data = fresh()) {
  assert.equal(store.购买(data, route.安若妍换掉商品ID).成功, true);
  assert.equal(data.现金, 3500);
  fixed(data, '使用换掉');
  act(data, '购买拍立得', '公寓外部');
  assert.equal(data.现金, 2900);
  assert.equal(route.执行安若妍换掉地点动作(data, '交付拍立得', '301', 11).成功, false);
  data.系统._绝对时段 = 10;
  fixed(data, '交付拍立得', 12);
  fixed(data, '预约江辰', 13);
  act(data, '登记江辰到访', '管理员室', 14);
  assert.equal(route.执行安若妍换掉地点动作(data, '等江辰回来', '301', 14).成功, false);
  data.系统._绝对时段 = data.系统._安若妍换掉.预约夜绝对时段;
  fixed(data, '等江辰回来', 15);
  fixed(data, '递相机', 16);
  fixed(data, '开始镜头前', 17);
  assert.equal(route.安若妍换掉真实亲密已绑定(data), true);
  assert.equal(data.系统._性爱场景.有效楼数, 0);
  return data;
}
function ordinary(data, floor, action = '继续与安若妍的亲密动作') {
  return resource.结算成功现场楼(data, lodash.cloneDeep(data), {
    场景: '301',
    楼层: floor,
    行动: action,
    正文: '安若妍明确继续参与，两人的亲密互动继续。',
    本楼事件: '',
    妻在场: ['301'],
    实际尺度: { 301: 3 },
    资源计费: data.系统._性爱场景.状态 !== '收尾中',
  });
}
function throughPhotos(data = throughOpening()) {
  for (let i = 0; i < 4; i++) ordinary(data, 20 + i);
  assert.equal(data.系统._安若妍换掉.阶段, '待P1');
  assert.deepEqual(resource.亲密收尾选项(data), []);
  const session = data.系统._性爱场景.场次标识;
  fixed(data, '拍第一张', 24);
  ordinary(data, 25);
  assert.equal(data.系统._安若妍换掉.阶段, '待P2');
  fixed(data, '拍最终照', 26);
  assert.equal(data.系统._性爱场景.场次标识, session);
  assert.equal(data.系统._性爱场景.参与者['301'].有效楼数, 5);
  return data;
}
test('旧档默认不开线，商店只有完整承接与真实阶段门成立才出售', () => {
  assert.equal(Schema.parse({}).系统._安若妍换掉.阶段, '未开始');
  const data = fresh();
  data.系统._安若妍不必停.江辰已明确看见 = false;
  assert.equal(route.安若妍换掉商店已上架(data), false);
  data.系统._安若妍不必停.江辰已明确看见 = true;
  assert.equal(route.购买安若妍换掉(data).成功, true);
  const state = lodash.cloneDeep(data);
  assert.equal(route.购买安若妍换掉(data).成功, false);
  assert.deepEqual(data, state);
});
test('三日开场、两次照片暂停与七点体力免费收尾，最后玩家换照才完成', () => {
  const data = throughPhotos();
  ordinary(data, 27);
  ordinary(data, 28);
  assert.equal(data.系统._安若妍换掉.阶段, '待收尾');
  assert.equal(data.系统._性爱场景.状态, '收尾中');
  ordinary(data, 29, '完成失控收尾');
  assert.equal(data.系统._安若妍换掉.阶段, '待显影');
  fixed(data, '等照片显影', 30);
  fixed(data, '回到客厅', 31);
  fixed(data, '询问换照', 32);
  assert.equal(data.系统._已完成特殊场景.includes(route.安若妍换掉商品ID), false);
  const before = lodash.cloneDeep(data);
  act(data, '换掉结婚照', '301', 33);
  assert.equal(data.系统._已完成特殊场景.includes(route.安若妍换掉商品ID), true);
  assert.equal(data.系统._安若妍换掉.最终照片素材ID, 'ARY-RPL-10-N');
  const complete = lodash.cloneDeep(data);
  act(data, '换掉结婚照', '301', 34);
  assert.deepEqual(data, complete);
  assert.equal(Schema.parse(before).系统._已完成特殊场景.includes(route.安若妍换掉商品ID), false);
});
test('未提交固定拍保留检查点，重复或旧票不推进下一步', () => {
  const data = fresh();
  route.购买安若妍换掉(data);
  const first = act(data, '使用换掉');
  const snapshot = Schema.parse(lodash.cloneDeep(data));
  assert.equal(snapshot.背包.includes(route.安若妍换掉商品ID), true);
  assert.equal(route.提交安若妍换掉剧情事件(snapshot, first.事件, '201', 10).成功, false);
  assert.equal(route.提交安若妍换掉剧情事件(snapshot, first.事件, '301', 10).成功, true);
  const after = lodash.cloneDeep(snapshot);
  assert.equal(route.提交安若妍换掉剧情事件(snapshot, first.事件, '301', 10).成功, false);
  assert.deepEqual(snapshot, after);
});
test('拍照前不能用普通行动越过暂停门，失败不增体力或有效楼', () => {
  const data = throughOpening();
  for (let i = 0; i < 4; i++) ordinary(data, 20 + i);
  const before = lodash.cloneDeep(data);
  assert.throws(() => ordinary(data, 24), /拍照动作/);
  assert.deepEqual(data, before);
});
test('P2后场次失效重排，保留采购和照片历史但不伪造结局', () => {
  const data = throughPhotos();
  data.系统._性爱场景.状态 = '空闲';
  route.同步安若妍换掉时间节点(data);
  const state = data.系统._安若妍换掉;
  assert.equal(state.阶段, '等待预约夜');
  assert.equal(state.拍立得状态, '已交付');
  assert.equal(state.拍摄历史.length, 1);
  assert.equal(state.最终照片素材ID, '');
  assert.equal(state.普通收尾已完成, false);
});

test('满意度加成不能替代七个个人有效楼；主动收尾形成第八楼', () => {
  const data = throughOpening();
  data.玩家资源.体力.当前值 = 10;
  data.系统._性爱场景.参与者['301'].满意度 = 99;
  ordinary(data, 20);
  assert.equal(route.安若妍换掉接管普通收尾(data), true);
  for (let i = 1; i < 4; i++) ordinary(data, 20 + i);
  fixed(data, '拍第一张', 24);
  ordinary(data, 25);
  fixed(data, '拍最终照', 26);
  ordinary(data, 27);
  ordinary(data, 28);
  const choices = resource.亲密收尾选项(data);
  assert.ok(choices.length > 0);
  ordinary(data, 29, `【亲密收尾:${choices[0]}】`);
  assert.equal(data.系统._安若妍换掉.阶段, '待显影');
  assert.equal(data.系统._上次性爱结果.参与者['301'].有效楼数, 8);
});

test('体力在最低楼数前耗尽只重排预约，不倒签合格收尾', () => {
  const data = throughOpening();
  data.玩家资源.体力.当前值 = 1;
  ordinary(data, 20);
  assert.equal(data.系统._安若妍换掉.阶段, '等待预约夜');
  assert.equal(data.系统._安若妍换掉.普通收尾已完成, false);
  assert.equal(data.系统._上次性爱结果.结束方式, '脚本收尾');
  assert.equal(data.户['301'].妻._怀孕.状态, '未孕');
});

test('孕态最终照片冻结，体态改变不改写背景照片版本', () => {
  const data = throughOpening();
  data.户['301'].妻._怀孕.状态 = '已告知';
  throughPhotos(data);
  assert.equal(data.系统._安若妍换掉.最终照片素材ID, 'ARY-RPL-10-P');
  data.户['301'].妻._怀孕.状态 = '未孕';
  data.系统._已完成特殊场景.push(route.安若妍换掉商品ID);
  const assets = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉资源.ts');
  assert.equal(assets.安若妍换掉背景文件(data), 'ARY-RPL-BG-BASE-POST-P');
  assert.equal(decodeURI(assets.安若妍换掉图片('ARY-RPL-10-P')), 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg5/rq091/story/安若妍换掉/ARY-RPL-10-P.webp');
  globalThis.__RQGY_ARY_REPLACE_ASSET_BASE__ = 'https://example.com/approved';
  assert.equal(assets.安若妍换掉图片('ARY-RPL-10-P'), 'https://example.com/approved/ARY-RPL-10-P.webp');
  assert.equal(assets.安若妍换掉图片('../ARY-RPL-10-N'), '');
  delete globalThis.__RQGY_ARY_REPLACE_ASSET_BASE__;
});

test('预约因来电冻结、跨日顺延，套装与已交付状态不重做', () => {
  const data = throughOpening();
  data.系统._性爱场景.状态 = '空闲';
  route.同步安若妍换掉时间节点(data);
  const appointment = data.系统._安若妍换掉.预约夜绝对时段;
  data.系统._绝对时段 = appointment;
  data.系统._待接来电.期 = 1;
  assert.equal(route.执行安若妍换掉地点动作(data, '等江辰回来', '301', 30).成功, false);
  data.系统._绝对时段 = appointment + 6;
  route.同步安若妍换掉时间节点(data);
  assert.ok(data.系统._安若妍换掉.预约夜绝对时段 > appointment);
  assert.equal(data.系统._安若妍换掉.拍立得状态, '已交付');
});

test('结局后两个开场都只建立零进度场次', () => {
  for (const choice of ['由我开始', '让她开始']) {
    const data = fresh();
    data.系统._已完成特殊场景.push(route.安若妍换掉商品ID);
    const old = lodash.cloneDeep(data);
    const result = resource.结算成功现场楼(data, old, {
      场景: '301',
      楼层: 20,
      行动: route.安若妍结局后亲密行动(choice),
      正文: '安若妍来到玩家身旁，把下一步交给玩家。',
      本楼事件: '',
      妻在场: ['301'],
      实际尺度: { 301: 2 },
      资源计费: true,
    });
    assert.equal(result.性爱开始, true);
    assert.equal(data.系统._性爱场景.参与者['301'].有效楼数, 0);
    assert.equal(data.玩家资源.体力.当前值, old.玩家资源.体力.当前值);
  }
});

const worldbook = require('../../src/人妻公寓/脚本/游戏逻辑/301换掉世界书.ts');
test('预约摄影演员门保持单一301角色，关联丈夫与在场丈夫按拍区分', () => {
  const data = fresh();
  route.购买安若妍换掉(data);
  const first = act(data, '使用换掉');
  assert.equal(route.安若妍换掉剧情演员错误(first.事件, ['301'], []), '');
  assert.notEqual(route.安若妍换掉剧情演员错误(first.事件, ['301'], ['301']), '');
  assert.notEqual(route.安若妍换掉剧情演员错误(first.事件, ['201', '301'], []), '');
});
test('世界书超时释放后续队列，迟到的修改回调不能改写新状态', async () => {
  worldbook.作废301换掉阶段世界书同步缓存();
  globalThis.SillyTavern = { getCurrentChatId: () => 'timeout-chat' };
  globalThis.getChatWorldbookName = () => 'test';
  let delayedUpdater;
  globalThis.updateWorldbookWith = async (_name, updater) => {
    delayedUpdater = updater;
    return new Promise(() => {});
  };
  const realTimer = globalThis.setTimeout;
  globalThis.setTimeout = (callback, delay, ...args) => realTimer(callback, delay === 4000 ? 10 : delay, ...args);
  try {
    assert.equal(await worldbook.同步301换掉阶段世界书(fresh()), false);
    const entries = [];
    assert.deepEqual(delayedUpdater(entries), []);
    globalThis.updateWorldbookWith = async (_name, updater) => updater(entries);
    assert.equal(await worldbook.同步301换掉阶段世界书(fresh()), true);
    assert.equal(entries.length, 1);
  } finally {
    globalThis.setTimeout = realTimer;
  }
});
test('聊天世界书失败可重试，回档重建，迟到切聊结果不写入', async () => {
  let chat = 'a';
  let entries = [];
  let fail = true;
  globalThis.SillyTavern = { getCurrentChatId: () => chat };
  globalThis.getChatWorldbookName = () => 'test';
  globalThis.updateWorldbookWith = async (_name, updater) => {
    if (fail) throw new Error('模拟存储失败');
    entries = updater(entries);
  };
  const data = fresh();
  data.系统._已完成特殊场景.push(route.安若妍换掉商品ID);
  data.系统._安若妍换掉.最终照片素材ID = 'ARY-RPL-10-N';
  data.系统._安若妍换掉.最终照片体态 = '普通';
  assert.equal(await worldbook.同步301换掉阶段世界书(data), false);
  fail = false;
  assert.equal(await worldbook.同步301换掉阶段世界书(data), true);
  assert.match(entries[0].content, /结局已经完成/);
  assert.equal(await worldbook.同步301换掉阶段世界书(fresh()), true);
  assert.match(entries[0].content, /尚未完成/);
  const superseded = worldbook.同步301换掉阶段世界书(data);
  assert.equal(await worldbook.同步301换掉阶段世界书(fresh()), true);
  assert.equal(await superseded, false);
  assert.match(entries[0].content, /尚未完成/);
  worldbook.作废301换掉阶段世界书同步缓存();
  const pending = worldbook.同步301换掉阶段世界书(data);
  chat = 'b';
  assert.equal(await pending, false);
  assert.match(entries[0].content, /尚未完成/);
});

const group = require('../../src/人妻公寓/脚本/游戏逻辑/手机/安若妍换照姐妹群.ts');
test('姐妹群先提交唯一照片，再生成完整反应；不足条数不落键，重试不回滚结局', async () => {
  const data = fresh();
  for (const id of ['101', '201']) {
    data.户[id] = 创建户节点(0);
    data.户[id].妻.当前阶段 = 5;
  }
  data.系统._已完成特殊场景.push(route.安若妍换掉商品ID);
  Object.assign(data.系统._安若妍换掉, {
    阶段: '已完成',
    完成楼层: 1,
    最终照片素材ID: 'ARY-RPL-10-N',
    最终照片体态: '普通',
  });
  const db = { 消息: [], 圈: [], 节拍: {} };
  groupCalls = 0;
  assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2), true);
  assert.equal(groupCalls, 0);
  assert.equal(db.消息[0].类, '照片');
  groupText = '夏乔:这张照片很有意思。';
  assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2), false);
  assert.equal(db.消息.length, 1);
  groupText = [
    '夏乔:原相框留着挺好。',
    '许曼君:客厅一下不一样了。',
    '安若妍:我就是想换张新的。',
    '夏乔:你们选的这张还挺有趣。',
    '许曼君:是你喜欢的风格。',
    '安若妍:现在顺眼多了。',
  ].join('\n');
  assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2), true);
  assert.equal(db.消息.length, 7);
  assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2), null);
  assert.equal(db.消息.length, 7);
  assert.equal(data.系统._已完成特殊场景.includes(route.安若妍换掉商品ID), true);
  assert.equal(group.构造换照成员差分(data, '101', db.消息).本人结局已完成, false);
  data.系统._已完成特殊场景.push('借种');
  assert.equal(group.构造换照成员差分(data, '101', db.消息).本人结局已完成, true);
});
