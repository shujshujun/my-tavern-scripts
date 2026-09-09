<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import type { 通关成绩 } from '../../../通关纪念存档';
const 庆典CG = 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg5/rq091/settlement/' + encodeURIComponent('全员通关庆典.webp');

const props = defineProps<{
  current: 通关成绩;
  first: 通关成绩 | null;
  celebration: 通关成绩 | null;
  saving: boolean;
  error: string;
}>();
const emit = defineEmits<{ close: [] }>();
const 根 = ref<HTMLElement | null>(null);
const 查看首次 = ref(Boolean(props.first && !props.celebration));
const 图失败 = ref(false);
const 图加载中 = ref(true);
const 图重试 = ref(0);
const 展示 = computed(() => (查看首次.value && props.first ? props.first : (props.celebration ?? props.current)));
const 全员完成 = computed(() => 展示.value.角色.every(项 => 项.完成));
const 已通关 = computed(() => Boolean(props.first || props.celebration));
const 是晋级 = computed(() => props.celebration && props.first && props.celebration.评级 !== props.first.评级);
const 标题 = computed(() =>
  props.celebration ? (是晋级.value ? '成就再进一步' : '全员结局达成') : 已通关.value ? '通关纪念' : '旅程进度',
);
const 评级名称 = { C: '初入公寓', B: '渐入佳境', A: '故事深处', S: '全员通关', SS: '深度探索', SSS: '璀璨终章' };
const 下一档 = computed(() =>
  展示.value.评级 === 'SSS' ? null : 展示.value.探索分 >= 40 ? { 名称: 'SSS', 分数: 80 } : { 名称: 'SS', 分数: 40 },
);
let 原焦点: HTMLElement | null = null;

function 关闭() {
  if (!props.saving) emit('close');
}
function 键盘(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    关闭();
    return;
  }
  if (event.key !== 'Tab') return;
  const 元素 = [
    ...(根.value?.querySelectorAll<HTMLElement>('button:not(:disabled), summary, a[href], [tabindex="0"]') ?? []),
  ].filter(项 => 项.getClientRects().length > 0);
  if (!元素.length) {
    event.preventDefault();
    根.value?.focus();
    return;
  }
  const index = 元素.indexOf(document.activeElement as HTMLElement);
  if (event.shiftKey && index <= 0) {
    event.preventDefault();
    元素.at(-1)?.focus();
  } else if (!event.shiftKey && (index < 0 || index === 元素.length - 1)) {
    event.preventDefault();
    元素[0]?.focus();
  }
}
onMounted(async () => {
  原焦点 = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  await nextTick();
  根.value?.focus();
});
onUnmounted(() => {
  if (原焦点?.isConnected) void nextTick(() => 原焦点?.focus());
});
</script>

<template>
  <div class="settlement-backdrop">
    <section
      ref="根"
      class="settlement"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settlement-title"
      tabindex="-1"
      @keydown="键盘"
    >
      <header class="settlement-header">
        <div>
          <h1 id="settlement-title">{{ 标题 }}</h1>
          <p>
            {{ 已通关 ? '六个人的结局，五条故事的终点。属于你的公寓，生活继续。' : '每一次相遇，都让这段旅程更完整。' }}
          </p>
        </div>
        <button class="close-button" type="button" aria-label="关闭结算，返回公寓" :disabled="saving" @click="关闭">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </header>

      <div class="settlement-scroll">
        <figure v-if="已通关" class="celebration-art" :aria-busy="图加载中">
          <img
            v-if="!图失败"
            :key="图重试"
            :src="庆典CG"
            alt="夏乔、许曼君、母亲、沈静仪、周小满与安若妍身着庆典礼装，在公寓前共同庆祝通关"
            @load="图加载中 = false"
            @error="
              图失败 = true;
              图加载中 = false;
            "
          />
          <div v-if="图失败" class="art-fallback">
            <p>庆典画面暂未载入，通关成绩已保留。</p>
            <button
              type="button"
              @click="
                图失败 = false;
                图加载中 = true;
                图重试++;
              "
            >
              重新载入画面
            </button>
          </div>
        </figure>

        <div class="rank-stage" :class="{ 'with-art': 已通关, celebrating: celebration }">
          <svg class="rank-wreath" viewBox="0 0 300 125" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M96 110C39 91 40 49 64 18M204 110c57-19 56-61 32-92" />
              <path
                v-for="i in 5"
                :key="i"
                :d="`M${65 - Math.sin((i / 5) * 3.14) * 17} ${22 + i * 15}q-26 -9 -24 -25q25 2 24 25m0 0q23 -3 21 -22q-23 3 -21 22`"
              />
              <path
                v-for="i in 5"
                :key="`r${i}`"
                :d="`M${235 + Math.sin((i / 5) * 3.14) * 17} ${22 + i * 15}q26 -9 24 -25q-25 2 -24 25m0 0q-23 -3 -21 -22q23 3 21 22`"
              />
            </g>
          </svg>
          <strong class="rank-letter">{{ 展示.评级 }}</strong>
          <span class="rank-name">{{ 评级名称[展示.评级] }}</span>
        </div>

        <div v-if="first" class="record-switch" aria-label="选择成绩记录">
          <button type="button" :aria-pressed="查看首次" @click="查看首次 = true">首次通关</button>
          <button type="button" :aria-pressed="!查看首次" @click="查看首次 = false">
            {{ celebration ? '本次成绩' : '当前进度' }}
          </button>
        </div>
        <p class="record-date">
          第 {{ 展示.天数 }} 天 ·
          {{ 查看首次 ? '首次成绩永久保存在本局存档' : 全员完成 ? '全员结局已经完成' : '故事正在继续' }}
        </p>

        <dl class="settlement-stats">
          <div>
            <dt>历经天数</dt>
            <dd>{{ 展示.天数 }}<small>天</small></dd>
          </div>
          <div>
            <dt>角色结局</dt>
            <dd>{{ 展示.角色.filter(项 => 项.完成).length }}<small>/ 6</small></dd>
          </div>
          <div>
            <dt>特殊剧情</dt>
            <dd>{{ 展示.特殊剧情.length }}<small>种</small></dd>
          </div>
          <div>
            <dt>本局CG</dt>
            <dd>{{ 展示.CG数 }}<small>张</small></dd>
          </div>
        </dl>

        <section class="ending-roster" aria-labelledby="settlement-endings-title">
          <div class="section-heading">
            <h2 id="settlement-endings-title">她们的故事</h2>
            <span>{{ 展示.结局线路数 }} / 5 条结局线</span>
          </div>
          <ol>
            <li v-for="角色 in 展示.角色" :key="角色.门牌" :class="{ complete: 角色.完成 }">
              <span class="role-door">{{ 角色.门牌 }}</span>
              <div class="role-copy">
                <h3>
                  {{ 角色.姓名 }}<span>{{ 角色.完成 ? `《${角色.结局}》` : `阶段 ${角色.阶段} / 5` }}</span>
                </h3>
                <p>{{ 角色.归宿 || '这条故事仍在等待你的下一步。' }}</p>
              </div>
              <svg v-if="角色.完成" class="completion-mark" viewBox="0 0 24 24" role="img" aria-label="结局已完成">
                <path d="m5 12 4 4L19 6" />
              </svg>
            </li>
          </ol>
          <p class="roster-note">沈静仪与周小满共同完成《录像带》，按一条结局线记录。</p>
        </section>

        <section class="exploration" aria-labelledby="settlement-explore-title">
          <div class="section-heading">
            <h2 id="settlement-explore-title">探索成就</h2>
            <span>{{ 展示.探索分 }} / 100</span>
          </div>
          <p class="next-rank">
            {{
              !全员完成
                ? '完成全员结局即可获得 S；探索成果会继续计入更高评级。'
                : 下一档
                  ? `距离 ${下一档.名称} 还需 ${Math.max(0, 下一档.分数 - 展示.探索分)} 探索分。继续生活，也能继续晋级。`
                  : 'SSS 已达成，这段旅程值得珍藏。'
            }}
          </p>
          <ul>
            <li v-for="项 in 展示.探索项" :key="项.名称">
              <div class="explore-label">
                <b>{{ 项.名称 }}</b
                ><span>{{ 项.分数 }} / {{ 项.上限 }} 分</span>
              </div>
              <progress :value="项.分数" :max="项.上限" :aria-label="`${项.名称}：${项.分数}分，上限${项.上限}分`" />
              <p>
                {{ 项.说明
                }}<span
                  >已记录 {{ 项.数量
                  }}{{ 项.名称 === '本局CG' ? ' 张' : 项.名称 === '服饰收藏' ? ' 件' : ' 场' }}。</span
                >
              </p>
            </li>
          </ul>
          <details>
            <summary>评级与记录规则</summary>
            <p>
              C → B → A 随角色阶段与结局推进提升；全员结局获得 S，探索分达到40获得 SS，达到80获得
              SSS。服饰和CG可以在通关后继续收集。
            </p>
            <p>
              特殊剧情按已经完成的不同内容去重。CG从本功能接入后、在本局正文中实际加载成功的画面开始记录；跨存档图库与图库全览不计入本局。
            </p>
          </details>
        </section>
      </div>

      <footer class="settlement-footer">
        <p v-if="error" class="save-error" role="alert">{{ error }}</p>
        <p v-else>{{ celebration ? '这一刻值得纪念。下一页，由你继续。' : '每次归来，都有新的故事。' }}</p>
        <button class="continue-button" type="button" :disabled="saving" @click="关闭">
          {{ saving ? '正在保存纪念…' : 已通关 ? '继续游玩' : '返回公寓'
          }}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.settlement-backdrop {
  position: fixed;
  inset: 0;
  z-index: 260;
  display: grid;
  place-items: center;
  padding: 14px;
  background: rgb(4 8 18 / 86%);
  color: #f6eedf;
}
.settlement {
  --gold: #f3ce86;
  --muted-gold: #d6c7ab;
  display: flex;
  flex-direction: column;
  width: min(1180px, 100%);
  max-height: calc(100dvh - 28px);
  overflow: hidden;
  border: 1px solid #786344;
  border-radius: 14px;
  background: #111723;
  font-family: var(--font-body, sans-serif);
  outline: none;
}
.settlement ::selection {
  background: #f3ce86;
  color: #111723;
}
.settlement button {
  font: inherit;
  cursor: pointer;
}
.settlement button:disabled {
  cursor: wait;
  opacity: 0.65;
}
.settlement button:focus-visible,
.settlement summary:focus-visible {
  outline: 2px solid #f3ce86;
  outline-offset: 4px;
}
.settlement-header {
  position: relative;
  flex: none;
  padding: 23px 64px 20px;
  text-align: center;
}
.settlement-header h1 {
  margin: 0;
  color: #fff0cf;
  font-family: var(--font-prose, serif);
  font-size: clamp(24px, 3.2vw, 38px);
  line-height: 1.3;
  letter-spacing: 0.08em;
}
.settlement-header p {
  margin: 9px 0 0;
  color: var(--muted-gold);
  font-size: 13px;
  line-height: 1.6;
}
.close-button {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid #6f6659;
  border-radius: 10px;
  color: #fff0cf;
  background: #222735;
}
.close-button:hover {
  background: #343544;
}
.settlement svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.close-button svg,
.continue-button svg {
  width: 22px;
  height: 22px;
}
.settlement-scroll {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #a89166 #111723;
}
.celebration-art {
  width: 100%;
  margin: 0;
  position: relative;
  aspect-ratio: 1672 / 941;
  max-height: min(43dvh, 540px);
  background: #131d31;
}
.celebration-art img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 20%;
}
.art-fallback {
  display: grid;
  place-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;
  color: var(--muted-gold);
}
.art-fallback button {
  justify-self: center;
  padding: 12px 18px;
  color: #f3ce86;
  border: 1px solid #786344;
  background: #151e2e;
  border-radius: 10px;
}
.rank-stage {
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  min-height: 144px;
  padding: 18px 0 12px;
  text-align: center;
}
.rank-stage.with-art {
  margin-top: -62px;
}
.rank-stage.with-art::before {
  position: absolute;
  z-index: -1;
  inset: 20px 0 0;
  content: '';
  background: linear-gradient(transparent, #111723 45%);
}
.rank-letter {
  position: relative;
  color: var(--gold);
  font-family: var(--font-display, serif);
  font-weight: 900;
  font-size: clamp(64px, 9vw, 96px);
  line-height: 1;
  letter-spacing: -0.035em;
  text-shadow: 0 4px 18px #050914;
}
.rank-wreath {
  position: absolute;
  inset: 0;
  margin: auto;
  width: min(310px, 85%);
  height: 126px;
  color: #c7a567;
  opacity: 0.9;
}
.rank-name {
  position: relative;
  color: #fce6b6;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.14em;
}
.celebrating .rank-letter {
  animation: rank-arrival 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes rank-arrival {
  from {
    transform: scale(1.4);
    filter: blur(4px);
    opacity: 0.4;
  }
  to {
    transform: scale(1);
    filter: blur(0);
    opacity: 1;
  }
}
.record-switch {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 13px 20px 0;
}
.record-switch button {
  min-height: 40px;
  border: 1px solid #766448;
  border-radius: 8px;
  padding: 8px 18px;
  color: var(--muted-gold);
  background: transparent;
}
.record-switch button[aria-pressed='true'] {
  color: #1b1b1b;
  background: #f3ce86;
  border-color: #f3ce86;
}
.record-date {
  text-align: center;
  color: var(--muted-gold);
  font-size: 12px;
  margin: 13px 18px 24px;
}
.settlement-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 0 36px 34px;
  padding: 22px 0;
  border-top: 1px solid #3c3c43;
  border-bottom: 1px solid #3c3c43;
  text-align: center;
}
.settlement-stats dt {
  color: var(--muted-gold);
  font-size: 13px;
}
.settlement-stats dd {
  margin: 6px 0 0;
  color: #fff1d4;
  font-size: 34px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.settlement-stats small {
  margin-left: 6px;
  font-size: 13px;
  font-weight: 400;
  color: var(--muted-gold);
}
.ending-roster,
.exploration {
  margin: 0 36px 32px;
}
.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.section-heading h2 {
  margin: 0;
  color: #fff1d4;
  font-size: 20px;
  font-family: var(--font-prose, serif);
}
.section-heading > span {
  flex: none;
  color: var(--muted-gold);
  font-size: 13px;
}
.ending-roster ol {
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 30px;
  list-style: none;
}
.ending-roster li {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 102px;
  padding: 15px 0;
  border-bottom: 1px solid #303643;
}
.role-door {
  color: #f3ce86;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.role-copy {
  flex: 1;
  min-width: 0;
}
.role-copy h3 {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: baseline;
  margin: 0;
  color: #faf0de;
  font-size: 16px;
}
.role-copy h3 span {
  font-size: 12px;
  font-weight: 400;
  color: #d6c7ab;
}
.role-copy p {
  margin: 8px 0 0;
  color: #d2c9b8;
  font-size: 12px;
  line-height: 1.7;
}
.completion-mark {
  width: 20px;
  height: 20px;
  flex: none;
  color: #f3ce86;
}
.roster-note {
  color: #d6c7ab;
  font-size: 12px;
  line-height: 1.7;
  margin: 12px 0 0;
}
.next-rank {
  color: #f3ce86;
  font-size: 13px;
  line-height: 1.7;
  margin: 0 0 18px;
}
.exploration ul {
  padding: 0;
  margin: 0;
  list-style: none;
}
.exploration li {
  padding: 14px 0;
}
.explore-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  font-size: 14px;
}
.explore-label span {
  font-size: 12px;
  color: #e3d2b3;
}
.exploration progress {
  width: 100%;
  height: 5px;
  margin: 10px 0 0;
  display: block;
  accent-color: #eac076;
  border: none;
  border-radius: 3px;
  overflow: hidden;
  background: #343947;
}
.exploration progress::-webkit-progress-bar {
  background: #343947;
}
.exploration progress::-webkit-progress-value {
  background: #eac076;
}
.exploration progress::-moz-progress-bar {
  background: #eac076;
}
.exploration li p {
  color: #d6c7ab;
  font-size: 12px;
  line-height: 1.7;
  margin: 8px 0 0;
}
.exploration li p span {
  margin-left: 5px;
}
.exploration details {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #303643;
  color: #d6c7ab;
  font-size: 12px;
  line-height: 1.8;
}
.exploration summary {
  cursor: pointer;
  color: #f3ce86;
  min-height: 32px;
}
.exploration details p {
  max-width: 72ch;
}
.settlement-footer {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 30px;
  border-top: 1px solid #514634;
  background: #151b27;
}
.settlement-footer p {
  margin: 0;
  color: #d6c7ab;
  font-size: 12px;
  line-height: 1.7;
}
.settlement-footer .save-error {
  color: #ffc1b4;
}
.continue-button {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 46px;
  min-width: 160px;
  padding: 10px 22px;
  border: 1px solid #f3ce86;
  border-radius: 10px;
  color: #171923;
  background: #f3ce86;
  font-weight: 700 !important;
}
.continue-button:hover:not(:disabled) {
  background: #ffe1a8;
}
@media (prefers-reduced-motion: reduce) {
  .celebrating .rank-letter {
    animation: none;
  }
}
@media (max-width: 600px) {
  .celebration-art {
    max-height: none;
  }
  .settlement-backdrop {
    padding: 0;
  }
  .settlement {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border: 0;
    border-radius: 0;
  }
  .settlement-header {
    padding: max(20px, env(safe-area-inset-top)) 50px 17px 20px;
    text-align: left;
  }
  .settlement-header h1 {
    font-size: 26px;
    letter-spacing: 0.03em;
  }
  .settlement-header p {
    font-size: 12px;
  }
  .close-button {
    right: 12px;
    top: max(18px, env(safe-area-inset-top));
    width: 34px;
    height: 34px;
  }
  .rank-stage.with-art {
    margin-top: -22px;
  }
  .rank-stage {
    min-height: 120px;
    padding-top: 16px;
  }
  .rank-wreath {
    width: 240px;
    height: 105px;
  }
  .settlement-stats {
    gap: 8px;
    margin: 0 20px 27px;
    padding: 18px 0;
  }
  .settlement-stats dt {
    font-size: 11px;
  }
  .settlement-stats dd {
    font-size: 26px;
  }
  .settlement-stats small {
    font-size: 11px;
    margin-left: 3px;
  }
  .ending-roster,
  .exploration {
    margin: 0 20px 28px;
  }
  .ending-roster ol {
    grid-template-columns: 1fr;
  }
  .ending-roster li {
    min-height: 92px;
  }
  .settlement-footer {
    padding: 12px 20px max(14px, env(safe-area-inset-bottom));
    flex-wrap: wrap;
    gap: 9px;
  }
  .settlement-footer p {
    width: 100%;
    text-align: center;
  }
  .continue-button {
    width: 100%;
  }
}
</style>
