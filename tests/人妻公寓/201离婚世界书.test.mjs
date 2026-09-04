/* eslint-disable import-x/no-nodejs-modules -- Node-only current-chat worldbook contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;

const schemaModule = require('../../src/人妻公寓/schema.ts');
const { Schema, 创建户节点 } = schemaModule;
const schemaAliasPath = require.resolve('../../src/人妻公寓/schema');
require.cache[schemaAliasPath] = { id: schemaAliasPath, filename: schemaAliasPath, loaded: true, exports: schemaModule };

const 世界书 = require('../../src/人妻公寓/脚本/游戏逻辑/201离婚世界书.ts');
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function 数据() {
  return Schema.parse({ 户: { 201: 创建户节点(0) } });
}

function 分居(data, choice = '继续关系') {
  data.系统._许曼君分居.阶段 = '已完成';
  data.系统._许曼君分居.工资卡状态 = '已归还赵国强';
  data.系统._许曼君分居.丈夫已选择外住 = true;
  data.系统._许曼君分居.生活用品已取完 = true;
  data.系统._许曼君分居.钥匙位置 = '管理员室201钥匙格';
  data.系统._许曼君分居.钥匙用途 = '待离婚交接';
  data.系统._许曼君分居.许曼君已拒绝恢复共同生活 = true;
  data.系统._许曼君分居.玩家最终关系选择 = choice;
  data.系统._许曼君分居.双方同意进入办理 = true;
  data.户['201'].夫._居住模式 = '待离婚交接';
  return data;
}

function 法律离婚(data) {
  分居(data, data.系统._许曼君分居.玩家最终关系选择 === '未决定' ? '继续关系' : data.系统._许曼君分居.玩家最终关系选择);
  data.系统._许曼君离婚.阶段 = '待归档旧钥匙';
  data.系统._许曼君离婚.法律离婚已成立 = true;
  return data;
}

function 完成(data, choice = '继续关系') {
  分居(data, choice);
  data.系统._许曼君离婚.阶段 = '已完成';
  data.系统._许曼君离婚.法律离婚已成立 = true;
  data.系统._许曼君离婚.旧钥匙状态 = '前住户旧钥匙归档';
  data.系统._许曼君离婚.赵国强正式退居 = true;
  data.系统._许曼君离婚.换锁完成 = true;
  data.系统._已完成特殊场景.push('角色路线:201:结局剧情');
  data.户['201'].夫._居住模式 = '正式退居';
  return data;
}

test('阶段内容严格区分未开始、分居过渡、法律离婚待终幕与完整完成', () => {
  const before = 世界书.构造201离婚世界书内容(数据());
  assert.match(before, /尚未完成.*正式离婚|法律婚姻仍然存在/u);
  assert.doesNotMatch(before, /已经正式离婚/u);

  const separated = 世界书.构造201离婚世界书内容(分居(数据()));
  assert.match(separated, /《分居》已经完成/u);
  assert.match(separated, /法律婚姻尚未解除/u);
  assert.match(separated, /赵国强.*外住/u);

  const legal = 世界书.构造201离婚世界书内容(法律离婚(数据()));
  assert.match(legal, /法律离婚已经成立/u);
  assert.match(legal, /完整结局尚未完成|完整《离婚》终幕尚未完成/u);
  assert.doesNotMatch(legal, /法律婚姻尚未解除/u);

  const complete = 世界书.构造201离婚世界书内容(完成(数据()));
  assert.match(complete, /完整《离婚》已经完成/u);
  assert.match(complete, /赵国强.*正式退居/u);
  assert.match(complete, /201.*许曼君/u);
});

test('完整完成后分别守住继续、暂不承诺、退出和旧档未知关系边界', () => {
  const keep = 世界书.构造201离婚世界书内容(完成(数据(), '继续关系'));
  assert.match(keep, /继续关系/u);
  assert.match(keep, /“和她亲密”|和她亲密/u);

  const pending = 世界书.构造201离婚世界书内容(完成(数据(), '暂不承诺'));
  assert.match(pending, /暂不承诺/u);
  assert.match(pending, /不得.*独占|不能.*独占/u);

  const exit = 世界书.构造201离婚世界书内容(完成(数据(), '退出关系'));
  assert.match(exit, /退出关系/u);
  assert.match(exit, /住户.*管理员|管理员.*住户/u);
  assert.match(exit, /不得恢复.*亲密|不开放.*亲密/u);

  const legacy = 完成(数据(), '继续关系');
  legacy.系统._许曼君分居.玩家最终关系选择 = '未决定';
  const unknown = 世界书.构造201离婚世界书内容(legacy);
  assert.match(unknown, /关系选择未记录|不作.*推断/u);
  assert.match(unknown, /不开放.*亲密|不得假定.*亲密/u);
});

test('世界书只保存稳定公开边界，不泄露终幕目标、成人结果或当天日常', () => {
  const data = 完成(数据(), '继续关系');
  data.系统._许曼君离婚.终幕目标 = '戒印';
  data.系统._许曼君离婚.封存物件 = '戒印红本';
  data.系统._许曼君离婚后日常.最近主题 = '给自己改衣服';
  data.系统._许曼君离婚后日常.最近摘要 = '昨天改了衣服。';
  const content = 世界书.构造201离婚世界书内容(data);
  assert.doesNotMatch(content, /戒印|红本|婚戒|射精|精液|昨天改了衣服|给自己改衣服/u);
});

test('只有完成ID的兼容旧档不补写未记录的换锁、新钥匙或终幕物件', () => {
  const data = 分居(数据(), '未决定');
  data.系统._已完成特殊场景.push('角色路线:201:结局剧情');
  Object.assign(data.系统._许曼君离婚, {
    阶段: '已完成',
    法律离婚已成立: true,
    赵国强正式退居: true,
    旧钥匙状态: '旧档未记录',
    新锁芯位置: '旧档未记录',
    新钥匙位置: '旧档未记录',
    封存物件: '旧档未记录',
    完成分支: '旧档未记录',
  });
  const content = 世界书.构造201离婚世界书内容(data);
  assert.match(content, /兼容旧档.*没有记录/u);
  assert.doesNotMatch(content, /已经完成旧钥匙归档与换锁/u);
  assert.doesNotMatch(content, /新钥匙|红本|婚戒|戒印/u);
});

test('未进入201路线且没有聊天世界书时不创建空世界书', async () => {
  const old = {
    SillyTavern: globalThis.SillyTavern,
    getChatWorldbookName: globalThis.getChatWorldbookName,
    getOrCreateChatWorldbook: globalThis.getOrCreateChatWorldbook,
    updateWorldbookWith: globalThis.updateWorldbookWith,
  };
  let created = 0;
  try {
    globalThis.SillyTavern = { getCurrentChatId: () => 'chat-empty' };
    globalThis.getChatWorldbookName = () => null;
    globalThis.getOrCreateChatWorldbook = async () => { created += 1; return 'wb-empty'; };
    globalThis.updateWorldbookWith = async () => { throw new Error('不应调用'); };
    世界书.作废201离婚世界书同步缓存();
    assert.equal(await 世界书.同步201离婚世界书(数据()), true);
    assert.equal(created, 0);
  } finally {
    Object.assign(globalThis, old);
  }
});

test('同步器只更新当前聊天的独立稳定条目，并按聊天隔离缓存', async () => {
  const old = {
    SillyTavern: globalThis.SillyTavern,
    getChatWorldbookName: globalThis.getChatWorldbookName,
    getOrCreateChatWorldbook: globalThis.getOrCreateChatWorldbook,
    updateWorldbookWith: globalThis.updateWorldbookWith,
  };
  const books = new Map();
  let chat = 'chat-a';
  let updates = 0;
  try {
    globalThis.SillyTavern = { getCurrentChatId: () => chat };
    globalThis.getChatWorldbookName = () => `wb-${chat}`;
    globalThis.getOrCreateChatWorldbook = async () => `wb-${chat}`;
    globalThis.updateWorldbookWith = async (name, mutate) => {
      updates += 1;
      books.set(name, mutate(books.get(name) ?? []));
    };
    世界书.作废201离婚世界书同步缓存();
    const dataA = 完成(数据(), '继续关系');
    assert.equal(await 世界书.同步201离婚世界书(dataA), true);
    assert.equal(await 世界书.同步201离婚世界书(dataA), true);
    assert.equal(updates, 1, '同一聊天同一签名不重复写');
    assert.equal(books.get('wb-chat-a').filter(item => item.name === 世界书.离婚阶段世界书条目名).length, 1);

    chat = 'chat-b';
    const dataB = 完成(数据(), '退出关系');
    assert.equal(await 世界书.同步201离婚世界书(dataB), true);
    assert.equal(updates, 2);
    assert.match(books.get('wb-chat-a')[0].content, /继续关系/u);
    assert.match(books.get('wb-chat-b')[0].content, /退出关系/u);
  } finally {
    Object.assign(globalThis, old);
  }
});

test('写入失败不污染缓存，下个同步点可重试；失效租约不写当前聊天', async () => {
  const old = {
    SillyTavern: globalThis.SillyTavern,
    getChatWorldbookName: globalThis.getChatWorldbookName,
    getOrCreateChatWorldbook: globalThis.getOrCreateChatWorldbook,
    updateWorldbookWith: globalThis.updateWorldbookWith,
  };
  let calls = 0;
  let entries = [];
  try {
    globalThis.SillyTavern = { getCurrentChatId: () => 'chat-retry' };
    globalThis.getChatWorldbookName = () => 'wb-retry';
    globalThis.getOrCreateChatWorldbook = async () => 'wb-retry';
    globalThis.updateWorldbookWith = async (_name, mutate) => {
      calls += 1;
      if (calls === 1) throw new Error('一次性失败');
      entries = mutate(entries);
    };
    世界书.作废201离婚世界书同步缓存();
    const data = 完成(数据(), '暂不承诺');
    assert.equal(await 世界书.同步201离婚世界书(data), false);
    assert.equal(await 世界书.同步201离婚世界书(data), true);
    assert.equal(calls, 2);
    assert.equal(entries.length, 1);

    assert.equal(await 世界书.同步201离婚世界书(data, () => false, true), false);
    assert.equal(calls, 2);
  } finally {
    Object.assign(globalThis, old);
  }
});

test('生产生命周期同时接线201与302世界书，切聊/回档会作废两套缓存', () => {
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const engine = read('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  for (const source of [index, engine]) {
    assert.match(source, /同步201离婚阶段世界书/u);
    assert.match(source, /同步302阶段世界书/u);
    assert.match(source, /作废201离婚阶段世界书同步缓存/u);
    assert.match(source, /作废302阶段世界书同步缓存/u);
  }
});
