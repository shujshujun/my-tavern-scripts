/* eslint-disable import-x/no-nodejs-modules -- Node-only client/domain regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const database = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[database] = {
  id: database,
  filename: database,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const { ref } = require('vue');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const 不再留门 = require('../../src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');
const 场景剧情 = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const { useRoomActions } = require('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts');
const 离婚 = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const App源码 = read('src/人妻公寓/界面/客户端/App.vue');
const 进展源码 = read('src/人妻公寓/界面/客户端/components/不再留门进展.vue');

const 场景阶段 = { A5: '决定中', A7: '开录中', A9: '封存中' };

function 不再留门前台决定(scene = 'A5') {
  const data = Schema.parse({ 户: { 202: 创建户节点(0) } });
  data.户['202'].妻.当前阶段 = 5;
  data.户['202'].妻.阶段性癖 = '独占印记';
  const safe = 不再留门.不再留门安全窗口(data, 0);
  assert.ok(safe, '测试夹具必须找到何俊生外出且周小满在202的安全时段');
  data.系统._绝对时段 = safe.起;
  const route = data.系统._不再留门;
  Object.assign(route, {
    实例: `nmd-self-unlock-${scene}`,
    来源时间线: 'chat-self-unlock@0',
    阶段: 场景阶段[scene],
    道具已使用: true,
    动机已表达: true,
    录制提议: true,
    许可: scene === 'A5' ? '未确认' : '同意本次',
    当前场景: scene,
    当前拍: scene === 'A5' ? 3 : 2,
    修订: 17,
  });
  const event = `【不再留门提交:${route.实例}:${route.修订}:${route.当前场景}:${route.当前拍}:${data.系统._绝对时段}】【场景剧情连续锁场】`;
  Object.assign(data.系统._场景剧情事务, {
    id: `active-${scene}`,
    标题: '不再留门前台决定',
    目标场景: '202',
    行动: '等待玩家决定',
    内容: event,
    触发绝对时段: data.系统._绝对时段,
    触发楼层: 30,
    请求世代: 1,
    状态: '活动',
  });
  return { data, event };
}

for (const scene of ['A5', 'A7', 'A9']) {
  test(`${scene} 当前明确决定只允许本线精确前台票穿过自己的场景锁`, () => {
    const { data } = 不再留门前台决定(scene);
    assert.equal(不再留门.不再留门控制动作可穿过自身剧情锁(data, '确认当前决定', '202'), true);
    assert.equal(不再留门.不再留门控制动作可穿过自身剧情锁(data, '暂缓', '202'), true);
    assert.equal(
      不再留门.不再留门控制动作可穿过自身剧情锁(data, '撤回许可', '202'),
      scene !== 'A5',
    );
    assert.equal(不再留门.不再留门控制动作可穿过自身剧情锁(data, '听她决定', '202'), false);
    assert.equal(不再留门.不再留门控制动作可穿过自身剧情锁(data, '确认当前决定', '302'), false);

    const labels = 不再留门.不再留门地点动作(data, '202').map(item => item.id);
    assert.ok(labels.includes('确认当前决定'));
    assert.ok(labels.includes('暂缓'));

    data.系统._不再留门.修订 += 1;
    assert.equal(不再留门.不再留门控制动作可穿过自身剧情锁(data, '确认当前决定', '202'), false);
    const staleLabels = 不再留门.不再留门地点动作(data, '202').map(item => item.id);
    assert.ok(!staleLabels.includes('确认当前决定'));
    assert.ok(!staleLabels.includes('暂缓'));
  });
}

test('等待队首票同样可认领，队尾票和其他路线前台不能借白名单穿锁', () => {
  const queued = 不再留门前台决定('A5');
  queued.data.系统._场景剧情事务.id = '';
  queued.data.系统._场景剧情事务.内容 = '';
  queued.data.系统._待发送事件 = '';
  场景剧情.追加等待场景剧情(queued.data, queued.event, '202', '不再留门决定');
  assert.equal(不再留门.不再留门控制动作可穿过自身剧情锁(queued.data, '确认当前决定', '202'), true);

  const tail = 不再留门前台决定('A5');
  tail.data.系统._场景剧情事务.id = '';
  tail.data.系统._场景剧情事务.内容 = '';
  tail.data.系统._待发送事件 = '';
  场景剧情.追加等待场景剧情(tail.data, '【其他路线前台】【场景剧情连续锁场】', '202', '其他路线');
  场景剧情.追加等待场景剧情(tail.data, tail.event, '202', '不再留门决定');
  assert.equal(不再留门.不再留门控制动作可穿过自身剧情锁(tail.data, '确认当前决定', '202'), false);
  assert.ok(!不再留门.不再留门地点动作(tail.data, '202').some(item => item.id === '确认当前决定'));
});

test('真实房间动作组合锁下仅由注入的本线白名单放行，旧票和普通组合锁仍拒绝', () => {
  const fixture = 不再留门前台决定('A5');
  const data = ref(fixture.data);
  const current = ref('202');
  const combinedLock = ref(true);
  const allowOwnLock = ref(true);
  const calls = [];
  const events = new Proxy(
    { 不再留门动作: action => calls.push(action) },
    { get: (target, key) => target[key] ?? (() => undefined) },
  );
  const ui = useRoomActions({
    data,
    当前房间: current,
    时段: ref('晚上'),
    绝对时段: ref(data.value.系统._绝对时段),
    发送中: combinedLock,
    允许不再留门动作穿锁: action =>
      allowOwnLock.value && 不再留门.不再留门控制动作可穿过自身剧情锁(data.value, action, current.value ?? ''),
    时间撤销可用: ref(false),
    已破门进入: ref(false),
    荣耀洞可用: ref(false),
    房内有人在: () => true,
    妻现位: () => '202',
    进入: async () => false,
    同步场景自变量: () => undefined,
    弹提示: () => undefined,
    发起时间推进: () => undefined,
    发起时间撤销: () => undefined,
    启动阶段线路剧情: () => undefined,
    事件: events,
  });

  const actions = ui.房间动作('202');
  const confirm = actions.find(item => item.文案 === '明确回应她的决定');
  const pause = actions.find(item => item.文案 === '暂缓，保留当前进度');
  assert.ok(confirm && pause);

  confirm.做();
  assert.deepEqual(calls, ['确认当前决定'], '组合锁来自自身剧情时，合法确认必须抵达 App 事件回调');

  allowOwnLock.value = false;
  pause.做();
  assert.deepEqual(calls, ['确认当前决定'], '未获白名单时组合锁仍保持阻断');

  combinedLock.value = false;
  pause.做();
  assert.deepEqual(calls, ['确认当前决定', '暂缓'], '没有场景锁的普通可执行路径保持原样');

  combinedLock.value = true;
  allowOwnLock.value = true;
  data.value.系统._不再留门.修订 += 1;
  confirm.做();
  assert.deepEqual(calls, ['确认当前决定', '暂缓'], '旧修订按钮不得借穿锁回调复活');
});

test('App 同时修复事务门与抽屉可见性，仍保留双重继承最终钥匙例外', () => {
  assert.match(App源码, /不再留门控制动作可穿过自身剧情锁/);
  assert.match(
    App源码,
    /function 不再留门动作允许穿锁[\s\S]*?发送中\.value[\s\S]*?界面事务提交中\.value[\s\S]*?场景移动中[\s\S]*?!普通场景剧情功能锁\.value[\s\S]*?录像带前置中\.value[\s\S]*?录像带V4活动\.value[\s\S]*?母亲视频终幕已接通\.value[\s\S]*?双重继承最终收束锁\.value/,
    'App 白名单必须只绕过本线普通场景锁，不能绕过真实发送、重复提交、移动或其他专属硬锁',
  );
  assert.match(
    App源码,
    /function 提交界面事务[\s\S]*?MVU操作进行中\(\)[\s\S]*?另一项操作正在保存/,
    '穿过自身剧情锁后仍必须由共享事务门拒绝 MVU 保存冲突并给出提示',
  );
  assert.match(
    App源码,
    /允许不再留门动作穿锁: 不再留门动作允许穿锁/,
    '房内动作入口必须获得同一精确白名单',
  );
  assert.match(
    App源码,
    /function 请求不再留门动作[\s\S]*?const 允许穿锁 = 不再留门动作允许穿锁\(动作\);[\s\S]*?提交界面事务\([\s\S]*?允许穿锁\)/,
    '独立进展按钮必须把精确许可交给共享事务门',
  );
  assert.match(App源码, /:sending="不再留门控制提交中"/);
  assert.match(App源码, /:actions="抽屉普通房间动作"/);
  assert.match(
    App源码,
    /const 抽屉普通房间动作 = computed\(\(\) =>[\s\S]*?场景剧情锁定\.value && !双重继承最终收束锁\.value \? \[\] : 普通房间动作\.value/,
  );
  assert.match(
    App源码,
    /const 房内操作抑制 = computed\([\s\S]*?场景剧情锁定\.value && !双重继承最终收束锁\.value/,
  );
  assert.match(进展源码, /不再留门控制动作可穿过自身剧情锁\(props\.data, a\.id, props\.room \?\? ''\)/);
});

function 完成分居(data) {
  const route = data.系统._许曼君分居;
  Object.assign(route, {
    方案版本: 2,
    阶段: '已完成',
    工资卡状态: '已归还赵国强',
    钥匙位置: '管理员室201钥匙格',
    钥匙用途: '待离婚交接',
    丈夫已知玩家关系: true,
    丈夫已选择外住: true,
    生活用品已取完: true,
    许曼君已拒绝恢复共同生活: true,
    双方同意进入办理: true,
    玩家最终关系选择: '继续关系',
  });
  data.户['201'].夫._居住模式 = '待离婚交接';
}

function 离婚开场数据() {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 现金: 5000, 系统: { _绝对时段: 3 } });
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].妻.好感值 = 80;
  data.户['201'].妻.堕落值 = 90;
  data.玩家资源.体力.当前值 = 10;
  完成分居(data);
  const bought = 离婚.购买许曼君离婚(data, 1500);
  assert.equal(bought.成功, true, bought.提示);
  return data;
}

test('许曼君《离婚》自己的活动票或等待票存在时不再重复提供起场死按钮', () => {
  const data = 离婚开场数据();
  assert.ok(离婚.许曼君离婚地点动作(data, '201').some(item => item.id === '使用红色封存盒'));
  const start = 离婚.执行许曼君离婚地点动作(data, '使用红色封存盒', '201', 20);
  assert.equal(start.成功, true, start.提示);
  assert.match(start.事件, /【许曼君离婚提交:/);

  Object.assign(data.系统._场景剧情事务, {
    id: 'divorce-active',
    标题: '许曼君离婚',
    目标场景: '201',
    内容: start.事件,
  });
  assert.deepEqual(离婚.许曼君离婚地点动作(data, '201'), []);
  assert.equal(离婚.执行许曼君离婚地点动作(data, '使用红色封存盒', '201', 21).成功, false);

  data.系统._场景剧情事务.id = '';
  data.系统._场景剧情事务.内容 = '';
  data.系统._待发送事件 = start.事件;
  assert.deepEqual(离婚.许曼君离婚地点动作(data, '201'), []);

  data.系统._待发送事件 = '';
  assert.ok(离婚.许曼君离婚地点动作(data, '201').some(item => item.id === '使用红色封存盒'));
});
