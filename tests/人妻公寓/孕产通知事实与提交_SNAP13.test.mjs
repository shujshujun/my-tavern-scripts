/* eslint-disable import-x/no-nodejs-modules -- 真实状态结算、私聊/群解析及硬事实验证，外部生成受控。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { clone } from './helpers/微信事务恢复环境.mjs';
import { createPhoneHost, extract, pregnancyKit } from './helpers/手机并行第二组环境.mjs';

const hard = createPhoneHost().load('手机/叙事硬事实.ts');
const cases = [
  ['生产', '女儿已经出生了，我们都平安。', ['女'], true],
  ['生产', '前天女儿已经平安出生了，今天才有空告诉你。', ['女'], true],
  ['生产', '不是儿子，是女儿，已经平安出生了。', ['女'], true],
  ['生产', '生产还没开始，医生说是个女孩。', ['女'], false],
  ['生产', '明天要生产了，是个女孩。', ['女'], false],
  ['生产', '女儿已经出生了吗？', ['女'], false],
  ['生产', '儿子已经出生了，女儿在家等我。', ['女'], false],
  ['生产', '你说“女儿已经出生了”，但我还没有生产。', ['女'], false],
  ['生产', '第一胎女儿已经出生了。', ['女', 2], false],
  ['生产', '第二胎女儿已经出生了。', ['女', 2], true],
  ['生产', '医生刚才说“女儿已经平安出生了”。', ['女'], true],
  ['生产', '之前还没有生产，现在女儿已经出生了。', ['女'], true],
  ['生产', '我姐姐的女儿已经出生了，我今天休息。', ['女'], false],
  ['报孕', '检查确认我怀孕了，这是第二胎。', [2], true],
  ['报孕', '怀孕还没确认，也不知道是不是第二胎。', [2], false],
  ['报孕', '你问“是不是怀孕了，这是第二胎？”，结果还没出来。', [2], false],
  ['预产', '我已经到医院待产了。', [], true],
  ['预产', '我明天去医院待产。', [], false],
  ['预产', '我还没到医院待产。', [], false],
  ['住院', '身体还在慢慢恢复。', ['恢复'], true],
  ['住院', '我已经离开医院，回家休息恢复身体了。', ['恢复'], false],
  ['住院', '还没出院，身体在慢慢恢复。', ['恢复'], true],
  ['住院', '宝宝今天很好，我仍在医院休养。', ['近况'], true],
  ['住院', '宝宝今天很好，我已经回家上班了。', ['近况'], false],
  ['住院', '准备出院了。', ['出院预告'], true],
  ['住院', '明天就可以出院了。', ['出院预告'], true],
  ['住院', '医生说还不能出院。', ['出院预告'], false],
  ['住院', '明天就可以出院了。', ['出院'], false],
  ['住院', '前天就已经出院回家了，今天才给你发消息。', ['出院'], true],
  ['住院', '你问“已经出院了吗”，我还在医院。', ['出院'], false],
  ['住院', '之前还没有出院，现在已经出院回家了。', ['出院'], true],
];
for (const [kind, text, args, expected] of cases) test(`SNAP13 ${kind}：${text}`, () => {
  assert.equal(hard[`验收${kind}硬事实`](text, ...args), expected);
});

function birthFixture() {
  const e = createPhoneHost(); const data = e.st.chat.at(-1).stat_data;
  data.户['201'] = clone(data.户['101']);
  for (const node of Object.values(data.户)) Object.assign(node.妻, { 当前阶段: 4, 好感值: 60, 堕落值: 40, 上次互动楼层: 4 });
  data.户['101'].妻.当前阶段 = 3;
  Object.assign(data.户['101'].妻._怀孕, { 状态: '已告知', 已曝光: true, 受孕场次标识: 'phone-batch2-birth13' });
  Object.assign(data.户['101'].妻._生产, { 状态: '待产', 本胎序号: 1 });
  assert.equal(e.load('生产系统.ts').结算实际生产(data, '101', '完全缺席', 14).成功, true);
  e.data = data; e.receipt = { 门牌: '101', 胎次: 1, 场次标识: 'phone-batch2-birth13' };
  return e;
}
for (const topic of ['生产', '恢复', '近况', '出院']) for (const variant of ['正确', '矛盾', '过短', '缺本人']) {
  test(`SNAP13 真实专题群 ${topic}/${variant}`, async () => {
    const e = birthFixture();
    if (topic === '出院') { e.data.系统._绝对时段 = 100; e.load('生产系统.ts').推进生产时钟(e.data); }
    const normal = topic === '生产' ? '孩子已经顺利出生，我还在医院休息。' : topic === '出院' ? '我已经出院回家了，接下来慢慢恢复。' : '我还在医院休养，这次检查结束了。';
    const bad = topic === '生产' ? '孩子还没出生，生产没有开始。' : topic === '出院' ? '我仍住在医院，还没有出院。' : '我已经离开医院，回家忙工作了。';
    let response = `夏乔:${variant === '矛盾' ? bad : normal}\n沈静仪:知道了，照顾好自己。\n许曼君:消息我看到了。\n夏乔:谢谢大家。\n沈静仪:之后再联系。`;
    if (variant === '过短') response = `夏乔:${normal}\n沈静仪:知道了。`;
    if (variant === '缺本人') response = '沈静仪:知道了。\n许曼君:消息我看到了。\n沈静仪:之后再说。\n许曼君:慢慢休息。\n沈静仪:有事再联系。';
    const kit = pregnancyKit(e, async () => response); const db = e.api.读库();
    const result = await kit.姐妹群一拍(e.data, db, 4, '本胎住院通知。', {}, { 生产凭据: e.receipt, ...(topic === '生产' ? {} : { 住院群节点: topic }) });
    assert.equal(result, variant === '正确');
    assert.equal(db.消息.length, variant === '正确' ? 5 : 0);
  });
}
test('SNAP13 真实私聊构造器不接收未完成生产的文案', async () => {
  const e = birthFixture();
  const file = '手机/孕情AI通知.ts';
  const overrides = { 小生成: async () => '生产还没开始，医生说是个女孩。', 微信短文本: extract(e, '手机/生成引擎.ts', '微信短文本') };
  for (const name of ['最近本人私聊', '孕产硬事实', '生成孕产私聊']) overrides[name] = extract(e, file, name, overrides);
  const text = await overrides.生成孕产私聊(e.data, e.receipt, '生产完成并让玩家获知', [], value => hard.验收生产硬事实(value, '女', 1));
  assert.equal(text, '');
});

for (const outcome of ['未完成', '取消', '超时', '已完成']) test(`SNAP13 实际通知同步与写入门：${outcome}`, async () => {
  const e = birthFixture();
  const child = e.load('生产系统.ts').读取生产事件快照(e.data, e.receipt).孩子;
  const sex = child.性别 === '女' ? '女儿' : '儿子';
  const file = '手机/孕情AI通知.ts';
  const overrides = {
    小生成: async () => {
      if (outcome === '超时') throw new Error('controlled timeout');
      if (outcome === '取消') e.id = 'another-chat';
      return outcome === '未完成' ? `生产还没开始，医生说是个${sex}。` : `${sex}已经平安出生，我还在医院休息。`;
    },
    微信短文本: extract(e, '手机/生成引擎.ts', '微信短文本'),
  };
  for (const name of ['验收借种阳性邀约', '最近本人私聊', '孕产硬事实', '生成孕产私聊', '生成家庭计划邀请', '同步孕产与家庭计划AI微信']) {
    overrides[name] = extract(e, file, name, overrides);
  }
  if (outcome === '超时') await assert.rejects(overrides.同步孕产与家庭计划AI微信(e.data), /controlled timeout/);
  else assert.equal(await overrides.同步孕产与家庭计划AI微信(e.data), outcome === '已完成');
  const stored = e.api.读库().消息;
  if (outcome === '已完成') assert.ok(stored.length > 0 && stored.every(m => m.文.includes('已经平安出生')));
  else assert.equal(stored.length, 0);
});
