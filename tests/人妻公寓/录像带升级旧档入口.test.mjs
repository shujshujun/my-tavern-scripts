/* eslint-disable import-x/no-nodejs-modules -- 真实购买、状态、界面分流和使用监听器；仅宿主I/O隔离。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
import { 填入本版周线完成夹具 } from './不再留门.fixture.mjs';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.getLastMessageId = () => 40;
globalThis.SillyTavern = { chat: [], getCurrentChatId: () => 'tape-upgrade' };
const noIO = () => { throw new Error('EXTERNAL_IO_FORBIDDEN'); };
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: noIO } };
const ts = require('typescript');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const config = require('../../src/人妻公寓/stageConfig.ts');
const shop = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4状态.ts');
const special = require('../../src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts');
const read = file => readFileSync(new URL(`../../src/人妻公寓/${file}`, import.meta.url), 'utf8');
const indexAST = ts.createSourceFile('index.ts', read('脚本/游戏逻辑/index.ts'), ts.ScriptTarget.Latest, true);
let callback;
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(indexAST) === 'eventOn' &&
      node.arguments[0]?.text === '人妻公寓:使用录像带') callback = node.arguments[1].getText(indexAST);
  ts.forEachChild(node, visit);
}
visit(indexAST);
assert.ok(callback);
const callbackJS = ts.transpileModule(`const callback = ${callback};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const appScript = read('界面/客户端/App.vue').match(/<script setup lang="ts">([\s\S]*?)<\/script>/u)[1];
const appAST = ts.createSourceFile('app.ts', appScript, ts.ScriptTarget.Latest, true);
const appFunction = appAST.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === '旧录像带遗留商品可见');
assert.ok(appFunction);
const appJS = ts.transpileModule(appFunction.getText(appAST), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const appLegacy = data => new Function('data', '录像带沿用旧流程', `${appJS};return 旧录像带遗留商品可见();`)(
  { value: data }, route.录像带沿用旧流程,
);

function fresh(keys = ['录像带:102'], complete = true) {
  const d = Schema.parse({ 户: { 102: 创建户节点(0), 202: 创建户节点(0) }, 现金: 99999 });
  for (const m of ['102', '202']) d.户[m].妻.当前阶段 = 5;
  d.系统._特殊场景前置.push(...keys);
  if (complete) {
    填入本版周线完成夹具(d);
    d.系统._第二机位.阶段 = '已完成';
    d.系统._特殊场景前置.push('录像带结局:沈母带封存');
  }
  return d;
}

function host(initial) {
  const e = { saved: structuredClone(initial), messages: [], writes: 0, legacyCalls: 0, failSave: false };
  const deps = {
    ...route,
    安全操作: async work => work({}, Schema.parse(structuredClone(e.saved))),
    读场景: () => ({ 房间id: '管理员室' }), 当前楼层: () => 40,
    启动录像带: (...args) => { e.legacyCalls++; return special.启动录像带(...args); },
    落地: async (result, _raw, data) => {
      e.messages.push(result);
      if (result.变动) {
        if (e.failSave) throw new Error('save failed');
        e.saved = structuredClone(data); e.writes++;
      }
    },
    eventEmit: () => {},
  };
  e.use = new Function(...Object.keys(deps), `${callbackJS};return callback;`)(...Object.values(deps));
  return e;
}

for (const keys of [[], ['录像带:102'], ['录像带:202'], ['录像带:102', '录像带:202']]) {
  test(`新承接已归档，残留${keys.join(',') || '无'}：真实购买和使用均走V4且只扣款一次`, async () => {
    const d = fresh(keys);
    assert.equal(appLegacy(d), false);
    assert.equal(shop.录像带剧情商品可见(d, '录像带'), true);
    const cash = d.现金;
    assert.equal(shop.购买(d, '录像带').成功, true);
    assert.equal(d.现金, cash - config.查道具('录像带').价格);
    assert.equal(d.系统._录像带V4.录像带已购买, true);
    assert.equal(d.系统._录像带V4.阶段, '待使用录像带');
    const bought = structuredClone(d);
    assert.equal(shop.购买(d, '录像带').成功, false);
    assert.deepEqual(d, bought);
    const e = host(d);
    await e.use();
    assert.equal(e.legacyCalls, 0);
    assert.equal(e.saved.系统._录像带V4.阶段, '待购赠锁');
    assert.equal(e.saved.现金, d.现金);
    assert.deepEqual(e.saved.系统._特殊场景前置, d.系统._特殊场景前置);
    const used = structuredClone(e.saved);
    await e.use();
    assert.equal(e.writes, 1);
    assert.deepEqual(e.saved, used);
  });
}

test('升级旧档背包已有录像带但无V4购买节点：只读展示已购买，使用恢复登记且不重扣款', async () => {
  const raw = fresh();
  raw.背包.push('录像带');
  delete raw.系统._录像带V4;
  const d = Schema.parse(raw);
  const before = structuredClone(d);
  for (const m of ['102', '202']) {
    assert.equal(route.读取录像带V4档案提示(d, m).状态, '《录像带》已购买');
  }
  assert.equal(appLegacy(d), false);
  assert.equal(route.录像带V4使用阻断(d), '');
  assert.deepEqual(d, before);
  const e = host(d);
  await e.use();
  assert.equal(e.legacyCalls, 0);
  assert.equal(e.saved.系统._录像带V4.录像带已购买, true);
  assert.equal(e.saved.系统._录像带V4.录像带已使用, true);
  assert.deepEqual(e.saved.背包, d.背包);
  assert.equal(e.saved.现金, d.现金);
  assert.deepEqual(e.saved.系统._特殊场景前置, d.系统._特殊场景前置);
  assert.equal(appLegacy(Schema.parse(e.saved)), false);
});

test('使用落地失败不留下已使用状态；重试恢复，同一存档重载不重复登记', async () => {
  const d = fresh(); d.背包.push('录像带');
  const e = host(d); e.failSave = true;
  await assert.rejects(e.use(), /save failed/);
  assert.deepEqual(e.saved, d);
  e.failSave = false;
  await e.use();
  const reload = host(Schema.parse(e.saved));
  await reload.use();
  assert.equal(reload.writes, 0);
  assert.equal(reload.legacyCalls, 0);
});

for (const [name, lock] of [
  ['特殊现场', d => { d.系统._特殊场景.id = '静音会议'; }],
  ['普通现场', d => { d.系统._场景剧情事务.id = 'active-scene'; }],
  ['电话', d => { d.系统._父亲通话.状态 = '通话中'; }],
  ['亲密现场', d => { d.系统._性爱场景.状态 = '进行中'; }],
]) test(`新版已购录像带仍尊重${name}占用，不伪报缺钥匙也不改写进度`, async () => {
  const d = fresh(); d.背包.push('录像带'); lock(d);
  const e = host(d);
  await e.use();
  assert.equal(e.legacyCalls, 0);
  assert.match(e.messages.at(-1).提示, /当前现场或电话/);
  assert.equal(e.writes, 0);
  assert.deepEqual(e.saved, d);
});

test('其他线路等待微信而无活动现场，不阻止新版录像带开始筹备', async () => {
  const d = fresh(); d.背包.push('录像带');
  d.系统._回国.茶话会状态 = '交代正事';
  const e = host(d); await e.use();
  assert.equal(e.saved.系统._录像带V4.录像带已使用, true);
  assert.deepEqual(e.saved.系统._回国, d.系统._回国);
});

test('新版硬凭据未完成时不迁移旧路线，不凭背包或旧完成字符串补造前置', async () => {
  const d = fresh(['录像带:102'], false); d.背包.push('录像带');
  d.系统._已完成特殊场景.push('不再留门');
  assert.equal(appLegacy(d), true);
  const e = host(d); await e.use();
  assert.equal(e.legacyCalls, 1);
  assert.match(e.messages.at(-1).提示, /两把钥匙/);
  assert.equal(e.writes, 0);
  assert.deepEqual(e.saved, d);
});

test('已开演的旧场次和已完成结局不被新版资格重置', () => {
  for (const id of ['录像带前置', '录像带', '录像带双承接']) {
    const d = fresh(); d.系统._特殊场景.id = id;
    assert.equal(route.录像带沿用旧流程(d), true);
    assert.equal(appLegacy(d), true);
    assert.equal(route.录像带V4录像带可购买(d), false);
  }
  for (const id of ['录像带', '录像带结局']) {
    const d = fresh(); d.系统._已完成特殊场景.push(id);
    assert.equal(route.录像带V4录像带可购买(d), false);
    assert.equal(route.读取录像带V4档案提示(d, '102').完成, true);
  }
});
