/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync('src/人妻公寓/界面/客户端/App.vue', 'utf8');

test('同高透明画布在双人窄槽中不能再因源图宽度不同而缩成不同身高', () => {
  const 槽宽 = 180;
  const 槽高 = 400;
  const 可见高度占比 = 940 / 1024;
  const 旧contain可见高 = (源宽, 源高) => 源高 * Math.min(槽宽 / 源宽, 槽高 / 源高) * 可见高度占比;

  const 宽画布角色旧高度 = 旧contain可见高(551, 1024);
  const 窄画布角色旧高度 = 旧contain可见高(307, 1024);
  assert.ok(窄画布角色旧高度 - 宽画布角色旧高度 > 60, '旧 contain 确会把同场宽画布角色缩矮');

  const 新可见高 = 槽高 * 可见高度占比;
  assert.equal(new Set([新可见高, 新可见高]).size, 1, '图片固定为槽高后，同 alpha 高度的角色肉眼身高一致');
});

test('普通立绘由独立槽裁边并按高度等比缩放，荣耀洞仍使用独立 16:9 坐标', () => {
  assert.match(app, /class="portrait-slot"/);
  assert.match(app, /<span[\s\S]*?class="portrait-slot"[\s\S]*?<img[\s\S]*?class="portrait"/);
  assert.match(app, /\.portrait-slot \{[\s\S]*?overflow: hidden;[\s\S]*?width: var\(--portrait-desktop-width\);[\s\S]*?height: var\(--portrait-desktop-height\);/);
  assert.match(app, /\.portrait \{[\s\S]*?width: auto;[\s\S]*?height: 100%;/);
  assert.doesNotMatch(app, /portrait-count-2 \.portrait[\s\S]{0,180}object-fit: cover/);
  assert.doesNotMatch(app, /portrait-count-3 \.portrait[\s\S]{0,180}object-fit: cover/);
  assert.match(app, /\.portrait-slot-glory \{[\s\S]*?inset: 0;[\s\S]*?width: 100%;[\s\S]*?height: 100%;/);
  assert.match(app, /\.portrait-glory \{[\s\S]*?width: 100%;[\s\S]*?height: 100%;[\s\S]*?object-fit: contain;/);
});
