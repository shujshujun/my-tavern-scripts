/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 捕获保护快照, 回滚保护字段, 清保护快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts');
const {
  三方合并变量重生成对象,
  合并重新生成变量结果,
  提取变量重生成AI结果,
  变量重生成有不可逆派生冲突,
  重算变量重生成派生,
} = require('../../src/人妻公寓/脚本/游戏逻辑/变量重新生成核心.ts');

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 范围 = { 妻: ['101'], 夫: ['101'], 亲密妻: ['101'] };

function 建数据() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0) } });
  data.户['101'].妻.当前阶段 = 3;
  data.户['101'].妻.好感值 = 60;
  data.户['101'].妻.堕落值 = 40;
  data.户['101'].妻._堕落日账 = { 日: 2, 值: 1 };
  data.户['101'].妻.当前情绪 = '平静';
  data.户['101'].夫.当前情绪 = '平静';
  return data;
}

test('三方合并保留任务和电话等独立变化，同一字段双方不同改动才拒绝', () => {
  const 基线 = { 风闻: 10, 胜任度: 80, 电话: { 状态: '空闲' } };
  assert.deepEqual(
    三方合并变量重生成对象(
      基线,
      { 风闻: 12, 胜任度: 80, 电话: { 状态: '空闲' } },
      { 风闻: 10, 胜任度: 78, 电话: { 状态: '通话中' } },
    ),
    { 风闻: 12, 胜任度: 78, 电话: { 状态: '通话中' } },
  );
  assert.equal(
    三方合并变量重生成对象(
      基线,
      { 风闻: 12, 胜任度: 80, 电话: { 状态: '空闲' } },
      { 风闻: 15, 胜任度: 80, 电话: { 状态: '空闲' } },
    ),
    null,
  );
});

test('相同的 +3 重新生成仍落在 63，不会从当前 63 再滚到 66', () => {
  const 原AI = 建数据();
  原AI.户['101'].妻.好感值 = 63;
  const 当前 = lodash.cloneDeep(原AI);
  const 新AI = lodash.cloneDeep(原AI);

  const 合并 = 合并重新生成变量结果(当前, 提取变量重生成AI结果(原AI, 范围), 提取变量重生成AI结果(新AI, 范围), 范围);

  assert.equal(合并.户['101'].妻.好感值, 63);
});

test('新模型结果会替换旧模型结果，同时保留脚本在旧结果之后增加的数值', () => {
  const 原AI = 建数据();
  原AI.户['101'].妻.好感值 = 63;
  const 当前 = lodash.cloneDeep(原AI);
  当前.户['101'].妻.好感值 = 65; // 之后的脚本奖励 +2
  当前.现金 = 999; // 全局脚本字段也必须保持
  const 新AI = lodash.cloneDeep(原AI);
  新AI.户['101'].妻.好感值 = 61;

  const 合并 = 合并重新生成变量结果(当前, 提取变量重生成AI结果(原AI, 范围), 提取变量重生成AI结果(新AI, 范围), 范围);

  assert.equal(合并.户['101'].妻.好感值, 63, '新 AI 61 + 脚本差值 2');
  assert.equal(合并.现金, 999);
});

test('脚本覆盖过的文本保留；未覆盖文本与堕落日账随新 AI 结果替换', () => {
  const 原AI = 建数据();
  原AI.户['101'].妻.当前情绪 = '开心';
  原AI.户['101'].妻.当前心理想法 = '原模型想法';
  原AI.户['101'].妻._堕落日账 = { 日: 2, 值: 3 };
  const 当前 = lodash.cloneDeep(原AI);
  当前.户['101'].妻.当前情绪 = '脚本固定情绪';
  const 新AI = lodash.cloneDeep(原AI);
  新AI.户['101'].妻.当前情绪 = '紧张';
  新AI.户['101'].妻.当前心理想法 = '新模型想法';
  新AI.户['101'].妻._堕落日账 = { 日: 2, 值: 2 };

  const 合并 = 合并重新生成变量结果(当前, 提取变量重生成AI结果(原AI, 范围), 提取变量重生成AI结果(新AI, 范围), 范围);

  assert.equal(合并.户['101'].妻.当前情绪, '脚本固定情绪');
  assert.equal(合并.户['101'].妻.当前心理想法, '新模型想法');
  assert.deepEqual(合并.户['101'].妻._堕落日账, { 日: 2, 值: 2 });
});

test('旧 AI 成长会被撤换，回合后的礼物数值与礼物成长记录仍保留', () => {
  const 回合前 = 建数据();
  回合前.系统._绝对时段 = 1;
  回合前.户['101'].妻._成长账 = { 上次有效成长钟楼: 0, 成长轮次: 0, 已结算冷落日: 0 };
  const 原AI = lodash.cloneDeep(回合前);
  原AI.户['101'].妻.好感值 = 63;
  const 原派生后 = lodash.cloneDeep(原AI);
  原派生后.户['101'].妻._成长账 = { 上次有效成长钟楼: 1, 成长轮次: 1, 已结算冷落日: 0 };
  const 当前 = lodash.cloneDeep(原派生后);
  当前.户['101'].妻.好感值 = 65; // 回合后礼物 +2
  当前.户['101'].妻._成长账 = { 上次有效成长钟楼: 2, 成长轮次: 2, 已结算冷落日: 0 };
  const 新AI = lodash.cloneDeep(回合前); // 新 AI 不再增加好感
  const 票据 = {
    当前绝对时段: 1,
    母亲入列: false,
    妻: {
      101: {
        回合前: lodash.cloneDeep(回合前.户['101'].妻),
        派生前: lodash.cloneDeep(原AI.户['101'].妻),
        原派生后: lodash.cloneDeep(原派生后.户['101'].妻),
        独立合法正候选: [],
        余波冻结: false,
      },
    },
    疑心: {},
  };
  const 原快照 = 提取变量重生成AI结果(原AI, 范围);
  const 新快照 = 提取变量重生成AI结果(新AI, 范围);
  const 派生 = 重算变量重生成派生(原快照, 新快照, 票据);
  const 合并 = 合并重新生成变量结果(当前, 原快照, 新快照, 范围, 票据, 派生);

  assert.equal(合并.户['101'].妻.好感值, 62, '新 AI 60 + 回合后礼物 2');
  assert.equal(合并.户['101'].妻._成长账.成长轮次, 1, '撤掉旧 AI 的一轮，保留礼物自己的一轮');
  assert.equal(合并.户['101'].妻._成长账.上次有效成长钟楼, 2, '礼物写入的更晚成长水位不能被回拨');
});

test('余波冻结会拍回新 AI 堕落，且不会伪造亲密成长', () => {
  const 回合前 = 建数据();
  回合前.系统._绝对时段 = 5;
  回合前.户['101'].妻._冷落余波.状态 = '待诉苦';
  const 原AI = lodash.cloneDeep(回合前);
  原AI.户['101'].妻.堕落值 = 43;
  const 原派生后 = lodash.cloneDeep(原AI);
  原派生后.户['101'].妻.堕落值 = 40;
  const 新AI = lodash.cloneDeep(回合前);
  新AI.户['101'].妻.堕落值 = 41;
  const 票据 = {
    当前绝对时段: 5,
    母亲入列: false,
    妻: {
      101: {
        回合前: lodash.cloneDeep(回合前.户['101'].妻),
        派生前: lodash.cloneDeep(原派生后.户['101'].妻),
        原派生后: lodash.cloneDeep(原派生后.户['101'].妻),
        独立合法正候选: [],
        余波冻结: true,
      },
    },
    疑心: {},
  };
  const 原快照 = 提取变量重生成AI结果(原AI, 范围);
  const 新快照 = 提取变量重生成AI结果(新AI, 范围);
  const 派生 = 重算变量重生成派生(原快照, 新快照, 票据, { 101: ['堕落值'] });

  assert.equal(派生.妻['101'].堕落值, 40);
  assert.equal(派生.成长[0].来源.includes('堕落值'), false);
});

test('疑心只替换本轮 AI 贡献，之后发生的其他疑心变化保留', () => {
  const 回合前 = 建数据();
  const 原AI = lodash.cloneDeep(回合前);
  原AI.户['101'].妻.堕落值 = 43;
  const 当前 = lodash.cloneDeep(原AI);
  当前.户['101'].夫.疑心值 = 15; // 本轮 AI +1，之后其他脚本又 +4
  const 新AI = lodash.cloneDeep(回合前);
  新AI.户['101'].妻.堕落值 = 41; // 新贡献为 0
  const 票据 = {
    当前绝对时段: 1,
    母亲入列: false,
    妻: {},
    疑心: { 101: { 回合前堕落: 40, 原贡献: 1, 冻结: false } },
  };
  const 原快照 = 提取变量重生成AI结果(原AI, 范围);
  const 新快照 = 提取变量重生成AI结果(新AI, 范围);
  const 合并 = 合并重新生成变量结果(当前, 原快照, 新快照, 范围, 票据, { 妻: {}, 成长: [] });

  assert.equal(合并.户['101'].夫.疑心值, 14, '只撤掉原 AI 的 +1，保留之后的 +4');
});

test('新旧结果改变母亲撞见正向资格时失败关闭，不重演一次性剧情', () => {
  const 新AI = 建数据();
  新AI.户['101'].妻.堕落值 = 41;
  const 票据 = {
    当前绝对时段: 1,
    母亲入列: false,
    妻: {},
    疑心: { 101: { 回合前堕落: 40, 原贡献: 0, 冻结: false } },
    不可逆撞见资格: { 门牌: '101', 原本正向: false },
  };

  assert.equal(变量重生成有不可逆派生冲突(提取变量重生成AI结果(新AI, 范围), 票据), true);
});

test('丈夫打断已经读取疑心后，疑心贡献变化同样失败关闭', () => {
  const 新AI = 建数据();
  新AI.户['101'].妻.堕落值 = 43;
  const 票据 = {
    当前绝对时段: 1,
    母亲入列: false,
    妻: {},
    疑心: { 101: { 回合前堕落: 40, 原贡献: 0, 冻结: false } },
    不可逆疑心门牌: '101',
  };

  assert.equal(变量重生成有不可逆派生冲突(提取变量重生成AI结果(新AI, 范围), 票据), true);
});

test('连续反感与亲密账本资格若会改变，均在写入前失败关闭', () => {
  const 回合前 = 建数据();
  const 原AI = lodash.cloneDeep(回合前);
  const 新AI = lodash.cloneDeep(回合前);
  新AI.户['101'].妻.好感值 = 59;
  新AI.户['101'].妻.身体开发.小屄 += 1;
  const 票据 = {
    当前绝对时段: 1,
    母亲入列: false,
    妻: {
      101: {
        回合前: lodash.cloneDeep(回合前.户['101'].妻),
        派生前: lodash.cloneDeep(原AI.户['101'].妻),
        原派生后: lodash.cloneDeep(原AI.户['101'].妻),
        独立合法正候选: [],
        余波冻结: false,
      },
    },
    疑心: {},
    不可逆反感资格: { 101: { 回合前好感: 60, 原AI后脚本差值: 0, 原本下降: false } },
    不可逆身体增长资格: { 101: false },
  };
  const 原快照 = 提取变量重生成AI结果(原AI, 范围);
  const 新快照 = 提取变量重生成AI结果(新AI, 范围);
  const 派生 = 重算变量重生成派生(原快照, 新快照, 票据);

  assert.equal(变量重生成有不可逆派生冲突(新快照, 票据, 派生), true);
});

test('守护可显式使用回合原基线，而不是当前终值快照', () => {
  const 原基线 = 建数据();
  const 当前终值 = lodash.cloneDeep(原基线);
  当前终值.户['101'].妻.好感值 = 63;
  const 候选 = lodash.cloneDeep(原基线);
  候选.户['101'].妻.好感值 = 66;

  捕获保护快照(当前终值);
  try {
    回滚保护字段(候选, ['101'], 范围, 8, 候选, 原基线);
  } finally {
    清保护快照();
  }

  assert.equal(候选.户['101'].妻.好感值, 63, '相对原基线 60 的 +6 只能截到 +3');
});

test('引擎与界面契约：独立模型直算、末楼身份门、成功一次标记和常驻快捷按钮', () => {
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 脚本 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const App = 读('src/人妻公寓/界面/客户端/App.vue');
  const 输入 = 读('src/人妻公寓/界面/客户端/components/回合输入.vue');

  const 功能起点 = 引擎.indexOf('export async function 重新生成最近回合变量');
  const 功能终点 = 引擎.indexOf('/** 楼层尾部 + 本次行动', 功能起点);
  const 功能段 = 引擎.slice(功能起点, 功能终点);
  assert.ok(功能起点 >= 0 && 功能终点 > 功能起点);
  assert.match(功能段, /await 内置外置变量解析\(/, '复用游戏独立变量通道，兼容自动与自定义 API');
  assert.doesNotMatch(功能段, /MVU外置模型重试|重试额外模型解析/, '不直接调用官方破坏性重试按钮');
  assert.match(功能段, /Mvu\.parseMessage\(`\$\{基础正文\}\\n\$\{请求结果\.变量块\}`/, '新块只在原基线上解析一次');
  assert.match(功能段, /变量重生成身份有效\(上下文, 原消息签名\)/, '迟到结果提交前复核聊天、楼层和消息签名');
  assert.match(功能段, /\[变量重生成成功标记键\]: true/, '成功机会持久写在当前助手消息上');
  assert.match(功能段, /持久写入变量重生成消息\(上下文\.助手楼层, 新正文, 合并raw/, '正文、data 与成功标记走一次成套消息更新');
  assert.doesNotMatch(功能段, /await 脚本写入\(合并raw/, '核心提交不再经过“先写变量、后同步视图”的复合函数');
  assert.match(功能段, /变量重生成有不可逆派生冲突/, '一次性剧情资格变化会在写入前失败关闭');
  assert.match(功能段, /重算变量重生成派生/, '成长、冷落与疑心使用本回合小票据重算');

  assert.match(
    引擎,
    /解析基准: Schema\.parse\(_\.get\(变量失败回退基准, 'stat_data'\)/,
    '每回合只保存解析前 stat 基线而不是当前终值或整份 MVU 派生数据',
  );
  assert.match(引擎, /版本: 2/, '新版上下文带派生小票据，旧版安全降级');
  assert.match(引擎, /派生票据: _\.cloneDeep\(变量重生成派生票据\)/);
  assert.match(引擎, /当前变量重生成解析通道\(\)/, '按钮状态与执行共用同一通道判定');
  assert.match(脚本, /eventOn\('人妻公寓:重新生成变量'/);
  assert.match(脚本, /!取消隔离事件\(\) && !取消变量重生成\(\)/, '统一取消按钮可取消变量请求');
  assert.match(脚本, /排队宿主原生时间线切换[\s\S]*?取消变量重生成\(\)/, '切换消息分支会立即取消变量请求');
  assert.match(脚本, /tavern_events\.CHAT_CHANGED[\s\S]*?取消变量重生成\(\)/, '切换聊天会立即取消变量请求');
  assert.match(App, /:variable-regeneration-state="变量重生成状态"/);
  assert.match(App, /@regenerate-variables="发起变量重生成"/);
  assert.match(输入, />重新生成变量<\/span>/);
  assert.match(输入, /只重新计算最近一回合的变量，不重新生成正文/);
  assert.match(输入, /本回合变量已重新生成/);
  assert.match(输入, /请先配置变量模型/);
});
