/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 客户端源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 类型源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/types.ts', import.meta.url), 'utf8');

function 截段(源码, 开始标记, 结束标记) {
  const 开始 = 源码.indexOf(开始标记);
  assert.notEqual(开始, -1, `缺少开始标记：${开始标记}`);
  const 结束 = 源码.indexOf(结束标记, 开始);
  assert.notEqual(结束, -1, `缺少结束标记：${结束标记}`);
  return 源码.slice(开始, 结束);
}

// A1:类型已迁入 types.ts；App 段从 读取酒馆原生提示词模块 起，到 打开楼层提示词 结束后的下一函数止
const 提示词入口段 = 截段(客户端源, 'async function 读取酒馆原生提示词模块', '\nfunction 打开首次说明()');

test('酒馆原生提示词模块类型由 types.ts 导出，App 从 ./types 导入', () => {
  assert.match(类型源, /export type 酒馆原生提示词模块 = \{/);
  assert.match(类型源, /promptItemize: \(提示词: unknown\[\], 楼号: number\) => Promise<unknown> \| unknown;/);
  assert.match(类型源, /itemizedPrompts: unknown\[\];/);
  assert.match(客户端源, /import type \{[\s\S]{0,400}酒馆原生提示词模块,\s*\} from '\.\/types';/);
});

test('楼层提示词优先在同源宿主窗口导入原生模块，不依赖消息 DOM', () => {
  assert.match(提示词入口段, /宿主窗口\.eval\(['"]import\(\s*[`'"]\/script\.js[`'"]\s*\)['"]\)/);
  assert.match(
    提示词入口段,
    /原生模块\.promptItemize\(原生模块\.itemizedPrompts, 楼号\)/,
    '应直接复用 SillyTavern 的 promptItemize(itemizedPrompts, mesId)',
  );
  assert.match(提示词入口段, /Array\.isArray\(候选\.itemizedPrompts\)/);
  assert.doesNotMatch(提示词入口段, /酒馆当前没有渲染这一回合的原生消息/);
});

test('原生模块不可用时仍保留 mes_prompt pointerup 兼容路径和全屏往返', () => {
  assert.match(提示词入口段, /入口\.dispatchEvent\(new Pointer事件\('pointerup'/);
  assert.match(提示词入口段, /if \(document\.exitFullscreen\) await document\.exitFullscreen\(\)/);
  assert.match(提示词入口段, /dialog\[open\], \[role="dialog"\], \.popup\[open\]/);
  assert.match(提示词入口段, /void 进真全屏\(\)\.catch/);
});
