/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 游戏逻辑源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 客户端源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 界面偏好源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/composables/useUIPrefs.ts', import.meta.url), 'utf8');

function 截段(源, 开始标记, 结束标记) {
  const 开始 = 源.indexOf(开始标记);
  assert.notEqual(开始, -1, `缺少开始标记：${开始标记}`);
  const 结束 = 源.indexOf(结束标记, 开始);
  assert.notEqual(结束, -1, `缺少结束标记：${结束标记}`);
  return 源.slice(开始, 结束);
}

test('移动端全屏提示挂在酒馆 0 楼正文，而不是被压缩的游戏 iframe 内', () => {
  const 注入段 = 截段(游戏逻辑源, 'function 注入全屏样式()', '\n// ============================================\n// 启动引导:');

  assert.match(注入段, /getElementById\('rq-mobile-fullscreen-guide'\)/);
  assert.match(注入段, /querySelector<HTMLElement>\('#chat \.mes\[mesid="0"\]'\)/);
  assert.match(注入段, /querySelector<HTMLElement>\('\.mes_text'\)/);
  assert.match(注入段, /appendChild\(提示\)/);
  assert.match(注入段, /点击上方游戏画面右上角的全屏按钮/);
  assert.match(注入段, /当前看到的是酒馆压缩预览/);
});

test('宿主提示只在手机宽度且 iframe 异常矮小时显示，并保持普通文档流布局', () => {
  const 注入段 = 截段(游戏逻辑源, 'function 注入全屏样式()', '\n// ============================================\n// 启动引导:');

  assert.match(注入段, /@media \(max-width:\s*600px\)/);
  assert.match(注入段, /#rq-mobile-fullscreen-guide\.rq-visible\{display:flex/);
  assert.match(注入段, /margin:\s*18px auto 0/);
  assert.doesNotMatch(注入段, /#rq-mobile-fullscreen-guide\{[^}]*position:\s*fixed/);
  assert.match(注入段, /querySelectorAll<HTMLIFrameElement>\('iframe'\)/);
  assert.match(注入段, /getBoundingClientRect\(\)/);
  assert.match(注入段, /classList\.toggle\('rq-visible', 压缩中\)/);
});

test('全屏往返使 iframe 恢复高度后，提示会通过尺寸观察自动隐藏', () => {
  const 注入段 = 截段(游戏逻辑源, 'function 注入全屏样式()', '\n// ============================================\n// 启动引导:');

  assert.match(注入段, /new 宿主窗\.ResizeObserver/);
  assert.match(注入段, /尺寸观察\?\.observe\(游戏框\)/);
  assert.match(注入段, /classList\.remove\('rq-visible'\)/);
});

test('客户端全屏建议允许继续窗口模式，并持久记住任一选择', () => {
  // 中央 CTA 与按钮模板留在 App；存储与选择动作在 A3 拆出的 useUIPrefs 单例。
  assert.match(客户端源, /v-if="显示移动端全屏引导"[^>]*class="mobile-fullscreen-cta"/);
  assert.match(客户端源, />继续窗口模式</);
  assert.match(
    客户端源,
    /\.mobile-fullscreen-actions button \{[\s\S]{0,100}min-height:\s*44px/,
    '两种全屏选择都必须保留至少44px的移动端触控高度',
  );
  assert.match(界面偏好源, /移动端全屏引导存储键 = ['"]rqgy-mobile-fullscreen-guide-v1['"]/);
  assert.match(界面偏好源, /localStorage\.getItem\(移动端全屏引导存储键\)/);
  assert.match(界面偏好源, /localStorage\.setItem\(移动端全屏引导存储键,/);
  assert.match(界面偏好源, /function 继续窗口模式\(\)[\s\S]{0,180}记住移动端全屏选择\('窗口'\)/);
  assert.match(界面偏好源, /async function 打开移动端全屏\(\)[\s\S]{0,180}记住移动端全屏选择\('全屏'\)/);
});

test('窗口模式选择后中央建议不会随退出全屏重现，右上角入口仍保留', () => {
  assert.match(
    界面偏好源,
    /const 显示移动端全屏引导 = computed\([\s\S]{0,220}!移动端全屏引导已处理\.value[\s\S]{0,120}!真全屏中\.value/,
  );
  assert.doesNotMatch(客户端源, /v-if="移动端 && !真全屏中" class="mobile-fullscreen-cta"/);
  assert.match(客户端源, /:title="全屏中 \? '退出全屏' : '沉浸全屏'" @click="切换全屏"/);
});
