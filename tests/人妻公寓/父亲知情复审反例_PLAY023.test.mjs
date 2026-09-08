/* eslint-disable import-x/no-nodejs-modules -- Node-only regression for review counterexamples. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const { 父亲被写成已知关系 } = require('../../src/人妻公寓/脚本/游戏逻辑/父亲关系知情.ts');

// Existing independent audit and original test files remain unchanged.
const cases = [
  ['跨逗号保留主语', '父亲对我们的真实关系，已经知道了。', true],
  ['跨逗号保留程度副词', '你爸对我们的真实关系，也十分清楚。', true],
  ['跨逗号否定', '父亲对我们的真实关系，并不知道。', false],
  ['跨逗号换成叙述者', '父亲对我们的真实关系，我已经知道了。', false],
  ['嵌套并列副词', '我清楚父亲其实也知道我们的真实关系。', true],
  ['嵌套否定保留', '我知道你爸也不知道我们的真实关系。', false],
  ['并列谓语承接', '父亲早就看穿并默许我和管理员了。', true],
  ['主语所有权朋友', '父亲的朋友知道我们的真实关系。', false],
  ['主语所有权嵌套', '我知道你爸的同事也知道我们的真实关系。', false],
  ['比较对象不是主语', '我比父亲更清楚我们的真实关系。', false],
  ['换成其他说话人', '父亲说我已经知道我们的真实关系。', false],
  ['普通事项装作不知', '父亲假装不知道房租已经交接。', false],
  ['第三方关系对象', '父亲知道房东和租客的真实关系。', false],
  ['引述后逗号辟谣', '“父亲已经知道我们的真实关系”，这种说法并不属实。', false],
  ['引述后句号辟谣', '“父亲已经知道我们的真实关系”。这句话是假的。', false],
  ['没有说过不签事实', '我没有说过“父亲已经知道我们的真实关系”。', false],
  ['否定说过双重否定', '我并非没有说过“父亲已经知道我们的真实关系”。', true],
  ['没说过双重否定', '我不是没说过“父亲已经知道我们的真实关系”。', true],
  ['辟谣后新断言继承对象', '“父亲不知道我们的真实关系”是假的，他其实早就知道了。', true],
  ['引述内部句号不切断外部指代', '“父亲不知道我们的真实关系。”是假的，他早就知道了。', true],
  ['引述内部逗号不切断外部指代', '“父亲对我们的真实关系，并不知道”是假的，他早就知道了。', true],
  ['引述中代理对不破坏后文偏移', '“父亲不知道我们的真实关系🙂”是假的，他早就知道了。', true],
  ['引述后普通对象不能借题', '“父亲不知道我们的真实关系”是假的，他只知道房租交接。', false],
  ['引述后否定仍有效', '“父亲已经知道我们的真实关系”是假的，他确实不知道。', false],
  ['引述后的其他主体', '“父亲不知道我们的真实关系”是假的，但我已经知道了。', false],
  ['句号隔断旧话题', '父亲不知道我们的真实关系。我已经知道了。', false],
  ['父亲视角程度词', '我对你和你妈的真实关系，十分清楚。', true, '父亲'],
  ['父亲视角否认后重新断言', '「我不知道你和你妈的真实关系」是假的，我早就知道了。', true, '父亲'],
];
for (const [label, text, expected, perspective = '母亲'] of cases) {
  test(`PLAY023 复审反例：${label}`, () => {
    assert.equal(父亲被写成已知关系(text, perspective), expected, text);
  });
}

test('PLAY023 复审反例重复调用与视角切换无共享上下文', () => {
  for (let round = 0; round < 3; round += 1) {
    for (const [, text, expected, perspective = '母亲'] of cases) {
      assert.equal(父亲被写成已知关系(text, perspective), expected, text);
    }
    assert.equal(父亲被写成已知关系('父亲已经知道房租交接。', '旁人'), false);
  }
});
