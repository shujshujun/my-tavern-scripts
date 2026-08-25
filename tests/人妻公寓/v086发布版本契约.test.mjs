/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const { 当前MVU数据版本, 验证当前MVU存档版本 } = require('../../src/人妻公寓/schema.ts');
const { 当前游戏版本 } = require('../../src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('v0.86 后续发布：游戏检测、角色卡展示与代码入口统一锁定当前 rq0.90.3', () => {
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  assert.equal(当前游戏版本, '0.90.3');
  assert.match(组卡, /const TAG = 'rq0\.90\.3'/);
  assert.match(组卡, /const 版本 = '0\.90\.3'/);
  assert.match(组卡, /支持继承 v0\.80～v0\.90\.2 存档/);
  assert.match(组卡, /真正未完成的输出显示为未结算残稿/);
  assert.doesNotMatch(组卡, /const TAG = 'rq0\.90\.1';/);
});

test('v0.86 发布：借种结局图片统一锁定 CG 仓库不可变标签 cg4', () => {
  const 客户端素材 = 读('src/人妻公寓/界面/客户端/assets.ts');
  const 手机素材 = 读('src/人妻公寓/脚本/游戏逻辑/手机/壳/资源与皮肤.ts');
  const 路径 = /https:\/\/testingcf\.jsdelivr\.net\/gh\/shujun8520-design\/qgy-assets@cg4\/cg1\/borrow-seed-ending/;
  assert.match(客户端素材, 路径);
  assert.match(手机素材, 路径);
  assert.doesNotMatch(`${客户端素材}\n${手机素材}`, /my-tavern-scripts@rq0\.85\/output\/imagegen\/borrow-seed-ending/);
});

test('v0.86 发布：数据版本保持9并直接接受0.85的v9存档', () => {
  assert.equal(当前MVU数据版本, 9);
  assert.doesNotThrow(() => 验证当前MVU存档版本({ 系统: { _数据版本: 9 } }));
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 6 } }), /数据版本 7、8 和 9/);
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 10 } }), /数据版本 7、8 和 9/);
});

test('v0.86 发布：发布说明、分支、标签与怀孕语义已转为正式状态', () => {
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.86_2026-08-22.md');
  assert.match(发布说明, /发布分支：`release\/rq086`/);
  assert.match(发布说明, /发布标签：`rq0\.86`/);
  assert.match(发布说明, /存档数据版本：`9`/);
  assert.match(发布说明, /有效完成并提交后确定怀孕/);
  assert.match(发布说明, /qgy-assets@cg4/);
  assert.doesNotMatch(发布说明, /发布候选|尚未 commit|正式发布前剩余动作/);
});
