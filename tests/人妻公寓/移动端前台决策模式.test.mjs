/* eslint-disable import-x/no-nodejs-modules -- Node-only source contract regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('App.vue', 客户端目录), 'utf8');
const 行动选项源码 = readFileSync(new URL('components/行动选项.vue', 客户端目录), 'utf8');
const 回合输入源码 = readFileSync(new URL('components/回合输入.vue', 客户端目录), 'utf8');
const 静音会议会后源码 = readFileSync(new URL('components/静音会议会后.vue', 客户端目录), 'utf8');

test('监控选择与静音会议散会选择进入硬前台决策，但普通行动建议和录像带不被误锁', () => {
  assert.match(
    App源码,
    /const 前台硬决策中 = computed\(\s*\(\) => 偷窥决策中\.value \|\| 静音会议待散会选择\.value,?\s*\);/,
  );
  assert.match(App源码, /const 偷窥决策中 = computed\(\(\) => Boolean\(偷窥待选\.value\)\);/);
  assert.doesNotMatch(
    App源码,
    /const 前台硬决策中 = computed\([^;]*(?:显示选项|录像带交互幕|录像带中)/,
    '普通建议和录像带有各自语义，不能被批量升级成硬决策',
  );
});

test('监控硬决策保留正文、收起无关操作，并且选择提交前不乐观清掉持久挂起', () => {
  assert.match(App源码, /<div class="page" :class="\{ 'foreground-decision': 前台硬决策中 \}">/);
  assert.match(App源码, /:suppressed="房内操作抑制 \|\| 前台硬决策中"/);
  assert.match(App源码, /:open="显示选项[^\n]*&& !前台硬决策中"/);
  assert.match(App源码, /:decision-mode="前台决策输入模式"/);
  assert.match(App源码, /<nav v-if="!录像带中 && !前台硬决策中"/);
  assert.match(App源码, /前台硬决策中\s*\? '请先完成当前画面的判断'/);

  assert.match(App源码, /class="peep-card"[\s\S]{0,220}collapsed: 偷窥决策收起/);
  assert.match(App源码, /class="peep-collapse"[\s\S]{0,180}@click="偷窥决策收起 = !偷窥决策收起"/);
  assert.match(App源码, /class="peep-options"[\s\S]{0,260}:disabled="界面事务提交中"/);
  assert.doesNotMatch(
    App源码.match(/function 选细节\([\s\S]*?\n\}/)?.[0] ?? '',
    /偷窥待选\.value = null/,
    '提交失败时选择必须仍可恢复，不能在前端先永久消失',
  );
  assert.match(
    App源码,
    /eventOn\('人妻公寓:回合失败'[\s\S]*?刷新行动选项\(\);[\s\S]*?刷新偷窥待选\(\);/,
    '监控生成失败会读到脚本清账；答案提交失败则从仍存活的持久挂起恢复',
  );
  assert.match(App源码, /function 发出\(文本: string\)[\s\S]{0,260}if \(偷窥决策中\.value\)/, '普通行动不能绕过监控硬决策');
  assert.match(App源码, /function 发起时间推进\([^)]*\)[\s\S]{0,220}if \(偷窥决策中\.value\)/, '时间推进不能绕过监控硬决策');

  assert.match(
    App源码,
    /@media \(max-width: 540px\)[\s\S]*?\.page\.foreground-decision \.story-wrap \{[\s\S]*?min-height:\s*clamp\(/,
  );
  assert.match(App源码, /\.page\.foreground-decision \.peep-card \{[\s\S]*?max-height:\s*min\(40dvh, 300px\)/);
  assert.match(App源码, /\.peep-options \{[\s\S]*?overflow-y:\s*auto/);
});

test('普通行动建议在手机上变为覆盖式可收起抽屉，桌面仍直接显示两列', () => {
  assert.match(行动选项源码, /mobile:\s*boolean/);
  assert.match(行动选项源码, /class="option-drawer-handle"/);
  assert.match(行动选项源码, /min-height:\s*44px/);
  assert.match(行动选项源码, /class="option-drawer-panel"/);
  assert.match(行动选项源码, /position:\s*absolute/);
  assert.match(行动选项源码, /max-height:\s*min\(40dvh, 280px\)/);
  assert.match(行动选项源码, /overflow-y:\s*auto/);
  assert.match(行动选项源码, /v-else[\s\S]{0,180}class="option-row desktop-option-row"/);
  assert.match(
    行动选项源码,
    /watch\([\s\S]*?props\.open[\s\S]*?props\.mobile[\s\S]*?props\.options[\s\S]*?展开\.value = false/,
    '关闭、换画幅或新一组选项不能复活旧展开态',
  );
  assert.match(App源码, /<ActionOptions[\s\S]{0,180}:mobile="移动端"/);
});

test('静音会议长名单内部滚动；回合输入按硬决策类型只保留必要的散会总结', () => {
  assert.match(
    静音会议会后源码,
    /@media \(max-width: 540px\)[\s\S]*?\.mute-dismiss-panel \{[\s\S]*?max-height:\s*min\(40dvh, 320px\)[\s\S]*?overflow:\s*hidden/,
  );
  assert.match(静音会议会后源码, /\.mute-after-wives \{[\s\S]*?overflow-y:\s*auto/);

  assert.match(回合输入源码, /decisionMode:\s*'none' \| 'blocked' \| 'summary'/);
  assert.match(回合输入源码, /v-if="open && decisionMode !== 'blocked'" class="quill"/);
  assert.match(回合输入源码, /v-if="decisionMode === 'none' && sending && retryAction"/);
  assert.match(回合输入源码, /decisionMode === 'none'[\s\S]{0,260}class="global-time-advance"/);
  assert.match(
    App源码,
    /const 前台决策输入模式 = computed<前台决策输入模式>\(\(\) =>[\s\S]*?偷窥决策中\.value[\s\S]*?'blocked'[\s\S]*?静音会议待散会选择\.value[\s\S]*?'summary'/,
  );
});
