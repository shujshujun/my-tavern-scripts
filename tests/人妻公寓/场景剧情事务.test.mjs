/* eslint-disable import-x/no-named-as-default-member, import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const 读 = path => readFileSync(path, 'utf8');
const 源码 = 读('src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const index源码 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
const 回合源码 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
const 快照源码 = 读('src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const App源码 = 读('src/人妻公寓/界面/客户端/App.vue');

function 载入纯函数() {
  const js = ts.transpileModule(源码, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', js)(module, module.exports);
  return module.exports;
}

function 空事务() {
  return {
    id: '',
    标题: '',
    目标场景: '',
    行动: '',
    内容: '',
    触发绝对时段: -1,
    触发楼层: -1,
    请求世代: 0,
    状态: '',
  };
}

function 建数据() {
  return {
    系统: {
      _绝对时段: 17,
      _场景剧情序号: 0,
      _待发送事件: '',
      _场景剧情事务: 空事务(),
      _特殊场景: { id: '' },
      _荣耀洞拍: -1,
    },
  };
}

test('同一业务产生的多条导演指令绑定同一事务，只作为一张队首票演出', () => {
  const { 激活新增场景剧情, 读取队首场景剧情, 解析场景剧情元数据 } = 载入纯函数();
  const data = 建数据();
  const result = 激活新增场景剧情(data, {
    标题: '夏乔的垃圾房发现',
    目标场景: '垃圾房',
    行动: '翻查101垃圾袋',
    触发楼层: 33,
    内容: '【事件关联妻:101】【翻垃圾的收获】找到碎纸|【阶段线路演出:101:2:0:x:y】承接关系节点',
  });

  assert.equal(result.成功, true);
  const txn = result.事务;
  assert.equal(txn.目标场景, '垃圾房');
  assert.equal(txn.请求世代, 1);
  const head = 读取队首场景剧情(data.系统._待发送事件);
  assert.ok(head);
  assert.equal(head.id, txn.id);
  assert.equal(head.项数, 2);
  assert.equal(head.总项数, 2);
  assert.equal(head.标题, '夏乔的垃圾房发现');
  for (const item of data.系统._待发送事件.split('|')) {
    assert.equal(解析场景剧情元数据(item)?.id, txn.id);
  }
});

test('活动票和同场等待票阻止新剧情；远处等待票不打断当前互动并在本地剧情后恢复', () => {
  const { 激活新增场景剧情, 追加等待场景剧情, 读取队首场景剧情, 提交场景剧情成功 } = 载入纯函数();
  const active = 建数据();
  assert.equal(
    激活新增场景剧情(active, {
      标题: '第一幕',
      目标场景: '101',
      行动: '第一幕',
      触发楼层: 1,
      内容: '【首穿】第一幕',
    }).成功,
    true,
  );
  assert.equal(
    激活新增场景剧情(active, {
      标题: '第二幕',
      目标场景: '101',
      行动: '第二幕',
      触发楼层: 2,
      内容: '【心照不宣】第二幕',
    }).成功,
    false,
  );

  const sameScene = 建数据();
  追加等待场景剧情(sameScene, '【心照不宣】旧剧情', '101', '旧剧情');
  assert.equal(
    激活新增场景剧情(sameScene, {
      标题: '送礼回应',
      目标场景: '101',
      行动: '送礼',
      触发楼层: 3,
      内容: '【上一动作·送礼回响】回应',
    }).成功,
    false,
  );

  const remote = 建数据();
  追加等待场景剧情(remote, '【新住户】202搬入', '楼梯间', '202新住户搬入');
  const local = 激活新增场景剧情(remote, {
    标题: '送礼回应',
    目标场景: '101',
    行动: '送礼',
    触发楼层: 4,
    内容: '【上一动作·送礼回响】回应',
  });
  assert.equal(local.成功, true);
  assert.equal(读取队首场景剧情(remote.系统._待发送事件)?.标题, '送礼回应');
  assert.equal(提交场景剧情成功(remote, local.事务.内容, local.事务.id, local.事务.请求世代), true);
  assert.equal(读取队首场景剧情(remote.系统._待发送事件)?.标题, '202新住户搬入');
});

test('等待票阻塞语义统一：同场与未知旧档阻塞，远处结构票不阻塞', () => {
  const { 包装场景剧情内容, 读取队首场景剧情, 等待场景剧情阻塞当前场景 } = 载入纯函数();
  const local = 读取队首场景剧情(
    包装场景剧情内容('【首穿】本地剧情', { id: 'local', 标题: '本地剧情', 目标场景: '101' }),
  );
  const remote = 读取队首场景剧情(
    包装场景剧情内容('【新住户】远处剧情', { id: 'remote', 标题: '远处剧情', 目标场景: '楼梯间' }),
  );
  const unknown = 读取队首场景剧情('【上一动作·送礼回响】旧档没有可靠地点');

  assert.equal(等待场景剧情阻塞当前场景(local, '101'), true);
  assert.equal(等待场景剧情阻塞当前场景(remote, '101'), false);
  assert.equal(等待场景剧情阻塞当前场景(unknown, '101'), true);
});

test('玩家标题不暴露角色绑定、线路票据和内部场景标记', () => {
  const { 场景剧情可见标题, 读取队首场景剧情, 包装场景剧情内容 } = 载入纯函数();
  const wrapped = 包装场景剧情内容('【事件在场妻:101】【首穿】第一次换衣', {
    id: 'A',
    标题: '夏乔第一次试穿',
    目标场景: '101',
  });
  assert.equal(读取队首场景剧情(wrapped)?.标题, '夏乔第一次试穿');
  assert.equal(场景剧情可见标题('【事件关联妻:101】【阶段线路演出:101:2:0:x:y】【翻垃圾的收获】碎纸'), '翻垃圾的收获');
  assert.doesNotMatch(读取队首场景剧情(wrapped).标题, /事件在场妻|阶段线路|场景剧情:v1/);
});

test('成功只消费当前事务，后续等待票原样保留且不在同楼混演', () => {
  const { 激活新增场景剧情, 追加等待场景剧情, 提交场景剧情成功, 读取队首场景剧情 } = 载入纯函数();
  const data = 建数据();
  const result = 激活新增场景剧情(data, {
    标题: '第一幕',
    目标场景: '101',
    行动: '第一幕行动',
    触发楼层: 10,
    内容: '【首穿】第一幕',
  });
  assert.equal(result.成功, true);
  const first = result.事务;
  追加等待场景剧情(data, '【心照不宣】第二幕', '101', '第二幕');

  assert.equal(提交场景剧情成功(data, first.内容, first.id, first.请求世代), true);
  assert.equal(data.系统._场景剧情事务.id, '');
  const next = 读取队首场景剧情(data.系统._待发送事件);
  assert.equal(next?.标题, '第二幕');
  assert.equal(next?.项数, 1);
});

test('失败重试只增加请求世代；旧请求不能提交或把新请求改回待重试', () => {
  const { 激活新增场景剧情, 准备重试场景剧情, 标记场景剧情待重试, 提交场景剧情成功 } = 载入纯函数();
  const data = 建数据();
  data.现金 = 120;
  const result = 激活新增场景剧情(data, {
    标题: '翻垃圾的收获',
    目标场景: '垃圾房',
    行动: '翻垃圾',
    触发楼层: 20,
    内容: '【翻垃圾的收获】找到线索',
  });
  assert.equal(result.成功, true);
  const firstGeneration = result.事务.请求世代;
  assert.equal(标记场景剧情待重试(data, result.事务.id, firstGeneration), true);

  const retry = 准备重试场景剧情(data, '垃圾房');
  assert.equal(retry.成功, true);
  assert.equal(data.现金, 120, '重试不能再次执行业务结算');
  assert.equal(retry.事务.请求世代, firstGeneration + 1);
  assert.equal(标记场景剧情待重试(data, retry.事务.id, firstGeneration), false, '旧请求不得覆盖新世代状态');
  assert.equal(提交场景剧情成功(data, retry.事务.内容, retry.事务.id, firstGeneration), false);
  assert.equal(提交场景剧情成功(data, retry.事务.内容, retry.事务.id, retry.事务.请求世代), true);
});

test('业务提交后失败、取消、刷新与回档都保留同一票；手工重试只增世代不重算业务', () => {
  const { 激活新增场景剧情, 准备重试场景剧情, 标记场景剧情待重试, 读取场景剧情状态, 读取队首场景剧情 } = 载入纯函数();
  const 触发前 = 建数据();
  const data = structuredClone(触发前);
  data.业务提交次数 = 1;
  const activated = 激活新增场景剧情(data, {
    标题: '已结算的送礼回应',
    目标场景: '101',
    行动: '等待她回应礼物',
    触发楼层: 30,
    内容: '【上一动作·送礼回响】她接过礼物。',
  });
  assert.equal(activated.成功, true);
  const id = activated.事务.id;
  const generation = activated.事务.请求世代;

  // API 失败或玩家取消都只把已持久票改成待重试，不回滚已经提交的业务。
  assert.equal(标记场景剧情待重试(data, id, generation), true);
  assert.equal(data.业务提交次数, 1);
  assert.equal(读取队首场景剧情(data.系统._待发送事件)?.id, id);

  // 刷新／重载只会重新解析持久 MVU；事务 ID、地点、标题和待重试状态必须完整恢复。
  const refreshed = JSON.parse(JSON.stringify(data));
  const view = 读取场景剧情状态(refreshed);
  assert.equal(view?.活动, true);
  assert.equal(view?.id, id);
  assert.equal(view?.目标场景, '101');
  assert.equal(view?.状态, '待重试');

  const retry = 准备重试场景剧情(refreshed, '101');
  assert.equal(retry.成功, true);
  assert.equal(retry.事务.id, id);
  assert.equal(retry.事务.请求世代, generation + 1);
  assert.equal(refreshed.业务提交次数, 1, '手工重试不得再次执行送礼、扣物或奖励业务');

  // 回档到触发前自然没有票；回档到已触发快照则恢复同一票，不凭当前地点重建另一张。
  assert.equal(读取场景剧情状态(structuredClone(触发前)), null);
  const rollbackAfterTrigger = JSON.parse(JSON.stringify(data));
  assert.equal(读取场景剧情状态(rollbackAfterTrigger)?.id, id);

  // 活动票期间的重复点击不能建立第二张业务票。
  const duplicate = 激活新增场景剧情(refreshed, {
    标题: '重复送礼回应',
    目标场景: '101',
    行动: '再次送礼',
    触发楼层: 31,
    内容: '【上一动作·送礼回响】重复回应。',
  });
  assert.equal(duplicate.成功, false);
  assert.equal(refreshed.业务提交次数, 1);
});

test('旧事件只在目标有充分证据时恢复；未知地点必须由玩家明确认领', () => {
  const { 读取队首场景剧情, 激活队首场景剧情 } = 载入纯函数();
  const known = 建数据();
  known.系统._待发送事件 = '【翻垃圾的收获】旧碎纸';
  assert.equal(读取队首场景剧情(known.系统._待发送事件).目标场景, '垃圾房');
  assert.equal(激活队首场景剧情(known, '302', '继续', 9, false).成功, false);
  assert.equal(激活队首场景剧情(known, '垃圾房', '继续', 9, false).成功, true);

  const unknown = 建数据();
  unknown.系统._待发送事件 = '【上一动作·送礼回响】旧档没有房间锚';
  assert.equal(读取队首场景剧情(unknown.系统._待发送事件).目标场景, null);
  assert.equal(激活队首场景剧情(unknown, '101', '继续', 9, false).成功, false);
  assert.equal(激活队首场景剧情(unknown, '101', '继续', 9, true).成功, true);
  assert.equal(unknown.系统._场景剧情事务.目标场景, '101');
});

test('普通场景事务与录像带、荣耀洞等独立连场绝不允许同时存在', () => {
  const { 激活新增场景剧情, 同步场景剧情事务 } = 载入纯函数();
  const special = 建数据();
  special.系统._特殊场景 = { id: '录像带' };
  special.系统._荣耀洞拍 = -1;
  assert.equal(
    激活新增场景剧情(special, {
      标题: '普通剧情',
      目标场景: '101',
      行动: '继续',
      触发楼层: 7,
      内容: '【首穿】普通剧情',
    }).成功,
    false,
  );

  const overlap = 建数据();
  overlap.系统._特殊场景 = { id: '' };
  overlap.系统._荣耀洞拍 = -1;
  const result = 激活新增场景剧情(overlap, {
    标题: '普通剧情',
    目标场景: '101',
    行动: '继续',
    触发楼层: 7,
    内容: '【首穿】普通剧情',
  });
  assert.equal(result.成功, true);
  overlap.系统._特殊场景.id = '静音会议';
  assert.throws(() => 同步场景剧情事务(overlap), /两套状态机混演/);
});

test('活动事务正文丢失时拒绝写回，不能把已结算业务静默解锁', () => {
  const { 激活新增场景剧情, 同步场景剧情事务 } = 载入纯函数();
  const data = 建数据();
  const result = 激活新增场景剧情(data, {
    标题: '已结算剧情',
    目标场景: '101',
    行动: '继续',
    触发楼层: 8,
    内容: '【首穿】已结算',
  });
  assert.equal(result.成功, true);
  data.系统._待发送事件 = '';
  assert.throws(() => 同步场景剧情事务(data), /不能静默解锁/);
  assert.equal(data.系统._场景剧情事务.id, result.事务.id);
});

test('生产者若覆盖尚未完成的等待票则整轮失败关闭，不能静默丢剧情', () => {
  const { 绑定新增待发送事件到场景 } = 载入纯函数();
  const data = 建数据();
  const old = '【场景剧情:v1:old:202:远处剧情】【新住户】202搬入';
  data.系统._待发送事件 = '【门缝那一眼】本地新事件';
  assert.throws(() => 绑定新增待发送事件到场景(data, old, '102'), /覆盖了尚未完成的等待票/);
});

test('一轮新产生的后续剧情分别绑定当前场景，明确跳过的搬入事件保持专用到场判定', () => {
  const { 绑定新增待发送事件到场景, 读取待发送事件队列, 解析场景剧情元数据 } = 载入纯函数();
  const data = 建数据();
  const old = '【当前事件】本楼正在演';
  data.系统._待发送事件 = `${old}|【新住户】202搬入|【门缝那一眼】丈夫撞见`;
  const count = 绑定新增待发送事件到场景(data, old, '102', item => /【新住户】/.test(item));
  assert.equal(count, 1);
  const items = 读取待发送事件队列(data.系统._待发送事件);
  assert.equal(解析场景剧情元数据(items[0])?.目标场景, '102', '当前场景新票应优先于远处等待票');
  assert.equal(解析场景剧情元数据(items[1]), null);
  assert.equal(解析场景剧情元数据(items[2]), null, '搬入仍由合法公共场景门决定目标');
});

test('入住兼容识别只接受机器标记，普通对白里的“新住户”仍绑定当前场景', () => {
  const { 同步场景剧情事务, 解析场景剧情元数据 } = 载入纯函数();

  const ordinary = 建数据();
  ordinary.系统._待发送事件 = '她随口提到隔壁可能会来新住户，随后继续聊今天的天气。';
  同步场景剧情事务(ordinary, { 当前场景: '101' });
  assert.equal(解析场景剧情元数据(ordinary.系统._待发送事件)?.目标场景, '101');

  const malformed = 建数据();
  malformed.系统._待发送事件 = '【新住户】这只是普通对白里的比喻，没有角色机器标记。';
  同步场景剧情事务(malformed, { 当前场景: '102' });
  assert.equal(解析场景剧情元数据(malformed.系统._待发送事件)?.目标场景, '102');

  const legacyMoveIn = 建数据();
  legacyMoveIn.系统._待发送事件 = '【事件在场妻:202】【新住户】202室今天有人搬进来了。';
  同步场景剧情事务(legacyMoveIn, { 当前场景: '101' });
  assert.equal(解析场景剧情元数据(legacyMoveIn.系统._待发送事件), null);
});

test('回合、快照和客户端共同执行场景锚、请求世代、失败保留与专用重试', () => {
  assert.match(快照源码, /读取队首场景剧情\(待发送快照\)/);
  assert.match(快照源码, /场景剧情目标匹配\(已注入场景剧情\.目标场景/);
  assert.match(快照源码, /清除场景剧情机器标记\(ev\)/);
  assert.match(回合源码, /场景剧情事务ID\?: string/);
  assert.match(回合源码, /场景剧情请求世代\?: number/);
  assert.match(回合源码, /场景剧情请求世代已经变化，旧生成结果不能认领当前重试/);
  assert.match(回合源码, /提交场景剧情成功\([\s\S]{0,220}场景剧情票\?\.请求世代/);
  assert.match(index源码, /标记场景剧情待重试\(最新\.data, 事务ID, 预期请求世代\)/);
  assert.match(index源码, /eventOn\('人妻公寓:继续场景剧情'/);
  assert.match(index源码, /场景剧情请求世代:/);
  assert.match(App源码, /重试本段剧情/);
  assert.match(App源码, /场景剧情活动\.value/);
});

test('即时动作必须先取得生成租约，再结算、建票、写回并移交正文', () => {
  const start = index源码.indexOf('async function 即时开演');
  const end = index源码.indexOf('async function 到场触发场景剧情', start);
  const block = index源码.slice(start, end);
  const lease = block.indexOf('取得前台生成租约()');
  const settle = block.indexOf('const 结果 = await 结算()');
  const activate = block.indexOf('激活新增场景剧情');
  const persist = block.indexOf('await 落地');
  const generate = block.indexOf('await 执行回合');
  assert.ok(lease >= 0 && lease < settle && settle < activate && activate < persist && persist < generate);
  assert.match(block, /本次业务尚未发生|本次操作尚未发生/);
  assert.match(block, /预占前台生成租约: 前台租约/);
});

test('原生酒馆输入和普通游戏输入不能绕过场景专用入口', () => {
  assert.match(index源码, /const 原生等待场景剧情 = [^;]*读取队首场景剧情\(data\.系统\._待发送事件\)/);
  assert.match(index源码, /原生拒绝停止\(楼层/);
  assert.match(index源码, /已经抵达设计地点，请在游戏界面点“开始本段剧情”/);
  assert.match(index源码, /const 等待剧情 = 读取队首场景剧情\(data\.系统\._待发送事件\)/);
  assert.match(index源码, /eventEmit\('人妻公寓:继续场景剧情', \{ 行动: 行动\.trim\(\) \}\)/);
  assert.match(index源码, /eventOn\('人妻公寓:继续场景剧情'/);
});
