/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 内核源码 = readFileSync(new URL('./内核.ts', 手机目录), 'utf8');
const 配置源码 = readFileSync(new URL('./配置.ts', 手机目录), 'utf8');
const 运行时源码 = readFileSync(new URL('./运行时上下文.ts', 手机目录), 'utf8');
const 素材表源码 = readFileSync(new URL('./内容素材表.ts', 手机目录), 'utf8');
// P5:仍是预期聊天 的消费点迁移至 ./交互/父亲通话,相关断言改读新所有者。
const 父亲通话源码 = readFileSync(new URL('./交互/父亲通话.ts', 手机目录), 'utf8');
// P6:内容素材表的主要消费者已迁至 ./节拍引擎,消费断言改读新所有者。
const 节拍引擎源码 = readFileSync(new URL('./节拍引擎.ts', 手机目录), 'utf8');
// P7B2:设置页迁至 ./壳/渲染/settings,配置函数消费断言改读实际消费者。
const 生成引擎源码 = readFileSync(new URL('./生成引擎.ts', 手机目录), 'utf8');
const 摘要系统源码 = readFileSync(new URL('./摘要系统.ts', 手机目录), 'utf8');
const 设置页源码 = readFileSync(new URL('./壳/渲染/settings.ts', 手机目录), 'utf8');
// P8:交互业务迁至 ./交互/邀约与发消息,运行时/配置消费断言改读新所有者。
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 门面源码 = readFileSync(new URL('../手机系统.ts', 手机目录), 'utf8');

/** 从源码按起止锚截取片段（与 tests/人妻公寓/手机并发原子提交.test.mjs 同款）。 */
function 截源(源码, 开始, 结束) {
  const 起 = 源码.indexOf(开始);
  const 止 = 源码.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源码.slice(起, 止);
}

/** 把无 import 的 TS 片段转译为 CommonJS 并在隔离作用域执行（transpile-only）。 */
function 执行TS片段(片段, 导出名) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', js)(module, module.exports);
  return module.exports;
}

test('P2 模块由当前真实所有者接通并真实使用其符号', () => {
  // P8:运行时改由 交互/邀约与发消息 消费；内容素材表的主要消费者已迁至 ./节拍引擎。
  assert.match(交互源码, /from '\.\.\/运行时上下文'/);
  assert.match(节拍引擎源码, /from '\.\/内容素材表'/);

  // import 行内的名字不带"("，所以"符号("出现即证明 import 之外还有真实调用。
  for (const 符号 of ['末楼', '当前手机数据', '当前手机绝对时段', '当前聊天ID']) {
    assert.ok(
      (交互源码.match(new RegExp(`${符号}\\(`, 'g')) ?? []).length >= 1,
      `交互模块应在 import 之外调用 ${符号}()`,
    );
  }
  // P5:仍是预期聊天 现由新所有者 交互/父亲通话 消费（内核已不再调用），
  // 改为断言父亲通话模块从 ../运行时上下文 导入并真实调用，保持“P2 运行时模块被实际消费”的原测试意图。
  assert.match(父亲通话源码, /import \{[\s\S]*仍是预期聊天[\s\S]*\} from '\.\.\/运行时上下文';/);
  assert.ok(
    (父亲通话源码.match(/仍是预期聊天\(/g) ?? []).length >= 1,
    '父亲通话模块应在 import 之外调用 仍是预期聊天()',
  );
  // P7B2:设置页迁至 ./壳/渲染/settings,配置函数不再要求全部由内核调用,改按实际消费者核对。
  // 读配置:生成引擎/摘要系统/节拍引擎/设置页 从各自正确相对路径 import 并在 import 外真实调用。
  assert.match(生成引擎源码, /import \{[^}]*读配置[^}]*\} from '\.\/配置';/);
  assert.match(摘要系统源码, /import \{[^}]*读配置[^}]*\} from '\.\/配置';/);
  assert.match(节拍引擎源码, /import \{[^}]*读配置[^}]*\} from '\.\/配置';/);
  assert.match(设置页源码, /import \{[^}]*读配置[^}]*\} from '\.\.\/\.\.\/配置';/);
  for (const [名称, 源码] of [
    ['生成引擎', 生成引擎源码],
    ['摘要系统', 摘要系统源码],
    ['节拍引擎', 节拍引擎源码],
    ['设置页', 设置页源码],
  ]) {
    assert.ok(
      (源码.match(/读配置\(/g) ?? []).length >= 1,
      `${名称}应在 import 之外调用 读配置()`,
    );
  }
  // 存配置:设置页从 ../../配置 import 并真实调用。
  assert.match(设置页源码, /import \{[^}]*存配置[^}]*\} from '\.\.\/\.\.\/配置';/);
  assert.ok(
    (设置页源码.match(/存配置\(/g) ?? []).length >= 1,
    '设置页应在 import 之外调用 存配置()',
  );
  // 人设段:交互模块/节拍引擎 从各自正确相对路径 import 并真实调用。
  assert.match(交互源码, /import \{[^}]*人设段[^}]*\} from '\.\.\/配置';/);
  assert.match(节拍引擎源码, /import \{[^}]*人设段[^}]*\} from '\.\/配置';/);
  for (const [名称, 源码] of [
    ['交互模块', 交互源码],
    ['节拍引擎', 节拍引擎源码],
  ]) {
    assert.ok(
      (源码.match(/人设段\(/g) ?? []).length >= 1,
      `${名称}应在 import 之外调用 人设段()`,
    );
  }
  for (const 符号 of ['圈图每类张数', '发圈偏好', '主题提示', '攻略动态方向', '攻略图SKU']) {
    assert.ok(节拍引擎源码.includes(符号), `节拍引擎应在 import 之外使用 ${符号}`);
  }
});

test('内核不再自行声明被迁移的运行时函数与配置函数', () => {
  const 禁止声明 = [
    /function 末楼\(/,
    /function 当前手机数据\(/,
    /function 当前手机绝对时段\(/,
    /function 仍是预期聊天\(/,
    /export function 当前聊天ID\(/,
    /type 手机AI来源 =/,
    /interface 手机配置 \{/,
    /const 配置KEY =/,
    /function 读配置\(/,
    /function 存配置\(/,
    /const _人设缓存 =/,
    /function 妻人设\(/,
    /function 人设段\(/,
  ];
  for (const 模式 of 禁止声明) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明:${模式}`);
  }
});

test('内核不再自行声明被迁移的朋友圈/攻略素材常量与类型', () => {
  const 禁止声明 = [
    /const 圈图每类张数 =/,
    /type 朋友圈主题 =/,
    /const 发圈偏好:/,
    /const 主题提示:/,
    /const 朋友圈兜底文案:/,
    /const 攻略动态方向:/,
    /const 攻略图SKU:/,
  ];
  for (const 模式 of 禁止声明) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明:${模式}`);
  }
});

test('配置.ts 保留旧配置迁移逻辑与 3000 字人设截断', () => {
  assert.ok(
    配置源码.includes("旧.ai来源 ?? (旧.base && 旧.key && 旧.model ? '自定义' : '自动')"),
    '配置.ts 应保留 0.27 旧配置三件套迁移逻辑',
  );
  assert.ok(配置源码.includes("出 = 出.slice(0, 3000) + '\\n(人设节选)'"), '配置.ts 应保留世界书人设 3000 字截断');
  assert.ok(配置源码.includes("getCharWorldbookNames('current')"), '配置.ts 应保留世界书读取');
  assert.ok(配置源码.includes('外貌特征'), '配置.ts 应保留剥外貌段逻辑');
});

test('配置.ts 迁移行为:旧 base/key/model 三件套完整时迁移为自定义 AI 来源', () => {
  const 片段 = 截源(配置源码, 'const 配置KEY =', 'export function 存配置');
  const { 读配置 } = 执行TS片段(片段, ['读配置']);
  const 存储 = new Map();
  const 原window = globalThis.window;
  globalThis.window = {
    parent: {
      localStorage: {
        getItem: k => (存储.has(k) ? 存储.get(k) : null),
        setItem: (k, v) => 存储.set(k, v),
      },
    },
  };
  try {
    存储.set('人妻公寓_手机配置', JSON.stringify({ base: 'https://api.example.com', key: 'secret', model: 'gpt-x' }));
    assert.equal(读配置().ai来源, '自定义');
    assert.equal(读配置().base, 'https://api.example.com');
    assert.equal(读配置().model, 'gpt-x');

    存储.set('人妻公寓_手机配置', JSON.stringify({ ai来源: '数据库' }));
    assert.equal(读配置().ai来源, '数据库');

    存储.set('人妻公寓_手机配置', JSON.stringify({}));
    assert.equal(读配置().ai来源, '自动');
  } finally {
    globalThis.window = 原window;
  }
});

test('配置.ts 损坏旧存储不会把非法枚举和非标量值泄漏给生成、摘要与节拍消费者', () => {
  const 片段 = 截源(配置源码, 'const 配置KEY =', 'export function 存配置');
  const { 读配置 } = 执行TS片段(片段, ['读配置']);
  const 存储 = new Map();
  const 原window = globalThis.window;
  globalThis.window = {
    parent: {
      localStorage: {
        getItem: k => (存储.has(k) ? 存储.get(k) : null),
        setItem: (k, v) => 存储.set(k, v),
      },
    },
  };
  try {
    存储.set(
      '人妻公寓_手机配置',
      JSON.stringify({
        ai来源: '未知来源',
        微信进展摘要: 'false',
        base: 123,
        key: null,
        model: { id: 'bad' },
        频率: '极速',
      }),
    );
    assert.deepEqual(读配置(), {
      ai来源: '自动',
      微信进展摘要: true,
      base: '',
      key: '',
      model: '',
      频率: '普通',
    });

    存储.set(
      '人妻公寓_手机配置',
      JSON.stringify({
        ai来源: '自定义',
        微信进展摘要: false,
        base: 'https://api.example.com/v1',
        key: 'secret',
        model: 'gpt-x',
        频率: '关',
      }),
    );
    assert.deepEqual(读配置(), {
      ai来源: '自定义',
      微信进展摘要: false,
      base: 'https://api.example.com/v1',
      key: 'secret',
      model: 'gpt-x',
      频率: '关',
    });
  } finally {
    globalThis.window = 原window;
  }
});

test('配置.ts 世界书人设:剥外貌段并按 3000 字截断', async () => {
  const 片段 = 截源(配置源码, 'const _人设缓存 =', 'export async function 人设段');
  const { 妻人设 } = 执行TS片段(片段, ['妻人设']);
  const 原window = globalThis.window;
  const 原getCharWorldbookNames = globalThis.getCharWorldbookNames;
  const 原getWorldbook = globalThis.getWorldbook;
  const 原户静态表 = globalThis.户静态表;
  globalThis.window = undefined;
  globalThis.getCharWorldbookNames = () => ({ primary: '主世界书' });
  globalThis.getWorldbook = async () => [
    { enabled: true, name: '夏乔', content: `  外貌特征:一张脸\n  ` + '长'.repeat(4000) },
  ];
  globalThis.户静态表 = { '101': { 妻名: '夏乔' } };
  try {
    const 出 = await 妻人设('101');
    assert.ok(!出.includes('外貌特征'), '应剥掉外貌段');
    assert.ok(出.endsWith('\n(人设节选)'), '超长人设应以(人设节选)收尾');
    assert.ok(出.length <= 3000 + '\n(人设节选)'.length, '截断后不超过 3000 字加节选标记');
  } finally {
    globalThis.window = 原window;
    globalThis.getCharWorldbookNames = 原getCharWorldbookNames;
    globalThis.getWorldbook = 原getWorldbook;
    globalThis.户静态表 = 原户静态表;
  }
});

test('运行时上下文:无可用 stat 时当前手机绝对时段兜底 -1', () => {
  const 片段 = 截源(运行时源码, 'function 当前手机数据', 'const 手机聊天身份宿主键');
  const { 当前手机绝对时段 } = 执行TS片段(片段, ['当前手机绝对时段']);
  const 原读最近有效stat = globalThis.读最近有效stat;
  try {
    globalThis.读最近有效stat = () => null;
    assert.equal(当前手机绝对时段(), -1, '读不到 stat_data 时兜底 -1');

    globalThis.读最近有效stat = () => {
      throw new Error('宿主环境不可用');
    };
    assert.equal(当前手机绝对时段(), -1, '宿主读取抛错时同样兜底 -1');
  } finally {
    globalThis.读最近有效stat = 原读最近有效stat;
  }
});

test('当前聊天ID 经内核 re-export，原门面外部 API 不变', () => {
  assert.match(内核源码, /export \{ 当前聊天ID \} from '\.\/运行时上下文'/);
  assert.match(门面源码, /export \* from '\.\/手机\/内核'/);
});
