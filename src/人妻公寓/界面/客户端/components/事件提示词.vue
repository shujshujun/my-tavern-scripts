<script setup lang="ts">
// 独立事件提示词弹窗：只读 <pre> 展示；业务状态(事件提示词文本/打开事件提示词)与入口按钮留在 App。
defineProps<{ text: string }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div v-if="text" class="mask" @click.self="emit('close')">
    <div class="sheet">
      <button class="sheet-close" @click="emit('close')">✕</button>
      <div class="sheet-title">本 拍 提 示 词</div>
      <pre class="event-prompt-view">{{ text }}</pre>
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
/* 事件提示词只读查看器样式：完整移动自 App.vue */
.event-prompt-view {
  max-height: min(68vh, 680px);
  margin: 14px 0 0;
  padding: 16px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--paper) 92%, transparent);
  color: var(--ink);
  font:
    12px/1.65 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}
</style>
