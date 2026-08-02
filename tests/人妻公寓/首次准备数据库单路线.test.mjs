/* eslint-disable import-x/no-nodejs-modules -- Node-only source regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('首次准备页只保留数据库路线，不再暴露或检测智脑兼容', () => {
  const 客户端 = 读('src/人妻公寓/界面/客户端/App.vue');
  const 数据库桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');

  const 准备页起点 = 客户端.indexOf('<div v-if="首次说明开"');
  const 准备页终点 = 客户端.indexOf('<!-- ═══════════ 数据未就绪', 准备页起点);
  assert.ok(准备页起点 >= 0 && 准备页终点 > 准备页起点, '应能定位首次准备页模板');
  const 准备页 = 客户端.slice(准备页起点, 准备页终点);

  assert.match(准备页, /准备数据库与运行环境/);
  assert.match(准备页, /安装本游戏表/);
  assert.doesNotMatch(准备页, /智脑|记忆方案|二选一|zhino/i);
  assert.doesNotMatch(数据库桥, /智脑状态|zhino-root|zhino-panel/i);
  assert.match(客户端, /const 数据库准备完成 = computed/);
  assert.match(客户端, /const 首次准备完成 = computed\(\(\) => 酒馆助手已安装\.value && 数据库准备完成\.value\)/);
});

test('首次准备页醒目提示玩家手动把数据库存储模式改为 SQLite SQL', () => {
  const 客户端 = 读('src/人妻公寓/界面/客户端/App.vue');
  const 准备页起点 = 客户端.indexOf('<div v-if="首次说明开"');
  const 准备页终点 = 客户端.indexOf('<!-- ═══════════ 数据未就绪', 准备页起点);
  const 准备页 = 客户端.slice(准备页起点, 准备页终点);

  assert.match(准备页, /class="setup-sql-reminder"/);
  assert.match(准备页, /数据库设置 →\s*存储模式/);
  assert.match(准备页, /SQLite（SQL）/);
  assert.match(准备页, /游戏无法代替你自动切换/);
  assert.match(客户端, /首次说明存储键\s*=\s*'人妻公寓_首次游玩说明_database_sql_mode_20260803'/);
});

test('首次准备页强烈建议使用 MVU 外置模型提高变量稳定性', () => {
  const 客户端 = 读('src/人妻公寓/界面/客户端/App.vue');
  const 准备页起点 = 客户端.indexOf('<div v-if="首次说明开"');
  const 准备页终点 = 客户端.indexOf('<!-- ═══════════ 数据未就绪', 准备页起点);
  const 准备页 = 客户端.slice(准备页起点, 准备页终点);

  assert.match(准备页, /class="setup-sql-reminder setup-mvu-reminder"/);
  assert.match(准备页, /使用 MVU 外置模型解析变量/);
  assert.match(准备页, /额外模型解析/);
  assert.match(准备页, /开启【自动请求】/);
  assert.match(准备页, /模型二次变量结算/);
  assert.match(准备页, /自动关闭/);
  assert.match(准备页, /避免重复请求和互相覆盖/);
  assert.match(准备页, /可大幅提高变量更新稳定性/);
  assert.match(准备页, /不是开局检测的强制项/);
  assert.doesNotMatch(准备页, /二次变量结算】开启（默认开启）/);
});

test('角色卡说明明确数据库是唯一支持路线', () => {
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 说明 = 读('src/人妻公寓/数据库兼容说明.md');

  assert.match(组卡, /需安装最新版酒馆助手、MVU 与数据库插件/);
  assert.match(组卡, /本作不再兼容智脑/);
  assert.doesNotMatch(组卡, /数据库与智脑|数据库或智脑|二选一/);
  assert.match(说明, /数据库插件是当前唯一受支持的长期记忆方案/);
});
