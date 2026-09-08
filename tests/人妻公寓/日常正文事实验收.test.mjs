/* eslint-disable import-x/no-nodejs-modules -- PLAY-002，真实验收/提交及宿主入口，外部I/O隔离。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { daily, scenes, Schema, clone, bodies, harness } from './helpers/许曼君日常验收环境.mjs';

const h = harness();
const themes = daily.许曼君离婚后日常主题列表;
const samples = [
  {
    D1yes: [
      '她检查衣服尺寸，衣服尚未缝好。',
      '她用粉笔标出衣摆，准备明天把衣服改好。',
      '她检查接缝，读着旧便签“衣服已经缝好”，眼前这件衣服还未改完。',
      '她检查衣摆，问衣服改好以后要不要再量一次尺寸？',
    ],
    D1no: ['她检查衣摆，接着把衣服改好了。', '衣服虽然尚未熨平，但已经缝好。'],
    D2yes: [
      bodies.D2.给自己改衣服,
      '许曼君把这件上衣修改妥当，袖口按自己的喜好收好了。',
      '她起初还没缝好衣摆，但现在衣服已经改完。',
      '她把衣服改好了。另一份报表尚未完成，不影响这件衣服。',
      '她收好针线，说：“衣服已经按我的喜好改好了。”',
      '她按昨天标出的尺寸把上衣改好了。',
      '她把衣服改好了，她并没有拒绝继续检查，也没有说算了。',
      '她没有换剪刀就把衣服改好了。',
      '她把衣服改好了，笑着问玩家现在是不是合身？',
    ],
    D2no: [
      '她拿起衣服，尚未缝好衣摆，今天仍停在检查尺寸。',
      '她只剪了一段线，试穿了衣服，衣摆仍没缝好。',
      '她准备把衣服缝好，接着完成最后的收针。',
      '如果明天有空，她就把衣服改好。',
      '她读着昨天的便签“衣服已经缝好”，今天只检查尺寸。',
      '她问：衣服已经改好了吗？',
      '昨天她已经把衣服改好，今天只是查看另一件的尺寸。',
      '衣服铺在桌上。她完成了报表。',
      '衣服改好还谈不上，她仍在检查衣摆。',
      '她把衣服缝好后试穿，结果这件衣服仍未改完，她决定不做了。',
      '她尚未把那件放在靠窗桌上并已按她自己的喜好重新标定尺寸的上衣改好。',
      '衣服改好以后再试穿，现在她只检查衣摆。',
      '她只是谎称衣服已经改好，眼前仍是一堆没有动过的布料。',
      '她想把衣服改好，现在还在核对尺寸。',
      '她正在把衣服改好，尚未开始最后的收针。',
    ],
  },
  {
    D1yes: [
      '她检查201的柜子和动线，房间尚未全部归位。',
      '她用卷尺量好空位，计划明天让201物件全部归位。',
      '她检查柜子，复述旧便签“201重排完成”，眼前的房间还没动。',
      '她量好动线，问房间全部归位以后要不要再检查？',
    ],
    D1no: ['她量好位置，物件随后全部归位。', '201尚未清扫，但重排已经完成。'],
    D2yes: [
      bodies.D2.重排201,
      '她把201的常用物件重新摆放妥当，新动线已经确定。',
      '她刚才尚未挪动柜子，不过现在201已经重新布置好了。',
      '她把201的物件全部归位。报表还没有完成，房间的重排已经结束。',
      '她把201重新整理妥当，家具都安置好了，新动线也落实了。',
      '她按昨天量好的动线把201的物件全部归位。',
    ],
    D2no: [
      '她检查201里的柜子，尚未挪动任何物件，房间仍旧保持原样。',
      '她挪了一下柜子，房间还没有归位。',
      '她准备重排201，接着让全部物件归位。',
      '如果明天有空，她就把201重新布置好。',
      '她读着旧计划“物件全部归位”，今天只量柜子和动线。',
      '她问201重排完成了吗？',
      '昨天201重排已经完成，今天只检查尺寸。',
      '她站在201，完成了另一户的报表。',
      '201重排完成还谈不上，她只查看了柜子。',
      '她把柜子归位，结果房间仍没排好，她转身离开。',
    ],
  },
  {
    D1yes: [
      '她核对账本和固定支出，尚未把自己的生活钱正式写进明账。',
      '她圈出额度，准备明天把生活预算固定记入明账。',
      '她核对账本，念起旧便签“生活钱已经留出”，今天这笔仍没写入明账。',
      '她圈出生活钱的额度，问正式记入明账后是否需要再核对？',
    ],
    D1no: ['她核对额度，把自己的生活钱正式写进明账。', '她尚未正式写入旧账，但自己的生活钱已经固定留出。'],
    D2yes: [
      bodies.D2.给自己留一笔生活钱,
      '她把专供自己日常开销的钱单列入账，作为不再挪用的生活预算。',
      '她刚才尚未写入生活预算，不过现在自己的生活钱已固定记入明账。',
      '她在明账里固定留下自己的生活钱，报表尚未完成也不会挪走这笔钱。',
      '她在明账里把生活钱留给自己，单独列作固定预算。',
      '她已把自己的生活预算正式写入明账，确认这笔生活钱已经固定。',
    ],
    D2no: [
      '她核对账本，尚未写进生活预算，额度仍保持原样。',
      '她核对生活预算的固定支出，只圈出额度。',
      '她准备把自己的生活钱固定记入明账。',
      '如果明天有空，她就把生活钱单独记入明账。',
      '她念着旧便签“自己的生活钱已经固定记入明账”，今天只核对数字。',
      '她问生活钱已经固定记入明账了吗？',
      '昨天她把自己的生活钱固定记入明账，今天只检查新的额度。',
      '她拿出账本，把柜子单独留给管理员，生活预算未作处理。',
      '生活钱固定记入明账还谈不上，她仍在核对数字。',
      '她把自己的生活钱写入明账后又全部挪回别人的账，这笔生活钱没有留下。',
      '她核对生活预算，往明账写进一句玩笑，并没有记入这笔钱。',
    ],
  },
];

for (const relation of ['继续关系', '暂不承诺', '退出关系']) {
  for (const [index, theme] of themes.entries()) {
    for (const [group, texts] of Object.entries(samples[index])) {
      for (const [number, body] of texts.entries()) {
        test(`PLAY-002 ${relation}/${theme}/${group}/${number + 1}`, () => {
          const data = h.fresh(relation, index);
          const first = h.prepare(data, relation === '退出关系' ? '只处理201房务' : '把决定留给她', 80);
          let event = first, floor = 82, anchor = h.capture(data, first, 80, 82);
          if (group.startsWith('D2')) {
            assert.equal(h.submitFromProduction(data, first, 82, anchor).成功, true);
            const txn = clone(data.系统._场景剧情事务);
            assert.equal(scenes.提交场景剧情成功(data, first, txn.id, txn.请求世代), true);
            event = h.prepare(data, '把今天这件事做完', 82); floor = 84;
            anchor = h.capture(data, event, 82, 84);
          }
          const before = clone(data);
          const expected = group.endsWith('yes');
          const result = h.submitFromProduction(data, event, floor, anchor, false, body);
          assert.equal(result.成功, expected, `${body}\n${result.提示}`);
          const account = data.系统._许曼君离婚后日常;
          if (!expected) assert.deepEqual(data, before, '坏稿不得改变检查点、奖励、冷却、历史或反馈');
          else if (group.startsWith('D1')) {
            assert.equal(account.阶段, '待收针'); assert.equal(account.开始楼层, 82);
            assert.equal(account.累计次数, index); assert.equal(account.待反馈事件.length, 0);
            assert.equal(account.生活整备可用, false);
          } else {
            assert.equal(account.累计次数, index + 1); assert.equal(account.最近事件楼层, 84);
            assert.equal(account.生活整备可用, true); assert.equal(account.待反馈事件.length, 1);
            assert.equal(h.submitFromProduction(data, event, floor, anchor, false, body).成功, false);
          }
          // 备用生产调用共享真实验收，不开放普通日常的原生准入。
          const native = clone(before);
          assert.equal(h.submitFromProduction(native, event, floor, anchor, true, body).成功, expected, body);
        });
      }
    }
    test(`PLAY-002 真实listener跨楼→坏稿待重试→刷新后原票成功：${relation}/${theme}`, async () => {
      const input = clone(bodies);
      input.D1[theme] = samples[index].D1yes[0]; input.D2[theme] = samples[index].D2no[0];
      const e = harness(input).lifecycleHost(); e.state = h.fresh(relation, index);
      await e.click(relation === '退出关系' ? '只处理201房务' : '把决定留给她');
      assert.deepEqual(e.outcome, [true], e.errors.map(String).join('\n'));
      const checkpoint = clone(e.state.系统._许曼君离婚后日常);
      await e.click('把今天这件事做完');
      assert.deepEqual(e.outcome, [true, false]);
      assert.deepEqual(e.state.系统._许曼君离婚后日常, checkpoint);
      const id = e.state.系统._场景剧情事务.id;
      assert.equal(e.state.系统._场景剧情事务.状态, '待重试');
      e.state = Schema.parse(JSON.parse(JSON.stringify(e.state)));
      input.D2[theme] = samples[index].D2yes[0];
      assert.equal(await e.retry(), true, e.errors.map(String).join('\n'));
      assert.ok(id); assert.equal(e.state.系统._许曼君离婚后日常.累计次数, index + 1);
      assert.equal(e.state.系统._许曼君离婚后日常.最近事件楼层, 84);
      assert.equal(e.state.系统._许曼君离婚后日常.事件记录.length, 1);
      assert.equal(e.state.系统._许曼君离婚后日常.待反馈事件.length, 1);
    });
  }
}
