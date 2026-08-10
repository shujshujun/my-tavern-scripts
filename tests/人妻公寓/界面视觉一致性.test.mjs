import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const 读取 = path => readFileSync(new URL(path, 客户端目录), 'utf8');

const 全局样式 = 读取('global.css');
const App源码 = 读取('App.vue');
const 设置源码 = 读取('components/设置弹窗.vue');
const 地图源码 = 读取('components/地图.vue');
const 房内抽屉源码 = 读取('components/房内操作抽屉.vue');
const 录像带源码 = 读取('components/录像带操作.vue');
const 档案源码 = 读取('components/档案卡.vue');
const 偏好源码 = 读取('composables/useUIPrefs.ts');

test('表单颜色由共享语义令牌驱动，日夜主题都不再出现浅字白底', () => {
  assert.match(全局样式, /--field-bg:\s*#fffefd;/, '日间表单底色令牌存在');
  assert.match(全局样式, /--field-text:\s*#242126;/, '日间表单文字令牌存在');
  assert.match(全局样式, /html\.rq-dark\s*\{[\s\S]*?--field-bg:\s*#[0-9a-f]{6};/i, '夜间表单底色独立覆盖');
  assert.match(全局样式, /html\.rq-dark\s*\{[\s\S]*?--field-text:\s*#[0-9a-f]{6};/i, '夜间表单文字独立覆盖');

  assert.match(设置源码, /background:\s*var\(--field-bg\);/, 'API 表单使用语义底色');
  assert.match(设置源码, /color:\s*var\(--field-text\);/, 'API 表单使用语义文字色');
  assert.match(设置源码, /border-color:\s*var\(--field-focus\);/, '聚焦态使用共享强调色');
  assert.match(设置源码, /\.mvu-api-form input:focus-visible/, '键盘聚焦态保持可见');
  assert.doesNotMatch(
    设置源码.slice(设置源码.indexOf('.mvu-api-form input'), 设置源码.indexOf('.mvu-api-feedback.err')),
    /background:\s*#fff\b/i,
    '自定义 API 输入框与下拉框不再硬编码白底',
  );
});

test('微型系统标签统一使用 10px 可读下限，不再散落 7–9px', () => {
  assert.match(全局样式, /--font-micro:\s*10px;/, '共享微型字号令牌存在');

  for (const [名称, 源码] of [
    ['App.vue', App源码],
    ['地图.vue', 地图源码],
    ['房内操作抽屉.vue', 房内抽屉源码],
    ['录像带操作.vue', 录像带源码],
    ['档案卡.vue', 档案源码],
  ]) {
    assert.doesNotMatch(源码, /font(?:-size|\s*):[^;\n]*(?<!\d)(?:7|8|9)px/, `${名称} 不应继续声明 7–9px 字号`);
  }

  assert.match(
    App源码,
    /\.hud-time \.ui-kicker \{[\s\S]{0,100}font-size:\s*var\(--font-micro\);/,
    '手机 HUD 小标使用下限',
  );
  assert.match(
    App源码,
    /\.battery small,[\s\S]{0,40}\.hstat small \{[\s\S]{0,140}font-size:\s*var\(--font-micro\);/,
    '手机状态标签使用下限',
  );
  assert.match(App源码, /\.dock-btn span \{[\s\S]{0,100}font-size:\s*var\(--font-micro\);/, '手机 dock 标签使用下限');
});

test('541–900px 是纯布局紧凑档，移动端业务断点仍严格保持 540px', () => {
  assert.match(
    App源码,
    /@media \(min-width: 541px\) and \(max-width: 900px\) \{[\s\S]*?\.hud \{[\s\S]{0,180}flex-direction:\s*column;/,
    '窗口化电脑端重排 HUD',
  );
  assert.match(
    App源码,
    /@media \(min-width: 541px\) and \(max-width: 900px\) \{[\s\S]*?\.hud-time \{[\s\S]{0,220}flex-direction:\s*row;/,
    '紧凑档时间块横排并释放横向空间',
  );
  assert.match(
    App源码,
    /@media \(min-width: 541px\) and \(max-width: 900px\) \{[\s\S]*?\.dock-btn \.ic \{[\s\S]{0,80}width:\s*22px;/,
    '紧凑档缩减 dock 占高但不缩小文字',
  );

  assert.match(偏好源码, /matchMedia\('\(max-width: 540px\)'\)/, '手机业务断点保持 540px');
  assert.doesNotMatch(偏好源码, /900px/, '紧凑桌面不得伪装成移动端业务状态');
});
