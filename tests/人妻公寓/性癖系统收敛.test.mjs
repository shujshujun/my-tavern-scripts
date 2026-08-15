/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
globalThis.SillyTavern = { chat: [{}] };

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

// 商店模块的送礼支路才需要数据库；本组只验证货架和购买门。
const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const { Schema, 创建户节点, 迁移MVU存档到当前版本 } = require('../../src/人妻公寓/schema.ts');
const { 性癖表, 查性癖, 户静态表, 门牌列表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 购买, 取货架 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const {
  准备开启阶段性癖,
  提交阶段性癖开幕,
  解析阶段性癖开幕事件,
} = require('../../src/人妻公寓/脚本/游戏逻辑/性癖系统.ts');
const { 读取阶段性癖状态 } = require('../../src/人妻公寓/脚本/游戏逻辑/阶段性癖状态.ts');
const { 事件必须有正文, 本轮事件可提交, 选择本轮事件 } = require('../../src/人妻公寓/脚本/游戏逻辑/入住触发门.ts');

const 六主题 = {
  101: '孕欲',
  102: '视奸欲',
  201: '交易快感',
  202: '独占印记',
  301: '镜头高潮',
  302: '哺育癖',
};
const 旧通用性癖 = [
  '露出癖',
  '淫语解禁',
  '拍摄癖',
  '受虐渴望',
  '口奴体质',
  '后穴开发',
  '潮喷体质',
  '阿黑颜',
  '中出执念',
  '隐奸癖',
  '物化认知',
  '窒息快感',
  '尿饮嗜好',
  '舔肛嗜好',
  '寝取展示',
];

function 建数据(...门牌们) {
  return Schema.parse({ 户: Object.fromEntries(门牌们.map(门牌 => [门牌, 创建户节点(0)])) });
}

function 设开幕窗口(data, 门牌) {
  const 节点 = 门牌 === '302' ? 1 : 0;
  const 妻 = data.户[门牌].妻;
  妻.当前阶段 = 4;
  妻._阶段线路 = {
    目标阶段: 5,
    完成位图: (1 << 节点) - 1,
    活跃节点: 节点,
    节点起始楼: 0,
    预约星期: '',
    预约时段: '',
    预约地点: '',
    预约绝对时段: -1,
    预约丈夫状态: '',
  };
}

test('配置只保留六个角色专属阶段主题，旧通用池彻底下线', () => {
  assert.deepEqual(Object.keys(性癖表), Object.values(六主题));
  for (const id of 旧通用性癖) assert.equal(查性癖(id), undefined, `${id} 不应继续注册`);
  for (const [门牌, id] of Object.entries(六主题)) assert.deepEqual(性癖表[id].限定户, [门牌]);
});

test('商店点击只准备强剧情票；有效正文提交后才扣款、推进线路并永久登记', () => {
  const data = 建数据('101');
  设开幕窗口(data, '101');
  data.现金 = 1200;
  const 点击前 = structuredClone(data);

  const 结果 = 购买(data, '孕欲');
  assert.equal(结果.成功, true);
  assert.match(结果.事件 ?? '', /【阶段性癖票:101:孕欲】/);
  assert.match(结果.事件 ?? '', /【性癖开幕·孕欲】/);
  assert.deepEqual(data, 点击前, '准备、失败、取消都不能预扣款或提前写永久状态');

  const 提交 = 提交阶段性癖开幕(data, 结果.事件, 88);
  assert.equal(提交.成功, true);
  assert.equal(data.现金, 300);
  assert.equal(data.户['101'].妻.阶段性癖, '孕欲');
  assert.equal(data.户['101'].妻._阶段线路.活跃节点, 1);

  const 重复 = 提交阶段性癖开幕(data, 结果.事件, 88);
  assert.equal(重复.成功, true);
  assert.equal(data.现金, 300, '同一票据重复观察不得再次扣款');
  assert.equal(data.户['101'].妻._阶段线路.活跃节点, 1, '同一票据不得重复推进线路');
});

test('阶段主题开幕票必须有正文：空响应与纯标签冻结票不可提交，有效正文才可消费', () => {
  const data = 建数据('101');
  设开幕窗口(data, '101');
  data.现金 = 1200;
  const 新票 = 准备开启阶段性癖(data, '101').事件;
  const 旧票 = `【性癖开幕·孕欲】对象:${户静态表['101'].妻名}。`;

  // 新机器票据与仍受支持的旧“名称+对象”格式都要求正文。
  assert.equal(事件必须有正文(新票), true);
  assert.equal(事件必须有正文(旧票), true);
  // 已下线、未知、门牌与招牌性癖不符的残留/伪造票也要求正文（结构化标记判定），
  // 但不能因此获得提交资格——结算资格只归 `解析阶段性癖开幕事件` 校验。
  assert.equal(事件必须有正文(`【性癖开幕·露出癖】对象:${户静态表['101'].妻名}。`), true, '已下线旧开幕标记仍要求正文');
  assert.equal(事件必须有正文(`【性癖开幕·不存在的东西】对象:${户静态表['101'].妻名}。`), true, '未知开幕标记仍要求正文');
  assert.equal(事件必须有正文('【阶段性癖票:101:哺育癖】'), true, '门牌与招牌性癖不符的伪造票仍要求正文');
  // 既有确定性剧情与普通软事件语义不变。
  assert.equal(事件必须有正文('【转折正戏】正文'), true);
  assert.equal(事件必须有正文('【药物首夜】正文'), true);
  assert.equal(事件必须有正文('普通软事件正文'), false);

  // 冻结票：有效正文=false 不可提交（不扣款、不写永久状态、不推进线路），true 才可提交。
  const 冻结 = 选择本轮事件({ 楼层: 88, 已注入: { 楼层: -1, 内容: '' }, 待发送: 新票, 入住场景可用: false });
  assert.equal(本轮事件可提交(冻结, 新票, 88, false), false, '阶段主题开幕空正文不得消费');
  assert.equal(本轮事件可提交(冻结, 新票, 88, true), true);

  // 队列变化、楼层变化、重放来源仍不可提交。
  assert.equal(本轮事件可提交(冻结, 旧票, 88, true), false, 'prompt 后队列变化不得误消费');
  assert.equal(本轮事件可提交(冻结, 新票, 87, true), false, '楼层变化不得误消费');
  const 重放 = 选择本轮事件({ 楼层: 88, 已注入: { 楼层: 88, 内容: 新票 }, 待发送: 新票, 入住场景可用: false });
  assert.equal(本轮事件可提交(重放, 新票, 88, true), false, '同文案重放也不能消费');
});

test('要求正文不等于获得提交资格：未知、已下线、伪造票解析为 null、提交失败且数据不变', () => {
  const data = 建数据('101');
  设开幕窗口(data, '101');
  data.现金 = 1200;

  const 已下线票 = `【性癖开幕·露出癖】对象:${户静态表['101'].妻名}。`;
  const 未知票 = `【性癖开幕·不存在的东西】对象:${户静态表['101'].妻名}。`;
  const 伪造票 = '【阶段性癖票:101:哺育癖】';

  for (const 票 of [已下线票, 未知票, 伪造票]) {
    // 结构标记下它们照样要求正文，但结算资格一律为 null / 提交失败。
    assert.equal(事件必须有正文(票), true, `${票} 仍要求正文`);
    assert.equal(解析阶段性癖开幕事件(票), null, `${票} 不得被解析成可结算票`);
    const 提交前 = structuredClone(data);
    const 提交 = 提交阶段性癖开幕(data, 票, 88);
    assert.equal(提交.成功, false, `${票} 提交必须失败`);
    assert.deepEqual(data, 提交前, '失败提交不得改动现金、永久性癖或线路节点');
  }
});

test('已支付未完成资格不重复扣钱；母亲主题始终走剧情获得', () => {
  const 已支付 = 建数据('102');
  设开幕窗口(已支付, '102');
  已支付.现金 = 0;
  已支付.户['102'].妻._阶段性癖已支付 = true;
  assert.equal(读取阶段性癖状态(已支付, '102').状态, '已支付可开启');
  const 旧票 = `【性癖开幕·视奸欲】对象:${户静态表['102'].妻名}。`;
  assert.deepEqual(解析阶段性癖开幕事件(旧票), { 门牌: '102', id: '视奸欲', 旧格式: true });
  assert.equal(提交阶段性癖开幕(已支付, 旧票, 9).成功, true);
  assert.equal(已支付.现金, 0);
  assert.equal(已支付.户['102'].妻._阶段性癖已支付, false);

  const 母亲 = 建数据('302');
  设开幕窗口(母亲, '302');
  母亲.现金 = 0;
  assert.equal(读取阶段性癖状态(母亲, '302').状态, '剧情获得');
  const 准备 = 准备开启阶段性癖(母亲, '302');
  assert.equal(准备.成功, true);
  assert.equal(提交阶段性癖开幕(母亲, 准备.事件, 10).成功, true);
  assert.equal(母亲.现金, 0);
  assert.equal(母亲.户['302'].妻.阶段性癖, '哺育癖');
});

test('住院中的开幕失败必须全量零副作用，不能借其他角色的特殊场景补记伪装成目标提交成功', () => {
  const data = 建数据('101', '201');
  设开幕窗口(data, '101');
  data.现金 = 1200;
  data.户['101'].妻._生产.状态 = '待产';

  // 201 正停在“肉偿账本”特殊场景节点，宽入口会顺手补记它；这不能成为 101 开幕成功的证据。
  data.户['201'].妻.当前阶段 = 4;
  data.户['201'].妻._阶段线路 = {
    目标阶段: 5,
    完成位图: 1,
    活跃节点: 1,
    节点起始楼: 0,
    预约星期: '',
    预约时段: '',
    预约地点: '',
    预约绝对时段: -1,
    预约丈夫状态: '',
  };
  data.系统._已完成特殊场景.push('肉偿账本');
  const 提交前 = structuredClone(data);

  const 准备 = 准备开启阶段性癖(data, '101');
  assert.equal(准备.成功, false, '住院硬锁期间不应生成开幕正文');
  assert.deepEqual(data, 提交前);

  // 旧队列里可能仍留有冻结票；直接提交也必须失败且不补记 201、不扣 101 的钱。
  const 旧冻结票 = '【阶段性癖票:101:孕欲】【性癖开幕·孕欲】对象:夏乔。';
  const 提交 = 提交阶段性癖开幕(data, 旧冻结票, 88);
  assert.equal(提交.成功, false);
  assert.deepEqual(data, 提交前);
});

test('v8 迁移不退款：删旧物、按线路真值认定完成，并保留未完成专属的已支付资格', () => {
  const raw = structuredClone(建数据('101', '102'));
  raw.系统._数据版本 = 8;
  raw.现金 = 3456;
  raw.背包 = ['普通道具', '露出癖', '孕欲'];
  raw.户['101'].妻.性癖装载 = ['孕欲', '露出癖'];
  raw.户['101'].妻.曾开发性癖 = ['孕欲'];
  raw.户['101'].妻.当前阶段 = 4;
  raw.户['101'].妻._阶段线路 = { 目标阶段: 5, 完成位图: 0, 活跃节点: 0, 节点起始楼: 0 };
  raw.户['102'].妻.当前阶段 = 4;
  raw.户['102'].妻._阶段线路 = { 目标阶段: 5, 完成位图: 1, 活跃节点: 1, 节点起始楼: 0 };

  const migrated = 迁移MVU存档到当前版本(raw);
  const data = Schema.parse(migrated);
  assert.equal(data.现金, 3456, '移除旧系统不向玩家退款');
  assert.deepEqual(data.背包, ['普通道具']);
  assert.equal(data.户['101'].妻.阶段性癖, '', '旧数组不能冒充有效正文完成');
  assert.equal(data.户['101'].妻._阶段性癖已支付, true, '旧专属购买证据只转成免重复扣款资格');
  assert.equal(data.户['102'].妻.阶段性癖, '视奸欲', '阶段线路已经成功才认作永久完成');
  assert.equal(data.户['102'].妻._阶段性癖已支付, false);
  assert.equal(Object.hasOwn(data.户['101'].妻, '性癖装载'), false);
  assert.equal(Object.hasOwn(data.户['101'].妻, '曾开发性癖'), false);
});

test('删除的旧通用 pending 可正常演完但不生成永久状态，六主题全完成后商店页消失', () => {
  assert.equal(解析阶段性癖开幕事件(`【性癖开幕·露出癖】对象:${户静态表['101'].妻名}。`), null);

  const data = 建数据(...门牌列表);
  for (const [门牌, id] of Object.entries(六主题)) {
    data.户[门牌].妻.当前阶段 = 5;
    data.户[门牌].妻.阶段性癖 = id;
  }
  assert.equal(
    取货架(data).some(页 => 页.页签 === '性癖'),
    false,
  );
});

test('客户端不再保留背包装载、档案卸载与每回合性癖提示注入', () => {
  const App = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
  const 背包 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/背包.vue', import.meta.url), 'utf8');
  const 档案 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url), 'utf8');
  const 快照 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts', import.meta.url), 'utf8');
  const 全部源码 = App + 背包 + 档案 + 快照;
  assert.doesNotMatch(全部源码, /性癖装载|曾开发性癖|装载性癖|卸载性癖|性癖\(生效中\)/);
  assert.match(档案, /阶 段 性 癖/);
  assert.match(App, /开启「哺育主题」剧情|开启阶段性癖/);
});
