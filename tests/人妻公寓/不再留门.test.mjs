/* eslint-disable import-x/no-nodejs-modules -- Node regression tests */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');
const { 不再留门价格, 不再留门已完成 } = require('../../src/人妻公寓/不再留门契约.ts');
const {
  结算成功现场楼,
  结算性爱突然离场,
  中止不再留门失效现场,
} = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const { 追加等待场景剧情 } = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');

let floor = 1;
function fresh() {
  const d = Schema.parse({ 户: { 202: 创建户节点(0), 102: 创建户节点(0) }, 现金: 12000 });
  d.户['202'].妻.当前阶段 = 5;
  d.户['202'].妻.阶段性癖 = '独占印记';
  d.玩家资源.体力.当前值 = 5;
  return d;
}
function buy(d, id = '不再留门') {
  const result = route.购买不再留门物件(d, id, id === '不再留门' ? 不再留门价格.剧情道具 : 不再留门价格.便携录制套件);
  assert.equal(result.成功, true, result.提示);
}
function waitFor(d, action, place, from = d.系统._绝对时段) {
  for (let t = from; t < from + 84; t++) {
    d.系统._绝对时段 = t;
    if (!route.不再留门动作阻断(d, action, place)) return;
  }
  assert.fail(`No window for ${action}: ${route.不再留门动作阻断(d, action, place)}`);
}
function act(d, action, place = '202') {
  const result = route.执行不再留门动作(d, action, place, floor++, 'chat-A:branch-A', 'nmd-fixture');
  assert.equal(result.成功, true, result.提示);
  return result;
}
function beat(d, event, place = '202', reply = '我同意本次录制和保留。') {
  const before = lodash.cloneDeep(d);
  const result = route.提交不再留门剧情事件(d, event, place, floor, reply);
  assert.equal(result?.成功, true, result?.提示);
  if (route.不再留门事件要求真实开录(event)) {
    const resource = 结算成功现场楼(d, before, {
      楼层: floor,
      场景: place,
      行动: reply,
      正文: '她确认之后，亲手开始记录。',
      本楼事件: event,
      妻在场: ['202'],
      实际尺度: { 202: 0 },
      资源计费: false,
    });
    assert.equal(resource.性爱开始, true);
  }
  floor++;
  return result;
}
function scene(d, action, place = '202') {
  let result = act(d, action, place);
  let event = result.事件;
  let count = 0;
  while (event) {
    result = beat(d, event, place);
    count++;
    event = result.后续剧情?.事件;
  }
  return count;
}
function toPhoto() {
  const d = fresh();
  buy(d);
  waitFor(d, '使用道具', '202');
  scene(d, '使用道具');
  waitFor(d, '观察街对面', '公寓外部');
  scene(d, '观察街对面', '公寓外部');
  act(d, '拍照', '公寓外部');
  return d;
}
function toReady() {
  const d = toPhoto();
  waitFor(d, '出示照片', '202');
  scene(d, '出示照片');
  act(d, '交付副本');
  scene(d, '听她决定');
  buy(d, '便携录制套件');
  act(d, '安装套件');
  waitFor(d, '开始录制', '202');
  return d;
}
function toRecord() {
  const d = toReady();
  scene(d, '开始录制');
  assert.equal(d.系统._性爱场景.有效楼数, 0);
  for (let n = 0; n < 4; n++) {
    const before = lodash.cloneDeep(d);
    结算成功现场楼(d, before, {
      楼层: floor++,
      场景: '202',
      行动: n === 3 ? '【亲密收尾:停下并收尾】' : '继续当前场次',
      正文: '双方按约定继续，彼此回应。',
      本楼事件: '',
      妻在场: ['202'],
      实际尺度: { 202: 3 },
      资源计费: true,
    });
  }
  assert.equal(d.系统._不再留门.阶段, '待转存');
  return d;
}

test('购买只扣一次入包，未使用不开放外部，旧完成字符串不冒充新线', () => {
  const d = fresh();
  d.系统._已完成特殊场景.push('不再留门');
  buy(d);
  assert.equal(d.系统._不再留门.阶段, '未开始');
  assert.equal(d.系统._不再留门.道具已使用, false);
  assert.equal(route.不再留门地点动作(d, '公寓外部').length, 0);
  assert.equal(不再留门已完成(d), false);
  const before = lodash.cloneDeep(d);
  assert.equal(route.购买不再留门物件(d, '不再留门', 480).成功, false);
  assert.deepEqual(d, before);
});

test('首拍失败/错场/旧票不生效；首次成功才占用，同票不重复推进', () => {
  const d = fresh();
  buy(d);
  waitFor(d, '使用道具', '202');
  const prep = act(d, '使用道具');
  assert.equal(d.系统._不再留门.道具已使用, false);
  assert.equal(route.提交不再留门剧情事件(d, prep.事件, '302', floor, '').成功, false);
  const before = lodash.cloneDeep(d);
  const bad = prep.事件.replace('nmd-fixture:', 'other-chat:');
  assert.equal(route.提交不再留门剧情事件(d, bad, '202', floor, '').成功, false);
  assert.deepEqual(d, before);
  beat(d, prep.事件);
  const after = lodash.cloneDeep(d);
  assert.equal(d.系统._不再留门.道具已使用, true);
  assert.equal(route.提交不再留门剧情事件(d, prep.事件, '202', floor, '').变动, false);
  assert.deepEqual(d, after);
});

test('14人物回合、202零进度开录、真实普通收尾、转存封盒归档形成完整来源链', () => {
  assert.equal(
    Object.values(route.不再留门剧情拍数).reduce((a, b) => a + b),
    14,
  );
  const d = toRecord();
  const rec = d.系统._不再留门.记录;
  assert.equal(rec.正文楼层.length, 4);
  assert.equal(d.系统._上次性爱结果.参与者['202'].满意目标, 4);
  assert.equal(不再留门已完成(d), false);
  act(d, '转存记录');
  scene(d, '检查记录');
  assert.equal(d.系统._不再留门.母带.位置, '玩家背包');
  assert.ok(d.背包.includes('不再留门'));
  assert.equal(route.执行不再留门动作(d, '归档母带', '202', floor).成功, false);
  act(d, '归档母带', '管理员室');
  assert.equal(不再留门已完成(d), true);
  assert.ok(!d.背包.includes('不再留门'));
  assert.ok(!d.背包.includes('周小满母带（已封存）'));
  assert.ok(d.背包.includes('何俊生的街外照片'));
  assert.ok(!d.系统._特殊场景前置.includes('录像带结局:202丈夫钥匙入盒'));
  assert.equal(d.系统._特殊场景.id, '');
  assert.equal(d.户['202'].夫._居住模式, '普通作息');
  assert.deepEqual(Schema.parse(d), d);
});

test('真实等待与过期机会；目击不是照片，离开后须重新观察', () => {
  const d = fresh();
  buy(d);
  waitFor(d, '使用道具', '202');
  scene(d, '使用道具');
  assert.match(route.不再留门动作阻断(d, '观察街对面', '公寓外部'), /完整世界时段/);
  waitFor(d, '观察街对面', '公寓外部');
  scene(d, '观察街对面', '公寓外部');
  assert.equal(d.系统._不再留门.照片.id, '');
  assert.equal(route.同步不再留门现场(d, '202'), true);
  assert.equal(d.系统._不再留门.阶段, '待目击');
  assert.equal(route.执行不再留门动作(d, '拍照', '公寓外部', floor).成功, false);
  assert.ok(d.系统._不再留门.目击历史.length);
});

test('跨日取证按拍摄日回应；出示一拍成功后中断不抹知情', () => {
  const d = toPhoto();
  waitFor(d, '出示照片', '202');
  const prep = act(d, '出示照片');
  const result = beat(d, prep.事件);
  assert.equal(d.系统._不再留门.照片.已看过, true);
  assert.equal(d.系统._不再留门.照片.副本持有人, '');
  assert.match(result.后续剧情.事件, /照片实际拍于/);
  act(d, '暂缓');
  assert.equal(d.系统._不再留门.当前拍, 2);
  assert.equal(d.系统._不再留门.照片.已看过, true);
});

test('技术失败保留候选，明确撤回永不复活候选，设备不重复购买', () => {
  const d = toRecord();
  const id = d.系统._不再留门.记录.id;
  const before = lodash.cloneDeep(d);
  assert.equal(route.执行不再留门动作(d, '转存记录', '302', floor).成功, false);
  assert.deepEqual(d, before);
  act(d, '转存记录');
  const first = act(d, '检查记录');
  beat(d, first.事件);
  act(d, '暂缓');
  assert.equal(d.系统._不再留门.记录.位置, '介质');
  assert.equal(d.系统._不再留门.当前拍, 2);
  act(d, '撤回许可');
  assert.ok(d.系统._不再留门.放弃记录.includes(id));
  assert.equal(d.系统._不再留门.记录.正常完成, false);
  assert.equal(d.系统._不再留门.设备位置, '202');
  assert.equal(route.不再留门套件可购买(d), false);
});

test('拒绝和暧昧回复不能登记许可；暂停仅清本线的票', () => {
  const d = toPhoto();
  waitFor(d, '出示照片', '202');
  scene(d, '出示照片');
  act(d, '交付副本');
  let result = act(d, '听她决定');
  result = beat(d, result.事件);
  result = beat(d, result.后续剧情.事件);
  const event = result.后续剧情.事件;
  for (const reply of ['不同意录制', '以后再说', '你好']) {
    const before = lodash.cloneDeep(d);
    assert.equal(route.提交不再留门剧情事件(d, event, '202', floor, reply).成功, false);
    assert.deepEqual(d, before);
  }
  追加等待场景剧情(d, event, '202');
  追加等待场景剧情(d, '另一户已预约的真实事件', '101');
  act(d, '暂缓');
  assert.match(d.系统._待发送事件, /另一户/);
  assert.doesNotMatch(d.系统._待发送事件, /不再留门提交/);
});

test('中止录制不签发母带；下一次必须等待并绑定新场次', () => {
  const d = toReady();
  scene(d, '开始录制');
  const old = d.系统._不再留门.记录.场次标识;
  结算性爱突然离场(d);
  assert.equal(d.系统._不再留门.阶段, '待开录');
  assert.equal(d.系统._不再留门.记录.正常完成, false);
  assert.match(route.不再留门动作阻断(d, '开始录制', '202'), /完整世界时段/);
  waitFor(d, '开始录制', '202');
  scene(d, '开始录制');
  assert.notEqual(d.系统._不再留门.记录.场次标识, old);
});

test('医院、资源不足、外来场次结果和存档旧字段均失败关闭', () => {
  const d = toReady();
  d.玩家资源.体力.当前值 = 3;
  assert.match(route.不再留门动作阻断(d, '开始录制', '202'), /4点/);
  d.玩家资源.体力.当前值 = 5;
  d.户['202'].妻._生产.状态 = '住院中';
  assert.match(route.不再留门动作阻断(d, '开始录制', '202'), /医院/);
  const old = fresh();
  old.系统._已完成特殊场景.push('不再留门');
  old.系统._特殊场景前置.push('录像带结局:周母带封存', '录像带结局:202丈夫钥匙入盒');
  delete old.系统._不再留门;
  const parsed = Schema.parse(old);
  assert.equal(parsed.系统._不再留门.道具已使用, false);
  assert.equal(不再留门已完成(parsed), false);
});

test('V4新版前置拒绝旧字符串，完整周线无旧钥匙也可购买且须另行使用', () => {
  const v4 = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4状态.ts');
  const legacy = fresh();
  legacy.系统._第二机位.阶段 = '已完成';
  legacy.系统._已完成特殊场景.push('不再留门');
  legacy.系统._特殊场景前置.push('录像带结局:沈母带封存', '录像带结局:周母带封存', '录像带结局:202丈夫钥匙入盒');
  assert.equal(v4.录像带V4承接条件已完成(legacy), false);
  const d = toRecord();
  act(d, '转存记录');
  scene(d, '检查记录');
  act(d, '归档母带', '302');
  d.系统._第二机位.阶段 = '已完成';
  d.系统._特殊场景前置.push('录像带结局:沈母带封存');
  assert.equal(v4.登记购买录像带V4(d).成功, true);
  d.背包.push('录像带');
  assert.equal(v4.录像带V4贞操锁可购买数量(d), 0);
  assert.equal(d.系统._录像带V4.录像带已使用, false);
  assert.equal(v4.使用录像带V4(d).成功, true);
  assert.equal(v4.录像带V4贞操锁可购买数量(d), 2);
});

test('疑问、条件句、他人意愿和取消意图不是玩家的明确许可', () => {
  const event = '【不再留门提交:consent-test:1:A5:3:2】';
  for (const reply of [
    '你同意吗？',
    '她也愿意吗',
    '如果你愿意再说',
    '我同意取消录制',
    '我同意不录制',
    '我同意不公开',
  ]) {
    assert.notEqual(route.不再留门回应错误(event, reply), '', reply);
  }
  for (const reply of ['我同意', '好，我同意本次录制和保留，不公开传播。', '我愿意保留这次记录。']) {
    assert.equal(route.不再留门回应错误(event, reply), '', reply);
  }
});

test('体力耗尽后的免费收尾仍记录真实收尾楼，开录与收尾不冒充有效互动楼', () => {
  const d = toReady();
  d.玩家资源.体力.当前值 = 4;
  scene(d, '开始录制');
  const start = d.系统._不再留门.记录.开始楼层;
  for (let n = 0; n < 4; n++) {
    const before = lodash.cloneDeep(d);
    结算成功现场楼(d, before, {
      楼层: floor++,
      场景: '202',
      行动: '继续当前场次',
      正文: '双方按约定继续。',
      本楼事件: '',
      妻在场: ['202'],
      实际尺度: { 202: 3 },
      资源计费: true,
    });
  }
  assert.equal(d.系统._性爱场景.状态, '收尾中');
  assert.equal(d.系统._不再留门.阶段, '录制中');
  const end = floor++;
  结算成功现场楼(d, lodash.cloneDeep(d), {
    楼层: end,
    场景: '202',
    行动: '完成当前收尾',
    正文: '这次互动已经正常收束。',
    本楼事件: '',
    妻在场: ['202'],
    实际尺度: {},
    资源计费: true,
  });
  assert.equal(d.系统._不再留门.阶段, '待转存');
  assert.equal(d.系统._不再留门.记录.完成楼层, end);
  assert.equal(d.系统._不再留门.记录.正文楼层.length, 4);
  assert.ok(!d.系统._不再留门.记录.正文楼层.includes(start));
});

test('录制中医院、时段或地点强制变化安全停机，保留前置且不套用主动离场惩罚', () => {
  for (const condition of ['医院', '时段', '地点']) {
    const d = toReady();
    scene(d, '开始录制');
    const beforeWife = lodash.cloneDeep(d.户['202'].妻);
    if (condition === '医院') d.户['202'].妻._生产.状态 = '住院中';
    if (condition === '时段') d.系统._绝对时段++;
    assert.equal(中止不再留门失效现场(d, condition === '地点' ? '302' : '202'), true);
    assert.equal(d.系统._性爱场景.状态, '空闲');
    assert.equal(d.系统._不再留门.阶段, '待开录');
    assert.equal(d.系统._不再留门.记录.正常完成, false);
    assert.equal(d.系统._不再留门.设备位置, '202');
    assert.equal(d.户['202'].妻.好感值, beforeWife.好感值);
    assert.equal(d.户['202'].妻.堕落值, beforeWife.堕落值);
  }
});

test('失去绑定或其他场次收尾不能补齐本次记录；取消录制保留普通场次的独立所有权', () => {
  const d = toReady();
  scene(d, '开始录制');
  const before = lodash.cloneDeep(d);
  route.结算不再留门亲密收尾(d, { ...d.系统._上次性爱结果, 场次标识: 'another-session' }, floor);
  assert.deepEqual(d, before);
  act(d, '撤回许可');
  assert.equal(d.系统._不再留门.记录.位置, '已放弃');
  assert.equal(d.系统._性爱场景.状态, '进行中', '只撤回录制和保留，不偷改普通场次账');
  const lost = toReady();
  scene(lost, '开始录制');
  lost.系统._性爱场景.场次标识 = 'another-session';
  assert.equal(route.同步不再留门现场(lost, '202'), true);
  assert.equal(lost.系统._不再留门.阶段, '待开录');
  assert.equal(lost.系统._性爱场景.场次标识, 'another-session');
});

test('外部目击演员只读，私下知情按出示和决定的真实提交逐步产生', () => {
  const { 检测焦点 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
  const { 构造AI可写变量范围 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
  const d = toPhoto();
  const actors = 检测焦点([], d, floor, '【不再留门提交:actor-test:1:A2:1:2】');
  assert.deepEqual(actors.妻在场, []);
  assert.deepEqual(actors.夫在场, ['202']);
  assert.deepEqual(actors.焦点, []);
  assert.deepEqual(构造AI可写变量范围(d, actors.焦点, actors.妻在场, actors.夫在场, { 只读: false, 亲密场景: false }), {
    妻: [],
    夫: [],
    亲密妻: [],
  });
  assert.deepEqual(route.不再留门私下上下文(d), []);
  waitFor(d, '出示照片', '202');
  const result = act(d, '出示照片');
  beat(d, result.事件);
  assert.match(route.不再留门私下上下文(d).join('\n'), /已看过/);
  assert.doesNotMatch(route.不再留门私下上下文(d).join('\n'), /同意本次|已由玩家放入/);
});

test('本线待回应票排在其他强剧情后面时，确认与首拍重试都不能抢前台', () => {
  const d = toPhoto();
  waitFor(d, '出示照片', '202');
  scene(d, '出示照片');
  act(d, '交付副本');
  let p = act(d, '听她决定');
  p = beat(d, p.事件);
  p = beat(d, p.后续剧情.事件);
  追加等待场景剧情(d, '其他角色正在等待的强剧情', '202');
  追加等待场景剧情(d, p.后续剧情.事件, '202');
  assert.notEqual(route.不再留门动作阻断(d, '确认当前决定', '202'), '');
  const opening = fresh();
  buy(opening);
  waitFor(opening, '使用道具', '202');
  act(opening, '使用道具');
  追加等待场景剧情(opening, '另一个当前强现场', '202');
  assert.notEqual(route.不再留门动作阻断(opening, '使用道具', '202'), '');
});

test('同楼重掷恢复到开录前快照后，只重建同一份零进度绑定结果', () => {
  const d = toReady();
  const start = act(d, '开始录制');
  const first = beat(d, start.事件);
  const frozen = lodash.cloneDeep(d),
    level = floor++;
  const outcomes = [];
  for (let n = 0; n < 2; n++) {
    const replay = lodash.cloneDeep(frozen);
    const result = route.提交不再留门剧情事件(replay, first.后续剧情.事件, '202', level, '我现在同意开始这次录制。');
    assert.equal(result.成功, true);
    const resource = 结算成功现场楼(replay, lodash.cloneDeep(frozen), {
      楼层: level,
      场景: '202',
      行动: '我现在同意开始这次录制。',
      正文: '她确认以后亲自开始记录。',
      本楼事件: first.后续剧情.事件,
      妻在场: ['202'],
      实际尺度: {},
      资源计费: false,
    });
    assert.equal(resource.性爱开始, true);
    assert.equal(replay.系统._性爱场景.有效楼数, 0);
    assert.equal(replay.系统._不再留门.录制次数, 1);
    outcomes.push(replay);
  }
  assert.deepEqual(outcomes[0], outcomes[1]);
});
