/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
let vars = {};
globalThis.getVariables = () => vars;
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 安若妍换掉商品ID } = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');
const people = (wives = [], husbands = []) => ({
  焦点: [...new Set([...wives, ...husbands])], 在场: [], 妻在场: wives, 夫在场: husbands, 私聊可召回妻: wives,
});
function dataWithHistory() {
  const data = Schema.parse({ 户: Object.fromEntries(['101', '102', '201', '202', '301', '302'].map(m => [m, 创建户节点(4)])) });
  data.系统._母亲入列 = true;
  Object.assign(data.系统._许曼君分居, {
    阶段: '已完成', 丈夫已知玩家关系: true, 工资卡状态: '已归还赵国强',
    钥匙位置: '管理员室201钥匙格', 钥匙用途: '待离婚交接', 留宿201权限: true,
    独住环境已确认: true, 生活用品已取完: true,
  });
  Object.assign(data.系统._许曼君离婚, { 阶段: '已完成', 法律离婚已成立: true, 赵国强正式退居: true, 换锁完成: true });
  data.户['201'].夫._居住模式 = '正式退居';
  data.系统._安若妍不必停.阶段 = '已完成';
  data.系统._安若妍换掉.阶段 = '已完成';
  data.系统._已完成特殊场景.push(安若妍换掉商品ID);
  return Schema.parse(data);
}
function snapshot(data, room, actors = people(), text = '说说今天的天气。', event = '', mode = '完整', history = []) {
  vars = { _场景: { 房间id: room, 进房末楼: 10 }, _粘滞: { 位置: room, 楼: 10, 们: actors.妻在场, 夫们: actors.夫在场 } };
  const before = structuredClone(data);
  const result = 组公寓快照([...history, { role: 'user', content: text }], data, 40, event, actors,
    { 模式: mode, 原因: '读取测试', 下一态: data.系统._提示刷新态 });
  assert.deepEqual(data, before);
  return result;
}
const privateTags = /【201分居|【许曼君婚姻硬事实】|【201住户硬事实】|【301换照后】/;

for (const mode of ['完整', '最小']) {
  for (const [room, actors] of [['101', people(['101'])], ['管理员室', people()], ['102', people(['102'])]]) {
    test(`S01 ${room}/${mode}无关天气交流不附带201与301私人路线后效`, () => {
      const data = dataWithHistory();
      const result = snapshot(data, room, actors, undefined, '', mode);
      assert.equal(privateTags.test(result), false, '无关私人路线块进入当前输入');
      assert.ok(result.includes('【管理权·当前事实】'));
      assert.ok(result.includes('【当前日期与时段】'));
    });
  }
}

for (const [label, room, actors, text, event] of [
  ['201现场', '201', people(['201']), '继续说。', ''],
  ['201妻在公共区', '大堂', people(['201']), '继续说。', ''],
  ['201丈夫在公共区', '管理员室', people([], ['201']), '继续说。', ''],
  ['直接提妻姓名', '101', people(['101']), '想起许曼君上次说的安排。', ''],
  ['直接提丈夫姓名', '管理员室', people(), '看看赵国强留下的记录。', ''],
  ['明确房号', '管理员室', people(), '看看201室的门锁记录。', ''],
  ['本轮结构化事件关联', '管理员室', people(), '继续处理。', '【事件关联妻:201】处理登记。'],
]) {
  test(`S01 ${label}保留相关既成事实，关联不自动成为现场演员`, () => {
    const result = snapshot(dataWithHistory(), room, actors, text, event);
    assert.ok(result.includes('法律离婚已经成立'));
    assert.ok(result.includes('工资卡已经由许曼君本人归还'));
    if (!actors.妻在场.includes('201')) assert.equal(result.includes('◆ 许曼君(201室)|本人在场'), false);
  });
}

for (const [room, actors, text, event] of [
  ['301', people(['301']), '说说天气。', ''],
  ['管理员室', people(), '查查江辰上次登记的到访。', ''],
  ['管理员室', people(), '看看301的记录。', ''],
  ['管理员室', people(), '继续处理。', '【事件关联妻:301】处理登记。'],
]) {
  test(`S01 301后效按${room}/${text}/${event || '普通'}保留`, () => {
    const result = snapshot(dataWithHistory(), room, actors, text, event);
    assert.ok(result.includes('【301换照后】'));
    assert.equal(result.includes('【201分居'), false);
  });
}

test('S01 旧历史提及不使路线后效在换场后一直常驻', () => {
  const result = snapshot(dataWithHistory(), '101', people(['101']), '今天晴天。', '', '完整', [
    { role: 'user', content: '刚才与许曼君、安若妍核对过记录。' },
    { role: 'assistant', content: '你已经结束那次谈话，来到101。' },
  ]);
  assert.equal(privateTags.test(result), false);
});

test('S01 待发送但未成为本轮事件的其他房间票不召回私人路线', () => {
  const data = dataWithHistory();
  data.系统._待发送事件 = '【事件关联妻:201】稍后处理登记';
  assert.equal(privateTags.test(snapshot(data, '101', people(['101']))), false);
});

test('S01 存档重载、路线回退与再次进入按当前事实派生', () => {
  let data = dataWithHistory();
  assert.ok(snapshot(data, '201', people(['201'])).includes('法律离婚已经成立'));
  data = Schema.parse(JSON.parse(JSON.stringify(data)));
  assert.equal(privateTags.test(snapshot(data, '101', people(['101']))), false);
  data.系统._许曼君离婚.法律离婚已成立 = false;
  data.系统._许曼君离婚.阶段 = '待办理';
  assert.equal(snapshot(data, '201', people(['201'])).includes('法律离婚已经成立'), false);
});

test('S01 活动301承接的导演后效在本轮相关时保持', () => {
  const data = dataWithHistory();
  data.系统._安若妍换掉.阶段 = '未开始';
  data.系统._已完成特殊场景 = data.系统._已完成特殊场景.filter(id => id !== 安若妍换掉商品ID);
  data.系统._安若妍不必停.阶段 = '等待预约夜';
  assert.ok(snapshot(data, '301', people(['301'])).includes('【安若妍301承接·不必停】'));
  assert.equal(snapshot(data, '101', people(['101'])).includes('【安若妍301承接·不必停】'), false);
});
