/* eslint-disable import-x/no-nodejs-modules -- 真实档案组件的隔离渲染回归。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { Schema, config, clock, risk, phase, clone, fresh, retired, render, text } from './helpers/配偶档案显示_PLAY006.mjs';

for (const stage of [0, 5]) {
  test(`PLAY-006 正式退居在${stage === 0 ? '未解锁' : '解锁'}档案不是临时外出，原始读数不变`, async () => {
    const data = retired();
    data.户['201'].妻.当前阶段 = stage;
    data.户['201'].妻.裂缝.已确认 = stage > 0;
    const before = clone(data);
    assert.equal(clock.丈夫在楼(data.户['201'], '201', data.系统._绝对时段), '外出', '底层准入仍返回外出');
    const html = await render(data);
    assert.match(text(html), /前夫/u);
    assert.match(text(html), /已正式退居/u);
    assert.doesNotMatch(text(html), /此刻外出/u);
    assert.doesNotMatch(html, /class="husband-risk"/u);
    if (stage > 0) {
      assert.match(text(html), /旧随机查岗已停用/u);
      assert.match(html, /class="axis-num"[^>]*>71</u);
      assert.match(html, /class="axis-num"[^>]*>23</u);
    }
    assert.deepEqual(data, before);
  });
}

test('PLAY-006 分居外住仍为丈夫；法律成立但终幕未完独立显示前夫与交接状态', async () => {
  const data = fresh();
  data.系统._许曼君分居.阶段 = '已完成';
  data.户['201'].夫._居住模式 = '路线外住';
  assert.equal(phase.读取角色阶段体验(data, '201').配偶称谓, '丈夫');
  let html = await render(data);
  assert.match(text(html), /在外居住/u);
  assert.match(text(html), /法律婚姻尚未解除/u);
  assert.doesNotMatch(text(html), /此刻外出|她的前夫/u);
  data.系统._许曼君离婚.法律离婚已成立 = true;
  data.户['201'].夫._居住模式 = '待离婚交接';
  html = await render(data);
  assert.match(text(html), /她的前夫/u);
  assert.match(text(html), /等待离婚交接/u);
  assert.match(text(html), /结局仍待收束/u);
  assert.doesNotMatch(text(html), /已正式退居/u);
});

test('PLAY-006 普通六户保留真实作息与风险盘；没有线路事实不能误授予退出', async () => {
  const data = fresh();
  const before = clone(data);
  for (const door of config.门牌列表) {
    const html = await render(data, { door });
    const status = clock.丈夫在楼(data.户[door], door, data.系统._绝对时段);
    assert.ok(text(html).includes('此刻' + status), door);
    assert.match(html, /class="husband-risk"/u, door);
    assert.doesNotMatch(text(html), /已正式退居|旧随机查岗已停用|旧随机查岗暂停/u, door);
  }
  assert.deepEqual(data, before);
});

test('PLAY-006 承接保护只改变风险说明，不签发结局或清除数据', async () => {
  const data = fresh();
  data.系统._不再留门.道具已使用 = true;
  assert.equal(risk.读取丈夫线路风险阶段(data, '202'), '承接保护');
  const before = clone(data);
  const html = await render(data, { door: '202' });
  assert.match(text(html), /旧随机查岗暂停/u);
  assert.doesNotMatch(html, /class="husband-risk"/u);
  assert.match(html, /class="axis-num"[^>]*>71</u);
  assert.match(text(html), /已排期事件/u);
  assert.deepEqual(data, before);
});

test('PLAY-006 301关系转变与提前通知不是法律离婚，其他户风险不受污染', async () => {
  const data = fresh();
  data.系统._已完成特殊场景.push('角色路线:301:结局剧情');
  data.户['301'].夫._居住模式 = '提前通知';
  const html = await render(data, { door: '301' });
  assert.match(text(html), /她的丈夫/u);
  assert.match(text(html), /提前通知/u);
  assert.match(text(html), /旧随机查岗已停用/u);
  assert.doesNotMatch(text(html), /前夫/u);
  assert.match(await render(data, { door: '101' }), /class="husband-risk"/u);
});

test('PLAY-006 回档/换户/未就绪重新渲染只读当前props，不缓存旧退居或旧风险', async () => {
  const after = retired();
  assert.match(text(await render(after)), /已正式退居/u);
  const before = fresh();
  assert.match(await render(before), /class="husband-risk"/u);
  assert.doesNotMatch(text(await render(before)), /已正式退居|前夫/u);
  assert.doesNotMatch(text(await render(after, { door: '102' })), /已正式退居|前夫/u);
  assert.equal(text(await render(after, { ready: false })), '');
  assert.equal(text(await render(after, { door: null })), '');
  assert.deepEqual(Schema.parse(after), after);
});
