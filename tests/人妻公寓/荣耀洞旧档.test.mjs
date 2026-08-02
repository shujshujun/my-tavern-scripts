/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema } = require('../../src/人妻公寓/schema.ts');
const { 使用荣耀洞, 规范荣耀洞上次时段 } = require('../../src/人妻公寓/脚本/游戏逻辑/荣耀洞.ts');
const 界面源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

test('荣耀洞冷却起点会清理所有负值、非有限值和未来绝对时段戳', () => {
  assert.equal(规范荣耀洞上次时段(-1, 0), -999);
  assert.equal(规范荣耀洞上次时段(Number.NaN, 10), -999);
  assert.equal(规范荣耀洞上次时段(11, 10), -999);
  assert.equal(规范荣耀洞上次时段(0, 17), 0);
  assert.equal(规范荣耀洞上次时段(0, 18), 0);
});

test('负值哨兵代表从未使用，绝对时段 0 不应被误判为冷却中', () => {
  const data = Schema.parse({
    系统: {
      _荣耀洞上次时段: -1,
    },
  });

  const result = 使用荣耀洞(data, 0, true);

  assert.equal(result.变动, true);
  assert.doesNotMatch(result.提示, /今天已经用过/);
  assert.equal(data.系统._荣耀洞上次时段, 0);
});

test('荣耀洞界面与业务端共用同一时段水位归一函数', () => {
  assert.match(界面源, /import \{ 规范荣耀洞上次时段 \} from ['"]\.\.\/\.\.\/脚本\/游戏逻辑\/荣耀洞['"]/);
  assert.match(界面源, /const 记 = 规范荣耀洞上次时段\(系\._荣耀洞上次时段, 绝对时段\.value\)/);
});
