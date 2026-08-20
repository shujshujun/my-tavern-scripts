/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

// `特殊场景系统` 只读取手机侧的纯摘要函数；Node 没有 webpack `?raw` loader，测试时拦截该无关模板依赖。
const Module = require('node:module');
const 原加载 = Module._load;
Module._load = function 测试加载(request, parent, isMain) {
  if (request === './手机系统' && String(parent?.filename ?? '').endsWith('特殊场景系统.ts')) {
    return { 取会场私聊摘要提示: () => '' };
  }
  if (String(request).endsWith('.json?raw')) return '{}';
  return 原加载.call(this, request, parent, isMain);
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  空特殊场景状态,
  打开静音会议筹备,
  启动静音会议,
  开始录像带首送,
  启动录像带,
  推进特殊场景,
  请求结束静音会议,
  特殊场景玩家行动前,
  选择静音会议散会名单,
} = require('../../src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts');
const { 结算隔离脚本成长 } = require('../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts');
Module._load = 原加载;
const indexSource = readFileSync('src/人妻公寓/脚本/游戏逻辑/index.ts', 'utf8');
const engineSource = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');
const meetingUiSource = readFileSync('src/人妻公寓/界面/客户端/composables/useMuteMeeting.ts', 'utf8');

function 建录像带状态(阶段) {
  const data = Schema.parse({
    户: { 102: 创建户节点(0), 202: 创建户节点(0) },
  });
  data.系统._特殊场景 = {
    ...空特殊场景状态(),
    id: '录像带',
    阶段,
    地点: '管理员室',
    参与妻: ['102', '202'],
    演出妻: ['102', '202'],
  };
  return data;
}

test('所有已实现特殊场景启动口都拒绝与普通亲密场景重叠', () => {
  const data = Schema.parse({ 户: { 102: 创建户节点(4), 202: 创建户节点(4) } });
  data.系统._性爱场景.状态 = '进行中';
  const 预期 = { 成功: false, 提示: '请先结束当前亲密场景，再启动特殊场景。' };

  assert.deepEqual(打开静音会议筹备(data, '管理员室'), 预期);
  assert.deepEqual(启动静音会议(data, ['102', '202'], '公共设施维修', '管理员室', 10), 预期);
  assert.deepEqual(开始录像带首送(data, '102', 10), 预期);
  assert.deepEqual(启动录像带(data, 10), 预期);
});

test('父亲电话未挂断时不能启动新的录像带或静音会议场景', () => {
  const data = Schema.parse({ 户: { 102: 创建户节点(0), 202: 创建户节点(0) } });
  data.户['102'].妻.当前阶段 = 4;
  data.户['202'].妻.当前阶段 = 4;
  data.系统._父亲通话.标识 = 'call-special-lock';
  data.系统._父亲通话.状态 = '通话中';
  const 提示 = '请先完成并挂断父亲电话，再启动特殊场景。';

  assert.deepEqual(打开静音会议筹备(data, '管理员室'), { 成功: false, 提示 });
  assert.deepEqual(启动静音会议(data, ['102', '202'], '公共设施维修', '管理员室', 10), { 成功: false, 提示 });
  assert.deepEqual(开始录像带首送(data, '102', 10), { 成功: false, 提示 });
  assert.deepEqual(启动录像带(data, 10), { 成功: false, 提示 });
});

test('静音会议脚本终审与界面共用 L4、遥控跳蛋和医院硬锁资格', () => {
  const 建候选 = () => {
    const data = Schema.parse({ 户: { 101: 创建户节点(0), 102: 创建户节点(0) }, 背包: ['静音会议'] });
    for (const 门牌 of ['101', '102']) {
      data.户[门牌].妻.当前阶段 = 4;
      data.户[门牌].妻.特殊 = ['遥控跳蛋'];
    }
    return data;
  };

  const 合法 = 建候选();
  assert.equal(打开静音会议筹备(合法, '管理员室').成功, true);
  assert.equal(启动静音会议(合法, ['101', '102'], '公共设施维修', '管理员室', 10).成功, true, '完整资格应能启动');

  for (const [说明, 修改] of [
    ['阶段不足', data => (data.户['101'].妻.当前阶段 = 3)],
    ['未装载遥控跳蛋', data => (data.户['101'].妻.特殊 = [])],
    ['医院硬锁', data => (data.户['101'].妻._生产.状态 = '住院中')],
  ]) {
    const data = 建候选();
    assert.equal(打开静音会议筹备(data, '管理员室').成功, true, `${说明}发生前应能进入筹备态`);
    修改(data); // 模拟筹备页打开后状态变化或陈旧 UI 提交
    const result = 启动静音会议(data, ['101', '102'], '公共设施维修', '管理员室', 10);
    assert.equal(result.成功, false, 说明);
    assert.equal(data.系统._特殊场景.阶段, '筹备', `${说明}不得从筹备态进入正式场景`);
    assert.equal(data.背包.includes('静音会议'), true, `${说明}不得消耗入场票`);
  }

  assert.match(meetingUiSource, /处于医院硬锁/, '界面候选必须提前禁用医院角色，不能等提交后才报资格变化');
});

test('录像带旧标签不能跨房间、跨拍推进或提前结算', () => {
  const data = 建录像带状态('等待202');
  const 原始 = structuredClone(data);

  推进特殊场景(data, '【特殊场景·录像带·202-3】这是旧时间线迟到的正文。');

  assert.deepEqual(data, 原始);
  assert.equal(data.系统._已完成特殊场景.includes('录像带'), false);
});

test('录像带只接受与当前阶段完全一致的房间和拍数', () => {
  const data = 建录像带状态('102-2');

  推进特殊场景(data, '【特殊场景·录像带·102-1】旧第一拍');
  assert.equal(data.系统._特殊场景.阶段, '102-2');

  推进特殊场景(data, '【特殊场景·录像带·202-2】错误房间');
  assert.equal(data.系统._特殊场景.阶段, '102-2');

  推进特殊场景(data, '【特殊场景·录像带·102-2】当前第二拍');
  assert.equal(data.系统._特殊场景.阶段, '102-3');
});

function 建静音会议收尾状态(堕落值, 余波 = false) {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 20 } });
  // 冷落从阶段2参与：阶段1的余波已不具冻结效力，静音会议冻结用例必须用合格妻。
  data.户['101'].妻.当前阶段 = 2;
  data.户['101'].妻.堕落值 = 堕落值;
  data.户['101'].妻._成长账 = { 上次有效成长钟楼: 5, 成长轮次: 0, 已结算冷落日: 0 };
  if (余波) {
    data.户['101'].妻._冷落余波 = {
      状态: '安抚中',
      触发钟楼: 6,
      需安抚楼: 6,
      已安抚楼: 1,
      上次安抚正文楼: 19,
    };
  }
  data.系统._特殊场景 = {
    ...空特殊场景状态(),
    id: '静音会议',
    阶段: '收尾',
    地点: '管理员室',
    参与妻: ['101'],
    演出妻: ['101'],
    当前拍: 15,
    议题: '公共设施维修',
  };
  return data;
}

test('静音会议收尾的普通与封顶奖励都刷新成长账', () => {
  for (const 初值 of [40, 100]) {
    const 基准 = 建静音会议收尾状态(初值);
    const data = structuredClone(基准);
    推进特殊场景(data, '【特殊场景·静音会议·收尾】');
    结算隔离脚本成长(基准, data);

    assert.equal(data.户['101'].妻.堕落值, Math.min(100, 初值 + 2));
    assert.equal(data.户['101'].妻._成长账.上次有效成长钟楼, 20);
    assert.equal(data.户['101'].妻._成长账.成长轮次, 1);
  }
});

test('静音会议收尾在冷落余波中冻结堕落且不伪刷新成长账', () => {
  const 基准 = 建静音会议收尾状态(40, true);
  const data = structuredClone(基准);
  推进特殊场景(data, '【特殊场景·静音会议·收尾】');
  结算隔离脚本成长(基准, data);

  assert.equal(data.户['101'].妻.堕落值, 40);
  assert.equal(data.户['101'].妻._成长账.上次有效成长钟楼, 5);
  assert.equal(data.户['101'].妻._成长账.成长轮次, 0);
});

test('主回合与原生兜底都在静音会议隔离分支结算脚本成长', () => {
  assert.match(engineSource, /if \(本轮静音会议\)[\s\S]{0,180}结算隔离脚本成长\(本轮结算基准, newStat\)/);
  assert.match(indexSource, /if \(本轮静音会议\)[\s\S]{0,180}结算隔离脚本成长\(成长基准, newData\)/);
});

test('录像带前置同样拒绝另一户和旧拍标签', () => {
  const data = Schema.parse({ 户: { 102: 创建户节点(0), 202: 创建户节点(0) } });
  data.系统._特殊场景 = {
    ...空特殊场景状态(),
    id: '录像带前置',
    阶段: '102-2',
    地点: '102',
    参与妻: ['102'],
    演出妻: ['102'],
  };

  推进特殊场景(data, '【特殊前置·录像带·202·2】另一户旧正文');
  assert.equal(data.系统._特殊场景.阶段, '102-2');
  assert.equal(data.系统._特殊场景前置.length, 0);

  推进特殊场景(data, '【特殊前置·录像带·102·1】本户旧第一拍');
  assert.equal(data.系统._特殊场景.阶段, '102-2');

  推进特殊场景(data, '【特殊前置·录像带·102·2】当前第二拍');
  assert.equal(data.系统._特殊场景.id, '');
  assert.deepEqual(data.系统._特殊场景前置, ['录像带:102']);
});

test('重选散会名单只替换第12拍，保留队列里的其他事件', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 102: 创建户节点(0) } });
  data.系统._特殊场景 = {
    ...空特殊场景状态(),
    id: '静音会议',
    阶段: '散会选择',
    地点: '管理员室',
    参与妻: ['101', '102'],
    演出妻: ['101', '102'],
    演出夫: ['101', '102'],
    当前拍: 12,
    议题: '公共设施维修',
  };
  data.系统._待发送事件 = '【其他事件】必须保留|【特殊场景·静音会议·12】旧名单提示|【尾部事件】也必须保留';

  const 结果 = 选择静音会议散会名单(data, ['102']);

  assert.equal(结果.成功, true);
  assert.match(data.系统._待发送事件, /【其他事件】必须保留/);
  assert.match(data.系统._待发送事件, /【尾部事件】也必须保留/);
  assert.equal((data.系统._待发送事件.match(/【特殊场景·静音会议·12】/g) ?? []).length, 1);
  assert.match(data.系统._待发送事件, /冻结会后妻：沈静仪/);
});

test('自由拍改为收尾时只移除本次自由拍，保留队列里的其他事件', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 102: 创建户节点(0) } });
  data.系统._特殊场景 = {
    ...空特殊场景状态(),
    id: '静音会议',
    阶段: '自由',
    地点: '管理员室',
    参与妻: ['101', '102'],
    演出妻: ['101'],
    会后妻: ['101'],
    当前拍: 15,
    自由循环次数: 2,
    议题: '公共设施维修',
  };
  data.系统._待发送事件 = '【其他事件】必须保留|【特殊场景·静音会议·自由·3】旧自由拍';

  const 结果 = 请求结束静音会议(data);

  assert.equal(结果.成功, true);
  assert.match(data.系统._待发送事件, /【其他事件】必须保留/);
  assert.doesNotMatch(data.系统._待发送事件, /【特殊场景·静音会议·自由·3】/);
  assert.match(data.系统._待发送事件, /【特殊场景·静音会议·收尾】/);
});

test('录像带与会议的原生等待阶段由统一许可门拒绝', () => {
  const 录像带 = 建录像带状态('等待102');
  assert.deepEqual(特殊场景玩家行动前(录像带), { 成功: false, 提示: '先操作桌上的监控瓷砖。' });
  assert.equal(录像带.系统._特殊场景.阶段, '等待102');
  assert.equal(录像带.系统._待发送事件, '');

  const 会议 = Schema.parse({});
  会议.系统._特殊场景 = {
    ...空特殊场景状态(),
    id: '静音会议',
    阶段: '筹备',
    地点: '管理员室',
  };
  assert.equal(特殊场景玩家行动前(会议).成功, false);
  assert.equal(会议.系统._特殊场景.阶段, '筹备');
});

test('录像带前置与正式录像带都严格校验当前地点，楼道/空地点不能绕过锁场', () => {
  const 前置 = Schema.parse({ 户: { 102: 创建户节点(0) } });
  前置.户['102'].妻.当前阶段 = 4;
  assert.equal(开始录像带首送(前置, '102', 10).成功, true);
  assert.equal(特殊场景玩家行动前(前置, null).成功, false);
  assert.equal(特殊场景玩家行动前(前置, '202').成功, false);
  assert.equal(特殊场景玩家行动前(前置, '102').成功, true);

  const 正式 = 建录像带状态('202-2');
  assert.equal(特殊场景玩家行动前(正式, null).成功, false);
  assert.equal(特殊场景玩家行动前(正式, '102').成功, false);
  assert.equal(特殊场景玩家行动前(正式, '管理员室').成功, true);
});

test('录像带合法固定拍通过原生许可门时只编译当前拍', () => {
  const data = 建录像带状态('202-2');

  assert.equal(特殊场景玩家行动前(data).成功, true);
  assert.match(data.系统._待发送事件, /【特殊场景·录像带·202-2】/);
  assert.doesNotMatch(data.系统._待发送事件, /【特殊场景·录像带·(?:102|202)-(?:1|3)】/);
});

test('原生特殊场景输入检查许可失败并停止本轮生成', () => {
  const promptStart = indexSource.lastIndexOf('tavern_events.CHAT_COMPLETION_PROMPT_READY');
  const updateStart = indexSource.lastIndexOf('Mvu.events.VARIABLE_UPDATE_ENDED');
  const prompt = indexSource.slice(promptStart, updateStart);
  const 原生门 = prompt.indexOf('if (data.系统._特殊场景.id)');
  const 调用点 = prompt.indexOf('特殊场景玩家行动前(data, 读场景().房间id)', 原生门);
  assert.ok(调用点 >= 0, '原生入口必须调用特殊场景许可门');
  const 许可段 = prompt.slice(Math.max(0, 调用点 - 160), 调用点 + 1_200);
  assert.match(许可段, /const\s+\S*结果\s*=\s*特殊场景玩家行动前\(data, 读场景\(\)\.房间id\)/);
  assert.match(许可段, /if\s*\(!\S*结果\.成功\)/);
  assert.match(许可段, /stopGeneration\(\)/);
  assert.match(许可段, /return/);
});

test('原生录像带许可拒绝即使 stop 失效也以墓碑清空迟到正文', () => {
  const promptStart = indexSource.lastIndexOf('tavern_events.CHAT_COMPLETION_PROMPT_READY');
  const updateStart = indexSource.lastIndexOf('Mvu.events.VARIABLE_UPDATE_ENDED');
  const prompt = indexSource.slice(promptStart, updateStart);
  const 原生门 = prompt.indexOf('if (data.系统._特殊场景.id)');
  const 拒绝段 = prompt.slice(原生门, prompt.indexOf('_静音会议原生基底 = _静音会议原生生成中', 原生门));
  const update = indexSource.slice(updateStart, indexSource.indexOf('tavern_events.GENERATION_STOPPED', updateStart));

  assert.match(拒绝段, /_静音会议原生因私聊阻断 = true/);
  assert.match(拒绝段, /_静音会议原生基底 = _\.cloneDeep\(data\)/);
  assert.match(拒绝段, /_静音会议原生预期助手楼层 = 楼层/);
  assert.doesNotMatch(拒绝段, /else\s*\{[\s\S]*?_isInAiCycle = false/);
  assert.match(update, /_静音会议原生因私聊阻断[\s\S]*?await 物理写回静音会议原生正文\('',/);
  assert.match(update, /_\.set\(新变量, 'stat_data', 静音会议基底\)/);
});
