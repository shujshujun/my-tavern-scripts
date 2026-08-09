/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：档案卡三轴（好感/堕落/婚姻）整框填充。
// 玩家要求：不要在数值框内部再出现一根独立细进度条；整个轴卡片本身就是进度条，
// 按 0-100 比例从左向右用颜色填充整张数值卡片，标签/数值/说明浮在填充背景上。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const 档案卡源码 = readFileSync(new URL('./components/档案卡.vue', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取主 `<style scoped>`…`</style>` 段（排除 `<style scoped src="./弹窗基础.css"></style>`）。 */
const 提取样式 = 源码 => 源码.slice(源码.lastIndexOf('<style scoped>'), 源码.lastIndexOf('</style>'));

test('1. 三轴最外层同一元素持 axis-row/meter/ARIA/轴类/clamp 0-1 --level；无独立细条 DOM', () => {
  const 模板段 = 提取模板(档案卡源码);
  const 三轴段 = 模板段.slice(模板段.indexOf('class="axes dossier-axes"'));
  // 最外层 axis-row 的开标签（到第一个 > 为止），所有契约属性必须落在同一元素上
  const 开 = 三轴段.indexOf('<div');
  const 关 = 三轴段.indexOf('>', 开);
  assert.ok(开 !== -1 && 关 !== -1, '三轴块存在轴卡片开标签');
  const 开标签 = 三轴段.slice(开, 关);
  for (const 片段 of [
    'class="axis-row"',
    ':class="轴.类"',
    'role="meter"',
    'aria-valuemin="0"',
    'aria-valuemax="100"',
    ':aria-valuenow="轴.值"',
    `'--level': Math.max(0, Math.min(100, 轴.值)) / 100`,
  ]) {
    assert.ok(开标签.includes(片段), `axis-row 开标签应含:${片段}`);
  }
  assert.match(三轴段, /v-for="轴 in 选中档案\.三轴"/, '三轴循环保留');
  // 不再出现独立细条 DOM
  assert.doesNotMatch(三轴段, /dossier-battery/, '三轴模板不再出现 dossier-battery');
  assert.doesNotMatch(三轴段, /axis-charge/, '三轴模板不再出现 axis-charge');
  assert.doesNotMatch(档案卡源码, /dossier-battery/, '组件不再出现 dossier-battery');
  assert.doesNotMatch(档案卡源码, /axis-charge/, '组件不再出现 axis-charge');
});

test('2. 整框填充 CSS：axis-row 相对定位+overflow hidden 裁切；::before inset:0 以左原点按 --level scaleX', () => {
  const 样式段 = 提取样式(档案卡源码);
  assert.match(
    样式段,
    /\.dossier-axes \.axis-row \{[^}]*position: relative[^}]*overflow: hidden[^}]*border-radius: 12px[^}]*\}/s,
    'axis-row 相对定位+overflow hidden+圆角(填充不越框)',
  );
  assert.match(
    样式段,
    /\.dossier-axes \.axis-row::before \{[^}]*inset: 0[^}]*transform-origin: left center[^}]*transform: scaleX\(var\(--level[^)]*\)\)[^}]*\}/s,
    '::before 整卡 inset:0 左原点 scaleX(--level)',
  );
  // 只动 transform，不动 width/height；填充层不挡文字选中
  assert.match(
    样式段,
    /\.dossier-axes \.axis-row::before \{[^}]*transition: transform [^}]*\}/s,
    '填充过渡只动 transform',
  );
  assert.match(样式段, /\.dossier-axes \.axis-row::before \{[^}]*pointer-events: none[^}]*\}/s, '填充层不挡文字选中');
});

test('3. fav/sin/marr 三类仅换填充色、结构完全相同；好感粉/堕落红橙/婚姻绿语义保持', () => {
  const 样式段 = 提取样式(档案卡源码);
  for (const [类, 前缀, 变量] of [
    ['fav', '#ffb1cf', String.raw`var\(--pink\)`],
    ['sin', '#ffb091', String.raw`var\(--red\)`],
    ['marr', '#9cebd7', String.raw`var\(--green\)`],
  ]) {
    assert.match(
      样式段,
      new RegExp(`\\.dossier-axes \\.axis-row\\.${类}::before \\{[^}]*${前缀}[^}]*${变量}[^}]*\\}`, 's'),
      `整框填充 ${类} 语义色(${前缀}→${变量})`,
    );
  }
});

test('4. 标签/数值/堕落说明位于填充层上方；深色模式低亮度语义色；reduced-motion 取消填充过渡', () => {
  const 样式段 = 提取样式(档案卡源码);
  assert.match(
    样式段,
    /\.dossier-axes \.axis-top[\s\S]*?\.dossier-axes \.axis-note \{[^}]*position: relative[^}]*z-index: 1[^}]*\}/s,
    'axis-top/axis-note 浮于填充层上方(z-index 1)',
  );
  assert.match(
    样式段,
    /:global\(html\.rq-dark\) \.dossier-axes \.axis-row\.fav::before \{[^}]*rgba\(255, 79, 154, [^}]*\}/s,
    '深色模式粉填充降透明度',
  );
  assert.match(
    样式段,
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.dossier-axes \.axis-row::before \{[^}]*transition: none[^}]*\}[\s\S]*?\}/s,
    'reduced-motion 取消填充过渡',
  );
  assert.match(样式段, /\.dossier-axes \.axis-note \{[^}]*color: var\(--ink\)[^}]*font-weight: 600/s, '小字说明使用高对比墨色');
  assert.match(样式段, /\.axis-top b \{[^}]*color: var\(--ink\)/s, '轴标签使用高对比墨色');
});

test('5. 通用细条(身体开发/丈夫疑心信任 .axis > .bar)不受整框改造影响', () => {
  const 模板段 = 提取模板(档案卡源码);
  assert.match(模板段, /class="bar dev"[\s\S]*?:style="\{ width: 部位\.值 \+ '%' \}"/, '身体开发细条保留');
  assert.match(模板段, /<i class="bar sin"[\s\S]*?:style="\{ width: 选中档案\.夫\.疑心值 \+ '%' \}"/, '丈夫疑心细条保留');
  assert.match(模板段, /<i class="bar marr"[\s\S]*?:style="\{ width: 选中档案\.夫\.信任值 \+ '%' \}"/, '丈夫信任细条保留');
  const 样式段 = 提取样式(档案卡源码);
  assert.match(样式段, /\.bar \{/, '通用 .bar 细条样式保留');
});
