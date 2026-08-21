/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 运行时源码 = readFileSync(new URL('./运行时上下文.ts', 手机目录), 'utf8');
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
const 渲染源码 = readFileSync(new URL('./壳/渲染/index.ts', 手机目录), 'utf8');
const 红点源码 = readFileSync(new URL('./壳/红点与开合.ts', 手机目录), 'utf8');
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 父亲源码 = readFileSync(new URL('./交互/父亲通话.ts', 手机目录), 'utf8');
const 孕情通知源码 = readFileSync(new URL('./孕情AI通知.ts', 手机目录), 'utf8');
const 节拍源码 = readFileSync(new URL('./节拍引擎.ts', 手机目录), 'utf8');
const 楼务通知源码 = readFileSync(new URL('./通知桥.ts', 手机目录), 'utf8');
const 冷落预警源码 = readFileSync(new URL('./冷落预警.ts', 手机目录), 'utf8');

function 截源(源, 开始, 结束) {
  const 标准源 = 源.replace(/\r\n/g, '\n');
  const 起 = 标准源.indexOf(开始);
  const 止 = 标准源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 标准源.slice(起, 止);
}

function 执行TS片段(片段, 导出名, 依赖 = {}) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(依赖), js)(module, module.exports, ...Object.values(依赖));
  return module.exports;
}

function 下一拍() {
  return new Promise(resolve => setImmediate(resolve));
}

test('冷启动楼轴：宏尚未就绪返回假 0 时，不把高楼层微信记录误判成未来数据', () => {
  const 片段 = 截源(运行时源码, 'export function 末楼', 'export function 当前手机数据');
  const 宿主 = { chat: [] };
  const { 末楼, 手机楼轴已就绪 } = 执行TS片段(片段, ['末楼', '手机楼轴已就绪'], {
    SillyTavern: 宿主,
    getLastMessageId: () => 0,
  });

  assert.equal(手机楼轴已就绪(), false, '空聊天数组是宿主冷启动，不是合法第 0 楼');
  assert.equal(末楼(), -1, '宏把空串转成 0 时必须保留未就绪哨兵');

  宿主.chat = Array.from({ length: 9 }, (_, i) => ({ mes: String(i) }));
  assert.equal(手机楼轴已就绪(), true);
  assert.equal(末楼(), 8, '聊天数组已经恢复时以真实数组末楼为准，不信任仍为 0 的宏');
});

test('聊天变量硬保存：串行等待宿主 saveMetadata，同一聊天才执行，不能只等防抖定时器', async () => {
  assert.match(数据层源码, /export async function 立即持久保存手机聊天变量/);
  const 片段 = 截源(数据层源码, 'type 手机宿主保存接口', '/**\n * 宿主明确报告删楼');
  let 聊天ID = 'chat-a';
  const 调用 = [];
  const 放行 = [];
  const 直接上下文 = {
    saveMetadata: async () => {
      调用.push(`开始:${聊天ID}`);
      await new Promise(resolve => 放行.push(resolve));
      调用.push(`结束:${聊天ID}`);
    },
  };
  const window = { parent: {} };
  const { 立即持久保存手机聊天变量 } = 执行TS片段(片段, ['立即持久保存手机聊天变量'], {
    当前聊天ID: () => 聊天ID,
    SillyTavern: 直接上下文,
    window,
  });

  const 第一 = 立即持久保存手机聊天变量('chat-a');
  const 第二 = 立即持久保存手机聊天变量('chat-a');
  await 下一拍();
  assert.deepEqual(调用, ['开始:chat-a'], '并发气泡只能有一个宿主保存正在执行');
  放行.shift()();
  assert.equal(await 第一, true);
  await 下一拍();
  assert.deepEqual(调用, ['开始:chat-a', '结束:chat-a', '开始:chat-a'], '第二次保存必须排在第一次之后');
  放行.shift()();
  assert.equal(await 第二, true);

  const 切聊前调用数 = 调用.length;
  const 旧聊天保存 = 立即持久保存手机聊天变量('chat-a');
  聊天ID = 'chat-b';
  assert.equal(await 旧聊天保存, false, '排队期间已经切聊时不得把旧聊天提交到新聊天');
  assert.equal(调用.length, 切聊前调用数, '失效聊天不得调用宿主保存');
});

test('微信可见事务提交：发送、整批回复、邀约、撤回和父亲通话都在事务边界硬保存', () => {
  const 写库段 = 截源(数据层源码, 'export async function 写库增量', 'export async function 压缩微信会话记录');
  const 发送段 = 截源(交互源码, 'async function 发消息(', '/** 黄灯到时只消费本批');
  const 批次段 = 截源(交互源码, 'async function 执行待回复批次(', 'async function 执行批次聊天回复(');
  const 邀约段 = 截源(交互源码, 'async function 约出来(', '/**\n * 共同邀约的批次所有者');
  const 撤回段 = 截源(交互源码, 'async function 持久化玩家微信撤回', 'interface 微信消息菜单选项');
  const 通话段 = 截源(父亲源码, 'async function 确保父亲通话完成消息', 'function 父亲通话结论');

  assert.doesNotMatch(写库段, /立即持久保存手机聊天变量/, '底层增量也承担已读水位，不能每次都做整聊硬保存');

  const 落库位 = 发送段.indexOf('已成功落库 = true;');
  const 重绘位 = 发送段.indexOf('请求手机重绘();', 落库位);
  const 保存位 = 发送段.indexOf('await 立即持久保存手机聊天变量(发送聊天ID);', 落库位);
  assert.ok(落库位 >= 0 && 重绘位 > 落库位 && 保存位 > 重绘位, '玩家气泡先显示，再等待本聊天硬保存');

  assert.match(
    批次段,
    /if \(已生成 && 手机发送租约仍有效\(上下文\.发送租约\)\) \{[\s\S]*await 立即持久保存手机聊天变量\(上下文\.发送租约\.聊天ID\);[\s\S]*\}/,
    '整批 AI 回复完成后只在批次边界硬保存一次',
  );
  assert.match(邀约段, /await 立即持久保存手机聊天变量\(邀约聊天ID\);/, '邀约消息与回复提交后应硬保存');
  assert.match(撤回段, /await 立即持久保存手机聊天变量\(预期聊天ID\);/, '玩家撤回成功后应硬保存墓碑');
  assert.match(通话段, /await 立即持久保存手机聊天变量\(预期聊天ID\);/, '父亲通话结束气泡也不能只留在内存');
});

test('自动通知、必达群聊、普通节拍、冷落预警与实时已读都在各自批次边界硬保存一次', () => {
  assert.match(
    孕情通知源码,
    /if \(已写\) \{[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/,
    '孕产与家庭计划通知成功显示后必须硬保存',
  );
  assert.match(
    节拍源码,
    /if \(必达结果 === '有新'\)[\s\S]*?if \(!已写必达群\) return;[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/,
    '孕产必达群批次必须只在整批成功后保存一次',
  );
  assert.match(
    节拍源码,
    /if \(有新 \|\| Object\.keys\(节拍改\)\.length \|\| 已发私聊图改\)[\s\S]*?if \(!已写\) return;[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/,
    '普通自动节拍必须只在最终增量成功后保存一次',
  );
  assert.match(楼务通知源码, /if \(已写\) \{[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/);
  assert.match(冷落预警源码, /if \(!已写\) return;[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/);
  assert.match(
    数据层源码,
    /const 已写 = await 写库增量\([\s\S]*?if \(已写\) await 立即持久保存手机聊天变量\(聊天ID\);[\s\S]*?return 已写;/,
    '实时已读水位也必须在成功写入后落盘，避免刷新后红点复活',
  );
});

test('手机早于酒馆聊天加载时显示恢复态并自动复查，而不是把空库当成真实聊天记录', () => {
  assert.match(渲染源码, /手机楼轴已就绪/);
  const 就绪判断 = 渲染源码.indexOf('if (!手机楼轴已就绪())');
  const 读库位置 = 渲染源码.indexOf('const 库 = 读库()');
  assert.ok(就绪判断 >= 0 && 就绪判断 < 读库位置, '必须先识别冷启动，再读取会被楼/分支过滤的微信库');
  assert.match(渲染源码, /正在恢复微信记录/);
  assert.match(渲染源码, /刷新红点\(\)/, '恢复态借红点调度器继续复查宿主就绪状态');

  assert.match(红点源码, /function 排队恢复手机冷启动/);
  assert.match(红点源码, /if \(!手机楼轴已就绪\(\)\)/);
  assert.match(红点源码, /手机冷启动恢复次数 < 手机冷启动快速恢复上限 \? 100 : 1000/, '超长冷启动应降频继续复查');
  assert.doesNotMatch(红点源码, /手机冷启动恢复次数 >= .*恢复上限.*return/, '超过快速窗口不得永久停止恢复');
  assert.match(红点源码, /已注册端口\?\.渲染\(\)/, '宿主恢复后必须主动重绘已打开的手机');
});
