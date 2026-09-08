/* eslint-disable import-x/no-nodejs-modules -- Node-only isolated public-message boundary regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
const _ = require('lodash');
globalThis._ = _;
globalThis.getVariables = () => ({});
const ts = require('typescript');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 门牌列表, 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 验收群聊隐私 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts');
const { 汉字数, 解析微信群消息 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机群聊格式.ts');
const { 微信消息提示行, 解析微信AI引用前缀, 确保群聊指定角色发言 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信消息引用.ts');
const { 楼务微信消息仍有效 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信正文承接.ts');
const { 攻略动态方向 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/内容素材表.ts');
const { 当前阶段谜底禁词 } = require('../../src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');
// Verified current exported configuration in 手机/数据层.ts:58. No data-layer lifecycle is replaced or exercised here.
const 手机可见单条硬上限 = 150;

function loadFunction(path, name, deps) {
  const source = readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${path}`, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const found = ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.equal(found.length, 1, `unique complete current function ${name}`);
  const code = ts.transpileModule(found[0].getText(ast).replace(/^export\s+/, ''), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(deps), code + `\nreturn ${name};`)(...Object.values(deps));
}
const 微信群文本 = loadFunction('手机/生成引擎.ts', '微信群文本', {
  解析微信群消息, 验收群聊隐私, console: { warn() {} },
});
const 校验朋友圈文案 = loadFunction('手机/节拍引擎.ts', '校验朋友圈文案', {
  _, 汉字数, 手机可见单条硬上限, 户静态表, 门牌列表, 攻略动态方向, 当前阶段谜底禁词, 验收群聊隐私,
});
const modes = ['楼务', '姐妹', '姐妹孕情', '朋友圈孕情'];
const names = new Set(['夏乔', '沈静仪']);
const report = '昨晚家里水管漏了，麻烦登记维修。';
const fresh = () => Schema.parse({ 户: { 101: 创建户节点(0), 102: 创建户节点(0) } });
function groupFixture(raw, history = []) {
  const data = fresh(), 库 = { 消息: _.cloneDeep(history) }, calls = [];
  // External model, memory repository, player profile and clock are adapters. The actual roster,
  // request producer, parser/privacy gate, real-quote resolver, required-speaker gate and array writes run unchanged.
  const producer = loadFunction('手机/交互/邀约与发消息.ts', '楼务群一拍', {
    门牌列表, 户静态表, 微信群文本, 微信消息提示行, 解析微信AI引用前缀, 确保群聊指定角色发言,
    手机可见单条硬上限, 楼务微信消息仍有效,
    取绝对时段: stat => stat.系统._绝对时段,
    玩家名: () => '管理员甲',
    读取群聊记忆上下文: () => ({ 近期消息: _.cloneDeep(history), 群内记忆: '' }),
    有效楼务任务id集合: () => new Set(),
    小生成: async (system, user, control) => { calls.push({ system, user, control }); return raw; },
  });
  return { data, 库, calls, run: constraint => producer(data, 库, 12, '请登记需要维修的设施。', undefined, constraint) };
}

for (const mode of modes) for (const time of ['昨晚', '深夜', '半夜']) {
  for (const location of ['房里', '房间', '家里', '家中', '住处', '门里']) {
    test(`SNAP16 ${mode}/${time}/${location}: a public repair fact is not private merely because of time/place`, () => {
      assert.equal(验收群聊隐私(`夏乔:${time}${location}水管漏了，麻烦登记维修。`, mode), true);
    });
  }
}
for (const mode of modes) {
  for (const text of ['家里水管漏了，麻烦登记维修。', '今天家里水管漏了，麻烦登记维修。',
    '昨晚楼道灯坏了，麻烦登记维修。', '半夜家里没有漏水，只是厨房水压不足。',
    '昨晚管理员来家里检查了水管，维修单已经登记。', '昨晚水从她家中流到楼道，麻烦处理管道。']) {
    test(`SNAP16 ${mode} normal/negative repair control: ${text}`, () => assert.equal(验收群聊隐私(`夏乔:${text}`, mode), true));
  }
  for (const text of ['昨晚家里有人过夜，这件事别外传。', '昨晚家里没有人过夜，别再问了。',
    '有人说“昨晚她家里有人过夜”，不要再转发。', '我看见她半夜从管理员房间出来。',
    '昨晚她进入管理员的房间。', '昨晚他们在家里独处。',
    '昨晚家里水管漏了，顺便转发她的私聊内容。', '我看见你们昨晚在房里接吻。']) {
    test(`SNAP16 ${mode} genuine private/quoted/negated private assertion remains rejected: ${text}`, () => {
      assert.equal(验收群聊隐私(`夏乔:${text}`, mode), false);
    });
  }
  test(`SNAP16 ${mode}: parser filters privacy and strangers before applying quota`, async () => {
    const raw = ['陌生住户:已经记下了。', '夏乔:她的私聊里提到了安排。', `夏乔:${report}`, '沈静仪:收到，楼道灯也请登记。'].join('\n');
    assert.deepEqual(await 微信群文本(raw, names, 150, 2, 'SNAP16', mode), [`夏乔:${report}`, '沈静仪:收到，楼道灯也请登记。']);
    assert.deepEqual(await 微信群文本('陌生住户:已经记下了。', names, 150, 2, 'SNAP16', mode), []);
    assert.deepEqual(await 微信群文本('', names, 150, 2, 'SNAP16', mode), []);
    assert.deepEqual(await 微信群文本(`夏乔:${'报修'.repeat(80)}`, names, 150, 2, 'SNAP16', mode), []);
  });
}

test('actual 楼务群一拍 uses allowed repair task, real roster and saves only actual accepted candidate', async () => {
  const e = groupFixture(`夏乔:${report}`);
  const before = _.cloneDeep(e.data);
  assert.equal(await e.run(), true);
  assert.equal(e.calls.length, 1);
  assert.match(e.calls[0].system, /报告同类楼务问题/);
  assert.match(e.calls[0].system, /严禁.*私人微信/);
  assert.match(e.calls[0].user, /夏乔\(101室住户\)/);
  assert.match(e.calls[0].user, /沈静仪\(102室住户\)/);
  assert.equal(e.库.消息.length, 1);
  assert.equal(e.库.消息[0].文, `夏乔:${report}`);
  assert.equal(e.库.消息[0].会话, '群');
  assert.deepEqual(e.data, before);
});

test('actual producer preserves mandatory reply/follow-up after filtering; never invents a missing speaker', async () => {
  const constraint = { 必答角色: '夏乔', 必答画像: '101住户', 跟聊角色: '沈静仪', 跟聊画像: '102住户', 跟聊事件键: 'snap16-follow' };
  const good = groupFixture(`沈静仪:收到，楼道灯也请登记。\n夏乔:${report}`);
  assert.equal(await good.run(constraint), true);
  assert.deepEqual(good.库.消息.map(message => message.文), [`夏乔:${report}`, '沈静仪:收到，楼道灯也请登记。']);
  assert.equal(good.库.消息[1].键, 'snap16-follow');
  for (const raw of ['夏乔:她的私聊内容已经告诉我了。\n沈静仪:收到。',
    `夏乔:${report}`, '陌生住户:我替夏乔答复。\n沈静仪:收到。']) {
    const e = groupFixture(raw);
    assert.equal(await e.run(constraint), false);
    assert.deepEqual(e.库.消息, []);
    assert.equal(e.calls.length, 1);
  }
});

test('actual producer accepts an exact existing public repair quote, but rejects invented or withdrawn citations', async () => {
  const history = [{ 序: 1, 楼: 9, 时: 0, 会话: '群', 发: '对方', 文: `夏乔:${report}` }];
  const raw = `沈静仪:「引用 夏乔: ${report}」我也补充登记一下水压问题。`;
  const good = groupFixture(raw, history);
  assert.equal(await good.run(), true);
  assert.equal(good.库.消息.length, 2);
  assert.equal(good.库.消息[1].文, '沈静仪:我也补充登记一下水压问题。');
  assert.ok(good.库.消息[1].引用);
  for (const changed of [[], [{ ...history[0], 序: undefined }], [{ ...history[0], 类: '撤回' }], [{ ...history[0], 会话: '101' }]]) {
    const e = groupFixture(raw, changed);
    assert.equal(await e.run(), false);
    assert.deepEqual(e.库.消息, changed);
  }
});

test('actual producer refuses empty, private-only, non-roster and absent-resident output without fallback messages', async () => {
  for (const raw of ['', '夏乔:私聊里说过了。', '陌生住户:收到。', '母亲:我也登记维修。']) {
    const e = groupFixture(raw);
    assert.equal(await e.run(), false);
    assert.deepEqual(e.库.消息, []);
    assert.equal(e.calls.length, 1);
  }
  const emptyHouse = groupFixture(`夏乔:${report}`);
  emptyHouse.data.户 = {};
  assert.equal(await emptyHouse.run(), false);
  assert.equal(emptyHouse.calls.length, 0);
});

for (const state of ['未孕', '已告知']) {
  test(`actual public-post consumer ${state}: accepts repair, keeps private-channel and outsider boundaries`, () => {
    const data = fresh();
    data.户['101'].妻._怀孕.状态 = state;
    assert.equal(校验朋友圈文案(`夏乔:${report}`, '夏乔', '101', false, data), report);
    assert.equal(校验朋友圈文案('昨晚她的私聊内容已经告诉我了。', '夏乔', '101', false, data), '');
    assert.notEqual(校验朋友圈文案('昨晚家里收到一条私聊。', '夏乔', '101', true, data), '');
    assert.equal(校验朋友圈文案('昨晚沈静仪家里水管漏了。', '夏乔', '101', false, data), '');
    assert.equal(校验朋友圈文案('“水管坏了”，她说道。', '夏乔', '101', false, data), '');
  });
}

function automaticFixture(raw) {
  const data = fresh(), 库 = { 消息: [], 节拍: {} };
  const e = { data, 库, valid: true, calls: [], key: 'snap16-automatic-fixture', clock: 999 };
  // Eligibility feeds (friend repository, hospital policy, random roll, clock span, profile and absent
  // wardrobe aftermath) are controlled adjacent-module adapters. The complete current automatic
  // consumer, real group parser/privacy gate, late validity check, array write and watermark update run.
  const producer = loadFunction('手机/节拍引擎.ts', '楼务群自动消息', {
    门牌列表, 户静态表, 微信群文本, 手机可见单条硬上限,
    楼务群节拍键: e.key,
    旧钟楼跨度转时段: span => span,
    读余波: () => null,
    余波缓冲楼: 0,
    seededRandom: () => 0,
    微信好友: () => [{ 类: '妻', id: '101', 名: '夏乔' }, { 类: '妻', id: '102', 名: '沈静仪' }],
    读取医院内容策略: () => ({ 允许普通自动内容: true }),
    读取群聊记忆上下文: () => ({ 群内记忆: '', 最近聊天: '' }),
    编译楼务群公开风闻摘要: () => { throw new Error('unexpected high-rumor fixture'); },
    称呼纪律: () => '',
    家庭事实: () => '沿用当前公开身份。',
    小生成: async (system, user) => { e.calls.push({ system, user }); return typeof raw === 'function' ? raw(e) : raw; },
  });
  e.run = () => producer({ data, 库, 楼: 12, 钟: e.clock, 倍: 1, 时间线仍有效: () => e.valid,
    登记待提交余波: () => { throw new Error('unexpected aftermath consumption'); } });
  return e;
}

test('actual automatic public-repair consumer saves the accepted candidate and advances only its own watermark', async () => {
  const e = automaticFixture(`夏乔:${report}`);
  e.库.节拍.unrelated = 23;
  assert.equal(await e.run(), '有新');
  assert.equal(e.calls.length, 1);
  assert.match(e.calls[0].user, /报修\/取快递\/天气/);
  assert.deepEqual(e.库.消息.map(message => message.文), [`夏乔:${report}`]);
  assert.equal(e.库.节拍[e.key], e.clock);
  assert.equal(e.库.节拍.unrelated, 23);
});

test('actual automatic private/stranger/empty rejection preserves message list and watermark for later retry', async () => {
  for (const raw of ['夏乔:她的私聊里提到过安排。', '陌生住户:收到。', '']) {
    const e = automaticFixture(raw);
    assert.equal(await e.run(), '无新');
    assert.deepEqual(e.库.消息, []);
    assert.deepEqual(e.库.节拍, {});
    assert.equal(e.calls.length, 1);
  }
});

test('actual automatic late invalidation and existing cooldown do not consume a repair candidate', async () => {
  const late = automaticFixture(e => { e.valid = false; return `夏乔:${report}`; });
  assert.equal(await late.run(), '中止');
  assert.deepEqual(late.库, { 消息: [], 节拍: {} });
  const cooling = automaticFixture(`夏乔:${report}`);
  cooling.库.节拍[cooling.key] = cooling.clock;
  assert.equal(await cooling.run(), '无新');
  assert.equal(cooling.calls.length, 0);
  assert.deepEqual(cooling.库.消息, []);
  assert.equal(cooling.库.节拍[cooling.key], cooling.clock);
});

test('pregnancy-specific public permission remains separate; no fact or authority expanded by night/place repair', () => {
  assert.equal(验收群聊隐私('夏乔:怀孕的消息已经正式告诉大家了。', '楼务'), false);
  assert.equal(验收群聊隐私('夏乔:怀孕的消息已经正式告诉大家了。', '姐妹孕情'), true);
  assert.equal(验收群聊隐私('夏乔:怀孕的消息已经正式告诉大家了。', '朋友圈孕情'), true);
  assert.equal(验收群聊隐私('夏乔:仅你可见的内容也发到这里。', '朋友圈孕情'), false);
  assert.equal(验收群聊隐私('母亲:我看过那盘CAM-2母带。', '回国茶话会'), false);
  for (const mode of modes) assert.equal(验收群聊隐私('  ', mode), false);
});
