/* eslint-disable import-x/no-nodejs-modules -- PLAY-032：旧完成档完成楼未知时的姐妹群余波身份。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.window = globalThis;
globalThis.parent = globalThis;
globalThis.eventEmit = () => undefined;
globalThis.getVariables = () => ({ _场景: { 房间id: '302' } });
globalThis.getLastMessageId = () => 0;
globalThis.SillyTavern = {
  name1: '林舟',
  chat: [{ is_user: false, mes: 'anchor', send_date: 1, swipe_id: 0 }],
  getCurrentChatId: () => 'play032-chat',
};
globalThis.insertOrAssignVariables = () => undefined;
globalThis.updateVariablesWith = () => undefined;
globalThis.generate = () => { throw new Error('PLAY032_EXTERNAL_MODEL_FORBIDDEN'); };
globalThis.generateRaw = () => { throw new Error('PLAY032_EXTERNAL_MODEL_FORBIDDEN'); };
globalThis.fetch = () => { throw new Error('PLAY032_EXTERNAL_IO_FORBIDDEN'); };

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

let generated = '';
let generationCalls = 0;
require.cache[require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts')] = {
  id: require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts'),
  filename: require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts'),
  loaded: true,
  exports: {
    小生成: async () => {
      generationCalls += 1;
      return generated;
    },
    微信群文本: async text => String(text).split('\n').map(x => x.trim()).filter(Boolean),
    微信短文本: async text => String(text),
    手机小生成仍有效: () => true,
    称呼纪律: () => '',
    家庭事实: () => '',
    口吻纪律: () => '',
    攻略私聊提示: () => '',
  },
};
require.cache[require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/微信记忆上下文.ts')] = {
  id: require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/微信记忆上下文.ts'),
  filename: require.resolve('../../src/人妻公寓/脚本/游戏逻辑/手机/微信记忆上下文.ts'),
  loaded: true,
  exports: {
    读取群聊记忆上下文: () => ({ 群内记忆: '', 最近聊天: '' }),
    读取私聊记忆上下文: () => ({ 私聊记忆: '', 最近聊天: '' }),
  },
};
require.cache[require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts')] = {
  id: require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts'),
  filename: require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts'),
  loaded: true,
  exports: {
    数据库状态: () => ({ 初始化完成: true, 可用: false, 原因: 'PLAY032测试禁用' }),
    通过数据库生成: async () => null,
    读取数据库记忆胶囊: async () => [],
    读取微信进展摘要: async () => null,
    读取微信进展胶囊: async () => [],
    规范微信进展数据: value => value,
    同步社交轨迹: async () => '已存在',
    刷新SQLite能力缓存: () => undefined,
    探测数据库SQLite模式: async () => false,
    序列化微信进展数据: value => JSON.stringify(value),
  },
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');
const tx = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群跨容器事务.ts');
const { 双重继承结局姐妹群余波一拍 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts');

const reload = value => Schema.parse(JSON.parse(JSON.stringify(value)));
function emptyDb() {
  return { 消息: [], 圈: [], 读到: {}, 读时: {}, 圈读到: -1, 圈读时: { 楼: -1, 时: -1 }, 节拍: {}, 已发私聊图: {} };
}
function legacyCompleted({ members = true } = {}) {
  const data = Schema.parse({
    户: members
      ? { 101: 创建户节点(0), 102: 创建户节点(0), 302: 创建户节点(0) }
      : { 302: 创建户节点(0) },
    系统: {
      _绝对时段: 124,
      _已完成特殊场景: ['双重继承'],
      _回国: { 阶段: '已完成', 茶话会状态: '已完成' },
    },
  });
  if (data.户['101']) data.户['101'].妻.当前阶段 = 3;
  if (data.户['102']) data.户['102'].妻.当前阶段 = 3;
  data.户['302'].妻.当前阶段 = 5;
  route.同步双重继承完成后状态(data, 999);
  assert.equal(data.系统._双重继承.阶段, '已完成');
  assert.equal(data.系统._双重继承.完成楼层, -1, '旧完成ID恢复不能把当前楼999伪造成历史完成楼');
  data.系统._双重继承.群聊余波状态 = '待发送';
  data.系统._双重继承.群聊余波最早时段 = 120;
  return data;
}

function receiptMessage(receipt, text = JSON.stringify(receipt)) {
  return {
    会话: tx.双重继承群聊余波事务会话,
    键: tx.双重继承群聊余波收据键(receipt),
    文: text,
  };
}

const validGroupText = [
  '母亲:你爸已经离开，楼以后正式交给管理员，我还是住在302。',
  '夏乔:那就祝贺管理员正式接班，今晚别再谈公事了。',
  '沈静仪:交接完成就照新的生活秩序来，不必反复证明。',
  '夏乔:有空大家再约一顿饭，别把日子过成工作群。',
  '沈静仪:先把眼前的安排说清楚，之后慢慢适应就好。',
].join('\n');

test('PLAY-032 旧完成档完成楼=-1仍能生成一次真实姐妹群余波并写兼容收据', async () => {
  generationCalls = 0;
  generated = validGroupText;
  const data = legacyCompleted();
  const db = emptyDb();
  const result = await 双重继承结局姐妹群余波一拍(data, db, 0);
  assert.equal(result, true);
  assert.equal(generationCalls, 1, '未知历史完成楼不能在生成前永久拒绝');
  assert.equal(db.消息.filter(x => x.会话 === '姐妹群').length, 5);
  const receipt = tx.读取双重继承群聊余波收据(db.消息, -1);
  assert.ok(receipt, '兼容收据必须可被当前读取器恢复');
  assert.equal(receipt.完成楼层, -1, '收据明确保留未知历史楼，不伪造当前楼');
  assert.equal(tx.双重继承群聊余波收据完整(db.消息, receipt), true);
  assert.equal(data.系统._双重继承.群聊余波状态, '待发送', '手机临时副本只产消息与收据，不提前提交主状态');
});

test('PLAY-032 旧完成档成员不足也能用零消息兼容收据一次性收口', async () => {
  generationCalls = 0;
  const data = legacyCompleted({ members: false });
  const db = emptyDb();
  const result = await 双重继承结局姐妹群余波一拍(data, db, 0);
  assert.equal(result, true);
  assert.equal(generationCalls, 0);
  const receipt = tx.读取双重继承群聊余波收据(db.消息, -1);
  assert.ok(receipt);
  assert.equal(receipt.消息总数, 0);
  assert.equal(receipt.无消息原因, '姐妹群有效成员不足');
  assert.equal(tx.双重继承群聊余波收据完整(db.消息, receipt), true);
});

test('PLAY-032 已知完成楼继续使用原收据身份，不被兼容分支降级', () => {
  const receipt = tx.构造双重继承群聊余波收据({
    聊天ID: 'play032-chat', 时间线世代: 2, 完成楼层: 50, 批次ID: 'ending-floor-50',
    入群楼层: 0, 绝对时段: 124, 锚签名: 'anchor', 消息总数: 0, 无消息原因: '成员不足',
  });
  assert.equal(receipt.完成楼层, 50);
  const messages = [receiptMessage(receipt)];
  assert.equal(tx.读取双重继承群聊余波收据(messages, 50)?.完成楼层, 50);
  assert.equal(tx.读取双重继承群聊余波收据(messages, -1), null);
});

test('PLAY-032 解析只允许-1这一种未知完成楼，畸形负楼不能伪装成兼容旧档', () => {
  const base = {
    版本: 1, 聊天ID: 'play032-chat', 时间线世代: 2, 完成楼层: -2,
    批次ID: 'bad-negative', 入群楼层: 0, 绝对时段: 124, 锚签名: 'anchor',
    消息总数: 0, 无消息原因: '成员不足',
  };
  const messages = [{
    会话: tx.双重继承群聊余波事务会话,
    键: `${tx.双重继承群聊余波收据消息键前缀}${base.批次ID}`,
    文: JSON.stringify(base),
  }];
  assert.equal(tx.读取双重继承群聊余波收据(messages), null);
});

test('PLAY-032 Schema重载与回档保持未知楼身份，不缓存后来伪造的完成楼', async () => {
  generationCalls = 0;
  generated = validGroupText;
  const before = reload(legacyCompleted());
  const after = reload(before);
  const db = emptyDb();
  assert.equal((await 双重继承结局姐妹群余波一拍(after, db, 0)), true);
  assert.equal(after.系统._双重继承.完成楼层, -1);
  assert.equal(before.系统._双重继承.完成楼层, -1);
  assert.ok(tx.读取双重继承群聊余波收据(db.消息, -1));

  const known = reload(after);
  known.系统._双重继承.完成楼层 = 77;
  assert.equal(tx.读取双重继承群聊余波收据(db.消息, 77), null, '未知楼收据不能认领后来具有真实楼戳的另一完成身份');
});
