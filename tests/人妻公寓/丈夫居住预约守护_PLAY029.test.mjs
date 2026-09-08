/* eslint-disable import-x/no-nodejs-modules -- Real Schema/guard/clock/native branch; only host I/O is isolated. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test, { afterEach } from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
let chatVars = {};
globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.getVariables = () => lodash.cloneDeep(chatVars);
globalThis.insertOrAssignVariables = () => undefined;
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const guard = require('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts');
const clock = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const rights = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const risk = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');
const archive = require('../../src/人妻公寓/界面/客户端/composables/配偶档案展示.ts');
const nbs = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
const replace = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');
const modes = ['普通作息', '路线外住', '预约回楼', '提前通知', '待离婚交接', '正式退居'];
const keys = ['_居住模式', '_预约回楼起', '_预约回楼至'];
const textKeys = ['当前心理想法', '当前情绪'];
const oldText = { 当前心理想法: '按已经约好的时间回来取文件。', 当前情绪: '平静' };
const newText = { 当前心理想法: '这次安排已经说清楚了。', 当前情绪: '放心' };
const clone = lodash.cloneDeep;
afterEach(() => { guard.清保护快照(); chatVars = {}; });

function baseline(room = '301', mode = '提前通知') {
  const data = Schema.parse({ 户: { [room]: 创建户节点(0) } });
  data.系统._绝对时段 = 22;
  Object.assign(data.户[room].夫, oldText, {
    _居住模式: mode, _预约回楼起: mode === '预约回楼' ? 22 : -1, _预约回楼至: mode === '预约回楼' ? 24 : -1,
    疑心值: 23, 信任值: 67, 状态: '外出', 结局轨道: '既有轨道', _疑心冻结至: 16,
    _外出至: 17, _剧情外出起: 12, _剧情外出至: 14, _上次出差楼: 9, _上次打断档: 11,
  });
  return data;
}
const corruptions = {
  删除三叶子(raw, room) { for (const key of keys) delete raw.户[room].夫[key]; },
  覆盖三叶子(raw, room) { Object.assign(raw.户[room].夫, { _居住模式: '预约回楼', _预约回楼起: 0, _预约回楼至: 999 }); },
  替换丈夫对象(raw, room) { raw.户[room].夫 = { ...newText }; },
  删除丈夫对象(raw, room) { delete raw.户[room].夫; },
};
function candidate(data, room, kind) {
  const raw = clone(data);
  Object.assign(raw.户[room].夫, newText);
  corruptions[kind](raw, room);
  return raw;
}
const scopes = {
  丈夫可写: room => ({ 妻: [room], 夫: [room], 亲密妻: [] }),
  仅妻可写: room => ({ 妻: [room], 夫: [], 亲密妻: [] }),
  无人可写: () => ({ 妻: [], 夫: [], 亲密妻: [] }),
};
function checkProtected(actual, expected, room) {
  // Enumerate every current Schema husband field except the two legitimate AI text fields.
  for (const key of Object.keys(expected.户[room].夫).filter(key => !textKeys.includes(key))) {
    assert.deepEqual(actual.户[room].夫[key], expected.户[room].夫[key], `${room}.${key}`);
  }
  for (const time of [21, 22, 23, 24, 25]) {
    assert.equal(clock.丈夫在楼(actual.户[room], room, time), clock.丈夫在楼(expected.户[room], room, time), `${room}@${time}`);
    assert.deepEqual(archive.读取配偶档案展示(actual, room, time), archive.读取配偶档案展示(expected, room, time));
  }
  assert.equal(risk.角色线路无关打断已停用(actual, room), risk.角色线路无关打断已停用(expected, room));
}

for (const room of ['201', '301']) for (const mode of modes) for (const kind of Object.keys(corruptions)) {
  for (const [name, scope] of Object.entries(scopes)) test(`PLAY-029 ${room}/${mode}/${kind}/${name}`, () => {
    const base = baseline(room, mode), saved = clone(base);
    guard.捕获保护快照(base, false);
    const raw = candidate(base, room, kind), rawBefore = clone(raw), data = Schema.parse(raw);
    guard.回滚保护字段(data, [room], scope(room), 12, raw);
    checkProtected(data, base, room);
    const expectedText = name === '丈夫可写' && kind !== '删除丈夫对象' ? newText : oldText;
    assert.deepEqual(lodash.pick(data.户[room].夫, textKeys), expectedText);
    assert.deepEqual(raw, rawBefore, 'Raw candidate must remain untouched');
    assert.deepEqual(base, saved, 'Trusted snapshot input must remain untouched');
  });
}
for (const room of ['101', '102', '201', '202', '301', '302']) {
  test(`PLAY-029 ${room}全丈夫Schema字段逐项保护，后台反例保持整户恢复`, () => {
    const base = baseline(room, '预约回楼'), raw = clone(base);
    for (const [key, value] of Object.entries(raw.户[room].夫)) {
      if (textKeys.includes(key)) raw.户[room].夫[key] = newText[key];
      else raw.户[room].夫[key] = typeof value === 'number' ? 99 : key === '_居住模式' ? '普通作息' : '错误候选';
    }
    guard.捕获保护快照(base, false);
    const data = Schema.parse(raw);
    guard.回滚保护字段(data, [room], { 妻: [], 夫: [room], 亲密妻: [] }, 12, raw);
    checkProtected(data, base, room);
    assert.deepEqual(lodash.pick(data.户[room].夫, textKeys), newText);
    const background = Schema.parse(raw);
    guard.回滚保护字段(background, [], { 妻: [], 夫: [], 亲密妻: [] }, 12, raw);
    assert.deepEqual(background.户[room], base.户[room]);
  });
}
test('PLAY-029 无焦点兼容入口及无raw入口仍恢复机械字段', () => {
  const base = baseline(); guard.捕获保护快照(base, false);
  for (const kind of Object.keys(corruptions)) {
    const raw = candidate(base, '301', kind), data = Schema.parse(raw);
    guard.回滚保护字段(data);
    checkProtected(data, base, '301');
  }
});
test('PLAY-029 原始候选的两种stat_data外壳保持同一机械字段保护', () => {
  const base = baseline(); guard.捕获保护快照(base, false);
  for (const wrap of [value => ({ stat_data: value }), value => ({ data: { stat_data: value } })]) {
    const raw = candidate(base, '301', '删除三叶子'), data = Schema.parse(raw);
    guard.回滚保护字段(data, ['301'], scopes.丈夫可写('301'), 12, wrap(raw));
    checkProtected(data, base, '301');
  }
});
test('PLAY-029 显式原回合快照优先于后来内存快照，不倒灌未来预约', () => {
  const old = baseline('201', '预约回楼'), later = baseline('201', '正式退居');
  guard.捕获保护快照(later, false);
  const raw = candidate(old, '201', '删除三叶子'), data = Schema.parse(raw);
  guard.回滚保护字段(data, ['201'], scopes.仅妻可写('201'), 12, raw, old);
  checkProtected(data, old, '201');
});
test('PLAY-029 旧存档本来缺三字段时采用旧档Schema真值，不凭空制造预约', () => {
  const old = baseline('201'); for (const key of keys) delete old.户['201'].夫[key];
  const trusted = Schema.parse(old); guard.捕获保护快照(trusted, false);
  const raw = candidate(trusted, '201', '覆盖三叶子'), data = Schema.parse(raw);
  guard.回滚保护字段(data, ['201'], scopes.丈夫可写('201'), 12, raw);
  checkProtected(data, trusted, '201');
  assert.equal(data.户['201'].夫._居住模式, '普通作息');
});
test('PLAY-029 重复候选不会累积预约，清快照后以回档或新聊天可信基底恢复', () => {
  const first = baseline('301', '提前通知'); guard.捕获保护快照(first, false);
  for (let i = 0; i < 3; i++) {
    const raw = candidate(first, '301', '覆盖三叶子'), data = Schema.parse(raw);
    guard.回滚保护字段(data, ['301'], scopes.仅妻可写('301'), 12, raw);
    checkProtected(data, first, '301');
  }
  guard.清保护快照();
  const restored = baseline('301', '预约回楼'); guard.捕获保护快照(restored, false);
  const stale = candidate(first, '301', '删除三叶子'), data = Schema.parse(stale);
  guard.回滚保护字段(data, ['301'], scopes.仅妻可写('301'), 12, stale);
  checkProtected(data, restored, '301');
});
test('PLAY-029 合法脚本在守护后更新预约，下一次捕获不能恢复成旧预约', () => {
  const base = baseline('301', '提前通知'); guard.捕获保护快照(base, false);
  const raw = candidate(base, '301', '覆盖三叶子'), data = Schema.parse(raw);
  guard.回滚保护字段(data, ['301'], scopes.仅妻可写('301'), 12, raw);
  checkProtected(data, base, '301');
  Object.assign(data.户['301'].夫, { _居住模式: '预约回楼', _预约回楼起: 30, _预约回楼至: 31 });
  guard.捕获保护快照(data, false);
  const nextRaw = candidate(data, '301', '删除三叶子'), next = Schema.parse(nextRaw);
  guard.回滚保护字段(next, ['301'], scopes.仅妻可写('301'), 14, nextRaw);
  assert.deepEqual(lodash.pick(next.户['301'].夫, keys), lodash.pick(data.户['301'].夫, keys));
  assert.equal(clock.丈夫在楼(next.户['301'], '301', 30), '在家');
  assert.equal(clock.丈夫在楼(next.户['301'], '301', 31), '外出');
});
test('PLAY-029 301结局后现有时间同步不能让已守护的提前通知退回普通作息', () => {
  const base = baseline(); base.系统._已完成特殊场景.push('角色路线:301:结局剧情');
  guard.捕获保护快照(base, false);
  for (const kind of Object.keys(corruptions)) {
    const raw = candidate(base, '301', kind), data = Schema.parse(raw);
    guard.回滚保护字段(data, ['301'], scopes.仅妻可写('301'), 12, raw);
    nbs.同步安若妍不必停时间节点(data); replace.同步安若妍换掉时间节点(data);
    assert.equal(data.户['301'].夫._居住模式, '提前通知');
    assert.equal(clock.丈夫在楼(data.户['301'], '301', 22), '外出');
    assert.ok(data.系统._已完成特殊场景.includes('角色路线:301:结局剧情'));
  }
});

// The actual native manual reprocessing branch, including its cold-start fallback, is executed unchanged.
// The real permission reader reads host chat variables; only the render/persistence boundary is adapted.
const nativeText = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('index.ts', nativeText, ts.ScriptTarget.Latest, true);
const branches = [];
(function visit(node) {
  if (ts.isIfStatement(node) && node.expression.getText(ast) === '!正文租约生效中()' && node.getText(ast).includes('const 手动范围 =')) branches.push(node.getText(ast));
  ts.forEachChild(node, visit);
})(ast);
assert.equal(branches.length, 1, 'Native manual reprocessing branch must be unique');
const nativeJS = ts.transpileModule(`async function run() { ${branches[0]} } return run();`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
async function manual(raw, base, room, options = {}) {
  const updates = [], newVars = { stat_data: clone(raw) };
  chatVars = { _整表视图范围: { ...scopes[options.writable ? '丈夫可写' : '仅妻可写'](room), 楼层: options.scopeFloor ?? 12 } };
  const deps = { _: lodash, Schema, ...guard, 读取AI可写变量范围: rights.读取AI可写变量范围,
    正文租约生效中: () => false, rawStat: raw, 旧变量: { stat_data: base }, 新变量: newVars, 末楼层: 12,
    同步原生整表视图: async value => { updates.push(clone(value)); if (options.fail) throw new Error('TEST_VIEW_FAILED'); },
    console: { info() {}, warn() {}, error() {} },
  };
  await Function(...Object.keys(deps), nativeJS)(...Object.values(deps));
  return { data: newVars.stat_data, updates };
}
for (const [room, mode] of [['201', '路线外住'], ['201', '预约回楼'], ['301', '提前通知'], ['301', '预约回楼']]) {
  for (const kind of ['删除三叶子', '覆盖三叶子', '替换丈夫对象']) for (const writable of [false, true]) {
    test(`PLAY-029 原生重处理 ${room}/${mode}/${kind}/丈夫可写=${writable}`, async () => {
      const base = baseline(room, mode); guard.捕获保护快照(base, false);
      const raw = candidate(base, room, kind), r = await manual(raw, base, room, { writable });
      checkProtected(r.data, base, room);
      assert.equal(r.updates.length, 1);
      assert.deepEqual(lodash.pick(r.data.户[room].夫, textKeys), writable ? newText : oldText);
    });
  }
}
test('PLAY-029 原生冷启动缺快照时用旧变量全量恢复，不采纳坏候选', async () => {
  const base = baseline('301', '预约回楼'); guard.清保护快照();
  const r = await manual(candidate(base, '301', '覆盖三叶子'), base, '301');
  assert.deepEqual(r.data, base); assert.equal(r.updates.length, 1);
});
test('PLAY-029 失败或取消请求遗留的其他楼权限不能给当前重处理授权', async () => {
  const base = baseline(); guard.捕获保护快照(base, false);
  const r = await manual(candidate(base, '301', '替换丈夫对象'), base, '301', { writable: true, scopeFloor: 10 });
  assert.deepEqual(r.data.户['301'].夫, base.户['301'].夫);
});
test('PLAY-029 原生视图提交失败不污染可信快照，原候选可再次正确恢复', async () => {
  const base = baseline(); guard.捕获保护快照(base, false);
  const raw = candidate(base, '301', '删除三叶子');
  await assert.rejects(manual(raw, base, '301', { fail: true }), /TEST_VIEW_FAILED/u);
  checkProtected((await manual(raw, base, '301')).data, base, '301');
});
