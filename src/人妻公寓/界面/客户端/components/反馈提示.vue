<script setup lang="ts">
// 反馈浮层：toast + 拾获卡。业务状态(提示文本/拾获卡/提示timer/弹提示)与事件总线写入全留 App；
// 组件只展示并 emit 收下。多根直接输出两个 absolute 节点，不加会改变定位参照或 z-index 的包装层。
defineProps<{ toast: string; loot: string; sending: boolean }>();
const emit = defineEmits<{ dismissLoot: [] }>();
</script>

<template>
  <div v-if="toast" class="toast">{{ toast }}</div>

  <!-- 拾获卡(2026-07-17 用户反馈:翻出东西不能一闪而过)——带【】的重要提示
       (线索/收获类)升级成点击才收下的 gal 卡,普通提示仍走 toast -->
  <div v-if="loot && !sending" class="loot-card" title="点击收下" @click="emit('dismissLoot')">
    <div class="ui-kicker">FOUND / 拾获</div>
    <p>{{ loot }}</p>
    <span class="loot-hint">点击收下</span>
  </div>
</template>

<style scoped>
/* 反馈浮层样式：完整移动自 App.vue（.toast / .loot-card 全组 / dark toast+loot / 两个 keyframes）。
   需复制 .ui-kicker 基础声明（避免为反馈引入 .mask/.sheet 大量无关 CSS）；card-pop-in 在 App 仍被
   其他卡使用不能删，这里复制同名 keyframes 的现有 from 声明，确保 scoped 动画名重写后仍存在。 */

.ui-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  text-transform: uppercase;
}

.toast {
  position: absolute;
  box-sizing: border-box;
  left: 50%;
  bottom: 70px;
  transform: translateX(-50%);
  z-index: 40;
  width: max-content;
  max-width: calc(100% - 24px);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 79, 154, 0.4);
  border-radius: 14px;
  color: var(--ink);
  font-size: 0.8em;
  font-weight: 600;
  line-height: 1.45;
  padding: 7px 20px;
  text-align: left;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  box-shadow: 0 10px 26px rgba(30, 26, 38, 0.25);
  animation: toast-pop 0.25s ease;
}

/* 拾获卡:线索/收获的正经展示位——驻留到点击,金边纸卡(信物感),压 toast 一层 */
.loot-card {
  position: absolute;
  box-sizing: border-box;
  left: 50%;
  bottom: 110px;
  transform: translateX(-50%);
  z-index: 41;
  width: max-content;
  max-width: min(86%, 420px);
  background: rgba(255, 252, 240, 0.97);
  border: 1.5px solid rgba(255, 202, 53, 0.85);
  border-radius: 14px;
  color: var(--ink);
  padding: 11px 16px 9px;
  cursor: pointer;
  box-shadow: 0 12px 32px rgba(30, 26, 38, 0.28);
  animation: card-pop-in 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.loot-card p {
  margin: 3px 0 4px;
  font-size: 0.86em;
  font-weight: 600;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.loot-card .loot-hint {
  display: block;
  text-align: right;
  font-size: 0.68em;
  opacity: 0.55;
}

:global(html.rq-dark) .loot-card {
  background: rgba(44, 46, 64, 0.97);
  border-color: rgba(255, 202, 53, 0.45);
  color: #e8e6f0;
}

@keyframes toast-pop {
  from {
    transform: translate(-50%, 8px);
    opacity: 0;
  }
}

/* card-pop-in 在 App 仍被其他卡使用；这里复制同名 keyframes 的现有 from 声明 */
@keyframes card-pop-in {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.94);
  }
}

:global(html.rq-dark) .toast {
  background: rgba(38, 40, 56, 0.97);
}

/* ── 减少动效:关掉全局过渡与动画(组件内部 DOM 同样服从 rq-still) ── */
:global(html.rq-still) *,
:global(html.rq-still) *::before,
:global(html.rq-still) *::after {
  animation-duration: 0.001s !important;
  transition-duration: 0.001s !important;
}
</style>
