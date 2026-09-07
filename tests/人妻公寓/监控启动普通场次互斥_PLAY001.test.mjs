/* eslint-disable import-x/no-nodejs-modules -- Node-only PLAY-001 state and production-listener regression. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';
import * as ts from 'typescript';
import { 填入本版周线完成夹具 } from './不再留门.fixture.mjs';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;

const 生产目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url);
const 生产require = createRequire(new URL('录像带V4状态.ts', 生产目录));
const { Schema } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 结算成功现场楼, 结算性爱突然离场 } = 生产require('./玩家资源系统.ts');
const mvuIO = 生产require('./mvuIO.ts');
const 时间线 = 生产require('./时间线切换协调.ts');
const 时间门 = 生产require('./时间事务写入门.ts');
const 场景事务 = 生产require('./场景剧情事务.ts');
const { 读取医院内容策略 } = 生产require('./生产系统.ts');

function 编译(源码) {
  return ts.transpileModule(源码, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

// The optional source paths are only for running the same assertions against the preserved pre-fix source.
const 状态源码 = readFileSync(process.env.PLAY001_STATE_SOURCE ?? new URL('录像带V4状态.ts', 生产目录), 'utf8');
const 状态模块 = { exports: {} };
Function('require', 'module', 'exports', 编译(状态源码))(生产require, 状态模块, 状态模块.exports);
const {
  录像带V4周小满承接完成ID,
  录像带V4周小满母带封存键,
  录像带V4微信消息键,
  登记购买录像带V4,
  使用录像带V4,
  赠送录像带V4贞操锁,
  同步录像带V4微信收据,
  准备录像带V4监控,
  安全中断录像带V4,
  规划录像带V4操作,
  提交录像带V4操作,
} = 状态模块.exports;

function 就绪档() {
  const data = Schema.parse({ 户: { 101: {}, 102: {}, 202: {} } });
  data.户['101'].妻.当前阶段 = 3;
  data.户['102'].妻.当前阶段 = 5;
  data.户['202'].妻.当前阶段 = 5;
  data.系统._第二机位.阶段 = '已完成';
  data.系统._已完成特殊场景.push('第二机位', 录像带V4周小满承接完成ID);
  data.系统._特殊场景前置.push('录像带结局:沈母带封存', 录像带V4周小满母带封存键);
  填入本版周线完成夹具(data);
  assert.equal(登记购买录像带V4(data).成功, true);
  data.背包.push('录像带');
  assert.equal(使用录像带V4(data).成功, true);
  for (const [房间, 时段] of [['102', 59], ['202', 60]]) {
    data.背包.push('男用贞操带');
    assert.equal(赠送录像带V4贞操锁(data, 房间, 时段).成功, true);
    data.背包.splice(data.背包.indexOf('男用贞操带'), 1);
  }
  data.系统._绝对时段 = 78;
  const k = 录像带V4微信消息键;
  const 凭据 = [
    [k['102'].戴锁, '102'], [k['102'].同意, '102'],
    [k['202'].戴锁, '202'], [k['202'].同意, '202'], [k.联合出发, '202'],
  ].map(([键, 会话], i) => ({ 键, 会话, 楼: i + 1, 时: 100 + i, 发: '对方', 文: 键 }));
  assert.equal(同步录像带V4微信收据(data, 凭据).成功, true);
  assert.equal(data.系统._录像带V4.微信.监控就绪, true);
  return data;
}

function 建普通场次(data, 状态 = '进行中') {
  const 旧data = structuredClone(data);
  // Exercise the real ledger producer using already parsed, neutral input; no model or narrative generation.
  const 结果 = 结算成功现场楼(data, 旧data, {
    场景: '101', 楼层: 20, 行动: '继续当前互动', 正文: '当前回合已完成。', 本楼事件: '',
    妻在场: ['101'], 实际尺度: { 101: 3 },
    尺度判定: { 101: { 许可: 3, 请求: 3, 实际: 3, 结果: '成功' } },
    资源计费: true,
  });
  assert.equal(结果.性爱开始, true, '必须由玩家资源系统创建普通账本');
  assert.equal(data.系统._性爱场景.状态, '进行中');
  assert.ok(data.系统._性爱场景.场次标识);
  assert.ok(data.系统._性爱场景.参与者['101']);
  if (状态 === '收尾中') data.系统._性爱场景.状态 = 状态;
  return data;
}

function 拒绝且原样(data, id = 'play001-new-scene') {
  const 原 = structuredClone(data);
  const 结果 = 准备录像带V4监控(data, id);
  assert.equal(结果.成功, false, '普通场次占用时必须拒绝新监控');
  assert.equal(结果.变动, false);
  assert.deepEqual(data, 原, '拒绝不得消耗背包、覆盖场次/特殊槽或改变凭据与资源');
  return 结果;
}

function 已中断档(原因) {
  const data = 就绪档();
  assert.equal(准备录像带V4监控(data, 'play001-interrupted').成功, true);
  const 计划 = 规划录像带V4操作(data, { 操作标识: 'play001-beat1', 类型: '开始' }).计划;
  assert.equal(提交录像带V4操作(data, 计划).成功, true);
  assert.equal(安全中断录像带V4(data, 原因).成功, true);
  assert.equal(data.背包.filter(id => id === '录像带').length, 1);
  return data;
}

const index源码 = readFileSync(process.env.PLAY001_INDEX_SOURCE ?? new URL('index.ts', 生产目录), 'utf8');
const indexAST = ts.createSourceFile('index.ts', index源码, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const 所需函数 = new Set(['安全操作', '要求当前地点', '新录像带V4场次标识']);
const 函数源码 = new Map();
let 启动监听器源码 = '';
function 提取(node) {
  if (ts.isFunctionDeclaration(node) && 所需函数.has(node.name?.text)) 函数源码.set(node.name.text, node.getText(indexAST));
  if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
    const call = node.expression;
    if (call.expression.getText(indexAST) === 'eventOn' && ts.isStringLiteral(call.arguments[0]) &&
        call.arguments[0].text === '人妻公寓:启动录像带V4监控') 启动监听器源码 = node.getText(indexAST);
  }
  ts.forEachChild(node, 提取);
}
提取(indexAST);
assert.equal(函数源码.size, 所需函数.size, '必须提取生产安全壳及地点校验');
assert.ok(启动监听器源码, '必须提取实际 index 启动监听器');
const 启动装配源码 = 编译([...函数源码.values(), 启动监听器源码].join('\n'));

function 装配启动(data, { 写入失败 = false } = {}) {
  let 真值 = structuredClone(data);
  const vars = { _场景: { 房间id: '302' } };
  const 事件 = [];
  const 生成入口 = [];
  let 写入次数 = 0;
  let 保护次数 = 0;
  let 启动;
  globalThis.SillyTavern = { chat: [{}], getCurrentChatId: () => 'play001-chat' };
  globalThis.getVariables = () => vars;
  globalThis.updateVariablesWith = (更新, 选项) => {
    assert.equal(选项.type, 'chat');
    return 更新(vars);
  };
  globalThis.getLastMessageId = () => 0;
  // Only the external host storage boundary is simulated. Reads and writes use the real mvuIO implementation.
  globalThis.Mvu = {
    getMvuData: () => ({ stat_data: structuredClone(真值) }),
    replaceMvuData: async raw => {
      写入次数 += 1;
      if (写入失败) throw new Error('PLAY001 simulated host write failure');
      真值 = structuredClone(raw.stat_data);
    },
  };
  const deps = {
    ...mvuIO, ...时间线, ...时间门, ...场景事务,
    户静态表, 读取医院内容策略, 准备录像带V4监控,
    _时间推进中: false,
    当前聊天ID: () => SillyTavern.getCurrentChatId(),
    读场景: () => vars._场景,
    回合进行中: () => false,
    前台生成租约持有中: () => false,
    eventOn: (名称, fn) => {
      assert.equal(名称, '人妻公寓:启动录像带V4监控');
      启动 = fn;
    },
    eventEmit: (...args) => 事件.push(args),
    捕获保护快照: () => { 保护次数 += 1; },
    // Stop at the generation boundary. This suite covers entry/commit, not the isolated model transaction.
    执行录像带V4操作: async (_raw, _data, 仍有效, 输入) => {
      assert.equal(仍有效(), true);
      生成入口.push(输入);
      return true;
    },
    console: { warn() {}, error() {} },
  };
  Function(...Object.keys(deps), 启动装配源码)(...Object.values(deps));
  return {
    启动: () => 启动(), 事件, 生成入口, vars,
    读: () => structuredClone(真值),
    get 写入次数() { return 写入次数; },
    get 保护次数() { return 保护次数; },
    async 更新(变更) {
      const { raw, data: 候选 } = mvuIO.读取最近有效();
      变更(候选);
      await mvuIO.脚本写入(raw, 候选, { 记录成长: false, 当前绝对时段: 候选.系统._绝对时段 });
    },
  };
}

test('PLAY001 空闲入场只消耗一盘录像带并占用唯一特殊槽', () => {
  const data = 就绪档();
  data.背包.push('录像带', '其他道具');
  const 普通 = structuredClone(data.系统._性爱场景);
  assert.equal(准备录像带V4监控(data, 'play001-idle').成功, true);
  assert.equal(data.背包.filter(id => id === '录像带').length, 1);
  assert.equal(data.背包.includes('其他道具'), true);
  assert.equal(data.系统._特殊场景.id, '录像带V4');
  assert.equal(data.系统._录像带V4.场景.场次标识, 'play001-idle');
  assert.deepEqual(data.系统._性爱场景, 普通);
});

for (const 状态 of ['进行中', '收尾中']) {
  test(`PLAY001 普通${状态}通过真实账本建档后拒绝新启动，全部状态保持`, () => {
    const data = 建普通场次(就绪档(), 状态);
    const 结果 = 拒绝且原样(data);
    assert.match(结果.提示, /亲密|普通场次|性爱/);
    assert.equal(data.系统._录像带V4.微信.监控就绪, true, '筹备凭据继续有效');
  });
}

test('PLAY001 观看中同ID幂等早返回，即使恢复档另有普通场次也不重新消费', () => {
  const data = 就绪档();
  assert.equal(准备录像带V4监控(data, 'play001-same-id').成功, true);
  data.系统._性爱场景 = 建普通场次(就绪档()).系统._性爱场景;
  const 原 = structuredClone(data);
  const 重试 = 准备录像带V4监控(data, 'play001-same-id');
  assert.equal(重试.成功, true);
  assert.equal(重试.变动, false);
  assert.deepEqual(data, 原);
});

test('PLAY001 观看中别ID仍拒绝，不能覆盖原场次', () => {
  const data = 就绪档();
  assert.equal(准备录像带V4监控(data, 'play001-existing').成功, true);
  拒绝且原样(data, 'play001-replacement');
});

test('PLAY001 旧资格门保持：未使用、微信不足、非法ID、道具缺失、其他特殊槽', () => {
  for (const [变更, id] of [
    [d => { d.系统._录像带V4.录像带已使用 = false; }, 'play001-legacy-used'],
    [d => { d.系统._录像带V4.微信.监控就绪 = false; }, 'play001-no-notice'],
    [() => {}, 'bad'],
    [d => { d.背包 = []; }, 'play001-no-tape'],
    [d => { d.系统._特殊场景.id = '其他场景'; }, 'play001-other-slot'],
  ]) {
    const data = 就绪档();
    变更(data);
    拒绝且原样(data, id);
  }
});

for (const [状态, 原因] of [['进行中', '玩家主动安全退出'], ['收尾中', '玩家取消当前监控']]) {
  test(`PLAY001 ${原因}后遇普通${状态}不得重开，带子与微信凭据完整保留`, () => {
    const data = 建普通场次(已中断档(原因), 状态);
    拒绝且原样(data, 'play001-restart-blocked');
    assert.equal(data.系统._录像带V4.场景.状态, '已安全中断');
    assert.equal(data.系统._录像带V4.场景.共享幕次, 1);
    assert.equal(data.系统._录像带V4.微信.监控就绪, true);
    assert.equal(data.背包.filter(id => id === '录像带').length, 1);
  });
}

test('PLAY001 普通场次真实结束后可重开中断监控，保留前置并从零幕开始', () => {
  const data = 建普通场次(已中断档());
  const 凭据 = structuredClone(data.系统._录像带V4.微信);
  assert.equal(结算性爱突然离场(data).成功, true);
  assert.equal(data.系统._性爱场景.状态, '空闲');
  assert.equal(准备录像带V4监控(data, 'play001-after-normal-end').成功, true);
  assert.equal(data.系统._录像带V4.场景.共享幕次, 0);
  assert.equal(data.系统._录像带V4.场景.场次标识, 'play001-after-normal-end');
  assert.equal(data.背包.includes('录像带'), false);
  assert.deepEqual(data.系统._录像带V4.微信, 凭据);
});

test('PLAY001 JSON回档与Schema重载保留普通占用，并继续拒绝启动', () => {
  const data = 建普通场次(就绪档(), '收尾中');
  const 恢复 = Schema.parse(JSON.parse(JSON.stringify(data)));
  assert.deepEqual(恢复.系统._性爱场景, data.系统._性爱场景);
  拒绝且原样(恢复, 'play001-restored');
});

test('PLAY001 Schema旧档补空的普通槽不误阻止已就绪监控', () => {
  const 旧档 = 就绪档();
  delete 旧档.系统._性爱场景;
  const 恢复 = Schema.parse(旧档);
  assert.equal(恢复.系统._性爱场景.状态, '空闲');
  assert.equal(准备录像带V4监控(恢复, 'play001-old-save').成功, true);
});

test('PLAY001 真实index启动监听器在真实MVU队列内复核前项新建的普通场次', async () => {
  const env = 装配启动(就绪档());
  const 前项 = mvuIO.排队MVU操作(() => env.更新(建普通场次));
  const 启动 = env.启动();
  await 前项;
  const 前项提交 = env.读();
  await 启动;
  assert.equal(env.写入次数, 1, '只有前项普通建账提交，不得再写入V4入场');
  assert.equal(env.保护次数, 0);
  assert.equal(env.生成入口.length, 0);
  assert.ok(env.事件.some(([名]) => 名 === '人妻公寓:回合失败'));
  assert.deepEqual(env.读(), 前项提交);
});

test('PLAY001 真实index普通收尾中拒绝，发送失败事件且零写入零生成', async () => {
  const data = 建普通场次(就绪档(), '收尾中');
  const env = 装配启动(data);
  await env.启动();
  assert.equal(env.写入次数, 0);
  assert.equal(env.生成入口.length, 0);
  assert.ok(env.事件.some(([名, 文]) => 名 === '人妻公寓:回合失败' && /亲密|普通场次|性爱/.test(文)));
  assert.deepEqual(env.读(), data);
});

test('PLAY001 真实index空闲入场正常提交一次，随后抵达第一幕生成入口', async () => {
  const env = 装配启动(就绪档());
  await env.启动();
  assert.equal(env.写入次数, 1);
  assert.equal(env.保护次数, 1);
  assert.equal(env.生成入口.length, 1);
  assert.equal(env.生成入口[0].类型, '开始');
  assert.equal(env.读().系统._特殊场景.id, '录像带V4');
  assert.equal(env.读().背包.includes('录像带'), false);
});

test('PLAY001 真实index重复点击串行后仅一次入场消费和生成', async () => {
  const env = 装配启动(就绪档());
  await Promise.all([env.启动(), env.启动()]);
  assert.equal(env.写入次数, 1);
  assert.equal(env.生成入口.length, 1);
  assert.equal(env.读().系统._录像带V4.场景.状态, '观看中');
});

test('PLAY001 真实index宿主写入失败不改变持久状态，也不进入生成', async () => {
  const data = 就绪档();
  const env = 装配启动(data, { 写入失败: true });
  await env.启动();
  assert.equal(env.写入次数, 1);
  assert.equal(env.保护次数, 0);
  assert.equal(env.生成入口.length, 0);
  assert.deepEqual(env.读(), data);
  assert.ok(env.事件.some(([名, 文]) => 名 === '人妻公寓:回合失败' && 文.includes('PLAY001 simulated host write failure')));
});

test('PLAY001 真实index排队后地点变化保持持久状态且不进入生成', async () => {
  const data = 就绪档();
  const env = 装配启动(data);
  const 前项 = mvuIO.排队MVU操作(() => { env.vars._场景.房间id = '101'; });
  const 启动 = env.启动();
  await Promise.all([前项, 启动]);
  assert.equal(env.写入次数, 0);
  assert.equal(env.生成入口.length, 0);
  assert.deepEqual(env.读(), data);
  assert.ok(env.事件.some(([名, 文]) => 名 === '人妻公寓:提示' && 文.includes('302')));
});

test('PLAY001 真实index排队期间切聊天取消，未取得新聊天状态或消费道具', async () => {
  const data = 就绪档();
  const env = 装配启动(data);
  const 前项 = mvuIO.排队MVU操作(() => { SillyTavern.getCurrentChatId = () => 'play001-other-chat'; });
  const 启动 = env.启动();
  await Promise.all([前项, 启动]);
  assert.equal(env.写入次数, 0);
  assert.equal(env.生成入口.length, 0);
  assert.deepEqual(env.读(), data);
  assert.ok(env.事件.some(([名, 文]) => 名 === '人妻公寓:回合失败' && 文.includes('分支已经变化')));
});
