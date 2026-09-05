/* eslint-disable import-x/no-nodejs-modules -- Node-only RP phase regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
let room = '201';
globalThis.getVariables = () => ({ _场景: { 房间id: room, 房间类型: '户' } });
globalThis.insertOrAssignVariables = () => undefined;
globalThis.getLastMessageId = () => 40;
globalThis.SillyTavern = { name1: '管理员', chat: [], getCurrentChatId: () => 'phase-test' };
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 门牌列表, 户静态表, 许曼君离婚场景ID } = require('../../src/人妻公寓/stageConfig.ts');
const { 读取角色阶段体验 } = require('../../src/人妻公寓/脚本/游戏逻辑/角色阶段体验.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');

function fresh() {
  const data = Schema.parse({ 户: Object.fromEntries(门牌列表.map(m => [m, 创建户节点(0)])) });
  for (const h of Object.values(data.户)) { h.妻.当前阶段 = 5; h.妻.婚姻值 = 100; }
  return data;
}
test('六户当前体验从真实阶段派生；共享结局不提前改变其他户', () => {
  const data = fresh();
  for (const m of 门牌列表) assert.equal(读取角色阶段体验(data, m), null);
  data.系统._已完成特殊场景.push('录像带結局');
  assert.equal(读取角色阶段体验(data, '102'), null, '非真实完成ID不授予入口');
  data.系统._已完成特殊场景 = ['录像带结局'];
  assert.ok(读取角色阶段体验(data, '102'));
  assert.ok(读取角色阶段体验(data, '202'));
  assert.equal(读取角色阶段体验(data, '101'), null);
  data.系统._已完成特殊场景.push('借种', 许曼君离婚场景ID, '角色路线:301:结局剧情', '双重继承');
  assert.equal(new Set(门牌列表.map(m => 读取角色阶段体验(data, m).标题)).size, 6);
  delete data.户['202'];
  assert.equal(读取角色阶段体验(data, '202'), null);
});
test('201身份区分分居、法律离婚中途与完整生活，关系选择保留', () => {
  const data = fresh();
  data.系统._许曼君分居.阶段 = '已完成';
  assert.equal(读取角色阶段体验(data, '201').配偶称谓, '丈夫');
  data.系统._许曼君离婚.法律离婚已成立 = true;
  assert.equal(读取角色阶段体验(data, '201').配偶称谓, '前夫');
  assert.match(读取角色阶段体验(data, '201').继续方式, /结局仍待收束/u);
  data.系统._已完成特殊场景.push(许曼君离婚场景ID);
  for (const choice of ['继续关系', '暂不承诺', '退出关系', '未决定']) {
    data.系统._许曼君分居.玩家最终关系选择 = choice;
    const view = 读取角色阶段体验(data, '201');
    assert.equal(view.标题, '离婚后的生活');
    assert.match(view.简介, new RegExp(choice === '未决定' ? '未记录' : choice === '退出关系' ? '退出私人关系' : choice));
  }
});
test('实际普通正文快照在结局后使用当前生活，不再叠加旧婚姻与罪恶感描述', () => {
  for (const m of 门牌列表) {
    room = m;
    const data = fresh();
    const people = { 焦点: [m], 在场: [m], 妻在场: [m], 夫在场: [] };
    const chat = [{ role: 'user', content: '我来看看你，今天有什么安排？' }];
    const perceptionOf = snapshot => {
      const marker = `◆ ${户静态表[m].妻名}(${m}室)`;
      const start = snapshot.indexOf(marker);
      assert.ok(start >= 0, marker);
      return snapshot.slice(start).split('\n').find(line => /^ {2}(?:感知|状态):/u.test(line)) ?? '';
    };
    assert.match(perceptionOf(组公寓快照(chat, data, 40, '', people)), /这段婚姻在外人眼里还看不出裂缝/u);
    data.系统._已完成特殊场景 = ['借种', '录像带结局', 许曼君离婚场景ID, '角色路线:301:结局剧情', '双重继承'];
    data.系统._许曼君分居.玩家最终关系选择 = '退出关系';
    const before = lodash.cloneDeep(data);
    const snapshot = 组公寓快照(chat, data, 40, '', people);
    const perception = perceptionOf(snapshot);
    assert.ok(perception, m);
    assert.doesNotMatch(perception, /这段婚姻在外人眼里还看不出裂缝|她最近对丈夫好得刻意|她不敢和丈夫对视/u);
    if (m === '201') assert.match(snapshot, /玩家已经退出私人关系/u);
    assert.deepEqual(data, before, '生成快照不签发新生活结果');
  }
});
