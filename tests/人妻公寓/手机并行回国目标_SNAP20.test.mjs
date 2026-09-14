/* eslint-disable import-x/no-nodejs-modules -- 独立宿主执行真实任务、解析、发送、凭据与路线提交。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture as teaFixture } from './helpers/微信茶话会环境.mjs';

function fixture(lines, task) {
  const e = teaFixture(lines, task);
  e.fixedBatch = 'aPhone20';
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
    const e = fixture(lines);
    const count = lines.filter(line => !line.startsWith('外来住户:')).length;
    assert.equal(await e.send(), count > 0);
    assert.equal(e.messages().length, count);
    assert.equal(e.events.length, 0);
  });
}
for (const task of ['坦白', '点评', '转正事', '收束']) {
  test(`SNAP20 ${task}缺母亲发言仍显示聊天，但不完成事件`, async () => {
    const e = fixture(both, task);
    assert.equal(await e.send(), true);
    assert.equal(e.messages().length, both.length);
    assert.equal(e.events.length, 0);
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
