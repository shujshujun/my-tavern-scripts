/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let 聊天变量 = {};
globalThis.getVariables = () => 聊天变量;

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  检测焦点,
  规划快照刷新,
  提交快照刷新,
  组公寓快照,
} = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 构造AI可写变量范围, 构造AI可写变量视图 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');

function 建亲密数据() {
  const data = Schema.parse({ 户: { 101: 创建户节点(4), 102: 创建户节点(4), 201: 创建户节点(4) } });
  data.系统._性爱场景 = {
    状态: '进行中',
    场次标识: 'prompt-cadence',
    开始楼层: 8,
    有效楼数: 1,
    本场等级加成: 0,
    当前接触部位: '小屄',
    当前行为: '阴道插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '101',
    参与者: {
      101: { 满意度: 1, 满意目标: 3, 偏好命中: [], 等级加成已用: false },
      102: { 满意度: 1, 满意目标: 3, 偏好命中: [], 等级加成已用: false },
    },
  };
  聊天变量 = {
    _场景: { 房间id: '管理员室', 进房末楼: 8 },
    _粘滞: { 位置: '管理员室', 楼: 8, 们: ['101', '102'], 夫们: [] },
  };
  return data;
}

test('提示节拍按成功提交执行完整、最小、最小、完整', () => {
  const data = 建亲密数据();
  const chat = [{ role: 'user', content: '继续当前安排。' }];

  const 生成一次 = () => {
    const 人物 = 检测焦点(chat, data, 10, '');
    const 票 = 规划快照刷新(data, '', 人物);
    const 快照 = 组公寓快照(chat, data, 10, '', 人物, 票);
    return { 票, 快照 };
  };

  let 本轮 = 生成一次();
  assert.equal(本轮.票.模式, '完整');
  assert.match(本轮.快照, /【角色成人表现·夏乔】/);
  提交快照刷新(data, 本轮.票);

  本轮 = 生成一次();
  assert.equal(本轮.票.模式, '最小');
  assert.doesNotMatch(本轮.快照, /【角色成人表现·夏乔】/);
  assert.match(本轮.快照, /【亲密持续】/);
  assert.match(本轮.快照, /【夏乔的界线】/);
  assert.match(本轮.快照, /【尺度判定·详】/);
  提交快照刷新(data, 本轮.票);

  本轮 = 生成一次();
  assert.equal(本轮.票.模式, '最小');
  提交快照刷新(data, 本轮.票);

  本轮 = 生成一次();
  assert.equal(本轮.票.模式, '完整');
  assert.match(本轮.票.原因, /三楼刷新/);
});

test('只规划而未成功提交时不推进节拍', () => {
  const data = 建亲密数据();
  const chat = [{ role: 'user', content: '继续。' }];
  const 提交前 = structuredClone(data.系统._提示刷新态);
  const 人物 = 检测焦点(chat, data, 10, '');

  const 失败轮票 = 规划快照刷新(data, '', 人物);
  assert.equal(失败轮票.模式, '完整');
  assert.deepEqual(data.系统._提示刷新态, 提交前);

  const 重试票 = 规划快照刷新(data, '', 人物);
  assert.equal(重试票.模式, '完整');
  assert.deepEqual(重试票.下一态, 失败轮票.下一态);
});

test('亲密行为、接触部位与保护状态变化会即时刷新完整提示', () => {
  const data = 建亲密数据();
  const chat = [{ role: 'user', content: '继续。' }];
  const 人物 = 检测焦点(chat, data, 10, '');
  提交快照刷新(data, 规划快照刷新(data, '', 人物));

  data.系统._性爱场景.当前接触部位 = '胸部';
  const 部位票 = 规划快照刷新(data, '', 人物);
  assert.equal(部位票.模式, '完整');
  assert.match(部位票.原因, /场景或亲密状态变化/);
  提交快照刷新(data, 部位票);

  data.系统._性爱场景.保护状态 = '安全套';
  const 保护票 = 规划快照刷新(data, '', 人物);
  assert.equal(保护票.模式, '完整');
  assert.match(保护票.原因, /场景或亲密状态变化/);
});

test('最小提示仍保留非法进入、着装与亲密硬约束', () => {
  const data = 建亲密数据();
  data.户['101'].妻.外装 = '浅色居家裙';
  const chat = [{ role: 'user', content: '继续当前安排。' }];
  const 人物 = 检测焦点(chat, data, 10, '');
  提交快照刷新(data, 规划快照刷新(data, '', 人物));
  聊天变量._场景.非法进入 = true;

  const 票 = 规划快照刷新(data, '', 人物);
  assert.equal(票.模式, '完整');
  提交快照刷新(data, 票);
  const 最小票 = 规划快照刷新(data, '', 人物);
  assert.equal(最小票.模式, '最小');
  const 快照 = 组公寓快照(chat, data, 10, '', 人物, 最小票);
  assert.match(快照, /未经允许进入/);
  assert.match(快照, /着装:/);
  assert.match(快照, /【亲密持续】/);
  assert.match(快照, /【夏乔的界线】/);
  assert.match(快照, /【尺度判定·详】/);
});

test('亲密主焦点变化不等待三楼节拍，下一楼立即完整刷新', () => {
  const data = 建亲密数据();
  const chat = [{ role: 'user', content: '继续。' }];
  const 首人物 = 检测焦点(chat, data, 10, '');
  const 首票 = 规划快照刷新(data, '', 首人物);
  提交快照刷新(data, 首票);

  data.系统._性爱场景.主焦点门牌 = '102';
  const 新人物 = 检测焦点(chat, data, 12, '');
  const 新票 = 规划快照刷新(data, '', 新人物);
  assert.equal(新票.模式, '完整');
  assert.match(新票.原因, /场景或亲密状态变化|在场或焦点变化/);
});

test('变量视图只含本轮可写演员，日常与亲密字段分级', () => {
  const data = 建亲密数据();
  const 日常 = 构造AI可写变量视图(data, { 妻: ['101'], 夫: ['102'], 亲密妻: [] });
  assert.deepEqual(Object.keys(日常.户), ['101', '102']);
  assert.equal(Object.hasOwn(日常.户['101'].妻, '好感值'), true);
  assert.equal(Object.hasOwn(日常.户['101'].妻, '堕落值'), false);
  assert.equal(Object.hasOwn(日常.户['101'].妻, '身体开发'), false);
  assert.deepEqual(Object.keys(日常.户['102'].夫), ['当前心理想法', '当前情绪']);
  assert.equal(Object.hasOwn(日常, '现金'), false);
  assert.equal(Object.hasOwn(日常.户, '201'), false);

  const 亲密 = 构造AI可写变量视图(data, { 妻: ['101', '201'], 夫: [], 亲密妻: ['101', '201'] });
  assert.deepEqual(Object.keys(亲密.户), ['101', '201']);
  assert.equal(Object.hasOwn(亲密.户['101'].妻, '堕落值'), true);
  assert.deepEqual(Object.keys(亲密.户['101'].妻.身体开发), ['小嘴', '胸部', '小屄', '屁穴']);
  assert.deepEqual(构造AI可写变量视图(data, { 妻: [], 夫: [], 亲密妻: [] }), { 户: {} });
});

test('亲密字段只开放给账本参与妻，同场旁观者仍只有日常权限', () => {
  const data = 建亲密数据();
  const 范围 = 构造AI可写变量范围(data, ['101', '102', '201'], ['101', '102', '201'], [], {
    只读: false,
    亲密场景: true,
  });
  const 视图 = 构造AI可写变量视图(data, 范围);

  assert.deepEqual(范围.亲密妻, ['101', '102']);
  assert.equal(Object.hasOwn(视图.户['101'].妻, '身体开发'), true);
  assert.equal(Object.hasOwn(视图.户['102'].妻, '堕落值'), true);
  assert.equal(Object.hasOwn(视图.户['201'].妻, '堕落值'), false);
  assert.equal(Object.hasOwn(视图.户['201'].妻, '身体开发'), false);
});

test('“摸清楼务”不会被单字误判为亲密状态', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(4) } });
  聊天变量 = { _场景: { 房间id: '101', 进房末楼: 8 }, _粘滞: { 位置: '101', 楼: 8, 们: ['101'], 夫们: [] } };
  const 快照 = 组公寓快照([{ role: 'user', content: '我想摸清今天的楼务情况。' }], data, 10);

  assert.match(快照, /【本轮性质·日常】/);
  assert.match(快照, /【尺度判定·简】/);
  assert.doesNotMatch(快照, /【尺度判定·详】/);
});

test('日常语境里的亲密名词和隐喻不会开放堕落或身体开发写权', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(4) } });
  聊天变量 = { _场景: { 房间id: '101', 进房末楼: 8 }, _粘滞: { 位置: '101', 楼: 8, 们: ['101'], 夫们: [] } };

  for (const 玩家文本 of [
    '我检查床上的床单是否需要更换。',
    '这次楼务检查别越界。',
    '聊聊夫妻之间的亲密关系。',
    '这段音乐终于到了高潮。',
    '别把普通邻里关系往暧昧方向理解。',
    '我准备回房上床睡觉。',
    '我们聊聊裸体艺术的历史。',
    '这篇文章讨论新婚第一夜和首夜礼。',
    '健身教练正在讨论体位与站姿。',
    '我想调教一下这台老音响。',
    '我抚摸了一下门框上的划痕。',
  ]) {
    const 对话 = [{ role: 'user', content: 玩家文本 }];
    const 人物 = 检测焦点(对话, data, 10, '');
    const 快照 = 组公寓快照(对话, data, 10, '', 人物);
    const 范围 = 构造AI可写变量范围(data, 人物.焦点, 人物.妻在场, 人物.夫在场, {
      只读: false,
      亲密场景: 快照.includes('【尺度判定·详】'),
    });
    const 视图 = 构造AI可写变量视图(data, 范围);

    assert.match(快照, /【本轮性质·日常】/, 玩家文本);
    assert.doesNotMatch(快照, /【尺度判定·详】/, 玩家文本);
    assert.deepEqual(范围.亲密妻, [], 玩家文本);
    assert.equal(Object.hasOwn(视图.户['101'].妻, '堕落值'), false, 玩家文本);
    assert.equal(Object.hasOwn(视图.户['101'].妻, '身体开发'), false, 玩家文本);
  }
});

test('明确身体动作或以人物为对象的亲密请求仍进入亲密尺度协议', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(4) } });
  聊天变量 = { _场景: { 房间id: '101', 进房末楼: 8 }, _粘滞: { 位置: '101', 楼: 8, 们: ['101'], 夫们: [] } };

  for (const 玩家文本 of [
    '我拥抱她。',
    '我和她接吻。',
    '我和她上床。',
    '我让她脱光。',
    '我想换个体位。',
    '我调教她。',
    '我抚摸她的腰。',
    '我强吻她。',
    '我亲了她一下。',
    '我摸了摸她的腰。',
  ]) {
    const 快照 = 组公寓快照([{ role: 'user', content: 玩家文本 }], data, 10, '');
    assert.match(快照, /【尺度判定·详】/, 玩家文本);
  }
});

test('原生路径会覆盖世界书已展开的旧演员变量视图', () => {
  const index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  assert.match(index源, /function 覆盖原生本轮变量视图/);
  assert.match(index源, /<status_current_variable>[\s\S]*?<\\\/status_current_variable>/);
  assert.match(index源, /覆盖原生本轮变量视图\(chat, 演出data, _本轮变量范围\)/);
});

test('主路径与原生路径的守护、最终视图共用提示阶段冻结的精确范围', () => {
  const 引擎源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  const index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

  assert.match(引擎源, /回滚保护字段\(newStat, 焦点, 变量范围, 生成楼层/);
  assert.match(引擎源, /同步整表视图\(newStat, 本轮事务仍有效, 变量范围, 生成楼层\)/);
  assert.match(index源, /回滚保护字段\(newData, _本轮焦点, _本轮变量范围, 楼层/);
});

test('原生 MVU 外置辅助请求不会被误判成下一正文轮', () => {
  const index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const 辅助闸 = index源.indexOf("typeof Mvu.isDuringExtraAnalysis === 'function'");
  const 令牌递增 = index源.indexOf('const 本次原生轮令牌 = ++_原生本轮令牌');

  assert.ok(辅助闸 >= 0 && 辅助闸 < 令牌递增);
  assert.match(index源, /同步整表视图\(演出data, 原生请求仍有效, _本轮变量范围, 楼层\)/);
  assert.match(index源, /if \(!读取MVU解析状态\(\)\.外置模式\) 覆盖原生本轮变量视图/);
});
