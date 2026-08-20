/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A7a 拆分（特殊场景录像带 → composables/useVideoTape.ts、
// components/录像带舞台.vue、components/录像带操作.vue）等价外移，不依赖空格/Prettier 行宽。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const composable源码 = readFileSync(new URL('./composables/useVideoTape.ts', 客户端目录), 'utf8');
const 舞台源码 = readFileSync(new URL('./components/录像带舞台.vue', 客户端目录), 'utf8');
const 操作源码 = readFileSync(new URL('./components/录像带操作.vue', 客户端目录), 'utf8');
const 互动源码 = readFileSync(new URL('./components/静音会议互动.vue', 客户端目录), 'utf8');
const 正文卷轴源码 = readFileSync(new URL('./components/正文卷轴.vue', 客户端目录), 'utf8');
const 行动选项源码 = readFileSync(new URL('./components/行动选项.vue', 客户端目录), 'utf8');
const 回合输入源码 = readFileSync(new URL('./components/回合输入.vue', 客户端目录), 'utf8');
const 抽屉源码 = readFileSync(new URL('./components/房内操作抽屉.vue', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('三新文件非空；App 真实导入并调用 composable、挂载两个 Latin-first 组件；新模块无反向依赖', () => {
  assert.ok(composable源码.length > 0, 'useVideoTape.ts 应为非空文件');
  assert.ok(舞台源码.length > 0, '录像带舞台.vue 应为非空文件');
  assert.ok(操作源码.length > 0, '录像带操作.vue 应为非空文件');
  assert.match(App源码, /import VideoTapeStage from '\.\/components\/录像带舞台\.vue';/, 'App 应导入 录像带舞台.vue');
  assert.match(App源码, /import VideoTapeControls from '\.\/components\/录像带操作\.vue';/, 'App 应导入 录像带操作.vue');
  assert.match(App源码, /import \{ useVideoTape \} from '\.\/composables\/useVideoTape';/, 'App 应导入 useVideoTape');
  assert.match(App源码, /useVideoTape\(\{/, 'App 应在 setup 调用 useVideoTape');
  const 模板段 = 提取模板(App源码);
  assert.match(模板段, /<VideoTapeStage\b[\s\S]*?\/>/, 'App 模板应以 Latin-first 标签挂载 录像带舞台');
  assert.match(模板段, /<VideoTapeControls\b[\s\S]*?\/>/, 'App 模板应以 Latin-first 标签挂载 录像带操作');
  for (const 源 of [composable源码, 舞台源码, 操作源码]) {
    const 依赖 = 提取导入specifier(源);
    assert.ok(!依赖.some(s => s.includes('App.vue') || s === './App' || s === '../App'), '新模块不得反向导入 App');
    assert.ok(!依赖.some(s => s.includes('store')), '新模块不得导入 store');
  }
  assert.doesNotMatch(composable源码, /eventEmit\(|eventOn\(/, 'composable 不直连事件总线');
  assert.doesNotMatch(舞台源码, /eventEmit\(|eventOn\(/, '舞台组件不直连事件总线');
  assert.doesNotMatch(操作源码, /eventEmit\(|eventOn\(/, '操作组件不直连事件总线');
});

test('App 不再持有录像带局部状态机/计时器/提交/连点/补偿函数与内联模板；composable 持有完整 API；App 只留使用录像带 wrapper', () => {
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /class="special-interaction-stage"/, 'App 不应再内联录像带双屏舞台');
  assert.doesNotMatch(模板段, /class="special-interaction-status"/, 'App 不应再内联录像带状态条');
  assert.doesNotMatch(模板段, /class="scene-acts special-scene-acts"/, 'App 不应再内联录像带操作瓷砖');
  assert.doesNotMatch(App源码, /const 录像带阶段 = computed/, 'App 不应再声明 录像带阶段');
  assert.doesNotMatch(App源码, /const 录像带中 = computed/, 'App 不应再声明 录像带中');
  assert.doesNotMatch(App源码, /const 录像带本地结果 = ref/, 'App 不应再声明 录像带本地结果');
  assert.doesNotMatch(App源码, /const 录像带连点计数 = ref/, 'App 不应再声明 录像带连点计数');
  assert.doesNotMatch(App源码, /let 录像带连点开始/, 'App 不应再声明 录像带连点开始');
  assert.doesNotMatch(App源码, /录像带连点timer/, 'App 不应再持有录像带计时器');
  assert.doesNotMatch(App源码, /function 提交录像带互动/, 'App 不应再声明 提交录像带互动');
  assert.doesNotMatch(App源码, /function 记录录像带连点失败/, 'App 不应再声明 记录录像带连点失败');
  assert.doesNotMatch(App源码, /function 打开102录像/, 'App 不应再声明 打开102录像');
  assert.doesNotMatch(App源码, /function 连续点击202录像/, 'App 不应再声明 连续点击202录像');
  assert.doesNotMatch(App源码, /function 自动重连202/, 'App 不应再声明 自动重连202');
  // composable 持有全部局部状态与动作
  assert.match(composable源码, /const 录像带阶段 = computed\(/, 'composable 应声明 录像带阶段');
  assert.match(composable源码, /const 录像带中 = computed\(/, 'composable 应声明 录像带中');
  assert.match(composable源码, /const 录像带本地结果 = ref/, 'composable 应声明 录像带本地结果');
  assert.match(composable源码, /const 录像带连点目标 = 10;/, 'composable 应声明 录像带连点目标');
  assert.match(composable源码, /const 录像带连点计数 = ref\(0\)/, 'composable 应声明 录像带连点计数');
  assert.match(composable源码, /const 录像带补偿可用 = computed/, 'composable 应声明 录像带补偿可用');
  assert.match(composable源码, /const 录像带交互幕 = computed/, 'composable 应声明 录像带交互幕');
  for (const fn of ['请求使用录像带', '打开102录像', '连续点击202录像', '自动重连202', '重置录像带界面']) {
    assert.match(composable源码, new RegExp(`function ${fn}\\(`), `composable 应声明 ${fn}`);
  }
  assert.match(
    composable源码,
    /return \{[\s\S]*?录像带阶段,[\s\S]*?录像带中,[\s\S]*?录像带本地结果,[\s\S]*?录像带连点目标,[\s\S]*?录像带连点计数,[\s\S]*?录像带补偿可用,[\s\S]*?录像带交互幕,[\s\S]*?请求使用录像带,[\s\S]*?打开102录像,[\s\S]*?连续点击202录像,[\s\S]*?自动重连202,[\s\S]*?重置录像带界面,[\s\S]*?\}/,
    'composable 应返回完整 API',
  );
  // App 只保留跨区块 wrapper：先占同步提交门，再关背包并请求使用
  assert.match(
    App源码,
    /function 使用录像带\(\) \{[\s\S]*?提交界面事务\(\(\) => \{[\s\S]*?请求使用录像带\(\);[\s\S]*?\}\)[\s\S]*?显示背包\.value = false;[\s\S]*?\}/,
    'App 使用录像带 wrapper 先占同步提交门，再关背包并请求使用',
  );
});

test('options 接线完整：原事件名与载荷、清流、持久交互+flush 保持；无宽泛逃逸类型', () => {
  assert.match(App源码, /请求使用: \(\) => eventEmit\('人妻公寓:使用录像带'\)/, '请求使用 接原事件名');
  assert.match(App源码, /请求互动: 房间 => eventEmit\('人妻公寓:录像带互动', 房间\)/, '请求互动 接原事件名与载荷');
  assert.match(App源码, /清空流式输出: \(\) => \{[\s\S]*?流式段\.value = \[\];[\s\S]*?\}/, '清空流式输出 接流式段清空');
  assert.match(
    App源码,
    /保存失败交互: 新交互 => \{[\s\S]*?data\.value\.系统\._特殊场景\.交互 = 新交互;[\s\S]*?\.flush\?\.\(\);[\s\S]*?\}/,
    '保存失败交互 写 MVU 快照并 flush',
  );
  assert.match(composable源码, /interface 录像带选项 \{/, 'composable 应声明强类型 options');
  assert.match(composable源码, /保存失败交互: \(新交互: 录像带交互记录\) => void/, '保存失败交互 参数为精确类型');
  assert.doesNotMatch(composable源码, /: any|Function|\bas never\b/, 'composable 不得有 any/Function/as never 逃逸');
  // 提交顺序契约：guard→清 timer→计数清零→写本地结果→发送锁→清流→请求事件
  assert.match(
    composable源码,
    /if \(发送中\.value\) return;[\s\S]*?clearTimeout\(录像带连点timer\);[\s\S]*?录像带连点计数\.value = 0;[\s\S]*?录像带本地结果\.value = 房间;[\s\S]*?发送中\.value = true;[\s\S]*?清空流式输出\(\);[\s\S]*?请求互动\(房间\);/,
    '提交互动顺序不变',
  );
});

test('5 秒/10 连点/完整失败记账/补偿/回合重置契约完整；timer 由 scope 清理，App unmount 不再引用', () => {
  assert.match(composable源码, /setTimeout\(记录录像带连点失败, 5000\)/, '5 秒失败窗口');
  assert.match(composable源码, /现在 - 录像带连点开始 > 5000/, '超 5 秒先记完整失败再开新窗口');
  assert.match(composable源码, /if \(!录像带连点开始\)/, '首击开窗口');
  assert.match(composable源码, /const 录像带连点目标 = 10;/, '连点目标=10');
  assert.match(composable源码, /录像带连点计数\.value >= 录像带连点目标/, '累计达标即提交');
  assert.match(
    composable源码,
    /录像带阶段\.value !== '等待202' \|\| 录像带连点计数\.value >= 录像带连点目标/,
    '完整失败记账门：只在等待202 且未达标',
  );
  assert.match(composable源码, /推进录像带连点失败\(data\.value\?\.系统\?\._特殊场景\)/, '完整失败经推进生成新快照');
  assert.match(composable源码, /if \(!新交互\) return;/, 'null 不写');
  assert.match(composable源码, /读取录像带连点失败状态/, '失败状态由持久快照读取');
  assert.match(composable源码, /if \(录像带补偿可用\.value\) 提交录像带互动\('202'\)/, '补偿只在可用时提交');
  assert.match(
    composable源码,
    /function 重置录像带界面\(\) \{[\s\S]*?录像带本地结果\.value = '';[\s\S]*?clearTimeout\(录像带连点timer\);[\s\S]*?录像带连点计数\.value = 0;[\s\S]*?录像带连点开始 = 0;[\s\S]*?\}/,
    '回合重置清本地结果/计时器/计数/开始',
  );
  assert.match(composable源码, /onScopeDispose\(重置录像带界面\)/, 'timer 由 scope dispose 复用重置函数清理');
  assert.doesNotMatch(App源码, /录像带连点timer/, 'App unmount 不再引用录像带计时器');
  assert.match(App源码, /重置录像带界面\(\);/, '回合完成改调单一重置');
});

test('舞台组件：素材导入、图选择、三段说明、进度条、alt/draggable 完整，无 ?url', () => {
  assert.match(
    舞台源码,
    /import \{ 录像带双屏关闭图, 录像带左屏亮起图, 录像带双屏亮起图 \} from '\.\.\/assets';/,
    '舞台导入三张录像带图',
  );
  assert.doesNotMatch(App源码, /录像带双屏关闭图|录像带左屏亮起图|录像带双屏亮起图/, 'App 不再导入三张录像带图');
  assert.match(舞台源码, /localResult === '202'[\s\S]*?录像带双屏亮起图/, '202 结果回双屏亮起图');
  assert.match(舞台源码, /props\.localResult === '102' \|\| props\.stage === '等待202'[\s\S]*?录像带左屏亮起图/, '102 结果或等待202 回左屏亮起图');
  assert.match(舞台源码, /录像带双屏关闭图/, '默认回双屏关闭图');
  assert.match(舞台源码, /'录像已经接通，正在等待她们开口……'/, '发送中说明原文');
  assert.match(舞台源码, /'102室录像已结束。连续点击，让第二台显示器接通信号。'/, '等待202 说明原文');
  assert.match(舞台源码, /'两台显示器仍是黑的。先调取102室录像。'/, '默认说明原文');
  assert.match(舞台源码, /<div v-if="open" class="special-interaction-stage">/, '舞台根自持 v-if="open"');
  assert.match(舞台源码, /alt="管理员室双显示器"[\s\S]{0,80}draggable="false"/, 'alt 与 draggable 保持');
  assert.match(舞台源码, /tapCount > 0 && stage === '等待202'/, '只在计数>0且等待202显示进度');
  assert.match(舞台源码, /\{\{ tapCount \}\}\/\{\{ tapTarget \}\}/, '计数/目标插值');
  assert.doesNotMatch(舞台源码, /\?url/, '无 ?url 位图导入');
});

test('录像带素材失败只淘汰自己的请求并显示可继续操作的本地占位', () => {
  assert.match(舞台源码, /const 失效图 = ref\(''\)/, '舞台必须持有本地素材失败态');
  assert.match(舞台源码, /data-video-src/, '图片节点必须携带请求地址身份');
  assert.match(
    舞台源码,
    /if \(地址 && 地址 === 当前图\.value\) 失效图\.value = 地址/,
    '旧图迟到 error 不得淘汰当前新图',
  );
  assert.match(
    舞台源码,
    /if \(地址 && 地址 === 当前图\.value && 失效图\.value === 地址\) 失效图\.value = ''/,
    '只有当前请求的 load 才能恢复当前图',
  );
  assert.match(舞台源码, /v-if="失效图 !== 当前图"[\s\S]*?@load="图片加载成功"[\s\S]*?@error="图片加载失败"/, '正常图按身份接 load/error');
  assert.match(舞台源码, /v-else class="video-tape-fallback" role="img"/, '图片失败显示语义占位');
  assert.match(舞台源码, /画面暂时无法加载[\s\S]*?操作进度已经保留，可以继续完成当前录像带互动/, '呈现失败不得冒充业务失败');
});

test('操作组件：props/emits、三瓷砖、frozen/disabled、计数插值、补偿条件、Ic 导入完整', () => {
  assert.match(操作源码, /import Ic from '\.\/Icon\.vue';/, '操作组件导入 Ic');
  assert.match(
    操作源码,
    /defineProps<\{[\s\S]*?open: boolean;[\s\S]*?sending: boolean;[\s\S]*?stage: string;[\s\S]*?tapCount: number;[\s\S]*?tapTarget: number;[\s\S]*?recoveryAvailable: boolean;[\s\S]*?\}>\(\)/,
    'props 契约六项',
  );
  assert.match(
    操作源码,
    /defineEmits<\{[\s\S]*?open102: \[\];[\s\S]*?tap202: \[\];[\s\S]*?recover: \[\];[\s\S]*?\}>\(\)/,
    'emits 契约三项',
  );
  const 模板段 = 提取模板(操作源码);
  assert.match(模板段, /v-if="open && !sending"/, '根显示条件 open && !sending');
  assert.match(模板段, /:class="\{ frozen: stage !== '等待102' \}"[\s\S]*?:disabled="stage !== '等待102'"/, '102 瓷砖 frozen/disabled');
  assert.match(模板段, /:class="\{ frozen: stage !== '等待202' \}"[\s\S]*?:disabled="stage !== '等待202'"/, '202 瓷砖 frozen/disabled');
  assert.match(模板段, /'SINGLE TAP' : 'PLAYED'/, '102 kicker 文案');
  assert.match(模板段, /'调取102室隐藏摄像头录像' : '102室录像已播放'/, '102 主文案');
  assert.match(模板段, /'RAPID TAP' : 'LOCKED'/, '202 kicker 文案');
  assert.match(模板段, /连续点击调取202室录像 \(\$\{tapCount\}\/\$\{tapTarget\}\)/, '202 计数插值');
  assert.match(模板段, /'202室录像 · 等待前段结束'/, '202 锁定文案');
  assert.match(模板段, /v-if="recoveryAvailable"/, '补偿只在资格可用时出现');
  assert.match(模板段, /class="act-kicker">RECOVERY<\/span>/, '补偿 kicker');
  assert.match(模板段, /让监控系统自动重连/, '补偿文案');
  assert.match(模板段, /@click="emit\('open102'\)"/, '102 按钮只 emit');
  assert.match(模板段, /@click="emit\('tap202'\)"/, '202 按钮只 emit');
  assert.match(模板段, /@click="emit\('recover'\)"/, '补偿按钮只 emit');
  assert.doesNotMatch(操作源码, /eventEmit\(|eventOn\(/, '操作组件不直连事件总线');
});

test('专属 CSS 所有权：录像带规则迁入组件；App 不再持有 shared 舞台定义(A7b3 后录像带/静音会议各按 scoped 自持)；三组件具备所需样式与 dark 表现', () => {
  for (const selector of [
    '.special-interaction-status {',
    '.special-scene-acts {',
    '.special-scene-acts .tile.frozen {',
    '.special-scene-acts .special-assist {',
  ]) {
    assert.doesNotMatch(App源码, new RegExp(转义(selector)), `App 不应再持有 ${selector}`);
  }
  // App 不再持有 .special-interaction-stage 基础两段(录像带舞台与静音会议互动各按 scoped 边界自持)
  assert.doesNotMatch(App源码, /^\.special-interaction-stage \{/m, 'App 不再持有 .special-interaction-stage');
  assert.doesNotMatch(App源码, /^\.special-interaction-stage img \{/m, 'App 不再持有 .special-interaction-stage img');
  // App 仍保留 parent 背景；通用 .tile/.scene-acts/.act-kicker 已随房内动作迁入 房内操作抽屉.vue
  assert.match(App源码, /^\.story-wrap\.story-special-interaction \{/m, 'App 仍保留 story-special-interaction');
  assert.doesNotMatch(App源码, /^\.tile \{/m, '通用 .tile 已迁入抽屉组件');
  assert.doesNotMatch(App源码, /^\.scene-acts \{/m, '通用 .scene-acts 已迁入抽屉组件');
  assert.doesNotMatch(App源码, /^\.act-kicker \{/m, '通用 .act-kicker 已迁入抽屉组件');
  assert.doesNotMatch(App源码, /:global\(html\.rq-dark\) \.tile \{/, 'dark .tile 已迁入抽屉组件');
  assert.match(抽屉源码, /^\.tile \{/m, '抽屉组件持有通用 .tile');
  assert.match(抽屉源码, /^\.scene-acts \{/m, '抽屉组件持有通用 .scene-acts');
  assert.match(抽屉源码, /^\.act-kicker \{/m, '抽屉组件持有通用 .act-kicker');
  assert.match(抽屉源码, /:global\(html\.rq-dark \.tile\) \{/, '抽屉组件持有可正确编译的 dark .tile');
  // 录像带舞台组件持有自身所需三组定义
  for (const selector of [
    '.special-interaction-stage {',
    '.special-interaction-stage img {',
    '.special-interaction-status {',
  ]) {
    assert.match(舞台源码, new RegExp(转义(selector)), `录像带舞台应持有 ${selector}`);
  }
  // 静音会议互动组件(A7b3)也自持 .special-interaction-stage 基础两段
  for (const selector of [
    '.special-interaction-stage {',
    '.special-interaction-stage img {',
  ]) {
    assert.match(互动源码, new RegExp(转义(selector)), `静音会议互动应持有 ${selector}`);
  }
  // 操作组件持有录像带专属与自身必需的共享声明
  for (const selector of [
    '.special-scene-acts {',
    '.special-scene-acts .tile.frozen {',
    '.special-scene-acts .special-assist {',
    '.scene-acts {',
    '.scene-acts .tile {',
    '.tile {',
    '.tile .ic {',
    '.tile strong {',
    '.tile:hover {',
    '.act-kicker {',
  ]) {
    assert.match(操作源码, new RegExp(转义(selector)), `操作组件应持有 ${selector}`);
  }
  assert.match(操作源码, /:global\(html\.rq-dark\) \.tile \{/, '操作组件具备 dark .tile 表现');
});

test('App 其他录像带门控原样；A1–A6 边界未回退；无中文首字符组件 tag；源码不触碰 dist', () => {
  // 正文/离房/选项/输入/dock/场景动作与场景氛围门控
  assert.match(App源码, /'story-special-interaction': 录像带交互幕 \|\| 静音会议交互幕/, 'story-wrap 场景态保持');
  assert.match(App源码, /v-if="!录像带中 && !静音会议交互幕"/, '隐藏正文钮门控保持');
  // A8a 后 story-veiled 映射归属 正文卷轴.vue:App 只保留 props 门控表达式,组件根负责 class 映射
  assert.match(
    App源码,
    /:veiled="正文隐藏 \|\| 录像带交互幕 \|\| 静音会议交互幕 \|\| !!当前事件CG"/,
    'App 的 StoryScroll 保留原隐层门控，并让家庭计划或生产事件画面遮住正文',
  );
  assert.match(正文卷轴源码, /:class="\{ 'story-veiled': veiled \}"/, '组件根把 veiled 映射到 story-veiled');
  assert.match(App源码, /v-if="当前房间 && !录像带中"/, '离房钮门控保持');
  // 普通房内动作瓷砖迁入 房内操作抽屉.vue：录像带门控等价保留在组件，App 接线动作数组与统一抑制
  assert.match(App源码, /:actions="普通房间动作"/, 'App 把普通房间动作传给抽屉组件');
  assert.match(App源码, /:video-tape-active="录像带中"/, 'App 接线录像带门控');
  assert.match(App源码, /:suppressed="房内操作抑制"/, 'App 接线统一抑制');
  assert.match(
    抽屉源码,
    /const 普通动作可见 = computed\(\(\) => !props\.videoTapeActive && props\.actions\.length > 0\)/,
    '录像带门控等价保留在组件',
  );
  // A8b:行动选项/推进时间门控迁入 行动选项.vue / 回合输入.vue,App 只留完整组合门接线
  assert.match(App源码, /:open="显示选项 && !录像带中 && !静音会议交互幕 && !静音会议待散会选择 && !静音会议自由待选择"/, '行动选项门控保持(App 接线完整组合门)');
  assert.match(行动选项源码, /v-if="open"\s+class="option-row"/, '行动选项组件根自持 v-if="open"');
  assert.match(App源码, /:video-active="录像带中"/, '推进时间钮门控保持(App video-active)');
  assert.match(App源码, /:formal-meeting="静音会议正式中"/, '推进时间钮门控保持(App formal-meeting)');
  assert.match(回合输入源码, /v-if="!videoActive && !formalMeeting"/, '推进时间钮组件根自持门控');
  assert.match(App源码, /v-if="!录像带中" class="dock"/, 'dock 门控保持');
  assert.match(
    App源码,
    /if \(录像带中\.value\) \{[\s\S]*?录像带阶段\.value !== '等待102'[\s\S]*?录像带阶段\.value !== '等待202'/,
    '输入可用门控保持',
  );
  assert.match(App源码, /房间id === '管理员室' && data\.value\?\.系统\?\._特殊场景\?\.id === '录像带'/, '录像带房内名单保持');
  assert.match(App源码, /@play-tape="使用录像带"/, '背包播放录像带接线保持');
  // A1–A6 边界未回退
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 仍导入 A1 Icon');
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'App 仍导入 A5a 背包');
  assert.match(App源码, /import ShopPopup from '\.\/components\/商店\.vue';/, 'App 仍导入 A5a 商店');
  assert.match(App源码, /import MapPopup from '\.\/components\/地图\.vue';/, 'App 仍导入 A6a 地图');
  assert.match(App源码, /import \{ useRoomActions \} from '\.\/composables\/useRoomActions';/, 'App 仍导入 A6b useRoomActions');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'App 仍导入 A3 useUIPrefs');
  // 无中文首字符组件 tag；不触碰 dist
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  for (const 源 of [composable源码, 舞台源码, 操作源码]) {
    assert.doesNotMatch(源, /dist\//, '新模块不得引用 dist');
  }
});
