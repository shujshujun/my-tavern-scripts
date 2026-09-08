/* eslint-disable import-x/no-nodejs-modules -- 真实必达群/解析/确认键/逐人画像/私聊请求，提供方和宿主受控。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { clone } from './helpers/微信事务恢复环境.mjs';
import { createPhoneHost, pregnancyKit } from './helpers/手机并行第二组环境.mjs';

function fixture(family = true) {
  const e = createPhoneHost();
  const data = e.st.chat.at(-1).stat_data;
  data.户['201'] = clone(data.户['101']);
  for (const node of Object.values(data.户)) {
    Object.assign(node.妻, { 当前阶段: 4, 好感值: 60, 堕落值: 40, 上次互动楼层: 4 });
    node.妻.裂缝.已确认 = true;
  }
  e.scene = family ? '借种结局:101:40:10' : 'phone-batch2-preg-101';
  Object.assign(data.户['101'].妻._怀孕, { 状态: '已告知', 已曝光: true, 受孕场次标识: e.scene });
  Object.assign(data.户['101'].妻._生产, { 状态: '孕期', 本胎序号: 1, 确认已读绝对时段: 0 });
  if (family) {
    data.户['101'].妻.当前阶段 = 5;
    data.系统._已完成特殊场景.push('借种');
    data.户['101'].妻._生产.家庭计划知情 = true;
    data.系统._特殊场景前置.push(e.load('借种结局状态.ts').借种三人合照已拍键(e.scene));
  }
  e.data = data; e.requests = [];
  e.kit = pregnancyKit(e, async (system, user) => {
    const follow = system.includes('姐妹群热议后的角色私聊');
    e.requests.push({ system, user, follow });
    if (follow) return e.missing ? '沈静仪:我看见消息了。' : '沈静仪:我看见群里的消息了。\n许曼君:有空的时候再聊这件事。';
    return family
      ? '夏乔:陆嘉明知道并接受家庭安排，林舟是本胎孩子的生物学父亲。\n沈静仪:我看见你说的安排了。\n许曼君:先好好休息吧。\n夏乔:也给你们看看我们三个人的合照。\n沈静仪:照片我看到了。'
      : '夏乔:检查已经结束，这次怀孕的情况已经确认。\n沈静仪:知道了，先好好休息。\n许曼君:我也看到消息了。\n夏乔:谢谢大家惦记。\n沈静仪:有新的检查安排再告诉我们。';
  });
  e.run = async () => {
    const db = e.api.读库();
    const outcome = await e.kit.孕产姐妹群必达拍({ data, 库: db, 楼: 4, 钟: 20, 时间线仍有效: () => true });
    return { outcome, db };
  };
  e.packet = () => {
    const prompt = e.requests.find(p => p.follow)?.user;
    assert.ok(prompt);
    return {
      event: JSON.parse(prompt.split('事件数据:\n')[1].split('\n本轮真实群消息:')[0]),
      observers: JSON.parse(prompt.split('\n本轮孕产角色数据:\n')[1]), prompt,
    };
  };
  return e;
}
test('SNAP23 家庭报孕真实必达分支的后续请求保留本胎确认', async () => {
  const e = fixture(); const { outcome, db } = await e.run();
  assert.equal(outcome, '有新'); assert.equal(e.requests.length, 2);
  assert.ok(db.消息.some(m => m.键 === e.load('生产姐妹群系统.ts').父亲认知确认键('姐妹群', '101', e.scene)));
  const packet = e.packet();
  assert.doesNotMatch(JSON.stringify(packet.event), /未确认本胎父亲/);
  assert.ok(packet.observers.every(o => o.当前对本胎父亲的认知 === '确认'));
  assert.equal(db.消息.filter(m => ['102', '201'].includes(m.会话)).length, 2);
});
test('SNAP23 普通报孕仍不确认本胎父亲', async () => {
  const e = fixture(false); await e.run();
  assert.ok(e.packet().observers.every(o => o.当前对本胎父亲的认知 !== '确认'));
});
test('SNAP23 私聊缺人仍整拍失败且没有实际写库', async () => {
  const e = fixture(); e.missing = true;
  await assert.rejects(e.run(), /私聊生成不完整/);
  assert.equal(e.api.读库().消息.length, 0);
});

test('SNAP23 真实接收名单不把历史确认转授后来入群者', async () => {
  const e = fixture(false);
  e.data.户['201'].妻.当前阶段 = 1;
  const key = e.load('生产姐妹群系统.ts').父亲认知确认键('姐妹群', '101', e.scene);
  await e.api.写库增量({ 新圈: [], 新消息: [{ 楼: 4, 时: 20, 会话: '姐妹群', 发: '对方', 文: '夏乔:林舟是本胎父亲。', 键: key }], 节拍改: {} });
  e.data.户['201'].妻.当前阶段 = 4;
  const messages = e.api.读库().消息;
  assert.ok(messages[0].接收门牌.includes('102'));
  assert.ok(!messages[0].接收门牌.includes('201'));
  const image = e.kit.读取孕产观察者画像(e.data, messages, '101', 4, 20);
  assert.equal(image.find(o => o.门牌 === '102').父亲认知, '确认');
  assert.notEqual(image.find(o => o.门牌 === '201').父亲认知, '确认');
});
for (const boundary of ['前胎', '其他母亲', '撤回', '未来楼', '未来时', '无接收旧档', '仅别人私聊']) {
  test(`SNAP23 ${boundary}不签发当前本胎知情`, () => {
    const e = fixture(false);
    const record = { 楼: 4, 时: 20, 会话: '姐妹群', 发: '对方', 文: '夏乔:林舟是本胎父亲。', 接收门牌: ['102'],
      键: e.load('生产姐妹群系统.ts').父亲认知确认键('姐妹群', '101', e.scene) };
    if (boundary === '前胎') record.键 = record.键.replace(e.scene, 'previous-scene');
    if (boundary === '其他母亲') record.键 = record.键.replace(':101:', ':201:');
    if (boundary === '撤回') record.类 = '撤回';
    if (boundary === '未来楼') record.楼 = 5;
    if (boundary === '未来时') record.时 = 21;
    if (boundary === '无接收旧档') delete record.接收门牌;
    if (boundary === '仅别人私聊') { record.会话 = '201'; record.键 = `父亲确认:私聊:201:101:${e.scene}`; }
    const image = e.kit.读取孕产观察者画像(e.data, [record], '101', 4, 20);
    assert.notEqual(image.find(o => o.门牌 === '102').父亲认知, '确认');
  });
}
test('SNAP23 有来源的前胎确认仍保留历史，但不替本胎确认', () => {
  const e = fixture(false);
  e.data.户['101'].妻._生产.本胎序号 = 2;
  e.data.系统._家庭文档.孩子.push({ 母亲门牌: '101', 出生场次标识: 'previous-scene', 胎次: 1 });
  const record = { 楼: 4, 时: 20, 会话: '姐妹群', 发: '对方', 文: '夏乔:第一胎的父亲已经说过了。', 接收门牌: ['102'], 键: '父亲确认:姐妹群:101:previous-scene' };
  const image = e.kit.读取孕产观察者画像(e.data, [record], '101', 4, 20);
  assert.deepEqual(image.find(o => o.门牌 === '102').此前已确认胎次, [1]);
  assert.deepEqual(image.find(o => o.门牌 === '201').此前已确认胎次, []);
  assert.notEqual(image.find(o => o.门牌 === '102').父亲认知, '确认');
});
test('SNAP23 同批新群事实只作用于本轮接收者，未接收者不触发群后私聊', async () => {
  const e = fixture(false);
  const observers = e.kit.读取孕产观察者画像(e.data, [], '101', 4, 20);
  const db = e.api.读库();
  const group = [{ 楼: 4, 时: 20, 会话: '姐妹群', 发: '对方', 文: '夏乔:林舟是本胎父亲。', 键: `父亲确认:姐妹群:101:${e.scene}` }];
  db.消息.push(...group);
  await e.kit.生成孕产群后私聊(e.data, db, 4, 20, '孕情', '101', 1, e.scene, observers, group, ['101', '102']);
  assert.deepEqual(e.packet().observers.map(o => o.角色.姓名), ['沈静仪']);
  assert.equal(e.packet().observers[0].当前对本胎父亲的认知, '确认');
  assert.equal(db.消息.some(m => m.会话 === '201'), false);
});
test('SNAP23 失败重试后整批写入，下一必达拍按原键去重', async () => {
  const e = fixture(); e.missing = true;
  await assert.rejects(e.run()); e.missing = false;
  const { db } = await e.run();
  const batch = { 新圈: [], 新消息: db.消息, 节拍改: db.节拍 };
  assert.equal(await e.api.写库增量(batch, () => false), false, '取消不能写半批');
  assert.equal(e.api.读库().消息.length, 0);
  assert.equal(await e.api.写库增量(batch), true);
  assert.equal(e.api.读库().消息.length, 8);
  const count = e.requests.length;
  const next = await e.run(); assert.equal(next.outcome, '无新'); assert.equal(e.requests.length, count);
});
