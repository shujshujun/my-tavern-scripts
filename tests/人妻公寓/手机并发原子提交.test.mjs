/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 内核源码 = readFileSync(new URL('./内核.ts', 手机目录), 'utf8');
// P8:邀约/发送/批次/群接话等交互业务迁至 ./交互/邀约与发消息,相关断言改读新所有者。
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
// P5:会场私聊气口与摘要租约已迁移至 ./手机/静音会议旁路,相关断言改读新所有者。
const 旁路源码 = readFileSync(new URL('./静音会议旁路.ts', 手机目录), 'utf8');
// P7A:输入引用计数/释放会话待回复/静音会议私聊回复生成中 已迁至 ./手机/壳/会话瞬态,相关断言改读新所有者。
const 会话瞬态源码 = readFileSync(new URL('./壳/会话瞬态.ts', 手机目录), 'utf8');
// P7B2:渲染已拆至 ./壳/渲染,渲染相关断言改读新所有者。
const 渲染index源码 = readFileSync(new URL('./壳/渲染/index.ts', 手机目录), 'utf8');
const 渲染共享源码 = readFileSync(new URL('./壳/渲染/共享.ts', 手机目录), 'utf8');
const 渲染chats源码 = readFileSync(new URL('./壳/渲染/chats.ts', 手机目录), 'utf8');

function 截源(源, 开始, 结束) {
  const 起 = 源.indexOf(开始);
  const 止 = 源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源.slice(起, 止);
}

function 执行TS片段(片段, 导出名) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', js)(module, module.exports);
  return module.exports;
}

test('玩家发送、已读、邀约与妻回复全部走增量提交，不再保留陈旧整库写入口', () => {
  assert.doesNotMatch(内核源码, /async function 写库\(/);
  assert.doesNotMatch(数据层源码, /async function 写库\(/);
  const 增量写 = 截源(数据层源码, 'async function 写库增量(', 'function 赴约仍活动');
  assert.match(增量写, /合并微信撤回状态/);
  assert.match(增量写, /活玩家标识/);

  // P7B2:渲染已拆至 ./壳/渲染；增量提交断言改读真实所有者（调度器/共享/会话列表页）。
  const 调度段 = 截源(渲染index源码, 'export function 渲染()', '注册父亲通话UI端口');
  assert.doesNotMatch(调度段, /await 写库\(/);
  // P7:两类已读统一委托给数据层 写实时手机已读，增量形状断言改读该入口的合并段。
  const 实时已读段 = 截源(数据层源码, 'export async function 写实时手机已读', 'function 赴约仍活动');
  assert.match(实时已读段, /读到改/, '会话目标经数据层写 读到改');
  assert.match(实时已读段, /圈读到改/, '朋友圈目标经数据层写 圈读到改');
  assert.match(渲染共享源码, /写实时手机已读\(\{ 朋友圈: true \}\)/);
  assert.match(渲染chats源码, /写实时手机已读\(\{ 会话:/);
  assert.doesNotMatch(渲染共享源码, /await 写库\(/);
  assert.doesNotMatch(渲染chats源码, /await 写库\(/);

  const 邀约段 = 截源(交互源码, 'async function 约出来(', '// ── 楼务群接话');
  assert.match(邀约段, /写库增量/);
  assert.doesNotMatch(邀约段, /await 写库\(/);

  const 发送段 = 截源(交互源码, 'async function 发消息(', '// 本模块初始化完成时向渲染层注册 P8 业务端口与批次执行器');
  assert.match(发送段, /写库增量/);
  assert.doesNotMatch(发送段, /await 写库\(/);
});

test('邀约在第一次异步写之前占住同一会话，不能与发送或双击邀约并发', () => {
  const 邀约段 = 截源(交互源码, 'async function 约出来(', '// ── 楼务群接话');
  const 首次异步写 = 邀约段.indexOf('await 写库增量');
  const 占租约 = 邀约段.indexOf('开始会话输入');
  assert.ok(首次异步写 > 0 && 占租约 > 0 && 占租约 < 首次异步写);
  assert.match(邀约段.slice(0, 占租约), /会话正在输入\(m,\s*邀约聊天ID,\s*邀约租约\.世代\)/);
  assert.ok(
    邀约段.indexOf('创建手机时间线租约') < 邀约段.indexOf('排队手机邀约'),
    '邀约必须在入队前冻结完整时间线租约',
  );
});

test('正在输入使用逐会话引用计数，任一会议参与妻未完成都阻止正文', () => {
  // P7A:输入计数与租约函数归 壳/会话瞬态 唯一所有，内核不得保留重复定义。
  assert.match(会话瞬态源码, /const 正在输入会话\s*=\s*new Map<string, number>\(\)/);
  assert.match(会话瞬态源码, /export function 开始会话输入\(/);
  assert.match(会话瞬态源码, /export function 结束会话输入\(/);
  assert.match(会话瞬态源码, /export function 会话正在输入\(/);
  assert.doesNotMatch(内核源码, /const 正在输入会话/);
  assert.doesNotMatch(内核源码, /function 开始会话输入\(|function 结束会话输入\(|function 会话正在输入\(/);
  assert.doesNotMatch(内核源码, /let 正在输入:\s*string \| null/);

  // P7A:静音会议私聊回复生成中 的唯一实现在会话瞬态，硬门仍是 参与妻 逐个 会话正在输入。
  assert.match(
    会话瞬态源码,
    /export function 静音会议私聊回复生成中\(\): boolean \{\s*const 状态 = 获取静音会议手机状态\(\);\s*return 状态\.场景中 && 状态\.参与妻\.some\(会话 => 会话正在输入\(会话\)\);\s*\}/,
  );
  assert.match(内核源码, /export \{ 静音会议私聊回复生成中 \} from '\.\/壳\/会话瞬态';/);

  const 计数片段 = 截源(会话瞬态源码, 'const 正在输入会话', 'export interface 会话待回复上下文');
  const { 开始会话输入, 结束会话输入, 会话正在输入 } = 执行TS片段(计数片段, [
    '开始会话输入',
    '结束会话输入',
    '会话正在输入',
  ]);
  const a101 = 开始会话输入('101', 'chat-a', 1);
  const b101 = 开始会话输入('101', 'chat-b', 1);
  const b101另一个 = 开始会话输入('101', 'chat-b', 1);
  const a新世代 = 开始会话输入('101', 'chat-a', 2);
  结束会话输入(a101);
  结束会话输入(b101);
  assert.equal(会话正在输入('101', 'chat-a', 1), false);
  assert.equal(会话正在输入('101', 'chat-a', 2), true, '旧世代 finally 不得释放新分支的同会话输入锁');
  assert.equal(会话正在输入('101', 'chat-b', 1), true, 'A 档完成不得释放 B 档同门牌的剩余任务');
  结束会话输入(b101另一个);
  结束会话输入(a新世代);
  assert.equal(会话正在输入('101', 'chat-b', 1), false);
});

test('会议私聊摘要在共享 MVU 队列内重读最新 MVU 后逐妻合并', () => {
  const 摘要段 = 截源(旁路源码, 'const 会场私聊气口', 'export function 取会场私聊摘要提示');
  assert.match(摘要段, /排队MVU操作/);
  const 排队位 = 摘要段.indexOf('排队MVU操作');
  const 重读位 = 摘要段.indexOf('读取最近有效()', 排队位);
  const 合并位 = 摘要段.indexOf('会场私聊摘要[门牌号]', 重读位);
  assert.ok(重读位 > 排队位 && 合并位 > 重读位, '摘要必须在获得队列租约后重读并合并');
});

test('会场摘要冻结聊天与会议身份，排队期间切档或换场后旧气口失效', () => {
  const 摘要段 = 截源(旁路源码, 'interface 会场私聊摘要租约', 'export function 取会场私聊摘要提示');
  assert.match(摘要段, /聊天ID/);
  assert.match(摘要段, /启动楼层/);
  assert.match(摘要段, /会议签名/);
  assert.match(摘要段, /时间线世代/);
  assert.match(摘要段, /登记MVU提交校验/);

  const helper段 = 截源(旁路源码, 'interface 会场私聊摘要租约', 'function 判会场私聊气口');
  const { 会场私聊摘要租约匹配 } = 执行TS片段(helper段, ['会场私聊摘要租约匹配']);
  const 租约 = { 聊天ID: 'chat-a', 启动楼层: 20, 会议签名: '静音会议|20|101,102|租约议题', 时间线世代: 7 };
  assert.equal(
    会场私聊摘要租约匹配(租约, { 聊天ID: 'chat-a', 启动楼层: 20, 会议签名: 租约.会议签名, 时间线世代: 7 }),
    true,
  );
  assert.equal(
    会场私聊摘要租约匹配(租约, { 聊天ID: 'chat-b', 启动楼层: 20, 会议签名: 租约.会议签名, 时间线世代: 7 }),
    false,
  );
  assert.equal(
    会场私聊摘要租约匹配(租约, {
      聊天ID: 'chat-a',
      启动楼层: 30,
      会议签名: '静音会议|30|101,102|租约议题',
      时间线世代: 7,
    }),
    false,
  );
  assert.equal(
    会场私聊摘要租约匹配(租约, { 聊天ID: 'chat-a', 启动楼层: 20, 会议签名: 租约.会议签名, 时间线世代: 8 }),
    false,
  );
});

test('邀约首次重绘仍在获锁后的 try/finally 内', () => {
  const 邀约段 = 截源(交互源码, 'async function 约出来(', '// ── 楼务群接话');
  const 获锁 = 邀约段.indexOf('开始会话输入');
  const try位 = 邀约段.indexOf('try', 获锁);
  const 首次渲染 = 邀约段.indexOf('请求手机重绘()', 获锁);
  const finally位 = 邀约段.indexOf('finally', try位);
  const 解锁 = 邀约段.indexOf('结束会话输入', finally位);
  assert.ok(获锁 >= 0 && try位 > 获锁 && 首次渲染 > try位 && finally位 > 首次渲染 && 解锁 > finally位);
});

test('玩家发送在首次写库前预留消息 ID，批次结束才释放会话锁', () => {
  const 发送段 = 截源(交互源码, 'async function 发消息(', 'async function 执行待回复批次(');
  const 获锁 = 发送段.indexOf('开始会话输入');
  const 预留消息ID = 发送段.indexOf('const 玩家消息标识 = 新玩家微信消息标识');
  const 开始写入 = 发送段.indexOf('手机聊天批次.开始写入(键, 玩家消息标识)');
  const 首次异步写 = 发送段.indexOf('await 写库增量');
  assert.ok(获锁 >= 0 && 预留消息ID > 获锁 && 开始写入 > 预留消息ID && 首次异步写 > 开始写入);

  const finally位 = 发送段.indexOf('finally', 首次异步写);
  const 完成写入 = 发送段.indexOf('手机聊天批次.完成写入(键, 玩家消息标识, 已成功落库)', finally位);
  assert.ok(finally位 > 首次异步写 && 完成写入 > finally位, '玩家消息无论成功失败都必须结束写入预留');

  const 批次段 = 截源(交互源码, 'async function 执行待回复批次(', 'async function 执行批次聊天回复(');
  const 生命周期入口 = 批次段.indexOf('await 执行手机聊天批次任务(');
  const 完成请求 = 批次段.indexOf('手机聊天批次.完成请求(请求.键, 请求.请求序号, true)', 生命周期入口);
  const 上下文身份校验 = 批次段.indexOf('取会话待回复(请求.键) === 本次上下文', 完成请求);
  const 释放待回复 = 批次段.indexOf('释放会话待回复(请求.键)', 上下文身份校验);
  assert.ok(
    生命周期入口 >= 0 && 完成请求 > 生命周期入口 && 上下文身份校验 > 完成请求 && 释放待回复 > 上下文身份校验,
    '批次必须交给无拒绝生命周期收口，并在完成请求后只释放同一批次持有的会话锁',
  );

  // P7A:释放会话待回复 的唯一实现在会话瞬态，原子解锁语义不变。
  const 释放段 = 截源(会话瞬态源码, 'export function 释放会话待回复(', 'type 批次执行器');
  assert.match(释放段, /if \(!上下文\.已释放\)[\s\S]*结束会话输入\(上下文\.输入租约\)[\s\S]*会话待回复\.delete\(键\)/);
});

test('发送入口冻结聊天ID与原时间线，切档后不得重捕获新档继续回复', () => {
  const 发送段 = 截源(交互源码, 'async function 发消息(', 'async function 执行待回复批次(');
  const 群接话段 = 截源(交互源码, 'async function 手动群接话(', '// ── 单聊/群聊发送');
  const 批次回复段 = 截源(交互源码, 'async function 执行批次聊天回复(', '// 本模块初始化完成时向渲染层注册 P8 业务端口与批次执行器');
  assert.match(发送段, /const 发送聊天ID\s*=\s*当前聊天ID\(\)/);
  assert.match(发送段, /创建手机时间线租约\(发送聊天ID/);
  assert.match(发送段, /const 已写 = await 写库增量\([\s\S]*?\(\) => 手机发送租约仍有效\(发送租约\),\s*\);/);
  assert.match(发送段, /写会场私聊摘要\([\s\S]*发送租约\.会场摘要租约/);
  assert.match(群接话段, /const 有效 = 手机发送租约仍有效\(发送租约\) && 手机小生成仍有效\(控制\)/);
  assert.match(批次回复段, /手动群接话\('群', [^\r\n]+, 发送租约, 控制\)/);
  assert.match(批次回复段, /手动群接话\('姐妹群', [^\r\n]+, 发送租约, 控制\)/);
  assert.match(批次回复段, /const 回复聊天ID\s*=\s*发送租约\.聊天ID/);
  assert.doesNotMatch(批次回复段, /const 回复聊天ID\s*=\s*当前聊天ID\(\)/);

  const { 创建手机时间线租约, 手机时间线租约仍有效 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts');
  const 原消息 = [{ mes: '同样外观', is_user: false, swipe_id: 0 }];
  const 新档同貌消息 = [{ mes: '同样外观', is_user: false, swipe_id: 0 }];
  const 租约 = 创建手机时间线租约('chat-a', 0, 原消息, 2);
  assert.ok(租约);
  assert.equal(手机时间线租约仍有效(租约, 'chat-b', 原消息, 2), false, '仅切聊天ID即必须失效');
  assert.equal(手机时间线租约仍有效(租约, 'chat-a', 新档同貌消息, 2), false, '同貌新档也不能通过引用锚');
});

test('跨妻邀约全局串行，接受回复与单例赴约在同一变量回调 CAS', async () => {
  const 邀约段 = 截源(交互源码, 'const 手机邀约队列', '// ── 楼务群接话');
  const { 排队手机邀约 } = 执行TS片段(截源(交互源码, 'const 手机邀约队列', 'function 读赴约条'), ['排队手机邀约']);
  let 活动妻 = '';
  let 放行101;
  const 门 = new Promise(resolve => {
    放行101 = resolve;
  });
  const 结果 = [];
  const first = 排队手机邀约('chat-a', 1, async () => {
    await 门;
    if (!活动妻) {
      活动妻 = '101';
      结果.push('101接受');
    }
  });
  const second = 排队手机邀约('chat-a', 1, async () => {
    if (!活动妻) {
      活动妻 = '102';
      结果.push('102接受');
    } else 结果.push('102拒绝');
  });
  放行101();
  await Promise.all([first, second]);
  assert.deepEqual(结果, ['101接受', '102拒绝']);
  assert.equal(活动妻, '101');

  let 放行旧档;
  const 旧档门 = new Promise(resolve => {
    放行旧档 = resolve;
  });
  const 跨档顺序 = [];
  const oldChat = 排队手机邀约('chat-old', 1, async () => {
    跨档顺序.push('旧档开始');
    await 旧档门;
    跨档顺序.push('旧档结束');
  });
  const newChat = 排队手机邀约('chat-new', 1, async () => {
    跨档顺序.push('新档完成');
  });
  await newChat;
  assert.deepEqual(跨档顺序, ['旧档开始', '新档完成'], '旧档等待 AI 不得阻塞新档邀约');
  放行旧档();
  await oldChat;

  let 放行旧世代;
  const 旧世代门 = new Promise(resolve => {
    放行旧世代 = resolve;
  });
  const 同聊跨世代 = [];
  const oldEpoch = 排队手机邀约('chat-same', 1, async () => {
    同聊跨世代.push('旧世代开始');
    await 旧世代门;
  });
  const newEpoch = 排队手机邀约('chat-same', 2, async () => {
    同聊跨世代.push('新世代完成');
  });
  await newEpoch;
  assert.deepEqual(同聊跨世代, ['旧世代开始', '新世代完成'], '同一聊天的旧分支不得阻塞新世代邀约');
  放行旧世代();
  await oldEpoch;

  assert.match(邀约段, /赴约提交/);
  assert.match(邀约段, /写库增量/);
  assert.match(邀约段, /赴约提交:\s*\{ m, 起楼: 回复楼, 至楼: 回复楼 \+ 2 \}/);
  assert.doesNotMatch(邀约段, /insertOrAssignVariables\(\{\s*_赴约/);
  const 增量写 = 截源(数据层源码, 'async function 写库增量(', 'function 赴约仍活动');
  assert.match(增量写, /_赴约/);
});
