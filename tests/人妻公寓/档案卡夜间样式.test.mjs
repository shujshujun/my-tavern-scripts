/* eslint-disable import-x/no-nodejs-modules -- Node-only compiled style regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse, compileStyle } from 'vue/compiler-sfc';

test('夜间档案样式编译后仍匹配卡片、头像与孕态子元素，不退化为覆盖整个html', () => {
  const filename = new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url);
  const source = readFileSync(filename, 'utf8');
  const { descriptor } = parse(source);
  const inlineStyle = descriptor.styles.filter(style => !style.src).map(style => style.content).join('\n');
  assert.ok(inlineStyle.includes('.dossier-card'), '读取实际档案样式，不能误测空的外置popup引用');
  const result = compileStyle({ source: inlineStyle, filename: filename.pathname, id: 'data-v-test', scoped: true });
  assert.deepEqual(result.errors, []);
  for (const selector of [
    'html.rq-dark .dossier-card[data-v-test]',
    'html.rq-dark .sheet.dossier[data-v-test]',
    'html.rq-dark .avatar-glyph[data-v-test]',
    'html.rq-dark .sheet.dossier.pregnant .dossier-hero[data-v-test]',
    'html.rq-dark .relation-clue-board[data-v-test]',
    'html.rq-dark .dossier-axes .axis-row.fav[data-v-test]::before',
  ]) assert.ok(result.code.includes(selector), selector);
  assert.doesNotMatch(result.code, /html\.rq-dark(?:\s*,\s*html\.rq-dark)*\s*\{/u, '仅根html上的选择器会丢失原来的组件目标');
});
