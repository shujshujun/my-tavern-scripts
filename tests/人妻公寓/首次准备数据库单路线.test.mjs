/* eslint-disable import-x/no-nodejs-modules -- Node-only source regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('首次准备页只保留数据库路线，不再暴露或检测智脑兼容', () => {
  const 准备页 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');
  const 数据库桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');

  assert.match(准备页, /开始前准备一下/);
  assert.match(准备页, /一键安装游戏记忆/);
  assert.doesNotMatch(准备页, /智脑|记忆方案|二选一|zhino/i);
  assert.doesNotMatch(数据库桥, /智脑状态|zhino-root|zhino-panel/i);
  assert.match(准备页, /const 数据库准备完成 = computed\(/);
  assert.match(准备页, /数据库检测\.value\.已安装/);
  assert.match(准备页, /数据库检测\.value\.已装游戏模板/);
  assert.match(准备页, /数据库脚本写入能力\.value\?\.可写 === true/);
  assert.match(
    准备页,
    /const 首次准备完成 = computed\(\(\) => 酒馆助手已安装\.value && 提示词已确认\.value && 数据库准备完成\.value\)/,
  );
});

test('SQLite 实际不可写时进入主步骤，并保留高级诊断与手动切换说明', () => {
  const 准备页 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');

  assert.match(准备页, /<details class="setup-advanced">/);
  assert.match(准备页, /数据库设置 →\s*存储模式/);
  assert.match(准备页, /SQLite（SQL）/);
  assert.match(准备页, /游戏无法代替你自动切换/);
  assert.match(
    准备页,
    /首次说明存储键\s*=\s*'人妻公寓_首次游玩说明_database_sql_mode_20260803'/,
  );
  assert.match(准备页, /v-else-if="数据库脚本写入检测中 \|\| !数据库脚本写入能力\?\.可写"/);
  assert.match(准备页, /开启 SQLite（SQL）存储/);
  assert.match(准备页, /重新检测写入能力/);
  assert.match(准备页, /脚本写入：/);
});

test('首次准备页说明游戏默认使用外置模型解析，正文只负责故事', () => {
  const 准备页 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');

  assert.match(准备页, /游戏默认使用外置模型解析，正文只负责故事/);
  assert.match(准备页, /遇到问题？高级检查/);
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
