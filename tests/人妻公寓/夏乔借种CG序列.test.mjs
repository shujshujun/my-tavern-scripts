import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
globalThis._ = require('lodash');
globalThis.getVariables = () => ({});
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 选择借种CG序列 } = require('../../src/人妻公寓/界面/客户端/借种CG序列.ts');

function 建数据() {
  const 节点 = 创建户节点(0);
  节点.妻.当前阶段 = 5;
  return Schema.parse({ 户: { 101: 节点 }, 系统: { _序章完成: true } });
}

function 信号(亲密) {
  return {
    门牌: '101',
    行为等级: 4,
    正文: '',
    行动: '',
    事件: '',
    楼层: 10,
    variant: 'normal',
    亲密,
  };
}

test('借种亲密场景按结构化阶段使用专属本地序列，不进入普通随机图库', () => {
  const data = 建数据();
  data.系统._特殊场景.id = '借种';
  data.系统._性爱场景.场次标识 = '借种结局:101:10:1';

  assert.deepEqual(
    选择借种CG序列(
      data,
      信号({ 状态: '进行中', 主焦点门牌: '101', 当前行为: '无插入', 当前接触部位: '无', 结束方式: '', 最终位置: '', 本楼开始: true }),
    ).帧.map(帧 => 帧.文件),
    ['借种_成人_正式入室'],
  );
  assert.deepEqual(
    选择借种CG序列(
      data,
      信号({ 状态: '进行中', 主焦点门牌: '101', 当前行为: '口交', 当前接触部位: '嘴', 结束方式: '', 最终位置: '' }),
    ),
    { 接管: false, 帧: [] },
    '专属胸前前戏图不能冒充口交，应交回通用口交图库',
  );
  assert.deepEqual(
    选择借种CG序列(
      data,
      信号({ 状态: '进行中', 主焦点门牌: '101', 当前行为: '阴道插入', 当前接触部位: '小屄', 结束方式: '', 最终位置: '' }),
    ).帧.map(帧 => 帧.文件),
    ['借种_成人_正面交合'],
  );
});

test('确定受孕收尾必须依次给出有效收尾、事后照料与回到客厅三帧', () => {
  const data = 建数据();
  data.系统._已完成特殊场景.push('借种');
  Object.assign(data.系统._上次性爱结果, {
    场次标识: '借种结局:101:10:1',
    结束方式: '主动收尾',
    最终位置: '小屄',
    收尾对象门牌: '101',
    保护状态: '未使用',
    当前行为: '阴道插入',
  });
  const result = 选择借种CG序列(
    data,
    信号({
      状态: '已结束',
      主焦点门牌: '101',
      当前行为: '阴道插入',
      当前接触部位: '小屄',
      结束方式: '主动收尾',
      最终位置: '小屄',
    }),
  );
  assert.equal(result.接管, true);
  assert.deepEqual(result.帧.map(帧 => 帧.文件), [
    '借种_成人_确定受孕收尾',
    '借种_成人_事后照料',
    '借种_成人_回到客厅',
  ]);
});

test('普通夏乔亲密信号不被借种序列接管，即使上一场刚完成借种', () => {
  const data = 建数据();
  data.系统._性爱场景.场次标识 = '普通:101:10';
  data.系统._上次性爱结果.场次标识 = '借种结局:101:旧场';
  const result = 选择借种CG序列(
    data,
    信号({ 状态: '进行中', 主焦点门牌: '101', 当前行为: '阴道插入', 当前接触部位: '小屄', 结束方式: '', 最终位置: '' }),
  );
  assert.deepEqual(result, { 接管: false, 帧: [] });
});

test('借种中的肛交与玩具不使用阴道或泛前戏专属图', () => {
  const data = 建数据();
  data.系统._特殊场景.id = '借种';
  data.系统._性爱场景.场次标识 = '借种结局:101:10:1';
  for (const 亲密 of [
    { 状态: '进行中', 主焦点门牌: '101', 当前行为: '肛门插入', 当前接触部位: '屁穴', 结束方式: '', 最终位置: '' },
    { 状态: '进行中', 主焦点门牌: '101', 当前行为: '玩具', 当前接触部位: '小屄', 结束方式: '', 最终位置: '' },
  ]) {
    assert.deepEqual(选择借种CG序列(data, 信号(亲密)), { 接管: false, 帧: [] });
  }
});

test('借种失败收尾不能播放确定受孕三连图', () => {
  const data = 建数据();
  Object.assign(data.系统._上次性爱结果, {
    场次标识: '借种结局:101:10:1',
    结束方式: '主动收尾',
    最终位置: '小嘴',
    收尾对象门牌: '101',
    保护状态: '未使用',
    当前行为: '口交',
  });
  const result = 选择借种CG序列(
    data,
    信号({
      状态: '已结束',
      主焦点门牌: '101',
      当前行为: '口交',
      当前接触部位: '嘴',
      结束方式: '主动收尾',
      最终位置: '小嘴',
    }),
  );
  assert.deepEqual(result, { 接管: false, 帧: [] });
});
