/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { 选择正文生成原文 } = require('../../src/人妻公寓/脚本/游戏逻辑/正文生成完整性.ts');
const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

const 清掉变量协议 = 原文 =>
  String(原文 ?? '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*?(?:<\/UpdateVariable\s*>|$)/gi, '')
    .trim();

test('最终返回丢失正文时采用同一正文请求的完整流式缓存', () => {
  const 流式正文 = '夏乔把工具递了过来，等着玩家处理漏水。\n<UpdateVariable>[]</UpdateVariable>';
  assert.equal(选择正文生成原文('', 流式正文, 清掉变量协议), 流式正文);
  assert.equal(选择正文生成原文('<UpdateVariable>[]</UpdateVariable>', 流式正文, 清掉变量协议), 流式正文);
});

test('最终返回本身含有效正文时不让较早的流式片段覆盖它', () => {
  assert.equal(选择正文生成原文('最终完整正文', '较早的流式片段', 清掉变量协议), '最终完整正文');
});

test('回合只缓存正文请求流，并在正文清洗前完成流式兜底', () => {
  assert.match(回合源码, /正文流式生成id/);
  assert.match(回合源码, /正文流式原文/);
  assert.match(回合源码, /if \(generation_id && generation_id === 正文流式生成id\)/);
  const 生成开始 = 回合源码.indexOf('本回合生成id = `rqgy-');
  const 清洗开始 = 回合源码.indexOf('const 已清洗正文', 生成开始);
  const 选择位置 = 回合源码.indexOf('选择正文生成原文(', 生成开始);
  assert.ok(选择位置 > 生成开始 && 选择位置 < 清洗开始);
});

test('AI变量解析异常降级到可信基准并保留正文，最终整表写入失败仍不得伪装成功', () => {
  assert.match(回合源码, /变量解析已降级/);
  assert.match(回合源码, /变量解析失败[\s\S]{0,500}解析基准/);
  assert.match(回合源码, /正文已保留[\s\S]{0,160}变量/);

  const 提交开始 = 回合源码.indexOf('const 提交最终整表');
  const 转正位置 = 回合源码.indexOf('临时用户已转正 = true', 提交开始);
  const 最终写入 = 回合源码.indexOf('Mvu.replaceMvuData', 提交开始);
  assert.ok(最终写入 > 提交开始 && 转正位置 > 最终写入, '最终存储成功前不能把半事务标记为成功');
});
