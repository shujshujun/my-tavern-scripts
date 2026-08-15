/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { 编译近期微信胶囊, 楼务微信消息仍有效 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信正文承接.ts');
const { 已入住微信妻友门牌 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信好友规则.ts');
// P6:手机节拍已迁至 ./手机/节拍引擎,节拍顺序断言改读新所有者；P8:妻回复近况过滤迁至 ./交互/邀约与发消息。
const 节拍引擎源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', 'utf8');
const 手机源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts', 'utf8');
const 数据层源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts', 'utf8');
const 摘要系统源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/摘要系统.ts', 'utf8');
const 快照源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts', 'utf8');
const 入口源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/index.ts', 'utf8');
// P5:微信好友表与楼务通知已迁移至 ./手机/通知桥,相关断言改读新所有者。
const 通知桥源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts', 'utf8');

test('楼务硬通知先于任何可能等待AI的冷落预警，同时仍服从坏结局与特殊场景门', () => {
  const 节拍 = 节拍引擎源.slice(节拍引擎源.indexOf('export async function 手机节拍'), 节拍引擎源.indexOf('// 手机节拍水位'));
  const 坏结局门 = 节拍.indexOf('if (data.系统._坏结局) return');
  const 特殊场景门 = 节拍.indexOf('if (data.系统._特殊场景.id) return');
  const 楼务同步 = 节拍.indexOf('await 同步管理任务微信(data)');
  const 冷落预警 = 节拍.indexOf('await 冷落预警节拍()');
  const 频率门 = 节拍.indexOf('const 倍 = 频率倍率');

  assert.ok(坏结局门 >= 0 && 特殊场景门 > 坏结局门);
  assert.ok(楼务同步 > 特殊场景门, '楼务通知不能越过坏结局或特殊场景门');
  assert.ok(冷落预警 > 楼务同步, 'AI 冷落预警不能阻塞确定性楼务通知');
  assert.ok(频率门 > 冷落预警, '关闭普通自动内容时仍须保留两类硬通知');
});

test('孕产姐妹群专场先于普通频率总闸，频率关闭不能饿死生产与住院事件', () => {
  const 节拍 = 节拍引擎源.slice(节拍引擎源.indexOf('export async function 手机节拍'), 节拍引擎源.indexOf('// 手机节拍水位'));
  const 孕产私聊 = 节拍.indexOf('await 同步孕产与家庭计划AI微信(data)');
  const 必达群 = 节拍.indexOf('await 孕产姐妹群必达拍(');
  const 频率门 = 节拍.indexOf('const 倍 = 频率倍率');
  assert.ok(孕产私聊 >= 0 && 必达群 > 孕产私聊, '先让私聊按真实群前置决定是否让路');
  assert.ok(必达群 < 频率门, '生产/住院姐妹群必须在频率=关的 return 之前执行');
  const 必达提交 = 节拍.slice(必达群, 频率门);
  assert.match(必达提交, /if \(必达结果 === '中止'\) return/);
  assert.match(必达提交, /await 写库增量\(/, '必达群不能只改陈旧快照，必须走统一增量提交');
  assert.match(必达提交, /新圈:\s*\[\], 新消息: 必达新消息, 节拍改: 必达节拍改/);
  assert.match(必达提交, /if \(!已写必达群\) return/, '时间线失效或并发写失败后不得继续普通内容');

  const 必达实现 = 节拍引擎源.slice(
    节拍引擎源.indexOf('async function 孕产姐妹群必达拍'),
    节拍引擎源.indexOf('// ── 姐妹群主动拍'),
  );
  assert.match(必达实现, /待孕情/);
  assert.match(必达实现, /待生产/);
  assert.match(必达实现, /待住院群/);
  const 普通群实现 = 节拍引擎源.slice(
    节拍引擎源.indexOf('// ── 姐妹群主动拍'),
    节拍引擎源.indexOf('let 节拍进行中'),
  );
  assert.doesNotMatch(普通群实现, /待孕情|待生产|待住院群/, '必达失败不得在频率门后同拍再请求一次');
});

test('已入住角色从阶段0起就是稳定好友，楼务创建、结案与已读状态都不改变联系人资格', () => {
  const 建数据 = ({ 有任务 = false, 母亲入列 = false } = {}) => ({
    户: {
      101: { 妻: { 当前阶段: 0 } },
      102: { 妻: { 当前阶段: 0 } },
      302: { 妻: { 当前阶段: 0 } },
    },
    系统: {
      _母亲入列: 母亲入列,
      _管理考核: { 活跃任务: 有任务 ? [{ id: 'repair', 类型: '报修', 门牌: '101' }] : [] },
    },
  });

  assert.deepEqual(已入住微信妻友门牌(建数据()), ['101', '102']);
  assert.deepEqual(已入住微信妻友门牌(建数据({ 有任务: true })), ['101', '102']);
  assert.deepEqual(已入住微信妻友门牌(建数据({ 母亲入列: true })), ['101', '102', '302']);

  const 好友段 = 通知桥源.slice(通知桥源.indexOf('export function 微信好友'), 通知桥源.indexOf('// 快照侧联系方式行'));
  assert.match(好友段, /已入住微信妻友门牌\(data\)/);
  assert.doesNotMatch(好友段, /当前阶段|楼务联系人|未读楼务/);
  assert.doesNotMatch(通知桥源, /function 未读楼务联系人/);
  assert.match(快照源, /已入住微信妻友门牌\(data\)/, 'AI 通讯范围必须与手机联系人共用同一判据');
  assert.match(数据层源, /function 会话有未读[\s\S]*会话消息未读/);
});

test('完成任务退出正文；逾期但仍可补办的楼务请求继续由本人承接', () => {
  const 消息 = [
    { 楼: 8, 时: 4, 会话: '101', 发: '对方', 文: '水龙头还漏着，请来处理。', 键: '楼务:repair-active' },
    { 楼: 8, 时: 4, 会话: '101', 发: '对方', 文: '旧报修已经处理完了。', 键: '楼务:repair-done' },
    { 楼: 8, 时: 4, 会话: '101', 发: '对方', 文: '逾期任务请看任务板。', 键: '楼务:repair-overdue' },
    { 楼: 8, 时: 4, 会话: '101', 发: '对方', 文: '晚上记得关窗。' },
  ];
  const 胶囊 = 编译近期微信胶囊(消息, [{ 门牌: '101', 人物: '夏乔' }], 8, 4, ['repair-active', 'repair-overdue']);

  assert.match(胶囊, /水龙头还漏着/);
  assert.match(胶囊, /逾期任务请看任务板/);
  assert.match(胶囊, /晚上记得关窗/);
  assert.doesNotMatch(胶囊, /旧报修已经处理完了/);
});

test('同一楼务有效性判据同时覆盖SQLite摘要和微信内继续私聊', () => {
  const 有效任务 = new Set(['repair-active']);
  assert.equal(楼务微信消息仍有效({ 键: '楼务:repair-active' }, 有效任务), true);
  assert.equal(楼务微信消息仍有效({ 键: '楼务:repair-done' }, 有效任务), false);
  assert.equal(楼务微信消息仍有效({ 文: '普通私聊' }, 有效任务), true);

  const 摘要段 = 摘要系统源.slice(摘要系统源.indexOf('interface 微信摘要消息'), 摘要系统源.indexOf('function 微信摘要快照仍有效'));
  const 私聊开始 = 手机源.indexOf(
    'const 有效楼务任务id = 有效楼务任务id集合(data);',
    手机源.indexOf('async function 执行批次聊天回复'),
  );
  const 私聊段 = 手机源.slice(
    私聊开始,
    手机源.indexOf('const 近况 =', 私聊开始),
  );

  assert.match(摘要段, /楼务微信消息仍有效/);
  assert.ok(
    摘要段.indexOf('楼务微信消息仍有效') < 摘要段.indexOf('.map((item): 微信摘要消息'),
    '楼务键必须在映射与哈希前过滤',
  );
  assert.match(摘要段, /JSON\.stringify\(\[item\.楼, item\.发, item\.文, item\.类, item\.图\]\)/);
  assert.doesNotMatch(摘要段, /JSON\.stringify\(\[[^\]]*item\.键/);
  assert.match(私聊段, /楼务微信消息仍有效/);
});

test('楼务正文入口明确让逾期报修与投诉的报事角色记得自己通过微信叫过玩家', () => {
  const 开始 = 入口源.indexOf("eventOn('人妻公寓:处理管理任务'");
  const 结束 = 入口源.indexOf("eventOn('人妻公寓:空房偷窃'", 开始);
  const 段 = 入口源.slice(开始, 结束);
  assert.match(段, /承接任务\.类型 === '报修'.*承接任务\.类型 === '投诉'/s);
  assert.match(段, /记得是自己此前通过微信叫玩家来处理/);
  assert.match(段, /即使已经逾期也只是补办/);
});
