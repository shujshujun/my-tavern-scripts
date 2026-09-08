/* eslint-disable import-x/no-nodejs-modules -- Node-only route regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/回国系统.ts');
const first = '【回国提交:D:管理记录中:30:1】';
const cases = [
  ['无关后半句提问', '母亲确认无需圆场，同时问你是否确认下周的安排。', true],
  ['无关前半句提问', '母亲问是否确认下周安排，随后确认没有经营缺口。', true],
  ['无关否定', '母亲没有离开，已经确认不存在经营缺口。', true],
  ['元层双重否定', '母亲并非没有确认不存在经营缺口。', true],
  ['元层第二种双重否定', '母亲不是没得出无需圆场的结论。', true],
  ['结果否定本身是事实', '没有需要补救的经营缺口。', true],
  ['过去未确认但现在已确认', '母亲昨天还没有确认，今天已明确确认不存在经营缺口。', true],
  ['假设后另句真实确认', '要是还有缺口，就再核对；母亲此刻确认无需圆场。', true],
  ['直接引述结论', '母亲确认：“不存在需要圆场的经营缺口。”', true],
  ['引述辟谣后真实确认', '“没有经营缺口”只是先前的设想。母亲此刻已经确认无需圆场。', true],
  ['无关问号不遮掉结论', '母亲确认无需圆场，接着问你明天是否来办公室？', true],
  ['不需要也是结论', '母亲确认不需要再替这次管理圆场。', true],
  ['要是条件', '要是找不到经营缺口，我们再谈交接。', false],
  ['倘若条件', '倘若不存在经营缺口，我们再谈交接。', false],
  ['只要条件', '只要没有经营缺口，我们再继续。', false],
  ['跨逗号的假设结果', '如果核对顺利，就能确认不存在经营缺口。', false],
  ['提议不是结果', '母亲提议明天再确认是否没有经营缺口。', false],
  ['尚未确认', '母亲尚未确认不存在经营缺口，只是准备复核。', false],
  ['没有得出', '母亲没有得出无需圆场的结论。', false],
  ['无法确认', '母亲无法确认不存在经营缺口。', false],
  ['暂不能下结论', '母亲还不能认定不存在经营缺口。', false],
  ['疑问', '母亲确认不存在经营缺口了吗？', false],
  ['能否问题', '母亲问能否确认没有经营缺口。', false],
  ['否定结果', '母亲并非认为没有经营缺口。', false],
  ['双重否定结果实际有缺口', '并非没有经营缺口。', false],
  ['引述只是设想', '“没有经营缺口”只是设想。', false],
  ['引述被否认', '“不存在经营缺口”，这个说法是假的。', false],
  ['引述内部句号', '「没有经营缺口。无需圆场。」这种说法不属实。', false],
  ['未曾说过', '母亲未曾说过“没有经营缺口”。', false],
  ['结论尚未成立', '不存在经营缺口的结论尚未得到确认。', false],
  ['计划', '母亲打算确认不存在经营缺口，还未核对记录。', false],
  ['过去结论不是当前', '母亲昨天认为没有经营缺口，今天要求重新复核。', false],
  ['条件不因今天变事实', '如果检查通过，今天母亲确认没有经营缺口。', false],
  ['主语后现在切换时态', '母亲昨天还不能确认，她现在已经确认不存在经营缺口。', true],
  ['跨逗号的确认否定', '母亲尚未确认，没有经营缺口。', false],
  ['双重否定的引述归属', '母亲并非没有说过“没有经营缺口”。', true],
  ['后句明确撤回结论', '母亲确认没有经营缺口，随后明确撤回了这个结论。', false],
];
for (const [label, text, conclusion] of cases) {
  test(`PLAY024 管理结论作用域：${label}`, () => {
    assert.equal(Boolean(route.回国正文越拍原因(first, text)), conclusion, text);
  });
}

test('PLAY024 第一拍结论门不改变第三拍允许确认的规则', () => {
  assert.equal(route.回国正文越拍原因('【回国提交:D:管理记录中:30:3】', '母亲确认不存在经营缺口，无需圆场。'), '');
});

test('PLAY024 重复与交错调用不保留上一句的假设状态', () => {
  for (let round = 0; round < 3; round++) {
    for (const [, text, conclusion] of [...cases].reverse()) {
      assert.equal(Boolean(route.回国正文越拍原因(first, text)), conclusion, text);
    }
  }
});
