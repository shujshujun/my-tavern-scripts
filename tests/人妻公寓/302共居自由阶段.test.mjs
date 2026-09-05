/* eslint-disable import-x/no-nodejs-modules -- Node-only regression harness */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;

const schemaModule = require('../../src/人妻公寓/schema.ts');
const { Schema, 创建户节点 } = schemaModule;
// Node扩展名解析会优先命中同名schema.json；产品webpack优先.ts。定向测试绑定真实Schema导出。
const schemaAliasPath = require.resolve('../../src/人妻公寓/schema');
require.cache[schemaAliasPath] = {
  id: schemaAliasPath,
  filename: schemaAliasPath,
  loaded: true,
  exports: schemaModule,
};

const 共居 = require('../../src/人妻公寓/脚本/游戏逻辑/302共居系统.ts');
const 共居世界书 = require('../../src/人妻公寓/脚本/游戏逻辑/302共居世界书.ts');
const 资源 = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const 成人CG = require('../../src/人妻公寓/脚本/游戏逻辑/成人CG系统.ts');

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function 数据(绝对时段 = 6, 已完成 = true) {
  const data = Schema.parse({
    户: { 302: 创建户节点(0) },
    系统: { _绝对时段: 绝对时段, _母亲入列: true },
  });
  data.户['302'].妻.当前阶段 = 5;
  data.户['302'].妻.好感值 = 78;
  data.户['302'].妻.堕落值 = 91;
  if (已完成) {
    data.系统._双重继承.阶段 = '已完成';
    data.系统._双重继承.完成楼层 = 20;
    data.系统._已完成特殊场景.push('双重继承');
  }
  共居.同步302共居状态(data);
  return data;
}

function 执行开场(data, 动作 = '由我开始', 正文 = '母亲接受了这次亲近，坐在床边等着玩家决定下一步。', 楼层 = 40) {
  const 旧data = lodash.cloneDeep(data);
  const 结果 = 资源.结算成功现场楼(data, 旧data, {
    场景: '302',
    楼层,
    行动: 共居.母亲共居行动文本(动作),
    正文,
    本楼事件: '',
    妻在场: ['302'],
    实际尺度: { 302: 1 },
    资源计费: false,
  });
  return { 旧data, 结果 };
}

test('Schema、schema.json与initvar只保留302共居真值、开场记录和待反馈收据', () => {
  const expected = {
    版本: 1,
    状态: '未开启',
    开始绝对时段: -1,
    最近事件: '',
    最近事件时段: -1,
    里程碑: [],
    事件序号: 0,
    事件记录: [],
    待反馈事件: [],
  };
  assert.deepEqual(Schema.parse({}).系统._302共居, expected);

  const schemaJson = JSON.parse(read('src/人妻公寓/schema.json'));
  const jsonKeys = Object.keys(schemaJson.properties.系统.properties._302共居.properties);
  assert.deepEqual(jsonKeys, Object.keys(expected));

  const initvar = read('src/人妻公寓/世界书/变量/initvar.yaml');
  const block = initvar.slice(initvar.indexOf('  _302共居:'), initvar.indexOf('  _家庭文档:'));
  for (const key of Object.keys(expected)) assert.match(block, new RegExp(`${key}:`));
  assert.doesNotMatch(
    block,
    /兼容迁移待保存|当前日|今日安排|安排时段|今日早餐|今日晚饭|今日夜晚|今日她的安排已了解|未解决事项/,
  );

  const schemaSource = read('src/人妻公寓/schema.ts');
  assert.doesNotMatch(schemaSource, /迁移母亲共居单一状态|补齐302共居反馈队列|_母亲共居/);
  assert.equal(Schema.parse({ 系统: { _母亲共居: { 状态: '自由共居' } } }).系统._302共居.状态, '未开启');
});

test('302结局后只定义一块成人入口的两个开场选择，旧日常动作彻底退出', () => {
  assert.deepEqual([...共居.共居动作列表], ['由我开始', '让她开始']);
  const source = read('src/人妻公寓/脚本/游戏逻辑/302共居系统.ts');
  assert.match(source, /id: '和她亲密'/);
  assert.doesNotMatch(
    source,
    /['"](?:一起吃早饭|为她准备早餐|问她今天的安排|说明今晚回来吃饭|说明今晚会晚归|说明今晚不回|一起做晚饭|陪她吃晚饭|陪她坐一会儿|和她一起休息|陪她在天台待一会儿|把晚饭的事谈开)['"]/,
  );
});

test('完成双重继承后，母亲真实在302时只显示“和她亲密”，内部恰好二选一', () => {
  const data = 数据(6);
  const actions = 共居.母亲共居地点动作(data, '302');
  assert.equal(actions.length, 1);
  assert.equal(actions[0].id, '和她亲密');
  assert.equal(actions[0].文案, '和她亲密');
  assert.deepEqual(actions[0].选项.map(item => item.id), ['由我开始', '让她开始']);
  assert.deepEqual(共居.母亲共居地点动作(data, '天台'), []);
});

test('结局、地点、母亲在场、空闲场次与体力继续构成硬门', () => {
  assert.deepEqual(共居.母亲共居地点动作(数据(6, false), '302'), []);
  assert.deepEqual(共居.母亲共居地点动作(数据(6), '管理员室'), []);
  assert.deepEqual(共居.母亲共居地点动作(数据(0), '302'), [], '星期一早晨母亲真实在垃圾房');

  const noStamina = 数据(6);
  noStamina.玩家资源.体力.当前值 = 0;
  assert.deepEqual(共居.母亲共居地点动作(noStamina, '302'), []);

  const busy = 数据(6);
  busy.系统._性爱场景.状态 = '进行中';
  busy.系统._性爱场景.参与者 = { 302: { 满意度: 0, 满意目标: 5, 偏好命中: [], 等级加成已用: false, 有效楼数: 0, 已退出: false } };
  assert.deepEqual(共居.母亲共居地点动作(busy, '302'), []);

  const phone = 数据(6);
  phone.系统._父亲通话.标识 = 'active-call';
  assert.deepEqual(共居.母亲共居地点动作(phone, '302'), []);
});

test('两种选择只改变第一楼开场方向，不建立持续主导权或第二套亲密系统', () => {
  const player = 共居.母亲共居行动文本('由我开始');
  const mother = 共居.母亲共居行动文本('让她开始');
  assert.match(player, /【302结局后亲密开场】【由我开始】/);
  assert.match(player, /下一步/);
  assert.match(mother, /【302结局后亲密开场】【让她开始】/);
  assert.match(mother, /主动发起|无接触动作|直接接触之前/);

  const data = 数据(6);
  const playerPrompt = 共居.母亲共居动作系统注入(data, '由我开始');
  const motherPrompt = 共居.母亲共居动作系统注入(data, '让她开始');
  assert.match(playerPrompt, /把下一步留给玩家/);
  assert.match(motherPrompt, /双方直接接触之前/);
  assert.match(motherPrompt, /无接触开场CG/);
  for (const prompt of [playerPrompt, motherPrompt]) {
    assert.match(prompt, /既有普通亲密场景|原系统处理/);
    assert.match(prompt, /不得推进世界时间/);
    assert.doesNotMatch(prompt, /主导权变量|抢回主导|交出主动/);
  }
});

test('四张专属开场CG精确按两种主导和日光／夜景分流', () => {
  for (const 绝对时段 of [0, 1, 2]) {
    const data = 数据(绝对时段);
    assert.deepEqual(共居.母亲共居亲密开场CG(data, '由我开始'), {
      文件: '302_亲密开场_由我开始_晨间',
      标题: '302共居 · 由我开始 · 晨间',
      时段: '晨间',
    });
    assert.equal(共居.母亲共居亲密开场CG(data, '让她开始').文件, '302_亲密开场_让她开始_晨间');
  }
  for (const 绝对时段 of [3, 4, 5]) {
    const data = 数据(绝对时段);
    assert.equal(共居.母亲共居亲密开场CG(data, '由我开始').文件, '302_亲密开场_由我开始_夜晚');
    assert.equal(共居.母亲共居亲密开场CG(data, '让她开始').文件, '302_亲密开场_让她开始_夜晚');
  }
  assert.equal(共居.母亲共居亲密开场CG(数据(0, false), '由我开始'), null);
});

test('有效开场楼直接创建零进度普通亲密场次，不消耗体力或精力', () => {
  const data = 数据(6);
  data.玩家资源.保护准备 = true;
  const stamina = data.玩家资源.体力.当前值;
  const energy = data.玩家资源.精力.当前值;
  const { 旧data, 结果 } = 执行开场(data, '由我开始');

  assert.equal(结果.性爱开始, true);
  assert.equal(结果.性爱结束, false);
  assert.equal(结果.已消费, null);
  assert.equal(data.玩家资源.体力.当前值, stamina);
  assert.equal(data.玩家资源.精力.当前值, energy);
  assert.equal(data.玩家资源.保护准备, false);
  assert.equal(data.系统._性爱场景.状态, '进行中');
  assert.equal(data.系统._性爱场景.主焦点门牌, '302');
  assert.deepEqual(Object.keys(data.系统._性爱场景.参与者), ['302']);
  assert.equal(data.系统._性爱场景.有效楼数, 0);
  assert.equal(data.系统._性爱场景.参与者['302'].有效楼数, 0);
  assert.equal(data.系统._性爱场景.参与者['302'].满意度, 0);
  assert.equal(data.系统._性爱场景.参与者['302'].满意目标, 5);
  assert.equal(data.系统._性爱场景.保护状态, '安全套');

  const 亲密 = 成人CG.构造CG亲密上下文(旧data, data, false);
  const signal = {
    门牌: '302',
    行为等级: 1,
    正文: '母亲坐在床边，整理好衣服，安静等着玩家决定下一步。',
    行动: 共居.母亲共居行动文本('由我开始'),
    事件: '',
    楼层: 40,
    亲密,
    variant: 'normal',
  };
  assert.equal(亲密.本楼开始, true);
  assert.equal(成人CG.判定亲密场景CG阶段(signal), 'intro_no_contact');
  const images = 成人CG.选择成人CG组(signal, new Set(), new Set(), 2);
  assert.ok(images.length >= 1, '首楼必须直接复用302已有成人开场CG');
  assert.ok(images.every(item => item.door === '302' && item.stage === 'intro_no_contact'));
});

test('母亲明确拒绝、地点错位或结局状态变化时不留下半场', () => {
  const refused = 数据(6);
  const beforeRefused = lodash.cloneDeep(refused.系统._性爱场景);
  assert.throws(
    () => 执行开场(refused, '让她开始', '母亲明确拒绝继续，推开了玩家并要求立刻停下。'),
    /明确拒绝/,
  );
  assert.deepEqual(refused.系统._性爱场景, beforeRefused);

  const wrongRoom = 数据(6);
  const old = lodash.cloneDeep(wrongRoom);
  assert.throws(
    () =>
      资源.结算成功现场楼(wrongRoom, old, {
        场景: '管理员室',
        楼层: 41,
        行动: 共居.母亲共居行动文本('由我开始'),
        正文: '她接受了开场。',
        本楼事件: '',
        妻在场: ['302'],
        实际尺度: { 302: 1 },
        资源计费: false,
      }),
    /地点、演员、结局状态或体力条件/,
  );
  assert.equal(wrongRoom.系统._性爱场景.状态, '空闲');
});

test('普通亲密账本建立后，302只登记开场来源；不推进时间、不排朋友圈', () => {
  const data = 数据(6);
  执行开场(data, '让她开始');
  const beforeTime = data.系统._绝对时段;
  const submitted = 共居.提交302共居动作(data, '让她开始', '302', beforeTime);
  assert.equal(submitted.成功, true);
  assert.equal(submitted.推进方式, undefined);
  assert.equal(data.系统._绝对时段, beforeTime);
  assert.ok(data.系统._302共居.里程碑.includes('第一次结局后亲密开场'));
  assert.ok(data.系统._302共居.里程碑.includes('第一次由母亲主动开始'));
  assert.equal(data.系统._302共居.事件记录.at(-1).类型, '结局后母亲主动亲密');
  assert.equal(data.系统._302共居.事件记录.at(-1).朋友圈范围, '不发布');
  assert.equal(data.系统._302共居.待反馈事件.length, 0);

  const count = data.系统._302共居.事件记录.length;
  assert.equal(共居.提交302共居动作(data, '让她开始', '302', beforeTime).成功, true);
  assert.equal(data.系统._302共居.事件记录.length, count, '同一时段同一开场不重复登记');
});

test('开场之后下一楼完全沿用现有体力、满意度、行为与收尾账本', () => {
  const data = 数据(6);
  执行开场(data, '由我开始');
  const old = lodash.cloneDeep(data);
  const stamina = data.玩家资源.体力.当前值;
  const result = 资源.结算成功现场楼(data, old, {
    场景: '302',
    楼层: 41,
    行动: '继续这场亲密互动，把阴茎插入母亲的小屄。',
    正文: '玩家的阴茎真正插入她的小屄，开始缓慢抽插。',
    本楼事件: '',
    妻在场: ['302'],
    实际尺度: { 302: 3 },
    资源计费: true,
  });
  assert.equal(result.性爱开始, false);
  assert.equal(result.性爱结束, false);
  assert.equal(result.已消费, '体力');
  assert.equal(data.玩家资源.体力.当前值, stamina - 1);
  assert.equal(data.系统._性爱场景.有效楼数, 1);
  assert.equal(data.系统._性爱场景.参与者['302'].有效楼数, 1);
  assert.ok(data.系统._性爱场景.参与者['302'].满意度 > 0);
  assert.equal(data.系统._性爱场景.当前行为, '阴道插入');
});

test('自由阶段历史封存和聊天级世界书保留，但不再向AI注入日常菜单', () => {
  const data = 数据(30);
  data.系统._双重继承.完成楼层 = 20;
  const oldGetMessages = globalThis.getChatMessages;
  const oldGetLast = globalThis.getLastMessageId;
  try {
    globalThis.getLastMessageId = () => 24;
    globalThis.getChatMessages = () => [
      { role: 'user', message: '结局后行动' },
      { role: 'assistant', message: '结局后正文<BianLiang>[]</BianLiang>' },
    ];
    const history = 共居.构造302自由阶段聊天历史(data, '302');
    assert.equal(history[0].role, 'system');
    assert.match(history[0].content, /已封存章节/);
    assert.equal(history.some(item => item.content.includes('BianLiang')), false);
    assert.equal(共居.构造302自由阶段聊天历史(data, '102'), null);
  } finally {
    globalThis.getChatMessages = oldGetMessages;
    globalThis.getLastMessageId = oldGetLast;
  }

  const worldbook = 共居世界书.构造302阶段世界书内容(data);
  assert.match(worldbook, /玩家当前言行继续/);
  assert.match(worldbook, /一次亲密开场接到后续相处/);
  assert.doesNotMatch(worldbook, /每日饭桌|晚归|陪坐|爽约/);
});

test('真实产品接线是一块父瓷砖、同层二选一和成功后登记，不存在第二套桌面共居折叠', () => {
  const room = read('src/人妻公寓/界面/客户端/composables/useRoomActions.ts');
  const component = read('src/人妻公寓/界面/客户端/components/房内操作抽屉.vue');
  const types = read('src/人妻公寓/界面/客户端/types.ts');
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const resources = read('src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
  const design = read('src/人妻公寓/结局后成人入口统一设计_2026-09-04.md');

  assert.match(room, /候选\.选项\.map/);
  assert.match(room, /事件\.母亲共居动作\(选项\.id\)/);
  assert.equal((room.match(/分组:\s*'302共居'\s+as const/gu) ?? []).length, 1);
  assert.match(types, /选项\?: readonly 卡动作选项\[\]/);
  assert.match(component, /当前选择动作/);
  assert.match(component, /action-choice-grid/);
  assert.match(component, /房内操作 · \{\{ actionCount \}\}项/);
  assert.doesNotMatch(component, /划分桌面302共居动作|room-actions-desktop-cohab-toggle/);
  assert.match(index, /提交302共居动作\(newData, 动作, 地点, 预期绝对时段\)/);
  assert.match(index, /if \(成功 && 开场CG\)[\s\S]*人妻公寓:302亲密开场CG/);
  assert.doesNotMatch(index.slice(index.indexOf("eventOn('人妻公寓:302共居动作'"), index.indexOf("eventOn('人妻公寓:启动录像带V4监控'")), /和她一起休息|302共居睡前丈夫登门/);
  assert.match(resources, /结局后302亲密开场正则/);
  assert.match(resources, /创建普通亲密场次\(data, 输入\.楼层, \['302'\]\)/);
  assert.match(design, /后续角色复用模板/);
  assert.match(design, /102、202、201、301/);
});
