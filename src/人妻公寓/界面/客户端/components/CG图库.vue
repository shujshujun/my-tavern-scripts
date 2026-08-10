<script setup lang="ts">
// 角色CG图库：已解锁显示缩略图，未解锁不泄露画面。阶段/页码/页签/大图预览均为图库内部状态；
// App 只保留 CG图库门牌 开关与 打开/关闭 两个跨区块动作（用 :key="门牌" 每次开不同角色都从头开始）。
import { computed, ref } from 'vue';
import { 户静态表, type 门牌 } from '../../../stageConfig';
import { 角色CG列表, type CG阶段, type 成人CG项 } from '../../../脚本/游戏逻辑/成人CG系统';
import { 成人CG基址 } from '../assets';
import Ic from './Icon.vue';

const props = defineProps<{
  door: 门牌;
  unlocked: Set<string>;
}>();

const emit = defineEmits<{ close: [] }>();

const 阶段 = ref<CG阶段>('foreplay');
const 页码 = ref(1);
const 每页 = 15;
const 预览 = ref<成人CG项 | null>(null);

const 阶段名: Record<CG阶段, string> = {
  foreplay: '前戏',
  active: '进行中',
  climax_after: '高潮事后',
};

const 角色名 = computed(() => 户静态表[props.door].妻名);
const 全部项 = computed(() => 角色CG列表(props.door));
const 阶段全部项 = computed(() => 全部项.value.filter(item => item.phase === 阶段.value));
const 总页数 = computed(() => Math.max(1, Math.ceil(阶段全部项.value.length / 每页)));
const 当前项 = computed(() => {
  const 起点 = (页码.value - 1) * 每页;
  return 阶段全部项.value.slice(起点, 起点 + 每页);
});
const 页签 = computed(() =>
  (Object.keys(阶段名) as CG阶段[]).map(值 => {
    const 项 = 全部项.value.filter(item => item.phase === 值);
    return {
      值,
      名: 阶段名[值],
      总数: 项.length,
      已解锁: 项.filter(item => props.unlocked.has(item.id)).length,
    };
  }),
);

function 成人CG地址(项: 成人CG项): string {
  return `${成人CG基址}/${项.path}`;
}

function 切换阶段(阶段值: CG阶段): void {
  阶段.value = 阶段值;
  页码.value = 1;
}

function 翻页(偏移: number): void {
  页码.value = Math.min(Math.max(页码.value + 偏移, 1), 总页数.value);
}
</script>

<template>
  <div v-if="door" class="mask cg-library-mask" @click.self="emit('close')">
    <div class="sheet cg-library">
      <button class="sheet-close" @click="emit('close')">✕</button>
      <div class="sheet-title">{{ 角色名 }} · CG 图库</div>
      <div class="cg-library-tabs">
        <button
          v-for="页 in 页签"
          :key="页.值"
          class="btn mini"
          :class="{ on: 阶段 === 页.值 }"
          @click="切换阶段(页.值)"
        >
          {{ 页.名 }} {{ 页.已解锁 }}/{{ 页.总数 }}
        </button>
      </div>
      <div class="sheet-body cg-library-grid">
        <button
          v-for="项 in 当前项"
          :key="项.id"
          class="cg-tile"
          :class="{ locked: !unlocked.has(项.id) }"
          :disabled="!unlocked.has(项.id)"
          :title="unlocked.has(项.id) ? '查看大图' : '尚未解锁'"
          @click="预览 = 项"
        >
          <img v-if="unlocked.has(项.id)" :src="成人CG地址(项)" alt="" loading="lazy" draggable="false" />
          <span v-else class="cg-lock"><Ic n="lock" /></span>
        </button>
      </div>
      <div v-if="总页数 > 1" class="cg-pagination">
        <button class="btn mini" :disabled="页码 <= 1" @click="翻页(-1)">‹ 上一页</button>
        <span>第 {{ 页码 }} / {{ 总页数 }} 页</span>
        <button class="btn mini" :disabled="页码 >= 总页数" @click="翻页(1)">下一页 ›</button>
      </div>
    </div>
  </div>

  <div v-if="预览" class="mask cg-preview-mask" @click.self="预览 = null">
    <button class="sheet-close cg-preview-close" @click="预览 = null">✕</button>
    <div class="cg-preview-scroller" @click.self="预览 = null">
      <img :src="成人CG地址(预览)" alt="" draggable="false" />
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
/* 图库专属样式：完整移动自 App.vue（原 .cg-library 至该段 @media (max-width: 720px) 结束） */
.cg-library {
  width: min(980px, calc(100vw - 28px));
  height: min(820px, calc(100dvh - 28px));
  display: flex;
  flex-direction: column;
}

.cg-library-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 14px 10px;
}

.cg-library-tabs .btn.on {
  color: #fff;
  border-color: var(--pink);
  background: var(--pink);
}

.cg-library-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-content: start;
  gap: 10px;
  overflow-y: auto;
}

.cg-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 14px 14px;
  color: var(--ink-soft);
  font-size: 0.82em;
  font-variant-numeric: tabular-nums;
}

.cg-pagination .btn:disabled {
  opacity: 0.38;
}

.cg-tile {
  position: relative;
  min-width: 0;
  aspect-ratio: 2 / 3;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  background: rgba(28, 26, 36, 0.92);
  cursor: zoom-in;
}

.cg-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.cg-tile:hover img {
  transform: scale(1.035);
}

.cg-tile.locked {
  cursor: default;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.055), transparent), rgba(28, 26, 36, 0.94);
}

.cg-lock {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  opacity: 0.5;
  color: rgba(255, 255, 255, 0.78);
}

.cg-lock .ic {
  width: 24px;
  height: 24px;
}

.cg-preview-mask {
  position: fixed;
  z-index: 80;
  padding: 0;
  overflow: hidden;
  border-radius: 0;
  background: rgba(5, 4, 8, 0.94);
}

.cg-preview-scroller {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 18px;
  touch-action: pan-y pinch-zoom;
}

.cg-preview-scroller > img {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 100%;
  flex: 0 0 auto;
  object-fit: contain;
}

.cg-preview-close {
  position: fixed;
  z-index: 81;
  top: 14px;
  right: 14px;
}

@media (max-width: 720px) {
  .cg-preview-scroller {
    align-items: flex-start;
    padding: max(48px, env(safe-area-inset-top)) 0 max(18px, env(safe-area-inset-bottom));
  }

  .cg-preview-scroller > img {
    width: 100%;
    max-width: none;
    max-height: none;
    margin: auto 0;
  }

  .cg-library {
    width: calc(100vw - 12px);
    height: calc(100dvh - 12px);
  }

  .cg-library-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 8px;
  }

  .cg-library-tabs {
    padding-inline: 8px;
  }
}
</style>
