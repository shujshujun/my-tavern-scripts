/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.91.4 历史发布说明保持冻结，当前源码、组卡与入口前进到0.91.6', () => {
  const 依赖版本 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  const 入口 = 读('src/人妻公寓/新窗口入口_精简.md');
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91.4_2026-09-09.md');
  assert.match(发布说明, /发布标签：`rq0\.91\.4`/);
  assert.match(发布说明, /角色卡版本：`0\.91\.4`/);
  assert.match(发布说明, /releases\/download\/rq0\.91\.4\/rqgy-0\.91\.4\.png/);
  assert.doesNotMatch(发布说明, /rq0\.91\.5/);
  assert.match(依赖版本, /当前游戏版本 = '0\.91\.6'/);
  assert.match(组卡, /const 版本 = '0\.91\.6'/);
  assert.match(组卡, /const TAG = 'rq0\.91\.6'/);
  assert.match(组卡, /支持继承 v0\.80～v0\.91\.5 存档/);
  assert.match(入口, /v0\.91\.6／rq0\.91\.6/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.91.4 组卡门禁拒绝旧客户端、混合版本和错误标签', () => {
  assert.equal(校验发布版本一致({ 版本: '0.91.4', 标签: 'rq0.91.4' }), 'RQGY_GAME_VERSION:0.91.4');
  assert.equal(
    校验客户端构建版本('RQGY_GAME_VERSION:0.91.4', '0.91.4'),
    'RQGY_GAME_VERSION:0.91.4',
  );
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.3', '0.91.4'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.3 RQGY_GAME_VERSION:0.91.4', '0.91.4'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.91.4', 标签: 'rq0.91.3' }), /不一致/);
});

test('0.91.4 的变量 API 使用游戏宿主权威配置、等待保存并维持单路线互斥', () => {
  const 变量模式 = 读('src/人妻公寓/MVU解析模式.ts');
  const 设置页 = 读('src/人妻公寓/界面/客户端/components/设置弹窗.vue');
  assert.match(变量模式, /游戏变量解析设置键 = 'rqgy_builtin_variable_parser'/);
  assert.match(变量模式, /async function 等待宿主设置保存/);
  assert.match(变量模式, /await Promise\.resolve\(保存\.call\(保存所有者\)\)/);
  assert.match(变量模式, /export function 选择变量解析执行路径/);
  assert.match(变量模式, /保存自定义变量解析设置/);
  assert.match(设置页, /保存并启用/);
  assert.match(设置页, /保存设置中/);
  assert.doesNotMatch(设置页, /@(?:change|blur)="保存自定义变量/);
});

test('0.91.4 的数据库骨架保留 active-fill 回读补写，Plot 诊断包含正式输入来源与显式消息锚', () => {
  const 数据库桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  const Plot桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库剧情规划桥.ts');
  assert.match(数据库桥, /active-fill/);
  assert.match(数据库桥, /先做一次精确回读/);
  assert.match(数据库桥, /待补/);
  assert.match(Plot桥, /_qrf_plot_message_anchor/);
  assert.match(Plot桥, /turnToken/);
  assert.match(Plot桥, /intercepted=\$\{诊断\.intercepted\}/);
  assert.match(Plot桥, /formalInputSource=\$\{诊断\.formalInputSource\}/);
  assert.match(Plot桥, /export type 数据库剧情规划正式输入来源 = 'planned\.user_input' \| 'original\.user_input'/);
  assert.match(Plot桥, /const 正式输入来源:[\s\S]*\? 'planned\.user_input'[\s\S]*: 'original\.user_input'/);
});

test('0.91.4 在客户端解锁前释放变量租约，并把回合后手机节拍推迟到真实运行期空闲', () => {
  const 回合 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 接线 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const 调度 = 读('src/人妻公寓/脚本/游戏逻辑/手机/空闲节拍调度.ts');
  const 最终收口 = 回合.slice(回合.lastIndexOf('} finally {', 回合.indexOf('/** 楼层尾部 + 本次行动')));
  assert.ok(最终收口.indexOf('前台租约.释放()') < 最终收口.indexOf("eventEmit('人妻公寓:变量重生成结束'"));
  assert.match(接线, /const 空闲后手机节拍 = 创建空闲手机节拍调度器/);
  assert.match(接线, /时间事务阻止普通写入\(\)/);
  assert.match(接线, /手机生成租约持有中\(\)/);
  assert.match(接线, /eventOn\('人妻公寓:请求手机补拍', 空闲后手机节拍\.请求\)/);
  assert.match(调度, /等到运行期空闲/);
  assert.match(调度, /超时毫秒 \?\? 8000/);
});
