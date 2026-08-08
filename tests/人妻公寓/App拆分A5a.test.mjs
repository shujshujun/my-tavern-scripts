/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A5a 拆分（背包/商店弹窗 → components/背包.vue、components/商店.vue）
// 等价外移，不依赖空格/Prettier 行宽，不把注释当真实 import。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 背包源码 = readFileSync(new URL('./components/背包.vue', 客户端目录), 'utf8');
const 商店源码 = readFileSync(new URL('./components/商店.vue', 客户端目录), 'utf8');
const 道具卡css = readFileSync(new URL('./components/道具卡.css', 客户端目录), 'utf8');
const 夜间门测试源码 = readFileSync(new URL('../../../../tests/人妻公寓/夜间触发门.test.mjs', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('两组件非空；App 真实导入 Latin-first 别名并常驻渲染；组件不反向导入 App/store', () => {
  assert.ok(背包源码.length > 0, 'components/背包.vue 应为非空文件');
  assert.ok(商店源码.length > 0, 'components/商店.vue 应为非空文件');
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'App 应导入 背包.vue');
  assert.match(App源码, /import ShopPopup from '\.\/components\/商店\.vue';/, 'App 应导入 商店.vue');
  const 模板段 = 提取模板(App源码);
  assert.match(模板段, /<InventoryPopup\b[\s\S]*?\/>/, 'App 模板应以 Latin-first 标签挂载 InventoryPopup');
  assert.match(模板段, /<ShopPopup\b[\s\S]*?\/>/, 'App 模板应以 Latin-first 标签挂载 ShopPopup');
  // 常驻挂载：组件自身根节点 v-if="open"，App tag 上不得再包 v-if
  assert.doesNotMatch(模板段, /<InventoryPopup[^>]*v-if/, 'InventoryPopup tag 外不得再有 v-if');
  assert.doesNotMatch(模板段, /<ShopPopup[^>]*v-if/, 'ShopPopup tag 外不得再有 v-if');
  assert.match(背包源码, /<div v-if="open"/, '背包根节点自持 v-if="open"');
  assert.match(商店源码, /<div v-if="open"/, '商店根节点自持 v-if="open"');
  for (const 源 of [背包源码, 商店源码]) {
    const 依赖 = 提取导入specifier(源);
    assert.ok(!依赖.some(s => s.includes('App.vue') || s.includes('/App')), '组件不得反向导入 App');
    assert.ok(!依赖.some(s => s.includes('store')), '组件不得导入 store');
  }
});

test('App 不再内联两弹窗模板与页签局部状态；商店组件拥有 ref/computed；业务状态与函数仍留 App', () => {
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /class="ware-card"/, 'App 不应再内联道具卡模板');
  assert.doesNotMatch(模板段, /class="shop-tabs"/, 'App 不应再内联商店页签模板');
  assert.doesNotMatch(App源码, /class="sheet shop"/, 'App 不应再内联商店 sheet.shop');
  assert.doesNotMatch(App源码, /const 商店页签 = ref/, 'App 不应再声明 商店页签');
  assert.doesNotMatch(App源码, /const 当前货架 = computed/, 'App 不应再声明 当前货架');
  assert.doesNotMatch(App源码, /const 当前空文案 = computed/, 'App 不应再声明 当前空文案');

  assert.match(商店源码, /const 商店页签 = ref\('工具'\)/, '商店组件应拥有 商店页签');
  assert.match(商店源码, /const 当前货架 = computed/, '商店组件应拥有 当前货架');
  assert.match(商店源码, /const 当前空文案 = computed/, '商店组件应拥有 当前空文案');
  assert.match(商店源码, /\?\? '\(暂时没货\)'/, '页签缺失回退空文案保持');

  assert.match(App源码, /const 显示商店 = ref\(false\)/, '显示商店仍留 App');
  assert.match(App源码, /const 显示背包 = ref\(false\)/, '显示背包仍留 App');
  assert.match(App源码, /const 货架 = computed/, '货架计算仍留 App');
  assert.match(App源码, /const 背包列表 = computed/, '背包列表计算仍留 App');
  for (const fn of [
    '道具视觉信息',
    '商品锁定原因',
    '商品购买文案',
    '买',
    '用运作',
    '用资源道具',
    '装载',
    '送出',
    '布设',
    '打开信',
    '使用录像带',
    '打开静音会议筹备',
  ]) {
    assert.match(App源码, new RegExp(`function ${fn}\\(`), `${fn} 仍留 App`);
  }
});

test('props/emits 接线完整：背包十事件、商店三事件、useOperation 三参数、image error 回 App、close 置 false', () => {
  const 模板段 = 提取模板(App源码);
  assert.match(
    模板段,
    /<InventoryPopup\b[\s\S]*?:open="显示背包"[\s\S]*?:items="背包列表"[\s\S]*?:sending="发送中"[\s\S]*?:item-failed="道具图失效"[\s\S]*?:item-image="道具图"[\s\S]*?@close="显示背包 = false"[\s\S]*?@image-error="道具图失效\[\$event\] = true"[\s\S]*?@read="打开信"[\s\S]*?@deploy="布设"[\s\S]*?@use-resource="用资源道具"[\s\S]*?@use-operation="用运作"[\s\S]*?@play-tape="使用录像带"[\s\S]*?@prepare-meeting="打开静音会议筹备"[\s\S]*?@gift="送出"[\s\S]*?@load="装载"[\s\S]*?\/>/,
    '背包 tag 全部 props/emits 接线',
  );
  assert.match(
    模板段,
    /<ShopPopup\b[\s\S]*?:open="显示商店"[\s\S]*?:cash="data\.现金"[\s\S]*?:sending="发送中"[\s\S]*?:shelves="货架"[\s\S]*?:item-failed="道具图失效"[\s\S]*?:item-image="道具图"[\s\S]*?:item-visual="道具视觉信息"[\s\S]*?:lock-reasons="商品锁定原因"[\s\S]*?:purchase-label="商品购买文案"[\s\S]*?@close="显示商店 = false"[\s\S]*?@image-error="道具图失效\[\$event\] = true"[\s\S]*?@buy="买"[\s\S]*?\/>/,
    '商店 tag 全部 props/emits 接线',
  );
  // 组件 emits 强类型契约
  assert.match(
    背包源码,
    /defineEmits<\{[\s\S]*?useOperation: \[itemId: string, door\?: 门牌, candidate\?: 阶段线路候选\]/,
    'useOperation 三参数签名',
  );
  assert.match(
    背包源码,
    /defineEmits<\{[\s\S]*?gift: \[itemId: string, door: 门牌\][\s\S]*?load: \[itemId: string, door: 门牌\]/,
    'gift/load 签名',
  );
  assert.match(商店源码, /defineEmits<\{ close: \[\]; imageError: \[id: string\]; buy: \[itemId: string\] \}>/, '商店三事件签名');
  assert.match(背包源码, /emit\('useOperation', 项\.id, 项\.全局线路候选\?\.门牌, 项\.全局线路候选\)/, '背包内 useOperation 三参数调用保持');
  assert.match(背包源码, /emit\('useOperation', 项\.id, 候选\.门牌, 候选\)/, '全局多线候选三参数调用保持');
  assert.match(背包源码, /emit\('useOperation', 项\.id, 夫\.门牌\)/, '户向运作两参数调用保持');
  // close 只置显示状态
  assert.match(App源码, /@close="显示背包 = false"/, 'close 接显示背包=false');
  assert.match(App源码, /@close="显示商店 = false"/, 'close 接显示商店=false');
  assert.match(背包源码, /@click\.self="emit\('close'\)"/, 'mask.self 只 emit close');
  // 组件无事件总线写入
  assert.doesNotMatch(背包源码, /eventEmit\(|eventOn\(/, '背包组件不含事件总线写入');
  assert.doesNotMatch(商店源码, /eventEmit\(|eventOn\(/, '商店组件不含事件总线写入');
});

test('背包模板全量保持：动作/disabled/title/候选循环/户静态表/查道具图片门/空文案', () => {
  const 模板段 = 提取模板(背包源码);
  assert.match(模板段, /@click="emit\('read', 项\.信门牌!\)">读<\/button>/, '读信按钮');
  assert.match(模板段, /@click="emit\('deploy'\)">装在这个房间<\/button>/, '布设按钮');
  assert.match(模板段, /@click="emit\('useResource', 项\.id\)">\s*使用\s*<\/button>/, '使用资源按钮');
  assert.match(模板段, /@click="emit\('playTape'\)">\s*在管理员室播放\s*<\/button>/, '播放录像带按钮');
  assert.match(模板段, /@click="emit\('prepareMeeting'\)">\s*筹备会议\s*<\/button>/, '筹备会议按钮');
  assert.match(模板段, /:disabled="sending \|\| !夫\.时段可用"/, '运作对象发送中+时段锁');
  assert.match(模板段, /:disabled="sending \|\| !妻\.时段可用"/, '装载对象发送中+时段锁');
  assert.match(模板段, /:title="妻\.时段提示"/, '装载 title 保持');
  assert.match(模板段, /夫\.时段可用 \? `给\$\{夫\.夫名\}` : `晚上再给\$\{夫\.夫名\}`/, '运作对象文案');
  assert.match(模板段, /妻\.时段可用 \? `装载给\$\{妻\.妻名\}` : `\$\{妻\.时段提示\}再装载`/, '装载对象文案');
  assert.match(模板段, /:key="'运' \+ 夫\.门牌"/, '运作对象循环 key');
  assert.match(模板段, /:key="'线运' \+ 项\.id \+ 候选\.门牌"/, '全局候选循环 key');
  assert.match(模板段, /:key="妻\.门牌"/, '送礼对象循环 key');
  assert.match(模板段, /:key="'载' \+ 妻\.门牌"/, '装载对象循环 key');
  assert.match(模板段, /户静态表\[项\.全局线路候选\.门牌\]\.妻名/, '单线候选取户静态表妻名');
  assert.match(模板段, /户静态表\[候选\.门牌\]\.妻名/, '多线候选取户静态表妻名');
  assert.match(模板段, /查道具\(项\.id\) && !itemFailed\[项\.id\]/, '查道具图片门');
  assert.match(模板段, /@error="emit\('imageError', 项\.id\)"/, '图片 error emit 回 App');
  assert.match(模板段, /项\.可读信 \? '✉' : 项\.名称\[0\]/, '信件 fallback 图标');
  assert.match(模板段, /class="hint center">\(空空如也\)<\/p>/, '空包文案');
  assert.match(
    背包源码,
    /import \{ 户静态表, 查道具, type 门牌 \} from '\.\.\/\.\.\/\.\.\/stageConfig'/,
    '组件从 stageConfig 导入户静态表/查道具/门牌',
  );
});

test('商店模板全量保持：hero/现金/页签/三重 disabled/三路文案/锁定原因/图片 error', () => {
  const 模板段 = 提取模板(商店源码);
  assert.match(模板段, /WUTONGLI MALL \/ 网购商城/, 'hero kicker');
  assert.match(模板段, /<b>商 店<\/b>/, 'hero 标题');
  assert.match(模板段, /小时达 · 本时段内送到管理员室/, 'hero 副文案');
  assert.match(模板段, /class="shop-cash">¥ \{\{ cash \}\}/, '现金展示');
  assert.match(模板段, /v-for="页 in shelves"[\s\S]*?:key="页\.页签"[\s\S]*?:class="\{ on: 商店页签 === 页\.页签 \}"/, '页签循环与 on 态');
  assert.match(模板段, /@click="商店页签 = 页\.页签"/, '页签点击切页');
  assert.match(模板段, /v-for="项 in 当前货架"[\s\S]*?:key="项\.id"/, '当前货架循环');
  assert.match(模板段, /:class="\['ware-' \+ itemVisual\(项\)\.类, \{ locked: lockReasons\(项\)\.length \}\]"/, '视觉类与锁定 class');
  assert.match(模板段, /:disabled="sending \|\| cash < \(项\.价格 \?\? 0\) \|\| lockReasons\(项\)\.length > 0"/, '购买三重 disabled');
  assert.match(
    模板段,
    /lockReasons\(项\)\.length \? '未解锁' : cash < \(项\.价格 \?\? 0\) \? '钱不够' : purchaseLabel\(项\)/,
    '三路购买文案',
  );
  assert.match(模板段, /class="ware-lock">尚缺：\{\{ lockReasons\(项\)\.join\('；'\) \}\}/, '锁定原因展示');
  assert.match(模板段, /<em class="ware-price">¥\{\{ 项\.价格 \}\}<\/em>/, '商品价格');
  assert.match(模板段, /@error="emit\('imageError', 项\.id\)"/, '图片 error emit 回 App');
  assert.match(模板段, /v-if="!itemFailed\[项\.id\]"/, '图片失败隐藏');
  assert.match(模板段, /v-if="!当前货架\.length" class="hint center">\{\{ 当前空文案 \}\}/, '空货架文案');
  assert.match(商店源码, /import type \{ 道具配置 \} from '\.\.\/\.\.\/\.\.\/stageConfig'/, '从 stageConfig 导入 道具配置 type');
  assert.match(商店源码, /道具视觉类型/, '道具视觉类型 参与 props 契约');
});

test('专属 CSS 已从 App 删除并进入组件/共享 CSS；两者有弹窗基础与共享卡片、.hint/.center；App 仍保留通用声明', () => {
  for (const selector of [
    '.ware {',
    '.ware:first-child {',
    '.ware b {',
    '.ware-desc {',
    '.ware-price {',
    '.ware-acts {',
    '.shop-tabs {',
    '.shop-tabs .btn.on {',
    '.sheet.shop {',
    '.shop-hero {',
    '.shop-hero b {',
    '.shop-hero em {',
    '.shop-cash {',
    '.shop-grid {',
    '.ware-card {',
    '.ware-pic {',
    '.ware-pic img {',
    '.ware-kind {',
    '.ware-kind :deep(.ic) {',
    '.ware-kind-label {',
    '.ware-card.ware-product {',
    '.ware-card.ware-evidence {',
    '.ware-card.ware-scene {',
    '.ware-card.ware-action {',
    '.ware-pic > b {',
    '.ware-main {',
    '.ware-name {',
    '.ware-card .ware-desc {',
    '.ware-card.locked {',
    '.ware-lock {',
    '.ware-buy {',
    '.ware-card .ware-acts {',
    ':global(html.rq-dark) .ware-card {',
  ]) {
    assert.doesNotMatch(App源码, new RegExp(转义(selector)), `App 不应再持有 ${selector}`);
  }
  // 共享道具卡.css 持有卡片与视觉类
  for (const selector of [
    '.ware-card {',
    '.ware-pic {',
    '.ware-pic img {',
    '.ware-kind {',
    '.ware-kind :deep(.ic) {',
    '.ware-kind-label {',
    '.ware-card.ware-product {',
    '.ware-card.ware-evidence {',
    '.ware-card.ware-scene {',
    '.ware-card.ware-action {',
    '.ware-pic > b {',
    '.ware-main {',
    '.ware-name {',
    '.ware-desc {',
    '.ware-acts {',
    '.ware-card .ware-desc {',
    '.ware-card.locked {',
    '.ware-card .ware-acts {',
    ':global(html.rq-dark) .ware-card {',
  ]) {
    assert.match(道具卡css, new RegExp(转义(selector)), `共享道具卡.css 应持有 ${selector}`);
  }
  // 商店独有不得混入共享
  for (const selector of ['.shop-tabs {', '.shop-cash {', '.shop-grid {', '.sheet.shop {', '.ware-lock {', '.ware-buy {', '.ware-price {']) {
    assert.doesNotMatch(道具卡css, new RegExp(转义(selector)), `道具卡.css 不应持有商店独有 ${selector}`);
  }
  // 两组件引入基础+共享，且各自复制 .hint/.center
  for (const 源 of [背包源码, 商店源码]) {
    assert.match(源, /<style scoped src="\.\/弹窗基础\.css"><\/style>/, '应引入弹窗基础.css');
    assert.match(源, /<style scoped src="\.\/道具卡\.css"><\/style>/, '应引入道具卡.css');
    assert.match(源, /^\.hint \{/m, '应复制 .hint');
    assert.match(源, /^\.center \{/m, '应复制 .center');
  }
  // 商店独有样式归商店组件
  for (const selector of [
    '.sheet.shop {',
    '.shop-tabs {',
    '.shop-tabs .btn.on {',
    '.shop-cash {',
    '.shop-grid {',
    '.ware-price {',
    '.ware-lock {',
    '.ware-buy {',
  ]) {
    assert.match(商店源码, new RegExp(转义(selector)), `商店组件应持有 ${selector}`);
  }
  assert.doesNotMatch(背包源码, /\.shop-tabs|\.shop-cash|\.shop-grid|\.ware-lock|\.ware-buy/, '背包组件不应持有商店独有样式');
  // App 通用 .hint/.center 仍保留
  assert.match(App源码, /^\.hint \{/m, 'App 通用 .hint 仍保留');
  assert.match(App源码, /^\.center \{/m, 'App 通用 .center 仍保留');
});

test('夜间触发门测试按所有权读取新组件且不弱化断言；A1–A4 边界未回退', () => {
  assert.match(夜间门测试源码, /components\/背包\.vue/, '夜间门测试读取背包组件');
  assert.match(夜间门测试源码, /components\/商店\.vue/, '夜间门测试读取商店组件');
  assert.ok(夜间门测试源码.includes('sending \\|\\| !夫\\.时段可用'), '夫时段锁断言改用 sending prop 且读背包源');
  assert.ok(夜间门测试源码.includes('sending \\|\\| !妻\\.时段可用'), '妻时段锁断言改用 sending prop 且读背包源');
  assert.ok(夜间门测试源码.includes('lockReasons\\(项\\)\\.length > 0'), '商品锁定购买禁用断言仍在');
  assert.match(夜间门测试源码, /普通首夜时段已满足/, 'App 侧晋阶断言仍在');
  assert.ok(夜间门测试源码.includes('选中首夜待晚上 \\? \'✦ 等到晚上\''), '晋阶文案断言仍在');
  // A1–A4 边界未回退
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 仍导入 A1 Icon');
  assert.match(App源码, /import CgLibrary from '\.\/components\/CG图库\.vue';/, 'App 仍导入 A2 CG图库');
  assert.match(App源码, /import MonitorPopup from '\.\/components\/监控\.vue';/, 'App 仍导入 A2 监控');
  assert.match(App源码, /import LetterPopup from '\.\/components\/读信\.vue';/, 'App 仍导入 A2 读信');
  assert.match(App源码, /import EventPromptPopup from '\.\/components\/事件提示词\.vue';/, 'App 仍导入 A2 事件提示词');
  assert.match(App源码, /import FeedbackOverlay from '\.\/components\/反馈提示\.vue';/, 'App 仍导入 A2 反馈提示');
  assert.match(App源码, /import SettingsPopup from '\.\/components\/设置弹窗\.vue';/, 'App 仍导入 A3 设置弹窗');
  assert.match(App源码, /import FirstRunSetup from '\.\/components\/首次准备\.vue';/, 'App 仍导入 A3 首次准备');
  assert.match(App源码, /import PrologueTitleScreen from '\.\/components\/序章标题屏\.vue';/, 'App 仍导入 A4 序章标题屏');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'App 仍导入 A3 useUIPrefs');
});

test('无中文首字符组件 tag；源码不触碰 dist', () => {
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  for (const 源 of [背包源码, 商店源码]) {
    assert.doesNotMatch(源, /dist\//, '组件不得引用 dist');
  }
});
