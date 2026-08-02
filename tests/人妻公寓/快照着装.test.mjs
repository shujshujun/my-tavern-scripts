/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let 聊天变量 = {};
globalThis.getVariables = () => 聊天变量;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');

test('焦点妻的着装文本会把内衣与外装一起注入 AI 快照', () => {
  const data = Schema.parse({
    户: {
      101: 创建户节点(0),
    },
  });
  data.户['101'].妻.外装 = '居家针织裙';
  data.户['101'].妻.内衣 = '你送的黑色蕾丝内衣';
  data.户['101'].妻.妆容 = '素颜';
  聊天变量 = {
    _场景: { 房间id: '101', 进房末楼: 0 },
    _粘滞: { 位置: '101', 楼: 0, 们: ['101'] },
  };

  const snapshot = 组公寓快照([{ role: 'user', content: '在客厅和她打招呼。' }], data, 0);

  assert.match(snapshot, /着装:居家针织裙\|你送的黑色蕾丝内衣/);
});
