/* eslint-disable import-x/no-nodejs-modules -- Real role predicates, snapshot and whole prompt producers */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHost, productionFunction } from './helpers/微信事务恢复环境.mjs';
import { consumerKit } from './helpers/微信余波消费环境.mjs';

function setup(relation = '退出关系') {
  const e = createHost();
  const schema = e.load('../../schema.ts');
  const data = schema.Schema.parse({ 户: Object.fromEntries(['101', '102', '201'].map(m => [m, schema.创建户节点(4)])),
    系统: { _绝对时段: 20, _许曼君分居: { 阶段: '已完成', 玩家最终关系选择: relation },
      _许曼君离婚: { 法律离婚已成立: true, 赵国强正式退居: true } },
  });
  // 与真实选择提交后的候选相同；旧档兼容解析会把缺少选择凭据的裸字段复原为未决定。
  data.系统._许曼君分居.玩家最终关系选择 = relation;
  for (const h of Object.values(data.户)) { h.妻.当前阶段 = 5; h.妻.好感值 = 90; h.妻.堕落值 = 90; }
  e.st.chat.at(-1).stat_data = data;
  e.data = data;
  e.competition = e.load('雌竞系统.ts');
  return e;
}

for (const relation of ['继续关系', '暂不承诺', '退出关系', '']) {
  test(`S02/S10 ${relation || '旧档未决定'}按当前关系派生争风资格，保留姐妹群成员`, () => {
    const e = setup(relation);
    assert.equal(e.competition.雌竞资格('201', e.data.户['201'], e.data), ['继续关系', '暂不承诺'].includes(relation));
    assert.ok(e.competition.姐妹群成员(e.data).includes('201'));
    assert.equal(e.competition.雌竞资格('101', e.data.户['101'], e.data), true);
  });
}

test('S02 两人现场只有一位当前竞者时不签发争风指令，三人时保留其他两位', () => {
  const e = setup(); const before = structuredClone(e.data);
  assert.equal(e.competition.雌竞演出块(['101', '201'], e.data, 40), '');
  const text = e.competition.雌竞演出块(['101', '102', '201'], e.data, 40);
  assert.ok(text.includes('夏乔:') && text.includes('沈静仪:'));
  assert.equal(text.includes('许曼君:'), false);
  assert.deepEqual(e.data, before);
});

test('S02 实际多人快照保留退出事实和现场人物，省去矛盾争风块', () => {
  const e = setup();
  const clock = e.load('楼层时钟.ts');
  e.data.系统._绝对时段 = Array.from({ length: 84 }, (_, i) => i).find(i => clock.seededRandom(i, '雌竞撞场') < 0.6);
  e.vars = { _场景: { 房间id: '管理员室', 进房末楼: 3 }, _粘滞: { 位置: '管理员室', 楼: 4, 们: ['201', '101'], 夫们: [] } };
  const snapshot = e.load('snapshotSystem.ts').组公寓快照([{ role: 'user', content: '和许曼君、夏乔核对报修单。' }], e.data, 4, '');
  assert.ok(snapshot.includes('退出'));
  assert.ok(snapshot.includes('许曼君'));
  assert.equal(snapshot.includes('【雌竞】'), false);
});

test('S10 姐妹群实际请求给退出角色现实往来口吻，其他角色仍有原火气', async () => {
  const e = setup(); const captures = [];
  const kit = consumerKit(e, async (system, user) => { captures.push({ system, user }); return ''; });
  const before = structuredClone(e.data);
  assert.equal(await kit.姐妹群一拍(e.data, e.api.读库(), 4, '聊聊天气。'), false, '空模型返回不能伪造群聊成功');
  assert.equal(captures.length, 1);
  const list = JSON.parse(captures[0].user.split('群成员与各自状态:\n')[1].split('\n各人自身的结局状态:')[0]);
  const item = list.find(x => x.门牌 === '201' || x.姓名 === '许曼君');
  assert.ok(item);
  assert.match(String(item.当前火气值), /事务|现实往来/);
  const other = list.find(x => x.门牌 === '101' || x.姓名 === '夏乔');
  assert.match(String(other.当前火气值), /妒火|较劲|在意/);
  assert.deepEqual(e.data, before);
});

test('S10 晒装评论实际候选排除退出角色，保留另一位合资格评论者', async () => {
  const e = setup(); const captures = [];
  const kit = consumerKit(e, async (system, user) => {
    captures.push({ system, user }); return system.includes('评论') ? '沈静仪:这颜色不错。' : '这个颜色看着很清爽。';
  });
  e.vars._换装余波 = { 门牌: '101', 起楼: 0, 物: '夏乔的新外套', 私密: false, 圈晒: false };
  const store = e.api.读库();
  for (const m of ['101', '102', '201']) store.节拍[e.api.朋友圈节拍键(m)] = 20;
  await kit.朋友圈近期流({ data: e.data, 库: store, 楼: 4, 钟: 20, 倍: 1, 冷落中门牌: new Set(), 时间线仍有效: () => true, 登记待提交余波: () => true });
  const comment = captures.find(x => x.system.includes('评论'));
  assert.ok(comment);
  assert.ok(comment.user.includes('沈静仪'));
  assert.equal(comment.user.includes('许曼君'), false);
});

test('S10 孕产观察者的当前争风火气归零，但已确认父亲事实保留', () => {
  const e = setup();
  const production = e.load('生产姐妹群系统.ts');
  const seen = e.load('微信跨渠道见闻.ts');
  e.data.户['101'].妻._怀孕.受孕场次标识 = 'known-family';
  const message = { 楼: 4, 时: 20, 会话: '姐妹群', 发: '我', 文: '先前已经确认过的家庭消息。',
    键: production.父亲认知确认键('姐妹群', '101', 'known-family'), 接收门牌: ['201'], 序: 1 };
  const read = productionFunction('手机/节拍引擎.ts', '读取孕产观察者画像', {
    ...production, ...seen, ...e.load('结局后生活社交语义.ts'),
  });
  const item = read(e.data, [message], '101', 4, 20).find(x => x.门牌 === '201');
  assert.equal(item.父亲认知, '确认');
  assert.equal(item.火气值, 0);
});

test('S02 回档到继续关系后重新派生，不清历史数值或群聊身份', () => {
  const e = setup();
  assert.equal(e.competition.雌竞资格('201', e.data.户['201'], e.data), false);
  e.data.系统._许曼君分居.玩家最终关系选择 = '继续关系';
  assert.equal(e.competition.雌竞资格('201', e.data.户['201'], e.data), true);
  assert.equal(e.data.户['201'].妻.好感值, 90);
  assert.ok(e.competition.姐妹群成员(e.data).includes('201'));
});
