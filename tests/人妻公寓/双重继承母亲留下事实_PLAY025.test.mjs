/* eslint-disable import-x/no-nodejs-modules -- Node-only finale regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');

const event = '【双重继承提交:K:待总钥匙归位:72:1】';
const key = '你把公寓楼总钥匙放到她那把钥匙旁边。';
const door = '母亲随后亲自关上302家门。';

test('PLAY-025 母亲明确不愿留下不能签发永久共居', () => {
  assert.match(route.双重继承正文越拍原因(event, `${key}母亲不愿意留下。${door}`), /母亲.*留下|自己的意志/u);
  assert.match(route.双重继承正文越拍原因(event, `${key}母亲拒绝留在这个家。${door}`), /母亲.*留下|自己的意志/u);
});

test('PLAY-025 条件/疑问中的“愿意留下”不是当前已经作出的选择', () => {
  assert.match(route.双重继承正文越拍原因(event, `${key}如果她愿意留下，这个家就还是原样。${door}`), /母亲.*留下|自己的意志/u);
  assert.match(route.双重继承正文越拍原因(event, `${key}母亲问自己是否愿意留下，还没有回答。${door}`), /母亲.*留下|自己的意志/u);
});

test('明确以本人意志选择留下继续通过最终三事实门', () => {
  assert.equal(route.双重继承正文越拍原因(event, `${key}母亲明确说这是她自己选择留下的家。${door}`), '');
  assert.equal(route.双重继承正文越拍原因(event, `${key}母亲亲自决定留在302。${door}`), '');
});

test('钥匙或关门事实缺失仍由各自原硬门拒绝', () => {
  assert.match(route.双重继承正文越拍原因(event, `母亲选择留下。${door}`), /总钥匙/u);
  assert.match(route.双重继承正文越拍原因(event, `${key}母亲选择留下。`), /关上302家门/u);
});

const decisions = [
  ['历史选择后离开', false, '母亲以前选择留下，但现在她决定离开这个家。'],
  ['跨句撤回', false, '母亲曾经决定留下。如今她撤回了当年的决定，选择搬离302。'],
  ['当前仍未决定', false, '母亲曾经决定留下，现在还在犹豫，没有作出决定。'],
  ['双否意愿', true, '母亲不是不愿意留下，她现在已经作出自己的选择。'],
  ['提问后本人答复', true, '你问母亲是否愿意留下，母亲当场明确决定留下。'],
  ['当前选择', true, '母亲亲自决定留下。'],
  ['明确拒绝', false, '母亲不愿意留下。'],
  ['条件选择', false, '如果母亲愿意留下，这个家就还是原样。'],
  ['当前决定后撤回', false, '母亲明确选择留下。随后她撤回了这个决定。'],
  ['历史否定不覆盖现在', true, '母亲以前不愿留下，但现在她亲自决定留在302。'],
  ['撤回后重新决定', true, '母亲撤回了旧决定，如今她选择留下。'],
  ['本人问句', false, '母亲选择留下了吗？'],
  ['同句否定后改口', true, '母亲原本不愿意留下，但她现在明确选择留下。'],
  ['选择后别人提问不撤销', true, '母亲明确选择留下。你问她愿意留下吗？'],
  ['条件撤回不推翻决定', true, '母亲明确选择留下。如果父亲反对，她就撤回这个决定。'],
  ['否定离开不撤销选择', true, '母亲明确选择留下。随后她并没有选择离开这个家。'],
  ['否定撤回不撤销选择', true, '母亲明确选择留下。她没有撤回这个决定。'],
  ['等待决定尚未作出', false, '母亲准备决定留在302。'],
  ['引述设想不是本人选择', false, '“母亲选择留下。”只是一个设想。'],
  ['否认曾说不当作选择', false, '母亲没有说过：“我愿意留下。”'],
  ['本人直接答复', true, '母亲明确说：“我选择留下。”'],
  ['确定性收束原文', true, '母亲说：“楼是他交给你的。这个家，是我自己留下来的。”'],
];
for (const [label, accepted, body] of decisions) {
  test(`PLAY025 当前最终决定：${label}`, () => {
    const reason = route.双重继承正文越拍原因(event, `${key}${body}${door}`);
    assert.equal(reason === '', accepted, `${body}\n${reason}`);
  });
}
