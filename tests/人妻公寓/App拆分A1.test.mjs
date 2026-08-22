/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 A1 图标/素材/局部类型等价外移，不依赖空格/Prettier 行宽。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const icons源码 = readFileSync(new URL('./icons.ts', 客户端目录), 'utf8');
const assets源码 = readFileSync(new URL('./assets.ts', 客户端目录), 'utf8');
const types源码 = readFileSync(new URL('./types.ts', 客户端目录), 'utf8');
const Icon源码 = readFileSync(new URL('./components/Icon.vue', 客户端目录), 'utf8');
const 地图源码 = readFileSync(new URL('./components/地图.vue', 客户端目录), 'utf8');
const 录像带操作源码 = readFileSync(new URL('./components/录像带操作.vue', 客户端目录), 'utf8');
const 互动源码 = readFileSync(new URL('./components/静音会议互动.vue', 客户端目录), 'utf8');
const 锁定提示源码 = readFileSync(new URL('./components/静音会议锁定提示.vue', 客户端目录), 'utf8');
const 回合输入源码 = readFileSync(new URL('./components/回合输入.vue', 客户端目录), 'utf8');
const 房内操作抽屉源码 = readFileSync(new URL('./components/房内操作抽屉.vue', 客户端目录), 'utf8');

const 图标键们 = [
  'cart', 'bag', 'cctv', 'book', 'map', 'expand', 'exit', 'sun', 'moon', 'phone',
  'chat', 'door', 'bell', 'lock', 'home', 'arrow', 'trash', 'clock', 'tv', 'coin',
  'ops', 'tool', 'gift', 'letter', 'search', 'rewind', 'dice', 'dress', 'drug',
  'favor', 'kink', 'peep', 'scene',
];
const 素材常量名 = [
  '版本素材基址', '录像带双屏关闭图', '录像带左屏亮起图', '录像带双屏亮起图',
  '公寓外部背景图', '晨跑公园背景图', '健身房背景图',
  '清醒咖啡道具图', '集中胶囊道具图', '运动饮料道具图', '强效营养剂道具图',
  '安全套道具图', '专注训练手册道具图', '蛋白粉道具图',
  '素材基址', '成人CG基址', 'CG解锁存储键',
];
const 局部类型名 = [
  '风闻账视图', '风闻事件视图', '无耗时拜访记录', '由头日记录', '卡动作',
  '客户端时间方式', '静音会议互动ID', '静音会议峰值模式', '静音会议筹备步骤',
  '静音会议运行状态', '静音会议活动指针', '立绘项', '道具视觉类型', '卷轴条',
  '移动端全屏选择', '全屏根', '全屏文档', '酒馆原生提示词模块',
];

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

test('五个目标文件存在，App 与新模块导入关系正确，新模块不反向导入 App', () => {
  for (const [名, 源码] of [
    ['App.vue', App源码],
    ['components/Icon.vue', Icon源码],
    ['icons.ts', icons源码],
    ['assets.ts', assets源码],
    ['types.ts', types源码],
  ]) {
    assert.ok(源码.length > 0, `${名} 应为非空文件`);
  }
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 应导入 ./components/Icon.vue 为 Ic');
  assert.match(App源码, /from '\.\/assets';/, 'App 应导入 ./assets');
  assert.match(App源码, /import type \{[\s\S]*\} from '\.\/types';/, 'App 应以 type-only 导入 ./types');
  assert.match(Icon源码, /from '\.\.\/icons';/, 'Icon 应使用 ../icons 的合成函数');
  for (const [名, 源码] of [
    ['icons.ts', icons源码],
    ['assets.ts', assets源码],
    ['types.ts', types源码],
    ['Icon.vue', Icon源码],
  ]) {
    const 依赖 = 提取导入specifier(源码);
    assert.ok(!依赖.some(s => s.includes('App.vue') || s === './App' || s === '../App'), `${名} 不得反向导入 App`);
  }
});

test('App 不再包含内联图标库/Ic、17 个素材常量、18 个局部类型与基础图标 CSS；模板保持 <Ic 与动态 :n', () => {
  assert.doesNotMatch(App源码, /const 图标库/, 'App 不应再有内联图标库');
  assert.doesNotMatch(App源码, /FunctionalComponent/, 'App 不应再引用 FunctionalComponent');
  assert.doesNotMatch(App源码, /const Ic:/, 'App 不应再有内联 Ic');
  assert.doesNotMatch(App源码, /Ic\.props/, 'App 不应再有 Ic.props');
  for (const 名 of 素材常量名) {
    assert.doesNotMatch(App源码, new RegExp(`const ${名} =`), `App 不应再声明素材常量 ${名}`);
  }
  for (const 名 of 局部类型名) {
    assert.doesNotMatch(App源码, new RegExp(`(?:type|interface)\\s+${名}`), `App 不应再声明局部类型 ${名}`);
  }
  assert.doesNotMatch(App源码, /^\s*\.ic \{[^}]*width: 16px;/m, 'App 不应再有 .ic 基础样式块');
  assert.doesNotMatch(App源码, /\.ic \.ic-plate/, 'App 不应再有 .ic .ic-plate 基础样式');
  assert.doesNotMatch(App源码, /\.ic \.ic-gem/, 'App 不应再有 .ic .ic-gem 基础样式');
  // A6a 地图/房卡迁入 components/地图.vue 后,地图模板的 <Ic 图标随所有权跨组件统计,保持原数量级。
  // A7a 录像带操作迁入 components/录像带操作.vue 后,其 <Ic 一并计入所有权统计。
  // A7b3 又把原 App 内 4 个 <Ic 迁出:静音会议互动(3 个 A/B/C ops)、静音会议锁定提示(1 个 lock),继续计入。
  // A8b 又把原 App 内 1 个 <Ic 迁出:回合输入(1 个 clock 推进时间图标),继续计入。
  // 房内操作抽屉又接管把手、翻垃圾与普通房间动作图标，继续按真实所有权计入。
  const 使用数 =
    (App源码.match(/<Ic\b/g) ?? []).length +
    (地图源码.match(/<Ic\b/g) ?? []).length +
    (录像带操作源码.match(/<Ic\b/g) ?? []).length +
    (互动源码.match(/<Ic\b/g) ?? []).length +
    (锁定提示源码.match(/<Ic\b/g) ?? []).length +
    (回合输入源码.match(/<Ic\b/g) ?? []).length +
    (房内操作抽屉源码.match(/<Ic\b/g) ?? []).length;
  assert.ok(使用数 >= 25, `App+已拆组件模板应保持原数量级 <Ic 使用（现 ${使用数}）`);
  assert.match(App源码, /<Ic :n="[^"]+"/, 'App 模板应保留动态 :n 传参');
  assert.match(地图源码, /<Ic :n="动作\.icon"/, '地图组件房卡动作图标动态 :n 传参');
  // 迁出图标是真实所有权而不是凑数:A/B/C 三个操作图标、锁图标与时钟图标仍在对应组件
  assert.strictEqual((互动源码.match(/<Ic n="ops" \/>/g) ?? []).length, 3, '静音会议互动应持 3 个 ops 图标');
  assert.match(锁定提示源码, /<Ic n="lock" \/>/, '静音会议锁定提示应持 lock 图标');
  assert.match(回合输入源码, /<Ic n="clock" \/>/, '回合输入应持 clock 推进时间图标');
  assert.match(房内操作抽屉源码, /<Ic n="arrow" class="handle-arrow" \/>/, '房内操作抽屉应持把手箭头图标');
  assert.match(房内操作抽屉源码, /<Ic n="trash" \/>/, '房内操作抽屉应持翻垃圾图标');
  assert.match(房内操作抽屉源码, /<Ic :n="动作\.icon" \/>/, '房内操作抽屉应持动态房间动作图标');
});

test('icons.ts 保留全部旧图标键、ic-gem、plate path，未知键显式回退 home，不依赖 Vue/DOM', () => {
  for (const 键 of 图标键们) {
    assert.match(icons源码, new RegExp(`^\\s*${键}:`, 'm'), `图标库应保留键 ${键}`);
  }
  assert.match(icons源码, /class="ic-gem"/, '应保留 ic-gem 荧光小点 class');
  assert.match(
    icons源码,
    /class="ic-plate" d="M5 2\.8h11\.8L21\.2 7v12A2\.2 2\.2 0 0 1 19 21\.2H5A2\.2 2\.2 0 0 1 2\.8 19V5A2\.2 2\.2 0 0 1 5 2\.8Z"/,
    '应原样保留珐琅底 plate path',
  );
  assert.match(icons源码, /export function 合成图标SVG\(n: string\): string \{/, '应导出按键合成 svg 内容的纯函数');
  assert.match(icons源码, /\?\? 图标库\.home/, '未知键应回退 home');
  assert.doesNotMatch(icons源码, /from ['"]vue['"]/, 'icons.ts 不应依赖 Vue');
});

test('Icon.vue 保留 n:string、svg 四属性、内容注入与三段基础样式(:deep 命中注入子节点)', () => {
  assert.match(Icon源码, /n: \{ type: String, required: true \}/, 'props 契约应保持 n:string');
  for (const 属性 of ["class: 'ic'", "viewBox: '0 0 24 24'", "role: 'img'", "'aria-hidden': 'true'"]) {
    assert.ok(Icon源码.includes(属性), `Icon 应保留 ${属性}`);
  }
  assert.match(Icon源码, /innerHTML: 合成图标SVG\(this\.n\)/, '内部 SVG 内容应经 icons.ts 纯函数注入');
  assert.match(Icon源码, /^\s*\.ic \{[\s\S]*width: 16px;/m, '应保留 .ic 基础样式块');
  assert.match(Icon源码, /\.ic :deep\(\.ic-plate\)/, '应保留能命中注入子节点的 :deep(.ic-plate)');
  assert.match(Icon源码, /\.ic :deep\(\.ic-gem\)/, '应保留能命中注入子节点的 :deep(.ic-gem)');
});

test('assets.ts 精确含 rq0.70/rq0.55/cg3 三个基址与全部文件名，App 与新模块无 ?url 位图导入', () => {
  assert.match(assets源码, /https:\/\/testingcf\.jsdelivr\.net\/gh\/shujshujun\/my-tavern-scripts@rq0\.70\/src\/人妻公寓\/素材/, '应保留 rq0.70 增量素材基址');
  assert.match(assets源码, /https:\/\/testingcf\.jsdelivr\.net\/gh\/shujshujun\/my-tavern-scripts@rq0\.55\/dist\/人妻公寓\/素材/, '应保留 rq0.55 完整素材快照基址');
  assert.match(assets源码, /https:\/\/testingcf\.jsdelivr\.net\/gh\/shujun8520-design\/qgy-assets@cg3\/cg1/, '成人 CG 应锁定普通/孕肚五阶段 qgy-assets@cg3 基址');
  for (const 文件 of [
    '01_双屏关闭.png', '02_左屏亮起.png', '03_双屏亮起.png',
    '公寓外部.webp', '晨跑公园.webp', '健身房.webp',
    '清醒咖啡.webp', '集中胶囊.webp', '运动饮料.webp', '强效营养剂.webp',
    '安全套.webp', '专注训练手册.webp', '蛋白粉.webp',
  ]) {
    assert.ok(assets源码.includes(文件), `assets.ts 应保留文件 ${文件}`);
  }
  assert.match(assets源码, /CG解锁存储键 = '人妻公寓_成人CG解锁_cg1'/, '资源标签升级时应保留旧 CG 解锁存储键');
  for (const [名, 源码] of [
    ['App.vue', App源码],
    ['icons.ts', icons源码],
    ['assets.ts', assets源码],
    ['types.ts', types源码],
    ['Icon.vue', Icon源码],
  ]) {
    assert.doesNotMatch(源码, /(png|webp)\?url/, `${名} 不得出现 png?url / webp?url`);
  }
});

test('types.ts 逐项导出 18 个局部类型，风闻类型仍由 SchemaType 派生', () => {
  assert.match(types源码, /import type \{ SchemaType \} from '\.\.\/\.\.\/schema';/, 'types.ts 应从 ../../schema 导入 SchemaType');
  assert.match(types源码, /export type 风闻账视图 = SchemaType\['系统'\]\['_风闻账'\];/, '风闻账视图应仍由 SchemaType 派生');
  assert.match(types源码, /export type 风闻事件视图 = 风闻账视图\['最近事件'\]\[number\];/, '风闻事件视图应仍由风闻账视图派生');
  for (const 名 of 局部类型名) {
    assert.match(types源码, new RegExp(`export (type|interface) ${名}`), `types.ts 应导出 ${名}`);
  }
});

test('依赖边界：icons/assets/types 不依赖 vue；Icon 只依赖 vue 与 ../icons', () => {
  for (const [名, 源码] of [
    ['icons.ts', icons源码],
    ['assets.ts', assets源码],
    ['types.ts', types源码],
  ]) {
    const 依赖 = 提取导入specifier(源码);
    assert.ok(!依赖.includes('vue'), `${名} 不应 import vue`);
  }
  const Icon依赖 = 提取导入specifier(Icon源码);
  for (const 依赖 of Icon依赖) {
    assert.ok(依赖 === 'vue' || 依赖 === '../icons', `Icon 不应依赖 ${依赖}`);
  }
});
