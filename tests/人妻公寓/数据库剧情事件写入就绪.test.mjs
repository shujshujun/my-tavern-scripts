/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const ts = require('typescript');

const { 判定数据库脚本写入能力 } = require('../../src/人妻公寓/脚本/游戏逻辑/数据库脚本写入能力.ts');
const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

const 完整能力 = {
  已安装: true,
  已装游戏模板: true,
  有SQL接口: true,
  有SQL写入接口: true,
};

function 载入数据库API发现() {
  const 源码 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  const 起 = 源码.indexOf('function 宿主窗口()');
  const 止 = 源码.indexOf('const SQLite探测缓存时长', 起);
  assert.ok(起 >= 0 && 止 > 起, '必须能定位数据库 API 发现段');
  const js = ts.transpileModule(`${源码.slice(起, 止)}\nmodule.exports = { 取数据库API };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', js)(module, module.exports);
  return module.exports;
}

test('数据库 API 发现跳过子窗口空壳，不能遮住父页面真实可用实例', () => {
  const { 取数据库API } = 载入数据库API发现();
  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const 真API = { callAI: async () => 'ok' };
  const 父页 = { AutoCardUpdaterAPI: 真API };
  父页.parent = 父页;
  父页.top = 父页;
  const 子页 = { AutoCardUpdaterAPI: {}, parent: 父页, top: 父页, opener: null };
  try {
    globalThis.window = 子页;
    assert.strictEqual(取数据库API(), 真API, '第一个无任何公开能力的空对象不能冒充数据库 API');
    子页.AutoCardUpdaterAPI = { openSettings: async () => true };
    父页.AutoCardUpdaterAPI = {
      ...真API,
      querySql: () => ({ columns: ['ok'], values: [[1]], errors: [] }),
      executeSqlMutation: async () => ({ changes: 1, errors: [] }),
    };
    assert.strictEqual(取数据库API(), 父页.AutoCardUpdaterAPI, '子页半初始化代理也不能遮住公开能力更完整的父页实例');
    子页.AutoCardUpdaterAPI = { openSettings: async () => true, openVisualizer: () => undefined };
    父页.AutoCardUpdaterAPI = { callAI: async () => 'ok', querySql: () => ({ columns: ['ok'], values: [[1]], errors: [] }) };
    assert.strictEqual(取数据库API(), 父页.AutoCardUpdaterAPI, '同样两个方法时，AI／SQL 实例必须优先于纯界面代理');
    delete 父页.AutoCardUpdaterAPI;
    const 当前代理 = { openSettings: async () => true };
    子页.AutoCardUpdaterAPI = 当前代理;
    子页.opener = { AutoCardUpdaterAPI: 父页.AutoCardUpdaterAPI ?? { callAI: async () => 'wrong-window' } };
    assert.strictEqual(取数据库API(), 当前代理, 'opener 的其他聊天实例不能凭能力更多覆盖当前浏览上下文');
    子页.AutoCardUpdaterAPI = {};
    子页.opener = null;
    assert.equal(取数据库API(), null, '所有候选都只是空壳时应判为未安装');
  } finally {
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
  }
});

test('RQ_剧情事件写入能力按插件、五表、SQL接口、mutation 与 SQLite 实际模式逐层失败关闭', () => {
  assert.deepEqual(判定数据库脚本写入能力({ ...完整能力, 已安装: false }, false), {
    可写: false,
    状态: '数据库未安装',
    说明: '未检测到数据库插件。',
  });
  assert.equal(判定数据库脚本写入能力({ ...完整能力, 已装游戏模板: false }, false).状态, '游戏模板未安装');
  assert.equal(判定数据库脚本写入能力({ ...完整能力, 有SQL写入接口: false }, false).状态, '缺少SQL写入接口');
  assert.equal(判定数据库脚本写入能力({ ...完整能力, 有SQL接口: false }, false).状态, '缺少SQL查询接口');
  assert.equal(判定数据库脚本写入能力(完整能力, false).状态, 'SQLite未就绪');
  assert.deepEqual(判定数据库脚本写入能力(完整能力, true), {
    可写: true,
    状态: '就绪',
    说明: 'SQLite（SQL）已就绪，RQ_剧情事件可以由游戏脚本安全写入。',
  });
});

test('首次准备把 SQLite 实际可写纳入长期记忆完成门槛，并在主步骤提供设置与复检', () => {
  const 源码 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');

  assert.match(源码, /检测数据库脚本写入能力/);
  assert.match(源码, /刷新SQLite能力缓存/);
  assert.match(源码, /数据库脚本写入能力\.value\?\.可写 === true/);
  assert.match(源码, /v-else-if="数据库脚本写入检测中 \|\| !数据库脚本写入能力\?\.可写"/);
  assert.match(源码, /开启 SQLite（SQL）存储/);
  assert.match(源码, /重新检测写入能力/);
  assert.match(源码, /打开数据库设置/);
  assert.match(源码, /数据库脚本写入能力\?\.说明/);
});

test('数据库桥公开 mutation 能力并用同一判定函数探测脚本直写条件', () => {
  const 源码 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');

  assert.match(源码, /有SQL写入接口:\s*boolean/);
  assert.match(源码, /有SQL写入接口:\s*typeof api\?\.executeSqlMutation === 'function'/);
  assert.match(源码, /export async function 检测数据库脚本写入能力/);
  assert.match(源码, /判定数据库脚本写入能力\(静态能力, SQLite已启用\)/);
});

test('回合事件写入区分已确认、后台待确认与失败；超时提交不得伪报“数据库记录完成”', () => {
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  const 起 = 引擎.indexOf('async function 记录数据库回合');
  const 止 = 引擎.indexOf('function 清洗正文核心', 起);
  assert.ok(起 >= 0 && 止 > 起);
  const 函数 = 引擎.slice(起, 止);
  const 同步起 = 桥.indexOf('export async function 同步数据库回合');
  const 同步止 = 桥.indexOf('export interface 社交轨迹条目', 同步起);
  const 同步函数 = 桥.slice(同步起, 同步止);

  assert.match(同步函数, /Promise<数据库回合写入结果>/);
  assert.match(同步函数, /SQL写入状态 === '已确认'[^\n]*return '已确认'/);
  assert.match(同步函数, /SQL写入状态 === '已提交待定'[^\n]*return '待确认'/);
  assert.doesNotMatch(同步函数, /SQL写入状态 === '已确认' \|\| SQL写入状态 === '已提交待定'[^\n]*return true/);

  assert.match(函数, /const 写入结果 = await 同步数据库回合\(/);
  assert.match(函数, /写入结果 === '已确认'/);
  assert.match(函数, /写入结果 === '待确认'/);
  assert.match(函数, /数据库记录后台确认中/);
  assert.match(函数, /检测数据库脚本写入能力\(\)/);
  assert.match(函数, /数据库记录未写入/);
  assert.match(函数, /本轮正文与游戏结算不受影响/);
  assert.doesNotMatch(函数, /finally[\s\S]*数据库记录完成/, '失败或取消路径不得无条件显示完成');
});
