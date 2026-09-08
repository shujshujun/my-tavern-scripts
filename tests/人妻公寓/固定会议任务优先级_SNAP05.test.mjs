/* eslint-disable import-x/no-nodejs-modules -- 真实筹备、开场、演员与快照；只隔离外部手机历史。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
globalThis.getVariables = () => ({ _场景: { 房间id: '管理员室', 进房末楼: 8 }, _粘滞: { 位置: '管理员室', 楼: 8, 们: ['102', '202'], 夫们: [] } });
const phone = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机系统.ts');
require.cache[phone] = { id: phone, filename: phone, loaded: true, exports: { 取会场私聊摘要提示: () => '' } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const scenes = require('../../src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts');
const snapshot = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');

function fresh(time) {
  const data = Schema.parse({ 户: { 102: 创建户节点(4), 202: 创建户节点(4) }, 系统: { _绝对时段: time } });
  for (const node of Object.values(data.户)) {
    node.妻.当前阶段 = 4;
    node.妻.裂缝.已确认 = true;
    node.妻.特殊.push('遥控跳蛋');
  }
  return data;
}
const chat = [{ role: 'user', content: '沈静仪和周小满，继续说说今天的安排。' }];

test('SNAP05 固定会议真实开场的32个时段，当前任务优先且保留两名演员', () => {
  const conflicts = [];
  for (let time = 0; time < 32; time++) {
    const data = fresh(time);
    data.背包.push('静音会议');
    assert.equal(scenes.打开静音会议筹备(data, '管理员室').成功, true);
    assert.equal(scenes.启动静音会议(data, ['102', '202'], '公共设施维修', '管理员室', 8).成功, true);
    const before = structuredClone(data);
    const prompt = snapshot.组公寓快照(chat, data, 9);
    assert.ok(prompt.includes('沈静仪') && prompt.includes('周小满'));
    assert.ok(prompt.includes('公共设施维修'));
    if (prompt.includes('【雌竞】')) conflicts.push(time);
    assert.deepEqual(data, before, '提示优先级不能改变状态或收取额外资源');
  }
  assert.deepEqual(conflicts, []);
});
test('SNAP05 普通多人场景继续按原资格与概率出现关系互动', () => {
  let ordinary = 0;
  for (let time = 0; time < 32; time++) {
    const data = fresh(time);
    const prompt = snapshot.组公寓快照(chat, data, 9, '');
    if (prompt.includes('【雌竞】')) ordinary++;
  }
  assert.ok(ordinary > 0 && ordinary < 32, '保留普通场景原有概率两侧');
});
