/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  作息公共位置列表,
  作息门牌列表,
  六时段列表,
  妻周作息表,
  妻基础位置,
  星期列表,
  每周时段数,
  到次日早晨间隔,
  解析绝对时段,
} = require('../../src/人妻公寓/周作息.ts');

const 界面源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 合成源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts', import.meta.url), 'utf8');
const 配置源 = readFileSync(new URL('../../src/人妻公寓/stageConfig.ts', import.meta.url), 'utf8');

test('绝对时段从第1周星期一早上起步，并按六时段、七天正确换日换周', () => {
  assert.deepEqual(解析绝对时段(0), {
    绝对时段: 0,
    天数: 1,
    周数: 1,
    星期: '星期一',
    星期序号: 0,
    时段: '早上',
    时段序号: 0,
  });
  assert.equal(解析绝对时段(5).时段, '深夜');
  assert.deepEqual((({ 天数, 周数, 星期, 时段 }) => ({ 天数, 周数, 星期, 时段 }))(解析绝对时段(6)), {
    天数: 2,
    周数: 1,
    星期: '星期二',
    时段: '早上',
  });
  assert.deepEqual((({ 天数, 周数, 星期, 时段 }) => ({ 天数, 周数, 星期, 时段 }))(解析绝对时段(41)), {
    天数: 7,
    周数: 1,
    星期: '星期日',
    时段: '深夜',
  });
  assert.deepEqual((({ 天数, 周数, 星期, 时段 }) => ({ 天数, 周数, 星期, 时段 }))(解析绝对时段(42)), {
    天数: 8,
    周数: 2,
    星期: '星期一',
    时段: '早上',
  });
  assert.equal(每周时段数, 42);
  assert.deepEqual(六时段列表, ['早上', '中午', '下午', '傍晚', '晚上', '深夜']);
  assert.equal(星期列表.length, 7);
});

test('非法、负数和小数水位会被规范，睡觉始终去下一天早晨', () => {
  assert.equal(解析绝对时段(-99).绝对时段, 0);
  assert.equal(解析绝对时段(Number.NaN).绝对时段, 0);
  assert.equal(解析绝对时段(8.9).绝对时段, 8);
  assert.equal(到次日早晨间隔(0), 6, '早上睡觉也应到下一天早上');
  assert.equal(到次日早晨间隔(1), 5);
  assert.equal(到次日早晨间隔(5), 1);
  assert.equal(到次日早晨间隔(6), 6);
});

test('妻子位置每周严格复现，所有位置都来自旧位置池且深夜一定在家', () => {
  const 合法位置 = new Set([...作息门牌列表, ...作息公共位置列表]);
  for (const 门牌 of 作息门牌列表) {
    for (let 时段 = 0; 时段 < 每周时段数; 时段 += 1) {
      const 本周 = 妻基础位置(门牌, 时段);
      assert.equal(本周, 妻基础位置(门牌, 时段 + 每周时段数));
      assert.equal(本周, 妻基础位置(门牌, 时段 + 每周时段数 * 20));
      assert.equal(合法位置.has(本周), true, `${门牌}/${时段} 出现未配置地点 ${本周}`);
      if (解析绝对时段(时段).时段 === '深夜') assert.equal(本周, 门牌);
    }
  }
});

test('每户都有默认六时段表和星期覆盖，覆盖优先于默认且没有运行时随机', () => {
  for (const 门牌 of 作息门牌列表) {
    assert.deepEqual(Object.keys(妻周作息表[门牌].默认), 六时段列表);
    assert.ok(Object.keys(妻周作息表[门牌].星期覆盖).length > 0);
  }
  assert.equal(妻周作息表['101'].默认.早上, '101');
  assert.equal(妻基础位置('101', 0), '天台', '星期一覆盖应盖过101默认早上');
  assert.equal(妻基础位置('101', 1), '101', '未覆盖时段应回落到默认表');
  const 模块源 = readFileSync(new URL('../../src/人妻公寓/周作息.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(模块源, /Math\.random|seededRandom|楼层/);
});

test('界面只从系统绝对时段显示周历，妻子有效位置不再读取消息楼种子', () => {
  assert.match(界面源, /_绝对时段/);
  assert.match(界面源, /const 时间信息 = computed\([\s\S]{0,220}解析绝对时段/);
  assert.match(界面源, /第 \{\{ 天数 \}\} 天 · 第 \{\{ 周数 \}\} 周/);
  assert.match(界面源, /\{\{ 星期 \}\} · \{\{ 时段 \}\}/);
  assert.doesNotMatch(
    界面源,
    /_时段偏移楼|钟楼号|当前时段\(|当前天数\(|位置种子|Math\.floor\(Math\.max\(0,[^)]+\) \/ 18\)/,
  );
  assert.match(界面源, /const 今日 = 天数\.value - 1/);
  // A6b:零钱与地点线路候选参数随 房间动作 一并迁入 useRoomActions.ts
  assert.match(合成源, /查金币\(id, 绝对时段\.value\)/);
  assert.match(合成源, /类型: '地点',[\s\S]{0,160}楼层: 绝对时段\.value/);

  const 位置函数开始 = 界面源.indexOf('function 妻现位');
  const 位置函数结束 = 界面源.indexOf('\n}', 位置函数开始);
  const 位置函数 = 界面源.slice(位置函数开始, 位置函数结束);
  const 特殊 = 位置函数.indexOf('静音会议正式中');
  const 赴约 = 位置函数.indexOf('赴约妻');
  const 连续 = 位置函数.indexOf('粘滞在场');
  const 有效作息 = 位置函数.indexOf('妻位置推算');
  assert.ok(
    特殊 >= 0 && 特殊 < 赴约 && 赴约 < 连续 && 连续 < 有效作息,
    '覆盖优先级应为特殊场景→赴约→连续场景→阶段预约/基础作息',
  );
});

test('管理员室房卡只保留小憩和睡眠，全局推进事件携带防双击预期水位', () => {
  // A6b:房卡动作已迁入 useRoomActions.ts，事件/水位仍在 App
  const 管理员室开始 = 合成源.indexOf("if (id === '管理员室')");
  const 管理员室段 = 合成源.slice(管理员室开始, 合成源.indexOf('// 公共区', 管理员室开始));
  assert.match(管理员室段, /文案: '小憩（推进一时段）'[\s\S]{0,120}发起时间推进\('小憩'\)/);
  assert.match(管理员室段, /文案: '睡到次日早晨'[\s\S]{0,120}发起时间推进\('睡到次日早晨'\)/);
  assert.doesNotMatch(管理员室段, /文案: '推进一时段'|发起时间推进\('推进一时段'\)/);
  assert.match(
    界面源,
    /function 发起时间推进[\s\S]{0,700}const 事件名 =[\s\S]{0,500}人妻公寓:睡到次日早晨'[\s\S]{0,500}人妻公寓:推进时段'[\s\S]{0,180}eventEmit\(事件名,[\s\S]{0,120}预期绝对时段: 绝对时段\.value/,
  );
  assert.doesNotMatch(界面源, /_上次杀时间楼层|人妻公寓:杀时间|看会儿电视|眯一觉/);
});

test('旧钟楼制世界时间常量已按向上取整换成绝对时段单位', () => {
  assert.match(配置源, /荣耀洞冷却时段 = 6/);
  assert.match(配置源, /收租周期时段: 9/);
  assert.match(配置源, /要钱冷却时段: 4/);
  assert.match(配置源, /金币刷新时段: 2/);
  assert.match(配置源, /偷窃同户冷却时段: 8/);
  assert.match(配置源, /钓鱼冻结时段: 4/);
  assert.match(配置源, /夜班外出时段: 3/);
  assert.match(配置源, /出差外出时段: 12/);
  assert.match(配置源, /出差每户冷却时段: 12/);
  assert.doesNotMatch(
    配置源,
    /荣耀洞冷却楼|要钱冷却楼|金币刷新楼|偷窃同户冷却楼|钓鱼冻结楼|夜班外出楼|出差外出楼|出差每户冷却楼/,
  );
});
