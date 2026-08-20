/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 A2 五段低耦合 UI（CG图库/监控/读信/事件提示词/反馈浮层）
// 从 App.vue 等价外移到 components/，不依赖空格/Prettier 行宽。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 基础CSS = readFileSync(new URL('./components/弹窗基础.css', 客户端目录), 'utf8');
const CG图库源码 = readFileSync(new URL('./components/CG图库.vue', 客户端目录), 'utf8');
const 监控源码 = readFileSync(new URL('./components/监控.vue', 客户端目录), 'utf8');
const 读信源码 = readFileSync(new URL('./components/读信.vue', 客户端目录), 'utf8');
const 事件提示词源码 = readFileSync(new URL('./components/事件提示词.vue', 客户端目录), 'utf8');
const 反馈提示源码 = readFileSync(new URL('./components/反馈提示.vue', 客户端目录), 'utf8');
const 档案卡源码 = readFileSync(new URL('./components/档案卡.vue', 客户端目录), 'utf8');

const 组件源码们 = [
  ['CG图库.vue', CG图库源码],
  ['监控.vue', 监控源码],
  ['读信.vue', 读信源码],
  ['事件提示词.vue', 事件提示词源码],
  ['反馈提示.vue', 反馈提示源码],
];

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

test('六个 A2 文件非空；App 导入/渲染五组件；新模块无真实反向 import App，无循环边界', () => {
  for (const [名, 源码] of [['App.vue', App源码], ['弹窗基础.css', 基础CSS], ...组件源码们]) {
    assert.ok(源码.length > 0, `${名} 应为非空文件`);
  }
  for (const [组件名] of 组件源码们) {
    assert.match(App源码, new RegExp(`from '\\./components/${组件名}';`), `App 应导入 components/${组件名}`);
  }
  assert.match(App源码, /<CgLibrary\b[\s\S]*?@close="关闭CG图库"[\s\S]*?\/>/, 'App 模板应挂载 CgLibrary');
  assert.match(App源码, /<MonitorPopup\b[\s\S]*?@close="显示监控 = false"[\s\S]*?\/>/, 'App 模板应挂载 MonitorPopup');
  assert.match(App源码, /<LetterPopup\b[\s\S]*?@close="合上信"[\s\S]*?\/>/, 'App 模板应挂载 LetterPopup');
  assert.match(
    App源码,
    /<EventPromptPopup\b[\s\S]*?@close="事件提示词文本 = ''"[\s\S]*?\/>/,
    'App 模板应挂载 EventPromptPopup',
  );
  assert.match(
    App源码,
    /<FeedbackOverlay\b[\s\S]*?@dismiss-loot="收下拾获卡"[\s\S]*?\/>/,
    'App 模板应挂载 FeedbackOverlay，并由具名 handler 顺序收取驻留反馈',
  );
  for (const [名, 源码] of 组件源码们) {
    const 依赖 = 提取导入specifier(源码);
    assert.ok(!依赖.some(s => s.includes('App.vue') || s.includes('/App')), `${名} 不得反向导入 App`);
  }
  assert.doesNotMatch(App源码, /from '\.\/components\/弹窗基础\.css'/, 'App 不应把共享基础 CSS 当模块导入');
});

test('App 不再内联五段模板，但对应组件拥有原文案与关键 DOM/事件', () => {
  assert.doesNotMatch(App源码, /<div v-if="CG图库门牌"/, 'App 不应再内联 CG 图库弹窗');
  assert.doesNotMatch(App源码, /<div v-if="显示监控" class="mask"/, 'App 不应再内联监控弹窗');
  assert.doesNotMatch(App源码, /<div v-if="读信门牌"/, 'App 不应再内联读信弹窗');
  assert.doesNotMatch(App源码, /<div v-if="事件提示词文本" class="mask"/, 'App 不应再内联事件提示词弹窗');
  assert.doesNotMatch(App源码, /<div v-if="提示文本" class="toast"/, 'App 不应再内联提示 toast');
  assert.doesNotMatch(App源码, /<div v-if="拾获卡"/, 'App 不应再内联拾获卡');

  assert.match(CG图库源码, /class="mask cg-library-mask"/, 'CG图库应保留遮罩+图库类');
  assert.match(CG图库源码, /class="cg-tile"/, 'CG图库应保留缩略图格');
  assert.match(CG图库源码, /loading="lazy"/, 'CG图库缩略图应仍 lazy');
  assert.match(CG图库源码, /class="cg-lock"/, 'CG图库应保留未解锁锁标');
  assert.match(CG图库源码, /<Ic n="lock"\s*\/>/, 'CG图库未解锁仍只显示统一锁图标');
  assert.doesNotMatch(CG图库源码, /🔒/, 'CG图库不再依赖平台 Emoji');
  assert.match(CG图库源码, /查看大图/, 'CG图库解锁 title 保持');
  assert.match(CG图库源码, /尚未解锁/, 'CG图库未解锁 title 保持');
  assert.match(CG图库源码, /‹ 上一页/, 'CG图库分页上一页保持');
  assert.match(CG图库源码, /下一页 ›/, 'CG图库分页下一页保持');
  assert.match(CG图库源码, /@click="emit\('close'\)"/, 'CG图库关闭走 emit close');

  assert.match(监控源码, /HIDDEN EYES \/ 你装下的眼睛/, '监控 kicker 文案保持');
  assert.match(监控源码, />监 控</, '监控标题保持');
  assert.match(监控源码, />● REC</, '监控 REC 标记保持');
  assert.match(监控源码, /@click="emit\('select', m\)"/, '监控行点击 emit select');
  assert.match(监控源码, /@error="emit\('avatarError', 户静态表\[m\]\.妻名\)"/, '监控头像失败 emit avatarError');
  assert.match(监控源码, /class="cam-face fb"/, '监控头像失败回退首字圆徽');

  assert.match(读信源码, /拼 合 的 真 相/, '读信标题保持');
  assert.match(读信源码, /aria-label="四条线索已经拼合"/, '读信证物槽 aria 保持');
  assert.match(读信源码, /我看清了/, '读信确认按钮文案保持');
  assert.match(读信源码, /class="narr no-indent"/, '读信正文换行段保持');
  assert.match(读信源码, /\.split\('\\n'\)/, '读信正文仍按换行拆段');
  assert.ok((读信源码.match(/emit\('close'\)/g) ?? []).length >= 3, '读信三条关闭路径都 emit close');

  assert.match(事件提示词源码, />本 拍 提 示 词</, '事件提示词标题保持');
  assert.match(事件提示词源码, /<pre class="event-prompt-view">/, '事件提示词只读 pre 保持');

  assert.match(反馈提示源码, /FOUND \/ 拾获/, '拾获卡 kicker 文案保持');
  assert.ok((反馈提示源码.match(/点击收下/g) ?? []).length >= 2, '拾获卡 title/提示均保持');
  assert.match(反馈提示源码, /@click="emit\('dismissLoot'\)"/, '拾获卡点击 emit dismissLoot');
});

test('图库 state ownership：App 仅保留门牌开关与 open/close，阶段/页码/预览/页签/角色列表都在组件', () => {
  assert.match(App源码, /const CG图库门牌 = ref<门牌 \| null>\(null\)/, 'App 保留 CG图库门牌');
  assert.match(App源码, /function 打开CG图库/, 'App 保留打开CG图库');
  assert.match(App源码, /function 关闭CG图库/, 'App 保留关闭CG图库');
  assert.doesNotMatch(App源码, /CG图库阶段/, 'App 不应再有阶段状态');
  assert.doesNotMatch(
    App源码,
    /CG图库页码|CG图库每页|CG图库当前项|CG图库总页数|CG图库全部项|CG图库页签/,
    'App 不应再保留图库派生状态',
  );
  assert.doesNotMatch(App源码, /CG预览/, 'App 不应再保留大图预览状态');
  assert.doesNotMatch(App源码, /CG阶段名|亲密场景CG阶段名/, 'App 不应再有阶段名表');
  assert.doesNotMatch(App源码, /切换CG图库阶段|翻CG图库页/, 'App 不应再保留图库切页函数');
  assert.doesNotMatch(App源码, /角色CG列表/, 'App 不再 import 角色CG列表');
  assert.doesNotMatch(App源码, /type 亲密场景CG阶段/, 'App 不再 import 亲密场景CG阶段 type');
  assert.match(App源码, /:key="CG图库门牌"/, 'App 用门牌当 key 保证每次开不同角色都从头开始');
  assert.match(App源码, /@close="关闭CG图库"/, 'App 统一收组件 close');

  assert.match(CG图库源码, /const 变体 = ref<CG变体>\('normal'\)/, '组件内普通/怀孕图库状态在组件');
  assert.match(
    CG图库源码,
    /const 阶段 = ref<亲密场景CG阶段>\('intro_no_contact'\)/,
    '组件内亲密场景五阶段状态从亲密开场开始',
  );
  assert.match(CG图库源码, /每页 = 15/, '组件内分页每页 15 保持');
  assert.match(CG图库源码, /const 预览 = ref<成人CG项 \| null>\(null\)/, '组件内大图预览在组件');
  assert.match(
    CG图库源码,
    /Object\.keys\(阶段名\) as 亲密场景CG阶段\[\]/,
    '页签按固定亲密场景五阶段迭代(unknown 无关)',
  );
  assert.match(CG图库源码, /normal: '普通 CG'/, '图库保留普通 CG 顶层分类');
  assert.match(CG图库源码, /pregnancy: '怀孕 CG'/, '图库预留怀孕 CG 顶层分类');
  assert.match(CG图库源码, /CG项可查看\(props\.unlocked, 项\.id, CG全览模式\.value\)/, '未解锁与全览判定在组件');
  assert.match(
    CG图库源码,
    /v-if="可查看CG\(项\) && !失效CG\.has\(项\.id\)"/,
    '普通模式下未解锁无 img，全览模式下可以查看；坏图不重复挂载破图',
  );
  assert.match(CG图库源码, /@click="处理全览标题点击"/, '图库标题承接五连击入口');
  assert.match(CG图库源码, /全览模式已开启/, '五连击成功应给出明确反馈');
  assert.match(CG图库源码, /Math\.min\(Math\.max\(页码\.value \+ 偏移, 1\), 总页数\.value\)/, '分页用纯 Math 逻辑');
  assert.match(CG图库源码, /from '\.\.\/assets'/, '组件从 ../assets 取素材');

  // App 主舞台成人 CG 保留主图兼容读取，并将实际加载收敛为最多两槽
  assert.match(App源码, /const 当前成人CG槽位 = ref<CG加载槽位<成人CG项>\[\]>\(\[\]\)/, '主舞台成人 CG 双槽状态仍在 App');
  assert.match(App源码, /const 当前成人CG = computed/, '主图兼容读取仍在');
  assert.match(App源码, /const 当前成人CG地址 = computed/, '主舞台当前成人 CG 地址仍在');
  assert.match(App源码, /const 已解锁CG = ref<Set<string>>/, 'App 保留解锁集合');
  assert.match(App源码, /成人CG本次失效/, 'App 主舞台临时坏图集合仍在');
});

test('读信：组件内三条路径 emit close，App 统一 @close="合上信"，正文 computed 在组件，证物槽由 App 传入', () => {
  assert.match(
    读信源码,
    /const 读信正文 = computed\(\(\) => \(查裂缝\(props\.door\)\?\.信全文 \?\? ''\)\)/,
    '正文 computed 在组件读取查裂缝',
  );
  assert.match(读信源码, /import Ic from '\.\/Icon\.vue'/, '读信复用 A1 Icon.vue');
  assert.doesNotMatch(App源码, /读信正文/, 'App 不再声明读信正文 computed');
  assert.match(App源码, /@close="合上信"/, 'App 统一绑定 @close=合上信');
  assert.match(App源码, /:evidence-slots="裂缝证物槽"/, '证物槽由 App 传入');
  assert.match(App源码, /const 裂缝证物槽 = computed/, '证物槽计算逻辑留 App');
  assert.match(
    App源码,
    /function 合上信\(\) \{\s*const m = 读信门牌\.value;\s*if \(!m\) return;\s*if \(提交界面事务\(\(\) => eventEmit\('人妻公寓:读信', m\)\)\) 读信门牌\.value = null;\s*\}/,
    '合上信先占同步提交门，只有事件受理才关闭读信弹窗',
  );
});

test('监控：组件只 emit close/select/avatarError；App 看监控顺序保持；dock 监控列表.length 保持', () => {
  assert.match(监控源码, /defineEmits<\{ close: \[\]; select: \[门牌\]; avatarError: \[string\] \}>/, '监控仅三事件');
  assert.doesNotMatch(监控源码, /dismissLoot|emit\('loot'\)|emit\('pick'\)/, '监控不混入其他事件名');
  assert.doesNotMatch(监控源码, /eventEmit|eventOn/, '监控组件不含事件总线写入');
  assert.match(
    App源码,
    /async function 看监控\(门牌号: 门牌\) \{[\s\S]*?确认已到达动作地点\('302'\)[\s\S]*?提交界面事务\(\(\) => eventEmit\('人妻公寓:查看摄像头', 门牌号\)\)[\s\S]*?显示监控\.value = false;/,
    '看监控先确认真实到达 302，再占同步提交门，受理后才关闭',
  );
  assert.match(监控源码, /const 背景失效 = ref<ReadonlySet<string>>\(new Set\(\)\)/, '房间缩略图失败只保存在组件实例');
  assert.match(监控源码, /@error="标记背景失效\(backgroundUrl\(m\)\)"/, '缩略图失败按当前 URL 登记');
  assert.match(监控源码, /v-else class="cam-room fb" role="img"/, '缩略图失败显示可读门牌占位');
  assert.match(App源码, /@select="看监控"/, 'App 选择监控行仍走看监控');
  assert.match(App源码, /@avatar-error="头像失效\[\$event\] = true"/, 'App 用极小 handler 记头像失效');
  assert.match(App源码, /v-if="监控列表\.length"/, 'dock 监控按钮仍按列表长度显示');
  assert.match(App源码, /const 监控列表 = computed<门牌\[\]>/, '监控列表响应式逻辑仍留 App');
});

test('事件/反馈业务状态与 timer 留 App，组件只展示/emit；unmount 仍清 提示timer；反馈无定位包装层', () => {
  assert.match(App源码, /const 事件提示词文本 = ref\(''\)/, '事件提示词文本仍留 App');
  assert.match(App源码, /function 打开事件提示词/, '打开事件提示词仍留 App');
  assert.match(App源码, /@close="事件提示词文本 = ''"/, 'App 关事件提示词直接清文本');
  assert.match(App源码, /const 提示文本 = ref\(''\)/, '提示文本仍留 App');
  assert.match(App源码, /const 拾获卡队列 = ref<string\[\]>\(\[\]\)/, '重要反馈 FIFO 队列仍留 App');
  assert.match(App源码, /const 拾获卡 = computed\(\(\) => 拾获卡队列\.value\[0\] \?\? ''\)/, '组件只读取队首驻留卡');
  assert.match(App源码, /let 提示timer/, '提示timer 仍留 App');
  assert.match(App源码, /function 弹提示\(文本: string, 时长 = 2600\)/, '弹提示仍留 App');
  assert.match(App源码, /取消客户端延迟\(提示timer\)/, '提示 timer 继续走统一客户端生命周期清理');
  assert.match(App源码, /@dismiss-loot="收下拾获卡"/, 'App 收下当前拾获卡走具名 FIFO handler');
  assert.match(App源码, /function 收下拾获卡\(\): void \{\s*拾获卡队列\.value = 收下首条拾获提示\(拾获卡队列\.value\);\s*\}/, '收下当前卡后推进到下一条');

  assert.match(事件提示词源码, /defineProps<\{ text: string \}>/, '事件提示词仅展示 text');
  assert.match(事件提示词源码, /defineEmits<\{ close: \[\] \}>/, '事件提示词仅 emit close');
  assert.match(反馈提示源码, /defineProps<\{ toast: string; loot: string; sending: boolean \}>/, '反馈仅展示三 prop');
  assert.match(反馈提示源码, /defineEmits<\{ dismissLoot: \[\] \}>/, '反馈仅 emit dismissLoot');
  assert.match(反馈提示源码, /<div v-if="toast" class="toast">/, 'toast 是根节点，无定位包装层');
  assert.doesNotMatch(反馈提示源码, /feedback-layer|toast-layer|\.wrap/, '反馈无额外包装层 class');
});

test('弹窗基础.css 精确含通用 selector；四弹窗以 scoped src 使用；App 共享基础规则仍存在；无无 scoped 全局导入', () => {
  for (const [selector] of [
    ['.mask {'],
    ['.sheet {'],
    ['.sheet-close {'],
    ['.sheet-close:hover {'],
    ['.sheet-title {'],
    ['.sheet-title::after {'],
    ['.sheet-body {'],
    ['.btn {'],
    ['.btn.mini {'],
    ['.btn.rite {'],
    ['.ui-kicker {'],
    ['.ui-kicker.light {'],
    ['.narr {'],
    ['.shop-hero {'],
    ['.shop-hero b {'],
    ['.shop-hero em {'],
  ]) {
    assert.ok(基础CSS.includes(selector), `弹窗基础.css 应含 ${selector.trim()}`);
  }
  assert.match(基础CSS, /:global\(html\.rq-dark\) \.sheet/, '基础 CSS 应含 dark sheet');
  assert.match(基础CSS, /:global\(html\.rq-dark\) \.sheet-close/, '基础 CSS 应含 dark sheet-close');
  assert.match(基础CSS, /:global\(html\.rq-still\) \*/, '基础 CSS 应含 rq-still 减动效');
  assert.match(基础CSS, /background:\s*var\(--surface-sheet\);/, 'sheet 明暗表面应由语义令牌统一');
  assert.match(基础CSS, /backdrop-filter: blur\(4px\) saturate\(0\.9\);/, 'mask 关键声明应保留');

  for (const [名, 源码] of [
    ['CG图库.vue', CG图库源码],
    ['监控.vue', 监控源码],
    ['读信.vue', 读信源码],
    ['事件提示词.vue', 事件提示词源码],
  ]) {
    assert.match(源码, /<style scoped src="\.\/弹窗基础\.css"><\/style>/, `${名} 应以 scoped src 用基础 CSS`);
    assert.equal(
      (源码.match(/<style\b/g) ?? []).length,
      (源码.match(/<style scoped/g) ?? []).length,
      `${名} 所有样式块都应 scoped`,
    );
  }
  assert.doesNotMatch(反馈提示源码, /弹窗基础\.css/, '反馈只复制 .ui-kicker，不引入 mask/sheet 无关 CSS');

  assert.match(App源码, /^\.mask \{/m, 'App 共享基础 .mask 规则仍存在');
  assert.match(App源码, /^\.sheet \{/m, 'App 共享基础 .sheet 规则仍存在');
  assert.match(App源码, /^\.btn \{/m, 'App 共享基础 .btn 规则仍存在');
  assert.match(App源码, /^\.ui-kicker \{/m, 'App 共享基础 .ui-kicker 规则仍存在');
  assert.doesNotMatch(
    App源码,
    /^\.shop-hero \{/m,
    'App 已移除 .shop-hero（A5a 商店拆出，监控经 scoped 弹窗基础 CSS 自取）',
  );
});

test('五组专属 CSS 已从 App 移除并出现在正确组件；App 仍保留无关基础/未拆卡片规则', () => {
  assert.doesNotMatch(App源码, /\.cg-library|\.cg-tile|\.cg-lock|\.cg-preview/, 'App 不应再有图库专属 CSS');
  assert.doesNotMatch(
    App源码,
    /\.cam-row|\.cam-room|\.cam-face|\.cam-main|\.cam-rec|rec-blink/,
    'App 不应再有监控专属 CSS',
  );
  assert.doesNotMatch(App源码, /^\.letter \{/m, 'App 不应再有 .letter 基础');
  assert.doesNotMatch(App源码, /\.truth-fragments/, 'App 不应再有证物槽 CSS');
  assert.doesNotMatch(App源码, /\.event-prompt-view/, 'App 不应再有事件提示词 CSS');
  assert.doesNotMatch(App源码, /^\.toast \{/m, 'App 不应再有 toast CSS');
  assert.doesNotMatch(App源码, /\.loot-card|\.loot-hint|toast-pop/, 'App 不应再有拾获卡/动画 CSS');
  assert.doesNotMatch(App源码, /:global\(html\.rq-dark\) \.letter/, 'App 不应再持有 dark letter 选择器');
  assert.doesNotMatch(App源码, /:global\(html\.rq-dark\) \.toast/, 'App 不应再持有 dark toast 选择器');

  assert.match(CG图库源码, /\.cg-library \{/, '图库专属 CSS 应到 CG图库.vue');
  assert.match(CG图库源码, /@media \(max-width: 720px\)/, '图库移动端 CSS 应到 CG图库.vue');
  assert.match(监控源码, /\.shop-hero\.cams \{/, '监控 hero 专属 CSS 应到 监控.vue');
  assert.match(监控源码, /@keyframes rec-blink/, 'REC 呼吸动画应到 监控.vue');
  assert.match(监控源码, /:global\(html\.rq-dark\) \.cam-row/, '监控 dark 规则应到 监控.vue');
  assert.match(读信源码, /^\.letter \{/m, '读信 .letter 应到 读信.vue');
  assert.match(读信源码, /\.truth-fragments span :deep\(\.ic\)/, '读信 Icon deep 规则应到 读信.vue');
  assert.match(读信源码, /\.narr\.no-indent/, '读信 no-indent 应到 读信.vue');
  assert.match(读信源码, /:global\(html\.rq-dark\) \.letter/, '读信 dark letter 应到 读信.vue');
  assert.match(事件提示词源码, /\.event-prompt-view \{/, '事件提示词 CSS 应到 事件提示词.vue');
  assert.match(反馈提示源码, /^\.toast \{/m, '反馈 toast 应到 反馈提示.vue');
  assert.match(反馈提示源码, /^\.loot-card \{/m, '反馈拾获卡应到 反馈提示.vue');
  assert.match(反馈提示源码, /@keyframes toast-pop/, 'toast-pop 应到 反馈提示.vue');
  assert.match(反馈提示源码, /@keyframes card-pop-in/, '反馈需复制 card-pop-in 同名 keyframes');
  assert.match(反馈提示源码, /:global\(html\.rq-dark\) \.toast/, 'dark toast 应到 反馈提示.vue');
  assert.match(反馈提示源码, /:global\(html\.rq-dark\) \.loot-card/, 'dark 拾获卡应到 反馈提示.vue');
  assert.match(反馈提示源码, /:global\(html\.rq-still\)/, '反馈需自带 rq-still 减动效');

  // App 仍保留未拆卡片/未拆区块所需规则
  assert.match(档案卡源码, /\.dossier-card \.dsec-title \.cg-progress/, '档案卡开图库按钮 CSS 随档案卡迁入组件');
  assert.doesNotMatch(App源码, /\.dossier-card/, 'App 不再持有档案卡 CSS');
  assert.match(App源码, /\.peep-card/, '偷窥卡 CSS 留 App');
  assert.match(App源码, /@keyframes card-pop-in/, 'App 保留 card-pop-in 给其他卡用');
  assert.match(App源码, /:global\(html\.rq-dark\) \.todo-bar/, 'dark todo-bar 仍留 App');
  assert.match(App源码, /:global\(html\.rq-dark\) \.clue-card/, 'dark clue-card 仍留 App');
});

test('组件 props/emits/import 边界与地址/门牌 domain import 正确；无 ?url；不触碰 A1 契约', () => {
  assert.match(CG图库源码, /from '\.\.\/\.\.\/\.\.\/stageConfig'/, 'CG图库应从 stageConfig 取户静态表/门牌');
  assert.match(
    CG图库源码,
    /from '\.\.\/\.\.\/\.\.\/脚本\/游戏逻辑\/成人CG系统'/,
    'CG图库应从成人CG系统取角色CG列表/类型',
  );
  assert.match(CG图库源码, /成人CG基址/, 'CG图库仍用成人CG基址拼地址');
  assert.match(
    CG图库源码,
    /defineProps<\{[\s\S]*door: 门牌[\s\S]*unlocked: Set<string>[\s\S]*\}>/,
    'CG图库 props 契约 door/unlocked',
  );
  assert.match(监控源码, /from '\.\.\/\.\.\/\.\.\/stageConfig'/, '监控应从 stageConfig 取户静态表/门牌');
  assert.match(
    监控源码,
    /defineProps<\{[\s\S]*rooms: readonly 门牌\[\][\s\S]*backgroundUrl: \(door: string\) => string[\s\S]*avatarUrl: \(name: string\) => string[\s\S]*\}>/,
    '监控 props 契约',
  );
  assert.match(读信源码, /from '\.\.\/\.\.\/\.\.\/stageConfig'/, '读信应从 stageConfig 取查裂缝/门牌');
  assert.match(
    读信源码,
    /defineProps<\{[\s\S]*door: 门牌[\s\S]*evidenceSlots: readonly \{ 标: string; 图: string \}\[\][\s\S]*\}>/,
    '读信 props 契约',
  );

  for (const [名, 源码] of [
    ['App.vue', App源码],
    ['CG图库.vue', CG图库源码],
    ['监控.vue', 监控源码],
    ['读信.vue', 读信源码],
    ['事件提示词.vue', 事件提示词源码],
    ['反馈提示.vue', 反馈提示源码],
  ]) {
    assert.doesNotMatch(源码, /(?:png|webp)\?url/, `${名} 不得出现 png?url / webp?url`);
  }
  // A1 契约不被触碰
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 仍导入 A1 Icon');
  assert.match(App源码, /from '\.\/assets';/, 'App 仍导入 A1 assets');
  assert.match(App源码, /import type \{[\s\S]*\} from '\.\/types';/, 'App 仍以 type-only 导入 A1 types');
  assert.doesNotMatch(监控源码, /defineEmits<\{[\s\S]*dismissLoot/, '监控不持有反馈事件');
  assert.doesNotMatch(反馈提示源码, /from ['"]vue['"]/, '反馈无需引 vue 运行时');
});
