/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A8a 拆分（正文卷轴/到场卡/生成中文字 → components/正文卷轴.vue）
// 等价外移，不依赖空格/Prettier 行宽。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8').replace(/\r\n/gu, '\n');
const 组件源码 = readFileSync(new URL('./components/正文卷轴.vue', 客户端目录), 'utf8');
const types源码 = readFileSync(new URL('./types.ts', 客户端目录), 'utf8');
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

/** 组件 props 契约（20 项，含失败残稿展示） */
const 期望props = [
  'veiled',
  'inScene',
  'sending',
  'currentRoom',
  'roomPeople',
  'arrivalTitle',
  'arrivalDescription',
  'arrivalHint',
  'entries',
  'editingFloor',
  'editingText',
  'editingSaving',
  'streamSegments',
  'failedDraftSegments',
  'runtimeStage',
  'waitSeconds',
  'retryAction',
  'avatarFailed',
  'avatarName',
  'avatarImage',
];

/** 组件 emits 契约（9 项，与 spec 一致） */
const 期望emits = [
  'updateEditingText',
  'cancelEdit',
  'saveEdit',
  'openFloorPrompt',
  'openEventPrompt',
  'editEntry',
  'cancelTurn',
  'abandonAndRetry',
  'avatarError',
];

test('组件非空；App 真实 import，Latin-first 标签恰好一次；无反向 App/store/eventEmit/composable/酒馆 API，无 any/Function/as never', () => {
  assert.ok(组件源码.length > 0, '正文卷轴.vue 应为非空文件');
  assert.match(App源码, /import StoryScroll from '\.\/components\/正文卷轴\.vue';/, 'App 应导入 正文卷轴.vue');
  const 模板段 = 提取模板(App源码);
  assert.equal((模板段.match(/<StoryScroll\b/g) || []).length, 1, 'StoryScroll 应恰好挂载一次');
  assert.match(App源码, /ref="正文卷轴"/, 'App 以组件公开接口 ref 挂载 StoryScroll');
  const 组件依赖 = 提取导入specifier(组件源码);
  assert.ok(!组件依赖.some(s => s.includes('App.vue') || s === './App' || s === '../App'), '组件不得反向导入 App');
  assert.ok(!组件依赖.some(s => s.includes('store')), '组件不得导入 store');
  assert.doesNotMatch(组件源码, /eventEmit\(|eventOn\(/, '组件不直连事件总线');
  assert.doesNotMatch(
    组件源码,
    /getChatMessages|setChatMessages|getVariables|getContext|extensionSettings/,
    '组件不调用酒馆 API',
  );
  assert.doesNotMatch(组件源码, /: any|Function|\bas never\b/, '组件不得有 any/Function/as never 逃逸');
});

test('App 不再内联正文卷轴/到场卡/生成中文字；组件持有全部模板、文案、条件、循环、class/title', () => {
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(App源码, /section ref="卷轴容器" class="story"/, 'App 不应再内联卷轴 section');
  assert.doesNotMatch(模板段, /class="arrive"/, 'App 不应再内联到场卡');
  assert.doesNotMatch(模板段, /class="scribing"/, 'App 不应再内联生成中文字');
  assert.doesNotMatch(模板段, /v-for="\(条, i\) in 在幕中 \? 当前幕 : \[\]"/, 'App 不应再内联当前幕条目循环');
  // 组件拥有全部模板/文案/条件/循环/class/title
  const 组件模板 = 提取模板(组件源码);
  assert.match(组件模板, /v-if="!inScene && !sending" class="arrive"/, '到场卡条件与 class');
  assert.match(组件模板, /currentRoom \? 'ARRIVE \/ 到场' : 'HALLWAY \/ 楼道'/, 'ARRIVE/HALLWAY 文案');
  assert.match(组件模板, /class="arrive-mood"/, '到场描写');
  assert.match(组件模板, /v-if="currentRoom && roomPeople\.length" class="arrive-who"/, '有房间且有人才显示头像');
  assert.match(组件模板, /avatarImage\(avatarName\(名\)\)/, '头像图经 avatarName 取');
  assert.match(组件模板, /class="hint"/, '到场提示');
  assert.match(组件模板, /v-for="\(条, i\) in inScene \? entries : \[\]"/, '条目循环只在幕中');
  assert.match(组件模板, /条\.楼 !== undefined && 条\.楼 === editingFloor/, '编辑只在有楼且等于编辑楼');
  assert.match(
    组件模板,
    /:value="editingText"[\s\S]*?:disabled="editingSaving"[\s\S]*?class="edit-area"[\s\S]*?rows="8"/,
    'textarea 值经 prop 回 App，保存中禁用',
  );
  assert.match(组件模板, /:disabled="editingSaving \|\| !editingText\.trim\(\)"/, '保存 disabled 同时看忙态与 trim');
  assert.match(组件模板, /emit\('saveEdit'\)/, '落笔只 emit');
  assert.match(组件模板, /emit\('cancelEdit'\)/, '作罢只 emit');
  assert.match(组件模板, /条\.谁 === '叙事' && 条\.楼 !== undefined && 条\.楼 > 0 && !sending/, '楼层提示词门不变');
  assert.match(组件模板, /title="查看这一回合的提示词"/, '楼层提示词 title');
  assert.match(组件模板, /emit\('openFloorPrompt', 条\.楼\)/, '楼层提示词原楼号 emit');
  assert.match(组件模板, /条\.谁 === '叙事' && 条\.事件提示词 && !sending/, '事件提示词门不变');
  assert.match(组件模板, /title="查看这一拍独立事件的提示词"/, '事件提示词 title');
  assert.match(组件模板, /emit\('openEventPrompt', 条\.事件提示词\)/, '事件提示词原文 emit');
  assert.match(组件模板, /条\.原文 !== undefined && !sending/, '原文存在且非发送才可编辑');
  assert.match(组件模板, /title="改写这一段\(同酒馆的铅笔编辑\)"/, '铅笔编辑 title');
  assert.match(组件模板, /emit\('editEntry', 条\)/, '编辑条目原对象 emit');
  assert.match(组件模板, /class="story-player">▸ \{\{ 条\.文本\[0\] \}\}/, '玩家正文');
  assert.match(组件模板, /class="narr">\{\{ 段 \}\}/, '叙事正文');
  assert.match(组件模板, /v-if="sending" class="story-entry"/, '发送中块');
  assert.match(组件模板, /streamSegments/, '流式段迭代');
  assert.match(组件模板, /runtimeStage \|\| '这一楼正在发生……'/, '运行阶段文案');
  assert.match(组件模板, /waitSeconds/, '等待秒显示');
  assert.match(组件模板, /title="打断,本回合作废"/, '取消 title');
  assert.match(组件模板, /emit\('cancelTurn'\)/, '取消只 emit');
  assert.match(组件模板, /waitSeconds >= 20 && retryAction/, '20 秒后重试门不变');
  assert.match(组件模板, /title="本回合作废，随后用同一句行动重新请求"/, '重试 title');
  assert.match(组件模板, /↻ 放弃并重新生成/, '重试文案');
  assert.match(组件模板, /emit\('abandonAndRetry'\)/, '重试只 emit');
  assert.match(组件模板, /:class="\{ 'story-veiled': veiled \}"/, '组件根把 veiled 映射到 story-veiled');
});

test('20 个 props 与 9 个 emits 强类型完整，App 接线逐项存在；编辑/提示词/头像错误/取消重试原参数回 App', () => {
  const props声明 = 组件源码.match(/defineProps<\{[\s\S]*?\}>\(\)/)?.[0] ?? '';
  const emits声明 = 组件源码.match(/defineEmits<\{[\s\S]*?\}>\(\)/)?.[0] ?? '';
  assert.ok(props声明, '组件应声明 defineProps');
  assert.ok(emits声明, '组件应声明 defineEmits');
  assert.equal((props声明.match(/^ {2}[A-Za-z]+(?=:)/gm) || []).length, 20, 'props 应为 20 项');
  assert.equal((emits声明.match(/^ {2}[A-Za-z]+(?=:)/gm) || []).length, 9, 'emits 应为 9 项');
  for (const 名 of 期望props) {
    assert.match(props声明, new RegExp(`\\b${名}:`), `props 契约应有 ${名}`);
    assert.match(App源码, new RegExp(`:${驼峰转中划线(名)}="`), `App 应接线 :${驼峰转中划线(名)}=`);
  }
  for (const 名 of 期望emits) {
    assert.match(emits声明, new RegExp(`\\b${名}:`), `emits 契约应有 ${名}`);
    assert.match(App源码, new RegExp(`@${驼峰转中划线(名)}="`), `App 应接线 @${驼峰转中划线(名)}=`);
  }
  // 原参数回 App：编辑文本/编辑楼、提示词、头像错误、取消/重试
  assert.match(App源码, /@update-editing-text="编辑文本 = \$event"/, '编辑文本原值回 App');
  assert.match(App源码, /@cancel-edit="取消编辑"/, '作罢走函数级保存门');
  assert.match(App源码, /@save-edit="存编辑"/, '落笔接存编辑');
  assert.match(App源码, /@edit-entry="开编辑"/, '铅笔接开编辑');
  assert.match(App源码, /@open-floor-prompt="打开楼层提示词"/, '楼层提示词接原 handler');
  assert.match(App源码, /@open-event-prompt="打开事件提示词"/, '事件提示词接原 handler');
  assert.match(App源码, /@avatar-error="头像失效\[\$event\] = true"/, '头像错误回失效表');
  assert.match(App源码, /@cancel-turn="取消回合"/, '取消接原 handler');
  assert.match(App源码, /@abandon-and-retry="放弃并重试"/, '重试接原 handler');
  // 头像两函数原样注入
  assert.match(App源码, /:avatar-name="头像名"/, 'avatarName 注入');
  assert.match(App源码, /:avatar-image="头像图"/, 'avatarImage 注入');
  assert.match(types源码, /export interface 卷轴条/, '类型源仍导出 卷轴条');
});

test('defineExpose 公开滚到底；App 原 DOM ref 已删除，改组件公开接口 ref；await nextTick 后调用', () => {
  assert.match(组件源码, /function 滚到底\(\) \{[\s\S]*?scrollTop = 容器\.value\.scrollHeight;[\s\S]*?\}/, '组件滚到底赋值语义');
  assert.match(组件源码, /defineExpose\(\{ 滚到底 \}\)/, '组件公开滚到底');
  assert.doesNotMatch(App源码, /卷轴容器/, 'App 不再持有 DOM ref');
  assert.match(App源码, /type 正文卷轴公开接口 = \{ 滚到底: \(\) => void \};/, 'App 声明公开接口类型');
  assert.match(App源码, /const 正文卷轴 = ref<正文卷轴公开接口 \| null>\(null\);/, 'App 用公开接口类型 ref');
  assert.match(
    App源码,
    /async function 滚到底\(\) \{[\s\S]*?await nextTick\(\);[\s\S]*?正文卷轴\.value\?\.滚到底\(\);[\s\S]*?\}/,
    'App 滚到底 await nextTick 后调用组件公开接口',
  );
});

test('CSS 所有权精确：独占迁入组件、共享/跨布局留在 App；dark/coarse/keyframe/按钮/头像没有丢', () => {
  // 组件持有独占规则
  for (const selector of [
    '.story {',
    '.story.story-veiled {',
    '.arrive {',
    '.arrive b {',
    '.arrive b::after {',
    '.arrive-mood {',
    '.arrive-who {',
    '.scribing {',
    '.scribing > span {',
    '.scribing .retry-now {',
  ]) {
    assert.match(组件源码, new RegExp(转义(selector)), `组件应持有 ${selector}`);
  }
  // 组件复制共享规则（App 因史册/场景条等仍保留）
  for (const selector of [
    '.story-entry {',
    '.story-player {',
    '.narr {',
    '.entry-edit {',
    '.entry-prompt {',
    '.edit-area {',
    '.edit-acts {',
    '.btn {',
    '.btn.mini {',
    '.ui-kicker {',
    '.hint {',
    '.who-chip {',
  ]) {
    assert.match(组件源码, new RegExp(转义(selector)), `组件应复制 ${selector}`);
  }
  assert.match(组件源码, /^\.who-chip img,/m, '组件应复制头像/首字规则');
  assert.match(组件源码, /^\.who-chip em \{/m, '组件应复制 who-chip em');
  assert.match(组件源码, /@media \(hover: none\), \(pointer: coarse\)/, '组件应持有 coarse 规则');
  assert.match(组件源码, /@keyframes card-pop-in/, '组件应复制 card-pop keyframes');
  assert.match(组件源码, /:global\(html\.rq-dark\) \.story \{/, '组件应持有 dark .story 边框');
  assert.match(组件源码, /:global\(html\.rq-dark\) \.edit-area \{/, '组件应持有 dark .edit-area');
  assert.equal((组件源码.match(/^\.arrive-who \{/gm) || []).length, 2, '组件应持有两处 .arrive-who 声明');
  // App 不再持有独占规则
  for (const selector of [
    '.story {',
    '.story.story-veiled {',
    '.arrive {',
    '.arrive b {',
    '.arrive-mood {',
    '.arrive-who {',
    '.scribing {',
    '.scribing > span {',
    '.scribing .retry-now {',
  ]) {
    assert.doesNotMatch(App源码, new RegExp('^' + 转义(selector), 'm'), `App 不应再持有 ${selector}`);
  }
  // App 仍保留共享规则（史册/场景条/地图等消费）
  for (const selector of [
    '.story-entry {',
    '.story-player {',
    '.narr {',
    '.entry-edit {',
    '.entry-prompt {',
    '.edit-area {',
    '.edit-acts {',
    '.btn {',
    '.btn.mini {',
    '.ui-kicker {',
    '.hint {',
    '.who-chip {',
  ]) {
    assert.match(App源码, new RegExp('^' + 转义(selector), 'm'), `App 应保留 ${selector}`);
  }
  assert.match(App源码, /@media \(hover: none\), \(pointer: coarse\)/, 'App 应保留 coarse 规则');
  assert.match(App源码, /@keyframes card-pop-in/, 'App 应保留 card-pop keyframes');
  assert.match(App源码, /:global\(html\.rq-dark\) \.edit-area/, 'App 应保留 dark .edit-area');
  // dark combined selector：只剩 meta/diff，不留 story
  assert.doesNotMatch(App源码, /:global\(html\.rq-dark\) \.story,/, 'dark combined selector 不再含 .story');
  assert.match(App源码, /:global\(html\.rq-dark\) \.meta-row,\n:global\(html\.rq-dark\) \.diff-card \{/, 'dark combined selector 保留 meta/diff');
  // 跨布局/父级规则留在 App
  assert.match(App源码, /^\.story-wrap \{/m, 'App 仍保留 .story-wrap');
  assert.match(App源码, /^\.story-wrap\.story-mute-meeting \.story \{/m, 'App 仍保留会议卷轴上移');
  assert.match(App源码, /^\.story-hide-btn \{/m, 'App 仍保留隐藏正文钮');
});

test('story-wrap/立绘/成人 CG/亲密抽屉/scene-bar/选项/输入/dock 保持原 App 所有权与顺序；useMuteMeeting 与 A1–A7b3 边界不回退', () => {
  const 模板段 = 提取模板(App源码);
  const 立绘位置 = 模板段.indexOf('class="portrait"');
  const 卷轴位置 = 模板段.indexOf('<StoryScroll');
  const 亲密位置 = 模板段.indexOf('class="intimacy-stage-dock"');
  assert.ok(立绘位置 !== -1 && 卷轴位置 !== -1 && 亲密位置 !== -1, '立绘/卷轴/亲密抽屉都应存在');
  assert.ok(立绘位置 < 卷轴位置 && 卷轴位置 < 亲密位置, '立绘在卷轴前、亲密抽屉在卷轴后');
  assert.match(App源码, /'story-special-interaction': 录像带交互幕 \|\| 静音会议交互幕/, 'story-wrap 场景态保持');
  assert.match(App源码, /v-if="!录像带中 && !静音会议交互幕"/, '隐藏正文钮门控保持');
  assert.match(App源码, /^\.portrait \{/m, 'App 仍保留立绘规则');
  assert.match(App源码, /^\.adult-cg-stage \{/m, 'App 仍保留成人 CG 规则');
  assert.match(App源码, /class="who-chip mini"/, 'scene-bar 头像行仍在 App');
  // A8b:行动选项/输入已迁入两个新组件,App 只留 props 接线与完整组合门,组件根自持门控
  assert.match(App源码, /<ActionOptions\b[\s\S]*?:open="显示选项 && !录像带中 && !静音会议交互幕 && !静音会议待散会选择 && !静音会议自由待选择"/, '行动选项接线保持(App 端完整组合门)');
  assert.match(行动选项源码, /v-if="open"\s+class="option-row"/, '行动选项组件拥有根门控');
  assert.match(回合输入源码, /v-if="!videoActive && !formalMeeting"/, '推进时间钮门控在回合输入组件');
  assert.match(App源码, /v-if="!录像带中" class="dock"/, 'dock 门控保持');
  assert.match(App源码, /useMuteMeeting/, 'useMuteMeeting 边界不回退');
  assert.match(App源码, /import MuteMeetingPreparation from '\.\/components\/静音会议筹备\.vue';/, 'A7b1 组件仍挂');
  assert.match(App源码, /import VideoTapeStage from '\.\/components\/录像带舞台\.vue';/, 'A7a 舞台仍挂');
  assert.match(App源码, /import MapPopup from '\.\/components\/地图\.vue';/, 'A6a 地图仍挂');
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'A5a 背包仍挂');
  assert.match(App源码, /import \{ useRoomActions \} from '\.\/composables\/useRoomActions';/, 'A6b composable 仍挂');
});

test('无中文首字符组件 tag；源码不触碰 dist', () => {
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  assert.doesNotMatch(组件源码, /dist\//, '组件不得引用 dist');
});
