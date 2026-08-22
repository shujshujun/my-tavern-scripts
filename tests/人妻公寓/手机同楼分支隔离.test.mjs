/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 附手机分支锚, 手机记录属于当前分支, 裁手机分支记录, 裁同楼切分支记录 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/手机分支隔离.ts',
);

test('同楼 swipe 后已提交旧分支微信与稳定键一起失去当前分支资格', () => {
  const 旧锚 = { is_user: false, mes: '旧回复', swipe_id: 0, send_date: 1 };
  const 旧分支 = [旧锚];
  const 记录 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '旧分支硬通知', 键: '楼务:T1' }, 旧分支);
  assert.equal(手机记录属于当前分支(记录, 旧分支), true);

  const 新分支 = [{ is_user: false, mes: '新回复', swipe_id: 1, send_date: 1 }];
  assert.equal(手机记录属于当前分支(记录, 新分支), false);
  assert.deepEqual(裁手机分支记录([记录], 新分支), []);
});

test('正常加楼不改变旧记录的分支归属；无锚旧档按兼容边界保留', () => {
  const 锚 = { is_user: false, mes: '回复', swipe_id: 0 };
  const 记录 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '当前消息' }, [锚]);
  assert.equal(手机记录属于当前分支(记录, [锚, { is_user: true, mes: '下一楼' }]), true);
  assert.equal(手机记录属于当前分支({ 楼: 0, 时: 0, 文: '旧档无锚' }, [{ mes: '任意' }]), true);
});

test('网页刷新把缺失 swipe_id 补成 0 时仍是同一分支；真正切到 swipe 1 仍会隔离', () => {
  const 创建时锚 = { is_user: false, mes: '同一条酒馆回复' };
  const 记录 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '刷新前微信' }, [创建时锚]);

  const 刷新后同分支 = [{ is_user: false, mes: '同一条酒馆回复', swipe_id: 0 }];
  assert.equal(手机记录属于当前分支(记录, 刷新后同分支), true, '缺失 swipe_id 与首分支 0 必须等价');

  const 真正新分支 = [{ is_user: false, mes: '同一条酒馆回复', swipe_id: 1 }];
  assert.equal(手机记录属于当前分支(记录, 真正新分支), false, '真实 swipe 变化仍必须隔离旧微信');
});

test('已发布旧档中 swipe_id=null 的持久签名兼容刷新后的 0，但不兼容真实 swipe 1', () => {
  const 旧档记录 = {
    楼: 0,
    时: 2,
    会话: '101',
    文: '旧版已保存微信',
    锚签名: JSON.stringify([false, '同一条酒馆回复', null, null, null, null]),
  };
  assert.equal(
    手机记录属于当前分支(旧档记录, [{ is_user: false, mes: '同一条酒馆回复', swipe_id: 0 }]),
    true,
  );
  assert.equal(
    手机记录属于当前分支(旧档记录, [{ is_user: false, mes: '同一条酒馆回复', swipe_id: 1 }]),
    false,
  );
});

test('明确同楼 swipe 时裁掉该楼无锚自动消息和稳定键，仅保留无法判别的玩家手动消息', () => {
  const 新分支 = [{ is_user: false, mes: '新回复', swipe_id: 1 }];
  const 带锚旧消息 = 附手机分支锚({ 楼: 0, 时: 2, 发: '对方', 文: '带锚旧自动回复' }, 新分支);
  const 记录 = [
    带锚旧消息,
    { 楼: 0, 时: 2, 发: '对方', 文: '无锚旧自动回复' },
    { 楼: 0, 时: 2, 发: '系统', 文: '无锚旧硬通知', 键: '楼务:T1' },
    { 楼: 0, 时: 2, 发: '我', 文: '无法判别的玩家手动消息' },
  ];
  assert.deepEqual(裁同楼切分支记录(记录, 0, 新分支).map(x => x.文), ['无法判别的玩家手动消息']);
});

test('宿主在同一分支内改写正文（宏展开/思维链剥离/楼层编辑）后微信仍属于当前分支', () => {
  // 开局楼宏：substituteParams 每次载入聊天都会重新展开 {{user}} 等宏。
  const 载入前 = { is_user: false, mes: '你好，{{user}}。', send_date: 100, swipe_id: 0, name: '人妻公寓' };
  const 记录 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '刷新前微信', 键: '楼务:管理-0-下水堵塞-101' }, [载入前]);
  const 载入后 = { is_user: false, mes: '你好，苏斌。', send_date: 100, swipe_id: 0, name: '人妻公寓' };
  assert.equal(手机记录属于当前分支(记录, [载入后]), true, '宏重新展开不是分支变化，微信不得整段隐身');

  // 思维链解析：parseReasoningFromString 把 reasoning 段剥出并回写更短的 mes。
  const 剥离思维链后 = { is_user: false, mes: '正文', send_date: 100, swipe_id: 0, name: '人妻公寓' };
  const 带思维链 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '思维链剥离前微信' }, [
    { is_user: false, mes: '<think>推理</think>正文', send_date: 100, swipe_id: 0, name: '人妻公寓' },
  ]);
  assert.equal(手机记录属于当前分支(带思维链, [剥离思维链后]), true, 'reasoning 回写不是分支变化');

  // 玩家手动编辑楼层正文同样只改 mes。
  const 编辑后 = { is_user: false, mes: '玩家改过的正文', send_date: 100, swipe_id: 0, name: '人妻公寓' };
  assert.equal(手机记录属于当前分支(记录, [编辑后]), true, '楼层编辑不应清空该楼已产生的微信');
});

test('正文容差不放宽真实分支隔离：swipe、send_date、is_user、name、头像任一变化仍失配', () => {
  const 原锚 = { is_user: false, mes: '原回复', send_date: 100, swipe_id: 0, name: '人妻公寓', force_avatar: null };
  const 记录 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '原分支微信' }, [原锚]);

  const 变体 = [
    ['真实 swipe', { ...原锚, mes: '另一分支回复', swipe_id: 1 }],
    ['删楼后重建（新时间戳）', { ...原锚, mes: '重建回复', send_date: 200 }],
    ['角色/用户身份变化', { ...原锚, mes: '重建回复', is_user: true }],
    ['发言人变化', { ...原锚, mes: '重建回复', name: '苏斌' }],
    ['persona 头像变化', { ...原锚, mes: '重建回复', force_avatar: 'thumb/persona' }],
  ];
  for (const [说明, 新锚] of 变体) {
    assert.equal(手机记录属于当前分支(记录, [新锚]), false, `${说明} 必须仍然隔离旧分支微信`);
  }
});

test('正文容差覆盖已发布旧档签名：swipe_id=null 与正文改写可同时发生', () => {
  const 旧档记录 = {
    楼: 0,
    时: 2,
    会话: '101',
    文: '旧版已保存微信',
    锚签名: JSON.stringify([false, '旧版保存时的正文', null, null, '人妻公寓', null]),
  };
  assert.equal(
    手机记录属于当前分支(旧档记录, [
      { is_user: false, mes: '刷新后宿主改写的正文', send_date: null, swipe_id: 0, name: '人妻公寓', force_avatar: null },
    ]),
    true,
    '旧档 null swipe_id 归一后，正文差异应按宿主改写解释',
  );
  assert.equal(
    手机记录属于当前分支(旧档记录, [
      { is_user: false, mes: '真实第二分支', send_date: null, swipe_id: 1, name: '人妻公寓', force_avatar: null },
    ]),
    false,
    '旧档记录遇到真实 swipe 仍必须隔离',
  );
});

test('签名形状未知时退回严格比较，不因容差放宽隔离', () => {
  // 非对象锚（宿主异常/极旧存档）序列化后不是 6 元数组，只能严格相等。
  const 非对象锚记录 = { 楼: 0, 时: 2, 会话: '101', 文: '异常锚微信', 锚签名: JSON.stringify(null) };
  assert.equal(手机记录属于当前分支(非对象锚记录, [null]), true, '同为异常锚时严格相等仍匹配');
  assert.equal(
    手机记录属于当前分支(非对象锚记录, [{ is_user: false, mes: '正常楼', swipe_id: 0 }]),
    false,
    '形状不同不得走正文容差',
  );

  const 畸形签名记录 = { 楼: 0, 时: 2, 会话: '101', 文: '畸形签名微信', 锚签名: '{不是 JSON' };
  assert.equal(
    手机记录属于当前分支(畸形签名记录, [{ is_user: false, mes: '正常楼', swipe_id: 0 }]),
    false,
    '不可解析的签名必须失败关闭',
  );
});
