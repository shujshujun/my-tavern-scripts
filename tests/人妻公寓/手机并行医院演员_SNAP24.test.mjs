/* eslint-disable import-x/no-nodejs-modules -- 真实医院资格、提示、演员解析和生产事务，宿主I/O隔离。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHost, clone } from './helpers/微信事务恢复环境.mjs';

function fixture(room, family = false) {
  const e = createHost();
  const events = new EventTarget();
  e.window.addEventListener = events.addEventListener.bind(events);
  e.window.removeEventListener = events.removeEventListener.bind(events);
  e.window.document = Object.assign(new EventTarget(), { querySelectorAll: () => [], documentElement: null });
  const data = e.st.chat.at(-1).stat_data;
  const node = clone(data.户['101']); data.户 = { [room]: node };
  Object.assign(node.妻, { 当前阶段: family ? 5 : 4, 好感值: 60, 堕落值: 40 });
  data.系统._绝对时段 = 0; data.系统._母亲入列 = true;
  const scene = family ? '借种结局:101:0:10' : `phone-batch3-hospital-${room}`;
  Object.assign(node.妻._怀孕, { 状态: '已告知', 已曝光: true, 受孕场次标识: scene });
  Object.assign(node.妻._生产, { 状态: '待产通知', 本胎序号: 1 });
  if (family) { data.系统._已完成特殊场景.push('借种'); node.妻._生产.家庭计划知情 = true; }
  return { e, data, production: e.load('生产系统.ts'), receipt: { 门牌: room, 胎次: 1, 场次标识: scene } };
}
for (const [room, family] of [...['101', '102', '201', '202', '301', '302'].map(room => [room, false]), ['101', true]]) {
  test(`SNAP24 ${room}/${family ? '家庭' : '普通'} 留下陪产只要求合法在场者反应`, () => {
    const { e, data, production, receipt } = fixture(room, family);
    assert.deepEqual(production.确认预产微信已读(data, [receipt]), [room]);
    assert.equal(production.生产地点动作(data, '大堂').length, 0);
    assert.ok(production.生产地点动作(data, '医院').some(a => a.id === '留下陪产'));
    const before = clone(data);
    const prompt = production.生产动作系统注入(data, room, '留下陪产');
    const actors = e.load('snapshotSystem.ts').解析事件角色绑定(prompt, data);
    assert.deepEqual(actors.在场妻, [room]);
    assert.deepEqual(actors.在场夫, family ? ['101'] : []);
    assert.equal(prompt.includes('她与陆嘉明带来的具体反应'), family);
    assert.match(prompt, /本拍不生产、不推进时间/);
    assert.deepEqual(data, before, '生成提示不推进状态或结算');
  });
  test(`SNAP24 ${room}/${family ? '家庭' : '普通'} 医院重试与出生幂等不变`, () => {
    const { e, data, production, receipt } = fixture(room, family);
    production.确认预产微信已读(data, [receipt]);
    assert.equal(production.提交产前看望(data, room).成功, true);
    assert.equal(production.提交产前看望(data, room).成功, false);
    const before = clone(data);
    production.生产动作系统注入(data, room, '留下陪产');
    assert.deepEqual(data, before, '失败/取消而未成功提交时没有副作用');
    assert.equal(production.提交留下陪产(data, room).成功, true);
    assert.equal(data.系统._绝对时段, 0);
    const time = e.load('时间推进系统.ts');
    const request = { 门牌: room, 预期绝对时段: 0, 当前消息楼: 4, 当前地点: '医院' };
    const birth = time.执行等待生产事务(data, request);
    assert.equal(birth.成功, true); assert.equal(birth.推进时段数, 2);
    assert.equal(data.系统._家庭文档.孩子.length, 1);
    assert.ok(production.生产地点动作(data, '医院').some(a => a.id === '重试生产叙事'));
    const saved = clone(data);
    assert.equal(time.执行等待生产事务(data, { ...request, 预期绝对时段: 2 }).成功, false);
    assert.deepEqual(data, saved);
    assert.equal(production.提交生产叙事完成(data, room).成功, true);
    assert.equal(production.生产地点动作(data, '医院').some(a => a.id === '重试生产叙事'), false);
    assert.equal(production.提交产后看望(data, room).成功, true);
    assert.equal(production.提交产后看望(data, room).成功, false);
    assert.equal(data.系统._家庭文档.孩子.length, 1);
  });
}
