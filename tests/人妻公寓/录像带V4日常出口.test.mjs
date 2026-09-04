/* eslint-disable import-x/no-nodejs-modules -- Node-only VTR V4 daily-context regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let 聊天变量 = {};
globalThis.getVariables = () => 聊天变量;

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 录像带V4固定日常结果摘要 } = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4状态.ts');

function 日常数据() {
  const data = Schema.parse({
    户: {
      102: 创建户节点(4),
      202: 创建户节点(4),
    },
  });
  data.户['102'].妻.当前阶段 = 4;
  data.户['202'].妻.当前阶段 = 4;
  return data;
}

test('V4完成后日常快照只接收固定结果摘要，不读取专用日志原文', () => {
  const data = 日常数据();
  data.系统._录像带V4.阶段 = '已完成';
  data.系统._录像带V4.场景.状态 = '已完成';
  data.系统._录像带V4.结果摘要 = 录像带V4固定日常结果摘要;
  聊天变量 = {
    _场景: { 房间id: '302', 进房末楼: 9 },
    _隔离事件: {
      日志: [
        {
          类型: '录像带V4',
          线程: 'vtr:finished-scene',
          谁: '叙事',
          文本: 'VTR_EXPLICIT_DIALOGUE_SENTINEL_不得流入日常',
          画面键: 'VTR-V4-102-B19',
        },
      ],
    },
  };

  const 快照 = 组公寓快照([{ role: 'user', content: '回到日常，聊聊楼里的近况。' }], data, 10);
  assert.match(快照, /【录像带结局·长期事实】/u);
  assert.match(快照, new RegExp(lodash.escapeRegExp(录像带V4固定日常结果摘要), 'u'));
  assert.match(快照, /不得复述、补写或推断录像带19幕/u);
  assert.doesNotMatch(快照, /VTR_EXPLICIT_DIALOGUE_SENTINEL/u);
  assert.doesNotMatch(快照, /VTR-V4-102-B19/u);
});

test('V4尚未完成时日常快照不提前暴露固定结果或专用日志', () => {
  const data = 日常数据();
  data.系统._录像带V4.阶段 = '微信确认中';
  data.系统._录像带V4.结果摘要 = 录像带V4固定日常结果摘要;
  聊天变量 = {
    _场景: { 房间id: '302', 进房末楼: 9 },
    _隔离事件: { 日志: [{ 类型: '录像带V4', 文本: 'VTR_PREMATURE_SENTINEL' }] },
  };

  const 快照 = 组公寓快照([{ role: 'user', content: '继续普通日常。' }], data, 10);
  assert.doesNotMatch(快照, /【录像带结局·长期事实】/u);
  assert.doesNotMatch(快照, /VTR_PREMATURE_SENTINEL/u);
});
