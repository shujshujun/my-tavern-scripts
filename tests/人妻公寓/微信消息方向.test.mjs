/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 手机源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机系统.ts', import.meta.url), 'utf8');

function 截片段(开始, 结束) {
  const 起 = 手机源.indexOf(开始);
  const 止 = 手机源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少片段锚点:${开始}`);
  assert.notEqual(止, -1, `缺少片段结束锚点:${结束}`);
  return 手机源.slice(起, 止);
}

test('普通微信把玩家消息放右边、角色消息放左边', () => {
  const 样式 = 截片段('#${ROOT_ID} .rqp-bubbles', '#${ROOT_ID} .rqp-input');
  const 私聊 = 截片段("if (当前页.名 === 'chat' && 当前页.会话)", "if (当前页.名 === 'moments')");

  assert.match(样式, /\.rqp-line\.me\s*\{[^}]*flex-direction\s*:\s*row-reverse/);
  assert.match(私聊, /const 我方\s*=\s*m\.发\s*===\s*'我'/);
  assert.match(私聊, /`rqp-line \$\{我方 \? 'me' : 'ta'\}`/);
});

test('父亲微信通话沿用同一行布局，不让玩家与父亲气泡挤在同一侧', () => {
  const 通话 = 截片段("if (当前页.名 === 'talk')", "if (当前页.名 === 'settings')");

  assert.match(通话, /const 我方\s*=\s*t\.谁\s*===\s*'我'/);
  assert.match(通话, /`rqp-line \$\{我方 \? 'me' : 'ta'\}`/);
  assert.match(通话, /`rqp-b \$\{我方 \? 'me' : 'ta'\}`/);
});
