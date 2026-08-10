/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
// `schema.json` 与 `schema.ts` 同名；Node 测试需像 webpack 一样优先解析 TypeScript。
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');

const { Schema, 当前MVU数据版本, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  时间撤销点键,
  时间撤销点版本,
  时间撤销恢复聊天键,
  时间推进事务恢复聊天键,
  时间推进事务键,
  时间状态指纹,
  时间聊天状态指纹,
  是时间撤销地点,
  捕获精确聊天快照,
  恢复精确聊天快照,
  创建时间撤销点,
  创建时间推进事务记录,
  读取时间推进事务记录,
  判定时间撤销点,
  执行时间推进双存储提交,
} = require('../../src/人妻公寓/脚本/游戏逻辑/时间撤销系统.ts');

test('管理员室、302与原地训练地点都允许直接发起时间撤销', () => {
  for (const 地点 of ['管理员室', '302', '晨跑公园', '健身房']) assert.equal(是时间撤销地点(地点), true);
  for (const 地点 of ['', '公寓外部', '大堂', '101']) assert.equal(是时间撤销地点(地点), false);
});

function 建数据(绝对时段, 现金 = 1000) {
  return Schema.parse({
    现金,
    系统: {
      _数据版本: 当前MVU数据版本,
      _绝对时段: 绝对时段,
      _序章完成: true,
      _待发送事件: '',
    },
  });
}

function 建撤销点({ 前 = 建数据(5), 后 = 建数据(6, 900), 前聊天, 后聊天, 方式 = '推进一时段' } = {}) {
  const 默认前聊天 = {
    _场景: { 房间id: '管理员室', 进房末楼: 40 },
    _粘滞: { 位置: '管理员室', 们: ['101'] },
    _行动选项: ['继续聊'],
    _换装余波: { 101: { 楼: 40 } },
    人妻公寓_晋阶镜像: { 楼层: 40, 户: {} },
    _微信: { 消息: [{ id: '旧消息', 楼: 40, 时: 5 }] },
  };
  const 默认后聊天 = {
    ...structuredClone(默认前聊天),
    _场景: { 房间id: '管理员室', 进房末楼: 42 },
    _粘滞: null,
    _行动选项: [],
  };
  const 实际前聊天 = 前聊天 ?? 默认前聊天;
  const 实际后聊天 = 后聊天 ?? 默认后聊天;
  return {
    点: 创建时间撤销点({
      聊天ID: 'chat-a',
      锚楼: 42,
      锚消息签名: 'anchor-signature',
      方式,
      推进前数据: 前,
      推进后数据: 后,
      推进前聊天快照: 捕获精确聊天快照(实际前聊天, 时间撤销恢复聊天键),
      推进后聊天变量: 实际后聊天,
    }),
    前,
    后,
    前聊天: 实际前聊天,
    后聊天: 实际后聊天,
  };
}

function 判定(点, 后, 后聊天, 覆盖 = {}) {
  return 判定时间撤销点(点, {
    当前数据: 后,
    当前聊天变量: { ...structuredClone(后聊天), [时间撤销点键]: 点 },
    当前聊天ID: 'chat-a',
    当前楼: 42,
    当前锚消息签名: 'anchor-signature',
    ...覆盖,
  });
}

test('撤销点保存完整推进前 MVU，但推进后只存一致性指纹', () => {
  const 前 = 建数据(5, 1234);
  const 后 = structuredClone(前);
  后.现金 = 17;
  后.系统._绝对时段 = 6;
  后.系统._坏结局 = '考验失败：测试终局';
  后.系统._待发送事件 = '【事件在场妻:201】【新住户】201室今天搬进来一家';

  const { 点, 后聊天 } = 建撤销点({ 前, 后 });
  const 结果 = 判定(点, 后, 后聊天);

  assert.equal(结果.有效, true);
  assert.equal(时间撤销点版本, 2);
  assert.equal(点.版本, 2);
  assert.deepEqual(结果.撤销点.推进前数据, 前);
  assert.equal(Object.hasOwn(点, '推进后数据'), false, '不得把前后两份完整 MVU 都塞进聊天变量');
  assert.equal(typeof 点.推进后数据指纹, 'string');
  assert.equal(typeof 点.推进后聊天指纹, 'string');
});

test('连续推进仍是单槽覆盖，只能回到最后一次推进之前', () => {
  const 第一后 = 建数据(6, 900);
  const 第一 = 建撤销点({ 前: 建数据(5, 1000), 后: 第一后 });
  const 第二后 = 建数据(7, 800);
  const 第二 = 建撤销点({ 前: 第一后, 后: 第二后 });
  const chat = { [时间撤销点键]: 第一.点 };

  chat[时间撤销点键] = 第二.点;

  assert.equal(Array.isArray(chat[时间撤销点键]), false);
  assert.equal(chat[时间撤销点键].推进前数据.系统._绝对时段, 6);
  assert.equal(chat[时间撤销点键].结束绝对时段, 7);
});

test('楼层、消息锚、聊天、MVU 或聊天 ID 任一变化都令撤销点失效', () => {
  const { 点, 后, 后聊天 } = 建撤销点();
  const 改数据 = structuredClone(后);
  改数据.现金 += 1;
  const 改聊天 = structuredClone(后聊天);
  改聊天._场景.房间id = '大厅';

  for (const 结果 of [
    判定(点, 后, 后聊天, { 当前楼: 43 }),
    判定(点, 后, 后聊天, { 当前锚消息签名: 'other-signature' }),
    判定(点, 后, 后聊天, { 当前聊天ID: 'chat-b' }),
    判定(点, 改数据, 后聊天),
    判定(点, 后, 改聊天),
  ]) {
    assert.equal(结果.有效, false);
    assert.ok(结果.原因);
  }
});

test('自动收到的手机消息不阻断撤销，但玩家手动发送或撤回后必须令旧点失效', () => {
  const 基线后聊天 = {
    _场景: { 房间id: '管理员室', 进房末楼: 42 },
    _粘滞: null,
    _行动选项: [],
    _微信: { 消息: [{ 楼: 42, 时: 6, 会话: '101', 发: '对方', 文: '自动问候' }] },
  };
  const 基线 = 建撤销点({ 后聊天: 基线后聊天 });
  const 仅自动新增 = structuredClone(基线后聊天);
  仅自动新增._微信.消息.push({ 楼: 42, 时: 6, 会话: '102', 发: '对方', 文: '另一条自动消息' });
  assert.equal(判定(基线.点, 基线.后, 仅自动新增).有效, true);

  const 玩家新增 = structuredClone(仅自动新增);
  玩家新增._微信.消息.push({ 楼: 42, 时: 6, 会话: '101', 发: '我', 文: '玩家亲手回复', 标识: 'mine-1' });
  assert.equal(判定(基线.点, 基线.后, 玩家新增).有效, false);

  const 有玩家消息后聊天 = structuredClone(基线后聊天);
  有玩家消息后聊天._微信.消息.push({
    楼: 42,
    时: 6,
    会话: '101',
    发: '我',
    文: '尚未撤回',
    标识: 'mine-2',
  });
  const 撤回基线 = 建撤销点({ 后聊天: 有玩家消息后聊天 });
  const 玩家撤回 = structuredClone(有玩家消息后聊天);
  Object.assign(玩家撤回._微信.消息.at(-1), { 文: '', 类: '撤回', 撤回源: { 签名: 'old', 同签名序号: 0 } });
  assert.equal(判定(撤回基线.点, 撤回基线.后, 玩家撤回).有效, false);
});

test('孕情微信落库后的自动公开确认不破坏撤销点，其他孕情改写仍会令其失效', () => {
  const 前 = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 41, _序章完成: true } });
  前.户['101'].妻._怀孕 = {
    状态: '已受孕',
    受孕绝对时段: 0,
    预计告知绝对时段: 42,
    告知绝对时段: -1,
    受孕场次标识: 'undo-pregnancy',
    上次判定日: 1,
    连续未中次数: 0,
    告知文案: '',
    已曝光: false,
  };
  const 后 = structuredClone(前);
  后.系统._绝对时段 = 42;
  后.户['101'].妻._怀孕.状态 = '待告知';
  后.户['101'].妻._怀孕.告知文案 = '我确认过了，我怀孕了。';
  const 基线 = 建撤销点({ 前, 后 });

  const 微信确认后 = structuredClone(后);
  微信确认后.户['101'].妻._怀孕.状态 = '已告知';
  微信确认后.户['101'].妻._怀孕.告知绝对时段 = 42;
  assert.equal(判定(基线.点, 微信确认后, 基线.后聊天).有效, true);

  const 非确认改写 = structuredClone(微信确认后);
  非确认改写.户['101'].妻._怀孕.告知文案 = '被改写的消息';
  assert.equal(判定(基线.点, 非确认改写, 基线.后聊天).有效, false);
});

test('旧版本、损坏结构和被篡改的推进前快照一律拒绝', () => {
  const { 点, 后, 后聊天 } = 建撤销点();
  const 旧点 = structuredClone(点);
  旧点.版本 = 1;
  const 旧MVU = structuredClone(点);
  旧MVU.推进前数据.系统._数据版本 = 当前MVU数据版本 - 1;
  const 缺聊天键 = structuredClone(点);
  delete 缺聊天键.推进前聊天._场景;

  for (const 候选 of [null, {}, 旧点, 旧MVU, 缺聊天键]) {
    assert.equal(判定(候选, 后, 后聊天).有效, false);
  }
});

test('睡到次日早晨只能落在下一天早上，任意伪造跨度在创建和判定两端都拒绝', () => {
  const 前 = 建数据(5);
  const 正确后 = 建数据(6, 900);
  const 正确 = 建撤销点({ 前, 后: 正确后, 方式: '睡到次日早晨' });
  assert.equal(判定(正确.点, 正确后, 正确.后聊天).有效, true);

  assert.throws(() => 建撤销点({ 前, 后: 建数据(7, 900), 方式: '睡到次日早晨' }), /睡眠推进跨度无效/);

  const 损坏点 = structuredClone(正确.点);
  const 伪造后 = 建数据(7, 900);
  损坏点.结束绝对时段 = 7;
  损坏点.推进后数据指纹 = 时间状态指纹(伪造后);
  const 损坏判定 = 判定(损坏点, 伪造后, 正确.后聊天);
  assert.equal(损坏判定.有效, false);
  assert.match(损坏判定.原因, /跨度/);
});

test('聊天快照按“原来是否存在”精确恢复，不把不存在误写成 null', () => {
  const 原值 = { a: 0, b: undefined };
  const 快照 = 捕获精确聊天快照(原值, ['a', 'b', 'c']);
  const 当前 = { a: 9, b: 9, c: 9, d: 9 };

  恢复精确聊天快照(当前, 快照, ['a', 'b', 'c']);

  assert.equal(当前.a, 0);
  assert.equal(Object.hasOwn(当前, 'b'), true);
  assert.equal(当前.b, undefined);
  assert.equal(Object.hasOwn(当前, 'c'), false);
  assert.equal(当前.d, 9);
});

test('版本2撤销点精确恢复推进前隔离日志，连同晨跑健身或睡眠反馈一起撤销', () => {
  assert.equal(时间撤销点版本, 2);
  assert.equal(时间撤销恢复聊天键.includes('_隔离事件'), true);

  const 基线 = 建撤销点();
  const 旧日志 = {
    日志: [
      {
        id: 'old-narrative',
        类型: '监控',
        线程: '旧线程',
        谁: '叙事',
        文本: '推进前已经存在的日志',
        锚楼: 40,
        序: 0,
        房间: '管理员室',
        时间: 1000,
      },
    ],
  };
  const 前聊天 = { ...structuredClone(基线.前聊天), _隔离事件: 旧日志 };
  const 后聊天 = structuredClone(基线.后聊天);
  后聊天._隔离事件 = {
    日志: [
      ...structuredClone(旧日志.日志),
      {
        id: 'fitness-user',
        类型: '健身',
        线程: '日常健身:5',
        谁: '玩家',
        文本: '开始锻炼',
        锚楼: 42,
        序: 0,
        房间: '健身房',
        时间: 2000,
      },
      {
        id: 'fitness-narrative',
        类型: '健身',
        线程: '日常健身:5',
        谁: '叙事',
        文本: '锻炼反馈',
        锚楼: 42,
        序: 1,
        房间: '健身房',
        时间: 2000,
      },
    ],
  };
  const { 点, 后 } = 建撤销点({ 前聊天, 后聊天, 方式: '健身' });
  const 结果 = 判定(点, 后, 后聊天);
  assert.equal(结果.有效, true);

  const 当前聊天 = { ...structuredClone(后聊天), [时间撤销点键]: 点 };
  恢复精确聊天快照(当前聊天, 结果.撤销点.推进前聊天, 时间撤销恢复聊天键);

  assert.deepEqual(当前聊天._隔离事件, 旧日志);
  assert.doesNotMatch(JSON.stringify(当前聊天._隔离事件), /fitness|锻炼反馈/);
});

test('撤销点经过聊天变量 JSON 落盘往返后仍可校验，并保留 undefined 与缺失的区别', () => {
  const 原值 = { a: undefined };
  const 快照 = 捕获精确聊天快照(原值, ['a', 'b']);
  const 持久快照 = JSON.parse(JSON.stringify(快照));
  const 当前 = { a: 1, b: 2 };
  恢复精确聊天快照(当前, 持久快照, ['a', 'b']);
  assert.equal(Object.hasOwn(当前, 'a'), true);
  assert.equal(当前.a, undefined);
  assert.equal(Object.hasOwn(当前, 'b'), false);

  const { 点, 后, 后聊天 } = 建撤销点();
  const 持久撤销点 = JSON.parse(JSON.stringify(点));
  assert.equal(判定(持久撤销点, 后, 后聊天).有效, true);
});

test('时间推进恢复记录可跨重载校验，损坏时拒绝猜测且记录本身不改变聊天指纹', () => {
  const 前 = 建数据(5);
  const 前聊天变量 = {
    _场景: { 房间id: '管理员室', 进房末楼: 42 },
    _粘滞: { 位置: '管理员室', 们: ['101'] },
    _隔离事件: { 日志: [{ id: 'old' }] },
    [时间撤销点键]: { old: true },
  };
  const 前聊天 = 捕获精确聊天快照(前聊天变量, 时间推进事务恢复聊天键);
  const 记录 = 创建时间推进事务记录({ 聊天ID: 'chat-a', 推进前数据: 前, 推进前聊天: 前聊天 });
  const 持久记录 = JSON.parse(JSON.stringify(记录));

  assert.deepEqual(读取时间推进事务记录(持久记录), 记录);
  assert.equal(时间聊天状态指纹({ ...前聊天变量, [时间推进事务键]: 持久记录 }), 时间聊天状态指纹(前聊天变量));

  const 坏数据 = structuredClone(持久记录);
  坏数据.推进前数据.现金 += 1;
  assert.equal(读取时间推进事务记录(坏数据), null);
  const 坏聊天 = structuredClone(持久记录);
  坏聊天.推进前聊天._场景.值 = { 房间id: '302' };
  assert.equal(读取时间推进事务记录(坏聊天), null);
});

test('撤销点只在 stat 成功后写入；撤销点落盘失败会按 stat→chat 顺序完整补偿', async () => {
  const 成功顺序 = [];
  await 执行时间推进双存储提交({
    写推进状态: async () => 成功顺序.push('stat'),
    写撤销点: async () => 成功顺序.push('point'),
    恢复推进前状态: async () => 成功顺序.push('rollback-stat'),
    恢复推进前聊天: async () => 成功顺序.push('rollback-chat'),
  });
  assert.deepEqual(成功顺序, ['stat', 'point']);

  const 失败顺序 = [];
  await assert.rejects(
    执行时间推进双存储提交({
      写推进状态: async () => 失败顺序.push('stat'),
      写撤销点: async () => {
        失败顺序.push('point');
        throw new Error('模拟撤销点写入失败');
      },
      恢复推进前状态: async () => 失败顺序.push('rollback-stat'),
      恢复推进前聊天: async () => 失败顺序.push('rollback-chat'),
    }),
    /模拟撤销点写入失败/,
  );
  assert.deepEqual(失败顺序, ['stat', 'point', 'rollback-stat', 'rollback-chat']);

  const stat失败顺序 = [];
  await assert.rejects(
    执行时间推进双存储提交({
      写推进状态: async () => {
        stat失败顺序.push('stat');
        throw new Error('模拟 stat 写入失败');
      },
      写撤销点: async () => stat失败顺序.push('point'),
      恢复推进前状态: async () => stat失败顺序.push('rollback-stat'),
      恢复推进前聊天: async () => stat失败顺序.push('rollback-chat'),
    }),
    /模拟 stat 写入失败/,
  );
  assert.deepEqual(stat失败顺序, ['stat', 'rollback-stat', 'rollback-chat']);
});
