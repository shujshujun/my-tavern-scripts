/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const 读取 = 相对路径 => readFileSync(new URL(相对路径, 客户端目录), 'utf8');

const 全局CSS = 读取('./global.css');
const 弹窗基础CSS = 读取('./components/弹窗基础.css');
const 设置源码 = 读取('./components/设置弹窗.vue');
const 首次准备源码 = 读取('./components/首次准备.vue');
const App源码 = 读取('./App.vue');
const 图标源码 = 读取('./icons.ts');
const CG图库源码 = 读取('./components/CG图库.vue');

test('基础视觉令牌覆盖工具层 surface、圆角、控件尺寸、动效和键盘焦点', () => {
  for (const 令牌 of [
    '--surface-sheet:',
    '--surface-sheet-border:',
    '--radius-control:',
    '--radius-card:',
    '--radius-sheet:',
    '--radius-pill:',
    '--control-icon-sm:',
    '--motion-fast:',
    '--motion-base:',
    '--focus-ring-color:',
  ]) {
    assert.ok(全局CSS.includes(令牌), `global.css 应声明 ${令牌}`);
  }
  assert.match(全局CSS, /html\.rq-dark[\s\S]*?--surface-sheet:/, '夜间主题应覆盖工具弹窗 surface');
  assert.match(弹窗基础CSS, /background:\s*var\(--surface-sheet\)/, '共享 sheet 消费 surface 令牌');
  assert.match(弹窗基础CSS, /border-radius:\s*var\(--radius-sheet\)/, '共享 sheet 消费 sheet 圆角令牌');
  assert.match(弹窗基础CSS, /width:\s*var\(--control-icon-sm\)/, '共享关闭按钮消费统一图标控件尺寸');
  assert.match(弹窗基础CSS, /\.sheet-close:focus-visible[\s\S]*?var\(--focus-ring-color\)/, '关闭按钮有统一键盘焦点');
  assert.match(弹窗基础CSS, /\.btn:focus-visible[\s\S]*?var\(--focus-ring-color\)/, '基础按钮有统一键盘焦点');
});

test('设置与首次准备共享工具弹窗标题结构，场景型页面不被换皮', () => {
  for (const [名称, 源码, 标题] of [
    ['设置', 设置源码, '看着舒服最要紧'],
    ['首次准备', 首次准备源码, '开始前准备一下'],
  ]) {
    assert.match(源码, /<header class="sheet-heading">/, `${名称}应使用共享 sheet-heading`);
    assert.match(源码, /class="sheet-heading-title"/, `${名称}应使用共享标题类`);
    assert.ok(源码.includes(标题), `${名称}标题文案保持`);
  }
  assert.match(
    首次准备源码,
    /class="sheet-heading-lead"[\s\S]*?按顺序完成 3 项即可开始/,
    '首次准备说明进入共享标题结构',
  );
  assert.doesNotMatch(设置源码, /class="set-title"/, '设置不再维护一套标题样式');
  assert.doesNotMatch(首次准备源码, /class="setup-title"|class="setup-lead"/, '首次准备不再维护另一套标题样式');
  for (const 相对路径 of [
    './components/地图.vue',
    './components/档案卡.vue',
    './components/CG图库.vue',
    './components/序章标题屏.vue',
  ]) {
    assert.doesNotMatch(读取(相对路径), /sheet-heading/, `${相对路径} 保留场景化题头，不套工具弹窗标题`);
  }
});

test('正文显隐与 CG 锁使用同一 SVG 图标体系，行为门槛保持', () => {
  assert.match(图标源码, /\beye:\s*['"]/, '图标库提供显示正文图标');
  assert.match(图标源码, /\beyeOff:\s*['"]/, '图标库提供隐藏正文图标');
  assert.match(图标源码, /\block:\s*['"]/, '图标库提供 CG 锁图标');

  assert.match(App源码, /<Ic :n="正文隐藏 \? 'eye' : 'eyeOff'"\s*\/>/, '正文显隐按钮按状态切换 SVG 图标');
  assert.doesNotMatch(App源码, /👁|🙈/, '正文显隐不再依赖平台 Emoji');
  assert.match(App源码, /:title="正文隐藏 \? '显示正文' : '隐藏正文,欣赏画面'"/, '正文显隐动作说明保持');
  assert.match(App源码, /@click\.stop="正文隐藏 = !正文隐藏"/, '正文显隐仍只切换原本地状态');

  assert.match(CG图库源码, /import Ic from '\.\/Icon\.vue'/, 'CG 图库复用现有图标组件');
  assert.match(CG图库源码, /<span v-else class="cg-lock">\s*<Ic n="lock"\s*\/>\s*<\/span>/, '未解锁格只显示 SVG 锁');
  assert.doesNotMatch(CG图库源码, /🔒/, 'CG 锁不再依赖平台 Emoji');
  // 正常模式锁定与全览临时放开共用可查看CG/CG项可查看 同一通道（不再内联 unlocked.has）。
  assert.match(
    CG图库源码,
    /:disabled="!可查看CG\(项\) \|\| 失效CG\.has\(项\.id\)"/,
    '未解锁与本次坏图格都禁用',
  );
  assert.match(
    CG图库源码,
    /v-if="可查看CG\(项\) && !失效CG\.has\(项\.id\)"/,
    '未解锁格与本次坏图格都不创建破图节点',
  );
  assert.match(
    CG图库源码,
    /function 可查看CG[\s\S]*?CG项可查看\(props\.unlocked/,
    '正常模式锁定由可查看CG委托给 CG项可查看；全览放开由 CG图库全览.test.mjs 验证',
  );
});
