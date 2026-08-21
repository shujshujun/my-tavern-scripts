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
  for (const 预发布名 of ['数据库 spv8.10.0-beta', '数据库 spv8.10.0-rc.1', '数据库 v9.0.0-dev']) {
    assert.equal(
      提取数据库脚本版本([{ name: 预发布名, enabled: true, content: '__ACU_STAR_DB_III_LOADED__' }]),
      '',
      `${预发布名} 不得被截成正式稳定版`,
    );
  }
});

test('数据库版本检测忽略停用文件夹，并优先真实 shujuku 身份而非泛称 Database 脚本', () => {
  const { 提取数据库脚本版本 } = 载入TypeScript('src/人妻公寓/脚本/游戏逻辑/数据库版本.ts');
  assert.equal(
    提取数据库脚本版本([
      {
        type: 'folder',
        name: '已停用旧脚本',
        enabled: false,
        scripts: [{ name: '数据库', enabled: true, content: "import 'https://example.com/shujuku@spv99.0/index.js'" }],
      },
      { name: '数据库', enabled: true, content: "import 'https://example.com/shujuku@spv8.9.1/index.js'" },
    ]),
    '8.9.1',
    '禁用文件夹中的子脚本不应遮住当前启用版本',
  );
  assert.equal(
    提取数据库脚本版本([
      { name: 'Database Backup Tool', enabled: true, content: "import 'https://example.com/backup@v99.0/index.js'" },
      { name: 'SP数据库', enabled: true, content: "import 'https://gcore.jsdelivr.net/gh/AlbusKen/shujuku@spv8.9.1/index.js'" },
    ]),
    '8.9.1',
    '泛称 Database 的其他脚本不能凭自己的版本标签遮住真实 shujuku 实例',
  );
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

test('游戏当前版本固定为 0.87，最新版只接受官方 rq 稳定标签', () => {
  const { 当前游戏版本, 选择最新游戏稳定版本 } = 载入TypeScript('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 组卡源码 = 读('src/人妻公寓/组卡.mjs');
  const 组卡版本 = 组卡源码.match(/const 版本 = '([^']+)'/)?.[1];
  const 组卡标签 = 组卡源码.match(/const TAG = 'rq([^']+)'/)?.[1];
  assert.equal(当前游戏版本, '0.87', '下一次发布必须显式更新游戏本体版本');
  assert.equal(当前游戏版本, 组卡版本, '游戏检测版本必须与角色卡展示版本一致');
  assert.equal(当前游戏版本, 组卡标签, '游戏检测版本必须与角色卡资源标签一致');
  assert.equal(
    选择最新游戏稳定版本({
      versions: ['xdy0.99', 'v9.0', '0.90', 'rq0.83', 'rq0.84', 'rq0.85', 'rq0.86', 'rq0.87', 'rq0.88-beta', 'rq0.9'],
    }),
    '0.87',
  );
  assert.equal(
    选择最新游戏稳定版本([
      { ref: 'refs/tags/rq0.80' },
      { ref: 'refs/tags/xdy9.0' },
      { ref: 'refs/tags/rq0.85' },
      { ref: 'refs/tags/rq0.86' },
      { ref: 'refs/tags/rq0.87' },
      { ref: 'refs/heads/rq99.0' },
    ]),
    '0.87',
  );
  assert.equal(选择最新游戏稳定版本({ versions: ['xdy0.99', 'v0.87', 'rq0.87-beta'] }), '');
});

test('稳定版本解析严格区分正式版、预发布版与当前高于远端缓存的状态', () => {
  const { 提取稳定数字版本, 比较稳定版本 } = 载入TypeScript('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  assert.equal(提取稳定数字版本('4.9.1'), '4.9.1');
  assert.equal(提取稳定数字版本('v4.9.1'), '4.9.1');
  for (const 非稳定版本 of ['4.10.0-beta', '4.10.0-rc.1', 'dev4.10.0', 'xdy4.10', '4.9.1 extra', '', '   ']) {
    assert.equal(提取稳定数字版本(非稳定版本), '', `${非稳定版本 || '<空>'} 不得冒充稳定版`);
  }
  assert.equal(比较稳定版本('0.85', '0.85'), '相同');
  assert.equal(比较稳定版本('0.86', '0.85'), '当前较新');
  assert.equal(比较稳定版本('0.9', '0.10'), '当前较旧', '版本必须按数字段比较，而不是按十进制或字符串比较');
  assert.equal(比较稳定版本('0.86-beta', '0.85'), '无法确认');
});

test('酒馆助手最新版跳过 beta/rc/dev manifest，并只接受镜像中的正式稳定版本', async () => {
  const { 查询酒馆助手官方最新版本 } = 载入TypeScript('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  let 请求数 = 0;
  const 版本 = await 查询酒馆助手官方最新版本(async () => {
    请求数 += 1;
    return 请求数 === 1
      ? { ok: true, json: async () => ({ version: '4.10.0-beta.2' }) }
      : { ok: true, json: async () => ({ version: 'v4.9.2' }) };
  });
  assert.equal(版本, '4.9.2');
  assert.equal(请求数, 2, '预发布主源必须继续尝试稳定镜像');

  await assert.rejects(
    () =>
      查询酒馆助手官方最新版本(async () => ({
        ok: true,
        json: async () => ({ version: '5.0.0-rc.1' }),
      })),
    /没有可用的稳定版本/,
  );
});

test('版本请求的超时覆盖 response.json，底层忽略 AbortSignal 时迟到结果也不得赢回', async () => {
  const { 查询游戏官方最新版本 } = 载入TypeScript('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  let 请求数 = 0;
  let 第一源已收到中止 = false;
  const 版本 = await 查询游戏官方最新版本(async (_url, init) => {
    请求数 += 1;
    if (请求数 === 1) {
      init.signal.addEventListener('abort', () => {
        第一源已收到中止 = true;
      });
      return {
        ok: true,
        json: () => new Promise(resolve => setTimeout(() => resolve({ versions: ['rq99.0'] }), 45)),
      };
    }
    return { ok: true, json: async () => ({ versions: ['rq0.85'] }) };
  }, 10);
  assert.equal(版本, '0.85');
  assert.equal(请求数, 2, '第一源超时后必须切到第二候选地址');
  assert.equal(第一源已收到中止, true);
  await new Promise(resolve => setTimeout(resolve, 55));
  assert.equal(请求数, 2, '第一源迟到完成不得触发新查询或改写已经返回的结果');
});

test('远端检测使用 no-store、超时信号并支持酒馆助手官方源失败后的镜像回退', async () => {
  const { 查询数据库官方最新版本, 查询游戏官方最新版本, 查询酒馆助手官方最新版本 } =
    载入TypeScript('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 数据库请求 = [];
  const 数据库版本 = await 查询数据库官方最新版本(async (url, init) => {
    数据库请求.push({ url: String(url), init });
    return { ok: true, json: async () => ({ versions: ['test30', 'spv8.9.1', 'spv8.9'] }) };
  });
  assert.equal(数据库版本, '8.9.1');
  assert.match(数据库请求[0].url, /data\.jsdelivr\.com\/v1\/package\/gh\/AlbusKen\/shujuku/);
  assert.equal(数据库请求[0].init.cache, 'no-store');
  assert.ok(数据库请求[0].init.signal, '远端检测应传 AbortSignal，避免网络请求永久挂起');

  const 游戏请求 = [];
  const 游戏版本 = await 查询游戏官方最新版本(async (url, init) => {
    游戏请求.push({ url: String(url), init });
    if (游戏请求.length === 1) return { ok: false, status: 503, json: async () => ({}) };
    return {
      ok: true,
      json: async () => [{ ref: 'refs/tags/rq0.83' }, { ref: 'refs/tags/rq0.85' }, { ref: 'refs/tags/v9.0' }],
    };
  });
  assert.equal(游戏版本, '0.85');
  assert.equal(游戏请求.length, 2);
  assert.match(游戏请求[0].url, /data\.jsdelivr\.com\/v1\/package\/gh\/shujshujun\/my-tavern-scripts/);
  assert.match(游戏请求[1].url, /api\.github\.com\/repos\/shujshujun\/my-tavern-scripts\/git\/matching-refs\/tags\/rq/);
  assert.equal(游戏请求[0].init.cache, 'no-store');
  assert.ok(游戏请求[1].init.signal, '游戏版本镜像回退也应受超时信号保护');

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
  assert.match(源码, /当前游戏版本/);
  assert.match(源码, /查询游戏官方最新版本/);
  assert.match(源码, /游戏最新版本/);
  assert.match(源码, /游戏最新版本查询失败/);
  assert.match(源码, /比较稳定版本/, '当前、相同、远端较新与远端较旧必须使用同一严格版本关系');
  assert.match(源码, /高于目前查询到的官方稳定版/, '远端缓存较旧时不得误称当前就是官方最新版');
  assert.match(源码, /无法确认.*正式稳定版本/, 'beta、rc、dev 或损坏当前版本必须明确为无法确认');
  assert.match(源码, /游戏 v\$\{当前游戏版本\} → v\$\{游戏最新版本\.value\}/, '游戏落后应合入统一更新提示');
  assert.match(源码, /游戏：\{\{ 游戏检测说明 \}\}/, '高级检查应显示游戏版本状态');
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
    /Promise\.all\(\[\s*执行游戏版本检测\(轮次\),\s*执行酒馆助手版本检测\(轮次\),\s*执行数据库版本检测\(轮次\),\s*执行数据库脚本写入能力检测\(true\),\s*\]\)/,
    '游戏、酒馆助手、数据库版本与 SQLite 写入能力应并行检测',
  );
  assert.match(
    源码,
    /const 签名 = `\$\{当前游戏版本\}\|\$\{游戏最新版本\.value\}\|/,
    'toast 去重签名必须包含游戏当前与远端版本',
  );
  assert.match(源码, /暂时无法查询官方最新稳定版，可继续游戏/, '游戏版本查询失败必须明确非阻塞');
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
