/* eslint-disable import-x/no-nodejs-modules -- Node-only source regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 快照源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts', 'utf8');
const 客户端源 = readFileSync('src/人妻公寓/界面/客户端/App.vue', 'utf8');

test('普通正文快照不再注入风闻感知或楼内空气', () => {
  assert.doesNotMatch(快照源, /function 风闻感知/);
  assert.doesNotMatch(快照源, /【楼内空气】/);
  assert.doesNotMatch(快照源, /data\.风闻/);
});

test('HUD 风闻统一使用 25、50、75、100 四档并显示状态', () => {
  for (const 阈值 of [25, 50, 75, 100]) assert.match(客户端源, new RegExp(`值: ${阈值}`));
  assert.match(客户端源, /\['平静', '留意', '议论', '盯防', '危机'\]/);
  assert.match(客户端源, /v-for="n in 4"/);
  assert.match(客户端源, /rumor-level-\$\{风闻档位\}/);
});

test('风闻详情只读展示三条来源、投诉危机与两类平息提示', () => {
  assert.match(客户端源, /@click="显示风闻详情 = true"/);
  assert.match(客户端源, /\.slice\(0, 3\)/);
  assert.match(客户端源, /最近来源/);
  assert.match(客户端源, /当前投诉事件/);
  assert.match(客户端源, /危机活跃/);
  assert.match(客户端源, /自然平息/);
  assert.match(客户端源, /住户公关/);
  assert.match(客户端源, /聚餐冷却至/);
  assert.match(客户端源, /事件\.父亲责任/);
  assert.doesNotMatch(客户端源, /危机活跃期间不会自然平息/);
  assert.match(客户端源, /危机.*不得低于 50|不得低于 50.*危机/);
});
