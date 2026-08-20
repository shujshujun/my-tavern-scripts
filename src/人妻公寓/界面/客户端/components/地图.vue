<script setup lang="ts">
// 地图全屏画面与房卡(日式 gal 移动画面,App A6a 拆分):
// 纯展示 + 局部状态(房卡/结果卡/立面失效/楼层组/描点坐标)留在组件;
// 场景与移动业务(进入/离开/写场景/房间动作/关地图/从地图外出)仍由 App 持有,经 props/emits 往来。
import { computed, ref, watch } from 'vue';
import type { SchemaType } from '../../../schema';
import { 户静态表, 查房间, type 门牌 } from '../../../stageConfig';
import type { 卡动作 } from '../types';
import { 素材基址 } from '../assets';
import Ic from './Icon.vue';

const props = defineProps<{
  open: boolean;
  data: SchemaType;
  currentRoom: string | null;
  day: number;
  weekday: string;
  period: '早上' | '中午' | '下午' | '傍晚' | '晚上' | '深夜';
  lite: boolean;
  sending: boolean;
  hospitalVisible: boolean;
  avatarFailed: Record<string, boolean>;
  avatarImage: (name: string) => string;
  avatarName: (displayName: string) => string;
  roomPeople: (roomId: string) => string[];
  windowLit: (roomId: string) => boolean;
  managementBadge: (roomId: string) => '' | '楼务' | '逾期';
  rentOwed: (roomId: string) => boolean;
  roomActions: (roomId: string | null) => 卡动作[];
}>();

const emit = defineEmits<{
  close: [];
  outing: [];
  avatarError: [name: string];
}>();

// ── 行动卡片(gal式:点房弹卡,氛围+在场+可做的事;翻垃圾/撬门都收在卡里) ──

const 房卡 = ref<string | null>(null);
const 结果卡 = ref('');

function 清房卡与结果(): void {
  房卡.value = null;
  结果卡.value = '';
}

/** 会议启动、进入/离开等外部关图也会走到 open=false,统一清房卡与结果卡。 */
watch(
  () => props.open,
  开 => {
    if (!开) 清房卡与结果();
  },
);

function 点房(房间id: string) {
  if (props.sending) return;
  结果卡.value = '';
  房卡.value = 房卡.value === 房间id ? null : 房间id;
}

/** 遮罩 self 与右上角 ✕ 统一:先清房卡/结果,再请 App 关图。 */
function 请求关闭(): void {
  清房卡与结果();
  emit('close');
}

/** 外出先清房卡/结果;App 的 handler 仍执行原 await 进入('公寓外部')。 */
function 请求外出(): void {
  清房卡与结果();
  emit('outing');
}

/** 独立事件结果:只有地图开着且房卡打开才以线索卡翻出(不走 toast);否则返回 false。 */
function 显示结果(消息: string): boolean {
  if (!props.open || !房卡.value) return false;
  结果卡.value = 消息;
  return true;
}
defineExpose({ 显示结果 });

const 房卡名称 = computed(() => (房卡.value ? (查房间(房卡.value)?.名称 ?? 房卡.value) : ''));
const 房卡kicker = computed(() => {
  const id = 房卡.value;
  if (!id) return '';
  return /^\d+$/.test(id) ? `ROOM ${id}` : 'COMMON SPACE';
});
const 房卡氛围 = computed(() => {
  if (!房卡.value) return '';
  const 房 = 查房间(房卡.value);
  if (房?.类型 === '户' && 房卡.value !== '302' && !props.data.户[房卡.value]) {
    return '窗户蒙着灰,门上贴着一张手写的招租启事。';
  }
  return 房?.氛围 ?? '';
});
const 房卡在场 = computed(() => (房卡.value ? props.roomPeople(房卡.value).join('、') : ''));

const 房卡动作 = computed<卡动作[]>(() => props.roomActions(房卡.value));

// ── 地图数据(公寓立面:3F→1F 每层两户,顶=天台,底=公共区) ──

const 楼层组 = computed(() => [
  { 名: '3F', 房: [户牌('301'), 户牌('302')] },
  { 名: '2F', 房: [户牌('201'), 户牌('202')] },
  { 名: '1F', 房: [户牌('101'), 户牌('102')] },
]);

function 户牌(m: 门牌) {
  const 入住 = Boolean(props.data.户[m]);
  return {
    id: m,
    空置: m !== '302' && !入住,
    标签: m === '302' ? '你家' : 户静态表[m].妻名,
  };
}

const 底层公共 = [
  { id: '大堂', 名称: '大堂' },
  { id: '信箱区', 名称: '信箱' },
  { id: '管理员室', 名称: '管理员室' },
  { id: '楼梯间', 名称: '楼梯间' },
  { id: '垃圾房', 名称: '垃圾房' },
  { id: '洗手间', 名称: '洗手间' },
];

const 时段问候 = computed(
  () =>
    ({
      早上: '晨光正好',
      中午: '日头正高',
      下午: '午后正长',
      傍晚: '家家飘出饭菜香',
      晚上: '楼里亮起灯火',
      深夜: '整栋楼都睡了',
    })[props.period],
);

function 房内首字(房间id: string): string {
  return props.roomPeople(房间id)
    .map(n => n[0])
    .join(' ');
}

// ── 描点地图(rq0.12):徽章钉在立面画上;坐标=画布百分比,楼体单图+调色做时段,点位永不漂 ──

const 立面失效 = ref(false);

/** 省流关位图/立面图挂了 → 退回玻璃楼体 */
const 用画布地图 = computed(() => !props.lite && !立面失效.value);

/** 时段调色档:同一张傍晚底图,白天提亮降饱和、夜里压暗上蓝 */
const 时段色调 = computed(
  () => (({ 早上: 'day', 中午: 'day', 下午: 'day', 傍晚: 'dusk', 晚上: 'night', 深夜: 'late' }) as const)[props.period],
);

/** 点位坐标:立面_傍晚.webp(rq0.12 四层版)各门窗中心的百分比,已按点位预览校准;不动图不用再标 */
const 立面点位: readonly { id: string; 名: string; x: number; y: number }[] = [
  { id: '天台', 名: '天台', x: 50, y: 12.5 },
  { id: '301', 名: '301', x: 37, y: 26 },
  { id: '302', 名: '302', x: 63, y: 26 },
  { id: '201', 名: '201', x: 37, y: 41 },
  { id: '202', 名: '202', x: 63, y: 41 },
  { id: '101', 名: '101', x: 37, y: 56 },
  { id: '102', 名: '102', x: 63, y: 56 },
  { id: '楼梯间', 名: '楼梯间', x: 79, y: 48 },
  { id: '管理员室', 名: '管理员室', x: 37, y: 74 },
  { id: '大堂', 名: '大堂', x: 54, y: 75 },
  { id: '信箱区', 名: '信箱', x: 71, y: 75 },
  { id: '垃圾房', 名: '垃圾房', x: 84, y: 80 },
  { id: '洗手间', 名: '洗手间', x: 21, y: 75 },
];

const 地图点位 = computed(() =>
  立面点位.map(p => {
    const 户 = /^\d+$/.test(p.id) ? 户牌(p.id as 门牌) : null;
    return { ...p, 空置: 户?.空置 ?? false };
  }),
);
</script>

<template>
  <div v-if="open" class="mask map-mask" @click.self="请求关闭">
    <div class="galmap" :class="'sky-' + period">
      <button class="sheet-close" @click="请求关闭">✕</button>
      <!-- 天空装饰(纯CSS:日月云星,随时段切换) -->
      <div class="sky-deco">
        <i class="orb" />
        <i class="cloud c1" />
        <i class="cloud c2" />
        <i class="cloud c3" />
        <template v-if="period === '深夜' || period === '晚上'"
          ><i class="star s1" /><i class="star s2" /><i class="star s3" /><i class="star s4"
        /></template>
      </div>
      <div class="map-banner">
        <div class="ui-kicker">WUTONGLI APARTMENT / FIELD MAP</div>
        <div class="mb-line">
          <b>第 {{ day }} 天 · {{ weekday }}</b
          ><em>{{ 时段问候 }}</em>
        </div>
      </div>

      <!-- 立面画布(rq0.12 描点地图:徽章钉在画里的门窗上;时段=同一张画调色,点位永不漂) -->
      <div v-if="用画布地图" class="map-stage">
        <div class="map-canvas" :class="'tint-' + 时段色调">
          <img
            class="map-base"
            :src="`${素材基址}/地图/立面_傍晚.webp`"
            alt=""
            draggable="false"
            @error="立面失效 = true"
          />
          <i class="map-veil" />
          <button
            v-for="点 in 地图点位"
            :key="点.id"
            class="spot"
            :class="{ here: currentRoom === 点.id, vacant: 点.空置, lit: windowLit(点.id) }"
            :style="{ left: 点.x + '%', top: 点.y + '%' }"
            @click="点房(点.id)"
          >
            <span class="spot-plate">{{ 点.名 }}</span>
            <span v-if="点.空置" class="spot-note">招租</span>
            <span
              v-else-if="managementBadge(点.id)"
              class="spot-note duty"
              :class="{ overdue: managementBadge(点.id) === '逾期' }"
              >{{ managementBadge(点.id) }}</span
            >
            <span v-else-if="rentOwed(点.id)" class="spot-note owe">欠租</span>
            <span v-else-if="currentRoom === 点.id || roomPeople(点.id).length" class="spot-faces">
              <img
                v-if="currentRoom === 点.id && !avatarFailed['主角']"
                class="me"
                :src="avatarImage('主角')"
                alt="你"
                @error="emit('avatarError', '主角')"
              />
              <template v-for="名 in roomPeople(点.id)" :key="名">
                <img
                  v-if="!avatarFailed[avatarName(名)]"
                  :src="avatarImage(avatarName(名))"
                  :alt="名"
                  @error="emit('avatarError', avatarName(名))"
                />
                <b v-else>{{ 名[0] }}</b>
              </template>
            </span>
          </button>
        </div>
      </div>

      <!-- 兜底(省流模式/立面图挂了):原玻璃楼体 -->
      <div v-else class="map-fallback">
        <div class="bldg">
          <div class="roofline">
            <button class="roof-card" :class="{ here: currentRoom === '天台' }" @click="点房('天台')">
              <span class="unit-name">天台</span>
              <span class="unit-occ">{{ 房内首字('天台') }}</span>
            </button>
          </div>
          <div class="bldg-body">
            <div v-for="层 in 楼层组" :key="层.名" class="bfloor">
              <button
                v-for="房 in 层.房"
                :key="房.id"
                class="bunit"
                :class="{ here: currentRoom === 房.id, vacant: 房.空置, lit: windowLit(房.id) }"
                @click="点房(房.id)"
              >
                <span class="unit-window"><i /><i /></span>
                <span class="unit-plate">{{ 房.id }}</span>
                <span class="unit-sub">{{ 房.空置 ? '招租中' : 房.标签 }}</span>
                <span class="unit-occ">{{ 房.空置 ? '' : 房内首字(房.id) }}</span>
              </button>
            </div>
          </div>
          <div class="bground">
            <button
              v-for="房 in 底层公共"
              :key="房.id"
              class="gunit"
              :class="{ here: currentRoom === 房.id }"
              @click="点房(房.id)"
            >
              <span class="unit-sub">{{ 房.名称 }}</span>
              <span class="unit-occ">{{ 房内首字(房.id) }}</span>
            </button>
          </div>
        </div>
      </div>

      <button
        v-if="hospitalVisible"
        class="hospital-launch"
        type="button"
        :disabled="sending"
        @click="点房('医院')"
      >
        <span><small>MATERNITY / 产科</small><b>前往市立医院</b></span>
        <em>预产消息已读 · 产科入口开放</em>
        <Ic n="arrow" />
      </button>

      <button class="outing-launch" type="button" :disabled="sending" @click="请求外出">
        <span><small>OUTING / 外出</small><b>走出公寓</b></span>
        <em>晨跑 · 健身房 · 更多地点准备中</em>
        <Ic n="arrow" />
      </button>

      <!-- 房间弹窗(gal 式:遮罩层+居中卡;hero 色带头+瓷砖大按钮;翻垃圾/撬门都在这里) -->
      <transition name="card-pop">
        <div v-if="房卡" class="rc-mask" @click.self="房卡 = null">
          <div :key="房卡" class="room-modal">
            <button class="sheet-close" @click="房卡 = null">✕</button>
            <div class="rm-hero" :class="{ pub: !/^\d+$/.test(房卡) }">
              <div class="ui-kicker light">{{ 房卡kicker }}</div>
              <b>{{ 房卡名称 }}</b>
              <span v-if="roomPeople(房卡).length" class="rm-who">
                <span v-for="名 in roomPeople(房卡)" :key="名" class="who-chip mini" :title="名">
                  <img
                    v-if="!avatarFailed[avatarName(名)]"
                    :src="avatarImage(avatarName(名))"
                    :alt="名"
                    @error="emit('avatarError', avatarName(名))"
                  />
                  <b v-else>{{ 名[0] }}</b>
                </span>
                <em>{{ 房卡在场 }}</em>
              </span>
              <em v-else>此刻没有人</em>
            </div>
            <p class="rc-mood">{{ 房卡氛围 }}</p>
            <div class="rm-grid">
              <!-- :disabled 发送中(审计 C5):点房守了发送中,但已开的卡在生成开始后仍活着——
                   瓷砖点击会落进脚本操作队列,等在飞回合结束后才执行,发起未被请求的第二个回合 -->
              <button
                v-for="(动作, i) in 房卡动作"
                :key="i"
                class="tile"
                :class="动作.类"
                :disabled="sending"
                @click="动作.做()"
              >
                <Ic :n="动作.icon" />
                <span class="act-kicker">{{ 动作.kicker }}</span>
                <strong>{{ 动作.文案 }}</strong>
              </button>
              <span v-if="!房卡动作.length" class="rc-empty">门上贴着招租启事,还没有住户</span>
            </div>
            <transition name="clue-flip">
              <div v-if="结果卡" :key="结果卡" class="clue-card">{{ 结果卡 }}</div>
            </transition>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
/* ═══ gal 地图:天空随时段变色 + 公寓立面 + 玻璃热点 ═══ */

.map-mask {
  padding: 0;
}

.outing-launch,
.hospital-launch {
  position: absolute;
  z-index: 5;
  left: 50%;
  width: min(500px, calc(100% - 30px));
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 13px;
  color: #493f4e;
  text-align: left;
  background: linear-gradient(90deg, rgba(255, 248, 237, 0.95), rgba(239, 249, 255, 0.94)), var(--paper-card);
  border: 1px solid rgba(98, 129, 169, 0.34);
  border-radius: 14px;
  box-shadow:
    0 9px 26px rgba(35, 38, 58, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.68);
  transform: translateX(-50%);
  cursor: pointer;
  backdrop-filter: blur(9px);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.outing-launch {
  bottom: max(12px, env(safe-area-inset-bottom));
}

.hospital-launch {
  bottom: calc(max(12px, env(safe-area-inset-bottom)) + 66px);
  background: linear-gradient(90deg, rgba(248, 253, 255, 0.96), rgba(242, 249, 255, 0.95)), var(--paper-card);
  border-color: rgba(72, 139, 177, 0.42);
}

.outing-launch span,
.hospital-launch span {
  display: flex;
  flex: none;
  flex-direction: column;
}

.outing-launch small,
.hospital-launch small {
  color: #5b84ac;
  font: 800 var(--font-micro) / 1.2 var(--font-mono);
  letter-spacing: 0.14em;
}

.outing-launch b,
.hospital-launch b {
  font-size: 0.88em;
  letter-spacing: 0.06em;
}

.outing-launch em,
.hospital-launch em {
  flex: 1;
  color: var(--ink-faint);
  font-size: 0.66em;
  font-style: normal;
}

.outing-launch .ic,
.hospital-launch .ic {
  width: 23px;
  height: 23px;
  color: #4f86b6;
}

.outing-launch:hover:not(:disabled),
.hospital-launch:hover:not(:disabled) {
  transform: translate(-50%, -3px);
  box-shadow:
    0 13px 32px rgba(35, 38, 58, 0.29),
    0 0 0 2px rgba(82, 149, 206, 0.12);
}

.outing-launch:disabled,
.hospital-launch:disabled {
  opacity: 0.46;
  cursor: default;
}

/* rq0.12 全屏化:地图铺满画幅,立面画布定比呈现,徽章钉在画上 */
.galmap {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 0;
  overflow: hidden;
  transition: background 0.6s ease;
}

/* 时段天色(六档:早上/中午/下午/傍晚/晚上/深夜) */
.sky-早上 {
  background: linear-gradient(180deg, #9dd7ef 0%, #cfeefb 55%, #ffefd8 100%);
}

.sky-中午 {
  background: linear-gradient(180deg, #4ab7ff 0%, #a8dcf4 60%, #e8f6fd 100%);
}

.sky-下午 {
  background: linear-gradient(180deg, #6fc2e8 0%, #b8e2f2 55%, #ffefc9 100%);
}

.sky-傍晚 {
  background: linear-gradient(180deg, #7796c9 0%, #ff9d6b 55%, #ffd9a8 100%);
}

.sky-晚上 {
  background: linear-gradient(180deg, #2c3a63 0%, #46578c 60%, #6b77a6 100%);
}

.sky-深夜 {
  background: linear-gradient(180deg, #1f2a4d 0%, #35456f 60%, #4f5b86 100%);
}

.sky-晚上 .map-banner,
.sky-晚上 .map-banner .ui-kicker,
.sky-深夜 .map-banner,
.sky-深夜 .map-banner .ui-kicker {
  color: #e8ecfa;
}

/* 天空装饰:日/月/云/星 */
.sky-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  top: 26px;
  right: 40px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #ffe28a;
  box-shadow: 0 0 0 8px rgba(255, 226, 138, 0.3);
}

.sky-傍晚 .orb {
  top: 92px;
  background: #ff9d5c;
  box-shadow: 0 0 0 10px rgba(255, 157, 92, 0.3);
}

.sky-晚上 .orb,
.sky-深夜 .orb {
  background: transparent;
  box-shadow: inset -9px -4px 0 0 #f4f0d8;
  transform: rotate(-20deg);
}

.cloud {
  position: absolute;
  height: 14px;
  width: 52px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  animation: cloud-drift 26s linear infinite;
}

.cloud::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 12px;
  width: 22px;
  height: 16px;
  border-radius: 50%;
  background: inherit;
}

.sky-晚上 .cloud,
.sky-深夜 .cloud {
  background: rgba(255, 255, 255, 0.12);
}

.cloud.c1 {
  top: 30px;
  left: 8%;
}

.cloud.c2 {
  top: 64px;
  left: 46%;
  transform: scale(0.75);
  animation-duration: 34s;
}

.cloud.c3 {
  top: 14px;
  left: 68%;
  transform: scale(0.6);
  animation-duration: 40s;
}

@keyframes cloud-drift {
  50% {
    margin-left: 26px;
  }
}

.star {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
  animation: star-wink 2.4s ease-in-out infinite;
}

.star.s1 {
  top: 22px;
  left: 16%;
}

.star.s2 {
  top: 48px;
  left: 32%;
  animation-delay: 0.7s;
}

.star.s3 {
  top: 18px;
  left: 55%;
  animation-delay: 1.3s;
}

.star.s4 {
  top: 60px;
  left: 78%;
  animation-delay: 1.9s;
}

@keyframes star-wink {
  50% {
    opacity: 0.2;
  }
}

.map-banner {
  position: absolute;
  top: 12px;
  left: 16px;
  right: 56px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--ink);
  pointer-events: none;
}

.map-banner .mb-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.map-banner b {
  font-size: 1.05em;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.map-banner em {
  font-style: normal;
  font-size: 0.78em;
  opacity: 0.85;
}

/* 楼体:白墙楼卡 + 窗灯 */
.bldg {
  position: relative;
  z-index: 1;
  flex: none;
  display: flex;
  flex-direction: column;
  margin-top: auto;
  filter: drop-shadow(0 14px 22px rgba(20, 24, 40, 0.28));
}

.roofline {
  display: flex;
  justify-content: center;
  padding: 0 18px;
}

.roof-card {
  width: 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 5px 4px 3px;
  font-family: inherit;
  color: var(--ink);
  background:
    repeating-linear-gradient(90deg, transparent 0 10px, rgba(36, 33, 38, 0.2) 10px 12px),
    linear-gradient(180deg, #ffffff, #eef4f8);
  border: 2px solid #7f8a99;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  transition: all 0.18s;
}

.roof-card:hover,
.roof-card.here {
  border-color: var(--pink);
}

.bldg-body {
  display: flex;
  flex-direction: column;
  border: 2px solid #7f8a99;
  border-radius: 8px 8px 0 0;
  background: #fff;
  overflow: hidden;
}

.bfloor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 2px solid rgba(127, 138, 153, 0.45);
}

.bfloor:last-child {
  border-bottom: none;
}

.bunit {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 7px 4px 5px;
  font-family: inherit;
  color: var(--ink);
  background: #fff;
  border: none;
  border-left: 2px solid rgba(127, 138, 153, 0.35);
  cursor: pointer;
  transition: background 0.18s;
}

.bunit:first-child {
  border-left: none;
}

.bunit:hover {
  background: #fff2f7;
}

.bunit.here {
  background: var(--pink-soft);
}

.bunit.vacant {
  color: var(--ink-faint);
  background: #f2f2f4;
}

.unit-window {
  display: flex;
  gap: 5px;
  margin-bottom: 3px;
}

.unit-window i {
  width: 14px;
  height: 11px;
  border-radius: 2px;
  border: 1.5px solid #7f8a99;
  background: var(--blue-soft);
  transition: all 0.4s;
}

.bunit.lit .unit-window i {
  background: var(--yellow);
  border-color: #d9a12e;
  box-shadow: 0 0 9px rgba(255, 202, 53, 0.85);
}

.sky-傍晚 .bunit:not(.lit) .unit-window i,
.sky-晚上 .bunit:not(.lit) .unit-window i,
.sky-深夜 .bunit:not(.lit) .unit-window i {
  background: #66718c;
}

.unit-plate {
  font-family: var(--font-mono);
  font-size: 0.7em;
  font-weight: 700;
  color: #fff;
  background: var(--blue);
  border-radius: 5px;
  padding: 0 6px;
  letter-spacing: 0.06em;
}

.bunit.vacant .unit-plate {
  background: var(--ink-faint);
}

.unit-sub {
  font-size: 0.72em;
  margin-top: 2px;
  font-weight: 600;
}

.unit-name {
  font-size: 0.76em;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.unit-occ {
  min-height: 1.1em;
  font-size: 0.72em;
  color: var(--pink);
  font-weight: 800;
  letter-spacing: 0.22em;
}

/* 底层公共区:一条门脸街 */
.bground {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  border: 2px solid #7f8a99;
  border-top: 2px solid rgba(127, 138, 153, 0.6);
  border-radius: 0 0 8px 8px;
  background: linear-gradient(180deg, #eef2f6, #dde4ec);
  overflow: hidden;
}

.gunit {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 2px 5px;
  font-family: inherit;
  color: var(--ink);
  background: transparent;
  border: none;
  border-left: 1.5px solid rgba(127, 138, 153, 0.4);
  cursor: pointer;
  transition: background 0.18s;
}

.gunit:first-child {
  border-left: none;
}

.gunit:hover {
  background: rgba(255, 255, 255, 0.75);
}

.gunit.here {
  background: var(--pink-soft);
}

/* ── 房间弹窗(gal 式:遮罩+居中卡+hero 色带头+瓷砖大按钮) ── */

.rc-mask {
  position: absolute;
  inset: 0;
  /* 必须压过 z-index:5 的医院／外出入口；房卡打开时底部导航不可穿透。 */
  z-index: 8;
  display: grid;
  place-items: center;
  padding: 14px;
  background: rgba(20, 22, 30, 0.45);
  backdrop-filter: blur(3px);
}

.room-modal {
  position: relative;
  width: min(340px, 96%);
  max-height: 96%;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 18px;
  padding: 0 0 12px;
  box-shadow: var(--shadow);
  scrollbar-width: thin;
}

.rm-hero {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 14px 16px 10px;
  margin-bottom: 8px;
  color: #fff;
  background:
    linear-gradient(180deg, rgba(20, 22, 30, 0.08), rgba(20, 22, 30, 0.42)),
    linear-gradient(130deg, #ff8ab9, #4ab7ff 72%);
  border-radius: 18px 18px 0 0;
}

.rm-hero.pub {
  background:
    linear-gradient(180deg, rgba(20, 22, 30, 0.08), rgba(20, 22, 30, 0.42)),
    linear-gradient(130deg, #4ab7ff, #7fd8a8 72%);
}

.rm-hero b {
  font-size: 1.15em;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-shadow: 0 1px 6px rgba(20, 22, 30, 0.35);
}

.rm-hero em {
  font-style: normal;
  font-size: 0.74em;
  color: rgba(255, 255, 255, 0.9);
}

.rc-empty {
  color: var(--ink-faint);
  font-style: normal;
  font-weight: 400;
  font-size: 0.78em;
  grid-column: 1 / -1;
  text-align: center;
  padding: 8px 0;
}

.rc-mood {
  margin: 0 0 8px;
  padding: 0 16px;
  font-size: 0.78em;
  line-height: 1.65;
  color: var(--ink-soft);
}

.rm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 14px;
}

/* 瓷砖(与 App 正文房内动作行/垃圾选择共享,按所有权在两侧各持一份) */
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
  transition: all 0.16s;
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

.room-modal .clue-card {
  margin: 8px 14px 0;
}

/* 弹卡动画(anime pop,App 垃圾选择弹窗仍使用,两侧各持一份) */
.card-pop-enter-active {
  animation: card-pop-in 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.card-pop-leave-active {
  transition: all 0.15s ease;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes card-pop-in {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.94);
  }
}

/* 线索卡:柠黄便签翻出 */
.clue-card {
  margin-top: 8px;
  background: #fff9e2;
  border: 1.5px dashed rgba(255, 202, 53, 0.9);
  border-radius: 12px;
  padding: 8px 11px;
  font-size: 0.8em;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: var(--ink);
  transform-origin: top center;
}

.clue-flip-enter-active {
  animation: clue-flip-in 0.42s cubic-bezier(0.34, 1.3, 0.64, 1);
}

@keyframes clue-flip-in {
  from {
    opacity: 0;
    transform: perspective(500px) rotateX(-72deg);
  }
}

/* ═══ 在场头像徽章(到场卡/场景条/房卡:认脸不认字;与 App 各持一份) ═══ */

.who-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.who-chip img,
.who-chip > b {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 2px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: linear-gradient(160deg, #ffe3ee, #ffd0e2);
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.2);
  color: #d4407a;
  font-size: 0.8em;
  font-style: normal;
}

.who-chip.mini img,
.who-chip.mini > b {
  width: 24px;
  height: 24px;
  border-width: 1.5px;
}

.rm-who {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.rm-who .who-chip.mini img,
.rm-who .who-chip.mini > b {
  border-color: rgba(255, 255, 255, 0.92);
}

.rm-who em {
  font-style: normal;
  font-size: 0.8em;
}

/* ═══ 动作 kicker(初星 hotspot 语法,瓷砖里的小标;与 App 正文各持一份) ═══ */

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

/* ── 描点地图(rq0.12):立面画布定比呈现 + 徽章热区 + 时段调色 ── */

.map-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  container-type: size;
}

.map-canvas {
  position: relative;
  width: 100%;
  width: min(100%, calc(100cqh * 0.667));
  aspect-ratio: 2 / 3;
}

/* 手机端全屏画幅:画里天空占比过高(2026-07-20 玩家实测)——画布锚底放大,天空溢出裁掉;
   点位是画布内百分比,随画布一起缩放,拓扑不破 */
@media (max-width: 540px) {
  .map-stage {
    overflow: hidden;
  }
  .map-canvas {
    transform: scale(1.24);
    transform-origin: 50% 100%;
  }
}

.map-base {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.6s ease;
  /* 画的天空顶边淡出,融进 CSS 天色渐变(画布比屏幕矮时上方留白不生硬) */
  mask-image: linear-gradient(to bottom, transparent, #000 8%);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 8%);
}

.map-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 0.6s ease;
}

/* 同一张傍晚底图的四档调色:白天提亮去橙,夜里压暗上蓝(楼不换图,点位永不漂) */
.tint-day .map-base {
  filter: brightness(1.15) saturate(0.72) hue-rotate(-14deg) contrast(0.97);
}

.tint-day .map-veil {
  background: linear-gradient(rgba(160, 205, 255, 0.16), rgba(255, 255, 255, 0));
}

.tint-night .map-base {
  filter: brightness(0.6) saturate(0.82) hue-rotate(8deg);
}

.tint-night .map-veil {
  background: rgba(22, 30, 68, 0.32);
  mix-blend-mode: multiply;
}

.tint-late .map-base {
  filter: brightness(0.42) saturate(0.68) hue-rotate(14deg);
}

.tint-late .map-veil {
  background: rgba(12, 16, 48, 0.46);
  mix-blend-mode: multiply;
}

/* 徽章热区:磨砂小门牌钉在画里的门窗上,在场者头像挂在牌下 */
.spot {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -50%);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 44px;
  padding: 4px 8px 5px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(24, 28, 46, 0.22);
  cursor: pointer;
  transition:
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.spot:hover {
  border-color: rgba(255, 79, 154, 0.6);
  box-shadow: 0 6px 16px rgba(24, 28, 46, 0.3);
}

.spot.here {
  border-color: var(--pink);
  box-shadow:
    0 0 0 2px rgba(255, 79, 154, 0.42),
    0 8px 18px rgba(255, 79, 154, 0.3);
}

.spot.vacant {
  opacity: 0.72;
}

/* 晚间在家=窗户透出暖光(丈夫可视化沿袭窗灯语义) */
.spot.lit::before {
  content: '';
  position: absolute;
  inset: -16px;
  z-index: -1;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 196, 96, 0.5), transparent);
  pointer-events: none;
}

.spot-plate {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.08em;
  white-space: nowrap;
  color: var(--ink);
}

.spot-note {
  font-size: var(--font-micro);
  line-height: 1;
  color: var(--ink-faint);
}

/* 欠租角标(P3:催租入口可视化,红底白字压过普通注记) */
.spot-note.owe {
  background: rgba(192, 57, 43, 0.92);
  color: #fff;
  border-radius: 6px;
  padding: 1px 5px;
  font-weight: 700;
}

.spot-note.duty {
  background: rgba(42, 111, 151, 0.92);
  color: #fff;
  border-radius: 6px;
  padding: 1px 5px;
  font-weight: 700;
}

.spot-note.duty.overdue {
  background: rgba(192, 57, 43, 0.94);
}

.spot-faces {
  display: inline-flex;
  align-items: center;
}

.spot-faces img,
.spot-faces b {
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border: 1.5px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  box-shadow: 0 1px 4px rgba(20, 24, 40, 0.3);
}

.spot-faces > * + * {
  margin-left: -7px;
}

.spot-faces b {
  display: inline-grid;
  place-items: center;
  font-size: 10px;
  font-style: normal;
  color: var(--ink);
}

.spot-faces img.me,
.spot-faces b.me {
  border-color: var(--pink);
}

/* 兜底容器(省流/图挂):原玻璃楼体贴底呈现 */
.map-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 52px 14px 14px;
  overflow: hidden auto;
  scrollbar-width: thin;
}

:global(html.rq-dark) .spot {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(44, 46, 64, 0.72);
}

:global(html.rq-dark) .spot-plate,
:global(html.rq-dark) .spot-faces b {
  color: #e8ecfa;
}

/* 半透明玻璃楼体(兜底在插画上叠一层,字色随底色自动) */
.bldg-body {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
  border-color: rgba(255, 255, 255, 0.8);
}

.bfloor {
  border-bottom-color: rgba(255, 255, 255, 0.55);
}

.bunit {
  background: rgba(255, 255, 255, 0.3);
  border-left-color: rgba(255, 255, 255, 0.5);
}

.bunit:hover {
  background: rgba(255, 242, 247, 0.72);
}

.bunit.here {
  background: rgba(255, 214, 231, 0.78);
}

.bunit.vacant {
  background: rgba(238, 238, 242, 0.45);
}

.roof-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
  border-color: rgba(255, 255, 255, 0.85);
}

.roof-card:hover,
.roof-card.here {
  border-color: var(--pink);
}

.bground {
  background: rgba(240, 244, 249, 0.5);
  backdrop-filter: blur(5px);
  border-color: rgba(255, 255, 255, 0.8);
  border-top-color: rgba(255, 255, 255, 0.55);
}

.gunit {
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(4px);
}

.gunit:hover {
  background: rgba(255, 242, 247, 0.72);
}

.gunit.here {
  background: rgba(255, 214, 231, 0.78);
}

/* ═══ 地图的夜间/省流/移动端覆盖(App 合写选择器按所有权拆分,其余对象仍留 App) ═══ */

:global(html.rq-dark) .tile {
  background: #2c2e40;
}

:global(html.rq-dark) .outing-launch {
  color: #f4edf2;
  background: linear-gradient(90deg, rgba(48, 44, 55, 0.95), rgba(39, 47, 61, 0.95));
  border-color: rgba(142, 177, 209, 0.34);
}

:global(html.rq-dark) .hospital-launch {
  color: #f4edf2;
  background: linear-gradient(90deg, rgba(48, 44, 55, 0.95), rgba(39, 47, 61, 0.95));
  border-color: rgba(142, 177, 209, 0.34);
}

/* 省流会使用纯 CSS 楼体兜底；夜间必须同步换深卡，否则浅字落在浅玻璃上。 */
:global(html.rq-dark.rq-lite) .map-fallback .bldg-body {
  background: rgba(24, 27, 42, 0.92);
  border-color: rgba(255, 255, 255, 0.14);
}

:global(html.rq-dark.rq-lite) .map-fallback .bfloor {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

:global(html.rq-dark.rq-lite) .map-fallback .bunit,
:global(html.rq-dark.rq-lite) .map-fallback .roof-card,
:global(html.rq-dark.rq-lite) .map-fallback .gunit {
  color: #f5f3fa;
  background: rgba(43, 46, 65, 0.9);
  border-color: rgba(255, 255, 255, 0.12);
}

:global(html.rq-dark.rq-lite) .map-fallback .bunit:hover,
:global(html.rq-dark.rq-lite) .map-fallback .roof-card:hover,
:global(html.rq-dark.rq-lite) .map-fallback .gunit:hover {
  background: rgba(60, 64, 88, 0.96);
}

:global(html.rq-dark.rq-lite) .map-fallback .bunit.here,
:global(html.rq-dark.rq-lite) .map-fallback .roof-card.here,
:global(html.rq-dark.rq-lite) .map-fallback .gunit.here {
  color: #fff;
  background: rgba(142, 64, 105, 0.92);
}

:global(html.rq-dark.rq-lite) .map-fallback .bground {
  background: rgba(20, 23, 36, 0.96);
  border-color: rgba(255, 255, 255, 0.14);
}

:global(html.rq-dark) .room-modal {
  background: rgba(34, 36, 50, 0.96);
  border-color: rgba(255, 255, 255, 0.1);
}

:global(html.rq-dark) .clue-card {
  background: rgba(255, 202, 53, 0.1);
}

/* 移动端紧凑档:外出按钮贴底收窄(与 App 同断点同值) */
@media (max-width: 540px) {
  .outing-launch {
    bottom: max(7px, env(safe-area-inset-bottom));
    width: calc(100% - 16px);
    gap: 7px;
    padding: 7px 9px;
  }

  .hospital-launch {
    bottom: calc(max(7px, env(safe-area-inset-bottom)) + 56px);
    width: calc(100% - 16px);
    gap: 7px;
    padding: 7px 9px;
  }

  .outing-launch em,
  .hospital-launch em {
    font-size: 0.58em;
  }
}
</style>
