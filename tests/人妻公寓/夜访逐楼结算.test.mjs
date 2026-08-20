/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let 聊天变量 = {};
globalThis.getVariables = () => 聊天变量;
globalThis.eventEmit = () => undefined;

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 夜访结算 } = require('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts');

function 建深夜夜访数据() {
  const data = Schema.parse({
    系统: { _绝对时段: 5 },
    户: { '101': 创建户节点(0) },
  });
  data.户['101'].妻.当前阶段 = 0;
  data.户['101'].夫.疑心值 = 0;
  聊天变量 = {
    _场景: { 房间id: '101', 破门: false, 非法进入: false, 进房末楼: 8 },
  };
  return data;
}

test('低阶段深夜夜访按每个成功正文楼分别增加疑心与风闻', () => {
  const data = 建深夜夜访数据();

  夜访结算(data, 10);
  assert.equal(data.户['101'].夫.疑心值, 4);
  assert.equal(data.风闻, 2);

  夜访结算(data, 11);
  assert.equal(data.户['101'].夫.疑心值, 8, '第二个正文楼继续承担疑心代价');
  assert.equal(data.风闻, 4, '第二个正文楼也应形成独立的楼道风闻，而不是被同一时段票据吞掉');
});
