<template>
  <div class="codex">
    <!-- 错误护栏:任何运行时异常显示在此,不再整屏空白 -->
    <div v-if="错误信息" class="err">⚠ 界面异常:{{ 错误信息 }}</div>

    <!-- ═══════════ 剧情卷轴(固定0楼:全部历史+流式正文都写进书页;楼层只是数据库) ═══════════ -->
    <section v-if="卷轴.length || 发送中" ref="卷轴容器" class="story">
      <div v-for="(条, i) in 卷轴" :key="i" class="story-entry">
        <p v-if="条.谁 === '玩家'" class="story-player">✠ {{ 条.文本[0] }}</p>
        <template v-else>
          <p v-for="(段, j) in 条.文本" :key="j">{{ 段 }}</p>
          <p v-if="条.可回档 && !发送中" class="candle-row">
            <button
              class="candle"
              :class="{ armed: 待回档楼 === 条.楼 }"
              :title="待回档楼 === 条.楼 ? '再点一次确认' : '时之烛台:回到这一页刚写完的时刻'"
              @click.stop="点烛(条.楼)"
            >
              {{ 待回档楼 === 条.楼 ? '⚠ 再点一次,烧掉这页之后的一切' : '🕯' }}
            </button>
          </p>
        </template>
      </div>
      <div v-if="发送中" class="story-entry">
        <p v-for="(段, j) in 流式段" :key="'流' + j">{{ 段 }}</p>
        <p class="scribing">✒ 修道院的记事员正在书写……</p>
      </div>
    </section>

    <!-- ═══════════ 数据未就绪 ═══════════ -->
    <template v-if="!就绪">
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
          <div
            v-for="(t, i) in 显示票面.票"
            :key="t.职位"
            class="vote-card vote-reveal"
            :data-v="t.投票"
            :style="{ animationDelay: i * 0.35 + 's' }"
          >
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
        <span class="rubric">✠</span> 圣维罗妮卡修道院 <span class="rubric">✠</span>
      </header>

      <div class="meta-row">
        <span title="奉献金">✟ {{ data.奉献金 }}</span>
        <span
          class="watch-eye"
          :class="{ hot: data.警戒度 >= 75 }"
          :style="{ opacity: 0.4 + data.警戒度 / 160 }"
          :title="'警戒度 ' + data.警戒度 + ':走廊阴影里,纠察的眼睛'"
          >👁 {{ data.警戒度 }}</span
        >
        <span title="激进度(累计触发总部视察)">♰ {{ data.激进度 }}</span>
        <span class="countdown" :class="{ urgent: data.会议.倒计时 <= 3 }" title="距下次修女会议">
          🕯 {{ data.会议.倒计时 }}
        </span>
        <button class="codex-toggle" :class="{ active: 显示法典 }" @click="显示法典 = !显示法典">☨ 法典</button>
      </div>

      <!-- 头像行:在场点亮(焦点金边/背景半亮/离场暗;隐藏角色=剪影) -->
      <div class="avatar-row">
        <div
          v-for="项 in 头像列表"
          :key="项.职位"
          class="avatar"
          :class="[项.态, { veiled: 项.剪影 }]"
          :title="项.剪影 ? '尚未知晓的存在' : 项.显示名"
          @click="!项.剪影 && (选中职位 = 项.职位)"
        >
          <span class="avatar-glyph">{{ 项.剪影 ? '?' : 项.显示名[0] }}</span>
          <span v-if="!项.剪影" class="avatar-name">{{ 项.显示名 }}</span>
        </div>
      </div>

      <div v-if="显示法典" class="rule-list">
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

      <!-- 恶魔低语:页缘血字批注,可听从(填入输入框)或划掉 -->
      <footer v-if="data.恶魔低语 && 已划掉低语 !== data.恶魔低语" class="whisper">
        <span class="imp">🜏</span> {{ data.恶魔低语 }}
        <span class="whisper-acts">
          <button class="whisper-act obey" title="把低语抄进羽笔,亲手写下它" @click="听从低语">听从</button>
          <button class="whisper-act" title="划掉这行批注" @click="已划掉低语 = data.恶魔低语">划掉</button>
        </span>
      </footer>
    </template>

    <!-- ═══════════ 档案卡(点头像弹出;情报雾逐项揭开) ═══════════ -->
    <div v-if="选中档案" class="dossier-mask" @click.self="选中职位 = null">
      <div class="dossier">
        <button class="dossier-close" @click="选中职位 = null">✕</button>
        <div class="dossier-head">
          <span class="dossier-name">{{ 选中档案.显示名 }}</span>
          <span class="dossier-role">{{ 选中档案.职位 }}嬷嬷</span>
          <span class="dossier-stage">「{{ 选中档案.修女.阶段标题 }}」</span>
        </div>

        <div class="dossier-axes">
          <div v-for="轴 in 选中档案.三轴" :key="轴.名" class="dossier-axis">
            <span class="axis-label">{{ 轴.名 }}</span>
            <div class="axis">
              <i class="bar" :class="轴.类" :style="{ width: 轴.值 + '%' }" />
            </div>
            <span class="axis-num">{{ 轴.值 }}</span>
            <span class="axis-delta" :class="{ up: 轴.变化 > 0, down: 轴.变化 < 0 }">
              {{ 轴.变化 > 0 ? '↑' + 轴.变化 : 轴.变化 < 0 ? '↓' + -轴.变化 : '' }}
            </span>
          </div>
        </div>

        <!-- 三轴走势(每楼存档=一个采样点;看得见"她是从哪一夜开始崩的") -->
        <svg v-if="选中曲线" class="dossier-trend" viewBox="0 0 100 28" preserveAspectRatio="none">
          <polyline :points="选中曲线.支持" class="trend-support" />
          <polyline :points="选中曲线.堕落" class="trend-sin" />
          <polyline :points="选中曲线.信仰" class="trend-faith" />
        </svg>

        <p class="dossier-sense">{{ 选中档案.感知 }}</p>
        <p class="dossier-line"><b>情绪</b> {{ 选中档案.修女.当前情绪 }}</p>

        <template v-if="选中档案.修女.情报可见">
          <p v-if="选中档案.修女.当前心理想法" class="dossier-line">
            <b>心声</b> {{ 选中档案.修女.当前心理想法 }}
          </p>
          <p class="dossier-line"><b>着装</b> {{ 选中档案.着装 }}</p>
          <div class="dossier-milestones">
            <div class="dossier-line-title"><b>{{ 选中档案.专线.线名 }}</b></div>
            <div
              v-for="碑 in 选中档案.专线.里程碑"
              :key="碑.id"
              class="milestone"
              :class="{ done: !!选中档案.修女.专线进度[碑.id] }"
            >
              {{ 选中档案.修女.专线进度[碑.id] ? '✦' : '·' }} {{ 碑.标题 }}
            </div>
          </div>
        </template>
        <p v-else class="dossier-sealed">🕯 她的内里仍覆着蜡封——推进她的专线,揭开情报。</p>

        <button v-if="可晋阶(选中档案.职位)" class="ascend-btn" @click="晋阶(选中档案.职位)">
          ✦ 跨过界线
        </button>
      </div>
    </div>

    <!-- ═══════════ 行动建议(AI 每轮给 2-3 条,点了直接发送;想自由发挥就打字) ═══════════ -->
    <div v-if="就绪 && !发送中 && 行动选项.length && data.会议.状态 !== '会议中'" class="option-row">
      <button v-for="(项, i) in 行动选项" :key="i" class="option-chip" @click="发出(项)">✦ {{ 项 }}</button>
    </div>

    <!-- ═══════════ 游戏内输入(会议中隐藏;玩家不碰酒馆输入框) ═══════════ -->
    <div v-if="就绪 && data.会议.状态 !== '会议中'" class="quill">
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
    <div v-if="就绪 && 可重掷 && !发送中 && data.会议.状态 !== '会议中'" class="reroll-row">
      <button class="reroll-btn" title="撕掉这一页重写:回滚本回合的一切,用同样的行动重新演一遍" @click="重掷">
        ↻ 重写此页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 修女职位列表, type 修女职位 } from '../../schema';
import type { 会议结果 as 会议结果类型 } from '../../脚本/游戏逻辑/meetingSystem';
import { 感知语 } from '../../脚本/游戏逻辑/snapshotSystem';
import { 常规投票人, 计算单票 } from '../../脚本/游戏逻辑/voteEngine';
import { 查档, 查规则, 晋阶堕落门槛, 修女表, 院规表, 专线表 } from '../../stageConfig';
import { useDataStore } from './store';

const store = useDataStore();
const data = computed(() => store.data);

/** 数据就绪守卫:store 兜底为 {} 时不裸渲染(defineMvuDataStore 变量缺失的回退路径) */
const 就绪 = computed(() => Boolean(data.value?.修女 && data.value?.会议 && data.value?.院规));

// ── 游戏内输入(固定0楼:行动发给脚本回合引擎,不建可见楼层,不碰酒馆输入框) ──

const 输入文本 = ref('');
const 发送中 = ref(false);
const 流式段 = ref<string[]>([]);
const 可重掷 = ref(false);

function 刷新可重掷() {
  可重掷.value = Boolean(_.get(getVariables({ type: 'chat' }), '_上次回合'));
}

function 重掷() {
  if (发送中.value) return;
  发送中.value = true;
  流式段.value = [];
  // 乐观:撕掉最后一段叙事(玩家行动行保留,重演的是同一句)
  if (卷轴.value.at(-1)?.谁 === '叙事') 卷轴.value.pop();
  void 滚到底();
  eventEmit('禁忌修道院:重掷');
}

/** 发出一条行动(输入框与行动建议按钮共用) */
function 发出(文本: string) {
  文本 = 文本.trim();
  if (!文本 || 发送中.value) return;
  发送中.value = true;
  流式段.value = [];
  // 乐观渲染:玩家行动先上卷轴,回合完成后由楼层数据重建
  卷轴.value.push({ 谁: '玩家', 文本: [文本.replace(/\n+/g, ' ')] });
  void 滚到底();
  eventEmit('禁忌修道院:玩家行动', { 文本 });
}

function 发送() {
  const 文本 = 输入文本.value.trim();
  if (!文本) return;
  输入文本.value = '';
  发出(文本);
}

// ── 行动建议(脚本每回合从 <行动选项> 块提取,存 chat 变量) ──

const 行动选项 = ref<string[]>([]);

function 刷新行动选项() {
  const v = _.get(getVariables({ type: 'chat' }), '_行动选项');
  行动选项.value = Array.isArray(v) ? (v as string[]).filter(x => typeof x === 'string' && x.trim()) : [];
}

// ── 恶魔低语:听从=抄进羽笔(玩家可改再发);划掉=本条隐去,下条低语再现 ──

const 已划掉低语 = ref('');

function 听从低语() {
  输入文本.value = data.value.恶魔低语;
  已划掉低语.value = data.value.恶魔低语;
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

// ── 头像行:在场点亮(脚本每回合把焦点/背景落 chat 变量 _在场) ──

const 在场 = ref<{ 焦点: 修女职位[]; 背景: 修女职位[] }>({ 焦点: [], 背景: [] });

function 刷新在场() {
  const v = _.get(getVariables({ type: 'chat' }), '_在场');
  在场.value = { 焦点: (v?.焦点 ?? []) as 修女职位[], 背景: (v?.背景 ?? []) as 修女职位[] };
}

/** 名册顺序;隐藏角色(巡查)登场前以剪影示人 */
const 头像列表 = computed(() =>
  修女职位列表.map(职位 => {
    const 配 = 修女表[职位];
    const 剪影 = 配.隐藏 && !(data.value?.修女?.[职位]?.情报可见 ?? false);
    const 态 = 在场.value.焦点.includes(职位) ? 'focus' : 在场.value.背景.includes(职位) ? 'ambient' : 'away';
    return { 职位, 显示名: 配.显示名, 剪影, 态 };
  }),
);

// ── 档案卡 ──

const 选中职位 = ref<修女职位 | null>(null);
const 显示法典 = ref(false);

const 选中档案 = computed(() => {
  if (!选中职位.value || !就绪.value) return null;
  const 职位 = 选中职位.value;
  const 修女 = data.value.修女[职位];
  const 服 = 修女.服装;
  const 史 = 三轴历史.value[职位];
  const 变化 = (k: '支持' | '堕落' | '信仰', 当前: number) =>
    史 && 史[k].length >= 2 ? 当前 - 史[k][史[k].length - 2] : 0;
  return {
    职位,
    显示名: 修女表[职位].显示名,
    修女,
    三轴: [
      { 名: '支持', 类: 'support', 值: 修女.支持度, 变化: 变化('支持', 修女.支持度) },
      { 名: '堕落', 类: 'sin', 值: 修女.堕落度, 变化: 变化('堕落', 修女.堕落度) },
      { 名: '信仰', 类: 'faith', 值: 修女.信仰值, 变化: 变化('信仰', 修女.信仰值) },
    ],
    感知: 感知语(修女),
    着装: [服.头纱, 服.上装, 服.下装, 服.袜足, 服.鞋, 服.配饰, 服.特殊装饰]
      .filter(x => x && x !== '无')
      .join('、'),
    专线: 专线表[职位],
  };
});

// ── 剧情卷轴:全部楼层清洗后吸进书页(伪单楼——酒馆聊天区只显示最新楼) ──

interface 卷轴条 {
  谁: '玩家' | '叙事';
  文本: string[];
  /** 该条对应的楼层号(时之烛台回档锚点) */
  楼?: number;
  /** 可作为回档目标(AI 楼、非末楼、当时不在会议中) */
  可回档?: boolean;
}

const 卷轴 = ref<卷轴条[]>([]);
const 卷轴容器 = ref<HTMLElement | null>(null);

function 清洗(原文: string): string {
  return 原文
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
    .replace(/<StatusPlaceHolderImpl\/>/g, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .replace(/<行动选项>[\s\S]*?<\/行动选项>/g, '')
    // 流式过程中的未闭合块也要吞掉,否则半截思维链/变量块会闪现在书页上
    .replace(/<thinking>[\s\S]*$/i, '')
    .replace(/<reasoning>[\s\S]*$/i, '')
    .replace(/<UpdateVariable>[\s\S]*$/, '')
    .replace(/<行动选项>[\s\S]*$/, '')
    .replace(/【主页】/g, '')
    .trim();
}

async function 滚到底() {
  await nextTick();
  if (卷轴容器.value) 卷轴容器.value.scrollTop = 卷轴容器.value.scrollHeight;
}

async function 取卷轴() {
  try {
    const 末楼 = getLastMessageId();
    const 消息组 = (await getChatMessages(`0-${末楼}`)) ?? [];
    const 条目: 卷轴条[] = [];
    const 历史: Record<string, { 支持: number[]; 堕落: number[]; 信仰: number[] }> = {};
    for (const 消息 of 消息组) {
      // 三轴历史:每个带存档的楼是一个采样点(固定0楼架构红利——楼层即时间轴)
      const 修女档 = _.get(消息.data, 'stat_data.修女');
      if (消息.role !== 'user' && 修女档) {
        for (const 职位 of 修女职位列表) {
          const 修 = _.get(修女档, 职位);
          if (!修) continue;
          (历史[职位] ??= { 支持: [], 堕落: [], 信仰: [] });
          历史[职位].支持.push(Number(修.支持度) || 0);
          历史[职位].堕落.push(Number(修.堕落度) || 0);
          历史[职位].信仰.push(Number(修.信仰值) ?? 100);
        }
      }
      const 净文 = 清洗(消息.message ?? '');
      if (!净文) continue;
      const 是玩家 = 消息.role === 'user';
      if (是玩家) {
        条目.push({ 谁: '玩家', 文本: [净文.replace(/\n+/g, ' ')] });
      } else {
        // 蜡烛只插在"当时是日常"的 AI 楼上(回档进半场会议会踩坏票值快照)
        const 当时日常 = _.get(消息.data, 'stat_data.会议.状态', '日常') === '日常';
        条目.push({
          谁: '叙事',
          文本: 净文
            .split(/\n+/)
            .map(s => s.trim())
            .filter(Boolean),
          楼: 消息.message_id,
          可回档: 消息.message_id < 末楼 && 当时日常,
        });
      }
    }
    卷轴.value = 条目;
    三轴历史.value = 历史;
    待回档楼.value = null;
    await 滚到底();
  } catch (e) {
    console.error('[禁忌修道院客户端] 取卷轴失败:', e);
  }
}

// ── 三轴历史曲线(档案卡 sparkline;数据源=各楼层自带的存档快照) ──

const 三轴历史 = ref<Record<string, { 支持: number[]; 堕落: number[]; 信仰: number[] }>>({});

function 折线(序列: number[]): string {
  if (序列.length < 2) return '';
  const 步 = 100 / (序列.length - 1);
  return 序列.map((v, i) => `${(i * 步).toFixed(1)},${(28 - (v / 100) * 26 - 1).toFixed(1)}`).join(' ');
}

const 选中曲线 = computed(() => {
  if (!选中职位.value) return null;
  const 史 = 三轴历史.value[选中职位.value];
  if (!史 || 史.支持.length < 2) return null;
  return { 支持: 折线(史.支持), 堕落: 折线(史.堕落), 信仰: 折线(史.信仰) };
});

// ── 时之烛台(两段式确认,烧掉该楼之后的一切) ──

const 待回档楼 = ref<number | null>(null);

function 点烛(楼: number | undefined) {
  if (楼 === undefined || 发送中.value) return;
  if (待回档楼.value !== 楼) {
    待回档楼.value = 楼; // 第一次点:武装,等确认
    return;
  }
  待回档楼.value = null;
  发送中.value = true;
  流式段.value = [];
  eventEmit('禁忌修道院:回档', { 楼层: 楼 });
}

// ── 法典面板(投票预测+情报雾) ──

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
  void 取卷轴();
  // 结果已出(演出楼/回看):从 chat 变量恢复
  会议结果.value = (_.get(getVariables({ type: 'chat' }), '_会议.结果') ?? null) as 会议结果类型 | null;
  eventOn('禁忌修道院:投票结果', (结果: 会议结果类型) => {
    会议结果.value = 结果;
  });

  // ── 回合引擎事件(固定0楼:脚本 generate 生成,这里只管演) ──
  eventOn('禁忌修道院:流式', (文本: string) => {
    const 净文 = 清洗(文本);
    流式段.value = 净文 ? 净文.split(/\n+/).map(s => s.trim()).filter(Boolean) : [];
    void 滚到底();
  });
  eventOn('禁忌修道院:回合完成', () => {
    发送中.value = false;
    流式段.value = [];
    void 取卷轴();
    刷新可重掷();
    刷新在场();
    刷新行动选项();
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* store 未带 pull 时靠 500ms 轮询兜底 */
    }
  });
  eventOn('禁忌修道院:回合失败', (原因: string) => {
    发送中.value = false;
    流式段.value = [];
    错误信息.value = '回合失败:' + 原因;
    void 取卷轴(); // 乐观上卷轴的玩家行动按真实楼层重建(失败=行动未落库)
    刷新可重掷();
  });
  刷新可重掷();
  刷新在场();
  刷新行动选项();
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

/* ── 行动建议 ── */

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.option-chip {
  padding: 3px 10px;
  font-family: inherit;
  font-size: 0.8em;
  color: var(--ink);
  background: var(--parchment-dark);
  border: 1px solid var(--gilt);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
}

.option-chip:hover {
  color: var(--parchment);
  background: var(--rubric);
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

.reroll-row {
  text-align: right;
  margin-top: 4px;
}

.reroll-btn {
  padding: 1px 10px;
  font-family: inherit;
  font-size: 0.75em;
  color: var(--ink-faded);
  background: transparent;
  border: 1px dashed var(--gilt);
  border-radius: 3px;
  cursor: pointer;
}

.reroll-btn:hover {
  color: var(--rubric);
  border-style: solid;
}

/* ── 时之烛台 ── */

.candle-row {
  text-indent: 0 !important;
  text-align: right;
  margin: -0.4em 0 0.6em !important;
}

.candle {
  padding: 0 6px;
  font-family: inherit;
  font-size: 0.72em;
  color: var(--ink-faded);
  background: transparent;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.45;
}

.candle:hover {
  opacity: 1;
}

.candle.armed {
  opacity: 1;
  color: var(--parchment);
  background: var(--sin);
  border: 1px solid var(--gilt-bright);
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

/* ── 头像行(在场点亮) ── */

.codex-toggle {
  padding: 0 10px;
  font-family: inherit;
  font-size: 1em;
  color: var(--ink-faded);
  background: transparent;
  border: 1px solid var(--gilt);
  border-radius: 3px;
  cursor: pointer;
}

.codex-toggle.active {
  color: var(--parchment);
  background: var(--gilt);
}

.avatar-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  margin-bottom: 10px;
}

.avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  user-select: none;
}

.avatar-glyph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.05em;
  color: var(--ink);
  background: var(--parchment-dark);
  border: 2px solid var(--ink-faded);
  transition: all 0.4s ease;
}

.avatar-name {
  font-size: 0.68em;
  color: var(--ink-faded);
}

/* 焦点:金边亮起 */
.avatar.focus .avatar-glyph {
  border-color: var(--gilt-bright);
  box-shadow: 0 0 8px var(--gilt-bright);
  background: var(--parchment);
}

.avatar.focus .avatar-name {
  color: var(--ink);
  font-weight: 700;
}

/* 背景:半亮 */
.avatar.ambient .avatar-glyph {
  border-color: var(--gilt);
}

/* 离场:压暗 */
.avatar.away {
  opacity: 0.45;
}

/* 隐藏角色:剪影 */
.avatar.veiled {
  cursor: default;
  opacity: 0.5;
}

.avatar.veiled .avatar-glyph {
  color: var(--parchment);
  background: var(--shadow, #1a1208);
  border-style: dashed;
}

/* ── 档案卡 ── */

.dossier-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 14, 6, 0.55);
}

.dossier {
  position: relative;
  width: min(92vw, 420px);
  max-height: 84vh;
  overflow-y: auto;
  padding: 14px 16px;
  background: var(--parchment);
  border: 2px solid var(--gilt);
  border-radius: 4px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.5);
}

.dossier-close {
  position: absolute;
  top: 6px;
  right: 8px;
  border: none;
  background: transparent;
  color: var(--ink-faded);
  font-size: 1em;
  cursor: pointer;
}

.dossier-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  border-bottom: 1px solid var(--gilt);
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.dossier-name {
  font-weight: 700;
  font-size: 1.15em;
}

.dossier-role {
  font-size: 0.8em;
  color: var(--ink-faded);
}

.dossier-stage {
  margin-left: auto;
  font-size: 0.85em;
  color: var(--rubric);
  font-weight: 700;
}

.dossier-axes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.dossier-axis {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8em;
}

.dossier-axis .axis {
  flex: 1;
}

.axis-label {
  width: 2.4em;
  color: var(--ink-faded);
}

.axis-num {
  width: 2em;
  text-align: right;
  color: var(--ink-faded);
  font-variant-numeric: tabular-nums;
}

.dossier-sense {
  font-size: 0.85em;
  font-style: italic;
  color: var(--ink);
  margin: 0 0 6px;
}

.dossier-line {
  font-size: 0.82em;
  margin: 0 0 4px;
}

.dossier-line b {
  color: var(--rubric);
  margin-right: 4px;
}

.dossier-line-title {
  font-size: 0.82em;
  margin: 6px 0 3px;
}

.milestone {
  font-size: 0.8em;
  color: var(--ink-faded);
  padding-left: 8px;
}

.milestone.done {
  color: var(--ink);
  font-weight: 700;
}

.dossier-sealed {
  font-size: 0.82em;
  font-style: italic;
  color: var(--ink-faded);
  border: 1px dashed var(--gilt);
  border-radius: 3px;
  padding: 6px 8px;
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

.whisper-acts {
  margin-left: 8px;
  white-space: nowrap;
}

.whisper-act {
  padding: 0 8px;
  margin-left: 4px;
  font-family: inherit;
  font-size: 0.9em;
  font-style: normal;
  color: var(--ink-faded);
  background: transparent;
  border: 1px dashed var(--ink-faded);
  border-radius: 3px;
  cursor: pointer;
}

.whisper-act.obey {
  color: var(--sin);
  border-color: var(--sin);
}

.whisper-act:hover {
  color: var(--parchment);
  background: var(--sin);
}

/* ── 氛围:纠察之眼 / 会议蜡烛 ── */

.watch-eye.hot {
  color: var(--sin);
  text-shadow: 0 0 6px var(--sin);
  animation: eye-throb 1.8s ease-in-out infinite;
}

@keyframes eye-throb {
  50% {
    text-shadow: 0 0 12px var(--sin);
  }
}

.countdown.urgent {
  color: var(--rubric);
  animation: flame-flicker 0.9s ease-in-out infinite;
}

@keyframes flame-flicker {
  50% {
    opacity: 0.55;
  }
}

/* ── 三轴走势 sparkline ── */

.dossier-trend {
  width: 100%;
  height: 42px;
  margin: 2px 0 8px;
  background: var(--parchment-dark);
  border: 1px solid var(--gilt);
  border-radius: 3px;
}

.dossier-trend polyline {
  fill: none;
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}

.trend-support {
  stroke: var(--gilt-bright);
}

.trend-sin {
  stroke: var(--sin);
}

.trend-faith {
  stroke: #4a6b8a;
}

.axis-delta {
  width: 2.2em;
  font-size: 0.9em;
  color: var(--ink-faded);
}

.axis-delta.up {
  color: var(--sin);
  font-weight: 700;
}

.axis-delta.down {
  color: #4a6b8a;
  font-weight: 700;
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
  max-height: 62vh;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.story p {
  margin: 0 0 0.9em;
  text-indent: 2em;
}

.story-entry:last-child p:last-child {
  margin-bottom: 0;
}

.scribing {
  text-indent: 0 !important;
  font-size: 0.82em;
  font-style: italic;
  color: var(--ink-faded);
  animation: scribe-pulse 1.6s ease-in-out infinite;
}

@keyframes scribe-pulse {
  50% {
    opacity: 0.35;
  }
}

.story-player {
  text-indent: 0 !important;
  font-size: 0.9em;
  font-style: italic;
  color: var(--sin);
  border-left: 2px solid var(--gilt);
  padding-left: 8px;
  margin: 0.4em 0 0.9em !important;
}

/* ── 法典 ── */

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

/* 逐席翻牌:蜡封依次揭开 */
.vote-reveal {
  opacity: 0;
  animation: seal-flip 0.5s ease-out forwards;
}

@keyframes seal-flip {
  from {
    opacity: 0;
    transform: rotateX(80deg);
  }
  to {
    opacity: 1;
    transform: rotateX(0);
  }
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
