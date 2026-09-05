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

test('超过400条后的承诺仍能供实际接收者回忆，新入群者不继承此前的约定', async () => {
  const env = environment();
  await env.send('下次一起整理相框，时间说定了。', { 发: '我', 标识: 'promise' });
  await env.send('夏乔:好，下次一起。');
  await env.refresh();
  env.data.户['102'].妻.当前阶段 = 3;
  await dataAPI.写库增量({
    新圈: [],
    新消息: Array.from({ length: 410 }, (_, i) => ({
      楼: 5,
      时: 20,
      会话: '姐妹群',
      发: '对方',
      文: `安若妍:普通近况${i}。`,
    })),
    节拍改: {},
  });
  env.markRead();
  await env.refresh();
  assert.ok(dataAPI.读库().消息.length < 412);
  assert.ok(env.compressions > 0);
  const known = env.api.读取角色群聊见闻胶囊(['101'], 5);
  assert.match(known, /下次一起整理相框/);
  assert.doesNotMatch(known, /微信来源:/, '内部来源ID不进入角色提示');
  assert.doesNotMatch(env.api.读取角色群聊见闻胶囊(['102'], 5), /下次一起整理相框/);
  assert.equal(env.api.读取角色群聊见闻胶囊(['101'], 5, 1200, '群'), '', '姐妹群旧话不进入住户群');
  await dataAPI.写库增量({
    新圈: [],
    新消息: Array.from({ length: 150 }, (_, i) => ({
      楼: 5,
      时: 20,
      会话: '姐妹群',
      发: '对方',
      文: `安若妍:又一批近况${i}。`,
    })),
    节拍改: {},
  });
  assert.match(env.api.读取角色群聊见闻胶囊(['101'], 5), /下次一起整理相框/, '新消息尚未整理时也能找到已确认旧摘要');
  env.markRead();
  await env.refresh();
  assert.match(env.api.读取角色群聊见闻胶囊(['101'], 5), /下次一起整理相框/, '跨两次压缩仍保留原来的约定');
  const beforeWrites = env.writes.length;
  await env.refresh();
  assert.equal(env.writes.length, beforeWrites, '同一来源锚的重复整理不重复写摘要');
});

test('部分角色保存待确认、失败或切分支时保留全部原文，重试续办后才压缩', async () => {
  const env = environment();
  await env.send('安若妍:明天一起整理相框。');
  env.outcome(row => (row.人物.startsWith('安若妍·') ? '待确认' : '已确认'));
  await env.refresh();
  assert.equal(env.compressions, 0);
  const firstWrites = env.writes.filter(row => row.人物.startsWith('夏乔·')).length;
  env.outcome(row => (row.人物.startsWith('安若妍·') ? '失败' : '已确认'));
  await env.refresh();
  assert.equal(env.compressions, 0);
  assert.equal(env.writes.filter(row => row.人物.startsWith('夏乔·')).length, firstWrites);
  env.outcome(() => '已确认');
  await env.refresh();
  assert.ok(env.compressions > 0);
  await env.send('安若妍:这条在等待期间切换了分支。');
  const count = env.compressions;
  env.outcome(() => {
    env.invalidate();
    return '已确认';
  });
  await env.refresh();
  assert.equal(env.compressions, count);
});

test('先前收到过消息的角色退出当前群后，压缩仍保留她的来源锚并可单独回忆', async () => {
  const env = environment();
  env.data.户['102'].妻.当前阶段 = 3;
  await env.send('下次一起看相框。', { 发: '我', 标识: 'p' });
  await env.send('沈静仪:好，时间再说。');
  await env.refresh();
  env.data.户['102'].妻.当前阶段 = 2;
  await dataAPI.写库增量({
    新圈: [],
    新消息: Array.from({ length: 410 }, (_, i) => ({
      楼: 5,
      时: 20,
      会话: '姐妹群',
      发: '对方',
      文: `安若妍:后来话题${i}。`,
    })),
    节拍改: {},
  });
  env.markRead();
  await env.refresh();
  assert.ok(dataAPI.读库().消息.some(row => row.文 === '沈静仪:好，时间再说。'));
  assert.match(env.api.读取角色群聊见闻胶囊(['102'], 5), /下次一起看相框/);
  assert.doesNotMatch(env.api.读取角色群聊见闻胶囊(['102'], 5), /后来话题/);
});

test('较早消息撤回而末条未变时，摘要只撤销相关内容；回档和重掷不授权旧分支摘要', async () => {
  const env = environment();
  await env.send('下次一起整理相框。', { 发: '我', 标识: 'p' });
  await env.send('夏乔:好，时间说定了。');
  await env.send('安若妍:这件小事之后再说。');
  await env.refresh();
  const point = env.api.取群聊摘要快照('姐妹群').点.at(-1).事件键;
  env.vars._微信.消息 = 撤回微信玩家消息(env.vars._微信.消息, { 标识: 'p' }).消息;
  assert.equal(env.api.取群聊摘要快照('姐妹群').点.at(-1).事件键, point);
  const text = env.api.读取角色群聊见闻胶囊(['101'], 5);
  assert.doesNotMatch(text, /下次一起整理相框/);
  assert.match(text, /这件小事之后再说/);
  assert.equal(env.api.读取角色群聊见闻胶囊(['101'], 4), '');
  SillyTavern.chat[5] = { mes: '重掷的新分支', is_user: false, swipe_id: 1 };
  assert.equal(env.api.读取角色群聊见闻胶囊(['101'], 5), '');
});

test('私聊与群聊本地合并器均保留真实来源，旧无来源条目只在本会话确有撤回时撤销注入资格', () => {
  const rows = [
    { 说话者: '玩家', 内容: '下次一起看照片。', 来源: 's1' },
    { 说话者: '夏乔', 内容: '好，下次再说。', 来源: 's2' },
  ];
  for (const merge of [local.合并本地微信进展摘要, local.合并本地群聊进展摘要]) {
    const data = merge(undefined, '夏乔', rows);
    assert.ok(db.规范微信进展数据(data));
    assert.ok(data.a.some(line => line.includes('s1|s2')));
    const filtered = sourceAPI.排除已撤回微信摘要(data, new Set(['s1']));
    assert.equal(filtered.a.length, 0);
    assert.ok(filtered.p.some(line => line.includes('下次再说')));
    assert.ok(data.a.length, '读取时不修改已保存的原摘要');
  }
  const legacy = { v: 1, f: ['没有来源标识的旧话'], a: [], b: [], p: [] };
  assert.deepEqual(sourceAPI.排除已撤回微信摘要(legacy, new Set()), legacy);
  assert.deepEqual(sourceAPI.排除已撤回微信摘要(legacy, new Set(['s1'])).f, []);
});

test('实际私聊生产者和数据库胶囊消费口使用同一撤回来源，末条版本不变也不会带回旧原文', async () => {
  const env = environment();
  await env.send('下次一起整理相框。', { 会话: '101', 发: '我', 标识: 'private-p1' });
  await env.send('好，下次一起。', { 会话: '101' });
  await env.refreshPrivate('101');
  await env.send('今天窗外很亮。', { 会话: '101', 发: '我', 标识: 'private-p2' });
  await env.send('嗯，看起来天气不错。', { 会话: '101' });
  await env.refreshPrivate('101');
  const oldRefs = env.api.当前微信摘要引用(['101'], 5);
  const dbSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', import.meta.url), 'utf8');
  const dbAst = ts.createSourceFile('数据库桥.ts', dbSource, ts.ScriptTarget.Latest, true);
  const dbNames = ['解析微信进展数据', '渲染微信进展数据', '读取微信进展胶囊'];
  const text = dbNames
    .map(name =>
      dbAst.statements
        .find(item => ts.isFunctionDeclaration(item) && item.name?.text === name)
        .getText(dbAst)
        .replace(/^export /u, ''),
    )
    .join('\n');
  const dbJS = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const dependencies = {
    ...sourceAPI,
    胶囊预算选择,
    数据库状态: () => ({ 已装游戏模板: true }),
    规范微信进展数据: db.规范微信进展数据,
    转义数据库记忆胶囊文本: db.转义数据库记忆胶囊文本,
    取微信进展行: () =>
      [...env.rows.values()].map(row => ({ character_name: row.人物, event_key: row.事件键, result: row.结果 })),
  };
  const render = new Function(...Object.keys(dependencies), `${dbJS};return 读取微信进展胶囊`)(
    ...Object.values(dependencies),
  );
  assert.match(render(oldRefs, 5), /整理相框/);
  env.vars._微信.消息 = 撤回微信玩家消息(env.vars._微信.消息, { 标识: 'private-p1' }).消息;
  const currentRefs = env.api.当前微信摘要引用(['101'], 5);
  assert.equal(currentRefs[0].有效事件键[0], oldRefs[0].有效事件键[0]);
  const result = render(currentRefs, 5);
  assert.doesNotMatch(result, /整理相框|微信来源:/);
  assert.match(result, /天气不错/);
});

test('私聊新增超过120条尚未整理时仍引用已确认旧摘要，重新整理继续合并旧约定', async () => {
  const env = environment();
  await env.send('下次一起整理相框。', { 会话: '101', 发: '我', 标识: 'p' });
  await env.send('好，下次一起。', { 会话: '101' });
  await env.refreshPrivate('101');
  const oldKey = env.api.当前微信摘要引用(['101'], 5)[0].有效事件键[0];
  env.data.系统._绝对时段 = 21;
  await dataAPI.写库增量({
    新圈: [],
    新消息: Array.from({ length: 150 }, (_, i) => ({
      楼: 5,
      时: 21,
      会话: '101',
      发: '对方',
      文: `后来主动近况${i}。`,
    })),
    节拍改: {},
  });
  assert.equal(env.api.当前微信摘要引用(['101'], 5)[0].有效事件键[0], oldKey);
  await env.refreshPrivate('101');
  const newKey = env.api.当前微信摘要引用(['101'], 5)[0].有效事件键[0];
  assert.notEqual(newKey, oldKey);
  assert.match(env.rows.get(`夏乔\n${newKey}`).结果, /下次一起整理相框/);
  env.data.系统._绝对时段 = 20;
  assert.equal(env.api.当前微信摘要引用(['101'], 5)[0].有效事件键[0], oldKey, '回到旧时段只授权旧来源版本');
});
