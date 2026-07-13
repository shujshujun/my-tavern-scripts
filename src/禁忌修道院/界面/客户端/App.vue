<template>
  <div class="codex">
    <div class="page">
      <!-- 错误护栏:任何运行时异常显示在此,不再整屏空白 -->
      <div v-if="错误信息" class="err">⚠ 界面异常:{{ 错误信息 }}</div>

      <!-- ═══════════ 数据未就绪 ═══════════ -->
      <template v-if="!就绪">
        <div class="agenda-hint">……羊皮纸尚在展开(等待存档数据)……</div>
      </template>

      <!-- ═══════════ 会议场景(整幅牧师会礼堂) ═══════════ -->
      <template v-else-if="data.会议.状态 === '会议中'">
        <header class="codex-header">✦ 牧师会礼堂 · 修女会议 ✦</header>

        <div class="meeting-body">
          <!-- 选议程 -->
          <div v-if="!会议结果" class="agenda">
            <p class="agenda-hint">院规刻于石墙。神父可就其中一条,提出修订。</p>
            <label v-for="项 in 可提案" :key="项.规则.id" class="agenda-item" :class="{ chosen: 选中 === 项.规则.id }">
              <input v-model="选中" type="radio" :value="项.规则.id" />
              <span class="agenda-weight" :data-w="项.规则.权重">{{ 项.规则.权重 }}</span>
              <span class="agenda-name">《{{ 项.规则.名称 }}》</span>
              <span class="agenda-next">→ 「{{ 项.下一档.名称 }}」</span>
              <span class="seats">
                <i v-for="s in 席位预测(项.规则.id)" :key="s.名" class="seat" :data-s="s.态" :title="s.名">{{
                  s.态 === 'fog' ? '?' : s.名[0]
                }}</i>
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
            <p v-if="会议结果.类型 === '院长抢案'" class="agenda-hint">(神父的原案票面不足,未及宣读即被主持权压下)</p>
            <button class="rite-btn" @click="离开">离开会议厅</button>
          </div>
        </div>
      </template>

      <!-- ═══════════ 日常场景 ═══════════ -->
      <template v-else>
        <header class="codex-header">✠ 圣维罗妮卡修道院 ✠</header>

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
          <span class="meta-btns">
            <button class="codex-toggle" @click="显示法典 = true">☨ 法典</button>
            <button class="codex-toggle" title="完整编年史与时之烛台" @click="显示史册 = true">🕮 史册</button>
            <button
              v-if="data.商店?.解锁"
              class="codex-toggle market"
              title="玛尔大的销赃渠道,反过来为神父进货"
              @click="显示黑市 = true"
            >
              ⚖ 黑市
            </button>
          </span>
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

        <!-- 正文书页:只演当前幕(完整历史与时之烛台在史册卷轴里) -->
        <section ref="卷轴容器" class="story">
          <div v-for="(条, i) in 当前幕" :key="i" class="story-entry">
            <p v-if="条.谁 === '玩家'" class="story-player">✠ {{ 条.文本[0] }}</p>
            <template v-else>
              <p v-for="(段, j) in 条.文本" :key="j" :class="配首字(段, j)">{{ 段 }}</p>
            </template>
          </div>
          <div v-if="发送中" class="story-entry">
            <p v-for="(段, j) in 流式段" :key="'流' + j" :class="配首字(段, j)">{{ 段 }}</p>
            <p class="scribing">✒ 修道院的记事员正在书写……</p>
          </div>
        </section>

        <!-- 恶魔低语:神父心底的恶念/对剧情的腹黑旁注(不是行动指引),只可划掉 -->
        <footer v-if="data.恶魔低语 && 已划掉低语 !== data.恶魔低语" class="whisper">
          <span class="imp">🜏</span> {{ data.恶魔低语 }}
          <span class="whisper-acts">
            <button class="whisper-act" title="划掉这行批注" @click="已划掉低语 = data.恶魔低语">划掉</button>
          </span>
        </footer>
      </template>

      <!-- ═══════════ 法典(羊皮大卷轴) ═══════════ -->
      <div v-if="显示法典" class="scroll-mask" @click.self="显示法典 = false">
        <div class="scroll">
          <button class="scroll-close" @click="显示法典 = false">✕</button>
          <div class="scroll-title">☨ 院 规 法 典 ☨</div>
          <div class="scroll-body">
            <div class="rule-list">
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
                      :title="
                        s.名 +
                        ':' +
                        (s.态 === 'fog' ? '未知' : s.态 === 'yes' ? '赞成' : s.态 === 'no' ? '反对' : '弃权')
                      "
                      >{{ s.态 === 'fog' ? '?' : s.名[0] }}</i
                    >
                  </span>
                </div>
                <div v-else class="rule-next exhausted">已修订至极限</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 黑市(圣器事件解锁) ═══════════ -->
      <div v-if="显示黑市" class="scroll-mask" @click.self="显示黑市 = false">
        <div class="scroll">
          <button class="scroll-close" @click="显示黑市 = false">✕</button>
          <div class="scroll-title">⚖ 玛尔大的暗账</div>
          <div class="market-balance">
            奉献金 <b>✟ {{ data.奉献金 }}</b>
            <span v-if="行囊名单" class="market-owned">行囊:{{ 行囊名单 }}</span>
          </div>
          <div class="scroll-body">
            <div class="rule-list">
              <div v-for="项 in 道具表" :key="项.id" class="rule-card ware">
                <div class="rule-head">
                  <span class="agenda-weight" :data-w="项.类 === '会议' ? '重' : '轻'">{{ 项.类 }}</span>
                  <b>{{ 项.名称 }}</b>
                  <span class="ware-price">✟ {{ 项.价 }}</span>
                </div>
                <div class="rule-text">{{ 项.说明 }}</div>
                <button class="reroll-btn ware-buy" :disabled="!可购买(项)" @click="买(项.id)">
                  {{ 购买标签(项) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 史册(完整编年卷轴 + 时之烛台) ═══════════ -->
      <div v-if="显示史册" class="scroll-mask" @click.self="显示史册 = false">
        <div class="scroll">
          <button class="scroll-close" @click="显示史册 = false">✕</button>
          <div class="scroll-title">🕮 修 道 院 史 册</div>
          <p class="agenda-hint">完整编年史。每页右下角的 🕯 是时之烛台:点两次,烧掉那一页之后的一切,回到当时。</p>
          <div class="scroll-body chronicle">
            <div v-for="(条, i) in 卷轴" :key="i" class="story-entry">
              <div v-if="条.谁 !== '玩家' && (条.楼 ?? 0) > 0" class="leaf-sep">
                <span>✦ 第 {{ 条.楼 }} 页 ✦</span>
              </div>
              <p v-if="条.谁 === '玩家'" class="story-player">✠ {{ 条.文本[0] }}</p>
              <template v-else>
                <p v-for="(段, j) in 条.文本" :key="j" :class="配首字(段, j)">{{ 段 }}</p>
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
          </div>
        </div>
      </div>

      <!-- ═══════════ 档案卡(点头像弹出;情报雾逐项揭开) ═══════════ -->
      <div v-if="选中档案" class="scroll-mask" @click.self="选中职位 = null">
        <div class="scroll dossier">
          <button class="scroll-close" @click="选中职位 = null">✕</button>
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
            <p v-if="选中档案.修女.当前心理想法" class="dossier-line"><b>心声</b> {{ 选中档案.修女.当前心理想法 }}</p>
            <p v-if="选中档案.修女.气质描述" class="dossier-line"><b>气质</b> {{ 选中档案.修女.气质描述 }}</p>
            <p class="dossier-line">
              <b>着装</b> {{ 选中档案.着装 }}<template v-if="选中档案.仪容">({{ 选中档案.仪容 }})</template>
            </p>
            <p v-if="选中档案.妆容行" class="dossier-line"><b>妆容</b> {{ 选中档案.妆容行 }}</p>

            <div class="dossier-line-title"><b>身体开发</b></div>
            <div class="dossier-axes">
              <div v-for="部位 in 选中档案.开发" :key="部位.名" class="dossier-axis">
                <span class="axis-label">{{ 部位.名 }}</span>
                <div class="axis">
                  <i class="bar dev" :style="{ width: 部位.值 + '%' }" />
                </div>
                <span class="axis-num">{{ 部位.值 }}</span>
              </div>
            </div>
            <div class="dossier-milestones">
              <div class="dossier-line-title">
                <b>{{ 选中档案.专线.线名 }}</b>
              </div>
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

          <button v-if="可晋阶(选中档案.职位)" class="ascend-btn" @click="晋阶(选中档案.职位)">✦ 跨过界线</button>
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
        <button class="reroll-btn" title="撤回这一页:删掉本回合(你的行动与回应),回到落笔之前重新措辞" @click="撤回">
          ⌫ 撤回此页
        </button>
        <button class="reroll-btn" title="撕掉这一页重写:回滚本回合的一切,用同样的行动重新演一遍" @click="重掷">
          ↻ 重写此页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 修女职位列表, type 修女职位 } from '../../schema';
import type { 会议结果 as 会议结果类型 } from '../../脚本/游戏逻辑/meetingSystem';
import { 感知语 } from '../../脚本/游戏逻辑/snapshotSystem';
import { 常规投票人, 计算单票 } from '../../脚本/游戏逻辑/voteEngine';
import { 查档, 查道具, 查规则, 道具表, 晋阶堕落门槛, 修女表, 院规表, 专线表, type 道具定义 } from '../../stageConfig';
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

/** 撤回本回合:删掉你的行动与 AI 回应,回到落笔之前(不重演,自己重新措辞) */
function 撤回() {
  if (发送中.value) return;
  const 记录 = _.get(getVariables({ type: 'chat' }), '_上次回合') as { 回合前末楼?: number } | undefined;
  if (!记录 || typeof 记录.回合前末楼 !== 'number') return;
  发送中.value = true;
  流式段.value = [];
  eventEmit('禁忌修道院:回档', { 楼层: 记录.回合前末楼 });
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

// ── 恶魔低语:神父心底的恶念/剧情腹黑旁注(非行动指引);划掉=本条隐去,下条低语再现 ──

const 已划掉低语 = ref('');

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
const 显示黑市 = ref(false);

// ── 黑市(圣器事件解锁;校验在脚本,这里只做展示与去抖) ──

const 行囊名单 = computed(() =>
  (data.value?.商店?.已购 ?? [])
    .map(id => 查道具(id)?.名称)
    .filter(Boolean)
    .join('、'),
);

function 可购买(项: 道具定义): boolean {
  if ((data.value?.奉献金 ?? 0) < 项.价) return false;
  if (项.类 === '攻略' && data.value.商店.已购.includes(项.id)) return false;
  return true;
}

function 购买标签(项: 道具定义): string {
  if (项.类 === '攻略' && data.value.商店.已购.includes(项.id)) return '已在行囊';
  if ((data.value?.奉献金 ?? 0) < 项.价) return '奉献金不足';
  return '买下';
}

function 买(id: string) {
  eventEmit('禁忌修道院:购买', { id });
}

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
    着装: [服.头纱, 服.上装, 服.下装, 服.内衣上, 服.内衣下, 服.袜足, 服.鞋, 服.配饰, 服.特殊装饰]
      .filter(x => x && x !== '无')
      .join('、'),
    仪容: [修女.暴露程度 !== '遮蔽' ? `暴露:${修女.暴露程度}` : '', 修女.整洁度 !== '整洁' ? 修女.整洁度 : '']
      .filter(Boolean)
      .join(' · '),
    妆容行: [修女.妆容.底妆, 修女.妆容.唇妆, 修女.妆容.眼妆, 修女.妆容.香氛]
      .filter(x => x && x !== '无' && x !== '素颜')
      .join('、'),
    开发: [
      { 名: '小嘴', 值: 修女.身体开发.小嘴 },
      { 名: '胸部', 值: 修女.身体开发.胸部 },
      { 名: '小屄', 值: 修女.身体开发.小屄 },
      { 名: '屁穴', 值: 修女.身体开发.屁穴 },
    ],
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
const 显示史册 = ref(false);

/** 泥金首字只给"以汉字开头的叙事首段"——标记/符号开头不放大(防预设残渣被泵金) */
function 配首字(段: string, j: number): string {
  return j === 0 && /^[一-鿿]/.test(段) ? 'narr versal' : 'narr';
}

/** 正文书页只演当前幕:从最后一条玩家行动起(开场时=整卷开场白);完整历史在史册 */
const 当前幕 = computed(() => {
  const 列表 = 卷轴.value;
  if (!列表.length) return [];
  let 起 = 列表.length - 1;
  while (起 > 0 && 列表[起].谁 !== '玩家') 起 -= 1;
  return 列表[起].谁 === '玩家' ? 列表.slice(起) : 列表;
});

function 清洗(原文: string): string {
  return (
    原文
      .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
      .replace(/<StatusPlaceHolderImpl\/>/g, '')
      .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
      .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '') // 预设泄漏的注释标记(如 Test Inputs Were Rejected)
      .replace(/^\s*-{2,}>?\s*$/gm, '')
      .replace(/<行动选项>[\s\S]*?<\/行动选项>/g, '')
      // 流式过程中的未闭合块也要吞掉,否则半截思维链/变量块会闪现在书页上
      .replace(/<think(?:ing)?>[\s\S]*$/i, '')
      .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
      .replace(/<!--[\s\S]*$/, '')
      .replace(/<UpdateVariable>[\s\S]*$/, '')
      .replace(/<行动选项>[\s\S]*$/, '')
      .replace(/【主页】/g, '')
      .trim()
  );
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
          历史[职位] ??= { 支持: [], 堕落: [], 信仰: [] };
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
  显示史册.value = false;
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
    const 票 = 计算单票(职位, { 支持度: 修.支持度, 堕落度: 修.堕落度 }, 规则id, 目标档, 职位 === '纠察' && 把柄弃权);
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
  院规表.map(规则 => ({ 规则, 下一档: 规则.档位[data.value.院规[规则.id] ?? 0] })).filter(项 => 项.下一档),
);

const 议程名 = computed(() => (会议结果.value ? 查规则(会议结果.value.议程规则id)?.名称 : ''));
const 档名 = computed(() => (会议结果.value ? 查档(会议结果.value.议程规则id, 会议结果.value.议程档)?.名称 : ''));
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
    流式段.value = 净文
      ? 净文
          .split(/\n+/)
          .map(s => s.trim())
          .filter(Boolean)
      : [];
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
/* ═══════════════════════════════════════════════════════════════
   魂系暗金(艾尔登法环纲领):近黑暖底 / 鎏金细线 / 碑文金字 / 克制留白
   ═══════════════════════════════════════════════════════════════ */

/* ── 画框:黑檀底 + 双重鎏金发丝线(固定画幅,内部各区自行滚动) ── */

.codex {
  box-sizing: border-box;
  height: var(--frame-h, 620px);
  padding: 7px;
  background:
    radial-gradient(ellipse 90% 60% at 50% -8%, rgba(201, 169, 78, 0.13), transparent 60%),
    radial-gradient(ellipse 120% 90% at 50% 108%, rgba(0, 0, 0, 0.55), transparent 55%),
    linear-gradient(175deg, var(--void-2), var(--void) 60%);
  border: 1px solid var(--line);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.8),
    inset 0 0 0 1px rgba(0, 0, 0, 0.9),
    inset 0 0 90px rgba(0, 0, 0, 0.55);
}

.page {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 8px 14px 10px;
  border: 1px solid var(--line-soft);
  background: transparent;
}

/* 圣坛微光:顶部一缕金色天光,微微呼吸 */
.page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 70% 34% at 50% 0%, rgba(233, 209, 151, 0.09), transparent 70%);
  animation: altar-breath 7s ease-in-out infinite;
}

@keyframes altar-breath {
  50% {
    opacity: 0.55;
  }
}

.err {
  white-space: pre-wrap;
  word-break: break-all;
  background: rgba(122, 26, 26, 0.85);
  color: #ffe9e0;
  border: 1px solid var(--rubric);
  padding: 6px 8px;
  margin-bottom: 8px;
  font-size: 0.75em;
}

/* ── 碑文题头:金字 + 左右细金线(黑魂标题式分隔) ── */

.codex-header {
  flex: none;
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-title);
  font-weight: 400;
  font-size: 1.12em;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  color: var(--gold-bright);
  text-shadow:
    0 0 14px rgba(201, 169, 78, 0.4),
    0 1px 2px #000;
  padding: 5px 0 7px;
  margin: 0 0 6px;
  justify-content: center;
}

.codex-header::before,
.codex-header::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line) 45%, var(--line) 55%, transparent);
}

/* ── 圣物计数条:极简一行,金符号 ── */

.meta-row {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px 16px;
  justify-content: center;
  font-size: 0.85em;
  color: var(--bone-faded);
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
  padding: 4px 8px;
  margin-bottom: 7px;
  background: linear-gradient(180deg, rgba(201, 169, 78, 0.05), transparent);
}

.meta-btns {
  display: inline-flex;
  gap: 8px;
}

/* 魂系按钮:透明底 + 细金框,悬停金光浮起 */
.codex-toggle {
  padding: 1px 12px;
  font-family: var(--font-body);
  font-size: 1em;
  color: var(--gold);
  background: transparent;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.25s ease;
}

.codex-toggle:hover {
  color: var(--gold-bright);
  border-color: var(--gold);
  box-shadow:
    0 0 10px rgba(201, 169, 78, 0.35),
    inset 0 0 8px rgba(201, 169, 78, 0.12);
  text-shadow: 0 0 8px rgba(233, 209, 151, 0.6);
}

/* ── 头像行:暗色圣徽章,焦点者燃起金光 ── */

.avatar-row {
  flex: none;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 5px 11px;
  margin-bottom: 8px;
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
  font-family: var(--font-title);
  font-size: 1.1em;
  color: var(--bone);
  background: radial-gradient(circle at 38% 30%, #2e2512, var(--void-2) 68%);
  border: 1px solid var(--line);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.6),
    inset 0 0 10px rgba(0, 0, 0, 0.6);
  transition: all 0.45s ease;
}

.avatar-name {
  font-size: 0.66em;
  color: var(--bone-faded);
  letter-spacing: 0.08em;
  transition: all 0.45s ease;
}

.avatar.focus .avatar-glyph {
  color: var(--gold-bright);
  border-color: var(--gold);
  box-shadow:
    0 0 14px rgba(201, 169, 78, 0.55),
    inset 0 0 10px rgba(201, 169, 78, 0.25);
  text-shadow: 0 0 10px rgba(233, 209, 151, 0.8);
}

.avatar.focus .avatar-name {
  color: var(--gold);
}

.avatar.ambient .avatar-glyph {
  color: var(--gold);
  border-color: var(--line);
  box-shadow:
    0 0 6px rgba(201, 169, 78, 0.22),
    inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.avatar.away {
  opacity: 0.38;
}

.avatar.veiled {
  cursor: default;
  opacity: 0.5;
}

.avatar.veiled .avatar-glyph {
  color: var(--bone-faded);
  border-style: dashed;
  background: radial-gradient(circle at 40% 30%, #1c1509, var(--void) 75%);
}

/* ── 正文:唯一滚动区。骨白碑文,金色泥金首字 ── */

.story {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 16px;
  font-size: 0.95em;
  line-height: 2;
  color: var(--bone);
  background: linear-gradient(180deg, rgba(201, 169, 78, 0.035), transparent 60px);
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
  scrollbar-width: thin;
  scrollbar-color: var(--gold-deep) transparent;
}

.story p {
  margin: 0 0 0.95em;
  text-indent: 2em;
}

.story-entry:last-child p:last-child {
  margin-bottom: 0;
}

/* 泥金首字(versal):仅当叙事首段以汉字开头才放大(标记/符号开头不放,防预设残渣被泵金) */
.versal::first-letter {
  float: left;
  font-family: var(--font-title);
  font-size: 2.5em;
  line-height: 0.95;
  padding: 3px 7px 0 0;
  color: var(--gold);
  text-shadow: 0 0 12px rgba(201, 169, 78, 0.45);
}

.versal {
  text-indent: 0 !important;
}

.story-player {
  text-indent: 0 !important;
  font-size: 0.88em;
  font-style: italic;
  color: var(--gold);
  opacity: 0.85;
  border-left: 1px solid var(--rubric);
  padding-left: 10px;
  margin: 0.5em 0 1em !important;
}

.scribing {
  text-indent: 0 !important;
  font-size: 0.82em;
  font-style: italic;
  color: var(--bone-faded);
  animation: scribe-pulse 1.6s ease-in-out infinite;
}

@keyframes scribe-pulse {
  50% {
    opacity: 0.3;
  }
}

/* ── 底区:低语 / 建议 / 羽笔(钉死画幅底部) ── */

.whisper {
  flex: none;
  margin-top: 6px;
  padding-top: 5px;
  border-top: 1px dashed rgba(122, 38, 71, 0.55);
  font-size: 0.8em;
  font-style: italic;
  color: #b06a8a;
}

.whisper-acts {
  margin-left: 8px;
  white-space: nowrap;
}

.whisper-act {
  padding: 0 9px;
  margin-left: 4px;
  font-family: var(--font-body);
  font-size: 0.9em;
  font-style: normal;
  color: var(--bone-faded);
  background: transparent;
  border: 1px solid rgba(143, 129, 95, 0.4);
  cursor: pointer;
  transition: all 0.25s ease;
}

.whisper-act.obey {
  color: #b06a8a;
  border-color: rgba(176, 106, 138, 0.6);
}

.whisper-act:hover {
  color: #efd4e2;
  background: var(--sin);
  border-color: var(--sin);
}

.option-row {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.option-chip {
  padding: 3px 12px;
  font-family: var(--font-body);
  font-size: 0.8em;
  color: var(--bone);
  background: rgba(201, 169, 78, 0.06);
  border: 1px solid var(--line-soft);
  cursor: pointer;
  text-align: left;
  transition: all 0.25s ease;
}

.option-chip:hover {
  color: var(--gold-bright);
  border-color: var(--gold);
  box-shadow: 0 0 10px rgba(201, 169, 78, 0.3);
  text-shadow: 0 0 6px rgba(233, 209, 151, 0.5);
}

.quill {
  flex: none;
  display: flex;
  gap: 6px;
  margin-top: 7px;
  padding-top: 7px;
  border-top: 1px solid var(--line-soft);
}

.quill textarea {
  flex: 1;
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: 0.88em;
  line-height: 1.5;
  color: var(--bone);
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--line-soft);
  box-shadow: inset 0 1px 6px rgba(0, 0, 0, 0.5);
  padding: 6px 10px;
  resize: none;
  transition: border-color 0.25s ease;
}

.quill textarea:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow:
    inset 0 1px 6px rgba(0, 0, 0, 0.5),
    0 0 10px rgba(201, 169, 78, 0.25);
}

.quill textarea::placeholder {
  color: var(--bone-faded);
  opacity: 0.6;
}

.quill-btn {
  margin: 0;
  align-self: stretch;
  padding: 0 20px;
  white-space: nowrap;
}

.reroll-row {
  flex: none;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.reroll-btn {
  padding: 1px 10px;
  font-family: var(--font-body);
  font-size: 0.75em;
  color: var(--bone-faded);
  background: transparent;
  border: 1px solid rgba(143, 129, 95, 0.35);
  cursor: pointer;
  transition: all 0.25s ease;
}

.reroll-btn:hover {
  color: var(--gold);
  border-color: var(--gold);
  text-shadow: 0 0 6px rgba(233, 209, 151, 0.5);
}

/* ═══════════ 弹窗(法典/史册/档案卡):魂系菜单——暗幕升起,金线画框 ═══════════ */

.scroll-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 4, 2, 0.78);
  backdrop-filter: blur(2px);
  animation: mask-in 0.25s ease;
}

@keyframes mask-in {
  from {
    opacity: 0;
  }
}

.scroll {
  position: relative;
  box-sizing: border-box;
  width: 94%;
  height: 92%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px 18px;
  background:
    radial-gradient(ellipse 80% 40% at 50% -5%, rgba(201, 169, 78, 0.1), transparent 65%),
    linear-gradient(175deg, #1b1509, var(--void) 70%);
  border: 1px solid var(--line);
  outline: 1px solid rgba(0, 0, 0, 0.9);
  outline-offset: 2px;
  box-shadow:
    0 16px 60px rgba(0, 0, 0, 0.9),
    inset 0 0 70px rgba(0, 0, 0, 0.5);
  animation: menu-rise 0.32s cubic-bezier(0.2, 0.8, 0.3, 1);
}

@keyframes menu-rise {
  from {
    transform: translateY(14px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.scroll-close {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 1;
  width: 26px;
  height: 26px;
  border: 1px solid var(--line-soft);
  border-radius: 50%;
  background: transparent;
  color: var(--bone-faded);
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.25s ease;
}

.scroll-close:hover {
  color: var(--gold-bright);
  border-color: var(--gold);
}

.scroll-title {
  flex: none;
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: center;
  font-family: var(--font-title);
  font-weight: 400;
  letter-spacing: 0.4em;
  text-indent: 0.4em;
  font-size: 1.1em;
  color: var(--gold-bright);
  text-shadow:
    0 0 14px rgba(201, 169, 78, 0.45),
    0 1px 2px #000;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.scroll-title::before,
.scroll-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line) 45%, var(--line) 55%, transparent);
}

.scroll-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 2px 10px;
  scrollbar-width: thin;
  scrollbar-color: var(--gold-deep) transparent;
}

.chronicle {
  font-size: 0.92em;
  line-height: 1.95;
  color: var(--bone);
}

.chronicle p {
  margin: 0 0 0.9em;
  text-indent: 2em;
}

/* 史册分页:每一页(楼)一条金线页码 */
.leaf-sep {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 1.1em 0 0.9em;
  font-size: 0.72em;
  letter-spacing: 0.25em;
  color: var(--gold);
  opacity: 0.8;
}

.leaf-sep::before,
.leaf-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line-soft) 40%, var(--line-soft) 60%, transparent);
}

/* ── 时之烛台 ── */

.candle-row {
  text-indent: 0 !important;
  text-align: right;
  margin: -0.4em 0 0.6em !important;
}

.candle {
  padding: 0 6px;
  font-family: var(--font-body);
  font-size: 0.72em;
  color: var(--bone-faded);
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.25s ease;
}

.candle:hover {
  opacity: 1;
  text-shadow: 0 0 8px rgba(233, 209, 151, 0.7);
}

.candle.armed {
  opacity: 1;
  color: #efd4e2;
  background: var(--sin);
  border: 1px solid var(--gold);
}

/* ── 档案卡(窄幅碑铭) ── */

.scroll.dossier {
  width: min(92%, 460px);
  height: auto;
  max-height: 88%;
  overflow-y: auto;
  display: block;
  padding: 18px 20px;
  scrollbar-width: thin;
  scrollbar-color: var(--gold-deep) transparent;
}

.dossier-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 7px;
  margin-bottom: 10px;
}

.dossier-name {
  font-family: var(--font-title);
  font-size: 1.3em;
  color: var(--gold-bright);
  text-shadow: 0 0 10px rgba(201, 169, 78, 0.4);
}

.dossier-role {
  font-size: 0.8em;
  color: var(--bone-faded);
}

.dossier-stage {
  margin-left: auto;
  margin-right: 24px;
  font-size: 0.85em;
  color: var(--rubric);
  font-weight: 700;
}

.dossier-axes {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 9px;
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
  color: var(--bone-faded);
}

.axis-num {
  width: 2em;
  text-align: right;
  color: var(--bone);
  font-variant-numeric: tabular-nums;
}

.axis-delta {
  width: 2.2em;
  font-size: 0.9em;
  color: var(--bone-faded);
}

.axis-delta.up {
  color: var(--rubric);
  font-weight: 700;
}

.axis-delta.down {
  color: #5f7d99;
  font-weight: 700;
}

.dossier-trend {
  width: 100%;
  height: 44px;
  margin: 2px 0 9px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--line-soft);
}

.dossier-trend polyline {
  fill: none;
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}

.trend-support {
  stroke: var(--gold);
}

.trend-sin {
  stroke: var(--rubric);
}

.trend-faith {
  stroke: #5f7d99;
}

.dossier-sense {
  font-size: 0.85em;
  font-style: italic;
  color: var(--bone);
  margin: 0 0 7px;
}

.dossier-line {
  font-size: 0.82em;
  color: var(--bone);
  margin: 0 0 4px;
}

.dossier-line b {
  color: var(--gold);
  font-weight: 400;
  margin-right: 5px;
}

.dossier-line-title {
  font-size: 0.82em;
  color: var(--gold);
  margin: 7px 0 3px;
}

.milestone {
  font-size: 0.8em;
  color: var(--bone-faded);
  padding-left: 8px;
}

.milestone.done {
  color: var(--gold-bright);
}

.dossier-sealed {
  font-size: 0.82em;
  font-style: italic;
  color: var(--bone-faded);
  border: 1px dashed var(--line-soft);
  padding: 7px 9px;
}

/* ── 三轴条 ── */

.axis {
  height: 3px;
  background: rgba(201, 169, 78, 0.12);
  overflow: hidden;
}

.bar {
  display: block;
  height: 100%;
  transition: width 0.4s ease;
}

.bar.support {
  background: linear-gradient(90deg, var(--gold-deep), var(--gold-bright));
}

.bar.sin {
  background: linear-gradient(90deg, #5c1c10, var(--rubric));
}

.bar.faith {
  background: linear-gradient(90deg, #2e4457, #6f93b4);
}

.bar.dev {
  background: linear-gradient(90deg, #4a1830, #b0508a);
}

/* ── 氛围:纠察之眼 / 会议蜡烛 ── */

.watch-eye.hot {
  color: var(--rubric);
  text-shadow: 0 0 8px var(--rubric);
  animation: eye-throb 1.8s ease-in-out infinite;
}

@keyframes eye-throb {
  50% {
    text-shadow: 0 0 16px var(--rubric);
  }
}

.countdown.urgent {
  color: var(--gold-bright);
  animation: flame-flicker 0.9s ease-in-out infinite;
}

@keyframes flame-flicker {
  50% {
    opacity: 0.5;
  }
}

/* ── 黑市 ── */

.codex-toggle.market {
  color: #b06a8a;
  border-color: rgba(176, 106, 138, 0.45);
}

.codex-toggle.market:hover {
  color: #e8b4cc;
  border-color: #b06a8a;
  box-shadow: 0 0 10px rgba(176, 106, 138, 0.35);
  text-shadow: 0 0 8px rgba(232, 180, 204, 0.6);
}

.market-balance {
  flex: none;
  text-align: center;
  font-size: 0.85em;
  color: var(--bone-faded);
  margin-bottom: 8px;
}

.market-balance b {
  color: var(--gold-bright);
  font-weight: 400;
  margin-right: 12px;
}

.market-owned {
  font-size: 0.9em;
}

.ware-price {
  margin-left: auto;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

.ware-buy {
  margin-top: 5px;
}

.ware-buy:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── 法典 ── */

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.rule-card {
  background: rgba(201, 169, 78, 0.045);
  border: 1px solid var(--line-soft);
  border-left: 2px solid var(--gold-deep);
  padding: 8px 11px;
  font-size: 0.84em;
  color: var(--bone);
  transition: border-color 0.25s ease;
}

.rule-card:hover {
  border-left-color: var(--gold);
}

.rule-head {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--gold-bright);
}

.rule-current {
  color: var(--rubric);
  font-weight: 700;
}

.rule-text {
  margin: 4px 0;
  color: var(--bone);
}

/* palimpsest:被刮去的旧律,灰烬色透出 */
.palimpsest {
  text-decoration: line-through;
  color: rgba(143, 129, 95, 0.55);
  font-size: 0.9em;
}

.rule-next {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--bone-faded);
  font-size: 0.9em;
}

.rule-next.exhausted {
  color: var(--gold);
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
  border: 1px solid var(--bone-faded);
  color: var(--bone-faded);
  background: transparent;
}

.seat[data-s='yes'] {
  border-color: var(--gold);
  color: var(--gold-bright);
  box-shadow: 0 0 5px rgba(201, 169, 78, 0.4);
}

.seat[data-s='no'] {
  border-color: var(--rubric);
  color: var(--rubric);
}

.seat[data-s='abstain'] {
  border-color: var(--bone-faded);
  color: var(--void);
  background: var(--bone-faded);
}

.ascend-btn {
  margin-top: 8px;
  width: 100%;
  padding: 4px 0;
  font-family: var(--font-title);
  font-size: 0.85em;
  letter-spacing: 0.25em;
  text-indent: 0.25em;
  color: #e8b4cc;
  background: linear-gradient(180deg, rgba(122, 38, 71, 0.5), rgba(122, 38, 71, 0.25));
  border: 1px solid var(--sin);
  cursor: pointer;
  animation: ascend-glow 2.2s ease-in-out infinite;
  transition: all 0.25s ease;
}

.ascend-btn:hover {
  color: #ffe6f2;
  border-color: #b06a8a;
}

@keyframes ascend-glow {
  50% {
    box-shadow: 0 0 12px rgba(122, 38, 71, 0.8);
  }
}

.imp {
  font-style: normal;
}

/* ── 会议 ── */

.meeting-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 2px 2px 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--gold-deep) transparent;
}

.agenda-hint {
  font-size: 0.8em;
  color: var(--bone-faded);
  text-align: center;
  margin: 4px 0 9px;
}

.agenda-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  margin-bottom: 5px;
  border: 1px solid var(--line-soft);
  background: rgba(201, 169, 78, 0.04);
  cursor: pointer;
  font-size: 0.85em;
  color: var(--bone);
  transition: all 0.25s ease;
}

.agenda-item:hover {
  border-color: var(--line);
}

.agenda-item.chosen {
  border-color: var(--gold);
  background: rgba(201, 169, 78, 0.1);
  box-shadow:
    0 0 12px rgba(201, 169, 78, 0.25),
    inset 0 0 10px rgba(201, 169, 78, 0.08);
}

.agenda-item input {
  display: none;
}

.agenda-weight {
  font-size: 0.75em;
  padding: 0 5px;
  border: 1px solid var(--bone-faded);
  color: var(--bone-faded);
}

.agenda-weight[data-w='中'] {
  border-color: var(--gold);
  color: var(--gold);
}

.agenda-weight[data-w='重'] {
  border-color: var(--rubric);
  color: var(--rubric);
}

.agenda-name {
  font-weight: 700;
  color: var(--gold-bright);
}

.agenda-next {
  color: var(--bone-faded);
}

/* 主仪式按钮:碑金 */
.rite-btn {
  display: block;
  margin: 10px auto 2px;
  padding: 6px 26px;
  font-family: var(--font-title);
  font-size: 1em;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  color: var(--gold);
  background: transparent;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.25s ease;
}

.rite-btn:hover:not(:disabled) {
  color: var(--gold-bright);
  border-color: var(--gold);
  box-shadow:
    0 0 14px rgba(201, 169, 78, 0.4),
    inset 0 0 10px rgba(201, 169, 78, 0.12);
  text-shadow: 0 0 10px rgba(233, 209, 151, 0.7);
}

.rite-btn:disabled {
  color: var(--bone-faded);
  border-color: rgba(143, 129, 95, 0.3);
  cursor: not-allowed;
}

.verdict-banner {
  text-align: center;
  font-family: var(--font-title);
  font-size: 1.05em;
  letter-spacing: 0.14em;
  padding: 10px;
  margin-bottom: 10px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  text-shadow: 0 1px 2px #000;
}

.verdict-banner.passed {
  color: var(--gold-bright);
  background: linear-gradient(180deg, rgba(201, 169, 78, 0.14), rgba(201, 169, 78, 0.04));
  text-shadow: 0 0 14px rgba(201, 169, 78, 0.5);
}

.verdict-banner.rejected {
  color: var(--bone-faded);
  background: rgba(143, 129, 95, 0.08);
}

.verdict-banner.seized {
  color: #e8b4cc;
  background: linear-gradient(180deg, rgba(122, 38, 71, 0.35), rgba(122, 38, 71, 0.1));
  border-color: var(--sin);
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
  padding: 7px 4px;
  border: 1px solid var(--line-soft);
  background: rgba(201, 169, 78, 0.04);
  color: var(--bone);
}

/* 逐席揭示:烛光依次燃起 */
.vote-reveal {
  opacity: 0;
  animation: seal-flip 0.55s ease-out forwards;
}

@keyframes seal-flip {
  from {
    opacity: 0;
    transform: translateY(6px);
    filter: brightness(2.2);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: brightness(1);
  }
}

.vote-card[data-v='赞成'] {
  border-color: var(--gold);
  box-shadow:
    0 0 10px rgba(201, 169, 78, 0.3),
    inset 0 0 8px rgba(201, 169, 78, 0.08);
}

.vote-card[data-v='反对'] {
  border-color: var(--rubric);
  box-shadow: inset 0 0 8px rgba(154, 49, 32, 0.15);
}

.vote-name {
  font-weight: 700;
  font-size: 0.85em;
  color: var(--gold-bright);
}

.vote-stance {
  font-size: 0.75em;
  color: var(--bone-faded);
}
</style>
