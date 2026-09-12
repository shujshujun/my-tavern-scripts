/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.92.2历史发布说明和工作流保留，当前源码版本前进到0.92.2', () => {
  const 依赖版本 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 入口 = 读('src/人妻公寓/新窗口入口_精简.md');
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.92.1_2026-09-12.md');
  const 工作流 = 读('.github/workflows/publish-rq0921.yml');

  assert.match(依赖版本, /当前游戏版本 = '0\.92\.2'/);
  assert.match(组卡, /const 版本 = '0\.92\.2'/);
  assert.match(组卡, /const TAG = 'rq0\.92\.2'/);
  assert.match(组卡, /支持继承 v0\.80～v0\.92 存档，无需重开/);
  assert.match(组卡, /v0\.92 把即时业务捕获阶段尚未登记场景事务的准备票误当成完整撤回记录/);
  assert.match(组卡, /my-tavern-scripts@\$\{TAG\}/);
  assert.match(入口, /当前正式入口：v0\.92\.1／rq0\.92\.1/);
  assert.match(入口, /发布说明_v0\.92\.1_2026-09-12\.md/);
  assert.match(入口, /v0\.92 存档可直接继续/);
  assert.match(发布说明, /发布分支：`release\/rq0921`/);
  assert.match(发布说明, /发布标签：`rq0\.92\.1`/);
  assert.match(发布说明, /角色卡版本：`0\.92\.1`/);
  assert.match(发布说明, /v0\.83～v0\.92\(v9\) 可直接继续/);
  assert.match(工作流, /name: publish-rq0921/);
  assert.match(工作流, /- release\/rq0921/);
  assert.match(工作流, /ref: rq0\.92\.1/);
  assert.match(工作流, /rqgy-0\.92\.1\.png/);
  assert.match(工作流, /rqgy-0\.92\.1\.json/);
  assert.match(工作流, /rqgy-0\.92\.1-checksums\.json/);
  assert.match(工作流, /发布说明_v0\.92\.1_2026-09-12\.md/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.92.1 组卡门禁拒绝旧客户端、多版本混包和错误标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.92.1', 标签: 'rq0.92.1' }), 'RQGY_GAME_VERSION:0.92.1');
  assert.equal(校验客户端构建版本('RQGY_GAME_VERSION:0.92.1', '0.92.1'), 'RQGY_GAME_VERSION:0.92.1');
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.92', '0.92.1'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.92 RQGY_GAME_VERSION:0.92.1', '0.92.1'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.92.1', 标签: 'rq0.92' }), /不一致/);
});

test('0.92.1 只让捕获阶段准备票核对业务前指纹，完整撤回记录边界保持严格', () => {
  const 模块 = 读('src/人妻公寓/脚本/游戏逻辑/即时业务撤回.ts');
  const 回归 = 读('tests/人妻公寓/即时业务完整撤回.test.mjs');
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.92.1_2026-09-12.md');

  assert.match(模块, /function 读取即时业务前数据指纹\(value: unknown\): string/);
  assert.match(模块, /const record = 读取即时业务撤回记录\(value\);\s*if \(record\) return record\.业务前数据指纹/);
  assert.match(模块, /const 业务前数据 = Schema\.parse\(_\.cloneDeep\(value\.业务前数据\)\) as SchemaType/);
  assert.match(模块, /return 指纹 === value\.业务前数据指纹 \? 指纹 : ''/);
  assert.match(模块, /export function 即时业务锚仍是业务前状态/);
  assert.match(回归, /读取即时业务撤回记录\(准备\), null/);
  assert.match(回归, /正常入口准备票必须通过业务前锚核对/);
  assert.match(回归, /被篡改准备/);
  assert.match(发布说明, /准备票仍不能冒充完整撤回记录/);
  assert.match(发布说明, /普通重掷仍只重演正文，不退款/);
});

test('0.92.1 更新关系覆盖0.92玩家且旧0.92发布资产保持冻结', () => {
  const 依赖测试 = 读('tests/人妻公寓/依赖版本检测.test.mjs');
  const 旧说明 = 读('src/人妻公寓/发布说明_v0.92_2026-09-12.md');
  const 旧工作流 = 读('.github/workflows/publish-rq092.yml');

  assert.match(依赖测试, /比较稳定版本\('0\.92', '0\.92\.1'\), '当前较旧'/);
  assert.match(依赖测试, /比较稳定版本\('0\.92\.1', '0\.92\.1'\), '相同'/);
  assert.match(依赖测试, /比较稳定版本\('0\.92\.1', '0\.92'\), '当前较新'/);
  assert.match(旧说明, /发布标签：`rq0\.92`/);
  assert.match(旧说明, /角色卡版本：`0\.92`/);
  assert.match(旧工作流, /ref: rq0\.92/);
  assert.match(旧工作流, /rqgy-0\.92\.png/);
  assert.doesNotMatch(旧工作流, /rq0\.92\.1/);
});
