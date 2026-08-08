/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

// 手机端房内操作上滑抽屉专项：行为测试直测纯状态机（抽屉状态机.ts），
// 结构契约测试复核 App.vue 接线、组件与样式所有权。不复制实现逻辑。
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const {
  创建抽屉状态机,
  首次自动展开时长,
  换房自动展开时长,
  新增提示时长,
} = require('../../src/人妻公寓/界面/客户端/composables/抽屉状态机.ts');

const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 抽屉源码 = readFileSync(new URL('./components/房内操作抽屉.vue', 客户端目录), 'utf8');
const 状态机源码 = readFileSync(new URL('./composables/抽屉状态机.ts', 客户端目录), 'utf8');

const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取 <script setup>/<script> 段：类型逃逸断言只扫脚本,避免 CSS `overflow-wrap: anywhere` 的 `: any` 误判。 */
const 提取脚本 = 源码 => 源码.slice(源码.indexOf('<script'), 源码.lastIndexOf('</script>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 可控假时钟：按时间排序触发 setTimeout，测试可精确前进并断言待办数。 */
function 造时钟() {
  let now = 0;
  let nextId = 1;
  const 队列 = [];
  return {
    计时: {
      设(fn, ms) {
        const id = nextId++;
        队列.push({ at: now + ms, fn, id });
        队列.sort((a, b) => a.at - b.at || a.id - b.id);
        return id;
      },
      清(handle) {
        const i = 队列.findIndex(q => q.id === handle);
        if (i !== -1) 队列.splice(i, 1);
      },
    },
    前进(ms) {
      const 目标 = now + ms;
      while (队列.length && 队列[0].at <= 目标) {
        const { at, fn } = 队列.shift();
        now = at;
        fn();
      }
      now = 目标;
    },
    待办数() {
      return 队列.length;
    },
    当前时刻() {
      return now;
    },
  };
}

function 新建机器() {
  const clock = 造时钟();
  const 状态 = { 展开: false, 新增提示: false };
  const 机器 = 创建抽屉状态机({ 状态, 计时: clock.计时 });
  return { clock, 状态, 机器 };
}

// ═══ 行为测试：抽屉状态机（手机断点 / 换房 / 抑制 / 新增提示） ═══

test('首次满足 手机+有房间+有动作+未抑制 自动展开 5 秒，计时结束收起', () => {
  const { clock, 状态, 机器 } = 新建机器();
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(状态.展开, true, '首次自动展开');
  assert.equal(clock.待办数(), 1);
  clock.前进(首次自动展开时长);
  assert.equal(状态.展开, false, '5 秒后收起');
});

test('后续真实换房自动展开 3 秒；重复同房不重启计时', () => {
  const { clock, 状态, 机器 } = 新建机器();
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  clock.前进(首次自动展开时长);
  assert.equal(状态.展开, false);

  // 真实换房 → 3 秒
  机器.更新({ mobile: true, roomId: '101', actionCount: 3, suppressed: false });
  assert.equal(状态.展开, true, '换房自动展开');
  assert.equal(clock.待办数(), 1);
  clock.前进(换房自动展开时长);
  assert.equal(状态.展开, false, '3 秒后收起');

  // 同房重复更新(点同一房间不改 roomId) → 不重启、不展开
  机器.更新({ mobile: true, roomId: '101', actionCount: 3, suppressed: false });
  机器.更新({ mobile: true, roomId: '101', actionCount: 3, suppressed: false });
  assert.equal(状态.展开, false, '重复同房不得重启计时/展开');
  assert.equal(clock.待办数(), 0, '重复同房不得产生计时器');
});

test('自动展开期间 交互取消自动计时：保持展开且不产生迟到收起', () => {
  const { clock, 状态, 机器 } = 新建机器();
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  clock.前进(1000);
  机器.交互取消自动计时();
  assert.equal(clock.待办数(), 0, '交互应取消自动收起计时');
  clock.前进(60000);
  assert.equal(状态.展开, true, '交互后保持展开，不自动收起');
});

test('手动展开不启动自动收起计时；手动收起立即收起', () => {
  const { clock, 状态, 机器 } = 新建机器();
  机器.手动展开();
  assert.equal(状态.展开, true);
  assert.equal(clock.待办数(), 0, '手动展开不得启动计时');
  clock.前进(60000);
  assert.equal(状态.展开, true, '手动展开不应被迟到计时收起');
  机器.手动收起();
  assert.equal(状态.展开, false);
});

test('房间为空 / 动作数归零 / 进入抑制 / 切到桌面 都清理计时并收起', () => {
  // 房间为空
  const a = 新建机器();
  a.机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  a.机器.更新({ mobile: true, roomId: null, actionCount: 0, suppressed: false });
  assert.equal(a.状态.展开, false);
  assert.equal(a.clock.待办数(), 0);

  // 动作数归零
  const b = 新建机器();
  b.机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  b.机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 0, suppressed: false });
  assert.equal(b.状态.展开, false);
  assert.equal(b.clock.待办数(), 0);

  // 进入抑制
  const c = 新建机器();
  c.机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  c.机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: true });
  assert.equal(c.状态.展开, false);
  assert.equal(c.状态.新增提示, false);
  assert.equal(c.clock.待办数(), 0);

  // 切到桌面
  const d = 新建机器();
  d.机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  d.机器.更新({ mobile: false, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(d.状态.展开, false);
  assert.equal(d.clock.待办数(), 0);
});

test('抑制释放后同房不强制展开、不提示；换房计时不会受旧房迟到影响', () => {
  const { clock, 状态, 机器 } = 新建机器();
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  clock.前进(1000);
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: true });
  assert.equal(状态.展开, false);
  assert.equal(clock.待办数(), 0);

  // 抑制释放：同房同数，不展开也不提示
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(状态.展开, false, '释放抑制不得强制展开');
  assert.equal(状态.新增提示, false, '释放抑制不得出现新增提示');
  assert.equal(clock.待办数(), 0);

  // 换房：旧房的迟到计时被清理，只按新房计时
  机器.更新({ mobile: true, roomId: '101', actionCount: 2, suppressed: false });
  assert.equal(状态.展开, true);
  clock.前进(换房自动展开时长 - 500);
  assert.equal(状态.展开, true, '新房 3 秒未到不收起');
  clock.前进(500);
  assert.equal(状态.展开, false, '新房 3 秒到点收起');
});

test('同一房间动作数增加：抽屉收起时只提示不强开，打开/归零/抑制后清掉；动作减少不提示', () => {
  const { clock, 状态, 机器 } = 新建机器();
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 1, suppressed: false });
  clock.前进(首次自动展开时长);
  assert.equal(状态.展开, false);

  // 同房 0→正数或正数增加：只提示
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(状态.展开, false, '同房新增不得强制展开');
  assert.equal(状态.新增提示, true, '收起时短暂显示新增操作');
  clock.前进(新增提示时长);
  assert.equal(状态.新增提示, false, '提示 3 秒后清掉');

  // 动作减少：不提示
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 1, suppressed: false });
  assert.equal(状态.新增提示, false, '动作减少不得提示');

  // 打开后清掉
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(状态.新增提示, true);
  机器.手动展开();
  assert.equal(状态.新增提示, false, '打开后清掉新增提示');
});

test('同 tick 换房 + 动作数从 0 到正数：按换房展开处理，不误判成同房新增提示', () => {
  const { clock, 状态, 机器 } = 新建机器();
  机器.更新({ mobile: true, roomId: null, actionCount: 0, suppressed: false });
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 1, suppressed: false });
  assert.equal(状态.展开, true, '同 tick 换房应自动展开');
  assert.equal(状态.新增提示, false, '不得当作同房新增提示');
  clock.前进(首次自动展开时长);
  assert.equal(状态.展开, false);
});

test('桌面断点切到手机且当前有动作：可作为第一次手机展示走 5 秒；卸载清理全部计时', () => {
  const { clock, 状态, 机器 } = 新建机器();
  机器.更新({ mobile: false, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(状态.展开, false);
  assert.equal(clock.待办数(), 0, '桌面不启动任何计时');
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(状态.展开, true, '切回手机作为第一次展示');
  clock.前进(首次自动展开时长);
  assert.equal(状态.展开, false);

  机器.更新({ mobile: true, roomId: '101', actionCount: 2, suppressed: false });
  assert.equal(clock.待办数(), 1);
  机器.销毁();
  assert.equal(clock.待办数(), 0, '销毁清理全部计时');
});

test('首次 5 秒展示生命周期内最多一次；桌面→手机同房只显示收起把手，断点切换不伪装成换房 3 秒；真实换房仍 3 秒', () => {
  const { clock, 状态, 机器 } = 新建机器();
  // 组件生命周期第一次手机展示 → 5 秒
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(状态.展开, true, '首次手机展示走 5 秒');
  clock.前进(首次自动展开时长);
  assert.equal(状态.展开, false);

  // 切到桌面：清计时/提示/手机展开态,但不清「首次已展示」生命周期标志
  机器.更新({ mobile: false, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(状态.展开, false);
  assert.equal(状态.新增提示, false);
  assert.equal(clock.待办数(), 0, '桌面清空全部计时');

  // 桌面→手机 仍同房：不得再走 5 秒,也不得伪装成换房走 3 秒;只显示收起把手
  机器.更新({ mobile: true, roomId: '垃圾房', actionCount: 2, suppressed: false });
  assert.equal(状态.展开, false, '断点切回同房不得自动展开(5 秒或 3 秒都不许)');
  assert.equal(状态.新增提示, false, '断点切回同房不得出现新增提示');
  assert.equal(clock.待办数(), 0, '断点切回同房不得产生计时器');

  // 手机态真实换房 → 仍走 3 秒
  机器.更新({ mobile: true, roomId: '101', actionCount: 3, suppressed: false });
  assert.equal(状态.展开, true, '手机态真实换房仍自动展开');
  clock.前进(换房自动展开时长);
  assert.equal(状态.展开, false, '换房 3 秒后收起');
});

// ═══ 结构契约：App 接线与常驻 ═══

test('App 导入并常驻接线抽屉组件；垃圾选择弹窗留在组件外；普通动作与两类门控保持', () => {
  assert.match(
    App源码,
    /import RoomActionsDrawer from '\.\/components\/房内操作抽屉\.vue';/,
    'App 应导入抽屉组件(Latin 首字符别名,同地图.vue→MapPopup 先例)',
  );
  const 模板段 = 提取模板(App源码);
  const 抽屉开始 = 模板段.indexOf('<RoomActionsDrawer');
  const 弹窗开始 = 模板段.indexOf('class="garbage-mask"');
  assert.ok(抽屉开始 >= 0 && 弹窗开始 > 抽屉开始, '抽屉组件应在垃圾弹窗之前(弹窗在组件外)');
  const 组件段 = 模板段.slice(抽屉开始, 模板段.indexOf('/>', 抽屉开始));
  assert.doesNotMatch(组件段, /v-if=/, '组件标签不得用 v-if 反复卸载(常驻接线)');
  for (const 接线 of [
    /:mobile="移动端"/,
    /:room-id="当前房间"/,
    /:action-count="可见房内动作数"/,
    /:suppressed="房内操作抑制"/,
    /:actions="普通房间动作"/,
    /:garbage-visible="垃圾入口可见"/,
    /:video-tape-active="录像带中"/,
    /@open-garbage="垃圾选择开 = true"/,
  ]) {
    assert.match(组件段, 接线, `App 应接线 ${接线}`);
  }
  // 原回调与两类门控语义保持(在 App 端只算可见性,动作执行与录像带门控在组件)
  assert.match(
    App源码,
    /const 垃圾入口可见 = computed\(\(\) => 当前房间\.value === '垃圾房' && 垃圾袋列表\.value\.length > 0\)/,
    '垃圾入口保持 垃圾房+有袋 原 v-if 语义',
  );
  assert.match(
    App源码,
    /const 普通动作可见数 = computed\(\(\) => \(录像带中\.value \? 0 : 普通房间动作\.value\.length\)\)/,
    '普通动作只在 !录像带中 时计入,不并入统一抑制',
  );
  assert.match(
    App源码,
    /const 房内操作抑制 = computed\(\(\) => 发送中\.value \|\| 静音会议正式中\.value \|\| \(移动端\.value && 键盘打开\.value\)\)/,
    '统一抑制 = 发送中 || 静音会议正式中 || (移动端 && 键盘打开)',
  );
  // 反向语义:键盘门必须带 移动端.value——桌面输入框 focus 时 键盘打开 不隐藏房内动作(桌面原样),
  // 与旧 keyboard-open CSS 只在 max-width:540px 媒体内生效等价;桌面/手机都抑制的仍是发送中与静音会议。
  assert.match(App源码, /房内操作抑制[\s\S]{0,80}\(移动端\.value && 键盘打开\.value\)/, '键盘门被 移动端.value 门控');
  const 移动端媒体段 = App源码.slice(App源码.lastIndexOf('@media (max-width: 540px)'));
  assert.match(
    移动端媒体段,
    /\.keyboard-open \.in-room-acts,/,
    'keyboard-open CSS 仍只在 max-width:540px 媒体内(桌面不受影响)',
  );
  assert.match(App源码, /^\.garbage-mask \{/m, '垃圾弹窗样式仍留 App');
  assert.match(App源码, /z-index: 145;/, '垃圾 modal 层级仍为 145,高于抽屉面板');
});

test('组件自身：消费 普通房间动作、触发动作收起并直调原回调、垃圾入口只发事件、无反向依赖', () => {
  const 模板段 = 提取模板(抽屉源码);
  assert.match(模板段, /v-for="\(动作, i\) in actions"/, '组件仍迭代普通房间动作');
  assert.match(
    抽屉源码,
    /const 普通动作可见 = computed\(\(\) => !props\.videoTapeActive && props\.actions\.length > 0\)/,
    '普通动作录像带门控在组件(旧 v-if 等价)',
  );
  assert.match(
    抽屉源码,
    /function 触发动作\(动作: 卡动作\): void \{\n {2}机器\.手动收起\(\);[\s\S]{0,40}动作\.做\(\);/,
    '动作点击后先收起,再直调原回调',
  );
  assert.doesNotMatch(抽屉源码, /await\s+动作\.做/, '不得包装/等待原回调');
  assert.doesNotMatch(抽屉源码, /try \{[\s\S]*?动作\.做\(\)[\s\S]*?\} catch/, '不得吞掉原回调异常');
  assert.match(抽屉源码, /function 触发垃圾[\s\S]{0,80}emit\('openGarbage'\)/, '垃圾入口只发事件,不持有 垃圾选择开');
  const 依赖 = 提取导入specifier(抽屉源码);
  assert.ok(!依赖.some(s => s.includes('App.vue') || s === './App' || s === '../App'), '组件不得反向导入 App');
  assert.ok(!依赖.some(s => s.includes('store')), '组件不得导入 store');
  assert.doesNotMatch(抽屉源码, /eventEmit\(|eventOn\(/, '组件不直连事件总线');
  // 只扫脚本段:CSS `overflow-wrap: anywhere` 的 `: any` 不得误判成 TS any
  assert.doesNotMatch(提取脚本(抽屉源码), /: any|\bFunction\b|\bas never\b/, '组件脚本段不得有类型逃逸');
  assert.match(抽屉源码, /import Ic from '\.\/Icon\.vue';/, '复用 Icon.vue');
  assert.match(
    抽屉源码,
    /import \{ 创建抽屉状态机, type 抽屉状态, type 抽屉状态机 \} from '\.\.\/composables\/抽屉状态机';/,
    '组件接纯状态机',
  );
  assert.doesNotMatch(状态机源码, /from 'vue'/, '状态机不依赖 Vue 运行时(纯函数可直测)');
  assert.doesNotMatch(状态机源码, /eventEmit\(|eventOn\(/, '状态机不直连事件总线');
});

// ═══ 结构契约：手机面板 / 桌面 / ARIA / 样式 ═══

test('手机：把手至少 44px 且只在手机渲染；面板 absolute 向上覆盖、限高滚动、z-index 低于垃圾 modal', () => {
  const 模板段 = 提取模板(抽屉源码);
  assert.match(模板段, /v-if="mobile"[\s\S]*?class="drawer-handle"/, '把手只在手机断点渲染');
  assert.match(模板段, /type="button"[\s\S]*?class="drawer-handle"/, '把手是 button 且 type=button');
  assert.match(模板段, /:aria-expanded="状态\.展开"/, '把手 aria-expanded');
  assert.match(模板段, /aria-controls="in-room-acts-panel"/, '把手 aria-controls');
  assert.match(模板段, /:role="mobile \? 'region' : undefined"/, '面板在手机断点 role=region');
  assert.match(模板段, /:aria-label="mobile \? '当前房间可执行操作' : undefined"/, '面板在手机断点有明确 aria-label');
  assert.match(
    抽屉源码,
    /\.drawer-handle \{\s*display: flex;\s*align-items: center;\s*gap: 6px;\s*width: 100%;\s*min-height: 44px;/m,
    '把手触控高度 44px',
  );
  assert.match(
    抽屉源码,
    /\.drawer-panel \{\s*position: absolute;\s*left: 0;\s*right: 0;\s*bottom: calc\(100% \+ 6px\);/m,
    '面板绝对定位向上覆盖',
  );
  assert.match(抽屉源码, /max-height: min\(40dvh, 280px\);/, '面板最大高度 min(40dvh,280px)');
  assert.match(抽屉源码, /overflow-y: auto;/, '面板内部纵向滚动');
  assert.match(抽屉源码, /overscroll-behavior: contain;/, '面板 overscroll 收敛');
  assert.match(抽屉源码, /z-index: 20;/, '面板 z-index 高于正文低于垃圾 modal 145');
  assert.match(抽屉源码, /focus-visible/, '把手有清晰 focus-visible');
});

test('桌面：把手隐藏、内容恒显且流内两列；窄屏两列不横溢', () => {
  const 模板段 = 提取模板(抽屉源码);
  assert.match(模板段, /v-if="mobile \? 状态\.展开 : true"/, '桌面内容恒显(流内),手机才受展开控制');
  assert.doesNotMatch(抽屉源码, /\.drawer-content \{\s*position: absolute;/, '桌面内容不得绝对定位(不参与正文高度)');
  assert.match(
    抽屉源码,
    /\.scene-acts \{\s*flex: none;\s*display: grid;\s*grid-template-columns: 1fr 1fr;/,
    '桌面两列保持',
  );
  assert.match(抽屉源码, /\.garbage-pick \{\s*flex: none;\s*display: flex;/, '垃圾入口流内保持');
  assert.match(
    抽屉源码,
    /@media \(max-width: 540px\)[\s\S]*?grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\);/,
    '窄屏两列最小宽度归零',
  );
  assert.match(抽屉源码, /overflow-wrap: anywhere;/, '窄屏长文案换行不横溢');
});

test('过渡只动 transform/opacity；rq-still 与 prefers-reduced-motion 都禁用；dark 补齐', () => {
  assert.match(
    抽屉源码,
    /\.drawer-enter-active,[\s\S]{0,30}\.drawer-leave-active \{\s*transition:\s*transform 0\.2s ease,\s*opacity 0\.2s ease;/,
    '过渡仅 transform/opacity 180-240ms',
  );
  assert.doesNotMatch(抽屉源码, /\.drawer-enter-active[\s\S]{0,120}(height|top|bottom):/, '过渡不得动画布局属性');
  assert.match(
    抽屉源码,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.drawer-enter-active/,
    'prefers-reduced-motion 禁用过渡',
  );
  assert.match(抽屉源码, /:global\(html\.rq-still \.drawer-enter-active\)/, 'html.rq-still 禁用过渡');
  assert.match(抽屉源码, /:global\(html\.rq-dark \.tile\) \{/, 'dark 瓷砖补齐');
  assert.match(抽屉源码, /:global\(html\.rq-dark \.drawer-panel\) \{/, 'dark 面板补齐');
  assert.match(抽屉源码, /:global\(html\.rq-dark \.drawer-handle\) \{/, 'dark 把手补齐');
  assert.doesNotMatch(
    抽屉源码,
    /:global\(html\.rq-(dark|still)\) \./,
    '完整复合选择器整体放进 :global,不得拆成 `:global(html.rq-x) .sel`',
  );
});

test('App 端 CSS 所有权迁移与 keyboard-open：dock/peep 旧选择器不回退，新抽屉根参与隐藏', () => {
  // 瓷砖/两列/kicker 规则迁出 App,由抽屉组件自持
  for (const sel of [
    '^\\.tile \\{',
    '^\\.tile \\.ic \\{',
    '^\\.act-kicker \\{',
    '^\\.scene-acts \\{',
    '^\\.garbage-pick \\{',
    '^\\.garbage-open \\{',
  ]) {
    assert.doesNotMatch(App源码, new RegExp(sel, 'm'), `App 不应再持有 ${sel}`);
  }
  for (const sel of [
    '.tile {',
    '.tile .ic {',
    '.tile.risky .ic {',
    '.act-kicker {',
    '.scene-acts {',
    '.garbage-pick {',
    '.garbage-open {',
  ]) {
    assert.match(抽屉源码, new RegExp(转义(sel)), `抽屉组件应持有 ${sel}`);
  }
  // keyboard-open: dock 与 peep-card 旧语义保留,旧 scene-acts/garbage-pick 选择器换成抽屉根
  assert.match(
    App源码,
    /\.keyboard-open \.dock,[\s\S]*?\.keyboard-open \.in-room-acts,[\s\S]*?\.keyboard-open \.peep-card \{/,
    'App keyboard-open 命中 dock/抽屉根/peep-card',
  );
  assert.doesNotMatch(App源码, /\.keyboard-open \.scene-acts/, 'App keyboard-open 不再命中旧 .scene-acts');
  assert.doesNotMatch(App源码, /\.keyboard-open \.garbage-pick/, 'App keyboard-open 不再命中旧 .garbage-pick');
});

test('抽屉组件 scoped 样式可编译；完整 :global 后代选择器保留且不带 scoped 属性，普通规则仍带', async () => {
  const requireSfc = createRequire(import.meta.url);
  const { parse, compileStyle } = requireSfc('vue/compiler-sfc');
  const { descriptor } = parse(抽屉源码, { filename: '移动端房内操作抽屉-scoped.vue' });
  const 样式块 = descriptor.styles.find(s => s.scoped);
  assert.ok(样式块, '抽屉组件应有 scoped style 块');
  const 编译 = compileStyle({
    source: 样式块.content,
    filename: '移动端房内操作抽屉-scoped.vue',
    id: 'data-v-drawer-scoped',
    scoped: true,
  });
  assert.deepEqual(编译.errors, [], '抽屉组件 scoped 编译不应有 error');

  // 完整复合选择器整体放进 :global 时,编译产物必须保留完整后代选择器,且整体不带组件 scoped 属性。
  assert.match(编译.code, /html\.rq-dark \.tile\s*\{/, 'dark .tile 编译后保留完整后代选择器');
  assert.match(编译.code, /html\.rq-dark \.drawer-panel\s*\{/, 'dark .drawer-panel 编译后保留完整后代选择器');
  assert.match(编译.code, /html\.rq-dark \.drawer-handle\s*\{/, 'dark .drawer-handle 编译后保留完整后代选择器');
  assert.match(编译.code, /html\.rq-still \.drawer-enter-active/, 'rq-still 减动效保留完整后代选择器');
  assert.match(编译.code, /html\.rq-still \.drawer-handle \.handle-arrow/, 'rq-still 箭头保留完整后代选择器');

  // 完整 :global 选择器整体编译后不得带组件 scoped 属性。
  assert.doesNotMatch(编译.code, /html\.rq-dark \.tile\[data-v-/, 'dark .tile 不得带 scoped 属性');
  assert.doesNotMatch(编译.code, /html\.rq-dark \.drawer-panel\[data-v-/, 'dark .drawer-panel 不得带 scoped 属性');
  assert.doesNotMatch(编译.code, /html\.rq-dark \.drawer-handle\[data-v-/, 'dark .drawer-handle 不得带 scoped 属性');
  assert.doesNotMatch(编译.code, /html\.rq-still \.drawer-enter-active\[data-v-/, 'rq-still 减动效不得带 scoped 属性');

  // 不得退化成只命中 html.rq-dark / html.rq-still 的裸规则(旧写法会吃掉后代选择器)。
  assert.doesNotMatch(编译.code, /html\.rq-dark\s*\{/, 'html.rq-dark 不得退化成裸选择器');
  assert.doesNotMatch(编译.code, /html\.rq-still\s*\{/, 'html.rq-still 不得退化成裸选择器');

  // 普通 scoped 规则仍命中组件 scoped 属性。
  assert.match(编译.code, /\.drawer-handle\[data-v-[^\]]*\]/, '把手规则编译后命中 scoped 属性');
  assert.match(编译.code, /\.drawer-panel\[data-v-[^\]]*\]\s*\{/, '面板规则编译后命中 scoped 属性');
});

test('无中文首字符组件 tag；App 与组件均不触碰 dist', () => {
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  assert.doesNotMatch(抽屉源码, /dist\//, '抽屉组件不得引用 dist');
  assert.doesNotMatch(状态机源码, /dist\//, '状态机不得引用 dist');
});
