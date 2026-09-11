/* eslint-disable import-x/no-nodejs-modules -- Node-only transaction regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');

let chatVars = {};
globalThis.getVariables = () => chatVars;
globalThis.insertOrAssignVariables = patch => {
  chatVars = globalThis._.merge({}, chatVars, patch);
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 手机锚消息签名 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts');
const { 计算微信刷新分支指纹 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/刷新恢复镜像.ts');
const { 捕获精确聊天快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间撤销系统.ts');
const { 翻垃圾, 打听, 对饮, 读信揭晓 } = require('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts');
const {
  即时业务撤回键,
  创建即时业务撤回准备,
  创建即时业务撤回记录,
  完成即时业务撤回记录,
  读取即时业务撤回记录,
  核验即时业务撤回记录,
  即时业务锚消息身份匹配,
  即时业务锚稳定令牌指纹,
  即时业务锚仍是业务前状态,
  即时业务撤回聊天快照完整,
  恢复即时业务撤回聊天变量,
} = require('../../src/人妻公寓/脚本/游戏逻辑/即时业务撤回.ts');

const 恢复键 = ['_场景', '_侦探', '_经济', '_行动选项', 即时业务撤回键];

function 建锚消息(标识, 覆盖 = {}) {
  return {
    is_user: false,
    mes: `${标识}锚点正文`,
    send_date: 123,
    swipe_id: 0,
    name: '角色',
    extra: { _rqgy回合令牌: `anchor-${标识}`, _rqgy回合角色: 'assistant' },
    ...覆盖,
  };
}

function 构造锚前缀(锚消息) {
  const 前缀 = Array.from({ length: 41 }, (_, 楼) => ({
    is_user: 楼 % 2 === 1,
    swipe_id: 0,
    extra: { _rqgy回合令牌: `prefix-${楼}`, _rqgy回合角色: 楼 % 2 === 1 ? 'user' : 'assistant' },
  }));
  前缀[40] = 锚消息;
  return 前缀;
}

function 计算锚分支指纹(锚消息) {
  return 计算微信刷新分支指纹(构造锚前缀(锚消息), 40);
}

function 当前子集(value) {
  return Object.fromEntries(恢复键.filter(key => Object.hasOwn(value, key)).map(key => [key, value[key]]));
}

function 建基础数据() {
  const data = Schema.parse({
    现金: 1200,
    背包: ['伴手礼盒', '好酒', '拼合的信·夏乔'],
    户: {
      '101': 创建户节点(0),
      '201': 创建户节点(0),
      '202': 创建户节点(0),
    },
    系统: { _序章完成: true, _绝对时段: 8 },
  });
  data.户['101'].妻.裂缝.碎片进度 = 1;
  data.户['201'].妻.裂缝.碎片进度 = 2;
  data.户['202'].妻.裂缝.碎片进度 = 3;
  data.户['202'].夫.信任值 = 24;
  return data;
}

function 建业务后数据(业务前, 请求世代 = 1, 状态 = '生成中') {
  const data = structuredClone(业务前);
  data.户['101'].妻.裂缝.碎片进度 = 2;
  data.户['201'].妻.裂缝.碎片进度 = 3;
  data.户['202'].妻.裂缝.碎片进度 = 4;
  data.户['202'].夫.信任值 = 32;
  data.户['101'].妻.裂缝.已确认 = true;
  data.背包 = ['酒后真言·周小满'];
  data.系统._待发送事件 = '【场景剧情:v1:txn-clue:%E5%9E%83%E5%9C%BE%E6%88%BF:%E7%BF%BB%E5%9E%83%E5%9C%BE】剧情';
  data.系统._场景剧情事务 = {
    id: 'txn-clue',
    标题: '线索业务',
    目标场景: '垃圾房',
    行动: '调查',
    内容: data.系统._待发送事件,
    触发绝对时段: data.系统._绝对时段,
    触发楼层: 40,
    请求世代,
    状态,
  };
  return Schema.parse(data);
}

function 建样本记录() {
  const 业务前 = 建基础数据();
  const 业务后 = 建业务后数据(业务前);
  const 消息 = 建锚消息('clue');
  const 业务前聊天 = {
    _场景: { 房间id: '垃圾房', 进房末楼: 39 },
    _侦探: { 翻垃圾上次: { 101: 7 } },
    _经济: { 偷窃: {} },
    _行动选项: undefined,
  };
  const 准备 = 创建即时业务撤回准备({
    聊天ID: 'chat-a',
    锚楼: 40,
    锚消息签名: 手机锚消息签名(消息),
    锚稳定令牌指纹: 即时业务锚稳定令牌指纹(消息),
    锚分支指纹: 计算锚分支指纹(消息),
    业务前数据: 业务前,
    业务前聊天: 捕获精确聊天快照(业务前聊天, 恢复键),
  });
  const 准备记录 = 创建即时业务撤回记录(准备, 'txn-clue');
  const 已提交记录 = 完成即时业务撤回记录(准备记录, 业务后);
  return { 业务前, 业务后, 消息, 业务前聊天, 准备记录, 已提交记录 };
}

test('翻垃圾、打听、对饮与读信都保存真正结算前的统一撤回快照', async () => {
  const cases = [
    {
      name: '翻垃圾',
      data: () => Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 0 } }),
      run: data => 翻垃圾(data, '101', 40),
      changed: data => assert.equal(data.户['101'].妻.裂缝.碎片进度, 1),
    },
    {
      name: '打听',
      data: () => Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: 0 }, 背包: ['伴手礼盒'] }),
      run: data => 打听(data, '201', 40),
      changed: data => {
        assert.equal(data.户['201'].妻.裂缝.碎片进度, 1);
        assert.deepEqual(data.背包, []);
      },
    },
    {
      name: '对饮',
      data() {
        const data = Schema.parse({ 户: { 202: 创建户节点(0) }, 系统: { _绝对时段: 0 }, 背包: ['好酒'] });
        data.户['202'].夫.信任值 = 4;
        return data;
      },
      run: data => 对饮(data, '202', 40),
      changed: data => {
        assert.equal(data.户['202'].妻.裂缝.碎片进度, 1);
        assert.equal(data.户['202'].夫.信任值, 12);
        assert.deepEqual(data.背包, []);
      },
    },
    {
      name: '读信',
      data() {
        const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 0 }, 背包: ['拼合的信·夏乔'] });
        data.户['101'].妻.裂缝.碎片进度 = 4;
        return data;
      },
      run: data => 读信揭晓(data, '101'),
      changed: data => {
        assert.equal(data.户['101'].妻.裂缝.已确认, true);
        assert.deepEqual(data.背包, []);
      },
    },
  ];

  for (const [index, item] of cases.entries()) {
    chatVars = {
      _场景: { 房间id: item.name === '翻垃圾' ? '垃圾房' : '测试场景', 进房末楼: 39 },
      _侦探: { 翻垃圾上次: { 101: 7 } },
      _经济: { 偷窃: {} },
      _行动选项: undefined,
    };
    const data = item.data();
    const beforeData = structuredClone(data);
    const beforeChat = structuredClone(chatVars);
    const result = item.run(data);
    assert.ok(result.事件, `${item.name}必须进入正式正文事务`);
    await result.提交后?.();
    item.changed(data);

    const id = `txn-real-${index}`;
    data.系统._待发送事件 = `【场景剧情:v1:${id}:%E6%B5%8B%E8%AF%95:${item.name}】正文`;
    data.系统._场景剧情事务 = {
      id,
      标题: item.name,
      目标场景: '测试场景',
      行动: item.name,
      内容: data.系统._待发送事件,
      触发绝对时段: data.系统._绝对时段,
      触发楼层: 40,
      请求世代: 1,
      状态: '生成中',
    };
    const message = 建锚消息(`real-${index}`);
    const prepare = 创建即时业务撤回准备({
      聊天ID: 'chat-real',
      锚楼: 40,
      锚消息签名: 手机锚消息签名(message),
      锚稳定令牌指纹: 即时业务锚稳定令牌指纹(message),
      锚分支指纹: 计算锚分支指纹(message),
      业务前数据: beforeData,
      业务前聊天: 捕获精确聊天快照(beforeChat, 恢复键),
    });
    const record = 完成即时业务撤回记录(创建即时业务撤回记录(prepare, id), data);
    const check = 核验即时业务撤回记录(record, {
      当前聊天ID: 'chat-real',
      当前锚楼: 40,
      当前锚消息: message,
      当前锚分支指纹: 计算锚分支指纹(message),
      当前锚数据: data,
      预期场景事务ID: id,
    });
    assert.equal(check.有效, true, check.有效 ? '' : `${item.name}: ${check.原因}`);
    assert.deepEqual(check.记录.业务前数据, beforeData, `${item.name}必须保存完整业务前MVU`);

    const current = {
      ...chatVars,
      _经济: { 偷窃: { 101: 1 } },
      _行动选项: { 已变化: true },
      [即时业务撤回键]: record,
      无关同期变量: { 保留: true },
    };
    恢复即时业务撤回聊天变量(current, record, 恢复键);
    assert.deepEqual(当前子集(current), 当前子集(beforeChat), `${item.name}必须精确退回软冷却与缺失键`);
    assert.deepEqual(current.无关同期变量, { 保留: true }, '撤回不得覆盖同期无关聊天变量');
  }
});

test('撤回票只容忍同一事务的重试态和宿主软改写，篡改、切分支与额外业务差异均失败关闭', () => {
  const { 业务前, 业务后, 消息, 准备记录, 已提交记录 } = 建样本记录();
  const base = {
    当前聊天ID: 'chat-a',
    当前锚楼: 40,
    当前锚消息: 消息,
    当前锚分支指纹: 计算锚分支指纹(消息),
    当前锚数据: 业务后,
    预期场景事务ID: 'txn-clue',
  };
  assert.equal(即时业务锚仍是业务前状态(准备记录, 业务前), true);
  assert.equal(即时业务撤回聊天快照完整(已提交记录, 恢复键), true);

  const retry = 建业务后数据(业务前, 7, '待重试');
  const retryCheck = 核验即时业务撤回记录(已提交记录, { ...base, 当前锚数据: retry });
  assert.equal(retryCheck.有效, true, retryCheck.有效 ? '' : retryCheck.原因);

  const softRewrite = { ...消息, mes: '刷新后宏展开正文', send_date: 999, name: '新显示名' };
  assert.equal(即时业务锚消息身份匹配(已提交记录, softRewrite), true);
  const softCheck = 核验即时业务撤回记录(已提交记录, { ...base, 当前锚消息: softRewrite });
  assert.equal(softCheck.有效, true, softCheck.有效 ? '' : softCheck.原因);

  for (const override of [
    { 当前聊天ID: 'chat-b' },
    { 当前锚楼: 39 },
    { 当前锚消息: { ...消息, swipe_id: 1 } },
    { 当前锚消息: { ...消息, extra: { ...消息.extra, _rqgy回合令牌: 'rebuilt' } } },
    { 预期场景事务ID: 'txn-other' },
  ]) {
    const context = { ...base, ...override };
    if (override.当前锚消息) context.当前锚分支指纹 = 计算锚分支指纹(override.当前锚消息);
    assert.equal(核验即时业务撤回记录(已提交记录, context).有效, false);
  }

  const changedAfter = structuredClone(业务后);
  changedAfter.现金 -= 1;
  assert.equal(核验即时业务撤回记录(已提交记录, { ...base, 当前锚数据: changedAfter }).有效, false);

  const strictBefore = 核验即时业务撤回记录(已提交记录, { ...base, 当前锚数据: 业务前 });
  assert.equal(strictBefore.有效, false, '删楼前不能把业务前锚误认成已完成退款');
  const resumableBefore = 核验即时业务撤回记录(已提交记录, {
    ...base,
    当前锚数据: 业务前,
    允许业务前锚: true,
  });
  assert.equal(resumableBefore.有效, true, resumableBefore.有效 ? '' : resumableBefore.原因);
  assert.equal(resumableBefore.锚状态, '业务前已恢复');

  for (const mutate of [
    value => { value.业务前数据.现金 -= 1; },
    value => { value.业务前聊天._侦探.值 = { 被改写: true }; },
    value => { value.锚稳定令牌指纹 = 'bad'; },
    value => { value.锚分支指纹 = 'bad'; },
    value => { value.业务前数据指纹 = 'bad'; },
    value => { value.业务后数据指纹 = 'bad'; },
    value => { value.完整性指纹 = 'bad'; },
  ]) {
    const tampered = structuredClone(已提交记录);
    mutate(tampered);
    assert.equal(读取即时业务撤回记录(tampered), null);
  }
});

test('完整撤回精确恢复不存在、undefined与普通值，且不递归包入旧上次回合', () => {
  const { 业务前聊天, 已提交记录 } = 建样本记录();
  const current = {
    _场景: { 房间id: '垃圾房', 进房末楼: 40 },
    _侦探: { 翻垃圾上次: { 101: 8 } },
    _经济: { 偷窃: { 101: 1 } },
    _行动选项: { 已变化: true },
    [即时业务撤回键]: 已提交记录,
    _上次回合: { 不应被嵌套: true },
    无关同期变量: { 保留: true },
  };
  恢复即时业务撤回聊天变量(current, 已提交记录, 恢复键);
  assert.deepEqual(当前子集(current), 当前子集(业务前聊天));
  assert.equal(Object.hasOwn(current, 即时业务撤回键), false);
  assert.equal(Object.hasOwn(current, '_行动选项'), true);
  assert.equal(current._行动选项, undefined);
  assert.deepEqual(current._上次回合, { 不应被嵌套: true });
  assert.deepEqual(current.无关同期变量, { 保留: true });
});

function assertOrder(text, fragments, message) {
  let cursor = -1;
  for (const fragment of fragments) {
    const next = text.indexOf(fragment, cursor + 1);
    assert.ok(next >= 0, `${message}：未找到 ${fragment}`);
    assert.ok(next > cursor, `${message}：顺序错误 ${fragment}`);
    cursor = next;
  }
}

test('生产接线保持捕获→登记→核心落地→确认→正文，普通重掷不退款，完整撤回先验票再删楼', () => {
  const index = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const engine = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

  const instantStart = index.indexOf('async function 即时开演(');
  const instantEnd = index.indexOf('async function 到场触发场景剧情', instantStart);
  assert.ok(instantStart >= 0 && instantEnd > instantStart);
  const instant = index.slice(instantStart, instantEnd);
  assertOrder(
    instant,
    [
      'const 业务前撤回准备 = 即时业务撤回?.捕获(data)',
      'const 结果 = await 结算()',
      'await 即时业务撤回.登记(业务前撤回准备, 事务ID, data)',
      '已落库 = await 落地(',
      'await 即时业务撤回!.确认(即时业务撤回记录)',
      '成功 = await 执行回合(行动',
    ],
    '即时业务事务必须按单向提交顺序接线',
  );
  assert.match(instant, /提交后已启动 = true;[\s\S]*?await 原提交后\(\)/, '提交后副作用必须最多启动一次');

  const rollbackStart = engine.indexOf('export async function 回档至');
  const rollbackEnd = engine.indexOf('export async function 开始新游戏', rollbackStart);
  const rollback = engine.slice(rollbackStart, rollbackEnd);
  assertOrder(
    rollback,
    [
      '准备恢复即时业务撤回(上次回合, 楼层)',
      '标记数据库时间线将变更(楼层',
      'await 内部删除聊天消息(_.range(楼层 + 1, 末楼 + 1))',
      '恢复即时业务数据: 完整撤回记录槽.当前.业务前数据',
      '恢复精确回合变量: 完整撤回记录槽.当前',
    ],
    '完整撤回必须先验票后冻结、删楼与退款',
  );

  const rerollStart = engine.indexOf('export async function 重掷回合');
  const rerollEnd = engine.indexOf('function 准备恢复即时业务撤回', rerollStart);
  const reroll = engine.slice(rerollStart, rerollEnd);
  assert.doesNotMatch(reroll, /准备恢复即时业务撤回|恢复即时业务数据|恢复精确回合变量/,
    '普通重掷必须保留业务结果，只重演正文');

  assert.match(index, /即时业务撤回运行端口未完整接线[\s\S]*?await 恢复即时业务撤回登记\(\)/,
    '真实启动必须硬确认运行端口并恢复中断登记');
  assert.match(index, /同步丈夫登门排期\(data\)[\s\S]*?\}\)\(_\.cloneDeep\(data\) as SchemaType\)/,
    '睡前丈夫排期预检必须在副本上进行');
  assert.match(index, /同步安若妍换掉时间节点\(候选数据\)/,
    '《换掉》候选预检不得在撤回快照前改写真实数据');
  assert.match(index, /同步许曼君离婚完成后状态\(候选数据\)/,
    '201完成态迁移预检不得在撤回快照前改写真实数据');
});
