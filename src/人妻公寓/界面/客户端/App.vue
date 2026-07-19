<template>
  <div class="apt">
    <div class="page">
      <!-- 错误护栏:任何运行时异常显示在此,不再整屏空白(点击即散,不常驻) -->
      <div v-if="错误信息" class="err" title="点击关闭" @click="错误信息 = ''">⚠︎ 界面异常:{{ 错误信息 }}(点击关闭)</div>

      <!-- 转场横幅(gal 式地点闪卡:走动的即时反馈) -->
      <transition name="loc-flash">
        <div v-if="转场" :key="转场" class="loc-banner">
          <div class="ui-kicker">MOVE</div>
          <b>{{ 转场 }}</b>
        </div>
      </transition>

      <!-- 右上角:主题切换 + 全屏 + 设置(meta 类操作,不进游戏功能区) -->
      <span class="corner-btns">
        <button class="btn mini icon" :title="暗色 ? '切回日间模式' : '切换夜间模式'" @click="切换主题">
          <Ic :n="暗色 ? 'sun' : 'moon'" />
        </button>
        <button class="btn mini icon" :title="全屏中 ? '退出全屏' : '沉浸全屏'" @click="切换全屏">
          <Ic n="expand" />
        </button>
        <button class="btn mini icon" title="设置" @click="设置开 = true">
          <Ic n="ops" />
        </button>
      </span>

      <!-- ═══════════ 设置弹窗(界面偏好,全走 localStorage) ═══════════ -->
      <div v-if="设置开" class="mask" @click.self="设置开 = false">
        <div class="sheet settings">
          <button class="sheet-close" @click="设置开 = false">✕</button>
          <div class="ui-kicker">SETTINGS / 界面偏好</div>
          <h3 class="set-title">看着舒服最要紧</h3>

          <div class="set-group">
            <div class="set-label">主题</div>
            <div class="seg">
              <button
                v-for="m in (['日间', '夜间', '跟随'] as const)"
                :key="m"
                :class="{ on: 主题模式 === m }"
                @click="((主题模式 = m), 改设置())"
              >
                {{ m === '跟随' ? '跟随时段' : m }}
              </button>
            </div>
            <p class="set-hint">「跟随时段」=游戏里入夜,界面也跟着暗下来。</p>
          </div>

          <div class="set-group">
            <div class="set-label">正文字号</div>
            <div class="seg">
              <button
                v-for="z in (['小', '中', '大'] as const)"
                :key="z"
                :class="{ on: 字号档 === z }"
                @click="((字号档 = z), 改设置())"
              >
                {{ z }}
              </button>
            </div>
          </div>

          <div class="set-group">
            <div class="set-label">正文字色</div>
            <div class="ink-row">
              <button class="btn mini" :class="{ on: !正文字色 }" @click="((正文字色 = ''), 改设置())">跟随主题</button>
              <label class="ink-pick" :class="{ on: !!正文字色 }">
                <input
                  type="color"
                  :value="正文字色 || (暗色 ? '#e9e6f0' : '#242126')"
                  @input="((正文字色 = ($event.target as HTMLInputElement).value), 改设置())"
                />
                <span>{{ 正文字色 ? '自选中' : '自选颜色' }}</span>
              </label>
            </div>
            <p class="set-hint">「跟随主题」=日间深墨、夜间米白自动翻转;自选后固定不变,看不清就点回跟随。</p>
          </div>

          <div class="set-group">
            <div class="set-label">正文垫板浓度<em>{{ Math.round(垫板浓度 * 100) }}%</em></div>
            <input
              class="set-range"
              type="range"
              min="0.2"
              max="1"
              step="0.02"
              :value="垫板浓度"
              @input="((垫板浓度 = Number(($event.target as HTMLInputElement).value)), 改设置())"
            />
            <p class="set-hint">调低=更看得清背景画,调高=文字底更实。</p>
          </div>

          <div class="set-group row">
            <div>
              <div class="set-label">立绘显示</div>
              <p class="set-hint">在场者入画:一人右下,两人左右对望,三人添中位,再多并排;垫板永远压立绘,不遮正文。</p>
            </div>
            <button class="toggle" :class="{ on: 立绘显示 }" @click="((立绘显示 = !立绘显示), 改设置())"><i /></button>
          </div>

          <div class="set-group row">
            <div>
              <div class="set-label">省流模式</div>
              <p class="set-hint">关掉背景图与图标,回纯色——省流量。</p>
            </div>
            <button class="toggle" :class="{ on: 省流 }" @click="((省流 = !省流), 改设置())"><i /></button>
          </div>

          <div class="set-group row">
            <div>
              <div class="set-label">减少动效</div>
              <p class="set-hint">关掉转场、弹跳、呼吸等动画。</p>
            </div>
            <button class="toggle" :class="{ on: 减动效 }" @click="((减动效 = !减动效), 改设置())"><i /></button>
          </div>

          <div class="set-group row">
            <div>
              <div class="set-label">沉浸全屏</div>
              <p class="set-hint">把游戏铺满整个屏幕。</p>
            </div>
            <button class="toggle" :class="{ on: 全屏中 }" @click="切换全屏"><i /></button>
          </div>

          <div class="set-danger">
            <button
              v-if="就绪 && data.系统._序章完成"
              class="btn ghost restart"
              :class="{ armed: 重开确认 }"
              :disabled="发送中"
              @click="点重开"
            >
              {{ 重开确认 ? '再点一次,推倒重来(本局进度全部清除)' : '重开一局' }}
            </button>
            <button class="btn ghost" @click="重置偏好">恢复默认外观</button>
          </div>
        </div>
      </div>

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
          <button class="btn" @click="显示史册 = true">翻开往事</button>
        </div>
      </template>

      <!-- ═══════════ 序章标题屏(gal タイトル:全屏立面KV + 纹章logo + 竖排木牌菜单) ═══════════ -->
      <template v-else-if="!data.系统._序章完成">
        <div class="title-screen" :style="{ '--kv-img': `url(${素材基址}/地图/立面_傍晚.webp)` }">
          <div class="title-hero">
            <img
              class="title-emblem"
              :src="`${素材基址}/界面/纹章.webp`"
              alt=""
              draggable="false"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="ui-kicker light">WUTONGLI APARTMENT / PRODUCED BY DAD</div>
            <h1>人妻公寓</h1>
            <p>十六把钥匙,六户人家,一栋楼的关起门来。<br />父亲的考验,今天开始。</p>
          </div>

          <!-- 菜单:木牌按钮融进画面。难度未选=展开难度选择,已选=显主菜单 -->
          <div class="title-menu" :style="{ '--plaque': `url(${素材基址}/界面/按钮底.webp)` }">
            <template v-if="!难度展开">
              <button class="plaque main" :disabled="发送中" @click="难度展开 = true">
                <span class="pl-main">开始游戏</span>
                <span class="pl-sub">START</span>
              </button>
              <button class="plaque" @click="设置开 = true">
                <span class="pl-main">设置</span>
                <span class="pl-sub">OPTIONS</span>
              </button>
            </template>
            <template v-else>
              <div class="ui-kicker light center">SELECT DIFFICULTY / 先看看父亲的心情</div>
              <button
                v-for="档 in 难度卡"
                :key="档.名称"
                class="plaque diff"
                :class="{ chosen: 选中难度 === 档.名称 }"
                @click="选中难度 = 档.名称"
              >
                <span class="pl-main">{{ 档.名称 }}</span>
                <span class="pl-note">{{ 档.说明 }}</span>
                <span class="pl-meta">¥{{ 档.起始资金 }}</span>
              </button>
              <div class="title-acts">
                <button class="btn ghost" :disabled="发送中" @click="难度展开 = false; 选中难度 = ''">返回</button>
                <button class="btn rite" :disabled="!选中难度 || 发送中" @click="开始考验">
                  {{ 发送中 ? '电话接通中……' : '接起父亲的电话' }}
                </button>
              </div>
            </template>
          </div>

          <p class="heartbeat title-beat" :class="{ dead: !脚本存活 }">
            {{ 脚本存活 ? '✓ 游戏逻辑脚本心跳正常' : '✗ 未检测到游戏逻辑脚本(请确认脚本已启用)' }}
          </p>
        </div>
      </template>

      <!-- ═══════════ 日常主界面 ═══════════ -->
      <template v-else>
        <div class="ui-kicker center">WUTONGLI APARTMENT / MANAGER MODE</div>
        <header class="masthead">人 妻 公 寓</header>

        <!-- HUD:数据专属框架(时间块 + 三轴瓦片,与功能按钮分离;按钮在底部 dock) -->
        <div class="hud">
          <div class="hud-time">
            <div class="ui-kicker">DAY {{ String(天数).padStart(2, '0') }}</div>
            <b><Ic n="clock" />{{ 时段 }}</b>
          </div>
          <div class="hud-stats">
            <div class="hstat" title="现金">
              <small>现金</small>
              <b>¥{{ data.现金 }}</b>
            </div>
            <!-- 胜任/风闻=电池条(格子随值增减,低胜任/高风闻亮红报警) -->
            <div class="battery" title="胜任度:父亲对你管楼的评价,跌到底=考验失败" :class="{ warn: data.胜任度 <= 40 }">
              <small>胜任</small>
              <span class="cells">
                <i v-for="n in 10" :key="n" :class="{ on: n <= Math.round(data.胜任度 / 10) }" />
              </span>
              <b>{{ Math.round(data.胜任度) }}</b>
            </div>
            <div class="battery risk" title="风闻:楼里的闲话,涨满=东窗事发" :class="{ warn: data.风闻 >= 50 }">
              <small>风闻</small>
              <span class="cells">
                <i v-for="n in 10" :key="n" :class="{ on: n <= Math.round(data.风闻 / 10) }" />
              </span>
              <b>{{ Math.round(data.风闻) }}</b>
            </div>
          </div>
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
            <img
              v-if="!头像失效[项.妻名]"
              class="avatar-glyph img"
              :src="头像图(项.妻名)"
              :alt="项.妻名"
              @error="头像失效[项.妻名] = true"
            />
            <span v-else class="avatar-glyph">{{ 项.妻名[0] }}</span>
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
        <div class="story-wrap" :style="[场景色, 场景图样式]">
          <!-- 隐藏正文(2026-07-19 用户点单,gal惯例):渐隐文字层欣赏立绘;只认这颗钮,再按恢复(误触不弹回) -->
          <button
            class="story-hide-btn"
            :title="正文隐藏 ? '显示正文' : '隐藏正文,欣赏画面'"
            @click.stop="正文隐藏 = !正文隐藏"
          >
            {{ 正文隐藏 ? '👁' : '🙈' }}
          </button>
          <TransitionGroup v-if="立绘显示" name="fade">
            <img
              v-for="绘 in 立绘列表"
              :key="绘.src"
              class="portrait"
              :class="绘.位"
              :style="绘.style"
              :src="绘.src"
              alt=""
              draggable="false"
              @error="立绘失效[绘.src] = true"
            />
          </TransitionGroup>
          <!-- 正文卷轴:只演当前幕,且幕跟着房间走——人走了戏就收,回来戏还在(氛围色随位置) -->
          <section ref="卷轴容器" class="story" :class="{ 'story-veiled': 正文隐藏 }">
          <!-- 到场卡:走动后的新场景,给地点一个"开场镜头"(旧正文属于旧场景,隐去) -->
          <div v-if="!在幕中 && !发送中" class="arrive">
            <div class="ui-kicker">{{ 当前房间 ? 'ARRIVE / 到场' : 'HALLWAY / 楼道' }}</div>
            <b>{{ 到场标题 }}</b>
            <p class="arrive-mood">{{ 到场描写 }}</p>
            <div v-if="当前房间 && 房内的人(当前房间).length" class="arrive-who">
              <span v-for="名 in 房内的人(当前房间)" :key="名" class="who-chip">
                <img
                  v-if="!头像失效[头像名(名)]"
                  :src="头像图(头像名(名))"
                  :alt="名"
                  @error="头像失效[头像名(名)] = true"
                />
                <b v-else>{{ 名[0] }}</b>
                <em>{{ 名 }}</em>
              </span>
            </div>
            <p class="hint">{{ 到场提示 }}</p>
          </div>
          <div v-for="(条, i) in 在幕中 ? 当前幕 : []" :key="i" class="story-entry">
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
          <button v-if="当前房间" class="btn icon" :disabled="发送中" @click="离开房间"><Ic n="exit" />离开</button>
        </div>

        <!-- 房内动作(输入门控收紧后的补位:站在垃圾房/空户里,翻袋撬门不用开地图) -->
        <div v-if="!发送中 && 当前房间动作.length" class="scene-acts">
          <button
            v-for="(动作, i) in 当前房间动作"
            :key="i"
            class="tile"
            :class="动作.类"
            @click="动作.做()"
          >
            <Ic :n="动作.icon" />
            <span class="act-kicker">{{ 动作.kicker }}</span>
            <strong>{{ 动作.文案 }}</strong>
          </button>
        </div>

        <!-- 偷窥余像:"你注意到了什么?"(摄像头渠道,选对收进线索板;选项走 gal 纸条样式与行动选项同款) -->
        <div v-if="偷窥待选 && !发送中" class="peep-card" :style="{ '--opt-img': `url(${素材基址}/界面/选项条.webp)` }">
          <p class="hint">画面看完了。你注意到了什么?</p>
          <button v-for="(项, i) in 偷窥待选.选项" :key="i" class="option-chip gal" @click="选细节(i)">
            {{ 项 }}
          </button>
        </div>

        <!-- 行动选项(AI 每轮给 4 条,点了直接发送;gal 式居中选择条,纸条底=AI 水彩件) -->
        <div v-if="显示选项" class="option-row" :style="{ '--opt-img': `url(${素材基址}/界面/选项条.webp)` }">
          <button v-for="(项, i) in 行动选项" :key="i" class="option-chip gal" @click="点选项(项)">{{ 项 }}</button>
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
        <div v-if="可重掷 && !发送中 && 当前房间 === 回合房间" class="reroll-row">
          <button class="btn" title="撤回本回合(你的行动与回应),重新措辞" @click="撤回">⌫ 撤回</button>
          <button class="btn" title="同样的行动重新演一遍" @click="重掷">↻ 重演</button>
        </div>

        <!-- 功能区:gal 式底部 dock(大图标按钮,与数据 HUD 分离) -->
        <nav class="dock">
          <button class="dock-btn primary" :disabled="发送中" @click="显示地图 = true">
            <Ic n="map" /><span>地图</span>
          </button>
          <button class="dock-btn" title="网购商城,次日达到管理员室" @click="显示商店 = true">
            <Ic n="cart" /><span>商店</span>
          </button>
          <button
            class="dock-btn"
            :class="{ ring: 手机来电, budge: 手机未读 }"
            :title="手机来电 ? '有来电!' : '你的手机'"
            @click="开手机"
          >
            <Ic n="phone" /><span>手机</span>
          </button>
          <button class="dock-btn" :disabled="!背包列表.length" @click="显示背包 = true">
            <Ic n="bag" /><span>背包</span>
          </button>
          <button v-if="监控列表.length" class="dock-btn" title="你装下的眼睛" @click="显示监控 = true">
            <Ic n="cctv" /><span>监控</span>
          </button>
          <button class="dock-btn" title="完整往事与回档" @click="显示史册 = true">
            <Ic n="book" /><span>往事</span>
          </button>
        </nav>
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
            <template v-if="时段 === '深夜' || 时段 === '晚上'"
              ><i class="star s1" /><i class="star s2" /><i class="star s3" /><i class="star s4"
            /></template>
          </div>
          <div class="map-banner">
            <div class="ui-kicker">WUTONGLI APARTMENT / FIELD MAP</div>
            <div class="mb-line"><b>第 {{ 天数 }} 天</b><em>{{ 时段问候 }}</em></div>
          </div>

          <!-- 立面画布(rq0.12 描点地图:徽章钉在画里的门窗上;时段=同一张画调色,点位永不漂) -->
          <div v-if="用画布地图" class="map-stage">
            <div class="map-canvas" :class="'tint-' + 时段色调">
              <img
                class="map-base"
                :src="`${素材基址}/地图/立面_傍晚.webp`"
                alt=""
                draggable="false"
                @error="立面失效 = true"
              />
              <i class="map-veil" />
              <button
                v-for="点 in 地图点位"
                :key="点.id"
                class="spot"
                :class="{ here: 当前房间 === 点.id, vacant: 点.空置, lit: 窗灯(点.id) }"
                :style="{ left: 点.x + '%', top: 点.y + '%' }"
                @click="点房(点.id)"
              >
                <span class="spot-plate">{{ 点.名 }}</span>
                <span v-if="点.空置" class="spot-note">招租</span>
                <span v-else-if="欠租中(点.id)" class="spot-note owe">欠租</span>
                <span v-else-if="当前房间 === 点.id || 房内的人(点.id).length" class="spot-faces">
                  <img
                    v-if="当前房间 === 点.id && !头像失效['主角']"
                    class="me"
                    :src="头像图('主角')"
                    alt="你"
                    @error="头像失效['主角'] = true"
                  />
                  <template v-for="名 in 房内的人(点.id)" :key="名">
                    <img
                      v-if="!头像失效[头像名(名)]"
                      :src="头像图(头像名(名))"
                      :alt="名"
                      @error="头像失效[头像名(名)] = true"
                    />
                    <b v-else>{{ 名[0] }}</b>
                  </template>
                </span>
              </button>
            </div>
          </div>

          <!-- 兜底(省流模式/立面图挂了):原玻璃楼体 -->
          <div v-else class="map-fallback">
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
          </div>

          <!-- 房间弹窗(gal 式:遮罩层+居中卡;hero 色带头+瓷砖大按钮;翻垃圾/撬门都在这里) -->
          <transition name="card-pop">
            <div v-if="房卡" class="rc-mask" @click.self="房卡 = null">
              <div :key="房卡" class="room-modal">
                <button class="sheet-close" @click="房卡 = null">✕</button>
                <div class="rm-hero" :class="{ pub: !/^\d+$/.test(房卡) }">
                  <div class="ui-kicker light">{{ 房卡kicker }}</div>
                  <b>{{ 房卡名称 }}</b>
                  <span v-if="房内的人(房卡).length" class="rm-who">
                    <span v-for="名 in 房内的人(房卡)" :key="名" class="who-chip mini" :title="名">
                      <img
                        v-if="!头像失效[头像名(名)]"
                        :src="头像图(头像名(名))"
                        :alt="名"
                        @error="头像失效[头像名(名)] = true"
                      />
                      <b v-else>{{ 名[0] }}</b>
                    </span>
                    <em>{{ 房卡在场 }}</em>
                  </span>
                  <em v-else>此刻没有人</em>
                </div>
                <p class="rc-mood">{{ 房卡氛围 }}</p>
                <div class="rm-grid">
                  <button
                    v-for="(动作, i) in 房卡动作"
                    :key="i"
                    class="tile"
                    :class="动作.类"
                    @click="动作.做()"
                  >
                    <Ic :n="动作.icon" />
                    <span class="act-kicker">{{ 动作.kicker }}</span>
                    <strong>{{ 动作.文案 }}</strong>
                  </button>
                  <span v-if="!房卡动作.length" class="rc-empty">门上贴着招租启事,还没有住户</span>
                </div>
                <transition name="clue-flip">
                  <div v-if="结果卡" :key="结果卡" class="clue-card">{{ 结果卡 }}</div>
                </transition>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- ═══════════ 档案卡(点头像弹出;裂缝未开=蜡封) ═══════════ -->
      <div v-if="选中档案" class="mask" @click.self="选中门牌 = null">
        <div class="sheet dossier">
          <button class="sheet-close" @click="选中门牌 = null">✕</button>
          <div class="dossier-head">
            <img
              v-if="!头像失效[选中档案.妻名]"
              class="avatar-glyph big img"
              :src="头像图(选中档案.妻名)"
              :alt="选中档案.妻名"
              @error="头像失效[选中档案.妻名] = true"
            />
            <span v-else class="avatar-glyph big">{{ 选中档案.妻名[0] }}</span>
            <span class="dossier-id">
              <span class="dossier-name">{{ 选中档案.妻名 }}</span>
              <span class="hearts" :title="'阶段:' + 选中档案.妻.阶段标题">
                <i v-for="n in 5" :key="n" :class="{ on: n <= 选中档案.妻.当前阶段 }">♥</i>
              </span>
            </span>
            <span class="dossier-role">ROOM {{ 选中档案.门牌 }}</span>
            <span class="dossier-stage">「{{ 选中档案.妻.阶段标题 }}」</span>
          </div>

          <div class="axes">
            <div v-for="轴 in 选中档案.三轴" :key="轴.名" class="axis-row">
              <span class="axis-label">{{ 轴.名 }}</span>
              <div class="axis"><i class="bar" :class="轴.类" :style="{ width: 轴.值 + '%' }" /></div>
              <span class="axis-num">{{ Math.round(轴.值) }}</span>
            </div>
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
              <!-- gal 化(2026-07-18 用户反馈排版丑):对得上商店 SKU 的项直接上道具图卡,文字项走软卡行 -->
              <div class="attire-grid">
                <div v-for="a in 选中档案.仪容项" :key="a.标 + a.值" class="a-cell" :class="{ pic: !!a.图id }">
                  <span v-if="a.图id" class="a-pic">
                    <img
                      v-if="!道具图失效[a.图id]"
                      :src="道具图(a.图id)"
                      :alt="a.值"
                      loading="lazy"
                      draggable="false"
                      @error="道具图失效[a.图id] = true"
                    />
                    <b v-else>{{ a.值[0] }}</b>
                  </span>
                  <span class="a-main">
                    <small>{{ a.标 }}</small>
                    <b class="a-val">{{ a.值 }}</b>
                  </span>
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
            <!-- 性癖(P5):装载中3槽可卸载;"曾开发"永久留档=她的身体记得 -->
            <div v-if="选中档案.妻.当前阶段 >= 4 && (选中档案.性癖装载.length || 选中档案.曾开发.length)" class="dsec">
              <div class="dsec-title">性 癖({{ 选中档案.性癖装载.length }}/3)</div>
              <div class="kink-row">
                <span v-for="k in 选中档案.性癖装载" :key="k.id" class="kink-chip on">
                  {{ k.名 }}
                  <button class="kink-off" title="卸下(她的身体不会忘)" @click="卸载(选中档案.门牌, k.id)">×</button>
                </span>
                <span v-for="(名, i) in 选中档案.曾开发" :key="'曾' + i" class="kink-chip was" title="曾开发过——重装免开幕,直接生效">
                  {{ 名 }}
                </span>
              </div>
            </div>
            <!-- 丈夫状态栏(解锁后:双轴可见——疑心是风险表,信任是钥匙) -->
            <div class="dsec husband">
              <div class="dsec-title">她 的 丈 夫</div>
              <div class="hb-row">
                <img
                  v-if="!头像失效['影子']"
                  class="avatar-glyph hb img"
                  :src="头像图('影子')"
                  alt="丈夫"
                  @error="头像失效['影子'] = true"
                />
                <span v-else class="avatar-glyph hb">{{ 选中档案.夫名[0] }}</span>
                <span class="hb-main">
                  <b>{{ 选中档案.夫名 }}</b>
                  <small>此刻{{ 选中档案.夫状态 }}</small>
                </span>
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
          <button v-if="选中可要钱" class="btn" :disabled="发送中" title="她的钱,现在也是你的钱" @click="开口要钱(选中档案.门牌)">
            ¥ 开口要钱
          </button>
        </div>
      </div>

      <!-- ═══════════ 背包(道具可用:布设/送礼/读信) ═══════════ -->
      <div v-if="显示背包" class="mask" @click.self="显示背包 = false">
        <div class="sheet">
          <button class="sheet-close" @click="显示背包 = false">✕</button>
          <div class="sheet-title">背 包</div>
          <div class="sheet-body">
            <div v-for="(项, i) in 背包列表" :key="i" class="ware-card">
              <span class="ware-pic">
                <img
                  v-if="查道具(项.id) && !道具图失效[项.id]"
                  :src="道具图(项.id)"
                  :alt="项.名称"
                  loading="lazy"
                  draggable="false"
                  @error="道具图失效[项.id] = true"
                />
                <b v-else>{{ 项.可读信 ? '✉' : 项.名称[0] }}</b>
              </span>
              <span class="ware-main">
                <b class="ware-name">{{ 项.名称 }}</b>
                <span class="ware-desc">{{ 项.描述 }}</span>
              </span>
              <span class="ware-acts">
                <button v-if="项.可读信" class="btn mini" @click="打开信(项.信门牌!)">读</button>
                <button v-if="项.可布设" class="btn mini" :disabled="发送中" @click="布设()">装在这个房间</button>
                <button v-if="项.可用运作" class="btn mini" @click="用运作(项.id)">使用</button>
                <button
                  v-for="夫 in 项.运作对象"
                  :key="'运' + 夫.门牌"
                  class="btn mini"
                  @click="用运作(项.id, 夫.门牌)"
                >
                  给{{ 夫.夫名 }}
                </button>
                <button
                  v-for="妻 in 项.可送对象"
                  :key="妻.门牌"
                  class="btn mini"
                  :disabled="发送中"
                  @click="送出(项.id, 妻.门牌)"
                >
                  送给{{ 妻.妻名 }}
                </button>
                <button
                  v-for="妻 in 项.可装载对象"
                  :key="'载' + 妻.门牌"
                  class="btn mini"
                  :disabled="发送中"
                  @click="装载(项.id, 妻.门牌)"
                >
                  装载给{{ 妻.妻名 }}
                </button>
              </span>
            </div>
            <p v-if="!背包列表.length" class="hint center">(空空如也)</p>
          </div>
        </div>
      </div>

      <!-- ═══════════ 商店(次日达网购;礼物页签=裂缝解锁后现,商店自己就是进度条) ═══════════ -->
      <div v-if="显示商店" class="mask" @click.self="显示商店 = false">
        <div class="sheet shop">
          <button class="sheet-close" @click="显示商店 = false">✕</button>
          <div class="shop-hero">
            <div class="ui-kicker light">WUTONGLI MALL / 网购商城</div>
            <b>商 店</b>
            <em>次日达 · 送到管理员室</em>
            <span class="shop-cash">¥ {{ data.现金 }}</span>
          </div>
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
          </div>
          <div class="sheet-body shop-grid">
            <div v-for="项 in 当前货架" :key="项.id" class="ware-card">
              <span class="ware-pic">
                <img
                  v-if="!道具图失效[项.id]"
                  :src="道具图(项.id)"
                  :alt="项.名称"
                  loading="lazy"
                  draggable="false"
                  @error="道具图失效[项.id] = true"
                />
                <b v-else>{{ 项.名称[0] }}</b>
              </span>
              <span class="ware-main">
                <b class="ware-name">{{ 项.名称 }} <em class="ware-price">¥{{ 项.价格 }}</em></b>
                <span class="ware-desc">{{ 项.描述 }}</span>
              </span>
              <button class="btn rite ware-buy" :disabled="发送中 || data.现金 < (项.价格 ?? 0)" @click="买(项.id)">
                {{ data.现金 < (项.价格 ?? 0) ? '钱不够' : '买下' }}
              </button>
            </div>
            <p v-if="!当前货架.length" class="hint center">{{ 当前空文案 }}</p>
          </div>
        </div>
      </div>

      <!-- ═══════════ 监控(装了摄像头的户;她独处时的画面) ═══════════ -->
      <div v-if="显示监控" class="mask" @click.self="显示监控 = false">
        <div class="sheet">
          <button class="sheet-close" @click="显示监控 = false">✕</button>
          <div class="shop-hero cams">
            <div class="ui-kicker light">HIDDEN EYES / 你装下的眼睛</div>
            <b>监 控</b>
            <em>没人看着的时候的她。看完记得想想:你注意到了什么?</em>
          </div>
          <div class="sheet-body">
            <button v-for="m in 监控列表" :key="m" class="cam-row" :disabled="发送中" @click="看监控(m)">
              <img
                v-if="!头像失效[户静态表[m].妻名]"
                class="cam-face"
                :src="头像图(户静态表[m].妻名)"
                :alt="户静态表[m].妻名"
                @error="头像失效[户静态表[m].妻名] = true"
              />
              <b v-else class="cam-face fb">{{ 户静态表[m].妻名[0] }}</b>
              <span class="cam-main">
                <b>{{ m }} 室 · {{ 户静态表[m].妻名 }}</b>
                <em>调出画面</em>
              </span>
              <span class="cam-rec">● REC</span>
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

      <!-- ═══════════ 拾获卡(2026-07-17 用户反馈:翻出东西不能一闪而过)——带【】的重要提示
           (线索/收获类)升级成点击才收下的 gal 卡,普通提示仍走 toast ═══════════ -->
      <div v-if="拾获卡 && !发送中" class="loot-card" title="点击收下" @click="拾获卡 = ''">
        <div class="ui-kicker">FOUND / 拾获</div>
        <p>{{ 拾获卡 }}</p>
        <span class="loot-hint">点击收下</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FunctionalComponent } from 'vue';

import type { SchemaType } from '../../schema';
import { 由头冷却楼, 由头工具表, 户静态表, 房间表, 查房间, 查性癖, 查特殊场景, 查裂缝, 查道具, 道具表, 门牌列表, 难度表, type 道具配置, type 门牌 } from '../../stageConfig';
import { 丈夫在楼, 妻位置推算, 当前天数, 当前时段 } from '../../脚本/游戏逻辑/楼层时钟';
import { 查金币 } from '../../脚本/游戏逻辑/经济系统';
import { 可晋阶 } from '../../脚本/游戏逻辑/结算系统';
import { useDataStore } from './store';

// ── 描边线条图标(初星 icon-sprite 语法:24×24 stroke=currentColor;feather 风手写路径) ──

const 图标库: Record<string, string> = {
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  cctv: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/>',
  map: '<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  exit: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  door: '<rect x="5" y="2" width="14" height="20" rx="1"/><circle cx="15" cy="12" r="1"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  lock: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/>',
  arrow: '<circle cx="12" cy="12" r="10"/><path d="m12 16 4-4-4-4"/><path d="M8 12h8"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  tv: '<rect x="2" y="7" width="20" height="15" rx="2"/><path d="m17 2-5 5-5-5"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="m8.5 7.5 3.5 4 3.5-4M12 11.5V17M9.5 13.5h5M9.5 15.5h5"/>',
};

/** 线条 SVG 兜底(水彩图标加载失败时用,颜色取墨色定值) */
function 兜底图标(n: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#5a5566" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${图标库[n] ?? ''}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 图标=AI 生成水彩小物(素材/图标/,与背景同画风);onerror 回退线条 SVG
const Ic: FunctionalComponent<{ n: string }> = props =>
  h('img', {
    class: 'ic',
    src: `${素材基址}/图标/${props.n}.webp`,
    alt: '',
    draggable: false,
    onError: (e: Event) => {
      const t = e.target as HTMLImageElement;
      if (t.dataset.fb) return;
      t.dataset.fb = '1';
      t.src = 兜底图标(props.n);
    },
  });
Ic.props = ['n'];

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
/** 杀时间偏移(MVU 持久,与脚本同一本账):一切时间读数=真实楼层+偏移 */
const 偏移楼 = computed(() => data.value?.系统?._时段偏移楼 ?? 0);
const 钟楼号 = computed(() => 末楼号.value + 偏移楼.value);
const 时段 = computed(() => 当前时段(钟楼号.value));
const 天数 = computed(() => 当前天数(钟楼号.value));

// ── 场景与移动(走动零成本纯UI;_场景 与脚本快照共用) ──

const 当前房间 = ref<string | null>(null);
const 显示地图 = ref(false);
/** 进房那一刻的末楼号(随 _场景 持久;位置种子在房内期间冻结——否则身边的人被"传送"走) */
const 进房末楼 = ref(0);
const 位置种子 = computed(() => (当前房间.value ? 进房末楼.value : 末楼号.value) + 偏移楼.value);

/** 赴约(微信"+"约出来,2026-07-18):有效期内她的位置=玩家所在;回档/过期自动失效 */
const 赴约妻 = ref<string | null>(null);
function 刷赴约() {
  try {
    const p = _.get(getVariables({ type: 'chat' }), '_赴约') as { m?: string; 起楼?: number; 至楼?: number } | null;
    const 楼 = 末楼号.value;
    赴约妻.value = p?.m && (p.起楼 ?? 0) <= 楼 && (p.至楼 ?? -1) >= 楼 ? p.m : null;
  } catch {
    赴约妻.value = null;
  }
}
/** 妻位置(显示层统一口:赴约中=跟着玩家走,其余走作息推算) */
function 妻现位(m: 门牌, 楼: number): string {
  if (赴约妻.value === m) return 当前房间.value ?? '大堂';
  return 妻位置推算(m, 楼);
}
watch(显示地图, 开 => {
  if (开) 刷赴约(); // 约完人直接开地图(不产楼),开图那刻补一次同步
});

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
  闪转场(查房间(房间id)?.名称 ?? 房间id);
  // 头像即时点亮(走到谁身边谁亮;回合结束后脚本按位置系统重算)
  在场.value = { 焦点: 可见门牌.value.filter(m => 妻现位(m, 位置种子.value) === 房间id), 在场: [] };
}

function 离开房间() {
  当前房间.value = null;
  已破门进入.value = false;
  写场景(null);
  闪转场('楼道');
  在场.value = { 焦点: [], 在场: [] }; // 身边已无人,头像随之熄灭
  显示地图.value = true; // 走出房门=站上楼道,顺手展开地图选下一处
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

/** chat软记录 _工具由头[门牌][工具id]=使用钟楼(回档陷阱同款:记录在未来=作废) */
const 工具由头记录 = ref<Record<string, Record<string, number>>>({});

function 刷新工具由头() {
  const v = _.get(getVariables({ type: 'chat' }), '_工具由头');
  工具由头记录.value = (v && typeof v === 'object' ? v : {}) as Record<string, Record<string, number>>;
}

const 需要由头 = computed(() => {
  const id = 当前房间.value;
  if (!id || id === '302' || 查房间(id)?.类型 !== '户') return false;
  const 节 = data.value?.户[id];
  // 2026-07-20 用户加码:裂缝破解只是"看清她",她真进了下个阶段(≥1)才算有登门的名分——
  // 刚读完信还停阶段0的,上门照样要工具由头
  return Boolean(节) && !(节!.妻.裂缝.已确认 && 节!.妻.当前阶段 >= 1) && !已破门进入.value;
});

const 可用由头 = computed(() => {
  const id = 当前房间.value ?? '';
  const 包 = data.value?.背包 ?? [];
  const 记 = 工具由头记录.value[id] ?? {};
  return Object.keys(由头工具表).filter(w => {
    if (!包.includes(w)) return false;
    const 上 = 记[w] ?? -999;
    const 修 = 上 > 钟楼号.value ? -999 : 上; // 回档自净
    return 钟楼号.value - 修 >= 由头冷却楼;
  });
});

const 可输入 = computed(() => {
  const id = 当前房间.value;
  if (!id) return false;
  if (id === '302' || id === '管理员室') return true;
  if (房内有人在(id)) {
    // 由头门:裂缝未确认的户,背包里没有可用工具(同工具同户有冷却)=开不了口
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
const 幕房间 = ref<string | null>(null);

/** 人还站在最近这场戏发生的地方(正文可见;一走动就=新场景,正文隐去换到场卡) */
const 在幕中 = computed(() => 当前房间.value === 幕房间.value);

const 显示选项 = computed(() => {
  if (发送中.value || !行动选项.value.length) return false;
  if (!当前房间.value) return 幕房间.value === null; // 楼道态:序章引导等
  return 可输入.value && 在幕中.value;
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
  kicker: string;
  icon: string;
  文案: string;
  类?: string;
  做: () => void;
}

const 房卡动作 = computed<卡动作[]>(() => 房间动作(房卡.value));

/**
 * 房内动作(2026-07-17 垃圾房"不能翻"修复):输入门控收紧后,人站在房里满屏无可点——
 * 把非移动类的房间动作(翻垃圾/撬门)晒进场景视图,不开地图也摸得到下级菜单。
 */
const 当前房间动作 = computed<卡动作[]>(() =>
  房间动作(当前房间.value).filter(a => !['GO', 'VISIT', 'KNOCK', 'HOME'].includes(a.kicker)),
);

function 房间动作(id: string | null): 卡动作[] {
  if (!id) return [];
  const 房 = 查房间(id);
  const 动作: 卡动作[] = [];

  if (房?.类型 === '户' && id !== '302') {
    if (!data.value.户[id]) return []; // 招租中,没有可做的事
    if (房内有人在(id)) {
      动作.push({ kicker: 'VISIT', icon: 'door', 文案: '过去串门', 做: () => 进入(id) });
      // 对饮(P5 丈夫渠道兼信任资源轴):他在家+背包有好酒才摆得上台面
      if (丈夫在楼(data.value.户[id], id as 门牌, 位置种子.value) === '在家' && (data.value?.背包 ?? []).includes('好酒')) {
        动作.push({
          kicker: 'DRINK',
          icon: 'gift',
          文案: `请${户静态表[id as 门牌].夫名}喝一杯`,
          做: () => {
            if (当前房间.value !== id) 进入(id, false, true);
            eventEmit('人妻公寓:对饮', id);
          },
        });
      }
      // 催租三选(P3,天生欠租户):她在家且账上挂着欠租才摆得上台面
      if ((data.value.户[id]?._欠租笔数 ?? 0) > 0 && 妻现位(id as 门牌, 位置种子.value) === id) {
        const 催 = (选择: '硬催' | '宽限' | '垫上') => {
          if (当前房间.value !== id) 进入(id, false, true);
          eventEmit('人妻公寓:催租', { 门牌: id, 选择 });
        };
        动作.push({ kicker: 'RENT', icon: 'coin', 文案: '硬催房租', 类: 'risky', 做: () => 催('硬催') });
        动作.push({ kicker: 'RENT', icon: 'coin', 文案: '批张宽限条', 做: () => 催('宽限') });
        动作.push({ kicker: 'RENT', icon: 'coin', 文案: '悄悄垫上', 做: () => 催('垫上') });
      }
    } else {
      动作.push({ kicker: 'KNOCK', icon: 'bell', 文案: '敲敲门', 做: () => 进入(id) });
      动作.push({
        kicker: 'BREAK IN',
        icon: 'lock',
        文案: 破门目标.value === id && 破门数.value > 0 ? `撬门中…再点 ${6 - 破门数.value} 下` : '撬门(连点)',
        类: 'risky',
        做: () => 敲撬门(id),
      });
      // 空房偷窃(P3):撬进空屋才有翻现金一说;冷却与察觉全在脚本
      if (当前房间.value === id && 已破门进入.value) {
        动作.push({
          kicker: 'SEARCH',
          icon: 'coin',
          文案: '翻找明面上的现金',
          类: 'risky',
          做: () => eventEmit('人妻公寓:空房偷窃', id),
        });
      }
    }
    return 动作;
  }

  if (id === '302') {
    动作.push({ kicker: 'HOME', icon: 'home', 文案: '回家看看', 做: () => 进入(id) });
    return 动作;
  }

  // 管理员室:杀时间(2026-07-17 拍板)——静默快进一个时段,不产楼不耗token;
  // 瓷砖只在人已经走进屋里才出现(同日用户拍板:菜单归正文框架,地图房卡上只有"走过去");
  // 冷却=每真实楼层一次,冷却中 tile 直接不出现(极简,不摆灰按钮)
  if (id === '管理员室') {
    动作.push({ kicker: 'GO', icon: 'arrow', 文案: '走过去', 做: () => 进入(id) });
    if (当前房间.value === id && (data.value?.系统?._上次杀时间楼层 ?? -1) < 末楼号.value) {
      动作.push({ kicker: 'IDLE', icon: 'moon', 文案: '眯一觉', 做: () => eventEmit('人妻公寓:杀时间', '休息') });
      动作.push({ kicker: 'IDLE', icon: 'tv', 文案: '看会儿电视', 做: () => eventEmit('人妻公寓:杀时间', '看电视') });
    }
    return 动作;
  }

  // 公共区
  动作.push({ kicker: 'GO', icon: 'arrow', 文案: '走过去', 做: () => 进入(id) });
  // 出门打听(P5:201渠道;从大堂出门找街坊,伴手礼盒当弹药)
  if (id === '大堂' && (data.value?.背包 ?? []).includes('伴手礼盒')) {
    for (const m of 门牌列表) {
      if (!data.value.户[m] || 户静态表[m].隐身) continue;
      动作.push({
        kicker: 'ASK',
        icon: 'chat',
        文案: `打听${户静态表[m].妻名}家`,
        做: () => {
          if (当前房间.value !== id) 进入(id, false, true);
          eventEmit('人妻公寓:打听', m);
        },
      });
    }
  }
  // 荣耀洞(P5+:洗手间末隔间;人走进去才见瓷砖,冷却中不出现——极简,不摆灰按钮)
  if (id === '洗手间' && 当前房间.value === id && 荣耀洞可用.value) {
    动作.push({
      kicker: 'HOLE',
      icon: 'peep',
      文案: '使用荣耀洞',
      类: 'risky',
      做: () => eventEmit('人妻公寓:荣耀洞'),
    });
  }
  // 公共区零钱(P3:路过的小惊喜;种子+期号与脚本同一真值,拾没拾过看 chat 计数)
  {
    const 零钱 = 查金币(id, 钟楼号.value);
    if (零钱 > 0) {
      动作.push({
        kicker: 'PICK',
        icon: 'coin',
        文案: `捡起零钱(¥${零钱})`,
        做: () => {
          if (当前房间.value !== id) 进入(id, false, true);
          eventEmit('人妻公寓:捡金币', id);
        },
      });
    }
  }
  if (id === '垃圾房') {
    for (const 袋 of 垃圾袋列表.value) {
      动作.push({
        kicker: 'SEARCH',
        icon: 'trash',
        文案: `翻${袋.妻名}家的垃圾袋`,
        类: 'risky',
        做: () => {
          if (当前房间.value !== '垃圾房') 进入('垃圾房', false, true); // 人先走过去,地图和卡都不收
          翻(袋.门牌);
        },
      });
    }
  }
  return 动作;
}

/** 欠租门牌(P3:地图挂"欠租"角标=催租入口可视化) */
function 欠租中(id: string): boolean {
  return (data.value?.户[id]?._欠租笔数 ?? 0) > 0;
}

// ── 手机(P4:设备本体在酒馆页面层,游戏界面只管跳动指示与红点) ──

const 手机来电 = computed(() => (data.value?.系统?._待接来电?.期 ?? -1) >= 0);
const 手机未读 = ref(false);

/** 这次开手机是不是替玩家退的真全屏——是的话,收手机时自动送回去(2026-07-20 玩家点单) */
let 收手机回全屏 = false;

async function 开手机() {
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

const 时段问候 = computed(
  () =>
    ({
      早上: '晨光正好',
      中午: '日头正高',
      下午: '午后正长',
      傍晚: '家家飘出饭菜香',
      晚上: '楼里亮起灯火',
      深夜: '整栋楼都睡了',
    })[时段.value],
);

// ── 楼内的人:与脚本同一套纯函数推算(永不自相矛盾) ──

/** 已入住且非隐身的户(母亲 302 系统级隐身;P5:_母亲入列 后头像亮起=入列) */
const 可见门牌 = computed(() =>
  门牌列表.filter(m => data.value.户[m] && (!户静态表[m].隐身 || data.value.系统?._母亲入列)),
);

/** 某房间此刻有谁(妻按位置推算;夫在自家时段在家) */
function 房内的人(房间id: string): string[] {
  const 名单: string[] = [];
  for (const m of 可见门牌.value) {
    if (妻现位(m, 位置种子.value) === 房间id) 名单.push(户静态表[m].妻名);
    if (m === 房间id && 丈夫在楼(data.value.户[m], m, 位置种子.value) !== '外出' && 户静态表[m].夫名) {
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
    return '没个由头,你在人家门口站不住脚——商店「工具」页签里有你要的借口(同一招对同一家,一天只好使一次)。';
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
  const 记 = (系._荣耀洞上次楼 ?? -999) > 钟楼号.value ? -999 : (系._荣耀洞上次楼 ?? -999); // 回档陷阱自净
  return 钟楼号.value - 记 >= 18;
});

// 2026-07-19 用户纠偏:视觉件=抠图透明立绘叠加(素材在 立绘/荣耀洞_*),背景恒定隔间图;环境版CG作废
const 荣耀洞图 = computed(() => {
  const 系 = data.value?.系统;
  if (!系 || (系._荣耀洞拍 ?? -1) < 0 || 当前房间.value !== '洗手间') return '';
  return `${素材基址}/背景/荣耀洞.webp`;
});

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
  { id: '洗手间', 名称: '洗手间' },
];

// ── 素材(AI 生成,2026-07-17 入库;素材 TAG 与发布 TAG 解耦——素材没变就不用动这里) ──

// ⚠ 基址已含 rq0.26 新素材(荣耀洞抠图件22替换环境CG):下次推 tag 必须叫 rq0.26,或推前改此处对齐 tag 名
const 素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.26/dist/人妻公寓/素材';

function 头像图(名: string): string {
  return `${素材基址}/头像/${名}.webp`;
}

/** 图挂了(断网/边缘缓存未热)回退首字圆徽 */
const 头像失效 = ref<Record<string, boolean>>({});

/** 商店道具图(rq0.12 生图入库;挂了回退首字) */
function 道具图(id: string): string {
  return `${素材基址}/道具/${id}.webp`;
}

const 道具图失效 = ref<Record<string, boolean>>({});

// ── 立绘(2026-07-17 用户拍板:垫板压立绘,她在这场戏里才入画,人走戏收;
//    多人站位同日拍板:1人右下,2人加左下对齐,3人加中位,4~6人并排均分) ──

const 立绘失效 = ref<Record<string, boolean>>({});

interface 立绘项 {
  src: string;
  位: 'pos-right' | 'pos-left' | 'pos-center' | 'pos-row';
  style?: Record<string, string>;
}

const 立绘列表 = computed<立绘项[]>(() => {
  if (!当前房间.value) return [];
  // 荣耀洞戏中:立绘槽由洞件接管(匿名性:常规妻立绘一律不入画)
  const 洞件 = 荣耀洞件.value;
  if (洞件 !== undefined) {
    return 洞件 && !立绘失效.value[洞件] ? [{ src: 洞件, 位: 'pos-right' as const }] : [];
  }
  const 图 = 可见门牌.value
    .filter(k => 妻现位(k, 位置种子.value) === 当前房间.value)
    .map(m => {
      // 立绘随服装差分(P5):穿戴中外装SKU→差分图,无图/图挂回退基础立绘(spec 约定)
      const 妻名 = 户静态表[m].妻名;
      const sku = data.value.户[m]?.妻._穿着SKU?.['外装'];
      const 差分 = sku ? `${素材基址}/立绘/${妻名}_${sku}.webp` : '';
      return 差分 && !立绘失效.value[差分] ? 差分 : `${素材基址}/立绘/${妻名}.webp`;
    })
    .filter(src => !立绘失效.value[src])
    .slice(0, 6);
  const n = 图.length;
  if (n >= 4) {
    // 并排均分画幅(数组顺序即绘制顺序,右邻略压左邻,自然的队列层次)
    return 图.map((src, i) => ({
      src,
      位: 'pos-row' as const,
      style: { left: `${(((i + 0.5) * 100) / n).toFixed(2)}%` },
    }));
  }
  const 位序 = ['pos-right', 'pos-left', 'pos-center'] as const;
  const 排 = 图.map((src, i) => ({ src, 位: 位序[i] }));
  // 绘制顺序=中位垫底、左次之、右(主位)最上;z 不能碰——正文层在 z2,立绘全员必须留在 z1 之下
  const 层 = { 'pos-center': 0, 'pos-left': 1, 'pos-right': 2 } as const;
  return 排.sort((a, b) => 层[a.位] - 层[b.位]);
});

function 背景图(房间id: string | null): string {
  // 楼道没有专属图,借楼梯间的(同一栋楼的筒子间气质)
  return `${素材基址}/背景/${房间id && 房间色[房间id] ? 房间id : '楼梯间'}.webp`;
}

// ── 描点地图(rq0.12):徽章钉在立面画上;坐标=画布百分比,楼体单图+调色做时段,点位永不漂 ──

const 立面失效 = ref(false);

/** 省流关位图/立面图挂了 → 退回玻璃楼体 */
const 用画布地图 = computed(() => !省流.value && !立面失效.value);

/** 时段调色档:同一张傍晚底图,白天提亮降饱和、夜里压暗上蓝 */
const 时段色调 = computed(
  () => (({ 早上: 'day', 中午: 'day', 下午: 'day', 傍晚: 'dusk', 晚上: 'night', 深夜: 'late' }) as const)[时段.value],
);

/** 点位坐标:立面_傍晚.webp(rq0.12 四层版)各门窗中心的百分比,已按点位预览校准;不动图不用再标 */
const 立面点位: readonly { id: string; 名: string; x: number; y: number }[] = [
  { id: '天台', 名: '天台', x: 50, y: 12.5 },
  { id: '301', 名: '301', x: 37, y: 26 },
  { id: '302', 名: '302', x: 63, y: 26 },
  { id: '201', 名: '201', x: 37, y: 41 },
  { id: '202', 名: '202', x: 63, y: 41 },
  { id: '101', 名: '101', x: 37, y: 56 },
  { id: '102', 名: '102', x: 63, y: 56 },
  { id: '楼梯间', 名: '楼梯间', x: 79, y: 48 },
  { id: '管理员室', 名: '管理员室', x: 37, y: 74 },
  { id: '大堂', 名: '大堂', x: 54, y: 75 },
  { id: '信箱区', 名: '信箱', x: 71, y: 75 },
  { id: '垃圾房', 名: '垃圾房', x: 84, y: 80 },
  { id: '洗手间', 名: '洗手间', x: 21, y: 75 },
];

const 地图点位 = computed(() =>
  立面点位.map(p => {
    const 户 = /^\d+$/.test(p.id) ? 户牌(p.id as 门牌) : null;
    return { ...p, 空置: 户?.空置 ?? false };
  }),
);

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
/** 上次回合发生的房间(2026-07-20 玩家点单:人走出房间后撤回/重演一起藏,防跨场景回滚) */
const 回合房间 = ref<string | null>(null);

function 刷新可重掷() {
  const 变量 = getVariables({ type: 'chat' });
  可重掷.value = Boolean(_.get(变量, '_上次回合'));
  // 记回合发生地:人走出这间房,撤回/重演一起收(跨场景回滚只会制造混乱)
  回合房间.value = (_.get(变量, '_场景') as string | undefined) ?? null;
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
    const 位 = 妻现位(牌, 钟楼号.value);
    if (查房间(位)) return 位;
  }
  return null;
}

function 点选项(文本: string) {
  const 目标 = 选项移动目标(文本);
  if (目标 && 目标 !== 当前房间.value) 进入(目标);
  发出(文本);
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
  let 文本 = 输入文本.value.trim();
  if (!文本) return;
  输入文本.value = '';
  // 由头进门:自动挑第一件可用工具垫话头(舞台指示进正文=AI天然接戏),冷却记账交给脚本
  if (需要由头.value && 可用由头.value.length) {
    const 用 = 可用由头.value[0];
    eventEmit('人妻公寓:用由头', { 门牌: 当前房间.value, 工具: 用 });
    文本 = `(${用}在手,以${由头工具表[用]}的名义敲开了门)${文本}`;
  }
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
const 难度展开 = ref(false); // 标题屏:false=主菜单(开始游戏/设置),true=难度选择
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
  return {
    门牌: m,
    妻名: 户静态表[m].妻名,
    夫名: 户静态表[m].夫名 || '她丈夫',
    夫状态: 丈夫在楼(data.value.户[m], m, 位置种子.value),
    妻,
    夫,
    三轴: [
      { 名: '好感', 类: 'fav', 值: 妻.好感值 },
      { 名: '堕落', 类: 'sin', 值: 妻.堕落值 },
      { 名: '婚姻', 类: 'marr', 值: 妻.婚姻值 },
    ],
    仪容项: (() => {
      // 对得上商店 SKU 的项带 图id(道具图缩略卡);自由描述项纯文字软卡
      const 配图 = (值: string) => (查道具(值) ? 值 : undefined);
      const 项: { 标: string; 值: string; 图id?: string }[] = [
        { 标: '外装', 值: 妻.外装 || '—', 图id: 配图(妻.外装) },
        { 标: '妆容', 值: 妻.妆容 || '素颜', 图id: 配图(妻.妆容) },
      ];
      if (妻.内衣) 项.push({ 标: '内衣', 值: 妻.内衣, 图id: 配图(妻.内衣) });
      for (const 件 of 妻.特殊) 项.push({ 标: '佩着', 值: 件, 图id: 配图(件) });
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
  };
});

const 选中可晋阶 = computed(() => {
  const m = 选中门牌.value;
  if (!m || !data.value.户[m]) return false;
  return 可晋阶(data.value.户[m].妻);
});

/** L4 要钱按钮(P3:钱的流向反转=堕落可视化;冷却与刹车全在脚本) */
const 选中可要钱 = computed(() => {
  const m = 选中门牌.value;
  return !!m && (data.value.户[m]?.妻.当前阶段 ?? 0) >= 4;
});

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
      // 礼物等可送出:须与她同处一室(当面);工具/运作/药物/性癖不走"送"
      // (药物=晋阶按钮自动消耗;性癖=装载;302特例:回家时可送妈东西——破妈妈墙的唯一入口,入列前也通)
      可送对象:
        !配?.常驻 && !信门牌 && id !== '针孔摄像头' && !['运作', '工具', '药物', '性癖'].includes(配?.类别 ?? '')
          ? [
              ...可见门牌.value
                .filter(m => 当前房间.value && 妻位置推算(m, 位置种子.value) === 当前房间.value)
                .map(m => ({ 门牌: m, 妻名: 户静态表[m].妻名 })),
              ...(当前房间.value === '302' && data.value.户['302'] ? [{ 门牌: '302' as 门牌, 妻名: '妈' }] : []),
            ].filter((v, i, a) => a.findIndex(x => x.门牌 === v.门牌) === i)
          : [],
      // 性癖装载(P5):对象=阶段够档且槽未满的妻(不必同室,装载是管理动作)
      可装载对象:
        配?.类别 === '性癖'
          ? 可见门牌.value
              .filter(m => {
                const 性 = 查性癖(id);
                const 妻 = data.value.户[m]?.妻;
                if (!性 || !妻) return false;
                if (性.限定户 && !性.限定户.includes(m)) return false;
                return 妻.当前阶段 >= (性.档 === 5 ? 5 : 4) && 妻.性癖装载.length < 3 && !妻.性癖装载.includes(id);
              })
              .map(m => ({ 门牌: m, 妻名: 户静态表[m].妻名 }))
          : [],
      // 运作道具(P3):全局四件直接"使用";户向四件按丈夫点名(须该户已入住且有夫)
      可用运作: 配?.类别 === '运作' && !['钓鱼团购券', '夜班内推', '外地项目介绍', '代订惊喜'].includes(id),
      运作对象:
        配?.类别 === '运作' && ['钓鱼团购券', '夜班内推', '外地项目介绍', '代订惊喜'].includes(id)
          ? 可见门牌.value
              .filter(m => 户静态表[m].夫名)
              .map(m => ({ 门牌: m, 夫名: 户静态表[m].夫名 }))
          : [],
    };
  }),
);

function 用运作(道具id: string, 门牌号?: 门牌) {
  显示背包.value = false;
  eventEmit('人妻公寓:使用运作', { 道具id, 门牌: 门牌号 });
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
const 商店页签 = ref('工具');

const 货架 = computed(() => {
  const 全部 = Object.values(道具表).filter(d => (d.价格 ?? 0) > 0);
  const 按类 = (类: 道具配置['类别']) => 全部.filter(d => d.类别 === 类);
  const 户们 = Object.values(data.value?.户 ?? {});
  const 最高阶段 = 户们.reduce((高, 节点) => Math.max(高, 节点.妻.当前阶段), 0);
  const 架: { 页签: string; 商品: 道具配置[]; 空文案?: string }[] = [
    { 页签: '工具', 商品: 按类('工具') },
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
  // 特殊场景(P5):只上前置满足的条目——买不到的戏不摆出来吊人;男用贞操带等无场景配置的常驻
  if (最高阶段 >= 3)
    架.push({
      页签: '特殊场景',
      商品: 按类('特殊场景').filter(d => {
        const 场 = 查特殊场景(d.id);
        if (!场) return true;
        try {
          return 场.前置(data.value as never);
        } catch {
          return false;
        }
      }),
      空文案: '有些节目要等合适的人到齐才开演。',
    });
  if (最高阶段 >= 4) 架.push({ 页签: '性癖', 商品: 按类('性癖'), 空文案: '这一栏的货,认人。到货会通知你。' });
  // 药物页签不常驻(P5):剧情节点开窗——当前唯一窗口=母亲入列且到阶段2(她的首夜必需)
  if (data.value?.系统?._母亲入列 && (data.value.户['302']?.妻.当前阶段 ?? 0) >= 2) {
    架.push({ 页签: '药物', 商品: 按类('药物'), 空文案: '柜台下面的东西,问了才有。' });
  }
  return 架;
});

const 当前货架 = computed(() => 货架.value.find(页 => 页.页签 === 商店页签.value)?.商品 ?? []);
const 当前空文案 = computed(
  () => 货架.value.find(页 => 页.页签 === 商店页签.value)?.空文案 ?? '(暂时没货)',
);

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

/**
 * 监控列表改响应式(2026-07-17 用户反馈:装完摄像头按钮不立刻弹):手动刷新的 ref 会在
 * store 拉回新账之前读到旧数据,之后又无人再刷;computed 跟着 store 走,数据一到位自动弹。
 * 布设名单主账在 stat(与背包同生共死);旧局 chat 变量 `_摄像头` 只读兼容。
 */
const 监控列表 = computed<门牌[]>(() => {
  const 布设 = (data.value?.系统 as { _摄像头布设?: Record<string, boolean> } | undefined)?._摄像头布设 ?? {};
  let legacy: Record<string, boolean> = {};
  try {
    legacy = (_.get(getVariables({ type: 'chat' }), '_摄像头') ?? {}) as Record<string, boolean>;
  } catch {
    /* chat 变量读取失败只影响旧局兼容 */
  }
  return 门牌列表.filter(m => 布设[m] || legacy[m]);
});

function 看监控(门牌号: 门牌) {
  显示监控.value = false;
  // 2026-07-17 用户拍板:看监控=回302自己屋里看,再跑偷窥AI回合出正文,完成后弹选择。
  // 移动不在这里做:成败由脚本判(没布设/冷却/她不在家=白跑),成功时脚本写场景+发"监控回合"事件
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

function 清洗(原文: string, 流式 = false): string {
  const 闭合清 = 原文
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
    .replace(/<StatusPlaceHolderImpl\/>/g, '')
    // 预设的摘要/折叠块(<details>)只藏不删:楼层原文保留给 AI 与预设当记忆,显示层吞掉
    .replace(/<details[^>]*>[\s\S]*?<\/details>/gi, '')
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*-{2,}>?\s*$/gm, '')
    .replace(/<options>[\s\S]*?<\/options>/g, '')
    .replace(/<行为等级>[\s\S]*?<\/行为等级>/g, '')
    // 玩家预设夹带的整篇 HTML 组件(2026-07-18 玩家实测,同脚本侧 清洗正文):裸代码墙整体剥除
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*?```/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?<\/html\s*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // 玩家预设夹带的包装 div(2026-07-19,同脚本侧):konata-thinking-wrapper/tucao-w 等
    // 空壳或漏闭合裸 div 剥壳(内容保留;对旧档已污染楼层同样生效)
    .replace(/<\/?div[^>]*>/gi, '');
  const 全清 = 闭合清
    // 未闭合块也吞掉:流式=防半截标记块闪现;完整楼层=防截断残块
    .replace(/<details[^>]*>[\s\S]*$/i, '')
    .replace(/<think(?:ing)?>[\s\S]*$/i, '')
    .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
    .replace(/<!--[\s\S]*$/, '')
    .replace(/<UpdateVariable>[\s\S]*$/, '')
    .replace(/<options>[\s\S]*$/, '')
    .replace(/<行为等级>[\s\S]*$/, '')
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*$/i, '')
    .replace(/<!DOCTYPE[\s\S]*$/i, '')
    .replace(/<style[^>]*>[\s\S]*$/i, '')
    .replace(/<script[^>]*>[\s\S]*$/i, '')
    .trim();
  // 吞尾防误杀(2026-07-17,与脚本侧 清洗正文 同款):AI 把协议标记漏闭合写在开头时,
  // 吞尾会把整楼显示成空白——完整楼层回退只清闭合块,顺手剥掉裸标记词;流式期间不回退
  if (!流式 && !全清 && 闭合清.trim()) {
    console.warn('[人妻公寓客户端] 显示层吞尾把楼层吞成了空白,回退只清闭合块');
    return 闭合清.replace(/<\/?(?:think(?:ing)?|reason(?:ing)?|UpdateVariable|options|行为等级|details[^>]*)>/gi, '').trim();
  }
  return 全清;
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
    for (const 消息 of 消息组) {
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

async function 进真全屏() {
  const 根 = document.documentElement as 全屏根;
  if (根.requestFullscreen) await 根.requestFullscreen();
  else if (根.webkitRequestFullscreen) await 根.webkitRequestFullscreen();
  else throw new Error('Fullscreen API 不可用');
}

async function 切换全屏() {
  const 文档 = document as 全屏文档;
  try {
    if (document.fullscreenElement ?? 文档.webkitFullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else 文档.webkitExitFullscreen?.();
    } else {
      await 进真全屏();
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
  // 右上角日月钮=显式切档(不再绕过主题档直改暗色——"跟随"下被绕改会失同步,2026-07-17 修复)
  主题模式.value = 暗色.value ? '日间' : '夜间';
  改设置();
}

// ── 界面偏好设置(全走 localStorage,不碰游戏变量) ──

const 设置开 = ref(false);
const 设置存储键 = '人妻公寓_界面偏好';

/** 主题三档:日间 / 夜间 / 跟随游戏时段 */
const 主题模式 = ref<'日间' | '夜间' | '跟随'>('日间');
/** 正文字号档 */
const 字号档 = ref<'小' | '中' | '大'>('中');
/** 正文字色(''=跟随主题日夜自动翻转;自选后固定不随主题) */
const 正文字色 = ref('');
/** 立绘显示(右下角入画;垫板压立绘) */
const 立绘显示 = ref(true);

/** 隐藏正文(gal惯例小开关:渐隐文字层欣赏立绘;只由按钮开关,再按恢复;不入偏好不持久) */
const 正文隐藏 = ref(false);
/** 正文垫板不透明度(0.2~1.0,越高字越清背景越淡) */
const 垫板浓度 = ref(0.66);
/** 省流:关掉全部背景图/立绘/图标,回纯 CSS */
const 省流 = ref(false);
/** 减少动效 */
const 减动效 = ref(false);

const 字号档表: Record<'小' | '中' | '大', string> = { 小: '0.82em', 中: '0.9em', 大: '1.02em' };

/** 主题「跟随」时按游戏时段推日夜(晚上/深夜=暗) */
const 时段偏暗 = computed(() => 时段.value === '晚上' || 时段.value === '深夜');

// 主题结算全响应式(2026-07-17 跟随时段黑字修复):挂载恢复/切档/楼层推进换时段/回合完成,
// 任何一路动到依赖都立刻重算,不再依赖手工调用点的时序
watchEffect(() => {
  const 该暗 = 主题模式.value === '跟随' ? 时段偏暗.value : 主题模式.value === '夜间';
  应用主题(该暗);
});

/** 把偏好写进根元素的 CSS 变量 + body class(省流/减动效) */
function 应用界面偏好() {
  const root = document.documentElement;
  root.style.setProperty('--prose-size', 字号档表[字号档.value]);
  root.style.setProperty('--entry-veil', String(垫板浓度.value));
  if (正文字色.value) root.style.setProperty('--prose-ink', 正文字色.value);
  else root.style.removeProperty('--prose-ink');
  root.classList.toggle('rq-lite', 省流.value);
  root.classList.toggle('rq-still', 减动效.value);
}

function 持久化设置() {
  try {
    localStorage.setItem(主题存储键, 暗色.value ? '1' : '0'); // 兼容旧键
    localStorage.setItem(
      设置存储键,
      JSON.stringify({
        主题模式: 主题模式.value,
        字号档: 字号档.value,
        正文字色: 正文字色.value,
        垫板浓度: 垫板浓度.value,
        省流: 省流.value,
        减动效: 减动效.value,
        立绘显示: 立绘显示.value,
      }),
    );
  } catch {
    /* 隐私模式等存不了就不记 */
  }
}

/** 任一设置项改动:立即应用 + 存盘 */
function 改设置() {
  应用界面偏好();
  持久化设置();
}

function 恢复设置() {
  try {
    const raw = localStorage.getItem(设置存储键);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.主题模式) 主题模式.value = s.主题模式;
      else 主题模式.value = localStorage.getItem(主题存储键) === '1' ? '夜间' : '日间'; // 旧键迁移
      if (s.字号档) 字号档.value = s.字号档;
      if (typeof s.正文字色 === 'string') 正文字色.value = s.正文字色;
      if (typeof s.垫板浓度 === 'number') 垫板浓度.value = s.垫板浓度;
      省流.value = !!s.省流;
      减动效.value = !!s.减动效;
      if (typeof s.立绘显示 === 'boolean') 立绘显示.value = s.立绘显示;
    } else {
      主题模式.value = localStorage.getItem(主题存储键) === '1' ? '夜间' : '日间';
    }
  } catch {
    /* 读不到就用默认 */
  }
  应用界面偏好();
}

// ── 重开一局(两段式确认;真重置在脚本侧:删楼+清过程变量,完成后 iframe 自刷回标题屏) ──

const 重开确认 = ref(false);

// 弹窗一关就撤销"待确认"武装态,防下次误触
watch(设置开, 开 => {
  if (!开) 重开确认.value = false;
});

function 点重开() {
  if (!重开确认.value) {
    重开确认.value = true;
    return;
  }
  重开确认.value = false;
  设置开.value = false;
  发送中.value = true; // 清场期间锁输入,收到"已重开"即整页重建
  eventEmit('人妻公寓:重开一局');
}

function 重置偏好() {
  主题模式.value = '日间';
  字号档.value = '中';
  正文字色.value = '';
  垫板浓度.value = 0.66;
  省流.value = false;
  减动效.value = false;
  立绘显示.value = true;
  try {
    localStorage.removeItem(设置存储键);
    localStorage.removeItem(主题存储键);
  } catch {
    /* ignore */
  }
  应用界面偏好();
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
  刷新偷窥待选();

  eventOn('人妻公寓:生成开始', () => {
    // 脚本侧发起的回合(查看监控等)也要锁输入+亮书写态;驻留的拾获卡顺手收掉不挡戏
    发送中.value = true;
    拾获卡.value = '';
  });
  eventOn('人妻公寓:流式', (文本: string) => {
    // 流式半截文本只走本卡清洗,不过玩家正则(闭合标记未到会整段吞空)
    const 净文 = 清洗(文本, true);
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
    幕房间.value = 当前房间.value; // 本轮的戏与选项绑定产出场景,换地方即收
    void 取卷轴();
    刷新可重掷();
    刷新在场();
    刷新行动选项();
    刷新偷窥待选();
    刷赴约();
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* store 未带 pull 时靠轮询兜底 */
    }
  });
  eventOn('人妻公寓:回合失败', (原因: string) => {
    发送中.value = false;
    流式段.value = [];
    偷窥待选.value = null; // 偷窥回合没演成,挂起的选择卡一并作废(脚本侧同步清账)
    // 回合失败=这一轮没发生,是提示不是事故——走可消散 toast,不占常驻错误横幅(2026-07-17 用户反馈)
    if (!原因.startsWith('已取消')) 弹提示(`回合失败,这一轮没有发生:${原因}`, 6000);
    void 取卷轴();
    刷新可重掷();
  });
  eventOn('人妻公寓:已重开', () => {
    // 楼层与过程变量已清,整页重建最干净(幕房间/卷轴/弹窗全归零),回到标题屏
    window.location.reload();
  });
  eventOn('人妻公寓:监控回合', () => {
    // 脚本侧已写好 _场景=302 并即将开偷窥回合,这里只同步画面(进入 重写同值场景,幂等)
    if (当前房间.value !== '302') 进入('302');
  });
  eventOn('人妻公寓:手机状态', (状: { 未读?: boolean }) => {
    手机未读.value = !!状?.未读;
    刷赴约(); // 约出来是纯手机操作不产楼,靠这条通知让地图位置即时跟上
  });
  eventOn('人妻公寓:手机收起', async () => {
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
    // 地图行动卡开着:结果以"线索卡"翻出(动画),不走 toast
    if (显示地图.value && 房卡.value) 结果卡.value = 消息;
    // 带【】的重要提示(线索/收获)=拾获卡驻留,点击才收下(2026-07-17 用户反馈:出货不能一闪而过)
    else if (消息.startsWith('【')) 拾获卡.value = 消息;
    else 弹提示(消息);
    // 侦探/商店操作是纯 UI 回合(不产楼):软计数即时刷新,store 拉新(监控列表是 computed 自动跟)
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
  幕房间.value = 当前房间.value; // 刷新恢复:已有正文与选项视为当前场景的
  try {
    进房末楼.value = 场景?.进房末楼 ?? getLastMessageId();
  } catch {
    进房末楼.value = 0;
  }
  刷赴约();

  // 恢复界面偏好(主题三档/字号/垫板/省流/减动效)
  恢复设置();

  // 手机端默认全屏画幅(2026-07-19 用户拍板:移动端适配已达标,直接以全屏模式起步)。
  // 走 CSS 画幅而非 Fullscreen API——后者没有用户手势会被浏览器拒;右上角全屏钮仍可切真全屏
  if (window.matchMedia('(max-width: 540px)').matches && !全屏中.value) {
    全屏中.value = true;
    应用画幅(true);
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
  padding: 6px 18px;
  font-family: inherit;
  font-size: 0.92em;
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
    linear-gradient(180deg, rgba(var(--sc-a, 165, 175, 195), 0.14), rgba(var(--sc-b, 205, 215, 230), 0.05) 42%, transparent 72%),
    linear-gradient(rgba(255, 250, 245, 0.32), rgba(255, 250, 245, 0.42)),
    var(--scene-img, none) center / cover no-repeat,
    var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(6px);
  transition: background 0.5s ease;
}

/* 立绘:她在这场戏里才入画;垫板压立绘(文字永远可读),左缘羽化不硬切。
   2026-07-17 用户反馈加大:2/3 身位近景素材+高度提到 84%,细白描边(叠 drop-shadow)+柔光 */
.portrait {
  position: absolute;
  right: -10px;
  bottom: 0;
  z-index: 1;
  height: 84%;
  max-height: 500px;
  pointer-events: none;
  filter: drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.85)) drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.85))
    drop-shadow(0 8px 20px rgba(20, 24, 40, 0.35));
  mask-image: linear-gradient(to right, transparent, #000 14%);
  -webkit-mask-image: linear-gradient(to right, transparent, #000 14%);
}

/* 多人站位(2026-07-17 用户拍板):第2人左下与右侧对齐(羽化翻到右缘),第3人居中(双缘羽化),
   4~6人并排均分(left 由脚本按人数算,统一收身高防打架) */
.portrait.pos-left {
  right: auto;
  left: -10px;
  mask-image: linear-gradient(to left, transparent, #000 14%);
  -webkit-mask-image: linear-gradient(to left, transparent, #000 14%);
}

.portrait.pos-center {
  right: auto;
  left: 50%;
  transform: translateX(-50%);
  mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
}

.portrait.pos-row {
  right: auto;
  height: 68%;
  transform: translateX(-50%);
  mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
}

:global(html.rq-dark) .portrait {
  filter: brightness(0.84) drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.5)) drop-shadow(0 8px 20px rgba(0, 0, 0, 0.55));
}

:global(html.rq-lite) .portrait {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.story {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px;
  scrollbar-width: thin;
  scrollbar-color: rgba(38, 169, 244, 0.4) transparent;
  transition: opacity 0.28s ease;
}

/* 隐藏正文:透明度渐隐+穿透点击(层还在,滚动位置不丢);恢复只认按钮 */
.story.story-veiled {
  opacity: 0;
  pointer-events: none;
}

.story-hide-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 3;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(4px);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(20, 24, 40, 0.18);
  transition: transform 0.15s ease;
}

.story-hide-btn:hover {
  transform: translateY(-1px);
}

:global(html.rq-dark) .story-hide-btn {
  background: rgba(30, 32, 46, 0.72);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 到场卡:走动后的"开场镜头" */
.arrive {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 6px 8px;
  animation: card-pop-in 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.arrive b {
  font-size: 1.08em;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: var(--ink);
}

.arrive b::after {
  content: '';
  display: block;
  width: 40px;
  height: 3px;
  margin-top: 5px;
  border-radius: 2px;
  background: linear-gradient(90deg, rgb(var(--sc-a, 165, 175, 195)), rgb(var(--sc-b, 205, 215, 230)));
}

.arrive-mood {
  margin: 4px 0 0;
  font-family: var(--font-prose);
  font-size: 0.86em;
  line-height: 1.8;
  color: var(--ink-soft);
}

.arrive-who {
  margin: 0;
  font-size: 0.8em;
  font-weight: 700;
  color: var(--pink);
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
  color: var(--prose-ink, var(--ink));
  font-size: var(--prose-size, 0.9em);
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

/* 2×2 双列(2026-07-17 用户反馈:竖排四条太占空间) */
.option-row {
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
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

:global(html.rq-lite) .option-row,
:global(html.rq-lite) .peep-card {
  --opt-img: none;
}

:global(html.rq-dark) .option-chip.gal {
  background:
    linear-gradient(90deg, rgba(44, 46, 64, 0.55), rgba(44, 46, 64, 0.94) 16%, rgba(44, 46, 64, 0.94) 84%, rgba(44, 46, 64, 0.55)),
    #2c2e40;
  border-color: rgba(255, 255, 255, 0.16);
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

/* gal 式遮罩(2026-07-17 用户提案重设计):斜纹绢帘+粉蓝双色晕影+中心聚焦,替代死黑蒙版 */
.mask {
  position: absolute;
  inset: 0;
  z-index: 30;
  background:
    repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.045) 0 2px, transparent 2px 6px),
    radial-gradient(120% 90% at 50% 0%, rgba(255, 79, 154, 0.12), transparent 55%),
    radial-gradient(130% 100% at 50% 110%, rgba(38, 169, 244, 0.14), transparent 60%),
    radial-gradient(140% 140% at 50% 50%, rgba(24, 22, 34, 0.3), rgba(16, 14, 26, 0.6)),
    rgba(20, 22, 30, 0.2);
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

/* 拾获卡:线索/收获的正经展示位——驻留到点击,金边纸卡(信物感),压 toast 一层 */
.loot-card {
  position: absolute;
  left: 50%;
  bottom: 110px;
  transform: translateX(-50%);
  z-index: 41;
  width: max-content;
  max-width: min(86%, 420px);
  background: rgba(255, 252, 240, 0.97);
  border: 1.5px solid rgba(255, 202, 53, 0.85);
  border-radius: 14px;
  color: var(--ink);
  padding: 11px 16px 9px;
  cursor: pointer;
  box-shadow: 0 12px 32px rgba(30, 26, 38, 0.28);
  animation: card-pop-in 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.loot-card p {
  margin: 3px 0 4px;
  font-size: 0.86em;
  font-weight: 600;
  line-height: 1.5;
}

.loot-card .loot-hint {
  display: block;
  text-align: right;
  font-size: 0.68em;
  opacity: 0.55;
}

:global(html.rq-dark) .loot-card {
  background: rgba(44, 46, 64, 0.97);
  border-color: rgba(255, 202, 53, 0.45);
  color: #e8e6f0;
}

@keyframes toast-pop {
  from {
    transform: translate(-50%, 8px);
    opacity: 0;
  }
}

/* ═══ gal 地图:天空随时段变色 + 公寓立面 + 玻璃热点 ═══ */

.map-mask {
  padding: 0;
}

/* rq0.12 全屏化:地图铺满画幅,立面画布定比呈现,徽章钉在画上 */
.galmap {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 0;
  overflow: hidden;
  transition: background 0.6s ease;
}

/* 时段天色(六档:早上/中午/下午/傍晚/晚上/深夜) */
.sky-早上 {
  background: linear-gradient(180deg, #9dd7ef 0%, #cfeefb 55%, #ffefd8 100%);
}

.sky-中午 {
  background: linear-gradient(180deg, #4ab7ff 0%, #a8dcf4 60%, #e8f6fd 100%);
}

.sky-下午 {
  background: linear-gradient(180deg, #6fc2e8 0%, #b8e2f2 55%, #ffefc9 100%);
}

.sky-傍晚 {
  background: linear-gradient(180deg, #7796c9 0%, #ff9d6b 55%, #ffd9a8 100%);
}

.sky-晚上 {
  background: linear-gradient(180deg, #2c3a63 0%, #46578c 60%, #6b77a6 100%);
}

.sky-深夜 {
  background: linear-gradient(180deg, #1f2a4d 0%, #35456f 60%, #4f5b86 100%);
}

.sky-晚上 .map-banner,
.sky-晚上 .map-banner .ui-kicker,
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

.sky-傍晚 .orb {
  top: 92px;
  background: #ff9d5c;
  box-shadow: 0 0 0 10px rgba(255, 157, 92, 0.3);
}

.sky-晚上 .orb,
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

.sky-晚上 .cloud,
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
  position: absolute;
  top: 12px;
  left: 16px;
  right: 56px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--ink);
  pointer-events: none;
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

.sky-傍晚 .bunit:not(.lit) .unit-window i,
.sky-晚上 .bunit:not(.lit) .unit-window i,
.sky-深夜 .bunit:not(.lit) .unit-window i {
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

/* ── 房间弹窗(gal 式:遮罩+居中卡+hero 色带头+瓷砖大按钮) ── */

.rc-mask {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  padding: 14px;
  background: rgba(20, 22, 30, 0.45);
  backdrop-filter: blur(3px);
}

.room-modal {
  position: relative;
  width: min(340px, 96%);
  max-height: 96%;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 18px;
  padding: 0 0 12px;
  box-shadow: var(--shadow);
  scrollbar-width: thin;
}

.rm-hero {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 14px 16px 10px;
  margin-bottom: 8px;
  color: #fff;
  background:
    linear-gradient(180deg, rgba(20, 22, 30, 0.08), rgba(20, 22, 30, 0.42)),
    linear-gradient(130deg, #ff8ab9, #4ab7ff 72%);
  border-radius: 18px 18px 0 0;
}

.rm-hero.pub {
  background:
    linear-gradient(180deg, rgba(20, 22, 30, 0.08), rgba(20, 22, 30, 0.42)),
    linear-gradient(130deg, #4ab7ff, #7fd8a8 72%);
}

.rm-hero b {
  font-size: 1.15em;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-shadow: 0 1px 6px rgba(20, 22, 30, 0.35);
}

.rm-hero em {
  font-style: normal;
  font-size: 0.74em;
  color: rgba(255, 255, 255, 0.9);
}

.rc-empty {
  color: var(--ink-faint);
  font-style: normal;
  font-weight: 400;
  font-size: 0.78em;
  grid-column: 1 / -1;
  text-align: center;
  padding: 8px 0;
}

.rc-mood {
  margin: 0 0 8px;
  padding: 0 16px;
  font-size: 0.78em;
  line-height: 1.65;
  color: var(--ink-soft);
}

.rm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 14px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px 10px;
  font-family: inherit;
  color: var(--ink);
  text-align: center;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.08);
  transition: all 0.16s;
}

.tile .ic {
  width: 30px;
  height: 30px;
  color: var(--blue);
  margin-bottom: 2px;
}

.tile strong {
  font-size: 0.82em;
  font-weight: 700;
  line-height: 1.35;
}

.tile:hover {
  transform: translateY(-2px);
  border-color: rgba(38, 169, 244, 0.55);
  box-shadow: 0 8px 20px rgba(38, 169, 244, 0.22);
}

.tile.risky .ic {
  color: var(--red);
}

.tile.risky:hover {
  border-color: var(--red);
  box-shadow: 0 8px 20px rgba(229, 83, 63, 0.22);
}

.room-modal .clue-card {
  margin: 8px 14px 0;
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

/* 仪容 gal 化(2026-07-18):软玻璃卡行;带道具图的项升级缩略卡 */
.a-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.76em;
  background: var(--glass);
  border: 1px solid rgba(255, 79, 154, 0.14);
  border-left: 3px solid var(--pink-soft);
  border-radius: 10px;
  padding: 5px 8px;
  box-shadow: 0 2px 6px rgba(30, 26, 38, 0.05);
}

.a-cell .a-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.a-cell.pic {
  grid-column: span 1;
}

.a-cell .a-pic {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 9px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(255, 202, 53, 0.55);
  display: grid;
  place-items: center;
  box-shadow: 0 2px 6px rgba(30, 26, 38, 0.12);
}

.a-cell .a-pic img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.a-cell small {
  color: var(--ink-faint);
}

/* ═══ 设置弹窗(界面偏好) ═══ */

.sheet.settings {
  width: min(400px, 94%);
  max-height: 92%;
  overflow-y: auto;
}

.set-title {
  margin: 2px 0 12px;
  font-size: 1.05em;
  font-weight: 800;
  color: var(--ink);
}

.set-group {
  padding: 10px 0;
  border-top: 1px solid var(--line-soft);
}

.set-group.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.set-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.9em;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 7px;
}

.set-label em {
  font-style: normal;
  font-size: 0.82em;
  color: var(--pink);
  font-weight: 800;
}

.set-hint {
  margin: 6px 0 0;
  font-size: 0.72em;
  line-height: 1.5;
  color: var(--ink-faint);
}

.set-group.row .set-hint {
  margin-top: 3px;
}

/* 分段选择器 */
.seg {
  display: flex;
  gap: 4px;
  background: var(--pink-soft);
  padding: 3px;
  border-radius: 10px;
}

.seg button {
  flex: 1;
  padding: 7px 4px;
  border: none;
  border-radius: 7px;
  background: transparent;
  font-family: inherit;
  font-size: 0.82em;
  font-weight: 700;
  color: var(--ink-soft);
  cursor: pointer;
  transition: all 0.18s;
}

.seg button.on {
  background: #fff;
  color: var(--pink);
  box-shadow: 0 2px 8px rgba(255, 79, 154, 0.22);
}

/* 滑杆 */
.set-range {
  width: 100%;
  accent-color: var(--pink);
  cursor: pointer;
}

/* 开关 */
.toggle {
  flex: none;
  width: 46px;
  height: 27px;
  border-radius: 14px;
  border: none;
  background: rgba(36, 33, 38, 0.18);
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}

.toggle i {
  display: block;
  width: 21px;
  height: 21px;
  margin: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s;
}

.toggle.on {
  background: var(--pink);
}

.toggle.on i {
  transform: translateX(19px);
}

.set-danger {
  display: flex;
  gap: 8px;
  padding-top: 14px;
  margin-top: 4px;
  border-top: 1px solid var(--line-soft);
}

/* 房内动作行(场景视图里的下级菜单;瓷砖复用房卡的 .tile) */
.scene-acts {
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 6px;
}

.scene-acts .tile {
  padding: 8px 10px;
}

/* 正文字色选择行 */
.ink-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ink-row .btn.on {
  color: #fff;
  background: var(--blue);
  border-color: var(--blue);
}

.ink-pick {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.8em;
  color: var(--ink-soft);
}

.ink-pick.on {
  border-color: var(--blue);
  color: var(--blue);
}

.ink-pick input {
  width: 28px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.btn.ghost {
  background: transparent;
  border: 1px solid var(--line-soft);
  color: var(--ink-soft);
}

/* 重开一局:平时只是淡红描边,点第一下进入武装态才变实红 */
.btn.ghost.restart {
  color: #c0574f;
  border-color: rgba(192, 87, 79, 0.35);
}

.btn.ghost.restart.armed {
  color: #fff;
  background: linear-gradient(180deg, #e0655c, #c0392b);
  border-color: rgba(192, 57, 43, 0.85);
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

/* ═══ gal 商店(rq0.12):hero 色带 + 双列商品卡,道具图=AI 生成入库 ═══ */

.sheet.shop {
  width: min(520px, 96%);
}

.shop-hero {
  position: relative;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: -14px -16px 10px;
  padding: 16px 18px 12px;
  color: #fff;
  background:
    linear-gradient(180deg, rgba(20, 22, 30, 0.06), rgba(20, 22, 30, 0.4)),
    linear-gradient(130deg, #ff8ab9, #ffca35 58%, #4ab7ff);
  border-radius: 18px 18px 0 0;
}

.shop-hero b {
  font-size: 1.2em;
  font-weight: 900;
  letter-spacing: 0.28em;
}

.shop-hero em {
  font-style: normal;
  font-size: 0.75em;
  opacity: 0.92;
}

.shop-cash {
  position: absolute;
  right: 16px;
  bottom: 12px;
  font-family: var(--font-mono);
  font-size: 1.05em;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 6px rgba(20, 22, 30, 0.45);
}

/* 紧凑横条(2026-07-17 用户反馈:大方图卡太占地,道具多了会卡)——64px 缩略图+文字+买钮,单列可长列表 */
.shop-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ware-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 9px;
  background: var(--glass);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.07);
}

.ware-pic {
  flex: none;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 9px;
  overflow: hidden;
  background: linear-gradient(160deg, #fff7f0, #f2f7ff);
}

.ware-pic img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ware-pic > b {
  font-size: 1.4em;
  font-style: normal;
  color: var(--ink-faint);
}

.ware-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ware-name {
  font-size: 0.85em;
}

.ware-price {
  font-family: var(--font-mono);
  font-size: 0.85em;
  font-style: normal;
  font-weight: 700;
  color: var(--blue);
  margin-left: 6px;
}

.ware-card .ware-desc {
  font-size: 0.72em;
  line-height: 1.45;
  color: var(--ink-soft);
}

.ware-buy {
  flex: none;
  align-self: center;
  padding: 6px 12px;
  font-size: 0.8em;
}

.ware-card .ware-acts {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:global(html.rq-dark) .ware-card {
  background: #2c2e40;
  border-color: rgba(255, 255, 255, 0.08);
}

/* 监控 gal 化(2026-07-17):紫调 hero + 头像行 + REC 呼吸点 */
.shop-hero.cams {
  background:
    linear-gradient(180deg, rgba(20, 22, 30, 0.1), rgba(20, 22, 30, 0.45)),
    linear-gradient(130deg, #8c73ff, #4ab7ff 70%);
}

.cam-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 8px;
  font-family: inherit;
  text-align: left;
  background: var(--glass);
  border: 1px solid rgba(140, 115, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(140, 115, 255, 0.12);
  transition: all 0.18s;
}

.cam-row:hover:not(:disabled) {
  border-color: rgba(140, 115, 255, 0.7);
  box-shadow: 0 6px 16px rgba(140, 115, 255, 0.25);
}

.cam-row:disabled {
  opacity: 0.55;
  cursor: default;
}

.cam-face {
  box-sizing: border-box;
  flex: none;
  width: 42px;
  height: 42px;
  border: 2px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  background: linear-gradient(160deg, #ffe3ee, #ffd0e2);
  box-shadow: 0 2px 8px rgba(30, 26, 38, 0.2);
}

.cam-face.fb {
  display: grid;
  place-items: center;
  font-style: normal;
  color: #d4407a;
}

.cam-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cam-main b {
  font-size: 0.88em;
  color: var(--ink);
}

.cam-main em {
  font-style: normal;
  font-size: 0.72em;
  color: var(--ink-faint);
}

.cam-rec {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.68em;
  font-weight: 700;
  color: var(--red);
  animation: rec-blink 1.6s infinite;
}

@keyframes rec-blink {
  50% {
    opacity: 0.35;
  }
}

:global(html.rq-dark) .cam-row {
  background: #2c2e40;
}

/* ═══ 在场头像徽章(到场卡/场景条/房卡:认脸不认字) ═══ */

.arrive-who {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 14px;
  margin: 8px 0 2px;
}

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

.rm-who {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.rm-who .who-chip.mini img,
.rm-who .who-chip.mini > b {
  border-color: rgba(255, 255, 255, 0.92);
}

.rm-who em {
  font-style: normal;
  font-size: 0.8em;
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

/* ═══ 右上角 meta 钮(主题/全屏) ═══ */

.corner-btns {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 20;
  display: inline-flex;
  gap: 6px;
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
  min-width: 74px;
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
  grid-template-columns: 0.7fr 1fr 1fr;
  gap: 8px;
}

/* 电池条(胜任=绿→黄→红报警,风闻=反向;格子随值点亮) */
.battery {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 3px 9px;
  background: #fff;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
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

/* 报警态(胜任≤40 / 风闻≥50):亮格转红+末格呼吸 */
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

/* ═══ 描边图标(初星 icon-sprite 语法:24×24 线条,吃 currentColor) ═══ */

.ic {
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: -3px;
}

.btn.icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ═══ 序章标题屏(gal タイトル:全屏立面KV + 纹章 + 竖排木牌菜单) ═══ */

.title-screen {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: var(--shadow);
  overflow: hidden auto;
  color: #fff;
  padding: 22px 18px 14px;
  /* 立面傍晚 KV 全屏铺满;顶暗底暗保标题与按钮可读;三色渐变兜底 */
  background:
    linear-gradient(180deg, rgba(20, 22, 30, 0.35), rgba(20, 22, 30, 0.2) 34%, rgba(20, 22, 30, 0.72)),
    var(--kv-img, none) center top / cover no-repeat,
    linear-gradient(150deg, #ff8ab9, #4ab7ff 48%, #ffd24f);
}

.title-hero {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.title-emblem {
  width: 96px;
  height: 96px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(20, 22, 30, 0.5));
  margin-bottom: 4px;
}

.title-hero h1 {
  margin: 4px 0 8px;
  font-size: clamp(30px, 8vw, 44px);
  font-weight: 900;
  letter-spacing: 0.16em;
  line-height: 1.05;
  text-shadow: 0 2px 14px rgba(20, 22, 30, 0.6);
}

.title-hero p {
  margin: 0;
  font-size: 0.8em;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 6px rgba(20, 22, 30, 0.55);
}

.ui-kicker.light {
  color: rgba(255, 255, 255, 0.82);
}

.ui-kicker.center {
  text-align: center;
}

.title-menu {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: auto;
  padding-top: 20px;
}

/* 木牌按钮:水彩牌底铺满,文字排在上面(牌底挂了=退回半透明玻璃条) */
.plaque {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 100%;
  min-height: 52px;
  padding: 10px 16px;
  font-family: inherit;
  color: #4a3f2e;
  background:
    var(--plaque, none) center / 100% 100% no-repeat,
    rgba(255, 250, 242, 0.86);
  border: none;
  border-radius: 12px;
  filter: drop-shadow(0 4px 10px rgba(20, 22, 30, 0.32));
  cursor: pointer;
  transition:
    transform 0.16s,
    filter 0.16s;
}

.plaque:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: drop-shadow(0 7px 16px rgba(255, 180, 90, 0.5));
}

.plaque:disabled {
  opacity: 0.5;
  cursor: default;
}

.plaque .pl-main {
  font-size: 1.02em;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.plaque .pl-sub {
  font-family: var(--font-mono);
  font-size: 0.6em;
  letter-spacing: 0.24em;
  color: #9a8a6a;
}

.plaque.main .pl-main {
  color: #b03a6a;
}

/* 难度木牌:横排(名+说明+金额) */
.plaque.diff {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  text-align: left;
  min-height: 58px;
}

.plaque.diff .pl-main {
  flex: none;
  font-size: 0.94em;
  letter-spacing: 0.12em;
}

.plaque.diff .pl-note {
  flex: 1;
  font-size: 0.68em;
  line-height: 1.45;
  color: #6a5c46;
  font-weight: 600;
}

.plaque.diff .pl-meta {
  flex: none;
  font-family: var(--font-display);
  font-size: 0.9em;
  color: #b03a6a;
}

.plaque.diff.chosen {
  filter: drop-shadow(0 8px 20px rgba(255, 79, 154, 0.6));
  transform: translateY(-2px);
}

.plaque.diff.chosen::after {
  content: '✓';
  position: absolute;
  top: 6px;
  right: 10px;
  font-size: 0.8em;
  font-weight: 900;
  color: #b03a6a;
}

.title-acts {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.title-acts .btn {
  flex: 1;
}

.title-beat {
  flex: none;
  text-align: center;
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* ═══ 状态瓦片(初星 status card:小灰标 + 展示字体数值) ═══ */

/* ═══ 动作 kicker(初星 hotspot 语法,瓷砖里的小标) ═══ */

.act-kicker {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.tile.risky .act-kicker {
  color: var(--red);
  opacity: 0.75;
}

/* ═══ 阶段爱心条(初星 affinity-hearts) ═══ */

.dossier-id {
  display: flex;
  flex-direction: column;
  gap: 0;
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

/* ── 描点地图(rq0.12):立面画布定比呈现 + 徽章热区 + 时段调色 ── */

.map-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  container-type: size;
}

.map-canvas {
  position: relative;
  width: 100%;
  width: min(100%, calc(100cqh * 0.667));
  aspect-ratio: 2 / 3;
}

/* 手机端全屏画幅:画里天空占比过高(2026-07-20 玩家实测)——画布锚底放大,天空溢出裁掉;
   点位是画布内百分比,随画布一起缩放,拓扑不破 */
@media (max-width: 540px) {
  .map-stage {
    overflow: hidden;
  }
  .map-canvas {
    transform: scale(1.24);
    transform-origin: 50% 100%;
  }
}

.map-base {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.6s ease;
  /* 画的天空顶边淡出,融进 CSS 天色渐变(画布比屏幕矮时上方留白不生硬) */
  mask-image: linear-gradient(to bottom, transparent, #000 8%);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 8%);
}

.map-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 0.6s ease;
}

/* 同一张傍晚底图的四档调色:白天提亮去橙,夜里压暗上蓝(楼不换图,点位永不漂) */
.tint-day .map-base {
  filter: brightness(1.15) saturate(0.72) hue-rotate(-14deg) contrast(0.97);
}

.tint-day .map-veil {
  background: linear-gradient(rgba(160, 205, 255, 0.16), rgba(255, 255, 255, 0));
}

.tint-night .map-base {
  filter: brightness(0.6) saturate(0.82) hue-rotate(8deg);
}

.tint-night .map-veil {
  background: rgba(22, 30, 68, 0.32);
  mix-blend-mode: multiply;
}

.tint-late .map-base {
  filter: brightness(0.42) saturate(0.68) hue-rotate(14deg);
}

.tint-late .map-veil {
  background: rgba(12, 16, 48, 0.46);
  mix-blend-mode: multiply;
}

/* 徽章热区:磨砂小门牌钉在画里的门窗上,在场者头像挂在牌下 */
.spot {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -50%);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 44px;
  padding: 4px 8px 5px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(24, 28, 46, 0.22);
  cursor: pointer;
  transition:
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.spot:hover {
  border-color: rgba(255, 79, 154, 0.6);
  box-shadow: 0 6px 16px rgba(24, 28, 46, 0.3);
}

.spot.here {
  border-color: var(--pink);
  box-shadow:
    0 0 0 2px rgba(255, 79, 154, 0.42),
    0 8px 18px rgba(255, 79, 154, 0.3);
}

.spot.vacant {
  opacity: 0.72;
}

/* 晚间在家=窗户透出暖光(丈夫可视化沿袭窗灯语义) */
.spot.lit::before {
  content: '';
  position: absolute;
  inset: -16px;
  z-index: -1;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 196, 96, 0.5), transparent);
  pointer-events: none;
}

.spot-plate {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.08em;
  white-space: nowrap;
  color: var(--ink);
}

.spot-note {
  font-size: 9px;
  line-height: 1;
  color: var(--ink-faint);
}

/* 欠租角标(P3:催租入口可视化,红底白字压过普通注记) */
.spot-note.owe {
  background: rgba(192, 57, 43, 0.92);
  color: #fff;
  border-radius: 6px;
  padding: 1px 5px;
  font-weight: 700;
}

.spot-faces {
  display: inline-flex;
  align-items: center;
}

.spot-faces img,
.spot-faces b {
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border: 1.5px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  box-shadow: 0 1px 4px rgba(20, 24, 40, 0.3);
}

.spot-faces > * + * {
  margin-left: -7px;
}

.spot-faces b {
  display: inline-grid;
  place-items: center;
  font-size: 10px;
  font-style: normal;
  color: var(--ink);
}

.spot-faces img.me,
.spot-faces b.me {
  border-color: var(--pink);
}

/* 兜底容器(省流/图挂):原玻璃楼体贴底呈现 */
.map-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 52px 14px 14px;
  overflow: hidden auto;
  scrollbar-width: thin;
}

:global(html.rq-dark) .spot {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(44, 46, 64, 0.72);
}

:global(html.rq-dark) .spot-plate,
:global(html.rq-dark) .spot-faces b {
  color: #e8ecfa;
}

.bldg-body {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
  border-color: rgba(255, 255, 255, 0.8);
}

.bfloor {
  border-bottom-color: rgba(255, 255, 255, 0.55);
}

.bunit {
  background: rgba(255, 255, 255, 0.3);
  border-left-color: rgba(255, 255, 255, 0.5);
}

.bunit:hover {
  background: rgba(255, 242, 247, 0.72);
}

.bunit.here {
  background: rgba(255, 214, 231, 0.78);
}

.bunit.vacant {
  background: rgba(238, 238, 242, 0.45);
}

.roof-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
  border-color: rgba(255, 255, 255, 0.85);
}

.roof-card:hover,
.roof-card.here {
  border-color: var(--pink);
}

.bground {
  background: rgba(240, 244, 249, 0.5);
  backdrop-filter: blur(5px);
  border-color: rgba(255, 255, 255, 0.8);
  border-top-color: rgba(255, 255, 255, 0.55);
}

.gunit {
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(4px);
}

.gunit:hover {
  background: rgba(255, 242, 247, 0.72);
}

.gunit.here {
  background: rgba(255, 214, 231, 0.78);
}

/* ═══ 新元素的夜间覆盖 ═══ */

:global(html.rq-dark) .hstat,
:global(html.rq-dark) .battery,
:global(html.rq-dark) .tile {
  background: #2c2e40;
}

:global(html.rq-dark) .seg {
  background: rgba(255, 255, 255, 0.08);
}

:global(html.rq-dark) .seg button.on {
  background: #3a3d52;
}

:global(html.rq-dark) .toggle {
  background: rgba(255, 255, 255, 0.16);
}

:global(html.rq-dark) .battery .cells i {
  background: rgba(255, 255, 255, 0.12);
}

:global(html.rq-dark) .hud,
:global(html.rq-dark) .dock {
  border-color: rgba(255, 255, 255, 0.08);
}

:global(html.rq-dark) .hearts i {
  color: rgba(255, 255, 255, 0.14);
}

:global(html.rq-dark) .hearts i.on {
  color: var(--pink);
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

/* 夜间:深纱压背景图;2026-07-19 玩家手机截图实测:亮色场景图(白墙房间/白裙立绘)会把
   半透明深纱衬成浅灰,浅色字浮在上面看不清——深纱加厚 */
:global(html.rq-dark) .story-wrap {
  background:
    linear-gradient(180deg, rgba(var(--sc-a, 165, 175, 195), 0.14), rgba(var(--sc-b, 205, 215, 230), 0.05) 42%, transparent 72%),
    linear-gradient(rgba(24, 26, 40, 0.58), rgba(24, 26, 40, 0.68)),
    var(--scene-img, none) center / cover no-repeat,
    var(--glass);
}

/* 垫板浓度给夜间设下限:玩家把滑杆拉多低,深底也至少 0.78,浅字永远有得靠 */
:global(html.rq-dark) .story-entry {
  background: rgba(26, 28, 42, max(0.78, calc(var(--entry-veil, 0.66) + 0.1)));
}

/* ── 省流模式:关掉重量级场景位图(背景/立面),回纯 CSS 渐变;头像/图标小,保留 ── */
:global(html.rq-lite) .story-wrap {
  --scene-img: none !important;
}

:global(html.rq-lite) .title-screen {
  --kv-img: none !important;
}

/* ── 减少动效:关掉全局过渡与动画 ── */
:global(html.rq-still) *,
:global(html.rq-still) *::before,
:global(html.rq-still) *::after {
  animation-duration: 0.001s !important;
  transition-duration: 0.001s !important;
}

:global(html.rq-dark) .sheet {
  background: rgba(38, 40, 56, 0.97);
  border-color: rgba(255, 255, 255, 0.1);
}

:global(html.rq-dark) .sheet-close,
:global(html.rq-dark) .edit-area {
  background: #2c2e40;
  color: var(--ink);
}

:global(html.rq-dark) .toast {
  background: rgba(38, 40, 56, 0.97);
}

:global(html.rq-dark) .room-modal,
:global(html.rq-dark) .peep-card,
:global(html.rq-dark) .loc-banner {
  background: rgba(34, 36, 50, 0.96);
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

/* ── 移动端紧凑档(2026-07-18 用户反馈:手机上正文只剩一小条)──
   原则:正文区 story-wrap 是 flex:1,只要把上下所有周边框架等比压扁,
   省出来的高度会自动全部归正文;不动任何逻辑,纯视觉压缩 */
@media (max-width: 540px) {
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
    gap: 6px;
    padding: 4px 8px;
    margin-bottom: 4px;
  }

  .hud-time {
    min-width: 54px;
    padding-right: 8px;
  }

  .hud-time b {
    font-size: 0.88em;
  }

  .hud-time .ui-kicker {
    font-size: 8px;
  }

  .battery {
    padding: 2px 6px;
  }

  .battery .cells {
    height: 7px;
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
    font-size: 0.64em;
  }

  /* 场景条/选项/输入/撤回行:半高半距 */
  .scene-bar {
    gap: 6px;
    font-size: 0.74em;
    padding: 4px 2px 0;
  }

  .option-chip {
    font-size: 0.74em;
    padding: 5px 9px;
  }

  .quill {
    margin-top: 4px;
    gap: 5px;
  }

  .quill textarea {
    font-size: 0.86em;
  }

  .reroll-row {
    gap: 8px;
    margin-top: 4px;
  }

  .reroll-row .btn {
    font-size: 0.76em;
    padding: 4px 12px;
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
    font-size: 0.6em;
  }
}
</style>
