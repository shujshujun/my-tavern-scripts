/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// A5b 拆分后：仪容图鉴模板与专属 CSS 已随档案卡迁入 components/档案卡.vue。
const 界面源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 档案卡源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url),
  'utf8',
);

test('仪容服饰使用固定小缩略图，不再按两列拉伸到半张档案卡', () => {
  const 开始 = 档案卡源码.indexOf('/* 仪容图鉴：');
  const 结束 = 档案卡源码.indexOf('.crack-hint {', 开始);
  assert.notEqual(开始, -1);
  assert.notEqual(结束, -1);
  const 样式 = 档案卡源码.slice(开始, 结束);

  assert.match(样式, /\.attire-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill,\s*84px\)/s);
  assert.match(样式, /\.attire-grid\s*\{[^}]*justify-content:\s*start/s);
  assert.doesNotMatch(样式, /grid-template-columns:\s*1fr 1fr/);
  assert.doesNotMatch(档案卡源码, /\.attire-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.doesNotMatch(界面源, /\.attire-grid/, 'App 已随档案卡移除 .attire-grid');
});
