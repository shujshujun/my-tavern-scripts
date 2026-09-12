/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.91.6 历史发布说明保持冻结，当前源码、组卡与入口前进到0.92.1', () => {
  const 依赖版本 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 入口 = 读('src/人妻公寓/新窗口入口_精简.md');
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91.6_2026-09-11.md');

  assert.match(发布说明, /发布分支：`release\/rq0916`/);
  assert.match(发布说明, /发布标签：`rq0\.91\.6`/);
  assert.match(发布说明, /角色卡版本：`0\.91\.6`/);
  assert.match(发布说明, /v0\.83～v0\.91\.5\(v9\) 可直接继续/);
  assert.doesNotMatch(发布说明, /rq0\.92/);
  assert.match(依赖版本, /当前游戏版本 = '0\.92\.1'/);
  assert.match(组卡, /const 版本 = '0\.92\.1'/);
  assert.match(组卡, /const TAG = 'rq0\.92\.1'/);
  assert.match(组卡, /支持继承 v0\.80～v0\.92 存档，无需重开/);
  assert.match(组卡, /my-tavern-scripts@\$\{TAG\}/);
  assert.match(入口, /当前正式入口：v0\.92\.1／rq0\.92\.1/);
  assert.match(入口, /发布说明_v0\.92\.1_2026-09-12\.md/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.91.6 组卡门禁拒绝旧客户端、多版本混包和错误标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.91.6', 标签: 'rq0.91.6' }), 'RQGY_GAME_VERSION:0.91.6');
  assert.equal(
    校验客户端构建版本('RQGY_GAME_VERSION:0.91.6', '0.91.6'),
    'RQGY_GAME_VERSION:0.91.6',
  );
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.5', '0.91.6'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.5 RQGY_GAME_VERSION:0.91.6', '0.91.6'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.91.6', 标签: 'rq0.91.5' }), /不一致/);
});

test('0.91.6 只允许不再留门当前自有票精确穿锁，并保留抽屉与双重继承边界', () => {
  const 不再留门 = 读('src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');
  const App = 读('src/人妻公寓/界面/客户端/App.vue');
  const 进展 = 读('src/人妻公寓/界面/客户端/components/不再留门进展.vue');
  const 房间动作 = 读('src/人妻公寓/界面/客户端/composables/useRoomActions.ts');
  const 离婚 = 读('src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');

  assert.match(不再留门, /export function 不再留门控制动作可穿过自身剧情锁/);
  assert.match(不再留门, /当前前台本线票/);
  assert.match(不再留门, /\| '确认当前决定'\s*\n\s*\| '暂缓'\s*\n\s*\| '撤回许可'/);
  assert.match(不再留门, /票\.实例 === r\.实例/);
  assert.match(不再留门, /票\.修订 === r\.修订/);
  assert.match(不再留门, /票\.场景 === r\.当前场景/);
  assert.match(不再留门, /票\.拍 === r\.当前拍/);
  assert.match(不再留门, /票\.时段 === data\.系统\._绝对时段/);
  assert.match(App, /不再留门控制提交中/);
  assert.match(App, /动作 === '归位总钥匙' && 最终收束操作可用\.value/);
  assert.match(房间动作, /候选\.id === '归位总钥匙' && options\.最终收束操作可用\?\.value === true/);
  assert.match(进展, /不再留门控制动作可穿过自身剧情锁/);
  assert.match(房间动作, /允许不再留门动作穿锁/);
  assert.match(离婚, /function 已有自有剧情票/);
  assert.match(离婚, /if \(已有自有剧情票\(data\)\) return \[\]/);
});

test('0.91.6 隔离生成在数据库监听前声明辅助身份，非静默且不放宽真实回档栅栏', () => {
  const 标记 = 读('src/人妻公寓/脚本/游戏逻辑/数据库辅助生成标记.ts');
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts');
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91.6_2026-09-11.md');

  assert.match(标记, /export function 标记脚本辅助生成事件/);
  assert.match(标记, /Reflect\.set\(配置, 'automatic_trigger', true\)/);
  assert.match(引擎, /eventMakeFirst\(tavern_events\.GENERATION_AFTER_COMMANDS/);
  assert.match(引擎, /标记脚本辅助生成事件/);
  assert.match(引擎, /辅助生成事件监听\?\.stop\(\)/);
  assert.doesNotMatch(引擎, /should_silence\s*:\s*true/);
  assert.match(发布说明, /不是给睡眠强行增加数据库记录/);
  assert.match(发布说明, /真实删楼、重掷、swipe、回档、切聊天和重开触发的数据库时间线安全栅栏没有放宽/);
  assert.match(发布说明, /群级摘要、实际接收者以及各接收者个人见闻之间的知情隔离设计不变/);
});
