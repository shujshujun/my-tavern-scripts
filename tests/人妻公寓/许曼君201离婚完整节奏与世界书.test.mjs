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
const 世界书 = require('../../src/人妻公寓/脚本/游戏逻辑/201离婚世界书.ts');
const 时间 = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function 数据(choice = '继续关系', time = 3) {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: time } });
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].妻.好感值 = 90;
  data.户['201'].妻.堕落值 = 95;
  data.玩家资源.体力.当前值 = 10;
  data.现金 = 5000;
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
  return data;
}

function 购买预约(data, floor = 10) {
  assert.equal(离婚.购买许曼君离婚(data, 1500).成功, true);
  const start = 离婚.执行许曼君离婚地点动作(data, '使用红色封存盒', '201', floor);
  assert.equal(start.成功, true);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, start.事件, '201', floor).成功, true);
}

function 法律办理(data, floor = 20) {
  data.系统._绝对时段 = data.系统._许曼君离婚.办理预约时段;
  const l1 = 离婚.执行许曼君离婚地点动作(data, '陪她去办最后手续', '大堂', floor);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, l1.事件, '大堂', floor).成功, true);
  const l2 = 离婚.执行许曼君离婚地点动作(data, '当着赵国强牵住她', '大堂', floor + 1);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, l2.事件, '大堂', floor + 1).成功, true);
}

function 归档换锁(data, floor = 30) {
  const hard = 离婚.执行许曼君离婚地点动作(data, '归档201前住户旧钥匙', '管理员室', floor);
  assert.equal(hard.成功, true);
  assert.equal(data.系统._许曼君离婚.阶段, '待归档确认');
  const confirm = 离婚.执行许曼君离婚地点动作(data, '确认201继续由她居住', '管理员室', floor + 1);
  assert.match(confirm.事件, /【许曼君离婚提交:K1:/u);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, confirm.事件, '管理员室', floor + 1).成功, true);
  assert.equal(data.系统._许曼君离婚.阶段, '待领取新锁');
  assert.equal(离婚.执行许曼君离婚地点动作(data, '领取201新锁芯和钥匙', '管理员室').成功, true);
  data.系统._绝对时段 = 9;
  assert.equal(离婚.执行许曼君离婚地点动作(data, '更换201锁芯', '201').成功, true);
}

function 送达邀请(data) {
  data.系统._绝对时段 = data.系统._许曼君离婚.邀请最早时段;
  离婚.同步许曼君离婚时间节点(data);
  assert.equal(离婚.提交许曼君离婚邀请已送达(data).成功, true);
  data.系统._绝对时段 = 15;
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

function 进入H7(data, target = '红本') {
  const h1 = 离婚.执行许曼君离婚地点动作(data, '开始最后一笔', '201', 40);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h1.事件, '201', 40).成功, true);
  const h2 = 离婚.执行许曼君离婚地点动作(data, '打开红色封存盒', '201', 41);
  assert.match(h2.事件, /【许曼君离婚提交:H2:/u);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H2');
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h2.事件, '201', 41).成功, true);
  assert.equal(data.系统._许曼君离婚.H阶段, '待H3');

  const selectAction = target === '红本' ? '选择红本' : target === '婚戒' ? '选择婚戒' : '选择戒印';
  const selected = 离婚.执行许曼君离婚地点动作(data, selectAction, '201', 42);
  assert.equal(selected.需普通亲密回合, true);
  空亲密场景(data);
  assert.equal(离婚.绑定许曼君离婚亲密场次(data, target, 42), true);
  const rounds = [
    { floor: 42, scale: 1, behavior: '无插入', text: '许曼君解开旧婚纱并把婚纱放到椅背，两个人只进入轻接触。' },
    { floor: 43, scale: 1, behavior: '无插入', text: '两个人继续抚摸和亲吻，只演前戏。' },
    { floor: 44, scale: 2, behavior: '口交', text: '许曼君俯身含住他，进入深度口交前戏。' },
    { floor: 45, scale: 3, behavior: '阴道插入', text: '他进入许曼君的阴道交合，逼近高潮但没有射精。' },
  ];
  for (const round of rounds) {
    assert.equal(离婚.提交许曼君离婚亲密有效回合(data, {
      地点: '201',
      楼层: round.floor,
      妻在场: ['201'],
      实际尺度: round.scale,
      当前行为: round.behavior,
      正文: round.text,
    }).成功, true);
  }
  assert.equal(data.系统._许曼君离婚.H阶段, 'H7');
}

test('Schema枚举包含归档确认、H2/H7固定回合与H8结果待演检查点', () => {
  const data = Schema.parse({});
  assert.equal(data.系统._许曼君离婚.阶段, '未开始');
  const schemaJson = JSON.parse(read('src/人妻公寓/schema.json'));
  const route = schemaJson.properties.系统.properties._许曼君离婚.properties;
  assert.ok(route.阶段.enum.includes('待归档确认'));
  for (const scene of ['归档确认', 'H2开盒', 'H7摆目标', 'H8结果']) assert.ok(route.当前场景.enum.includes(scene));
  assert.ok(route.H阶段.enum.includes('H8结果待演'));
});

test('继续/暂不承诺分支使用红盒时至少需要5点体力，失败不消费商品', () => {
  for (const choice of ['继续关系', '暂不承诺']) {
    const data = 数据(choice);
    assert.equal(离婚.购买许曼君离婚(data, 1500).成功, true);
    data.玩家资源.体力.当前值 = 4;
    const before = [...data.背包];
    const result = 离婚.执行许曼君离婚地点动作(data, '使用红色封存盒', '201', 5);
    assert.equal(result.成功, false);
    assert.match(result.提示, /5点体力/u);
    assert.deepEqual(data.背包, before);
    assert.equal(data.系统._许曼君离婚.阶段, '已购买');
  }
  const exit = 数据('退出关系');
  assert.equal(离婚.购买许曼君离婚(exit, 1500).成功, true);
  exit.玩家资源.体力.当前值 = 0;
  assert.equal(离婚.执行许曼君离婚地点动作(exit, '使用红色封存盒', '201', 5).成功, true, '非成人分支不要求终幕体力');
});

test('旧钥匙硬归档后必须再演1个AI回合；生成失败不能撤销退居与归档', () => {
  const data = 数据();
  购买预约(data);
  法律办理(data);
  const hard = 离婚.执行许曼君离婚地点动作(data, '归档201前住户旧钥匙', '管理员室', 30);
  assert.equal(hard.成功, true);
  assert.equal(data.系统._许曼君离婚.旧钥匙状态, '前住户旧钥匙归档');
  assert.equal(data.系统._许曼君离婚.赵国强正式退居, true);
  assert.equal(data.户['201'].夫._居住模式, '正式退居');
  assert.deepEqual(离婚.许曼君离婚地点动作(data, '管理员室').map(item => item.id), ['确认201继续由她居住']);
  const ticket = 离婚.执行许曼君离婚地点动作(data, '确认201继续由她居住', '管理员室', 31);
  const bad = 离婚.提交许曼君离婚剧情事件(data, ticket.事件, '201', 31);
  assert.equal(bad.成功, false);
  assert.equal(data.系统._许曼君离婚.旧钥匙状态, '前住户旧钥匙归档');
  assert.equal(data.户['201'].夫._居住模式, '正式退居');
  assert.equal(data.系统._许曼君离婚.阶段, '待归档确认');
});

test('H2与H7各占一个有效AI回合，生成前不越过检查点', () => {
  const data = 数据();
  购买预约(data);
  法律办理(data);
  归档换锁(data);
  送达邀请(data);
  const h1 = 离婚.执行许曼君离婚地点动作(data, '开始最后一笔', '201', 40);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h1.事件, '201', 40).成功, true);
  const h2 = 离婚.执行许曼君离婚地点动作(data, '打开红色封存盒', '201', 41);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H2');
  assert.match(离婚.许曼君离婚时间动作阻断原因(data), /最后一笔/u);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h2.事件, '201', 41).成功, true);
  assert.equal(data.系统._许曼君离婚.H阶段, '待H3');

  const selected = 离婚.执行许曼君离婚地点动作(data, '选择红本', '201', 42);
  assert.equal(selected.需普通亲密回合, true);
  空亲密场景(data);
  assert.equal(离婚.绑定许曼君离婚亲密场次(data, '红本', 42), true);
  const rounds = [
    [0, 1, '无插入', '许曼君解开旧婚纱并把婚纱放到椅背，两个人只进入轻接触。'],
    [1, 1, '无插入', '两个人继续抚摸和亲吻，只演前戏。'],
    [2, 2, '口交', '许曼君俯身含住他，进入深度口交前戏。'],
    [3, 3, '阴道插入', '他进入许曼君的阴道交合，逼近高潮但没有射精。'],
  ];
  for (const [index, scale, behavior, text] of rounds) {
    assert.equal(离婚.提交许曼君离婚亲密有效回合(data, { 地点: '201', 楼层: 42 + index, 妻在场: ['201'], 实际尺度: scale, 当前行为: behavior, 正文: text }).成功, true);
  }
  const h7 = 离婚.执行许曼君离婚地点动作(data, '摆好锁定目标', '201', 46);
  assert.match(h7.事件, /【许曼君离婚提交:H7:/u);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H7');
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h7.事件, '201', 46).成功, true);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H8');
});

test('H8先硬结算普通账，再用独立AI回合演既成结果；失败时不得重复射精', () => {
  const data = 数据();
  购买预约(data); 法律办理(data); 归档换锁(data); 送达邀请(data); 进入H7(data, '红本');
  const h7 = 离婚.执行许曼君离婚地点动作(data, '摆好锁定目标', '201', 46);
  assert.equal(离婚.提交许曼君离婚剧情事件(data, h7.事件, '201', 46).成功, true);
  const hard = 离婚.提交许曼君离婚H8硬结果(data, '确认', 47);
  assert.equal(hard.成功, true);
  data.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
  assert.equal(data.系统._许曼君离婚.H阶段, 'H8结果待演');
  assert.equal(data.系统._许曼君离婚.H8状态, '已确认');
  assert.match(离婚.许曼君离婚时间动作阻断原因(data), /H8结果待演|最后一笔/u);
  const beforeTime = data.系统._绝对时段;
  const blocked = 时间.预检时间推进(data, {
    方式: '推进一时段',
    预期绝对时段: beforeTime,
    当前消息楼: 47,
    当前地点: '201',
  });
  assert.equal(blocked.成功, false);
  assert.equal(data.系统._绝对时段, beforeTime);
  const action = 离婚.执行许曼君离婚地点动作(data, '完成H8结果演出', '201', 48);
  assert.match(action.事件, /【许曼君离婚提交:H8:/u);
  const wrong = 离婚.提交许曼君离婚剧情事件(data, action.事件, '大堂', 48);
  assert.equal(wrong.成功, false);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H8结果待演');
  assert.equal(data.系统._许曼君离婚.H8状态, '已确认');
  assert.equal(离婚.提交许曼君离婚剧情事件(data, action.事件, '201', 48).成功, true);
  assert.equal(data.系统._许曼君离婚.H阶段, 'H9');
});

test('真实点击接线把K1、H2、H7与H8结果全部交给即时开演，不能落入零回合硬操作兜底', () => {
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const start = index.indexOf('const 剧情动作 = new Set<许曼君离婚动作ID>');
  const end = index.indexOf('if (剧情动作.has(动作))', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const routed = index.slice(start, end);
  for (const action of ['确认201继续由她居住', '打开红色封存盒', '摆好锁定目标', '完成H8结果演出']) {
    assert.match(routed, new RegExp(`'${action}'`, 'u'), `${action}必须创建并演出AI剧情票`);
  }
});

test('固定回合与原生备用提交链都对《离婚》及D1/D2执行首稿重写和二稿失败关闭', () => {
  const engine = read('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const native = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  for (const source of [engine, native]) {
    assert.match(source, /许曼君离婚正文越拍原因/u);
    assert.match(source, /许曼君离婚后日常正文越界原因/u);
    assert.match(source, /许曼君离婚剧情演员错误/u);
    assert.match(source, /许曼君离婚后日常演员错误/u);
  }
  assert.match(engine, /首稿需静默重写/u);
  assert.match(engine, /两次未能停在D1\/D2边界/u);
  assert.match(native, /生成许曼君原生专属正文重写/u);
  assert.match(native, /201专属剧情重写仍未通过验收/u);
  assert.match(native, /本拍与检查点均已保留，可直接重试/u);
  assert.match(native, /原始MVU候选来自已经作废的首稿/u);
});

test('H3成功信号会先撤下DIV-07横向事件图，再让普通亲密CG舞台接管', () => {
  const app = read('src/人妻公寓/界面/客户端/App.vue');
  const start = app.indexOf("eventOn('人妻公寓:CG回合信号'");
  const end = app.indexOf("eventOn('人妻公寓:家庭计划CG'", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const handler = app.slice(start, end);
  assert.match(handler, /许曼君离婚H3/u);
  assert.match(handler, /当前家庭计划CG\.value\?\.来源 === '许曼君离婚'/u);
  assert.match(handler, /当前家庭计划CG\.value = null/u);
  assert.ok(handler.indexOf('当前家庭计划CG.value = null') < handler.indexOf('接收CG信号'));
  const engine = read('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const native = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  assert.match(engine, /if \(!资源结算\.抑制普通CG\)[\s\S]*?人妻公寓:CG回合信号/u);
  assert.match(native, /if \(!资源结算\.抑制普通CG\)[\s\S]*?人妻公寓:CG回合信号/u);
  assert.match(app, /许曼君离婚检查点CG/u);
  assert.match(app, /当前家庭计划CG\.value = \{ 文件, 标题: 许曼君离婚CG标题\(文件\), 来源: '许曼君离婚' \}/u);
});

test('H8三张结果图切换使用一次轻微白闪，并在静止/减弱动态模式下关闭且卸载清理计时', () => {
  const app = read('src/人妻公寓/界面/客户端/App.vue');
  assert.match(app, /story-divorce-flash['"]:\s*离婚结果白闪/u);
  assert.match(app, /\^XMJ-DIV-1\[1-3\]\$/u);
  assert.match(app, /触发离婚结果白闪\(\)/u);
  assert.match(app, /@keyframes divorce-result-flash/u);
  assert.match(app, /prefers-reduced-motion: reduce[\s\S]*?story-divorce-flash/u);
  assert.match(app, /html\.rq-still[\s\S]*?story-divorce-flash/u);
  assert.match(app, /clearTimeout\(离婚结果白闪timer\)/u);
  assert.match(app, /cancelAnimationFrame\(离婚结果白闪帧\)/u);
  assert.match(app, /当前事件CG请求epoch\.value \+= 1/u);
  assert.match(app, /#rqgy-event-\$\{当前事件CG请求epoch\.value\}/u);
  assert.match(app, /失败地址 !== 当前事件CG地址\.value/u);
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const start = index.indexOf("if (动作 === '确认射在这里' || 动作 === '停下，今晚不封存')");
  const end = index.indexOf('const 剧情动作 = new Set<许曼君离婚动作ID>', start);
  const h8 = index.slice(start, end);
  assert.ok(h8.indexOf('播放许曼君离婚CG(结果)') < h8.indexOf("eventEmit('人妻公寓:提示', 结果.提示)"));
});

test('关系分支完整路线恰有13个AI回合：1使用＋2办理＋1归档确认＋H1至H9', () => {
  const source = read('src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
  for (const code of ['S', 'L1', 'L2', 'K1', 'H1', 'H2', 'H7', 'H8', 'H9']) {
    assert.match(source, new RegExp(`'${code}'`, 'u'));
  }
  assert.match(source, /H3～H6四个有效回合/u);
  const design = read('src/人妻公寓/许曼君201结局线_离婚_特殊场景机制设计_v2_2026-09-03.md');
  assert.match(design, /13 个有效 AI 回合|13个有效AI回合/u);
});

test('状态机正向实跑从购买到H9恰好提交13个有效AI回合', () => {
  const data = 数据('继续关系');
  let rounds = 0;
  assert.equal(离婚.购买许曼君离婚(data, 1500).成功, true);

  const commit = (action, location, floor, text) => {
    const prepared = 离婚.执行许曼君离婚地点动作(data, action, location, floor);
    assert.equal(prepared.成功, true, prepared.提示);
    assert.ok(prepared.事件, `${action}必须产生AI剧情票`);
    assert.equal(离婚.许曼君离婚正文越拍原因(prepared.事件, text), '');
    const result = 离婚.提交许曼君离婚剧情事件(data, prepared.事件, location, floor);
    assert.equal(result.成功, true, result.提示);
    rounds += 1;
    return result;
  };

  commit('使用红色封存盒', '201', 200, '许曼君收下红盒，只确认第二天下午由夫妻本人办理，玩家陪到现场。');
  data.系统._绝对时段 = data.系统._许曼君离婚.办理预约时段;
  commit('陪她去办最后手续', '大堂', 201, '玩家留在窗口外等候，许曼君与赵国强仍在里面办理。');
  commit('当着赵国强牵住她', '大堂', 202, '许曼君拿着自己的离婚证出来，玩家当着赵国强牵住她的手。');

  assert.equal(离婚.执行许曼君离婚地点动作(data, '归档201前住户旧钥匙', '管理员室').成功, true);
  commit('确认201继续由她居住', '管理员室', 203, '前住户旧钥匙已经归档进钥匙格。许曼君以后继续住在201。');
  assert.equal(离婚.执行许曼君离婚地点动作(data, '领取201新锁芯和钥匙', '管理员室').成功, true);
  data.系统._绝对时段 = 9;
  assert.equal(离婚.执行许曼君离婚地点动作(data, '更换201锁芯', '201').成功, true);
  data.系统._绝对时段 = data.系统._许曼君离婚.邀请最早时段;
  离婚.同步许曼君离婚时间节点(data);
  assert.equal(离婚.提交许曼君离婚邀请已送达(data).成功, true);
  data.系统._绝对时段 = 15;

  commit('开始最后一笔', '201', 204, '许曼君穿着旧婚纱打开201的门，只把玩家迎进屋。');
  commit('打开红色封存盒', '201', 205, '许曼君打开红色封存盒，红本、婚戒和红色封皮已经可见，等玩家选择。');
  const selected = 离婚.执行许曼君离婚地点动作(data, '选择红本', '201', 206);
  assert.equal(selected.成功, true);
  空亲密场景(data, 'thirteen-rounds');
  assert.equal(离婚.绑定许曼君离婚亲密场次(data, '红本', 206), true);
  for (const input of [
    { 楼层: 206, 实际尺度: 1, 当前行为: '无插入', 正文: '许曼君解开旧婚纱并把婚纱放到椅背，两个人只进入轻接触。' },
    { 楼层: 207, 实际尺度: 1, 当前行为: '无插入', 正文: '两个人继续抚摸和亲吻，只演前戏。' },
    { 楼层: 208, 实际尺度: 2, 当前行为: '口交', 正文: '许曼君俯身含住他，进入深度口交前戏。' },
    { 楼层: 209, 实际尺度: 3, 当前行为: '阴道插入', 正文: '他进入许曼君的阴道交合，逼近高潮但没有射精。' },
  ]) {
    assert.equal(离婚.提交许曼君离婚亲密有效回合(data, { 地点: '201', 妻在场: ['201'], ...input }).成功, true);
    rounds += 1;
  }
  commit('摆好锁定目标', '201', 210, '许曼君把红本放好并对准，停在等待确认的末帧。');
  assert.equal(离婚.提交许曼君离婚H8硬结果(data, '确认', 211).成功, true);
  data.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
  commit('完成H8结果演出', '201', 211, '红本封皮上已经留下唯一结果，许曼君看清后把手停在盒边。');
  commit('封存选定物件', '201', 212, '红本进入透明套后放进红色封存盒，许曼君亲手合上红盒。');

  assert.equal(rounds, 13);
  assert.equal(data.系统._许曼君离婚.阶段, '已完成');
  assert.equal(data.系统._已完成特殊场景.filter(id => id === 离婚.许曼君离婚场景ID).length, 1);
});

test('201动态世界书区分结局前、法律已离但未封板、三种完成关系与旧档未知关系', () => {
  assert.equal(世界书.离婚阶段世界书条目名, '[人妻公寓]201婚姻与生活阶段');
  const before = 数据();
  before.系统._许曼君分居.阶段 = '进行中';
  before.系统._许曼君离婚.阶段 = '未开始';
  assert.match(世界书.构造201离婚阶段世界书内容(before), /尚未完成.*离婚|分居过渡/u);

  const legal = 数据();
  legal.系统._许曼君离婚.阶段 = '待归档确认';
  legal.系统._许曼君离婚.法律离婚已成立 = true;
  assert.match(世界书.构造201离婚阶段世界书内容(legal), /法律离婚已经成立/u);
  assert.match(世界书.构造201离婚阶段世界书内容(legal), /完整结局尚未完成/u);

  for (const choice of ['继续关系', '暂不承诺', '退出关系']) {
    const done = 数据(choice);
    done.系统._许曼君离婚.阶段 = '已完成';
    done.系统._已完成特殊场景.push(离婚.许曼君离婚场景ID);
    const content = 世界书.构造201离婚阶段世界书内容(done);
    assert.match(content, new RegExp(choice, 'u'));
    assert.doesNotMatch(content, /红本结果|婚戒结果|戒印结果|射精/u);
  }
  const legacy = 数据('未决定');
  legacy.系统._许曼君离婚.阶段 = '已完成';
  legacy.系统._已完成特殊场景.push(离婚.许曼君离婚场景ID);
  assert.match(世界书.构造201离婚阶段世界书内容(legacy), /关系选择未记录|不得推断/u);
});

test('201世界书接入启动、有效提交、回档/重掷、重开和切聊缓存失效生命周期', () => {
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const engine = read('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  assert.match(index, /同步201离婚阶段世界书/u);
  assert.match(index, /作废201离婚阶段世界书同步缓存/u);
  assert.ok((index.match(/同步201离婚阶段世界书/g) ?? []).length >= 4);
  assert.ok((engine.match(/同步201离婚阶段世界书/g) ?? []).length >= 4);
  assert.doesNotMatch(read('src/人妻公寓/脚本/游戏逻辑/201离婚世界书.ts'), /角色卡主世界书|setCharacterWorldbook/u);
});

test('启动恢复会先修正离婚完成事实、到期邀请与短暂本地新钥匙归属，再开放监听', () => {
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const start = index.indexOf('const 尾楼缺存档');
  const end = index.indexOf('捕获保护快照(data);', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const startup = index.slice(start, end);
  assert.match(startup, /恢复许曼君离婚失效亲密检查点\(data\)/u);
  assert.match(startup, /同步许曼君离婚完成后状态\(data\)/u);
  assert.match(startup, /同步许曼君离婚时间节点\(data\)/u);
  assert.match(startup, /await 脚本写入\(raw, data\)/u);
});

test('时间推进核心提交后会重算201世界书；同步失败只记日志，不回滚已经推进的世界时间', () => {
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const start = index.indexOf('双存储已提交 = true;');
  const end = index.indexOf('function 处理撤销时间推进', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const successTail = index.slice(start, end);
  assert.match(successTail, /同步201离婚阶段世界书\(候选/u);
  assert.match(successTail, /catch \(同步错误\)/u);
  assert.match(successTail, /不反向回滚/u);
  assert.match(index, /许曼君离婚时间动作阻断原因/u);
  const timeSource = read('src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
  assert.match(timeSource, /const 离婚硬动作 = 许曼君离婚时间动作阻断原因\(data\)/u);
});

test('静态角色世界书把婚姻/男主人标为初始事实，避免完成后与动态条目冲突', () => {
  const wife = read('src/人妻公寓/世界书/角色/许曼君.yaml');
  const husband = read('src/人妻公寓/世界书/角色/赵国强.yaml');
  assert.match(wife, /初始|当前.*硬事实/u);
  assert.match(husband, /初始|当前.*硬事实/u);
});
