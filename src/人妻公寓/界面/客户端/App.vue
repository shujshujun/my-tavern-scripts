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
                v-for="m in ['日间', '夜间', '跟随'] as const"
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
                v-for="z in ['小', '中', '大'] as const"
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
                  :value="正文字色 || (暗色 ? '#000000' : '#242126')"
                  @input="((正文字色 = ($event.target as HTMLInputElement).value), 改设置())"
                />
                <span>{{ 正文字色 ? '自选中' : '自选颜色' }}</span>
              </label>
            </div>
            <p class="set-hint">正文始终使用白色半透明垫板；「跟随主题」在日间使用深墨、夜间使用纯黑。</p>
          </div>

          <div class="set-group">
            <div class="set-label">
              正文垫板浓度<em>{{ Math.round(垫板浓度 * 100) }}%</em>
            </div>
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
              <p class="set-hint">
                在场者自适应入画:单人大景、两三人分槽、多人阵列；手机四人以上自动换成两排，彼此不遮挡。
              </p>
            </div>
            <button class="toggle" :class="{ on: 立绘显示 }" @click="((立绘显示 = !立绘显示), 改设置())"><i /></button>
          </div>

          <div class="set-group row">
            <div>
              <div class="set-label">省流模式</div>
              <p class="set-hint">只关闭场景背景与地图立面大图；人物、头像和功能图标仍正常显示。</p>
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

          <div class="set-group row" :class="{ 'route-locked': MVU解析.外置模式 }">
            <div>
              <div class="set-label">模型二次变量结算</div>
              <p v-if="MVU解析.外置模式" class="set-hint route-hint">
                MVU 外置模型已接管变量，正文二次结算已自动关闭，避免两个模型重复处理。
                <template v-if="!MVU解析.自动请求">
                  但 MVU 的“自动请求”目前关闭；请去 MVU 开启，否则每轮需要手动点“重试额外模型解析”。
                </template>
              </p>
              <p v-else class="set-hint">
                使用正文模型解析变量时可选，默认关闭，不打开也不影响正常游玩。只有你自己发现变量多次没有更新时，才建议打开；开启后会额外调用一次当前正文模型。
              </p>
            </div>
            <button
              class="toggle"
              :class="{ on: 二次变量结算 }"
              :disabled="MVU解析.外置模式"
              @click="切换二次变量结算"
            >
              <i />
            </button>
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

      <!-- ═══════════ rq0.34 首次游玩准备：第一次进卡自动出现，标题页可随时重开 ═══════════ -->
      <div v-if="首次说明开" class="mask setup-mask" @click.self="首次准备完成 && (首次说明开 = false)">
        <div class="sheet setup-sheet">
          <button v-if="首次准备完成" class="sheet-close" @click="首次说明开 = false">✕</button>
          <div class="ui-kicker">FIRST RUN / 首次游玩准备</div>
          <h3 class="setup-title">准备数据库与运行环境</h3>
          <p class="setup-lead">本作长期记忆只支持数据库插件。完成环境检测并安装四张 RQ_ 表后即可开始游戏。</p>

          <div class="setup-statuses">
            <span :class="{ on: 脚本存活 }"
              ><i>{{ 脚本存活 ? '✓' : '!' }}</i
              >游戏脚本</span
            >
            <span :class="{ on: 数据库检测.已安装 }"
              ><i>{{ 数据库检测.已安装 ? '✓' : '·' }}</i
              >数据库插件 {{ 数据库检测.已安装 ? (数据库检测.版本 ? `v${数据库检测.版本}` : '版本未知') : '' }}</span
            >
            <span :class="{ on: 酒馆助手已安装 }">
              <i>{{ 酒馆助手检测中 ? '…' : !酒馆助手已安装 ? '!' : 酒馆助手为最新版 === false ? '↑' : '✓' }}</i>
              酒馆助手 {{ 酒馆助手版本 || '未检测' }}
            </span>
          </div>

          <ol class="setup-steps">
            <li class="required">
              <b><em>1</em>安装角色卡与运行环境</b>
              <p>
                导入角色卡后，安装并启用【酒馆助手】，并确认角色卡自带的 MVU 脚本已启用。当前{{
                  酒馆助手检测说明
                }}。若不是最新版，建议更新，但不会阻止开始游戏。
              </p>
              <div class="setup-sql-reminder setup-mvu-reminder" role="note">
                <strong>强烈建议：使用 MVU 外置模型解析变量</strong>
                <span
                  >在 MVU 设置中选择【额外模型解析】并开启【自动请求】，可大幅提高变量更新稳定性。启用后本游戏会自动关闭【模型二次变量结算】，正文模型只负责剧情，外置模型单独处理变量，避免重复请求和互相覆盖。这不是开局检测的强制项，但每轮会增加一次解析请求、耗时与模型费用。</span
                >
              </div>
            </li>
            <li class="required">
              <b><em>2</em>启用【提示词模板】插件</b>
              <p>提示词模板必须开启；如果装有【小白X】，请先关闭，避免两套注入同时工作造成正文或变量异常。</p>
            </li>
            <li class="required">
              <b><em>3</em>安装数据库长期记忆</b>
              <p>安装数据库插件，并把人妻公寓四张 RQ_ 表合并到当前聊天。本作不再提供其他长期记忆插件的兼容路线。</p>
              <div class="setup-sql-reminder" role="note">
                <strong>必须手动切换：SQLite（SQL）模式</strong>
                <span
                  >打开【数据库设置 →
                  存储模式】，选择【SQLite（SQL）】。游戏无法代替你自动切换；切换后回到本页安装或更新四张 RQ_ 表。</span
                >
              </div>
              <p>
                四张表都带完整 SQL DDL，SQLite 模式下游戏会使用参数化 SQL
                精确查询与更新。普通表格模式仍可读取完整快照，数据库插件自身的正文长期记忆/承诺也照常运行；但游戏脚本不会用可能挂到旧消息的普通行接口直写剧情事件或微信摘要。
              </p>
              <p>
                自动填表默认把人物记忆与承诺合并为每 3 个正文 AI 楼一次，社交轨迹每 6 楼一次；SQLite
                模式下，剧情事件和重要社交结果由游戏脚本即时写入。没有长期变化时允许不改表，不应为了凑字数制造记录。
              </p>
              <p>
                数据库当前会把全局“AI 回复最小长度”同时用于正文门控和填表输出。建议设为
                0，避免把合法的简短或空更新误报为“AI回复过短”；“填表最大重试”建议手动设为 2。微信进展摘要走独立
                callAI，不受这两个填表参数影响。
              </p>
              <p>
                完整微信原文仍只保存在手机；开启微信记忆且 SQLite 可写时，每轮有效妻子私聊通常会额外调用一次数据库当前
                AI，把当前分支的未整理增量整理成结构化进展摘要。普通表格模式会暂停这次额外摘要调用。正文只在本人可靠判定在场时被动参考，不要求角色每轮主动提起；该功能可在手机“我”页单独关闭。
              </p>
              <div class="setup-db-actions">
                <button class="btn mini" @click="刷新全部检测">重新检测</button>
                <button
                  class="btn mini rite"
                  :disabled="!数据库检测.已安装 || 安装模板中"
                  @click="从说明安装数据库模板"
                >
                  {{ 安装模板中 ? '安装中…' : 数据库检测.已装游戏模板 ? '更新本游戏表' : '安装本游戏表' }}
                </button>
                <button class="btn mini" @click="从说明打开数据库设置">打开数据库设置</button>
                <button
                  v-if="数据库检测.填表最短回复 !== null && 数据库检测.填表最短回复 > 0 && 数据库检测.可设置填表参数"
                  class="btn mini rite"
                  :disabled="调整填表设置中"
                  @click="从说明应用数据库填表兼容设置"
                >
                  {{ 调整填表设置中 ? '设置并验证中…' : '修复填表短回复（全局设 0）' }}
                </button>
              </div>
              <small v-if="数据库检测.已安装 && 数据库检测.填表最短回复 === 0" class="good"
                >✓ 自动填表防短回复已兼容：AI 回复最小长度 = 0。</small
              >
              <small v-else-if="数据库检测.已安装 && 数据库检测.填表最短回复 !== null" style="color: #a35f00"
                >! 当前 AI 回复最小长度 =
                {{ 数据库检测.填表最短回复 }}，建议修复；这是数据库全局项，只有你确认后游戏才会修改。</small
              >
              <small v-else-if="数据库检测.已安装"
                >· 当前数据库版本未开放填表参数读取，请在“填表工作台 → 自动更新设置 → 高级参数”中手动设为 0。</small
              >
              <small v-if="!数据库检测.已安装">· 尚未检测到数据库插件。</small>
              <small v-else-if="!数据库检测.已装游戏模板"
                >· 数据库 {{ 数据库检测.版本 ? `v${数据库检测.版本}` : '版本未知' }} 已启用，还需安装四张 RQ_
                表。</small
              >
              <small v-else class="good"
                >✓ 数据库 {{ 数据库检测.版本 ? `v${数据库检测.版本}` : '版本未知' }} 已启用，四张 RQ_ 表已就绪。</small
              >
            </li>
            <li>
              <b><em>4</em>完成检测</b>
              <p>酒馆助手、数据库插件与四张游戏表全部就绪后才算完成。手机专用模型仍可在【手机→我】中单独配置。</p>
              <div class="setup-db-actions"><button class="btn mini" @click="刷新全部检测">重新检测</button></div>
              <small :class="{ good: 首次准备完成 }">{{
                首次准备完成
                  ? '✓ 酒馆助手已启用且长期记忆检测通过，可以开始游戏。'
                  : !酒馆助手已安装
                    ? `✗ ${酒馆助手检测说明}。`
                    : '✗ 数据库插件或四张 RQ_ 表尚未就绪。'
              }}</small>
            </li>
          </ol>

          <div class="setup-foot">
            <p>以后可在序章首页点“首次游玩说明”再次查看。</p>
            <button class="btn rite" :disabled="!首次准备完成" @click="完成首次说明">
              {{ 首次准备完成 ? '检测通过，回到首页' : '请先完成环境检测' }}
            </button>
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
          <button v-if="时间撤销可用" class="btn" :disabled="发送中" @click="发起时间撤销">撤销刚才的时间推进</button>
          <button class="btn" @click="打开史册">翻开往事</button>
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
              <button class="plaque setup-entry" @click="打开首次说明">
                <span class="pl-main">首次游玩说明</span>
                <span class="pl-sub">INSTALL &amp; DATABASE</span>
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
                <button
                  class="btn ghost"
                  :disabled="发送中"
                  @click="
                    难度展开 = false;
                    选中难度 = '';
                  "
                >
                  返回
                </button>
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
            :class="项.态"
            :title="项.妻名 + '(' + 项.门牌 + ')'"
            @click="!静音会议正式中 && (选中门牌 = 项.门牌)"
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
        <div
          class="story-wrap"
          :class="[
            `portrait-count-${Math.min(立绘列表.length, 6)}`,
            {
              'portraits-many': 立绘列表.length >= 4,
              'story-glory': !!荣耀洞图,
              'story-adult-cg': 显示成人CG,
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
            {{ 正文隐藏 ? '👁' : '🙈' }}
          </button>
          <div v-if="静音会议正式中 && !静音会议交互幕" class="mute-meeting-track" role="status">
            <span>MEETING · {{ 静音会议阶段短名 }}</span>
            <b>{{ 静音会议拍数文案 }}</b>
            <em>{{ 静音会议场景.议题 || '楼务会议' }}</em>
          </div>
          <div v-if="录像带交互幕" class="special-interaction-stage">
            <img :src="录像带当前图" alt="管理员室双显示器" draggable="false" />
            <div class="special-interaction-status">
              <span>{{ 录像带交互说明 }}</span>
              <span v-if="录像带连点计数 > 0 && 录像带阶段 === '等待202'">
                {{ 录像带连点计数 }}/{{ 录像带连点目标 }}
              </span>
            </div>
          </div>
          <Transition name="fade">
            <div v-if="静音会议显示组合图" class="mute-meeting-visual" :class="`state-${静音会议画面状态}`">
              <img
                v-if="静音会议当前图地址"
                :key="静音会议当前图地址"
                :src="静音会议当前图地址"
                :alt="`静音会议${静音会议画面状态}会场全景`"
                draggable="false"
                @load="静音会议图加载成功"
                @error="静音会议图加载失败"
              />
              <div v-else class="mute-meeting-visual-fallback">
                <span>梧桐里公寓 · 管理员室</span>
                <b>楼务会议进行中</b>
              </div>
            </div>
          </Transition>
          <div
            v-if="静音会议交互幕"
            class="special-interaction-stage mute-meeting-interaction-stage"
            @contextmenu.prevent
          >
            <section class="mute-interaction-panel" :class="`gate-${静音会议互动id.toLowerCase()}`">
              <header>
                <div>
                  <span>CONTROL GATE {{ 静音会议互动id }}</span>
                  <h3>{{ 静音会议互动标题 }}</h3>
                </div>
                <b>{{ 静音会议互动失败次数 }}/3 次失误</b>
              </header>
              <p class="mute-interaction-copy">{{ 静音会议互动说明 }}</p>

              <div v-if="静音会议互动id === 'B' || 静音会议互动id === 'C'" class="mute-target-row">
                <button
                  v-for="门牌号 in 静音会议参与妻"
                  :key="门牌号"
                  type="button"
                  class="mute-target"
                  :class="{
                    on:
                      (静音会议互动id === 'B' && 静音会议B目标 === 门牌号) ||
                      (静音会议互动id === 'C' && 静音会议场景.重点妻 === 门牌号),
                    pulse: 静音会议互动id === 'C' && 静音会议连点点亮妻.includes(门牌号),
                  }"
                  :disabled="静音会议互动id === 'C' || !静音会议互动待操作 || !!静音会议互动结果"
                  :aria-pressed="
                    (静音会议互动id === 'B' && 静音会议B目标 === 门牌号) ||
                    (静音会议互动id === 'C' && 静音会议场景.重点妻 === 门牌号)
                  "
                  @pointerup.stop.prevent="静音会议互动id === 'B' && 选择静音会议B目标(门牌号, $event)"
                >
                  <img
                    v-if="!头像失效[户静态表[门牌号].妻名]"
                    :src="头像图(户静态表[门牌号].妻名)"
                    :alt="户静态表[门牌号].妻名"
                    draggable="false"
                    @error="头像失效[户静态表[门牌号].妻名] = true"
                  />
                  <span v-else>{{ 户静态表[门牌号].妻名[0] }}</span>
                  <b>{{ 户静态表[门牌号].妻名 }}</b>
                  <small>{{ 门牌号 }}</small>
                </button>
              </div>

              <div v-if="静音会议互动id === 'C'" class="mute-mode-row">
                <button
                  v-for="模式 in ['集中', '同步'] as const"
                  :key="模式"
                  type="button"
                  :class="{ on: 静音会议C模式 === 模式 }"
                  :disabled="!静音会议互动待操作 || !!静音会议互动结果"
                  :aria-pressed="静音会议C模式 === 模式"
                  @pointerup.stop.prevent="选择静音会议C模式(模式, $event)"
                >
                  <b>{{ 模式 === '集中' ? '集中一人' : '全体同步' }}</b>
                  <small>{{
                    模式 === '集中'
                      ? `沿用${静音会议重点妻名 || '第二档目标'}`
                      : `${静音会议参与妻.length} 名妻子同时加档`
                  }}</small>
                </button>
              </div>

              <button
                v-if="静音会议互动id === 'A'"
                type="button"
                class="mute-control-button tap"
                :disabled="!静音会议互动待操作 || !!静音会议互动结果"
                @pointerdown.stop.prevent="静音会议A按下"
                @pointerup.stop.prevent="静音会议A抬起"
                @pointercancel.stop.prevent="静音会议指针取消($event, true)"
                @pointerleave="静音会议指针取消($event, true)"
              >
                <Ic n="ops" />
                <span><b>连接全部设备</b><small>按下一次，让所有指示灯同时就绪</small></span>
              </button>

              <button
                v-else-if="静音会议互动id === 'B'"
                type="button"
                class="mute-control-button hold"
                :class="{ holding: 静音会议长按中 }"
                :disabled="!静音会议互动待操作 || !静音会议B目标 || !!静音会议互动结果"
                @pointerdown.stop.prevent="静音会议B按下"
                @pointerup.stop.prevent="静音会议B抬起"
                @pointercancel.stop.prevent="静音会议指针取消($event, true)"
                @pointerleave="静音会议指针取消($event, true)"
              >
                <i class="hold-progress" />
                <Ic n="ops" />
                <span><b>维持第二档</b><small>选中目标后持续按住 2 秒</small></span>
              </button>

              <button
                v-else
                type="button"
                class="mute-control-button rapid"
                :disabled="!静音会议互动待操作 || !静音会议C模式 || !!静音会议互动结果"
                @pointerdown.stop.prevent="静音会议C按下"
                @pointerup.stop.prevent="静音会议C抬起"
                @pointercancel.stop.prevent="静音会议指针取消($event, true)"
                @pointerleave="静音会议指针取消($event, true)"
              >
                <Ic n="ops" />
                <span
                  ><b>连续点击加档</b><small>{{ 静音会议连点计数 }}/{{ 静音会议连点目标 }} · 限时 6 秒</small></span
                >
              </button>

              <div v-if="静音会议互动结果" class="mute-interaction-result" :class="静音会议互动结果.类型">
                <b>{{ 静音会议互动结果.标题 }}</b>
                <span>{{ 静音会议互动结果.说明 }}</span>
              </div>
              <button
                v-if="静音会议等待AI重试 && !发送中"
                type="button"
                class="btn rite mute-interaction-assist"
                @pointerup.stop.prevent="重试静音会议互动续拍"
              >
                重新生成交互后的下一拍
              </button>
              <button
                v-if="静音会议互动待操作 && 静音会议互动补偿可用 && !静音会议互动结果"
                type="button"
                class="btn rite mute-interaction-assist"
                :disabled="(静音会议互动id === 'B' && !静音会议B目标) || (静音会议互动id === 'C' && !静音会议C模式)"
                @pointerup.stop.prevent="静音会议互动补偿通过"
              >
                使用自动通过 · 不改变剧情结果
              </button>
            </section>
          </div>
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
            <img
              v-for="绘 in 立绘列表"
              :key="绘.src"
              class="portrait"
              :class="{ 'portrait-glory': 绘.src.includes('/立绘/荣耀洞_') }"
              :style="绘.style"
              :src="绘.src"
              alt=""
              draggable="false"
              @error="立绘失效[绘.src] = true"
            />
          </TransitionGroup>
          <!-- 正文卷轴:只演当前幕,且幕跟着房间走——人走了戏就收,回来戏还在(氛围色随位置) -->
          <section ref="卷轴容器" class="story" :class="{ 'story-veiled': 正文隐藏 || 录像带交互幕 || 静音会议交互幕 }">
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
                ✎ {{ 运行阶段 || '这一楼正在发生……' }}<span v-if="生成等待秒"> · 已等待 {{ 生成等待秒 }} 秒</span>
                <button class="btn mini" title="打断,本回合作废" @click="取消回合">取消</button>
                <button
                  v-if="生成等待秒 >= 20 && 待重试行动"
                  class="btn mini retry-now"
                  title="本回合作废，随后用同一句行动重新请求"
                  @click="放弃并重试"
                >
                  ↻ 放弃并重新生成
                </button>
              </p>
            </div>
          </section>
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
        <div v-if="静音会议正式中" class="mute-meeting-lock-note" role="status">
          <Ic n="lock" />
          <span><b>会场已锁定</b>会议进行中，无法离开管理员室；手机会在允许的拍间保持可用。</span>
        </div>

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

        <!-- 房内动作(输入门控收紧后的补位:站在垃圾房/空户里,翻袋撬门不用开地图) -->
        <div v-if="!静音会议正式中 && !发送中 && 当前房间 === '垃圾房' && 垃圾袋列表.length" class="garbage-pick">
          <button class="tile risky garbage-open" @click="垃圾选择开 = true">
            <Ic n="trash" />
            <span class="act-kicker">SEARCH</span>
            <strong>翻垃圾</strong>
            <small>选择对应房间的垃圾袋</small>
          </button>
        </div>
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
        <div v-if="!录像带中 && !静音会议正式中 && !发送中 && 普通房间动作.length" class="scene-acts">
          <button v-for="(动作, i) in 普通房间动作" :key="i" class="tile" :class="动作.类" @click="动作.做()">
            <Ic :n="动作.icon" />
            <span class="act-kicker">{{ 动作.kicker }}</span>
            <strong>{{ 动作.文案 }}</strong>
          </button>
        </div>

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
        <div
          v-if="显示选项 && !录像带中 && !静音会议交互幕 && !静音会议待散会选择 && !静音会议自由待选择"
          class="option-row"
          :style="{ '--opt-img': `url(${素材基址}/界面/选项条.webp)` }"
        >
          <button v-for="(项, i) in 行动选项" :key="i" class="option-chip gal" @click="点选项(项)">{{ 项 }}</button>
        </div>

        <div v-if="录像带交互幕 && !发送中" class="scene-acts special-scene-acts">
          <button
            class="tile"
            :class="{ frozen: 录像带阶段 !== '等待102' }"
            :disabled="录像带阶段 !== '等待102'"
            @click="打开102录像"
          >
            <Ic n="cctv" />
            <span class="act-kicker">{{ 录像带阶段 === '等待102' ? 'SINGLE TAP' : 'PLAYED' }}</span>
            <strong>{{ 录像带阶段 === '等待102' ? '调取102室隐藏摄像头录像' : '102室录像已播放' }}</strong>
          </button>
          <button
            class="tile"
            :class="{ frozen: 录像带阶段 !== '等待202' }"
            :disabled="录像带阶段 !== '等待202'"
            @click="连续点击202录像"
          >
            <Ic n="cctv" />
            <span class="act-kicker">{{ 录像带阶段 === '等待202' ? 'RAPID TAP' : 'LOCKED' }}</span>
            <strong>{{
              录像带阶段 === '等待202'
                ? `连续点击调取202室录像 (${录像带连点计数}/${录像带连点目标})`
                : '202室录像 · 等待前段结束'
            }}</strong>
          </button>
          <button v-if="录像带补偿可用" class="tile special-assist" @click="自动重连202">
            <Ic n="cctv" />
            <span class="act-kicker">RECOVERY</span>
            <strong>让监控系统自动重连</strong>
          </button>
        </div>

        <section v-if="静音会议待散会选择 && !发送中" class="mute-after-panel mute-dismiss-panel">
          <div class="mute-after-heading">
            <span>第 12 拍 · 宣布散会</span>
            <b>丈夫离场后，留下谁？</b>
          </div>
          <p>选择 1 名、2 名或全部参与妻。名单会和你下面的散会总结一起提交，不会提前改写场景。</p>
          <div class="mute-after-wives">
            <button
              v-for="门牌号 in 静音会议参与妻"
              :key="门牌号"
              type="button"
              :class="{ on: 静音会议会后选择.includes(门牌号) }"
              :aria-pressed="静音会议会后选择.includes(门牌号)"
              @click="切换静音会议会后妻(门牌号)"
            >
              <img
                v-if="!头像失效[户静态表[门牌号].妻名]"
                :src="头像图(户静态表[门牌号].妻名)"
                :alt="户静态表[门牌号].妻名"
                @error="头像失效[户静态表[门牌号].妻名] = true"
              />
              <span v-else>{{ 户静态表[门牌号].妻名[0] }}</span>
              <b>{{ 户静态表[门牌号].妻名 }}</b>
              <small>{{ 门牌号 }}</small>
            </button>
          </div>
          <div class="mute-after-count" :class="{ ready: 静音会议会后选择合法 }">
            {{ 静音会议会后选择提示 }}
          </div>
        </section>

        <section v-if="静音会议自由待选择 && !发送中" class="mute-after-panel mute-free-panel">
          <div class="mute-after-heading">
            <span>AFTER HOURS · 会后自由段</span>
            <b>这场会由你决定何时结束</b>
          </div>
          <p>已完成至少三拍会后活动。继续不会设置回合上限；结束会先生成最终收尾，成功后才结算并恢复日常。</p>
          <div class="mute-free-actions">
            <button class="btn" type="button" @click="继续静音会议会后活动">继续会后活动</button>
            <button class="btn rite" type="button" @click="请求结束静音会议">结束本次会议</button>
          </div>
        </section>
        <section v-if="静音会议收尾待重试 && !发送中" class="mute-after-panel mute-free-panel">
          <div class="mute-after-heading">
            <span>FINAL PASS · 最终收尾</span>
            <b>上一次收尾没有成功落地</b>
          </div>
          <p>临时状态、演员名单和结算都仍然保留。重新生成成功后才会真正清场并恢复日常。</p>
          <div class="mute-free-actions single">
            <button class="btn rite" type="button" @click="请求结束静音会议">重新生成最终收尾</button>
          </div>
        </section>

        <!-- 游戏内输入(玩家不碰酒馆输入框) -->
        <div v-if="可输入" class="quill">
          <textarea
            ref="输入框"
            v-model="输入文本"
            :disabled="发送中 || 由头写入中"
            rows="2"
            placeholder="你的言行……(Enter 发送,Shift+Enter 换行)"
            @keydown.enter.exact.prevent="发送"
            @focus="输入聚焦"
            @blur="输入失焦"
          ></textarea>
          <button class="btn rite quill-btn" :disabled="发送中 || 由头写入中 || !当前行动可提交" @click="发送">
            {{ 发送中 ? '…' : 发送按钮文案 }}
          </button>
          <small v-if="输入文本.trim() && !当前资源门槛.可行动" class="resource-lock-hint">
            {{ 当前资源门槛.提示 }}
          </small>
        </div>
        <div v-if="!静音会议正式中 && 可重掷 && !发送中 && 当前房间 === 回合房间" class="reroll-row">
          <button class="btn" title="撤回本回合(你的行动与回应),重新措辞" @click="撤回">⌫ 撤回</button>
          <button class="btn" title="同样的行动重新演一遍" @click="重掷">↻ 重演</button>
        </div>
        <div v-else-if="失败行动 && !发送中" class="reroll-row failed-reroll">
          <span>刚才的生成没有完成。</span>
          <button class="btn" title="使用刚才完全相同的行动重新请求" @click="重试失败行动">↻ 重新生成刚才行动</button>
        </div>

        <button
          v-if="!录像带中 && !静音会议正式中"
          class="global-time-advance"
          type="button"
          :disabled="发送中 || 由头写入中"
          @click="推进固定时段"
        >
          <Ic n="clock" />
          <span>
            <b>推进时间</b>
            <small v-if="时段 === '深夜'">请回管理员室或 302 睡觉</small>
            <small v-else>{{ 当前时段显示 }} → 推进到{{ 下一时段显示 }}</small>
          </span>
        </button>

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
            <div class="mb-line">
              <b>第 {{ 天数 }} 天 · {{ 星期 }}</b
              ><em>{{ 时段问候 }}</em>
            </div>
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
                <span
                  v-else-if="管理任务角标(点.id)"
                  class="spot-note duty"
                  :class="{ overdue: 管理任务角标(点.id) === '逾期' }"
                  >{{ 管理任务角标(点.id) }}</span
                >
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

          <button class="outing-launch" type="button" :disabled="发送中" @click="从地图外出">
            <span><small>OUTING / 外出</small><b>走出公寓</b></span>
            <em>晨跑 · 健身房 · 更多地点准备中</em>
            <Ic n="arrow" />
          </button>

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
                  <!-- :disabled 发送中(审计 C5):点房守了发送中,但已开的卡在生成开始后仍活着——
                       瓷砖点击会落进脚本操作队列,等在飞回合结束后才执行,发起未被请求的第二个回合 -->
                  <button
                    v-for="(动作, i) in 房卡动作"
                    :key="i"
                    class="tile"
                    :class="动作.类"
                    :disabled="发送中"
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
          <div class="dossier-hero">
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
                v-if="!立绘失效[选中档案.立绘图]"
                :src="选中档案.立绘图"
                :alt="选中档案.妻名 + '当前立绘'"
                @error="立绘失效[选中档案.立绘图] = true"
              />
              <img v-else :src="选中档案.基础立绘" :alt="选中档案.妻名" />
            </div>
          </div>

          <div class="axes dossier-axes">
            <div v-for="轴 in 选中档案.三轴" :key="轴.名" class="axis-row">
              <span class="axis-top"
                ><b>{{ 轴.名 }}</b
                ><i>{{ Math.round(轴.值) }}</i></span
              >
              <div
                class="axis dossier-battery"
                role="meter"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-valuenow="轴.值"
              >
                <i class="axis-charge" :class="轴.类" :style="{ '--level': `${Math.max(0, Math.min(100, 轴.值))}%` }" />
              </div>
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
                      v-if="!道具图失效[a.图id]"
                      :src="道具图(a.图id)"
                      :alt="a.值"
                      loading="lazy"
                      draggable="false"
                      @error="道具图失效[a.图id] = true"
                    />
                    <b v-else aria-hidden="true">衣</b>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="选中档案.妻.当前阶段 >= 3" class="dsec dossier-card">
              <div class="dsec-title">
                <span>身 体 开 发</span>
                <button class="cg-progress" type="button" @click.stop="打开CG图库(选中档案.门牌)">
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
                    :disabled="发送中"
                    @click="卸载(选中档案.门牌, k.id)"
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
                  v-for="(槽, i) in 裂缝证物槽"
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
            <p v-if="选中关系线索.数值已冻结" class="relation-wait">她似乎还有一件事没有想明白。</p>
          </div>
          <button
            v-if="选中档案.妻.当前阶段 < 5 && 选中档案.妻.裂缝.已确认"
            class="btn rite"
            :disabled="发送中 || !选中可晋阶"
            @click="晋阶(选中档案.门牌)"
          >
            {{ 选中首夜待晚上 ? '✦ 等到晚上' : 选中晋阶待现场 ? '✦ 按预约见面' : '✦ 跨过界线' }}
          </button>
          <button
            v-if="选中可要钱"
            class="btn"
            :disabled="发送中"
            title="她的钱,现在也是你的钱"
            @click="开口要钱(选中档案.门牌)"
          >
            ¥ 开口要钱
          </button>
        </div>
      </div>

      <!-- ═══════════ 角色CG图库：已解锁显示缩略图，未解锁不泄露画面 ═══════════ -->
      <div v-if="CG图库门牌" class="mask cg-library-mask" @click.self="关闭CG图库">
        <div class="sheet cg-library">
          <button class="sheet-close" @click="关闭CG图库">✕</button>
          <div class="sheet-title">{{ CG图库角色名 }} · CG 图库</div>
          <div class="cg-library-tabs">
            <button
              v-for="页 in CG图库页签"
              :key="页.值"
              class="btn mini"
              :class="{ on: CG图库阶段 === 页.值 }"
              @click="切换CG图库阶段(页.值)"
            >
              {{ 页.名 }} {{ 页.已解锁 }}/{{ 页.总数 }}
            </button>
          </div>
          <div class="sheet-body cg-library-grid">
            <button
              v-for="项 in CG图库当前项"
              :key="项.id"
              class="cg-tile"
              :class="{ locked: !已解锁CG.has(项.id) }"
              :disabled="!已解锁CG.has(项.id)"
              :title="已解锁CG.has(项.id) ? '查看大图' : '尚未解锁'"
              @click="CG预览 = 项"
            >
              <img v-if="已解锁CG.has(项.id)" :src="成人CG地址(项)" alt="" loading="lazy" draggable="false" />
              <span v-else class="cg-lock">🔒</span>
            </button>
          </div>
          <div v-if="CG图库总页数 > 1" class="cg-pagination">
            <button class="btn mini" :disabled="CG图库页码 <= 1" @click="翻CG图库页(-1)">‹ 上一页</button>
            <span>第 {{ CG图库页码 }} / {{ CG图库总页数 }} 页</span>
            <button class="btn mini" :disabled="CG图库页码 >= CG图库总页数" @click="翻CG图库页(1)">下一页 ›</button>
          </div>
        </div>
      </div>

      <div v-if="CG预览" class="mask cg-preview-mask" @click.self="CG预览 = null">
        <button class="sheet-close cg-preview-close" @click="CG预览 = null">✕</button>
        <div class="cg-preview-scroller" @click.self="CG预览 = null">
          <img :src="成人CG地址(CG预览)" alt="" draggable="false" />
        </div>
      </div>

      <!-- ═══════════ 背包(道具可用:布设/送礼/读信) ═══════════ -->
      <div v-if="显示背包" class="mask" @click.self="显示背包 = false">
        <div class="sheet">
          <button class="sheet-close" @click="显示背包 = false">✕</button>
          <div class="sheet-title">背 包</div>
          <div class="sheet-body">
            <div v-for="(项, i) in 背包列表" :key="i" class="ware-card" :class="'ware-' + 项.视觉.类">
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
                <span class="ware-kind"><Ic :n="项.视觉.图" /></span>
              </span>
              <span class="ware-main">
                <b class="ware-name"
                  >{{ 项.名称 }} <em class="ware-kind-label">{{ 项.视觉.标 }}</em></b
                >
                <span class="ware-desc">{{ 项.描述 }}</span>
              </span>
              <span class="ware-acts">
                <button v-if="项.可读信" class="btn mini" :disabled="发送中" @click="打开信(项.信门牌!)">读</button>
                <button v-if="项.可布设" class="btn mini" :disabled="发送中" @click="布设()">装在这个房间</button>
                <button v-if="项.可用资源" class="btn mini rite" :disabled="发送中" @click="用资源道具(项.id)">
                  使用
                </button>
                <button
                  v-if="项.可用运作"
                  class="btn mini"
                  :disabled="发送中"
                  @click="用运作(项.id, 项.全局线路候选?.门牌, 项.全局线路候选)"
                >
                  {{ 项.全局线路候选 ? `用于${户静态表[项.全局线路候选.门牌].妻名}的线索` : '使用' }}
                </button>
                <button v-if="项.可使用录像带" class="btn mini rite" :disabled="发送中" @click="使用录像带">
                  在管理员室播放
                </button>
                <button v-if="项.可筹备静音会议" class="btn mini rite" :disabled="发送中" @click="打开静音会议筹备">
                  筹备会议
                </button>
                <button
                  v-for="夫 in 项.运作对象"
                  :key="'运' + 夫.门牌"
                  class="btn mini"
                  :disabled="发送中 || !夫.时段可用"
                  @click="用运作(项.id, 夫.门牌)"
                >
                  {{ 夫.时段可用 ? `给${夫.夫名}` : `晚上再给${夫.夫名}` }}
                </button>
                <button
                  v-for="候选 in 项.全局运作对象"
                  :key="'线运' + 项.id + 候选.门牌"
                  class="btn mini"
                  :disabled="发送中"
                  @click="用运作(项.id, 候选.门牌, 候选)"
                >
                  用于{{ 户静态表[候选.门牌].妻名 }}的线索
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
                  :disabled="发送中 || !妻.时段可用"
                  :title="妻.时段提示"
                  @click="装载(项.id, 妻.门牌)"
                >
                  {{ 妻.时段可用 ? `装载给${妻.妻名}` : `${妻.时段提示}再装载` }}
                </button>
              </span>
            </div>
            <p v-if="!背包列表.length" class="hint center">(空空如也)</p>
          </div>
        </div>
      </div>

      <!-- ═══════════ 静音会议：背包票只进入筹备；确认开始前不消耗 ═══════════ -->
      <div v-if="静音会议筹备步骤" class="mask mute-prep-mask" @click.self="取消静音会议筹备">
        <section class="sheet mute-prep-sheet" role="dialog" aria-modal="true" aria-label="筹备静音会议">
          <button class="sheet-close" type="button" :disabled="静音会议筹备提交中" @click="取消静音会议筹备">✕</button>
          <div class="ui-kicker">MUTE MEETING / 筹备会议</div>

          <template v-if="静音会议筹备步骤 === '选择'">
            <h3>亲自确定与会名单</h3>
            <p class="mute-prep-lead">
              选择 2—3 名妻子。对应丈夫会自动列席；灰色候选仍展示真实不合格原因，不会被系统代选。
            </p>
            <div class="mute-candidate-grid">
              <button
                v-for="候选 in 静音会议候选列表"
                :key="候选.门牌"
                type="button"
                class="mute-candidate"
                :class="{ on: 静音会议筹备妻.includes(候选.门牌), ineligible: !候选.合格 }"
                :disabled="!候选.合格"
                :aria-pressed="静音会议筹备妻.includes(候选.门牌)"
                @click="切换静音会议筹备妻(候选.门牌)"
              >
                <span class="mute-candidate-avatar">
                  <img
                    v-if="!头像失效[候选.妻名]"
                    :src="头像图(候选.妻名)"
                    :alt="候选.妻名"
                    @error="头像失效[候选.妻名] = true"
                  />
                  <b v-else>{{ 候选.妻名[0] }}</b>
                </span>
                <span class="mute-candidate-main">
                  <b>{{ 候选.门牌 }} · {{ 候选.妻名 }}</b>
                  <small>丈夫：{{ 候选.夫名 }}</small>
                  <em :class="{ good: 候选.合格 }">{{ 候选.合格 ? '可以列席' : 候选.原因 }}</em>
                </span>
                <i>{{ 静音会议筹备妻.includes(候选.门牌) ? '✓' : 候选.合格 ? '＋' : '—' }}</i>
              </button>
            </div>

            <div class="mute-topic-block">
              <b>本次真实议题</b>
              <div class="mute-topic-grid">
                <button
                  v-for="议题 in 静音会议议题列表"
                  :key="议题"
                  type="button"
                  :class="{ on: 静音会议筹备议题 === 议题 }"
                  :aria-pressed="静音会议筹备议题 === 议题"
                  @click="静音会议筹备议题 = 议题"
                >
                  {{ 议题 }}
                </button>
              </div>
            </div>

            <footer class="mute-prep-footer">
              <span :class="{ ready: 静音会议筹备可确认 }">
                已选 {{ 静音会议筹备妻.length }}/3 · {{ 静音会议筹备议题 || '尚未选择议题' }}
              </span>
              <button class="btn rite" type="button" :disabled="!静音会议筹备可确认" @click="查看静音会议确认">
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
                  <dd>{{ 静音会议筹备妻名.join('、') }}</dd>
                </div>
                <div>
                  <dt>对应丈夫</dt>
                  <dd>{{ 静音会议筹备夫名.join('、') }}</dd>
                </div>
                <div>
                  <dt>地点</dt>
                  <dd>管理员室 · 会场临时集合</dd>
                </div>
                <div>
                  <dt>议题</dt>
                  <dd>{{ 静音会议筹备议题 }}</dd>
                </div>
              </dl>
              <ul>
                <li>开场后地图、离场、普通房间动作、商店、背包与监控入口锁定。</li>
                <li>人物只在演出层临时到场，不修改日常位置、作息、赴约或关系。</li>
                <li>将消耗 1 张「静音会议」票；条件变化时会拒绝开场且不消耗。</li>
              </ul>
            </div>
            <footer class="mute-prep-footer confirm">
              <button class="btn" type="button" :disabled="静音会议筹备提交中" @click="静音会议筹备步骤 = '选择'">
                返回修改
              </button>
              <button
                class="btn rite"
                type="button"
                :disabled="静音会议筹备提交中 || !静音会议筹备可确认"
                @click="发送静音会议通知"
              >
                {{ 静音会议筹备提交中 ? '正在重新校验…' : '发送会议通知并开始' }}
              </button>
            </footer>
          </template>
        </section>
      </div>

      <!-- ═══════════ 商店(小时达网购;购买成功立即入包;礼物页签=裂缝解锁后现) ═══════════ -->
      <div v-if="显示商店" class="mask" @click.self="显示商店 = false">
        <div class="sheet shop">
          <button class="sheet-close" @click="显示商店 = false">✕</button>
          <div class="shop-hero">
            <div class="ui-kicker light">WUTONGLI MALL / 网购商城</div>
            <b>商 店</b>
            <em>小时达 · 本时段内送到管理员室</em>
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
            <div
              v-for="项 in 当前货架"
              :key="项.id"
              class="ware-card"
              :class="['ware-' + 道具视觉信息(项).类, { locked: 商品锁定原因(项).length }]"
            >
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
                <span class="ware-kind"><Ic :n="道具视觉信息(项).图" /></span>
              </span>
              <span class="ware-main">
                <b class="ware-name"
                  >{{ 项.名称 }} <em class="ware-kind-label">{{ 道具视觉信息(项).标 }}</em>
                  <em class="ware-price">¥{{ 项.价格 }}</em></b
                >
                <span class="ware-desc">{{ 项.描述 }}</span>
                <span v-if="商品锁定原因(项).length" class="ware-lock">尚缺：{{ 商品锁定原因(项).join('；') }}</span>
              </span>
              <button
                class="btn rite ware-buy"
                :disabled="发送中 || data.现金 < (项.价格 ?? 0) || 商品锁定原因(项).length > 0"
                @click="买(项.id)"
              >
                {{ 商品锁定原因(项).length ? '未解锁' : data.现金 < (项.价格 ?? 0) ? '钱不够' : 商品购买文案(项) }}
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
              <img class="cam-room" :src="背景图(m)" :alt="m + '室监控背景'" />
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

      <!-- ═══════════ 读信(揭晓时刻:碎片拼合的实物) ═══════════
           三条关闭路径全走 合上信(审计 C3):点遮罩/✕ 若只清 读信门牌,揭晓从未登记——
           信留在背包、可晋阶 恒 false、由头门照锁,玩家没有任何提示知道要重读一遍 -->
      <div v-if="读信门牌" class="mask" @click.self="合上信">
        <div class="sheet">
          <button class="sheet-close" @click="合上信">✕</button>
          <div class="sheet-title">拼 合 的 真 相</div>
          <div class="truth-fragments" aria-label="四条线索已经拼合">
            <span v-for="(槽, i) in 裂缝证物槽" :key="`${槽.标}-${i}`"><Ic :n="槽.图" />{{ 槽.标 }}</span>
          </div>
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
      <div v-if="事件提示词文本" class="mask" @click.self="事件提示词文本 = ''">
        <div class="sheet">
          <button class="sheet-close" @click="事件提示词文本 = ''">✕</button>
          <div class="sheet-title">本 拍 提 示 词</div>
          <pre class="event-prompt-view">{{ 事件提示词文本 }}</pre>
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
import { compare } from 'compare-versions';
import type { FunctionalComponent } from 'vue';

import { 读取MVU解析状态, type MVU解析状态 } from '../../MVU解析模式';
import type { SchemaType } from '../../schema';
import {
  获取静音会议回退状态序列,
  获取静音会议素材相对路径,
  静音会议候选门牌顺序,
  type 静音会议候选门牌,
  type 静音会议画面状态 as 静音会议画面状态类型,
} from '../../静音会议配置';
import {
  由头每日次数,
  由头工具表,
  户静态表,
  房间表,
  查房间,
  查考古,
  查性癖,
  查特殊场景,
  查裂缝,
  查道具,
  经济配置,
  荣耀洞冷却时段,
  特殊场景锁定状态,
  阶段标题,
  道具表,
  门牌列表,
  难度表,
  type 道具配置,
  type 门牌,
} from '../../stageConfig';
import { 解析绝对时段 } from '../../周作息';
import { 丈夫在楼, 妻位置推算 } from '../../脚本/游戏逻辑/楼层时钟';
import {
  应用数据库填表兼容设置,
  安装人妻公寓数据库模板,
  打开数据库设置,
  数据库状态,
} from '../../脚本/游戏逻辑/数据库桥';
import { 查金币 } from '../../脚本/游戏逻辑/经济系统';
import { 列出地点管理任务, 管理任务选项 } from '../../脚本/游戏逻辑/管理任务系统';
import { 可晋阶, 可启动母亲药物首夜, 普通首夜时段已满足, 晋阶预约现场已满足 } from '../../脚本/游戏逻辑/结算系统';
import { 规范荣耀洞上次时段 } from '../../脚本/游戏逻辑/荣耀洞';
import { 读取关系线索, 列出阶段线路候选详情, type 阶段线路候选 } from '../../脚本/游戏逻辑/阶段线路系统';
import { 当前聊天ID, 获取静音会议手机状态 } from '../../脚本/游戏逻辑/手机系统';
import { 手机锚消息签名 } from '../../脚本/游戏逻辑/手机时间线租约';
import { 判定时间撤销点, 是时间撤销地点, 时间撤销点键 } from '../../脚本/游戏逻辑/时间撤销系统';
import { 风闻事件安全摘要 } from '../../脚本/游戏逻辑/风闻系统';
import { 清除末尾残缺协议标签, 清除末尾裸JSON补丁 } from '../../脚本/游戏逻辑/严格正文清洗';
import { 当前预设正文标签 as 读取当前预设正文标签 } from '../../脚本/游戏逻辑/预设桥';
import { 清洗预设输出, type 预设正文标签 } from '../../脚本/游戏逻辑/预设输出兼容';
import { 更新有效流式正文 } from '../../脚本/游戏逻辑/正文生成完整性';
import {
  行动资源门槛,
  行动疑似性爱,
  距离下级经验,
  玩家当前日,
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
  角色CG列表,
  角色CG总数,
  应保留成人CG,
  选择成人CG,
  type CG回合信号,
  type CG阶段,
  type 成人CG项,
} from '../../脚本/游戏逻辑/成人CG系统';
import { useDataStore } from './store';
import { CG加载事件属于当前请求 } from './cgLoadState';
import { 计算场景同步, type 场景聊天状态 } from './场景状态同步';
import { 读取录像带连点失败状态, 推进录像带连点失败 } from './录像带交互状态';
import { 同步画幅 } from './viewport';

// 0.69 位图随不可变 Tag 发布。不要通过 `?url` 把它们塞进客户端 module：
// 三张录像带原图就会把移动端入口从约 0.65 MB 撑到 11.7 MB，并显著增加 WebView 解析失败风险。
const 版本素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.69/src/人妻公寓/素材';
const 录像带双屏关闭图 = `${版本素材基址}/特殊场景/录像带/01_双屏关闭.png`;
const 录像带左屏亮起图 = `${版本素材基址}/特殊场景/录像带/02_左屏亮起.png`;
const 录像带双屏亮起图 = `${版本素材基址}/特殊场景/录像带/03_双屏亮起.png`;
const 公寓外部背景图 = `${版本素材基址}/背景/公寓外部.webp`;
const 晨跑公园背景图 = `${版本素材基址}/背景/晨跑公园.webp`;
const 健身房背景图 = `${版本素材基址}/背景/健身房.webp`;
const 清醒咖啡道具图 = `${版本素材基址}/道具/清醒咖啡.webp`;
const 集中胶囊道具图 = `${版本素材基址}/道具/集中胶囊.webp`;
const 运动饮料道具图 = `${版本素材基址}/道具/运动饮料.webp`;
const 强效营养剂道具图 = `${版本素材基址}/道具/强效营养剂.webp`;
const 安全套道具图 = `${版本素材基址}/道具/安全套.webp`;
const 专注训练手册道具图 = `${版本素材基址}/道具/专注训练手册.webp`;
const 蛋白粉道具图 = `${版本素材基址}/道具/蛋白粉.webp`;

// ── 梧桐里主题图标：统一 24×24 圆角描边，公寓门牌/钥匙孔/信件等语义贯穿全套 ──

const 图标库: Record<string, string> = {
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  cctv: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/>',
  map: '<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
  expand:
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  exit: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  door: '<rect x="5" y="2" width="14" height="20" rx="1"/><circle cx="15" cy="12" r="1"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  lock: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/>',
  arrow: '<circle cx="12" cy="12" r="10"/><path d="m12 16 4-4-4-4"/><path d="M8 12h8"/>',
  trash:
    '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  tv: '<rect x="2" y="7" width="20" height="15" rx="2"/><path d="m17 2-5 5-5-5"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="m8.5 7.5 3.5 4 3.5-4M12 11.5V17M9.5 13.5h5M9.5 15.5h5"/>',
  ops: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle class="ic-gem" cx="16" cy="7" r="2"/><circle class="ic-gem" cx="8" cy="17" r="2"/>',
  tool: '<path d="m14.7 6.3 3-3a4.2 4.2 0 0 1-5.2 5.2L5 16l3 3 7.5-7.5a4.2 4.2 0 0 1 5.2-5.2l-3 3"/><path d="m4 17 3 3"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M2 9h20V5H2Z"/><path d="M12 5c-1.6 0-5-.2-5-2.1C7 1.6 8.2 1 9.2 1 11 1 12 5 12 5Zm0 0c1.6 0 5-.2 5-2.1C17 1.6 15.8 1 14.8 1 13 1 12 5 12 5Z"/>',
  letter:
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/><path class="ic-gem" d="m15.5 15.5 2 2 3.5-4"/>',
  search:
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path class="ic-gem" d="M8 10h5M10.5 7.5v5"/>',
  rewind: '<path d="m11 7-5 5 5 5"/><path d="M6 12h7a6 6 0 0 1 6 6v1"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle class="ic-gem" cx="8" cy="8" r="1"/><circle class="ic-gem" cx="16" cy="8" r="1"/><circle class="ic-gem" cx="12" cy="12" r="1"/><circle class="ic-gem" cx="8" cy="16" r="1"/><circle class="ic-gem" cx="16" cy="16" r="1"/>',
  dress: '<path d="M9 3h6l1 5-2 2 5 11H5l5-11-2-2 1-5Z"/><path class="ic-gem" d="M9 3c.5 2 5.5 2 6 0"/>',
  drug: '<path d="M8.5 4.5a4.2 4.2 0 0 1 6 0l5 5a4.2 4.2 0 0 1-6 6l-5-5a4.2 4.2 0 0 1 0-6Z"/><path d="m10 12 6-6"/><path class="ic-gem" d="M6 17h5M8.5 14.5v5"/>',
  favor:
    '<path d="M20.8 5.7c-1.8-2.1-5.1-1.8-6.8.4L12 8.5l-2-2.4C8.3 3.9 5 3.6 3.2 5.7 1.5 7.7 1.8 10.6 3.8 12.4L12 20l8.2-7.6c2-1.8 2.3-4.7.6-6.7Z"/><path class="ic-gem" d="M8 12h2l1-2 2 5 1-3h2"/>',
  kink: '<path d="M12 21a9 9 0 1 1 9-9c0 4-3 6-6 6-2.8 0-5-1.7-5-4 0-2 1.5-3.5 3.5-3.5 1.6 0 2.8 1 2.8 2.5 0 1.1-.8 2-1.8 2"/><circle class="ic-gem" cx="12" cy="4.5" r="1"/>',
  peep: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><path d="M12 9a3 3 0 1 1-1.2 5.8"/><path class="ic-gem" d="m12 12 5-5"/>',
  scene:
    '<path d="M3 8h18v12H3Z"/><path d="M3 8 5 3h16l-2 5M8 3 6 8M14 3l-2 5M20 3l-2 5"/><path class="ic-gem" d="m10 12 5 2.5-5 2.5Z"/>',
};

// 功能图标完全代码原生化：不再先加载混合风格位图，也不会因 CDN 失败换一套视觉语言。
const Ic: FunctionalComponent<{ n: string }> = props =>
  h('svg', {
    class: 'ic',
    viewBox: '0 0 24 24',
    role: 'img',
    'aria-hidden': 'true',
    innerHTML: `<path class="ic-plate" d="M5 2.8h11.8L21.2 7v12A2.2 2.2 0 0 1 19 21.2H5A2.2 2.2 0 0 1 2.8 19V5A2.2 2.2 0 0 1 5 2.8Z"/>${图标库[props.n] ?? 图标库.home}`,
  });
Ic.props = ['n'];

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

type 风闻账视图 = SchemaType['系统']['_风闻账'];
type 风闻事件视图 = 风闻账视图['最近事件'][number];

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
/** 工具由头只在这一次“从门外进房”的首轮结算一次；留在房内续聊不能再次算检修。 */
const 本次入房由头已用 = ref(false);
interface 无耗时拜访记录 {
  房间id: string;
  绝对时段: number;
  进房末楼: number;
  由头已用: boolean;
  非法进入: boolean;
}
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
/** 妻位置显示统一口：特殊场景、赴约、连续对话优先，最后才读取固定周作息。 */
function 妻现位(m: 门牌): string {
  if (静音会议正式中.value && 静音会议演出妻.value.includes(m)) return '管理员室';
  if (赴约妻.value === m) return 当前房间.value ?? '大堂';
  if (粘滞在场.value.位置 && 粘滞在场.value.们.includes(m)) return 粘滞在场.value.位置;
  return 妻位置推算(m, 绝对时段.value, data.value.户[m]);
}
watch(显示地图, 开 => {
  if (开) {
    刷赴约(); // 约完人直接开地图(不产楼),开图那刻补一次同步
    刷粘滞();
  }
});

async function 写场景(房间id: string | null, 破门 = false): Promise<void> {
  const 变量 = getVariables({ type: 'chat' });
  const 旧场景 = (_.get(变量, '_场景') as 场景聊天状态 | null | undefined) ?? null;
  const 旧房间 = 旧场景?.房间id ?? null;
  if (旧房间 !== 房间id) {
    当前成人CG.value = null;
    最近CG信号 = null;
  }
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
            非法进入: 已破门进入.value,
            进房末楼: 进房末楼.value,
            由头已用: 本次入房由头已用.value,
          }
        : null,
      _无耗时拜访: 无耗时拜访,
      _粘滞: null, // 玩家一走动就解除旧对话固定；重回同一房间也不能把已经离开的人“复活”
      _地图轨迹: 新轨迹,
    },
    { type: 'chat' },
  );
}

function 启动阶段线路剧情(房间id: string, 候选: 阶段线路候选): void {
  if (发送中.value || 当前房间.value !== 房间id) return;
  发送中.value = true;
  const 行动 = `(在${查房间(房间id)?.名称 ?? 房间id}处理${户静态表[候选.门牌].妻名}的关系线索)`;
  待重试行动.value = 行动;
  失败行动.value = '';
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
  // 地图上重复点当前房间只是“确认留在这里”：不算重新进门，也不能刷新检修借口/进房楼戳。
  if (房间id === 当前房间.value) {
    if (!保持地图) 关地图();
    闪转场(查房间(房间id)?.名称 ?? 房间id);
    return true;
  }
  if (!(await 确认亲密离场())) return false;
  const 无耗时拜访 =
    (_.get(getVariables({ type: 'chat' }), '_无耗时拜访') as 无耗时拜访记录 | null | undefined) ?? null;
  const 续接同次拜访 =
    无耗时拜访?.房间id === 房间id && 无耗时拜访.绝对时段 === 绝对时段.value && 查房间(房间id)?.类型 === '户';
  if (续接同次拜访) {
    进房末楼.value = 无耗时拜访.进房末楼;
  } else {
    try {
      进房末楼.value = getLastMessageId();
    } catch {
      进房末楼.value = 末楼号.value;
    }
  }
  当前房间.value = 房间id;
  本次入房由头已用.value = 续接同次拜访 ? 无耗时拜访.由头已用 : false;
  已破门进入.value = 破门 || (续接同次拜访 && !!无耗时拜访?.非法进入);
  粘滞在场.value = { 位置: null, 们: [] };
  if (!保持地图) 关地图();
  await 写场景(房间id, 破门);
  记待办(房间id);
  闪转场(查房间(房间id)?.名称 ?? 房间id);
  // 头像即时点亮(走到谁身边谁亮;回合结束后脚本按位置系统重算)
  在场.value = { 焦点: 可见门牌.value.filter(m => 妻现位(m) === 房间id), 在场: [] };
  return true;
}

async function 离开房间(): Promise<void> {
  if (!(await 确认亲密离场())) return;
  当前房间.value = null;
  本次入房由头已用.value = false;
  粘滞在场.value = { 位置: null, 们: [] };
  已破门进入.value = false;
  await 写场景(null);
  闪转场('楼道');
  在场.value = { 焦点: [], 在场: [] }; // 身边已无人,头像随之熄灭
  显示地图.value = true; // 走出房门=站上楼道,顺手展开地图选下一处
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
    if (下一状态.房间变化) 粘滞在场.value = { 位置: null, 们: [] };
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

interface 由头日记录 {
  日: number;
  已用: string[];
}

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
    // 由头门:低阶段户必须持有工具箱，且该户今日仍有未用过的检修借口。
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

async function 从地图外出(): Promise<void> {
  房卡.value = null;
  await 进入('公寓外部');
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
  做: () => void | Promise<void>;
}

const 房卡动作 = computed<卡动作[]>(() => 房间动作(房卡.value));

/**
 * 房内动作(2026-07-17 垃圾房"不能翻"修复):输入门控收紧后,人站在房里满屏无可点——
 * 把非移动类的房间动作(翻垃圾/撬门)晒进场景视图,不开地图也摸得到下级菜单。
 */
const 当前房间动作 = computed<卡动作[]>(() =>
  房间动作(当前房间.value).filter(a => !['GO', 'VISIT', 'KNOCK', 'HOME'].includes(a.kicker)),
);
/** 垃圾袋由一个紧凑选择器承载，避免住户增多后 SEARCH 瓷砖占满正文下半屏。 */
const 普通房间动作 = computed(() => 当前房间动作.value.filter(a => a.kicker !== 'SEARCH'));

type 客户端时间方式 = '推进一时段' | '睡到次日早晨' | '小憩' | '晨跑' | '健身';

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

/** 地图房卡允许“一键前往并执行”，但移动被玩家取消或场景写入失败时不得继续发业务事件。 */
async function 确认已到达动作地点(地点: string): Promise<boolean> {
  try {
    if (当前房间.value !== 地点 && !(await 进入(地点, false, true))) return false;
  } catch (error) {
    // `进入` 先更新本地动效再写宿主变量；持久化失败时立刻以聊天真值纠正画面。
    同步场景自变量();
    弹提示(`没有成功进入目标地点：${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
  return 当前房间.value === 地点;
}

function 房间动作(id: string | null): 卡动作[] {
  if (!id) return [];
  const 房 = 查房间(id);
  const 动作: 卡动作[] = [];
  添加管理任务动作(动作, id);

  if (id === '公寓外部') {
    if (当前房间.value !== id) {
      动作.push({ kicker: 'OUTING', icon: 'sun', 文案: '走出公寓', 做: () => 进入(id) });
    } else {
      动作.push({ kicker: 'RUN', icon: 'sun', 文案: '去河畔晨跑', 做: () => 进入('晨跑公园') });
      动作.push({ kicker: 'GYM', icon: 'favor', 文案: '去公寓健身房', 做: () => 进入('健身房') });
      动作.push({ kicker: 'RETURN', icon: 'home', 文案: '返回公寓大堂', 做: () => 进入('大堂') });
    }
    return 动作;
  }

  if (id === '晨跑公园') {
    if (当前房间.value !== id) {
      动作.push({ kicker: 'RUN', icon: 'sun', 文案: '走到河畔公园', 做: () => 进入(id) });
    } else {
      const 今日 = 玩家当前日(data.value);
      if (时段.value === '早上' && data.value.玩家资源._晨跑训练日 !== 今日) {
        动作.push({ kicker: 'TRAIN', icon: 'sun', 文案: '开始晨跑（推进一时段）', 做: () => 发起时间推进('晨跑') });
      }
      if (时间撤销可用.value) {
        动作.push({ kicker: 'UNDO', icon: 'rewind', 文案: '撤销刚才的时间推进', 做: 发起时间撤销 });
      }
      动作.push({ kicker: 'RETURN', icon: 'arrow', 文案: '回到公寓外', 做: () => 进入('公寓外部') });
    }
    return 动作;
  }

  if (id === '健身房') {
    if (当前房间.value !== id) {
      动作.push({ kicker: 'GYM', icon: 'favor', 文案: '进入健身房', 做: () => 进入(id) });
    } else {
      const 今日 = 玩家当前日(data.value);
      if (时段.value !== '深夜' && data.value.玩家资源._体力训练日 !== 今日) {
        动作.push({ kicker: 'TRAIN', icon: 'favor', 文案: '开始锻炼（推进一时段）', 做: () => 发起时间推进('健身') });
      }
      if (时间撤销可用.value) {
        动作.push({ kicker: 'UNDO', icon: 'rewind', 文案: '撤销刚才的时间推进', 做: 发起时间撤销 });
      }
      动作.push({ kicker: 'RETURN', icon: 'arrow', 文案: '回到公寓外', 做: () => 进入('公寓外部') });
    }
    return 动作;
  }

  if (房?.类型 === '户' && id !== '302') {
    if (!data.value.户[id]) return []; // 招租中,没有可做的事
    if (房内有人在(id)) {
      动作.push({ kicker: 'VISIT', icon: 'door', 文案: '过去串门', 做: () => 进入(id) });
      // 丈夫关系道具：好酒走专属对饮调查；香烟与球赛票经营不同幅度的信任轴。
      if (丈夫在楼(data.value.户[id], id as 门牌, 绝对时段.value) === '在家') {
        if ((data.value?.背包 ?? []).includes('好酒')) {
          动作.push({
            kicker: 'DRINK',
            icon: 'gift',
            文案: `请${户静态表[id as 门牌].夫名}喝一杯`,
            做: async () => {
              if (!(await 确认已到达动作地点(id))) return;
              eventEmit('人妻公寓:对饮', id);
            },
          });
        }
        for (const 礼物 of ['香烟', '球赛票'] as const) {
          if (!(data.value?.背包 ?? []).includes(礼物)) continue;
          动作.push({
            kicker: 'GIFT',
            icon: 'gift',
            文案: 礼物 === '香烟' ? `递${户静态表[id as 门牌].夫名}一包烟` : `送${户静态表[id as 门牌].夫名}两张球赛票`,
            做: async () => {
              if (!(await 确认已到达动作地点(id))) return;
              eventEmit('人妻公寓:丈夫礼物', { 门牌: id, 道具id: 礼物 });
            },
          });
        }
      }
      // 催租三选(P3,天生欠租户):她在家且账上挂着欠租才摆得上台面
      if ((data.value.户[id]?._欠租笔数 ?? 0) > 0 && 妻现位(id as 门牌) === id) {
        const 催 = async (选择: '硬催' | '宽限' | '垫上') => {
          if (!(await 确认已到达动作地点(id))) return;
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
    if (当前房间.value === id) 添加地点线路动作(动作, id);
    return 动作;
  }

  if (id === '302') {
    动作.push({ kicker: 'HOME', icon: 'home', 文案: '回家看看', 做: () => 进入(id) });
    if (当前房间.value === id) {
      添加地点线路动作(动作, id);
      if (时段.value !== '深夜') {
        动作.push({
          kicker: 'NAP',
          icon: 'moon',
          文案: '小憩（推进一时段）',
          做: () => 发起时间推进('小憩'),
        });
      }
      动作.push({
        kicker: 'REST',
        icon: 'moon',
        文案: '睡到次日早晨',
        做: () => 发起时间推进('睡到次日早晨'),
      });
      if (时间撤销可用.value) {
        动作.push({
          kicker: 'UNDO',
          icon: 'rewind',
          文案: '撤销刚才的时间推进',
          做: 发起时间撤销,
        });
      }
    }
    return 动作;
  }

  // 管理员室世界时间：只保留有明确休息含义的小憩／睡眠，普通聊天不再改变日期或时段。
  // 两个事件都带预期水位，后端以乐观校验拒绝双击产生的第二次陈旧推进。
  if (id === '管理员室') {
    动作.push({ kicker: 'GO', icon: 'arrow', 文案: '走过去', 做: () => 进入(id) });
    添加地点线路动作(动作, id);
    if (当前房间.value === id) {
      if (时段.value !== '深夜') {
        动作.push({
          kicker: 'NAP',
          icon: 'moon',
          文案: '小憩（推进一时段）',
          做: () => 发起时间推进('小憩'),
        });
      }
      动作.push({
        kicker: 'REST',
        icon: 'moon',
        文案: '睡到次日早晨',
        做: () => 发起时间推进('睡到次日早晨'),
      });
      if (时间撤销可用.value) {
        动作.push({
          kicker: 'UNDO',
          icon: 'rewind',
          文案: '撤销刚才的时间推进',
          做: 发起时间撤销,
        });
      }
    }
    return 动作;
  }

  // 公共区
  动作.push({ kicker: 'GO', icon: 'arrow', 文案: '走过去', 做: () => 进入(id) });
  添加地点线路动作(动作, id);
  // 出门打听(P5:201渠道;从大堂出门找街坊,伴手礼盒当弹药)
  if (id === '大堂' && (data.value?.背包 ?? []).includes('伴手礼盒')) {
    for (const m of 门牌列表) {
      if (!data.value.户[m] || 户静态表[m].隐身) continue;
      动作.push({
        kicker: 'ASK',
        icon: 'chat',
        文案: `打听${户静态表[m].妻名}家`,
        做: async () => {
          if (!(await 确认已到达动作地点(id))) return;
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
    const 零钱 = 查金币(id, 绝对时段.value);
    if (零钱 > 0) {
      动作.push({
        kicker: 'PICK',
        icon: 'coin',
        文案: `捡起零钱(¥${零钱})`,
        做: async () => {
          if (!(await 确认已到达动作地点(id))) return;
          eventEmit('人妻公寓:捡金币', id);
        },
      });
    }
  }
  if (id === '垃圾房') {
    动作.push({
      kicker: 'SEARCH',
      icon: 'trash',
      文案: '翻垃圾',
      类: 'risky',
      做: async () => {
        if (!(await 确认已到达动作地点('垃圾房'))) return;
        房卡.value = null;
        垃圾选择开.value = true;
      },
    });
  }
  return 动作;
}

/** 每个地点只承载一个楼务任务；两个确定性选项直接铺成瓷砖，不再生调查/回访子状态。 */
function 添加管理任务动作(动作: 卡动作[], 地点: string): void {
  // 地图房卡和房内舞台共用 `房间动作`。楼务只能在玩家真正到达现场后出现，
  // 地图上仅保留“楼务/逾期”角标作为导航提示，不能远程点瓷砖自动进房开工。
  if (当前房间.value !== 地点) return;
  const 任务 = 列出地点管理任务(data.value, 地点)[0];
  if (!任务) return;
  const 剩余时段 = Math.max(0, 任务.截止时段 - 绝对时段.value);
  const 状态文案 = 任务.逾期已扣 ? '逾期补办' : `剩${剩余时段}时段`;
  for (const 选项 of 管理任务选项(任务).slice(0, 2)) {
    动作.push({
      kicker: 任务.逾期已扣 ? 'OVERDUE' : 'DUTY',
      icon: 任务.类型 === '投诉' ? 'ops' : 'tool',
      文案: `${任务.模板} · ${状态文案}｜${选项.文案}`,
      类: 任务.逾期已扣 ? 'risky management-task' : 'management-task',
      做: async () => {
        if (发送中.value) return;
        // 防止开着旧房卡时位置被其他异步动作改变，入口脚本还会再校验一次真实场景。
        if (当前房间.value !== 地点) return;
        if (发送中.value) return;
        eventEmit('人妻公寓:处理管理任务', { 任务id: 任务.id, 选项id: 选项.id, 地点 });
      },
    });
  }
}

function 添加地点线路动作(动作: 卡动作[], 地点: string): void {
  const 户门牌 = 门牌列表.includes(地点 as 门牌) ? (地点 as 门牌) : undefined;
  const 候选们 = 列出阶段线路候选详情(data.value, {
    类型: '地点',
    门牌: 户门牌,
    地点,
    时段: 时段.value,
    楼层: 绝对时段.value,
  });
  for (const 候选 of 候选们) {
    动作.push({
      kicker: 'STORY',
      icon: 'search',
      文案:
        当前房间.value === 地点
          ? `展开${户静态表[候选.门牌].妻名}的关系剧情`
          : `前往${户静态表[候选.门牌].妻名}的线索地点`,
      做: () => (当前房间.value === 地点 ? 启动阶段线路剧情(地点, 候选) : 进入(地点)),
    });
  }
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

function 房内首字(房间id: string): string {
  return 房内的人(房间id)
    .map(n => n[0])
    .join(' ');
}

const 当前房间名 = computed(() => (当前房间.value ? (查房间(当前房间.value)?.名称 ?? 当前房间.value) : ''));

// ── 特殊场景「录像带」：管理员室双屏交互 ──

const 录像带阶段 = computed(() => (data.value?.系统?._特殊场景?.id === '录像带' ? data.value.系统._特殊场景.阶段 : ''));
const 录像带中 = computed(() => !!录像带阶段.value);
const 录像带本地结果 = ref<'' | '102' | '202'>('');
const 录像带连点目标 = 10;
const 录像带连点计数 = ref(0);
const 录像带失败状态 = computed(() => 读取录像带连点失败状态(data.value?.系统?._特殊场景));
const 录像带补偿可用 = computed(() => 录像带失败状态.value.补偿可用);
let 录像带连点开始 = 0;
let 录像带连点timer: ReturnType<typeof setTimeout> | undefined;

const 录像带交互幕 = computed(
  () => 录像带中.value && (录像带阶段.value === '等待102' || 录像带阶段.value === '等待202' || !!录像带本地结果.value),
);
const 录像带当前图 = computed(() => {
  if (录像带本地结果.value === '202') return 录像带双屏亮起图;
  if (录像带本地结果.value === '102' || 录像带阶段.value === '等待202') return 录像带左屏亮起图;
  return 录像带双屏关闭图;
});
const 录像带交互说明 = computed(() => {
  if (发送中.value && 录像带本地结果.value) return '录像已经接通，正在等待她们开口……';
  if (录像带阶段.value === '等待202') return '102室录像已结束。连续点击，让第二台显示器接通信号。';
  return '两台显示器仍是黑的。先调取102室录像。';
});

function 使用录像带() {
  显示背包.value = false;
  eventEmit('人妻公寓:使用录像带');
}

function 提交录像带互动(房间: '102' | '202') {
  if (发送中.value) return;
  clearTimeout(录像带连点timer);
  录像带连点计数.value = 0;
  录像带本地结果.value = 房间;
  发送中.value = true;
  流式段.value = [];
  eventEmit('人妻公寓:录像带互动', 房间);
}

function 打开102录像() {
  if (录像带阶段.value === '等待102') 提交录像带互动('102');
}

function 记录录像带连点失败() {
  if (录像带阶段.value !== '等待202' || 录像带连点计数.value >= 录像带连点目标) return;
  录像带连点计数.value = 0;
  录像带连点开始 = 0;
  const 新交互 = 推进录像带连点失败(data.value?.系统?._特殊场景);
  if (!新交互) return;
  data.value.系统._特殊场景.交互 = 新交互;
  (store as unknown as { flush?: () => void }).flush?.();
}

function 连续点击202录像() {
  if (发送中.value || 录像带阶段.value !== '等待202') return;
  const 现在 = Date.now();
  if (!录像带连点开始) {
    录像带连点开始 = 现在;
    clearTimeout(录像带连点timer);
    录像带连点timer = setTimeout(记录录像带连点失败, 5000);
  } else if (现在 - 录像带连点开始 > 5000) {
    记录录像带连点失败();
    录像带连点开始 = 现在;
    clearTimeout(录像带连点timer);
    录像带连点timer = setTimeout(记录录像带连点失败, 5000);
  }
  录像带连点计数.value += 1;
  if (录像带连点计数.value >= 录像带连点目标) 提交录像带互动('202');
}

function 自动重连202() {
  if (录像带补偿可用.value) 提交录像带互动('202');
}

// ── 特殊场景「静音会议」：筹备、组合图、三道 Pointer 交互与会后循环 ──

type 静音会议互动ID = 'A' | 'B' | 'C';
type 静音会议峰值模式 = '集中' | '同步';
type 静音会议筹备步骤 = '' | '选择' | '确认';

interface 静音会议运行状态 {
  id: string;
  阶段: string;
  地点: string;
  参与妻: string[];
  演出妻: string[];
  演出夫: string[];
  启动楼层: number;
  当前拍: number;
  议题: string;
  重点妻: string;
  峰值模式: string;
  会后妻: string[];
  自由循环次数: number;
  交互: {
    id: string;
    类型: string;
    状态: string;
    失败次数: number;
    补偿可用: boolean;
  };
}

const 空静音会议状态: 静音会议运行状态 = {
  id: '',
  阶段: '',
  地点: '',
  参与妻: [],
  演出妻: [],
  演出夫: [],
  启动楼层: -1,
  当前拍: 0,
  议题: '',
  重点妻: '',
  峰值模式: '',
  会后妻: [],
  自由循环次数: 0,
  交互: { id: '', 类型: '', 状态: '', 失败次数: 0, 补偿可用: false },
};

const 静音会议场景 = computed<静音会议运行状态>(() => {
  const 场 = data.value?.系统?._特殊场景;
  return 场?.id === '静音会议' ? (场 as 静音会议运行状态) : 空静音会议状态;
});
const 静音会议中 = computed(() => 静音会议场景.value.id === '静音会议');
const 静音会议正式中 = computed(() => 静音会议中.value && 静音会议场景.value.阶段 !== '筹备');
const 静音会议当前拍 = computed(() => Math.max(0, Number(静音会议场景.value.当前拍) || 0));

function 是静音会议候选门牌(值: string): 值 is 静音会议候选门牌 {
  return 静音会议候选门牌顺序.includes(值 as 静音会议候选门牌);
}

function 规范静音会议妻名单(原值: readonly string[]): 静音会议候选门牌[] {
  return [...new Set(原值.filter(是静音会议候选门牌))].sort(
    (左, 右) => 静音会议候选门牌顺序.indexOf(左) - 静音会议候选门牌顺序.indexOf(右),
  );
}

const 静音会议参与妻 = computed(() => 规范静音会议妻名单(静音会议场景.value.参与妻));
const 静音会议演出妻 = computed(() => {
  if (
    静音会议当前拍.value > 12 ||
    ['会后', '收尾'].includes(静音会议场景.value.阶段) ||
    静音会议场景.value.阶段.includes('自由')
  ) {
    const 会后 = 规范静音会议妻名单(静音会议场景.value.会后妻);
    if (会后.length) return 会后;
  }
  const 演出 = 规范静音会议妻名单(静音会议场景.value.演出妻);
  return 演出.length ? 演出 : 静音会议参与妻.value;
});
const 静音会议重点妻名 = computed(() => {
  const 门牌号 = 静音会议场景.value.重点妻;
  return 是静音会议候选门牌(门牌号) ? 户静态表[门牌号].妻名 : '';
});
const 静音会议阶段短名 = computed(() => {
  const 阶段 = 静音会议场景.value.阶段;
  if (阶段 === '筹备') return '筹备';
  if (阶段 === '正文') return '固定会议';
  if (阶段 === '散会选择') return '散会';
  if (阶段.includes('自由')) return '会后自由';
  if (阶段 === '会后') return '门后';
  if (阶段 === '收尾') return '最终收尾';
  return '静音会议';
});
const 静音会议拍数文案 = computed(() => {
  const 交互 = 静音会议场景.value.交互;
  if (交互.状态 === '待操作' && ['A', 'B', 'C'].includes(交互.id)) return `交互 ${交互.id}`;
  if (静音会议场景.value.阶段.includes('自由')) {
    return `自由循环 ${静音会议场景.value.自由循环次数 + 1}`;
  }
  return 静音会议当前拍.value > 0 ? `第 ${静音会议当前拍.value} 拍` : '准备中';
});

const 静音会议筹备步骤 = ref<静音会议筹备步骤>('');
const 静音会议筹备妻 = ref<静音会议候选门牌[]>([]);
const 静音会议筹备议题 = ref('');
const 静音会议筹备提交中 = ref(false);
let 静音会议筹备timer: ReturnType<typeof setTimeout> | undefined;
const 静音会议议题列表 = ['公共设施维修', '噪音与住户投诉', '物业费及公共账目'] as const;

const 静音会议候选列表 = computed(() =>
  静音会议候选门牌顺序.map(门牌 => {
    const 户 = data.value?.户?.[门牌];
    const 原因: string[] = [];
    if (!户) 原因.push('尚未入住');
    if (户 && 户.妻.当前阶段 < 4) 原因.push(`当前 L${户.妻.当前阶段}，需要 L4`);
    if (户 && !户.妻.特殊.some(项 => 项.includes('遥控跳蛋'))) 原因.push('未装载遥控跳蛋');
    return {
      门牌,
      妻名: 户静态表[门牌].妻名,
      夫名: 户静态表[门牌].夫名,
      合格: 原因.length === 0,
      原因: 原因.join(' · '),
    };
  }),
);
const 静音会议筹备可确认 = computed(
  () =>
    静音会议筹备妻.value.length >= 2 &&
    静音会议筹备妻.value.length <= 3 &&
    !!静音会议筹备议题.value &&
    静音会议筹备妻.value.every(门牌 => 静音会议候选列表.value.find(项 => 项.门牌 === 门牌)?.合格),
);
const 静音会议筹备妻名 = computed(() => 静音会议筹备妻.value.map(门牌 => 户静态表[门牌].妻名));
const 静音会议筹备夫名 = computed(() => 静音会议筹备妻.value.map(门牌 => 户静态表[门牌].夫名).filter(Boolean));

function 打开静音会议筹备() {
  if (发送中.value || 静音会议中.value) return;
  显示背包.value = false;
  静音会议筹备妻.value = [];
  静音会议筹备议题.value = '';
  静音会议筹备提交中.value = false;
  静音会议筹备步骤.value = '选择';
  eventEmit('人妻公寓:使用静音会议');
  clearTimeout(静音会议筹备timer);
  静音会议筹备timer = setTimeout(() => {
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* 由状态事件优先同步 */
    }
    nextTick(同步静音会议界面);
  }, 800);
}

function 取消静音会议筹备() {
  if (静音会议筹备提交中.value) return;
  const 应通知脚本 = 静音会议场景.value.阶段 === '筹备';
  静音会议筹备步骤.value = '';
  clearTimeout(静音会议筹备timer);
  静音会议筹备妻.value = [];
  静音会议筹备议题.value = '';
  if (应通知脚本) eventEmit('人妻公寓:取消静音会议筹备');
}

function 切换静音会议筹备妻(门牌: 静音会议候选门牌) {
  if (!静音会议候选列表.value.find(项 => 项.门牌 === 门牌)?.合格) return;
  if (静音会议筹备妻.value.includes(门牌)) {
    静音会议筹备妻.value = 静音会议筹备妻.value.filter(项 => 项 !== 门牌);
    return;
  }
  if (静音会议筹备妻.value.length >= 3) {
    弹提示('静音会议最多选择 3 名妻子。');
    return;
  }
  静音会议筹备妻.value = 规范静音会议妻名单([...静音会议筹备妻.value, 门牌]);
}

function 查看静音会议确认() {
  if (静音会议筹备可确认.value) 静音会议筹备步骤.value = '确认';
}

function 发送静音会议通知() {
  if (!静音会议筹备可确认.value || 静音会议筹备提交中.value) return;
  静音会议筹备提交中.value = true;
  eventEmit('人妻公寓:启动静音会议', {
    参与妻: [...静音会议筹备妻.value],
    议题: 静音会议筹备议题.value,
  });
  clearTimeout(静音会议筹备timer);
  静音会议筹备timer = setTimeout(() => {
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* 状态事件缺失时仍由本地真值解除提交锁 */
    }
    nextTick(() => {
      同步静音会议界面();
      if (静音会议场景.value.阶段 === '筹备') 静音会议筹备步骤.value = '选择';
    });
  }, 1200);
}

const 静音会议手机状态 = computed(() => 获取静音会议手机状态(data.value ?? null));
const 静音会议手机已开放 = computed(() => 静音会议手机状态.value.场景中 && 静音会议手机状态.value.已开放);
const 静音会议手机可打开 = computed(() => !静音会议正式中.value || (!发送中.value && 静音会议手机状态.value.可打开));
const 静音会议手机标题 = computed(() => {
  if (!静音会议正式中.value) return '打开手机';
  if (发送中.value && 静音会议手机状态.value.已开放) return '会议正文正在生成，稍后再看微信。';
  return 静音会议手机状态.value.可打开 ? '会场微信已开放' : 静音会议手机状态.value.禁用原因 || '会议微信暂不可用';
});

const 静音会议互动id = computed<静音会议互动ID>(() => {
  const id = 静音会议场景.value.交互.id;
  return id === 'B' || id === 'C' ? id : 'A';
});
const 静音会议互动待操作 = computed(() => 静音会议场景.value.交互.状态 === '待操作');
const 静音会议等待AI重试 = computed(() => 静音会议场景.value.交互.状态 === '等待AI');
const 静音会议B目标 = ref<静音会议候选门牌 | ''>('');
const 静音会议C模式 = ref<静音会议峰值模式 | ''>('');
const 静音会议长按中 = ref(false);
const 静音会议连点计数 = ref(0);
const 静音会议本地失败次数 = ref(0);
const 静音会议本地画面状态 = ref<静音会议画面状态类型 | ''>('');
const 静音会议互动结果 = ref<
  | {
      类型: 'success' | 'failure';
      标题: string;
      说明: string;
    }
  | undefined
>();
const 静音会议互动失败次数 = computed(() =>
  Math.max(静音会议本地失败次数.value, 静音会议场景.value.交互.失败次数 || 0),
);
const 静音会议互动补偿可用 = computed(() => 静音会议场景.value.交互.补偿可用 || 静音会议互动失败次数.value >= 3);
const 静音会议交互幕 = computed(
  () =>
    静音会议正式中.value &&
    (((静音会议互动待操作.value || 静音会议等待AI重试.value) && ['A', 'B', 'C'].includes(静音会议场景.value.交互.id)) ||
      !!静音会议互动结果.value),
);
const 静音会议互动标题 = computed(
  () =>
    ({
      A: '连接全部设备',
      B: '维持第二档',
      C: '执行最终加档',
    })[静音会议互动id.value],
);
const 静音会议互动说明 = computed(
  () =>
    ({
      A: '点按一次，令所有参会设备同时进入第一档。',
      B: '先从参会妻子中选定一人，再持续按住控制键 2 秒。',
      C: '先决定集中一人或全体同步，再于 6 秒内完成连续点击。',
    })[静音会议互动id.value],
);
const 静音会议连点目标 = computed(() =>
  静音会议C模式.value === '同步' ? Math.max(6, 静音会议参与妻.value.length * 3) : 6,
);
const 静音会议连点点亮妻 = computed(() => {
  if (静音会议互动id.value !== 'C' || !静音会议连点计数.value) return [];
  if (静音会议C模式.value === '集中') {
    const 重点 = 静音会议场景.value.重点妻;
    return 是静音会议候选门牌(重点) ? [重点] : [];
  }
  const 已点亮 = Math.min(静音会议参与妻.value.length, Math.floor(静音会议连点计数.value / 3));
  return 静音会议参与妻.value.slice(0, 已点亮);
});

interface 静音会议活动指针 {
  id: number;
  类型: 静音会议互动ID;
  元素: HTMLElement;
  长按timer?: ReturnType<typeof setTimeout>;
}

let 静音会议活动指针: 静音会议活动指针 | null = null;
let 静音会议连点timer: ReturnType<typeof setTimeout> | undefined;
let 静音会议结果timer: ReturnType<typeof setTimeout> | undefined;

function 释放静音会议指针() {
  const 指针 = 静音会议活动指针;
  if (!指针) return;
  clearTimeout(指针.长按timer);
  try {
    if (指针.元素.hasPointerCapture(指针.id)) 指针.元素.releasePointerCapture(指针.id);
  } catch {
    /* 元素已离开文档时只需清本地状态 */
  }
  静音会议活动指针 = null;
  静音会议长按中.value = false;
}

function 清理静音会议连点() {
  clearTimeout(静音会议连点timer);
  静音会议连点timer = undefined;
  静音会议连点计数.value = 0;
}

function 清理静音会议互动现场(保留结果 = false) {
  释放静音会议指针();
  清理静音会议连点();
  clearTimeout(静音会议结果timer);
  静音会议结果timer = undefined;
  if (!保留结果) 静音会议互动结果.value = undefined;
}

function 捕获静音会议指针(event: PointerEvent, 类型: 静音会议互动ID): boolean {
  if (
    !event.isPrimary ||
    event.button !== 0 ||
    静音会议活动指针 ||
    !静音会议互动待操作.value ||
    静音会议互动id.value !== 类型 ||
    静音会议互动结果.value
  ) {
    return false;
  }
  const 元素 = event.currentTarget as HTMLElement | null;
  if (!元素) return false;
  try {
    元素.setPointerCapture(event.pointerId);
  } catch {
    return false;
  }
  静音会议活动指针 = { id: event.pointerId, 类型, 元素 };
  return true;
}

function 静音会议互动载荷(id = 静音会议互动id.value) {
  if (id === 'B') return { id, 目标妻: 静音会议B目标.value || 静音会议场景.value.重点妻 };
  if (id === 'C') return { id, 模式: 静音会议C模式.value || 静音会议场景.value.峰值模式 };
  return { id };
}

function 显示静音会议互动失败(说明: string) {
  if (!静音会议互动待操作.value || 静音会议互动结果.value) return;
  const id = 静音会议互动id.value;
  清理静音会议互动现场();
  静音会议本地失败次数.value += 1;
  静音会议互动结果.value = { 类型: 'failure', 标题: '操作未完成', 说明 };
  eventEmit('人妻公寓:静音会议互动失败', { id });
  静音会议结果timer = setTimeout(() => {
    静音会议互动结果.value = undefined;
  }, 720);
}

function 提交静音会议互动(补偿 = false) {
  if (!静音会议互动待操作.value || 静音会议互动结果.value) return;
  const id = 静音会议互动id.value;
  if (id === 'B' && !静音会议B目标.value) return;
  if (id === 'C' && !静音会议C模式.value) return;
  清理静音会议互动现场();
  if (id === 'A') 静音会议本地画面状态.value = 'DETAIL';
  if (id === 'C') 静音会议本地画面状态.value = 'PEAK';
  静音会议互动结果.value = {
    类型: 'success',
    标题: 补偿 ? '系统已接管操作' : '控制信号已确认',
    说明:
      id === 'A'
        ? '全部设备已经连接，第一档同步启动。'
        : id === 'B'
          ? `${户静态表[静音会议B目标.value as 静音会议候选门牌].妻名}的第二档保持稳定。`
          : 静音会议C模式.value === '同步'
            ? '所有参会设备同时进入最终档。'
            : '最终档已集中到重点目标。',
  };
  静音会议结果timer = setTimeout(() => {
    发送中.value = true;
    流式段.value = [];
    eventEmit(补偿 ? '人妻公寓:静音会议互动补偿' : '人妻公寓:静音会议互动', 静音会议互动载荷(id));
  }, 520);
}

function 静音会议A按下(event: PointerEvent) {
  捕获静音会议指针(event, 'A');
}

function 静音会议A抬起(event: PointerEvent) {
  if (静音会议活动指针?.类型 !== 'A' || 静音会议活动指针.id !== event.pointerId) return;
  释放静音会议指针();
  提交静音会议互动();
}

function 选择静音会议B目标(门牌: 静音会议候选门牌, event?: PointerEvent) {
  event?.preventDefault();
  if (event && (!event.isPrimary || event.button !== 0)) return;
  if (静音会议互动id.value === 'B' && 静音会议互动待操作.value && !静音会议互动结果.value) {
    静音会议B目标.value = 门牌;
  }
}

function 静音会议B按下(event: PointerEvent) {
  if (!静音会议B目标.value || !捕获静音会议指针(event, 'B') || !静音会议活动指针) return;
  静音会议长按中.value = true;
  静音会议活动指针.长按timer = setTimeout(() => {
    释放静音会议指针();
    提交静音会议互动();
  }, 2000);
}

function 静音会议B抬起(event: PointerEvent) {
  if (静音会议活动指针?.类型 !== 'B' || 静音会议活动指针.id !== event.pointerId) return;
  释放静音会议指针();
  显示静音会议互动失败('需要持续按住整整 2 秒；现在可以立即重试。');
}

function 选择静音会议C模式(模式: 静音会议峰值模式, event?: PointerEvent) {
  event?.preventDefault();
  if (event && (!event.isPrimary || event.button !== 0)) return;
  if (静音会议互动id.value !== 'C' || !静音会议互动待操作.value || 静音会议互动结果.value) return;
  if (静音会议连点计数.value) 清理静音会议连点();
  静音会议C模式.value = 模式;
}

function 静音会议C按下(event: PointerEvent) {
  if (!静音会议C模式.value) return;
  捕获静音会议指针(event, 'C');
}

function 静音会议C抬起(event: PointerEvent) {
  if (静音会议活动指针?.类型 !== 'C' || 静音会议活动指针.id !== event.pointerId) return;
  释放静音会议指针();
  if (!静音会议连点计数.value) {
    静音会议连点timer = setTimeout(() => {
      显示静音会议互动失败('没有在 6 秒内完成连续点击；计数已经复位。');
    }, 6000);
  }
  静音会议连点计数.value += 1;
  if (静音会议连点计数.value >= 静音会议连点目标.value) 提交静音会议互动();
}

function 静音会议指针取消(event?: PointerEvent, 记录失败 = false) {
  if (event && 静音会议活动指针 && 静音会议活动指针.id !== event.pointerId) return;
  const 原类型 = 静音会议活动指针?.类型;
  释放静音会议指针();
  if (原类型 === 'C') 清理静音会议连点();
  if (记录失败 && 原类型) 显示静音会议互动失败('指针离开了控制区域；捕获状态已清理，可以重试。');
}

function 静音会议窗口失焦() {
  释放静音会议指针();
  清理静音会议连点();
}

function 静音会议互动补偿通过() {
  if (静音会议互动补偿可用.value) 提交静音会议互动(true);
}

function 重试静音会议互动续拍() {
  if (!静音会议等待AI重试.value || 发送中.value) return;
  const 载荷 = 静音会议互动载荷();
  if ((载荷.id === 'B' && !('目标妻' in 载荷 && 载荷.目标妻)) || (载荷.id === 'C' && !('模式' in 载荷 && 载荷.模式))) {
    弹提示('交互目标状态缺失，无法重放下一拍。');
    return;
  }
  发送中.value = true;
  流式段.value = [];
  静音会议互动结果.value = {
    类型: 'success',
    标题: '重新发送控制结果',
    说明: '交互已经通过，正在重新生成后续正文。',
  };
  eventEmit('人妻公寓:静音会议互动', 载荷);
}

const 静音会议画面状态 = computed<静音会议画面状态类型>(() => {
  if (静音会议本地画面状态.value) return 静音会议本地画面状态.value;
  const 拍 = 静音会议当前拍.value;
  const 待交互 = 静音会议互动待操作.value ? 静音会议互动id.value : '';
  if (拍 <= 3 || 待交互 === 'A') return 'CLEAN';
  if (拍 <= 10 || 待交互 === 'C') return 'DETAIL';
  return 'PEAK';
});
const 静音会议显示组合图 = computed(
  () =>
    静音会议正式中.value &&
    静音会议当前拍.value >= 1 &&
    静音会议当前拍.value <= 12 &&
    (静音会议参与妻.value.length === 2 || 静音会议参与妻.value.length === 3),
);
const 静音会议图回退序号 = ref(0);
const 静音会议图已加载 = ref(false);
const 静音会议图状态序列 = computed(
  () => 获取静音会议回退状态序列(静音会议画面状态.value) ?? ([] as readonly 静音会议画面状态类型[]),
);
const 静音会议当前图地址 = computed(() => {
  if (!静音会议显示组合图.value) return '';
  const 状态 = 静音会议图状态序列.value[静音会议图回退序号.value];
  const 相对路径 = 状态 ? 获取静音会议素材相对路径(静音会议参与妻.value, 状态) : null;
  return 相对路径 ? `${成人CG基址}/${相对路径}` : '';
});

function 静音会议图加载成功() {
  静音会议图已加载.value = true;
}

function 静音会议图加载失败() {
  静音会议图已加载.value = false;
  if (静音会议图回退序号.value < 静音会议图状态序列.value.length) 静音会议图回退序号.value += 1;
}

watch(
  () => `${静音会议参与妻.value.join('-')}|${静音会议画面状态.value}`,
  () => {
    静音会议图回退序号.value = 0;
    静音会议图已加载.value = false;
  },
);

watch(
  () => `${静音会议场景.value.id}|${静音会议场景.value.交互.id}`,
  () => {
    清理静音会议互动现场();
    静音会议B目标.value = '';
    静音会议C模式.value = '';
    静音会议本地失败次数.value = 0;
    静音会议本地画面状态.value = '';
  },
);

const 静音会议会后选择 = ref<静音会议候选门牌[]>([]);
const 静音会议继续已选 = ref(false);
const 静音会议自由行动进行中 = ref(false);
const 静音会议待散会选择 = computed(
  () =>
    静音会议正式中.value &&
    静音会议场景.value.阶段 === '散会选择' &&
    静音会议当前拍.value === 12 &&
    !静音会议交互幕.value,
);
const 静音会议会后选择合法 = computed(
  () =>
    静音会议会后选择.value.length >= 1 &&
    静音会议会后选择.value.length <= 静音会议参与妻.value.length &&
    静音会议会后选择.value.every(门牌 => 静音会议参与妻.value.includes(门牌)),
);
const 静音会议会后选择提示 = computed(() =>
  静音会议会后选择合法.value
    ? `将留下 ${静音会议会后选择.value.map(门牌 => 户静态表[门牌].妻名).join('、')}`
    : '请至少选择 1 名妻子',
);
const 静音会议自由待选择 = computed(
  () =>
    静音会议正式中.value &&
    静音会议场景.value.阶段.includes('自由') &&
    静音会议当前拍.value >= 15 &&
    !静音会议继续已选.value,
);
const 静音会议收尾待重试 = computed(() => 静音会议正式中.value && 静音会议场景.value.阶段 === '收尾');

watch(
  () => 静音会议场景.value.自由循环次数,
  (新次数, 旧次数) => {
    if (静音会议自由行动进行中.value && 静音会议场景.value.阶段.includes('自由') && 新次数 > 旧次数) {
      静音会议继续已选.value = false;
      静音会议自由行动进行中.value = false;
    }
  },
);

function 切换静音会议会后妻(门牌: 静音会议候选门牌) {
  if (!静音会议参与妻.value.includes(门牌)) return;
  静音会议会后选择.value = 静音会议会后选择.value.includes(门牌)
    ? 静音会议会后选择.value.filter(项 => 项 !== 门牌)
    : 规范静音会议妻名单([...静音会议会后选择.value, 门牌]);
}

function 继续静音会议会后活动() {
  静音会议继续已选.value = true;
  nextTick(() => 输入框.value?.focus());
}

function 请求结束静音会议() {
  if ((!静音会议自由待选择.value && !静音会议收尾待重试.value) || 发送中.value) return;
  发送中.value = true;
  流式段.value = [];
  eventEmit('人妻公寓:结束静音会议');
}

function 同步静音会议界面() {
  clearTimeout(静音会议筹备timer);
  静音会议筹备timer = undefined;
  if (!静音会议中.value) {
    静音会议筹备步骤.value = '';
    静音会议筹备提交中.value = false;
    静音会议会后选择.value = [];
    静音会议继续已选.value = false;
    静音会议自由行动进行中.value = false;
    清理静音会议互动现场();
    return;
  }
  if (静音会议场景.value.阶段 === '筹备') {
    if (!静音会议筹备步骤.value) 静音会议筹备步骤.value = '选择';
    静音会议筹备提交中.value = false;
    return;
  }
  静音会议筹备步骤.value = '';
  静音会议筹备提交中.value = false;
  当前房间.value = '管理员室';
  幕房间.value = '管理员室';
  显示地图.value = false;
  显示商店.value = false;
  显示背包.value = false;
  显示监控.value = false;
  显示史册.value = false;
  选中门牌.value = null;
  CG图库门牌.value = null;
  CG预览.value = null;
  房卡.value = null;
  垃圾选择开.value = false;
}

watch(
  () => `${静音会议场景.value.id}|${静音会议场景.value.阶段}`,
  () => nextTick(同步静音会议界面),
  { flush: 'post' },
);

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
      ? '这户今天的三个检修借口都用过了，明天再来。'
      : '没个由头,你在人家门口站不住脚——去商店「工具」页签买一只工具箱。';
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
  // 高级隔离事件不参与新手教程。四项基础走访完成前入口不出现；脚本端另有同一门禁，
  // 防止延迟点击、旧 iframe 或手工事件绕过显示层。
  if (!['信箱区', '101', '102', '管理员室'].every(键 => 待办勾.value[键])) return false;
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

// 普通素材固定使用含完整720个文件的rq0.55快照；代码版本Tag不再承担素材仓职责。
const 素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材';
const 成人CG基址 = 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg1/cg1';
const CG解锁存储键 = '人妻公寓_成人CG解锁_cg1';
const 当前成人CG = ref<成人CG项 | null>(null);
const 成人CG加载中 = ref(false);
const 成人CG本次失效 = new Set<string>();
const 已解锁CG = ref<Set<string>>(new Set());
let 最近CG信号: CG回合信号 | null = null;
let 当前成人CG展示键 = '';
const 当前成人CG请求epoch = ref(0);

function 成人CG地址(项: 成人CG项): string {
  return `${成人CG基址}/${项.path}`;
}

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

interface 立绘项 {
  src: string;
  style: Record<string, string>;
}

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
      const 差分 = sku ? `${素材基址}/立绘/${妻名}_${sku}.webp` : '';
      return 差分 && !立绘失效.value[差分] ? 差分 : `${素材基址}/立绘/${妻名}.webp`;
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
  刷粘滞();
}

const 头像列表 = computed(() =>
  可见门牌.value.map(m => ({
    门牌: m,
    妻名: 户静态表[m].妻名,
    态: 静音会议正式中.value
      ? 静音会议演出妻.value.includes(m)
        ? 静音会议场景.value.重点妻 === m || 静音会议场景.value.会后妻.includes(m)
          ? 'focus'
          : 'ambient'
        : 'away'
      : 在场.value.焦点.includes(m)
        ? 'focus'
        : 在场.value.在场.includes(m)
          ? 'ambient'
          : 'away',
  })),
);

// ── 游戏内输入(固定0楼:行动发给脚本回合引擎,不碰酒馆输入框) ──

const 输入文本 = ref('');
const 发送中 = ref(false);
watch(发送中, 正在生成 => {
  if (正在生成) 亲密抽屉展开.value = false;
});
const 由头写入中 = ref(false);
const 流式段 = ref<string[]>([]);
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
const 输入框 = ref<HTMLTextAreaElement | null>(null);
const 键盘视口们: VisualViewport[] = [];
let 键盘定位timer: ReturnType<typeof setTimeout> | undefined;
let 生成等待timer: ReturnType<typeof setInterval> | undefined;

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
    if (静音会议场景.value.阶段.includes('自由')) 静音会议自由行动进行中.value = true;
  }
  发送中.value = true;
  待重试行动.value = 文本;
  失败行动.value = '';
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
  // 由头进门:工具箱每天对同一户依次提供三个不同借口，先确保记录落库再生成。
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
    文本 = `(${用}在手,以${由头工具表[用]}为由敲开了门；这是今天对这户的第${新记录.已用.length}次检修)${文本}`;
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

// ── 序章:难度三档 ──

const 选中难度 = ref('');
const 难度展开 = ref(false); // 标题屏:false=主菜单(开始游戏/设置),true=难度选择
const 难度卡 = Object.values(难度表);

function 开始考验() {
  if (!选中难度.value || 发送中.value) return;
  发送中.value = true;
  eventEmit('人妻公寓:开始新游戏', 选中难度.value);
}

// ── 待办软引导(开局流程③:拿钥匙看信箱→101报修→102认门→回管理员室;不硬锁) ──

const 待办定义 = [
  { 键: '信箱区', 文字: '去信箱看看租约单子' },
  { 键: '101', 文字: '去 101 修水管' },
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
const CG图库阶段 = ref<CG阶段>('foreplay');
const CG图库页码 = ref(1);
const CG图库每页 = 15;
const CG预览 = ref<成人CG项 | null>(null);
const CG阶段名: Record<CG阶段, string> = {
  foreplay: '前戏',
  active: '进行中',
  climax_after: '高潮事后',
};

const CG图库角色名 = computed(() => (CG图库门牌.value ? 户静态表[CG图库门牌.value].妻名 : ''));
const CG图库全部项 = computed(() => (CG图库门牌.value ? 角色CG列表(CG图库门牌.value) : []));
const CG图库阶段全部项 = computed(() => CG图库全部项.value.filter(item => item.phase === CG图库阶段.value));
const CG图库总页数 = computed(() => Math.max(1, Math.ceil(CG图库阶段全部项.value.length / CG图库每页)));
const CG图库当前项 = computed(() => {
  const 起点 = (CG图库页码.value - 1) * CG图库每页;
  return CG图库阶段全部项.value.slice(起点, 起点 + CG图库每页);
});
const CG图库页签 = computed(() =>
  (Object.keys(CG阶段名) as CG阶段[]).map(值 => {
    const 项 = CG图库全部项.value.filter(item => item.phase === 值);
    return {
      值,
      名: CG阶段名[值],
      总数: 项.length,
      已解锁: 项.filter(item => 已解锁CG.value.has(item.id)).length,
    };
  }),
);

function 打开CG图库(门牌号: 门牌): void {
  CG图库门牌.value = 门牌号;
  CG图库阶段.value = 'foreplay';
  CG图库页码.value = 1;
  CG预览.value = null;
}

function 切换CG图库阶段(阶段: CG阶段): void {
  CG图库阶段.value = 阶段;
  CG图库页码.value = 1;
}

function 翻CG图库页(偏移: number): void {
  CG图库页码.value = _.clamp(CG图库页码.value + 偏移, 1, CG图库总页数.value);
}

function 关闭CG图库(): void {
  CG预览.value = null;
  CG图库门牌.value = null;
  CG图库页码.value = 1;
}

const 选中档案 = computed(() => {
  const m = 选中门牌.value;
  if (!m || !就绪.value || !data.value.户[m]) return null;
  const { 妻, 夫 } = data.value.户[m];
  const 当前立绘SKU = 妻._穿着SKU._立绘 ?? 妻._穿着SKU.内衣 ?? 妻._穿着SKU.外装;
  const 基础立绘 = `${素材基址}/立绘/${户静态表[m].妻名}.webp`;
  return {
    门牌: m,
    妻名: 户静态表[m].妻名,
    夫名: 户静态表[m].夫名 || '她丈夫',
    夫状态: 丈夫在楼(data.value.户[m], m, 绝对时段.value),
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
      已解锁: [...已解锁CG.value].filter(id => CG条目(id)?.door === m).length,
      总数: 角色CG总数(m),
    },
  };
});

const 选中可晋阶 = computed(() => {
  const m = 选中门牌.value;
  if (!m || !data.value.户[m]) return false;
  return (
    (可晋阶(data.value.户[m].妻) &&
      普通首夜时段已满足(data.value, m) &&
      晋阶预约现场已满足(data.value, m, 当前房间.value)) ||
    (m === '302' && 可启动母亲药物首夜(data.value, 当前房间.value))
  );
});

const 选中首夜待晚上 = computed(() => {
  const m = 选中门牌.value;
  const 妻 = m ? data.value.户[m]?.妻 : undefined;
  return !!m && m !== '302' && !!妻 && 妻.当前阶段 === 2 && 可晋阶(妻) && !普通首夜时段已满足(data.value, m);
});

const 选中晋阶待现场 = computed(() => {
  const m = 选中门牌.value;
  const 妻 = m ? data.value.户[m]?.妻 : undefined;
  return (
    !!m &&
    !!妻 &&
    可晋阶(妻) &&
    普通首夜时段已满足(data.value, m) &&
    !晋阶预约现场已满足(data.value, m, 当前房间.value)
  );
});

const 显示关系线索 = ref(false);
const 选中关系线索 = computed(() => {
  const m = 选中门牌.value;
  const 妻 = m ? data.value.户[m]?.妻 : undefined;
  return m && 妻 ? 读取关系线索(data.value, m) : null;
});
watch(选中门牌, () => {
  显示关系线索.value = false;
});

/** L4 要钱按钮(P3:钱的流向反转=堕落可视化;冷却与刹车全在脚本) */
const 选中可要钱 = computed(() => {
  const m = 选中门牌.value;
  return !!m && (data.value.户[m]?.妻.当前阶段 ?? 0) >= 4 && 妻在玩家身边(m);
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

type 道具视觉类型 = 'product' | 'evidence' | 'scene' | 'action';

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
      // 礼物等可送出:须与她同处一室(当面);工具/运作/药物/性癖不走"送"
      // (药物=晋阶按钮自动消耗;性癖=装载;302特例:回家时可送妈东西——破妈妈墙的唯一入口,入列前也通)
      可送对象:
        !配?.常驻 &&
        id !== '录像带' &&
        id !== '静音会议' &&
        !信门牌 &&
        id !== '针孔摄像头' &&
        !['补给', '运作', '工具', '药物', '性癖'].includes(配?.类别 ?? '')
          ? [
              ...可见门牌.value.filter(m => 妻在玩家身边(m)).map(m => ({ 门牌: m, 妻名: 户静态表[m].妻名 })),
              ...(当前房间.value === '302' && data.value.户['302'] ? [{ 门牌: '302' as 门牌, 妻名: '妈' }] : []),
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
const 商店页签 = ref('工具');

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
  // 药物页签不常驻(P5):剧情节点开窗——当前唯一窗口=母亲入列且到阶段2(她的首夜必需)
  if (data.value?.系统?._母亲入列 && (data.value.户['302']?.妻.当前阶段 ?? 0) >= 2) {
    架.push({ 页签: '药物', 商品: 按类('药物'), 空文案: '柜台下面的东西,问了才有。' });
  }
  return 架;
});

const 当前货架 = computed(() => 货架.value.find(页 => 页.页签 === 商店页签.value)?.商品 ?? []);
const 当前空文案 = computed(() => 货架.value.find(页 => 页.页签 === 商店页签.value)?.空文案 ?? '(暂时没货)');

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

const 选中线索 = computed(() => {
  const m = 选中门牌.value;
  if (!m || !data.value.户[m]) return [];
  const 缝 = 查裂缝(m);
  const 进度 = data.value.户[m].妻.裂缝.碎片进度;
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

const 选中裂缝 = computed(() => (选中门牌.value ? (查裂缝(选中门牌.value) ?? null) : null));

// ── 剧情卷轴:全部楼层清洗后重建(伪单楼) ──

interface 卷轴条 {
  谁: '玩家' | '叙事';
  文本: string[];
  楼?: number;
  可回档?: boolean;
  原文?: string;
  事件id?: string;
  事件提示词?: string;
  _排序?: number;
}

const 卷轴 = ref<卷轴条[]>([]);
const 卷轴容器 = ref<HTMLElement | null>(null);
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
  if (卷轴容器.value) 卷轴容器.value.scrollTop = 卷轴容器.value.scrollHeight;
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

// ── 沉浸全屏(iframe 内对自身文档 requestFullscreen;失败退回画幅撑满) ──

const 全屏中 = ref(false);
const 真全屏中 = ref(false);
const 移动端媒体 = window.matchMedia('(max-width: 540px)');
const 移动端 = ref(移动端媒体.matches);
const 移动端全屏引导存储键 = 'rqgy-mobile-fullscreen-guide-v1';
type 移动端全屏选择 = '全屏' | '窗口';

function 读取移动端全屏选择(): boolean {
  try {
    const 选择 = localStorage.getItem(移动端全屏引导存储键);
    return 选择 === '全屏' || 选择 === '窗口';
  } catch {
    return false;
  }
}

const 移动端全屏引导已处理 = ref(读取移动端全屏选择());
const 显示移动端全屏引导 = computed(
  () => 移动端.value && !移动端全屏引导已处理.value && !真全屏中.value,
);

function 记住移动端全屏选择(选择: 移动端全屏选择): void {
  移动端全屏引导已处理.value = true;
  try {
    localStorage.setItem(移动端全屏引导存储键, 选择);
  } catch {
    /* 隐私模式拒绝持久化时，本次页面仍不再遮挡。 */
  }
}

function 继续窗口模式(): void {
  记住移动端全屏选择('窗口');
}

function 同步移动端断点(event: MediaQueryListEvent): void {
  移动端.value = event.matches;
}

type 全屏根 = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type 全屏文档 = Document & { webkitExitFullscreen?: () => void; webkitFullscreenElement?: Element | null };

function 应用画幅(开: boolean) {
  document.documentElement.classList.toggle('rqgy-full', 开);
  同步画幅();
}

async function 进真全屏() {
  const 根 = document.documentElement as 全屏根;
  if (根.requestFullscreen) await 根.requestFullscreen();
  else if (根.webkitRequestFullscreen) await 根.webkitRequestFullscreen();
  else throw new Error('Fullscreen API 不可用');
}

async function 打开移动端全屏() {
  记住移动端全屏选择('全屏');
  try {
    await 进真全屏();
  } catch (e) {
    console.warn('[人妻公寓客户端] 移动端真全屏失败:', e);
    错误信息.value = '浏览器拒绝进入全屏，请允许网页全屏后再点一次';
    全屏中.value = true;
    应用画幅(true);
  }
}

type 酒馆原生提示词模块 = {
  promptItemize: (提示词: unknown[], 楼号: number) => Promise<unknown> | unknown;
  itemizedPrompts: unknown[];
};

async function 读取酒馆原生提示词模块(宿主窗口: Window): Promise<酒馆原生提示词模块 | null> {
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

  const 原生模块 = await 读取酒馆原生提示词模块(宿主窗口);
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
    const 轮询 = window.setInterval(() => {
      次数++;
      const 有窗口 = Boolean(弹窗文档.querySelector('dialog[open], [role="dialog"], .popup[open]'));
      看见窗口 ||= 有窗口;
      if ((看见窗口 && !有窗口) || 次数 > 1200) {
        clearInterval(轮询);
        if (看见窗口) void 进真全屏().catch(e => console.warn('[人妻公寓客户端] 原生提示词关闭后恢复全屏失败:', e));
      }
    }, 250);
  }
}

async function 切换全屏() {
  const 文档 = document as 全屏文档;
  try {
    if (document.fullscreenElement ?? 文档.webkitFullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else 文档.webkitExitFullscreen?.();
    } else {
      if (移动端.value) 记住移动端全屏选择('全屏');
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

// 首次进入序章时主动说明安装顺序；按版本换键，让旧玩家升级后也能看到数据库单路线说明。
const 首次说明开 = ref(false);
const 首次说明存储键 = '人妻公寓_首次游玩说明_database_sql_mode_20260803';
const 酒馆助手版本清单地址 = [
  'https://raw.githubusercontent.com/N0VI028/JS-Slash-Runner/main/manifest.json',
  'https://fastly.jsdelivr.net/gh/N0VI028/JS-Slash-Runner@main/manifest.json',
];
const 数据库检测 = ref(数据库状态());
const 安装模板中 = ref(false);
const 调整填表设置中 = ref(false);
const 酒馆助手版本 = ref('');
const 酒馆助手最新版本 = ref('');
const 酒馆助手最新版本查询失败 = ref(false);
const 酒馆助手检测中 = ref(false);
const 酒馆助手已安装 = computed(() => {
  const 版本 = 酒馆助手版本.value.match(/\d+(?:\.\d+){1,3}/)?.[0];
  return Boolean(版本);
});
const 酒馆助手为最新版 = computed<boolean | null>(() => {
  const 当前版本 = 酒馆助手版本.value.match(/\d+(?:\.\d+){1,3}/)?.[0];
  const 最新版本 = 酒馆助手最新版本.value.match(/\d+(?:\.\d+){1,3}/)?.[0];
  if (!当前版本 || !最新版本) return null;
  return compare(当前版本, 最新版本, '>=');
});
const 酒馆助手检测说明 = computed(() =>
  酒馆助手检测中.value
    ? '正在检测酒馆助手及官方最新版本'
    : !酒馆助手版本.value
      ? '未检测到酒馆助手，请安装并启用后刷新页面'
      : 酒馆助手最新版本查询失败.value
        ? `检测到 ${酒馆助手版本.value}；暂时无法查询官方最新版本，可继续游戏`
        : 酒馆助手为最新版.value
          ? `检测到 ${酒馆助手版本.value}，已是官方最新版本`
          : `检测到 ${酒馆助手版本.value}；官方最新版本为 ${酒馆助手最新版本.value}，建议更新（不影响开始游戏）`,
);

const 数据库准备完成 = computed(() => 数据库检测.value.已安装 && 数据库检测.value.已装游戏模板);
const 首次准备完成 = computed(() => 酒馆助手已安装.value && 数据库准备完成.value);

async function 查询酒馆助手最新版本() {
  let 最后错误: unknown;
  for (const 地址 of 酒馆助手版本清单地址) {
    try {
      const response = await fetch(`${地址}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = (await response.json()) as { version?: unknown };
      if (typeof manifest.version !== 'string' || !manifest.version.match(/\d+(?:\.\d+){1,3}/)) {
        throw new Error('版本清单缺少有效 version');
      }
      return manifest.version;
    } catch (error) {
      最后错误 = error;
    }
  }
  throw 最后错误 ?? new Error('无法读取版本清单');
}

async function 刷新酒馆助手检测() {
  酒馆助手检测中.value = true;
  酒馆助手最新版本.value = '';
  酒馆助手最新版本查询失败.value = false;
  try {
    const 版本 = await getTavernHelperVersion();
    酒馆助手版本.value = typeof 版本 === 'string' ? 版本 : '';
  } catch (error) {
    酒馆助手版本.value = '';
    console.warn('[人妻公寓] 无法读取酒馆助手版本', error);
  }
  try {
    酒馆助手最新版本.value = await 查询酒馆助手最新版本();
  } catch (error) {
    酒馆助手最新版本查询失败.value = true;
    console.warn('[人妻公寓] 无法查询酒馆助手官方最新版本', error);
  }
  酒馆助手检测中.value = false;
}

function 刷新数据库检测() {
  数据库检测.value = 数据库状态();
}

function 刷新全部检测() {
  刷新数据库检测();
  void 刷新酒馆助手检测();
}

function 打开首次说明() {
  刷新全部检测();
  首次说明开.value = true;
}

function 完成首次说明() {
  try {
    localStorage.setItem(首次说明存储键, '1');
  } catch {
    /* 隐私模式下本次关闭仍然有效，下次刷新重新提示。 */
  }
  首次说明开.value = false;
}

async function 从说明安装数据库模板() {
  刷新数据库检测();
  if (!数据库检测.value.已安装) {
    弹提示('未检测到数据库插件。安装并刷新酒馆后，再回来重新检测。', 5000);
    return;
  }
  const 宿主 = window.parent ?? window;
  if (!宿主.confirm('将《人妻公寓》的四张 RQ_ 表合并到当前聊天，并保留其他作者的表与已有数据。确定继续吗？')) return;
  安装模板中.value = true;
  try {
    const result = await 安装人妻公寓数据库模板();
    刷新数据库检测();
    宿主.alert(result.message || (result.success ? '人妻公寓数据库表安装完成。' : '数据库表安装失败。'));
  } catch (error) {
    宿主.alert(`数据库表安装失败：${error instanceof Error ? error.message : String(error)}`);
  } finally {
    安装模板中.value = false;
  }
}

async function 从说明应用数据库填表兼容设置() {
  刷新数据库检测();
  const 当前值 = 数据库检测.value.填表最短回复;
  if (当前值 === null || 当前值 <= 0 || !数据库检测.value.可设置填表参数) {
    弹提示('当前状态不支持一键修改，请打开数据库设置手动确认。', 5000);
    return;
  }
  const 宿主 = window.parent ?? window;
  if (
    !宿主.confirm(
      `这会把数据库插件的全局“AI 回复最小长度”从 ${当前值} 设为 0，影响所有角色卡和聊天。\n\n` +
        '数据库当前也用这个值决定短正文是否跳过自动填表；设为 0 后，其他角色卡的短正文可能增加填表请求。\n\n' +
        '本操作只修改这一项，不修改模型、密钥、SQLite、表格、更新频率或重试次数。确定继续吗？',
    )
  )
    return;
  调整填表设置中.value = true;
  try {
    const result = await 应用数据库填表兼容设置();
    刷新数据库检测();
    宿主.alert(result.message);
  } finally {
    调整填表设置中.value = false;
  }
}

async function 从说明打开数据库设置() {
  const ok = await 打开数据库设置();
  if (!ok) {
    (window.parent ?? window).alert(
      '当前数据库版本没有开放设置入口。请直接打开数据库插件；SQLite 在存储模式中开启，填表参数位于“填表工作台 → 自动更新设置 → 高级参数”。',
    );
  }
}

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
/** 未使用 MVU 外置解析时，是否让当前正文模型追加一次只输出变量块的静默结算。 */
const 二次变量结算 = ref(false);
const MVU解析 = ref<MVU解析状态>(读取MVU解析状态());
let MVU解析刷新timer: ReturnType<typeof setInterval> | undefined;

const 字号档表: Record<'小' | '中' | '大', string> = { 小: '0.82em', 中: '0.9em', 大: '1.02em' };

/** 主题「跟随」时按游戏时段推日夜(晚上/深夜=暗) */
const 时段偏暗 = computed(() => 时段.value === '晚上' || 时段.value === '深夜');

// 主题结算全响应式：挂载恢复、切档或显式世界时段更新后，跟随模式同步日夜配色。
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
  const 最新MVU解析 = 读取MVU解析状态();
  MVU解析.value = 最新MVU解析;
  if (最新MVU解析.外置模式) 二次变量结算.value = false;
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
        二次变量结算: 二次变量结算.value,
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

/** 设置页与回合引擎都以 MVU 的真实更新方式为准，不允许两条变量路线同时开启。 */
function 刷新MVU解析状态() {
  const 最新 = 读取MVU解析状态();
  MVU解析.value = 最新;
  if (!最新.外置模式 || !二次变量结算.value) return;
  二次变量结算.value = false;
  持久化设置();
}

function 切换二次变量结算() {
  刷新MVU解析状态();
  if (MVU解析.value.外置模式) {
    二次变量结算.value = false;
    持久化设置();
    return;
  }
  二次变量结算.value = !二次变量结算.value;
  改设置();
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
      if (typeof s.二次变量结算 === 'boolean') 二次变量结算.value = s.二次变量结算;
    } else {
      主题模式.value = localStorage.getItem(主题存储键) === '1' ? '夜间' : '日间';
    }
  } catch {
    /* 读不到就用默认 */
  }
  刷新MVU解析状态();
  应用界面偏好();
}

// ── 重开一局(两段式确认;真重置在脚本侧:删楼+清过程变量,完成后 iframe 自刷回标题屏) ──

const 重开确认 = ref(false);

// 弹窗一关就撤销"待确认"武装态,防下次误触
watch(设置开, 开 => {
  clearInterval(MVU解析刷新timer);
  MVU解析刷新timer = undefined;
  if (开) {
    刷新MVU解析状态();
    // MVU 没有公开设置变更事件；仅在设置页可见时轻量刷新，关闭后不常驻轮询。
    MVU解析刷新timer = setInterval(刷新MVU解析状态, 1500);
  } else {
    重开确认.value = false;
  }
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

function 重置偏好() {
  主题模式.value = '日间';
  字号档.value = '中';
  正文字色.value = '';
  垫板浓度.value = 0.66;
  省流.value = false;
  减动效.value = false;
  立绘显示.value = true;
  二次变量结算.value = false;
  try {
    localStorage.removeItem(设置存储键);
    localStorage.removeItem(主题存储键);
  } catch {
    /* ignore */
  }
  刷新MVU解析状态();
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
  移动端媒体.addEventListener('change', 同步移动端断点);
  eventOn('global_Mvu_initialized', 刷新MVU解析状态);
  读取CG解锁();
  void 刷新酒馆助手检测();
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
  window.addEventListener('blur', 静音会议窗口失焦);

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
  eventOn('人妻公寓:回合完成', async () => {
    停止生成计时();
    try {
      待重试行动.value = '';
      失败行动.value = '';
      取消后自动重试.value = false;
      流式段.value = [];
      录像带本地结果.value = '';
      clearTimeout(录像带连点timer);
      录像带连点计数.value = 0;
      录像带连点开始 = 0;
      if (静音会议待散会选择.value) 静音会议会后选择.value = [];
      同步场景自变量(); // 回档把 _场景 清空后 UI 必须跟着回楼道(审计 C2)
      幕房间.value = 当前房间.value; // 本轮的戏与选项绑定产出场景,换地方即收
      // 先同步消息历史，再刷新 MVU；时间事务必须等新时钟真正 pull 完成后才能重新点按钮。
      await 取卷轴();
      刷新可重掷();
      刷赴约();
      刷新在场();
      刷新行动选项();
      刷新偷窥待选();
      try {
        await Promise.resolve((store as unknown as { pull?: () => void | Promise<void> }).pull?.());
      } catch {
        /* store 未带 pull 时靠轮询兜底 */
      }
      await nextTick();
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
    幕房间.value = 当前房间.value;
    await 取卷轴();
    刷新可重掷();
    刷赴约();
    刷新在场();
    刷新偷窥待选();
    try {
      (store as unknown as { pull?: () => void }).pull?.();
    } catch {
      /* store 未带 pull 时靠轮询兜底 */
    }
  });
  eventOn('人妻公寓:回合失败', (原因: string) => {
    发送中.value = false;
    运行阶段.value = '';
    停止生成计时();
    释放静音会议指针();
    清理静音会议连点();
    if (静音会议互动待操作.value) {
      静音会议互动结果.value = undefined;
      静音会议本地画面状态.value = '';
    }
    同步场景自变量(); // 监控回合失败时脚本已把 _场景 回滚,画面跟着回原位(审计 C4)
    const 待重试 = 待重试行动.value.trim();
    const 将自动重试 = 取消后自动重试.value && !!待重试;
    if (静音会议正式中.value && 静音会议场景.value.阶段.includes('自由') && !将自动重试) {
      // 自由循环失败后重新交还“继续/结束”选择权；主动“放弃并重试”则保留闩锁，
      // 让下一个事件循环可以直接重发同一行动。
      静音会议继续已选.value = false;
      静音会议自由行动进行中.value = false;
    }
    if (待重试) 失败行动.value = 待重试;
    待重试行动.value = '';
    流式段.value = [];
    偷窥待选.value = null; // 偷窥回合没演成,挂起的选择卡一并作废(脚本侧同步清账)
    // 回合失败=这一轮没发生,是提示不是事故——走可消散 toast,不占常驻错误横幅(2026-07-17 用户反馈)
    if (!原因.startsWith('已取消')) 弹提示(`回合失败,这一轮没有发生:${原因}`, 6000);
    void 取卷轴();
    刷新可重掷();
    if (将自动重试) {
      取消后自动重试.value = false;
      // 回合引擎在发出失败事件后的 finally 才释放内部锁，下一事件循环再重发。
      setTimeout(() => {
        失败行动.value = '';
        发出(待重试);
      }, 0);
    } else {
      取消后自动重试.value = false;
    }
  });
  eventOn('人妻公寓:已重开', () => {
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
    if (静音会议筹备提交中.value) {
      静音会议筹备提交中.value = false;
      if (静音会议场景.value.阶段 === '筹备') 静音会议筹备步骤.value = '选择';
      else if (!静音会议中.value) 静音会议筹备步骤.value = '';
    } else if (静音会议筹备步骤.value && !静音会议中.value) {
      clearTimeout(静音会议筹备timer);
      静音会议筹备步骤.value = '';
    }
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

  // 恢复场景(刷新页面/重开酒馆后仍在原房间)
  const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as 场景聊天状态 | null;
  当前房间.value = 场景?.房间id ?? null;
  已破门进入.value = !!场景?.非法进入;
  本次入房由头已用.value = !!场景?.由头已用;
  幕房间.value = 当前房间.value; // 刷新恢复:已有正文与选项视为当前场景的
  try {
    进房末楼.value = 场景?.进房末楼 ?? getLastMessageId();
  } catch {
    进房末楼.value = 0;
    本次入房由头已用.value = false;
  }
  刷赴约();
  同步静音会议界面();

  // 恢复界面偏好(主题三档/字号/垫板/省流/减动效)
  恢复设置();

  // rq0.34 首次准备说明：只在序章自动出现；明确点“我已看完”后记住。
  // 使用版本化键，保证从旧版升级的玩家也能看到新增的数据库模板步骤。
  if (!data.value?.系统?._序章完成) {
    try {
      if (localStorage.getItem(首次说明存储键) !== '1') setTimeout(打开首次说明, 0);
    } catch {
      setTimeout(打开首次说明, 0);
    }
  }

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
      真全屏中.value = 开;
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
  移动端媒体.removeEventListener('change', 同步移动端断点);
  clearInterval(MVU解析刷新timer);
  clearInterval(心跳timer);
  clearInterval(生成等待timer);
  clearTimeout(破门计时);
  clearTimeout(提示timer);
  clearTimeout(性爱结果timer);
  clearTimeout(键盘定位timer);
  clearTimeout(录像带连点timer);
  clearTimeout(静音会议筹备timer);
  清理静音会议互动现场();
  window.removeEventListener('blur', 静音会议窗口失焦);
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

.special-interaction-stage {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0d1117;
}

.special-interaction-stage img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.special-interaction-status {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(174, 210, 238, 0.32);
  border-radius: 9px;
  color: #eef7ff;
  background: rgba(5, 12, 20, 0.72);
  backdrop-filter: blur(6px);
  font-size: 0.78em;
  letter-spacing: 0.03em;
}

.special-scene-acts {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.special-scene-acts .tile.frozen {
  filter: grayscale(0.85);
  opacity: 0.48;
  cursor: not-allowed;
}

.special-scene-acts .special-assist {
  grid-column: 1 / -1;
  border-color: rgba(114, 170, 205, 0.6);
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
  position: relative;
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

/* 立绘:每人占一个独立横槽。高度随人数递减，宽度受槽硬约束，素材比例再不同也不会互相遮挡。 */
.portrait {
  position: absolute;
  left: var(--portrait-desktop-left);
  bottom: 0;
  z-index: 1;
  width: var(--portrait-desktop-width);
  height: var(--portrait-desktop-height);
  max-width: none;
  max-height: none;
  transform: none;
  object-fit: contain;
  object-position: center bottom;
  pointer-events: none;
  filter: drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.85)) drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.85))
    drop-shadow(0 8px 20px rgba(20, 24, 40, 0.35));
  transition:
    left 0.35s ease,
    top 0.35s ease,
    width 0.35s ease,
    height 0.35s ease,
    transform 0.35s ease,
    opacity 0.35s ease;
}

/* 单人镜头略偏右，给左侧正文保留呼吸；仍处于自己的 78% 宽槽内。 */
.portrait-count-1 .portrait {
  left: 22%;
  width: 78%;
  height: var(--portrait-desktop-height);
  transform: none;
  object-fit: contain;
  object-position: center bottom;
}

/* 荣耀洞件与背景共用同一张16:9舞台坐标：不能套普通人物槽，否则洞口接触点会随端宽漂移。 */
.portrait-count-1 .portrait.portrait-glory {
  inset: 0;
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

.scribing {
  color: var(--ink-faint);
  font-size: 0.8em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.scribing > span {
  font-family: var(--font-mono);
  color: var(--ink-soft);
}

.scribing .retry-now {
  color: #fff;
  background: linear-gradient(135deg, var(--pink), #8c73ff);
  border-color: transparent;
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
  font: 800 7px/1 var(--font-mono);
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
  font: 800 7px/1 var(--font-mono);
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

.quill {
  flex: none;
  display: flex;
  flex-wrap: wrap;
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

.resource-lock-hint {
  flex-basis: 100%;
  margin: -1px 4px 0;
  color: var(--red);
  font-size: 0.66em;
  line-height: 1.35;
}

.reroll-row {
  flex: none;
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 6px;
}

.failed-reroll {
  align-items: center;
  color: var(--ink-soft);
  font-size: 0.78em;
}

.global-time-advance {
  flex: none;
  width: 100%;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 7px;
  padding: 8px 16px;
  color: #fff;
  background: linear-gradient(135deg, #ef5e9d, #ca4e90 52%, #8c5eb4);
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 15px;
  box-shadow: 0 7px 18px rgba(174, 62, 124, 0.24);
  font-family: inherit;
  cursor: pointer;
}

.global-time-advance .ic {
  width: 28px;
  height: 28px;
}

.global-time-advance span {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.global-time-advance b {
  font-size: 0.91em;
  letter-spacing: 0.1em;
}

.global-time-advance small {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.64em;
}

.global-time-advance:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.global-time-advance:disabled {
  opacity: 0.5;
  cursor: default;
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

.event-prompt-view {
  max-height: min(68vh, 680px);
  margin: 14px 0 0;
  padding: 16px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: color-mix(in srgb, var(--paper) 92%, transparent);
  color: var(--ink);
  font:
    12px/1.65 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.toast {
  position: absolute;
  box-sizing: border-box;
  left: 50%;
  bottom: 70px;
  transform: translateX(-50%);
  z-index: 40;
  width: max-content;
  max-width: calc(100% - 24px);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 79, 154, 0.4);
  border-radius: 14px;
  color: var(--ink);
  font-size: 0.8em;
  font-weight: 600;
  line-height: 1.45;
  padding: 7px 20px;
  text-align: left;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
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
  box-sizing: border-box;
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
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
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

.outing-launch {
  position: absolute;
  z-index: 5;
  left: 50%;
  bottom: max(12px, env(safe-area-inset-bottom));
  width: min(500px, calc(100% - 30px));
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 13px;
  color: #493f4e;
  text-align: left;
  background: linear-gradient(90deg, rgba(255, 248, 237, 0.95), rgba(239, 249, 255, 0.94)), var(--paper-card);
  border: 1px solid rgba(98, 129, 169, 0.34);
  border-radius: 14px;
  box-shadow:
    0 9px 26px rgba(35, 38, 58, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.68);
  transform: translateX(-50%);
  cursor: pointer;
  backdrop-filter: blur(9px);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.outing-launch span {
  display: flex;
  flex: none;
  flex-direction: column;
}

.outing-launch small {
  color: #5b84ac;
  font: 800 7px/1.2 var(--font-mono);
  letter-spacing: 0.14em;
}

.outing-launch b {
  font-size: 0.88em;
  letter-spacing: 0.06em;
}

.outing-launch em {
  flex: 1;
  color: var(--ink-faint);
  font-size: 0.66em;
  font-style: normal;
}

.outing-launch .ic {
  width: 23px;
  height: 23px;
  color: #4f86b6;
}

.outing-launch:hover:not(:disabled) {
  transform: translate(-50%, -3px);
  box-shadow:
    0 13px 32px rgba(35, 38, 58, 0.29),
    0 0 0 2px rgba(82, 149, 206, 0.12);
}

.outing-launch:disabled {
  opacity: 0.46;
  cursor: default;
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

.dossier-battery {
  position: relative;
  display: block;
  height: 14px;
  padding: 2px;
  overflow: visible;
  border: 2px solid rgba(36, 33, 38, 0.28);
  border-radius: 4px;
  background: rgba(36, 33, 38, 0.07);
}

.dossier-battery::after {
  content: '';
  position: absolute;
  top: 3px;
  right: -6px;
  width: 4px;
  height: 6px;
  border-radius: 0 2px 2px 0;
  background: rgba(36, 33, 38, 0.3);
}

.dossier-battery .axis-charge {
  display: block;
  width: var(--level);
  height: 100%;
  border-radius: 1px;
  transform-origin: left center;
  transition: width 0.8s cubic-bezier(0.2, 0.85, 0.25, 1);
}

.dossier-battery .axis-charge.fav {
  background: linear-gradient(90deg, #ffb1cf, var(--pink));
  box-shadow: 0 0 5px rgba(255, 79, 154, 0.24);
}

.dossier-battery .axis-charge.sin {
  background: linear-gradient(90deg, #ffb091, var(--red));
  box-shadow: 0 0 5px rgba(228, 82, 90, 0.22);
}

.dossier-battery .axis-charge.marr {
  background: linear-gradient(90deg, #9cebd7, var(--green));
  box-shadow: 0 0 5px rgba(49, 179, 146, 0.22);
}

.axis-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.axis-top b {
  color: var(--ink-soft);
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

.cg-library {
  width: min(980px, calc(100vw - 28px));
  height: min(820px, calc(100dvh - 28px));
  display: flex;
  flex-direction: column;
}

.cg-library-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 14px 10px;
}

.cg-library-tabs .btn.on {
  color: #fff;
  border-color: var(--pink);
  background: var(--pink);
}

.cg-library-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-content: start;
  gap: 10px;
  overflow-y: auto;
}

.cg-pagination {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 14px 14px;
  color: var(--ink-soft);
  font-size: 0.82em;
  font-variant-numeric: tabular-nums;
}

.cg-pagination .btn:disabled {
  opacity: 0.38;
}

.cg-tile {
  position: relative;
  min-width: 0;
  aspect-ratio: 2 / 3;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  background: rgba(28, 26, 36, 0.92);
  cursor: zoom-in;
}

.cg-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.cg-tile:hover img {
  transform: scale(1.035);
}

.cg-tile.locked {
  cursor: default;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.055), transparent), rgba(28, 26, 36, 0.94);
}

.cg-lock {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  opacity: 0.5;
  filter: grayscale(1);
}

.cg-preview-mask {
  position: fixed;
  z-index: 80;
  padding: 0;
  overflow: hidden;
  border-radius: 0;
  background: rgba(5, 4, 8, 0.94);
}

.cg-preview-scroller {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 18px;
  touch-action: pan-y pinch-zoom;
}

.cg-preview-scroller > img {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 100%;
  flex: 0 0 auto;
  object-fit: contain;
}

.cg-preview-close {
  position: fixed;
  z-index: 81;
  top: 14px;
  right: 14px;
}

@media (max-width: 720px) {
  .cg-preview-scroller {
    align-items: flex-start;
    padding: max(48px, env(safe-area-inset-top)) 0 max(18px, env(safe-area-inset-bottom));
  }

  .cg-preview-scroller > img {
    width: 100%;
    max-width: none;
    max-height: none;
    margin: auto 0;
  }

  .cg-library {
    width: calc(100vw - 12px);
    height: calc(100dvh - 12px);
  }

  .cg-library-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 8px;
  }

  .cg-library-tabs {
    padding-inline: 8px;
  }
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

/* ═══ rq0.34 首次游玩准备：安装清单 + 数据库模板状态 ═══ */

.sheet.setup-sheet {
  width: min(520px, 96%);
  max-height: 94%;
  padding: 17px 18px 15px;
  background: linear-gradient(145deg, rgba(255, 247, 239, 0.94), rgba(245, 250, 255, 0.96)), #fff;
}

.setup-title {
  margin: 3px 0 4px;
  color: var(--ink);
  font-size: 1.16em;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.setup-lead {
  margin: 0 0 10px;
  color: var(--ink-soft);
  font-size: 0.76em;
  line-height: 1.55;
}

.setup-statuses {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 10px;
}

.setup-statuses span {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 7px 8px;
  color: var(--ink-faint);
  background: rgba(36, 33, 38, 0.06);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  font-size: 0.67em;
  font-weight: 800;
  white-space: nowrap;
}

.setup-statuses span i {
  flex: none;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #9b98a2;
  font-style: normal;
}

.setup-statuses span.on {
  color: #287a50;
  background: rgba(69, 190, 126, 0.1);
  border-color: rgba(69, 190, 126, 0.28);
}

.setup-statuses span.on i {
  background: #39a86f;
}

.setup-steps {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.setup-steps li {
  position: relative;
  padding: 9px 10px 9px 44px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(40, 34, 48, 0.05);
}

.setup-steps li.required {
  border-left: 3px solid var(--pink);
}

.setup-steps b {
  display: block;
  color: var(--ink);
  font-size: 0.8em;
  line-height: 1.4;
}

.setup-steps b em {
  position: absolute;
  left: 11px;
  top: 10px;
  width: 23px;
  height: 23px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, var(--pink), #f08e66);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 0.78em;
  font-style: normal;
  box-shadow: 0 3px 8px rgba(255, 79, 154, 0.24);
}

.setup-steps p {
  margin: 3px 0 0;
  color: var(--ink-soft);
  font-size: 0.71em;
  line-height: 1.55;
}

.setup-sql-reminder {
  margin: 8px 0 5px;
  padding: 9px 10px;
  border: 1px solid rgba(219, 112, 52, 0.38);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 237, 202, 0.88), rgba(255, 222, 224, 0.72));
  box-shadow: inset 3px 0 0 #e97f48;
}

.setup-sql-reminder strong {
  display: block;
  color: #9b3f24;
  font-size: 0.75em;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.setup-sql-reminder span {
  display: block;
  margin-top: 3px;
  color: #70453a;
  font-size: 0.68em;
  font-weight: 650;
  line-height: 1.5;
}

.setup-mvu-reminder {
  border-color: rgba(61, 128, 169, 0.36);
  background: linear-gradient(135deg, rgba(220, 242, 255, 0.86), rgba(232, 226, 255, 0.74));
  box-shadow: inset 3px 0 0 #5f8fc5;
}

.setup-mvu-reminder strong {
  color: #315f91;
}

.setup-mvu-reminder span {
  color: #40566f;
}

.setup-steps small {
  display: block;
  margin-top: 6px;
  color: #a45e28;
  font-size: 0.67em;
  line-height: 1.4;
}

.setup-steps small.good {
  color: #287a50;
}

.setup-db-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.setup-db-actions .btn {
  flex: 1;
}

.setup-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 11px;
}

.setup-foot p {
  flex: 1;
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.67em;
  line-height: 1.4;
}

.setup-foot .btn {
  flex: none;
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

.toggle:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.set-group.route-locked .set-label::after {
  content: ' · MVU 已接管';
  color: var(--pink);
  font-size: 0.72em;
  font-weight: 700;
}

.route-hint {
  color: var(--ink);
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

.garbage-pick {
  flex: none;
  display: flex;
  margin-top: 6px;
  padding: 0;
}

.garbage-open {
  width: min(230px, 100%);
  min-height: 68px;
  grid-template-columns: 34px 1fr;
  grid-template-rows: auto auto auto;
  text-align: left;
}

.garbage-open .ic {
  grid-row: 1 / -1;
  width: 30px;
  height: 30px;
}

.garbage-open small {
  color: var(--ink-faint);
  font-size: 0.68em;
}

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
  position: relative;
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
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ware-kind {
  position: absolute;
  top: 3px;
  left: 3px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  color: #fff;
  background: rgba(35, 31, 46, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 7px;
  box-shadow: 0 2px 6px rgba(25, 22, 35, 0.2);
  backdrop-filter: blur(5px);
}

.ware-kind :deep(.ic) {
  width: 13px;
  height: 13px;
}

.ware-kind-label {
  display: inline-block;
  padding: 1px 5px;
  margin-left: 5px;
  font-size: 0.68em;
  font-style: normal;
  font-weight: 700;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 999px;
}

.ware-card.ware-product {
  border-left: 3px solid #d5a86f;
}

.ware-card.ware-product .ware-pic,
.ware-card.ware-action .ware-pic {
  background: linear-gradient(155deg, #fffaf3, #f5eee5);
}

.ware-card.ware-product .ware-pic img,
.ware-card.ware-action .ware-pic img {
  object-fit: contain;
  padding: 5px;
}

.ware-card.ware-evidence {
  border-left: 3px solid #6e93a9;
  background-image: linear-gradient(90deg, rgba(110, 147, 169, 0.09), transparent 42%);
}

.ware-card.ware-evidence .ware-pic {
  background: linear-gradient(145deg, #efe5cf, #d9c8a8);
  box-shadow: inset 0 0 0 1px rgba(82, 64, 42, 0.12);
}

.ware-card.ware-scene {
  border-left: 3px solid #8c73ff;
  background-image: linear-gradient(90deg, rgba(140, 115, 255, 0.1), transparent 46%);
}

.ware-card.ware-scene .ware-pic {
  border-radius: 7px;
  box-shadow: inset 0 0 0 2px rgba(140, 115, 255, 0.28);
}

.ware-card.ware-action {
  border-left: 3px solid #53a98f;
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

.ware-card.locked {
  opacity: 0.78;
}

.ware-lock {
  display: block;
  margin-top: 4px;
  color: #9a5d50;
  font-size: 0.72em;
  line-height: 1.35;
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

.cam-room {
  box-sizing: border-box;
  flex: none;
  width: 72px;
  height: 46px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 7px;
  filter: saturate(0.72) contrast(1.04);
  box-shadow: 0 2px 8px rgba(25, 24, 34, 0.18);
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

.truth-fragments {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  margin: 2px 0 8px;
}

.truth-fragments span {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 34px;
  font-size: 0.68em;
  font-weight: 700;
  color: #6f5738;
  background: linear-gradient(145deg, #fff9e8, #eadfc4);
  border: 1px solid rgba(129, 96, 55, 0.25);
  box-shadow: 0 2px 7px rgba(78, 58, 36, 0.09);
}

.truth-fragments span:nth-child(odd) {
  transform: rotate(-1deg);
}

.truth-fragments span:nth-child(even) {
  transform: rotate(1deg);
}

.truth-fragments span :deep(.ic) {
  width: 15px;
  height: 15px;
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
  font: 700 0.58em/1.1 var(--font-mono);
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
  font: 700 7px/1 var(--font-mono);
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

/* ═══ 梧桐里主题图标：暖白珐琅底 + 墨色圆角线 + 荧光小点 ═══ */

.ic {
  width: 16px;
  height: 16px;
  overflow: visible;
  vertical-align: -3px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 1px rgba(62, 49, 76, 0.14));
}

.ic .ic-plate {
  fill: rgba(255, 252, 247, 0.72);
  stroke: currentColor;
  stroke-width: 0.55;
  opacity: 0.34;
}

.ic .ic-gem {
  fill: var(--pink);
  stroke: currentColor;
  stroke-width: 1.25;
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

.plaque.setup-entry {
  min-height: 48px;
  background: linear-gradient(90deg, rgba(255, 249, 237, 0.92), rgba(242, 250, 255, 0.92)), rgba(255, 250, 242, 0.9);
  border: 1px solid rgba(255, 212, 124, 0.5);
}

.plaque.setup-entry .pl-main {
  color: #7b5a24;
  font-size: 0.9em;
}

.plaque.setup-entry .pl-sub {
  color: #8c8068;
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

.spot-note.duty {
  background: rgba(42, 111, 151, 0.92);
  color: #fff;
  border-radius: 6px;
  padding: 1px 5px;
  font-weight: 700;
}

.spot-note.duty.overdue {
  background: rgba(192, 57, 43, 0.94);
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

:global(html.rq-dark) .outing-launch {
  color: #f4edf2;
  background: linear-gradient(90deg, rgba(48, 44, 55, 0.95), rgba(39, 47, 61, 0.95));
  border-color: rgba(142, 177, 209, 0.34);
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

:global(html.rq-lite) .title-screen {
  --kv-img: none !important;
}

/* 省流会使用纯 CSS 楼体兜底；夜间必须同步换深卡，否则浅字落在浅玻璃上。 */
:global(html.rq-dark.rq-lite) .map-fallback .bldg-body {
  background: rgba(24, 27, 42, 0.92);
  border-color: rgba(255, 255, 255, 0.14);
}

:global(html.rq-dark.rq-lite) .map-fallback .bfloor {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

:global(html.rq-dark.rq-lite) .map-fallback .bunit,
:global(html.rq-dark.rq-lite) .map-fallback .roof-card,
:global(html.rq-dark.rq-lite) .map-fallback .gunit {
  color: #f5f3fa;
  background: rgba(43, 46, 65, 0.9);
  border-color: rgba(255, 255, 255, 0.12);
}

:global(html.rq-dark.rq-lite) .map-fallback .bunit:hover,
:global(html.rq-dark.rq-lite) .map-fallback .roof-card:hover,
:global(html.rq-dark.rq-lite) .map-fallback .gunit:hover {
  background: rgba(60, 64, 88, 0.96);
}

:global(html.rq-dark.rq-lite) .map-fallback .bunit.here,
:global(html.rq-dark.rq-lite) .map-fallback .roof-card.here,
:global(html.rq-dark.rq-lite) .map-fallback .gunit.here {
  color: #fff;
  background: rgba(142, 64, 105, 0.92);
}

:global(html.rq-dark.rq-lite) .map-fallback .bground {
  background: rgba(20, 23, 36, 0.96);
  border-color: rgba(255, 255, 255, 0.14);
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

:global(html.rq-dark) .sheet.setup-sheet {
  background: linear-gradient(145deg, rgba(49, 43, 50, 0.98), rgba(34, 40, 54, 0.98));
}

:global(html.rq-dark) .setup-steps li,
:global(html.rq-dark) .setup-statuses span {
  background: rgba(255, 255, 255, 0.055);
  border-color: rgba(255, 255, 255, 0.09);
}

:global(html.rq-dark) .setup-statuses span.on {
  background: rgba(69, 190, 126, 0.1);
  border-color: rgba(69, 190, 126, 0.24);
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

:global(html.rq-dark) .a-cell .a-pic {
  background: #343648;
  border-right-color: rgba(255, 255, 255, 0.08);
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
  /* 手机全屏立绘：1~3 人横向独立槽；4~6 人转为两排半身镜头。
     每个 img 的几何盒互不相交，因此不依赖 z-index 或遮挡来制造站位。 */
  :global(html.rqgy-full) .portrait {
    left: var(--portrait-mobile-left);
    top: var(--portrait-mobile-top);
    bottom: auto;
    width: var(--portrait-mobile-width);
    height: var(--portrait-mobile-height);
    transform: none;
    object-fit: contain;
    object-position: center bottom;
    clip-path: inset(0 2px 0 2px);
  }

  :global(html.rqgy-full) .portrait-count-1 .portrait {
    left: 8%;
    top: 0;
    width: 92%;
    height: 100%;
  }

  :global(html.rqgy-full) .portrait-count-1 .portrait.portrait-glory {
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    clip-path: none;
  }

  /* 双人/三人使用同高镜头框：原始透明画布宽度不同也不会把某人缩矮一截。 */
  :global(html.rqgy-full) .portrait-count-2 .portrait,
  :global(html.rqgy-full) .portrait-count-3 .portrait {
    object-fit: cover;
    object-position: center bottom;
  }

  :global(html.rqgy-full) .story-glory {
    --scene-pos: center;
    --scene-size: cover;
  }

  /* 四人以上保留脸和上半身，比六人挤成一条细立绘更容易辨认。 */
  :global(html.rqgy-full) .portraits-many .portrait {
    object-fit: cover;
    object-position: center top;
    clip-path: inset(2px);
    mask-image: linear-gradient(to bottom, #000 82%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, #000 82%, transparent 100%);
  }

  .page {
    padding: 4px 7px 6px;
  }

  .setup-mask {
    padding: 6px;
  }

  .sheet.setup-sheet {
    width: 100%;
    max-height: 98%;
    padding: 13px 11px 11px;
    border-radius: 14px;
  }

  .setup-statuses {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px;
  }

  .setup-statuses span {
    justify-content: center;
    padding: 6px 3px;
    font-size: 0.61em;
  }

  .setup-statuses span i {
    width: 16px;
    height: 16px;
  }

  .setup-steps {
    gap: 5px;
  }

  .setup-steps li {
    padding: 7px 8px 7px 38px;
  }

  .setup-steps b em {
    left: 8px;
    top: 8px;
    width: 21px;
    height: 21px;
  }

  .setup-steps p {
    font-size: 0.68em;
  }

  .setup-foot {
    align-items: stretch;
    flex-direction: column;
    gap: 6px;
  }

  .setup-foot p {
    text-align: center;
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
    font-size: 8px;
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
    font-size: 0.55em;
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
    font-size: 0.64em;
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

  .outing-launch {
    bottom: max(7px, env(safe-area-inset-bottom));
    width: calc(100% - 16px);
    gap: 7px;
    padding: 7px 9px;
  }

  .outing-launch em {
    font-size: 0.58em;
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

  /* 软键盘弹起后把非输入功能收起，配合把宿主 iframe 底边滚入可视区。 */
  .keyboard-open .dock,
  .keyboard-open .global-time-advance,
  .keyboard-open .reroll-row,
  .keyboard-open .scene-acts,
  .keyboard-open .garbage-pick,
  .keyboard-open .option-row,
  .keyboard-open .peep-card {
    display: none;
  }

  .keyboard-open .quill {
    position: fixed;
    z-index: 100;
    left: 8px;
    right: 8px;
    bottom: calc(var(--keyboard-inset, 43vh) + env(safe-area-inset-bottom, 0px) + 6px);
    box-sizing: border-box;
    margin: 0;
    padding: 7px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-card);
    box-shadow: 0 -8px 28px rgba(30, 26, 38, 0.2);
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

  /* 角色档案：手机上让立绘保留存在感，但不挤压仪容道具图。 */
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
/* ═══ 特殊场景：静音会议 ═══ */

.mute-meeting-track {
  position: absolute;
  top: 8px;
  left: 10px;
  right: 50px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  color: rgba(246, 252, 255, 0.9);
  background: linear-gradient(90deg, rgba(6, 16, 25, 0.82), rgba(6, 16, 25, 0.5));
  border: 1px solid rgba(161, 208, 220, 0.34);
  border-radius: 10px;
  backdrop-filter: blur(7px);
  pointer-events: none;
}

.story-wrap.story-mute-meeting .story {
  padding-top: 48px;
}

.mute-meeting-track span,
.mute-meeting-track b {
  flex: none;
  font: 700 0.68em/1.2 var(--font-mono);
  letter-spacing: 0.08em;
}

.mute-meeting-track b {
  color: #83e0b2;
}

.mute-meeting-track em {
  min-width: 0;
  margin-left: auto;
  overflow: hidden;
  font-size: 0.68em;
  font-style: normal;
  color: rgba(246, 252, 255, 0.7);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mute-meeting-visual {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(circle at 50% 48%, rgba(47, 83, 91, 0.3), transparent 58%), #090f14;
}

.mute-meeting-visual::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background: linear-gradient(180deg, rgba(2, 8, 12, 0.12), transparent 55%, rgba(2, 8, 12, 0.28));
}

.mute-meeting-visual.state-DETAIL {
  background-color: #0a1218;
}

.mute-meeting-visual.state-PEAK {
  background: radial-gradient(circle at 50% 58%, rgba(122, 52, 83, 0.22), transparent 58%), #100c13;
}

.mute-meeting-visual.state-DETAIL img,
.mute-meeting-visual.state-PEAK img {
  animation: mute-visual-turn 0.42s ease both;
}

.mute-meeting-visual img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  filter: saturate(0.96) contrast(1.02);
}

.mute-meeting-visual-fallback {
  display: flex;
  width: min(82%, 430px);
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 18px;
  color: rgba(235, 246, 249, 0.72);
  text-align: center;
  background: rgba(19, 32, 39, 0.74);
  border: 1px solid rgba(166, 207, 215, 0.25);
  border-radius: 16px;
}

.mute-meeting-visual-fallback :deep(.ic) {
  width: 34px;
  height: 34px;
  color: #70cfa4;
}

.mute-meeting-visual-fallback b {
  color: #f1f8fa;
}

.mute-meeting-lock-note {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 6px 10px;
  margin: 5px 0;
  font: 700 0.7em/1.35 var(--font-mono);
  color: #456b62;
  background: rgba(105, 194, 159, 0.1);
  border: 1px solid rgba(80, 157, 128, 0.25);
  border-radius: 10px;
}

.mute-meeting-interaction-stage {
  z-index: 12;
  padding: 9px;
  background:
    linear-gradient(rgba(5, 12, 17, 0.86), rgba(5, 12, 17, 0.94)),
    radial-gradient(circle at 50% 12%, rgba(66, 156, 124, 0.28), transparent 58%);
}

.mute-interaction-panel {
  box-sizing: border-box;
  width: min(100%, 700px);
  max-height: calc(100% - 2px);
  padding: 17px;
  overflow: auto;
  color: #eef8f5;
  background: linear-gradient(145deg, rgba(20, 35, 40, 0.96), rgba(10, 20, 27, 0.98));
  border: 1px solid rgba(125, 211, 173, 0.42);
  border-radius: 18px;
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overscroll-behavior: contain;
}

.mute-interaction-panel header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mute-interaction-panel header span {
  display: block;
  margin-bottom: 3px;
  font: 700 0.62em/1.2 var(--font-mono);
  letter-spacing: 0.12em;
  color: #76d8aa;
}

.mute-interaction-panel h3 {
  margin: 0;
  font-size: 1.16em;
  letter-spacing: 0.04em;
}

.mute-interaction-panel header > b {
  flex: none;
  padding: 5px 8px;
  font: 700 0.62em/1 var(--font-mono);
  color: rgba(238, 248, 245, 0.7);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.mute-interaction-copy {
  margin: 9px 0 12px;
  font-size: 0.78em;
  line-height: 1.55;
  color: rgba(231, 245, 241, 0.72);
}

.mute-target-row {
  display: flex;
  justify-content: center;
  gap: 9px;
  margin-bottom: 11px;
}

.mute-target {
  position: relative;
  width: 74px;
  display: grid;
  justify-items: center;
  gap: 3px;
  padding: 7px 5px;
  color: rgba(234, 246, 242, 0.72);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 13px;
  cursor: pointer;
  touch-action: manipulation;
}

.mute-target img,
.mute-target > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  object-fit: cover;
  background: #25343a;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.mute-target b {
  font-size: 0.72em;
}

.mute-target small {
  font: 600 0.58em/1 var(--font-mono);
  color: rgba(234, 246, 242, 0.5);
}

.mute-target.on {
  color: #fff;
  background: rgba(87, 196, 148, 0.14);
  border-color: #67d5a3;
  box-shadow: 0 0 0 2px rgba(103, 213, 163, 0.12);
}

.mute-target.on img,
.mute-target.on > span {
  border-color: #75e0af;
}

.mute-target.pulse {
  animation: mute-target-pulse 0.42s ease both;
}

.mute-target:disabled {
  cursor: default;
  opacity: 0.7;
}

.mute-mode-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 11px;
}

.mute-mode-row button {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  color: rgba(235, 247, 243, 0.75);
  text-align: left;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  cursor: pointer;
  touch-action: manipulation;
}

.mute-mode-row button.on {
  color: #fff;
  background: rgba(194, 102, 151, 0.16);
  border-color: #d47ead;
}

.mute-mode-row b {
  font-size: 0.76em;
}

.mute-mode-row small {
  color: inherit;
  font-size: 0.64em;
  opacity: 0.7;
}

.mute-control-button {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 15px 18px;
  overflow: hidden;
  color: #f6fffb;
  text-align: left;
  background: linear-gradient(135deg, #397d65, #245848);
  border: 1px solid rgba(156, 238, 201, 0.6);
  border-radius: 15px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.mute-control-button.rapid {
  background: linear-gradient(135deg, #88506f, #5f3953);
  border-color: rgba(240, 160, 201, 0.58);
}

.mute-control-button :deep(.ic) {
  position: relative;
  z-index: 1;
  width: 30px;
  height: 30px;
  flex: none;
}

.mute-control-button span {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mute-control-button b {
  font-size: 0.9em;
}

.mute-control-button small {
  color: rgba(246, 255, 251, 0.7);
  font-size: 0.66em;
}

.mute-control-button:disabled {
  cursor: not-allowed;
  filter: grayscale(0.5);
  opacity: 0.46;
}

.hold-progress {
  position: absolute;
  inset: auto 0 0;
  height: 5px;
  background: #9cf1c8;
  transform: scaleX(0);
  transform-origin: left;
}

.mute-control-button.holding .hold-progress {
  animation: mute-hold-progress 2s linear forwards;
}

.mute-interaction-result {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 11px;
  margin-top: 10px;
  font-size: 0.72em;
  border: 1px solid;
  border-radius: 11px;
}

.mute-interaction-result.success {
  color: #baf4d7;
  background: rgba(64, 175, 126, 0.12);
  border-color: rgba(105, 224, 166, 0.38);
}

.mute-interaction-result.failure {
  color: #ffd3d3;
  background: rgba(201, 76, 76, 0.12);
  border-color: rgba(235, 114, 114, 0.36);
}

.mute-interaction-result span {
  color: inherit;
  opacity: 0.78;
}

.mute-interaction-assist {
  width: 100%;
  margin-top: 9px;
}

.mute-after-panel {
  flex: none;
  padding: 11px 13px;
  margin: 7px 0;
  background: linear-gradient(135deg, rgba(244, 252, 248, 0.94), rgba(238, 244, 250, 0.94));
  border: 1px solid rgba(76, 151, 124, 0.25);
  border-radius: 15px;
  box-shadow: 0 5px 16px rgba(31, 54, 49, 0.08);
}

.mute-after-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 9px;
}

.mute-after-heading span {
  font: 700 0.64em/1.2 var(--font-mono);
  letter-spacing: 0.07em;
  color: #4a987a;
}

.mute-after-heading b {
  font-size: 0.84em;
  color: var(--ink);
}

.mute-after-panel > p {
  margin: 6px 0 9px;
  font-size: 0.7em;
  line-height: 1.5;
  color: var(--ink-soft);
}

.mute-after-wives {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.mute-after-wives button {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  color: var(--ink-soft);
  text-align: left;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(54, 89, 80, 0.13);
  border-radius: 11px;
  cursor: pointer;
}

.mute-after-wives button.on {
  color: #296c56;
  background: rgba(100, 210, 162, 0.14);
  border-color: rgba(66, 166, 124, 0.5);
}

.mute-after-wives img,
.mute-after-wives button > span {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  object-fit: cover;
  background: #e8f0ed;
  border-radius: 50%;
}

.mute-after-wives b {
  overflow: hidden;
  font-size: 0.7em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mute-after-wives small {
  font: 600 0.58em/1 var(--font-mono);
}

.mute-after-count {
  margin-top: 7px;
  font-size: 0.66em;
  color: var(--red);
}

.mute-after-count.ready {
  color: #3b8a6d;
}

.mute-free-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mute-free-actions.single {
  grid-template-columns: 1fr;
}

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

:global(html.rq-dark) .mute-after-panel,
:global(html.rq-dark) .mute-confirm-card,
:global(html.rq-dark) .mute-candidate,
:global(html.rq-dark) .mute-topic-grid button {
  background-color: rgba(24, 29, 38, 0.86);
}

:global(html.rq-dark) .mute-meeting-lock-note {
  color: #8ac8ae;
  background: rgba(67, 142, 112, 0.12);
}

:global(html.rq-still) .dock-btn.meeting-live,
:global(html.rq-still) .mute-target.pulse,
:global(html.rq-still) .mute-control-button.holding .hold-progress,
:global(html.rq-still) .mute-meeting-visual img {
  animation: none;
}

@keyframes mute-hold-progress {
  to {
    transform: scaleX(1);
  }
}

@keyframes mute-target-pulse {
  50% {
    transform: translateY(-3px) scale(1.04);
    box-shadow: 0 0 18px rgba(108, 226, 172, 0.5);
  }
}

@keyframes mute-phone-breathe {
  50% {
    color: #147048;
    background: rgba(59, 195, 126, 0.2);
    box-shadow: inset 0 0 0 1px rgba(57, 173, 116, 0.25);
  }
}

@keyframes mute-visual-turn {
  from {
    opacity: 0.28;
    transform: scale(1.018);
  }
}

@media (max-width: 540px) {
  .mute-meeting-track {
    gap: 6px;
    padding: 5px 8px;
  }

  .mute-meeting-track em {
    max-width: 40%;
  }

  .mute-interaction-panel {
    padding: 13px;
    border-radius: 15px;
  }

  .mute-interaction-copy {
    margin-bottom: 9px;
  }

  .mute-target-row {
    gap: 6px;
  }

  .mute-target {
    width: min(27%, 72px);
    padding: 6px 3px;
  }

  .mute-target img,
  .mute-target > span {
    width: 38px;
    height: 38px;
  }

  .mute-control-button {
    padding: 13px 12px;
  }

  .mute-after-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .mute-after-wives {
    grid-template-columns: 1fr;
  }

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

  .mute-prep-footer .btn,
  .mute-free-actions .btn {
    width: 100%;
  }
}
</style>
