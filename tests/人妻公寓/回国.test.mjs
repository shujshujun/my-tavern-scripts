/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let chatVars = {};
globalThis.getVariables = () => chatVars;
globalThis.insertOrAssignVariables = patch => {
  chatVars = lodash.merge({}, chatVars, patch);
};

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const YAML = require('yaml');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 道具表, 角色剧情占位表, 特殊场景表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 购买, 取货架 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 姐妹群成员, 雌竞资格 } = require('../../src/人妻公寓/脚本/游戏逻辑/雌竞系统.ts');
const { 追加等待场景剧情 } = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const {
  回国经营归档册ID,
  回国私人物件箱ID,
  回国已上锁箱ID,
  回国母亲无需收尾消息键,
  回国母亲确认准备消息键,
  回国母亲入群消息键,
  回国姐妹群改名消息键,
  回国姐妹群改名反应消息键前缀,
  回国姐妹群改名延迟毫秒,
  回国母亲入群系统文案,
  生成回国姐妹群昵称,
  回国姐妹群改名系统文案,
  读取回国姐妹群昵称,
  读取回国姐妹群待改昵称,
  读取回国经营资格,
  回国经营归档册已上架,
  使用回国经营归档册,
  回国地点动作,
  执行回国地点动作,
  提交回国剧情事件,
  回国父亲通知可送达,
  提交回国父亲通知已送达,
  提交回国母亲加入姐妹群,
  提交回国茶话会批次,
  下一个回国茶话会后私聊成员,
  暂缓回国茶话会后私聊,
  提交回国父亲询问已送达,
  提交回国父亲准备答复已送达,
  提交回国父亲会话母亲气泡,
  回国CG标题,
  回国正文越拍原因,
} = require('../../src/人妻公寓/脚本/游戏逻辑/回国系统.ts');

const initvar = YAML.parse(
  readFileSync(new URL('../../src/人妻公寓/世界书/变量/initvar.yaml', import.meta.url), 'utf8'),
);
const 路线源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回国系统.ts', import.meta.url), 'utf8');
const 通知源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts', import.meta.url), 'utf8');
const 群聊源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');
const 聊天渲染源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/chat.ts', import.meta.url),
  'utf8',
);
const 聊天列表源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/chats.ts', import.meta.url),
  'utf8',
);
const 客户端源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 房间动作源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts', import.meta.url),
  'utf8',
);
const 回合引擎源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const index源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 发送源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts', import.meta.url),
  'utf8',
);
const 回国手机源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/回国手机.ts', import.meta.url), 'utf8');
const 资源源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/assets.ts', import.meta.url), 'utf8');

function 建回国数据(其他门牌 = []) {
  const 户 = { 302: 创建户节点(0) };
  for (const 门牌 of 其他门牌) 户[门牌] = 创建户节点(0);
  const data = Schema.parse({ 户, 系统: { _绝对时段: 0, _母亲入列: true }, 现金: 5000, 胜任度: 90 });
  data.户['302'].妻.当前阶段 = 5;
  data.户['302'].妻.阶段性癖 = 户静态表['302'].招牌性癖;
  for (const 门牌 of 其他门牌) {
    data.户[门牌].妻.当前阶段 = 4;
    data.户[门牌].妻.阶段性癖 = 户静态表[门牌].招牌性癖;
  }
  return data;
}

function 跑完剧情(data, 初始结果, 地点) {
  assert.equal(初始结果.成功, true);
  let 事件 = 初始结果.事件;
  let 最终 = 初始结果;
  while (事件) {
    最终 = 提交回国剧情事件(data, 事件, 地点, 100);
    assert.equal(最终?.成功, true, 最终?.提示);
    事件 = 最终?.后续剧情?.事件;
  }
  return 最终;
}

test('Schema、schema.json 与 initvar 补齐《回国》独立生命周期，母亲线只有回国和双重继承', () => {
  const 空 = Schema.parse({});
  assert.equal(空.系统._回国.阶段, '未开始');
  assert.equal(空.系统._回国.茶话会状态, '未开始');
  assert.equal(空.系统._回国.群名反应已完成, false);
  assert.deepEqual(initvar.系统._回国, 空.系统._回国);
  assert.equal(角色剧情占位表['角色路线:302:操作性剧情'], undefined);
  assert.equal(角色剧情占位表['角色路线:302:结局剧情'], undefined);
  assert.equal(角色剧情占位表.双重继承, undefined, '双重继承是正式商店结局，不再占用待设计占位');
  assert.equal(道具表.双重继承.价格, 1500);
  assert.equal(特殊场景表.双重继承.启动.地点, '管理员室');
  assert.equal(道具表.公寓楼总钥匙.名称, '公寓楼总钥匙');
});

test('母亲入群提示先落库，约五秒后才真实改群名并允许角色回应', () => {
  const 群昵称 = 生成回国姐妹群昵称('罗恒');
  assert.equal(群昵称, '罗恒人妻后宫群');
  assert.equal(生成回国姐妹群昵称('  罗\n恒  '), '罗恒人妻后宫群');
  assert.equal(生成回国姐妹群昵称(''), '管理员人妻后宫群');
  assert.equal(回国姐妹群改名延迟毫秒, 5000);
  assert.equal(回国姐妹群改名反应消息键前缀, '回国茶话会:改名反应:');

  assert.equal(回国母亲入群系统文案, '你邀请“母亲”加入了群聊');
  const 改名文案 = 回国姐妹群改名系统文案(群昵称);
  assert.equal(改名文案, '“母亲”修改群名为“罗恒人妻后宫群”');
  assert.equal(
    读取回国姐妹群昵称([
      { 会话: '姐妹群', 键: '普通消息', 文: '夏乔:这名字谁起的' },
      { 会话: '姐妹群', 键: 回国姐妹群改名消息键, 文: 改名文案 },
    ]),
    群昵称,
  );
  assert.equal(读取回国姐妹群昵称([{ 会话: '姐妹群', 键: '普通消息', 文: 改名文案 }]), null, '普通台词不得伪造群改名');
  assert.equal(
    读取回国姐妹群待改昵称([
      {
        会话: '姐妹群',
        键: 回国母亲入群消息键,
        群昵称,
      },
    ]),
    群昵称,
    '五秒等待被刷新打断后必须从邀请硬消息恢复当时冻结的 Persona 群名',
  );
  assert.equal(
    读取回国姐妹群待改昵称([{ 会话: '姐妹群', 键: '普通消息', 群昵称 }]),
    null,
    '普通消息扩展字段不得伪造待改群名',
  );

  const 入群起点 = 通知源码.indexOf('export async function 写回国母亲入群消息');
  const 改名起点 = 通知源码.indexOf('export async function 写回国姐妹群改名消息');
  const 入群函数 = 通知源码.slice(入群起点, 改名起点);
  const 改名函数 = 通知源码.slice(改名起点);
  assert.match(入群函数, /回国母亲入群消息键/);
  assert.match(
    入群函数,
    /const Persona名 = 读取回国姐妹群待改Persona\(初始库\.消息\) \?\? 玩家名\(\)/,
    '邀请点击时必须冻结当前 Persona；旧孤立消息恢复时沿用其冻结名',
  );
  assert.match(入群函数, /构造回国母亲邀请事务\([\s\S]*Persona名/);
  assert.match(入群函数, /写入回国母亲邀请主状态\(事务\)[\s\S]*完成回国母亲邀请事务\(事务, false\)/);
  assert.match(
    通知源码,
    /键: 回国母亲入群消息键,[\s\S]*标识: 事务\.事务ID,[\s\S]*群昵称,/,
    '冻结昵称与事务ID必须随入群硬消息持久化',
  );
  assert.doesNotMatch(入群函数, /回国姐妹群改名消息键/, '入群提示与改名提示不得同批落库');
  assert.match(改名函数, /生成回国姐妹群昵称\(玩家名\(\)\)/, '玩家名应直接读取当前酒馆 Persona');
  assert.match(改名函数, /回国母亲入群消息键[\s\S]*回国姐妹群改名消息键/, '没有真实入群提示时不得凭空改名');
  assert.match(聊天渲染源码, /读取回国姐妹群昵称\(库\.消息\)/);
  assert.match(聊天渲染源码, /母亲正在修改群名/);
  assert.match(
    聊天渲染源码,
    /data\.系统\._回国\.阶段 === '姐妹茶话会进行中'[\s\S]*等待回国群名反应提交[\s\S]*queueMicrotask[\s\S]*人妻公寓:恢复回国姐妹群改名/,
    '五秒内刷新或首拍已落库未提交时，持久硬消息应立即锁住界面并主动恢复收口',
  );
  assert.match(
    聊天渲染源码,
    /ta\.disabled = 回国群首拍收口中 \|\| 外部输入中 \|\| 状态\.灯 === '红'/,
    '刷新丢失内存输入租约或路线提交较慢时，界面仍不得短暂开放输入',
  );
  assert.match(聊天渲染源码, /回国母亲入群消息键 \|\| m\.键 === 回国姐妹群改名消息键/);
  assert.match(聊天列表源码, /读取回国姐妹群昵称\(库\.消息\)/);
  assert.match(聊天列表源码, /_\.escape\(友\.名\)/, '动态 Persona 群名必须按纯文本转义');
  assert.match(群聊源码, /任务 = '改名反应'/);
  assert.match(群聊源码, /Math\.min\(2, 其他成员\.length\)/, '首拍应保证至多两名其他成员真实回应改名');
  assert.match(
    群聊源码,
    /母亲首条索引[\s\S]*索引 >= 0 && 索引 < 母亲首条索引/,
    '首拍不能只保证成员存在，还必须保证其他成员先反应、母亲随后接话',
  );
  assert.match(群聊源码, /不得提前坦白母亲与管理员的具体关系/);
  assert.match(群聊源码, /export async function 同步回国延迟改名与群名反应/);
  assert.match(群聊源码, /setTimeout\(resolve, 回国姐妹群改名延迟毫秒\)/, '改名必须真实等待约五秒');
  assert.match(
    群聊源码,
    /读取回国姐妹群待改昵称\(当前库\.消息\) \?\? 生成回国姐妹群昵称\(玩家名\(\)\)/,
    '刷新后恢复必须优先读取邀请硬消息里的冻结昵称',
  );
  assert.match(
    群聊源码,
    /写回国姐妹群改名消息\(群昵称\)[\s\S]*同步回国群名反应\(改名后数据\)/,
    '角色反应只能在改名系统记录成功后开始',
  );
  assert.match(群聊源码, /开始会话输入\('姐妹群'/, '五秒等待和自动首拍期间应锁定群输入');
  assert.match(群聊源码, /微信小群“\$\{群昵称\}”/);
  assert.match(index源码, /同步回国延迟改名与群名反应\(data\)/, '入群状态提交后应启动延迟改名链');
  assert.match(
    index源码,
    /eventOn\('人妻公寓:恢复回国姐妹群改名'[\s\S]*读最近有效stat\(\)[\s\S]*同步回国延迟改名与群名反应\(data\)/,
    'chat 页的刷新恢复事件必须从最新 stat 重启带租约的五秒演出',
  );
  const 邀请处理起点 = index源码.indexOf("eventOn('人妻公寓:邀请母亲加入姐妹群'");
  const 邀请处理片段 = index源码.slice(邀请处理起点, index源码.indexOf("eventOn('人妻公寓:回国茶话会批次完成'", 邀请处理起点));
  assert.ok(
    邀请处理片段.indexOf('回国母亲可邀请入群(data)') < 邀请处理片段.indexOf('写回国母亲入群消息()'),
    '陈旧邀请按钮必须在写系统消息前复核最新路线资格',
  );
  assert.match(
    发送源码,
    /读取回国母亲邀请事务\(发送前数据\)[\s\S]*母亲正在加入群聊，等系统提示完成后再说/,
    '主状态邀请意图存在时，后端必须在微信消息与路线提交之间继续锁住输入',
  );
  assert.match(
    发送源码,
    /发送前数据\.系统\._回国\.阶段 === '姐妹茶话会进行中'[\s\S]*母亲正在修改群名，等系统提示出现后再说/,
    '后端只在真实回国改名阶段阻断，孤立旧消息不得永久锁死普通群聊',
  );
  assert.match(
    发送源码,
    /回国姐妹群改名反应消息键前缀[\s\S]*群成员这一轮还在收口/,
    '首拍气泡已落库但路线提交尚未完成时，后端也必须阻止重复生成',
  );
  assert.match(发送源码, /改名反应\|坦白\|点评/, '自动首拍失败时玩家群消息仍能补跑同一任务');
});

test('经营归档册只在母亲L5、哺育癖完成且经营满意时上架，购买不触发父亲微信', () => {
  const data = 建回国数据();
  data.户['302'].妻.当前阶段 = 4;
  assert.equal(回国经营归档册已上架(data), false);
  data.户['302'].妻.当前阶段 = 5;
  assert.equal(读取回国经营资格(data).通过, true);
  assert.ok(取货架(data).some(页 => 页.商品.some(商品 => 商品.id === 回国经营归档册ID)));
  const 现金 = data.现金;
  const 结果 = 购买(data, 回国经营归档册ID);
  assert.equal(结果.成功, true);
  assert.equal(data.现金, 现金 - 道具表[回国经营归档册ID].价格);
  assert.equal(data.系统._回国.阶段, '待使用经营归档册');
  assert.equal(data.背包.includes(回国经营归档册ID), true);
  assert.equal(回国父亲通知可送达(data), false, '购买本身不得触发父亲微信');
});

test('管理员室两拍归档成功后至少等待一个完整游戏日和安全下午才发送回国通知', () => {
  const data = 建回国数据();
  assert.equal(购买(data, 回国经营归档册ID).成功, true);
  const 开始 = 使用回国经营归档册(data, '管理员室');
  跑完剧情(data, 开始, '管理员室');
  assert.equal(data.系统._回国.阶段, '待父亲回信');
  assert.equal(data.背包.includes(回国经营归档册ID), false);
  assert.equal(data.系统._回国.父亲最早回信日, 2);
  data.系统._绝对时段 = 7;
  assert.equal(回国父亲通知可送达(data), false, '第二天中午仍不能送达');
  data.系统._绝对时段 = 8;
  assert.equal(回国父亲通知可送达(data), true, '第二天下午才到安全送达窗口');
  assert.equal(提交回国父亲通知已送达(data).成功, true);
  assert.equal(data.系统._回国.阶段, '待读回国消息');
});

test('302阅读、三拍封箱、管理员室存箱与三拍管理记录逐步推进且不越拍消费', () => {
  const data = 建回国数据();
  data.系统._回国.阶段 = '待读回国消息';
  data.系统._绝对时段 = 8;
  assert.equal(回国地点动作(data, '302')[0]?.id, '阅读回国消息');
  跑完剧情(data, 执行回国地点动作(data, '阅读回国消息', '302'), '302');
  assert.equal(data.系统._回国.阶段, '待收纳');
  assert.equal(购买(data, 回国私人物件箱ID).成功, true);
  跑完剧情(data, 执行回国地点动作(data, '收纳私人物件', '302'), '302');
  assert.equal(data.系统._回国.阶段, '待存箱');
  assert.equal(data.背包.includes(回国已上锁箱ID), true);
  assert.equal(执行回国地点动作(data, '存放私人物件箱', '管理员室').成功, true);
  assert.equal(data.系统._回国.阶段, '待看记录');
  data.系统._绝对时段 = 14;
  跑完剧情(data, 执行回国地点动作(data, '查看管理记录', '管理员室'), '管理员室');
  assert.equal(data.系统._回国.阶段, '待姐妹茶话会');
});

test('开发期已掉队的回国后续票可按冻结现场恢复，未来分支票仍失败关闭', () => {
  const data = 建回国数据();
  data.系统._回国.阶段 = '待读回国消息';
  data.系统._绝对时段 = 8;
  const 第一拍 = 执行回国地点动作(data, '阅读回国消息', '302');
  const 第一拍提交 = 提交回国剧情事件(data, 第一拍.事件, '302', 20);
  assert.equal(第一拍提交?.成功, true);
  const 第二拍 = 第一拍提交.后续剧情.事件;
  assert.match(第二拍, /场景剧情需回应/);

  data.系统._绝对时段 = 9;
  const 恢复 = 提交回国剧情事件(data, 第二拍, '302', 21);
  assert.equal(恢复?.成功, true, 恢复?.提示);
  assert.equal(data.系统._回国.阶段, '待收纳');

  const 回档 = 建回国数据();
  回档.系统._回国.阶段 = '待读回国消息';
  回档.系统._绝对时段 = 7;
  const 未来票 = 提交回国剧情事件(回档, 第二拍, '302', 19);
  assert.equal(未来票?.成功, false);
  assert.match(未来票?.提示 ?? '', /未来|时间线|尚未/);
});

test('回国互斥按活动事务与当前地点解释，远处普通预约不再靠上层巧合全局吞动作', () => {
  const 远处 = 建回国数据();
  远处.系统._回国.阶段 = '待读回国消息';
  远处.系统._绝对时段 = 8;
  追加等待场景剧情(远处, '【远处剧情】留在101等待', '101', '远处剧情');
  assert.equal(执行回国地点动作(远处, '阅读回国消息', '302').成功, true);

  const 同场 = 建回国数据();
  同场.系统._回国.阶段 = '待读回国消息';
  同场.系统._绝对时段 = 8;
  追加等待场景剧情(同场, '【同场剧情】先在302处理', '302', '同场剧情');
  const 同场拒绝 = 执行回国地点动作(同场, '阅读回国消息', '302');
  assert.equal(同场拒绝.成功, false);
  assert.match(同场拒绝.提示, /场景剧情/);

  const 活动 = 建回国数据();
  活动.系统._回国.阶段 = '待读回国消息';
  活动.系统._绝对时段 = 8;
  活动.系统._场景剧情事务.id = 'active-with-empty-status';
  活动.系统._场景剧情事务.状态 = '';
  const 活动拒绝 = 执行回国地点动作(活动, '阅读回国消息', '302');
  assert.equal(活动拒绝.成功, false, '不能再用 .状态 代替真实活动事务 id');
});

test('回国逐拍正文越界会被识别，两条正文路径都必须在提交前失败关闭', () => {
  const data = 建回国数据();
  data.系统._回国.阶段 = '待读回国消息';
  data.系统._绝对时段 = 8;
  const 阅读一 = 执行回国地点动作(data, '阅读回国消息', '302').事件;
  assert.equal(回国正文越拍原因(阅读一, '母亲读完消息，开始分辨哪些现实需要处理。'), '');
  assert.match(回国正文越拍原因(阅读一, '母亲已经把私人物件全部收进箱子并亲手上锁。'), /提前|越过/);

  data.系统._回国.阶段 = '待收纳';
  data.背包.push(回国私人物件箱ID);
  const 收纳一 = 执行回国地点动作(data, '收纳私人物件', '302').事件;
  assert.match(回国正文越拍原因(收纳一, '她把物件分类完毕，合上箱盖并落锁，把钥匙交给玩家。'), /提前|越过/);
  assert.equal(回国正文越拍原因(收纳一, '箱子仍然敞开着，并没有分类或上锁。'), '');

  assert.match(回合引擎源码, /回国正文越拍原因\(本楼事件/);
  assert.match(回合引擎源码, /《回国》当前剧情回合两次未能停在正确节点/);
  assert.match(index源码, /回国正文越拍原因\(本楼事件/);
});

test('茶话会后私聊空生成只顺延一个世界时段，不消费成员也不在同一时段反复调用', () => {
  const data = 建回国数据(['101', '102']);
  data.系统._回国.阶段 = '待旧委托';
  data.系统._回国.茶话会状态 = '已完成';
  data.系统._回国.后续私聊待触发成员 = ['101', '102'];
  data.系统._回国.后续私聊已触发成员 = [];
  data.系统._回国.后续私聊最早时段 = 8;
  data.系统._绝对时段 = 8;
  assert.equal(下一个回国茶话会后私聊成员(data), '101');
  const 暂缓 = 暂缓回国茶话会后私聊(data, '101');
  assert.equal(暂缓.成功, true);
  assert.equal(data.系统._回国.后续私聊最早时段, 9);
  assert.deepEqual(data.系统._回国.后续私聊待触发成员, ['101', '102']);
  assert.equal(下一个回国茶话会后私聊成员(data), null);
  data.系统._绝对时段 = 9;
  assert.equal(下一个回国茶话会后私聊成员(data), '101');

  assert.match(回国手机源码, /回国茶话会后私聊暂缓/);
  assert.match(index源码, /人妻公寓:回国茶话会后私聊暂缓/);
});

test('Claude 已落下的回应标记、必达拍旁路和等待日动作分层保持可验证', () => {
  const data = 建回国数据();
  data.系统._回国.阶段 = '待存箱';
  data.系统._回国.最早继续日 = 99;
  data.背包.push(回国已上锁箱ID);
  assert.equal(回国地点动作(data, '管理员室')[0]?.id, '存放私人物件箱');
  assert.match(路线源码, /场景剧情连续锁场[\s\S]*场景剧情需回应/);
  assert.match(群聊源码, /const 必达节拍[\s\S]*if \(!必达节拍\)/);
  assert.match(发送源码, /读取整批实存气泡/);
  assert.match(发送源码, /新回国茶话会批次标识/);
});

test('母亲以非雌竞特殊成员永久加入姐妹群，茶话会任务完成后切回普通群逻辑', () => {
  const data = 建回国数据(['101', '102']);
  data.系统._回国.阶段 = '待姐妹茶话会';
  data.系统._回国.茶话会状态 = '入群演绎';
  assert.equal(提交回国母亲加入姐妹群(data).成功, true);
  assert.equal(data.系统._回国.阶段, '姐妹茶话会进行中');
  assert.deepEqual(new Set(data.系统._回国.茶话会成员快照), new Set(['101', '102']));
  assert.equal(姐妹群成员(data).includes('302'), true);
  assert.equal(雌竞资格('302', data.户['302']), false, '母亲不得因入群获得雌竞资格');
  assert.equal(data.系统._回国.群名反应已完成, false);
  // 此处验证状态机，用具有明确内容及同批次键的代表性已存消息；真实写库链另有专项覆盖。
  const submit = (payload, lines) => {
    const target = payload.目标 || payload.回应成员?.join(',') || '-';
    return 提交回国茶话会批次(data, payload, lines.map((文, i) => ({ 会话: '姐妹群', 发: '对方', 文, 键: `回国茶话会:${payload.任务}:${target}:aRouteTest:${i + 1}` })));
  };
  const confession = ['母亲:我和管理员已经不只是普通母子，我们是伴侣。'];
  assert.equal(submit({ 任务: '坦白' }, confession).成功, false, '母亲坦白不得越过群名反应首拍');
  assert.equal(submit({ 任务: '改名反应', 玩家已发言: false }, ['夏乔:这个新群名真有趣。', '沈静仪:我也看见了。', '母亲:看来大家都看见我取的新名字了。']).成功, true);
  assert.equal(data.系统._回国.群名反应已完成, true);
  assert.equal(submit({ 任务: '坦白', 玩家已发言: true }, confession).成功, true);
  for (const 门牌 of ['101', '102']) {
    const name = require('../../src/人妻公寓/stageConfig.ts').户静态表[门牌].妻名;
    assert.equal(submit({ 任务: '点评', 目标: 门牌, 玩家已发言: true }, [`母亲:${name}，你最近看管理员的眼神藏不住心思了。`, `${name}:我就是在意他。`]).成功, true);
  }
  assert.equal(submit({ 任务: '转正事', 玩家已发言: true }, ['母亲:你爸一周后回国，公共区域大家按普通住户和管理员的关系相处。']).成功, true);
  assert.equal(submit({ 任务: '回应回国', 回应成员: ['101', '102'], 玩家已发言: true }, ['夏乔:到时照常打招呼。', '沈静仪:我知道了。']).成功, true);
  const 收束 = submit({ 任务: '收束', 玩家已发言: true, 摘要: '正事已说明，群聊继续。' }, ['母亲:正事说清楚了，大家照常过日子。']);
  assert.equal(收束.成功, true);
  assert.equal(data.系统._回国.阶段, '待旧委托');
  assert.equal(data.系统._回国.茶话会状态, '已完成');
  assert.equal(姐妹群成员(data).includes('302'), true, '特殊演绎结束后母亲仍留在普通姐妹群');
});

test('大堂旧委托只在下午出现，深夜夜谈只在次日深夜出现并排入父亲询问', () => {
  const data = 建回国数据();
  data.系统._回国.阶段 = '待旧委托';
  data.系统._回国.最早继续日 = 1;
  data.系统._绝对时段 = 13;
  assert.equal(回国地点动作(data, '大堂').length, 0, '中午不得提前出现旧维修人员');
  data.系统._绝对时段 = 14;
  跑完剧情(data, 执行回国地点动作(data, '接待旧维修人员', '大堂'), '大堂');
  assert.equal(data.系统._回国.阶段, '待夜谈');
  data.系统._绝对时段 = 20;
  assert.equal(回国地点动作(data, '管理员室').length, 0, '次日之前不得出现夜谈');
  data.系统._绝对时段 = 23;
  跑完剧情(data, 执行回国地点动作(data, '深夜夜谈', '管理员室'), '管理员室');
  assert.equal(data.系统._回国.阶段, '待父亲询问');
  assert.equal(data.系统._回国.父亲最早回信时段, 24);
});

test('父亲会话仅用两条一次性母亲固定气泡推进，不增加通用说话人协议', () => {
  const data = 建回国数据();
  data.系统._回国.阶段 = '待父亲询问';
  data.系统._回国.父亲最早回信时段 = 1;
  data.系统._绝对时段 = 1;
  assert.equal(提交回国父亲询问已送达(data).成功, true);
  assert.equal(data.系统._回国.阶段, '待母亲回复父亲');
  assert.equal(提交回国父亲会话母亲气泡(data, '无需收尾', 30).成功, true);
  assert.equal(data.系统._回国.阶段, '待父亲准备答复');
  data.系统._绝对时段 = 2;
  assert.equal(提交回国父亲准备答复已送达(data).成功, true);
  assert.equal(data.系统._回国.阶段, '待确认交接意向');
  assert.equal(提交回国父亲会话母亲气泡(data, '确认准备', 31).成功, true);
  assert.equal(data.系统._回国.阶段, '已完成');
  assert.equal(data.系统._已完成特殊场景.includes('回国'), true);
  assert.match(路线源码, new RegExp(回国母亲无需收尾消息键));
  assert.match(路线源码, new RegExp(回国母亲确认准备消息键));
  assert.match(通知源码, /回国母亲无需收尾消息键/);
  assert.match(通知源码, /回国母亲确认准备消息键/);
  assert.match(聊天渲染源码, /是回国母亲气泡[\s\S]*?'母亲'/);
  assert.doesNotMatch(路线源码, /说话人\?\s*:/);
});

test('产品接线覆盖商店、背包使用、地图瓷砖、姐妹群任务与原生正文提交', () => {
  assert.match(客户端源码, /@use-return-file="使用回国经营归档册"/);
  assert.match(客户端源码, /eventEmit\('人妻公寓:回国动作'/);
  assert.match(房间动作源码, /添加回国动作\(动作, id\)/);
  assert.match(群聊源码, /当前任务:[\s\S]*回国姐妹茶话会/);
  assert.match(路线源码, /回国提交:/);
  const index源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  assert.match(index源码, /解析回国剧情事件/);
  assert.match(index源码, /提交回国剧情事件/);
  assert.match(index源码, /排入回国后续剧情/);
  assert.match(回合引擎源码, /解析回国剧情事件/);
  assert.match(回合引擎源码, /提交回国剧情事件/);
  assert.match(回合引擎源码, /排入回国后续剧情/);
});

test('《回国》九张CG逐节点稳定映射，图片只是成功提交后的视觉载荷', () => {
  const data = 建回国数据(['101']);

  assert.equal(购买(data, 回国经营归档册ID).成功, true);
  assert.equal(跑完剧情(data, 使用回国经营归档册(data, '管理员室'), '管理员室').CG, '回国_01_管理员室整理经营归档');
  data.系统._回国.阶段 = '待读回国消息';
  data.系统._绝对时段 = 8;
  assert.equal(跑完剧情(data, 执行回国地点动作(data, '阅读回国消息', '302'), '302').CG, '回国_02_302共同阅读回国消息');
  assert.equal(购买(data, 回国私人物件箱ID).成功, true);
  assert.equal(跑完剧情(data, 执行回国地点动作(data, '收纳私人物件', '302'), '302').CG, '回国_03_302清点私人物件箱');
  assert.equal(执行回国地点动作(data, '存放私人物件箱', '管理员室').CG, '回国_04_管理员室锁存私人物件箱');
  data.系统._绝对时段 += 6;
  assert.equal(
    跑完剧情(data, 执行回国地点动作(data, '查看管理记录', '管理员室'), '管理员室').CG,
    '回国_05_母亲核对平常管理记录',
  );
  data.系统._回国.茶话会状态 = '入群演绎';
  assert.equal(提交回国母亲加入姐妹群(data).CG, '回国_06_母亲加入姐妹茶话会');
  data.系统._回国.阶段 = '待旧委托';
  data.系统._回国.最早继续日 = 0;
  data.系统._绝对时段 = 8;
  assert.equal(
    跑完剧情(data, 执行回国地点动作(data, '接待旧维修人员', '大堂'), '大堂').CG,
    '回国_07_大堂接待旧维修人员',
  );
  data.系统._回国.最早继续日 = 0;
  data.系统._绝对时段 = 11;
  assert.equal(
    跑完剧情(data, 执行回国地点动作(data, '深夜夜谈', '管理员室'), '管理员室').CG,
    '回国_08_管理员室深夜夜谈',
  );
  data.系统._回国.阶段 = '待母亲回复父亲';
  assert.equal(提交回国父亲会话母亲气泡(data, '无需收尾', 30).CG, '回国_09_302父亲会话协同回复');

  assert.equal(回国CG标题('回国_09_302父亲会话协同回复'), '302 · 三人协同回复');
  assert.equal(data.系统._回国.阶段, '待父亲准备答复', '关闭CG或图片失败没有可回滚的视觉侧状态');
});

test('《回国》正式WebP只从源素材稳定路由，不接入联系表或rejected过程图', () => {
  const 目录 = new URL('../../src/人妻公寓/素材/特殊场景/回国/', import.meta.url);
  const 文件 = readdirSync(目录).sort();
  assert.equal(文件.filter(名 => 名.endsWith('.webp')).length, 9);
  assert.equal(
    文件.some(名 => 名.includes('联系表') || 名.includes('rejected')),
    false,
  );
  assert.match(资源源码, /rq091\/story/);
  assert.doesNotMatch(资源源码, /output\/imagegen\/return-home/);
  assert.match(客户端源码, /eventOn\('人妻公寓:回国CG'/);
});


test('《回国》完成不冻结父亲抵达时段，只口头开放后续结局', () => {
  const data = 建回国数据();
  data.系统._绝对时段 = 44;
  data.系统._回国.阶段 = '待父亲准备答复';
  data.系统._回国.父亲最早回信时段 = 44;
  assert.equal(提交回国父亲准备答复已送达(data).成功, true);
  assert.equal(data.系统._回国.阶段, '待确认交接意向');
  assert.equal('父亲回国绝对时段' in data.系统._回国, false, '《回国》不得保存父亲真实到楼时点');
  const 完成 = 提交回国父亲会话母亲气泡(data, '确认准备', 88);
  assert.equal(完成.成功, true);
  assert.equal(data.系统._回国.阶段, '已完成');
  assert.equal(data.系统._已完成特殊场景.includes('回国'), true);
  assert.equal('父亲回国绝对时段' in data.系统._回国, false, '完成后仍不得产生隐藏抵达字段');
  assert.match(完成.提示, /商店|双重继承|使用场景票/);
  assert.doesNotMatch(路线源码, /计算父亲回国时段/);
});


test('《回国》完成只保留口头回国事实，不计算、不冻结也不自动触发父亲到楼', () => {
  assert.doesNotMatch(路线源码, /function 计算父亲回国时段/);
  assert.doesNotMatch(路线源码, /父亲回国绝对时段\s*=/);
  assert.match(路线源码, /父亲已经答应近期回国/);
  assert.match(路线源码, /只有你使用场景票后，父亲才会真正回楼/);
});

test('《回国》硬动作在其他特殊场景、荣耀洞或母亲医院硬锁期间不可见也不可执行', () => {
  for (const 占用 of ['特殊场景', '荣耀洞', '医院']) {
    const data = 建回国数据();
    data.系统._回国.阶段 = '待存箱';
    data.背包.push(回国已上锁箱ID);
    if (占用 === '特殊场景') data.系统._特殊场景.id = '录像带';
    if (占用 === '荣耀洞') data.系统._荣耀洞拍 = 0;
    if (占用 === '医院') data.户['302'].妻._生产.状态 = '住院中';

    assert.equal(回国地点动作(data, '管理员室').some(动作 => 动作.id === '存放私人物件箱'), false, `${占用}期间不应显示硬动作`);
    const 结果 = 执行回国地点动作(data, '存放私人物件箱', '管理员室');
    assert.equal(结果.成功, false, `${占用}期间旧页面按钮也必须失败关闭`);
    assert.equal(data.系统._回国.阶段, '待存箱');
    assert.equal(data.背包.includes(回国已上锁箱ID), true);
  }
});

test('《回国》迟到剧情票在其他强剧情抢先开始后不得推进，当前路线硬状态保持可重试', () => {
  const data = 建回国数据();
  data.系统._回国.阶段 = '待看记录';
  data.系统._绝对时段 = 14;
  const 开始 = 执行回国地点动作(data, '查看管理记录', '管理员室');
  assert.equal(开始.成功, true, 开始.提示);
  data.系统._特殊场景.id = '借种';

  const 迟到 = 提交回国剧情事件(data, 开始.事件, '管理员室', 200);
  assert.equal(迟到?.成功, false);
  assert.equal(data.系统._回国.阶段, '待看记录');
  assert.equal(迟到?.后续剧情, undefined);
});
