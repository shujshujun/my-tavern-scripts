<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue';
import Ic from './Icon.vue';

const props = withDefaults(defineProps<{
  label: string;
  hint?: string;
  defaultOpen?: boolean;
  resetKey?: string | number;
  direction?: 'up' | 'down';
}>(), { hint: '', defaultOpen: false, resetKey: '', direction: 'up' });
const 展开 = ref(props.defaultOpen);
const 根 = ref<HTMLElement | null>(null);
const 把手 = ref<HTMLButtonElement | null>(null);
const 面板 = ref<HTMLElement | null>(null);
const id = `stage-panel-${useId()}`;

// 只持有组件展示态；收起保留插槽及其选择、输入和业务状态。
function 收起(恢复焦点 = false): void {
  展开.value = false;
  if (恢复焦点) void nextTick(() => 把手.value?.focus());
}
function 外部按下(event: PointerEvent): void {
  if (event.target instanceof Node && !根.value?.contains(event.target)) 收起();
}
function 按键(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !展开.value) return;
  event.preventDefault();
  event.stopPropagation();
  收起(true);
}
watch(() => props.resetKey, () => {
  const 焦点在面板 = Boolean(面板.value?.contains(document.activeElement));
  展开.value = props.defaultOpen;
  if (焦点在面板 && !展开.value) void nextTick(() => 把手.value?.focus());
});
onMounted(() => document.addEventListener('pointerdown', 外部按下));
onUnmounted(() => document.removeEventListener('pointerdown', 外部按下));
</script>

<template>
  <section ref="根" class="aux-disclosure" :class="{ 'aux-open': 展开, 'aux-down': direction === 'down' }" @keydown="按键">
    <button ref="把手" class="aux-handle" type="button" :aria-expanded="展开" :aria-controls="id" @click="展开 = !展开">
      <Ic n="arrow" />
      <span><b>{{ label }}</b><small v-if="hint">{{ hint }}</small></span>
      <em>{{ 展开 ? '收起' : '展开' }}</em>
    </button>
    <div v-show="展开" :id="id" ref="面板" class="aux-panel" role="region" :aria-label="label" :inert="!展开 || undefined">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.aux-disclosure { position: relative; flex: none; min-width: 0; }
.aux-handle { display: flex; align-items: center; gap: 7px; width: 100%; min-height: 44px; padding: 7px 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper-card, #fff); color: var(--ink, #272230); font: inherit; text-align: left; cursor: pointer; }
.aux-handle :deep(.ic) { flex: none; width: 14px; height: 14px; color: var(--ink-soft); }
.aux-open > .aux-handle :deep(.ic) { transform: rotate(-90deg); }
.aux-handle > span { display: flex; flex: 1; min-width: 0; align-items: baseline; gap: 7px; }
.aux-handle b { overflow: hidden; font-size: 0.78em; text-overflow: ellipsis; white-space: nowrap; }
.aux-handle small { overflow: hidden; color: var(--ink-soft); font-size: 0.68em; text-overflow: ellipsis; white-space: nowrap; }
.aux-handle em { flex: none; color: var(--ink-soft); font-size: 0.68em; font-style: normal; }
.aux-handle:hover { background: var(--glass, #f7f4f8); }
.aux-handle:focus-visible { outline: 2px solid var(--pink, #b33770); outline-offset: 2px; }
.aux-panel { position: absolute; z-index: 28; right: 0; bottom: calc(100% + 5px); left: 0; max-height: min(42dvh, 300px); overflow: auto; overscroll-behavior: contain; padding: 10px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper-card, #fff); color: var(--ink, #272230); box-shadow: var(--card-shadow, 0 6px 20px rgb(30 26 38 / 18%)); scrollbar-width: thin; scrollbar-color: var(--ink-faint) transparent; }
.aux-down > .aux-panel { top: calc(100% + 5px); bottom: auto; }
.aux-panel :deep(img) { max-width: 100%; }
.aux-panel :deep(p) { overflow-wrap: anywhere; }
</style>
