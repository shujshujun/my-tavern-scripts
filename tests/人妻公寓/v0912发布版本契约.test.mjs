/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.91.2 游戏版本、组卡标签、入口与数据版本保持一致', () => {
  const 依赖版本 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 入口 = 读('src/人妻公寓/新窗口入口_精简.md');
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91.2_2026-09-09.md');
  assert.match(依赖版本, /当前游戏版本 = '0\.91\.2'/);
  assert.match(组卡, /const 版本 = '0\.91\.2'/);
  assert.match(组卡, /const TAG = 'rq0\.91\.2'/);
  assert.match(组卡, /支持继承 v0\.80～v0\.91 存档/);
  assert.match(入口, /v0\.91\.2／rq0\.91\.2/);
  assert.match(发布说明, /发布标签：`rq0\.91\.2`/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.91.2 组卡门禁拒绝旧客户端、混合版本和错误标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.91.2', 标签: 'rq0.91.2' }), 'RQGY_GAME_VERSION:0.91.2');
  assert.equal(
    校验客户端构建版本('RQGY_GAME_VERSION:0.91.2', '0.91.2'),
    'RQGY_GAME_VERSION:0.91.2',
  );
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.91', '0.91.2'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.91 RQGY_GAME_VERSION:0.91.2', '0.91.2'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.91.2', 标签: 'rq0.91' }), /不一致/);
});

test('0.91.2 包含内部删楼跨界面时间线热修，并保留真实删除栅栏', () => {
  const 数据库桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  assert.match(数据库桥, /已有共享栅栏覆盖时不重标/);
  assert.match(
    数据库桥,
    /MESSAGE_DELETED[\s\S]{0,500}标记数据库时间线将变更\(当前末楼\(\), '删除消息', \{ 已有共享栅栏覆盖时不重标: true \}\)/,
  );
  assert.match(数据库桥, /即使共享栅栏已经由另一个 iframe 建立，本实例自己的异步写世代仍必须单独作废/);
});
