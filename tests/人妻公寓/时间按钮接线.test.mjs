/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
// `schema.json` 与 `schema.ts` 同名；Node 测试需像 webpack 一样优先解析 TypeScript。
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');

const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const Index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 时钟源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts', import.meta.url), 'utf8');
const { Schema, 当前MVU数据版本 } = require('../../src/人妻公寓/schema.ts');
const { 执行时间推进事务 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');

globalThis.getVariables = () => ({
  _场景: { 房间id: '管理员室' },
  _粘滞: null,
  _赴约: null,
});

function 截段(源, 开始标记, 结束标记) {
  const 开始 = 源.indexOf(开始标记);
  assert.notEqual(开始, -1, `缺少开始标记：${开始标记}`);
  const 结束 = 源.indexOf(结束标记, 开始);
  assert.notEqual(结束, -1, `缺少结束标记：${结束标记}`);
  return 源.slice(开始, 结束);
}

function 建时间数据(绝对时段 = 0) {
  return Schema.parse({
    系统: {
      _数据版本: 当前MVU数据版本,
      _绝对时段: 绝对时段,
      _序章完成: true,
      _待发送事件: '',
    },
  });
}

function 收集业务源码(目录) {
  const 文本 = [];
  for (const 项 of readdirSync(目录, { withFileTypes: true })) {
    const 路径 = join(目录, 项.name);
    if (项.isDirectory()) 文本.push(...收集业务源码(路径));
    else if (['.ts', '.vue'].includes(extname(项.name))) 文本.push(readFileSync(路径, 'utf8'));
  }
  return 文本;
}

test('管理员室与302只提供小憩和睡眠，不再显示重复的纯推进按钮', () => {
  const 三零二动作 = 截段(App源, "if (id === '302')", '\n  // 管理员室世界时间');
  const 管理员室动作 = 截段(App源, "if (id === '管理员室')", '\n  // 公共区');
  const 发起函数 = 截段(App源, 'function 发起时间推进', '\nfunction 房间动作');

  assert.match(三零二动作, /文案: '睡到次日早晨'[\s\S]*?发起时间推进\('睡到次日早晨'\)/);
  assert.match(三零二动作, /文案: '小憩（推进一时段）'[\s\S]*?发起时间推进\('小憩'\)/);
  assert.doesNotMatch(三零二动作, /文案: '推进一时段'|发起时间推进\('推进一时段'\)/);
  assert.match(管理员室动作, /文案: '小憩（推进一时段）'[\s\S]*?发起时间推进\('小憩'\)/);
  assert.doesNotMatch(管理员室动作, /文案: '推进一时段'|发起时间推进\('推进一时段'\)/);
  assert.match(管理员室动作, /文案: '睡到次日早晨'[\s\S]*?发起时间推进\('睡到次日早晨'\)/);
  assert.match(发起函数, /人妻公寓:睡到次日早晨'[\s\S]*?人妻公寓:推进时段'/);
  assert.match(发起函数, /方式,[\s\S]*?预期绝对时段: 绝对时段\.value/);
  assert.match(发起函数, /发送中\.value = true/);
  assert.doesNotMatch(管理员室动作, /_上次杀时间楼层|每真实楼层一次/);
});

test('时间按钮在无正文事务期间锁住界面，并由后端结束信号在失败时解锁', () => {
  assert.match(Index源, /\.finally\(\(\) => \{[\s\S]{0,160}eventEmit\('人妻公寓:时间推进结束', 已提交\)/);
  assert.match(App源, /eventOn\('人妻公寓:时间推进结束',[\s\S]{0,180}发送中\.value = false/);
  assert.match(App源, /<textarea[\s\S]{0,180}:disabled="发送中 \|\| 由头写入中"/);
});

test('成功回合必须拉取新时钟并完成响应式刷新后才解除时间按钮锁', () => {
  const 完成段 = 截段(App源, "eventOn('人妻公寓:回合完成'", "eventOn('人妻公寓:隔离事件完成'");
  const 拉取位置 = 完成段.indexOf('await Promise.resolve');
  const 刷新位置 = 完成段.indexOf('await nextTick()');
  const 解锁位置 = 完成段.indexOf('发送中.value = false');

  assert.ok(拉取位置 >= 0, '回合完成缺少可等待的 store.pull');
  assert.ok(刷新位置 > 拉取位置, 'store.pull 后必须等待 Vue 刷新');
  assert.ok(解锁位置 > 刷新位置, '不得在新绝对时段进入界面前解除按钮锁');
  assert.match(完成段, /try \{[\s\S]*?\} finally \{\s*发送中\.value = false;\s*运行阶段\.value = '';/);
});

test('时间事务失败按键是否原本存在精确恢复聊天结构', () => {
  const 事务段 = 截段(Index源, 'const 推进前聊天 =', "eventOn('人妻公寓:推进时段'");

  assert.match(事务段, /捕获精确聊天快照\(旧变量, 时间撤销恢复聊天键\)/);
  assert.match(事务段, /捕获精确聊天快照\(旧变量, 时间推进写入聊天键\)/);
  assert.match(事务段, /恢复时间聊天备份\(聊天事务备份, 时间推进写入聊天键, 预期聊天ID\)/);
});

test('两个事件同时出现在 listener 清理名单和监听器中，后端强制映射方式而不信任载荷方式', () => {
  const 清理名单 = 截段(Index源, 'for (const 名 of [', '  ]) {\n    eventClearEvent(名);');
  const 接线段 = 截段(Index源, 'type 时间推进载荷', '\n  // 地点只负责亮出 STORY 按钮');

  for (const 事件名 of ['人妻公寓:推进时段', '人妻公寓:睡到次日早晨']) {
    assert.match(清理名单, new RegExp(`'${事件名}'`));
    assert.equal((接线段.match(new RegExp(`eventOn\\('${事件名}'`, 'g')) ?? []).length, 1);
  }
  assert.match(接线段, /eventOn\('人妻公寓:推进时段',[\s\S]{0,120}处理时间推进\('推进一时段', 载荷\)/);
  assert.match(接线段, /eventOn\('人妻公寓:睡到次日早晨',[\s\S]{0,120}处理时间推进\('睡到次日早晨', 载荷\)/);
  assert.match(接线段, /type 时间推进载荷 = \{ 预期绝对时段\?: number \}/);
  assert.doesNotMatch(接线段, /载荷\?\.方式|载荷\.方式/);
});

test('入口硬门把五种时间动作限制在各自合法地点', () => {
  const 接线段 = 截段(Index源, 'type 时间推进载荷', '\n  // 地点只负责亮出 STORY 按钮');
  const 处理段 = 接线段.slice(接线段.indexOf('function 处理时间推进'));
  const 执行位置 = 处理段.indexOf('执行时间推进事务');
  const 切场景位置 = 处理段.indexOf('写时间结束场景(vars');
  assert.ok(执行位置 > 0 && 切场景位置 > 0);

  const 门们 = [
    "方式 === '推进一时段' && 当前房间 !== '管理员室'",
    "方式 === '睡到次日早晨' && 当前房间 !== '管理员室' && 当前房间 !== '302'",
    "方式 === '小憩' && 当前房间 !== '管理员室' && 当前房间 !== '302'",
    "方式 === '晨跑' && 当前房间 !== '晨跑公园'",
    "方式 === '健身' && 当前房间 !== '健身房'",
    '_isInAiCycle || 回合进行中() || 脚本写入中 || 隔离事件进行中()',
    'data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0',
    'data.系统._父亲通话.标识 || data.系统._父亲通话.状态',
    "_.get(getVariables({ type: 'chat' }), '_侦探.偷窥待选')",
    '待演 && !是单一时间事件',
    '预期绝对时段 !== data.系统._绝对时段',
  ];
  for (const 门 of 门们) {
    const 位置 = 处理段.indexOf(门);
    assert.ok(位置 >= 0, `缺少时间推进硬门：${门}`);
    assert.ok(位置 < 切场景位置, `硬门必须先于聊天场景清理：${门}`);
    assert.ok(位置 < 执行位置, `硬门必须先于时间事务：${门}`);
  }
  assert.match(
    接线段,
    /const 时间结束房间: 时间推进地点 =\s*方式 === '推进一时段'[\s\S]{0,80}\? '管理员室'[\s\S]{0,160}当前房间 === '晨跑公园'[\s\S]{0,80}当前房间 === '健身房'/,
  );
  assert.match(接线段, /function 写时间结束场景[\s\S]{0,180}房间id: 房间/);
  assert.match(处理段, /写时间结束场景\(vars, 时间结束房间, 当前消息楼\)/);
  assert.match(接线段, /执行时间推进事务\(候选,[\s\S]{0,180}当前地点: 时间结束房间/);
  assert.match(接线段, /if \(!Number\.isInteger\(预期绝对时段\) \|\| 预期绝对时段 !== data\.系统\._绝对时段\) \{/);
});

test('中央事务拒绝陈旧水位、伪造方式和未演强制事件，失败时原数据不变', () => {
  const 陈旧 = 建时间数据(5);
  const 陈旧原值 = structuredClone(陈旧);
  const 陈旧结果 = 执行时间推进事务(陈旧, {
    方式: '推进一时段',
    预期绝对时段: 4,
    当前消息楼: 10,
    当前地点: '管理员室',
  });
  assert.equal(陈旧结果.成功, false);
  assert.deepEqual(陈旧, 陈旧原值);

  const 伪造 = 建时间数据(5);
  const 伪造原值 = structuredClone(伪造);
  const 伪造结果 = 执行时间推进事务(伪造, {
    方式: '跳过一周',
    预期绝对时段: 5,
    当前消息楼: 10,
    当前地点: '管理员室',
  });
  assert.equal(伪造结果.成功, false);
  assert.deepEqual(伪造, 伪造原值);

  const 未完 = 建时间数据(5);
  未完.系统._待发送事件 = '【新住户】还有一幕没有演完';
  const 未完原值 = structuredClone(未完);
  const 未完结果 = 执行时间推进事务(未完, {
    方式: '推进一时段',
    预期绝对时段: 5,
    当前消息楼: 10,
    当前地点: '管理员室',
  });
  assert.equal(未完结果.成功, false);
  assert.deepEqual(未完, 未完原值);
});

test('两种后台方式产生各自的推进跨度和强制事件文案', () => {
  const 推进 = 建时间数据(1);
  const 推进结果 = 执行时间推进事务(推进, {
    方式: '推进一时段',
    预期绝对时段: 1,
    当前消息楼: 10,
    当前地点: '管理员室',
  });
  assert.equal(推进结果.成功, true);
  assert.equal(推进.系统._绝对时段, 2);
  assert.equal(推进结果.推进时段数, 1);
  assert.match(推进.系统._待发送事件, /^【时间流逝】/);
  assert.match(推进.系统._待发送事件, /钟向前走过一个时段/);
  assert.doesNotMatch(推进.系统._待发送事件, /睡下/);

  const 睡眠 = 建时间数据(1);
  const 睡眠结果 = 执行时间推进事务(睡眠, {
    方式: '睡到次日早晨',
    预期绝对时段: 1,
    当前消息楼: 10,
    当前地点: '管理员室',
  });
  assert.equal(睡眠结果.成功, true);
  assert.equal(睡眠.系统._绝对时段, 6);
  assert.equal(睡眠结果.推进时段数, 5);
  assert.match(睡眠.系统._待发送事件, /^【时间流逝】/);
  assert.match(睡眠.系统._待发送事件, /在管理员室的值班床睡下,一直休息到次日早晨/);
  assert.match(睡眠.系统._待发送事件, /醒来后仍在管理员室/);
});

test('旧杀时间事件和绕过中央事务的旧时钟导出已从业务源码移除', () => {
  const 源码根 = fileURLToPath(new URL('../../src/人妻公寓', import.meta.url));
  const 全部业务源码 = 收集业务源码(源码根).join('\n');
  assert.doesNotMatch(全部业务源码, /人妻公寓:杀时间/);
  assert.doesNotMatch(时钟源, /export function 杀时间|export const 杀时间/);
});
