/* eslint-disable import-x/no-nodejs-modules -- Node-only prompt snapshot regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  从酒馆原始提示词构造快照,
  构造隔离事件完整提示词快照,
} = require('../../src/人妻公寓/提示词快照.ts');

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 卷轴源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/正文卷轴.vue', import.meta.url), 'utf8');
const 弹窗源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/事件提示词.vue', import.meta.url), 'utf8');
const 隔离引擎源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts', import.meta.url), 'utf8');

test('酒馆 rawPrompt 按最终消息顺序展示角色、名称、预设名和多模态占位，不吞预设 system 段', () => {
  const 快照 = 从酒馆原始提示词构造快照(
    [
      { role: 'system', name: 'main', content: '预设主提示词' },
      { role: 'system', content: [{ type: 'text', text: '世界书内容' }, { type: 'image_url', image_url: { url: 'data:image/png;base64,AAA' } }] },
      { role: 'user', content: '本轮行动' },
    ],
    '玩家当前预设',
  );

  assert.match(快照, /预设：玩家当前预设/);
  assert.match(快照, /SYSTEM · 酒馆最终请求 · main[\s\S]*预设主提示词/);
  assert.match(快照, /SYSTEM · 酒馆最终请求[\s\S]*世界书内容[\s\S]*\[图片输入\]/);
  assert.match(快照, /USER · 酒馆最终请求[\s\S]*本轮行动/);
  assert.doesNotMatch(快照, /base64,AAA/, '图片二进制不得把提示词查看器撑爆');
});

test('独立事件完整快照包含预设前后段、事件系统、线程历史和本拍输入，并保持真实通道顺序', () => {
  const 共同 = {
    预设名: '当前预设',
    前: [{ role: 'system', content: '预设前置' }],
    核心: [
      { role: 'system', content: '事件系统' },
      { role: 'assistant', content: '上一拍历史' },
    ],
    用户输入: '查看102监控',
    后: [{ role: 'system', content: '预设后置' }],
  };

  const 普通 = 构造隔离事件完整提示词快照({ ...共同, 通道: '正文', 用户输入置后: false });
  assert.ok(普通.indexOf('当前预设·前置 1') < 普通.indexOf('事件系统'));
  assert.ok(普通.indexOf('事件系统') < 普通.indexOf('线程历史 1'));
  assert.ok(普通.indexOf('线程历史 1') < 普通.indexOf('本拍输入'));
  assert.ok(普通.indexOf('本拍输入') < 普通.indexOf('当前预设·后置 1'));

  const 推理 = 构造隔离事件完整提示词快照({ ...共同, 通道: '正文', 用户输入置后: true });
  assert.ok(推理.indexOf('当前预设·后置 1') < 推理.indexOf('本拍输入'), 'DeepSeek 实际把 user_input 放在后置段之后');

  const 数据库 = 构造隔离事件完整提示词快照({ ...共同, 通道: '数据库', 用户输入置后: false });
  assert.match(数据库, /生成通道：数据库/);
  assert.match(数据库, /预设：当前预设/);
});

test('长提示词完整保留，不用截断冒充“全部提示词”', () => {
  const 长段 = '长'.repeat(30_000);
  const 快照 = 从酒馆原始提示词构造快照([{ role: 'system', content: 长段 }], '长预设');
  assert.equal((快照.match(/长/g) ?? []).length, 30_001, '标题中的“长预设”占一个长字，其余正文必须逐字保留');
});

test('客户端优先读取对应楼层 rawPrompt 展示完整快照，缺失时仍保留原生 promptItemize 回退', () => {
  assert.match(App源码, /从酒馆原始提示词构造快照/);
  assert.match(App源码, /const 完整提示词 = 从酒馆原始提示词构造快照\(提示词记录\.rawPrompt, 提示词记录\.presetName\)/);
  assert.match(App源码, /事件提示词文本\.value = 完整提示词/);
  assert.match(App源码, /原生模块\.promptItemize\(原生模块\.itemizedPrompts, 楼号\)/, '旧酒馆或缺 rawPrompt 时仍能打开原生拆分');
  assert.match(隔离引擎源码, /构造隔离事件完整提示词快照\(/);
  assert.doesNotMatch(隔离引擎源码, /预设破限段不进 chat 变量/, '新日志不得继续明示排除预设段');
});

test('提示词按钮和完整提示词弹窗使用高对比主题色，触屏不再以灰色透明态显示', () => {
  for (const 源码 of [卷轴源码, App源码]) {
    assert.match(源码, /\.entry-prompt \{[\s\S]*?background:\s*var\(--surface-sheet\)/);
    assert.match(源码, /\.entry-prompt \{[\s\S]*?color:\s*var\(--ink\)/);
    assert.match(源码, /@media \(hover: none\), \(pointer: coarse\) \{[\s\S]*?\.entry-prompt \{[\s\S]*?opacity:\s*1/);
    assert.doesNotMatch(源码, /\.entry-prompt \{[\s\S]{0,420}background:\s*rgba\(255, 255, 255, 0\.74\)/);
  }
  assert.match(弹窗源码, />完 整 提 示 词</);
  assert.match(弹窗源码, /background:\s*var\(--field-bg\)/);
  assert.match(弹窗源码, /color:\s*var\(--field-text\)/);
});
