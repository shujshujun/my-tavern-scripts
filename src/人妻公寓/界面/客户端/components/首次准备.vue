<script setup lang="ts">
// 首次游玩准备（App A3 从 App.vue 等价外移，0.74 重做为新手向导）：面向第一次使用
// 酒馆的新手，默认首屏只显示三个准备项、当前任务与一个主操作；SQLite 实际不可写时会作为
// 第 3 项主步骤明确提示，RQ_ 表、版本和填表参数等诊断细节仍折叠进「遇到问题？高级检查」。组件常驻挂载，由内部 v-if="open" 展示；autoOpen 在数据
// 就绪后变 true 时读版本化 storage key，未完成才自动打开。confirm/alert 仍走
// window.parent ?? window；轻提示 emit toast 给 App。
import { computed, ref, watch } from 'vue';
import {
  type 数据库脚本写入能力结果,
  检测数据库脚本写入能力,
  等待数据库脚本写入能力稳定,
  刷新SQLite能力缓存,
  应用数据库填表兼容设置,
  安装人妻公寓数据库模板,
  打开数据库设置,
  数据库状态,
} from '../../../脚本/游戏逻辑/数据库桥';
import {
  当前游戏版本,
  游戏版本构建标记,
  比较稳定版本,
  查询数据库官方最新版本,
  查询游戏官方最新版本,
  查询酒馆助手官方最新版本,
} from '../../../脚本/游戏逻辑/依赖版本';

const props = defineProps<{
  open: boolean;
  autoOpen: boolean;
  scriptAlive: boolean;
}>();

const emit = defineEmits<{ 'update:open': [boolean]; toast: [文本: string, 时长: number] }>();

// 首次进入序章时主动说明安装顺序；按版本换键，让旧玩家升级后也能看到数据库单路线说明。
const 首次说明存储键 = '人妻公寓_首次游玩说明_database_sql_mode_20260803';
// 游戏提示词确认：玩家手动确认已在酒馆预设启用本卡提示词并关闭【小白X】；确认状态持久化，
// 重新打开已完成向导时不丢失。
const 提示词确认存储键 = '人妻公寓_提示词已确认_20260808';
const 数据库检测 = ref(数据库状态());
const 数据库脚本写入能力 = ref<数据库脚本写入能力结果 | null>(null);
const 数据库脚本写入检测中 = ref(false);
const 安装模板中 = ref(false);
const 调整填表设置中 = ref(false);
const 游戏最新版本 = ref('');
const 游戏最新版本查询失败 = ref(false);
const 游戏检测中 = ref(false);
const 数据库最新版本 = ref('');
const 数据库最新版本查询失败 = ref(false);
const 数据库检测中 = ref(false);
const 酒馆助手版本 = ref('');
const 酒馆助手最新版本 = ref('');
const 酒馆助手最新版本查询失败 = ref(false);
const 酒馆助手检测中 = ref(false);
let 版本检测轮次 = 0;
let 数据库脚本写入检测轮次 = 0;
let 已提示更新签名 = '';
let 已提示数据库写入异常签名 = '';

const 游戏版本关系 = computed(() => 比较稳定版本(当前游戏版本, 游戏最新版本.value));
const 游戏为最新版 = computed<boolean | null>(() =>
  游戏版本关系.value === '当前较旧'
    ? false
    : 游戏版本关系.value === '相同' || 游戏版本关系.value === '当前较新'
      ? true
      : null,
);
const 游戏检测说明 = computed(() => {
  if (游戏检测中.value) return `正在检测当前游戏 v${当前游戏版本} 及官方最新稳定版`;
  if (游戏最新版本查询失败.value) return `当前游戏 v${当前游戏版本}；暂时无法查询官方最新稳定版，可继续游戏`;
  if (游戏版本关系.value === '相同') return `当前游戏 v${当前游戏版本}，已是官方最新稳定版`;
  if (游戏版本关系.value === '当前较新') {
    return `当前游戏 v${当前游戏版本} 高于目前查询到的官方稳定版 v${游戏最新版本.value}；可能是镜像缓存延迟，暂不需要降级`;
  }
  if (游戏版本关系.value === '当前较旧') {
    return `当前游戏 v${当前游戏版本}；官方最新稳定版为 v${游戏最新版本.value}，建议更新（不影响开始游戏）`;
  }
  return `当前游戏 v${当前游戏版本}；无法确认当前或官方版本是否为正式稳定版本，可继续游戏`;
});
const 酒馆助手已安装 = computed(() => Boolean(酒馆助手版本.value.trim()));
const 酒馆助手版本关系 = computed(() => 比较稳定版本(酒馆助手版本.value, 酒馆助手最新版本.value));
const 酒馆助手为最新版 = computed<boolean | null>(() =>
  酒馆助手版本关系.value === '当前较旧'
    ? false
    : 酒馆助手版本关系.value === '相同' || 酒馆助手版本关系.value === '当前较新'
      ? true
      : null,
);
const 酒馆助手检测说明 = computed(() => {
  if (酒馆助手检测中.value) return '正在检测酒馆助手及官方最新稳定版';
  if (!酒馆助手版本.value) return '未检测到酒馆助手，请安装并启用后刷新页面';
  if (酒馆助手最新版本查询失败.value) {
    return `检测到 ${酒馆助手版本.value}；暂时无法查询官方最新稳定版，可继续游戏`;
  }
  if (酒馆助手版本关系.value === '相同') {
    return `检测到 ${酒馆助手版本.value}，已是官方最新稳定版`;
  }
  if (酒馆助手版本关系.value === '当前较新') {
    return `检测到 ${酒馆助手版本.value}，高于目前查询到的官方稳定版 ${酒馆助手最新版本.value}；可能是镜像缓存延迟，暂不建议降级`;
  }
  if (酒馆助手版本关系.value === '当前较旧') {
    return `检测到 ${酒馆助手版本.value}；官方最新稳定版为 ${酒馆助手最新版本.value}，建议更新（不影响开始游戏）`;
  }
  return `检测到 ${酒馆助手版本.value}；无法确认当前版本是否为正式稳定版本，请核对官方稳定渠道（不影响开始游戏）`;
});
const 数据库版本关系 = computed(() => 比较稳定版本(数据库检测.value.版本, 数据库最新版本.value));
const 数据库为最新版 = computed<boolean | null>(() =>
  数据库版本关系.value === '当前较旧'
    ? false
    : 数据库版本关系.value === '相同' || 数据库版本关系.value === '当前较新'
      ? true
      : null,
);
const 数据库检测说明 = computed(() => {
  if (数据库检测中.value) return '正在检测当前版本及官方最新稳定版';
  if (!数据库检测.value.已安装) return '未检测到数据库插件，请安装并启用后刷新页面';
  if (!数据库检测.value.版本) {
    return 数据库最新版本查询失败.value
      ? '已检测到插件，但无法读取当前版本或查询官方最新版'
      : `已检测到插件，但无法读取当前版本；官方最新稳定版为 v${数据库最新版本.value}`;
  }
  if (数据库最新版本查询失败.value) {
    return `检测到 v${数据库检测.value.版本}；暂时无法查询官方最新稳定版，可继续游戏`;
  }
  if (数据库版本关系.value === '相同') {
    return `检测到 v${数据库检测.value.版本}，已是官方最新稳定版`;
  }
  if (数据库版本关系.value === '当前较新') {
    return `检测到 v${数据库检测.value.版本}，高于目前查询到的官方稳定版 v${数据库最新版本.value}；可能是镜像缓存延迟，暂不建议降级`;
  }
  if (数据库版本关系.value === '当前较旧') {
    return `检测到 v${数据库检测.value.版本}；官方最新稳定版为 v${数据库最新版本.value}，建议更新（不影响开始游戏）`;
  }
  return `检测到 v${数据库检测.value.版本}；无法确认当前版本是否为正式稳定版本，请核对官方稳定渠道（不影响开始游戏）`;
});
const 依赖更新提示 = computed(() => {
  const 更新项: string[] = [];
  if (游戏版本关系.value === '当前较旧') {
    更新项.push(`游戏 v${当前游戏版本} → v${游戏最新版本.value}`);
  }
  if (酒馆助手版本关系.value === '当前较旧') {
    更新项.push(`酒馆助手 ${酒馆助手版本.value} → ${酒馆助手最新版本.value}`);
  }
  if (数据库版本关系.value === '当前较旧') {
    更新项.push(`数据库 v${数据库检测.value.版本} → v${数据库最新版本.value}`);
  }
  return 更新项.length > 0 ? `检测到可更新：${更新项.join('；')}` : '';
});

// 游戏提示词确认：初始从 localStorage 恢复，勾选即持久化。
const 提示词已确认 = ref(false);
try {
  提示词已确认.value = localStorage.getItem(提示词确认存储键) === '1';
} catch {
  /* 读不到按未确认处理 */
}

function 确认提示词() {
  提示词已确认.value = true;
  try {
    localStorage.setItem(提示词确认存储键, '1');
  } catch {
    /* 隐私模式下本次页面内仍视为已确认 */
  }
}

/** 长期记忆就绪 = 插件、五表与当前 SQLite 脚本写入能力全部真实可用。 */
const 数据库准备完成 = computed(
  () =>
    数据库检测.value.已安装 &&
    数据库检测.value.已装游戏模板 &&
    !数据库脚本写入检测中.value &&
    数据库脚本写入能力.value?.可写 === true,
);
const 首次准备完成 = computed(() => 酒馆助手已安装.value && 提示词已确认.value && 数据库准备完成.value);

async function 执行游戏版本检测(轮次: number) {
  游戏检测中.value = true;
  游戏最新版本.value = '';
  游戏最新版本查询失败.value = false;
  let 最新版本 = '';
  let 最新版本查询失败 = false;
  try {
    最新版本 = await 查询游戏官方最新版本();
  } catch (error) {
    最新版本查询失败 = true;
    console.warn('[人妻公寓] 无法查询游戏官方最新稳定版', error);
  }
  if (轮次 !== 版本检测轮次) return;
  游戏最新版本.value = 最新版本;
  游戏最新版本查询失败.value = 最新版本查询失败;
  游戏检测中.value = false;
}

async function 执行酒馆助手版本检测(轮次: number) {
  酒馆助手检测中.value = true;
  酒馆助手最新版本.value = '';
  酒馆助手最新版本查询失败.value = false;
  let 当前版本 = '';
  let 最新版本 = '';
  let 最新版本查询失败 = false;
  try {
    const 版本 = getTavernHelperVersion();
    当前版本 = typeof 版本 === 'string' ? 版本 : '';
  } catch (error) {
    console.warn('[人妻公寓] 无法读取酒馆助手版本', error);
  }
  if (轮次 !== 版本检测轮次) return;
  // 当前版本来自本地同步 API，不必等待最慢 8 秒的远端查询才解除“未安装”状态。
  酒馆助手版本.value = 当前版本;
  try {
    最新版本 = await 查询酒馆助手官方最新版本();
  } catch (error) {
    最新版本查询失败 = true;
    console.warn('[人妻公寓] 无法查询酒馆助手官方最新版本', error);
  }
  if (轮次 !== 版本检测轮次) return;
  酒馆助手版本.value = 当前版本;
  酒馆助手最新版本.value = 最新版本;
  酒馆助手最新版本查询失败.value = 最新版本查询失败;
  酒馆助手检测中.value = false;
}

function 刷新数据库本地状态() {
  数据库检测.value = 数据库状态();
  if (!数据库检测.value.已安装 || !数据库检测.value.已装游戏模板) 数据库脚本写入能力.value = null;
}

async function 执行数据库脚本写入能力检测(等待运行时 = false) {
  const 轮次 = ++数据库脚本写入检测轮次;
  数据库脚本写入检测中.value = true;
  try {
    const 结果 = await 等待数据库脚本写入能力稳定(() => 检测数据库脚本写入能力(), {
      // 数据库切聊天后会先隐藏同步查询 getter，再异步重建 SQLite runtime；
      // 最长等待约 7.5 秒，恢复即结束，永久缺接口则第一次检测后直接返回。
      最大尝试次数: 等待运行时 ? 11 : 1,
      复检间隔毫秒: 750,
      当前仍有效: () => 轮次 === 数据库脚本写入检测轮次,
      每次检测前: () => {
        刷新SQLite能力缓存();
        刷新数据库本地状态();
      },
    });
    if (轮次 !== 数据库脚本写入检测轮次) return;
    数据库脚本写入能力.value = 结果;
    if (结果.可写) {
      已提示数据库写入异常签名 = '';
    } else if (数据库检测.value.已安装 && 数据库检测.value.已装游戏模板) {
      const 签名 = `${结果.状态}|${结果.说明}`;
      if (签名 !== 已提示数据库写入异常签名) {
        已提示数据库写入异常签名 = 签名;
        emit('toast', `长期记忆未完全就绪：${结果.说明} RQ_剧情事件暂不会更新。`, 8000);
      }
    }
  } catch (error) {
    if (轮次 !== 数据库脚本写入检测轮次) return;
    数据库脚本写入能力.value = {
      可写: false,
      状态: 'SQLite未就绪',
      说明: `无法完成 SQLite 写入能力检测：${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    if (轮次 === 数据库脚本写入检测轮次) 数据库脚本写入检测中.value = false;
  }
}

async function 执行数据库版本检测(轮次: number) {
  数据库检测中.value = true;
  数据库最新版本.value = '';
  数据库最新版本查询失败.value = false;
  let 最新版本 = '';
  let 最新版本查询失败 = false;
  try {
    最新版本 = await 查询数据库官方最新版本();
  } catch (error) {
    最新版本查询失败 = true;
    console.warn('[人妻公寓] 无法查询数据库官方最新稳定版', error);
  }
  if (轮次 !== 版本检测轮次) return;
  数据库最新版本.value = 最新版本;
  数据库最新版本查询失败.value = 最新版本查询失败;
  数据库检测中.value = false;
}

function 提示可用更新() {
  if (!依赖更新提示.value) return;
  const 签名 = `${当前游戏版本}|${游戏最新版本.value}|${酒馆助手版本.value}|${酒馆助手最新版本.value}|${数据库检测.value.版本}|${数据库最新版本.value}`;
  if (签名 === 已提示更新签名) return;
  已提示更新签名 = 签名;
  emit('toast', `检测到可更新：${依赖更新提示.value.replace(/^检测到可更新：/, '')}`, 7000);
}

async function 刷新酒馆助手检测() {
  await 刷新全部检测();
}

async function 刷新数据库检测() {
  await 刷新全部检测();
}

async function 刷新全部检测(_后台检测 = false) {
  const 轮次 = ++版本检测轮次;
  刷新数据库本地状态();
  await Promise.all([
    执行游戏版本检测(轮次),
    执行酒馆助手版本检测(轮次),
    执行数据库版本检测(轮次),
    执行数据库脚本写入能力检测(true),
  ]);
  if (轮次 !== 版本检测轮次) return;
  提示可用更新();
}

/** 只有全部完成才允许写入“首次说明已完成”存储键；中途关闭只收起点位，下次刷新仍自动提示。 */
function 完成首次说明() {
  // 函数级门控：任何非 UI 调用也不能在未完成时提前写入首次说明完成键。
  if (!首次准备完成.value) return;
  try {
    localStorage.setItem(首次说明存储键, '1');
  } catch {
    /* 隐私模式下本次关闭仍然有效，下次刷新重新提示。 */
  }
  emit('update:open', false);
}

async function 从说明安装数据库模板() {
  刷新数据库本地状态();
  if (!数据库检测.value.已安装) {
    emit('toast', '未检测到数据库插件。安装并刷新酒馆后，再回来重新检测。', 5000);
    return;
  }
  const 宿主 = window.parent ?? window;
  if (!宿主.confirm('将《人妻公寓》的五张游戏记忆表应用到当前聊天（默认通用表不再保留，作者自定义表保留），并保留已有数据。确定继续吗？')) return;
  安装模板中.value = true;
  try {
    const result = await 安装人妻公寓数据库模板();
    刷新数据库本地状态();
    if (result.success) await 执行数据库脚本写入能力检测(true);
    宿主.alert(result.message || (result.success ? '人妻公寓数据库表安装完成。' : '数据库表安装失败。'));
  } catch (error) {
    宿主.alert(`数据库表安装失败：${error instanceof Error ? error.message : String(error)}`);
  } finally {
    安装模板中.value = false;
  }
}

async function 从说明应用数据库填表兼容设置() {
  刷新数据库本地状态();
  const 当前值 = 数据库检测.value.填表最短回复;
  if (当前值 === null || 当前值 <= 0 || !数据库检测.value.可设置填表参数) {
    emit('toast', '当前状态不支持一键修改，请打开数据库设置手动确认。', 5000);
    return;
  }
  const 宿主 = window.parent ?? window;
  if (
    !宿主.confirm(
      `这会把数据库插件的全局“AI 回复最小长度”从 ${当前值} 设为 0，影响所有角色卡和聊天。\n\n` +
        '数据库当前也用这个值决定短正文是否跳过自动填表；设为 0 后，其他角色卡的短正文可能增加填表请求。\n\n' +
        '本操作只修改这一项，不修改模型、密钥、SQLite、表格、更新频率或重试次数。确定继续吗？',
    )
  )
    return;
  调整填表设置中.value = true;
  try {
    const result = await 应用数据库填表兼容设置();
    刷新数据库本地状态();
    宿主.alert(result.message);
  } finally {
    调整填表设置中.value = false;
  }
}

async function 从说明打开数据库设置() {
  const ok = await 打开数据库设置();
  if (!ok) {
    (window.parent ?? window).alert(
      '当前数据库版本没有开放设置入口。请直接打开数据库插件；SQLite 在存储模式中开启，填表参数位于“填表工作台 → 自动更新设置 → 高级参数”。',
    );
    return;
  }
  void 执行数据库脚本写入能力检测(true);
}

// 每次打开都刷新检测(标题页入口与自动打开共用)。
watch(
  () => props.open,
  开 => {
    if (开) 刷新全部检测();
  },
);

// 不把更新检测绑死在“首次说明是否还会打开”上：旧玩家进入已完成的存档后，
// 等脚本心跳就绪也会后台检查一次；有更新时由 App toast 主动提示。
let 已后台检测 = false;
watch(
  () => props.scriptAlive,
  存活 => {
    if (!存活 || 已后台检测) return;
    已后台检测 = true;
    void 刷新全部检测(true);
  },
  { immediate: true },
);

// 数据就绪且序章未完成时，读版本化 storage key，未完成过才自动打开。
let 已自动打开 = false;
watch(
  () => props.autoOpen,
  开 => {
    if (!开 || 已自动打开) return;
    已自动打开 = true;
    try {
      if (localStorage.getItem(首次说明存储键) !== '1') emit('update:open', true);
    } catch {
      emit('update:open', true);
    }
  },
  { immediate: true },
);
</script>

<template>
  <!-- ═══════════ rq0.34 首次游玩准备（0.74 新手向导版）：第一次进卡自动出现，标题页可随时重开 ═══════════ -->
  <div
    v-if="open"
    class="mask setup-mask"
    :data-game-build="游戏版本构建标记"
    role="dialog"
    aria-modal="true"
    aria-labelledby="setup-sheet-title"
    @click.self="emit('update:open', false)"
  >
    <div class="sheet setup-sheet">
      <button class="sheet-close" aria-label="关闭（稍后处理）" @click="emit('update:open', false)">✕</button>
      <header class="sheet-heading">
        <h3 id="setup-sheet-title" class="sheet-heading-title">开始前准备一下</h3>
        <p class="sheet-heading-lead">按顺序完成 3 项即可开始，做完的项会记住。</p>
      </header>

      <div class="setup-statuses">
        <span :class="{ on: 酒馆助手已安装 }">
          <i>{{ 酒馆助手检测中 ? '…' : !酒馆助手已安装 ? '!' : '✓' }}</i>
          酒馆助手
        </span>
        <span :class="{ on: 提示词已确认 }">
          <i>{{ 提示词已确认 ? '✓' : '!' }}</i>
          游戏提示词
        </span>
        <span :class="{ on: 数据库准备完成 }">
          <i>{{ 数据库脚本写入检测中 && 数据库检测.已装游戏模板 ? '…' : 数据库准备完成 ? '✓' : '!' }}</i>
          长期记忆
        </span>
      </div>

      <p v-if="依赖更新提示" class="setup-update-warning" role="status">
        {{ 依赖更新提示 }}。建议更新后刷新页面；这不会阻止你开始游戏。
      </p>

      <ol class="setup-steps">
        <li class="required" :class="{ done: 首次准备完成 }">
          <template v-if="!酒馆助手已安装">
            <b><em>1</em>安装酒馆助手</b>
            <p>未检测到酒馆助手。请安装并启用【酒馆助手】后刷新酒馆页面，再回来点“重新检测”。</p>
            <div class="setup-db-actions">
              <button class="btn rite" :disabled="酒馆助手检测中" @click="刷新酒馆助手检测">
                {{ 酒馆助手检测中 ? '检测中…' : '重新检测' }}
              </button>
            </div>
          </template>
          <template v-else-if="!提示词已确认">
            <b><em>2</em>确认游戏提示词</b>
            <p>
              本卡需要游戏提示词才能正常游玩。请确认已在酒馆预设中启用本卡提示词，并关闭【小白X】，避免两套注入同时工作造成正文或变量异常。
            </p>
            <label class="setup-confirm">
              <input type="checkbox" @change="确认提示词" />
              <span>我已确认（会记住）</span>
            </label>
          </template>
          <template v-else-if="!数据库检测.已安装">
            <b><em>3</em>安装数据库插件</b>
            <p>长期记忆需要数据库插件。安装并启用后刷新酒馆页面，再回来点“重新检测”。</p>
            <div class="setup-db-actions">
              <button class="btn rite" :disabled="数据库检测中" @click="刷新数据库检测">
                {{ 数据库检测中 ? '检测中…' : '重新检测' }}
              </button>
              <button class="btn ghost" @click="从说明打开数据库设置">打开数据库设置</button>
            </div>
          </template>
          <template v-else-if="!数据库检测.已装游戏模板">
            <b><em>3</em>安装游戏记忆</b>
            <p>数据库已就绪，还需要把本游戏的记忆表合并到当前聊天。合并会保留其他作者的表与已有数据。</p>
            <div class="setup-db-actions">
              <button class="btn rite" :disabled="安装模板中" @click="从说明安装数据库模板">
                {{ 安装模板中 ? '安装中…' : '一键安装游戏记忆' }}
              </button>
            </div>
          </template>
          <template v-else-if="数据库脚本写入检测中 || !数据库脚本写入能力?.可写">
            <b><em>3</em>开启 SQLite（SQL）存储</b>
            <p>
              {{
                数据库脚本写入检测中
                  ? '正在等待 SQLite 完成初始化并检测写入能力…'
                  : 数据库脚本写入能力?.说明 || '尚未完成 SQLite 写入能力检测。'
              }}
            </p>
            <div class="setup-db-actions">
              <button class="btn rite" @click="从说明打开数据库设置">打开数据库设置</button>
              <button
                class="btn ghost"
                :disabled="数据库脚本写入检测中"
                @click="执行数据库脚本写入能力检测(true)"
              >
                {{ 数据库脚本写入检测中 ? '检测中…' : '重新检测写入能力' }}
              </button>
            </div>
          </template>
          <template v-else>
            <b class="setup-done"><em>✓</em>全部完成</b>
            <p>酒馆助手、游戏提示词、五张记忆表与 SQLite 脚本写入都已就绪，可以开始游戏了。</p>
          </template>
        </li>
      </ol>

      <details class="setup-advanced">
        <summary>遇到问题？高级检查</summary>
        <div class="setup-adv-body">
          <p class="setup-adv-note">
            存储模式：打开【数据库设置 → 存储模式】选择【SQLite（SQL）】。游戏无法代替你自动切换；切换后回来重新检测。
          </p>
          <p
            class="setup-adv-note"
            :class="{ warn: 数据库检测.已装游戏模板 && 数据库脚本写入能力?.可写 !== true }"
          >
            脚本写入：{{
              数据库脚本写入检测中
                ? '正在检测…'
                : 数据库脚本写入能力?.说明 || '尚未检测 SQLite 写入能力。'
            }}
          </p>
          <p class="setup-adv-note">变量解析：游戏默认使用外置模型解析，正文只负责故事。</p>
          <p class="setup-adv-note" :class="{ warn: 游戏为最新版 === false }">游戏：{{ 游戏检测说明 }}。</p>
          <p class="setup-adv-note" :class="{ warn: 数据库为最新版 === false }">
            数据库：{{ 数据库检测说明 }}。五张游戏记忆表{{
              数据库检测.已装游戏模板 ? '已就绪' : '尚未安装'
            }}。
          </p>
          <div class="setup-db-actions">
            <button
              class="btn mini"
              :disabled="游戏检测中 || 酒馆助手检测中 || 数据库检测中 || 数据库脚本写入检测中"
              @click="刷新全部检测()"
            >
              {{
                游戏检测中 || 酒馆助手检测中 || 数据库检测中 || 数据库脚本写入检测中
                  ? '检测中…'
                  : '重新检测全部'
              }}
            </button>
            <button class="btn mini" @click="从说明打开数据库设置">打开数据库设置</button>
            <button
              v-if="数据库检测.填表最短回复 !== null && 数据库检测.填表最短回复 > 0 && 数据库检测.可设置填表参数"
              class="btn mini rite"
              :disabled="调整填表设置中"
              @click="从说明应用数据库填表兼容设置"
            >
              {{ 调整填表设置中 ? '设置并验证中…' : '修复填表短回复（全局设 0）' }}
            </button>
          </div>
          <p v-if="数据库检测.已安装 && 数据库检测.填表最短回复 === 0" class="setup-adv-note good">
            ✓ 自动填表防短回复已兼容：AI 回复最小长度 = 0。
          </p>
          <p v-else-if="数据库检测.已安装 && 数据库检测.填表最短回复 !== null" class="setup-adv-note warn">
            ! 当前 AI 回复最小长度 = {{ 数据库检测.填表最短回复 }}，建议修复；这是数据库全局项，只有你确认后游戏才会修改。
          </p>
          <p v-else-if="数据库检测.已安装" class="setup-adv-note">
            · 当前数据库版本未开放填表参数读取，请在“填表工作台 → 自动更新设置 → 高级参数”中手动设为 0。
          </p>
          <p class="setup-adv-note" :class="{ warn: 酒馆助手为最新版 === false }">
            酒馆助手：{{ 酒馆助手检测说明 }}。脚本心跳：{{ scriptAlive ? '正常' : '未响应' }}。
          </p>
        </div>
      </details>

      <div class="setup-foot">
        <p>以后可在序章首页重新打开本说明。</p>
        <button class="btn ghost" @click="emit('update:open', false)">稍后处理</button>
        <button class="btn rite" :disabled="!首次准备完成" @click="完成首次说明">
          {{ 首次准备完成 ? '完成，回到首页' : '请先完成准备项' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
/* ═══ rq0.34 首次游玩准备（0.74 新手向导版）：三个准备项 + 当前任务渐进披露 + 折叠高级区 ═══ */

.sheet.setup-sheet {
  width: min(520px, 96%);
  max-height: 94%;
  padding: 17px 18px 15px;
  background: linear-gradient(145deg, rgba(255, 247, 239, 0.94), rgba(245, 250, 255, 0.96)), #fff;
}

.setup-statuses {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 10px;
}

.setup-statuses span {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 7px 8px;
  color: var(--ink-faint);
  background: rgba(36, 33, 38, 0.06);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  font-size: 0.74em;
  font-weight: 800;
  white-space: nowrap;
}

.setup-statuses span i {
  flex: none;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #9b98a2;
  font-style: normal;
}

.setup-statuses span.on {
  color: #287a50;
  background: rgba(69, 190, 126, 0.1);
  border-color: rgba(69, 190, 126, 0.28);
}

.setup-statuses span.on i {
  background: #39a86f;
}

.setup-steps {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.setup-update-warning {
  margin: 0 0 9px;
  padding: 8px 10px;
  color: #934b1d;
  background: rgba(241, 153, 72, 0.13);
  border: 1px solid rgba(211, 115, 45, 0.32);
  border-radius: 10px;
  font-size: 0.8em;
  font-weight: 750;
  line-height: 1.5;
}

.setup-steps li {
  position: relative;
  padding: 9px 10px 9px 44px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(40, 34, 48, 0.05);
}

.setup-steps li.required {
  border-left: 3px solid var(--pink);
}

.setup-steps li.done {
  border-left: 3px solid #39a86f;
}

.setup-steps b {
  display: block;
  color: var(--ink);
  font-size: 0.84em;
  line-height: 1.4;
}

.setup-steps b em {
  position: absolute;
  left: 11px;
  top: 10px;
  width: 23px;
  height: 23px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, var(--pink), #f08e66);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 0.78em;
  font-style: normal;
  box-shadow: 0 3px 8px rgba(255, 79, 154, 0.24);
}

.setup-steps li.done b em {
  background: linear-gradient(145deg, #39a86f, #63c98f);
  box-shadow: 0 3px 8px rgba(57, 168, 111, 0.24);
}

.setup-steps p {
  margin: 3px 0 0;
  color: var(--ink-soft);
  font-size: 0.82em;
  line-height: 1.55;
}

.setup-confirm {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px dashed rgba(69, 190, 126, 0.45);
  border-radius: 10px;
  background: rgba(69, 190, 126, 0.08);
  color: #287a50;
  font-size: 0.82em;
  font-weight: 700;
  cursor: pointer;
}

.setup-confirm input {
  width: 16px;
  height: 16px;
  accent-color: #39a86f;
}

.setup-db-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.setup-db-actions .btn {
  flex: 1;
  white-space: nowrap;
}

.setup-db-actions .btn.rite {
  flex: 1.7;
}

.setup-db-actions .btn.mini {
  flex: none;
}

.setup-advanced {
  margin-top: 10px;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
}

.setup-advanced summary {
  padding: 7px 10px;
  cursor: pointer;
  color: var(--ink-soft);
  font-size: 0.78em;
  font-weight: 800;
  user-select: none;
}

.setup-adv-body {
  display: grid;
  gap: 7px;
  padding: 2px 10px 10px;
}

.setup-adv-note {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.78em;
  line-height: 1.55;
}

.setup-adv-note.good {
  color: #287a50;
}

.setup-adv-note.warn {
  color: #a45e28;
}

/* 高级区动作容器允许换行：短辅助按钮可同排，修复按钮空间不足时完整换到下一行（360px 展开高级区不得横向滚动）。 */
.setup-advanced .setup-db-actions {
  flex-wrap: wrap;
  margin-top: 2px;
}

.setup-advanced .setup-db-actions .btn {
  flex: 1;
}

.setup-advanced .btn.mini.rite {
  flex: 1 1 100%;
}

.setup-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 11px;
}

.setup-foot p {
  flex: 1;
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.75em;
  line-height: 1.4;
}

.setup-foot .btn {
  flex: none;
  white-space: nowrap;
}

/* ── 夜间:深色 setup 面板与状态块 ── */

:global(html.rq-dark) .sheet.setup-sheet {
  background: linear-gradient(145deg, rgba(49, 43, 50, 0.98), rgba(34, 40, 54, 0.98));
}

:global(html.rq-dark) .setup-steps li,
:global(html.rq-dark) .setup-statuses span,
:global(html.rq-dark) .setup-advanced {
  background: rgba(255, 255, 255, 0.055);
  border-color: rgba(255, 255, 255, 0.09);
}

:global(html.rq-dark) .setup-statuses span.on {
  color: #6fce9b;
  background: rgba(69, 190, 126, 0.1);
  border-color: rgba(69, 190, 126, 0.24);
}

:global(html.rq-dark) .setup-adv-note {
  color: rgba(255, 255, 255, 0.62);
}

:global(html.rq-dark) .setup-update-warning {
  color: #ffc58f;
  background: rgba(224, 131, 58, 0.14);
  border-color: rgba(255, 171, 99, 0.3);
}

:global(html.rq-dark) .setup-confirm {
  background: rgba(69, 190, 126, 0.1);
  border-color: rgba(69, 190, 126, 0.3);
  color: #6fce9b;
}

/* ── 移动端紧凑:setup 弹窗全屏化，正文保持易读 ── */

@media (max-width: 540px) {
  .setup-mask {
    padding: 6px;
  }

  .sheet.setup-sheet {
    width: 100%;
    max-height: 98%;
    padding: 13px 11px 11px;
    border-radius: 14px;
  }

  .setup-statuses {
    gap: 4px;
  }

  .setup-statuses span {
    justify-content: center;
    padding: 6px 3px;
    font-size: 0.8em;
  }

  .setup-statuses span i {
    width: 16px;
    height: 16px;
  }

  .setup-steps {
    gap: 5px;
  }

  .setup-steps li {
    padding: 7px 8px 7px 38px;
  }

  .setup-steps b em {
    left: 8px;
    top: 8px;
    width: 21px;
    height: 21px;
  }

  .setup-foot {
    align-items: stretch;
    flex-direction: column;
    gap: 6px;
  }

  .setup-foot p {
    text-align: center;
  }
}
</style>
