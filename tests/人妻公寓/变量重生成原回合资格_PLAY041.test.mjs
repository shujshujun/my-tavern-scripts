/* eslint-disable import-x/no-nodejs-modules -- Node regression tests */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
import * as ts from 'typescript';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 门牌列表 } = require('../../src/人妻公寓/stageConfig.ts');
const risk = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');
const { 是医院硬锁状态 } = require('../../src/人妻公寓/脚本/游戏逻辑/生产系统.ts');
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const oldSource = process.env.PLAY041_BEFORE === '1';

function loadBefore(name, original, dependency) {
  const source = read(`../../.codex-tmp/codex-takeover-20260908/play041-before-${name}.ts`);
  const localRequire = createRequire(new URL(original, import.meta.url));
  const module = { exports: {} };
  new Function('require', 'exports', 'module', transpile(source))(
    request => request === './冷落系统' && dependency ? dependency : localRequire(request), module.exports, module,
  );
  return module.exports;
}
const cold = oldSource
  ? loadBefore('cold', '../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts')
  : require('../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts');
const core = oldSource
  ? loadBefore('core', '../../src/人妻公寓/脚本/游戏逻辑/变量重新生成核心.ts', cold)
  : require('../../src/人妻公寓/脚本/游戏逻辑/变量重新生成核心.ts');

const starters = {
  '101': d => { d.系统._家庭计划.阶段 = '待投资料'; },
  '102': d => { d.系统._第二机位.阶段 = '待对饮'; },
  '201': d => { Object.assign(d.系统._许曼君分居, { 阶段: '待初谈', 当前场景: '第一幕初谈', 当前拍: 2 }); },
  '202': d => { d.系统._不再留门.道具已使用 = true; },
  '301': d => { d.系统._安若妍不必停.阶段 = '等待预约夜'; },
  '302': d => { d.系统._回国.阶段 = '已完成'; },
};
const scope = { 妻: [...门牌列表], 夫: [], 亲密妻: [...门牌列表] };
function fresh() {
  const d = Schema.parse({ 户: Object.fromEntries(门牌列表.map(m => [m, 创建户节点(0)])) });
  d.系统._母亲入列 = true;
  d.系统._绝对时段 = 60;
  for (const node of Object.values(d.户)) {
    node.妻.当前阶段 = 5;
    node.妻.堕落值 = 95;
    Object.assign(node.妻._成长账, { 上次有效成长钟楼: 0, 成长轮次: 2, 已结算冷落日: 0 });
    node.妻.当前情绪 = '记得没有说完的话';
  }
  return d;
}
function oldWave(wife) {
  Object.assign(wife._冷落余波, { 状态: '安抚中', 需安抚楼: 4, 已安抚楼: 1, 触发钟楼: 24 });
}
function capture(data, m) {
  if (!oldSource) return cold.捕获冷落结算资格(data, m);
  // The pre-fix producer had no ticket field. Feed its core the intended frozen facts
  // so the red run isolates the missing consumers rather than a missing export.
  return {
    线路接管: risk.角色线路无关打断已停用(data, m),
    母亲自由共居: m === '302' && (data.系统._双重继承.阶段 === '已完成' || data.系统._已完成特殊场景.includes('双重继承')),
    医院硬锁: 是医院硬锁状态(data.户[m].妻._生产.状态),
  };
}
function runRound(before, change = () => {}, candidates = {}, protection = {}) {
  const derivedBefore = lodash.cloneDeep(before);
  change(derivedBefore);
  const ai = core.提取变量重生成AI结果(derivedBefore, scope);
  const normal = lodash.cloneDeep(derivedBefore);
  const growth = cold.记录全楼有效成长(before, normal, candidates, 60);
  cold.结算全楼冷落(normal, protection);
  const ticket = {
    当前绝对时段: 60, 母亲入列: before.系统._母亲入列,
    微信联系保护: lodash.cloneDeep(protection), 妻: {}, 疑心: {},
  };
  for (const m of 门牌列表) ticket.妻[m] = {
    回合前: lodash.cloneDeep(before.户[m].妻),
    派生前: lodash.cloneDeep(derivedBefore.户[m].妻),
    原派生后: lodash.cloneDeep(normal.户[m].妻),
    独立合法正候选: [],
    余波冻结: cold.余波有冻结效力(m, before.户[m].妻, before.系统._母亲入列, before),
    结算资格: capture(derivedBefore, m),
  };
  return { before, ai, normal, ticket, growth, candidates };
}
function replay(round, ai = round.ai, candidates = round.candidates) {
  return core.重算变量重生成派生(round.ai, ai, round.ticket, candidates);
}
function sameAsNormal(round, result = replay(round)) {
  for (const m of 门牌列表) assert.deepEqual(result.妻[m], round.normal.户[m].妻, `${m}: replay must equal normal settlement`);
  assert.deepEqual(result.成长, round.growth);
  return result;
}

for (const m of 门牌列表) {
  test(`PLAY-041: ${m}真实线路接管后的同AI重算保留正常回合结果`, () => {
    const before = fresh();
    starters[m](before);
    assert.equal(risk.角色线路无关打断已停用(before, m), true);
    const round = runRound(before);
    sameAsNormal(round);
    assert.equal(round.normal.户[m].妻.堕落值, 95);
    const other = 门牌列表.find(other => other !== m);
    assert.ok(round.normal.户[other].妻.堕落值 < 95);
  });
  test(`PLAY-041: ${m}退休余波保留历史且新合法堕落成长仍计账`, () => {
    const before = fresh();
    starters[m](before);
    oldWave(before.户[m].妻);
    const round = runRound(before, next => { next.户[m].妻.堕落值++; }, { [m]: ['堕落值'] });
    const result = sameAsNormal(round);
    assert.equal(result.成长.find(item => item.门牌 === m).有效, true);
    assert.equal(result.妻[m]._成长账.成长轮次, 3);
    assert.deepEqual(result.妻[m]._冷落余波, before.户[m].妻._冷落余波);
    assert.equal(result.妻[m].当前情绪, before.户[m].妻.当前情绪);
  });
}

for (const status of ['待产通知', '待产', '陪产中', '住院中']) {
  test(`PLAY-041: ${status}原回合资格只校准冷落钟且不增加成长轮次`, () => {
    const before = fresh();
    before.户['201'].妻._生产.状态 = status;
    const result = sameAsNormal(runRound(before));
    assert.equal(result.妻['201'].堕落值, 95);
    assert.equal(result.妻['201']._成长账.上次有效成长钟楼, 60);
    assert.equal(result.妻['201']._成长账.成长轮次, 2);
  });
}

for (const kind of ['阶段', '完成ID']) {
  test(`PLAY-041: 双重继承${kind}完成后清遗留余波，其他字段保留`, () => {
    const before = fresh();
    oldWave(before.户['302'].妻);
    if (kind === '阶段') before.系统._双重继承.阶段 = '已完成';
    else before.系统._已完成特殊场景.push('双重继承');
    const result = sameAsNormal(runRound(before));
    assert.equal(result.妻['302']._冷落余波.状态, '无');
    assert.equal(result.妻['302']._成长账.上次有效成长钟楼, 0);
    assert.equal(result.妻['302'].当前情绪, before.户['302'].妻.当前情绪);
  });
}

test('PLAY-041: 线路接管和医院重叠时按正常优先级保留旧账与余波', () => {
  const before = fresh();
  starters['101'](before);
  before.户['101'].妻._生产.状态 = '住院中';
  oldWave(before.户['101'].妻);
  const result = sameAsNormal(runRound(before));
  assert.deepEqual(result.妻['101'], before.户['101'].妻);
});

test('PLAY-041: 常规户原回合微信联系保护生效，其他户仍正常下降', () => {
  const before = fresh();
  const round = runRound(before, () => {}, {}, { 201: 60 });
  const result = sameAsNormal(round);
  assert.equal(result.妻['201'].堕落值, 95);
  assert.equal(result.妻['202'].堕落值, 90);
  assert.equal(result.妻['201']._成长账.成长轮次, 2);
});

test('PLAY-041: 仅购买未启动的路线仍执行普通冷落', () => {
  const before = fresh();
  before.系统._家庭计划.阶段 = '待安装';
  before.系统._第二机位.阶段 = '待门缝';
  before.系统._安若妍不必停.阶段 = '已购买';
  before.系统._回国.阶段 = '待使用经营归档册';
  for (const m of 门牌列表) assert.equal(risk.角色线路无关打断已停用(before, m), false);
  const result = sameAsNormal(runRound(before));
  for (const m of 门牌列表) assert.equal(result.妻[m].堕落值, 90);
});

test('PLAY-041: 后期开线或回档变化不能倒灌旧回合资格', () => {
  const original = fresh();
  const normalTicket = runRound(original);
  starters['202'](original);
  assert.equal(replay(normalTicket).妻['202'].堕落值, 90);
  const routeTicket = runRound(original);
  original.系统._不再留门.道具已使用 = false;
  assert.equal(replay(routeTicket).妻['202'].堕落值, 95);
  assert.equal(routeTicket.ticket.妻['202'].结算资格.线路接管, true);
});

test('PLAY-041: 改变AI数值后重算等于原资格下正常结算，输入保持不变', () => {
  const before = fresh();
  starters['202'](before);
  oldWave(before.户['202'].妻);
  const original = runRound(before);
  const changed = runRound(before, next => { next.户['202'].妻.堕落值++; });
  const inputs = lodash.cloneDeep({ ai: original.ai, next: changed.ai, ticket: original.ticket });
  const result = replay(original, changed.ai, {});
  sameAsNormal(changed, result);
  assert.deepEqual({ ai: original.ai, next: changed.ai, ticket: original.ticket }, inputs);
  assert.deepEqual(replay(original, changed.ai, {}), result, 'Repeated recalculation is deterministic');
});

test('PLAY-041: 缺少资格的纯核心旧票保留旧API行为', () => {
  const before = fresh();
  starters['202'](before);
  const round = runRound(before);
  for (const item of Object.values(round.ticket.妻)) delete item.结算资格;
  const result = replay(round);
  const expected = lodash.cloneDeep(round.ticket.妻['202'].派生前);
  cold.记录本轮有效成长('202', round.ticket.妻['202'].回合前, expected, 60, true);
  cold.结算妻冷落('202', expected, 60, true);
  assert.deepEqual(result.妻['202'], expected);
  assert.equal(expected.堕落值, 90);
});

const engine = read(oldSource
  ? '../../.codex-tmp/codex-takeover-20260908/play041-before-engine.ts'
  : '../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
const ast = ts.createSourceFile('engine.ts', engine, ts.ScriptTarget.Latest, true);
const reader = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === '读取变量重生成上下文');
assert.ok(reader);
function readContext(context) {
  return new Function('_', '读上次回合', transpile(reader.getText(ast)) + '\nreturn 读取变量重生成上下文();')(
    lodash, () => ({ 变量重生成: context }),
  );
}
function validContext() {
  const round = runRound(fresh());
  return {
    版本: 3, 聊天ID: 'chat-A', 助手楼层: 20, 回合令牌: 'original-turn', 行动: '继续当前回合', 快照: 'snapshot',
    焦点: ['201'], 变量范围: scope, 解析基准: round.before, 原AI结果: round.ai,
    派生票据: round.ticket, 风闻票据: { 派生后: {} },
  };
}
test('PLAY-041: 持久化v2上下文安全拒绝且不改写旧存档', () => {
  const context = validContext();
  context.版本 = 2;
  const saved = lodash.cloneDeep(context);
  assert.equal(readContext(context), null);
  assert.deepEqual(context, saved);
});
test('PLAY-041: 新回合v3完整资格上下文可读取', () => {
  const context = validContext();
  assert.equal(readContext(context), context);
});
test('PLAY-041: v3缺少任一已记录妻的资格时拒绝', () => {
  const context = validContext();
  delete context.派生票据.妻['202'].结算资格;
  assert.equal(readContext(context), null);
});
test('PLAY-041: v3资格中的非布尔值不能冒充冻结事实', () => {
  for (const field of ['线路接管', '母亲自由共居', '医院硬锁']) {
    const context = validContext();
    context.派生票据.妻['202'].结算资格[field] = 'false';
    assert.equal(readContext(context), null, field);
  }
});
