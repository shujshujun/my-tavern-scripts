/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
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
globalThis.getVariables = () => ({ _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null });

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { seededRandom } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const {
  判定受孕,
  受孕概率阶梯,
  怀孕告知延迟时段,
  易孕星期表,
  推进怀孕告知,
  确认怀孕微信已送达,
  怀孕已公开,
  怀孕微信键,
  规划孕情初见,
  提交孕情初见评价,
  怀孕认知提示,
} = require('../../src/人妻公寓/脚本/游戏逻辑/怀孕系统.ts');
const { 结算成功现场楼 } = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const { 执行时间推进事务 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
const { 妻状态包 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 编译怀孕微信通知 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts');
const {
  孕态服装立绘图,
  孕态服装白名单,
  角色立绘候选,
} = require('../../src/人妻公寓/界面/客户端/assets.ts');

function 建数据(门牌 = '101', 绝对时段 = 0) {
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 3;
  return Schema.parse({ 户: { [门牌]: 节点 }, 系统: { _绝对时段: 绝对时段 } });
}

function 有效输入(覆盖 = {}) {
  return {
    场次标识: 'scene-1',
    结束方式: '主动收尾',
    最终位置: '小屄',
    收尾对象门牌: '101',
    保护状态: '未使用',
    当前行为: '阴道插入',
    ...覆盖,
  };
}

test('每名角色有固定易孕日，概率按60/80/100阶梯且一周等于42时段', () => {
  assert.deepEqual(易孕星期表, {
    101: '星期一',
    102: '星期二',
    201: '星期三',
    202: '星期四',
    301: '星期五',
    302: '星期六',
  });
  assert.deepEqual(受孕概率阶梯, [0.6, 0.8, 1]);
  assert.equal(怀孕告知延迟时段, 42);
});

test('只有易孕日内普通玩家场景的无保护阴道内射才参与判定', () => {
  for (const 覆盖 of [
    { 结束方式: '脚本收尾' },
    { 结束方式: '角色中止' },
    { 最终位置: '胸部' },
    { 保护状态: '安全套' },
    { 当前行为: '肛门插入' },
  ]) {
    const data = 建数据();
    assert.equal(判定受孕(data, 有效输入(覆盖)), '不符合');
    assert.equal(data.户['101'].妻._怀孕.状态, '未孕');
    assert.equal(data.户['101'].妻._怀孕.上次判定日, -1, '无效行为不得占用当天机会');
  }

  const 非易孕日 = 建数据('101', 6);
  assert.equal(判定受孕(非易孕日, 有效输入()), '非易孕日');
  assert.equal(非易孕日.户['101'].妻._怀孕.上次判定日, -1);
});

test('有效失败只占当天一次并累积保底，第三次有效判定必定受孕且保持隐藏', () => {
  const data = 建数据();
  let 失败场次 = '';
  for (let i = 0; i < 1000; i += 1) {
    const 候选 = `fail-${i}`;
    if (seededRandom('怀孕', 候选, '101', 1) >= 0.6) {
      失败场次 = 候选;
      break;
    }
  }
  assert.ok(失败场次);
  assert.equal(判定受孕(data, 有效输入({ 场次标识: 失败场次 })), '未受孕');
  assert.equal(data.户['101'].妻._怀孕.连续未中次数, 1);
  assert.equal(判定受孕(data, 有效输入({ 场次标识: 'same-day-again' })), '今日已判定');

  const 保底 = 建数据();
  保底.户['101'].妻._怀孕.连续未中次数 = 2;
  assert.equal(判定受孕(保底, 有效输入({ 场次标识: 'guaranteed' })), '已受孕');
  assert.equal(保底.户['101'].妻._怀孕.状态, '已受孕');
  assert.equal(保底.户['101'].妻._怀孕.受孕绝对时段, 0);
  assert.equal(保底.户['101'].妻._怀孕.预计告知绝对时段, 42);
  assert.equal(怀孕已公开(保底, '101'), false);
  assert.doesNotMatch(妻状态包('101', 保底), /怀孕/);
});

test('亲密收尾冻结当前主焦点为多人场景的唯一受孕对象', () => {
  const data = Schema.parse({
    户: { 101: 创建户节点(0), 102: 创建户节点(0) },
    系统: { _绝对时段: 0 },
  });
  data.户['101'].妻.当前阶段 = 3;
  data.户['102'].妻.当前阶段 = 3;
  data.户['101'].妻._怀孕.连续未中次数 = 2;
  data.户['102'].妻._怀孕.连续未中次数 = 2;
  data.系统._性爱场景 = {
    状态: '进行中',
    场次标识: 'multi-finish',
    开始楼层: 8,
    有效楼数: 1,
    本场等级加成: 0,
    当前接触部位: '小屄',
    当前行为: '阴道插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '101',
    参与者: {
      101: { 满意度: 2, 满意目标: 3, 偏好命中: [], 等级加成已用: true },
      102: { 满意度: 2, 满意目标: 3, 偏好命中: [], 等级加成已用: true },
    },
  };
  const 旧data = structuredClone(data);
  结算成功现场楼(data, 旧data, {
    楼层: 10,
    行动: '【亲密收尾:小屄】主动选择内射收尾',
    正文: '她承受着持续的阴道插入，最后在小屄内完成收尾。',
    本楼事件: '',
    妻在场: ['101', '102'],
    实际尺度: { 101: 3, 102: 3 },
    资源计费: true,
  });

  assert.equal(data.系统._上次性爱结果.收尾对象门牌, '101');
  assert.equal(data.户['101'].妻._怀孕.状态, '已受孕');
  assert.equal(data.户['102'].妻._怀孕.状态, '未孕');
});

test('满一周只进入待告知，微信落库确认后才公开立绘与AI认知', () => {
  const data = 建数据();
  Object.assign(data.户['101'].妻._怀孕, {
    状态: '已受孕',
    受孕绝对时段: 0,
    预计告知绝对时段: 42,
    告知绝对时段: -1,
    受孕场次标识: 'hidden-week',
    上次判定日: 1,
    连续未中次数: 0,
    告知文案: '',
    已曝光: true,
  });
  data.风闻 = 80;
  data.户['101'].夫.疑心值 = 80;

  data.系统._绝对时段 = 41;
  assert.deepEqual(推进怀孕告知(data), []);
  assert.equal(data.户['101'].妻._怀孕.状态, '已受孕');

  data.系统._绝对时段 = 42;
  assert.deepEqual(推进怀孕告知(data), ['101']);
  assert.equal(data.户['101'].妻._怀孕.状态, '待告知');
  assert.equal(怀孕已公开(data, '101'), false);
  assert.doesNotMatch(妻状态包('101', data), /怀孕/);
  assert.equal(data.户['101'].妻._怀孕.丈夫登门.状态, '无', '微信落库前丈夫不得获知或排期');

  const 消息 = 编译怀孕微信通知(data, 20, 42);
  assert.equal(消息.length, 1);
  assert.equal(消息[0].会话, '101');
  assert.equal(消息[0].键, 怀孕微信键('101', 'hidden-week'));
  assert.match(消息[0].文, /怀孕/);

  assert.deepEqual(确认怀孕微信已送达(data, [{ 门牌: '101', 场次标识: 'wrong' }]), []);
  assert.equal(怀孕已公开(data, '101'), false);
  assert.equal(data.户['101'].妻._怀孕.丈夫登门.状态, '无');
  assert.deepEqual(确认怀孕微信已送达(data, [{ 门牌: '101', 场次标识: 'hidden-week' }]), ['101']);
  assert.equal(怀孕已公开(data, '101'), true);
  assert.match(妻状态包('101', data), /怀孕/);
  assert.equal(data.户['101'].妻._怀孕.丈夫登门.状态, '待触发', '送达确认后才允许丈夫事件进入硬生命周期');
});

test('世界时间事务跨过一周期限时原子地产生待告知，不需要额外正文楼', () => {
  const data = 建数据('101', 41);
  // 本例只验证孕情到期；补齐后续入住批次，避免 101 阶段 3 同时预约 201 搬家剧情。
  data.户['201'] = 创建户节点(0);
  data.户['202'] = 创建户节点(0);
  data.户['301'] = 创建户节点(0);
  data.现金 = 1_000_000;
  data.胜任度 = 100;
  data.户['101'].妻._怀孕 = {
    状态: '已受孕',
    受孕绝对时段: 0,
    预计告知绝对时段: 42,
    告知绝对时段: -1,
    受孕场次标识: 'time-transaction',
    上次判定日: 1,
    连续未中次数: 0,
    告知文案: '',
    已曝光: false,
  };

  const 结果 = 执行时间推进事务(data, {
    方式: '睡到次日早晨',
    预期绝对时段: 41,
    当前消息楼: 20,
    当前地点: '管理员室',
  });

  assert.equal(结果.成功, true);
  assert.equal(data.系统._绝对时段, 42);
  assert.equal(data.户['101'].妻._怀孕.状态, '待告知');
  assert.equal(data.系统._待发送事件, '', '孕情通过微信告知，不占用强制正文事件槽');
});

test('告知文案按到期时阶段和关系风险变化，高风闻把孕情接入既有危机坏结局链', () => {
  const data = 建数据();
  data.风闻 = 75;
  data.户['101'].妻.当前阶段 = 5;
  data.户['101'].妻.好感值 = 85;
  data.户['101'].妻.堕落值 = 80;
  data.户['101'].妻._怀孕 = {
    状态: '已受孕',
    受孕绝对时段: 0,
    预计告知绝对时段: 42,
    告知绝对时段: -1,
    受孕场次标识: 'risk-scene',
    上次判定日: 1,
    连续未中次数: 0,
    告知文案: '',
    已曝光: false,
  };
  data.系统._绝对时段 = 42;

  推进怀孕告知(data);

  assert.match(data.户['101'].妻._怀孕.告知文案, /认真谈谈/);
  assert.match(data.户['101'].妻._怀孕.告知文案, /楼里的风声/);
  assert.equal(data.风闻, 100);
  assert.equal(data.户['101'].妻._怀孕.已曝光, true);
  assert.equal(data.系统._风闻账.危机活跃, true);
  assert.ok(data.系统._待接来电.期 >= 0, '沿用既有父亲来电/胜任/通牒坏结局链');
  assert.ok(data.系统._风闻账.最近事件.some(事件 => 事件.id === '怀孕曝光:101:risk-scene'));
});

test('孕情初见按观察者→本次公开孕情逐对规划，并带入阶段、数值、性格和自身孕情', () => {
  const data = Schema.parse({
    户: { 101: 创建户节点(0), 102: 创建户节点(0), 201: 创建户节点(0) },
  });
  Object.assign(data.户['101'].妻._怀孕, { 状态: '已告知', 受孕场次标识: 'first-meet-101' });
  Object.assign(data.户['102'].妻, { 当前阶段: 2, 好感值: 34, 堕落值: 17, 婚姻值: 82 });
  data.户['201'].妻._怀孕.状态 = '已受孕';

  const 计划 = 规划孕情初见(data, ['101', '102', '201'], 20, () => false);
  assert.deepEqual(计划.配对.map(项 => [项.观察者, 项.孕妇]), [['102', '101']]);
  assert.match(计划.提示, /沈静仪 → 夏乔/);
  assert.match(计划.提示, /阶段2/);
  assert.match(计划.提示, /好感34、堕落17、婚姻82/);
  assert.match(计划.提示, /性格与说话底色:/);
  assert.match(计划.提示, /至少有一句直接面向她的台词/);
  assert.doesNotMatch(计划.提示, /许曼君 → 夏乔/, '隐藏孕期角色不属于“未怀孕角色”');

  assert.equal(规划孕情初见(data, ['101'], 20, () => false).提示, '', '单人现场不触发');
  assert.equal(规划孕情初见(data, ['101', '102'], 20, () => true).提示, '', '该次孕情已在姐妹群聊过后不触发');
  data.户['101'].妻._怀孕.状态 = '待告知';
  assert.equal(规划孕情初见(data, ['101', '102'], 20, () => false).提示, '', '微信未送达的隐藏孕情不泄露');
});

test('已公开怀孕角色也会首次评价另一位孕妇，隐藏孕期角色仍被排除', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 102: 创建户节点(0), 201: 创建户节点(0) } });
  Object.assign(data.户['101'].妻._怀孕, { 状态: '已告知', 受孕场次标识: 'newly-public-101' });
  Object.assign(data.户['102'].妻._怀孕, { 状态: '已告知', 受孕场次标识: 'older-public-102' });
  Object.assign(data.户['201'].妻._怀孕, { 状态: '待告知', 受孕场次标识: 'still-hidden-201' });

  const 计划 = 规划孕情初见(
    data,
    ['101', '102', '201'],
    24,
    孕妇 => 孕妇 === '102',
  );
  assert.deepEqual(计划.配对.map(项 => [项.观察者, 项.孕妇]), [['102', '101']]);
  assert.match(计划.提示, /沈静仪 → 夏乔/);
  assert.match(计划.提示, /自身孕情也已公开/);
  assert.match(计划.提示, /同感、比较、关心、提醒或玩笑/);
  assert.doesNotMatch(计划.提示, /许曼君 →/, '待告知角色不能以已孕身份提前参与评价');

  const 双方都未聊过 = 规划孕情初见(data, ['101', '102'], 24, () => false);
  assert.deepEqual(
    双方都未聊过.配对.map(项 => [项.观察者, 项.孕妇]),
    [
      ['101', '102'],
      ['102', '101'],
    ],
    '两位已公开孕妇第一次同场时，各自都能评价对方这一次孕情',
  );
});

test('孕情初见只在有效提交点消费；同楼重掷重放，后续楼不再提示且认知连续', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 102: 创建户节点(0), 201: 创建户节点(0) } });
  Object.assign(data.户['101'].妻._怀孕, { 状态: '已告知', 受孕场次标识: 'reroll-pregnancy' });

  const 首次 = 规划孕情初见(data, ['101', '102'], 30, () => false);
  assert.equal(首次.配对.length, 1);
  assert.equal(Object.keys(data.系统._孕情初见评价楼).length, 0, '只构造提示不能提前消费');
  assert.equal(提交孕情初见评价(data, '没有提交票', 30).length, 0, '失败或取消路径没有注入票据可提交');
  assert.equal(提交孕情初见评价(data, 首次.提示, 30).length, 1);
  assert.equal(规划孕情初见(data, ['101', '102'], 30, () => false).配对.length, 1, '同楼 swipe 必须重放');
  assert.equal(规划孕情初见(data, ['101', '102'], 32, () => false).配对.length, 0, '下一正文楼不再重复评价');
  assert.doesNotMatch(怀孕认知提示(data, '101', 30), /沈静仪此前已当面看见/, '同楼重掷仍处于首次反应前');
  assert.match(怀孕认知提示(data, '101', 32), /沈静仪此前已当面看见孕肚并明确知情/);

  const 新观察者 = 规划孕情初见(data, ['101', '201'], 32, () => false);
  assert.deepEqual(新观察者.配对.map(项 => 项.观察者), ['201'], '另一名未孕角色仍有自己的首次碰见');
});

test('正文双入口都只在有效正文成功收口时提交孕情初见票', () => {
  const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  const 原生源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  assert.match(回合源码, /if \(已清洗正文\) 提交孕情初见评价\(newStat, 快照, 生成楼层\)/);
  assert.match(原生源码, /if \(本轮有效正文\) 提交孕情初见评价\(newData, _本轮孕情初见提示, 楼层\)/);
  assert.ok(
    回合源码.indexOf("if (已取消) throw new Error('__RQGY_CANCELLED__')") < 回合源码.indexOf('提交孕情初见评价(newStat'),
    '自建回合必须在最后取消门之后消费',
  );
});

test('孕态立绘只支持已生成的62张，并按统一候选顺序安全回退', () => {
  assert.equal(Object.values(孕态服装白名单).flat().length, 62);
  const 孕态候选 = 角色立绘候选('安若妍', '碎花连衣裙', true);
  assert.deepEqual(孕态候选, [
    孕态服装立绘图('安若妍', '碎花连衣裙'),
    'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材/立绘/安若妍_碎花连衣裙.webp',
    'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材/立绘/安若妍.webp',
  ]);
  assert.match(孕态候选[0], /pregnancy-portraits\/approved\/安若妍\/服装_碎花连衣裙_孕态\.webp$/);
  assert.match(孕态候选[0], /@rq0\.82\//, '0.82 发布资源必须固定到包含孕态立绘的新标签');

  const 未公开候选 = 角色立绘候选('安若妍', '碎花连衣裙', false);
  assert.equal(未公开候选.length, 2);
  assert.ok(未公开候选.every(src => !src.includes('孕态') && !src.includes('怀孕')));
  assert.equal(孕态服装立绘图('安若妍', '透视装'), '', '安若妍未生成透视装，不得请求不存在的资源');
  assert.match(孕态服装立绘图('夏乔', '透视装'), /夏乔\/服装_透视装_孕态\.webp$/);
  assert.match(孕态服装立绘图('夏乔', '露出装'), /夏乔\/服装_露出装_孕态\.webp$/);
  assert.deepEqual(角色立绘候选('安若妍', '透视装', true), [
    'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材/立绘/安若妍_透视装.webp',
    'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材/立绘/安若妍.webp',
  ]);
  assert.deepEqual(角色立绘候选('安若妍', undefined, true), [
    'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材/立绘/安若妍.webp',
  ]);
});

test('主界面与档案卡共用孕态服装解析器，且不新增孕情信息卡', () => {
  const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
  const 档案源码 = readFileSync(
    new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url),
    'utf8',
  );
  const 资源源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/assets.ts', import.meta.url), 'utf8');
  const 通知源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts', import.meta.url), 'utf8');
  const 入口源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

  assert.match(资源源码, /approved.*\$\{妻名\}\/服装_\$\{sku\}_孕态\.webp/s);
  assert.match(App源码, /角色立绘候选\(妻名, sku, 怀孕已公开\(data\.value, m\)\)\.find/);
  assert.match(档案源码, /角色立绘候选\(户静态表\[m\]\.妻名, 当前立绘SKU, 怀孕公开\)\.find/);
  assert.match(档案源码, /!props\.portraitFailed\[src\]/);
  assert.match(App源码, /怀孕态: 怀孕公开 \? 'pregnant'/);
  assert.match(档案源码, /sheet dossier" :class="\{ pregnant: 选中档案\.怀孕公开 \}"/);
  assert.match(档案源码, /avatar-glyph\.pregnant/);
  assert.match(
    通知源码,
    /const 新增孕情 = 孕情凭据\.filter\([\s\S]*?if \(已写\) \{[\s\S]*?通知孕情已送达\(\[\.\.\.已存在孕情, \.\.\.新增孕情\]\)/,
    '只有原本已有或本次真正写入的孕情键才能确认送达',
  );
  assert.match(入口源码, /eventOn\('人妻公寓:怀孕微信已送达'[\s\S]*?确认怀孕微信已送达[\s\S]*?脚本写入/);
  assert.doesNotMatch(`${App源码}\n${档案源码}`, /孕情信息|孕期|得知日期|知情者/);
});
