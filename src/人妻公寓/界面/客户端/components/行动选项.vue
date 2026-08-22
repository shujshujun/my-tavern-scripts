<script setup lang="ts">
// 行动选项(App A8b 从 App.vue 等价外移):gal 式居中选项条,点了直接发送。
// 纯展示 + 纯 emit:显示门控/选项列表全部来自 App,组件只把原字符串 select 回去。
// 不得 import App/store/eventEmit/composable,不得调用酒馆 API。
import { ref, watch } from 'vue';
import { 素材基址 } from '../assets';
import Ic from './Icon.vue';

const props = defineProps<{
  open: boolean;
  mobile: boolean;
  options: readonly string[];
}>();

const emit = defineEmits<{
  select: [option: string];
}>();

const 展开 = ref(false);

watch(
  [() => props.open, () => props.mobile, () => props.options],
  () => {
    // 关闭、换画幅或进入下一组选项都回到紧凑把手，不能让旧展开态跨场复活。
    展开.value = false;
  },
);

function 选择(文本: string): void {
  展开.value = false;
  emit('select', 文本);
}
</script>

<template>
  <template v-if="open">
    <div v-if="mobile" class="option-drawer" :class="{ open: 展开 }">
      <button
        type="button"
        class="option-drawer-handle"
        :aria-expanded="展开"
        aria-controls="mobile-action-options"
        @click="展开 = !展开"
      >
        <Ic n="arrow" />
        <span>行动建议 · {{ options.length }}</span>
        <small>{{ 展开 ? '收起' : '展开' }}</small>
      </button>
      <transition name="option-drawer">
        <div
          v-if="展开"
          id="mobile-action-options"
          class="option-drawer-panel"
          :style="{ '--opt-img': `url(${素材基址}/界面/选项条.webp)` }"
          role="region"
          aria-label="本回合行动建议"
        >
          <div class="option-row mobile-option-row">
            <button v-for="(项, i) in options" :key="i" class="option-chip gal" @click="选择(项)">
              {{ 项 }}
            </button>
          </div>
        </div>
      </transition>
    </div>
    <div
      v-else
      class="option-row desktop-option-row"
      :style="{ '--opt-img': `url(${素材基址}/界面/选项条.webp)` }"
    >
      <button v-for="(项, i) in options" :key="i" class="option-chip gal" @click="选择(项)">
        {{ 项 }}
      </button>
    </div>
  </template>
</template>

<style scoped>
/* 行动选项(App A8b 从 App 迁出:.option-chip 为偷窥 peep-card 共享值,App 因偷窥卡仍保留同值,
   此处按 scoped 边界复制保持;.option-row 为行动选项独占,只在这里声明) */

.option-drawer {
  position: relative;
  flex: none;
  margin-top: 6px;
}

.option-drawer-handle {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  color: var(--ink);
  background: linear-gradient(180deg, var(--paper-card), var(--glass));
  border: 1px solid rgba(255, 79, 154, 0.32);
  border-radius: var(--radius);
  font: 700 0.8em/1.3 inherit;
  cursor: pointer;
  box-shadow: var(--card-shadow);
  -webkit-tap-highlight-color: transparent;
}

.option-drawer-handle :deep(.ic) {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--pink);
  transition: transform 0.2s ease;
}

.option-drawer.open .option-drawer-handle :deep(.ic) {
  transform: rotate(-90deg);
}

.option-drawer-handle span {
  flex: 1;
  text-align: left;
}

.option-drawer-handle small {
  color: var(--ink-faint);
  font-size: 0.82em;
}

.option-drawer-handle:focus-visible {
  outline: 2px solid var(--pink);
  outline-offset: 2px;
}

.option-drawer-panel {
  position: absolute;
  z-index: 24;
  right: 0;
  bottom: calc(100% + 6px);
  left: 0;
  max-height: min(40dvh, 280px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px;
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 79, 154, 0.42) transparent;
}

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

:global(html.rq-lite) .option-row,
:global(html.rq-lite) .option-drawer-panel {
  --opt-img: none;
}

:global(html.rq-dark) .option-drawer-panel,
:global(html.rq-dark) .option-drawer-handle {
  background: #2c2e40;
  border-color: rgba(255, 255, 255, 0.14);
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

.option-drawer-enter-active,
.option-drawer-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.option-drawer-enter-from,
.option-drawer-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .option-drawer-enter-active,
  .option-drawer-leave-active,
  .option-drawer-handle :deep(.ic) {
    transition: none;
  }
}

:global(html.rq-still) .option-drawer-enter-active,
:global(html.rq-still) .option-drawer-leave-active,
:global(html.rq-still) .option-drawer-handle :deep(.ic) {
  transition: none;
}

@media (max-width: 540px) {
  .option-chip {
    font-size: 0.74em;
    padding: 5px 9px;
  }

  /* 软键盘弹起后把选项条收起;.keyboard-open 在 App 根祖先,须用 :global 命中 */
  :global(.keyboard-open .option-row),
  :global(.keyboard-open .option-drawer) {
    display: none;
  }
}
</style>
