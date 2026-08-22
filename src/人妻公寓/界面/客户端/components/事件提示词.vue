<script setup lang="ts">
// 完整提示词弹窗：正常楼读取酒馆 rawPrompt，独立事件读取生成时持久快照；旧记录明确标注只能显示核心段。
import { computed } from 'vue';

const props = defineProps<{ text: string }>();
const emit = defineEmits<{ close: [] }>();
const 是完整快照 = computed(() => props.text.startsWith('【完整提示词快照】'));
</script>

<template>
  <div v-if="text" class="mask" @click.self="emit('close')">
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="complete-prompt-title">
      <button class="sheet-close" type="button" aria-label="关闭完整提示词" @click="emit('close')">✕</button>
      <div id="complete-prompt-title" class="sheet-title">完 整 提 示 词</div>
      <p class="prompt-note">
        {{
          是完整快照
            ? '按生成时的实际请求顺序展示；预设、角色、世界书、历史与注入内容只在当时实际发送时出现。'
            : '这是旧记录：当时只保存了事件核心，缺失的预设内容无法事后还原。'
        }}
      </p>
      <pre class="event-prompt-view" tabindex="0">{{ text }}</pre>
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
.prompt-note {
  margin: 8px 0 0;
  color: var(--ink-soft);
  font-size: 0.76em;
  line-height: 1.55;
}

/* 完整请求可能很长；弹窗只在内部滚动，不截断、不压缩内容。 */
.event-prompt-view {
  max-height: min(68vh, 680px);
  margin: 14px 0 0;
  padding: 16px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--field-bg);
  color: var(--field-text);
  font:
    12px/1.65 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.event-prompt-view:focus-visible {
  outline: 2px solid var(--field-focus);
  outline-offset: 2px;
}
</style>
