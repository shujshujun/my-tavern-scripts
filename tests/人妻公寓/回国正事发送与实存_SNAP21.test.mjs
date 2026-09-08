/* eslint-disable import-x/no-nodejs-modules -- 独立宿主执行真实任务、解析、发送、凭据与路线提交。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import * as ts from 'typescript';
import { createHost, clone, productionFunction } from './helpers/微信事务恢复环境.mjs';
import { consumerKit } from './helpers/微信余波消费环境.mjs';

function fixture(lines, task = '回应回国') {
  const e = createHost();
  const data = e.st.chat.at(-1).stat_data;
  data.户['302'] = clone(data.户['101']);
  Object.assign(data.系统._回国, {
    阶段: '姐妹茶话会进行中', 茶话会状态: '交代正事', 茶话会成员快照: ['101', '102'],
    群名反应已完成: true, 母亲已坦白: true, 正事已说明: true,
    已点评成员: ['101', '102'], 已回应点评成员: ['101', '102'], 已回应回国成员: [],
  });
  if (task === '坦白') data.系统._回国.母亲已坦白 = false;
  if (task === '点评') Object.assign(data.系统._回国, { 茶话会状态: '逐人调侃', 已点评成员: [] });
  if (task === '转正事') Object.assign(data.系统._回国, { 茶话会状态: '逐人调侃', 正事已说明: false });
  if (task === '收束') data.系统._回国.已回应回国成员 = ['101', '102'];
  e.lines = lines; e.events = []; e.active = true; e.calls = 0;
  const kit = consumerKit(e, async (system, prompt) => {
    e.calls++; e.prompt = prompt;
    if (e.onGenerate) await e.onGenerate();
    return e.lines.join('\n');
  });
  const timeline = e.load('手机时间线租约.ts');
  const proof = e.load('手机/回国提交凭据.ts');
  const floor = () => e.st.chat.length - 1;
  const lease = { 聊天ID: e.id, 楼: floor(), 绝对时段: e.clock(), 数据: clone(data),
    时间线租约: timeline.创建手机时间线租约(e.id, floor(), e.st.chat, e.clock()) };
  const valid = productionFunction('手机/壳/会话瞬态.ts', '手机发送租约仍有效', {
    ...e.globals, ...timeline, 当前聊天ID: () => e.id, 当前手机绝对时段: e.clock,
  });
  e.produce = () => { const db = e.api.读库(); return kit.回国茶话会一拍(data, db, floor(), '林舟连续说了：知道了。', {}, true, 'aPhone20').then(ok => ({ ok, db })); };
  const send = productionFunction('手机/交互/邀约与发消息.ts', '手动群接话', {
    ...e.globals, ...proof, Schema: e.load('../../schema.ts').Schema,
    手机发送租约仍有效: valid,
    手机小生成仍有效: productionFunction('手机/生成引擎.ts', '手机小生成仍有效', {}),
    恢复双重继承群聊余波主状态: async () => {}, 读最近有效stat: () => clone(data),
    末楼: floor, 读库: e.api.读库, 创建群聊引用响应约束: () => undefined,
    新回国茶话会批次标识: () => 'aPhone20',
    姐妹群一拍: (stat, db, level, reason, control, options) => kit.回国茶话会一拍(stat, db, level, reason, control, options.玩家刚发言, options.回国批次标识),
    读取双重继承群聊余波收据: () => null,
    写库增量: (delta, allowed, stats) => e.api.写库增量(delta, () => !e.rejectWrite && allowed(), stats),
    排队刷新群聊进展摘要: () => {}, 请求手机重绘: () => {},
    eventEmit: (...args) => e.events.push(args),
    setTimeout: resolve => { e.onDelay?.(); resolve(); return 0; },
  });
  e.send = () => send('姐妹群', '林舟连续说了：知道了。', lease, { 仍有效: () => e.active });
  e.messages = () => e.api.读库().消息.filter(m => m.会话 === '姐妹群');
  e.commit = () => {
    assert.equal(e.events.length, 1);
    const [event, payload, receipt] = e.events[0];
    assert.equal(event, '人妻公寓:回国茶话会批次完成');
    assert.equal(proof.回国提交凭据有效(receipt, { 聊天ID: e.id, 世代: timeline.读取当前手机时间线租约世代(), 绝对时段: e.clock(), 聊天消息: e.st.chat, 微信消息: e.api.读库().消息 }), true);
    const result = e.load('回国系统.ts').提交回国茶话会批次(data, payload, receipt.消息);
    return { result, payload, data };
  };
  e.data = data;
  return e;
}

const good = ['母亲:你爸大约一周后回国。他在楼里时，公共区域大家还是按普通住户和管理员的关系相处。', '夏乔:我知道了，到时候照常打招呼。'];
const bad = ['母亲:茶还热，大家慢慢喝。', '夏乔:好，今天这茶真香。'];
for (const [label, lines, expected] of [['正常', good, true], ['无关茶水', bad, false],
  ['只说回国', ['母亲:你爸大约一周后回国。', '夏乔:好，知道了。'], false],
  ['疑问', ['母亲:你爸一周后回国吗？公共区域大家按普通住户和管理员相处。', '夏乔:我也不知道。'], false],
  ['否定回国', ['母亲:你爸不会在一周后回国。公共区域大家还是按普通住户和管理员相处。', '夏乔:好。'], false],
  ['其他人代说', ['母亲:茶还热。', '夏乔:父亲一周后回国，公共区域还是按普通住户和管理员相处。'], false]]) {
  test(`SNAP21 真实生成发送链 ${label}`, async () => {
    const e = fixture(lines, '转正事');
    assert.equal(await e.send(), expected);
    if (expected) { const { result, data } = e.commit(); assert.equal(result.成功, true); assert.equal(data.系统._回国.正事已说明, true); }
    else { assert.equal(e.messages().length, 0); assert.equal(e.events.length, 0); }
  });
}
test('SNAP21 旧无关批次实际送达凭据有效，仍不得签发正事完成', async () => {
  const e = fixture(bad, '转正事');
  e.data.系统._回国.正事已说明 = false;
  const messages = bad.map((文, i) => ({ 楼: 4, 时: 20, 会话: '姐妹群', 发: '对方', 文, 键: `回国茶话会:转正事:-:aLegacy21:${i + 1}` }));
  assert.equal(await e.api.写库增量({ 新圈: [], 新消息: messages, 节拍改: {} }), true);
  const stored = e.api.读库().消息;
  const timeline = e.load('手机时间线租约.ts');
  const proof = e.load('手机/回国提交凭据.ts');
  const lease = timeline.创建手机时间线租约(e.id, 4, e.st.chat, 20);
  const receipt = proof.构造回国提交凭据(lease, stored);
  assert.equal(proof.回国提交凭据有效(receipt, { 聊天ID: e.id, 世代: timeline.读取当前手机时间线租约世代(), 绝对时段: 20, 聊天消息: e.st.chat, 微信消息: stored }), true);
  const before = clone(e.data);
  const result = e.load('回国系统.ts').提交回国茶话会批次(e.data, { 任务: '转正事', 玩家已发言: true, 摘要: bad.join('\n') }, receipt.消息);
  assert.equal(result.成功, false);
  assert.deepEqual(e.data, before);
});
test('SNAP21 伪造正确摘要不能替代实际送达的茶水正文', () => {
  const e = fixture(bad, '转正事');
  e.data.系统._回国.正事已说明 = false;
  const result = e.load('回国系统.ts').提交回国茶话会批次(e.data, { 任务: '转正事', 玩家已发言: true, 摘要: good.join('\n') },
    bad.map((文, i) => ({ 会话: '姐妹群', 发: '对方', 文, 键: `回国茶话会:转正事:-:aLegacy21:${i + 1}` })));
  assert.equal(result.成功, false); assert.equal(e.data.系统._回国.正事已说明, false);
});
for (const mode of ['中途取消', '写入失败', '回档', '切聊天', '超时']) test(`SNAP21 ${mode}保留原发送与事务保护`, async () => {
  const e = fixture(good, '转正事');
  if (mode === '中途取消') e.onDelay = () => { e.active = false; };
  e.onGenerate = () => {
    if (mode === '写入失败') e.rejectWrite = true;
    if (mode === '回档') e.st.chat.pop();
    if (mode === '切聊天') e.id = 'other';
    if (mode === '超时') throw new Error('controlled timeout');
  };
  if (mode === '超时') await assert.rejects(e.send(), /controlled timeout/);
  else await e.send();
  assert.equal(e.events.length, 0);
});

for (const [text, expected] of [
  ['父亲大约一周后回国，公共场合与管理员的相处照旧。', true],
  ['你爸下个星期回国，大家在公共场合维持日常住户和管理员的关系。', true],
  ['父亲并不是一周后回国。公共区域大家按普通住户和管理员相处。', false],
  ['父亲一周后回国的说法不是真的。公共区域大家按普通住户和管理员相处。', false],
  ['我只是引用“父亲一周后回国”，并没有确认。公共区域大家按普通住户和管理员相处。', false],
  ['父亲一周后回国。在公共区域不需要按普通住户和管理员相处。', false],
]) test(`SNAP21 扩展口径：${text}`, async () => {
  const e = fixture([`母亲:${text}`, '夏乔:知道了。'], '转正事');
  assert.equal(await e.send(), expected);
});

test('SNAP21 实际index监听段只读一次库并传同一已验证快照', async () => {
  const e = fixture(good, '转正事');
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  let target;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'eventOn' && node.arguments[0]?.text === '人妻公寓:回国茶话会批次完成') target = node;
    ts.forEachChild(node, visit);
  }
  visit(ast); assert.ok(target);
  const messages = good.map((文, i) => ({ 楼: 4, 时: 20, 会话: '姐妹群', 发: '对方', 文, 键: `回国茶话会:转正事:-:aIndex21:${i + 1}` }));
  await e.api.写库增量({ 新圈: [], 新消息: messages, 节拍改: {} });
  const timeline = e.load('手机时间线租约.ts'); const proof = e.load('手机/回国提交凭据.ts');
  const receipt = proof.构造回国提交凭据(timeline.创建手机时间线租约(e.id, 4, e.st.chat, 20), e.api.读库().消息);
  let listener; let reads = 0; let writes = 0;
  const deps = {
    ...e.globals, ...proof,
    eventOn: (_name, fn) => { listener = fn; },
    安全操作: fn => fn({}, e.data),
    当前聊天ID: () => e.id,
    读取当前手机时间线租约世代: timeline.读取当前手机时间线租约世代,
    读微信库: () => { reads++; assert.equal(reads, 1); return e.api.读库(); },
    回国提交凭据有效: (...args) => {
      const valid = proof.回国提交凭据有效(...args);
      receipt.消息[0].文 = '母亲:茶还热。';
      return valid;
    },
    提交回国茶话会批次: e.load('回国系统.ts').提交回国茶话会批次,
    脚本写入: async () => { writes++; }, 捕获保护快照: () => {},
  };
  const js = ts.transpileModule(target.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  Function('deps', `const {${Object.keys(deps).join(',')}}=deps;${js}`)(deps);
  await listener({ 任务: '转正事', 玩家已发言: true, 摘要: '不可信调用摘要' }, receipt);
  assert.equal(reads, 1); assert.equal(writes, 1); assert.equal(e.data.系统._回国.正事已说明, true);
});
