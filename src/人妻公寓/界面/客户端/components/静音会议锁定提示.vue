<script setup lang="ts">
// 静音会议会场锁定提示(App A7b3 从 App.vue 等价外移)。
// 纯展示：只在 open 时渲染一条锁定说明，无 emits、无状态。
import Ic from './Icon.vue';

defineProps<{
  open: boolean;
}>();
</script>

<template>
  <div v-if="open" class="mute-meeting-lock-note" role="status">
    <Ic n="lock" />
    <span><b>会场已锁定</b>会议进行中，无法离开管理员室；手机会在允许的拍间保持可用。</span>
  </div>
</template>

<style scoped>
/* ═══ 静音会议会场锁定提示(App A7b3 从 App 迁出) ═══ */

.mute-meeting-lock-note {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 6px 10px;
  margin: 5px 0;
  font: 700 0.7em/1.35 var(--font-mono);
  color: #456b62;
  background: rgba(105, 194, 159, 0.1);
  border: 1px solid rgba(80, 157, 128, 0.25);
  border-radius: 10px;
}

:global(html.rq-dark) .mute-meeting-lock-note {
  color: #8ac8ae;
  background: rgba(67, 142, 112, 0.12);
}
</style>
