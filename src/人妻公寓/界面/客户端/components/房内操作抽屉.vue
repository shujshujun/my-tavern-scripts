<script setup lang="ts">
/**
 * 房内操作抽屉（手机端房内操作上滑抽屉）。
 *
 * 包住「翻垃圾」入口与普通房间动作瓷砖；桌面保持原流式两列布局，手机在流内只留一个
 * 44px 把手，面板绝对定位向上覆盖正文，不参与正文高度计算。展开/自动收起/新增提示等
 * 纯 UI 临时状态由 composables/抽屉状态机.ts 承载，动作点击后直接调用原回调并立即收起，
 * 不包装、不等待、不重放；垃圾选择弹窗仍在 App，本组件只发 openGarbage 事件。
 */
import { computed, reactive, watchEffect, onScopeDispose } from 'vue';
import Ic from './Icon.vue';
import { 创建抽屉状态机, type 抽屉状态, type 抽屉状态机 } from '../composables/抽屉状态机';
import type { 卡动作 } from '../types';

const props = defineProps<{
  mobile: boolean;
  roomId: string | null;
  actionCount: number;
  suppressed: boolean;
  actions: 卡动作[];
  garbageVisible: boolean;
  videoTapeActive: boolean;
}>();

const emit = defineEmits<{ openGarbage: [] }>();

const 状态 = reactive<抽屉状态>({ 展开: false, 新增提示: false });
const 机器: 抽屉状态机 = 创建抽屉状态机({ 状态 });

// 单一响应式入口：进入房间与 actionCount 可能同一 tick 更新，全量输入交给状态机自行比对。
watchEffect(() => {
  机器.更新({
    mobile: props.mobile,
    roomId: props.roomId,
    actionCount: props.actionCount,
    suppressed: props.suppressed,
  });
});

onScopeDispose(() => 机器.销毁());

// 普通动作仍按旧语义只受「录像带中」门控；垃圾入口原 v-if 没有录像带门控，两类门互不合并。
const 普通动作可见 = computed(() => !props.videoTapeActive && props.actions.length > 0);
const 有可见动作 = computed(() => props.garbageVisible || 普通动作可见.value);
// 晨跑/健身是地点的主操作，不是可有可无的二级菜单。0.74 抽屉化后自动收起会让公园
// 的 TRAIN 瓷砖看起来凭空消失；手机端只要主训练仍可执行，就保持面板可见。
const 有主训练动作 = computed(() => props.mobile && props.actions.some(动作 => 动作.kicker === 'TRAIN'));

function 触发动作(动作: 卡动作): void {
  机器.手动收起(); // 点击任一房内动作后收起；不包装、不等待原回调
  动作.做();
}

function 触发垃圾(): void {
  机器.手动收起();
  emit('openGarbage');
}

function 切换(): void {
  if (状态.展开) 机器.手动收起();
  else 机器.手动展开();
}

function 面板交互(): void {
  if (props.mobile) 机器.交互取消自动计时();
}
</script>

<template>
  <div v-if="有可见动作 && !suppressed" class="in-room-acts" :class="{ 'drawer-open': mobile && 状态.展开 }">
    <!-- 手机：流内只留把手，面板向上覆盖 -->
    <button
      v-if="mobile"
      type="button"
      class="drawer-handle"
      :aria-expanded="状态.展开"
      aria-controls="in-room-acts-panel"
      @pointerdown="机器.交互取消自动计时"
      @focus="机器.交互取消自动计时"
      @click="切换"
    >
      <Ic n="arrow" class="handle-arrow" />
      <span class="handle-label">房内操作 · {{ actionCount }}项</span>
      <transition name="new-hint">
        <span v-if="状态.新增提示" class="new-hint">新增操作</span>
      </transition>
    </button>

    <!-- 桌面保持流内两列；手机在展开时以绝对面板承载同一份瓷砖，不参与正文高度计算 -->
    <transition :name="mobile ? 'drawer' : ''" :css="mobile">
      <div
        v-if="mobile ? 状态.展开 || 有主训练动作 : true"
        id="in-room-acts-panel"
        class="drawer-content"
        :class="{ 'drawer-panel': mobile }"
        :role="mobile ? 'region' : undefined"
        :aria-label="mobile ? '当前房间可执行操作' : undefined"
        @pointerdown="面板交互"
        @focusin="面板交互"
      >
        <div v-if="garbageVisible" class="garbage-pick">
          <button class="tile risky garbage-open" @click="触发垃圾">
            <Ic n="trash" />
            <span class="act-kicker">SEARCH</span>
            <strong>翻垃圾</strong>
            <small>选择对应房间的垃圾袋</small>
          </button>
        </div>
        <div v-if="普通动作可见" class="scene-acts">
          <button v-for="(动作, i) in actions" :key="i" class="tile" :class="动作.类" @click="触发动作(动作)">
            <Ic :n="动作.icon" />
            <span class="act-kicker">{{ 动作.kicker }}</span>
            <strong>{{ 动作.文案 }}</strong>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ── 房内动作根容器：App 的 keyboard-open 隐藏选择器以 .in-room-acts 命中本根 ── */
.in-room-acts {
  position: relative;
  flex: none;
}

/* 桌面与手机面板共用的瓷砖/两列/垃圾入口（自 App 等价迁移，scoped 自持） */
.scene-acts {
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 6px;
}

.scene-acts .tile {
  padding: 8px 10px;
}

.garbage-pick {
  flex: none;
  display: flex;
  margin-top: 6px;
  padding: 0;
}

.garbage-open {
  width: min(230px, 100%);
  min-height: 68px;
  grid-template-columns: 34px 1fr;
  grid-template-rows: auto auto auto;
  text-align: left;
}

.garbage-open .ic {
  grid-row: 1 / -1;
  width: 30px;
  height: 30px;
}

.garbage-open small {
  color: var(--ink-faint);
  font-size: 0.68em;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px 10px;
  font-family: inherit;
  color: var(--ink);
  text-align: center;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.08);
  /* 只过渡 hover 实际变化的属性，不动画布局属性 */
  transition:
    transform 0.16s,
    border-color 0.16s,
    box-shadow 0.16s;
}

.tile .ic {
  width: 30px;
  height: 30px;
  color: var(--blue);
  margin-bottom: 2px;
}

.tile strong {
  font-size: 0.82em;
  font-weight: 700;
  line-height: 1.35;
}

.tile:hover {
  transform: translateY(-2px);
  border-color: rgba(38, 169, 244, 0.55);
  box-shadow: 0 8px 20px rgba(38, 169, 244, 0.22);
}

.tile.risky .ic {
  color: var(--red);
}

.tile.risky:hover {
  border-color: var(--red);
  box-shadow: 0 8px 20px rgba(229, 83, 63, 0.22);
}

.act-kicker {
  font-family: var(--font-mono);
  font-size: var(--font-micro);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.tile.risky .act-kicker {
  color: var(--red);
  opacity: 0.75;
}

:global(html.rq-dark .tile) {
  background: #2c2e40;
}

/* ── 手机抽屉：把手 + 向上覆盖的面板 ── */
.drawer-handle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 44px;
  margin-top: 6px;
  padding: 8px 12px;
  font: 700 0.82em/1.3 inherit;
  color: var(--ink);
  background: linear-gradient(180deg, var(--paper-card), var(--glass));
  border: 1px solid rgba(38, 169, 244, 0.35);
  border-radius: var(--radius);
  cursor: pointer;
  box-shadow: var(--card-shadow);
  -webkit-tap-highlight-color: transparent;
}

.drawer-handle:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}

.drawer-handle .handle-arrow {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--blue);
  transition: transform 0.2s ease;
}

.in-room-acts.drawer-open .drawer-handle .handle-arrow {
  transform: rotate(-90deg);
}

.handle-label {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.new-hint {
  flex: none;
  padding: 2px 8px;
  font: 700 0.68em/1.6 inherit;
  color: var(--pink);
  background: rgba(255, 79, 154, 0.1);
  border: 1px solid rgba(255, 79, 154, 0.45);
  border-radius: 999px;
}

/* 桌面：内容保持流内；手机：绝对定位向上覆盖，不参与正文高度计算 */
.drawer-content {
  min-width: 0;
}

.drawer-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 20;
  max-height: min(40dvh, 280px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px;
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
}

/* 过渡只动 transform/opacity（180-240ms）；rq-still 与系统减动效全部禁用 */
.drawer-enter-active,
.drawer-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.new-hint-enter-active,
.new-hint-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.new-hint-enter-from,
.new-hint-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active,
  .drawer-leave-active,
  .new-hint-enter-active,
  .new-hint-leave-active,
  .drawer-handle .handle-arrow {
    transition: none;
  }
}

:global(html.rq-still .drawer-enter-active),
:global(html.rq-still .drawer-leave-active),
:global(html.rq-still .new-hint-enter-active),
:global(html.rq-still .new-hint-leave-active),
:global(html.rq-still .drawer-handle .handle-arrow) {
  transition: none;
}

/* 手机窄屏：两列瓷砖最小宽度归零并允许长文案换行，禁止横向溢出 */
@media (max-width: 540px) {
  .scene-acts {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .scene-acts .tile strong {
    overflow-wrap: anywhere;
  }
}

:global(html.rq-dark .drawer-panel) {
  background: #2c2e40;
  border-color: rgba(255, 255, 255, 0.12);
}

:global(html.rq-dark .drawer-handle) {
  background: linear-gradient(180deg, #34364a, #2c2e40);
  border-color: rgba(71, 123, 234, 0.4);
}
</style>
