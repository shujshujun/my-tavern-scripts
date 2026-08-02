/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 游戏逻辑源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

function 截段(源, 开始标记, 结束标记) {
  const 开始 = 源.indexOf(开始标记);
  assert.notEqual(开始, -1, `缺少开始标记：${开始标记}`);
  const 结束 = 源.indexOf(结束标记, 开始);
  assert.notEqual(结束, -1, `缺少结束标记：${结束标记}`);
  return 源.slice(开始, 结束);
}

test('移动端全屏提示挂在酒馆 0 楼正文，而不是被压缩的游戏 iframe 内', () => {
  const 注入段 = 截段(游戏逻辑源, 'function 注入全屏样式()', '\n/**\n * 玩家把酒馆助手');

  assert.match(注入段, /getElementById\('rq-mobile-fullscreen-guide'\)/);
  assert.match(注入段, /querySelector<HTMLElement>\('#chat \.mes\[mesid="0"\]'\)/);
  assert.match(注入段, /querySelector<HTMLElement>\('\.mes_text'\)/);
  assert.match(注入段, /appendChild\(提示\)/);
  assert.match(注入段, /点击上方游戏画面右上角的全屏按钮/);
  assert.match(注入段, /当前看到的是酒馆压缩预览/);
});

test('宿主提示只在手机宽度且 iframe 异常矮小时显示，并保持普通文档流布局', () => {
  const 注入段 = 截段(游戏逻辑源, 'function 注入全屏样式()', '\n/**\n * 玩家把酒馆助手');

  assert.match(注入段, /@media \(max-width:\s*600px\)/);
  assert.match(注入段, /#rq-mobile-fullscreen-guide\.rq-visible\{display:flex/);
  assert.match(注入段, /margin:\s*18px auto 0/);
  assert.doesNotMatch(注入段, /#rq-mobile-fullscreen-guide\{[^}]*position:\s*fixed/);
  assert.match(注入段, /querySelectorAll<HTMLIFrameElement>\('iframe'\)/);
  assert.match(注入段, /getBoundingClientRect\(\)/);
  assert.match(注入段, /classList\.toggle\('rq-visible', 压缩中\)/);
});

test('全屏往返使 iframe 恢复高度后，提示会通过尺寸观察自动隐藏', () => {
  const 注入段 = 截段(游戏逻辑源, 'function 注入全屏样式()', '\n/**\n * 玩家把酒馆助手');

  assert.match(注入段, /new 宿主窗\.ResizeObserver/);
  assert.match(注入段, /尺寸观察\?\.observe\(游戏框\)/);
  assert.match(注入段, /classList\.remove\('rq-visible'\)/);
});
