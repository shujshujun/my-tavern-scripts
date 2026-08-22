<script setup lang="ts">
// 回合输入(App A8b 从 App.vue 等价外移):游戏输入框、撤回/重演与失败行动重试、推进时间三块连续区域。
// 纯展示 + 纯 emit:可输入/资源/重掷/时段等全部来自 App props,文本经 update:text 回 App,原 handler 一律留在 App。
// 本地只持 textarea DOM ref 与浏览器输入法组合态；经 defineExpose 公开聚焦供 App/useMuteMeeting 调用。
// 不得 import App/store/eventEmit/composable,不得调用酒馆 API。
import { ref } from 'vue';
import Ic from './Icon.vue';

defineProps<{
  open: boolean;
  text: string;
  sending: boolean;
  prefaceWriting: boolean;
  canSubmit: boolean;
  sendLabel: string;
  resourceAllowed: boolean;
  resourceHint: string;
  formalMeeting: boolean;
  canReroll: boolean;
  currentRoom: string | null;
  turnRoom: string | null;
  failedAction: string;
  retryAction: string;
  retrying: boolean;
  variableRegenerationState: '不可用' | '未配置' | '可用' | '进行中' | '已完成';
  videoActive: boolean;
  period: string;
  currentPeriodLabel: string;
  nextPeriodLabel: string;
  decisionMode: 'none' | 'blocked' | 'summary';
}>();

const emit = defineEmits<{
  updateText: [text: string];
  submit: [];
  focus: [];
  blur: [];
  undo: [];
  reroll: [];
  retryFailed: [];
  abandonAndRetry: [];
  regenerateVariables: [];
  advanceTime: [];
}>();

/** 输入事件把文本回 App(App 存 ref,组件不自持业务状态) */
function 更新文本(e: Event) {
  emit('updateText', (e.target as HTMLTextAreaElement).value);
}

/**
 * 中文／日文输入法用 Enter 确认候选时会先触发 keydown；标准 isComposing、Safari 的
 * composition 生命周期与旧 WebView 的 keyCode=229 三路同时失败关闭，避免半截文本被发送。
 */
const 组合输入中 = ref(false);
function 尝试提交(event: KeyboardEvent): void {
  if (event.key !== 'Enter') return;
  if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.isComposing || 组合输入中.value || event.keyCode === 229) return;
  event.preventDefault();
  emit('submit');
}

// ── 本地 DOM ref:textarea,供 App 经公开接口聚焦 ──
const 输入框 = ref<HTMLTextAreaElement | null>(null);

function 聚焦() {
  输入框.value?.focus();
}
defineExpose({ 聚焦 });
</script>

<template>
  <div v-if="open && decisionMode !== 'blocked'" class="quill">
    <textarea
      ref="输入框"
      :value="text"
      :disabled="sending || prefaceWriting"
      rows="2"
      placeholder="你的言行……(Enter 发送,Shift+Enter 换行)"
      @compositionstart="组合输入中 = true"
      @compositionend="组合输入中 = false"
      @keydown="尝试提交"
      @input="更新文本"
      @focus="emit('focus')"
      @blur="emit('blur')"
    ></textarea>
    <button class="btn rite quill-btn" :disabled="sending || prefaceWriting || !canSubmit" @click="emit('submit')">
      {{ sending ? '…' : sendLabel }}
    </button>
    <small v-if="text.trim() && !resourceAllowed" class="resource-lock-hint">
      {{ resourceHint }}
    </small>
  </div>
  <div v-if="decisionMode === 'none' && sending && retryAction" class="generation-recovery-row" aria-live="polite">
    <span>{{ retrying ? '正在停止这一轮…' : '正文卡住或没有写完整？' }}</span>
    <button
      class="btn retry-generation"
      :disabled="retrying"
      title="本回合作废，不结算数值，随后用同一句行动重新请求"
      @click="emit('abandonAndRetry')"
    >
      {{ retrying ? '正在重试…' : '↻ 停止并重试' }}
    </button>
  </div>
  <div v-if="decisionMode === 'none' && failedAction && !sending" class="reroll-row failed-reroll">
    <span>刚才的生成没有完成。</span>
    <button class="btn" title="使用刚才完全相同的行动重新请求" @click="emit('retryFailed')">↻ 重新生成刚才行动</button>
  </div>
  <div
    v-if="
      decisionMode === 'none' &&
      ((!formalMeeting && !failedAction && canReroll && !sending && currentRoom === turnRoom) ||
        variableRegenerationState !== '不可用')
    "
    class="reroll-row"
    aria-live="polite"
  >
    <button
      v-if="!formalMeeting && !failedAction && canReroll && !sending && currentRoom === turnRoom"
      class="btn"
      title="撤回本回合(你的行动与回应),重新措辞"
      @click="emit('undo')"
    >
      ⌫ 撤回
    </button>
    <button
      v-if="!formalMeeting && !failedAction && canReroll && !sending && currentRoom === turnRoom"
      class="btn"
      title="正文不完整时，用同样的行动重新生成"
      @click="emit('reroll')"
    >
      ↻ 正文不完整？重新生成
    </button>
    <button
      v-if="variableRegenerationState !== '不可用'"
      class="btn variable-regenerate"
      :class="{ completed: variableRegenerationState === '已完成' }"
      :disabled="sending || variableRegenerationState !== '可用'"
      title="只重新计算最近一回合的变量，不重新生成正文"
      @click="emit('regenerateVariables')"
    >
      <Ic n="refresh" />
      <span v-if="variableRegenerationState === '进行中'">正在生成变量…</span>
      <span v-else-if="variableRegenerationState === '已完成'">本回合变量已重新生成</span>
      <span v-else-if="variableRegenerationState === '未配置'">请先配置变量模型</span>
      <span v-else>重新生成变量</span>
    </button>
  </div>

  <button
    v-if="decisionMode === 'none' && !videoActive && !formalMeeting"
    class="global-time-advance"
    type="button"
    :disabled="sending || prefaceWriting"
    @click="emit('advanceTime')"
  >
    <Ic n="clock" />
    <span>
      <b>推进时间</b>
      <small v-if="period === '深夜'">请回管理员室或 302 睡觉</small>
      <small v-else>{{ currentPeriodLabel }} → 推进到{{ nextPeriodLabel }}</small>
    </span>
  </button>
</template>

<style scoped>
/* 回合输入(App A8b 从 App 迁出:输入/撤回重演/失败重试/推进时间三块;按钮基线 .btn/.btn.rite
   按 scoped 边界复制,App 因其他消费者仍保留同值) */

.quill {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.quill textarea {
  flex: 1;
  resize: none;
  background: var(--glass);
  color: var(--ink);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 6px 11px;
  font-family: inherit;
  font-size: 0.88em;
  line-height: 1.5;
  box-shadow: inset 0 1px 3px rgba(30, 26, 38, 0.05);
}

.quill textarea:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(38, 169, 244, 0.15);
}

.quill-btn {
  align-self: stretch;
}

.resource-lock-hint {
  flex-basis: 100%;
  margin: -1px 4px 0;
  color: var(--red);
  font-size: 0.66em;
  line-height: 1.35;
}

.reroll-row {
  flex: none;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 6px;
}

.variable-regenerate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--blue);
}

.variable-regenerate :deep(.ic) {
  width: 15px;
  height: 15px;
}

.variable-regenerate.completed {
  color: var(--ink-soft);
}

.generation-recovery-row {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 0.78em;
}

.generation-recovery-row .retry-generation {
  color: #fff;
  background: linear-gradient(135deg, var(--pink), #8c73ff);
  border-color: transparent;
}

.failed-reroll {
  align-items: center;
  color: var(--ink-soft);
  font-size: 0.78em;
}

.global-time-advance {
  flex: none;
  width: 100%;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 7px;
  padding: 8px 16px;
  color: #fff;
  background: linear-gradient(135deg, #ef5e9d, #ca4e90 52%, #8c5eb4);
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 15px;
  box-shadow: 0 7px 18px rgba(174, 62, 124, 0.24);
  font-family: inherit;
  cursor: pointer;
}

/* Ic 是子组件,scoped 下经 :deep 命中其根 svg 保持 28×28 */
.global-time-advance :deep(.ic) {
  width: 28px;
  height: 28px;
}

.global-time-advance span {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.global-time-advance b {
  font-size: 0.91em;
  letter-spacing: 0.1em;
}

.global-time-advance small {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.64em;
}

.global-time-advance:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.global-time-advance:disabled {
  opacity: 0.5;
  cursor: default;
}

/* ── 按钮:白玻璃胶囊,悬停上浮+辉光;rite=粉色主按钮 ── */

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

.btn.rite {
  align-self: center;
  padding: 8px 32px;
  font-size: 0.95em;
  letter-spacing: 0.16em;
  color: #fff;
  background: linear-gradient(180deg, #ff6cab, #ff4f9a);
  border-color: rgba(255, 79, 154, 0.5);
  box-shadow: 0 8px 22px rgba(255, 79, 154, 0.35);
}

.btn.rite:hover:not(:disabled) {
  border-color: rgba(255, 79, 154, 0.85);
  box-shadow: 0 12px 26px rgba(255, 79, 154, 0.42);
}

@media (max-width: 540px) {
  .quill {
    margin-top: 4px;
    gap: 5px;
  }

  .quill textarea {
    font-size: 0.86em;
  }

  .reroll-row {
    gap: 8px;
    margin-top: 4px;
  }

  .reroll-row .btn {
    font-size: 0.76em;
    padding: 4px 12px;
  }

  .generation-recovery-row {
    gap: 7px;
    margin-top: 4px;
    font-size: 0.72em;
  }

  .generation-recovery-row .btn {
    padding: 5px 12px;
    font-size: 0.9em;
  }

  /* 软键盘弹起后把非输入功能收起;.keyboard-open 在 App 根祖先,须用 :global 命中 */
  :global(.keyboard-open .global-time-advance),
  :global(.keyboard-open .reroll-row) {
    display: none;
  }

  :global(.keyboard-open .quill) {
    position: fixed;
    z-index: 100;
    left: 8px;
    right: 8px;
    bottom: calc(var(--keyboard-inset, 43vh) + env(safe-area-inset-bottom, 0px) + 6px);
    box-sizing: border-box;
    margin: 0;
    padding: 7px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-card);
    box-shadow: 0 -8px 28px rgba(30, 26, 38, 0.2);
  }
}
</style>
