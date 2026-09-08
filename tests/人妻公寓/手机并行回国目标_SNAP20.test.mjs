/* eslint-disable import-x/no-nodejs-modules -- 独立宿主执行真实任务、解析、发送、凭据与路线提交。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHost, clone, productionFunction } from './helpers/微信事务恢复环境.mjs';
import { consumerKit } from './helpers/微信余波消费环境.mjs';

function fixture(lines, task = '回应回国') {
  const e = createHost();
  const data = e.st.chat.at(-1).stat_data;
  data.户['302'] = clone(data.户['101']);
  Object.assign(data.系统._回国, {
    阶段: '姐妹茶话会进行中', 茶话会状态: '交代正事', 茶话会成员快照: ['101', '102'],
    群名反应已完成: true, 母亲已坦白: true, 正事已说明: true,
    已点评成员: ['101', '102'], 已回应点评成员: ['101', '102'], 已回应回国成员: [],
  });
  if (task === '坦白') data.系统._回国.母亲已坦白 = false;
  if (task === '点评') Object.assign(data.系统._回国, { 茶话会状态: '逐人调侃', 已点评成员: [] });
  if (task === '转正事') data.系统._回国.茶话会状态 = '逐人调侃';
  if (task === '收束') data.系统._回国.已回应回国成员 = ['101', '102'];
  e.lines = lines; e.events = []; e.active = true; e.calls = 0;
  const kit = consumerKit(e, async (system, prompt) => {
    e.calls++; e.prompt = prompt;
    if (e.onGenerate) await e.onGenerate();
    return e.lines.join('\n');
  });
  const timeline = e.load('手机时间线租约.ts');
  const proof = e.load('手机/回国提交凭据.ts');
  const floor = () => e.st.chat.length - 1;
  const lease = { 聊天ID: e.id, 楼: floor(), 绝对时段: e.clock(), 数据: clone(data),
    时间线租约: timeline.创建手机时间线租约(e.id, floor(), e.st.chat, e.clock()) };
  const valid = productionFunction('手机/壳/会话瞬态.ts', '手机发送租约仍有效', {
    ...e.globals, ...timeline, 当前聊天ID: () => e.id, 当前手机绝对时段: e.clock,
  });
  e.produce = () => { const db = e.api.读库(); return kit.回国茶话会一拍(data, db, floor(), '林舟连续说了：知道了。', {}, true, 'aPhone20').then(ok => ({ ok, db })); };
  const send = productionFunction('手机/交互/邀约与发消息.ts', '手动群接话', {
    ...e.globals, ...proof, Schema: e.load('../../schema.ts').Schema,
    手机发送租约仍有效: valid,
    手机小生成仍有效: productionFunction('手机/生成引擎.ts', '手机小生成仍有效', {}),
    恢复双重继承群聊余波主状态: async () => {}, 读最近有效stat: () => clone(data),
    末楼: floor, 读库: e.api.读库, 创建群聊引用响应约束: () => undefined,
    新回国茶话会批次标识: () => 'aPhone20',
    姐妹群一拍: (stat, db, level, reason, control, options) => kit.回国茶话会一拍(stat, db, level, reason, control, options.玩家刚发言, options.回国批次标识),
    读取双重继承群聊余波收据: () => null,
    写库增量: (delta, allowed, stats) => e.api.写库增量(delta, () => !e.rejectWrite && allowed(), stats),
    排队刷新群聊进展摘要: () => {}, 请求手机重绘: () => {},
    eventEmit: (...args) => e.events.push(args),
    setTimeout: resolve => { e.onDelay?.(); resolve(); return 0; },
  });
  e.send = () => send('姐妹群', '林舟连续说了：知道了。', lease, { 仍有效: () => e.active });
  e.messages = () => e.api.读库().消息.filter(m => m.会话 === '姐妹群');
  e.commit = () => {
    assert.equal(e.events.length, 1);
    const [event, payload, receipt] = e.events[0];
    assert.equal(event, '人妻公寓:回国茶话会批次完成');
    assert.equal(proof.回国提交凭据有效(receipt, { 聊天ID: e.id, 世代: timeline.读取当前手机时间线租约世代(), 绝对时段: e.clock(), 聊天消息: e.st.chat, 微信消息: e.api.读库().消息 }), true);
    const result = e.load('回国系统.ts').提交回国茶话会批次(data, payload, receipt.消息);
    return { result, payload, data };
  };
  return e;
}

const both = ['夏乔:回国那天需要帮忙接机吗？', '沈静仪:到时候我会提前打个招呼。'];
for (const lines of [both, [...both, '母亲:好，到时再和大家说。']]) {
  test(`SNAP20 两目标完整、母亲${lines.length === 2 ? '不发言' : '可选发言'}沿真实链提交`, async () => {
    const e = fixture(lines);
    assert.equal(await e.send(), true);
    assert.match(e.prompt, /母亲可以回应其中一人/);
    assert.equal(e.messages().length, lines.length);
    assert.equal(await e.send(), true, '提交前同批次重复发送保持原消息');
    assert.equal(e.messages().length, lines.length);
    e.events.splice(1);
    const { result, payload, data } = e.commit();
    assert.equal(result.成功, true);
    assert.deepEqual(payload.回应成员, ['101', '102']);
    assert.deepEqual(data.系统._回国.已回应回国成员, ['101', '102']);
  });
}
for (const lines of [[both[0]], [both[0], '母亲:收到。'], [both[0], '外来住户:收到。'], []]) {
  test(`SNAP20 缺目标或外来人不能提交 ${lines.join('|')}`, async () => {
    const e = fixture(lines); assert.equal(await e.send(), false);
    assert.equal(e.messages().length, 0); assert.equal(e.events.length, 0);
  });
}
for (const task of ['坦白', '点评', '转正事', '收束']) {
  test(`SNAP20 ${task}仍要求母亲发言`, async () => {
    const e = fixture(both, task); assert.equal((await e.produce()).ok, false);
  });
}
for (const mode of ['取消', '超时', '写入失败', '回档', '切聊天', '换分支', '中途取消']) {
  test(`SNAP20 ${mode}不签发完整批次`, async () => {
    const e = fixture(both);
    e.onGenerate = () => {
      if (mode === '取消') e.active = false;
      if (mode === '超时') throw new Error('controlled timeout');
      if (mode === '写入失败') e.rejectWrite = true;
      if (mode === '回档') e.st.chat.pop();
      if (mode === '切聊天') e.id = 'other';
      if (mode === '换分支') e.st.chat.at(-1).swipe_id++;
    };
    if (mode === '中途取消') e.onDelay = () => { e.active = false; };
    if (mode === '超时') await assert.rejects(e.send(), /controlled timeout/);
    else assert.equal(await e.send(), mode === '中途取消');
    assert.equal(e.events.length, 0);
  });
}
