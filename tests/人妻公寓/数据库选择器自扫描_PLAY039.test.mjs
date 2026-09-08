/* eslint-disable import-x/no-nodejs-modules -- Isolated Chromium DOM/MutationObserver regression; no live plugin or model. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import test, { before, after } from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', import.meta.url), 'utf8');
function slice(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `Production section missing: ${start}`);
  assert.equal(source.indexOf(start, from + start.length), -1, 'Production section must be unique');
  return source.slice(from, to);
}
// All protection, API wrapping, DOM/click, observer scheduling and teardown implementations are real.
// Only host/API lookup, plugin props and the timer clock are adapters. Native DOM/MutationObserver are not stubbed.
const compiled = ts.transpileModule([
  slice('const 游戏表名 =', '\n/** 安装模板收敛后的五张游戏表'),
  slice('function 解析数据库数据', '\nasync function 限时等待'),
  slice('function 游戏表头兼容', '\n/** SP·数据库'),
  slice('export interface 数据库手动填表安全选择', '\n安装数据库手动填表保护();'),
].join('\n').replace(/^export\s+/gmu, ''), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText + '\nreturn { 安装数据库手动填表保护, 计算数据库手动填表安全选择, 游戏表头 };';

function executable() {
  if (process.env.RQGY_CHROMIUM_EXECUTABLE) return process.env.RQGY_CHROMIUM_EXECUTABLE;
  const root = path.join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
  const folders = existsSync(root) ? readdirSync(root).filter(name => /^chromium_headless_shell-\d+$/u.test(name)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })) : [];
  for (const folder of folders) {
    const file = path.join(root, folder, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
    if (existsSync(file)) return file;
  }
  throw new Error('An installed Chromium headless shell is required; set RQGY_CHROMIUM_EXECUTABLE. No browser is downloaded by this test.');
}
let child, socket, sequence = 0;
const pending = new Map();
async function send(method, params = {}, sessionId) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
before(async () => {
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Isolated browser startup timed out')), 10000);
    child = spawn(executable(), ['--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--no-first-run',
      '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${mkdtempSync(path.join(tmpdir(), 'rqgy-play039-'))}`, 'about:blank'],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.stderr.on('data', chunk => {
      stderr = (stderr + chunk.toString()).slice(-20000);
      const address = /DevTools listening on (ws:\/\/[^\s]+)/u.exec(stderr)?.[1];
      if (address) { clearTimeout(timeout); resolve(address); }
    });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Browser exited before connection (${code}): ${stderr}`)); });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.resolve(message.result);
  });
});
after(async () => {
  try { if (socket?.readyState === WebSocket.OPEN) await send('Browser.close'); } catch { /* Close may end the socket first. */ }
  socket?.close();
  if (child && child.exitCode === null) child.kill();
  for (const request of pending.values()) request.reject(new Error('Browser closed'));
  pending.clear();
});

function browserFixture(code, options) {
  const counts = { clicks: 0, protectedClicks: 0, reads: 0, executions: 0, unsafeFullSelect: 0, warnings: 0 };
  const allKeys = ['sheet_event', 'sheet_memory', 'sheet_promises', 'sheet_social', 'sheet_summary'];
  const protectedKeys = new Set(['sheet_event', 'sheet_social']);
  let ready = options.ready ?? false, selected = new Set(options.empty ? [] : allKeys), propsSelected = new Set(selected);
  let now = 0, nextId = 0, api;
  const timers = new Map(), chatListeners = [], fillCallbacks = [], controls = new Map();
  const timer = (fn, delay = 0) => { const id = ++nextId; timers.set(id, { fn, at: now + delay }); return id; };
  const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  const exported = Function('取数据库API', '宿主窗口', 'setTimeout', 'clearTimeout', 'eventOn', 'tavern_events', 'eventEmit', code)(
    () => api, () => window, timer, id => timers.delete(id),
    (_event, fn) => { const token = { fn, active: true }; chatListeners.push(token); return { stop() { token.active = false; } }; },
    { CHAT_CHANGED: 'TEST_CHAT_CHANGED' }, () => { counts.warnings++; },
  );
  const names = ['RQ_剧情事件', 'RQ_人物长期记忆', 'RQ_承诺与伏笔', 'RQ_社交轨迹', '纪要表'];
  const tableData = Object.fromEntries(allKeys.map((key, index) => [key, { name: names[index], content: [[...exported.游戏表头[names[index]]]] }]));
  if (options.customHeaders) for (const key of protectedKeys) tableData[key].content = [['row_id', '自定义列']];
  const makeApi = () => {
    let publicSelected = [...selected], manual = options.manual ?? false;
    const original = {
      exportTableAsJson: () => { counts.reads++; return tableData; },
      getManualSelectedTables: () => ({ selectedTables: [...publicSelected], hasManualSelection: manual }),
      setManualSelectedTables: keys => { publicSelected = [...keys]; manual = true; return true; },
      clearManualSelectedTables: () => { publicSelected = []; manual = false; return true; },
      manualUpdate: async () => true,
      registerTableFillStartCallback: callback => fillCallbacks.push(callback),
    };
    const value = { ...original };
    value.original = original;
    return value;
  };
  api = makeApi();
  function renderSelection() {
    propsSelected = new Set(selected);
    for (const [key, checkbox] of controls) {
      if (options.legacy) checkbox.checked = propsSelected.has(key);
      else {
        const value = String(propsSelected.has(key));
        if (checkbox.getAttribute('aria-checked') !== value) checkbox.setAttribute('aria-checked', value);
      }
    }
  }
  function build() {
    controls.clear();
    document.body.replaceChildren();
    const panel = document.createElement('section');
    panel.id = options.legacy ? 'test-manual-table-selector' : 'form-fill-manual-panel';
    const list = document.createElement('div');
    list.className = 'acu-v2-table-selector';
    panel.append(list);
    for (const key of allKeys) {
      const item = document.createElement(options.legacy ? 'label' : 'div');
      item.className = 'acu-v2-table-selector__item';
      const label = document.createElement('span'); label.className = 'acu-checkbox__label'; label.textContent = tableData[key].name;
      const checkbox = document.createElement(options.legacy ? 'input' : 'button');
      if (options.legacy) { checkbox.type = 'checkbox'; checkbox.dataset.key = key; checkbox.checked = selected.has(key); }
      else { checkbox.className = 'acu-checkbox'; checkbox.setAttribute('role', 'checkbox'); checkbox.setAttribute('aria-checked', String(selected.has(key))); }
      checkbox.disabled = !ready;
      checkbox.addEventListener('click', () => {
        counts.clicks++;
        if (protectedKeys.has(key)) counts.protectedClicks++;
        // V2 may reject a programmatic click because its props remain disabled even if native disabled was temporarily cleared.
        if (!ready && !options.legacy) return;
        const next = new Set(propsSelected);
        const checked = options.legacy ? checkbox.checked : !propsSelected.has(key);
        if (checked) next.add(key); else next.delete(key);
        selected = next;
        api.setManualSelectedTables([...selected]);
        queueMicrotask(renderSelection);
      });
      controls.set(key, checkbox); item.append(checkbox, label); list.append(item);
    }
    const selectAll = document.createElement('button'); selectAll.id = options.legacy ? 'test-manual-table-select-all' : 'select-all'; selectAll.textContent = '全选';
    selectAll.addEventListener('click', () => { counts.unsafeFullSelect++; selected = new Set(allKeys); renderSelection(); });
    const actions = document.createElement('div'); actions.className = 'acu-v2-form-fill-page__actions';
    const execute = document.createElement('button'); execute.id = options.legacy ? 'test-manual-update-card' : 'execute'; execute.textContent = '执行';
    execute.addEventListener('click', () => { counts.executions++; });
    actions.append(execute); panel.append(selectAll, actions); document.body.append(panel);
  }
  build();
  function snapshot() {
    return { counts: { ...counts }, selected: [...selected], api: api.getManualSelectedTables(), pending: timers.size,
      protectedDisabled: [...protectedKeys].every(key => controls.get(key)?.disabled),
      guarded: Boolean(window.__RQP_DATABASE_MANUAL_FILL_GUARD_V1__), apiWrapped: api.setManualSelectedTables !== api.original.setManualSelectedTables };
  }
  async function advance(ms, cap = 80) {
    const until = now + ms; let steps = 0;
    await flush();
    while (true) {
      const next = [...timers].filter(([, task]) => task.at <= until).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      if (steps++ >= cap) return { ...snapshot(), settled: false, steps };
      now = next[1].at; timers.delete(next[0]); next[1].fn(); await flush();
    }
    now = until; await flush();
    return { ...snapshot(), settled: true, steps };
  }
  exported.安装数据库手动填表保护();
  window.__play039 = {
    advance, snapshot, flush,
    setReady(value) { ready = value; for (const checkbox of controls.values()) checkbox.disabled = !ready; },
    selectKeys(keys) { selected = new Set(keys); renderSelection(); },
    clickAll() { document.querySelector(options.legacy ? '#test-manual-table-select-all' : '#select-all').click(); },
    clickExecute() { document.querySelector(options.legacy ? '#test-manual-update-card' : '#execute').click(); },
    overwriteDisabled() { for (const key of protectedKeys) controls.get(key).disabled = false; },
    sameDisabled() { for (const key of protectedKeys) controls.get(key).disabled = controls.get(key).disabled; },
    sameChecked() { for (const key of protectedKeys) controls.get(key).setAttribute('aria-checked', controls.get(key).getAttribute('aria-checked')); },
    roundTripDisabled() { for (const key of protectedKeys) { const control = controls.get(key); const original = control.disabled; control.disabled = !original; control.disabled = original; } },
    externalMixedChange() { this.roundTripDisabled(); controls.get('sheet_memory').disabled = !controls.get('sheet_memory').disabled; },
    removePanel() { document.body.replaceChildren(); },
    unrelatedChange() { document.body.append(document.createElement('div')); },
    rebuild() { build(); },
    cleanup() { window.__RQP_DATABASE_MANUAL_FILL_GUARD_V1__?.清理?.(); },
    reinstall() { exported.安装数据库手动填表保护(); },
    fillCallbacks() { for (const callback of fillCallbacks) callback(); },
    changeChat() { for (const token of chatListeners) if (token.active) token.fn(); },
    replaceApi() { const old = api; api = makeApi(); return old.setManualSelectedTables === old.original.setManualSelectedTables; },
    otherCard() { for (const key of allKeys) tableData[key] = { name: `其他卡${key}`, content: [['row_id', '自定义列']] }; build(); },
    pagehide() { window.dispatchEvent(new Event('pagehide')); },
    restoreCheck() { return api.setManualSelectedTables === api.original.setManualSelectedTables && api.manualUpdate === api.original.manualUpdate; },
  };
  return snapshot();
}
async function scenario(options, body) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  }
  try {
    await evaluate(`(${browserFixture.toString()})(${JSON.stringify(compiled)}, ${JSON.stringify(options)})`);
    return await evaluate(`(async env => { ${body} })(window.__play039)`);
  } finally {
    try { await evaluate('window.__play039?.cleanup()'); } finally { await send('Target.closeTarget', { targetId }); }
  }
}
const safe = ['sheet_memory', 'sheet_promises', 'sheet_summary'];

test('PLAY-039 永不就绪：五次既有启动扫描后稳定，不因自己disabled往返无限扫描', async () => {
  const r = await scenario({}, 'const a = await env.advance(9000); const b = await env.advance(20000); return { a, b };');
  assert.equal(r.a.settled, true, JSON.stringify(r));
  assert.equal(r.b.settled, true);
  assert.equal(r.b.counts.protectedClicks, r.a.counts.protectedClicks);
  assert.equal(r.b.counts.reads, r.a.counts.reads);
  assert.ok(r.b.counts.protectedClicks <= 12);
  assert.equal(r.b.counts.executions, 0);
});
test('PLAY-039 未就绪执行：保护不放行，失败后也不会自扫描空转', async () => {
  const r = await scenario({}, 'await env.advance(100); env.clickExecute(); return await env.advance(2000);');
  assert.equal(r.settled, true, JSON.stringify(r));
  assert.equal(r.counts.executions, 0);
  assert.ok(r.counts.warnings >= 1);
  assert.equal(r.protectedDisabled, true);
});
test('PLAY-039 未就绪转就绪：外部disabled真实变化触发重试并收敛内部选择', async () => {
  const r = await scenario({}, 'await env.advance(100); env.setReady(true); const a = await env.advance(9000); env.clickExecute(); const b = await env.advance(100); return { a, b };');
  assert.equal(r.a.settled, true, JSON.stringify(r));
  assert.deepEqual(r.a.selected, safe);
  assert.equal(r.a.protectedDisabled, true);
  assert.equal(r.b.counts.executions, 1);
});
test('PLAY-039 初始就绪：保护表排除，安全全选只选择剩余三表并只执行一次', async () => {
  const r = await scenario({ ready: true }, 'await env.advance(9000); env.selectKeys([]); await env.flush(); env.clickAll(); await env.flush(); const a = await env.advance(100); env.clickExecute(); const b = await env.advance(100); return { a, b };');
  assert.equal(r.a.settled, true, JSON.stringify(r));
  assert.deepEqual(r.a.selected, safe);
  assert.equal(r.a.counts.unsafeFullSelect, 0);
  assert.equal(r.b.counts.executions, 1);
});
test('PLAY-039 初始未选且未就绪：不制造取消动作', async () => {
  const r = await scenario({ empty: true, manual: true }, 'return await env.advance(9000);');
  assert.equal(r.settled, true, JSON.stringify(r));
  assert.equal(r.counts.protectedClicks, 0);
  assert.deepEqual(r.selected, []);
});
test('PLAY-039 旧版原生input取消和安全全选保持原行为', async () => {
  const r = await scenario({ legacy: true, ready: true }, 'await env.advance(9000); env.selectKeys([]); env.clickAll(); await env.flush(); return await env.advance(100);');
  assert.equal(r.settled, true, JSON.stringify(r));
  assert.deepEqual(r.selected, safe);
  assert.equal(r.counts.unsafeFullSelect, 0);
});
test('PLAY-039 组件重绘替换按钮：新的真实节点仍被保护且能完成取消', async () => {
  const r = await scenario({}, 'await env.advance(100); env.setReady(true); env.rebuild(); return await env.advance(9000);');
  assert.equal(r.settled, true, JSON.stringify(r));
  assert.deepEqual(r.selected, safe);
  assert.equal(r.protectedDisabled, true);
});
test('PLAY-039 外部再次覆盖disabled：锁定修正有限完成，不能永久忽略外部变化', async () => {
  const r = await scenario({}, 'await env.advance(100); const a = env.snapshot(); env.overwriteDisabled(); const b = await env.advance(150); return { a, b };');
  assert.equal(r.b.settled, true, JSON.stringify(r));
  assert.equal(r.b.protectedDisabled, true);
  assert.ok(r.b.counts.protectedClicks > r.a.counts.protectedClicks);
  assert.ok(r.b.counts.protectedClicks - r.a.counts.protectedClicks <= 4);
});
test('PLAY-039 外部重新勾选：aria-checked变化仍被观察并纠正', async () => {
  const r = await scenario({ ready: true }, 'await env.advance(9000); env.selectKeys(["sheet_event", "sheet_social", "sheet_memory"]); return await env.advance(100);');
  assert.equal(r.settled, true, JSON.stringify(r));
  assert.deepEqual(r.selected, ['sheet_memory']);
});
test('PLAY-039 相同disabled值写入：原生观察器收到记录也不重新扫描', async () => {
  const r = await scenario({}, 'await env.advance(100); const a = env.snapshot(); env.sameDisabled(); const b = await env.advance(100); return { a, b };');
  assert.equal(r.b.settled, true, JSON.stringify(r));
  assert.equal(r.a.counts.reads, r.b.counts.reads);
  assert.equal(r.a.counts.protectedClicks, r.b.counts.protectedClicks);
});
test('PLAY-039 普通DOM变化不会启动无界重试，同时仍允许一次新核对', async () => {
  const r = await scenario({}, 'await env.advance(100); const a = env.snapshot(); env.unrelatedChange(); const b = await env.advance(100); return { a, b };');
  assert.equal(r.b.settled, true, JSON.stringify(r));
  assert.ok(r.b.counts.reads > r.a.counts.reads);
  assert.ok(r.b.counts.protectedClicks - r.a.counts.protectedClicks <= 4);
});
test('PLAY-039 pagehide：取消待执行重放和扫描，恢复API，不接收迟到回调', async () => {
  const r = await scenario({}, 'await env.advance(100); env.clickExecute(); env.pagehide(); const a = env.snapshot(); env.unrelatedChange(); env.fillCallbacks(); env.changeChat(); const b = await env.advance(20000); return { a, b, restored: env.restoreCheck() };');
  assert.equal(r.b.settled, true, JSON.stringify(r));
  assert.equal(r.b.guarded, false);
  assert.equal(r.restored, true);
  assert.equal(r.b.counts.executions, 0);
  assert.equal(r.a.counts.reads, r.b.counts.reads);
});
test('PLAY-039 重复安装：旧实例清理，执行按钮不被双重派发', async () => {
  const r = await scenario({ ready: true }, 'await env.advance(9000); env.reinstall(); const a = await env.advance(9000); env.clickExecute(); const b = await env.advance(100); env.cleanup(); return { a, b, restored: env.restoreCheck() };');
  assert.equal(r.a.settled, true, JSON.stringify(r));
  assert.equal(r.b.counts.executions, 1);
  assert.equal(r.restored, true);
});
test('PLAY-039 API替换与切聊天：新API受保护，离开本卡恢复原方法', async () => {
  const r = await scenario({ ready: true }, 'await env.advance(9000); env.replaceApi(); env.changeChat(); const a = await env.advance(100); env.otherCard(); env.changeChat(); const b = await env.advance(100); env.fillCallbacks(); const c = await env.advance(100); return { a, b, c, restored: env.restoreCheck() };');
  assert.equal(r.a.settled, true, JSON.stringify(r));
  assert.equal(r.a.apiWrapped, true);
  assert.deepEqual(r.a.api.selectedTables, safe);
  assert.equal(r.b.settled, true);
  assert.equal(r.restored, true);
  assert.equal(r.c.counts.executions, 0);
});
test('PLAY-039 同名但不同表头自定义表不能被锁定或取消', async () => {
  const r = await scenario({ ready: true, customHeaders: true }, 'return await env.advance(9000);');
  assert.equal(r.settled, true, JSON.stringify(r));
  assert.equal(r.apiWrapped, false);
  assert.equal(r.counts.protectedClicks, 0);
  assert.equal(r.protectedDisabled, false);
});
test('PLAY-039 同批属性往返按首个旧值合并，两个控件不会互相串值', async () => {
  const r = await scenario({}, 'await env.advance(100); const a = env.snapshot(); env.roundTripDisabled(); const b = await env.advance(100); return { a, b };');
  assert.equal(r.b.settled, true, JSON.stringify(r));
  assert.equal(r.b.counts.reads, r.a.counts.reads);
  assert.equal(r.b.counts.protectedClicks, r.a.counts.protectedClicks);
});
test('PLAY-039 aria-checked同值写入不是新的组件状态', async () => {
  const r = await scenario({ ready: true }, 'await env.advance(9000); const a = env.snapshot(); env.sameChecked(); const b = await env.advance(100); return { a, b };');
  assert.equal(r.b.settled, true, JSON.stringify(r));
  assert.deepEqual(r.b.selected, safe);
  assert.equal(r.b.counts.reads, r.a.counts.reads);
});
test('PLAY-039 自身往返与另一控件真实变化同批：不能整批吞掉外部变化', async () => {
  const r = await scenario({}, 'await env.advance(100); const a = env.snapshot(); env.externalMixedChange(); const b = await env.advance(100); return { a, b };');
  assert.equal(r.b.settled, true, JSON.stringify(r));
  assert.ok(r.b.counts.reads > r.a.counts.reads);
  assert.ok(r.b.counts.protectedClicks - r.a.counts.protectedClicks <= 4);
});
test('PLAY-039 关闭面板后迟到执行重放不触发旧按钮，重开新面板仍可恢复', async () => {
  const r = await scenario({}, 'await env.advance(100); env.clickExecute(); env.removePanel(); const a = await env.advance(100); env.setReady(true); env.rebuild(); const b = await env.advance(9000); env.clickExecute(); const c = await env.advance(100); return { a, b, c };');
  assert.equal(r.a.settled, true, JSON.stringify(r));
  assert.equal(r.a.counts.executions, 0);
  assert.equal(r.b.settled, true);
  assert.deepEqual(r.b.selected, safe);
  assert.equal(r.c.counts.executions, 1);
});
