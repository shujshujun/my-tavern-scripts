/* eslint-disable import-x/no-nodejs-modules -- Real read-only classifiers and phone validators; no model or storage I/O. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
const { 父亲被写成已知关系 } = require('../../src/人妻公寓/脚本/游戏逻辑/父亲关系知情.ts');
const { 安全父亲台词, 验收父亲模式语义 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts');

const negativePredicates = [
  '并未真正知道', '并不真正清楚', '未曾真正察觉', '并未实际看穿',
  '并未真正地知道', '并未实际真正知道', '没有丝毫察觉', '尚未完全看穿',
];
for (const predicate of negativePredicates) {
  test(`PLAY-023 副词否定：${predicate}不签发知情`, () => {
    assert.equal(父亲被写成已知关系(`爸爸${predicate}这段秘密关系。`, '旁人'), false);
  });
  test(`PLAY-023 真实电话校验：${predicate}不误拒绝`, () => {
    const text = `我${predicate}这段秘密关系。`;
    const formatted = 安全父亲台词(text, false);
    assert.equal(formatted, text, '格式门必须真实接受，不用桩绕过');
    assert.equal(验收父亲模式语义(formatted, '双重继承后家常'), true);
  });
}
const controls = [
  ['爸爸真正知道这段秘密关系。', true],
  ['爸爸并非不知道这段秘密关系。', true],
  ['爸爸并非不真正知道这段秘密关系。', true],
  ['爸爸不是不实际清楚这段秘密关系。', true],
  ['爸爸未曾真正察觉这段秘密关系，但爸爸现在已经知道了这段秘密关系。', true],
  ['爸爸没问过同事但已经真正知道这段秘密关系。', true],
  ['爸爸问过同事但并未真正知道这段秘密关系。', false],
  ['爸爸没问过同事但妈妈已经真正知道这段秘密关系。', false],
  ['同事没问过爸爸但已经真正知道这段秘密关系。', false],
  ['爸爸的朋友没问过同事但已经真正知道这段秘密关系。', false],
  ['妈妈真正知道这段秘密关系。', false],
  ['爸爸真正知道房租已经交接。', false],
  ['爸爸并未真正知道这段秘密关系吗？', false],
  ['如果爸爸真正知道这段秘密关系。', false],
];
for (const [text, expected] of controls) {
  test(`PLAY-023 副词修复保留主语/话题/双重否定：${text}`, () => {
    assert.equal(父亲被写成已知关系(text, '旁人'), expected);
  });
}
test('PLAY-023 真实电话校验仍拒绝明确知情与双重否定知情', () => {
  for (const text of ['我真正知道这段秘密关系。', '我并非不真正知道这段秘密关系。']) {
    assert.equal(安全父亲台词(text, false), text);
    assert.equal(验收父亲模式语义(text, '双重继承后家常'), false);
  }
});
test('PLAY-023 否定副词重复调用与视角切换不缓存知情', () => {
  for (let i = 0; i < 3; i += 1) {
    assert.equal(父亲被写成已知关系('我真正知道这段秘密关系。', '父亲'), true);
    assert.equal(父亲被写成已知关系('我并未真正知道这段秘密关系。', '父亲'), false);
    assert.equal(父亲被写成已知关系('我真正知道这段秘密关系。', '旁人'), false);
  }
});
