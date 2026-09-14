/* eslint-disable import-x/no-nodejs-modules -- Release metadata contract. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';
const read = p => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('0.92.4源码、组卡与发布工作流一致，0.92.3历史工作流冻结', () => {
  assert.match(read('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts'), /当前游戏版本 = '0\.92\.4'/);
  const card = read('src/人妻公寓/组卡.mjs');
  assert.match(card, /const 版本 = '0\.92\.4'/);
  assert.match(card, /const TAG = 'rq0\.92\.4'/);
  const workflow = read('.github/workflows/publish-rq0924.yml');
  assert.match(workflow, /ref: rq0\.92\.4/);
  for (const name of ['rqgy-0.92.4.png', 'rqgy-0.92.4.json', 'rqgy-0.92.4-checksums.json']) assert.ok(workflow.includes(name));
  assert.doesNotMatch(workflow, /database-rq/);
  assert.match(read('.github/workflows/publish-rq0923.yml'), /ref: rq0\.92\.3/);
  assert.match(read('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.92.4拒绝旧构建、混包与错误代码标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.92.4', 标签: 'rq0.92.4' }), 'RQGY_GAME_VERSION:0.92.4');
  assert.equal(校验客户端构建版本('RQGY_GAME_VERSION:0.92.4', '0.92.4'), 'RQGY_GAME_VERSION:0.92.4');
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.92.3', '0.92.4'));
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.92.3 RQGY_GAME_VERSION:0.92.4', '0.92.4'));
  assert.throws(() => 校验发布版本一致({ 版本: '0.92.4', 标签: 'rq0.92.3' }));
});

test('0.92.4更新说明包含本批修复与旧档升级方式', () => {
  const notes = read('src/人妻公寓/发布说明_v0.92.4_2026-09-14.md');
  for (const text of ['回国姐妹群', '母子身份', '楼务群', '无需重买', '单图', '官方渠道', '完整刷新', '无需重开']) assert.ok(notes.includes(text), text);
});
