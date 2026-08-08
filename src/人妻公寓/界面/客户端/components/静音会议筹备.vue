<script setup lang="ts">
// 静音会议筹备弹窗(App A7b1 从 App.vue 等价外移)。
// 纯展示：只按 props 渲染「选妻子/议题 → 最后确认」两阶段并 emit 动作；
// 筹备状态、候选派生、800/1200ms timer、事件总线与 store pull 全部留在 App。
import type { 静音会议筹备步骤 } from '../types';
import type { 静音会议候选门牌 } from '../../../静音会议配置';

interface 静音会议候选 {
  门牌: 静音会议候选门牌;
  妻名: string;
  夫名: string;
  合格: boolean;
  原因: string;
}

defineProps<{
  step: 静音会议筹备步骤;
  candidates: readonly 静音会议候选[];
  selectedWives: readonly 静音会议候选门牌[];
  topic: string;
  topics: readonly string[];
  canConfirm: boolean;
  wifeNames: readonly string[];
  husbandNames: readonly string[];
  submitting: boolean;
  avatarFailed: Readonly<Record<string, boolean>>;
  avatarImage: (name: string) => string;
}>();

const emit = defineEmits<{
  close: [];
  toggleWife: [room: 静音会议候选门牌];
  selectTopic: [topic: string];
  confirm: [];
  back: [];
  submit: [];
  avatarError: [name: string];
}>();
</script>

<template>
  <div v-if="step" class="mask mute-prep-mask" @click.self="emit('close')">
    <section class="sheet mute-prep-sheet" role="dialog" aria-modal="true" aria-label="筹备静音会议">
      <button class="sheet-close" type="button" :disabled="submitting" @click="emit('close')">✕</button>
      <div class="ui-kicker">MUTE MEETING / 筹备会议</div>

      <template v-if="step === '选择'">
        <h3>亲自确定与会名单</h3>
        <p class="mute-prep-lead">
          选择 2—3 名妻子。对应丈夫会自动列席；灰色候选仍展示真实不合格原因，不会被系统代选。
        </p>
        <div class="mute-candidate-grid">
          <button
            v-for="候选 in candidates"
            :key="候选.门牌"
            type="button"
            class="mute-candidate"
            :class="{ on: selectedWives.includes(候选.门牌), ineligible: !候选.合格 }"
            :disabled="!候选.合格"
            :aria-pressed="selectedWives.includes(候选.门牌)"
            @click="emit('toggleWife', 候选.门牌)"
          >
            <span class="mute-candidate-avatar">
              <img
                v-if="!avatarFailed[候选.妻名]"
                :src="avatarImage(候选.妻名)"
                :alt="候选.妻名"
                @error="emit('avatarError', 候选.妻名)"
              />
              <b v-else>{{ 候选.妻名[0] }}</b>
            </span>
            <span class="mute-candidate-main">
              <b>{{ 候选.门牌 }} · {{ 候选.妻名 }}</b>
              <small>丈夫：{{ 候选.夫名 }}</small>
              <em :class="{ good: 候选.合格 }">{{ 候选.合格 ? '可以列席' : 候选.原因 }}</em>
            </span>
            <i>{{ selectedWives.includes(候选.门牌) ? '✓' : 候选.合格 ? '＋' : '—' }}</i>
          </button>
        </div>

        <div class="mute-topic-block">
          <b>本次真实议题</b>
          <div class="mute-topic-grid">
            <button
              v-for="议题 in topics"
              :key="议题"
              type="button"
              :class="{ on: topic === 议题 }"
              :aria-pressed="topic === 议题"
              @click="emit('selectTopic', 议题)"
            >
              {{ 议题 }}
            </button>
          </div>
        </div>

        <footer class="mute-prep-footer">
          <span :class="{ ready: canConfirm }">
            已选 {{ selectedWives.length }}/3 · {{ topic || '尚未选择议题' }}
          </span>
          <button class="btn rite" type="button" :disabled="!canConfirm" @click="emit('confirm')">
            查看会议通知
          </button>
        </footer>
      </template>

      <template v-else>
        <h3>发送前最后确认</h3>
        <p class="mute-prep-lead">这一步仍可返回修改。只有发送通知后才重新校验、消耗场景票并冻结演员名单。</p>
        <div class="mute-confirm-card">
          <dl>
            <div>
              <dt>参与妻</dt>
              <dd>{{ wifeNames.join('、') }}</dd>
            </div>
            <div>
              <dt>对应丈夫</dt>
              <dd>{{ husbandNames.join('、') }}</dd>
            </div>
            <div>
              <dt>地点</dt>
              <dd>管理员室 · 会场临时集合</dd>
            </div>
            <div>
              <dt>议题</dt>
              <dd>{{ topic }}</dd>
            </div>
          </dl>
          <ul>
            <li>开场后地图、离场、普通房间动作、商店、背包与监控入口锁定。</li>
            <li>人物只在演出层临时到场，不修改日常位置、作息、赴约或关系。</li>
            <li>将消耗 1 张「静音会议」票；条件变化时会拒绝开场且不消耗。</li>
          </ul>
        </div>
        <footer class="mute-prep-footer confirm">
          <button class="btn" type="button" :disabled="submitting" @click="emit('back')">
            返回修改
          </button>
          <button
            class="btn rite"
            type="button"
            :disabled="submitting || !canConfirm"
            @click="emit('submit')"
          >
            {{ submitting ? '正在重新校验…' : '发送会议通知并开始' }}
          </button>
        </footer>
      </template>
    </section>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
/* ═══ 静音会议筹备弹窗专属(App A7b1 等价外移):只属筹备;运行/会后样式仍留在 App ═══ */

.mute-prep-mask {
  z-index: 115;
}

.sheet.mute-prep-sheet {
  box-sizing: border-box;
  width: min(94%, 760px);
  max-height: calc(100% - 24px);
  padding: 20px;
  overflow: auto;
  overscroll-behavior: contain;
}

.mute-prep-sheet > h3 {
  margin: 7px 0 3px;
  font-size: 1.04em;
  color: var(--ink);
}

.mute-prep-lead {
  margin: 0 30px 12px 0;
  font-size: 0.75em;
  line-height: 1.55;
  color: var(--ink-soft);
}

.mute-candidate-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mute-candidate {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 22px;
  align-items: center;
  gap: 9px;
  padding: 9px;
  color: var(--ink-soft);
  text-align: left;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(50, 66, 72, 0.12);
  border-radius: 13px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.mute-candidate.on {
  color: #276b55;
  background: rgba(94, 202, 154, 0.13);
  border-color: rgba(51, 160, 112, 0.55);
  box-shadow: inset 3px 0 #56bc8d;
}

.mute-candidate.ineligible {
  color: var(--ink-faint);
  background: rgba(115, 118, 121, 0.08);
  filter: grayscale(0.85);
  cursor: not-allowed;
  opacity: 0.62;
}

.mute-candidate-avatar,
.mute-candidate-avatar img {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  object-fit: cover;
  background: #e7efed;
  border-radius: 50%;
}

.mute-candidate-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mute-candidate-main b {
  overflow: hidden;
  font-size: 0.76em;
  color: var(--ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mute-candidate-main small {
  font-size: 0.64em;
}

.mute-candidate-main em {
  font-size: 0.62em;
  font-style: normal;
  color: #9b5f5f;
}

.mute-candidate-main em.good {
  color: #388262;
}

.mute-candidate > i {
  font-size: 1em;
  font-style: normal;
  font-weight: 800;
  text-align: center;
}

.mute-topic-block {
  padding-top: 12px;
}

.mute-topic-block > b {
  display: block;
  margin-bottom: 7px;
  font-size: 0.75em;
  color: var(--ink);
}

.mute-topic-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.mute-topic-grid button {
  padding: 9px 7px;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(50, 66, 72, 0.12);
  border-radius: 10px;
  cursor: pointer;
}

.mute-topic-grid button.on {
  color: #6b3f61;
  background: rgba(210, 111, 165, 0.1);
  border-color: rgba(194, 79, 142, 0.45);
}

.mute-prep-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
}

.mute-prep-footer > span {
  min-width: 0;
  overflow: hidden;
  font-size: 0.68em;
  color: var(--ink-faint);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mute-prep-footer > span.ready {
  color: #398061;
}

.mute-prep-footer.confirm {
  justify-content: flex-end;
}

.mute-confirm-card {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(63, 87, 80, 0.14);
  border-radius: 14px;
}

.mute-confirm-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.mute-confirm-card dl > div {
  padding: 8px 9px;
  background: rgba(235, 244, 241, 0.68);
  border-radius: 9px;
}

.mute-confirm-card dt {
  margin-bottom: 3px;
  font: 700 0.6em/1 var(--font-mono);
  color: #51816f;
}

.mute-confirm-card dd {
  margin: 0;
  font-size: 0.74em;
  color: var(--ink);
}

.mute-confirm-card ul {
  padding-left: 18px;
  margin: 10px 0 0;
  font-size: 0.68em;
  line-height: 1.55;
  color: var(--ink-soft);
}

:global(html.rq-dark) .mute-confirm-card,
:global(html.rq-dark) .mute-candidate,
:global(html.rq-dark) .mute-topic-grid button {
  background-color: rgba(24, 29, 38, 0.86);
}

@media (max-width: 540px) {
  .sheet.mute-prep-sheet {
    width: calc(100% - 12px);
    max-height: calc(100% - 12px);
    padding: 16px 13px;
    border-radius: 15px;
  }

  .mute-candidate-grid,
  .mute-topic-grid,
  .mute-confirm-card dl {
    grid-template-columns: 1fr;
  }

  .mute-candidate {
    padding: 7px 8px;
  }

  .mute-prep-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .mute-prep-footer > span {
    white-space: normal;
  }

  .mute-prep-footer .btn {
    width: 100%;
  }
}
</style>
