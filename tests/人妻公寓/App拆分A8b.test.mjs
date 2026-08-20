/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A8b 拆分（行动选项 → components/行动选项.vue；
// 游戏输入/撤回重演/失败重试/推进时间 → components/回合输入.vue）等价外移。
// App 只留 props 接线与组合门，两组件纯展示/纯 emit，textarea DOM ref 经 defineExpose 公开。
// 不依赖绝对行号/Prettier 行宽。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 行动选项源码 = readFileSync(new URL('./components/行动选项.vue', 客户端目录), 'utf8');
const 回合输入源码 = readFileSync(new URL('./components/回合输入.vue', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const 驼峰转中划线 = s => s.replace(/([A-Z])/g, '-$1').toLowerCase();

/** 回合输入组件 props 契约（20 项：原 17 项 + 生成恢复行动/切换态 + 变量重生成状态） */
const 期望props = [
  'open',
  'text',
  'sending',
  'prefaceWriting',
  'canSubmit',
  'sendLabel',
  'resourceAllowed',
  'resourceHint',
  'formalMeeting',
  'canReroll',
  'currentRoom',
  'turnRoom',
  'failedAction',
  'retryAction',
  'retrying',
  'variableRegenerationState',
  'videoActive',
  'period',
  'currentPeriodLabel',
  'nextPeriodLabel',
];

/** 回合输入组件 emits 契约（10 项：原 8 项 + 生成中停止并重试 + 变量重生成） */
const 期望emits = [
  'updateText',
  'submit',
  'focus',
  'blur',
  'undo',
  'reroll',
  'retryFailed',
  'abandonAndRetry',
  'regenerateVariables',
  'advanceTime',
];

test('两组件非空；App 真实 import、Latin-first 标签各恰好一次；无反向 App/store/eventEmit/composable/酒馆 API，无 any/Function/as never', () => {
  assert.ok(行动选项源码.length > 0, '行动选项.vue 应为非空文件');
  assert.ok(回合输入源码.length > 0, '回合输入.vue 应为非空文件');
  assert.match(App源码, /import ActionOptions from '\.\/components\/行动选项\.vue';/, 'App 应导入 行动选项.vue');
  assert.match(App源码, /import RoundInput from '\.\/components\/回合输入\.vue';/, 'App 应导入 回合输入.vue');
  const 模板段 = 提取模板(App源码);
  assert.equal((模板段.match(/<ActionOptions\b/g) || []).length, 1, 'ActionOptions 应恰好挂载一次');
  assert.equal((模板段.match(/<RoundInput\b/g) || []).length, 1, 'RoundInput 应恰好挂载一次');
  for (const 源 of [行动选项源码, 回合输入源码]) {
    const 依赖 = 提取导入specifier(源);
    assert.ok(!依赖.some(s => s.includes('App.vue') || s === './App' || s === '../App'), '组件不得反向导入 App');
    assert.ok(!依赖.some(s => s.includes('store')), '组件不得导入 store');
    assert.ok(!依赖.some(s => s.includes('composables')), '组件不得 import composable');
    assert.doesNotMatch(源, /eventEmit\(|eventOn\(/, '组件不直连事件总线');
    assert.doesNotMatch(
      源,
      /getChatMessages|setChatMessages|getVariables|getContext|extensionSettings|insertOrAssignVariables/,
      '组件不调用酒馆 API',
    );
    assert.doesNotMatch(源, /: any|\bFunction\b|\bas never\b/, '组件不得有 any/Function/as never 逃逸');
  }
});

test('App 不再内联 option-row/quill/reroll/global-time 模板；两组件拥有完整原模板条件、文案、title、class、图标', () => {
  const App模板 = 提取模板(App源码);
  for (const 标志 of ['class="option-row"', 'class="quill"', 'class="reroll-row"', 'class="global-time-advance"']) {
    assert.doesNotMatch(App模板, new RegExp(转义(标志)), `App 不应再内联 ${标志}`);
  }
  // 行动选项：根/循环/纸条 class/点击只 emit
  const 行动选项模板 = 提取模板(行动选项源码);
  assert.match(行动选项模板, /v-if="open"\s+class="option-row"/, '行动选项根条件与 class');
  assert.match(
    行动选项模板,
    /v-for="\(项, i\) in options" :key="i" class="option-chip gal"/,
    '行动选项循环与 gal 纸条 class',
  );
  assert.match(行动选项模板, /@click="emit\('select', 项\)"/, '行动选项点击只 emit 原字符串');
  assert.match(行动选项模板, /\{\{ 项 \}\}/, '行动选项文案插值');
  assert.match(行动选项源码, /from '\.\.\/assets'/, '行动选项应导入 ../assets');
  assert.match(行动选项源码, /素材基址\}\/界面\/选项条\.webp/, '行动选项纸条底仍拼 素材基址');
  // 回合输入：三块输入区 + 文案/title/class/图标全部在组件
  const 回合输入模板 = 提取模板(回合输入源码);
  assert.match(回合输入模板, /v-if="open" class="quill"/, '输入根条件与 class');
  assert.match(回合输入模板, /rows="2"/, 'textarea rows=2');
  assert.match(回合输入模板, /placeholder="你的言行……\(Enter 发送,Shift\+Enter 换行\)"/, 'placeholder 原样');
  assert.match(回合输入模板, /:disabled="sending \|\| prefaceWriting"/, 'textarea disabled 看 sending/prefaceWriting');
  assert.match(回合输入模板, /@compositionstart="组合输入中 = true"/, '输入法组合开始必须占门');
  assert.match(回合输入模板, /@compositionend="组合输入中 = false"/, '输入法组合结束必须释放门');
  assert.match(回合输入模板, /@keydown="尝试提交"/, 'Enter 统一进入组合输入安全提交函数');
  assert.match(回合输入模板, /@focus="emit\('focus'\)"/, 'focus 只 emit');
  assert.match(回合输入模板, /@blur="emit\('blur'\)"/, 'blur 只 emit');
  assert.match(回合输入模板, /class="btn rite quill-btn"/, '发送按钮 class 保持');
  assert.match(回合输入模板, /:disabled="sending \|\| prefaceWriting \|\| !canSubmit"/, '发送 disabled 三条件');
  assert.match(回合输入模板, /\{\{ sending \? '…' : sendLabel \}\}/, '发送按钮文案');
  assert.match(回合输入模板, /v-if="text\.trim\(\) && !resourceAllowed" class="resource-lock-hint"/, '资源不足提示门');
  assert.match(回合输入模板, /\{\{ resourceHint \}\}/, '资源提示插值');
  assert.match(回合输入模板, /title="撤回本回合\(你的行动与回应\),重新措辞"/, '撤回 title');
  assert.match(回合输入模板, /@click="emit\('undo'\)"/, '撤回只 emit undo');
  assert.match(回合输入模板, /title="正文不完整时，用同样的行动重新生成"/, '正文不完整重生成 title');
  assert.match(回合输入模板, /@click="emit\('reroll'\)"/, '正文重生成只 emit reroll');
  assert.match(回合输入模板, /title="只重新计算最近一回合的变量，不重新生成正文"/, '变量重生成 title');
  assert.match(回合输入模板, /@click="emit\('regenerateVariables'\)"/, '变量重生成只 emit regenerateVariables');
  assert.match(回合输入模板, /<Ic n="refresh" \/>/, '变量重生成使用 refresh 图标');
  assert.match(回合输入模板, />重新生成变量<\/span>/, '变量重生成默认文案');
  assert.match(回合输入模板, /v-if="sending && retryAction" class="generation-recovery-row"/, '生成中固定恢复行');
  assert.match(回合输入模板, /@click="emit\('abandonAndRetry'\)"/, '生成中停止重试只 emit abandonAndRetry');
  assert.match(回合输入模板, /class="reroll-row failed-reroll"/, '失败重试行 class');
  assert.match(回合输入模板, /刚才的生成没有完成。/, '失败文案');
  assert.match(回合输入模板, /title="使用刚才完全相同的行动重新请求"/, '失败重试 title');
  assert.match(回合输入模板, /@click="emit\('retryFailed'\)"/, '失败重试只 emit retryFailed');
  assert.match(回合输入模板, /class="global-time-advance"/, '推进时间按钮 class');
  assert.match(回合输入模板, /type="button"/, '推进时间按钮 type');
  assert.match(回合输入模板, /:disabled="sending \|\| prefaceWriting"/, '推进时间 disabled');
  assert.match(回合输入模板, /<Ic n="clock" \/>/, '推进时间 clock 图标');
  assert.match(回合输入模板, />推进时间<\/b>/, '推进时间主文案');
  assert.match(回合输入模板, /请回管理员室或 302 睡觉/, '深夜文案原样');
  assert.match(回合输入模板, /currentPeriodLabel \}\} → 推进到\{\{ nextPeriodLabel \}\}/, '非深夜时段文案');
  assert.match(回合输入模板, /@click="emit\('advanceTime'\)"/, '推进时间只 emit advanceTime');
});

test('中文／日文输入法确认候选时不提交半截文本，普通 Enter 仍只触发一次提交', () => {
  assert.match(回合输入源码, /const 组合输入中 = ref\(false\)/, '组件保存浏览器组合输入状态');
  assert.match(回合输入源码, /function 尝试提交\(event: KeyboardEvent\)/, '键盘提交必须走显式 handler');
  assert.match(
    回合输入源码,
    /event\.isComposing \|\| 组合输入中\.value \|\| event\.keyCode === 229/,
    '标准 composing、Safari 本地状态与旧 WebView 229 都必须拒绝',
  );
  assert.match(
    回合输入源码,
    /event\.shiftKey \|\| event\.altKey \|\| event\.ctrlKey \|\| event\.metaKey/,
    'Shift+Enter 与其他修饰键保持不提交',
  );
  assert.match(回合输入源码, /event\.preventDefault\(\);\s*emit\('submit'\);/, '合法 Enter 才阻止换行并提交一次');
  assert.doesNotMatch(回合输入源码, /@keydown\.enter\.exact\.prevent="emit\('submit'\)"/, '不得绕过组合输入门直接 emit');
});

test('props/emits 强类型完整，App 逐项接线存在，所有 handler 参数/无参事件保持', () => {
  const 选项props = 行动选项源码.match(/defineProps<\{[\s\S]*?\}>\(\)/)?.[0] ?? '';
  const 选项emits = 行动选项源码.match(/defineEmits<\{[\s\S]*?\}>\(\)/)?.[0] ?? '';
  const 输入props = 回合输入源码.match(/defineProps<\{[\s\S]*?\}>\(\)/)?.[0] ?? '';
  const 输入emits = 回合输入源码.match(/defineEmits<\{[\s\S]*?\}>\(\)/)?.[0] ?? '';
  assert.ok(选项props && 选项emits, '行动选项应声明 props/emits');
  assert.ok(输入props && 输入emits, '回合输入应声明 props/emits');
  assert.equal((选项props.match(/^ {2}[A-Za-z]+(?=:)/gm) || []).length, 2, '行动选项 props 应为 2 项');
  assert.match(选项props, /open: boolean;/, 'open 强类型 boolean');
  assert.match(选项props, /options: readonly string\[\];/, 'options 强类型 readonly string[]');
  assert.equal((选项emits.match(/^ {2}[A-Za-z]+(?=:)/gm) || []).length, 1, '行动选项 emits 应为 1 项');
  assert.match(选项emits, /select: \[option: string\]/, 'select 参数为 string');
  assert.equal((输入props.match(/^ {2}[A-Za-z]+(?=:)/gm) || []).length, 20, '回合输入 props 应为 20 项');
  assert.equal((输入emits.match(/^ {2}[A-Za-z]+(?=:)/gm) || []).length, 10, '回合输入 emits 应为 10 项');
  for (const 名 of 期望props) {
    assert.match(输入props, new RegExp(`\\b${名}:`), `props 契约应有 ${名}`);
  }
  for (const 名 of 期望emits) {
    assert.match(输入emits, new RegExp(`\\b${名}:`), `emits 契约应有 ${名}`);
  }
  for (const 类型 of [
    'currentRoom: string | null;',
    'turnRoom: string | null;',
    'failedAction: string;',
    'sendLabel: string;',
    "variableRegenerationState: '不可用' | '未配置' | '可用' | '进行中' | '已完成';",
    'updateText: [text: string];',
  ]) {
    assert.match(输入props + 输入emits, new RegExp(转义(类型)), `应强类型 ${类型}`);
  }
  // App 接线：行动选项 open/options/select
  assert.match(
    App源码,
    /:open="显示选项 && !录像带中 && !静音会议交互幕 && !静音会议待散会选择 && !静音会议自由待选择"/,
    'App 接线 ActionOptions :open',
  );
  assert.match(App源码, /:options="行动选项"/, 'App 接线 ActionOptions :options');
  assert.match(App源码, /@select="点选项"/, 'App 接线 ActionOptions @select');
  // App 接线：回合输入 20 props
  for (const 名 of 期望props) {
    assert.match(App源码, new RegExp(`:${驼峰转中划线(名)}="`), `App 应接线 :${驼峰转中划线(名)}=`);
  }
  assert.match(App源码, /:text="输入文本"/, '文本 prop 接输入文本');
  assert.match(App源码, /:send-label="发送按钮文案"/, '按钮文案 prop 接 computed');
  assert.match(App源码, /:resource-allowed="当前资源门槛\.可行动"/, '资源门槛只传 primitive');
  assert.match(App源码, /:resource-hint="当前资源门槛\.提示"/, '资源提示只传 primitive');
  // App 接线：回合输入 10 emits 接原 handler / 原值回 App
  assert.match(App源码, /@update-text="输入文本 = \$event"/, '文本原值回 App');
  for (const [事件, handler] of [
    ['submit', '发送'],
    ['focus', '输入聚焦'],
    ['blur', '输入失焦'],
    ['undo', '撤回'],
    ['reroll', '重掷'],
    ['retry-failed', '重试失败行动'],
    ['abandon-and-retry', '放弃并重试'],
    ['regenerate-variables', '发起变量重生成'],
    ['advance-time', '推进固定时段'],
  ]) {
    assert.match(App源码, new RegExp(`@${事件}="${handler}"`), `App 应接线 @${事件} 到 ${handler}`);
  }
});

test('ActionOptions 完整组合门控，组件只映射 open；RoundInput 输入/重掷/失败/变量重生成/时间门控完整', () => {
  const App模板 = 提取模板(App源码);
  assert.match(
    App模板,
    /<ActionOptions\b[\s\S]*?:open="显示选项 && !录像带中 && !静音会议交互幕 && !静音会议待散会选择 && !静音会议自由待选择"/,
    'App 端行动选项完整组合门',
  );
  const 选项模板 = 提取模板(行动选项源码);
  assert.match(选项模板, /v-if="open"\s+class="option-row"/, '组件只按 open 显示');
  assert.doesNotMatch(
    选项模板,
    /显示选项|录像带中|静音会议|点选项|ref\(|computed\(|watch\(/,
    '组件不持有任何门控业务状态',
  );
  const 输入模板 = 提取模板(回合输入源码);
  assert.match(输入模板, /v-if="open" class="quill"/, '输入根 v-if="open"');
  assert.match(
    输入模板,
    /\(!formalMeeting && !failedAction && canReroll && !sending && currentRoom === turnRoom\) \|\|\s+variableRegenerationState !== '不可用'/,
    '快捷入口行在正常重掷可用或变量可重生成时显示',
  );
  assert.match(输入模板, /v-if="failedAction && !sending" class="reroll-row failed-reroll"/, '失败门优先起链');
  assert.match(
    输入模板,
    /v-if="!formalMeeting && !failedAction && canReroll && !sending && currentRoom === turnRoom"/,
    '撤回与正文重生成仍受原正常门控制',
  );
  assert.match(输入模板, /v-if="variableRegenerationState !== '不可用'"/, '变量重生成入口独立常驻，不受正文重掷门影响');
  assert.match(输入模板, /:disabled="sending \|\| variableRegenerationState !== '可用'"/, '变量按钮仅可用态允许点击');
  assert.match(输入模板, /v-if="!videoActive && !formalMeeting"[\s\S]*?class="global-time-advance"/, '推进时间门完整');
  const 失败位置 = 输入模板.indexOf('v-if="failedAction');
  const 重掷位置 = 输入模板.indexOf("variableRegenerationState !== '不可用'");
  const 时间位置 = 输入模板.indexOf('class="global-time-advance"');
  assert.ok(失败位置 >= 0 && 重掷位置 > 失败位置, '失败行动提示位于快捷入口之前');
  assert.ok(时间位置 > 重掷位置, '推进时间按钮在快捷入口之后');
  // 组件内无业务状态派生
  assert.doesNotMatch(
    回合输入源码,
    /\bcomputed\(|\bwatch\(|setTimeout|setInterval|clearTimeout/,
    '组件不含业务状态派生与 timer',
  );
});

test('textarea DOM ref 已从 App 迁出，defineExpose 公开聚焦；App 明确组件 ref 类型；focusInput 调组件公开接口；键盘 handlers 仍留 App 且未改', () => {
  assert.doesNotMatch(App源码, /const 输入框 = ref<HTMLTextAreaElement/, 'App 不再持有 textarea DOM ref');
  assert.doesNotMatch(App源码, /ref="输入框"/, 'App 模板不再直接绑定输入框');
  assert.match(回合输入源码, /const 输入框 = ref<HTMLTextAreaElement \| null>\(null\);/, '组件本地持 textarea ref');
  assert.match(回合输入源码, /function 聚焦\(\) \{\n {2}输入框\.value\?\.focus\(\);\n\}/, '组件聚焦实现');
  assert.match(回合输入源码, /defineExpose\(\{ 聚焦 \}\)/, '组件公开聚焦接口');
  assert.match(App源码, /type 回合输入公开接口 = \{ 聚焦: \(\) => void \};/, 'App 声明公开接口类型');
  assert.match(App源码, /const 回合输入 = ref<回合输入公开接口 \| null>\(null\);/, 'App 用公开接口类型 ref');
  assert.match(提取模板(App源码), /<RoundInput\b[\s\S]*?ref="回合输入"/, 'App 以组件公开接口 ref 挂载 RoundInput');
  assert.match(
    App源码,
    /focusInput: \(\) => \{\n {4}回合输入\.value\?\.聚焦\(\);\n {2}\},/,
    'useMuteMeeting focusInput 调组件公开接口',
  );
  // 键盘 handlers 仍留 App 且未改
  assert.match(
    App源码,
    /function 输入聚焦\(\) \{[\s\S]*?键盘打开\.value = true;[\s\S]*?键盘定位timer/,
    '输入聚焦实现未改',
  );
  assert.match(
    App源码,
    /function 输入失焦\(\) \{[\s\S]*?取消客户端延迟\(键盘定位timer\);[\s\S]*?键盘打开\.value = false;/,
    '输入失焦继续走统一客户端延迟生命周期',
  );
  assert.match(App源码, /function 让输入露出\(\) \{[\s\S]*?--keyboard-inset/, '让输入露出仍设 keyboard-inset');
  assert.match(App源码, /虚拟键盘\?\.boundingRect/, 'VisualViewport 兜底仍在 App');
});

test('CSS 所有权精确：独占规则迁入组件，App 保留共享 option-chip/btn/remaining keyboard selectors；dark/rq-lite/mobile/:deep 完整', () => {
  // App 不再持有独占规则
  for (const selector of [
    '.option-row {',
    '.quill {',
    '.quill textarea:focus {',
    '.quill-btn {',
    '.resource-lock-hint {',
    '.reroll-row {',
    '.failed-reroll {',
    '.global-time-advance {',
    '.global-time-advance :deep(.ic) {',
  ]) {
    assert.doesNotMatch(App源码, new RegExp(转义(selector)), `App 不应再持有 ${selector}`);
  }
  // 行动选项组件持有全套 option-chip（含 rq-lite/rq-dark/mobile/keyboard-open）
  for (const selector of [
    '.option-row {',
    '.option-chip {',
    '.option-chip.gal {',
    '.option-chip.gal:hover:not(:disabled) {',
    '.option-chip:hover:not(:disabled) {',
  ]) {
    assert.match(行动选项源码, new RegExp(转义(selector)), `行动选项应持有 ${selector}`);
  }
  assert.match(行动选项源码, /:global\(html\.rq-lite\) \.option-row/, '行动选项持有 rq-lite option-row');
  assert.match(行动选项源码, /:global\(html\.rq-dark\) \.option-chip\.gal/, '行动选项持有 dark gal');
  assert.match(行动选项源码, /@media \(max-width: 540px\)[\s\S]*?\.option-chip \{/, '行动选项持有 mobile option-chip');
  assert.match(
    行动选项源码,
    /:global\(\.keyboard-open \.option-row\)/,
    '行动选项持有 keyboard-open 隐藏(整条复合选择器进 :global)',
  );
  assert.doesNotMatch(行动选项源码, /:global\(\.keyboard-open\) \.option-row/, '行动选项不得用旧的拆分 :global 形式');
  // 回合输入组件持有输入/重掷/时间全套
  for (const selector of [
    '.quill {',
    '.quill textarea {',
    '.quill textarea:focus {',
    '.quill-btn {',
    '.resource-lock-hint {',
    '.reroll-row {',
    '.failed-reroll {',
    '.global-time-advance {',
    '.global-time-advance :deep(.ic) {',
    '.global-time-advance span {',
    '.global-time-advance b {',
    '.global-time-advance small {',
    '.global-time-advance:disabled {',
    '.btn {',
    '.btn.rite {',
  ]) {
    assert.match(回合输入源码, new RegExp(转义(selector)), `回合输入应持有 ${selector}`);
  }
  assert.match(回合输入源码, /@media \(max-width: 540px\)[\s\S]*?\.quill \{/, '回合输入持有 mobile quill');
  assert.match(
    回合输入源码,
    /:global\(\.keyboard-open \.quill\)/,
    '回合输入持有 keyboard-open quill 固定定位(整条进 :global)',
  );
  assert.doesNotMatch(回合输入源码, /:global\(\.keyboard-open\) \.quill/, '回合输入 quill 不得用旧的拆分 :global 形式');
  assert.match(
    回合输入源码,
    /:global\(\.keyboard-open \.global-time-advance\),[\s\S]*?:global\(\.keyboard-open \.reroll-row\)/,
    '回合输入持有 keyboard-open 隐藏非输入功能(整条进 :global)',
  );
  assert.doesNotMatch(
    回合输入源码,
    /:global\(\.keyboard-open\) \.global-time-advance|:global\(\.keyboard-open\) \.reroll-row/,
    '回合输入不得用旧的拆分 :global 形式',
  );
  assert.match(
    回合输入源码,
    /@media \(max-width: 540px\)[\s\S]*?\.reroll-row \.btn \{/,
    '回合输入持有 mobile reroll 按钮',
  );
  // App 保留共享规则与 remaining keyboard selectors
  assert.match(App源码, /^\.option-chip \{/m, 'App 保留 option-chip(偷窥 peep-card 消费)');
  assert.match(App源码, /^\.option-chip\.gal \{/m, 'App 保留 option-chip.gal(偷窥)');
  assert.match(App源码, /^\.btn \{/m, 'App 保留通用 .btn');
  assert.match(App源码, /^\.btn\.rite \{/m, 'App 保留通用 .btn.rite');
  assert.match(App源码, /:global\(html\.rq-lite\) \.peep-card/, 'App 保留 rq-lite peep-card');
  assert.match(App源码, /:global\(html\.rq-dark\) \.option-chip\.gal/, 'App 保留 dark option-chip.gal(偷窥)');
  assert.match(App源码, /@media \(max-width: 540px\)[\s\S]*? {2}\.option-chip \{/, 'App 保留 mobile option-chip(偷窥)');
  assert.match(
    App源码,
    /\.keyboard-open \.dock,[\s\S]*?\.keyboard-open \.in-room-acts,[\s\S]*?\.keyboard-open \.peep-card \{/,
    'App 保留 remaining keyboard selectors(dock/抽屉根/peep-card);房内动作整体隐藏',
  );
  assert.doesNotMatch(App源码, /\.keyboard-open \.option-row/, 'App keyboard selector 不再含 option-row');
  assert.doesNotMatch(
    App源码,
    /\.keyboard-open \.global-time-advance|\.keyboard-open \.reroll-row/,
    'App keyboard selector 不再含 global-time/reroll',
  );
});

test('scoped 编译回归：keyboard-open 复合选择器整条进 :global 后,真实 compileStyle 产物不含裸 .keyboard-open 规则;时钟 :deep 保持 28×28', async () => {
  // @vue/compiler-sfc 非直接依赖(pnpm isolated 不提升到顶层),借直接依赖 vue 的官方子路径
  // vue/compiler-sfc(CJS 包装,内部 require 同版 @vue/compiler-sfc)对两个组件 scoped style 做真实编译。
  const { createRequire } = await import('node:module');
  const requireSfc = createRequire(import.meta.url);
  const { parse, compileStyle } = requireSfc('vue/compiler-sfc');
  const id = 'data-v-a8b-scoped';
  const 编译scoped样式 = 源码 => {
    const { descriptor } = parse(源码, { filename: 'App拆分A8b-scoped.vue' });
    const 样式块 = descriptor.styles.find(s => s.scoped);
    assert.ok(样式块, 'SFC 应有 scoped style 块');
    return compileStyle({ source: 样式块.content, filename: 'App拆分A8b-scoped.vue', id, scoped: true });
  };
  const 行动选项样式 = 编译scoped样式(行动选项源码);
  const 回合输入样式 = 编译scoped样式(回合输入源码);
  assert.deepEqual(行动选项样式.errors, [], '行动选项 scoped 编译不应有 error');
  assert.deepEqual(回合输入样式.errors, [], '回合输入 scoped 编译不应有 error');
  // 整条复合选择器保留为全局后代选择器,不得退化成裸 .keyboard-open 规则
  assert.match(行动选项样式.code, /\.keyboard-open\s*\.option-row/, '行动选项编译后应命中 .keyboard-open .option-row');
  assert.doesNotMatch(行动选项样式.code, /\.keyboard-open\s*\{/, '行动选项编译后不得出现裸 .keyboard-open 规则');
  for (const 名 of ['.global-time-advance', '.reroll-row', '.quill']) {
    assert.match(
      回合输入样式.code,
      new RegExp(`\\.keyboard-open\\s*\\.${名.slice(1)}`),
      `回合输入编译后应命中 .keyboard-open ${名}`,
    );
  }
  assert.doesNotMatch(回合输入样式.code, /\.keyboard-open\s*\{/, '回合输入编译后不得出现裸 .keyboard-open 规则');
  // 时钟图标 :deep(.ic) 仍经 scoped 属性命中且保持 28×28
  assert.match(
    回合输入样式.code,
    /\.global-time-advance\[data-v-[^\]]*\]\s*\.ic/,
    '时钟 :deep(.ic) 编译后仍命中子组件图标',
  );
  assert.match(回合输入样式.code, /width:\s*28px;\s*height:\s*28px;/, '时钟图标 28×28 保持');
});

test('两个新组件在原相对顺序；A1–A8a 边界不回退；无中文首字符 tag；不引用 dist', () => {
  const 模板段 = 提取模板(App源码);
  const 选项位置 = 模板段.indexOf('<ActionOptions');
  const 录像带位置 = 模板段.indexOf('<VideoTapeControls');
  const 输入位置 = 模板段.indexOf('<RoundInput');
  const 会后位置 = 模板段.indexOf('<MuteMeetingAfter');
  const dock位置 = 模板段.indexOf('<nav v-if="!录像带中" class="dock"');
  assert.ok(
    选项位置 !== -1 && 录像带位置 !== -1 && 输入位置 !== -1 && 会后位置 !== -1 && dock位置 !== -1,
    '五锚点都应存在',
  );
  assert.ok(选项位置 < 录像带位置, 'ActionOptions 在 VideoTapeControls 前');
  assert.ok(输入位置 > 会后位置, 'RoundInput 在 MuteMeetingAfter 后');
  assert.ok(输入位置 < dock位置, 'RoundInput 在 dock 前');
  // A1–A8a 边界不回退
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'A1 Icon 仍在');
  assert.match(App源码, /import StoryScroll from '\.\/components\/正文卷轴\.vue';/, 'A8a StoryScroll 仍在');
  assert.match(App源码, /import MuteMeetingAfter from '\.\/components\/静音会议会后\.vue';/, 'A7b3 会后组件仍在');
  assert.match(App源码, /import VideoTapeControls from '\.\/components\/录像带操作\.vue';/, 'A7a 录像带操作仍在');
  assert.match(App源码, /import MuteMeetingPreparation from '\.\/components\/静音会议筹备\.vue';/, 'A7b1 筹备组件仍在');
  assert.match(App源码, /import MapPopup from '\.\/components\/地图\.vue';/, 'A6a 地图仍在');
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'A5a 背包仍在');
  assert.match(App源码, /import \{ useRoomActions \} from '\.\/composables\/useRoomActions';/, 'A6b composable 仍在');
  assert.match(App源码, /import \{ useMuteMeeting \} from '\.\/composables\/useMuteMeeting';/, 'A7b2 composable 仍在');
  assert.match(App源码, /import VideoTapeStage from '\.\/components\/录像带舞台\.vue';/, 'A7a 舞台仍在');
  // 无中文首字符组件 tag；不触碰 dist
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  for (const 源 of [行动选项源码, 回合输入源码]) {
    assert.doesNotMatch(源, /dist\//, '组件不得引用 dist');
  }
});
