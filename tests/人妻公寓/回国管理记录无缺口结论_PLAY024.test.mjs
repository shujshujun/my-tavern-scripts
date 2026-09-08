/* eslint-disable import-x/no-nodejs-modules -- Node-only route regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/回国系统.ts');

const first = '【回国提交:D:管理记录中:30:1】';

test('PLAY-024 第一拍“没有需要补救的经营缺口”本身就是提前成立的最终结论', () => {
  assert.match(route.回国正文越拍原因(first, '母亲确认，没有需要补救的经营缺口。'), /提前|无需圆场|结论/u);
  assert.match(route.回国正文越拍原因(first, '母亲核对后表示，找不到任何需要圆场的经营缺口。'), /提前|无需圆场|结论/u);
  assert.match(route.回国正文越拍原因(first, '母亲看过记录，认为不存在需要补救的经营缺口。'), /提前|无需圆场|结论/u);
});

test('真正尚未得出结论、条件假设和普通开场继续通过', () => {
  assert.equal(route.回国正文越拍原因(first, '母亲还没有确认是否存在经营缺口，只提出陪你核对一遍记录。'), '');
  assert.equal(route.回国正文越拍原因(first, '如果核对后没有经营缺口，再谈是否还需要圆场。'), '');
  assert.equal(route.回国正文越拍原因(first, '母亲提出陪你把平常的经营记录再核对一遍，把问题交给你回应。'), '');
});
