/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 查特殊场景, 查道具 } = require('../../src/人妻公寓/stageConfig.ts');
const {
  保证夏乔借种受孕,
  判定受孕,
  怀孕认知提示,
  推进怀孕告知,
  确认怀孕微信已送达,
} = require('../../src/人妻公寓/脚本/游戏逻辑/怀孕系统.ts');
const {
  借种开场事件,
  借种医院待产CG,
  借种离线监控待确认,
  借种启动条件提示,
  借种三人合照可拍,
  借种三人日常,
  借种三人日常可用,
  借种产后家庭合照可拍,
  借种朋友圈选择可用,
  借种阳性结果可查看,
  购买借种场景票,
  停止借种结局,
  启动借种结局,
  拍摄借种三人合照,
  拍摄借种产后家庭合照,
  设置借种朋友圈选择,
  拆除借种摄像头,
  推进借种开场,
  提交借种阳性结果,
  确认借种监控断线,
  结算借种亲密收尾,
} = require('../../src/人妻公寓/脚本/游戏逻辑/借种结局系统.ts');
const {
  借种场次标识,
  借种摄像头已拆键,
  借种断线已确认键,
  借种结局已完成,
  借种三人合照待拍,
  借种三人合照已拍,
  借种三人日常本周已用,
  借种产后家庭合照待拍,
  借种产后家庭合照已拍,
  同步借种产后家庭合照待拍,
  借种101持久背景文件,
  借种朋友圈选择状态,
  借种暂禁重装101,
  是借种受孕场次,
  夏乔家庭计划后果有效,
  列出借种产后家庭合照待拍凭据,
} = require('../../src/人妻公寓/脚本/游戏逻辑/借种结局状态.ts');
const {
  生产动作系统注入,
  生产地点动作,
  结算实际生产,
  提交生产叙事完成,
} = require('../../src/人妻公寓/脚本/游戏逻辑/生产系统.ts');

const index源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 玩家资源源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts', import.meta.url), 'utf8');
const 房间动作源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts', import.meta.url),
  'utf8',
);
const 孕情通知源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/孕情AI通知.ts', import.meta.url),
  'utf8',
);
const 群聊节拍源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url),
  'utf8',
);
const 客户端源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 监控组件源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/components/监控.vue', import.meta.url),
  'utf8',
);
const 客户端素材源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/assets.ts', import.meta.url), 'utf8');
const 手机资源源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/资源与皮肤.ts', import.meta.url),
  'utf8',
);
const B事实路径 = new URL('../../src/人妻公寓/脚本/游戏逻辑/夏乔借种结局事实.ts', import.meta.url);
const B系统路径 = new URL('../../src/人妻公寓/脚本/游戏逻辑/夏乔借种结局系统.ts', import.meta.url);
const B测试路径 = new URL('./夏乔借种结局系统.test.mjs', import.meta.url);

function 建数据({ 摄像头 = true, 带票 = true } = {}) {
  const data = Schema.parse({
    户: { 101: 创建户节点(0) },
    系统: { _绝对时段: 4, _家庭计划: { 阶段: '已完成' }, _摄像头布设: { 101: 摄像头 } },
    背包: 带票 ? ['借种'] : [],
  });
  data.户['101'].妻.当前阶段 = 5;
  data.户['101'].妻.好感值 = 85;
  data.户['101'].妻.堕落值 = 90;
  return data;
}

function 有效普通受孕输入(场次标识 = '普通:101:1') {
  return {
    场次标识,
    结束方式: '主动收尾',
    最终位置: '小屄',
    收尾对象门牌: '101',
    保护状态: '未使用',
    当前行为: '阴道插入',
  };
}

function 加孩子(data, 胎次) {
  data.系统._家庭文档.孩子.push({
    id: `测试孩子:${胎次}`,
    母亲门牌: '101',
    胎次,
    性别: 胎次 % 2 ? '女' : '男',
    出生绝对时段: 胎次,
    结果: '完全缺席',
    玩家产后看望: false,
    获知生产路径: '私聊',
    叙事最小年龄: 0,
    年龄阶段: '新生儿',
    出生场次标识: `普通出生:${胎次}`,
  });
}

function 准备借种亲密(data = 建数据()) {
  assert.equal(拆除借种摄像头(data, '101', true, true).成功, true);
  assert.equal(确认借种监控断线(data, '302').成功, true);
  assert.equal(启动借种结局(data, '101', 20).成功, true);
  assert.equal(推进借种开场(data), true);
  return data;
}

function 完成借种并读邀约(data = 建数据()) {
  assert.equal(拆除借种摄像头(data, '101', true, true).成功, true);
  assert.equal(确认借种监控断线(data, '302').成功, true);
  assert.equal(启动借种结局(data, '101', 20).成功, true);
  assert.equal(推进借种开场(data), true);
  const 场次标识 = 借种场次标识(data, 22);
  const 结算 = 结算借种亲密收尾(data, {
    ...Schema.parse({}).系统._上次性爱结果,
    ...有效普通受孕输入(场次标识),
  });
  assert.equal(结算.完成, true);
  data.系统._绝对时段 = data.户['101'].妻._怀孕.预计告知绝对时段;
  assert.deepEqual(推进怀孕告知(data), ['101']);
  assert.deepEqual(确认怀孕微信已送达(data, [{ 门牌: '101', 场次标识 }]), ['101']);
  return { data, 场次标识 };
}

function 完成借种并确认阳性(data = 建数据()) {
  const 结果 = 完成借种并读邀约(data);
  assert.equal(提交借种阳性结果(结果.data, '101', true, true).成功, true);
  return 结果;
}

test('借种医院待产图接管首胎及其后续家庭计划胎，但只覆盖真实产前动作', () => {
  const data = 建数据();
  data.系统._已完成特殊场景.push('借种');
  data.户['101'].妻._怀孕.受孕场次标识 = '借种结局:101:22:1';
  data.户['101'].妻._生产.状态 = '待产';
  data.户['101'].妻._生产.家庭计划知情 = true;

  assert.equal(借种医院待产CG(data, '101', '产前看望'), '借种_医院待产三人');
  assert.equal(借种医院待产CG(data, '101', '留下陪产'), '借种_医院待产三人');
  assert.equal(借种医院待产CG(data, '101', '等待生产'), '', '生产硬结算后不能继续展示待产图');
  assert.equal(借种医院待产CG(data, '101', '产后看望'), '', '产后必须交回产后图与家庭照流程');

  data.户['101'].妻._怀孕.受孕场次标识 = '普通第二胎:101:220';
  data.户['101'].妻._生产.本胎序号 = 2;
  assert.equal(借种医院待产CG(data, '101', '产前看望'), '借种_医院待产三人');

  const 普通 = 建数据();
  普通.户['101'].妻._怀孕.受孕场次标识 = '普通:101:22';
  普通.户['101'].妻._生产.状态 = '待产';
  assert.equal(借种医院待产CG(普通, '101', '产前看望'), '', '未建立借种家庭关系时仍使用通用待产图');
});

test('v0.85 已冻结的家庭计划知情旧档继续承认陆嘉明知情，但不伪造借种结局完成与照片资产', () => {
  const data = 建数据({ 带票: false });
  Object.assign(data.户['101'].妻._怀孕, {
    状态: '已告知',
    受孕场次标识: 'rq0.85:普通家庭计划受孕:101',
    已曝光: false,
  });
  Object.assign(data.户['101'].妻._生产, {
    状态: '孕期',
    本胎序号: 1,
    家庭计划知情: true,
  });

  assert.equal(借种结局已完成(data), false, '兼容旧档不能倒签新版借种结局');
  assert.equal(
    夏乔家庭计划后果有效(data, {
      场次标识: data.户['101'].妻._怀孕.受孕场次标识,
      家庭计划知情: true,
      胎次: 1,
    }),
    true,
    '0.85 已冻结的丈夫知情事实必须继续有效',
  );
  assert.match(怀孕认知提示(data, '101'), /陆嘉明始终知情/);
  assert.doesNotMatch(怀孕认知提示(data, '101'), /丈夫与其他人不得凭空知道/);
  assert.match(生产动作系统注入(data, '101', '产前看望'), /陆嘉明/);
  assert.equal(借种101持久背景文件(data), '', '没有真实借种完成与实拍照片时不能开放新版持久背景');
});

test('借种已从路线占位升级为有价格的真实特殊场景', () => {
  const 场景 = 查特殊场景('借种');
  const 商品 = 查道具('借种');
  assert.ok(场景);
  assert.equal(场景.启动.地点, '101');
  assert.equal(场景.启动.方式, '背包使用');
  assert.equal(商品?.类别, '特殊场景');
  assert.ok((商品?.价格 ?? 0) > 0);
});

test('家庭计划完成前不能购买借种票，失败不扣款也不写背包', () => {
  const data = 建数据({ 带票: false });
  data.系统._家庭计划.阶段 = '未开始';
  data.现金 = 3000;
  const 购买前 = structuredClone(data);
  assert.equal(购买借种场景票(data, 1500).成功, false);
  assert.deepEqual(data, 购买前);
});

test('家庭计划完成后，普通周一亲密不能抢先触发夏乔第一胎', () => {
  const data = 建数据();
  assert.equal(判定受孕(data, 有效普通受孕输入()), '不符合');
  assert.equal(data.户['101'].妻._怀孕.状态, '未孕');
  assert.equal(data.户['101'].妻._怀孕.上次判定日, -1, '被阻断的普通行为不能占用当日判定');
});

test('拆除101摄像头与回302确认断线形成两段独立硬操作', () => {
  const data = 建数据();
  const 拆除 = 拆除借种摄像头(data, '101', true, true);
  assert.equal(拆除.成功, true);
  assert.equal(data.系统._摄像头布设['101'], false);
  assert.ok(data.背包.includes('针孔摄像头'));
  assert.ok(data.系统._特殊场景前置.includes(借种摄像头已拆键));
  assert.equal(借种离线监控待确认(data), true);

  assert.equal(确认借种监控断线(data, '101').成功, false, '不能站在101远程确认302监控');
  const 确认 = 确认借种监控断线(data, '302');
  assert.equal(确认.成功, true);
  assert.ok(data.系统._特殊场景前置.includes(借种断线已确认键));
  assert.equal(借种离线监控待确认(data), false);
});

test('没有撬门、101有人或没有真实摄像头时不能伪造拆机完成', () => {
  assert.equal(拆除借种摄像头(建数据(), '101', false, true).成功, false);
  assert.equal(拆除借种摄像头(建数据(), '101', true, false).成功, false);
  const 无机 = 建数据({ 摄像头: false });
  assert.equal(拆除借种摄像头(无机, '101', true, true).成功, false);
  assert.equal(无机.系统._特殊场景前置.includes(借种摄像头已拆键), false);
});

test('断线确认后只能在星期一晚上于101原子消费票并进入开场', () => {
  const data = 建数据();
  assert.equal(拆除借种摄像头(data, '101', true, true).成功, true);
  assert.equal(确认借种监控断线(data, '302').成功, true);

  const 错地点 = structuredClone(data);
  assert.equal(启动借种结局(错地点, '302', 20).成功, false);
  assert.ok(错地点.背包.includes('借种'));

  const 启动 = 启动借种结局(data, '101', 20);
  assert.equal(启动.成功, true);
  assert.equal(data.背包.includes('借种'), false);
  assert.equal(data.系统._特殊场景.id, '借种');
  assert.equal(data.系统._特殊场景.阶段, '开场');
  assert.deepEqual(data.系统._特殊场景.演出夫, ['101']);

  assert.equal(推进借种开场(data), true);
  assert.equal(data.系统._特殊场景.阶段, '亲密');
  assert.deepEqual(data.系统._特殊场景.演出妻, ['101']);
  assert.deepEqual(data.系统._特殊场景.演出夫, []);
});

test('星期、时段、医院、已孕、生产上限与全局互斥都会在启动瞬间复核且不吞票', () => {
  const 基线 = 建数据();
  assert.equal(拆除借种摄像头(基线, '101', true, true).成功, true);
  assert.equal(确认借种监控断线(基线, '302').成功, true);

  const 案例 = [
    ['错误星期', data => (data.系统._绝对时段 = 10)],
    ['错误时段', data => (data.系统._绝对时段 = 0)],
    ['医院硬锁', data => (data.户['101'].妻._生产.状态 = '住院中')],
    ['已有孕情', data => (data.户['101'].妻._怀孕.状态 = '已受孕')],
    [
      '生产上限',
      data => {
        加孩子(data, 1);
        加孩子(data, 2);
        加孩子(data, 3);
      },
    ],
    ['其他特殊场景', data => (data.系统._特殊场景.id = '换妻派对')],
    ['场景剧情事务', data => (data.系统._场景剧情事务.id = '未收束剧情')],
    ['待发送事件', data => (data.系统._待发送事件 = '未发送剧情')],
    [
      '父亲通话',
      data => {
        data.系统._父亲通话.标识 = '测试来电';
        data.系统._父亲通话.状态 = '通话中';
      },
    ],
  ];

  for (const [名称, 修改] of 案例) {
    const data = structuredClone(基线);
    修改(data);
    const 票数 = data.背包.filter(项 => 项 === '借种').length;
    const 结果 = 启动借种结局(data, '101', 20);
    assert.equal(结果.成功, false, `${名称}必须阻断`);
    assert.equal(data.背包.filter(项 => 项 === '借种').length, 票数, `${名称}不能吞票`);
    assert.notEqual(借种启动条件提示(data, '101'), '', `${名称}必须给出阻断原因`);
  }
});

test('借种固定开场生成失败可原拍重试，成功推进后不能重复消费同一拍', () => {
  const data = 建数据();
  assert.equal(拆除借种摄像头(data, '101', true, true).成功, true);
  assert.equal(确认借种监控断线(data, '302').成功, true);
  assert.equal(启动借种结局(data, '101', 20).成功, true);
  const 开场前 = structuredClone(data.系统._特殊场景);
  const 第一次 = 借种开场事件(data);
  const 第二次 = 借种开场事件(data);
  assert.equal(第一次, 第二次);
  assert.match(第一次, /【特殊场景·借种·开场】/u);
  assert.deepEqual(data.系统._特殊场景, 开场前, '读取开场票不得抢先推进，失败后仍可重试');
  assert.equal(推进借种开场(data), true);
  assert.equal(推进借种开场(data), false, '已推进的开场拍不能重复消费');
});

test('亲密开始前取消会恢复票并保留拆机断线资格', () => {
  const data = 建数据();
  assert.equal(拆除借种摄像头(data, '101', true, true).成功, true);
  assert.equal(确认借种监控断线(data, '302').成功, true);
  assert.equal(启动借种结局(data, '101', 20).成功, true);
  assert.equal(停止借种结局(data, '101').成功, true);
  assert.equal(data.背包.filter(项 => 项 === '借种').length, 1);
  assert.ok(data.系统._特殊场景前置.includes(借种摄像头已拆键));
  assert.ok(data.系统._特殊场景前置.includes(借种断线已确认键));
  assert.equal(data.系统._特殊场景.id, '');
});

test('有效借种收尾必定受孕，并在同一对象内登记完成与来源', () => {
  const data = 建数据();
  assert.equal(拆除借种摄像头(data, '101', true, true).成功, true);
  assert.equal(确认借种监控断线(data, '302').成功, true);
  assert.equal(启动借种结局(data, '101', 20).成功, true);
  assert.equal(推进借种开场(data), true);

  const 场次标识 = 借种场次标识(data, 22);
  const 结果 = {
    ...Schema.parse({}).系统._上次性爱结果,
    ...有效普通受孕输入(场次标识),
    有效楼数: 3,
    参与者: {
      101: {
        满意度: 5,
        满意目标: 5,
        偏好命中: ['阴道插入'],
        有效楼数: 3,
        结束方式: '主动收尾',
        时长评价: '合适',
        结局态度: '满足',
      },
    },
  };
  const 结算 = 结算借种亲密收尾(data, 结果);
  assert.equal(结算.接管, true);
  assert.equal(结算.完成, true);
  assert.equal(结算.受孕, '已受孕');
  assert.equal(借种结局已完成(data), true);
  assert.equal(data.户['101'].妻._怀孕.状态, '已受孕');
  assert.equal(data.户['101'].妻._怀孕.受孕场次标识, 场次标识);
  assert.equal(是借种受孕场次(data.户['101'].妻._怀孕.受孕场次标识), true);
  assert.equal(data.户['101'].妻._生产.家庭计划知情, true);
  assert.equal(data.系统._特殊场景.id, '');
  assert.equal(data.系统._特殊场景前置.includes(借种摄像头已拆键), false);
  assert.equal(data.系统._特殊场景前置.includes(借种断线已确认键), false);
  assert.ok(data.背包.includes('针孔摄像头'), '结局不会永久关闭摄像头，设备仍留在背包等待以后重装');
});

test('借种孕情微信只邀请赴约，必须到101查看阳性后才正式起算孕期', () => {
  const data = 建数据();
  data.风闻 = 90;
  assert.equal(拆除借种摄像头(data, '101', true, true).成功, true);
  assert.equal(确认借种监控断线(data, '302').成功, true);
  assert.equal(启动借种结局(data, '101', 20).成功, true);
  assert.equal(推进借种开场(data), true);
  const 场次标识 = 借种场次标识(data, 22);
  const 结算 = 结算借种亲密收尾(data, {
    ...Schema.parse({}).系统._上次性爱结果,
    ...有效普通受孕输入(场次标识),
  });
  assert.equal(结算.完成, true);

  data.系统._绝对时段 = data.户['101'].妻._怀孕.预计告知绝对时段;
  assert.deepEqual(推进怀孕告知(data), ['101']);
  assert.equal(data.户['101'].妻._怀孕.状态, '待告知');
  assert.equal(data.户['101'].妻._怀孕.已曝光, false, '高风闻也不能把默认私密借种邀约提前改成公开丑闻');
  assert.equal(
    data.系统._风闻账.最近事件.some(事件 => 事件.id.startsWith('怀孕曝光:101:')),
    false,
    '未单独设计公开版前不得登记借种怀孕曝光事件',
  );
  assert.deepEqual(确认怀孕微信已送达(data, [{ 门牌: '101', 场次标识 }]), ['101']);
  assert.equal(data.户['101'].妻._怀孕.状态, '待告知', '读邀请不能直接把阳性结果当面确认掉');
  assert.equal(借种阳性结果可查看(data, '302', true, true), false);
  assert.equal(借种阳性结果可查看(data, '101', true, true), true);

  const 阳性 = 提交借种阳性结果(data, '101', true, true);
  assert.equal(阳性.成功, true);
  assert.equal(data.户['101'].妻._怀孕.状态, '已告知');
  assert.equal(data.户['101'].妻._生产.状态, '孕期');
  assert.equal(借种阳性结果可查看(data, '101', true, true), false);
});

test('阳性确认必须夏乔与陆嘉明真实同场，任一缺席都零副作用', () => {
  const { data } = 完成借种并读邀约();
  const 入口快照 = structuredClone(data);
  assert.equal(借种阳性结果可查看(data, '101', false, true), false, '夏乔不在101时不能只凭地点按钮确认');
  assert.equal(借种阳性结果可查看(data, '101', true, false), false, '陆嘉明外出时不能把他传送进确认现场');
  assert.equal(提交借种阳性结果(data, '101', true, false).成功, false);
  assert.deepEqual(data, 入口快照, '失败确认不能启动孕期、登记待拍或改写丈夫排期');

  const 成功 = 提交借种阳性结果(data, '101', true, true);
  assert.equal(成功.成功, true);
  assert.match(成功.事件, /【事件在场妻:101】【事件在场夫:101】/u);
});

test('借种家庭内部知情不再与通用孕情提示冲突', () => {
  const { data } = 完成借种并确认阳性();
  const 提示 = 怀孕认知提示(data, '101');
  assert.match(提示, /陆嘉明始终知情并接受/u);
  assert.match(提示, /楼内其他人不得凭空知道/u);
  assert.doesNotMatch(提示, /丈夫与其他人不得凭空知道/u);
});

test('三人合照公开范围必须由玩家明确二选一，公开也只使用计划板安全裁切', () => {
  const { data, 场次标识 } = 完成借种并确认阳性();
  assert.equal(拍摄借种三人合照(data, '101', true, true).成功, true);
  assert.equal(借种朋友圈选择可用(data, '101', true, true), true);
  const 选择 = 设置借种朋友圈选择(data, '101', true, true, '发布');
  assert.equal(选择.成功, true);
  assert.equal(借种朋友圈选择状态(data, 场次标识), '发布');
  assert.match(选择.事件, /安全裁切/u);
  assert.match(选择.事件, /完整三人合照.*保持私密/u);
  assert.equal(设置借种朋友圈选择(data, '101', true, true, '私密').成功, false, '公开范围一旦提交不能反复改写');
  assert.equal(借种101持久背景文件(data), '101_借种结局计划板');
  assert.match(孕情通知源码, /借种朋友圈安全图 = '@ending\/夏乔借种\/101_借种结局计划板'/u);
  assert.match(孕情通知源码, /新圈\.push\(\{[\s\S]*图: 借种朋友圈安全图/u);
  assert.match(手机资源源码, /朋友圈图片地址[\s\S]*@ending\/夏乔借种\//u);
});

test('第二胎和第三胎继续承接陆嘉明知情、医院同场与专属待产画面', () => {
  const data = 建数据({ 带票: false, 摄像头: false });
  const 首胎来源 = '借种结局:101:4:22';
  data.系统._已完成特殊场景.push('借种');
  data.系统._家庭文档.孩子.push({
    id: '借种第一胎孩子',
    母亲门牌: '101',
    胎次: 1,
    性别: '女',
    出生绝对时段: 180,
    结果: '陪产',
    玩家产后看望: true,
    获知生产路径: '陪产',
    叙事最小年龄: 1,
    年龄阶段: '一岁以上',
    出生场次标识: 首胎来源,
  });
  data.户['101'].妻._怀孕.状态 = '已告知';
  data.户['101'].妻._怀孕.受孕场次标识 = '普通第二胎:101:220';
  Object.assign(data.户['101'].妻._生产, {
    状态: '待产',
    本胎序号: 2,
    家庭计划知情: true,
    预产通知已读: true,
  });

  assert.equal(
    夏乔家庭计划后果有效(data, {
      场次标识: data.户['101'].妻._怀孕.受孕场次标识,
      家庭计划知情: true,
      胎次: 2,
    }),
    true,
  );
  const 动作 = 生产地点动作(data, '医院');
  assert.ok(动作.some(项 => 项.文案.includes('陆嘉明')));
  const 注入 = 生产动作系统注入(data, '101', '产前看望');
  assert.match(注入, /【事件在场妻:101】【事件在场夫:101】/u);
  assert.match(注入, /陆嘉明本人就在医院/u);
  assert.doesNotMatch(注入, /不插入丈夫/u);
  assert.equal(借种医院待产CG(data, '101', '产前看望'), '借种_医院待产三人');
  assert.match(怀孕认知提示(data, '101'), /陆嘉明始终知情/u);
});

test('停止借种不会怀孕或完成结局，会恢复票并保留拆机前置供下次重试', () => {
  const data = 建数据();
  assert.equal(拆除借种摄像头(data, '101', true, true).成功, true);
  assert.equal(确认借种监控断线(data, '302').成功, true);
  assert.equal(启动借种结局(data, '101', 20).成功, true);
  assert.equal(推进借种开场(data), true);

  const 结果 = {
    ...Schema.parse({}).系统._上次性爱结果,
    场次标识: 借种场次标识(data, 22),
    结束方式: '主动收尾',
    最终位置: '停下并收尾',
    收尾对象门牌: '101',
    保护状态: '未使用',
    当前行为: '阴道插入',
  };
  const 结算 = 结算借种亲密收尾(data, 结果);
  assert.equal(结算.接管, true);
  assert.equal(结算.完成, false);
  assert.equal(data.户['101'].妻._怀孕.状态, '未孕');
  assert.equal(借种结局已完成(data), false);
  assert.ok(data.背包.includes('借种'));
  assert.ok(data.系统._特殊场景前置.includes(借种摄像头已拆键));
  assert.ok(data.系统._特殊场景前置.includes(借种断线已确认键));
  assert.equal(借种暂禁重装101(data), true, '放弃后仍持票且观察点已拆，重试前不得绕过断线账重新安装');
  assert.equal(data.系统._特殊场景.id, '');
});

test('受保护、非阴道、错误对象、错误位置、错误来源与非主动收尾都不能完成借种', () => {
  const 案例 = [
    ['受保护', { 保护状态: '安全套' }],
    ['非阴道行为', { 当前行为: '口交' }],
    ['错误对象', { 收尾对象门牌: '102' }],
    ['错误位置', { 最终位置: '胸部' }],
    ['错误来源', { 场次标识: '普通:101:4:22' }],
    ['体力耗尽', { 结束方式: '体力耗尽' }],
  ];
  for (const [名称, 覆盖] of 案例) {
    const data = 准备借种亲密();
    const 结果 = {
      ...Schema.parse({}).系统._上次性爱结果,
      ...有效普通受孕输入(借种场次标识(data, 22)),
      ...覆盖,
    };
    const 结算 = 结算借种亲密收尾(data, 结果);
    assert.equal(结算.接管, true, `${名称}仍应由借种唯一收口接管`);
    assert.equal(结算.完成, false, `${名称}不能完成`);
    assert.equal(data.户['101'].妻._怀孕.状态, '未孕');
    assert.equal(借种结局已完成(data), false);
    assert.equal(data.背包.filter(项 => 项 === '借种').length, 1);
  }
});

test('启动后条件漂移会原子失败：不覆盖既有孕情、不登记完成并恢复票', () => {
  const data = 准备借种亲密();
  data.户['101'].妻._怀孕.状态 = '已受孕';
  data.户['101'].妻._怀孕.受孕场次标识 = '其他既有孕情';
  const 场次标识 = 借种场次标识(data, 22);
  const 结算 = 结算借种亲密收尾(data, {
    ...Schema.parse({}).系统._上次性爱结果,
    ...有效普通受孕输入(场次标识),
  });
  assert.equal(结算.接管, true);
  assert.equal(结算.完成, false);
  assert.equal(结算.受孕, '不符合');
  assert.equal(data.户['101'].妻._怀孕.受孕场次标识, '其他既有孕情');
  assert.equal(借种结局已完成(data), false);
  assert.equal(data.背包.filter(项 => 项 === '借种').length, 1);
});

test('借种票购买失败零副作用，成功只扣一次并只入包一张票', () => {
  const data = 建数据({ 带票: false });
  data.现金 = 1499;
  const 失败前 = structuredClone(data);
  assert.equal(购买借种场景票(data, 1500).成功, false);
  assert.deepEqual(data, 失败前);

  data.现金 = 3000;
  assert.equal(购买借种场景票(data, 1500).成功, true);
  assert.equal(data.现金, 1500);
  assert.equal(data.背包.filter(x => x === '借种').length, 1);
  assert.equal(购买借种场景票(data, 1500).成功, false);
  assert.equal(data.现金, 1500);
  assert.equal(data.背包.filter(x => x === '借种').length, 1);
});

test('拆除真实观察点严格守恒：背包已有其他摄像头时仍只返还本次拆下的一枚', () => {
  const data = 建数据();
  data.背包.push('针孔摄像头');
  const 前数量 = data.背包.filter(x => x === '针孔摄像头').length;
  assert.equal(拆除借种摄像头(data, '101', true, true).成功, true);
  assert.equal(data.背包.filter(x => x === '针孔摄像头').length, 前数量 + 1);
  assert.equal(拆除借种摄像头(data, '101', true, true).变动, undefined, '重复拆除不得再返还设备');
  assert.equal(data.背包.filter(x => x === '针孔摄像头').length, 前数量 + 1);
});

test('借种来源令牌稳定、可识别且确定受孕重放幂等，不新增专用 Schema 分叉', () => {
  const data = 建数据();
  const 场次标识 = 借种场次标识(data, 88);
  assert.equal(场次标识, '借种结局:101:4:88');
  assert.equal(是借种受孕场次(场次标识), true);
  assert.equal(是借种受孕场次('普通:101:4:88'), false);
  assert.equal(Object.hasOwn(data.系统, '_夏乔借种'), false);
  assert.equal(保证夏乔借种受孕(data, 场次标识), '已受孕');
  assert.equal(保证夏乔借种受孕(data, 场次标识), '已受孕');
  assert.equal(保证夏乔借种受孕(data, '借种结局:101:4:89'), '不符合');
});

test('借种完成后解除101重装禁令，未来第二胎和第三胎仍能进入普通受孕判定', () => {
  const 完成数据 = 准备借种亲密();
  const 结算 = 结算借种亲密收尾(完成数据, {
    ...Schema.parse({}).系统._上次性爱结果,
    ...有效普通受孕输入(借种场次标识(完成数据, 22)),
  });
  assert.equal(结算.完成, true);
  assert.equal(借种暂禁重装101(完成数据), false);
  assert.match(index源码, /门牌号 === '101' && 借种暂禁重装101\(data\)/u);

  for (const 已生胎数 of [1, 2]) {
    const data = 建数据({ 带票: false, 摄像头: false });
    data.系统._已完成特殊场景.push('借种');
    for (let 胎次 = 1; 胎次 <= 已生胎数; 胎次 += 1) 加孩子(data, 胎次);
    const 普通结果 = 判定受孕(data, 有效普通受孕输入(`普通:101:后续:${已生胎数 + 1}`));
    assert.notEqual(普通结果, '不符合', `第${已生胎数 + 1}胎不能被借种首胎门永久封死`);
  }
});

test('阳性确认只登记待拍；三人真实同场拍照后，日常与手机消费者才获得照片事实', () => {
  const { data, 场次标识 } = 完成借种并确认阳性();
  assert.equal(借种三人合照待拍(data, 场次标识), true);
  assert.equal(借种三人合照已拍(data, 场次标识), false);
  assert.equal(借种三人合照可拍(data, '101', true, true), true);
  assert.equal(拍摄借种三人合照(data, '101', true, false).成功, false, '丈夫不在场不得伪造照片');
  assert.equal(借种三人日常可用(data, '101', true, true), false, '照片未拍前不得引用三人合照开展长期日常');

  const 拍照 = 拍摄借种三人合照(data, '101', true, true);
  assert.equal(拍照.成功, true);
  assert.equal(借种三人合照待拍(data, 场次标识), false);
  assert.equal(借种三人合照已拍(data, 场次标识), true);
  assert.equal(借种三人日常可用(data, '101', true, true), false, '三人日常只在固定的周日晚间开放');
  data.系统._绝对时段 = 82; // 第2周星期日晚上
  assert.equal(借种三人日常可用(data, '101', true, true), true);
  assert.equal(拍摄借种三人合照(data, '101', true, true).成功, false, '同一来源只能形成一张硬事实照片');
});

test('产后家庭合照必须由真实生产与陪产收束产生待拍票，再在医院现场消费一次', () => {
  const { data, 场次标识 } = 完成借种并确认阳性();
  data.户['101'].妻._生产.状态 = '陪产中';
  const 生产 = 结算实际生产(data, '101', '陪产', data.系统._绝对时段 + 2);
  assert.equal(生产.成功, true);
  assert.equal(同步借种产后家庭合照待拍(data), false, '陪产叙事尚未完成时不能先登记照片');
  assert.equal(提交生产叙事完成(data, '101').成功, true);
  const 胎次 = data.户['101'].妻._生产.本胎序号;
  assert.equal(借种产后家庭合照待拍(data, 场次标识, 胎次), true, '生产叙事提交应原子登记待拍凭据');
  assert.equal(同步借种产后家庭合照待拍(data), false, '重复同步不得再生产第二张待拍票');
  assert.equal(借种产后家庭合照可拍(data, '医院', true, true), true);

  const 拍照 = 拍摄借种产后家庭合照(data, '医院', true, true);
  assert.equal(拍照.成功, true);
  assert.equal(借种产后家庭合照待拍(data, 场次标识, 胎次), false);
  assert.equal(借种产后家庭合照已拍(data, 场次标识, 胎次), true);
  assert.equal(拍摄借种产后家庭合照(data, '医院', true, true).成功, false);
});

test('第一胎产后待拍凭据跨入第二胎后仍可在101恢复并消费，不留下孤儿键', () => {
  const { data, 场次标识 } = 完成借种并确认阳性();
  data.户['101'].妻._生产.状态 = '陪产中';
  assert.equal(结算实际生产(data, '101', '陪产', data.系统._绝对时段 + 2).成功, true);
  assert.equal(提交生产叙事完成(data, '101').成功, true);
  const 第一胎 = data.户['101'].妻._生产.本胎序号;
  assert.equal(借种产后家庭合照待拍(data, 场次标识, 第一胎), true);

  // 模拟玩家先推进到第二胎；当前指针已换，但第一胎稳定凭据仍必须可恢复。
  data.户['101'].妻._怀孕.状态 = '已告知';
  data.户['101'].妻._怀孕.受孕场次标识 = '普通第二胎:101:300';
  Object.assign(data.户['101'].妻._生产, {
    状态: '孕期',
    本胎序号: 2,
    家庭计划知情: true,
    生产结算标识: '',
    生产叙事已完成: false,
    产后看望: false,
  });
  assert.deepEqual(列出借种产后家庭合照待拍凭据(data), [{ 场次标识, 胎次: 第一胎 }]);
  assert.equal(借种产后家庭合照可拍(data, '101', true, true), true);
  const 拍照 = 拍摄借种产后家庭合照(data, '101', true, true);
  assert.equal(拍照.成功, true);
  assert.match(拍照.事件, /第1胎生产后的实地合照/u);
  assert.equal(借种产后家庭合照待拍(data, 场次标识, 第一胎), false);
  assert.equal(借种产后家庭合照已拍(data, 场次标识, 第一胎), true);
});

test('生产后仍保留每周一次的三人家庭日常，不能因孕情恢复未孕而永久消失', () => {
  const { data } = 完成借种并确认阳性();
  assert.equal(拍摄借种三人合照(data, '101', true, true).成功, true);
  data.户['101'].妻._生产.状态 = '陪产中';
  assert.equal(结算实际生产(data, '101', '陪产', data.系统._绝对时段 + 2).成功, true);
  data.户['101'].妻._生产.状态 = '已出院';
  assert.equal(data.户['101'].妻._怀孕.状态, '未孕');

  const 当前 = data.系统._绝对时段;
  let 周日晚 = Math.floor(当前 / 42) * 42 + 40;
  if (周日晚 < 当前) 周日晚 += 42;
  data.系统._绝对时段 = 周日晚;
  assert.equal(借种三人日常可用(data, '101', true, true), true);
  const 日常 = 借种三人日常(data, '101', true, true);
  assert.equal(日常.成功, true);
  assert.equal(日常.变动, true);
  assert.match(日常.事件, /每周日晚上一次/u);
  const 周数 = Math.floor(周日晚 / 42) + 1;
  assert.equal(借种三人日常本周已用(data, 周数), true);
  assert.equal(借种三人日常可用(data, '101', true, true), false, '同一周只能消费一次');
  data.系统._绝对时段 += 42;
  assert.equal(借种三人日常可用(data, '101', true, true), true, '下一周固定窗口重新开放');
});

test('唯一 A 实现接通后端事件、房间瓷砖与照片消费者，手机不得在实拍前凭空发图', () => {
  for (const 事件名 of [
    '启动借种',
    '停止借种',
    '查看借种阳性结果',
    '拍摄借种三人合照',
    '拍摄借种产后家庭合照',
    '借种三人日常',
  ]) {
    assert.match(index源码, new RegExp(`eventOn\\('人妻公寓:${事件名}'`, 'u'), `${事件名}缺少后端消费者`);
  }
  assert.match(房间动作源码, /借种三人合照可拍[\s\S]*拍摄借种三人合照/u);
  assert.match(房间动作源码, /借种产后家庭合照可拍[\s\S]*拍摄借种产后家庭合照/u);
  assert.match(玩家资源源码, /结算借种亲密收尾[\s\S]*if \(!借种结算\.接管\)[\s\S]*判定受孕\(/u);
  assert.match(孕情通知源码, /借种三人合照已拍[\s\S]*借种三人合照私聊键/u);
  assert.match(群聊节拍源码, /借种三人合照已拍[\s\S]*借种_三人镜面合照/u);
  assert.match(孕情通知源码, /借种产后家庭合照已拍[\s\S]*借种_产后家庭合照/u);
  assert.match(群聊节拍源码, /借种产后家庭合照已拍[\s\S]*生产姐妹群已触发[\s\S]*借种_产后家庭合照/u);
  assert.match(客户端源码, /v-if="监控列表\.length \|\| 借种监控待确认"/u);
  assert.match(客户端源码, /:borrow-seed-offline="借种监控待确认"/u);
  assert.match(客户端源码, /eventOn\('人妻公寓:借种CG'/u);
  assert.match(客户端源码, /借种结局图片\(当前借种CG\.value\.文件\)/u);
  assert.match(客户端素材源码, /shujun8520-design\/qgy-assets@cg4\/cg1\/borrow-seed-ending/u);
  assert.match(手机资源源码, /@ending\/夏乔借种\/[\s\S]*借种结局素材基址/u);
  assert.match(监控组件源码, /CAM-101/u);
  assert.match(监控组件源码, /NO SIGNAL/u);
  assert.match(监控组件源码, /@click="emit\('confirmBorrowSeedOffline'\)"/u);
});

test('旧 B 实现与重复专项测试已物理退役，不能重新成为生产者', () => {
  assert.equal(existsSync(B事实路径), false);
  assert.equal(existsSync(B系统路径), false);
  assert.equal(existsSync(B测试路径), false);
});
