/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// v0.80 电脑窗口“隐藏正文”后成人 CG 仍被亲密底栏遮挡的契约测试。
// 纯 UI 层级修复：仅当 story-wrap 同时满足 成人CG + 纯画面欣赏(story-visual-only) 时，
// 才把 CG 提到亲密底栏(z-index 12)之上，并把恢复按钮提到 CG 之上；普通立绘/无 CG 不匹配该窄范围选择器。
const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 偏好源 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/composables/useUIPrefs.ts', import.meta.url),
  'utf8',
);

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 提取以 选择器 开头且独占一行的 CSS 块体（不含花括号）。 */
function 提取块(源, 选择器) {
  const 匹配 = 源.match(new RegExp(`^${转义(选择器)} \\{([\\s\\S]*?)\\n\\}`, 'm'));
  return 匹配?.[1] ?? '';
}

function 提取zindex(块) {
  const 匹配 = 块.match(/z-index:\s*(\d+);/);
  return 匹配 ? Number(匹配[1]) : null;
}

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源 => 源.slice(源.indexOf('<template>'), 源.lastIndexOf('</template>'));

test('模板把 正文隐藏 ref 派生到 story-visual-only class；隐藏按钮切换与门控保持', () => {
  const 模板段 = 提取模板(App源);
  const 故事起点 = 模板段.indexOf('class="story-wrap"');
  assert.notEqual(故事起点, -1, '模板应含 story-wrap');
  const 故事标签 = 模板段.slice(故事起点, 模板段.indexOf(':style="[场景色, 场景图样式]"', 故事起点));
  assert.match(故事标签, /'story-visual-only': 正文隐藏,/, '正文隐藏 ref 应派生纯画面 class story-visual-only');
  assert.match(故事标签, /'story-adult-cg': 显示成人CG,/, '成人 CG class 仍只跟 显示成人CG');
  assert.match(故事标签, /'story-glory': !!荣耀洞图,/, 'story-glory 保持');
  assert.match(故事标签, /'story-special-interaction': 录像带交互幕 \|\| 静音会议交互幕,/, 'story-special-interaction 保持');
  assert.match(故事标签, /'story-mute-meeting': 静音会议显示组合图,/, 'story-mute-meeting 保持');
  assert.match(故事标签, /'story-intimacy-open': 性爱进行中 && 亲密抽屉展开,/, 'story-intimacy-open 保持');
  assert.match(模板段, /class="story-hide-btn"/, '隐藏正文钮仍在');
  assert.match(模板段, /v-if="!录像带中 && !静音会议交互幕"/, '隐藏正文钮门控保持');
  assert.match(模板段, /@click\.stop="正文隐藏 = !正文隐藏"/, '隐藏按钮仍切换 正文隐藏');
  assert.match(
    模板段,
    /:veiled="正文隐藏 \|\| 录像带交互幕 \|\| 静音会议交互幕 \|\| !!当前事件CG"/,
    '正文卷轴仍按 正文隐藏 渐隐，家庭计划或生产专属画面打开时也必须遮住正文',
  );
});

test('窄范围层级规则：仅 story-adult-cg + story-visual-only 同时成立才提升 CG，普通 CG 不全局提升', () => {
  const 普通CG层 = 提取zindex(提取块(App源, '.adult-cg-stage'));
  assert.equal(普通CG层, 1, '普通成人 CG 基线层级应保持 1（不得全局提升）');
  const 普通按钮层 = 提取zindex(提取块(App源, '.story-hide-btn'));
  assert.equal(普通按钮层, 3, '普通隐藏按钮层级应保持 3（不得全局提升）');
  // 窄范围规则必须以双 class 选择器出现
  const 纯CG规则 = 提取块(App源, '.story-wrap.story-adult-cg.story-visual-only .adult-cg-stage');
  const 纯钮规则 = 提取块(App源, '.story-wrap.story-adult-cg.story-visual-only .story-hide-btn');
  assert.ok(纯CG规则, '应存在 纯画面+CG 提升 CG 的窄范围规则');
  assert.ok(纯钮规则, '应存在 纯画面+CG 提升恢复按钮的窄范围规则');
  // 反例：不得用纯画面 class 单独命中 CG/按钮，也不得用成人CG class 单独命中 CG
  assert.doesNotMatch(App源, /^\.story-visual-only \.adult-cg-stage \{/m, '不得以 纯画面 class 单独提升 CG');
  assert.doesNotMatch(App源, /^\.story-visual-only \.story-hide-btn \{/m, '不得以 纯画面 class 单独提升按钮');
  assert.doesNotMatch(App源, /^\.story-adult-cg \.adult-cg-stage \{/m, '不得以 成人CG class 单独提升 CG');
});

test('纯画面下 CG 层级严格大于亲密底栏(12)，恢复按钮严格大于 CG，恢复入口存在', () => {
  const 亲密层 = 提取zindex(提取块(App源, '.intimacy-stage-dock'));
  assert.equal(亲密层, 12, '亲密底栏基线层级应保持 12');
  const 纯CG规则 = 提取块(App源, '.story-wrap.story-adult-cg.story-visual-only .adult-cg-stage');
  const 纯钮规则 = 提取块(App源, '.story-wrap.story-adult-cg.story-visual-only .story-hide-btn');
  const cg层 = 提取zindex(纯CG规则);
  const 钮层 = 提取zindex(纯钮规则);
  assert.ok(cg层 !== null && cg层 > 12, `纯画面 CG 层级(${cg层})应严格大于亲密底栏 12`);
  assert.ok(钮层 !== null && 钮层 > cg层, `纯画面恢复按钮层级(${钮层})应严格大于纯画面 CG(${cg层})`);
});

test('CG 前景仍 object-fit: contain；不改为 cover、不放大画框', () => {
  const 前景块 = 提取块(App源, '.adult-cg-stage img');
  assert.match(前景块, /position:\s*absolute;/, 'CG 前景应脱离 grid 固有尺寸计算，避免竖图按宽度撑高后被裁切');
  assert.match(前景块, /inset:\s*0;/, 'CG 前景应固定使用完整舞台作为 contain 画框');
  assert.match(前景块, /width:\s*100%;/, 'CG 前景宽度应等于舞台');
  assert.match(前景块, /height:\s*100%;/, 'CG 前景高度应等于舞台');
  assert.match(前景块, /object-fit:\s*contain;/, 'CG 前景图仍应为 object-fit: contain');
  assert.doesNotMatch(前景块, /object-fit:\s*cover;/, '不得改为 cover');
  assert.match(前景块, /object-position:\s*center;/, 'object-position 保持 center');
});

test('760px 以上成人 CG 使用等权双列，窄窗只挂载第一槽且单例自动居中', () => {
  const 模板段 = 提取模板(App源);
  assert.match(模板段, /v-for="槽 in 当前成人CG显示槽位"/, '模板按响应式可见槽位渲染');
  assert.match(模板段, /'adult-cg-stage-double': 当前成人CG显示槽位\.length > 1/, '只有真实两槽时才启用双列');
  assert.match(App源, /选择CG显示槽位\(当前成人CG槽位\.value, 成人CG双列\.value\)/, '窄窗应从状态层裁成单槽');
  assert.match(偏好源, /matchMedia\('\(min-width: 760px\)'\)/, '双列断点跟随 iframe 实际画幅');
  assert.match(
    App源,
    /@media \(min-width: 760px\) \{[\s\S]*?\.adult-cg-stage-double \.adult-cg-grid \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    '宽桌面应切为两个等权画框',
  );
  assert.match(App源, /\.adult-cg-grid \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);/, '基础布局保持单列');
  assert.match(App源, /\.adult-cg-frame\.loading img \{[\s\S]*?opacity: 0;/, '每槽独立 loading');
  assert.doesNotMatch(App源, /\.adult-cg-stage\.loading img/, '第二张慢时不得把第一张一起隐藏');
});

test('反例：亲密底栏不卸载、不 v-if 掉、不被纯画面 class 施加样式', () => {
  assert.match(App源, /v-if="性爱进行中"[\s\S]{0,40}class="intimacy-stage-dock"/, '亲密底栏仍按 性爱进行中 渲染，不得被 v-if 掉');
  assert.match(App源, /class="intimacy-summary"/, '亲密底栏汇总仍保留');
  assert.doesNotMatch(App源, /story-visual-only[\s\S]{0,120}\.intimacy-stage-dock\s*\{/, '纯画面 class 不得对亲密底栏施加 CSS');
  assert.doesNotMatch(App源, /story-visual-only[\s\S]{0,120}\.intimacy-summary\s*\{/, '纯画面 class 不得对亲密底栏汇总施加 CSS');
});
