/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  默认正文生成看门狗配置,
  判定正文生成超时,
  创建正文生成超时错误,
  友好化正文生成错误,
} = require('../../src/人妻公寓/脚本/游戏逻辑/正文生成故障.ts');
const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

test('正文看门狗分别识别首包等待、流式停滞与绝对上限，正常长文本不被旧180秒硬切', () => {
  const 配置 = 默认正文生成看门狗配置;
  assert.equal(判定正文生成超时(配置.首包等待毫秒 - 1, 0, 0, false, 配置), null);
  assert.equal(判定正文生成超时(配置.首包等待毫秒, 0, 0, false, 配置), '等待首个正文片段');

  const 开始 = 1000;
  const 最后进展 = 开始 + 20_000;
  assert.equal(
    判定正文生成超时(最后进展 + 配置.流式停滞毫秒 - 1, 开始, 最后进展, true, 配置),
    null,
  );
  assert.equal(
    判定正文生成超时(最后进展 + 配置.流式停滞毫秒, 开始, 最后进展, true, 配置),
    '正文流式停滞',
  );
  assert.equal(判定正文生成超时(开始 + 配置.绝对上限毫秒, 开始, 最后进展, true, 配置), '正文总时限');
  assert.ok(配置.首包等待毫秒 > 180_000, '首包门应给数据库规划与长思考留出余量');
});

test('522/502/上游错误对玩家归类为线路故障，游戏内部错误仍保留原原因', () => {
  assert.equal(
    友好化正文生成错误(new Error('Got response status 522')),
    'AI 线路暂时不可用（522）。请稍后重试或更换模型线路。',
  );
  assert.equal(
    友好化正文生成错误(new Error('Streaming request failed with status 502 Bad Gateway: error code: 522')),
    'AI 线路暂时不可用（502）。请稍后重试或更换模型线路。',
  );
  assert.equal(
    友好化正文生成错误(创建正文生成超时错误('正文流式停滞')),
    'AI 服务长时间没有返回完整正文，系统已自动停止本轮。请重试或更换模型线路。',
  );
  assert.equal(友好化正文生成错误(new Error('Schema 校验失败：现金字段非法')), 'Schema 校验失败：现金字段非法');
});

test('回合等待链接入流式进展、超时门、底层停止与友好错误，不再允许永久 pending', () => {
  const 起 = 回合源码.indexOf('async function 等待正文生成');
  const 止 = 回合源码.indexOf('const 变量结算基础令', 起);
  const 等待链 = 回合源码.slice(起, 止);
  assert.match(等待链, /判定正文生成超时/);
  assert.match(等待链, /Promise\.race\(\[生成任务, 中止门, 超时门\]\)/);
  assert.match(等待链, /停止当前正文底层请求\(\)/);
  assert.match(回合源码, /正文生成进展回调\?\.\(\)/);
  assert.match(回合源码, /生成错误\.message\.startsWith\(正文生成超时错误前缀\)\) throw 生成错误/);
  assert.match(回合源码, /待广播失败原因 = 友好化正文生成错误\(e\)/);
  assert.doesNotMatch(等待链, /不再设置固定时长硬超时/);
});
