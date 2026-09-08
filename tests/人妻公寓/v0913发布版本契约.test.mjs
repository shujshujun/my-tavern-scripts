/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.91.3 游戏版本、组卡标签、入口与数据版本保持一致', () => {
  const 依赖版本 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 入口 = 读('src/人妻公寓/新窗口入口_精简.md');
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91.3_2026-09-09.md');
  assert.match(依赖版本, /当前游戏版本 = '0\.91\.3'/);
  assert.match(组卡, /const 版本 = '0\.91\.3'/);
  assert.match(组卡, /const TAG = 'rq0\.91\.3'/);
  assert.match(组卡, /支持继承 v0\.80～v0\.91\.2 存档/);
  assert.match(入口, /v0\.91\.3／rq0\.91\.3/);
  assert.match(发布说明, /发布标签：`rq0\.91\.3`/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.91.3 组卡门禁拒绝旧客户端、混合版本和错误标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.91.3', 标签: 'rq0.91.3' }), 'RQGY_GAME_VERSION:0.91.3');
  assert.equal(
    校验客户端构建版本('RQGY_GAME_VERSION:0.91.3', '0.91.3'),
    'RQGY_GAME_VERSION:0.91.3',
  );
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.2', '0.91.3'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.2 RQGY_GAME_VERSION:0.91.3', '0.91.3'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.91.3', 标签: 'rq0.91.2' }), /不一致/);
});

test('0.91.3 把回合完成后的手机节拍延迟到时间写入租约释放之后', () => {
  const 源码 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const 开始 = 源码.indexOf("eventOn('人妻公寓:回合完成'");
  const 结束 = 源码.indexOf("\n\n  eventOn('人妻公寓:布设摄像头'", 开始);
  assert.ok(开始 >= 0 && 结束 > 开始, '必须能定位回合完成监听');
  const 监听 = 源码.slice(开始, 结束);
  assert.match(监听, /queueMicrotask\(\(\) => void 手机节拍\(\)\)/);
  assert.doesNotMatch(监听, /^\s*void 手机节拍\(\);$/m);
  assert.match(监听, /时间推进\/撤销会在本事件返回后的 finally 才释放运行期写入租约/);
});
