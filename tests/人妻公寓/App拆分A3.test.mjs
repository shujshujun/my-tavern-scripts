/* eslint-disable import-x/no-nodejs-modules -- Node-only source regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A3 拆分（设置弹窗/首次准备/useUIPrefs 单例）等价外移，
// 不依赖空格/Prettier 行宽，不把注释当真实 import。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 偏好源码 = readFileSync(new URL('./composables/useUIPrefs.ts', 客户端目录), 'utf8');
const 设置源码 = readFileSync(new URL('./components/设置弹窗.vue', 客户端目录), 'utf8');
const 准备源码 = readFileSync(new URL('./components/首次准备.vue', 客户端目录), 'utf8');
const 标题源码 = readFileSync(new URL('./components/序章标题屏.vue', 客户端目录), 'utf8');
const 地图源码 = readFileSync(new URL('./components/地图.vue', 客户端目录), 'utf8');
const 依赖版本源码 = readFileSync(new URL('../../脚本/游戏逻辑/依赖版本.ts', 客户端目录), 'utf8');

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

test('三个 A3 新文件非空；App 真实导入并以 Latin-first 标签渲染两组件与 composable；新模块不反向导入 App', () => {
  for (const [名, 源码] of [
    ['App.vue', App源码],
    ['composables/useUIPrefs.ts', 偏好源码],
    ['components/设置弹窗.vue', 设置源码],
    ['components/首次准备.vue', 准备源码],
  ]) {
    assert.ok(源码.length > 0, `${名} 应为非空文件`);
  }
  assert.match(App源码, /import SettingsPopup from '\.\/components\/设置弹窗\.vue';/, 'App 应导入设置弹窗');
  assert.match(App源码, /import FirstRunSetup from '\.\/components\/首次准备\.vue';/, 'App 应导入首次准备');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'App 应导入 useUIPrefs');
  assert.match(App源码, /<SettingsPopup\b[\s\S]*?@restart="点重开"[\s\S]*?\/>/, 'App 模板应挂载 SettingsPopup 并接点重开');
  assert.match(
    App源码,
    /<FirstRunSetup\b[\s\S]*?@toast="转发首次准备提示"[\s\S]*?\/>/,
    'App 模板应挂载 FirstRunSetup 并接 toast',
  );
  for (const [名, 源码] of [
    ['useUIPrefs.ts', 偏好源码],
    ['设置弹窗.vue', 设置源码],
    ['首次准备.vue', 准备源码],
  ]) {
    const 依赖 = 提取导入specifier(源码);
    assert.ok(!依赖.some(s => s.includes('App.vue') || s.includes('/App')), `${名} 不得反向导入 App`);
  }
});

test('App 不再内联设置/首次准备大模板与专属状态/检测/解析表单/轮询/CSS；CTA/corner/入口/重开业务仍在 App', () => {
  assert.doesNotMatch(App源码, /<div v-if="设置开" class="mask"/, 'App 不应再内联设置弹窗');
  assert.doesNotMatch(App源码, /<div v-if="首次说明开" class="mask setup-mask"/, 'App 不应再内联首次准备');
  assert.doesNotMatch(App源码, /const 二次变量结算 = ref/, 'App 不应再有二次结算状态');
  assert.doesNotMatch(
    App源码,
    /MVU解析刷新timer|解析API表单|选择解析路线|刷新MVU解析状态|const 解析通道/,
    'App 不应再有 MVU 解析设置实现',
  );
  assert.doesNotMatch(
    App源码,
    /酒馆助手版本|数据库检测 = ref|首次说明存储键|从说明安装数据库模板|安装模板中/,
    'App 不应再有酒馆助手/数据库检测实现',
  );
  assert.doesNotMatch(
    App源码,
    /主题模式 = ref|垫板浓度 = ref|移动端媒体|移动端全屏引导存储键|const 设置存储键|const 主题存储键/,
    'App 不应再有界面偏好/全屏实现',
  );

  assert.match(App源码, /v-if="显示移动端全屏引导"[\s\S]*?class="mobile-fullscreen-cta"/, '移动端全屏 CTA 仍在 App');
  assert.match(App源码, />进入全屏</, 'CTA 进入全屏按钮仍在 App');
  assert.match(App源码, />继续窗口模式</, 'CTA 窗口模式按钮仍在 App');
  assert.match(App源码, /:title="全屏中 \? '退出全屏' : '沉浸全屏'" @click="切换全屏"/, '右上角全屏钮仍在 App');
  assert.match(App源码, /title="设置" @click="设置开 = true"/, '右上角设置钮仍在 App');
  assert.match(App源码, /const 首次说明开 = ref\(false\)/, '首次说明开关仍留 App');
  assert.doesNotMatch(App源码, /class="plaque setup-entry"/, '标题页首次说明入口已迁出 App(A4 到 序章标题屏.vue)');
  assert.match(标题源码, /class="plaque setup-entry" @click="emit\('openSetup'\)"/, '标题页首次说明入口应在 序章标题屏.vue 并 emit openSetup');
  assert.match(App源码, /function 打开首次说明\(\)[\s\S]{0,60}首次说明开\.value = true/, '打开首次说明简化为只置 true');
  assert.match(App源码, /eventEmit\('人妻公寓:重开一局'\)/, '重开业务事件仍在 App');
  assert.match(App源码, /const 重开确认 = ref\(false\)/, '重开武装态仍留 App');
  assert.match(App源码, /function 点重开\(\)/, '点重开仍在 App');
  assert.match(App源码, /watch\(设置开, 开 => \{\s*if \(!开\) 重开确认\.value = false;/, '关闭设置仍撤销武装态');
});

test('useUIPrefs 单例状态/存储键/合并写/容错/CSS 变量与类/跟随/全屏 fallback/可卸载监听/导出进真全屏', () => {
  assert.match(偏好源码, /单例 \?\?= 创建UIPrefs\(options \?\? \{\}\)/, '模块级单例');
  assert.match(偏好源码, /'人妻公寓_夜间模式'/, '夜间模式存储键');
  assert.match(偏好源码, /'人妻公寓_界面偏好'/, '界面偏好存储键');
  assert.match(偏好源码, /'rqgy-mobile-fullscreen-guide-v1'/, '移动端引导存储键');
  assert.match(偏好源码, /JSON\.stringify\(\{\s*\.\.\.已存,/, '持久化必须合并已有对象');
  assert.match(偏好源码, /坏 JSON 当空处理/, '坏 JSON 静默回默认');
  assert.match(偏好源码, /隐私模式等存不了就不记/, '隐私模式异常静默');
  assert.match(偏好源码, /--prose-size/, '--prose-size 仍由 composable 写');
  assert.match(偏好源码, /--entry-veil/, '--entry-veil 仍由 composable 写');
  assert.match(偏好源码, /--prose-ink/, '--prose-ink 仍由 composable 写');
  assert.match(偏好源码, /'rq-dark'/, 'rq-dark 主题类仍由 composable 应用');
  assert.match(偏好源码, /'rq-lite'/, 'rq-lite 省流类仍由 composable 应用');
  assert.match(偏好源码, /'rq-still'/, 'rq-still 减动效类仍由 composable 应用');
  assert.match(偏好源码, /'rqgy-full'/, 'rqgy-full 全屏类仍由 composable 应用');
  assert.match(
    偏好源码,
    /时段偏暗 = computed\(\(\) => options\.timePeriod\?\.value === '晚上' \|\| options\.timePeriod\?\.value === '深夜'\)/,
    '跟随按游戏时段 晚上/深夜 判暗',
  );
  assert.match(偏好源码, /主题模式\.value = 暗色\.value \? '日间' : '夜间'/, '日月快捷钮显式切档');
  assert.match(偏好源码, /requestFullscreen/, '真全屏走 Fullscreen API');
  assert.match(偏好源码, /webkitRequestFullscreen/, 'webkit fallback 保留');
  assert.match(
    偏好源码,
    /reportFullscreenError\?\.\('浏览器拒绝进入全屏，请允许网页全屏后再点一次'\)/,
    '全屏失败文案走错误回调写回 App',
  );
  assert.match(偏好源码, /addEventListener\('change', 同步移动端断点\)/, 'media 监听绑定');
  assert.match(偏好源码, /removeEventListener\('change', 同步移动端断点\)/, 'media 监听可卸载');
  assert.match(偏好源码, /for \(const 事件名 of \['fullscreenchange', 'webkitfullscreenchange'\]\)/, '全屏监听具名绑定');
  assert.match(偏好源码, /document\.removeEventListener\(事件名, 同步真全屏\)/, '全屏监听可卸载');
  assert.match(偏好源码, /if \(已初始化\) return/, '防重复初始化重复绑定');
  assert.match(偏好源码, /进真全屏,/, '导出 进真全屏 供 App 恢复全屏');
  assert.match(偏好源码, /timePeriod\?: Readonly<Ref<string>>/, '时段以 Readonly<Ref<string>> 选项注入');
  // 只拒绝真实业务 import/变量声明/函数调用，不扫注释(文件头边界注释会提及业务字段名)
  assert.doesNotMatch(
    偏好源码,
    /from '\.\.\/\.\.\/\.\.\/MVU解析模式'|const 二次变量结算 = |const 内置变量解析 = |读取MVU解析状态\(|写入MVU设置\(|const 解析通道 = |restartArmed/,
    'composable 不沾染 MVU 业务设置实现',
  );
  assert.doesNotMatch(偏好源码, /s\.二次变量结算|s\.内置变量解析/, '恢复设置只读纯 UI 字段');
});

test('设置组件拥有全部可见设置文案、UI prefs 共享、MVU 外置默认/通道/API 表单/1500ms 轮询与卸载、重开 emit', () => {
  assert.match(设置源码, /看着舒服最要紧/, '标题文案保持');
  assert.match(设置源码, /跟随时段/, '跟随时段文案保持');
  assert.match(设置源码, /正文字色/, '字色组保持');
  assert.match(设置源码, /立绘显示/, '立绘组保持');
  assert.match(设置源码, /省流模式/, '省流组保持');
  assert.match(设置源码, /减少动效/, '减动效组保持');
  assert.match(设置源码, /useUIPrefs\(\)/, '组件直接共享 useUIPrefs 单例');
  assert.match(设置源码, /主题模式 = m/, 'UI refs 在组件内直接可写');
  assert.match(设置源码, /变量解析：外置模型（默认）/, '只读外置状态说明保持');
  assert.match(设置源码, /正文负责故事，独立模型负责变量/, '新手解释保持');
  assert.match(设置源码, /恢复外置解析/, '恢复外置解析按钮保持');
  assert.match(设置源码, /内置变量解析/, '内置解析开关保持');
  assert.match(设置源码, /解析模型通道/, '通道组保持');
  assert.match(设置源码, /自定义模型/, '自定义通道保持');
  assert.match(设置源码, /mvu-api-form/, '自定义 API 表单保持');
  assert.match(设置源码, /点击「保存并启用」后写入 MVU 变量框架的「额外模型解析配置」/, 'API 表单提示保持');
  assert.match(设置源码, /setInterval\(刷新MVU解析状态, 1500\)/, '1500ms 轮询在组件');
  assert.match(设置源码, /clearInterval\(MVU解析刷新timer\)/, '关闭/卸载清轮询');
  assert.match(设置源码, /JSON\.stringify\(\{\s*\.\.\.已存,/, '解析字段持久化合并写');
  assert.match(设置源码, /内置变量解析: 内置变量解析\.value,/, '合并写包含内置解析');
  assert.match(设置源码, /from '\.\.\/\.\.\/\.\.\/MVU解析模式'/, '组件从 MVU解析模式 正确相对路径导入');
  assert.match(设置源码, /from '\.\.\/composables\/useUIPrefs'/, '组件从 composables 导入共享单例');
  assert.match(设置源码, /defineEmits<\{ restart: \[\] \}>/, '仅 emit restart');
  assert.match(设置源码, /emit\('restart'\)/, '重开只 emit restart');
  assert.doesNotMatch(设置源码, /随AI输出/, '正文随AI输出路线已移除');
  assert.doesNotMatch(设置源码, /二次变量结算/, '二次结算控件与状态已移除');
  assert.doesNotMatch(设置源码, /route-locked|route-hint/, '二次结算专属样式已移除');
  assert.doesNotMatch(设置源码, /eventEmit/, '组件不发业务事件');
  assert.doesNotMatch(设置源码, /props\./, '组件不直接改 props');
});

test('首次准备组件拥有新手向导模板、三准备项、渐进披露、始终可关闭、双 manifest URL/no-store、confirm、storage key、完成门控与 toast', () => {
  assert.match(准备源码, /开始前准备一下/, '小白标题保持');
  assert.match(准备源码, /按顺序完成 3 项即可开始/, 'lead 保持');
  assert.doesNotMatch(准备源码, /FIRST RUN/, '默认首屏无英文眉题');
  assert.match(准备源码, /酒馆助手/, '酒馆助手状态项保持');
  assert.match(准备源码, /游戏提示词/, '游戏提示词状态项保持');
  assert.match(准备源码, /长期记忆/, '长期记忆状态项保持');
  assert.match(准备源码, /<ol class="setup-steps">/, '当前任务渐进披露结构保持');
  assert.match(准备源码, /<template v-if="!酒馆助手已安装">/, '缺酒馆助手分支保持');
  assert.match(准备源码, /<template v-else-if="!提示词已确认">/, '提示词确认分支保持');
  assert.match(准备源码, /<template v-else-if="!数据库检测\.已安装">/, '缺数据库插件分支保持');
  assert.match(准备源码, /<template v-else-if="!数据库检测\.已装游戏模板">/, '缺游戏模板分支保持');
  assert.match(准备源码, /class="setup-confirm"/, '提示词勾选确认操作保持');
  assert.match(准备源码, /一键安装游戏记忆/, '模板安装主按钮保持');
  assert.match(准备源码, /稍后处理/, '稍后处理入口保持');
  assert.match(准备源码, /<details class="setup-advanced">/, '折叠高级区保持');
  assert.match(准备源码, /遇到问题？高级检查/, '高级区标题保持');
  assert.match(准备源码, /SQLite（SQL）/, 'SQLite 提醒保持(在高级区)');
  assert.match(准备源码, /游戏无法代替你自动切换/, 'SQLite 手动切换提醒保持');
  assert.match(准备源码, /游戏默认使用外置模型解析，正文只负责故事/, '外置解析一句保持');
  assert.match(准备源码, /五张游戏记忆表/, '五表诊断保持(在高级区)');
  assert.match(准备源码, /脚本心跳/, '脚本心跳诊断保持');
  assert.match(依赖版本源码, /N0VI028\/JS-Slash-Runner\/main\/manifest\.json/, '官方 manifest URL 保持');
  assert.match(
    依赖版本源码,
    /fastly\.jsdelivr\.net\/gh\/N0VI028\/JS-Slash-Runner@main\/manifest\.json/,
    '镜像 manifest URL 保持',
  );
  assert.match(依赖版本源码, /cache: 'no-store'/, '版本检测 no-store 保持');
  assert.match(准备源码, /compare\(当前版本, 最新版本, '>='\)/, '版本 compare 保持');
  assert.match(准备源码, /'人妻公寓_首次游玩说明_database_sql_mode_20260803'/, '版本化 storage key 保持');
  assert.match(准备源码, /'人妻公寓_提示词已确认_20260808'/, '提示词确认持久化键保持');
  assert.match(准备源码, /confirm\('将《人妻公寓》的五张游戏记忆表应用到当前聊天/, '安装模板 confirm 保持');
  assert.match(准备源码, /宿主\.alert\(result\.message/, '安装结果 alert 保持');
  assert.match(准备源码, /这会把数据库插件的全局“AI 回复最小长度”从/, '全局最短回复 confirm 保持');
  assert.match(准备源码, /const 首次准备完成 = computed/, '完成判定在组件');
  assert.match(
    准备源码,
    /酒馆助手已安装\.value && 提示词已确认\.value && 数据库准备完成\.value/,
    '完成=酒馆助手已装且提示词已确认且数据库就绪',
  );
  // 默认首屏(折叠高级区之前)不得出现开发术语与诊断细节。
  const 模板段 = 准备源码.slice(准备源码.indexOf('<template>'), 准备源码.indexOf('</template>'));
  const 首屏段 = 模板段.slice(0, 模板段.indexOf('<details'));
  assert.doesNotMatch(首屏段, /RQ_|DDL|callAI|SQLite|FIRST RUN|运行环境|setup-sql-reminder/, '默认首屏无开发术语');
  assert.match(准备源码, /emit\('toast'/, '轻提示 emit toast');
  assert.match(准备源码, /emit\('update:open'/, '开关 emit update:open');
  assert.match(准备源码, /v-if="open"/, '内部 v-if=open 展示');
  assert.match(准备源码, /:disabled="!首次准备完成"/, '完成按钮门控保持');
  assert.match(准备源码, /完成，回到首页/, '完成按钮文案保持');
  assert.match(
    准备源码,
    /function 完成首次说明\(\)[\s\S]{0,140}if \(!首次准备完成\.value\) return;/,
    '完成函数级门控：未完成时任何调用都不得写完成键',
  );
  assert.match(准备源码, /aria-label="关闭（稍后处理）"/, '✕ 关闭按钮有中文 aria-label');
  assert.match(
    准备源码,
    /\.setup-statuses span \{[\s\S]{0,120}font-size: 0\.8em/,
    '移动端状态项字号提升到 0.8em',
  );
  assert.match(准备源码, /from '\.\.\/\.\.\/\.\.\/脚本\/游戏逻辑\/数据库桥'/, '组件从数据库桥正确相对路径导入');
  assert.match(准备源码, /from 'compare-versions'/, '组件自行导入 compare-versions');
  assert.match(App源码, /v-model:open="首次说明开"/, 'App 用 v-model 接首次说明开关');
  assert.match(App源码, /:auto-open="就绪 && !data\.系统\._序章完成"/, 'App 传 autoOpen');
  assert.match(App源码, /:script-alive="脚本存活"/, 'App 传脚本心跳');
  assert.match(App源码, /function 转发首次准备提示/, 'App 转发 toast');
});

test('两组件以 scoped src 用弹窗基础.css；专属 CSS 所有权正确；App 保留基础 .btn.ghost/通用弹窗/mobile CTA/corner CSS', () => {
  for (const [名, 源码] of [
    ['设置弹窗.vue', 设置源码],
    ['首次准备.vue', 准备源码],
  ]) {
    assert.match(源码, /<style scoped src="\.\/弹窗基础\.css"><\/style>/, `${名} 应以 scoped src 用基础 CSS`);
  }

  assert.doesNotMatch(App源码, /\.sheet\.settings|\.set-title|\.set-group|\.set-label|\.set-hint/, 'App 不应再有设置 CSS');
  assert.doesNotMatch(
    App源码,
    /\.sheet\.setup-sheet|\.setup-title|\.setup-statuses|\.setup-steps|\.setup-foot|\.setup-db-actions|\.setup-sql-reminder|\.setup-mvu-reminder/,
    'App 不应再有首次准备 CSS',
  );
  assert.doesNotMatch(
    App源码,
    /\.seg \{|\.set-range|\.mvu-api-form|\.mvu-api-nums|\.toggle \{|\.route-locked|\.route-hint|\.set-danger/,
    'App 不应再有设置控件 CSS',
  );
  assert.doesNotMatch(App源码, /\.ink-row|\.ink-pick/, 'App 不应再有字色选择 CSS');
  assert.doesNotMatch(App源码, /\.btn\.ghost\.restart/, 'App 不应再有重开武装 CSS');
  assert.doesNotMatch(App源码, /:global\(html\.rq-dark\) \.sheet\.setup-sheet/, 'App 不应再持有 dark setup 规则');
  assert.doesNotMatch(App源码, /\.setup-mask \{/, 'App 不应再持有移动端 setup 规则');
  assert.doesNotMatch(App源码, /:global\(html\.rq-dark\) \.seg|:global\(html\.rq-dark\) \.toggle/, 'App 不应再持有 dark seg/toggle 规则');

  assert.match(设置源码, /\.sheet\.settings \{/, '设置 CSS 应到 设置弹窗.vue');
  assert.match(设置源码, /\.set-group \{/, 'set-group 应到 设置弹窗.vue');
  assert.match(设置源码, /\.seg \{/, 'seg 应到 设置弹窗.vue');
  assert.match(设置源码, /\.toggle \{/, 'toggle 应到 设置弹窗.vue');
  assert.match(设置源码, /\.mvu-api-form \{/, 'API 表单 CSS 应到 设置弹窗.vue');
  assert.match(设置源码, /\.ink-row \{/, '字色行应到 设置弹窗.vue');
  assert.match(设置源码, /\.btn\.ghost\.restart\.armed/, '重开武装 CSS 应到 设置弹窗.vue');
  assert.match(设置源码, /:global\(html\.rq-dark\) \.seg \{/, 'dark seg 应到 设置弹窗.vue');
  assert.match(
    设置源码,
    /\.seg button\.on \{[\s\S]{0,100}background: var\(--field-bg\);/,
    'seg.on 由日夜语义令牌统一着色',
  );
  assert.doesNotMatch(
    设置源码,
    /:global\(html\.rq-dark\) \.seg button\.on \{/,
    'dark seg.on 不再复制局部颜色',
  );
  assert.match(设置源码, /:global\(html\.rq-dark\) \.toggle \{/, 'dark toggle 应到 设置弹窗.vue');
  assert.match(准备源码, /\.sheet\.setup-sheet \{/, 'setup sheet 应到 首次准备.vue');
  assert.match(准备源码, /\.setup-statuses \{/, 'statuses 应到 首次准备.vue');
  assert.match(准备源码, /\.setup-advanced \{/, '高级折叠区应到 首次准备.vue');
  assert.match(准备源码, /\.setup-advanced \.setup-db-actions \{\s*flex-wrap: wrap;/, '高级区动作容器允许换行');
  assert.match(准备源码, /\.setup-advanced \.btn\.mini\.rite \{\s*flex: 1 1 100%;/, '修复按钮空间不足时独占一行');
  assert.doesNotMatch(准备源码, /^\.setup-db-actions \{[\s\S]{0,60}flex-wrap/m, '任务区动作容器保持单行不换行');
  assert.match(准备源码, /:global\(html\.rq-dark\) \.setup-statuses span\.on \{\s*color: #6fce9b;/, '夜间完成态文字用浅绿色');
  assert.match(准备源码, /\.setup-statuses span\.on \{\s*color: #287a50;/, '日间完成态文字保持');
  assert.match(准备源码, /\.setup-statuses span\.on i \{\s*background: #39a86f;/, '完成态图标背景保持');
  assert.match(准备源码, /:global\(html\.rq-dark\) \.setup-steps li/, 'dark setup 应到 首次准备.vue');
  assert.match(准备源码, /@media \(max-width: 540px\)/, '移动端 setup 应到 首次准备.vue');
  assert.match(准备源码, /\.setup-mask \{/, '移动端 setup-mask 应到 首次准备.vue');

  assert.match(App源码, /^\.btn\.ghost \{/m, '基础 .btn.ghost 留 App(标题屏返回钮)');
  assert.match(App源码, /^\.mask \{/m, 'App 通用 .mask 仍存在');
  assert.match(App源码, /^\.sheet \{/m, 'App 通用 .sheet 仍存在');
  assert.match(App源码, /^\.btn \{/m, 'App 通用 .btn 仍存在');
  assert.match(App源码, /^\.ui-kicker \{/m, 'App 通用 .ui-kicker 仍存在');
  assert.match(App源码, /\.mobile-fullscreen-cta \{/, '移动端 CTA CSS 留 App');
  assert.match(App源码, /\.corner-btns/, 'corner 按钮 CSS 留 App');
  assert.doesNotMatch(App源码, /\.plaque\.setup-entry/, '标题页首次说明入口 CSS 已迁出 App(A4 到 序章标题屏.vue)');
  assert.match(标题源码, /\.plaque\.setup-entry \{/, '标题页首次说明入口 CSS 应在 序章标题屏.vue');
  assert.match(App源码, /:global\(html\.rq-dark\) \.sheet \{/, 'App 通用 dark sheet 仍存在');
});

test('App 其他消费者仍获得 省流/立绘显示/移动端/暗色/全屏中/进真全屏；正文隐藏仍在 App；无中文首字符组件 tag', () => {
  assert.match(地图源码, /const 用画布地图 = computed\(\(\) => !props\.lite && !立面失效\.value\)/, '省流被地图消费(A6a 迁入地图组件)');
  assert.match(App源码, /v-if="立绘显示 && !显示成人CG/, '立绘显示被舞台消费');
  assert.match(App源码, /v-if="移动端 && 数据库运行文案"/, '移动端被数据库横幅消费');
  assert.match(App源码, /:title="暗色 \? '切回日间模式' : '切换夜间模式'" @click="切换主题"/, '暗色被主题钮消费');
  assert.match(App源码, /v-if="显示移动端全屏引导"/, '显示移动端全屏引导被 CTA 消费');
  assert.match(App源码, /await 进真全屏\(\)/, '进真全屏被恢复全屏消费');
  assert.match(App源码, /const 正文隐藏 = ref\(false\)/, '正文隐藏仍留 App');
  // 只查模板段：脚本里的 TS 泛型(computed<风闻账视图>)不参与组件 tag 判定
  const 模板段 = App源码.slice(App源码.indexOf('<template>'), App源码.indexOf('</template>'));
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
});
