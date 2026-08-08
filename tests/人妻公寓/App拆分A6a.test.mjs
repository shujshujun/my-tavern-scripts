/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A6a 拆分（地图全屏画面+房卡 → components/地图.vue）
// 等价外移，不依赖空格/Prettier 行宽，不把注释当真实 import。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 合成源码 = readFileSync(new URL('./composables/useRoomActions.ts', 客户端目录), 'utf8');
const 地图源码 = readFileSync(new URL('./components/地图.vue', 客户端目录), 'utf8');
const 抽屉源码 = readFileSync(new URL('./components/房内操作抽屉.vue', 客户端目录), 'utf8');
const 弹窗基础css = readFileSync(new URL('./components/弹窗基础.css', 客户端目录), 'utf8');
const A3测试源码 = readFileSync(new URL('../../../../tests/人妻公寓/App拆分A3.test.mjs', 客户端目录), 'utf8');
const 稳定性测试源码 = readFileSync(new URL('../../../../tests/人妻公寓/客户端稳定性.test.mjs', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('组件非空；App 真实 import Latin-first 别名并常驻渲染且位于档案组件前；组件不反向 import App/store', () => {
  assert.ok(地图源码.length > 0, 'components/地图.vue 应为非空文件');
  assert.match(App源码, /import MapPopup from '\.\/components\/地图\.vue';/, 'App 应导入 地图.vue');
  const 模板段 = 提取模板(App源码);
  assert.match(模板段, /<MapPopup\b[\s\S]*?\/>/, 'App 模板应以 Latin-first 标签挂载 MapPopup');
  // 常驻挂载：组件自身根节点 v-if="open"，App tag 上不得再包 v-if
  assert.doesNotMatch(模板段, /<MapPopup[^>]*v-if/, 'MapPopup tag 外不得再有 v-if');
  assert.match(地图源码, /<div v-if="open" class="mask map-mask"/, '组件根节点自持 v-if="open"');
  // 位置：dock 后、档案卡前
  const 档案位置 = 模板段.indexOf('<DossierPopup');
  const 地图位置 = 模板段.indexOf('<MapPopup');
  assert.ok(地图位置 >= 0 && 地图位置 < 档案位置, 'MapPopup 应位于 DossierPopup 之前');
  const 依赖 = 提取导入specifier(地图源码);
  assert.ok(!依赖.some(s => s.includes('App.vue') || s.includes('/App')), '组件不得反向导入 App');
  assert.ok(!依赖.some(s => s.includes('store')), '组件不得导入 store');
});

test('App 不再内联 galmap/room-modal 模板与地图/房卡局部状态派生；跨区块场景与业务仍留 App', () => {
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /class="galmap"/, 'App 不应再内联 galmap 模板');
  assert.doesNotMatch(模板段, /class="room-modal"/, 'App 不应再内联 room-modal 模板');
  assert.doesNotMatch(模板段, /class="spot"/, 'App 不应再内联描点热区');
  assert.doesNotMatch(模板段, /class="outing-launch"/, 'App 不应再内联外出按钮');
  assert.doesNotMatch(模板段, /class="map-fallback"/, 'App 不应再内联兜底楼体');
  for (const 声明 of [
    'const 房卡 = ref<string | null>',
    'const 结果卡 = ref',
    'const 立面失效 = ref',
    'const 时段问候 = computed',
    'const 楼层组 = computed',
    'const 底层公共 = ',
    'const 立面点位',
    'const 地图点位 = computed',
    'const 用画布地图 = computed',
    'const 时段色调 = computed',
    'const 房卡名称 = computed',
    'const 房卡kicker = computed',
    'const 房卡氛围 = computed',
    'const 房卡在场 = computed',
    'const 房卡动作 = computed',
    'function 点房(',
    'function 户牌(',
    'function 房内首字(',
  ]) {
    assert.doesNotMatch(App源码, new RegExp(转义(声明)), `App 不应再声明 ${声明}`);
  }
  // 跨区块场景/移动业务仍留 App
  assert.match(App源码, /const 当前房间 = ref<string \| null>\(null\)/, '当前房间仍留 App');
  assert.match(App源码, /const 显示地图 = ref\(false\)/, '显示地图仍留 App');
  assert.match(App源码, /async function 进入\(/, '进入仍留 App');
  assert.match(App源码, /async function 离开房间\(/, '离开房间仍留 App');
  assert.match(App源码, /async function 写场景\(/, '写场景仍留 App');
  // A6b:动作实现与破门局部状态迁入 useRoomActions.ts，App 经 composable 获得同一入口
  assert.doesNotMatch(App源码, /function 房间动作\(/, '房间动作实现应迁出 App');
  assert.doesNotMatch(App源码, /const 普通房间动作 = computed/, '普通房间动作实现应迁出 App');
  assert.doesNotMatch(App源码, /async function 确认已到达动作地点\(/, '确认已到达动作地点实现应迁出 App');
  assert.match(App源码, /import \{ useRoomActions \} from '\.\/composables\/useRoomActions';/, 'App 应导入 useRoomActions');
  assert.match(App源码, /const \{ 房间动作, 当前房间动作, 普通房间动作, 确认已到达动作地点 \} = useRoomActions\(\{/, 'App 应解构 composable 返回值');
  assert.match(合成源码, /function 房间动作\(id: string \| null\): 卡动作\[\]/, 'composable 持有房间动作');
  assert.match(合成源码, /const 普通房间动作 = computed/, 'composable 持有普通房间动作');
  assert.match(合成源码, /async function 确认已到达动作地点\(/, 'composable 持有确认已到达动作地点');
  assert.match(合成源码, /return \{ 房间动作, 当前房间动作, 普通房间动作, 确认已到达动作地点 \};/, 'composable 返回动作入口');
  assert.match(App源码, /function 关地图\(\)/, '关地图仍留 App');
  assert.match(App源码, /async function 从地图外出\(\)/, '从地图外出仍留 App');
  assert.match(App源码, /function 发起时间推进\(/, '发起时间推进仍留 App');
  assert.match(App源码, /function 发起时间撤销\(/, '发起时间撤销仍留 App');
});

test('props/emits 接线、ref 公开接口完整；显示结果严格守 open && 房卡；App 独立事件反馈改调公开接口', () => {
  const 模板段 = 提取模板(App源码);
  assert.match(
    模板段,
    /<MapPopup\b[\s\S]*?:open="显示地图 && 就绪"[\s\S]*?:data="data"[\s\S]*?:current-room="当前房间"[\s\S]*?:day="天数"[\s\S]*?:weekday="星期"[\s\S]*?:period="时段"[\s\S]*?:lite="省流"[\s\S]*?:sending="发送中"[\s\S]*?:avatar-failed="头像失效"[\s\S]*?:avatar-image="头像图"[\s\S]*?:avatar-name="头像名"[\s\S]*?:room-people="房内的人"[\s\S]*?:window-lit="窗灯"[\s\S]*?:management-badge="管理任务角标"[\s\S]*?:rent-owed="欠租中"[\s\S]*?:room-actions="房间动作"[\s\S]*?@close="关地图"[\s\S]*?@outing="从地图外出"[\s\S]*?@avatar-error="头像失效\[\$event\] = true"[\s\S]*?\/>/,
    'MapPopup tag 全部 props/emits 接线',
  );
  assert.match(
    地图源码,
    /defineProps<\{[\s\S]*?open: boolean[\s\S]*?data: SchemaType[\s\S]*?currentRoom: string \| null[\s\S]*?day: number[\s\S]*?weekday: string[\s\S]*?period: '早上' \| '中午' \| '下午' \| '傍晚' \| '晚上' \| '深夜'[\s\S]*?lite: boolean[\s\S]*?sending: boolean[\s\S]*?avatarFailed: Record<string, boolean>[\s\S]*?avatarImage: \(name: string\) => string[\s\S]*?avatarName: \(displayName: string\) => string[\s\S]*?roomPeople: \(roomId: string\) => string\[\][\s\S]*?windowLit: \(roomId: string\) => boolean[\s\S]*?managementBadge: \(roomId: string\) => '' \| '楼务' \| '逾期'[\s\S]*?rentOwed: \(roomId: string\) => boolean[\s\S]*?roomActions: \(roomId: string \| null\) => 卡动作\[\][\s\S]*?\}>/,
    '组件 props 强类型契约',
  );
  assert.match(
    地图源码,
    /defineEmits<\{[\s\S]*?close: \[\][\s\S]*?outing: \[\][\s\S]*?avatarError: \[name: string\][\s\S]*?\}>/,
    '组件 emits 强类型契约',
  );
  assert.match(App源码, /type 地图弹窗公开接口 = \{ 显示结果: \(消息: string\) => boolean \};/, 'App 公开接口类型');
  assert.match(App源码, /const 地图弹窗 = ref<地图弹窗公开接口 \| null>\(null\)/, 'App 地图弹窗 ref');
  assert.match(模板段, /ref="地图弹窗"/, 'App tag 挂 ref');
  assert.match(
    地图源码,
    /function 显示结果\(消息: string\): boolean \{\s*if \(!props\.open \|\| !房卡\.value\) return false;\s*结果卡\.value = 消息;\s*return true;\s*\}/,
    '显示结果严格守 open+房卡',
  );
  assert.match(地图源码, /defineExpose\(\{ 显示结果 \}\)/, 'defineExpose 显示结果');
  assert.doesNotMatch(App源码, /if \(显示地图\.value && 房卡\.value\) 结果卡\.value = 消息;/, 'App 不再直写结果卡');
  assert.match(App源码, /if \(!地图弹窗\.value\?\.显示结果\(消息\)\) \{/, '独立事件反馈改调公开接口');
  assert.match(App源码, /if \(消息\.startsWith\('【'\)\) 拾获卡\.value = 消息;[\s\S]{0,80}else 弹提示\(消息\);/, '拾获/toast 分支保留');
  assert.doesNotMatch(地图源码, /eventEmit\(|eventOn\(/, '组件不含事件总线写入');
});

test('组件模板关键契约全量保持：点位/角标优先级/头像/兜底/外出/房卡/发送中/结果卡', () => {
  const 模板段 = 提取模板(地图源码);
  assert.match(模板段, /class="mask map-mask" @click\.self="请求关闭"/, '根遮罩 self 走请求关闭');
  assert.match(模板段, /class="galmap" :class="'sky-' \+ period"/, 'galmap 天空档');
  assert.match(模板段, /<b>第 \{\{ day \}\} 天 · \{\{ weekday \}\}<\/b/, '日期/星期');
  assert.match(模板段, /\{\{ 时段问候 \}\}/, '时段问候');
  assert.match(模板段, /:src="`\$\{素材基址\}\/地图\/立面_傍晚\.webp`"/, '立面图路径');
  assert.match(模板段, /@error="立面失效 = true"/, '立面图失败回退');
  assert.match(
    模板段,
    /class="spot"[\s\S]*?:class="\{ here: currentRoom === 点\.id, vacant: 点\.空置, lit: windowLit\(点\.id\) \}"/,
    '点位 here/vacant/lit',
  );
  assert.match(模板段, /:style="\{ left: 点\.x \+ '%', top: 点\.y \+ '%' \}"/, '点位坐标');
  // 楼务/逾期优先于欠租、欠租优先于头像的原 v-if/v-else-if 链
  assert.match(模板段, /v-if="点\.空置" class="spot-note">招租/, '招租注记');
  assert.match(
    模板段,
    /v-else-if="managementBadge\(点\.id\)"[\s\S]*?:class="\{ overdue: managementBadge\(点\.id\) === '逾期' \}"/,
    '楼务/逾期角标优先',
  );
  assert.match(模板段, /v-else-if="rentOwed\(点\.id\)" class="spot-note owe">欠租/, '欠租角标');
  assert.match(
    模板段,
    /v-else-if="currentRoom === 点\.id \|\| roomPeople\(点\.id\)\.length" class="spot-faces"/,
    '头像出现门',
  );
  assert.match(模板段, /v-if="currentRoom === 点\.id && !avatarFailed\['主角'\]"/, '主角头像失败门');
  assert.match(模板段, /:src="avatarImage\('主角'\)"[\s\S]*?@error="emit\('avatarError', '主角'\)"/, '主角头像图+失败 emit');
  assert.match(模板段, /v-if="!avatarFailed\[avatarName\(名\)\]"/, '人物头像失败门');
  assert.match(模板段, /:src="avatarImage\(avatarName\(名\)\)"[\s\S]*?@error="emit\('avatarError', avatarName\(名\)\)"/, '人物头像图+失败 emit');
  assert.match(模板段, /<b v-else>\{\{ 名\[0\] \}\}<\/b>/, '头像失败首字回退');
  assert.match(模板段, /class="map-fallback"/, '兜底容器');
  assert.match(模板段, /class="roof-card" :class="\{ here: currentRoom === '天台' \}"/, '天台点');
  assert.match(模板段, /v-for="层 in 楼层组"[\s\S]*?v-for="房 in 层\.房"/, '楼层组循环');
  assert.match(模板段, /v-for="房 in 底层公共"/, '底层公共循环');
  assert.match(模板段, /class="outing-launch" type="button" :disabled="sending" @click="请求外出"/, '外出按钮 disabled');
  assert.match(模板段, /<small>OUTING \/ 外出<\/small><b>走出公寓<\/b>/, '外出三行文案');
  assert.match(模板段, /晨跑 · 健身房 · 更多地点准备中/, '外出副文案');
  assert.match(模板段, /<transition name="card-pop">/, '房卡弹卡过渡');
  assert.match(模板段, /v-if="房卡" class="rc-mask" @click\.self="房卡 = null"/, '房卡 mask.self');
  assert.match(模板段, /class="sheet-close" @click="房卡 = null">✕/, '房卡 ✕');
  assert.match(模板段, /class="rm-hero" :class="\{ pub: !\/\^\\d\+\$\/\.test\(房卡\) \}"/, 'hero pub 分支');
  assert.match(模板段, /class="who-chip mini" :title="名"/, '在场头像 chip');
  assert.match(模板段, /<em>\{\{ 房卡在场 \}\}<\/em>/, '房卡在场');
  assert.match(模板段, /<em v-else>此刻没有人<\/em>/, '无人文案');
  assert.match(模板段, /class="rc-mood">\{\{ 房卡氛围 \}\}/, '氛围');
  assert.match(
    模板段,
    /v-for="\(动作, i\) in 房卡动作"[\s\S]*?:class="动作\.类"[\s\S]*?:disabled="sending"[\s\S]*?@click="动作\.做\(\)"/,
    '动作两列+发送中 disabled',
  );
  assert.match(模板段, /<span class="act-kicker">\{\{ 动作\.kicker \}\}<\/span>/, '动作 kicker');
  assert.match(模板段, /<strong>\{\{ 动作\.文案 \}\}<\/strong>/, '动作文案');
  assert.match(模板段, /<span v-if="!房卡动作\.length" class="rc-empty">门上贴着招租启事,还没有住户<\/span>/, '空房文案');
  assert.match(
    模板段,
    /<transition name="clue-flip">[\s\S]*?<div v-if="结果卡" :key="结果卡" class="clue-card">\{\{ 结果卡 \}\}<\/div>/,
    '结果卡 clue-flip',
  );
  // 房卡派生逻辑逐字等价
  assert.match(地图源码, /const 房卡名称 = computed\(\(\) => \(房卡\.value \? \(查房间\(房卡\.value\)\?\.名称 \?\? 房卡\.value\) : ''\)\)/, '房卡名称派生');
  assert.ok(地图源码.includes("return /^\\d+$/.test(id) ? `ROOM ${id}` : 'COMMON SPACE';"), '房卡kicker');
  assert.match(地图源码, /窗户蒙着灰,门上贴着一张手写的招租启事。/, '招租氛围文案');
  assert.match(地图源码, /房\?\.类型 === '户' && 房卡\.value !== '302' && !props\.data\.户\[房卡\.value\]/, '招租判断排除 302');
  assert.match(地图源码, /props\.roomPeople\(房卡\.value\)\.join\('、'\)/, '房卡在场派生');
  assert.match(地图源码, /const 房卡动作 = computed<卡动作\[\]>\(\(\) => props\.roomActions\(房卡\.value\)\)/, '房卡动作走函数 prop');
});

test('组件局部状态/派生完整；素材来自 ../assets，无 ?url；关图/外出/watch 清理语义保持', () => {
  assert.match(地图源码, /const 房卡 = ref<string \| null>\(null\)/, '房卡局部状态');
  assert.match(地图源码, /const 结果卡 = ref\(''\)/, '结果卡局部状态');
  assert.match(地图源码, /const 立面失效 = ref\(false\)/, '立面失效局部状态');
  assert.match(
    地图源码,
    /watch\(\s*\(\) => props\.open,\s*开 => \{\s*if \(!开\) 清房卡与结果\(\);\s*\},\s*\)/,
    '外部关图 watch 清房卡与结果',
  );
  assert.match(地图源码, /function 点房\(房间id: string\) \{\s*if \(props\.sending\) return;/, '点房发送中守卫');
  assert.match(地图源码, /结果卡\.value = '';\s*房卡\.value = 房卡\.value === 房间id \? null : 房间id;/, '点房清结果+同房切换关闭');
  assert.match(地图源码, /function 请求关闭\(\): void \{\s*清房卡与结果\(\);\s*emit\('close'\);\s*\}/, '请求关闭先清再 emit');
  assert.match(地图源码, /function 请求外出\(\): void \{\s*清房卡与结果\(\);\s*emit\('outing'\);\s*\}/, '请求外出先清再 emit');
  assert.match(地图源码, /import \{ 素材基址 \} from '\.\.\/assets'/, '组件从 ../assets 导入素材基址');
  assert.match(地图源码, /import type \{ SchemaType \} from '\.\.\/\.\.\/\.\.\/schema'/, '组件从 ../../../schema type 导入 SchemaType');
  assert.match(地图源码, /import type \{ 卡动作 \} from '\.\.\/types'/, '组件从 ../types type 导入 卡动作');
  assert.match(地图源码, /import \{ 户静态表, 查房间, type 门牌 \} from '\.\.\/\.\.\/\.\.\/stageConfig'/, '组件从 stageConfig 导入户静态表/查房间/门牌');
  assert.match(地图源码, /import Ic from '\.\/Icon\.vue'/, '组件导入 Icon');
  assert.match(地图源码, /const 用画布地图 = computed\(\(\) => !props\.lite && !立面失效\.value\)/, '用画布地图 = !lite && !立面失效');
  assert.match(地图源码, /const 时段色调 = computed/, '时段色调派生');
  assert.match(地图源码, /const 时段问候 = computed/, '时段问候派生');
  assert.match(地图源码, /const 楼层组 = computed/, '楼层组派生');
  assert.match(地图源码, /const 地图点位 = computed/, '地图点位派生');
  assert.match(地图源码, /const 立面点位: readonly \{ id: string; 名: string; x: number; y: number \}\[\] = \[/, '立面点位坐标');
  assert.match(地图源码, /\{ id: '管理员室', 名: '管理员室', x: 37, y: 74 \}/, '点位坐标数值');
  assert.match(地图源码, /const 底层公共 = \[[\s\S]*?\{ id: '垃圾房', 名称: '垃圾房' \}/, '底层公共区');
  assert.doesNotMatch(地图源码, /(?:png|webp)\?url/, '组件不得出现 png?url / webp?url');
});

test('地图专属 CSS 已从 App 移除且在组件；组件引基础 CSS 并复制共享规则；App 仍保留共享规则', () => {
  for (const selector of [
    '.map-mask {',
    '.outing-launch {',
    '.galmap {',
    '.sky-早上 {',
    '.sky-深夜 {',
    '.sky-deco {',
    '.map-banner {',
    '.bldg {',
    '.roofline {',
    '.roof-card {',
    '.bldg-body {',
    '.bfloor {',
    '.bunit {',
    '.unit-window {',
    '.unit-plate {',
    '.bground {',
    '.gunit {',
    '.rc-mask {',
    '.room-modal {',
    '.rm-hero {',
    '.rc-empty {',
    '.rc-mood {',
    '.rm-grid {',
    '.room-modal .clue-card {',
    '.rm-who {',
    '.map-stage {',
    '.map-canvas {',
    '.map-base {',
    '.map-veil {',
    '.tint-day .map-base {',
    '.tint-night .map-veil {',
    '.tint-late .map-base {',
    '.spot {',
    '.spot-plate {',
    '.spot-note.owe {',
    '.spot-faces {',
    '.map-fallback {',
  ]) {
    assert.match(地图源码, new RegExp(转义(selector)), `地图组件应持有 ${selector}`);
    assert.doesNotMatch(App源码, new RegExp(转义(selector)), `App 不应再持有 ${selector}`);
  }
  // 共享规则：组件复制、App 保留（到场卡/场景条/垃圾弹窗过渡仍用）
  for (const selector of [
    '.who-chip {',
    '.who-chip.mini img,',
    '.clue-card {',
    '.card-pop-enter-active {',
    '.clue-flip-enter-active {',
  ]) {
    assert.match(地图源码, new RegExp(转义(selector)), `地图组件应复制 ${selector}`);
    assert.match(App源码, new RegExp(转义(selector)), `App 应保留 ${selector}`);
  }
  // 瓷砖/kicker：地图与房内操作抽屉各按 scoped 自持，App 不再持有（正文房内动作已迁抽屉组件）
  for (const selector of [
    '.tile {',
    '.tile .ic {',
    '.tile.risky .ic {',
    '.act-kicker {',
  ]) {
    assert.match(地图源码, new RegExp(转义(selector)), `地图组件应复制 ${selector}`);
    assert.doesNotMatch(App源码, new RegExp(转义(selector)), `App 不应再持有 ${selector}`);
    assert.match(抽屉源码, new RegExp(转义(selector)), `抽屉组件应持有 ${selector}`);
  }
  assert.match(地图源码, /@keyframes card-pop-in/, '组件复制 card-pop keyframes');
  assert.match(地图源码, /@keyframes clue-flip-in/, '组件复制 clue-flip keyframes');
  assert.match(地图源码, /@keyframes cloud-drift/, '组件持有 cloud-drift keyframes');
  assert.match(地图源码, /@keyframes star-wink/, '组件持有 star-wink keyframes');
  assert.doesNotMatch(App源码, /@keyframes cloud-drift|@keyframes star-wink/, 'App 不再持有天空 keyframes');
  assert.match(地图源码, /<style scoped src="\.\/弹窗基础\.css"><\/style>/, '应引入弹窗基础.css');
  assert.match(弹窗基础css, /\.mask \{/, '基础 .mask 来自弹窗基础');
});

test('dark/lite/mobile 地图规则迁移，App 无地图专属残留；A1–A5b 边界未回退', () => {
  for (const selector of [
    ':global(html.rq-dark) .spot {',
    ':global(html.rq-dark) .outing-launch {',
    ':global(html.rq-dark.rq-lite) .map-fallback .bldg-body {',
    ':global(html.rq-dark) .room-modal {',
  ]) {
    assert.match(地图源码, new RegExp(转义(selector)), `地图组件应持有 ${selector}`);
    assert.doesNotMatch(App源码, new RegExp(转义(selector)), `App 不应再持有 ${selector}`);
  }
  // App 侧合写选择器按所有权拆分后仍保留其余对象
  assert.match(App源码, /:global\(html\.rq-dark\) \.peep-card,[\s\S]{0,40}\.loc-banner \{/, 'App 保留 dark peep-card/loc-banner');
  assert.match(App源码, /:global\(html\.rq-dark\) \.todo-bar,[\s\S]{0,40}\.clue-card \{/, 'App 保留 dark todo-bar/clue-card');
  assert.match(地图源码, /:global\(html\.rq-dark\) \.clue-card \{/, '组件复制 dark clue-card');
  assert.doesNotMatch(App源码, /:global\(html\.rq-dark\) \.tile \{/, 'App 不再持有 dark tile(随房内动作迁抽屉)');
  assert.match(地图源码, /:global\(html\.rq-dark\) \.tile \{/, '地图复制 dark tile');
  assert.match(抽屉源码, /:global\(html\.rq-dark \.tile\) \{/, '抽屉组件持有可正确编译的 dark tile');
  assert.doesNotMatch(App源码, /\.map-stage \{|\.outing-launch \{/, 'App 无移动端 map-stage/outing 残留');
  assert.match(地图源码, /@media \(max-width: 540px\)[\s\S]*?transform: scale\(1\.24\);/, '移动端画布放大在组件');
  assert.match(地图源码, /\.outing-launch \{\s*bottom: max\(7px, env\(safe-area-inset-bottom\)\);/, '移动端外出按钮在组件');
  // A1–A5b 边界未回退
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 仍导入 A1 Icon');
  assert.match(App源码, /import CgLibrary from '\.\/components\/CG图库\.vue';/, 'App 仍导入 A2 CG图库');
  assert.match(App源码, /import MonitorPopup from '\.\/components\/监控\.vue';/, 'App 仍导入 A2 监控');
  assert.match(App源码, /import LetterPopup from '\.\/components\/读信\.vue';/, 'App 仍导入 A2 读信');
  assert.match(App源码, /import EventPromptPopup from '\.\/components\/事件提示词\.vue';/, 'App 仍导入 A2 事件提示词');
  assert.match(App源码, /import FeedbackOverlay from '\.\/components\/反馈提示\.vue';/, 'App 仍导入 A2 反馈提示');
  assert.match(App源码, /import SettingsPopup from '\.\/components\/设置弹窗\.vue';/, 'App 仍导入 A3 设置弹窗');
  assert.match(App源码, /import FirstRunSetup from '\.\/components\/首次准备\.vue';/, 'App 仍导入 A3 首次准备');
  assert.match(App源码, /import PrologueTitleScreen from '\.\/components\/序章标题屏\.vue';/, 'App 仍导入 A4 序章标题屏');
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'App 仍导入 A5a 背包');
  assert.match(App源码, /import ShopPopup from '\.\/components\/商店\.vue';/, 'App 仍导入 A5a 商店');
  assert.match(App源码, /import DossierPopup from '\.\/components\/档案卡\.vue';/, 'App 仍导入 A5b 档案卡');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'App 仍导入 A3 useUIPrefs');
});

test('A3 测试按所有权读取地图组件且断言不弱化；既有测试契约保持；无中文首字符组件 tag；源码不触碰 dist', () => {
  assert.match(A3测试源码, /components\/地图\.vue/, 'A3 测试应读取地图组件');
  assert.ok(A3测试源码.includes('const 用画布地图 = computed'), 'A3 用画布地图断言仍在');
  // 稳定性测试源码是 JS 文件,其 .clue-card 断言写在转义正则里(不是行首),直接检查三个关键字符串。
  assert.ok(稳定性测试源码.includes('^\\.clue-card'), '稳定性测试 .clue-card 断言仍在');
  assert.ok(稳定性测试源码.includes('white-space'), '稳定性测试 white-space 断言仍在');
  assert.ok(稳定性测试源码.includes('overflow-wrap'), '稳定性测试 overflow-wrap 断言仍在');
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  assert.doesNotMatch(地图源码, /dist\//, '地图组件不得引用 dist');
});
