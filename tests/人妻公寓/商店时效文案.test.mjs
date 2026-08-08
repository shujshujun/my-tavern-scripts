/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 商店组件源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/商店.vue', import.meta.url), 'utf8');
const 商店源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts', import.meta.url), 'utf8');
const 设计源 = readFileSync(new URL('../../src/人妻公寓/设计spec.md', import.meta.url), 'utf8');

test('商店统一显示小时达，并明确本时段内送达而非次日配送', () => {
  // A5a:面板正文归 components/商店.vue；App dock title 仍在 App
  assert.match(App源, /网购商城,小时达,本时段内送到管理员室/);
  assert.doesNotMatch(App源, /次日达/);
  assert.match(商店组件源, /小时达 · 本时段内送到管理员室/);
  assert.doesNotMatch(商店组件源, /次日达/);
  assert.match(App源, /import ShopPopup from '\.\/components\/商店\.vue';/);
  assert.match(App源, /<ShopPopup[\s\S]{0,200}:open="显示商店"/);
  assert.match(商店源, /本时段内送达/);
  assert.match(商店源, /购买成功立即入包/);
  assert.match(商店源, /不设置配送队列/);
  assert.match(设计源, /小时达/);
  assert.match(设计源, /购买成功立即入包/);
});

test('普通商品购买分支扣款后立即入包，不写配送队列', () => {
  const 普通购买分支 = 商店源.slice(商店源.lastIndexOf('data.现金 -= 配.价格!'));
  assert.match(普通购买分支, /data\.现金 -= 配\.价格!;\s*data\.背包\.push\(道具id\);/);
  assert.match(普通购买分支, /return \{ 成功: true,[^\n]+变动: true \};/);
  assert.doesNotMatch(商店源, /配送队列\s*[=:]|_待配送|_配送中/);
});
