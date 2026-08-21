/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  当前时间线切换世代,
  作废当前时间线切换世代,
  登记内部删楼租约,
  排队时间线切换协调,
  时间线切换协调中,
  消费内部删楼事件,
} = require('../../src/人妻公寓/脚本/游戏逻辑/时间线切换协调.ts');

const engine = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');
const index = readFileSync('src/人妻公寓/脚本/游戏逻辑/index.ts', 'utf8');

test('原生 swipe/删楼都进入带世代的统一时间线协调，并只停止本模块监听', () => {
  const start = index.indexOf('function 排队宿主原生时间线切换');
  const end = index.indexOf('tavern_events.MESSAGE_RECEIVED', start);
  const handler = index.slice(start, end);

  assert.match(handler, /排队时间线切换协调/);
  assert.match(handler, /协调原生时间线切换/);
  assert.match(handler, /消费内部删楼事件/);
  assert.match(handler, /清原生本轮冻结\(\)/);
  assert.match(handler, /释放静音会议原生生成锁/);
  assert.match(handler, /取消本回合\(true\)/);
  assert.match(handler, /取消隔离事件\(\)/);
  assert.match(handler, /\.stop\(\)/);
  assert.doesNotMatch(index, /eventClearEvent\(tavern_events\.MESSAGE_(?:SWIPED|DELETED)/);
});

test('切聊天同步推进统一时间线世代，切走再切回同一聊天不能让旧异步通过 ABA', () => {
  const start = index.indexOf('const 聊天切换监听 = eventOn(tavern_events.CHAT_CHANGED');
  const end = index.indexOf('游戏逻辑全局.__rqgyGameTimelineListenerStops', start);
  const handler = index.slice(start, end);

  assert.ok(start >= 0 && end > start, '必须存在本模块独立 CHAT_CHANGED 监听');
  assert.match(handler, /作废当前时间线切换世代\(\)/, '切聊天必须同步作废全部共享时间线租约');
  assert.match(handler, /作废当前手机时间线租约世代\(\)/);
  assert.match(handler, /取消隔离事件\(\)/);
  assert.match(handler, /取消变量重生成\(\)/);
});

test('统一时间线协调会作废保护与晋阶镜像，并清未来过程状态后同步当前真值', () => {
  const start = engine.indexOf('export async function 协调原生时间线切换');
  assert.ok(start >= 0, '回合引擎必须提供统一的原生时间线协调入口');
  const body = engine.slice(engine.indexOf('async function 协调已删时间线'), start + 500);
  const 清场键 = engine.slice(engine.indexOf('const 回合变量键'), engine.indexOf('async function 恢复回合变量快照'));

  assert.match(body, /作废晋阶镜像时间线/);
  assert.match(body, /清保护快照\(\)/);
  for (const key of ['_上次回合', '_场景', '_粘滞', '_赴约', '_在场', '_隔离事件', '_时间撤销点']) {
    assert.match(清场键, new RegExp(key), `必须清理 ${key}`);
  }
  assert.match(body, /读取最近有效/);
  assert.match(body, /捕获保护快照/);
  assert.match(body, /同步入住世界书条目/);
  assert.match(body, /同步整表视图/);
});

test('时间线协调锁在排队调用时同步生效，并持续到异步收口结束', async () => {
  let 放行;
  const 闸门 = new Promise(resolve => {
    放行 = resolve;
  });
  const 起始世代 = 当前时间线切换世代();
  const 任务 = 排队时间线切换协调('测试切分支', async () => {
    await 闸门;
  });

  assert.equal(当前时间线切换世代(), 起始世代 + 1);
  assert.equal(时间线切换协调中(), true, '监听回调返回前必须已经挡住新回合');
  放行();
  await 任务;
  assert.equal(时间线切换协调中(), false);
});

test('卡内删楼可以同步作废旧异步租约而不伪造一个后台协调任务', () => {
  const 起始世代 = 当前时间线切换世代();
  assert.equal(作废当前时间线切换世代(), 起始世代 + 1);
  assert.equal(当前时间线切换世代(), 起始世代 + 1);
  assert.equal(时间线切换协调中(), false);
});

test('较新的时间线世代会让仍在等待的旧协调放弃提交', async () => {
  let 放行旧任务;
  const 旧任务闸门 = new Promise(resolve => {
    放行旧任务 = resolve;
  });
  const 已提交 = [];
  const 旧任务 = 排队时间线切换协调('旧分支', async 租约 => {
    await 旧任务闸门;
    if (租约.仍为最新()) 已提交.push('旧分支');
  });
  await Promise.resolve();
  const 新任务 = 排队时间线切换协调('新分支', async 租约 => {
    if (租约.仍为最新()) 已提交.push('新分支');
  });

  放行旧任务();
  await Promise.all([旧任务, 新任务]);
  assert.deepEqual(已提交, ['新分支']);
});

test('内部删楼租约在调用结束后仍能按楼层消费迟到回调', () => {
  const 租约 = 登记内部删楼租约([12, 13]);
  租约.完成(); // 模拟 deleteChatMessages 已经返回、回合 finally 随后解除进行中

  assert.equal(消费内部删楼事件(13), true);
  assert.equal(消费内部删楼事件(12), true);
  assert.equal(消费内部删楼事件(12), false, '计数耗尽后不能吞掉真正的原生删除');
  assert.equal(消费内部删楼事件(99), false, '不同楼层的原生删除不能被误分类');
});

test('重掷和回档区分删楼前失败与删楼后收口失败，不再虚报什么都没发生', () => {
  const reroll = engine.slice(
    engine.indexOf('export async function 重掷回合'),
    engine.indexOf('export async function 回档至'),
  );
  const rollback = engine.slice(
    engine.indexOf('export async function 回档至'),
    engine.indexOf('// ============================================', engine.indexOf('export async function 回档至')),
  );

  for (const [名称, body] of [
    ['重掷', reroll],
    ['回档', rollback],
  ]) {
    assert.match(body, /已发生物理删楼/, `${名称}必须记录物理删楼是否已经发生`);
    assert.match(body, /getLastMessageId\(\)/, `${名称}异常后必须复核真实末楼`);
    assert.match(body, /已删除/, `${名称}必须向玩家明确楼层已经删除`);
    assert.match(body, /协调已删时间线/, `${名称}必须尝试可重入收口`);
  }
});

test('运行中的主回合捕获时间线世代，分支变化后跳过旧快照恢复并只清理仍属本轮的临时楼', () => {
  const 主回合 = engine.slice(engine.indexOf('export async function 执行回合'), engine.indexOf('/**\n * 重掷本回合'));
  assert.match(主回合, /const 回合时间线世代 = 当前时间线切换世代\(\)/);
  assert.match(主回合, /确认本轮事务有效/);
  assert.match(主回合, /临时用户消息引用/);
  assert.match(主回合, /临时助手消息引用/);
  assert.match(主回合, /本回合消息令牌/);
  assert.match(主回合, /_rqgy回合令牌/);
  assert.match(主回合, /finally \{[\s\S]*捕获本轮临时消息\('user'\)/);
  assert.match(主回合, /finally \{[\s\S]*捕获本轮临时消息\('assistant'\)/);
  assert.match(主回合, /时间线已改变/);
  // 第 6 项起 finally 一律走纯函数精确定位(登记楼层→引用→精确令牌+角色兜底),不再按楼号盲删。
  assert.match(主回合, /定位本轮临时楼\(/);
  assert.match(主回合, /临时楼降序楼层\(/);
  assert.doesNotMatch(主回合, /SillyTavern\.chat\?\.\[楼层\] === 引用/);
  assert.match(主回合, /if \(本轮时间线仍有效\(\) && chat快照\)/);
  assert.match(主回合, /await updateVariablesWith\([\s\S]*_上次回合[\s\S]*确认本轮事务有效/);
});

test('重掷、回档与重开先作废旧手机和时间线世代，失效后不把旧快照补偿进新分支', () => {
  const 重掷 = engine.slice(
    engine.indexOf('export async function 重掷回合'),
    engine.indexOf('export async function 回档至'),
  );
  const 回档 = engine.slice(
    engine.indexOf('export async function 回档至'),
    engine.indexOf('// ============================================', engine.indexOf('export async function 回档至')),
  );
  const 重开 = engine.slice(engine.indexOf('export async function 重开一局'));

  for (const [名称, body] of [
    ['重掷', 重掷],
    ['回档', 回档],
    ['重开', 重开],
  ]) {
    assert.match(body, /作废当前手机时间线租约世代\(\)/, `${名称}必须立即作废旧手机 AI`);
    assert.match(body, /作废当前时间线切换世代\(\)/, `${名称}必须推进统一提交世代`);
    assert.match(body, /排队MVU操作/, `${名称}必须串行覆盖读改写完整事务`);
    assert.match(body, /仍有效/, `${名称}必须在 await 后复核原分支`);
    assert.match(body, /__RQGY_TIMELINE_CHANGED__/);
  }
  assert.match(重掷, /if \(!重掷仍有效\(\)\)[\s\S]*旧重掷停止/);
  assert.match(回档, /if \(!回档仍有效\(\)\)[\s\S]*旧回档停止/);
  assert.match(重开, /if \(!重开仍有效\(\)\)[\s\S]*旧重开停止/);
  assert.ok(重开.indexOf('await 脚本写入') < 重开.indexOf('镜像直写'), '出厂 stat 提交前不得先污染晋阶镜像');
});

test('重开出厂 stat 一旦提交，镜像／世界书后处理失败仍按已重开收口', () => {
  const 重开 = engine.slice(engine.indexOf('export async function 重开一局'));
  const 核心写 = 重开.indexOf('await 脚本写入');
  const 核心标记 = 重开.indexOf('重开核心已提交 = true', 核心写);
  const 派生写 =重开.indexOf('镜像直写', 核心写);
  assert.ok(核心写 >= 0 && 核心标记 > 核心写 && 派生写 > 核心标记, '核心提交标记必须位于 stat 写回确认后、派生镜像前');
  const catch段 = 重开.slice(重开.indexOf('} catch (e) {'));
  assert.match(
    catch段,
    /if \(重开核心已提交\)[\s\S]*eventEmit\('人妻公寓:已重开'\)[\s\S]*return;/,
    '核心已提交后的派生失败不能伪报重开失败或把界面留在旧局',
  );
});

test('序章行动选项的成功写入与失败恢复都在变量回调内部复核开局时间线', () => {
  const 开局 = engine.slice(engine.indexOf('export async function 开始新游戏'), engine.indexOf('/**\n * 重开一局'));
  assert.match(
    开局,
    /updateVariablesWith\(\s*vars => \{\s*确认开局仍有效\(\);\s*_\.set\(vars, '_行动选项', 序章行动选项\)/,
    '序章成功选项不得在等待期间迟到写入新分支',
  );
  assert.match(
    开局,
    /vars => \{\s*if \(!开局仍属原聊天\(\)\) throw new Error\('__RQGY_TIMELINE_CHANGED__'\);\s*_\.set\(vars, '_行动选项', 开局前行动选项 \?\? null\)/,
    '失败恢复旧选项也必须在真正写回时复核共享世代',
  );
  assert.doesNotMatch(开局, /insertOrAssignVariables\(\{ _行动选项: 序章行动选项 \}/);
});

test('序章开局用唯一消息令牌认领迟到楼，并在失败时只清理精确引用', () => {
  const 开局 = engine.slice(engine.indexOf('export async function 开始新游戏'), engine.indexOf('/**\n * 重开一局'));
  assert.match(开局, /const 开局结果 = await 排队MVU操作/);
  assert.match(开局, /return 开局结果/);
  assert.match(开局, /_rqgy开局令牌/);
  assert.match(开局, /finally \{\s*捕获开局消息\(\)/);
  assert.match(开局, /SillyTavern\.chat\?\.\[开局消息楼层\] === 开局消息引用/);
  assert.match(开局, /const 开局数据库后处理仍有效 = \(\) =>[\s\S]*_rqgy开局令牌 === 开局消息令牌/);
  assert.match(开局, /安排数据库回合后处理\([\s\S]*提交校验: 开局数据库后处理仍有效/);
  assert.doesNotMatch(开局, /await 记录数据库回合\(/, '序章数据库写入已经降为成功回合后的后台副作用');
  assert.match(开局, /开局前保护数据 = _\.cloneDeep\(data\)/, '变更序章字段前必须冻结原保护基准');
  assert.match(
    开局,
    /if \(!开局已提交 && 开局前保护数据 && 开局仍属原聊天\(\)\)[\s\S]{0,120}捕获保护快照\(开局前保护数据, false\)/,
    '序章后续失败并清掉消息时，模块内保护快照必须恢复到开局前，不能保留幽灵新局状态',
  );
});
