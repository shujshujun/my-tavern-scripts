/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let chatVars = {};
globalThis.getVariables = () => chatVars;
globalThis.insertOrAssignVariables = patch => {
  chatVars = lodash.merge({}, chatVars, patch);
};

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

// 商店系统只会在送礼分支使用数据库桥；本测试覆盖购买，隔离 webpack `?raw` 模板依赖。
const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const YAML = require('yaml');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 角色剧情占位表, 道具表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 购买, 取货架 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const {
  家庭计划101背景文件,
  家庭计划地点动作,
  家庭计划已上架,
  准备家庭计划监控,
  提交家庭计划监控,
  提交家庭计划赴约,
  执行家庭计划地点动作,
  确认家庭计划微信已读,
} = require('../../src/人妻公寓/脚本/游戏逻辑/家庭计划系统.ts');
const { 借种场景ID } = require('../../src/人妻公寓/脚本/游戏逻辑/借种结局状态.ts');
const { 角色剧情占位已上架, 角色剧情占位锁定原因 } = require('../../src/人妻公寓/脚本/游戏逻辑/角色结局占位.ts');

const initvar = YAML.parse(
  readFileSync(new URL('../../src/人妻公寓/世界书/变量/initvar.yaml', import.meta.url), 'utf8'),
);
const index源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 侦探源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts', import.meta.url), 'utf8');
const 通知源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts', import.meta.url), 'utf8');
const 客户端源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

function 建夏乔完成数据() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 系统: { _绝对时段: 0 }, 现金: 3000 });
  data.户['101'].妻.当前阶段 = 5;
  data.户['101'].妻.阶段性癖 = 户静态表['101'].招牌性癖;
  return data;
}

function 调到可监控时段(data, 日序, 最多等待天数 = 1) {
  for (let abs = 日序 * 6; abs < (日序 + 最多等待天数) * 6; abs += 1) {
    data.系统._绝对时段 = abs;
    const 结果 = 准备家庭计划监控(data, '101');
    if (结果 && '家庭计划节点' in 结果) return 结果;
  }
  assert.fail(`从第 ${日序 + 1} 天起等待 ${最多等待天数} 天，仍没有丈夫独处的家庭计划监控窗口`);
}

test('Schema 与 initvar 为旧档补齐独立家庭计划状态，不占特殊场景单例', () => {
  const 空 = Schema.parse({});
  assert.deepEqual(空.系统._家庭计划, { 阶段: '未开始', 最早继续日: -1, 完成楼层: -1 });
  assert.deepEqual(initvar.系统._家庭计划, 空.系统._家庭计划);
  assert.equal(Object.hasOwn(空.系统._特殊场景, '家庭计划'), false);
});

test('上架、购买与重复购买由后端硬门负责', () => {
  chatVars = {};
  const data = Schema.parse({ 户: { 101: 创建户节点(0) }, 现金: 3000 });
  data.户['101'].妻.当前阶段 = 5;
  assert.equal(家庭计划已上架(data), false, '只到 L5、没有永久孕欲时不得上架');
  data.户['101'].妻.阶段性癖 = 户静态表['101'].招牌性癖;
  assert.equal(家庭计划已上架(data), true);

  const 前现金 = data.现金;
  const 首买 = 购买(data, '家庭计划套件');
  assert.equal(首买.成功, true);
  assert.equal(data.现金, 前现金 - 道具表.家庭计划套件.价格);
  assert.equal(data.系统._家庭计划.阶段, '待安装');
  assert.equal(data.背包.filter(x => x === '家庭计划套件').length, 1);

  const 二买 = 购买(data, '家庭计划套件');
  assert.equal(二买.成功, false);
  assert.equal(data.现金, 前现金 - 道具表.家庭计划套件.价格, '重复购买不得再次扣钱');
});

test('五日流程逐日推进，监控只准备票据、有效提交才改变状态', () => {
  chatVars = {};
  const data = 建夏乔完成数据();
  assert.equal(购买(data, '家庭计划套件').成功, true);

  // D1：夏乔早上在家；安装后背景切到初始计划板。
  let D1成功 = false;
  for (let abs = 0; abs < 6 && !D1成功; abs += 1) {
    data.系统._绝对时段 = abs;
    assert.equal(家庭计划地点动作(data, '101')[0]?.id, '安装计划板');
    D1成功 = 执行家庭计划地点动作(data, '安装计划板', '101').成功;
  }
  assert.equal(D1成功, true, '第一天应存在夏乔在家的安装窗口');
  assert.equal(data.系统._家庭计划.阶段, '待投资料');
  assert.equal(家庭计划101背景文件(data), '101_家庭计划板_01初始');
  assert.deepEqual(家庭计划地点动作(data, '信箱区'), [], '同一天不得提前做 D2');

  // D2：匿名资料。
  data.系统._绝对时段 = 6;
  assert.equal(执行家庭计划地点动作(data, '投放匿名资料', '信箱区').成功, true);
  assert.equal(data.系统._家庭计划.阶段, '待观察资料');
  data.系统._摄像头布设['101'] = true;

  // D3：准备监控结果不写状态；只有隔离正文成功提交才推进。
  const D3 = 调到可监控时段(data, 2);
  assert.equal(D3.家庭计划节点, '观察资料');
  assert.equal(data.系统._家庭计划.阶段, '待观察资料');
  assert.equal(提交家庭计划监控(data, D3.家庭计划节点).成功, true);
  assert.equal(data.系统._家庭计划.阶段, '待写磁贴');
  assert.equal(家庭计划101背景文件(data), '101_家庭计划板_02资料');

  // D4：写磁贴与送出发生在同一天，但必须分别到管理员室和 101。
  data.系统._绝对时段 = 18;
  assert.equal(执行家庭计划地点动作(data, '填写姓名磁贴', '管理员室').成功, true);
  assert.equal(data.系统._家庭计划.阶段, '待送磁贴');
  assert.equal(执行家庭计划地点动作(data, '送出姓名磁贴', '管理员室').成功, false);
  assert.equal(执行家庭计划地点动作(data, '送出姓名磁贴', '101').成功, true);
  assert.equal(data.系统._家庭计划.阶段, '待确认人选');

  // D5：第五天没有自然独处窗口时继续等待；命中后先出隔离票据，再在真实提交点推进到微信门。
  const D5 = 调到可监控时段(data, 4, 7);
  assert.equal(D5.家庭计划节点, '确认人选');
  assert.equal(data.系统._家庭计划.阶段, '待确认人选');
  assert.equal(提交家庭计划监控(data, D5.家庭计划节点).成功, true);
  assert.equal(data.系统._家庭计划.阶段, '待微信');
  assert.equal(家庭计划101背景文件(data), '101_家庭计划板_03人选');

  assert.equal(确认家庭计划微信已读(data, false).成功, false);
  assert.equal(data.系统._家庭计划.阶段, '待微信', '收到但没读不能解锁赴约');
  assert.equal(确认家庭计划微信已读(data, true).成功, true);
  assert.equal(data.系统._家庭计划.阶段, '待赴约');

  assert.equal(提交家庭计划赴约(data, '管理员室', 99).成功, false);
  assert.equal(data.系统._家庭计划.阶段, '待赴约');
  assert.equal(提交家庭计划赴约(data, '101', 99).成功, true);
  assert.equal(data.系统._家庭计划.阶段, '已完成');
  assert.equal(data.系统._家庭计划.完成楼层, 99);
});

test('D5 只在陆嘉明清醒在家且夏乔自然外出时准备票据，错过当天可以继续等待', () => {
  const data = 建夏乔完成数据();
  data.系统._家庭计划 = { 阶段: '待确认人选', 最早继续日: 0, 完成楼层: -1 };
  const 路线基线 = lodash.cloneDeep(data.系统._家庭计划);

  for (const [绝对时段, 提示] of [
    [29, /睡了|醒着/], // 星期五深夜：陆嘉明睡眠。
    [25, /还没回来/], // 星期五中午：陆嘉明外出。
    [24, /夏乔也在101/], // 星期五早上：夫妻都在家。
  ]) {
    data.系统._绝对时段 = 绝对时段;
    const 结果 = 准备家庭计划监控(data, '101');
    assert.ok(结果);
    assert.equal('家庭计划节点' in 结果, false);
    assert.equal(结果.成功, false);
    assert.match(结果.提示, 提示);
    assert.deepEqual(data.系统._家庭计划, 路线基线, '失败观察不得改变家庭计划路线');
  }

  data.系统._绝对时段 = 34; // 星期六晚上：陆嘉明在家，夏乔在天台。
  const 成功票据 = 准备家庭计划监控(data, '101');
  assert.ok(成功票据 && '家庭计划节点' in 成功票据);
  assert.equal(成功票据.家庭计划节点, '确认人选');
  assert.match(成功票据.事件, /夏乔不在场/);
  assert.doesNotMatch(成功票据.事件, /暂时外出|已为这次家庭计划确认/);
  assert.deepEqual(data.系统._家庭计划, 路线基线, '准备成功也只能出票，不能提前推进');
  assert.equal(提交家庭计划监控(data, 成功票据.家庭计划节点).成功, true);
  assert.equal(data.系统._家庭计划.阶段, '待微信');
});

test('家庭计划监控提交会复核夫妻物理条件，陈旧票不得在夏乔返家后推进', () => {
  const data = 建夏乔完成数据();
  data.系统._家庭计划 = { 阶段: '待确认人选', 最早继续日: 0, 完成楼层: -1 };
  data.系统._绝对时段 = 34; // 星期六晚上：陆嘉明在家、夏乔在天台，可准备 D5。
  const 票据 = 准备家庭计划监控(data, '101');
  assert.ok(票据 && '家庭计划节点' in 票据);
  assert.equal(票据.家庭计划节点, '确认人选');

  data.系统._绝对时段 = 24; // 星期五早上：夫妻都在 101，旧生成回调此时才到达。
  const 提交前 = lodash.cloneDeep(data.系统._家庭计划);
  const 结果 = 提交家庭计划监控(data, 票据.家庭计划节点);
  assert.equal(结果.成功, false, '提交点必须再次验证陆嘉明独处窗口');
  assert.deepEqual(data.系统._家庭计划, 提交前, '陈旧监控票据不得留下部分进度');
});

test('借种是可见但由家庭计划硬门锁定的真实商品，完成前零副作用、完成后只购入一张票', () => {
  const data = 建夏乔完成数据();
  assert.equal(借种场景ID, '借种');
  const 商品 = 取货架(data)
    .flatMap(x => x.商品)
    .find(x => x.id === 借种场景ID);
  assert.ok(商品, '达到夏乔最终阶段后应能在特殊场景货架看到借种商品');
  assert.equal(商品.价格, 1500);
  assert.equal(商品.剧情占位, undefined, '借种不再走角色剧情占位购买分支');

  const 锁定前 = lodash.cloneDeep({ 现金: data.现金, 背包: data.背包 });
  const 锁定结果 = 购买(data, 借种场景ID);
  assert.equal(锁定结果.成功, false);
  assert.match(锁定结果.提示, /先完成夏乔的家庭计划/);
  assert.deepEqual({ 现金: data.现金, 背包: data.背包 }, 锁定前);

  data.系统._家庭计划.阶段 = '已完成';
  const 结果 = 购买(data, 借种场景ID);
  assert.equal(结果.成功, true);
  assert.equal(data.现金, 1500);
  assert.equal(data.背包.filter(id => id === 借种场景ID).length, 1);

  const 重复 = 购买(data, 借种场景ID);
  assert.equal(重复.成功, false);
  assert.match(重复.提示, /已经购买或正在使用/);
  assert.equal(data.现金, 1500);
  assert.equal(data.背包.filter(id => id === 借种场景ID).length, 1);
});

test('其余五名角色各有操作性剧情与结局剧情占位，达到 L5 并完成阶段主题后成对上架', () => {
  const 其他门牌 = ['102', '201', '202', '301', '302'];
  const 其他占位 = Object.values(角色剧情占位表).filter(x => x.门牌 !== '101');
  assert.equal(其他占位.length, 10);
  for (const 门牌号 of 其他门牌) {
    assert.deepEqual(
      其他占位
        .filter(x => x.门牌 === 门牌号)
        .map(x => x.类型)
        .sort(),
      ['操作性剧情', '结局剧情'],
    );
  }

  const data = Schema.parse({
    户: Object.fromEntries(其他门牌.map(门牌号 => [门牌号, 创建户节点(0)])),
    现金: 9000,
  });
  for (const 门牌号 of 其他门牌) {
    const 本人占位 = 其他占位.filter(x => x.门牌 === 门牌号);
    data.户[门牌号].妻.当前阶段 = 5;
    assert.equal(
      本人占位.some(x => 角色剧情占位已上架(data, x.id)),
      false,
      `${门牌号} 未完成阶段主题时不得上架`,
    );
    data.户[门牌号].妻.阶段性癖 = 户静态表[门牌号].招牌性癖;
  }

  const 上架占位 = 取货架(data)
    .flatMap(x => x.商品)
    .filter(x => x.剧情占位);
  assert.equal(上架占位.length, 10);
  for (const 商品 of 上架占位) {
    assert.equal(角色剧情占位已上架(data, 商品.id), true);
    if (商品.剧情占位.类型 === '操作性剧情') assert.deepEqual(角色剧情占位锁定原因(商品.id), []);
    else assert.match(角色剧情占位锁定原因(商品.id).join('；'), /先完成.*操作性剧情.*待设计/);

    const 前现金 = data.现金;
    const 前背包 = [...data.背包];
    const 结果 = 购买(data, 商品.id);
    assert.equal(结果.成功, false);
    assert.match(结果.提示, /设计待完成.*不会扣款、入包或启动剧情/);
    assert.equal(data.现金, 前现金);
    assert.deepEqual(data.背包, 前背包);
    assert.equal(data.系统._待发送事件, '');
  }
});

test('接线契约覆盖监控原子提交、真实微信已读、赴约成功结算与失败不推进', () => {
  assert.match(侦探源码, /const 家庭计划 = 准备家庭计划监控\(data, 门牌号\)/);
  assert.match(index源码, /if \('家庭计划节点' in 结果\)[\s\S]*提交家庭计划监控\(data, 结果\.家庭计划节点\)/);
  assert.match(index源码, /写核心: async \(\) => \{[\s\S]*提交家庭计划监控/);
  assert.match(index源码, /成功结算: newData => \{[\s\S]*提交家庭计划赴约\(newData, '101', 当前楼层\(\)\)/);
  assert.match(index源码, /资源计费: false,[\s\S]{0,80}可重掷: false/);
  assert.match(通知源码, /家庭计划微信事件键/);
  assert.doesNotMatch(通知源码, /今晚有空吗？\\n他想请你来101一趟，谈谈孩子的事。/);
  assert.doesNotMatch(通知源码, /编译家庭计划微信通知/);
  assert.match(通知源码, /return !手机记录晚于已读\(消息, 已读楼, 已读锚\);/);
  assert.match(客户端源码, /eventEmit\('人妻公寓:同步家庭计划微信已读'\)/);
});
