<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SchemaType } from '../../../schema';
import { 户静态表, type 门牌 } from '../../../stageConfig';
import {
  匹配衣柜造型,
  穿戴成品键,
  造型成品键,
  是可见佩饰描述,
  是完整外装道具,
  衣柜可见妆容SKU,
  需要成品造型,
  读取衣柜造型,
} from '../../../衣柜造型配置';
import {
  当前可见立绘SKU,
  外装已脱下,
  脱下外装阻止原因,
  读取衣柜物品,
  衣柜操作阻止原因,
  衣柜预览穿戴,
  预览固定造型,
  固定造型阻止原因,
  type 衣柜动作,
  type 衣柜槽,
  type 衣柜物品,
} from '../../../脚本/游戏逻辑/衣柜系统';
import { 怀孕已公开 } from '../../../脚本/游戏逻辑/怀孕系统';
import { 角色立绘候选 } from '../assets';
import { 衣柜物品缩略图 } from '../衣柜素材';
import { 衣柜造型图片 } from '../穿戴成品图';
import Ic from './Icon.vue';

const props = defineProps<{
  door: 门牌;
  data: SchemaType;
  sending: boolean;
  wifeNearby: boolean;
  itemImage: (id: string) => string;
}>();
const emit = defineEmits<{ action: [action: 衣柜动作] }>();
const 分类们 = ['全部', '外装', '内衣', '妆容', '特殊'] as const;
const 分类 = ref<衣柜槽 | '全部'>('全部');
const 选中ID = ref('');
const 失效图 = ref<Record<string, boolean>>({});
const 已加载图 = ref<Record<string, boolean>>({});
const 显示细节 = ref(false);
const 妻 = computed(() => props.data.户[props.door]?.妻);
const 主立绘 = computed(() => (妻.value ? 当前可见立绘SKU(妻.value) : ''));
const 只穿内衣 = computed(() => !!妻.value && 外装已脱下(妻.value));
const 物品们 = computed(() => 读取衣柜物品(props.data, props.door));
const 当前外装 = computed(() =>
  物品们.value.find(
    项 => 项.已穿戴 && (项.槽 === '外装' || (是完整外装道具(项.id) && 妻.value?._穿着SKU.外装 === 项.id)),
  ),
);
const 可见物品 = computed(() => 物品们.value.filter(项 => 分类.value === '全部' || 项.槽 === 分类.value));
const 选中 = computed(
  () =>
    可见物品.value.find(项 => 项.id === 选中ID.value) ??
    可见物品.value.find(项 => 项.id === 主立绘.value) ??
    可见物品.value.find(项 => 项.已穿戴) ??
    可见物品.value[0],
);
const 孕态 = computed(() => 怀孕已公开(props.data, props.door));
const 使用固定造型 = computed(() => !!选中.value && 需要成品造型(选中.value.id));
const 选中造型 = computed(() =>
  选中.value ? 读取衣柜造型(户静态表[props.door].妻名, 选中.value.id, 孕态.value) : undefined,
);
const 预览状态 = computed(() => {
  if (!妻.value || !选中.value) return undefined;
  const 固定 = 使用固定造型.value ? 预览固定造型(妻.value, props.door, 选中.value.id, 孕态.value) : undefined;
  return 固定
    ? { 主立绘SKU: 当前可见立绘SKU(固定), 妆容SKU: 固定._穿着SKU.妆容, 特殊: 固定.特殊 }
    : 衣柜预览穿戴(妻.value, 选中.value);
});
const 预览候选 = computed(() =>
  使用固定造型.value
    ? [衣柜造型图片(选中造型.value)].filter(Boolean)
    : 角色立绘候选(户静态表[props.door].妻名, 预览状态.value?.主立绘SKU, 孕态.value, 预览状态.value),
);
const 预览图 = computed(() => 预览候选.value.find(url => !失效图.value[url]));
const 细节图 = computed(() =>
  使用固定造型.value && 选中.value && !是完整外装道具(选中.value.id) ? 衣柜造型图片(选中造型.value, true) : '',
);
const 展示图 = computed(() =>
  显示细节.value && 细节图.value && !失效图.value[细节图.value] ? 细节图.value : 预览图.value,
);
const 已应用 = computed(() =>
  使用固定造型.value
    ? !!选中造型.value &&
      !!妻.value &&
      穿戴成品键(户静态表[props.door].妻名, 主立绘.value, 孕态.value, {
        妆容SKU: 妻.value._穿着SKU.妆容,
        特殊: 妻.value.特殊,
      }) === 造型成品键(选中造型.value)
    : !!选中.value?.已穿戴,
);
const 禁用原因 = computed(() => {
  if (props.sending) return '当前操作尚未完成，请稍后更换。';
  if (!props.wifeNearby) return '她不在身边，可以先预览；见面后再更换。';
  return 衣柜操作阻止原因(props.data, props.door);
});
const 应用阻止原因 = computed(() => {
  if (禁用原因.value) return 禁用原因.value;
  if (!使用固定造型.value || !选中.value) return '';
  const 原因 = 固定造型阻止原因(props.data, props.door, 选中.value.id);
  if (原因) return 原因;
  if (!衣柜造型图片(选中造型.value)) return '这套成品素材尚未发布，当前不可应用。';
  if (!预览图.value) return '成品图加载失败，请重新打开衣柜后再试。';
  if (!已加载图.value[预览图.value]) return '正在加载成品图，请稍候。';
  return '';
});
const 将结束造型 = computed(
  () =>
    !使用固定造型.value &&
    !!妻.value &&
    预览状态.value?.主立绘SKU !== 主立绘.value &&
    (妻.value.特殊.some(是可见佩饰描述) || 衣柜可见妆容SKU.includes(妻.value._穿着SKU.妆容)),
);
const 当前组合未覆盖 = computed(
  () =>
    !!妻.value &&
    (妻.value.特殊.some(是可见佩饰描述) || 衣柜可见妆容SKU.includes(妻.value._穿着SKU.妆容)) &&
    !匹配衣柜造型(户静态表[props.door].妻名, 主立绘.value, 孕态.value, {
      妆容SKU: 妻.value._穿着SKU.妆容,
      特殊: 妻.value.特殊,
    }),
);
const 内衣恢复阻止 = computed(() =>
  选中.value?.槽 === '内衣' && 只穿内衣.value ? '请先穿回外衣，再恢复默认内衣状态。' : '',
);
const 可显示脱外衣 = computed(
  () => !!当前外装.value && !!选中.value?.已穿戴 && (选中.value.id === 当前外装.value.id || 选中.value.槽 === '内衣'),
);
const 脱外衣原因 = computed(() => {
  if (禁用原因.value) return 禁用原因.value;
  if (当前外装.value && !当前外装.value.初始 && !当前外装.value.可卸下) return '当前外衣有剧情限制，暂时不能脱下。';
  return 妻.value ? 脱下外装阻止原因(妻.value) : '';
});
const 未识别佩饰 = computed(
  () => 妻.value?.特殊.filter(描述 => !物品们.value.some(项 => 项.槽 === '特殊' && 项.描述 === 描述)) ?? [],
);
function 缩略图(项: 衣柜物品): string {
  return 衣柜物品缩略图(户静态表[props.door].妻名, 项.id, 孕态.value, props.itemImage);
}
function 记图片加载(event: Event): void {
  const src = (event.target as HTMLImageElement).getAttribute('src');
  if (src) 已加载图.value[src] = true;
}
function 记图片失败(event: Event): void {
  const src = (event.target as HTMLImageElement).getAttribute('src');
  if (src) 失效图.value[src] = true;
}
watch(
  () => `${props.door}|${选中.value?.id}`,
  () => {
    显示细节.value = false;
  },
);
function 操作(类型: 衣柜动作['操作']): void {
  if (!选中.value || 禁用原因.value) return;
  if (类型 === '套用造型' && 应用阻止原因.value) return;
  if (类型 === '脱下外装' && (脱外衣原因.value || !当前外装.value)) return;
  if (内衣恢复阻止.value && (类型 === '卸下' || 选中.value.初始)) return;
  const 道具id = 类型 === '脱下外装' ? 当前外装.value!.id : 选中.value.id;
  emit('action', { 门牌: props.door, 道具id, 操作: 类型 });
}
watch(
  () => props.door,
  () => {
    分类.value = '全部';
    选中ID.value = '';
  },
);
</script>

<template>
  <section class="wardrobe" :aria-label="户静态表[door].妻名 + '的衣柜'">
    <p class="wardrobe-intro">她的衣物与随身小物。换下后仍会保留，不必再次赠送。</p>
    <div class="wardrobe-filters" aria-label="衣柜分类">
      <button v-for="类 in 分类们" :key="类" type="button" :aria-pressed="分类 === 类" @click="分类 = 类">
        {{ 类 === '特殊' ? '道具' : 类 }}
      </button>
    </div>
    <div v-if="选中" class="wardrobe-body">
      <div class="wardrobe-preview">
        <div class="wardrobe-stage">
          <img
            v-if="展示图"
            :key="展示图"
            :src="展示图"
            :alt="户静态表[door].妻名 + '的穿戴预览'"
            draggable="false"
            @load="记图片加载"
            @error="记图片失败"
          />
          <p v-else class="wardrobe-image-empty">
            {{ 使用固定造型 ? 应用阻止原因 : '立绘暂时无法加载，穿戴仍可正常保存。' }}
          </p>
          <span class="wardrobe-preview-tag">{{ 已应用 ? '当前穿戴' : '预览 · 尚未应用' }}</span>
          <button
            v-if="细节图 && 预览图"
            type="button"
            class="wardrobe-zoom"
            :aria-pressed="显示细节"
            :disabled="!已加载图[预览图] || !!失效图[细节图]"
            @click="显示细节 = !显示细节"
          >
            {{ 显示细节 ? '看全身' : '看细节' }}
          </button>
        </div>
        <div class="wardrobe-detail">
          <strong>{{ 选中.名称 }}</strong>
          <p>{{ 选中.描述 || '恢复未指定的默认内衣状态。' }}</p>
          <small v-if="使用固定造型"
            >{{
              是完整外装道具(选中.id) ? '固定造型会换上这套完整外装' : '固定造型包含初始服装与这件物品'
            }}，会替换其他可见妆容和配件；内衣与衣内道具保留。</small
          >
          <small v-else-if="选中.槽 === '内衣' && !只穿内衣">内衣会保留；脱下外衣后才显示内衣立绘。</small>
          <small v-else-if="!选中.影响立绘">此物品调整穿戴记录，保留当前服装主立绘。</small>
          <small v-if="将结束造型">更换服装会结束当前配件和妆容造型，物品仍留在衣柜。</small>
          <small v-if="预览图 && 预览图 !== 预览候选[0]">该造型图片暂不可用，当前显示备用立绘。</small>
          <div class="wardrobe-actions">
            <button
              type="button"
              class="wardrobe-apply"
              :disabled="!!应用阻止原因 || 已应用 || (选中.初始 && !!内衣恢复阻止)"
              @click="操作(使用固定造型 ? '套用造型' : '穿戴')"
            >
              {{
                已应用
                  ? 使用固定造型
                    ? '造型已应用'
                    : '已穿戴'
                  : 使用固定造型
                    ? '套用造型'
                    : 选中.初始
                      ? '恢复初始'
                      : '换上这件'
              }}
            </button>
            <button
              v-if="可显示脱外衣"
              type="button"
              :disabled="!!脱外衣原因"
              :title="脱外衣原因 || undefined"
              @click="操作('脱下外装')"
            >
              脱下外衣
            </button>
            <button
              v-if="选中.已穿戴 && 选中.可卸下"
              type="button"
              :disabled="!!禁用原因 || !!内衣恢复阻止"
              @click="操作('卸下')"
            >
              {{ 选中.槽 === '特殊' && 选中.id !== 当前外装?.id ? '摘下' : '换回初始' }}
            </button>
          </div>
          <small v-if="!禁用原因 && 可显示脱外衣 && 脱外衣原因" class="wardrobe-action-hint">{{ 脱外衣原因 }}</small>
          <small v-else-if="内衣恢复阻止 && (已应用 || 选中.初始)" class="wardrobe-action-hint">{{
            内衣恢复阻止
          }}</small>
          <small v-if="使用固定造型 && 预览图 && 应用阻止原因 && !禁用原因" class="wardrobe-action-hint">{{
            应用阻止原因
          }}</small>
        </div>
      </div>
      <div class="wardrobe-inventory" aria-label="个人库存">
        <button
          v-for="项 in 可见物品"
          :key="项.id"
          type="button"
          class="wardrobe-item"
          :aria-pressed="选中.id === 项.id"
          :aria-label="项.名称 + (项.已穿戴 ? '，已穿戴' : '')"
          @click="选中ID = 项.id"
        >
          <span class="wardrobe-thumb">
            <img
              v-if="缩略图(项) && !失效图[缩略图(项)]"
              :src="缩略图(项)"
              :alt="项.名称"
              loading="lazy"
              draggable="false"
              @error="记图片失败"
            />
            <span v-else class="wardrobe-thumb-fallback">
              <Ic :n="项.槽 === '特殊' ? 'bag' : 'dress'" />
              <small>{{ 缩略图(项) ? '图片加载失败' : '暂无配图' }}</small>
            </span>
          </span>
          <span class="wardrobe-item-name">{{ 项.名称 }}</span>
          <small>{{ 项.已穿戴 ? '已穿戴' : 项.初始 ? '初始' : '已拥有' }}</small>
        </button>
      </div>
    </div>
    <p v-else class="wardrobe-empty">这一格还空着。赠送对应服饰或道具后，就会收进她的衣柜。</p>
    <p v-if="禁用原因" class="wardrobe-notice" role="status">{{ 禁用原因 }}</p>
    <p v-if="当前组合未覆盖" class="wardrobe-notice">
      当前穿戴暂无完整匹配的成品图。请选择已提供的固定造型，或换回普通服装。
    </p>
    <p v-if="未识别佩饰.length" class="wardrobe-notice">
      另有 {{ 未识别佩饰.length }} 项剧情或旧档穿戴记录，衣柜会保留，不作普通道具摘除。
    </p>
    <p class="wardrobe-footnote">旧档仅恢复能确认的当前穿戴；已经被覆盖且没有记录的历史赠礼无法自动补齐。</p>
  </section>
</template>

<style scoped>
.wardrobe {
  --wardrobe-accent: #a32f61;
  --wardrobe-surface: var(--field-bg, #fff9fc);
  --wardrobe-muted: var(--ink-soft, #745261);
  --wardrobe-selected: color-mix(in srgb, var(--wardrobe-accent) 12%, var(--wardrobe-surface));
  color: var(--ink, #392a35);
  font-size: 14px;
}
.wardrobe-intro {
  margin: 14px 0 12px;
  line-height: 1.65;
}
.wardrobe-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.wardrobe button {
  font: inherit;
  cursor: pointer;
  border: 1px solid #d8bdca;
  border-radius: 10px;
  color: inherit;
  background: var(--wardrobe-surface);
}
.wardrobe button:focus-visible {
  outline: 3px solid var(--wardrobe-accent);
  outline-offset: 3px;
}
.wardrobe button:disabled {
  cursor: default;
  opacity: 0.55;
}
.wardrobe button:not(:disabled):hover {
  border-color: var(--wardrobe-accent);
  background: var(--wardrobe-selected);
}
.wardrobe-filters button {
  min-height: 40px;
  padding: 7px 14px;
}
.wardrobe-filters button[aria-pressed='true'],
.wardrobe-filters button[aria-pressed='true']:not(:disabled):hover {
  color: #fff;
  background: var(--wardrobe-accent);
  border-color: var(--wardrobe-accent);
}
.wardrobe-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 16px;
}
.wardrobe-preview {
  min-width: 0;
}
.wardrobe-stage {
  position: relative;
  height: 290px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #f5edf1;
  border-radius: 12px;
}
.wardrobe-stage > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.wardrobe-preview-tag {
  position: absolute;
  bottom: 8px;
  left: 8px;
  max-width: calc(100% - 16px);
  padding: 5px 9px;
  color: #633349;
  background: #fff9fc;
  border-radius: 6px;
  font-size: 12px;
}
.wardrobe .wardrobe-zoom {
  position: absolute;
  top: 8px;
  right: 8px;
  min-height: 44px;
  padding: 7px 10px;
  font-size: 12px;
}
.wardrobe-detail {
  padding-top: 12px;
}
.wardrobe-detail > strong {
  display: block;
  font-size: 16px;
}
.wardrobe-detail > p {
  margin: 7px 0;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.wardrobe-detail > small {
  display: block;
  color: var(--wardrobe-muted);
  font-size: 12px;
  line-height: 1.6;
}
.wardrobe-action-hint {
  margin-top: 8px;
}
.wardrobe-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.wardrobe-actions button {
  min-height: 44px;
  padding: 8px 12px;
}
.wardrobe-actions .wardrobe-apply {
  color: #fff;
  background: var(--wardrobe-accent);
  border-color: var(--wardrobe-accent);
}
.wardrobe-actions .wardrobe-apply:not(:disabled):hover {
  color: #fff;
  background: #82244d;
}
.wardrobe-inventory {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 470px;
  overflow-y: auto;
  padding: 3px;
  scrollbar-color: #ba8099 #f5edf1;
  scrollbar-width: thin;
}
.wardrobe-item {
  min-width: 0;
  padding: 7px;
  text-align: left;
}
.wardrobe-item[aria-pressed='true'] {
  border: 2px solid var(--wardrobe-accent);
  padding: 6px;
  background: var(--wardrobe-selected);
}
.wardrobe-thumb {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 7px;
  background: #fff;
}
.wardrobe-thumb > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.wardrobe-thumb :deep(.ic) {
  width: 32px;
  height: 32px;
  color: var(--wardrobe-accent);
}
.wardrobe-thumb-fallback {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 8px;
  color: #745261;
  text-align: center;
}
.wardrobe-thumb-fallback > small {
  font-size: 12px;
  line-height: 1.4;
}
.wardrobe-item-name {
  display: block;
  margin-top: 7px;
  overflow-wrap: anywhere;
  line-height: 1.4;
}
.wardrobe-item > small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--wardrobe-muted);
}
.wardrobe-notice {
  padding: 10px 12px;
  background: #f7e7ee;
  color: #713550;
  border-radius: 8px;
  line-height: 1.65;
}
.wardrobe-footnote {
  margin: 14px 0 0;
  color: var(--wardrobe-muted);
  font-size: 12px;
  line-height: 1.6;
}
.wardrobe-empty,
.wardrobe-image-empty {
  padding: 20px 12px;
  color: #745261;
  line-height: 1.7;
}
.wardrobe ::selection {
  color: #fff;
  background: var(--wardrobe-accent);
}
@media (max-width: 480px) {
  .wardrobe-body {
    grid-template-columns: minmax(0, 1fr);
  }
  .wardrobe-preview {
    display: grid;
    grid-template-columns: minmax(110px, 0.9fr) minmax(0, 1fr);
    gap: 12px;
  }
  .wardrobe-stage {
    height: 240px;
  }
  .wardrobe-detail {
    padding-top: 0;
  }
  .wardrobe-inventory {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-height: 330px;
  }
  .wardrobe-actions button {
    flex: 1 0 100%;
  }
  .wardrobe-filters button {
    flex: 1;
    padding-inline: 8px;
  }
}
</style>
