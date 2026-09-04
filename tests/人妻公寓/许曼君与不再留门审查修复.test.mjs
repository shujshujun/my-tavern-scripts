/* eslint-disable import-x/no-nodejs-modules -- Node-only behavior regression */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '201' } });
globalThis.insertOrAssignVariables = () => undefined;
globalThis.getLastMessageId = () => 100;
globalThis.SillyTavern = { chat: [], name1: '管理员' };
globalThis.eventEmit = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
const nmd = require('../../src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');
const { 丈夫登门需要处理 } = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫登门系统.ts');
const { 追加等待场景剧情 } = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const { 丈夫在楼, 妻位置推算, 读取世界时间 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 编译许曼君分居手机通知 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts');
const { 读取许曼君201钥匙柜卡 } = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居钥匙柜.ts');

function 许曼君基础档() {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 现金: 12000 });
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].妻.阶段性癖 = 户静态表['201'].招牌性癖;
  data.系统._已完成特殊场景.push('肉偿账本');
  data.玩家资源.精力.当前值 = 8;
  data.玩家资源.体力.当前值 = 8;
  return data;
}

function 找201独处时段(data) {
  for (let abs = 0; abs < 6 * 42; abs += 1) {
    if (妻位置推算('201', abs, data.户['201']) === '201' && 丈夫在楼(data.户['201'], '201', abs) === '外出') return abs;
  }
  assert.fail('找不到201独处时段');
}

function 创建201留宿档() {
  const data = 许曼君基础档();
  Object.assign(data.系统._许曼君分居, {
    方案版本: 2,
    阶段: '已完成',
    钥匙位置: '管理员室201钥匙格',
    钥匙用途: '待离婚交接',
    封条修订: 1,
    封条完整: true,
    丈夫已知玩家关系: true,
    丈夫已选择外住: true,
    共同夜晚状态: '已完成',
    绑定亲密完整结果: '完整',
    留宿201权限: true,
    玩家最终关系选择: '继续关系',
    双方同意进入办理: true,
  });
  data.户['201'].夫._居住模式 = '待离婚交接';
  for (let abs = 0; abs < 6 * 42; abs += 1) {
    data.系统._绝对时段 = abs;
    if (['晚上', '深夜'].includes(读取世界时间(data).时段) && 妻位置推算('201', abs, data.户['201']) === '201') return data;
  }
  assert.fail('找不到201可留宿夜间');
}

function 旧分居档(阶段, extra = {}) {
  const data = 许曼君基础档();
  Object.assign(data.系统._许曼君分居, {
    方案版本: undefined,
    阶段,
    当前场景: '',
    当前拍: 0,
    工资卡状态: '已归还赵国强',
    丈夫已知玩家关系: true,
    丈夫已选择外住: true,
    封条修订: 1,
    封条完整: true,
    钥匙位置: '管理员室201钥匙格',
    封存袋位置: '管理员室入柜',
    钥匙用途: '临时外住',
    外住起点: 12,
    独住夜已验证: true,
    出车表已收起: true,
    ...extra,
  });
  data.户['201'].夫._居住模式 = '路线外住';
  return data;
}

function 周小满基础档() {
  const data = Schema.parse({ 户: { 202: 创建户节点(0) }, 现金: 12000 });
  data.户['202'].妻.当前阶段 = 5;
  data.户['202'].妻.阶段性癖 = 户静态表['202'].招牌性癖;
  for (let abs = 0; abs < 6 * 42; abs += 1) {
    if (丈夫在楼(data.户['202'], '202', abs) === '外出' && 妻位置推算('202', abs, data.户['202']) === '202') {
      data.系统._绝对时段 = abs;
      return data;
    }
  }
  assert.fail('找不到202安全独处时段');
}

test('坏结局同时关闭《分居》上架、后端购买、地点动作与201留宿', () => {
  const data = 许曼君基础档();
  data.系统._坏结局 = '审查终局';
  assert.equal(route.许曼君分居已上架(data), false);
  const before = lodash.cloneDeep(data);
  const buy = route.购买许曼君分居(data);
  assert.equal(buy.成功, false);
  assert.match(buy.提示, /结局|结束/);
  assert.deepEqual(data, before);

  data.系统._许曼君分居.阶段 = '待初谈';
  data.系统._绝对时段 = 找201独处时段(data);
  assert.deepEqual(route.许曼君分居地点动作(data, '201'), []);

  const lodging = 创建201留宿档();
  lodging.系统._坏结局 = '审查终局';
  const status = route.读取201留宿可用状态(lodging, '201');
  assert.equal(status.可执行, false);
  assert.match(status.原因, /结局|结束/);
});

test('荣耀洞属于全局强现场，不能同时启动或提交《分居》', () => {
  const data = 许曼君基础档();
  data.系统._许曼君分居.阶段 = '待初谈';
  data.系统._绝对时段 = 找201独处时段(data);
  assert.ok(route.许曼君分居地点动作(data, '201').some(item => item.id === '开始第一幕初谈'));
  data.系统._荣耀洞拍 = 0;
  assert.deepEqual(route.许曼君分居地点动作(data, '201'), []);
  const direct = route.执行许曼君分居地点动作(data, '开始第一幕初谈', '201');
  assert.equal(direct.成功, false);
  assert.match(direct.提示, /特殊|荣耀洞|现场/);

  Object.assign(data.系统._许曼君分居, { 当前场景: '第一幕初谈', 当前拍: 0 });
  const staleTicket = route.提交许曼君分居剧情事件(
    data,
    '【许曼君分居提交:第一幕初谈:1】',
    '201',
    100,
    '我在听。',
  );
  assert.equal(staleTicket?.成功, false);
  assert.match(staleTicket?.提示 ?? '', /特殊|荣耀洞|现场/);
});

test('201留宿只阻塞当前地点或活动剧情，远处普通等待票继续排队', () => {
  const remote = 创建201留宿档();
  追加等待场景剧情(remote, '【审查远处剧情】101还有一段普通预约。', '101', '101远处预约');
  const allowed = route.读取201留宿可用状态(remote, '201');
  assert.equal(allowed.可执行, true, allowed.原因);

  const local = 创建201留宿档();
  追加等待场景剧情(local, '【审查本地剧情】201还有一段待处理剧情。', '201', '201当前预约');
  const blocked = route.读取201留宿可用状态(local, '201');
  assert.equal(blocked.可执行, false);
  assert.match(blocked.原因, /剧情|事件/);
});

test('旧档已经成立的拒绝修复会保留，并只从玩家关系答复断点继续', () => {
  const old = 旧分居档('待第二次封存', {
    第二批用品已取: true,
    修复已提出: true,
    许曼君已拒绝修复: true,
    玩家事后承担: false,
  });
  const migrated = Schema.parse(old);
  const state = migrated.系统._许曼君分居;
  assert.equal(state.许曼君已拒绝恢复共同生活, true);
  assert.equal(state.阶段, '待私下决定');
  assert.equal(state.当前场景, '第四幕私下决定');
  assert.equal(state.当前拍, 1);
  assert.equal(state.玩家最终关系选择, '未决定');

  const accepted = 旧分居档('待第二次封存', {
    第二批用品已取: true,
    修复已提出: true,
    许曼君已拒绝修复: true,
    玩家事后承担: true,
  });
  const acceptedState = Schema.parse(accepted).系统._许曼君分居;
  assert.equal(acceptedState.许曼君已拒绝恢复共同生活, true);
  assert.equal(acceptedState.玩家最终关系选择, '继续关系');
  assert.equal(acceptedState.阶段, '待管理员室交接');
});

test('旧亲密进行中只有匹配当前201单人账时续接，否则安全降级为可重试', () => {
  const orphan = 旧分居档('亲密进行中', {
    绑定亲密场次标识: 'legacy-orphan',
    绑定亲密完整结果: '进行中',
  });
  const orphanState = Schema.parse(orphan).系统._许曼君分居;
  assert.equal(orphanState.共同夜晚状态, '待接受');
  assert.equal(orphanState.绑定亲密场次标识, '');
  assert.equal(orphanState.绑定亲密完整结果, '未完整');

  const resumable = 旧分居档('亲密进行中', {
    绑定亲密场次标识: 'legacy-live',
    绑定亲密完整结果: '进行中',
  });
  Object.assign(resumable.系统._性爱场景, {
    状态: '进行中',
    场次标识: 'legacy-live',
    开始楼层: 88,
    主焦点门牌: '201',
    参与者: {
      201: {
        满意度: 1,
        满意目标: 5,
        偏好命中: [],
        等级加成已用: true,
        有效楼数: 1,
        已退出: false,
      },
    },
  });
  const liveState = Schema.parse(resumable).系统._许曼君分居;
  assert.equal(liveState.共同夜晚状态, '进行中');
  assert.equal(liveState.绑定亲密场次标识, 'legacy-live');
  assert.equal(liveState.绑定亲密完整结果, '进行中');
});

test('《分居》逐幕使用精确演员闭包，并在两条正文生产链生成前与提交前复核', () => {
  assert.equal(typeof route.许曼君分居剧情演员错误, 'function');
  assert.equal(route.许曼君分居剧情演员错误('【许曼君分居提交:第一幕初谈:1】', ['201'], []), '');
  assert.equal(route.许曼君分居剧情演员错误('【许曼君分居提交:第二幕摊牌:1】', ['201'], ['201']), '');
  assert.match(route.许曼君分居剧情演员错误('【许曼君分居提交:第二幕摊牌:1】', ['101', '201'], ['201']), /演员|201|许曼君/);
  assert.match(route.许曼君分居剧情演员错误('【许曼君分居提交:共同夜晚开场:1】', ['201'], ['201']), /演员|赵国强|不在场/);

  for (const path of [
    'src/人妻公寓/脚本/游戏逻辑/回合引擎.ts',
    'src/人妻公寓/脚本/游戏逻辑/index.ts',
  ]) {
    const source = fs.readFileSync(path, 'utf8');
    assert.ok((source.match(/许曼君分居剧情演员错误/g) ?? []).length >= 3, `${path}必须导入并在生成、提交两端调用演员闭包`);
  }
});

test('《不再留门》购买、使用和安全窗口统一让已排期202丈夫登门优先', () => {
  const data = 周小满基础档();
  data.户['202'].妻._怀孕.丈夫登门.状态 = '待触发';
  data.户['202'].妻._怀孕.丈夫登门.排期绝对时段 = data.系统._绝对时段;
  assert.equal(丈夫登门需要处理(data, '202'), true);
  assert.match(nmd.不再留门购买阻断(data), /丈夫|登门/);
  assert.equal(nmd.不再留门套件可购买(data), false);

  data.背包.push('不再留门');
  const reason = nmd.不再留门动作阻断(data, '使用道具', '202');
  assert.match(reason, /丈夫|登门/);
  assert.equal(nmd.不再留门安全窗口(data, data.系统._绝对时段), null);
});

test('分居预约手机提醒由确定性通知桥消费权威状态，不反向推进路线', () => {
  const data = 许曼君基础档();
  Object.assign(data.系统._许曼君分居, {
    阶段: '待最终取物',
    钥匙位置: '管理员室201钥匙格',
    钥匙用途: '临时外住',
    封条修订: 1,
    封条完整: true,
    共同夜晚状态: '待接受',
    预约用途: '赵国强回201取物并提出修复',
    预约状态: '待到期',
    预约时段: 30,
  });
  const before = lodash.cloneDeep(data.系统._许曼君分居);
  const messages = 编译许曼君分居手机通知(data, 88, 22);
  assert.deepEqual(data.系统._许曼君分居, before);
  assert.equal(messages.length, 2);
  assert.ok(messages.some(message => message.会话 === '201' && message.发 === '对方' && /今晚回201|今晚不来/.test(message.文)));
  assert.ok(messages.some(message => message.会话 === '201' && message.发 === '系统' && /201取物预约.*第\d+天/.test(message.文) && message.时 === 22));
  assert.equal(new Set(messages.map(message => message.键)).size, messages.length);
  const source = fs.readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts', 'utf8');
  assert.match(source, /\.\.\.编译许曼君分居手机通知\(data, 楼, 时\)/);
});

test('201唯一钥匙卡由档案组件真实消费，仍只读权威状态', () => {
  const data = 许曼君基础档();
  Object.assign(data.系统._许曼君分居, {
    阶段: '独住观察中',
    钥匙位置: '管理员室201钥匙格',
    钥匙用途: '临时外住',
    封条修订: 1,
    封条完整: true,
  });
  const before = lodash.cloneDeep(data.系统._许曼君分居);
  const card = 读取许曼君201钥匙柜卡(data);
  assert.equal(card.可见, true);
  assert.equal(card.当前保管, '管理员室201钥匙格');
  assert.match(card.封条, /唯一封条完整/);
  assert.deepEqual(data.系统._许曼君分居, before);

  const source = fs.readFileSync('src/人妻公寓/界面/客户端/components/档案卡.vue', 'utf8');
  assert.match(source, /读取许曼君201钥匙柜卡/);
  assert.match(source, /选中许曼君钥匙柜/);
  assert.match(source, /201住户钥匙/);
});

test('不再使用的分居投影明确降级为兼容层，不伪装成未接通生产功能', () => {
  const decisions = [
    ['许曼君分居丈夫认知.ts', /丈夫线路风险策略\.ts/],
    ['许曼君分居结局入口.ts', /角色结局占位\.ts/],
    ['许曼君分居背包.ts', /正式背包直接读取真实背包数组/],
    ['许曼君分居资源.ts', /界面\/客户端\/assets\.ts/],
    ['许曼君分居输入桥.ts', /房内动作按钮和两条正文提交链/],
  ];
  for (const [file, owner] of decisions) {
    const source = fs.readFileSync(`src/人妻公寓/脚本/游戏逻辑/${file}`, 'utf8');
    assert.match(source, /@deprecated/, file);
    assert.match(source, owner, file);
  }
});
