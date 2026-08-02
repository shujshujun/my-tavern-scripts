/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
// `schema.json` 与 `schema.ts` 同名；让 Node 测试像 webpack 一样优先解析 TypeScript。
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');

const {
  入住登场场景可用,
  选择本轮事件,
  本轮事件可提交,
  识别入住登场预约,
} = require('../../src/人妻公寓/脚本/游戏逻辑/入住触发门.ts');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 入住检测, 构造入住登场演出态, 提交入住登场 } = require('../../src/人妻公寓/脚本/游戏逻辑/入住系统.ts');
const { 记录全楼有效成长 } = require('../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts');
const { 入住登场当前场景可用, 离场标记仍有效 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');

let 测试聊天变量 = {};
globalThis.getVariables = () => 测试聊天变量;

const stageConfig = readFileSync(new URL('../../src/人妻公寓/stageConfig.ts', import.meta.url), 'utf8');
const 入住源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/入住系统.ts', import.meta.url), 'utf8');
const 快照源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts', import.meta.url), 'utf8');
const 回合源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 索引源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

const 新户事件 = '【事件在场妻:201】【事件在场夫:201】【新住户】201室今天搬进来一家';
const 母亲事件 = '【事件在场妻:302】【那扇门】没有任何事件发生';

test('管理员室继续属于合法公共登场点，任何持续人物都会阻挡', () => {
  assert.match(stageConfig, /id: '管理员室',[\s\S]{0,180}私密: true,[\s\S]{0,80}类型: '公共'/);
  assert.equal(入住登场场景可用({ 房间id: '管理员室', 房间类型: '公共', 持续人物数: 0 }), true);
  assert.equal(入住登场场景可用({ 房间id: '管理员室', 房间类型: '公共', 持续人物数: 1 }), false);
});

test('入住预约只能由严格的系统事件角色标记识别', () => {
  assert.deepEqual(识别入住登场预约(新户事件), { 类型: '住户', 门牌: '201' });
  assert.deepEqual(识别入住登场预约(母亲事件), { 类型: '母亲', 门牌: '302' });
  assert.equal(识别入住登场预约('【新住户】有人口头提到201室'), null);
  assert.equal(识别入住登场预约('【事件在场妻:101】【新住户】201室'), null);
  assert.equal(识别入住登场预约(`【事件在场妻:101】${新户事件}`), null, '混入其他妻标记不得获得建户权限');
  assert.equal(识别入住登场预约(`${母亲事件}【新住户】`), null, '两类剧情标记同时出现应拒绝');
  assert.equal(识别入住登场预约(`${新户事件}【新住户】`), null, '重复剧情标记也不得获得建户权限');
});

test('事件冻结区分重放、待发送、入住延期和无事件', () => {
  const 延期 = 选择本轮事件({
    楼层: 12,
    已注入: { 楼层: -1, 内容: '' },
    待发送: 新户事件,
    入住场景可用: false,
  });
  assert.deepEqual(延期, { 楼层: 12, 内容: '', 来源: '入住延期', 待发送快照: 新户事件 });
  assert.equal(本轮事件可提交(延期, 新户事件, 12, true), false);

  const 待发 = 选择本轮事件({
    楼层: 12,
    已注入: { 楼层: -1, 内容: '' },
    待发送: 新户事件,
    入住场景可用: true,
  });
  assert.equal(本轮事件可提交(待发, 新户事件, 12, false), false, '登场空正文不得消费');
  assert.equal(本轮事件可提交(待发, 新户事件, 12, true), true);
  assert.equal(本轮事件可提交(待发, 母亲事件, 12, true), false, 'prompt 后队列变化不得误消费');

  const 重放 = 选择本轮事件({
    楼层: 12,
    已注入: { 楼层: 12, 内容: 新户事件 },
    待发送: 新户事件,
    入住场景可用: true,
  });
  assert.equal(重放.来源, '重放');
  assert.equal(本轮事件可提交(重放, 新户事件, 12, true), false, '同文案重放也不能消费下一事件');
});

test('入住检测只预约，演出态与成功提交由独立事务完成', () => {
  const 检测位置 = 入住源.indexOf('export function 入住检测');
  assert.ok(检测位置 >= 0);
  const 检测实现 = 入住源.slice(检测位置);
  assert.doesNotMatch(检测实现, /data\.户\[目标\]\s*=/, '预约阶段不得创建住户节点');
  assert.doesNotMatch(检测实现, /data\.系统\._母亲入列\s*=\s*true/, '预约阶段不得提前公开母亲');
  assert.match(入住源, /export function 构造入住登场演出态/);
  assert.match(入住源, /export function 提交入住登场/);
});

test('新户预演不污染存档，成功时按绝对时段创建且消息楼不参与计时', () => {
  const data = Schema.parse({
    户: { 101: 创建户节点(0) },
    系统: { _绝对时段: 3, _待发送事件: 新户事件 },
  });
  const 原始 = structuredClone(data);
  const 演出态 = 构造入住登场演出态(data, 新户事件, 12);

  assert.deepEqual(data, 原始);
  assert.equal(data.户['201'], undefined);
  assert.equal(演出态.户['201']?._入住时段, 3);

  const 首次 = 提交入住登场(data, 新户事件, 12);
  assert.deepEqual(首次, { 类型: '住户', 门牌: '201' });
  assert.equal(data.户['201']?._入住时段, 3);
  const 已提交节点 = structuredClone(data.户['201']);
  const 重复 = 提交入住登场(data, 新户事件, 99);
  assert.deepEqual(重复, 首次);
  assert.deepEqual(data.户['201'], 已提交节点);
});

test('母亲暗账只在成功首演提交一次，预演不会改原态', () => {
  const data = Schema.parse({
    户: { 301: 创建户节点(0), 302: 创建户节点(0) },
    系统: { _待发送事件: 母亲事件, _母亲撞见次数: 5, _母亲入列: false },
  });
  const 原堕落 = data.户['302'].妻.堕落值;
  const 演出态 = 构造入住登场演出态(data, 母亲事件, 20);

  assert.equal(data.系统._母亲入列, false);
  assert.equal(data.户['302'].妻.堕落值, 原堕落);
  assert.equal(演出态.系统._母亲入列, true);
  assert.equal(演出态.户['302'].妻.堕落值, 原堕落 + 16);

  const 首次 = 提交入住登场(data, 母亲事件, 20);
  assert.deepEqual(首次, { 类型: '母亲', 门牌: '302' });
  assert.equal(data.户['302'].妻.堕落值, 原堕落 + 16);
  const 重复 = 提交入住登场(data, 母亲事件, 21);
  assert.deepEqual(重复, 首次);
  assert.equal(data.户['302'].妻.堕落值, 原堕落 + 16);
});

test('母亲封顶暗账从预演克隆转入正式提交后仍只刷新一次成长账', () => {
  const 原态 = Schema.parse({
    户: { 301: 创建户节点(0), 302: 创建户节点(0) },
    系统: { _绝对时段: 20, _待发送事件: 母亲事件, _母亲撞见次数: 5, _母亲入列: false },
  });
  原态.户['302'].妻.当前阶段 = 1;
  原态.户['302'].妻.堕落值 = 100;
  原态.户['302'].妻._成长账 = { 上次有效成长钟楼: 5, 成长轮次: 0, 已结算冷落日: 0 };
  const 演出基准 = 构造入住登场演出态(原态, 母亲事件, 20);
  const 正式结果 = Schema.parse(structuredClone(演出基准));

  提交入住登场(正式结果, 母亲事件, 20);
  记录全楼有效成长(演出基准, 正式结果);
  assert.equal(正式结果.户['302'].妻.堕落值, 100);
  assert.equal(正式结果.户['302'].妻._成长账.上次有效成长钟楼, 20);
  assert.equal(正式结果.户['302'].妻._成长账.成长轮次, 1);

  const 已结算快照 = structuredClone(正式结果);
  正式结果.系统._绝对时段 = 21;
  记录全楼有效成长(已结算快照, 正式结果);
  assert.equal(正式结果.户['302'].妻._成长账.成长轮次, 1, '候选消费后不得串到下一次写入');
});

test('入住检测达到门槛时只排预约，持续人物会让预约继续等待', () => {
  测试聊天变量 = { _场景: { 房间id: '管理员室' }, _粘滞: null, _赴约: null };
  const 空闲 = Schema.parse({ 户: { 101: 创建户节点(0) } });
  空闲.户['101'].妻.当前阶段 = 2;
  入住检测(空闲, 12, 0);
  assert.equal(空闲.户['201'], undefined);
  assert.deepEqual(识别入住登场预约(空闲.系统._待发送事件), { 类型: '住户', 门牌: '201' });

  const 占用 = Schema.parse({ 户: { 101: 创建户节点(0) } });
  占用.户['101'].妻.当前阶段 = 2;
  入住检测(占用, 12, 1);
  assert.equal(占用.户['201'], undefined);
  assert.equal(占用.系统._待发送事件, '');
});

test('晨跑公园与健身房即使属于公共房间也不能触发入住预约', () => {
  for (const 房间id of ['晨跑公园', '健身房']) {
    测试聊天变量 = { _场景: { 房间id }, _粘滞: null, _赴约: null };
    const data = Schema.parse({ 户: { 101: 创建户节点(0) } });
    data.户['101'].妻.当前阶段 = 2;

    入住检测(data, 12, 0);

    assert.equal(data.户['201'], undefined, 房间id);
    assert.equal(data.系统._待发送事件, '', `${房间id}不应排入新住户登场票`);
    assert.equal(入住登场当前场景可用(data, 12), false, 房间id);
  }
});

test('丈夫、赴约与未过期粘滞会占用管理员室，离场冷却按原始楼戳过期', () => {
  const data = Schema.parse({});
  测试聊天变量 = {
    _场景: { 房间id: '管理员室' },
    _粘滞: { 位置: '管理员室', 楼: 10, 们: [], 夫们: ['101'], 离场: [] },
    _赴约: null,
  };
  assert.equal(入住登场当前场景可用(data, 12), false, '丈夫单独在场也应阻挡');

  测试聊天变量 = {
    _场景: { 房间id: '管理员室' },
    _粘滞: { 位置: '管理员室', 楼: 10, 们: [], 夫们: [], 离场: [] },
    _赴约: { m: '101', 起楼: 10, 至楼: 20 },
  };
  assert.equal(入住登场当前场景可用(data, 12), false, '有效赴约应阻挡');

  测试聊天变量 = {
    _场景: { 房间id: '管理员室' },
    _粘滞: { 位置: '管理员室', 楼: 15, 离场楼: 10, 们: ['101'], 夫们: [], 离场: ['101'] },
    _赴约: null,
  };
  assert.equal(入住登场当前场景可用(data, 16), true, '离场后第六楼仍排除该人物');
  assert.equal(入住登场当前场景可用(data, 17), false, '第七楼离场标记过期，持续人物重新生效');

  const 未来离场 = { 位置: '管理员室', 楼: 15, 离场楼: 20, 们: ['101'], 夫们: [], 离场: ['101'] };
  assert.equal(离场标记仍有效(未来离场, '管理员室', 16), false, '回档后的未来离场楼戳必须作废');
  测试聊天变量 = { _场景: { 房间id: '管理员室' }, _粘滞: 未来离场, _赴约: null };
  assert.equal(入住登场当前场景可用(data, 16), false, '未来离场楼戳不能掩盖仍在场的持续人物');
});

test('主回合对空确定性剧情拒绝推进，并在失败 finally 恢复 chat 快照', () => {
  assert.match(回合源, /事件必须有正文\(本楼事件\)\s*&&\s*!已清洗正文/);
  assert.match(回合源, /if \(!临时用户已转正[\s\S]{0,1200}恢复回合变量快照/);
  assert.match(回合源, /本轮事件可提交\(/);
});

test('主回合与原生路径都把首次入住演出设为只读变量回合', () => {
  assert.match(
    回合源,
    /const 只读变量场景 =[\s\S]{0,180}是入住登场事件\(本楼事件\)[\s\S]{0,160}只读: 只读变量场景/,
  );
  assert.match(
    索引源,
    /const 只读变量场景 =[\s\S]{0,180}是入住登场事件\(本楼事件\)[\s\S]{0,220}只读: 只读变量场景/,
  );
});

test('脚本重载初始化最终真值后立即建立变量保护快照', () => {
  const 初始化分支 = 索引源.slice(索引源.indexOf('// 首批入住引导'), 索引源.indexOf('// 加载成功提示'));
  const 写入位置 = 初始化分支.indexOf('脚本写入(raw, data)');
  const 捕获位置 = 初始化分支.indexOf('捕获保护快照(data)');

  assert.ok(写入位置 >= 0);
  assert.ok(捕获位置 > 写入位置, '保护快照必须基于确保首批入住后的最终真值');
});

test('原生输入冻结同一事件，只按真实注入内容提交并补做入住检测', () => {
  assert.match(索引源, /let _本轮事件/);
  assert.match(索引源, /冻结本轮事件\(/);
  assert.match(索引源, /本轮事件可提交\(/);
  assert.doesNotMatch(索引源, /else if \(newData\.系统\._待发送事件\)/);
  assert.match(索引源, /入住检测\(newData, 楼层,/);
  assert.match(索引源, /const 预期聊天ID = 当前聊天ID\(\)/);
  assert.match(索引源, /const rawStat = 读最近有效stat\(\)/);
  assert.match(索引源, /已注入\.楼层 !== 楼层 \|\| 已注入\.内容 !== 事件/);
});

test('持续状态同时保存丈夫，并统一清理过期离场标记', () => {
  assert.match(快照源, /夫们\?: 门牌\[\]/);
  assert.match(快照源, /const 已过楼 = 楼层 - \(粘滞\.离场楼 \?\? 粘滞\.楼 \?\? 0\)/);
  assert.match(快照源, /已过楼 >= 0 && 已过楼 <= 6/);
  assert.match(回合源, /夫们:\s*夫在场/);
  assert.match(回合源, /离场标记仍有效\(旧粘滞, 场\.房间id, 楼层\)/);
  assert.match(索引源, /离场标记仍有效\(旧粘滞, 当前场景id, 楼层\)/);
});

test('在场与粘滞使用等待完成的整值替换，空数组能清掉旧丈夫和离场楼戳', () => {
  const 主路径写入 = 回合源.slice(
    回合源.indexOf('export async function 组快照注入'),
    回合源.indexOf('/**\n * 数据库插件兼容广播'),
  );
  const 原生写入 = 索引源.slice(
    索引源.indexOf('async function 固化原生本轮在场'),
    索引源.indexOf('/** MVU 回调退出后'),
  );

  for (const 源 of [主路径写入, 原生写入]) {
    assert.match(源, /await updateVariablesWith\(/);
    assert.match(源, /_\.set\(vars, '_在场'/);
    assert.match(源, /_\.set\(vars, '_粘滞'/);
    assert.doesNotMatch(源, /insertOrAssignVariables\(/);
    assert.match(源, /\.\.\.\(离场\.length \? \{ 离场楼:/, '无离场时新整值不得携带旧楼戳');
  }
  assert.match(回合源, /await 组快照注入\(/, '主路径必须等待 chat 变量写完再继续生成');
  assert.match(索引源, /await 固化原生本轮在场\(楼层, 原生事务仍有效\)/, '原生路径必须等待 chat 变量写完再释放回合');
});

test('母亲入住预演是本轮增量基准，不把固定 +16 记成 AI 成长或父亲疑心', () => {
  assert.match(回合源, /const 本轮结算基准 = 入住事件将提交 \? 演出data : data/);
  assert.match(回合源, /回合结算\(\s*newStat,\s*本轮结算基准,/);
  assert.match(回合源, /冻结全楼余波堕落\(本轮结算基准, newStat\)/);
  assert.match(回合源, /记录全楼有效成长\(本轮结算基准, newStat,/);
  assert.match(索引源, /const 成长基准 = 入住预览可守护[\s\S]{0,160}_本轮入住演出态/);
  assert.match(索引源, /const 基准堕落 = 成长基准\.户\[m\]\?\.妻\.堕落值/);
});
