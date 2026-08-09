/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const { ref } = require('vue');
const { Schema } = require('../../src/人妻公寓/schema.ts');
const { useRoomActions } = require('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts');

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 游戏入口源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

function 建环境() {
  const data = ref(Schema.parse({}));
  data.value.系统._绝对时段 = 12;
  data.value.系统._管理考核.活跃任务 = [
    {
      id: 'remote-duty',
      模板: '大堂地面清洁',
      类型: '公共',
      级别: '日常',
      地点: '大堂',
      门牌: '',
      创建时段: 10,
      截止时段: 18,
      逾期已扣: false,
    },
  ];
  const 当前房间 = ref('管理员室');
  const 发送中 = ref(false);
  const 已触发 = [];
  const 空函数 = () => {};
  const api = useRoomActions({
    data,
    当前房间,
    时段: ref('下午'),
    绝对时段: ref(12),
    发送中,
    时间撤销可用: ref(false),
    已破门进入: ref(false),
    荣耀洞可用: ref(false),
    房内有人在: () => false,
    妻现位: () => '公寓外部',
    进入: async () => false,
    同步场景自变量: 空函数,
    弹提示: 空函数,
    发起时间推进: 空函数,
    发起时间撤销: 空函数,
    启动阶段线路剧情: 空函数,
    事件: {
      对饮: 空函数,
      丈夫礼物: 空函数,
      催租: 空函数,
      空房偷窃: 空函数,
      打听: 空函数,
      荣耀洞: 空函数,
      捡金币: 空函数,
      处理管理任务: 载荷 => 已触发.push(载荷),
    },
  });
  return { api, 当前房间, 已触发 };
}

test('远处房卡只显示导航角标，不生成楼务处理瓷砖；旧瓷砖换房后也失效', async () => {
  const { api, 当前房间, 已触发 } = 建环境();
  const 是楼务 = 动作 => String(动作.类 ?? '').includes('management-task');

  assert.equal(api.房间动作('大堂').filter(是楼务).length, 0);

  当前房间.value = '大堂';
  const 到场瓷砖 = api.房间动作('大堂').filter(是楼务);
  assert.equal(到场瓷砖.length, 2);

  当前房间.value = '管理员室';
  await 到场瓷砖[0].做();
  assert.deepEqual(已触发, [], '已打开的旧房卡在位置变化后不得继续发送楼务事件');

  当前房间.value = '大堂';
  await api.房间动作('大堂').filter(是楼务)[0].做();
  assert.equal(已触发.length, 1);
  assert.equal(已触发[0].地点, '大堂');
});

test('进入和离开只能在场景变量写入成功后提交 UI 房间，且移动期间单飞', () => {
  const 进入开始 = App源码.indexOf('async function 进入(');
  const 离开开始 = App源码.indexOf('async function 离开房间()', 进入开始);
  const 同步开始 = App源码.indexOf('function 同步场景自变量()', 离开开始);
  const 进入段 = App源码.slice(进入开始, 离开开始);
  const 离开段 = App源码.slice(离开开始, 同步开始);

  assert.ok(进入段.indexOf('await 写场景(') < 进入段.indexOf('当前房间.value = 房间id'), '进入必须先持久化再公开目标房间');
  assert.ok(离开段.indexOf('await 写场景(null)') < 离开段.indexOf('当前房间.value = null'), '离开必须先持久化再公开楼道状态');
  assert.match(App源码, /let 场景移动中 = false;/);
  assert.match(进入段, /if \(场景移动中\) return false;/);
  assert.match(离开段, /if \(场景移动中\) return;/);
});

test('脚本入口启动前和最终结算前都以 chat _场景复核任务地点', () => {
  const 开始 = 游戏入口源码.indexOf("eventOn('人妻公寓:处理管理任务'");
  const 结束 = 游戏入口源码.indexOf("eventOn('人妻公寓:空房偷窃'", 开始);
  const 处理段 = 游戏入口源码.slice(开始, 结束);

  assert.match(处理段, /const 当前地点 = 读场景\(\)\.房间id \?\? '';/);
  assert.ok(处理段.indexOf('const 当前地点 = 读场景()') < 处理段.indexOf('预检管理任务('));
  assert.match(
    处理段,
    /成功结算: newData => \{[\s\S]*?if \(\(读场景\(\)\.房间id \?\? ''\) !== 当前地点\) throw new Error\('楼务结算时地点已经变化'\);[\s\S]*?结算管理任务/,
  );
});
