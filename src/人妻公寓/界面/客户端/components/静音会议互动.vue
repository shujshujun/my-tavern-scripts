<script setup lang="ts">
// 静音会议 A/B/C 互动幕(App A7b3 从 App.vue 等价外移)。
// 纯展示/纯 emit：候选与模式选择、A/B/C Pointer 事件、本地结果展示、AI 重试与三败补偿
// 按钮全部按 props 渲染并转发事件；状态机/Pointer capture/长按连点 timer 全部留在 composable。
import Ic from './Icon.vue';
import type { 静音会议互动ID, 静音会议峰值模式 } from '../types';
import type { 静音会议候选门牌 } from '../../../静音会议配置';
import { 户静态表 } from '../../../stageConfig';

/** 本地互动结果只读视图(与 composable 内 ref 类型一致，不 any)。 */
interface 静音会议互动结果视图 {
  类型: 'success' | 'failure';
  标题: string;
  说明: string;
}

defineProps<{
  open: boolean;
  id: 静音会议互动ID;
  failureCount: number;
  title: string;
  copy: string;
  participants: readonly 静音会议候选门牌[];
  bTarget: 静音会议候选门牌 | '';
  focusWife: string;
  litWives: readonly 静音会议候选门牌[];
  pending: boolean;
  result: 静音会议互动结果视图 | undefined;
  cMode: 静音会议峰值模式 | '';
  focusWifeName: string;
  holding: boolean;
  tapCount: number;
  tapTarget: number;
  waitingRetry: boolean;
  sending: boolean;
  recoveryAvailable: boolean;
  avatarFailed: Readonly<Record<string, boolean>>;
  avatarImage: (name: string) => string;
}>();

const emit = defineEmits<{
  bTarget: [room: 静音会议候选门牌, event: PointerEvent];
  cMode: [mode: 静音会议峰值模式, event: PointerEvent];
  aDown: [event: PointerEvent];
  aUp: [event: PointerEvent];
  bDown: [event: PointerEvent];
  bUp: [event: PointerEvent];
  cDown: [event: PointerEvent];
  cUp: [event: PointerEvent];
  pointerCancel: [event: PointerEvent, recordFailure: true];
  retry: [];
  recover: [];
  avatarError: [name: string];
}>();
</script>

<template>
  <div
    v-if="open"
    class="special-interaction-stage mute-meeting-interaction-stage"
    @contextmenu.prevent
  >
    <section class="mute-interaction-panel" :class="`gate-${id.toLowerCase()}`">
      <header>
        <div>
          <span>CONTROL GATE {{ id }}</span>
          <h3>{{ title }}</h3>
        </div>
        <b>{{ failureCount }}/3 次失误</b>
      </header>
      <p class="mute-interaction-copy">{{ copy }}</p>

      <div v-if="id === 'B' || id === 'C'" class="mute-target-row">
        <button
          v-for="门牌号 in participants"
          :key="门牌号"
          type="button"
          class="mute-target"
          :class="{
            on:
              (id === 'B' && bTarget === 门牌号) ||
              (id === 'C' && focusWife === 门牌号),
            pulse: id === 'C' && litWives.includes(门牌号),
          }"
          :disabled="id === 'C' || !pending || !!result"
          :aria-pressed="
            (id === 'B' && bTarget === 门牌号) ||
            (id === 'C' && focusWife === 门牌号)
          "
          @pointerup.stop.prevent="id === 'B' && emit('bTarget', 门牌号, $event)"
        >
          <img
            v-if="!avatarFailed[户静态表[门牌号].妻名]"
            :src="avatarImage(户静态表[门牌号].妻名)"
            :alt="户静态表[门牌号].妻名"
            draggable="false"
            @error="emit('avatarError', 户静态表[门牌号].妻名)"
          />
          <span v-else>{{ 户静态表[门牌号].妻名[0] }}</span>
          <b>{{ 户静态表[门牌号].妻名 }}</b>
          <small>{{ 门牌号 }}</small>
        </button>
      </div>

      <div v-if="id === 'C'" class="mute-mode-row">
        <button
          v-for="模式 in ['集中', '同步'] as const"
          :key="模式"
          type="button"
          :class="{ on: cMode === 模式 }"
          :disabled="!pending || !!result"
          :aria-pressed="cMode === 模式"
          @pointerup.stop.prevent="emit('cMode', 模式, $event)"
        >
          <b>{{ 模式 === '集中' ? '集中一人' : '全体同步' }}</b>
          <small>{{
            模式 === '集中'
              ? `沿用${focusWifeName || '第二档目标'}`
              : `${participants.length} 名妻子同时加档`
          }}</small>
        </button>
      </div>

      <button
        v-if="id === 'A'"
        type="button"
        class="mute-control-button tap"
        :disabled="!pending || !!result"
        @pointerdown.stop.prevent="emit('aDown', $event)"
        @pointerup.stop.prevent="emit('aUp', $event)"
        @pointercancel.stop.prevent="emit('pointerCancel', $event, true)"
        @pointerleave="emit('pointerCancel', $event, true)"
      >
        <Ic n="ops" />
        <span><b>连接全部设备</b><small>按下一次，让所有指示灯同时就绪</small></span>
      </button>

      <button
        v-else-if="id === 'B'"
        type="button"
        class="mute-control-button hold"
        :class="{ holding }"
        :disabled="!pending || !bTarget || !!result"
        @pointerdown.stop.prevent="emit('bDown', $event)"
        @pointerup.stop.prevent="emit('bUp', $event)"
        @pointercancel.stop.prevent="emit('pointerCancel', $event, true)"
        @pointerleave="emit('pointerCancel', $event, true)"
      >
        <i class="hold-progress" />
        <Ic n="ops" />
        <span><b>维持第二档</b><small>选中目标后持续按住 2 秒</small></span>
      </button>

      <button
        v-else
        type="button"
        class="mute-control-button rapid"
        :disabled="!pending || !cMode || !!result"
        @pointerdown.stop.prevent="emit('cDown', $event)"
        @pointerup.stop.prevent="emit('cUp', $event)"
        @pointercancel.stop.prevent="emit('pointerCancel', $event, true)"
        @pointerleave="emit('pointerCancel', $event, true)"
      >
        <Ic n="ops" />
        <span
          ><b>连续点击加档</b><small>{{ tapCount }}/{{ tapTarget }} · 限时 6 秒</small></span
        >
      </button>

      <div v-if="result" class="mute-interaction-result" :class="result.类型">
        <b>{{ result.标题 }}</b>
        <span>{{ result.说明 }}</span>
      </div>
      <button
        v-if="waitingRetry && !sending"
        type="button"
        class="btn rite mute-interaction-assist"
        @pointerup.stop.prevent="emit('retry')"
      >
        重新生成交互后的下一拍
      </button>
      <button
        v-if="pending && recoveryAvailable && !result"
        type="button"
        class="btn rite mute-interaction-assist"
        :disabled="(id === 'B' && !bTarget) || (id === 'C' && !cMode)"
        @pointerup.stop.prevent="emit('recover')"
      >
        使用自动通过 · 不改变剧情结果
      </button>
    </section>
  </div>
</template>

<style scoped>
/* ═══ 静音会议 A/B/C 互动幕(App A7b3 从 App 迁出;录像带舞台与本次组件各按 scoped 边界自持
   .special-interaction-stage 基础两段,App 不再保留) ═══ */

.special-interaction-stage {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0d1117;
}

.special-interaction-stage img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.mute-meeting-interaction-stage {
  z-index: 12;
  padding: 9px;
  background:
    linear-gradient(rgba(5, 12, 17, 0.86), rgba(5, 12, 17, 0.94)),
    radial-gradient(circle at 50% 12%, rgba(66, 156, 124, 0.28), transparent 58%);
}

.mute-interaction-panel {
  box-sizing: border-box;
  width: min(100%, 700px);
  max-height: calc(100% - 2px);
  padding: 17px;
  overflow: auto;
  color: #eef8f5;
  background: linear-gradient(145deg, rgba(20, 35, 40, 0.96), rgba(10, 20, 27, 0.98));
  border: 1px solid rgba(125, 211, 173, 0.42);
  border-radius: 18px;
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overscroll-behavior: contain;
}

.mute-interaction-panel header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mute-interaction-panel header span {
  display: block;
  margin-bottom: 3px;
  font: 700 0.62em/1.2 var(--font-mono);
  letter-spacing: 0.12em;
  color: #76d8aa;
}

.mute-interaction-panel h3 {
  margin: 0;
  font-size: 1.16em;
  letter-spacing: 0.04em;
}

.mute-interaction-panel header > b {
  flex: none;
  padding: 5px 8px;
  font: 700 0.62em/1 var(--font-mono);
  color: rgba(238, 248, 245, 0.7);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.mute-interaction-copy {
  margin: 9px 0 12px;
  font-size: 0.78em;
  line-height: 1.55;
  color: rgba(231, 245, 241, 0.72);
}

.mute-target-row {
  display: flex;
  justify-content: center;
  gap: 9px;
  margin-bottom: 11px;
}

.mute-target {
  position: relative;
  width: 74px;
  display: grid;
  justify-items: center;
  gap: 3px;
  padding: 7px 5px;
  color: rgba(234, 246, 242, 0.72);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 13px;
  cursor: pointer;
  touch-action: manipulation;
}

.mute-target img,
.mute-target > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  object-fit: cover;
  background: #25343a;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.mute-target b {
  font-size: 0.72em;
}

.mute-target small {
  font: 600 0.58em/1 var(--font-mono);
  color: rgba(234, 246, 242, 0.5);
}

.mute-target.on {
  color: #fff;
  background: rgba(87, 196, 148, 0.14);
  border-color: #67d5a3;
  box-shadow: 0 0 0 2px rgba(103, 213, 163, 0.12);
}

.mute-target.on img,
.mute-target.on > span {
  border-color: #75e0af;
}

.mute-target.pulse {
  animation: mute-target-pulse 0.42s ease both;
}

.mute-target:disabled {
  cursor: default;
  opacity: 0.7;
}

.mute-mode-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 11px;
}

.mute-mode-row button {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  color: rgba(235, 247, 243, 0.75);
  text-align: left;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  cursor: pointer;
  touch-action: manipulation;
}

.mute-mode-row button.on {
  color: #fff;
  background: rgba(194, 102, 151, 0.16);
  border-color: #d47ead;
}

.mute-mode-row b {
  font-size: 0.76em;
}

.mute-mode-row small {
  color: inherit;
  font-size: 0.64em;
  opacity: 0.7;
}

.mute-control-button {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 15px 18px;
  overflow: hidden;
  color: #f6fffb;
  text-align: left;
  background: linear-gradient(135deg, #397d65, #245848);
  border: 1px solid rgba(156, 238, 201, 0.6);
  border-radius: 15px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.mute-control-button.rapid {
  background: linear-gradient(135deg, #88506f, #5f3953);
  border-color: rgba(240, 160, 201, 0.58);
}

.mute-control-button :deep(.ic) {
  position: relative;
  z-index: 1;
  width: 30px;
  height: 30px;
  flex: none;
}

.mute-control-button span {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mute-control-button b {
  font-size: 0.9em;
}

.mute-control-button small {
  color: rgba(246, 255, 251, 0.7);
  font-size: 0.66em;
}

.mute-control-button:disabled {
  cursor: not-allowed;
  filter: grayscale(0.5);
  opacity: 0.46;
}

.hold-progress {
  position: absolute;
  inset: auto 0 0;
  height: 5px;
  background: #9cf1c8;
  transform: scaleX(0);
  transform-origin: left;
}

.mute-control-button.holding .hold-progress {
  animation: mute-hold-progress 2s linear forwards;
}

.mute-interaction-result {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 11px;
  margin-top: 10px;
  font-size: 0.72em;
  border: 1px solid;
  border-radius: 11px;
}

.mute-interaction-result.success {
  color: #baf4d7;
  background: rgba(64, 175, 126, 0.12);
  border-color: rgba(105, 224, 166, 0.38);
}

.mute-interaction-result.failure {
  color: #ffd3d3;
  background: rgba(201, 76, 76, 0.12);
  border-color: rgba(235, 114, 114, 0.36);
}

.mute-interaction-result span {
  color: inherit;
  opacity: 0.78;
}

.mute-interaction-assist {
  width: 100%;
  margin-top: 9px;
}

:global(html.rq-still) .mute-target.pulse,
:global(html.rq-still) .mute-control-button.holding .hold-progress {
  animation: none;
}

@keyframes mute-hold-progress {
  to {
    transform: scaleX(1);
  }
}

@keyframes mute-target-pulse {
  50% {
    transform: translateY(-3px) scale(1.04);
    box-shadow: 0 0 18px rgba(108, 226, 172, 0.5);
  }
}

/* 互动幕两个自动通过/重试按钮需要 .btn/.btn.rite 基线(scoped 边界内复制,值保持,不影响 App 通用 .btn) */
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
  .mute-interaction-panel {
    padding: 13px;
    border-radius: 15px;
  }

  .mute-interaction-copy {
    margin-bottom: 9px;
  }

  .mute-target-row {
    gap: 6px;
  }

  .mute-target {
    width: min(27%, 72px);
    padding: 6px 3px;
  }

  .mute-target img,
  .mute-target > span {
    width: 38px;
    height: 38px;
  }

  .mute-control-button {
    padding: 13px 12px;
  }
}
</style>
