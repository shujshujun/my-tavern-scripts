/* eslint-disable import-x/no-nodejs-modules -- 无网络的真实Vue档案渲染；仅隔离无关专题和图片表面。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import lodash from 'lodash';

const root = new URL('../../../', import.meta.url);
const file = fileURLToPath(new URL('src/人妻公寓/界面/客户端/components/档案卡.vue', root));
const require = createRequire(file);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({});
const noWrite = () => { throw new Error('PLAY006_READ_ONLY_VIEW_MUST_NOT_WRITE'); };
globalThis.updateVariablesWith = noWrite;
globalThis.insertOrAssignVariables = noWrite;
globalThis.generate = noWrite;
globalThis.generateRaw = noWrite;

export const { Schema, 创建户节点 } = require('../../../schema.ts');
export const config = require('../../../stageConfig.ts');
export const clock = require('../../../脚本/游戏逻辑/楼层时钟.ts');
export const risk = require('../../../脚本/游戏逻辑/丈夫线路风险策略.ts');
export const phase = require('../../../脚本/游戏逻辑/角色阶段体验.ts');
export const clone = value => lodash.cloneDeep(value);

const nil = () => null;
const no = () => false;
const adapters = new Map([
  ['./Icon.vue', { __esModule: true, default: { render: () => null } }],
  ['./衣柜.vue', { __esModule: true, default: { render: () => null } }],
  ['../assets', { 角色立绘候选: () => [] }],
  ['../衣柜素材', { 衣柜默认状态图: nil, 衣柜物品缩略图: () => '' }],
  ['../../../衣柜造型配置', { 是完整外装道具: no }],
  ['../../../脚本/游戏逻辑/冷落系统', { 余波有冻结效力: no }],
  ['../../../脚本/游戏逻辑/怀孕系统', { 怀孕已公开: no }],
  ['../../../脚本/游戏逻辑/守护系统', { 每日堕落上限: 8 }],
  ['../../../脚本/游戏逻辑/结算系统', { 可晋阶: no, 可启动母亲药物首夜: no, 普通首夜时段已满足: no, 晋阶预约现场已满足: no }],
  ['../../../脚本/游戏逻辑/阶段线路系统', { 读取关系线索: nil, 读取开门线索: nil }],
  ['../../../脚本/游戏逻辑/家庭计划系统', { 家庭计划档案提示: nil }],
  ['../../../脚本/游戏逻辑/借种结局系统', { 借种档案提示: nil }],
  ['../../../脚本/游戏逻辑/第二机位系统', { 读取第二机位档案提示: nil }],
  ['../../../脚本/游戏逻辑/录像带V4状态', { 读取录像带V4档案提示: nil }],
  ['../../../脚本/游戏逻辑/不再留门系统', { 读取不再留门档案提示: nil }],
  ['../../../脚本/游戏逻辑/许曼君分居系统', { 读取许曼君分居档案提示: nil }],
  ['../../../脚本/游戏逻辑/许曼君离婚系统', { 许曼君离婚档案提示: nil }],
  ['../../../脚本/游戏逻辑/许曼君分居钥匙柜', { 读取许曼君201钥匙柜卡: nil }],
  ['../../../脚本/游戏逻辑/安若妍不必停系统', { 读取安若妍不必停档案提示: nil }],
  ['../../../脚本/游戏逻辑/安若妍换掉系统', { 读取安若妍换掉档案提示: nil, 安若妍换掉攻略步骤: () => [] }],
  ['../../../脚本/游戏逻辑/回国系统', { 回国档案提示: nil }],
  ['../../../脚本/游戏逻辑/双重继承系统', { 双重继承档案提示: nil }],
  ['../../../脚本/游戏逻辑/成人CG系统', { CG条目: nil, 角色CG总数全部变体: () => 0 }],
  ['../../../脚本/游戏逻辑/衣柜系统', { 当前可见立绘SKU: () => '', 外装已脱下: no }],
]);
const actual = new Set([
  '../../../stageConfig', '../../../脚本/游戏逻辑/楼层时钟',
  '../../../脚本/游戏逻辑/角色阶段体验', '../composables/配偶档案展示',
]);
const components = new Map();
function loadComponent(ssr = true) {
  if (components.has(ssr)) return components.get(ssr);
  const compiler = require('vue/compiler-sfc');
  const ts = require('typescript');
  const { descriptor, errors } = compiler.parse(readFileSync(file, 'utf8'), { filename: file });
  assert.deepEqual(errors, []);
  const script = compiler.compileScript(descriptor, {
    id: 'play006-dossier', inlineTemplate: true, templateOptions: { ssr, compilerOptions: { hoistStatic: false } },
  });
  const js = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', 'require', js)(module, module.exports, spec => {
    if (spec === 'vue') return require('vue');
    if (spec === 'vue/server-renderer') return require('vue/server-renderer');
    if (adapters.has(spec)) return adapters.get(spec);
    // eslint-disable-next-line import-x/no-dynamic-require -- 只加载已枚举的真实被测模块。
    if (actual.has(spec)) return require(spec + '.ts');
    assert.fail(`未声明的档案组件依赖：${spec}`);
  });
  const component = module.exports.default;
  components.set(ssr, component);
  return component;
}

export function fresh() {
  const data = Schema.parse({ 户: Object.fromEntries(config.门牌列表.map(m => [m, 创建户节点(0)])) });
  for (const h of Object.values(data.户)) {
    h.妻.当前阶段 = 5;
    h.妻.裂缝.已确认 = true;
    h.夫.疑心值 = 71;
    h.夫.信任值 = 23;
  }
  data.系统._绝对时段 = 20;
  return data;
}

export function retired() {
  const data = fresh();
  data.系统._许曼君分居.阶段 = '已完成';
  data.系统._许曼君分居.玩家最终关系选择 = '继续关系';
  data.系统._许曼君离婚.法律离婚已成立 = true;
  data.系统._已完成特殊场景.push(config.许曼君离婚场景ID);
  data.户['201'].夫._居住模式 = '正式退居';
  return data;
}

/** 执行原组件全部setup/template；不挂载App、图片、宿主存储或真实设备。 */
export async function render(data, options = {}) {
  const { createSSRApp, h } = require('vue');
  const { renderToString } = require('vue/server-renderer');
  const props = {
    door: '201', data, ready: true, currentRoom: '201', absolutePeriod: data.系统._绝对时段,
    unlockedCg: new Set(), sending: false, wifeNearby: false, evidenceSlots: [],
    avatarFailed: {}, portraitFailed: {}, itemFailed: {}, avatarImage: () => 'about:blank', itemImage: () => '',
    ...options,
  };
  const app = createSSRApp({ render: () => h(loadComponent(), props) });
  return renderToString(app);
}

export function text(html) {
  return html.replace(/<[^>]*>/gu, '').replace(/\s+/gu, '');
}

/** Vue客户端渲染器的单次挂载；内存节点承担宿主I/O，组件setup、依赖追踪与patch均为真实实现。 */
export function mount(data, options = {}) {
  const { createRenderer, reactive, h, nextTick } = require('vue');
  const node = (type, value = '') => ({ type, value, props: {}, style: {}, children: [], parent: null });
  const detach = child => {
    if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = null;
  };
  const insert = (child, parent, anchor = null) => {
    detach(child); child.parent = parent;
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(index < 0 ? parent.children.length : index, 0, child);
  };
  const renderer = createRenderer({
    createElement: tag => node(tag), createText: value => node('#text', value), createComment: () => node('#comment'),
    setText: (target, value) => { target.value = value; },
    setElementText: (target, value) => { for (const child of target.children) child.parent = null; target.children = []; target.value = value; },
    insert, remove: detach,
    patchProp: (target, key, _old, value) => { target.props[key] = value; },
    parentNode: target => target.parent,
    nextSibling: target => target.parent?.children[target.parent.children.indexOf(target) + 1] ?? null,
    insertStaticContent: (html, parent, anchor) => { const child = node('#static', html.replace(/<[^>]*>/gu, '')); insert(child, parent, anchor); return [child, child]; },
  });
  const props = reactive({ door: '201', data, ready: true, currentRoom: '201', absolutePeriod: data.系统._绝对时段,
    unlockedCg: new Set(), sending: false, wifeNearby: false, evidenceSlots: [],
    avatarFailed: {}, portraitFailed: {}, itemFailed: {}, avatarImage: () => 'about:blank', itemImage: () => '', ...options });
  const app = renderer.createApp({ render: () => h(loadComponent(false), props) });
  const root = node('root'); app.mount(root);
  const content = target => target.type === '#comment' ? '' : target.value + target.children.map(content).join('');
  const containsClass = (target, name) => String(target.props.class ?? '').split(/\s+/u).includes(name) || target.children.some(child => containsClass(child, name));
  return { props, nextTick, instance: () => app._instance.subTree.component.uid,
    text: () => content(root).replace(/\s+/gu, ''), hasClass: name => containsClass(root, name), unmount: () => app.unmount() };
}
