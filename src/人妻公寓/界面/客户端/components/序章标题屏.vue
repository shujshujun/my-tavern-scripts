<script setup lang="ts">
// 序章标题屏（App A4 从 App.vue 等价外移）：全屏立面 KV + 纹章 logo + 竖排木牌主菜单 + 难度三档选择。
// 纯展示/局部交互组件：不 import App、不 eventEmit、不直接调用 useUIPrefs 或首次准备状态；
// 三条跨区块动作（开始新游戏/首次说明/设置）只 emit，由 App 接线。
import { ref } from 'vue';
import { 难度表 } from '../../../stageConfig';
import { 素材基址 } from '../assets';

defineProps<{
  sending: boolean;
  scriptAlive: boolean;
}>();

const emit = defineEmits<{ start: [难度: string]; openSetup: []; openSettings: [] }>();

// 难度三档局部状态（标题屏:false=主菜单(开始游戏/设置),true=难度选择）
const 选中难度 = ref('');
const 难度展开 = ref(false);
const 难度卡 = Object.values(难度表);
</script>

<template>
  <!-- ═══════════ 序章标题屏(gal タイトル:全屏立面KV + 纹章logo + 竖排木牌菜单) ═══════════ -->
  <div class="title-screen" :style="{ '--kv-img': `url(${素材基址}/地图/立面_傍晚.webp)` }">
    <div class="title-hero">
      <img
        class="title-emblem"
        :src="`${素材基址}/界面/纹章.webp`"
        alt=""
        draggable="false"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
      <div class="ui-kicker light">WUTONGLI APARTMENT / PRODUCED BY DAD</div>
      <h1>人妻公寓</h1>
      <p>十六把钥匙,六户人家,一栋楼的关起门来。<br />父亲的考验,今天开始。</p>
    </div>

    <!-- 菜单:木牌按钮融进画面。难度未选=展开难度选择,已选=显主菜单 -->
    <div class="title-menu" :style="{ '--plaque': `url(${素材基址}/界面/按钮底.webp)` }">
      <template v-if="!难度展开">
        <button class="plaque main" :disabled="sending" @click="难度展开 = true">
          <span class="pl-main">开始游戏</span>
          <span class="pl-sub">START</span>
        </button>
        <button class="plaque setup-entry" @click="emit('openSetup')">
          <span class="pl-main">首次游玩说明</span>
          <span class="pl-sub">INSTALL &amp; DATABASE</span>
        </button>
        <button class="plaque" @click="emit('openSettings')">
          <span class="pl-main">设置</span>
          <span class="pl-sub">OPTIONS</span>
        </button>
      </template>
      <template v-else>
        <div class="ui-kicker light center">SELECT DIFFICULTY / 先看看父亲的心情</div>
        <button
          v-for="档 in 难度卡"
          :key="档.名称"
          class="plaque diff"
          :class="{ chosen: 选中难度 === 档.名称 }"
          @click="选中难度 = 档.名称"
        >
          <span class="pl-main">{{ 档.名称 }}</span>
          <span class="pl-note">{{ 档.说明 }}</span>
          <span class="pl-meta">¥{{ 档.起始资金 }}</span>
        </button>
        <div class="title-acts">
          <button
            class="btn ghost"
            :disabled="sending"
            @click="
              难度展开 = false;
              选中难度 = '';
            "
          >
            返回
          </button>
          <button class="btn rite" :disabled="!选中难度 || sending" @click="emit('start', 选中难度)">
            {{ sending ? '电话接通中……' : '接起父亲的电话' }}
          </button>
        </div>
      </template>
    </div>

    <p class="heartbeat title-beat" :class="{ dead: !scriptAlive }">
      {{ scriptAlive ? '✓ 游戏逻辑脚本心跳正常' : '✗ 未检测到游戏逻辑脚本(请确认脚本已启用)' }}
    </p>
  </div>
</template>

<style scoped>
/* ═══ 序章标题屏(gal タイトル:全屏立面KV + 纹章 + 竖排木牌菜单) ═══
   专属规则完整移动自 App.vue(A4)；开头 .ui-kicker/.btn/.heartbeat 为 scoped 边界
   复制的通用声明（顺序对齐 App 原 CSS：通用在前，标题专属在后，保证 .title-beat
   的 margin-top:12px 覆盖 .heartbeat 的 margin-top:auto），App 仍保留原规则。
   底部 rq-lite / rq-still 保证标题组件继续服从省流与减动效。 */

.ui-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  text-transform: uppercase;
}

.ui-kicker.light {
  color: rgba(255, 255, 255, 0.82);
}

.ui-kicker.center {
  text-align: center;
}

.btn {
  padding: 6px 18px;
  font-family: inherit;
  font-size: 0.92em;
  font-weight: 600;
  color: var(--ink);
  background: var(--glass);
  border: 1px solid var(--line);
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.08);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(38, 169, 244, 0.6);
  box-shadow: 0 8px 20px rgba(38, 169, 244, 0.22);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.42;
  cursor: default;
}

.btn.rite {
  align-self: center;
  padding: 8px 32px;
  font-size: 0.95em;
  letter-spacing: 0.16em;
  color: #fff;
  background: linear-gradient(180deg, #ff6cab, #ff4f9a);
  border-color: rgba(255, 79, 154, 0.5);
  box-shadow: 0 8px 22px rgba(255, 79, 154, 0.35);
}

.btn.rite:hover:not(:disabled) {
  border-color: rgba(255, 79, 154, 0.85);
  box-shadow: 0 12px 26px rgba(255, 79, 154, 0.42);
}

.btn.ghost {
  background: transparent;
  border: 1px solid var(--line-soft);
  color: var(--ink-soft);
}

.heartbeat {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.68em;
  color: var(--green);
  text-align: center;
  margin-top: auto;
}

.heartbeat.dead {
  color: var(--red);
}

.title-screen {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: var(--shadow);
  overflow: hidden auto;
  color: #fff;
  padding: 22px 18px 14px;
  /* 立面傍晚 KV 全屏铺满;顶暗底暗保标题与按钮可读;三色渐变兜底 */
  background:
    linear-gradient(180deg, rgba(20, 22, 30, 0.35), rgba(20, 22, 30, 0.2) 34%, rgba(20, 22, 30, 0.72)),
    var(--kv-img, none) center top / cover no-repeat,
    linear-gradient(150deg, #ff8ab9, #4ab7ff 48%, #ffd24f);
}

.title-hero {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.title-emblem {
  width: 96px;
  height: 96px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(20, 22, 30, 0.5));
  margin-bottom: 4px;
}

.title-hero h1 {
  margin: 4px 0 8px;
  font-size: clamp(30px, 8vw, 44px);
  font-weight: 900;
  letter-spacing: 0.16em;
  line-height: 1.05;
  text-shadow: 0 2px 14px rgba(20, 22, 30, 0.6);
}

.title-hero p {
  margin: 0;
  font-size: 0.8em;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 6px rgba(20, 22, 30, 0.55);
}

.title-menu {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: auto;
  padding-top: 20px;
}

/* 木牌按钮:水彩牌底铺满,文字排在上面(牌底挂了=退回半透明玻璃条) */
.plaque {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 100%;
  min-height: 52px;
  padding: 10px 16px;
  font-family: inherit;
  color: #4a3f2e;
  background:
    var(--plaque, none) center / 100% 100% no-repeat,
    rgba(255, 250, 242, 0.86);
  border: none;
  border-radius: 12px;
  filter: drop-shadow(0 4px 10px rgba(20, 22, 30, 0.32));
  cursor: pointer;
  transition:
    transform 0.16s,
    filter 0.16s;
}

.plaque:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: drop-shadow(0 7px 16px rgba(255, 180, 90, 0.5));
}

.plaque:disabled {
  opacity: 0.5;
  cursor: default;
}

.plaque .pl-main {
  font-size: 1.02em;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.plaque .pl-sub {
  font-family: var(--font-mono);
  font-size: 0.6em;
  letter-spacing: 0.24em;
  color: #9a8a6a;
}

.plaque.main .pl-main {
  color: #b03a6a;
}

.plaque.setup-entry {
  min-height: 48px;
  background: linear-gradient(90deg, rgba(255, 249, 237, 0.92), rgba(242, 250, 255, 0.92)), rgba(255, 250, 242, 0.9);
  border: 1px solid rgba(255, 212, 124, 0.5);
}

.plaque.setup-entry .pl-main {
  color: #7b5a24;
  font-size: 0.9em;
}

.plaque.setup-entry .pl-sub {
  color: #8c8068;
}

/* 难度木牌:横排(名+说明+金额) */
.plaque.diff {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  text-align: left;
  min-height: 58px;
}

.plaque.diff .pl-main {
  flex: none;
  font-size: 0.94em;
  letter-spacing: 0.12em;
}

.plaque.diff .pl-note {
  flex: 1;
  font-size: 0.68em;
  line-height: 1.45;
  color: #6a5c46;
  font-weight: 600;
}

.plaque.diff .pl-meta {
  flex: none;
  font-family: var(--font-display);
  font-size: 0.9em;
  color: #b03a6a;
}

.plaque.diff.chosen {
  filter: drop-shadow(0 8px 20px rgba(255, 79, 154, 0.6));
  transform: translateY(-2px);
}

.plaque.diff.chosen::after {
  content: '✓';
  position: absolute;
  top: 6px;
  right: 10px;
  font-size: 0.8em;
  font-weight: 900;
  color: #b03a6a;
}

.title-acts {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.title-acts .btn {
  flex: 1;
}

.title-beat {
  flex: none;
  text-align: center;
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* ── 省流模式:标题屏关掉 KV 位图 ── */
:global(html.rq-lite) .title-screen {
  --kv-img: none !important;
}

/* ── 减少动效:关掉全局过渡与动画(标题组件内部 DOM 同样服从 rq-still) ── */
:global(html.rq-still) *,
:global(html.rq-still) *::before,
:global(html.rq-still) *::after {
  animation-duration: 0.001s !important;
  transition-duration: 0.001s !important;
}
</style>
