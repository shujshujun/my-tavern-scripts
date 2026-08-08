/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 解析微信群消息 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机群聊格式.ts');
const 手机源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts', 'utf8');

const 成员 = new Set(['夏乔', '林悦']);

test('群聊兼容中英文冒号，并统一保存为“发言人:内容”', () => {
  assert.deepEqual(解析微信群消息('夏乔：楼道灯坏了，晚上麻烦看一下。', 成员, 150, 1), [
    '夏乔:楼道灯坏了，晚上麻烦看一下。',
  ]);
  assert.deepEqual(解析微信群消息('夏乔:快递放门口了。', 成员, 150, 1), ['夏乔:快递放门口了。']);
});

test('一条消息被模型自然换行时合并为一个完整气泡，不再只保留前半句', () => {
  assert.deepEqual(解析微信群消息('夏乔：管理员，楼道的灯坏了，\n晚上看不清，麻烦处理一下。', 成员, 150, 1), [
    '夏乔:管理员，楼道的灯坏了，晚上看不清，麻烦处理一下。',
  ]);
});

test('发言人标签与正文分行、无害冒号续行及英文折行都不会丢内容', () => {
  assert.deepEqual(解析微信群消息('夏乔：\n晚上麻烦看一下。', 成员, 150, 1), ['夏乔:晚上麻烦看一下。']);
  assert.deepEqual(解析微信群消息('夏乔：楼道灯坏了。\n补充：二楼也不亮。', 成员, 150, 1), [
    '夏乔:楼道灯坏了。补充：二楼也不亮。',
  ]);
  assert.deepEqual(解析微信群消息('夏乔：hello\nworld', 成员, 150, 1), ['夏乔:hello world']);
  for (const 标签 of ['提醒', '注意', '时间', '地点', '原因', '重点', '安排', '说明']) {
    assert.deepEqual(解析微信群消息(`夏乔：第一句\r${标签}：第二句`, 成员, 150, 1), [
      `夏乔:第一句${标签}：第二句`,
    ]);
  }
});

test('列表符号可被清理，多位发言仍按条数上限验收', () => {
  assert.deepEqual(解析微信群消息('- 夏乔：一楼有个快递。\n2. 林悦:收到，谢谢。', 成员, 150, 2), [
    '夏乔:一楼有个快递。',
    '林悦:收到，谢谢。',
  ]);
});

test('名单外发言人与超过150汉字的内容仍会被拒绝', () => {
  assert.deepEqual(解析微信群消息('陌生人：开门。', 成员, 150, 1), []);
  assert.deepEqual(解析微信群消息('夏乔：第一句\n陌生人：第二句\n林悦：第三句', 成员, 150, 3), [
    '夏乔:第一句',
    '林悦:第三句',
  ]);
  assert.deepEqual(解析微信群消息(`夏乔：${'好'.repeat(151)}`, 成员, 150, 1), []);
});

test('手机群聊实际接入宽容解析器，失败提示不再把“单行”误写成唯一原因', () => {
  assert.match(手机源, /解析微信群消息\(文本, 合法发言人, 最大字数/);
  assert.match(手机源, /未识别到合规的“发言人:内容”/);
  assert.doesNotMatch(手机源, /发言人:单行且/);
});
