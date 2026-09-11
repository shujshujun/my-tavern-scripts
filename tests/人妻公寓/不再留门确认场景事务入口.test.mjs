/* eslint-disable import-x/no-nodejs-modules -- Full listener/scene transaction regression. */
import assert from 'node:assert/strict';
import test from 'node:test';

import { host, clone, assertReleased, ticks } from './helpers/离婚主入口环境.mjs';
import { mountActualHostListeners } from './helpers/完整回合补验环境_PLAY002_022.mjs';

const game = 'src/人妻公寓/脚本/游戏逻辑/';

function 找到动作窗口(route, data, action, place, from = data.系统._绝对时段) {
  for (let t = from; t < from + 84; t++) {
    data.系统._绝对时段 = t;
    if (!route.不再留门动作阻断(data, action, place)) return;
  }
  assert.fail(`没有找到${action}窗口：${route.不再留门动作阻断(data, action, place)}`);
}

function 准备A5最终决定(e) {
  const schema = e.load('src/人妻公寓/schema.ts');
  const route = e.load(`${game}不再留门系统.ts`);
  const scene = e.load(`${game}场景剧情事务.ts`);
  const contract = e.load('src/人妻公寓/不再留门契约.ts');
  const data = schema.Schema.parse({
    户: { 202: schema.创建户节点(0), 102: schema.创建户节点(0) },
    现金: 12000,
  });
  data.系统._数据版本 = schema.当前MVU数据版本;
  data.系统._序章完成 = true;
  data.户['202'].妻.当前阶段 = 5;
  data.户['202'].妻.阶段性癖 = '独占印记';
  data.玩家资源.体力.当前值 = 5;

  let floor = 1;
  const act = (action, place = '202') => {
    const result = route.执行不再留门动作(data, action, place, floor++, 'play-nmd-confirm@0', 'nmd-confirm-entry');
    assert.equal(result.成功, true, result.提示);
    return result;
  };
  const beat = (event, place = '202', reply = '我听她把这一拍说完。') => {
    const result = route.提交不再留门剧情事件(data, event, place, floor++, reply);
    assert.equal(result?.成功, true, result?.提示);
    return result;
  };
  const finish = (prepared, place = '202') => {
    let event = prepared.事件;
    let result = prepared;
    while (event) {
      result = beat(event, place);
      event = result.后续剧情?.事件;
    }
    return result;
  };

  const bought = route.购买不再留门物件(data, '不再留门', contract.不再留门价格.剧情道具);
  assert.equal(bought.成功, true, bought.提示);
  找到动作窗口(route, data, '使用道具', '202');
  finish(act('使用道具'));
  找到动作窗口(route, data, '观察街对面', '公寓外部');
  finish(act('观察街对面', '公寓外部'), '公寓外部');
  act('拍照', '公寓外部');
  找到动作窗口(route, data, '出示照片', '202');
  finish(act('出示照片'));
  act('交付副本');

  const decision = act('听她决定');
  const afterFirst = beat(decision.事件);
  const afterSecond = beat(afterFirst.后续剧情.事件);
  const target = afterSecond.后续剧情;
  assert.ok(target?.事件, '夹具必须停在A5第3/3拍');
  assert.equal(route.解析不再留门剧情事件(target.事件)?.场景, 'A5');
  assert.equal(route.解析不再留门剧情事件(target.事件)?.拍, 3);
  scene.追加等待场景剧情(data, target.事件, target.地点, target.标题, true);
  assert.equal(route.不再留门动作阻断(data, '确认当前决定', '202'), '');
  return { data, scene };
}

function 挂载确认环境({ 活动行动 = '', 改写数据 = () => undefined } = {}) {
  const e = host();
  const { data, scene } = 准备A5最终决定(e);
  if (活动行动) {
    const activated = scene.激活队首场景剧情(data, '202', 活动行动, 100);
    assert.equal(activated.成功, true, activated.提示);
    assert.equal(scene.标记场景剧情待重试(data, activated.事务.id, activated.事务.请求世代), true);
  }
  改写数据(data);
  e.id = 'play-nmd-confirm';
  e.vars = { ...e.vars, _场景: { 房间id: '202' } };
  e.st.chat.at(-1).variables = [{ stat_data: clone(data) }];
  e.provider = () =>
    '周小满听完你明确同意后，和你谈清这次录制只供约定的人观看、不公开传播，并约在之后安全独处时再开始。设备仍未启动。';
  e.load(`${game}手机系统.ts`).刷新红点 = () => undefined;
  mountActualHostListeners(e);
  return { e, scene, before: clone(data) };
}

async function 点击确认并等待(e) {
  await e.ctx.eventEmit('人妻公寓:不再留门动作', '确认当前决定');
  for (let i = 0; i < 40 && e.requests.length === 0 && !e.trace.some(item => item.name === '人妻公寓:回合失败'); i++) {
    await ticks(1);
  }
}

function 回合失败文本(e) {
  return e.trace
    .filter(item => item.op === 'event' && item.name === '人妻公寓:回合失败')
    .flatMap(item => item.args)
    .join('\n');
}

function 断言A5已确认(e, scene) {
  const saved = e.read();
  assert.equal(saved.系统._不再留门.许可, '同意本次');
  assert.equal(saved.系统._不再留门.阶段, '待准备');
  assert.equal(saved.系统._不再留门.当前场景, '');
  assert.equal(saved.系统._不再留门.当前拍, 0);
  assert.equal(scene.读取队首场景剧情(saved.系统._待发送事件), null);
  assert.equal(saved.系统._场景剧情事务.id, '');
  assertReleased(e);
}

test('《不再留门》确认按钮通过场景事务激活A5第3/3拍，而不是作为普通行动被回合引擎拒绝', async () => {
  const { e, scene } = 挂载确认环境();
  await 点击确认并等待(e);

  const failures = 回合失败文本(e);
  assert.equal(e.requests.length, 1, failures || e.warnings.join('\n'));
  assert.doesNotMatch(failures, /正在等待设计场景|不能用普通行动触发/u);
  断言A5已确认(e, scene);
});

test('A5活动票上一次回应无效后，确认按钮用标准明确回应重试同一事务', async () => {
  const { e, scene, before } = 挂载确认环境({ 活动行动: '我还没想好，之后再说。' });
  assert.equal(before.系统._场景剧情事务.状态, '待重试');
  assert.equal(before.系统._场景剧情事务.行动, '我还没想好，之后再说。');

  await 点击确认并等待(e);

  const failures = 回合失败文本(e);
  assert.equal(e.requests.length, 1, failures || e.warnings.join('\n'));
  assert.doesNotMatch(failures, /这一拍需要你明确回应|正在等待设计场景/u);
  断言A5已确认(e, scene);
});

test('旧修订确认事件到达后端时失败关闭，不激活旧票或请求模型', async () => {
  const { e, before } = 挂载确认环境({
    改写数据: data => {
      data.系统._不再留门.修订 += 1;
    },
  });

  await 点击确认并等待(e);

  assert.equal(e.requests.length, 0);
  assert.deepEqual(e.read(), before);
  const hints = e.trace
    .filter(item => item.op === 'event' && item.name === '人妻公寓:提示')
    .flatMap(item => item.args)
    .join('\n');
  assert.match(hints, /剧情票已经变化|重新查看线路进展/u);
  assertReleased(e);
});
