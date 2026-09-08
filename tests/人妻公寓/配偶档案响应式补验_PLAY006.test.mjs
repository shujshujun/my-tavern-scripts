/* eslint-disable import-x/no-nodejs-modules -- 真实Vue同实例更新与只读状态派生，内存节点不代表浏览器像素验收。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { fresh, retired, clone, mount } from './helpers/配偶档案显示_PLAY006.mjs';

test('PLAY006 同一Vue实例在退居、回档、换户、就绪切换后刷新身份和风险', async t => {
  const data = retired(), before = clone(data);
  const e = mount(data); t.after(e.unmount);
  const instance = e.instance();
  assert.match(e.text(), /前夫|正式退居/);
  assert.equal(e.hasClass('husband-risk'), false);
  assert.deepEqual(data, before);
  e.props.data = fresh(); await e.nextTick();
  assert.doesNotMatch(e.text(), /前夫|正式退居/);
  assert.equal(e.hasClass('husband-risk'), true);
  e.props.data = retired(); e.props.door = '102'; await e.nextTick();
  assert.doesNotMatch(e.text(), /前夫|正式退居/);
  e.props.ready = false; await e.nextTick(); assert.equal(e.text(), '');
  e.props.ready = true; e.props.door = '201'; await e.nextTick();
  assert.match(e.text(), /已正式退居/);
  assert.equal(e.instance(), instance, '整个序列只挂载一次组件');
});

test('PLAY006 同实例深层状态修改即时更新，保留疑心与信任原始读数', async t => {
  const e = mount(fresh()); t.after(e.unmount);
  const instance = e.instance();
  e.props.data.户['201'].夫._居住模式 = '路线外住'; await e.nextTick();
  assert.match(e.text(), /在外居住/);
  e.props.data.系统._许曼君离婚.法律离婚已成立 = true;
  e.props.data.户['201'].夫._居住模式 = '待离婚交接'; await e.nextTick();
  assert.match(e.text(), /前夫/);
  assert.match(e.text(), /等待离婚交接/);
  assert.equal(e.props.data.户['201'].夫.疑心值, 71);
  assert.equal(e.props.data.户['201'].夫.信任值, 23);
  assert.equal(e.instance(), instance);
});

test('PLAY006 预约左闭右开及缺户回退均使用当前props', async t => {
  const data = fresh();
  Object.assign(data.户['201'].夫, { _居住模式: '预约回楼', _预约回楼起: 22, _预约回楼至: 24 });
  const e = mount(data); t.after(e.unmount);
  for (const [time, inside] of [[21, false], [22, true], [23, true], [24, false]]) {
    e.props.absolutePeriod = time; await e.nextTick();
    assert.equal(e.text().includes('已按预约回楼'), inside);
  }
  e.props.data.户['201'].夫._居住模式 = '未知旧值'; await e.nextTick();
  assert.match(e.text(), /此刻/);
  delete e.props.data.户['201']; await e.nextTick();
  assert.equal(e.text(), '');
});
