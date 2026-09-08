/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 门牌列表, 道具表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 通关成绩Schema, 通关纪念Schema } = require('../../src/人妻公寓/通关纪念存档.ts');
const { 推进时段 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 追加等待场景剧情 } = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const {
  通关角色结果,
  构造通关成绩,
  同步通关进度,
  通关结算可展示,
  准备通关结算,
  待庆祝通关成绩,
  确认通关庆祝,
  登记本局CG,
} = require('../../src/人妻公寓/脚本/游戏逻辑/通关结算.ts');

const 五线完成ID = ['借种', '录像带结局', '角色路线:201:结局剧情', '角色路线:301:结局剧情', '双重继承'];
const 合法服饰 = Object.values(道具表)
  .filter(项 => 项.类别 === '服饰')
  .map(项 => 项.id);

function 开局(时段 = 0) {
  return Schema.parse({
    户: Object.fromEntries(门牌列表.map(门牌 => [门牌, 创建户节点(0)])),
    系统: { _序章完成: true, _绝对时段: 时段 },
  });
}

function 全员完成(时段 = 0) {
  const data = 开局(时段);
  data.系统._已完成特殊场景 = [...五线完成ID];
  return data;
}

function 到期(时段 = 5) {
  const data = 全员完成(时段);
  assert.equal(同步通关进度(data), true);
  推进时段(data, 2);
  return data;
}

function 收集服饰(data, 数量) {
  assert.ok(数量 <= 合法服饰.length * 门牌列表.length, '实际商品表应有足够合法服饰');
  let 剩余 = 数量;
  for (const 门牌 of 门牌列表) {
    const 件数 = Math.min(剩余, 合法服饰.length);
    data.户[门牌].妻._衣柜 = 合法服饰.slice(0, 件数);
    剩余 -= 件数;
  }
}

function 收集CG(data, 数量) {
  登记本局CG(
    data,
    Array.from({ length: 数量 }, (_, index) => `本局图片-${index}`),
  );
}

test('六位角色需要五条真实结局，共享录像带同时满足102和202', () => {
  const data = 全员完成();
  const 成绩 = 构造通关成绩(data);
  assert.deepEqual(
    成绩.角色.map(项 => [项.门牌, 项.姓名, 项.完成]),
    [
      ['101', '夏乔', true],
      ['102', '沈静仪', true],
      ['201', '许曼君', true],
      ['202', '周小满', true],
      ['301', '安若妍', true],
      ['302', '母亲', true],
    ],
  );
  assert.equal(成绩.结局线路数, 5);
  assert.equal(成绩.评级, 'S');
  assert.deepEqual(通关成绩Schema.parse(成绩), 成绩);
});

for (const [说明, 完成ID, 阶段] of [
  ['当前完成ID', '录像带结局', '未开始'],
  ['旧录像带别名', '录像带', '未开始'],
  ['V4已完成阶段', null, '已完成'],
]) {
  test(`共享录像带兼容${说明}，两位角色都完成且只算一条线路`, () => {
    const data = 开局();
    data.系统._已完成特殊场景 = 完成ID ? [完成ID] : [];
    data.系统._录像带V4.阶段 = 阶段;
    assert.deepEqual(
      通关角色结果(data)
        .filter(项 => 项.完成)
        .map(项 => 项.门牌),
      ['102', '202'],
    );
    assert.equal(构造通关成绩(data).结局线路数, 1);
  });
}

test('结局收集列表把录像带新旧ID归一去重，未知ID不算特殊剧情', () => {
  const data = 全员完成();
  data.系统._已完成特殊场景.push('录像带', '录像带结局', '静音会议', '静音会议', '不存在的剧情');
  const 成绩 = 构造通关成绩(data);
  assert.equal(成绩.特殊剧情.filter(id => id === '录像带结局').length, 1);
  assert.equal(成绩.特殊剧情.includes('录像带'), false);
  assert.equal(成绩.特殊剧情.includes('不存在的剧情'), false);
  assert.equal(成绩.探索项[0].分数, 20);
});

test('全员L5、承接线和201法律离婚都不能替代正式结局', () => {
  const data = 开局(12);
  for (const 门牌 of 门牌列表) data.户[门牌].妻.当前阶段 = 5;
  data.系统._已完成特殊场景 = ['家庭计划', '第二机位', '不再留门', '不必停', '回国'];
  data.系统._许曼君分居.阶段 = '已完成';
  data.系统._许曼君离婚.法律离婚已成立 = true;
  data.系统._安若妍换掉.阶段 = '已完成';
  assert.ok(通关角色结果(data).every(项 => !项.完成));
  assert.equal(同步通关进度(data), false);
  assert.equal(data.系统._通关纪念.全员完成时段, -1);
  assert.equal(准备通关结算(data, '管理员室'), false);
  assert.equal(构造通关成绩(data).评级, 'A');
});

test('201和302保留正式已完成阶段的旧档兼容，缺失角色仍不能全员完成', () => {
  const data = 开局();
  data.系统._许曼君离婚.阶段 = '已完成';
  data.系统._双重继承.阶段 = '已完成';
  assert.deepEqual(
    通关角色结果(data)
      .filter(项 => 项.完成)
      .map(项 => 项.门牌),
    ['201', '302'],
  );
  data.系统._已完成特殊场景 = [...五线完成ID];
  delete data.户['302'];
  assert.equal(通关角色结果(data).find(项 => 项.门牌 === '302').完成, false);
  assert.equal(同步通关进度(data), false);
});

test('最后一条结局完成时刻才建立T，跨日经过两个世界时段后可展示', () => {
  const data = 全员完成(4);
  data.系统._已完成特殊场景 = 五线完成ID.filter(id => id !== '双重继承');
  assert.equal(同步通关进度(data), false);
  推进时段(data, 1);
  data.系统._已完成特殊场景.push('双重继承');
  assert.equal(同步通关进度(data), true);
  assert.equal(data.系统._通关纪念.全员完成时段, 5);
  assert.equal(通关结算可展示(data, '管理员室'), false);
  推进时段(data, 1);
  assert.equal(通关结算可展示(data, '管理员室'), false);
  推进时段(data, 1);
  assert.equal(通关结算可展示(data, '管理员室'), true);
  assert.equal(构造通关成绩(data).天数, 2);
  assert.equal(同步通关进度(data), false);
  assert.equal(data.系统._通关纪念.全员完成时段, 5);
});

test('直接跨过期限仍可展示，忙碌顺延不重置T也不提前写首次成绩', () => {
  const data = 到期();
  data.系统._场景剧情事务.id = '正在演出的剧情';
  推进时段(data, 6);
  assert.equal(同步通关进度(data), false);
  assert.equal(准备通关结算(data, '管理员室'), false);
  assert.equal(data.系统._通关纪念.首次成绩, null);
  assert.equal(data.系统._通关纪念.全员完成时段, 5);
  data.系统._场景剧情事务.id = '';
  assert.equal(准备通关结算(data, '管理员室'), true);
  assert.equal(data.系统._通关纪念.首次成绩.绝对时段, 13);
  assert.equal(data.系统._通关纪念.全员完成时段, 5);
});

test('远处等待票继续排队但不阻挡结算，当前地点等待票优先', () => {
  const data = 到期();
  追加等待场景剧情(data, '【日常预约】稍后在101见面', '101', '日常预约');
  const 前 = structuredClone(data);
  assert.equal(通关结算可展示(data, '管理员室'), true);
  assert.equal(通关结算可展示(data, '101'), false);
  assert.deepEqual(data, 前, '展示预检必须只读');
});

const 阻塞配置 = [
  [
    '普通活动事务',
    data => {
      data.系统._场景剧情事务.id = '固定剧情';
    },
  ],
  [
    '未知目标旧票',
    data => {
      data.系统._待发送事件 = '【旧强制剧情】原地点未知';
    },
  ],
  [
    '远处连续锁场票',
    data => {
      追加等待场景剧情(data, '【场景剧情连续锁场】继续现场', '302', '连续现场');
    },
  ],
  [
    '特殊场景',
    data => {
      data.系统._特殊场景.id = '静音会议';
    },
  ],
  [
    '专用荣耀洞场景',
    data => {
      data.系统._荣耀洞拍 = 0;
    },
  ],
  [
    '父亲通话标识',
    data => {
      data.系统._父亲通话.标识 = '家常电话';
    },
  ],
  [
    '父亲通话状态',
    data => {
      data.系统._父亲通话.状态 = '待接';
    },
  ],
  [
    '普通亲密现场',
    data => {
      data.系统._性爱场景.状态 = '进行中';
    },
  ],
];
for (const [名称, 设置] of 阻塞配置) {
  test(`${名称}未结束时不抢占、不消费通关成绩`, () => {
    const data = 到期();
    设置(data);
    const 前 = structuredClone(data);
    assert.equal(通关结算可展示(data, '管理员室'), false);
    assert.equal(准备通关结算(data, '管理员室'), false);
    assert.deepEqual(data, 前);
  });
}

test('序章未完成或已有坏结局时不建立或展示通关纪念', () => {
  for (const 设置 of [
    data => {
      data.系统._序章完成 = false;
    },
    data => {
      data.系统._坏结局 = '考验失败';
    },
  ]) {
    const data = 全员完成();
    设置(data);
    assert.equal(同步通关进度(data), false);
    data.系统._通关纪念.全员完成时段 = 0;
    推进时段(data, 2);
    assert.equal(准备通关结算(data, '管理员室'), false);
  }
});

test('首次成绩冻结且和当前数据解耦，关闭幂等并继续推进世界时间', () => {
  const data = 到期();
  assert.equal(准备通关结算(data, '管理员室'), true);
  const 首次 = structuredClone(data.系统._通关纪念.首次成绩);
  assert.equal(待庆祝通关成绩(data).评级, 'S');
  data.户['101'].妻.当前阶段 = 4;
  收集服饰(data, 40);
  收集CG(data, 120);
  data.系统._已完成特殊场景.push('静音会议');
  assert.equal(准备通关结算(data, '管理员室'), false);
  assert.deepEqual(data.系统._通关纪念.首次成绩, 首次);
  assert.equal(待庆祝通关成绩(data).评级, 'S', '首次还未关闭时仍展示首次成绩');
  assert.equal(确认通关庆祝(data, 'SSS'), false, '不能越级确认尚未展示的首次成绩');
  assert.equal(确认通关庆祝(data, 'S'), true);
  assert.equal(确认通关庆祝(data, 'S'), false);
  assert.equal(data.系统._坏结局, '');
  const 当前 = data.系统._绝对时段;
  推进时段(data, 1);
  assert.equal(data.系统._绝对时段, 当前 + 1);
  assert.deepEqual(data.系统._通关纪念.首次成绩, 首次);
});

test('关闭首次S后可通过结局后收藏晋级SS和SSS，无静音会议也能达到SSS', () => {
  const data = 到期();
  准备通关结算(data, '管理员室');
  确认通关庆祝(data, 'S');
  assert.equal(待庆祝通关成绩(data), null);
  收集服饰(data, 39);
  assert.equal(构造通关成绩(data).评级, 'S');
  收集服饰(data, 40);
  assert.equal(待庆祝通关成绩(data).评级, 'SS');
  assert.equal(确认通关庆祝(data, 'SS'), true);
  assert.equal(待庆祝通关成绩(data), null);
  收集CG(data, 117);
  assert.equal(构造通关成绩(data).探索分, 79);
  assert.equal(待庆祝通关成绩(data), null);
  收集CG(data, 120);
  assert.equal(待庆祝通关成绩(data).评级, 'SSS');
  assert.equal(构造通关成绩(data).探索分, 80);
  assert.equal(data.系统._已完成特殊场景.includes('静音会议'), false);
  assert.equal(确认通关庆祝(data, 'SSS'), true);
  assert.equal(确认通关庆祝(data, 'SS'), false);
  assert.equal(待庆祝通关成绩(data), null);
  assert.equal(data.系统._通关纪念.首次成绩.评级, 'S');
});

test('评级分项为静音会议20、服饰每件1封40、CG每三张1封40', () => {
  const data = 全员完成();
  收集服饰(data, 45);
  收集CG(data, 2);
  assert.deepEqual(
    构造通关成绩(data).探索项.map(项 => 项.分数),
    [0, 40, 0],
  );
  收集CG(data, 3);
  assert.deepEqual(
    构造通关成绩(data).探索项.map(项 => 项.分数),
    [0, 40, 1],
  );
  收集CG(data, 150);
  data.系统._已完成特殊场景.push('静音会议', '静音会议');
  const 成绩 = 构造通关成绩(data);
  assert.deepEqual(
    成绩.探索项.map(项 => 项.分数),
    [20, 40, 40],
  );
  assert.equal(成绩.探索分, 100);
  assert.equal(成绩.服饰数, 45);
  assert.equal(成绩.CG数, 150);
});

test('CG登记在同批和跨回合均去重，重复加载不增加成绩', () => {
  const data = 全员完成();
  assert.equal(登记本局CG(data, ['图A', '图A', '图B']), true);
  assert.equal(登记本局CG(data, ['图B', '图A']), false);
  assert.equal(登记本局CG(data, []), false);
  assert.equal(登记本局CG(data, ['图B', '图C']), true);
  assert.deepEqual(data.系统._通关纪念.CG记录, ['图A', '图B', '图C']);
  assert.equal(构造通关成绩(data).CG数, 3);
  assert.equal(构造通关成绩(data).探索项[2].分数, 1);
});

test('服饰只按每位角色持有的不同合法SKU计数，重复物品和背包不加分', () => {
  const data = 全员完成();
  const [A, B] = 合法服饰;
  const 其他道具 = Object.values(道具表).find(项 => 项.类别 !== '服饰').id;
  data.户['101'].妻._衣柜 = [A, A, B, '虚构服饰SKU', 其他道具];
  data.户['102'].妻._衣柜 = [A, A];
  data.背包 = [...合法服饰];
  assert.equal(构造通关成绩(data).服饰数, 3, '同款送给两人是两份收藏，仅在每人衣柜内去重');
  assert.equal(构造通关成绩(data).探索项[1].分数, 3);
});

test('201归宿消费分居系统保存的最终关系选择', () => {
  for (const [选择, 预期] of [
    ['继续关系', /与你继续/],
    ['退出关系', /这段关系都已告别/],
    ['暂不承诺', /留给时间/],
  ]) {
    const data = 全员完成();
    data.系统._许曼君分居.玩家最终关系选择 = 选择;
    assert.match(通关角色结果(data).find(项 => 项.门牌 === '201').归宿, 预期);
  }
});

test('旧v9存档补空纪念字段，全员完成旧档从首次观察时起等待两个时段', () => {
  const 旧档 = 全员完成(41);
  delete 旧档.系统._通关纪念;
  const data = Schema.parse(JSON.parse(JSON.stringify(旧档)));
  assert.equal(data.系统._数据版本, 9);
  assert.deepEqual(data.系统._通关纪念, {
    全员完成时段: -1,
    CG记录: [],
    首次成绩: null,
    已庆祝评级: '',
  });
  assert.equal(同步通关进度(data), true);
  assert.equal(data.系统._通关纪念.全员完成时段, 41);
  assert.equal(准备通关结算(data, '管理员室'), false);
  推进时段(data, 2);
  assert.equal(准备通关结算(data, '管理员室'), true);
});

test('整表快照恢复到完成前会还原计时和收藏，不从未来分支泄漏首次成绩', () => {
  const data = 全员完成(5);
  data.系统._已完成特殊场景 = 五线完成ID.filter(id => id !== '双重继承');
  登记本局CG(data, ['完成前图片']);
  const 完成前快照 = JSON.stringify(data);
  data.系统._已完成特殊场景.push('双重继承');
  同步通关进度(data);
  推进时段(data, 2);
  登记本局CG(data, ['未来图片']);
  准备通关结算(data, '管理员室');
  确认通关庆祝(data, 'S');
  const 恢复 = Schema.parse(JSON.parse(完成前快照));
  assert.equal(恢复.系统._通关纪念.全员完成时段, -1);
  assert.equal(恢复.系统._通关纪念.首次成绩, null);
  assert.equal(恢复.系统._通关纪念.已庆祝评级, '');
  assert.deepEqual(恢复.系统._通关纪念.CG记录, ['完成前图片']);
  assert.equal(同步通关进度(恢复), false);
  推进时段(恢复, 3);
  恢复.系统._已完成特殊场景.push('双重继承');
  assert.equal(同步通关进度(恢复), true);
  assert.equal(恢复.系统._通关纪念.全员完成时段, 8);
});

test('回档到已庆祝快照保留该时刻记录，重开使用的出厂Schema得到独立空记录', () => {
  const data = 到期();
  收集CG(data, 3);
  准备通关结算(data, '管理员室');
  确认通关庆祝(data, 'S');
  const 保存 = JSON.stringify(data);
  收集服饰(data, 40);
  确认通关庆祝(data, 'SS');
  const 恢复 = Schema.parse(JSON.parse(保存));
  assert.equal(恢复.系统._通关纪念.已庆祝评级, 'S');
  assert.equal(待庆祝通关成绩(恢复), null);
  const 新局 = Schema.parse({});
  assert.deepEqual(新局.系统._通关纪念, 通关纪念Schema.parse({}));
  assert.equal(新局.系统._通关纪念.首次成绩, null);
  assert.deepEqual(新局.系统._通关纪念.CG记录, []);
  assert.equal(新局.系统._通关纪念.全员完成时段, -1);
  新局.系统._通关纪念.CG记录.push('新局图片');
  assert.deepEqual(Schema.parse({}).系统._通关纪念.CG记录, [], '出厂默认数组不能在不同局间共用');
});

test('首次展示前完成事实撤销会清除等待钟，下次全员完成重新计时', () => {
  const data = 到期();
  data.系统._已完成特殊场景 = 五线完成ID.filter(id => id !== '借种');
  assert.equal(同步通关进度(data), true);
  assert.equal(data.系统._通关纪念.全员完成时段, -1);
  assert.equal(准备通关结算(data, '管理员室'), false);
  data.系统._已完成特殊场景.push('借种');
  assert.equal(同步通关进度(data), true);
  assert.equal(data.系统._通关纪念.全员完成时段, 7);
  assert.equal(通关结算可展示(data, '管理员室'), false);
});
