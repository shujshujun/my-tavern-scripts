/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const ts = require('typescript');
globalThis._ = require('lodash');

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
const 渲染index源码 = readFileSync(new URL('./壳/渲染/index.ts', 手机目录), 'utf8');
const 渲染chats源码 = readFileSync(new URL('./壳/渲染/chats.ts', 手机目录), 'utf8');
const 渲染chat源码 = readFileSync(new URL('./壳/渲染/chat.ts', 手机目录), 'utf8');
const 渲染moments源码 = readFileSync(new URL('./壳/渲染/moments.ts', 手机目录), 'utf8');
const 渲染共享源码 = readFileSync(new URL('./壳/渲染/共享.ts', 手机目录), 'utf8');
const index源码 = readFileSync(new URL('../index.ts', 手机目录), 'utf8');

const {
  手机记录在当前时间线,
  规范手机已读时锚,
  手机分支变更后已读时锚,
  创建手机已读时锚,
  最后手机时间记录,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机已读水位.ts');
const { 创建手机时间线租约, 手机时间线租约仍有效, 作废当前手机时间线租约世代 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts',
);

function 截源(源, 开始, 结束) {
  const 起 = 源.indexOf(开始);
  const 止 = 源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源.slice(起, 止);
}

/** 把无 import 的 TS 片段转译为 CommonJS 并注入外部依赖执行（transpile-only，同 P7 测试模式）。 */
function 执行TS片段(片段, 导出名, 依赖 = {}) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(依赖), js)(module, module.exports, ...Object.values(依赖));
  return module.exports;
}

test('时段 -1 未就绪：当前/过去楼可见、未来楼仍被滤掉；已就绪后未来时段仍被滤掉', () => {
  assert.equal(手机记录在当前时间线({ 楼: 5, 时: 3 }, 10, -1), true, '未就绪时过去楼仍可见');
  assert.equal(手机记录在当前时间线({ 楼: 10, 时: 9 }, 10, -1), true, '未就绪时当前楼仍可见');
  assert.equal(手机记录在当前时间线({ 楼: 11, 时: 3 }, 10, -1), false, '未就绪也不能绕过楼轴放行未来楼');
  assert.equal(手机记录在当前时间线({ 楼: 5 }, 10, -1), false, '未就绪仍要求记录时字段可识别');
  assert.equal(手机记录在当前时间线({ 楼: 5, 时: 3 }, 10, 3), true, '已就绪按时轴正常放行');
  assert.equal(手机记录在当前时间线({ 楼: 5, 时: 4 }, 10, 3), false, '已就绪后未来时段仍被滤掉');
  assert.equal(手机记录在当前时间线({ 楼: 5, 时: 3 }, 10, 0), false, '0 是合法世界钟，不享受未就绪放行');
});

test('规范手机已读时锚：-1 时保留匹配正时段锚；缺锚/失配取同楼最大时段；就绪后修复时:-1 降级态', () => {
  const 记录 = [
    { 楼: 10, 时: 2 },
    { 楼: 10, 时: 5 },
  ];
  assert.deepEqual(规范手机已读时锚(10, { 楼: 10, 时: 5 }, 记录, -1), { 楼: 10, 时: 5 }, '未就绪不得把正时段锚降成 -1');
  assert.deepEqual(规范手机已读时锚(10, undefined, 记录, -1), { 楼: 10, 时: 5 }, '缺锚时取同楼可识别最大时段');
  assert.deepEqual(规范手机已读时锚(10, { 楼: 12, 时: 5 }, 记录, -1), { 楼: 10, 时: 5 }, '锚楼失配同样取最大时段');
  assert.deepEqual(规范手机已读时锚(10, { 楼: 10, 时: 5 }, 记录, 3), { 楼: 10, 时: 2 }, '已就绪仍按不超前于世界钟重建');
  assert.deepEqual(规范手机已读时锚(10, { 楼: 10, 时: -1 }, 记录, 3), { 楼: 10, 时: 2 }, '就绪后非负楼的时:-1 降级态从存活记录修复');
  assert.deepEqual(规范手机已读时锚(-1, { 楼: -1, 时: -1 }, 记录, 3), { 楼: -1, 时: -1 }, '数字楼/锚时同为 -1 的从未读哨兵仍兼容');
});

test('手机分支变更后已读时锚：未就绪收口不把存活正时段水位降为 -1', () => {
  const 存活 = [
    { 楼: 9, 时: 4 },
    { 楼: 9, 时: 2 },
  ];
  assert.deepEqual(手机分支变更后已读时锚(10, { 楼: 10, 时: 5 }, 存活, -1, 10, 10), { 楼: 9, 时: 4 }, '未就绪取最大时段');
  assert.deepEqual(手机分支变更后已读时锚(10, { 楼: 10, 时: 5 }, 存活, 3, 10, 10), { 楼: 9, 时: 2 }, '已就绪按世界钟收口');
});

test('筛当前手机时间线 删除时段<0 整表直返；渲染层不再用 当前绝对时段 < 0 绕过统一判断', () => {
  const 筛段 = 截源(数据层源码, 'function 筛当前手机时间线', 'export function 带当前手机分支锚');
  assert.doesNotMatch(筛段, /当前绝对时段 < 0/, '筛当前手机时间线 不得再整表直返');
  assert.match(筛段, /手机记录在当前时间线/);
  assert.match(筛段, /手机记录属于当前分支/, '楼轴之外的分支轴必须始终执行');
  assert.doesNotMatch(渲染index源码, /当前绝对时段 < 0/, '渲染层不得再用 当前绝对时段 < 0 绕过统一判断');
  assert.match(渲染index源码, /手机记录在当前时间线\(记录, 楼, 当前绝对时段\)/);
});

test('数据层实时已读入口：冻结时间线租约，锚定最后实际记录，前台失效/租约失败不写', async () => {
  let 聊天ID = 'chat-a';
  const 楼 = 0;
  let 时段 = 4;
  globalThis.SillyTavern = { chat: [{ is_user: false, mes: '锚', swipe_id: 0 }] };
  let 写库调用 = null;
  // 目标会话的最后一条对方记录带单调序：已读锚必须锚到它，而不是“当前楼/当前时段”。
  let 读库结果 = {
    消息: [{ 楼: 0, 时: 4, 会话: '101', 发: '对方', 文: '最后一条', 序: 7 }],
    圈: [],
  };
  const 写库增量桩 = async (增, 允许写入) => {
    写库调用 = { 增, 允许写入 };
    return 允许写入();
  };
  const { 写实时手机已读 } = 执行TS片段(
    截源(数据层源码, 'export async function 写实时手机已读', 'function 赴约仍活动'),
    ['写实时手机已读'],
    {
      当前聊天ID: () => 聊天ID,
      末楼: () => 楼,
      当前手机绝对时段: () => 时段,
      创建手机时间线租约,
      手机时间线租约仍有效,
      创建手机已读时锚,
      最后手机时间记录,
      读库: () => 读库结果,
      写库增量: 写库增量桩,
    },
  );

  // 会话目标：锚到最后一条对方记录（含序），朋友圈目标：锚到最后一条圈（含序）。
  assert.equal(await 写实时手机已读({ 会话: '101' }), true);
  assert.deepEqual(写库调用.增.读到改, { '101': { 楼: 0, 时: 4, 序: 7 } });
  assert.equal(写库调用.增.圈读到改, undefined);
  assert.equal(写库调用.允许写入(), true, '提交回调内复核的租约此刻仍有效');

  写库调用 = null;
  读库结果 = { 消息: [], 圈: [{ 楼: 0, 时: 4, 谁: '夏乔', 文: '动态', 序: 3 }] };
  await 写实时手机已读({ 朋友圈: true });
  assert.deepEqual(写库调用.增.圈读到改, { 楼: 0, 时: 4, 序: 3 });
  assert.equal(写库调用.增.读到改, undefined);

  // 租约创建失败（无聊天 ID、时段 -1）返回 false 且不调 写库增量。
  写库调用 = null;
  聊天ID = '';
  assert.equal(await 写实时手机已读({ 会话: '101' }), false);
  assert.equal(写库调用, null, '无聊天 ID 不得写水位');
  聊天ID = 'chat-a';
  时段 = -1;
  assert.equal(await 写实时手机已读({ 朋友圈: true }), false);
  assert.equal(写库调用, null, '时段 -1 未就绪不得写水位');

  // 前台失效（关闭/切页）：先恢复一条会话 101 的对方目标记录，才能走到写库回调内复核。
  写库调用 = null;
  时段 = 4;
  读库结果 = { 消息: [{ 楼: 0, 时: 4, 会话: '101', 发: '对方', 文: '前台失效目标', 序: 7 }], 圈: [] };
  assert.equal(await 写实时手机已读({ 会话: '101' }, () => false), false);
  assert.ok(写库调用, '前台失效仍走到写库回调内复核');
  assert.equal(写库调用.允许写入(), false, '前台校验在回调内使复核失效');

  // 无目标记录：不预读未来消息，直接返回 false 且不调 写库增量。
  写库调用 = null;
  读库结果 = { 消息: [{ 楼: 0, 时: 4, 会话: '101', 发: '我', 文: '只有玩家消息' }], 圈: [] };
  assert.equal(await 写实时手机已读({ 会话: '101' }), false);
  assert.equal(写库调用, null, '无目标记录不得写水位');

  // 复核函数真实复用同一租约 + 前台校验：世代作废 / 时段变化 / 切聊都会令提交失效。
  写库调用 = null;
  读库结果 = { 消息: [{ 楼: 0, 时: 4, 会话: '101', 发: '对方', 文: '最后', 序: 7 }], 圈: [] };
  assert.equal(await 写实时手机已读({ 会话: '101' }), true);
  const 复核 = 写库调用.允许写入;
  作废当前手机时间线租约世代();
  assert.equal(复核(), false, '世代作废后旧已读不得再提交');
  时段 = 5;
  assert.equal(复核(), false, '世界时段变化后旧已读不得再提交');
  聊天ID = 'chat-b';
  assert.equal(复核(), false, '切聊后旧已读不得再提交');
  聊天ID = 'chat-a';
  时段 = 4;
  assert.equal(复核(), false, '世代作废后恢复同值也不能复活');
});

test('隔离当前手机分支：允许写入 在回调最前复核，失效不改 _微信、不刷新红点、返回未写', async () => {
  let 允许写入 = () => true;
  let 红点刷新 = 0;
  let 变量对象 = null;
  const 原始库 = {
    消息: [{ 楼: 9, 时: 3, 会话: '101', 发: '对方', 文: '旧消息' }],
    圈: [],
    读到: { '101': 9 },
    读时: { '101': { 楼: 9, 时: 3 } },
    圈读到: 9,
    圈读时: { 楼: 9, 时: 3 },
    节拍: {},
    已发私聊图: {},
  };
  const { 隔离当前手机分支 } = 执行TS片段(
    截源(数据层源码, 'export async function 隔离当前手机分支', 'export function 读库'),
    ['隔离当前手机分支'],
    {
      末楼: () => 10,
      当前手机绝对时段: () => 4,
      裁同楼切分支记录: 记录 => 记录,
      手机分支变更后已读时锚,
      请求刷新手机红点: () => {
        红点刷新 += 1;
      },
      updateVariablesWith: async fn => {
        const vars = { _微信: structuredClone(原始库) };
        变量对象 = vars;
        fn(vars);
        return vars;
      },
    },
  );

  // 正常收口：真实改写并刷新红点，返回已写。
  assert.equal(await 隔离当前手机分支(-1, 允许写入), true);
  assert.equal(红点刷新, 1);

  // 失效收口：回调最前复核失败 → 不改 _微信、不刷新红点、返回未写。
  允许写入 = () => false;
  变量对象 = null;
  assert.equal(await 隔离当前手机分支(-1, 允许写入), false);
  assert.deepEqual(变量对象._微信, 原始库, '失效收口不得改写 _微信');
  assert.equal(红点刷新, 1, '失效收口不得刷新红点');
});

test('已读所有权在 chat/moments 渲染层：前台校验异步确认；chats/共享 不再预写', () => {
  assert.match(数据层源码, /export async function 写实时手机已读/);
  // v0.80 已读所有权回渲染层：chat/moments 真正渲染到前台且确有未读时经数据层入口确认。
  assert.match(渲染chat源码, /写实时手机已读\(\{ 会话 \}, 前台仍有效\)/);
  assert.match(渲染moments源码, /写实时手机已读\(\{ 朋友圈: true \}, 前台仍有效\)/);
  // 旧点击即已读接线移除：列表页/底栏只导航。
  assert.doesNotMatch(渲染chats源码, /写实时手机已读\s*\(/, '会话列表页不得预写已读');
  assert.doesNotMatch(渲染共享源码, /写实时手机已读\s*\(/, '底栏不得预写已读（注释提及不算调用）');
  assert.doesNotMatch(渲染chats源码, /创建手机已读时锚/, '会话列表页不得裸拼已读锚');
  assert.doesNotMatch(渲染共享源码, /创建手机已读时锚/, '底栏不得裸拼已读锚');
});

test('CHAT_CHANGED 同步作废手机世代；原生分支协调把 仍为最新 传到收口回调内', () => {
  const 聊天切换段 = 截源(index源码, 'const 聊天切换监听 = eventOn(tavern_events.CHAT_CHANGED', '];');
  assert.match(聊天切换段, /作废当前手机时间线租约世代\(\)/, '切聊必须同步作废手机租约世代');
  const 排队段 = 截源(index源码, 'function 排队宿主原生时间线切换', 'const 滑动监听');
  assert.match(
    排队段,
    /隔离当前手机分支\(类型 === '删楼' \? -1 : 切分支楼, 租约\.仍为最新\)/,
    '原生删楼/swipe 协调必须把 仍为最新 传进收口',
  );
  const 收口段 = 截源(数据层源码, 'export async function 隔离当前手机分支', 'export function 读库');
  assert.match(收口段, /允许写入: \(\) => boolean = \(\) => true/);
  assert.match(收口段, /if \(!允许写入\(\)\) return vars;/, '允许写入 必须在 updateVariablesWith 回调最前复核');
});
