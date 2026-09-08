/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test, { after } from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const loader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = loader;
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (request, parent, main) {
  if (request.endsWith('?raw')) return readFileSync(resolve(dirname(parent.filename), request.slice(0, -4)), 'utf8');
  return originalLoad.call(this, request, parent, main);
};
globalThis._ = require('lodash');
const hosts = [];
function host() {
  const value = Object.assign(new EventTarget(), {
    document: Object.assign(new EventTarget(), { querySelectorAll: () => [], documentElement: null }),
  });
  value.parent = value;
  hosts.push(value);
  return value;
}
globalThis.window = host();
after(() => {
  for (const value of hosts) value.dispatchEvent(new Event('pagehide'));
  Module._load = originalLoad;
});
const ts = require('typescript');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const stage = require('../../src/人妻公寓/stageConfig.ts');
const sourceAPI = require('../../src/人妻公寓/脚本/游戏逻辑/微信摘要来源.ts');
const local = require('../../src/人妻公寓/脚本/游戏逻辑/微信本地进展摘要.ts');
const knowledge = require('../../src/人妻公寓/脚本/游戏逻辑/微信跨渠道见闻.ts');
const db = require('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
const dataAPI = require('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
const { 创建手机已读时锚 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机已读水位.ts');
const { 撤回微信玩家消息 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信消息撤回.ts');
const { 胶囊预算选择 } = require('../../src/人妻公寓/脚本/游戏逻辑/胶囊预算.ts');
const { 格式化游戏内时间 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 楼务微信消息仍有效 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信正文承接.ts');
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/摘要系统.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('摘要系统.ts', source, ts.ScriptTarget.Latest, true);
const names = [
  '推进摘要哈希',
  '微信摘要签名消息',
  '读取会话撤回摘要来源',
  '清理会话旧摘要',
  '读取存活微信摘要',
  '可读微信摘要引用',
  '群聊记忆主体',
  '取群聊摘要快照',
  '群聊摘要快照仍有效',
  '解析群摘要消息',
  '角色群见闻主体',
  '保存群成员见闻摘要',
  '刷新群聊进展摘要',
  '读取角色群聊见闻胶囊',
  '取微信摘要快照',
  '当前微信摘要引用',
  '查找微信摘要点',
  '微信摘要快照仍有效',
  '刷新微信进展摘要',
];
if (ast.statements.some(n => ts.isFunctionDeclaration(n) && n.name?.text === '读取角色姐妹群旧话题')) names.push('读取角色姐妹群旧话题');
const code = names
  .map(name => {
    const declaration = ast.statements.find(item => ts.isFunctionDeclaration(item) && item.name?.text === name);
    assert.ok(declaration, name);
    return declaration.getText(ast).replace(/^export /u, '');
  })
  .join('\n');
const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

function environment() {
  const data = Schema.parse({ 户: Object.fromEntries(stage.门牌列表.map(m => [m, 创建户节点(0)])) });
  data.系统._绝对时段 = 20;
  for (const m of ['101', '301']) data.户[m].妻.当前阶段 = 3;
  let vars = {};
  globalThis.window = host();
  globalThis.SillyTavern = {
    name1: '玩家',
    chat: Array.from({ length: 6 }, (_, i) => ({ mes: `正文${i}`, is_user: false, swipe_id: 0 })),
    getCurrentChatId: () => 'summary-test',
    saveMetadata: async () => {},
  };
  globalThis.Mvu = { getMvuData: () => ({ stat_data: data }) };
  globalThis.getVariables = () => vars;
  globalThis.updateVariablesWith = async update => {
    vars = update(structuredClone(vars));
  };
  const rows = new Map();
  const writes = [];
  let outcome = () => '已确认';
  let generation = 0;
  let compressions = 0;
  const dependencies = {
    ...stage,
    ...knowledge,
    ...require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群已知事实.ts'),
    ...sourceAPI,
    ...local,
    读库: dataAPI.读库,
    当前聊天ID: () => SillyTavern.getCurrentChatId(),
    末楼: () => SillyTavern.chat.length - 1,
    有效楼务任务id集合: () => new Set(),
    序列化微信进展数据: db.序列化微信进展数据,
    规范微信进展数据: db.规范微信进展数据,
    胶囊预算选择,
    格式化游戏内时间,
    手机可见记忆输入上限: 300,
    群聊原始消息上限: 400,
    私聊原始消息上限: 400,
    楼务微信消息仍有效,
    读配置: () => ({ 微信进展摘要: true }),
    数据库状态: () => ({ 可写表格: true, 已装游戏模板: true }),
    确认微信摘要SQLite可写: async () => true,
    当前时间线切换世代: () => generation,
    读取当前手机时间线租约世代: () => generation,
    标记微信摘要SQLite不可用: () => {},
    读取微信进展摘要: (person, keys) => {
      for (const key of keys) {
        const row = rows.get(`${person}\n${key}`);
        if (row && db.规范微信进展数据(JSON.parse(row.结果))) return { 摘要: row.结果, 事件键: row.事件键 };
      }
      return null;
    },
    同步社交轨迹: async (row, valid) => {
      assert.ok(db.规范微信进展数据(JSON.parse(row.结果)), '必须通过真实v1数据验收');
      if (!valid()) return '失败';
      writes.push(row);
      const result = outcome(row);
      if (result === '已确认' && valid()) rows.set(`${row.人物}\n${row.事件键}`, structuredClone(row));
      return result;
    },
    压缩微信会话记录: async (...args) => {
      compressions++;
      return dataAPI.压缩微信会话记录(...args);
    },
  };
  const api = new Function(...Object.keys(dependencies), `${js}; return {${names.join(',')}}`)(
    ...Object.values(dependencies),
  );
  return {
    data,
    rows,
    writes,
    api,
    get vars() {
      return vars;
    },
    get compressions() {
      return compressions;
    },
    outcome(value) {
      outcome = value;
    },
    invalidate() {
      generation++;
    },
    async refresh() {
      const point = api.取群聊摘要快照('姐妹群').点.at(-1);
      await api.刷新群聊进展摘要('姐妹群', 'summary-test', point.事件键, generation, generation);
    },
    async refreshPrivate(m) {
      const point = api.取微信摘要快照(m).点.at(-1);
      await api.刷新微信进展摘要(m, 'summary-test', point.事件键, generation, generation);
    },
    async send(text, extra = {}) {
      await dataAPI.写库增量({
        新圈: [],
        新消息: [{ 楼: 5, 时: 20, 发: '对方', 会话: '姐妹群', 文: text, ...extra }],
        节拍改: {},
      });
    },
    markRead() {
      const last = dataAPI.读库().消息.at(-1);
      vars._微信.读到.姐妹群 = 5;
      vars._微信.读时.姐妹群 = 创建手机已读时锚(5, 20, last.序);
    },
  };
}

const { 解析姐妹群阶段回复 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群阶段验收.ts');
const { 解析姐妹群公开事实 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群公开事实.ts');
const topic = '听说陆嘉明已经接受三人家庭了，下次一起聊这件事。';
const reply = '夏乔:你说陆嘉明已经接受和管理员的家庭安排了？';
function parse(env, text = reply, floor = 5) {
  return 解析姐妹群阶段回复(text, stage.门牌列表, dataAPI.读库().消息, floor, 20, '玩家', false, {},
    m => env.api.读取角色姐妹群旧话题?.(m, floor) ?? {});
}
async function seed(env) {
  await env.send(topic, { 发: '我', 标识: 'phone40-topic' });
  await env.send('夏乔:好，下次再聊。');
  await env.refresh();
}
async function flood(env, count = 410) {
  await env.send('今天的普通近况。', { 发: '我' });
  await dataAPI.写库增量({ 新圈: [], 新消息: Array.from({ length: count }, (_, i) => ({
    楼: 5, 时: 20, 会话: '姐妹群', 发: '对方', 文: `安若妍:普通消息${i}。`,
  })), 节拍改: {} });
  env.markRead(); await env.refresh();
}
test('PLAY040 400条压缩前后本人有限话题资格一致，连续压缩不丢失', async () => {
  const env = environment(); await seed(env);
  assert.ok(parse(env));
  env.data.户['102'].妻.当前阶段 = 3;
  await flood(env);
  assert.equal(dataAPI.读库().消息.some(m => m.标识 === 'phone40-topic'), false);
  assert.ok(env.compressions > 0);
  assert.match(env.api.读取角色群聊见闻胶囊(['101'], 5), /三人家庭/);
  assert.ok(parse(env), '生成能读到的本人旧话不能因合法压缩失去验收资格');
  assert.equal(parse(env, reply.replace('夏乔', '沈静仪')), null, '新成员没有旧话资格');
  assert.equal(解析姐妹群公开事实(dataAPI.读库().消息).借种家庭结构已公开, false, '旧说法不签发公开事实');
  assert.equal(parse(env, `夏乔:「引用 玩家: ${topic}」这件事后来怎样了？`), null, '摘要不能充当可引用原文');
  await flood(env, 150); assert.ok(parse(env));
  assert.equal(parse(env, reply, 4), null, '回档失去来源锚');
  SillyTavern.chat[5] = { mes: '新分支', is_user: false, swipe_id: 1 };
  assert.equal(parse(env), null, '旧分支摘要不能进入新分支');
});
test('PLAY040 撤回来源后有摘要也不能继续授予资格', async () => {
  const env = environment(); await seed(env);
  await env.send('今天普通近况。', { 发: '我' });
  await env.send('夏乔:收到。'); await env.refresh();
  assert.ok(parse(env));
  env.vars._微信.消息 = 撤回微信玩家消息(env.vars._微信.消息, { 标识: 'phone40-topic' }).消息;
  assert.equal(parse(env), null);
});
for (const failure of ['待确认', '失败']) test(`PLAY040 ${failure}的摘要不授权原文缺失的旧话`, async () => {
  const env = environment(); env.outcome(() => failure);
  await seed(env);
  assert.equal(env.compressions, 0);
  env.vars._微信.消息 = env.vars._微信.消息.filter(m => m.标识 !== 'phone40-topic');
  assert.equal(parse(env), null);
});
test('PLAY040 无本人来源标记的旧摘要不新增资格', async () => {
  const env = environment(); await seed(env); await flood(env);
  for (const row of env.rows.values()) row.结果 = row.结果.replace(/\[微信来源:[^\]]+\]/gu, '');
  assert.equal(parse(env), null);
});

for (const failure of ['超时', '取消', '并发换分支']) test(`PLAY040 ${failure}未确认的整理不授予旧话资格`, async () => {
  const env = environment();
  env.outcome(() => {
    if (failure === '超时') throw new Error('controlled timeout');
    if (failure === '取消') env.invalidate();
    if (failure === '并发换分支') SillyTavern.chat[5] = { mes: '并发新分支', is_user: false, swipe_id: 1 };
    return '已确认';
  });
  await seed(env);
  assert.equal(env.compressions, 0);
  env.vars._微信.消息 = env.vars._微信.消息.filter(m => m.标识 !== 'phone40-topic');
  assert.equal(parse(env), null);
});
test('PLAY040 退群或非法发言人不会读取本人的旧话资格', async () => {
  const env = environment(); await seed(env); await flood(env);
  let calls = 0;
  for (const text of [reply, reply.replace('夏乔', '陌生人')]) {
    assert.equal(解析姐妹群阶段回复(text, ['301'], dataAPI.读库().消息, 5, 20, '玩家', false, {}, () => { calls++; return {}; }), null);
  }
  assert.equal(calls, 0);
});
test('PLAY040 普通生成的真实调用按解析出的本人读取资格', () => {
  const tickSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');
  const tickAst = ts.createSourceFile('节拍引擎.ts', tickSource, ts.ScriptTarget.Latest, true);
  let call;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(tickAst) === '解析姐妹群阶段回复') call = node;
    ts.forEachChild(node, visit);
  }
  visit(tickAst); assert.ok(call);
  const callback = call.arguments[8]; assert.ok(callback && ts.isArrowFunction(callback));
  const callbackJS = ts.transpileModule(`const read = ${callback.getText(tickAst)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const observed = [];
  const read = new Function('读取角色姐妹群旧话题', '楼', `${callbackJS}; return read;`)((...args) => { observed.push(args); return {}; }, 5);
  read('101'); read('102'); assert.deepEqual(observed, [['101', 5], ['102', 5]]);
});

for (const compressed of [false, true]) test(`PLAY040 第二轮：他人嵌套转述不能冒充玩家，压缩=${compressed}`, async () => {
  const env = environment();
  await env.send(`安若妍:我只是在举例：玩家“${topic}”`);
  assert.equal(parse(env), null, '原文中没有玩家本人该话题');
  await env.refresh();
  if (compressed) await flood(env);
  assert.equal(env.api.读取角色姐妹群旧话题('101', 5).家庭安排说法 ?? false, false);
  assert.equal(parse(env), null, '相邻角色的话即使提到玩家，也不能变成玩家署名');
});
test('PLAY040 第二轮：玩家自己的嵌套引号不截断后半段真实话题', async () => {
  const env = environment();
  await env.send('关于“下次见面”这件事，我听说陆嘉明已经接受三人家庭了。', { 发: '我', 标识: 'nested-player' });
  await env.send('夏乔:好，下次再聊。');
  assert.ok(parse(env));
  await env.refresh(); await flood(env);
  assert.equal(dataAPI.读库().消息.some(m => m.标识 === 'nested-player'), false);
  assert.match(env.api.读取角色群聊见闻胶囊(['101'], 5), /陆嘉明/);
  assert.ok(parse(env), '完整读取外层玩家条目，包括内层右引号后的文本');
});

test('PLAY040 第二轮：模板必须完整，来源条数不允许正文伪造新增署名', () => {
  const { 解析姐妹群摘要玩家话题 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群已知事实.ts');
  assert.deepEqual(解析姐妹群摘要玩家话题(`[微信来源:s1]群内待续：玩家“关于“下次见面”，${topic}”`), [`关于“下次见面”，${topic}`]);
  for (const entry of [
    `[微信来源:s1]群内待续：安若妍“举例：玩家“${topic}””`,
    `[微信来源:s1]姐妹茶话会最近：安若妍“先这样”；玩家“${topic}”；安若妍“之后再说”`,
    `[微信来源:s1]群内待续：玩家“关于“下次见面”，${topic}`,
    `[微信来源:s1]群内待续：玩家“${topic}”残余文本`,
  ]) assert.deepEqual(解析姐妹群摘要玩家话题(entry), []);
});
