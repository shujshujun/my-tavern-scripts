/* eslint-disable import-x/no-nodejs-modules -- Real read-only message projection and quote validation. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json']; delete require.extensions['.json']; require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 编译角色跨渠道见闻, 读取角色跨渠道见闻 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信跨渠道见闻.ts');
const { 创建微信消息定位 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信消息引用.ts');
const { 解析姐妹群阶段回复 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群阶段验收.ts');
const wife = 户静态表['201'].妻名;
const message = (extra = {}) => ({ 楼: 5, 时: 20, 序: 12, 标识: 'stable-player-message', 会话: '姐妹群', 发: '我', 文: '待会整理相框。', 接收门牌: ['201'], ...extra });
const render = (库, name) => 编译角色跨渠道见闻(库, [{ 门牌: '201', 人物: wife }], 5, 20, new Set(), { 玩家姓名: name });

for (const name of ['林舟', 'Alex Chen', '阿舟🌿', 'A$&B']) {
  test(`当前Persona ${name} 的见闻署名能通过同源引用验收`, () => {
    const record = message(); const 库 = { 消息: [record], 圈: [] };
    const before = structuredClone(库);
    assert.ok(render(库, name).includes(`${name}:待会整理相框。`));
    const shown = 读取角色跨渠道见闻(库, '201', 5, 20, new Set(), name)[0].文;
    const result = 解析姐妹群阶段回复(`${wife}:「引用 ${shown}」我也记下了。`, ['201'], 库.消息, 5, 20, name, false);
    assert.deepEqual(result?.引用, 创建微信消息定位(record));
    assert.deepEqual(库, before);
  });
}

test('改名仅重渲染结构化署名，消息标识、正文中的玩家二字和旧摘要不变', () => {
  const 库 = { 消息: [message({ 文: '保留正文中的“玩家”二字。' })], 圈: [], 旧摘要: '玩家:旧摘要原文。' };
  const before = structuredClone(库);
  assert.ok(render(库, '林舟').includes('林舟:保留正文中的“玩家”二字。'));
  assert.ok(render(库, '阿舟').includes('阿舟:保留正文中的“玩家”二字。'));
  assert.deepEqual(库, before);
});

test('引用预览也使用当前姓名，撤回原消息不会由旧引用重新带回', () => {
  const original = message();
  const reply = message({ 发: '对方', 序: 13, 标识: 'wife-reply', 文: `${wife}:我记住了。`, 引用: 创建微信消息定位(original) });
  const 库 = { 消息: [original, reply], 圈: [] };
  assert.ok(render(库, '林舟').includes('引用 林舟: 待会整理相框。'));
  original.类 = '撤回';
  const text = render(库, '林舟');
  assert.ok(text.includes('原消息已撤回'));
  assert.equal(text.includes('待会整理相框。'), false);
});

test('改名不扩大实际接收范围，也不允许跨会话引用', () => {
  assert.equal(render({ 消息: [message({ 接收门牌: ['102'] })], 圈: [] }, '林舟'), '');
  const 库 = { 消息: [message({ 会话: '群' })], 圈: [] };
  assert.ok(render(库, '林舟').includes('林舟:待会整理相框。'));
  assert.equal(解析姐妹群阶段回复(`${wife}:「引用 林舟: 待会整理相框。」我记下了。`, ['201'], 库.消息, 5, 20, '林舟', false), null);
});
