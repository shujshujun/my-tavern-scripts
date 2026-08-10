/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
globalThis.getVariables = () => ({ _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null });
globalThis.getLastMessageId = () => 12;

const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  安眠药可圆场,
  丈夫登门药物窗口已开启,
  同步丈夫登门排期,
  准备睡前丈夫登门,
  推进丈夫登门,
} = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫登门系统.ts');
const { 取货架, 购买, 送礼 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 预检时间推进 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
const { 验收群聊隐私 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts');

function 建数据(门牌们 = ['101']) {
  const 户 = {};
  for (const 门牌 of 门牌们) {
    const 节点 = 创建户节点(0);
    节点.妻.当前阶段 = 3;
    户[门牌] = 节点;
  }
  return Schema.parse({ 户, 现金: 10000, 风闻: 80, 系统: { _绝对时段: 18 } });
}

function 公开孕情(data, 门牌, 疑心 = 50) {
  const 节点 = data.户[门牌];
  节点.妻._怀孕.状态 = '已告知';
  节点.妻._怀孕.已曝光 = true;
  节点.妻._怀孕.受孕场次标识 = `preg-${门牌}`;
  节点.夫.疑心值 = 疑心;
}

test('丈夫登门默认账由 Schema 补全，疑心50才排期且母亲线永远排除', () => {
  const data = 建数据(['101', '302']);
  assert.deepEqual(data.户['101'].妻._怀孕.丈夫登门, {
    状态: '无',
    排期绝对时段: -1,
    变体标识: '',
    当前拍: 0,
    隐藏圆场: false,
    已结算: false,
  });

  公开孕情(data, '101', 49);
  公开孕情(data, '302', 100);
  assert.deepEqual(同步丈夫登门排期(data), []);
  data.户['101'].夫.疑心值 = 50;
  assert.deepEqual(同步丈夫登门排期(data), ['101']);
  assert.equal(data.户['101'].妻._怀孕.丈夫登门.状态, '待触发');
  assert.equal(data.户['302'].妻._怀孕.丈夫登门.状态, '无');
});

test('孕情微信尚未送达时即使已经曝光也不得排期丈夫，确认已告知后才开放', () => {
  const data = 建数据(['101']);
  const 怀孕账 = data.户['101'].妻._怀孕;
  怀孕账.状态 = '待告知';
  怀孕账.已曝光 = true;
  怀孕账.受孕场次标识 = 'pending-message';
  data.户['101'].夫.疑心值 = 80;

  assert.deepEqual(同步丈夫登门排期(data), []);
  assert.equal(怀孕账.丈夫登门.状态, '无');
  assert.equal(准备睡前丈夫登门(data, '管理员室'), null, '玩家收到微信前睡觉也不能提前泄露孕情');

  怀孕账.状态 = '已告知';
  assert.deepEqual(同步丈夫登门排期(data), ['101']);
  assert.equal(怀孕账.丈夫登门.状态, '待触发');
});

test('待登门会临时开放既有安神助眠剂，且只能交给对应妻子作为隐藏圆场', async () => {
  const data = 建数据(['101', '102']);
  公开孕情(data, '101', 70);
  同步丈夫登门排期(data);
  assert.equal(丈夫登门药物窗口已开启(data), true);
  assert.equal(安眠药可圆场(data, '101'), true);
  assert.equal(安眠药可圆场(data, '102'), false);
  assert.equal(
    取货架(data)
      .find(页 => 页.页签 === '药物')
      ?.商品.some(商品 => 商品.id === '安眠药'),
    true,
  );

  assert.equal(购买(data, '安眠药').成功, true);
  assert.equal(data.背包.includes('安眠药'), true);
  const 错送 = await 送礼(data, '安眠药', '102');
  assert.equal(错送.成功, false);
  assert.equal(data.背包.includes('安眠药'), true, '错送不能吞道具');
  const 圆场 = await 送礼(data, '安眠药', '101');
  assert.equal(圆场.成功, true);
  assert.equal(data.背包.includes('安眠药'), false);
  assert.equal(data.户['101'].妻._怀孕.丈夫登门.隐藏圆场, true);
  assert.equal(丈夫登门药物窗口已开启(data), false);
});

test('睡前喜讯分支锁定两拍，最终只按脚本降低疑心、提高信任并降低风闻', () => {
  const data = 建数据(['101']);
  公开孕情(data, '101', 70);
  data.户['101'].夫.信任值 = 40;
  同步丈夫登门排期(data);
  data.户['101'].妻._怀孕.丈夫登门.隐藏圆场 = true;

  const 开场 = 准备睡前丈夫登门(data, '管理员室');
  assert.match(开场.事件, /【丈夫登门:101:喜讯:1】/);
  assert.match(开场.事件, /分享喜事/);
  data.系统._待发送事件 = '';
  const 第二拍 = 推进丈夫登门(data, 开场.事件, '管理员室');
  assert.match(第二拍.事件, /【丈夫登门:101:喜讯:2】/);
  assert.equal(data.户['101'].夫.疑心值, 70, '中途不得提前结算');

  data.系统._待发送事件 = '';
  const 收尾 = 推进丈夫登门(data, 第二拍.事件, '管理员室');
  assert.equal(data.户['101'].妻._怀孕.丈夫登门.状态, '已完成');
  assert.equal(data.户['101'].夫.疑心值, 50);
  assert.equal(data.户['101'].夫.信任值, 50);
  assert.equal(data.风闻, 65);
  assert.match(收尾.提示, /疑心 -20.*信任 \+10.*风闻 -15/);
});

test('普通对质固定三拍，前两拍不结算，最终清空全部现金且不重放', () => {
  const data = 建数据(['101']);
  公开孕情(data, '101', 50);
  同步丈夫登门排期(data);
  const 第一拍 = 准备睡前丈夫登门(data, '管理员室');
  assert.match(第一拍.事件, /【丈夫登门:101:对质:1】/);
  data.系统._待发送事件 = '';
  const 第二拍 = 推进丈夫登门(data, 第一拍.事件);
  data.系统._待发送事件 = '';
  const 第三拍 = 推进丈夫登门(data, 第二拍.事件);
  assert.equal(data.现金, 10000);
  data.系统._待发送事件 = '';
  const 收尾 = 推进丈夫登门(data, 第三拍.事件);
  assert.equal(data.现金, 0);
  assert.match(收尾.提示, /10000 金币/);
  assert.equal(推进丈夫登门(data, 第三拍.事件), null, '已完成事件不能重复清空或重复结算');
});

test('中央时间预检拒绝绕过待登门直接睡觉，读取本身不改变状态', () => {
  const data = 建数据(['101']);
  公开孕情(data, '101', 50);
  同步丈夫登门排期(data);
  const before = structuredClone(data.户['101'].妻._怀孕.丈夫登门);
  const 结果 = 预检时间推进(data, {
    方式: '睡到次日早晨',
    预期绝对时段: 18,
    当前消息楼: 8,
    当前地点: '管理员室',
  });
  assert.equal(结果.成功, false);
  assert.match(结果.提示, /丈夫.*登门/);
  assert.deepEqual(data.户['101'].妻._怀孕.丈夫登门, before);
});

test('孕情姐妹群只放行已公开孕情，不放行其他具体私密行为', () => {
  assert.equal(验收群聊隐私('夏乔:她怀孕了，终于可以公开祝福啦', '姐妹'), false);
  assert.equal(验收群聊隐私('夏乔:她怀孕了，终于可以公开祝福啦', '姐妹孕情'), true);
  assert.equal(验收群聊隐私('夏乔:你们昨晚在床上做爱了吧', '姐妹孕情'), false);
});

test('姐妹群孕情话题沿用阶段3双成员门，自动多气泡且玩家插话后围绕玩家', () => {
  const 节拍源码 = readFileSync(
    new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url),
    'utf8',
  );
  const 雌竞源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/雌竞系统.ts', import.meta.url), 'utf8');
  const 数据层源码 = readFileSync(
    new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts', import.meta.url),
    'utf8',
  );
  const 孕情段 = 节拍源码.slice(
    节拍源码.indexOf('function 已公开孕情成员'),
    节拍源码.indexOf('// ============================================\n// 手机朋友圈图片记录'),
  );
  assert.match(雌竞源码, /妻\.当前阶段 >= 3/);
  assert.match(数据层源码, /孕情姐妹群节拍键前缀 = '姐妹孕情:'/);
  assert.match(节拍源码, /孕情姐妹群节拍键,/);
  assert.match(孕情段, /const 成员 = 姐妹群成员\(data\)/);
  assert.match(孕情段, /if \(成员\.length < 2\) return false/);
  assert.match(孕情段, /状态 === '已告知'.*账\.已曝光/s);
  assert.match(孕情段, /输出5~8行/);
  assert.match(孕情段, /孕情专场 \? 8 : 4/);
  assert.match(孕情段, /连续说了/);
  assert.match(孕情段, /不得表现得震惊/);
  assert.match(孕情段, /孕情姐妹群已触发\(库\.消息, 门牌号, 场次标识\)/);
  assert.match(孕情段, /`\$\{孕情事件键\}:\$\{序号 \+ 1\}`/);
  assert.doesNotMatch(孕情段, /data\.(?:风闻|现金|胜任度)\s*=/);
});

test('睡前门、双回合入口与前端背包全部接入同一丈夫登门状态机', () => {
  const index源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  const 事件门源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/入住触发门.ts', import.meta.url), 'utf8');
  const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
  assert.ok(index源码.indexOf('准备睡前丈夫登门(data') < index源码.indexOf('预检时间推进(data, 时间请求)'));
  assert.match(index源码, /推进丈夫登门\(newData, 本楼事件/);
  assert.match(回合源码, /推进丈夫登门\(newStat, 本楼事件/);
  assert.match(事件门源码, /丈夫登门:/);
  assert.match(App源码, /id === '安眠药'[\s\S]{0,260}安眠药可圆场/);
  assert.match(App源码, /丈夫登门药物窗口已开启\(data\.value\)/);
});
