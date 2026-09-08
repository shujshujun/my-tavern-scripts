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
for (const legacy of [false, true]) test(`PLAY040 ${legacy ? '旧400字符摘要恢复' : '新摘要完整条目'}：压缩后保留可验证玩家话题`, async () => {
  const env = environment();
  const topic = '今天我在大堂听人提起，听说陆嘉明已经接受三人家庭了。';
  const reply = '夏乔:你说陆嘉明已经接受和管理员的家庭安排了？';
  const parse = () => 解析姐妹群阶段回复(reply, stage.门牌列表, dataAPI.读库().消息, 5, 20, '玩家', false, {},
    m => env.api.读取角色姐妹群旧话题(m, 5));
  await env.send(topic, { 发: '我', 标识: 'truncated-player-topic' });
  for (let i = 0; i < 4; i++) await env.send(`安若妍:${'今天一切照常。'.repeat(12)}${i}`);
  assert.ok(parse(), '压缩前真实玩家消息提供资格');
  await env.refresh();
  if (legacy) {
    const old = JSON.parse(readFileSync(new URL('./fixtures/姐妹群旧版截断摘要_PLAY040.json', import.meta.url), 'utf8')).entry;
    assert.equal(old.length, 400, '来自修前真实v1生产输出的固定旧档');
    for (const row of env.rows.values()) {
      const payload = JSON.parse(row.结果);
      payload.f = payload.f.map(value => value.includes(topic) ? old : value);
      row.结果 = db.序列化微信进展数据(payload);
    }
  }
  const beforeEntries = [...env.rows.values()].flatMap(row => JSON.parse(row.结果).f).filter(value => value.includes(topic));
  assert.ok(beforeEntries.length > 0);
  assert.ok(beforeEntries.every(value => value.length <= 400));
  if (!legacy) assert.ok(beforeEntries.every(value => value.endsWith('”')), '新生产条目须在完整气泡边界收口');
  await env.send('今天的普通近况。', { 发: '我' });
  await dataAPI.写库增量({ 新圈: [], 新消息: Array.from({ length: 410 }, (_, i) => ({
    楼: 5, 时: 20, 会话: '姐妹群', 发: '对方', 文: `安若妍:普通消息${i}。`,
  })), 节拍改: {} });
  env.markRead(); await env.refresh();
  const originalRemoved = !dataAPI.读库().消息.some(message => message.标识 === 'truncated-player-topic');
  const capsule = env.api.读取角色群聊见闻胶囊(['101'], 5);
  const eligibility = env.api.读取角色姐妹群旧话题('101', 5);
  const result = parse();
  assert.ok(originalRemoved);
  assert.ok(capsule.includes(topic), '已存活个人胶囊仍包含完整第一条玩家话题');
  assert.ok(eligibility.家庭安排说法);
  assert.ok(result, '完整且来源可证的玩家话题应在压缩后继续生效');
});
