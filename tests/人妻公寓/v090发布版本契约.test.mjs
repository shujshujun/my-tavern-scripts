/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import { 客户端构建版本标记, 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

function 载入TypeScript(路径) {
  const js = ts.transpileModule(读(路径), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('require', 'module', 'exports', js)(require, module, module.exports);
  return module.exports;
}

test('v0.90 发布统一版本、标签与客户端构建标记', () => {
  const 依赖版本源 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 首次准备源 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');
  const 组卡源 = 读('src/人妻公寓/组卡.mjs');
  assert.match(依赖版本源, /当前游戏版本 = '0\.90'/);
  assert.match(依赖版本源, /游戏版本构建标记 = `RQGY_GAME_VERSION:\$\{当前游戏版本\}`/);
  assert.match(首次准备源, /游戏版本构建标记/);
  assert.match(首次准备源, /:data-game-build="游戏版本构建标记"/);
  assert.match(组卡源, /const 版本 = '0\.90'/);
  assert.match(组卡源, /const TAG = 'rq0\.90'/);
  assert.match(组卡源, /校验发布版本一致\(\{ 版本, 标签: TAG \}\)/);
  assert.match(组卡源, /校验客户端构建版本\(readFileSync\(客户端构建路径, 'utf8'\), 版本\)/);
});

test('本地与官方同为 0.90 时视为相同，不产生游戏更新提示', () => {
  const { 比较稳定版本 } = 载入TypeScript('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 首次准备源 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');
  assert.equal(比较稳定版本('0.90', '0.90'), '相同');
  assert.match(首次准备源, /if \(游戏版本关系\.value === '当前较旧'\) \{\s*更新项\.push/);
  assert.doesNotMatch(首次准备源, /游戏版本关系\.value === '相同'[\s\S]{0,120}更新项\.push/);
});

test('组卡门禁拒绝旧客户端、缺失标记、多版本混包和标签不一致', () => {
  const 当前标记 = 客户端构建版本标记('0.90');
  assert.equal(当前标记, 'RQGY_GAME_VERSION:0.90');
  assert.equal(校验发布版本一致({ 版本: '0.90', 标签: 'rq0.90' }), 当前标记);
  assert.equal(校验客户端构建版本(`<script>${当前标记}</script>`, '0.90'), 当前标记);

  assert.throws(() => 校验发布版本一致({ 版本: '0.90', 标签: 'rq0.89' }), /标签.*不一致/);
  assert.throws(() => 校验客户端构建版本('<script>RQGY_GAME_VERSION:0.89</script>', '0.90'), /客户端构建版本不一致/);
  assert.throws(() => 校验客户端构建版本('<script>没有版本标记</script>', '0.90'), /未找到构建标记/);
  assert.throws(
    () => 校验客户端构建版本('<script>RQGY_GAME_VERSION:0.89 RQGY_GAME_VERSION:0.90</script>', '0.90'),
    /客户端构建版本不一致/,
  );
});
