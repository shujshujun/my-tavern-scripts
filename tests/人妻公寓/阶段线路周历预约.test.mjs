/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.getVariables = () => ({ _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null });

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  构造阶段线路剧情事件,
  列出阶段线路候选详情,
  刷新阶段预约,
  读取阶段线路审计矩阵,
  读取关系线索,
} = require('../../src/人妻公寓/脚本/游戏逻辑/阶段线路系统.ts');
const { 丈夫在楼, 妻位置推算 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 妻基础位置, 六时段列表, 星期列表 } = require('../../src/人妻公寓/周作息.ts');

function 建线路数据(门牌, 当前阶段, 活跃节点, 绝对时段 = 0) {
  const data = Schema.parse({
    户: { [门牌]: 创建户节点(0) },
    系统: { _绝对时段: 绝对时段 },
  });
  const 妻 = data.户[门牌].妻;
  妻.当前阶段 = 当前阶段;
  妻._阶段线路 = {
    目标阶段: 当前阶段 + 1,
    完成位图: (1 << 活跃节点) - 1,
    活跃节点,
    节点起始楼: 绝对时段,
    预约星期: '',
    预约时段: '',
    预约地点: '',
    预约绝对时段: -1,
    预约丈夫状态: '',
  };
  刷新阶段预约(data, 门牌);
  return data;
}

test('阶段地点任务投影为精确的星期、时段和地点', () => {
  const 夏乔大堂 = 建线路数据('101', 1, 2);
  assert.deepEqual(
    lodash.pick(夏乔大堂.户['101'].妻._阶段线路, ['预约星期', '预约时段', '预约地点', '预约绝对时段']),
    { 预约星期: '星期二', 预约时段: '下午', 预约地点: '大堂', 预约绝对时段: 8 },
  );

  const 夏乔天台 = 建线路数据('101', 1, 3);
  assert.deepEqual(
    lodash.pick(夏乔天台.户['101'].妻._阶段线路, ['预约星期', '预约时段', '预约地点', '预约绝对时段']),
    { 预约星期: '星期三', 预约时段: '晚上', 预约地点: '天台', 预约绝对时段: 16 },
  );
  assert.equal(读取关系线索(夏乔天台, '101').预约, '星期三晚上 · 天台');
});

test('基础作息优先成立，任务预约在指定周历窗口提供受控强制到场保险', () => {
  const data = 建线路数据('201', 1, 3);
  const 节点 = data.户['201'];

  assert.equal(妻基础位置('201', 22), '201', '基础作息本来不会去管理员室');
  assert.equal(妻位置推算('201', 21, 节点), '201', '预约前一时段仍走基础作息');
  assert.equal(妻位置推算('201', 22, 节点), '管理员室', '星期四晚上由任务预约覆盖到场');
  assert.equal(妻位置推算('201', 64, 节点), '管理员室', '错过后在下一周同一窗口重新开放');
});

test('地图候选与后端签票共用预约真值，错日错时不能靠旧按钮召唤', () => {
  const data = 建线路数据('101', 1, 3);
  const 事件 = { 类型: '地点', 门牌: '101', 地点: '天台', 预期目标阶段: 2, 预期节点: 3 };

  data.系统._绝对时段 = 15;
  assert.deepEqual(列出阶段线路候选详情(data, 事件), []);
  assert.equal(构造阶段线路剧情事件(data, 事件).成功, false);

  data.系统._绝对时段 = 16;
  assert.equal(列出阶段线路候选详情(data, 事件).length, 1);
  const 准备 = 构造阶段线路剧情事件(data, 事件);
  assert.equal(准备.成功, true);
  assert.match(准备.事件, /【事件在场妻:101】/);
  assert.match(准备.事件, /星期三/);
  assert.match(准备.事件, /天台/);
});

test('私密阶段预约同时投影丈夫状态，快照统一口不会把丈夫留在同一现场', () => {
  const data = 建线路数据('201', 2, 2);
  const 节点 = data.户['201'];
  const 预约 = 节点.妻._阶段线路;
  data.系统._绝对时段 = 预约.预约绝对时段;

  assert.equal(预约.预约丈夫状态, '外出');
  assert.equal(妻位置推算('201', data.系统._绝对时段, 节点), '管理员室');
  assert.equal(丈夫在楼(节点, '201', data.系统._绝对时段), '外出');
});

test('96个阶段节点都有结构化落地定义，所有地点节点都有周历预约', () => {
  const 矩阵 = 读取阶段线路审计矩阵();
  assert.equal(矩阵.length, 96);
  assert.equal(new Set(矩阵.map(x => `${x.门牌}-${x.目标阶段}-${x.节点}`)).size, 96);

  const 地点节点 = 矩阵.filter(x => x.事件类型.includes('地点'));
  assert.equal(地点节点.length, 40);
  for (const 节点 of 地点节点) {
    assert.ok(节点.预约, `${节点.门牌}-P${节点.目标阶段}-N${节点.节点 + 1} 缺少预约`);
    assert.ok(节点.预约.星期);
    assert.ok(节点.预约.时段);
    assert.ok(节点.预约.地点);
  }

  const 基础作息不重合 = 地点节点.filter(节点 => {
    const 星期序号 = 星期列表.indexOf(节点.预约.星期);
    const 时段序号 = 六时段列表.indexOf(节点.预约.时段);
    return 妻基础位置(节点.门牌, 星期序号 * 6 + 时段序号) !== 节点.预约.地点;
  });
  assert.equal(地点节点.length - 基础作息不重合.length, 34, '绝大多数任务应自然落在角色基础周作息');
  assert.ok(
    基础作息不重合.every(节点 => 节点.预约.地点 === '管理员室'),
    '基础作息外的例外只能是角色按任务约定前往玩家的管理员室',
  );
});
