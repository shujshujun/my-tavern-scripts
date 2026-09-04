/* eslint-disable import-x/no-nodejs-modules -- Node-only behavior regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '201' } });
globalThis.insertOrAssignVariables = () => undefined;
globalThis.getLastMessageId = () => 90;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 读取世界时间, 每天时段数 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const {
  许曼君分居任务ID,
  许曼君会面通知ID,
  许曼君钥匙封存袋ID,
  许曼君分居地点动作,
  执行许曼君分居地点动作,
  提交许曼君分居剧情事件,
  解析许曼君分居剧情事件,
  绑定许曼君分居亲密场次,
  结算许曼君分居亲密收尾,
  同步许曼君分居时间节点,
  许曼君分居时间动作阻断原因,
  读取201留宿可用状态,
  许曼君分居已完成,
} = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
const { 购买 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');

function 建数据() {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 现金: 12000 });
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].妻.阶段性癖 = 户静态表['201'].招牌性癖;
  data.系统._已完成特殊场景.push('肉偿账本');
  data.玩家资源.精力.当前值 = 8;
  data.玩家资源.体力.当前值 = 8;
  return data;
}

function 克隆(data) {
  return Schema.parse(lodash.cloneDeep(data));
}

function 找动作时段(data, 地点, id, 起点 = data.系统._绝对时段, 跨度 = 每天时段数 * 56) {
  for (let abs = Math.max(0, 起点); abs < Math.max(0, 起点) + 跨度; abs += 1) {
    data.系统._绝对时段 = abs;
    if (许曼君分居地点动作(data, 地点).some(item => item.id === id)) return abs;
  }
  assert.fail(`从时段${起点}起找不到${地点}动作：${id}`);
}

function 做动作(data, 地点, id, 楼层 = -1) {
  assert.ok(许曼君分居地点动作(data, 地点).some(item => item.id === id), `${地点}缺少动作${id}`);
  const result = 执行许曼君分居地点动作(data, id, 地点, 楼层);
  assert.equal(result.成功, true, result.提示);
  return result;
}

function 交一拍(data, event, 地点, 楼层, text = '我在听。') {
  const result = 提交许曼君分居剧情事件(data, event, 地点, 楼层, text);
  assert.equal(result?.成功, true, result?.提示);
  return result;
}

function 下一拍(data, result, 地点, 楼层, text = '我在听。') {
  assert.ok(result.后续剧情?.事件, '应存在下一拍');
  return 交一拍(data, result.后续剧情.事件, 地点, 楼层, text);
}

function 推进至外住登记() {
  const data = 建数据();
  assert.equal(购买(data, 许曼君分居任务ID).成功, true);
  assert.equal(data.系统._许曼君分居.阶段, '待初谈');
  找动作时段(data, '201', '开始第一幕初谈');
  const start = 做动作(data, '201', '开始第一幕初谈');
  const p1 = 交一拍(data, start.事件, '201', 1);
  const p2 = 下一拍(data, p1, '201', 2);
  const p3 = 下一拍(data, p2, '201', 3, '你先亲口告诉他，需要我时再叫我进去。');
  assert.equal(p3.后续剧情, undefined);
  assert.equal(data.系统._许曼君分居.初谈参与方式, '先夫妻谈');
  assert.equal(data.系统._许曼君分居.阶段, '待三人摊牌');
  assert.equal(data.背包.includes(许曼君会面通知ID), false);
  assert.equal(data.背包.includes(许曼君钥匙封存袋ID), false);

  data.系统._绝对时段 = data.系统._许曼君分居.预约时段;
  const meeting = 做动作(data, '201', '开始第二幕摊牌');
  const m1 = 交一拍(data, meeting.事件, '201', 4);
  const m2 = 下一拍(data, m1, '201', 5);
  const m3 = 下一拍(data, m2, '201', 6, '我会亲口承认自己的位置。');
  const m4 = 下一拍(data, m3, '201', 7);
  assert.equal(m4.后续剧情, undefined);
  assert.equal(data.系统._许曼君分居.工资卡状态, '已归还赵国强');
  assert.equal(data.系统._许曼君分居.丈夫已知玩家关系, true);
  assert.equal(data.系统._许曼君分居.丈夫已选择外住, true);
  assert.equal(data.系统._许曼君分居.阶段, '待登记外住');
  assert.match(许曼君分居时间动作阻断原因(data), /登记|钥匙/);

  做动作(data, '管理员室', '登记外住并封存钥匙');
  assert.equal(data.系统._许曼君分居.阶段, '独住观察中');
  assert.equal(data.系统._许曼君分居.钥匙位置, '管理员室201钥匙格');
  assert.equal(data.系统._许曼君分居.钥匙用途, '临时外住');
  assert.equal(data.系统._许曼君分居.封条修订, 1);
  assert.equal(data.户['201'].夫._居住模式, '路线外住');
  return data;
}

function 推进至第三幕完成() {
  const data = 推进至外住登记();
  找动作时段(data, '201', '把201留给她一晚');
  做动作(data, '201', '把201留给她一晚');
  const startDay = 读取世界时间(data.系统._许曼君分居.独住夜起点).天数;
  data.系统._绝对时段 += 每天时段数;
  const synced = 同步许曼君分居时间节点(data);
  assert.equal(synced.变动, true);
  assert.equal(data.系统._许曼君分居.独住夜已完成, true);
  assert.ok(读取世界时间(data).天数 > startDay);
  assert.equal(data.系统._许曼君分居.阶段, '待独住后谈话');

  找动作时段(data, '201', '开始第三幕独住后谈话');
  const room = 做动作(data, '201', '开始第三幕独住后谈话');
  const r1 = 交一拍(data, room.事件, '201', 8);
  const r2 = 下一拍(data, r1, '201', 9);
  assert.equal(r2.后续剧情, undefined);
  assert.equal(data.系统._许曼君分居.出车表已收起, true);
  assert.equal(data.系统._许曼君分居.共同夜晚状态, '待接受');
  assert.equal(data.系统._许曼君分居.阶段, '待最终取物');
  assert.ok(data.系统._许曼君分居.预约时段 >= data.系统._许曼君分居.外住起点 + 每天时段数 * 2);
  return data;
}

function 完成共同夜晚(data) {
  找动作时段(data, '201', '接受共同夜晚', data.系统._绝对时段);
  const opening = 做动作(data, '201', '接受共同夜晚');
  const o1 = 交一拍(data, opening.事件, '201', 10);
  const o2 = 下一拍(data, o1, '201', 11, '今晚我留下。');
  assert.equal(o2.后续剧情, undefined);
  assert.equal(data.系统._许曼君分居.共同夜晚状态, '进行中');

  const session = 'xumj-four-act-night';
  Object.assign(data.系统._性爱场景, { 状态: '进行中', 场次标识: session, 主焦点门牌: '201' });
  data.系统._性爱场景.参与者['201'] = {
    满意度: 0, 满意目标: 5, 偏好命中: [], 等级加成已用: false, 有效楼数: 1, 已退出: false,
  };
  绑定许曼君分居亲密场次(data);
  结算许曼君分居亲密收尾(data, {
    场次标识: session,
    结束方式: '主动收尾',
    参与者: {
      201: { 满意度: 1, 满意目标: 5, 有效楼数: 1, 结束方式: '主动收尾', 时长评价: '太短' },
    },
  });
  assert.equal(data.系统._许曼君分居.共同夜晚状态, '已完成', '正常收束不再要求满意度与有效楼数双达标');
  assert.equal(data.系统._许曼君分居.留宿201权限, true);
  data.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
}

function 推进至私下决定(data = 推进至第三幕完成()) {
  data.系统._绝对时段 = data.系统._许曼君分居.预约时段;
  const pickup = 做动作(data, '201', '开始第四幕取物提案');
  const p1 = 交一拍(data, pickup.事件, '201', 12);
  assert.equal(data.系统._许曼君分居.生活用品已取完, true);
  const p2 = 下一拍(data, p1, '201', 13);
  assert.equal(data.系统._许曼君分居.修复已提出, true);
  const p3 = 下一拍(data, p2, '201', 14);
  assert.equal(p3.后续剧情, undefined);
  assert.equal(data.系统._许曼君分居.许曼君已拒绝恢复共同生活, false, '取物当天不提前替她作最终决定');
  assert.equal(data.系统._许曼君分居.阶段, '等待私下决定');
  assert.equal(data.户['201'].夫._居住模式, '路线外住');
  const earliest = data.系统._许曼君分居.私下决定最早时段;
  data.系统._绝对时段 = earliest - 1;
  assert.equal(同步许曼君分居时间节点(data).变动, false);
  data.系统._绝对时段 = earliest;
  assert.equal(同步许曼君分居时间节点(data).变动, true);
  assert.equal(data.系统._许曼君分居.阶段, '待私下决定');
  return data;
}

function 推进至最终钥匙(data, choiceText = '我会继续留在你选择的生活里。') {
  找动作时段(data, '201', '开始第四幕私下决定', data.系统._绝对时段);
  const privateTalk = 做动作(data, '201', '开始第四幕私下决定');
  const p1 = 交一拍(data, privateTalk.事件, '201', 15);
  assert.equal(data.系统._许曼君分居.许曼君已拒绝恢复共同生活, true);
  const p2 = 下一拍(data, p1, '201', 16, choiceText);
  assert.equal(p2.后续剧情, undefined);
  assert.equal(data.系统._许曼君分居.阶段, '待管理员室交接');

  data.系统._绝对时段 = data.系统._许曼君分居.预约时段;
  const finalTalk = 做动作(data, '管理员室', '开始第四幕管理员室交接');
  const f1 = 交一拍(data, finalTalk.事件, '管理员室', 17);
  const f2 = 下一拍(data, f1, '管理员室', 18);
  assert.equal(f2.后续剧情, undefined);
  assert.equal(data.系统._许曼君分居.双方同意进入办理, true);
  assert.equal(data.系统._许曼君分居.阶段, '待钥匙转交接');
  return data;
}

test('四幕正向链只封存一次、只预约丈夫回201一次，并由同一把钥匙完成交接', () => {
  const data = 推进至第三幕完成();
  做动作(data, '201', '今晚先不留下');
  assert.equal(data.系统._许曼君分居.共同夜晚状态, '待接受');
  完成共同夜晚(data);
  推进至私下决定(data);
  推进至最终钥匙(data);
  做动作(data, '管理员室', '改为待离婚交接', 19);
  assert.equal(许曼君分居已完成(data), true);
  assert.equal(data.系统._许曼君分居.阶段, '已完成');
  assert.equal(data.系统._许曼君分居.封条修订, 1, '同一把钥匙不得拆封再封');
  assert.equal(data.系统._许曼君分居.钥匙位置, '管理员室201钥匙格');
  assert.equal(data.系统._许曼君分居.钥匙用途, '待离婚交接');
  assert.equal(data.户['201'].夫._居住模式, '待离婚交接');
  assert.equal(data.系统._许曼君分居.完成楼层, 19);
  assert.equal(data.系统._许曼君分居.留宿201权限, true);
  assert.equal(data.背包.includes(许曼君会面通知ID), false);
  assert.equal(data.背包.includes(许曼君钥匙封存袋ID), false);
});

test('玩家退出只撤销未来留宿，不绑架许曼君的婚姻决定或抹掉共同夜晚历史', () => {
  const data = 推进至第三幕完成();
  完成共同夜晚(data);
  推进至私下决定(data);
  推进至最终钥匙(data, '我不会要求你回到旧生活，但我退出我们这段关系。');
  assert.equal(data.系统._许曼君分居.玩家最终关系选择, '退出关系');
  assert.equal(data.系统._许曼君分居.共同夜晚状态, '已完成');
  assert.equal(data.系统._许曼君分居.留宿201权限, false);
  assert.equal(data.系统._许曼君分居.许曼君已拒绝恢复共同生活, true);
  assert.equal(data.系统._许曼君分居.双方同意进入办理, true);
  做动作(data, '管理员室', '改为待离婚交接', 20);
  assert.equal(许曼君分居已完成(data), true);
});

test('暂不承诺保留已经成立的许可；未完成共同夜晚时也不会凭空解锁', () => {
  const withNight = 推进至第三幕完成();
  完成共同夜晚(withNight);
  推进至私下决定(withNight);
  推进至最终钥匙(withNight, '你的婚姻由你决定，我们之间我现在不给承诺，以后再谈。');
  assert.equal(withNight.系统._许曼君分居.玩家最终关系选择, '暂不承诺');
  assert.equal(withNight.系统._许曼君分居.留宿201权限, true);

  const withoutNight = 推进至私下决定();
  推进至最终钥匙(withoutNight, '你的婚姻由你决定，我们之间我现在不给承诺。');
  assert.equal(withoutNight.系统._许曼君分居.玩家最终关系选择, '暂不承诺');
  assert.equal(withoutNight.系统._许曼君分居.留宿201权限, false);
  assert.equal(withoutNight.系统._许曼君分居.共同夜晚状态, '待接受');
});

test('角色中止或安全失败不伪造共同夜晚完成，主分居进度仍可继续', () => {
  const data = 推进至第三幕完成();
  找动作时段(data, '201', '接受共同夜晚');
  const opening = 做动作(data, '201', '接受共同夜晚');
  const o1 = 交一拍(data, opening.事件, '201', 21);
  下一拍(data, o1, '201', 22, '今晚留下。');
  const session = 'xumj-abort-night';
  Object.assign(data.系统._性爱场景, { 状态: '进行中', 场次标识: session, 主焦点门牌: '201' });
  data.系统._性爱场景.参与者['201'] = { 满意度: 0, 满意目标: 5, 偏好命中: [], 等级加成已用: false, 有效楼数: 1, 已退出: false };
  绑定许曼君分居亲密场次(data);
  结算许曼君分居亲密收尾(data, {
    场次标识: session,
    结束方式: '角色中止',
    参与者: { 201: { 满意度: 5, 满意目标: 5, 有效楼数: 5, 结束方式: '角色中止', 时长评价: '合适' } },
  });
  assert.equal(data.系统._许曼君分居.共同夜晚状态, '待接受');
  assert.equal(data.系统._许曼君分居.留宿201权限, false);
  assert.equal(data.系统._许曼君分居.阶段, '待最终取物');
});

test('旧33阶段存档迁到新检查点，清除旧路线背包物件与旧剧情票且重复解析幂等', () => {
  const old = 建数据();
  Object.assign(old.系统._许曼君分居, {
    方案版本: undefined,
    阶段: '待第二次封存',
    当前场景: 'A5',
    当前拍: 5,
    会面通知位置: '已由赵国强取走',
    工资卡状态: '已归还赵国强',
    封存袋位置: '玩家背包已装钥匙',
    钥匙位置: '封存袋随玩家',
    钥匙用途: '临时外住',
    封条修订: 1,
    封条完整: false,
    独住夜已验证: true,
    出车表已收起: true,
    丈夫已知玩家关系: true,
    丈夫已选择外住: true,
    外住起点: 12,
    第二批用品已取: true,
    修复已提出: true,
    留宿201权限: true,
  });
  old.背包.push(许曼君会面通知ID, 许曼君钥匙封存袋ID);
  old.系统._待发送事件 = '其他角色合法票|【许曼君分居提交:A5:5】旧票';
  old.系统._场景剧情事务 = {
    id: 'old-xumj', 标题: '旧分居', 目标场景: '201', 行动: '', 内容: '【许曼君分居提交:A5:5】旧票',
    触发绝对时段: 20, 触发楼层: 30, 请求世代: 1, 状态: '待重试',
  };
  const migrated = Schema.parse(old);
  assert.equal(migrated.系统._许曼君分居.方案版本, 2);
  assert.equal(migrated.系统._许曼君分居.阶段, '等待私下决定');
  assert.equal(migrated.系统._许曼君分居.生活用品已取完, true);
  assert.equal(migrated.系统._许曼君分居.修复已提出, true);
  assert.equal(migrated.系统._许曼君分居.钥匙位置, '管理员室201钥匙格');
  assert.equal(migrated.系统._许曼君分居.封条修订, 1);
  assert.equal(migrated.背包.includes(许曼君会面通知ID), false);
  assert.equal(migrated.背包.includes(许曼君钥匙封存袋ID), false);
  assert.equal(migrated.系统._待发送事件, '其他角色合法票');
  assert.equal(migrated.系统._场景剧情事务.id, '');
  assert.deepEqual(Schema.parse(migrated).系统._许曼君分居, migrated.系统._许曼君分居);
});

test('新剧情票只有七类四幕场景，旧A1/A3/A5/A6票不能认领新状态', () => {
  const data = 推进至外住登记();
  assert.equal(解析许曼君分居剧情事件('【许曼君分居提交:A5:3】'), null);
  for (const scene of ['第一幕初谈', '第二幕摊牌', '第三幕独住后', '共同夜晚开场', '第四幕取物提案', '第四幕私下决定', '第四幕管理员室交接']) {
    const event = `【许曼君分居提交:${scene}:1】`;
    assert.equal(解析许曼君分居剧情事件(event)?.场景, scene);
  }
  assert.equal(data.系统._许曼君分居.方案版本, 2);
});

test('共同夜晚正常收束后立即开放现有201睡眠事务，预约冲突与医院仍会失败关闭', () => {
  const data = 推进至第三幕完成();
  完成共同夜晚(data);
  let lodging = 读取201留宿可用状态(data, '201', data.系统._绝对时段);
  assert.equal(lodging.可执行, true, lodging.原因);

  const before = 克隆(data);
  data.系统._许曼君分居.预约时段 = data.系统._绝对时段 + 1;
  data.系统._许曼君分居.预约截止时段 = data.系统._绝对时段 + 1;
  data.系统._许曼君分居.预约状态 = '待到期';
  data.系统._许曼君分居.预约用途 = '管理员室离婚前钥匙交接';
  lodging = 读取201留宿可用状态(data, '201', data.系统._绝对时段);
  assert.equal(lodging.可执行, false);
  assert.match(lodging.原因, /预约/);
  data.系统._许曼君分居 = before.系统._许曼君分居;

  data.户['201'].妻._生产.状态 = '住院中';
  lodging = 读取201留宿可用状态(data, '201', data.系统._绝对时段);
  assert.equal(lodging.可执行, false);
  assert.match(lodging.原因, /医院/);
  assert.equal(data.系统._许曼君分居.留宿201权限, true, '失败只关闭本次睡眠，不撤销关系许可');
});

test('错过取物预约会顺延，医院冻结不消费预约，出院后继续同一检查点', () => {
  const data = 推进至第三幕完成();
  const state = data.系统._许曼君分居;
  const first = state.预约时段;
  const hardFacts = {
    钥匙位置: state.钥匙位置,
    封条修订: state.封条修订,
    丈夫已知玩家关系: state.丈夫已知玩家关系,
    独住夜已完成: state.独住夜已完成,
  };

  data.系统._绝对时段 = first + 1;
  assert.equal(同步许曼君分居时间节点(data).变动, true);
  assert.ok(state.预约时段 > first);
  assert.deepEqual({
    钥匙位置: state.钥匙位置,
    封条修订: state.封条修订,
    丈夫已知玩家关系: state.丈夫已知玩家关系,
    独住夜已完成: state.独住夜已完成,
  }, hardFacts);

  const frozenAppointment = state.预约时段;
  data.户['201'].妻._生产.状态 = '住院中';
  data.系统._绝对时段 = frozenAppointment + 1;
  assert.equal(同步许曼君分居时间节点(data).变动, false);
  assert.equal(state.预约时段, frozenAppointment);
  assert.equal(state.阶段, '待最终取物');

  data.户['201'].妻._生产.状态 = '未怀孕';
  assert.equal(同步许曼君分居时间节点(data).变动, true);
  assert.ok(state.预约时段 > frozenAppointment);
  assert.equal(state.封条修订, 1);
});

test('同一硬动作重复点击只成功一次，不会生成第二枚封条或重复完成', () => {
  const data = 推进至外住登记();
  const before = 克隆(data);
  const repeatedSeal = 执行许曼君分居地点动作(data, '登记外住并封存钥匙', '管理员室');
  assert.equal(repeatedSeal.成功, false);
  assert.equal(data.系统._许曼君分居.封条修订, 1);
  assert.deepEqual(data, before);

  const completed = 推进至最终钥匙(推进至私下决定());
  做动作(completed, '管理员室', '改为待离婚交接', 88);
  const repeatedFinish = 执行许曼君分居地点动作(completed, '改为待离婚交接', '管理员室', 89);
  assert.equal(repeatedFinish.成功, false);
  assert.equal(completed.系统._许曼君分居.完成楼层, 88);
  assert.equal(completed.系统._已完成特殊场景.filter(id => id === '分居').length, 1);
});
