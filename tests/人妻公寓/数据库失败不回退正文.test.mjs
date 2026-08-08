/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 生成引擎源码 = readFileSync(new URL('./生成引擎.ts', 手机目录), 'utf8');
const 配置源码 = readFileSync(new URL('./配置.ts', 手机目录), 'utf8');
const 设置页源码 = readFileSync(new URL('./壳/渲染/settings.ts', 手机目录), 'utf8');

test('数据库调用 catch/空结果/超时路径不含正文 API 回退', () => {
  // v0.74 第 8 项：一旦已调用数据库，失败绝不回退正文 API（避免双请求/二次计费）。
  assert.doesNotMatch(生成引擎源码, /数据库失败回退/, '数据库失败回退配置必须整体移除');
  assert.doesNotMatch(
    生成引擎源码,
    /数据库API调用失败:[\s\S]{0,80}正文API生成/,
    '数据库失败 catch 不得在失败后自动回退正文 API',
  );
  // 数据库调用失败只让本次任务失败。
  assert.match(生成引擎源码, /return 空手机小生成结果\(\);/, '失败路径应返回空结果');
});

test('手机自动模式只有“根本没有数据库 callAI 能力”时才选正文 API', () => {
  const 自动尾部 = 生成引擎源码.slice(生成引擎源码.indexOf("if (c.ai来源 === '数据库')"));
  assert.match(自动尾部, /已强制使用数据库，但未检测到公开 callAI 接口/, '强制数据库但无能力时失败关闭');
  assert.match(自动尾部, /return 正文API生成\(本次系统提示, 用户提示, 控制\);/, '数据库能力不存在时自动模式仍可选正文 API');
  assert.match(生成引擎源码, /if \(db\.可调用AI\)/, '有数据库能力时走数据库分支');
});

test('数据库失败回退的配置字段、默认值与设置页复选框/保存逻辑均已移除', () => {
  assert.doesNotMatch(配置源码, /数据库失败回退/, '配置接口与默认值不得再持有回退开关');
  assert.doesNotMatch(设置页源码, /数据库失败回退|i-db-fallback/, '设置页不得再有回退复选框或保存字段');
});
