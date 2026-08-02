/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
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
const { 结算成功现场楼 } = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');

test('主动收尾快照与实际结算共用基础、首次偏好和冻结等级加成', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) } });
  data.户['101'].妻.当前阶段 = 3;
  data.玩家资源.体力.当前值 = 5;
  data.系统._性爱场景 = {
    状态: '进行中',
    场次标识: 'snapshot-settlement-scene',
    开始楼层: 8,
    有效楼数: 1,
    本场等级加成: 1,
    当前接触部位: '小屄',
    当前行为: '阴道插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '101',
    参与者: {
      101: { 满意度: 0, 满意目标: 3, 偏好命中: [], 等级加成已用: false },
    },
  };
  聊天变量 = {
    _场景: { 房间id: '101', 进房末楼: 8 },
    _粘滞: { 位置: '101', 楼: 8, 们: ['101'] },
  };
  const 行动 = '【亲密收尾:小屄】主动选择在小屄收尾';
  const 快照 = 组公寓快照([{ role: 'user', content: 行动 }], data, 10);
  assert.match(快照, /逐角色预计结论:夏乔:合适/);
  assert.doesNotMatch(快照, /逐角色预计结论:夏乔:太短/);

  const 新值 = structuredClone(data);
  const 结果 = 结算成功现场楼(新值, structuredClone(data), {
    楼层: 10,
    行动,
    正文: '夏乔维持此前的阴道插入，并按确认位置完成收尾。',
    本楼事件: '',
    妻在场: ['101'],
    实际尺度: { 101: 3 },
    资源计费: true,
  });
  assert.equal(结果.性爱结束, true);
  assert.equal(新值.系统._上次性爱结果.参与者['101'].满意度, 3);
  assert.equal(新值.系统._上次性爱结果.参与者['101'].时长评价, '合适');
});
