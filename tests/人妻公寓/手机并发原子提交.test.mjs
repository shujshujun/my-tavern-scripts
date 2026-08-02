/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const 手机源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机系统.ts', import.meta.url), 'utf8');

function 截源(开始, 结束) {
  const 起 = 手机源.indexOf(开始);
  const 止 = 手机源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 手机源.slice(起, 止);
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
  assert.doesNotMatch(手机源, /async function 写库\(/);
  const 增量写 = 截源('async function 写库增量(', 'function 末楼');
  assert.match(增量写, /合并微信撤回状态/);
  assert.match(增量写, /活玩家标识/);

  const 渲染段 = 截源('function 渲染(', '// ── 约出来');
  assert.match(渲染段, /圈读到改/);
  assert.match(渲染段, /读到改/);
  assert.doesNotMatch(渲染段, /await 写库\(/);

  const 邀约段 = 截源('async function 约出来(', '// ── 姐妹群一拍');
  assert.match(邀约段, /写库增量/);
  assert.doesNotMatch(邀约段, /await 写库\(/);

  const 发送段 = 截源('async function 发消息(', '// ── 父亲来电');
  assert.match(发送段, /写库增量/);
  assert.doesNotMatch(发送段, /await 写库\(/);
});

test('邀约在第一次异步写之前占住同一会话，不能与发送或双击邀约并发', () => {
  const 邀约段 = 截源('async function 约出来(', '// ── 姐妹群一拍');
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
  assert.match(手机源, /const 正在输入会话\s*=\s*new Map<string, number>\(\)/);
  assert.match(手机源, /function 开始会话输入\(/);
  assert.match(手机源, /function 结束会话输入\(/);
  assert.match(手机源, /function 会话正在输入\(/);
  assert.doesNotMatch(手机源, /let 正在输入:\s*string \| null/);

  const 硬门 = 截源('export function 静音会议私聊回复生成中', 'function 会议手机渲染键');
  assert.match(硬门, /状态\.参与妻\.some\([^)]*会话正在输入/);

  const 计数片段 = 截源('const 正在输入会话', 'let 上次会议手机渲染键');
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
  const 摘要段 = 截源('const 会场私聊气口', 'export function 取会场私聊摘要提示');
  assert.match(摘要段, /排队MVU操作/);
  const 排队位 = 摘要段.indexOf('排队MVU操作');
  const 重读位 = 摘要段.indexOf('读取最近有效()', 排队位);
  const 合并位 = 摘要段.indexOf('会场私聊摘要[门牌号]', 重读位);
  assert.ok(重读位 > 排队位 && 合并位 > 重读位, '摘要必须在获得队列租约后重读并合并');
});

test('会场摘要冻结聊天与会议身份，排队期间切档或换场后旧气口失效', () => {
  const 摘要段 = 截源('interface 会场私聊摘要租约', 'export function 取会场私聊摘要提示');
  assert.match(摘要段, /聊天ID/);
  assert.match(摘要段, /启动楼层/);
  assert.match(摘要段, /会议签名/);
  assert.match(摘要段, /时间线世代/);
  assert.match(摘要段, /登记MVU提交校验/);

  const helper段 = 截源('interface 会场私聊摘要租约', 'function 判会场私聊气口');
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

test('发送与邀约的首次渲染都在获锁后的 try/finally 内', () => {
  for (const 段 of [
    截源('async function 约出来(', '// ── 姐妹群一拍'),
    截源('async function 发消息(', 'async function 执行发消息'),
  ]) {
    const 获锁 = 段.indexOf('开始会话输入');
    const try位 = 段.indexOf('try', 获锁);
    const 首次渲染 = 段.indexOf('渲染()', 获锁);
    const finally位 = 段.indexOf('finally', try位);
    const 解锁 = 段.indexOf('结束会话输入', finally位);
    assert.ok(获锁 >= 0 && try位 > 获锁 && 首次渲染 > try位 && finally位 > 首次渲染 && 解锁 > finally位);
  }
});

test('发送入口冻结聊天ID与原时间线，切档后不得重捕获新档继续回复', () => {
  const 发送段 = 截源('async function 发消息(', '// ── 父亲来电');
  assert.match(发送段, /const 发送聊天ID\s*=\s*当前聊天ID\(\)/);
  assert.match(发送段, /创建手机时间线租约\(发送聊天ID/);
  assert.match(发送段, /写库增量\([\s\S]*手机发送租约仍有效\(发送租约\)/);
  assert.match(发送段, /手动群接话\('群',[\s\S]*发送租约\)/);
  assert.match(发送段, /写会场私聊摘要\([\s\S]*发送租约\.会场摘要租约/);
  assert.doesNotMatch(发送段, /const 回复聊天ID\s*=\s*当前聊天ID\(\)/);

  const { 创建手机时间线租约, 手机时间线租约仍有效 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts');
  const 原消息 = [{ mes: '同样外观', is_user: false, swipe_id: 0 }];
  const 新档同貌消息 = [{ mes: '同样外观', is_user: false, swipe_id: 0 }];
  const 租约 = 创建手机时间线租约('chat-a', 0, 原消息, 2);
  assert.ok(租约);
  assert.equal(手机时间线租约仍有效(租约, 'chat-b', 原消息, 2), false, '仅切聊天ID即必须失效');
  assert.equal(手机时间线租约仍有效(租约, 'chat-a', 新档同貌消息, 2), false, '同貌新档也不能通过引用锚');
});

test('跨妻邀约全局串行，接受回复与单例赴约在同一变量回调 CAS', async () => {
  const 邀约段 = 截源('const 手机邀约队列', '// ── 姐妹群一拍');
  const { 排队手机邀约 } = 执行TS片段(截源('const 手机邀约队列', 'function 读赴约条'), ['排队手机邀约']);
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
  const 增量写 = 截源('async function 写库增量(', 'function 末楼');
  assert.match(增量写, /_赴约/);
});
