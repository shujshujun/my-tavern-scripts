/* eslint-disable import-x/no-nodejs-modules -- Node-only semantic and isolated consumer regression. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const ts = require('typescript');
const { Schema } = require('../../src/人妻公寓/schema.ts');
const { 母亲共居已开启 } = require('../../src/人妻公寓/脚本/游戏逻辑/302共居系统.ts');
const { 父亲被写成已知关系 } = require('../../src/人妻公寓/脚本/游戏逻辑/父亲关系知情.ts');
const { 验收母亲共居手机内容, 验收双重继承余波公开事实 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局社交语义.ts');
const { 验收父亲模式语义, 验收群聊隐私 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts');
const { 验收姐妹群跨线事实 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群已知事实.ts');
const { 解析微信私聊气泡 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机文本格式.ts');
const { 解析微信AI引用前缀 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信消息引用.ts');

// True means the text actually asserts the father's knowledge, not merely the narrator's knowledge.
const cases = [
  ['原报告直接否定', '他爸并不知道这件事，你先别告诉他。', false],
  ['原报告正常交权', '你爸爸知道公寓已经正式交给你了。', false],
  ['否定隐秘关系知情', '父亲并不知道我们的隐秘关系。', false],
  ['嵌套知道加不知道', '我知道你爸不知道我们的真实关系。', false],
  ['嵌套清楚加没有发现', '我清楚他爸没有发现我们的真实关系。', false],
  ['嵌套明白加尚未知晓', '我明白父亲尚未知晓我们的隐秘关系。', false],
  ['嵌套普通交接', '我知道你爸已经完成公寓管理交接。', false],
  ['嵌套肯定知情', '我知道你爸已经知道我们的真实关系。', true],
  ['嵌套肯定发现', '我清楚他爸已经发现我们的隐秘关系。', true],
  ['单句管理与隐私对象分开', '你爸知道公寓已经交接但不知道我们的真实关系。', false],
  ['逗号管理与隐私对象分开', '你爸知道公寓已经交接，但不知道我们的真实关系。', false],
  ['知情否定加普通事项', '他爸不知道我们的真实关系，但知道房租已经收齐。', false],
  ['知情否定不掩盖另一肯定', '他爸原来不知道我们的真实关系，但其实已经知道了。', true],
  ['母亲知道不能冒充父亲知道', '他爸不知道我们的真实关系，但我一直知道。', false],
  ['前置关系话题', '我们的真实关系，父亲已经知道了。', true],
  ['真正知情', '父亲已经知道了我们的隐秘关系。', true],
  ['看穿并默许', '你爸早就看穿并默许我和管理员了。', true],
  ['故意成全', '父亲故意成全我们了。', true],
  ['双重否定', '他爸不是不知道我们的真实关系。', true],
  ['假装不知', '爸爸只是装作不知道我们的真实关系。', true],
  ['否定假装不知', '他爸没有装作不知道我们的真实关系，他确实不知道。', false],
  ['机场现场知情', '父亲已经知道机场视频里的隐秘现场。', true],
  ['机场镜头死角被看到', '你爸看到了机场视频中的镜头死角。', true],
  ['机场现场嵌套否定', '我知道你爸没有看见机场视频里的隐秘现场。', false],
  ['机场普通通话时间', '父亲知道机场视频通话的开始时间。', false],
  ['本人私人回忆', '我还记得机场视频那天的事。', false],
  ['条件不签事实', '如果他爸知道我们的真实关系，我会先和你商量。', false],
  ['嵌套条件不签事实', '我担心如果他爸知道我们的真实关系会生气。', false],
  ['疑问不签事实', '你爸知道我们的真实关系了吗？', false],
  ['计划不签事实', '我不想让父亲知道我们的真实关系。', false],
  ['引用否定说过', '我从未说过“父亲已经知道我们的真实关系”。', false],
  ['引用明确辟谣', '“父亲已经知道我们的真实关系”这句话是假的。', false],
  ['引用劝阻', '别再说“父亲已经知道我们的真实关系”。', false],
  ['仅加引号仍是断言', '“父亲已经知道我们的真实关系。”', true],
  ['引用辟谣不能遮掉后句', '别信“父亲已经知道我们的真实关系”。但父亲确实已经知道我们的真实关系了。', true],
  ['条件不能遮掉后句', '如果父亲知道我们的真实关系，我会解释。现在父亲已经知道我们的真实关系。', true],
];
for (const [label, text, asserted] of cases) {
  test(`PLAY023 知情对象与作用域：${label}`, () => {
    assert.equal(父亲被写成已知关系(text, '母亲'), asserted, text);
    assert.equal(验收母亲共居手机内容(text, '私密'), !asserted, text);
  });
}

test('PLAY023 原报告合法交接和不知情，所有相应消费者继续允许', () => {
  for (const text of cases.slice(0, 2).map(row => row[1])) {
    assert.equal(验收母亲共居手机内容(text, '公开朋友圈'), true, text);
    assert.equal(验收双重继承余波公开事实(`母亲:${text}`, []), true, text);
    assert.equal(验收群聊隐私(`母亲:${text}`, '双重继承余波'), true, text);
    assert.equal(验收姐妹群跨线事实(`母亲:${text}`, []), true, text);
  }
});

test('PLAY023 嵌套否定共用真实判断，但朋友圈不因否定而获准公开关系', () => {
  for (const text of [cases[3][1], cases[4][1]]) {
    assert.equal(验收双重继承余波公开事实(`母亲:${text}`, []), true, text);
    assert.equal(验收群聊隐私(`母亲:${text}`, '双重继承余波'), true, text);
    assert.equal(验收姐妹群跨线事实(`母亲:${text}`, []), true, text);
    assert.equal(验收母亲共居手机内容(text, '公开朋友圈'), false, text);
  }
});

test('PLAY023 机场记忆与否定只允许私密层，公开和余波层继续拒绝现场话题', () => {
  for (const text of [cases[23][1], cases[25][1]]) {
    assert.equal(验收母亲共居手机内容(text, '私密'), true, text);
    assert.equal(验收母亲共居手机内容(text, '公开朋友圈'), false, text);
    assert.equal(验收双重继承余波公开事实(`母亲:${text}`, []), false, text);
  }
});

test('PLAY023 父亲视角的自述、否定及普通交接仍使用真实模式验收', () => {
  for (const mode of ['母亲机场视频', '双重继承后家常']) {
    assert.equal(验收父亲模式语义('我知道公寓已经正式交给你了。', mode), true);
    assert.equal(验收父亲模式语义('我不知道你和你妈那点事。', mode), true);
    assert.equal(验收父亲模式语义('我早就知道你和你妈那点事。', mode), false);
    assert.equal(验收父亲模式语义('我已经看见机场视频中的隐秘现场。', mode), false);
  }
});

// Execute the original consumer from its parsing/filtering through per-bubble commit and cleanup.
// Only timers, host persistence, branch anchors and summary I/O are adapters; the parser,
// quote resolution, cohabitation qualification and semantic predicates are the real implementation.
const senderSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts', import.meta.url), 'utf8');
const startMarker = '    const 合法回复们 = 解析微信私聊气泡(';
const endMarker = '    return 已写回复.length > 0;';
const start = senderSource.indexOf(startMarker);
const end = senderSource.indexOf(endMarker, start);
assert.ok(start >= 0 && end > start, 'Current production consumer must exist');
assert.equal(senderSource.indexOf(startMarker, start + 1), -1, 'Consumer extraction must be unique');
const consumerCode = ts.transpileModule(`async function runConsumer() {\n${senderSource.slice(start, end + endMarker.length)}\n}`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function runConsumer(raw, options = {}) {
  const data = Schema.parse({});
  data.系统._已完成特殊场景.push('双重继承');
  data.系统._302共居.状态 = '共居';
  assert.equal(母亲共居已开启(data), true);
  const before = JSON.stringify(data);
  const displayed = [];
  const errors = [];
  let live = true;
  let timeline = true;
  let ticks = 0;
  let writes = 0;
  let refreshes = 0;
  let summaries = 0;
  const env = {
    解析微信私聊气泡, 解析微信AI引用前缀, 母亲共居已开启, 验收母亲共居手机内容,
    data, 回: raw, 配: { 妻名: '母亲' }, 手机可见单条硬上限: 150,
    近况消息: options.history ?? [], 会话: '302', 门牌号: '302', 玩家名: () => '测试员',
    回复语义仍有效: () => live && timeline,
    setTimeout: resolve => {
      ticks += 1;
      if (options.cancelAt === ticks) live = false;
      if (options.timelineAt === ticks) timeline = false;
      resolve();
      return 0;
    },
    末楼: () => 32, 回复钟: 17,
    带当前手机分支锚: message => ({ ...message, 分支: 'play023-controlled-branch' }),
    写库增量: async (delta, valid) => {
      writes += 1;
      if (options.failWriteAt === writes) throw new Error('PLAY023 controlled write failure');
      if (options.invalidateWriteAt === writes) timeline = false;
      if (!valid()) return false;
      displayed.push(...structuredClone(delta.新消息));
      return true;
    },
    请求手机重绘: () => { refreshes += 1; },
    手机发送租约仍有效: () => timeline,
    发送租约: {}, 会场私聊: false,
    写会场私聊摘要: async () => { throw new Error('Unexpected meeting path'); },
    排队刷新微信进展摘要: () => { summaries += 1; },
    console: { error: (...args) => { errors.push(args.map(String).join(' ')); } },
  };
  const execute = new Function(...Object.keys(env), `${consumerCode}\nreturn runConsumer;`)(...Object.values(env));
  const result = await execute();
  assert.equal(JSON.stringify(data), before, 'Filtering must not mutate route or save data');
  return { result, displayed, refreshes, summaries, errors };
}
const goodNested = cases[3][1];
const goodHandover = cases[1][1];
const badKnowledge = cases[15][1];
const bubbles = (...texts) => texts.map(text => `母亲:${text}`).join('\n');

test('PLAY023 原生产解析与逐泡筛选保留两条合法消息，只剔除真正知情气泡', async () => {
  const result = await runConsumer(bubbles(goodNested, badKnowledge, goodHandover));
  assert.equal(result.result, true);
  assert.deepEqual(result.displayed.map(message => message.文), [goodNested, goodHandover]);
  assert.equal(result.refreshes, 2);
  assert.equal(result.summaries, 1);
});

test('PLAY023 真实引用指向原消息，引用文字不冒充本次回复的知情事实', async () => {
  const history = [{ 标识: 'play023-source', 会话: '302', 发: '我', 文: badKnowledge, 楼: 30, 时: 16 }];
  const before = JSON.stringify(history);
  const result = await runConsumer(bubbles(`「引用 测试员: ${badKnowledge}」${goodNested}`), { history });
  assert.equal(result.result, true);
  assert.equal(result.displayed.length, 1);
  assert.equal(result.displayed[0].文, goodNested);
  assert.deepEqual(result.displayed[0].引用, { 标识: 'play023-source' });
  assert.equal(JSON.stringify(history), before, 'Original history and identity must remain unchanged');
});

test('PLAY023 伪造或撤回引用继续整泡拒绝，不能借合法回复内容绕过引用门', async () => {
  const raw = bubbles(`「引用 测试员: ${badKnowledge}」${goodNested}`);
  for (const history of [[], [{ 标识: 'play023-withdrawn', 会话: '302', 发: '我', 文: badKnowledge, 类: '撤回' }]]) {
    const result = await runConsumer(raw, { history });
    assert.equal(result.result, false);
    assert.equal(result.displayed.length, 0);
  }
});

test('PLAY023 全部违规气泡仍失败，正常重试可继续而不修改旧历史', async () => {
  const rejected = await runConsumer(bubbles(badKnowledge));
  assert.equal(rejected.result, false);
  assert.equal(rejected.displayed.length, 0);
  const retried = await runConsumer(bubbles(goodNested));
  assert.equal(retried.result, true);
  assert.deepEqual(retried.displayed.map(message => message.文), [goodNested]);
});

for (const [label, options, expected] of [
  ['首泡前取消', { cancelAt: 1 }, []],
  ['第二泡前取消', { cancelAt: 2 }, [goodNested]],
  ['第二泡写入失败', { failWriteAt: 2 }, [goodNested]],
  ['旧时间线到达', { timelineAt: 1 }, []],
  ['最终写入前时间线失效', { invalidateWriteAt: 1 }, []],
]) {
  test(`PLAY023 原逐泡提交生命周期：${label}`, async () => {
    const result = await runConsumer(bubbles(goodNested, goodHandover), options);
    assert.deepEqual(result.displayed.map(message => message.文), expected);
    assert.equal(result.result, expected.length > 0);
    assert.equal(result.refreshes, expected.length);
    if (options.timelineAt || options.invalidateWriteAt) assert.equal(result.summaries, 0);
  });
}

test('PLAY023 重载、交错视角和多次调用不留下正则或话题缓存', () => {
  for (let repeat = 0; repeat < 3; repeat += 1) {
    for (const [label, text, asserted] of JSON.parse(JSON.stringify(cases))) {
      assert.equal(父亲被写成已知关系(text, '母亲'), asserted, label);
    }
    assert.equal(父亲被写成已知关系('我知道你和你妈那点事。', '父亲'), true);
    assert.equal(父亲被写成已知关系('我知道你爸不知道我们的真实关系。', '母亲'), false);
  }
});
