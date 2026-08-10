/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.getLastMessageId = () => 0;
globalThis.updateVariablesWith = updater => updater({});
globalThis.Mvu = {
  replaceMvuData: async () => undefined,
};

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 脚本写入 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const { 推进荣耀洞隔离拍, 荣耀洞总拍 } = require('../../src/人妻公寓/脚本/游戏逻辑/荣耀洞.ts');

function 建数据() {
  const data = Schema.parse({ 户: { 101: 创建户节点(5) }, 系统: { _绝对时段: 5 } });
  // 冷落从阶段2参与：资格外（阶段1）只校准成长账、不记成长轮次，脚本刷新用例必须用合格妻。
  data.户['101'].妻.当前阶段 = 2;
  data.户['101'].妻._成长账 = { 上次有效成长钟楼: 5, 成长轮次: 0, 已结算冷落日: 0 };
  return data;
}

test('脚本数值成长与MVU写回原子刷新成长账', async () => {
  const 旧data = 建数据();
  const data = lodash.cloneDeep(旧data);
  data.户['101'].妻.好感值 += 1;
  data.系统._绝对时段 = 20;
  const raw = { stat_data: lodash.cloneDeep(旧data) };

  await 脚本写入(raw, data);

  assert.equal(data.户['101'].妻._成长账.上次有效成长钟楼, 20);
  assert.equal(data.户['101'].妻._成长账.成长轮次, 1);
  assert.equal(raw.stat_data, data);
});

test('纯机制或手机式写入不刷新成长账', async () => {
  const 旧data = 建数据();
  const data = lodash.cloneDeep(旧data);
  data.户['101'].妻.当前情绪 = '刚看见一条微信';
  data.系统._绝对时段 = 20;

  await 脚本写入({ stat_data: lodash.cloneDeep(旧data) }, data);

  assert.deepEqual(data.户['101'].妻._成长账, 旧data.户['101'].妻._成长账);
});

test('被阶段上限截住的合法正候选仍能通过脚本写入刷新成长账', async () => {
  const 旧data = 建数据();
  const data = lodash.cloneDeep(旧data);
  data.系统._绝对时段 = 20;

  await 脚本写入({ stat_data: lodash.cloneDeep(旧data) }, data, {
    合法正候选: { 101: ['好感值'] },
  });

  assert.equal(data.户['101'].妻._成长账.上次有效成长钟楼, 20);
  assert.equal(data.户['101'].妻._成长账.成长轮次, 1);
});

test('荣耀洞封顶奖励无需调用者手工传候选也会刷新成长账', async () => {
  const 旧data = 建数据();
  旧data.户['101'].妻.好感值 = 100;
  旧data.户['101'].妻.堕落值 = 100;
  旧data.系统._荣耀洞门牌 = '101';
  旧data.系统._荣耀洞拍 = 荣耀洞总拍('101') - 1;
  旧data.系统._荣耀洞起时段 = 19;
  const data = lodash.cloneDeep(旧data);

  推进荣耀洞隔离拍(data);
  await 脚本写入({ stat_data: lodash.cloneDeep(旧data) }, data, { 当前绝对时段: 20 });

  assert.equal(data.户['101'].妻.好感值, 100);
  assert.equal(data.户['101'].妻.堕落值, 100);
  assert.equal(data.户['101'].妻._成长账.上次有效成长钟楼, 20);
  assert.equal(data.户['101'].妻._成长账.成长轮次, 1);
});

test('余波期间脚本写入也冻结堕落，但允许其他成长轴刷新', async () => {
  const 旧data = 建数据();
  旧data.户['101'].妻.堕落值 = 20;
  旧data.户['101'].妻._冷落余波 = {
    状态: '安抚中',
    触发钟楼: 6,
    需安抚楼: 6,
    已安抚楼: 1,
    上次安抚正文楼: 19,
  };
  const data = lodash.cloneDeep(旧data);
  data.户['101'].妻.堕落值 = 23;
  data.户['101'].妻.身体开发.胸部 += 1;
  data.系统._绝对时段 = 20;

  await 脚本写入({ stat_data: lodash.cloneDeep(旧data) }, data);

  assert.equal(data.户['101'].妻.堕落值, 20);
  assert.equal(data.户['101'].妻._成长账.上次有效成长钟楼, 20);
  assert.equal(data.户['101'].妻._成长账.成长轮次, 1);
});
