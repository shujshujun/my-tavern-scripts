/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A5b 拆分（角色档案卡 → components/档案卡.vue）
// 等价外移，不依赖空格/Prettier 行宽，不把注释当真实 import。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 档案卡源码 = readFileSync(new URL('./components/档案卡.vue', 客户端目录), 'utf8');
const 弹窗基础css = readFileSync(new URL('./components/弹窗基础.css', 客户端目录), 'utf8');
const A2测试源码 = readFileSync(new URL('../../../../tests/人妻公寓/App拆分A2.test.mjs', 客户端目录), 'utf8');
const 仪容测试源码 = readFileSync(new URL('../../../../tests/人妻公寓/仪容缩略图.test.mjs', 客户端目录), 'utf8');
const 存档策略测试源码 = readFileSync(new URL('../../../../tests/人妻公寓/v080存档策略.test.mjs', 客户端目录), 'utf8');
const 夜间门测试源码 = readFileSync(new URL('../../../../tests/人妻公寓/夜间触发门.test.mjs', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('组件非空；App 真实 import Latin-first 别名并常驻渲染；组件不反向 import App/store', () => {
  assert.ok(档案卡源码.length > 0, 'components/档案卡.vue 应为非空文件');
  assert.match(App源码, /import DossierPopup from '\.\/components\/档案卡\.vue';/, 'App 应导入 档案卡.vue');
  const 模板段 = 提取模板(App源码);
  assert.match(模板段, /<DossierPopup\b[\s\S]*?\/>/, 'App 模板应以 Latin-first 标签挂载 DossierPopup');
  assert.doesNotMatch(模板段, /<DossierPopup[^>]*v-if/, 'DossierPopup tag 外不得再有 v-if');
  assert.match(档案卡源码, /<div v-if="选中档案" class="mask"/, '档案卡根节点自持 v-if="选中档案"');
  const 依赖 = 提取导入specifier(档案卡源码);
  assert.ok(!依赖.some(s => s.includes('App.vue') || s.includes('/App')), '组件不得反向导入 App');
  assert.ok(!依赖.some(s => s.includes('store')), '组件不得导入 store');
});

test('App 不再内联档案卡大模板与档案派生状态；仍在使用的跨区块业务动作留 App', () => {
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /class="sheet dossier"/, 'App 不应再内联档案卡大模板');
  for (const 声明 of [
    'const 选中档案 = computed',
    'const 选中可晋阶 = computed',
    'const 选中首夜待晚上 = computed',
    'const 选中晋阶待现场 = computed',
    'const 显示关系线索 = ref',
    'const 选中关系线索 = computed',
    'const 选中可要钱 = computed',
    'const 选中线索 = computed',
    'const 选中裂缝 = computed',
  ]) {
    assert.doesNotMatch(App源码, new RegExp(转义(声明)), `App 不应再声明 ${声明}`);
  }
  assert.doesNotMatch(App源码, /watch\(选中门牌/, '门牌变化收起关系线索的 watch 应迁入组件');
  // 跨区块选择/图库开关/业务动作/共享证物槽仍留 App
  assert.match(App源码, /const 选中门牌 = ref<门牌 \| null>\(null\)/, '选中门牌仍留 App');
  assert.match(App源码, /const CG图库门牌 = ref<门牌 \| null>\(null\)/, 'CG图库门牌仍留 App');
  assert.match(App源码, /function 打开CG图库/, '打开CG图库仍留 App');
  assert.match(App源码, /function 关闭CG图库/, '关闭CG图库仍留 App');
  assert.match(App源码, /function 开口要钱/, '开口要钱仍留 App');
  assert.match(App源码, /function 晋阶\(/, '晋阶仍留 App');
  assert.doesNotMatch(App源码, /function 卸载\(/, '下线的性癖卸载不应残留 App');
  assert.match(App源码, /const 裂缝证物槽 = computed/, '裂缝证物槽仍留 App');
  assert.match(App源码, /:evidence-slots="裂缝证物槽"/, '证物槽同时传档案与读信');
  assert.match(App源码, /const 已解锁CG = ref<Set<string>>/, '已解锁CG仍留 App');
  assert.match(App源码, /function 妻在玩家身边\(/, '妻在玩家身边仍留 App');
});

test('组件拥有完整派生 imports/逻辑；App 仅档案 imports 移除但保留其他消费者；素材来自 ../assets，无 ?url', () => {
  assert.match(
    档案卡源码,
    /import \{[\s\S]*?查考古[\s\S]*?\} from '\.\.\/\.\.\/\.\.\/stageConfig'/,
    '组件应从 stageConfig 导入查考古',
  );
  assert.match(
    档案卡源码,
    /import \{[\s\S]*?阶段标题[\s\S]*?\} from '\.\.\/\.\.\/\.\.\/stageConfig'/,
    '组件应从 stageConfig 导入阶段标题',
  );
  assert.match(
    档案卡源码,
    /import \{ 可晋阶, 可启动母亲药物首夜, 普通首夜时段已满足, 晋阶预约现场已满足 \} from '\.\.\/\.\.\/\.\.\/脚本\/游戏逻辑\/结算系统'/,
    '组件应从结算系统导入晋阶四件套',
  );
  assert.match(
    档案卡源码,
    /import \{ 读取关系线索, 读取开门线索 \} from '\.\.\/\.\.\/\.\.\/脚本\/游戏逻辑\/阶段线路系统'/,
    '组件应从阶段线路系统导入关系线路与阶段0开门线索',
  );
  assert.match(
    档案卡源码,
    /import \{ CG条目, 角色CG总数全部变体 \} from '\.\.\/\.\.\/\.\.\/脚本\/游戏逻辑\/成人CG系统'/,
    '组件应从成人CG系统导入 CG条目/跨变体总数',
  );
  assert.match(
    档案卡源码,
    /import \{ 当前天数, 丈夫在楼 \} from '\.\.\/\.\.\/\.\.\/脚本\/游戏逻辑\/楼层时钟'/,
    '组件应从楼层时钟导入丈夫在楼与共享世界日函数',
  );
  assert.match(
    档案卡源码,
    /import \{ 角色立绘候选 \} from '\.\.\/assets'/,
    '组件从 ../assets 导入统一立绘候选解析器',
  );
  assert.match(
    档案卡源码,
    /import type \{ SchemaType \} from '\.\.\/\.\.\/\.\.\/schema'/,
    '组件从 ../../../schema type 导入 SchemaType',
  );

  // App 移除仅档案 imports，但保留同模块其他消费者
  assert.doesNotMatch(App源码, /查考古/, 'App 不再导入查考古');
  assert.doesNotMatch(App源码, /阶段标题/, 'App 不再导入阶段标题');
  assert.doesNotMatch(
    App源码,
    /可启动母亲药物首夜|普通首夜时段已满足|晋阶预约现场已满足/,
    'App 不再导入结算系统晋阶四件套',
  );
  assert.doesNotMatch(App源码, /读取关系线索/, 'App 不再导入读取关系线索');
  assert.doesNotMatch(App源码, /角色CG总数/, 'App 不再导入角色CG总数');
  assert.match(
    App源码,
    /import \{ 丈夫在楼, 妻位置推算 \} from '\.\.\/\.\.\/脚本\/游戏逻辑\/楼层时钟'/,
    '丈夫在楼其他消费者仍在 App',
  );
  assert.match(
    App源码,
    /import\s*\{[^;]*列出阶段线路候选详情[^;]*type 阶段线路候选[^;]*\}\s*from '\.\.\/\.\.\/脚本\/游戏逻辑\/阶段线路系统';/s,
    '阶段线路候选仍在 App；同模块新增消费者不得因 import 换行或成员扩展造成误报',
  );
  assert.match(
    App源码,
    /import \{[\s\S]*?CG条目[\s\S]*?\} from '\.\.\/\.\.\/脚本\/游戏逻辑\/成人CG系统'/,
    '成人CG其他符号仍在 App',
  );
  assert.match(
    App源码,
    /import \{[\s\S]*?道具表[\s\S]*?\} from '\.\.\/\.\.\/stageConfig'/,
    'stageConfig 其他符号仍在 App',
  );

  // 派生逻辑在组件内等价保留
  assert.match(档案卡源码, /if \(!m \|\| !props\.ready \|\| !props\.data\.户\[m\]\) return null;/, '就绪/数据门原样');
  assert.match(档案卡源码, /夫状态: 丈夫在楼\(props\.data\.户\[m\], m, props\.absolutePeriod\)/, '夫状态派生读 props');
  assert.match(档案卡源码, /阶段标题: 阶段标题\(妻\.当前阶段, m\)/, '阶段标题派生');
  assert.match(档案卡源码, /气质描述: 户静态表\[m\]\.初始\?\.气质描述 \?\? ''/, '气质描述派生');
  assert.match(
    档案卡源码,
    /已解锁: \[\.\.\.props\.unlockedCg\]\.filter\(id => CG条目\(id\)\?\.door === m\)\.length/,
    'CG 已解锁按门牌过滤',
  );
  assert.match(档案卡源码, /总数: 角色CG总数全部变体\(m\)/, 'CG 总数跨普通与怀孕图库合计');
  assert.match(档案卡源码, /可晋阶\(props\.data\.户\[m\]\.妻\)/, '可晋阶逻辑');
  assert.match(
    档案卡源码,
    /晋阶预约现场已满足\(props\.data, m, props\.currentRoom \?\? undefined\)/,
    '预约现场用 currentRoom ?? undefined',
  );
  assert.strictEqual(
    (档案卡源码.match(/晋阶预约现场已满足\(props\.data, m, props\.currentRoom \?\? undefined\)/g) ?? []).length,
    2,
    '预约现场调用出现 2 次（选中可晋阶/选中晋阶待现场）',
  );
  assert.match(
    档案卡源码,
    /m === '302' && 可启动母亲药物首夜\(props\.data, props\.currentRoom\)/,
    '302 母亲药物首夜分支',
  );
  assert.match(档案卡源码, /读取关系线索\(props\.data, m\)/, '关系线索读取');
  assert.match(档案卡源码, /读取开门线索\(props\.data, m\)/, '阶段0开门线索读取');
  assert.match(档案卡源码, /const 选中关系轨迹 = computed/, '开门与四节点线路统一为只读关系轨迹');
  assert.match(档案卡源码, /watch\(\(\) => props\.door, \(\) => \{/, '门牌变化 watch 在组件');
  assert.match(档案卡源码, /!!妻 && 妻\.当前阶段 >= 4 && props\.wifeNearby/, '要钱=阶段4+wifeNearby');
  assert.match(档案卡源码, /查裂缝\(m\)/, '选中线索/裂缝读查裂缝');

  for (const 源 of [App源码, 档案卡源码]) {
    assert.doesNotMatch(源, /(?:png|webp)\?url/, '不得出现 png?url / webp?url');
  }
});

test('props/emits 与 App 接线完整；close/三类图片 error/CG/卸载/晋阶/要钱参数正确；组件无 eventEmit；晋阶顺序不变', () => {
  const 模板段 = 提取模板(App源码);
  assert.match(
    模板段,
    /<DossierPopup\b[\s\S]*?:door="选中门牌"[\s\S]*?:data="data"[\s\S]*?:ready="就绪"[\s\S]*?:current-room="当前房间"[\s\S]*?:absolute-period="绝对时段"[\s\S]*?:unlocked-cg="已解锁CG"[\s\S]*?:sending="场景操作锁"[\s\S]*?:wife-nearby="选中门牌 \? 妻在玩家身边\(选中门牌\) : false"[\s\S]*?:evidence-slots="裂缝证物槽"[\s\S]*?:avatar-failed="头像失效"[\s\S]*?:portrait-failed="立绘失效"[\s\S]*?:item-failed="道具图失效"[\s\S]*?:avatar-image="头像图"[\s\S]*?:item-image="道具图"[\s\S]*?@close="选中门牌 = null"[\s\S]*?@avatar-error="头像失效\[\$event\] = true"[\s\S]*?@portrait-error="立绘失效\[\$event\] = true"[\s\S]*?@item-error="道具图失效\[\$event\] = true"[\s\S]*?@open-cg="打开CG图库"[\s\S]*?@advance="晋阶"[\s\S]*?@ask-money="开口要钱"[\s\S]*?\/>/,
    '档案 tag 全部 props/emits 接线',
  );
  assert.match(
    档案卡源码,
    /defineProps<\{[\s\S]*?door: 门牌 \| null[\s\S]*?data: SchemaType[\s\S]*?ready: boolean[\s\S]*?currentRoom: string \| null[\s\S]*?absolutePeriod: number[\s\S]*?unlockedCg: ReadonlySet<string>[\s\S]*?sending: boolean[\s\S]*?wifeNearby: boolean[\s\S]*?evidenceSlots: readonly \{ 标: string; 图: string \}\[\][\s\S]*?avatarFailed: Record<string, boolean>[\s\S]*?portraitFailed: Record<string, boolean>[\s\S]*?itemFailed: Record<string, boolean>[\s\S]*?avatarImage: \(name: string\) => string[\s\S]*?itemImage: \(id: string\) => string[\s\S]*?\}>/,
    '组件 props 强类型契约',
  );
  assert.match(
    档案卡源码,
    /defineEmits<\{[\s\S]*?close: \[\][\s\S]*?avatarError: \[name: string\][\s\S]*?portraitError: \[url: string\][\s\S]*?itemError: \[id: string\][\s\S]*?openCg: \[door: 门牌\][\s\S]*?advance: \[door: 门牌\][\s\S]*?askMoney: \[door: 门牌\][\s\S]*?\}>/,
    '组件 emits 强类型契约',
  );
  assert.doesNotMatch(档案卡源码, /eventEmit\(|eventOn\(/, '组件不含事件总线写入');
  assert.match(
    App源码,
    /function 晋阶\(门牌号: 门牌\) \{\s*if \(提交界面事务\(\(\) => eventEmit\('人妻公寓:请求晋阶', 门牌号\)\)\) 选中门牌\.value = null;\s*\}/,
    '晋阶先经同步事务门发事件，只有成功受理后才清选中门牌',
  );
  assert.match(档案卡源码, /@click\.self="emit\('close'\)"/, 'mask.self 只 emit close');
  assert.match(档案卡源码, /@error="emit\('avatarError', 选中档案\.妻名\)"/, '头像失败 emit 妻名');
  assert.match(档案卡源码, /@error="emit\('avatarError', '影子'\)"/, '丈夫头像失败 emit 影子');
  assert.match(档案卡源码, /@error="emit\('portraitError', 选中档案\.立绘图\)"/, '立绘失败 emit 立绘图');
  assert.match(档案卡源码, /@error="emit\('itemError', a\.图id\)"/, '道具图失败 emit 图id');
  assert.match(档案卡源码, /@click\.stop="emit\('openCg', 选中档案\.门牌\)"/, 'CG 按钮 emit 门牌');
  assert.doesNotMatch(档案卡源码, /unload|卸载|曾开发/, '档案不再提供旧性癖装卸入口');
  assert.match(档案卡源码, /@click="emit\('advance', 选中档案\.门牌\)"/, '晋阶 emit 门牌');
  assert.match(档案卡源码, /@click="emit\('askMoney', 选中档案\.门牌\)"/, '要钱 emit 门牌');
});

test('档案模板关键契约全量保持：头像/立绘/三轴/心镜/仪容/开发/性癖/丈夫/证物/裂缝/关系/晋阶/要钱', () => {
  const 模板段 = 提取模板(档案卡源码);
  assert.match(模板段, /class="sheet-close" @click="emit\('close'\)">✕/, '✕ 只 emit close');
  assert.match(模板段, /v-if="!avatarFailed\[选中档案\.妻名\]"/, '头像失败门');
  assert.match(模板段, /class="avatar-glyph big img"[\s\S]*?:src="avatarImage\(选中档案\.妻名\)"/, '头像图+失败回退');
  assert.match(模板段, /ROOM \{\{ 选中档案\.门牌 \}\} · RESIDENT FILE/, 'role kicker');
  assert.match(模板段, /:title="'阶段:' \+ 选中档案\.阶段标题"/, 'hearts 阶段 title');
  assert.match(模板段, /<i v-for="n in 5" :key="n" :class="\{ on: n <= 选中档案\.妻\.当前阶段 \}">♥<\/i>/, '五心');
  assert.match(模板段, /v-if="选中档案\.立绘图"/, '立绘候选存在门');
  assert.match(
    档案卡源码,
    /角色立绘候选\(户静态表\[m\]\.妻名, 当前立绘SKU, 怀孕公开\)\.find\([\s\S]*?!props\.portraitFailed\[src\]/,
    '立绘失败后由统一候选解析器逐级回退',
  );
  assert.match(模板段, /v-for="轴 in 选中档案\.三轴"/, '三轴循环');
  assert.match(
    模板段,
    /role="meter"[\s\S]*?aria-valuemin="0"[\s\S]*?aria-valuemax="100"[\s\S]*?:aria-valuenow="轴\.值"/,
    '三轴 meter/ARIA',
  );
  assert.match(模板段, /'--level': Math\.max\(0, Math\.min\(100, 轴\.值\)\) \/ 100/, '三轴 clamp 0-1 比例');
  assert.match(模板段, /<b>情绪<\/b> \{\{ 选中档案\.妻\.当前情绪 \}\}/, '心镜情绪');
  assert.match(模板段, /<b>心声<\/b> \{\{ 选中档案\.妻\.当前心理想法 \}\}/, '心镜心声');
  assert.match(模板段, /<b>气质<\/b> \{\{ 选中档案\.气质描述 \}\}/, '心镜气质');
  assert.match(模板段, /class="attire-grid"/, '仪容网格');
  assert.match(模板段, /v-for="a in 选中档案\.仪容项"[\s\S]*?:key="a\.标 \+ a\.值"/, '仪容项循环');
  assert.match(模板段, /:class="\{ initial: a\.图id\?\.startsWith\('初始外装_'\) \}"/, '初始外装标记');
  assert.match(模板段, /loading="lazy"/, '仪容图 lazy');
  assert.match(模板段, /<b v-else aria-hidden="true">衣<\/b>/, '道具图失败回退 衣');
  assert.match(模板段, /v-if="选中档案\.妻\.当前阶段 >= 2" class="dsec dossier-card"/, '阶段2起显示CG图库入口');
  assert.match(模板段, /CG \{\{ 选中档案\.CG进度\.已解锁 \}\}\/\{\{ 选中档案\.CG进度\.总数 \}\} ›/, 'CG 进度文案');
  assert.match(模板段, /<div v-if="选中档案\.妻\.当前阶段 >= 3" class="dev-grid">/, '身体开发数值仍从阶段3才显示');
  assert.match(模板段, /v-for="部位 in 选中档案\.开发"[\s\S]*?:key="部位\.名"/, '开发四部位循环');
  assert.match(模板段, /class="bar dev"[\s\S]*?:style="\{ width: 部位\.值 \+ '%' \}"/, '开发进度条');
  assert.match(模板段, /v-if="选中档案\.阶段性癖"/, '阶段性癖完成后才显示');
  assert.match(模板段, /阶 段 性 癖/, '阶段性癖只读标题');
  assert.match(模板段, /class="kink-chip on">\{\{ 选中档案\.阶段性癖 \}\}/, '阶段性癖只读芯片');
  assert.match(模板段, /她 的 丈 夫/, '丈夫区块标题');
  assert.match(模板段, /v-if="!avatarFailed\['影子'\]"/, '丈夫头像失败门');
  assert.match(模板段, /:src="avatarImage\('影子'\)"/, '丈夫头像图');
  assert.match(模板段, /此刻\{\{ 选中档案\.夫状态 \}\}/, '夫状态');
  assert.match(模板段, /aria-label="丈夫疑心与信任风险盘"/, '风险盘 aria');
  assert.match(模板段, /<Ic n="lock" \/> 信任[\s\S]*?<Ic n="peep" \/> 疑心/, '风险盘图标');
  assert.match(
    模板段,
    /Math\.min\(95, \(选中档案\.夫\.疑心值 \/ Math\.max\(1, 选中档案\.夫\.疑心值 \+ 选中档案\.夫\.信任值\)\) \* 100\)/,
    '风险针公式',
  );
  assert.match(模板段, /<i class="bar sin" :style="\{ width: 选中档案\.夫\.疑心值 \+ '%' \}"/, '疑心轴');
  assert.match(模板段, /<i class="bar marr" :style="\{ width: 选中档案\.夫\.信任值 \+ '%' \}"/, '信任轴');
  assert.match(模板段, /<b>心里<\/b> \{\{ 选中档案\.夫\.当前心理想法 \}\}/, '丈夫心里');
  assert.match(模板段, /她的日子隔着一扇门——裂缝线索 \{\{ 选中档案\.妻\.裂缝\.碎片进度 \}\}\/4。/s, '蜡封文案');
  assert.match(模板段, /线索齐了:背包里那封拼起来的东西,读一读。/, '碎片齐了提示');
  assert.match(模板段, /v-for="\(槽, i\) in evidenceSlots"/, '证物槽 prop 循环');
  assert.match(模板段, /:key="`\$\{槽\.标\}-\$\{i\}`"/, '证物槽 key');
  assert.match(模板段, /:class="\{ found: !!选中线索\[i\] \}"/, '线索 found 态');
  assert.match(模板段, /\{\{ 选中线索\[i\] \|\| '尚未取得' \}\}/, '线索内容回退');
  assert.match(模板段, /'已归档' : '空槽'/, '线索状态文案');
  assert.match(模板段, /v-if="选中档案\.妻\.裂缝\.已确认 && 选中裂缝" class="dsec"/, '裂缝节');
  assert.match(模板段, /\{\{ 选中裂缝\.诊断 \}\}/, '裂缝诊断');
  assert.match(模板段, /✦ \{\{ 选中裂缝\.对症提示 \}\}/, '对症提示');
  assert.match(
    模板段,
    /v-if="选中关系轨迹"[\s\S]*?class="relation-clue-open"[\s\S]*?@click="显示关系线索 = !显示关系线索"/,
    '统一关系轨迹开关',
  );
  assert.match(
    模板段,
    /:aria-expanded="显示关系线索"[\s\S]*?aria-controls="relation-trace-panel"/,
    '关系轨迹开关具有展开语义',
  );
  assert.match(模板段, /选中关系轨迹\.类型 === '开门' \? '开门线索' : '关系线索'/, '阶段0与四节点线路标题分流');
  assert.match(模板段, /\{\{ 选中关系轨迹\.进度 \}\}\/4/, '四节点关系进度');
  assert.match(模板段, /v-if="显示关系线索 && 选中关系轨迹"[\s\S]*?class="dsec relation-clue-board"/, '关系轨迹面板');
  assert.match(模板段, /class="relation-action"[\s\S]*?\{\{ 选中关系轨迹\.行动提示 \}\}/, '阶段0开门行动提示');
  assert.match(模板段, /v-if="选中关系轨迹\.预约" class="relation-appointment"/, '预约行动卡');
  assert.match(
    模板段,
    /:class="\{ done: i < 选中关系轨迹\.进度, current: i === 选中关系轨迹\.进度, future: i > 选中关系轨迹\.进度 \}"/,
    '线索完成/当前/后续三态',
  );
  assert.match(
    模板段,
    /数值已经到达阶段门前。当前进度 \{\{ 选中关系轨迹\.进度 \}\}\/4/,
    '数值已冻结文案明确门前与关系线索进度',
  );
  assert.match(
    模板段,
    /v-if="选中档案\.妻\.当前阶段 > 0 && 选中档案\.妻\.当前阶段 < 5 && 选中档案\.妻\.裂缝\.已确认"[\s\S]*?class="btn rite"[\s\S]*?:disabled="sending \|\| !选中可晋阶"[\s\S]*?@click="emit\('advance', 选中档案\.门牌\)"/,
    '晋阶显示门排除阶段0赠礼旁路，并保留disabled',
  );
  assert.match(
    模板段,
    /选中首夜待晚上 \? '✦ 等到晚上' : 选中晋阶待现场 \? '✦ 按预约见面' : '✦ 跨过界线'/,
    '三路晋阶文案',
  );
  assert.match(
    模板段,
    /v-if="选中可要钱"[\s\S]*?class="btn"[\s\S]*?:disabled="sending"[\s\S]*?title="她的钱,现在也是你的钱"[\s\S]*?@click="emit\('askMoney', 选中档案\.门牌\)"[\s\S]*?¥ 开口要钱\s*<\/button>/,
    '要钱按钮显示门+disabled+title',
  );
});

test('档案专属 CSS 已从 App 移到组件；基础 popup scoped 引入；avatar base/img/dark 复制；App 保留其他头像所需且无档案残留', () => {
  for (const selector of [
    '.avatar-glyph.big {',
    '.relation-clue-open {',
    '.relation-clue-board {',
    '.relation-wait {',
    '.sheet.dossier {',
    '.dossier-hero {',
    '.dossier-hero::after {',
    '.dossier-head {',
    '.dossier-name {',
    '.dossier-role {',
    '.dossier-stage {',
    '.dossier-portrait {',
    '.dossier-axes {',
    '.dossier-axes .axis-row {',
    '.dossier-axes .axis-row::before {',
    '.dossier-axes .axis-row.fav::before {',
    '.axis-top {',
    '.axis-top i {',
    '.axis-row {',
    '.axis-label {',
    '.axis {',
    '.bar {',
    '.bar.dev {',
    '.axis-num {',
    '.kink-row {',
    '.kink-chip {',
    '.hb-row {',
    '.avatar-glyph.hb {',
    '.hb-main {',
    '.husband-risk {',
    '.husband-risk span :deep(.ic) {',
    '.risk-needle {',
    '.dsec {',
    '.dossier-card {',
    '.dossier-card .dsec-title {',
    '.dossier-card .dsec-title small {',
    '.dossier-card .dsec-title .cg-progress {',
    '.dsec-title {',
    '.dline {',
    '.dline b {',
    '.dsealed {',
    '.clue-board {',
    '.clue-slots {',
    '.clue-slot {',
    '.clue-slot.found {',
    '.clue-source {',
    '.clue-source :deep(.ic) {',
    '.clue-slot p {',
    '.clue-slot > i {',
    '.dev-grid {',
    '.attire-grid {',
    '.a-cell {',
    '.a-cell .a-pic {',
    '.a-cell.initial .a-pic img {',
    '.a-cell em {',
    '.a-cell b {',
    '.crack-hint {',
    '.dossier-id {',
    '.hearts {',
    '.hearts i {',
    '.hearts i.on {',
  ]) {
    assert.match(档案卡源码, new RegExp(转义(selector)), `档案组件应持有 ${selector}`);
    assert.doesNotMatch(App源码, new RegExp(转义(selector)), `App 不应再持有 ${selector}`);
  }
  assert.match(档案卡源码, /<style scoped src="\.\/弹窗基础\.css"><\/style>/, '应引入弹窗基础.css');
  // 组件复制 avatar base/img/dark；App 保留其他头像所需
  for (const selector of ['.avatar-glyph {', '.avatar-glyph.img {', ':global(html.rq-dark) .avatar-glyph {']) {
    assert.match(档案卡源码, new RegExp(转义(selector)), `组件应复制 ${selector}`);
    assert.match(App源码, new RegExp(转义(selector)), `App 应保留 ${selector}`);
  }
  assert.match(App源码, /\.avatar\.focus \.avatar-glyph/, 'App 保留头像 focus 规则');
  assert.doesNotMatch(App源码, /\.avatar-glyph\.big/, 'App 不再持有 .avatar-glyph.big');
  // 通用移动端头像规则仍留 App（顶部/房间头像用），组件不搬走
  assert.match(App源码, /\.avatar-glyph \{\s*width: 40px;\s*height: 40px;/, 'App 移动端通用头像规则仍保留');
});

test('dark/mobile 档案规则完整迁移；rq-still 来自弹窗基础；App 无档案 dark/mobile 残留', () => {
  for (const selector of [
    ':global(html.rq-dark) .hearts i {',
    ':global(html.rq-dark) .hearts i.on {',
    ':global(html.rq-dark) .sheet.dossier {',
    ':global(html.rq-dark) .dossier-hero {',
    ':global(html.rq-dark) .dossier-card,',
    ':global(html.rq-dark) .dossier-axes .axis-row,',
    ':global(html.rq-dark) .dossier-axes .axis-row.fav::before {',
    ':global(html.rq-dark) .a-cell {',
    ':global(html.rq-dark) .a-cell .a-pic {',
    '.mask:has(.dossier) {',
    '.dossier-head .avatar-glyph.big {',
    '.dossier-portrait {',
    '.dev-grid {',
  ]) {
    assert.match(档案卡源码, new RegExp(转义(selector)), `档案组件应持有 ${selector}`);
    assert.doesNotMatch(App源码, new RegExp(转义(selector)), `App 不应再持有 ${selector}`);
  }
  assert.match(档案卡源码, /@media \(max-width: 540px\)/, '档案移动端组在组件');
  assert.doesNotMatch(App源码, /\.mask:has\(\.dossier\)/, 'App 无档案移动端残留');
  assert.match(弹窗基础css, /:global\(html\.rq-still\)/, 'rq-still 来自弹窗基础');
  assert.doesNotMatch(档案卡源码, /rq-still/, '档案组件不复制 rq-still');
});

test('四份既有测试按所有权读取组件且不弱化；A1–A5a 组件边界未回退', () => {
  assert.match(A2测试源码, /components\/档案卡\.vue/, 'A2 测试读取档案组件');
  assert.ok(A2测试源码.includes('.dossier-card \\.dsec-title'), 'A2 档案 CSS 断言改为组件源');
  assert.match(仪容测试源码, /components\/档案卡\.vue/, '仪容缩略图测试读取档案组件');
  assert.ok(仪容测试源码.includes('auto-fill'), '仪容 84px auto-fill 断言仍在');
  assert.ok(仪容测试源码.includes('App 已随档案卡移除 .attire-grid'), '仪容测试断言 App 已移除');
  assert.match(存档策略测试源码, /components\/档案卡\.vue/, '062 存档策略测试读取档案组件');
  assert.ok(存档策略测试源码.includes('v-if="选中档案\\.妻\\.裂缝\\.已确认"'), '062 模板断言改查组件');
  assert.match(夜间门测试源码, /components\/档案卡\.vue/, '夜间触发门测试读取档案组件');
  assert.ok(夜间门测试源码.includes('普通首夜时段已满足'), '晋阶时段断言仍在');
  assert.ok(夜间门测试源码.includes("选中首夜待晚上 \\? '✦ 等到晚上'"), '晋阶文案断言仍在');
  assert.ok(夜间门测试源码.includes('App 已迁出'), '夜间门测试明确 App 已迁出');
  // A1–A5a 边界未回退
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 仍导入 A1 Icon');
  assert.match(App源码, /import CgLibrary from '\.\/components\/CG图库\.vue';/, 'App 仍导入 A2 CG图库');
  assert.match(App源码, /import MonitorPopup from '\.\/components\/监控\.vue';/, 'App 仍导入 A2 监控');
  assert.match(App源码, /import LetterPopup from '\.\/components\/读信\.vue';/, 'App 仍导入 A2 读信');
  assert.match(App源码, /import EventPromptPopup from '\.\/components\/事件提示词\.vue';/, 'App 仍导入 A2 事件提示词');
  assert.match(App源码, /import FeedbackOverlay from '\.\/components\/反馈提示\.vue';/, 'App 仍导入 A2 反馈提示');
  assert.match(App源码, /import SettingsPopup from '\.\/components\/设置弹窗\.vue';/, 'App 仍导入 A3 设置弹窗');
  assert.match(App源码, /import FirstRunSetup from '\.\/components\/首次准备\.vue';/, 'App 仍导入 A3 首次准备');
  assert.match(
    App源码,
    /import PrologueTitleScreen from '\.\/components\/序章标题屏\.vue';/,
    'App 仍导入 A4 序章标题屏',
  );
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'App 仍导入 A5a 背包');
  assert.match(App源码, /import ShopPopup from '\.\/components\/商店\.vue';/, 'App 仍导入 A5a 商店');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'App 仍导入 A3 useUIPrefs');
});

test('无中文首字符组件 tag；源码不触碰 dist', () => {
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  assert.doesNotMatch(档案卡源码, /dist\//, '档案组件不得引用 dist');
});
