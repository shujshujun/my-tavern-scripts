/* eslint-disable import-x/no-nodejs-modules -- Isolated real writer; only model/host I/O are adapters. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node', resolveJsonModule: true, esModuleInterop: true });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const ts = require('typescript');
const contract = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');
const { 录像带V4微信消息键 } = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4状态.ts');
const { 解析微信私聊气泡 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机文本格式.ts');
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/录像带V4微信.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('writer.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const names = ['消息键按阶段', '广播主状态复核', '卡系统提示', '卡用户提示', '解析卡气泡', '构造稳定消息', '写卡消息'];
const functions = names.map(name => {
  const matches = ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.equal(matches.length, 1, `Actual production function ${name} must be unique`);
  return matches[0].getText(ast);
});
const compiled = ts.transpileModule(functions.join('\n'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

async function run(room, stage, text, options = {}) {
  const card = contract.读取录像带V4微信卡(room, stage);
  assert.ok(card);
  let live = !options.cancelBefore;
  let control = true;
  let modelCalls = 0;
  let saves = 0;
  let redraws = 0;
  let events = 0;
  const messages = options.messages ?? [];
  const env = {
    ...contract, 录像带V4微信消息键, 解析微信私聊气泡,
    手机可见单条硬上限: 150,
    手机小生成仍有效: () => control,
    小生成: async () => {
      modelCalls += 1;
      if (options.cancelAfterModel) control = false;
      if (options.lateAfterModel) live = false;
      return options.raw ?? `${card.speaker}:${text}`;
    },
    末楼: () => 38,
    当前手机绝对时段: () => 12,
    当前聊天ID: () => 'play017-isolated',
    带当前手机分支锚: message => ({ ...message, 分支: 'current-only' }),
    写库增量: async (delta, valid, stats) => {
      if (options.invalidateAtWrite) live = false;
      if (!valid()) return false;
      if (options.failWrite) throw new Error('CONTROLLED_WRITE_FAILURE');
      for (const message of delta.新消息) {
        if (messages.some(previous => previous.键 === message.键)) continue;
        messages.push(structuredClone(message));
        stats.实际插入消息数 += 1;
        stats.实际插入消息键.push(message.键);
      }
      return true;
    },
    请求刷新手机红点: () => undefined,
    请求手机重绘: () => { redraws += 1; },
    立即持久保存手机聊天变量: async () => { saves += 1; },
    eventEmit: () => { events += 1; },
  };
  const write = new Function(...Object.keys(env), `${compiled}\nreturn 写卡消息;`)(...Object.values(env));
  const result = await write(room, stage, () => live, {}, '', options.joint ? contract.读取录像带V4微信卡(room, 'departure-ready') : undefined);
  return { result, messages, modelCalls, saves, redraws, events };
}

for (const room of ['102', '202']) {
  for (const stage of ['lock-confirmation', 'watch-consent']) {
    const card = contract.读取录像带V4微信卡(room, stage);
    const action = stage === 'lock-confirmation' ? '已经自己把锁戴好' : '已经明确同意观看录像';
    const good = `${card.husband}没有离开，${action}。`;
    test(`PLAY017 ${room}/${stage} 实际写口保留合法原文及固定键`, async () => {
      const result = await run(room, stage, good);
      assert.equal(result.result.写入数, 1);
      assert.equal(result.messages[0].文, good);
      assert.equal(result.messages[0].键, 录像带V4微信消息键[room][stage === 'lock-confirmation' ? '戴锁' : '同意']);
      assert.equal(result.saves, 1);
      assert.equal(result.redraws, 1);
      assert.equal(result.events, 1);
    });
    test(`PLAY017 ${room}/${stage} 条件文案使用原卡兜底而非带条件的确认`, async () => {
      const result = await run(room, stage, `如果${card.husband}${action}，我再告诉你。`);
      assert.equal(result.result.写入数, 1);
      assert.equal(result.messages[0].文, contract.录像带V4微信卡安全兜底(card));
      assert.equal(contract.录像带V4微信气泡满足卡(card, result.messages[0].文), true);
    });
  }
}
for (const [label, options] of [
  ['生成前取消', { cancelBefore: true }],
  ['生成后取消', { cancelAfterModel: true }],
  ['模型迟到时间线失效', { lateAfterModel: true }],
  ['最终写口失效', { invalidateAtWrite: true }],
  ['空结果不改用事实兜底', { raw: '' }],
  ['未知说话人不改用事实兜底', { raw: '陌生人:我确认好了。' }],
]) {
  test(`PLAY017 写口生命周期：${label}`, async () => {
    const result = await run('102', 'watch-consent', '顾国栋已经明确同意观看录像。', options);
    assert.deepEqual(result.messages, []);
    assert.equal(result.result.已写, false);
    assert.equal(result.saves, 0);
    assert.equal(result.events, 0);
  });
}
test('PLAY017 原解析器允许无前缀文本，语义不符仍走既有卡兜底', async () => {
  const card = contract.读取录像带V4微信卡('102', 'watch-consent');
  const result = await run('102', 'watch-consent', '', { raw: '没有合法说话人格式' });
  assert.equal(result.result.写入数, 1);
  assert.equal(result.messages[0].文, contract.录像带V4微信卡安全兜底(card));
});
test('PLAY017 真实写口失败继续抛错，不伪装成功', async () => {
  await assert.rejects(run('102', 'watch-consent', '顾国栋已经明确同意观看录像。', { failWrite: true }), /CONTROLLED_WRITE_FAILURE/u);
});
test('PLAY017 同键重试由明示内存幂等写口保留首次原文，不重复广播插入', async () => {
  const messages = [];
  await run('102', 'watch-consent', '顾国栋已经明确同意观看录像。', { messages });
  const before = JSON.stringify(messages);
  const retry = await run('102', 'watch-consent', '顾国栋没有离开，已经明确同意观看录像。', { messages });
  assert.equal(retry.result.写入数, 0);
  assert.equal(retry.events, 0);
  assert.equal(JSON.stringify(messages), before);
});
test('PLAY017 双气泡分别验收，保留既有联合出发键与监控路由', async () => {
  const card = contract.读取录像带V4微信卡('202', 'watch-consent');
  const joint = contract.读取录像带V4微信卡('202', 'departure-ready');
  const result = await run('202', 'watch-consent', '', { joint: true,
    raw: `${card.speaker}:何俊生没有离开，已经明确同意观看录像。\n${card.speaker}:${contract.录像带V4微信卡安全兜底(joint)}` });
  assert.equal(result.result.写入数, 2);
  assert.deepEqual(result.messages.map(message => message.键), [录像带V4微信消息键['202'].同意, 录像带V4微信消息键.联合出发]);
  assert.equal(result.saves, 1);
});
