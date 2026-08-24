/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const ts = require('typescript');

const { 判定数据库脚本写入能力, 等待数据库脚本写入能力稳定 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/数据库脚本写入能力.ts',
);
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

test('SQLite 查询接口在启动期暂时隐藏时会自动复检，恢复后不误报未开启', async () => {
  let 检测次数 = 0;
  let 等待次数 = 0;
  const 结果 = await 等待数据库脚本写入能力稳定(
    async () => {
      检测次数 += 1;
      if (检测次数 < 3) {
        return 判定数据库脚本写入能力({ ...完整能力, 有SQL接口: false }, false);
      }
      return 判定数据库脚本写入能力(完整能力, true);
    },
    {
      最大尝试次数: 5,
      复检间隔毫秒: 1,
      等待: async () => {
        等待次数 += 1;
      },
    },
  );

  assert.equal(检测次数, 3);
  assert.equal(等待次数, 2);
  assert.equal(结果.状态, '就绪');
  assert.equal(结果.可写, true);
});

test('永久缺少 mutation 接口不等待，SQLite 暂未就绪的复检次数有硬上限', async () => {
  let 永久错误检测次数 = 0;
  let 永久错误等待次数 = 0;
  const 永久错误 = await 等待数据库脚本写入能力稳定(
    async () => {
      永久错误检测次数 += 1;
      return 判定数据库脚本写入能力({ ...完整能力, 有SQL写入接口: false }, false);
    },
    {
      最大尝试次数: 5,
      等待: async () => {
        永久错误等待次数 += 1;
      },
    },
  );
  assert.equal(永久错误.状态, '缺少SQL写入接口');
  assert.equal(永久错误检测次数, 1);
  assert.equal(永久错误等待次数, 0);

  let 暂未就绪检测次数 = 0;
  let 暂未就绪等待次数 = 0;
  const 暂未就绪 = await 等待数据库脚本写入能力稳定(
    async () => {
      暂未就绪检测次数 += 1;
      return 判定数据库脚本写入能力(完整能力, false);
    },
    {
      最大尝试次数: 4,
      复检间隔毫秒: 1,
      等待: async () => {
        暂未就绪等待次数 += 1;
      },
    },
  );
  assert.equal(暂未就绪.状态, 'SQLite未就绪');
  assert.equal(暂未就绪检测次数, 4);
  assert.equal(暂未就绪等待次数, 3);
});

test('新的检测轮次会终止旧轮次复检，旧失败不得迟到覆盖新结果', async () => {
  let 当前有效 = true;
  let 检测次数 = 0;
  let 等待次数 = 0;
  const 结果 = await 等待数据库脚本写入能力稳定(
    async () => {
      检测次数 += 1;
      return 判定数据库脚本写入能力({ ...完整能力, 有SQL接口: false }, false);
    },
    {
      最大尝试次数: 5,
      复检间隔毫秒: 1,
      当前仍有效: () => 当前有效,
      等待: async () => {
        等待次数 += 1;
        当前有效 = false;
      },
    },
  );

  assert.equal(结果.状态, '缺少SQL查询接口');
  assert.equal(检测次数, 1, '旧轮次失效后不得继续触发第二次查询');
  assert.equal(等待次数, 1);
});

test('首次准备把 SQLite 实际可写纳入长期记忆完成门槛，并等待启动期运行时恢复', () => {
  const 源码 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');

  assert.match(源码, /等待数据库脚本写入能力稳定/);
  assert.match(源码, /最大尝试次数:\s*等待运行时 \? 11 : 1/);
  assert.match(源码, /复检间隔毫秒:\s*750/);
  assert.match(源码, /每次检测前:[\s\S]*刷新SQLite能力缓存\(\)[\s\S]*刷新数据库本地状态\(\)/);
  assert.match(源码, /当前仍有效:[\s\S]*数据库脚本写入检测轮次/);
  assert.match(源码, /数据库脚本写入能力\.value\?\.可写 === true/);
  assert.match(源码, /v-else-if="数据库脚本写入检测中 \|\| !数据库脚本写入能力\?\.可写"/);
  assert.match(源码, /正在等待 SQLite 完成初始化/);
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

test('剧情硬骨架写入区分已确认、后台待确认与失败；数据库后处理不得伪报语义摘要已经完成', () => {
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  const 起 = 引擎.indexOf('async function 记录数据库回合骨架');
  const 止 = 引擎.indexOf('async function 补齐缺失数据库事件骨架', 起);
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
  assert.match(函数, /结果摘要:\s*数据库事件待整理摘要/);
  assert.match(函数, /写入结果 === '已确认'/);
  assert.match(函数, /写入结果 === '待确认'/);
  assert.match(函数, /数据库剧情骨架后台确认中/);
  assert.match(函数, /检测数据库脚本写入能力\(\)/);
  assert.match(函数, /数据库剧情骨架未写入/);
  assert.match(函数, /本轮正文与游戏结算不受影响/);
  assert.doesNotMatch(函数, /数据库记录完成|语义摘要.*完成/, '骨架成功不得伪报数据库 AI 摘要已经完成');
});

test('数据库补楼任务的时间线校验失效时立即终止，不能把事务作废当成跳过单楼', () => {
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 起 = 引擎.indexOf('async function 补齐缺失数据库事件骨架');
  const 止 = 引擎.indexOf('\nfunction 安排数据库回合后处理', 起 + 1);
  assert.ok(起 >= 0 && 止 > 起);
  const 函数 = 引擎.slice(起, 止);
  assert.match(函数, /if \(!提交校验\(\)\) return 已补写;/, '旧时间线失效必须结束整个后台任务');
  assert.match(函数, /if \(已记录\.has\(楼层\)\) continue;/, '只有当前楼已存在才允许 continue');
  assert.doesNotMatch(函数, /!提交校验\(\) \|\| 已记录\.has\(楼层\)\) continue/);
});
