<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { 录像带V4客户端快照 } from '../../../脚本/游戏逻辑/录像带V4运行时';

const props = defineProps<{
  open: boolean;
  snapshot: 录像带V4客户端快照;
  imageUrl: string;
  sending: boolean;
}>();

const emit = defineEmits<{ imageError: [imageUrl: string] }>();
const 失败地址 = ref('');

watch(
  () => props.imageUrl,
  () => {
    失败地址.value = '';
  },
);

const 图片可显示 = computed(() => Boolean(props.imageUrl) && 失败地址.value !== props.imageUrl);
const 正文 = computed(() => {
  if (props.snapshot.正文) return props.snapshot.正文;
  if (props.sending) return '信号已经锁定，正在建立这一幕的现场叙事……';
  if (props.snapshot.可开始) return 'CAM-102等待接通。选择102开始第一幕。';
  return '这一幕尚未生成成功。当前监控画面与进度已经保留，可以重新操作。';
});

function 格式化时间码(秒原: number): string {
  const 秒 = Math.max(0, Math.floor(Number(秒原) || 0));
  const 小时 = String(Math.floor(秒 / 3600)).padStart(2, '0');
  const 分钟 = String(Math.floor((秒 % 3600) / 60)).padStart(2, '0');
  const 余秒 = String(秒 % 60).padStart(2, '0');
  return `${小时}:${分钟}:${余秒}`;
}

function 图片加载失败(event: Event): void {
  const 地址 = (event.currentTarget as HTMLImageElement | null)?.dataset.vtrImage ?? '';
  if (!地址 || 地址 !== props.imageUrl) return;
  失败地址.value = 地址;
  emit('imageError', 地址);
}
</script>

<template>
  <Transition name="vtr-v4-fade">
    <section v-if="open" class="vtr-v4-stage" aria-label="录像带监控剧情">
      <div class="vtr-v4-picture-area">
        <figure
          class="vtr-v4-monitor-frame"
          :data-product-id="snapshot.产品ID"
          :data-product-sha256="snapshot.产品SHA256"
        >
          <img
            v-if="图片可显示"
            :key="imageUrl"
            :src="imageUrl"
            :data-vtr-image="imageUrl"
            :alt="snapshot.标题"
            draggable="false"
            @error="图片加载失败"
          />
          <div v-else class="vtr-v4-fallback" role="img" aria-label="录像带监控画面暂不可用">
            <b>MONITOR SIGNAL</b>
            <span>{{ snapshot.产品ID || 'CAM-102 / STANDBY' }}</span>
            <small>画面资源暂不可用，剧情状态与本幕正文仍会安全保留。</small>
          </div>

          <div class="vtr-v4-monitor-border" aria-hidden="true"></div>
          <div class="vtr-v4-scanlines" aria-hidden="true"></div>
          <div class="vtr-v4-rec" aria-label="正在录制"><i></i><b>REC</b></div>
          <div class="vtr-v4-cam">CAM-{{ snapshot.当前房间 }}</div>
          <time class="vtr-v4-timecode">{{ 格式化时间码(snapshot.时间码秒) }}</time>
        </figure>
      </div>

      <article class="vtr-v4-transcript" aria-live="polite">
        <header>
          <span>VTR / LIVE MONITOR</span>
          <b>{{ snapshot.标题 || '录像带监控' }}</b>
        </header>
        <p>{{ 正文 }}</p>
      </article>
    </section>
  </Transition>
</template>

<style scoped>
.vtr-v4-stage {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(88px, auto);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  color: #eef7f3;
  background: #050908;
}

.vtr-v4-picture-area {
  display: grid;
  min-width: 0;
  min-height: 0;
  place-items: center;
  padding: 8px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 45%, rgba(40, 70, 62, 0.22), transparent 66%), #030605;
}

.vtr-v4-monitor-frame {
  position: relative;
  width: min(100%, calc((100vh - 180px) * 1.5));
  max-height: 100%;
  aspect-ratio: 3 / 2;
  margin: 0;
  overflow: hidden;
  background: #07100d;
  box-shadow:
    0 0 0 1px rgba(184, 224, 207, 0.18),
    0 16px 42px rgba(0, 0, 0, 0.62);
}

.vtr-v4-monitor-frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  background: #020403;
}

.vtr-v4-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 8px;
  padding: 22px;
  color: rgba(220, 242, 233, 0.72);
  text-align: center;
  background:
    repeating-linear-gradient(0deg, rgba(136, 193, 168, 0.035) 0 1px, transparent 1px 4px),
    radial-gradient(circle, rgba(55, 92, 77, 0.34), transparent 68%), #07100d;
}

.vtr-v4-fallback b {
  color: #f3fff9;
  font:
    800 1rem/1 ui-monospace,
    monospace;
  letter-spacing: 0.16em;
}

.vtr-v4-fallback span {
  font:
    700 0.78rem/1.3 ui-monospace,
    monospace;
  letter-spacing: 0.1em;
}

.vtr-v4-fallback small {
  max-width: 34em;
  line-height: 1.55;
}

.vtr-v4-monitor-border,
.vtr-v4-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.vtr-v4-monitor-border {
  z-index: 3;
  border: 2px solid rgba(176, 224, 202, 0.32);
  box-shadow:
    inset 0 0 32px rgba(0, 0, 0, 0.34),
    inset 0 0 0 7px rgba(2, 10, 7, 0.18);
}

.vtr-v4-scanlines {
  z-index: 2;
  opacity: 0.2;
  background: repeating-linear-gradient(0deg, rgba(235, 255, 246, 0.09) 0 1px, transparent 1px 4px);
  mix-blend-mode: soft-light;
}

.vtr-v4-rec,
.vtr-v4-cam,
.vtr-v4-timecode {
  position: absolute;
  z-index: 4;
  padding: 5px 8px;
  color: #f7fffb;
  font:
    800 clamp(10px, 1.6vw, 15px) / 1 ui-monospace,
    monospace;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 5px #000;
  background: rgba(2, 8, 6, 0.42);
  border-radius: 4px;
  backdrop-filter: blur(3px);
}

.vtr-v4-rec {
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.vtr-v4-rec i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff3d43;
  box-shadow: 0 0 8px rgba(255, 61, 67, 0.9);
  animation: vtr-v4-rec-pulse 1.3s ease-in-out infinite;
}

.vtr-v4-cam {
  top: 12px;
  right: 12px;
}

.vtr-v4-timecode {
  left: 12px;
  bottom: 12px;
}

.vtr-v4-transcript {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: minmax(150px, 0.28fr) minmax(0, 1fr);
  gap: 14px;
  min-width: 0;
  max-height: 160px;
  padding: 12px 16px;
  overflow: auto;
  color: rgba(239, 249, 245, 0.9);
  background: rgba(8, 17, 14, 0.98);
  border-top: 1px solid rgba(166, 216, 194, 0.2);
}

.vtr-v4-transcript header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vtr-v4-transcript header span {
  color: rgba(151, 211, 185, 0.75);
  font:
    700 9px/1.2 ui-monospace,
    monospace;
  letter-spacing: 0.14em;
}

.vtr-v4-transcript header b {
  color: #f5fff9;
  font-size: 0.92rem;
}

.vtr-v4-transcript p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.72;
  font-size: 0.88rem;
}

.vtr-v4-fade-enter-active,
.vtr-v4-fade-leave-active {
  transition: opacity 0.18s ease;
}

.vtr-v4-fade-enter-from,
.vtr-v4-fade-leave-to {
  opacity: 0;
}

@keyframes vtr-v4-rec-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.48;
  }
}

@media (max-width: 540px) {
  .vtr-v4-stage {
    grid-template-rows: minmax(0, 1fr) minmax(112px, auto);
  }

  .vtr-v4-picture-area {
    padding: 4px;
  }

  .vtr-v4-monitor-frame {
    width: min(100%, calc((100vh - 250px) * 1.5));
  }

  .vtr-v4-transcript {
    grid-template-columns: 1fr;
    gap: 7px;
    max-height: 190px;
    padding: 10px 12px;
  }

  .vtr-v4-rec,
  .vtr-v4-cam,
  .vtr-v4-timecode {
    padding: 4px 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vtr-v4-rec i {
    animation: none;
  }
}
</style>
