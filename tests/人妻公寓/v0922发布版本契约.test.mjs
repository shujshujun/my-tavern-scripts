/* eslint-disable import-x/no-nodejs-modules -- Release metadata and compatibility contract. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';
const read = file => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('0.92.2源码、角色卡、发布工作流和入口使用同一版本，旧发布标签保持冻结', () => {
  assert.match(read('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts'), /当前游戏版本 = '0\.92\.2'/);
  const card = read('src/人妻公寓/组卡.mjs');
  assert.match(card, /const 版本 = '0\.92\.2'/);
  assert.match(card, /const TAG = 'rq0\.92\.2'/);
  assert.match(card, /本发布附件的数据库兼容修复脚本/);
  assert.match(read('src/人妻公寓/新窗口入口_精简.md').slice(0, 180), /当前正式入口：v0\.92\.2／rq0\.92\.2/);
  const workflow = read('.github/workflows/publish-rq0922.yml');
  assert.match(workflow, /ref: rq0\.92\.2/);
  for (const name of ['rqgy-0.92.2.png', 'rqgy-0.92.2.json', 'rqgy-0.92.2-checksums.json', 'database-rq0922.json', 'database-rq0922-source.zip']) {
    assert.ok(workflow.includes(name), name);
  }
  assert.match(read('.github/workflows/publish-rq0921.yml'), /ref: rq0\.92\.1/);
  assert.match(read('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.92.2组卡拒绝旧构建、混包与错误标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.92.2', 标签: 'rq0.92.2' }), 'RQGY_GAME_VERSION:0.92.2');
  assert.equal(校验客户端构建版本('RQGY_GAME_VERSION:0.92.2', '0.92.2'), 'RQGY_GAME_VERSION:0.92.2');
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.92.1', '0.92.2'));
  assert.throws(() => 校验发布版本一致({ 版本: '0.92.2', 标签: 'rq0.92.1' }));
});

test('0.92.2发布说明覆盖三类修复和配套数据库安装要求', () => {
  const notes = read('src/人妻公寓/发布说明_v0.92.2_2026-09-13.md');
  for (const text of ['回档', '送礼', '说明你会怎样参与', '说明你与她今后的关系', '只运行一个数据库实例', '非官方兼容修复版', '不能保证自动恢复']) {
    assert.ok(notes.includes(text), text);
  }
});
