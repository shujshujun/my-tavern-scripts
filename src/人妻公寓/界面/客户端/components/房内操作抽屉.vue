<script setup lang="ts">
/**
 * 房内操作抽屉。
 *
 * 电脑与手机共用这一层总抽屉；收起与展开只改变临时展示。少数动作可以在同一面板内展开
 * 一个轻量选择区，例如302结局后的“和她亲密”只展开“由我开始／让她开始”，不会再套
 * 第二层抽屉，也不会在组件里保存业务状态。
 */
import { computed, onMounted, onScopeDispose, reactive, ref, shallowRef, watch, watchEffect } from 'vue';
import Ic from './Icon.vue';
import { 创建抽屉状态机, type 抽屉状态, type 抽屉状态机 } from '../composables/抽屉状态机';
import type { 卡动作, 卡动作选项 } from '../types';

const props = defineProps<{
  /** 兼容既有父组件签名；各房间共用同一抽屉。 */
  desktopCohabitationFold?: boolean;
  mobile: boolean;
  /** 兼容既有父组件签名；双端始终支持可逆收起。 */
  desktopCollapsible: boolean;
  roomId: string | null;
  actionCount: number;
  suppressed: boolean;
  /** 新的线路硬选择先展开；允许临时收起，业务锁由父组件保留。 */
  forcedOpen?: boolean;
  actions: (卡动作 & { 分组?: '302共居' })[];
  garbageVisible: boolean;
  videoTapeActive: boolean;
}>();

const emit = defineEmits<{ openGarbage: [] }>();

const 状态 = reactive<抽屉状态>({ 展开: false, 新增提示: false });
const 机器: 抽屉状态机 = 创建抽屉状态机({ 状态 });
// 保留父组件传来的原对象／代理身份，不在选择后额外包一层深代理。
const 当前选择动作 = shallowRef<卡动作 | null>(null);
const 当前长按选项 = shallowRef<卡动作选项 | null>(null);
let 长按计时: ReturnType<typeof setTimeout> | undefined;
interface 长按令牌 {
  动作: 卡动作;
  选项: 卡动作选项;
  房间: string | null;
  输入: string;
  毫秒: number;
  成功回调: 卡动作选项['做'];
  短按回调: 卡动作选项['短按'];
}
let 当前长按令牌: 长按令牌 | null = null;

// 单一响应式入口：进入房间与 actionCount 可能同一 tick 更新，全量输入交给状态机自行比对。
watchEffect(() => {
  机器.更新({
    mobile: props.mobile,
    collapsible: true,
    roomId: props.roomId,
    actionCount: props.actionCount,
    suppressed: props.suppressed && !props.forcedOpen,
  });
});

watch(
  () => [
    props.roomId, props.suppressed, props.mobile, props.videoTapeActive, props.actions,
    props.actions.map(动作 => `${动作.kicker}:${动作.文案}`).join('\u0000'),
  ] as const,
  () => 关闭选择(),
  { flush: 'sync' },
);

onScopeDispose(() => {
  关闭选择();
  机器.销毁();
});

// 普通动作仍按旧语义只受「录像带中」门控；垃圾入口原 v-if 没有录像带门控，两类门互不合并。
const 普通动作可见 = computed(() => !props.videoTapeActive && props.actions.length > 0);
const 有可见动作 = computed(() => props.garbageVisible || 普通动作可见.value);
const 实际展开 = computed(() => 状态.展开);
const 抽屉根 = ref<HTMLElement | null>(null);
const 把手 = ref<HTMLButtonElement | null>(null);
watch(() => props.forcedOpen, value => { if (value) 机器.手动展开(); }, { immediate: true, flush: 'sync' });
function 临时收起(): void { 关闭选择(); 机器.手动收起(); }
function 外部按下(event: PointerEvent): void {
  if (event.target instanceof Node && !抽屉根.value?.contains(event.target)) 临时收起();
}
function 抽屉按键(event: KeyboardEvent): void {
  if (event.key === 'Escape' && 实际展开.value) { event.preventDefault(); event.stopPropagation(); 临时收起(); 把手.value?.focus(); }
}
onMounted(() => document.addEventListener('pointerdown', 外部按下));
onScopeDispose(() => document.removeEventListener('pointerdown', 外部按下));

function 选择仍可用(动作: 卡动作): boolean {
  return 当前选择动作.value === 动作 && props.actions.includes(动作) && !动作.禁用 &&
    普通动作可见.value && (!props.suppressed || Boolean(props.forcedOpen)) &&
    实际展开.value;
}

function 长按仍有效(令牌: 长按令牌): boolean {
  return 当前长按令牌 === 令牌 && 当前长按选项.value === 令牌.选项 &&
    props.roomId === 令牌.房间 && 选择仍可用(令牌.动作) &&
    Boolean(令牌.动作.选项?.includes(令牌.选项)) && 令牌.选项.长按毫秒 === 令牌.毫秒 &&
    令牌.选项.做 === 令牌.成功回调 && 令牌.选项.短按 === 令牌.短按回调;
}

function 清长按计时(): void {
  clearTimeout(长按计时);
  长按计时 = undefined;
  当前长按令牌 = null;
  当前长按选项.value = null;
}

function 关闭选择(): void {
  清长按计时();
  当前选择动作.value = null;
}

// 同对象的禁用／选项变化也取消；清计时之外作废令牌，已排队旧回调不能认领重启后的同一选项。
watchEffect(() => {
  const 动作 = 当前选择动作.value;
  const 选项 = 当前长按选项.value;
  if (动作 && !选择仍可用(动作)) 关闭选择();
  if (选项 && 当前长按令牌 && !长按仍有效(当前长按令牌)) 清长按计时();
}, { flush: 'sync' });

function 触发动作(动作: 卡动作): void {
  if (动作.禁用) return;
  清长按计时();
  if (动作.选项?.length) {
    当前选择动作.value = 当前选择动作.value === 动作 ? null : 动作;
    机器.交互取消自动计时();
    return;
  }
  当前选择动作.value = null;
  机器.手动收起();
  void 动作.做();
}

function 触发动作选项(选项: 卡动作选项): void {
  if (选项.长按毫秒) return;
  const 动作 = 当前选择动作.value;
  if (!动作 || !选择仍可用(动作) || !动作.选项?.includes(选项)) return;
  关闭选择();
  机器.手动收起();
  void 选项.做();
}

function 启动长按倒计时(选项: 卡动作选项, 输入: string): void {
  if (!选项.长按毫秒 || 当前长按选项.value) return;
  const 动作 = 当前选择动作.value;
  if (!动作 || !选择仍可用(动作) || !动作.选项?.includes(选项)) return;
  const 令牌: 长按令牌 = {
    动作, 选项, 房间: props.roomId, 输入, 毫秒: 选项.长按毫秒,
    成功回调: 选项.做, 短按回调: 选项.短按,
  };
  当前长按令牌 = 令牌;
  当前长按选项.value = 选项;
  机器.交互取消自动计时();
  clearTimeout(长按计时);
  长按计时 = setTimeout(() => {
    if (当前长按令牌 !== 令牌) return;
    const 可执行 = 长按仍有效(令牌);
    关闭选择();
    if (!可执行) return;
    机器.手动收起();
    void 选项.做();
  }, 令牌.毫秒);
}

function 记录未完成长按(选项: 卡动作选项): void {
  const 令牌 = 当前长按令牌;
  if (!令牌 || 令牌.选项 !== 选项) return;
  const 可执行 = 长按仍有效(令牌);
  关闭选择();
  // 只有仍有效的本次输入提前释放才记一次短按；取消／失效不消费任何回调。
  if (可执行) void 选项.短按?.();
}

function 开始长按选项(选项: 卡动作选项, event: PointerEvent): void {
  if (!选项.长按毫秒 || 当前长按选项.value) return;
  event.preventDefault();
  (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  启动长按倒计时(选项, `pointer:${event.pointerId}`);
}

function 结束长按选项(选项: 卡动作选项, event: PointerEvent): void {
  if (当前长按选项.value !== 选项 || 当前长按令牌?.输入 !== `pointer:${event.pointerId}`) return;
  event.preventDefault();
  记录未完成长按(选项);
}

function 开始键盘长按(选项: 卡动作选项, event: KeyboardEvent): void {
  if (!选项.长按毫秒 || event.repeat || 当前长按选项.value) return;
  event.preventDefault();
  启动长按倒计时(选项, `key:${event.key}`);
}

function 结束键盘长按(选项: 卡动作选项, event: KeyboardEvent): void {
  if (当前长按选项.value !== 选项 || 当前长按令牌?.输入 !== `key:${event.key}`) return;
  event.preventDefault();
  记录未完成长按(选项);
}

function 取消长按选项(选项: 卡动作选项, event?: PointerEvent): void {
  if (当前长按选项.value !== 选项) return;
  if (event && 当前长按令牌?.输入 !== `pointer:${event.pointerId}`) return;
  清长按计时();
}

function 触发垃圾(): void {
  关闭选择();
  机器.手动收起();
  emit('openGarbage');
}

function 切换(): void {
  if (状态.展开) {
    关闭选择();
    机器.手动收起();
  } else {
    机器.手动展开();
  }
}

function 面板交互(): void {
  机器.交互取消自动计时();
}
</script>

<template>
  <div v-if="有可见动作 && (!suppressed || forcedOpen)" ref="抽屉根" class="in-room-acts" :class="{ 'drawer-open': 实际展开 }" @keydown="抽屉按键">
    <!-- 双端：流内保留总把手，所有房间动作与内部选择都在同一面板。 -->
    <button
      ref="把手"
      type="button"
      class="drawer-handle"
      :aria-expanded="实际展开"
      aria-controls="in-room-acts-panel"
      @pointerdown="机器.交互取消自动计时"
      @focus="机器.交互取消自动计时"
      @click="切换"
    >
      <Ic n="arrow" class="handle-arrow" />
      <span class="handle-label">{{ forcedOpen ? '待决定' : '房内操作' }} · {{ actionCount }}项</span>
      <small>{{ 实际展开 ? '收起' : '展开' }}</small>
      <transition name="new-hint">
        <span v-if="状态.新增提示" class="new-hint">新增操作</span>
      </transition>
    </button>

    <transition name="drawer">
      <div
        v-if="实际展开"
        id="in-room-acts-panel"
        class="drawer-content"
        :class="{ 'drawer-panel': true }"
        role="region"
        aria-label="当前房间可执行操作"
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
          <button
            v-for="(动作, i) in actions"
            :key="`${动作.kicker}:${动作.文案}:${i}`"
            class="tile"
            :class="[{ selected: 当前选择动作 === 动作 }, 动作.类]"
            :disabled="动作.禁用"
            :title="动作.提示 || undefined"
            :aria-expanded="动作.选项?.length ? 当前选择动作 === 动作 : undefined"
            @click="触发动作(动作)"
          >
            <Ic :n="动作.icon" />
            <span class="act-kicker">{{ 动作.kicker }}</span>
            <strong>{{ 动作.文案 }}</strong>
            <small v-if="动作.提示">{{ 动作.提示 }}</small>
          </button>
        </div>
        <transition name="choice-panel">
          <section v-if="当前选择动作?.选项?.length" class="action-choice" aria-label="选择开场方式">
            <header>
              <span><small>PRIVATE SCENE</small><b>{{ 当前选择动作.文案 }}</b></span>
              <button type="button" aria-label="关闭选择" @click="关闭选择">✕</button>
            </header>
            <div class="action-choice-grid">
              <button
                v-for="选项 in 当前选择动作.选项"
                :key="`${选项.kicker}:${选项.文案}`"
                type="button"
                class="choice-tile"
                :class="{ holding: 当前长按选项 === 选项 }"
                :title="选项.提示 || undefined"
                @pointerdown="开始长按选项(选项, $event)"
                @pointerup="结束长按选项(选项, $event)"
                @pointercancel="取消长按选项(选项, $event)"
                @lostpointercapture="取消长按选项(选项, $event)"
                @keydown.enter="开始键盘长按(选项, $event)"
                @keyup.enter="结束键盘长按(选项, $event)"
                @keydown.space="开始键盘长按(选项, $event)"
                @keyup.space="结束键盘长按(选项, $event)"
                @blur="取消长按选项(选项)"
                @click="触发动作选项(选项)"
              >
                <Ic :n="选项.icon" />
                <span class="act-kicker">{{ 选项.kicker }}</span>
                <strong>{{ 选项.文案 }}</strong>
                <small v-if="选项.提示">{{ 选项.提示 }}</small>
              </button>
            </div>
          </section>
        </transition>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.in-room-acts {
  position: relative;
  flex: none;
}

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
  transition:
    transform 0.16s,
    border-color 0.16s,
    box-shadow 0.16s;
}

.choice-tile {
  position: relative;
  overflow: hidden;
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
  transition:
    transform 0.16s,
    border-color 0.16s,
    box-shadow 0.16s;
}

.choice-tile.holding::after {
  position: absolute;
  inset: auto 0 0;
  height: 4px;
  background: currentColor;
  content: '';
  transform-origin: left center;
  animation: hold-progress 1.2s linear forwards;
}

@keyframes hold-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.tile .ic {
  width: 30px;
  height: 30px;
  color: var(--blue);
  margin-bottom: 2px;
}

.choice-tile .ic {
  width: 30px;
  height: 30px;
  color: var(--blue);
  margin-bottom: 2px;
}

.tile strong,
.choice-tile strong {
  font-size: 0.82em;
  font-weight: 700;
  line-height: 1.35;
}

.tile small,
.choice-tile small {
  margin-top: 3px;
  color: var(--ink-faint);
  font-size: 0.66em;
  line-height: 1.35;
}

.tile:disabled {
  cursor: not-allowed;
  opacity: 0.58;
  transform: none;
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.05);
}

.tile:not(:disabled):hover,
.choice-tile:hover,
.tile.selected {
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

.action-choice {
  margin-top: 8px;
  padding: 10px;
  border: 1px solid rgba(190, 159, 112, 0.46);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(43, 35, 29, 0.08), rgba(38, 169, 244, 0.05));
}

.action-choice header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.action-choice header span {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.action-choice header small {
  font-family: var(--font-mono);
  font-size: var(--font-micro);
  letter-spacing: 0.1em;
  color: var(--ink-faint);
}

.action-choice header b {
  font-size: 0.86em;
}

.action-choice header button {
  width: 30px;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--paper-card);
  color: var(--ink-faint);
  cursor: pointer;
}

.action-choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.action-choice-grid .choice-tile:only-child {
  grid-column: 1 / -1;
}

.tile:focus-visible,
.choice-tile:focus-visible,
.action-choice header button:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}

.choice-panel-enter-active,
.choice-panel-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.choice-panel-enter-from,
.choice-panel-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

:global(html.rq-dark .tile) {
  background: #2c2e40;
}

:global(html.rq-dark .choice-tile) {
  background: #2c2e40;
}

:global(html.rq-dark .action-choice) {
  background: linear-gradient(145deg, rgba(226, 190, 133, 0.1), rgba(71, 123, 234, 0.08));
}

/* ── 手机抽屉：把手 + 向上覆盖的单层面板 ── */
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
  .choice-panel-enter-active,
  .choice-panel-leave-active,
  .drawer-handle .handle-arrow {
    transition: none;
  }

  .choice-tile.holding::after {
    animation: none;
    transform: scaleX(1);
  }
}

@media (max-width: 540px) {
  .scene-acts,
  .action-choice-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .scene-acts .tile strong,
  .choice-tile strong,
  .choice-tile small {
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
