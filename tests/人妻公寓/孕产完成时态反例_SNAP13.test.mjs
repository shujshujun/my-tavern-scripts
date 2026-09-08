/* eslint-disable import-x/no-nodejs-modules -- 对当前实现验证原复审反例和完成态对照。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHost } from './helpers/微信事务恢复环境.mjs';

const hard = createHost().load('手机/叙事硬事实.ts');
const cases = [
  ['生产将来', '女儿就要出生了，我还在医院待产。', () => hard.验收生产硬事实('女儿就要出生了，我还在医院待产。', '女', 1), false],
  ['生产刚开始', '我已经开始生产，是个女孩。', () => hard.验收生产硬事实('我已经开始生产，是个女孩。', '女', 1), false],
  ['获准出院', '今天可以出院了。', () => hard.验收住院硬事实('今天可以出院了。', '出院'), false],
  ['快出院', '快出院了。', () => hard.验收住院硬事实('快出院了。', '出院'), false],
  ['群错误性别', '孩子已经出生了，生的是个男孩。', () => hard.验收生产硬事实('孩子已经出生了，生的是个男孩。', '女', 1, false), false],
  ['私聊性别矛盾', '女儿已经出生了，这一胎是个男孩。', () => hard.验收生产硬事实('女儿已经出生了，这一胎是个男孩。', '女', 1), false],
  ['正常性别代词', '孩子已经出生了，她是个女孩。', () => hard.验收生产硬事实('孩子已经出生了，她是个女孩。', '女', 1), true],
];
for (const [label, input, evaluate, expected] of cases) test(`SNAP13 原复审反例 ${label}`, () => {
  const actual = evaluate();
  console.log(JSON.stringify({ label, input, expected, actual }));
  assert.equal(actual, expected);
});
for (const [text, accepted] of [
  ['我刚生下女儿。', true], ['女儿平安出生了，儿子在家等我。', true],
  ['我刚生产完，是个女孩。', true], ['我已经生产了，是个女孩。', true],
  ['我已经生产了两个小时，是个女孩。', false],
  ['医生说预计女儿明天出生。', false], ['我已获准出院。', false],
]) test(`SNAP13 当前完成与其他孩子：${text}`, () => {
  assert.equal(text.includes('出院') ? hard.验收住院硬事实(text, '出院') : hard.验收生产硬事实(text, '女', 1), accepted);
});
