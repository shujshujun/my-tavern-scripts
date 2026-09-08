/* eslint-disable import-x/no-nodejs-modules -- PLAY-011实际货架、资格与购买，宿主I/O隔离。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { 装配真实时间事务门 } from './helpers/时间事务门装配.mjs';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
const ts = require('typescript');
const { computed, ref } = require('vue');
globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '201' } });
globalThis.getLastMessageId = () => 40;
globalThis.SillyTavern = { chat: [], getCurrentChatId: () => 'play011' };
const noIO = () => { throw new Error('该货架/购票测试不允许宿主写入或模型调用'); };
globalThis.insertOrAssignVariables = noIO;
globalThis.updateVariablesWith = noIO;
globalThis.generate = noIO;
globalThis.generateRaw = noIO;
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: noIO } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const config = require('../../src/人妻公寓/stageConfig.ts');
const shop = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const separation = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
const divorce = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
const agreement = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
const ending = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');
const clock = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const appFile = fileURLToPath(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url));
const appSource = readFileSync(appFile, 'utf8');
const clone = value => lodash.cloneDeep(value);
const reload = value => Schema.parse(JSON.parse(JSON.stringify(value)));
const ids = [separation.许曼君分居任务ID, divorce.许曼君离婚商品ID, agreement.安若妍不必停商品ID, ending.安若妍换掉商品ID];

/** 保持原App computed和按钮函数，不重写货架判断；只解析所用的真实导入。 */
function frontend(initial) {
  const code = appSource.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(code, 'App script setup');
  const ast = ts.createSourceFile(appFile, code, ts.ScriptTarget.Latest, true);
  const names = ['旧录像带遗留商品可见', '录像带剧情商品可见', '货架', '商品锁定原因',
    '商品购买文案', '商品不可购买', '商品价格文案', '买'];
  const chosen = ast.statements.filter(n =>
    (ts.isFunctionDeclaration(n) && names.includes(n.name?.text)) ||
    (ts.isVariableStatement(n) && n.declarationList.declarations.some(d => names.includes(d.name.getText(ast)))));
  assert.equal(chosen.length, names.length, '完整提取指定生产声明');
  const used = new Set();
  function walk(n) { if (ts.isIdentifier(n)) used.add(n.text); ts.forEachChild(n, walk); }
  chosen.forEach(walk);
  const data = ref(clone(initial));
  const events = [];
  const env = { data, computed, ref, 时段: computed(() => clock.当前时段(data.value)),
    显示商店: ref(true), _: lodash, eventEmit: (...args) => events.push(args),
    提交界面事务: fn => { fn(); return true; } };
  for (const n of ast.statements) {
    if (!ts.isImportDeclaration(n) || n.importClause?.isTypeOnly) continue;
    const bindings = n.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const imports = bindings.elements.filter(b => !b.isTypeOnly && used.has(b.name.text) && !(b.name.text in env));
    if (!imports.length) continue;
    const spec = n.moduleSpecifier.text;
    assert.ok(spec.startsWith('.'), `unexpected App dependency: ${spec}`);
    // eslint-disable-next-line import-x/no-dynamic-require -- 仅加载生产声明中实际使用的命名导入。
    const module = require(path.resolve(path.dirname(appFile), spec) + '.ts');
    for (const b of imports) env[b.name.text] = module[(b.propertyName ?? b.name).text];
  }
  const js = ts.transpileModule(chosen.map(n => n.getText(ast)).join('\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const api = Function(...Object.keys(env), `${js}\nreturn {${names.join(',')}};`)(...Object.values(env));
  return { ...api, data, events };
}
function fresh() {
  const d = Schema.parse({ 户: Object.fromEntries(['101', '201', '301'].map(m => [m, 创建户节点(0)])), 现金: 12000 });
  d.户['101'].妻.当前阶段 = 3; // 仅打开特殊场景页签，不代替201/301的资格。
  return d;
}
function ready(kind) {
  const d = fresh();
  const m = kind < 2 ? '201' : '301';
  d.户[m].妻.当前阶段 = 5;
  d.户[m].妻.阶段性癖 = config.户静态表[m].招牌性癖;
  if (kind === 0) d.系统._已完成特殊场景.push('肉偿账本');
  if (kind === 1) Object.assign(d.系统._许曼君分居, {
    阶段: '已完成', 工资卡状态: '已归还赵国强', 丈夫已知玩家关系: true, 丈夫已选择外住: true,
    生活用品已取完: true, 许曼君已拒绝恢复共同生活: true, 双方同意进入办理: true,
    钥匙位置: '管理员室201钥匙格', 钥匙用途: '待离婚交接', 玩家最终关系选择: '继续关系',
  });
  if (kind === 3) Object.assign(d.系统._安若妍不必停, {
    阶段: '已完成', 江辰已明确看见: true, 江辰已接受互不干涉: true, 提前通知已约定: true,
  });
  return reload(d);
}
const routeKeys = ['_许曼君分居', '_许曼君离婚', '_安若妍不必停', '_安若妍换掉'];
const onShelf = (shelves, id) => shelves.some(page => page.商品.some(item => item.id === id));
function assertShelves(d) {
  const ui = frontend(d);
  const host = shop.取货架(d);
  assert.deepEqual(ui.货架.value.map(p => [p.页签, p.商品.map(x => x.id)]),
    host.map(p => [p.页签, p.商品.map(x => x.id)]), '两端资格相同；空文案只是展示差异');
  return ui;
}

for (let kind = 0; kind < 4; kind++) {
  test(`PLAY-011 正常对照：${ids[kind]}现有宿主资格、拒绝和单次购买本来有效`, () => {
    const unready = fresh(), before = clone(unready);
    assert.equal(shop.购买(unready, ids[kind]).成功, false); assert.deepEqual(unready, before);
    const d = ready(kind);
    assert.equal(onShelf(shop.取货架(d), ids[kind]), true);
    assert.equal(shop.购买(d, ids[kind]).成功, true);
    const purchased = clone(d);
    assert.equal(shop.购买(d, ids[kind]).成功, false); assert.deepEqual(d, purchased);
  });
}

for (let kind = 0; kind < 4; kind++) {
  for (const state of ['未满足', '刚满足', '已购买', '进行中', '已完成', '序列化重载']) {
    test(`PLAY-011 ${ids[kind]}：${state}两端货架与真实购买一致`, () => {
      let d = state === '未满足' ? fresh() : ready(kind);
      if (state === '已购买') assert.equal(shop.购买(d, ids[kind]).成功, true);
      if (state === '进行中') {
        assert.equal(shop.购买(d, ids[kind]).成功, true);
        if (kind === 0) d.系统[routeKeys[kind]].阶段 = '待三人摊牌';
      }
      if (state === '已完成') {
        if (kind === 3) d.系统._已完成特殊场景.push(ids[kind]);
        else d.系统[routeKeys[kind]].阶段 = '已完成';
      }
      if (state === '序列化重载') d = reload(d);
      const before = clone(d), ui = assertShelves(d);
      assert.deepEqual(d, before, '货架计算不写玩家状态');
      const available = ['刚满足', '序列化重载'].includes(state);
      assert.equal(onShelf(ui.货架.value, ids[kind]), available);
      if (available) {
        assert.equal(ui.商品不可购买(config.道具表[ids[kind]]), false);
        const cash = d.现金, backpack = clone(d.背包);
        assert.equal(shop.购买(d, ids[kind]).成功, true);
        if (kind === 0) {
          assert.equal(d.现金, cash); assert.deepEqual(d.背包, backpack);
          assert.equal(d.系统._许曼君分居.阶段, '待初谈');
        } else {
          assert.equal(d.现金, cash - config.道具表[ids[kind]].价格);
          assert.equal(d.背包.filter(id => id === ids[kind]).length, 1);
          assert.equal(d.系统[routeKeys[kind]].阶段, '已购买');
        }
      } else {
        assert.equal(shop.购买(d, ids[kind]).成功, false);
        assert.deepEqual(d, before, '不可购买时不扣钱、不改任务或背包');
      }
    });
  }
}

test('PLAY-011 免费分居明确标为领取，其他零价证物不因该例外上架', () => {
  const d = ready(0), ui = assertShelves(d), item = config.道具表[ids[0]];
  assert.equal(ui.商品购买文案(item), '领取');
  assert.equal(ui.商品价格文案(item), '免费领取');
  const zero = Object.values(config.道具表).filter(x => (x.价格 ?? 0) <= 0 && !x.剧情占位 && !x.特殊剧情占位 && x.类别 !== '性癖' && x.id !== ids[0]);
  assert.ok(zero.length > 0);
  for (const x of zero) assert.equal(onShelf(ui.货架.value, x.id), false, x.id);
});

for (let kind = 0; kind < 4; kind++) {
  test(`PLAY-011 ${ids[kind]} 旧按钮在资格变化后禁用，点击不再派发旧意图`, () => {
    const ui = frontend(ready(kind)), item = config.道具表[ids[kind]];
    assert.equal(onShelf(ui.货架.value, item.id), true);
    ui.data.value = fresh();
    assert.equal(onShelf(ui.货架.value, item.id), false);
    assert.equal(ui.商品不可购买(item), true);
    assert.ok(ui.商品锁定原因(item).length);
    ui.买(item.id);
    assert.equal(ui.events.filter(([name]) => name === '人妻公寓:购买').length, 0);
    ui.data.value = ready(kind);
    ui.买(item.id);
    assert.deepEqual(ui.events.filter(([name]) => name === '人妻公寓:购买'), [['人妻公寓:购买', item.id]]);
  });
  test(`PLAY-011 ${ids[kind]} 同步双击只购买一次；回档到领取前恢复货架`, () => {
    const d = ready(kind), origin = clone(d);
    const results = [shop.购买(d, ids[kind]), shop.购买(d, ids[kind])];
    assert.deepEqual(results.map(x => x.成功), [true, false]);
    assert.equal(onShelf(assertShelves(d).货架.value, ids[kind]), false);
    const restored = reload(origin);
    assert.equal(onShelf(assertShelves(restored).货架.value, ids[kind]), true);
    assert.equal(shop.购买(restored, ids[kind]).成功, true);
  });
}

for (let kind = 1; kind < 4; kind++) {
  test(`PLAY-011 ${ids[kind]} 钱不足仍展示锁定，不混淆上架与支付资格`, () => {
    const d = ready(kind); d.现金 = 0;
    const ui = assertShelves(d), item = config.道具表[ids[kind]], before = clone(d);
    assert.equal(onShelf(ui.货架.value, item.id), true);
    assert.equal(ui.商品不可购买(item), true); assert.equal(ui.商品购买文案(item), '钱不够');
    assert.equal(shop.购买(d, item.id).成功, false); assert.deepEqual(d, before);
  });
}

let compiledShop;
function shopComponent() {
  if (compiledShop) return compiledShop;
  const compiler = require('vue/compiler-sfc');
  const source = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/商店.vue', import.meta.url), 'utf8');
  const { descriptor, errors } = compiler.parse(source, { filename: '商店.vue' });
  assert.deepEqual(errors, []);
  const script = compiler.compileScript(descriptor, {
    id: 'play011-shop', inlineTemplate: true, templateOptions: { compilerOptions: { hoistStatic: false } },
  });
  const js = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', 'require', js)(module, module.exports, spec => {
    if (spec === 'vue') return require('vue');
    if (spec === './Icon.vue') return { default: { setup: () => () => null } };
    assert.fail(`未声明的组件运行依赖：${spec}`);
  });
  compiledShop = module.exports.default;
  return compiledShop;
}

/** Vue原组件+实际父层computed，在无网络的内存渲染器上检查交互；不声称像素/设备验收。 */
function mountShop(ui) {
  const vue = require('vue');
  const node = (tag, text = '') => ({ tag, text, props: {}, children: [], parent: null });
  const remove = el => {
    if (!el.parent) return;
    const index = el.parent.children.indexOf(el);
    if (index >= 0) el.parent.children.splice(index, 1);
    el.parent = null;
  };
  const renderer = vue.createRenderer({
    createElement: tag => node(tag), createText: text => node('#text', text), createComment: text => node('#comment', text),
    setText: (el, text) => { el.text = text; },
    setElementText: (el, text) => { el.text = text; el.children = []; },
    patchProp: (el, key, _prev, value) => { el.props[key] = value; },
    insert: (el, parent, anchor) => {
      remove(el); const index = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(index < 0 ? parent.children.length : index, 0, el); el.parent = parent;
    },
    remove, parentNode: el => el.parent,
    nextSibling: el => el.parent?.children[el.parent.children.indexOf(el) + 1] ?? null,
    setScopeId() {},
  });
  const open = vue.ref(true), sending = vue.ref(false), root = node('root');
  const app = renderer.createApp({ setup: () => () => vue.h(shopComponent(), {
    open: open.value, sending: sending.value, cash: ui.data.value.现金, shelves: ui.货架.value,
    itemFailed: {}, itemImage: () => 'about:blank', itemVisual: () => ({ 类: '普通', 标: '物品', 图: '' }),
    lockReasons: ui.商品锁定原因, purchaseLabel: ui.商品购买文案,
    purchaseDisabled: ui.商品不可购买, priceLabel: ui.商品价格文案,
    onBuy: ui.买, onClose: () => { open.value = false; },
  }) });
  app.mount(root);
  const flatten = el => [el, ...el.children.flatMap(flatten)];
  const text = el => (el.tag === '#comment' ? '' : el.text) + el.children.map(text).join('');
  const buttons = () => flatten(root).filter(el => el.tag === 'button');
  const click = el => {
    assert.ok(el, '目标按钮存在');
    if (el.props.disabled) return false;
    el.props.onClick?.({ target: el, currentTarget: el }); return true;
  };
  const cards = () => flatten(root).filter(el => String(el.props.class).split(' ').includes('ware-card'));
  return { root, open, sending, click, text, buttons, cards,
    select: async () => { click(buttons().find(el => text(el).trim() === '特殊场景')); await vue.nextTick(); },
    next: vue.nextTick, unmount: () => app.unmount() };
}

for (let kind = 0; kind < 4; kind++) {
  test(`PLAY-011 实际商店组件${ids[kind]}：选择页签、关闭重开、忙态按钮和精确购买意图`, async () => {
    const ui = frontend(ready(kind)), view = mountShop(ui), name = config.道具表[ids[kind]].名称;
    try {
      await view.select();
      const card = () => view.cards().find(el => view.text(el).includes(name));
      assert.ok(card());
      const buyButton = () => card().children.find(el => el.tag === 'button');
      assert.equal(view.text(buyButton()).trim(), kind === 0 ? '领取' : '买下');
      if (kind === 0) assert.ok(view.text(card()).includes('免费领取'));
      view.click(view.buttons().find(el => String(el.props.class).includes('sheet-close')));
      await view.next(); assert.equal(view.cards().length, 0);
      view.open.value = true; await view.next(); assert.ok(card(), '关闭再开保留仍有效页签');
      view.sending.value = true; await view.next();
      assert.equal(buyButton().props.disabled, true); assert.equal(view.click(buyButton()), false);
      assert.equal(ui.events.length, 0);
      view.sending.value = false; await view.next(); view.click(buyButton());
      assert.deepEqual(ui.events, [['人妻公寓:购买', ids[kind]]]);
      const current = reload(ui.data.value); assert.equal(shop.购买(current, ids[kind]).成功, true);
      ui.data.value = current; await view.next(); assert.equal(card(), undefined);
      ui.data.value = fresh(); await view.next(); assert.equal(card(), undefined);
      ui.data.value = ready(kind); await view.next(); assert.ok(card(), '回档重载的合格状态重新显示');
    } finally { view.unmount(); }
  });
}

function purchaseHost(initial) {
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  const selected = new Map();
  let listener;
  function visit(n) {
    if (ts.isFunctionDeclaration(n) && ['安全操作', '落地'].includes(n.name?.text)) selected.set(n.name.text, n.getText(ast));
    if (ts.isExpressionStatement(n) && ts.isCallExpression(n.expression) && n.expression.expression.getText(ast) === 'eventOn' &&
        n.expression.arguments[0]?.text === '人妻公寓:购买') listener = n.getText(ast);
    ts.forEachChild(n, visit);
  }
  visit(ast); assert.equal(selected.size, 2); assert.ok(listener);
  const e = { state: clone(initial), chat: 'shop-a', epoch: 0, busy: false, held: false,
    writes: 0, failWrite: false, events: [], errors: [], validators: new Set(), beforeWrite: null, beforeQueue: null };
  let queue = Promise.resolve();
  const deps = {
    _: lodash, ...config, ...require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts'),
    购买: shop.购买, eventOn: (_name, fn) => { e.submit = fn; }, eventEmit: (...args) => e.events.push(args),
    console: { warn: (...args) => e.errors.push(args), error: (...args) => e.errors.push(args) },
    当前聊天ID: () => e.chat, 当前时间线切换世代: () => e.epoch, 时间线切换协调中: () => false,
    回合进行中: () => e.busy, 前台生成租约持有中: () => e.held,
    读场景: () => ({ 房间id: '201' }), 当前楼层: () => 40,
    读取最近有效: () => ({ raw: { stat_data: clone(e.state) }, data: reload(e.state) }),
    排队MVU操作: fn => {
      const task = queue.then(async () => { if (e.beforeQueue) await e.beforeQueue(); return fn(); });
      queue = task.catch(() => undefined); return task;
    },
    登记MVU提交校验: fn => { e.validators.add(fn); return () => e.validators.delete(fn); },
    脚本写入: async (_raw, data) => {
      if (e.beforeWrite) await e.beforeWrite();
      if ([...e.validators].some(valid => !valid())) throw new Error('controlled timeline invalidation');
      if (e.failWrite) throw new Error('controlled save failure');
      e.state = reload(data); e.writes++;
    },
    同步全部角色阶段世界书: async () => {}, 捕获保护快照: () => {},
    即时开演: noIO, 接入线路: noIO, // 四件购票/领取不演正文，若误路由测试直接失败。
  };
  const js = ts.transpileModule([...selected.values(), listener].join('\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const runtimeDeps = 装配真实时间事务门(deps);
  Function(...Object.keys(runtimeDeps), js)(...Object.values(runtimeDeps));
  return e;
}

for (let kind = 0; kind < 4; kind++) {
  for (const mode of ['保存成功', '保存失败', '忙态', '排队后资格改变', '排队后切聊', '写回前回档', '写回前切聊']) {
    test(`PLAY-011 ${ids[kind]}真实购买监听/安全操作/落地：${mode}`, async () => {
      const e = purchaseHost(ready(kind));
      e.failWrite = mode === '保存失败'; e.busy = mode === '忙态';
      if (mode === '排队后资格改变') e.beforeQueue = () => { e.state = fresh(); };
      if (mode === '排队后切聊') e.beforeQueue = () => { e.chat = 'shop-b'; };
      if (mode === '写回前回档') e.beforeWrite = () => { e.epoch++; };
      if (mode === '写回前切聊') e.beforeWrite = () => { e.chat = 'shop-b'; };
      const before = clone(e.state);
      await e.submit(ids[kind]);
      assert.equal(e.validators.size, 0);
      if (mode === '保存成功') {
        assert.equal(e.writes, 1); assert.equal(onShelf(assertShelves(e.state).货架.value, ids[kind]), false);
      } else {
        assert.equal(e.writes, 0);
        assert.deepEqual(e.state, mode === '排队后资格改变' ? fresh() : before);
        e.failWrite = false; e.busy = false; e.beforeWrite = null; e.beforeQueue = null;
        e.state = ready(kind);
        await e.submit(ids[kind]);
        assert.equal(e.writes, 1, '失败/取消回到合格状态后可重试');
      }
    });
  }
  test(`PLAY-011 ${ids[kind]}两个前端购买意图进入真实串行壳只提交一次`, async () => {
    const ui = frontend(ready(kind)), e = purchaseHost(ready(kind));
    ui.买(ids[kind]); ui.买(ids[kind]);
    const intents = ui.events.filter(([name]) => name === '人妻公寓:购买');
    assert.equal(intents.length, 2, '前端可能收到同一渲染拍的双击，不能只靠按钮');
    await Promise.all(intents.map(([, id]) => e.submit(id)));
    assert.equal(e.writes, 1); assert.equal(e.validators.size, 0);
    ui.data.value = reload(e.state);
    assert.equal(onShelf(ui.货架.value, ids[kind]), false);
  });
}

test('PLAY-011 四件上架函数纯读取，未开通规则不借用其他角色或后续完成事实', () => {
  const { 剧情商品货架可见 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店剧情货架.ts');
  function freeze(obj) { Object.values(obj).forEach(x => { if (x && typeof x === 'object') freeze(x); }); return Object.freeze(obj); }
  for (let kind = 0; kind < 4; kind++) {
    const d = ready(kind), before = clone(d);
    assert.equal(剧情商品货架可见(freeze(d), config.道具表[ids[kind]]), true);
    assert.deepEqual(d, before);
  }
  for (const id of ['不存在的物品', '工具箱']) assert.equal(剧情商品货架可见(fresh(), { id, 价格: 0 }), null);
  for (let kind = 1; kind < 4; kind++) {
    for (const price of [undefined, 0, -1]) assert.equal(剧情商品货架可见(ready(kind), { id: ids[kind], 价格: price }), false);
  }
});

test('PLAY-011 分居/离婚/不必停/换掉每个必要前置分别缺失时仍不上架', () => {
  const variants = [
    [0, d => { d.户['201'].妻.当前阶段 = 4; }],
    [0, d => { d.户['201'].妻.阶段性癖 = ''; }],
    [0, d => { d.系统._已完成特殊场景 = []; }],
    ...['丈夫已知玩家关系', '丈夫已选择外住', '生活用品已取完', '许曼君已拒绝恢复共同生活', '双方同意进入办理']
      .map(key => [1, d => { d.系统._许曼君分居[key] = false; }]),
    [2, d => { d.户['301'].妻.当前阶段 = 4; }],
    [2, d => { d.户['301'].妻.阶段性癖 = ''; }],
    ...['江辰已明确看见', '江辰已接受互不干涉', '提前通知已约定']
      .map(key => [3, d => { d.系统._安若妍不必停[key] = false; }]),
  ];
  for (const [kind, change] of variants) {
    const d = ready(kind); change(d);
    const before = clone(d);
    assert.equal(onShelf(assertShelves(d).货架.value, ids[kind]), false);
    assert.equal(shop.购买(d, ids[kind]).成功, false); assert.deepEqual(d, before);
  }
});

test('PLAY-011 普通页签/服饰进度/占位/旧状态保留两端一致，读取不改变整表', () => {
  for (let stage = 0; stage <= 5; stage++) {
    const d = fresh(); d.户['101'].妻.当前阶段 = stage;
    d.户['101'].妻.裂缝.已确认 = stage > 0;
    const before = clone(d), ui = assertShelves(d);
    assert.deepEqual(d, before);
    assert.equal(ui.货架.value.some(p => p.页签 === '服饰'), stage >= 2);
    assert.equal(ui.货架.value.some(p => p.页签 === '特殊场景'), stage >= 3);
    for (const item of ui.货架.value.flatMap(p => p.商品).filter(x => x.剧情占位 || x.特殊剧情占位)) {
      assert.equal(ui.商品不可购买(item), true);
      const original = clone(d); assert.equal(shop.购买(d, item.id).成功, false); assert.deepEqual(d, original);
    }
  }
});
