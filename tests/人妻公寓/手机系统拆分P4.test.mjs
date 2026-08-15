/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 内核源码 = readFileSync(new URL('./内核.ts', 手机目录), 'utf8');
const 生成引擎源码 = readFileSync(new URL('./生成引擎.ts', 手机目录), 'utf8');
const 摘要系统源码 = readFileSync(new URL('./摘要系统.ts', 手机目录), 'utf8');
// P7B2:设置页迁至 ./壳/渲染/settings,重置微信摘要SQLite能力/确认微信摘要SQLite可写 的消费断言改读新所有者。
const 设置页源码 = readFileSync(new URL('./壳/渲染/settings.ts', 手机目录), 'utf8');
// P8:交互业务迁至 ./交互/邀约与发消息,生成能力消费断言改读新所有者。
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 门面源码 = readFileSync(new URL('../手机系统.ts', 手机目录), 'utf8');

test('生成引擎真实拥有净化、路由、小生成、短文本/群文本与生成标记，内核无重复声明', () => {
  // 生成引擎真实声明生成实现
  assert.match(生成引擎源码, /function 净化消息\(原: string\): string \{/);
  assert.match(生成引擎源码, /function 有单条超过汉字上限\(/);
  assert.match(生成引擎源码, /const 手机内置核心预设/);
  assert.match(生成引擎源码, /const 手机内置接令/);
  assert.match(生成引擎源码, /function 手机系统消息\(入口提示: string\)/);
  assert.match(生成引擎源码, /async function 正文API生成\(/);
  assert.match(生成引擎源码, /async function 自定义API生成\(/);
  assert.match(生成引擎源码, /async function 小生成\(系统提示: string, 用户提示: string/);
  assert.match(生成引擎源码, /async function 微信短文本\(/);
  assert.match(生成引擎源码, /async function 微信群文本\(/);
  assert.match(生成引擎源码, /interface 手机小生成结果 \{/);
  assert.match(生成引擎源码, /export interface 手机小生成控制 \{/);
  assert.match(生成引擎源码, /export function 手机小生成仍有效\(/);
  assert.match(生成引擎源码, /function 解析手机小生成原文\(/);
  assert.match(生成引擎源码, /function 空手机小生成结果\(\)/);
  assert.match(生成引擎源码, /export const 手机生成请求标记 = '<phone_generation_calibration>';/);
  assert.match(生成引擎源码, /const 手机可见内容长度纪律/);
  assert.match(生成引擎源码, /const 手机请求token上限 = 8192;/);

  // 内核不再重复声明这些实现
  const 内核禁止声明 = [
    /function 净化消息\(/,
    /function 有单条超过汉字上限\(/,
    /const 手机内置核心预设/,
    /const 手机内置接令/,
    /function 手机系统消息\(/,
    /async function 正文API生成\(/,
    /async function 自定义API生成\(/,
    /async function 小生成\(/,
    /async function 微信短文本\(/,
    /async function 微信群文本\(/,
    /interface 手机小生成结果 \{/,
    /interface 手机小生成控制 \{/,
    /function 手机小生成仍有效\(/,
    /function 解析手机小生成原文\(/,
    /function 空手机小生成结果\(\)/,
    /export const 手机生成请求标记/,
    /const 手机可见内容长度纪律/,
    /const 手机请求token上限 = 8192;/,
  ];
  for (const 模式 of 内核禁止声明) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明:${模式}`);
  }
});

test('生成标记与手机小生成控制等由交互模块正确 import，内核仅 re-export 生成标记，旧门面 API 不变', () => {
  // P8:交互模块从生成引擎 import 生成能力并继续使用
  assert.match(交互源码, /import \{[\s\S]*小生成,[\s\S]*微信短文本,[\s\S]*微信群文本,[\s\S]*手机小生成仍有效,[\s\S]*type 手机小生成控制,[\s\S]*\} from '\.\.\/生成引擎';/);
  assert.match(交互源码, /await 小生成\(/);
  assert.match(交互源码, /await 微信短文本\(/);
  assert.match(交互源码, /await 微信群文本\(/);
  assert.match(交互源码, /手机小生成仍有效\(控制\)/);

  // 生成标记与占用查询显式 re-export，保持游戏逻辑/index.ts 旧 import 路径不变
  assert.match(内核源码, /export \{ 手机AI生成中, 手机生成请求标记 \} from '\.\/生成引擎';/);
  assert.match(门面源码, /export \* from '\.\/手机\/内核'/);
});

test('摘要系统真实拥有 SQLite 状态、快照、胶囊、刷新/排队/等待，内核无重复声明', () => {
  assert.match(摘要系统源码, /interface 微信摘要消息 \{/);
  assert.match(摘要系统源码, /interface 微信摘要点 \{/);
  assert.match(摘要系统源码, /interface 微信摘要快照 \{/);
  assert.match(摘要系统源码, /const 微信摘要任务 = new Map<string, Promise<void>>\(\)/);
  assert.match(摘要系统源码, /const 微信摘要SQLite复检间隔 = 60_000;/);
  assert.match(摘要系统源码, /let 微信摘要SQLite能力/);
  assert.match(摘要系统源码, /export function 重置微信摘要SQLite能力\(\)/);
  assert.match(摘要系统源码, /function 标记微信摘要SQLite不可用\(\)/);
  assert.match(摘要系统源码, /function 微信摘要SQLite近期不可用\(\)/);
  assert.match(摘要系统源码, /export async function 确认微信摘要SQLite可写\(\)/);
  assert.match(摘要系统源码, /function 推进摘要哈希\(/);
  assert.match(摘要系统源码, /function 有效楼务任务id集合\(/);
  assert.match(摘要系统源码, /function 取微信摘要快照\(/);
  assert.match(摘要系统源码, /export function 当前微信摘要引用\(/);
  assert.match(摘要系统源码, /export function 读取近期微信胶囊\(/);
  assert.match(摘要系统源码, /function 微信摘要快照仍有效\(/);
  assert.match(摘要系统源码, /async function 刷新微信进展摘要\(/);
  assert.match(摘要系统源码, /export function 排队刷新微信进展摘要\(/);
  assert.match(摘要系统源码, /export async function 等待微信摘要任务\(/);

  // 内核不再重复声明这些摘要实现
  const 内核禁止摘要声明 = [
    /interface 微信摘要消息 \{/,
    /interface 微信摘要点 \{/,
    /interface 微信摘要快照 \{/,
    /const 微信摘要任务 = new Map/,
    /const 微信摘要SQLite复检间隔/,
    /let 微信摘要SQLite能力/,
    /function 重置微信摘要SQLite能力\(\)/,
    /function 标记微信摘要SQLite不可用\(\)/,
    /function 微信摘要SQLite近期不可用\(\)/,
    /async function 确认微信摘要SQLite可写\(\)/,
    /function 推进摘要哈希\(/,
    /function 有效楼务任务id集合\(/,
    /function 取微信摘要快照\(/,
    /export function 当前微信摘要引用\(/,
    /export function 读取近期微信胶囊\(/,
    /function 微信摘要快照仍有效\(/,
    /async function 刷新微信进展摘要\(/,
    /function 排队刷新微信进展摘要\(/,
    /export async function 等待微信摘要任务\(/,
  ];
  for (const 模式 of 内核禁止摘要声明) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明:${模式}`);
  }

  // P7B2:重置微信摘要SQLite能力/确认微信摘要SQLite可写 的消费点迁至 ./壳/渲染/settings,
  // 断言设置页从 ../../摘要系统 import 并真实调用；不再要求内核 import 这两个设置函数。
  assert.match(设置页源码, /import \{[^}]*重置微信摘要SQLite能力[^}]*\} from '\.\.\/\.\.\/摘要系统';/);
  assert.match(设置页源码, /import \{[^}]*确认微信摘要SQLite可写[^}]*\} from '\.\.\/\.\.\/摘要系统';/);
  assert.ok(
    (设置页源码.match(/重置微信摘要SQLite能力\(/g) ?? []).length >= 1,
    '设置页应在 import 之外调用 重置微信摘要SQLite能力()',
  );
  assert.ok(
    (设置页源码.match(/确认微信摘要SQLite可写\(/g) ?? []).length >= 1,
    '设置页应在 import 之外调用 确认微信摘要SQLite可写()',
  );
  // P8:排队刷新微信进展摘要 改由交互模块从 ../摘要系统 import 并真实调用,内核显式 re-export 三个既有公共 API。
  assert.match(交互源码, /import \{[^}]*排队刷新微信进展摘要[^}]*\} from '\.\.\/摘要系统';/);
  assert.ok(
    (交互源码.match(/排队刷新微信进展摘要\(/g) ?? []).length >= 1,
    '交互模块应在 import 之外调用 排队刷新微信进展摘要()',
  );
  assert.match(内核源码, /export \{ 当前微信摘要引用, 读取近期微信胶囊, 等待微信摘要任务 \} from '\.\/摘要系统';/);
});

test('摘要双世代校验、当前聊天队列键与数据库社交写仍存在', () => {
  const 快照校验段 = 摘要系统源码.slice(摘要系统源码.indexOf('function 微信摘要快照仍有效('), 摘要系统源码.indexOf('/** 正文若紧接在手机回复之后开始'));
  assert.match(快照校验段, /时间线世代 === 当前时间线切换世代\(\)/);
  assert.match(快照校验段, /手机租约世代 === 读取当前手机时间线租约世代\(\)/);
  assert.match(快照校验段, /同步社交轨迹\([\s\S]*微信摘要请求仍有效/);
  assert.match(快照校验段, /const 队列键 = `\$\{快照\.聊天ID\}\\n\$\{时间线世代\}\\n\$\{手机租约世代\}\\n\$\{门牌号\}`/);
  assert.match(摘要系统源码, /const 当前队列前缀 = `\$\{聊天ID\}\\n\$\{时间线世代\}\\n\$\{手机租约世代\}\\n`/);
});

test('两个新模块均不 import 内核/门面，摘要系统不反向依赖生成引擎', () => {
  for (const [名称, 源码] of [
    ['生成引擎', 生成引擎源码],
    ['摘要系统', 摘要系统源码],
  ]) {
    assert.doesNotMatch(源码, /from '\.\/内核'/, `${名称}不得反向 import 内核`);
    assert.doesNotMatch(源码, /from '\.\.\/手机系统'/, `${名称}不得反向 import 门面`);
    assert.doesNotMatch(源码, /from '\.\/手机系统'/, `${名称}不得反向 import 门面`);
  }
  assert.doesNotMatch(摘要系统源码, /from '\.\/生成引擎'/, '摘要系统不得反向依赖生成引擎');
});

test('生成的完整封套、单次请求、同路由重试、可见150汉字与摘要300代码单元纪律未弱化', () => {
  // 完整封套与同路由重生成一次
  assert.match(生成引擎源码, /手机回复封套状态\(原文\)/);
  assert.match(生成引擎源码, /封套状态 !== '完整'/);
  assert.match(生成引擎源码, /按原任务重生成一次/);
  assert.match(生成引擎源码, /重生成后回复封套仍不完整/);
  // 单次请求坚持一次调用，不得暗中重试或跨来源回退
  assert.match(生成引擎源码, /控制\?\.单次请求[\s\S]{0,180}return '';/);
  // v0.74 第 8 项：数据库失败绝不回退正文 API（避免双请求/二次计费），配置与回退分支一并移除。
  assert.doesNotMatch(生成引擎源码, /数据库失败回退/, '数据库失败回退配置必须移除');
  assert.doesNotMatch(生成引擎源码, /数据库API调用失败:[\s\S]{0,80}正文API生成/, '数据库失败 catch 不得回退正文 API');
  // 可见150汉字宽松硬门仍由提示词管，不再压成几十字短文
  assert.match(生成引擎源码, /完整表达优先[\s\S]*?不超过\$\{手机可见单条硬上限\}个汉字/);
  assert.match(生成引擎源码, /控制\?\.忽略发言人前缀 \?\? \/\(\?:发言人\|评论人\)/);
  // 摘要记忆输入按 150*2=300 代码单元设安全门
  assert.match(摘要系统源码, /const 手机可见记忆输入上限 = 手机可见单条硬上限 \* 2;/);
  assert.match(摘要系统源码, /内容: item\.文\.slice\(0, 手机可见记忆输入上限\)/);
  assert.doesNotMatch(生成引擎源码, /验收短文本\(净化消息\(原\)/);
  assert.doesNotMatch(生成引擎源码, /取合法\(净化消息\(原\)\)/);
});
