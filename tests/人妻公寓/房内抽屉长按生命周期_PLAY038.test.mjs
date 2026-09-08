/* eslint-disable import-x/no-nodejs-modules -- isolated real-Chrome SFC regression */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// All generated HTML, browser profiles, screenshots and reports stay in a unique evidence directory.
// No user browser/profile/host, network server, model, project source or formal dist is changed.
const require = createRequire(import.meta.url);
const ts = require('typescript');
const sfc = require('vue/compiler-sfc');
const root = fileURLToPath(new URL('../..', import.meta.url));
const evidence = path.join(root, '.codex-tmp/unified-repair-20260907', `play038-m5h9-${Date.now()}`);
mkdirSync(evidence, { recursive: true });
const chrome = process.env.RQGY_TEST_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
assert.ok(existsSync(chrome), 'An installed isolated test browser is required; do not replace this gate with a skip');
const componentPath = 'src/人妻公寓/界面/客户端/components/房内操作抽屉.vue';
const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const styles = [];
function compileSfc(relative, id) {
  const filename = path.join(root, relative);
  const { descriptor, errors } = sfc.parse(readFileSync(filename, 'utf8'), { filename });
  assert.deepEqual(errors, []);
  const script = sfc.compileScript(descriptor, { id, inlineTemplate: true });
  for (const style of descriptor.styles) {
    const result = sfc.compileStyle({ source: style.content, filename, id, scoped: style.scoped });
    assert.deepEqual(result.errors, []);
    styles.push(result.code);
  }
  return `${compile(script.content)}\nexports.default.__scopeId = ${JSON.stringify(id)};`;
}
const modules = {
  Drawer: compileSfc(componentPath, 'data-v-play038-drawer'),
  './Icon.vue': compileSfc('src/人妻公寓/界面/客户端/components/Icon.vue', 'data-v-play038-icon'),
  '../icons': compile(readFileSync(path.join(root, 'src/人妻公寓/界面/客户端/icons.ts'), 'utf8')),
  '../composables/抽屉状态机': compile(readFileSync(path.join(root, 'src/人妻公寓/界面/客户端/composables/抽屉状态机.ts'), 'utf8')),
};

// Runs inside the real browser. Only the clock and capture for synthetic-event cases are adapted.
// Native CDP input cases later restore native pointer capture; Vue/template/state-machine stay real.
function browserHarness() {
  const { createApp, h, shallowReactive, reactive, nextTick } = window.Vue;
  const Drawer = window.Drawer;
  const root = document.getElementById('app');
  const nativeCapture = HTMLElement.prototype.setPointerCapture;
  let app;
  let state;
  let calls;
  let serial = 0;
  let now = 0;
  let history = [];
  const pending = new Map();
  const clock = {
    tick(ms) {
      const end = now + ms;
      let loops = 0;
      while (true) {
        const due = [...pending.values()].filter(x => x.at <= end).sort((a, b) => a.at - b.at || a.id - b.id)[0];
        if (!due) break;
        if (++loops > 10000) throw new Error('Timer loop exceeded test bound');
        pending.delete(due.id);
        now = due.at;
        due.fn();
      }
      now = end;
    },
    lastHold() { return history.filter(x => x.ms === 1200).at(-1); },
    clear() { pending.clear(); history = []; now = 0; },
    countHold() { return [...pending.values()].filter(x => x.ms === 1200).length; },
  };
  window.setTimeout = (fn, ms = 0, ...args) => {
    const timer = { id: ++serial, at: now + Number(ms), ms: Number(ms), fn: () => fn(...args) };
    pending.set(timer.id, timer);
    history.push(timer);
    return timer.id;
  };
  window.clearTimeout = id => pending.delete(id);
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const settled = async () => { await nextTick(); await nextTick(); };
  const choice = () => root.querySelector('.action-choice:not(.choice-panel-leave-active) .choice-tile');
  const tile = () => root.querySelector('.scene-acts .tile');
  const close = () => root.querySelector('.action-choice:not(.choice-panel-leave-active) [aria-label="关闭选择"]');
  const counts = () => ({ ...calls });
  function equalCounts(success, short, note = '') {
    check(calls.success === success && calls.short === short,
      `${note} success=${calls.success}, short=${calls.short}; expected ${success}/${short}`);
  }
  async function mount(mobile, proxies = false, extra = {}) {
    if (app) app.unmount();
    await settled();
    root.replaceChildren();
    clock.clear();
    calls = { success: 0, short: 0, ordinary: 0, garbage: 0, capture: 0 };
    let actions = [{ kicker: 'TEST', icon: 'clock', 文案: '测试长按选择', 做: () => { calls.ordinary += 1; },
      选项: [{ kicker: 'HOLD', icon: 'clock', 文案: '长按确认（1200毫秒）', 提示: '松手计短按，关闭只取消',
        长按毫秒: 1200, 做: () => { calls.success += 1; }, 短按: () => { calls.short += 1; } }] }];
    if (proxies) actions = reactive(actions);
    state = shallowReactive({ mobile, desktopCollapsible: false, roomId: '201', actionCount: 1,
      suppressed: false, forcedOpen: false, actions, garbageVisible: false, videoTapeActive: false, ...extra });
    app = createApp({ setup: () => () => h(Drawer, { ...state, onOpenGarbage: () => { calls.garbage += 1; } }) });
    app.mount(root);
    await settled();
    check(tile(), 'Fixture must render the actual action tile');
    return state;
  }
  async function openChoice() {
    tile().click();
    await settled();
    check(choice(), 'The actual template must render choice buttons');
    return choice();
  }
  function pointer(node, type, id = 1) {
    node.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id,
      pointerType: 'mouse', isPrimary: id === 1, button: 0, buttons: type === 'pointerdown' ? 1 : 0 }));
  }
  function key(node, type, value = 'Enter', repeat = false) {
    node.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, key: value,
      code: value === ' ' ? 'Space' : value, repeat }));
  }
  async function begin(input = 'pointer') {
    const button = await openChoice();
    if (input === 'pointer') pointer(button, 'pointerdown');
    else key(button, 'keydown', input === 'space' ? ' ' : 'Enter');
    check(clock.lastHold(), 'The actual handler must schedule the hold timer');
    return button;
  }
  window.play038 = {
    mount, settled, openChoice, counts, clock,
    state: () => state,
    restoreNativeCapture: () => { HTMLElement.prototype.setPointerCapture = nativeCapture; },
    async suite(mobile) {
      const results = [];
      HTMLElement.prototype.setPointerCapture = function () { calls.capture += 1; };
      async function run(name, fn) {
        try { await fn(); results.push({ name, ok: true }); }
        catch (error) { results.push({ name, ok: false, error: String(error.stack || error) }); }
        finally { if (app) app.unmount(); app = null; await settled(); clock.clear(); }
      }
      for (const proxies of [false, true]) {
        const flavor = proxies ? 'reactive actions' : 'raw actions';
        for (const input of ['pointer', 'enter', 'space']) {
          await run(`${flavor}/${input}: full hold succeeds exactly once`, async () => {
            await mount(mobile, proxies);
            const button = await begin(input);
            const old = clock.lastHold();
            clock.tick(1199); equalCounts(0, 0);
            clock.tick(1); equalCounts(1, 0);
            old.fn();
            if (input === 'pointer') { pointer(button, 'pointerup'); pointer(button, 'pointerup'); }
            else key(button, 'keyup', input === 'space' ? ' ' : 'Enter');
            button.click(); clock.tick(3000); equalCounts(1, 0, 'late/repeated release');
          });
          await run(`${flavor}/${input}: early release records one short press only`, async () => {
            await mount(mobile, proxies);
            const button = await begin(input);
            const old = clock.lastHold();
            clock.tick(1199);
            if (input === 'pointer') { pointer(button, 'pointerup'); pointer(button, 'pointerup'); }
            else { key(button, 'keyup', input === 'space' ? ' ' : 'Enter'); key(button, 'keyup', input === 'space' ? ' ' : 'Enter'); }
            old.fn(); clock.tick(3000); equalCounts(0, 1);
          });
        }
        for (const cancellation of ['close', 'toggle', 'pointercancel', 'lostcapture', 'blur', 'room', 'suppress', 'video', 'replace', 'disable', 'disable-in-place', 'option-remove', 'option-replace-in-place', 'duration', 'callback-in-place', 'unmount', 'remount']) {
          await run(`${flavor}/${cancellation}: cancellation and queued old callback do not dispatch`, async () => {
            const s = await mount(mobile, proxies, { garbageVisible: true });
            const button = await begin();
            const old = clock.lastHold();
            clock.tick(400);
            switch (cancellation) {
              case 'close': close().click(); break;
              case 'toggle': tile().click(); break;
              case 'pointercancel': pointer(button, 'pointercancel'); break;
              case 'lostcapture': pointer(button, 'lostpointercapture'); break;
              case 'blur': button.dispatchEvent(new FocusEvent('blur')); break;
              case 'room': s.roomId = '302'; break;
              case 'suppress': s.suppressed = true; break;
              case 'video': s.videoTapeActive = true; break;
              case 'replace': s.actions = [{ ...s.actions[0], 选项: [...s.actions[0].选项] }]; break;
              case 'disable': s.actions[0].禁用 = true; s.actions = [...s.actions]; break;
              case 'disable-in-place': s.actions[0].禁用 = true; break;
              case 'option-replace-in-place': s.actions[0].选项 = [{ ...s.actions[0].选项[0] }]; break;
              case 'callback-in-place': s.actions[0].选项[0].做 = () => { calls.success += 100; }; break;
              case 'option-remove': s.actions[0].选项 = []; s.actions = [...s.actions]; break;
              case 'duration': s.actions[0].选项[0].长按毫秒 = 900; s.actions = [...s.actions]; break;
              case 'unmount': app.unmount(); app = null; break;
              case 'remount': await mount(mobile, proxies); break;
            }
            await settled();
            old.fn(); // Explicit queued-callback injection, not real waiting and not core substitution.
            pointer(button, 'pointerup'); clock.tick(5000); equalCounts(0, 0);
            check(clock.countHold() === 0, 'Cancelled hold must not leave a pending timer');
          });
        }
        await run(`${flavor}: cancellation then same-option restart rejects stale timer ownership`, async () => {
          await mount(mobile, proxies);
          await begin(); const old = clock.lastHold();
          close().click(); await settled();
          await begin(); const current = clock.lastHold();
          check(current.id !== old.id, 'Restart requires a new timer');
          old.fn(); equalCounts(0, 0);
          check(clock.countHold() === 1, 'Old callback must not consume current hold');
          clock.tick(1200); equalCounts(1, 0);
        });
        await run(`${flavor}: another pointer release cannot fail the active hold`, async () => {
          await mount(mobile, proxies);
          const button = await begin();
          pointer(button, 'pointerup', 2); equalCounts(0, 0);
          clock.tick(1200); equalCounts(1, 0);
        });
        await run(`${flavor}: another pointer cancellation cannot consume active hold`, async () => {
          await mount(mobile, proxies);
          const button = await begin();
          pointer(button, 'pointercancel', 2); equalCounts(0, 0);
          clock.tick(1200); equalCounts(1, 0);
        });
        await run(`${flavor}: another key release/repeat cannot consume Enter hold`, async () => {
          await mount(mobile, proxies);
          const button = await begin('enter');
          key(button, 'keydown', 'Enter', true);
          key(button, 'keyup', ' '); equalCounts(0, 0);
          clock.tick(1200); equalCounts(1, 0);
        });
        await run(`${flavor}: plain choice still dispatches once and closes`, async () => {
          const s = await mount(mobile, proxies);
          delete s.actions[0].选项[0].长按毫秒;
          const button = await openChoice();
          button.click(); await settled(); equalCounts(1, 0);
        });
        await run(`${flavor}: ordinary action cancels active choice without a success/short callback`, async () => {
          const s = await mount(mobile, proxies);
          s.actions = [...s.actions, { kicker: 'OTHER', icon: 'door', 文案: '普通操作', 做: () => { calls.ordinary += 1; } }];
          await settled(); await begin(); const old = clock.lastHold();
          root.querySelectorAll('.scene-acts .tile')[1].click();
          await settled(); old.fn(); equalCounts(0, 0);
          check(calls.ordinary === 1, 'Ordinary callback is not removed');
        });
        await run(`${flavor}: garbage action cancels hold without consuming business callbacks`, async () => {
          await mount(mobile, proxies, { garbageVisible: true });
          await begin(); const old = clock.lastHold();
          root.querySelector('.garbage-open').click(); await settled(); old.fn(); equalCounts(0, 0);
          check(calls.garbage === 1, 'Garbage emit preserved');
        });
        if (mobile) {
          await run(`${flavor}: drawer handle collapses and cancels hold`, async () => {
            await mount(true, proxies); await begin(); const old = clock.lastHold();
            root.querySelector('.drawer-handle').click(); await settled(); old.fn(); equalCounts(0, 0);
          });
          await run(`${flavor}: forced-open choice can collapse, cancel its hold and resume`, async () => {
            await mount(true, proxies, { forcedOpen: true, suppressed: true });
            await begin(); root.querySelector('.drawer-handle').click(); await settled();
            clock.tick(1200); equalCounts(0, 0);
            check(root.querySelector('.drawer-handle').getAttribute('aria-expanded') === 'false', 'Forced choice must enter collapsed state');
            const leaving = root.querySelector('.drawer-panel');
            check(!leaving || leaving.classList.contains('drawer-leave-active'), 'Only the exit transition may retain the panel');
            root.querySelector('.drawer-handle').click(); await settled();
            await begin(); clock.tick(1200); equalCounts(1, 0);
          });
          await run(`${flavor}: viewport mode switch cancels old hold`, async () => {
            const s = await mount(true, proxies); await begin(); const old = clock.lastHold();
            s.mobile = false; await settled(); old.fn(); equalCounts(0, 0);
          });
        }
      }
      this.restoreNativeCapture();
      return results;
    },
  };
}

const vueSource = readFileSync(require.resolve('vue/dist/vue.global.prod.js'), 'utf8');
const html = `<!doctype html><html class="rq-still"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{margin:0;padding:20px;box-sizing:border-box;background:#f5f4f2;color:#252331;font:16px sans-serif;--ink:#252331;--ink-faint:#615e6a;--pink:#b75182}#app{max-width:720px;margin:360px auto 0}*{box-sizing:border-box}
${styles.join('\n')}</style><body><main id="app"></main><script>${vueSource.replaceAll('</script', '<\\/script')}</script><script>
const sources = ${JSON.stringify(modules).replaceAll('</script', '<\\/script')}; const cache = {};
function load(name){ if(name==='vue') return Vue; if(cache[name]) return cache[name].exports; if(!sources[name]) throw Error('Unresolved test import '+name); const module={exports:{}}; cache[name]=module; new Function('require','exports','module',sources[name])(load,module.exports,module); return module.exports; }
window.Drawer=load('Drawer').default; (${browserHarness.toString()})();
</script></body></html>`;
const htmlPath = path.join(evidence, 'component.html');
writeFileSync(htmlPath, html);

// CDP over anonymous pipes: no listening port and no connection to the user's running browser.
async function startBrowser(name) {
  const profile = path.join(evidence, `${name}-profile`);
  const child = spawn(chrome, ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking', '--disable-component-update',
    '--remote-debugging-pipe', `--user-data-dir=${profile}`, 'about:blank'],
  { stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'] });
  let buffer = '';
  let nextId = 0;
  let stderr = '';
  const pending = new Map();
  child.stderr.on('data', chunk => { stderr += chunk.toString(); });
  const rejectAll = error => { for (const task of pending.values()) { clearTimeout(task.timer); task.reject(error); } pending.clear(); };
  child.on('error', rejectAll);
  child.on('exit', code => rejectAll(new Error(`Test browser exited ${code}: ${stderr.slice(-2000)}`)));
  child.stdio[4].on('data', chunk => {
    buffer += chunk.toString();
    let boundary;
    while ((boundary = buffer.indexOf('\0')) >= 0) {
      const raw = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 1);
      if (!raw) continue;
      const response = JSON.parse(raw);
      const task = pending.get(response.id);
      if (!task) continue;
      pending.delete(response.id); clearTimeout(task.timer);
      if (response.error) task.reject(new Error(JSON.stringify(response.error))); else task.resolve(response.result);
    }
  });
  function send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
      pending.set(id, { resolve, reject, timer });
      child.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
    });
  }
  const version = await send('Browser.getVersion');
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);
  async function evaluate(expression) {
    const result = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  return { page, evaluate, version, async close() {
    try { await send('Browser.close'); } finally { child.kill(); writeFileSync(path.join(evidence, `${name}-browser.log`), stderr); }
  } };
}

const summary = [];
for (const viewport of [{ name: 'desktop', width: 1440, height: 1000, mobile: false }, { name: 'mobile', width: 390, height: 844, mobile: true }]) {
  test(`PLAY-038 real Chrome ${viewport.name} ${viewport.width}x${viewport.height}`, { timeout: 90000 }, async t => {
    const browser = await startBrowser(viewport.name);
    const record = { viewport, browser: browser.version, results: [], sourceSha256: createHash('sha256').update(readFileSync(path.join(root, componentPath))).digest('hex') };
    summary.push(record);
    try {
      await browser.page('Page.enable');
      await browser.page('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
      const { frameTree } = await browser.page('Page.getFrameTree');
      await browser.page('Page.setDocumentContent', { frameId: frameTree.frame.id, html });
      record.results = await browser.evaluate(`play038.suite(${viewport.mobile})`);
      for (const result of record.results) await t.test(result.name, () => assert.equal(result.ok, true, result.error));
      async function center(selector) {
        return browser.evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e) throw Error('Missing native-input target'); const r=e.getBoundingClientRect(); const x=r.x+r.width/2,y=r.y+r.height/2; return {x,y,hit:e.contains(document.elementFromPoint(x,y))}; })()`);
      }
      async function click(selector) {
        const point = await center(selector); assert.equal(point.hit, true, 'Native input target center must be hittable');
        await browser.page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
        await browser.page('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', buttons: 1, clickCount: 1 });
        await browser.page('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', buttons: 0, clickCount: 1 });
        await browser.evaluate('play038.settled()');
      }
      await t.test('native pointer capture, exact threshold and repeated release', async () => {
        await browser.evaluate(`play038.mount(${viewport.mobile})`);
        await click('.scene-acts .tile');
        const point = await center('.action-choice:not(.choice-panel-leave-active) .choice-tile');
        assert.equal(point.hit, true);
        await browser.page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
        await browser.page('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', buttons: 1, clickCount: 1 });
        await browser.evaluate('play038.clock.tick(1199)');
        assert.equal((await browser.evaluate('play038.counts()')).success, 0);
        await browser.evaluate('play038.clock.tick(1)');
        await browser.page('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', buttons: 0, clickCount: 1 });
        const result = await browser.evaluate('play038.counts()');
        assert.equal(result.success, 1); assert.equal(result.short, 0); assert.equal(result.capture, 0, 'Native capture must not use synthetic-case shim');
        record.nativePointer = result;
      });
      await t.test('native keyboard Space hold and release', async () => {
        await browser.evaluate(`play038.mount(${viewport.mobile})`);
        await click('.scene-acts .tile');
        await browser.evaluate("document.querySelector('.action-choice:not(.choice-panel-leave-active) .choice-tile').focus()");
        await browser.page('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
        await browser.evaluate('play038.clock.tick(1200)');
        await browser.page('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
        const result = await browser.evaluate('play038.counts()');
        assert.equal(result.success, 1); assert.equal(result.short, 0);
        record.nativeKeyboard = result;
      });
      await t.test('native touch cancellation does not dispatch success or short press', async () => {
        await browser.evaluate(`play038.mount(${viewport.mobile})`);
        await click('.scene-acts .tile');
        await browser.page('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
        const point = await center('.action-choice:not(.choice-panel-leave-active) .choice-tile');
        assert.equal(point.hit, true);
        await browser.page('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y, id: 3 }] });
        assert.equal(await browser.evaluate('Boolean(play038.clock.lastHold())'), true, 'Native touch must really start the hold');
        await browser.evaluate('play038.clock.tick(400)');
        await browser.page('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
        await browser.evaluate('play038.clock.lastHold().fn(); play038.clock.tick(2000)');
        const result = await browser.evaluate('play038.counts()');
        assert.equal(result.success, 0); assert.equal(result.short, 0); assert.equal(result.capture, 0);
        record.nativeTouchCancel = result;
        await browser.page('Emulation.setTouchEmulationEnabled', { enabled: false });
      });
      await browser.evaluate(`play038.mount(${viewport.mobile})`);
      await click('.scene-acts .tile');
      const screenshot = await browser.page('Page.captureScreenshot', { format: 'png' });
      writeFileSync(path.join(evidence, `${viewport.name}.png`), Buffer.from(screenshot.data, 'base64'));
      record.dimensions = await browser.evaluate('({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth})');
    } finally {
      await browser.close();
      writeFileSync(path.join(evidence, 'results.json'), JSON.stringify(summary, null, 2));
      console.log(`PLAY038_EVIDENCE ${evidence}`);
    }
  });
}
