<template>
  <div class="apt" :class="{ 'keyboard-open': 键盘打开 }">
    <div class="page">
      <!-- 错误护栏:任何运行时异常显示在此,不再整屏空白(点击即散,不常驻) -->
      <div v-if="错误信息" class="err" title="点击关闭" @click="错误信息 = ''">⚠︎ 界面异常:{{ 错误信息 }}(点击关闭)</div>

      <!-- 酒馆外层的数据库公告在移动端真全屏不可见；在游戏层镜像真实运行阶段。 -->
      <transition name="loc-flash">
        <div v-if="移动端 && 数据库运行文案" class="db-running-banner" role="status" aria-live="polite">
          <span class="db-running-pulse" />
          <span
            ><b>{{ 数据库运行文案 }}</b
            ><small>长期记忆正在计算，请稍候，不要重复点击</small></span
          >
        </div>
      </transition>

      <!-- 首次移动端建议：明确允许窗口模式；任一选择都会记住，不在退出全屏后反复遮挡。 -->
      <div
        v-if="显示移动端全屏引导"
        class="mobile-fullscreen-cta"
        role="dialog"
        aria-labelledby="mobile-fullscreen-title"
      >
        <Ic n="expand" />
        <span class="mobile-fullscreen-copy"
          ><b id="mobile-fullscreen-title">建议全屏打开游戏</b><small>全屏并非强制，也可以继续使用窗口模式</small></span
        >
        <div class="mobile-fullscreen-actions">
          <button type="button" class="mobile-fullscreen-primary" @click="打开移动端全屏">进入全屏</button>
          <button type="button" class="mobile-fullscreen-window" @click="继续窗口模式">继续窗口模式</button>
        </div>
      </div>

      <!-- 转场横幅(gal 式地点闪卡:走动的即时反馈) -->
      <transition name="loc-flash">
        <div v-if="转场" :key="转场" class="loc-banner">
          <div class="ui-kicker">MOVE</div>
          <b>{{ 转场 }}</b>
        </div>
      </transition>

      <!-- 右上角:手机只留全屏+设置；桌面仍保留主题快捷钮 -->
      <span class="corner-btns" :class="{ 'above-setup': 首次说明开 }">
        <button v-if="!移动端" class="btn mini icon" :title="暗色 ? '切回日间模式' : '切换夜间模式'" @click="切换主题">
          <Ic :n="暗色 ? 'sun' : 'moon'" />
        </button>
        <button class="btn mini icon" :title="全屏中 ? '退出全屏' : '沉浸全屏'" @click="切换全屏">
          <Ic n="expand" />
        </button>
        <button class="btn mini icon" title="设置" @click="设置开 = true">
          <Ic n="ops" />
        </button>
      </span>

      <SettingsPopup
        :ready="就绪"
        :prologue-complete="!!data?.系统?._序章完成"
        :sending="发送中"
        :restart-armed="重开确认"
        @restart="点重开"
      />

      <FirstRunSetup
        v-model:open="首次说明开"
        :auto-open="就绪 && !data.系统._序章完成"
        :script-alive="脚本存活"
        @toast="转发首次准备提示"
      />

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
          <p class="hint">父亲收回了这栋楼。你可以在往事里回到从前的某一页,重新来过。</p>
          <button v-if="时间撤销可用" class="btn" :disabled="发送中" @click="发起时间撤销">撤销刚才的时间推进</button>
          <button class="btn" @click="打开史册">翻开往事</button>
        </div>
      </template>

      <!-- ═══════════ 序章标题屏(gal タイトル:全屏立面KV + 纹章logo + 竖排木牌菜单;A4 已外移 components/序章标题屏.vue) ═══════════ -->
      <template v-else-if="!data.系统._序章完成">
        <PrologueTitleScreen
          :sending="发送中"
          :script-alive="脚本存活"
          @start="开始考验"
          @open-setup="打开首次说明"
          @open-settings="设置开 = true"
        />
      </template>

      <!-- ═══════════ 日常主界面 ═══════════ -->
      <template v-else>
        <div class="ui-kicker center">WUTONGLI APARTMENT / MANAGER MODE</div>
        <header class="masthead">人 妻 公 寓</header>

        <!-- HUD:数据专属框架(时间块 + 三轴瓦片,与功能按钮分离;按钮在底部 dock) -->
        <div class="hud">
          <div class="hud-time">
            <div class="ui-kicker">第 {{ 天数 }} 天 · 第 {{ 周数 }} 周</div>
            <b><Ic n="clock" />{{ 星期 }} · {{ 时段 }}</b>
          </div>
          <div class="hud-stats">
            <div class="hstat" title="现金">
              <small>现金</small>
              <b>¥{{ data.现金 }}</b>
            </div>
            <button
              type="button"
              class="battery resource energy"
              :class="{ warn: data.玩家资源.精力.当前值 * 4 <= 精力上限, muted: 性爱进行中 }"
              title="精力：普通现场互动楼的行动权限；点击查看成长详情"
              @click="显示资源详情 = '精力'"
            >
              <small>精力 LV{{ 精力等级 }}</small>
              <span class="cells">
                <i v-for="n in 10" :key="n" :class="{ on: n <= 精力格数 }" />
              </span>
              <b>{{ data.玩家资源.精力.当前值 }}/{{ 精力上限 }}</b>
            </button>
            <button
              type="button"
              class="battery resource stamina"
              :class="{ warn: data.玩家资源.体力.当前值 * 4 <= 体力上限, active: 性爱进行中 }"
              title="体力：亲密场景续航；点击查看成长详情"
              @click="显示资源详情 = '体力'"
            >
              <small>体力 LV{{ 体力等级 }}</small>
              <span class="cells">
                <i v-for="n in 10" :key="n" :class="{ on: n <= 体力格数 }" />
              </span>
              <b>{{ data.玩家资源.体力.当前值 }}/{{ 体力上限 }}</b>
            </button>
            <!-- 胜任/风闻=电池条(格子随值增减,低胜任/高风闻亮红报警) -->
            <button
              type="button"
              class="battery competence"
              :title="`胜任度：父亲对你管楼的评价；当前红线 ${胜任红线}，状态 ${胜任状态}`"
              :aria-label="`查看胜任详情，当前 ${Math.round(data.胜任度)}，${胜任状态}`"
              :class="{ warn: 正式通牒中 || data.胜任度 - 胜任红线 <= 9 }"
              @click="显示胜任详情 = true"
            >
              <small>胜任 · {{ 胜任状态 }}</small>
              <span class="cells">
                <i v-for="n in 10" :key="n" :class="{ on: n <= Math.round(data.胜任度 / 10) }" />
              </span>
              <b>{{ Math.round(data.胜任度) }}</b>
            </button>
            <button
              type="button"
              class="battery risk rumor"
              :class="[`rumor-level-${风闻档位}`, { warn: 风闻档位 >= 3 }]"
              :title="`风闻 ${Math.round(data.风闻)}，当前档位：${风闻状态}。点击查看来源与平息提示`"
              :aria-label="`查看风闻详情，当前 ${Math.round(data.风闻)}，${风闻状态}`"
              @click="显示风闻详情 = true"
            >
              <small>风闻 · {{ 风闻状态 }}</small>
              <span class="cells rumor-cells" aria-hidden="true">
                <i v-for="n in 4" :key="n" :class="{ on: n <= 风闻档位 }" />
              </span>
              <b>{{ Math.round(data.风闻) }}</b>
            </button>
          </div>
          <div
            v-if="欠租账.length"
            class="rent-ledger"
            :title="欠租账.map(项 => `${项.门牌} ${项.妻名}:${项.笔数}笔`).join('；')"
          >
            <Ic n="book" />
            <span
              ><small>待收租</small><b>{{ 欠租账.length }}户 / {{ 欠租总笔数 }}笔</b></span
            >
            <i v-for="项 in 欠租账" :key="项.门牌" :title="`${项.门牌} ${项.妻名}`">{{ 项.门牌 }}</i>
          </div>
        </div>

        <div v-if="显示资源详情" class="mask resource-detail-mask" @click.self="显示资源详情 = null">
          <section class="resource-detail-card" :class="资源详情.种类 === '精力' ? 'energy' : 'stamina'">
            <button class="sheet-close" type="button" @click="显示资源详情 = null">✕</button>
            <div class="ui-kicker">PLAYER CONDITION / {{ 资源详情.种类 }}</div>
            <h3>{{ 资源详情.种类 }} LV{{ 资源详情.等级 }}</h3>
            <div class="resource-detail-value">
              <b>{{ 资源详情.资源.当前值 }}</b
              ><span>/ {{ 资源详情.上限 }}</span>
            </div>
            <p>
              训练经验 {{ 资源详情.当前
              }}<template v-if="资源详情.下级门槛 !== null"> / {{ 资源详情.下级门槛 }}</template
              ><template v-else> · 已达到最高等级</template>
            </p>
            <p>永久上限加成 +{{ 资源详情.资源.永久上限加成 }}</p>
            <small v-if="资源详情.种类 === '精力'">晨跑每天最多取得 1 点训练经验；普通现场互动成功后消耗 1 点。</small>
            <small v-else>健身与当天首次圆满亲密场景共享每日训练收益；亲密场景每个成功楼消耗 1 点。</small>
            <em>小憩和补给无法回满；睡到次日早晨才会完全恢复。</em>
          </section>
        </div>

        <div v-if="显示胜任详情" class="mask rumor-detail-mask" @click.self="显示胜任详情 = false">
          <section
            class="rumor-detail-card competence-detail-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="competence-title"
          >
            <button class="sheet-close" type="button" aria-label="关闭胜任详情" @click="显示胜任详情 = false">✕</button>
            <div class="ui-kicker">MANAGEMENT REVIEW / 胜任账</div>
            <header class="rumor-detail-head">
              <span>
                <small>{{ data.系统._难度 }}难度 · 红线 {{ 胜任红线 }}</small>
                <h3 id="competence-title">{{ 胜任状态 }}</h3>
              </span>
              <b>{{ Math.round(data.胜任度) }}</b>
            </header>
            <p class="rumor-summary">
              {{ 正式通牒中 ? `最后通牒仍在生效，必须在下次考核前恢复到 ${胜任红线 + 1} 以上。` : 胜任状态说明 }}
            </p>

            <div class="rumor-alerts">
              <p :class="{ hot: 正式通牒中 }">
                <b>{{ 正式通牒中 ? '最后通牒' : '考核状态' }}</b>
                <span>{{ 正式通牒中 ? `第 ${data.系统._通牒期} 期发出` : '当前没有正式通牒' }}</span>
              </p>
              <p>
                <b>下一次考核</b><span>{{ 下一次考核提示 }}</span>
              </p>
            </div>

            <section class="rumor-events competence-tasks">
              <h4>本期待处理</h4>
              <div v-if="胜任待办.length" class="rumor-event-list">
                <article v-for="任务 in 胜任待办" :key="任务.id">
                  <header>
                    <b>{{ 任务.地点 }} · {{ 任务.模板 }}</b
                    ><em>{{ 任务.级别 }}</em>
                  </header>
                  <small>{{
                    绝对时段 > 任务.截止时段
                      ? `已逾期 ${绝对时段 - 任务.截止时段} 时段，可补办`
                      : `截止时段 ${任务.截止时段}`
                  }}</small>
                </article>
              </div>
              <p v-else class="rumor-empty">本期没有待处理楼务。</p>
            </section>

            <section class="rumor-events competence-tasks">
              <h4>本期已完成</h4>
              <div v-if="胜任已完成.length" class="rumor-event-list">
                <article v-for="(事项, index) in 胜任已完成" :key="`${事项.任务}:${事项.地点}:${index}`">
                  <header>
                    <b>{{ 事项.地点 }} · {{ 事项.任务 }}</b
                    ><em>{{ 事项.按期 ? '按期' : '补办' }}</em>
                  </header>
                  <small>{{ 事项.方式 }}</small>
                </article>
              </div>
              <p v-else class="rumor-empty">本期还没有完成记录。</p>
            </section>

            <section class="rumor-events competence-tasks">
              <h4>最近记分</h4>
              <div v-if="胜任最近记分.length" class="rumor-event-list">
                <article v-for="条目 in 胜任最近记分" :key="条目.id">
                  <header>
                    <b>{{ 条目.原因 || 条目.类别 }}</b>
                    <em :class="{ down: 条目.变动 < 0 }">{{ 条目.变动 > 0 ? '+' : '' }}{{ 条目.变动 }}</em>
                  </header>
                  <small>第 {{ 条目.考核期 }} 期 · {{ 条目.类别 }}</small>
                </article>
              </div>
              <p v-else class="rumor-empty">还没有可追溯的胜任变化。</p>
            </section>

            <div class="rumor-guidance">
              <p>
                <b>本期正向</b><span>{{ data.系统._管理考核.本期正向 }} / 6</span>
              </p>
              <p :class="{ hot: 正式通牒中 }">
                <b>真实失败主因</b><span>{{ data.系统._管理考核.通牒原因 || '尚未形成' }}</span>
              </p>
            </div>
          </section>
        </div>

        <div v-if="显示风闻详情" class="mask rumor-detail-mask" @click.self="显示风闻详情 = false">
          <section
            class="rumor-detail-card"
            :class="`rumor-level-${风闻档位}`"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rumor-detail-title"
          >
            <button class="sheet-close" type="button" aria-label="关闭风闻详情" @click="显示风闻详情 = false">✕</button>
            <div class="ui-kicker">BUILDING TALK / 风闻账</div>
            <header class="rumor-detail-head">
              <span>
                <small>当前档位</small>
                <h3 id="rumor-detail-title">{{ 风闻状态 }}</h3>
              </span>
              <b>{{ Math.round(data.风闻) }}</b>
            </header>
            <p class="rumor-summary">{{ 风闻状态说明 }}</p>
            <p class="rumor-summary"><b>风闻趋势：</b>{{ 风闻趋势 }}</p>

            <div class="rumor-thresholds" aria-label="风闻档位阈值">
              <span v-for="项 in 风闻阈值" :key="项.值" :class="{ active: 风闻档位 >= 项.档 }">
                <b>{{ 项.值 }}</b
                ><small>{{ 项.名 }}</small>
              </span>
            </div>

            <div class="rumor-alerts">
              <p :class="{ hot: 风闻账.危机活跃 }">
                <b>{{ 风闻账.危机活跃 ? '危机活跃' : '当前无危机' }}</b>
                <span>{{ 风闻危机提示 }}</span>
              </p>
              <p :class="{ hot: 当前投诉存在 }">
                <b>{{ 当前投诉存在 ? '投诉处理中' : '当前无投诉' }}</b>
                <span>{{ 当前投诉提示 }}</span>
              </p>
            </div>

            <section class="rumor-events">
              <h4>最近来源</h4>
              <div v-if="风闻最近事件.length" class="rumor-event-list">
                <article v-for="事件 in 风闻最近事件" :key="事件.id">
                  <header>
                    <b>{{ 风闻事件安全摘要(事件) }}</b>
                    <em :class="{ down: 事件.增量 < 0 }">{{ 事件.增量 > 0 ? '+' : '' }}{{ 事件.增量 }}</em>
                  </header>
                  <small>{{ 风闻事件位置(事件) }}</small>
                  <p v-if="事件.迹象">{{ 事件.迹象 }}</p>
                  <footer>
                    <span>{{ 事件.状态 || '已记录' }}</span>
                    <span v-if="事件.父亲责任 && 事件.父亲责任 !== '无'">{{ 风闻父亲责任标签(事件) }}</span>
                  </footer>
                </article>
              </div>
              <p v-else class="rumor-empty">最近没有可追溯的风闻来源。</p>
            </section>

            <div class="rumor-guidance">
              <p>
                <b>自然平息</b><span>{{ 风闻自然平息提示 }}</span>
              </p>
              <p>
                <b>住户聚餐</b><span>{{ 风闻聚餐提示 }}</span>
              </p>
            </div>
          </section>
        </div>

        <!-- 头像行:已入住户(焦点亮/在场半亮/离场暗);点开档案 -->
        <div class="avatar-row">
          <div
            v-for="项 in 头像列表"
            :key="项.门牌"
            class="avatar"
            :class="[项.态, 项.冷落态, 项.怀孕态]"
            :title="`${项.妻名}(${项.门牌})${项.冷落说明 ? ` · ${项.冷落说明}` : ''}`"
            @click="!静音会议正式中 && (选中门牌 = 项.门牌)"
          >
            <img
              v-if="!头像失效[项.妻名]"
              class="avatar-glyph img"
              :src="头像图(项.妻名)"
              :alt="项.冷落说明 ? `${项.妻名}，${项.冷落说明}` : 项.妻名"
              @error="头像失效[项.妻名] = true"
            />
            <span
              v-else
              class="avatar-glyph"
              role="img"
              :aria-label="项.冷落说明 ? `${项.妻名}，${项.冷落说明}` : 项.妻名"
              >{{ 项.妻名[0] }}</span
            >
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

        <!-- 正文舞台:背景四层在 wrap 上,立绘钉右下,正文滚动层浮最上(垫板压立绘,gal 层次) -->
        <div
          class="story-wrap"
          :class="[
            `portrait-count-${Math.min(立绘列表.length, 6)}`,
            {
              'portraits-many': 立绘列表.length >= 4,
              'story-glory': !!荣耀洞图,
              'story-adult-cg': 显示成人CG,
              'story-visual-only': 正文隐藏,
              'story-special-interaction': 录像带交互幕 || 静音会议交互幕,
              'story-mute-meeting': 静音会议显示组合图,
              'story-intimacy-open': 性爱进行中 && 亲密抽屉展开,
            },
          ]"
          :style="[场景色, 场景图样式]"
        >
          <!-- 隐藏正文(2026-07-19 用户点单,gal惯例):渐隐文字层欣赏立绘;只认这颗钮,再按恢复(误触不弹回) -->
          <button
            v-if="!录像带中 && !静音会议交互幕"
            class="story-hide-btn"
            :title="正文隐藏 ? '显示正文' : '隐藏正文,欣赏画面'"
            @click.stop="正文隐藏 = !正文隐藏"
          >
            <Ic :n="正文隐藏 ? 'eye' : 'eyeOff'" />
          </button>
          <MuteMeetingStage
            :formal="静音会议正式中"
            :interaction-open="静音会议交互幕"
            :phase-name="静音会议阶段短名"
            :shot-label="静音会议拍数文案"
            :topic="静音会议场景.议题"
            :visual-open="静音会议显示组合图"
            :visual-state="静音会议画面状态"
            :image-url="静音会议当前图地址"
            @image-load="静音会议图加载成功"
            @image-error="静音会议图加载失败"
          />
          <VideoTapeStage
            :open="录像带交互幕"
            :stage="录像带阶段"
            :local-result="录像带本地结果"
            :tap-count="录像带连点计数"
            :tap-target="录像带连点目标"
            :sending="发送中"
          />
          <MuteMeetingInteraction
            :id="静音会议互动id"
            :open="静音会议交互幕"
            :failure-count="静音会议互动失败次数"
            :title="静音会议互动标题"
            :copy="静音会议互动说明"
            :participants="静音会议参与妻"
            :b-target="静音会议B目标"
            :focus-wife="静音会议场景.重点妻"
            :lit-wives="静音会议连点点亮妻"
            :pending="静音会议互动待操作"
            :result="静音会议互动结果"
            :c-mode="静音会议C模式"
            :focus-wife-name="静音会议重点妻名"
            :holding="静音会议长按中"
            :tap-count="静音会议连点计数"
            :tap-target="静音会议连点目标"
            :waiting-retry="静音会议等待AI重试"
            :sending="发送中"
            :recovery-available="静音会议互动补偿可用"
            :avatar-failed="头像失效"
            :avatar-image="头像图"
            @b-target="选择静音会议B目标"
            @c-mode="选择静音会议C模式"
            @a-down="静音会议A按下"
            @a-up="静音会议A抬起"
            @b-down="静音会议B按下"
            @b-up="静音会议B抬起"
            @c-down="静音会议C按下"
            @c-up="静音会议C抬起"
            @pointer-cancel="静音会议指针取消"
            @retry="重试静音会议互动续拍"
            @recover="静音会议互动补偿通过"
            @avatar-error="头像失效[$event] = true"
          />
          <Transition name="fade">
            <div
              v-if="显示成人CG && !静音会议显示组合图"
              class="adult-cg-stage"
              :class="{ loading: 成人CG加载中 }"
              :style="{ '--adult-cg-img': `url(${当前成人CG地址})` }"
            >
              <img
                :key="`${当前成人CG?.id}:${当前成人CG请求epoch}`"
                :src="当前成人CG地址"
                :data-cg-id="当前成人CG?.id"
                :data-cg-epoch="当前成人CG请求epoch"
                alt=""
                draggable="false"
                @load="成人CG已加载"
                @error="成人CG加载失败"
              />
            </div>
          </Transition>
          <TransitionGroup v-if="立绘显示 && !显示成人CG && !静音会议显示组合图" name="fade">
            <span
              v-for="绘 in 立绘列表"
              :key="绘.src"
              class="portrait-slot"
              :class="{ 'portrait-slot-glory': 绘.src.includes('/立绘/荣耀洞_') }"
              :style="绘.style"
            >
              <img
                class="portrait"
                :class="{ 'portrait-glory': 绘.src.includes('/立绘/荣耀洞_') }"
                :src="绘.src"
                alt=""
                draggable="false"
                @error="立绘失效[绘.src] = true"
              />
            </span>
          </TransitionGroup>
          <!-- 正文卷轴:只演当前幕,且幕跟着房间走——人走了戏就收,回来戏还在(氛围色随位置)(A8a 迁入 components/正文卷轴.vue) -->
          <StoryScroll
            ref="正文卷轴"
            :veiled="正文隐藏 || 录像带交互幕 || 静音会议交互幕"
            :in-scene="在幕中"
            :sending="发送中"
            :current-room="当前房间"
            :room-people="当前房间 ? 房内的人(当前房间) : []"
            :arrival-title="到场标题"
            :arrival-description="到场描写"
            :arrival-hint="到场提示"
            :entries="当前幕"
            :editing-floor="编辑中楼"
            :editing-text="编辑文本"
            :stream-segments="流式段"
            :runtime-stage="运行阶段"
            :wait-seconds="生成等待秒"
            :retry-action="待重试行动"
            :avatar-failed="头像失效"
            :avatar-name="头像名"
            :avatar-image="头像图"
            @update-editing-text="编辑文本 = $event"
            @cancel-edit="编辑中楼 = null"
            @save-edit="存编辑"
            @open-floor-prompt="打开楼层提示词"
            @open-event-prompt="打开事件提示词"
            @edit-entry="开编辑"
            @cancel-turn="取消回合"
            @abandon-and-retry="放弃并重试"
            @avatar-error="头像失效[$event] = true"
          />
          <div
            v-if="性爱进行中"
            class="intimacy-stage-dock"
            :class="{ open: 亲密抽屉展开, critical: data.玩家资源.体力.当前值 <= 1 }"
            @click.self="亲密抽屉展开 = false"
          >
            <Transition name="intimacy-sheet">
              <section v-if="亲密抽屉展开" class="intimacy-panel" role="region" aria-label="亲密场景详细操作">
                <header>
                  <span><small>PRIVATE SCENE</small><b>参与者与收尾</b></span>
                  <button
                    type="button"
                    class="intimacy-collapse"
                    aria-label="收起亲密场景详情"
                    @click="亲密抽屉展开 = false"
                  >
                    收起
                  </button>
                </header>
                <div class="intimacy-people">
                  <article
                    v-for="项 in 性爱参与者列表"
                    :key="项.门牌"
                    :class="{
                      satisfied: 项.满意度 >= 项.满意目标,
                      focused: 项.门牌 === 性爱主焦点?.门牌,
                      disabled: 发送中 || 性爱待失控收尾,
                    }"
                    :role="发送中 || 性爱待失控收尾 ? undefined : 'button'"
                    :tabindex="发送中 || 性爱待失控收尾 ? undefined : 0"
                    :aria-label="`将${项.妻名}设为主焦点`"
                    @click="切换亲密主焦点(项.门牌)"
                    @keydown.enter.prevent="切换亲密主焦点(项.门牌)"
                    @keydown.space.prevent="切换亲密主焦点(项.门牌)"
                  >
                    <span class="intimacy-avatar">
                      <img
                        v-if="!头像失效[项.妻名]"
                        :src="头像图(项.妻名)"
                        :alt="项.妻名"
                        @error="头像失效[项.妻名] = true"
                      />
                      <b v-else>{{ 项.妻名[0] }}</b>
                    </span>
                    <span class="intimacy-satisfaction">
                      <span class="intimacy-person-title">
                        <b>{{ 项.妻名 }}</b>
                        <em v-if="项.门牌 === 性爱主焦点?.门牌">主焦点</em>
                        <em v-else-if="项.满意度 >= 项.满意目标" class="complete">已完成</em>
                      </span>
                      <span class="petals" :aria-label="`满意度 ${项.满意度}/${项.满意目标}`">
                        <i v-for="n in 项.满意目标" :key="n" :class="{ on: n <= 项.满意度 }">◆</i>
                      </span>
                      <small
                        >{{ 项.满意度 }}/{{ 项.满意目标 }} ·
                        {{ 项.满意度 >= 项.满意目标 ? '已经满足' : '等待推进' }}</small
                      >
                      <small v-if="项.偏好命中.length" class="intimacy-preference hit"
                        >偏好 +{{ 项.偏好命中.length }} · {{ 项.偏好命中.join(' / ') }}</small
                      >
                      <small v-else class="intimacy-preference">偏好尚未命中</small>
                    </span>
                  </article>
                </div>
                <div class="intimacy-meta">
                  <span
                    >主焦点 <b>{{ 性爱主焦点?.妻名 || '未指定' }}</b></span
                  >
                  <span
                    >行为 <b>{{ 性爱场景.当前行为 }}</b></span
                  >
                  <span
                    >部位 <b>{{ 性爱场景.当前接触部位 }}</b></span
                  >
                  <span
                    >保护 <b>{{ 性爱场景.保护状态 }}</b></span
                  >
                </div>
                <p v-if="性爱待失控收尾" class="intimacy-warning">
                  体力已经耗尽。本次会按当前行为在“{{ 性爱场景.待收尾位置 || 默认失控位置(性爱场景) }}”失控收尾。
                </p>
                <p v-else-if="data.玩家资源.体力.当前值 === 1" class="intimacy-warning">
                  继续一次将耗尽体力；若不主动收尾，将按当前行为失控结束。
                </p>
                <div class="intimacy-finishes">
                  <button
                    v-if="性爱待失控收尾"
                    class="finish-tile danger"
                    type="button"
                    :disabled="发送中"
                    @click="确认失控收尾"
                  >
                    演出失控收尾
                  </button>
                  <template v-else>
                    <small class="intimacy-finish-label">射精部位</small>
                    <button
                      v-for="位置 in 收尾选项"
                      :key="位置"
                      class="finish-tile"
                      :class="{ selected: 待确认收尾位置 === 位置 }"
                      type="button"
                      :disabled="发送中"
                      @click="选择亲密收尾(位置)"
                    >
                      {{ 位置 }}
                    </button>
                    <button
                      v-if="待确认收尾位置"
                      class="finish-tile confirm"
                      type="button"
                      :disabled="发送中"
                      @click="确认亲密收尾"
                    >
                      确认 · {{ 待确认收尾位置 }}
                    </button>
                  </template>
                </div>
              </section>
            </Transition>
            <button
              type="button"
              class="intimacy-summary"
              :aria-expanded="亲密抽屉展开"
              :disabled="发送中"
              @click="亲密抽屉展开 = !亲密抽屉展开"
            >
              <span class="intimacy-summary-copy">
                <small>亲密场景</small>
                <b>{{ 性爱主焦点?.妻名 || '选择主焦点' }}</b>
              </span>
              <span class="intimacy-summary-progress">
                <b>{{ 性爱已完成人数 }}/{{ 性爱参与者列表.length }}</b>
                <small>已完成</small>
              </span>
              <span class="intimacy-summary-stamina">体力 {{ data.玩家资源.体力.当前值 }}/{{ 体力上限 }}</span>
              <span class="intimacy-summary-action">{{ 亲密抽屉展开 ? '收起' : '管理' }}</span>
            </button>
          </div>
        </div>

        <!-- 场景条(在场者=头像徽章,一眼认人) -->
        <div class="scene-bar">
          <span class="scene-name">{{ 当前房间名 || '楼道里' }}</span>
          <span v-if="当前房间 && 房内的人(当前房间).length" class="scene-occ">
            <span v-for="名 in 房内的人(当前房间)" :key="名" class="who-chip mini" :title="名">
              <img
                v-if="!头像失效[头像名(名)]"
                :src="头像图(头像名(名))"
                :alt="名"
                @error="头像失效[头像名(名)] = true"
              />
              <b v-else>{{ 名[0] }}</b>
            </span>
          </span>
          <span v-else class="scene-occ">{{ 当前房间 ? '此刻没有别人' : '该去敲谁的门?' }}</span>
          <button
            v-if="当前房间 && !录像带中"
            class="btn icon"
            :disabled="发送中 || 静音会议正式中"
            :title="静音会议正式中 ? '会议进行中，无法离开管理员室' : '离开当前房间'"
            @click="离开房间"
          >
            <Ic n="exit" />离开
          </button>
        </div>
        <MuteMeetingLockNote :open="静音会议正式中" />

        <transition name="scene-result">
          <section v-if="显示性爱结果卡 && !性爱进行中" class="scene-result-card" role="status" aria-live="polite">
            <header>
              <span><small>SCENE RESULT</small><b>亲密结果</b></span>
              <em>{{ 上次性爱结果.结束方式 || '场景结束' }}</em>
            </header>
            <div class="scene-result-meta">
              <span
                >有效楼数 <b>{{ 上次性爱结果.有效楼数 }}</b></span
              >
              <span
                >收尾 <b>{{ 上次性爱结果.最终位置 || '未记录' }}</b></span
              >
              <span
                >保护 <b>{{ 上次性爱结果.保护状态 || '未记录' }}</b></span
              >
            </div>
            <div class="scene-result-people">
              <article v-for="项 in 性爱结果参与者列表" :key="项.门牌" :class="`duration-${项.时长评价}`">
                <span class="intimacy-avatar">
                  <img
                    v-if="!头像失效[项.妻名]"
                    :src="头像图(项.妻名)"
                    :alt="项.妻名"
                    @error="头像失效[项.妻名] = true"
                  />
                  <b v-else>{{ 项.妻名[0] }}</b>
                </span>
                <span class="scene-result-copy">
                  <span
                    ><b>{{ 项.妻名 }}</b
                    ><strong>{{ 项.时长评价 }}</strong></span
                  >
                  <small>满意度 {{ 项.满意度 }}/{{ 项.满意目标 }}</small>
                  <p>{{ 项.结局态度 }}</p>
                  <small class="scene-result-preference"
                    >偏好：{{ 项.偏好命中.length ? 项.偏好命中.join(' / ') : '本场未命中' }}</small
                  >
                </span>
              </article>
            </div>
          </section>
        </transition>

        <!-- 房内动作(输入门控收紧后的补位:站在垃圾房/空户里,翻袋撬门不用开地图)。
             手机端由 房内操作抽屉.vue 收成上滑抽屉,桌面保持原两列;垃圾选择弹窗留在抽屉外。 -->
        <RoomActionsDrawer
          :mobile="移动端"
          :room-id="当前房间"
          :action-count="可见房内动作数"
          :suppressed="房内操作抑制"
          :actions="普通房间动作"
          :garbage-visible="垃圾入口可见"
          :video-tape-active="录像带中"
          @open-garbage="垃圾选择开 = true"
        />
        <transition name="card-pop">
          <div v-if="垃圾选择开" class="garbage-mask" @click.self="垃圾选择开 = false">
            <section class="garbage-modal" aria-modal="true" aria-label="选择垃圾袋">
              <button class="sheet-close" @click="垃圾选择开 = false">✕</button>
              <div class="ui-kicker">TRASH ROOM / BAG INDEX</div>
              <h3>翻谁家的垃圾</h3>
              <p>认准门牌。每只袋子只通向对应住户的线索。</p>
              <div class="garbage-grid">
                <button v-for="袋 in 垃圾袋列表" :key="袋.门牌" class="garbage-tile" @click="选垃圾袋(袋.门牌)">
                  <img
                    v-if="!头像失效[袋.妻名]"
                    :src="头像图(袋.妻名)"
                    :alt="袋.妻名"
                    @error="头像失效[袋.妻名] = true"
                  />
                  <span v-else class="garbage-fallback">{{ 袋.妻名[0] }}</span>
                  <b>{{ 袋.门牌 }}</b>
                  <em>{{ 袋.妻名 }}家</em>
                </button>
              </div>
            </section>
          </div>
        </transition>
        <!-- 偷窥余像:"你注意到了什么?"(摄像头渠道,选对收进线索板;选项走 gal 纸条样式与行动选项同款) -->
        <div
          v-if="!静音会议正式中 && 偷窥待选 && !发送中"
          class="peep-card"
          :style="{ '--opt-img': `url(${素材基址}/界面/选项条.webp)` }"
        >
          <p class="hint">画面看完了。你注意到了什么?</p>
          <button v-for="(项, i) in 偷窥待选.选项" :key="i" class="option-chip gal" @click="选细节(i)">
            {{ 项 }}
          </button>
        </div>

        <!-- 行动选项(AI 每轮给 4 条,点了直接发送;gal 式居中选择条,纸条底=AI 水彩件) -->
        <ActionOptions
          :open="显示选项 && !录像带中 && !静音会议交互幕 && !静音会议待散会选择 && !静音会议自由待选择"
          :options="行动选项"
          @select="点选项"
        />

        <VideoTapeControls
          :open="录像带交互幕"
          :sending="发送中"
          :stage="录像带阶段"
          :tap-count="录像带连点计数"
          :tap-target="录像带连点目标"
          :recovery-available="录像带补偿可用"
          @open102="打开102录像"
          @tap202="连续点击202录像"
          @recover="自动重连202"
        />

        <MuteMeetingAfter
          :waiting-dismiss="静音会议待散会选择"
          :free-waiting="静音会议自由待选择"
          :finish-retry="静音会议收尾待重试"
          :sending="发送中"
          :participants="静音会议参与妻"
          :selected="静音会议会后选择"
          :selection-legal="静音会议会后选择合法"
          :selection-hint="静音会议会后选择提示"
          :avatar-failed="头像失效"
          :avatar-image="头像图"
          @toggle-wife="切换静音会议会后妻"
          @continue="继续静音会议会后活动"
          @request-end="请求结束静音会议"
          @avatar-error="头像失效[$event] = true"
        />

        <!-- 游戏内输入(玩家不碰酒馆输入框) -->
        <RoundInput
          ref="回合输入"
          :open="可输入"
          :text="输入文本"
          :sending="发送中"
          :preface-writing="由头写入中"
          :can-submit="当前行动可提交"
          :send-label="发送按钮文案"
          :resource-allowed="当前资源门槛.可行动"
          :resource-hint="当前资源门槛.提示"
          :formal-meeting="静音会议正式中"
          :can-reroll="可重掷"
          :current-room="当前房间"
          :turn-room="回合房间"
          :failed-action="失败行动"
          :retry-action="待重试行动"
          :retrying="取消后自动重试"
          :video-active="录像带中"
          :period="时段"
          :current-period-label="当前时段显示"
          :next-period-label="下一时段显示"
          @update-text="输入文本 = $event"
          @submit="发送"
          @focus="输入聚焦"
          @blur="输入失焦"
          @undo="撤回"
          @reroll="重掷"
          @retry-failed="重试失败行动"
          @abandon-and-retry="放弃并重试"
          @advance-time="推进固定时段"
        />

        <!-- 功能区:gal 式底部 dock(大图标按钮,与数据 HUD 分离) -->
        <nav v-if="!录像带中" class="dock" :class="{ 'mute-meeting-dock': 静音会议正式中 }">
          <button
            class="dock-btn primary"
            :disabled="发送中 || 静音会议正式中"
            :title="静音会议正式中 ? '会议进行中，地图已锁定' : '打开地图'"
            @click="显示地图 = true"
          >
            <Ic n="map" /><span>地图</span>
          </button>
          <button
            class="dock-btn"
            :disabled="静音会议正式中"
            :title="静音会议正式中 ? '会议期间不能打开商店' : '网购商城,小时达,本时段内送到管理员室'"
            @click="显示商店 = true"
          >
            <Ic n="cart" /><span>商店</span>
          </button>
          <button
            class="dock-btn"
            :class="{
              ring: 手机来电,
              budge: 手机未读,
              'meeting-live': 静音会议手机已开放,
              'meeting-frozen': 静音会议正式中 && !静音会议手机可打开,
            }"
            :disabled="静音会议正式中 && !静音会议手机可打开"
            :title="静音会议手机标题"
            @click="开手机"
          >
            <Ic n="phone" /><span>手机</span>
          </button>
          <button class="dock-btn" :disabled="静音会议正式中 || !背包列表.length" @click="显示背包 = true">
            <Ic n="bag" /><span>背包</span>
          </button>
          <button
            v-if="监控列表.length"
            class="dock-btn"
            :disabled="静音会议正式中"
            title="你装下的眼睛"
            @click="显示监控 = true"
          >
            <Ic n="cctv" /><span>监控</span>
          </button>
          <button class="dock-btn" :disabled="静音会议正式中" title="完整往事与回档" @click="打开史册">
            <Ic n="book" /><span>往事</span>
          </button>
        </nav>
      </template>

      <!-- ═══════════ 地图(日式gal移动画面:天空随时段变色+公寓立面插画+点房弹行动卡;A6a 迁入 components/地图.vue) ═══════════ -->
      <MapPopup
        ref="地图弹窗"
        :open="显示地图 && 就绪"
        :data="data"
        :current-room="当前房间"
        :day="天数"
        :weekday="星期"
        :period="时段"
        :lite="省流"
        :sending="发送中"
        :avatar-failed="头像失效"
        :avatar-image="头像图"
        :avatar-name="头像名"
        :room-people="房内的人"
        :window-lit="窗灯"
        :management-badge="管理任务角标"
        :rent-owed="欠租中"
        :room-actions="房间动作"
        @close="关地图"
        @outing="从地图外出"
        @avatar-error="头像失效[$event] = true"
      />

      <!-- ═══════════ 档案卡(点头像弹出;裂缝未开=蜡封) ═══════════ -->
      <DossierPopup
        :door="选中门牌"
        :data="data"
        :ready="就绪"
        :current-room="当前房间"
        :absolute-period="绝对时段"
        :unlocked-cg="已解锁CG"
        :sending="发送中"
        :wife-nearby="选中门牌 ? 妻在玩家身边(选中门牌) : false"
        :evidence-slots="裂缝证物槽"
        :avatar-failed="头像失效"
        :portrait-failed="立绘失效"
        :item-failed="道具图失效"
        :avatar-image="头像图"
        :item-image="道具图"
        @close="选中门牌 = null"
        @avatar-error="头像失效[$event] = true"
        @portrait-error="立绘失效[$event] = true"
        @item-error="道具图失效[$event] = true"
        @open-cg="打开CG图库"
        @unload="卸载"
        @advance="晋阶"
        @ask-money="开口要钱"
      />

      <!-- ═══════════ 角色CG图库：已解锁显示缩略图，未解锁不泄露画面 ═══════════ -->
      <CgLibrary v-if="CG图库门牌" :key="CG图库门牌" :door="CG图库门牌" :unlocked="已解锁CG" @close="关闭CG图库" />

      <!-- ═══════════ 背包(道具可用:布设/送礼/读信) ═══════════ -->
      <InventoryPopup
        :open="显示背包"
        :items="背包列表"
        :sending="发送中"
        :item-failed="道具图失效"
        :item-image="道具图"
        @close="显示背包 = false"
        @image-error="道具图失效[$event] = true"
        @read="打开信"
        @deploy="布设"
        @use-resource="用资源道具"
        @use-operation="用运作"
        @play-tape="使用录像带"
        @prepare-meeting="打开静音会议筹备"
        @gift="送出"
        @load="装载"
      />

      <!-- ═══════════ 静音会议：背包票只进入筹备；确认开始前不消耗 ═══════════ -->
      <MuteMeetingPreparation
        :step="静音会议筹备步骤"
        :candidates="静音会议候选列表"
        :selected-wives="静音会议筹备妻"
        :topic="静音会议筹备议题"
        :topics="静音会议议题列表"
        :can-confirm="静音会议筹备可确认"
        :wife-names="静音会议筹备妻名"
        :husband-names="静音会议筹备夫名"
        :submitting="静音会议筹备提交中"
        :avatar-failed="头像失效"
        :avatar-image="头像图"
        @close="取消静音会议筹备"
        @toggle-wife="切换静音会议筹备妻"
        @select-topic="静音会议筹备议题 = $event"
        @confirm="查看静音会议确认"
        @back="静音会议筹备步骤 = '选择'"
        @submit="发送静音会议通知"
        @avatar-error="头像失效[$event] = true"
      />

      <!-- ═══════════ 商店(小时达网购;购买成功立即入包;礼物页签=裂缝解锁后现) ═══════════ -->
      <ShopPopup
        :open="显示商店"
        :cash="data.现金"
        :sending="发送中"
        :shelves="货架"
        :item-failed="道具图失效"
        :item-image="道具图"
        :item-visual="道具视觉信息"
        :lock-reasons="商品锁定原因"
        :purchase-label="商品购买文案"
        @close="显示商店 = false"
        @image-error="道具图失效[$event] = true"
        @buy="买"
      />

      <!-- ═══════════ 监控(装了摄像头的户;她独处时的画面) ═══════════ -->
      <MonitorPopup
        v-if="显示监控"
        :rooms="监控列表"
        :sending="发送中"
        :avatar-failed="头像失效"
        :background-url="背景图"
        :avatar-url="头像图"
        @close="显示监控 = false"
        @select="看监控"
        @avatar-error="头像失效[$event] = true"
      />

      <!-- ═══════════ 读信(揭晓时刻:碎片拼合的实物) ═══════════
           三条关闭路径全走 合上信(审计 C3):组件内三条路径统一 emit close,App 绑定 @close="合上信",
           揭晓从未漏登记——信留在背包、可晋阶 恒 false、由头门照锁,玩家没有任何提示知道要重读一遍 -->
      <LetterPopup v-if="读信门牌" :door="读信门牌" :evidence-slots="裂缝证物槽" @close="合上信" />

      <!-- ═══════════ 史册(完整往事 + 回档) ═══════════ -->
      <div v-if="显示史册" class="mask" @click.self="显示史册 = false">
        <div class="sheet">
          <button class="sheet-close" @click="显示史册 = false">✕</button>
          <div class="sheet-title">往 事</div>
          <p class="hint center">每段右下角的 ↺ 可以回到那一刻——点两次,之后的一切就没有发生过。</p>
          <button class="history-latest" title="跳到最新一段" @click="史册到最新">↓ 最新</button>
          <div ref="史册容器" class="sheet-body chronicle">
            <div
              v-for="(条, i) in 卷轴"
              :key="i"
              class="story-entry chronicle-entry"
              :class="{ player: 条.谁 === '玩家' }"
            >
              <span class="chronicle-mark"><Ic :n="条.谁 === '玩家' ? 'coin' : 'book'" /></span>
              <template v-if="条.楼 !== undefined && 条.楼 === 编辑中楼">
                <textarea v-model="编辑文本" class="edit-area" rows="8"></textarea>
                <div class="edit-acts">
                  <button class="btn" :disabled="!编辑文本.trim()" @click="存编辑">落笔</button>
                  <button class="btn" @click="编辑中楼 = null">作罢</button>
                </div>
              </template>
              <template v-else>
                <button
                  v-if="条.谁 === '叙事' && 条.楼 !== undefined && 条.楼 > 0 && !发送中"
                  class="entry-prompt"
                  title="查看这一回合的提示词"
                  @click="打开楼层提示词(条.楼)"
                >
                  提示词
                </button>
                <button
                  v-if="条.谁 === '叙事' && 条.事件提示词 && !发送中"
                  class="entry-prompt"
                  title="查看这一拍独立事件的提示词"
                  @click="打开事件提示词(条.事件提示词)"
                >
                  提示词
                </button>
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

      <!-- 独立事件不创建酒馆消息，因此用游戏自己的只读提示词查看器。 -->
      <EventPromptPopup v-if="事件提示词文本" :text="事件提示词文本" @close="事件提示词文本 = ''" />

      <!-- ═══════════ 提示 toast + 拾获卡(2026-07-17 用户反馈:翻出东西不能一闪而过) ═══════════
           带【】的重要提示(线索/收获类)升级成点击才收下的 gal 卡,普通提示仍走 toast -->
      <FeedbackOverlay :toast="提示文本" :loot="拾获卡" :sending="发送中" @dismiss-loot="拾获卡 = ''" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SchemaType } from '../../schema';
import {
  由头每日次数,
  由头工具表,
  户静态表,
  房间表,
  查房间,
  查性癖,
  查特殊场景,
  查裂缝,
  查道具,
  是母亲破墙服饰,
  经济配置,
  荣耀洞冷却时段,
  特殊场景锁定状态,
  道具表,
  门牌列表,
  难度表,
  type 道具配置,
  type 门牌,
} from '../../stageConfig';
import { 解析绝对时段 } from '../../周作息';
import { 丈夫在楼, 妻位置推算 } from '../../脚本/游戏逻辑/楼层时钟';
import { 余波有冻结效力 } from '../../脚本/游戏逻辑/冷落系统';
import { 怀孕已公开 } from '../../脚本/游戏逻辑/怀孕系统';
import { 安眠药可圆场, 丈夫登门药物窗口已开启 } from '../../脚本/游戏逻辑/丈夫登门系统';
import { 列出地点管理任务 } from '../../脚本/游戏逻辑/管理任务系统';
import { 规范荣耀洞上次时段 } from '../../脚本/游戏逻辑/荣耀洞';
import { 列出阶段线路候选详情, type 阶段线路候选 } from '../../脚本/游戏逻辑/阶段线路系统';
// 客户端只需要无副作用的聊天身份读取；禁止经手机系统兼容门面把宿主渲染组合根打进 iframe。
import { 当前聊天ID } from '../../脚本/游戏逻辑/手机/运行时上下文';
// 纯函数模块：客户端直连可安全用于目标时段的地图赴约位置派生。
import { 手机邀约计划状态, type 手机邀约计划 } from '../../脚本/游戏逻辑/手机/邀约计划';
import { 手机锚消息签名 } from '../../脚本/游戏逻辑/手机时间线租约';
import { 判定时间撤销点, 是时间撤销地点, 时间撤销点键 } from '../../脚本/游戏逻辑/时间撤销系统';
import { 风闻事件安全摘要 } from '../../脚本/游戏逻辑/风闻系统';
import { 清除末尾残缺协议标签, 清除末尾裸JSON补丁 } from '../../脚本/游戏逻辑/严格正文清洗';
import { 当前预设正文标签 as 读取当前预设正文标签 } from '../../脚本/游戏逻辑/预设桥';
import { 清洗预设输出, type 预设正文标签 } from '../../脚本/游戏逻辑/预设输出兼容';
import { 更新有效流式正文 } from '../../脚本/游戏逻辑/正文生成完整性';
import {
  行动资源门槛,
  距离下级经验,
  玩家资源已满,
  资源上限,
  资源等级,
  默认失控位置,
  亲密收尾选项 as 构造亲密收尾选项,
} from '../../脚本/游戏逻辑/玩家资源系统';
import {
  CG条目,
  判定CG部位,
  判定CG阶段,
  应保留成人CG,
  选择成人CG,
  type CG回合信号,
  type 成人CG项,
} from '../../脚本/游戏逻辑/成人CG系统';
import { useDataStore } from './store';
import { CG加载事件属于当前请求 } from './cgLoadState';
import { 计算场景同步, type 场景聊天状态 } from './场景状态同步';
import {
  创建正文幕归属,
  作废正文幕归属,
  应用回合完成正文幕,
  正文幕属于当前房间,
  type 回合完成正文选项,
} from './正文幕归属';
import { 同步画幅 } from './viewport';
import { useUIPrefs } from './composables/useUIPrefs';
import { useRoomActions } from './composables/useRoomActions';
import { useVideoTape } from './composables/useVideoTape';
import { useMuteMeeting } from './composables/useMuteMeeting';
import {
  保存回合恢复记录,
  读取回合恢复记录,
  清除回合恢复记录,
  type 回合恢复上下文,
  type 回合恢复存储,
} from './回合恢复缓存';
import Ic from './components/Icon.vue';
import CgLibrary from './components/CG图库.vue';
import MonitorPopup from './components/监控.vue';
import LetterPopup from './components/读信.vue';
import EventPromptPopup from './components/事件提示词.vue';
import FeedbackOverlay from './components/反馈提示.vue';
import SettingsPopup from './components/设置弹窗.vue';
import FirstRunSetup from './components/首次准备.vue';
import PrologueTitleScreen from './components/序章标题屏.vue';
import InventoryPopup from './components/背包.vue';
import ShopPopup from './components/商店.vue';
import DossierPopup from './components/档案卡.vue';
import MapPopup from './components/地图.vue';
import VideoTapeStage from './components/录像带舞台.vue';
import VideoTapeControls from './components/录像带操作.vue';
import ActionOptions from './components/行动选项.vue';
import MuteMeetingPreparation from './components/静音会议筹备.vue';
import MuteMeetingStage from './components/静音会议舞台.vue';
import MuteMeetingInteraction from './components/静音会议互动.vue';
import MuteMeetingLockNote from './components/静音会议锁定提示.vue';
import MuteMeetingAfter from './components/静音会议会后.vue';
import RoundInput from './components/回合输入.vue';
import StoryScroll from './components/正文卷轴.vue';
import RoomActionsDrawer from './components/房内操作抽屉.vue';
import {
  公寓外部背景图,
  晨跑公园背景图,
  健身房背景图,
  清醒咖啡道具图,
  集中胶囊道具图,
  运动饮料道具图,
  强效营养剂道具图,
  安全套道具图,
  专注训练手册道具图,
  蛋白粉道具图,
  素材基址,
  角色立绘候选,
  成人CG基址,
  CG解锁存储键,
} from './assets';
import type {
  风闻账视图,
  风闻事件视图,
  无耗时拜访记录,
  由头日记录,
  客户端时间方式,
  立绘项,
  道具视觉类型,
  卷轴条,
  玩家正则项,
  全屏文档,
  酒馆原生提示词模块,
} from './types';

const store = useDataStore();
// defineMvuDataStore 的 Pinia 泛型在 SFC 里推断失败(已知误报,见 ShopPanel 先例),显式标回
const data = computed(() => (store as unknown as { data: SchemaType }).data);
const 胜任红线 = computed(() => 难度表[data.value.系统._难度]?.胜任度红线 ?? 难度表.标准.胜任度红线);
const 正式通牒中 = computed(() => data.value.系统._通牒期 >= 0);
const 胜任状态 = computed(() => {
  if (正式通牒中.value) return '通牒';
  const 距离 = data.value.胜任度 - 胜任红线.value;
  return 距离 <= 9 ? '危险' : 距离 <= 19 ? '不满' : 距离 <= 29 ? '平淡' : '满意';
});
const 胜任状态说明 = computed(() => {
  const 距离 = Math.round(data.value.胜任度 - 胜任红线.value);
  if (距离 <= 0) return `当前比红线低 ${Math.abs(距离)} 点；正式通牒只在考核结算后发出。`;
  if (距离 <= 9) return `距离红线只剩 ${距离} 点，优先完成楼务并接听父亲来电。`;
  return `当前高于红线 ${距离} 点；按期处理楼务可以继续稳定评价。`;
});
const 显示胜任详情 = ref(false);
const 下一次考核提示 = computed(() => {
  const 期长 = 经济配置.收租周期时段;
  const 下一期界 = (Math.floor(绝对时段.value / 期长) + 1) * 期长;
  return `时段 ${下一期界}，尚余 ${Math.max(0, 下一期界 - 绝对时段.value)} 时段`;
});
const 胜任待办 = computed(() =>
  [...data.value.系统._管理考核.活跃任务].sort(
    (a, b) => Number(a.逾期已扣) - Number(b.逾期已扣) || a.截止时段 - b.截止时段 || a.id.localeCompare(b.id),
  ),
);
const 胜任已完成 = computed(() => [...data.value.系统._管理考核.本期完成摘要].slice(-3).reverse());
const 胜任最近记分 = computed(() =>
  [...data.value.系统._管理考核.记分条目].sort((a, b) => b.时段 - a.时段 || b.考核期 - a.考核期).slice(0, 5),
);

const 风闻阈值 = [
  { 档: 1, 值: 25, 名: '留意' },
  { 档: 2, 值: 50, 名: '议论' },
  { 档: 3, 值: 75, 名: '盯防' },
  { 档: 4, 值: 100, 名: '危机' },
] as const;
const 显示风闻详情 = ref(false);
const 风闻档位 = computed(() => {
  const 值 = Math.max(0, Math.min(100, Math.round(Number(data.value.风闻) || 0)));
  return 值 >= 100 ? 4 : 值 >= 75 ? 3 : 值 >= 50 ? 2 : 值 >= 25 ? 1 : 0;
});
const 风闻状态 = computed(() => ['平静', '留意', '议论', '盯防', '危机'][风闻档位.value] ?? '平静');
const 风闻状态说明 = computed(
  () =>
    [
      '楼内没有形成可追溯的议论。',
      '有人开始留意异常，但还没有集中讨论。',
      '楼里的公开议论已经形成，新的来源会继续推高风闻。',
      '住户开始盯防异常，正式投诉可能随时出现。',
      '风闻已经形成危机，当前投诉需要优先处置。',
    ][风闻档位.value] ?? '楼内没有形成可追溯的议论。',
);
const 风闻账 = computed<风闻账视图>(() => data.value.系统._风闻账);
const 风闻趋势 = computed(() => {
  const 当前日 = Math.floor(绝对时段.value / 6);
  if (风闻账.value.最后新增日 === 当前日) return '本日出现了新的公开来源，暂不会自然平息。';
  const 下限 = 风闻账.value.危机活跃 ? 50 : 风闻账.value.当前投诉事件.trim() ? 25 : 0;
  if (data.value.风闻 <= 下限 && 下限 > 0) return `受未处理事件限制，当前维持在 ${下限} 点下限。`;
  if (data.value.风闻 <= 0) return '平稳。';
  return '下降中；完整一天没有新增来源时会继续自然平息。';
});
const 风闻最近事件 = computed(() =>
  [...风闻账.value.最近事件].sort((左, 右) => Number(右.时段) - Number(左.时段)).slice(0, 3),
);
const 当前投诉记录 = computed<风闻事件视图 | null>(() => {
  const id = 风闻账.value.当前投诉事件.trim();
  return id ? (风闻账.value.最近事件.find(事件 => 事件.id === id) ?? null) : null;
});
const 当前投诉存在 = computed(() => Boolean(风闻账.value.当前投诉事件.trim()));
const 当前投诉提示 = computed(() => {
  const 当前 = 风闻账.value.当前投诉事件.trim();
  if (!当前) return '没有住户投诉正在等待处理。';
  return 当前投诉记录.value ? 风闻事件安全摘要(当前投诉记录.value) : `事件 ${当前} 正在等待处理。`;
});
const 风闻危机提示 = computed(() =>
  风闻账.value.危机活跃 ? '先处理当前危机投诉；未处理期间风闻不得低于 50。' : '目前没有需要立即处置的风闻危机。',
);
const 风闻自然平息提示 = computed(() => {
  if (data.value.风闻 <= 0) return '当前无需平息，避免制造新的公开来源。';
  const 每日降低 = data.value.风闻 < 50 ? 4 : data.value.风闻 < 75 ? 2 : 1;
  const 下限 = 风闻账.value.危机活跃 ? 50 : 当前投诉存在.value ? 25 : 0;
  return `完整一天没有新增来源时降低 ${每日降低} 点${下限 > 0 ? `；当前事件未处理前不得低于 ${下限}` : ''}。`;
});
const 风闻聚餐提示 = computed(() => {
  const 冷却至 = 风闻账.value.聚餐冷却至;
  if (冷却至 < 0 || 绝对时段.value >= 冷却至) return '聚餐调节已经可用，触发入口以地图或事件提示为准。';
  const 信息 = 解析绝对时段(冷却至);
  return `仍在冷却，第 ${信息.天数} 天 ${信息.星期} ${信息.时段} 后可再次安排。`;
});

function 风闻事件位置(事件: 风闻事件视图): string {
  const 信息 = 解析绝对时段(Math.max(0, Number(事件.时段) || 0));
  const 位置 = [事件.门牌 ? `${事件.门牌}室` : '', 事件.地点].filter(Boolean).join(' / ');
  return `第 ${信息.天数} 天 ${信息.时段}${位置 ? ` / ${位置}` : ''}`;
}

function 风闻父亲责任标签(事件: 风闻事件视图): string {
  if (事件.父亲责任 === '母亲已圆场') return '母亲已圆场';
  if (事件.父亲责任 === '已计责') return '父亲已计责';
  return '尚未传给父亲';
}

/** 数据就绪守卫:store 兜底为 {} 时不裸渲染 */
const 就绪 = computed(() => Boolean(data.value?.系统 && data.value?.户));

// ── 脚本心跳(15s 陈旧判死;挂载后先宽限) ──

const 脚本存活 = ref(true);
let 心跳timer: ReturnType<typeof setInterval> | undefined;

// ── 世界周历与消息历史 ──

const 末楼号 = ref(0);
const 时间信息 = computed(() =>
  解析绝对时段(Number((data.value?.系统 as { _绝对时段?: number } | undefined)?._绝对时段 ?? 0)),
);
const 绝对时段 = computed(() => 时间信息.value.绝对时段);
const 时段 = computed(() => 时间信息.value.时段);
const 天数 = computed(() => 时间信息.value.天数);
const 周数 = computed(() => 时间信息.value.周数);
const 星期 = computed(() => 时间信息.value.星期);
const 当前时段显示 = computed(() => 时间信息.value.时段);
const 下一时段显示 = computed(() => 解析绝对时段(绝对时段.value + 1).时段);

// ── 玩家精力 / 体力与本场满意度 ──

const 显示资源详情 = ref<'精力' | '体力' | null>(null);
const 精力上限 = computed(() => 资源上限(data.value, '精力'));
const 体力上限 = computed(() => 资源上限(data.value, '体力'));
const 精力等级 = computed(() => 资源等级(data.value.玩家资源.精力.训练经验));
const 体力等级 = computed(() => 资源等级(data.value.玩家资源.体力.训练经验));
const 精力格数 = computed(() => Math.round((data.value.玩家资源.精力.当前值 / Math.max(1, 精力上限.value)) * 10));
const 体力格数 = computed(() => Math.round((data.value.玩家资源.体力.当前值 / Math.max(1, 体力上限.value)) * 10));
const 性爱场景 = computed(() => data.value.系统._性爱场景);
const 上次性爱结果 = computed(() => data.value.系统._上次性爱结果);
const 性爱进行中 = computed(() => 性爱场景.value.状态 !== '空闲');
const 性爱待失控收尾 = computed(() => 性爱场景.value.状态 === '收尾中');
const 待确认收尾位置 = ref('');
const 亲密抽屉展开 = ref(false);
const 显示性爱结果卡 = ref(false);
let 性爱结果timer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => [
    性爱场景.value.场次标识,
    性爱场景.value.状态,
    性爱场景.value.有效楼数,
    性爱场景.value.当前行为,
    性爱场景.value.保护状态,
  ],
  (新值, 旧值) => {
    待确认收尾位置.value = '';
    if (新值[0] !== 旧值?.[0]) 亲密抽屉展开.value = false;
  },
);
watch(
  () => 上次性爱结果.value.场次标识,
  (新标识, 旧标识) => {
    if (!新标识 || 新标识 === 旧标识) return;
    clearTimeout(性爱结果timer);
    显示性爱结果卡.value = true;
    性爱结果timer = setTimeout(() => (显示性爱结果卡.value = false), 8000);
  },
  { flush: 'post' },
);
const 性爱参与者列表 = computed(() =>
  Object.entries(性爱场景.value.参与者).map(([门牌号, 项]) => ({
    门牌: 门牌号 as 门牌,
    妻名: 户静态表[门牌号 as 门牌]?.妻名 ?? 门牌号,
    ...项,
  })),
);
const 性爱主焦点 = computed(
  () =>
    性爱参与者列表.value.find(项 => 项.门牌 === 性爱场景.value.主焦点门牌) ??
    性爱参与者列表.value.find(项 => 项.满意度 < 项.满意目标) ??
    性爱参与者列表.value[0],
);
const 性爱已完成人数 = computed(() => 性爱参与者列表.value.filter(项 => 项.满意度 >= 项.满意目标).length);
const 性爱结果参与者列表 = computed(() =>
  Object.entries(上次性爱结果.value.参与者).map(([门牌号, 项]) => ({
    门牌: 门牌号 as 门牌,
    妻名: 户静态表[门牌号 as 门牌]?.妻名 ?? 门牌号,
    ...项,
  })),
);
const 收尾选项 = computed(() => 构造亲密收尾选项(性爱场景.value));
const 资源详情 = computed(() => {
  const 种类 = 显示资源详情.value ?? '精力';
  const 资源 = data.value.玩家资源[种类];
  const 进度 = 距离下级经验(资源.训练经验);
  return { 种类, 资源, 上限: 资源上限(data.value, 种类), ...进度 };
});

// ── 场景与移动(走动零成本纯UI;_场景 与脚本快照共用) ──

const 当前房间 = ref<string | null>(null);
const 显示地图 = ref(false);
/** A6a:地图/房卡迁入 components/地图.vue 后,独立事件结果经此公开接口翻出(组件内守 open+房卡)。 */
type 地图弹窗公开接口 = { 显示结果: (消息: string) => boolean };
const 地图弹窗 = ref<地图弹窗公开接口 | null>(null);
/** chat 变量不是 Pinia 数据；手机写入时显式拨动它，让撤销按钮立即重算而不只依赖后端兜底。 */
const 时间撤销刷新版本 = ref(0);

/** 这里只负责藏/显按钮；点击后脚本会用最新 MVU、chat、聊天 ID 与消息锚重新完整校验。 */
const 时间撤销可用 = computed(() => {
  const 房间 = 当前房间.value;
  // 明确订阅时钟与末楼刷新；时间事务完成后的 store.pull/卷轴刷新会重新计算撤销资格。
  void 绝对时段.value;
  void 末楼号.value;
  void 时间撤销刷新版本.value;
  if (!是时间撤销地点(房间) || !data.value?.系统) return false;
  try {
    const vars = getVariables({ type: 'chat' });
    let 当前楼 = 末楼号.value;
    try {
      当前楼 = getLastMessageId();
    } catch {
      /* 使用最近一次卷轴水位 */
    }
    return 判定时间撤销点(vars[时间撤销点键], {
      当前数据: data.value,
      当前聊天变量: vars,
      当前聊天ID: 当前聊天ID(),
      当前楼,
      当前锚消息签名: 手机锚消息签名(SillyTavern.chat?.[当前楼]),
    }).有效;
  } catch {
    return false;
  }
});
/** 进房那一刻的消息楼号(随 _场景 持久，只供场景快照与历史定位；不参与世界时间)。 */
const 进房末楼 = ref(0);
/** 工具由头只在这一次“从门外进房”的首轮静默扣一次配额；留在房内续聊不再重复扣。 */
const 本次入房由头已用 = ref(false);
/** 正在与玩家对话的人固定在当前场景；其余住户按绝对时段对应的固定周作息显示。 */
const 粘滞在场 = ref<{ 位置: string | null; 们: 门牌[] }>({ 位置: null, 们: [] });

function 刷粘滞() {
  try {
    const p = _.get(getVariables({ type: 'chat' }), '_粘滞') as { 位置?: string; 们?: 门牌[] } | null;
    粘滞在场.value = {
      位置: p?.位置 === 当前房间.value ? (p.位置 ?? null) : null,
      们: p?.位置 === 当前房间.value && Array.isArray(p.们) ? p.们 : [],
    };
  } catch {
    粘滞在场.value = { 位置: null, 们: [] };
  }
}

/** 赴约显示(微信"+"约出来):旧即时赴约=有效期内她在玩家身边;v0.80 新预约计划=目标时段她在约定地点。回档/过期自动失效 */
const 赴约妻 = ref<{ m: string; 地点: string } | null>(null);
function 刷赴约() {
  try {
    const 变量 = getVariables({ type: 'chat' });
    const p = _.get(变量, '_赴约') as { m?: string; 起楼?: number; 至楼?: number } | null;
    const 楼 = 末楼号.value;
    if (p?.m && (p.起楼 ?? 0) <= 楼 && (p.至楼 ?? -1) >= 楼) {
      // 旧即时赴约:她的位置=玩家所在。
      赴约妻.value = { m: p.m, 地点: 当前房间.value ?? '大堂' };
      return;
    }
    // v0.80 新预约计划:只有赴约时段(当前钟===目标钟)才在约定地点现身;
    // 待赴约/已过期/创建点在回档后失效的都按固定作息显示,不提前现身。
    const 计划 = _.get(变量, '_手机邀约计划') as 手机邀约计划 | null;
    if (手机邀约计划状态(计划, 绝对时段.value, 楼) === '赴约中') {
      赴约妻.value = { m: 计划!.m, 地点: 计划!.地点 };
      return;
    }
    赴约妻.value = null;
  } catch {
    赴约妻.value = null;
  }
}
/** 妻位置显示统一口：特殊场景、赴约、连续对话优先，最后才读取固定周作息。 */
function 妻现位(m: 门牌): string {
  if (静音会议正式中.value && 是静音会议候选门牌(m) && 静音会议演出妻.value.includes(m)) return '管理员室';
  if (赴约妻.value?.m === m) return 赴约妻.value.地点;
  if (粘滞在场.value.位置 && 粘滞在场.value.们.includes(m)) return 粘滞在场.value.位置;
  return 妻位置推算(m, 绝对时段.value, data.value.户[m]);
}
watch(显示地图, 开 => {
  if (开) {
    刷赴约(); // 约完人直接开地图(不产楼),开图那刻补一次同步
    刷粘滞();
  }
});

interface 待提交场景状态 {
  进房末楼: number;
  由头已用: boolean;
  非法进入: boolean;
}

async function 写场景(房间id: string | null, 破门 = false, 待提交状态?: 待提交场景状态): Promise<void> {
  const 变量 = getVariables({ type: 'chat' });
  const 旧场景 = (_.get(变量, '_场景') as 场景聊天状态 | null | undefined) ?? null;
  const 旧房间 = 旧场景?.房间id ?? null;
  const 新场景状态 = 待提交状态 ?? {
    进房末楼: 进房末楼.value,
    由头已用: 本次入房由头已用.value,
    非法进入: 已破门进入.value,
  };
  const 旧轨迹 = (_.get(变量, '_地图轨迹') as string[] | undefined) ?? [];
  const 从 = 旧房间 ? (查房间(旧房间)?.名称 ?? 旧房间) : '楼道';
  const 到 = 房间id ? (查房间(房间id)?.名称 ?? 房间id) : '楼道';
  const 新轨迹 = 旧房间 === 房间id ? 旧轨迹 : [...旧轨迹, `从${从}走到${到}`].slice(-8);
  let 无耗时拜访 = (_.get(变量, '_无耗时拜访') as 无耗时拜访记录 | null | undefined) ?? null;
  // 临时离开住户场景去翻垃圾/查工具再回来，只要世界时段没有变化，就仍是同一次拜访。
  // 记录放 chat 变量而不是模块变量，iframe 刷新后也不会重新索要已经用过的由头。
  if (旧房间 && 旧房间 !== 房间id && 查房间(旧房间)?.类型 === '户' && 旧房间 !== '302') {
    无耗时拜访 = {
      房间id: 旧房间,
      绝对时段: 绝对时段.value,
      进房末楼: 旧场景?.进房末楼 ?? 进房末楼.value,
      由头已用: 旧场景?.由头已用 ?? 本次入房由头已用.value,
      非法进入: !!(旧场景?.非法进入 || 已破门进入.value),
    };
  }
  await insertOrAssignVariables(
    {
      _场景: 房间id
        ? {
            房间id,
            破门,
            非法进入: 新场景状态.非法进入,
            进房末楼: 新场景状态.进房末楼,
            由头已用: 新场景状态.由头已用,
          }
        : null,
      _无耗时拜访: 无耗时拜访,
      _粘滞: null, // 玩家一走动就解除旧对话固定；重回同一房间也不能把已经离开的人“复活”
      _地图轨迹: 新轨迹,
    },
    { type: 'chat' },
  );
  if (旧房间 !== 房间id) {
    当前成人CG.value = null;
    最近CG信号 = null;
  }
}

function 启动阶段线路剧情(房间id: string, 候选: 阶段线路候选): void {
  if (发送中.value || 当前房间.value !== 房间id) return;
  发送中.value = true;
  const 行动 = `(在${查房间(房间id)?.名称 ?? 房间id}处理${户静态表[候选.门牌].妻名}的关系线索)`;
  待重试行动.value = 行动;
  失败行动.value = '';
  保存待恢复行动(行动);
  流式段.value = [];
  卷轴.value.push({ 谁: '玩家', 文本: [行动] });
  void 滚到底();
  eventEmit('人妻公寓:线路启动剧情', {
    地点: 房间id,
    门牌: 候选.门牌,
    时段: 时段.value,
    预期目标阶段: 候选.目标阶段,
    预期节点: 候选.节点,
  });
}

let 亲密离场处理中: Promise<boolean> | null = null;
let 场景移动中 = false;

async function 确认亲密离场(): Promise<boolean> {
  if (!性爱进行中.value) return true;
  if (亲密离场处理中) {
    await 亲密离场处理中;
    return false;
  }
  const 任务 = (async () => {
    const 确认 = window.confirm('亲密场景还没有收尾。现在离开会让参与角色的好感与堕落下降，仍要离开吗？');
    if (!确认) return false;
    await Promise.resolve(eventEmit('人妻公寓:性爱突然离场'));
    return true;
  })();
  亲密离场处理中 = 任务;
  try {
    return await 任务;
  } finally {
    亲密离场处理中 = null;
  }
}

async function 进入(房间id: string, 破门 = false, 保持地图 = false): Promise<boolean> {
  if (场景移动中) return false;
  // 地图上重复点当前房间只是“确认留在这里”：不算重新进门，也不能刷新由头配额/进房楼戳。
  if (房间id === 当前房间.value) {
    if (!保持地图) 关地图();
    闪转场(查房间(房间id)?.名称 ?? 房间id);
    return true;
  }
  场景移动中 = true;
  try {
    if (!(await 确认亲密离场())) return false;
    const 无耗时拜访 =
      (_.get(getVariables({ type: 'chat' }), '_无耗时拜访') as 无耗时拜访记录 | null | undefined) ?? null;
    const 续接同次拜访 =
      无耗时拜访?.房间id === 房间id && 无耗时拜访.绝对时段 === 绝对时段.value && 查房间(房间id)?.类型 === '户';
    let 新进房末楼 = 无耗时拜访?.进房末楼 ?? 末楼号.value;
    if (!续接同次拜访) {
      try {
        新进房末楼 = getLastMessageId();
      } catch {
        新进房末楼 = 末楼号.value;
      }
    }
    const 新由头已用 = 续接同次拜访 ? 无耗时拜访.由头已用 : false;
    const 新非法进入 = 破门 || (续接同次拜访 && !!无耗时拜访?.非法进入);
    await 写场景(房间id, 破门, {
      进房末楼: 新进房末楼,
      由头已用: 新由头已用,
      非法进入: 新非法进入,
    });
    当前房间.value = 房间id;
    进房末楼.value = 新进房末楼;
    本次入房由头已用.value = 新由头已用;
    已破门进入.value = 新非法进入;
    粘滞在场.value = { 位置: null, 们: [] };
    if (!保持地图) 关地图();
    正文幕归属状态.value = 作废正文幕归属(正文幕归属状态.value);
    记待办(房间id);
    闪转场(查房间(房间id)?.名称 ?? 房间id);
    // 头像即时点亮(走到谁身边谁亮;回合结束后脚本按位置系统重算)
    在场.value = { 焦点: 可见门牌.value.filter(m => 妻现位(m) === 房间id), 在场: [] };
    return true;
  } finally {
    场景移动中 = false;
  }
}

async function 离开房间(): Promise<void> {
  if (场景移动中) return;
  场景移动中 = true;
  try {
    if (!(await 确认亲密离场())) return;
    await 写场景(null);
    当前房间.value = null;
    本次入房由头已用.value = false;
    粘滞在场.value = { 位置: null, 们: [] };
    已破门进入.value = false;
    正文幕归属状态.value = 作废正文幕归属(正文幕归属状态.value);
    闪转场('楼道');
    在场.value = { 焦点: [], 在场: [] }; // 身边已无人,头像随之熄灭
    显示地图.value = true; // 走出房门=站上楼道,顺手展开地图选下一处
  } finally {
    场景移动中 = false;
  }
}

/**
 * 以 chat 变量 _场景 为唯一真值重建场景态(审计 C2):撤回/回档会把 _场景 置 null、
 * 隔离撤回会把它恢复成旧值,客户端旧版从不重读——UI 仍渲染"你在 101 里"而脚本按
 * "站在楼道"组快照,送礼/要钱永久被拒,只有走出去再走回来才能自修。
 * 回合完成/隔离完成/回合失败 三个收口都过一遍;与真值一致时是无害幂等。
 */
function 同步场景自变量() {
  try {
    const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as 场景聊天状态 | null;
    let 缺省末楼 = 末楼号.value;
    try {
      缺省末楼 = getLastMessageId();
    } catch {
      /* 使用界面最后一次拉取的末楼 */
    }
    const 下一状态 = 计算场景同步(
      {
        房间id: 当前房间.value,
        非法进入: 已破门进入.value,
        进房末楼: 进房末楼.value,
        由头已用: 本次入房由头已用.value,
      },
      场景,
      缺省末楼,
    );
    当前房间.value = 下一状态.房间id;
    已破门进入.value = 下一状态.非法进入;
    本次入房由头已用.value = 下一状态.由头已用;
    进房末楼.value = 下一状态.进房末楼;
    if (下一状态.房间变化) {
      粘滞在场.value = { 位置: null, 们: [] };
      正文幕归属状态.value = 作废正文幕归属(正文幕归属状态.value);
    }
  } catch (e) {
    console.error('[人妻公寓客户端] 场景同步失败:', e);
  }
}

// ── 转场横幅(走动的即时反馈) ──

const 转场 = ref('');
let 转场计时: ReturnType<typeof setTimeout> | undefined;

function 闪转场(名称: string) {
  转场.value = 名称;
  clearTimeout(转场计时);
  转场计时 = setTimeout(() => (转场.value = ''), 1200);
}

/** 本次进入是否撬门而入(撬进空屋才有事可做;敲门无人应=还站在门外) */
const 已破门进入 = ref(false);

/**
 * 输入框门控(2026-07-17 用户反馈:无人的房间不该给输入框,公共区也一样):
 * 没人=没有对手戏,输入收起——户只能离开或撬门(撬进去=屋里翻找,输入恢复),
 * 公共区该干的事全在行动卡上(翻垃圾/查信箱);豁免你自己的地盘:302(你家)与管理员室。
 */
// ── 工具由头门(2026-07-20 用户拍板):裂缝未确认的户,得有拿得出手的由头才张得开嘴 ──
// 2026-08-04 用户拍板改静默:借口不再显示、不再注入正文(修理叙事让位给楼务系统),
// 但门槛与配额原样保留——工具箱在包才开输入框,每户每天3次在后台照扣。

/** chat软记录 _工具由头[门牌]={日,已用};回档时若日期不符自然作废。 */
const 工具由头记录 = ref<Record<string, 由头日记录>>({});

function 刷新工具由头() {
  const v = _.get(getVariables({ type: 'chat' }), '_工具由头');
  工具由头记录.value = (v && typeof v === 'object' ? v : {}) as Record<string, 由头日记录>;
}

const 需要由头 = computed(() => {
  const id = 当前房间.value;
  if (!id || id === '302' || 查房间(id)?.类型 !== '户') return false;
  const 节 = data.value?.户[id];
  // 2026-07-20 用户加码:裂缝破解只是"看清她",她真进了下个阶段(≥1)才算有登门的名分——
  // 刚读完信还停阶段0的,上门照样要工具由头
  return Boolean(节) && !(节!.妻.裂缝.已确认 && 节!.妻.当前阶段 >= 1) && !已破门进入.value && !本次入房由头已用.value;
});

const 可用由头 = computed(() => {
  const id = 当前房间.value ?? '';
  const 包 = data.value?.背包 ?? [];
  if (!包.includes('工具箱')) return [];
  const 今日 = 天数.value - 1;
  const 记 = 工具由头记录.value[id];
  const 已用 = 记?.日 === 今日 && Array.isArray(记.已用) ? 记.已用 : [];
  // 每日上限按"今天已用次数"扣减(审计 低危12):旧版 slice 在过滤之后,上限实际=工具表大小,
  // 工具表加到第 4 项时每日上限会静默失效
  if (已用.length >= 由头每日次数) return [];
  return Object.keys(由头工具表)
    .filter(w => !已用.includes(w))
    .slice(0, 由头每日次数 - 已用.length);
});

const 可输入 = computed(() => {
  const id = 当前房间.value;
  if (!id) return false;
  if (静音会议中.value) {
    if (!静音会议正式中.value || id !== '管理员室') return false;
    if (静音会议交互幕.value || 静音会议场景.value.交互.状态 === '等待AI' || 静音会议场景.value.阶段 === '收尾') {
      return false;
    }
    if (静音会议场景.value.阶段 === '正文') {
      // 第 1 拍通常由确认按钮自动生成；若该次生成失败，保留输入框让玩家重试固定开场。
      return [1, 2, 3, 5, 6, 7, 9, 10].includes(静音会议当前拍.value);
    }
    if (静音会议场景.value.阶段 === '散会选择') return 静音会议当前拍.value === 12;
    if (静音会议场景.value.阶段 === '会后') {
      return 静音会议当前拍.value >= 13 && 静音会议当前拍.value <= 15;
    }
    if (静音会议场景.value.阶段.includes('自由')) return 静音会议继续已选.value;
    return false;
  }
  if (录像带中.value) {
    return id === '管理员室' && 录像带阶段.value !== '等待102' && 录像带阶段.value !== '等待202';
  }
  // 荣耀洞摇到真人后开放输入,让玩家亲自推进余下3~5拍；空军演完即清场,不会走到这里。
  if (id === '洗手间' && (data.value?.系统?._荣耀洞拍 ?? -1) >= 0 && data.value?.系统?._荣耀洞门牌 !== '空') {
    return true;
  }
  if (id === '302' || id === '管理员室') return true;
  if (房内有人在(id)) {
    // 由头门:低阶段户必须持有工具箱，且该户今日的后台登门配额还没用完。
    if (需要由头.value && !可用由头.value.length) return false;
    return true;
  }
  return 查房间(id)?.类型 === '户' ? 已破门进入.value : false;
});

/**
 * 幕房间:最近一楼(=最近一场戏)发生的地方,回合完成时记下。
 * 底层是一条线性上下文(全角色融在一起),没有"每个房间各存一份对话"——
 * 正文永远只显示"当前正在进行的这一场戏";一旦走动(当前房间≠幕房间),
 * 这场戏就翻篇,正文让位给到场卡;在新地方开口=新的一楼,正文才回来。
 * 走回旧房间不会"复活"旧对话(线性上下文里它已在更早的楼层),而是当作一次新的到场。
 */
const 正文幕归属状态 = ref(创建正文幕归属(null));
const 幕房间 = computed(() => 正文幕归属状态.value.房间);

/** 人还站在最近这场戏发生的地方(正文可见;一走动就=新场景,正文隐去换到场卡) */
const 在幕中 = computed(() => 正文幕属于当前房间(正文幕归属状态.value, 当前房间.value));

const 显示选项 = computed(() => {
  if (发送中.value || !行动选项.value.length) return false;
  if (!当前房间.value) return 在幕中.value && 幕房间.value === null; // 楼道态:序章引导等
  return 可输入.value && 在幕中.value;
});

// ── 行动卡片(gal式:点房弹卡,氛围+在场+可做的事;翻垃圾/撬门都收在卡里) ──

function 关地图() {
  显示地图.value = false;
}

async function 从地图外出(): Promise<void> {
  await 进入('公寓外部');
}

function 发起时间推进(方式: 客户端时间方式): void {
  if (发送中.value) return;
  // 小憩直接结算；晨跑、健身与睡眠先生成不入正文记忆的独立反馈。两条路径都要锁住
  // 地图、输入和回档按钮，直到脚本明确回报结束。
  发送中.value = true;
  运行阶段.value =
    方式 === '睡到次日早晨'
      ? '正在休息到次日早晨'
      : 方式 === '晨跑'
        ? '正在进行晨跑训练'
        : 方式 === '健身'
          ? '正在进行体力训练'
          : 方式 === '小憩'
            ? '正在小憩'
            : '正在推进世界时间';
  const 事件名 =
    方式 === '睡到次日早晨'
      ? '人妻公寓:睡到次日早晨'
      : 方式 === '晨跑'
        ? '人妻公寓:晨跑'
        : 方式 === '健身'
          ? '人妻公寓:健身'
          : 方式 === '小憩'
            ? '人妻公寓:小憩'
            : '人妻公寓:推进时段';
  eventEmit(事件名, {
    方式,
    预期绝对时段: 绝对时段.value,
  });
}

function 推进固定时段(): void {
  if (发送中.value || 由头写入中.value) return;
  if (时段.value === '深夜') {
    弹提示('已经是深夜，请回管理员室或 302 睡觉。普通等待不能跨到第二天。', 4000);
    return;
  }
  if (玩家资源已满(data.value)) {
    const 确认 = window.confirm(`你在${当前时段显示.value}什么也没做，确定推进到${下一时段显示.value}吗？`);
    if (!确认) return;
  }
  发起时间推进('推进一时段');
}

function 发起时间撤销(): void {
  if (发送中.value || !时间撤销可用.value) return;
  发送中.value = true;
  运行阶段.value = '正在撤销刚才的时间推进';
  eventEmit('人妻公寓:撤销时间推进');
}

/** 欠租门牌(P3:地图挂"欠租"角标=催租入口可视化) */
function 欠租中(id: string): boolean {
  return (data.value?.户[id]?._欠租笔数 ?? 0) > 0;
}

/** 立面只挂一个短角标；逾期高亮，具体两种处理方式留在房卡动作里。 */
function 管理任务角标(id: string): '' | '楼务' | '逾期' {
  const 任务 = 列出地点管理任务(data.value, id)[0];
  return 任务 ? (任务.逾期已扣 ? '逾期' : '楼务') : '';
}

/** HUD 账夹：只把已有欠租状态图形化，不新增经济数值或玩法判定。 */
const 欠租账 = computed(() =>
  门牌列表
    .map(门牌 => ({ 门牌, 妻名: 户静态表[门牌].妻名, 笔数: data.value?.户[门牌]?._欠租笔数 ?? 0 }))
    .filter(项 => 项.笔数 > 0),
);
const 欠租总笔数 = computed(() => 欠租账.value.reduce((和, 项) => 和 + 项.笔数, 0));

// ── 手机(P4:设备本体在酒馆页面层,游戏界面只管跳动指示与红点) ──

const 手机来电 = computed(() => (data.value?.系统?._待接来电?.期 ?? -1) >= 0);
const 手机未读 = ref(false);

/** 这次开手机是不是替玩家退的真全屏——是的话,收手机时自动送回去(2026-07-20 玩家点单) */
let 收手机回全屏 = false;

async function 开手机() {
  if (静音会议正式中.value && !静音会议手机可打开.value) {
    弹提示(静音会议手机标题.value);
    return;
  }
  // 真全屏时手机壳挂在父文档,永远被全屏元素盖死(2026-07-20 玩家实测)——先退全屏再弹
  const 文档 = document as 全屏文档;
  if (document.fullscreenElement ?? 文档.webkitFullscreenElement) {
    收手机回全屏 = true;
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else 文档.webkitExitFullscreen?.();
    } catch {
      /* 退不掉也照样弹,至少桌面端能见 */
    }
  }
  eventEmit('人妻公寓:开手机', 手机来电.value);
}

/** 天暗后有人在家=窗户亮灯(gal地图的生活感;也是"丈夫在不在家"的免费可视化) */
function 窗灯(房间id: string): boolean {
  if (时段.value !== '傍晚' && 时段.value !== '晚上' && 时段.value !== '深夜') return false;
  return 房内有人在(房间id);
}

// ── 楼内的人:与脚本同一套纯函数推算(永不自相矛盾) ──

/** 已入住且非隐身的户(母亲 302 系统级隐身;P5:_母亲入列 后头像亮起=入列) */
const 可见门牌 = computed(() =>
  门牌列表.filter(m => data.value.户[m] && (!户静态表[m].隐身 || data.value.系统?._母亲入列)),
);

/** 某房间此刻有谁(妻按位置推算;夫在自家时段在家) */
function 房内的人(房间id: string): string[] {
  if (房间id === '管理员室' && 静音会议正式中.value) {
    const 临时名单 = 静音会议演出妻.value.map(门牌号 => 户静态表[门牌号].妻名);
    if (
      静音会议当前拍.value >= 1 &&
      静音会议当前拍.value <= 12 &&
      !['会后', '收尾'].includes(静音会议场景.value.阶段) &&
      !静音会议场景.value.阶段.includes('自由')
    ) {
      const 演出夫 = 静音会议场景.value.演出夫.length
        ? 静音会议场景.value.演出夫.map(值 => (是静音会议候选门牌(值) ? 户静态表[值].夫名 : 值))
        : 静音会议参与妻.value.map(门牌号 => 户静态表[门牌号].夫名);
      临时名单.push(...演出夫.filter(Boolean));
    }
    return [...new Set(临时名单)];
  }
  const 名单: string[] = [];
  for (const m of 可见门牌.value) {
    if (妻现位(m) === 房间id) 名单.push(户静态表[m].妻名);
    if (m === 房间id && 丈夫在楼(data.value.户[m], m, 绝对时段.value) !== '外出' && 户静态表[m].夫名) {
      名单.push(户静态表[m].夫名);
    }
  }
  if (房间id === '管理员室' && data.value?.系统?._特殊场景?.id === '录像带') {
    for (const 门牌号 of ['102', '202'] as const) {
      const 名 = 户静态表[门牌号].妻名;
      if (!名单.includes(名)) 名单.push(名);
    }
  }
  return 名单;
}

function 房内有人在(房间id: string): boolean {
  return 房内的人(房间id).length > 0;
}

/** 当面交互统一门：送礼、要钱等都只能对当前房间里真实亮起的妻子使用。 */
function 妻在玩家身边(m: 门牌): boolean {
  const 房 = 当前房间.value;
  if (!房) return false;
  if (m === '302' && 房 === '302' && data.value.户['302']) return true;
  return 妻现位(m) === 房;
}

const 当前房间名 = computed(() => (当前房间.value ? (查房间(当前房间.value)?.名称 ?? 当前房间.value) : ''));

// ── 到场卡与氛围色(移动的沉浸反馈:每个地点有自己的"开场镜头"和颜色) ──

const 到场标题 = computed(() => 当前房间名.value || '楼道里');

const 到场描写 = computed(() => {
  const id = 当前房间.value;
  if (!id) return '声控灯应了一声亮起来,又在你身后一盏盏熄灭。整栋楼的门都关着,门后各是各的日子。';
  const 房 = 查房间(id);
  if (房?.类型 === '户' && id !== '302' && !data.value.户[id]) {
    return '窗户蒙着灰,门上贴着一张手写的招租启事。';
  }
  if (房?.类型 === '户' && id !== '302' && !房内有人在(id)) {
    return 已破门进入.value ? `${房.氛围}——只是此刻没有人,静得能听见冰箱的嗡嗡声。` : '你敲了敲门。门里没有动静。';
  }
  return 房?.氛围 ?? '';
});

const 到场提示 = computed(() => {
  const id = 当前房间.value;
  if (!id) return '打开地图,看看这栋楼此刻亮着的灯。';
  if (可输入.value) return '在这里做点什么——故事会从这里继续。';
  if (需要由头.value && 房内有人在(id)) {
    const 有箱 = (data.value?.背包 ?? []).includes('工具箱');
    return 有箱
      ? '今天已经上过三次门，再敲就惹人嫌了——明天再来。'
      : '空着手你在人家门口站不住脚——去商店「工具」页签买一只工具箱，带着家伙什才像来办正事的。';
  }
  return '要么改天再来,要么……对着门连点几下。';
});

/** 每个地点的氛围色(洗到正文区背景;日夜两态都吃同一组 RGB,只调透明度) */
const 房间色: Record<string, [string, string]> = {
  '101': ['255, 150, 110', '255, 205, 130'], // 饭菜香的暖橙
  '102': ['120, 170, 220', '175, 205, 235'], // 一尘不染的瓷青
  '201': ['175, 150, 220', '205, 185, 235'],
  '202': ['245, 165, 195', '250, 200, 215'],
  '301': ['235, 150, 170', '245, 190, 200'],
  '302': ['255, 185, 95', '255, 220, 150'], // 你家的灯泡黄
  大堂: ['145, 185, 205', '190, 215, 225'],
  信箱区: ['155, 165, 185', '195, 205, 220'],
  管理员室: ['195, 155, 105', '220, 190, 145'], // 值班桌的木色
  楼梯间: ['135, 145, 170', '180, 190, 210'],
  天台: ['110, 190, 235', '175, 220, 245'], // 天的颜色
  垃圾房: ['145, 165, 125', '185, 195, 160'],
  洗手间: ['150, 185, 180', '195, 220, 210'], // 消毒水的青瓷色
  公寓外部: ['132, 168, 196', '232, 194, 142'],
  晨跑公园: ['105, 168, 132', '230, 196, 128'],
  健身房: ['116, 108, 102', '214, 172, 126'],
};

const 场景色 = computed(() => {
  const c = 房间色[当前房间.value ?? ''] ?? (['165, 175, 195', '205, 215, 230'] as [string, string]);
  return { '--sc-a': c[0], '--sc-b': c[1] };
});

/** 正文区背景图(CSS 变量进 .story 的多层 background,垫在氛围色渐变+白纱之下;图挂了渐变就是兜底) */
const 场景图样式 = computed(() => ({ '--scene-img': `url(${荣耀洞图.value || 背景图(当前房间.value)})` }));

// ── 荣耀洞(P5+ 用户点单):冷却一天一次;进行中按拍换CG——点破=该妻专属服务图(母亲5张),匿名=不露身份特写 ──

const 荣耀洞可用 = computed(() => {
  const 系 = data.value?.系统;
  if (!系 || (系._荣耀洞拍 ?? -1) >= 0) return false;
  // 设计spec:入口只有地点门+冷却+摇签阶段门槛;待办是软引导不硬锁,不作为前置
  const 记 = 规范荣耀洞上次时段(系._荣耀洞上次时段, 绝对时段.value);
  return 绝对时段.value - 记 >= 荣耀洞冷却时段;
});

// 2026-07-19 用户纠偏:视觉件=抠图透明立绘叠加(素材在 立绘/荣耀洞_*),背景恒定隔间图;环境版CG作废
const 荣耀洞图 = computed(() => {
  const 系 = data.value?.系统;
  if (!系 || (系._荣耀洞拍 ?? -1) < 0 || 当前房间.value !== '洗手间') return '';
  return `${素材基址}/背景/荣耀洞.webp`;
});

/** 荣耀洞拥有独立三拍CG；渲染层硬互斥，普通成人CG永远不能盖住它。 */
const 显示成人CG = computed(() => Boolean(当前成人CG.value && !荣耀洞图.value));

/** 洞戏立绘件:undefined=不在洞戏;''=本拍无件(空军/匿名收尾);否则=件地址 */
const 荣耀洞件 = computed<string | undefined>(() => {
  const 系 = data.value?.系统;
  const 拍 = 系?._荣耀洞拍 ?? -1;
  if (!系 || 拍 < 0 || 当前房间.value !== '洗手间') return undefined;
  const 门 = 系._荣耀洞门牌;
  if (!门 || 门 === '空') return '';
  const 幕 = Math.min(拍, (门 === '302' ? 5 : 3) - 1) + 1;
  if (系._荣耀洞点破) {
    const 名 = 门 === '302' ? '母亲' : 户静态表[门 as 门牌].妻名;
    return `${素材基址}/立绘/荣耀洞_${名}_${幕}.webp`;
  }
  // 匿名(玩家侧机位):1=洞中红唇张嘴等待 2=洞口含入 3=无件(人去洞空)
  return 幕 <= 2 ? `${素材基址}/立绘/荣耀洞_特写_${幕}.webp` : '';
});

// 中途离场=就地收束(用户拍板):人一走出洗手间,脚本清场,后续拍不再上演
watch(当前房间, 房 => {
  if (房 !== '洗手间' && (data.value?.系统?._荣耀洞拍 ?? -1) >= 0) eventEmit('人妻公寓:荣耀洞离场');
});

const 当前成人CG = ref<成人CG项 | null>(null);
const 成人CG加载中 = ref(false);
const 成人CG本次失效 = new Set<string>();
const 已解锁CG = ref<Set<string>>(new Set());
let 最近CG信号: CG回合信号 | null = null;
let 当前成人CG展示键 = '';
const 当前成人CG请求epoch = ref(0);

const 当前成人CG地址 = computed(() => (当前成人CG.value ? `${成人CG基址}/${当前成人CG.value.path}` : ''));

function 读取CG解锁(): void {
  try {
    const raw = JSON.parse(localStorage.getItem(CG解锁存储键) ?? '[]');
    已解锁CG.value = new Set(Array.isArray(raw) ? raw.filter(x => typeof x === 'string' && CG条目(x)) : []);
  } catch {
    已解锁CG.value = new Set();
  }
}

function 处理CG回合信号(信号: CG回合信号, 是加载重试 = false): void {
  if (!是加载重试) {
    // 这里只屏蔽同一信号内已经失败的候选；新回合应重新尝试，避免一次瞬时断网永久封图。
    成人CG本次失效.clear();
  }
  最近CG信号 = 信号;
  const 阶段 = 判定CG阶段(信号);
  const 部位 = 判定CG部位(`${信号.行动}\n${信号.正文}`, 信号.亲密);
  const 展示键 = 阶段 && 信号.门牌 ? `${信号.门牌}:${阶段}:${部位 ?? 'any'}` : '';
  if (当前成人CG.value && 应保留成人CG(信号) && 展示键 && 展示键 === 当前成人CG展示键) {
    成人CG加载中.value = false;
    return;
  }
  const 下一张 = 选择成人CG(信号, 已解锁CG.value, 成人CG本次失效);
  if (下一张) {
    当前成人CG请求epoch.value += 1;
    当前成人CG.value = 下一张;
    当前成人CG展示键 = 展示键;
    成人CG加载中.value = true;
  } else if (!应保留成人CG(信号)) {
    当前成人CG.value = null;
    当前成人CG展示键 = '';
    成人CG加载中.value = false;
  } else {
    // 场内的委婉/对话楼没有新候选时沿用当前 CG，不能掉回普通立绘。
    成人CG加载中.value = false;
  }
}

/** 回档/撤回把产生 CG 的楼层删掉后，画面不能继续停留在被抹去的成人场景上(2026-08-03 审计 M10)。
 * 正常回合的 CG 信号楼层 ≤ 末楼，此检查恒为无害幂等。 */
function 清理越界成人CG(): void {
  if (!最近CG信号 || 最近CG信号.楼层 <= getLastMessageId()) return;
  当前成人CG.value = null;
  当前成人CG展示键 = '';
  成人CG加载中.value = false;
  最近CG信号 = null;
}

function 成人CG已加载(事件: Event): void {
  const 图片 = 事件.currentTarget as HTMLImageElement | null;
  const 事件id = 图片?.dataset.cgId;
  if (!CG加载事件属于当前请求(当前成人CG.value?.id, 当前成人CG请求epoch.value, 事件id, 图片?.dataset.cgEpoch)) return;
  成人CG加载中.value = false;
  const id = 事件id;
  if (!id || 已解锁CG.value.has(id)) return;
  const next = new Set(已解锁CG.value);
  next.add(id);
  已解锁CG.value = next;
  try {
    localStorage.setItem(CG解锁存储键, JSON.stringify([...next]));
  } catch (e) {
    console.warn('[人妻公寓] CG 已在本次页面解锁，但浏览器拒绝写入收藏存储:', e);
  }
}

function 成人CG加载失败(事件: Event): void {
  const 图片 = 事件.currentTarget as HTMLImageElement | null;
  const id = 图片?.dataset.cgId;
  if (!CG加载事件属于当前请求(当前成人CG.value?.id, 当前成人CG请求epoch.value, id, 图片?.dataset.cgEpoch)) return;
  成人CG本次失效.add(id!);
  当前成人CG.value = null;
  成人CG加载中.value = false;
  // 失败集合保证每张图只尝试一次；选择器返回 null 即候选池真正耗尽，无需固定次数上限。
  if (最近CG信号) 处理CG回合信号(最近CG信号, true);
}

function 头像图(名: string): string {
  return `${素材基址}/头像/${名}.webp`;
}

/** 图挂了(断网/边缘缓存未热)回退首字圆徽 */
const 头像失效 = ref<Record<string, boolean>>({});

/** 商店道具图(rq0.12 生图入库;挂了回退首字) */
const 本地道具图: Partial<Record<string, string>> = {
  清醒咖啡: 清醒咖啡道具图,
  集中胶囊: 集中胶囊道具图,
  运动饮料: 运动饮料道具图,
  强效营养剂: 强效营养剂道具图,
  安全套: 安全套道具图,
  专注训练手册: 专注训练手册道具图,
  蛋白粉: 蛋白粉道具图,
};
function 道具图(id: string): string {
  return 本地道具图[id] ?? `${素材基址}/道具/${id}.webp`;
}

const 道具图失效 = ref<Record<string, boolean>>({});

// ── 立绘(她在这场戏里才入画,人走戏收;
//    2026-07-20 重排:桌面 1~6 人独立横槽;手机 1~3 人横槽、4 人 2×2、5~6 人 3×2,绝不互压) ──

const 立绘失效 = ref<Record<string, boolean>>({});

/** 每位角色同时拥有桌面槽和手机槽；CSS 根据画幅选用，槽位几何永不相交。 */
function 立绘槽(n: number, i: number): Record<string, string> {
  const 桌面宽 = 100 / n;
  const 桌面高 = [0, 98, 92, 84, 76, 70, 66][n] ?? 66;
  let 手机列数 = n;
  let 手机行数 = 1;
  let 手机列 = i;
  let 手机行 = 0;

  if (n === 4) {
    手机列数 = 2;
    手机行数 = 2;
    手机列 = i % 2;
    手机行 = Math.floor(i / 2);
  } else if (n >= 5) {
    手机列数 = 3;
    手机行数 = 2;
    手机行 = Math.floor(i / 3);
    // 五人时第二排居中，不让右下角留下突兀的空洞。
    手机列 = i % 3;
    if (n === 5 && 手机行 === 1) 手机列 += 0.5;
  }

  return {
    '--portrait-desktop-left': `${(i * 桌面宽).toFixed(3)}%`,
    '--portrait-desktop-center': `${((i + 0.5) * 桌面宽).toFixed(3)}%`,
    '--portrait-desktop-width': `${桌面宽.toFixed(3)}%`,
    '--portrait-desktop-height': `${桌面高}%`,
    '--portrait-mobile-left': `${((手机列 * 100) / 手机列数).toFixed(3)}%`,
    '--portrait-mobile-top': `${((手机行 * 100) / 手机行数).toFixed(3)}%`,
    '--portrait-mobile-width': `${(100 / 手机列数).toFixed(3)}%`,
    '--portrait-mobile-height': `${(100 / 手机行数).toFixed(3)}%`,
  };
}

const 立绘列表 = computed<立绘项[]>(() => {
  if (!当前房间.value) return [];
  // 荣耀洞戏中:立绘槽由洞件接管(匿名性:常规妻立绘一律不入画)
  const 洞件 = 荣耀洞件.value;
  if (洞件 !== undefined) {
    return 洞件 && !立绘失效.value[洞件] ? [{ src: 洞件, style: 立绘槽(1, 0) }] : [];
  }
  const 静音演员 = 当前房间.value === '管理员室' && 静音会议正式中.value ? 静音会议演出妻.value : undefined;
  const 图 = (静音演员 ?? 可见门牌.value.filter(k => 妻现位(k) === 当前房间.value))
    .map(m => {
      // 立绘跟随最后换上的衣服；尚未生成 `_立绘` 时优先恢复内衣差分，再回退外装。
      const 妻名 = 户静态表[m].妻名;
      const 穿着 = data.value.户[m]?.妻._穿着SKU;
      const sku = 穿着?._立绘 ?? 穿着?.内衣 ?? 穿着?.外装;
      return (
        角色立绘候选(妻名, sku, 怀孕已公开(data.value, m)).find(src => !立绘失效.value[src]) ?? ''
      );
    })
    .filter(src => !立绘失效.value[src])
    .slice(0, 6);
  const n = 图.length;
  return 图.map((src, i) => ({ src, style: 立绘槽(n, i) }));
});

function 背景图(房间id: string | null): string {
  const 本地背景: Partial<Record<string, string>> = {
    公寓外部: 公寓外部背景图,
    晨跑公园: 晨跑公园背景图,
    健身房: 健身房背景图,
  };
  if (房间id && 本地背景[房间id]) return 本地背景[房间id]!;
  // 楼道没有专属图,借楼梯间的(同一栋楼的筒子间气质)
  return `${素材基址}/背景/${房间id && 房间色[房间id] ? 房间id : '楼梯间'}.webp`;
}

/** 头像文件名:妻/母亲用本名,丈夫们共用柯南式影子 */
const 夫名集 = new Set(
  Object.values(户静态表)
    .map(h => h.夫名)
    .filter(Boolean),
);

function 头像名(名: string): string {
  return 夫名集.has(名) ? '影子' : 名;
}

// ── 头像行(脚本每回合把焦点/在场落 chat 变量 _在场) ──

const 在场 = ref<{ 焦点: string[]; 在场: string[] }>({ 焦点: [], 在场: [] });

function 刷新在场() {
  const v = _.get(getVariables({ type: 'chat' }), '_在场') as { 焦点?: string[]; 在场?: string[] } | undefined;
  在场.value = { 焦点: v?.焦点 ?? [], 在场: v?.在场 ?? [] };
  刷粘滞();
}

const 头像列表 = computed(() =>
  可见门牌.value.map(m => {
    const 妻 = data.value.户[m]?.妻;
    const 冷落状态 = 妻 && 余波有冻结效力(m, 妻, data.value.系统._母亲入列) ? 妻._冷落余波.状态 : '无';
    const 怀孕公开 = 怀孕已公开(data.value, m);
    const 冷落说明 = 冷落状态 === '待诉苦' ? '冷落状态：等待回应' : 冷落状态 === '安抚中' ? '冷落状态：安抚中' : '';
    return {
      门牌: m,
      妻名: 户静态表[m].妻名,
      态: 静音会议正式中.value
        ? 是静音会议候选门牌(m) && 静音会议演出妻.value.includes(m)
          ? 静音会议场景.value.重点妻 === m || 静音会议场景.value.会后妻.includes(m)
            ? 'focus'
            : 'ambient'
          : 'away'
        : 在场.value.焦点.includes(m)
          ? 'focus'
          : 在场.value.在场.includes(m)
            ? 'ambient'
            : 'away',
      冷落态: 冷落状态 === '待诉苦' ? 'neglect-pending' : 冷落状态 === '安抚中' ? 'neglect-soothing' : '',
      怀孕态: 怀孕公开 ? 'pregnant' : '',
      冷落说明: [冷落说明, 怀孕公开 ? '已告知怀孕' : ''].filter(Boolean).join('；'),
    };
  }),
);

// ── 游戏内输入(固定0楼:行动发给脚本回合引擎,不碰酒馆输入框) ──

const 输入文本 = ref('');
const 发送中 = ref(false);
watch(发送中, 正在生成 => {
  if (正在生成) 亲密抽屉展开.value = false;
});
const 由头写入中 = ref(false);
// ── 房内动作生成(App A6b:逻辑与破门局部状态迁入 composables/useRoomActions.ts) ──
// App 只注入运行态 refs 与业务事件回调;事件名与载荷保持原样,composable 不直连事件总线。
const { 房间动作, 当前房间动作, 普通房间动作, 确认已到达动作地点 } = useRoomActions({
  data,
  当前房间,
  时段,
  绝对时段,
  发送中,
  时间撤销可用,
  已破门进入,
  荣耀洞可用,
  房内有人在,
  妻现位,
  进入,
  同步场景自变量,
  弹提示,
  发起时间推进,
  发起时间撤销,
  启动阶段线路剧情,
  事件: {
    对饮: id => eventEmit('人妻公寓:对饮', id),
    丈夫礼物: ({ 门牌, 道具id }) => eventEmit('人妻公寓:丈夫礼物', { 门牌, 道具id }),
    催租: ({ 门牌, 选择 }) => eventEmit('人妻公寓:催租', { 门牌, 选择 }),
    空房偷窃: id => eventEmit('人妻公寓:空房偷窃', id),
    打听: m => eventEmit('人妻公寓:打听', m),
    荣耀洞: () => eventEmit('人妻公寓:荣耀洞'),
    捡金币: id => eventEmit('人妻公寓:捡金币', id),
    处理管理任务: ({ 任务id, 选项id, 地点 }) => eventEmit('人妻公寓:处理管理任务', { 任务id, 选项id, 地点 }),
  },
});
// 保留 App 对组合器完整返回契约的接线；当前模板只直接消费普通房间动作。
void 当前房间动作;
const 流式段 = ref<string[]>([]);
// ── 特殊场景「录像带」交互(App A7a:状态机/5 秒与 10 连点/完整失败记账/补偿迁入 composables/useVideoTape.ts) ──
// App 只注入运行态 refs 与业务事件回调;事件名与载荷保持原样,composable 不直连事件总线。
const {
  录像带阶段,
  录像带中,
  录像带本地结果,
  录像带连点目标,
  录像带连点计数,
  录像带补偿可用,
  录像带交互幕,
  请求使用录像带,
  打开102录像,
  连续点击202录像,
  自动重连202,
  重置录像带界面,
} = useVideoTape({
  data,
  发送中,
  清空流式输出: () => {
    流式段.value = [];
  },
  请求使用: () => eventEmit('人妻公寓:使用录像带'),
  请求互动: 房间 => eventEmit('人妻公寓:录像带互动', 房间),
  保存失败交互: 新交互 => {
    data.value.系统._特殊场景.交互 = 新交互;
    (store as unknown as { flush?: () => void }).flush?.();
  },
});

function 使用录像带() {
  显示背包.value = false;
  请求使用录像带();
}

const 运行阶段 = ref('');
const 数据库运行文案 = computed(() => (运行阶段.value.startsWith('数据库') ? 运行阶段.value : ''));
const 生成等待秒 = ref(0);
const 待重试行动 = ref('');
const 失败行动 = ref('');
const 取消后自动重试 = ref(false);
const 可重掷 = ref(false);
const 隔离可重掷 = ref(false);
const 键盘打开 = ref(false);
const 当前资源门槛 = computed(() => {
  const 文本 = 输入文本.value.trim();
  const 系统 = data.value.系统;
  const 免资源 = Boolean(系统._待发送事件 || 系统._特殊场景.id || 静音会议正式中.value);
  return 免资源 || !文本 ? { 可行动: true, 种类: '精力' as const, 提示: '' } : 行动资源门槛(data.value, 文本);
});
const 当前行动可提交 = computed(
  () =>
    !!输入文本.value.trim() && 当前资源门槛.value.可行动 && (!静音会议待散会选择.value || 静音会议会后选择合法.value),
);
const 发送按钮文案 = computed(() =>
  静音会议待散会选择.value ? '宣布散会' : 性爱待失控收尾.value ? '演出收尾' : '行动',
);
/** 回合输入组件公开接口:App 不再持有 textarea DOM,聚焦经组件 defineExpose 转发 */
type 回合输入公开接口 = { 聚焦: () => void };
const 回合输入 = ref<回合输入公开接口 | null>(null);
const 键盘视口们: VisualViewport[] = [];
let 键盘定位timer: ReturnType<typeof setTimeout> | undefined;
let 生成等待timer: ReturnType<typeof setInterval> | undefined;

/**
 * 未完成行动只进入宿主 tab 的 sessionStorage，不写游戏变量：刷新 iframe 后仍可恢复，
 * 但不会参与回档、变量解析或跨会话长期保存。聊天、末楼和末楼签名必须同时匹配。
 */
function 取回合恢复存储(): 回合恢复存储 | null {
  try {
    return (window.parent ?? window).sessionStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

function 当前回合恢复上下文(): 回合恢复上下文 | null {
  const 聊天ID = 当前聊天ID();
  if (!聊天ID) return null;
  let 锚楼: number;
  try {
    锚楼 = getLastMessageId();
  } catch {
    锚楼 = Math.max(0, (SillyTavern.chat?.length ?? 1) - 1);
  }
  return { 聊天ID, 锚楼, 锚签名: 手机锚消息签名(SillyTavern.chat?.[锚楼]) };
}

function 保存待恢复行动(行动: string): void {
  const 存储 = 取回合恢复存储();
  const 上下文 = 当前回合恢复上下文();
  const 文本 = 行动.trim();
  if (!存储 || !上下文 || !文本) return;
  保存回合恢复记录(存储, { ...上下文, 行动: 文本, 记录时间: Date.now() });
}

function 读取待恢复行动(): string {
  const 存储 = 取回合恢复存储();
  const 上下文 = 当前回合恢复上下文();
  if (!存储 || !上下文) return '';
  return 读取回合恢复记录(存储, 上下文)?.行动 ?? '';
}

function 恢复失败行动(): void {
  if (发送中.value || 失败行动.value) return;
  失败行动.value = 读取待恢复行动();
}

function 清除待恢复行动(): void {
  const 存储 = 取回合恢复存储();
  const 聊天ID = 当前聊天ID();
  if (存储 && 聊天ID) 清除回合恢复记录(存储, 聊天ID);
}

function 开始生成计时() {
  clearInterval(生成等待timer);
  生成等待秒.value = 0;
  const 起 = Date.now();
  生成等待timer = setInterval(() => {
    生成等待秒.value = Math.floor((Date.now() - 起) / 1000);
  }, 1000);
}

function 停止生成计时() {
  clearInterval(生成等待timer);
  生成等待timer = undefined;
  生成等待秒.value = 0;
}

function 让输入露出() {
  if (!键盘打开.value) return;
  // Android 酒馆全屏常用 overlay 键盘：键盘盖住 WebView，但 innerHeight、
  // visualViewport 和 iframe 高度全都不变。优先读取 VirtualKeyboard/视口实测值；
  // 宿主不报告时用手机键盘的保守占屏比兜底，直接把输入栏钉到键盘上沿。
  let 遮挡 = 0;
  const 虚拟键盘 = (
    navigator as Navigator & {
      virtualKeyboard?: { boundingRect?: { height: number } };
    }
  ).virtualKeyboard;
  遮挡 = Math.max(遮挡, Number(虚拟键盘?.boundingRect?.height ?? 0));
  // TauriTavern Android 主动消费 IME inset，不让 WebView/visualViewport 缩放，
  // 再把真实键盘高度写到宿主页 #sheld 的 --tt-ime-bottom。
  try {
    let 窗: Window = window;
    for (let i = 0; i < 8; i++) {
      const 壳 = 窗.document.getElementById('sheld');
      if (壳) {
        const 值 = Number.parseFloat(窗.getComputedStyle(壳).getPropertyValue('--tt-ime-bottom'));
        if (Number.isFinite(值)) 遮挡 = Math.max(遮挡, 值);
      }
      if (窗.parent === 窗) break;
      窗 = 窗.parent;
    }
  } catch {
    /* 跨域祖先不可读时继续使用 Web API 与占屏比兜底 */
  }
  for (const 窗 of [
    window,
    (() => {
      try {
        return window.parent;
      } catch {
        return null;
      }
    })(),
  ]) {
    if (!窗) continue;
    try {
      const 可视 = 窗.visualViewport;
      if (!可视) continue;
      遮挡 = Math.max(遮挡, 窗.innerHeight - 可视.height - 可视.offsetTop);
    } catch {
      /* 跨域父页不可读时只使用本页数据 */
    }
  }
  if (遮挡 < 80 && window.matchMedia('(max-width: 540px)').matches) {
    遮挡 = Math.round(window.innerHeight * 0.43);
  }
  document.documentElement.style.setProperty('--keyboard-inset', `${Math.max(0, Math.round(遮挡))}px`);
  try {
    const frame = window.frameElement as HTMLElement | null;
    frame?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  } catch {
    /* 真全屏或父页禁止滚动时，由固定输入栏兜底 */
  }
}

function 输入聚焦() {
  键盘打开.value = true;
  clearTimeout(键盘定位timer);
  // TT 的原生 WindowInsets 回调可能晚于 focus；分三拍读取，最后一拍会拿到
  // #sheld 上更新后的 --tt-ime-bottom。
  键盘定位timer = setTimeout(让输入露出, 180);
  setTimeout(让输入露出, 480);
  setTimeout(让输入露出, 820);
}

function 输入失焦() {
  clearTimeout(键盘定位timer);
  键盘定位timer = setTimeout(() => {
    键盘打开.value = false;
    document.documentElement.style.removeProperty('--keyboard-inset');
  }, 160);
}
/** 上次回合发生的房间(2026-07-20 玩家点单:人走出房间后撤回/重演一起藏,防跨场景回滚) */
const 回合房间 = ref<string | null>(null);

function 刷新可重掷() {
  const 变量 = getVariables({ type: 'chat' });
  const 记录 = _.get(变量, '_上次回合') as
    { chat快照?: { _场景?: { 房间id?: string } | null }; 可重掷?: boolean } | undefined;
  const 隔离记录 = _.get(变量, '_上次隔离回合') as { 房间?: string } | undefined;
  隔离可重掷.value = Boolean(隔离记录);
  可重掷.value = Boolean(隔离记录 || (记录 && 记录?.可重掷 !== false));
  // 回合开始前的 chat 快照才是“这轮发生在哪”的凭据。不能读当前 _场景：
  // 它既是对象而非房间名，又会在玩家走动后改变，曾导致对象与字符串永远不等、两钮全局消失。
  回合房间.value = 隔离记录?.房间 ?? 记录?.chat快照?._场景?.房间id ?? null;
  刷新工具由头();
}

/**
 * 点行动选项(2026-07-17 用户拍板:移动类选项从"拦"改"接住"——房间与角色名都是有限集,
 * 关键词解析即移动):选项带移动意图且指名地点/人名时,先把人挪过去再发。
 * 找人时用位置推算查她此刻真实在哪:在楼里就带过去;"外出"不是房间=不挪窝照常发,
 * 快照的"她不在场"纪律会让 AI 演一场扑空,真实不穿帮。
 */
// 紧邻匹配(2026-07-17 二版):移动动词后 ≤6 字内出现目标才算移动意图——
// "给101发消息找她确认"(找与101不相邻)不误触;"到"排除 想到/提到/说到 等表意搭配
const 移动动词组 = '去|前往|找|(?<![想提念说听猜料])到';

function 选项移动目标(文本: string): string | null {
  const 试 = (词: string) => new RegExp(`(?:${移动动词组})[^,。;!?、]{0,6}${_.escapeRegExp(词)}`).test(文本);
  const 房 = 房间表.find(r => 试(r.id) || 试(r.名称));
  if (房) return 房.id;
  const 牌 = 可见门牌.value.find(m => 试(户静态表[m].妻名));
  if (牌) {
    const 位 = 妻现位(牌);
    if (查房间(位)) return 位;
  }
  return null;
}

async function 点选项(文本: string) {
  if (静音会议正式中.value) {
    发出(文本);
    return;
  }
  const 目标 = 选项移动目标(文本);
  if (目标 && 目标 !== 当前房间.value && !(await 进入(目标))) return;
  发出(文本);
}

function 选择亲密收尾(位置: string): void {
  if (发送中.value || !性爱进行中.value || 性爱待失控收尾.value) return;
  待确认收尾位置.value = 待确认收尾位置.value === 位置 ? '' : 位置;
}

function 切换亲密主焦点(门牌号: 门牌): void {
  if (发送中.value || 性爱待失控收尾.value || 性爱主焦点.value?.门牌 === 门牌号) return;
  eventEmit('人妻公寓:切换性爱主焦点', 门牌号);
}

function 确认亲密收尾(): void {
  const 位置 = 待确认收尾位置.value;
  if (!位置 || 发送中.value || !性爱进行中.value || 性爱待失控收尾.value) return;
  if (!收尾选项.value.includes(位置)) {
    待确认收尾位置.value = '';
    return;
  }
  发出(`【亲密收尾:${位置}】主动选择在${位置}收束本场亲密互动。`);
}

function 确认失控收尾(): void {
  if (发送中.value || !性爱待失控收尾.value) return;
  const 位置 = 性爱场景.value.待收尾位置 || 默认失控位置(性爱场景.value);
  发出(`【失控收尾】体力耗尽，按当前行为在${位置}失控结束。`);
}

/** 发出一条行动(输入框与行动选项按钮共用) */
function 发出(文本: string) {
  文本 = 文本.trim();
  if (!文本 || 发送中.value) return;
  const 系统 = data.value.系统;
  if (!系统._待发送事件 && !系统._特殊场景.id && !静音会议正式中.value) {
    const 门槛 = 行动资源门槛(data.value, 文本);
    if (!门槛.可行动) {
      弹提示(门槛.提示);
      return;
    }
  }
  if (静音会议正式中.value) {
    if (静音会议交互幕.value || 静音会议场景.value.交互.状态 === '等待AI') return;
    if (静音会议自由待选择.value) return;
    if (静音会议待散会选择.value && !静音会议会后选择合法.value) {
      弹提示('宣布散会前，请选择至少一名留下的妻子。');
      return;
    }
    标记静音会议自由行动开始();
  }
  发送中.value = true;
  待重试行动.value = 文本;
  失败行动.value = '';
  保存待恢复行动(文本);
  流式段.value = [];
  // 乐观渲染:玩家行动先上卷轴,回合完成后由楼层数据重建
  卷轴.value.push({ 谁: '玩家', 文本: [文本.replace(/\n+/g, ' ')] });
  void 滚到底();
  if (静音会议待散会选择.value) {
    eventEmit('人妻公寓:静音会议散会', {
      行动: 文本,
      会后妻: [...静音会议会后选择.value],
    });
  } else {
    eventEmit('人妻公寓:玩家行动', 文本);
  }
}

async function 发送() {
  let 文本 = 输入文本.value.trim();
  if (!文本 || 发送中.value || 由头写入中.value || !当前行动可提交.value) return;
  输入文本.value = '';
  // 静默由头(2026-08-04 用户拍板):进未攻破户不再显示、不再表演修理借口——修理叙事
  // 已由楼务系统承担,借口戏只会让玩家整天都在修水管。次数照旧在后台限制(工具箱在包
  // +每户每天3次),记录沿用 _工具由头 的 {日,已用[]} 形状:工具名退化为内部计数令牌,
  // 回档按日期作废的语义不变。仍先确保记录落库再生成。
  if (需要由头.value && 可用由头.value.length) {
    const 用 = 可用由头.value[0];
    const 门牌号 = 当前房间.value!;
    const 今日 = 天数.value - 1;
    const 旧 = 工具由头记录.value[门牌号];
    const 已用 = 旧?.日 === 今日 && Array.isArray(旧.已用) ? [...旧.已用] : [];
    const 新记录 = { 日: 今日, 已用: [...new Set([...已用, 用])] };
    由头写入中.value = true;
    try {
      const 更新 = _.set({}, `_工具由头.${门牌号}`, 新记录);
      _.set(更新, '_场景', {
        房间id: 门牌号,
        破门: false,
        非法进入: 已破门进入.value,
        进房末楼: 进房末楼.value,
        由头已用: true,
      });
      await insertOrAssignVariables(更新, { type: 'chat' });
      工具由头记录.value = { ...工具由头记录.value, [门牌号]: 新记录 };
      本次入房由头已用.value = true;
    } catch (e) {
      输入文本.value = 文本;
      弹提示(`工具箱使用记录没有保存：${e instanceof Error ? e.message : String(e)}`);
      return;
    } finally {
      由头写入中.value = false;
    }
    // 不再点名工具、不再框定"检修":只告诉AI这是管理员的一次正当登门,剧情由玩家输入自己带。
    文本 = `(你以公寓管理员的身份敲开了这户的门)${文本}`;
  }
  发出(文本);
}

function 重掷() {
  if (发送中.value) return;
  发送中.value = true;
  流式段.value = [];
  if (卷轴.value.at(-1)?.谁 === '叙事') 卷轴.value.pop();
  void 滚到底();
  eventEmit(隔离可重掷.value ? '人妻公寓:隔离事件重掷' : '人妻公寓:重掷');
}

/** 撤回本回合:删掉你的行动与 AI 回应,回到落笔之前 */
function 撤回() {
  if (发送中.value) return;
  if (隔离可重掷.value) {
    发送中.value = true;
    流式段.value = [];
    eventEmit('人妻公寓:隔离事件撤回');
    return;
  }
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

function 放弃并重试() {
  if (!发送中.value || !待重试行动.value) return;
  取消后自动重试.value = true;
  取消回合();
}

function 重试失败行动() {
  const 文本 = 失败行动.value.trim();
  if (!文本 || 发送中.value) return;
  失败行动.value = '';
  发出(文本);
}

// ── 行动选项(脚本每回合从 <options> 块提取,存 chat 变量) ──

const 行动选项 = ref<string[]>([]);

function 刷新行动选项() {
  const v = _.get(getVariables({ type: 'chat' }), '_行动选项');
  行动选项.value = Array.isArray(v) ? (v as string[]).filter(x => typeof x === 'string' && x.trim()) : [];
}

// ── 序章:开始新游戏(A4 难度三档局部状态已移入 序章标题屏.vue,App 只留业务接线) ──

function 开始考验(难度: string) {
  if (!难度 || 发送中.value) return;
  发送中.value = true;
  eventEmit('人妻公寓:开始新游戏', 难度);
}

// ── 待办软引导(开局流程③:拿钥匙看信箱→101报修→102认门→回管理员室;不硬锁) ──

const 待办定义 = [
  { 键: '信箱区', 文字: '去信箱看看租约单子' },
  // 到场即打勾的软引导,文字不能许诺"修好"(2026-08-03 玩家实测:写"修水管"会误以为到场就算修过;
  // 真正动工要在房内点楼务瓷砖,由脚本结算)。
  { 键: '101', 文字: '去 101 看看水管报修' },
  { 键: '102', 文字: '去 102 登门认识住户' },
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
const 显示待办 = computed(() => !待办已划掉.value && 末楼号.value < 24 && 待办列表.value.some(t => !t.完成));

// ── 档案卡 ──

const 选中门牌 = ref<门牌 | null>(null);
const CG图库门牌 = ref<门牌 | null>(null);

function 打开CG图库(门牌号: 门牌): void {
  CG图库门牌.value = 门牌号;
}

function 关闭CG图库(): void {
  CG图库门牌.value = null;
}

function 开口要钱(门牌号: 门牌) {
  eventEmit('人妻公寓:要钱', 门牌号);
}

function 晋阶(门牌号: 门牌) {
  eventEmit('人妻公寓:请求晋阶', 门牌号);
  选中门牌.value = null;
}

// ── 背包(道具可用:布设/送礼/读信) ──

const 显示背包 = ref(false);

/** 信物品名 → 门牌(五渠道揭晓实物:拼合的信/观察笔记/考古辑录/街坊札记/酒后真言) */
function 信物门牌(名: string): 门牌 | null {
  const m = 名.match(/^(?:拼合的信|观察笔记|考古辑录|街坊札记|酒后真言)·(.+)$/);
  if (!m) return null;
  return (门牌列表.find(k => 户静态表[k].妻名 === m[1]) ?? null) as 门牌 | null;
}

/** 134张道具不再都伪装成同一种商品缩略图：按真实用途进入四套卡片语法。 */
function 道具视觉信息(配?: 道具配置, 可读信 = false): { 类: 道具视觉类型; 标: string; 图: string } {
  if (可读信) return { 类: 'evidence', 标: '证物', 图: 'letter' };
  if (配?.类别 === '特殊场景') return { 类: 'scene', 标: '场景票', 图: 'scene' };
  if (配 && ['工具', '补给', '运作', '药物', '性癖'].includes(配.类别)) return { 类: 'action', 标: '操作', 图: 'tool' };
  return { 类: 'product', 标: '物品', 图: 配?.类别 === '服饰' ? 'dress' : 'gift' };
}

const 背包列表 = computed(() =>
  (data.value?.背包 ?? []).map(id => {
    const 配 = 查道具(id);
    const 性 = 配?.类别 === '性癖' ? 查性癖(id) : undefined;
    const 信门牌 = 信物门牌(id);
    const 房 = 当前房间.value ? 查房间(当前房间.value) : undefined;
    const 在户内 = !!房 && 房.类型 === '户' && 房.id !== '302' && Boolean(data.value.户[房.id]);
    const 是户向运作 = 配?.类别 === '运作' && ['钓鱼团购券', '夜班内推', '外地项目介绍', '代订惊喜'].includes(id);
    const 全局运作候选 =
      配?.类别 === '运作' && !是户向运作
        ? 列出阶段线路候选详情(data.value, { 类型: '运作', 标识: id, 楼层: 绝对时段.value })
        : [];
    const 全局线路候选 = 全局运作候选.length === 1 ? 全局运作候选[0] : undefined;
    const 母亲 = data.value.户['302']?.妻;
    const 安眠药圆场对象 =
      id === '安眠药'
        ? 可见门牌.value
            .filter(m => 妻在玩家身边(m) && 安眠药可圆场(data.value, m))
            .map(m => ({ 门牌: m, 妻名: 户静态表[m].妻名, 提示: '交给她处理即将到来的丈夫登门' }))
        : [];
    const 母亲赠送项 = 母亲
      ? {
          门牌: '302' as 门牌,
          妻名: '妈',
          可送: !配?.服饰 || 母亲.当前阶段 !== 0 || (母亲.裂缝.已确认 && 是母亲破墙服饰(id)),
          提示:
            配?.服饰 && 母亲.当前阶段 === 0
              ? !母亲.裂缝.已确认
                ? '先从裂缝线索看懂她'
                : 是母亲破墙服饰(id)
                  ? '这件也许真是为她本人挑的'
                  : '她不会把这件当成自己的'
              : '',
        }
      : null;
    return {
      id,
      名称: 配?.名称 ?? id,
      描述: 配?.描述 ?? (信门牌 ? '四条线索拼在一起的东西。读它=看清她的裂缝' : ''),
      视觉: 道具视觉信息(配, !!信门牌),
      // 读信:碎片集齐后的揭晓时刻
      可读信: !!信门牌 && !data.value.户[信门牌]?.妻.裂缝.已确认,
      信门牌,
      // 摄像头:须在已入住户的房内且屋里没人
      可布设: id === '针孔摄像头' && 在户内 && !房内有人在(当前房间.value!),
      可使用录像带:
        id === '录像带' &&
        当前房间.value === '管理员室' &&
        !data.value.系统._特殊场景.id &&
        !data.value.系统._已完成特殊场景.includes('录像带'),
      可筹备静音会议:
        id === '静音会议' &&
        当前房间.value === '管理员室' &&
        !data.value.系统._特殊场景.id &&
        !data.value.系统._已完成特殊场景.includes('静音会议'),
      // 安全套只允许在空闲时为下一场准备；进行中不展示一个注定会被后端拒绝的按钮。
      可用资源: !!配?.资源效果 && !(id === '安全套' && 性爱进行中.value),
      // 礼物等可送出:须与她同处一室；普通药物不走“送”，安眠药只在丈夫登门圆场窗口例外。
      // 性癖=装载；302特例:回家时可送妈东西——破妈妈墙的唯一入口,入列前也通。
      可送对象:
        id === '安眠药'
          ? 安眠药圆场对象
          : !配?.常驻 &&
              id !== '录像带' &&
              id !== '静音会议' &&
              !信门牌 &&
              id !== '针孔摄像头' &&
              !['补给', '运作', '工具', '药物', '性癖'].includes(配?.类别 ?? '')
            ? [
                ...可见门牌.value
                  .filter(m => 妻在玩家身边(m))
                  .map(m => (m === '302' && 母亲赠送项 ? 母亲赠送项 : { 门牌: m, 妻名: 户静态表[m].妻名 })),
                ...(当前房间.value === '302' && 母亲赠送项 ? [母亲赠送项] : []),
              ].filter((v, i, a) => a.findIndex(x => x.门牌 === v.门牌) === i)
            : [],
      // 性癖装载(P5):对象=阶段够档且槽未满的妻(不必同室,装载是管理动作)
      可装载对象:
        配?.类别 === '性癖'
          ? 可见门牌.value
              .filter(m => {
                const 妻 = data.value.户[m]?.妻;
                if (!性 || !妻) return false;
                if (性.限定户 && !性.限定户.includes(m)) return false;
                const 母亲终局开幕窗口 =
                  m === '302' &&
                  id === 户静态表['302'].招牌性癖 &&
                  妻.当前阶段 === 4 &&
                  妻._阶段线路.目标阶段 === 5 &&
                  妻._阶段线路.活跃节点 === 1;
                return (
                  (妻.当前阶段 >= (性.档 === 5 ? 5 : 4) || 母亲终局开幕窗口) &&
                  妻.性癖装载.length < 3 &&
                  !妻.性癖装载.includes(id)
                );
              })
              .map(m => {
                const 妻 = data.value.户[m]!.妻;
                const 时段可用 =
                  妻.曾开发性癖.includes(id) || !性?.开幕允许时段 || 性.开幕允许时段.includes(时段.value);
                return {
                  门牌: m,
                  妻名: 户静态表[m].妻名,
                  时段可用,
                  时段提示: 时段可用 ? '' : 性!.开幕允许时段!.join('或'),
                };
              })
          : [],
      // 运作道具(P3):全局四件直接"使用";户向四件按丈夫点名(须该户已入住且有夫)
      可用运作: 配?.类别 === '运作' && !是户向运作 && 全局运作候选.length <= 1,
      全局线路候选,
      全局运作对象: 全局运作候选.length > 1 ? 全局运作候选 : [],
      运作对象: 是户向运作
        ? 可见门牌.value
            .filter(m => 户静态表[m].夫名)
            .map(m => ({ 门牌: m, 夫名: 户静态表[m].夫名, 时段可用: id !== '夜班内推' || 时段.value === '晚上' }))
        : [],
    };
  }),
);

function 用运作(道具id: string, 门牌号?: 门牌, 候选?: 阶段线路候选) {
  显示背包.value = false;
  eventEmit('人妻公寓:使用运作', {
    道具id,
    门牌: 门牌号,
    预期目标阶段: 候选?.目标阶段,
    预期节点: 候选?.节点,
  });
}

function 用资源道具(道具id: string) {
  显示背包.value = false;
  eventEmit('人妻公寓:使用资源道具', 道具id);
}

function 装载(道具id: string, 门牌号: 门牌) {
  显示背包.value = false;
  eventEmit('人妻公寓:装载性癖', { 道具id, 门牌: 门牌号 });
}

function 卸载(门牌号: 门牌, 性癖id: string) {
  eventEmit('人妻公寓:卸载性癖', { 门牌: 门牌号, 性癖id });
}

// ── 商店(P3 八页签框架:工具/人情/运作常驻,余者随进度亮起——商店自己就是进度条) ──

const 显示商店 = ref(false);

const 货架 = computed(() => {
  const 全部 = Object.values(道具表).filter(d => (d.价格 ?? 0) > 0);
  const 按类 = (类: 道具配置['类别']) => 全部.filter(d => d.类别 === 类);
  const 户们 = Object.values(data.value?.户 ?? {});
  const 最高阶段 = 户们.reduce((高, 节点) => Math.max(高, 节点.妻.当前阶段), 0);
  const 架: { 页签: string; 商品: 道具配置[]; 空文案?: string }[] = [
    { 页签: '工具', 商品: 按类('工具') },
    { 页签: '补给', 商品: 按类('补给') },
    { 页签: '人情', 商品: 按类('人情') },
    { 页签: '运作', 商品: 按类('运作') },
  ];
  if (户们.some(节点 => 节点.妻.裂缝.已确认)) 架.push({ 页签: '礼物', 商品: 按类('礼物') });
  // 进度页签:亮起即奖励
  // 服饰(P5 已上架):只上"≤全楼最高阶段+1"档的货——买得到的永远比走到的多一档(进度奖励)
  if (最高阶段 >= 2)
    架.push({
      页签: '服饰',
      商品: 按类('服饰').filter(d => (d.服饰?.档 ?? 9) <= Math.min(5, 最高阶段 + 1)),
      空文案: '新一季衣装正在打包发货——很快上架。',
    });
  // 特殊场景：九场始终可见，前置不足显示锁定条件；男用贞操带等无场景配置商品常驻。
  if (最高阶段 >= 3)
    架.push({
      页签: '特殊场景',
      商品: 按类('特殊场景'),
      空文案: '有些节目要等合适的人到齐才开演。',
    });
  if (最高阶段 >= 4) 架.push({ 页签: '性癖', 商品: 按类('性癖'), 空文案: '这一栏的货,认人。到货会通知你。' });
  // 药物页签不常驻(P5):母亲首夜线路或丈夫登门圆场窗口开启时才展示。
  if (
    (data.value?.系统?._母亲入列 && (data.value.户['302']?.妻.当前阶段 ?? 0) >= 2) ||
    丈夫登门药物窗口已开启(data.value)
  ) {
    架.push({ 页签: '药物', 商品: 按类('药物'), 空文案: '柜台下面的东西,问了才有。' });
  }
  return 架;
});

function 商品锁定原因(商品: 道具配置): string[] {
  const 场景 = 查特殊场景(商品.id);
  if (!场景) return [];
  const 前置 = 特殊场景锁定状态(data.value as never, 商品.id);
  const 缺少 = [...前置.缺少];
  if (场景.允许时段 && !场景.允许时段.includes(时段.value)) 缺少.push(`须在${场景.允许时段.join('或')}开演`);
  return 缺少;
}

function 商品购买文案(商品: 道具配置): string {
  const 允许 = 查特殊场景(商品.id)?.允许时段;
  return 允许 && !允许.includes(时段.value) ? `${允许.join('或')}开演` : '买下';
}

function 买(道具id: string) {
  eventEmit('人妻公寓:购买', 道具id);
}

function 送出(道具id: string, 门牌号: 门牌) {
  显示背包.value = false;
  eventEmit('人妻公寓:送礼', { 道具id, 门牌: 门牌号 });
}

// ── 侦探:翻垃圾 / 摄像头 / 偷窥选细节 / 读信 ──

const 垃圾袋列表 = computed(() => 可见门牌.value.map(m => ({ 门牌: m, 妻名: 户静态表[m].妻名 })));
const 垃圾选择开 = ref(false);

function 翻(门牌号: 门牌) {
  eventEmit('人妻公寓:翻垃圾', 门牌号);
}

async function 选垃圾袋(门牌号: 门牌) {
  垃圾选择开.value = false;
  const 变量 = getVariables({ type: 'chat' });
  const 旧轨迹 = (_.get(变量, '_地图轨迹') as string[] | undefined) ?? [];
  await insertOrAssignVariables(
    { _地图轨迹: [...旧轨迹, `在垃圾房翻查${门牌号}室的垃圾`].slice(-8) },
    { type: 'chat' },
  );
  翻(门牌号);
}

function 布设() {
  if (!当前房间.value) return;
  显示背包.value = false;
  eventEmit('人妻公寓:布设摄像头', 当前房间.value);
}

const 显示监控 = ref(false);

/**
 * 监控列表改响应式(2026-07-17 用户反馈:装完摄像头按钮不立刻弹):手动刷新的 ref 会在
 * store 拉回新账之前读到旧数据,之后又无人再刷;computed 跟着 store 走,数据一到位自动弹。
 * 布设名单只读 stat 主账，与背包在同一个楼层快照中同生共死。
 */
const 监控列表 = computed<门牌[]>(() => {
  const 布设 = (data.value?.系统 as { _摄像头布设?: Record<string, boolean> } | undefined)?._摄像头布设 ?? {};
  return 门牌列表.filter(m => 布设[m]);
});

async function 看监控(门牌号: 门牌) {
  显示监控.value = false;
  // 2026-07-17 用户拍板:看监控=回302自己屋里看,再跑偷窥AI回合出正文,完成后弹选择。
  // 先完成真实移动；取消亲密离场或场景写入失败时，不能提前消耗监控冷却或开启演出。
  if (!(await 确认已到达动作地点('302'))) return;
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

const 裂缝证物槽 = computed(() => {
  const 渠道 = 选中门牌.value ? 查裂缝(选中门牌.value)?.渠道 : undefined;
  const 同类 = (标: string, 图: string) => Array.from({ length: 4 }, () => ({ 标, 图 }));
  if (渠道 === '翻垃圾') return 同类('垃圾证物', 'trash');
  if (渠道 === '摄像头') return 同类('监控观察', 'cctv');
  if (渠道 === '打听') return 同类('邻里口供', 'peep');
  if (渠道 === '丈夫') return 同类('丈夫酒话', 'favor');
  if (渠道 === '动态广场') return 同类('旧动态', 'book');
  if (渠道 === '特例双拼')
    return [
      { 标: '父亲来电', 图: 'phone' },
      { 标: '电话余音', 图: 'phone' },
      { 标: '旧动态', 图: 'book' },
      { 标: '旧动态', 图: 'book' },
    ];
  return 同类('未明线索', 'search');
});

// ── 剧情卷轴:全部楼层清洗后重建(伪单楼) ──

const 卷轴 = ref<卷轴条[]>([]);
/** A8a:正文卷轴迁入 components/正文卷轴.vue 后,滚到底经此公开接口(组件内守根滚动 DOM)。 */
type 正文卷轴公开接口 = { 滚到底: () => void };
const 正文卷轴 = ref<正文卷轴公开接口 | null>(null);
const 显示史册 = ref(false);
const 史册容器 = ref<HTMLElement | null>(null);
const 事件提示词文本 = ref('');

function 打开事件提示词(提示词: string) {
  事件提示词文本.value = 提示词;
}

async function 史册到最新() {
  await nextTick();
  const 容器 = 史册容器.value;
  if (容器) 容器.scrollTo({ top: 容器.scrollHeight, behavior: 'smooth' });
}

async function 打开史册() {
  显示史册.value = true;
  await nextTick();
  const 容器 = 史册容器.value;
  if (容器) 容器.scrollTop = 容器.scrollHeight;
}

/** 正文书页只演当前幕:从最后一条玩家行动起;完整历史在史册 */
const 当前幕 = computed(() => {
  const 列表 = 卷轴.value;
  if (!列表.length) return [];
  let 起 = 列表.length - 1;
  while (起 > 0 && 列表[起].谁 !== '玩家') 起 -= 1;
  return 列表[起].谁 === '玩家' ? 列表.slice(起) : 列表;
});

// 玩家预设兼容:按玩家自己酒馆里的显示向正则(仅全局+预设)跑一遍
let 玩家正则表: 玩家正则项[] = [];

function 刷新玩家正则() {
  try {
    // 分源读取:预设正则读取失败不连累全局正则(2026-07-17 摘要块漏显修复)
    const 原: ReturnType<typeof getTavernRegexes> = [];
    try {
      原.push(...getTavernRegexes({ type: 'global' }));
    } catch (e) {
      console.warn('[人妻公寓客户端] 读取全局正则失败:', e);
    }
    try {
      原.push(...getTavernRegexes({ type: 'preset', name: 'in_use' }));
    } catch (e) {
      console.warn('[人妻公寓客户端] 读取预设正则失败:', e);
    }
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

let 当前预设正文标签: 预设正文标签 | null = null;

function 刷新当前预设正文标签(): void {
  当前预设正文标签 = 读取当前预设正文标签();
}

function 清洗(原文: string, 流式 = false): string {
  const 协议清 = 清洗预设输出(原文, 流式 ? 当前预设正文标签 : null);
  if (流式 && 当前预设正文标签 && !协议清.正文已开始) return '';
  const 闭合清 = 协议清.文本
    // content 包裹型预设：正文边界明确时只显示 content，兼容思考标签开闭名称不一致。
    // 未闭合 content 也只裁掉前缀，保留其后的正文；流式生成时同样不会露出思考区。
    .replace(/^[\s\S]*?<content\b[^>]*>/i, '')
    .replace(/<\/content\s*>[\s\S]*$/i, '')
    // story_scene 与 content 同为正文包装：保留内部剧情、剥掉标签外的预设噪声。
    // 未闭合开标签也只裁前缀，兼容流式半截输出。
    .replace(/^[\s\S]*?<story_scene\b[^>]*>/i, '')
    .replace(/<\/story_scene\s*>[\s\S]*$/i, '')
    .replace(/【开始思考】[\s\S]*?<\/think_fox~\s*>/gi, '')
    .replace(/<fox_selc\b[^>]*>[\s\S]*?<\/fox_selc\s*>/gi, '')
    .replace(/<fox_tip\b[^>]*>[\s\S]*?<\/fox_tip\s*>/gi, '')
    // Izumi 预设：konatan_planning~ 是思考规划，tucao 是正文后的吐槽/总结；两块均不显示。
    .replace(/<konatan_planning~[^>]*>[\s\S]*?<\/konatan_planning~\s*>/gi, '')
    .replace(/<tucao\b[^>]*>[\s\S]*?<\/tucao\s*>/gi, '')
    // TG：SexualScene 内是应显示的特写剧情；w2g/校验/免责声明不属于正文。
    .replace(/<\/?SexualScene\b[^>]*>/gi, '')
    .replace(/<(VariableCheck|Disclaimer|w2g)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    // 双人成行的摘要、选项、平行世界与前端组件只供该预设渲染，不混入游戏卷轴。
    .replace(/<(meow_FM|branches|parallel_world|historic_events|htm1fenge)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(
      /<(?:VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)\b[^>]*>[\s\S]*$/i,
      '',
    )
    .replace(
      /<\/?(?:content|story_scene|now_plot|think_fox~|fox_selc|fox_tip|konatan_planning~|tucao|SexualScene|VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)(?:\s[^>]*)?>/gi,
      '',
    )
    // 兼容漏写 </draft_notes> 的玩家预设：只在后续完整 bginfor 提供可靠边界时整块删除。
    // 没有可靠边界时只剥标签，避免重演“清洗吞尾导致整段正文消失”。
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<\/draft_notes\s*>/gi, '')
    .replace(/<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<CEstuff\b[^>]*>[\s\S]*?<\/CEstuff\s*>/gi, '')
    .replace(/<\/?(?:draft_notes|bginfor|CEstuff)\b[^>]*>/gi, '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable\s*>/gi, '')
    .replace(/<json_?patch\b[^>]*>[\s\S]*?<\/json_?patch\s*>/gi, '')
    .replace(/<StatusPlaceHolderImpl\/>/g, '')
    // 预设的摘要/折叠块(<details>)只藏不删:楼层原文保留给 AI 与预设当记忆,显示层吞掉
    .replace(/<details[^>]*>[\s\S]*?<\/details>/gi, '')
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*-{2,}>?\s*$/gm, '')
    .replace(/<options\b[^>]*>[\s\S]*?<\/options\s*>/gi, '')
    .replace(/<行为等级(?:\s[^>]*)?>[\s\S]*?<\/行为等级\s*>/gi, '')
    .replace(/<尺度判定(?:\s[^>]*)?>[\s\S]*?(?:<\/尺度判定\s*>|$)/gi, '')
    .replace(/<\/(?:UpdateVariable|json_?patch|options|行为等级|尺度判定)\s*>/gi, '')
    // 玩家预设夹带的整篇 HTML 组件(2026-07-18 玩家实测,同脚本侧 清洗正文):裸代码墙整体剥除
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*?```/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?<\/html\s*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // 兼容玩家预设用作换行但没有闭合的裸 <p>。
    .replace(/<\/?p(?:\s[^>]*)?>/gi, '\n')
    // 玩家预设夹带的包装 div(2026-07-19,同脚本侧):konata-thinking-wrapper/tucao-w 等
    // 空壳或漏闭合裸 div 剥壳，保留其中正文。
    .replace(/<\/?div[^>]*>/gi, '');
  const 全清 = 闭合清
    // 未闭合块也吞掉:流式=防半截标记块闪现;完整楼层=防截断残块
    .replace(/<details[^>]*>[\s\S]*$/i, '')
    .replace(/<think(?:ing)?>[\s\S]*$/i, '')
    .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
    .replace(/<!--[\s\S]*$/, '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*$/i, '')
    .replace(/<json_?patch\b[^>]*>[\s\S]*$/i, '')
    .replace(/<options\b[^>]*>[\s\S]*$/i, '')
    .replace(/<行为等级(?:\s[^>]*)?>[\s\S]*$/i, '')
    .replace(/<尺度判定(?:\s[^>]*)?>[\s\S]*$/i, '')
    .replace(/<tucao\b[^>]*>[\s\S]*$/i, '')
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*$/i, '')
    .replace(/<!DOCTYPE[\s\S]*$/i, '')
    .replace(/<style[^>]*>[\s\S]*$/i, '')
    .replace(/<script[^>]*>[\s\S]*$/i, '')
    .trim();
  // 吞尾防误杀(2026-07-17,与脚本侧 清洗正文 同款):AI 把协议标记漏闭合写在开头时,
  // 吞尾会把整楼显示成空白——完整楼层回退只清闭合块,顺手剥掉裸标记词;流式期间不回退
  if (!流式 && !全清 && 闭合清.trim()) {
    console.warn('[人妻公寓客户端] 显示层吞尾把楼层吞成了空白,回退只清闭合块');
    return 清除末尾裸JSON补丁(
      清除末尾残缺协议标签(
        闭合清
          .replace(
            /<\/?(?:think(?:ing)?|reason(?:ing)?|UpdateVariable|json_?patch|options|行为等级|尺度判定|details[^>]*|konatan_planning~|tucao|now_plot|SexualScene|VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)>/gi,
            '',
          )
          .trim(),
      ),
    );
  }
  return 清除末尾裸JSON补丁(清除末尾残缺协议标签(全清));
}

async function 滚到底() {
  await nextTick();
  正文卷轴.value?.滚到底();
}

let 卷轴请求序号 = 0;

async function 取卷轴() {
  const 请求序号 = ++卷轴请求序号;
  try {
    刷新玩家正则();
    const 末楼 = getLastMessageId();
    const 消息组 = (await getChatMessages(`0-${末楼}`)) ?? [];
    if (请求序号 !== 卷轴请求序号) return;
    末楼号.value = 末楼;
    const 条目: 卷轴条[] = [];
    for (const 消息 of 消息组) {
      const 是玩家 = 消息.role === 'user';
      const 原文 = 消息.message ?? '';
      const 净文 = 清洗(过酒馆正则(原文, 是玩家 ? 'user_input' : 'ai_output', 末楼 - 消息.message_id));
      if (!净文) continue;
      // 0 楼藏着界面占位标记,整楼写回会砸掉客户端,不开放编辑
      const 可编辑 = 消息.message_id > 0 ? { 原文 } : {};
      if (是玩家) {
        条目.push({
          谁: '玩家',
          文本: [净文.replace(/\n+/g, ' ')],
          楼: 消息.message_id,
          _排序: 消息.message_id * 10000,
          ...可编辑,
        });
      } else {
        条目.push({
          谁: '叙事',
          文本: 净文
            .split(/\n+/)
            .map(s => s.trim())
            .filter(Boolean),
          楼: 消息.message_id,
          _排序: 消息.message_id * 10000,
          可回档: 消息.message_id > 0 && 消息.message_id < 末楼,
          ...可编辑,
        });
      }
    }
    const 事件日志 = _.get(getVariables({ type: 'chat' }), '_隔离事件.日志');
    if (Array.isArray(事件日志)) {
      for (const 原 of 事件日志) {
        if (!原 || (原.谁 !== '玩家' && 原.谁 !== '叙事') || typeof 原.文本 !== 'string') continue;
        const 净文 = 清洗(过酒馆正则(原.文本, 原.谁 === '玩家' ? 'user_input' : 'ai_output', 0));
        if (!净文) continue;
        条目.push({
          谁: 原.谁,
          文本:
            原.谁 === '玩家'
              ? [净文.replace(/\n+/g, ' ')]
              : 净文
                  .split(/\n+/)
                  .map((s: string) => s.trim())
                  .filter(Boolean),
          事件id: String(原.id ?? ''),
          事件提示词: typeof 原.提示词 === 'string' ? 原.提示词 : undefined,
          _排序: Number(原.锚楼 ?? 0) * 10000 + 100 + Number(原.序 ?? 0),
        });
      }
    }
    条目.sort((a, b) => (a._排序 ?? 0) - (b._排序 ?? 0));
    卷轴.value = 条目;
    待回档楼.value = null;
    await 滚到底();
  } catch (e) {
    console.error('[人妻公寓客户端] 取卷轴失败:', e);
  }
}

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

// ── 界面偏好/沉浸全屏:共享单例 useUIPrefs(App 首次带时段/画幅/错误回调,设置弹窗组件共享同一实例) ──

const {
  设置开,
  暗色,
  移动端,
  全屏中,
  显示移动端全屏引导,
  切换主题,
  切换全屏,
  打开移动端全屏,
  继续窗口模式,
  进真全屏,
  立绘显示,
  省流,
  初始化,
  销毁,
} = useUIPrefs({
  timePeriod: 时段,
  syncViewport: 同步画幅,
  reportFullscreenError: 消息 => {
    错误信息.value = 消息;
  },
});

/** 同源浏览器 Window 在运行时暴露 eval，可动态 import 酒馆正在运行的模块实例；标准 Window 类型未声明该成员，此处局部做结构扩展，不改全局 Window。 */
type 宿主窗口接口 = Window & { eval: (source: string) => unknown };

async function 读取酒馆原生提示词模块(宿主窗口: 宿主窗口接口): Promise<酒馆原生提示词模块 | null> {
  try {
    // 固定路径只在已验证可读的同源宿主窗口执行，确保复用酒馆正在运行的模块实例及其内存状态。
    const 候选 = (await 宿主窗口.eval('import("/script.js")')) as Partial<酒馆原生提示词模块> | null;
    if (typeof 候选?.promptItemize !== 'function' || !Array.isArray(候选.itemizedPrompts)) return null;
    return 候选 as 酒馆原生提示词模块;
  } catch (e) {
    console.warn('[人妻公寓客户端] 无法导入酒馆原生提示词模块，退回消息按钮:', e);
    return null;
  }
}

/** 复用酒馆每条消息「… → Prompt」的原生入口；传入楼号，只打开这一回合。 */
// 关闭监测轮询提到模块级:原生窗口最长挂 5 分钟,期间界面若被销毁必须能在 onUnmounted 收掉(2026-08-03 审计 L10)
let 原生弹窗轮询: number | undefined;

async function 打开楼层提示词(楼: number) {
  const 同源窗口们: Window[] = [];
  try {
    let 窗: Window = window;
    for (let i = 0; i < 8; i++) {
      // 读取 document 本身就是同源校验；一旦遇到跨域祖先，catch 会保留此前收集结果。
      void 窗.document;
      if (!同源窗口们.includes(窗)) 同源窗口们.push(窗);
      if (窗.parent === 窗) break;
      窗 = 窗.parent;
    }
  } catch {
    // 跨域祖先不可读时，仍保留已经收集到的同源窗口。
  }
  const 文档们 = 同源窗口们.map(窗 => 窗.document);
  const 宿主窗口 = 同源窗口们.find(窗 => Boolean(窗.document.querySelector('#chat'))) ?? 同源窗口们.at(-1) ?? window;
  const 宿主文档 = 宿主窗口.document;
  const 楼号 = Math.trunc(楼);
  let 入口: HTMLElement | null = null;
  let 入口文档: Document = document;
  for (const 根文档 of 文档们) {
    const 消息 = [...根文档.querySelectorAll<HTMLElement>('.mes[mesid]')].find(
      el => Number(el.getAttribute('mesid')) === 楼号,
    );
    入口 = 消息?.querySelector<HTMLElement>('.mes_prompt') ?? null;
    if (入口) {
      入口文档 = 根文档;
      break;
    }
  }

  // 宿主窗口来自同源窗口列表(已过 document 同源检查)或 window，同源必有 eval；只在此做一次局部结构断言。
  const 原生模块 = await 读取酒馆原生提示词模块(宿主窗口 as 宿主窗口接口);
  if (原生模块) {
    const 有这一回合 = 原生模块.itemizedPrompts.some(
      item => Number((item as { mesId?: unknown } | null)?.mesId) === 楼号,
    );
    if (!有这一回合) {
      弹提示('这一回合没有保存可查看的提示词。', 4000);
      return;
    }
  } else {
    if (!入口) {
      弹提示('暂时无法调用酒馆原生提示词入口，请在酒馆消息菜单中重试。', 5000);
      return;
    }
    const 样式 = 入口文档.defaultView?.getComputedStyle(入口) ?? getComputedStyle(入口);
    if (样式.display === 'none') {
      弹提示('这一回合没有保存可查看的提示词。', 4000);
      return;
    }
  }

  const 文档 = document as 全屏文档;
  const 原本全屏 = Boolean(document.fullscreenElement ?? 文档.webkitFullscreenElement);
  if (原本全屏) {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else 文档.webkitExitFullscreen?.();
    } catch {
      /* 即使退出失败也尝试唤起原生窗口 */
    }
  }

  let 弹窗文档 = 宿主文档;
  if (原生模块) {
    // promptItemize 会等弹窗关闭才 resolve，不能 await，否则会错过下方的关闭监测。
    const 原生调用 = 原生模块.promptItemize(原生模块.itemizedPrompts, 楼号);
    void Promise.resolve(原生调用).catch(e => {
      console.warn('[人妻公寓客户端] 打开酒馆原生提示词窗口失败:', e);
      弹提示('酒馆原生提示词窗口打开失败，请稍后重试。', 4000);
    });
  } else {
    if (!入口) return;
    弹窗文档 = 入口文档;
    // 兼容无法动态导入模块的酒馆版本；原生监听的是 pointerup，不是 click。
    const Pointer事件 = 入口文档.defaultView?.PointerEvent ?? PointerEvent;
    入口.dispatchEvent(new Pointer事件('pointerup', { bubbles: true, cancelable: true }));
  }

  // 原生窗口挂在父文档；若本按钮替玩家退出了全屏，等原生窗口真正关闭后再恢复。
  if (原本全屏) {
    let 看见窗口 = false;
    let 次数 = 0;
    window.clearInterval(原生弹窗轮询);
    原生弹窗轮询 = window.setInterval(() => {
      次数++;
      const 有窗口 = Boolean(弹窗文档.querySelector('dialog[open], [role="dialog"], .popup[open]'));
      看见窗口 ||= 有窗口;
      if ((看见窗口 && !有窗口) || 次数 > 1200) {
        window.clearInterval(原生弹窗轮询);
        原生弹窗轮询 = undefined;
        if (看见窗口) void 进真全屏().catch(e => console.warn('[人妻公寓客户端] 原生提示词关闭后恢复全屏失败:', e));
      }
    }, 250);
  }
}

// 首次进入序章时主动说明安装顺序；状态/检测/安装动作整体在 首次准备.vue，App 只留开关与入口。
// autoOpen(就绪且序章未完成) 由组件读版本化 storage key 后自动打开。
const 首次说明开 = ref(false);
function 打开首次说明() {
  首次说明开.value = true;
}

/** 首次准备组件的轻提示(未检测插件等)转发到 App toast；confirm/alert 仍在组件内走宿主窗口。 */
function 转发首次准备提示(文本: string, 时长: number) {
  弹提示(文本, 时长);
}

/** 隐藏正文(gal惯例小开关:渐隐文字层欣赏立绘;只由按钮开关,再按恢复;不入偏好不持久) */
const 正文隐藏 = ref(false);

// ── 重开一局(两段式确认;真重置在脚本侧:删楼+清过程变量,完成后 iframe 自刷回标题屏) ──

const 重开确认 = ref(false);

// 弹窗一关就撤销"待确认"武装态,防下次误触(轮询生命周期由设置弹窗组件 watch 设置开 自理)
watch(设置开, 开 => {
  if (!开) 重开确认.value = false;
});

function 点重开() {
  // 生成中不受理(审计 C6):脚本侧回合进行中会拒绝重开,乐观置上的 发送中 若无人回事件
  // 就永久闩死;脚本侧同样已改为拒绝时回 回合失败,双保险
  if (发送中.value) return;
  if (!重开确认.value) {
    重开确认.value = true;
    return;
  }
  重开确认.value = false;
  设置开.value = false;
  发送中.value = true; // 清场期间锁输入,收到"已重开"即整页重建
  eventEmit('人妻公寓:重开一局');
}

// ── 提示 toast ──

const 提示文本 = ref('');
/** 拾获卡:带【】的重要提示(线索/收获)驻留展示,点击收下;开新回合自动收 */
const 拾获卡 = ref('');
let 提示timer: ReturnType<typeof setTimeout> | undefined;

function 弹提示(文本: string, 时长 = 2600) {
  提示文本.value = 文本;
  clearTimeout(提示timer);
  提示timer = setTimeout(() => (提示文本.value = ''), 时长);
}

// ── 特殊场景「静音会议」完整状态域(App A7b2 迁入 composables/useMuteMeeting.ts) ──
// App 只注入跨区块能力与 6 个业务事件;状态机/timer/Pointer/组合图/会后循环与资源清理全在 composable。
const {
  静音会议场景,
  静音会议中,
  静音会议正式中,
  静音会议当前拍,
  是静音会议候选门牌,
  静音会议参与妻,
  静音会议演出妻,
  静音会议重点妻名,
  静音会议阶段短名,
  静音会议拍数文案,
  静音会议筹备步骤,
  静音会议筹备妻,
  静音会议筹备议题,
  静音会议筹备提交中,
  静音会议议题列表,
  静音会议候选列表,
  静音会议筹备可确认,
  静音会议筹备妻名,
  静音会议筹备夫名,
  请求打开静音会议筹备,
  取消静音会议筹备,
  切换静音会议筹备妻,
  查看静音会议确认,
  发送静音会议通知,
  静音会议手机已开放,
  静音会议手机可打开,
  静音会议手机标题,
  静音会议互动id,
  静音会议互动待操作,
  静音会议等待AI重试,
  静音会议B目标,
  静音会议C模式,
  静音会议长按中,
  静音会议连点计数,
  静音会议互动失败次数,
  静音会议互动补偿可用,
  静音会议交互幕,
  静音会议互动标题,
  静音会议互动说明,
  静音会议连点目标,
  静音会议连点点亮妻,
  静音会议互动结果,
  静音会议A按下,
  静音会议A抬起,
  选择静音会议B目标,
  静音会议B按下,
  静音会议B抬起,
  选择静音会议C模式,
  静音会议C按下,
  静音会议C抬起,
  静音会议指针取消,
  静音会议互动补偿通过,
  重试静音会议互动续拍,
  静音会议画面状态,
  静音会议显示组合图,
  静音会议当前图地址,
  静音会议图加载成功,
  静音会议图加载失败,
  静音会议会后选择,
  静音会议继续已选,
  静音会议待散会选择,
  静音会议会后选择合法,
  静音会议会后选择提示,
  静音会议自由待选择,
  静音会议收尾待重试,
  切换静音会议会后妻,
  继续静音会议会后活动,
  请求结束静音会议,
  同步静音会议界面,
  处理静音会议回合完成前,
  处理静音会议回合失败前,
  处理静音会议自由回合失败,
  处理静音会议提示,
  标记静音会议自由行动开始,
} = useMuteMeeting({
  data,
  sending: 发送中,
  clearStream: () => {
    流式段.value = [];
  },
  pullState: () => (store as unknown as { pull?: () => void }).pull?.(),
  toast: 弹提示,
  lockMeetingUI: () => {
    当前房间.value = '管理员室';
    正文幕归属状态.value = 创建正文幕归属('管理员室');
    显示地图.value = false;
    显示商店.value = false;
    显示背包.value = false;
    显示监控.value = false;
    显示史册.value = false;
    选中门牌.value = null;
    CG图库门牌.value = null;
    垃圾选择开.value = false;
  },
  focusInput: () => {
    回合输入.value?.聚焦();
  },
  useMeeting: () => eventEmit('人妻公寓:使用静音会议'),
  cancelPreparation: () => eventEmit('人妻公寓:取消静音会议筹备'),
  startMeeting: payload => eventEmit('人妻公寓:启动静音会议', payload),
  reportInteractionFailure: payload => eventEmit('人妻公寓:静音会议互动失败', payload),
  submitInteraction: (payload, recovery) =>
    eventEmit(recovery ? '人妻公寓:静音会议互动补偿' : '人妻公寓:静音会议互动', payload),
  endMeeting: () => eventEmit('人妻公寓:结束静音会议'),
});

// ── 房内操作抽屉可见性(App 只算可见动作数、垃圾入口与统一抑制,展开/自动收起在组件内状态机) ──
// 普通动作只在 !录像带中 时计入;垃圾入口保持原 v-if 语义(垃圾房且有袋,不受录像带门控)。
const 垃圾入口可见 = computed(() => 当前房间.value === '垃圾房' && 垃圾袋列表.value.length > 0);
const 普通动作可见数 = computed(() => (录像带中.value ? 0 : 普通房间动作.value.length));
const 可见房内动作数 = computed(() => 普通动作可见数.value + (垃圾入口可见.value ? 1 : 0));
// 发送中 / 静音会议在桌面与手机都抑制；键盘门只在手机生效——桌面输入框 focus 时 键盘打开
// 不隐藏房内动作(桌面行为原样),与旧 keyboard-open CSS 仅在 max-width:540px 媒体内命中等价。
const 房内操作抑制 = computed(() => 发送中.value || 静音会议正式中.value || (移动端.value && 键盘打开.value));

/** 背包票进入筹备(A5a 契约)：guard 与关背包顺序保留，重置/使用事件/800ms pull/sync 在 composable 请求打开。 */
function 打开静音会议筹备() {
  if (发送中.value || 静音会议中.value) return;
  显示背包.value = false;
  请求打开静音会议筹备();
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
  恢复失败行动();
  读取CG解锁();
  void 取卷轴();
  刷新可重掷();
  刷新在场();
  刷新行动选项();
  刷新待办();
  刷新偷窥待选();
  for (const 视口 of [
    window.visualViewport,
    (() => {
      try {
        return window.parent?.visualViewport;
      } catch {
        return null;
      }
    })(),
  ]) {
    if (!视口 || 键盘视口们.includes(视口)) continue;
    键盘视口们.push(视口);
    视口.addEventListener('resize', 让输入露出);
    视口.addEventListener('scroll', 让输入露出);
  }

  eventOn('人妻公寓:生成开始', () => {
    // 脚本侧发起的回合(查看监控等)也要锁输入+亮书写态;驻留的拾获卡顺手收掉不挡戏
    刷新当前预设正文标签();
    // “保留最后有效流”只能发生在同一次生成内，绝不把上一回合正文带进新 generation。
    流式段.value = [];
    发送中.value = true;
    运行阶段.value = '正在准备本回合';
    开始生成计时();
    拾获卡.value = '';
    if (静音会议中.value) 同步静音会议界面();
  });
  eventOn('人妻公寓:流式', (文本: string) => {
    if (!运行阶段.value.startsWith('数据库')) 运行阶段.value = 'AI正在生成正文';
    // 流式半截文本只走本卡清洗,不过玩家正则(闭合标记未到会整段吞空)
    const 当前净文 = 流式段.value.join('\n');
    const 净文 = 更新有效流式正文(当前净文, 清洗(文本, true), 内容 => 内容);
    流式段.value = 净文
      ? 净文
          .split(/\n+/)
          .map(s => s.trim())
          .filter(Boolean)
      : [];
    void 滚到底();
  });
  eventOn('人妻公寓:运行阶段', (阶段: string) => {
    运行阶段.value = typeof 阶段 === 'string' ? 阶段 : '';
  });
  eventOn('人妻公寓:时间推进结束', (成功: boolean) => {
    时间撤销刷新版本.value += 1;
    if (成功) return; // 成功路径由“回合完成”统一拉取新时钟和地图。
    发送中.value = false;
    运行阶段.value = '';
    同步场景自变量();
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* store 未带 pull 时靠轮询兜底 */
    }
  });
  eventOn('人妻公寓:CG回合信号', (信号: CG回合信号) => {
    // 荣耀洞拥有独立三拍画面；这里仍可接收事件，但渲染层与解锁层均不采用普通CG。
    if (荣耀洞图.value) {
      当前成人CG.value = null;
      最近CG信号 = null;
      return;
    }
    处理CG回合信号(信号);
  });
  eventOn('人妻公寓:回合完成', async (选项?: 回合完成正文选项) => {
    停止生成计时();
    try {
      清除待恢复行动();
      待重试行动.value = '';
      失败行动.value = '';
      取消后自动重试.value = false;
      流式段.value = [];
      重置录像带界面();
      处理静音会议回合完成前();
      同步场景自变量(); // 回档把 _场景 清空后 UI 必须跟着回楼道(审计 C2)
      清理越界成人CG(); // 回档也走本事件收口,被抹掉楼层上的成人画面一并退场(审计 M10)
      正文幕归属状态.value = 应用回合完成正文幕(正文幕归属状态.value, 当前房间.value, 选项);
      // 先同步消息历史，再刷新 MVU；时间事务必须等新时钟真正 pull 完成后才能重新点按钮。
      await 取卷轴();
      刷新可重掷();
      try {
        await Promise.resolve((store as unknown as { pull?: () => void | Promise<void> }).pull?.());
      } catch {
        /* store 未带 pull 时靠轮询兜底 */
      }
      await nextTick();
      刷赴约();
      刷新在场();
      刷新行动选项();
      刷新偷窥待选();
      同步静音会议界面();
    } finally {
      发送中.value = false;
      运行阶段.value = '';
    }
  });
  eventOn('人妻公寓:隔离事件完成', async () => {
    发送中.value = false;
    运行阶段.value = '';
    停止生成计时();
    流式段.value = [];
    同步场景自变量(); // 隔离撤回会把 _场景 恢复成事件前旧值(审计 C2)
    清理越界成人CG(); // 撤回删楼后同样不得残留成人画面(审计 M10)
    正文幕归属状态.value = 创建正文幕归属(当前房间.value);
    await 取卷轴();
    刷新可重掷();
    try {
      await Promise.resolve((store as unknown as { pull?: () => void | Promise<void> }).pull?.());
    } catch {
      /* store 未带 pull 时靠轮询兜底 */
    }
    await nextTick();
    刷赴约();
    刷新在场();
    刷新行动选项();
    刷新偷窥待选();
  });
  eventOn('人妻公寓:回合失败', async (原因: string) => {
    发送中.value = false;
    运行阶段.value = '';
    停止生成计时();
    处理静音会议回合失败前();
    同步场景自变量(); // 监控回合失败时脚本已把 _场景 回滚,画面跟着回原位(审计 C4)
    const 待重试 = 待重试行动.value.trim() || 读取待恢复行动();
    const 将自动重试 = 取消后自动重试.value && !!待重试;
    处理静音会议自由回合失败(将自动重试);
    if (待重试) 失败行动.value = 待重试;
    待重试行动.value = '';
    流式段.value = [];
    偷窥待选.value = null; // 偷窥回合没演成,挂起的选择卡一并作废(脚本侧同步清账)
    // 回合失败=这一轮没发生,是提示不是事故——走可消散 toast,不占常驻错误横幅(2026-07-17 用户反馈)
    if (!原因.startsWith('已取消')) 弹提示(`回合失败,这一轮没有发生:${原因}`, 6000);
    // 引擎只在临时楼删除与 chat 快照恢复完成后广播失败；这里仍完整重拉
    // 消息/MVU/在场三路真值，不能保留生成期间 store 曾观察到的临时 assistant 快照。
    await 取卷轴();
    刷新可重掷();
    try {
      await Promise.resolve((store as unknown as { pull?: () => void | Promise<void> }).pull?.());
    } catch {
      /* store 未带 pull 时靠轮询兜底 */
    }
    await nextTick();
    刷赴约();
    刷新在场();
    刷新行动选项();
    if (将自动重试) {
      取消后自动重试.value = false;
      // 等回滚后的消息、MVU 与 Vue 画面都重新对齐，再重发原行动。
      setTimeout(() => {
        失败行动.value = '';
        发出(待重试);
      }, 0);
    } else {
      取消后自动重试.value = false;
    }
  });
  eventOn('人妻公寓:已重开', () => {
    清除待恢复行动();
    // 楼层与过程变量已清,整页重建最干净(幕房间/卷轴/弹窗全归零),回到标题屏
    window.location.reload();
  });
  eventOn('人妻公寓:监控回合', () => {
    // 查看入口已经成功回到302；这里只按宿主真值同步画面，不能再发起一次未经等待的移动。
    同步场景自变量();
  });
  eventOn('人妻公寓:特殊场景状态', () => {
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* 轮询仍会兜底 */
    }
    nextTick(同步静音会议界面);
  });
  eventOn('人妻公寓:手机状态', (状: { 未读?: boolean }) => {
    时间撤销刷新版本.value += 1;
    手机未读.value = !!状?.未读;
    刷赴约(); // 约出来是纯手机操作不产楼,靠这条通知让地图位置即时跟上
    if (当前房间.value) {
      在场.value = {
        焦点: 可见门牌.value.filter(m => 妻在玩家身边(m)),
        在场: [],
      };
    }
  });
  eventOn('人妻公寓:手机收起', async () => {
    时间撤销刷新版本.value += 1;
    // 开手机时替玩家退过真全屏,收起就送回去;收起点按=用户手势,同源iframe吃得到激活态
    if (!收手机回全屏) return;
    收手机回全屏 = false;
    if (document.fullscreenElement ?? (document as 全屏文档).webkitFullscreenElement) return;
    try {
      await 进真全屏();
    } catch (e) {
      console.warn('[人妻公寓客户端] 收手机自动回全屏被浏览器拒绝(留在窗口态):', e);
    }
  });
  eventOn('人妻公寓:提示', (消息: string) => {
    处理静音会议提示();
    // 地图行动卡开着:结果以"线索卡"翻出(动画),不走 toast(组件内守 open+房卡)
    if (!地图弹窗.value?.显示结果(消息)) {
      // 带【】的重要提示(线索/收获)=拾获卡驻留,点击才收下(2026-07-17 用户反馈:出货不能一闪而过)
      if (消息.startsWith('【')) 拾获卡.value = 消息;
      else 弹提示(消息);
    }
    // 侦探/商店操作是纯 UI 回合(不产楼):软计数即时刷新,store 拉新(监控列表是 computed 自动跟)
    刷新偷窥待选();
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* store 未带 pull 时靠轮询兜底 */
    }
  });

  // 恢复场景(刷新页面/重开酒馆后仍在原房间)
  const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as 场景聊天状态 | null;
  当前房间.value = 场景?.房间id ?? null;
  已破门进入.value = !!场景?.非法进入;
  本次入房由头已用.value = !!场景?.由头已用;
  正文幕归属状态.value = 创建正文幕归属(当前房间.value); // 刷新恢复:已有正文与选项视为当前场景的
  try {
    进房末楼.value = 场景?.进房末楼 ?? getLastMessageId();
  } catch {
    进房末楼.value = 0;
    本次入房由头已用.value = false;
  }
  刷赴约();
  同步静音会议界面();

  // 恢复界面偏好 + media/fullscreen 监听 + 移动端默认 CSS 画幅（useUIPrefs 单例统一初始化）
  初始化();

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
  销毁();
  clearInterval(心跳timer);
  clearInterval(生成等待timer);
  window.clearInterval(原生弹窗轮询);
  clearTimeout(转场计时);
  clearTimeout(提示timer);
  clearTimeout(性爱结果timer);
  clearTimeout(键盘定位timer);
  for (const 视口 of 键盘视口们) {
    视口.removeEventListener('resize', 让输入露出);
    视口.removeEventListener('scroll', 让输入露出);
  }
  键盘视口们.length = 0;
});
</script>

<style scoped>
.mobile-fullscreen-cta {
  display: none;
}

@media (max-width: 540px) {
  .mobile-fullscreen-cta {
    display: grid;
    position: fixed;
    z-index: 120;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(88vw, 360px);
    min-height: 116px;
    padding: 13px 18px;
    border: 2px solid rgba(255, 255, 255, 0.9);
    border-radius: 18px;
    background: linear-gradient(135deg, #8e5270, #4b385f);
    color: #fff;
    box-shadow:
      0 10px 34px rgba(21, 10, 26, 0.48),
      inset 0 1px 0 rgba(255, 255, 255, 0.22);
    grid-template-columns: 30px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    font-family: inherit;
  }
  .mobile-fullscreen-cta :deep(svg) {
    width: 30px;
    height: 30px;
    flex: none;
  }
  .mobile-fullscreen-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
    text-align: left;
  }
  .mobile-fullscreen-cta b {
    font-size: 17px;
    line-height: 1.2;
  }
  .mobile-fullscreen-cta small {
    font-size: 11px;
    line-height: 1.35;
    color: rgba(255, 255, 255, 0.82);
  }
  .mobile-fullscreen-actions {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .mobile-fullscreen-actions button {
    min-height: 34px;
    padding: 7px 9px;
    border: 1px solid rgba(255, 255, 255, 0.72);
    border-radius: 10px;
    color: #fff;
    font: 700 12px/1.2 inherit;
    cursor: pointer;
  }
  .mobile-fullscreen-primary {
    background: rgba(255, 255, 255, 0.2);
  }
  .mobile-fullscreen-window {
    background: transparent;
  }
}
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
  padding: 6px 18px;
  font-family: inherit;
  font-size: 0.92em;
  font-weight: 600;
  color: var(--ink);
  background: var(--glass);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.08);
  cursor: pointer;
  transition:
    transform var(--motion-base) ease,
    box-shadow var(--motion-base) ease,
    border-color var(--motion-base) ease,
    background var(--motion-base) ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(38, 169, 244, 0.6);
  box-shadow: 0 8px 20px rgba(38, 169, 244, 0.22);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:focus-visible {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
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

.avatar.ambient .avatar-glyph {
  border-color: rgba(255, 79, 154, 0.52);
  box-shadow:
    0 0 0 1px rgba(255, 79, 154, 0.08),
    0 3px 12px rgba(255, 79, 154, 0.2);
}

.avatar.focus .avatar-glyph {
  border-color: var(--pink);
  box-shadow: 0 4px 14px rgba(255, 79, 154, 0.4);
  animation: avatar-bounce 0.4s ease;
}

/* 冷落余波优先覆盖位置辉光；离场仍保留原透明度，避免把冷落误认成“正在现场”。 */
.avatar.neglect-pending .avatar-glyph {
  border-color: #596bb9;
  box-shadow:
    0 0 0 2px rgba(89, 107, 185, 0.18),
    0 0 16px rgba(89, 107, 185, 0.48);
}

.avatar.neglect-soothing .avatar-glyph {
  border-color: #a96819;
  box-shadow:
    0 0 0 2px rgba(169, 104, 25, 0.16),
    0 0 15px rgba(169, 104, 25, 0.42);
}

/* 只有微信告知真正落库后才出现；玫瑰金外圈覆盖冷落色，但不改变在场/离场透明度。 */
.avatar.pregnant .avatar-glyph {
  border-color: #d58a93;
  box-shadow:
    0 0 0 2px rgba(213, 138, 147, 0.2),
    0 0 18px rgba(224, 143, 153, 0.56),
    0 3px 12px rgba(109, 61, 70, 0.2);
}

@keyframes avatar-bounce {
  40% {
    transform: translateY(-3px);
  }
}

/* 头像图版本(AI 生成素材;加载失败回退首字圆徽) */
.avatar-glyph.img {
  object-fit: cover;
  object-position: top;
  background: linear-gradient(160deg, #fff4f9, #ffe3ee);
}

.avatar-name {
  font-size: 0.78em;
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

/* 正文舞台(rq0.14 立绘分层):背景四层与边框在 wrap,立绘 z1 钉右下,滚动层 z2 浮最上 */
.story-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 四层:氛围色渐变 > 薄纱(背景放开看,可读性交给正文磨砂垫板) > 地点背景图(素材) > 玻璃底(图挂了的兜底) */
  background:
    linear-gradient(
      180deg,
      rgba(var(--sc-a, 165, 175, 195), 0.14),
      rgba(var(--sc-b, 205, 215, 230), 0.05) 42%,
      transparent 72%
    ),
    linear-gradient(rgba(255, 250, 245, 0.32), rgba(255, 250, 245, 0.42)),
    var(--scene-img, none) var(--scene-pos, center) / var(--scene-size, cover) no-repeat,
    var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(6px);
  transition: background 0.5s ease;
}

.story-wrap.story-special-interaction {
  background: #0d1117;
}

/* 成人CG：一套竖图同时服务手机与桌面。完整图 contain；桌面余白由同图模糊铺底。 */
.adult-cg-stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: rgba(12, 10, 16, 0.94);
}

.adult-cg-stage::before {
  position: absolute;
  inset: -28px;
  content: '';
  background: var(--adult-cg-img) center / cover no-repeat;
  filter: blur(22px) brightness(0.42) saturate(0.82);
  transform: scale(1.08);
}

.adult-cg-stage::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(90deg, rgba(8, 7, 12, 0.22), transparent 28% 72%, rgba(8, 7, 12, 0.22));
}

.adult-cg-stage img {
  /* 脱离 grid 的固有尺寸计算：竖图若作为 grid item，会先按 2:3 宽度撑高再被舞台裁掉，
     导致桌面窗口虽然声明 contain，实际仍只显示中段。钉住四边后 contain 才以舞台为画框。 */
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 10px 28px rgba(0, 0, 0, 0.42));
}

.adult-cg-stage.loading img {
  opacity: 0;
}

/* 纯画面欣赏(正文隐藏)+成人CG:仅两者同时成立才把 CG 提到亲密底栏(z12)之上完整展示,
   恢复按钮同步提到 CG 之上保证显示正文按钮仍可点;恢复正文后 class 消失,dock/抽屉原样回来,不卸载不重置 */
.story-wrap.story-adult-cg.story-visual-only .adult-cg-stage {
  z-index: 20;
}

.story-wrap.story-adult-cg.story-visual-only .story-hide-btn {
  z-index: 21;
}

/* 立绘槽负责定位与裁边；图片只按槽高等比缩放。这样同场角色不会因透明画布宽度不同被 contain 二次缩矮。 */
.portrait-slot {
  position: absolute;
  left: var(--portrait-desktop-left);
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  width: var(--portrait-desktop-width);
  height: var(--portrait-desktop-height);
  pointer-events: none;
  transition:
    left 0.35s ease,
    top 0.35s ease,
    width 0.35s ease,
    height 0.35s ease,
    opacity 0.35s ease;
}

.portrait {
  flex: none;
  width: auto;
  height: 100%;
  max-width: none;
  max-height: none;
  pointer-events: none;
  filter: drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.85)) drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.85))
    drop-shadow(0 8px 20px rgba(20, 24, 40, 0.35));
}

/* 单人镜头略偏右，给左侧正文保留呼吸；仍处于自己的 78% 宽槽内。 */
.portrait-count-1 .portrait-slot {
  left: 22%;
  width: 78%;
  height: var(--portrait-desktop-height);
}

/* 荣耀洞件与背景共用同一张16:9舞台坐标：不能套普通人物槽，否则洞口接触点会随端宽漂移。 */
.portrait-slot-glory {
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.portrait-glory {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

/* 背景必须始终铺满正文舞台；contain 只属于上方的透明抠图件，不能传给背景层。 */
.story-glory {
  --scene-pos: center;
  --scene-size: cover;
}

:global(html.rq-dark) .portrait {
  filter: brightness(0.84) drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.5)) drop-shadow(0 8px 20px rgba(0, 0, 0, 0.55));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.story-hide-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 3;
  width: var(--control-icon-sm);
  height: var(--control-icon-sm);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(4px);
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(20, 24, 40, 0.18);
  transition: transform var(--motion-fast) ease;
}

.story-hide-btn:hover {
  transform: translateY(-1px);
}

.story-hide-btn:focus-visible {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
}

:global(html.rq-dark) .story-hide-btn {
  background: rgba(30, 32, 46, 0.72);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 转场横幅:gal 式地点閃卡 */
.loc-banner {
  position: absolute;
  top: 30%;
  left: 50%;
  z-index: 50;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 10px 30px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(6px);
  pointer-events: none;
}

.loc-banner b {
  font-size: 1.1em;
  font-weight: 900;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  color: var(--ink);
}

.db-running-banner {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 70;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: calc(100% - 112px);
  padding: 9px 15px;
  border: 1px solid rgba(92, 185, 255, 0.42);
  border-radius: 14px;
  color: #eef8ff;
  background: rgba(18, 36, 58, 0.92);
  box-shadow: 0 8px 28px rgba(0, 18, 38, 0.34);
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.db-running-banner > span:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.db-running-banner b {
  overflow: hidden;
  font-size: 0.86em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.db-running-banner small {
  opacity: 0.72;
  font-size: 0.7em;
}

.db-running-pulse {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 50%;
  background: #62c5ff;
  box-shadow: 0 0 0 0 rgba(98, 197, 255, 0.5);
  animation: db-pulse 1.3s ease-out infinite;
}

@keyframes db-pulse {
  70% {
    box-shadow: 0 0 0 8px rgba(98, 197, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(98, 197, 255, 0);
  }
}

@media (max-width: 720px) {
  .db-running-banner {
    top: 8px;
    max-width: calc(100% - 92px);
    padding: 8px 11px;
  }

  .db-running-banner small {
    display: none;
  }
}

.loc-flash-enter-active {
  animation: loc-in 0.3s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.loc-flash-leave-active {
  transition: all 0.35s ease;
  opacity: 0;
  transform: translate(-50%, -8px);
}

@keyframes loc-in {
  from {
    opacity: 0;
    transform: translate(-50%, 14px) scale(0.92);
  }
  to {
    transform: translate(-50%, 0) scale(1);
  }
}

.story-entry {
  position: relative;
  margin-bottom: 8px;
  /* 磨砂垫板:背景图放开看,字浮在自己的可读底上(gal 文字框的卷轴版);浓度由设置滑杆控 */
  background: rgba(255, 252, 247, var(--entry-veil, 0.66));
  backdrop-filter: blur(3px);
  border-radius: 10px;
  padding: 4px 10px;
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
  /* 字色三级:玩家自选 > 主题墨色(rq-dark 自动翻浅) */
  color: var(--prose-ink, var(--prose-default, var(--ink)));
  font-size: var(--prose-size, 0.9em);
  line-height: 1.85;
  margin: 5px 0;
  text-indent: 2em;
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

.entry-prompt {
  position: absolute;
  z-index: 2;
  top: 1px;
  right: 27px;
  padding: 2px 6px;
  border: 1px solid rgba(86, 112, 142, 0.2);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  color: var(--ink-faint);
  font: 600 0.62em/1.35 var(--font-mono);
  opacity: 0;
  cursor: pointer;
  transition:
    opacity 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.story-entry:hover .entry-edit,
.story-entry:hover .entry-prompt,
.entry-prompt:focus-visible {
  opacity: 0.85;
}

.entry-prompt:hover {
  color: var(--blue);
  border-color: rgba(68, 118, 174, 0.5);
}

@media (hover: none), (pointer: coarse) {
  .entry-prompt {
    opacity: 0.72;
  }
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

/* 亲密场景占用正文舞台：平时只露出底栏，管理时从舞台底边向上展开。 */
.intimacy-stage-dock {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
  transition: background 0.24s ease;
}

.intimacy-stage-dock.open {
  pointer-events: auto;
  background: rgba(37, 25, 39, 0.28);
  backdrop-filter: blur(2px);
}

.intimacy-summary {
  position: relative;
  z-index: 2;
  flex: none;
  min-height: 48px;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(110px, 1fr) auto auto auto;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  color: var(--ink);
  background: linear-gradient(110deg, rgba(255, 230, 239, 0.96), rgba(247, 242, 253, 0.96)), var(--glass);
  border: 0;
  border-top: 1px solid rgba(222, 91, 142, 0.42);
  border-radius: 0 0 calc(var(--radius) - 1px) calc(var(--radius) - 1px);
  box-shadow: 0 -5px 18px rgba(85, 46, 75, 0.14);
  cursor: pointer;
  pointer-events: auto;
  text-align: left;
}

.intimacy-summary:active:not(:disabled) {
  transform: translateY(1px);
}

.intimacy-summary:focus-visible,
.intimacy-people article:focus-visible,
.intimacy-collapse:focus-visible {
  outline: 2px solid #bf3f72;
  outline-offset: -3px;
}

.intimacy-summary-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.intimacy-summary-copy small,
.intimacy-summary-progress small {
  color: var(--ink-faint);
  font-size: 0.58em;
}

.intimacy-summary-copy b {
  overflow: hidden;
  color: #a83261;
  font-size: 0.78em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.intimacy-summary-progress {
  display: flex;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
}

.intimacy-summary-progress b {
  color: #b43768;
  font: 900 0.74em/1 var(--font-mono);
}

.intimacy-summary-stamina,
.intimacy-summary-action {
  padding: 4px 8px;
  border-radius: 999px;
  white-space: nowrap;
  font-size: 0.64em;
  font-weight: 800;
}

.intimacy-summary-stamina {
  color: #a83261;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(222, 91, 142, 0.22);
}

.intimacy-summary-action {
  color: #fff;
  background: #b93e70;
}

.intimacy-stage-dock.critical .intimacy-summary {
  border-top-color: rgba(194, 47, 65, 0.62);
}

.intimacy-stage-dock.critical .intimacy-summary-stamina {
  color: #a6273a;
  background: rgba(255, 220, 224, 0.84);
}

.intimacy-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-height: calc(100% - 48px);
  overflow-y: auto;
  padding: 10px 12px 9px;
  color: var(--ink);
  background:
    linear-gradient(120deg, rgba(255, 228, 238, 0.98), rgba(244, 239, 251, 0.98) 58%, rgba(255, 252, 247, 0.98)),
    var(--glass);
  border: 1px solid rgba(222, 91, 142, 0.3);
  border-bottom: 0;
  border-radius: 15px 15px 0 0;
  box-shadow:
    inset 3px 0 0 rgba(239, 79, 121, 0.56),
    0 -12px 32px rgba(66, 45, 76, 0.2);
  scrollbar-width: thin;
}

.intimacy-stage-dock.critical .intimacy-panel {
  border-color: rgba(211, 61, 75, 0.5);
  box-shadow:
    inset 3px 0 0 var(--red),
    0 5px 18px rgba(211, 61, 75, 0.13);
}

.intimacy-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
}

.intimacy-collapse {
  padding: 4px 9px;
  color: #9d315c;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(190, 61, 112, 0.28);
  border-radius: 999px;
  font-size: 0.64em;
  font-weight: 800;
  cursor: pointer;
}

.intimacy-panel > header span {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.intimacy-panel > header small {
  color: #c94779;
  font: 800 var(--font-micro) / 1 var(--font-mono);
  letter-spacing: 0.16em;
}

.intimacy-panel > header b {
  font-size: 0.84em;
  letter-spacing: 0.08em;
}

.intimacy-panel > header em {
  padding: 3px 8px;
  color: #c94779;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(222, 91, 142, 0.24);
  border-radius: 999px;
  font: 800 0.68em/1.2 var(--font-display);
  font-style: normal;
}

.intimacy-people {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.intimacy-people article {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 7px;
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid rgba(102, 83, 122, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.intimacy-people article:hover:not(.disabled) {
  transform: translateY(-1px);
  border-color: rgba(203, 58, 113, 0.38);
}

.intimacy-people article.focused {
  border-color: #c53f74;
  box-shadow:
    inset 0 0 0 1px rgba(197, 63, 116, 0.2),
    0 4px 12px rgba(135, 53, 95, 0.12);
}

.intimacy-people article.disabled {
  cursor: default;
}

.intimacy-people article.satisfied {
  border-color: rgba(230, 153, 45, 0.44);
  background: linear-gradient(110deg, rgba(255, 231, 166, 0.62), rgba(255, 255, 255, 0.55));
}

.intimacy-avatar,
.intimacy-avatar img {
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
}

.intimacy-avatar {
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(145deg, #ef6e9d, #8b72ca);
  border: 2px solid rgba(255, 255, 255, 0.78);
}

.intimacy-avatar img {
  object-fit: cover;
}

.intimacy-satisfaction {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.intimacy-satisfaction > b {
  font-size: 0.72em;
}

.intimacy-person-title {
  display: flex;
  align-items: center;
  gap: 5px;
}

.intimacy-person-title > b {
  font-size: 0.72em;
}

.intimacy-person-title > em {
  padding: 1px 5px;
  color: #fff;
  background: #bd3d70;
  border-radius: 999px;
  font-size: 0.5em;
  font-style: normal;
  font-weight: 800;
}

.intimacy-person-title > em.complete {
  color: #795114;
  background: rgba(238, 188, 79, 0.35);
}

.intimacy-satisfaction > small {
  color: var(--ink-faint);
  font-size: 0.58em;
}

.intimacy-satisfaction > small.intimacy-preference {
  max-width: 190px;
  overflow: hidden;
  color: var(--ink-faint);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.intimacy-satisfaction > small.intimacy-preference.hit {
  color: #bd4975;
  font-weight: 800;
}

.petals {
  display: flex;
  gap: 2px;
  font-size: 0.58em;
  line-height: 1;
}

.petals i {
  color: rgba(55, 46, 65, 0.14);
  font-style: normal;
}

.petals i.on {
  color: #ef5d91;
  text-shadow: 0 0 5px rgba(239, 93, 145, 0.35);
}

.intimacy-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.intimacy-meta span {
  padding: 2px 7px;
  color: var(--ink-faint);
  background: rgba(255, 255, 255, 0.48);
  border-radius: 999px;
  font-size: 0.58em;
}

.intimacy-meta b {
  color: var(--ink-soft);
}

.intimacy-warning {
  margin: 6px 0 0;
  padding: 5px 7px;
  color: #a83144;
  background: rgba(255, 220, 224, 0.66);
  border-left: 3px solid var(--red);
  border-radius: 6px;
  font-size: 0.65em;
  line-height: 1.4;
}

.intimacy-finishes {
  position: sticky;
  bottom: -9px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 7px -4px 0;
  padding: 7px 4px 1px;
  background: linear-gradient(180deg, rgba(250, 244, 250, 0), rgba(250, 244, 250, 0.96) 22%);
}

.intimacy-sheet-enter-active,
.intimacy-sheet-leave-active {
  transition:
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}

.intimacy-sheet-enter-from,
.intimacy-sheet-leave-to {
  opacity: 0;
  transform: translateY(22px);
}

@media (prefers-reduced-motion: reduce) {
  .intimacy-stage-dock,
  .intimacy-sheet-enter-active,
  .intimacy-sheet-leave-active,
  .intimacy-people article {
    transition: none;
  }
}

.intimacy-finish-label {
  flex: 0 0 100%;
  color: var(--ink-faint);
  font-size: 0.56em;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.finish-tile {
  min-height: 27px;
  padding: 4px 10px;
  color: #a33461;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 226, 237, 0.84));
  border: 1px solid rgba(222, 91, 142, 0.32);
  border-radius: 8px;
  font: 800 0.65em/1.2 inherit;
  cursor: pointer;
}

.finish-tile:hover:not(:disabled) {
  color: #fff;
  background: linear-gradient(180deg, #f26f9e, #df4f83);
  transform: translateY(-1px);
}

.finish-tile.selected {
  color: #fff;
  background: linear-gradient(180deg, #e96a99, #cd3f76);
  border-color: #b63065;
  box-shadow: 0 0 0 2px rgba(222, 79, 132, 0.15);
}

.finish-tile.confirm {
  margin-left: auto;
  color: #fff;
  background: linear-gradient(180deg, #8f77cf, #7159b2);
  border-color: #654caa;
}

.finish-tile.danger {
  color: #fff;
  background: linear-gradient(180deg, #e86573, #bb3547);
  border-color: #a93243;
}

.finish-tile:disabled {
  opacity: 0.45;
  cursor: default;
}

.scene-result-card {
  flex: none;
  margin-top: 6px;
  padding: 9px 10px 10px;
  color: var(--ink);
  background:
    linear-gradient(125deg, rgba(255, 227, 157, 0.2), rgba(255, 252, 247, 0.78) 45%, rgba(230, 218, 255, 0.2)),
    var(--glass);
  border: 1px solid rgba(199, 144, 54, 0.34);
  border-radius: 15px;
  box-shadow:
    inset 3px 0 0 rgba(219, 159, 61, 0.68),
    0 5px 16px rgba(66, 45, 76, 0.08);
  backdrop-filter: blur(8px);
}

.scene-result-card > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.scene-result-card > header span {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.scene-result-card > header small {
  color: #b17727;
  font: 800 var(--font-micro) / 1 var(--font-mono);
  letter-spacing: 0.16em;
}

.scene-result-card > header b {
  font-size: 0.84em;
  letter-spacing: 0.08em;
}

.scene-result-card > header em {
  padding: 3px 8px;
  color: #97621c;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(199, 144, 54, 0.24);
  border-radius: 999px;
  font: 800 0.68em/1.2 var(--font-display);
  font-style: normal;
}

.scene-result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}

.scene-result-meta span {
  padding: 2px 7px;
  color: var(--ink-faint);
  background: rgba(255, 255, 255, 0.48);
  border-radius: 999px;
  font-size: 0.58em;
}

.scene-result-meta b {
  color: var(--ink-soft);
}

.scene-result-people {
  display: grid;
  grid-auto-columns: minmax(210px, 1fr);
  grid-auto-flow: column;
  gap: 6px;
  margin-top: 7px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.scene-result-people article {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(102, 83, 122, 0.12);
  border-left: 3px solid #d09a3f;
  border-radius: 10px;
}

.scene-result-people article.duration-太短 {
  border-left-color: #8d78c8;
}

.scene-result-people article.duration-过久 {
  border-left-color: #d64678;
  background: rgba(255, 232, 240, 0.68);
}

.scene-result-people article.duration-失控 {
  border-left-color: var(--red);
  background: rgba(255, 228, 231, 0.62);
}

.scene-result-copy {
  min-width: 0;
  display: grid;
  flex: 1;
  gap: 2px;
}

.scene-result-copy > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
}

.scene-result-copy > span > b {
  font-size: 0.72em;
}

.scene-result-copy strong {
  flex: none;
  padding: 2px 6px;
  color: #9b6921;
  background: rgba(255, 235, 184, 0.72);
  border-radius: 999px;
  font-size: 0.58em;
}

.duration-太短 .scene-result-copy strong {
  color: #6d56a9;
  background: rgba(231, 225, 255, 0.76);
}

.duration-过久 .scene-result-copy strong {
  color: #ad2d62;
  background: rgba(255, 216, 231, 0.8);
}

.duration-失控 .scene-result-copy strong {
  color: #a83144;
  background: rgba(255, 210, 217, 0.78);
}

.scene-result-copy > small {
  color: var(--ink-faint);
  font-size: 0.58em;
}

.scene-result-copy p {
  margin: 1px 0;
  color: var(--ink-soft);
  font-size: 0.63em;
  line-height: 1.4;
}

.scene-result-copy > small.scene-result-preference {
  overflow: hidden;
  color: #b44a75;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-result-enter-active,
.scene-result-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.scene-result-enter-from,
.scene-result-leave-to {
  opacity: 0;
  transform: translateY(-6px);
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

/* gal 式选择条(rq0.12):水彩纸条底图居中排字,图挂了退玻璃白条 */
.option-chip.gal {
  display: grid;
  place-items: center;
  min-height: 44px;
  text-align: center;
  font-size: 0.82em;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.35;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  background:
    var(--opt-img, none) center / cover no-repeat,
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.4),
      rgba(255, 255, 255, 0.88) 16%,
      rgba(255, 255, 255, 0.88) 84%,
      rgba(255, 255, 255, 0.4)
    ),
    var(--glass);
  box-shadow: 0 3px 10px rgba(30, 26, 38, 0.1);
}

.option-chip.gal:hover:not(:disabled) {
  border-color: rgba(255, 79, 154, 0.55);
  box-shadow: 0 6px 18px rgba(255, 79, 154, 0.22);
  transform: translateY(-1px);
}

:global(html.rq-lite) .peep-card {
  --opt-img: none;
}

:global(html.rq-dark) .option-chip.gal {
  background:
    linear-gradient(
      90deg,
      rgba(44, 46, 64, 0.55),
      rgba(44, 46, 64, 0.94) 16%,
      rgba(44, 46, 64, 0.94) 84%,
      rgba(44, 46, 64, 0.55)
    ),
    #2c2e40;
  border-color: rgba(255, 255, 255, 0.16);
}

.option-chip:hover:not(:disabled) {
  border-color: rgba(38, 169, 244, 0.55);
  box-shadow: 0 6px 16px rgba(38, 169, 244, 0.18);
  transform: translateY(-1px);
}

/* ── 遮罩与玻璃面板 ── */

/* gal 式遮罩(2026-07-17 用户提案重设计):斜纹绢帘+粉蓝双色晕影+中心聚焦,替代死黑蒙版 */
.mask {
  position: absolute;
  inset: 0;
  z-index: 30;
  background:
    repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.045) 0 2px, transparent 2px 6px),
    radial-gradient(120% 90% at 50% 0%, rgba(255, 79, 154, 0.12), transparent 55%),
    radial-gradient(130% 100% at 50% 110%, rgba(38, 169, 244, 0.14), transparent 60%),
    radial-gradient(140% 140% at 50% 50%, rgba(24, 22, 34, 0.3), rgba(16, 14, 26, 0.6)), rgba(20, 22, 30, 0.2);
  backdrop-filter: blur(4px) saturate(0.9);
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
  background: var(--surface-sheet);
  border: 1px solid var(--surface-sheet-border);
  border-radius: var(--radius-sheet);
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
  width: var(--control-icon-sm);
  height: var(--control-icon-sm);
  display: grid;
  place-items: center;
  background: var(--field-bg);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  color: var(--ink-soft);
  font-size: 0.8em;
  cursor: pointer;
  transition:
    color var(--motion-fast) ease,
    background var(--motion-fast) ease,
    border-color var(--motion-fast) ease,
    transform var(--motion-fast) ease;
}

.sheet-close:hover {
  color: #fff;
  background: var(--pink);
  border-color: var(--pink);
}

.sheet-close:focus-visible {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
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

.chronicle {
  scrollbar-color: var(--pink) rgba(0, 0, 0, 0.08);
  scrollbar-width: auto;
}

.chronicle::-webkit-scrollbar {
  width: 10px;
}

.chronicle::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
}

.chronicle::-webkit-scrollbar-thumb {
  background: linear-gradient(var(--pink), var(--blue));
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: padding-box;
}

.history-latest {
  align-self: flex-end;
  margin: -2px 4px 6px 0;
  padding: 4px 10px;
  color: var(--ink-soft);
  font: 600 0.72em/1.2 inherit;
  background: var(--glass);
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  cursor: pointer;
}

/* 手机 dock 钮(P4):来电=铃振跳动,未读=红点 */
.dock-btn.budge {
  position: relative;
}

.dock-btn.budge::after {
  content: '';
  position: absolute;
  top: 6px;
  right: 14px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #fa5151;
}

.dock-btn.ring {
  animation: dock-ring 0.6s ease-in-out infinite;
  color: #fa5151;
}

@keyframes dock-ring {
  0%,
  100% {
    transform: rotate(0);
  }
  25% {
    transform: rotate(-8deg) scale(1.05);
  }
  75% {
    transform: rotate(8deg) scale(1.05);
  }
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
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
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

/* 垃圾选择弹窗(留在 App 抽屉外:遮罩层级 145 与行为不变;瓷砖样式已迁 房内操作抽屉.vue) */

.garbage-mask {
  position: fixed;
  z-index: 145;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(12, 12, 18, 0.68);
  backdrop-filter: blur(5px);
}

.garbage-modal {
  position: relative;
  width: min(600px, 94vw);
  max-height: min(72vh, 620px);
  overflow: hidden auto;
  padding: 18px;
  color: var(--ink);
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow);
}

.garbage-modal h3 {
  margin: 4px 0 2px;
}

.garbage-modal > p {
  margin: 0 0 12px;
  color: var(--ink-soft);
  font-size: 0.76em;
}

.garbage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
  gap: 9px;
}

.garbage-tile {
  position: relative;
  min-height: 132px;
  overflow: hidden;
  padding: 0;
  color: #fff;
  text-align: left;
  background: linear-gradient(150deg, #454b59, #252832);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 13px;
  cursor: pointer;
  box-shadow: 0 5px 14px rgba(15, 15, 22, 0.18);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.garbage-tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 22px rgba(15, 15, 22, 0.28);
}

.garbage-tile img,
.garbage-fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.garbage-tile::after {
  content: '';
  position: absolute;
  inset: 35% 0 0;
  background: linear-gradient(transparent, rgba(8, 9, 14, 0.9));
}

.garbage-tile b,
.garbage-tile em {
  position: absolute;
  z-index: 2;
  left: 9px;
}

.garbage-tile b {
  bottom: 25px;
  font: 900 1.08em/1 var(--font-display);
}

.garbage-tile em {
  bottom: 8px;
  font-size: 0.72em;
  font-style: normal;
}

.garbage-fallback {
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.7);
  font: 900 2.2em/1 var(--font-display);
  background: linear-gradient(135deg, #6f7180, #30333e);
}

.btn.ghost {
  background: transparent;
  border: 1px solid var(--line-soft);
  color: var(--ink-soft);
}

/* ═══ 在场头像徽章(到场卡/场景条/房卡:认脸不认字) ═══ */

.who-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.who-chip img,
.who-chip > b {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 2px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: linear-gradient(160deg, #ffe3ee, #ffd0e2);
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.2);
  color: #d4407a;
  font-size: 0.8em;
  font-style: normal;
}

.who-chip em {
  font-style: normal;
  font-size: 0.82em;
  color: var(--ink-soft);
}

.who-chip.mini img,
.who-chip.mini > b {
  width: 24px;
  height: 24px;
  border-width: 1.5px;
}

.scene-occ {
  display: inline-flex;
  align-items: center;
}

.scene-occ .who-chip.mini + .who-chip.mini {
  margin-left: -6px;
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
  position: relative;
  padding: 2px 4px 2px 30px;
}

.chronicle::before {
  content: '';
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: 14px;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(var(--blue), var(--pink) 48%, var(--yellow));
  opacity: 0.42;
}

.chronicle-entry {
  border: 1px solid color-mix(in srgb, var(--line-soft) 74%, transparent);
  box-shadow: 0 2px 8px rgba(48, 39, 54, 0.045);
}

.chronicle-entry.player {
  border-color: color-mix(in srgb, var(--blue) 32%, var(--line-soft));
}

.chronicle-mark {
  position: absolute;
  top: 9px;
  left: -27px;
  z-index: 1;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  color: var(--pink);
  background: color-mix(in srgb, var(--paper) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--pink) 42%, var(--line));
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(42, 31, 47, 0.13);
}

.chronicle-entry.player .chronicle-mark {
  color: var(--blue);
  border-color: color-mix(in srgb, var(--blue) 48%, var(--line));
}

.chronicle-mark .ic {
  width: 12px;
  height: 12px;
}

/* ═══ 右上角 meta 钮(主题/全屏) ═══ */

.corner-btns {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 20;
  display: inline-flex;
  gap: 6px;
}

.corner-btns.above-setup {
  z-index: 60;
}

/* ═══ HUD:数据专属框架(时间块+瓦片,与按钮分离) ═══ */

.hud {
  flex: none;
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 8px 12px;
  margin-bottom: 7px;
  background: var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(6px);
}

.hud-time {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  padding-right: 12px;
  border-right: 1px dashed var(--line-soft);
  min-width: 138px;
}

.hud-time b {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 1.02em;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.hud-time .ic {
  width: 15px;
  height: 15px;
  color: var(--blue);
}

.hud-stats {
  flex: 1;
  display: grid;
  grid-template-columns: 0.68fr repeat(4, minmax(64px, 1fr));
  gap: 8px;
}

/* 电池条(胜任=绿→黄→红报警,风闻=反向;格子随值点亮) */
.battery {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 3px 9px;
  font: inherit;
  color: inherit;
  text-align: left;
  background: #fff;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
}

button.battery {
  appearance: none;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    opacity 0.16s ease;
}

button.battery:hover {
  transform: translateY(-1px);
  border-color: rgba(86, 112, 142, 0.42);
  box-shadow: 0 4px 12px rgba(57, 55, 76, 0.1);
}

button.battery:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--blue) 70%, white);
  outline-offset: 2px;
}

.battery.resource.energy .cells i.on {
  background: linear-gradient(180deg, #63c8ff, #477bea);
}

.battery.resource.stamina .cells i.on {
  background: linear-gradient(180deg, #ff87ae, #ef4f79);
}

.battery.resource.active {
  border-color: rgba(239, 79, 121, 0.58);
  box-shadow: 0 0 0 2px rgba(239, 79, 121, 0.11);
}

.battery.resource.muted {
  opacity: 0.62;
}

.battery.resource.warn .cells i.on {
  background: var(--red);
}

.battery small {
  font-size: 0.64em;
  color: var(--ink-faint);
  font-weight: 700;
}

.battery .cells {
  display: flex;
  gap: 1.5px;
  align-items: center;
  height: 9px;
}

.battery .cells i {
  flex: 1;
  height: 100%;
  border-radius: 1.5px;
  background: rgba(36, 33, 38, 0.1);
  transition:
    background 0.35s ease,
    box-shadow 0.35s ease;
}

/* 胜任:安全绿 */
.battery .cells i.on {
  background: var(--green);
}

/* 风闻:警示橙红 */
.battery.risk .cells i.on {
  background: var(--yellow);
}

/* 报警态（胜任进入当前难度危险段／风闻达到既有风险线）：亮格转红+末格呼吸 */
.battery.warn .cells i.on {
  background: var(--red);
}

/* 呼吸=最后一格亮着的(下一格不亮或已是末格) */
.battery.warn .cells i.on:has(+ i:not(.on)),
.battery.warn .cells i.on:last-of-type {
  animation: cell-pulse 1s ease-in-out infinite;
}

@keyframes cell-pulse {
  50% {
    box-shadow: 0 0 6px var(--red);
    opacity: 0.6;
  }
}

.battery b {
  align-self: flex-end;
  font-family: var(--font-display);
  font-size: 0.78em;
  color: var(--ink-soft);
  line-height: 1;
}

.battery.warn b {
  color: var(--red);
}

.battery.rumor.rumor-level-0 b {
  color: var(--ink-faint);
}

.battery.rumor.rumor-level-1 .cells i.on,
.battery.rumor.rumor-level-1 b {
  color: #9a6b12;
  background-color: #d9ad43;
}

.battery.rumor.rumor-level-2 .cells i.on,
.battery.rumor.rumor-level-2 b {
  color: #b45722;
  background-color: #df7a3d;
}

.battery.rumor.rumor-level-3 .cells i.on,
.battery.rumor.rumor-level-3 b {
  color: #bb3f54;
  background-color: #d45468;
}

.battery.rumor.rumor-level-4 .cells i.on,
.battery.rumor.rumor-level-4 b {
  color: #842b4b;
  background-color: #9e3658;
}

.battery.rumor b {
  background: none !important;
}

.rumor-cells {
  gap: 3px !important;
}

/* 玩家状态详情：沿用日式 gal 的暖纸卡与双色状态墨水。 */
.resource-detail-mask {
  z-index: 76;
  display: grid;
  place-items: center;
  padding: 18px;
}

.resource-detail-card {
  --resource-accent: #477bea;
  position: relative;
  width: min(390px, 92vw);
  box-sizing: border-box;
  padding: 24px 24px 22px;
  overflow: hidden;
  color: var(--ink);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--resource-accent) 9%, transparent), transparent 48%),
    var(--paper-card);
  border: 1px solid color-mix(in srgb, var(--resource-accent) 36%, var(--line));
  border-radius: 20px;
  box-shadow: 0 22px 60px rgba(28, 25, 39, 0.28);
}

.resource-detail-card.stamina {
  --resource-accent: #ef4f79;
}

.resource-detail-card::after {
  content: '';
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 10px;
  height: 3px;
  background: linear-gradient(90deg, var(--resource-accent), transparent);
  border-radius: 999px;
  opacity: 0.72;
}

.resource-detail-card h3 {
  margin: 7px 0 3px;
  color: var(--resource-accent);
  font: 900 1.2em/1.2 var(--font-display);
  letter-spacing: 0.08em;
}

.resource-detail-value {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin: 3px 0 12px;
}

.resource-detail-value b {
  color: var(--resource-accent);
  font: 900 2.8em/1 var(--font-display);
}

.resource-detail-value span {
  color: var(--ink-faint);
  font: 800 1em/1 var(--font-display);
}

.resource-detail-card p {
  margin: 6px 0;
  color: var(--ink-soft);
  font-size: 0.8em;
}

.resource-detail-card > small,
.resource-detail-card > em {
  display: block;
  margin-top: 10px;
  color: var(--ink-faint);
  font-size: 0.7em;
  line-height: 1.55;
}

.resource-detail-card > em {
  color: var(--resource-accent);
  font-style: normal;
  font-weight: 800;
}

/* 风闻账详情：四档颜色与 HUD 保持一致，列表只显示最近三条来源。 */
.rumor-detail-mask {
  z-index: 77;
  display: grid;
  place-items: center;
  padding: 18px;
}

.rumor-detail-card {
  --rumor-accent: #74808d;
  position: relative;
  width: min(520px, 94vw);
  max-height: min(720px, calc(100dvh - 36px));
  box-sizing: border-box;
  padding: 23px;
  overflow-y: auto;
  color: var(--ink);
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--rumor-accent) 9%, transparent), transparent 42%), var(--paper-card);
  border: 1px solid color-mix(in srgb, var(--rumor-accent) 42%, var(--line));
  border-radius: 20px;
  box-shadow: 0 22px 60px rgba(28, 25, 39, 0.3);
}

.rumor-detail-card.rumor-level-1 {
  --rumor-accent: #b28324;
}

.rumor-detail-card.rumor-level-2 {
  --rumor-accent: #cb652c;
}

.rumor-detail-card.rumor-level-3 {
  --rumor-accent: #c3465b;
}

.rumor-detail-card.rumor-level-4 {
  --rumor-accent: #922f50;
}

.rumor-detail-card.competence-detail-card {
  --rumor-accent: #318b62;
}

.competence-detail-card .rumor-guidance p.hot {
  background: color-mix(in srgb, var(--red) 9%, transparent);
  border-color: color-mix(in srgb, var(--red) 36%, var(--line-soft));
}

.competence-detail-card .rumor-event-list em.down {
  color: var(--red);
}

.rumor-detail-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
  margin: 7px 0 2px;
}

.rumor-detail-head span {
  display: grid;
  gap: 1px;
}

.rumor-detail-head small,
.rumor-events h4 {
  color: var(--ink-faint);
  font-size: 0.68em;
  font-weight: 800;
}

.rumor-detail-head h3 {
  margin: 0;
  color: var(--rumor-accent);
  font: 900 1.35em/1.1 var(--font-display);
  letter-spacing: 0.08em;
}

.rumor-detail-head > b {
  color: var(--rumor-accent);
  font: 900 2.6em/0.9 var(--font-display);
}

.rumor-summary {
  margin: 7px 0 13px;
  color: var(--ink-soft);
  font-size: 0.78em;
}

.rumor-thresholds {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
  margin-bottom: 12px;
}

.rumor-thresholds span {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 5px 3px;
  color: var(--ink-faint);
  background: color-mix(in srgb, var(--ink) 4%, transparent);
  border: 1px solid var(--line-soft);
  border-radius: 8px;
}

.rumor-thresholds span.active {
  color: var(--rumor-accent);
  background: color-mix(in srgb, var(--rumor-accent) 10%, transparent);
  border-color: color-mix(in srgb, var(--rumor-accent) 42%, var(--line-soft));
}

.rumor-thresholds b {
  font: 900 0.82em/1 var(--font-display);
}

.rumor-thresholds small {
  overflow: hidden;
  font-size: 0.62em;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rumor-alerts,
.rumor-guidance {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.rumor-alerts p,
.rumor-guidance p {
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 8px 9px;
  color: var(--ink-soft);
  background: color-mix(in srgb, var(--ink) 4%, transparent);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
}

.rumor-alerts p.hot {
  background: color-mix(in srgb, var(--rumor-accent) 10%, transparent);
  border-color: color-mix(in srgb, var(--rumor-accent) 40%, var(--line-soft));
}

.rumor-alerts b,
.rumor-guidance b {
  color: var(--rumor-accent);
  font-size: 0.72em;
}

.rumor-alerts span,
.rumor-guidance span {
  font-size: 0.68em;
  line-height: 1.45;
}

.rumor-events {
  margin: 14px 0 12px;
}

.rumor-events h4 {
  margin: 0 0 6px;
}

.rumor-event-list {
  display: grid;
  gap: 6px;
}

.rumor-event-list article {
  padding: 8px 10px;
  background: color-mix(in srgb, var(--ink) 3%, transparent);
  border-left: 3px solid color-mix(in srgb, var(--rumor-accent) 72%, transparent);
  border-radius: 4px 10px 10px 4px;
}

.rumor-event-list article > header,
.rumor-event-list article > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.rumor-event-list article > header b {
  overflow: hidden;
  font-size: 0.76em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rumor-event-list article > header em {
  flex: none;
  color: var(--rumor-accent);
  font: 900 0.78em/1 var(--font-display);
  font-style: normal;
}

.rumor-event-list article > header em.down {
  color: var(--green);
}

.rumor-event-list article > small,
.rumor-event-list article > footer,
.rumor-empty {
  color: var(--ink-faint);
  font-size: 0.62em;
}

.rumor-event-list article > p {
  margin: 4px 0;
  color: var(--ink-soft);
  font-size: 0.7em;
  line-height: 1.4;
}

.rumor-event-list article > footer {
  justify-content: flex-start;
}

.rumor-empty {
  margin: 0;
  padding: 10px;
  text-align: center;
  border: 1px dashed var(--line-soft);
  border-radius: 10px;
}

.hstat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  padding: 3px 10px;
  background: #fff;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
}

.hstat small {
  font-size: 0.64em;
  color: var(--ink-faint);
  font-weight: 700;
}

.hstat b {
  font-family: var(--font-display);
  font-size: 0.98em;
  color: var(--ink);
  line-height: 1.15;
}

.hstat.hot {
  border-color: var(--red);
}

.hstat.hot b {
  color: var(--red);
}

.rent-ledger {
  min-width: 126px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  overflow: hidden;
  color: var(--ink-soft);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, #fff7e9 88%, var(--paper)),
    color-mix(in srgb, #f1dfc4 58%, var(--paper))
  );
  border: 1px solid rgba(153, 100, 47, 0.3);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.rent-ledger > .ic {
  width: 22px;
  height: 22px;
  color: #a76435;
}

.rent-ledger span {
  min-width: 58px;
  display: flex;
  flex-direction: column;
}

.rent-ledger small {
  color: #91633f;
  font: 700 var(--font-micro) / 1.1 var(--font-mono);
  letter-spacing: 0.08em;
}

.rent-ledger b {
  color: var(--ink);
  font: 800 0.72em/1.2 var(--font-display);
  white-space: nowrap;
}

.rent-ledger > i {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  font: 700 var(--font-micro) / 1 var(--font-mono);
  font-style: normal;
  color: #885226;
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(148, 91, 43, 0.25);
  border-radius: 4px;
}

/* ═══ 底部功能 dock(gal 式:大图标+标签,融进背景的悬浮条) ═══ */

.dock {
  flex: none;
  display: flex;
  gap: 6px;
  padding: 7px 8px;
  margin-top: 7px;
  background: var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(6px);
}

.dock-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 7px 2px 5px;
  font-family: inherit;
  color: var(--ink-soft);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.16s;
}

.dock-btn .ic {
  width: 26px;
  height: 26px;
}

.dock-btn span {
  font-size: 0.68em;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.dock-btn:hover:not(:disabled) {
  color: var(--blue);
  background: rgba(38, 169, 244, 0.1);
  transform: translateY(-2px);
}

.dock-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.dock-btn.primary {
  color: #fff;
  background: linear-gradient(180deg, #ff6cab, #ff4f9a);
  box-shadow: 0 4px 14px rgba(255, 79, 154, 0.35);
}

.dock-btn.primary:hover:not(:disabled) {
  color: #fff;
  background: linear-gradient(180deg, #ff5da2, #f04390);
  transform: translateY(-2px);
}

.btn.icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ui-kicker.light {
  color: rgba(255, 255, 255, 0.82);
}

.ui-kicker.center {
  text-align: center;
}

/* ═══ 状态瓦片(初星 status card:小灰标 + 展示字体数值) ═══ */

/* ═══ 新元素的夜间覆盖 ═══ */

:global(html.rq-dark) .hstat,
:global(html.rq-dark) .battery {
  background: #2c2e40;
}

:global(html.rq-dark) .resource-detail-card,
:global(html.rq-dark) .rumor-detail-card,
:global(html.rq-dark) .intimacy-panel,
:global(html.rq-dark) .scene-result-card {
  background: linear-gradient(130deg, rgba(239, 79, 121, 0.12), rgba(71, 123, 234, 0.07) 56%, transparent), #292b3b;
}

:global(html.rq-dark) .intimacy-summary {
  color: var(--ink);
  background: linear-gradient(110deg, rgba(65, 39, 55, 0.98), rgba(43, 42, 61, 0.98));
  border-top-color: rgba(239, 79, 121, 0.42);
}

:global(html.rq-dark) .intimacy-summary-stamina,
:global(html.rq-dark) .intimacy-collapse {
  color: #f09aba;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.14);
}

:global(html.rq-dark) .intimacy-finishes {
  background: linear-gradient(180deg, rgba(41, 43, 59, 0), rgba(41, 43, 59, 0.98) 22%);
}

:global(html.rq-dark) .rumor-thresholds span,
:global(html.rq-dark) .rumor-alerts p,
:global(html.rq-dark) .rumor-guidance p,
:global(html.rq-dark) .rumor-event-list article {
  background-color: rgba(255, 255, 255, 0.055);
  border-color: rgba(255, 255, 255, 0.09);
}

:global(html.rq-dark) .rumor-thresholds span.active,
:global(html.rq-dark) .rumor-alerts p.hot {
  background-color: color-mix(in srgb, var(--rumor-accent) 16%, transparent);
  border-color: color-mix(in srgb, var(--rumor-accent) 50%, rgba(255, 255, 255, 0.09));
}

:global(html.rq-dark) .intimacy-people article,
:global(html.rq-dark) .intimacy-panel > header em,
:global(html.rq-dark) .intimacy-meta span,
:global(html.rq-dark) .scene-result-card > header em,
:global(html.rq-dark) .scene-result-meta span,
:global(html.rq-dark) .scene-result-people article {
  background: rgba(255, 255, 255, 0.07);
}

:global(html.rq-dark) .battery .cells i {
  background: rgba(255, 255, 255, 0.12);
}

:global(html.rq-dark) .hud,
:global(html.rq-dark) .dock {
  border-color: rgba(255, 255, 255, 0.08);
}

/* ═══ 夜间模式:scoped 里写死的浅色逐条覆盖(token 部分已在 global.css 换) ═══
   地图 .galmap 子树刻意不覆盖——立面插画自带昼夜(天色+窗灯) ═══ */

:global(html.rq-dark) .meta-row > span:not(.meta-btns) {
  background: #2c2e40;
}

:global(html.rq-dark) .meta-row,
:global(html.rq-dark) .diff-card {
  border-color: rgba(255, 255, 255, 0.08);
}

/* 夜间:深纱压背景图;2026-07-19 玩家手机截图实测:亮色场景图(白墙房间/白裙立绘)会把
   半透明深纱衬成浅灰,浅色字浮在上面看不清——深纱加厚 */
:global(html.rq-dark) .story-wrap {
  background:
    linear-gradient(
      180deg,
      rgba(var(--sc-a, 165, 175, 195), 0.14),
      rgba(var(--sc-b, 205, 215, 230), 0.05) 42%,
      transparent 72%
    ),
    linear-gradient(rgba(24, 26, 40, 0.58), rgba(24, 26, 40, 0.68)),
    var(--scene-img, none) var(--scene-pos, center) / var(--scene-size, cover) no-repeat,
    var(--glass);
}

/* ── 省流模式:关掉重量级场景位图(背景/立面),回纯 CSS 渐变;头像/图标小,保留 ── */
:global(html.rq-lite) .story-wrap {
  --scene-img: none !important;
  background:
    linear-gradient(160deg, rgba(var(--sc-a, 165, 175, 195), 0.16), rgba(var(--sc-b, 205, 215, 230), 0.08)),
    var(--glass) !important;
}

/* ── 减少动效:关掉全局过渡与动画 ── */
:global(html.rq-still) *,
:global(html.rq-still) *::before,
:global(html.rq-still) *::after {
  animation-duration: 0.001s !important;
  transition-duration: 0.001s !important;
}

:global(html.rq-dark) .sheet {
  background: var(--surface-sheet);
  border-color: var(--surface-sheet-border);
}

:global(html.rq-dark) .sheet-close,
:global(html.rq-dark) .edit-area {
  background: var(--field-bg);
  color: var(--ink);
}

:global(html.rq-dark) .peep-card,
:global(html.rq-dark) .loc-banner {
  background: rgba(34, 36, 50, 0.96);
  border-color: rgba(255, 255, 255, 0.1);
}

:global(html.rq-dark) .todo-bar,
:global(html.rq-dark) .clue-card {
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

:global(html.rq-dark) .avatar.ambient .avatar-glyph {
  border-color: rgba(255, 158, 196, 0.68);
  box-shadow:
    0 0 0 1px rgba(255, 158, 196, 0.12),
    0 3px 12px rgba(255, 79, 154, 0.24);
}

:global(html.rq-dark) .avatar.focus .avatar-glyph {
  border-color: var(--pink);
}

:global(html.rq-dark) .avatar.neglect-pending .avatar-glyph {
  border-color: #8193e2;
  box-shadow:
    0 0 0 2px rgba(129, 147, 226, 0.2),
    0 0 18px rgba(111, 132, 221, 0.58);
}

:global(html.rq-dark) .avatar.neglect-soothing .avatar-glyph {
  border-color: #d59a4a;
  box-shadow:
    0 0 0 2px rgba(213, 154, 74, 0.18),
    0 0 17px rgba(213, 154, 74, 0.5);
}

:global(html.rq-dark) .avatar.pregnant .avatar-glyph {
  border-color: #f0aeb4;
  box-shadow:
    0 0 0 2px rgba(240, 174, 180, 0.2),
    0 0 20px rgba(225, 132, 145, 0.64),
    0 3px 12px rgba(0, 0, 0, 0.32);
}

/* ── 窗口化电脑紧凑档：只重排视觉，不把电脑误判为手机业务。 ── */
@media (min-width: 541px) and (max-width: 900px) {
  .page {
    padding: 6px 10px 8px;
  }

  .masthead {
    padding-bottom: 4px;
    margin-bottom: 4px;
  }

  .hud {
    flex-direction: column;
    gap: 6px;
    padding: 6px 10px;
    margin-bottom: 5px;
  }

  .hud-time {
    min-width: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-right: 0;
    padding-bottom: 4px;
    border-right: 0;
    border-bottom: 1px dashed var(--line-soft);
  }

  .hud-stats {
    width: 100%;
    grid-template-columns: 0.72fr repeat(4, minmax(0, 1fr));
    gap: 5px;
  }

  .battery,
  .hstat {
    min-width: 0;
    padding-right: 6px;
    padding-left: 6px;
  }

  .avatar-row {
    gap: 3px 9px;
    margin-bottom: 4px;
  }

  .avatar-glyph {
    width: 46px;
    height: 46px;
  }

  .dock {
    padding: 5px 7px;
    margin-top: 5px;
  }

  .dock-btn {
    padding: 5px 2px 4px;
  }

  .dock-btn .ic {
    width: 22px;
    height: 22px;
  }

  .dock-btn span {
    font-size: var(--font-micro);
  }
}

/* ── 移动端紧凑档(2026-07-18 用户反馈:手机上正文只剩一小条)──
   原则:正文区 story-wrap 是 flex:1,只要把上下所有周边框架等比压扁,
   省出来的高度会自动全部归正文;不动任何逻辑,纯视觉压缩 */
@media (max-width: 540px) {
  /* 手机全屏立绘：1~3 人横向独立槽；4~6 人转为两排半身镜头。
     每个槽的几何盒互不相交，槽内图片统一按高度缩放，超宽部分只做无损裁边。 */
  :global(html.rqgy-full) .portrait-slot {
    left: var(--portrait-mobile-left);
    top: var(--portrait-mobile-top);
    bottom: auto;
    width: var(--portrait-mobile-width);
    height: var(--portrait-mobile-height);
    clip-path: inset(0 2px 0 2px);
  }

  :global(html.rqgy-full) .portrait-count-1 .portrait-slot {
    left: 8%;
    top: 0;
    width: 92%;
    height: 100%;
  }

  :global(html.rqgy-full) .portrait-count-1 .portrait-slot-glory {
    inset: 0;
    width: 100%;
    height: 100%;
    clip-path: none;
  }

  :global(html.rqgy-full) .story-glory {
    --scene-pos: center;
    --scene-size: cover;
  }

  /* 四人以上保留脸和上半身，比六人挤成一条细立绘更容易辨认。 */
  :global(html.rqgy-full) .portraits-many .portrait-slot {
    clip-path: inset(2px);
    mask-image: linear-gradient(to bottom, #000 82%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, #000 82%, transparent 100%);
  }

  .page {
    padding: 4px 7px 6px;
  }

  /* 题头:kicker 行整行让位,标题缩一号 */
  .ui-kicker.center:not(.light) {
    display: none;
  }

  .masthead {
    font-size: 0.84em;
    letter-spacing: 0.22em;
    padding: 0 0 4px;
    margin-bottom: 3px;
  }

  .masthead::after {
    width: 40px;
    height: 3px;
  }

  /* 数据 HUD:半高 */
  .hud {
    flex-direction: column;
    gap: 6px;
    padding: 4px 8px;
    margin-bottom: 4px;
  }

  .hud-time {
    min-width: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-right: 0;
    border-right: 0;
  }

  .hud-time b {
    font-size: 0.88em;
  }

  .hud-time .ui-kicker {
    font-size: var(--font-micro);
  }

  .battery {
    min-width: 0;
    padding: 2px 4px;
  }

  .battery .cells {
    height: 7px;
  }

  .hud-stats {
    width: 100%;
    grid-template-columns: 0.72fr repeat(4, minmax(0, 1fr));
    gap: 3px;
  }

  .battery small,
  .hstat small {
    overflow: hidden;
    font-size: var(--font-micro);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .battery b,
  .hstat b {
    font-size: 0.68em;
  }

  .hstat {
    min-width: 0;
    padding: 2px 4px;
  }

  .rent-ledger {
    min-width: 34px;
    padding: 3px 5px;
  }

  .rent-ledger > .ic {
    width: 19px;
    height: 19px;
  }

  .rent-ledger span,
  .rent-ledger > i {
    display: none;
  }

  /* 头像行:52→40px */
  .avatar-row {
    gap: 2px 8px;
    margin-bottom: 3px;
  }

  .avatar-glyph {
    width: 40px;
    height: 40px;
    border-width: 1.5px;
  }

  .avatar-name {
    font-size: var(--font-micro);
  }

  /* 场景条/选项/输入/撤回行:半高半距 */
  .scene-bar {
    gap: 6px;
    font-size: 0.74em;
    padding: 4px 2px 0;
  }

  .intimacy-panel,
  .scene-result-card {
    margin-top: 3px;
    padding: 6px 7px;
    border-radius: 11px;
  }

  .intimacy-stage-dock .intimacy-panel {
    max-height: calc(100% - 46px);
    margin-top: 0;
    padding: 7px 8px 6px;
    border-radius: 11px 11px 0 0;
  }

  .intimacy-summary {
    min-height: 46px;
    grid-template-columns: minmax(78px, 1fr) auto auto auto;
    gap: 5px;
    padding: 6px 7px;
  }

  .intimacy-summary-stamina,
  .intimacy-summary-action {
    padding: 3px 6px;
  }

  .intimacy-people {
    grid-template-columns: minmax(0, 1fr);
  }

  .intimacy-panel > header,
  .scene-result-card > header {
    margin-bottom: 4px;
  }

  .intimacy-people article {
    min-width: 0;
    padding: 3px 5px;
  }

  .intimacy-avatar,
  .intimacy-avatar img {
    width: 27px;
    height: 27px;
  }

  .intimacy-meta,
  .intimacy-finishes,
  .scene-result-meta,
  .scene-result-people {
    margin-top: 4px;
  }

  .scene-result-people {
    grid-auto-columns: minmax(190px, 86%);
  }

  .finish-tile {
    min-height: 24px;
    padding: 3px 8px;
  }

  .resource-detail-mask,
  .rumor-detail-mask {
    padding: 9px;
  }

  .resource-detail-card,
  .rumor-detail-card {
    width: 100%;
    padding: 20px 18px 19px;
  }

  .rumor-detail-card {
    max-height: calc(100dvh - 18px);
  }

  .rumor-alerts,
  .rumor-guidance {
    grid-template-columns: 1fr;
  }

  .option-chip {
    font-size: 0.74em;
    padding: 5px 9px;
  }

  /* 软键盘弹起后把非输入功能收起，配合把宿主 iframe 底边滚入可视区。
     房内动作已收成 房内操作抽屉.vue，命中其根 .in-room-acts（把手+面板整体隐藏）。 */
  .keyboard-open .dock,
  .keyboard-open .in-room-acts,
  .keyboard-open .peep-card {
    display: none;
  }

  /* 底部 dock:图标 26→20px,整体半高 */
  .dock {
    gap: 4px;
    padding: 3px 6px;
    margin-top: 4px;
    border-radius: 12px;
  }

  .dock-btn {
    gap: 1px;
    padding: 4px 2px 3px;
  }

  .dock-btn .ic {
    width: 20px;
    height: 20px;
  }

  .dock-btn span {
    font-size: var(--font-micro);
  }
}
/* ═══ 特殊场景：静音会议 ═══ */

.story-wrap.story-mute-meeting .story {
  padding-top: 48px;
}

.dock.mute-meeting-dock {
  border-color: rgba(74, 158, 124, 0.3);
}

.dock-btn.meeting-live {
  color: #23805c;
  background: rgba(70, 187, 133, 0.11);
  animation: mute-phone-breathe 2.1s ease-in-out infinite;
}

.dock-btn.meeting-frozen {
  filter: grayscale(0.75);
}

:global(html.rq-still) .dock-btn.meeting-live {
  animation: none;
}

@keyframes mute-phone-breathe {
  50% {
    color: #147048;
    background: rgba(59, 195, 126, 0.2);
    box-shadow: inset 0 0 0 1px rgba(57, 173, 116, 0.25);
  }
}
</style>
