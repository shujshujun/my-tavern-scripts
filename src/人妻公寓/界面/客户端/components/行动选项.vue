<script setup lang="ts">
// 行动选项(App A8b 从 App.vue 等价外移):gal 式居中选项条,点了直接发送。
// 纯展示 + 纯 emit:显示门控/选项列表全部来自 App,组件只把原字符串 select 回去。
// 不得 import App/store/eventEmit/composable,不得调用酒馆 API。
import { 素材基址 } from '../assets';

defineProps<{
  open: boolean;
  options: readonly string[];
}>();

const emit = defineEmits<{
  select: [option: string];
}>();
</script>

<template>
  <div
    v-if="open"
    class="option-row"
    :style="{ '--opt-img': `url(${素材基址}/界面/选项条.webp)` }"
  >
    <button v-for="(项, i) in options" :key="i" class="option-chip gal" @click="emit('select', 项)">
      {{ 项 }}
    </button>
  </div>
</template>

<style scoped>
/* 行动选项(App A8b 从 App 迁出:.option-chip 为偷窥 peep-card 共享值,App 因偷窥卡仍保留同值,
   此处按 scoped 边界复制保持;.option-row 为行动选项独占,只在这里声明) */

.option-row {
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 6px;
}

.option-chip {
  text-align: left;
  background: var(--glass);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.8em;
  padding: 6px 11px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(30, 26, 38, 0.06);
  transition: all 0.18s;
}

/* gal 式选择条(rq0.12):水彩纸条底图居中排字,图挂了退玻璃白条 */
.option-chip.gal {
  display: grid;
  place-items: center;
  min-height: 44px;
  text-align: center;
  font-size: 0.82em;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.35;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  background:
    var(--opt-img, none) center / cover no-repeat,
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.4),
      rgba(255, 255, 255, 0.88) 16%,
      rgba(255, 255, 255, 0.88) 84%,
      rgba(255, 255, 255, 0.4)
    ),
    var(--glass);
  box-shadow: 0 3px 10px rgba(30, 26, 38, 0.1);
}

.option-chip.gal:hover:not(:disabled) {
  border-color: rgba(255, 79, 154, 0.55);
  box-shadow: 0 6px 18px rgba(255, 79, 154, 0.22);
  transform: translateY(-1px);
}

:global(html.rq-lite) .option-row {
  --opt-img: none;
}

:global(html.rq-dark) .option-chip.gal {
  background:
    linear-gradient(
      90deg,
      rgba(44, 46, 64, 0.55),
      rgba(44, 46, 64, 0.94) 16%,
      rgba(44, 46, 64, 0.94) 84%,
      rgba(44, 46, 64, 0.55)
    ),
    #2c2e40;
  border-color: rgba(255, 255, 255, 0.16);
}

.option-chip:hover:not(:disabled) {
  border-color: rgba(38, 169, 244, 0.55);
  box-shadow: 0 6px 16px rgba(38, 169, 244, 0.18);
  transform: translateY(-1px);
}

@media (max-width: 540px) {
  .option-chip {
    font-size: 0.74em;
    padding: 5px 9px;
  }

  /* 软键盘弹起后把选项条收起;.keyboard-open 在 App 根祖先,须用 :global 命中 */
  :global(.keyboard-open .option-row) {
    display: none;
  }
}
</style>
