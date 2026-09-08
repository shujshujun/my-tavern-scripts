/* eslint-disable import-x/no-nodejs-modules -- isolated actor projection regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
let vars = {};
globalThis.getVariables = () => _.cloneDeep(vars);

// Only unrelated phone-history/database ports are adapted; actor detection, normalization,
// snapshot construction, stage data, schema and writable-range calculation are production code.
const logic = '../../src/人妻公寓/脚本/游戏逻辑/';
for (const [name, exports] of [
  ['手机/数据层.ts', { 读库: () => ({ 消息: [], 圈: [], 节拍: {} }), 孕情姐妹群已触发: () => false }],
  ['数据库桥.ts', { 同步社交轨迹: () => undefined }],
]) {
  const path = require.resolve(logic + name);
  require.cache[path] = { id: path, filename: path, loaded: true, exports };
}
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const snapshot = require(logic + 'snapshotSystem.ts');
const { 构造AI可写变量范围 } = require(logic + 'mvuIO.ts');
const ids = ['101', '102', '201', '202', '301'];

function setup(primary = '201', background = [], mode = 'map') {
  const data = Schema.parse({ 户: Object.fromEntries(ids.map(id => [id, 创建户节点(4)])) });
  vars = mode === 'map' ? {
    _场景: { 房间id: '管理员室', 进房末楼: 8 },
    _粘滞: { 位置: '管理员室', 楼: 8, 们: [primary, ...background], 夫们: [] },
  } : {};
  const chat = [{ role: 'user', content: [primary, ...background].map(id => 户静态表[id].妻名).join('，') + '，今天的安排怎么样？' }];
  return { data, chat };
}

function event(id, interruption = false) {
  return `【事件在场妻:${id}】【事件关联夫:${id}】${interruption ? '【查岗电话】' : ''}${户静态表[id].妻名}收到丈夫的来电。`;
}

function assertDisjoint(result) {
  assert.deepEqual(result.在场.filter(id => result.焦点.includes(id)), [], '主焦点／事件焦点不能又受到背景人物限制');
}

for (const mode of ['map', 'text']) {
  for (const primary of ids) {
    for (const interrupt of [false, true]) {
      const secondary = ids.find(id => id !== primary);
      test(`SNAP04 ${mode}/${primary}/${secondary}/${interrupt ? '跨场打断' : '普通事件'}：焦点仍完整，背景不重叠`, () => {
        const { data, chat } = setup(primary, [], mode);
        const beforeData = _.cloneDeep(data);
        const beforeVars = _.cloneDeep(vars);
        const currentEvent = event(secondary, interrupt);
        const result = snapshot.检测焦点(chat, data, 10, currentEvent);
        assert.deepEqual(result.焦点, interrupt ? [primary, secondary] : [secondary, primary]);
        assertDisjoint(result);
        assert.deepEqual(result.在场, []);
        assert.deepEqual([...result.妻在场].sort(), [primary, secondary].sort());
        assert.deepEqual([...result.私聊可召回妻].sort(), mode === 'map' ? [primary, secondary].sort() : [secondary]);
        assert.deepEqual(result.夫在场, [], '只关联的丈夫不能变为实际在场演员');
        assert.equal(result.丈夫打断跨角色, interrupt ? true : undefined);
        const prompt = snapshot.组公寓快照(chat, data, 10, currentEvent, result);
        assert.ok(prompt.includes(`◆ ${户静态表[primary].妻名}(`));
        assert.ok(prompt.includes(`◆ ${户静态表[secondary].妻名}(`));
        assert.doesNotMatch(prompt, /【在场】\(每人至多一句掠影/);
        assert.deepEqual(构造AI可写变量范围(data, result.焦点, result.妻在场, result.夫在场,
          { 只读: false, 亲密场景: false }).妻, result.焦点);
        assert.deepEqual(data, beforeData);
        assert.deepEqual(vars, beforeVars);
      });
    }
  }
}

for (const mode of ['map', 'text']) {
  for (const interrupt of [false, true]) {
    test(`真正背景人物继续保留 ${mode}/${interrupt}，只排除已成为焦点的演员`, () => {
      const { data, chat } = setup('201', ['102', '301'], mode);
      const result = snapshot.检测焦点(chat, data, 10, event('101', interrupt));
      assertDisjoint(result);
      assert.deepEqual(result.在场, ['102', '301']);
      assert.deepEqual([...result.妻在场].sort(), ['101', '102', '201', '301']);
      const prompt = snapshot.组公寓快照(chat, data, 10, event('101', interrupt), result);
      assert.match(prompt, /【在场】\(每人至多一句掠影/);
      assert.ok(prompt.includes(`· ${户静态表['102'].妻名}:`));
      assert.ok(prompt.includes(`· ${户静态表['301'].妻名}:`));
      assert.ok(!prompt.includes(`· ${户静态表['201'].妻名}:`));
      assert.ok(!prompt.includes(`· ${户静态表['101'].妻名}:`));
      const scope = 构造AI可写变量范围(data, result.焦点, result.妻在场, result.夫在场, { 只读: false, 亲密场景: false });
      assert.deepEqual(scope.妻, result.焦点);
      assert.equal(scope.妻.includes('102'), false);
      assert.equal(scope.妻.includes('301'), false);
    });
  }
}

test('普通无事件保留一个主焦点与其他背景演员，不一律将全员升级为主角', () => {
  const { data, chat } = setup('201', ['102', '301']);
  const result = snapshot.检测焦点(chat, data, 10, '');
  assert.deepEqual(result.焦点, ['201']);
  assert.deepEqual(result.在场, ['102', '301']);
  assertDisjoint(result);
});

test('本来在背景的角色成为事件焦点，只移除该角色，保留另一背景', () => {
  const { data, chat } = setup('201', ['102', '301']);
  const result = snapshot.检测焦点(chat, data, 10, event('102'));
  assert.deepEqual(result.焦点, ['102', '201']);
  assert.deepEqual(result.在场, ['301']);
  assert.deepEqual([...result.妻在场].sort(), ['102', '201', '301']);
  assertDisjoint(result);
});

test('只关联妻／夫不改变焦点与背景，更不增加实际演员及私聊召回资格', () => {
  const { data, chat } = setup('201', ['102']);
  const currentEvent = '【事件关联妻:101】【事件关联夫:101】提到101住户的维修记录。';
  const result = snapshot.检测焦点(chat, data, 10, currentEvent);
  assert.deepEqual(result.焦点, ['201']);
  assert.deepEqual(result.在场, ['102']);
  assert.deepEqual(result.妻在场, ['102', '201']);
  assert.deepEqual(result.夫在场, []);
  assert.equal(result.私聊可召回妻.includes('101'), false);
  const prompt = snapshot.组公寓快照(chat, data, 10, currentEvent, result);
  assert.match(prompt, /【事件关联角色】/);
  assert.ok(prompt.includes(`· ${户静态表['101'].妻名}(101室)`));
  assert.ok(!prompt.includes(`◆ ${户静态表['101'].妻名}(`));
});

test('只在场丈夫仍为事件焦点，妻不能随门牌获得本人写权', () => {
  const { data, chat } = setup('201', ['102']);
  const currentEvent = '【事件在场夫:101】【事件关联妻:101】丈夫来询问维修记录。';
  const result = snapshot.检测焦点(chat, data, 10, currentEvent);
  assert.deepEqual(result.焦点, ['101', '201']);
  assert.deepEqual(result.在场, ['102']);
  assert.deepEqual(result.夫在场, ['101']);
  assert.equal(result.妻在场.includes('101'), false);
  const scope = 构造AI可写变量范围(data, result.焦点, result.妻在场, result.夫在场, { 只读: false, 亲密场景: false });
  assert.deepEqual(scope.妻, ['201']);
  assert.deepEqual(scope.夫, ['101']);
});

test('同户事件保留主焦点，既有背景不丢失，也不增加跨场标志', () => {
  const { data, chat } = setup('201', ['102']);
  const result = snapshot.检测焦点(chat, data, 10, event('201', true));
  assert.deepEqual(result.焦点, ['201']);
  assert.deepEqual(result.在场, ['102']);
  assert.equal(result.丈夫打断跨角色, undefined);
});

test('重复事件演员标签去重，焦点与背景仍互斥', () => {
  const { data, chat } = setup('201', ['102', '301']);
  const currentEvent = '【事件在场妻:101,101,102】【事件在场妻:101】来确认维修安排。';
  const result = snapshot.检测焦点(chat, data, 10, currentEvent);
  assert.deepEqual(result.焦点, ['101', '102', '201']);
  assert.deepEqual(result.在场, ['301']);
  assert.equal(new Set(result.焦点).size, result.焦点.length);
  assertDisjoint(result);
});

test('当前无物理场景时，只保留显式事件演员，不把旧聊天人物拉回', () => {
  const { data, chat } = setup('201', ['102']);
  vars._场景 = {};
  vars._粘滞 = null;
  const result = snapshot.检测焦点(chat, data, 10, event('101'));
  assert.deepEqual(result.焦点, ['101']);
  assert.deepEqual(result.在场, []);
  assert.deepEqual(result.妻在场, ['101']);
});

test('活动场次的既有主焦点／参与者归一化继续优先，不改亲密账', () => {
  const { data, chat } = setup('201', ['102', '301']);
  data.系统._性爱场景.状态 = '进行中';
  data.系统._性爱场景.场次标识 = 'projection-test';
  data.系统._性爱场景.主焦点门牌 = '102';
  data.系统._性爱场景.参与者 = { 201: { 已退出: false }, 102: { 已退出: false } };
  const original = _.cloneDeep(data);
  const result = snapshot.检测焦点(chat, data, 10, event('101'));
  assert.deepEqual(result.焦点, ['102', '201', '101']);
  assert.deepEqual(result.在场, ['301']);
  assertDisjoint(result);
  assert.deepEqual(data, original);
});

test('失败重试／重载JSON往返只重算投影，移除事件后背景恢复原身份', () => {
  const { data, chat } = setup('201', ['102', '301']);
  const first = snapshot.检测焦点(chat, data, 10, event('102'));
  const reloaded = JSON.parse(JSON.stringify(data));
  assert.deepEqual(snapshot.检测焦点(chat, reloaded, 10, event('102')), first);
  assertDisjoint(first);
  const next = snapshot.检测焦点(chat, reloaded, 10, '');
  assert.deepEqual(next.焦点, ['201']);
  assert.deepEqual(next.在场, ['102', '301']);
});
