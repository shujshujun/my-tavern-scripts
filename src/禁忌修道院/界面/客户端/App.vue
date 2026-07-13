<template>
  <div class="codex">
    <!-- 错误护栏:任何运行时异常显示在此,不再整屏空白 -->
    <div v-if="错误信息" class="err">⚠ 界面异常:{{ 错误信息 }}</div>

    <!-- ═══════════ 正文窗(书页:楼层文本吸进客户端,全屏游戏感) ═══════════ -->
    <section v-if="正文段落.length" class="story">
      <p v-for="(段, i) in 正文段落" :key="i">{{ 段 }}</p>
    </section>

    <!-- ═══════════ 旧楼只留书页(面板/输入只在最新楼,省性能) ═══════════ -->
    <template v-if="!是最新楼"></template>

    <!-- ═══════════ 数据未就绪 ═══════════ -->
    <template v-else-if="!就绪">
      <div class="agenda-hint">……羊皮纸尚在展开(等待存档数据)……</div>
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

    <!-- ═══════════ 游戏内输入(最新楼,会议中隐藏;玩家不碰酒馆输入框) ═══════════ -->
    <div v-if="是最新楼 && 就绪 && data.会议.状态 !== '会议中'" class="quill">
      <textarea
        v-model="输入文本"
        rows="2"
        placeholder="神父的言行……(Enter 发送,Shift+Enter 换行)"
        @keydown.enter.exact.prevent="发送"
      ></textarea>
      <button class="rite-btn quill-btn" :disabled="发送中 || !输入文本.trim()" @click="发送">
        {{ 发送中 ? '…' : '行动' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 修女职位列表, type 修女职位 } from '../../schema';
import type { 会议结果 as 会议结果类型 } from '../../脚本/游戏逻辑/meetingSystem';
import { 常规投票人, 计算单票 } from '../../脚本/游戏逻辑/voteEngine';
import { 查档, 查规则, 晋阶堕落门槛, 修女表, 院规表 } from '../../stageConfig';
import { useDataStore } from './store';

const store = useDataStore();
const data = computed(() => store.data);

/** 数据就绪守卫:store 兜底为 {} 时不裸渲染(defineMvuDataStore 变量缺失的回退路径) */
const 就绪 = computed(() => Boolean(data.value?.修女 && data.value?.会议 && data.value?.院规));

/** 面板与输入只在最新楼激活;旧楼只留书页(可回看,省性能) */
const 是最新楼 = getCurrentMessageId() === getLastMessageId();

// ── 游戏内输入(玩家不碰酒馆输入框;玩家楼层由正则隐藏) ──

const 输入文本 = ref('');
const 发送中 = ref(false);

async function 发送() {
  const 文本 = 输入文本.value.trim();
  if (!文本 || 发送中.value) return;
  发送中.value = true;
  try {
    // 管道符会截断 slash 命令,替换为全角
    await triggerSlash(`/send ${文本.replace(/\|/g, '｜')}`);
    输入文本.value = '';
    await triggerSlash('/trigger');
  } catch (e) {
    console.error('[禁忌修道院客户端] 发送失败:', e);
    错误信息.value = '发送失败:' + String(e);
  } finally {
    发送中.value = false;
  }
}

/** 错误护栏:渲染异常不再整屏空白,显示横幅供定位 */
const 错误信息 = ref('');
onErrorCaptured(err => {
  错误信息.value = err instanceof Error ? `${err.message}\n${(err.stack ?? '').split('\n')[1] ?? ''}` : String(err);
  console.error('[禁忌修道院客户端]', err);
  return false;
});
window.addEventListener('unhandledrejection', ev => {
  if (!错误信息.value) 错误信息.value = String(ev.reason);
});

/** 名册顺序;巡查修女登场(情报可见)前不显示 */
const 名册 = computed(() =>
  修女职位列表
    .map(职位 => 修女表[职位])
    .filter(nun => !nun.隐藏 || (data.value?.修女?.[nun.职位]?.情报可见 ?? false)),
);

// ── 正文窗:楼层文本吸进客户端(全屏游戏感;显示正则吞掉原始楼层文本) ──

const 正文段落 = ref<string[]>([]);

async function 取正文() {
  try {
    const 消息组 = await getChatMessages(getCurrentMessageId());
    const 原文 = 消息组?.[0]?.message ?? '';
    const 净文 = 原文
      .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
      .replace(/<StatusPlaceHolderImpl\/>/g, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .trim();
    正文段落.value = 净文
      .split(/\n+/)
      .map(s => s.trim())
      .filter(Boolean);
  } catch (e) {
    console.error('[禁忌修道院客户端] 取正文失败:', e);
  }
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
  void 取正文();
  // 结果已出(演出楼/回看):从 chat 变量恢复
  会议结果.value = (_.get(getVariables({ type: 'chat' }), '_会议.结果') ?? null) as 会议结果类型 | null;
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

.err {
  white-space: pre-wrap;
  word-break: break-all;
  background: #7a1a1a;
  color: #ffe9e0;
  border-radius: 3px;
  padding: 6px 8px;
  margin-bottom: 8px;
  font-size: 0.75em;
}

/* ── 游戏内输入 ── */

.quill {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--gilt);
}

.quill textarea {
  flex: 1;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.88em;
  line-height: 1.5;
  color: var(--ink);
  background: var(--parchment-dark);
  border: 1px solid var(--gilt);
  border-radius: 3px;
  padding: 6px 9px;
  resize: vertical;
}

.quill-btn {
  margin: 0;
  align-self: stretch;
  padding: 0 18px;
  white-space: nowrap;
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

/* ── 正文窗(书页) ── */

.story {
  padding: 12px 14px 14px;
  margin-bottom: 10px;
  border: 1px solid var(--gilt);
  border-radius: 3px;
  background:
    linear-gradient(180deg, rgba(201, 162, 39, 0.06) 0%, transparent 40px),
    var(--parchment);
  font-size: 0.95em;
  line-height: 1.85;
  color: var(--ink);
}

.story p {
  margin: 0 0 0.9em;
  text-indent: 2em;
}

.story p:last-child {
  margin-bottom: 0;
}

.story p:first-child::first-letter {
  font-size: 1.6em;
  color: var(--rubric);
  font-weight: 700;
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
