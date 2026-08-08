<script setup lang="ts">
// 静音会议运行轨道与组合图(App A7b3 从 App.vue 等价外移)。
// 纯展示：轨道文案/组合图/回退占位只按 props 渲染；图加载成功/失败仅 emit，
// 状态机(画面状态、图地址、回退序号、加载标记)与事件总线全部留在 App。
import type { 静音会议画面状态 } from '../../../静音会议配置';

defineProps<{
  formal: boolean;
  interactionOpen: boolean;
  phaseName: string;
  shotLabel: string;
  topic: string;
  visualOpen: boolean;
  visualState: 静音会议画面状态;
  imageUrl: string;
}>();

const emit = defineEmits<{
  imageLoad: [];
  imageError: [];
}>();
</script>

<template>
  <div v-if="formal && !interactionOpen" class="mute-meeting-track" role="status">
    <span>MEETING · {{ phaseName }}</span>
    <b>{{ shotLabel }}</b>
    <em>{{ topic || '楼务会议' }}</em>
  </div>
  <Transition name="fade">
    <div v-if="visualOpen" class="mute-meeting-visual" :class="`state-${visualState}`">
      <img
        v-if="imageUrl"
        :key="imageUrl"
        :src="imageUrl"
        :alt="`静音会议${visualState}会场全景`"
        draggable="false"
        @load="emit('imageLoad')"
        @error="emit('imageError')"
      />
      <div v-else class="mute-meeting-visual-fallback">
        <span>梧桐里公寓 · 管理员室</span>
        <b>楼务会议进行中</b>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ═══ 静音会议运行轨道与组合图(App A7b3 从 App 迁出;正文卷轴上移 .story-wrap.story-mute-meeting .story 属 App 跨布局例外,保留原处) ═══ */

.mute-meeting-track {
  position: absolute;
  top: 8px;
  left: 10px;
  right: 50px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  color: rgba(246, 252, 255, 0.9);
  background: linear-gradient(90deg, rgba(6, 16, 25, 0.82), rgba(6, 16, 25, 0.5));
  border: 1px solid rgba(161, 208, 220, 0.34);
  border-radius: 10px;
  backdrop-filter: blur(7px);
  pointer-events: none;
}

.mute-meeting-track span,
.mute-meeting-track b {
  flex: none;
  font: 700 0.68em/1.2 var(--font-mono);
  letter-spacing: 0.08em;
}

.mute-meeting-track b {
  color: #83e0b2;
}

.mute-meeting-track em {
  min-width: 0;
  margin-left: auto;
  overflow: hidden;
  font-size: 0.68em;
  font-style: normal;
  color: rgba(246, 252, 255, 0.7);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mute-meeting-visual {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(circle at 50% 48%, rgba(47, 83, 91, 0.3), transparent 58%), #090f14;
}

.mute-meeting-visual::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background: linear-gradient(180deg, rgba(2, 8, 12, 0.12), transparent 55%, rgba(2, 8, 12, 0.28));
}

.mute-meeting-visual.state-DETAIL {
  background-color: #0a1218;
}

.mute-meeting-visual.state-PEAK {
  background: radial-gradient(circle at 50% 58%, rgba(122, 52, 83, 0.22), transparent 58%), #100c13;
}

.mute-meeting-visual.state-DETAIL img,
.mute-meeting-visual.state-PEAK img {
  animation: mute-visual-turn 0.42s ease both;
}

.mute-meeting-visual img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  filter: saturate(0.96) contrast(1.02);
}

.mute-meeting-visual-fallback {
  display: flex;
  width: min(82%, 430px);
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 18px;
  color: rgba(235, 246, 249, 0.72);
  text-align: center;
  background: rgba(19, 32, 39, 0.74);
  border: 1px solid rgba(166, 207, 215, 0.25);
  border-radius: 16px;
}

.mute-meeting-visual-fallback :deep(.ic) {
  width: 34px;
  height: 34px;
  color: #70cfa4;
}

.mute-meeting-visual-fallback b {
  color: #f1f8fa;
}

:global(html.rq-still) .mute-meeting-visual img {
  animation: none;
}

@keyframes mute-visual-turn {
  from {
    opacity: 0.28;
    transform: scale(1.018);
  }
}

/* 组合图过渡沿用 App 共享 fade 同值(组件内 Transition 需要自持 scoped 规则) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 540px) {
  .mute-meeting-track {
    gap: 6px;
    padding: 5px 8px;
  }

  .mute-meeting-track em {
    max-width: 40%;
  }
}
</style>
