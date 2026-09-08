/* eslint-disable import-x/no-nodejs-modules -- PLAY-030：仅执行真实只读分类、内存结算及原消费者块。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({});
const noIO = () => { throw new Error('PLAY030_EXTERNAL_IO_FORBIDDEN'); };
globalThis.updateVariablesWith = noIO;
globalThis.insertOrAssignVariables = noIO;
globalThis.generate = noIO;
globalThis.generateRaw = noIO;
globalThis.fetch = noIO;
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const cold = require('../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts');
const core = require('../../src/人妻公寓/脚本/游戏逻辑/冷落成长核心.ts');
const policy = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');
const ts = require('typescript');
const clone = value => lodash.cloneDeep(value);
const reload = value => Schema.parse(JSON.parse(JSON.stringify(value)));

const accepted = [
  '对不起，这几天是我冷落你了。',
  '你说吧，我会认真听。',
  '你说吧。',
  '你说吧：我会认真听。',
  '你 说 吧，我会认真听。',
  '“你说吧，我会认真听。”',
  '轻声安慰她，答应以后不再忽略她。',
  '我在乎你的感受。',
  '我关心你。',
  '我重视你的感受。',
  '我愿意听你把委屈说完。',
  '我不会再忽略你。',
  '我以后不再无视你。',
  '我保证不会再敷衍你。',
  '我不是不关心你。',
  '我并非不在乎你的感受。',
  '我不是没有关心你。',
  '我不会再不关心你。',
  '“对不起，我会弥补。”',
  '我说：“对不起，我关心你。”',
  '她说：“你根本不在乎我。”我回答：“对不起，我会认真听。”',
  '我以前说过“我不关心你”，但现在我在乎你的感受。',
  '我关心你。不知道明天会不会下雨？',
  '我不太会解释，但是我愿意听你说。',
  '轻轻握住她的手，听她说完。',
  '询问她为什么难过。',
  '你能原谅我吗？',
];
const rejected = [
  '我根本不在乎你的感受。',
  '我一点也不关心你。',
  '我从来没有关心过你。',
  '我并不重视你的感受。',
  '我不会再关心你。',
  '我不愿意理解你。',
  '我不打算弥补。',
  '我没打算道歉。',
  '我不想道歉，别烦我。',
  '我没有冷落你，是你想多了。',
  '我抱住别人安慰她。',
  '我关心你，但我不会再听你解释。',
  '我保证根本不在乎你的感受。',
  '我不是不是不关心你。',
  '我关心你吗？',
  '我真的在乎你吗',
  '我是否关心你？',
  '如果你答应，我就关心你。',
  '假如我说“我在乎你”，这算安抚吗？',
  '她说：“我关心你。”',
  '她说，我关心你。',
  '你说过，我会认真听。',
  '你说：“我会认真听。”',
  '她说吧，我会认真听。',
  '你说吧台那边的人会安慰她。',
  '你说吧，我不愿意听。',
  '你说吧，我不会再关心你。',
  '他说：“我会安慰她。”',
  '我昨天说过“对不起，我关心你”。',
  '我没有说“我关心你”。',
  '引用：“我在乎你。”',
  '“我关心你”只是一个例子。',
  '我想过道歉。',
  '我不会再去修灯。',
  '今天天气不错。',
  '',
];
for (const text of accepted) {
  test(`PLAY-030 肯定与修复承诺：${text}`, () => {
    assert.equal(cold.玩家行动是有效安抚(text), true);
  });
}
for (const text of rejected) {
  test(`PLAY-030 非当前有效回应：${text || '空串'}`, () => {
    assert.equal(cold.玩家行动是有效安抚(text), false);
  });
}

function fresh() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 102: 创建户节点(0) }, 系统: { _绝对时段: 48 } });
  const wife = data.户['101'].妻;
  wife.当前阶段 = 3;
  wife.堕落值 = 45;
  wife._成长账 = { ...core.创建成长账(0), 成长轮次: 1 };
  const result = cold.结算妻冷落('101', wife, 48, false);
  assert.equal(result.触发余波, true);
  assert.equal(wife._冷落余波.需安抚楼, 9);
  return data;
}
function advance(wife, text, floor = 100, success = true) {
  return cold.推进余波安抚(wife, {
    正文楼: floor, 当前绝对时段: 96,
    成功主线当面楼: success, 玩家有效回应: cold.玩家行动是有效安抚(text),
  });
}
function nearEnd() {
  const data = fresh(), wife = data.户['101'].妻;
  assert.equal(advance(wife, '请把委屈说出来。', 80).首次诉苦, true);
  for (let floor = 81; floor < 88; floor++) assert.equal(advance(wife, '对不起，我关心你。', floor).已推进, true);
  assert.equal(wife._冷落余波.已安抚楼, 8);
  assert.equal(wife._成长账.成长轮次, 1);
  return data;
}
for (const text of ['我根本不在乎你的感受。', '我一点也不关心你。']) {
  test(`PLAY-030 真实触底到8/9：${text}不签发完成或成长`, () => {
    const data = nearEnd(), before = clone(data);
    assert.equal(advance(data.户['101'].妻, text).已推进, false);
    assert.deepEqual(data, before);
  });
}
test('PLAY-030 正常末楼完成只记一次成长，原句再处理不重复', () => {
  const data = nearEnd(), other = clone(data.户['102']);
  assert.equal(advance(data.户['101'].妻, '我不会再忽略你。').已完成, true);
  assert.deepEqual(data.户['101'].妻._冷落余波, core.创建余波账());
  assert.equal(data.户['101'].妻._成长账.成长轮次, 2);
  assert.equal(data.户['101'].妻._成长账.上次有效成长钟楼, 96);
  const done = clone(data);
  assert.equal(advance(data.户['101'].妻, '对不起。').已推进, false);
  assert.deepEqual(data, done);
  assert.deepEqual(data.户['102'], other);
});
test('PLAY-030 失败/没有当面正文不计；首次诉苦和同楼去重仍由原结算持有', () => {
  const data = fresh(), wife = data.户['101'].妻, before = clone(data);
  assert.equal(advance(wife, '对不起。', 80, false).已推进, false);
  assert.deepEqual(data, before);
  assert.equal(advance(wife, '我不关心你。', 80).首次诉苦, true, '首楼计的是诉苦发生，不是后续安抚');
  assert.equal(wife._冷落余波.已安抚楼, 1);
  const first = clone(data);
  assert.equal(advance(wife, '对不起。', 80).已推进, false);
  assert.deepEqual(data, first);
});
test('PLAY-030 重载和回档保留8/9；未落地候选的完成不污染原状态', () => {
  const data = nearEnd(), restored = reload(data), before = clone(data);
  assert.equal(advance(restored.户['101'].妻, '我不关心你。').已推进, false);
  assert.deepEqual(restored, before);
  const abandoned = clone(restored);
  advance(abandoned.户['101'].妻, '对不起。');
  assert.deepEqual(restored, before, '只读分类与候选结算没有外部写入');
  assert.equal(reload(before).户['101'].妻._冷落余波.已安抚楼, 8);
});
test('PLAY-030 送礼仍独立于文字、不能跳过首次诉苦，并保持每日三次上限', () => {
  const data = fresh();
  assert.equal(cold.推进送礼安抚(data, '101').已推进, false);
  advance(data.户['101'].妻, '你好。', 80);
  for (let n = 0; n < 3; n++) assert.equal(cold.推进送礼安抚(data, '101').已推进, true);
  const before = clone(data);
  assert.equal(cold.推进送礼安抚(data, '101').达到日上限, true);
  assert.deepEqual(data, before);
});

/** AST取出两条已读过的原生产if块；不改表达式、不替换被测分类/结算，不执行宿主组合根。 */
function consumer(file, target) {
  const source = readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${file}`, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const blocks = [];
  function visit(node) {
    if (ts.isIfStatement(node) && node.expression.getText(ast).startsWith(`${target} &&`) &&
        node.expression.getText(ast).includes('角色线路无关打断已停用') &&
        node.thenStatement.getText(ast).includes('推进余波安抚(')) blocks.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(blocks.length, 1, '准确绑定唯一真实生产安抚块');
  const js = ts.transpileModule(blocks[0].getText(ast), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return (data, text, { present = true, body = true, targetPresent = true } = {}) => {
    const deps = {
      ...cold, ...policy, newStat: data, newData: data,
      本轮余波目标: targetPresent ? '101' : '', _本轮余波目标: targetPresent ? '101' : '',
      生成楼层: 100, 楼层: 100, 当前绝对时段: 96, 现钟: 96,
      可提交正文: body ? '她听到了本次答复。' : '', 本轮有效正文: body ? '她听到了本次答复。' : '',
      妻在场: present ? ['101'] : [], _本轮妻在场: present ? ['101'] : [],
      行动: text, _本轮玩家文本: text,
    };
    Function('deps', `const {${Object.keys(deps).join(',')}} = deps;${js}`)(deps);
  };
}
for (const [file, target] of [['回合引擎.ts', '本轮余波目标'], ['index.ts', '_本轮余波目标']]) {
  const run = consumer(file, target);
  for (const [label, text, settings, takeover] of [
    ['否定行动', '我一点也不关心你。', {}, false],
    ['无正文/失败', '对不起。', { body: false }, false],
    ['非当面/远程', '对不起。', { present: false }, false],
    ['本轮未注入目标', '对不起。', { targetPresent: false }, false],
    ['线路已经接管', '对不起。', {}, true],
  ]) {
    test(`PLAY-030 ${file}真实消费者：${label}保持原进度`, () => {
      const data = nearEnd();
      if (takeover) data.系统._家庭计划.阶段 = '待投资料';
      const before = clone(data);
      run(data, text, settings);
      assert.deepEqual(data, before);
    });
  }
  test(`PLAY-030 ${file}真实消费者：有效当面回应完成`, () => {
    const data = nearEnd();
    run(data, '我不是不关心你。');
    assert.equal(data.户['101'].妻._冷落余波.状态, '无');
    assert.equal(data.户['101'].妻._成长账.成长轮次, 2);
  });
  test(`PLAY-030 ${file}真实消费者：当前倾听邀请完成且重复不再计数`, () => {
    const data = nearEnd();
    run(data, '你说吧，我会认真听。');
    assert.equal(data.户['101'].妻._冷落余波.状态, '无');
    assert.equal(data.户['101'].妻._成长账.成长轮次, 2);
    const done = clone(data);
    run(data, '你说吧，我会认真听。');
    assert.deepEqual(data, done);
  });
}
