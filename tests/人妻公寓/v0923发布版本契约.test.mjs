/* eslint-disable import-x/no-nodejs-modules -- Release metadata and compatibility contract. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';
const read = file => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('0.92.3版本、双代码入口、发布工作流一致，历史0.92.2冻结', () => {
  assert.match(read('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts'), /当前游戏版本 = '0\.92\.4'/);
  const card = read('src/人妻公寓/组卡.mjs');
  assert.match(card, /const 版本 = '0\.92\.4'/);
  assert.match(card, /const TAG = 'rq0\.92\.4'/);
  assert.match(card, /my-tavern-scripts@\$\{TAG\}/);
  assert.match(read('src/人妻公寓/归档/新窗口入口_2026-09-14.md').slice(0, 180), /当前正式入口：v0\.92\.3／rq0\.92\.3/);
  const workflow = read('.github/workflows/publish-rq0923.yml');
  assert.match(workflow, /ref: rq0\.92\.3/);
  for (const name of ['rqgy-0.92.3.png', 'rqgy-0.92.3.json', 'rqgy-0.92.3-checksums.json']) assert.ok(workflow.includes(name), name);
  assert.doesNotMatch(workflow, /database-rq/);
  assert.match(read('.github/workflows/publish-rq0922.yml'), /ref: rq0\.92\.2/);
  assert.match(read('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.92.3组卡拒绝旧客户端、混包与错误标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.92.3', 标签: 'rq0.92.3' }), 'RQGY_GAME_VERSION:0.92.3');
  assert.equal(校验客户端构建版本('RQGY_GAME_VERSION:0.92.3', '0.92.3'), 'RQGY_GAME_VERSION:0.92.3');
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.92.2', '0.92.3'));
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.92.2 RQGY_GAME_VERSION:0.92.3', '0.92.3'));
  assert.throws(() => 校验发布版本一致({ 版本: '0.92.3', 标签: 'rq0.92.2' }));
});

test('0.92.3说明包含官方数据库、裂缝保留、控制动作及正文误判修复', () => {
  const notes = read('src/人妻公寓/发布说明_v0.92.3_2026-09-13.md');
  for (const text of ['官方公开接口', '只有0楼', '三次失败', '已打开裂缝', '暂缓／撤回许可', '误判', '无需重开', '没有备份']) assert.ok(notes.includes(text), text);
});
