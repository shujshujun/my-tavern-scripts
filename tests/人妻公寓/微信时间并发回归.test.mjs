/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

// P8:手动群接话/发消息迁至 ./交互/邀约与发消息,读新所有者；P7B2:时间显示断言改读 ./壳/渲染 页面。
const 手机源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts', import.meta.url), 'utf8');
const 聊天页源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/chat.ts', import.meta.url), 'utf8');
const 朋友圈页源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/moments.ts', import.meta.url), 'utf8');
const 节拍引擎源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');
const 数据层源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts', import.meta.url), 'utf8');
const 摘要系统源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/摘要系统.ts', import.meta.url), 'utf8');
// P5:冷落预警节拍已迁移至 ./手机/冷落预警,相关断言改读新所有者。
const 冷落预警源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/冷落预警.ts', import.meta.url), 'utf8');
const 回合源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

function 截源(源, 开始, 结束) {
  const 起 = 源.indexOf(开始);
  const 止 = 源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源.slice(起, 止);
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

/** 从数据层集中键段 + 节拍引擎水位段拼成无 import 片段执行（节拍引擎全链含数据库桥 ?raw，node 下不可 require）。 */
function 执行裁剪手机节拍水位() {
  const 键段 = 数据层源.slice(数据层源.indexOf('// 节拍键'));
  const 水位段 = 节拍引擎源.slice(节拍引擎源.indexOf('// 手机节拍水位'));
  return 执行TS片段(`${键段}\n${水位段}`, ['裁剪手机节拍水位']).裁剪手机节拍水位;
}

test('手动楼务群与姐妹群回复共用聊天+锚楼+绝对时段租约，只做增量提交', () => {
  const 手动群 = 截源(手机源, 'async function 手动群接话(', '// ── 单聊/群聊发送');
  assert.match(手动群, /发送租约:\s*手机发送租约/);
  assert.match(手动群, /手机发送租约仍有效/);
  assert.match(手动群, /发送租约\.绝对时段/);
  assert.match(手动群, /写库增量/);
  assert.match(手动群, /读到改/);
  assert.doesNotMatch(手动群, /await 写库\(/);

  const 发送 = 截源(手机源, 'async function 发消息(', '// 本模块初始化完成时向渲染层注册 P8 业务端口与批次执行器');
  assert.match(发送, /创建手机时间线租约\(发送聊天ID/);
  assert.match(发送, /手动群接话\('群'/);
  assert.match(发送, /手动群接话\('姐妹群'/);
});

test('手机节拍忙时合并一次最新补跑', () => {
  const 手机拍 = 截源(节拍引擎源, 'let 节拍进行中', '// 手机节拍水位');
  assert.match(手机拍, /let 节拍待补\s*=\s*false/);
  assert.match(手机拍, /if \(节拍进行中\)\s*\{\s*节拍待补\s*=\s*true;\s*return;/);
  assert.match(手机拍, /finally[\s\S]*节拍进行中\s*=\s*false;[\s\S]*if \(节拍待补\)[\s\S]*void 手机节拍\(\)/);
});

test('手机节拍在首次等待前冻结外层时间线，楼务与冷落等待后都立即复核', () => {
  const 手机拍 = 截源(节拍引擎源, 'export async function 手机节拍()', '// 手机节拍水位');
  const 建租约 = 手机拍.indexOf('创建手机时间线租约');
  const 等楼务 = 手机拍.indexOf('await 同步管理任务微信(data)');
  const 验楼务 = 手机拍.indexOf('if (!时间线仍有效()) return;', 等楼务);
  const 等冷落 = 手机拍.indexOf('await 冷落预警节拍()');
  const 验冷落 = 手机拍.indexOf('if (!时间线仍有效()) return;', 等冷落);
  assert.ok(建租约 >= 0 && 建租约 < 等楼务, '不能在等待后拿当前分支的新租约继续使用旧 data');
  assert.ok(验楼务 > 等楼务 && 验楼务 < 等冷落);
  assert.ok(验冷落 > 等冷落);
});

test('微信进展摘要冻结双世代，数据库社交写也使用同一提交校验', () => {
  const 摘要 = 截源(摘要系统源, 'function 微信摘要快照仍有效(', '/** 正文若紧接在手机回复之后开始');
  assert.match(摘要, /时间线世代 === 当前时间线切换世代\(\)/);
  assert.match(摘要, /手机租约世代 === 读取当前手机时间线租约世代\(\)/);
  assert.match(摘要, /同步社交轨迹\([\s\S]*微信摘要请求仍有效/);
  assert.match(摘要, /const 队列键 = `\$\{快照\.聊天ID\}\\n\$\{时间线世代\}\\n\$\{手机租约世代\}/);
});

test('冷落预警节拍忙时合并一次最新补跑', () => {
  const 冷落拍 = 冷落预警源.slice(冷落预警源.indexOf('let 冷落预警进行中'));
  assert.notEqual(冷落拍.indexOf('let 冷落预警进行中'), -1, '缺少开始锚:let 冷落预警进行中');
  assert.match(冷落拍, /let 冷落预警待补\s*=\s*false/);
  assert.match(冷落拍, /if \(冷落预警进行中\)\s*\{\s*冷落预警待补\s*=\s*true;\s*return;/);
  assert.match(
    冷落拍,
    /finally[\s\S]*冷落预警进行中\s*=\s*false;[\s\S]*if \(冷落预警待补\)[\s\S]*void 冷落预警节拍\(\)/,
  );
});

test('无效时段固定显示时间未知，同楼跨时段分组', async () => {
  const { 手机记录时间字, 手机消息时间组键 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机时间显示.ts');
  assert.equal(手机记录时间字(undefined), '时间未知');
  assert.equal(手机记录时间字(0), '第1天 早上');
  assert.notEqual(手机消息时间组键(12, 2), 手机消息时间组键(12, 3));
  assert.equal(手机消息时间组键(12, undefined), 手机消息时间组键(12, undefined));

  // P7B2:聊天页/朋友圈页已迁至 ./壳/渲染；无效时段固定显示时间未知断言改读真实所有者。
  assert.match(聊天页源码, /手机记录时间字\(m\.时\)/);
  assert.match(聊天页源码, /手机消息时间组键\(m\.楼, m\.时\)/);
  assert.match(朋友圈页源码, /手机记录时间字\(c\.时\)/);
  assert.doesNotMatch(聊天页源码, /m\.时 \?\? 当前绝对时段/);
  assert.doesNotMatch(朋友圈页源码, /c\.时 \?\? 当前绝对时段/);
});

test('回档只裁绝对时段水位，圈图游标从存活朋友圈重建', async () => {
  const 裁剪手机节拍水位 = 执行裁剪手机节拍水位();
  const 结果 = 裁剪手机节拍水位(
    { '圈:101': 9, '私:101': 8, '圈图:101:美食': 3, '圈图:102:自拍': 3 },
    1,
    [
      { 谁: '夏乔', 图: '夏乔/美食_2' },
      { 谁: '沈静仪', 图: '沈静仪/居家_1' },
    ],
    { 101: '夏乔', 102: '沈静仪' },
  );
  assert.equal(结果['圈:101'], 1);
  assert.equal(结果['私:101'], 1);
  assert.equal(结果['圈图:101:美食'], 2);
  assert.equal('圈图:102:自拍' in 结果, false);
  assert.match(回合源, /裁剪手机节拍水位\(/);
  assert.doesNotMatch(回合源, /Object\.entries\(库\.节拍 \?\? \{\}\)\.map\(\(\[k, v\]\) => \[k, Math\.min/);
});

test('绝对时段0回档后荣耀洞动态仍按键存在去重', async () => {
  const 裁剪手机节拍水位 = 执行裁剪手机节拍水位();
  const 结果 = 裁剪手机节拍水位({ '荣耀洞动态:101:0': 1 }, 0, [], {});
  assert.equal(Object.hasOwn(结果, '荣耀洞动态:101:0'), true);
  assert.equal(结果['荣耀洞动态:101:0'], 0);

  const 荣耀动态 = 截源(节拍引擎源, '// ── 荣耀洞完成后的专属暗示动态', '// ── 朋友圈近期流');
  assert.match(荣耀动态, /Object\.prototype\.hasOwnProperty\.call\(库\.节拍, 荣耀键\)/);
  assert.match(荣耀动态, /库\.节拍\[荣耀键\]\s*=\s*钟;/);
  assert.doesNotMatch(荣耀动态, /钟\s*\|\|\s*1/);
});

test('荣耀洞动态节拍键按键尾绝对时段裁剪，异常旧键保守保留', async () => {
  const 裁剪手机节拍水位 = 执行裁剪手机节拍水位();
  const 结果 = 裁剪手机节拍水位(
    {
      '荣耀洞动态:101:0': 9,
      '荣耀洞动态:101:1': 9,
      '荣耀洞动态:101:2': 9,
      '荣耀洞动态:101:旧异常': 9,
      '荣耀洞动态:缺时段': 9,
      '荣耀洞动态::3': 9,
      '荣耀洞动态:101:-1': 9,
    },
    1,
    [],
    {},
  );

  assert.equal(结果['荣耀洞动态:101:0'], 1);
  assert.equal(结果['荣耀洞动态:101:1'], 1);
  assert.equal(Object.hasOwn(结果, '荣耀洞动态:101:2'), false);
  assert.equal(结果['荣耀洞动态:101:旧异常'], 1);
  assert.equal(结果['荣耀洞动态:缺时段'], 1);
  assert.equal(结果['荣耀洞动态::3'], 1);
  assert.equal(结果['荣耀洞动态:101:-1'], 1);
});
