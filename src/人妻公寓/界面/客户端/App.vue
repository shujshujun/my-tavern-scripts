<template>
  <div class="apt">
    <div class="page">
      <!-- 错误护栏:任何运行时异常显示在此,不再整屏空白 -->
      <div v-if="错误信息" class="err">⚠︎ 界面异常:{{ 错误信息 }}</div>

      <!-- ═══════════ 数据未就绪 ═══════════ -->
      <template v-if="!就绪">
        <div class="hint center">……楼道的声控灯还没亮(等待存档数据)……</div>
        <p class="heartbeat" :class="{ dead: !脚本存活 }">
          {{ 脚本存活 ? '✓ 游戏逻辑脚本心跳正常' : '✗ 未检测到游戏逻辑脚本(请确认脚本已启用)' }}
        </p>
      </template>

      <!-- ═══════════ 坏结局覆盖层(单向锁;P6 按死法差分精修) ═══════════ -->
      <template v-else-if="data.系统._坏结局">
        <header class="masthead ending">考 验 失 败</header>
        <div class="ending-body">
          <p class="ending-line">{{ data.系统._坏结局 }}</p>
          <p class="hint">父亲收回了这栋楼。你可以在史册里回到从前的某一页,重新来过。</p>
          <button class="btn" @click="显示史册 = true">翻开史册</button>
        </div>
      </template>

      <!-- ═══════════ 序章:难度三档卡(开局流程①) ═══════════ -->
      <template v-else-if="!data.系统._序章完成">
        <header class="masthead">人 妻 公 寓</header>
        <p class="hint center">父亲把楼交给你之前,先看看他的心情——</p>
        <div class="diff-row">
          <button
            v-for="档 in 难度卡"
            :key="档.名称"
            class="diff-card"
            :class="{ chosen: 选中难度 === 档.名称 }"
            @click="选中难度 = 档.名称"
          >
            <b class="diff-name">{{ 档.名称 }}</b>
            <span class="diff-desc">{{ 档.说明 }}</span>
            <span class="diff-meta">起步资金 ¥{{ 档.起始资金 }}</span>
          </button>
        </div>
        <button class="btn rite" :disabled="!选中难度 || 发送中" @click="开始考验">
          {{ 发送中 ? '电话接通中……' : '接起父亲的电话' }}
        </button>
        <p class="heartbeat" :class="{ dead: !脚本存活 }">
          {{ 脚本存活 ? '✓ 游戏逻辑脚本心跳正常' : '✗ 未检测到游戏逻辑脚本(请确认脚本已启用)' }}
        </p>
      </template>

      <!-- ═══════════ 日常主界面 ═══════════ -->
      <template v-else>
        <header class="masthead">人 妻 公 寓</header>

        <div class="meta-row">
          <span title="现金">¥ {{ data.现金 }}</span>
          <span :title="'胜任度 ' + data.胜任度 + ':父亲对你管楼的评价'" :class="{ hot: data.胜任度 <= 40 }"
            >任 {{ data.胜任度 }}</span
          >
          <span :title="'风闻 ' + data.风闻 + ':楼里的闲话'" :class="{ hot: data.风闻 >= 50 }">闻 {{ data.风闻 }}</span>
          <span :title="'第 ' + 天数 + ' 天'">第{{ 天数 }}天·{{ 时段 }}</span>
          <span class="meta-btns">
            <button class="btn mini" :title="全屏中 ? '退出全屏' : '沉浸全屏'" @click="切换全屏">
              {{ 全屏中 ? '⇲' : '⇱' }}
            </button>
            <button class="btn mini" title="网购商城,次日达到管理员室" @click="显示商店 = true">商店</button>
            <button v-if="背包列表.length" class="btn mini" @click="显示背包 = true">背包</button>
            <button v-if="监控列表.length" class="btn mini" title="你装下的眼睛" @click="显示监控 = true">监控</button>
            <button class="btn mini" title="完整往事与回档" @click="显示史册 = true">史册</button>
          </span>
        </div>

        <!-- 头像行:已入住户(焦点亮/在场半亮/离场暗);点开档案 -->
        <div class="avatar-row">
          <div
            v-for="项 in 头像列表"
            :key="项.门牌"
            class="avatar"
            :class="项.态"
            :title="项.妻名 + '(' + 项.门牌 + ')'"
            @click="选中门牌 = 项.门牌"
          >
            <span class="avatar-glyph">{{ 项.妻名[0] }}</span>
            <span class="avatar-name">{{ 项.妻名 }}</span>
          </div>
        </div>

        <!-- 待办软引导(职务引导,开局流程③;不硬锁,可划掉) -->
        <div v-if="显示待办" class="todo-bar">
          <span v-for="项 in 待办列表" :key="项.键" class="todo-item" :class="{ done: 项.完成 }">
            {{ 项.完成 ? '✓' : '·' }} {{ 项.文字 }}
          </span>
          <button class="btn mini" title="收起待办" @click="划掉待办">✕</button>
        </div>

        <!-- 正文卷轴:只演当前幕(完整历史在史册) -->
        <section ref="卷轴容器" class="story">
          <div v-for="(条, i) in 当前幕" :key="i" class="story-entry">
            <template v-if="条.楼 !== undefined && 条.楼 === 编辑中楼">
              <textarea v-model="编辑文本" class="edit-area" rows="8"></textarea>
              <div class="edit-acts">
                <button class="btn" :disabled="!编辑文本.trim()" @click="存编辑">落笔</button>
                <button class="btn" @click="编辑中楼 = null">作罢</button>
              </div>
            </template>
            <template v-else>
              <button
                v-if="条.原文 !== undefined && !发送中"
                class="entry-edit"
                title="改写这一段(同酒馆的铅笔编辑)"
                @click="开编辑(条)"
              >
                ✎
              </button>
              <p v-if="条.谁 === '玩家'" class="story-player">▸ {{ 条.文本[0] }}</p>
              <template v-else>
                <p v-for="(段, j) in 条.文本" :key="j" class="narr">{{ 段 }}</p>
              </template>
            </template>
          </div>
          <div v-if="发送中" class="story-entry">
            <p v-for="(段, j) in 流式段" :key="'流' + j" class="narr">{{ 段 }}</p>
            <p class="scribing">
              ✎ 这一楼正在发生……
              <button class="btn mini" title="打断,本回合作废" @click="取消回合">取消</button>
            </p>
          </div>
        </section>

        <!-- 场景条 -->
        <div class="scene-bar">
          <span class="scene-name">{{ 当前房间名 || '楼道里' }}</span>
          <span class="scene-occ">{{ 当前房间 ? 房内名单 || '此刻没有别人' : '该去敲谁的门?' }}</span>
          <button class="btn" :disabled="发送中" @click="显示地图 = true">地图</button>
          <button v-if="当前房间" class="btn" :disabled="发送中" @click="离开房间">离开</button>
        </div>

        <!-- 垃圾房:按户分袋,翻哪户=选择(这栋楼扔掉的秘密都在这里) -->
        <div v-if="当前房间 === '垃圾房' && !发送中" class="option-row">
          <button v-for="袋 in 垃圾袋列表" :key="袋.门牌" class="option-chip" @click="翻(袋.门牌)">
            🗑 翻 {{ 袋.门牌 }} 的垃圾袋({{ 袋.妻名 }}家)
          </button>
        </div>

        <!-- 偷窥余像:"你注意到了什么?"(摄像头渠道,选对收进线索板) -->
        <div v-if="偷窥待选 && !发送中" class="peep-card">
          <p class="hint">画面看完了。你注意到了什么?</p>
          <button v-for="(项, i) in 偷窥待选.选项" :key="i" class="option-chip" @click="选细节(i)">
            {{ 项 }}
          </button>
        </div>

        <!-- 行动选项(AI 每轮给 4 条,点了直接发送;想自由发挥就打字) -->
        <div v-if="当前房间 && !发送中 && 行动选项.length" class="option-row">
          <button v-for="(项, i) in 行动选项" :key="i" class="option-chip" @click="发出(项)">▸ {{ 项 }}</button>
        </div>

        <!-- 游戏内输入(玩家不碰酒馆输入框) -->
        <div v-if="当前房间" class="quill">
          <textarea
            v-model="输入文本"
            rows="2"
            placeholder="你的言行……(Enter 发送,Shift+Enter 换行)"
            @keydown.enter.exact.prevent="发送"
          ></textarea>
          <button class="btn rite quill-btn" :disabled="发送中 || !输入文本.trim()" @click="发送">
            {{ 发送中 ? '…' : '行动' }}
          </button>
        </div>
        <div v-if="可重掷 && !发送中" class="reroll-row">
          <button class="btn" title="撤回本回合(你的行动与回应),重新措辞" @click="撤回">⌫ 撤回</button>
          <button class="btn" title="同样的行动重新演一遍" @click="重掷">↻ 重演</button>
        </div>
      </template>

      <!-- ═══════════ 地图(公寓立面:一梯两户×3层+公共区;走动零成本纯UI) ═══════════ -->
      <div v-if="显示地图 && 就绪" class="mask" @click.self="显示地图 = false">
        <div class="sheet map-sheet">
          <button class="sheet-close" @click="显示地图 = false">✕</button>
          <div class="sheet-title">这 栋 楼</div>
          <p class="hint center">{{ 破门目标 ? `撬门 ${破门数}/6 ——再连点几下` : '点一间房走过去;没人应门的户,连点可以撬开' }}</p>
          <div class="building">
            <button class="map-room roof" :class="房态类('天台')" @click="点房('天台')">
              <span class="room-name">天台</span>
              <span class="room-occ">{{ 房内首字('天台') }}</span>
            </button>
            <div v-for="层 in 楼层组" :key="层.名" class="floor-row">
              <button
                v-for="房 in 层.房"
                :key="房.id"
                class="map-room unit"
                :class="[房态类(房.id), { vacant: 房.空置 }]"
                @click="点房(房.id)"
              >
                <span class="room-name">{{ 房.id }}</span>
                <span v-if="房.空置" class="room-sub">招租中</span>
                <template v-else>
                  <span class="room-sub">{{ 房.标签 }}</span>
                  <span class="room-occ">{{ 房内首字(房.id) }}</span>
                </template>
              </button>
            </div>
            <div class="floor-row ground">
              <button
                v-for="房 in 底层公共"
                :key="房.id"
                class="map-room pub"
                :class="房态类(房.id)"
                @click="点房(房.id)"
              >
                <span class="room-name">{{ 房.名称 }}</span>
                <span class="room-occ">{{ 房内首字(房.id) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 档案卡(点头像弹出;裂缝未开=蜡封) ═══════════ -->
      <div v-if="选中档案" class="mask" @click.self="选中门牌 = null">
        <div class="sheet dossier">
          <button class="sheet-close" @click="选中门牌 = null">✕</button>
          <div class="dossier-head">
            <span class="avatar-glyph big">{{ 选中档案.妻名[0] }}</span>
            <span class="dossier-name">{{ 选中档案.妻名 }}</span>
            <span class="dossier-role">{{ 选中档案.门牌 }} 室</span>
            <span class="dossier-stage">「{{ 选中档案.妻.阶段标题 }}」</span>
          </div>

          <div class="axes">
            <div v-for="轴 in 选中档案.三轴" :key="轴.名" class="axis-row">
              <span class="axis-label">{{ 轴.名 }}</span>
              <div class="axis"><i class="bar" :class="轴.类" :style="{ width: 轴.值 + '%' }" /></div>
              <span class="axis-num">{{ Math.round(轴.值) }}</span>
            </div>
          </div>

          <svg v-if="选中曲线" class="trend" viewBox="0 0 100 28" preserveAspectRatio="none">
            <polyline :points="选中曲线.好感" class="trend-fav" />
            <polyline :points="选中曲线.堕落" class="trend-sin" />
            <polyline :points="选中曲线.婚姻" class="trend-marr" />
          </svg>
          <div v-if="选中曲线" class="trend-legend">
            <span class="tl-fav">好感</span><span class="tl-sin">堕落</span><span class="tl-marr">婚姻</span>
            <span class="tl-hint">—— 随楼层推移的走势</span>
          </div>

          <template v-if="选中档案.妻.情报可见">
            <div class="dsec">
              <div class="dsec-title">心 镜</div>
              <p class="dline"><b>情绪</b> {{ 选中档案.妻.当前情绪 }}</p>
              <p v-if="选中档案.妻.当前心理想法" class="dline"><b>心声</b> {{ 选中档案.妻.当前心理想法 }}</p>
              <p v-if="选中档案.妻.气质描述" class="dline"><b>气质</b> {{ 选中档案.妻.气质描述 }}</p>
            </div>
            <div class="dsec">
              <div class="dsec-title">仪 容</div>
              <div class="attire-grid">
                <div v-for="a in 选中档案.仪容项" :key="a.标" class="a-cell">
                  <small>{{ a.标 }}</small>
                  <b>{{ a.值 }}</b>
                </div>
              </div>
            </div>
            <div v-if="选中档案.妻.当前阶段 >= 3" class="dsec">
              <div class="dsec-title">身 体 开 发</div>
              <div class="dev-grid">
                <div v-for="部位 in 选中档案.开发" :key="部位.名" class="axis-row">
                  <span class="axis-label">{{ 部位.名 }}</span>
                  <div class="axis"><i class="bar dev" :style="{ width: 部位.值 + '%' }" /></div>
                  <span class="axis-num">{{ 部位.值 }}</span>
                </div>
              </div>
            </div>
            <div class="dsec">
              <div class="dsec-title">她 的 家</div>
              <p class="dline"><b>丈夫</b> {{ 选中档案.夫名 }} —— 此刻{{ 选中档案.夫状态 }}</p>
            </div>
          </template>
          <template v-else>
            <p class="dline"><b>情绪</b> {{ 选中档案.妻.当前情绪 }}</p>
            <p class="dsealed">
              她的日子隔着一扇门——裂缝线索 {{ 选中档案.妻.裂缝.碎片进度 }}/4。看清她的裂缝,才看得见她。
              <template v-if="选中档案.妻.裂缝.碎片进度 >= 4">线索齐了:背包里那封拼起来的东西,读一读。</template>
            </p>
            <div v-if="选中线索.length" class="dsec">
              <div class="dsec-title">线 索</div>
              <p v-for="(条, i) in 选中线索" :key="i" class="dline">· {{ 条 }}</p>
            </div>
          </template>

          <div v-if="选中档案.妻.裂缝.已确认 && 选中裂缝" class="dsec">
            <div class="dsec-title">裂 缝</div>
            <p class="dline">{{ 选中裂缝.诊断 }}</p>
            <p class="dline crack-hint">✦ {{ 选中裂缝.对症提示 }}</p>
          </div>

          <button v-if="选中可晋阶" class="btn rite" :disabled="发送中" @click="晋阶(选中档案.门牌)">
            ✦ 跨过界线
          </button>
        </div>
      </div>

      <!-- ═══════════ 背包(道具可用:布设/送礼/读信) ═══════════ -->
      <div v-if="显示背包" class="mask" @click.self="显示背包 = false">
        <div class="sheet">
          <button class="sheet-close" @click="显示背包 = false">✕</button>
          <div class="sheet-title">背 包</div>
          <div class="sheet-body">
            <div v-for="(项, i) in 背包列表" :key="i" class="ware">
              <b>{{ 项.名称 }}</b>
              <span class="ware-desc">{{ 项.描述 }}</span>
              <span class="ware-acts">
                <button v-if="项.可读信" class="btn mini" @click="打开信(项.信门牌!)">读</button>
                <button v-if="项.可布设" class="btn mini" :disabled="发送中" @click="布设()">装在这个房间</button>
                <button
                  v-for="妻 in 项.可送对象"
                  :key="妻.门牌"
                  class="btn mini"
                  :disabled="发送中"
                  @click="送出(项.id, 妻.门牌)"
                >
                  送给{{ 妻.妻名 }}
                </button>
              </span>
            </div>
            <p v-if="!背包列表.length" class="hint center">(空空如也)</p>
          </div>
        </div>
      </div>

      <!-- ═══════════ 商店(次日达网购;礼物页签=裂缝解锁后现,商店自己就是进度条) ═══════════ -->
      <div v-if="显示商店" class="mask" @click.self="显示商店 = false">
        <div class="sheet">
          <button class="sheet-close" @click="显示商店 = false">✕</button>
          <div class="sheet-title">商 店</div>
          <div class="shop-tabs">
            <button
              v-for="页 in 货架"
              :key="页.页签"
              class="btn mini"
              :class="{ on: 商店页签 === 页.页签 }"
              @click="商店页签 = 页.页签"
            >
              {{ 页.页签 }}
            </button>
            <span class="shop-cash">¥ {{ data.现金 }}</span>
          </div>
          <div class="sheet-body">
            <div v-for="项 in 当前货架" :key="项.id" class="ware">
              <b>{{ 项.名称 }} <em class="ware-price">¥{{ 项.价格 }}</em></b>
              <span class="ware-desc">{{ 项.描述 }}</span>
              <span class="ware-acts">
                <button class="btn mini" :disabled="data.现金 < (项.价格 ?? 0)" @click="买(项.id)">
                  {{ data.现金 < (项.价格 ?? 0) ? '钱不够' : '买下' }}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 监控(装了摄像头的户;她独处时的画面) ═══════════ -->
      <div v-if="显示监控" class="mask" @click.self="显示监控 = false">
        <div class="sheet">
          <button class="sheet-close" @click="显示监控 = false">✕</button>
          <div class="sheet-title">监 控</div>
          <p class="hint center">没人看着的时候的她。看完记得想想:你注意到了什么?</p>
          <div class="sheet-body">
            <button
              v-for="m in 监控列表"
              :key="m"
              class="option-chip"
              :disabled="发送中"
              @click="看监控(m)"
            >
              📷 调出 {{ m }} 室的画面({{ 户静态表[m].妻名 }}家)
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════ 读信(揭晓时刻:碎片拼合的实物) ═══════════ -->
      <div v-if="读信门牌" class="mask" @click.self="读信门牌 = null">
        <div class="sheet">
          <button class="sheet-close" @click="读信门牌 = null">✕</button>
          <div class="sheet-title">拼 合 的 真 相</div>
          <div class="sheet-body letter">
            <p v-for="(段, i) in 读信正文.split('\n')" :key="i" class="narr no-indent">{{ 段 }}</p>
          </div>
          <button class="btn rite" @click="合上信">我看清了</button>
        </div>
      </div>

      <!-- ═══════════ 史册(完整往事 + 回档) ═══════════ -->
      <div v-if="显示史册" class="mask" @click.self="显示史册 = false">
        <div class="sheet">
          <button class="sheet-close" @click="显示史册 = false">✕</button>
          <div class="sheet-title">往 事</div>
          <p class="hint center">每段右下角的 ↺ 可以回到那一刻——点两次,之后的一切就没有发生过。</p>
          <div class="sheet-body chronicle">
            <div v-for="(条, i) in 卷轴" :key="i" class="story-entry">
              <template v-if="条.楼 !== undefined && 条.楼 === 编辑中楼">
                <textarea v-model="编辑文本" class="edit-area" rows="8"></textarea>
                <div class="edit-acts">
                  <button class="btn" :disabled="!编辑文本.trim()" @click="存编辑">落笔</button>
                  <button class="btn" @click="编辑中楼 = null">作罢</button>
                </div>
              </template>
              <template v-else>
                <button
                  v-if="条.原文 !== undefined && !发送中"
                  class="entry-edit"
                  title="改写这一段"
                  @click="开编辑(条)"
                >
                  ✎
                </button>
                <p v-if="条.谁 === '玩家'" class="story-player">▸ {{ 条.文本[0] }}</p>
                <template v-else>
                  <p v-for="(段, j) in 条.文本" :key="j" class="narr">{{ 段 }}</p>
                  <p v-if="条.可回档 && !发送中" class="candle-row">
                    <button
                      class="candle"
                      :class="{ armed: 待回档楼 === 条.楼 }"
                      :title="待回档楼 === 条.楼 ? '再点一次确认' : '回到这一刻'"
                      @click.stop="点回档(条.楼)"
                    >
                      <template v-if="待回档楼 === 条.楼">⚠︎ 再点一次,抹掉之后的一切</template>
                      <template v-else>↺</template>
                    </button>
                  </p>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 提示 toast ═══════════ -->
      <div v-if="提示文本" class="toast">{{ 提示文本 }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SchemaType } from '../../schema';
import { 户静态表, 查房间, 查裂缝, 查道具, 道具表, 门牌列表, 难度表, type 门牌 } from '../../stageConfig';
import { 丈夫状态推算, 妻位置推算, 当前天数, 当前时段 } from '../../脚本/游戏逻辑/楼层时钟';
import { 可晋阶 } from '../../脚本/游戏逻辑/结算系统';
import { useDataStore } from './store';

const store = useDataStore();
// defineMvuDataStore 的 Pinia 泛型在 SFC 里推断失败(已知误报,见 ShopPanel 先例),显式标回
const data = computed(() => (store as unknown as { data: SchemaType }).data);

/** 数据就绪守卫:store 兜底为 {} 时不裸渲染 */
const 就绪 = computed(() => Boolean(data.value?.系统 && data.value?.户));

// ── 脚本心跳(15s 陈旧判死;挂载后先宽限) ──

const 脚本存活 = ref(true);
let 心跳timer: ReturnType<typeof setInterval> | undefined;

// ── 楼层时钟 ──

const 末楼号 = ref(0);
const 时段 = computed(() => 当前时段(末楼号.value));
const 天数 = computed(() => 当前天数(末楼号.value));

// ── 场景与移动(走动零成本纯UI;_场景 与脚本快照共用) ──

const 当前房间 = ref<string | null>(null);
const 显示地图 = ref(false);
/** 进房那一刻的末楼号(随 _场景 持久;位置种子在房内期间冻结——否则身边的人被"传送"走) */
const 进房末楼 = ref(0);
const 位置种子 = computed(() => (当前房间.value ? 进房末楼.value : 末楼号.value));

function 写场景(房间id: string | null, 破门 = false) {
  insertOrAssignVariables(
    { _场景: 房间id ? { 房间id, 破门, 进房末楼: 进房末楼.value } : null },
    { type: 'chat' },
  );
}

function 进入(房间id: string, 破门 = false) {
  try {
    进房末楼.value = getLastMessageId();
  } catch {
    进房末楼.value = 末楼号.value;
  }
  当前房间.value = 房间id;
  显示地图.value = false;
  写场景(房间id, 破门);
  记待办(房间id);
}

function 离开房间() {
  当前房间.value = null;
  写场景(null);
  显示地图.value = true; // 走出房门=站上楼道,顺手展开地图选下一处
}

// 连击破门("点的语法":连击空房门=破锁;2.5 秒窗口内敲满 6 下)
const 破门目标 = ref('');
const 破门数 = ref(0);
let 破门计时: ReturnType<typeof setTimeout> | undefined;

function 点房(房间id: string) {
  if (发送中.value) return;
  const 房 = 查房间(房间id);
  // 未入住的户:门上贴着招租,进不去
  if (房?.类型 === '户' && 房间id !== '302' && !data.value.户[房间id]) return;
  // 户门无人在家:单点=走到门口(敲门无人应),连点=撬门
  const 需破门 = 房?.类型 === '户' && 房间id !== '302' && !房内有人在(房间id);
  if (!需破门) {
    进入(房间id);
    return;
  }
  if (破门目标.value !== 房间id) {
    破门目标.value = 房间id;
    破门数.value = 0;
  }
  破门数.value += 1;
  clearTimeout(破门计时);
  破门计时 = setTimeout(() => {
    破门数.value = 0;
    破门目标.value = '';
  }, 2500);
  if (破门数.value >= 6) {
    破门数.value = 0;
    破门目标.value = '';
    进入(房间id, true);
  } else if (破门数.value === 1) {
    进入(房间id); // 第一下先走到门口(站门外);后续连点升级成撬门
    显示地图.value = true; // 地图不收,等连击
  }
}

// ── 楼内的人:与脚本同一套纯函数推算(永不自相矛盾) ──

/** 已入住且非隐身的户(母亲 302 系统级隐身:地图/头像行/档案永不出现) */
const 可见门牌 = computed(() =>
  门牌列表.filter(m => data.value.户[m] && !户静态表[m].隐身),
);

/** 某房间此刻有谁(妻按位置推算;夫在自家时段在家) */
function 房内的人(房间id: string): string[] {
  const 名单: string[] = [];
  for (const m of 可见门牌.value) {
    if (妻位置推算(m, 位置种子.value) === 房间id) 名单.push(户静态表[m].妻名);
    if (m === 房间id && 丈夫状态推算(m, 位置种子.value) !== '外出' && 户静态表[m].夫名) {
      名单.push(户静态表[m].夫名);
    }
  }
  return 名单;
}

function 房内有人在(房间id: string): boolean {
  return 房内的人(房间id).length > 0;
}

function 房内首字(房间id: string): string {
  return 房内的人(房间id)
    .map(n => n[0])
    .join(' ');
}

const 当前房间名 = computed(() => (当前房间.value ? (查房间(当前房间.value)?.名称 ?? 当前房间.value) : ''));
const 房内名单 = computed(() => (当前房间.value ? 房内的人(当前房间.value).join('、') : ''));

// ── 地图数据(公寓立面:3F→1F 每层两户,顶=天台,底=公共区) ──

const 楼层组 = computed(() => [
  { 名: '3F', 房: [房卡('301'), 房卡('302')] },
  { 名: '2F', 房: [房卡('201'), 房卡('202')] },
  { 名: '1F', 房: [房卡('101'), 房卡('102')] },
]);

function 房卡(m: 门牌) {
  const 入住 = Boolean(data.value.户[m]);
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
];

function 房态类(房间id: string): string {
  return 当前房间.value === 房间id ? 'here' : '';
}

// ── 头像行(脚本每回合把焦点/在场落 chat 变量 _在场) ──

const 在场 = ref<{ 焦点: string[]; 在场: string[] }>({ 焦点: [], 在场: [] });

function 刷新在场() {
  const v = _.get(getVariables({ type: 'chat' }), '_在场') as { 焦点?: string[]; 在场?: string[] } | undefined;
  在场.value = { 焦点: v?.焦点 ?? [], 在场: v?.在场 ?? [] };
}

const 头像列表 = computed(() =>
  可见门牌.value.map(m => ({
    门牌: m,
    妻名: 户静态表[m].妻名,
    态: 在场.value.焦点.includes(m) ? 'focus' : 在场.value.在场.includes(m) ? 'ambient' : 'away',
  })),
);

// ── 游戏内输入(固定0楼:行动发给脚本回合引擎,不碰酒馆输入框) ──

const 输入文本 = ref('');
const 发送中 = ref(false);
const 流式段 = ref<string[]>([]);
const 可重掷 = ref(false);

function 刷新可重掷() {
  可重掷.value = Boolean(_.get(getVariables({ type: 'chat' }), '_上次回合'));
}

/** 发出一条行动(输入框与行动选项按钮共用) */
function 发出(文本: string) {
  文本 = 文本.trim();
  if (!文本 || 发送中.value) return;
  发送中.value = true;
  流式段.value = [];
  // 乐观渲染:玩家行动先上卷轴,回合完成后由楼层数据重建
  卷轴.value.push({ 谁: '玩家', 文本: [文本.replace(/\n+/g, ' ')] });
  void 滚到底();
  eventEmit('人妻公寓:玩家行动', 文本);
}

function 发送() {
  const 文本 = 输入文本.value.trim();
  if (!文本) return;
  输入文本.value = '';
  发出(文本);
}

function 重掷() {
  if (发送中.value) return;
  发送中.value = true;
  流式段.value = [];
  if (卷轴.value.at(-1)?.谁 === '叙事') 卷轴.value.pop();
  void 滚到底();
  eventEmit('人妻公寓:重掷');
}

/** 撤回本回合:删掉你的行动与 AI 回应,回到落笔之前 */
function 撤回() {
  if (发送中.value) return;
  const 记录 = _.get(getVariables({ type: 'chat' }), '_上次回合') as { 回合前末楼?: number } | undefined;
  if (!记录 || typeof 记录.回合前末楼 !== 'number') return;
  发送中.value = true;
  流式段.value = [];
  eventEmit('人妻公寓:回档', 记录.回合前末楼);
}

function 取消回合() {
  if (!发送中.value) return;
  eventEmit('人妻公寓:取消生成');
}

// ── 行动选项(脚本每回合从 <options> 块提取,存 chat 变量) ──

const 行动选项 = ref<string[]>([]);

function 刷新行动选项() {
  const v = _.get(getVariables({ type: 'chat' }), '_行动选项');
  行动选项.value = Array.isArray(v) ? (v as string[]).filter(x => typeof x === 'string' && x.trim()) : [];
}

// ── 序章:难度三档 ──

const 选中难度 = ref('');
const 难度卡 = Object.values(难度表);

function 开始考验() {
  if (!选中难度.value || 发送中.value) return;
  发送中.value = true;
  eventEmit('人妻公寓:开始新游戏', 选中难度.value);
}

// ── 待办软引导(开局流程③:拿钥匙看信箱→101报修→102收租→回管理员室;不硬锁) ──

const 待办定义 = [
  { 键: '信箱区', 文字: '去信箱看看租约单子' },
  { 键: '101', 文字: '去 101 修水管' },
  { 键: '102', 文字: '去 102 收房租' },
  { 键: '管理员室', 文字: '回管理员室' },
] as const;

const 待办勾 = ref<Record<string, boolean>>({});
const 待办已划掉 = ref(false);

function 刷新待办() {
  const v = _.get(getVariables({ type: 'chat' }), '_待办') as Record<string, boolean> | undefined;
  待办勾.value = v ?? {};
  待办已划掉.value = Boolean(待办勾.value._划掉);
}

function 记待办(房间id: string) {
  if (待办已划掉.value || !待办定义.some(t => t.键 === 房间id) || 待办勾.value[房间id]) return;
  待办勾.value = { ...待办勾.value, [房间id]: true };
  insertOrAssignVariables({ _待办: 待办勾.value }, { type: 'chat' });
}

function 划掉待办() {
  待办已划掉.value = true;
  insertOrAssignVariables({ _待办: { ...待办勾.value, _划掉: true } }, { type: 'chat' });
}

const 待办列表 = computed(() => 待办定义.map(t => ({ ...t, 完成: Boolean(待办勾.value[t.键]) })));
const 显示待办 = computed(
  () =>
    !待办已划掉.value && 末楼号.value < 24 && 待办列表.value.some(t => !t.完成),
);

// ── 档案卡 ──

const 选中门牌 = ref<门牌 | null>(null);

const 选中档案 = computed(() => {
  const m = 选中门牌.value;
  if (!m || !就绪.value || !data.value.户[m]) return null;
  const { 妻, 夫 } = data.value.户[m];
  void 夫;
  return {
    门牌: m,
    妻名: 户静态表[m].妻名,
    夫名: 户静态表[m].夫名 || '她丈夫',
    夫状态: 丈夫状态推算(m, 位置种子.value),
    妻,
    三轴: [
      { 名: '好感', 类: 'fav', 值: 妻.好感值 },
      { 名: '堕落', 类: 'sin', 值: 妻.堕落值 },
      { 名: '婚姻', 类: 'marr', 值: 妻.婚姻值 },
    ],
    仪容项: (() => {
      const 项 = [
        { 标: '外装', 值: 妻.外装 || '—' },
        { 标: '妆容', 值: 妻.妆容 || '素颜' },
      ];
      if (妻.内衣) 项.push({ 标: '内衣', 值: 妻.内衣 });
      for (const 件 of 妻.特殊) 项.push({ 标: '佩着', 值: 件 });
      return 项;
    })(),
    开发: [
      { 名: '小嘴', 值: 妻.身体开发.小嘴 },
      { 名: '胸部', 值: 妻.身体开发.胸部 },
      { 名: '小屄', 值: 妻.身体开发.小屄 },
      { 名: '屁穴', 值: 妻.身体开发.屁穴 },
    ],
  };
});

const 选中可晋阶 = computed(() => {
  const m = 选中门牌.value;
  if (!m || !data.value.户[m]) return false;
  return 可晋阶(data.value.户[m].妻);
});

function 晋阶(门牌号: 门牌) {
  eventEmit('人妻公寓:请求晋阶', 门牌号);
  选中门牌.value = null;
}

// ── 背包(道具可用:布设/送礼/读信) ──

const 显示背包 = ref(false);

/** 信物品名 → 门牌("拼合的信·夏乔"/"观察笔记·沈静仪") */
function 信物门牌(名: string): 门牌 | null {
  const m = 名.match(/^(?:拼合的信|观察笔记)·(.+)$/);
  if (!m) return null;
  return (门牌列表.find(k => 户静态表[k].妻名 === m[1]) ?? null) as 门牌 | null;
}

const 背包列表 = computed(() =>
  (data.value?.背包 ?? []).map(id => {
    const 配 = 查道具(id);
    const 信门牌 = 信物门牌(id);
    const 房 = 当前房间.value ? 查房间(当前房间.value) : undefined;
    const 在户内 = !!房 && 房.类型 === '户' && 房.id !== '302' && Boolean(data.value.户[房.id]);
    return {
      id,
      名称: 配?.名称 ?? id,
      描述: 配?.描述 ?? (信门牌 ? '四条线索拼在一起的东西。读它=看清她的裂缝' : ''),
      // 读信:碎片集齐后的揭晓时刻
      可读信: !!信门牌 && !data.value.户[信门牌]?.妻.裂缝.已确认,
      信门牌,
      // 摄像头:须在已入住户的房内且屋里没人
      可布设: id === '针孔摄像头' && 在户内 && !房内有人在(当前房间.value!),
      // 礼物等可送出:须与她同处一室(当面);工具类常驻不可送
      可送对象:
        !配?.常驻 && !信门牌 && id !== '针孔摄像头'
          ? 可见门牌.value
              .filter(m => 当前房间.value && 妻位置推算(m, 位置种子.value) === 当前房间.value)
              .map(m => ({ 门牌: m, 妻名: 户静态表[m].妻名 }))
          : [],
    };
  }),
);

// ── 商店(P2 工具+礼物两页签;礼物页签=任一裂缝确认后现) ──

const 显示商店 = ref(false);
const 商店页签 = ref('工具');

const 货架 = computed(() => {
  const 全部 = Object.values(道具表).filter(d => (d.价格 ?? 0) > 0);
  const 架 = [{ 页签: '工具', 商品: 全部.filter(d => d.类别 === '工具') }];
  if (Object.values(data.value?.户 ?? {}).some(节点 => 节点.妻.裂缝.已确认)) {
    架.push({ 页签: '礼物', 商品: 全部.filter(d => d.类别 === '礼物') });
  }
  return 架;
});

const 当前货架 = computed(() => 货架.value.find(页 => 页.页签 === 商店页签.value)?.商品 ?? []);

function 买(道具id: string) {
  eventEmit('人妻公寓:购买', 道具id);
}

function 送出(道具id: string, 门牌号: 门牌) {
  显示背包.value = false;
  eventEmit('人妻公寓:送礼', { 道具id, 门牌: 门牌号 });
}

// ── 侦探:翻垃圾 / 摄像头 / 偷窥选细节 / 读信 ──

const 垃圾袋列表 = computed(() => 可见门牌.value.map(m => ({ 门牌: m, 妻名: 户静态表[m].妻名 })));

function 翻(门牌号: 门牌) {
  eventEmit('人妻公寓:翻垃圾', 门牌号);
}

function 布设() {
  if (!当前房间.value) return;
  显示背包.value = false;
  eventEmit('人妻公寓:布设摄像头', 当前房间.value);
}

const 显示监控 = ref(false);
const 监控列表 = ref<门牌[]>([]);

function 刷新监控() {
  const v = (_.get(getVariables({ type: 'chat' }), '_摄像头') ?? {}) as Record<string, boolean>;
  监控列表.value = 门牌列表.filter(m => v[m]);
}

function 看监控(门牌号: 门牌) {
  显示监控.value = false;
  eventEmit('人妻公寓:查看摄像头', 门牌号);
}

const 偷窥待选 = ref<{ 门牌: 门牌; 拍: number; 选项: string[] } | null>(null);

function 刷新偷窥待选() {
  const 挂起 = _.get(getVariables({ type: 'chat' }), '_侦探.偷窥待选') as { 门牌: 门牌; 拍: number } | null;
  if (!挂起) {
    偷窥待选.value = null;
    return;
  }
  const 本拍 = 查裂缝(挂起.门牌)?.偷窥?.[挂起.拍];
  偷窥待选.value = 本拍 ? { ...挂起, 选项: 本拍.选项 } : null;
}

function 选细节(i: number) {
  if (!偷窥待选.value) return;
  const 门牌号 = 偷窥待选.value.门牌;
  偷窥待选.value = null;
  eventEmit('人妻公寓:偷窥选细节', { 门牌: 门牌号, 选项: i });
}

const 读信门牌 = ref<门牌 | null>(null);
const 读信正文 = computed(() => (读信门牌.value ? (查裂缝(读信门牌.value)?.信全文 ?? '') : ''));

function 打开信(门牌号: 门牌) {
  显示背包.value = false;
  读信门牌.value = 门牌号;
}

function 合上信() {
  const m = 读信门牌.value;
  读信门牌.value = null;
  if (m) eventEmit('人妻公寓:读信', m);
}

// ── 档案卡:线索列表与裂缝节 ──

const 选中线索 = computed(() => {
  const m = 选中门牌.value;
  if (!m || !data.value.户[m]) return [];
  const 缝 = 查裂缝(m);
  const 进度 = data.value.户[m].妻.裂缝.碎片进度;
  if (!缝) return [];
  const 源 = 缝.碎片信 ?? 缝.偷窥?.map(拍 => 拍.碎片文案) ?? [];
  return 源.slice(0, 进度);
});

const 选中裂缝 = computed(() => (选中门牌.value ? (查裂缝(选中门牌.value) ?? null) : null));

// ── 剧情卷轴:全部楼层清洗后重建(伪单楼) ──

interface 卷轴条 {
  谁: '玩家' | '叙事';
  文本: string[];
  楼?: number;
  可回档?: boolean;
  原文?: string;
}

const 卷轴 = ref<卷轴条[]>([]);
const 卷轴容器 = ref<HTMLElement | null>(null);
const 显示史册 = ref(false);

/** 正文书页只演当前幕:从最后一条玩家行动起;完整历史在史册 */
const 当前幕 = computed(() => {
  const 列表 = 卷轴.value;
  if (!列表.length) return [];
  let 起 = 列表.length - 1;
  while (起 > 0 && 列表[起].谁 !== '玩家') 起 -= 1;
  return 列表[起].谁 === '玩家' ? 列表.slice(起) : 列表;
});

// 玩家预设兼容:按玩家自己酒馆里的显示向正则(仅全局+预设)跑一遍
type 玩家正则项 = { re: RegExp; 替换: string; 用户: boolean; ai: boolean; min: number | null; max: number | null };
let 玩家正则表: 玩家正则项[] = [];

function 刷新玩家正则() {
  try {
    const 原 = [...getTavernRegexes({ type: 'global' }), ...getTavernRegexes({ type: 'preset', name: 'in_use' })];
    玩家正则表 = 原
      .filter(r => r.enabled && r.destination?.display && (r.source?.ai_output || r.source?.user_input))
      .map(r => {
        try {
          const m = r.find_regex.match(/^\/([\s\S]+)\/([a-z]*)$/);
          const re = m ? new RegExp(m[1], m[2]) : new RegExp(_.escapeRegExp(r.find_regex), 'g');
          return {
            re,
            替换: r.replace_string ?? '',
            用户: !!r.source.user_input,
            ai: !!r.source.ai_output,
            min: r.min_depth,
            max: r.max_depth,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as 玩家正则项[];
  } catch (e) {
    玩家正则表 = [];
    console.warn('[人妻公寓客户端] 读取玩家正则失败(退回本卡清洗):', e);
  }
}

function 过酒馆正则(文本: string, 来源: 'ai_output' | 'user_input', 深度: number): string {
  for (const 项 of 玩家正则表) {
    if (来源 === 'ai_output' ? !项.ai : !项.用户) continue;
    if (项.min !== null && 深度 < 项.min) continue;
    if (项.max !== null && 深度 > 项.max) continue;
    try {
      文本 = 文本.replace(项.re, 项.替换.replace(/\{\{match\}\}/gi, '$&'));
    } catch {
      /* 单条应用失败跳过 */
    }
  }
  return 文本;
}

function 清洗(原文: string): string {
  return (
    原文
      .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
      .replace(/<StatusPlaceHolderImpl\/>/g, '')
      .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
      .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^\s*-{2,}>?\s*$/gm, '')
      .replace(/<options>[\s\S]*?<\/options>/g, '')
      .replace(/<行为等级>[\s\S]*?<\/行为等级>/g, '')
      // 流式过程中的未闭合块也吞掉,防半截标记块闪现
      .replace(/<think(?:ing)?>[\s\S]*$/i, '')
      .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
      .replace(/<!--[\s\S]*$/, '')
      .replace(/<UpdateVariable>[\s\S]*$/, '')
      .replace(/<options>[\s\S]*$/, '')
      .replace(/<行为等级>[\s\S]*$/, '')
      .trim()
  );
}

async function 滚到底() {
  await nextTick();
  if (卷轴容器.value) 卷轴容器.value.scrollTop = 卷轴容器.value.scrollHeight;
}

async function 取卷轴() {
  try {
    刷新玩家正则();
    const 末楼 = getLastMessageId();
    末楼号.value = 末楼;
    const 消息组 = (await getChatMessages(`0-${末楼}`)) ?? [];
    const 条目: 卷轴条[] = [];
    const 历史: Record<string, { 好感: number[]; 堕落: number[]; 婚姻: number[] }> = {};
    for (const 消息 of 消息组) {
      // 三轴历史:每个带存档的楼是一个采样点(固定0楼架构红利)
      const 户档 = _.get(消息.data, 'stat_data.户');
      if (消息.role !== 'user' && 户档) {
        for (const m of 门牌列表) {
          const 妻 = _.get(户档, [m, '妻']);
          if (!妻) continue;
          历史[m] ??= { 好感: [], 堕落: [], 婚姻: [] };
          历史[m].好感.push(Number(妻.好感值) || 0);
          历史[m].堕落.push(Number(妻.堕落值) || 0);
          历史[m].婚姻.push(Number(妻.婚姻值 ?? 100) || 0);
        }
      }
      const 是玩家 = 消息.role === 'user';
      const 原文 = 消息.message ?? '';
      const 净文 = 清洗(过酒馆正则(原文, 是玩家 ? 'user_input' : 'ai_output', 末楼 - 消息.message_id));
      if (!净文) continue;
      // 0 楼藏着界面占位标记,整楼写回会砸掉客户端,不开放编辑
      const 可编辑 = 消息.message_id > 0 ? { 原文 } : {};
      if (是玩家) {
        条目.push({ 谁: '玩家', 文本: [净文.replace(/\n+/g, ' ')], 楼: 消息.message_id, ...可编辑 });
      } else {
        条目.push({
          谁: '叙事',
          文本: 净文
            .split(/\n+/)
            .map(s => s.trim())
            .filter(Boolean),
          楼: 消息.message_id,
          可回档: 消息.message_id > 0 && 消息.message_id < 末楼,
          ...可编辑,
        });
      }
    }
    卷轴.value = 条目;
    三轴历史.value = 历史;
    待回档楼.value = null;
    await 滚到底();
  } catch (e) {
    console.error('[人妻公寓客户端] 取卷轴失败:', e);
  }
}

// ── 三轴历史曲线(档案卡 sparkline) ──

const 三轴历史 = ref<Record<string, { 好感: number[]; 堕落: number[]; 婚姻: number[] }>>({});

function 折线(序列: number[]): string {
  if (序列.length < 2) return '';
  const 步 = 100 / (序列.length - 1);
  return 序列.map((v, i) => `${(i * 步).toFixed(1)},${(28 - (v / 100) * 26 - 1).toFixed(1)}`).join(' ');
}

const 选中曲线 = computed(() => {
  if (!选中门牌.value) return null;
  const 史 = 三轴历史.value[选中门牌.value];
  if (!史 || 史.好感.length < 2) return null;
  return { 好感: 折线(史.好感), 堕落: 折线(史.堕落), 婚姻: 折线(史.婚姻) };
});

// ── 回档(两段式确认) ──

const 待回档楼 = ref<number | null>(null);

function 点回档(楼: number | undefined) {
  if (楼 === undefined || 发送中.value) return;
  if (待回档楼.value !== 楼) {
    待回档楼.value = 楼;
    return;
  }
  待回档楼.value = null;
  显示史册.value = false;
  发送中.value = true;
  流式段.value = [];
  eventEmit('人妻公寓:回档', 楼);
}

// ── 羽笔改写(直接改楼层原文,楼层变量快照不动) ──

const 编辑中楼 = ref<number | null>(null);
const 编辑文本 = ref('');

function 开编辑(条: 卷轴条) {
  if (发送中.value || 条.楼 === undefined || 条.原文 === undefined) return;
  编辑中楼.value = 条.楼;
  编辑文本.value = 条.原文;
}

async function 存编辑() {
  const 楼 = 编辑中楼.value;
  const 文 = 编辑文本.value.trim();
  编辑中楼.value = null;
  if (楼 === null || !文) return;
  try {
    await setChatMessages([{ message_id: 楼, message: 文 }], { refresh: 'none' });
    await 取卷轴();
  } catch (e) {
    错误信息.value = '改写失败:' + (e instanceof Error ? e.message : String(e));
  }
}

// ── 沉浸全屏(iframe 内对自身文档 requestFullscreen;失败退回画幅撑满) ──

const 全屏中 = ref(false);

type 全屏根 = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type 全屏文档 = Document & { webkitExitFullscreen?: () => void; webkitFullscreenElement?: Element | null };

function 应用画幅(开: boolean) {
  document.documentElement.classList.toggle('rqgy-full', 开);
  if (开) {
    document.documentElement.style.setProperty('--frame-h', '100vh');
    return;
  }
  try {
    const 父高 = window.parent?.innerHeight ?? 800;
    document.documentElement.style.setProperty('--frame-h', `${Math.max(460, Math.round(父高 - 150))}px`);
  } catch {
    document.documentElement.style.setProperty('--frame-h', '620px');
  }
}

async function 切换全屏() {
  const 根 = document.documentElement as 全屏根;
  const 文档 = document as 全屏文档;
  try {
    if (document.fullscreenElement ?? 文档.webkitFullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else 文档.webkitExitFullscreen?.();
    } else if (根.requestFullscreen) {
      await 根.requestFullscreen();
    } else if (根.webkitRequestFullscreen) {
      await 根.webkitRequestFullscreen();
    } else {
      throw new Error('Fullscreen API 不可用');
    }
  } catch (e) {
    console.warn('[人妻公寓客户端] 真全屏不可用,退回网页内画幅:', e);
    全屏中.value = !全屏中.value;
    应用画幅(全屏中.value);
  }
}

// ── 提示 toast ──

const 提示文本 = ref('');
let 提示timer: ReturnType<typeof setTimeout> | undefined;

function 弹提示(文本: string) {
  提示文本.value = 文本;
  clearTimeout(提示timer);
  提示timer = setTimeout(() => (提示文本.value = ''), 2600);
}

// ── 错误护栏 ──

const 错误信息 = ref('');
onErrorCaptured(err => {
  错误信息.value = err instanceof Error ? `${err.message}\n${(err.stack ?? '').split('\n')[1] ?? ''}` : String(err);
  console.error('[人妻公寓客户端]', err);
  return false;
});

// ── 挂载:事件接线 + 状态恢复 ──

onMounted(() => {
  void 取卷轴();
  刷新可重掷();
  刷新在场();
  刷新行动选项();
  刷新待办();
  刷新监控();
  刷新偷窥待选();

  eventOn('人妻公寓:生成开始', () => {
    // 脚本侧发起的回合(查看监控等)也要锁输入+亮书写态
    发送中.value = true;
  });
  eventOn('人妻公寓:流式', (文本: string) => {
    // 流式半截文本只走本卡清洗,不过玩家正则(闭合标记未到会整段吞空)
    const 净文 = 清洗(文本);
    流式段.value = 净文
      ? 净文
          .split(/\n+/)
          .map(s => s.trim())
          .filter(Boolean)
      : [];
    void 滚到底();
  });
  eventOn('人妻公寓:回合完成', () => {
    发送中.value = false;
    流式段.value = [];
    void 取卷轴();
    刷新可重掷();
    刷新在场();
    刷新行动选项();
    刷新监控();
    刷新偷窥待选();
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* store 未带 pull 时靠轮询兜底 */
    }
  });
  eventOn('人妻公寓:回合失败', (原因: string) => {
    发送中.value = false;
    流式段.value = [];
    if (!原因.startsWith('已取消')) 错误信息.value = '回合失败:' + 原因;
    void 取卷轴();
    刷新可重掷();
  });
  eventOn('人妻公寓:提示', (消息: string) => {
    弹提示(消息);
    // 侦探/商店操作是纯 UI 回合(不产楼):变量与软计数即时刷新
    刷新监控();
    刷新偷窥待选();
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* store 未带 pull 时靠轮询兜底 */
    }
  });

  // 恢复场景(刷新页面/重开酒馆后仍在原房间,位置种子一并恢复)
  const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as { 房间id?: string; 进房末楼?: number } | null;
  当前房间.value = 场景?.房间id ?? null;
  try {
    进房末楼.value = 场景?.进房末楼 ?? getLastMessageId();
  } catch {
    进房末楼.value = 0;
  }

  // 真全屏状态同步(按钮/Esc/系统手势退出都走这里)
  for (const 事件名 of ['fullscreenchange', 'webkitfullscreenchange']) {
    document.addEventListener(事件名, () => {
      const 开 = !!(document.fullscreenElement ?? (document as 全屏文档).webkitFullscreenElement);
      全屏中.value = 开;
      应用画幅(开);
    });
  }

  // 脚本心跳检测
  const 心跳tick = () => {
    try {
      const _top = (window.parent ?? window) as unknown as { sessionStorage?: Storage };
      const beat = Number(_top.sessionStorage?.getItem?.('人妻公寓_脚本心跳') ?? 0);
      脚本存活.value = beat > 0 && Date.now() - beat < 15000;
    } catch {
      脚本存活.value = true; // 跨域读不到就不误报
    }
  };
  setTimeout(心跳tick, 3000);
  心跳timer = setInterval(心跳tick, 5000);
});

onUnmounted(() => {
  clearInterval(心跳timer);
  clearTimeout(破门计时);
  clearTimeout(提示timer);
});
</script>

<style scoped>
/* ═══ 画框:老公寓的黄昏(固定画幅,内部各区自行滚动) ═══ */

.apt {
  box-sizing: border-box;
  height: var(--frame-h, 620px);
  padding: 6px;
  background:
    radial-gradient(ellipse 90% 55% at 50% -6%, rgba(217, 163, 92, 0.12), transparent 60%),
    linear-gradient(175deg, var(--dusk-2), var(--dusk) 65%);
  border: 1px solid var(--line);
  box-shadow:
    0 10px 36px rgba(0, 0, 0, 0.75),
    inset 0 0 70px rgba(0, 0, 0, 0.5);
}

.page {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 8px 12px 10px;
  border: 1px solid var(--line-soft);
}

.err {
  white-space: pre-wrap;
  word-break: break-all;
  background: rgba(122, 26, 26, 0.85);
  color: #ffe9e0;
  border: 1px solid var(--seal);
  padding: 6px 8px;
  margin-bottom: 8px;
  font-size: 0.75em;
}

.masthead {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  font-size: 1.1em;
  letter-spacing: 0.4em;
  text-indent: 0.4em;
  color: var(--lamp-bright);
  text-shadow: 0 0 12px rgba(217, 163, 92, 0.35);
  padding: 4px 0 6px;
  margin-bottom: 6px;
}

.masthead::before,
.masthead::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--line) 45%, var(--line) 55%, transparent);
}

.masthead.ending {
  color: var(--seal);
}

.hint {
  font-size: 0.8em;
  color: var(--paper-faded);
  margin: 4px 0;
}

.center {
  text-align: center;
}

.heartbeat {
  flex: none;
  font-size: 0.72em;
  color: var(--verdigris);
  text-align: center;
  margin-top: auto;
}

.heartbeat.dead {
  color: var(--seal);
}

/* ═══ 按钮语言:楼道声控灯的昏黄横带 ═══ */

.btn {
  --btn-line: rgba(217, 163, 92, 0.4);
  padding: 4px 14px;
  font-family: inherit;
  font-size: 0.88em;
  letter-spacing: 0.08em;
  color: var(--lamp);
  border: none;
  background:
    linear-gradient(90deg, transparent, var(--btn-line) 20%, var(--btn-line) 80%, transparent) top / 100% 1px no-repeat,
    linear-gradient(90deg, transparent, var(--btn-line) 20%, var(--btn-line) 80%, transparent) bottom / 100% 1px
      no-repeat,
    linear-gradient(90deg, transparent, rgba(46, 34, 24, 0.8) 15%, rgba(46, 34, 24, 0.8) 85%, transparent);
  cursor: pointer;
  transition: all 0.22s ease;
}

.btn:hover:not(:disabled) {
  --btn-line: var(--lamp);
  color: var(--lamp-bright);
  text-shadow: 0 0 9px rgba(242, 207, 154, 0.55);
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.btn.mini {
  padding: 2px 8px;
  font-size: 0.8em;
}

.btn.rite {
  align-self: center;
  padding: 6px 26px;
  font-size: 0.95em;
  letter-spacing: 0.16em;
  color: var(--lamp-bright);
}

/* ═══ 计数条 ═══ */

.meta-row {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px 14px;
  justify-content: center;
  font-size: 0.82em;
  color: var(--paper-faded);
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
  padding: 3px 6px;
  margin-bottom: 6px;
}

.meta-row .hot {
  color: var(--seal);
}

.meta-btns {
  display: inline-flex;
  gap: 6px;
}

/* ═══ 头像行 ═══ */

.avatar-row {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  justify-content: center;
  margin-bottom: 6px;
}

.avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  cursor: pointer;
  opacity: 0.45;
  transition: opacity 0.25s;
}

.avatar.focus {
  opacity: 1;
}

.avatar.ambient {
  opacity: 0.75;
}

.avatar-glyph {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--panel-lit);
  color: var(--lamp-bright);
  font-size: 1em;
}

.avatar.focus .avatar-glyph {
  border-color: var(--lamp);
  box-shadow: 0 0 10px rgba(217, 163, 92, 0.4);
}

.avatar-glyph.big {
  width: 44px;
  height: 44px;
  font-size: 1.25em;
}

.avatar-name {
  font-size: 0.68em;
  color: var(--paper-faded);
}

.avatar.focus .avatar-name {
  color: var(--lamp);
}

/* ═══ 待办条 ═══ */

.todo-bar {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 12px;
  font-size: 0.74em;
  color: var(--paper-faded);
  border: 1px dashed var(--line-soft);
  border-radius: 4px;
  padding: 3px 8px;
  margin-bottom: 6px;
}

.todo-item.done {
  color: var(--verdigris);
  text-decoration: line-through;
}

.todo-bar .btn {
  margin-left: auto;
}

/* ═══ 卷轴 ═══ */

.story {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--lamp-deep) transparent;
}

.story-entry {
  position: relative;
  margin-bottom: 8px;
}

.story-player {
  color: var(--lamp);
  font-size: 0.88em;
  margin: 6px 0;
  padding-left: 8px;
  border-left: 2px solid var(--line);
}

.narr {
  color: var(--paper);
  font-size: 0.9em;
  line-height: 1.75;
  margin: 5px 0;
  text-indent: 2em;
}

.scribing {
  color: var(--paper-faded);
  font-size: 0.8em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.entry-edit {
  position: absolute;
  top: -2px;
  right: 0;
  background: none;
  border: none;
  color: var(--paper-faded);
  opacity: 0;
  cursor: pointer;
  font-size: 0.85em;
  transition: opacity 0.2s;
}

.story-entry:hover .entry-edit {
  opacity: 0.7;
}

.edit-area {
  width: 100%;
  box-sizing: border-box;
  background: var(--panel);
  color: var(--paper);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 6px;
  font-family: inherit;
  font-size: 0.88em;
  line-height: 1.6;
}

.edit-acts {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

.candle-row {
  text-align: right;
  margin: 0;
}

.candle {
  background: none;
  border: none;
  color: var(--lamp-deep);
  cursor: pointer;
  font-size: 0.85em;
  transition: color 0.2s;
}

.candle:hover {
  color: var(--lamp);
}

.candle.armed {
  color: var(--seal);
  font-size: 0.78em;
}

/* ═══ 场景条 / 选项 / 输入 ═══ */

.scene-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82em;
  border-top: 1px solid var(--line-soft);
  padding: 5px 2px 0;
}

.scene-name {
  color: var(--lamp);
  white-space: nowrap;
}

.scene-occ {
  flex: 1;
  color: var(--paper-faded);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-row {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 5px;
}

.option-chip {
  text-align: left;
  background: var(--panel);
  border: 1px solid var(--line-soft);
  border-radius: 4px;
  color: var(--paper);
  font-family: inherit;
  font-size: 0.8em;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-chip:hover {
  border-color: var(--lamp);
  color: var(--lamp-bright);
}

.quill {
  flex: none;
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.quill textarea {
  flex: 1;
  resize: none;
  background: var(--panel);
  color: var(--paper);
  border: 1px solid var(--line-soft);
  border-radius: 4px;
  padding: 5px 8px;
  font-family: inherit;
  font-size: 0.88em;
  line-height: 1.5;
}

.quill textarea:focus {
  outline: none;
  border-color: var(--lamp);
}

.quill-btn {
  align-self: stretch;
}

.reroll-row {
  flex: none;
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 5px;
}

/* ═══ 遮罩与面板 ═══ */

.mask {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: rgba(10, 7, 5, 0.72);
  display: grid;
  place-items: center;
  padding: 12px;
}

.sheet {
  position: relative;
  box-sizing: border-box;
  width: min(480px, 96%);
  max-height: 94%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(178deg, var(--dusk-2), var(--dusk));
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 12px 14px;
  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.8);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--lamp-deep) transparent;
}

.sheet-close {
  position: absolute;
  top: 6px;
  right: 8px;
  background: none;
  border: none;
  color: var(--paper-faded);
  font-size: 1em;
  cursor: pointer;
}

.sheet-close:hover {
  color: var(--lamp);
}

.sheet-title {
  text-align: center;
  color: var(--lamp-bright);
  letter-spacing: 0.35em;
  text-indent: 0.35em;
  font-size: 1em;
  margin-bottom: 6px;
}

.sheet-body {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.toast {
  position: absolute;
  left: 50%;
  bottom: 66px;
  transform: translateX(-50%);
  z-index: 40;
  background: var(--panel-lit);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--lamp-bright);
  font-size: 0.82em;
  padding: 5px 14px;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
}

/* ═══ 地图:公寓立面 ═══ */

.map-sheet {
  width: min(420px, 96%);
}

.building {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 4px 2px 8px;
}

.floor-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.floor-row.ground {
  grid-template-columns: repeat(5, 1fr);
}

.map-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  background: var(--panel);
  border: 1px solid var(--line-soft);
  border-radius: 4px;
  color: var(--paper);
  font-family: inherit;
  padding: 7px 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.map-room:hover {
  border-color: var(--lamp);
}

.map-room.here {
  border-color: var(--lamp);
  background: var(--panel-lit);
  box-shadow: inset 0 0 14px rgba(217, 163, 92, 0.14);
}

.map-room.vacant {
  opacity: 0.4;
  cursor: default;
}

.map-room.roof {
  align-self: center;
  width: 46%;
}

.map-room.pub {
  padding: 5px 2px;
}

.room-name {
  font-size: 0.82em;
  color: var(--lamp);
  letter-spacing: 0.06em;
}

.room-sub {
  font-size: 0.7em;
  color: var(--paper-faded);
}

.room-occ {
  min-height: 1em;
  font-size: 0.72em;
  color: var(--lamp-bright);
  letter-spacing: 0.2em;
}

/* ═══ 难度三档卡 ═══ */

.diff-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 10px 0 14px;
}

.diff-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--panel);
  border: 1px solid var(--line-soft);
  border-radius: 6px;
  color: var(--paper);
  font-family: inherit;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.22s;
}

.diff-card:hover {
  border-color: var(--lamp);
}

.diff-card.chosen {
  border-color: var(--lamp);
  background: var(--panel-lit);
  box-shadow: 0 0 16px rgba(217, 163, 92, 0.18);
}

.diff-name {
  color: var(--lamp-bright);
  font-size: 1em;
  letter-spacing: 0.24em;
  text-indent: 0.24em;
}

.diff-desc {
  font-size: 0.74em;
  color: var(--paper-faded);
  line-height: 1.6;
  min-height: 3.2em;
}

.diff-meta {
  font-size: 0.72em;
  color: var(--verdigris);
}

/* ═══ 档案卡 ═══ */

.dossier-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.dossier-name {
  color: var(--lamp-bright);
  font-size: 1.05em;
  letter-spacing: 0.1em;
}

.dossier-role {
  color: var(--paper-faded);
  font-size: 0.78em;
}

.dossier-stage {
  margin-left: auto;
  color: var(--lamp);
  font-size: 0.85em;
}

.axes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}

.axis-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78em;
}

.axis-label {
  width: 2.6em;
  color: var(--paper-faded);
  text-align: right;
}

.axis {
  flex: 1;
  height: 5px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  overflow: hidden;
}

.bar {
  display: block;
  height: 100%;
  transition: width 0.5s ease;
}

.bar.fav {
  background: linear-gradient(90deg, var(--lamp-deep), var(--lamp));
}

.bar.sin {
  background: linear-gradient(90deg, #5e2418, var(--seal));
}

.bar.marr {
  background: linear-gradient(90deg, #2e4a40, var(--verdigris));
}

.bar.dev {
  background: linear-gradient(90deg, #5e2418, #b06a4a);
}

.axis-num {
  width: 2em;
  color: var(--paper);
  text-align: right;
  font-size: 0.94em;
}

.trend {
  width: 100%;
  height: 44px;
  margin-top: 2px;
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.35);
}

.trend polyline {
  fill: none;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.trend-fav {
  stroke: var(--lamp);
}

.trend-sin {
  stroke: var(--seal);
}

.trend-marr {
  stroke: var(--verdigris);
}

.trend-legend {
  display: flex;
  gap: 10px;
  font-size: 0.68em;
  margin: 2px 0 6px;
}

.tl-fav {
  color: var(--lamp);
}

.tl-sin {
  color: var(--seal);
}

.tl-marr {
  color: var(--verdigris);
}

.tl-hint {
  color: var(--paper-faded);
}

.dsec {
  border-top: 1px solid var(--line-soft);
  padding: 6px 0 2px;
  margin-top: 4px;
}

.dsec-title {
  color: var(--lamp);
  font-size: 0.8em;
  letter-spacing: 0.3em;
  margin-bottom: 4px;
}

.dline {
  font-size: 0.8em;
  color: var(--paper);
  margin: 3px 0;
}

.dline b {
  color: var(--paper-faded);
  font-weight: normal;
  margin-right: 6px;
}

.dsealed {
  font-size: 0.78em;
  color: var(--paper-faded);
  border: 1px dashed var(--line-soft);
  border-radius: 4px;
  padding: 6px 8px;
  margin: 6px 0;
}

.attire-grid,
.dev-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 10px;
}

.a-cell {
  display: flex;
  flex-direction: column;
  font-size: 0.76em;
  border-left: 2px solid var(--line-soft);
  padding-left: 6px;
}

.a-cell small {
  color: var(--paper-faded);
}

.a-cell b {
  color: var(--paper);
  font-weight: normal;
}

/* ═══ 背包 / 商店 ═══ */

.ware {
  display: flex;
  flex-direction: column;
  border-top: 1px dashed var(--line-soft);
  padding: 5px 0;
  font-size: 0.82em;
}

.ware:first-child {
  border-top: none;
}

.ware b {
  color: var(--lamp);
  font-weight: normal;
}

.ware-desc {
  color: var(--paper-faded);
  font-size: 0.92em;
}

.ware-price {
  color: var(--verdigris);
  font-style: normal;
  margin-left: 8px;
  font-size: 0.9em;
}

.ware-acts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
}

.shop-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 5px;
  margin-bottom: 4px;
}

.shop-tabs .btn.on {
  color: var(--lamp-bright);
  text-shadow: 0 0 8px rgba(242, 207, 154, 0.5);
}

.shop-cash {
  margin-left: auto;
  font-size: 0.8em;
  color: var(--verdigris);
}

/* ═══ 偷窥余像 / 读信 / 裂缝 ═══ */

.peep-card {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 6px 8px;
  margin-top: 5px;
  background: var(--panel-lit);
}

.peep-card .hint {
  margin: 0 0 2px;
  color: var(--lamp);
}

.letter {
  border: 1px dashed var(--line);
  border-radius: 4px;
  padding: 10px 12px;
  margin: 4px 0 10px;
  background: rgba(0, 0, 0, 0.3);
}

.narr.no-indent {
  text-indent: 0;
}

.crack-hint {
  color: var(--lamp);
}

/* ═══ 坏结局 ═══ */

.ending-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.ending-line {
  color: var(--paper);
  font-size: 0.95em;
  text-align: center;
  max-width: 34em;
  line-height: 1.9;
}

.chronicle {
  padding-right: 4px;
}
</style>
