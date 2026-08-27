/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 合并本地群聊进展摘要, 合并本地微信进展摘要 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信本地进展摘要.ts');
const { 压缩微信会话消息 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信消息压缩.ts');
const { 编译本人见证正文 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信可知正文.ts');

const 手机根 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 交互源 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机根), 'utf8');
const 节拍源 = readFileSync(new URL('./节拍引擎.ts', 手机根), 'utf8');
const 摘要源 = readFileSync(new URL('./摘要系统.ts', 手机根), 'utf8');
const 记忆源 = readFileSync(new URL('./微信记忆上下文.ts', 手机根), 'utf8');
const 数据源 = readFileSync(new URL('./数据层.ts', 手机根), 'utf8');
const 数据库桥源 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', import.meta.url),
  'utf8',
);

test('私聊摘要不再只填事实：双方确认、本人边界和待续话题各归自己的有界槽位', () => {
  const 约定 = 合并本地微信进展摘要('', '夏乔', [
    { 说话者: '玩家', 内容: '周五晚上我来接你，好吗？' },
    { 说话者: '夏乔', 内容: '好，说定了，别迟到。' },
  ]);
  assert.equal(约定.a.length, 1);
  assert.match(约定.a[0], /周五|说定/);

  const 边界 = 合并本地微信进展摘要(JSON.stringify(约定), '夏乔', [
    { 说话者: '玩家', 内容: '我可以在群里说吗？' },
    { 说话者: '夏乔', 内容: '不要在群里说这件事，这是我的底线。' },
  ]);
  assert.equal(边界.b.length, 1);
  assert.match(边界.b[0], /不要在群里说|底线/);

  const 待续 = 合并本地微信进展摘要(JSON.stringify(边界), '夏乔', [
    { 说话者: '玩家', 内容: '那件事你想好了吗？' },
    { 说话者: '夏乔', 内容: '还没有，等我想好了再告诉你。' },
  ]);
  assert.equal(待续.p.length, 1);
  assert.match(待续.p[0], /还没有|再告诉/);
  assert.ok(待续.f.length + 待续.a.length + 待续.b.length + 待续.p.length <= 6);
});

test('角色主动发来的私聊也进入本人长期摘要，不依赖玩家先发一条消息', () => {
  const 结果 = 合并本地微信进展摘要('', '夏乔', [{ 说话者: '夏乔', 内容: '这件事不要告诉别人，这是我的底线。' }]);
  assert.match(结果.f.join(' '), /夏乔主动微信/);
  assert.match(结果.b.join(' '), /不要告诉别人|底线/);
  assert.match(节拍源, /主动私聊门牌[\s\S]{0,500}排队刷新微信进展摘要/);
  assert.match(摘要源, /推入本人主动点/);
});

test('SQLite 长时间不可用后会折叠全部未摘要增量，不会只记末尾24/36条便裁掉更早正文', () => {
  const 私聊 = 合并本地微信进展摘要('', '夏乔', [
    { 说话者: '玩家', 内容: '这件事可以告诉别人吗？' },
    { 说话者: '夏乔', 内容: '不要告诉别人，这是我的底线。' },
    ...Array.from({ length: 30 }, (_, i) => [
      { 说话者: '玩家', 内容: `普通问题${i}` },
      { 说话者: '夏乔', 内容: `普通回复${i}` },
    ]).flat(),
  ]);
  assert.match(私聊.b.join(' '), /不要告诉别人|底线/);
  assert.match(私聊.f.at(-1), /普通问题29.*普通回复29/);

  const 群聊 = 合并本地群聊进展摘要('', '姐妹茶话会', [
    { 说话者: '沈太太', 内容: '周五晚上一起见面，说定了。' },
    { 说话者: '夏乔', 内容: '好，没问题。' },
    ...Array.from({ length: 40 }, (_, i) => ({ 说话者: '林悦', 内容: `普通群聊${i}` })),
  ]);
  assert.match(群聊.a.join(' '), /周五|说定/);
  assert.doesNotMatch(摘要源, /\.slice\(-(?:24|36)\)/);
});

test('原始消息压缩仅裁旧普通气泡，保留48条私聊并保护强事件、未读和仍被引用的原文', () => {
  const 消息 = Array.from({ length: 70 }, (_, i) => ({
    楼: i + 1,
    时: i + 1,
    序: i + 1,
    会话: '101',
    发: i % 2 ? '对方' : '我',
    文: `消息${i + 1}`,
    ...((i + 1) % 2 ? {} : { 标识: `p-${i + 1}` }),
  }));
  消息[1].键 = '强事件:必须保留';
  消息[2].引用 = { 序: 1 };
  消息.push({ 楼: 80, 时: 80, 序: 80, 会话: '202', 发: '对方', 文: '别的会话' });

  const 压缩 = 压缩微信会话消息(消息, '101', 48, 项 => 项.序 === 3);
  assert.equal(
    压缩.filter(项 => 项.会话 === '101' && !项.键 && 项.序 !== 3).length,
    49,
    '常规48条之外还要额外保留1条被引用原文',
  );
  assert.ok(压缩.some(项 => 项.键 === '强事件:必须保留'));
  assert.ok(
    压缩.some(项 => 项.序 === 3),
    '额外保护（如未读）不得被裁',
  );
  assert.ok(
    压缩.some(项 => 项.序 === 1),
    '保留气泡的引用目标不得被裁',
  );
  assert.ok(压缩.some(项 => 项.会话 === '202'));
});

test('保护消息不占普通气泡配额，上限为零时也只留下保护项及其引用闭包', () => {
  const 普通 = Array.from({ length: 60 }, (_, i) => ({ 会话: '101', 发: '对方', 序: i + 1, 文: `普通${i + 1}` }));
  const 强事件 = Array.from({ length: 10 }, (_, i) => ({
    会话: '101',
    发: '对方',
    序: i + 61,
    文: `事件${i + 1}`,
    键: `强事件:${i + 1}`,
  }));
  const 压缩 = 压缩微信会话消息([...普通, ...强事件], '101', 48);
  assert.equal(压缩.filter(项 => !项.键).length, 48, '普通消息必须独占48条配额');
  assert.equal(压缩.filter(项 => 项.键).length, 10, '保护消息必须在普通配额之外全部保留');
  assert.equal(压缩.length, 58);
  assert.equal(压缩.find(项 => !项.键)?.序, 13);

  const 零上限 = 压缩微信会话消息(
    [
      { 会话: '101', 发: '对方', 序: 1, 文: '引用根' },
      { 会话: '101', 发: '对方', 序: 2, 文: '应删除' },
      { 会话: '101', 发: '系统', 序: 3, 文: '系统保护', 引用: { 序: 1 } },
      { 会话: '202', 发: '对方', 序: 4, 文: '别的会话' },
    ],
    '101',
    0,
  );
  assert.deepEqual(
    零上限.map(项 => 项.序),
    [1, 3, 4],
    '零上限只保留保护消息、其引用根以及其他会话',
  );
});

test('正文尾巴只能授权给最近一楼真正在场的本人', () => {
  const chat = [
    { is_user: true, mes: '我和林悦说话。' },
    { is_user: false, mes: '<div>林悦把信封收进抽屉，说这件事只有你们知道。</div>' },
  ];
  assert.equal(编译本人见证正文('101', ['102'], chat), '');
  assert.match(编译本人见证正文('102', ['102'], chat), /林悦把信封收进抽屉/);
});

test('SQLite 摘要只有获得确认后才压缩原始消息；后台待确认保持原文且不误判数据库不可用', () => {
  const 社交起点 = 数据库桥源.indexOf('export async function 同步社交轨迹');
  const 社交终点 = 数据库桥源.indexOf('function 取表', 社交起点);
  assert.ok(社交起点 >= 0 && 社交终点 > 社交起点, '必须能定位社交轨迹写入函数');
  const 社交函数 = 数据库桥源.slice(社交起点, 社交终点);

  assert.match(社交函数, /Promise<数据库社交写入结果>/);
  assert.match(社交函数, /SQL写入状态 === '已确认'[^\n]*return '已确认'/);
  assert.match(社交函数, /SQL写入状态 === '已提交待定'[^\n]*return '待确认'/);
  assert.doesNotMatch(社交函数, /SQL写入状态 === '已确认' \|\| SQL写入状态 === '已提交待定'[^\n]*return true/);

  assert.equal((摘要源.match(/写入结果 === '已确认'/g) ?? []).length, 2, '私聊与群聊都只在确认后压缩');
  assert.equal((摘要源.match(/写入结果 === '待确认'/g) ?? []).length, 2, '私聊与群聊都单独处理后台待确认');
  assert.match(摘要源, /待确认[\s\S]{0,260}原始消息保持不动/);
  assert.doesNotMatch(摘要源, /if \(写入结果\)[\s\S]{0,240}压缩微信会话记录/);
});

test('三条生成路径共用同一知识边界，摘要确认成功后才按400条安全压缩', () => {
  assert.doesNotMatch(交互源, /function 最近正文\(/);
  assert.match(交互源, /读取私聊记忆上下文/);
  assert.match(节拍源, /读取私聊记忆上下文/);
  assert.match(节拍源, /读取群聊记忆上下文\('(?:群|姐妹群)'/);
  assert.match(记忆源, /相关剧情连续性（未证明本人知情）/);
  assert.match(记忆源, /除非条目本身明确写出她亲历、获告知或作出回应，否则不得让她说出、追问或据此行动/);
  assert.match(摘要源, /export function 排队刷新群聊进展摘要/);
  assert.match(摘要源, /私聊原始消息上限\s*=\s*400/);
  assert.match(摘要源, /群聊原始消息上限\s*=\s*400/);
  assert.match(摘要源, /写入结果 === '已确认'[\s\S]{0,240}压缩微信会话记录/);
  assert.match(数据源, /图池容量\s*=\s*私聊图库清单/);
  assert.match(数据源, /图片轮换保护\.has\(消息\)/);
});
