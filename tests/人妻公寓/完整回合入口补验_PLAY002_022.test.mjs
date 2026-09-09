/* eslint-disable import-x/no-nodejs-modules -- Complete production engine and local file-backed host I/O. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { dailyHost, nbsHost, assertReleased, clone, deferred, waitRequests, mountActualHostListeners } from './helpers/完整回合补验环境_PLAY002_022.mjs';

const output = path.resolve('.codex-tmp/repair-20260908-ui/entry-storage');
function storage(e, name) { fs.mkdirSync(output, { recursive: true }); e.physicalSave(fs.mkdtempSync(path.join(output, name + '-'))); }
const dailyBodies = [
  ['她检查衣摆，用粉笔标出尺寸。', '她把衣摆重新缝好，试穿确认合身。'],
  ['她用卷尺量柜子与桌面，标出动线。', '她挪好柜子，全部物件归位，确认201动线落定。'],
  ['她核对固定支出，在账本旁圈出需要的额度。', '她在明账里固定留下自己的生活钱。'],
];

for (const theme of [0, 1, 2]) test(`PLAY002 完整入口D1→D2/主题${theme}：实际生产票、模型、结算和文件重载`, async () => {
  const e = dailyHost({ theme }); storage(e, 'daily');
  e.provider = () => dailyBodies[theme][0];
  assert.equal(await e.run(), true, e.warnings.join('\n')); assertReleased(e);
  assert.equal(e.read().系统._许曼君离婚后日常.阶段, '待收针');
  assert.equal(e.read().系统._许曼君离婚后日常.累计次数, theme);
  e.prepareD2(); e.provider = () => dailyBodies[theme][1];
  assert.equal(await e.run(), true, e.warnings.join('\n')); assertReleased(e);
  const saved = e.reloadFile().系统._许曼君离婚后日常;
  assert.equal(saved.累计次数, theme + 1);
  assert.equal(saved.阶段, '空闲');
  assert.equal(saved.最近事件楼层, 36);
  assert.equal(e.commits, 2);
  assert.equal(e.requests.length, 2);
});

test('普通完整回合只在回合门与共享前台租约释放后广播成功完成', async () => {
  const e = dailyHost();
  e.provider = () => dailyBodies[0][0];
  assert.equal(await e.run(), true, e.warnings.join('\n'));
  const completed = e.trace.findLast(item => item.op === 'event' && item.name === '人妻公寓:回合完成');
  assert.ok(completed, '成功回合必须广播完成');
  assert.equal(completed.roundBusy, false, '完成监听器进入时回合事务门必须已经关闭');
  assert.equal(completed.foregroundBusy, false, '完成监听器进入时共享前台生成租约必须已经释放');
  assertReleased(e);
});

test('PLAY022 H8完整入口：真实动作生产票、验收、提交和文件重载', async () => {
  const e = nbsHost(); storage(e, 'h8');
  e.provider = () => '你没有离开，而是继续刚才的动作。江辰从外面关好卧室门，转身去书房。';
  assert.equal(await e.run(), true, e.warnings.join('\n')); assertReleased(e);
  const saved = e.reloadFile().系统._安若妍不必停;
  assert.equal(saved.H8完成, true);
  assert.equal(saved.阶段, '亲密后半');
  assert.equal(e.commits, 1);
  assert.equal(e.requests.length, 1);
});

test('PLAY022 D1完整两拍：首拍排队、队首准入、实际第二拍提交及保存', async () => {
  const e = nbsHost('D1'); storage(e, 'd1');
  e.provider = () => '江辰拿着卷宗箱，说他不要求解释，也不会干涉两人的关系。';
  assert.equal(await e.run(), true, e.warnings.join('\n')); assertReleased(e);
  assert.equal(e.read().系统._安若妍不必停.客厅第一拍完成, true);
  assert.equal(e.read().系统._安若妍不必停.提前通知已约定, false);
  e.prepareNext();
  e.provider = () => '江辰已明确双方私人生活互不干涉，对外夫妻身份保持照旧，也答应以后回来提前通知。他带着卷宗箱离开301。';
  assert.equal(await e.run(), true, e.warnings.join('\n')); assertReleased(e);
  const saved = e.reloadFile().系统._安若妍不必停;
  assert.equal(saved.提前通知已约定, true);
  assert.equal(saved.阶段, '待最终登记');
  assert.equal(e.commits, 2);
});

const targets = [
  { name: 'PLAY022 H8', create: () => nbsHost(), field: '_安若妍不必停', flag: 'H8完成', expected: true,
    good: '你没有离开，而是继续刚才的动作。江辰从外面关好卧室门，转身去书房。',
    bad: '如果玩家继续刚才的动作，安若妍会回应。江辰从外面关好卧室门，转身去书房。' },
  { name: 'PLAY002 D1', create: () => dailyHost(), field: '_许曼君离婚后日常', flag: '阶段', expected: '待收针',
    good: dailyBodies[0][0], bad: '她把衣摆重新缝好，试穿确认合身。' },
  { name: 'PLAY022 D1第二拍', create: async () => {
    const e = nbsHost('D1'); e.provider = () => '江辰拿着卷宗箱，说他不要求解释，也不会干涉两人的关系。';
    assert.equal(await e.run(), true, e.warnings.join('\n')); e.prepareNext();
    e.requests = []; e.commits = 0; e.trace = []; e.validations = []; return e;
  }, field: '_安若妍不必停', flag: '提前通知已约定', expected: true,
    good: '江辰没有离开，已明确双方互不干涉并答应提前通知。',
    bad: '“互不干涉、提前通知”只是提议，还没有答应。' },
  { name: 'PLAY002 D2', create: async () => {
    const e = dailyHost(); e.provider = () => dailyBodies[0][0];
    assert.equal(await e.run(), true, e.warnings.join('\n')); e.prepareD2();
    e.requests = []; e.commits = 0; e.trace = []; e.validations = []; return e;
  }, field: '_许曼君离婚后日常', flag: '阶段', expected: '空闲',
    good: dailyBodies[0][1], bad: '等这件上衣缝好以后，她再试穿；现在她只把粉笔和针线摆在桌上。' },
];
for (const target of targets) {
  test(`${target.name}完整首稿失败后同轮重写，最终只提交一次`, async () => {
    const e = await target.create(); storage(e, 'rewrite');
    e.provider = (_request, n) => n === 1 ? target.bad : target.good;
    assert.equal(await e.run(), true, e.warnings.join('\n')); assertReleased(e);
    assert.equal(e.requests.length, 2); assert.equal(e.commits, 1);
    assert.ok(e.validations.some(v => v.error));
    assert.equal(e.reloadFile().系统[target.field][target.flag], target.expected);
  });

  for (const failure of ['两稿无效', '模型异常', '缺模型', '取消', '保存抛错', 'MVU写入失败']) test(`${target.name}完整入口${failure}：回滚后同票重试一次`, async () => {
    const e = await target.create(); storage(e, 'rollback');
    const startRows = e.st.chat.length;
    const before = clone(e.read().系统[target.field]);
    const generate = e.ctx.generate;
    if (failure === '缺模型') e.ctx.generate = undefined;
    e.options.saveFail = failure === '保存抛错'; e.options.mvuFail = failure === 'MVU写入失败';
    e.provider = () => {
      if (failure === '模型异常') throw new Error('controlled provider error');
      if (failure === '取消') e.main.取消本回合();
      return failure === '两稿无效' ? target.bad : target.good;
    };
    assert.equal(await e.run(), false, e.warnings.join('\n')); assertReleased(e);
    assert.deepEqual(e.read().系统[target.field], before);
    assert.equal(e.st.chat.length, startRows);
    assert.equal(e.trace.some(t => t.name?.endsWith('CG')), false);
    e.options.saveFail = false; e.options.mvuFail = false; e.provider = () => target.good; e.ctx.generate = generate;
    assert.equal(await e.retry(), true, e.warnings.join('\n')); assertReleased(e);
    assert.equal(e.reloadFile().系统[target.field][target.flag], target.expected);
  });

  test(`${target.name}完整入口错误请求世代在调用模型前拒绝`, async () => {
    const e = await target.create(); const before = clone(e.read());
    assert.equal(await e.run({ 场景剧情请求世代: before.系统._场景剧情事务.请求世代 + 1 }), false);
    assert.equal(e.requests.length, 0); assert.equal(e.commits, 0); assertReleased(e);
    assert.deepEqual(e.read(), before);
  });

  test(`${target.name}真实看门狗结束永久pending，迟到模型结果不落库`, async () => {
    const e = await target.create(); const gate = deferred(); const before = clone(e.read().系统[target.field]);
    const startRows = e.st.chat.length;
    e.provider = () => gate.promise;
    const running = e.run(); await waitRequests(e);
    e.now += 1_000_000;
    for (const timer of [...e.intervals.values()]) timer.fn();
    assert.equal(await running, false); assertReleased(e);
    gate.resolve(target.good);
    await Promise.resolve(); await Promise.resolve();
    assert.equal(e.st.chat.length, startRows);
    assert.deepEqual(e.read().系统[target.field], before);
  });

  test(`${target.name}完整index监听：原生广播不准入，prompt不领票或消费剧情`, async () => {
    const e = await target.create(); mountActualHostListeners(e);
    const data = e.read();
    e.st.chat.push({ is_user: true, mes: e.action, extra: {}, variables: [{ stat_data: data }] });
    const native = e.load('src/人妻公寓/脚本/游戏逻辑/原生正文租约.ts');
    const before = clone({ vars: e.vars, data: e.read() });
    for (const [type, options, dryRun] of [['normal', {}, false], ['normal', {}, true], ['quiet', {}, false], ['normal', { automatic_trigger: true }, false], ['swipe', {}, false]]) {
      await e.ctx.eventEmit(e.ctx.tavern_events.GENERATION_STARTED, type, options, dryRun);
      const prompt = { chat: [{ role: 'user', content: e.action }], dryRun };
      const originalPrompt = clone(prompt);
      await e.ctx.eventEmit(e.ctx.tavern_events.CHAT_COMPLETION_PROMPT_READY, prompt);
      assert.equal(native.读原生正文开始票(), null);
      assert.deepEqual(prompt, originalPrompt);
    }
    assert.deepEqual({ vars: e.vars, data: e.read() }, before);
    assert.equal(e.requests.length, 0); assert.equal(e.commits, 0);
    assert.equal(e.locks.前台生成租约持有中(), false);
  });

  test(`${target.name}完整入口重复点击：只有首请求可建楼与提交`, async () => {
    const e = await target.create(); const gate = deferred(); e.provider = () => gate.promise;
    const running = e.run(); await waitRequests(e);
    const rows = e.st.chat.length;
    assert.equal(await e.run(), false);
    assert.equal(e.requests.length, 1); assert.equal(e.st.chat.length, rows);
    gate.resolve(target.good); assert.equal(await running, true, e.warnings.join('\n')); assertReleased(e);
    assert.equal(e.commits, 1);
  });
}
