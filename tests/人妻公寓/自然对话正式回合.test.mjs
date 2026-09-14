/* eslint-disable import-x/no-nodejs-modules -- 完整生产回合，模型与宿主I/O为明确测试替身。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { host, assertReleased, deferred } from './helpers/离婚主入口环境.mjs';

function environment(status = '完成') {
  const e = host();
  e.ctx.crypto = crypto;
  e.observations = [];
  e.ctx.generateRaw = async options => {
    const req = JSON.parse(options.ordered_prompts[1].content);
    e.observations.push(req);
    if (e.observer) return e.observer(req);
    return wrap(req, status);
  };
  return e;
}
function wrap(req, status) {
  const body = req.消息.find(m => m.id === req.批次 + ':assistant');
  return '<自然观察>' + JSON.stringify({ 版本: 1, 事件: req.事件, 阶段: req.阶段, 分支: req.分支, 批次: req.批次,
    状态: status, 意向: '未明确', 依据: [{ 消息: body.id, 原文: body.文本 }], 意向依据: [], 选择: {}, 已谈主题: [] }) + '</自然观察>';
}

test('离婚：生产完整回合补取观察后由真实状态机结算，并持久保存一次', async () => {
  const e = environment();
  assert.equal(await e.run(), true, e.warnings.join('\n'));
  assertReleased(e);
  assert.equal(e.observations.length, 1);
  assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, true);
  assert.equal(e.read().系统._场景剧情事务.id, '');
  assert.equal(e.commits, 1);
  assert.equal(e.saves.at(-1).chat.at(-1).variables[0].stat_data.系统._许曼君离婚.法律离婚已成立, true);
});

test('离婚：待续仍保存正文、释放锁，保留原事件与资源', async () => {
  const e = environment('待续');
  assert.equal(await e.run(), true, e.warnings.join('\n'));
  assertReleased(e);
  assert.equal(e.st.chat.length, 35);
  assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, false);
  assert.equal(e.read().系统._场景剧情事务.状态, '待续');
  assert.equal(e.commits, 0);
  assert.equal(e.read().系统._待发送事件, e.initial.data.系统._待发送事件);
});

test('离婚：观察格式缺失后，手动恢复原消息不会新增正文或重复业务提交', async () => {
  const e = environment(); e.observer = async () => 'no metadata';
  assert.equal(await e.run(), true, e.warnings.join('\n'));
  assert.equal(e.commits, 0);
  const n = e.st.chat.length;
  e.observer = undefined;
  const recovery = e.load('src/人妻公寓/脚本/游戏逻辑/自然对话恢复.ts');
  await recovery.恢复已保存自然对话();
  assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, true, JSON.stringify(e.trace.filter(x => x.name === '人妻公寓:提示')));
  assert.equal(e.st.chat.length, n);
  assert.equal(e.commits, 1);
  await recovery.恢复已保存自然对话();
  assert.equal(e.commits, 1);
});

test('手动恢复：同时点击只发起一次识别，完成后不新增正文', async () => {
  const e = environment(); e.observer = async () => 'missing';
  await e.run();
  const gate = deferred(), started = deferred(), n = e.st.chat.length;
  e.observer = async req => { started.resolve(); await gate.promise; return wrap(req, '完成'); };
  const recovery = e.load('src/人妻公寓/脚本/游戏逻辑/自然对话恢复.ts');
  const first = recovery.恢复已保存自然对话();
  await started.promise;
  await recovery.恢复已保存自然对话();
  assert.equal(e.observations.length, 2);
  gate.resolve(); await first;
  assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, true);
  assert.equal(e.st.chat.length, n);
  assertReleased(e);
});

test('手动恢复：模型调用期间存档发生变化，旧识别不得提交', async () => {
  const e = environment(); e.observer = async () => 'missing'; await e.run();
  e.observer = async req => {
    e.st.chat.at(-1).variables[0].stat_data.系统._序章完成 = false;
    return wrap(req, '完成');
  };
  await e.load('src/人妻公寓/脚本/游戏逻辑/自然对话恢复.ts').恢复已保存自然对话();
  assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, false);
  assert.equal(e.read().系统._序章完成, false);
  assert.equal(e.commits, 0);
  assertReleased(e);
});

test('手动恢复：最终写入失败不落业务进度，重新识别可恢复', async () => {
  const e = environment(); e.observer = async () => 'missing'; await e.run();
  const n = e.st.chat.length;
  e.observer = async req => { e.options.mvuFail = true; return wrap(req, '完成'); };
  const recovery = e.load('src/人妻公寓/脚本/游戏逻辑/自然对话恢复.ts');
  await recovery.恢复已保存自然对话();
  assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, false);
  assertReleased(e);
  e.options.mvuFail = false; e.observer = undefined;
  await recovery.恢复已保存自然对话();
  assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, true);
  assert.equal(e.st.chat.length, n);
  assertReleased(e);
});
