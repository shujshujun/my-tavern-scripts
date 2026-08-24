/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
// `schema.json` 与 `schema.ts` 同名；Node 测试需像 webpack 一样优先解析 TypeScript。
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
// 本组只测生成通道决策与事务提交，都不调用数据库代理。数据库桥顶层有
// `window.addEventListener` 且依赖 webpack `?raw`，Node 下整模块不可 require，测试时整模块桩掉。
const Module = require('node:module');
const 原加载 = Module._load;
let 测试数据库可调用AI = false;
let 测试数据库生成 = async () => '';
Module._load = function 测试加载(request, parent, isMain) {
  const 路径 = String(request).replace(/\\/g, '/');
  if (路径.endsWith('数据库桥')) {
    return { 数据库状态: () => ({ 可调用AI: 测试数据库可调用AI }), 通过数据库生成: (...args) => 测试数据库生成(...args) };
  }
  if (路径.endsWith('.json?raw')) return '{}';
  return 原加载.call(this, request, parent, isMain);
};
globalThis._ = require('lodash');
globalThis.SillyTavern = { chat: [{}], getCurrentChatId: () => 'chat-a' };
globalThis.getLastMessageId = () => 0;
globalThis.getVariables = () => 当前聊天变量;
let 当前聊天变量 = {};

const { Schema, 当前MVU数据版本 } = require('../../src/人妻公寓/schema.ts');
const {
  净化隔离事件正文,
  生成隔离事件草稿,
  取消隔离事件,
  隔离事件进行中,
  顺序提交隔离事件,
  捕获隔离时间线身份,
  复核隔离时间线身份,
  创建隔离事件事务记录,
  读取隔离事件事务记录,
  准备隔离事件事务,
  回滚隔离事件事务,
  确认隔离事务无需隔离,
  撤销已完成隔离事件事务,
  恢复中断隔离提交,
  隔离事件事务键,
  隔离恢复聊天键,
} = require('../../src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts');
const {
  取得前台生成租约,
  取得手机生成租约,
  清空生成租约,
} = require('../../src/人妻公寓/脚本/游戏逻辑/生成通道互斥.ts');
const { 全局数据库AI租约 } = require('../../src/人妻公寓/脚本/游戏逻辑/数据库AI租约.ts');
const { 捕获精确聊天快照, 恢复精确聊天快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间撤销系统.ts');
const { 预设破限段 } = require('../../src/人妻公寓/脚本/游戏逻辑/预设桥.ts');
Module._load = 原加载;

test('Prism 未闭合思维链后的 content 仍是有效隔离正文，思维链和检查注释不外泄', () => {
  const 原文 = [
    '<analysis>内部规划没有闭合',
    '<content>',
    '<!-- Prism:物理环境与睡前感知。 -->',
    '屋子里暗下来，我闭上眼睛。',
    '<!-- Prism:完成时间跨度，苏醒。 -->',
    '第二天早上我醒了。',
    '</content>',
  ].join('\n');
  assert.equal(净化隔离事件正文(原文), '屋子里暗下来，我闭上眼睛。\n\n第二天早上我醒了。');
});

test('无预填充模型返回控制段、think_nya 与 game 时，睡眠隔离正文只采用 game 内剧情', () => {
  const 原文 = [
    '<|im_start|>gemini',
    '<think_nya~>未闭合私有推理',
    '<|im_end|>',
    '<game>第二天早上我醒了。</game>',
    '<summary>后台总结</summary>',
  ].join('\n');
  assert.equal(净化隔离事件正文(原文), '第二天早上我醒了。');
});

test('隔离正文把常见美化 HTML 转为可读纯文本，不把字面标签写进睡眠与监控日志', () => {
  assert.equal(净化隔离事件正文('<span>第二天早上醒来。</span>'), '第二天早上醒来。');
  assert.equal(
    净化隔离事件正文('<section><strong>监控画面</strong><br>她走进厨房。</section>'),
    '监控画面\n她走进厨房。',
  );
});

const Index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 隔离事件源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts', import.meta.url), 'utf8');

function 截段(源, 开始标记, 结束标记) {
  const 开始 = 源.indexOf(开始标记);
  assert.notEqual(开始, -1, `缺少开始标记：${开始标记}`);
  const 结束 = 源.indexOf(结束标记, 开始);
  assert.notEqual(结束, -1, `缺少结束标记：${结束标记}`);
  return 源.slice(开始, 结束);
}

function 事件段(事件名) {
  const 开始 = Index源.indexOf(`eventOn('人妻公寓:${事件名}'`);
  assert.ok(开始 >= 0, `缺少事件入口：${事件名}`);
  const 下一个 = Index源.indexOf('\n  eventOn(', 开始 + 1);
  return Index源.slice(开始, 下一个 >= 0 ? 下一个 : Index源.length);
}

function 建数据(绝对时段 = 5, 现金 = 1000) {
  return Schema.parse({
    现金,
    系统: {
      _数据版本: 当前MVU数据版本,
      _绝对时段: 绝对时段,
      _序章完成: true,
      _待发送事件: '',
    },
  });
}

const 锚消息 = SillyTavern.chat[0];
const 身份 = { 聊天ID: 'chat-a', 锚楼: 0, 锚消息 };
const 草稿 = {
  参数: { 类型: '荣耀洞', 线程: '荣耀洞:5:101', 行动: '（在隔板前坐定）', 导演事件: '导演指令', 房间: '洗手间' },
  正文: '这一拍已经发生的荣耀洞正文。',
  提示词: 'SYSTEM\n提示',
};
const 记录 = { 入口: '荣耀洞继续', 行动: '（在隔板前坐定）', 房间: '洗手间', 日志长度: 0 };
const 提交前数据 = 建数据(5);

/** 挂载按调用顺序记录 chat 变量键集的 updateVariablesWith 桩（只记录 updater 真实职责）。 */
function 挂载提交(初始变量 = {}) {
  当前聊天变量 = structuredClone(初始变量);
  const 步骤 = [];
  globalThis.updateVariablesWith = updater => {
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    步骤.push(Object.keys(当前聊天变量).sort().join(','));
    return 当前聊天变量;
  };
  return 步骤;
}

const 基本参数 = {
  草稿,
  记录,
  锚楼: 0,
  提交前数据,
  写核心: async () => undefined,
  恢复核心: async () => undefined,
  身份,
  操作仍有效: () => true,
};

function 四键快照(额外 = {}) {
  return 捕获精确聊天快照(
    { _隔离事件: { 日志: [] }, _上次隔离回合: null, _侦探: {}, _场景: { 房间id: '302' }, ...额外 },
    隔离恢复聊天键,
  );
}

// ─────────────────────────────────────────────
// 1. 隔离正文通道边界
// ─────────────────────────────────────────────
test('隔离事件生成不再导入数据库桥，五种类型共用正文 generateRaw', () => {
  const 生成段 = 截段(隔离事件源, 'export async function 生成隔离事件草稿', '\nexport function 写入隔离事件草稿');
  assert.doesNotMatch(隔离事件源, /from '\.\/数据库桥'/);
  assert.doesNotMatch(生成段, /数据库状态|通过数据库生成|通道 === '数据库'/);
  assert.match(生成段, /const 通道 = '正文' as const;/);
  assert.match(生成段, /当前正文模型是DeepSeek\(\)/);
  assert.match(生成段, /generateRaw\(/);
});

test('生成隔离事件草稿：手机或前台占用时返回可行动的明确原因，不伪装成正文为空', async () => {
  const 参数 = { 类型: '荣耀洞', 线程: '荣耀洞:测试', 行动: '继续等待', 导演事件: '测试', 房间: '洗手间' };

  清空生成租约();
  const 手机租约 = 取得手机生成租约();
  assert.ok(手机租约);
  await assert.rejects(() => 生成隔离事件草稿(参数), /手机后台消息正在生成/);
  手机租约.释放();

  const 前台租约 = 取得前台生成租约();
  assert.ok(前台租约);
  await assert.rejects(() => 生成隔离事件草稿(参数), /正文或另一独立事件正在生成/);
  前台租约.释放();
  清空生成租约();
});

test('生成隔离事件草稿：数据库迟到租约明确提示上一请求仍在结算，底层完成后可恢复', async () => {
  let 完成底层;
  const 迟到底层 = new Promise(resolve => {
    完成底层 = resolve;
  });
  await assert.rejects(() => 全局数据库AI租约.执行([], {}, () => 迟到底层, 5), /数据库AI调用超时/);
  assert.equal(全局数据库AI租约.在结算(), true);
  await assert.rejects(
    () =>
      生成隔离事件草稿({
        类型: '荣耀洞',
        线程: '荣耀洞:迟到',
        行动: '继续等待',
        导演事件: '测试',
        房间: '洗手间',
      }),
    /数据库AI仍在结算上一轮请求/,
  );
  完成底层('迟到结果');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(全局数据库AI租约.在结算(), false);
});

test('监控/荣耀洞即使数据库可用也各只请求一次正文 API', async () => {
  清空生成租约();
  const 原环境 = {
    generateRaw: globalThis.generateRaw,
    eventEmit: globalThis.eventEmit,
    getPreset: globalThis.getPreset,
    substitudeMacros: globalThis.substitudeMacros,
    getLoadedPresetName: globalThis.getLoadedPresetName,
    formatAsTavernRegexedString: globalThis.formatAsTavernRegexedString,
  };
  let 数据库次数 = 0;
  let 正文次数 = 0;
  try {
    测试数据库可调用AI = true;
    测试数据库生成 = async () => {
      数据库次数 += 1;
      throw new Error('隔离事件不应调用数据库 AI');
    };
    globalThis.generateRaw = async () => {
      正文次数 += 1;
      return '<content>正文线路生成成功</content>';
    };
    globalThis.eventEmit = () => undefined;
    globalThis.getPreset = () => ({ prompts: [] });
    globalThis.substitudeMacros = 文 => 文;
    globalThis.getLoadedPresetName = () => '测试预设';
    globalThis.formatAsTavernRegexedString = 文 => 文;

    for (const 参数 of [
      { 类型: '监控', 线程: '监控:正文线路', 行动: '查看摄像头', 导演事件: '客观描写监控画面', 房间: '302' },
      { 类型: '荣耀洞', 线程: '荣耀洞:正文线路', 行动: '继续', 导演事件: '继续当前演出', 房间: '洗手间' },
    ]) {
      const 结果 = await 生成隔离事件草稿(参数);
      assert.equal(结果.正文, '正文线路生成成功');
    }
    assert.equal(数据库次数, 0, '监控与荣耀洞不得再调用数据库线路');
    assert.equal(正文次数, 2, '两类事件应各自只请求一次正文 API');
  } finally {
    测试数据库可调用AI = false;
    测试数据库生成 = async () => '';
    Object.assign(globalThis, 原环境);
    清空生成租约();
  }
});

test('监控正文 API 返回空正文时失败关闭且不自动重试', async () => {
  清空生成租约();
  const 原环境 = {
    generateRaw: globalThis.generateRaw,
    eventEmit: globalThis.eventEmit,
    getPreset: globalThis.getPreset,
    substitudeMacros: globalThis.substitudeMacros,
    getLoadedPresetName: globalThis.getLoadedPresetName,
    formatAsTavernRegexedString: globalThis.formatAsTavernRegexedString,
  };
  let 数据库次数 = 0;
  let 正文次数 = 0;
  try {
    测试数据库可调用AI = true;
    测试数据库生成 = async () => {
      数据库次数 += 1;
      return '<content>不应调用</content>';
    };
    globalThis.generateRaw = async () => {
      正文次数 += 1;
      return '';
    };
    globalThis.eventEmit = () => undefined;
    globalThis.getPreset = () => ({ prompts: [] });
    globalThis.substitudeMacros = 文 => 文;
    globalThis.getLoadedPresetName = () => '测试预设';
    globalThis.formatAsTavernRegexedString = 文 => 文;

    await assert.rejects(
      () =>
        生成隔离事件草稿({
          类型: '监控',
          线程: '监控:正文空响应',
          行动: '查看摄像头',
          导演事件: '客观描写监控画面',
          房间: '302',
        }),
      /事件 AI 没有返回可显示的正文/,
    );
    assert.equal(数据库次数, 0);
    assert.equal(正文次数, 1, '一次点击只允许一次正文请求');
  } finally {
    测试数据库可调用AI = false;
    测试数据库生成 = async () => '';
    Object.assign(globalThis, 原环境);
    清空生成租约();
  }
});

test('正文 generateRaw 永久 pending 时，取消隔离事件必须立即结束本地等待并释放前台租约', async () => {
  清空生成租约();
  let 完成底层;
  const 底层 = new Promise(resolve => {
    完成底层 = resolve;
  });
  const 原环境 = {
    generateRaw: globalThis.generateRaw,
    stopAllGeneration: globalThis.stopAllGeneration,
    eventEmit: globalThis.eventEmit,
    getPreset: globalThis.getPreset,
    substitudeMacros: globalThis.substitudeMacros,
    getLoadedPresetName: globalThis.getLoadedPresetName,
    formatAsTavernRegexedString: globalThis.formatAsTavernRegexedString,
  };
  let 停止次数 = 0;
  try {
    globalThis.generateRaw = () => 底层;
    globalThis.stopAllGeneration = () => {
      停止次数 += 1;
    };
    globalThis.eventEmit = () => undefined;
    globalThis.getPreset = () => ({ prompts: [] });
    globalThis.substitudeMacros = 文 => 文;
    globalThis.getLoadedPresetName = () => '测试预设';
    globalThis.formatAsTavernRegexedString = 文 => 文;

    const 调用 = 生成隔离事件草稿({
      类型: '睡眠',
      线程: '睡眠:pending',
      行动: '睡到第二天',
      导演事件: '从入睡写到醒来',
      房间: '302',
    });
    const 结果 = 调用.then(
      () => '成功',
      error => String(error?.message ?? error),
    );
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(隔离事件进行中(), true);
    assert.equal(取消隔离事件(), true);
    const 取消结果 = await Promise.race([结果, new Promise(resolve => setTimeout(() => resolve('仍在等待'), 50))]);
    assert.notEqual(取消结果, '仍在等待', '取消不能等待不服从 stopAllGeneration 的供应商 Promise');
    assert.match(String(取消结果), /取消/);
    assert.equal(隔离事件进行中(), false);
    const 新租约 = 取得前台生成租约();
    assert.ok(新租约, '取消后共享前台租约必须立即可用');
    新租约.释放();
    assert.ok(停止次数 >= 1);
  } finally {
    完成底层?.('<回复>迟到结果</回复>');
    await new Promise(resolve => setImmediate(resolve));
    Object.assign(globalThis, 原环境);
    清空生成租约();
  }
});

test('复核隔离时间线身份：同聊天/同锚楼/同消息引用通过，任一变化都失败关闭', () => {
  const 当前 = 捕获隔离时间线身份();
  assert.doesNotThrow(() => 复核隔离时间线身份(当前, () => true));
  assert.throws(() => 复核隔离时间线身份(当前, () => false), /消息分支已经变化/);
  const 旧锚消息 = SillyTavern.chat[0];
  SillyTavern.chat[0] = { 另一条: true };
  assert.throws(() => 复核隔离时间线身份(当前, () => true), /锚楼消息已经变化/);
  SillyTavern.chat[0] = 旧锚消息;
});

// ─────────────────────────────────────────────
// 2. 持久事务记录：唯一 ID、完整性指纹、四键快照、损坏拒绝
// ─────────────────────────────────────────────
test('隔离事件事务记录创建与读取往返；篡改事务ID/聊天ID/创建时间/数据/快照一律拒绝', () => {
  const 提交前聊天 = 四键快照({ _隔离事件: { 日志: [{ id: 'old' }] } });
  const 记录 = 创建隔离事件事务记录({ 聊天ID: 'chat-a', 提交前数据, 提交前聊天 });
  assert.equal(记录.版本, 1);
  assert.ok(记录.事务ID);
  assert.ok(记录.完整性指纹);
  // chat 变量会经 JSON 落盘，往返后仍可严格读取。
  const 往返 = JSON.parse(JSON.stringify(记录));
  assert.deepEqual(读取隔离事件事务记录(往返), 记录);
  // 唯一熵：同毫秒创建两份也不碰撞。
  const 记录2 = 创建隔离事件事务记录({ 聊天ID: 'chat-a', 提交前数据, 提交前聊天 });
  assert.notEqual(记录.事务ID, 记录2.事务ID, '事务 ID 必须可靠唯一');
  // 记录完整性指纹覆盖 事务ID/聊天ID/创建时间/数据指纹/聊天指纹。
  for (const 改 of [
    { 事务ID: 'other' },
    { 聊天ID: 'chat-b' },
    { 创建时间: 1 },
    { 提交前数据: { ...往返.提交前数据, 现金: 999 } },
    { 提交前聊天: { ...往返.提交前聊天, _侦探: { 存在: false, 值: null } } },
    { 完整性指纹: 'bad' },
  ]) {
    const 篡改 = structuredClone(往返);
    Object.assign(篡改, 改);
    assert.equal(读取隔离事件事务记录(篡改), null, `篡改 ${Object.keys(改)[0]} 必须返回 null`);
  }
  assert.equal(读取隔离事件事务记录(null), null);
  assert.equal(读取隔离事件事务记录({ 版本: 999 }), null);
});

test('隔离事件事务记录四键快照精确保留“不存在/null/undefined”', () => {
  const 不存在 = 捕获精确聊天快照({}, 隔离恢复聊天键);
  const 记录 = 创建隔离事件事务记录({ 聊天ID: 'chat-a', 提交前数据, 提交前聊天: 不存在 });
  for (const key of 隔离恢复聊天键) assert.equal(记录.提交前聊天[key].存在, false, `${key} 必须记录为不存在`);

  const 空值 = 捕获精确聊天快照(
    { _隔离事件: null, _上次隔离回合: undefined, _侦探: null, _场景: undefined },
    隔离恢复聊天键,
  );
  const 记录2 = 创建隔离事件事务记录({ 聊天ID: 'chat-a', 提交前数据, 提交前聊天: 空值 });
  assert.equal(记录2.提交前聊天._隔离事件.存在, true);
  assert.equal(记录2.提交前聊天._隔离事件.值, null);
  assert.equal(记录2.提交前聊天._上次隔离回合.值未定义, true);
  assert.equal(记录2.提交前聊天._侦探.值, null);
  assert.equal(记录2.提交前聊天._场景.值未定义, true);

  const 恢复目标 = { _隔离事件: { 日志: [{ id: 'x' }] }, _上次隔离回合: { 入口: '监控' }, _侦探: {}, _场景: {} };
  恢复精确聊天快照(恢复目标, 记录.提交前聊天, 隔离恢复聊天键);
  for (const key of 隔离恢复聊天键)
    assert.equal(Object.hasOwn(恢复目标, key), false, `${key} 不存在键不得被恢复成 null`);
  恢复精确聊天快照(恢复目标, 记录2.提交前聊天, 隔离恢复聊天键);
  assert.equal(恢复目标._隔离事件, null);
  assert.equal(Object.hasOwn(恢复目标, '_上次隔离回合'), true);
  assert.equal(恢复目标._上次隔离回合, undefined);
  assert.equal(恢复目标._侦探, null);
  assert.equal(Object.hasOwn(恢复目标, '_场景'), true);
  assert.equal(恢复目标._场景, undefined);
});

// ─────────────────────────────────────────────
// 3. 准备隔离事件事务：写记录、遗留键阻断、并发改写拒绝、宿主报错清理
// ─────────────────────────────────────────────
test('准备隔离事件事务成功写入事务记录并返回同一句柄', async () => {
  const 步骤 = 挂载提交({});
  const 事务 = await 准备隔离事件事务({ 身份, 操作仍有效: () => true, 提交前数据 });
  assert.deepEqual(步骤, ['_隔离事件事务']);
  assert.ok(事务.记录.事务ID);
  const 落盘 = 读取隔离事件事务记录(当前聊天变量[隔离事件事务键]);
  assert.ok(落盘 && 落盘.事务ID === 事务.记录.事务ID, '落盘记录必须是同一事务 ID');
  assert.deepEqual(事务.提交前聊天, 捕获精确聊天快照({}, 隔离恢复聊天键));
});

test('准备隔离事件事务：_隔离事件事务 键只要存在（有效/损坏/null/undefined）即拒绝并保留原值', async () => {
  const 遗留 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  for (const 值 of [遗留, { 版本: 999 }, null, undefined]) {
    挂载提交({ [隔离事件事务键]: 值 });
    await assert.rejects(准备隔离事件事务({ 身份, 操作仍有效: () => true, 提交前数据 }), /存在未完成的隔离事件事务/);
    if (值 === null) assert.equal(当前聊天变量[隔离事件事务键], null, 'null 键必须保留');
    else if (值 === undefined) assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), true, 'undefined 键必须保留');
    else assert.deepEqual(当前聊天变量[隔离事件事务键], 值, '遗留记录不得被新事务覆盖或删除');
  }
});

test('事务准备前业务键被并发改写时拒绝提交，不产生日志', async () => {
  当前聊天变量 = {};
  globalThis.updateVariablesWith = updater => {
    当前聊天变量._隔离事件 = { 日志: [{ id: '并发写入' }] };
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await assert.rejects(顺序提交隔离事件({ ...基本参数 }), /聊天变量发生变化/);
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), false);
  assert.equal(Object.hasOwn(当前聊天变量, '_上次隔离回合'), false);
});

test('准备隔离事件事务：开始 updater 已执行但宿主随后报错时，只删确属本事务的记录', async () => {
  let 调用 = 0;
  当前聊天变量 = {};
  globalThis.updateVariablesWith = updater => {
    调用 += 1;
    if (调用 === 1) {
      updater(当前聊天变量); // 模拟事务记录已写入但宿主 Promise 报错
      throw new Error('宿主写入失败');
    }
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量; // 清理阶段
    return 当前聊天变量;
  };
  await assert.rejects(准备隔离事件事务({ 身份, 操作仍有效: () => true, 提交前数据 }), /宿主写入失败/);
  assert.equal(
    Object.hasOwn(当前聊天变量, '_隔离事件事务'),
    false,
    '宿主报错后必须清掉自己刚写的记录，不留无人持有的半事务',
  );
});

// ─────────────────────────────────────────────
// 4. 顺序提交：持久事务 → 核心 → 最终 chat 的原子顺序与补偿
// ─────────────────────────────────────────────
test('成功顺序可观察为“先持久事务记录 → 核心 → 同一 chat 最终日志/记录/删事务”', async () => {
  const 顺序 = [];
  const 步骤 = 挂载提交({});
  await 顺序提交隔离事件({
    ...基本参数,
    写核心: async () => {
      顺序.push('核心');
    },
  });
  // 步骤 只由 chat updater mock 记录键名；'核心' 由 顺序 单独断言（C-1）。
  assert.deepEqual(步骤, ['_隔离事件事务', '_上次隔离回合,_隔离事件']);
  assert.deepEqual(顺序, ['核心']);
  assert.equal(当前聊天变量._隔离事件.日志.length, 2);
  assert.equal(当前聊天变量._隔离事件.日志[1].文本, 草稿.正文);
  assert.equal(当前聊天变量._上次隔离回合, 记录);
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), false);
  assert.deepEqual(Object.keys(当前聊天变量).sort(), ['_上次隔离回合', '_隔离事件']);
});

test('传入已准备事务（监控路径）时只复用同一事务，不再创建第二份', async () => {
  const 顺序 = [];
  const 步骤 = 挂载提交({});
  const 事务 = await 准备隔离事件事务({ 身份, 操作仍有效: () => true, 提交前数据 });
  assert.deepEqual(步骤, ['_隔离事件事务'], '准备阶段先落一份事务记录');
  await 顺序提交隔离事件({
    ...基本参数,
    事务,
    写核心: async () => {
      顺序.push('核心');
    },
  });
  assert.deepEqual(步骤, ['_隔离事件事务', '_上次隔离回合,_隔离事件'], '提交阶段只多一次最终 updater');
  assert.deepEqual(顺序, ['核心']);
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), false);
});

test('核心 stat 写失败：恢复核心 → 精确恢复四键业务聊天并删除同一事务记录', async () => {
  const 顺序 = [];
  const 步骤 = 挂载提交({});
  await assert.rejects(
    顺序提交隔离事件({
      ...基本参数,
      写核心: async () => {
        顺序.push('核心');
        throw new Error('核心写失败');
      },
      恢复核心: async () => 顺序.push('恢复核心'),
    }),
    /核心写失败/,
  );
  assert.deepEqual(顺序, ['核心', '恢复核心']);
  assert.deepEqual(步骤, ['_隔离事件事务', '']);
  assert.deepEqual(当前聊天变量, {});
});

test('最终 chat 提交失败：仍按 恢复核心 → 精确恢复四键业务聊天并删除同一事务记录 补偿', async () => {
  const 顺序 = [];
  let chat调用 = 0;
  当前聊天变量 = {};
  globalThis.updateVariablesWith = updater => {
    chat调用 += 1;
    if (chat调用 === 2) {
      updater(当前聊天变量); // 模拟最终 chat 回调已运行但宿主写入失败
      throw new Error('chat 写入失败');
    }
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await assert.rejects(
    顺序提交隔离事件({
      ...基本参数,
      写核心: async () => 顺序.push('核心'),
      恢复核心: async () => 顺序.push('恢复核心'),
    }),
    /chat 写入失败/,
  );
  assert.deepEqual(顺序, ['核心', '恢复核心']);
  assert.deepEqual(当前聊天变量, {}, '最终 updater 已执行但宿主报错时也必须完整恢复');
});

test('补偿失败时合并明示错误，不吞原异常', async () => {
  const 顺序 = [];
  挂载提交({});
  await assert.rejects(
    顺序提交隔离事件({
      ...基本参数,
      写核心: async () => {
        顺序.push('核心');
        throw new Error('主错误');
      },
      恢复核心: async () => {
        顺序.push('恢复核心');
        throw new Error('补偿A坏');
      },
    }),
    /主错误；MVU 回滚失败:补偿A坏/,
  );
  assert.deepEqual(顺序, ['核心', '恢复核心']);
});

test('chat 恢复失败时把聊天回滚错误合并进主错误，不得静默', async () => {
  const 顺序 = [];
  let chat调用 = 0;
  当前聊天变量 = {};
  globalThis.updateVariablesWith = updater => {
    chat调用 += 1;
    if (chat调用 === 2) throw new Error('补偿B坏'); // 写核心失败后唯一的 chat 调用是补偿恢复
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await assert.rejects(
    顺序提交隔离事件({
      ...基本参数,
      写核心: async () => {
        顺序.push('核心');
        throw new Error('主错误');
      },
      恢复核心: async () => 顺序.push('恢复核心'),
    }),
    /主错误；聊天回滚失败:补偿B坏/,
  );
  assert.deepEqual(顺序, ['核心', '恢复核心']);
});

test('写核心成功后聊天身份变化：不向新聊天写日志/回滚，旧聊天事务记录保留', async () => {
  let 有效 = true;
  挂载提交({});
  await assert.rejects(
    顺序提交隔离事件({
      ...基本参数,
      操作仍有效: () => 有效,
      写核心: async () => {
        有效 = false; // 模拟写核心期间玩家切换聊天
      },
    }),
    /消息分支已经变化/,
  );
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), true, '事务记录必须留在原聊天等待恢复');
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件'), false, '不得向新聊天写隔离日志');
  assert.equal(Object.hasOwn(当前聊天变量, '_上次隔离回合'), false);
});

test('补偿遇到损坏/非本事务记录时拒绝猜测恢复，不覆盖他人聊天状态', async () => {
  const 本事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  // 当前聊天里的记录是“别人的事务”：不得按本事务恢复覆盖。
  const 别人的事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据: 建数据(6),
    提交前聊天: 捕获精确聊天快照({ _侦探: { 别人的: true } }, 隔离恢复聊天键),
  });
  当前聊天变量 = { [隔离事件事务键]: 别人的事务, _隔离事件: { 日志: [] } };
  globalThis.updateVariablesWith = updater => {
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await assert.rejects(回滚隔离事件事务({ 事务: 本事务, 身份, 操作仍有效: () => true }), /隔离事件事务记录已经变化/);
  assert.deepEqual(当前聊天变量._隔离事件, { 日志: [] }, '不得覆盖他人聊天状态');
  // 键存在但记录损坏：不能证明是本事务，拒绝猜测恢复。
  当前聊天变量 = { [隔离事件事务键]: { 版本: 999 }, _侦探: { 别人的: true } };
  await assert.rejects(回滚隔离事件事务({ 事务: 本事务, 身份, 操作仍有效: () => true }), /损坏，不能猜测/);
  assert.deepEqual(当前聊天变量._侦探, { 别人的: true }, '不得覆盖他人状态');
});

// ─────────────────────────────────────────────
// 5. 已完成隔离事件撤销：反向双存储事务
// ─────────────────────────────────────────────
test('已完成隔离事件撤销先持久当前态，成功后精确恢复事件前四键并删除事务', async () => {
  const 当前记录 = { 入口: '荣耀洞继续', 行动: '当前拍', 房间: '洗手间', 日志长度: 1 };
  const 当前数据 = 建数据(7, 777);
  const 目标数据 = 建数据(5, 555);
  const 目标聊天原值 = {
    _隔离事件: { 日志: [{ id: '旧', 文本: '旧日志' }] },
    _上次隔离回合: { 入口: '荣耀洞开始', 行动: '上一拍' },
    _侦探: undefined,
    _场景: { 房间id: '洗手间', 旧: true },
  };
  const 目标聊天 = 捕获精确聊天快照(目标聊天原值, 隔离恢复聊天键);
  const 当前聊天原值 = {
    _隔离事件: { 日志: [{ id: '旧' }, { id: '新' }] },
    _上次隔离回合: 当前记录,
    _侦探: { 冷却: 9 },
    _场景: { 房间id: '洗手间', 旧: false },
  };
  const 步骤 = 挂载提交(当前聊天原值);
  const 核心 = [];

  await 撤销已完成隔离事件事务({
    当前数据,
    目标数据,
    当前记录,
    目标聊天,
    身份,
    操作仍有效: () => true,
    写目标核心: async () => 核心.push('目标'),
    恢复当前核心: async () => 核心.push('当前'),
  });

  assert.deepEqual(核心, ['目标']);
  assert.equal(步骤.length, 2, '一次准备事务、一次最终精确聊天恢复');
  assert.equal(Object.hasOwn(当前聊天变量, 隔离事件事务键), false);
  assert.deepEqual(当前聊天变量._隔离事件, 目标聊天原值._隔离事件);
  assert.deepEqual(当前聊天变量._上次隔离回合, 目标聊天原值._上次隔离回合);
  assert.equal(Object.hasOwn(当前聊天变量, '_侦探'), true, '键存在但值为 undefined 必须精确保留');
  assert.equal(当前聊天变量._侦探, undefined);
  assert.deepEqual(当前聊天变量._场景, 目标聊天原值._场景);
});

test('已完成隔离事件撤销的最终 chat 写后报错，会补偿回当前 stat 与当前四键', async () => {
  const 当前记录 = { 入口: '监控', 行动: '查看', 房间: '101', 日志长度: 0 };
  const 当前数据 = 建数据(8, 888);
  const 目标数据 = 建数据(6, 666);
  const 当前聊天原值 = {
    _隔离事件: { 日志: [{ id: '监控结果' }] },
    _上次隔离回合: 当前记录,
    _侦探: { 查看: true },
    _场景: { 房间id: '101' },
  };
  const 目标聊天 = 捕获精确聊天快照(
    { _隔离事件: { 日志: [] }, _上次隔离回合: null, _侦探: {}, _场景: { 房间id: '101' } },
    隔离恢复聊天键,
  );
  当前聊天变量 = structuredClone(当前聊天原值);
  let chat调用 = 0;
  globalThis.updateVariablesWith = updater => {
    chat调用 += 1;
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    if (chat调用 === 2) throw new Error('最终 chat 写后报错');
    return 当前聊天变量;
  };
  const 核心 = [];

  await assert.rejects(
    撤销已完成隔离事件事务({
      当前数据,
      目标数据,
      当前记录,
      目标聊天,
      身份,
      操作仍有效: () => true,
      写目标核心: async () => 核心.push('目标'),
      恢复当前核心: async () => 核心.push('当前'),
    }),
    /最终 chat 写后报错/,
  );

  assert.deepEqual(核心, ['目标', '当前']);
  assert.deepEqual(当前聊天变量, 当前聊天原值);
  assert.equal(Object.hasOwn(当前聊天变量, 隔离事件事务键), false);
});

test('index 的撤回与重掷共用反向事务，旧记录只在缺少精确快照时走保守兼容', () => {
  const 恢复函数 = 截段(Index源, 'function 隔离记录目标聊天快照', '\n  /** 带毒快照守卫');
  assert.match(恢复函数, /记录\.聊天快照精确 !== undefined/);
  assert.match(恢复函数, /await 作废晋阶镜像时间线\(\)/, '显式撤销必须先作废事件后写入的单调镜像');
  assert.match(恢复函数, /await 撤销已完成隔离事件事务\(/);
  assert.match(恢复函数, /写目标核心:[\s\S]{0,300}记录成长: false/);
  assert.match(恢复函数, /恢复当前核心:[\s\S]{0,300}记录成长: false/);
  assert.match(
    恢复函数,
    /捕获保护快照\(目标数据\);[\s\S]{0,120}await 等待晋阶镜像写入\(\)/,
    '成功后只从事件前目标数据重建镜像',
  );
  assert.match(
    恢复函数,
    /catch \(错误\)[\s\S]{0,260}捕获保护快照\(撤销前数据\);[\s\S]{0,120}await 等待晋阶镜像写入\(\)/,
    '同时间线失败补偿后必须从事件后当前数据重建镜像',
  );
  assert.doesNotMatch(
    恢复函数,
    /await 脚本写入\(raw, data\);[\s\S]{0,200}updateVariablesWith/,
    '不得退回旧的先 stat 后 chat 裸顺序写',
  );

  const 撤回段 = 事件段('隔离事件撤回');
  const 重掷段 = 事件段('隔离事件重掷');
  assert.match(撤回段, /恢复隔离记录\(raw, data, 记录, 操作仍有效\)/);
  assert.match(重掷段, /恢复隔离记录\(raw, data, 记录, 操作仍有效\)/);
});

test('已完成隔离事件撤销在记录已变化时零核心写入，不能撤错另一拍', async () => {
  const 预期记录 = { 入口: '荣耀洞继续', 行动: '预期拍' };
  挂载提交({ _上次隔离回合: { 入口: '荣耀洞继续', 行动: '另一拍' } });
  const 核心 = [];
  await assert.rejects(
    撤销已完成隔离事件事务({
      当前数据: 建数据(8),
      目标数据: 建数据(7),
      当前记录: 预期记录,
      目标聊天: 四键快照(),
      身份,
      操作仍有效: () => true,
      写目标核心: async () => 核心.push('目标'),
      恢复当前核心: async () => 核心.push('当前'),
    }),
    /隔离回合记录已经变化/,
  );
  assert.deepEqual(核心, []);
  assert.equal(Object.hasOwn(当前聊天变量, 隔离事件事务键), false);
});

// ─────────────────────────────────────────────
// 6. 回滚隔离事件事务 / 确认隔离事务无需隔离
// ─────────────────────────────────────────────
test('回滚隔离事件事务：_侦探/_场景/两业务键逐键精确恢复并删除同一事务记录', async () => {
  const 提交前聊天 = 捕获精确聊天快照(
    {
      _隔离事件: { 日志: [{ id: 'old' }] },
      _上次隔离回合: null,
      _侦探: { 偷窥待选: null, 偷窥上次: {} },
      _场景: { 房间id: '302' },
    },
    隔离恢复聊天键,
  );
  const 事务 = 创建隔离事件事务记录({ 聊天ID: 'chat-a', 提交前数据, 提交前聊天 });
  当前聊天变量 = {
    [隔离事件事务键]: 事务,
    _隔离事件: { 日志: [{ id: 'old' }, { id: 'new-log' }] },
    _上次隔离回合: { 入口: '监控' },
    _侦探: { 偷窥待选: { 门牌: '101', 拍: 0 }, 偷窥上次: { 101: 9 } },
    _场景: { 房间id: '302' },
  };
  globalThis.updateVariablesWith = updater => {
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await 回滚隔离事件事务({ 事务, 身份, 操作仍有效: () => true });
  assert.deepEqual(
    当前聊天变量,
    {
      _隔离事件: { 日志: [{ id: 'old' }] },
      _上次隔离回合: null,
      _侦探: { 偷窥待选: null, 偷窥上次: {} },
      _场景: { 房间id: '302' },
    },
    '四键必须逐键精确恢复（冷却/待选/场景/日志）',
  );
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), false);
});

test('回滚隔离事件事务：身份已变时抛错并保留记录，不写新聊天', async () => {
  const 事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  当前聊天变量 = { [隔离事件事务键]: 事务, _侦探: { 偷窥待选: { 门牌: '101', 拍: 0 } } };
  globalThis.updateVariablesWith = updater => {
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await assert.rejects(回滚隔离事件事务({ 事务, 身份, 操作仍有效: () => false }), /不能跨时间线/);
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), true);
  assert.deepEqual(当前聊天变量._侦探, { 偷窥待选: { 门牌: '101', 拍: 0 } }, '不得清理当前聊天状态');
});

test('确认隔离事务无需隔离：删除同一事务记录但保留本点击合法写入的 _侦探，恢复核心 0 次', async () => {
  const 事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  当前聊天变量 = {
    [隔离事件事务键]: 事务,
    _侦探: { 偷窥待选: null, 偷窥上次: { 101: 9 } },
  };
  const 核心调用 = [];
  globalThis.updateVariablesWith = updater => {
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await 确认隔离事务无需隔离({
    事务,
    身份,
    操作仍有效: () => true,
    恢复核心: async () => 核心调用.push('恢复核心'),
  });
  assert.deepEqual(核心调用, [], '确认成功不得调用 恢复核心');
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), false);
  assert.deepEqual(当前聊天变量._侦探, { 偷窥待选: null, 偷窥上次: { 101: 9 } }, '软计数必须保留并继续线路落地');
});

test('确认隔离事务无需隔离：身份变化/事务键缺失/记录损坏/ID不同均抛错且零写入，恢复核心 0 次', async () => {
  const 事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  const 别人的事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据: 建数据(6),
    提交前聊天: 捕获精确聊天快照({ _侦探: { 别人的: true } }, 隔离恢复聊天键),
  });
  const 场景 = [
    {
      名: '身份/分支变化',
      初始: { [隔离事件事务键]: 事务, _侦探: { 软: 1 } },
      操作仍有效: () => false,
      错误: /不能删除隔离事件事务记录/,
    },
    { 名: '事务键缺失', 初始: { _侦探: { 软: 1 } }, 操作仍有效: () => true, 错误: /事务记录缺失，不能确认/ },
    {
      名: '记录损坏',
      初始: { [隔离事件事务键]: { 版本: 999 }, _侦探: { 软: 1 } },
      操作仍有效: () => true,
      错误: /记录损坏，不能确认/,
    },
    {
      名: 'ID不同',
      初始: { [隔离事件事务键]: 别人的事务, _侦探: { 软: 1 } },
      操作仍有效: () => true,
      错误: /事务记录已经变化/,
    },
  ];
  for (const 案例 of 场景) {
    const 核心调用 = [];
    挂载提交(案例.初始);
    await assert.rejects(
      确认隔离事务无需隔离({
        事务,
        身份,
        操作仍有效: 案例.操作仍有效,
        恢复核心: async () => 核心调用.push('恢复核心'),
      }),
      案例.错误,
    );
    assert.deepEqual(核心调用, [], `${案例.名} 时 恢复核心 必须 0 次调用（MVU 零写入）`);
    assert.deepEqual(当前聊天变量, 案例.初始, `${案例.名} 必须零写入`);
  }
});

test('确认隔离事务无需隔离：删除 updater 已同步执行后宿主抛错，恢复核心 1 次并精确恢复四键', async () => {
  const 提交前聊天 = 捕获精确聊天快照(
    {
      _隔离事件: { 日志: [{ id: 'old' }] },
      _上次隔离回合: null,
      _侦探: { 偷窥待选: null, 偷窥上次: {} },
      _场景: { 房间id: '302' },
    },
    隔离恢复聊天键,
  );
  const 事务 = 创建隔离事件事务记录({ 聊天ID: 'chat-a', 提交前数据, 提交前聊天 });
  当前聊天变量 = {
    [隔离事件事务键]: 事务,
    _隔离事件: { 日志: [{ id: 'old' }, { id: 'new-log' }] },
    _上次隔离回合: { 入口: '监控' },
    _侦探: { 偷窥待选: { 门牌: '101', 拍: 0 }, 偷窥上次: { 101: 9 } },
    _场景: { 房间id: '302' },
  };
  const 核心调用 = [];
  let 次 = 0;
  globalThis.updateVariablesWith = updater => {
    次 += 1;
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量; // 删除 updater 已同步执行
    if (次 === 1) throw new Error('宿主删除失败');
    return 当前聊天变量;
  };
  await assert.rejects(
    确认隔离事务无需隔离({
      事务,
      身份,
      操作仍有效: () => true,
      恢复核心: async () => 核心调用.push('恢复核心'),
    }),
    /宿主删除失败/,
  );
  assert.deepEqual(核心调用, ['恢复核心'], '删除 updater 已执行后宿主抛错必须恢复核心恰好 1 次');
  assert.deepEqual(
    当前聊天变量,
    {
      _隔离事件: { 日志: [{ id: 'old' }] },
      _上次隔离回合: null,
      _侦探: { 偷窥待选: null, 偷窥上次: {} },
      _场景: { 房间id: '302' },
    },
    '四键必须精确恢复且事务键删除',
  );
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), false);
});

test('确认隔离事务无需隔离：宿主在调用 updater 前抛错但同一事务仍在，恢复核心 1 次并删除事务', async () => {
  const 提交前聊天 = 捕获精确聊天快照(
    {
      _隔离事件: { 日志: [{ id: 'old' }] },
      _上次隔离回合: null,
      _侦探: { 偷窥待选: null, 偷窥上次: {} },
      _场景: { 房间id: '302' },
    },
    隔离恢复聊天键,
  );
  const 事务 = 创建隔离事件事务记录({ 聊天ID: 'chat-a', 提交前数据, 提交前聊天 });
  当前聊天变量 = {
    [隔离事件事务键]: 事务,
    _隔离事件: { 日志: [{ id: 'old' }, { id: 'new-log' }] },
    _上次隔离回合: { 入口: '监控' },
    _侦探: { 偷窥待选: { 门牌: '101', 拍: 0 }, 偷窥上次: { 101: 9 } },
    _场景: { 房间id: '302' },
  };
  const 核心调用 = [];
  let 次 = 0;
  globalThis.updateVariablesWith = updater => {
    次 += 1;
    if (次 === 1) throw new Error('宿主在调用 updater 前失败'); // updater 尚未执行
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await assert.rejects(
    确认隔离事务无需隔离({
      事务,
      身份,
      操作仍有效: () => true,
      恢复核心: async () => 核心调用.push('恢复核心'),
    }),
    /宿主在调用 updater 前失败/,
  );
  assert.deepEqual(核心调用, ['恢复核心'], 'updater 未执行但同一事务仍在时必须恢复核心恰好 1 次');
  assert.deepEqual(
    当前聊天变量,
    {
      _隔离事件: { 日志: [{ id: 'old' }] },
      _上次隔离回合: null,
      _侦探: { 偷窥待选: null, 偷窥上次: {} },
      _场景: { 房间id: '302' },
    },
    '四键必须精确恢复且事务键删除',
  );
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), false);
});

test('确认隔离事务无需隔离：删除 updater 已执行但宿主抛错且身份已变，恢复核心 0 次不写新聊天', async () => {
  const 事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  当前聊天变量 = {
    [隔离事件事务键]: 事务,
    _侦探: { 偷窥待选: { 门牌: '101', 拍: 0 } },
  };
  const 核心调用 = [];
  let 有效 = true;
  globalThis.updateVariablesWith = updater => {
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量; // 删除 updater 已同步执行
    有效 = false; // 随后玩家切聊天/分支
    throw new Error('宿主删除失败');
  };
  await assert.rejects(
    确认隔离事务无需隔离({
      事务,
      身份,
      操作仍有效: () => 有效,
      恢复核心: async () => 核心调用.push('恢复核心'),
    }),
    /宿主删除失败/,
  );
  assert.deepEqual(核心调用, [], '身份已变时 恢复核心 必须 0 次调用');
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), false, '删除 updater 已删除旧聊天事务键');
  assert.deepEqual(当前聊天变量._侦探, { 偷窥待选: { 门牌: '101', 拍: 0 } }, '不向新聊天猜测恢复四键');
});

test('确认隔离事务无需隔离：恢复核心失败时错误合并原确认错误与 MVU 回滚失败', async () => {
  const 事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  当前聊天变量 = {
    [隔离事件事务键]: 事务,
    _侦探: { 偷窥待选: { 门牌: '101', 拍: 0 } },
  };
  let 次 = 0;
  globalThis.updateVariablesWith = updater => {
    次 += 1;
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    if (次 === 1) throw new Error('宿主删除失败');
    return 当前聊天变量;
  };
  await assert.rejects(
    确认隔离事务无需隔离({
      事务,
      身份,
      操作仍有效: () => true,
      恢复核心: async () => {
        throw new Error('MVU 写回失败');
      },
    }),
    /宿主删除失败；MVU 回滚失败:MVU 写回失败/,
  );
});

test('确认隔离事务无需隔离：聊天恢复失败时错误合并原确认错误与聊天回滚失败', async () => {
  const 事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  当前聊天变量 = {
    [隔离事件事务键]: 事务,
    _侦探: { 偷窥待选: { 门牌: '101', 拍: 0 } },
  };
  const 核心调用 = [];
  let 次 = 0;
  globalThis.updateVariablesWith = updater => {
    次 += 1;
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    if (次 === 1) throw new Error('宿主删除失败');
    throw new Error('聊天变量写入失败');
  };
  await assert.rejects(
    确认隔离事务无需隔离({
      事务,
      身份,
      操作仍有效: () => true,
      恢复核心: async () => 核心调用.push('恢复核心'),
    }),
    /宿主删除失败；聊天回滚失败:聊天变量写入失败/,
  );
  assert.deepEqual(核心调用, ['恢复核心'], 'chat 补偿失败时仍应已恢复核心');
});

test('确认隔离事务无需隔离：补偿证明后事务被并发删除，必须明示聊天回滚失败而非假装补偿完成', async () => {
  const 事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({ _侦探: { 偷窥待选: null } }, 隔离恢复聊天键),
  });
  当前聊天变量 = {
    [隔离事件事务键]: 事务,
    _侦探: { 偷窥待选: { 门牌: '101', 拍: 0 } },
  };
  let 次 = 0;
  globalThis.updateVariablesWith = updater => {
    次 += 1;
    if (次 === 1) throw new Error('宿主在调用 updater 前失败');
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await assert.rejects(
    确认隔离事务无需隔离({
      事务,
      身份,
      操作仍有效: () => true,
      恢复核心: async () => {
        // 首次证明时仍是本事务；核心恢复的 await 窗口内，事务被另一路并发删除。
        delete 当前聊天变量[隔离事件事务键];
      },
    }),
    /宿主在调用 updater 前失败；聊天回滚失败:隔离事件事务记录缺失/,
    '没有“本删除 updater 已执行”的闭包证据时，二次 updater 遇到缺事务必须失败关闭',
  );
  assert.deepEqual(当前聊天变量._侦探, { 偷窥待选: { 门牌: '101', 拍: 0 } }, '并发删除后不得把四键猜测恢复成旧快照');
});

test('回滚隔离事件事务：事务键缺失/记录损坏/他事务均抛错且四键不变', async () => {
  const 本事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  const 别人的事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据: 建数据(6),
    提交前聊天: 捕获精确聊天快照({ _侦探: { 别人的: true } }, 隔离恢复聊天键),
  });
  const 四键初始 = {
    _隔离事件: { 日志: [{ id: 'old' }] },
    _上次隔离回合: null,
    _侦探: { 偷窥待选: null },
    _场景: { 房间id: '302' },
  };
  const 场景 = [
    { 名: '事务键缺失', 初始: { ...四键初始 }, 错误: /事务记录缺失，不能猜测/ },
    { 名: '记录损坏', 初始: { [隔离事件事务键]: { 版本: 999 }, ...四键初始 }, 错误: /记录损坏，不能猜测/ },
    { 名: '他事务', 初始: { [隔离事件事务键]: 别人的事务, ...四键初始 }, 错误: /事务记录已经变化/ },
  ];
  for (const 案例 of 场景) {
    挂载提交(案例.初始);
    await assert.rejects(回滚隔离事件事务({ 事务: 本事务, 身份, 操作仍有效: () => true }), 案例.错误);
    assert.deepEqual(当前聊天变量, 案例.初始, `${案例.名} 必须四键不变`);
  }
});

test('回滚隔离事件事务：缺失/损坏/他事务即使传入 恢复核心 也 0 次调用，MVU/chat 均零写入', async () => {
  const 本事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  const 别人的事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据: 建数据(6),
    提交前聊天: 捕获精确聊天快照({ _侦探: { 别人的: true } }, 隔离恢复聊天键),
  });
  const 四键初始 = {
    _隔离事件: { 日志: [{ id: 'old' }] },
    _上次隔离回合: null,
    _侦探: { 偷窥待选: null },
    _场景: { 房间id: '302' },
  };
  const 场景 = [
    { 名: '事务键缺失', 初始: { ...四键初始 }, 错误: /事务记录缺失，不能猜测/ },
    { 名: '记录损坏', 初始: { [隔离事件事务键]: { 版本: 999 }, ...四键初始 }, 错误: /记录损坏，不能猜测/ },
    { 名: '他事务', 初始: { [隔离事件事务键]: 别人的事务, ...四键初始 }, 错误: /事务记录已经变化/ },
  ];
  for (const 案例 of 场景) {
    const 核心调用 = [];
    挂载提交(案例.初始);
    await assert.rejects(
      回滚隔离事件事务({
        事务: 本事务,
        身份,
        操作仍有效: () => true,
        恢复核心: async () => 核心调用.push('恢复核心'),
      }),
      案例.错误,
    );
    assert.deepEqual(核心调用, [], `${案例.名} 时 恢复核心 必须 0 次调用（MVU 零写入）`);
    assert.deepEqual(当前聊天变量, 案例.初始, `${案例.名} 必须四键不变（chat 零写入）`);
  }
});

test('准备隔离事件事务：宿主报错且身份已变时不清理新聊天，旧记录留待启动恢复', async () => {
  let 有效 = true;
  let 调用 = 0;
  当前聊天变量 = {};
  globalThis.updateVariablesWith = updater => {
    调用 += 1;
    if (调用 === 1) {
      updater(当前聊天变量); // 模拟事务记录已写入但宿主 Promise 报错，同时玩家已切聊
      有效 = false;
      throw new Error('宿主写入失败');
    }
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  await assert.rejects(准备隔离事件事务({ 身份, 操作仍有效: () => 有效, 提交前数据 }), /宿主写入失败/);
  assert.equal(调用, 1, '身份已变时不得再调用 chat updater 清理新聊天');
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), true, '旧聊天记录必须留待启动恢复');
});

test('顺序提交已准备事务：核心前事务缺失/损坏/替换时 写核心 与 恢复核心 均 0 调用', async () => {
  挂载提交({});
  const 事务 = await 准备隔离事件事务({ 身份, 操作仍有效: () => true, 提交前数据 });
  const 别人的事务 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据: 建数据(6),
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  const 场景 = [
    { 名: '事务键缺失', 当前: {} },
    { 名: '记录损坏', 当前: { [隔离事件事务键]: { 版本: 999 } } },
    { 名: '事务被替换', 当前: { [隔离事件事务键]: 别人的事务 } },
  ];
  for (const 案例 of 场景) {
    const 顺序 = [];
    挂载提交(案例.当前);
    await assert.rejects(
      顺序提交隔离事件({
        ...基本参数,
        事务,
        写核心: async () => 顺序.push('写核心'),
        恢复核心: async () => 顺序.push('恢复核心'),
      }),
      /隔离事件事务记录已经变化/,
    );
    assert.deepEqual(顺序, [], `${案例.名} 时 写核心/恢复核心 都必须 0 调用`);
  }
});

test('监控普通提示/已确认/死路收口顺序：事务存在时先落地 → 身份复核 → 严格确认删除', () => {
  const 监控段 = 事件段('查看摄像头');
  const 提示起 = 监控段.indexOf("if ('提示' in 结果 &&");
  const 提示止 = 监控段.indexOf('// 客户端已完成真实移动');
  assert.ok(提示起 >= 0 && 提示止 > 提示起, '普通提示分支必须存在');
  const 提示分支 = 监控段.slice(提示起, 提示止);
  const 落地位置 = 提示分支.indexOf('落地(');
  const 确认位置 = 提示分支.indexOf('确认隔离事务无需隔离');
  const 落地后复核 = 提示分支.lastIndexOf('操作仍有效() && 当前聊天ID() === 身份.聊天ID', 确认位置);
  assert.ok(
    落地位置 >= 0 && 落地后复核 > 落地位置 && 确认位置 > 落地后复核,
    '顺序必须是：事务存在时先落地 → 身份复核 → 严格确认删除事务',
  );
});

test('监控普通提示收口落地失败：恢复入口 data快照并精确回滚四键', () => {
  const 监控段 = 事件段('查看摄像头');
  const 提示起 = 监控段.indexOf("if ('提示' in 结果 &&");
  const 提示止 = 监控段.indexOf('// 客户端已完成真实移动');
  const 提示分支 = 监控段.slice(提示起, 提示止);
  assert.match(提示分支, /if \(!已落库\)/, '落地失败分支必须存在');
  assert.match(提示分支, /await 回滚隔离事件事务\(/, '落地失败必须走事务回滚');
  assert.match(提示分支, /恢复核心: async/, '落地失败回滚必须带核心恢复回调');
  const 恢复块 = 截段(提示分支, '恢复核心: async () => {', '},');
  assert.match(恢复块, /记录\.data快照/, '恢复核心必须把入口 data快照写回 MVU');
});

test('监控普通提示核心已落地但确认删除事务失败：确认函数自带恢复核心，立即补偿核心与四键', () => {
  const 监控段 = 事件段('查看摄像头');
  const 提示起 = 监控段.indexOf("if ('提示' in 结果 &&");
  const 提示止 = 监控段.indexOf('// 客户端已完成真实移动');
  const 提示分支 = 监控段.slice(提示起, 提示止);
  const 确认位置 = 提示分支.indexOf('await 确认隔离事务无需隔离');
  assert.ok(确认位置 >= 0, '确认删除调用必须存在');
  const 确认调用 = 提示分支.slice(确认位置, 提示分支.indexOf('if (!(操作仍有效', 确认位置));
  assert.match(确认调用, /恢复核心: async/, '确认删除必须把核心恢复回调交给确认函数，不能只在收口 catch 里回滚');
  const 恢复块 = 截段(确认调用, '恢复核心: async () => {', '},');
  assert.match(恢复块, /记录\.data快照/, '确认删除的核心补偿必须使用本次点击前 data快照');
  const 收口catch = 提示分支.indexOf('catch (收口错误)', 确认位置);
  assert.ok(收口catch > 确认位置, '确认删除后的收口 catch 必须存在');
  assert.ok(!提示分支.slice(收口catch).includes('回滚隔离事件事务'), '确认函数已自带补偿，收口 catch 不得重复回滚');
});

test('监控 catch：回滚 await 后再次复核身份才发失败事件，切聊只 warn 返回', () => {
  const 监控段 = 事件段('查看摄像头');
  const 回滚位置 = 监控段.indexOf('await 回滚隔离事件事务({ 事务: 事务.记录, 身份, 操作仍有效 })');
  const 复核位置 = 监控段.indexOf('操作仍有效() && 当前聊天ID() === 身份.聊天ID', 回滚位置);
  const 失败位置 = 监控段.indexOf("eventEmit('人妻公寓:回合失败'", 回滚位置);
  assert.ok(
    回滚位置 >= 0 && 复核位置 > 回滚位置 && 失败位置 > 复核位置,
    '回滚 await 后必须先复核身份才能向当前聊天发失败事件',
  );
});

test('查看摄像头局部静默判据：旧聊天事务留给启动恢复时外壳不再二次发事件', () => {
  const 监控段 = 事件段('查看摄像头');
  const 静默声明 = 监控段.indexOf('let 静默已切换 = false;');
  const 安全操作起 = 监控段.indexOf('安全操作(');
  assert.ok(静默声明 >= 0 && 静默声明 < 安全操作起, '静默标志必须在入口作用域先于 安全操作 声明');
  assert.match(监控段, /\(\) => 静默已切换/, '安全操作 第三个判据必须接线到静默标志');
  assert.ok(监控段.indexOf('静默已切换 = true;') >= 0, '身份已变留待启动恢复的分支必须置静默标志');
});

// ─────────────────────────────────────────────
// 6. 启动恢复：恢复中断隔离提交（四键）
// ─────────────────────────────────────────────
test('恢复中断隔离提交：无记录返回 false', async () => {
  挂载提交({});
  assert.equal(await 恢复中断隔离提交(async () => undefined), false);
});

test('恢复中断隔离提交：回写提交前 MVU、精确恢复四键并删除事务记录', async () => {
  const 提交前聊天 = 捕获精确聊天快照(
    {
      _隔离事件: { 日志: [{ id: 'old' }] },
      _上次隔离回合: null,
      _侦探: { 偷窥待选: null, 偷窥上次: {} },
      _场景: { 房间id: '302' },
    },
    隔离恢复聊天键,
  );
  const 事务 = 创建隔离事件事务记录({ 聊天ID: 'chat-a', 提交前数据, 提交前聊天 });
  当前聊天变量 = {
    [隔离事件事务键]: 事务,
    _隔离事件: { 日志: [{ id: 'old' }, { id: 'new-log' }] },
    _上次隔离回合: { 入口: '监控' },
    _侦探: { 偷窥待选: { 门牌: '101', 拍: 0 }, 偷窥上次: { 101: 9 } },
    _场景: { 房间id: '302' },
  };
  globalThis.updateVariablesWith = updater => {
    当前聊天变量 = updater(当前聊天变量) ?? 当前聊天变量;
    return 当前聊天变量;
  };
  const 回写 = [];
  const 结果 = await 恢复中断隔离提交(提交前数据 => {
    回写.push(提交前数据);
  });
  assert.equal(结果, true);
  assert.equal(回写.length, 1);
  assert.equal(回写[0].系统._绝对时段, 5, '必须回写提交前 MVU（幂等）');
  assert.deepEqual(
    当前聊天变量,
    {
      _隔离事件: { 日志: [{ id: 'old' }] },
      _上次隔离回合: null,
      _侦探: { 偷窥待选: null, 偷窥上次: {} },
      _场景: { 房间id: '302' },
    },
    '四键必须精确恢复为提交前快照',
  );
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), false);
});

test('恢复中断隔离提交：记录损坏、聊天不匹配、事务 ID 中途变化都抛错并保留记录', async () => {
  当前聊天变量 = { [隔离事件事务键]: { 版本: 999 } };
  await assert.rejects(
    恢复中断隔离提交(async () => undefined),
    /损坏的隔离事件恢复记录/,
  );
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), true, '损坏记录必须保留');

  const 别聊记录 = 创建隔离事件事务记录({
    聊天ID: 'chat-b',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  当前聊天变量 = { [隔离事件事务键]: 别聊记录 };
  await assert.rejects(
    恢复中断隔离提交(async () => undefined),
    /不属于当前聊天/,
  );

  挂载提交({});
  const 正记录 = 创建隔离事件事务记录({
    聊天ID: 'chat-a',
    提交前数据,
    提交前聊天: 捕获精确聊天快照({}, 隔离恢复聊天键),
  });
  当前聊天变量 = { [隔离事件事务键]: 正记录 };
  await assert.rejects(
    恢复中断隔离提交(async () => {
      当前聊天变量[隔离事件事务键].事务ID = '已换';
    }),
    /隔离事件恢复记录已经变化/,
  );
  assert.equal(Object.hasOwn(当前聊天变量, '_隔离事件事务'), true, '事务 ID 变化时必须保留记录');
});

// ─────────────────────────────────────────────
// 7. 源码接线契约
// ─────────────────────────────────────────────
test('荣耀洞与监控不再调用执行隔离事件，改用 生成隔离事件草稿＋顺序提交隔离事件', () => {
  assert.equal(隔离事件源.includes('export async function 执行隔离事件'), false, '危险的单步入口必须删除');
  const 监控段 = 事件段('查看摄像头');
  assert.doesNotMatch(监控段, /执行隔离事件\(/);
  assert.match(监控段, /await 生成隔离事件草稿\(\{/);
  assert.match(监控段, /await 顺序提交隔离事件\(\{/);
  const 荣耀段 = 截段(Index源, 'async function 运行荣耀洞隔离拍', '\n  }\n');
  assert.doesNotMatch(荣耀段, /执行隔离事件\(/);
  assert.match(荣耀段, /await 生成隔离事件草稿\(\{/);
  assert.match(荣耀段, /await 顺序提交隔离事件\(\{/);
});

test('生成隔离事件草稿：数据库迟到与共享前台冲突都在 生成中/生成开始/任何 await 前明确失败，finally 释放', () => {
  const 草稿段 = 隔离事件源.slice(
    隔离事件源.indexOf('export async function 生成隔离事件草稿'),
    隔离事件源.indexOf('export function 写入隔离事件草稿'),
  );
  const 数据库检查 = 草稿段.indexOf('全局数据库AI租约.在结算()');
  const 取得前台 = 草稿段.indexOf('取得前台生成租约()');
  const 生成中写 = 草稿段.indexOf('生成中 = true;');
  const 生成开始 = 草稿段.indexOf("eventEmit('人妻公寓:生成开始')");
  assert.ok(数据库检查 >= 0 && 取得前台 > 数据库检查, '数据库迟到检查必须先于取得前台租约');
  assert.match(草稿段.slice(数据库检查, 取得前台), /throw new Error/, '数据库忙时零 AI、抛出明确原因');
  assert.doesNotMatch(草稿段.slice(数据库检查, 取得前台), /return null/, '数据库忙不得再返回无原因的 null');
  assert.ok(生成中写 > 取得前台 && 生成开始 > 生成中写, '前台租约必须在 生成中=true 之前取得');
  const 首个await = 草稿段.indexOf('await ');
  assert.ok(首个await === -1 || 取得前台 < 首个await, '前台租约取得必须早于任何 await');
  const 拒绝段 = 草稿段.slice(取得前台, 生成中写);
  assert.match(拒绝段, /if \(!前台租约\)/, '取得失败必须显式拒绝');
  assert.match(拒绝段, /throw new Error/, '取得失败零 AI、抛出明确原因');
  assert.doesNotMatch(拒绝段, /return null/, '取得失败不得再返回无原因的 null');
  const finally位 = 草稿段.lastIndexOf('finally');
  const 释放位 = 草稿段.indexOf('前台租约.释放()', finally位);
  assert.ok(释放位 > finally位, '所有成功/失败/取消路径都随 finally 释放共享前台租约');
});

test('荣耀洞/监控传入的提交前数据语义正确：荣耀洞=本拍前 data，监控=入口 data快照', () => {
  const 荣耀段 = 截段(Index源, 'async function 运行荣耀洞隔离拍', '\n  }\n');
  assert.match(荣耀段, /提交前数据: 本拍前数据/, '荣耀洞事务必须保存“本拍开始前”data（含首点冷却/当前拍）');
  const 监控段 = 事件段('查看摄像头');
  assert.match(监控段, /提交前数据: 记录\.data快照/, '监控事务必须保存入口记录的 data快照');
});

test('监控事务准备发生在 查看摄像头 与 生成隔离事件草稿 之前，成功只复用同一事务 ID', () => {
  const 监控段 = 事件段('查看摄像头');
  const 准备位置 = 监控段.indexOf('await 准备隔离事件事务({');
  const 查看位置 = 监控段.indexOf('const 结果 = 查看摄像头(data');
  const 生成位置 = 监控段.indexOf('await 生成隔离事件草稿({');
  assert.ok(准备位置 >= 0 && 查看位置 > 准备位置, '事务准备必须先于 查看摄像头');
  assert.ok(生成位置 > 查看位置, '查看摄像头 必须先于 AI 生成');
  assert.match(监控段, /事务,\n\s*写核心: async/, '草稿成功后必须把同一已准备事务交给 顺序提交');
  assert.match(监控段, /提交前聊天: 记录\.聊天快照精确/, '监控事务用 建隔离记录 早先捕获的四键精确快照');
});

test('监控失败仍只走事务精确回滚退款，不再无条件 清偷窥挂起/场景写回，身份已变不写新聊天', () => {
  const 监控段 = 事件段('查看摄像头');
  assert.match(监控段, /await 回滚隔离事件事务\(\{ 事务: 事务\.记录, 身份, 操作仍有效 \}\)/, '退款必须走事务四键快照');
  assert.doesNotMatch(监控段, /清偷窥挂起\(\)\s*;/, '不得无条件清挂起（避免误清新聊天）');
  assert.doesNotMatch(监控段, /insertOrAssignVariables\(\{ _场景/, '场景回滚由事务四键快照承担');
  // 身份已变分支（AI 生成收口 catch 内）：只记日志并保留旧聊天事务，绝不发失败收口事件。
  // 从监控段中唯一的 `} catch (e) {`（AI 生成失败收口）定位，避免命中事务准备失败分支。
  const 生成收口 = 截段(监控段, '} catch (e) {', 'return;');
  assert.match(生成收口, /console\.warn/, '生成失败且身份已变：只 warn 保留旧聊天事务，绝不发失败事件');
  assert.doesNotMatch(生成收口, /回合失败/, '身份已变分支不得发失败收口事件');
});

test('监控与荣耀洞核心提交后的后处理异常不得回滚或伪报本拍失败', () => {
  const 监控段 = 事件段('查看摄像头');
  const 监控提交 = 监控段.indexOf('await 顺序提交隔离事件({');
  const 监控提交标记 = 监控段.indexOf('隔离核心已提交 = true;', 监控提交);
  const 监控快照 = 监控段.indexOf('捕获保护快照(data);', 监控提交);
  assert.ok(监控提交 >= 0 && 监控提交标记 > 监控提交 && 监控快照 > 监控提交标记, '监控必须在事务成功返回后立即标记核心已提交');
  const 监控完成 = 监控段.indexOf("eventEmit('人妻公寓:隔离事件完成'", 监控快照);
  const 监控catch = 监控段.indexOf('} catch (e) {', 监控完成);
  const 监控回滚 = 监控段.indexOf('await 回滚隔离事件事务', 监控catch);
  assert.ok(监控完成 > 监控快照 && 监控catch > 监控完成 && 监控回滚 > 监控catch);
  assert.match(
    监控段.slice(监控catch, 监控回滚),
    /if \(隔离核心已提交\)[\s\S]*?console\.warn[\s\S]*?return;/,
    '监控后处理抛错时必须在任何回滚与失败广播前按已提交标志收口',
  );
  assert.match(监控段, /\(\) => 静默已切换 \|\| 隔离核心已提交/, '安全操作外层也必须把已提交视为不可逆');

  const 荣耀段 = 截段(Index源, 'async function 运行荣耀洞隔离拍', '\n  }\n');
  const 荣耀提交 = 荣耀段.indexOf('await 顺序提交隔离事件({');
  const 荣耀提交标记 = 荣耀段.indexOf('隔离核心已提交 = true;', 荣耀提交);
  const 荣耀快照 = 荣耀段.indexOf('捕获保护快照(data);', 荣耀提交);
  assert.ok(荣耀提交 >= 0 && 荣耀提交标记 > 荣耀提交 && 荣耀快照 > 荣耀提交标记, '荣耀洞必须在事务成功返回后立即标记核心已提交');
  const 荣耀catch = 荣耀段.indexOf('} catch (e) {', 荣耀快照);
  const 荣耀失败 = 荣耀段.indexOf("eventEmit('人妻公寓:回合失败'", 荣耀catch);
  assert.ok(荣耀catch > 荣耀快照 && 荣耀失败 > 荣耀catch);
  assert.match(
    荣耀段.slice(荣耀catch, 荣耀失败),
    /if \(隔离核心已提交\)[\s\S]*?console\.warn[\s\S]*?return;/,
    '荣耀洞后处理抛错时必须在失败广播前按已提交标志收口',
  );
  assert.match(荣耀段, /标记荣耀洞核心已提交\(\)/, '荣耀洞函数必须把提交事实同步传给安全操作外层');
  assert.equal(
    (Index源.match(/\(\) => 荣耀洞静默已切换 \|\| 荣耀洞核心已提交/g) ?? []).length,
    3,
    '开始、继续与重掷三个荣耀洞入口都必须接入不可逆提交门',
  );
});

test('关系线路票先只读预检并作为监控最高优先级，只有有效画面与冻结票同时成立才升级隔离', () => {
  const 监控段 = 事件段('查看摄像头');
  const 查看位置 = 监控段.indexOf('const 结果 = 查看摄像头(data');
  const 准备位置 = 监控段.indexOf('const 调查预判: 调查演出准备结果 = 准备调查演出事件(data');
  assert.ok(准备位置 >= 0 && 查看位置 > 准备位置, '必须先预检关系票，才能让硬任务抢占普通观察');
  assert.match(
    监控段,
    /查看摄像头\(data, 门牌号, data\.系统\._绝对时段, \{[\s\S]{0,100}关系线路优先: 调查票\.成功/,
    '侦探层必须收到明确的关系线路优先票，绕过日常观察软冷却',
  );
  assert.match(监控段, /已确认有效查看/, '必须用 线路动作成功 判断监控画面是否真的有效');
  assert.match(监控段, /const 关系线路票可演 = 调查票\.成功 && 已确认有效查看/, '冻结票与有效查看必须同时成立');
  assert.match(监控段, /if \('提示' in 结果 && !关系线路票可演\)/, '普通提示收口必须排除关系线路票，防止提前接入线路');
  const 提示起 = 监控段.indexOf("if ('提示' in 结果 &&");
  const 接入位置 = 监控段.indexOf('接入线路(', 提示起);
  assert.ok(接入位置 > 提示起, '接入线路 只能出现在普通提示收口内');
  const 收口止 = 监控段.indexOf('return;', 接入位置);
  assert.ok(收口止 > 接入位置, '普通提示收口在 接入线路 后必须 return，不得落入隔离路径');
  assert.ok(监控段.indexOf('生成隔离事件草稿(') > 收口止, '隔离路径必须位于普通提示收口 return 之后');
});

test('写核心：关系线路票严格提交冻结节点，正文已生成但票据失效时抛错让事务回滚', () => {
  const 监控段 = 事件段('查看摄像头');
  const 写核心段 = 截段(监控段, '写核心: async () => {', '恢复核心: async () => {');
  assert.match(写核心段, /if \('家庭计划节点' in 结果\)/, '家庭计划监控优先');
  assert.match(写核心段, /else if \(调查票\.成功\)/, '关系线路票分支必须在家庭计划之后');
  assert.match(写核心段, /提交调查演出事件\(data, 调查票\)/, '必须严格提交冻结票据');
  assert.match(写核心段, /if \(!线路消息\.length\) throw new Error/, '票据失效必须抛错让事务整体回滚');
  assert.match(
    写核心段,
    /else if \(!\('监控日常观察' in 结果 && 结果\.监控日常观察\)\)/,
    '日常观察必须显式绕过阶段上报',
  );
  assert.match(写核心段, /上报阶段线路事件\(data, \{/, '裂缝确认前的专属调查仍保持现有上报语义');
  const 生成位置 = 监控段.indexOf('await 生成隔离事件草稿({');
  const 提交位置 = 监控段.indexOf('提交调查演出事件(data, 调查票)');
  assert.ok(提交位置 > 生成位置, '关系票必须在 AI 正文生成成功进入 写核心 后才提交');
  const 草稿检查 = 监控段.indexOf('if (!草稿?.正文) throw');
  assert.ok(草稿检查 >= 0 && 提交位置 > 草稿检查, '草稿无效时先抛错，任何线路推进都不得早于正文成功');
});

test('监控线程按关系票、日常状态签名与裂缝拍分别隔离，彼此不串历史', () => {
  const 监控段 = 事件段('查看摄像头');
  const 票线程 = 监控段.indexOf('监控线路:${门牌号}:${调查票.目标阶段!}:${调查票.节点!}');
  const 日常线程 = 监控段.indexOf('监控日常:${门牌号}:${结果.观察签名}');
  const 裂缝线程 = 监控段.indexOf('监控:${门牌号}:${(结果 as { 拍: number }).拍}');
  assert.ok(票线程 >= 0, '关系票线程必须按 门牌:目标阶段:节点 区分');
  assert.ok(日常线程 >= 0, '日常观察必须按粗粒度状态签名区分');
  assert.ok(裂缝线程 >= 0, '裂缝确认前四拍仍沿用 监控:门牌:拍');
  assert.ok(票线程 < 日常线程 && 日常线程 < 裂缝线程, '线程优先级必须是关系票→日常状态→裂缝拍兜底');
});

test('顺序提交隔离事件在最终同一个 chat 回调内追加日志、写 _上次隔离回合并删事务', () => {
  const 提交段 = 截段(隔离事件源, 'export async function 顺序提交隔离事件', '\n}');
  const 准备位置 = 提交段.indexOf('await 准备隔离事件事务({');
  const 写核心位置 = 提交段.indexOf('await 参数.写核心()');
  const 日志写入位置 = 提交段.indexOf('写入隔离事件草稿(vars as Record<string, unknown>, 参数.草稿');
  assert.ok(准备位置 >= 0 && 写核心位置 >= 0 && 日志写入位置 >= 0);
  assert.ok(准备位置 < 写核心位置, '事务准备必须先于核心写入落盘');
  assert.ok(写核心位置 < 日志写入位置, '核心写入必须先于最终业务 chat 提交');
  const 核心标志位置 = 提交段.indexOf('核心已开始 = true');
  assert.ok(核心标志位置 >= 0 && 核心标志位置 < 写核心位置, '核心已开始 标志必须先于写核心');
  assert.match(提交段, /if \(!核心已开始 \|\| !仍在本时间线\(\)\)/, '补偿必须要求核心确实开始尝试');
  const updater起 = 提交段.lastIndexOf('updateVariablesWith(', 日志写入位置);
  const updater止 = 提交段.indexOf("{ type: 'chat' }", 日志写入位置);
  const 最终回调 = 提交段.slice(updater起, updater止);
  assert.match(最终回调, /写入隔离事件草稿\(vars as Record<string, unknown>, 参数\.草稿, 参数\.锚楼\)/);
  assert.match(最终回调, /_.set\(vars, '_上次隔离回合', 参数\.记录\)/);
  assert.match(最终回调, /delete vars\[隔离事件事务键\]/);
  assert.match(最终回调, /复核隔离时间线身份\(参数\.身份, 参数\.操作仍有效\)/, '最终回调内必须复核时间线身份');
  assert.match(最终回调, /读取隔离事件事务记录\(vars\[隔离事件事务键\]\)/, '最终回调内必须核对同一事务 ID');
  assert.match(最终回调, /最终已执行 = true/, '最终回调成功完成后标记最终已执行');
});

test('生成返回后、写核心前、写核心内都复核 操作/聊天/锚楼消息 身份', () => {
  const 荣耀段 = 截段(Index源, 'async function 运行荣耀洞隔离拍', '\n  }\n');
  const 监控段 = 事件段('查看摄像头');
  for (const 段 of [荣耀段, 监控段]) {
    const 生成位置 = 段.indexOf('await 生成隔离事件草稿(');
    const 首复核位置 = 段.indexOf('复核隔离时间线身份(身份, 操作仍有效)');
    const 提交位置 = 段.indexOf('await 顺序提交隔离事件({');
    const 写核心内复核 = 段.indexOf('复核隔离时间线身份(身份, 操作仍有效);', 提交位置);
    assert.ok(生成位置 >= 0 && 首复核位置 > 生成位置, '生成返回后必须立即复核身份');
    assert.ok(提交位置 > 首复核位置, '身份复核必须先于顺序提交');
    assert.ok(写核心内复核 > 提交位置, '写核心（写 stat 前）内也必须复核身份');
  }
});

test('启动恢复必须在挂载监听之前，且时间与隔离事务并存时停止报歧义', () => {
  // C-2：用完整 Index源 的绝对位置比较，避免截段排除结束标记。
  const 恢复位置 = Index源.indexOf('await 恢复中断隔离提交(');
  const 挂载位置 = Index源.indexOf('挂载监听();');
  assert.ok(恢复位置 >= 0 && 挂载位置 > 恢复位置, '隔离恢复必须先于玩法监听挂载');
  const 启动段 = 截段(Index源, 'const 启动聊天变量 = getVariables', '脚本心跳:每 5s 写 sessionStorage');
  assert.match(启动段, /时间推进事务键[\s\S]*隔离事件事务键/, '必须检查时间事务与隔离事务并存');
  assert.match(启动段, /await 恢复中断时间推进\(\)/);
  assert.match(启动段, /await 恢复中断隔离提交\(/);
  assert.match(启动段, /记录成长: false/, '恢复写回不得记成长');
  assert.match(启动段, /当前绝对时段: 提交前数据\.系统\._绝对时段/);
});

// ─────────────────────────────────────────────
// 8. 反例
// ─────────────────────────────────────────────
test('荣耀洞失败补偿值是“本拍前 data”，不得用“使用前记录”把冷却和整场状态退掉', () => {
  const 荣耀段 = 截段(Index源, 'async function 运行荣耀洞隔离拍', '\n  }\n');
  const 补偿块 = 截段(荣耀段, '恢复核心: async () => {', '},');
  assert.match(补偿块, /本拍前数据/, '荣耀洞补偿必须恢复“本拍开始前”的 data');
  assert.doesNotMatch(补偿块, /记录\.data快照/, '荣耀洞补偿不得用“使用前记录”把首点冷却/当前拍一并退掉');
  assert.doesNotMatch(荣耀段, /荣耀洞离场/, '失败不得触发离场清场，当前拍必须保留供重试');
  assert.match(荣耀段, /当前荣耀洞场景已保留/, '失败提示必须告诉玩家场景仍可继续，不能只报回合失败');
  assert.match(荣耀段, /在洗手间继续输入行动重试/, '失败提示必须给出可操作的重试入口');
});

test('荣耀洞失败只向原时间线收口，并从当前持久同拍判断重试提示', () => {
  const 荣耀段 = 截段(Index源, 'async function 运行荣耀洞隔离拍', '\n  }\n');
  const catch段 = 荣耀段.slice(荣耀段.indexOf('} catch (e) {'));
  const 身份门 = catch段.indexOf('操作仍有效() && 当前聊天ID() === 身份.聊天ID');
  const 失败广播 = catch段.indexOf("eventEmit('人妻公寓:回合失败'");
  assert.ok(身份门 >= 0 && 失败广播 > 身份门, '任一失败广播前必须再次复核操作与聊天身份');
  assert.match(catch段, /标记荣耀洞静默切换\(\)/, '身份失效时必须通知外层静默，不得二次报错');
  assert.match(catch段, /const 当前持久数据 = 读最近有效stat\(\);/, '重试资格必须读取当前持久 stat');
  assert.match(catch段, /同一荣耀洞拍仍保留\(当前持久数据, 本拍前数据\)/, '重试资格必须使用当前持久 stat');
  assert.match(catch段, /读场景\(\)\.房间id === '洗手间'/, '只有玩家仍在洗手间才可提示原地重试');
  assert.doesNotMatch(catch段, /data\.系统\._荣耀洞拍\s*>=\s*0/, '不得再用可能已推进的闭包 data 判断补偿结果');
});

test('荣耀洞三个直接入口都把时间线静默标志接入安全操作外壳', () => {
  const 入口们 = [
    截段(Index源, "eventOn('人妻公寓:玩家行动'", "eventOn('人妻公寓:重掷'"),
    截段(Index源, "eventOn('人妻公寓:隔离事件重掷'", "eventOn('人妻公寓:取消生成'"),
    截段(Index源, "eventOn('人妻公寓:荣耀洞'", "eventOn('人妻公寓:荣耀洞离场'"),
  ];
  for (const 入口 of 入口们) {
    assert.match(入口, /let 荣耀洞静默已切换 = false;/, '入口必须持有本次操作自己的静默标志');
    assert.match(入口, /标记荣耀洞静默切换/, '运行函数必须能置位该入口的静默标志');
    assert.match(入口, /\(\) => 荣耀洞静默已切换/, '安全操作第三判据必须消费同一静默标志');
  }
});

test('翻垃圾强事件仍走 即时开演/执行回合，不进入隔离引擎', () => {
  const 翻垃圾段 = 事件段('翻垃圾');
  assert.match(翻垃圾段, /即时开演\(/, '命中强事件必须当场开演');
  assert.match(翻垃圾段, /结果 => Boolean\(结果\.事件\)/, '空手/零钱只落库提示，不启动正文生成');
  assert.doesNotMatch(翻垃圾段, /生成隔离事件草稿|顺序提交隔离事件|准备隔离事件事务/, '翻垃圾绝不进入隔离生成通道');
});

test('晨跑健身小憩都不进入独立演出，只有睡眠需要AI反馈', () => {
  const 方向段 = 截段(Index源, 'function 时间动作需要独立演出', '\n  async function 恢复时间聊天备份');
  const 动作门 = 截段(方向段, 'function 时间动作需要独立演出', '\n\n  /**');
  assert.match(动作门, /方式 === '睡到次日早晨'/);
  for (const 方式 of ['晨跑', '健身', '小憩']) {
    assert.doesNotMatch(动作门, new RegExp(`方式 === '${方式}'`), `${方式}必须直接结算，不能调用AI`);
  }
  assert.doesNotMatch(方向段, /日常晨跑|日常健身|开始今天的晨跑|开始今天的锻炼/);
});

// ─────────────────────────────────────────────
// 9. CHAT_CHANGED 立即取消隔离请求
// ─────────────────────────────────────────────
test('CHAT_CHANGED 监听里调用 取消隔离事件()，旧请求不得在新聊天写日志', () => {
  const 监听段 = 截段(
    Index源,
    'const 聊天切换监听 = eventOn(tavern_events.CHAT_CHANGED',
    '游戏逻辑全局.__rqgyGameTimelineListenerStops',
  );
  assert.match(监听段, /取消隔离事件\(\)/, '切聊天必须尽快停止/标记旧隔离请求');
  assert.doesNotMatch(Index源, /执行隔离事件\(/, '全仓不得残留会在 await 后无守卫写当前 chat 的单步入口');
});

// ─────────────────────────────────────────────
// 10. 预设破限段对荣耀洞/监控行动同样覆盖 {{lastUserMessage}}
// ─────────────────────────────────────────────
test('预设破限段(本拍行动) 对监控行动同样覆写 {{lastUserMessage}}，不展开成真实上一楼指令', () => {
  const 旧楼指令 = '（前一轮真实指令：去酒吧喝酒）';
  globalThis.getPreset = () => ({
    prompts: [{ enabled: true, role: 'system', content: '{{lastUserMessage}} 是本轮唯一的新行动。' }],
  });
  globalThis.substitudeMacros = 文 => 文.replace(/\{\{user\}\}/g, '沈翊').replace(/\{\{lastUserMessage\}\}/g, 旧楼指令);
  const 本拍监控 = '(回到302关上门,悄悄调出102室的摄像头画面,盯着看)';
  const { 前 } = 预设破限段(本拍监控);
  assert.equal(前[0].content, `${本拍监控} 是本轮唯一的新行动。`);
  assert.ok(!前[0].content.includes(旧楼指令), '监控本拍行动不得展开成 mock 的旧楼指令');
});
