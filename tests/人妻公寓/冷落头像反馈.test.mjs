/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 档案卡源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url),
  'utf8',
);

for (const [界面, 源码] of [
  ['主头像列', App源码],
  ['档案卡头像', 档案卡源码],
]) {
  test(`${界面}复用有效余波判定，阶段1与未入列302的残留状态不会误亮`, () => {
    assert.match(源码, /import \{ 余波有冻结效力 \} from '.+\/冷落系统'/);
    assert.match(
      源码,
      /余波有冻结效力\(m, 妻, (?:props\.)?data(?:\.value)?\.系统\._母亲入列\)/,
      `${界面}必须与堕落冻结共用同一资格判定`,
    );
  });
}

test('主头像列把有效冷落状态并入原位置类，保留焦点/同场/离场语义', () => {
  assert.match(App源码, /:class="\[项\.态, 项\.冷落态, 项\.怀孕态\]"/);
  assert.match(App源码, /冷落态: 冷落状态 === '待诉苦' \? 'neglect-pending'/);
  assert.match(App源码, /冷落状态 === '安抚中' \? 'neglect-soothing'/);
  assert.match(App源码, /const 冷落状态 = 妻 && 余波有冻结效力[\s\S]*?: '无'/);
  assert.doesNotMatch(App源码, /\.avatar\.neglect-(?:pending|soothing)\s*\{[^}]*opacity:/s, '冷落类不应抹掉离场透明度');
});

test('待诉苦与安抚中分别映射冷色、暖色头像外圈，深色主题不覆盖状态辉光', () => {
  for (const [源码, 选择器] of [
    [App源码, '.avatar.neglect-pending .avatar-glyph'],
    [App源码, '.avatar.neglect-soothing .avatar-glyph'],
    [App源码, ':global(html.rq-dark) .avatar.neglect-pending .avatar-glyph'],
    [App源码, ':global(html.rq-dark) .avatar.neglect-soothing .avatar-glyph'],
    [档案卡源码, '.avatar-glyph.neglect-pending'],
    [档案卡源码, '.avatar-glyph.neglect-soothing'],
  ]) {
    const 起点 = 源码.indexOf(`${选择器} {`);
    assert.notEqual(起点, -1, `缺少 ${选择器}`);
    const 规则 = 源码.slice(起点, 源码.indexOf('}', 起点));
    assert.match(规则, /border-color:|--avatar-ring-color:/, `${选择器} 应有独立描边色`);
    assert.match(规则, /box-shadow:/, `${选择器} 应有独立辉光`);
  }
});

test('图片头像与失败回退都提供非颜色状态说明，且冷落辉光不循环闪烁', () => {
  for (const 源码 of [App源码, 档案卡源码]) {
    assert.match(源码, /冷落状态：等待回应/);
    assert.match(源码, /冷落状态：安抚中/);
    assert.match(源码, /:aria-label="[^"]*冷落说明|:aria-label="选中头像状态说明/);
  }

  const 冷落样式起点 = 档案卡源码.indexOf('/* 冷落余波：');
  const 冷落样式终点 = 档案卡源码.indexOf('/* ═══ 档案卡 ═══ */', 冷落样式起点);
  assert.doesNotMatch(档案卡源码.slice(冷落样式起点, 冷落样式终点), /animation:/, '状态辉光不应持续闪烁');
});
