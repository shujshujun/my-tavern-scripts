/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

function 载入TypeScript(路径) {
  const js = ts.transpileModule(读(路径), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('require', 'module', 'exports', js)(require, module, module.exports);
  return module.exports;
}

test('数据库当前版本兼容官方 @spv 标签、旧 @v 标签和说明文字，禁用脚本不参与检测', () => {
  const { 提取数据库脚本版本 } = 载入TypeScript('src/人妻公寓/脚本/游戏逻辑/数据库版本.ts');
  assert.equal(
    提取数据库脚本版本([
      {
        name: '数据库',
        enabled: true,
        content: "import 'https://gcore.jsdelivr.net/gh/AlbusKen/shujuku@spv8.9.1/index.js'",
      },
    ]),
    '8.9.1',
  );
  assert.equal(
    提取数据库脚本版本([
      { name: '数据库', enabled: false, content: "import 'https://example.com/shujuku@spv99.0/index.js'" },
      { name: '数据库', enabled: true, content: "import 'https://example.com/shujuku@v8.8.2/index.js'" },
    ]),
    '8.8.2',
  );
  assert.equal(提取数据库脚本版本([{ name: '数据库 spv8.7.14', enabled: true }]), '8.7.14');
});

test('数据库最新版只从 spv 稳定标签中选择最高数字版本', () => {
  const { 选择最新数据库稳定版本 } = 载入TypeScript('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  assert.equal(
    选择最新数据库稳定版本({
      versions: ['test29', 'xingv5.2', '15.0', 'spv8.9', 'spv8.9.1', 'spv8.10', 'spv8.7.14'],
    }),
    '8.10',
  );
  assert.equal(选择最新数据库稳定版本({ versions: ['test29', 'xingv5.2'] }), '');
});

test('远端检测使用 no-store、超时信号并支持酒馆助手官方源失败后的镜像回退', async () => {
  const { 查询数据库官方最新版本, 查询酒馆助手官方最新版本 } = 载入TypeScript(
    'src/人妻公寓/脚本/游戏逻辑/依赖版本.ts',
  );
  const 数据库请求 = [];
  const 数据库版本 = await 查询数据库官方最新版本(async (url, init) => {
    数据库请求.push({ url: String(url), init });
    return { ok: true, json: async () => ({ versions: ['test30', 'spv8.9.1', 'spv8.9'] }) };
  });
  assert.equal(数据库版本, '8.9.1');
  assert.match(数据库请求[0].url, /data\.jsdelivr\.com\/v1\/package\/gh\/AlbusKen\/shujuku/);
  assert.equal(数据库请求[0].init.cache, 'no-store');
  assert.ok(数据库请求[0].init.signal, '远端检测应传 AbortSignal，避免网络请求永久挂起');

  const 助手请求 = [];
  const 助手版本 = await 查询酒馆助手官方最新版本(async (url, init) => {
    助手请求.push({ url: String(url), init });
    if (助手请求.length === 1) return { ok: false, status: 503, json: async () => ({}) };
    return { ok: true, json: async () => ({ version: '4.9.1' }) };
  });
  assert.equal(助手版本, '4.9.1');
  assert.equal(助手请求.length, 2);
  assert.match(助手请求[0].url, /raw\.githubusercontent\.com\/N0VI028\/JS-Slash-Runner\/main\/manifest\.json/);
  assert.match(助手请求[1].url, /jsdelivr\.net\/gh\/N0VI028\/JS-Slash-Runner@main\/manifest\.json/);
});

test('首次准备在完成后仍后台检测，更新提示可见且不阻塞开始游戏', () => {
  const 源码 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');
  assert.match(源码, /from '.{0,80}依赖版本'/, '界面应复用依赖版本检测模块');
  assert.match(源码, /数据库最新版本/);
  assert.match(源码, /数据库检测中/);
  assert.match(源码, /数据库最新版本查询失败/);
  assert.match(源码, /class="setup-update-warning"/);
  assert.match(源码, /role="status"/);
  assert.match(源码, /emit\('toast',[^\n]*可更新/);
  assert.match(源码, /let 版本检测轮次 = 0/);
  assert.match(源码, /if \(轮次 !== 版本检测轮次\) return/);
  assert.match(
    源码,
    /const 首次准备完成 = computed\(\(\) => 酒馆助手已安装\.value && 提示词已确认\.value && 数据库准备完成\.value\)/,
    '最新版网络查询只能提醒，不能成为开始游戏的门槛',
  );
  assert.match(
    源码,
    /\(\) => props\.scriptAlive[\s\S]{0,180}void 刷新全部检测\(true\)/,
    '向导是否完成都不影响脚本就绪后的后台检查与 toast 提醒',
  );
});
