/* eslint-disable import-x/no-nodejs-modules -- Node-only V4 runtime regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node', resolveJsonModule: true, esModuleInterop: true });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const contract = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');
const runtime = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4运行时.ts');
const card = contract.读取录像带V4镜头卡('102', 14);

test('PLAY-018 平板过去录像中沈静仪达到高潮不能冒充现场顾国栋完成', () => {
  assert.ok(card);
  assert.equal(
    runtime.录像带V4正文越拍原因(card, '平板过去录像里，沈静仪在此前录下的画面中达到高潮；现场顾国栋仍在临界，没有完成。'),
    '',
  );
});

test('PLAY-018 周小满提问顾国栋是否完成、顾国栋明确否认时不能判现场已完成', () => {
  assert.ok(card);
  assert.equal(
    runtime.录像带V4正文越拍原因(card, '周小满问顾国栋是否已经达到高潮，顾国栋摇头说还没有，继续维持自己的动作。'),
    '',
  );
});

test('PLAY-018 真正现场顾国栋提前完成仍必须被第14幕硬门拒绝', () => {
  assert.ok(card);
  assert.match(
    runtime.录像带V4正文越拍原因(card, '顾国栋在现场已经达到高潮并释放，随后才继续看平板。'),
    /第16幕之前提前完成/u,
  );
});

test('PLAY-018 正常第14幕可描述过去录像推进，同时保持现场丈夫未完成', () => {
  assert.ok(card);
  assert.equal(
    runtime.录像带V4正文越拍原因(card, '平板中的过去录像继续推进，现场顾国栋仍在临界，没有射精，也没有完成。'),
    '',
  );
});
