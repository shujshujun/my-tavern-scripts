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

test('v0.89 发布候选：游戏检测、角色卡展示与代码入口统一锁定 rq0.89', () => {
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  assert.equal(当前游戏版本, '0.89');
  assert.match(组卡, /const TAG = 'rq0\.89'/);
  assert.match(组卡, /const 版本 = '0\.89'/);
  assert.doesNotMatch(组卡, /const TAG = 'rq0\.88'/);
});

test('v0.87 后兼容修正：正文舞台只显示纯文本，不复制酒馆 HTML/CSS/动画', () => {
  const 客户端 = 读('src/人妻公寓/界面/客户端/App.vue');
  const 正文卷轴 = 读('src/人妻公寓/界面/客户端/components/正文卷轴.vue');
  const 类型 = 读('src/人妻公寓/界面/客户端/types.ts');
  assert.doesNotMatch(客户端, /获取酒馆已渲染消息HTML|净化正文舞台HTML|过酒馆正则|玩家正则表/);
  assert.doesNotMatch(`${客户端}\n${正文卷轴}\n${类型}`, /渲染HTML|v-html="条\.渲染HTML"/);
  assert.match(客户端, /提取正文舞台文本/);
  assert.match(客户端, /检测AI输出美化正则/);
  assert.match(客户端, /关闭这些美化正则/);
});

test('v0.87 发布：数据版本保持9并继续接受v9存档', () => {
  assert.equal(当前MVU数据版本, 9);
  assert.doesNotThrow(() => 验证当前MVU存档版本({ 系统: { _数据版本: 9 } }));
});
