/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
globalThis.getVariables = () => ({ _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null });

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 推进时段, 妻位置推算 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 执行等待生产事务 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
const { 应使用怀孕CG, 怀孕认知提示 } = require('../../src/人妻公寓/脚本/游戏逻辑/怀孕系统.ts');
const { 结算成功现场楼 } = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const {
  产后住院时段数,
  孕期时段数,
  初始化本胎生产账,
  开始已读孕期,
  列出产后通知,
  列出住院微信节点,
  读取生产事件快照,
  推进生产时钟,
  确认预产微信已读,
  医院已解锁,
  生产地点动作,
  提交产前看望,
  提交留下陪产,
  结算实际生产,
  提交生产叙事完成,
  提交产后看望,
  已达生产上限,
  房间生产背景键,
} = require('../../src/人妻公寓/脚本/游戏逻辑/生产系统.ts');

function 建数据(门牌们 = ['101'], 绝对时段 = 10) {
  const 户 = {};
  for (const 门牌 of 门牌们) {
    const 节点 = 创建户节点(0);
    节点.妻.当前阶段 = 5;
    户[门牌] = 节点;
  }
  const data = Schema.parse({ 户, 系统: { _绝对时段: 绝对时段 } });
  data.系统._家庭计划.阶段 = '已完成';
  return data;
}

function 准备待读孕情(data, 门牌, 标识) {
  const 妻 = data.户[门牌].妻;
  Object.assign(妻._怀孕, {
    状态: '待告知',
    受孕场次标识: 标识,
    受孕绝对时段: data.系统._绝对时段 - 42,
  });
  assert.equal(初始化本胎生产账(data, 门牌), true);
}

function 到预产(data, 门牌, 标识) {
  准备待读孕情(data, 门牌, 标识);
  assert.equal(开始已读孕期(data, 门牌, 标识), true);
  const 起点 = data.系统._绝对时段;
  assert.equal(data.户[门牌].妻._生产.预产绝对时段, 起点 + 孕期时段数);
  推进时段(data, 孕期时段数);
  assert.deepEqual(推进生产时钟(data).到达预产, [门牌]);
  const 凭据 = { 门牌, 场次标识: 标识, 胎次: data.户[门牌].妻._生产.本胎序号 };
  assert.deepEqual(确认预产微信已读(data, [凭据]), [门牌]);
  return 凭据;
}

test('孕期只从确认微信真实已读起算126时段，预产未读时位置先锁医院但地图不解锁', () => {
  const data = 建数据(['101'], 20);
  准备待读孕情(data, '101', 'read-anchor');
  推进时段(data, 30);
  assert.equal(data.户['101'].妻._生产.状态, '无', '消息未读不能偷偷开始孕期');
  assert.equal(开始已读孕期(data, '101', 'read-anchor'), true);
  assert.equal(data.户['101'].妻._生产.确认已读绝对时段, 50);
  assert.equal(data.户['101'].妻._生产.预产绝对时段, 176);
  推进时段(data, 126);
  推进生产时钟(data);
  assert.equal(data.户['101'].妻._生产.状态, '待产通知');
  assert.equal(妻位置推算('101', 176, data.户['101']), '医院');
  assert.equal(医院已解锁(data), false);
  assert.equal(应使用怀孕CG(data, '101'), true, '实际生产前仍是孕肚CG');
});

test('看望与陪产为独立瓷砖；生产硬结算只推进/追加一次，实际生产后立即恢复普通CG', () => {
  const data = 建数据(['101', '102'], 10);
  到预产(data, '101', 'accompany-1');
  assert.equal(医院已解锁(data), true);
  assert.deepEqual(
    生产地点动作(data, '医院').map(x => x.id),
    ['产前看望', '留下陪产'],
  );
  assert.equal(提交产前看望(data, '101').成功, true);
  assert.deepEqual(
    生产地点动作(data, '医院').map(x => x.id),
    ['留下陪产'],
  );
  assert.equal(提交留下陪产(data, '101').成功, true);
  assert.deepEqual(
    生产地点动作(data, '医院').map(x => x.id),
    ['等待生产'],
  );

  const 生产前 = data.系统._绝对时段;
  推进时段(data, 2);
  const 首次 = 结算实际生产(data, '101', '陪产', data.系统._绝对时段);
  assert.equal(首次.变动, true);
  assert.equal(data.系统._绝对时段, 生产前 + 2);
  assert.equal(data.系统._家庭文档.孩子.length, 1);
  assert.equal(data.户['101'].妻._怀孕.状态, '未孕');
  assert.equal(应使用怀孕CG(data, '101'), false);
  assert.equal(data.户['101'].妻._生产.状态, '住院中');
  assert.equal(data.户['101'].妻._生产.住院结束绝对时段, data.系统._绝对时段 + 产后住院时段数);

  const 重复 = 结算实际生产(data, '101', '陪产', data.系统._绝对时段 + 2);
  assert.equal(重复.变动, undefined);
  assert.equal(data.系统._家庭文档.孩子.length, 1, '重试叙事不能重复生孩子');
  assert.equal(data.系统._绝对时段, 生产前 + 2, '重试叙事不能再次推进两时段');
  assert.deepEqual(
    生产地点动作(data, '医院').map(x => x.id),
    ['重试生产叙事', '产后看望'],
  );
  assert.equal(提交生产叙事完成(data, '101').成功, true);
  assert.equal(提交产后看望(data, '101').成功, true);
  assert.equal(data.系统._家庭文档.孩子[0].玩家产后看望, true);
});

test('等待生产事务以预期时段和医院地点防双击，成功后只推进2时段且重复请求不再结算', () => {
  const data = 建数据(['101'], 12);
  到预产(data, '101', 'atomic-wait');
  assert.equal(提交留下陪产(data, '101').成功, true);
  const 起点 = data.系统._绝对时段;
  const 初始快照 = structuredClone(data);

  const 陈旧 = 执行等待生产事务(data, {
    门牌: '101',
    预期绝对时段: 起点 - 1,
    当前消息楼: 8,
    当前地点: '医院',
  });
  assert.equal(陈旧.成功, false);
  assert.deepEqual(data, 初始快照, '陈旧双击不得留下任何部分写入');

  const 错地 = 执行等待生产事务(data, {
    门牌: '101',
    预期绝对时段: 起点,
    当前消息楼: 8,
    当前地点: '101',
  });
  assert.equal(错地.成功, false);
  assert.deepEqual(data, 初始快照, '离开医院不得推进时间或追加孩子');

  const 首次 = 执行等待生产事务(data, {
    门牌: '101',
    预期绝对时段: 起点,
    当前消息楼: 8,
    当前地点: '医院',
  });
  assert.equal(首次.成功, true);
  assert.equal(首次.推进时段数, 2);
  assert.equal(data.系统._绝对时段, 起点 + 2);
  assert.equal(data.系统._家庭文档.孩子.length, 1);
  const 成功快照 = structuredClone(data);

  const 重复 = 执行等待生产事务(data, {
    门牌: '101',
    预期绝对时段: 起点,
    当前消息楼: 8,
    当前地点: '医院',
  });
  assert.equal(重复.成功, false);
  assert.deepEqual(data, 成功快照, '重复票据不得再次推进2时段或追加孩子');
});

test('部分旧档已有孩子但仍停在陪产中时，以硬事实零时段恢复完整生产账', () => {
  const data = 建数据(['101'], 80);
  到预产(data, '101', 'partial-birth');
  assert.equal(提交留下陪产(data, '101').成功, true);
  const 起点 = data.系统._绝对时段;
  data.系统._家庭文档.孩子.push({
    id: '生产:101:1:partial-birth',
    母亲门牌: '101',
    胎次: 1,
    性别: '女',
    出生绝对时段: 起点,
    结果: '陪产',
    玩家产后看望: false,
    获知生产路径: '陪产',
    叙事最小年龄: 0,
    年龄阶段: '新生儿',
    出生场次标识: 'partial-birth',
  });

  const 结果 = 执行等待生产事务(data, {
    门牌: '101',
    预期绝对时段: 起点,
    当前消息楼: 8,
    当前地点: '医院',
  });

  assert.equal(结果.成功, true);
  assert.equal(结果.推进时段数, 0, '已经存在的生产硬事实不得再次推进2时段');
  assert.equal(data.系统._绝对时段, 起点);
  assert.equal(data.系统._家庭文档.孩子.length, 1, '不得重复追加孩子');
  assert.equal(data.户['101'].妻._生产.状态, '住院中');
  assert.equal(data.户['101'].妻._生产.生产结算标识, '生产:101:1:partial-birth');
  assert.equal(data.户['101'].妻._生产.实际生产绝对时段, 起点);
  assert.equal(data.户['101'].妻._生产.住院结束绝对时段, 起点 + 42);
  assert.equal(data.户['101'].妻._生产.结果, '陪产');
  assert.equal(data.户['101'].妻._生产.获知生产路径, '陪产');
  assert.equal(data.户['101'].妻._怀孕.状态, '未孕');
});

test('旧档孩子硬事实会恢复陪产与产后看望历史，不得重新开放已完成动作', () => {
  const data = 建数据(['101'], 80);
  到预产(data, '101', 'restore-visit-history');
  assert.equal(提交留下陪产(data, '101').成功, true);
  const 出生时段 = data.系统._绝对时段;
  data.系统._家庭文档.孩子.push({
    id: '生产:101:1:restore-visit-history',
    母亲门牌: '101',
    胎次: 1,
    性别: '女',
    出生绝对时段: 出生时段,
    结果: '陪产',
    玩家产后看望: true,
    获知生产路径: '陪产',
    叙事最小年龄: 0,
    年龄阶段: '新生儿',
    出生场次标识: 'restore-visit-history',
  });
  const 生产 = data.户['101'].妻._生产;
  生产.预产通知已读 = false;
  生产.陪产已选择 = false;
  生产.产后看望 = false;
  生产.生产结算标识 = '';

  const 结果 = 结算实际生产(data, '101', '陪产', 出生时段);
  assert.equal(结果.成功, true);
  assert.equal(结果.变动, true);
  assert.equal(生产.预产通知已读, true, '实际陪产已经证明玩家读过预产通知');
  assert.equal(生产.陪产已选择, true, '孩子结果为陪产时必须恢复陪产选择硬事实');
  assert.equal(生产.产后看望, true, '孩子档案是产后看望的不可逆来源');
  assert.equal(
    读取生产事件快照(data, { 门牌: '101', 胎次: 1, 场次标识: 'restore-visit-history' })?.产后看望,
    true,
  );
  assert.deepEqual(
    生产地点动作(data, '医院').map(项 => 项.id),
    ['重试生产叙事'],
    '已完成产后看望不能因部分旧档恢复而重新出现',
  );
});

test('未陪产在预产窗口后2时段自动生产，住院42时段后恢复普通位置与再次受孕资格', () => {
  const data = 建数据(['102'], 0);
  到预产(data, '102', 'auto-1');
  assert.equal(提交产前看望(data, '102').成功, true);
  推进时段(data, 2);
  const 自动 = 推进生产时钟(data);
  assert.deepEqual(自动.自动生产, ['102']);
  assert.equal(data.系统._家庭文档.孩子[0].结果, '仅产前看望');
  assert.equal(data.户['102'].妻._生产.状态, '住院中');
  推进时段(data, 41);
  推进生产时钟(data);
  assert.equal(data.户['102'].妻._生产.状态, '住院中');
  推进时段(data, 1);
  assert.deepEqual(推进生产时钟(data).出院, ['102']);
  assert.equal(data.户['102'].妻._生产.状态, '已出院');
  assert.notEqual(妻位置推算('102', data.系统._绝对时段, data.户['102']), '医院');
});

test('上一胎消息尚未落库时开始下一胎，仍从孩子硬档案重建产后与住院节点', () => {
  const data = 建数据(['101'], 0);
  到预产(data, '101', 'history-first');
  推进时段(data, 2);
  assert.deepEqual(推进生产时钟(data).自动生产, ['101']);
  推进时段(data, 产后住院时段数);
  推进生产时钟(data);

  const 第一胎凭据 = { 门牌: '101', 胎次: 1, 场次标识: 'history-first' };
  assert.deepEqual(列出产后通知(data), [第一胎凭据]);
  assert.deepEqual(
    列出住院微信节点(data).map(节点 => 节点.类型),
    ['恢复', '近况', '出院预告', '出院'],
  );

  Object.assign(data.户['101'].妻._怀孕, {
    状态: '待告知',
    受孕场次标识: 'history-second',
    受孕绝对时段: data.系统._绝对时段,
  });
  assert.equal(初始化本胎生产账(data, '101'), true);
  assert.equal(data.户['101'].妻._生产.本胎序号, 2);

  assert.deepEqual(列出产后通知(data), [第一胎凭据], '当前生产账被下一胎占用后，上一胎仍须可重建');
  assert.deepEqual(
    列出住院微信节点(data).map(节点 => 节点.类型),
    ['恢复', '近况', '出院预告', '出院'],
  );
  const 快照 = 读取生产事件快照(data, 第一胎凭据);
  assert.equal(快照?.孩子?.id, '生产:101:1:history-first');
  assert.equal(快照?.结果, '完全缺席');
  assert.equal(快照?.实际生产绝对时段, 128);
  assert.equal(快照?.住院结束绝对时段, 128 + 产后住院时段数);
});

test('医院硬锁进入孕产认知并拒绝建立成人场景', () => {
  const data = 建数据(['101'], 0);
  到预产(data, '101', 'hospital-safe');
  const 旧data = structuredClone(data);
  const 原精力 = data.玩家资源.精力.当前值;
  const 结果 = 结算成功现场楼(data, 旧data, {
    楼层: 5,
    行动: '在医院要求发生性行为',
    正文: '她明确拒绝，只接受普通探望。',
    本楼事件: '',
    妻在场: ['101'],
    实际尺度: { 101: 4 },
    资源计费: true,
  });
  assert.equal(结果.性爱开始, false);
  assert.equal(data.系统._性爱场景.状态, '空闲');
  assert.equal(data.玩家资源.体力.当前值, 旧data.玩家资源.体力.当前值);
  assert.equal(data.玩家资源.精力.当前值, 原精力 - 1);
  assert.match(结果.提示, /普通探望/);
  assert.match(怀孕认知提示(data, '101'), /医院等待第1胎生产/);
});

test('同一时段多名角色自动生产各自追加独立孩子票据', () => {
  const data = 建数据(['101', '102'], 0);
  到预产(data, '101', 'parallel-101');
  // 第二人的读孕锚与第一人相同；直接推进到同一个预产水位。
  data.系统._绝对时段 = 0;
  到预产(data, '102', 'parallel-102');
  // 对齐两人的自动生产水位后一起跨过窗口。
  data.户['101'].妻._生产.自动生产绝对时段 = data.系统._绝对时段 + 2;
  data.户['102'].妻._生产.自动生产绝对时段 = data.系统._绝对时段 + 2;
  推进时段(data, 2);
  const 结果 = 推进生产时钟(data);
  assert.deepEqual(结果.自动生产.sort(), ['101', '102']);
  assert.equal(data.系统._家庭文档.孩子.length, 2);
  assert.deepEqual(data.系统._家庭文档.孩子.map(x => x.母亲门牌).sort(), ['101', '102']);
  assert.equal(new Set(data.系统._家庭文档.孩子.map(x => x.id)).size, 2);
});

test('同一母亲最多三胎，既有孩子按胎序直接获得至少一年叙事年龄差且性别稳定混合', () => {
  const data = 建数据(['101'], 0);
  for (let 胎次 = 1; 胎次 <= 3; 胎次 += 1) {
    const 标识 = `multi-${胎次}`;
    到预产(data, '101', 标识);
    assert.equal(提交留下陪产(data, '101').成功, true);
    推进时段(data, 2);
    assert.equal(结算实际生产(data, '101', '陪产').变动, true);
    推进时段(data, 产后住院时段数);
    推进生产时钟(data);
  }
  const 孩子 = data.系统._家庭文档.孩子;
  assert.deepEqual(
    孩子.map(x => x.性别),
    ['女', '男', '女'],
  );
  assert.deepEqual(
    孩子.map(x => x.叙事最小年龄),
    [2, 1, 0],
  );
  assert.deepEqual(
    孩子.map(x => x.年龄阶段),
    ['两岁以上', '一岁以上', '新生儿'],
  );
  assert.equal(已达生产上限(data, '101'), true);
  assert.equal(初始化本胎生产账(data, '101'), false);
  assert.match(房间生产背景键(data, '101'), /第3胎_房间宝宝用品$/);
});

test('旧档已公开孕情缺少计时锚时从载入绝对时段起算，且不事后伪造家庭计划知情', () => {
  const 节点 = 创建户节点(0);
  节点.妻._怀孕.状态 = '已告知';
  节点.妻._怀孕.受孕场次标识 = 'legacy-public';
  delete节点生产(节点);
  const data = Schema.parse({
    户: { 101: 节点 },
    系统: { _数据版本: 9, _绝对时段: 77, _家庭计划: { 阶段: '已完成' } },
  });
  assert.equal(data.户['101'].妻._生产.状态, '孕期');
  assert.equal(data.户['101'].妻._生产.确认已读绝对时段, 77);
  assert.equal(data.户['101'].妻._生产.预产绝对时段, 77 + 孕期时段数);
  assert.equal(data.户['101'].妻._生产.家庭计划知情, false);
});

function delete节点生产(节点) {
  delete 节点.妻._生产;
}

test('客户端接线在预产微信已读后开放真实医院，并让生产演出压过普通CG', () => {
  const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
  const 地图源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/地图.vue', import.meta.url), 'utf8');
  const 入口源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

  assert.match(App源码, /:hospital-visible="医院已解锁\(data\)"/);
  assert.match(App源码, /房间id === '医院' && !医院已解锁\(data\.value\)/);
  assert.match(App源码, /当前借种CG\.value[\s\S]{0,100}借种结局图片[\s\S]{0,100}当前生产CG\.value[\s\S]{0,100}生产图片/);
  assert.match(App源码, /当前成人CG\.value && !荣耀洞图\.value && !当前事件CG\.value/);
  assert.match(地图源码, /v-if="hospitalVisible"[\s\S]*?点房\('医院'\)/);
  assert.match(
    入口源码,
    /await 脚本写入\(raw, data,[\s\S]*?eventEmit\('人妻公寓:生产CG'[^]*?await 执行回合/,
    '等待生产必须先提交硬状态，再开始可失败、可重试的AI叙事',
  );
});

test('非硬结算生产动作只有在正文成功提交后才播放CG，失败或取消不得提前泄露图片', () => {
  const 入口源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const 非等待分支 = 入口源码.slice(
    入口源码.indexOf('const 胎次 = data.户[门牌号].妻._生产.本胎序号;'),
    入口源码.indexOf("eventOn('人妻公寓:同步家庭计划微信已读'"),
  );

  assert.doesNotMatch(
    非等待分支.slice(0, 非等待分支.indexOf('const 成功 = await 执行回合')),
    /eventEmit\('人妻公寓:生产CG'/,
    '产前/产后看望、留下陪产与重试叙事都不能在正文成功前播放CG',
  );
  assert.match(非等待分支, /const 成功 = await 执行回合[\s\S]*?if \(成功\) \{[\s\S]*?eventEmit\('人妻公寓:生产CG'/);
});
