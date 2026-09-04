/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
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
  chat: [{ is_user: false, mes: 'anchor', send_date: 1, swipe_id: 0 }],
  getCurrentChatId: () => 'chat-A',
};
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: {
    数据库状态: () => ({ 初始化完成: true, 可用: false, 原因: '测试禁用' }),
    通过数据库生成: async () => null,
    读取数据库记忆胶囊: async () => [],
    读取微信进展摘要: async () => null,
    读取微信进展胶囊: async () => [],
    规范微信进展数据: 值 => 值,
    同步社交轨迹: async () => '已存在',
    刷新SQLite能力缓存: () => undefined,
    探测数据库SQLite模式: async () => false,
    序列化微信进展数据: 值 => JSON.stringify(值),
  },
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  构造回国母亲邀请事务,
  建立回国母亲邀请事务,
  读取回国母亲邀请事务,
  确认回国母亲邀请消息已写,
  回国母亲可邀请入群,
} = require('../../src/人妻公寓/脚本/游戏逻辑/回国系统.ts');
const {
  构造双重继承群聊余波收据,
  构造双重继承群聊余波消息键,
  双重继承群聊余波收据完整,
  双重继承群聊余波收据消息键前缀,
  双重继承群聊余波事务会话,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群跨容器事务.ts');
const { 双重继承结局姐妹群余波一拍 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts');

function 回国数据() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 302: 创建户节点(0) } });
  data.户['101'].妻.当前阶段 = 3;
  data.系统._绝对时段 = 44;
  data.系统._回国.阶段 = '待姐妹茶话会';
  data.系统._回国.茶话会状态 = '入群演绎';
  return data;
}

function 双重继承数据() {
  const data = Schema.parse({ 户: { 302: 创建户节点(0) } });
  data.系统._绝对时段 = 64; // 下午
  data.系统._双重继承.阶段 = '已完成';
  data.系统._双重继承.完成楼层 = 50;
  data.系统._双重继承.群聊余波状态 = '待发送';
  data.系统._双重继承.群聊余波最早时段 = 60;
  data.系统._已完成特殊场景.push('双重继承');
  return data;
}

test('邀请事务先冻结主状态意图，消息凭据不匹配时不推进，匹配后才原子确认入群', () => {
  const data = 回国数据();
  const 事务 = 构造回国母亲邀请事务({
    聊天ID: 'chat-A',
    时间线世代: 7,
    入群楼层: 12,
    绝对时段: 44,
    Persona名: '罗恒',
    锚签名: '[false,"anchor",1,0,null,null]',
  });
  const 建立 = 建立回国母亲邀请事务(data, 事务);
  assert.equal(建立.成功, true);
  assert.equal(建立.变动, true);
  assert.equal(data.系统._回国.阶段, '待姐妹茶话会', '建立意图本身不能提前推进主路线');
  assert.equal(回国母亲可邀请入群(data), false, '意图存在后陈旧按钮必须失败关闭');
  assert.deepEqual(读取回国母亲邀请事务(data), 事务);

  const 错凭据 = 确认回国母亲邀请消息已写(data, {
    事务ID: `${事务.事务ID}-late`,
    Persona名: '另一个名字',
  });
  assert.equal(错凭据.成功, false);
  assert.equal(data.系统._回国.阶段, '待姐妹茶话会');

  const 确认 = 确认回国母亲邀请消息已写(data, {
    事务ID: 事务.事务ID,
    Persona名: 事务.Persona名,
  });
  assert.equal(确认.成功, true);
  assert.equal(确认.变动, true);
  assert.equal(data.系统._回国.阶段, '姐妹茶话会进行中');
  assert.equal(data.系统._回国.茶话会成员快照.includes('101'), true);
  assert.equal(读取回国母亲邀请事务(data), null);
});

test('邀请时Persona被冻结在事务中，等待期间外部Persona变化不能改写预定群昵称', () => {
  const data = 回国数据();
  const 事务 = 构造回国母亲邀请事务({
    聊天ID: 'chat-A',
    时间线世代: 3,
    入群楼层: 9,
    绝对时段: 44,
    Persona名: '点击时名字',
    锚签名: 'anchor-signature',
  });
  建立回国母亲邀请事务(data, 事务);
  const 持久事务 = 读取回国母亲邀请事务(data);
  assert.equal(持久事务?.Persona名, '点击时名字');
  assert.notEqual(持久事务?.Persona名, '等待五秒后改过的名字');
});

test('双重继承余波收据必须验证整批稳定键；部分写入、错聊天或错分支都不能完成', () => {
  const 收据 = 构造双重继承群聊余波收据({
    聊天ID: 'chat-A',
    时间线世代: 5,
    完成楼层: 50,
    批次ID: 'ending-50',
    入群楼层: 70,
    绝对时段: 64,
    锚签名: 'anchor-A',
    消息总数: 5,
    无消息原因: '',
  });
  const 完整消息 = Array.from({ length: 5 }, (_, i) => ({
    会话: '姐妹群',
    键: 构造双重继承群聊余波消息键(收据, i + 1),
    文: `成员:${i + 1}`,
  }));
  const 收据消息 = {
    会话: 双重继承群聊余波事务会话,
    键: `${双重继承群聊余波收据消息键前缀}${收据.批次ID}`,
    文: JSON.stringify(收据),
  };
  assert.equal(双重继承群聊余波收据完整([...完整消息, 收据消息], 收据), true);
  assert.equal(双重继承群聊余波收据完整([...完整消息.slice(0, 4), 收据消息], 收据), false);
  assert.equal(双重继承群聊余波收据完整([...完整消息, { ...收据消息, 文: JSON.stringify({ ...收据, 聊天ID: 'chat-B' }) }], 收据), false);
});

test('成员不足的余波分支只写跨容器收据，不得修改手机Schema副本的主路线状态', async () => {
  const data = 双重继承数据();
  const 库 = { 消息: [], 圈: [], 读到: {}, 读时: {}, 圈读到: -1, 圈读时: { 楼: -1, 时: -1 }, 节拍: {}, 已发私聊图: {} };
  const 结果 = await 双重继承结局姐妹群余波一拍(data, 库, 0);
  assert.equal(结果, true);
  assert.equal(data.系统._双重继承.群聊余波状态, '待发送', '临时手机副本不能冒充主MVU提交');
  assert.equal(库.消息.some(消息 => 消息.会话 === 双重继承群聊余波事务会话), true, '无消息完成也必须留下分支可验证的事务收据');
});
