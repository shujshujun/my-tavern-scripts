<script setup lang="ts">
// 设置弹窗（App A3 从 App.vue 等价外移）：界面偏好走共享 useUIPrefs 单例；
// MVU/模型解析业务设置(更新路线/内置解析/解析通道/自定义API表单)整体内聚本组件。
// "重开一局"只 emit restart，真正的 发送中=true + 业务事件仍在 App 点重开()。
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import {
  写入MVU设置,
  写入变量解析通道,
  读取MVU外置模型配置,
  读取MVU解析状态,
  读取变量解析通道,
  type MVU解析状态,
  type 变量解析通道类型,
} from '../../../MVU解析模式';
import { useUIPrefs, 设置存储键 } from '../composables/useUIPrefs';

defineProps<{
  ready: boolean;
  prologueComplete: boolean;
  sending: boolean;
  restartArmed: boolean;
}>();

const emit = defineEmits<{ restart: [] }>();

const {
  设置开,
  暗色,
  主题模式,
  字号档,
  正文字色,
  立绘显示,
  垫板浓度,
  省流,
  减动效,
  全屏中,
  切换全屏,
  改设置,
  重置界面偏好,
} = useUIPrefs();

// ── MVU 解析设置(只在本组件使用;内置变量解析仍持久到 人妻公寓_界面偏好) ──

/** MVU 外置模式下，由游戏直接请求解析模型（默认开）。 */
const 内置变量解析 = ref(true);
const MVU解析 = ref<MVU解析状态>(读取MVU解析状态());
let MVU解析刷新timer: ReturnType<typeof setInterval> | undefined;
/** 解析模型通道（游戏偏好）：自动=数据库独立模型代发优先（同微信），或强制自定义。 */
const 解析通道 = ref<变量解析通道类型>('自动');

/**
 * 自定义解析模型表单：与 MVU 额外模型解析配置同源（写穿持久层，玩家不必开 MVU 面板）。
 * 只在设置页打开或切到自定义通道时从 MVU 载入一次，输入过程中绝不被轮询刷新覆盖。
 */
const 解析API表单 = reactive({ api地址: '', 密钥: '', 模型名称: '', 温度: '', top_p: '', 最大回复token数: '' });
/** 模型读取结果与读取中状态：只写本组件草稿内存，绝不直接写 MVU 配置。 */
const 模型列表 = ref<string[]>([]);
const 读取模型中 = ref(false);
/** 自定义表单可见反馈（读取/保存结果，绝不包含 Key 内容）。 */
const 自定义反馈 = ref('');
const 自定义反馈类型 = ref<'ok' | 'err'>('ok');

function 载入解析API表单() {
  const 配置 = 读取MVU外置模型配置();
  解析API表单.api地址 = 配置?.api地址 ?? '';
  解析API表单.密钥 = 配置?.密钥 ?? '';
  解析API表单.模型名称 = 配置?.模型名称 ?? '';
  解析API表单.温度 = 配置?.温度 !== undefined ? String(配置.温度) : '';
  解析API表单.top_p = 配置?.top_p !== undefined ? String(配置.top_p) : '';
  解析API表单.最大回复token数 = 配置?.最大回复token数 !== undefined ? String(配置.最大回复token数) : '';
  模型列表.value = [];
  自定义反馈.value = '';
  自定义反馈类型.value = 'ok';
}

/** 恢复默认路线：0.74 起正文路线已移除，这里只负责把 MVU 写回外置。 */
function 选择解析路线() {
  写入MVU设置({ 更新方式: '额外模型解析' });
  刷新MVU解析状态();
}

function 选择解析通道(通道: 变量解析通道类型) {
  if (通道 === 解析通道.value) return;
  解析通道.value = 通道;
  自定义反馈.value = '';
  自定义反馈类型.value = 'ok';
  if (通道 === '自定义') {
    载入解析API表单();
  } else {
    // 回自动只写通道偏好（不动 MVU 配置）；进自定义必须完整填表+保存才写自定义通道。
    写入变量解析通道('自动');
  }
}

function 安全错误反馈(e: unknown, 密钥: string): string {
  const 原文 = e instanceof Error ? e.message : String(e);
  return (密钥 ? 原文.split(密钥).join('***') : 原文).slice(0, 300);
}

/** 读取 OpenAI 兼容端点模型列表：走宿主 getModelList 代理（禁 iframe 直接 fetch，避免 CORS/WebView 拦截）。
 * 失败/空列表只给可见原因，绝不清空已填草稿、不保存半配置、不切换通道。 */
async function 读取模型() {
  if (读取模型中.value) return;
  const base = 解析API表单.api地址.trim().replace(/\/+$/, '');
  const key = 解析API表单.密钥.trim();
  if (!base) {
    自定义反馈.value = '请先填写 API 地址再读取模型。';
    自定义反馈类型.value = 'err';
    return;
  }
  读取模型中.value = true;
  自定义反馈.value = '读取中…';
  自定义反馈类型.value = 'ok';
  try {
    const 模型们 = await getModelList({ apiurl: base, key });
    模型列表.value = [
      ...new Set(模型们.map(String).map(模型 => 模型.trim()).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));
    if (!模型列表.value.length) {
      自定义反馈.value = '该接口没有返回可用模型，可以直接手填模型名称。';
      自定义反馈类型.value = 'err';
    } else {
      自定义反馈.value = `读到 ${模型列表.value.length} 个模型，从下拉里选一个，或直接手填。`;
      自定义反馈类型.value = 'ok';
    }
  } catch (e) {
    自定义反馈.value = `读取模型失败：${安全错误反馈(e, key)}（可手填模型名称）`;
    自定义反馈类型.value = 'err';
  } finally {
    读取模型中.value = false;
  }
}

/** 显式提交自定义解析配置：先 trim 地址/Key/模型并校验，再写 MVU 配置；
 * 只有写入成功才切自定义通道、刷新真实状态并显示成功。失败保持草稿与现有通道不变。
 * 数值留空=不覆盖、沿用 MVU 现值；非空但不是有限数字必须指出字段，不得静默当空。 */
function 保存并启用() {
  const 地址 = 解析API表单.api地址.trim().replace(/\/+$/, '');
  const 密钥 = 解析API表单.密钥.trim();
  const 模型 = 解析API表单.模型名称.trim();
  if (!地址) {
    自定义反馈.value = '请填写 API 地址。';
    自定义反馈类型.value = 'err';
    return;
  }
  if (!模型) {
    自定义反馈.value = '请填写模型名称。';
    自定义反馈类型.value = 'err';
    return;
  }
  const 取数 = (原: string): number | undefined | null => {
    if (原.trim() === '') return undefined;
    const 数 = Number(原.trim());
    return Number.isFinite(数) ? 数 : null;
  };
  const 温度 = 取数(解析API表单.温度);
  if (温度 === null) {
    自定义反馈.value = '「温度」不是有效数字，请修正后再保存。';
    自定义反馈类型.value = 'err';
    return;
  }
  const top_p = 取数(解析API表单.top_p);
  if (top_p === null) {
    自定义反馈.value = '「top_p」不是有效数字，请修正后再保存。';
    自定义反馈类型.value = 'err';
    return;
  }
  const 最大回复token数 = 取数(解析API表单.最大回复token数);
  if (最大回复token数 === null) {
    自定义反馈.value = '「最大回复token」不是有效数字，请修正后再保存。';
    自定义反馈类型.value = 'err';
    return;
  }
  const 成功 = 写入MVU设置({
    模型来源: '自定义',
    api地址: 地址,
    密钥,
    模型名称: 模型,
    温度,
    top_p,
    最大回复token数,
  });
  if (成功) {
    写入变量解析通道('自定义');
    刷新MVU解析状态();
    自定义反馈.value = '已保存并启用：本轮起变量走此自定义模型。';
    自定义反馈类型.value = 'ok';
  } else {
    自定义反馈.value = '保存失败：未能写入 MVU 配置，草稿已保留。';
    自定义反馈类型.value = 'err';
  }
}

/** 设置页与回合引擎都以 MVU 的真实更新方式为准。 */
function 刷新MVU解析状态() {
  MVU解析.value = 读取MVU解析状态();
}

/** 解析字段持久化：读取并合并现有 人妻公寓_界面偏好 JSON，绝不整体覆盖 UI 或脚本字段。 */
function 持久化解析字段() {
  try {
    let 已存: Record<string, unknown> = {};
    try {
      const raw = localStorage.getItem(设置存储键);
      const 值 = raw ? JSON.parse(raw) : null;
      if (值 && typeof 值 === 'object') 已存 = 值;
    } catch {
      /* 坏 JSON 当空处理 */
    }
    localStorage.setItem(
      设置存储键,
      JSON.stringify({
        ...已存,
        内置变量解析: 内置变量解析.value,
      }),
    );
  } catch {
    /* 隐私模式等存不了就不记 */
  }
}

function 切换内置变量解析() {
  内置变量解析.value = !内置变量解析.value;
  改设置();
  持久化解析字段();
  刷新MVU解析状态();
}

/** 恢复解析字段(纯 UI 字段由 useUIPrefs.恢复设置 负责)；挂载与 global_Mvu_initialized 后都刷真实状态。 */
function 恢复解析字段() {
  try {
    const raw = localStorage.getItem(设置存储键);
    if (raw) {
      const s = JSON.parse(raw);
      if (typeof s.内置变量解析 === 'boolean') 内置变量解析.value = s.内置变量解析;
    }
  } catch {
    /* 读不到就用默认 */
  }
  刷新MVU解析状态();
}

/** 恢复默认外观：纯 UI 回默认(useUIPrefs 重置)，解析字段刷新 MVU 真实状态。 */
function 重置偏好() {
  重置界面偏好();
  刷新MVU解析状态();
}

// 弹窗一关就撤销轮询(重开武装态由 App watch 设置开 清掉,防下次误触)
watch(设置开, 开 => {
  clearInterval(MVU解析刷新timer);
  MVU解析刷新timer = undefined;
  if (开) {
    刷新MVU解析状态();
    // 通道与自定义 API 表单只在打开时载入一次，输入过程中绝不被轮询覆盖。
    解析通道.value = 读取变量解析通道();
    载入解析API表单();
    // MVU 没有公开设置变更事件；仅在设置页可见时轻量刷新，关闭后不常驻轮询。
    MVU解析刷新timer = setInterval(刷新MVU解析状态, 1500);
  }
});

let 停止MVU初始化监听: (() => void) | undefined;
onMounted(() => {
  恢复解析字段();
  // MVU 插件自身初始化完成后刷新真实状态(设置组件常驻挂载,与 App 原先的挂载期注册等价)
  停止MVU初始化监听 = eventOn('global_Mvu_initialized', 刷新MVU解析状态).stop;
});
onUnmounted(() => {
  clearInterval(MVU解析刷新timer);
  MVU解析刷新timer = undefined;
  停止MVU初始化监听?.();
});
</script>

<template>
  <!-- ═══════════ 设置弹窗(界面偏好,全走 localStorage) ═══════════ -->
  <div v-if="设置开" class="mask" @click.self="设置开 = false">
    <div class="sheet settings">
      <button class="sheet-close" @click="设置开 = false">✕</button>
      <div class="ui-kicker">SETTINGS / 界面偏好</div>
      <h3 class="set-title">看着舒服最要紧</h3>

      <div class="set-group">
        <div class="set-label">主题</div>
        <div class="seg">
          <button
            v-for="m in ['日间', '夜间', '跟随'] as const"
            :key="m"
            :class="{ on: 主题模式 === m }"
            @click="((主题模式 = m), 改设置())"
          >
            {{ m === '跟随' ? '跟随时段' : m }}
          </button>
        </div>
        <p class="set-hint">「跟随时段」=游戏里入夜,界面也跟着暗下来。</p>
      </div>

      <div class="set-group">
        <div class="set-label">正文字号</div>
        <div class="seg">
          <button
            v-for="z in ['小', '中', '大'] as const"
            :key="z"
            :class="{ on: 字号档 === z }"
            @click="((字号档 = z), 改设置())"
          >
            {{ z }}
          </button>
        </div>
      </div>

      <div class="set-group">
        <div class="set-label">正文字色</div>
        <div class="ink-row">
          <button class="btn mini" :class="{ on: !正文字色 }" @click="((正文字色 = ''), 改设置())">跟随主题</button>
          <label class="ink-pick" :class="{ on: !!正文字色 }">
            <input
              type="color"
              :value="正文字色 || (暗色 ? '#000000' : '#242126')"
              @input="((正文字色 = ($event.target as HTMLInputElement).value), 改设置())"
            />
            <span>{{ 正文字色 ? '自选中' : '自选颜色' }}</span>
          </label>
        </div>
        <p class="set-hint">正文始终使用白色半透明垫板；「跟随主题」在日间使用深墨、夜间使用纯黑。</p>
      </div>

      <div class="set-group">
        <div class="set-label">
          正文垫板浓度<em>{{ Math.round(垫板浓度 * 100) }}%</em>
        </div>
        <input
          class="set-range"
          type="range"
          min="0.2"
          max="1"
          step="0.02"
          :value="垫板浓度"
          @input="((垫板浓度 = Number(($event.target as HTMLInputElement).value)), 改设置())"
        />
        <p class="set-hint">调低=更看得清背景画,调高=文字底更实。</p>
      </div>

      <div class="set-group row">
        <div>
          <div class="set-label">立绘显示</div>
          <p class="set-hint">
            在场者自适应入画:单人大景、两三人分槽、多人阵列；手机四人以上自动换成两排，彼此不遮挡。
          </p>
        </div>
        <button class="toggle" :class="{ on: 立绘显示 }" @click="((立绘显示 = !立绘显示), 改设置())"><i /></button>
      </div>

      <div class="set-group row">
        <div>
          <div class="set-label">省流模式</div>
          <p class="set-hint">只关闭场景背景与地图立面大图；人物、头像和功能图标仍正常显示。</p>
        </div>
        <button class="toggle" :class="{ on: 省流 }" @click="((省流 = !省流), 改设置())"><i /></button>
      </div>

      <div class="set-group row">
        <div>
          <div class="set-label">减少动效</div>
          <p class="set-hint">关掉转场、弹跳、呼吸等动画。</p>
        </div>
        <button class="toggle" :class="{ on: 减动效 }" @click="((减动效 = !减动效), 改设置())"><i /></button>
      </div>

      <div class="set-group">
        <div class="set-label">变量解析</div>
        <p class="set-hint">
          变量解析：外置模型（默认）。正文负责故事，独立模型负责变量，互不干扰。已直接接入 MVU
          变量框架，无需打开 MVU 面板。
        </p>
        <button v-if="!MVU解析.外置模式" class="btn mini" @click="选择解析路线()">恢复外置解析</button>
      </div>

      <div v-if="MVU解析.外置模式" class="set-group row">
        <div>
          <div class="set-label">内置变量解析</div>
          <p class="set-hint">
            由游戏在回合内直接请求解析模型、一次完成变量结算，不依赖 MVU
            的自动请求（游戏会代为关闭它）。关闭本开关则回到 MVU 官方自动解析，需自行在 MVU
            面板重新勾选“启用自动请求”。
          </p>
        </div>
        <button class="toggle" :class="{ on: 内置变量解析 }" @click="切换内置变量解析"><i /></button>
      </div>

      <div v-if="MVU解析.外置模式 && MVU解析.内置解析" class="set-group">
        <div class="set-label">解析模型通道</div>
        <div class="seg">
          <button :class="{ on: 解析通道 === '自动' }" @click="选择解析通道('自动')">自动</button>
          <button :class="{ on: 解析通道 === '自定义' }" @click="选择解析通道('自定义')">自定义模型</button>
        </div>
        <p class="set-hint">
          自动（推荐）：装了数据库插件就由数据库独立模型代发请求，沿用数据库当前配置（与微信相同，不读取数据库的密钥与模型）；没有数据库时使用下方已填写的自定义
          API。两者都没有时不调用任何模型、不会占用正文 API，仅提示去配置。自定义：使用下方单独填写的接口。
        </p>
        <div v-if="解析通道 === '自定义'" class="mvu-api-form">
          <label
            >API 地址（OpenAI 兼容）
            <input v-model="解析API表单.api地址" placeholder="https://…/v1" />
          </label>
          <label
            >API Key
            <input v-model="解析API表单.密钥" type="password" autocomplete="off" />
          </label>
          <label
            >模型名称
            <input v-model="解析API表单.模型名称" placeholder="如 gemini-2.5-flash" />
          </label>
          <div class="mvu-api-row">
            <button class="btn mini" :disabled="读取模型中" @click="读取模型">读取模型</button>
            <select v-if="模型列表.length" v-model="解析API表单.模型名称" class="mvu-api-select">
              <option v-for="m in 模型列表" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div class="mvu-api-nums">
            <label>温度<input v-model="解析API表单.温度" inputmode="decimal" placeholder="默认" /></label>
            <label>top_p<input v-model="解析API表单.top_p" inputmode="decimal" placeholder="默认" /></label>
            <label
              >最大回复token<input v-model="解析API表单.最大回复token数" inputmode="numeric" placeholder="8192"
            /></label>
          </div>
          <button class="btn" :disabled="读取模型中" @click="保存并启用">保存并启用</button>
          <p v-if="自定义反馈" class="set-hint mvu-api-feedback" :class="自定义反馈类型 === 'err' ? 'err' : 'ok'">
            {{ 自定义反馈 }}
          </p>
          <p class="set-hint">点击「保存并启用」后写入 MVU 变量框架的「额外模型解析配置」，游戏与 MVU 共用同一份配置。</p>
        </div>
      </div>

      <div class="set-group row">
        <div>
          <div class="set-label">沉浸全屏</div>
          <p class="set-hint">把游戏铺满整个屏幕。</p>
        </div>
        <button class="toggle" :class="{ on: 全屏中 }" @click="切换全屏"><i /></button>
      </div>

      <div class="set-danger">
        <button
          v-if="ready && prologueComplete"
          class="btn ghost restart"
          :class="{ armed: restartArmed }"
          :disabled="sending"
          @click="emit('restart')"
        >
          {{ restartArmed ? '再点一次,推倒重来(本局进度全部清除)' : '重开一局' }}
        </button>
        <button class="btn ghost" @click="重置偏好">恢复默认外观</button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
/* ═══ 设置弹窗(界面偏好) ═══ */

.sheet.settings {
  width: min(400px, 94%);
  max-height: 92%;
  overflow-y: auto;
}

.set-title {
  margin: 2px 0 12px;
  font-size: 1.05em;
  font-weight: 800;
  color: var(--ink);
}

.set-group {
  padding: 10px 0;
  border-top: 1px solid var(--line-soft);
}

.set-group.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.set-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.9em;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 7px;
}

.set-label em {
  font-style: normal;
  font-size: 0.82em;
  color: var(--pink);
  font-weight: 800;
}

.set-hint {
  margin: 6px 0 0;
  font-size: 0.72em;
  line-height: 1.5;
  color: var(--ink-faint);
}

.set-group.row .set-hint {
  margin-top: 3px;
}

/* 分段选择器 */
.seg {
  display: flex;
  gap: 4px;
  background: var(--pink-soft);
  padding: 3px;
  border-radius: 10px;
}

.seg button {
  flex: 1;
  padding: 7px 4px;
  border: none;
  border-radius: 7px;
  background: transparent;
  font-family: inherit;
  font-size: 0.82em;
  font-weight: 700;
  color: var(--ink-soft);
  cursor: pointer;
  transition: all 0.18s;
}

.seg button.on {
  background: #fff;
  color: var(--pink);
  box-shadow: 0 2px 8px rgba(255, 79, 154, 0.22);
}

/* 滑杆 */
.set-range {
  width: 100%;
  accent-color: var(--pink);
  cursor: pointer;
}

/* 变量解析:自定义模型接口表单(写穿 MVU 额外模型解析配置) */
.mvu-api-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.mvu-api-form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.72em;
  font-weight: 700;
  color: var(--ink-soft);
}

.mvu-api-form input {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--pink-soft);
  border-radius: 8px;
  background: #fff;
  font-family: inherit;
  font-size: 0.98em;
  font-weight: 400;
  color: var(--ink);
}

.mvu-api-form input:focus {
  outline: none;
  border-color: var(--pink);
}

.mvu-api-nums {
  display: flex;
  gap: 8px;
}

.mvu-api-nums label {
  flex: 1;
  min-width: 0;
}

.mvu-api-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mvu-api-select {
  flex: 1;
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid var(--pink-soft);
  border-radius: 8px;
  background: #fff;
  font-family: inherit;
  font-size: 0.9em;
  color: var(--ink);
}

.mvu-api-feedback.err {
  color: #c0574f;
}

.mvu-api-feedback.ok {
  color: #287a50;
}

:global(html.rq-dark) .mvu-api-feedback.err {
  color: #e08a80;
}

:global(html.rq-dark) .mvu-api-feedback.ok {
  color: #6fce9b;
}

/* 开关 */
.toggle {
  flex: none;
  width: 46px;
  height: 27px;
  border-radius: 14px;
  border: none;
  background: rgba(36, 33, 38, 0.18);
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}

.toggle i {
  display: block;
  width: 21px;
  height: 21px;
  margin: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s;
}

.toggle.on {
  background: var(--pink);
}

.toggle.on i {
  transform: translateX(19px);
}

.toggle:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.set-danger {
  display: flex;
  gap: 8px;
  padding-top: 14px;
  margin-top: 4px;
  border-top: 1px solid var(--line-soft);
}

/* 正文字色选择行 */
.ink-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ink-row .btn.on {
  color: #fff;
  background: var(--blue);
  border-color: var(--blue);
}

.ink-pick {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.8em;
  color: var(--ink-soft);
}

.ink-pick.on {
  border-color: var(--blue);
  color: var(--blue);
}

.ink-pick input {
  width: 28px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

/* 重开一局:平时只是淡红描边,点第一下进入武装态才变实红 */
.btn.ghost.restart {
  color: #c0574f;
  border-color: rgba(192, 87, 79, 0.35);
}

.btn.ghost.restart.armed {
  color: #fff;
  background: linear-gradient(180deg, #e0655c, #c0392b);
  border-color: rgba(192, 57, 43, 0.85);
}

/* ── 夜间:分段选择器与开关深色化(完整移动自 App.vue) ── */

:global(html.rq-dark) .seg {
  background: rgba(255, 255, 255, 0.08);
}

:global(html.rq-dark) .seg button.on {
  background: #3a3d52;
}

:global(html.rq-dark) .toggle {
  background: rgba(255, 255, 255, 0.16);
}
</style>
