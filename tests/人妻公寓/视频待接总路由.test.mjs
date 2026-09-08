/* eslint-disable import-x/no-nodejs-modules -- PLAY-035实际预约/开合/总路由/call及接听消费者，外部I/O隔离。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import { 装配真实时间事务门 } from './helpers/时间事务门装配.mjs';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
const ts = require('typescript');
globalThis._ = lodash;
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const video = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话系统.ts');
const base = fileURLToPath(new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url));
const clone = value => lodash.cloneDeep(value);
const fresh = () => Schema.parse({ 户: { '302': 创建户节点(0) } });
const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function functionFrom(file, name, deps) {
  const source = readFileSync(path.join(base, file), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(node, name);
  return Function(...Object.keys(deps), `const exports={};${compile(node.getText(ast))};return ${name};`)(...Object.values(deps));
}

class Element {
  constructor(tag, cls = '', html = '') {
    this.tag = tag; this.children = []; this.parent = null; this.style = {}; this.events = new Map();
    const classes = new Set(cls.split(' ').filter(Boolean));
    this.classList = { contains: x => classes.has(x), add: x => classes.add(x), remove: x => classes.delete(x),
      toggle: (x, yes) => yes ? classes.add(x) : classes.delete(x) };
    this.innerHTML = html;
  }
  set innerHTML(html) {
    this.html = html; this.children = [];
    // 仅承担DOM适配：call生产函数写出的两个原始button，并不替换其标题或事件回调。
    for (const match of html.matchAll(/<button class="([^"]+)" title="([^"]+)">/g)) {
      const button = new Element('button', match[1]); button.title = match[2]; this.appendChild(button);
    }
  }
  get innerHTML() { return this.html; }
  appendChild(el) { el.parent = this; this.children.push(el); return el; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
  querySelector(selector) {
    for (const child of this.children) {
      if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) return child;
      const descendant = child.querySelector(selector); if (descendant) return descendant;
    }
    return null;
  }
  addEventListener(name, fn) { this.events.set(name, fn); }
  click() { return this.events.get('click')?.(); }
}

function phoneFixture(mode = 'video') {
  const e = { state: fresh(), id: 'incoming-a', epoch: 0, now: 1000, ready: true, headers: [], pages: [],
    events: [], writes: 0, statReads: 0, busy: false, held: false, failWrite: false, validators: new Set(), errors: [],
    meeting: { 场景中: false, 可打开: true, 已开放: false, 参与妻: [], 禁用原因: '' }, room: '302', beforeWrite: null, beforeCallQueue: null };
  if (mode === 'video' || mode === 'active') {
    assert.equal(video.预约母亲视频通话终幕(e.state, 'video-ticket', 0).成功, true);
    assert.equal(e.state.系统._待接来电.期, -1, '真实预约不借旧电话字段');
  }
  if (mode === 'active') assert.equal(video.接听母亲视频通话终幕(e.state).成功, true);
  if (mode === 'voice') e.state.系统._待接来电.期 = 1;
  e.root = new Element('div'); e.screen = new Element('div', 'rqp-screen'); e.root.appendChild(e.screen);
  const doc = { getElementById: () => e.root };
  const noRequest = () => { throw new Error('外部请求/真实模型不属于来电路由测试'); };
  const globals = {
    _: lodash, eventEmit: (name, ...args) => { e.events.push([name, ...args]); return e.onEvent?.(name, ...args); },
    Date: class extends Date { static now() { return e.now; } },
    setTimeout: () => 1, clearTimeout() {}, console: { warn() {}, error() {} },
    generate: noRequest, generateRaw: noRequest, fetch: noRequest,
  };
  const father = {
    活动父亲通话: functionFrom('手机/交互/父亲通话.ts', '活动父亲通话', { 当前手机数据: () => e.state }),
    恢复父亲通话: async () => {}, 注册父亲通话UI端口: ports => { e.fatherPorts = ports; },
    母亲圆场手机提示: () => '',
  };
  const adapters = new Map();
  const adapt = (file, exports) => adapters.set(path.join(base, file), exports);
  adapt('../../schema.ts', { Schema });
  adapt('../../不再留门契约.ts', { 不再留门手机只读原因: () => '' });
  adapt('mvuIO.ts', { 读最近有效stat: () => { e.statReads++; return clone(e.state); } });
  adapt('楼层时钟.ts', require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts'));
  adapt('手机已读水位.ts', require('../../src/人妻公寓/脚本/游戏逻辑/手机已读水位.ts'));
  adapt('母亲视频通话系统.ts', video);
  adapt('手机/数据层.ts', { 读库: () => ({ 消息: [], 圈: [], 节拍: {}, 读到: {} }), 会话有未读: () => false, 朋友圈有未读: () => false });
  adapt('手机/运行时上下文.ts', { 手机楼轴已就绪: () => e.ready, 末楼: () => 40, 当前手机数据: () => e.state,
    当前手机绝对时段: () => e.state?.系统._绝对时段 ?? -1, 当前聊天ID: () => e.id });
  adapt('手机/静音会议旁路.ts', { 获取静音会议手机状态: () => e.meeting });
  adapt('手机/交互/父亲通话.ts', father);
  adapt('手机/壳/会话瞬态.ts', { 删除会话引用草稿() {}, 清理失效会话引用草稿() {}, 清理失效手机聊天批次() {},
    开始新手机聊天渲染世代: () => 1, 当前会话批次键: () => 'draft', 收口手机聊天输入键() {} });
  adapt('手机/壳/挂载.ts', { 挂载手机() {}, 拉回手机视口() {}, 显示手机教程() {},
    注册手机挂载端口: ports => { e.mountPorts = ports; } });
  adapt('手机/壳/资源与皮肤.ts', { ROOT_ID: 'test-phone', 根文档: () => doc,
    el: (tag, cls, html = '') => new Element(tag, cls, html), 头像块: () => '<span>头像</span>', 手机图标: () => '' });
  adapt('手机/壳/渲染/共享.ts', { 渲染头: (_context, title) => e.headers.push(title) });
  for (const page of ['chats', 'chat', 'moments', 'talk', 'settings', 'invite']) {
    adapt(`手机/壳/渲染/${page}.ts`, { [`渲染${page}`]: () => e.pages.push(page) });
  }
  const modules = new Map();
  const actual = new Set(['手机/壳/红点与开合.ts', '手机/壳/渲染/index.ts', '手机/壳/渲染/call.ts'].map(file => path.join(base, file)));
  function load(file) {
    if (adapters.has(file)) return adapters.get(file);
    if (modules.has(file)) return modules.get(file).exports;
    assert.ok(actual.has(file), `未声明的路由依赖：${file}`);
    const module = { exports: {} }; modules.set(file, module);
    const source = readFileSync(file, 'utf8');
    Function('module', 'exports', 'require', ...Object.keys(globals), compile(source))(
      module, module.exports, spec => load(path.resolve(path.dirname(file), spec) + '.ts'), ...Object.values(globals));
    return module.exports;
  }
  e.render = load(path.join(base, '手机/壳/渲染/index.ts')).渲染;
  e.shell = load(path.join(base, '手机/壳/红点与开合.ts'));
  e.open = () => { e.now += 500; e.shell.打开手机(true); };
  e.page = () => e.mountPorts.读取当前页面().名;
  e.button = cls => e.screen.querySelector(`.${cls}`);
  return e;
}

for (const [mode, page, title] of [['none', 'chats', null], ['voice', 'call', '接听'], ['video', 'call', '接听视频'], ['active', 'talk', null]]) {
  test(`PLAY-035 真实开合经过已注册总路由：${mode}`, () => {
    const e = phoneFixture(mode), before = clone(e.state);
    e.open(); assert.equal(e.page(), page);
    assert.equal(e.button('ok')?.title ?? null, title);
    assert.deepEqual(e.state, before, '打开页面不自动接听或修改来电');
    assert.equal(e.events.some(([name]) => name.includes('接听')), false);
    if (title) {
      e.button('ok').click();
      assert.deepEqual(e.events.at(-1), [mode === 'video' ? '人妻公寓:接听母亲视频通话终幕' : '人妻公寓:接听来电', e.id]);
      assert.deepEqual(e.state, before, '按钮只发意图，不能代写核心状态');
    }
  });
}

test('PLAY-035 视频待接重复打开/关页后再开保持原票，不补写语音期数', () => {
  const e = phoneFixture(), before = clone(e.state);
  for (let i = 0; i < 3; i++) {
    e.open(); assert.equal(e.button('ok')?.title, '接听视频');
    e.button('no').click(); assert.equal(e.page(), 'chats');
    assert.equal(e.shell.有来电(), true);
  }
  e.open(); e.now += 500; e.shell.打开手机(false); assert.equal(e.root.classList.contains('open'), false);
  e.open(); assert.equal(e.button('ok')?.title, '接听视频'); assert.deepEqual(e.state, before);
});

for (const mode of ['清除预约', '完成后清场', '回档到预约前', '切到无来电聊天', '变量未就绪']) {
  test(`PLAY-035 已开call页面在${mode}后正确回退`, () => {
    const e = phoneFixture(); e.open();
    if (mode === '清除预约') e.state = fresh();
    if (mode === '完成后清场') {
      e.state.系统._母亲视频通话终幕.状态 = '已完成';
      e.state.系统._父亲通话 = fresh().系统._父亲通话;
    }
    if (mode === '回档到预约前') { e.epoch++; e.state = fresh(); }
    if (mode === '切到无来电聊天') { e.id = 'chat-b'; e.state = fresh(); }
    if (mode === '变量未就绪') e.state = null;
    e.render(); assert.equal(e.page(), 'chats'); assert.equal(e.button('ok'), null);
  });
}

test('PLAY-035 真实接通后call转talk，序列化刷新仍恢复活动通话', () => {
  const e = phoneFixture(); e.open();
  assert.equal(video.接听母亲视频通话终幕(e.state).成功, true);
  e.render(); assert.equal(e.page(), 'talk'); assert.equal(e.button('ok'), null);
  const r = phoneFixture('none'); r.state = Schema.parse(JSON.parse(JSON.stringify(e.state)));
  r.open(); assert.equal(r.page(), 'talk');
});

test('PLAY-035 视频待接经过序列化刷新/未就绪楼轴仍可继续，不覆盖恢复屏', () => {
  const e = phoneFixture(); const r = phoneFixture('none'); r.state = Schema.parse(JSON.parse(JSON.stringify(e.state)));
  r.ready = false; r.open(); assert.equal(r.button('ok'), null);
  assert.ok(r.screen.children.some(x => x.children.some(y => y.innerHTML.includes('正在恢复微信记录'))));
  r.ready = true; r.render(); assert.equal(r.button('ok')?.title, '接听视频');
});

test('PLAY-035 总路由只使用本帧data，待接判据不二次读取宿主', () => {
  const e = phoneFixture(); e.open(); e.statReads = 0;
  e.render(); assert.equal(e.statReads, 1); assert.equal(e.button('ok')?.title, '接听视频');
  const before = clone(e.state), reads = e.statReads;
  assert.equal(e.shell.有待接来电(e.state), true);
  assert.equal(e.shell.有待接来电(null), false); assert.equal(e.shell.有待接来电(undefined), false);
  const malformed = fresh(); malformed.系统._母亲视频通话终幕.状态 = '待接听';
  assert.equal(e.shell.有待接来电(malformed), false, '缺标识的残留状态不成为可接视频');
  assert.equal(e.statReads, reads); assert.deepEqual(e.state, before);
});

test('PLAY-035 旧语音冲突仍拒绝预约，会议优先级不被新增来电条件放开', () => {
  const e = phoneFixture('voice'), before = clone(e.state);
  assert.equal(video.预约母亲视频通话终幕(e.state, 'conflicting', 0).成功, false);
  assert.deepEqual(e.state, before); e.open(); assert.equal(e.button('ok')?.title, '接听');
  e.meeting = { 场景中: true, 可打开: true, 已开放: true, 参与妻: ['302'] };
  e.render(); assert.equal(e.page(), 'chats'); assert.equal(e.button('ok'), null);
});

function installVideoReceiver(e) {
  const source = readFileSync(path.join(base, 'index.ts'), 'utf8');
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  let wrapper, listener;
  function visit(n) {
    if (ts.isFunctionDeclaration(n) && n.name?.text === '安全操作') wrapper = n.getText(ast);
    if (ts.isExpressionStatement(n) && ts.isCallExpression(n.expression) && n.expression.expression.getText(ast) === 'eventOn' &&
        n.expression.arguments[0]?.text === '人妻公寓:接听母亲视频通话终幕') listener = n.getText(ast);
    ts.forEachChild(n, visit);
  }
  visit(ast); assert.ok(wrapper); assert.ok(listener);
  let queue = Promise.resolve(), callQueue = Promise.resolve();
  const env = { _: lodash, ...video, ...require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts'),
    eventOn: (_name, fn) => { e.receive = fn; }, eventEmit: (...args) => e.events.push(args),
    console: { warn: (...args) => e.errors.push(args), error: (...args) => e.errors.push(args) },
    当前聊天ID: () => e.id, 当前时间线切换世代: () => e.epoch, 时间线切换协调中: () => false,
    回合进行中: () => e.busy, 前台生成租约持有中: () => e.held,
    读取最近有效: () => e.state ? { raw: { stat_data: clone(e.state) }, data: Schema.parse(clone(e.state)) } : null,
    读场景: () => ({ 房间id: e.room }),
    排队MVU操作: fn => { const p = queue.then(fn); queue = p.catch(() => undefined); return p; },
    排队父亲通话整表写: fn => {
      const p = callQueue.then(async () => { if (e.beforeCallQueue) await e.beforeCallQueue(); return fn(); });
      callQueue = p.catch(() => undefined); return p;
    },
    登记MVU提交校验: fn => { e.validators.add(fn); return () => e.validators.delete(fn); },
    脚本写入: async (_raw, data) => {
      if (e.beforeWrite) await e.beforeWrite();
      if ([...e.validators].some(valid => !valid())) throw new Error('controlled timeline invalidation');
      if (e.failWrite) throw new Error('controlled save failure/timeout');
      e.state = Schema.parse(clone(data)); e.writes++;
    },
    捕获保护快照() {},
  };
  const runtimeEnv = 装配真实时间事务门(env);
  Function(...Object.keys(runtimeEnv), compile(`${wrapper}\n${listener}`))(...Object.values(runtimeEnv));
}

for (const mode of ['成功', '保存失败', '忙态', '错地点', '旧聊天意图', '排队后切聊', '写入前回档']) {
  test(`PLAY-035 真实视频按钮→主接听监听/安全壳/专属接听：${mode}`, async () => {
    const e = phoneFixture(); installVideoReceiver(e); e.open();
    const before = clone(e.state);
    const button = e.button('ok'); assert.equal(button?.title, '接听视频');
    button.click(); const [event, id] = e.events.at(-1); assert.equal(event, '人妻公寓:接听母亲视频通话终幕');
    e.failWrite = mode === '保存失败'; e.busy = mode === '忙态';
    if (mode === '错地点') e.room = '大堂';
    if (mode === '排队后切聊') e.beforeCallQueue = () => { e.id = 'chat-b'; };
    if (mode === '写入前回档') e.beforeWrite = () => { e.epoch++; };
    await e.receive(mode === '旧聊天意图' ? 'old-chat' : id);
    assert.equal(e.validators.size, 0);
    if (mode === '成功') {
      assert.equal(e.writes, 1); assert.equal(e.state.系统._母亲视频通话终幕.状态, '通话中');
      assert.equal(e.state.系统._父亲通话.标识, 'video-ticket');
      assert.equal(e.state.系统._待接来电.期, -1);
      e.render(); assert.equal(e.page(), 'talk');
    } else {
      assert.equal(e.writes, 0); assert.deepEqual(e.state, before);
      e.failWrite = false; e.busy = false; e.room = '302'; e.beforeCallQueue = null; e.beforeWrite = null;
      await e.receive(e.id); assert.equal(e.writes, 1, '原待接票在失败后可重试');
    }
  });
}

test('PLAY-035 同一视频接听意图重复入队不重复建立通话，原生语音字段始终不伪造', async () => {
  const e = phoneFixture(); installVideoReceiver(e); e.open();
  assert.equal(e.button('ok')?.title, '接听视频');
  await Promise.all([e.receive(e.id), e.receive(e.id)]);
  assert.equal(e.writes, 1); assert.equal(e.state.系统._父亲通话.下次回复序号, 2);
  assert.equal(e.state.系统._待接来电.期, -1);
});
