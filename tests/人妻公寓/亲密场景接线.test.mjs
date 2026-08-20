/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 偏好源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/composables/useUIPrefs.ts', import.meta.url), 'utf8');
const 快照源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts', import.meta.url), 'utf8');
const 游戏逻辑源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

function 截段(源, 开始标记, 结束标记) {
  const 开始 = 源.indexOf(开始标记);
  assert.notEqual(开始, -1, `缺少开始标记：${开始标记}`);
  const 结束 = 源.indexOf(结束标记, 开始);
  assert.notEqual(结束, -1, `缺少结束标记：${结束标记}`);
  return 源.slice(开始, 结束);
}

test('突然离场使用单飞任务：并发第二次移动等待首笔惩罚后失败关闭，且不跨场次遗留确认', () => {
  const 离场段 = 截段(App源, 'let 亲密离场处理中', '\nasync function 进入');
  assert.doesNotMatch(App源, /亲密离场已确认/);
  assert.match(离场段, /Promise<boolean> \| null/);
  assert.match(离场段, /if \(亲密离场处理中\)[\s\S]{0,160}await 亲密离场处理中;[\s\S]{0,80}return false/);
  assert.match(离场段, /window\.confirm/);
  assert.match(离场段, /await Promise\.resolve\(eventEmit\('人妻公寓:性爱突然离场'\)\)/);
  assert.match(离场段, /finally[\s\S]{0,160}亲密离场处理中 = null/);
});

test('收尾选择在场景推进或行为变化时清空，确认前再次校验当前合法选项', () => {
  const 监听段 = 截段(App源, 'const 待确认收尾位置', 'const 性爱参与者列表');
  const 确认段 = 截段(App源, 'function 确认亲密收尾', '\nfunction 确认失控收尾');
  assert.match(监听段, /有效楼数/);
  assert.match(监听段, /当前行为/);
  assert.match(监听段, /保护状态/);
  assert.match(监听段, /主焦点门牌/);
  assert.match(确认段, /收尾选项\.value\.includes\(位置\)/);
  assert.match(确认段, /待确认收尾位置\.value = ''/);
});

test('收尾部位按完整存档中的主焦点阶段统一生成，并把对应约束送入 AI 快照', () => {
  const 选项段 = 截段(App源, 'const 收尾选项', 'const 资源详情');
  assert.match(App源, /class="intimacy-finish-label">射精部位</);
  assert.match(选项段, /构造亲密收尾选项\(data\.value\)/);
  assert.match(快照源, /亲密收尾选项\(data\)/);
  assert.match(快照源, /亲密收尾AI提示\(收尾位置\)/);
  assert.match(快照源, /\$\{收尾演出约束\}/);
});

test('亲密状态栏显示偏好命中，并在结束后短暂展示逐角色结果卡', () => {
  assert.match(App源, /class="intimacy-preference hit"/);
  assert.match(App源, /SCENE RESULT/);
  assert.match(App源, /项\.时长评价/);
  assert.match(App源, /项\.结局态度/);
  assert.match(App源, /duration-过久/);
  assert.doesNotMatch(App源, /duration-超满意/);
  assert.match(App源, /显示性爱结果卡\.value = true/);
  assert.match(
    App源,
    /安排客户端延迟\(\(\) => \(显示性爱结果卡\.value = false\), 8000\)/,
    '结果卡自动收起必须进入 App 生命周期可取消延迟表',
  );
  assert.match(快照源, /判定角色性爱结果/);
  assert.doesNotMatch(快照源, /本楼后达标|本楼后仍未达标/);
});

test('亲密详情默认收在正文舞台底边，展开后使用舞台抽屉而非横向角色列表', () => {
  assert.match(App源, /const 亲密抽屉展开 = ref\(false\)/);
  assert.match(App源, /class="intimacy-stage-dock"/);
  assert.match(App源, /class="intimacy-summary"/);
  assert.match(App源, /:aria-expanded="亲密抽屉展开"/);
  assert.match(App源, /v-if="亲密抽屉展开" class="intimacy-panel"/);
  assert.match(App源, /\.intimacy-stage-dock\s*\{[\s\S]{0,220}position:\s*absolute/);
  assert.match(App源, /\.intimacy-people\s*\{[\s\S]{0,160}display:\s*grid/);
  assert.doesNotMatch(截段(App源, '.intimacy-people {', '.intimacy-people article'), /overflow-x/);
});

test('角色卡切换持久主焦点，快照明确主焦点与非焦点参与限制', () => {
  assert.match(App源, /eventEmit\('人妻公寓:切换性爱主焦点', 门牌号\)/);
  assert.match(游戏逻辑源, /eventOn\('人妻公寓:切换性爱主焦点'/);
  assert.match(快照源, /主焦点:/);
  assert.match(快照源, /非焦点参与者只有在正文明确写出她实际加入亲密动作时才计入本楼参与/);
});

test('移动端断点会随 iframe 画幅变化同步，避免窄屏仍保留桌面主题按钮', () => {
  // A3:媒体断点监听归 composables/useUIPrefs.ts，App 只经共享单例消费 移动端
  assert.match(偏好源, /const 移动端媒体 = window\.matchMedia\('\(max-width: 540px\)'\)/);
  assert.match(偏好源, /移动端媒体\.addEventListener\('change', 同步移动端断点\)/);
  assert.match(偏好源, /移动端媒体\.removeEventListener\('change', 同步移动端断点\)/);
  assert.match(App源, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/);
  assert.match(App源, /const \{[\s\S]*?移动端,[\s\S]*?\} = useUIPrefs\(/);
});

test('移动端媒体规则必须把全屏选择卡从基础隐藏态改为可见布局', () => {
  const 媒体开始 = App源.indexOf('@media (max-width: 540px)');
  const 规则开始 = App源.indexOf('.mobile-fullscreen-cta {', 媒体开始);
  const 规则结束 = App源.indexOf('\n  }', 规则开始);
  assert.ok(媒体开始 >= 0 && 规则开始 > 媒体开始 && 规则结束 > 规则开始);
  assert.match(App源.slice(规则开始, 规则结束), /display:\s*grid/);
});
