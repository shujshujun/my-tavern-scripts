/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
let 聊天变量 = {};
globalThis.getVariables = () => 聊天变量;
globalThis.updateVariablesWith = async fn => {
  fn(聊天变量);
};
globalThis.insertOrAssignVariables = () => undefined;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  捕获保护快照,
  回滚保护字段,
  清保护快照,
  每日堕落上限,
} = require('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts');
const { 构造AI可写变量范围, 扩展精确亲密妻 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const { 读取关系线索 } = require('../../src/人妻公寓/脚本/游戏逻辑/阶段线路系统.ts');

const 引擎源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 档案卡源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url), 'utf8');

/** 建一户 101；绝对时段 0=第1天,6=第2天(六时段制)。 */
function 建数据(阶段 = 3, 堕落 = 50, 日账 = undefined, 绝对时段 = 0) {
  const data = Schema.parse({ 户: { '101': 创建户节点(0) } });
  data.户['101'].妻.当前阶段 = 阶段;
  data.户['101'].妻.堕落值 = 堕落;
  if (日账) data.户['101'].妻._堕落日账 = 日账;
  data.系统._绝对时段 = 绝对时段;
  return data;
}

function 完成线路(data) {
  data.户['101'].妻._阶段线路 = { 目标阶段: 2, 完成位图: 15, 活跃节点: 4, 节点起始楼: 0 };
}

/** 守护一次单妻回合；亲密=false 时不扩展精确亲密权限。 */
function 守护(data, ai, 楼层, { 亲密 = true } = {}) {
  // 捕获保护快照 会读写全局聊天变量里的晋阶镜像(阶段取大);每次清空,避免上一用例的
  // 101 阶段镜像把本用例的阶段抬高、令线路冻结失效。产品判定只看快照自身,与镜像无关。
  聊天变量 = {};
  捕获保护快照(data);
  try {
    const 范围 = 构造AI可写变量范围(data, ['101'], ['101'], [], { 只读: false, 亲密场景: false });
    const 可写 = 亲密 ? 扩展精确亲密妻(范围, { '101': 1 }) : 范围;
    return 回滚保护字段(ai, ['101'], 可写, 楼层, ai);
  } finally {
    清保护快照();
  }
}

// ─────────────────────────────────────────────
// A.日额度按最终落地值记(守护系统)
// ─────────────────────────────────────────────

test('A1 线路封顶按最终落地值记日账:19+合法候选未完成线路 → 终值19、日账+0', () => {
  const data = 建数据(1, 19, { 日: 1, 值: 0 });
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 20;
  守护(data, ai, 8);
  assert.equal(ai.户['101'].妻.堕落值, 19, '线路未完成 +1 被挡在门前');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 1, 值: 0 }, '被线路挡住的增长不空耗当日额度');
});

test('A2 18+3、线路封顶19 → 终值19、日账只+1', () => {
  const data = 建数据(1, 18, { 日: 1, 值: 0 });
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 21;
  守护(data, ai, 8);
  assert.equal(ai.户['101'].妻.堕落值, 19, '线路封顶在19');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 1, 值: 1 }, '只记实际落地 +1,不记满 +3');
});

test('A3 日账7、可涨+3 → 只落/记+1', () => {
  const data = 建数据(3, 50, { 日: 1, 值: 7 });
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 53;
  守护(data, ai, 8);
  assert.equal(ai.户['101'].妻.堕落值, 51, '当日额度只剩1');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 1, 值: 8 }, '日账到 每日堕落上限');
});

test('A4 跨天从0计:昨日账满今天仍可+3', () => {
  const data = 建数据(3, 50, { 日: 1, 值: 8 }, 6); // 绝对时段6=第2天
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 53;
  守护(data, ai, 8);
  assert.equal(ai.户['101'].妻.堕落值, 53, '新的一天额度恢复,+3 全落');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 2, 值: 3 }, '日账记到新的一天');
});

test('A5 负变化不入账', () => {
  const data = 建数据(3, 50, { 日: 1, 值: 3 });
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 48;
  守护(data, ai, 8);
  assert.equal(ai.户['101'].妻.堕落值, 48, '合法 -2 落地');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 1, 值: 3 }, '负变化不改变日账');
});

test('A6 无亲密权限:堕落与日账整体恢复快照', () => {
  const data = 建数据(3, 50, { 日: 1, 值: 5 });
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 53;
  守护(data, ai, 8, { 亲密: false });
  assert.equal(ai.户['101'].妻.堕落值, 50, '无亲密写权堕落拍回');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 1, 值: 5 }, '无亲密写权日账恢复');
});

test('A7 无消息楼:日账不动,±3兜底仍生效', () => {
  const data = 建数据(3, 50, { 日: 1, 值: 7 });
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 53;
  守护(data, ai, undefined); // 不传楼层 → 钟日为 undefined
  assert.equal(ai.户['101'].妻.堕落值, 53, '无楼层时只走±3,堕落可 +3');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 1, 值: 7 }, '无楼层日账不动');
});

test('A8 冷落余波冻结:堕落与日账都锁住', () => {
  const data = 建数据(3, 50, { 日: 1, 值: 5 });
  data.户['101'].妻._冷落余波.状态 = '安抚中';
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 53;
  守护(data, ai, 8);
  assert.equal(ai.户['101'].妻.堕落值, 50, '冷落余波冻结堕落');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 1, 值: 5 }, '冷落余波冻结日账');
});

test('A9 超±3:堕落与日账整体拍回', () => {
  const data = 建数据(3, 50, { 日: 1, 值: 0 });
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 55;
  守护(data, ai, 8);
  assert.equal(ai.户['101'].妻.堕落值, 50, '超±3整项回滚');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 1, 值: 0 }, '超±3不记日账');
});

test('A10 合法正候选即使被线路或日cap挡住仍回传,供冷落时钟使用', () => {
  // 线路挡住的合法 +1
  const 线路 = 建数据(1, 19, { 日: 1, 值: 0 });
  const ai线路 = structuredClone(线路);
  ai线路.户['101'].妻.堕落值 = 20;
  const r线路 = 守护(线路, ai线路, 8);
  assert.equal(ai线路.户['101'].妻.堕落值, 19, '线路挡在门前');
  assert.deepEqual(r线路.合法正候选, { 101: ['堕落值'] }, '线路挡住的合法候选仍回传');
  assert.deepEqual(r线路.合法正候选门牌, ['101']);

  // 日cap挡住的合法 +3(只落1)
  const 日 = 建数据(3, 50, { 日: 1, 值: 7 });
  const ai日 = structuredClone(日);
  ai日.户['101'].妻.堕落值 = 53;
  const r日 = 守护(日, ai日, 8);
  assert.equal(ai日.户['101'].妻.堕落值, 51, '日cap只落1');
  assert.deepEqual(r日.合法正候选, { 101: ['堕落值'] }, '日cap挡住的合法候选仍回传');
});

test('A11 线路完成后同日在门前可再+1,不再空耗', () => {
  const data = 建数据(1, 19, { 日: 1, 值: 0 });
  完成线路(data);
  const ai = structuredClone(data);
  ai.户['101'].妻.堕落值 = 20;
  守护(data, ai, 8);
  assert.equal(ai.户['101'].妻.堕落值, 20, '线路完成不再挡门,+1 落地');
  assert.deepEqual(ai.户['101'].妻._堕落日账, { 日: 1, 值: 1 }, '落地 +1 正常记日账');
});

test('A12 共享每日堕落上限导出,供 UI 免复制魔数', () => {
  assert.equal(每日堕落上限, 8);
});

// ─────────────────────────────────────────────
// B.跨轮内置解析待补彻底删除(回合引擎)
// ─────────────────────────────────────────────

test('B1 内置解析待补声明与全部读写、跨轮拼接文案彻底消失', () => {
  assert.doesNotMatch(引擎源码, /内置解析待补/, '无跨轮待补声明/读写');
  assert.doesNotMatch(引擎源码, /【上一轮待补结算】|【上一轮玩家行动】|下一轮自动补/, '无上一轮拼接文案');
  assert.doesNotMatch(引擎源码, /待补\.行动|待补\.正文/, '不读取上一轮行动/正文');
  // 内置外置变量解析只含本轮行动/正文/视图
  const 段起点 = 引擎源码.indexOf('async function 内置外置变量解析');
  const 段终点 = 引擎源码.indexOf('async function 补模型变量结算');
  const 段 = 引擎源码.slice(段起点, 段终点);
  assert.match(段, /【本轮玩家行动】/, '本轮行动仍在');
  assert.match(段, /【本轮已完成正文】/, '本轮正文仍在');
  assert.doesNotMatch(段, /上一轮/, '函数内不再出现"上一轮"');
});

test('B2 同轮两次尝试保留;两次失败只提示一次本轮结果,不承诺下一轮自动补', () => {
  const 循环起点 = 引擎源码.indexOf('for (let 次 = 1; 次 <= 2 && !内置变量块; 次++)');
  assert.ok(循环起点 !== -1, '同轮两次尝试循环保留');
  const 失败段 = 引擎源码.slice(循环起点, 引擎源码.indexOf('const 父亲电话正文基准'));
  assert.match(失败段, /本轮变量解析失败，数值未更新；可重试本回合/, '两次失败给玩家一次清楚提示');
  assert.doesNotMatch(失败段, /下一轮自动补|内置解析待补/, '失败分支不挂跨轮状态、不说下一轮自动补');
  const 文案 = '本轮变量解析失败，数值未更新；可重试本回合';
  assert.equal(引擎源码.split(文案).length - 1, 1, '失败提示文案只有一个触发点');
});

test('B3 未配置只提示配置,不进入第二次请求;取消/事务失效走现有事务回滚', () => {
  const 提示文案 =
    '没有可用的外置变量模型。请在游戏设置 → 变量解析中填写自定义 API；本轮正文已保留，变量暂不更新。';
  assert.equal(引擎源码.split(提示文案).length - 1, 1, '未配置提示文案只有一个触发点');
  const 循环起点 = 引擎源码.indexOf('for (let 次 = 1; 次 <= 2 && !内置变量块; 次++)');
  const 循环段 = 引擎源码.slice(循环起点, 循环起点 + 1200);
  assert.match(循环段, /结果\.结果 === '未配置'/, '未配置分支存在');
  assert.match(循环段, /break;/, '未配置直接跳出,不再第二次请求');
  // 失败/异常分支仍经降级入口(确认本轮事务有效)处理:取消/切聊/回档由事务回滚兜底
  assert.match(循环段, /确认本轮事务有效\(\)/, '每次解析尝试后确认事务仍有效');
});

// ─────────────────────────────────────────────
// C.档案卡可见反馈(仅改 components/档案卡.vue)
// ─────────────────────────────────────────────

test('C1 堕落轴显示"今日 AI 增长 x/每日上限",用共享世界日函数,日账非今天按0', () => {
  assert.match(档案卡源码, /今日 AI 增长 \{\{ 今日堕落增长 \}\}\/\{\{ 每日堕落上限 \}\}/, '堕落轴附近显示增长计数');
  assert.match(档案卡源码, /当前天数\(props\.absolutePeriod\)/, '使用共享世界日函数判断今天');
  assert.match(档案卡源码, /账\.日 !== 当前天数\(props\.absolutePeriod\)[\s\S]{0,40}return 0/, '日账不是今天时显示0');
  assert.match(档案卡源码, /Math\.max\(0, Math\.min\(每日堕落上限, 账\.值\)\)/, '值夹在0~每日堕落上限');
  assert.match(档案卡源码, /import \{ 每日堕落上限 \} from '\.\.\/\.\.\/\.\.\/脚本\/游戏逻辑\/守护系统'/, '共享守护系统每日堕落上限');
});

test('C2 堕落轴说明为自然语言:含自然说明/日cap/阶段0引导,不提模型/稽查/正则/系统公式', () => {
  const 自然说明 = '实质暧昧或亲密并让她真实动摇时增长；普通闲聊不会增长。';
  const 日cap = '今日变化已到上限，推进到下一天后恢复。';
  const 阶段0 = '阶段初期先按裂缝线索推进';
  for (const [文案, 正则] of [
    [自然说明, /实质暧昧或亲密并让她真实动摇时增长；普通闲聊不会增长。/],
    [日cap, /今日变化已到上限，推进到下一天后恢复。/],
    [阶段0, /阶段初期先按裂缝线索推进/],
  ]) {
    assert.match(档案卡源码, 正则, `档案卡含文案:${文案}`);
    for (const 词 of ['模型', '稽查', '正则', '系统公式']) {
      assert.ok(!文案.includes(词), `${文案} 不含 ${词}`);
    }
  }
});

test('C3 数值已冻结明确"阶段门前+关系线索进度";阶段0/5不显示下一阶段阻塞', () => {
  assert.match(档案卡源码, /已到阶段门前，先完成关系线索（\{\{ 选中关系线索\.进度 \}\}\/4）/, '冻结提示明确门前与进度');
  // 数据层:阶段0(目标阶段1)与阶段5(目标阶段6)都没有线路配置 → 关系线索为空 → 无冻结提示
  assert.equal(读取关系线索(建数据(0, 0), '101'), null, '阶段0不提供关系线索,不误导刷堕落');
  assert.equal(读取关系线索(建数据(5, 100), '101'), null, '阶段5不提供关系线索,无下一阶段阻塞');
});

test('C4 堕落轴说明:阶段0引导最优先,其次关系线索冻结(带动态进度),再次每日上限', () => {
  const 轴起点 = 档案卡源码.indexOf('const 堕落轴说明 = computed(() => {');
  assert.ok(轴起点 !== -1, '堕落轴说明 computed 存在');
  const 轴终点 = 档案卡源码.indexOf('});', 轴起点);
  const 轴段 = 档案卡源码.slice(轴起点, 轴终点);
  // 堕落轴说明直接读取选中关系线索的冻结标记(可选链,关系线索为空时跳过,不炸轴)
  assert.match(轴段, /选中关系线索\.value\?\.数值已冻结/, '堕落轴说明读取关系线索冻结标记');
  // 返回文案带动态关系线索进度(JS 模板串形式,与面板里的插值 {{ 选中关系线索.进度 }} 分开)
  assert.match(
    轴段,
    /已到阶段门前，先完成关系线索（\$\{选中关系线索\.value\.进度\}\/4）/,
    '冻结文案带动态关系线索进度',
  );
  // 分支顺序:阶段0裂缝引导 < 冻结提示 < 每日上限提示
  const 阶段0位 = 轴段.indexOf('阶段初期先按裂缝线索推进');
  const 冻结位 = 轴段.indexOf('数值已冻结');
  const 日cap位 = 轴段.indexOf('今日变化已到上限');
  assert.ok(阶段0位 !== -1 && 冻结位 !== -1 && 日cap位 !== -1, '三个分支都在堕落轴说明');
  assert.ok(阶段0位 < 冻结位, '阶段0裂缝引导最优先,先于冻结提示');
  assert.ok(冻结位 < 日cap位, '冻结提示优先于每日上限提示');
});
