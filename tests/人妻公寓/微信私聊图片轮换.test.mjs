/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import { 建私聊图库地址索引, 重建已发私聊图 } from '../../src/人妻公寓/脚本/游戏逻辑/私聊图片轮换.ts';
import { 私聊图库清单 } from '../../src/人妻公寓/脚本/游戏逻辑/私聊图库清单.ts';

const 图地址 = 项 => `@adult/${项.path}`;
const 本户图库 = 门牌号 => 私聊图库清单.filter(项 => 项.门牌 === 门牌号);
const 图库索引 = 建私聊图库地址索引(私聊图库清单);

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('节拍引擎.ts', source, ts.ScriptTarget.Latest, true);
const selector = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === '选私聊候选图');
assert.ok(selector);
const code = ts.transpileModule(selector.getText(ast), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
function 加载选图(pool = 私聊图库清单) {
  // 只固定随机抽样和不参与选择的说明文本，执行生产函数的阶段、历史及轮次逻辑。
  return new Function('_', 'seededRandom', '私聊图库清单', '私聊照片提示', `${code}\nreturn 选私聊候选图;`)(
    require('lodash'), () => 0, pool, () => '图片说明',
  );
}

test('301当前单图池从L4开放，成功发送后L4和L5均不重复发送', () => {
  const pick = 加载选图();
  const pool = 本户图库('301');
  assert.equal(pool.length, 1);
  assert.equal(pick('301', 3, 1), undefined);
  const first = pick('301', 4, 1);
  assert.equal(first.id, pool[0].id);
  assert.equal(first.新一轮, false);
  for (const stage of [4, 5]) {
    assert.equal(pick('301', stage, 2, [], [first.id]), undefined);
    // 旧档缓存缺失仍可从已落地消息阻止重复。
    assert.equal(pick('301', stage, 2, [first.图], []), undefined);
  }
});

test('未落地或回档撤销的单图允许再选，选图本身不修改缓存', () => {
  const pick = 加载选图();
  const seen = [];
  const recent = [];
  const first = pick('301', 4, 1, recent, seen);
  assert.equal(pick('301', 4, 2, recent, seen).id, first.id);
  assert.deepEqual(seen, []);
  assert.deepEqual(recent, []);
  const restored = 重建已发私聊图([{ 楼: 10, 会话: '301', 发: '对方', 图: first.图 }], 9, 图库索引);
  assert.equal(pick('301', 4, 3, [], restored['301'] ?? []).id, first.id);
});

test('小图库整轮看完后排除上一张，但仍允许其他图片开始新一轮', () => {
  const pool = [
    { id: 'a', 门牌: '301', 最低阶段: 4, path: 'a.webp' },
    { id: 'b', 门牌: '301', 最低阶段: 4, path: 'b.webp' },
  ];
  const pick = 加载选图(pool);
  const next = pick('301', 4, 1, ['@adult/b.webp', '@adult/a.webp'], ['a', 'b']);
  assert.equal(next.id, 'b');
  assert.equal(next.新一轮, true);
});

test('升阶段或扩充图库后，优先发送新开放图片并保留旧轮次', () => {
  const pool = [
    { id: 'a', 门牌: '301', 最低阶段: 4, path: 'a.webp' },
    { id: 'b', 门牌: '301', 最低阶段: 5, path: 'b.webp' },
  ];
  const pick = 加载选图(pool);
  assert.equal(pick('301', 4, 1, ['@adult/a.webp'], ['a']), undefined);
  const next = pick('301', 5, 2, ['@adult/a.webp'], ['a']);
  assert.equal(next.id, 'b');
  assert.equal(next.新一轮, false);
  assert.equal(pick('301', 2, 3), undefined);
});

test('私聊图库 ID 与路径保持一一对应', () => {
  assert.equal(new Set(私聊图库清单.map(项 => 项.id)).size, 私聊图库清单.length);
  assert.equal(new Set(私聊图库清单.map(项 => 项.path)).size, 私聊图库清单.length);
});

test('只根据截止楼仍存活的对方图片消息重建当前轮', () => {
  const [图A, 图B, 图C] = 本户图库('101');
  const 消息 = [
    { 楼: 10, 会话: '101', 发: '对方', 图: 图地址(图A) },
    { 楼: 20, 会话: '101', 发: '对方', 图: 图地址(图B) },
    { 楼: 30, 会话: '101', 发: '对方', 图: 图地址(图C) },
    { 楼: 9, 会话: '101', 发: '我', 图: 图地址(图C) },
    { 楼: 9, 会话: '102', 发: '对方', 图: 图地址(图A) },
    { 楼: 9, 会话: '101', 发: '对方', 图: '@adult/不存在.webp' },
  ];

  assert.deepEqual(重建已发私聊图(消息, 20, 图库索引), { 101: [图A.id, 图B.id] });
});

test('遇到同一图片再次出现时从该图开始新一轮', () => {
  const [图A, 图B, 图C] = 本户图库('101');
  const 消息 = [
    { 楼: 10, 会话: '101', 发: '对方', 图: 图地址(图A) },
    { 楼: 20, 会话: '101', 发: '对方', 图: 图地址(图B) },
    { 楼: 30, 会话: '101', 发: '对方', 图: 图地址(图C) },
    { 楼: 40, 会话: '101', 发: '对方', 图: 图地址(图B) },
  ];

  assert.deepEqual(重建已发私聊图(消息, 25, 图库索引), { 101: [图A.id, 图B.id] });
  assert.deepEqual(重建已发私聊图(消息, 35, 图库索引), { 101: [图A.id, 图B.id, 图C.id] });
  assert.deepEqual(重建已发私聊图(消息, 45, 图库索引), { 101: [图B.id] });
});

test('扩充图库后仍延续本轮，直到已有 ID 再次出现', () => {
  const [图A, 图B, 图C, 图D, 图E] = 本户图库('101');
  const 消息 = [图A, 图B, 图C, 图D, 图E, 图A].map((项, index) => ({
    楼: (index + 1) * 10,
    会话: '101',
    发: '对方',
    图: 图地址(项),
  }));

  assert.deepEqual(重建已发私聊图(消息, 50, 图库索引), {
    101: [图A.id, 图B.id, 图C.id, 图D.id, 图E.id],
  });
  assert.deepEqual(重建已发私聊图(消息, 60, 图库索引), { 101: [图A.id] });
});

test('各户独立记轮，并忽略回档点之后的晚写消息', () => {
  const [图101A, 图101B] = 本户图库('101');
  const [图102A] = 本户图库('102');
  const 消息 = [
    { 楼: 10, 会话: '101', 发: '对方', 图: 图地址(图101A) },
    { 楼: 12, 会话: '102', 发: '对方', 图: 图地址(图102A) },
    { 楼: 80, 会话: '101', 发: '对方', 图: 图地址(图101B) },
  ];

  assert.deepEqual(重建已发私聊图(消息, 20, 图库索引), {
    101: [图101A.id],
    102: [图102A.id],
  });
});
