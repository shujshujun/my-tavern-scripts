<template>
  <div class="apt">
    <div class="page">
      <!-- 错误护栏:任何运行时异常显示在此,不再整屏空白 -->
      <div v-if="错误信息" class="err">⚠︎ 界面异常:{{ 错误信息 }}</div>

      <!-- 主题切换(日间亮色/夜间深色;地图插画自带昼夜不受影响) -->
      <button class="btn mini theme-btn" :title="暗色 ? '切回日间模式' : '切换夜间模式'" @click="切换主题">
        {{ 暗色 ? '☀' : '🌙' }}
      </button>

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
        <div class="ui-kicker center">WUTONGLI APARTMENT / NEW GAME</div>
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
        <div class="ui-kicker center">WUTONGLI APARTMENT / MANAGER MODE</div>
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

        <!-- 偷窥余像:"你注意到了什么?"(摄像头渠道,选对收进线索板) -->
        <div v-if="偷窥待选 && !发送中" class="peep-card">
          <p class="hint">画面看完了。你注意到了什么?</p>
          <button v-for="(项, i) in 偷窥待选.选项" :key="i" class="option-chip" @click="选细节(i)">
            {{ 项 }}
          </button>
        </div>

        <!-- 行动选项(AI 每轮给 4 条,点了直接发送;想自由发挥就打字) -->
        <div v-if="显示选项" class="option-row">
          <button v-for="(项, i) in 行动选项" :key="i" class="option-chip" @click="发出(项)">▸ {{ 项 }}</button>
        </div>

        <!-- 游戏内输入(玩家不碰酒馆输入框) -->
        <div v-if="可输入" class="quill">
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

      <!-- ═══════════ 地图(日式gal移动画面:天空随时段变色+公寓立面插画+点房弹行动卡) ═══════════ -->
      <div v-if="显示地图 && 就绪" class="mask map-mask" @click.self="关地图">
        <div class="galmap" :class="'sky-' + 时段">
          <button class="sheet-close" @click="关地图">✕</button>
          <!-- 天空装饰(纯CSS:日月云星,随时段切换) -->
          <div class="sky-deco">
            <i class="orb" />
            <i class="cloud c1" />
            <i class="cloud c2" />
            <i class="cloud c3" />
            <template v-if="时段 === '深夜'"><i class="star s1" /><i class="star s2" /><i class="star s3" /><i class="star s4" /></template>
          </div>
          <div class="map-banner">
            <div class="ui-kicker">WUTONGLI APARTMENT / FIELD MAP</div>
            <div class="mb-line"><b>第 {{ 天数 }} 天</b><em>{{ 时段问候 }}</em></div>
          </div>

          <!-- 公寓立面插画 -->
          <div class="bldg">
            <div class="roofline">
              <button class="roof-card" :class="{ here: 当前房间 === '天台' }" @click="点房('天台')">
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
                  :class="{ here: 当前房间 === 房.id, vacant: 房.空置, lit: 窗灯(房.id) }"
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
                :class="{ here: 当前房间 === 房.id }"
                @click="点房(房.id)"
              >
                <span class="unit-sub">{{ 房.名称 }}</span>
                <span class="unit-occ">{{ 房内首字(房.id) }}</span>
              </button>
            </div>
          </div>

          <!-- 行动卡片(动画弹出:氛围+在场+可做的事;翻垃圾/撬门都在这里) -->
          <transition name="card-pop">
            <div v-if="房卡" :key="房卡" class="room-card" @click.stop>
              <div class="ui-kicker">{{ 房卡kicker }}</div>
              <div class="rc-head">
                <b>{{ 房卡名称 }}</b>
                <em v-if="房卡在场">{{ 房卡在场 }}</em>
                <em v-else class="rc-empty">此刻没有人</em>
              </div>
              <p class="rc-mood">{{ 房卡氛围 }}</p>
              <div class="rc-acts">
                <button v-for="(动作, i) in 房卡动作" :key="i" class="act-btn" :class="动作.类" @click="动作.做()">
                  {{ 动作.文案 }}
                </button>
                <span v-if="!房卡动作.length" class="rc-empty">门上贴着招租启事,还没有住户</span>
              </div>
              <transition name="clue-flip">
                <div v-if="结果卡" :key="结果卡" class="clue-card">{{ 结果卡 }}</div>
              </transition>
            </div>
          </transition>
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

function 进入(房间id: string, 破门 = false, 保持地图 = false) {
  try {
    进房末楼.value = getLastMessageId();
  } catch {
    进房末楼.value = 末楼号.value;
  }
  当前房间.value = 房间id;
  已破门进入.value = 破门;
  if (!保持地图) 关地图();
  写场景(房间id, 破门);
  记待办(房间id);
}

function 离开房间() {
  当前房间.value = null;
  已破门进入.value = false;
  写场景(null);
  显示地图.value = true; // 走出房门=站上楼道,顺手展开地图选下一处
}

/** 本次进入是否撬门而入(撬进空屋才有事可做;敲门无人应=还站在门外) */
const 已破门进入 = ref(false);

/**
 * 输入框门控(2026-07-17 用户反馈:无人的房间不该给输入框):
 * 户房间没人应门=没有对手戏,输入收起(只能离开或撬门);撬进去了=屋里翻找,输入恢复;
 * 公共区与 302(你家)不设限——独处也有事可做。
 */
const 可输入 = computed(() => {
  const id = 当前房间.value;
  if (!id) return false;
  const 房 = 查房间(id);
  if (房?.类型 === '户' && id !== '302' && !房内有人在(id)) return 已破门进入.value;
  return true;
});

/** 行动选项只在"产出它们的场景"里显示(换了地方=过期建议,收起防误导) */
const 选项房间 = ref<string | null>(null);

const 显示选项 = computed(() => {
  if (发送中.value || !行动选项.value.length) return false;
  if (!当前房间.value) return 选项房间.value === null; // 楼道态:序章引导等
  return 可输入.value && 选项房间.value === 当前房间.value;
});

// ── 行动卡片(gal式:点房弹卡,氛围+在场+可做的事;翻垃圾/撬门都收在卡里) ──

const 房卡 = ref<string | null>(null);
const 结果卡 = ref('');

function 点房(房间id: string) {
  if (发送中.value) return;
  结果卡.value = '';
  房卡.value = 房卡.value === 房间id ? null : 房间id;
}

function 关地图() {
  显示地图.value = false;
  房卡.value = null;
  结果卡.value = '';
}

const 房卡名称 = computed(() => (房卡.value ? (查房间(房卡.value)?.名称 ?? 房卡.value) : ''));
const 房卡kicker = computed(() => {
  const id = 房卡.value;
  if (!id) return '';
  return /^\d+$/.test(id) ? `ROOM ${id}` : 'COMMON SPACE';
});
const 房卡氛围 = computed(() => {
  if (!房卡.value) return '';
  const 房 = 查房间(房卡.value);
  if (房?.类型 === '户' && 房卡.value !== '302' && !data.value.户[房卡.value]) {
    return '窗户蒙着灰,门上贴着一张手写的招租启事。';
  }
  return 房?.氛围 ?? '';
});
const 房卡在场 = computed(() => (房卡.value ? 房内的人(房卡.value).join('、') : ''));

// 连击破门("点的语法":对没人应的户门连点 6 下=撬开;2.5 秒窗口)
const 破门目标 = ref('');
const 破门数 = ref(0);
let 破门计时: ReturnType<typeof setTimeout> | undefined;

function 敲撬门(房间id: string) {
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
  }
}

interface 卡动作 {
  文案: string;
  类?: string;
  做: () => void;
}

const 房卡动作 = computed<卡动作[]>(() => {
  const id = 房卡.value;
  if (!id) return [];
  const 房 = 查房间(id);
  const 动作: 卡动作[] = [];

  if (房?.类型 === '户' && id !== '302') {
    if (!data.value.户[id]) return []; // 招租中,没有可做的事
    if (房内有人在(id)) {
      动作.push({ 文案: `🚪 过去串门`, 做: () => 进入(id) });
    } else {
      动作.push({ 文案: '🚪 敲敲门(没人应也站一会儿)', 做: () => 进入(id) });
      动作.push({
        文案: 破门目标.value === id && 破门数.value > 0 ? `🔓 撬门中……再点 ${6 - 破门数.value} 下` : '🔓 撬门(连点)',
        类: 'risky',
        做: () => 敲撬门(id),
      });
    }
    return 动作;
  }

  if (id === '302') {
    动作.push({ 文案: '🏠 回家看看', 做: () => 进入(id) });
    return 动作;
  }

  // 公共区
  动作.push({ 文案: '👣 走过去', 做: () => 进入(id) });
  if (id === '垃圾房') {
    for (const 袋 of 垃圾袋列表.value) {
      动作.push({
        文案: `🗑 翻${袋.妻名}家的垃圾袋(${袋.门牌})`,
        类: 'risky',
        做: () => {
          if (当前房间.value !== '垃圾房') 进入('垃圾房', false, true); // 人先走过去,地图和卡都不收
          翻(袋.门牌);
        },
      });
    }
  }
  return 动作;
});

/** 晚间/深夜有人在家=窗户亮灯(gal地图的生活感;也是"丈夫在不在家"的免费可视化) */
function 窗灯(房间id: string): boolean {
  if (时段.value !== '晚' && 时段.value !== '深夜') return false;
  return 房内有人在(房间id);
}

const 时段问候 = computed(
  () => ({ 早: '晨光正好', 午: '日头晃眼', 晚: '暮色四合', 深夜: '整栋楼都睡了' })[时段.value],
);

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
  { 名: '3F', 房: [户牌('301'), 户牌('302')] },
  { 名: '2F', 房: [户牌('201'), 户牌('202')] },
  { 名: '1F', 房: [户牌('101'), 户牌('102')] },
]);

function 户牌(m: 门牌) {
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

// ── 夜间模式(html.rq-dark 令牌覆盖;localStorage 记住偏好) ──

const 暗色 = ref(false);
const 主题存储键 = '人妻公寓_夜间模式';

function 应用主题(开: boolean) {
  暗色.value = 开;
  document.documentElement.classList.toggle('rq-dark', 开);
}

function 切换主题() {
  应用主题(!暗色.value);
  try {
    localStorage.setItem(主题存储键, 暗色.value ? '1' : '0');
  } catch {
    /* 隐私模式等存不了就不记 */
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
    选项房间.value = 当前房间.value; // 本轮选项绑定产出场景,换地方即过期
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
    // 地图行动卡开着:结果以"线索卡"翻出(动画),不走 toast
    if (显示地图.value && 房卡.value) 结果卡.value = 消息;
    else 弹提示(消息);
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
  const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as {
    房间id?: string;
    破门?: boolean;
    进房末楼?: number;
  } | null;
  当前房间.value = 场景?.房间id ?? null;
  已破门进入.value = !!场景?.破门;
  选项房间.value = 当前房间.value; // 刷新恢复:existing 选项视为当前场景的
  try {
    进房末楼.value = 场景?.进房末楼 ?? getLastMessageId();
  } catch {
    进房末楼.value = 0;
  }

  // 恢复主题偏好
  try {
    应用主题(localStorage.getItem(主题存储键) === '1');
  } catch {
    /* 读不到就保持日间 */
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
/* ═══════════════════════════════════════════════════════════════
   学マス系流行日系(2026-07-16 用户给样「初星育成」前端解析定调)
   语法:暖白渐变底(global.css)/玻璃白卡大圆角软影/荧光粉·天蓝·柠黄
   点色/mono kicker 小标/hero 三色渐变(粉→蓝→黄)/悬停上浮+彩色辉光
   ═══════════════════════════════════════════════════════════════ */

/* ── 画框:场景即背景(渐变+格纸在 global),组件各自成玻璃卡 ── */

.apt {
  box-sizing: border-box;
  height: var(--frame-h, 620px);
  padding: 8px;
}

.page {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 8px 12px 10px;
}

.err {
  white-space: pre-wrap;
  word-break: break-all;
  background: #fdeeec;
  color: #a4423a;
  border: 1px solid var(--red);
  border-radius: 10px;
  padding: 6px 8px;
  margin-bottom: 8px;
  font-size: 0.75em;
}

/* ── kicker + 题头(初星签名:mono 小标 + 粗黑标题 + 三色渐变短杠) ── */

.ui-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  text-transform: uppercase;
}

.masthead {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  font-size: 1.12em;
  font-weight: 900;
  letter-spacing: 0.34em;
  text-indent: 0.34em;
  color: var(--ink);
  padding: 0 0 6px;
  margin-bottom: 6px;
  position: relative;
}

.masthead::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 52px;
  height: 4px;
  border-radius: 3px;
  background: linear-gradient(130deg, #ff8ab9, #4ab7ff 46%, #ffd24f);
}

.masthead.ending {
  color: var(--red);
}

.hint {
  font-size: 0.8em;
  color: var(--ink-soft);
  margin: 4px 0;
}

.center {
  text-align: center;
}

.heartbeat {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.68em;
  color: var(--green);
  text-align: center;
  margin-top: auto;
}

.heartbeat.dead {
  color: var(--red);
}

/* ── 按钮:白玻璃胶囊,悬停上浮+辉光;rite=粉色主按钮 ── */

.btn {
  padding: 4px 14px;
  font-family: inherit;
  font-size: 0.86em;
  font-weight: 600;
  color: var(--ink);
  background: var(--glass);
  border: 1px solid var(--line);
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.08);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(38, 169, 244, 0.6);
  box-shadow: 0 8px 20px rgba(38, 169, 244, 0.22);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.42;
  cursor: default;
}

.btn.mini {
  padding: 2px 9px;
  font-size: 0.78em;
}

.btn.rite {
  align-self: center;
  padding: 8px 32px;
  font-size: 0.95em;
  letter-spacing: 0.16em;
  color: #fff;
  background: linear-gradient(180deg, #ff6cab, #ff4f9a);
  border-color: rgba(255, 79, 154, 0.5);
  box-shadow: 0 8px 22px rgba(255, 79, 154, 0.35);
}

.btn.rite:hover:not(:disabled) {
  border-color: rgba(255, 79, 154, 0.85);
  box-shadow: 0 12px 26px rgba(255, 79, 154, 0.42);
}

/* ── 计数条:玻璃卡里的一排 chip ── */

.meta-row {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  justify-content: center;
  padding: 5px 8px;
  margin-bottom: 7px;
  background: var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(6px);
}

.meta-row > span:not(.meta-btns) {
  padding: 2px 10px;
  border: 1px solid var(--line-soft);
  background: #fff;
  border-radius: 999px;
  font-size: 0.76em;
  font-weight: 700;
  color: var(--ink-soft);
}

.meta-row .hot {
  color: #fff !important;
  background: var(--red) !important;
  border-color: var(--red) !important;
}

.meta-btns {
  display: inline-flex;
  gap: 5px;
  margin-left: 4px;
}

/* ── 头像行:白圈圆徽,焦点粉圈辉光 ── */

.avatar-row {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
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
  filter: saturate(0.3);
  transition: all 0.25s;
}

.avatar.focus,
.avatar.ambient {
  opacity: 1;
  filter: none;
}

.avatar-glyph {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: linear-gradient(160deg, #ffe3ee, #ffd0e2);
  color: #d4407a;
  font-size: 0.95em;
  font-weight: 800;
  box-shadow: 0 3px 10px rgba(30, 26, 38, 0.16);
}

.avatar.focus .avatar-glyph {
  border-color: var(--pink);
  box-shadow: 0 4px 14px rgba(255, 79, 154, 0.4);
  animation: avatar-bounce 0.4s ease;
}

@keyframes avatar-bounce {
  40% {
    transform: translateY(-3px);
  }
}

.avatar-glyph.big {
  width: 46px;
  height: 46px;
  font-size: 1.2em;
}

.avatar-name {
  font-size: 0.68em;
  color: var(--ink-soft);
}

.avatar.focus .avatar-name {
  color: var(--pink);
  font-weight: 700;
}

/* ── 待办条:柠黄便签 ── */

.todo-bar {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 12px;
  font-size: 0.73em;
  color: var(--ink-soft);
  background: #fff9e2;
  border: 1px solid rgba(255, 202, 53, 0.55);
  border-radius: 10px;
  padding: 4px 10px;
  margin-bottom: 6px;
}

.todo-item.done {
  color: var(--green);
  text-decoration: line-through;
}

.todo-bar .btn {
  margin-left: auto;
}

/* ── 卷轴:玻璃阅读卡(正文用衬线,小说质感) ── */

.story {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px;
  background: var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(6px);
  scrollbar-width: thin;
  scrollbar-color: rgba(38, 169, 244, 0.4) transparent;
}

.story-entry {
  position: relative;
  margin-bottom: 8px;
}

.story-player {
  color: var(--blue);
  font-size: 0.86em;
  font-weight: 600;
  margin: 6px 0;
  padding-left: 9px;
  border-left: 3px solid var(--blue);
  border-radius: 1px;
}

.narr {
  font-family: var(--font-prose);
  color: var(--ink);
  font-size: 0.9em;
  line-height: 1.85;
  margin: 5px 0;
  text-indent: 2em;
}

.scribing {
  color: var(--ink-faint);
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
  color: var(--ink-faint);
  opacity: 0;
  cursor: pointer;
  font-size: 0.85em;
  transition: opacity 0.2s;
}

.story-entry:hover .entry-edit {
  opacity: 0.85;
}

.edit-area {
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  color: var(--ink);
  border: 1.5px solid var(--blue);
  border-radius: 10px;
  padding: 6px 8px;
  font-family: var(--font-prose);
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
  color: var(--ink-faint);
  cursor: pointer;
  font-size: 0.9em;
  transition: color 0.2s;
}

.candle:hover {
  color: var(--blue);
}

.candle.armed {
  color: var(--red);
  font-size: 0.76em;
}

/* ── 场景条 / 选项 / 输入 ── */

.scene-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8em;
  padding: 6px 2px 0;
}

.scene-name {
  color: #fff;
  white-space: nowrap;
  background: var(--blue);
  border-radius: 999px;
  padding: 2px 12px;
  font-weight: 700;
  box-shadow: 0 3px 10px rgba(38, 169, 244, 0.3);
}

.scene-occ {
  flex: 1;
  color: var(--ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-row {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}

.option-chip {
  text-align: left;
  background: var(--glass);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.8em;
  padding: 6px 11px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(30, 26, 38, 0.06);
  transition: all 0.18s;
}

.option-chip:hover:not(:disabled) {
  border-color: rgba(38, 169, 244, 0.55);
  box-shadow: 0 6px 16px rgba(38, 169, 244, 0.18);
  transform: translateY(-1px);
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
  background: var(--glass);
  color: var(--ink);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 6px 11px;
  font-family: inherit;
  font-size: 0.88em;
  line-height: 1.5;
  box-shadow: inset 0 1px 3px rgba(30, 26, 38, 0.05);
}

.quill textarea:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(38, 169, 244, 0.15);
}

.quill-btn {
  align-self: stretch;
}

.reroll-row {
  flex: none;
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 6px;
}

/* ── 遮罩与玻璃面板 ── */

.mask {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: rgba(20, 22, 30, 0.42);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  padding: 12px;
  border-radius: 12px;
}

.sheet {
  position: relative;
  box-sizing: border-box;
  width: min(480px, 96%);
  max-height: 94%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: var(--shadow);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(38, 169, 244, 0.4) transparent;
}

.sheet-close {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 5;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--ink-soft);
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.15s;
}

.sheet-close:hover {
  color: #fff;
  background: var(--pink);
  border-color: var(--pink);
}

.sheet-title {
  text-align: center;
  color: var(--ink);
  font-weight: 900;
  letter-spacing: 0.32em;
  text-indent: 0.32em;
  font-size: 1em;
  margin-bottom: 8px;
}

.sheet-title::after {
  content: '';
  display: block;
  width: 46px;
  height: 4px;
  margin: 5px auto 0;
  border-radius: 3px;
  background: linear-gradient(130deg, #ff8ab9, #4ab7ff 46%, #ffd24f);
}

.sheet-body {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.toast {
  position: absolute;
  left: 50%;
  bottom: 70px;
  transform: translateX(-50%);
  z-index: 40;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 79, 154, 0.4);
  border-radius: 999px;
  color: var(--ink);
  font-size: 0.8em;
  font-weight: 600;
  padding: 7px 20px;
  white-space: nowrap;
  box-shadow: 0 10px 26px rgba(30, 26, 38, 0.25);
  animation: toast-pop 0.25s ease;
}

@keyframes toast-pop {
  from {
    transform: translate(-50%, 8px);
    opacity: 0;
  }
}

/* ═══ gal 地图:天空随时段变色 + 公寓立面 + 玻璃热点 ═══ */

.map-mask {
  padding: 8px;
}

.galmap {
  position: relative;
  box-sizing: border-box;
  width: min(440px, 98%);
  max-height: 96%;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  padding: 12px 14px 14px;
  overflow: hidden auto;
  box-shadow: var(--shadow);
  scrollbar-width: thin;
  transition: background 0.6s ease;
}

/* 时段天色 */
.sky-早 {
  background: linear-gradient(180deg, #9dd7ef 0%, #cfeefb 55%, #ffefd8 100%);
}

.sky-午 {
  background: linear-gradient(180deg, #4ab7ff 0%, #a8dcf4 60%, #e8f6fd 100%);
}

.sky-晚 {
  background: linear-gradient(180deg, #7796c9 0%, #ff9d6b 55%, #ffd9a8 100%);
}

.sky-深夜 {
  background: linear-gradient(180deg, #1f2a4d 0%, #35456f 60%, #4f5b86 100%);
}

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

.sky-晚 .orb {
  top: 92px;
  background: #ff9d5c;
  box-shadow: 0 0 0 10px rgba(255, 157, 92, 0.3);
}

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
  position: relative;
  z-index: 1;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--ink);
  padding: 2px 4px 10px;
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

.sky-深夜 .bunit:not(.lit) .unit-window i,
.sky-晚 .bunit:not(.lit) .unit-window i {
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

/* ── 行动卡片(初星热点卡语法:玻璃白卡+kicker+顶部三色渐变杠) ── */

.room-card {
  position: relative;
  z-index: 2;
  flex: none;
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 16px;
  padding: 12px 13px 11px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(8px);
}

.room-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 14px;
  right: 14px;
  height: 4px;
  border-radius: 0 0 4px 4px;
  background: linear-gradient(130deg, #ff8ab9, #4ab7ff 46%, #ffd24f);
}

.rc-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 3px 0 4px;
}

.rc-head b {
  color: var(--ink);
  font-size: 0.98em;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.rc-head em {
  font-style: normal;
  font-size: 0.75em;
  font-weight: 700;
  color: var(--pink);
}

.rc-head em.rc-empty,
.rc-empty {
  color: var(--ink-faint);
  font-style: normal;
  font-weight: 400;
  font-size: 0.75em;
}

.rc-mood {
  margin: 0 0 8px;
  font-size: 0.78em;
  line-height: 1.6;
  color: var(--ink-soft);
}

.rc-acts {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.act-btn {
  text-align: left;
  font-family: inherit;
  font-size: 0.82em;
  font-weight: 600;
  color: var(--ink);
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 7px 11px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(30, 26, 38, 0.06);
  transition: all 0.16s;
}

.act-btn:hover {
  border-color: rgba(38, 169, 244, 0.6);
  box-shadow: 0 6px 16px rgba(38, 169, 244, 0.2);
  transform: translateY(-1px);
}

.act-btn.risky {
  border-color: rgba(229, 83, 63, 0.35);
}

.act-btn.risky:hover {
  border-color: var(--red);
  box-shadow: 0 6px 16px rgba(229, 83, 63, 0.2);
}

/* 弹卡动画(anime pop) */
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

/* ═══ 难度三档卡 ═══ */

.diff-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 12px 0 16px;
}

.diff-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  color: var(--ink);
  font-family: inherit;
  padding: 14px 10px;
  cursor: pointer;
  box-shadow: var(--card-shadow);
  transition: all 0.2s;
}

.diff-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(38, 169, 244, 0.2);
}

.diff-card.chosen {
  border-color: rgba(255, 79, 154, 0.6);
  box-shadow: 0 12px 28px rgba(255, 79, 154, 0.28);
  transform: translateY(-3px);
}

.diff-name {
  color: var(--ink);
  font-size: 1em;
  font-weight: 900;
  letter-spacing: 0.24em;
  text-indent: 0.24em;
  text-align: center;
}

.diff-card.chosen .diff-name {
  color: var(--pink);
}

.diff-desc {
  font-size: 0.74em;
  color: var(--ink-soft);
  line-height: 1.6;
  min-height: 3.2em;
}

.diff-meta {
  font-family: var(--font-mono);
  font-size: 0.7em;
  color: var(--blue);
  text-align: center;
}

/* ═══ 档案卡 ═══ */

.dossier-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.dossier-name {
  color: var(--ink);
  font-size: 1.05em;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.dossier-role {
  font-family: var(--font-mono);
  color: var(--ink-faint);
  font-size: 0.72em;
}

.dossier-stage {
  margin-left: auto;
  color: #fff;
  background: linear-gradient(180deg, #ff6cab, #ff4f9a);
  border-radius: 999px;
  padding: 2px 12px;
  font-size: 0.76em;
  font-weight: 700;
  box-shadow: 0 3px 10px rgba(255, 79, 154, 0.35);
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

.trend {
  width: 100%;
  height: 44px;
  margin-top: 2px;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  background: #fff;
}

.trend polyline {
  fill: none;
  stroke-width: 1.4;
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
}

.trend-fav {
  stroke: var(--pink);
}

.trend-sin {
  stroke: var(--red);
}

.trend-marr {
  stroke: var(--green);
}

.trend-legend {
  display: flex;
  gap: 10px;
  font-size: 0.68em;
  margin: 2px 0 6px;
}

.tl-fav {
  color: var(--pink);
}

.tl-sin {
  color: var(--red);
}

.tl-marr {
  color: var(--green);
}

.tl-hint {
  color: var(--ink-faint);
}

.dsec {
  border-top: 1px dashed var(--line-soft);
  padding: 7px 0 2px;
  margin-top: 5px;
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
  border-left: 3px solid var(--pink-soft);
  border-radius: 2px;
  padding-left: 6px;
}

.a-cell small {
  color: var(--ink-faint);
}

.a-cell b {
  color: var(--ink);
  font-weight: normal;
}

.crack-hint {
  color: var(--pink);
  font-weight: 600;
}

/* ═══ 背包 / 商店 ═══ */

.ware {
  display: flex;
  flex-direction: column;
  border-top: 1px dashed var(--line-soft);
  padding: 7px 0;
  font-size: 0.82em;
}

.ware:first-child {
  border-top: none;
}

.ware b {
  color: var(--ink);
  font-weight: 700;
}

.ware-desc {
  color: var(--ink-soft);
  font-size: 0.92em;
  line-height: 1.55;
}

.ware-price {
  font-family: var(--font-mono);
  color: var(--blue);
  font-style: normal;
  margin-left: 8px;
  font-size: 0.85em;
}

.ware-acts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.shop-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 6px;
  margin-bottom: 4px;
}

.shop-tabs .btn.on {
  color: #fff;
  background: var(--blue);
  border-color: var(--blue);
  box-shadow: 0 4px 12px rgba(38, 169, 244, 0.3);
}

.shop-cash {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.78em;
  color: var(--blue);
}

/* ═══ 偷窥余像 / 读信 ═══ */

.peep-card {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid rgba(140, 115, 255, 0.4);
  border-radius: 14px;
  padding: 9px 11px;
  margin-top: 6px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6px 18px rgba(140, 115, 255, 0.18);
  animation: card-pop-in 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.peep-card .hint {
  margin: 0 0 2px;
  color: var(--violet);
  font-weight: 700;
}

.letter {
  background: #fff9e2;
  border: 1.5px dashed rgba(255, 202, 53, 0.9);
  border-radius: 12px;
  padding: 12px 14px;
  margin: 4px 0 10px;
}

.narr.no-indent {
  text-indent: 0;
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
  font-family: var(--font-prose);
  color: var(--ink);
  font-size: 0.95em;
  text-align: center;
  max-width: 34em;
  line-height: 1.9;
}

.chronicle {
  padding-right: 4px;
}

/* ═══ 主题切换按钮(常驻右上角) ═══ */

.theme-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 20;
}

/* ═══ 夜间模式:scoped 里写死的浅色逐条覆盖(token 部分已在 global.css 换) ═══
   地图 .galmap 子树刻意不覆盖——立面插画自带昼夜(天色+窗灯) ═══ */

:global(html.rq-dark) .meta-row > span:not(.meta-btns) {
  background: #2c2e40;
}

:global(html.rq-dark) .meta-row,
:global(html.rq-dark) .story,
:global(html.rq-dark) .diff-card {
  border-color: rgba(255, 255, 255, 0.08);
}

:global(html.rq-dark) .sheet {
  background: rgba(38, 40, 56, 0.97);
  border-color: rgba(255, 255, 255, 0.1);
}

:global(html.rq-dark) .sheet-close,
:global(html.rq-dark) .act-btn,
:global(html.rq-dark) .trend,
:global(html.rq-dark) .edit-area {
  background: #2c2e40;
  color: var(--ink);
}

:global(html.rq-dark) .toast {
  background: rgba(38, 40, 56, 0.97);
}

:global(html.rq-dark) .room-card,
:global(html.rq-dark) .peep-card {
  background: rgba(34, 36, 50, 0.94);
  border-color: rgba(255, 255, 255, 0.1);
}

:global(html.rq-dark) .todo-bar,
:global(html.rq-dark) .clue-card,
:global(html.rq-dark) .letter {
  background: rgba(255, 202, 53, 0.1);
}

:global(html.rq-dark) .err {
  background: #3a2220;
  color: #f5c3bb;
}

:global(html.rq-dark) .avatar-glyph {
  background: linear-gradient(160deg, rgba(255, 79, 154, 0.3), rgba(255, 79, 154, 0.16));
  border-color: #3a3d52;
  color: #ff9ec4;
}

:global(html.rq-dark) .avatar.focus .avatar-glyph {
  border-color: var(--pink);
}
</style>
