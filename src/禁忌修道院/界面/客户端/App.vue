<template>
  <div class="codex">
    <!-- ═══════════ 序章:总部委任状(首屏配置,一次性) ═══════════ -->
    <template v-if="!已配置">
      <header class="codex-header">
        <span class="rubric">✠</span> 总会调令 <span class="rubric">✠</span>
      </header>
      <div class="writ">
        <p>
          兹委派新晋司铎前往圣维罗妮卡修道院,暂代已故安德肋神父之职:主持圣事,听取告解,列席修女会议,牧养该院,俟总会另行任命。
        </p>
        <p class="writ-sub">——启程之前,请阁下过目以下两项。</p>
      </div>

      <div class="writ-section">
        <div class="writ-label">此行的凶险(难度)</div>
        <label
          v-for="(档, key) in 难度预设表"
          :key="key"
          class="agenda-item"
          :class="{ chosen: 难度选择 === key }"
        >
          <input v-model="难度选择" type="radio" :value="key" />
          <span class="agenda-name">{{ 档.名称 }}</span>
          <span class="agenda-next">会议间隔 {{ 档.会议间隔[0] }}-{{ 档.会议间隔[1] }} 楼 · 视察阈值 {{ 档.视察激进度阈值 }}</span>
        </label>
      </div>

      <div class="writ-section">
        <div class="writ-label">神父不为人知的癖好(选填,叙事中隐蔽体现,永不点破)</div>
        <textarea
          v-model="私癖输入"
          class="writ-input"
          rows="2"
          placeholder="例:偏爱看她们攥紧念珠强自镇定的样子……(留空亦可)"
        ></textarea>
      </div>

      <button class="rite-btn" @click="启程">签署,启程上山</button>
    </template>

    <!-- ═══════════ 会议场景(整屏牧师会礼堂) ═══════════ -->
    <template v-else-if="data.会议.状态 === '会议中'">
      <header class="codex-header">
        <span class="rubric">✦</span> 牧师会礼堂 · 修女会议 <span class="rubric">✦</span>
      </header>

      <!-- 选议程 -->
      <div v-if="!会议结果" class="agenda">
        <p class="agenda-hint">院规刻于石墙。神父可就其中一条,提出修订。</p>
        <label v-for="项 in 可提案" :key="项.规则.id" class="agenda-item" :class="{ chosen: 选中 === 项.规则.id }">
          <input v-model="选中" type="radio" :value="项.规则.id" />
          <span class="agenda-weight" :data-w="项.规则.权重">{{ 项.规则.权重 }}</span>
          <span class="agenda-name">《{{ 项.规则.名称 }}》</span>
          <span class="agenda-next">→ 「{{ 项.下一档.名称 }}」</span>
          <span class="seats">
            <i
              v-for="s in 席位预测(项.规则.id)"
              :key="s.名"
              class="seat"
              :data-s="s.态"
              :title="s.名"
            >{{ s.态 === 'fog' ? '?' : s.名[0] }}</i>
          </span>
        </label>
        <button class="rite-btn" :disabled="!选中" @click="提交议案">开始投票</button>
      </div>

      <!-- 结果翻牌 -->
      <div v-else class="verdict">
        <div v-if="会议结果.类型 === '院长抢案'" class="verdict-banner seized">
          院长抢案 —— {{ 会议结果.紧缩动作 }}
        </div>
        <div v-else class="verdict-banner" :class="会议结果.通过 ? 'passed' : 'rejected'">
          《{{ 议程名 }}》「{{ 档名 }}」 —— {{ 会议结果.通过 ? '通过' : '否决' }}
        </div>
        <div v-if="显示票面" class="vote-grid">
          <div v-for="t in 显示票面.票" :key="t.职位" class="vote-card" :data-v="t.投票">
            <div class="vote-name">{{ t.显示名 }}</div>
            <div class="vote-stance">{{ t.投票 }}</div>
          </div>
        </div>
        <p v-if="会议结果.类型 === '院长抢案'" class="agenda-hint">
          (神父的原案票面不足,未及宣读即被主持权压下)
        </p>
        <button class="rite-btn" @click="离开">离开会议厅</button>
      </div>
    </template>

    <!-- ═══════════ 日常场景 ═══════════ -->
    <template v-else>
      <header class="codex-header">
        <span class="rubric">✠</span> 圣维罗妮卡修道院 · 名册 <span class="rubric">✠</span>
      </header>

      <div class="meta-row">
        <span>奉献金 {{ data.奉献金 }}</span>
        <span>警戒 {{ data.警戒度 }}</span>
        <span>激进 {{ data.激进度 }}</span>
        <span>距会议 {{ data.会议.倒计时 }} 楼</span>
      </div>

      <div class="panel-tabs">
        <button :class="{ active: 面板 === '名册' }" @click="面板 = '名册'">名册</button>
        <button :class="{ active: 面板 === '法典' }" @click="面板 = '法典'">法典</button>
      </div>

      <div v-if="面板 === '法典'" class="rule-list">
        <div v-for="项 in 法典列表" :key="项.规则.id" class="rule-card">
          <div class="rule-head">
            <span class="agenda-weight" :data-w="项.规则.权重">{{ 项.规则.权重 }}</span>
            <b>《{{ 项.规则.名称 }}》</b>
            <span v-if="项.当前档" class="rule-current">「{{ 项.当前档.名称 }}」</span>
          </div>
          <div class="rule-text">
            <div v-if="项.当前档" class="palimpsest">{{ 项.规则.原规 }}</div>
            <div>{{ 项.当前档 ? 项.当前档.条文 : 项.规则.原规 }}</div>
          </div>
          <div v-if="项.下一档" class="rule-next">
            <span>可修订 →「{{ 项.下一档.名称 }}」</span>
            <span class="seats">
              <i
                v-for="s in 项.席位"
                :key="s.名"
                class="seat"
                :data-s="s.态"
                :title="s.名 + ':' + (s.态 === 'fog' ? '未知' : s.态 === 'yes' ? '赞成' : s.态 === 'no' ? '反对' : '弃权')"
              >{{ s.态 === 'fog' ? '?' : s.名[0] }}</i>
            </span>
          </div>
          <div v-else class="rule-next exhausted">已修订至极限</div>
        </div>
      </div>

      <div v-else class="nun-grid">
        <div v-for="nun in 名册" :key="nun.职位" class="nun-card">
          <div class="nun-name">{{ nun.显示名 }}</div>
          <div class="nun-stage">{{ data.修女[nun.职位].阶段标题 }}</div>
          <div class="axis-bars">
            <div class="axis" title="支持度">
              <i class="bar support" :style="{ width: data.修女[nun.职位].支持度 + '%' }" />
            </div>
            <div class="axis" title="堕落度">
              <i class="bar sin" :style="{ width: data.修女[nun.职位].堕落度 + '%' }" />
            </div>
            <div class="axis" title="信仰值">
              <i class="bar faith" :style="{ width: data.修女[nun.职位].信仰值 + '%' }" />
            </div>
          </div>
          <button v-if="可晋阶(nun.职位)" class="ascend-btn" @click="晋阶(nun.职位)">
            ✦ 跨过界线
          </button>
        </div>
      </div>

      <footer v-if="data.恶魔低语" class="whisper">
        <span class="imp">🜏</span> {{ data.恶魔低语 }}
      </footer>
    </template>

    <!-- TODO(按 spec 顺序):院规法典面板(投票预测+palimpsest)/商店/忏悔录图鉴/正文窗吸入 -->
  </div>
</template>

<script setup lang="ts">
import type { 修女职位 } from '../../schema';
import type { 会议结果 as 会议结果类型 } from '../../脚本/游戏逻辑/meetingSystem';
import { 常规投票人, 计算单票 } from '../../脚本/游戏逻辑/voteEngine';
import { 查档, 查规则, 晋阶堕落门槛, 修女表, 修女职位列表, 难度预设表, 院规表 } from '../../stageConfig';
import { useDataStore } from './store';

const store = useDataStore();
const data = computed(() => store.data);

/** 名册顺序;巡查修女登场(情报可见)前不显示 */
const 名册 = computed(() =>
  修女职位列表
    .map(职位 => 修女表[职位])
    .filter(nun => !nun.隐藏 || data.value.修女[nun.职位].情报可见),
);

// ── 序章:总部委任状(配置存 chat 变量 _设置,一次性) ──

const 已配置 = ref(true); // 挂载时校准,默认 true 防闪屏
const 难度选择 = ref('忏悔者');
const 私癖输入 = ref('');

function 启程() {
  insertOrAssignVariables(
    { _设置: { 难度: 难度选择.value, 私癖: 私癖输入.value.trim() } },
    { type: 'chat' },
  );
  eventEmit('禁忌修道院:序章完成');
  已配置.value = true;
}

// ── 法典面板(投票预测+情报雾) ──

const 面板 = ref<'名册' | '法典'>('名册');

type 席位态 = 'yes' | 'no' | 'abstain' | 'fog';

/** 下一档的七席倾向预测;情报雾:未攻略到情报可见的修女显示 ?(纠察倒戈后全员透明) */
function 席位预测(规则id: string): { 名: string; 态: 席位态 }[] {
  const 目标档 = (data.value.院规[规则id] ?? 0) + 1;
  if (!查档(规则id, 目标档)) return [];
  const 纠察进度 = data.value.修女.纠察.专线进度;
  const 把柄弃权 = !!纠察进度['把柄'] && !纠察进度['倒戈'];
  return 常规投票人.map(职位 => {
    const 修 = data.value.修女[职位];
    const 名 = 修女表[职位].显示名;
    if (!修.情报可见) return { 名, 态: 'fog' as const };
    const 票 = 计算单票(
      职位,
      { 支持度: 修.支持度, 堕落度: 修.堕落度 },
      规则id,
      目标档,
      职位 === '纠察' && 把柄弃权,
    );
    return { 名, 态: (票.投票 === '赞成' ? 'yes' : 票.投票 === '反对' ? 'no' : 'abstain') as 席位态 };
  });
}

const 法典列表 = computed(() =>
  院规表.map(规则 => {
    const 档号 = data.value.院规[规则.id] ?? 0;
    return {
      规则,
      当前档: 档号 > 0 ? 查档(规则.id, 档号) : undefined,
      下一档: 查档(规则.id, 档号 + 1),
      席位: 查档(规则.id, 档号 + 1) ? 席位预测(规则.id) : [],
    };
  }),
);

// ── 会议场景 ──

const 选中 = ref('');
const 会议结果 = ref<会议结果类型 | null>(null);

const 可提案 = computed(() =>
  院规表
    .map(规则 => ({ 规则, 下一档: 规则.档位[(data.value.院规[规则.id] ?? 0)] }))
    .filter(项 => 项.下一档),
);

const 议程名 = computed(() => (会议结果.value ? 查规则(会议结果.value.议程规则id)?.名称 : ''));
const 档名 = computed(() =>
  会议结果.value ? 查档(会议结果.value.议程规则id, 会议结果.value.议程档)?.名称 : '',
);
const 显示票面 = computed(() => 会议结果.value?.票面 ?? 会议结果.value?.玩家原案);

function 提交议案() {
  if (选中.value) eventEmit('禁忌修道院:开始投票', { 规则id: 选中.value });
}

function 离开() {
  eventEmit('禁忌修道院:离开会议厅');
}

// ── 晋阶(堕落度达标只是资格,点击排队正戏,下一楼开演) ──

function 可晋阶(职位: 修女职位): boolean {
  const 修女 = data.value.修女[职位];
  return 修女.当前阶段 < 5 && 修女.堕落度 >= 晋阶堕落门槛[修女.当前阶段];
}

function 晋阶(职位: 修女职位) {
  eventEmit('禁忌修道院:晋阶', { 职位 });
}

onMounted(() => {
  const chatVars = getVariables({ type: 'chat' });
  // 序章:仅最新楼且未配置时展示委任状(旧楼 iframe 不弹)
  已配置.value = _.has(chatVars, '_设置') || getCurrentMessageId() !== getLastMessageId();
  // 结果已出(演出楼/回看):从 chat 变量恢复
  会议结果.value = (_.get(chatVars, '_会议.结果') ?? null) as 会议结果类型 | null;
  eventOn('禁忌修道院:投票结果', (结果: 会议结果类型) => {
    会议结果.value = 结果;
  });
});
</script>

<style scoped>
.codex {
  background: var(--parchment);
  border: 2px solid var(--gilt);
  border-radius: 4px;
  padding: 10px 12px;
  box-shadow: inset 0 0 24px rgba(58, 47, 35, 0.15);
}

.codex-header {
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--ink);
  border-bottom: 1px solid var(--gilt);
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.rubric {
  color: var(--rubric);
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  justify-content: center;
  font-size: 0.85em;
  color: var(--ink-faded);
  margin-bottom: 10px;
}

/* ── 名册 ── */

.nun-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

@media (max-width: 640px) {
  .nun-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.nun-card {
  background: var(--parchment-dark);
  border: 1px solid var(--gilt);
  border-radius: 3px;
  padding: 6px;
  text-align: center;
}

.nun-name {
  font-weight: 700;
  font-size: 0.9em;
}

.nun-stage {
  font-size: 0.75em;
  color: var(--rubric);
  margin: 2px 0 4px;
}

.axis-bars {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.axis {
  height: 4px;
  background: rgba(58, 47, 35, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.bar {
  display: block;
  height: 100%;
  transition: width 0.4s ease;
}

.bar.support {
  background: var(--gilt-bright);
}

.bar.sin {
  background: var(--sin);
}

.bar.faith {
  background: #4a6b8a;
}

.whisper {
  margin-top: 10px;
  padding-top: 6px;
  border-top: 1px dashed var(--gilt);
  font-size: 0.8em;
  font-style: italic;
  color: var(--sin);
}

/* ── 序章委任状 ── */

.writ {
  font-size: 0.88em;
  line-height: 1.7;
  color: var(--ink);
  padding: 4px 6px;
}

.writ-sub {
  color: var(--ink-faded);
  text-align: right;
  font-size: 0.9em;
}

.writ-section {
  margin: 8px 0;
}

.writ-label {
  font-size: 0.8em;
  font-weight: 700;
  color: var(--rubric);
  margin-bottom: 4px;
}

.writ-input {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.85em;
  color: var(--ink);
  background: var(--parchment-dark);
  border: 1px solid var(--gilt);
  border-radius: 3px;
  padding: 5px 8px;
  resize: vertical;
}

/* ── 面板页签与法典 ── */

.panel-tabs {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
}

.panel-tabs button {
  padding: 2px 16px;
  font-family: inherit;
  font-size: 0.8em;
  color: var(--ink-faded);
  background: transparent;
  border: 1px solid var(--gilt);
  border-radius: 3px;
  cursor: pointer;
}

.panel-tabs button.active {
  color: var(--parchment);
  background: var(--gilt);
  font-weight: 700;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rule-card {
  background: var(--parchment-dark);
  border: 1px solid var(--gilt);
  border-radius: 3px;
  padding: 6px 8px;
  font-size: 0.82em;
}

.rule-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rule-current {
  color: var(--rubric);
  font-weight: 700;
}

.rule-text {
  margin: 3px 0;
  color: var(--ink);
}

/* palimpsest:被刮去的旧条文,旧字隐约透出 */
.palimpsest {
  text-decoration: line-through;
  color: rgba(58, 47, 35, 0.35);
  font-size: 0.9em;
}

.rule-next {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--ink-faded);
  font-size: 0.9em;
}

.rule-next.exhausted {
  color: var(--gilt);
  font-weight: 700;
}

.seats {
  display: inline-flex;
  gap: 3px;
}

.seat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 10px;
  font-style: normal;
  border: 1px solid var(--ink-faded);
  color: var(--ink-faded);
  background: transparent;
}

.seat[data-s='yes'] {
  background: var(--gilt-bright);
  border-color: var(--gilt-bright);
  color: var(--shadow);
}

.seat[data-s='no'] {
  background: var(--rubric);
  border-color: var(--rubric);
  color: var(--parchment);
}

.seat[data-s='abstain'] {
  background: var(--ink-faded);
  border-color: var(--ink-faded);
  color: var(--parchment);
}

.ascend-btn {
  margin-top: 4px;
  width: 100%;
  padding: 2px 0;
  font-family: inherit;
  font-size: 0.75em;
  font-weight: 700;
  color: var(--parchment);
  background: var(--sin);
  border: 1px solid var(--gilt-bright);
  border-radius: 3px;
  cursor: pointer;
  animation: ascend-glow 2s ease-in-out infinite;
}

@keyframes ascend-glow {
  50% {
    box-shadow: 0 0 6px var(--gilt-bright);
  }
}

.imp {
  font-style: normal;
}

/* ── 会议 ── */

.agenda-hint {
  font-size: 0.8em;
  color: var(--ink-faded);
  text-align: center;
  margin: 4px 0 8px;
}

.agenda-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  margin-bottom: 4px;
  border: 1px solid var(--gilt);
  border-radius: 3px;
  background: var(--parchment-dark);
  cursor: pointer;
  font-size: 0.85em;
}

.agenda-item.chosen {
  outline: 2px solid var(--rubric);
}

.agenda-item input {
  display: none;
}

.agenda-weight {
  font-size: 0.75em;
  padding: 0 4px;
  border-radius: 2px;
  color: var(--parchment);
  background: var(--ink-faded);
}

.agenda-weight[data-w='中'] {
  background: var(--gilt);
}

.agenda-weight[data-w='重'] {
  background: var(--rubric);
}

.agenda-name {
  font-weight: 700;
}

.agenda-next {
  color: var(--ink-faded);
}

.rite-btn {
  display: block;
  margin: 10px auto 2px;
  padding: 6px 22px;
  font-family: inherit;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--parchment);
  background: var(--rubric);
  border: 1px solid var(--gilt);
  border-radius: 3px;
  cursor: pointer;
}

.rite-btn:disabled {
  background: var(--ink-faded);
  cursor: not-allowed;
}

.verdict-banner {
  text-align: center;
  font-weight: 700;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 3px;
  border: 1px solid var(--gilt);
}

.verdict-banner.passed {
  color: var(--parchment);
  background: var(--gilt);
}

.verdict-banner.rejected {
  color: var(--parchment);
  background: var(--ink-faded);
}

.verdict-banner.seized {
  color: var(--parchment);
  background: var(--sin);
}

.vote-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

@media (max-width: 640px) {
  .vote-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.vote-card {
  text-align: center;
  padding: 6px 4px;
  border: 1px solid var(--gilt);
  border-radius: 3px;
  background: var(--parchment-dark);
}

.vote-card[data-v='赞成'] {
  border-color: var(--gilt-bright);
  box-shadow: inset 0 0 0 1px var(--gilt-bright);
}

.vote-card[data-v='反对'] {
  border-color: var(--rubric);
  box-shadow: inset 0 0 0 1px var(--rubric);
}

.vote-name {
  font-weight: 700;
  font-size: 0.85em;
}

.vote-stance {
  font-size: 0.75em;
  color: var(--ink-faded);
}
</style>
