/* eslint-disable import-x/no-nodejs-modules -- PLAY-004 real route regression harness */
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
// Only isolate the external database bridge; schema, clocks, metadata and route gates remain real.
const databasePath = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[databasePath] = { id: databasePath, filename: databasePath, loaded: true, exports: {} };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const txn = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const divorce = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
const daily = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚后日常系统.ts');
const nonstop = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
const replace = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');

function fresh201(completed = false) {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: 3 } });
  Object.assign(data.户['201'].妻, { 当前阶段: 5, 好感值: 90, 堕落值: 95 });
  Object.assign(data.系统._许曼君分居, {
    方案版本: 2, 阶段: '已完成', 工资卡状态: '已归还赵国强',
    钥匙位置: '管理员室201钥匙格', 钥匙用途: completed ? '正式退居' : '待离婚交接',
    丈夫已知玩家关系: true, 丈夫已选择外住: true, 生活用品已取完: true,
    许曼君已拒绝恢复共同生活: true, 双方同意进入办理: true,
    玩家最终关系选择: '继续关系', 留宿201权限: true,
  });
  data.户['201'].夫._居住模式 = completed ? '正式退居' : '待离婚交接';
  data.玩家资源.体力.当前值 = 10;
  data.现金 = 5000;
  if (completed) {
    Object.assign(data.系统._许曼君离婚, {
      阶段: '已完成', 法律离婚已成立: true, 赵国强正式退居: true, 换锁完成: true, 完成楼层: 10,
    });
    data.系统._已完成特殊场景.push(divorce.许曼君离婚场景ID);
  } else {
    assert.equal(divorce.购买许曼君离婚(data, 1500).成功, true);
  }
  return data;
}

function fresh301(replacement = false) {
  const data = Schema.parse({ 户: { 301: 创建户节点(0) }, 系统: { _绝对时段: 4 } });
  Object.assign(data.户['301'].妻, { 当前阶段: 5, 阶段性癖: '镜头高潮' });
  Object.assign(data.户['301'].夫, { _居住模式: '提前通知', 状态: '外出' });
  data.现金 = 5000;
  data.玩家资源.体力.永久上限加成 = 5;
  data.玩家资源.体力.当前值 = 7;
  if (replacement) {
    Object.assign(data.系统._安若妍不必停, {
      阶段: '已完成', 江辰已明确看见: true, 江辰已接受互不干涉: true, 提前通知已约定: true,
    });
    data.系统._已完成特殊场景.push('不必停');
    assert.equal(replace.购买安若妍换掉(data).成功, true);
  } else {
    assert.equal(nonstop.购买安若妍不必停(data).成功, true);
  }
  return data;
}

function waiting(data, location = '101', content = '【普通预约】稍后查看物件') {
  return txn.追加等待场景剧情(data, content, location, '待办物件').内容;
}

function available(actions, id) {
  return actions.some(action => action.可执行 !== false &&
    (action.id === id || action.选项?.some(option => option.id === id)));
}

const entries = [
  { name: '离婚201开场', room: '201', place: '201', id: '使用红色封存盒', fresh: () => fresh201(),
    view: divorce.许曼君离婚地点动作, run: divorce.执行许曼君离婚地点动作 },
  { name: '离婚大堂办理', room: '201', place: '大堂', id: '陪她去办最后手续', fresh: () => {
    const data = fresh201(); data.系统._绝对时段 = 8;
    Object.assign(data.系统._许曼君离婚, { 阶段: '待办理', 办理预约时段: 8 }); return data;
  }, view: divorce.许曼君离婚地点动作, run: divorce.执行许曼君离婚地点动作 },
  { name: '离婚管理员室归档', room: '201', place: '管理员室', id: '归档201前住户旧钥匙', fresh: () => {
    const data = fresh201(); Object.assign(data.系统._许曼君离婚, { 阶段: '待归档旧钥匙', 法律离婚已成立: true }); return data;
  }, view: divorce.许曼君离婚地点动作, run: divorce.执行许曼君离婚地点动作 },
  { name: '201结局后开场', room: '201', place: '201', id: '由我开始', fresh: () => fresh201(true),
    view: divorce.许曼君离婚地点动作, run: divorce.执行许曼君离婚地点动作 },
  { name: '201结局后日常', room: '201', place: '201', id: '陪她把这件事做完', fresh: () => fresh201(true),
    view: daily.许曼君离婚后日常地点动作, run: daily.执行许曼君离婚后日常动作 },
  { name: '不必停301开场', room: '301', place: '301', id: '使用不必停', fresh: () => fresh301(),
    view: nonstop.安若妍不必停地点动作, run: nonstop.执行安若妍不必停地点动作 },
  { name: '换掉301开场', room: '301', place: '301', id: '使用换掉', fresh: () => fresh301(true),
    view: replace.安若妍换掉地点动作, run: replace.执行安若妍换掉地点动作 },
  { name: '换掉外部购买', room: '301', place: '公寓外部', id: '购买拍立得', fresh: () => {
    const data = fresh301(true); data.系统._安若妍换掉.阶段 = '待购买拍立得'; return data;
  }, view: replace.安若妍换掉地点动作, run: replace.执行安若妍换掉地点动作 },
  { name: '换掉管理员室登记', room: '301', place: '管理员室', id: '登记江辰到访', fresh: () => {
    const data = fresh301(true); data.系统._安若妍换掉.阶段 = '待登记'; return data;
  }, view: replace.安若妍换掉地点动作, run: replace.执行安若妍换掉地点动作 },
];

function check(entry, data, expected) {
  const beforeQueue = data.系统._待发送事件;
  const beforeActive = lodash.cloneDeep(data.系统._场景剧情事务);
  assert.equal(available(entry.view(data, entry.place), entry.id), expected, `${entry.name} displayed availability`);
  assert.equal(data.系统._待发送事件, beforeQueue, `${entry.name} preview preserves queue`);
  const result = entry.run(data, entry.id, entry.place, 20, 'play004@0');
  assert.equal(result.成功, expected, `${entry.name}: ${result.提示}`);
  assert.equal(data.系统._待发送事件, beforeQueue, `${entry.name} execution preserves waiting tickets`);
  assert.deepEqual(data.系统._场景剧情事务, beforeActive, `${entry.name} preserves active ownership`);
  return result;
}

for (const entry of entries) {
  test(`PLAY-004 ${entry.name}：远处101等待票保持入口可用且执行不吞票`, () => {
    check(entry, entry.fresh(), true);
    const data = entry.fresh();
    waiting(data);
    waiting(data, '102');
    check(entry, data, true);
  });
  test(`PLAY-004 ${entry.name}：队尾同地、未知旧票及远处连续锁场仍挡住执行`, () => {
    for (const kind of ['local', 'unknown', 'continuous']) {
      const data = entry.fresh();
      waiting(data);
      if (kind === 'unknown') data.系统._待发送事件 += '|【上一动作·送礼回响】旧档缺少地点';
      else waiting(data, kind === 'local' ? entry.place : '102', kind === 'continuous'
        ? '【场景剧情连续锁场】【场景剧情需回应】等待当前现场回应' : '【普通预约】本地待办');
      check(entry, data, false);
    }
  });
}

for (const status of ['生成中', '待重试', '等待回应', '']) {
  test(`PLAY-004 活动事务${status || '旧档空状态'}：全部实际地点阻塞并保留原始事务`, () => {
    for (const entry of entries) {
      const data = entry.fresh();
      const active = txn.激活新增场景剧情(data, {
        标题: '101正在进行的事件', 目标场景: '101', 行动: '查看物件', 触发楼层: 9, 内容: '【普通预约】处理101物件',
      });
      assert.equal(active.成功, true);
      data.系统._场景剧情事务.状态 = status;
      // A lost body must not turn a durable active ID into a remote waiting ticket.
      if (!status) data.系统._场景剧情事务.内容 = '';
      check(entry, data, false);
    }
  });
}

test('PLAY-004 201自有活动票未收口时隐藏重复地点入口，并完整保留活动票与队尾票', () => {
  const entry = entries[0];
  for (const foreign of [false, true]) {
    const data = entry.fresh();
    const own = divorce.执行许曼君离婚地点动作(data, entry.id, entry.place, 20);
    assert.equal(own.成功, true);
    assert.equal(txn.激活新增场景剧情(data, {
      标题: '201预约办理', 目标场景: '201', 行动: entry.id, 触发楼层: 20, 内容: own.事件,
    }).成功, true);
    waiting(data);
    if (foreign) waiting(data, '201');
    check(entry, data, false);
  }
});

test('PLAY-004 201自有等待票未收口时隐藏重复地点入口，不吞远处、未知或连续锁场票', () => {
  const entry = entries[0];
  for (const kind of ['remote', 'unknown', 'continuous']) {
    const data = entry.fresh();
    const own = divorce.执行许曼君离婚地点动作(data, entry.id, entry.place, 20);
    waiting(data, '201', own.事件);
    if (kind === 'unknown') data.系统._待发送事件 += '|【上一动作·送礼回响】旧档缺少地点';
    else waiting(data, '101', kind === 'continuous' ? '【场景剧情连续锁场】待继续' : '【普通预约】稍后再来');
    check(entry, data, false);
  }
});

test('PLAY-004 大堂、管理员室与公寓外部使用实际动作地点，房间等待票不充当办公地点锁', () => {
  for (const entry of entries.filter(item => item.place !== item.room)) {
    const data = entry.fresh();
    waiting(data, entry.room);
    check(entry, data, true);
  }
});

function appointment(stage = '等待预约夜') {
  const data = fresh301();
  data.系统._绝对时段 = 10;
  Object.assign(data.系统._安若妍不必停, {
    阶段: stage, 道具已购买: true, 道具已使用: true, 卷宗状态: '301书房',
    取件登记已完成: true, 预约夜绝对时段: 10, 最早继续时段: 10,
  });
  return data;
}

test('PLAY-004 不必停预约到期：远处等待允许同步并在301继续核对，预览不写回', () => {
  const data = appointment();
  waiting(data);
  const before = lodash.cloneDeep(data);
  assert.equal(available(nonstop.安若妍不必停地点动作(data, '301'), '确认卷宗仍在书房'), true);
  assert.deepEqual(data, before);
  const sync = nonstop.同步安若妍不必停时间节点(data);
  assert.equal(sync.变动, true);
  assert.equal(data.系统._安若妍不必停.阶段, '待核对卷宗');
  assert.equal(data.系统._安若妍不必停.暂停原因, '');
  assert.equal(nonstop.执行安若妍不必停地点动作(data, '确认卷宗仍在书房', '301', 20).成功, true);
  assert.equal(data.系统._待发送事件, before.系统._待发送事件);
});

test('PLAY-004 不必停预约到期：队尾本地、未知或连续锁场冻结，解除后原凭据继续', () => {
  for (const kind of ['local', 'unknown', 'continuous']) {
    const data = appointment();
    const remote = waiting(data);
    if (kind === 'unknown') data.系统._待发送事件 += '|【上一动作·送礼回响】旧档缺少地点';
    else waiting(data, kind === 'local' ? '301' : '102', kind === 'continuous' ? '【场景剧情连续锁场】待继续' : '【普通预约】本地待办');
    const queue = data.系统._待发送事件;
    nonstop.同步安若妍不必停时间节点(data);
    assert.equal(data.系统._安若妍不必停.阶段, '等待预约夜');
    assert.match(data.系统._安若妍不必停.暂停原因, /剧情|冻结/);
    assert.equal(data.系统._待发送事件, queue);
    data.系统._待发送事件 = remote;
    nonstop.同步安若妍不必停时间节点(data);
    assert.equal(data.系统._安若妍不必停.阶段, '待核对卷宗');
    assert.equal(data.系统._安若妍不必停.卷宗状态, '301书房');
    assert.equal(data.系统._安若妍不必停.取件登记已完成, true);
  }
});

for (const kind of ['不必停', '换掉']) {
  test(`PLAY-004 ${kind}暂缓：远处等待可改约且保留票与物件，队尾本地仍阻塞`, () => {
    for (const local of [false, true]) {
      const data = kind === '不必停' ? appointment('待H1开场') : fresh301(true);
      if (kind === '换掉') Object.assign(data.系统._安若妍换掉, {
        阶段: '待开场', 预约夜绝对时段: 4, 拍立得状态: '已交付', 购买绝对时段: 0, 登记绝对时段: 1,
      });
      const route = kind === '不必停' ? data.系统._安若妍不必停 : data.系统._安若妍换掉;
      const api = kind === '不必停'
        ? { view: nonstop.安若妍不必停地点动作, run: nonstop.执行安若妍不必停地点动作 }
        : { view: replace.安若妍换掉地点动作, run: replace.执行安若妍换掉地点动作 };
      waiting(data);
      if (local) waiting(data, '301');
      const before = lodash.cloneDeep(route);
      const bag = [...data.背包];
      check({ ...api, name: `${kind}暂缓`, place: '301', id: '暂缓预约夜' }, data, !local);
      assert.deepEqual(data.背包, bag);
      if (local) assert.deepEqual(route, before);
      else {
        assert.equal(route.阶段, '等待预约夜');
        assert.ok(route.预约夜绝对时段 > before.预约夜绝对时段);
        if (kind === '不必停') {
          assert.ok(route.预约夜绝对时段 - data.系统._绝对时段 >= 6);
          assert.equal(route.卷宗状态, '301书房');
          assert.equal(route.取件登记已完成, true);
        } else {
          assert.equal(route.拍立得状态, before.拍立得状态);
          assert.equal(route.购买绝对时段, before.购买绝对时段);
          assert.equal(route.登记绝对时段, before.登记绝对时段);
        }
      }
    }
  });
}

test('PLAY-004 301结局后入口：远处101等待可用，同地与队尾强锁保持阻断', () => {
  for (const kind of ['remote', 'local', 'unknown', 'continuous', 'active']) {
    const data = fresh301(true);
    data.系统._安若妍换掉.阶段 = '已完成';
    data.系统._已完成特殊场景.push(replace.安若妍换掉商品ID);
    waiting(data);
    if (kind === 'local') waiting(data, '301');
    if (kind === 'unknown') data.系统._待发送事件 += '|【上一动作·送礼回响】旧档缺少地点';
    if (kind === 'continuous') waiting(data, '102', '【场景剧情连续锁场】待继续');
    if (kind === 'active') data.系统._场景剧情事务.id = 'lost-active';
    const before = lodash.cloneDeep(data);
    assert.equal(replace.安若妍结局后亲密可用(data, '301'), kind === 'remote');
    assert.equal(replace.安若妍结局后亲密可用(data, '管理员室'), false);
    assert.deepEqual(data, before);
  }
});

for (const blocker of ['电话', '医院', '普通场次']) {
  test(`PLAY-004 原有${blocker}阻断在远处等待放行后仍然有效`, () => {
    for (const entry of entries) {
      const data = entry.fresh();
      waiting(data);
      if (blocker === '电话') data.系统._父亲通话.标识 = 'play004-call';
      if (blocker === '医院') data.户[entry.room].妻._生产.状态 = '住院中';
      if (blocker === '普通场次') data.系统._性爱场景.状态 = '进行中';
      check(entry, data, false);
    }
  });
}

test('PLAY-004 存档刷新与回档重新读取队列，远处票放行不改变后续同地重试', () => {
  const entry = entries[4];
  const initial = entry.fresh();
  waiting(initial);
  const remoteSave = JSON.parse(JSON.stringify(initial));
  check(entry, JSON.parse(JSON.stringify(remoteSave)), true);
  waiting(initial, '201');
  const blockedSave = JSON.parse(JSON.stringify(initial));
  check(entry, blockedSave, false);
  check(entry, JSON.parse(JSON.stringify(remoteSave)), true);
  assert.equal(txn.读取待发送事件队列(blockedSave.系统._待发送事件).length, 2);
});

test('PLAY-004 同一远处事务的多条结构化指令全部保留，不把后续指令误认成未知旧票', () => {
  for (const entry of entries) {
    const data = entry.fresh();
    waiting(data, '101', '【普通预约】核对物件|【普通预约】记录结果');
    const items = txn.读取待发送事件队列(data.系统._待发送事件);
    assert.equal(items.length, 2);
    const metadata = items.map(item => txn.解析场景剧情元数据(item));
    assert.equal(metadata[0].id, metadata[1].id);
    assert.deepEqual(metadata.map(item => item.目标场景), ['101', '101']);
    check(entry, data, true);
  }
});

test('PLAY-004 原全局阻断与队首阻断API继续保留各自语义', () => {
  const data = fresh201(true);
  waiting(data);
  waiting(data, '201');
  const before = lodash.cloneDeep(data);
  assert.equal(txn.有普通场景剧情阻塞(data), true);
  assert.equal(txn.有普通场景剧情阻塞当前场景(data, '201'), false);
  assert.equal(txn.有普通场景剧情阻塞当前场景(data, '101'), true);
  assert.deepEqual(data, before);
});
