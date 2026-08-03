/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 手机回复封套未闭合, 手机回复封套状态 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机生成完整性.ts');
const 手机源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机系统.ts', import.meta.url), 'utf8');
const 数据库源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', import.meta.url), 'utf8');
const 本地摘要源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/微信本地进展摘要.ts', import.meta.url), 'utf8');

test('只有完整回复封套能证明模型已经走到手机协议终点', () => {
  assert.equal(手机回复封套未闭合('<回复>我在家等你，直接敲门就好。</回复>'), false);
  assert.equal(手机回复封套状态('<回复>我在家等你，直接敲门就好。</回复>'), '完整');
  assert.equal(手机回复封套状态('我在家等你，直接敲门就好。'), '缺失');
  assert.equal(手机回复封套状态(''), '空');
});

test('模型只生成回复开标签和半句话时必须判定为截断', () => {
  assert.equal(手机回复封套未闭合('<回复>我在家呢！门没反锁，小苏你直接敲门进来就行，这水池'), true);
});

test('闭合标签必须位于最后一个回复开标签之后', () => {
  assert.equal(手机回复封套未闭合('<回复>旧稿</回复><回复>新稿生成到一半'), true);
});

test('三路小生成共同要求完整封套，缺失或未闭合都只按原路重生成一次', () => {
  assert.match(手机源码, /手机回复封套状态\(原文\)/);
  assert.match(手机源码, /封套状态 !== '完整'/);
  assert.match(手机源码, /按原任务重生成一次/);
  assert.match(手机源码, /重生成后回复封套仍不完整/);
});

test('手机原始返回只净化一次，最终字数验收不重复执行玩家正则', () => {
  assert.doesNotMatch(手机源码, /验收短文本\(净化消息\(原\)/);
  assert.doesNotMatch(手机源码, /取合法\(净化消息\(原\)\)/);
});

test('玩家可见内容放宽到150汉字，本地隐藏进展保留80字符硬门', () => {
  assert.match(手机源码, /const 手机可见单条硬上限 = 150;/);
  assert.match(
    手机源码,
    /完整表达优先[\s\S]*?不超过\$\{手机可见单条硬上限\}个汉字/,
    '提示词应把150作为宽松硬门，不再要求模型压成几十字短文',
  );
  assert.doesNotMatch(手机源码, /不超过(?:20|30|35|40|50|60)个汉字/);
  assert.match(手机源码, /if \(!文 \|\| 长度 > 手机可见单条硬上限\) return '';/);
  assert.ok(
    (手机源码.match(/手机可见单条硬上限/g) ?? []).length >= 15,
    '私聊、朋友圈、评论、群聊与父亲通话的提示和最终验收都应复用同一硬上限',
  );
  assert.match(手机源码, /const 手机可见生成上限 = 1200;/, '四条群聊也必须有足够预算完整闭合回复封套');
  assert.match(
    手机源码,
    /控制\?\.忽略发言人前缀 \?\? \/\(\?:发言人\|评论人\)/,
    '群聊提示和显式私聊批次可忽略协议前缀，最终正文仍单独执行150汉字验收',
  );
  assert.match(本地摘要源码, /const 条目上限 = 80;/, '隐藏进展由本地确定性合并器执行80字符硬门');
  assert.match(本地摘要源码, /return 文\.slice\(0, 上限\);/);
  assert.doesNotMatch(手机源码, /每项通常控制在12[～-]80个字符/);
  assert.doesNotMatch(手机源码, /每项不超过32个汉字/);
  assert.match(数据库源码, /const 微信进展条目硬上限 = 80;/);
  assert.match(数据库源码, /Array\.from\(text\)\.length > 微信进展条目硬上限/);
  assert.match(数据库源码, /JSON\.stringify\(result\)\.length <= 微信进展序列化硬上限/);
  assert.match(手机源码, /const 手机可见记忆输入上限 = 手机可见单条硬上限 \* 2;/);
  assert.match(手机源码, /内容: item\.文\.slice\(0, 手机可见记忆输入上限\)/);
});
