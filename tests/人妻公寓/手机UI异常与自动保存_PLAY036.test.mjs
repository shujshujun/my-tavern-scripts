/* eslint-disable import-x/no-nodejs-modules -- 真实UI注册表、完整节拍函数和数据层；宿主保存、渲染回调和候选内容为受控I/O。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';
import * as ts from 'typescript';
import { createTickHost, ordinary, moment } from './helpers/手机节拍可见刷新环境.mjs';
import { deferred } from './helpers/手机发送草稿环境.mjs';

const registrySource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/UI刷新.ts', import.meta.url), 'utf8');
const registryCode = ts.transpileModule(registrySource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
function loadRegistry() {
  const module = { exports: {} };
  const errors = [];
  Function('module', 'exports', 'console', registryCode)(module, module.exports, {
    error: (...args) => errors.push(args),
  });
  return { ui: module.exports, errors };
}
function instrument(t, mode = 'redraw', options = {}) {
  const errors = [];
  t.mock.method(console, 'error', (...args) => errors.push(args));
  const e = createTickHost(options);
  const failure = new Error(`controlled UI ${mode}`);
  e.ui.注册手机UI刷新实现(
    () => { e.refresh.redraw++; if (mode === 'redraw' || mode === 'both') throw failure; },
    () => { e.refresh.badge++; if (mode === 'badge' || mode === 'both') throw failure; },
  );
  return { e, errors, failure };
}
const savedMessages = e => e.server.envelope.vars._微信?.消息 ?? [];
const savedMoments = e => e.server.envelope.vars._微信?.圈 ?? [];

// 不替换被测注册表；验证原模块的同步/无返回值合同和两个独立通知端口。
test('未注册：两种UI请求均为无副作用no-op', () => {
  const { ui, errors } = loadRegistry();
  assert.equal(ui.请求手机重绘(), undefined);
  assert.equal(ui.请求刷新手机红点(), undefined);
  assert.equal(errors.length, 0);
});
test('成功：按调用顺序同步通知，重复请求不被新增节流合并', () => {
  const { ui, errors } = loadRegistry();
  const calls = [];
  ui.注册手机UI刷新实现(() => calls.push('draw'), () => calls.push('badge'));
  ui.请求刷新手机红点(); ui.请求手机重绘(); ui.请求手机重绘();
  assert.deepEqual(calls, ['badge', 'draw', 'draw']);
  assert.equal(errors.length, 0);
});
for (const [label, name] of [['重绘', '请求手机重绘'], ['红点', '请求刷新手机红点']]) {
  test(`${label}同步异常：只记录原错误，不逃逸到业务调用者`, () => {
    const { ui, errors } = loadRegistry();
    const failure = new Error(`original-${label}`);
    ui.注册手机UI刷新实现(() => { throw failure; }, () => { throw failure; });
    assert.doesNotThrow(() => ui[name]());
    assert.equal(errors.length, 1);
    assert.ok(String(errors[0][0]).includes(label));
    assert.equal(errors[0][1], failure, '必须保留原异常对象以便定位，而不是静默吞错');
  });
}
test('失败后不注销实现，重新注册可恢复，两通知端口互不短路', () => {
  const { ui, errors } = loadRegistry();
  let failedCalls = 0;
  let otherCalls = 0;
  ui.注册手机UI刷新实现(() => { failedCalls++; throw 'non-Error-render-failure'; }, () => { otherCalls++; });
  assert.doesNotThrow(() => { ui.请求手机重绘(); ui.请求刷新手机红点(); ui.请求手机重绘(); });
  assert.equal(failedCalls, 2);
  assert.equal(otherCalls, 1);
  assert.equal(errors.length, 2);
  assert.equal(errors[0][1], 'non-Error-render-failure');
  const replacement = [];
  ui.注册手机UI刷新实现(() => replacement.push('draw'), () => replacement.push('badge'));
  ui.请求手机重绘(); ui.请求刷新手机红点();
  assert.deepEqual(replacement, ['draw', 'badge']);
  assert.equal(errors.length, 2);
});

for (const mode of ['redraw', 'badge', 'both']) {
  for (const kind of ['message', 'moment']) {
    test(`${mode}/${kind}：真实增量提交后UI报错仍调用宿主保存并完成后续排队`, async t => {
      const { e, errors, failure } = instrument(t, mode);
      const key = `ui-failure-${mode}-${kind}`;
      if (kind === 'message') e.candidates.新消息 = [ordinary({ 键: key })];
      else e.candidates.新圈 = [moment({ 事件键: key })];
      await e.tick();
      assert.equal(kind === 'message' ? e.api.读库().消息.length : e.api.读库().圈.length, 1);
      assert.equal(e.saves.length, 1, 'UI异常不能跳过真实数据层调用的宿主立即保存接口');
      assert.equal(kind === 'message' ? savedMessages(e).length : savedMoments(e).length, 1);
      assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
      assert.equal(errors.length, mode === 'both' ? 2 : 1);
      assert.ok(errors.every(args => args[1] === failure));
      assert.equal(e.queuedMemory.length, 2, '普通节拍提交后的排队路径应继续到达');
      assert.equal(e.producerCalls, 1);
      assert.equal(e.busy(), false);
      assert.equal(e.warnings.some(args => String(args[0]).includes('节拍失败')), false);
    });
  }
}
for (const mode of ['redraw', 'badge']) {
  test(`${mode}异常＋保存pending：保持原占用直至保存返回，不提前释放或自动重发`, async t => {
    const { e } = instrument(t, mode);
    const gate = deferred();
    let entered = false;
    e.st.saveMetadata = async () => {
      entered = true;
      e.saves.push('pending');
      const envelope = e.capture();
      await gate.promise;
      e.server.envelope = envelope;
    };
    e.candidates.新消息 = [ordinary({ 键: `pending-${mode}` })];
    const pending = e.tick();
    try {
      for (let i = 0; i < 30 && !entered && e.busy(); i++) await setImmediate();
      assert.equal(entered, true, '必须真正到达宿主保存等待点');
      assert.equal(e.busy(), true);
      assert.equal(e.saves.length, 1);
      assert.equal(e.producerCalls, 1);
      assert.equal(savedMessages(e).length, 0, '保存未返回不能伪造宿主已持久化');
    } finally {
      gate.resolve();
      await pending;
    }
    assert.equal(e.busy(), false);
    assert.equal(savedMessages(e).length, 1);
  });
}

test('UI报错＋宿主保存抛错：仍尝试保存并保留原保存失败日志/镜像，不伪造服务器成功', async t => {
  const { e } = instrument(t, 'redraw', { saveMode: 'throw' });
  e.candidates.新消息 = [ordinary({ 键: 'host-save-error' })];
  await e.tick();
  assert.equal(e.saves.length, 1);
  assert.equal(savedMessages(e).length, 0);
  assert.equal(e.warnings.some(args => String(args[0]).includes('立即保存失败')), true);
  assert.equal(e.busy(), false);
  const reopened = e.reopen(true);
  assert.equal(reopened.api.读库().消息.filter(m => m.键 === 'host-save-error').length, 1);
});
test('UI报错＋旧宿主无保存接口：仍进入原兼容路径并可从恢复镜像读取', async t => {
  const { e } = instrument(t, 'badge', { saveMode: 'absent' });
  e.candidates.新消息 = [ordinary({ 键: 'legacy-host' })];
  await e.tick();
  assert.equal(e.saves.length, 0);
  assert.equal(e.warnings.some(args => String(args[0]).includes('没有暴露 saveMetadata/saveChat')), true);
  assert.equal(e.reopen(true).api.读库().消息.filter(m => m.键 === 'legacy-host').length, 1);
});
test('数据写入失败：不把业务异常当作UI异常吞掉，无消息/通知/保存', async t => {
  const { e, errors } = instrument(t, 'both');
  e.rejectUpdate = true;
  e.candidates.新消息 = [ordinary({ 键: 'rejected-update' })];
  await e.tick();
  assert.equal(e.api.读库().消息.length, 0);
  assert.deepEqual(e.refresh, { redraw: 0, badge: 0 });
  assert.equal(e.saves.length, 0);
  assert.equal(errors.length, 0);
  assert.equal(e.warnings.some(args => String(args[0]).includes('节拍失败')), true);
  assert.equal(e.busy(), false);
});

for (const change of ['chat', 'swipe', 'generation']) {
  test(`提交等待期间${change}失效：原时间线门仍阻止刷新及保存`, async t => {
    const { e, errors } = instrument(t, 'both');
    e.candidates.新消息 = [ordinary({ 键: `invalid-${change}` })];
    e.afterUpdate = () => {
      if (change === 'chat') e.id = 'new-chat';
      if (change === 'swipe') e.st.chat.at(-1).swipe_id++;
      if (change === 'generation') e.load('手机时间线租约.ts').作废当前手机时间线租约世代();
    };
    await e.tick();
    assert.deepEqual(e.refresh, { redraw: 0, badge: 0 });
    assert.equal(e.saves.length, 0);
    assert.equal(errors.length, 0);
    assert.equal(e.busy(), false);
  });
}
test('异常后下一拍恢复：稳定键仍去重，不重放原通知或追加第二条消息', async t => {
  const { e } = instrument(t, 'redraw');
  e.candidates.新消息 = [ordinary({ 键: 'retry-existing' })];
  await e.tick();
  assert.equal(e.saves.length, 1);
  e.ui.注册手机UI刷新实现(() => { e.refresh.redraw++; }, () => { e.refresh.badge++; });
  await e.tick();
  assert.equal(e.api.读库().消息.length, 1);
  assert.equal(savedMessages(e).length, 1);
  assert.deepEqual(e.refresh, { redraw: 1, badge: 1 });
  assert.equal(e.producerCalls, 2, '候选入口执行两拍，但实际消息仍只能插入一次');
  assert.equal(e.busy(), false);
});
