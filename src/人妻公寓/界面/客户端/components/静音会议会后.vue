<script setup lang="ts">
// 静音会议会后三块面板(App A7b3 从 App.vue 等价外移)。
// 纯展示/纯 emit：散会名单、会后自由段、最终收尾重试按 props 门控渲染；切换/继续/结束/头像失败只转发。
import type { 静音会议候选门牌 } from '../../../静音会议配置';
import { 户静态表 } from '../../../stageConfig';

defineProps<{
  waitingDismiss: boolean;
  freeWaiting: boolean;
  finishRetry: boolean;
  sending: boolean;
  participants: readonly 静音会议候选门牌[];
  selected: readonly 静音会议候选门牌[];
  selectionLegal: boolean;
  selectionHint: string;
  avatarFailed: Readonly<Record<string, boolean>>;
  avatarImage: (name: string) => string;
}>();

const emit = defineEmits<{
  toggleWife: [room: 静音会议候选门牌];
  continue: [];
  requestEnd: [];
  avatarError: [name: string];
}>();
</script>

<template>
  <section v-if="waitingDismiss && !sending" class="mute-after-panel mute-dismiss-panel">
    <div class="mute-after-heading">
      <span>第 12 拍 · 宣布散会</span>
      <b>丈夫离场后，留下谁？</b>
    </div>
    <p>选择 1 名、2 名或全部参与妻。名单会和你下面的散会总结一起提交，不会提前改写场景。</p>
    <div class="mute-after-wives">
      <button
        v-for="门牌号 in participants"
        :key="门牌号"
        type="button"
        :class="{ on: selected.includes(门牌号) }"
        :aria-pressed="selected.includes(门牌号)"
        @click="emit('toggleWife', 门牌号)"
      >
        <img
          v-if="!avatarFailed[户静态表[门牌号].妻名]"
          :src="avatarImage(户静态表[门牌号].妻名)"
          :alt="户静态表[门牌号].妻名"
          @error="emit('avatarError', 户静态表[门牌号].妻名)"
        />
        <span v-else>{{ 户静态表[门牌号].妻名[0] }}</span>
        <b>{{ 户静态表[门牌号].妻名 }}</b>
        <small>{{ 门牌号 }}</small>
      </button>
    </div>
    <div class="mute-after-count" :class="{ ready: selectionLegal }">
      {{ selectionHint }}
    </div>
  </section>

  <section v-if="freeWaiting && !sending" class="mute-after-panel mute-free-panel">
    <div class="mute-after-heading">
      <span>AFTER HOURS · 会后自由段</span>
      <b>这场会由你决定何时结束</b>
    </div>
    <p>已完成至少三拍会后活动。继续不会设置回合上限；结束会先生成最终收尾，成功后才结算并恢复日常。</p>
    <div class="mute-free-actions">
      <button class="btn" type="button" @click="emit('continue')">继续会后活动</button>
      <button class="btn rite" type="button" @click="emit('requestEnd')">结束本次会议</button>
    </div>
  </section>

  <section v-if="finishRetry && !sending" class="mute-after-panel mute-free-panel">
    <div class="mute-after-heading">
      <span>FINAL PASS · 最终收尾</span>
      <b>上一次收尾没有成功落地</b>
    </div>
    <p>临时状态、演员名单和结算都仍然保留。重新生成成功后才会真正清场并恢复日常。</p>
    <div class="mute-free-actions single">
      <button class="btn rite" type="button" @click="emit('requestEnd')">重新生成最终收尾</button>
    </div>
  </section>
</template>

<style scoped>
/* ═══ 静音会议会后三块面板(App A7b3 从 App 迁出;按钮基线 .btn/.btn.rite 按 scoped 边界复制,值保持) ═══ */

.mute-after-panel {
  flex: none;
  padding: 11px 13px;
  margin: 7px 0;
  background: linear-gradient(135deg, rgba(244, 252, 248, 0.94), rgba(238, 244, 250, 0.94));
  border: 1px solid rgba(76, 151, 124, 0.25);
  border-radius: 15px;
  box-shadow: 0 5px 16px rgba(31, 54, 49, 0.08);
}

.mute-after-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 9px;
}

.mute-after-heading span {
  font: 700 0.64em/1.2 var(--font-mono);
  letter-spacing: 0.07em;
  color: #4a987a;
}

.mute-after-heading b {
  font-size: 0.84em;
  color: var(--ink);
}

.mute-after-panel > p {
  margin: 6px 0 9px;
  font-size: 0.7em;
  line-height: 1.5;
  color: var(--ink-soft);
}

.mute-after-wives {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.mute-after-wives button {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  color: var(--ink-soft);
  text-align: left;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(54, 89, 80, 0.13);
  border-radius: 11px;
  cursor: pointer;
}

.mute-after-wives button.on {
  color: #296c56;
  background: rgba(100, 210, 162, 0.14);
  border-color: rgba(66, 166, 124, 0.5);
}

.mute-after-wives img,
.mute-after-wives button > span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  object-fit: cover;
  background: #e8f0ed;
  border-radius: 50%;
}

.mute-after-wives b {
  overflow: hidden;
  font-size: 0.7em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mute-after-wives small {
  font: 600 0.58em/1 var(--font-mono);
}

.mute-after-count {
  margin-top: 7px;
  font-size: 0.66em;
  color: var(--red);
}

.mute-after-count.ready {
  color: #3b8a6d;
}

.mute-free-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mute-free-actions.single {
  grid-template-columns: 1fr;
}

:global(html.rq-dark) .mute-after-panel {
  background-color: rgba(24, 29, 38, 0.86);
}

/* 会后面板 .btn/.btn.rite 基线(scoped 边界内复制,值保持,不影响 App 通用 .btn) */
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
  .mute-dismiss-panel {
    flex: 1 1 260px;
    min-height: 112px;
    max-height: min(40dvh, 320px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .mute-after-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .mute-after-wives {
    min-height: 0;
    grid-template-columns: 1fr;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 2px;
    scrollbar-width: thin;
    scrollbar-color: rgba(74, 152, 122, 0.42) transparent;
  }

  .mute-free-actions .btn {
    width: 100%;
  }
}
</style>
