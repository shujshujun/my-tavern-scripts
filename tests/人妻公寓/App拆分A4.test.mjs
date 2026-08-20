/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A4 拆分（序章标题屏 → components/序章标题屏.vue）等价外移，
// 不依赖空格/Prettier 行宽，不把注释当真实 import。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 标题源码 = readFileSync(new URL('./components/序章标题屏.vue', 客户端目录), 'utf8');

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

test('新组件非空；App 真实导入并以 Latin-first 标签渲染；组件不反向导入 App', () => {
  assert.ok(标题源码.length > 0, 'components/序章标题屏.vue 应为非空文件');
  assert.match(App源码, /import PrologueTitleScreen from '\.\/components\/序章标题屏\.vue';/, 'App 应导入 序章标题屏.vue');
  assert.match(App源码, /<PrologueTitleScreen\b[\s\S]*?\/>/, 'App 模板应以 Latin-first 标签挂载 PrologueTitleScreen');
  assert.match(标题源码, /defineProps<\{[\s\S]*?sending: boolean;[\s\S]*?scriptAlive: boolean[\s\S]*?\}>/, '组件 props 契约 sending/scriptAlive');
  const 依赖 = 提取导入specifier(标题源码);
  assert.ok(!依赖.some(s => s.includes('App.vue') || s.includes('/App')), '组件不得反向导入 App');
});

test('App 不再内联标题模板与难度局部状态；组件拥有 选中难度/难度展开/难度卡(Object.values(难度表))', () => {
  assert.doesNotMatch(App源码, /class="title-screen"/, 'App 不应再内联 .title-screen');
  assert.doesNotMatch(App源码, /class="title-menu"/, 'App 不应再内联 .title-menu');
  assert.doesNotMatch(App源码, /class="plaque main"/, 'App 不应再内联主菜单木牌');
  assert.doesNotMatch(App源码, /const 选中难度 = ref/, 'App 不应再声明 选中难度');
  assert.doesNotMatch(App源码, /const 难度展开 = ref/, 'App 不应再声明 难度展开');
  assert.doesNotMatch(App源码, /const 难度卡 = Object\.values\(难度表\)/, 'App 不应再声明 难度卡');

  assert.match(标题源码, /const 选中难度 = ref\(''\)/, '组件应拥有 选中难度');
  assert.match(标题源码, /const 难度展开 = ref\(false\)/, '组件应拥有 难度展开');
  assert.match(标题源码, /const 难度卡 = Object\.values\(难度表\)/, '组件应拥有 难度卡(Object.values(难度表))');
  assert.match(标题源码, /import \{ 难度表 \} from '\.\.\/\.\.\/\.\.\/stageConfig'/, '组件应从 stageConfig 正确相对路径导入难度表');
});

test('App 分支顺序保持，props/emits 接线正确；开始考验只在脚本存活时进入发送态', () => {
  const 模板段 = App源码.slice(App源码.indexOf('<template>'), App源码.lastIndexOf('</template>'));
  const 未就绪 = 模板段.indexOf('<template v-if="!就绪">');
  const 坏结局 = 模板段.indexOf('<template v-else-if="data.系统._坏结局">');
  const 序章 = 模板段.indexOf('<template v-else-if="!data.系统._序章完成">');
  const 日常 = 模板段.indexOf('<template v-else>');
  assert.ok(
    未就绪 >= 0 && 坏结局 > 未就绪 && 序章 > 坏结局 && 日常 > 序章,
    '分支顺序:未就绪→坏结局→序章→日常 必须保持',
  );
  const 序章段 = 模板段.slice(序章, 日常);
  assert.match(序章段, /<PrologueTitleScreen\b[\s\S]*?:sending="发送中"[\s\S]*?:script-alive="脚本存活"/, '组件 props 接线');
  assert.match(序章段, /@start="开始考验"/, '组件 start emit 接 开始考验');
  assert.match(序章段, /@open-setup="打开首次说明"/, '组件 openSetup 接 打开首次说明');
  assert.match(序章段, /@open-settings="设置开 = true"/, '组件 openSettings 接 设置开');
  assert.doesNotMatch(序章段, /class="title-screen"/, '序章分支只渲染组件，不再内联标题模板');

  assert.match(App源码, /const 发送中 = ref\(false\)/, '发送中仍留 App');
  assert.match(App源码, /const 脚本存活 = ref\(true\)/, '脚本存活仍留 App');
  assert.match(
    App源码,
    /function 开始考验\(难度: string\) \{[\s\S]*?if \(!难度 \|\| 发送中\.value \|\| !脚本存活\.value\) return;[\s\S]*?发送中\.value = true;[\s\S]*?eventEmit\('人妻公寓:开始新游戏', 难度\);/,
    '开始考验(难度) 空值/发送中/脚本心跳守卫→发送中=true→开始新游戏 顺序保持',
  );
});

test('组件三个 emit；无 eventEmit/useUIPrefs/App import；返回清选择、确认 disabled、sending 文案与心跳保持', () => {
  assert.match(标题源码, /defineEmits<\{ start: \[难度: string\]; openSetup: \[\]; openSettings: \[\] \}>/, '组件仅三事件');
  assert.match(标题源码, /emit\('openSetup'\)/, '首次说明入口 emit openSetup');
  assert.match(标题源码, /emit\('openSettings'\)/, '设置入口 emit openSettings');
  assert.match(标题源码, /emit\('start', 选中难度\)/, '确认按钮 emit 当前难度');
  assert.doesNotMatch(标题源码, /eventEmit\(|eventOn\(/, '组件不含事件总线写入');
  assert.doesNotMatch(标题源码, /useUIPrefs\(\)/, '组件不直接调用 useUIPrefs');
  assert.doesNotMatch(标题源码, /发送中/, '组件不写 App 侧 发送中状态');

  assert.match(标题源码, /class="btn ghost"[\s\S]*?难度展开 = false;[\s\S]*?选中难度 = '';/, '返回仍同时收起难度并清空选择');
  assert.match(
    标题源码,
    /class="btn rite" :disabled="!选中难度 \|\| sending \|\| !scriptAlive"/,
    '确认按钮未选/发送中/脚本未存活时 disabled',
  );
  assert.match(标题源码, /sending \? '电话接通中……' : '接起父亲的电话'/, '发送中文案保持');
  assert.match(标题源码, /class="plaque main" :disabled="sending \|\| !scriptAlive"/, '开始游戏木牌发送中或脚本未存活时 disabled');
  assert.match(标题源码, /class="heartbeat title-beat" :class="\{ dead: !scriptAlive \}"/, '心跳 class 保持');
  assert.match(标题源码, /scriptAlive \? '✓ 游戏逻辑脚本心跳正常' : '✗ 未检测到游戏逻辑脚本\(请确认脚本已启用\)'/, '心跳文案保持');
});

test('素材全部从 ../assets 的 素材基址 构造；KV/纹章/按钮底三路径与错误隐藏保持；不用 ?url', () => {
  assert.match(标题源码, /import \{ 素材基址 \} from '\.\.\/assets'/, '组件应从 ../assets 导入 素材基址');
  assert.match(标题源码, /url\(\$\{素材基址\}\/地图\/立面_傍晚\.webp\)/, 'KV 立面背景路径保持');
  assert.match(标题源码, /:src="`\$\{素材基址\}\/界面\/纹章\.webp`"/, '纹章路径保持');
  assert.match(标题源码, /url\(\$\{素材基址\}\/界面\/按钮底\.webp\)/, '按钮底路径保持');
  assert.match(
    标题源码,
    /class="title-emblem"[\s\S]*?alt=""[\s\S]*?draggable="false"[\s\S]*?style\.display = 'none'/,
    '纹章空 alt/draggable false/error 隐藏保持',
  );
  assert.doesNotMatch(标题源码, /(?:png|webp)\?url/, '组件不得出现 ?url 位图导入');
});

test('标题专属 CSS 已从 App 删除并完整进入组件；组件含本地通用 btn/kicker/heartbeat 与 rq-still；App 仍保留通用规则', () => {
  for (const selector of [
    '.title-screen {',
    '.title-hero {',
    '.title-emblem {',
    '.title-hero h1 {',
    '.title-hero p {',
    '.title-menu {',
    '.plaque {',
    '.plaque.setup-entry {',
    '.plaque.diff {',
    '.plaque.diff.chosen {',
    '.plaque.diff.chosen::after {',
    '.title-acts {',
    '.title-beat {',
  ]) {
    const 转义 = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.doesNotMatch(App源码, new RegExp(转义), `App 不应再持有 ${selector}`);
    assert.match(标题源码, new RegExp(转义), `组件应持有 ${selector}`);
  }
  assert.doesNotMatch(App源码, /:global\(html\.rq-lite\) \.title-screen/, 'App 不应再持有 rq-lite title-screen 规则');
  assert.match(标题源码, /:global\(html\.rq-lite\) \.title-screen \{/, '组件应持有 rq-lite title-screen 规则');

  for (const selector of [
    '.ui-kicker {',
    '.ui-kicker.light {',
    '.ui-kicker.center {',
    '.btn {',
    '.btn.rite {',
    '.btn.ghost {',
    '.heartbeat {',
    '.heartbeat.dead {',
  ]) {
    const 转义 = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(标题源码, new RegExp(转义), `组件应复制通用 ${selector}`);
  }
  assert.match(标题源码, /:global\(html\.rq-still\) \*/, '组件应自带 rq-still 减动效');

  assert.match(App源码, /^\.ui-kicker \{/m, 'App 通用 .ui-kicker 仍保留');
  assert.match(App源码, /\.ui-kicker\.light \{/, 'App .ui-kicker.light 仍保留(其他模板用)');
  assert.match(App源码, /\.ui-kicker\.center \{/, 'App .ui-kicker.center 仍保留');
  assert.match(App源码, /^\.btn \{/m, 'App 通用 .btn 仍保留');
  assert.match(App源码, /\.btn\.rite \{/, 'App .btn.rite 仍保留');
  assert.match(App源码, /\.btn\.ghost \{/, 'App .btn.ghost 仍保留');
  assert.match(App源码, /\.heartbeat \{/, 'App .heartbeat 仍保留');
  assert.match(App源码, /\.heartbeat\.dead \{/, 'App .heartbeat.dead 仍保留');
  assert.match(App源码, /:global\(html\.rq-still\) \*/, 'App 通用 rq-still 仍保留');
});

test('无中文首字符组件 tag；不触碰 A1–A3 组件边界', () => {
  const 模板段 = App源码.slice(App源码.indexOf('<template>'), App源码.lastIndexOf('</template>'));
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
  // A1 契约
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 仍导入 A1 Icon');
  assert.match(App源码, /from '\.\/assets';/, 'App 仍导入 A1 assets');
  // A2 契约
  assert.match(App源码, /import CgLibrary from '\.\/components\/CG图库\.vue';/, 'App 仍导入 A2 CG图库');
  assert.match(App源码, /import MonitorPopup from '\.\/components\/监控\.vue';/, 'App 仍导入 A2 监控');
  assert.match(App源码, /import LetterPopup from '\.\/components\/读信\.vue';/, 'App 仍导入 A2 读信');
  assert.match(App源码, /import EventPromptPopup from '\.\/components\/事件提示词\.vue';/, 'App 仍导入 A2 事件提示词');
  assert.match(App源码, /import FeedbackOverlay from '\.\/components\/反馈提示\.vue';/, 'App 仍导入 A2 反馈提示');
  // A3 契约
  assert.match(App源码, /import SettingsPopup from '\.\/components\/设置弹窗\.vue';/, 'App 仍导入 A3 设置弹窗');
  assert.match(App源码, /import FirstRunSetup from '\.\/components\/首次准备\.vue';/, 'App 仍导入 A3 首次准备');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'App 仍导入 A3 useUIPrefs');
});
