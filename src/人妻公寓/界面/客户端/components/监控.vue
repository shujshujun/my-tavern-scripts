<script setup lang="ts">
// 监控弹窗：只展示列表并 emit 关闭/选择/头像失败；业务状态(显示监控/监控列表/看监控)留在 App。
import { ref } from 'vue';
import { 户静态表, type 门牌 } from '../../../stageConfig';

defineProps<{
  rooms: readonly 门牌[];
  sending: boolean;
  avatarFailed: Record<string, boolean>;
  backgroundUrl: (door: string) => string;
  avatarUrl: (name: string) => string;
  borrowSeedOffline: boolean;
}>();

const emit = defineEmits<{
  close: [];
  select: [门牌];
  avatarError: [string];
  confirmBorrowSeedOffline: [];
}>();

/** 房间缩略图只是导航呈现；单图失败显示本地占位，不影响监控事务与头像。 */
const 背景失效 = ref<ReadonlySet<string>>(new Set());
function 标记背景失效(url: string): void {
  if (!url || 背景失效.value.has(url)) return;
  背景失效.value = new Set([...背景失效.value, url]);
}
</script>

<template>
  <div class="mask" @click.self="emit('close')">
    <div class="sheet">
      <button class="sheet-close" @click="emit('close')">✕</button>
      <button
        v-if="borrowSeedOffline"
        type="button"
        class="borrow-seed-offline"
        aria-label="确认101监控已经断线"
        :disabled="sending"
        @click="emit('confirmBorrowSeedOffline')"
      >
        <span class="borrow-seed-offline-screen"><b>CAM-101</b><em>NO SIGNAL</em></span>
        <span><b>101 · 观察点已移除</b><small>你亲手拆下的针孔摄像头已经没有信号。点击确认。</small></span>
      </button>
      <div class="shop-hero cams">
        <div class="ui-kicker light">HIDDEN EYES / 你装下的眼睛</div>
        <b>监 控</b>
        <em>没人看着的时候的她。看完记得想想:你注意到了什么?</em>
      </div>
      <div class="sheet-body">
        <button v-for="m in rooms" :key="m" class="cam-row" :disabled="sending" @click="emit('select', m)">
          <img
            v-if="!背景失效.has(backgroundUrl(m))"
            class="cam-room"
            :src="backgroundUrl(m)"
            :alt="m + '室监控背景'"
            @error="标记背景失效(backgroundUrl(m))"
          />
          <span v-else class="cam-room fb" role="img" :aria-label="m + '室监控背景加载失败'">{{ m }}</span>
          <img
            v-if="!avatarFailed[户静态表[m].妻名]"
            class="cam-face"
            :src="avatarUrl(户静态表[m].妻名)"
            :alt="户静态表[m].妻名"
            @error="emit('avatarError', 户静态表[m].妻名)"
          />
          <b v-else class="cam-face fb">{{ 户静态表[m].妻名[0] }}</b>
          <span class="cam-main">
            <b>{{ m }} 室 · {{ 户静态表[m].妻名 }}</b>
            <em>调出画面</em>
          </span>
          <span class="cam-rec">● REC</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
/* 监控 gal 化(2026-07-17):紫调 hero + 头像行 + REC 呼吸点（完整移动自 App.vue） */
.shop-hero.cams {
  background:
    linear-gradient(180deg, rgba(20, 22, 30, 0.1), rgba(20, 22, 30, 0.45)),
    linear-gradient(130deg, #8c73ff, #4ab7ff 70%);
}

.cam-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 8px;
  font-family: inherit;
  text-align: left;
  background: var(--glass);
  border: 1px solid rgba(140, 115, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(140, 115, 255, 0.12);
  transition: all 0.18s;
}

.cam-row:hover:not(:disabled) {
  border-color: rgba(140, 115, 255, 0.7);
  box-shadow: 0 6px 16px rgba(140, 115, 255, 0.25);
}

.cam-row:disabled {
  opacity: 0.55;
  cursor: default;
}

.cam-room {
  box-sizing: border-box;
  flex: none;
  width: 72px;
  height: 46px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 7px;
  filter: saturate(0.72) contrast(1.04);
  box-shadow: 0 2px 8px rgba(25, 24, 34, 0.18);
}

.cam-room.fb {
  display: grid;
  place-items: center;
  color: var(--ink-faint);
  font: 700 0.72em/1 var(--font-mono);
  background: linear-gradient(135deg, rgba(140, 115, 255, 0.12), rgba(74, 183, 255, 0.12));
}

.cam-face {
  box-sizing: border-box;
  flex: none;
  width: 42px;
  height: 42px;
  border: 2px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: linear-gradient(160deg, #ffe3ee, #ffd0e2);
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.2);
}

.cam-face.fb {
  display: grid;
  place-items: center;
  font-style: normal;
  color: #d4407a;
}

.cam-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cam-main b {
  font-size: 0.88em;
  color: var(--ink);
}

.cam-main em {
  font-style: normal;
  font-size: 0.72em;
  color: var(--ink-faint);
}

.cam-rec {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.68em;
  font-weight: 700;
  color: var(--red);
  animation: rec-blink 1.6s infinite;
}

@keyframes rec-blink {
  50% {
    opacity: 0.35;
  }
}

:global(html.rq-dark) .cam-row {
  background: #2c2e40;
}


.borrow-seed-offline {
  width: 100%;
  min-height: 74px;
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px;
  color: var(--ink-soft);
  text-align: left;
  background: rgba(17, 22, 25, 0.92);
  border: 1px solid rgba(159, 184, 188, 0.38);
  border-radius: 12px;
  cursor: pointer;
  touch-action: manipulation;
}
.borrow-seed-offline-screen {
  min-height: 52px;
  display: grid;
  place-items: center;
  align-content: center;
  color: rgba(222, 235, 235, 0.82);
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,.055) 0 1px, transparent 1px 3px),
    #111719;
  border-radius: 7px;
  font-family: var(--font-mono);
}
.borrow-seed-offline-screen b { font-size: .68em; letter-spacing: .08em; }
.borrow-seed-offline-screen em { font-size: .58em; font-style: normal; opacity: .72; }
.borrow-seed-offline > span:last-child { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.borrow-seed-offline > span:last-child b { color: #e1eceb; font-size: .78em; }
.borrow-seed-offline > span:last-child small { color: #a5b4b4; font-size: .66em; line-height: 1.45; }
@media (max-width: 540px) {
  .borrow-seed-offline { grid-template-columns: 82px minmax(0, 1fr); min-height: 78px; }
}
</style>
