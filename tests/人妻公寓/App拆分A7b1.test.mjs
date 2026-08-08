/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A7b1 拆分（静音会议筹备弹窗 → components/静音会议筹备.vue）
// 等价外移：筹备模板与专属 CSS 迁入组件，App 保留 wrapper/options 接线，业务状态与 timer 在
// useMuteMeeting.ts(A7b2)，事件名/载荷/pull/toast/lockUI 经 options 注入，经 props/emits 接线。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 组件源码 = readFileSync(new URL('./components/静音会议筹备.vue', 客户端目录), 'utf8');
const composable源码 = readFileSync(new URL('./composables/useMuteMeeting.ts', 客户端目录), 'utf8');
const 舞台源码 = readFileSync(new URL('./components/静音会议舞台.vue', 客户端目录), 'utf8');
const 互动源码 = readFileSync(new URL('./components/静音会议互动.vue', 客户端目录), 'utf8');
const 锁定源码 = readFileSync(new URL('./components/静音会议锁定提示.vue', 客户端目录), 'utf8');
const 会后源码 = readFileSync(new URL('./components/静音会议会后.vue', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('新组件非空；App 真实 import Latin-first 组件并恰好渲染一次；无中文首字符组件 tag', () => {
  assert.ok(组件源码.length > 0, '静音会议筹备.vue 应为非空文件');
  assert.match(App源码, /import MuteMeetingPreparation from '\.\/components\/静音会议筹备\.vue';/, 'App 应导入 静音会议筹备.vue');
  const App模板 = 提取模板(App源码);
  assert.strictEqual((App模板.match(/<MuteMeetingPreparation\b/g) ?? []).length, 1, 'App 模板应恰好渲染一次 MuteMeetingPreparation');
  assert.match(App模板, /<MuteMeetingPreparation\b[\s\S]*?\/>/, 'App 模板应以 Latin-first 标签挂载 静音会议筹备');
  assert.doesNotMatch(App模板, /<\/?[一-鿿][^>]*>/, 'App 组件 tag 不得以中文首字符');
  assert.doesNotMatch(提取模板(组件源码), /<\/?[一-鿿][^>]*>/, '组件模板不得有中文首字符 tag');
});

test('App 接线完整：11 props 与 7 emits 全部连上；InventoryPopup @prepare-meeting、wrapper 与三条事件名仍在', () => {
  const App模板 = 提取模板(App源码);
  const 接线 = [
    ':step="静音会议筹备步骤"',
    ':candidates="静音会议候选列表"',
    ':selected-wives="静音会议筹备妻"',
    ':topic="静音会议筹备议题"',
    ':topics="静音会议议题列表"',
    ':can-confirm="静音会议筹备可确认"',
    ':wife-names="静音会议筹备妻名"',
    ':husband-names="静音会议筹备夫名"',
    ':submitting="静音会议筹备提交中"',
    ':avatar-failed="头像失效"',
    ':avatar-image="头像图"',
    '@close="取消静音会议筹备"',
    '@toggle-wife="切换静音会议筹备妻"',
    '@select-topic="静音会议筹备议题 = $event"',
    "@back=\"静音会议筹备步骤 = '选择'\"",
    '@submit="发送静音会议通知"',
    '@avatar-error="头像失效[$event] = true"',
  ];
  for (const 段 of 接线) assert.match(App模板, new RegExp(转义(段)), `App 接线应含 ${段}`);
  assert.match(App模板, /@prepare-meeting="打开静音会议筹备"/, 'InventoryPopup 背包票仍接 打开静音会议筹备');
  assert.match(App源码, /function 打开静音会议筹备\(\)/, 'App 保留 打开静音会议筹备 wrapper');
  for (const 事件名 of ['人妻公寓:使用静音会议', '人妻公寓:取消静音会议筹备', '人妻公寓:启动静音会议']) {
    assert.match(App源码, new RegExp(转义(事件名)), `App 业务仍发 ${事件名}`);
  }
});

test('组件 props/emits 强类型完整，无 any/Function/as never；不反向 import App/store/eventEmit，无 timer 与业务派生', () => {
  const props段 = 组件源码.slice(组件源码.indexOf('defineProps<{'), 组件源码.indexOf('}>()', 组件源码.indexOf('defineProps<{')));
  for (const 字段 of ['step', 'candidates', 'selectedWives', 'topic', 'topics', 'canConfirm', 'wifeNames', 'husbandNames', 'submitting', 'avatarFailed', 'avatarImage']) {
    assert.match(props段, new RegExp(`\\b${字段}:`), `props 应含 ${字段}`);
  }
  for (const 类型 of ['readonly 静音会议候选[]', 'readonly 静音会议候选门牌[]', 'Readonly<Record<string, boolean>>', '(name: string) => string']) {
    assert.match(props段, new RegExp(转义(类型)), `props 应强类型 ${类型}`);
  }
  const emits段 = 组件源码.slice(组件源码.indexOf('defineEmits<{'), 组件源码.indexOf('}>();', 组件源码.indexOf('defineEmits<{')));
  for (const 事件 of ['close', 'toggleWife', 'selectTopic', 'confirm', 'back', 'submit', 'avatarError']) {
    assert.match(emits段, new RegExp(`\\b${事件}:`), `emits 应含 ${事件}`);
  }
  assert.match(emits段, /toggleWife: \[room: 静音会议候选门牌\]/, 'toggleWife 参数为精确门牌类型');
  assert.match(组件源码, /interface 静音会议候选 \{/, '组件应声明候选 interface');
  assert.doesNotMatch(组件源码, /: any|Function|\bas never\b/, '组件不得有 any/Function/as never 逃逸');
  const 依赖 = 提取导入specifier(组件源码);
  assert.ok(!依赖.some(s => s.includes('App.vue') || s === './App' || s === '../App'), '组件不得反向导入 App');
  assert.ok(!依赖.some(s => s.includes('store')), '组件不得导入 store');
  assert.doesNotMatch(组件源码, /eventEmit\(|eventOn\(/, '组件不直连事件总线');
  assert.doesNotMatch(组件源码, /setTimeout|setInterval|clearTimeout/, '组件不含 timer');
  assert.doesNotMatch(组件源码, /\bcomputed\(|\bref\(|\bwatch\(/, '组件不含业务派生/局部状态');
});

test('两阶段模板、候选循环/资格/头像回退、议题、计数、确认卡、三条说明、disabled/aria/按钮事件全部位于组件；App 不再内联标志性 DOM/文案', () => {
  const 组件模板 = 提取模板(组件源码);
  const App模板 = 提取模板(App源码);
  // 根遮罩与两阶段
  assert.match(组件模板, /v-if="step" class="mask mute-prep-mask"/, '组件根自持 v-if="step"');
  assert.match(组件模板, /<template v-if="step === '选择'">/, '选择阶段');
  assert.match(组件模板, /<template v-else>/, '确认阶段');
  assert.match(组件模板, /亲自确定与会名单/, '选择阶段题头');
  assert.match(组件模板, /发送前最后确认/, '确认阶段题头');
  // 候选循环/资格/头像回退
  assert.match(组件模板, /v-for="候选 in candidates"/, '候选循环');
  assert.match(组件模板, /:disabled="!候选\.合格"/, '不合格禁选');
  assert.match(组件模板, /:class="\{ on: selectedWives\.includes\(候选\.门牌\), ineligible: !候选\.合格 \}"/, 'on/ineligible 类');
  assert.match(组件模板, /:aria-pressed="selectedWives\.includes\(候选\.门牌\)"/, '候选 aria-pressed');
  assert.match(组件模板, /@click="emit\('toggleWife', 候选\.门牌\)"/, '候选切换只 emit');
  assert.match(组件模板, /v-if="!avatarFailed\[候选\.妻名\]"/, '头像失败回退');
  assert.match(组件模板, /avatarImage\(候选\.妻名\)/, '头像图来自 props');
  assert.match(组件模板, /@error="emit\('avatarError', 候选\.妻名\)"/, '头像错误只 emit');
  assert.match(组件模板, /<b v-else>\{\{ 候选\.妻名\[0\] \}\}<\/b>/, '失败后首字回退');
  assert.match(组件模板, /\{\{ 候选\.合格 \? '可以列席' : 候选\.原因 \}\}/, '资格原因文案');
  // 议题
  assert.match(组件模板, /v-for="议题 in topics"/, '议题循环');
  assert.match(组件模板, /:class="\{ on: topic === 议题 \}"/, '议题选中类');
  assert.match(组件模板, /@click="emit\('selectTopic', 议题\)"/, '议题选择只 emit');
  // 计数
  assert.match(组件模板, /已选 \{\{ selectedWives\.length \}\}\/3/, '已选计数');
  assert.match(组件模板, /\{\{ topic \|\| '尚未选择议题' \}\}/, '议题占位文案');
  // 确认卡与三条说明
  assert.match(组件模板, /class="mute-confirm-card"/, '确认卡容器');
  assert.match(组件模板, /\{\{ wifeNames\.join\('、'\) \}\}/, '参与妻名单');
  assert.match(组件模板, /\{\{ husbandNames\.join\('、'\) \}\}/, '丈夫名单');
  assert.match(组件模板, /管理员室 · 会场临时集合/, '地点');
  assert.match(组件模板, /开场后地图、离场、普通房间动作、商店、背包与监控入口锁定。/, '说明一');
  assert.match(组件模板, /人物只在演出层临时到场，不修改日常位置、作息、赴约或关系。/, '说明二');
  assert.match(组件模板, /将消耗 1 张「静音会议」票；条件变化时会拒绝开场且不消耗。/, '说明三');
  // 查看/返回/提交按钮
  assert.match(组件模板, /@click="emit\('confirm'\)"/, '查看确认只 emit');
  assert.match(组件模板, /:disabled="!canConfirm"/, '查看确认 disabled');
  assert.match(组件模板, /@click="emit\('back'\)"/, '返回修改只 emit');
  assert.match(组件模板, /:disabled="submitting \|\| !canConfirm"/, '提交 disabled');
  assert.match(组件模板, /@click="emit\('submit'\)"/, '发送通知只 emit');
  assert.match(组件模板, /\{\{ submitting \? '正在重新校验…' : '发送会议通知并开始' \}\}/, '提交文案');
  // App 不再内联这些标志性 DOM/文案
  for (const 标志 of [
    'class="mute-prep-mask"',
    'class="mute-candidate"',
    'class="mute-topic-grid"',
    'class="mute-confirm-card"',
    "静音会议筹备步骤 === '选择'",
    '静音会议筹备妻名.join',
    '静音会议筹备夫名.join',
  ]) {
    assert.doesNotMatch(App模板, new RegExp(转义(标志)), `App 不应再内联 ${标志}`);
  }
});

test('专属 CSS 所有权：筹备规则迁入组件并引入 弹窗基础.css；App 不再持有；运行/互动/锁定/会后迁入四个 A7b3 组件，App 只留 dock/phone 与 parent 跨布局例外', () => {
  assert.match(组件源码, /<style scoped src="\.\/弹窗基础\.css"><\/style>/, '组件应引入 弹窗基础.css');
  const 迁入选择器 = [
    '.mute-prep-mask {',
    '.sheet.mute-prep-sheet {',
    '.mute-prep-sheet > h3 {',
    '.mute-prep-lead {',
    '.mute-candidate-grid {',
    '.mute-candidate {',
    '.mute-candidate.on {',
    '.mute-candidate.ineligible {',
    '.mute-candidate-avatar,',
    '.mute-candidate-main {',
    '.mute-candidate > i {',
    '.mute-topic-block {',
    '.mute-topic-grid {',
    '.mute-topic-grid button {',
    '.mute-prep-footer {',
    '.mute-prep-footer.confirm {',
    '.mute-confirm-card {',
    '.mute-confirm-card dl {',
    '.mute-confirm-card ul {',
    ':global(html.rq-dark) .mute-candidate,',
    ':global(html.rq-dark) .mute-topic-grid button {',
    '.mute-prep-footer .btn {',
  ];
  for (const 选择器 of 迁入选择器) {
    assert.match(组件源码, new RegExp(转义(选择器)), `组件应持有 ${选择器}`);
    assert.doesNotMatch(App源码, new RegExp(转义(选择器)), `App 不应再持有 ${选择器}`);
  }
  // 舞台组件持有运行轨道/组合图/keyframe/mobile
  for (const 选择器 of [
    '.mute-meeting-track {',
    '.mute-meeting-track span,',
    '.mute-meeting-track b {',
    '.mute-meeting-track em {',
    '.mute-meeting-visual {',
    '.mute-meeting-visual.state-DETAIL {',
    '.mute-meeting-visual img {',
    '.mute-meeting-visual-fallback {',
    '@keyframes mute-visual-turn {',
  ]) {
    assert.match(舞台源码, new RegExp(转义(选择器)), `舞台组件应持有 ${选择器}`);
    assert.doesNotMatch(App源码, new RegExp(转义(选择器)), `App 不应再持有 ${选择器}`);
  }
  assert.match(舞台源码, /:global\(html\.rq-still\) \.mute-meeting-visual img/, '舞台组件应持有 rq-still visual 减动效');
  assert.match(舞台源码, /@media \(max-width: 540px\)[\s\S]*?\.mute-meeting-track/, '舞台组件应持有 540px track 规则');
  // 互动组件持有互动幕/目标/模式/控制/结果/辅助/keyframe/mobile
  for (const 选择器 of [
    '.mute-meeting-interaction-stage {',
    '.mute-interaction-panel {',
    '.mute-interaction-copy {',
    '.mute-target {',
    '.mute-target.on {',
    '.mute-mode-row {',
    '.mute-control-button {',
    '.hold-progress {',
    '.mute-interaction-result {',
    '.mute-interaction-assist {',
    '@keyframes mute-hold-progress {',
    '@keyframes mute-target-pulse {',
  ]) {
    assert.match(互动源码, new RegExp(转义(选择器)), `互动组件应持有 ${选择器}`);
    assert.doesNotMatch(App源码, new RegExp(转义(选择器)), `App 不应再持有 ${选择器}`);
  }
  assert.match(互动源码, /:global\(html\.rq-still\) \.mute-target\.pulse/, '互动组件应持有 rq-still target 减动效');
  assert.match(互动源码, /\.mute-control-button\.holding \.hold-progress/, '互动组件应持有 holding 进度动效');
  assert.match(互动源码, /@media \(max-width: 540px\)[\s\S]*?\.mute-interaction-panel/, '互动组件应持有 540px interaction 规则');
  // 锁定提示组件持有 lock-note + dark
  for (const 选择器 of [
    '.mute-meeting-lock-note {',
    ':global(html.rq-dark) .mute-meeting-lock-note {',
  ]) {
    assert.match(锁定源码, new RegExp(转义(选择器)), `锁定组件应持有 ${选择器}`);
    assert.doesNotMatch(App源码, new RegExp(转义(选择器)), `App 不应再持有 ${选择器}`);
  }
  // 会后组件持有散会/自由/收尾面板 + dark + mobile
  for (const 选择器 of [
    '.mute-after-panel {',
    '.mute-after-heading {',
    '.mute-after-wives {',
    '.mute-after-count {',
    '.mute-free-actions {',
    '.mute-free-actions.single {',
    ':global(html.rq-dark) .mute-after-panel {',
  ]) {
    assert.match(会后源码, new RegExp(转义(选择器)), `会后组件应持有 ${选择器}`);
    assert.doesNotMatch(App源码, new RegExp(转义(选择器)), `App 不应再持有 ${选择器}`);
  }
  assert.match(会后源码, /@media \(max-width: 540px\)[\s\S]*?\.mute-after-heading/, '会后组件应持有 540px heading 规则');
  assert.match(会后源码, /\.mute-free-actions \.btn \{/, '会后组件应持有 mobile .mute-free-actions .btn');
  // App 只保留 dock/phone keyframe 与 parent 跨布局例外
  for (const 保留 of [
    '.dock.mute-meeting-dock {',
    '.dock-btn.meeting-live {',
    '.dock-btn.meeting-frozen {',
    '@keyframes mute-phone-breathe {',
    '.story-wrap.story-mute-meeting .story {',
  ]) {
    assert.match(App源码, new RegExp(转义(保留)), `App 应保留 ${保留}`);
  }
  assert.doesNotMatch(App源码, /\.mute-prep-footer \.btn \{/, 'App 不再持有 mobile .mute-prep-footer .btn');
});

test('业务契约所有权在 composable：800/1200ms、合格过滤/启动载荷、提示筹备锁、scope 清理；App options 保留事件名与 pull/toast/lockUI 接线', () => {
  assert.match(composable源码, /静音会议筹备timer = setTimeout\([\s\S]*?}, 800\)/, '打开筹备 800ms pull/sync 在 composable');
  assert.match(composable源码, /静音会议筹备timer = setTimeout\([\s\S]*?}, 1200\)/, '发送通知 1200ms pull/sync 在 composable');
  assert.match(composable源码, /pullState\(\)/, 'composable 经 options.pullState 拉取主账');
  assert.match(composable源码, /nextTick\(同步静音会议界面\)/, '同步函数经 nextTick 调用(composable)');
  assert.match(composable源码, /toast\('静音会议最多选择 3 名妻子。'\)/, '最多 3 人提示走 options.toast');
  assert.match(composable源码, /if \(!静音会议候选列表\.value\.find\(项 => 项\.门牌 === 门牌\)\?\.合格\) return;/, '合格过滤在 composable');
  assert.match(composable源码, /startMeeting\(\{[\s\S]*?参与妻: \[\.\.\.静音会议筹备妻\.value\],[\s\S]*?议题: 静音会议筹备议题\.value,[\s\S]*?\}\)/, '启动载荷构造在 composable');
  assert.match(composable源码, /function 处理静音会议提示\(\) \{[\s\S]*?if \(静音会议筹备提交中\.value\) \{/, '提示 listener 筹备锁处理在 composable');
  assert.match(composable源码, /onScopeDispose\(\(\) => \{[\s\S]*?clearTimeout\(静音会议筹备timer\);/, 'scope 销毁清理筹备 timer 在 composable');
  // App options 保留事件名与跨区块接线
  for (const 事件名 of ['人妻公寓:使用静音会议', '人妻公寓:取消静音会议筹备', '人妻公寓:启动静音会议']) {
    assert.match(App源码, new RegExp(转义(事件名)), `App options 仍发 ${事件名}`);
  }
  assert.match(App源码, /pullState: \(\) => \(store as unknown as \{ pull\?: \(\) => void \}\)\.pull\?\.\(\)/, 'App 注入 store pull');
  assert.match(App源码, /toast: 弹提示,/, 'App 注入 toast 为 弹提示');
  assert.match(App源码, /lockMeetingUI: \(\) => \{/, 'App 注入 lockMeetingUI 跨 UI 锁定');
  assert.match(App源码, /submitInteraction: \(payload, recovery\) =>/, 'App 注入互动提交事件接线');
});

test('A1–A7a 边界未回退；源码不引用 dist', () => {
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 仍导入 A1 Icon');
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'App 仍导入 A5a 背包');
  assert.match(App源码, /import ShopPopup from '\.\/components\/商店\.vue';/, 'App 仍导入 A5a 商店');
  assert.match(App源码, /import MapPopup from '\.\/components\/地图\.vue';/, 'App 仍导入 A6a 地图');
  assert.match(App源码, /import \{ useRoomActions \} from '\.\/composables\/useRoomActions';/, 'App 仍导入 A6b useRoomActions');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'App 仍导入 A3 useUIPrefs');
  assert.match(App源码, /import VideoTapeStage from '\.\/components\/录像带舞台\.vue';/, 'App 仍导入 A7a 录像带舞台');
  assert.match(App源码, /import VideoTapeControls from '\.\/components\/录像带操作\.vue';/, 'App 仍导入 A7a 录像带操作');
  assert.match(App源码, /import \{ useVideoTape \} from '\.\/composables\/useVideoTape';/, 'App 仍导入 A7a useVideoTape');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  assert.doesNotMatch(组件源码, /dist\//, '组件不得引用 dist');
});
