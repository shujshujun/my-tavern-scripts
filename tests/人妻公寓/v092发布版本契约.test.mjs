/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.92 游戏版本、组卡标签、入口、发布说明、工作流规划与数据版本保持一致', () => {
  const 依赖版本 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 入口 = 读('src/人妻公寓/新窗口入口_精简.md');
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.92_2026-09-12.md');
  const 工作流 = 读('.github/workflows/publish-rq092.yml');

  assert.match(依赖版本, /当前游戏版本 = '0\.92'/);
  assert.match(组卡, /const 版本 = '0\.92'/);
  assert.match(组卡, /const TAG = 'rq0\.92'/);
  assert.match(组卡, /支持继承 v0\.80～v0\.91\.6 存档/);
  assert.match(组卡, /my-tavern-scripts@\$\{TAG\}/);
  assert.match(入口, /v0\.92／规划标签 rq0\.92/);
  assert.match(入口, /发布说明_v0\.92_2026-09-12\.md/);
  assert.match(入口, /未创建或推送 rq0\.92/);
  assert.match(发布说明, /发布分支规划：`release\/rq092`/);
  assert.match(发布说明, /发布标签规划：`rq0\.92`/);
  assert.match(发布说明, /角色卡版本：`0\.92`/);
  assert.match(发布说明, /v0\.83～v0\.91\.6\(v9\) 可直接继续/);
  assert.match(发布说明, /尚未创建或推送 `rq0\.92`/);
  assert.match(工作流, /name: publish-rq092/);
  assert.match(工作流, /- release\/rq092/);
  assert.match(工作流, /ref: rq0\.92/);
  assert.match(工作流, /rqgy-0\.92\.png/);
  assert.match(工作流, /rqgy-0\.92\.json/);
  assert.match(工作流, /rqgy-0\.92-checksums\.json/);
  assert.match(工作流, /发布说明_v0\.92_2026-09-12\.md/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.92 组卡门禁拒绝旧客户端、多版本混包和错误标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.92', 标签: 'rq0.92' }), 'RQGY_GAME_VERSION:0.92');
  assert.equal(校验客户端构建版本('RQGY_GAME_VERSION:0.92', '0.92'), 'RQGY_GAME_VERSION:0.92');
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.6', '0.92'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.6 RQGY_GAME_VERSION:0.92', '0.92'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.92', 标签: 'rq0.91.6' }), /不一致/);
});

test('0.92 锁定第二机位未来事实、提供方拒答无处罚账与录像带事实门', () => {
  const 第二机位 = 读('src/人妻公寓/脚本/游戏逻辑/第二机位系统.ts');
  const 资源 = 读('src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
  const 回合 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 录像带 = 读('src/人妻公寓/脚本/游戏逻辑/录像带V4运行时.ts');

  assert.match(第二机位, /function 门缝前段存在现场事实/);
  assert.match(第二机位, /屋内余波混入了尚未发生的设备、录制、母带或共享结局后续/);
  assert.match(第二机位, /摆着\|正对着\|朝向\|朝着/);
  assert.match(资源, /跳过亲密结算\?: boolean/);
  assert.match(资源, /if \(输入\.跳过亲密结算\)/);
  assert.match(回合, /跳过亲密结算: 使用无处罚拒绝兜底/);
  assert.match(录像带, /提供方拒答/);
  assert.match(录像带, /录像带V4/);
});

test('0.92 锁定微信去模板、引用降级、数据库告警去重与不再留门确认接线', () => {
  const 自然度 = 读('src/人妻公寓/脚本/游戏逻辑/手机/私聊自然度.ts');
  const 引用 = 读('src/人妻公寓/脚本/游戏逻辑/微信消息引用.ts');
  const 数据库 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  const 入口 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');

  assert.match(自然度, /最近角色消息上限 = 6/);
  assert.match(自然度, /通常最多从这些元素中选一至两项/);
  assert.match(自然度, /不要改写或复述玩家原话充当开场/);
  assert.match(引用, /引用失配时保留回复\?: boolean/);
  assert.match(引用, /识别无标记引用\?: boolean/);
  assert.match(引用, /引用已降级\?: true/);
  assert.match(数据库, /同一聊天、同一恢复令牌的超时只由宿主打印一次/);
  assert.match(入口, /eventEmit\('人妻公寓:继续场景剧情', \{ 不再留门确认: true \}\)/);
});

test('0.92 锁定即时业务普通重掷保留与完整撤回前态恢复', () => {
  const 模块 = 读('src/人妻公寓/脚本/游戏逻辑/即时业务撤回.ts');
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 入口 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');

  assert.match(模块, /export const 即时业务撤回键 = '_即时业务撤回'/);
  assert.match(模块, /业务前数据指纹/);
  assert.match(模块, /业务后数据指纹/);
  assert.match(模块, /锚稳定令牌指纹/);
  assert.match(模块, /锚分支指纹/);
  assert.match(引擎, /export function 捕获即时业务撤回准备/);
  assert.match(引擎, /export async function 登记即时业务撤回准备/);
  assert.match(引擎, /export async function 确认即时业务撤回已提交/);
  assert.match(引擎, /function 准备恢复即时业务撤回/);
  assert.match(引擎, /恢复即时业务数据: 完整撤回记录槽\.当前\.业务前数据/);
  assert.match(引擎, /恢复精确回合变量: 完整撤回记录槽\.当前/);
  assert.match(入口, /const 业务前撤回准备 = 即时业务撤回\?\.捕获\(data\)/);
  assert.match(入口, /await 即时业务撤回\.登记\(业务前撤回准备, 事务ID, data\)/);
  assert.match(入口, /await 即时业务撤回!\.确认\(即时业务撤回记录\)/);
});
