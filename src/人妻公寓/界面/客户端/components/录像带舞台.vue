<script setup lang="ts">
// 特殊场景「录像带」双屏舞台(App A7a 从 App.vue 等价外移)。
// 纯展示派生：图与三段说明只依赖传入 props，无业务写入；提交仍由 App 经 composable 持有。
import { computed, ref } from 'vue';
import { 录像带双屏关闭图, 录像带左屏亮起图, 录像带双屏亮起图 } from '../assets';

const props = defineProps<{
  open: boolean;
  stage: string;
  localResult: '' | '102' | '202';
  tapCount: number;
  tapTarget: number;
  sending: boolean;
}>();

const 当前图 = computed(() => {
  if (props.localResult === '202') return 录像带双屏亮起图;
  if (props.localResult === '102' || props.stage === '等待202') return 录像带左屏亮起图;
  return 录像带双屏关闭图;
});
const 失效图 = ref('');

function 事件图地址(event: Event): string {
  return (event.currentTarget as HTMLImageElement | null)?.dataset.videoSrc ?? '';
}

function 图片加载失败(event: Event): void {
  const 地址 = 事件图地址(event);
  if (地址 && 地址 === 当前图.value) 失效图.value = 地址;
}

function 图片加载成功(event: Event): void {
  const 地址 = 事件图地址(event);
  if (地址 && 地址 === 当前图.value && 失效图.value === 地址) 失效图.value = '';
}

const 交互说明 = computed(() => {
  if (props.sending && props.localResult) return '录像已经接通，正在等待她们开口……';
  if (props.stage === '等待202') return '102室录像已结束。连续点击，让第二台显示器接通信号。';
  return '两台显示器仍是黑的。先调取102室录像。';
});
</script>

<template>
  <div v-if="open" class="special-interaction-stage">
    <img
      v-if="失效图 !== 当前图"
      :key="当前图"
      :src="当前图"
      :data-video-src="当前图"
      alt="管理员室双显示器"
      draggable="false"
      @load="图片加载成功"
      @error="图片加载失败"
    />
    <div v-else class="video-tape-fallback" role="img" aria-label="录像带画面加载失败">
      <b>画面暂时无法加载</b>
      <span>操作进度已经保留，可以继续完成当前录像带互动。</span>
    </div>
    <div class="special-interaction-status">
      <span>{{ 交互说明 }}</span>
      <span v-if="tapCount > 0 && stage === '等待202'">
        {{ tapCount }}/{{ tapTarget }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 双屏舞台与状态条(App A7a 从 App 迁出;App 因静音会议共用仍保留前两段共享定义) */
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

.video-tape-fallback {
  display: grid;
  max-width: min(78%, 430px);
  gap: 7px;
  padding: 18px;
  color: rgba(235, 246, 249, 0.72);
  text-align: center;
  background: rgba(19, 32, 39, 0.74);
  border: 1px solid rgba(166, 207, 215, 0.25);
  border-radius: 16px;
}

.video-tape-fallback b {
  color: #f1f8fa;
}

.video-tape-fallback span {
  font-size: 0.78em;
  line-height: 1.55;
}

.special-interaction-status {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(174, 210, 238, 0.32);
  border-radius: 9px;
  color: #eef7ff;
  background: rgba(5, 12, 20, 0.72);
  backdrop-filter: blur(6px);
  font-size: 0.78em;
  letter-spacing: 0.03em;
}
</style>
