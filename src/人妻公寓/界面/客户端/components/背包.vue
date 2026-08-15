<script setup lang="ts">
// 背包弹窗：只展示列表并 emit 动作；业务状态(显示背包/背包列表/道具图/道具图失效)留在 App。
import { 户静态表, 查道具, type 门牌 } from '../../../stageConfig';
import type { 阶段线路候选 } from '../../../脚本/游戏逻辑/阶段线路系统';
import type { 道具视觉类型 } from '../types';
import Ic from './Icon.vue';

/** 与 App 背包列表 computed 返回结构一一对应的只读展示项。 */
interface 运作对象项 {
  门牌: 门牌;
  夫名: string;
  时段可用: boolean;
}

interface 可送对象项 {
  门牌: 门牌;
  妻名: string;
  可送?: boolean;
  提示?: string;
}

interface 背包展示项 {
  id: string;
  名称: string;
  描述: string;
  视觉: { 类: 道具视觉类型; 标: string; 图: string };
  /** 读信:碎片集齐后的揭晓时刻 */
  可读信: boolean;
  信门牌?: 门牌 | null;
  可布设: boolean;
  可使用录像带: boolean;
  可筹备静音会议: boolean;
  可用资源: boolean;
  可用运作: boolean;
  全局线路候选?: 阶段线路候选;
  全局运作对象: readonly 阶段线路候选[];
  运作对象: readonly 运作对象项[];
  可送对象: readonly 可送对象项[];
}

defineProps<{
  open: boolean;
  items: readonly 背包展示项[];
  sending: boolean;
  itemFailed: Record<string, boolean>;
  itemImage: (id: string) => string;
}>();

const emit = defineEmits<{
  close: [];
  imageError: [id: string];
  read: [door: 门牌];
  deploy: [];
  useResource: [itemId: string];
  useOperation: [itemId: string, door?: 门牌, candidate?: 阶段线路候选];
  playTape: [];
  prepareMeeting: [];
  gift: [itemId: string, door: 门牌];
}>();
</script>

<template>
  <div v-if="open" class="mask" @click.self="emit('close')">
    <div class="sheet">
      <button class="sheet-close" @click="emit('close')">✕</button>
      <div class="sheet-title">背 包</div>
      <div class="sheet-body">
        <div v-for="(项, i) in items" :key="i" class="ware-card" :class="'ware-' + 项.视觉.类">
          <span class="ware-pic">
            <img
              v-if="查道具(项.id) && !itemFailed[项.id]"
              :src="itemImage(项.id)"
              :alt="项.名称"
              loading="lazy"
              draggable="false"
              @error="emit('imageError', 项.id)"
            />
            <b v-else>{{ 项.可读信 ? '✉' : 项.名称[0] }}</b>
            <span class="ware-kind"><Ic :n="项.视觉.图" /></span>
          </span>
          <span class="ware-main">
            <b class="ware-name"
              >{{ 项.名称 }} <em class="ware-kind-label">{{ 项.视觉.标 }}</em></b
            >
            <span class="ware-desc">{{ 项.描述 }}</span>
          </span>
          <span class="ware-acts">
            <button v-if="项.可读信" class="btn mini" :disabled="sending" @click="emit('read', 项.信门牌!)">读</button>
            <button v-if="项.可布设" class="btn mini" :disabled="sending" @click="emit('deploy')">装在这个房间</button>
            <button v-if="项.可用资源" class="btn mini rite" :disabled="sending" @click="emit('useResource', 项.id)">
              使用
            </button>
            <button
              v-if="项.可用运作"
              class="btn mini"
              :disabled="sending"
              @click="emit('useOperation', 项.id, 项.全局线路候选?.门牌, 项.全局线路候选)"
            >
              {{ 项.全局线路候选 ? `用于${户静态表[项.全局线路候选.门牌].妻名}的线索` : '使用' }}
            </button>
            <button v-if="项.可使用录像带" class="btn mini rite" :disabled="sending" @click="emit('playTape')">
              在管理员室播放
            </button>
            <button v-if="项.可筹备静音会议" class="btn mini rite" :disabled="sending" @click="emit('prepareMeeting')">
              筹备会议
            </button>
            <button
              v-for="夫 in 项.运作对象"
              :key="'运' + 夫.门牌"
              class="btn mini"
              :disabled="sending || !夫.时段可用"
              @click="emit('useOperation', 项.id, 夫.门牌)"
            >
              {{ 夫.时段可用 ? `给${夫.夫名}` : `晚上再给${夫.夫名}` }}
            </button>
            <button
              v-for="候选 in 项.全局运作对象"
              :key="'线运' + 项.id + 候选.门牌"
              class="btn mini"
              :disabled="sending"
              @click="emit('useOperation', 项.id, 候选.门牌, 候选)"
            >
              用于{{ 户静态表[候选.门牌].妻名 }}的线索
            </button>
            <button
              v-for="妻 in 项.可送对象"
              :key="妻.门牌"
              class="btn mini gift-target"
              :disabled="sending || 妻.可送 === false"
              :title="妻.提示"
              @click="emit('gift', 项.id, 妻.门牌)"
            >
              <span>送给{{ 妻.妻名 }}</span>
              <small v-if="妻.提示">{{ 妻.提示 }}</small>
            </button>
          </span>
        </div>
        <p v-if="!items.length" class="hint center">(空空如也)</p>
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

.gift-target {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.3;
  white-space: normal;
}

.gift-target small {
  max-width: 15em;
  font-size: 0.78em;
  font-weight: 500;
  opacity: 0.78;
}

.gift-target:disabled {
  opacity: 0.7;
}
</style>
