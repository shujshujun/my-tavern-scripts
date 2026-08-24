/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 附手机分支锚, 手机记录属于当前分支, 裁手机分支记录, 裁同楼切分支记录, 裁删楼后记录 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/手机分支隔离.ts',
);
const 手机数据层源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts', import.meta.url), 'utf8');

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

test('旧助手楼缺失 is_user、刷新后补 false 仍属于同一角色侧', () => {
  const 旧档记录 = {
    楼: 0,
    时: 2,
    会话: '101',
    文: '旧助手楼微信',
    锚签名: JSON.stringify([null, '同一条回复', null, null, null, null]),
  };
  assert.equal(
    手机记录属于当前分支(旧档记录, [{ is_user: false, mes: '刷新后的回复', swipe_id: 0 }]),
    true,
  );
  assert.equal(
    手机记录属于当前分支(旧档记录, [{ is_user: true, mes: '用户楼', swipe_id: 0 }]),
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

test('持久分支只认角色侧与 swipe：刷新补齐时间、名称、头像或正文时仍保留，真实 swipe/角色侧变化仍隔离', () => {
  const 原锚 = { is_user: false, mes: '原回复', send_date: 100, swipe_id: 0, name: '人妻公寓', force_avatar: null };
  const 记录 = 附手机分支锚({ 楼: 0, 时: 2, 会话: '101', 文: '原分支微信' }, [原锚]);

  const 刷新软变体 = [
    ['正文改写', { ...原锚, mes: '刷新后的正文' }],
    ['时间字段补齐', { ...原锚, send_date: 200 }],
    ['发言人显示名归一', { ...原锚, name: '更新后的角色名' }],
    ['头像归一', { ...原锚, force_avatar: 'thumb/updated-avatar' }],
  ];
  for (const [说明, 新锚] of 刷新软变体) {
    assert.equal(手机记录属于当前分支(记录, [新锚]), true, `${说明}不是分支身份，不得隐藏微信`);
  }

  assert.equal(
    手机记录属于当前分支(记录, [{ ...原锚, mes: '另一分支回复', swipe_id: 1 }]),
    false,
    '真实 swipe 仍必须隔离旧分支微信',
  );
  assert.equal(
    手机记录属于当前分支(记录, [{ ...原锚, mes: '用户楼', is_user: true }]),
    false,
    '用户/助手角色侧变化仍必须失败关闭',
  );
});

test('明确删楼拥有物理裁枝权：删除楼及后续记录即使外观和 swipe_id 相同也不能复活', () => {
  const 当前聊天 = [
    { is_user: true, mes: '保留楼', swipe_id: 0 },
    { is_user: false, mes: '宿主在同楼重建的相同正文', swipe_id: 0 },
  ];
  const 记录 = [
    附手机分支锚({ 楼: 0, 时: 2, 发: '我', 文: '删除点以前' }, 当前聊天),
    附手机分支锚({ 楼: 1, 时: 2, 发: '对方', 文: '被删除楼的旧微信' }, 当前聊天),
    { 楼: 2, 时: 2, 发: '系统', 文: '删除楼之后的旧事件', 键: '旧事件' },
  ];
  assert.deepEqual(裁删楼后记录(记录, 1, 当前聊天).map(x => x.文), ['删除点以前']);
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

test('真实 swipe 协调期间唯一手机写入口双重冻结，事件后新分支消息不得先写入再被裁掉', () => {
  assert.match(手机数据层源, /时间线切换协调中/);
  const 起 = 手机数据层源.indexOf('export async function 写库增量');
  const 止 = 手机数据层源.indexOf('\nexport ', 起 + 1);
  assert.ok(起 >= 0 && 止 > 起);
  const 写入段 = 手机数据层源.slice(起, 止);
  const 外门 = 写入段.indexOf('if (时间线切换协调中()) return false;');
  const 更新 = 写入段.indexOf('updateVariablesWith');
  assert.ok(外门 >= 0 && 外门 < 更新, '进入变量队列前必须冻结新手机写入');
  assert.match(
    写入段.slice(更新),
    /if \(时间线切换协调中\(\) \|\| !允许写入\(\)\) return vars;/,
    '变量回调真正提交前必须再次复核协调锁',
  );
});
