/* eslint-disable import-x/no-nodejs-modules -- Real host listeners, scene transactions and engine; isolated storage/model ports. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { firstDecision, finalDecision } from './helpers/分居决定验收环境.mjs';
import { host, clone, ticks, assertReleased, deferred, waitRequests } from './helpers/离婚主入口环境.mjs';
import { mountActualHostListeners } from './helpers/完整回合补验环境_PLAY002_022.mjs';

const game = 'src/人妻公寓/脚本/游戏逻辑/';
const cases = [
  ['参与方式', firstDecision, '开始第一幕初谈', '说明你会怎样参与', '我会当面在场。', '待三人摊牌'],
  ['今后关系', finalDecision, '开始第四幕私下决定', '说明你与她今后的关系', '我会继续留下。', '待管理员室交接'],
];

async function setup(fixture, label, legacy = false) {
  const e = host();
  const f = fixture();
  const route = e.load(`${game}许曼君分居系统.ts`);
  const result = route.提交许曼君分居剧情事件(f.data, f.event, '201', 32, '我听见了。');
  assert.equal(result.成功, true);
  e.id = 'xmj-reply';
  e.vars = { _场景: { 房间id: '201' } };
  f.data.系统._序章完成 = true;
  e.st.chat[32].variables = [{ stat_data: clone(f.data) }];
  if (legacy) {
    const prepare = e.main.捕获即时业务撤回准备(f.data);
    const activated = e.scene.激活新增场景剧情(f.data, {
      内容: f.event,
      目标场景: '201',
      触发楼层: 32,
      行动: `（在201执行《分居》的“${label}”，只推进眼前这一个人物决定或硬物件动作）`,
    });
    assert.equal(activated.成功, true);
    const record = await e.main.登记即时业务撤回准备(prepare, activated.事务.id, f.data);
    e.st.chat[32].variables = [{ stat_data: clone(f.data) }];
    await e.main.确认即时业务撤回已提交(record);
    e.scene.标记场景剧情待重试(f.data, activated.事务.id);
    e.st.chat[32].variables = [{ stat_data: clone(f.data) }];
  }
  e.provider = () => '许曼君听完你的回答，确认了你刚才明确表达的选择。她放下手中的杯子，轻轻点了点头。';
  e.load(`${game}手机系统.ts`).刷新红点 = () => undefined;
  mountActualHostListeners(e);
  return e;
}

async function press(e, id) {
  await e.ctx.eventEmit('人妻公寓:许曼君分居动作', id);
  await ticks(25);
}

for (const [name, fixture, id, label, reply, next] of cases) {
  test(`${name}：重答按钮只持久排入等待票；重复点击不生成、不重复排队，真实回复后推进`, async () => {
    const e = await setup(fixture, label);
    const before = e.read();
    await press(e, id);
    assert.equal(e.requests.length, 0, e.warnings.join('\n'));
    const waiting = e.scene.读取场景剧情状态(e.read());
    assert.equal(waiting?.需要玩家回应, true);
    assert.equal(waiting?.活动, false);
    const queue = e.read().系统._待发送事件;
    await press(e, id);
    assert.equal(e.requests.length, 0);
    assert.equal(e.read().系统._待发送事件, queue);
    assert.deepEqual(e.read().系统._许曼君分居, before.系统._许曼君分居);
    assert.equal(e.read().现金, before.现金);
    await e.ctx.eventEmit('人妻公寓:继续场景剧情', { 行动: reply });
    assert.equal(e.requests.length, 1, e.warnings.join('\n'));
    assert.equal(e.read().系统._许曼君分居.阶段, next, e.warnings.join('\n'));
    assertReleased(e);
  });

  test(`${name}：旧版固定输入失败票开放补答，空重试不请求AI，补答不改撤回签名并可完整撤回`, async () => {
    const e = await setup(fixture, label, true);
    const before = e.read();
    const signature = e.vars._即时业务撤回.完整性指纹;
    const view = e.scene.读取场景剧情状态(before);
    assert.equal(view.需要玩家回应, true);
    assert.equal(view.活动, false);
    await e.ctx.eventEmit('人妻公寓:继续场景剧情');
    assert.equal(e.requests.length, 0);
    assert.deepEqual(e.read(), before);
    await e.ctx.eventEmit('人妻公寓:继续场景剧情', { 行动: reply });
    assert.equal(e.requests.length, 1, e.warnings.join('\n'));
    assert.equal(e.read().系统._许曼君分居.阶段, next, e.warnings.join('\n'));
    assert.equal(e.vars._上次回合.chat快照._即时业务撤回.完整性指纹, signature);
    await e.main.回档至(32);
    assert.equal(e.st.chat.length, 33, e.warnings.join('\n'));
    assert.equal(e.read().系统._许曼君分居.当前拍, before.系统._许曼君分居.当前拍);
    assert.equal(e.read().系统._场景剧情事务.id, '');
    assertReleased(e);
  });

  for (const legacy of [false, true]) {
    test(`${name}：${legacy ? '旧票补答' : '新等待票'}生成失败、序列化重载后仍能重试`, async () => {
      const e = await setup(fixture, label, legacy);
      if (!legacy) await press(e, id);
      const before = e.read().系统._许曼君分居;
      const goodProvider = e.provider;
      e.provider = () => {
        throw new Error('INJECTED_GENERATION_FAILURE');
      };
      await e.ctx.eventEmit('人妻公寓:继续场景剧情', { 行动: reply });
      assert.deepEqual(e.read().系统._许曼君分居, before);
      assert.equal(e.read().系统._场景剧情事务.状态, '待重试');
      assertReleased(e);
      e.st.chat.at(-1).variables = JSON.parse(JSON.stringify(e.st.chat.at(-1).variables));
      e.vars = JSON.parse(JSON.stringify(e.vars));
      e.provider = goodProvider;
      await e.ctx.eventEmit('人妻公寓:继续场景剧情', legacy ? { 行动: reply } : undefined);
      assert.equal(e.read().系统._许曼君分居.阶段, next, e.warnings.join('\n'));
      assertReleased(e);
    });
  }

  test(`${name}：取消补答后迟到正文不能推进，原票仍可补答`, async () => {
    const e = await setup(fixture, label, true);
    const before = e.read().系统._许曼君分居;
    const pending = deferred();
    const goodProvider = e.provider;
    e.provider = () => pending.promise;
    const running = e.ctx.eventEmit('人妻公寓:继续场景剧情', { 行动: reply });
    await waitRequests(e, 1);
    e.main.取消本回合();
    await running;
    pending.resolve(goodProvider());
    await ticks(2);
    assert.deepEqual(e.read().系统._许曼君分居, before);
    assert.equal(e.scene.读取场景剧情状态(e.read()).需要玩家回应, true);
    assertReleased(e);
  });

  test(`${name}：实际玩家输入、其他剧情票、错地点和错拍不进入旧票补答通道`, async () => {
    const e = await setup(fixture, label, true);
    const data = e.read();
    for (const change of [
      d => {
        d.系统._场景剧情事务.行动 = reply;
      },
      d => {
        d.系统._场景剧情事务.目标场景 = '202';
      },
      d => {
        d.系统._许曼君分居.当前拍 += 1;
      },
      d => {
        d.系统._场景剧情事务.内容 = '【场景剧情需回应】【不再留门提交:test】';
      },
    ]) {
      const candidate = clone(data);
      change(candidate);
      assert.equal(e.scene.读取场景剧情状态(candidate).活动, true);
      assert.equal(e.scene.读取场景剧情状态(candidate).需要玩家回应, false);
    }
    e.vars._场景.房间id = '202';
    await e.ctx.eventEmit('人妻公寓:继续场景剧情', { 行动: reply });
    assert.equal(e.requests.length, 0);
    assert.deepEqual(e.read(), data);
    assertReleased(e);
  });

  test(`${name}：排队写入失败不会制造活动票或请求AI，恢复写入后可重新打开答复`, async () => {
    const e = await setup(fixture, label);
    const before = e.read();
    e.options.mvuFail = true;
    await press(e, id);
    assert.equal(e.requests.length, 0);
    assert.deepEqual(e.read(), before);
    assertReleased(e);
    e.options.mvuFail = false;
    await press(e, id);
    assert.equal(e.scene.读取场景剧情状态(e.read()).需要玩家回应, true);
  });

  test(`${name}：补答期间切聊天，迟到响应不能写入新聊天`, async () => {
    const e = await setup(fixture, label, true);
    const pending = deferred();
    e.provider = () => pending.promise;
    const running = e.ctx.eventEmit('人妻公寓:继续场景剧情', { 行动: reply });
    await waitRequests(e, 1);
    e.id = 'other-chat';
    // 此夹具只挂业务监听、不跑页面启动器；执行真实 CHAT_CHANGED 监听的世代作废步骤。
    e.timeline.作废当前时间线切换世代();
    e.main.取消本回合(true);
    e.st.chat = [{ is_user: false, mes: '另一聊天', extra: {}, variables: [{ stat_data: { marker: 'other-chat' } }] }];
    e.vars = { marker: 'other-chat' };
    const other = clone({ chat: e.st.chat, vars: e.vars });
    pending.resolve('迟到正文');
    await running;
    await ticks(2);
    assert.deepEqual({ chat: e.st.chat, vars: e.vars }, other);
    assertReleased(e);
  });
}
