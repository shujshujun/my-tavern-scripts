/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
let vars = {};
globalThis.getVariables = () => vars;
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 构造AI可写变量范围, 构造AI可写变量视图 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');

function setup() {
  const data = Schema.parse({ 户: { 101: 创建户节点(4), 102: 创建户节点(4), 201: 创建户节点(4) } });
  vars = { _场景: { 房间id: '管理员室', 进房末楼: 8 }, _粘滞: { 位置: '管理员室', 楼: 8, 们: ['101'], 夫们: ['102'] } };
  return data;
}

for (const [label, people] of [
  ['妻焦点', { 焦点: ['101'], 在场: [], 妻在场: ['101'], 夫在场: [] }],
  ['丈夫焦点', { 焦点: ['102'], 在场: [], 妻在场: [], 夫在场: ['102'] }],
  ['无主要对手', { 焦点: [], 在场: [], 妻在场: [], 夫在场: [] }],
  ['同场旁观', { 焦点: ['101'], 在场: ['102'], 妻在场: ['101'], 夫在场: ['102'] }],
]) {
  test(`S15 ${label}的正文快照只描述现场职责，变量范围仍由独立构造器决定`, () => {
    const data = setup();
    const before = structuredClone(data);
    const options = { 只读: false, 亲密场景: false };
    const scopeBefore = 构造AI可写变量范围(data, people.焦点, people.妻在场, people.夫在场, options);
    const viewBefore = 构造AI可写变量视图(data, scopeBefore);
    const text = 组公寓快照([{ role: 'user', content: '聊聊今天的日常安排。' }], data, 10, '', people);
    assert.equal(/只可更新|同步更新夫\.|数值都不得更新|数值禁改|变量禁止更新/.test(text), false,
      '正文快照仍在给表演模型分派变量更新职责');
    assert.ok(text.includes('【焦点】'));
    assert.deepEqual(构造AI可写变量视图(data, 构造AI可写变量范围(data, people.焦点, people.妻在场, people.夫在场, options)), viewBefore);
    assert.deepEqual(data, before);
  });
}

test('S15 丈夫当下心理情绪和在场关系仍能进入正文输入', () => {
  const data = setup();
  data.户['102'].夫.当前心理想法 = '想着下午尚未完成的维修。';
  data.户['102'].夫.当前情绪 = '平静';
  const text = 组公寓快照([{ role: 'user', content: '问问下午的维修。' }], data, 10, '', {
    焦点: ['102'], 在场: [], 妻在场: [], 夫在场: ['102'],
  });
  assert.ok(text.includes('下午尚未完成的维修'));
  assert.ok(text.includes('平静'));
  assert.ok(text.includes('沈静仪不在场'));
});

test('S15 场外事件关联人物仍有资料且没有获得现场演员写权', () => {
  const data = setup();
  const people = { 焦点: [], 在场: [], 妻在场: [], 夫在场: [], 私聊可召回妻: [] };
  const text = 组公寓快照([{ role: 'user', content: '继续整理账本。' }], data, 10,
    '【事件关联妻:201】许曼君曾提到整理账本。', people);
  assert.ok(text.includes('【事件关联角色】'));
  assert.ok(text.includes('他们不在玩家当前位置'));
  assert.equal(text.includes('变量禁止更新'), false);
  assert.deepEqual(构造AI可写变量范围(data, people.焦点, people.妻在场, people.夫在场, {
    只读: false, 亲密场景: false,
  }).妻, []);
});
