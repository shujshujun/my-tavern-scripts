/* eslint-disable import-x/no-nodejs-modules -- Node-only async regression tests */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.window = globalThis;
globalThis.parent = globalThis;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });

const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

function stub(file, exports) {
  const id = require.resolve(`../../src/人妻公寓/脚本/游戏逻辑/${file}`);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}

stub('数据库桥.ts', { 同步社交轨迹: () => undefined });
stub('mvuIO.ts', {});

const schemaModule = require('../../src/人妻公寓/schema.ts');
const { Schema, 创建户节点 } = schemaModule;
const schemaAliasPath = require.resolve('../../src/人妻公寓/schema');
require.cache[schemaAliasPath] = { id: schemaAliasPath, filename: schemaAliasPath, loaded: true, exports: schemaModule };

const {
  读取当前手机时间线租约世代,
  作废当前手机时间线租约世代,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts');

let chat = 'A';
let stores;
let save;
let saveCalls;
let events;

globalThis.SillyTavern = { chat: [{ mes: 'anchor', is_user: false }] };
stub('手机/运行时上下文.ts', { 当前手机绝对时段: () => 8, 当前聊天ID: () => chat, 末楼: () => 0 });
stub('手机/UI刷新.ts', { 请求手机重绘: () => undefined, 请求刷新手机红点: () => undefined });
stub('手机/数据层.ts', {
  读库: () => stores[chat],
  写库增量: async (delta, valid) => {
    if (!valid()) return false;
    const keys = new Set(stores[chat].消息.map(item => item.键).filter(Boolean));
    for (const message of delta.新消息) {
      if (message.键 && keys.has(message.键)) continue;
      stores[chat].消息.push(message);
      if (message.键) keys.add(message.键);
    }
    return true;
  },
  立即持久保存手机聊天变量: async () => {
    saveCalls += 1;
    return save();
  },
  玩家名: () => '玩家',
});

globalThis.eventEmit = (...args) => events.push(args);
const { 同步管理任务微信 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts');

function reset() {
  chat = 'A';
  stores = { A: { 消息: [] }, B: { 消息: [] } };
  events = [];
  saveCalls = 0;
  save = async () => true;
  作废当前手机时间线租约世代();
}

function 邀请数据() {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: 8 } });
  data.系统._许曼君离婚.阶段 = '等待邀请';
  data.系统._许曼君离婚.邀请状态 = '待发送';
  return data;
}

function 日常反馈数据() {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: 8 } });
  data.系统._许曼君离婚.阶段 = '已完成';
  data.系统._已完成特殊场景.push('角色路线:201:结局剧情');
  data.系统._许曼君离婚后日常.待反馈事件.push({
    事件ID: 'daily-1',
    消息键: '许曼君离婚后日常:daily-1:收针回执',
    可发送时段: 8,
    文案: '昨天那件事已经收针。',
  });
  return data;
}

test('离婚邀请只有手机硬保存成功且租约仍有效后才广播送达；失败后的实存消息会重试保存', async () => {
  reset();
  const data = 邀请数据();
  save = async () => false;
  assert.equal(await 同步管理任务微信(data), false);
  assert.equal(stores.A.消息.length, 1, '内存写入可以存在，但不能冒充已经持久送达');
  assert.equal(events.some(item => item[0] === '人妻公寓:许曼君离婚邀请已送达'), false);

  save = async () => true;
  events = [];
  assert.equal(await 同步管理任务微信(data), false, '重试只补持久化，不重复插入气泡');
  assert.equal(saveCalls, 2);
  assert.equal(stores.A.消息.length, 1);
  assert.equal(events.filter(item => item[0] === '人妻公寓:许曼君离婚邀请已送达').length, 1);
});

test('日常反馈在保存期间切聊或租约作废时不广播，回到原聊天后可补存并发送唯一收据', async () => {
  for (const invalidate of [
    () => { chat = 'B'; },
    () => {作废当前手机时间线租约世代();},
  ]) {
    reset();
    const data = 日常反馈数据();
    save = async () => {
      invalidate();
      return false;
    };
    assert.equal(await 同步管理任务微信(data), false);
    assert.equal(events.some(item => item[0] === '人妻公寓:许曼君离婚后日常反馈已送达'), false);
    chat = 'A';
    save = async () => true;
    events = [];
    assert.equal(await 同步管理任务微信(data), false);
    const receipts = events.filter(item => item[0] === '人妻公寓:许曼君离婚后日常反馈已送达');
    assert.equal(receipts.length, 1);
    assert.equal(receipts[0][1], '许曼君离婚后日常:daily-1:收针回执');
    assert.equal(stores.A.消息.length, 1);
  }
});
