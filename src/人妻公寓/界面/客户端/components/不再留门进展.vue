<script setup lang="ts">
import AuxPanel from './辅助面板.vue';
import { computed, ref, watch } from 'vue';
import type { SchemaType } from '../../../schema';
import {
  不再留门地点动作,
  不再留门真实录制已绑定,
  读取不再留门当前剧情票,
  读取不再留门档案提示,
  type 不再留门动作ID,
} from '../../../脚本/游戏逻辑/不再留门系统';
import { 读取世界时间 } from '../../../脚本/游戏逻辑/楼层时钟';
import { 不再留门图片, 不再留门CG允许 } from '../不再留门资源';

const props = defineProps<{ data: SchemaType; room: string | null; sending: boolean }>();
const emit = defineEmits<{ action: [id: 不再留门动作ID] }>();
const r = computed(() => props.data.系统._不再留门);
const visible = computed(
  () =>
    ['202', '302', '管理员室', '公寓外部'].includes(props.room ?? '') &&
    (r.value.道具已使用 || props.data.背包.includes('不再留门')),
);
const progress = computed(() => 读取不再留门档案提示(props.data));
const decisions = computed(() =>
  不再留门地点动作(props.data, props.room ?? '').filter(
    a =>
      ['暂缓', '确认当前决定'].includes(a.id) ||
      (a.id === '撤回许可' && (读取不再留门当前剧情票(props.data) || r.value.阶段 === '录制中')),
  ),
);
const photo = computed(() => (不再留门CG允许(props.data, 'ZXM-NMD-02') ? 不再留门图片('ZXM-NMD-02') : ''));
const archive = computed(
  () => ['302', '管理员室'].includes(props.room ?? '') && 不再留门CG允许(props.data, 'ZXM-NMD-08'),
);
const failed = ref<Record<string, boolean>>({});
watch(
  () => r.value.实例,
  () => {
    failed.value = {};
  },
);
const photoDate = computed(() => {
  const t = 读取世界时间(Math.max(0, r.value.照片.拍摄时段));
  return `第${t.天数}天 · ${t.时段}`;
});
</script>

<template>
  <AuxPanel v-if="visible && progress" label="线路进展" :hint="progress.状态" :reset-key="(room ?? '') + ':' + r.实例">
  <aside v-if="visible && progress" class="nmd-progress" aria-label="不再留门进展">
    <div class="nmd-line">
      <strong>不再留门</strong><span>{{ progress.状态 }}</span>
    </div>
    <p>{{ progress.下一步 }}</p>
    <p v-if="progress.补充" class="nmd-note">{{ progress.补充 }}</p>
    <p v-if="room === '202' && r.设备位置 === '202'" class="nmd-note">
      {{
        不再留门真实录制已绑定(data)
          ? '手机正在录制，正常收尾后停机。'
          : '手机支架与转存套件留在202，设备已停机或待机。'
      }}
    </p>
    <div v-if="decisions.length" class="nmd-decisions">
      <button
        v-for="a in decisions"
        :key="a.id"
        type="button"
        :disabled="sending || !a.可执行"
        :title="a.原因"
        @click="emit('action', a.id)"
      >
        {{ a.文案 }}
      </button>
    </div>
    <details v-if="r.照片.id" :open="r.当前场景 === 'A4'">
      <summary>查看已保存的照片 · {{ photoDate }}</summary>
      <img
        v-if="photo && !failed.photo"
        :src="photo"
        alt="保存的街外照片：何俊生与同一成年同行人亲吻"
        width="1536"
        height="1024"
        loading="lazy"
        @error="failed.photo = true"
      />
      <p v-else>
        照片已保存：{{ photoDate }}，梧桐里公寓外，何俊生与同行人的亲吻。图片暂不可用，原件和交付记录仍保留。
      </p>
    </details>
    <details v-if="archive">
      <summary>查看资料柜的202封存格</summary>
      <img
        v-if="不再留门图片('ZXM-NMD-08') && !failed.archive"
        :src="不再留门图片('ZXM-NMD-08')"
        alt="202专用格中的周小满封存盒"
        width="1536"
        height="1024"
        loading="lazy"
        @error="failed.archive = true"
      />
      <p>周小满亲自封好的同一记录盒已存入202专用格，由你代为保管。</p>
    </details>
  </aside>
  </AuxPanel>
</template>

<style scoped>
.nmd-progress {
  margin: 10px 0;
  padding: 12px 16px;
  border: 1px solid #bca78b;
  border-radius: 12px;
  color: #493c30;
  background: #faf4e9;
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.nmd-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 14px;
}
.nmd-line strong {
  font-size: 16px;
}
.nmd-line span,
.nmd-note {
  color: #685743;
}
.nmd-progress p {
  margin: 6px 0;
}
.nmd-progress summary {
  cursor: pointer;
  padding: 10px 0;
  min-height: 44px;
  box-sizing: border-box;
}
.nmd-progress img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 360px;
  object-fit: contain;
  margin: 6px auto;
}
.nmd-decisions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.nmd-decisions button {
  flex: 1 1 170px;
  min-height: 44px;
  padding: 8px 12px;
  font: inherit;
  border: 1px solid #907a60;
  border-radius: 8px;
  background: #fffaf2;
  color: #493c30;
  cursor: pointer;
}
.nmd-decisions button:hover {
  background: #eee1cb;
}
.nmd-decisions button:disabled {
  opacity: 0.55;
  cursor: default;
}
.nmd-progress :focus-visible {
  outline: 2px solid #77522e;
  outline-offset: 3px;
}
@media (max-width: 480px) {
  .nmd-progress {
    padding: 10px 12px;
  }
}
</style>
