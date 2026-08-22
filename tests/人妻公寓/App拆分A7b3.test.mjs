/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A7b3 拆分（静音会议运行/互动/锁定/会后四块 UI 与专属 CSS
// → components/静音会议舞台.vue、静音会议互动.vue、静音会议锁定提示.vue、静音会议会后.vue）
// 等价外移：App 仍持有 useMuteMeeting 唯一状态机、事件总线接线与跨布局门控，四组件纯展示/纯 emit。
// 不依赖绝对行号/Prettier 行宽。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const composable源码 = readFileSync(new URL('./composables/useMuteMeeting.ts', 客户端目录), 'utf8');
const 舞台源码 = readFileSync(new URL('./components/静音会议舞台.vue', 客户端目录), 'utf8');
const 互动源码 = readFileSync(new URL('./components/静音会议互动.vue', 客户端目录), 'utf8');
const 锁定源码 = readFileSync(new URL('./components/静音会议锁定提示.vue', 客户端目录), 'utf8');
const 会后源码 = readFileSync(new URL('./components/静音会议会后.vue', 客户端目录), 'utf8');
const 行动选项源码 = readFileSync(new URL('./components/行动选项.vue', 客户端目录), 'utf8');
const 回合输入源码 = readFileSync(new URL('./components/回合输入.vue', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('四文件非空；App 真实导入四组件且 Latin-first 标签各恰好一次；无反向依赖与逃逸类型', () => {
  for (const 源 of [舞台源码, 互动源码, 锁定源码, 会后源码]) {
    assert.ok(源.length > 0, 'A7b3 组件应为非空文件');
  }
  for (const [别名, 文件名] of [
    ['MuteMeetingStage', '静音会议舞台'],
    ['MuteMeetingInteraction', '静音会议互动'],
    ['MuteMeetingLockNote', '静音会议锁定提示'],
    ['MuteMeetingAfter', '静音会议会后'],
  ]) {
    assert.match(App源码, new RegExp(转义(`import ${别名} from './components/${文件名}.vue';`)), `App 应导入 ${别名}`);
    const 模板段 = 提取模板(App源码);
    assert.strictEqual((模板段.match(new RegExp(`<${别名}\\b`, 'g')) ?? []).length, 1, `App 模板应恰好渲染一次 ${别名}`);
  }
  for (const 源 of [舞台源码, 互动源码, 锁定源码, 会后源码]) {
    const 依赖 = 提取导入specifier(源);
    assert.ok(!依赖.some(s => s.includes('App.vue') || s === './App' || s === '../App'), '组件不得反向导入 App');
    assert.ok(!依赖.some(s => s.includes('store')), '组件不得导入 store');
    assert.ok(!依赖.some(s => s.includes('useMuteMeeting')), '组件不得 import composable');
    assert.doesNotMatch(源, /eventEmit\(|eventOn\(/, '组件不直连事件总线');
    assert.doesNotMatch(源, /: any|\bFunction\b|\bas never\b/, '组件不得有 any/Function/as never 逃逸');
  }
});

test('App 四段原模板确实迁出(不只是复制)：关键 DOM/文案/条件/循环/class/aria/pointer modifier 逐项落在对应组件', () => {
  const App模板 = 提取模板(App源码);
  const 舞台模板 = 提取模板(舞台源码);
  const 互动模板 = 提取模板(互动源码);
  const 锁定模板 = 提取模板(锁定源码);
  const 会后模板 = 提取模板(会后源码);
  // App 不再内联任一标志
  for (const 标志 of [
    'mute-meeting-track',
    'mute-meeting-visual',
    'mute-meeting-lock-note',
    'mute-interaction-panel',
    'mute-after-panel',
    'CONTROL GATE',
  ]) {
    assert.doesNotMatch(App模板, new RegExp(转义(标志)), `App 不应再内联 ${标志}`);
  }
  // 舞台：轨道/Transition/图/fallback
  assert.match(舞台模板, /v-if="formal && !interactionOpen" class="mute-meeting-track" role="status"/, '轨道条件与 status');
  assert.match(舞台模板, /MEETING · \{\{ phaseName \}\}/, '轨道阶段名');
  assert.match(舞台模板, /\{\{ shotLabel \}\}/, '拍数文案');
  assert.match(舞台模板, /\{\{ topic \|\| '楼务会议' \}\}/, '议题回退文案');
  assert.match(舞台模板, /<Transition name="fade">/, '组合图过渡保持');
  assert.match(舞台模板, /v-if="visualOpen" class="mute-meeting-visual" :class="`state-\$\{visualState\}`"/, '组合图条件与状态类');
  assert.match(舞台模板, /v-if="imageUrl"/, '图地址条件');
  assert.match(舞台模板, /:key="imageUrl"/, '图 key 保持');
  assert.match(舞台模板, /:alt="`静音会议\$\{visualState\}会场全景`"/, '图 alt 保持');
  assert.match(舞台模板, /draggable="false"/, 'draggable 保持');
  assert.match(舞台模板, /:data-image-url="imageUrl"/, '图片节点携带自身请求身份');
  assert.match(舞台模板, /@load="图片加载成功"/, '加载经请求身份转发');
  assert.match(舞台模板, /@error="图片加载失败"/, '失败经请求身份转发');
  assert.match(舞台模板, /梧桐里公寓 · 管理员室/, 'fallback 文案一');
  assert.match(舞台模板, /楼务会议进行中/, 'fallback 文案二');
  // 互动：根/header/候选/模式/三按钮/结果/重试/补偿
  assert.match(互动模板, /v-if="open"[\s\S]*?class="special-interaction-stage mute-meeting-interaction-stage"[\s\S]*?@contextmenu\.prevent/, '根 v-if 与 contextmenu');
  assert.match(互动模板, /CONTROL GATE \{\{ id \}\}/, 'gate 标签');
  assert.match(互动模板, /\{\{ failureCount \}\}\/3 次失误/, '失败计数');
  assert.match(互动模板, /v-for="门牌号 in participants"/, '候选循环');
  assert.match(互动模板, /\(id === 'B' && bTarget === 门牌号\) \|\|[\s\S]*?\(id === 'C' && focusWife === 门牌号\)/, '选中/点亮条件');
  assert.match(互动模板, /pulse: id === 'C' && litWives\.includes\(门牌号\)/, 'pulse 类');
  assert.match(互动模板, /:disabled="id === 'C' \|\| !pending \|\| !!result"/, '候选 disabled');
  assert.match(互动模板, /:aria-pressed="/, '候选 aria-pressed');
  assert.match(互动模板, /@pointerup\.stop\.prevent="id === 'B' && emit\('bTarget', 门牌号, \$event\)"/, 'B 目标只 emit');
  assert.match(互动模板, /v-if="!avatarFailed\[户静态表\[门牌号\]\.妻名\]"/, '头像回退');
  assert.match(互动模板, /@error="emit\('avatarError', 户静态表\[门牌号\]\.妻名\)"/, '头像失败只 emit');
  assert.match(互动模板, /v-for="模式 in \['集中', '同步'\] as const"/, '模式二选一');
  assert.match(互动模板, /沿用\$\{focusWifeName \|\| '第二档目标'\}/, '集中沿用文案');
  assert.match(互动模板, /\$\{participants\.length\} 名妻子同时加档/, '同步人数文案');
  assert.match(互动模板, /连接全部设备/, 'A 文案');
  assert.match(互动模板, /按下一次，让所有指示灯同时就绪/, 'A 说明');
  assert.match(互动模板, /维持第二档/, 'B 文案');
  assert.match(互动模板, /选中目标后持续按住 2 秒/, 'B 说明');
  assert.match(互动模板, /<i class="hold-progress" \/>/, 'hold 进度条');
  assert.match(互动模板, /连续点击加档/, 'C 文案');
  assert.match(互动模板, /\{\{ tapCount \}\}\/\{\{ tapTarget \}\} · 限时 6 秒/, 'C 计数与限时');
  assert.match(互动模板, /@pointerdown\.stop\.prevent="emit\('aDown', \$event\)"/, 'A down 只 emit');
  assert.match(互动模板, /@pointerup\.stop\.prevent="emit\('aUp', \$event\)"/, 'A up 只 emit');
  assert.match(互动模板, /@pointercancel\.stop\.prevent="emit\('pointerCancel', \$event, true\)"/, 'pointercancel 失败参数');
  assert.match(互动模板, /@pointerleave="emit\('pointerCancel', \$event, true\)"/, 'pointerleave 失败参数');
  assert.match(互动模板, /@pointerdown\.stop\.prevent="emit\('bDown', \$event\)"/, 'B down 只 emit');
  assert.match(互动模板, /@pointerdown\.stop\.prevent="emit\('cDown', \$event\)"/, 'C down 只 emit');
  assert.match(互动模板, /@pointerup\.stop\.prevent="emit\('cUp', \$event\)"/, 'C up 只 emit');
  assert.match(互动模板, /v-if="result" class="mute-interaction-result" :class="result\.类型"/, '本地结果');
  assert.match(互动模板, /\{\{ result\.标题 \}\}/, '结果标题');
  assert.match(互动模板, /v-if="waitingRetry && !sending"/, 'AI 重试门');
  assert.match(互动模板, /重新生成交互后的下一拍/, '重试文案');
  assert.match(互动模板, /v-if="pending && recoveryAvailable && !result"/, '补偿门');
  assert.match(互动模板, /使用自动通过 · 不改变剧情结果/, '补偿文案');
  assert.match(互动模板, /:disabled="\(id === 'B' && !bTarget\) \|\| \(id === 'C' && !cMode\)"/, '补偿缺目标 disabled');
  // 锁定提示
  assert.match(锁定模板, /v-if="open" class="mute-meeting-lock-note" role="status"/, '锁定提示条件与 status');
  assert.match(锁定模板, /<Ic n="lock" \/>/, '锁定图标');
  assert.match(锁定模板, /会场已锁定/, '锁定文案');
  assert.match(锁定模板, /会议进行中，无法离开管理员室；手机会在允许的拍间保持可用。/, '锁定完整说明');
  // 会后
  assert.match(会后模板, /v-if="waitingDismiss && !sending" class="mute-after-panel mute-dismiss-panel"/, '散会面板门');
  assert.match(会后模板, /第 12 拍 · 宣布散会/, '散会题头');
  assert.match(会后模板, /v-for="门牌号 in participants"/, '散会名单循环');
  assert.match(会后模板, /:class="\{ on: selected\.includes\(门牌号\) \}"/, '散会选中类');
  assert.match(会后模板, /:aria-pressed="selected\.includes\(门牌号\)"/, '散会 aria');
  assert.match(会后模板, /@click="emit\('toggleWife', 门牌号\)"/, '切换妻只 emit');
  assert.match(会后模板, /@error="emit\('avatarError', 户静态表\[门牌号\]\.妻名\)"/, '会后头像失败只 emit');
  assert.match(会后模板, /:class="\{ ready: selectionLegal \}"/, '合法计数类');
  assert.match(会后模板, /\{\{ selectionHint \}\}/, '选择提示');
  assert.match(会后模板, /v-if="freeWaiting && !sending" class="mute-after-panel mute-free-panel"/, '自由段面板门');
  assert.match(会后模板, /AFTER HOURS · 会后自由段/, '自由段题头');
  assert.match(会后模板, /@click="emit\('continue'\)"/, '继续活动只 emit');
  assert.match(会后模板, /@click="emit\('requestEnd'\)"/, '结束只 emit');
  assert.match(会后模板, /v-if="finishRetry && !sending" class="mute-after-panel mute-free-panel"/, '收尾面板门');
  assert.match(会后模板, /FINAL PASS · 最终收尾/, '收尾题头');
  assert.match(会后模板, /重新生成最终收尾/, '收尾按钮文案');
});

test('静音会议旧组合图的迟到 load/error 只处理自己的 URL，不得改写新拍回退序号', () => {
  assert.match(舞台源码, /imageLoad: \[imageUrl: string\]/, 'load 必须携带真实请求 URL');
  assert.match(舞台源码, /imageError: \[imageUrl: string\]/, 'error 必须携带真实请求 URL');
  assert.match(舞台源码, /dataset\.imageUrl/, '回调必须读取 DOM 自身身份而非已经切换的新 prop');
  assert.match(
    composable源码,
    /function 静音会议图加载成功\(加载地址: string\)[\s\S]{0,120}加载地址 !== 静音会议当前图地址\.value[\s\S]{0,80}return/,
    '旧图 load 不得认领当前画面',
  );
  assert.match(
    composable源码,
    /function 静音会议图加载失败\(失败地址: string\)[\s\S]{0,120}失败地址 !== 静音会议当前图地址\.value[\s\S]{0,80}return/,
    '旧图 error 不得推进当前图的回退序号',
  );
});

test('舞台 props/emits 完整且 App 接线一一对应；track/Transition/image/fallback 完整；只展示、无状态', () => {
  const 舞台props = 舞台源码.slice(舞台源码.indexOf('defineProps<{'), 舞台源码.indexOf('}>()', 舞台源码.indexOf('defineProps<{')));
  for (const 字段 of ['formal', 'interactionOpen', 'phaseName', 'shotLabel', 'topic', 'visualOpen', 'visualState', 'imageUrl']) {
    assert.match(舞台props, new RegExp(`\\b${字段}:`), `舞台 props 应含 ${字段}`);
  }
  assert.match(舞台props, /visualState: 静音会议画面状态;/, 'visualState 强类型为 静音会议画面状态');
  const 舞台emits = 舞台源码.slice(舞台源码.indexOf('defineEmits<{'), 舞台源码.indexOf('}>();', 舞台源码.indexOf('defineEmits<{')));
  for (const 事件 of ['imageLoad', 'imageError']) {
    assert.match(舞台emits, new RegExp(`\\b${事件}: \\[imageUrl: string\\]`), `舞台 emits 应携带 ${事件} 请求 URL`);
  }
  const App模板 = 提取模板(App源码);
  const 接线 = [
    ':formal="静音会议正式中"',
    ':interaction-open="静音会议交互幕"',
    ':phase-name="静音会议阶段短名"',
    ':shot-label="静音会议拍数文案"',
    ':topic="静音会议场景.议题"',
    ':visual-open="静音会议显示组合图"',
    ':visual-state="静音会议画面状态"',
    ':image-url="静音会议当前图地址"',
    '@image-load="静音会议图加载成功"',
    '@image-error="静音会议图加载失败"',
  ];
  for (const 段 of 接线) assert.match(App模板, new RegExp(转义(段)), `App 舞台接线应含 ${段}`);
  assert.match(提取模板(舞台源码), /<Transition name="fade">/, 'Transition 在组件内');
  assert.doesNotMatch(舞台源码, /setTimeout|setInterval|clearTimeout|\bcomputed\(|\bref\(|\bwatch\(/, '舞台组件不含 timer/状态派生');
});

test('互动全部 props/emits 与 App handler 接线完整；B/C 候选与模式、A/B/C pointer、2 秒/6 秒文案、结果/AI 重试/补偿门完整；只展示/emit、无 ref/watch/timer', () => {
  const 互动props = 互动源码.slice(互动源码.indexOf('defineProps<{'), 互动源码.indexOf('}>()', 互动源码.indexOf('defineProps<{')));
  for (const 字段 of ['open', 'id', 'failureCount', 'title', 'copy', 'participants', 'bTarget', 'focusWife', 'litWives', 'pending', 'result', 'cMode', 'focusWifeName', 'holding', 'tapCount', 'tapTarget', 'waitingRetry', 'sending', 'recoveryAvailable', 'avatarFailed', 'avatarImage']) {
    assert.match(互动props, new RegExp(`\\b${字段}:`), `互动 props 应含 ${字段}`);
  }
  for (const 类型 of ['id: 静音会议互动ID;', 'participants: readonly 静音会议候选门牌[];', 'bTarget: 静音会议候选门牌 | \'\';', 'cMode: 静音会议峰值模式 | \'\';', 'Readonly<Record<string, boolean>>', '(name: string) => string']) {
    assert.match(互动props, new RegExp(转义(类型)), `互动 props 应强类型 ${类型}`);
  }
  assert.match(互动源码, /类型: 'success' \| 'failure';/, 'result 精确判别类型');
  assert.match(互动源码, /interface 静音会议互动结果视图/, 'result 用本地只读 interface');
  const 互动emits = 互动源码.slice(互动源码.indexOf('defineEmits<{'), 互动源码.indexOf('}>();', 互动源码.indexOf('defineEmits<{')));
  for (const 事件 of ['bTarget', 'cMode', 'aDown', 'aUp', 'bDown', 'bUp', 'cDown', 'cUp', 'pointerCancel', 'retry', 'recover', 'avatarError']) {
    assert.match(互动emits, new RegExp(`\\b${事件}:`), `互动 emits 应含 ${事件}`);
  }
  assert.match(互动emits, /bTarget: \[room: 静音会议候选门牌, event: PointerEvent\]/, 'B 目标参数转发');
  assert.match(互动emits, /cMode: \[mode: 静音会议峰值模式, event: PointerEvent\]/, 'C 模式参数转发');
  assert.match(互动emits, /pointerCancel: \[event: PointerEvent, recordFailure: true\]/, '指针取消带失败参数');
  const App模板 = 提取模板(App源码);
  const 接线 = [
    ':open="静音会议交互幕"',
    ':id="静音会议互动id"',
    ':failure-count="静音会议互动失败次数"',
    ':title="静音会议互动标题"',
    ':copy="静音会议互动说明"',
    ':participants="静音会议参与妻"',
    ':b-target="静音会议B目标"',
    ':focus-wife="静音会议场景.重点妻"',
    ':lit-wives="静音会议连点点亮妻"',
    ':pending="静音会议互动待操作"',
    ':result="静音会议互动结果"',
    ':c-mode="静音会议C模式"',
    ':focus-wife-name="静音会议重点妻名"',
    ':holding="静音会议长按中"',
    ':tap-count="静音会议连点计数"',
    ':tap-target="静音会议连点目标"',
    ':waiting-retry="静音会议等待AI重试"',
    ':sending="发送中"',
    ':recovery-available="静音会议互动补偿可用"',
    ':avatar-failed="头像失效"',
    ':avatar-image="头像图"',
    '@b-target="选择静音会议B目标"',
    '@c-mode="选择静音会议C模式"',
    '@a-down="静音会议A按下"',
    '@a-up="静音会议A抬起"',
    '@b-down="静音会议B按下"',
    '@b-up="静音会议B抬起"',
    '@c-down="静音会议C按下"',
    '@c-up="静音会议C抬起"',
    '@pointer-cancel="静音会议指针取消"',
    '@retry="重试静音会议互动续拍"',
    '@recover="静音会议互动补偿通过"',
    '@avatar-error="头像失效[$event] = true"',
  ];
  for (const 段 of 接线) assert.match(App模板, new RegExp(转义(段)), `App 互动接线应含 ${段}`);
  assert.match(提取模板(互动源码), /选中目标后持续按住 2 秒/, '2 秒文案');
  assert.match(提取模板(互动源码), /限时 6 秒/, '6 秒文案');
  assert.doesNotMatch(互动源码, /setTimeout|setInterval|clearTimeout|\bcomputed\(|\bref\(|\bwatch\(/, '互动组件不含 timer/状态派生');
});

test('锁定提示与会后 props/emits/门控/头像失败完整；App 接线完整；只展示/emit、无状态', () => {
  const 锁定props = 锁定源码.slice(锁定源码.indexOf('defineProps<{'), 锁定源码.indexOf('}>()', 锁定源码.indexOf('defineProps<{')));
  assert.match(锁定props, /open: boolean;/, '锁定提示 props 仅 open');
  assert.match(提取模板(App源码), new RegExp(转义('<MuteMeetingLockNote :open="静音会议正式中" />')), 'App 锁定提示接线');
  assert.doesNotMatch(锁定源码, /setTimeout|setInterval|clearTimeout|\bcomputed\(|\bref\(|\bwatch\(/, '锁定组件不含状态');
  const 会后props = 会后源码.slice(会后源码.indexOf('defineProps<{'), 会后源码.indexOf('}>()', 会后源码.indexOf('defineProps<{')));
  for (const 字段 of ['waitingDismiss', 'freeWaiting', 'finishRetry', 'sending', 'participants', 'selected', 'selectionLegal', 'selectionHint', 'avatarFailed', 'avatarImage']) {
    assert.match(会后props, new RegExp(`\\b${字段}:`), `会后 props 应含 ${字段}`);
  }
  for (const 类型 of ['participants: readonly 静音会议候选门牌[];', 'selected: readonly 静音会议候选门牌[];', 'Readonly<Record<string, boolean>>', '(name: string) => string']) {
    assert.match(会后props, new RegExp(转义(类型)), `会后 props 应强类型 ${类型}`);
  }
  const 会后emits = 会后源码.slice(会后源码.indexOf('defineEmits<{'), 会后源码.indexOf('}>();', 会后源码.indexOf('defineEmits<{')));
  for (const 事件 of ['toggleWife', 'continue', 'requestEnd', 'avatarError']) {
    assert.match(会后emits, new RegExp(`\\b${事件}:`), `会后 emits 应含 ${事件}`);
  }
  assert.match(会后emits, /toggleWife: \[room: 静音会议候选门牌\]/, 'toggleWife 参数为精确门牌类型');
  const App模板 = 提取模板(App源码);
  const 接线 = [
    ':waiting-dismiss="静音会议待散会选择"',
    ':free-waiting="静音会议自由待选择"',
    ':finish-retry="静音会议收尾待重试"',
    ':sending="发送中"',
    ':participants="静音会议参与妻"',
    ':selected="静音会议会后选择"',
    ':selection-legal="静音会议会后选择合法"',
    ':selection-hint="静音会议会后选择提示"',
    ':avatar-failed="头像失效"',
    ':avatar-image="头像图"',
    '@toggle-wife="切换静音会议会后妻"',
    '@continue="继续静音会议会后活动"',
    '@request-end="请求结束静音会议"',
    '@avatar-error="头像失效[$event] = true"',
  ];
  for (const 段 of 接线) assert.match(App模板, new RegExp(转义(段)), `App 会后接线应含 ${段}`);
  assert.doesNotMatch(会后源码, /setTimeout|setInterval|clearTimeout|\bcomputed\(|\bref\(|\bwatch\(/, '会后组件不含状态');
});

test('CSS 所有权精确：专属规则从 App 删除并进入正确组件；跨布局例外仍在 App；dark/still/mobile/keyframes 没丢；组件具备自身 .btn 或舞台基础', () => {
  // 已迁出的专属规则从 App 删除
  for (const css of [
    '.mute-meeting-track {',
    '.mute-meeting-visual {',
    '.mute-meeting-lock-note {',
    '.mute-meeting-interaction-stage {',
    '.mute-interaction-panel {',
    '.mute-interaction-copy {',
    '.mute-target {',
    '.mute-mode-row {',
    '.mute-control-button {',
    '.hold-progress {',
    '.mute-interaction-result {',
    '.mute-interaction-assist {',
    '.mute-after-panel {',
    '.mute-after-heading {',
    '.mute-after-wives {',
    '.mute-after-count {',
    '.mute-free-actions {',
    '@keyframes mute-hold-progress {',
    '@keyframes mute-target-pulse {',
    '@keyframes mute-visual-turn {',
    '.special-interaction-stage {',
    '.special-interaction-stage img {',
  ]) {
    assert.doesNotMatch(App源码, new RegExp(转义(css)), `App 不应再持有 ${css}`);
  }
  // 各组件持有自身规则
  for (const css of ['.mute-meeting-track {', '.mute-meeting-visual {', '.mute-meeting-visual-fallback {']) {
    assert.match(舞台源码, new RegExp(转义(css)), `舞台组件应持有 ${css}`);
  }
  assert.match(舞台源码, /@keyframes mute-visual-turn/, '舞台组件持有 visual keyframe');
  assert.match(舞台源码, /:global\(html\.rq-still\) \.mute-meeting-visual img/, '舞台组件持有 rq-still visual 减动效');
  assert.match(舞台源码, /@media \(max-width: 540px\)[\s\S]*?\.mute-meeting-track \{/, '舞台组件持有 540px track');
  assert.match(舞台源码, /\.fade-enter-active,[\s\S]*?\.fade-leave-active[\s\S]*?\.fade-enter-from,[\s\S]*?\.fade-leave-to/, '舞台组件补同值 fade 过渡');
  for (const css of ['.special-interaction-stage {', '.special-interaction-stage img {', '.mute-meeting-interaction-stage {', '.mute-interaction-panel {', '.mute-target {', '.mute-control-button {', '.hold-progress {', '.mute-interaction-assist {']) {
    assert.match(互动源码, new RegExp(转义(css)), `互动组件应持有 ${css}`);
  }
  assert.match(互动源码, /@keyframes mute-hold-progress/, '互动组件持有 hold keyframe');
  assert.match(互动源码, /@keyframes mute-target-pulse/, '互动组件持有 target keyframe');
  assert.match(互动源码, /:global\(html\.rq-still\) \.mute-target\.pulse/, '互动组件持有 rq-still target 减动效');
  assert.match(互动源码, /\.mute-control-button\.holding \.hold-progress/, '互动组件持有 holding 进度动效');
  assert.match(互动源码, /@media \(max-width: 540px\)[\s\S]*?\.mute-interaction-panel \{/, '互动组件持有 540px interaction');
  assert.match(互动源码, /\.btn \{[\s\S]*?\.btn\.rite \{/, '互动组件具备自身 .btn/.btn.rite 基线');
  for (const css of ['.mute-meeting-lock-note {', ':global(html.rq-dark) .mute-meeting-lock-note {']) {
    assert.match(锁定源码, new RegExp(转义(css)), `锁定组件应持有 ${css}`);
  }
  for (const css of ['.mute-after-panel {', '.mute-after-wives {', '.mute-free-actions {', ':global(html.rq-dark) .mute-after-panel {']) {
    assert.match(会后源码, new RegExp(转义(css)), `会后组件应持有 ${css}`);
  }
  assert.match(会后源码, /@media \(max-width: 540px\)[\s\S]*?\.mute-after-heading/, '会后组件持有 540px heading');
  assert.match(会后源码, /\.mute-free-actions \.btn \{/, '会后组件持有 540px 按钮');
  assert.match(会后源码, /\.btn \{[\s\S]*?\.btn\.rite \{/, '会后组件具备自身 .btn/.btn.rite 基线');
  // 跨布局例外仍在 App
  for (const css of [
    '.story-wrap.story-special-interaction {',
    '.story-wrap.story-mute-meeting .story {',
    '.dock.mute-meeting-dock {',
    '.dock-btn.meeting-live {',
    '.dock-btn.meeting-frozen {',
    ':global(html.rq-still) .dock-btn.meeting-live {',
    '@keyframes mute-phone-breathe {',
  ]) {
    assert.match(App源码, new RegExp(转义(css)), `App 应保留跨布局例外 ${css}`);
  }
  assert.match(App源码, /\.fade-enter-active,[\s\S]*?\.fade-leave-active/, 'App 保留共享 fade');
  // dark/still 分支没丢：各组件拥有对应 rq-dark / rq-still 覆盖
  assert.match(锁定源码, /html\.rq-dark\) \.mute-meeting-lock-note/, '锁定组件 dark 覆盖');
  assert.match(会后源码, /html\.rq-dark\) \.mute-after-panel/, '会后组件 dark 覆盖');
});

test('useMuteMeeting 未改职责；App 仍只使用其既有 API，story-wrap/dock/正文/选项/输入门控未回退；A1–A7b2 关键组件仍在；无中文首字符 tag；不碰 dist', () => {
  const App模板 = 提取模板(App源码);
  // composable 职责：返回关键 API 仍由 App 解构
  for (const 标识 of ['静音会议交互幕', '静音会议互动结果', '静音会议A按下', '静音会议指针取消', '静音会议画面状态', '静音会议待散会选择', '同步静音会议界面']) {
    assert.match(composable源码, new RegExp(转义(`  ${标识},`)), `composable 仍返回 ${标识}`);
    assert.match(App源码, new RegExp(转义(`${标识},`)), `App 仍解构 ${标识}`);
  }
  assert.match(App源码, /\} = useMuteMeeting\(\{/, 'App 仍调用 useMuteMeeting options');
  // 跨布局门控未回退
  assert.match(App源码, /'story-special-interaction': 录像带交互幕 \|\| 静音会议交互幕/, 'story-wrap 场景态保持');
  assert.match(App源码, /'story-mute-meeting': 静音会议显示组合图/, 'story-mute-meeting 类保持');
  assert.match(App源码, /v-if="!录像带中 && !静音会议交互幕"/, '隐藏正文钮门控保持');
  assert.match(App模板, /<nav v-if="!录像带中 && !前台硬决策中" class="dock"[\s\S]*?:class="\{ 'mute-meeting-dock': 静音会议正式中 \}">/, 'dock nav 在硬决策时让位');
  // A8b:行动选项/游戏输入门控迁入 行动选项.vue / 回合输入.vue,App 只留 props 接线,组件根自持门控
  assert.match(App源码, /:open="显示选项 && !录像带中 && !静音会议交互幕 && !静音会议待散会选择 && !静音会议自由待选择 && !前台硬决策中"/, '行动选项门控保持并避让硬决策');
  assert.match(行动选项源码, /<template v-if="open">/, '行动选项组件根自持 v-if="open"');
  assert.match(App源码, /:open="可输入 && !偷窥决策中"/, '监控硬决策关闭普通输入');
  assert.match(回合输入源码, /v-if="open && decisionMode !== 'blocked'" class="quill"/, '游戏输入组件按决策类型自持门控');
  assert.match(App源码, /:actions="普通房间动作"/, '普通房内动作经抽屉组件消费');
  assert.match(App源码, /:video-tape-active="录像带中"/, '录像带门控接线保持');
  assert.match(App源码, /:suppressed="房内操作抑制 \|\| 前台硬决策中"/, '统一抑制与硬决策接线保持');
  // A1–A7b2 关键组件仍在
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 仍导入 A1 Icon');
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'App 仍导入 A5a 背包');
  assert.match(App源码, /import ShopPopup from '\.\/components\/商店\.vue';/, 'App 仍导入 A5a 商店');
  assert.match(App源码, /import MapPopup from '\.\/components\/地图\.vue';/, 'App 仍导入 A6a 地图');
  assert.match(App源码, /import \{ useRoomActions \} from '\.\/composables\/useRoomActions';/, 'App 仍导入 A6b useRoomActions');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'App 仍导入 A3 useUIPrefs');
  assert.match(App源码, /import VideoTapeStage from '\.\/components\/录像带舞台\.vue';/, 'App 仍导入 A7a 录像带舞台');
  assert.match(App源码, /import VideoTapeControls from '\.\/components\/录像带操作\.vue';/, 'App 仍导入 A7a 录像带操作');
  assert.match(App源码, /import MuteMeetingPreparation from '\.\/components\/静音会议筹备\.vue';/, 'App 仍导入 A7b1 筹备组件');
  assert.doesNotMatch(App模板, /<\/?[一-鿿][^>]*>/, 'App 模板不得有中文首字符 tag');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  for (const 源 of [composable源码, 舞台源码, 互动源码, 锁定源码, 会后源码]) {
    assert.doesNotMatch(源, /dist\//, '模块不得引用 dist');
  }
});
