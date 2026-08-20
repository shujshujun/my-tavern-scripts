<script setup lang="ts">
// 角色CG图库：已解锁显示缩略图，未解锁不泄露画面。图库/阶段/页码/页签/大图预览均为图库内部状态；
// App 只保留 CG图库门牌 开关与 打开/关闭 两个跨区块动作（用 :key="门牌" 每次开不同角色都从头开始）。
// 顶层按 普通CG/怀孕CG 分线，每线内部用亲密场景五阶段页签；总数与已解锁都按 图库+阶段 计算。
import { computed, onBeforeUnmount, ref } from 'vue';
import { 户静态表, type 门牌 } from '../../../stageConfig';
import {
  角色CG列表,
  type CG变体,
  type 亲密场景CG阶段,
  type 成人CG项,
} from '../../../脚本/游戏逻辑/成人CG系统';
import { 成人CG基址 } from '../assets';
import { CG全览模式, CG项可查看, 创建CG全览连击状态, 记录CG全览标题点击 } from './CG图库全览';
import Ic from './Icon.vue';

const props = defineProps<{
  door: 门牌;
  unlocked: Set<string>;
}>();

const emit = defineEmits<{ close: [] }>();

const 变体 = ref<CG变体>('normal');
const 阶段 = ref<亲密场景CG阶段>('intro_no_contact');
const 页码 = ref(1);
const 每页 = 15;
const 预览 = ref<成人CG项 | null>(null);
/** 本次图库实例的素材失败表；关闭重开即可重新尝试，不污染真实解锁集合。 */
const 失效CG = ref<ReadonlySet<string>>(new Set());
const 全览点击状态 = ref(创建CG全览连击状态());
const 全览提示 = ref('');
let 全览提示计时器: ReturnType<typeof setTimeout> | null = null;

const 阶段名: Record<亲密场景CG阶段, string> = {
  intro_no_contact: '亲密开场',
  light_contact: '普通接触',
  deep_foreplay: '深度前戏',
  active: '进行中',
  aftermath: '事后',
};
const 变体名: Record<CG变体, string> = {
  normal: '普通 CG',
  pregnancy: '怀孕 CG',
};

const 角色名 = computed(() => 户静态表[props.door].妻名);
const 全部项 = computed(() => 角色CG列表(props.door, 变体.value));
const 阶段全部项 = computed(() => 全部项.value.filter(item => item.stage === 阶段.value));
const 总页数 = computed(() => Math.max(1, Math.ceil(阶段全部项.value.length / 每页)));
const 当前项 = computed(() => {
  const 起点 = (页码.value - 1) * 每页;
  return 阶段全部项.value.slice(起点, 起点 + 每页);
});
const 页签 = computed(() =>
  (Object.keys(阶段名) as 亲密场景CG阶段[]).map(值 => {
    const 项 = 全部项.value.filter(item => item.stage === 值);
    return {
      值,
      名: 阶段名[值],
      总数: 项.length,
      已解锁: 项.filter(item => props.unlocked.has(item.id)).length,
    };
  }),
);
/** 怀孕库当前为空时展示明确空状态，不伪造条目，也不显示普通图库内容。 */
const 空库提示 = computed(() => {
  if (变体.value !== 'pregnancy') return '';
  return 全部项.value.length ? '' : '怀孕 CG 素材待接入';
});

function 成人CG地址(项: 成人CG项): string {
  return `${成人CG基址}/${项.path}`;
}

function 可查看CG(项: 成人CG项): boolean {
  return CG项可查看(props.unlocked, 项.id, CG全览模式.value);
}

function 标记CG失效(id: string): void {
  if (!id || 失效CG.value.has(id)) return;
  失效CG.value = new Set([...失效CG.value, id]);
  if (预览.value?.id === id) 预览.value = null;
}

function 处理全览标题点击(): void {
  if (CG全览模式.value) return;

  const 结果 = 记录CG全览标题点击(全览点击状态.value, Date.now());
  全览点击状态.value = 结果.状态;
  if (!结果.应开启) return;

  CG全览模式.value = true;
  全览提示.value = '全览模式已开启';
  if (全览提示计时器) clearTimeout(全览提示计时器);
  全览提示计时器 = setTimeout(() => {
    全览提示.value = '';
    全览提示计时器 = null;
  }, 1_800);
}

function 切换变体(变体值: CG变体): void {
  变体.value = 变体值;
  阶段.value = 'intro_no_contact';
  页码.value = 1;
}

function 切换阶段(阶段值: 亲密场景CG阶段): void {
  阶段.value = 阶段值;
  页码.value = 1;
}

function 翻页(偏移: number): void {
  页码.value = Math.min(Math.max(页码.value + 偏移, 1), 总页数.value);
}

onBeforeUnmount(() => {
  if (全览提示计时器) clearTimeout(全览提示计时器);
});
</script>

<template>
  <div v-if="door" class="mask cg-library-mask" @click.self="emit('close')">
    <div class="sheet cg-library">
      <button class="sheet-close" @click="emit('close')">✕</button>
      <button type="button" class="sheet-title cg-library-title" @click="处理全览标题点击">
        {{ 角色名 }} · CG 图库
        <span v-if="CG全览模式" class="cg-view-all-badge">全览</span>
      </button>
      <div v-if="全览提示" class="cg-view-all-toast" role="status">{{ 全览提示 }}</div>
      <div class="cg-library-tabs cg-library-variants">
        <button
          v-for="(名, 值) in 变体名"
          :key="值"
          class="btn mini"
          :class="{ on: 变体 === 值 }"
          @click="切换变体(值)"
        >
          {{ 名 }}
        </button>
      </div>
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
      <div v-if="空库提示" class="cg-empty">
        {{ 空库提示 }}
      </div>
      <div v-else class="sheet-body cg-library-grid">
        <button
          v-for="项 in 当前项"
          :key="项.id"
          class="cg-tile"
          :class="{ locked: !可查看CG(项), broken: 失效CG.has(项.id) }"
          :disabled="!可查看CG(项) || 失效CG.has(项.id)"
          :title="!可查看CG(项) ? '尚未解锁' : 失效CG.has(项.id) ? '图片加载失败，关闭图库后可重试' : '查看大图'"
          @click="预览 = 项"
        >
          <img
            v-if="可查看CG(项) && !失效CG.has(项.id)"
            :src="成人CG地址(项)"
            alt=""
            loading="lazy"
            draggable="false"
            @error="标记CG失效(项.id)"
          />
          <span v-else-if="可查看CG(项)" class="cg-broken"><Ic n="refresh" /><small>加载失败</small></span>
          <span v-else class="cg-lock"><Ic n="lock" /></span>
        </button>
      </div>
      <div v-if="!空库提示 && 总页数 > 1" class="cg-pagination">
        <button class="btn mini" :disabled="页码 <= 1" @click="翻页(-1)">‹ 上一页</button>
        <span>第 {{ 页码 }} / {{ 总页数 }} 页</span>
        <button class="btn mini" :disabled="页码 >= 总页数" @click="翻页(1)">下一页 ›</button>
      </div>
    </div>
  </div>

  <div v-if="预览" class="mask cg-preview-mask" @click.self="预览 = null">
    <button class="sheet-close cg-preview-close" @click="预览 = null">✕</button>
    <div class="cg-preview-scroller" @click.self="预览 = null">
      <img :src="成人CG地址(预览)" alt="" draggable="false" @error="标记CG失效(预览.id)" />
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
/* 图库专属样式：完整移动自 App.vue（原 .cg-library 至该段 @media (max-width: 720px) 结束） */
.cg-library {
  position: relative;
  width: min(980px, calc(100vw - 28px));
  height: min(820px, calc(100dvh - 28px));
  display: flex;
  flex-direction: column;
}

.cg-library-title {
  box-sizing: border-box;
  width: 100%;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: inherit;
  background: transparent;
  cursor: default;
  appearance: none;
  user-select: none;
}

.cg-view-all-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 7px;
  border: 1px solid color-mix(in srgb, var(--pink) 65%, transparent);
  border-radius: 999px;
  color: var(--pink);
  font-size: 0.68em;
  line-height: 1.2;
  vertical-align: middle;
}

.cg-view-all-toast {
  position: absolute;
  z-index: 3;
  top: 46px;
  left: 50%;
  padding: 7px 12px;
  border: 1px solid color-mix(in srgb, var(--pink) 45%, transparent);
  border-radius: 999px;
  color: #fff;
  background: color-mix(in srgb, var(--pink) 86%, #1c1a24);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.24);
  font-size: 0.78em;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
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

.cg-library-variants {
  padding-bottom: 6px;
}

.cg-empty {
  flex: 1 1 auto;
  display: grid;
  min-height: 120px;
  place-items: center;
  color: var(--ink-soft);
  font-size: 0.92em;
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

.cg-tile.locked,
.cg-tile.broken {
  cursor: default;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.055), transparent), rgba(28, 26, 36, 0.94);
}

.cg-lock,
.cg-broken {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  opacity: 0.5;
  color: rgba(255, 255, 255, 0.78);
}

.cg-lock .ic,
.cg-broken .ic {
  width: 24px;
  height: 24px;
}

.cg-broken {
  align-content: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.74);
}

.cg-broken small {
  font-size: 0.68em;
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
