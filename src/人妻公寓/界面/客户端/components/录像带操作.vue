<script setup lang="ts">
// 特殊场景「录像带」操作瓷砖(App A7a 从 App.vue 等价外移)。
// 只按 props 展示三块瓷砖并 emit 动作；阶段/计数/补偿资格全部来自 App 传入。
import Ic from './Icon.vue';

defineProps<{
  open: boolean;
  sending: boolean;
  stage: string;
  tapCount: number;
  tapTarget: number;
  recoveryAvailable: boolean;
}>();

const emit = defineEmits<{
  open102: [];
  tap202: [];
  recover: [];
}>();
</script>

<template>
  <div v-if="open && !sending" class="scene-acts special-scene-acts">
    <button
      class="tile"
      :class="{ frozen: stage !== '等待102' }"
      :disabled="stage !== '等待102'"
      @click="emit('open102')"
    >
      <Ic n="cctv" />
      <span class="act-kicker">{{ stage === '等待102' ? 'SINGLE TAP' : 'PLAYED' }}</span>
      <strong>{{ stage === '等待102' ? '调取102室隐藏摄像头录像' : '102室录像已播放' }}</strong>
    </button>
    <button
      class="tile"
      :class="{ frozen: stage !== '等待202' }"
      :disabled="stage !== '等待202'"
      @click="emit('tap202')"
    >
      <Ic n="cctv" />
      <span class="act-kicker">{{ stage === '等待202' ? 'RAPID TAP' : 'LOCKED' }}</span>
      <strong>{{
        stage === '等待202'
          ? `连续点击调取202室录像 (${tapCount}/${tapTarget})`
          : '202室录像 · 等待前段结束'
      }}</strong>
    </button>
    <button v-if="recoveryAvailable" class="tile special-assist" @click="emit('recover')">
      <Ic n="cctv" />
      <span class="act-kicker">RECOVERY</span>
      <strong>让监控系统自动重连</strong>
    </button>
  </div>
</template>

<style scoped>
/* 录像带操作瓷砖(App A7a 从 App 迁出;共享的 .scene-acts/.tile/.act-kicker 声明按 scoped 边界复制,
   App 因其他动作仍保留原件;dark .tile 夜间表现一并复制) */
.special-scene-acts {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.special-scene-acts .tile.frozen {
  filter: grayscale(0.85);
  opacity: 0.48;
  cursor: not-allowed;
}

.special-scene-acts .special-assist {
  grid-column: 1 / -1;
  border-color: rgba(114, 170, 205, 0.6);
}

.scene-acts {
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 6px;
}

.scene-acts .tile {
  padding: 8px 10px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px 10px;
  font-family: inherit;
  color: var(--ink);
  text-align: center;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.08);
  transition: all 0.16s;
}

.tile .ic {
  width: 30px;
  height: 30px;
  color: var(--blue);
  margin-bottom: 2px;
}

.tile strong {
  font-size: 0.82em;
  font-weight: 700;
  line-height: 1.35;
}

.tile:hover {
  transform: translateY(-2px);
  border-color: rgba(38, 169, 244, 0.55);
  box-shadow: 0 8px 20px rgba(38, 169, 244, 0.22);
}

.act-kicker {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

:global(html.rq-dark) .tile {
  background: #2c2e40;
}
</style>
