<script setup lang="ts">
// 读信弹窗：遮罩/✕/“我看清了”三条关闭路径统一 emit close，App 绑定 @close="合上信"
// 保证揭晓业务事件(人妻公寓:读信)最终仍统一登记；证物槽由 App 传入，正文在此读取。
import { computed } from 'vue';
import { 查裂缝, type 门牌 } from '../../../stageConfig';
import Ic from './Icon.vue';

const props = defineProps<{
  door: 门牌;
  evidenceSlots: readonly { 标: string; 图: string }[];
}>();

const emit = defineEmits<{ close: [] }>();

const 读信正文 = computed(() => (查裂缝(props.door)?.信全文 ?? ''));
</script>

<template>
  <div v-if="door" class="mask" @click.self="emit('close')">
    <div class="sheet">
      <button class="sheet-close" @click="emit('close')">✕</button>
      <div class="sheet-title">拼 合 的 真 相</div>
      <div class="truth-fragments" aria-label="四条线索已经拼合">
        <span v-for="(槽, i) in evidenceSlots" :key="`${槽.标}-${i}`"><Ic :n="槽.图" />{{ 槽.标 }}</span>
      </div>
      <div class="sheet-body letter">
        <p v-for="(段, i) in 读信正文.split('\n')" :key="i" class="narr no-indent">{{ 段 }}</p>
      </div>
      <button class="btn rite" @click="emit('close')">我看清了</button>
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
/* 读信揭晓样式：完整移动自 App.vue（.letter / .truth-fragments 全组 / .narr.no-indent / dark .letter） */
.letter {
  background: #fff9e2;
  border: 1.5px dashed rgba(255, 202, 53, 0.9);
  border-radius: 12px;
  padding: 12px 14px;
  margin: 4px 0 10px;
}

.truth-fragments {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  margin: 2px 0 8px;
}

.truth-fragments span {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 34px;
  font-size: 0.68em;
  font-weight: 700;
  color: #6f5738;
  background: linear-gradient(145deg, #fff9e8, #eadfc4);
  border: 1px solid rgba(129, 96, 55, 0.25);
  box-shadow: 0 2px 7px rgba(78, 58, 36, 0.09);
}

.truth-fragments span:nth-child(odd) {
  transform: rotate(-1deg);
}

.truth-fragments span:nth-child(even) {
  transform: rotate(1deg);
}

.truth-fragments span :deep(.ic) {
  width: 15px;
  height: 15px;
}

.narr.no-indent {
  text-indent: 0;
}

:global(html.rq-dark) .letter {
  background: rgba(255, 202, 53, 0.1);
}
</style>
