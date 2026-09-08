/* eslint-disable import-x/no-nodejs-modules -- Node-only Store/route regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');

// Only browser/variable-API I/O, unused database projection and UI ports are adapted.
// Store, Pinia, Vue deep watch, VueUse interval/watch and all queried route logic are real.
globalThis.window = Object.assign(new EventTarget(), { frameElement: null });
window.parent = window;
globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible', createElement: () => ({}) });
window.document = document;
const vue = require('vue');
const piniaAPI = require('pinia');
const vueuse = await import('@vueuse/core');
Object.assign(globalThis, vue, piniaAPI, { useIntervalFn: vueuse.useIntervalFn, watchIgnorable: vueuse.watchIgnorable });
globalThis._ = require('lodash');
globalThis.errorCatched = fn => fn;
let central;
let chatVars;
let writes;
let callbacks;
let databaseCalls;
globalThis.getVariables = option => _.cloneDeep(option?.type === 'message' ? central : chatVars);
globalThis.updateVariablesWith = async (fn, option) => {
  if (option?.type === 'message') {
    central = fn(_.cloneDeep(central));
    writes.push(_.cloneDeep(central));
  } else {
    chatVars = fn(_.cloneDeep(chatVars));
  }
};
globalThis.insertOrAssignVariables = patch => { chatVars = _.merge({}, chatVars, _.cloneDeep(patch)); };
globalThis.getLastMessageId = () => 5;
globalThis.SillyTavern = {
  chat: Array.from({ length: 6 }, () => ({ mes: 'Store query test', is_user: false })),
  getCurrentChatId: () => 'play048-test',
};
const database = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[database] = { id: database, filename: database, loaded: true, exports: {
  同步社交轨迹: (...args) => { databaseCalls.push(args); },
} };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { defineMvuDataStore } = require('../../src/util/mvu.ts');
const { useRoomActions } = require('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');

function fixture(mode = 'due') {
  const data = Schema.parse({ 户: { 301: 创建户节点(0) }, 现金: 1000, 系统: { _绝对时段: 6 } });
  data.户['301'].妻.当前阶段 = 5;
  if (mode === 'due') Object.assign(data.系统._安若妍不必停, { 阶段: '等待次日签收', 最早继续时段: 6 });
  if (mode === 'invalid-H7') Object.assign(data.系统._安若妍不必停, {
    阶段: '待H7决定', 卷宗状态: '301书房', 取件登记已完成: true,
    绑定亲密场次标识: 'missing-session', 前门未反锁: true, 卧室门半开: true,
  });
  return data;
}

function environment(t, mode = 'due', room = '301') {
  // Advance only the polling clock when explicitly requested; 500ms below is virtual, not wall time.
  t.mock.timers.enable({ apis: ['setInterval'] });
  central = { stat_data: fixture(mode) };
  chatVars = { _场景: { 房间id: room } };
  writes = [];
  callbacks = [];
  databaseCalls = [];
  const pinia = piniaAPI.createPinia();
  piniaAPI.setActivePinia(pinia);
  const store = defineMvuDataStore(Schema, { type: 'message', message_id: -1 })();
  const scope = vue.effectScope();
  const currentRoom = vue.ref(room);
  const busy = vue.ref(false);
  const api = scope.run(() => useRoomActions({
    data: vue.computed(() => store.data), 当前房间: currentRoom,
    时段: vue.ref('早上'), 绝对时段: vue.computed(() => store.data.系统._绝对时段),
    发送中: busy, 时间撤销可用: vue.ref(false), 已破门进入: vue.ref(false), 荣耀洞可用: vue.ref(false),
    房内有人在: () => true, 妻现位: () => '301', 进入: async () => false,
    同步场景自变量: () => undefined, 弹提示: () => undefined,
    发起时间推进: () => undefined, 发起时间撤销: () => undefined, 启动阶段线路剧情: () => undefined,
    事件: new Proxy({}, { get: (_target, key) => (...args) => callbacks.push({ key, args }) }),
  }));
  t.after(() => { scope.stop(); store.$dispose(); piniaAPI.disposePinia(pinia); });
  // Controlled concurrent backend change, before the real Store's 500ms polling callback.
  central.stat_data.现金 = 12345;
  central.stat_data.系统._已完成特殊场景.push('第二机位');
  return { store, api, currentRoom, busy };
}

async function settled() {
  await vue.nextTick();
  await vue.nextTick();
}

for (const room of ['301', '大堂', '信箱区', '管理员室', '公寓外部', '洗手间']) {
  for (const mode of ['due', 'invalid-H7', 'ordinary']) {
    for (const pull of [false, true]) {
      test(`真实Store ${room}/${mode}/${pull ? '先pull' : '旧缓存'}：只查询不写回、不丢后台新值`, async t => {
        const { store, api } = environment(t, mode, room);
        if (pull) store.pull();
        const cached = _.cloneDeep(store.data);
        const authority = _.cloneDeep(central);
        const chat = _.cloneDeep(chatVars);
        const first = api.房间动作(room);
        const second = api.房间动作(room);
        await settled();
        assert.deepEqual(central, authority, '只读查询不能整表覆盖后台已提交值');
        assert.deepEqual(_.cloneDeep(store.data), cached, '查询不能修改响应式Store，包括先pull后的Store');
        assert.deepEqual(chatVars, chat);
        assert.equal(writes.length, 0);
        assert.equal(callbacks.length, 0);
        assert.equal(databaseCalls.length, 0);
        assert.deepEqual(second.map(a => a.文案), first.map(a => a.文案));
        if (mode === 'due' && ['大堂', '信箱区'].includes(room)) {
          assert.ok(first.some(a => a.文案 === '签收301密封卷宗箱' && !a.禁用), '到期按钮仍可预览');
        }
      });
    }
  }
}

for (const room of ['301', '大堂', '信箱区', '公寓外部', '洗手间']) {
  for (const mode of ['due', 'invalid-H7', 'ordinary']) {
    test(`远处查询对照 ${room}/${mode}：不触发当前房间写回或业务`, async t => {
      const { store, api } = environment(t, mode, '管理员室');
      const cached = _.cloneDeep(store.data);
      const authority = _.cloneDeep(central);
      api.房间动作(room);
      await settled();
      assert.deepEqual(central, authority);
      assert.deepEqual(_.cloneDeep(store.data), cached);
      assert.equal(writes.length, 0);
      assert.equal(callbacks.length, 0);
    });
  }
}

function freeze(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child);
  return Object.freeze(value);
}

for (const mode of ['due', 'invalid-H7', 'ordinary']) {
  test(`共享提供方 ${mode}：深冻结输入仍可查询，动作与显式同步后相同`, () => {
    const data = fixture(mode);
    const synchronized = _.cloneDeep(data);
    route.同步安若妍不必停时间节点(synchronized);
    freeze(data);
    for (const room of ['301', '大堂', '信箱区', '管理员室', '公寓外部', '洗手间']) {
      assert.deepEqual(route.安若妍不必停地点动作(data, room), route.安若妍不必停地点动作(synchronized, room));
    }
  });
}

test('真实Store的500ms拉取仍更新画面，但不因查询把业务恢复提前写入', async t => {
  const { store, api } = environment(t, 'due', '大堂');
  assert.equal(store.data.现金, 1000);
  t.mock.timers.tick(500);
  await settled();
  assert.equal(store.data.现金, 12345);
  assert.ok(store.data.系统._已完成特殊场景.includes('第二机位'));
  api.房间动作('大堂');
  await settled();
  assert.equal(store.data.系统._安若妍不必停.阶段, '等待次日签收');
  assert.equal(writes.length, 0);
});

test('Store合法主动编辑仍保留深监听写回，不能靠禁用Store修查询竞争', async t => {
  const { store } = environment(t, 'ordinary');
  store.pull();
  await settled();
  store.data.现金 += 1;
  await settled();
  assert.equal(central.stat_data.现金, 12346);
  assert.ok(central.stat_data.系统._已完成特殊场景.includes('第二机位'));
  assert.equal(writes.length, 1);
});

test('到期预览不签收；真实动作在最新数据上同步并签收一次，重复不发物品', async t => {
  const { api } = environment(t, 'due', '大堂');
  const button = api.房间动作('大堂').find(a => a.文案 === '签收301密封卷宗箱');
  assert.ok(button);
  await settled();
  assert.equal(callbacks.length, 0);
  assert.equal(central.stat_data.系统._安若妍不必停.阶段, '等待次日签收');
  button.做();
  assert.deepEqual(callbacks, [{ key: '安若妍不必停动作', args: ['签收301密封卷宗箱'] }]);
  // The host action transaction's authoritative input is adapted; the executed business core is real.
  const result = route.执行安若妍不必停地点动作(central.stat_data, callbacks[0].args[0], '大堂', 6);
  assert.equal(result.成功, true);
  assert.equal(central.stat_data.现金, 12345);
  assert.equal(central.stat_data.系统._安若妍不必停.阶段, '待登记取件');
  assert.ok(central.stat_data.系统._已完成特殊场景.includes('第二机位'));
  assert.equal(central.stat_data.背包.filter(id => id === route.安若妍卷宗箱ID).length, 1);
  const after = _.cloneDeep(central.stat_data);
  assert.equal(route.执行安若妍不必停地点动作(central.stat_data, callbacks[0].args[0], '大堂', 7).成功, false);
  assert.deepEqual(central.stat_data, after);
});

test('预览后切房间或进入忙态，旧按钮不派发动作', async t => {
  const { api, currentRoom, busy } = environment(t, 'due', '大堂');
  const button = api.房间动作('大堂').find(a => a.文案 === '签收301密封卷宗箱');
  busy.value = true;
  button.做();
  busy.value = false;
  currentRoom.value = '管理员室';
  button.做();
  await settled();
  assert.equal(callbacks.length, 0);
  assert.equal(writes.length, 0);
  assert.equal(central.stat_data.现金, 12345);
});

test('失效H7显式恢复仍重排，保留卷宗登记与后台新值，重复恢复幂等', () => {
  const data = fixture('invalid-H7');
  data.现金 = 12345;
  data.系统._已完成特殊场景.push('第二机位');
  const prior = _.cloneDeep(data);
  route.安若妍不必停地点动作(data, '301');
  assert.deepEqual(data, prior);
  assert.equal(route.恢复安若妍不必停失效亲密检查点(data), true);
  assert.equal(data.系统._安若妍不必停.阶段, '等待预约夜');
  assert.equal(data.系统._安若妍不必停.卷宗状态, '301书房');
  assert.equal(data.系统._安若妍不必停.取件登记已完成, true);
  assert.ok(data.系统._安若妍不必停.预约夜绝对时段 >= prior.系统._绝对时段 + 6);
  assert.equal(data.户['301'].夫._居住模式, '提前通知');
  assert.equal(data.现金, 12345);
  assert.ok(data.系统._已完成特殊场景.includes('第二机位'));
  const recovered = _.cloneDeep(data);
  assert.equal(route.恢复安若妍不必停失效亲密检查点(data), false);
  assert.deepEqual(data, recovered);
});

test('刷新或切聊天换入不同来源Store数据后，查询只预览当前来源且不写旧缓存', async t => {
  const { store, api } = environment(t, 'due', '大堂');
  api.房间动作('大堂');
  await settled();
  central = { stat_data: fixture('ordinary') };
  central.stat_data.现金 = 7777;
  store.pull();
  await settled();
  const authority = _.cloneDeep(central);
  assert.equal(api.房间动作('大堂').some(a => a.文案 === '签收301密封卷宗箱'), false);
  await settled();
  assert.deepEqual(central, authority);
  assert.equal(writes.length, 0);
});
