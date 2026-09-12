/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.91.5 历史发布说明保持冻结，当前源码、组卡与入口前进到0.92.2', () => {
  const 依赖版本 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 入口 = 读('src/人妻公寓/新窗口入口_精简.md');
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91.5_2026-09-10.md');

  assert.match(发布说明, /发布标签：`rq0\.91\.5`/);
  assert.match(发布说明, /角色卡版本：`0\.91\.5`/);
  assert.match(发布说明, /v0\.83～v0\.91\.4\(v9\) 可直接继续/);
  assert.doesNotMatch(发布说明, /rq0\.91\.6/);
  assert.match(依赖版本, /当前游戏版本 = '0\.92\.2'/);
  assert.match(组卡, /const 版本 = '0\.92\.2'/);
  assert.match(组卡, /const TAG = 'rq0\.92\.2'/);
  assert.match(组卡, /支持继承 v0\.80～v0\.92 存档，无需重开/);
  assert.match(入口, /当前正式入口：v0\.92\.1／rq0\.92\.1/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.91.5 组卡门禁拒绝旧客户端、多版本混包和错误标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.91.5', 标签: 'rq0.91.5' }), 'RQGY_GAME_VERSION:0.91.5');
  assert.equal(
    校验客户端构建版本('RQGY_GAME_VERSION:0.91.5', '0.91.5'),
    'RQGY_GAME_VERSION:0.91.5',
  );
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.4', '0.91.5'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.4 RQGY_GAME_VERSION:0.91.5', '0.91.5'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.91.5', 标签: 'rq0.91.4' }), /不一致/);
});

test('0.91.5 启动前从父页与 iframe 逐字段清理旧偏好，不覆盖变量解析配置', () => {
  const 存储 = 读('src/人妻公寓/界面偏好存储.ts');
  const 迁移 = 读('src/人妻公寓/界面/客户端/旧界面偏好迁移.ts');
  const 入口 = 读('src/人妻公寓/界面/客户端/index.ts');
  const 设置 = 读('src/人妻公寓/界面/客户端/components/设置弹窗.vue');

  assert.match(存储, /已删除界面偏好字段 = \['省流', '减动效'\]/);
  assert.match(存储, /window\.parent\?\.localStorage/);
  assert.match(存储, /window\.top\?\.localStorage/);
  assert.match(存储, /window\.localStorage/);
  assert.match(存储, /未知字段与嵌套值原样保留/);
  assert.match(迁移, /已删除根类 = \['rq-lite', 'rq-still'\]/);
  assert.match(迁移, /移除已删除界面偏好字段\(偏好\)/);
  assert.match(迁移, /当前存储\.setItem\(设置存储键, JSON\.stringify\(清理\.偏好\)\)/);

  const 清理位置 = 入口.indexOf('清理已删除界面偏好()');
  const 画幅位置 = 入口.indexOf('同步画幅()');
  const 启动等待位置 = 入口.indexOf('等待客户端启动依赖(');
  const 挂载位置 = 入口.indexOf("app.mount('#app')");
  assert.ok(清理位置 >= 0 && 清理位置 < 画幅位置 && 清理位置 < 启动等待位置 && 清理位置 < 挂载位置);
  assert.match(入口, /document\.addEventListener\('DOMContentLoaded'/);
  assert.doesNotMatch(入口, /\$\(async \(\) =>/);
  assert.doesNotMatch(设置, /省流模式|减少动效/);
});

test('0.91.5 数据库重开清五表，删楼和 swipe 同步裁剪剧情事件与社交轨迹', () => {
  const 数据库桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  assert.match(
    数据库桥,
    /游戏表名 = \['RQ_剧情事件', 'RQ_人物长期记忆', 'RQ_承诺与伏笔', 'RQ_社交轨迹', '纪要表'\]/,
  );
  assert.match(数据库桥, /数据库脚本所有权表名 = \['RQ_剧情事件', 'RQ_社交轨迹'\]/);
  assert.match(数据库桥, /目标楼层 !== 0 \|\| 原因 !== '重开一局'/);
  assert.match(数据库桥, /DELETE FROM \$\{表名\} WHERE row_id IS NOT NULL/);
  assert.match(数据库桥, /\{ 表名: 'rq_events', 楼层列: 'floor_no' \}/);
  assert.match(数据库桥, /\{ 表名: 'rq_social_history', 楼层列: 'last_floor' \}/);
  assert.match(数据库桥, /MESSAGE_SWIPED/);
  assert.match(数据库桥, /const 比较符 = \/切换消息分支\|swipe\/iu\.test\(原因\) \? '>=' : '>'/);
});

test('0.91.5 完成信号位于事务和共享租约释放之后，数据库 SQL 留在下一任务拍', () => {
  const 回合 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 主回合 = 回合.slice(回合.indexOf('export async function 执行回合'), 回合.indexOf('export async function 重掷回合'));
  const finally位置 = 主回合.indexOf('} finally {');
  const 事务结束位置 = 主回合.indexOf('标记回合事务结束();', finally位置);
  const 前台释放位置 = 主回合.indexOf('前台租约.释放();', 事务结束位置);
  const 数据库登记位置 = 主回合.indexOf('安排数据库回合后处理({ ...待安排数据库回合后处理 });', 前台释放位置);
  const 完成位置 = 主回合.indexOf("eventEmit('人妻公寓:回合完成')", 数据库登记位置);

  assert.ok(finally位置 >= 0);
  assert.ok(事务结束位置 > finally位置);
  assert.ok(前台释放位置 > 事务结束位置);
  assert.ok(数据库登记位置 > 前台释放位置);
  assert.ok(完成位置 > 数据库登记位置);
  assert.match(
    回合.slice(回合.indexOf('function 安排数据库回合后处理'), 回合.indexOf('function 安排数据库回合后处理') + 1000),
    /setTimeout\(\(\) =>/,
  );
  assert.doesNotMatch(主回合, /await 广播生成完成事件\(/);
});

test('0.91.5 发布说明明确保留社交知情隔离与0.91.4变量API单路线', () => {
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91.5_2026-09-10.md');
  assert.match(发布说明, /群级摘要、实际接收者以及各接收者个人见闻之间的知情隔离设计/);
  assert.match(发布说明, /自定义变量 API 自动恢复/);
  assert.match(发布说明, /游戏内置解析／MVU 单路线防双发完整保留/);
  assert.match(发布说明, /v0\.91\.4 会判定为“当前较旧”/);
  assert.match(发布说明, /同版 v0\.91\.5 不会重复提示/);
});
