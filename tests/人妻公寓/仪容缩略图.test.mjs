/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 界面源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

test('仪容服饰使用固定小缩略图，不再按两列拉伸到半张档案卡', () => {
  const 开始 = 界面源.indexOf('/* 仪容图鉴：');
  const 结束 = 界面源.indexOf('/* ═══ 设置弹窗', 开始);
  assert.notEqual(开始, -1);
  assert.notEqual(结束, -1);
  const 样式 = 界面源.slice(开始, 结束);

  assert.match(样式, /\.attire-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill,\s*84px\)/s);
  assert.match(样式, /\.attire-grid\s*\{[^}]*justify-content:\s*start/s);
  assert.doesNotMatch(样式, /grid-template-columns:\s*1fr 1fr/);
  assert.doesNotMatch(界面源, /\.attire-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
});
