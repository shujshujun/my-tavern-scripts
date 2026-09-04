<script setup lang="ts">
import type { 录像带V4客户端快照 } from '../../../脚本/游戏逻辑/录像带V4运行时';
import type { 录像带V4房间 } from '../../../脚本/游戏逻辑/录像带V4状态';

const props = defineProps<{
  open: boolean;
  snapshot: 录像带V4客户端快照;
  sending: boolean;
  locked: boolean;
}>();

const emit = defineEmits<{
  selectRoom: [room: 录像带V4房间];
  next: [];
  finish: [];
  cancel: [];
  abort: [];
}>();

function 房间禁用(房间: 录像带V4房间): boolean {
  if (props.locked || !props.snapshot.激活) return true;
  if (props.snapshot.可开始) return 房间 !== '102';
  return !props.snapshot.可切房 || props.snapshot.当前房间 === 房间;
}
</script>

<template>
  <section v-if="open" class="vtr-v4-controls" aria-label="录像带监控操作">
    <button
      type="button"
      :class="{ active: snapshot.当前房间 === '102' && !snapshot.可开始 }"
      :disabled="房间禁用('102')"
      @click="emit('selectRoom', '102')"
    >
      <small>{{
        snapshot.可开始 ? 'CONNECT' : snapshot.当前房间 === '102' ? 'CURRENT CAM' : 'SWITCH + ADVANCE'
      }}</small>
      <strong>102</strong>
    </button>

    <button
      type="button"
      :class="{ active: snapshot.当前房间 === '202' && !snapshot.可开始 }"
      :disabled="房间禁用('202')"
      @click="emit('selectRoom', '202')"
    >
      <small>{{ snapshot.当前房间 === '202' ? 'CURRENT CAM' : 'SWITCH + ADVANCE' }}</small>
      <strong>202</strong>
    </button>

    <button v-if="sending" type="button" class="primary cancel" @click="emit('cancel')">
      <small>CANCEL BEAT</small>
      <strong>取消本幕</strong>
    </button>
    <button v-else-if="snapshot.可完成" type="button" class="primary finish" :disabled="locked" @click="emit('finish')">
      <small>END SESSION</small>
      <strong>结束监控</strong>
    </button>
    <button v-else type="button" class="primary" :disabled="locked || !snapshot.可下一幕" @click="emit('next')">
      <small>ADVANCE</small>
      <strong>下一幕</strong>
    </button>

    <button
      v-if="!sending && snapshot.激活 && !snapshot.可完成"
      type="button"
      class="abort"
      :disabled="locked"
      @click="emit('abort')"
    >
      <small>SAFE EXIT / NO SETTLEMENT</small>
      <strong>安全退出本场</strong>
    </button>
  </section>
</template>

<style scoped>
.vtr-v4-controls {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin-top: 7px;
}

.vtr-v4-controls button {
  display: flex;
  min-width: 0;
  min-height: 58px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 9px 10px;
  color: #dbeee6;
  font-family: inherit;
  background: linear-gradient(180deg, rgba(27, 47, 40, 0.96), rgba(13, 26, 22, 0.98));
  border: 1px solid rgba(148, 207, 181, 0.28);
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    opacity 0.16s ease;
}

.vtr-v4-controls button:not(:disabled):hover {
  transform: translateY(-2px);
  border-color: rgba(170, 235, 206, 0.72);
}

.vtr-v4-controls button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.vtr-v4-controls button.active {
  opacity: 1;
  color: #f4fff9;
  border-color: rgba(143, 226, 190, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(143, 226, 190, 0.2),
    0 4px 14px rgba(0, 0, 0, 0.22);
}

.vtr-v4-controls button.primary {
  color: #f7fff9;
  background: linear-gradient(180deg, rgba(52, 101, 79, 0.98), rgba(26, 57, 45, 0.98));
  border-color: rgba(166, 235, 204, 0.54);
}

.vtr-v4-controls button.finish {
  background: linear-gradient(180deg, rgba(78, 75, 47, 0.98), rgba(43, 40, 24, 0.98));
  border-color: rgba(235, 219, 153, 0.58);
}

.vtr-v4-controls button.cancel {
  background: linear-gradient(180deg, rgba(112, 55, 55, 0.98), rgba(62, 27, 27, 0.98));
  border-color: rgba(241, 166, 166, 0.58);
}

.vtr-v4-controls button.abort {
  grid-column: 1 / -1;
  min-height: 36px;
  flex-direction: row;
  gap: 8px;
  padding: 6px 10px;
  color: rgba(226, 237, 232, 0.82);
  background: rgba(13, 24, 20, 0.9);
  border-color: rgba(177, 203, 191, 0.24);
}

.vtr-v4-controls small {
  overflow: hidden;
  max-width: 100%;
  color: rgba(197, 226, 213, 0.62);
  font:
    700 8px/1 ui-monospace,
    monospace;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vtr-v4-controls strong {
  font-size: 0.86rem;
  line-height: 1.2;
}

@media (max-width: 540px) {
  .vtr-v4-controls {
    gap: 5px;
  }

  .vtr-v4-controls button {
    min-height: 54px;
    padding: 8px 5px;
  }

  .vtr-v4-controls small {
    font-size: 7px;
  }
}
</style>
