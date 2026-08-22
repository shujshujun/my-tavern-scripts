/* eslint-disable import-x/no-nodejs-modules -- Node-only release candidate test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 客户端构建版本标记, 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 依赖版本源 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
const 首次准备源 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');
const 组卡源 = 读('src/人妻公寓/组卡.mjs');

test('v0.89 发布候选统一版本、标签与客户端构建标记', () => {
  assert.match(依赖版本源, /当前游戏版本 = '0\.89'/);
  assert.match(依赖版本源, /游戏版本构建标记 = `RQGY_GAME_VERSION:\$\{当前游戏版本\}`/);
  assert.match(首次准备源, /游戏版本构建标记/);
  assert.match(首次准备源, /:data-game-build="游戏版本构建标记"/);
  assert.match(组卡源, /const 版本 = '0\.89'/);
  assert.match(组卡源, /const TAG = 'rq0\.89'/);
  assert.match(组卡源, /校验发布版本一致\(\{ 版本, 标签: TAG \}\)/);
  assert.match(组卡源, /校验客户端构建版本\(readFileSync\(客户端构建路径, 'utf8'\), 版本\)/);
});

test('组卡门禁拒绝旧客户端、缺失标记、多版本混包和标签不一致', () => {
  const 当前标记 = 客户端构建版本标记('0.89');
  assert.equal(当前标记, 'RQGY_GAME_VERSION:0.89');
  assert.equal(校验发布版本一致({ 版本: '0.89', 标签: 'rq0.89' }), 当前标记);
  assert.equal(校验客户端构建版本(`<script>${当前标记}</script>`, '0.89'), 当前标记);

  assert.throws(() => 校验发布版本一致({ 版本: '0.89', 标签: 'rq0.88' }), /标签.*不一致/);
  assert.throws(() => 校验客户端构建版本('<script>RQGY_GAME_VERSION:0.88</script>', '0.89'), /客户端构建版本不一致/);
  assert.throws(() => 校验客户端构建版本('<script>没有版本标记</script>', '0.89'), /未找到构建标记/);
  assert.throws(
    () => 校验客户端构建版本('<script>RQGY_GAME_VERSION:0.88 RQGY_GAME_VERSION:0.89</script>', '0.89'),
    /客户端构建版本不一致/,
  );
});
