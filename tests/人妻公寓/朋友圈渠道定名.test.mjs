/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
/**
 * 回归：侦探渠道「动态广场」（初版定名）全量改称「朋友圈」（2026-08-27 用户要求）。
 *
 * 语义：渠道名是三处共同消费的同一份真值——静态配置（户静态表.渠道 / 裂缝表.渠道 /
 * 死路提示的键）、产出层硬门（考古选细节 / 考古到底）、展示层取数（档案卡按渠道 switch、
 * App 的证物槽）。任何一处漏改都会让 301 的考古硬门静默失效：错渠道判定把 301 当成非
 * 朋友圈户 → 永不出题 → 玩家永远集不齐四张碎片。
 *
 * 本文件因此同时验证：(a) 配置层已全部改名且不残留旧名；(b) 硬门与展示层都按新名匹配，
 * 301 仍能出题、101 仍是死路；(c) 反例——死路计数键必须保留旧字面 '动态广场:混排'，
 * 因为它是存量 chat 变量 `_侦探.死路` 里的历史键，改键会清零老档已累积的死路档位。
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let chatVars = {};
globalThis.getVariables = () => chatVars;
globalThis.insertOrAssignVariables = patch => {
  chatVars = lodash.merge({}, chatVars, patch);
};

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 门牌列表, 户静态表, 查裂缝, 查考古 } = require('../../src/人妻公寓/stageConfig.ts');
const { 考古到底, 考古选细节 } = require('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts');

const 档案卡源 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url),
  'utf8',
);
const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 侦探源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts', import.meta.url), 'utf8');
const 配置源 = readFileSync(new URL('../../src/人妻公寓/stageConfig.ts', import.meta.url), 'utf8');

function 建数据() {
  const 户 = {};
  for (const 门牌号 of 门牌列表) 户[门牌号] = 创建户节点(0);
  return Schema.parse({ 户, 系统: { _绝对时段: 0 } });
}

test('静态配置层的渠道名已全部是朋友圈：301 是朋友圈户，且无一户仍叫动态广场', () => {
  assert.equal(户静态表['301'].渠道, '朋友圈', '301 的专属渠道必须是朋友圈');
  assert.equal(查裂缝('301')?.渠道, '朋友圈', '裂缝表与户静态表必须是同一个渠道名');
  for (const 门牌号 of 门牌列表) {
    assert.notEqual(户静态表[门牌号].渠道, '动态广场', `${门牌号} 不得残留初版定名`);
    assert.notEqual(查裂缝(门牌号)?.渠道, '动态广场', `${门牌号} 裂缝配置不得残留初版定名`);
  }
});

test('死路提示的键随之改名：有朋友圈档位的户都用新键，旧键一个不留', () => {
  let 命中 = 0;
  for (const 门牌号 of 门牌列表) {
    const 提示 = 查裂缝(门牌号)?.死路提示 ?? {};
    assert.equal(
      Object.prototype.hasOwnProperty.call(提示, '动态广场'),
      false,
      `${门牌号} 的死路提示不得再用旧键 动态广场（旧键=永远取不到文案=死路只出兜底句）`,
    );
    if (typeof 提示['朋友圈'] === 'string' && 提示['朋友圈']) 命中 += 1;
  }
  assert.ok(命中 >= 4, `至少四户配了朋友圈死路文案，实际 ${命中}`);
});

test('产出层硬门按新名匹配：301 仍能出题掉碎片', () => {
  chatVars = {};
  const data = 建数据();
  const 关键序号 = 查考古('301')
    .map((条, 序) => ({ 条, 序 }))
    .filter(({ 条 }) => 条.关键)
    .map(({ 序 }) => 序);
  assert.ok(关键序号.length >= 4, '301 必须有至少四条关键动态');
  const 首题序 = 关键序号[0];
  const 首题 = 查考古('301')[首题序];
  const 结果 = 考古选细节(data, '301', 首题序, 首题.关键.正确);
  assert.equal(结果.碎片到手, true, '改名后 301 的考古硬门必须仍然认得自己的渠道');
  assert.equal(data.户['301'].妻.裂缝.碎片进度, 1);
});

test('反例：错渠道户仍是硬门死路，改名没有把 101 放进出题名单', () => {
  chatVars = {};
  const data = 建数据();
  const 序 = 查考古('101').findIndex(条 => 条.关键);
  // 101 是翻垃圾渠道，其考古表按纪律只有填充条、没有关键条 → 永不出题。
  assert.equal(序, -1, '101 不得拥有关键动态');
  const 结果 = 考古选细节(data, '101', 0, 0);
  assert.equal(结果.碎片到手, undefined, '错渠道户不得掉碎片');
  assert.equal(data.户['101'].妻.裂缝.碎片进度, 0);
});

test('考古到底按新名认题：301 未确认时提醒漏看，不落全局死路计数', () => {
  chatVars = {};
  const data = 建数据();
  const 结果 = 考古到底(data);
  assert.match(结果.提示, /在你漏看的那几条里/, '楼里还有朋友圈渠道的题没做完时必须提醒');
  assert.equal(chatVars._侦探?.死路?.['动态广场:混排'], undefined, '有题在身不得计死路');
});

test('反例：死路计数键必须保留旧字面 动态广场:混排（存量 chat 变量的历史键）', () => {
  chatVars = {};
  const data = 建数据();
  // 全楼裂缝都已确认 → 再翻到底即为全局死路，此时才会写计数。
  for (const 门牌号 of 门牌列表) data.户[门牌号].妻.裂缝.已确认 = true;
  const 结果 = 考古到底(data);
  assert.doesNotMatch(结果.提示, /在你漏看的那几条里/);
  assert.equal(
    chatVars._侦探?.死路?.['动态广场:混排'],
    1,
    '改键会让老档已累积的死路档位一夜清零，因此计数键只能沿用初版字面',
  );
  assert.match(侦探源, /const key = '动态广场:混排';/, '计数键必须仍是旧字面');
  assert.match(侦探源, /存量 chat 变量/, '必须就地写明为何这里不跟着改名');
});

test('展示层与产出层用同一个新渠道名，且两处都不再出现旧名', () => {
  assert.match(档案卡源, /case '朋友圈':/, '档案卡的线索取数必须按新名 switch');
  assert.doesNotMatch(档案卡源, /动态广场/, '档案卡不得残留旧名（旧名=该户线索板永远空白）');
  assert.match(App源, /渠道 === '朋友圈'/, 'App 的裂缝证物槽必须按新名判定');
  assert.doesNotMatch(App源, /动态广场/, 'App 不得残留旧名');
  assert.match(侦探源, /配\?\.渠道 === '朋友圈'/, '考古硬门必须按新名判定');
  assert.match(侦探源, /死路提示\['朋友圈'\]/, '死路定性必须按新名取文案');
  // 配置层只允许在“初版定名”的注释里出现旧名，代码字面不得残留。
  assert.doesNotMatch(配置源, /渠道: '动态广场'/, '配置层不得残留旧渠道字面');
  assert.doesNotMatch(配置源, /^\s*动态广场:/m, '死路提示不得残留旧键字面');
});
