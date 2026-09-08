/* eslint-disable import-x/no-nodejs-modules -- Node state and transaction regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';
import { 装配真实时间事务门 } from './helpers/时间事务门装配.mjs';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => {};
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const shop = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const scenes = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const deferred = require('../../src/人妻公寓/脚本/游戏逻辑/商店剧情结算.ts');
const gate = require('../../src/人妻公寓/脚本/游戏逻辑/入住触发门.ts');
const clock = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const risk = require('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts');
const daily = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚后日常系统.ts');
const item = '肉偿账本';
function fresh() {
  const d = Schema.parse({ 户: { 201: 创建户节点(0) }, 现金: 9999 });
  Object.assign(d.户['201'], { _欠租笔数: 2 });
  Object.assign(d.户['201'].妻, { 当前阶段: 4, 堕落值: 50 });
  d.户['201'].夫.疑心值 = 10;
  return d;
}
function buy(d) {
  assert.equal(shop.购买(d, item).成功, true);
  assert.equal(d.现金, 9199);
  assert.ok(d.系统._待发送事件);
}
function activate(d) {
  const content = d.系统._待发送事件;
  d.系统._待发送事件 = '';
  const result = scenes.激活新增场景剧情(d, { 内容: content, 目标场景: '201', 行动: '继续当前剧情', 触发楼层: 10 });
  assert.equal(result.成功, true);
  return result.事务;
}
function notSettled(d) {
  assert.equal(d.户['201']._欠租笔数, 2, 'Pending story must not clear debt');
  assert.equal(d.系统._已完成特殊场景.includes(item), false);
  assert.equal(d.户['201'].妻.堕落值, 50);
  assert.equal(d.户['201'].夫.疑心值, 10);
}

test('购买只扣款并产票，不提前清账/完成/发成长', () => {
  const d = fresh(); buy(d); notSettled(d);
});

test('真实事务待重试与JSON重载仍未结算，重试不再扣款', () => {
  const d = fresh(); buy(d); const txn = activate(d);
  assert.equal(scenes.标记场景剧情待重试(d, txn.id, txn.请求世代), true);
  const restored = Schema.parse(JSON.parse(JSON.stringify(d)));
  const retry = scenes.准备重试场景剧情(restored, '201', txn.id);
  assert.equal(retry.成功, true);
  assert.equal(restored.现金, 9199);
  notSettled(restored);
});

test('待演时重复购买失败且不产生额外副作用', () => {
  const d = fresh(); buy(d); const before = structuredClone(d);
  assert.equal(shop.购买(d, item).成功, false);
  assert.deepEqual(d, before);
});

function tree(name) {
  return ts.createSourceFile(name, readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${name}.ts`, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
}
function find(ast, predicate) {
  const found = [];
  function visit(node) { if (predicate(node)) found.push(node); ts.forEachChild(node, visit); }
  visit(ast); return found;
}
function only(nodes) { assert.equal(nodes.length, 1); return nodes[0]; }
function run(source, deps) {
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', ...Object.keys(deps), js)(module, module.exports, ...Object.values(deps));
  return module.exports;
}
const engineAST = tree('回合引擎'), indexAST = tree('index');
const roundSource = only(find(engineAST, n => ts.isFunctionDeclaration(n) && n.name?.text === '回合结算')).getText(engineAST);
const nativeSource = only(find(indexAST, n => ts.isIfStatement(n) && n.expression.getText(indexAST).includes('本轮事件可提交'))).getText(indexAST);
const nativeRiskSource = only(find(indexAST, n => ts.isForOfStatement(n) &&
  n.expression.getText(indexAST) === '_本轮焦点' && n.getText(indexAST).includes('结算焦点疑心'))).getText(indexAST);

function deps() {
  const env = { _: lodash, Schema, ...scenes, ...gate, ...deferred, ...daily,
    eventEmit() {}, 读场景: () => ({ 房间id: '201' }),
    静音会议正式运行中: () => false, 前台角色线路无关强剧情已冻结: () => true,
    提交入住登场: () => null, 提交母亲两幕事件: () => [], 提交阶段线路剧情: () => [],
    经济结算: () => [], 同步双重继承时间节点: () => ({}), 同步安若妍不必停时间节点: () => ({}),
    同步安若妍换掉时间节点: () => ({}), 同步许曼君离婚时间节点: () => ({}),
    安若妍不必停事件要求H1开场: () => false, 安若妍换掉事件要求H1开场: () => false,
    惰性结算户: risk.惰性结算户, 丈夫在楼: clock.丈夫在楼, 疑心冻结中: clock.疑心冻结中,
    结算焦点疑心: risk.结算焦点疑心,
  };
  for (const name of ['解析阶段性癖开幕事件', '解析不再留门剧情事件', '解析第二机位剧情事件',
    '解析安若妍换掉剧情事件', '解析安若妍不必停剧情事件', '解析许曼君分居剧情事件',
    '解析许曼君离婚剧情事件', '解析回国剧情事件', '解析双重继承剧情事件']) env[name] = () => null;
  for (const name of ['排入第二机位后续剧情', '排入不再留门后续剧情', '排入安若妍不必停后续剧情',
    '排入许曼君分居后续剧情', '排入回国后续剧情', '排入双重继承后续剧情', '同步302共居状态',
    '同步许曼君离婚完成后状态', '夜访结算', '荣耀洞结算']) env[name] = () => {};
  return env;
}
function freeze(data, floor = 12) {
  return gate.选择本轮事件({ 楼层: floor, 待发送: data.系统._待发送事件,
    活动事务内容: data.系统._场景剧情事务.内容, 入住场景可用: false });
}
function ordinary(candidate, before, frozen, valid = true, ticket = before.系统._场景剧情事务) {
  const round = run(`${roundSource}\nmodule.exports = 回合结算;`, deps());
  return round(candidate, before, ['201'], ['201'], [], 12, frozen, valid,
    valid ? '本轮剧情已经完成。' : '', '201', '继续当前剧情', undefined,
    { id: ticket.id, 请求世代: ticket.请求世代 });
}
function native(candidate, before, frozen, valid = true) {
  // Exact native success block and subsequent real risk loop. Browser callback/physical save are not emulated here.
  const env = { ...deps(), newData: candidate, 成长基准: before, _本轮事件基底: before,
    本轮冻结: frozen, 本楼事件: frozen.内容, 本轮有效正文: valid ? '本轮剧情已经完成。' : '', 楼层: 12,
    本轮静音会议: false, _本轮静音会议: false, _本轮妻在场: ['201'], _本轮夫在场: [], _本轮玩家文本: '继续当前剧情', _本轮焦点: ['201'],
    原生日常提交锚: null, 现钟: candidate.系统._绝对时段,
  };
  return run(`let 入住预约已提交 = false, 主焦堕落增量 = 0;
    let 原生第二机位提交 = null, 原生不再留门提交 = null, 原生安若妍不必停提交 = null;
    let 原生许曼君分居提交 = null, 原生许曼君离婚提交 = null, 原生许曼君离婚后日常提交 = null;
    let 原生回国提交 = null, 原生双重继承提交 = null, 商店剧情新增堕落 = {};
    ${nativeSource}\n${nativeRiskSource}\nmodule.exports = 商店剧情新增堕落;`, env);
}

for (const [channel, settle] of [['普通', ordinary], ['原生', native]]) {
  for (const value of [50, 98, 99, 100]) {
    for (const aiDelta of [-2, 0, 1, 2, 4]) {
      test(`${channel}成功后结算一次，脚本奖励不触疑心：${value}/${aiDelta}`, () => {
        const d = fresh(); d.户['201'].妻.堕落值 = value; buy(d); activate(d);
        const before = structuredClone(d), frozen = freeze(d);
        const aiValue = Math.min(100, Math.max(0, value + aiDelta));
        d.户['201'].妻.堕落值 = aiValue;
        settle(d, before, frozen);
        assert.equal(d.户['201']._欠租笔数, 0);
        assert.equal(d.系统._已完成特殊场景.filter(x => x === item).length, 1);
        assert.equal(d.户['201'].妻.堕落值, Math.min(100, aiValue + 2));
        assert.equal(d.户['201'].夫.疑心值, 10 + Math.min(2, Math.max(0, Math.floor((aiValue - value) / 2))));
        assert.equal(d.系统._商店剧情结算.状态, '已结算');
        assert.equal(d.系统._场景剧情事务.id, '');
        assert.equal(d.系统._待发送事件, '');
        const after = structuredClone(d);
        assert.deepEqual(deferred.提交商店剧情结算(d, frozen.内容), {});
        assert.deepEqual(d, after);
      });
    }
  }
  test(`${channel}无有效正文不清账、不发奖励或消费队首`, () => {
    const d = fresh(); buy(d); activate(d); const before = structuredClone(d);
    settle(d, before, freeze(d), false);
    notSettled(d);
    assert.equal(d.系统._场景剧情事务.id, before.系统._场景剧情事务.id);
    assert.equal(d.系统._商店剧情结算.状态, '待演');
  });
  test(`${channel}旧已结算票无新凭据，不重发奖励或改写历史`, () => {
    const d = fresh();
    d.系统._已完成特殊场景.push(item); d.户['201']._欠租笔数 = 0; d.户['201'].妻.堕落值 = 52;
    d.系统._待发送事件 = '【事件在场妻:201】【特殊场景·肉偿账本】旧版已经结算的待演内容';
    activate(d); const before = structuredClone(d);
    settle(d, before, freeze(d));
    assert.equal(d.户['201'].妻.堕落值, 52);
    assert.equal(d.系统._已完成特殊场景.filter(x => x === item).length, 1);
    assert.equal(d.系统._商店剧情结算.状态, '无');
  });
}

test('普通旧请求世代不能认领同一票的新重试', () => {
  const d = fresh(); buy(d); const txn = activate(d), oldTicket = { id: txn.id, 请求世代: txn.请求世代 };
  const frozen = freeze(d);
  scenes.标记场景剧情待重试(d, txn.id, txn.请求世代);
  assert.equal(scenes.准备重试场景剧情(d, '201', txn.id).成功, true);
  const before = structuredClone(d);
  assert.throws(() => ordinary(d, before, frozen, true, oldTicket), /世代/);
  notSettled(d);
  assert.equal(d.系统._商店剧情结算.状态, '待演');
});

test('机器结算凭据不替代可见剧情标题，Schema旧档不补造待演票', () => {
  const d = fresh(); buy(d);
  assert.doesNotMatch(scenes.描述场景剧情事件(d.系统._待发送事件), /shop-|商店剧情结算/);
  const old = structuredClone(d); delete old.系统._商店剧情结算;
  const migrated = Schema.parse(old);
  assert.equal(migrated.系统._商店剧情结算.状态, '无');
});

for (const members of [[], ['101']]) {
  test(`凭据演员缺失或跨户变化不能部分结算：${members.join(',') || '空'}`, () => {
    const d = fresh(); buy(d);
    d.户['101'] = 创建户节点(0);
    d.系统._商店剧情结算.参与妻 = members;
    const event = d.系统._待发送事件;
    assert.equal(scenes.消费队首场景剧情(d, event), true);
    const before = structuredClone(d);
    assert.throws(() => deferred.提交商店剧情结算(d, event), /参与/);
    assert.deepEqual(d, before);
  });
}

const frontSource = ['安全操作', '落地', '即时开演'].map(name =>
  only(find(indexAST, n => ts.isFunctionDeclaration(n) && n.name?.text === name)).getText(indexAST)).join('\n');
function lifecycle(channel = '普通') {
  const e = { state: fresh(), id: 'shop-host', epoch: 0, room: '201', held: false, writes: 0,
    generations: 0, mode: '', errors: [], validations: new Set() };
  const clone = value => structuredClone(value);
  const env = {
    _: lodash, ...scenes, shop, item, _时间推进中: false,
    console: { warn: (...args) => e.errors.push(args), error: (...args) => e.errors.push(args) },
    SillyTavern: { chat: Array.from({ length: 11 }, () => ({ mes: '历史消息' })) },
    getVariables: () => ({ stat_data: clone(e.state) }),
    eventEmit() {}, 当前楼层: () => 10, 当前聊天ID: () => e.id, 当前时间线切换世代: () => e.epoch,
    时间线切换协调中: () => false, 读场景: () => ({ 房间id: e.room }), 回合进行中: () => false,
    前台生成租约持有中: () => e.held, 隔离事件进行中: () => false,
    读取最近有效: () => ({ raw: { stat_data: clone(e.state) }, data: clone(e.state) }),
    排队MVU操作: callback => { e.pending = Promise.resolve().then(callback); return e.pending; },
    登记MVU提交校验: valid => { e.validations.add(valid); return () => e.validations.delete(valid); },
    父亲通话未完成: () => false, 手机节拍进行中: () => false, 手机AI生成中: () => false,
    全局数据库AI租约: { 在结算: () => false },
    取得前台生成租约: () => { if (e.held) return null; e.held = true; return { 释放: () => { e.held = false; } }; },
    脚本写入: async (_raw, data) => {
      if (e.mode === '票保存失败') throw new Error('controlled ticket save failure');
      if ([...e.validations].some(valid => !valid())) throw new Error('stale write');
      e.state = clone(data); e.writes++;
    },
    同步全部角色阶段世界书: async () => {}, 捕获保护快照: () => {},
    持久标记场景剧情待重试: async (id, epoch, valid) => {
      if (valid && !valid()) return false;
      return scenes.标记场景剧情待重试(e.state, id, epoch);
    },
  };
  env.执行回合 = async (_action, options = {}) => {
    e.generations++;
    const origin = { id: e.id, epoch: e.epoch, room: e.room };
    const valid = () => origin.id === e.id && origin.epoch === e.epoch && origin.room === e.room;
    const before = clone(e.state), candidate = clone(before), frozen = freeze(before);
    e.onGenerate?.();
    try {
      if (e.mode === '生成失败' || e.mode === '超时' || e.mode === '取消' || !valid()) return false;
      (channel === '普通' ? ordinary : native)(candidate, before, frozen);
      if (e.mode === '结果保存失败') throw new Error('controlled result save failure before persistence');
      if (!valid()) return false;
      e.state = clone(candidate); e.writes++;
      return true;
    } catch (error) { e.errors.push(error.message); return false; }
    finally { options.预占前台生成租约?.释放(); }
  };
  const api = run(`${frontSource}\nmodule.exports = {
    begin: () => 安全操作((raw, data) => 即时开演(() => shop.购买(data, item), raw, data,
      '继续当前剧情', result => result.成功 && Boolean(data.系统._待发送事件), { 标题: item, 场景: '201' }))
  };`, 装配真实时间事务门(env));
  e.begin = async () => { await api.begin(); await e.pending; };
  e.retry = async () => {
    const txn = e.state.系统._场景剧情事务;
    const prepared = scenes.准备重试场景剧情(e.state, e.room, txn.id);
    assert.equal(prepared.成功, true);
    return env.执行回合('重试当前剧情', {});
  };
  return e;
}

for (const channel of ['普通', '原生']) {
  test(`${channel}实际安全壳/即时开演/落地先保存待演票，成功结果才保存账目`, async () => {
    const e = lifecycle(channel);
    e.onGenerate = () => { notSettled(e.state); assert.equal(e.state.现金, 9199); };
    await e.begin();
    assert.equal(e.generations, 1);
    assert.equal(e.writes, 2);
    assert.equal(e.state.户['201']._欠租笔数, 0);
    assert.equal(e.state.户['201'].妻.堕落值, 52);
    assert.equal(e.state.户['201'].夫.疑心值, 10);
  });
  for (const mode of ['票保存失败', '生成失败', '超时', '取消', '结果保存失败']) {
    test(`${channel}${mode}不保存成功后果，合法重试只结算一次`, async () => {
      const e = lifecycle(channel); e.mode = mode;
      await e.begin(); notSettled(e.state);
      assert.equal(e.state.现金, mode === '票保存失败' ? 9999 : 9199);
      assert.equal(e.generations, mode === '票保存失败' ? 0 : 1);
      if (mode === '票保存失败') return;
      e.mode = '';
      assert.equal(await e.retry(), true);
      assert.equal(e.state.现金, 9199);
      assert.equal(e.state.户['201']._欠租笔数, 0);
      assert.equal(e.state.户['201'].妻.堕落值, 52);
    });
  }
  for (const kind of ['切聊天', '回档世代', '切房间']) {
    test(`${channel}${kind}使迟到结果失效`, async () => {
      const e = lifecycle(channel);
      e.onGenerate = () => { if (kind === '切聊天') e.id = 'other'; else if (kind === '回档世代') e.epoch++; else e.room = '202'; };
      await e.begin(); notSettled(e.state);
      assert.equal(e.state.系统._商店剧情结算.状态, '待演');
    });
  }
}
