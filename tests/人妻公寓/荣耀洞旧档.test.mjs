/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 荣耀洞表 } = require('../../src/人妻公寓/stageConfig.ts');
const { seededRandom } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 使用荣耀洞, 规范荣耀洞上次时段, 同一荣耀洞拍仍保留 } = require('../../src/人妻公寓/脚本/游戏逻辑/荣耀洞.ts');
const 界面源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

test('荣耀洞冷却起点会清理所有负值、非有限值和未来绝对时段戳', () => {
  assert.equal(规范荣耀洞上次时段(-1, 0), -999);
  assert.equal(规范荣耀洞上次时段(Number.NaN, 10), -999);
  assert.equal(规范荣耀洞上次时段(11, 10), -999);
  assert.equal(规范荣耀洞上次时段(0, 17), 0);
  assert.equal(规范荣耀洞上次时段(0, 18), 0);
});

test('负值哨兵代表从未使用，绝对时段 0 不应被误判为冷却中', () => {
  const data = Schema.parse({
    系统: {
      _荣耀洞上次时段: -1,
    },
  });

  const result = 使用荣耀洞(data, 0);

  assert.equal(result.变动, true);
  assert.doesNotMatch(result.提示, /今天已经用过/);
  assert.equal(data.系统._荣耀洞上次时段, 0);
});

test('医院硬锁中的妻子不得进入荣耀洞签筒', () => {
  const 时段 = Array.from({ length: 500 }, (_, index) => index).find(
    value => seededRandom(value, '101', '荣耀洞') < 荣耀洞表['101'].几率,
  );
  assert.notEqual(时段, undefined, '测试窗口内必须存在 101 原本会命中的稳定时段');
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 5;
  节点.妻._生产.状态 = '住院中';
  const data = Schema.parse({ 户: { 101: 节点 }, 系统: { _绝对时段: 时段 } });

  const result = 使用荣耀洞(data, 时段);

  assert.equal(result.变动, true);
  assert.equal(data.系统._荣耀洞门牌, '空', '住院角色不能被传送到公共洗手间参加成人特殊场景');
});

test('荣耀洞界面与业务端共用同一时段水位归一函数', () => {
  assert.match(界面源, /import \{ 规范荣耀洞上次时段 \} from ['"]\.\.\/\.\.\/脚本\/游戏逻辑\/荣耀洞['"]/);
  assert.match(界面源, /const 记 = 规范荣耀洞上次时段\(系\._荣耀洞上次时段, 绝对时段\.value\)/);
});

test('荣耀洞空签生成失败后仍开放输入，允许重试同一空签而不重抽', () => {
  const 输入门起 = 界面源.indexOf('const 可输入 = computed');
  const 输入门止 = 界面源.indexOf("if (id === '302'", 输入门起);
  assert.ok(输入门起 >= 0 && 输入门止 > 输入门起, '必须找到荣耀洞输入门');
  const 输入门 = 界面源.slice(输入门起, 输入门止);
  assert.match(输入门, /_荣耀洞拍 \?\? -1\) >= 0/, '只要荣耀洞仍在当前拍就必须允许输入重试');
  assert.doesNotMatch(输入门, /_荣耀洞门牌 !== '空'/, '空签失败不能关闭唯一重试入口');
});

test('失败重试只认当前持久层仍是同一场同一拍的荣耀洞', () => {
  const 基准 = Schema.parse({
    系统: {
      _荣耀洞门牌: '101',
      _荣耀洞拍: 2,
      _荣耀洞起时段: 18,
      _荣耀洞点破: true,
      _荣耀洞夫: true,
    },
  });
  assert.equal(同一荣耀洞拍仍保留(structuredClone(基准), 基准), true, '补偿回本拍后允许提示重试');

  for (const [字段, 值] of [
    ['_荣耀洞拍', -1],
    ['_荣耀洞拍', 3],
    ['_荣耀洞起时段', 24],
    ['_荣耀洞门牌', '102'],
    ['_荣耀洞点破', false],
    ['_荣耀洞夫', false],
  ]) {
    const 当前 = structuredClone(基准);
    当前.系统[字段] = 值;
    assert.equal(同一荣耀洞拍仍保留(当前, 基准), false, `${字段} 已变化时不得声称原拍仍保留`);
  }
  assert.equal(同一荣耀洞拍仍保留(null, 基准), false, '持久状态不可读时失败关闭');
});
