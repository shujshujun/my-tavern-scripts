<script setup lang="ts">
// 正文卷轴(App A8a 从 App.vue 等价外移):只演当前幕的玻璃阅读卡。
// 纯展示 + 局部滚动 DOM;当前幕/编辑/发送中/提示词等业务状态全部由 App 以 props 注入、以 emits 回传。
// 不得 import App/store/eventEmit/composable,不得调用酒馆 API。
import { ref } from 'vue';
import type { 卷轴条 } from '../types';

defineProps<{
  veiled: boolean;
  inScene: boolean;
  sending: boolean;
  currentRoom: string | null;
  roomPeople: readonly string[];
  arrivalTitle: string;
  arrivalDescription: string;
  arrivalHint: string;
  entries: readonly 卷轴条[];
  editingFloor: number | null;
  editingText: string;
  editingSaving: boolean;
  streamSegments: readonly string[];
  failedDraftSegments: readonly string[];
  runtimeStage: string;
  waitSeconds: number;
  retryAction: string;
  avatarFailed: Readonly<Record<string, boolean>>;
  avatarName: (name: string) => string;
  avatarImage: (name: string) => string;
}>();

const emit = defineEmits<{
  updateEditingText: [text: string];
  cancelEdit: [];
  saveEdit: [];
  openFloorPrompt: [floor: number];
  openEventPrompt: [prompt: string];
  editEntry: [entry: 卷轴条];
  cancelTurn: [];
  abandonAndRetry: [];
  avatarError: [name: string];
}>();

/** 编辑框值经 emit 回 App(App 存的是 ref,组件不自持业务状态) */
function 编辑输入(e: Event) {
  emit('updateEditingText', (e.target as HTMLTextAreaElement).value);
}

// ── 唯一本地 ref:根滚动 DOM,供 App 经公开接口滚到底 ──
const 容器 = ref<HTMLElement | null>(null);

function 滚到底() {
  if (容器.value) 容器.value.scrollTop = 容器.value.scrollHeight;
}
defineExpose({ 滚到底 });
</script>

<template>
  <section ref="容器" class="story" :class="{ 'story-veiled': veiled }">
    <!-- 到场卡:走动后的新场景,给地点一个"开场镜头"(旧正文属于旧场景,隐去) -->
    <div v-if="!inScene && !sending" class="arrive">
      <div class="ui-kicker">{{ currentRoom ? 'ARRIVE / 到场' : 'HALLWAY / 楼道' }}</div>
      <b>{{ arrivalTitle }}</b>
      <p class="arrive-mood">{{ arrivalDescription }}</p>
      <div v-if="currentRoom && roomPeople.length" class="arrive-who">
        <span v-for="名 in roomPeople" :key="名" class="who-chip">
          <img
            v-if="!avatarFailed[avatarName(名)]"
            :src="avatarImage(avatarName(名))"
            :alt="名"
            @error="emit('avatarError', avatarName(名))"
          />
          <b v-else>{{ 名[0] }}</b>
          <em>{{ 名 }}</em>
        </span>
      </div>
      <p class="hint">{{ arrivalHint }}</p>
    </div>
    <div v-for="(条, i) in inScene ? entries : []" :key="i" class="story-entry">
      <template v-if="条.楼 !== undefined && 条.楼 === editingFloor">
        <textarea
          :value="editingText"
          :disabled="editingSaving"
          class="edit-area"
          rows="8"
          @input="编辑输入"
        ></textarea>
        <div class="edit-acts">
          <button class="btn" :disabled="editingSaving || !editingText.trim()" @click="emit('saveEdit')">
            {{ editingSaving ? '落笔中…' : '落笔' }}
          </button>
          <button class="btn" :disabled="editingSaving" @click="emit('cancelEdit')">作罢</button>
        </div>
      </template>
      <template v-else>
        <button
          v-if="条.谁 === '叙事' && 条.楼 !== undefined && 条.楼 > 0 && !sending"
          class="entry-prompt"
          title="查看这一回合的提示词"
          @click="emit('openFloorPrompt', 条.楼)"
        >
          提示词
        </button>
        <button
          v-if="条.谁 === '叙事' && 条.事件提示词 && !sending"
          class="entry-prompt"
          title="查看这一拍独立事件的提示词"
          @click="emit('openEventPrompt', 条.事件提示词)"
        >
          提示词
        </button>
        <button
          v-if="条.原文 !== undefined && !sending"
          class="entry-edit"
          title="改写这一段(同酒馆的铅笔编辑)"
          @click="emit('editEntry', 条)"
        >
          ✎
        </button>
        <p v-if="条.谁 === '玩家'" class="story-player">▸ {{ 条.文本[0] }}</p>
        <template v-else>
          <p v-for="(段, j) in 条.文本" :key="j" class="narr">{{ 段 }}</p>
        </template>
      </template>
    </div>
    <div v-if="!sending && failedDraftSegments.length" class="story-entry failed-draft">
      <small>未完成输出 · 本轮未结算</small>
      <p v-for="(段, j) in failedDraftSegments" :key="'残稿' + j" class="narr">{{ 段 }}</p>
    </div>
    <div v-if="sending" class="story-entry">
      <p v-for="(段, j) in streamSegments" :key="'流' + j" class="narr">{{ 段 }}</p>
      <p class="scribing">
        ✎ {{ runtimeStage || '这一楼正在发生……' }}<span v-if="waitSeconds"> · 已等待 {{ waitSeconds }} 秒</span>
        <button class="btn mini" title="打断,本回合作废" @click="emit('cancelTurn')">取消</button>
        <button
          v-if="waitSeconds >= 20 && retryAction"
          class="btn mini retry-now"
          title="本回合作废，随后用同一句行动重新请求"
          @click="emit('abandonAndRetry')"
        >
          ↻ 放弃并重新生成
        </button>
      </p>
    </div>
  </section>
</template>

<style scoped>
/* ── 卷轴:玻璃阅读卡(正文用衬线,小说质感)(App A8a 从 App 迁入) ── */

.story {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px;
  scrollbar-width: thin;
  scrollbar-color: rgba(38, 169, 244, 0.4) transparent;
  transition: opacity 0.28s ease;
}

/* 隐藏正文:透明度渐隐+穿透点击(层还在,滚动位置不丢);恢复只认按钮 */
.story.story-veiled {
  opacity: 0;
  pointer-events: none;
}

/* 到场卡:走动后的"开场镜头" */
.arrive {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 6px 8px;
  animation: card-pop-in 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.arrive b {
  font-size: 1.08em;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: var(--ink);
}

.arrive b::after {
  content: '';
  display: block;
  width: 40px;
  height: 3px;
  margin-top: 5px;
  border-radius: 2px;
  background: linear-gradient(90deg, rgb(var(--sc-a, 165, 175, 195)), rgb(var(--sc-b, 205, 215, 230)));
}

.arrive-mood {
  margin: 4px 0 0;
  font-family: var(--font-prose);
  font-size: 0.86em;
  line-height: 1.8;
  color: var(--ink-soft);
}

.arrive-who {
  margin: 0;
  font-size: 0.8em;
  font-weight: 700;
  color: var(--pink);
}

.arrive-who {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 14px;
  margin: 8px 0 2px;
}

/* ── 条目(正文与史册共享,App 因史册仍保留;组件自持同值) ── */

.story-entry {
  position: relative;
  margin-bottom: 8px;
  /* 磨砂垫板:背景图放开看,字浮在自己的可读底上(gal 文字框的卷轴版);浓度由设置滑杆控 */
  background: rgba(255, 252, 247, var(--entry-veil, 0.66));
  backdrop-filter: blur(3px);
  border-radius: 10px;
  padding: 4px 10px;
}

.story-player {
  color: var(--blue);
  font-size: 0.86em;
  font-weight: 600;
  margin: 6px 0;
  padding-left: 9px;
  border-left: 3px solid var(--blue);
  border-radius: 1px;
}

.narr {
  font-family: var(--font-prose);
  /* 字色三级:玩家自选 > 主题墨色(rq-dark 自动翻浅) */
  color: var(--prose-ink, var(--prose-default, var(--ink)));
  font-size: var(--prose-size, 0.9em);
  line-height: 1.85;
  margin: 5px 0;
  text-indent: 2em;
}

.failed-draft {
  border: 1px dashed rgba(195, 112, 72, 0.6);
  background: rgba(255, 244, 232, 0.78);
}

.failed-draft > small {
  display: block;
  margin-bottom: 4px;
  color: #9a4d2e;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.scribing {
  color: var(--ink-faint);
  font-size: 0.8em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.scribing > span {
  font-family: var(--font-mono);
  color: var(--ink-soft);
}

.scribing .retry-now {
  color: #fff;
  background: linear-gradient(135deg, var(--pink), #8c73ff);
  border-color: transparent;
}

.entry-edit {
  position: absolute;
  top: -2px;
  right: 0;
  background: none;
  border: none;
  color: var(--ink-faint);
  opacity: 0;
  cursor: pointer;
  font-size: 0.85em;
  transition: opacity 0.2s;
}

.entry-prompt {
  position: absolute;
  z-index: 2;
  top: 1px;
  right: 27px;
  min-width: 56px;
  min-height: 28px;
  padding: 4px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-sheet);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: max(11px, 0.66em);
  font-weight: 700;
  line-height: 1.35;
  opacity: 0;
  cursor: pointer;
  transition:
    opacity 0.2s,
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.entry-prompt::after {
  position: absolute;
  inset: -8px -4px;
  content: '';
}

.story-entry:hover .entry-edit,
.story-entry:hover .entry-prompt,
.entry-prompt:focus-visible {
  opacity: 1;
}

.entry-prompt:focus-visible {
  outline: 2px solid var(--field-focus);
  outline-offset: 2px;
}

.entry-prompt:hover {
  color: var(--ink);
  background: var(--blue-soft);
  border-color: color-mix(in srgb, var(--blue) 56%, var(--line));
}

@media (hover: none), (pointer: coarse) {
  .entry-prompt {
    opacity: 1;
  }
}

.edit-area {
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  color: var(--ink);
  border: 1.5px solid var(--blue);
  border-radius: 10px;
  padding: 6px 8px;
  font-family: var(--font-prose);
  font-size: 0.88em;
  line-height: 1.6;
}

.edit-acts {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

/* ── 按钮:白玻璃胶囊(正文/史册共享基线;App 因其他卡仍保留) ── */

.btn {
  padding: 6px 18px;
  font-family: inherit;
  font-size: 0.92em;
  font-weight: 600;
  color: var(--ink);
  background: var(--glass);
  border: 1px solid var(--line);
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.08);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(38, 169, 244, 0.6);
  box-shadow: 0 8px 20px rgba(38, 169, 244, 0.22);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.42;
  cursor: default;
}

.btn.mini {
  padding: 2px 9px;
  font-size: 0.78em;
}

/* ── 微文案与头像徽章(组件所需;App 因场景条/地图等仍保留同值) ── */

.ui-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  text-transform: uppercase;
}

.hint {
  font-size: 0.8em;
  color: var(--ink-soft);
  margin: 4px 0;
}

.who-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.who-chip img,
.who-chip > b {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 2px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: linear-gradient(160deg, #ffe3ee, #ffd0e2);
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.2);
  color: #d4407a;
  font-size: 0.8em;
  font-style: normal;
}

.who-chip em {
  font-style: normal;
  font-size: 0.82em;
  color: var(--ink-soft);
}

/* 弹卡动画(anime pop;组件复制同值保 scoped 下的到场动画) */
@keyframes card-pop-in {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.94);
  }
}

/* ── 夜间模式(App A8a 迁入的正文专属与共享项;史册共享的 edit-area 由 App 仍保留) ── */

:global(html.rq-dark) .story {
  border-color: rgba(255, 255, 255, 0.08);
}

:global(html.rq-dark) .edit-area {
  background: #2c2e40;
  color: var(--ink);
}
</style>
