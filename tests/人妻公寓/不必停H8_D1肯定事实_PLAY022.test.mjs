/* eslint-disable import-x/no-nodejs-modules -- Node-only route regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');

const h8 = '【安若妍不必停提交:H8关门:1】';
const d12 = '【安若妍不必停提交:D1客厅:2】';

test('PLAY-022 H8“玩家没有继续”不能被关键词继续误签为成功', () => {
  assert.match(
    route.安若妍不必停正文越拍原因(h8, '玩家没有继续刚才的动作，安若妍也停下了。江辰从外面关好卧室门，转身去书房。'),
    /玩家继续|没有同时完成|H8/u,
  );
});

test('PLAY-022 H8明确继续且江辰从外面关门继续通过', () => {
  assert.equal(
    route.安若妍不必停正文越拍原因(h8, '玩家继续刚才的动作，安若妍没有撤回。江辰从外面关好卧室门，转身去书房。'),
    '',
  );
});

test('PLAY-022 D1第二拍任一协议事实被否定时不能提交长期状态', () => {
  assert.match(route.安若妍不必停正文越拍原因(d12, '我们还没有约定互不干涉，不过以后回来会提前通知。'), /D1|互不干涉|提前通知/u);
  assert.match(route.安若妍不必停正文越拍原因(d12, '双方私人生活互不干涉，不过回来前我没有答应提前通知。'), /D1|互不干涉|提前通知/u);
});

test('PLAY-022 D1第二拍两项协议均明确成立时继续通过', () => {
  assert.equal(route.安若妍不必停正文越拍原因(d12, '双方明确约定私人生活互不干涉，江辰以后回来会提前通知。'), '');
});
