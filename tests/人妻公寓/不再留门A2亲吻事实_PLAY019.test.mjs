/* eslint-disable import-x/no-nodejs-modules -- Node-only route regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');

const a21 = '【不再留门提交:play019:1:A2:1:18】';
const a22 = '【不再留门提交:play019:1:A2:2:18】';

test('PLAY-019 A2第二拍正文明确没有亲吻时不能开放拍照事实', () => {
  assert.match(
    route.不再留门正文越拍原因(a22, '何俊生与同行人仍只是并肩走着，没有亲吻，也没有别的亲密举动。'),
    /第二拍|亲吻|可拍/u,
  );
});

test('PLAY-019 A2第二拍必须实际写出自愿亲吻，且仍停在玩家按快门之前', () => {
  assert.equal(
    route.不再留门正文越拍原因(a22, '何俊生和同行人靠近后自愿亲吻，随后仍站在街对面；玩家还没有按下快门。'),
    '',
  );
});

test('PLAY-019 A2第一拍的真实亲吻不能被同句无关否定“没有立即离开”掩盖', () => {
  assert.match(
    route.不再留门正文越拍原因(a21, '何俊生与同行人已经亲吻，但没有立即离开，仍并肩站着。'),
    /第一拍|亲吻/u,
  );
});

test('A2第一拍正常同行与第二拍提问/计划都不能冒充已经亲吻', () => {
  assert.equal(route.不再留门正文越拍原因(a21, '何俊生与同行人并肩走到街角，只是继续同行。'), '');
  assert.match(route.不再留门正文越拍原因(a22, '同行人问他要不要亲吻，何俊生没有回答。'), /亲吻|第二拍/u);
});
