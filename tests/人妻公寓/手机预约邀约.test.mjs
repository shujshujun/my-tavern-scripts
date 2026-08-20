/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
// `schema.json` 与 `schema.ts` 同名；让 Node 测试像 webpack 一样优先解析 TypeScript。
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');
const { Schema } = require('../../src/人妻公寓/schema.ts');

// ── 纯逻辑模块：日期/目标钟构造/地点白名单/计划状态机/完整提交校验 ──
const {
  多人邀约地点合法,
  合并手机邀约计划,
  手机多人邀约上限,
  手机邀约计划成员,
  手机邀约计划键,
  手机邀约计划可并入,
  手机邀约计划可提交,
  手机邀约计划占用中,
  手机邀约计划状态,
  手机邀约计划需裁剪,
  移除手机邀约计划成员,
  邀约公共地点列表,
  邀约地点分组,
  邀约地点合法,
  邀约日期选项,
  构造目标绝对时段,
  邀约目标合法,
  邀约社交轨迹事件键,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机/邀约计划.ts');

// ── 现场视图：snapshotSystem.读赴约/读粘滞（旧即时 `_赴约` + 新 `_手机邀约计划` 统一口） ──
let 测试聊天变量 = {};
globalThis.getVariables = () => 测试聊天变量;
const { 读赴约, 读赴约们, 读粘滞 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');

// ── 数据层真实回调行为：写库增量 的最终 CAS 与防御性校验、读手机邀约计划 的输入硬化 ──
const { 写库增量, 读手机邀约计划 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');

// ── 源码契约：接线点与 WeUI 页面 ──
const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 挂载源码 = readFileSync(new URL('./壳/挂载.ts', 手机目录), 'utf8');
const 邀请页源码 = readFileSync(new URL('./壳/渲染/invite.ts', 手机目录), 'utf8');
const 渲染index源码 = readFileSync(new URL('./壳/渲染/index.ts', 手机目录), 'utf8');
const 皮肤源码 = readFileSync(new URL('./壳/资源与皮肤.ts', 手机目录), 'utf8');
const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 快照源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts', import.meta.url), 'utf8');
const 索引源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 时间撤销源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/时间撤销系统.ts', import.meta.url), 'utf8');
const app源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

/** 从源码按起止锚截取片段（与 tests/人妻公寓/手机系统拆分P8.test.mjs 同款）。 */
function 截源(源码, 开始, 结束) {
  const 起 = 源码.indexOf(开始);
  const 止 = 源码.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源码.slice(起, 止);
}

const 计划 = { m: '101', 创建楼: 10, 创建绝对时段: 20, 目标绝对时段: 24, 地点: '天台' };

test('同一消息楼经过无楼层时间推进后再次邀约，社交轨迹键必须不同且同一次重试保持幂等', () => {
  assert.equal(typeof 邀约社交轨迹事件键, 'function');
  const 第一次 = 邀约社交轨迹事件键('101', 10, 20);
  const 同次重试 = 邀约社交轨迹事件键('101', 10, 20);
  const 时间推进后 = 邀约社交轨迹事件键('101', 10, 29);
  assert.equal(第一次, 同次重试, '同一业务重试必须继续命中同一行');
  assert.notEqual(第一次, 时间推进后, '世界钟已推进但酒馆楼未增加时，不能覆盖上一次真实邀约');
});

test('日期页只列当前星期从今天到星期日；星期日只列周日；绝不出现下周', () => {
  // 第 3 天 = 星期三（绝对时段 12 起）；只列 周三…周日。
  const 周三 = 邀约日期选项(12);
  assert.deepEqual(
    周三.map(o => o.星期),
    ['星期三', '星期四', '星期五', '星期六', '星期日'],
  );
  // 星期日（41）只列周日。
  assert.deepEqual(
    邀约日期选项(41).map(o => o.星期),
    ['星期日'],
  );
  // 星期一（0）列整周。
  assert.deepEqual(
    邀约日期选项(0).map(o => o.星期),
    ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  );
  // 第 2 周开始（42）仍只列本周，绝不出现下周。
  assert.deepEqual(
    邀约日期选项(42).map(o => o.星期),
    ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  );
  // 所有日起始绝对时段都落在当前周内。
  for (const o of 邀约日期选项(13)) {
    assert.ok(o.日起始绝对时段 >= 12 && o.日起始绝对时段 < 54, o.星期);
  }
  // 星期日深夜（41）构造出的目标仍在同一周内。
  assert.equal(构造目标绝对时段('星期日', '深夜', 41), 41);
  assert.equal(邀约目标合法(41, 41), true);
});

test('今天只允许当前时段及之后（当前时段可选），未来日本周六时段；过去/下周目标被提交校验拒绝', () => {
  // 星期三中午 = 13：今天必须包含当前 中午 及之后（当前时段可立即去约定地点见面）。
  const 周三中午 = 邀约日期选项(13);
  assert.deepEqual(周三中午[0].时段选项, ['中午', '下午', '傍晚', '晚上', '深夜']);
  // 后续日给满六时段。
  assert.deepEqual(周三中午[1].时段选项, ['早上', '中午', '下午', '傍晚', '晚上', '深夜']);
  // 当前时段可选：立即去指定地点见面。
  assert.equal(构造目标绝对时段('星期三', '下午', 13), 14);
  assert.equal(构造目标绝对时段('星期三', '中午', 13), 13);
  // 今天的过去时段被构造拒绝。
  assert.equal(构造目标绝对时段('星期三', '早上', 13), null);
  // 本周已过去的星期（星期二及以前）被拒绝。
  assert.equal(构造目标绝对时段('星期二', '晚上', 13), null);
  assert.equal(构造目标绝对时段('星期一', '早上', 13), null);
  // 下周目标被构造/提交校验拒绝。
  assert.equal(邀约目标合法(42, 13), false);
  assert.equal(邀约目标合法(41, 13), true);
  assert.equal(邀约目标合法(12, 13), false);
  assert.equal(邀约目标合法(24, 13), true);
  assert.equal(邀约目标合法(NaN, 13), false);
});

test('私人/公共地点白名单、角色房间动态与 302 去重；非法/特殊玩法地点拒绝', () => {
  // 私人地点：302（你家）、管理员室、当前角色门牌。
  assert.equal(邀约地点合法('302', '101'), true);
  assert.equal(邀约地点合法('管理员室', '101'), true);
  assert.equal(邀约地点合法('101', '101'), true);
  assert.equal(邀约地点合法('102', '102'), true);
  // 当前角色是 302 时去重：302 本身仍合法（你家）。
  assert.equal(邀约地点合法('302', '302'), true);
  // 别人的房间不开放。
  assert.equal(邀约地点合法('101', '102'), false);
  // 公共五处全部合法。
  for (const 地点 of 邀约公共地点列表) {
    assert.equal(邀约地点合法(地点, '101'), true, 地点);
  }
  // 不开放垃圾房/洗手间/晨跑公园/健身房，特殊玩法地点与非法值一律拒绝。
  for (const 地点 of ['垃圾房', '洗手间', '晨跑公园', '健身房', '外出', '荣耀洞', '天台顶', '厨房', '']) {
    assert.equal(邀约地点合法(地点, '101'), false, 地点);
  }
  assert.equal(邀约地点分组('天台'), '公共场所');
  assert.equal(邀约地点分组('管理员室'), '私人地点');
  assert.equal(邀约地点分组('垃圾房'), null);
  // 多人必须选择每位成员都合法的共同地点；任一角色私宅不再冒充共同地点。
  assert.equal(多人邀约地点合法('天台', ['101', '102']), true);
  assert.equal(多人邀约地点合法('管理员室', ['101', '102']), true);
  assert.equal(多人邀约地点合法('302', ['101', '102']), true);
  assert.equal(多人邀约地点合法('101', ['101']), true);
  assert.equal(多人邀约地点合法('101', ['101', '102']), false);
  assert.equal(多人邀约地点合法('天台', ['101', '102', '201', '202', '301']), true);
  assert.equal(多人邀约地点合法('天台', ['101', '102', '201', '202', '301', '302']), false);
});

test('计划状态机：待赴约 → 赴约中 → 已过期；回档到创建点前无效；时间撤销自然恢复待赴约', () => {
  assert.equal(手机邀约计划状态(计划, 21, 12), '待赴约');
  assert.equal(手机邀约计划状态(计划, 24, 12), '赴约中');
  assert.equal(手机邀约计划状态(计划, 25, 12), '已过期');
  // 创建楼在回档后成为未来 → 无效。
  assert.equal(手机邀约计划状态(计划, 21, 9), '无效');
  // 创建钟在当前时间线未来 → 无效。
  assert.equal(手机邀约计划状态(计划, 19, 12), '无效');
  // 损坏/非法形状安全判定为无效，不崩溃。
  assert.equal(手机邀约计划状态(null, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, 地点: '垃圾房' }, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, m: '999' }, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, 目标绝对时段: 10 }, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, 创建绝对时段: NaN }, 21, 12), '无效');
  // 时间撤销回到创建之后、目标之前 → 由世界钟派生自然恢复为待赴约。
  assert.equal(手机邀约计划状态(计划, 22, 12), '待赴约');
  assert.equal(手机邀约计划状态(计划, 20, 12), '待赴约');
  // 占用语义：待赴约/赴约中占用单例；已过期/无效不阻塞下一份。
  assert.equal(手机邀约计划占用中(计划, 21, 12), true);
  assert.equal(手机邀约计划占用中(计划, 24, 12), true);
  assert.equal(手机邀约计划占用中(计划, 25, 12), false);
  assert.equal(手机邀约计划占用中({ ...计划, 地点: '垃圾房' }, 21, 12), false);
  assert.equal(手机邀约计划占用中(null, 21, 12), false);
});

test('目标时段只有约定地点在场：其他房间不传送、不放行当面动作、不占入住场景', () => {
  测试聊天变量 = { _赴约: null, [手机邀约计划键]: { ...计划 } };
  // 赴约时段 + 玩家场景等于约定地点 → 现场视图（带约定地点）。
  assert.deepEqual(读赴约(12, '天台', 24), { m: '101', 地点: '天台', 至楼: 12 });
  // 赴约时段 + 玩家在其他房间 → 不返回（她不传送，也不占现场）。
  assert.equal(读赴约(12, '大堂', 24), null);
  assert.equal(读赴约(12, '101', 24), null);
  // 待赴约 → 任何房间都不返回现场。
  assert.equal(读赴约(12, '天台', 21), null);
  assert.equal(读赴约(12, '大堂', 21), null);
  // 已过期 → 不再占用。
  assert.equal(读赴约(12, '天台', 25), null);
  // 无房间上下文（读赴约不校验房间时）赴约中也返回现场。
  assert.deepEqual(读赴约(12, undefined, 24), { m: '101', 地点: '天台', 至楼: 12 });
  测试聊天变量 = { _赴约: null, [手机邀约计划键]: null };
});

test('共同计划在目标地点返回全部接受成员；旧单人读口只兼容返回首成员', () => {
  const 共同计划 = {
    版本: 2,
    ...计划,
    成员: ['101', '102', '201'],
  };
  测试聊天变量 = { _赴约: null, [手机邀约计划键]: 共同计划 };
  assert.deepEqual(读赴约们(12, '天台', 24), [
    { m: '101', 地点: '天台', 至楼: 12 },
    { m: '102', 地点: '天台', 至楼: 12 },
    { m: '201', 地点: '天台', 至楼: 12 },
  ]);
  assert.deepEqual(读赴约(12, '天台', 24), { m: '101', 地点: '天台', 至楼: 12 });
  assert.deepEqual(读赴约们(12, '大堂', 24), []);
  assert.deepEqual(读赴约们(12, '天台', 23), []);
  测试聊天变量 = { _赴约: null, [手机邀约计划键]: null };
});

test('旧即时 _赴约 仍按原生命周期读取/清理，不因新计划粗暴放行或永久阻塞', () => {
  测试聊天变量 = { _赴约: { m: '101', 起楼: 10, 至楼: 20 }, [手机邀约计划键]: null };
  assert.deepEqual(读赴约(12), { m: '101', 至楼: 20 });
  assert.equal(读赴约(9), null, '起楼在未来=回档过→作废');
  assert.equal(读赴约(21), null, '过了至楼→回归作息');
  // 旧 _赴约 与新计划互不覆盖读取：读赴约只返回现场的那一份。
  测试聊天变量 = { _赴约: null, [手机邀约计划键]: { ...计划 } };
  assert.deepEqual(读赴约(12, '天台', 24), { m: '101', 地点: '天台', 至楼: 12 });
  测试聊天变量 = { _赴约: { m: '101', 起楼: 10, 至楼: 20 }, [手机邀约计划键]: { ...计划 } };
  assert.deepEqual(读赴约(12, '大堂', 24), { m: '101', 至楼: 20 }, '旧赴约仍跟随玩家，不被新计划现场门拦截');
  测试聊天变量 = { _赴约: null, [手机邀约计划键]: null };
  // 数据层/回合引擎仍保留旧 _赴约 的 CAS 冲突与清理语义。
  assert.match(数据层源码, /function 赴约仍活动/);
  assert.match(数据层源码, /赴约仍活动\(当前赴约, 当前楼\)/);
  assert.match(回合源码, /if \(赴约\?\.m && 离场\.includes\(赴约\.m\)\) _\.set\(vars, '_赴约', null\)/);
});

test('同批多人接受原子并入同一计划；不同批、重复成员与第六人仍失败关闭', () => {
  const 邀请成员 = ['101', '102', '201'];
  const 夏计划 = { ...计划, 邀请成员 };
  const 沈计划 = { ...计划, m: '102', 邀请成员 };
  const 许计划 = { ...计划, m: '201', 邀请成员 };

  const 一人组 = 合并手机邀约计划(null, 夏计划, 20, 10);
  assert.deepEqual(一人组, { 版本: 2, ...计划, 成员: ['101'] });
  assert.deepEqual(手机邀约计划成员(一人组), ['101']);
  assert.equal(手机邀约计划可并入(一人组, 沈计划, 20, 10), true);

  const 两人组 = 合并手机邀约计划(一人组, 沈计划, 20, 10);
  assert.deepEqual(手机邀约计划成员(两人组), ['101', '102']);
  const 三人组 = 合并手机邀约计划(两人组, 许计划, 20, 10);
  assert.deepEqual(手机邀约计划成员(三人组), ['101', '102', '201']);
  assert.equal(手机邀约计划可并入(三人组, 沈计划, 20, 10), false, '同一成员不能接受两次');
  assert.equal(手机邀约计划可并入(三人组, { ...许计划, 创建楼: 11 }, 20, 11), false, '另一批创建锚不能混入');
  assert.equal(手机邀约计划可并入(三人组, { ...许计划, m: '202', 地点: '大堂' }, 20, 10), false, '不同地点不能混组');

  const 五人组 = ['102', '201', '202', '301'].reduce(
    (当前, m) => 合并手机邀约计划(当前, { ...计划, m, 邀请成员: ['101', '102', '201', '202', '301'] }, 20, 10),
    一人组,
  );
  assert.equal(手机邀约计划成员(五人组).length, 手机多人邀约上限);
  assert.equal(
    合并手机邀约计划(五人组, { ...计划, m: '302', 邀请成员: ['302'] }, 20, 10),
    null,
    '第六人不得进入本组',
  );

  const 移除主成员 = 移除手机邀约计划成员(三人组, ['101']);
  assert.deepEqual(手机邀约计划成员(移除主成员), ['102', '201']);
  assert.equal(移除主成员.m, '102');
  assert.equal(移除手机邀约计划成员(三人组, ['101', '102', '201']), null);

  // 接受回复 + 共同计划创建/追加仍在 写库增量 同一个 updateVariablesWith 回调中 CAS。
  const 增量写 = 截源(数据层源码, 'async function 写库增量(', 'function 赴约仍活动');
  assert.match(增量写, /邀约计划提交\?: 手机邀约计划/);
  assert.match(增量写, /合并后邀约计划 = 合并手机邀约计划\(当前计划, 计划, 当前绝对时段, 当前楼\)/);
  assert.match(增量写, /if \(!合并后邀约计划\) return vars/);
  assert.match(增量写, /if \(合并后邀约计划\) _\.set\(vars, 手机邀约计划键, 合并后邀约计划\)/);
  const 邀约段 = 截源(交互源码, 'const 手机邀约队列', '// ── 楼务群接话');
  assert.match(邀约段, /当前赴约条\?\.来源 !== '旧即时' && 手机邀约计划可并入\(读手机邀约计划\(\), 计划, 钟, 楼\)/);
  assert.match(邀约段, /seededRandom\(计划\.目标绝对时段, m, 计划\.地点, '赴约'\) < 率/);
});

test('AI 失败/时间线变化不写计划且释放锁；表单取消不调用业务端口、不产生冷却', () => {
  const 邀约段 = 截源(交互源码, 'const 手机邀约队列', '// ── 楼务群接话');
  // 每个 await 后租约复核，时间线变化令旧请求失效，不得迟到写回复或计划。
  assert.ok((邀约段.match(/if \(!邀约仍有效\(\)\) return;/g) ?? []).length >= 3, '每个 await 后都必须租约复核');
  assert.match(邀约段, /邀约目标合法\(计划\.目标绝对时段, 钟\)/, '异步队列内重验目标仍属当前周且不早于当前钟');
  assert.match(邀约段, /finally\s*\{\s*结束会话输入\(输入租约\)/, '输入锁 finally 释放');
  // 表单取消/返回：零消息、零冷却、零预约；发送按钮才会取得端口并按名单逐人调用。
  assert.match(邀请页源码, /取消\.addEventListener\('click', 回单聊\)/);
  assert.equal((邀请页源码.match(/const 端口 = 取渲染业务端口\(\)/g) ?? []).length, 1, '业务端口只在发送按钮取得一次');
  assert.match(邀请页源码, /void 端口\.约多人出来\(邀请成员, 共享安排\)/);
  assert.doesNotMatch(邀请页源码, /for \(const 门牌号 of 邀请成员\)/, '批次循环不得留在 UI 层重新取聊天身份');
  assert.doesNotMatch(邀请页源码, /取消\.addEventListener[\s\S]{0,120}约多人出来/);
});

test('多人邀请批次冻结聊天、楼层、时钟、锚消息和租约世代，切档或加楼后不继续', () => {
  const 批次段 = 截源(交互源码, 'async function 约多人出来(', '// ── 楼务群接话');
  assert.match(批次段, /const 批次聊天ID = 当前聊天ID\(\)/);
  assert.match(批次段, /const 批次楼 = 末楼\(\)/);
  assert.match(批次段, /const 批次钟 = 当前手机绝对时段\(\)/);
  assert.match(批次段, /创建手机时间线租约\(批次聊天ID, 批次楼, SillyTavern\.chat \?\? \[\], 批次钟\)/);
  assert.match(批次段, /末楼\(\) === 批次楼/);
  assert.match(批次段, /手机时间线租约仍有效\(批次租约, 当前聊天ID\(\), SillyTavern\.chat \?\? \[\], 当前手机绝对时段\(\)\)/);
  assert.match(批次段, /for \(const m of 邀请成员\)/);
  assert.match(批次段, /await 约出来\(m, \{ m, \.\.\.安排, 邀请成员: \[\.\.\.邀请成员\] \}, 批次仍有效\)/);
  assert.ok((批次段.match(/if \(!批次仍有效\(\)\) return;/g) ?? []).length >= 2, '每名成员前后都复核整批身份');
});

test('时间推进不清未来计划；删楼/回档裁到创建点前清；重开清；反感离场清活动计划', () => {
  // 时间推进/睡眠越过目标：计划数据不清除，只由世界钟派生为已过期（不再占用、不出现在错误地点）。
  assert.equal(手机邀约计划需裁剪(计划, 12, 30), false);
  assert.equal(手机邀约计划需裁剪(计划, 12, 24), false);
  // 删楼/回档到创建楼之前 → 清。
  assert.equal(手机邀约计划需裁剪(计划, 9, 21), true);
  // 回档到创建钟之前 → 清。
  assert.equal(手机邀约计划需裁剪(计划, 12, 19), true);
  // 时间撤销回到创建之后、目标之前 → 保留（派生回待赴约）。
  assert.equal(手机邀约计划需裁剪(计划, 12, 21), false);
  assert.equal(手机邀约计划需裁剪(null, 12, 21), false);
  // 时间推进清场键不得包含新预约计划（普通时间推进仍清旧 _赴约，但不清未来计划）。
  assert.doesNotMatch(时间撤销源码, /'_手机邀约计划'/, '时间推进清场/恢复键不得包含新预约计划');
  assert.doesNotMatch(索引源码, /vars\._手机邀约计划 = null/, '写时间结束场景不得清未来计划');
  // 裁手机时间线按 创建楼/创建绝对时段 清未来计划；不塞进无条件清场集合。
  assert.match(回合源码, /手机邀约计划需裁剪\(邀约计划 as 手机邀约计划 \| null, 楼层, 目标钟\)/);
  assert.match(回合源码, /_\.set\(vars, '_手机邀约计划', null\)/);
  assert.doesNotMatch(
    回合源码,
    /时间线清场变量键 = \[\.\.\.回合变量键, '_上次回合', '_上次隔离回合', '_时间撤销点', '_手机邀约计划'\]/,
    '不得把新键塞进无条件清场集合',
  );
  // 重开清新键。
  assert.match(回合源码, /'_手机邀约计划',/);
  // 连续反感离场只移除本人；旧单人计划清空，共同邀约其余成员继续保留。
  assert.match(回合源码, /手机邀约计划成员\(邀约计划\)\.some\(m => 离场\.includes\(m\)\)/);
  assert.match(回合源码, /移除手机邀约计划成员\(邀约计划, 离场\)/);
});

test('WeUI 安排页：页面路由、返回链、分组列表、绿色选中、禁用发送与手机 CSS 作用域', () => {
  // 页面路由：invite / invite-pick 扩展进 手机页面名 与调度器分派。
  assert.match(
    挂载源码,
    /'chats' \| 'chat' \| 'moments' \| 'call' \| 'talk' \| 'settings' \| 'invite' \| 'invite-pick'/,
  );
  assert.match(挂载源码, /邀约\?: \{ 选星期\?: 星期名; 选时段\?: 周作息时段; 选地点\?: string; 选成员\?: string\[\] \};/);
  assert.match(挂载源码, /选择\?: '日期' \| '时段' \| '地点';/);
  assert.match(渲染index源码, /当前页\.名 === 'invite' \|\| 当前页\.名 === 'invite-pick'\) 渲染invite\(上下文\)/);
  // 返回链：选择页 → 安排页；安排页返回/取消 → 原妻单聊。
  assert.match(邀请页源码, /写入当前页\(\{ 名: 'invite', 会话: m, 邀约: 当前页\.邀约 \}\)/);
  assert.match(邀请页源码, /写入当前页\(\{ 名: 'chat', 会话: m \}\)/);
  // 成员多选最多五人；多人地点只保留每位成员都合法的共同地点，角色私宅只对单人开放。
  assert.match(邀请页源码, /共同受邀（\$\{选成员\.length\}\/\$\{手机多人邀约上限\}）/);
  assert.match(邀请页源码, /选成员\.length >= 手机多人邀约上限/);
  assert.match(邀请页源码, /选成员\.length === 1 \? \[m\] : \[\]/);
  assert.match(邀请页源码, /地点们\.filter\(地点 => 多人邀约地点合法\(地点, 选成员\)\)/);
  assert.match(邀请页源码, /\['私人地点', 私人 as string\[\]\],\s*\['公共场所', \[\.\.\.邀约公共地点列表\]\]/);
  // 绿色选中、逐人发送、共同 consent 说明与禁用发送。
  assert.match(邀请页源码, /'<b class="ok">✓<\/b>'/);
  assert.match(邀请页源码, /发\.disabled = !完成/);
  assert.match(邀请页源码, /多人邀约地点合法\(选地点, 选成员\)/);
  assert.match(邀请页源码, /答应见面不等于答应亲密行为/);
  assert.match(邀请页源码, /发送多人邀约/);
  assert.match(邀请页源码, /void 端口\.约多人出来\(邀请成员, 共享安排\)/);
  assert.doesNotMatch(邀请页源码, /for \(const 门牌号 of 邀请成员\)/, 'UI 不得拥有跨聊天的异步批次循环');
  // 时间变化/重绘时重新规范当前选择。
  assert.match(邀请页源码, /if \(选星期 && !日选项\)/);
  // 变量未就绪/无合法选项 → 失败关闭回单聊并提示，不能提交陈旧目标。
  assert.match(邀请页源码, /钟 < 0/);
  assert.match(邀请页源码, /eventEmit\('人妻公寓:提示', '微信数据未就绪，暂时无法安排邀约。'\)/);
  // 手机 CSS 全部限定 ROOT_ID 作用域，窄画幅可滚动、触控行 ≥44px。
  assert.match(皮肤源码, /#\$\{ROOT_ID\} \.rqp-invite\{/);
  assert.match(皮肤源码, /#\$\{ROOT_ID\} \.rqp-igroup \.rqp-irow\{[^}]*min-height:52px/);
  assert.match(皮肤源码, /#\$\{ROOT_ID\} \.rqp-ibtn\{/);
  assert.match(皮肤源码, /#\$\{ROOT_ID\} \.rqp-ipick\{/);
  assert.match(皮肤源码, /overflow-y:auto/);
});

test('客户端地图在目标时段显示全部接受成员；待赴约不提前现身且住院成员不出现', () => {
  // 客户端直连纯函数模块（不得经手机系统门面）。
  assert.match(
    app源码,
    /import \{ 手机邀约计划成员, 手机邀约计划状态, type 手机邀约计划 \} from '\.\.\/\.\.\/脚本\/游戏逻辑\/手机\/邀约计划';/,
  );
  // 旧即时赴约仍跟随玩家；新计划把全部接受成员映射到约定地点，并过滤医院硬锁。
  assert.match(app源码, /赴约妻们\.value = \[\{ m: p\.m, 地点: 当前房间\.value \?\? '大堂' \}\]/);
  assert.match(app源码, /手机邀约计划状态\(计划, 绝对时段\.value, 楼\) === '赴约中'/);
  assert.match(app源码, /赴约妻们\.value = 手机邀约计划成员\(计划\)/);
  assert.match(app源码, /\.filter\(m => !处于医院硬锁\(data\.value, m\)\)/);
  assert.match(app源码, /\.map\(m => \(\{ m, 地点: 计划!\.地点 \}\)\)/);
  const 位置函数开始 = app源码.indexOf('function 妻现位');
  const 位置函数 = app源码.slice(位置函数开始, app源码.indexOf('\n}', 位置函数开始));
  assert.match(位置函数, /赴约妻们\.value\.find\(项 => 项\.m === m\)/);
  assert.match(位置函数, /if \(赴约\) return 赴约\.地点/);
  // 当面交互门：所有实际到场成员都由同一个多人现场读口放行。
  assert.match(索引源码, /读赴约们\(楼, 场\.房间id, data\.系统\._绝对时段, data\)\.some\(约 => 约\.m === m\)/);
});

test('快照系统接线：多人现场读口返回全部接受成员，旧单人门面与待赴约边界保留', () => {
  assert.match(快照源码, /export function 读赴约们\(/);
  assert.match(快照源码, /export function 读赴约\(/, '旧消费者仍有首成员兼容门面');
  assert.match(快照源码, /手机邀约计划状态\(计划, 绝对时段, 楼层\) !== '赴约中'\) return \[\]/, '待赴约不能返回现场');
  assert.match(
    快照源码,
    /房间id !== undefined && 房间id !== 计划!\.地点\) return \[\]/,
    '所有现场入口校验房间等于约定地点',
  );
  assert.match(快照源码, /return 手机邀约计划成员\(计划\)[\s\S]*\.filter\(m => !data \|\| !处于医院硬锁\(data, m\)\)/);
  assert.match(
    快照源码,
    /赴约人数 = 读赴约们\(楼层, 房间id, 取绝对时段\(data\), data\)\.length/,
    '入住登场按真实到场人数占用场景',
  );
  assert.match(快照源码, /约 && !约\.地点 && 约\.至楼 - 楼层 <= 1/, '“时间不早”提示只属于旧即时赴约的两楼窗口');
});

test('完整提交校验 手机邀约计划可提交：门牌/一致性/地点白名单/安全整数/当前周目标任一不满足即拒绝', () => {
  const 好 = { m: '101', 创建楼: 10, 创建绝对时段: 20, 目标绝对时段: 24, 地点: '天台' };
  assert.equal(手机邀约计划可提交(好, '101', 20, 10), true);
  assert.equal(手机邀约计划可提交(好, '101', 20), true, '未提供提交楼时只做锚非未来检查');
  // 门牌无效 / 计划.m 与目标角色不一致。
  assert.equal(手机邀约计划可提交(好, '999', 20, 10), false);
  assert.equal(手机邀约计划可提交(好, '102', 20, 10), false, '计划.m 必须等于目标角色');
  // 地点白名单外 / 角色房间不开放。
  assert.equal(手机邀约计划可提交({ ...好, 地点: '垃圾房' }, '101', 20, 10), false);
  assert.equal(手机邀约计划可提交({ ...好, 地点: '102' }, '101', 20, 10), false, '别人的房间不开放');
  assert.equal(
    手机邀约计划可提交({ ...好, 邀请成员: ['101', '101'] }, '101', 20, 10),
    false,
    '损坏的重复成员列表必须拒绝',
  );
  assert.equal(
    手机邀约计划可提交({ ...好, 邀请成员: ['101', '102'], 地点: '101' }, '101', 20, 10),
    false,
    '多人不能把单个角色私宅伪造成共同地点',
  );
  // 小数 / NaN / Infinity / 负数 / 畸形对象。
  assert.equal(手机邀约计划可提交({ ...好, 创建楼: 10.5 }, '101', 20, 10), false);
  assert.equal(手机邀约计划可提交({ ...好, 创建绝对时段: NaN }, '101', 20, 10), false);
  assert.equal(手机邀约计划可提交({ ...好, 目标绝对时段: Infinity }, '101', 20, 10), false);
  assert.equal(手机邀约计划可提交({ ...好, 目标绝对时段: -3 }, '101', 20, 10), false);
  assert.equal(手机邀约计划可提交({ ...好, m: undefined }, '101', 20, 10), false);
  assert.equal(手机邀约计划可提交(null, '101', 20, 10), false);
  assert.equal(手机邀约计划可提交('垃圾', '101', 20, 10), false);
  // 目标必须属于提交时当前周且不早于提交钟；创建锚不得晚于提交真值。
  assert.equal(手机邀约计划可提交({ ...好, 目标绝对时段: 12 }, '101', 20, 10), false, '目标早于当前钟');
  assert.equal(手机邀约计划可提交({ ...好, 目标绝对时段: 42 }, '101', 20, 10), false, '目标落出本周');
  assert.equal(手机邀约计划可提交({ ...好, 创建绝对时段: 21 }, '101', 20, 10), false, '创建钟在未来');
  assert.equal(手机邀约计划可提交({ ...好, 创建楼: 11 }, '101', 20, 10), false, '创建楼在未来');
  // 合法组合仍通过：当前时段立即见面、周日深夜收尾周、302/角色房间地点。
  assert.equal(
    手机邀约计划可提交({ m: '101', 创建楼: 5, 创建绝对时段: 20, 目标绝对时段: 20, 地点: '302' }, '101', 20, 5),
    true,
  );
  assert.equal(
    手机邀约计划可提交({ m: '102', 创建楼: 5, 创建绝对时段: 39, 目标绝对时段: 41, 地点: '102' }, '102', 39, 5),
    true,
  );
});

test('计划状态机对小数/NaN/Infinity/负数/畸形数值安全判无效：合法目标必须是整数时段', () => {
  assert.equal(手机邀约计划状态({ ...计划, 目标绝对时段: 24.5 }, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, 创建楼: 10.5 }, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, 创建绝对时段: 19.9 }, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, 目标绝对时段: Infinity }, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, 创建绝对时段: -1 }, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, 创建楼: -1 }, 21, 12), '无效');
  assert.equal(手机邀约计划状态({ ...计划, 目标绝对时段: -3 }, 21, 12), '无效');
  assert.equal(
    手机邀约计划状态({ ...计划, 目标绝对时段: 66 }, 21, 12),
    '无效',
    '损坏值不得跨到创建时的下一周并长期占用',
  );
  assert.equal(手机邀约计划状态({ ...计划, m: { 恶意: 1 } }, 21, 12), '无效');
  // 整数时段照常通过状态机。
  assert.equal(手机邀约计划状态(计划, 21, 12), '待赴约');
  assert.equal(手机邀约计划状态(计划, 24, 12), '赴约中');
});

test('读手机邀约计划：损坏/部分旧档安全返回 null，拒绝小数/负数/非法门牌/畸形对象', () => {
  测试聊天变量 = { [手机邀约计划键]: { ...计划 } };
  assert.deepEqual(读手机邀约计划(), { m: '101', 创建楼: 10, 创建绝对时段: 20, 目标绝对时段: 24, 地点: '天台' });
  测试聊天变量 = { [手机邀约计划键]: { ...计划, 目标绝对时段: 24.5 } };
  assert.equal(读手机邀约计划(), null, '小数时段');
  测试聊天变量 = { [手机邀约计划键]: { ...计划, 创建楼: NaN } };
  assert.equal(读手机邀约计划(), null, 'NaN');
  测试聊天变量 = { [手机邀约计划键]: { ...计划, 创建绝对时段: Infinity } };
  assert.equal(读手机邀约计划(), null, 'Infinity');
  测试聊天变量 = { [手机邀约计划键]: { ...计划, 创建楼: -1 } };
  assert.equal(读手机邀约计划(), null, '负楼');
  测试聊天变量 = { [手机邀约计划键]: { ...计划, 创建绝对时段: -1 } };
  assert.equal(读手机邀约计划(), null, '负钟');
  测试聊天变量 = { [手机邀约计划键]: { ...计划, 目标绝对时段: -5 } };
  assert.equal(读手机邀约计划(), null, '负目标');
  测试聊天变量 = { [手机邀约计划键]: { ...计划, m: '999' } };
  assert.equal(读手机邀约计划(), null, '非法门牌');
  测试聊天变量 = { [手机邀约计划键]: { m: '101' } };
  assert.equal(读手机邀约计划(), null, '缺字段');
  测试聊天变量 = { [手机邀约计划键]: { ...计划, 地点: { 恶意: 1 } } };
  assert.equal(读手机邀约计划(), null, '畸形地点');
  测试聊天变量 = { [手机邀约计划键]: '垃圾' };
  assert.equal(读手机邀约计划(), null, '非对象');
  测试聊天变量 = {};
  assert.equal(读手机邀约计划(), null, '缺失');
});

test('写库增量 邀约计划提交：与活动旧 _赴约 同一回调最终 CAS；过期旧赴约不阻塞，伪造锚点整次不写', async () => {
  const 原updateVariablesWith = globalThis.updateVariablesWith;
  const 原getLastMessageId = globalThis.getLastMessageId;
  const 原SillyTavern = globalThis.SillyTavern;
  const 原Mvu = globalThis.Mvu;
  globalThis.updateVariablesWith = async cb => {
    cb(测试聊天变量);
  };
  globalThis.getLastMessageId = () => 10;
  globalThis.SillyTavern = { chat: [{ mes: '锚', is_user: true, swipe_id: 0 }] };
  const 完整MVU快照 = Schema.parse({ 系统: { _绝对时段: 20 } });
  globalThis.Mvu = { getMvuData: () => ({ stat_data: 完整MVU快照 }) };
  const 好计划 = { m: '101', 创建楼: 10, 创建绝对时段: 20, 目标绝对时段: 24, 地点: '天台' };
  try {
    // 旧即时 _赴约 仍活动（只带 邀约计划提交，未带 赴约提交）→ 整次回调不写微信、不写计划。
    测试聊天变量 = { _赴约: { m: '101', 起楼: 5, 至楼: 15 }, [手机邀约计划键]: null };
    assert.equal(await 写库增量({ 新圈: [], 新消息: [], 节拍改: {}, 邀约计划提交: 好计划 }), false);
    assert.equal(测试聊天变量[手机邀约计划键], null, '活动旧赴约占用时不写计划');
    assert.equal(测试聊天变量._微信, undefined, '占用时不写微信');
    // 已有待赴约/赴约中计划（另一位妻已接受）→ 同样整次不写。
    测试聊天变量 = {
      _赴约: null,
      [手机邀约计划键]: { m: '102', 创建楼: 8, 创建绝对时段: 18, 目标绝对时段: 24, 地点: '大堂' },
    };
    assert.equal(await 写库增量({ 新圈: [], 新消息: [], 节拍改: {}, 邀约计划提交: 好计划 }), false);
    assert.equal(测试聊天变量[手机邀约计划键].m, '102', '已有计划不被覆盖');
    // 旧 _赴约 已过期（至楼 已过）→ 不阻塞；通过 CAS 后计划与接受回复同一回调写入。
    测试聊天变量 = { _赴约: { m: '101', 起楼: 5, 至楼: 8 }, [手机邀约计划键]: null };
    const 已写 = await 写库增量({
      新圈: [],
      新消息: [{ 楼: 10, 时: 20, 会话: '101', 发: '我', 文: '星期三中午有空吗?', 标识: 'msg-1' }],
      节拍改: {},
      邀约计划提交: 好计划,
    });
    assert.equal(已写, true);
    assert.equal(测试聊天变量._微信.消息.length, 1, '接受回复与计划同回调写入');
    assert.deepEqual(测试聊天变量[手机邀约计划键], { 版本: 2, ...好计划, 成员: ['101'] });
    // 同一批、同锚、同时间地点的第二名接受者在同一回调原子追加。
    const 沈计划 = { ...好计划, m: '102', 邀请成员: ['101', '102'] };
    assert.equal(
      await 写库增量({
        新圈: [],
        新消息: [{ 楼: 10, 时: 20, 会话: '102', 发: '对方', 文: '好，我会到。' }],
        节拍改: {},
        邀约计划提交: 沈计划,
      }),
      true,
    );
    assert.deepEqual(测试聊天变量[手机邀约计划键].成员, ['101', '102']);
    assert.equal(测试聊天变量._微信.消息.at(-1)?.会话, '102', '第二名接受回复与成员追加在同一回调落地');
    // 重复成员不能留下第二条接受回复，也不能改写成员顺序。
    assert.equal(await 写库增量({ 新圈: [], 新消息: [], 节拍改: {}, 邀约计划提交: 沈计划 }), false);
    assert.deepEqual(测试聊天变量[手机邀约计划键].成员, ['101', '102']);
    // 防御性最终校验：未来/过去锚点、非法地点、非整数目标 → 整次不写。
    测试聊天变量 = { _赴约: null, [手机邀约计划键]: null };
    assert.equal(await 写库增量({ 新圈: [], 新消息: [], 节拍改: {}, 邀约计划提交: { ...好计划, 创建楼: 99 } }), false);
    assert.equal(
      await 写库增量({ 新圈: [], 新消息: [], 节拍改: {}, 邀约计划提交: { ...好计划, 创建绝对时段: 99 } }),
      false,
    );
    assert.equal(
      await 写库增量({ 新圈: [], 新消息: [], 节拍改: {}, 邀约计划提交: { ...好计划, 创建绝对时段: 9 } }),
      false,
    );
    assert.equal(
      await 写库增量({ 新圈: [], 新消息: [], 节拍改: {}, 邀约计划提交: { ...好计划, 地点: '垃圾房' } }),
      false,
    );
    assert.equal(
      await 写库增量({ 新圈: [], 新消息: [], 节拍改: {}, 邀约计划提交: { ...好计划, 目标绝对时段: 24.5 } }),
      false,
    );
    assert.equal(测试聊天变量[手机邀约计划键], null);
  } finally {
    globalThis.updateVariablesWith = 原updateVariablesWith;
    globalThis.getLastMessageId = 原getLastMessageId;
    globalThis.SillyTavern = 原SillyTavern;
    globalThis.Mvu = 原Mvu;
  }
});

test('粘滞妻位置回归：无预约时仍在有效粘滞里的妻子位置保持为当前房间', () => {
  // 读粘滞：只认当前房间、非未来楼戳的粘滞。
  测试聊天变量 = { _粘滞: { 位置: '管理员室', 楼: 5, 们: ['101'] }, [手机邀约计划键]: null };
  assert.deepEqual(读粘滞(10, '管理员室'), ['101']);
  assert.deepEqual(读粘滞(10, '天台'), [], '房间不匹配不粘滞');
  assert.deepEqual(读粘滞(4, '管理员室'), [], '粘滞楼戳在未来=回档过,作废');
  // 快照接线：粘滞同场 OR 当前地点预约同场 才返回当前房间；其余按作息推算。
  const 位置段 = 截源(快照源码, 'const 反感连续', 'if (妻同场)');
  assert.match(位置段, /读粘滞\(楼层, 房间id\)\.includes\(m\) \|\| 赴约中/, '粘滞同场或预约同场才算现场');
  assert.match(位置段, /妻位置 = 房间id && \(/);
  assert.match(位置段, /\? 房间id : 妻位置推算\(m, 绝对时段, data\.户\[m\]\)/);
  // 不得放宽新预约的房间门：多人现场读口仍校验 房间===约定地点 且 当前钟===目标钟。
  assert.match(快照源码, /房间id !== undefined && 房间id !== 计划!\.地点\) return \[\]/);
  测试聊天变量 = {};
});

test('缺 _微信 的损坏/部分旧档：回档仍按创建点裁剪 _手机邀约计划', () => {
  // 独立计划裁剪必须位于 `_微信` 缺失提前返回之前，微信库自身裁剪语义不变。
  const 裁枝段 = 截源(回合源码, 'export function 裁手机时间线(', "if (!库 || typeof 库 !== 'object') return;");
  assert.match(
    裁枝段,
    /手机邀约计划需裁剪\(邀约计划 as 手机邀约计划 \| null, 楼层, 目标钟\)/,
    '计划裁剪在 _微信 缺失提前返回之前',
  );
  assert.match(裁枝段, /_\.set\(vars, '_手机邀约计划', null\)/);
});

test('数据层最终 CAS 接线：旧即时赴约阻塞；同批共同计划合并，其他冲突整次不写', () => {
  const 计划CAS段 = 截源(数据层源码, 'if (增.邀约计划提交) {', 'function 赴约仍活动');
  assert.match(
    计划CAS段,
    /const 当前赴约 = \(_\.get\(vars, '_赴约'\) \?\? null\)/,
    '邀约计划提交 分支必须自己重读活动旧 _赴约',
  );
  assert.match(计划CAS段, /const 当前计划 = \(_\.get\(vars, 手机邀约计划键\) \?\? null\)/, '使用导出键常量读当前计划');
  assert.match(计划CAS段, /if \(赴约仍活动\(当前赴约, 当前楼\)\) return vars;/, '活动旧 _赴约 占用则整次回调不写');
  assert.match(
    计划CAS段,
    /合并后邀约计划 = 合并手机邀约计划\(当前计划, 计划, 当前绝对时段, 当前楼\)/,
    '同批同锚成员经纯函数合并，其他活动计划由合并函数拒绝',
  );
  assert.match(计划CAS段, /if \(!合并后邀约计划\) return vars;/);
  assert.match(
    计划CAS段,
    /手机邀约计划可提交\(计划, 计划\.m, 当前绝对时段, 当前楼\)/,
    '数据层防御性校验不只信 UI/业务层',
  );
  assert.match(计划CAS段, /if \(合并后邀约计划\) _\.set\(vars, 手机邀约计划键, 合并后邀约计划\)/);
  assert.match(
    计划CAS段,
    /计划\.创建楼 !== 当前楼 \|\|\s*计划\.创建绝对时段 !== 当前绝对时段/,
    '创建锚必须严格等于最终回调可见的当前真值',
  );
  // 业务层在写玩家消息之前做完整校验（零消息、零冷却、零预约）。
  const 邀约段 = 截源(交互源码, 'const 手机邀约队列', '// ── 楼务群接话');
  assert.match(
    邀约段,
    /if \(!手机邀约计划可提交\(计划, m, 入口钟, 楼\)\) \{/,
    '约出来 在占输入锁/写玩家消息前完整校验',
  );
  assert.doesNotMatch(邀约段, /刚刚临时有点事，恐怕不能赴约了……改天好吗？/, 'CAS 冲突也不得使用固定角色回复');
  assert.match(邀约段, /生成邀约裁定回复/, '接受、拒绝与 CAS 改口都由同一个数据驱动生成器表达');
});

test('WeUI 安排页收口：未入住失败关闭、地点显示文案、完成摘要与“发送邀约”主按钮', () => {
  // 安排页与选择页都验证角色确实存在于 上下文.data.户[m]（静态配置存在但未入住→失败关闭零写入）。
  assert.match(邀请页源码, /上下文\.data\.户\[m\]/);
  assert.match(邀请页源码, /她还没有入住公寓，暂时无法安排邀约。/);
  assert.match(邀请页源码, /上下文\.data\?\.户\[m\]/);
  // 地点显示文案：302（你家）/ 管理员室 / 妻名的房间（门牌）；公共场所保持原名；持久值仍是真实房间 ID。
  assert.match(邀请页源码, /'302（你家）'/);
  assert.match(邀请页源码, /的房间（\$\{m\}）/, '妻名房间文案');
  assert.match(邀请页源码, /\.includes\(地点\) \? 地点 : \(查房间\(地点\)\?\.名称 \?\? 地点\)/, '公共地点保持原名');
  // 摘要同时显示成员、星期时段和地点；单人/多人按钮均由同一完成门控制。
  assert.match(邀请页源码, /成员名\.join\('、'\).*选星期\}·\$\{选时段\} \/ \$\{地点名\}/s);
  assert.match(邀请页源码, /选成员\.length > 1 \? `发送多人邀约（\$\{选成员\.length\}人）` : '发送邀约'/);
  assert.match(邀请页源码, /发\.disabled = !完成/);
  assert.match(邀请页源码, /每个人会独立回复；答应见面不等于答应亲密行为/);
  // 微信设置页/内置网页式样式不变：浅灰底/白色分组/绿色主按钮/绿色勾，不是聊天气泡弹层。
  assert.match(皮肤源码, /#\$\{ROOT_ID\} \.rqp-invite\{/);
  assert.match(皮肤源码, /#\$\{ROOT_ID\} \.rqp-ibtn\{/);
});
