/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 回合在场妻键, 构造角色近期正文 } = require('../../src/人妻公寓/脚本/游戏逻辑/角色近期正文.ts');

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 清洗 = 文本 => String(文本).trim();
const 助手楼 = (正文, 在场妻, extra = {}) => ({
  is_user: false,
  mes: 正文,
  extra: {
    ...extra,
    ...(在场妻 === undefined ? {} : { [回合在场妻键]: 在场妻 }),
  },
});
const 用户楼 = (正文, 在场妻) => ({ is_user: true, mes: 正文, extra: { [回合在场妻键]: 在场妻 } });

test('交替角色只读取目标妻有持久在场凭据的助手正文', () => {
  const 消息 = [
    助手楼('夏乔答应明天见面。', ['101']),
    助手楼('许曼君谈起只有她知道的秘密。', ['201']),
    助手楼('周小满独自在房间整理东西。', ['202']),
    助手楼('夏乔后来补充了约定。', ['101']),
  ];

  const 夏乔 = 构造角色近期正文(消息, '101', 清洗);
  assert.match(夏乔, /夏乔答应明天见面/);
  assert.match(夏乔, /夏乔后来补充了约定/);
  assert.doesNotMatch(夏乔, /许曼君|周小满/);
});

test('其他角色正文即使提到目标姓名也不能伪装成目标经历', () => {
  const 消息 = [
    助手楼('许曼君私下议论夏乔，但夏乔本人不在。', ['201']),
    助手楼('旧档没有角色元数据，却直接写了夏乔。', undefined),
    助手楼('畸形元数据也写了夏乔。', '101'),
  ];

  assert.equal(构造角色近期正文(消息, '101', 清洗), '');
});

test('多人真实同场正文可分别服务每位在场妻，不能服务第三人', () => {
  const 消息 = [助手楼('夏乔和沈静仪一起确认了这件事。', ['101', '102', '101'])];

  assert.match(构造角色近期正文(消息, '101', 清洗), /一起确认/);
  assert.match(构造角色近期正文(消息, '102', 清洗), /一起确认/);
  assert.equal(构造角色近期正文(消息, '201', 清洗), '');
});

test('只看全局最近14条且最多保留目标角色最后4条，用户楼和空正文被排除', () => {
  const 消息 = [
    助手楼('窗口外的过旧正文', ['101']),
    助手楼('无关占位0', ['201']),
    ...Array.from({ length: 7 }, (_, i) => 助手楼(`无关占位${i + 1}`, ['201'])),
    用户楼('玩家输入不能当作助手正文', ['101']),
    助手楼('目标1', ['101']),
    助手楼('目标2', ['101']),
    助手楼('目标3', ['101']),
    助手楼('目标4', ['101']),
    助手楼('目标5', ['101']),
    助手楼('   ', ['101']),
  ];

  const 结果 = 构造角色近期正文(消息, '101', 清洗);
  assert.doesNotMatch(结果, /窗口外|目标1|玩家输入/);
  assert.match(结果, /目标2/);
  assert.match(结果, /目标3/);
  assert.match(结果, /目标4/);
  assert.match(结果, /目标5/);
  assert.equal((结果.match(/近期\d+：/g) ?? []).length, 4);
});

test('主回合与原生逃生舱都把角色元数据写进成功助手楼，三个入口继续共用角色级筛选', () => {
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 脚本 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const 原生固化起点 = 脚本.indexOf('async function 固化原生本轮在场');
  const 原生固化终点 = 脚本.indexOf('/** MVU 回调退出后助手楼才完成持久化', 原生固化起点);
  const 原生固化 = 脚本.slice(原生固化起点, 原生固化终点);

  assert.match(引擎, /\[回合在场妻键\]:[\s\S]{0,120}妻在场/);
  assert.match(原生固化, /setChatMessages\([\s\S]*?\[回合在场妻键\][\s\S]*?本轮妻在场/);
  assert.match(脚本, /构造角色近期正文\(SillyTavern\.chat \?\? \[\], m, 提取正文舞台文本\)/);
  assert.equal((脚本.match(/读取角色近期正文\(/g) ?? []).length, 4, '定义和三个消费者必须全部保留');
  assert.doesNotMatch(脚本, /slice\(-14\)[\s\S]{0,240}\.filter\(\(消息[^\n]+!消息\?\.is_user/);
});
