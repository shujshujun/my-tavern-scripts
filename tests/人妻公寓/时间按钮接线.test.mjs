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
const 隔离事件源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts', import.meta.url), 'utf8');
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

test('管理员室与302保留小憩和睡眠，全局只显示一个固定推进按钮', () => {
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
  assert.equal((App源.match(/class="global-time-advance"/g) ?? []).length, 1);
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
  assert.match(
    事务段,
    /恢复时间聊天备份\(\s*聊天事务备份,\s*时间推进写入聊天键,\s*预期聊天ID,\s*时间事务记录\.事务ID/,
  );
});

test('晨跑、健身与睡眠先只生成草稿，隔离日志和撤销点在同一聊天事务内落地', () => {
  const 处理段 = 截段(Index源, 'function 处理时间推进', '\n  function 处理撤销时间推进');
  const 草稿函数 = 截段(隔离事件源, 'export async function 生成隔离事件草稿', '\nexport function 写入隔离事件草稿');
  const 纯写函数 = 截段(隔离事件源, 'export function 写入隔离事件草稿', '\nexport async function 执行隔离事件');

  // 草稿阶段可以调用模型和读取同线程上下文，但绝不能先把结果写进当前聊天。
  assert.doesNotMatch(草稿函数, /updateVariablesWith|\.日志\.push\(|_隔离事件['".)]/);
  // 日志写入器只改调用者传入的 vars；事务边界必须由时间处理器掌握。
  assert.match(纯写函数, /写入隔离事件草稿\(vars[,:]/);
  assert.doesNotMatch(纯写函数, /updateVariablesWith|\bawait\b/);

  const 生成位置 = 处理段.indexOf('await 生成隔离事件草稿(');
  const 旧直写位置 = 处理段.indexOf('await 执行隔离事件(');
  const 首次聊天事务位置 = 处理段.indexOf('updateVariablesWith(', 生成位置);
  const 清场后指纹位置 = 处理段.indexOf('const 清场后聊天基线', 首次聊天事务位置);
  const 写撤销点位置 = 处理段.indexOf('写撤销点: async () =>', 清场后指纹位置);
  const 恢复状态位置 = 处理段.indexOf('恢复推进前状态: async () =>', 写撤销点位置);
  assert.ok(生成位置 >= 0, '时间动作必须先取得不落库的独立事件草稿');
  assert.equal(旧直写位置, -1, '时间动作不得调用会立即写日志的旧一体化入口');
  assert.ok(首次聊天事务位置 > 生成位置, '模型成功以后才能进入聊天清场事务');
  assert.ok(清场后指纹位置 > 首次聊天事务位置, '日志与清场落地后才能建立提交指纹');
  assert.ok(写撤销点位置 > 清场后指纹位置 && 恢复状态位置 > 写撤销点位置);

  const 首次聊天事务 = 处理段.slice(首次聊天事务位置, 清场后指纹位置);
  assert.match(首次聊天事务, /写时间结束场景\(vars, 时间结束房间, 当前消息楼\)/);
  assert.doesNotMatch(首次聊天事务, /写入隔离事件草稿/, 'stat 尚未成功时不能先留下日常日志');

  const 撤销点聊天事务 = 处理段.slice(写撤销点位置, 恢复状态位置);
  assert.match(撤销点聊天事务, /写入隔离事件草稿\(vars,\s*[^,\n]+,\s*当前消息楼\)/);
  assert.match(撤销点聊天事务, /vars\[时间撤销点键\] = 创建时间撤销点\(/);
  assert.ok(
    撤销点聊天事务.indexOf('写入隔离事件草稿(') < 撤销点聊天事务.indexOf('创建时间撤销点('),
    '撤销点的推进后聊天指纹必须看见刚写入的两条隔离日志',
  );
  assert.equal(
    (撤销点聊天事务.match(/updateVariablesWith\(/g) ?? []).length,
    1,
    '日志和撤销点必须由同一个 updateVariablesWith 原子修改，不能留下没有撤销依据的孤立日志',
  );
});

test('晨跑健身睡眠只给AI自由创作方向，小憩不请求AI，睡眠素材只取当天可靠正文', () => {
  const 方向段 = 截段(Index源, 'function 时间动作需要独立演出', '\n  async function 恢复时间聊天备份');
  const 动作门 = 截段(方向段, 'function 时间动作需要独立演出', '\n\n  /**');

  for (const 方式 of ['晨跑', '健身', '睡到次日早晨']) assert.match(动作门, new RegExp(`方式 === '${方式}'`));
  assert.doesNotMatch(动作门, /方式 === '小憩'/, '小憩必须直接结算，不能调用AI');
  assert.match(方向段, /不要求固定起承转合、段落或句式/);
  assert.match(方向段, /不要求固定流程、段落或句式/);
  assert.match(方向段, /这只是可选方向，不要求固定总结格式，也不必每次都回想/);
  assert.match(方向段, /可自由安排叙述重心与表达方式，不套固定流程或句式/);
  assert.match(方向段, /Mvu\.getMvuData\(\{ type: 'message', message_id: 楼层 \}\)/);
  assert.match(方向段, /读取世界时间\(楼层绝对时段\)\.天数 !== 当天/);
  assert.match(方向段, /不能证明属于今天的正文，不拿来诱导睡眠回想/);
});

test('手机与隔离短生成在正文令牌和时间锁之前旁路，时间内正式剧情仍由固定回合接管', () => {
  const prompt起 = Index源.lastIndexOf('tavern_events.CHAT_COMPLETION_PROMPT_READY');
  const prompt止 = Index源.indexOf('Mvu.events.VARIABLE_UPDATE_ENDED', prompt起);
  assert.ok(prompt起 >= 0 && prompt止 > prompt起);
  const prompt段 = Index源.slice(prompt起, prompt止);
  const 标记位置 = prompt段.indexOf('请求提示文本.includes(手机生成请求标记)');
  const 隔离标记位置 = prompt段.indexOf('请求提示文本.includes(隔离事件请求标记)');
  const 令牌位置 = prompt段.indexOf('++_原生本轮令牌');
  const 正文回合位置 = prompt段.indexOf('if (回合进行中())');
  const 时间锁位置 = prompt段.indexOf('if (_时间推进中)');
  const AI锁位置 = prompt段.indexOf('_isInAiCycle = true');

  assert.ok(标记位置 >= 0 && 隔离标记位置 >= 0);
  assert.ok(标记位置 < 令牌位置 && 隔离标记位置 < 令牌位置, '短生成不得递增正文令牌');
  assert.ok(标记位置 < AI锁位置 && 隔离标记位置 < AI锁位置, '短生成不得占用正文AI锁');
  assert.ok(正文回合位置 >= 0 && 正文回合位置 < 时间锁位置, '时间动作触发的正式剧情必须先由固定回合认领');
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

test('入口硬门限制睡眠与活动地点，普通推进保留原地点并交由中央事务禁止跨日', () => {
  const 接线段 = 截段(Index源, 'type 时间推进载荷', '\n  // 地点只负责亮出 STORY 按钮');
  const 处理段 = 接线段.slice(接线段.indexOf('function 处理时间推进'));
  const 执行位置 = 处理段.indexOf('执行时间推进事务');
  const 切场景位置 = 处理段.indexOf('写时间结束场景(vars');
  assert.ok(执行位置 > 0 && 切场景位置 > 0);

  const 门们 = [
    "方式 === '睡到次日早晨' && 当前房间 !== '管理员室' && 当前房间 !== '302'",
    "方式 === '小憩' && 当前房间 !== '管理员室' && 当前房间 !== '302'",
    "方式 === '晨跑' && 当前房间 !== '晨跑公园'",
    "方式 === '健身' && 当前房间 !== '健身房'",
    'if (_isInAiCycle)',
    'if (回合进行中())',
    'if (脚本写入中)',
    'if (隔离事件进行中())',
    'data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0',
    'data.系统._父亲通话.标识 || data.系统._父亲通话.状态',
    "_.get(getVariables({ type: 'chat' }), '_侦探.偷窥待选')",
    'if (待演)',
    '预期绝对时段 !== data.系统._绝对时段',
  ];
  for (const 门 of 门们) {
    const 位置 = 处理段.indexOf(门);
    assert.ok(位置 >= 0, `缺少时间推进硬门：${门}`);
    assert.ok(位置 < 切场景位置, `硬门必须先于聊天场景清理：${门}`);
    assert.ok(位置 < 执行位置, `硬门必须先于时间事务：${门}`);
  }
  assert.doesNotMatch(处理段, /方式 === '推进一时段' && 当前房间 !== '管理员室'/);
  assert.match(
    接线段,
    /const 时间结束房间: 时间推进地点 =\s*方式 === '推进一时段'[\s\S]{0,80}\? 当前房间[\s\S]{0,160}当前房间 === '晨跑公园'[\s\S]{0,80}当前房间 === '健身房'/,
  );
  assert.match(接线段, /function 写时间结束场景[\s\S]{0,180}房间id: 房间/);
  assert.match(处理段, /写时间结束场景\(vars, 时间结束房间, 当前消息楼\)/);
  assert.match(接线段, /const 时间请求 = \{[\s\S]{0,180}当前地点: 时间结束房间/);
  assert.match(接线段, /执行时间推进事务\(候选, 时间请求\)/);
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

test('两种后台方式产生各自的推进跨度，但例行动作不再遗留待演时间票', () => {
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
  assert.equal(推进.系统._待发送事件, '');

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
  assert.equal(睡眠.系统._待发送事件, '');
});

test('旧杀时间事件和绕过中央事务的旧时钟导出已从业务源码移除', () => {
  const 源码根 = fileURLToPath(new URL('../../src/人妻公寓', import.meta.url));
  const 全部业务源码 = 收集业务源码(源码根).join('\n');
  assert.doesNotMatch(全部业务源码, /人妻公寓:杀时间/);
  assert.doesNotMatch(时钟源, /export function 杀时间|export const 杀时间/);
});

test('双存储成功后先锁定已提交状态，再检查聊天是否仍在原时间线', () => {
  const 处理段 = 截段(Index源, 'function 处理时间推进', "eventOn('人妻公寓:推进时段'");
  const 双存储结束 = 处理段.indexOf('await 执行时间推进双存储提交');
  const 提交标记 = 处理段.indexOf('已提交 = true', 双存储结束);
  const 后处理校验 = 处理段.indexOf('if (!操作仍有效() || 当前聊天ID() !== 预期聊天ID)', 双存储结束);
  assert.ok(双存储结束 >= 0 && 提交标记 > 双存储结束);
  assert.ok(后处理校验 > 提交标记, '存储已成功时必须先标记提交，再判断是否跳过后处理');

  const 捕获段 = 处理段.slice(处理段.indexOf('} catch (e)'), 处理段.indexOf('}).finally'));
  assert.ok(捕获段.indexOf('if (已提交)') >= 0);
  assert.ok(捕获段.indexOf('if (已提交)') < 捕获段.indexOf('if (!操作仍有效())'));
});
