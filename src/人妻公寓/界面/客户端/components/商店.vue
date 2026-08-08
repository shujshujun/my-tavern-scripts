<script setup lang="ts">
// 商店弹窗：页签局部状态(商店页签/当前货架/当前空文案)随组件自持，关闭再开仍保持；
// 货架计算/锁定原因/购买文案/购买动作留在 App。
import { computed, ref } from 'vue';
import type { 道具配置 } from '../../../stageConfig';
import type { 道具视觉类型 } from '../types';
import Ic from './Icon.vue';

const props = defineProps<{
  open: boolean;
  cash: number;
  sending: boolean;
  shelves: readonly { 页签: string; 商品: readonly 道具配置[]; 空文案?: string }[];
  itemFailed: Record<string, boolean>;
  itemImage: (id: string) => string;
  itemVisual: (item?: 道具配置, readableLetter?: boolean) => { 类: 道具视觉类型; 标: string; 图: string };
  lockReasons: (item: 道具配置) => string[];
  purchaseLabel: (item: 道具配置) => string;
}>();

const emit = defineEmits<{ close: []; imageError: [id: string]; buy: [itemId: string] }>();

const 商店页签 = ref('工具');
const 当前货架 = computed(() => props.shelves.find(页 => 页.页签 === 商店页签.value)?.商品 ?? []);
const 当前空文案 = computed(() => props.shelves.find(页 => 页.页签 === 商店页签.value)?.空文案 ?? '(暂时没货)');
</script>

<template>
  <div v-if="open" class="mask" @click.self="emit('close')">
    <div class="sheet shop">
      <button class="sheet-close" @click="emit('close')">✕</button>
      <div class="shop-hero">
        <div class="ui-kicker light">WUTONGLI MALL / 网购商城</div>
        <b>商 店</b>
        <em>小时达 · 本时段内送到管理员室</em>
        <span class="shop-cash">¥ {{ cash }}</span>
      </div>
      <div class="shop-tabs">
        <button
          v-for="页 in shelves"
          :key="页.页签"
          class="btn mini"
          :class="{ on: 商店页签 === 页.页签 }"
          @click="商店页签 = 页.页签"
        >
          {{ 页.页签 }}
        </button>
      </div>
      <div class="sheet-body shop-grid">
        <div
          v-for="项 in 当前货架"
          :key="项.id"
          class="ware-card"
          :class="['ware-' + itemVisual(项).类, { locked: lockReasons(项).length }]"
        >
          <span class="ware-pic">
            <img
              v-if="!itemFailed[项.id]"
              :src="itemImage(项.id)"
              :alt="项.名称"
              loading="lazy"
              draggable="false"
              @error="emit('imageError', 项.id)"
            />
            <b v-else>{{ 项.名称[0] }}</b>
            <span class="ware-kind"><Ic :n="itemVisual(项).图" /></span>
          </span>
          <span class="ware-main">
            <b class="ware-name"
              >{{ 项.名称 }} <em class="ware-kind-label">{{ itemVisual(项).标 }}</em>
              <em class="ware-price">¥{{ 项.价格 }}</em></b
            >
            <span class="ware-desc">{{ 项.描述 }}</span>
            <span v-if="lockReasons(项).length" class="ware-lock">尚缺：{{ lockReasons(项).join('；') }}</span>
          </span>
          <button
            class="btn rite ware-buy"
            :disabled="sending || cash < (项.价格 ?? 0) || lockReasons(项).length > 0"
            @click="emit('buy', 项.id)"
          >
            {{ lockReasons(项).length ? '未解锁' : cash < (项.价格 ?? 0) ? '钱不够' : purchaseLabel(项) }}
          </button>
        </div>
        <p v-if="!当前货架.length" class="hint center">{{ 当前空文案 }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped src="./道具卡.css"></style>

<style scoped>
/* 与 App 一致的通用提示声明（父组件 scoped 不穿透，两组件各自复制一份） */
.hint {
  font-size: 0.8em;
  color: var(--ink-soft);
  margin: 4px 0;
}

.center {
  text-align: center;
}

/* ── 商店独有：页签条 + hero 现金 + 双列布局与锁定/买钮（完整移动自 App.vue） ── */

.shop-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 6px;
  margin-bottom: 4px;
}

.shop-tabs .btn.on {
  color: #fff;
  background: var(--blue);
  border-color: var(--blue);
  box-shadow: 0 4px 12px rgba(38, 169, 244, 0.3);
}

.sheet.shop {
  width: min(520px, 96%);
}

.shop-cash {
  position: absolute;
  right: 16px;
  bottom: 12px;
  font-family: var(--font-mono);
  font-size: 1.05em;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 6px rgba(20, 22, 30, 0.45);
}

/* 紧凑横条(2026-07-17 用户反馈:大方图卡太占地,道具多了会卡)——64px 缩略图+文字+买钮,单列可长列表 */
.shop-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ware-price {
  font-family: var(--font-mono);
  color: var(--blue);
  font-style: normal;
  margin-left: 8px;
  font-size: 0.85em;
}

.ware-price {
  font-family: var(--font-mono);
  font-size: 0.85em;
  font-style: normal;
  font-weight: 700;
  color: var(--blue);
  margin-left: 6px;
}

.ware-lock {
  display: block;
  margin-top: 4px;
  color: #9a5d50;
  font-size: 0.72em;
  line-height: 1.35;
}

.ware-buy {
  flex: none;
  align-self: center;
  padding: 6px 12px;
  font-size: 0.8em;
}
</style>
