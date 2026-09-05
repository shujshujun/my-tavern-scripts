/* eslint-disable import-x/no-nodejs-modules -- Node-only queue lifecycle regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '301', 房间类型: '户' } });
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 冻结本轮事件 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 清理线路失效待演打断, 线路随机打断标记 } = require('../../src/人妻公寓/脚本/游戏逻辑/线路待演打断.ts');
const { 本轮事件可提交 } = require('../../src/人妻公寓/脚本/游戏逻辑/入住触发门.ts');
const { 场景剧情可见标题, 清除场景剧情内部标签 } = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const { 脚本写入, 登记MVU提交校验 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const legacy = '【事件在场妻:301】【事件关联夫:301】【查岗电话】安若妍的手机响了，来电人：江辰。';
function fresh() {
  return Schema.parse({ 户: { 101: 创建户节点(0), 301: 创建户节点(0), 302: 创建户节点(0) } });
}

test('取出待演事件时复核线路资格，已完成角色的旧查岗不再进入当前正文', () => {
  const data = fresh();
  data.系统._待发送事件 = legacy;
  assert.equal(冻结本轮事件(data, 8).内容, legacy);
  data.系统._已完成特殊场景.push('角色路线:301:结局剧情');
  const before = lodash.cloneDeep(data);
  assert.equal(冻结本轮事件(data, 8).内容, '');
  assert.deepEqual(data, before, '快照读口只筛选，不改写持久队列或历史');
});

test('新旧候选按户退出，后续票仍可冻结和提交，重复恢复不再次改动', () => {
  const data = fresh();
  const other = '【事件在场妻:101】【事件关联夫:101】【手机亮了】夏乔收到丈夫消息。';
  data.系统._待发送事件 = `${线路随机打断标记('丈夫', '301')}${legacy}|${other}`;
  const before = lodash.cloneDeep(data);
  assert.equal(清理线路失效待演打断(data), false);
  data.系统._安若妍不必停.阶段 = '等待预约夜';
  assert.equal(清理线路失效待演打断(data), true);
  assert.equal(data.系统._待发送事件, other);
  assert.equal(清理线路失效待演打断(data), false);
  const frozen = 冻结本轮事件(data, 8);
  assert.equal(frozen.内容, other);
  assert.equal(本轮事件可提交(frozen, data.系统._待发送事件, 8, true), true);
  assert.equal(本轮事件可提交(frozen, legacy, 8, true), false, '迟到冻结不能认领替换后的队首');
  assert.equal(清理线路失效待演打断(before), false, '回档后保留原候选');
  assert.deepEqual(data.户, before.户, '不回滚或增加任何数值');
});

test('已经开始的事务及同楼重放保留，清理待发送不会改写已完成历史', () => {
  const data = fresh();
  data.系统._已完成特殊场景.push('角色路线:301:结局剧情');
  data.系统._待发送事件 = legacy;
  Object.assign(data.系统._场景剧情事务, { id: 'active', 内容: legacy, 目标场景: '301', 请求世代: 3 });
  data.系统._已注入事件 = { 楼层: 8, 内容: '上一段已经提交的正文事件' };
  const before = lodash.cloneDeep(data);
  assert.equal(清理线路失效待演打断(data), false);
  assert.equal(冻结本轮事件(data, 8).内容, legacy);
  assert.deepEqual(data, before);
  data.系统._场景剧情事务.id = '';
  data.系统._已注入事件 = { 楼层: 8, 内容: legacy };
  assert.equal(清理线路失效待演打断(data), true);
  assert.equal(冻结本轮事件(data, 8).来源, '重放');
  assert.equal(冻结本轮事件(data, 8).内容, legacy);
});

test('结构票必须整体识别，已结算撞见、起疑、旧轨道、入住及普通对白不被清理', () => {
  const data = fresh();
  data.系统._已完成特殊场景.push('借种', '角色路线:301:结局剧情', '录像带结局');
  const settled = [
    '【事件在场妻:301,302】【母亲正式撞见】本次已经扣除胜任度。',
    '【事件关联妻:301】【事件关联夫:301】【丈夫起疑】已登记疑心。',
    '【事件在场夫:202】【事件关联妻:202】【哑巴亏】轨道已经记录。',
    '【新住户】【事件在场妻:201】等待搬入。',
    '【事件在场妻:301】【事件关联夫:301】两人谈起以前的【查岗电话】。',
  ];
  const prefix = '【场景剧情:v1:shared:301:一段剧情】';
  for (const pending of [...settled, `${prefix}${legacy}|${prefix}另一项无法确认来源的内容`]) {
    data.系统._待发送事件 = pending;
    assert.equal(清理线路失效待演打断(data), false, pending);
    assert.equal(data.系统._待发送事件, pending);
  }
  data.系统._待发送事件 = `${prefix}${legacy}|${prefix}${legacy}`;
  assert.equal(清理线路失效待演打断(data), true);
  assert.equal(data.系统._待发送事件, '');
});

test('父亲越洋候选按302路线退出，来源必须与绑定角色一致且不显示在玩家标题中', () => {
  const data = fresh();
  const content = `${线路随机打断标记('越洋', '302')}【事件在场妻:302】【事件关联夫:302】【越洋来电】手机亮了。`;
  data.系统._待发送事件 = content;
  assert.equal(清理线路失效待演打断(data), false);
  data.系统._回国.阶段 = '已完成';
  assert.equal(清理线路失效待演打断(data), true);
  assert.equal(场景剧情可见标题(content), '越洋来电');
  assert.doesNotMatch(清除场景剧情内部标签(content), /线路随机/u);
  data.系统._已完成特殊场景.push('角色路线:301:结局剧情');
  data.系统._待发送事件 = `${线路随机打断标记('丈夫', '101')}${legacy}`;
  assert.equal(清理线路失效待演打断(data), false);
});

test('真实脚本提交失败不改持久存档，重试清理与原操作同次保存，失效租约不写', async () => {
  const data = fresh();
  data.系统._待发送事件 = legacy;
  let persisted = { stat_data: lodash.cloneDeep(data) };
  let reject = true;
  let writes = 0;
  globalThis.updateVariablesWith = update => update({});
  globalThis.Mvu = { replaceMvuData: async raw => {
    writes++;
    if (reject) throw new Error('save failed');
    persisted = lodash.cloneDeep(raw);
  } };
  const next = lodash.cloneDeep(data);
  next.系统._安若妍不必停.阶段 = '等待预约夜';
  await assert.rejects(脚本写入(lodash.cloneDeep(persisted), next, { 记录成长: false }), /save failed/u);
  assert.equal(persisted.stat_data.系统._待发送事件, legacy);
  reject = false;
  await 脚本写入(lodash.cloneDeep(persisted), next, { 记录成长: false });
  assert.equal(persisted.stat_data.系统._待发送事件, '');
  assert.equal(persisted.stat_data.系统._安若妍不必停.阶段, '等待预约夜');
  const stop = 登记MVU提交校验(() => false);
  try { await assert.rejects(脚本写入({}, data), /时间线|分支/u); } finally { stop(); }
  assert.equal(writes, 2);
});
