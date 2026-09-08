/* eslint-disable import-x/no-nodejs-modules -- PLAY-031：旧共享结局与新版承接经历必须分层投影。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;

let room = '101';
globalThis.getVariables = () => ({ _场景: { 房间id: room, 房间类型: '户', 进房末楼: 80 } });
globalThis.getLastMessageId = () => 80;
globalThis.SillyTavern = { name1: '林舟', chat: [], getCurrentChatId: () => 'play031-memory' };
const noIO = () => { throw new Error('PLAY031_EXTERNAL_IO_FORBIDDEN'); };
globalThis.insertOrAssignVariables = noIO;
globalThis.updateVariablesWith = noIO;
globalThis.generate = noIO;
globalThis.generateRaw = noIO;
globalThis.fetch = noIO;

const schema = require('../../src/人妻公寓/schema.ts');
const { Schema, 创建户节点 } = schema;
const schemaAlias = require.resolve('../../src/人妻公寓/schema');
require.cache[schemaAlias] = { id: schemaAlias, filename: schemaAlias, loaded: true, exports: schema };

const social = require('../../src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const phone = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局期语义.ts');
const second = require('../../src/人妻公寓/脚本/游戏逻辑/第二机位系统.ts');
const noDoor = require('../../src/人妻公寓/不再留门契约.ts');

const clone = value => lodash.cloneDeep(value);
const reload = value => Schema.parse(JSON.parse(JSON.stringify(value)));

function fresh() {
  const data = Schema.parse({
    现金: 10000,
    户: {
      102: 创建户节点(0),
      202: 创建户节点(0),
    },
    系统: { _绝对时段: 30 },
  });
  data.户['102'].妻.当前阶段 = 5;
  data.户['202'].妻.当前阶段 = 5;
  return data;
}

function markOldShared(data, id = '录像带') {
  if (!data.系统._已完成特殊场景.includes(id)) data.系统._已完成特殊场景.push(id);
  return data;
}

function markSecondComplete(data) {
  data.系统._第二机位.阶段 = '已完成';
  data.系统._第二机位.完成楼层 = 88;
  if (!data.系统._已完成特殊场景.includes(second.第二机位完成ID)) {
    data.系统._已完成特殊场景.push(second.第二机位完成ID);
  }
  if (!data.系统._特殊场景前置.includes(second.第二机位母带封存键)) {
    data.系统._特殊场景前置.push(second.第二机位母带封存键);
  }
  assert.equal(second.第二机位已完成(data), true);
  return data;
}

function markNoDoorComplete(data) {
  const r = data.系统._不再留门;
  r.版本 = 1;
  r.实例 = 'play031-nodoor';
  r.来源时间线 = 'play031-memory';
  r.道具已使用 = true;
  r.阶段 = '已完成';
  r.动机已表达 = true;
  r.录制提议 = true;
  r.许可 = '同意本次';
  r.停止默认等待 = true;
  r.照片.id = `${r.实例}:photo`;
  r.照片.时间线 = r.来源时间线;
  r.照片.拍摄时段 = 40;
  r.照片.地点 = '公寓外部';
  r.照片.画面 = 'ZXM-NMD-02';
  r.照片.原件位置 = '玩家手机';
  r.照片.已看过 = true;
  r.照片.副本持有人 = '周小满';
  r.记录.id = `${r.实例}:record`;
  r.记录.场次标识 = `${r.实例}:session:1`;
  r.记录.来源实例 = r.实例;
  r.记录.地点 = '202';
  r.记录.参与者 = ['玩家', '周小满'];
  r.记录.正文楼层 = [50, 52];
  r.记录.正常完成 = true;
  r.记录.完成楼层 = 54;
  r.记录.位置 = '封盒';
  r.母带.id = `${r.记录.id}:master`;
  r.母带.来源记录 = r.记录.id;
  r.母带.位置 = '302资料柜';
  r.母带.封存楼层 = 54;
  r.母带.归档楼层 = 56;
  if (!data.系统._已完成特殊场景.includes(noDoor.不再留门任务ID)) {
    data.系统._已完成特殊场景.push(noDoor.不再留门任务ID);
  }
  if (!data.系统._特殊场景前置.includes(noDoor.不再留门母带归档键)) {
    data.系统._特殊场景前置.push(noDoor.不再留门母带归档键);
  }
  assert.equal(noDoor.不再留门已完成(data), true, '夹具必须满足真实《不再留门》完成契约');
  return data;
}

function fullSnapshot(data, place) {
  room = place;
  const before = clone(data);
  const text = 组公寓快照([{ role: 'user', content: '今天照常过吧。' }], data, 80, '', {
    焦点: [], 在场: [], 妻在场: [], 夫在场: [],
  });
  assert.deepEqual(data, before, '普通快照只能读取经历，不能补造承接完成或改旧结局');
  return text;
}

function allConsumers(data, door) {
  return {
    life: social.构建角色结局后生活社交语义(data, door),
    snapshot: fullSnapshot(data, door),
    phone: phone.角色结局期私聊补充(data, door),
    profile: phone.角色结局期画像(data, door),
  };
}

function assertNoInventedContinuation(result, door) {
  const title = door === '102' ? '第二机位' : '不再留门';
  const text = `${result.life.生活事实}\n${result.life.普通正文纪律}\n${result.life.玩家私聊纪律}\n${result.life.丈夫边界}\n${result.snapshot}\n${result.phone}`;
  assert.doesNotMatch(text, new RegExp(`《${title}》[^。\\n]{0,20}(?:已经完成|已完成)`), `不得把${title}补写为已完成`);
  if (door === '202') {
    assert.doesNotMatch(text, /周小满不再默认留饭守门|她已决定不再默认替何俊生留饭守门/,
      '旧共享结局不能补造《不再留门》的停止默认等待决定');
  }
}

for (const shared of ['录像带', '录像带结局']) {
  for (const door of ['102', '202']) {
    test(`PLAY-031 旧/共享${shared}：${door}承认真实共享结局但不补造新版承接`, () => {
      const data = markOldShared(fresh(), shared);
      const result = allConsumers(data, door);
      assert.equal(result.life.阶段, '录像带结局');
      assert.equal(result.life.已开启, true);
      assert.equal(social.录像带结局后效已开启(data), true);
      assert.equal(social.角色正式结局已完成(data, door), true, '旧共享结局本身仍是已完成结局，不能强迫重玩');
      assert.ok(result.profile.已完成结局.includes('录像带结局'));
      assert.match(result.life.生活事实, /共享《录像带》|旧版.*《录像带》|《录像带》/);
      assertNoInventedContinuation(result, door);
    });
  }
}

test('PLAY-031 仅买/开始《第二机位》不能开启或伪造共享结局后生活', () => {
  const data = fresh();
  data.系统._第二机位.阶段 = '待门缝';
  const result = allConsumers(data, '102');
  assert.equal(result.life.已开启, false);
  assert.equal(result.phone, '【高阶段私聊】她已经进入第五阶段，口吻可以稳定直接，不要退回低阶段反复试探；尚未完成的结局仍不得提前发生。');
  assert.doesNotMatch(result.snapshot, /第二机位.*已经完成|结局后生活/);
});

test('PLAY-031 仅开始《不再留门》不能开启或伪造共享结局后生活', () => {
  const data = fresh();
  data.系统._不再留门.实例 = 'play031-ticket';
  data.系统._不再留门.来源时间线 = 'play031-memory';
  data.系统._不再留门.道具已使用 = true;
  data.系统._不再留门.阶段 = '开场中';
  const result = allConsumers(data, '202');
  assert.equal(result.life.已开启, false);
  assert.doesNotMatch(result.snapshot, /不再留门.*已经完成|结局后生活/);
  assert.doesNotMatch(result.phone, /不再留门.*已经完成/);
});

test('PLAY-031 仅完成102承接、共享结局尚未完成时不提前签发结局', () => {
  const data = markSecondComplete(fresh());
  assert.equal(social.录像带结局后效已开启(data), false);
  assert.equal(social.构建角色结局后生活社交语义(data, '102').已开启, false);
  assert.doesNotMatch(fullSnapshot(data, '102'), /【102结局后生活】/);
});

test('PLAY-031 仅完成202承接、共享结局尚未完成时不提前签发结局', () => {
  const data = markNoDoorComplete(fresh());
  assert.equal(social.录像带结局后效已开启(data), false);
  assert.equal(social.构建角色结局后生活社交语义(data, '202').已开启, false);
  assert.doesNotMatch(fullSnapshot(data, '202'), /【202结局后生活】/);
});

test('PLAY-031 旧共享结局 + 仅102真实承接：只让102承认《第二机位》经历', () => {
  const data = markSecondComplete(markOldShared(fresh(), '录像带'));
  const s102 = allConsumers(data, '102');
  const s202 = allConsumers(data, '202');
  assert.match(`${s102.life.生活事实}\n${s102.snapshot}\n${s102.phone}`, /《第二机位》.*(?:已经完成|已完成)/);
  assertNoInventedContinuation(s202, '202');
});

test('PLAY-031 旧共享结局 + 仅202真实承接：只让202承认《不再留门》经历', () => {
  const data = markNoDoorComplete(markOldShared(fresh(), '录像带'));
  const s102 = allConsumers(data, '102');
  const s202 = allConsumers(data, '202');
  assert.match(`${s202.life.生活事实}\n${s202.snapshot}\n${s202.phone}`, /《不再留门》.*(?:已经完成|已完成)/);
  assert.match(`${s202.life.生活事实}\n${s202.snapshot}\n${s202.phone}`, /不再默认.*留饭守门/);
  assertNoInventedContinuation(s102, '102');
});

test('PLAY-031 202部分进度只承认已发生的停止默认等待，不冒充整条承接完成', () => {
  const data = markOldShared(fresh(), '录像带');
  data.系统._不再留门.实例 = 'play031-partial';
  data.系统._不再留门.来源时间线 = 'play031-memory';
  data.系统._不再留门.道具已使用 = true;
  data.系统._不再留门.阶段 = '待准备';
  data.系统._不再留门.停止默认等待 = true;
  const result = allConsumers(data, '202');
  const text = `${result.life.生活事实}\n${result.snapshot}\n${result.phone}`;
  assert.match(text, /不再默认.*留饭守门/);
  assert.doesNotMatch(text, /《不再留门》[^。\n]{0,20}(?:已经完成|已完成)/);
});

test('PLAY-031 V4终态本身是两条承接完成后的强凭据，兼容缺少镜像字段的终态读取', () => {
  const data = fresh();
  data.系统._录像带V4.阶段 = '已完成';
  data.系统._录像带V4.场景.状态 = '已完成';
  data.系统._录像带V4.结果摘要 = '既有V4终幕结果';
  data.系统._已完成特殊场景.push('录像带结局');
  const s102 = allConsumers(data, '102');
  const s202 = allConsumers(data, '202');
  assert.match(`${s102.life.生活事实}\n${s102.phone}`, /《第二机位》.*(?:已经完成|已完成)/);
  assert.match(`${s202.life.生活事实}\n${s202.phone}`, /《不再留门》.*(?:已经完成|已完成)/);
  assert.match(`${s102.life.生活事实}\n${s202.life.生活事实}`, /复锁.*无接触|无接触.*核验/);
  assert.match(`${s202.life.生活事实}\n${s202.snapshot}`, /不再默认.*留饭守门/);
});

test('PLAY-031 Schema重载保持每户真实凭据，旧共享档不会因默认字段被升级', () => {
  const legacy = reload(markOldShared(fresh(), '录像带'));
  assert.equal(legacy.系统._第二机位.阶段, '未开始');
  assert.equal(legacy.系统._不再留门.阶段, '未开始');
  assert.equal(legacy.系统._录像带V4.阶段, '未开始');
  assertNoInventedContinuation(allConsumers(legacy, '102'), '102');
  assertNoInventedContinuation(allConsumers(legacy, '202'), '202');

  const mixed = reload(markSecondComplete(markOldShared(fresh(), '录像带结局')));
  assert.match(allConsumers(mixed, '102').life.生活事实, /《第二机位》.*(?:已经完成|已完成)/);
  assertNoInventedContinuation(allConsumers(mixed, '202'), '202');
});

test('PLAY-031 回档到承接前立即撤销新经历投影，不缓存后来完成事实', () => {
  const before = reload(markOldShared(fresh(), '录像带'));
  const after = reload(markNoDoorComplete(markSecondComplete(reload(before))));
  assert.match(allConsumers(after, '102').life.生活事实, /《第二机位》.*(?:已经完成|已完成)/);
  assert.match(allConsumers(after, '202').life.生活事实, /《不再留门》.*(?:已经完成|已完成)/);
  assertNoInventedContinuation(allConsumers(before, '102'), '102');
  assertNoInventedContinuation(allConsumers(before, '202'), '202');
});
