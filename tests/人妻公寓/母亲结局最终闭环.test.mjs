/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
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

const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 购买, 取货架 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 经济结算 } = require('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts');
const {
  完成母亲视频通话终幕,
  母亲视频通话模式,
} = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话系统.ts');
const { 母亲视频通话终幕CG } = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话CG语义.ts');
const {
  双重继承场景票ID,
  公寓楼总钥匙ID,
  双重继承公共区域,
  使用双重继承场景票,
  执行双重继承地点动作,
  提交双重继承剧情事件,
  解析双重继承剧情事件,
  双重继承正文越拍原因,
  双重继承最终收束安全正文,
  同步双重继承时间节点,
  同步双重继承结局后父亲家常联络,
} = require('../../src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');
const { 是双重继承后家常报表 } = require('../../src/人妻公寓/脚本/游戏逻辑/父亲联络策略.ts');
const { 构建结局社交画像 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局社交语义.ts');

function 建母亲线数据() {
  const data = Schema.parse({
    户: { 302: 创建户节点(0) },
    现金: 5000,
    系统: {
      _绝对时段: 21,
      _母亲入列: true,
      _已完成特殊场景: ['回国'],
      _回国: { 阶段: '已完成', 母亲已坦白: true },
    },
  });
  data.户['302'].妻.当前阶段 = 5;
  return data;
}

function 跑完连续剧情(data, 开始, 地点, 楼层起点 = 10) {
  assert.equal(开始?.成功, true, 开始?.提示);
  let 事件 = 开始.事件;
  let 结果 = 开始;
  let 楼层 = 楼层起点;
  while (事件) {
    const 票 = 解析双重继承剧情事件(事件);
    assert.ok(票);
    结果 = 提交双重继承剧情事件(data, 事件, 地点, 楼层++);
    assert.equal(结果?.成功, true, 结果?.提示);
    事件 = 结果?.后续剧情?.事件;
  }
  return 结果;
}

function 完成到视频预约(data) {
  assert.equal(取货架(data).some(页 => 页.商品.some(商品 => 商品.id === 双重继承场景票ID)), true);
  assert.equal(购买(data, 双重继承场景票ID).成功, true);
  assert.equal(data.系统._双重继承.阶段, '待使用双重继承');
  assert.equal(使用双重继承场景票(data, '管理员室', 1).成功, true);
  assert.equal(data.系统._双重继承.阶段, '待父亲回楼');
  assert.equal('父亲回国绝对时段' in data.系统._回国, false);

  data.系统._绝对时段 = data.系统._双重继承.最早父亲到楼时段;
  assert.equal(同步双重继承时间节点(data, 2).变动, true);
  assert.equal(data.系统._双重继承.阶段, '公共区域检查中');
  for (const 地点 of 双重继承公共区域) {
    assert.equal(执行双重继承地点动作(data, '检查公共区域', 地点, 3).成功, true);
  }

  跑完连续剧情(data, 执行双重继承地点动作(data, '管理员室交权', '管理员室', 4), '管理员室', 4);
  assert.equal(data.系统._双重继承.阶段, '待领取公寓楼总钥匙');
  assert.equal(执行双重继承地点动作(data, '领取总钥匙', '管理员室', 8).成功, true);
  assert.equal(data.背包.filter(id => id === 公寓楼总钥匙ID).length, 1);

  data.系统._绝对时段 = data.系统._双重继承.最早早餐日 * 6;
  跑完连续剧情(data, 执行双重继承地点动作(data, '家庭早餐', '302', 20), '302', 20);
  assert.equal(data.系统._双重继承.阶段, '待机场视频');

  data.系统._绝对时段 = data.系统._双重继承.最早视频时段;
  const 预约 = 同步双重继承时间节点(data, 30);
  assert.equal(预约.变动, true, 预约.提示);
  assert.equal(data.系统._双重继承.阶段, '视频已预约');
  assert.equal(data.系统._母亲视频通话终幕.标识, '双重继承');
}

function 完成视频并生成最终动作(data) {
  data.系统._母亲视频通话终幕 = {
    ...data.系统._母亲视频通话终幕,
    标识: '双重继承',
    状态: '终幕中',
    最终交接已出现: true,
    玩家最终回答已保存: true,
    父亲已挂断: true,
    终幕CG序号: 母亲视频通话终幕CG.length,
    当前CG: 母亲视频通话终幕CG.at(-1).id,
  };
  data.系统._父亲通话 = {
    ...data.系统._父亲通话,
    标识: '双重继承',
    模式: '母亲视频通话终幕',
    状态: '通话中',
  };
  assert.equal(完成母亲视频通话终幕(data).成功, true);
  assert.equal(data.系统._父亲通话.模式, 母亲视频通话模式, '旧模式别名必须在视频完成边界规范化');
  assert.equal(data.系统._双重继承.阶段, '待总钥匙归位');
  assert.equal(data.系统._已完成特殊场景.includes('双重继承'), false);

  const 最终动作 = 执行双重继承地点动作(data, '归位总钥匙', '302', 32);
  assert.equal(最终动作.成功, true, 最终动作.提示);
  const 安全文本 = 双重继承最终收束安全正文();
  assert.equal(双重继承正文越拍原因(最终动作.事件, 安全文本), '');
  return 最终动作;
}

test('母亲线从《回国》口头完成，经商店票、八区交接、早餐、机场视频到钥匙归位形成完整闭环', () => {
  const data = 建母亲线数据();
  完成到视频预约(data);
  const 最终动作 = 完成视频并生成最终动作(data);
  const 完成 = 提交双重继承剧情事件(data, 最终动作.事件, '302', 32);
  assert.equal(完成.成功, true, 完成.提示);

  assert.equal(data.系统._双重继承.阶段, '已完成');
  assert.equal(data.系统._已完成特殊场景.filter(id => id === '双重继承').length, 1);
  assert.equal(data.背包.includes(公寓楼总钥匙ID), false);
  assert.equal(data.系统._通牒期, -1);
  assert.equal(data.系统._管理考核.母亲圆场.危险轮次起期, -1);
  assert.equal(data.系统._双重继承.群聊余波状态, '待发送');
  assert.ok(data.系统._双重继承.下次父亲家常联络时段 > data.系统._绝对时段);

  const 母亲画像 = 构建结局社交画像(data, '302', []);
  assert.equal(母亲画像.关系公开级, '结局稳定');
  assert.equal(母亲画像.已完成结局, '公寓交接已完成', '手机画像只暴露安全摘要，不把内部完成ID交给模型');
  assert.match(母亲画像.群内允许事实.join('\n'), /父亲始终不知道/);
  assert.match(母亲画像.群内允许事实.join('\n'), /母亲以自己的意志继续留在302/);
});

test('最终正文提交幂等：同一张票重复回调不会重复完成、重置余波水位或补发第二把钥匙', () => {
  const data = 建母亲线数据();
  完成到视频预约(data);
  const 最终动作 = 完成视频并生成最终动作(data);
  const 第一次 = 提交双重继承剧情事件(data, 最终动作.事件, '302', 88);
  assert.equal(第一次.成功, true);
  const 首次余波时段 = data.系统._双重继承.群聊余波最早时段;
  const 首次家常时段 = data.系统._双重继承.下次父亲家常联络时段;

  const 第二次 = 提交双重继承剧情事件(data, 最终动作.事件, '302', 89);
  assert.equal(第二次.成功, true);
  assert.equal(第二次.变动, false);
  assert.equal(data.系统._已完成特殊场景.filter(id => id === '双重继承').length, 1);
  assert.equal(data.系统._双重继承.群聊余波最早时段, 首次余波时段);
  assert.equal(data.系统._双重继承.下次父亲家常联络时段, 首次家常时段);
  assert.equal(data.背包.includes(公寓楼总钥匙ID), false);

  data.背包.push(公寓楼总钥匙ID, 公寓楼总钥匙ID);
  assert.equal(同步双重继承时间节点(data, 90).变动, true, '旧档残留钥匙被清理后必须报告变动，调用方才能真实保存修复');
  assert.equal(data.背包.includes(公寓楼总钥匙ID), false, '已完成状态会持续清理旧存档中的重复总钥匙');
  assert.equal(同步双重继承时间节点(data, 91).变动, false, '清理完成后的重复同步保持幂等');
});

test('结局后经济系统继续收租结账，但不再制造父亲审核、通牒或坏结局；家常电话使用独立报表', () => {
  const data = 建母亲线数据();
  完成到视频预约(data);
  const 最终动作 = 完成视频并生成最终动作(data);
  assert.equal(提交双重继承剧情事件(data, 最终动作.事件, '302', 66).成功, true);

  const 结局时段 = data.系统._绝对时段;
  const 结局胜任度 = 0;
  data.胜任度 = 结局胜任度;
  data.现金 = 0;
  data.系统._通牒期 = 0;
  data.系统._绝对时段 = 结局时段 + 200;
  const 原上交期 = data.系统._上次上交期;
  经济结算(data, 999);
  assert.ok(data.系统._上次上交期 > 原上交期, '真实经营账仍继续按世界时间结算');
  assert.equal(data.系统._坏结局, '');
  assert.equal(data.系统._通牒期, -1);
  assert.equal(data.胜任度, 结局胜任度, '结局后不再因经营考核扣继承资格分');
  assert.equal(是双重继承后家常报表(data.系统._待接来电.报表), true, '到期时只能生成无责家常电话');
  assert.doesNotMatch(data.系统._待接来电.报表, /账本|维修|欠租|上交|胜任度|审核|通牒/);

  data.系统._待接来电 = Schema.parse({}).系统._待接来电;
  data.系统._绝对时段 = data.系统._双重继承.下次父亲家常联络时段;
  const 家常 = 同步双重继承结局后父亲家常联络(data);
  assert.equal(家常.变动, true, 家常.提示);
  assert.equal(是双重继承后家常报表(data.系统._待接来电.报表), true);
  assert.match(data.系统._待接来电.报表, /彼此近况|身体|饮食|亲戚|节日|家庭旧事/);
  assert.doesNotMatch(data.系统._待接来电.报表, /账本|维修|欠租|上交|胜任度|审核|通牒/);
  assert.equal(data.系统._待接来电.通牒, false);
});
