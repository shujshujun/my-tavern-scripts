/* eslint-disable import-x/no-nodejs-modules -- Native cleanup and actual appointment readers with isolated host I/O */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
globalThis._ = lodash;
const plans = require('../../src/人妻公寓/脚本/游戏逻辑/手机/邀约计划.ts');
const { 门牌列表 } = require('../../src/人妻公寓/stageConfig.ts');
function compile(file, names, environment) {
  const source = readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${file}.ts`, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(`${file}.ts`, source, ts.ScriptTarget.Latest, true);
  const selected = new Set(), declarations = new Map();
  for (const node of ast.statements) {
    if (ts.isFunctionDeclaration(node) && node.name) declarations.set(node.name.text, node);
    if (ts.isVariableStatement(node)) for (const d of node.declarationList.declarations) {
      if (ts.isIdentifier(d.name)) declarations.set(d.name.text, node);
    }
  }
  for (const name of names) { assert.ok(declarations.has(name), name); selected.add(declarations.get(name)); }
  const text = [...selected].sort((a, b) => a.pos - b.pos).map(n => n.getText(ast)).join('\n');
  const js = ts.transpileModule(`${text}\nmodule.exports = {${names.join(',')}};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', ...Object.keys(environment), js)(module, module.exports, ...Object.values(environment));
  return module.exports;
}
const plan = (shape = 'group', patch = {}) => ({
  m: '101', 创建楼: 1, 创建绝对时段: 6, 目标绝对时段: 18, 地点: '大堂',
  ...(shape === 'group' ? { 版本: 2, 成员: ['101', '102', '201'] } : shape === 'single-v2' ? { 版本: 2, 成员: ['101'] } : {}),
  ...patch,
});
function fixture(initial = plan()) {
  let vars = { _手机邀约计划: initial, _场景: { 房间id: '大堂' }, _赴约: { m: '202', 起楼: 1, 至楼: 8 }, _上次回合: { 旧: true } };
  let generation = 1, chat = 'invitation-test', beforeUpdate = () => {}, saveFailure = '', waitDB = async () => true;
  const saved = [], writes = [], databaseMarks = [];
  const environment = {
    _: lodash, ...plans, 门牌列表,
    当前聊天ID: () => chat, 当前时间线切换世代: () => generation,
    getLastMessageId: () => 4, getVariables: () => structuredClone(vars),
    // Actual MVU reads and storage are in-memory adapters; current stat is neutral and has no active route.
    读取最近有效: () => ({ raw: {}, data: { 系统: { _绝对时段: 12 } } }),
    updateVariablesWith: async updater => { await beforeUpdate(); vars = updater(structuredClone(vars)); writes.push(structuredClone(vars)); },
    排队MVU操作: async work => work(), 等待数据库时间线就绪: () => waitDB(),
    标记数据库时间线将变更: (...args) => { databaseMarks.push(structuredClone(args)); },
    作废晋阶镜像时间线: async () => {},
    立即持久保存手机聊天变量: async () => {
      if (saveFailure === 'before') throw new Error('save-before');
      saved.push(structuredClone(vars));
      if (saveFailure === 'after') throw new Error('save-after');
    },
    // Refresh mirror and unrelated actor/worldbook I/O are explicit boundaries, not claimed by this test.
    选择微信刷新恢复值: value => ({ 值: value }),
    清保护快照: () => {}, 捕获保护快照: () => {},
    恢复安若妍不必停失效亲密检查点: () => false, 恢复安若妍换掉失效亲密检查点: () => false,
    同步安若妍换掉当前剧情票: () => false, 清理线路失效待演打断: () => false,
    脚本写入: async () => { throw new Error('No actor checkpoint write belongs to this fixture'); },
    等待晋阶镜像写入: async () => {}, 同步入住世界书条目: async () => {},
    作废全部角色阶段世界书缓存: () => {}, 同步全部角色阶段世界书: async () => {}, 同步整表视图: async () => {},
    console: { info: () => {} },
  };
  const engine = compile('回合引擎', ['回合变量键', '时间线清场变量键', '恢复回合变量快照',
    '裁手机时间线', '协调已删时间线', '协调原生时间线切换'], environment);
  const readers = {
    ...compile('手机/数据层', ['读手机邀约计划'], environment),
    ...compile('snapshotSystem', ['读赴约们', '读赴约'], environment),
  };
  return {
    engine, readers, saved, writes, databaseMarks,
    get vars() { return structuredClone(vars); },
    replace: value => { vars = structuredClone(value); },
    nextGeneration: () => { generation++; },
    setChat: value => { chat = value; },
    onUpdate: fn => { beforeUpdate = fn; },
    failSave: mode => { saveFailure = mode; },
    onWaitDB: fn => { waitDB = fn; },
  };
}

test('执行后的集合保留快照键但排除无条件清场，不能只检测数组末尾文本', () => {
  const f = fixture();
  assert.ok(f.engine.回合变量键.includes('_手机邀约计划'));
  assert.equal(f.engine.时间线清场变量键.includes('_手机邀约计划'), false);
  for (const key of ['_场景', '_赴约', '_上次回合', '_上次隔离回合', '_时间撤销点']) {
    assert.ok(f.engine.时间线清场变量键.includes(key));
  }
});

test('TT 酒馆同楼 swipe 的精确楼号不会被回合引擎兜底改写成当前末楼', async () => {
  const swipe = fixture();
  await swipe.engine.协调原生时间线切换('切分支', 2);
  assert.deepEqual(swipe.databaseMarks, [
    [2, '切换消息分支', { 已有共享栅栏覆盖时不重标: true }],
  ]);

  const deleted = fixture();
  await deleted.engine.协调原生时间线切换('删楼', 2);
  assert.deepEqual(deleted.databaseMarks, [
    [4, '删除消息', { 已有共享栅栏覆盖时不重标: true }],
  ], '删楼事件载荷是被删消息，数据库边界仍应取删完后的存活末楼');
});
for (const type of ['删楼', '切分支']) {
  for (const shape of ['legacy-single', 'single-v2', 'group']) {
    for (const [anchor, patch, retained] of [
      ['past', {}, true], ['boundary', { 创建楼: 4, 创建绝对时段: 12 }, true],
      ['future-floor', { 创建楼: 5 }, false], ['future-clock', { 创建绝对时段: 13 }, false],
    ]) {
      test(`${type}/${shape}/${anchor}: 原生协调后实际计划与赴约读口一致`, async () => {
        const original = plan(shape, patch), f = fixture(original);
        await f.engine.协调原生时间线切换(type);
        assert.equal(f.vars._赴约, null, 'Legacy per-turn attendance is still cleared');
        assert.equal(f.vars._上次回合, null);
        if (!retained) {
          assert.equal(f.vars._手机邀约计划, null); assert.equal(f.readers.读手机邀约计划(), null);
          assert.deepEqual(f.readers.读赴约们(4, '大堂', 18), []); return;
        }
        assert.deepEqual(f.readers.读手机邀约计划(), original);
        assert.equal(plans.手机邀约计划状态(f.readers.读手机邀约计划(), 12, 4), '待赴约');
        assert.deepEqual(f.readers.读赴约们(4, '大堂', 18).map(x => x.m), plans.手机邀约计划成员(original));
        assert.equal(f.readers.读赴约(4, '大堂', 18).m, original.m);
        assert.deepEqual(f.readers.读赴约们(4, '大堂', 12), []);
        assert.deepEqual(f.readers.读赴约们(4, '大堂', 19), []);
        assert.deepEqual(f.readers.读赴约们(4, '天台', 18), []);
        const saved = f.saved.at(-1); assert.deepEqual(saved._手机邀约计划, original);
        await f.engine.协调原生时间线切换(type);
        assert.deepEqual(f.vars._手机邀约计划, original, 'Repeated cleanup is idempotent');
        const reloaded = fixture(); reloaded.replace(saved);
        assert.deepEqual(reloaded.readers.读赴约们(4, '大堂', 18).map(x => x.m), plans.手机邀约计划成员(original));
      });
    }
  }
}
for (const mode of ['失败', '取消', '重掷']) {
  test(`${mode}仍能恢复当前回合移除的共同成员及其他快照字段`, async () => {
    const f = fixture(), before = lodash.pick(f.vars, f.engine.回合变量键);
    const changed = f.vars;
    changed._手机邀约计划 = plans.移除手机邀约计划成员(changed._手机邀约计划, ['101', '102']);
    changed._场景 = { 房间id: '天台' }; changed._赴约 = null; f.replace(changed);
    if (mode === '重掷') await f.engine.协调已删时间线(4, { 恢复回合变量: before, 清上次回合: true });
    else await f.engine.恢复回合变量快照(before);
    assert.deepEqual(f.readers.读手机邀约计划(), before._手机邀约计划);
    assert.deepEqual(f.vars._场景, before._场景);
    const restored = f.vars; restored._赴约 = null; f.replace(restored);
    assert.equal(f.readers.读赴约们(4, '大堂', 18).length, 3);
  });
}
test('已经真实取消的计划在删楼后不从空值复活；没有预约的旧档也保持为空', async () => {
  for (const value of [null, undefined]) {
    const f = fixture(value); const vars = f.vars; vars._手机邀约计划 = value; f.replace(vars);
    await f.engine.协调原生时间线切换('删楼');
    assert.equal(f.readers.读手机邀约计划(), null); assert.deepEqual(f.readers.读赴约们(4, '大堂', 18), []);
  }
});
for (const failure of ['before', 'after']) {
  test(`持久化${failure}抛错可重入，不删除已存活预约`, async () => {
    const f = fixture(), original = f.vars._手机邀约计划;
    f.failSave(failure); await assert.rejects(f.engine.协调原生时间线切换('删楼'), /save-/);
    assert.deepEqual(f.readers.读手机邀约计划(), original);
    f.failSave(''); await f.engine.协调原生时间线切换('删楼');
    assert.deepEqual(f.saved.at(-1)._手机邀约计划, original);
    assert.equal(f.readers.读赴约们(4, '大堂', 18).length, 3);
  });
}
test('旧世代 updater 迟到时不得清除新分支预约或写入任何变量', async () => {
  const f = fixture(), original = f.vars;
  f.onUpdate(() => { f.nextGeneration(); });
  await assert.rejects(f.engine.协调原生时间线切换('切分支'), /TIMELINE_CHANGED/);
  assert.deepEqual(f.vars, original); assert.equal(f.writes.length, 0); assert.equal(f.saved.length, 0);
});
test('数据库等待期间切聊或 A→B→A 后，旧协调不进入 chat 写口', async () => {
  for (const returnToA of [false, true]) {
    const f = fixture(), original = f.vars;
    f.onWaitDB(async () => { f.setChat('B'); f.nextGeneration(); if (returnToA) f.setChat('invitation-test'); return false; });
    await assert.rejects(f.engine.协调原生时间线切换('删楼'), /TIMELINE_CHANGED/);
    assert.deepEqual(f.vars, original); assert.equal(f.writes.length, 0);
  }
});
