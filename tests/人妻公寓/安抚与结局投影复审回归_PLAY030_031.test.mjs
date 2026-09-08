import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json']; require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');
globalThis.getVariables = () => ({});
const noIO = () => { throw new Error('INDEPENDENT_REVIEW_EXTERNAL_IO_FORBIDDEN'); };
for (const key of ['updateVariablesWith', 'insertOrAssignVariables', 'generate', 'generateRaw', 'fetch']) globalThis[key] = noIO;
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const cold = require('../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts');
const growth = require('../../src/人妻公寓/脚本/游戏逻辑/冷落成长核心.ts');
const policy = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');
const life = require('../../src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');
const worldbook = require('../../src/人妻公寓/脚本/游戏逻辑/其他角色阶段世界书.ts');
const experience = require('../../src/人妻公寓/脚本/游戏逻辑/角色阶段体验.ts');
const mobileLife = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局后生活社交语义.ts');
const ts = require('typescript');

const denials = ['我拒绝道歉。', '我不曾真正关心你。', '我并不怎么在乎你。'];
const invitations = ['你说吧……我会认真听。', '你说吧——我会认真听。'];
for (const text of denials) test(`PLAY030 拒绝或明确否定不得计入安抚：${text}`, () => {
  assert.equal(cold.玩家行动是有效安抚(text), false);
});
for (const text of invitations) test(`PLAY030 普通标点的当前倾听邀请：${text}`, () => {
  assert.equal(cold.玩家行动是有效安抚(text), true);
});
for (const [text, expected] of [
  ['你说吧，我会认真听。', true], ['你说过，我会认真听。', false], ['我不愿意听。', false],
  ['我不会拒绝听你说完。', true], ['我没有拒绝关心你。', true], ['我不拒绝听你说完。', true],
]) {
  test(`PLAY030 已覆盖的正常对照：${text}`, () => assert.equal(cold.玩家行动是有效安抚(text), expected));
}

function nearEnd() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 48 } });
  const wife = data.户['101'].妻;
  wife.当前阶段 = 3; wife.堕落值 = 45;
  wife._成长账 = { ...growth.创建成长账(0), 成长轮次: 1 };
  assert.equal(cold.结算妻冷落('101', wife, 48, false).触发余波, true);
  for (let floor = 80; floor < 88; floor++) cold.推进余波安抚(wife, {
    正文楼: floor, 当前绝对时段: 96, 成功主线当面楼: true, 玩家有效回应: true,
  });
  assert.equal(wife._冷落余波.已安抚楼, 8);
  assert.equal(wife._冷落余波.需安抚楼, 9);
  return data;
}
function actualConsumer(file, target) {
  const source = readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${file}`, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const blocks = [];
  function walk(node) {
    if (ts.isIfStatement(node) && node.expression.getText(ast).startsWith(`${target} &&`) && node.expression.getText(ast).includes('角色线路无关打断已停用') && node.thenStatement.getText(ast).includes('推进余波安抚(')) blocks.push(node);
    ts.forEachChild(node, walk);
  }
  walk(ast); assert.equal(blocks.length, 1);
  const js = ts.transpileModule(blocks[0].getText(ast), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  return (data, text) => {
    const deps = { ...cold, ...policy, newStat: data, newData: data, 本轮余波目标: '101', _本轮余波目标: '101', 生成楼层: 100, 楼层: 100, 当前绝对时段: 96, 现钟: 96, 可提交正文: '她听到了这次答复。', 本轮有效正文: '她听到了这次答复。', 妻在场: ['101'], _本轮妻在场: ['101'], 行动: text, _本轮玩家文本: text };
    Function('deps', `const {${Object.keys(deps).join(',')}} = deps; ${js}`)(deps);
  };
}
for (const [file, target] of [['回合引擎.ts', '本轮余波目标'], ['index.ts', '_本轮余波目标']]) {
  const run = actualConsumer(file, target);
  for (const text of denials) test(`PLAY030 ${file}生产安抚块不应将否定答复结算成完成：${text}`, t => {
    const data = nearEnd(); const before = structuredClone(data);
    run(data, text);
    t.diagnostic(JSON.stringify({ observedState: data.户['101'].妻._冷落余波.状态, observedGrowthRound: data.户['101'].妻._成长账.成长轮次 }));
    assert.deepEqual(data, before);
  });
}

function legacy(shared) {
  const data = Schema.parse({ 户: { 102: 创建户节点(0), 202: 创建户节点(0) }, 系统: { _绝对时段: 30 } });
  data.系统._已完成特殊场景.push(shared);
  return data;
}
for (const shared of ['录像带', '录像带结局']) {
  test(`PLAY031 ${shared}旧共享完成：中央语义不补造停止等待`, () => {
    const data = legacy(shared);
    assert.equal(life.构建角色结局后生活社交语义(data, '202').已开启, true);
    assert.doesNotMatch(life.构建角色结局后生活社交语义(data, '202').生活事实, /不再默认留饭守门/);
  });
  test(`PLAY031 ${shared}旧共享完成：实际阶段世界书不补造停止等待`, () => {
    const data = legacy(shared);
    const projection = worldbook.构造其他角色阶段世界书投影(data).find(item => item.元数据.门牌 === '202');
    assert.equal(projection.启用, true);
    assert.doesNotMatch(projection.内容, /不再默认留饭守门/);
  });
  test(`PLAY031 ${shared}旧共享完成：角色档案不补造停止等待`, () => {
    assert.doesNotMatch(experience.读取角色阶段体验(legacy(shared), '202').简介, /不再默认留门等人/);
  });
  test(`PLAY031 ${shared}旧共享完成：手机生活画像不补造停止等待`, () => {
    assert.doesNotMatch(mobileLife.构建结局后生活社交画像(legacy(shared), '202').生活差分, /不再把临时决定和无限等待当成默认/);
  });
}

for (const scenario of ['部分决定', 'V4完成', '孤立标志']) {
  test(`PLAY031 共用生活事实保留已成立决定并拒绝无凭据标志：${scenario}`, () => {
    const data = legacy('录像带');
    if (scenario === 'V4完成') data.系统._录像带V4.阶段 = '已完成';
    else {
      data.系统._不再留门.停止默认等待 = true;
      if (scenario === '部分决定') Object.assign(data.系统._不再留门, { 实例: 'current', 来源时间线: 'branch-current', 道具已使用: true });
    }
    const expected = scenario !== '孤立标志';
    const before = structuredClone(data);
    const current = () => [
      life.构建角色结局后生活社交语义(data, '202').生活事实,
      worldbook.构造其他角色阶段世界书投影(data).find(item => item.元数据.门牌 === '202').内容,
      experience.读取角色阶段体验(data, '202').简介,
      mobileLife.构建结局后生活社交画像(data, '202').生活差分,
    ];
    const patterns = [/不再默认留饭守门/, /不再默认留饭守门/, /不再默认留门等人/, /不再把临时决定和无限等待当成默认/];
    current().forEach((text, i) => assert.equal(patterns[i].test(text), expected));
    assert.deepEqual(data, before, 'projection must remain read-only');
    data.系统._录像带V4.阶段 = '未开始';
    data.系统._不再留门.停止默认等待 = false;
    current().forEach((text, i) => assert.equal(patterns[i].test(text), false, 'rollback must remove only the unsupported decision'));
  });
}
