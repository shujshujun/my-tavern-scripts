<script setup lang="ts">
// 档案卡弹窗：只展示选中住户档案并 emit 动作；门牌选择/CG图库开关/失败表/业务动作留在 App。
import { computed, ref, watch } from 'vue';
import type { SchemaType } from '../../../schema';
import {
  户静态表,
  查考古,
  查性癖,
  查裂缝,
  查道具,
  道具表,
  阶段标题,
  type 门牌,
} from '../../../stageConfig';
import { 当前天数, 丈夫在楼 } from '../../../脚本/游戏逻辑/楼层时钟';
import { 每日堕落上限 } from '../../../脚本/游戏逻辑/守护系统';
import { 可晋阶, 可启动母亲药物首夜, 普通首夜时段已满足, 晋阶预约现场已满足 } from '../../../脚本/游戏逻辑/结算系统';
import { 读取关系线索 } from '../../../脚本/游戏逻辑/阶段线路系统';
import { CG条目, 角色CG总数 } from '../../../脚本/游戏逻辑/成人CG系统';
import { 素材基址 } from '../assets';
import Ic from './Icon.vue';

const props = defineProps<{
  door: 门牌 | null;
  data: SchemaType;
  ready: boolean;
  currentRoom: string | null;
  absolutePeriod: number;
  unlockedCg: ReadonlySet<string>;
  sending: boolean;
  wifeNearby: boolean;
  evidenceSlots: readonly { 标: string; 图: string }[];
  avatarFailed: Record<string, boolean>;
  portraitFailed: Record<string, boolean>;
  itemFailed: Record<string, boolean>;
  avatarImage: (name: string) => string;
  itemImage: (id: string) => string;
}>();

const emit = defineEmits<{
  close: [];
  avatarError: [name: string];
  portraitError: [url: string];
  itemError: [id: string];
  openCg: [door: 门牌];
  unload: [door: 门牌, kinkId: string];
  advance: [door: 门牌];
  askMoney: [door: 门牌];
}>();

const 选中档案 = computed(() => {
  const m = props.door;
  if (!m || !props.ready || !props.data.户[m]) return null;
  const { 妻, 夫 } = props.data.户[m];
  const 当前立绘SKU = 妻._穿着SKU._立绘 ?? 妻._穿着SKU.内衣 ?? 妻._穿着SKU.外装;
  const 基础立绘 = `${素材基址}/立绘/${户静态表[m].妻名}.webp`;
  return {
    门牌: m,
    妻名: 户静态表[m].妻名,
    夫名: 户静态表[m].夫名 || '她丈夫',
    夫状态: 丈夫在楼(props.data.户[m], m, props.absolutePeriod),
    阶段标题: 阶段标题(妻.当前阶段, m),
    气质描述: 户静态表[m].初始?.气质描述 ?? '',
    基础立绘,
    立绘图: 当前立绘SKU ? `${素材基址}/立绘/${户静态表[m].妻名}_${当前立绘SKU}.webp` : 基础立绘,
    妻,
    夫,
    三轴: [
      { 名: '好感', 类: 'fav', 值: 妻.好感值 },
      { 名: '堕落', 类: 'sin', 值: 妻.堕落值 },
      { 名: '婚姻', 类: 'marr', 值: 妻.婚姻值 },
    ],
    仪容项: (() => {
      const 找描述SKU = (值: string) => Object.values(道具表).find(x => x.服饰?.穿着描述 === 值)?.id;
      const 做项 = (标: string, 细节: string, 图id?: string) => ({
        标,
        值: (图id && 查道具(图id)?.名称) || 细节 || '—',
        细节: 细节 || undefined,
        图id: 图id && (查道具(图id) || 图id.startsWith('初始外装_')) ? 图id : undefined,
      });
      const 项: { 标: string; 值: string; 细节?: string; 图id?: string }[] = [
        做项('外装', 妻.外装, 妻._穿着SKU.外装 ?? `初始外装_${户静态表[m].妻名}`),
      ];
      if (妻._穿着SKU.妆容) 项.push(做项('妆容', 妻.妆容 || '素颜', 妻._穿着SKU.妆容));
      if (妻.内衣) 项.push(做项('内衣', 妻.内衣, 妻._穿着SKU.内衣));
      for (const 件 of 妻.特殊) 项.push(做项('佩饰', 件, 找描述SKU(件)));
      return 项;
    })(),
    开发: [
      { 名: '小嘴', 值: 妻.身体开发.小嘴 },
      { 名: '胸部', 值: 妻.身体开发.胸部 },
      { 名: '小屄', 值: 妻.身体开发.小屄 },
      { 名: '屁穴', 值: 妻.身体开发.屁穴 },
    ],
    // 性癖(P5):装载中3槽(可卸载)+曾开发永久标记(避开云霜凝"卸下即失忆"坑)
    性癖装载: 妻.性癖装载.map(id => ({ id, 名: 查性癖(id)?.名称 ?? id })),
    曾开发: 妻.曾开发性癖.filter(id => !妻.性癖装载.includes(id)).map(id => 查性癖(id)?.名称 ?? id),
    CG进度: {
      已解锁: [...props.unlockedCg].filter(id => CG条目(id)?.door === m).length,
      总数: 角色CG总数(m),
    },
  };
});

const 选中可晋阶 = computed(() => {
  const m = props.door;
  if (!m || !props.data.户[m]) return false;
  if (props.data.户[m].妻.当前阶段 === 0) return false;
  return (
    (可晋阶(props.data.户[m].妻) &&
      普通首夜时段已满足(props.data, m) &&
      晋阶预约现场已满足(props.data, m, props.currentRoom ?? undefined)) ||
    (m === '302' && 可启动母亲药物首夜(props.data, props.currentRoom))
  );
});

const 选中首夜待晚上 = computed(() => {
  const m = props.door;
  const 妻 = m ? props.data.户[m]?.妻 : undefined;
  return !!m && m !== '302' && !!妻 && 妻.当前阶段 === 2 && 可晋阶(妻) && !普通首夜时段已满足(props.data, m);
});

const 选中晋阶待现场 = computed(() => {
  const m = props.door;
  const 妻 = m ? props.data.户[m]?.妻 : undefined;
  return (
    !!m &&
    !!妻 &&
    可晋阶(妻) &&
    普通首夜时段已满足(props.data, m) &&
    !晋阶预约现场已满足(props.data, m, props.currentRoom ?? undefined)
  );
});

const 显示关系线索 = ref(false);
const 选中关系线索 = computed(() => {
  const m = props.door;
  const 妻 = m ? props.data.户[m]?.妻 : undefined;
  return m && 妻 ? 读取关系线索(props.data, m) : null;
});
watch(() => props.door, () => {
  显示关系线索.value = false;
});

/** 堕落轴可见反馈:今日 AI 实际落地增长(日账记的不是今天按 0 显示,夹在 0~每日堕落上限)。 */
const 今日堕落增长 = computed(() => {
  const m = props.door;
  const 妻 = m ? props.data.户[m]?.妻 : undefined;
  if (!妻) return 0;
  const 账 = 妻._堕落日账;
  if (账.日 !== 当前天数(props.absolutePeriod)) return 0;
  return Math.max(0, Math.min(每日堕落上限, 账.值));
});

/** 堕落轴说明:按状态给出最相关的一条自然提示,不暴露模型/稽查/系统公式。 */
const 堕落轴说明 = computed(() => {
  const m = props.door;
  const 妻 = m ? props.data.户[m]?.妻 : undefined;
  if (!妻) return '';
  if (妻.当前阶段 === 0) return `阶段初期先按裂缝线索推进（碎片 ${妻.裂缝.碎片进度}/4），别只盯着堕落数值。`;
  // 阶段门前冻结是当前阶段真正的硬门槛,优先于每日上限,直接告诉玩家差几条线索
  if (选中关系线索.value?.数值已冻结)
    return `已到阶段门前，先完成关系线索（${选中关系线索.value.进度}/4）。`;
  if (今日堕落增长.value >= 每日堕落上限) return '今日变化已到上限，推进到下一天后恢复。';
  return '实质暧昧或亲密并让她真实动摇时增长；普通闲聊不会增长。';
});

/** L4 要钱按钮(P3:钱的流向反转=堕落可视化;冷却与刹车全在脚本) */
const 选中可要钱 = computed(() => {
  const 妻 = props.door ? props.data.户[props.door]?.妻 : undefined;
  return !!妻 && 妻.当前阶段 >= 4 && props.wifeNearby;
});

const 选中线索 = computed(() => {
  const m = props.door;
  if (!m || !props.data.户[m]) return [];
  const 缝 = 查裂缝(m);
  const 进度 = props.data.户[m].妻.裂缝.碎片进度;
  if (!缝) return [];
  // 展示层与产出层使用同一条渠道硬门。这里显式按渠道取数，避免新增字段或旧局残留
  // 让某户错误命中另一渠道（例如夏乔的垃圾线索显示成摄像头观察）。
  const 考古线索 = () =>
    查考古(m)
      .filter(条 => 条.关键)
      .map(条 => 条.关键!.碎片文案);
  let 源: string[] = [];
  switch (缝.渠道) {
    case '翻垃圾':
      源 = 缝.碎片信 ?? [];
      break;
    case '摄像头':
      源 = 缝.偷窥?.map(拍 => 拍.碎片文案) ?? [];
      break;
    case '打听':
      源 = 缝.打听?.map(拍 => 拍.碎片文案) ?? [];
      break;
    case '丈夫':
      源 = 缝.夫漏?.map(拍 => 拍.碎片文案) ?? [];
      break;
    case '动态广场':
      源 = 考古线索();
      break;
    case '特例双拼':
      源 = [...(缝.来电?.map(拍 => 拍.碎片文案) ?? []), ...考古线索()];
      break;
  }
  return 源.slice(0, 进度);
});

const 选中裂缝 = computed(() => (props.door ? (查裂缝(props.door) ?? null) : null));
</script>

<template>
  <div v-if="选中档案" class="mask" @click.self="emit('close')">
    <div class="sheet dossier">
      <button class="sheet-close" @click="emit('close')">✕</button>
      <div class="dossier-hero">
        <div class="dossier-head">
          <img
            v-if="!avatarFailed[选中档案.妻名]"
            class="avatar-glyph big img"
            :src="avatarImage(选中档案.妻名)"
            :alt="选中档案.妻名"
            @error="emit('avatarError', 选中档案.妻名)"
          />
          <span v-else class="avatar-glyph big">{{ 选中档案.妻名[0] }}</span>
          <span class="dossier-id">
            <span class="dossier-role">ROOM {{ 选中档案.门牌 }} · RESIDENT FILE</span>
            <span class="dossier-name">{{ 选中档案.妻名 }}</span>
            <span class="hearts" :title="'阶段:' + 选中档案.阶段标题">
              <i v-for="n in 5" :key="n" :class="{ on: n <= 选中档案.妻.当前阶段 }">♥</i>
            </span>
            <span class="dossier-stage" :title="选中档案.阶段标题">{{ 选中档案.阶段标题 }}</span>
          </span>
        </div>
        <div class="dossier-portrait" aria-hidden="true">
          <img
            v-if="!portraitFailed[选中档案.立绘图]"
            :src="选中档案.立绘图"
            :alt="选中档案.妻名 + '当前立绘'"
            @error="emit('portraitError', 选中档案.立绘图)"
          />
          <img v-else :src="选中档案.基础立绘" :alt="选中档案.妻名" />
        </div>
      </div>

      <div class="axes dossier-axes">
        <div
          v-for="轴 in 选中档案.三轴"
          :key="轴.名"
          class="axis-row"
          :class="轴.类"
          role="meter"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="轴.值"
          :style="{ '--level': Math.max(0, Math.min(100, 轴.值)) / 100 }"
        >
          <span class="axis-top"
            ><b>{{ 轴.名 }}</b
            ><i>{{ Math.round(轴.值) }}</i></span
          >
          <small v-if="轴.名 === '堕落'" class="axis-note">
            今日 AI 增长 {{ 今日堕落增长 }}/{{ 每日堕落上限 }}<template v-if="堕落轴说明"> · {{ 堕落轴说明 }}</template>
          </small>
        </div>
      </div>

      <template v-if="选中档案.妻.裂缝.已确认">
        <div class="dsec dossier-card mind-card">
          <div class="dsec-title">心 镜</div>
          <p class="dline"><b>情绪</b> {{ 选中档案.妻.当前情绪 }}</p>
          <p v-if="选中档案.妻.当前心理想法" class="dline"><b>心声</b> {{ 选中档案.妻.当前心理想法 }}</p>
          <p v-if="选中档案.气质描述" class="dline"><b>气质</b> {{ 选中档案.气质描述 }}</p>
        </div>
        <div class="dsec dossier-card attire-card">
          <div class="dsec-title"><span>仪 容</span><small>当前穿戴</small></div>
          <div class="attire-grid">
            <div
              v-for="a in 选中档案.仪容项"
              :key="a.标 + a.值"
              class="a-cell pic"
              :class="{ initial: a.图id?.startsWith('初始外装_') }"
              :title="a.值"
              :aria-label="a.标 + ':' + a.值"
              tabindex="0"
            >
              <span v-if="a.图id" class="a-pic">
                <img
                  v-if="!itemFailed[a.图id]"
                  :src="itemImage(a.图id)"
                  :alt="a.值"
                  loading="lazy"
                  draggable="false"
                  @error="emit('itemError', a.图id)"
                />
                <b v-else aria-hidden="true">衣</b>
              </span>
            </div>
          </div>
        </div>
        <div v-if="选中档案.妻.当前阶段 >= 3" class="dsec dossier-card">
          <div class="dsec-title">
            <span>身 体 开 发</span>
            <button class="cg-progress" type="button" @click.stop="emit('openCg', 选中档案.门牌)">
              CG {{ 选中档案.CG进度.已解锁 }}/{{ 选中档案.CG进度.总数 }} ›
            </button>
          </div>
          <div class="dev-grid">
            <div v-for="部位 in 选中档案.开发" :key="部位.名" class="axis-row">
              <span class="axis-label">{{ 部位.名 }}</span>
              <div class="axis"><i class="bar dev" :style="{ width: 部位.值 + '%' }" /></div>
              <span class="axis-num">{{ 部位.值 }}</span>
            </div>
          </div>
        </div>
        <!-- 性癖(P5):装载中3槽可卸载;"曾开发"永久留档=她的身体记得 -->
        <div
          v-if="选中档案.妻.当前阶段 >= 4 && (选中档案.性癖装载.length || 选中档案.曾开发.length)"
          class="dsec dossier-card"
        >
          <div class="dsec-title">性 癖({{ 选中档案.性癖装载.length }}/3)</div>
          <div class="kink-row">
            <span v-for="k in 选中档案.性癖装载" :key="k.id" class="kink-chip on">
              {{ k.名 }}
              <button
                class="kink-off"
                title="卸下(她的身体不会忘)"
                :disabled="sending"
                @click="emit('unload', 选中档案.门牌, k.id)"
              >
                ×
              </button>
            </span>
            <span
              v-for="(名, i) in 选中档案.曾开发"
              :key="'曾' + i"
              class="kink-chip was"
              title="曾开发过——重装免开幕,直接生效"
            >
              {{ 名 }}
            </span>
          </div>
        </div>
        <!-- 丈夫状态栏(解锁后:双轴可见——疑心是风险表,信任是钥匙) -->
        <div class="dsec husband dossier-card">
          <div class="dsec-title">她 的 丈 夫</div>
          <div class="hb-row">
            <img
              v-if="!avatarFailed['影子']"
              class="avatar-glyph hb img"
              :src="avatarImage('影子')"
              alt="丈夫"
              @error="emit('avatarError', '影子')"
            />
            <span v-else class="avatar-glyph hb">{{ 选中档案.夫名[0] }}</span>
            <span class="hb-main">
              <b>{{ 选中档案.夫名 }}</b>
              <small>此刻{{ 选中档案.夫状态 }}</small>
            </span>
          </div>
          <div class="husband-risk" aria-label="丈夫疑心与信任风险盘">
            <span class="trust"><Ic n="lock" /> 信任</span>
            <i
              class="risk-needle"
              :style="{
                left:
                  Math.max(
                    5,
                    Math.min(95, (选中档案.夫.疑心值 / Math.max(1, 选中档案.夫.疑心值 + 选中档案.夫.信任值)) * 100),
                  ) + '%',
              }"
            />
            <span class="suspicion"><Ic n="peep" /> 疑心</span>
          </div>
          <div class="axis-row">
            <span class="axis-label">疑心</span>
            <div class="axis"><i class="bar sin" :style="{ width: 选中档案.夫.疑心值 + '%' }" /></div>
            <span class="axis-num">{{ Math.round(选中档案.夫.疑心值) }}</span>
          </div>
          <div class="axis-row">
            <span class="axis-label">信任</span>
            <div class="axis"><i class="bar marr" :style="{ width: 选中档案.夫.信任值 + '%' }" /></div>
            <span class="axis-num">{{ Math.round(选中档案.夫.信任值) }}</span>
          </div>
          <p v-if="选中档案.夫.当前情绪 && 选中档案.夫.当前情绪 !== '平静'" class="dline">
            <b>情绪</b> {{ 选中档案.夫.当前情绪 }}
          </p>
          <p v-if="选中档案.夫.当前心理想法" class="dline"><b>心里</b> {{ 选中档案.夫.当前心理想法 }}</p>
        </div>
      </template>
      <template v-else>
        <p class="dline"><b>情绪</b> {{ 选中档案.妻.当前情绪 }}</p>
        <p class="dline"><b>丈夫</b> {{ 选中档案.夫名 }} —— 此刻{{ 选中档案.夫状态 }}</p>
        <p class="dsealed">
          她的日子隔着一扇门——裂缝线索 {{ 选中档案.妻.裂缝.碎片进度 }}/4。看清她的裂缝,才看得见她。
          <template v-if="选中档案.妻.裂缝.碎片进度 >= 4">线索齐了:背包里那封拼起来的东西,读一读。</template>
        </p>
        <div class="dsec clue-board">
          <div class="dsec-title">线 索</div>
          <div class="clue-slots">
            <div
              v-for="(槽, i) in evidenceSlots"
              :key="`${槽.标}-${i}`"
              class="clue-slot"
              :class="{ found: !!选中线索[i] }"
            >
              <span class="clue-source"><Ic :n="槽.图" />{{ 槽.标 }}</span>
              <p>{{ 选中线索[i] || '尚未取得' }}</p>
              <i>{{ 选中线索[i] ? '已归档' : '空槽' }}</i>
            </div>
          </div>
        </div>
      </template>

      <div v-if="选中档案.妻.裂缝.已确认 && 选中裂缝" class="dsec">
        <div class="dsec-title">裂 缝</div>
        <p class="dline">{{ 选中裂缝.诊断 }}</p>
        <p class="dline crack-hint">✦ {{ 选中裂缝.对症提示 }}</p>
      </div>

      <button
        v-if="选中关系线索"
        class="btn relation-clue-open"
        type="button"
        @click="显示关系线索 = !显示关系线索"
      >
        ◇ 关系线索 {{ 选中关系线索.进度 }}/4 <span>{{ 显示关系线索 ? '收起' : '查看' }}</span>
      </button>
      <div v-if="显示关系线索 && 选中关系线索" class="dsec relation-clue-board">
        <div class="dsec-title">{{ 选中关系线索.标题 }}</div>
        <p class="relation-aside">· {{ 选中关系线索.侧写 }}</p>
        <p v-if="选中关系线索.预约" class="relation-appointment">下一步 · {{ 选中关系线索.预约 }}</p>
        <div v-for="(线索, i) in 选中关系线索.线索" :key="i" class="relation-clue" :class="{ done: 线索.完成 }">
          <i>{{ 线索.完成 ? '✓' : '◇' }}</i
          ><span>{{ 线索.文案 }}</span>
        </div>
        <p v-if="选中关系线索.数值已冻结" class="relation-wait">
          已到阶段门前，先完成关系线索（{{ 选中关系线索.进度 }}/4）。
        </p>
      </div>
      <button
        v-if="选中档案.妻.当前阶段 > 0 && 选中档案.妻.当前阶段 < 5 && 选中档案.妻.裂缝.已确认"
        class="btn rite"
        :disabled="sending || !选中可晋阶"
        @click="emit('advance', 选中档案.门牌)"
      >
        {{ 选中首夜待晚上 ? '✦ 等到晚上' : 选中晋阶待现场 ? '✦ 按预约见面' : '✦ 跨过界线' }}
      </button>
      <button
        v-if="选中可要钱"
        class="btn"
        :disabled="sending"
        title="她的钱,现在也是你的钱"
        @click="emit('askMoney', 选中档案.门牌)"
      >
        ¥ 开口要钱
      </button>
    </div>
  </div>
</template>

<style scoped src="./弹窗基础.css"></style>

<style scoped>
.avatar-glyph {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: linear-gradient(160deg, #ffe3ee, #ffd0e2);
  color: #d4407a;
  font-size: 1.15em;
  font-weight: 800;
  box-shadow: 0 3px 10px rgba(30, 26, 38, 0.16);
}

.avatar-glyph.big {
  width: 64px;
  height: 64px;
  font-size: 1.4em;
}

/* 头像图版本(AI 生成素材;加载失败回退首字圆徽) */
.avatar-glyph.img {
  object-fit: cover;
  object-position: top;
  background: linear-gradient(160deg, #fff4f9, #ffe3ee);
}

/* ═══ 档案卡 ═══ */
.relation-clue-open {
  width: 100%;
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
}
.relation-clue-open span {
  opacity: 0.65;
  font-size: 11px;
}
.relation-clue-board {
  margin-top: 8px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--paper) 88%, transparent);
}
.relation-aside {
  margin: 5px 0 10px;
  font-style: italic;
  opacity: 0.75;
}
.relation-appointment {
  margin: -2px 0 10px;
  padding: 7px 9px;
  color: #8f3568;
  background: rgba(244, 95, 158, 0.1);
  border: 1px solid rgba(225, 78, 145, 0.18);
  border-radius: 9px;
  font-size: 0.73em;
  font-weight: 700;
}
.relation-clue {
  display: flex;
  gap: 8px;
  padding: 7px 0;
  border-top: 1px dashed color-mix(in srgb, currentColor 16%, transparent);
}
.relation-clue i {
  flex: 0 0 16px;
  color: var(--muted);
}
.relation-clue.done i {
  color: var(--accent);
}
.relation-wait {
  margin: 10px 0 0;
  color: var(--accent);
  font-size: 12px;
}

.sheet.dossier {
  width: min(640px, 96%);
  padding: 0 16px 16px;
  overflow-x: hidden;
  background: linear-gradient(180deg, rgba(255, 247, 251, 0.98), rgba(246, 250, 255, 0.98)), #fff;
}

.dossier-hero {
  position: relative;
  min-height: 170px;
  margin: 0 -16px 10px;
  padding: 24px 210px 16px 20px;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 30%, rgba(255, 255, 255, 0.95), transparent 32%),
    linear-gradient(125deg, rgba(255, 214, 231, 0.86), rgba(220, 239, 255, 0.78) 58%, rgba(255, 240, 196, 0.68));
  border-bottom: 1px solid rgba(255, 79, 154, 0.18);
}

.dossier-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.18) 0 1px, transparent 1px 7px);
  mask-image: linear-gradient(90deg, #000, transparent 75%);
}

.dossier-head {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 86px;
}

.dossier-name {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 1.45em;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.dossier-role {
  font-family: var(--font-mono);
  color: var(--blue);
  font-size: 0.62em;
  letter-spacing: 0.08em;
}

.dossier-stage {
  align-self: flex-start;
  min-width: 4em;
  max-width: none;
  overflow: visible;
  white-space: nowrap;
  text-align: center;
  color: #fff;
  background: linear-gradient(180deg, #ff6cab, #ff4f9a);
  border-radius: 999px;
  padding: 4px 14px;
  font-size: 0.72em;
  font-weight: 700;
  box-shadow: 0 3px 10px rgba(255, 79, 154, 0.35);
}

.dossier-portrait {
  position: absolute;
  z-index: 1;
  top: 4px;
  right: 10px;
  width: 205px;
  height: 180px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  pointer-events: none;
  filter: drop-shadow(0 8px 12px rgba(45, 34, 55, 0.18));
}

.dossier-portrait img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: 50% 10%;
}

.dossier-axes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 0 0 10px;
}

.dossier-axes .axis-row {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 5px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(255, 79, 154, 0.13);
  box-shadow: 0 3px 10px rgba(44, 40, 56, 0.05);
}

/* 三轴整框填充:整个好感/堕落/婚姻卡本身就是进度条,::before 按 --level 从左向右 scaleX 填满卡片 */
.dossier-axes .axis-row::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  transform-origin: left center;
  transform: scaleX(var(--level, 0));
  pointer-events: none;
  transition: transform 0.8s cubic-bezier(0.2, 0.85, 0.25, 1);
}

.dossier-axes .axis-row.fav::before {
  background: linear-gradient(90deg, #ffb1cf, var(--pink));
}

.dossier-axes .axis-row.sin::before {
  background: linear-gradient(90deg, #ffb091, color-mix(in srgb, var(--red) 78%, white));
}

.dossier-axes .axis-row.marr::before {
  background: linear-gradient(90deg, #9cebd7, var(--green));
}

/* 标签/数值/堕落说明浮在填充层上方,保证文字始终可读可选中 */
.dossier-axes .axis-top,
.dossier-axes .axis-note {
  position: relative;
  z-index: 1;
}

.dossier-axes .axis-note {
  display: block;
  color: var(--ink);
  font-size: 0.68em;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;
}

.dossier-axes .axis-note i {
  font-style: normal;
  opacity: 0.72;
}

.axis-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.axis-top b {
  color: var(--ink);
  font-size: 0.76em;
}

.axis-top i {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 1.05em;
  font-style: normal;
  font-weight: 800;
}

.axis-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78em;
}

.axis-label {
  width: 2.6em;
  color: var(--ink-soft);
  text-align: right;
  font-weight: 600;
}

.axis {
  flex: 1;
  height: 8px;
  background: rgba(36, 33, 38, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.bar {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s ease;
}

.bar.fav {
  background: linear-gradient(90deg, #ff8ab9, var(--pink));
}

.bar.sin {
  background: linear-gradient(90deg, #ffa98a, var(--red));
}

.bar.marr {
  background: linear-gradient(90deg, #7fe7cb, var(--green));
}

.bar.dev {
  background: linear-gradient(90deg, #ffd9a8, #ff783f);
}

.axis-num {
  width: 2em;
  color: var(--ink);
  text-align: right;
  font-family: var(--font-mono);
  font-size: 0.9em;
}

/* 性癖槽(P5):装载中=粉底可卸;曾开发=灰底留档 */
.kink-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.kink-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid rgba(255, 79, 154, 0.35);
  background: rgba(255, 79, 154, 0.12);
  color: #d64d8f;
}

.kink-chip.was {
  border-color: rgba(120, 120, 130, 0.3);
  background: rgba(120, 120, 130, 0.1);
  color: #8a8890;
}

.kink-off {
  border: none;
  background: none;
  color: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  padding: 0 0 0 2px;
}

/* 丈夫状态栏(解锁后:双轴=风险表与钥匙) */
.hb-row {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 5px;
}

.avatar-glyph.hb {
  width: 30px;
  height: 30px;
  font-size: 0.8em;
  background: linear-gradient(160deg, #d9e9f4, #c2dbee);
  color: #4a6b8a;
}

.hb-main {
  display: flex;
  flex-direction: column;
}

.hb-main b {
  font-size: 0.86em;
  font-weight: 700;
}

.hb-main small {
  font-size: 0.7em;
  color: var(--ink-soft);
}

.husband-risk {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  padding: 0 9px;
  margin: 7px 0 8px;
  overflow: hidden;
  font-size: 0.68em;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(90deg, #5da88f, #d8b66b 50%, #d86c76);
  border-radius: 9px;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.36);
}

.husband-risk span {
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  text-shadow: 0 1px 3px rgba(28, 24, 35, 0.34);
}

.husband-risk span :deep(.ic) {
  width: 14px;
  height: 14px;
}

.risk-needle {
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 3px;
  background: #fff;
  border-radius: 3px;
  box-shadow:
    0 0 0 2px rgba(29, 26, 36, 0.34),
    0 0 8px rgba(255, 255, 255, 0.72);
  transform: translateX(-50%);
}

.dsec {
  border-top: 1px dashed var(--line-soft);
  padding: 7px 0 2px;
  margin-top: 5px;
}

.dossier-card {
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(38, 169, 244, 0.11);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 3px 12px rgba(35, 32, 46, 0.045);
}

.dossier-card .dsec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
}

.dossier-card .dsec-title small {
  color: var(--ink-faint);
  font-family: var(--font-body);
  font-size: 0.82em;
  letter-spacing: 0;
}

.dossier-card .dsec-title .cg-progress {
  margin-left: auto;
  padding: 2px 7px;
  border: 1px solid color-mix(in srgb, var(--pink) 45%, transparent);
  border-radius: 999px;
  color: var(--pink);
  background: color-mix(in srgb, var(--pink) 9%, transparent);
  font: inherit;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: pointer;
}

.dsec-title {
  font-family: var(--font-mono);
  color: var(--blue);
  font-size: 0.72em;
  letter-spacing: 0.28em;
  margin-bottom: 4px;
}

.dline {
  font-size: 0.8em;
  color: var(--ink);
  margin: 3px 0;
}

.dline b {
  color: var(--ink-faint);
  font-weight: normal;
  margin-right: 6px;
}

.dsealed {
  font-size: 0.78em;
  color: var(--ink-soft);
  background: var(--blue-soft);
  border: 1px solid rgba(38, 169, 244, 0.3);
  border-radius: 12px;
  padding: 8px 11px;
  margin: 6px 0;
  line-height: 1.6;
}

.clue-board {
  margin-top: 9px;
}

.clue-slots {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.clue-slot {
  min-height: 82px;
  padding: 8px;
  color: var(--ink-faint);
  background: linear-gradient(145deg, rgba(222, 215, 200, 0.46), rgba(238, 234, 226, 0.2));
  border: 1px dashed rgba(89, 80, 70, 0.22);
  border-radius: 10px;
}

.clue-slot.found {
  color: var(--ink);
  background: linear-gradient(145deg, #fffaf0, #eef6f8);
  border-style: solid;
  border-color: rgba(81, 132, 151, 0.3);
  box-shadow: 0 3px 10px rgba(53, 63, 76, 0.08);
}

.clue-source {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72em;
  font-weight: 800;
  color: #527d91;
}

.clue-source :deep(.ic) {
  width: 15px;
  height: 15px;
}

.clue-slot p {
  margin: 6px 0 4px;
  font-size: 0.73em;
  line-height: 1.4;
}

.clue-slot > i {
  font-family: var(--font-mono);
  font-size: 0.62em;
  font-style: normal;
  opacity: 0.66;
}

.dev-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* 仪容图鉴：穿戴 SKU 直接显示商店道具卡，不再拿穿着描述误查图片。 */
.attire-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 84px);
  justify-content: start;
  gap: 8px;
}

.a-cell {
  position: relative;
  display: block;
  min-height: 0;
  aspect-ratio: 1;
  overflow: hidden;
  overflow: hidden;
  font-size: 0.76em;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 243, 250, 0.9));
  border: 1px solid rgba(255, 79, 154, 0.16);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(30, 26, 38, 0.07);
}

.a-cell.pic {
  grid-column: span 1;
}

.a-cell .a-pic {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
  display: grid;
  place-items: center;
}

.a-cell .a-pic img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.a-cell.initial .a-pic img {
  object-position: 50% 48%;
  transform: scale(1.45);
}

.a-cell small {
  color: var(--ink-faint);
  font-family: var(--font-mono);
  letter-spacing: 0.12em;
}

.a-cell .a-val {
  color: var(--ink);
  font-size: 1.04em;
  font-weight: 800;
  line-height: 1.25;
}

.a-cell em {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.88em;
  font-style: normal;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.a-cell b {
  color: var(--ink);
  font-weight: normal;
}

.crack-hint {
  color: var(--pink);
  font-weight: 600;
}

/* ═══ 阶段爱心条(初星 affinity-hearts) ═══ */

.dossier-id {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  max-width: 100%;
}

.hearts {
  display: inline-flex;
  gap: 2px;
  font-size: 0.7em;
}

.hearts i {
  font-style: normal;
  color: rgba(36, 33, 38, 0.16);
  transition: color 0.3s;
}

.hearts i.on {
  color: var(--pink);
  text-shadow: 0 0 6px rgba(255, 79, 154, 0.4);
}

:global(html.rq-dark) .hearts i {
  color: rgba(255, 255, 255, 0.14);
}

:global(html.rq-dark) .hearts i.on {
  color: var(--pink);
}

:global(html.rq-dark) .sheet.dossier {
  background: linear-gradient(180deg, rgba(45, 43, 59, 0.99), rgba(34, 38, 53, 0.99));
}

:global(html.rq-dark) .dossier-hero {
  background:
    radial-gradient(circle at 18% 30%, rgba(255, 255, 255, 0.08), transparent 32%),
    linear-gradient(125deg, rgba(115, 54, 83, 0.72), rgba(46, 78, 108, 0.72) 58%, rgba(106, 85, 42, 0.58));
  border-bottom-color: rgba(255, 255, 255, 0.09);
}

:global(html.rq-dark) .dossier-card,
:global(html.rq-dark) .dossier-axes .axis-row,
:global(html.rq-dark) .a-cell {
  background: rgba(44, 46, 62, 0.82);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 深色模式整框填充:用较低透明度的语义色,让深色卡底透出,浅色文字保持可读 */
:global(html.rq-dark) .dossier-axes .axis-row.fav::before {
  background: linear-gradient(90deg, rgba(255, 79, 154, 0.45), rgba(255, 79, 154, 0.18));
}

:global(html.rq-dark) .dossier-axes .axis-row.sin::before {
  background: linear-gradient(90deg, rgba(229, 83, 63, 0.45), rgba(229, 83, 63, 0.18));
}

:global(html.rq-dark) .dossier-axes .axis-row.marr::before {
  background: linear-gradient(90deg, rgba(32, 223, 173, 0.45), rgba(32, 223, 173, 0.18));
}

:global(html.rq-dark) .a-cell .a-pic {
  background: #343648;
  border-right-color: rgba(255, 255, 255, 0.08);
}

:global(html.rq-dark) .avatar-glyph {
  background: linear-gradient(160deg, rgba(255, 79, 154, 0.3), rgba(255, 79, 154, 0.16));
  border-color: #3a3d52;
  color: #ff9ec4;
}

/* 角色档案：手机上让立绘保留存在感，但不挤压仪容道具图。 */
@media (max-width: 540px) {
  .mask:has(.dossier) {
    padding: 4px;
  }

  .sheet.dossier {
    width: 100%;
    max-height: 98%;
    padding: 0 10px 12px;
    border-radius: 14px;
  }

  .dossier-hero {
    min-height: 150px;
    margin: 0 -10px 8px;
    padding: 18px 145px 12px 13px;
  }

  .dossier-head {
    gap: 7px;
  }

  .dossier-head .avatar-glyph.big {
    width: 46px;
    height: 46px;
  }

  .dossier-name {
    font-size: 1.16em;
  }

  .dossier-role {
    font-size: 0.55em;
  }

  .dossier-portrait {
    right: 2px;
    width: 155px;
    height: 158px;
  }

  .dossier-axes {
    gap: 5px;
  }

  .dossier-axes .axis-row {
    padding: 6px 7px;
  }

  .dossier-card {
    padding: 9px;
  }

  .a-cell {
    min-height: 0;
  }

  .a-cell .a-pic {
    width: 100%;
    height: 100%;
  }

  .dev-grid {
    grid-template-columns: 1fr;
  }
}

/* 减少动效:整框填充过渡只服务真实数值变化,用户偏好关闭时取消 */
@media (prefers-reduced-motion: reduce) {
  .dossier-axes .axis-row::before {
    transition: none;
  }
}
</style>
