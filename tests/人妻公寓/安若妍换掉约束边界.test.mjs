/* eslint-disable import-x/no-nodejs-modules -- Node-only boundary regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const bridge = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[bridge] = { id: bridge, filename: bridge, loaded: true, exports: {} };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');
const engine = require('../../src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts');
const memory = require('../../src/人妻公寓/脚本/游戏逻辑/手机/微信记忆上下文.ts');
const social = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局社交语义.ts');
// 只替代外部生成与记忆读取；群消息解析和所有生产校验均使用真实实现。
let reply = '';
let generated = 0;
engine.小生成 = async () => {
  generated++;
  return reply;
};
memory.读取群聊记忆上下文 = () => ({ 群内记忆: '', 最近聊天: '' });
const group = require('../../src/人妻公寓/脚本/游戏逻辑/手机/安若妍换照姐妹群.ts');

function fresh() {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 201: 创建户节点(0), 301: 创建户节点(0) } });
  for (const household of Object.values(data.户)) household.妻.当前阶段 = 5;
  return data;
}
function completed() {
  const data = fresh();
  data.系统._已完成特殊场景.push(route.安若妍换掉商品ID);
  Object.assign(data.系统._安若妍换掉, {
    阶段: '已完成',
    完成楼层: 1,
    最终照片体态: '普通',
    最终照片素材ID: 'ARY-RPL-10-N',
  });
  return data;
}
const lines = [
  '夏乔:你们接吻的那张也是江辰拍的？',
  '许曼君:镜头下倒是挺自然。',
  '安若妍:他按约来的，照片也是他拍的。',
  '夏乔:原来的相框还挺合适。',
  '许曼君:你喜欢就好，客厅是你自己的。',
  '安若妍:这次总算换好了。',
];

test('当前固定票采用现行文案，保留事务归属、进度和其他剧情', () => {
  const data = fresh();
  Object.assign(data.系统._安若妍换掉, { 阶段: '固定剧情中', 当前场景: 'P1', 当前票: 'saved-ticket' });
  const old = '【安若妍换掉提交:P1:saved-ticket】旧版本固定拍指令';
  Object.assign(data.系统._场景剧情事务, { id: 'persisted-id', 目标场景: '301', 内容: old, 请求世代: 7 });
  data.系统._待发送事件 = old;
  data.系统._已注入事件 = { 楼层: 10, 内容: old };
  const before = lodash.cloneDeep(data.系统._安若妍换掉);
  assert.equal(route.同步安若妍换掉当前剧情票(data), true);
  const current = data.系统._场景剧情事务.内容;
  assert.equal(data.系统._场景剧情事务.id, 'persisted-id');
  assert.equal(data.系统._场景剧情事务.请求世代, 7);
  assert.equal(data.系统._场景剧情事务.目标场景, '301');
  assert.equal(data.系统._已注入事件.楼层, 10);
  assert.equal(data.系统._待发送事件, current);
  assert.equal(data.系统._已注入事件.内容, current);
  assert.match(current, /本拍暂停普通数值结算，保持同一场次和当前现场状态/u);
  assert.deepEqual(route.解析安若妍换掉剧情事件(current), { 场景: 'P1', 票: 'saved-ticket' });
  assert.deepEqual(data.系统._安若妍换掉, before);
  assert.equal(route.同步安若妍换掉当前剧情票(data), false);
  data.系统._待发送事件 = '  其他住户的待办  ';
  assert.equal(route.同步安若妍换掉当前剧情票(data), false);
  assert.equal(data.系统._待发送事件, '  其他住户的待办  ');
  data.系统._已完成特殊场景.push(route.安若妍换掉商品ID);
  data.系统._场景剧情事务.内容 = old;
  assert.equal(route.同步安若妍换掉当前剧情票(data), false);
  assert.equal(data.系统._场景剧情事务.内容, old);
});

test('301已发照片的反应经过真实解析和验收后整批入库', async () => {
  const data = completed();
  const db = { 消息: [], 圈: [], 节拍: {} };
  const before = lodash.cloneDeep(data);
  generated = 0;
  assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2), true);
  assert.equal(generated, 0);
  reply = lines.join('\n');
  assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2), true);
  assert.equal(db.消息.length, 7);
  assert.deepEqual(
    db.消息.slice(1).map(message => message.文),
    lines,
  );
  assert.deepEqual(data, before, '群聊不能反向改写主存档');
  assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2), null);
  assert.equal(generated, 1);
});

test('301专场仍拒绝传播其他线路未公开的丈夫决定', async () => {
  const data = completed();
  const db = { 消息: [], 圈: [], 节拍: {} };
  await group.安若妍换照姐妹群一拍(data, db, 2);
  reply = lines.map((line, index) => (index === 3 ? '夏乔:陆嘉明已经同意我们的家庭安排。' : line)).join('\n');
  assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2), false);
  assert.equal(db.消息.length, 1);
});

test('普通群聊与302余波保留各自原有公开事实门', async () => {
  const names = new Set(['夏乔', '许曼君', '安若妍']);
  assert.equal((await engine.微信群文本(lines.join('\n'), names, 150, 9, '普通群聊', '姐妹')).length, 5);
  assert.equal(social.验收双重继承余波公开事实(lines[1], []), false);
});

test('已经完成301结局的旧档由完成ID开放入口，不重新要求购买前置', () => {
  const data = completed();
  data.玩家资源.体力.当前值 = 5;
  assert.equal(data.系统._安若妍不必停.阶段, '未开始');
  assert.equal(route.安若妍结局后亲密可用(data, '301'), true);
  data.系统._已完成特殊场景 = [];
  assert.equal(route.安若妍结局后亲密可用(data, '301'), false);
});

test('失效的301绑定不接管其他户当前场次的收尾和普通回合', () => {
  const data = fresh();
  Object.assign(data.系统._安若妍换掉, { 阶段: '待P1', 绑定亲密场次标识: 'old-301' });
  Object.assign(data.系统._性爱场景, {
    状态: '进行中',
    场次标识: 'current-201',
    主焦点门牌: '201',
    参与者: { 201: { 已退出: false, 有效楼数: 7, 满意度: 6, 满意目标: 6 } },
  });
  assert.equal(route.安若妍换掉接管普通收尾(data), false);
  assert.equal(route.安若妍换掉普通回合阻断原因(data, ''), '');
  assert.equal(route.安若妍换掉时间动作阻断原因(data), '');
  assert.equal(route.安若妍换掉等待硬操作(data), false);
  const session = lodash.cloneDeep(data.系统._性爱场景);
  route.恢复安若妍换掉失效亲密检查点(data);
  assert.deepEqual(data.系统._性爱场景, session);
});

test('同一301场次待拍照时继续保留暂停门和收尾门', () => {
  const data = fresh();
  Object.assign(data.系统._安若妍换掉, { 阶段: '待P1', 绑定亲密场次标识: 'current-301' });
  Object.assign(data.系统._性爱场景, {
    状态: '进行中',
    场次标识: 'current-301',
    主焦点门牌: '301',
    参与者: { 301: { 已退出: false, 有效楼数: 4, 满意度: 6, 满意目标: 6 } },
  });
  assert.equal(route.安若妍换掉接管普通收尾(data), true);
  assert.match(route.安若妍换掉普通回合阻断原因(data, ''), /拍照/);
  assert.equal(route.安若妍换掉等待硬操作(data), true);
});

test('缺失绑定字段的进行中旧档恢复为待预约，不清除其他剧情', () => {
  const data = fresh();
  Object.assign(data.系统._安若妍换掉, { 阶段: '前半', 拍立得状态: '已交付' });
  Object.assign(data.系统._场景剧情事务, { id: 'another-route', 内容: '另一位住户的固定剧情' });
  route.同步安若妍换掉时间节点(data);
  assert.equal(data.系统._安若妍换掉.阶段, '等待预约夜');
  assert.equal(data.系统._安若妍换掉.拍立得状态, '已交付');
  assert.equal(data.系统._场景剧情事务.id, 'another-route');
});

test('失效拍照恢复同时解除本线活动票，保留其他等待内容', () => {
  const data = fresh();
  Object.assign(data.系统._安若妍换掉, {
    阶段: '固定剧情中',
    当前场景: 'P1',
    当前票: 'test-ticket',
    绑定亲密场次标识: 'lost',
  });
  Object.assign(data.系统._场景剧情事务, { id: 'stale-photo', 内容: '【安若妍换掉提交:P1:test-ticket】本次拍照' });
  data.系统._待发送事件 = '下一户待处理的剧情';
  route.同步安若妍换掉时间节点(data);
  assert.equal(data.系统._安若妍换掉.阶段, '等待预约夜');
  assert.equal(data.系统._场景剧情事务.id, '');
  assert.equal(data.系统._待发送事件, '下一户待处理的剧情');
  assert.equal(route.提交安若妍换掉剧情事件(data, '【安若妍换掉提交:P1:test-ticket】', '301', 2).成功, false);
});

test('完成ID保护已冻结照片，不因历史绑定残留而回退结局', () => {
  const data = completed();
  data.系统._安若妍换掉.绑定亲密场次标识 = 'old-completed-session';
  const before = lodash.cloneDeep(data);
  route.同步安若妍换掉时间节点(data);
  assert.deepEqual(data, before);
  assert.equal(route.安若妍换掉等待硬操作(data), false);
});

test('群内公开范围只从既有消息派生，候选不能给自己补授权', async () => {
  const data = completed();
  const db = { 消息: [], 圈: [], 节拍: {} };
  assert.equal(group.验收换照群公开事实(lines[0], db.消息), false);
  await group.安若妍换照姐妹群一拍(data, db, 2);
  assert.equal(group.验收换照群公开事实('夏乔:你丈夫都知道，还替你们拍了照片。', db.消息), true);
  assert.equal(group.验收换照群公开事实('夏乔:陆嘉明同意我换盏台灯，这下看照片也方便。', db.消息), true);
  assert.equal(group.验收换照群公开事实('夏乔:我上次在机场也拍了段视频。', db.消息), true);
  assert.equal(group.验收换照群公开事实('许曼君:电影母带的色彩和拍立得确实不一样。', db.消息), true);
  assert.equal(group.验收换照群公开事实('夏乔:陆嘉明已经同意我们的家庭安排。', db.消息), false);
  db.消息.push({ 会话: '姐妹群', 键: '父亲确认:姐妹群:101:prior', 文: '此前由脚本确认的家庭公开消息' });
  assert.equal(group.验收换照群公开事实('夏乔:陆嘉明已经同意我们的家庭安排。', db.消息), true);
  assert.equal(group.验收换照群公开事实('许曼君:把那份母带里的内容告诉大家吧。', db.消息), false);
  assert.equal(group.验收换照群公开事实('母亲:父亲已经知道我和管理员的关系。', db.消息), false);
  const motherStatement = '母亲:我和管理员在一起的事，之前就说过了。';
  assert.equal(group.验收换照群公开事实(motherStatement, db.消息), false);
  db.消息.push({ 会话: '姐妹群', 键: '回国茶话会:坦白:test:prior:1', 文: '此前由脚本确认的公开消息' });
  assert.equal(group.验收换照群公开事实(motherStatement, db.消息), true);
});

test('生成停止和迟到结果不消费反应键，下一次有效请求仍能完成', async () => {
  const data = completed();
  const db = { 消息: [], 圈: [], 节拍: {} };
  await group.安若妍换照姐妹群一拍(data, db, 2);
  const before = lodash.cloneDeep(db);
  const normalGenerator = engine.小生成;
  let valid = true;
  try {
    engine.小生成 = async () => {
      valid = false;
      return lines.join('\n');
    };
    assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2, { 仍有效: () => valid }), false);
    assert.deepEqual(db, before);
    engine.小生成 = async () => {
      throw new Error('停止生成');
    };
    await assert.rejects(group.安若妍换照姐妹群一拍(data, db, 2), /停止生成/);
    assert.deepEqual(db, before);
  } finally {
    engine.小生成 = normalGenerator;
  }
  reply = lines.join('\n');
  assert.equal(await group.安若妍换照姐妹群一拍(data, db, 2), true);
  assert.equal(db.消息.length, 7);
});

test('启动与已删时间线收口在重建界面前保存301失效检查点修复', () => {
  const index = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const engineSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  assert.match(index, /const 安若妍换掉检查点有修正 = 恢复安若妍换掉失效亲密检查点\(data\)/u);
  assert.match(index, /安若妍换掉检查点有修正 \|\|[\s\S]{0,320}await 脚本写入\(raw, data\)/u);
  assert.match(
    engineSource,
    /恢复安若妍换掉失效亲密检查点\(当前真值\)[\s\S]{0,340}脚本写入\(存活.raw, 当前真值[\s\S]{0,180}捕获保护快照\(当前真值\)/u,
  );
});
