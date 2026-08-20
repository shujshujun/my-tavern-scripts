/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// P7A:手机系统.ts 已是纯 re-export 门面；样式实现归 壳/资源与皮肤，渲染实现归 内核。
const 资源与皮肤源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/资源与皮肤.ts', import.meta.url),
  'utf8',
);
const 聊天页源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/chat.ts', import.meta.url), 'utf8');
const 通话页源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/talk.ts', import.meta.url), 'utf8');

function 截片段(源, 开始, 结束) {
  const 起 = 源.indexOf(开始);
  const 止 = 源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少片段锚点:${开始}`);
  assert.notEqual(止, -1, `缺少片段结束锚点:${结束}`);
  return 源.slice(起, 止);
}

test('普通微信把玩家消息放右边、角色消息放左边', () => {
  const 样式 = 截片段(资源与皮肤源码, '#${ROOT_ID} .rqp-bubbles', '#${ROOT_ID} .rqp-input');
  // P7B2:单聊页已迁至 ./壳/渲染/chat.ts。
  const 私聊 = 截片段(聊天页源码, 'export function 渲染chat', '体.scrollTop = 体.scrollHeight;');

  assert.match(样式, /\.rqp-line\.me\s*\{[^}]*flex-direction\s*:\s*row-reverse/);
  assert.match(私聊, /const 我方\s*=\s*m\.发\s*===\s*'我'/);
  assert.match(私聊, /`rqp-line \$\{我方 \? 'me' : 'ta'\}`/);
});

test('父亲微信通话沿用同一行布局，不让玩家与父亲气泡挤在同一侧', () => {
  // P7B2:父亲通话页已迁至 ./壳/渲染/talk.ts。
  const 通话 = 截片段(通话页源码, 'export function 渲染talk', '体.scrollTop = 体.scrollHeight;');

  assert.match(通话, /const 我方\s*=\s*t\.谁\s*===\s*'我'/);
  assert.match(通话, /`rqp-line \$\{我方 \? 'me' : 'ta'\}`/);
  assert.match(通话, /`rqp-b \$\{我方 \? 'me' : 'ta'\}`/);
});

test('父亲通话的母亲圆场提示进入 innerHTML 前必须转义', () => {
  const 通话 = 截片段(通话页源码, 'export function 渲染talk', 'for (const t of 父亲通话.记录)');
  assert.match(资源与皮肤源码, /if \(html !== undefined\) e\.innerHTML = html/);
  assert.match(通话, /el\('div', 'rqp-b sys', _\.escape\(圆场说明\)\)/);
  assert.doesNotMatch(通话, /el\('div', 'rqp-b sys', 圆场说明\)/);
});
