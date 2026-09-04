/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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

const YAML = require('yaml');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 道具表, 特殊场景表, 经济配置 } = require('../../src/人妻公寓/stageConfig.ts');
const { 购买, 取货架 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 完成母亲视频通话终幕 } = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话系统.ts');
const { 母亲视频通话终幕CG } = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话CG语义.ts');
const {
  双重继承完成ID,
  双重继承场景票ID,
  公寓楼总钥匙ID,
  双重继承公共区域,
  双重继承商店已上架,
  购买双重继承场景票,
  使用双重继承场景票,
  双重继承地点动作,
  执行双重继承地点动作,
  提交双重继承剧情事件,
  解析双重继承剧情事件,
  双重继承正文越拍原因,
  双重继承终幕后安全收束正文,
  双重继承最终收束普通行动冲突,
  同步双重继承时间节点,
  同步双重继承完成后状态,
  双重继承结局群聊余波可触发,
  提交双重继承结局群聊余波,
  双重继承结局后父亲家常联络可建立,
  同步双重继承结局后父亲家常联络,
  双重继承档案提示,
  双重继承父亲同行地点,
  双重继承地图检查标记,
  双重继承302亲密冲突,
} = require('../../src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');
const {
  双重继承阻止普通父亲联络,
  双重继承后父亲已退出管理,
  是双重继承后家常报表,
} = require('../../src/人妻公寓/脚本/游戏逻辑/父亲联络策略.ts');

const initvar = YAML.parse(readFileSync(new URL('../../src/人妻公寓/世界书/变量/initvar.yaml', import.meta.url), 'utf8'));
const schemaJson = JSON.parse(readFileSync(new URL('../../src/人妻公寓/schema.json', import.meta.url), 'utf8'));
const 路线源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts', import.meta.url), 'utf8');
const 视频源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话系统.ts', import.meta.url), 'utf8');
const 经济源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts', import.meta.url), 'utf8');
const 父亲源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/父亲通话.ts', import.meta.url), 'utf8');
const 群聊源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');
const 隐私源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts', import.meta.url), 'utf8');
const 客户端源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 房间动作源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts', import.meta.url),
  'utf8',
);

function 建数据(绝对时段 = 20) {
  const data = Schema.parse({
    现金: 10000,
    胜任度: 100,
    户: { 302: 创建户节点(0) },
    系统: {
      _绝对时段: 绝对时段,
      _母亲入列: true,
      _已完成特殊场景: ['回国'],
      _回国: { 阶段: '已完成' },
    },
  });
  data.户['302'].妻.当前阶段 = 5;
  return data;
}

function 购买并启动(data, 楼层 = 1) {
  assert.equal(双重继承商店已上架(data), true);
  assert.equal(购买双重继承场景票(data, 1500).成功, true);
  assert.equal(data.系统._双重继承.阶段, '待使用双重继承');
  const 使用 = 使用双重继承场景票(data, '管理员室', 楼层);
  assert.equal(使用.成功, true, 使用.提示);
  if (data.系统._双重继承.阶段 === '待父亲回楼') {
    data.系统._绝对时段 = data.系统._双重继承.最早父亲到楼时段;
    assert.equal(同步双重继承时间节点(data, 楼层).成功, true);
  }
  assert.equal(data.系统._双重继承.阶段, '公共区域检查中');
}

function 完成八区(data) {
  const CG = [];
  for (const 地点 of [...双重继承公共区域].reverse()) {
    if (data.系统._双重继承.已检查公共区域.includes(地点)) continue;
    const 结果 = 执行双重继承地点动作(data, '检查公共区域', 地点, 10);
    assert.equal(结果.成功, true, `${地点}: ${结果.提示}`);
    assert.equal(结果.满意, true);
    CG.push(结果.CG);
  }
  assert.equal(data.系统._双重继承.阶段, '待管理员室交权');
  assert.equal(new Set(CG).size, CG.length, '八区检查必须各自映射唯一CG');
}

function 跑完连续剧情(data, 初始结果, 地点) {
  assert.equal(初始结果?.成功, true, 初始结果?.提示);
  let 事件 = 初始结果.事件;
  let 最终 = 初始结果;
  for (let i = 0; i < 16 && 事件; i += 1) {
    最终 = 提交双重继承剧情事件(data, 事件, 地点, 50 + i);
    assert.equal(最终?.成功, true, 最终?.提示);
    事件 = 最终?.后续剧情?.事件;
  }
  if (事件) throw new Error('《双重继承》连续剧情超过安全拍数仍未收束');
  return 最终;
}

function 准备完整视频终幕(data) {
  data.系统._双重继承.阶段 = '视频已预约';
  if (!data.背包.includes(公寓楼总钥匙ID)) data.背包.push(公寓楼总钥匙ID);
  data.系统._母亲视频通话终幕 = {
    ...data.系统._母亲视频通话终幕,
    标识: 双重继承完成ID,
    状态: '终幕中',
    最终交接已出现: true,
    玩家最终回答已保存: true,
    父亲已挂断: true,
    终幕CG序号: 母亲视频通话终幕CG.length,
    当前CG: 母亲视频通话终幕CG.at(-1).id,
    启动楼层: 88,
  };
  data.系统._父亲通话 = {
    ...data.系统._父亲通话,
    标识: 双重继承完成ID,
    模式: '双重继承视频',
    状态: '通话中',
    挂断楼层: 99,
  };
}

function 完成到钥匙收束(data) {
  准备完整视频终幕(data);
  const 视频完成 = 完成母亲视频通话终幕(data);
  assert.equal(视频完成.成功, true, 视频完成.提示);
  assert.equal(data.系统._双重继承.阶段, '待总钥匙归位');
  return 视频完成;
}

function 原子完成结局(data, 楼层 = 123) {
  完成到钥匙收束(data);
  const 动作 = 执行双重继承地点动作(data, '归位总钥匙', '302', 楼层);
  assert.equal(动作.成功, true, 动作.提示);
  const 提交 = 提交双重继承剧情事件(data, 动作.事件, '302', 楼层);
  assert.equal(提交?.成功, true, 提交?.提示);
  return { 动作, 提交 };
}

test('Schema、schema.json 与 initvar 共用唯一《双重继承》生命周期', () => {
  const 空 = Schema.parse({});
  const 路线 = 空.系统._双重继承;
  assert.equal(路线.阶段, '未开始');
  assert.equal(路线.最早父亲到楼时段, -1);
  assert.equal(路线.群聊余波状态, '未建立');
  assert.equal(路线.群聊余波最早时段, -1);
  assert.equal(路线.父亲家常联络序号, 0);
  assert.equal(路线.下次父亲家常联络时段, -1);
  assert.deepEqual(initvar.系统._双重继承, 路线);

  const JSON路线 = schemaJson.properties.系统.properties._双重继承.properties;
  assert.deepEqual(JSON路线.阶段.enum, [
    '未开始',
    '待使用双重继承',
    '待父亲回楼',
    '公共区域检查中',
    '待管理员室交权',
    '管理员室剧情中',
    '待领取公寓楼总钥匙',
    '等待三日早餐',
    '早餐剧情中',
    '待机场视频',
    '视频已预约',
    '待总钥匙归位',
    '已完成',
  ]);
  assert.equal(JSON路线.群聊余波状态.default, '未建立');
  assert.equal(JSON路线.父亲家常联络序号.default, 0);
});

test('《回国》只提供口头前置，世界时间经过多久都不能自动启动《双重继承》', () => {
  const data = 建数据(999);
  const 结果 = 同步双重继承时间节点(data, 7);
  assert.equal(结果.变动, false);
  assert.equal(data.系统._双重继承.阶段, '未开始');
  assert.match(双重继承档案提示(data).下一步, /商店.*购买/);
  assert.equal('父亲回国绝对时段' in data.系统._回国, false);
  assert.doesNotMatch(路线源码, /_回国\.父亲回国绝对时段/);
});

test('「双重继承」只在《回国》完成后上架；购买只扣款、入包并等待玩家使用', () => {
  const 未完成 = 建数据();
  未完成.系统._回国.阶段 = '待确认交接意向';
  未完成.系统._已完成特殊场景 = [];
  assert.equal(双重继承商店已上架(未完成), false);

  const data = 建数据();
  assert.equal(道具表[双重继承场景票ID].价格, 1500);
  assert.equal(特殊场景表[双重继承场景票ID].启动.地点, '管理员室');
  assert.equal(取货架(data).some(页 => 页.商品.some(商品 => 商品.id === 双重继承场景票ID)), true);
  const 原时间 = data.系统._绝对时段;
  const 原现金 = data.现金;
  const 结果 = 购买(data, 双重继承场景票ID);
  assert.equal(结果.成功, true, 结果.提示);
  assert.equal(data.现金, 原现金 - 1500);
  assert.equal(data.背包.filter(id => id === 双重继承场景票ID).length, 1);
  assert.equal(data.系统._双重继承.阶段, '待使用双重继承');
  assert.equal(data.系统._双重继承.最早父亲到楼时段, -1);
  assert.equal(data.系统._绝对时段, 原时间);
  assert.equal(双重继承阻止普通父亲联络(data), false, '只购买票据不能改变父亲旧联络生命周期');
});

test('背包正式使用入口只在购买后的真实阶段和管理员室出现，并与地图瓷砖共用同一后端所有者', () => {
  assert.match(
    客户端源码,
    /可使用双重继承:[\s\S]{0,220}当前房间\.value === '管理员室'[\s\S]{0,140}_双重继承\.阶段 === '待使用双重继承'/,
  );
  assert.doesNotMatch(
    客户端源码,
    /可使用双重继承:[\s\S]{0,220}_双重继承\.阶段 === '未开始'/,
    '未购买阶段不能错误显示背包使用按钮',
  );
  assert.match(客户端源码, /function 使用双重继承场景票\(\)[\s\S]{0,180}人妻公寓:使用双重继承场景票/);
  assert.match(房间动作源码, /事件\.双重继承动作\(候选\.id\)/);

  const data = 建数据(21);
  assert.equal(购买双重继承场景票(data, 1500).成功, true);
  assert.equal(data.系统._双重继承.阶段, '待使用双重继承');
  assert.equal(双重继承地点动作(data, '302').some(动作 => 动作.id === '使用双重继承'), false);
  assert.equal(双重继承地点动作(data, '管理员室').some(动作 => 动作.id === '使用双重继承'), true);
});

test('场景票只能在管理员室使用；失败不消费，成功只消费一次并建立真实到楼时点', () => {
  const data = 建数据(21);
  assert.equal(购买双重继承场景票(data, 1500).成功, true);
  assert.equal(使用双重继承场景票(data, '302', 5).成功, false);
  assert.equal(data.背包.includes(双重继承场景票ID), true);

  const 使用 = 使用双重继承场景票(data, '管理员室', 5);
  assert.equal(使用.成功, true, 使用.提示);
  assert.equal(data.背包.includes(双重继承场景票ID), false);
  assert.equal(data.系统._双重继承.阶段, '待父亲回楼');
  assert.equal(data.系统._双重继承.最早父亲到楼时段, 26, '晚上启动应对齐下一个下午');
  assert.equal(data.系统._双重继承.启动楼层, 5);
  assert.equal(双重继承阻止普通父亲联络(data), true);
  assert.equal(使用双重继承场景票(data, '管理员室', 6).成功, false, '陈旧背包或地图按钮不能重复消费、重启路线');
  assert.equal(data.系统._双重继承.启动楼层, 5);

  data.系统._绝对时段 = 26;
  data.系统._场景剧情事务.id = '更强剧情';
  assert.equal(同步双重继承时间节点(data, 6).变动, false, '竞态时不得抢跑父亲抵达');
  data.系统._场景剧情事务.id = '';
  data.系统._绝对时段 = 32;
  assert.equal(同步双重继承时间节点(data, 6).变动, true);
  assert.equal(data.系统._双重继承.阶段, '公共区域检查中');
});

test('管理员室房间瓷砖可以真实使用背包票据；安全下午启动可立即进入八区同行', () => {
  const data = 建数据(20);
  assert.equal(购买双重继承场景票(data, 1500).成功, true);
  assert.equal(双重继承地点动作(data, '管理员室')[0]?.id, '使用双重继承');
  const 结果 = 执行双重继承地点动作(data, '使用双重继承', '管理员室', 12);
  assert.equal(结果.成功, true, 结果.提示);
  assert.equal(data.系统._双重继承.阶段, '公共区域检查中');
  assert.equal(data.系统._双重继承.最早父亲到楼时段, 20);
  assert.equal(data.系统._双重继承.启动楼层, 12);
});

test('父亲跟随玩家按任意顺序检查八个公共区域，重复地点不能重复登记', () => {
  const data = 建数据();
  购买并启动(data);
  assert.equal(双重继承父亲同行地点(data, '大堂'), '大堂');
  assert.equal(双重继承父亲同行地点(data, '医院'), '');
  assert.equal(双重继承地图检查标记(data, '大堂'), 'INSPECT');
  const 第一次 = 执行双重继承地点动作(data, '检查公共区域', '大堂', 2);
  assert.equal(第一次.成功, true);
  assert.equal(第一次.CG, '双重继承_02_大堂检查');
  assert.equal(双重继承地图检查标记(data, '大堂'), 'DONE');
  assert.equal(执行双重继承地点动作(data, '检查公共区域', '大堂', 3).成功, false);
  完成八区(data);
  assert.deepEqual(new Set(data.系统._双重继承.已检查公共区域), new Set(双重继承公共区域));
});

test('管理员室完全交权固定两回合，弱模型提前交钥匙会被越拍验收拦截', () => {
  const data = 建数据();
  购买并启动(data);
  完成八区(data);
  const 开始 = 执行双重继承地点动作(data, '管理员室交权', '管理员室', 20);
  assert.equal(解析双重继承剧情事件(开始.事件).拍, 1);
  assert.equal(双重继承正文越拍原因(开始.事件, '母亲要求完全交权，父亲仍在听。'), '');
  assert.match(双重继承正文越拍原因(开始.事件, '父亲同意交权并把总钥匙交给玩家。'), /提前/);

  const 最终 = 跑完连续剧情(data, 开始, '管理员室');
  assert.equal(data.系统._双重继承.阶段, '待领取公寓楼总钥匙');
  assert.equal(最终.CG, '双重继承_09_管理员室完全交权');
  assert.equal(data.背包.includes(公寓楼总钥匙ID), false, 'AI正文不能替玩家领取真实钥匙');
});

test('玩家亲手领取唯一总钥匙，父亲暂住302三天，只屏蔽硬冲突亲密动作', () => {
  const data = 建数据();
  购买并启动(data);
  完成八区(data);
  跑完连续剧情(data, 执行双重继承地点动作(data, '管理员室交权', '管理员室', 20), '管理员室');

  const 领取 = 执行双重继承地点动作(data, '领取总钥匙', '管理员室', 30);
  assert.equal(领取.成功, true, 领取.提示);
  assert.equal(领取.CG, '双重继承_10_父亲交出公寓楼总钥匙');
  assert.equal(data.背包.filter(id => id === 公寓楼总钥匙ID).length, 1);
  assert.equal(data.系统._双重继承.阶段, '等待三日早餐');
  assert.equal(执行双重继承地点动作(data, '领取总钥匙', '管理员室', 31).成功, false);
  assert.match(双重继承302亲密冲突(data, '和母亲发生性关系'), /父亲.*暂住302/);
  assert.equal(双重继承302亲密冲突(data, '和母亲聊聊今天早餐吃什么'), '');

  data.系统._绝对时段 = (data.系统._双重继承.最早早餐日 - 1) * 6;
  assert.equal(双重继承地点动作(data, '302').some(动作 => 动作.id === '家庭早餐'), false);
});

test('三日后302家庭早餐固定五回合，完成后只安排当天下午机场视频', () => {
  const data = 建数据();
  购买并启动(data);
  完成八区(data);
  跑完连续剧情(data, 执行双重继承地点动作(data, '管理员室交权', '管理员室', 20), '管理员室');
  执行双重继承地点动作(data, '领取总钥匙', '管理员室', 30);

  data.系统._绝对时段 = data.系统._双重继承.最早早餐日 * 6;
  const 早餐 = 执行双重继承地点动作(data, '家庭早餐', '302', 40);
  assert.equal(解析双重继承剧情事件(早餐.事件).拍, 1);
  assert.match(双重继承正文越拍原因(早餐.事件, '父亲一坐下就宣布下午去机场。'), /提前/);
  const 最终 = 跑完连续剧情(data, 早餐, '302');
  assert.equal(data.系统._双重继承.阶段, '待机场视频');
  assert.equal(data.系统._双重继承.最早视频时段, data.系统._绝对时段 + 2);
  assert.equal(最终.CG, '双重继承_11_302三人早餐');
  assert.equal(data.背包.filter(id => id === 公寓楼总钥匙ID).length, 1);
});

test('机场视频第七张结束只退出视频并进入“待总钥匙归位”，不会提前提交结局', () => {
  const data = 建数据();
  准备完整视频终幕(data);
  const 结果 = 完成母亲视频通话终幕(data);
  assert.equal(结果.成功, true, 结果.提示);
  assert.equal(data.系统._母亲视频通话终幕.状态, '已完成');
  assert.equal(data.系统._双重继承.阶段, '待总钥匙归位');
  assert.equal(data.系统._已完成特殊场景.includes(双重继承完成ID), false);
  assert.equal(data.背包.includes(公寓楼总钥匙ID), true);
  assert.match(结果.提示, /302.*总钥匙/);
  assert.match(视频源码, /阶段 = '待总钥匙归位'/);
});

test('视频硬事实不完整时不能结束，也不能绕过302钥匙收束直接提交', () => {
  const data = 建数据();
  准备完整视频终幕(data);
  data.系统._母亲视频通话终幕.父亲已挂断 = false;
  assert.equal(完成母亲视频通话终幕(data).成功, false);

  data.系统._母亲视频通话终幕.父亲已挂断 = true;
  完成母亲视频通话终幕(data);
  const 动作 = 执行双重继承地点动作(data, '归位总钥匙', '302', 9);
  data.系统._母亲视频通话终幕.玩家最终回答已保存 = false;
  assert.equal(提交双重继承剧情事件(data, 动作.事件, '302', 9).成功, false);
  assert.equal(data.系统._双重继承.阶段, '待总钥匙归位');
  assert.equal(data.系统._已完成特殊场景.includes(双重继承完成ID), false);
});

test('最终收束只在302开放；普通行动硬锁，安全正文不续视频、不续成人动作、不让父亲回来', () => {
  const data = 建数据();
  完成到钥匙收束(data);
  assert.match(双重继承最终收束普通行动冲突(data), /最后现实动作|总钥匙/);
  assert.equal(双重继承地点动作(data, '管理员室').length, 0);
  assert.equal(双重继承地点动作(data, '302')[0]?.id, '归位总钥匙');

  const 动作 = 执行双重继承地点动作(data, '归位总钥匙', '302', 77);
  const 票 = 解析双重继承剧情事件(动作.事件);
  assert.equal(票.动作, '终幕后收束');
  assert.equal(双重继承正文越拍原因(动作.事件, '父亲重新出现在302，视频又亮了起来。'), '终幕后收束重新拉回了父亲、视频、成人动作或系统结算');
  const 兜底 = 双重继承终幕后安全收束正文();
  assert.equal(双重继承正文越拍原因(动作.事件, 兜底), '');
  assert.match(兜底, /总钥匙/);
  assert.match(兜底, /关上302的门|这个家/);

  const 反例 = [
    '我把公寓楼总钥匙放到母亲的钥匙旁。母亲决定留下，这个家以后由我们共同守着。',
    '我把公寓楼总钥匙放到母亲的钥匙旁。母亲决定留下，我亲手关上302家门。',
    '我把公寓楼总钥匙放到母亲的钥匙旁。母亲决定留下，父亲关上302家门。',
    '我把公寓楼总钥匙放到母亲的钥匙旁。母亲决定留下，说等会儿再关302家门。',
    '我把公寓楼总钥匙放到母亲的钥匙旁。母亲决定留下，但她没有关上302家门。',
  ];
  for (const 正文 of 反例) assert.match(双重继承正文越拍原因(动作.事件, 正文), /母亲.*关|家门/);
  assert.equal(
    双重继承正文越拍原因(
      动作.事件,
      '我把公寓楼总钥匙放到母亲那把钥匙旁。母亲明确说这个家是她自己选择留下的，随后她亲自关上302家门。',
    ),
    '',
  );
});

test('总钥匙现实动作成功后才原子提交结局，并清理旧审核、圆场、来电与重复钥匙', () => {
  const data = 建数据();
  data.胜任度 = 12;
  data.系统._通牒期 = 9;
  data.系统._管理考核.通牒主因 = '旧亏空';
  data.系统._管理考核.通牒原因 = '旧审核';
  data.系统._管理考核.母亲圆场 = { 危险轮次起期: 2, 上次使用期: 3, 事件ID: '旧圆场' };
  准备完整视频终幕(data);
  data.背包.push(公寓楼总钥匙ID);
  完成母亲视频通话终幕(data);

  const 动作 = 执行双重继承地点动作(data, '归位总钥匙', '302', 123);
  assert.equal(data.系统._双重继承.阶段, '待总钥匙归位', '点击只生成一回合正文，不能提前写完成');
  const 提交 = 提交双重继承剧情事件(data, 动作.事件, '302', 123);
  assert.equal(提交.成功, true, 提交.提示);
  assert.equal(data.系统._双重继承.阶段, '已完成');
  assert.equal(data.系统._双重继承.完成楼层, 123);
  assert.equal(data.系统._已完成特殊场景.filter(id => id === 双重继承完成ID).length, 1);
  assert.equal(data.背包.includes(公寓楼总钥匙ID), false);
  assert.equal(data.系统._通牒期, -1);
  assert.equal(data.系统._管理考核.通牒主因, '');
  assert.equal(data.系统._管理考核.母亲圆场.事件ID, '');
  assert.equal(data.系统._待接来电.期, -1);
  assert.equal(data.系统._父亲通话.标识, '');
  assert.equal(data.胜任度, 12, '经营表现继续存在，不因交权被重置');
  assert.equal(data.系统._双重继承.群聊余波状态, '待发送');
  assert.equal(data.系统._双重继承.群聊余波最早时段, data.系统._绝对时段 + 1);
  assert.equal(
    data.系统._双重继承.下次父亲家常联络时段,
    data.系统._绝对时段 + 经济配置.父亲结局后来电间隔时段,
  );
  assert.equal(双重继承后父亲已退出管理(data), true);
});

test('结局后姐妹群余波只在下一安全夜晚触发，写入成功后才消费一次性水位', () => {
  const data = 建数据(20);
  原子完成结局(data);
  assert.equal(双重继承结局群聊余波可触发(data), false);
  data.系统._绝对时段 = 21;
  assert.equal(双重继承结局群聊余波可触发(data), false, '傍晚尚未进入姐妹群安全夜间');
  data.系统._绝对时段 = 22;
  assert.equal(双重继承结局群聊余波可触发(data), true);
  assert.equal(提交双重继承结局群聊余波(data, false), false);
  assert.equal(data.系统._双重继承.群聊余波状态, '待发送');
  assert.equal(提交双重继承结局群聊余波(data, true), true);
  assert.equal(data.系统._双重继承.群聊余波状态, '已完成');
  assert.equal(双重继承结局群聊余波可触发(data), false);
  assert.match(群聊源码, /双重继承结局姐妹群余波一拍/);
  assert.match(隐私源码, /双重继承余波禁入事实/);
});

test('结局后父亲只建立14～21日一次的低频家常电话，不恢复楼务批准权', () => {
  const data = 建数据(20);
  原子完成结局(data);
  const 到期 = data.系统._双重继承.下次父亲家常联络时段;
  data.系统._绝对时段 = 到期;
  assert.equal(双重继承结局后父亲家常联络可建立(data), true);
  const 结果 = 同步双重继承结局后父亲家常联络(data);
  assert.equal(结果.变动, true, 结果.提示);
  assert.equal(是双重继承后家常报表(data.系统._待接来电.报表), true);
  assert.doesNotMatch(data.系统._待接来电.报表, /账本|维修|欠租|上交|胜任度|审核|通牒/);
  assert.equal(data.系统._待接来电.通牒, false);
  const 间隔 = data.系统._双重继承.下次父亲家常联络时段 - data.系统._绝对时段;
  assert.ok(间隔 >= 14 * 6 && 间隔 <= 21 * 6);
  assert.match(父亲源码, /永久退出楼务审核/);
  assert.match(父亲源码, /严禁主动询问账本、上交、维修、租户/);
});

test('父亲审核永久结束但经济玩法仍保留，源码与策略不再把《回国》误当正式交权', () => {
  const data = 建数据();
  assert.equal(双重继承后父亲已退出管理(data), false, '仅《回国》完成不能结束父亲审核');
  原子完成结局(data);
  assert.equal(双重继承后父亲已退出管理(data), true);
  assert.equal(双重继承阻止普通父亲联络(data), true);
  assert.match(经济源码, /const 父亲审核已结束 = 双重继承完成事实\(data\)/);
  assert.doesNotMatch(经济源码, /const 父亲审核已结束 = 回国完成事实\(data\)/);
  assert.match(经济源码, /父亲审核已结束/);
  assert.match(经济源码, /收租|维修|现金|胜任度/);
});

test('11张主体CG、商店、背包、地图瓷砖和视频后最终动作均已接入正式产品路径', () => {
  const 目录 = new URL('../../src/人妻公寓/素材/特殊场景/双重继承/', import.meta.url);
  const 文件 = readdirSync(目录).filter(名 => 名.endsWith('.webp')).sort();
  assert.equal(文件.length, 11);
  assert.deepEqual(
    文件,
    [
      '双重继承_01_公寓外部检查.webp',
      '双重继承_02_大堂检查.webp',
      '双重继承_03_信箱区检查.webp',
      '双重继承_04_楼梯间检查.webp',
      '双重继承_05_垃圾房检查.webp',
      '双重继承_06_公共洗手间检查.webp',
      '双重继承_07_健身房检查.webp',
      '双重继承_08_天台检查.webp',
      '双重继承_09_管理员室完全交权.webp',
      '双重继承_10_父亲交出公寓楼总钥匙.webp',
      '双重继承_11_302三人早餐.webp',
    ],
  );
  assert.match(客户端源码, /双重继承商店已上架/);
  assert.match(客户端源码, /双重继承最终收束锁/);
  assert.match(房间动作源码, /添加双重继承动作/);
  assert.match(视频源码, /还要在302亲自处理公寓楼总钥匙/);
  assert.match(路线源码, /把公寓楼总钥匙放到她的钥匙旁/);
});

test('《双重继承》公共验收与最终钥匙动作在其他强剧情期间不可见且旧按钮失败关闭', () => {
  const 验收 = 建数据();
  购买并启动(验收);
  验收.系统._特殊场景.id = '借种';
  assert.equal(双重继承地点动作(验收, '大堂').some(动作 => 动作.id === '检查公共区域'), false);
  assert.equal(执行双重继承地点动作(验收, '检查公共区域', '大堂', 1).成功, false);
  assert.deepEqual(验收.系统._双重继承.已检查公共区域, []);

  const 收束 = 建数据();
  完成到钥匙收束(收束);
  收束.系统._荣耀洞拍 = 0;
  assert.equal(双重继承地点动作(收束, '302').some(动作 => 动作.id === '归位总钥匙'), false);
  assert.equal(执行双重继承地点动作(收束, '归位总钥匙', '302', 2).成功, false);
  assert.equal(收束.系统._双重继承.阶段, '待总钥匙归位');
  assert.equal(收束.背包.includes(公寓楼总钥匙ID), true);
});

test('《双重继承》最终迟到票遇其他特殊场景后失败关闭，不移除钥匙也不提交长期后果', () => {
  const data = 建数据();
  完成到钥匙收束(data);
  const 动作 = 执行双重继承地点动作(data, '归位总钥匙', '302', 300);
  assert.equal(动作.成功, true, 动作.提示);
  data.系统._特殊场景.id = '借种';

  const 迟到 = 提交双重继承剧情事件(data, 动作.事件, '302', 300);
  assert.equal(迟到?.成功, false);
  assert.equal(data.系统._双重继承.阶段, '待总钥匙归位');
  assert.equal(data.背包.includes(公寓楼总钥匙ID), true);
  assert.equal(data.系统._已完成特殊场景.includes(双重继承完成ID), false);
});

test('完成ID旧档恢复与正式完成共用幂等规范化：清旧审核、保留已建立余波水位与合法家常', () => {
  const 旧审核 = 建数据(80);
  旧审核.系统._已完成特殊场景.push(双重继承完成ID);
  旧审核.系统._双重继承 = {
    ...旧审核.系统._双重继承,
    阶段: '待机场视频',
    群聊余波状态: '已完成',
    群聊余波最早时段: 40,
    父亲家常联络序号: 3,
    下次父亲家常联络时段: 140,
  };
  旧审核.系统._父亲通话 = {
    ...旧审核.系统._父亲通话,
    标识: '旧审核电话',
    模式: '普通审核',
    状态: '通话中',
    期: 9,
    报表: '本期应交不足，逐条问账',
  };
  同步双重继承时间节点(旧审核, 66);
  assert.equal(旧审核.系统._双重继承.阶段, '已完成');
  assert.equal(旧审核.系统._父亲通话.标识, '');
  assert.equal(旧审核.系统._双重继承.群聊余波状态, '已完成');
  assert.equal(旧审核.系统._双重继承.群聊余波最早时段, 40);
  assert.equal(旧审核.系统._双重继承.父亲家常联络序号, 3);
  assert.equal(旧审核.系统._双重继承.下次父亲家常联络时段, 140);

  const 合法家常 = 建数据(80);
  合法家常.系统._已完成特殊场景.push(双重继承完成ID);
  合法家常.系统._双重继承.阶段 = '待机场视频';
  合法家常.系统._双重继承.群聊余波状态 = '待发送';
  合法家常.系统._双重继承.群聊余波最早时段 = 70;
  合法家常.系统._双重继承.下次父亲家常联络时段 = 150;
  合法家常.系统._父亲通话 = {
    ...合法家常.系统._父亲通话,
    标识: '家常-4',
    模式: '双重继承后家常',
    状态: '通话中',
    期: 4,
    分数段: '家常',
    报表: '双重继承后家常：问问儿子的饮食和身体。',
  };
  同步双重继承时间节点(合法家常, 67);
  assert.equal(合法家常.系统._父亲通话.标识, '家常-4', '旧档恢复不能误清理合法的新家常通话');
  assert.equal(合法家常.系统._双重继承.群聊余波最早时段, 70);
  assert.equal(合法家常.系统._双重继承.下次父亲家常联络时段, 150);

  const 待接家常 = 建数据(80);
  待接家常.系统._双重继承.阶段 = '已完成';
  待接家常.系统._已完成特殊场景.push(双重继承完成ID);
  待接家常.系统._双重继承.群聊余波状态 = '已完成';
  待接家常.系统._双重继承.下次父亲家常联络时段 = 180;
  待接家常.系统._待接来电 = {
    期: 5,
    分数段: '家常',
    报表: '双重继承后家常：父亲问问最近吃饭和身体。',
    通牒: false,
    紧急: false,
    母亲圆场: { 触发: false, 事件ID: '', 摘要: '', 仅剧情: false },
  };
  assert.equal(同步双重继承完成后状态(待接家常, 99), true);
  assert.equal(待接家常.系统._待接来电.期, 5, '结局后已经排到手机上的家常电话不能被重复规范化清掉');
  assert.equal(待接家常.系统._待接来电.分数段, '家常');
  assert.equal(同步双重继承完成后状态(待接家常, 100), false);
  assert.equal(待接家常.系统._待接来电.期, 5);
});

test('阶段已完成但缺少新长期字段的旧v9存档会补齐，未知完成楼绝不伪造成当前后续楼', () => {
  const 阶段已完成 = 建数据(120);
  阶段已完成.系统._双重继承.阶段 = '已完成';
  阶段已完成.系统._双重继承.完成楼层 = -1;
  阶段已完成.系统._双重继承.群聊余波状态 = '未建立';
  阶段已完成.系统._双重继承.群聊余波最早时段 = -1;
  阶段已完成.系统._双重继承.下次父亲家常联络时段 = -1;
  assert.equal(同步双重继承完成后状态(阶段已完成, 999), true);
  assert.equal(阶段已完成.系统._双重继承.完成楼层, -1);
  assert.equal(阶段已完成.系统._双重继承.群聊余波状态, '待发送');
  assert.equal(阶段已完成.系统._双重继承.群聊余波最早时段, 121);
  assert.equal(阶段已完成.系统._双重继承.下次父亲家常联络时段, 120 + 经济配置.父亲结局后来电间隔时段);
  assert.equal(同步双重继承完成后状态(阶段已完成, 1000), false, '重复启动不得重排已补齐水位');

  const 只有完成ID = 建数据(120);
  只有完成ID.系统._已完成特殊场景.push(双重继承完成ID);
  assert.equal(同步双重继承时间节点(只有完成ID, 777).变动, true);
  assert.equal(只有完成ID.系统._双重继承.完成楼层, -1, '恢复点不是结局楼，不能伪造封存边界');
});

test('结局后家常电话遇荣耀洞或302医院硬锁只顺延，未建立前不得推进联络水位', () => {
  for (const 占用 of ['荣耀洞', '医院']) {
    const data = 建数据(20);
    原子完成结局(data);
    const 到期 = data.系统._双重继承.下次父亲家常联络时段;
    data.系统._绝对时段 = 到期;
    if (占用 === '荣耀洞') data.系统._荣耀洞拍 = 0;
    else data.户['302'].妻._生产.状态 = '住院中';

    assert.equal(双重继承结局后父亲家常联络可建立(data), false, `${占用}期间不得建立家常电话`);
    const 结果 = 同步双重继承结局后父亲家常联络(data);
    assert.equal(结果.变动, false);
    assert.equal(data.系统._双重继承.下次父亲家常联络时段, 到期, '被强剧情阻塞时必须保留本次到期水位');
    assert.equal(data.系统._双重继承.父亲家常联络序号, 0);
    assert.equal(data.系统._待接来电.期, -1);
  }
});
