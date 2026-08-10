/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

function CSS规则(选择器) {
  const 转义选择器 = 选择器.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return App源码.match(new RegExp(`${转义选择器}\\s*\\{([\\s\\S]*?)\\}`))?.[1] ?? '';
}

test('同场非焦点头像保持可辨认的柔和亮环，主焦点使用更强辉光', () => {
  assert.match(
    App源码,
    /在场\.value\.在场\.includes\(m\)\s*\?\s*'ambient'/,
    '同场非焦点角色应继续映射到 ambient，而不是离场 away',
  );

  const 同场头像 = CSS规则('.avatar.ambient .avatar-glyph');
  assert.ok(同场头像, 'ambient 应有独立视觉规则，不能只与 focus 共用去灰规则');
  assert.match(同场头像, /border-color\s*:/, '同场头像应有亮环');
  assert.match(同场头像, /box-shadow\s*:/, '同场头像应有柔和辉光');

  const 深色同场头像 = CSS规则(':global(html.rq-dark) .avatar.ambient .avatar-glyph');
  assert.match(深色同场头像, /border-color\s*:/, '深色主题不能用通用暗边框覆盖同场亮环');
  assert.match(深色同场头像, /box-shadow\s*:/, '深色主题也应保留同场柔和辉光');

  const 焦点头像 = CSS规则('.avatar.focus .avatar-glyph');
  assert.match(焦点头像, /border-color:\s*var\(--pink\)/, '主焦点继续使用明确的粉色亮环');
  assert.match(焦点头像, /box-shadow:\s*0 4px 14px rgba\(255, 79, 154, 0\.4\)/, '主焦点辉光必须强于同场态');
});
