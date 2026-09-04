/* eslint-disable import-x/no-nodejs-modules -- Node-only regression harness */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;

const schemaModule = require('../../src/人妻公寓/schema.ts');
const { Schema, 创建户节点 } = schemaModule;
const schemaAliasPath = require.resolve('../../src/人妻公寓/schema');
require.cache[schemaAliasPath] = {
  id: schemaAliasPath,
  filename: schemaAliasPath,
  loaded: true,
  exports: schemaModule,
};

const 离婚 = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
const 离婚事件边界 = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚事件边界.ts');
const 舞台 = require('../../src/人妻公寓/stageConfig.ts');
// 商店购买路径不使用数据库；隔离 webpack `?raw` 模板依赖。
const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};
const 商店 = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const 资源 = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const 手机通知 = require('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts');
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function 完成分居(data, choice = '继续关系') {
  const r = data.系统._许曼君分居;
  r.方案版本 = 2;
  r.阶段 = '已完成';
  r.工资卡状态 = '已归还赵国强';
  r.钥匙位置 = '管理员室201钥匙格';
  r.钥匙用途 = '待离婚交接';
  r.丈夫已知玩家关系 = true;
  r.丈夫已选择外住 = true;
  r.生活用品已取完 = true;
  r.许曼君已拒绝恢复共同生活 = true;
  r.双方同意进入办理 = true;
  r.玩家最终关系选择 = choice;
  data.户['201'].夫._居住模式 = '待离婚交接';
}

function 数据(choice = '继续关系', time = 3) {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: time } });
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].妻.好感值 = 80;
  data.户['201'].妻.堕落值 = 90;
  data.玩家资源.体力.当前值 = 10;
  data.现金 = 5000;
  完成分居(data, choice);
  return data;
}

function 购买(data) {
  const result = 离婚.购买许曼君离婚(data, 1500);
  assert.equal(result.成功, true);
  return result;
}

function 提交预约(data, floor = 20) {
  const start = 离婚.执行许曼君离婚地点动作(data, '使用红色封存盒', '201', floor);
  assert.equal(start.成功, true);
  assert.match(start.事件, /【许曼君离婚提交:S:/);
  assert.equal(data.系统._许曼君离婚.阶段, '已购买', '生成前不能提前消费票');
  const result = 离婚.提交许曼君离婚剧情事件(data, start.事件, '201', floor);
  assert.equal(result.成功, true);
  return result;
}

function 完成法律离婚(data, choice = '当着赵国强牵住她') {
  const appointment = data.系统._许曼君离婚.办理预约时段;
  data.系统._绝对时段 = appointment;
  const first = 离婚.执行许曼君离婚地点动作(data, '陪她去办最后手续', '大堂', 30);
  assert.equal(first.成功, true);
  assert.match(first.事件, /【许曼君离婚提交:L1:/);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, first.事件, '大堂', 30).成功, true);
  assert.equal(data.系统._许曼君离婚.法律离婚已成立, false);
  const second = 离婚.执行许曼君离婚地点动作(data, choice, '大堂', 31);
  assert.equal(second.成功, true);
  const result = 离婚.提交许曼君离婚剧情事件(data, second.事件, '大堂', 31);
  assert.equal(result.成功, true);
  return result;
}

function 完成换锁(data) {
  assert.equal(离婚.执行许曼君离婚地点动作(data, '归档201前住户旧钥匙', '管理员室').成功, true);
  assert.equal(data.系统._许曼君离婚.阶段, '待归档确认');
  const confirm = 离婚.执行许曼君离婚地点动作(data, '确认201继续由她居住', '管理员室', 32);
  assert.match(confirm.事件, /【许曼君离婚提交:K1:/);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, confirm.事件, '管理员室', 32).成功, true);
  assert.equal(离婚.执行许曼君离婚地点动作(data, '领取201新锁芯和钥匙', '管理员室').成功, true);
  data.系统._绝对时段 = 9;
  const result = 离婚.执行许曼君离婚地点动作(data, '更换201锁芯', '201');
  assert.equal(result.成功, true);
  return result;
}

function 送达邀请(data) {
  data.系统._绝对时段 = data.系统._许曼君离婚.邀请最早时段;
  assert.equal(离婚.同步许曼君离婚时间节点(data).成功, true);
  assert.equal(data.系统._许曼君离婚.邀请状态, '待发送');
  assert.equal(离婚.提交许曼君离婚邀请已送达(data).成功, true);
  assert.equal(data.系统._许曼君离婚.阶段, '待最后一笔');
}

function 进入H2(data) {
  data.系统._绝对时段 = 15;
  const start = 离婚.执行许曼君离婚地点动作(data, '开始最后一笔', '201', 50);
  assert.equal(start.成功, true);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, start.事件, '201', 50).成功, true);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H2');
  return start;
}

function 空亲密场景(data, id = 'divorce-session') {
  data.系统._性爱场景 = {
    状态: '进行中',
    场次标识: id,
    开始楼层: 52,
    有效楼数: 0,
    本场等级加成: 0,
    当前接触部位: '身体',
    当前行为: '无插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '201',
    参与者: {
      201: { 满意度: 0, 满意目标: 5, 偏好命中: [], 等级加成已用: false, 有效楼数: 0, 已退出: false },
    },
  };
}

function 提交H8并清账(data, mode, floor = 60) {
  const result = 离婚.提交许曼君离婚H8硬结果(data, mode, floor);
  if (result.成功) data.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
  return result;
}

function 进入H3(data, target = '红本') {
  const h2 = 离婚.执行许曼君离婚地点动作(data, '打开红色封存盒', '201', 51);
  assert.equal(h2.成功, true);
  assert.match(h2.事件, /【许曼君离婚提交:H2:/);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h2.事件, '201', 51).成功, true);
  const action = target === '红本' ? '选择红本' : target === '婚戒' ? '选择婚戒' : '选择戒印';
  const selected = 离婚.执行许曼君离婚地点动作(data, action, '201');
  assert.equal(selected.成功, true);
  assert.equal(selected.需普通亲密回合, true);
  assert.equal(data.系统._许曼君离婚.终幕目标, '', '生成前不能提前冻结目标');
  空亲密场景(data);
  assert.equal(离婚.绑定许曼君离婚亲密场次(data, target, 52), true);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H3');
}

function 推进H3H6(data) {
  const rounds = [
    [53, 1, '无插入', 'H4', '许曼君解开旧婚纱并把婚纱放到椅背，两个人只进入轻接触。'],
    [54, 1, '无插入', 'H5', '两个人继续抚摸和亲吻，只演前戏。'],
    [55, 2, '口交', 'H6', '许曼君俯身含住他，进入深度口交前戏。'],
    [56, 3, '阴道插入', 'H7', '他进入许曼君的阴道交合，逼近高潮但没有射精。'],
  ];
  for (const [floor, scale, behavior, next, text] of rounds) {
    data.系统._性爱场景.当前行为 = behavior;
    data.系统._性爱场景.有效楼数 += 1;
    data.系统._性爱场景.参与者['201'].有效楼数 += 1;
    const result = 离婚.提交许曼君离婚亲密有效回合(data, {
      地点: '201',
      楼层: floor,
      妻在场: ['201'],
      实际尺度: scale,
      当前行为: behavior,
      正文: text,
    });
    assert.equal(result.成功, true);
    assert.equal(data.系统._许曼君离婚.H阶段, next);
  }
}

function 进入H8(data, floor = 57) {
  const start = 离婚.执行许曼君离婚地点动作(data, '摆好锁定目标', '201', floor);
  assert.equal(start.成功, true);
  assert.match(start.事件, /【许曼君离婚提交:H7:/);
  const result = 离婚.提交许曼君离婚剧情事件(data, start.事件, '201', floor);
  assert.equal(result.成功, true);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H8');
  assert.equal(data.系统._许曼君离婚.H8状态, '待选择');
  return result;
}

function 完成H8结果演出(data, floor = 61) {
  const start = 离婚.执行许曼君离婚地点动作(data, '完成H8结果演出', '201', floor);
  assert.equal(start.成功, true);
  assert.match(start.事件, /【许曼君离婚提交:H8:/);
  const result = 离婚.提交许曼君离婚剧情事件(data, start.事件, '201', floor);
  assert.equal(result.成功, true);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H9');
  return result;
}

function 准备成人终幕(target = '红本') {
  const data = 数据('继续关系');
  购买(data);
  提交预约(data);
  完成法律离婚(data);
  完成换锁(data);
  送达邀请(data);
  进入H2(data);
  进入H3(data, target);
  推进H3H6(data);
  进入H8(data);
  return data;
}

function 准备资源待H3(target = '红本') {
  const data = 数据('继续关系');
  购买(data);
  提交预约(data);
  完成法律离婚(data);
  完成换锁(data);
  送达邀请(data);
  进入H2(data);
  const h2 = 离婚.执行许曼君离婚地点动作(data, '打开红色封存盒', '201', 51);
  assert.equal(h2.成功, true);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h2.事件, '201', 51).成功, true);
  const action = target === '红本' ? '选择红本' : target === '婚戒' ? '选择婚戒' : '选择戒印';
  const selected = 离婚.执行许曼君离婚地点动作(data, action, '201');
  assert.equal(selected.成功, true);
  return { data, target, action: 离婚.许曼君离婚H3行动(target) };
}

function 结算资源楼(data, { floor, action, text, scale, cost = true }) {
  const old = lodash.cloneDeep(data);
  return 资源.结算成功现场楼(data, old, {
    场景: '201',
    楼层: floor,
    行动: action,
    正文: text,
    本楼事件: '',
    妻在场: ['201'],
    实际尺度: { 201: scale },
    尺度判定: { 201: { 请求: scale, 实际: scale, 许可上限: 5, 越界原因: '' } },
    资源计费: cost,
  });
}

test('Schema、schema.json与initvar为《离婚》提供同一组最小v9默认字段', () => {
  const expected = {
    版本: 1,
    阶段: '未开始',
    当前场景: '',
    当前拍: 0,
    道具已购买: false,
    道具已使用: false,
    办理预约时段: -1,
    法律离婚已成立: false,
    玩家公开站位选择: '',
    旧钥匙状态: '待离婚交接',
    赵国强正式退居: false,
    新锁芯位置: '未取得',
    新钥匙位置: '未取得',
    换锁完成: false,
    换锁完成时段: -1,
    邀请状态: '未建立',
    邀请最早时段: -1,
    重试最早时段: -1,
    H阶段: '未开始',
    终幕目标: '',
    绑定亲密场次标识: '',
    H有效回合: [],
    H8状态: '未到达',
    戒印长按失败次数: 0,
    封存盒位置: '未购买',
    封存物件: '',
    CG回忆: [],
    完成分支: '',
    完成楼层: -1,
  };
  assert.deepEqual(Schema.parse({}).系统._许曼君离婚, expected);
  const schemaJson = JSON.parse(read('src/人妻公寓/schema.json'));
  assert.deepEqual(Object.keys(schemaJson.properties.系统.properties._许曼君离婚.properties), Object.keys(expected));
  assert.ok(schemaJson.properties.系统.properties._许曼君离婚.properties.新钥匙位置.enum.includes('许曼君保管'));
  const initvar = read('src/人妻公寓/世界书/变量/initvar.yaml');
  const block = initvar.slice(initvar.indexOf('  _许曼君离婚:'), initvar.indexOf('  _回国:'));
  for (const key of Object.keys(expected)) assert.match(block, new RegExp(`${key}:`));
});

test('201结局与301操作性剧情升级为真实商品，只保留301正式结局占位', () => {
  assert.equal(舞台.查角色剧情占位(离婚.许曼君离婚场景ID), undefined);
  assert.equal(舞台.道具表[离婚.许曼君离婚商品ID].名称, '许曼君 · 离婚');
  assert.equal(舞台.道具表[离婚.许曼君离婚商品ID].价格, 1500);
  assert.equal(舞台.道具表[离婚.许曼君离婚商品ID].类别, '特殊场景');
  assert.equal(舞台.查角色剧情占位('角色路线:301:操作性剧情'), undefined);
  assert.equal(舞台.道具表['角色路线:301:操作性剧情'].名称, '安若妍 · 不必停');
  assert.equal(舞台.道具表['角色路线:301:操作性剧情'].价格, 680);
  assert.equal(舞台.查角色剧情占位('角色路线:301:结局剧情').门牌, '301');
  assert.equal(Object.keys(舞台.角色剧情占位表).length, 1);
});

test('《分居》完整事实与待离婚交接钥匙是商店上架硬门', () => {
  const data = 数据();
  assert.equal(离婚.许曼君离婚商店已上架(data), true);
  for (const mutate of [
    d => { d.系统._许曼君分居.阶段 = '待管理员室交接'; },
    d => { d.系统._许曼君分居.工资卡状态 = '仍由许曼君保管'; },
    d => { d.系统._许曼君分居.丈夫已知玩家关系 = false; },
    d => { d.系统._许曼君分居.生活用品已取完 = false; },
    d => { d.系统._许曼君分居.钥匙位置 = '赵国强持有'; },
    d => { d.系统._许曼君分居.钥匙用途 = '临时外住'; },
  ]) {
    const copy = 数据();
    mutate(copy);
    assert.equal(离婚.许曼君离婚商店已上架(copy), false);
  }
});

test('真实商店货架按硬门显示《离婚》，购买后隐藏且不可从事件总线绕过重复购买', () => {
  const data = 数据();
  const before = data.现金;
  const shelf = 商店.取货架(data).flatMap(tab => tab.商品);
  assert.equal(shelf.filter(item => item.id === 离婚.许曼君离婚商品ID).length, 1);
  const result = 商店.购买(data, 离婚.许曼君离婚商品ID);
  assert.equal(result.成功, true);
  assert.equal(data.现金, before - 1500);
  assert.equal(data.背包.filter(id => id === 离婚.许曼君离婚商品ID).length, 1);
  assert.equal(商店.取货架(data).flatMap(tab => tab.商品).some(item => item.id === 离婚.许曼君离婚商品ID), false);
  assert.equal(商店.购买(data, 离婚.许曼君离婚商品ID).成功, false);
  assert.equal(data.现金, before - 1500);
});

test('购买只扣1500并只入包一件，不启动剧情、不离婚、不改钥匙和丈夫住户身份', () => {
  const data = 数据();
  const before = data.现金;
  const result = 购买(data);
  assert.equal(data.现金, before - 1500);
  assert.equal(data.背包.filter(id => id === 离婚.许曼君离婚商品ID).length, 1);
  assert.equal(data.系统._许曼君离婚.阶段, '已购买');
  assert.equal(data.系统._许曼君离婚.法律离婚已成立, false);
  assert.equal(data.系统._许曼君分居.钥匙用途, '待离婚交接');
  assert.equal(data.户['201'].夫._居住模式, '待离婚交接');
  assert.equal(离婚.购买许曼君离婚(data, 1500).成功, false);
  assert.equal(data.现金, before - 1500);
  assert.equal(result.变动, true);
});

test('红盒只能在201傍晚/晚上主动使用；生成失败前不吞票', () => {
  const data = 数据();
  购买(data);
  assert.equal(离婚.执行许曼君离婚地点动作(data, '使用红色封存盒', '管理员室').成功, false);
  data.系统._绝对时段 = 0;
  assert.equal(离婚.执行许曼君离婚地点动作(data, '使用红色封存盒', '201').成功, false);
  data.系统._绝对时段 = 3;
  const result = 离婚.执行许曼君离婚地点动作(data, '使用红色封存盒', '201');
  assert.equal(result.成功, true);
  assert.equal(data.背包.includes(离婚.许曼君离婚商品ID), true);
  assert.equal(data.系统._许曼君离婚.阶段, '已购买');
});

test('首回合只预约第二天下午，不生成离婚证或法律事实', () => {
  const data = 数据();
  购买(data);
  const start = 离婚.执行许曼君离婚地点动作(data, '使用红色封存盒', '201');
  assert.match(start.事件, /不得生成、展示或暗示已经拿到离婚证/);
  assert.match(离婚.许曼君离婚正文越拍原因(start.事件, '她已经拿到了离婚证，两个人正式离婚。'), /提前/);
  assert.equal(离婚.许曼君离婚正文越拍原因(start.事件, '她确认第二天下午一起去办理。'), '');
  提交预约(data);
  assert.equal(data.系统._许曼君离婚.办理预约时段, 8);
  assert.equal(data.系统._许曼君离婚.法律离婚已成立, false);
  assert.equal(data.背包.includes(离婚.许曼君离婚商品ID), false);
});

test('办理必须经过两个有效回合，第二回合才不可逆成立法律离婚', () => {
  const data = 数据();
  购买(data);
  提交预约(data);
  const appointment = data.系统._许曼君离婚.办理预约时段;
  data.系统._绝对时段 = appointment;
  const first = 离婚.执行许曼君离婚地点动作(data, '陪她去办最后手续', '大堂');
  assert.equal(离婚.提交许曼君离婚剧情事件(data, first.事件, '大堂', 30).成功, true);
  assert.equal(data.系统._许曼君离婚.阶段, '待公开站位');
  assert.equal(data.系统._许曼君离婚.法律离婚已成立, false);
  const second = 离婚.执行许曼君离婚地点动作(data, '当着赵国强牵住她', '大堂');
  assert.match(离婚.许曼君离婚正文越拍原因(second.事件, '许曼君拿着自己的离婚证出来。'), /牵手/);
  assert.equal(离婚.许曼君离婚正文越拍原因(second.事件, '许曼君拿着自己的离婚证出来，你当着赵国强牵住了她的手。'), '');
  assert.equal(离婚.提交许曼君离婚剧情事件(data, second.事件, '大堂', 31).成功, true);
  assert.equal(data.系统._许曼君离婚.法律离婚已成立, true);
  assert.equal(data.系统._许曼君离婚.阶段, '待归档旧钥匙');
});

test('公开牵手与离开后拥抱只改变见证事实，不覆盖《分居》长期选择', () => {
  for (const choice of ['当着赵国强牵住她', '等赵国强离开再抱她']) {
    const data = 数据('暂不承诺');
    购买(data);
    提交预约(data);
    完成法律离婚(data, choice);
    assert.equal(data.系统._许曼君离婚.玩家公开站位选择, choice);
    assert.equal(data.系统._许曼君分居.玩家最终关系选择, '暂不承诺');
  }
});

test('管理员室只归档同一枚旧钥匙并把赵国强永久切到正式退居', () => {
  const data = 数据();
  购买(data);
  提交预约(data);
  完成法律离婚(data);
  const result = 离婚.执行许曼君离婚地点动作(data, '归档201前住户旧钥匙', '管理员室');
  assert.equal(result.成功, true);
  assert.equal(data.系统._许曼君离婚.旧钥匙状态, '前住户旧钥匙归档');
  assert.equal(data.系统._许曼君分居.钥匙位置, '管理员室201钥匙格');
  assert.equal(data.系统._许曼君分居.钥匙用途, '正式退居');
  assert.equal(data.户['201'].夫._居住模式, '正式退居');
  assert.equal(离婚.执行许曼君离婚地点动作(data, '归档201前住户旧钥匙', '管理员室').成功, false);
});

test('新锁芯和配套钥匙物件守恒，换锁后唯一新钥匙交给许曼君', () => {
  const data = 数据();
  购买(data);
  提交预约(data);
  完成法律离婚(data);
  离婚.执行许曼君离婚地点动作(data, '归档201前住户旧钥匙', '管理员室');
  const confirm = 离婚.执行许曼君离婚地点动作(data, '确认201继续由她居住', '管理员室', 32);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, confirm.事件, '管理员室', 32).成功, true);
  assert.equal(离婚.执行许曼君离婚地点动作(data, '领取201新锁芯和钥匙', '管理员室').成功, true);
  assert.equal(data.背包.filter(id => id === 离婚.许曼君离婚新锁芯ID).length, 1);
  assert.equal(data.背包.filter(id => id === 离婚.许曼君离婚新钥匙ID).length, 1);
  data.系统._绝对时段 = 9;
  assert.equal(离婚.执行许曼君离婚地点动作(data, '更换201锁芯', '201').成功, true);
  assert.equal(data.背包.includes(离婚.许曼君离婚新锁芯ID), false);
  assert.equal(data.背包.includes(离婚.许曼君离婚新钥匙ID), false);
  assert.equal(data.系统._许曼君离婚.新锁芯位置, '201已安装');
  assert.equal(data.系统._许曼君离婚.新钥匙位置, '许曼君保管');
  assert.equal(data.系统._许曼君离婚.换锁完成, true);
});

test('本地旧实现已经换锁但把新钥匙留在玩家背包时，会幂等修正为许曼君唯一保管', () => {
  const data = 数据();
  data.系统._许曼君离婚.阶段 = '等待邀请';
  data.系统._许曼君离婚.换锁完成 = true;
  data.系统._许曼君离婚.换锁完成时段 = 9;
  data.系统._许曼君离婚.邀请最早时段 = 10;
  data.系统._许曼君离婚.邀请状态 = '等待时段';
  data.系统._许曼君离婚.新锁芯位置 = '201已安装';
  data.系统._许曼君离婚.新钥匙位置 = '玩家背包';
  data.背包.push(离婚.许曼君离婚新钥匙ID, 离婚.许曼君离婚新钥匙ID);
  data.系统._绝对时段 = 9;

  assert.equal(离婚.同步许曼君离婚时间节点(data).变动, true);
  assert.equal(data.系统._许曼君离婚.新钥匙位置, '许曼君保管');
  assert.equal(data.背包.includes(离婚.许曼君离婚新钥匙ID), false);
  assert.equal(离婚.同步许曼君离婚时间节点(data).变动, false);
});

test('换锁后至少经过一个完整世界时段才建立一次持久邀请资格', () => {
  const data = 数据();
  购买(data); 提交预约(data); 完成法律离婚(data); 完成换锁(data);
  const earliest = data.系统._许曼君离婚.邀请最早时段;
  assert.equal(data.系统._许曼君离婚.邀请状态, '等待时段');
  assert.equal(离婚.同步许曼君离婚时间节点(data).变动, false);
  data.系统._绝对时段 = earliest;
  assert.equal(离婚.同步许曼君离婚时间节点(data).变动, true);
  assert.equal(data.系统._许曼君离婚.邀请状态, '待发送');
  assert.match(离婚.许曼君离婚邀请文案(), /锁已经换好了/);
  assert.equal(离婚.提交许曼君离婚邀请已送达(data).成功, true);
  assert.equal(离婚.提交许曼君离婚邀请已送达(data).变动, false);
});

test('待发送邀请只编译成一条201对方私聊，真实送达后不再重复编译', () => {
  const data = 数据();
  购买(data); 提交预约(data); 完成法律离婚(data); 完成换锁(data);
  data.系统._绝对时段 = data.系统._许曼君离婚.邀请最早时段;
  离婚.同步许曼君离婚时间节点(data);
  const messages = 手机通知.编译许曼君离婚手机通知(data, 123, data.系统._绝对时段);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].会话, '201');
  assert.equal(messages[0].发, '对方');
  assert.equal(messages[0].键, 离婚.许曼君离婚邀请消息键);
  assert.match(messages[0].文, /旧的东西还差最后一笔/);
  assert.equal(data.系统._许曼君离婚.邀请状态, '待发送', '编译气泡不能反向签发已送达');
  assert.equal(离婚.提交许曼君离婚邀请已送达(data).成功, true);
  assert.deepEqual(手机通知.编译许曼君离婚手机通知(data, 124, data.系统._绝对时段), []);
});

test('退出关系在换锁后只开放非成人收束，不恢复关系、留宿或亲密入口', () => {
  const data = 数据('退出关系');
  data.系统._许曼君分居.留宿201权限 = true; // 兼容短暂本地脏档：完成时必须按退出选择撤销。
  购买(data); 提交预约(data); 完成法律离婚(data); 完成换锁(data);
  assert.equal(data.系统._许曼君离婚.阶段, '待非成人收束');
  assert.equal(data.系统._许曼君离婚.邀请状态, '未建立');
  const close = 离婚.执行许曼君离婚地点动作(data, '完成非成人收束', '201', 45);
  assert.equal(close.成功, true);
  assert.match(close.事件, /不得出现婚纱/);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, close.事件, '201', 45).成功, true);
  assert.equal(data.系统._许曼君离婚.完成分支, '非成人');
  assert.equal(data.系统._许曼君分居.玩家最终关系选择, '退出关系');
  assert.equal(data.系统._许曼君分居.留宿201权限, false);
  assert.deepEqual(离婚.许曼君离婚地点动作(data, '201'), []);
});

test('暂不承诺可以进入成人终幕，但完成不会自动升级长期承诺', () => {
  const data = 数据('暂不承诺');
  购买(data); 提交预约(data); 完成法律离婚(data); 完成换锁(data); 送达邀请(data);
  assert.equal(离婚.执行许曼君离婚地点动作(data, '开始最后一笔', '201').成功, true);
  assert.equal(data.系统._许曼君分居.玩家最终关系选择, '暂不承诺');
});

test('H1只演婚纱开门，H2才打开红盒并显示三个脚本目标', () => {
  const data = 数据();
  购买(data); 提交预约(data); 完成法律离婚(data); 完成换锁(data); 送达邀请(data);
  const h1 = 进入H2(data);
  assert.equal(离婚.许曼君离婚检查点CG(data, '201'), 'XMJ-DIV-06');
  assert.match(h1.事件, /当前只完成H1婚纱开门/);
  assert.match(离婚.许曼君离婚正文越拍原因(h1.事件, '许曼君穿着旧婚纱开门后立刻与玩家性交。'), /H1提前/u);
  assert.equal(data.系统._许曼君离婚.CG回忆.includes('XMJ-DIV-06'), true);
  const h2 = 离婚.执行许曼君离婚地点动作(data, '打开红色封存盒', '201', 51);
  assert.match(h2.事件, /【许曼君离婚提交:H2:/);
  assert.match(离婚.许曼君离婚正文越拍原因(h2.事件, '许曼君打开红色封存盒，随后脱下婚纱开始口交。'), /H2提前/u);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H2');
  const h2Done = 离婚.提交许曼君离婚剧情事件(data, h2.事件, '201', 51);
  assert.equal(h2Done.CG, 'XMJ-DIV-07');
  assert.equal(离婚.许曼君离婚检查点CG(data, '201'), 'XMJ-DIV-07');
  const targetAction = 离婚.许曼君离婚地点动作(data, '201')[0];
  assert.deepEqual(targetAction.选项.map(item => item.id), ['选择红本', '选择婚戒', '选择戒印']);
});

test('H3选择只在真实普通201场次创建后冻结目标和绑定场次', () => {
  const data = 数据();
  购买(data); 提交预约(data); 完成法律离婚(data); 完成换锁(data); 送达邀请(data); 进入H2(data);
  const h2 = 离婚.执行许曼君离婚地点动作(data, '打开红色封存盒', '201', 51);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h2.事件, '201', 51).成功, true);
  const selected = 离婚.执行许曼君离婚地点动作(data, '选择婚戒', '201');
  assert.equal(selected.目标, '婚戒');
  assert.equal(data.系统._许曼君离婚.终幕目标, '');
  空亲密场景(data, 'only-session');
  assert.equal(离婚.绑定许曼君离婚亲密场次(data, '婚戒', 52), true);
  assert.equal(data.系统._许曼君离婚.终幕目标, '婚戒');
  assert.equal(data.系统._许曼君离婚.绑定亲密场次标识, 'only-session');
  data.系统._性爱场景.参与者['202'] = { ...data.系统._性爱场景.参与者['201'] };
  assert.equal(离婚.许曼君离婚绑定亲密有效(data), false, '错误演员必须使绑定失效');
});

test('H3～H6必须恰好四个有效正文回合，H6必须真实阴道交合', () => {
  const data = 数据();
  购买(data); 提交预约(data); 完成法律离婚(data); 完成换锁(data); 送达邀请(data); 进入H2(data); 进入H3(data, '红本');
  assert.equal(离婚.提交许曼君离婚亲密有效回合(data, { 地点: '201', 楼层: 53, 妻在场: ['201'], 实际尺度: 0, 当前行为: '无插入', 正文: '两个人仍隔着婚纱说话。' }).成功, false);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H3');
  const floors = [53, 54, 55];
  const scales = [1, 1, 2];
  const texts = [
    '许曼君解开旧婚纱并把婚纱放到椅背，两个人只进入轻接触。',
    '两个人继续抚摸和亲吻，只演前戏。',
    '许曼君俯身含住他，进入深度口交前戏。',
  ];
  for (let i = 0; i < floors.length; i += 1) {
    assert.equal(离婚.提交许曼君离婚亲密有效回合(data, { 地点: '201', 楼层: floors[i], 妻在场: ['201'], 实际尺度: scales[i], 当前行为: i === 2 ? '口交' : '无插入', 正文: texts[i] }).成功, true);
  }
  assert.equal(离婚.提交许曼君离婚亲密有效回合(data, { 地点: '201', 楼层: 56, 妻在场: ['201'], 实际尺度: 3, 当前行为: '肛门插入', 正文: '他进入她的后穴抽插，没有射精。' }).成功, false);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H6');
  assert.equal(离婚.提交许曼君离婚亲密有效回合(data, { 地点: '201', 楼层: 56, 妻在场: ['201'], 实际尺度: 3, 当前行为: '阴道插入', 正文: '他进入许曼君的阴道交合，逼近高潮但没有射精。' }).成功, true);
  assert.deepEqual(data.系统._许曼君离婚.H有效回合, [53, 54, 55, 56]);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H7');
});

test('H3～H6逐拍守住脱婚纱、尺度阶梯与H8唯一射精边界', () => {
  const data = 数据();
  购买(data); 提交预约(data); 完成法律离婚(data); 完成换锁(data); 送达邀请(data); 进入H2(data); 进入H3(data, '红本');
  const missingDress = 离婚.提交许曼君离婚亲密有效回合(data, {
    地点: '201', 楼层: 140, 妻在场: ['201'], 实际尺度: 1, 当前行为: '无插入', 正文: '两个人隔着婚纱拥抱，停在轻接触。',
  });
  assert.equal(missingDress.成功, false);
  assert.match(missingDress.提示, /解开旧婚纱.*椅背/u);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H3');

  assert.equal(离婚.提交许曼君离婚亲密有效回合(data, {
    地点: '201', 楼层: 140, 妻在场: ['201'], 实际尺度: 1, 当前行为: '无插入', 正文: '许曼君解开旧婚纱并把婚纱放到椅背，两个人只进入轻接触。',
  }).成功, true);
  assert.equal(离婚.提交许曼君离婚亲密有效回合(data, {
    地点: '201', 楼层: 141, 妻在场: ['201'], 实际尺度: 2, 当前行为: '口交', 正文: '她已经进入深度口交。',
  }).成功, false, 'H4不能提前吞掉H5');
  assert.equal(data.系统._许曼君离婚.H阶段, 'H4');
  assert.equal(离婚.提交许曼君离婚亲密有效回合(data, {
    地点: '201', 楼层: 141, 妻在场: ['201'], 实际尺度: 1, 当前行为: '无插入', 正文: '两个人继续抚摸和亲吻，只演前戏。',
  }).成功, true);
  assert.equal(离婚.提交许曼君离婚亲密有效回合(data, {
    地点: '201', 楼层: 142, 妻在场: ['201'], 实际尺度: 3, 当前行为: '阴道插入', 正文: '他已经进入她的阴道。',
  }).成功, false, 'H5不能提前吞掉H6');
  assert.equal(data.系统._许曼君离婚.H阶段, 'H5');
  assert.equal(离婚.提交许曼君离婚亲密有效回合(data, {
    地点: '201', 楼层: 142, 妻在场: ['201'], 实际尺度: 2, 当前行为: '口交', 正文: '许曼君俯身含住他，进入深度口交前戏。',
  }).成功, true);
  const earlyResult = 离婚.提交许曼君离婚亲密有效回合(data, {
    地点: '201', 楼层: 143, 妻在场: ['201'], 实际尺度: 3, 当前行为: '阴道插入', 正文: '他进入许曼君的阴道后射精在她体内。',
  });
  assert.equal(earlyResult.成功, false);
  assert.match(earlyResult.提示, /H8.*原子结算/u);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H6');
});

test('资源系统真实创建并绑定H3普通201场次，四回合耗尽体力后仍停在H7而非随机收尾', () => {
  const { data, action } = 准备资源待H3('红本');
  data.玩家资源.体力.当前值 = 4;
  data.玩家资源.精力.当前值 = 0;
  const gate = 资源.行动资源门槛(data, action);
  assert.equal(gate.种类, '体力');
  assert.equal(gate.可行动, true, 'H3必须读体力，不能被零精力误挡');
  const h3 = 结算资源楼(data, {
    floor: 70,
    action,
    text: '许曼君解开旧婚纱放到椅背，手掌贴上她的胸口，两个人只进入轻接触。',
    scale: 1,
  });
  assert.equal(h3.性爱开始, true);
  assert.equal(data.系统._性爱场景.状态, '进行中');
  assert.equal(Object.keys(data.系统._性爱场景.参与者).join(','), '201');
  assert.equal(data.系统._许曼君离婚.H阶段, 'H4');
  assert.deepEqual(data.系统._许曼君离婚.H有效回合, [70]);
  assert.equal(data.玩家资源.体力.当前值, 3);

  const rounds = [
    { floor: 71, action: '继续抚摸她的胸部', text: '他继续抚摸许曼君的胸部，她贴近回应。', scale: 1, next: 'H5' },
    { floor: 72, action: '让她含住', text: '许曼君俯身含住他的阴茎，进行更深的口交前戏。', scale: 2, next: 'H6' },
    { floor: 73, action: '进入她的阴道抽插', text: '他进入许曼君的阴道开始抽插，逼近高潮却还没有射精。', scale: 3, next: 'H7' },
  ];
  for (const round of rounds) {
    const result = 结算资源楼(data, round);
    assert.equal(result.性爱结束, false);
    assert.equal(data.系统._许曼君离婚.H阶段, round.next);
  }
  assert.deepEqual(data.系统._许曼君离婚.H有效回合, [70, 71, 72, 73]);
  assert.equal(data.玩家资源.体力.当前值, 0);
  assert.equal(data.系统._性爱场景.状态, '进行中');
  assert.equal(data.系统._性爱场景.待收尾位置, '');
  assert.deepEqual(资源.亲密收尾选项(data), []);
});

test('H6若没有真实阴道交合，资源系统不扣体力、不增加普通账或推进终幕', () => {
  const { data, action } = 准备资源待H3('婚戒');
  data.玩家资源.体力.当前值 = 5;
  结算资源楼(data, { floor: 80, action, text: '她解开旧婚纱并把婚纱放到椅背，再与他轻轻贴近。', scale: 1 });
  结算资源楼(data, { floor: 81, action: '抚摸她', text: '他继续抚摸她的胸部。', scale: 1 });
  结算资源楼(data, { floor: 82, action: '让她含住', text: '她含住他的阴茎进行口交。', scale: 2 });
  const before = {
    stamina: data.玩家资源.体力.当前值,
    sceneFloors: data.系统._性爱场景.有效楼数,
    participantFloors: data.系统._性爱场景.参与者['201'].有效楼数,
    valid: [...data.系统._许曼君离婚.H有效回合],
  };
  assert.throws(
    () =>
      结算资源楼(data, {
        floor: 83,
        action: '改成从后面进入她',
        text: '他从后面进入许曼君的肛门继续抽插。',
        scale: 3,
      }),
    /H6必须真实进入阴道交合/,
  );
  assert.equal(data.系统._许曼君离婚.H阶段, 'H6');
  assert.equal(data.玩家资源.体力.当前值, before.stamina);
  assert.equal(data.系统._性爱场景.有效楼数, before.sceneFloors);
  assert.equal(data.系统._性爱场景.参与者['201'].有效楼数, before.participantFloors);
  assert.deepEqual(data.系统._许曼君离婚.H有效回合, before.valid);
});

test('资源层H8确认原子清空普通账、记录自定义体外目标并显式跳过受孕', () => {
  const { data, action } = 准备资源待H3('红本');
  data.玩家资源.体力.当前值 = 4;
  结算资源楼(data, { floor: 90, action, text: '她解开婚纱放到椅背，两个人轻轻贴近。', scale: 1 });
  结算资源楼(data, { floor: 91, action: '继续前戏', text: '他抚摸许曼君的胸部继续前戏。', scale: 1 });
  结算资源楼(data, { floor: 92, action: '深度前戏', text: '她含住他的阴茎进行深度口交前戏。', scale: 2 });
  结算资源楼(data, { floor: 93, action: '正式交合', text: '他进入许曼君的阴道抽插，来到临近高潮。', scale: 3 });
  进入H8(data, 94);
  const pregnancyBefore = JSON.stringify(data.户['201'].妻._怀孕);
  const result = 资源.结算许曼君离婚H8收尾(data, '确认', 95);
  assert.equal(result.成功, true);
  assert.equal(result.CG, 'XMJ-DIV-11');
  assert.equal(data.系统._性爱场景.状态, '空闲');
  assert.equal(data.系统._上次性爱结果.结束方式, '脚本收尾');
  assert.equal(data.系统._上次性爱结果.最终位置, '离婚终幕:红本');
  assert.equal(data.系统._上次性爱结果.收尾对象门牌, '201');
  assert.equal(JSON.stringify(data.户['201'].妻._怀孕), pregnancyBefore);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H8结果待演');
  完成H8结果演出(data, 96);
});

test('H7按冻结目标映射干净CG，进入H8后专属结构化收尾接管普通入口', () => {
  const data = 准备成人终幕('婚戒');
  const h7 = 离婚.许曼君离婚地点动作(data, '201')[0];
  assert.equal(h7.id, '确认射在这里');
  assert.deepEqual(h7.选项.map(item => item.id), ['确认射在这里', '停下，今晚不封存']);
  assert.equal(data.系统._许曼君离婚.CG回忆.includes('XMJ-DIV-09'), true);
  assert.equal(离婚.许曼君离婚接管普通收尾(data), true);
  const h7Event = `【事件在场妻:201】【许曼君离婚提交:H7:最后一笔中:${data.系统._绝对时段}:1:婚戒】`;
  assert.match(离婚.许曼君离婚正文越拍原因(h7Event, '许曼君把婚戒摆好后，两个人继续性交抽插。'), /H7只能/u);
});

test('H7固定摆放回合不增加普通亲密楼数、满意度或体力，并在绑定场次失效时拒绝提交', () => {
  const { data, action } = 准备资源待H3('婚戒');
  data.玩家资源.体力.当前值 = 4;
  结算资源楼(data, { floor: 180, action, text: '她解开旧婚纱并把婚纱放到椅背，两个人只进入轻接触。', scale: 1 });
  结算资源楼(data, { floor: 181, action: '继续前戏', text: '两个人继续抚摸和亲吻，只演前戏。', scale: 1 });
  结算资源楼(data, { floor: 182, action: '深度前戏', text: '许曼君俯身含住他，进入深度口交前戏。', scale: 2 });
  结算资源楼(data, { floor: 183, action: '正式交合', text: '他进入许曼君的阴道交合，逼近高潮但没有射精。', scale: 3 });
  const old = lodash.cloneDeep(data);
  const before = lodash.cloneDeep(data.系统._性爱场景);
  const stamina = data.玩家资源.体力.当前值;
  const h7 = 离婚.执行许曼君离婚地点动作(data, '摆好锁定目标', '201', 184);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h7.事件, '201', 184).成功, true);
  const result = 资源.结算成功现场楼(data, old, {
    场景: '201',
    楼层: 184,
    行动: '摆好锁定目标',
    正文: '许曼君把婚戒连透明浅皿摆好，停在等待确认的末帧。',
    本楼事件: h7.事件,
    妻在场: ['201'],
    实际尺度: { 201: 0 },
    尺度判定: { 201: { 请求: 0, 实际: 0, 许可上限: 5, 越界原因: '' } },
    资源计费: false,
  });
  assert.equal(result.性爱结束, false);
  assert.equal(result.抑制普通CG, true);
  assert.deepEqual(data.系统._性爱场景, before);
  assert.equal(data.玩家资源.体力.当前值, stamina);

  const stale = 数据();
  购买(stale); 提交预约(stale); 完成法律离婚(stale); 完成换锁(stale); 送达邀请(stale); 进入H2(stale); 进入H3(stale, '红本'); 推进H3H6(stale);
  stale.系统._性爱场景.场次标识 = 'changed-session';
  const staleH7 = 离婚.执行许曼君离婚地点动作(stale, '摆好锁定目标', '201', 185);
  assert.equal(staleH7.成功, false, '入口复核应先隐藏失效绑定');
  const forged = `【事件在场妻:201】【许曼君离婚提交:H7:最后一笔中:${stale.系统._绝对时段}:1:红本】`;
  assert.equal(离婚.提交许曼君离婚剧情事件(stale, forged, '201', 185).成功, false);
  assert.equal(stale.系统._许曼君离婚.H阶段, 'H7');
});

test('H8停止安全结束本次尝试并保留法律、退居、旧钥匙与换锁事实', () => {
  const data = 准备成人终幕('红本');
  const legal = data.系统._许曼君离婚.法律离婚已成立;
  const key = data.系统._许曼君离婚.旧钥匙状态;
  const lock = data.系统._许曼君离婚.换锁完成;
  const result = 提交H8并清账(data, '停止', 60);
  assert.equal(result.成功, true);
  assert.equal(data.系统._许曼君离婚.阶段, '待最后一笔');
  assert.equal(data.系统._许曼君离婚.H8状态, '已停止');
  assert.equal(data.系统._许曼君离婚.终幕目标, '');
  assert.equal(data.系统._许曼君离婚.法律离婚已成立, legal);
  assert.equal(data.系统._许曼君离婚.旧钥匙状态, key);
  assert.equal(data.系统._许曼君离婚.换锁完成, lock);
  assert.equal(data.户['201'].夫._居住模式, '正式退居');
  assert.equal(data.系统._已完成特殊场景.includes(离婚.许曼君离婚场景ID), false);
});

test('刷新发现H3～H8绑定场次失效时安全退回下一夜；无关亲密场次不被清掉', () => {
  const orphan = 数据();
  购买(orphan); 提交预约(orphan); 完成法律离婚(orphan); 完成换锁(orphan); 送达邀请(orphan); 进入H2(orphan); 进入H3(orphan, '红本');
  const hardFacts = {
    legal: orphan.系统._许曼君离婚.法律离婚已成立,
    key: orphan.系统._许曼君离婚.旧钥匙状态,
    lock: orphan.系统._许曼君离婚.换锁完成,
  };
  orphan.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
  assert.equal(资源.恢复许曼君离婚失效亲密检查点(orphan), true);
  assert.equal(orphan.系统._许曼君离婚.阶段, '待最后一笔');
  assert.equal(orphan.系统._许曼君离婚.绑定亲密场次标识, '');
  assert.equal(orphan.系统._许曼君离婚.终幕目标, '');
  assert.deepEqual(
    {
      legal: orphan.系统._许曼君离婚.法律离婚已成立,
      key: orphan.系统._许曼君离婚.旧钥匙状态,
      lock: orphan.系统._许曼君离婚.换锁完成,
    },
    hardFacts,
  );

  const unrelated = 数据();
  购买(unrelated); 提交预约(unrelated); 完成法律离婚(unrelated); 完成换锁(unrelated); 送达邀请(unrelated); 进入H2(unrelated); 进入H3(unrelated, '婚戒');
  unrelated.系统._性爱场景.场次标识 = 'other-session';
  const otherScene = lodash.cloneDeep(unrelated.系统._性爱场景);
  assert.equal(资源.恢复许曼君离婚失效亲密检查点(unrelated), true);
  assert.deepEqual(unrelated.系统._性爱场景, otherScene);
  assert.equal(unrelated.系统._许曼君离婚.阶段, '待最后一笔');
});

test('资源层H8停止同样原子清账且不受孕、不出结果CG、保留下一安全夜晚重试', () => {
  const { data, action } = 准备资源待H3('婚戒');
  data.玩家资源.体力.当前值 = 4;
  结算资源楼(data, { floor: 100, action, text: '她解开婚纱放到椅背，两个人轻轻贴近。', scale: 1 });
  结算资源楼(data, { floor: 101, action: '继续前戏', text: '他抚摸许曼君的胸部继续前戏。', scale: 1 });
  结算资源楼(data, { floor: 102, action: '深度前戏', text: '她含住他的阴茎进行深度口交前戏。', scale: 2 });
  结算资源楼(data, { floor: 103, action: '正式交合', text: '他进入许曼君的阴道抽插，来到临近高潮。', scale: 3 });
  进入H8(data, 104);
  const pregnancyBefore = JSON.stringify(data.户['201'].妻._怀孕);
  const time = data.系统._绝对时段;
  const result = 资源.结算许曼君离婚H8收尾(data, '停止', 105);
  assert.equal(result.成功, true);
  assert.equal(result.CG, undefined);
  assert.equal(data.系统._性爱场景.状态, '空闲');
  assert.equal(data.系统._上次性爱结果.结束方式, '脚本收尾');
  assert.equal(data.系统._上次性爱结果.最终位置, '未射精');
  assert.equal(JSON.stringify(data.户['201'].妻._怀孕), pregnancyBefore);
  assert.equal(data.系统._许曼君离婚.阶段, '待最后一笔');
  assert.equal(data.系统._许曼君离婚.重试最早时段, time + 1);
  assert.equal(data.系统._已完成特殊场景.includes(离婚.许曼君离婚场景ID), false);
});

test('H8确认精确映射三张最终展示CG并进入H9，不签发完成ID', () => {
  const mapping = { 红本: 'XMJ-DIV-11', 婚戒: 'XMJ-DIV-12', 戒印: 'XMJ-DIV-13' };
  for (const [target, cg] of Object.entries(mapping)) {
    const data = 准备成人终幕(target);
    const result = 提交H8并清账(data, '确认', 60);
    assert.equal(result.成功, true);
    assert.equal(result.CG, cg);
    assert.equal(data.系统._许曼君离婚.H阶段, 'H8结果待演');
    assert.equal(data.系统._许曼君离婚.H8状态, '已确认');
    assert.equal(离婚.许曼君离婚检查点CG(data, '201'), cg);
    const performed = 完成H8结果演出(data, 61);
    assert.equal(performed.CG, cg);
    assert.equal(离婚.许曼君离婚检查点CG(data, '201'), cg);
    assert.equal(离婚.许曼君离婚检查点CG(data, '大堂'), '');
    assert.equal(data.系统._已完成特殊场景.includes(离婚.许曼君离婚场景ID), false);
  }
});

test('H8结果与H9封存只能描述既成结果，不能再次演出射精动作', () => {
  const data = 准备成人终幕('红本');
  提交H8并清账(data, '确认', 160);
  const h8 = 离婚.执行许曼君离婚地点动作(data, '完成H8结果演出', '201', 161);
  assert.match(
    离婚.许曼君离婚正文越拍原因(h8.事件, '玩家射精在红本上，精液留在封皮中央。'),
    /重新演成了射精动作/u,
  );
  assert.equal(
    离婚.许曼君离婚正文越拍原因(h8.事件, '红本封皮上已经留下唯一结果，许曼君看清后把手停在盒边。'),
    '',
  );
  const beforeH8演出 = lodash.cloneDeep(data);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h8.事件, '201', 161).成功, true);
  const h8Resource = 资源.结算成功现场楼(data, beforeH8演出, {
    场景: '201',
    楼层: 161,
    行动: '看清已经成立的结果',
    正文: '红本封皮上已经留下唯一结果，许曼君看清后把手停在盒边。',
    本楼事件: h8.事件,
    妻在场: ['201'],
    实际尺度: { 201: 3 },
    尺度判定: { 201: { 请求: 3, 实际: 3, 许可上限: 5, 越界原因: '' } },
    资源计费: false,
  });
  assert.equal(h8Resource.抑制普通CG, true);
  assert.equal(data.系统._性爱场景.状态, '空闲', 'H8结果描述不能重新创建普通亲密场次');
  const h9 = 离婚.执行许曼君离婚地点动作(data, '封存选定物件', '201', 162);
  assert.match(
    离婚.许曼君离婚正文越拍原因(h9.事件, '玩家又射精在红本上，许曼君亲手把红本装进透明套并放进红盒，再亲手合上红盒。'),
    /不能再次演出射精/u,
  );
});

test('戒印长按固定1.2秒；失败两次后只开放一次等价补偿，未达两次不可绕过', () => {
  const data = 准备成人终幕('戒印');
  提交H8并清账(data, '确认', 60);
  完成H8结果演出(data, 61);
  const hold = 离婚.许曼君离婚地点动作(data, '201')[0].选项[0];
  assert.equal(hold.长按毫秒, 1200);
  assert.equal(hold.短按动作, '戒印长按失败');
  assert.equal(hold.id, '把戒指压进红色封皮');
  assert.equal(离婚.执行许曼君离婚地点动作(data, '让许曼君按下去', '201').成功, false);
  assert.equal(离婚.执行许曼君离婚地点动作(data, '戒印长按失败', '201').成功, true);
  assert.equal(data.系统._许曼君离婚.戒印长按失败次数, 1);
  assert.equal(离婚.执行许曼君离婚地点动作(data, '戒印长按失败', '201').成功, true);
  assert.equal(data.系统._许曼君离婚.戒印长按失败次数, 2);
  const action = 离婚.许曼君离婚地点动作(data, '201')[0];
  assert.equal(action.id, '让许曼君按下去');
  assert.equal(离婚.执行许曼君离婚地点动作(data, '让许曼君按下去', '201').成功, true);
});

test('戒印短按补偿真实跨过 eventEmit → eventOn 边界，过期意图仍被活快照拒绝', () => {
  const data = 准备成人终幕('戒印');
  提交H8并清账(data, '确认', 60);
  完成H8结果演出(data, 61);

  const 监听 = new Map();
  const 提示 = [];
  const eventOn = (事件, 消费者) => 监听.set(事件, 消费者);
  const eventEmit = (事件, 载荷) => 监听.get(事件)?.(载荷);
  eventOn('人妻公寓:许曼君离婚动作', 动作 => {
    const 动作组 = 离婚.许曼君离婚地点动作(data, '201');
    const 候选 = 离婚事件边界.查找许曼君离婚事件候选(动作组, 动作);
    if (!候选) {
      提示.push('过期动作');
      return;
    }
    const 结果 = 离婚.执行许曼君离婚地点动作(data, 动作, '201');
    提示.push(结果.提示);
  });

  eventEmit('人妻公寓:许曼君离婚动作', '戒印长按失败');
  assert.equal(data.系统._许曼君离婚.戒印长按失败次数, 1);
  assert.doesNotMatch(提示.at(-1), /过期动作/u);
  eventEmit('人妻公寓:许曼君离婚动作', '戒印长按失败');
  assert.equal(data.系统._许曼君离婚.戒印长按失败次数, 2);
  assert.equal(离婚.许曼君离婚地点动作(data, '201')[0].id, '让许曼君按下去');

  eventEmit('人妻公寓:许曼君离婚动作', '戒印长按失败');
  assert.equal(data.系统._许曼君离婚.戒印长按失败次数, 2, '补偿入口替换后，迟到短按不得再改状态');
  assert.equal(提示.at(-1), '过期动作');

  const 入口 = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  assert.match(入口, /import \{ 查找许曼君离婚事件候选 \} from '\.\/许曼君离婚事件边界'/u);
  assert.match(入口, /const 候选 = 查找许曼君离婚事件候选\(动作组, 动作\)/u);
});

test('H9只登记所选分支、一个纪念物、CG14和一次完成ID', () => {
  for (const [target, item] of [['红本', '封存的红本'], ['婚戒', '封存的婚戒'], ['戒印', '戒印红本']]) {
    const data = 准备成人终幕(target);
    提交H8并清账(data, '确认', 60);
    完成H8结果演出(data, 61);
    if (target === '戒印') {
      离婚.执行许曼君离婚地点动作(data, '戒印长按失败', '201');
      离婚.执行许曼君离婚地点动作(data, '戒印长按失败', '201');
    }
    const action = target === '戒印' ? '让许曼君按下去' : '封存选定物件';
    const h9 = 离婚.执行许曼君离婚地点动作(data, action, '201', 62);
    assert.equal(h9.成功, true);
    assert.equal(离婚.提交许曼君离婚剧情事件(data, h9.事件, '201', 62).成功, true);
    assert.equal(data.系统._许曼君离婚.封存物件, item);
    assert.equal(data.系统._许曼君离婚.封存盒位置, '私密抽屉');
    assert.equal(data.系统._许曼君离婚.CG回忆.includes('XMJ-DIV-14'), true);
    assert.equal(data.系统._已完成特殊场景.filter(id => id === 离婚.许曼君离婚场景ID).length, 1);
    assert.equal(data.系统._许曼君离婚.阶段, '已完成');
  }
});

test('只有完成ID的旧档恢复正式离婚后效，但不猜目标、不倒签CG、不生成新物件', () => {
  const data = 数据();
  data.系统._已完成特殊场景.push(离婚.许曼君离婚场景ID);
  data.系统._许曼君离婚 = Schema.parse({}).系统._许曼君离婚;
  const changed = 离婚.同步许曼君离婚完成后状态(data);
  assert.equal(changed, true);
  assert.equal(data.系统._许曼君离婚.阶段, '已完成');
  assert.equal(data.系统._许曼君离婚.法律离婚已成立, true);
  assert.equal(data.户['201'].夫._居住模式, '正式退居');
  assert.equal(data.系统._许曼君离婚.终幕目标, '');
  assert.deepEqual(data.系统._许曼君离婚.CG回忆, []);
  assert.equal(data.系统._许曼君离婚.封存物件, '旧档未记录');
  assert.equal(data.系统._许曼君离婚.新锁芯位置, '旧档未记录');
  assert.equal(data.背包.includes(离婚.许曼君离婚新钥匙ID), false);
  assert.equal(离婚.同步许曼君离婚完成后状态(data), false);
});

test('正式完成且未退出关系时，201只定义一块“和她亲密”及两个开场方向', () => {
  const data = 准备成人终幕('红本');
  提交H8并清账(data, '确认', 60);
  完成H8结果演出(data, 61);
  const h9 = 离婚.执行许曼君离婚地点动作(data, '封存选定物件', '201', 62);
  离婚.提交许曼君离婚剧情事件(data, h9.事件, '201', 62);
  data.系统._绝对时段 = 15;
  const actions = 离婚.许曼君离婚地点动作(data, '201');
  assert.equal(actions.length, 1);
  assert.equal(actions[0].id, '和她亲密');
  assert.deepEqual(actions[0].选项.map(item => item.id), ['由我开始', '让她开始']);
  assert.match(离婚.许曼君结局后亲密行动('由我开始'), /【201结局后亲密开场】【由我开始】/);
  assert.match(离婚.许曼君结局后亲密行动('让她开始'), /【201结局后亲密开场】【让她开始】/);
});

test('结局后201两个开场方向都由资源层建立零进度普通场次，不消耗开场楼体力', () => {
  for (const choice of ['由我开始', '让她开始']) {
    const data = 数据();
    data.系统._已完成特殊场景.push(离婚.许曼君离婚场景ID);
    离婚.同步许曼君离婚完成后状态(data);
    data.玩家资源.体力.当前值 = 5;
    const stamina = data.玩家资源.体力.当前值;
    const result = 结算资源楼(data, {
      floor: choice === '由我开始' ? 130 : 131,
      action: 离婚.许曼君结局后亲密行动(choice),
      text: choice === '由我开始' ? '他先靠近许曼君，在进一步接触前停住。' : '许曼君先靠近他，在进一步接触前停住。',
      scale: 0,
      cost: false,
    });
    assert.equal(result.性爱开始, true);
    assert.equal(data.系统._性爱场景.状态, '进行中');
    assert.equal(data.系统._性爱场景.主焦点门牌, '201');
    assert.equal(data.系统._性爱场景.有效楼数, 0);
    assert.equal(data.系统._性爱场景.参与者['201'].有效楼数, 0);
    assert.equal(data.玩家资源.体力.当前值, stamina);
  }
});

test('资源层同样拒绝旧档未知关系伪造201结局后亲密开场', () => {
  const data = 数据('未决定');
  data.系统._已完成特殊场景.push(离婚.许曼君离婚场景ID);
  离婚.同步许曼君离婚完成后状态(data);
  assert.throws(
    () =>
      结算资源楼(data, {
        floor: 170,
        action: 离婚.许曼君结局后亲密行动('由我开始'),
        text: '玩家向许曼君靠近，在直接接触前停住。',
        scale: 0,
        cost: false,
      }),
    /关系或体力条件已经变化/u,
  );
  assert.equal(data.系统._性爱场景.状态, '空闲');
});

test('戒印长按UI、房间动作和背包入口都只向同一《离婚》事件总线发意图', () => {
  const drawer = read('src/人妻公寓/界面/客户端/components/房内操作抽屉.vue');
  assert.match(drawer, /setTimeout\(\(\) =>/u);
  assert.match(drawer, /选项\.长按毫秒/u);
  assert.match(drawer, /@pointerdown="开始长按选项/u);
  assert.match(drawer, /@pointerup="结束长按选项/u);
  assert.match(drawer, /@keydown\.enter="开始键盘长按/u);
  assert.match(drawer, /@keyup\.space="结束键盘长按/u);
  assert.match(drawer, /void 选项\.短按\?\.\(\)/u);
  assert.match(drawer, /\.choice-tile:only-child/u);
  assert.match(drawer, /\.choice-tile:focus-visible/u);
  const roomActions = read('src/人妻公寓/界面/客户端/composables/useRoomActions.ts');
  assert.match(roomActions, /添加许曼君离婚动作/u);
  assert.match(roomActions, /许曼君离婚动作\(选项\.短按动作/u);
  assert.match(roomActions, /长按毫秒: 选项\.长按毫秒/u);
  const backpack = read('src/人妻公寓/界面/客户端/components/背包.vue');
  assert.match(backpack, /useXumanjunDivorce/u);
  assert.match(backpack, />\s*在201使用\s*</u);
  const app = read('src/人妻公寓/界面/客户端/App.vue');
  assert.match(app, /@use-xumanjun-divorce="使用许曼君离婚封存盒"/u);
  assert.match(app, /eventEmit\('人妻公寓:许曼君离婚动作', '使用红色封存盒'/u);
});

test('15个运行ID映射闭合，背景和次晨只在完成后接管', () => {
  assert.deepEqual(离婚.许曼君离婚全部CGID, Array.from({ length: 15 }, (_, index) => `XMJ-DIV-${String(index + 1).padStart(2, '0')}`));
  const data = 数据();
  assert.equal(离婚.许曼君离婚结局背景CG(data, '201'), '');
  assert.equal(离婚.许曼君离婚次晨CG(data), '');
  data.系统._已完成特殊场景.push(离婚.许曼君离婚场景ID);
  离婚.同步许曼君离婚完成后状态(data);
  data.系统._绝对时段 = 14;
  assert.equal(离婚.许曼君离婚结局背景CG(data, '201'), 'XMJ-DIV-04');
  data.系统._绝对时段 = 15;
  assert.equal(离婚.许曼君离婚结局背景CG(data, '201'), 'XMJ-DIV-05');
  assert.equal(离婚.许曼君离婚次晨CG(data), 'XMJ-DIV-15');
});

test('生产源码只认产品目录，不静态读取output/imagegen或local-insets', () => {
  const source = read('src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
  assert.doesNotMatch(source, /output\/imagegen|local-insets|presentation-with-inset/);
  assert.doesNotMatch(source, /['"](?:离婚完成|许曼君正式离婚完成)['"]/);
  assert.equal(离婚.许曼君离婚商品ID, '角色路线:201:结局剧情');
  assert.equal(离婚.许曼君离婚场景ID, '角色路线:201:结局剧情');
});
