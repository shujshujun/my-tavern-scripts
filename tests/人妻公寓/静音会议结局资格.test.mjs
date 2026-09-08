/* eslint-disable import-x/no-nodejs-modules -- Node-only eligibility regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';
import { computed, ref } from 'vue';
import * as ts from 'typescript';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const config = require('../../src/人妻公寓/静音会议配置.ts');
const stage = require('../../src/人妻公寓/stageConfig.ts');
const hospital = require('../../src/人妻公寓/脚本/游戏逻辑/生产系统.ts');
// Host rendering is unrelated to eligibility and actor production; these use real implementations.
const phonePath = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机系统.ts');
require.cache[phonePath] = { id: phonePath, filename: phonePath, loaded: true, exports: { 取会场私聊摘要提示: () => '' } };
const scene = require('../../src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts');

function fresh(rooms = ['101', '102', '201', '202', '301']) {
  const d = Schema.parse({ 户: Object.fromEntries(rooms.map(m => [m, 创建户节点(0)])) });
  for (const h of Object.values(d.户)) { h.妻.当前阶段 = 5; h.妻.特殊 = ['遥控跳蛋']; }
  d.背包.push('静音会议');
  return d;
}

// Evaluate the actual reactive candidate initializer used by the desktop/mobile preparation UI.
const source = readFileSync(new URL('../../src/人妻公寓/界面/客户端/composables/useMuteMeeting.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('useMuteMeeting.ts', source, ts.ScriptTarget.Latest, true);
let initializer;
function find(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === '静音会议候选列表') initializer = node.initializer;
  ts.forEachChild(node, find);
}
find(ast);
assert.ok(initializer);
function uiCandidates(data) {
  const env = { computed, data, 静音会议候选门牌顺序: config.静音会议候选门牌顺序,
    静音会议角色结局已完成: config.静音会议角色结局已完成,
    户静态表: stage.户静态表, 处于医院硬锁: hospital.处于医院硬锁 };
  const js = ts.transpileModule(`const result = ${initializer.getText(ast)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(...Object.keys(env), `${js}\nreturn result;`)(...Object.values(env));
}
const completedCases = [
  ['101借种', d => d.系统._已完成特殊场景.push('借种'), ['101']],
  ['共享V4完成ID', d => d.系统._已完成特殊场景.push('录像带结局'), ['102', '202']],
  ['旧录像带完成ID', d => d.系统._已完成特殊场景.push('录像带'), ['102', '202']],
  ['V4完成状态', d => { d.系统._录像带V4.阶段 = '已完成'; }, ['102', '202']],
  ['201离婚完成ID', d => d.系统._已完成特殊场景.push('角色路线:201:结局剧情'), ['201']],
  ['201离婚完成状态', d => { d.系统._许曼君离婚.阶段 = '已完成'; }, ['201']],
  ['301换掉', d => d.系统._已完成特殊场景.push('角色路线:301:结局剧情'), ['301']],
];
for (const [name, finish, blocked] of completedCases) {
  test(`${name}同时退出配置、宿主和界面候选，其他角色保持资格`, () => {
    const d = fresh(); finish(d);
    const expected = config.静音会议候选门牌顺序.filter(m => !blocked.includes(m));
    assert.deepEqual(stage.特殊场景表.静音会议.参与(d), expected);
    assert.deepEqual(stage.特殊场景表.静音会议.演出夫(d), expected);
    assert.deepEqual(scene.静音会议合资格妻(d), expected);
    const ui = uiCandidates(ref(d)).value;
    assert.deepEqual(ui.filter(x => x.合格).map(x => x.门牌), expected);
    for (const m of blocked) assert.match(ui.find(x => x.门牌 === m).原因, /结局/);
  });
}
test('仅完成承接、法律已离但结局未完、轨道名称不会替代正式结局完成', () => {
  const d = fresh();
  d.系统._家庭计划.阶段 = '已完成'; d.系统._第二机位.阶段 = '已完成';
  d.系统._不再留门.阶段 = '已完成'; d.系统._许曼君分居.阶段 = '已完成';
  d.系统._许曼君离婚.法律离婚已成立 = true; d.户['201'].夫._居住模式 = '正式退居';
  d.系统._安若妍不必停.阶段 = '已完成';
  d.系统._已完成特殊场景.push('分居', '不必停', '第二机位', '不再留门');
  assert.deepEqual(scene.静音会议合资格妻(d), config.静音会议候选门牌顺序);
  assert.ok(uiCandidates(ref(d)).value.every(x => x.合格));
});
test('不足两名未完成结局的合资格角色时，商店与背包筹备一致拒绝且不耗票', () => {
  const d = fresh(['101', '201']); d.系统._已完成特殊场景.push('角色路线:201:结局剧情');
  assert.equal(stage.特殊场景表.静音会议.前置(d), false);
  assert.match(stage.特殊场景锁定状态(d, '静音会议').缺少.join(' '), /未完成结局/);
  const before = lodash.cloneDeep(d);
  assert.equal(scene.打开静音会议筹备(d, '管理员室').成功, false);
  assert.deepEqual(d, before);
});
test('筹备期间完成结局：陈旧选择提交不扣票不生成丈夫名单；可取消并选择其他角色', () => {
  const d = fresh(); const view = ref(d); const candidates = uiCandidates(view);
  assert.equal(scene.打开静音会议筹备(view.value, '管理员室').成功, true);
  assert.equal(candidates.value.find(x => x.门牌 === '201').合格, true);
  view.value.系统._已完成特殊场景.push('角色路线:201:结局剧情');
  assert.equal(candidates.value.find(x => x.门牌 === '201').合格, false);
  const before = JSON.stringify(view.value);
  assert.equal(scene.启动静音会议(view.value, ['101', '201'], '公共设施维修', '管理员室', 10).成功, false);
  assert.equal(JSON.stringify(view.value), before);
  assert.equal(scene.取消静音会议筹备(view.value).成功, true);
  assert.equal(scene.打开静音会议筹备(view.value, '管理员室').成功, true);
  assert.equal(scene.启动静音会议(view.value, ['101', '301'], '公共设施维修', '管理员室', 10).成功, true);
  assert.deepEqual(view.value.系统._特殊场景.演出夫, ['101', '301']);
  const started = JSON.stringify(view.value);
  assert.equal(scene.启动静音会议(view.value, ['101', '301'], '公共设施维修', '管理员室', 10).成功, false);
  assert.equal(JSON.stringify(view.value), started);
});
test('旧完成ID重载继续排除，回档到完成前恢复资格，不新增资格存档字段', () => {
  const d = fresh(); const before = JSON.stringify(d);
  d.系统._已完成特殊场景.push('角色路线:201:结局剧情');
  assert.equal(scene.静音会议合资格妻(Schema.parse(JSON.parse(JSON.stringify(d)))).includes('201'), false);
  assert.equal(scene.静音会议合资格妻(Schema.parse(JSON.parse(before))).includes('201'), true);
});
test('既有已开始会议仍能按原生命周期申请收尾', () => {
  const d = fresh(['101', '201']);
  scene.打开静音会议筹备(d, '管理员室'); scene.启动静音会议(d, ['101', '201'], '公共设施维修', '管理员室', 10);
  d.系统._已完成特殊场景.push('角色路线:201:结局剧情');
  Object.assign(d.系统._特殊场景, { 当前拍: 16, 阶段: '自由延续', 会后妻: ['201'] });
  assert.equal(scene.请求结束静音会议(d).成功, true);
});
