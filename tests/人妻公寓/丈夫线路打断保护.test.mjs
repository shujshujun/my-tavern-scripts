/* eslint-disable import-x/no-nodejs-modules -- Node regression tests */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
let currentRoom = '302';
globalThis.getVariables = () => ({ _场景: { 房间id: currentRoom } });
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
const { 丈夫在楼, 妻位置推算, seededRandom, 读取世界时间 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 打断检测, 丈夫打断会读取疑心, 父亲来电打断 } = require('../../src/人妻公寓/脚本/游戏逻辑/打断系统.ts');
const visit = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫登门系统.ts');
const { 读取201留宿可用状态 } = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
const { 构建201留宿上下文 } = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君201留宿.ts');
const { 保证夏乔借种受孕 } = require('../../src/人妻公寓/脚本/游戏逻辑/怀孕系统.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');

function fresh() {
  const data = Schema.parse({
    户: Object.fromEntries(Object.keys(户静态表).map(m => [m, 创建户节点(0)])),
    现金: 10000,
  });
  for (const [m, h] of Object.entries(data.户)) {
    h.妻.当前阶段 = 5;
    h.妻.阶段性癖 = 户静态表[m].招牌性癖;
    h.夫.疑心值 = 100;
    h.夫.信任值 = 0;
  }
  return data;
}

function atRisk(data, m, father = false) {
  currentRoom = m;
  for (let abs = 0; abs < 252; abs++) {
    const hit = seededRandom(abs, m, father ? '父亲来电' : '丈夫打断') < (father ? 0.18 : 0.5);
    if (hit && (father || 丈夫在楼(data.户[m], m, abs) === '外出')) {
      data.系统._绝对时段 = abs;
      return;
    }
  }
  assert.fail('必须存在可重现的打断档');
}

function pregnancy(data, m) {
  Object.assign(data.户[m].妻._怀孕, { 状态: '已告知', 已曝光: true, 受孕场次标识: `preg-${m}` });
}

for (const m of ['102', '202']) {
  test(`${m}真实录制期间暂停旧三级打断且不消费频控`, () => {
    const data = fresh();
    atRisk(data, m);
    const s = data.系统._性爱场景;
    Object.assign(s, { 状态: '进行中', 场次标识: `record-${m}`, 主焦点门牌: m });
    s.参与者[m] = { 已退出: false };
    if (m === '102') {
      Object.assign(data.系统._第二机位, { 阶段: '录制中', 录制场次标识: s.场次标识 });
      Object.assign(data.户[m].夫, { _剧情外出起: data.系统._绝对时段, _剧情外出至: data.系统._绝对时段 + 3 });
    } else {
      Object.assign(data.系统._不再留门, { 阶段: '录制中', 道具已使用: true });
    }
    const before = lodash.cloneDeep(data);
    assert.equal(丈夫打断会读取疑心(data, [m]), false);
    打断检测(data, [m], 90);
    assert.deepEqual(data, before, '暂停判定只读，场次、疑心、频控均保留');
  });
}

test('L5与仅购道具不提前退出普通风险；未关联户保留原规则', () => {
  for (const m of ['101', '102', '201', '202', '301']) {
    const data = fresh();
    atRisk(data, m);
    data.系统._家庭计划.阶段 = '待安装';
    data.系统._第二机位.阶段 = '待门缝';
    data.系统._许曼君分居.阶段 = '待初谈';
    data.背包.push('不再留门', '录像带');
    data.系统._录像带V4.录像带已购买 = true;
    data.系统._录像带V4.入口规则版本 = 1;
    data.系统._录像带V4.阶段 = '待使用录像带';
    assert.equal(丈夫打断会读取疑心(data, [m]), true, m);
    打断检测(data, [m], 90);
    assert.match(data.系统._待发送事件, /亲密强制中止/, m);
  }
  const other = fresh();
  other.系统._第二机位.阶段 = '待对饮';
  atRisk(other, '202');
  assert.equal(丈夫打断会读取疑心(other, ['202']), true);
});

test('承接真实进度覆盖等待、暂停和完成，回档恢复此前风险', () => {
  const setups = [
    [
      '101',
      d => {
        d.系统._家庭计划.阶段 = '待投资料';
      },
    ],
    [
      '102',
      d => {
        d.系统._第二机位.阶段 = '待对饮';
      },
    ],
    [
      '102',
      d => {
        d.系统._第二机位.阶段 = '已完成';
      },
    ],
    [
      '201',
      d => {
        d.系统._许曼君分居.阶段 = '待三人摊牌';
      },
    ],
    [
      '201',
      d => {
        Object.assign(d.系统._许曼君分居, { 阶段: '待初谈', 当前场景: '第一幕初谈', 当前拍: 2 });
      },
    ],
    [
      '202',
      d => {
        Object.assign(d.系统._不再留门, { 道具已使用: true, 阶段: '待决定', 许可: '已撤回' });
      },
    ],
    [
      '202',
      d => {
        d.系统._录像带V4.录像带已使用 = true;
      },
    ],
  ];
  for (const [m, setup] of setups) {
    const data = fresh();
    atRisk(data, m);
    const before = lodash.cloneDeep(data);
    setup(data);
    assert.equal(丈夫打断会读取疑心(data, [m]), false, `${m}承接进度`);
    assert.equal(丈夫打断会读取疑心(Schema.parse(data), [m]), false, '刷新保持保护');
    assert.equal(丈夫打断会读取疑心(before, [m]), true, '回档恢复原关系');
  }
});

test('101知情与两户录像带结局永久退出旧打断，兼容已有完成事实', () => {
  const setups = [
    [
      '101',
      d => {
        d.系统._家庭计划.阶段 = '已完成';
      },
    ],
    [
      '101',
      d => {
        d.户['101'].妻._生产.家庭计划知情 = true;
      },
    ],
    [
      '101',
      d => {
        d.系统._已完成特殊场景.push('借种');
      },
    ],
    [
      '102',
      d => {
        d.系统._已完成特殊场景.push('录像带结局');
      },
    ],
    [
      '202',
      d => {
        d.系统._已完成特殊场景.push('录像带');
      },
    ],
    [
      '201',
      d => {
        d.系统._许曼君分居.丈夫已知玩家关系 = true;
      },
    ],
  ];
  for (const [m, setup] of setups) {
    const data = fresh();
    atRisk(data, m);
    setup(data);
    assert.equal(丈夫打断会读取疑心(data, [m]), false, m);
    const husband = lodash.cloneDeep(data.户[m].夫);
    打断检测(data, [m], 91);
    assert.equal(data.系统._待发送事件, '');
    assert.deepEqual(data.户[m].夫, husband);
  }
});

test('母亲正式回国承接后暂停随机越洋打断，购票阶段仍保留', () => {
  const data = fresh();
  atRisk(data, '302', true);
  data.系统._回国.阶段 = '待使用经营归档册';
  父亲来电打断(data, ['302'], 90);
  assert.match(data.系统._待发送事件, /越洋来电/);
  data.系统._待发送事件 = '';
  data.户['302'].夫._上次打断档 = -1;
  data.系统._回国.阶段 = '待父亲回信';
  data.系统._父亲通话.标识 = '合法剧情电话';
  const before = lodash.cloneDeep(data);
  父亲来电打断(data, ['302'], 91);
  assert.deepEqual(data, before);
});

test('通用孕情待办在承接保护期暂停读取与用药，原账保留且回档可继续', () => {
  const data = fresh();
  pregnancy(data, '202');
  assert.deepEqual(visit.同步丈夫登门排期(data), ['202']);
  const pending = lodash.cloneDeep(data.户['202'].妻._怀孕.丈夫登门);
  data.系统._不再留门.道具已使用 = true;
  assert.equal(visit.读取待触发丈夫登门(data), null);
  assert.equal(visit.安眠药可圆场(data, '202'), false);
  assert.equal(visit.准备睡前丈夫登门(data, '302', '302'), null);
  assert.deepEqual(data.户['202'].妻._怀孕.丈夫登门, pending);
  data.系统._不再留门.道具已使用 = false;
  assert.equal(visit.读取待触发丈夫登门(data), '202');
  assert.equal(visit.安眠药可圆场(data, '202'), true);
});

test('保护期不新排通用孕情对质，101专属感谢仍能真实结算', () => {
  const data = fresh();
  pregnancy(data, '102');
  pregnancy(data, '202');
  data.系统._第二机位.阶段 = '待归档';
  data.系统._不再留门.道具已使用 = true;
  assert.deepEqual(visit.同步丈夫登门排期(data), []);
  pregnancy(data, '101');
  data.系统._家庭计划.阶段 = '已完成';
  Object.assign(data.户['101'].妻._生产, { 家庭计划知情: true, 本胎序号: 1 });
  assert.deepEqual(visit.同步丈夫登门排期(data), ['101']);
  const start = visit.准备睡前丈夫登门(data, '302', '302');
  assert.equal(start?.成功, true);
  const next = visit.推进丈夫登门(data, start.事件, '302', '302');
  assert.equal(next?.成功, true);
  const cash = data.现金;
  assert.equal(visit.推进丈夫登门(data, next.事件, '302', '302')?.成功, true);
  assert.equal(data.现金, cash + 1200);
});

test('已经进入现场的登门继续原生命周期，不抹去已发生剧情', () => {
  const data = fresh();
  pregnancy(data, '202');
  const start = visit.准备睡前丈夫登门(data, '302', '302');
  assert.equal(start?.成功, true);
  data.系统._不再留门.道具已使用 = true;
  const result = visit.推进丈夫登门(data, start.事件, '302', '302');
  assert.equal(result?.成功, true);
  assert.equal(data.户['202'].妻._怀孕.丈夫登门.状态, '进行中');
  assert.equal(data.户['202'].妻._怀孕.丈夫登门.当前拍, 2);
});

test('暂停的其他户旧登门不再锁201留宿，适配层与主判定一致', () => {
  const data = fresh();
  Object.assign(data.系统._许曼君分居, {
    阶段: '已完成',
    留宿201权限: true,
    丈夫已知玩家关系: true,
    钥匙用途: '待离婚交接',
    钥匙位置: '管理员室201钥匙格',
  });
  data.户['201'].夫._居住模式 = '待离婚交接';
  let found = false;
  for (let t = 0; t < 42; t++) {
    data.系统._绝对时段 = t;
    if (['晚上', '深夜'].includes(读取世界时间(t).时段) && 妻位置推算('201', t, data.户['201']) === '201') {
      found = true;
      break;
    }
  }
  assert.equal(found, true);
  assert.equal(读取201留宿可用状态(data, '201').可执行, true);
  pregnancy(data, '202');
  visit.同步丈夫登门排期(data);
  data.系统._不再留门.道具已使用 = true;
  assert.equal(读取201留宿可用状态(data, '201').可执行, true);
  assert.equal(构建201留宿上下文(data).其他丈夫登门待办, false);
});

test('焦点与关联丈夫的正文提示同步退出旧查岗，未开线仍保留感知', () => {
  const data = fresh();
  data.户 = { 102: data.户['102'] };
  data.户['102'].夫.疑心值 = 60;
  const chat = [{ role: 'user', content: '继续当前谈话。' }];
  for (const related of [false, true]) {
    currentRoom = related ? '管理员室' : '102';
    const people = related
      ? { 焦点: [], 在场: [], 妻在场: [], 夫在场: [] }
      : { 焦点: ['102'], 在场: ['102'], 妻在场: ['102'], 夫在场: [] };
    const event = related ? '【事件关联夫:102】这是一段关于顾国栋的既有记录。' : '';
    data.系统._第二机位.阶段 = '未开始';
    assert.match(组公寓快照(chat, data, 90, event, people), /盘问变多/);
    data.系统._第二机位.阶段 = '待对饮';
    const snapshot = 组公寓快照(chat, data, 90, event, people);
    assert.doesNotMatch(snapshot, /盘问变多|留意她的行踪与手机/);
    assert.match(snapshot, /【102丈夫行动】/);
  }
});

test('旧录像带必须有真实使用进展；新版本待使用不因包内物品提前免查岗', () => {
  const data = fresh();
  atRisk(data, '102');
  const tape = data.系统._录像带V4;
  tape.录像带已购买 = true;
  tape.阶段 = '待购赠锁';
  tape.入口规则版本 = 0;
  assert.equal(丈夫打断会读取疑心(data, ['102']), true);
  data.背包.push('男用贞操带');
  assert.equal(丈夫打断会读取疑心(data, ['102']), false);
  tape.入口规则版本 = 1;
  assert.equal(丈夫打断会读取疑心(data, ['102']), true);
  tape.赠锁['102'].已接收 = true;
  assert.equal(丈夫打断会读取疑心(data, ['102']), false);
});

test('旧通用孕情待办不妨碍已成立家庭计划的借种结算', () => {
  const data = fresh();
  data.系统._家庭计划.阶段 = '已完成';
  data.户['101'].妻._怀孕.丈夫登门.状态 = '待触发';
  for (let t = 0; t < 42; t++)
    if (读取世界时间(t).星期 === '星期一') {
      data.系统._绝对时段 = t;
      break;
    }
  assert.equal(保证夏乔借种受孕(data, '借种结局:101:protection-test'), '已受孕');
});
